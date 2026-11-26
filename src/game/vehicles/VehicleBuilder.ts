import * as THREE from 'three';
import { VehicleSpec } from '../../types/game';
import { createPlateTexture, createSignboardTexture } from '../materials/ProceduralTextures';

export interface BuiltVehicleModel {
  group: THREE.Group;
  wheels: THREE.Object3D[];
  frontSteerPivots: THREE.Object3D[];
  bodyPaintMaterials: THREE.MeshPhysicalMaterial[];
  brakeLights: THREE.MeshStandardMaterial[];
  headLights: THREE.MeshStandardMaterial[];
  sirenBar?: THREE.MeshStandardMaterial[];
  seatPosition: THREE.Vector3;
  cockpitCameraOffset: THREE.Vector3;
  halfWidth: number;
  halfLength: number;
}

export function buildVehicleModel(spec: VehicleSpec, overrideColor?: string): BuiltVehicleModel {
  const group = new THREE.Group();
  const wheels: THREE.Object3D[] = [];
  const frontSteerPivots: THREE.Object3D[] = [];
  const bodyPaintMaterials: THREE.MeshPhysicalMaterial[] = [];
  const brakeLights: THREE.MeshStandardMaterial[] = [];
  const headLights: THREE.MeshStandardMaterial[] = [];
  const sirenBar: THREE.MeshStandardMaterial[] = [];

  const paintColor = overrideColor ?? spec.color;
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: paintColor,
    metalness: 0.45,
    roughness: 0.28,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
  });
  bodyPaintMaterials.push(paintMat);

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: spec.secondaryColor,
    roughness: 0.5,
    metalness: 0.2,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: '#18181b',
    roughness: 0.65,
    metalness: 0.2,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    metalness: 0.9,
    roughness: 0.15,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#0f172a',
    roughness: 0.08,
    metalness: 0.2,
    transparent: true,
    opacity: 0.65,
    clearcoat: 1,
  });

  const headLightMat = new THREE.MeshStandardMaterial({
    color: '#fef9c3',
    emissive: '#fef08a',
    emissiveIntensity: 0.6,
  });
  headLights.push(headLightMat);

  const brakeLightMat = new THREE.MeshStandardMaterial({
    color: '#991b1b',
    emissive: '#ef4444',
    emissiveIntensity: 0.3,
  });
  brakeLights.push(brakeLightMat);

  const tireMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.85 });

  const createWheel = (radius: number, width: number, x: number, y: number, z: number, isFront: boolean) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    const spinGroup = new THREE.Group();

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 16), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    spinGroup.add(tire);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, width + 0.02, 10),
      chromeMat
    );
    rim.rotation.z = Math.PI / 2;
    spinGroup.add(rim);

    pivot.add(spinGroup);
    group.add(pivot);
    wheels.push(spinGroup);
    if (isFront) frontSteerPivots.push(pivot);
  };

  let halfWidth = 0.95;
  let halfLength = 2.05;
  let seatPosition = new THREE.Vector3(0.38, 0.52, 0.1); // Right-hand drive for Kerala/India!
  let cockpitCameraOffset = new THREE.Vector3(0.38, 1.24, 0.25);

  const plateTex = createPlateTexture(spec.plateNumber, spec.category === 'auto' || spec.category === 'bus' || spec.category === 'truck');
  const plateMat = new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.4 });

  if (spec.category === 'auto') {
    // Iconic Kerala Yellow-Black Auto-Rickshaw (3-wheeler)
    halfWidth = 0.72;
    halfLength = 1.38;
    seatPosition.set(0, 0.48, 0.35);
    cockpitCameraOffset.set(0, 1.32, 0.35);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.55, 2.4), paintMat);
    chassis.position.y = 0.52;
    chassis.castShadow = true;
    group.add(chassis);

    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.62, 0.95, 10), paintMat);
    nose.position.set(0, 0.72, 1.15);
    nose.rotation.x = -0.15;
    group.add(nose);

    // Black canvas roof canopy
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.75, 1.95), secondaryMat);
    canopy.position.set(0, 1.48, -0.15);
    canopy.castShadow = true;
    group.add(canopy);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.55, 0.08), glassMat);
    windshield.position.set(0, 1.25, 0.85);
    windshield.rotation.x = -0.2;
    group.add(windshield);

    // Single front wheel + 2 rear wheels
    createWheel(0.26, 0.16, 0, 0.26, 1.18, true);
    createWheel(0.26, 0.18, -0.64, 0.26, -0.82, false);
    createWheel(0.26, 0.18, 0.64, 0.26, -0.82, false);

    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12), headLightMat);
    hl.rotation.x = Math.PI / 2;
    hl.position.set(0, 0.65, 1.56);
    group.add(hl);
  } else if (spec.category === 'bus') {
    // KSRTC-inspired Red & Cream Kerala Express Bus
    halfWidth = 1.32;
    halfLength = 4.9;
    seatPosition.set(0.75, 1.05, 3.6);
    cockpitCameraOffset.set(0.75, 1.95, 3.85);

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.45, 9.6), paintMat);
    lowerBody.position.y = 1.2;
    lowerBody.castShadow = true;
    group.add(lowerBody);

    const upperCabin = new THREE.Mesh(new THREE.BoxGeometry(2.52, 1.35, 9.5), secondaryMat);
    upperCabin.position.y = 2.55;
    upperCabin.castShadow = true;
    group.add(upperCabin);

    const glassBand = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.88, 8.9), glassMat);
    glassBand.position.y = 2.45;
    group.add(glassBand);

    // Destination board
    const boardTex = createSignboardTexture(
      spec.destinationBoard ?? 'FORT KOCHI - ERNAKULAM',
      'കേരള എക്സ്പ്രസ്',
      '#0f172a',
      '#fef08a',
      '#f59e0b'
    );
    const destBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.42),
      new THREE.MeshBasicMaterial({ map: boardTex })
    );
    destBoard.position.set(0, 3.02, 4.78);
    group.add(destBoard);

    for (const sx of [-0.72, 0.72]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.1), headLightMat);
      hl.position.set(sx, 0.78, 4.82);
      group.add(hl);
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.1), brakeLightMat);
      bl.position.set(sx, 0.85, -4.82);
      group.add(bl);
    }

    createWheel(0.48, 0.3, -1.2, 0.48, 3.0, true);
    createWheel(0.48, 0.3, 1.2, 0.48, 3.0, true);
    createWheel(0.48, 0.36, -1.2, 0.48, -2.8, false);
    createWheel(0.48, 0.36, 1.2, 0.48, -2.8, false);
  } else if (spec.category === 'motorcycle') {
    // Periyar Enfield 350 Motorcycle
    halfWidth = 0.45;
    halfLength = 1.15;
    seatPosition.set(0, 0.62, -0.12);
    cockpitCameraOffset.set(0, 1.35, 0.15);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 1.45), trimMat);
    frame.position.set(0, 0.56, 0);
    frame.castShadow = true;
    group.add(frame);

    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.62), paintMat);
    tank.position.set(0, 0.82, 0.25);
    tank.castShadow = true;
    group.add(tank);

    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.72, 8), chromeMat);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, 0.98, 0.58);
    group.add(handleBar);

    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), headLightMat);
    hl.position.set(0, 0.88, 0.76);
    group.add(hl);

    createWheel(0.34, 0.12, 0, 0.34, 0.78, true);
    createWheel(0.34, 0.14, 0, 0.34, -0.74, false);
  } else if (spec.category === 'boat') {
    // Vembanad Jet Ferry / Speedboat
    halfWidth = 1.25;
    halfLength = 2.8;
    seatPosition.set(0.35, 0.58, 0.1);
    cockpitCameraOffset.set(0.35, 1.45, 0.35);

    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 5.2), paintMat);
    hull.position.y = 0.35;
    hull.castShadow = true;
    group.add(hull);

    const bow = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.6, 4), secondaryMat);
    bow.rotation.x = Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.scale.set(1.2, 1, 0.45);
    bow.position.set(0, 0.45, 3.2);
    group.add(bow);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.95, 2.2), glassMat);
    canopy.position.set(0, 1.1, 0.2);
    group.add(canopy);
  } else {
    // Passenger Cars, SUVs, Police, Ambulance, Truck
    const isTall = spec.category === 'suv' || spec.category === 'police' || spec.category === 'ambulance' || spec.category === 'truck';
    const bodyW = spec.category === 'truck' ? 2.25 : 1.88;
    const bodyL = spec.category === 'truck' ? 5.6 : isTall ? 4.45 : 4.05;
    const bodyH = isTall ? 0.78 : 0.62;
    halfWidth = bodyW / 2;
    halfLength = bodyL / 2;
    seatPosition.set(0.38, isTall ? 0.72 : 0.52, 0.12);
    cockpitCameraOffset.set(0.38, isTall ? 1.52 : 1.24, 0.25);

    // Lower sculpted body
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyL), paintMat);
    chassis.position.y = 0.32 + bodyH / 2;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    // Bumpers
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.06, 0.22, 0.22), trimMat);
    frontBumper.position.set(0, 0.36, bodyL / 2 + 0.04);
    group.add(frontBumper);
    const rearBumper = frontBumper.clone();
    rearBumper.position.z = -bodyL / 2 - 0.04;
    group.add(rearBumper);

    // Cabin / Greenhouse
    if (spec.category === 'truck') {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.08, 1.15, 1.8), paintMat);
      cab.position.set(0, 1.45, bodyL / 2 - 1.0);
      cab.castShadow = true;
      group.add(cab);

      const cargo = new THREE.Mesh(new THREE.BoxGeometry(bodyW, 1.55, 3.4), secondaryMat);
      cargo.position.set(0, 1.65, -1.0);
      cargo.castShadow = true;
      group.add(cargo);
    } else {
      const cabLen = isTall ? bodyL * 0.66 : bodyL * 0.54;
      const cabH = isTall ? 0.72 : 0.56;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.22, cabH, cabLen), paintMat);
      cabin.position.set(0, 0.32 + bodyH + cabH / 2 - 0.04, -0.2);
      cabin.castShadow = true;
      group.add(cabin);

      const glassWrap = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.16, cabH * 0.74, cabLen + 0.06), glassMat);
      glassWrap.position.copy(cabin.position);
      group.add(glassWrap);
    }

    // Police lightbar or Ambulance beacon
    if (spec.category === 'police') {
      const redMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 1.5 });
      const blueMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', emissive: '#3b82f6', emissiveIntensity: 1.5 });
      sirenBar.push(redMat, blueMat);
      const barR = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.24), redMat);
      barR.position.set(-0.28, 1.86, -0.15);
      const barB = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.24), blueMat);
      barB.position.set(0.28, 1.86, -0.15);
      group.add(barR, barB);
    } else if (spec.category === 'ambulance') {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.04, 0.2, bodyL * 0.8), secondaryMat);
      stripe.position.set(0, 0.9, 0);
      group.add(stripe);
      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.16, 0.18, 10),
        new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 1.8 })
      );
      beacon.position.set(0, 1.88, 0.8);
      group.add(beacon);
    }

    // Headlights & Taillights
    for (const sx of [-bodyW * 0.36, bodyW * 0.36]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 0.08), headLightMat);
      hl.position.set(sx, 0.68, bodyL / 2 + 0.03);
      group.add(hl);
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.08), brakeLightMat);
      bl.position.set(sx, 0.72, -bodyL / 2 - 0.03);
      group.add(bl);
    }

    // Kerala Registration Plates (Front & Rear)
    const rearPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.15), plateMat);
    rearPlate.position.set(0, 0.56, -bodyL / 2 - 0.06);
    rearPlate.rotation.y = Math.PI;
    group.add(rearPlate);

    const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.15), plateMat);
    frontPlate.position.set(0, 0.48, bodyL / 2 + 0.16);
    group.add(frontPlate);

    const wheelR = isTall ? 0.38 : 0.33;
    const wheelZ = bodyL * 0.32;
    const wheelX = bodyW * 0.48;
    createWheel(wheelR, 0.24, -wheelX, wheelR, wheelZ, true);
    createWheel(wheelR, 0.24, wheelX, wheelR, wheelZ, true);
    createWheel(wheelR, 0.24, -wheelX, wheelR, -wheelZ, false);
    createWheel(wheelR, 0.24, wheelX, wheelR, -wheelZ, false);
  }

  return {
    group,
    wheels,
    frontSteerPivots,
    bodyPaintMaterials,
    brakeLights,
    headLights,
    sirenBar: sirenBar.length > 0 ? sirenBar : undefined,
    seatPosition,
    cockpitCameraOffset,
    halfWidth,
    halfLength,
  };
}
