import * as THREE from 'three';
import { HumanRig } from './HumanRigBuilder';

export type HumanAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sit'
  | 'talk'
  | 'phone'
  | 'drinkTea'
  | 'greet'
  | 'punch'
  | 'knockdown';

export interface HumanAnimController {
  state: HumanAnimState;
  phase: number;
  blinkTimer: number;
  blinkProgress: number;
  lookYaw: number;
  lookPitch: number;
  talkTimer: number;
}

export function createHumanAnimController(seed = 0): HumanAnimController {
  return {
    state: 'idle',
    phase: seed * 1.7,
    blinkTimer: 1.5 + (seed % 4),
    blinkProgress: 0,
    lookYaw: 0,
    lookPitch: 0,
    talkTimer: 0,
  };
}

export function updateHumanAnimation(
  rig: HumanRig,
  ctrl: HumanAnimController,
  dt: number,
  speedNorm: number, // 0 = idle, 1 = walk, >1.4 = run
  isSeated = false,
  isTalking = false,
  nearPlayerLookTarget: THREE.Vector3 | null = null,
  detailLevel: 'full' | 'medium' | 'lod' = 'full',
  actionOverride: 'none' | 'punch' | 'knockdown' = 'none'
): void {
  // Distance LOD toggle
  if (detailLevel === 'lod') {
    rig.highDetailGroup.visible = false;
    rig.lowDetailProxy.visible = true;
    return;
  }
  rig.highDetailGroup.visible = true;
  rig.lowDetailProxy.visible = false;

  // Determine animation state
  if (actionOverride === 'knockdown') {
    ctrl.state = 'knockdown';
  } else if (actionOverride === 'punch') {
    ctrl.state = 'punch';
  } else if (isSeated) {
    ctrl.state = 'sit';
  } else if (speedNorm > 1.35) {
    ctrl.state = 'run';
  } else if (speedNorm > 0.12) {
    ctrl.state = 'walk';
  } else if (isTalking) {
    ctrl.state = 'talk';
  } else if (rig.appearance.prop === 'phone') {
    ctrl.state = 'phone';
  } else if (rig.appearance.prop === 'teaGlass') {
    ctrl.state = 'drinkTea';
  } else {
    ctrl.state = 'idle';
  }

  const walkCadence =
    rig.appearance.walkStyle === 'elderly'
      ? 5.2
      : rig.appearance.walkStyle === 'brisk'
      ? 8.2
      : 6.8;

  const rate =
    ctrl.state === 'run'
      ? 11.2
      : ctrl.state === 'walk'
      ? walkCadence * Math.max(0.65, speedNorm)
      : 2.0;

  ctrl.phase += dt * rate;
  const p = ctrl.phase;
  const dampLambda = 11;

  // Target joint angles
  let pelvisY = 0.88;
  let pelvisRotX = 0;
  let spineRotX = 0;
  let spineRotY = 0;
  let lHipX = 0;
  let rHipX = 0;
  let lKneeX = 0;
  let rKneeX = 0;
  let lShX = 0;
  let rShX = 0;
  let lShZ = 0.08;
  let rShZ = -0.08;
  let lElbX = -0.15;
  let rElbX = -0.15;

  if (ctrl.state === 'knockdown') {
    pelvisY = 0.2;
    pelvisRotX = -Math.PI * 0.46;
    lHipX = 0.25;
    rHipX = -0.2;
    lKneeX = 0.4;
    rKneeX = 0.55;
    lShX = -1.2;
    rShX = -0.8;
    lShZ = 0.5;
    rShZ = -0.5;
  } else if (ctrl.state === 'punch') {
    spineRotY = -0.45;
    spineRotX = 0.15;
    rShX = -1.48;
    rElbX = -0.1;
    lShX = -0.65;
    lElbX = -1.1;
    lHipX = -0.25;
    rHipX = 0.25;
  } else if (ctrl.state === 'walk') {
    const stride = rig.appearance.walkStyle === 'elderly' ? 0.36 : 0.56;
    const s = Math.sin(p);
    const c = Math.cos(p);
    lHipX = s * stride;
    rHipX = -s * stride;
    lKneeX = Math.max(0, -c * 0.55);
    rKneeX = Math.max(0, c * 0.55);
    lShX = -s * stride * 0.72;
    rShX = s * stride * 0.72;
    lElbX = -0.25 - Math.max(0, s) * 0.25;
    rElbX = -0.25 - Math.max(0, -s) * 0.25;
    pelvisY = 0.88 + Math.abs(c) * 0.025;
    spineRotY = s * 0.06;
    spineRotX = rig.appearance.walkStyle === 'elderly' ? 0.1 : 0.04;
  } else if (ctrl.state === 'run') {
    const s = Math.sin(p);
    const c = Math.cos(p);
    lHipX = s * 0.92;
    rHipX = -s * 0.92;
    lKneeX = Math.max(0, -c * 1.05 + 0.2);
    rKneeX = Math.max(0, c * 1.05 + 0.2);
    lShX = -s * 0.95;
    rShX = s * 0.95;
    lElbX = -1.15;
    rElbX = -1.15;
    pelvisY = 0.86 + Math.abs(c) * 0.055;
    spineRotX = 0.22;
    spineRotY = s * 0.1;
  } else if (ctrl.state === 'sit') {
    pelvisY = 0.44;
    lHipX = -1.42;
    rHipX = -1.42;
    lKneeX = 1.38;
    rKneeX = 1.38;
    lShX = -0.58;
    rShX = -0.58;
    lElbX = -0.55;
    rElbX = -0.55;
    spineRotX = -0.06;
  } else if (ctrl.state === 'talk') {
    const gesture = Math.sin(p * 2.2);
    lShX = -0.35 + gesture * 0.22;
    rShX = -0.55 - gesture * 0.28;
    lElbX = -0.75;
    rElbX = -0.95 + Math.cos(p * 3) * 0.2;
    spineRotY = Math.sin(p * 0.8) * 0.06;
  } else if (ctrl.state === 'phone') {
    rShX = -0.78;
    rElbX = -1.15;
    rShZ = -0.18;
    lShX = -0.1;
    spineRotX = 0.05;
  } else if (ctrl.state === 'drinkTea') {
    const sip = Math.max(0, Math.sin(p * 0.7));
    rShX = -0.35 - sip * 0.45;
    rElbX = -0.7 - sip * 0.65;
  } else {
    // Natural breathing & idle weight shift
    lShZ = 0.07 + Math.sin(p * 0.7) * 0.015;
    rShZ = -0.07 - Math.sin(p * 0.7) * 0.015;
    lElbX = -0.18;
    rElbX = -0.18;
    spineRotY = Math.sin(p * 0.35) * 0.04;
  }

  // Smooth exponential damping on joints
  rig.pelvis.position.y = THREE.MathUtils.damp(rig.pelvis.position.y, pelvisY, dampLambda, dt);
  rig.pelvis.rotation.x = THREE.MathUtils.damp(rig.pelvis.rotation.x, pelvisRotX, dampLambda, dt);
  rig.spine.rotation.x = THREE.MathUtils.damp(rig.spine.rotation.x, spineRotX, dampLambda, dt);
  rig.spine.rotation.y = THREE.MathUtils.damp(rig.spine.rotation.y, spineRotY, dampLambda, dt);

  rig.leftHip.rotation.x = THREE.MathUtils.damp(rig.leftHip.rotation.x, lHipX, dampLambda, dt);
  rig.rightHip.rotation.x = THREE.MathUtils.damp(rig.rightHip.rotation.x, rHipX, dampLambda, dt);
  rig.leftKnee.rotation.x = THREE.MathUtils.damp(rig.leftKnee.rotation.x, lKneeX, dampLambda, dt);
  rig.rightKnee.rotation.x = THREE.MathUtils.damp(rig.rightKnee.rotation.x, rKneeX, dampLambda, dt);

  rig.leftShoulder.rotation.x = THREE.MathUtils.damp(rig.leftShoulder.rotation.x, lShX, dampLambda, dt);
  rig.rightShoulder.rotation.x = THREE.MathUtils.damp(rig.rightShoulder.rotation.x, rShX, dampLambda, dt);
  rig.leftShoulder.rotation.z = THREE.MathUtils.damp(rig.leftShoulder.rotation.z, lShZ, dampLambda, dt);
  rig.rightShoulder.rotation.z = THREE.MathUtils.damp(rig.rightShoulder.rotation.z, rShZ, dampLambda, dt);
  rig.leftElbow.rotation.x = THREE.MathUtils.damp(rig.leftElbow.rotation.x, lElbX, dampLambda, dt);
  rig.rightElbow.rotation.x = THREE.MathUtils.damp(rig.rightElbow.rotation.x, rElbX, dampLambda, dt);

  // Full detail facial animations (< 35m)
  if (detailLevel === 'full') {
    // 1. Natural blinking
    ctrl.blinkTimer -= dt;
    if (ctrl.blinkTimer <= 0) {
      ctrl.blinkProgress += dt * 9.5;
      const blinkAngle =
        ctrl.blinkProgress < 1
          ? THREE.MathUtils.lerp(-0.35, 0.45, Math.sin(ctrl.blinkProgress * Math.PI))
          : -0.35;
      rig.leftEyelid.rotation.x = blinkAngle;
      rig.rightEyelid.rotation.x = blinkAngle;
      if (ctrl.blinkProgress >= 1) {
        ctrl.blinkProgress = 0;
        ctrl.blinkTimer = 2.4 + Math.random() * 3.4;
      }
    }

    // 2. Head & eye tracking toward nearby player or natural scanning
    let targetHeadYaw = Math.sin(p * 0.45) * 0.14;
    let targetHeadPitch = ctrl.state === 'phone' ? 0.25 : Math.sin(p * 0.3) * 0.05;

    if (nearPlayerLookTarget) {
      const dx = nearPlayerLookTarget.x - rig.root.position.x;
      const dz = nearPlayerLookTarget.z - rig.root.position.z;
      const worldAngle = Math.atan2(dx, dz);
      let rel = worldAngle - rig.root.rotation.y;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      if (Math.abs(rel) < 1.25) {
        targetHeadYaw = THREE.MathUtils.clamp(rel * 0.65, -0.55, 0.55);
        targetHeadPitch = 0;
      }
    }

    rig.head.rotation.y = THREE.MathUtils.damp(rig.head.rotation.y, targetHeadYaw, 6, dt);
    rig.head.rotation.x = THREE.MathUtils.damp(rig.head.rotation.x, targetHeadPitch, 6, dt);
    rig.leftEye.rotation.y = targetHeadYaw * 0.35;
    rig.rightEye.rotation.y = targetHeadYaw * 0.35;

    // 3. Lip-sync / jaw articulation while talking
    if (isTalking) {
      ctrl.talkTimer += dt * 15;
      rig.jaw.rotation.x = Math.abs(Math.sin(ctrl.talkTimer)) * 0.24;
    } else {
      rig.jaw.rotation.x = THREE.MathUtils.damp(rig.jaw.rotation.x, 0, 12, dt);
    }
  }
}
