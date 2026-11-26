import * as THREE from 'three';
import { DensityPreset, NpcDialogueSession } from '../../types/game';
import { AABBCollider } from '../world/KeralaWorldBuilder';
import {
  createHumanAnimController,
  HumanAnimController,
  updateHumanAnimation,
} from './HumanAnimator';
import { buildHumanRig, HumanRig } from './HumanRigBuilder';
import {
  generateAmbientKeralaNpcs,
  KERALA_NAMED_NPCS,
  KeralaNpcDefinition,
} from './KeralaPopulationProfiles';

export interface ActiveNpc {
  def: KeralaNpcDefinition;
  rig: HumanRig;
  anim: HumanAnimController;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  targetX: number;
  targetZ: number;
  waitTimer: number;
  speed: number;
  isTalking: boolean;
  knockdownTimer: number;
  fleeTimer: number;
}

const _lookTarget = new THREE.Vector3();

export class NpcManager {
  public npcs: ActiveNpc[] = [];
  private group = new THREE.Group();
  private frameCounter = 0;

  constructor(scene: THREE.Scene) {
    scene.add(this.group);
    this.spawnPopulation();
  }

  private spawnPopulation(): void {
    const baseAmbient = generateAmbientKeralaNpcs(44);
    // Add regional NPCs in Munnar, Alappuzha Kuttanad, and Thiruvananthapuram Secretariat
    const regionalExtras: KeralaNpcDefinition[] = [
      {
        ...baseAmbient[6],
        appearance: { ...baseAmbient[6].appearance, id: 'npc_munnar_1', name: 'Suresh', malayalamName: 'സുരേഷ്', role: 'Tea Estate Worker' },
        homeX: 312,
        homeZ: -236,
        patrolRadius: 20,
      },
      {
        ...baseAmbient[7],
        appearance: { ...baseAmbient[7].appearance, id: 'npc_munnar_2', name: 'Clara', malayalamName: 'ക്ലാര', role: 'Highland Tourist' },
        homeX: 305,
        homeZ: -230,
        patrolRadius: 18,
      },
      {
        ...baseAmbient[6],
        appearance: { ...baseAmbient[6].appearance, id: 'npc_kuttanad_1', name: 'Kuttan', malayalamName: 'കുട്ടൻ', role: 'Kuttanad Boatman' },
        homeX: -252,
        homeZ: 264,
        patrolRadius: 16,
      },
      {
        ...baseAmbient[10],
        appearance: { ...baseAmbient[10].appearance, id: 'npc_tvm_1', name: 'Adv. Rajesh', malayalamName: 'രാജേഷ്', role: 'Secretariat Official' },
        homeX: 55,
        homeZ: 312,
        patrolRadius: 12,
        serviceType: 'govt',
        greetingEn: 'Welcome inside the Thiruvananthapuram Kerala Secretariat Atrium.',
        greetingMl: 'തിരുവനന്തപുരം സെക്രട്ടേറിയറ്റ് ഹാളിലേക്ക് സ്വാഗതം.',
      },
      {
        ...baseAmbient[4],
        appearance: { ...baseAmbient[4].appearance, id: 'npc_tvm_2', name: 'Sreeja', malayalamName: 'ശ്രീജ', role: 'Secretariat Staff' },
        homeX: 52,
        homeZ: 298,
        patrolRadius: 10,
      },
    ];

    const allDefs: KeralaNpcDefinition[] = [
      ...KERALA_NAMED_NPCS,
      ...baseAmbient,
      ...regionalExtras,
    ];

    allDefs.forEach((def, idx) => {
      const rig = buildHumanRig(def.appearance);
      rig.root.position.set(def.homeX, 0, def.homeZ);
      this.group.add(rig.root);

      this.npcs.push({
        def,
        rig,
        anim: createHumanAnimController(idx),
        x: def.homeX,
        y: 0,
        z: def.homeZ,
        vx: 0,
        vy: 0,
        vz: 0,
        yaw: (idx * 1.3) % (Math.PI * 2),
        targetX: def.homeX,
        targetZ: def.homeZ,
        waitTimer: idx % 3,
        speed: 0,
        isTalking: false,
        knockdownTimer: 0,
        fleeTimer: 0,
      });
    });
  }

  public applyImpactToNpc(npc: ActiveNpc, dirX: number, dirZ: number, impulse: number): void {
    const len = Math.hypot(dirX, dirZ) || 1;
    npc.vx = (dirX / len) * impulse;
    npc.vz = (dirZ / len) * impulse;
    npc.vy = Math.min(7.5, impulse * 0.48);
    npc.knockdownTimer = 3.2;
    npc.fleeTimer = 10.0;
    npc.yaw = Math.atan2(-dirX, -dirZ);
  }

  public strikeNearbyNpc(playerPos: THREE.Vector3, playerYaw: number): ActiveNpc | null {
    const fwdX = Math.sin(playerYaw);
    const fwdZ = Math.cos(playerYaw);
    let best: ActiveNpc | null = null;
    let bestD2 = 2.6 * 2.6;

    for (const npc of this.npcs) {
      if (!npc.rig.root.visible || npc.knockdownTimer > 0.5) continue;
      const dx = npc.x - playerPos.x;
      const dz = npc.z - playerPos.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = npc;
      }
    }

    if (best) {
      this.applyImpactToNpc(best, fwdX, fwdZ, 7.5);
    }
    return best;
  }

  private pickNextPatrolTarget(npc: ActiveNpc, colliders: AABBCollider[]): void {
    const r = npc.def.patrolRadius;
    for (let attempt = 0; attempt < 5; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 3 + Math.random() * r;
      const tx = THREE.MathUtils.clamp(npc.def.homeX + Math.cos(angle) * dist, -365, 395);
      const tz = THREE.MathUtils.clamp(npc.def.homeZ + Math.sin(angle) * dist, -385, 395);
      if (!this.hitsCollider(tx, tz, colliders, 1.0)) {
        npc.targetX = tx;
        npc.targetZ = tz;
        return;
      }
    }
    npc.targetX = npc.def.homeX;
    npc.targetZ = npc.def.homeZ;
  }

  private hitsCollider(x: number, z: number, colliders: AABBCollider[], margin = 0.7): boolean {
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (x > c.minX - margin && x < c.maxX + margin && z > c.minZ - margin && z < c.maxZ + margin) {
        return true;
      }
    }
    return false;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    colliders: AABBCollider[],
    density: DensityPreset,
    activeDialogueNpcId: string | null
  ): void {
    this.frameCounter++;
    const maxActiveCount =
      density === 'low' ? 28 : density === 'medium' ? 44 : this.npcs.length;

    _lookTarget.copy(playerPos);

    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      const enabled = i < maxActiveCount;
      npc.rig.root.visible = enabled;
      if (!enabled) continue;

      const dxP = playerPos.x - npc.x;
      const dzP = playerPos.z - npc.z;
      const distSq = dxP * dxP + dzP * dzP;

      npc.isTalking = activeDialogueNpcId === npc.def.appearance.id;

      // Knockback physics update (arcade non-graphic impact)
      if (npc.knockdownTimer > 0) {
        npc.knockdownTimer -= dt;
        npc.x += npc.vx * dt;
        npc.z += npc.vz * dt;
        npc.vx = THREE.MathUtils.damp(npc.vx, 0, 5.5, dt);
        npc.vz = THREE.MathUtils.damp(npc.vz, 0, 5.5, dt);
        if (npc.y > 0 || npc.vy > 0) {
          npc.y += npc.vy * dt;
          npc.vy -= 18 * dt;
          if (npc.y <= 0) {
            npc.y = 0;
            npc.vy = 0;
          }
        }
        npc.rig.root.position.set(npc.x, npc.y, npc.z);
        npc.rig.root.rotation.y = npc.yaw;
        updateHumanAnimation(npc.rig, npc.anim, dt, 0, false, false, null, 'full', 'knockdown');
        continue;
      }

      // Distance culling & LOD tiering
      let detailLevel: 'full' | 'medium' | 'lod' = 'full';
      if (distSq > 95 * 95) {
        detailLevel = 'lod';
      } else if (distSq > 38 * 38) {
        detailLevel = 'medium';
      }

      if (detailLevel === 'lod' && (this.frameCounter + i) % 4 !== 0) continue;
      if (detailLevel === 'medium' && (this.frameCounter + i) % 2 !== 0) continue;

      if (npc.fleeTimer > 0) {
        npc.fleeTimer -= dt;
        const fleeDist = Math.sqrt(distSq) || 1;
        const fdx = -dxP / fleeDist;
        const fdz = -dzP / fleeDist;
        npc.speed = 4.2;
        const nextX = npc.x + fdx * npc.speed * dt;
        const nextZ = npc.z + fdz * npc.speed * dt;
        if (!this.hitsCollider(nextX, nextZ, colliders, 0.75)) {
          npc.x = nextX;
          npc.z = nextZ;
        }
        npc.yaw = Math.atan2(fdx, fdz);
      } else if (npc.isTalking) {
        npc.yaw = Math.atan2(dxP, dzP);
        npc.speed = 0;
      } else if (npc.def.routine === 'stationary') {
        npc.speed = 0;
        if (distSq < 10 * 10) {
          const faceYaw = Math.atan2(dxP, dzP);
          let diff = faceYaw - npc.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          npc.yaw += diff * Math.min(1, dt * 3);
        }
      } else {
        const tx = npc.targetX - npc.x;
        const tz = npc.targetZ - npc.z;
        const distToTarget = Math.hypot(tx, tz);

        if (distToTarget < 1.2) {
          npc.speed = 0;
          npc.waitTimer -= dt;
          if (npc.waitTimer <= 0) {
            this.pickNextPatrolTarget(npc, colliders);
            npc.waitTimer = 1.5 + Math.random() * 4;
          }
        } else {
          const walkBase =
            npc.def.appearance.walkStyle === 'elderly'
              ? 1.15
              : npc.def.appearance.walkStyle === 'brisk'
              ? 1.85
              : 1.48;
          npc.speed = walkBase;

          let dirX = tx / distToTarget;
          let dirZ = tz / distToTarget;

          for (let j = 0; j < maxActiveCount; j++) {
            if (i === j) continue;
            const other = this.npcs[j];
            const sx = npc.x - other.x;
            const sz = npc.z - other.z;
            const d2 = sx * sx + sz * sz;
            if (d2 > 0.001 && d2 < 2.2) {
              const d = Math.sqrt(d2);
              dirX += (sx / d) * (1.5 - d) * 1.4;
              dirZ += (sz / d) * (1.5 - d) * 1.4;
            }
          }

          if (distSq > 0.01 && distSq < 2.0) {
            const dp = Math.sqrt(distSq);
            dirX -= (dxP / dp) * 1.2;
            dirZ -= (dzP / dp) * 1.2;
          }

          const len = Math.hypot(dirX, dirZ) || 1;
          dirX /= len;
          dirZ /= len;

          const nextX = npc.x + dirX * npc.speed * dt;
          const nextZ = npc.z + dirZ * npc.speed * dt;

          if (!this.hitsCollider(nextX, nextZ, colliders, 0.75)) {
            npc.x = nextX;
            npc.z = nextZ;
            const targetYaw = Math.atan2(dirX, dirZ);
            let diff = targetYaw - npc.yaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            npc.yaw += diff * Math.min(1, dt * 7);
          } else {
            this.pickNextPatrolTarget(npc, colliders);
          }
        }
      }

      npc.rig.root.position.set(npc.x, 0, npc.z);
      npc.rig.root.rotation.y = npc.yaw;

      const speedNorm = npc.speed / 1.5;
      updateHumanAnimation(
        npc.rig,
        npc.anim,
        detailLevel === 'medium' ? dt * 2 : dt,
        speedNorm,
        false,
        npc.isTalking,
        distSq < 18 * 18 ? _lookTarget : null,
        detailLevel,
        'none'
      );
    }
  }

  public findClosestInteractableNpc(playerPos: THREE.Vector3, maxDist = 4.2): NpcDialogueSession | null {
    let best: ActiveNpc | null = null;
    let bestD2 = maxDist * maxDist;
    for (const npc of this.npcs) {
      if (!npc.rig.root.visible || npc.knockdownTimer > 0) continue;
      const dx = playerPos.x - npc.x;
      const dz = playerPos.z - npc.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = npc;
      }
    }
    if (!best) return null;
    return {
      npcId: best.def.appearance.id,
      name: best.def.appearance.name,
      malayalamName: best.def.appearance.malayalamName,
      role: best.def.appearance.role,
      greetingEn: best.def.greetingEn,
      greetingMl: best.def.greetingMl,
      serviceType: best.def.serviceType,
      nearbyMissionId: best.def.nearbyMissionId,
    };
  }
}
