import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { WORLD_LOCATIONS } from '../data/keralaWorldData';
import { useGameStore } from '../store/gameStore';
import { HumanAppearance, MinimapEntity } from '../types/game';
import { AudioEngine } from './audio/AudioEngine';
import {
  createHumanAnimController,
  HumanAnimController,
  updateHumanAnimation,
} from './humans/HumanAnimator';
import { buildHumanRig, HumanRig } from './humans/HumanRigBuilder';
import { NpcManager } from './humans/NpcManager';
import { createWeatherAndTimeSystem, WeatherAndTimeHandle } from './systems/WeatherAndTimeSystem';
import { DrivingInput, SimVehicle, VehicleSimulation } from './vehicles/VehicleSimulation';
import { AABBCollider, buildKeralaWorld, KeralaWorldHandles } from './world/KeralaWorldBuilder';

export interface MobileInputState {
  moveX: number; // -1..1
  moveY: number; // -1..1 (forward positive)
  lookDeltaX: number;
  lookDeltaY: number;
  handbrake: boolean;
  sprint: boolean;
}

const _camTarget = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _playerVec = new THREE.Vector3();
const _seatWorld = new THREE.Vector3();

export class InfinityCityEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private frameId = 0;
  private disposed = false;

  private clock = new THREE.Clock();
  private world: KeralaWorldHandles;
  private weatherTime: WeatherAndTimeHandle;
  private npcManager: NpcManager;
  private vehicleSim: VehicleSimulation;
  private audio = new AudioEngine();

  private playerRig: HumanRig;
  private playerAnim: HumanAnimController;
  private playerPos = new THREE.Vector3(-64, 0, 58);
  private playerVelY = 0;
  private playerYaw = Math.PI;
  private isGrounded = true;

  private activeVehicle: SimVehicle | null = null;
  private isRidingTrain = false;
  private punchTimer = 0;
  private cameraShake = 0;
  private cameraYaw = 0;
  private cameraPitch = 0.28;
  private isDraggingLook = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  private keys: Record<string, boolean> = {};
  public mobileInput: MobileInputState = {
    moveX: 0,
    moveY: 0,
    lookDeltaX: 0,
    lookDeltaY: 0,
    handbrake: false,
    sprint: false,
  };

  private missionBeacon: THREE.Group;
  private impactParticles: Array<{
    mesh: THREE.Mesh;
    vx: number;
    vy: number;
    vz: number;
    life: number;
  }> = [];
  private telemetryTimer = 0;
  private lastTeleportNonce = 0;
  private lastSpawnVehicleNonce = 0;
  private lastExitNonce = 0;
  private lastAppearanceSignature = '';

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Detect software WebGL cleanly from GPU renderer string
    this.isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2') || probe.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Modern Three.js WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      65,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.15,
      620
    );

    // 4. Studio Environment Reflections (PMREM RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const maxAnisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    // 5. Build World, Weather, Vehicles & Kerala Human Population
    this.weatherTime = createWeatherAndTimeSystem(this.scene, this.isSoftwareGl);
    this.world = buildKeralaWorld(this.scene, maxAnisotropy);
    this.npcManager = new NpcManager(this.scene);
    this.vehicleSim = new VehicleSimulation(this.scene);

    // 6. Build Main Player Character
    const initialAppearance = useGameStore.getState().playerAppearance;
    this.lastAppearanceSignature = this.appearanceKey(initialAppearance);
    this.playerRig = buildHumanRig(initialAppearance);
    this.playerRig.root.position.copy(this.playerPos);
    this.scene.add(this.playerRig.root);
    this.playerAnim = createHumanAnimController(1);

    // 7. 3D Mission Target Beacon
    this.missionBeacon = new THREE.Group();
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 28, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color: '#f59e0b',
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    beam.position.y = 14;
    const baseRing = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 3.2, 28),
      new THREE.MeshBasicMaterial({ color: '#f59e0b', side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
    );
    baseRing.rotation.x = -Math.PI / 2;
    baseRing.position.y = 0.1;
    this.missionBeacon.add(beam, baseRing);
    this.missionBeacon.visible = false;
    this.scene.add(this.missionBeacon);

    // 8. Pooled Impact Burst Particles (stylized dust & spark burst on impacts)
    const puffGeo = new THREE.SphereGeometry(0.18, 6, 6);
    const puffMatLight = new THREE.MeshBasicMaterial({ color: '#fde68a', transparent: true, opacity: 0.85 });
    const puffMatDust = new THREE.MeshBasicMaterial({ color: '#e2e8f0', transparent: true, opacity: 0.75 });
    for (let i = 0; i < 24; i++) {
      const mesh = new THREE.Mesh(puffGeo, i % 2 === 0 ? puffMatLight : puffMatDust);
      mesh.visible = false;
      this.scene.add(mesh);
      this.impactParticles.push({ mesh, vx: 0, vy: 0, vz: 0, life: 0 });
    }

    // Pre-warm shaders on hardware GPUs
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.startLoop();
  }

  private spawnImpactBurst(x: number, y: number, z: number, intensity = 1): void {
    let spawned = 0;
    for (const p of this.impactParticles) {
      if (p.life <= 0) {
        p.mesh.visible = true;
        p.mesh.position.set(x, y, z);
        const angle = (spawned / 10) * Math.PI * 2 + Math.random() * 0.5;
        const speed = (2.2 + Math.random() * 3.8) * intensity;
        p.vx = Math.cos(angle) * speed;
        p.vz = Math.sin(angle) * speed;
        p.vy = 2.0 + Math.random() * 3.2;
        p.life = 0.55;
        p.mesh.scale.setScalar(0.8 + Math.random() * 0.8);
        spawned++;
        if (spawned >= 10) break;
      }
    }
  }

  private updateImpactParticles(dt: number): void {
    for (const p of this.impactParticles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.mesh.visible = false;
        continue;
      }
      p.vy -= 12 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y = Math.max(0.1, p.mesh.position.y + p.vy * dt);
      p.mesh.position.z += p.vz * dt;
      p.mesh.scale.setScalar(Math.max(0.1, p.life * 2.2));
    }
  }

  private appearanceKey(a: HumanAppearance): string {
    return `${a.gender}_${a.skinTone}_${a.hairStyle}_${a.hairColor}_${a.outfit}_${a.primaryColor}_${a.facialHair}_${a.glasses}_${a.sunglasses}`;
  }

  private rebuildPlayerRigIfNeeded(): void {
    const app = useGameStore.getState().playerAppearance;
    const sig = this.appearanceKey(app);
    if (sig === this.lastAppearanceSignature) return;
    this.lastAppearanceSignature = sig;

    const wasInVehicle = !!this.activeVehicle;
    this.scene.remove(this.playerRig.root);
    this.playerRig = buildHumanRig(app);
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.y = this.playerYaw;
    if (wasInVehicle && this.activeVehicle?.spec.category === 'bus') {
      this.playerRig.root.visible = false;
    }
    this.scene.add(this.playerRig.root);
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('webglcontextlost', this.onContextLost);
  }

  private onContextLost = (e: Event) => {
    e.preventDefault();
  };

  private onResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onPointerDown = (e: PointerEvent) => {
    this.audio.resume();
    if (e.button === 0 || e.button === 2) {
      this.isDraggingLook = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isDraggingLook) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.cameraYaw -= dx * 0.0055;
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch + dy * 0.004, -0.15, 1.05);
  };

  private onPointerUp = () => {
    this.isDraggingLook = false;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
    this.audio.resume();
    const store = useGameStore.getState();

    if (e.code === 'Escape') {
      if (store.activeModal !== 'none') {
        store.setActiveModal('none');
      } else if (store.phase === 'playing') {
        store.setPhase('paused');
      } else if (store.phase === 'paused') {
        store.setPhase('playing');
      }
      return;
    }

    if (store.phase !== 'playing' || store.activeModal !== 'none') return;

    if (e.code === 'KeyE') {
      this.triggerEnterExitVehicle();
    } else if (e.code === 'KeyF') {
      this.triggerInteraction();
    } else if (e.code === 'KeyJ') {
      this.triggerMeleePunch();
    } else if (e.code === 'KeyC') {
      store.cycleCameraMode();
    } else if (e.code === 'KeyM') {
      store.setActiveModal('map');
    } else if (e.code === 'KeyH') {
      if (this.activeVehicle) {
        this.audio.playHorn(this.activeVehicle.spec.category);
      } else if (this.isRidingTrain) {
        this.audio.playTrainHorn();
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  public triggerMeleePunch(): void {
    const store = useGameStore.getState();
    if (this.activeVehicle || this.isRidingTrain || store.phase !== 'playing' || store.activeModal !== 'none') {
      return;
    }
    if (this.punchTimer > 0.08) return;
    this.punchTimer = 0.38;

    const hitNpc = this.npcManager.strikeNearbyNpc(this.playerPos, this.playerYaw);
    if (hitNpc) {
      this.spawnImpactBurst(hitNpc.x, 1.1, hitNpc.z, 0.9);
      this.audio.playImpact(0.95);
      this.cameraShake = Math.max(this.cameraShake, 0.24);
      store.escalateWanted('Street Altercation', 1);
    } else {
      this.audio.playImpact(0.32);
    }
  }

  public triggerEnterExitVehicle(): void {
    const store = useGameStore.getState();

    // Exit moving/stopped Kerala Express Train
    if (this.isRidingTrain) {
      const ts = this.world.trainState;
      this.isRidingTrain = false;
      this.playerPos.set(ts.x - 3.4, 0, ts.z - 6);
      this.playerRig.root.visible = true;
      this.playerRig.root.position.copy(this.playerPos);
      this.audio.playChime('click');
      store.updateTelemetry({ inTrain: false, speedKmh: 0 });
      store.pushNotification('Exited Kerala Express', 'Disembarked safely from the passenger coach.', 'info');
      return;
    }

    if (this.activeVehicle) {
      // Exit vehicle cleanly onto left/right door side
      const exitSide = this.activeVehicle.spec.isWatercraft ? 0 : -2.2;
      const cosY = Math.cos(this.activeVehicle.yaw);
      const sinY = Math.sin(this.activeVehicle.yaw);
      const ex = this.activeVehicle.x + cosY * exitSide;
      const ez = this.activeVehicle.z - sinY * exitSide;

      // If exiting boat, place on jetty/shore if near water edge
      const safeX = this.activeVehicle.spec.isWatercraft ? Math.max(-188, ex) : ex;

      this.activeVehicle.isPlayerDriven = false;
      this.activeVehicle.speed *= 0.25;
      this.activeVehicle = null;

      this.playerPos.set(safeX, 0, ez);
      this.playerRig.root.visible = true;
      this.playerRig.root.position.copy(this.playerPos);
      this.audio.playChime('click');
      store.updateTelemetry({ inVehicle: false, speedKmh: 0, gearLabel: 'N' });
      return;
    }

    // Check if near Kerala Express Coach 1 to board!
    const ts = this.world.trainState;
    if (
      Math.abs(this.playerPos.x - ts.x) < 6.4 &&
      Math.abs(this.playerPos.z - (ts.z - 6)) < 11.5
    ) {
      this.isRidingTrain = true;
      this.cameraYaw = Math.PI * 0.82;
      this.audio.playTrainHorn();
      store.updateTelemetry({
        inTrain: true,
        currentLocationName: 'Kerala Express · Passenger Coach',
      });
      store.pushNotification(
        'Boarded Kerala Express',
        'Riding between Ernakulam Junction & Thiruvananthapuram Central. Press E to exit.',
        'success'
      );
      return;
    }

    const nearbyVeh = this.vehicleSim.findClosestEnterableVehicle(this.playerPos, 4.8);
    if (nearbyVeh) {
      nearbyVeh.isAiTraffic = false;
      nearbyVeh.isPlayerDriven = true;
      this.activeVehicle = nearbyVeh;
      this.cameraYaw = nearbyVeh.yaw + Math.PI;
      this.audio.playChime('click');
      store.updateTelemetry({
        inVehicle: true,
        currentVehicleName: nearbyVeh.spec.modelName,
        currentVehiclePlate: nearbyVeh.spec.plateNumber,
        currentVehicleCategory: nearbyVeh.spec.category,
      });
    }
  }

  public triggerInteraction(): void {
    if (this.activeVehicle || this.isRidingTrain) return;
    const store = useGameStore.getState();

    // 1. Check nearby NPC
    const npcSession = this.npcManager.findClosestInteractableNpc(this.playerPos, 4.2);
    if (npcSession) {
      this.audio.playChime('click');
      store.openDialogue(npcSession);
      return;
    }

    // 2. Check nearby World Location portal
    for (const loc of WORLD_LOCATIONS) {
      const dist = Math.hypot(this.playerPos.x - loc.x, this.playerPos.z - loc.z);
      if (dist <= loc.radius) {
        this.audio.playChime('click');
        if (loc.type === 'garage') {
          store.setActiveModal('garage');
        } else if (loc.type === 'home') {
          this.audio.playChime('success');
          void store.saveHomeCheckpoint('prop_tharavadu');
        } else if (loc.type === 'mansion') {
          if (store.ownedPropertyIds.includes('prop_pearl_mansion') && dist < 8.5) {
            this.audio.playChime('success');
            void store.saveHomeCheckpoint('prop_pearl_mansion');
          } else {
            store.setActiveModal('properties');
          }
        } else if (loc.id === 'munnar_tea_estates') {
          store.healPlayer(25, 40);
        } else if (loc.type === 'shop') {
          store.openDialogue({
            npcId: 'portal_shop',
            name: loc.name,
            malayalamName: loc.malayalamName,
            role: 'Kerala Bakery & Tea Stall',
            greetingEn: 'Hot Chai & Pazham Pori served fresh!',
            greetingMl: 'ചൂട് ചായയും പഴംപൊരിയും ഇവിടെ ലഭിക്കും.',
            serviceType: 'teaShop',
          });
        } else if (loc.type === 'hospital') {
          store.openDialogue({
            npcId: 'portal_hospital',
            name: loc.name,
            malayalamName: loc.malayalamName,
            role: 'Emergency Medical Center',
            greetingEn: 'Welcome to Hospital Reception. Restore health or start an Ambulance shift.',
            greetingMl: 'ആശുപത്രി റിസപ്ഷനിലേക്ക് സ്വാഗതം.',
            serviceType: 'hospital',
            nearbyMissionId: 'mission_ambulance_108',
          });
        } else if (loc.type === 'police') {
          store.openDialogue({
            npcId: 'portal_police',
            name: loc.name,
            malayalamName: loc.malayalamName,
            role: 'Traffic Police Desk',
            greetingEn: 'Clear unpaid e-Challans and review Kerala traffic regulations.',
            greetingMl: 'ട്രാഫിക് പിഴകൾ ഇവിടെ അടയ്ക്കാവുന്നതാണ്.',
            serviceType: 'police',
          });
        } else if (loc.type === 'railway') {
          store.openDialogue({
            npcId: 'portal_rail',
            name: loc.name,
            malayalamName: loc.malayalamName,
            role: 'Indian Railways Counter',
            greetingEn: 'Purchase train tickets across Kerala from Kasaragod to Thiruvananthapuram.',
            greetingMl: 'കേരളത്തിലെ വിവിധ സ്റ്റേഷനുകളിലേക്കുള്ള ട്രെയിൻ ടിക്കറ്റുകൾ.',
            serviceType: 'railway',
          });
        } else if (loc.type === 'airport') {
          store.openDialogue({
            npcId: 'portal_air',
            name: loc.name,
            malayalamName: loc.malayalamName,
            role: 'Air Terminal Check-In',
            greetingEn: 'Check in for fast regional flights across Kerala airports.',
            greetingMl: 'വിമാന ടിക്കറ്റ് ചെക്ക്-ഇൻ കൗണ്ടർ.',
            serviceType: 'airport',
          });
        } else if (loc.type === 'jetty') {
          store.openDialogue({
            npcId: 'portal_boat',
            name: loc.name,
            malayalamName: loc.malayalamName,
            role: 'Water Metro Ferry Dock',
            greetingEn: 'Board coastal & backwater ferries across Kerala waterways.',
            greetingMl: 'വാട്ടർ മെട്രോ ബോട്ട് സർവീസ് കൗണ്ടർ.',
            serviceType: 'boat',
          });
        } else if (loc.type === 'busstand') {
          store.openDialogue({
            npcId: 'portal_bus',
            name: loc.name,
            malayalamName: loc.malayalamName,
            role: 'KSRTC Bus Counter',
            greetingEn: 'Board Express buses across Kerala districts or start a bus route shift.',
            greetingMl: 'ബസ് യാത്രാ ടിക്കറ്റ് കൗണ്ടർ.',
            serviceType: 'bus',
            nearbyMissionId: 'mission_bus_route',
          });
        } else if (loc.type === 'govt') {
          store.openDialogue({
            npcId: 'portal_govt',
            name: loc.name,
            malayalamName: loc.malayalamName,
            role: 'District Collectorate & RTO',
            greetingEn: 'Public Administration & Vehicle Registration Center.',
            greetingMl: 'ജില്ലാ കളക്ടറേറ്റ് & ആർ.ടി.ഒ.',
            serviceType: 'govt',
            nearbyMissionId: 'mission_airport_vip',
          });
        }
        return;
      }
    }
  }

  private resolvePlayerBuildingCollision(x: number, z: number, colliders: AABBCollider[]): { x: number; z: number } {
    let rx = THREE.MathUtils.clamp(x, -365, 415);
    let rz = THREE.MathUtils.clamp(z, -385, 395);
    const radius = 0.55;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      const cx = THREE.MathUtils.clamp(rx, c.minX, c.maxX);
      const cz = THREE.MathUtils.clamp(rz, c.minZ, c.maxZ);
      const dx = rx - cx;
      const dz = rz - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < radius * radius) {
        const d = Math.sqrt(d2) || 0.001;
        rx += (dx / d) * (radius - d);
        rz += (dz / d) * (radius - d);
      }
    }
    return { x: rx, z: rz };
  }

  private handlePendingStoreCommands(): void {
    const store = useGameStore.getState();

    if (store.pendingTeleport && store.pendingTeleport.nonce !== this.lastTeleportNonce) {
      this.lastTeleportNonce = store.pendingTeleport.nonce;
      if (this.activeVehicle) {
        this.activeVehicle.isPlayerDriven = false;
        this.activeVehicle = null;
      }
      this.isRidingTrain = false;
      this.playerRig.root.visible = true;
      this.playerPos.set(store.pendingTeleport.x, 0, store.pendingTeleport.z);
      this.playerRig.root.position.copy(this.playerPos);
      store.updateTelemetry({ inVehicle: false, inTrain: false, speedKmh: 0 });
    }

    if (store.pendingSpawnVehicle && store.pendingSpawnVehicle.nonce !== this.lastSpawnVehicleNonce) {
      this.lastSpawnVehicleNonce = store.pendingSpawnVehicle.nonce;
      const sx = this.playerPos.x + Math.sin(this.playerYaw) * 5.5;
      const sz = this.playerPos.z + Math.cos(this.playerYaw) * 5.5;
      this.vehicleSim.spawnCustomPlayerVehicle(
        store.pendingSpawnVehicle.specId,
        store.pendingSpawnVehicle.color,
        sx,
        sz,
        this.playerYaw
      );
    }

    if (store.pendingExitVehicleNonce !== this.lastExitNonce) {
      this.lastExitNonce = store.pendingExitVehicleNonce;
      if (this.activeVehicle) this.triggerEnterExitVehicle();
    }
  }

  private startLoop(): void {
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (this.disposed) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.getElapsedTime();
      this.stepSimulation(dt, elapsed);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private stepSimulation(dt: number, elapsed: number): void {
    const store = useGameStore.getState();
    this.audio.setEnabled(store.audioEnabled);
    this.rebuildPlayerRigIfNeeded();
    this.handlePendingStoreCommands();

    // Update look from mobile touch swipe if any
    if (this.mobileInput.lookDeltaX !== 0 || this.mobileInput.lookDeltaY !== 0) {
      this.cameraYaw -= this.mobileInput.lookDeltaX * 0.006;
      this.cameraPitch = THREE.MathUtils.clamp(
        this.cameraPitch + this.mobileInput.lookDeltaY * 0.005,
        -0.15,
        1.05
      );
      this.mobileInput.lookDeltaX = 0;
      this.mobileInput.lookDeltaY = 0;
    }

    // Weather, Time, World & Particle updates
    const envState = this.weatherTime.update(
      dt,
      elapsed,
      this.playerPos,
      store.timePeriod,
      store.weather,
      this.isSoftwareGl
    );
    this.world.updateDynamicWorld(dt, elapsed, envState.isNight, envState.wetness);
    this.updateImpactParticles(dt);
    this.punchTimer = Math.max(0, this.punchTimer - dt);
    this.cameraShake = Math.max(0, this.cameraShake - dt * 2.8);
    this.audio.updateRain(store.phase === 'playing' ? envState.rainIntensity : 0);

    // On Main Menu: gentle scenic orbit around Fort Kochi & Player
    if (store.phase === 'menu') {
      this.npcManager.update(dt, this.playerPos, this.world.colliders, store.npcDensity, null);
      this.vehicleSim.update(
        dt,
        elapsed,
        { throttle: 0, steer: 0, handbrake: false },
        this.world.colliders,
        this.world.trafficSignals,
        this.npcManager,
        envState.wetness,
        envState.isNight,
        0,
        this.playerPos,
        () => {},
        () => {}
      );
      const angle = elapsed * 0.14;
      _camDesired.set(
        this.playerPos.x + Math.sin(angle) * 24,
        11.5,
        this.playerPos.z + Math.cos(angle) * 24
      );
      this.camera.position.lerp(_camDesired, 0.08);
      this.camera.lookAt(this.playerPos.x + 8, 2.5, this.playerPos.z - 8);
      this.audio.updateEngine(false, 0, '');
      return;
    }

    if (store.phase === 'paused' || store.activeModal !== 'none') {
      this.audio.updateEngine(false, 0, '');
      return;
    }

    // Gameplay Inputs
    const fwdInput =
      (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
      (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0) +
      this.mobileInput.moveY;
    const steerInput =
      (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0) -
      (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
      this.mobileInput.moveX;
    const handbrake = !!this.keys['Space'] || this.mobileInput.handbrake;
    const sprint = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'] || this.mobileInput.sprint;

    let playerSpeedNorm = 0;

    if (this.isRidingTrain) {
      // Riding seated inside Kerala Express Coach 1
      const ts = this.world.trainState;
      this.playerPos.set(ts.seatWorldPos.x, ts.seatWorldPos.y - 0.35, ts.seatWorldPos.z);
      this.playerYaw = 0;
      this.playerRig.root.visible = store.cameraMode !== 'first-person';
      this.playerRig.root.position.copy(this.playerPos);
      this.playerRig.root.rotation.y = this.playerYaw;
      updateHumanAnimation(this.playerRig, this.playerAnim, dt, 0, true, false, null, 'full');
      this.audio.updateEngine(false, 0, '');
    } else if (!this.activeVehicle) {
      // On-foot player character movement relative to cameraYaw
      const moveZ = THREE.MathUtils.clamp(fwdInput, -1, 1);
      const moveX = THREE.MathUtils.clamp(-steerInput, -1, 1);
      const mag = Math.hypot(moveX, moveZ);

      if (mag > 0.08) {
        const moveSpeed = sprint ? 6.8 : 3.4;
        const inputAngle = Math.atan2(moveX, moveZ);
        // Camera looks from behind at (sin(cameraYaw), cos(cameraYaw)) -> forward is ( -sin(cameraYaw), -cos(cameraYaw) )
        const worldDirAngle = this.cameraYaw + Math.PI + inputAngle;
        const dx = Math.sin(worldDirAngle) * moveSpeed * dt;
        const dz = Math.cos(worldDirAngle) * moveSpeed * dt;

        const resolved = this.resolvePlayerBuildingCollision(
          this.playerPos.x + dx,
          this.playerPos.z + dz,
          this.world.colliders
        );
        this.playerPos.x = resolved.x;
        this.playerPos.z = resolved.z;

        // Smooth character turning
        let diff = worldDirAngle - this.playerYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.playerYaw += diff * Math.min(1, dt * 11);

        playerSpeedNorm = sprint ? 1.85 : 1.0;
      }

      // Jump physics
      if (this.keys['Space'] && this.isGrounded) {
        this.playerVelY = 6.2;
        this.isGrounded = false;
      }
      if (!this.isGrounded) {
        this.playerVelY -= 17.5 * dt;
        this.playerPos.y += this.playerVelY * dt;
        if (this.playerPos.y <= 0) {
          this.playerPos.y = 0;
          this.playerVelY = 0;
          this.isGrounded = true;
        }
      }

      this.playerRig.root.visible = true;
      this.playerRig.root.position.copy(this.playerPos);
      this.playerRig.root.rotation.y = this.playerYaw;
      updateHumanAnimation(
        this.playerRig,
        this.playerAnim,
        dt,
        playerSpeedNorm,
        false,
        false,
        null,
        'full',
        this.punchTimer > 0 ? 'punch' : 'none'
      );
      this.audio.updateEngine(false, 0, '');
    } else {
      // Driving vehicle
      this.audio.updateEngine(true, this.activeVehicle.speed * 3.6, this.activeVehicle.spec.category);

      // Position seated player inside vehicle
      _seatWorld.copy(this.activeVehicle.model.seatPosition);
      _seatWorld.applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.activeVehicle.yaw);
      this.playerPos.set(
        this.activeVehicle.x + _seatWorld.x,
        this.activeVehicle.y + _seatWorld.y - 0.42,
        this.activeVehicle.z + _seatWorld.z
      );
      this.playerYaw = this.activeVehicle.yaw;

      const isCockpit = store.cameraMode === 'first-person';
      this.playerRig.root.visible = !isCockpit && this.activeVehicle.spec.category !== 'bus';
      this.playerRig.root.position.copy(this.playerPos);
      this.playerRig.root.rotation.y = this.playerYaw;
      updateHumanAnimation(this.playerRig, this.playerAnim, dt, 0, true, false, null, 'full');
    }

    // Update Vehicles, Police Patrol/Pursuit & AI Traffic
    const vehicleInput: DrivingInput = this.activeVehicle
      ? {
          throttle: THREE.MathUtils.clamp(fwdInput, -1, 1),
          steer: THREE.MathUtils.clamp(steerInput, -1, 1),
          handbrake,
        }
      : { throttle: 0, steer: 0, handbrake: false };

    this.vehicleSim.update(
      dt,
      elapsed,
      vehicleInput,
      this.world.colliders,
      this.world.trafficSignals,
      this.npcManager,
      envState.wetness,
      envState.isNight,
      store.wantedLevel,
      this.playerPos,
      (reason, mlReason, amount) => {
        this.audio.playChime('alert');
        store.issueTrafficFine(reason, mlReason, amount);
      },
      (hitNpc, impactSpeed, hitX, hitZ) => {
        this.spawnImpactBurst(hitX, 1.0, hitZ, Math.min(1.8, impactSpeed * 0.14));
        this.audio.playImpact(Math.min(1.6, impactSpeed * 0.12));
        this.cameraShake = Math.max(this.cameraShake, Math.min(0.65, impactSpeed * 0.045));
        store.escalateWanted(`Pedestrian Collision (${hitNpc.def.appearance.name})`, 1);
      }
    );

    // Update Kerala NPCs
    this.npcManager.update(
      dt,
      this.playerPos,
      this.world.colliders,
      store.npcDensity,
      store.activeDialogue?.npcId ?? null
    );

    // Active Mission Tracking & 3D Beacon
    if (store.activeMission) {
      const m = store.activeMission;
      this.missionBeacon.visible = true;
      this.missionBeacon.position.set(m.mission.targetX, 0, m.mission.targetZ);
      const distToTarget = Math.hypot(
        this.playerPos.x - m.mission.targetX,
        this.playerPos.z - m.mission.targetZ
      );
      if (distToTarget < 10) {
        this.audio.playChime('success');
        store.completeActiveMission();
      } else {
        const nextTime = m.timeRemaining - dt;
        if (nextTime <= 0) {
          this.audio.playChime('alert');
          store.failActiveMission('Time expired before reaching destination.');
        } else {
          store.updateTelemetry({
            activeMission: {
              ...m,
              timeRemaining: nextTime,
            },
          });
        }
      }
    } else {
      this.missionBeacon.visible = false;
    }

    // Smooth Camera Update (Third-Person / First-Person / Cinematic)
    this.updateCamera(dt, store.cameraMode);

    // Sync HUD telemetry at ~10 Hz
    this.telemetryTimer += dt;
    if (this.telemetryTimer >= 0.1) {
      this.telemetryTimer = 0;
      this.syncHudTelemetry();
    }
  }

  private applyShakeOffset(): void {
    if (this.cameraShake > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 0.7;
    }
  }

  private updateCamera(dt: number, mode: 'third-person' | 'first-person' | 'cinematic'): void {
    if (this.isRidingTrain) {
      const ts = this.world.trainState;
      if (mode === 'first-person') {
        _camDesired.set(ts.seatWorldPos.x, ts.seatWorldPos.y + 0.9, ts.seatWorldPos.z);
        _camTarget.set(
          _camDesired.x - Math.sin(this.cameraYaw) * 14,
          _camDesired.y - Math.sin(this.cameraPitch) * 6,
          _camDesired.z - Math.cos(this.cameraYaw) * 14
        );
        this.camera.position.copy(_camDesired);
        this.camera.lookAt(_camTarget);
      } else {
        const dist = mode === 'cinematic' ? 24 : 16;
        _camDesired.set(
          ts.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * dist,
          Math.max(2.5, 4.5 + Math.sin(this.cameraPitch) * dist * 0.45),
          ts.z - 4 + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * dist
        );
        _camTarget.set(ts.x, 2.2, ts.z - 5);
        this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camDesired.x, 8, dt);
        this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camDesired.y, 8, dt);
        this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camDesired.z, 8, dt);
        this.camera.lookAt(_camTarget);
      }
      return;
    }

    if (this.activeVehicle) {
      if (!this.isDraggingLook) {
        // Gently align behind vehicle heading when driving
        const desiredYaw = this.activeVehicle.yaw + Math.PI;
        let diff = desiredYaw - this.cameraYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.cameraYaw += diff * Math.min(1, dt * 3.2);
      }

      if (mode === 'first-person') {
        _camDesired.copy(this.activeVehicle.model.cockpitCameraOffset);
        _camDesired.applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.activeVehicle.yaw);
        _camDesired.x += this.activeVehicle.x;
        _camDesired.y += this.activeVehicle.y;
        _camDesired.z += this.activeVehicle.z;

        _camTarget.set(
          _camDesired.x + Math.sin(this.activeVehicle.yaw) * 18,
          _camDesired.y - 0.3,
          _camDesired.z + Math.cos(this.activeVehicle.yaw) * 18
        );
        this.camera.position.copy(_camDesired);
        this.applyShakeOffset();
        this.camera.lookAt(_camTarget);
        return;
      }

      const dist = mode === 'cinematic' ? 11.5 : this.activeVehicle.spec.category === 'bus' ? 12 : 7.4;
      const height = mode === 'cinematic' ? 4.4 : 2.9;
      _camDesired.set(
        this.activeVehicle.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * dist,
        Math.max(1.2, this.activeVehicle.y + height + Math.sin(this.cameraPitch) * dist * 0.5),
        this.activeVehicle.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * dist
      );
      _camTarget.set(this.activeVehicle.x, this.activeVehicle.y + 1.35, this.activeVehicle.z);

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camDesired.x, 9, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camDesired.y, 9, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camDesired.z, 9, dt);
      this.applyShakeOffset();
      this.camera.lookAt(_camTarget);

      // Subtle FOV widening at high speed
      const speedKmh = Math.abs(this.activeVehicle.speed) * 3.6;
      const targetFov = THREE.MathUtils.clamp(64 + speedKmh * 0.12, 64, 82);
      if (Math.abs(this.camera.fov - targetFov) > 0.2) {
        this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 5, dt);
        this.camera.updateProjectionMatrix();
      }
      return;
    }

    // On-foot camera
    if (mode === 'first-person') {
      _camDesired.set(this.playerPos.x, this.playerPos.y + 1.62, this.playerPos.z);
      _camTarget.set(
        this.playerPos.x - Math.sin(this.cameraYaw) * 12,
        this.playerPos.y + 1.62 - Math.sin(this.cameraPitch) * 6,
        this.playerPos.z - Math.cos(this.cameraYaw) * 12
      );
      this.camera.position.copy(_camDesired);
      this.applyShakeOffset();
      this.camera.lookAt(_camTarget);
    } else {
      const dist = mode === 'cinematic' ? 7.2 : 4.8;
      _camDesired.set(
        this.playerPos.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * dist,
        Math.max(0.8, this.playerPos.y + 1.9 + Math.sin(this.cameraPitch) * dist * 0.55),
        this.playerPos.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * dist
      );
      _camTarget.set(this.playerPos.x, this.playerPos.y + 1.35, this.playerPos.z);

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camDesired.x, 12, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camDesired.y, 12, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camDesired.z, 12, dt);
      this.applyShakeOffset();
      this.camera.lookAt(_camTarget);
    }

    if (Math.abs(this.camera.fov - 64) > 0.2) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 64, 6, dt);
      this.camera.updateProjectionMatrix();
    }
  }

  private syncHudTelemetry(): void {
    const store = useGameStore.getState();

    // Determine contextual interaction prompt
    let prompt: string | null = null;
    const ts = this.world.trainState;
    if (this.isRidingTrain) {
      prompt = ts.isStoppedAtStation
        ? `Press E · Exit Train at ${ts.stationName}`
        : 'Press E · Exit Kerala Express (H Horn)';
    } else if (this.activeVehicle) {
      prompt = `Press E · Exit ${this.activeVehicle.spec.modelName}`;
    } else if (
      Math.abs(this.playerPos.x - ts.x) < 6.4 &&
      Math.abs(this.playerPos.z - (ts.z - 6)) < 11.5
    ) {
      prompt = 'Press E · Board Kerala Express Train';
    } else {
      const veh = this.vehicleSim.findClosestEnterableVehicle(this.playerPos, 4.8);
      if (veh) {
        prompt = `Press E · Enter ${veh.spec.modelName}`;
      } else {
        const npc = this.npcManager.findClosestInteractableNpc(this.playerPos, 4.2);
        if (npc) {
          prompt = `Press F · Talk to ${npc.name} (${npc.role})`;
        } else {
          for (const loc of WORLD_LOCATIONS) {
            const d = Math.hypot(this.playerPos.x - loc.x, this.playerPos.z - loc.z);
            if (d <= loc.radius && loc.interactPrompt) {
              prompt = `${loc.interactPrompt} (${loc.name})`;
              break;
            }
          }
        }
      }
    }

    // Build minimap entities list
    const entities: MinimapEntity[] = [];
    for (const loc of WORLD_LOCATIONS) {
      entities.push({ x: loc.x, z: loc.z, type: 'location', label: loc.name });
    }
    for (const v of this.vehicleSim.vehicles) {
      if (v.isPlayerDriven) continue;
      entities.push({
        x: v.x,
        z: v.z,
        type: v.spec.category === 'police' ? 'police' : 'vehicle',
      });
    }
    for (let i = 0; i < this.npcManager.npcs.length; i += 2) {
      const n = this.npcManager.npcs[i];
      if (n.rig.root.visible) {
        entities.push({ x: n.x, z: n.z, type: 'npc' });
      }
    }
    if (store.activeMission) {
      entities.push({
        x: store.activeMission.mission.targetX,
        z: store.activeMission.mission.targetZ,
        type: 'mission',
      });
    }

    const speedKmh = this.isRidingTrain
      ? Math.round(ts.speed * 3.6)
      : this.activeVehicle
      ? Math.round(Math.abs(this.activeVehicle.speed) * 3.6)
      : 0;
    const gearLabel = !this.activeVehicle
      ? 'N'
      : this.activeVehicle.speed < -0.5
      ? 'R'
      : speedKmh < 2
      ? 'N'
      : speedKmh < 25
      ? '1'
      : speedKmh < 55
      ? '2'
      : speedKmh < 85
      ? '3'
      : '4';

    // Friendly local neighborhood / Kerala region name
    let areaName = 'Fort Kochi · Ernakulam';
    if (this.isRidingTrain) {
      areaName = ts.isStoppedAtStation ? `Kerala Express · ${ts.stationName}` : 'Kerala Express · Rail Corridor';
    } else if (this.playerPos.x > 195 && this.playerPos.z < -280) {
      areaName = 'Wayanad Hairpin Ghats';
    } else if (this.playerPos.x > 240 && this.playerPos.z < -170) {
      areaName = 'Munnar Tea Estates · Idukki';
    } else if (this.playerPos.z < -180 && this.playerPos.x < 120) {
      areaName = 'Thrissur Swaraj Heritage';
    } else if (this.playerPos.x < -175 && this.playerPos.z > 180) {
      areaName = 'Alappuzha Kuttanad Islands';
    } else if (this.playerPos.x < -80 && this.playerPos.z > 300) {
      areaName = 'Kovalam Lighthouse Coast';
    } else if (this.playerPos.z > 235) {
      areaName = 'Thiruvananthapuram Secretariat';
    } else if (this.playerPos.x > 65) {
      areaName = 'Ernakulam Junction · Station Rd';
    } else if (this.playerPos.x < -145) {
      areaName = 'Fort Kochi Beach · Arabian Sea';
    } else if (this.playerPos.z > 95) {
      areaName = 'Vembanad Backwater Estates';
    } else if (this.playerPos.z < -70) {
      areaName = 'Collectorate & NH-66 North';
    }

    store.updateTelemetry({
      playerPos: {
        x: this.playerPos.x,
        y: this.playerPos.y,
        z: this.playerPos.z,
        yaw: this.playerYaw,
      },
      inTrain: this.isRidingTrain,
      speedKmh,
      gearLabel,
      interactionPrompt: prompt,
      currentLocationName: areaName,
      minimapEntities: entities,
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);

    this.weatherTime.dispose();
    this.audio.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
