import * as THREE from 'three';
import { VEHICLE_CATALOG } from '../../data/keralaWorldData';
import { VehicleSpec } from '../../types/game';
import { ActiveNpc, NpcManager } from '../humans/NpcManager';
import { AABBCollider, TrafficSignalNode } from '../world/KeralaWorldBuilder';
import { buildVehicleModel, BuiltVehicleModel } from './VehicleBuilder';

export interface SimVehicle {
  uid: string;
  spec: VehicleSpec;
  model: BuiltVehicleModel;
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  steerAngle: number;
  wheelRotation: number;
  isPlayerDriven: boolean;
  isAiTraffic: boolean;
  isPolicePursuit: boolean;
  loopIndex?: number;
  waypointIdx?: number;
}

export interface DrivingInput {
  throttle: number;
  steer: number;
  handbrake: boolean;
}

const TRAFFIC_LOOPS: Array<Array<{ x: number; z: number }>> = [
  // Loop 0: Central NH-66 & Ernakulam Avenue
  [
    { x: -3.4, z: -99.4 },
    { x: 93.4, z: -99.4 },
    { x: 93.4, z: 91.4 },
    { x: -3.4, z: 91.4 },
  ],
  // Loop 1: Coastal Marine Drive Loop
  [
    { x: -123.4, z: -92.6 },
    { x: -123.4, z: 84.6 },
    { x: 3.4, z: 84.6 },
    { x: 3.4, z: -92.6 },
  ],
  // Loop 2: Extended Kerala Highway (Thrissur -> NH-66 -> Trivandrum Secretariat)
  [
    { x: -3.4, z: -210 },
    { x: 3.4, z: -210 },
    { x: 3.4, z: 275 },
    { x: -3.4, z: 275 },
  ],
];

export class VehicleSimulation {
  public vehicles: SimVehicle[] = [];
  private group = new THREE.Group();
  private fineCooldown = 0;

  constructor(scene: THREE.Scene) {
    scene.add(this.group);
    this.spawnInitialWorldVehicles();
  }

  private spawnVehicle(
    spec: VehicleSpec,
    x: number,
    z: number,
    yaw: number,
    isAiTraffic = false,
    isPolicePursuit = false,
    loopIndex = 0,
    waypointIdx = 0,
    overrideColor?: string
  ): SimVehicle {
    const model = buildVehicleModel(spec, overrideColor);
    const y = spec.isWatercraft ? -0.15 : 0;
    model.group.position.set(x, y, z);
    model.group.rotation.y = yaw;
    this.group.add(model.group);

    const sim: SimVehicle = {
      uid: `veh_${spec.id}_${Math.random().toString(36).slice(2, 7)}`,
      spec,
      model,
      x,
      y,
      z,
      yaw,
      speed: 0,
      steerAngle: 0,
      wheelRotation: 0,
      isPlayerDriven: false,
      isAiTraffic,
      isPolicePursuit,
      loopIndex,
      waypointIdx,
    };
    this.vehicles.push(sim);
    return sim;
  }

  public spawnCustomPlayerVehicle(specId: string, color: string | undefined, x: number, z: number, yaw: number): SimVehicle | null {
    const spec = VEHICLE_CATALOG.find((v) => v.id === specId);
    if (!spec) return null;
    const spawnX = spec.isWatercraft ? -206 : x;
    const spawnZ = spec.isWatercraft ? 18 : z;
    return this.spawnVehicle(spec, spawnX, spawnZ, yaw, false, false, 0, 0, color);
  }

  private spawnInitialWorldVehicles(): void {
    const byId = (id: string) => VEHICLE_CATALOG.find((v) => v.id === id)!;

    // Starter & hub vehicles
    this.spawnVehicle(byId('kaveri_hatch'), -58, 66, Math.PI / 2);
    this.spawnVehicle(byId('malabar_auto'), 10, 10, Math.PI);
    this.spawnVehicle(byId('venad_bus'), 24, 9, -Math.PI / 2);
    this.spawnVehicle(byId('periyar_bike'), -16, 15, Math.PI * 0.75);
    this.spawnVehicle(byId('ambulance_van'), 52, -36, Math.PI);
    this.spawnVehicle(byId('sahyadri_suv'), -22, -100, 0);
    this.spawnVehicle(byId('vembanad_boat'), -205, 22, Math.PI);
    // Extra boat in Alappuzha Kuttanad Backwater
    this.spawnVehicle(byId('vembanad_boat'), -205, 250, -Math.PI / 2);
    // Extra SUV at Munnar Tea Estate & Secretariat
    this.spawnVehicle(byId('sahyadri_suv'), 302, -238, Math.PI);
    this.spawnVehicle(byId('kaveri_hatch'), 38, 285, Math.PI / 2);

    // MULTIPLE KERALA POLICE INTERCEPTOR CARS (Parked + Active Patrol Fleet)
    this.spawnVehicle(byId('police_suv'), -52, -36, Math.PI / 2); // Police HQ parked
    this.spawnVehicle(byId('police_suv'), -60, -36, Math.PI / 2); // Police HQ 2nd unit
    this.spawnVehicle(byId('police_suv'), 3.4, -40, 0, true, true, 1, 3); // Patrol Unit 1
    this.spawnVehicle(byId('police_suv'), 93.4, 20, Math.PI, true, true, 0, 2); // Patrol Unit 2
    this.spawnVehicle(byId('police_suv'), -123.4, -30, 0, true, true, 1, 1); // Patrol Unit 3
    this.spawnVehicle(byId('police_suv'), -3.4, 150, Math.PI, true, true, 2, 3); // Highway Unit 4
    this.spawnVehicle(byId('police_suv'), 3.4, -145, 0, true, true, 2, 1); // Thrissur Unit 5

    // Live Left-Hand AI Traffic
    const aiSpecs = ['kaveri_hatch', 'malabar_auto', 'sahyadri_suv', 'venad_bus', 'malanad_truck', 'periyar_bike', 'kaveri_hatch', 'malabar_auto', 'sahyadri_suv', 'venad_bus'];
    for (let i = 0; i < aiSpecs.length; i++) {
      const loopIdx = i % TRAFFIC_LOOPS.length;
      const loop = TRAFFIC_LOOPS[loopIdx];
      const wpIdx = i % loop.length;
      const p = loop[wpIdx];
      const next = loop[(wpIdx + 1) % loop.length];
      const yaw = Math.atan2(next.x - p.x, next.z - p.z);
      this.spawnVehicle(byId(aiSpecs[i]), p.x, p.z, yaw, true, false, loopIdx, (wpIdx + 1) % loop.length);
    }
  }

  public findClosestEnterableVehicle(pos: THREE.Vector3, maxDist = 4.5): SimVehicle | null {
    let best: SimVehicle | null = null;
    let bestD2 = maxDist * maxDist;
    for (const v of this.vehicles) {
      const dx = pos.x - v.x;
      const dz = pos.z - v.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = v;
      }
    }
    return best;
  }

  private resolveBuildingCollisions(v: SimVehicle, colliders: AABBCollider[]): boolean {
    let collided = false;
    const r = Math.max(v.model.halfWidth, v.model.halfLength * 0.68);
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      const closestX = THREE.MathUtils.clamp(v.x, c.minX, c.maxX);
      const closestZ = THREE.MathUtils.clamp(v.z, c.minZ, c.maxZ);
      const dx = v.x - closestX;
      const dz = v.z - closestZ;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        collided = true;
        const d = Math.sqrt(d2) || 0.001;
        const push = r - d;
        v.x += (dx / d) * push;
        v.z += (dz / d) * push;
        v.speed *= -0.28;
      }
    }
    return collided;
  }

  public update(
    dt: number,
    elapsed: number,
    input: DrivingInput,
    colliders: AABBCollider[],
    trafficSignals: TrafficSignalNode[],
    npcManager: NpcManager,
    wetness: number,
    isNight: boolean,
    wantedLevel: number,
    playerPos: THREE.Vector3,
    onTrafficViolation: (reason: string, mlReason: string, amount: number) => void,
    onNpcHitByVehicle: (npc: ActiveNpc, impactSpeed: number, hitX: number, hitZ: number) => void
  ): SimVehicle | null {
    this.fineCooldown = Math.max(0, this.fineCooldown - dt);
    let activePlayerVehicle: SimVehicle | null = null;

    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];

      if (v.isPlayerDriven) {
        activePlayerVehicle = v;
        this.updatePlayerVehicle(v, dt, input, wetness, colliders);

        // Check Vehicle-to-NPC Impact (stylized knockback + wanted alert!)
        const absSpeed = Math.abs(v.speed);
        if (absSpeed > 3.2 && !v.spec.isWatercraft) {
          const hitRadius = v.model.halfWidth + 0.7;
          for (let n = 0; n < npcManager.npcs.length; n++) {
            const npc = npcManager.npcs[n];
            if (!npc.rig.root.visible || npc.knockdownTimer > 1.0) continue;
            const dx = npc.x - v.x;
            const dz = npc.z - v.z;
            if (dx * dx + dz * dz < hitRadius * hitRadius) {
              npcManager.applyImpactToNpc(npc, dx, dz, Math.min(18, 6 + absSpeed * 0.75));
              v.speed *= 0.86;
              onNpcHitByVehicle(npc, absSpeed, npc.x, npc.z);
            }
          }
        }

        // Traffic Violation Checks
        if (!v.spec.isWatercraft && !v.spec.isEmergency && this.fineCooldown <= 0) {
          const speedKmh = absSpeed * 3.6;
          for (const sig of trafficSignals) {
            const distToSig = Math.hypot(v.x - sig.x, v.z - sig.z);
            if (distToSig < 13 && speedKmh > 78) {
              this.fineCooldown = 20;
              onTrafficViolation(`Speeding at junction (${Math.round(speedKmh)} km/h)`, 'അമിത വേഗത', 1500);
              break;
            }
            if (distToSig < 8.5 && speedKmh > 38) {
              const fwdX = Math.sin(v.yaw);
              const fwdZ = Math.cos(v.yaw);
              const movingNS = Math.abs(fwdZ) > Math.abs(fwdX);
              const isRed = (movingNS && !sig.nsGreen) || (!movingNS && sig.nsGreen);
              if (isRed) {
                this.fineCooldown = 22;
                onTrafficViolation('Red Traffic Signal Violation', 'സിഗ്നൽ ലംഘനം', 2000);
                break;
              }
            }
          }
        }
      } else if (v.isAiTraffic) {
        this.updateAiVehicle(v, dt, trafficSignals, wantedLevel, playerPos, colliders);
      }

      if (v.model.sirenBar) {
        const flash = Math.floor(elapsed * 8) % 2 === 0;
        const activeSiren = v.isPolicePursuit && (wantedLevel > 0 || v.isPlayerDriven);
        v.model.sirenBar[0].emissiveIntensity = activeSiren ? (flash ? 3.8 : 0.2) : 0.3;
        v.model.sirenBar[1].emissiveIntensity = activeSiren ? (!flash ? 3.8 : 0.2) : 0.3;
      }
      for (const hl of v.model.headLights) {
        hl.emissiveIntensity = isNight || v.isPlayerDriven ? 1.8 : 0.35;
      }

      v.model.group.position.set(v.x, v.y, v.z);
      v.model.group.rotation.y = v.yaw;
      if (v.spec.isWatercraft) {
        v.model.group.position.y = -0.15 + Math.sin(elapsed * 2.2 + i) * 0.08;
        v.model.group.rotation.z = Math.sin(elapsed * 1.6 + i) * 0.03 - v.steerAngle * 0.12;
      } else {
        v.model.group.rotation.z = THREE.MathUtils.damp(
          v.model.group.rotation.z,
          -v.steerAngle * Math.min(1, Math.abs(v.speed) / 14) * 0.06,
          8,
          dt
        );
      }

      v.wheelRotation += v.speed * dt * 2.4;
      for (const w of v.model.wheels) {
        w.rotation.x = v.wheelRotation;
      }
      for (const p of v.model.frontSteerPivots) {
        p.rotation.y = v.steerAngle;
      }
    }

    // Inter-vehicle collision separation
    for (let i = 0; i < this.vehicles.length; i++) {
      const a = this.vehicles[i];
      for (let j = i + 1; j < this.vehicles.length; j++) {
        const b = this.vehicles[j];
        if (a.spec.isWatercraft !== b.spec.isWatercraft) continue;
        const minSep = a.model.halfWidth + b.model.halfWidth + 0.55;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const d2 = dx * dx + dz * dz;
        if (d2 > 0.001 && d2 < minSep * minSep) {
          const d = Math.sqrt(d2);
          const overlap = (minSep - d) * 0.5;
          const nx = dx / d;
          const nz = dz / d;
          a.x -= nx * overlap;
          a.z -= nz * overlap;
          b.x += nx * overlap;
          b.z += nz * overlap;
          a.speed *= 0.6;
          b.speed *= 0.6;
        }
      }
    }

    return activePlayerVehicle;
  }

  private updatePlayerVehicle(
    v: SimVehicle,
    dt: number,
    input: DrivingInput,
    wetness: number,
    colliders: AABBCollider[]
  ): void {
    const maxSpeedMs = v.spec.maxSpeedKmh / 3.6;
    const gripFactor = 1 - wetness * 0.25;

    if (input.handbrake) {
      v.speed = THREE.MathUtils.damp(v.speed, 0, 5.5 * gripFactor, dt);
    } else if (input.throttle > 0.05) {
      v.speed += v.spec.acceleration * input.throttle * dt;
    } else if (input.throttle < -0.05) {
      if (v.speed > 1.2) {
        v.speed -= v.spec.braking * Math.abs(input.throttle) * dt;
      } else {
        v.speed += v.spec.acceleration * 0.55 * input.throttle * dt;
      }
    } else {
      v.speed = THREE.MathUtils.damp(v.speed, 0, 1.4, dt);
    }

    v.speed = THREE.MathUtils.clamp(v.speed, -maxSpeedMs * 0.35, maxSpeedMs);

    const braking = input.handbrake || (input.throttle < -0.05 && v.speed > 0.5);
    for (const bl of v.model.brakeLights) {
      bl.emissiveIntensity = braking ? 2.8 : 0.35;
    }

    const targetSteer = input.steer * 0.48;
    v.steerAngle = THREE.MathUtils.damp(v.steerAngle, targetSteer, 9, dt);

    if (Math.abs(v.speed) > 0.25) {
      const dirSign = v.speed >= 0 ? 1 : -1;
      const turnRate = v.spec.handling * v.steerAngle * gripFactor * Math.min(1, Math.abs(v.speed) / 5);
      v.yaw += turnRate * dirSign * dt;
    }

    v.x += Math.sin(v.yaw) * v.speed * dt;
    v.z += Math.cos(v.yaw) * v.speed * dt;

    if (v.spec.isWatercraft) {
      v.x = THREE.MathUtils.clamp(v.x, -420, -175);
      v.z = THREE.MathUtils.clamp(v.z, -240, 390);
    } else {
      v.x = THREE.MathUtils.clamp(v.x, -365, 415);
      v.z = THREE.MathUtils.clamp(v.z, -385, 405);
      this.resolveBuildingCollisions(v, colliders);
    }
  }

  private updateAiVehicle(
    v: SimVehicle,
    dt: number,
    trafficSignals: TrafficSignalNode[],
    wantedLevel: number,
    playerPos: THREE.Vector3,
    colliders: AABBCollider[]
  ): void {
    // Active multi-unit Police Pursuit when wantedLevel > 0
    if (v.isPolicePursuit && wantedLevel > 0) {
      const dx = playerPos.x - v.x;
      const dz = playerPos.z - v.z;
      const dist = Math.hypot(dx, dz);
      const targetYaw = Math.atan2(dx, dz);
      let diff = targetYaw - v.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      v.steerAngle = THREE.MathUtils.clamp(diff, -0.5, 0.5);
      v.yaw += diff * Math.min(1, dt * 2.8);
      const targetSpeed = dist > 9.5 ? Math.min(26, 15 + wantedLevel * 2.2) : 0;
      v.speed = THREE.MathUtils.damp(v.speed, targetSpeed, 3.2, dt);
      v.x += Math.sin(v.yaw) * v.speed * dt;
      v.z += Math.cos(v.yaw) * v.speed * dt;
      this.resolveBuildingCollisions(v, colliders);
      return;
    }

    const loop = TRAFFIC_LOOPS[v.loopIndex ?? 0];
    const wp = loop[v.waypointIdx ?? 0];
    const dx = wp.x - v.x;
    const dz = wp.z - v.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 4.5) {
      v.waypointIdx = ((v.waypointIdx ?? 0) + 1) % loop.length;
    }

    const targetYaw = Math.atan2(dx, dz);
    let diff = targetYaw - v.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    v.steerAngle = THREE.MathUtils.clamp(diff * 0.6, -0.4, 0.4);
    v.yaw += diff * Math.min(1, dt * 3.8);

    let mustStop = false;
    for (const sig of trafficSignals) {
      const dSig = Math.hypot(v.x - sig.x, v.z - sig.z);
      if (dSig > 10 && dSig < 20) {
        const fwdX = Math.sin(v.yaw);
        const fwdZ = Math.cos(v.yaw);
        const movingNS = Math.abs(fwdZ) > Math.abs(fwdX);
        if ((movingNS && !sig.nsGreen) || (!movingNS && sig.nsGreen)) {
          mustStop = true;
          break;
        }
      }
    }

    const dPlayer = Math.hypot(playerPos.x - v.x, playerPos.z - v.z);
    if (dPlayer < 10) mustStop = true;

    const cruiseSpeed = v.spec.category === 'bus' || v.spec.category === 'truck' ? 8.5 : 11.5;
    v.speed = THREE.MathUtils.damp(v.speed, mustStop ? 0 : cruiseSpeed, mustStop ? 6 : 2.5, dt);

    for (const bl of v.model.brakeLights) {
      bl.emissiveIntensity = mustStop ? 2.4 : 0.3;
    }

    v.x += Math.sin(v.yaw) * v.speed * dt;
    v.z += Math.cos(v.yaw) * v.speed * dt;
  }
}
