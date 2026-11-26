import * as THREE from 'three';
import { WORLD_LOCATIONS } from '../../data/keralaWorldData';
import {
  createSignboardTexture,
  getAsphaltTexture,
  getGrassPaddyTexture,
  getMangaloreTileTexture,
  getSidewalkTexture,
} from '../materials/ProceduralTextures';

export interface AABBCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  isSolid: boolean;
}

export interface TrafficSignalNode {
  x: number;
  z: number;
  nsGreen: boolean;
  nsRedMat: THREE.MeshStandardMaterial;
  nsGreenMat: THREE.MeshStandardMaterial;
  ewRedMat: THREE.MeshStandardMaterial;
  ewGreenMat: THREE.MeshStandardMaterial;
}

export interface TrainState {
  x: number;
  z: number;
  speed: number;
  seatWorldPos: THREE.Vector3;
  isStoppedAtStation: boolean;
  stationName: string;
}

export interface AnimatedAircraft {
  group: THREE.Group;
  baseX: number;
  baseZ: number;
  phaseOffset: number;
}

export interface KeralaWorldHandles {
  colliders: AABBCollider[];
  trafficSignals: TrafficSignalNode[];
  streetLampBulbs: THREE.MeshStandardMaterial[];
  oceanMesh: THREE.Mesh;
  trainGroup: THREE.Group;
  trainState: TrainState;
  roadMaterial: THREE.MeshStandardMaterial;
  aircraftList: AnimatedAircraft[];
  updateDynamicWorld: (dt: number, elapsed: number, isNight: boolean, wetness: number) => void;
}

/**
 * Authoritative water-area check across Kerala coastline, Vembanad Backwaters,
 * Eastern Canal, and Malampuzha Reservoir so land vehicles & pedestrians cannot drive/walk into water,
 * while boats stay strictly on water.
 */
export function isWaterAt(x: number, z: number): boolean {
  // 1. Fort Kochi Boat Jetty dock plank (-196..-162, 12..24) is walkable
  if (x >= -196 && x <= -162 && z >= 12 && z <= 24) return false;

  // 2. Kuttanad Bridge (z: 262..278, x: -245..-115) & Islands
  if (x >= -250 && x <= -112 && z >= 262 && z <= 278) return false;
  if (x >= -312 && x <= -198 && z >= 222 && z <= 318) return false; // Island 1
  if (x >= -332 && x <= -248 && z >= 330 && z <= 400) return false; // Island 2

  // 3. Southern Coastal Highway corridor (x: -148..-90, z: 165..385) + Kollam/Kovalam land
  if (x >= -150 && x <= -85 && z >= 165 && z <= 388) return false;

  // 4. Arabian Sea (West: x < -190)
  if (x < -190) return true;

  // 5. Vembanad & Kuttanad Backwater Lake (x: -190..-48, z: 168..425)
  if (x >= -190 && x <= -48 && z >= 168 && z <= 425) return true;

  // 6. Eastern Backwater Canal (x: -48..420, z: 174..210) minus bridges
  if (x > -48 && x < 420 && z >= 174 && z <= 210) {
    // Bridges at x=0 (NH-66), x=90 (Kottayam Link), x=136 (Railway)
    if (Math.abs(x) <= 13 || Math.abs(x - 90) <= 11 || Math.abs(x - 136) <= 6) {
      return false;
    }
    return true;
  }

  // 7. Malampuzha Dam Reservoir (Palakkad x: 205..268, z: -158..-122)
  if (x >= 205 && x <= 268 && z >= -158 && z <= -122) return true;

  return false;
}

function addWallCollider(
  colliders: AABBCollider[],
  cx: number,
  cz: number,
  w: number,
  d: number
): void {
  colliders.push({
    minX: cx - w / 2,
    maxX: cx + w / 2,
    minZ: cz - d / 2,
    maxZ: cz + d / 2,
    isSolid: true,
  });
}

function addGuardrail(
  parent: THREE.Group,
  colliders: AABBCollider[],
  x: number,
  z: number,
  len: number,
  horizontal: boolean,
  yElev = 0.45
): void {
  const railMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.75, roughness: 0.35 });
  const postMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.6, roughness: 0.45 });
  const w = horizontal ? len : 0.25;
  const d = horizontal ? 0.25 : len;
  const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.26, d), railMat);
  rail.position.set(x, yElev + 0.68, z);
  rail.castShadow = true;
  parent.add(rail);

  const stripeMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', emissive: '#f59e0b', emissiveIntensity: 0.25 });
  const steps = Math.max(2, Math.floor(len / 8));
  for (let i = 0; i <= steps; i++) {
    const t = -len / 2 + (len * i) / steps;
    const px = horizontal ? x + t : x;
    const pz = horizontal ? z : z + t;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.22), postMat);
    post.position.set(px, yElev + 0.42, pz);
    parent.add(post);

    if (i % 2 === 0) {
      const refl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.26), stripeMat);
      refl.position.set(px, yElev + 0.72, pz);
      parent.add(refl);
    }
  }
  addWallCollider(colliders, x, z, Math.max(0.6, w), Math.max(0.6, d));
}

function addBuildingBox(
  parent: THREE.Group,
  colliders: AABBCollider[],
  x: number,
  z: number,
  w: number,
  h: number,
  d: number,
  wallColor: string,
  roofColor: string,
  titleEn: string,
  titleMl: string,
  hasTerracottaRoof = true,
  signBg = '#0f172a',
  signAccent = '#f59e0b',
  faceDir: 'south' | 'north' | 'east' | 'west' = 'south'
): THREE.Group {
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);

  const wallMat = new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: 0.78,
    metalness: 0.04,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  grp.add(body);

  const plinthMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.45, d + 0.6), plinthMat);
  plinth.position.y = 0.225;
  plinth.receiveShadow = true;
  grp.add(plinth);

  if (hasTerracottaRoof) {
    const roofTex = getMangaloreTileTexture();
    const roofMat = new THREE.MeshStandardMaterial({
      map: roofTex,
      color: roofColor,
      roughness: 0.68,
      metalness: 0.05,
    });
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(w, d) * 0.78, Math.min(4.2, h * 0.55), 4),
      roofMat
    );
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    roof.position.y = h + Math.min(4.2, h * 0.55) / 2 - 0.1;
    roof.castShadow = true;
    grp.add(roof);
  } else {
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4),
      new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.5, metalness: 0.2 })
    );
    trim.position.y = h + 0.25;
    grp.add(trim);
  }

  const glassMat = new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    roughness: 0.15,
    metalness: 0.7,
    emissive: '#0c4a6e',
    emissiveIntensity: 0.25,
  });

  const signTex = createSignboardTexture(titleEn, titleMl, signBg, '#f8fafc', signAccent);
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    roughness: 0.4,
    emissive: '#ffffff',
    emissiveMap: signTex,
    emissiveIntensity: 0.25,
  });

  const signW = Math.min(w * 0.78, 8.8);
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(signW, 1.8, 0.2), signMat);
  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 0.2), glassMat);

  if (faceDir === 'south') {
    signMesh.position.set(0, Math.min(h - 1.1, 5.2), d / 2 + 0.15);
    doorMesh.position.set(0, 1.6, d / 2 + 0.08);
  } else if (faceDir === 'north') {
    signMesh.position.set(0, Math.min(h - 1.1, 5.2), -d / 2 - 0.15);
    signMesh.rotation.y = Math.PI;
    doorMesh.position.set(0, 1.6, -d / 2 - 0.08);
  } else if (faceDir === 'east') {
    signMesh.position.set(w / 2 + 0.15, Math.min(h - 1.1, 5.2), 0);
    signMesh.rotation.y = Math.PI / 2;
    doorMesh.position.set(w / 2 + 0.08, 1.6, 0);
    doorMesh.rotation.y = Math.PI / 2;
  } else {
    signMesh.position.set(-w / 2 - 0.15, Math.min(h - 1.1, 5.2), 0);
    signMesh.rotation.y = -Math.PI / 2;
    doorMesh.position.set(-w / 2 - 0.08, 1.6, 0);
    doorMesh.rotation.y = Math.PI / 2;
  }
  grp.add(signMesh, doorMesh);

  parent.add(grp);
  addWallCollider(colliders, x, z, w + 1.0, d + 1.0);
  return grp;
}

// Enterable 3D Interior Walkthrough Building (real walkable doorway + furnished room + collidable outer walls)
function addWalkthroughInteriorBuilding(
  parent: THREE.Group,
  colliders: AABBCollider[],
  x: number,
  z: number,
  w: number,
  h: number,
  d: number,
  wallColor: string,
  roofColor: string,
  floorColor: string,
  titleEn: string,
  titleMl: string,
  doorSide: 'south' | 'north',
  hasTerracottaRoof: boolean,
  hasCheckpointPad: boolean,
  interiorMode: 'home' | 'secretariat' | 'mall' | 'bank' = 'home'
): THREE.Group {
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);

  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.72 });
  const floorMat = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.35, metalness: 0.08 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.65 });
  const fabricMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.85 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, d), floorMat);
  floor.position.y = 0.09;
  floor.receiveShadow = true;
  grp.add(floor);

  const wallT = 0.45;
  const backZ = doorSide === 'south' ? -d / 2 + wallT / 2 : d / 2 - wallT / 2;
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallT), wallMat);
  backWall.position.set(0, h / 2, backZ);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  grp.add(backWall);
  addWallCollider(colliders, x, z + backZ, w, wallT + 0.4);

  for (const sx of [-1, 1]) {
    const wx = sx * (w / 2 - wallT / 2);
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, h, d), wallMat);
    sideWall.position.set(wx, h / 2, 0);
    sideWall.castShadow = true;
    sideWall.receiveShadow = true;
    grp.add(sideWall);
    addWallCollider(colliders, x + wx, z, wallT + 0.4, d);
  }

  const doorWidth = interiorMode === 'secretariat' || interiorMode === 'mall' ? 6.0 : 3.6;
  const wingW = (w - doorWidth) / 2;
  const frontZ = doorSide === 'south' ? d / 2 - wallT / 2 : -d / 2 + wallT / 2;
  for (const sx of [-1, 1]) {
    const wingX = sx * (doorWidth / 2 + wingW / 2);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(wingW, h, wallT), wallMat);
    wing.position.set(wingX, h / 2, frontZ);
    wing.castShadow = true;
    grp.add(wing);
    addWallCollider(colliders, x + wingX, z + frontZ, wingW, wallT + 0.4);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, Math.max(1.2, h - 3.2), wallT), wallMat);
  lintel.position.set(0, h - Math.max(1.2, h - 3.2) / 2, frontZ);
  grp.add(lintel);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.35, d + 0.6), wallMat);
  ceiling.position.y = h;
  grp.add(ceiling);

  if (hasTerracottaRoof) {
    const roofTex = getMangaloreTileTexture();
    const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, color: roofColor, roughness: 0.68 });
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(w, d) * 0.78, Math.min(4.2, h * 0.65), 4),
      roofMat
    );
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    roof.position.y = h + Math.min(4.2, h * 0.65) / 2;
    roof.castShadow = true;
    grp.add(roof);
  }

  const signTex = createSignboardTexture(titleEn, titleMl, '#0f172a', '#f8fafc', '#f59e0b');
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(Math.min(w * 0.72, 9.5), 1.6, 0.2),
    new THREE.MeshStandardMaterial({ map: signTex, emissive: '#ffffff', emissiveMap: signTex, emissiveIntensity: 0.25 })
  );
  sign.position.set(0, h - 0.5, frontZ + (doorSide === 'south' ? 0.35 : -0.35));
  if (doorSide === 'north') sign.rotation.y = Math.PI;
  grp.add(sign);

  if (interiorMode === 'secretariat') {
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.04, d - 3), fabricMat);
    carpet.position.set(0, 0.2, 0);
    grp.add(carpet);
    const desk = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.15, 1.6), woodMat);
    desk.position.set(0, 0.68, 4);
    grp.add(desk);
    for (const px of [-w * 0.36, -w * 0.18, w * 0.18, w * 0.36]) {
      const extPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, h, 12), wallMat);
      extPillar.position.set(px, h / 2, frontZ - 2.6);
      grp.add(extPillar);
      const intPillar = extPillar.clone();
      intPillar.position.set(px, h / 2, 0);
      grp.add(intPillar);
    }
  } else if (interiorMode === 'mall') {
    // Shopping Mall display counters, clothing racks & bright food court
    const counterMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.35 });
    const shelfMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.5 });
    for (const sx of [-w * 0.28, w * 0.28]) {
      const counter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 1.2), counterMat);
      counter.position.set(sx, 0.65, -2.5);
      grp.add(counter);
      const rack = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.6, 0.8), shelfMat);
      rack.position.set(sx, 0.9, 2.5);
      grp.add(rack);
    }
    const fountain = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.1, 0.65, 14),
      new THREE.MeshPhysicalMaterial({ color: '#38bdf8', roughness: 0.12, clearcoat: 1 })
    );
    fountain.position.set(0, 0.42, 0);
    grp.add(fountain);
  } else if (interiorMode === 'bank') {
    const tellerCounter = new THREE.Mesh(new THREE.BoxGeometry(w * 0.65, 1.15, 1.2), woodMat);
    tellerCounter.position.set(0, 0.68, -d * 0.18);
    grp.add(tellerCounter);
    const glassScreen = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.62, 1.2, 0.12),
      new THREE.MeshPhysicalMaterial({ color: '#bae6fd', transparent: true, opacity: 0.45 })
    );
    glassScreen.position.set(0, 1.85, -d * 0.18);
    grp.add(glassScreen);
  } else {
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.75, 1.1), fabricMat);
    sofa.position.set(-w * 0.22, 0.45, 0);
    grp.add(sofa);
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.1), woodMat);
    table.position.set(-w * 0.22, 0.35, 1.8);
    grp.add(table);
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.55, 3.2), woodMat);
    bedFrame.position.set(w * 0.24, 0.38, -d * 0.15);
    grp.add(bedFrame);
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.25, 2.9),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.8 })
    );
    mattress.position.set(w * 0.24, 0.72, -d * 0.15);
    grp.add(mattress);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 10),
      new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#f59e0b', emissiveIntensity: 1.6 })
    );
    lamp.position.set(0, h - 0.5, 0);
    grp.add(lamp);
  }

  if (hasCheckpointPad) {
    const padMat = new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const pad = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.5, 24), padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, 0.22, 0);
    grp.add(pad);
  }

  parent.add(grp);
  return grp;
}

function buildAirportRunwayAndJet(
  parent: THREE.Group,
  x: number,
  z: number,
  horizontal: boolean,
  phaseOffset: number
): AnimatedAircraft {
  const runway = new THREE.Mesh(
    new THREE.PlaneGeometry(horizontal ? 92 : 18, horizontal ? 18 : 92),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.72 })
  );
  runway.rotation.x = -Math.PI / 2;
  runway.position.set(x, 0.06, z);
  runway.receiveShadow = true;
  parent.add(runway);

  // Runway centerline dashes
  const dashMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
  for (let i = -36; i <= 36; i += 12) {
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(horizontal ? 5 : 0.6, horizontal ? 0.6 : 5),
      dashMat
    );
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(horizontal ? x + i : x, 0.08, horizontal ? z : z + i);
    parent.add(dash);
  }

  // Stylized Regional Airliner Aircraft
  const plane = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3, metalness: 0.35 });
  const tailMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.35 });
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 11.5, 12), bodyMat);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.y = 1.6;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.2, 2.2), bodyMat);
  wing.position.set(0, 1.4, 0.5);
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.4, 1.8), tailMat);
  tailFin.position.set(0, 2.7, -4.8);
  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.88, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.15, metalness: 0.6 })
  );
  cockpit.position.set(0, 1.75, 5.5);
  plane.add(fuselage, wing, tailFin, cockpit);
  plane.position.set(x, 0, z);
  if (horizontal) plane.rotation.y = Math.PI / 2;
  parent.add(plane);

  return { group: plane, baseX: x, baseZ: z, phaseOffset };
}

export function buildKeralaWorld(scene: THREE.Scene, maxAnisotropy = 4): KeralaWorldHandles {
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  const colliders: AABBCollider[] = [];
  const trafficSignals: TrafficSignalNode[] = [];
  const streetLampBulbs: THREE.MeshStandardMaterial[] = [];
  const aircraftList: AnimatedAircraft[] = [];

  // 1. Continuous Kerala Terrain (1800m x 1800m)
  const grassTex = getGrassPaddyTexture(maxAnisotropy);
  const groundMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.92,
    metalness: 0.02,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  worldGroup.add(ground);

  // Arabian Sea Sandy Coastline (West: x = -190 to -142)
  const sandMat = new THREE.MeshStandardMaterial({ color: '#e5c99b', roughness: 0.94 });
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(75, 1180), sandMat);
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(-165, 0.02, 20);
  beach.receiveShadow = true;
  worldGroup.add(beach);

  // Arabian Sea Animated Ocean (subdivided plane for real wave undulation)
  const oceanMat = new THREE.MeshPhysicalMaterial({
    color: '#0369a1',
    roughness: 0.16,
    metalness: 0.18,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
  });
  const oceanGeo = new THREE.PlaneGeometry(600, 1400, 26, 36);
  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  oceanMesh.rotation.x = -Math.PI / 2;
  oceanMesh.position.set(-488, -0.32, 0);
  worldGroup.add(oceanMesh);

  // Shoreline Foam Strips along Arabian Sea Coast
  const foamMat = new THREE.MeshBasicMaterial({
    color: '#e0f2fe',
    transparent: true,
    opacity: 0.55,
  });
  const shorelineFoam = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1150), foamMat);
  shorelineFoam.rotation.x = -Math.PI / 2;
  shorelineFoam.position.set(-190, 0.04, 20);
  worldGroup.add(shorelineFoam);

  // Vembanad & Kuttanad Backwater Lake
  const backwaterLake = new THREE.Mesh(new THREE.PlaneGeometry(360, 270), oceanMat);
  backwaterLake.rotation.x = -Math.PI / 2;
  backwaterLake.position.set(-225, -0.25, 298);
  worldGroup.add(backwaterLake);

  // Eastern Backwater Canal connecting Kochi to South
  const canal = new THREE.Mesh(new THREE.PlaneGeometry(460, 36), oceanMat);
  canal.rotation.x = -Math.PI / 2;
  canal.position.set(182, -0.28, 192);
  worldGroup.add(canal);

  // =========================================================================
  // EXPANDED REGION A: ALAPPUZHA KUTTANAD BACKWATER ISLANDS & HOUSEBOATS
  // =========================================================================
  const paddyMat = new THREE.MeshStandardMaterial({ color: '#4d7c0f', roughness: 0.88 });
  const island1 = new THREE.Mesh(new THREE.BoxGeometry(114, 0.65, 96), paddyMat);
  island1.position.set(-255, 0.05, 270);
  island1.receiveShadow = true;
  worldGroup.add(island1);

  const island2 = new THREE.Mesh(new THREE.BoxGeometry(84, 0.65, 70), paddyMat);
  island2.position.set(-290, 0.05, 365);
  island2.receiveShadow = true;
  worldGroup.add(island2);

  addBuildingBox(
    worldGroup, colliders, -255, 248, 14, 5.0, 9,
    '#fef3c7', '#b45309', 'Kuttanad Kayal Hub', 'കുട്ടനാട് കായൽ',
    true, '#14532d', '#fde047', 'south'
  );

  const hullWoodMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.85 });
  const thatchMat = new THREE.MeshStandardMaterial({ color: '#d6b37c', roughness: 0.92 });
  for (const [hx, hz, rot] of [
    [-190, 265, 0.2],
    [-212, 330, -0.35],
    [-325, 275, 0.1],
  ]) {
    const houseboat = new THREE.Group();
    houseboat.position.set(hx, 0.1, hz);
    houseboat.rotation.y = rot;
    const hull = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 14), hullWoodMat);
    hull.position.y = 0.25;
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.1, 9.5, 10, 1, false, 0, Math.PI), thatchMat);
    canopy.rotation.z = Math.PI / 2;
    canopy.rotation.y = Math.PI / 2;
    canopy.position.set(0, 0.85, -0.5);
    houseboat.add(hull, canopy);
    worldGroup.add(houseboat);
  }

  // =========================================================================
  // EXPANDED REGION B: NORTHERN DISTRICTS (KASARAGOD, KANNUR, KOZHIKODE, MALAPPURAM, PALAKKAD, THRISSUR, WAYANAD, MUNNAR)
  // =========================================================================
  // 1. Kasaragod Bekal Fort (-130, -340)
  addBuildingBox(
    worldGroup, colliders, -130, -354, 24, 7.2, 14,
    '#9a3412', '#7c2d12', 'Bekal Fort Kasaragod', 'ബേക്കൽ കോട്ട',
    false, '#451a03', '#fde047', 'south'
  );
  // Bastion towers with colliders
  for (const bx of [-144, -116]) {
    const bastion = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.8, 9.5, 12),
      new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.88 })
    );
    bastion.position.set(bx, 4.75, -348);
    worldGroup.add(bastion);
    addWallCollider(colliders, bx, -348, 8.8, 8.8);
  }

  // 2. Kannur International Airport (-125, -265)
  addBuildingBox(
    worldGroup, colliders, -125, -280, 24, 9.0, 14,
    '#e0f2fe', '#0369a1', 'Kannur Air Terminal', 'കണ്ണൂർ വിമാനത്താവളം',
    false, '#0f172a', '#38bdf8', 'south'
  );
  aircraftList.push(buildAirportRunwayAndJet(worldGroup, -182, -265, false, 1.7));

  // 3. Kozhikode Beach & SM Street Market (-125, -195)
  addBuildingBox(
    worldGroup, colliders, -142, -192, 18, 7.2, 12,
    '#fef3c7', '#b91c1c', 'SM Street Kozhikode', 'മിഠായിത്തെരുവ്',
    true, '#7c2d12', '#fde047', 'east'
  );

  // 4. Malappuram Stadium & Tech Campus (85, -228)
  addBuildingBox(
    worldGroup, colliders, 85, -242, 22, 8.5, 14,
    '#f1f5f9', '#15803d', 'Malappuram Tech Stadium', 'മലപ്പുറം സ്റ്റേഡിയം',
    false, '#064e3b', '#34d399', 'south'
  );

  // 5. Palakkad Fort & Malampuzha Dam (215, -165)
  addBuildingBox(
    worldGroup, colliders, 200, -190, 18, 7.2, 12,
    '#d6b37c', '#78350f', 'Palakkad Fort Gate', 'പാലക്കാട് കോട്ട',
    false, '#451a03', '#f59e0b', 'south'
  );
  // Malampuzha Dam Masonry Wall + Reservoir Water
  const damWall = new THREE.Mesh(
    new THREE.BoxGeometry(64, 9.5, 6),
    new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.85 })
  );
  damWall.position.set(236, 4.75, -162);
  worldGroup.add(damWall);
  addWallCollider(colliders, 236, -162, 64, 6.5);
  const damReservoir = new THREE.Mesh(new THREE.PlaneGeometry(62, 36), oceanMat);
  damReservoir.rotation.x = -Math.PI / 2;
  damReservoir.position.set(236, 0.25, -140);
  worldGroup.add(damReservoir);

  // 6. Thrissur Swaraj Heritage & Rail (-25, -235)
  addBuildingBox(
    worldGroup, colliders, -25, -248, 18, 7.0, 12,
    '#fffbeb', '#b45309', 'Thrissur Swaraj Hall', 'തൃശ്ശൂർ സ്വരാജ് റൗണ്ട്',
    true, '#7c2d12', '#fde047', 'south'
  );

  // 7. Munnar Tea Hills & Wayanad Ghats (with REAL mountain colliders!)
  const teaGreenMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.9 });
  const teaDeepMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.92 });
  const cliffRockMat = new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.95 });

  const teaHills: Array<[number, number, number, number]> = [
    [358, -200, 36, 18],
    [388, -270, 46, 24],
    [275, -172, 28, 14],
    [278, -292, 30, 18],
    [212, -372, 34, 24],
    [362, -355, 42, 26],
  ];
  for (let i = 0; i < teaHills.length; i++) {
    const [tx, tz, tr, th] = teaHills[i];
    const mound = new THREE.Mesh(
      new THREE.ConeGeometry(tr, th, 14),
      i % 2 === 0 ? teaGreenMat : teaDeepMat
    );
    mound.position.set(tx, th / 2 - 1.5, tz);
    mound.receiveShadow = true;
    worldGroup.add(mound);

    const row = new THREE.Mesh(new THREE.TorusGeometry(tr * 0.55, 1.4, 6, 18), teaDeepMat);
    row.rotation.x = Math.PI / 2;
    row.position.set(tx, th * 0.35, tz);
    worldGroup.add(row);

    // Real collision for mountain base so cars cannot drive through hills!
    addWallCollider(colliders, tx, tz, tr * 1.15, tr * 1.15);
  }

  addBuildingBox(
    worldGroup, colliders, 315, -256, 20, 7.5, 13,
    '#f8fafc', '#15803d', 'Munnar Tea Estate', 'മൂന്നാർ തേയില ഫാക്ടറി',
    true, '#14532d', '#fde047', 'south'
  );

  // Wayanad Ghat Cliff & Waterfall (x: 245, z: -330)
  const ghatCliff = new THREE.Mesh(new THREE.BoxGeometry(36, 22, 24), cliffRockMat);
  ghatCliff.position.set(252, 10, -356);
  worldGroup.add(ghatCliff);
  addWallCollider(colliders, 252, -356, 36, 24);
  const waterfall = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 21),
    new THREE.MeshPhysicalMaterial({ color: '#bae6fd', roughness: 0.1, emissive: '#38bdf8', emissiveIntensity: 0.25 })
  );
  waterfall.position.set(252, 10.5, -343.8);
  worldGroup.add(waterfall);

  // =========================================================================
  // EXPANDED REGION C: KOTTAYAM, PATHANAMTHITTA, KOLLAM, THIRUVANANTHAPURAM & KOVALAM
  // =========================================================================
  // Kottayam Kumarakom Resort & Rail (120, 115)
  addBuildingBox(
    worldGroup, colliders, 118, 102, 16, 6.2, 11,
    '#fef3c7', '#b45309', 'Kumarakom Resort & Rail', 'കുമരകം · കോട്ടയം',
    true, '#78350f', '#fde047', 'south'
  );

  // Pathanamthitta Pamba Eco Pavilion (165, 205)
  addBuildingBox(
    worldGroup, colliders, 165, 225, 16, 6.0, 11,
    '#ecfdf5', '#15803d', 'Pathanamthitta Eco Park', 'പത്തനംതിട്ട പമ്പ',
    true, '#14532d', '#34d399', 'north'
  );

  // Kollam Ashtamudi Harbour & Market (-130, 305)
  addBuildingBox(
    worldGroup, colliders, -138, 305, 16, 6.4, 12,
    '#ffedd5', '#ea580c', 'Kollam Ashtamudi Port', 'കൊല്ലം അഷ്ടമുടി',
    true, '#7c2d12', '#fde047', 'east'
  );

  // Enterable Grand Kerala Secretariat Complex (55, 315)
  addWalkthroughInteriorBuilding(
    worldGroup, colliders, 55, 315, 34, 11.5, 24,
    '#fef3c7', '#b91c1c', '#e2e8f0',
    'Kerala Secretariat', 'തിരുവനന്തപുരം സെക്രട്ടേറിയറ്റ്',
    'north', true, false, 'secretariat'
  );

  // Trivandrum International Airport (165, 315)
  addBuildingBox(
    worldGroup, colliders, 165, 315, 24, 9.5, 15,
    '#e0f2fe', '#0369a1', 'Trivandrum Airport', 'തിരുവനന്തപുരം വിമാനത്താവളം',
    false, '#0f172a', '#38bdf8', 'north'
  );
  aircraftList.push(buildAirportRunwayAndJet(worldGroup, 212, 280, false, 3.1));

  // TVM Fuel Station (18, 262)
  addBuildingBox(
    worldGroup, colliders, 22, 258, 12, 4.8, 9,
    '#fef2f2', '#dc2626', 'TVM NH-66 Fuel Pump', 'പെട്രോൾ പമ്പ്',
    false, '#991b1b', '#fde047', 'west'
  );

  // Kovalam Lighthouse (-135, 365)
  const lhGroup = new THREE.Group();
  lhGroup.position.set(-135, 0, 365);
  const lhBase = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.0, 12, 16), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6 }));
  lhBase.position.y = 6;
  const lhBand = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 10, 16), new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.5 }));
  lhBand.position.y = 17;
  const lhTop = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.0, 3.2, 16),
    new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#f59e0b', emissiveIntensity: 2.0 })
  );
  lhTop.position.y = 23.5;
  lhGroup.add(lhBase, lhBand, lhTop);
  worldGroup.add(lhGroup);
  addWallCollider(colliders, -135, 365, 8, 8);

  // Distant Western Ghats Horizon Perimeter (with colliders)
  const hillMat = new THREE.MeshStandardMaterial({ color: '#1e4620', roughness: 0.92 });
  for (let i = 0; i < 24; i++) {
    const hRadius = 42 + (i % 5) * 18;
    const hHeight = 34 + (i % 4) * 16;
    const hill = new THREE.Mesh(new THREE.ConeGeometry(hRadius, hHeight, 10), hillMat);
    if (i < 12) {
      hill.position.set(450 + (i % 3) * 40, hHeight / 2 - 2, -400 + i * 75);
    } else {
      hill.position.set(-240 + (i - 12) * 65, hHeight / 2 - 2, -450 - (i % 2) * 35);
    }
    worldGroup.add(hill);
    addWallCollider(colliders, hill.position.x, hill.position.z, hRadius * 1.1, hRadius * 1.1);
  }

  // =========================================================================
  // 2. INTERCONNECTED 14-DISTRICT KERALA ROAD & HIGHWAY NETWORK
  // =========================================================================
  const roadTex = getAsphaltTexture(maxAnisotropy);
  const roadMaterial = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.68,
    metalness: 0.08,
  });
  const sidewalkTex = getSidewalkTexture(maxAnisotropy);
  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: sidewalkTex,
    roughness: 0.85,
  });

  const addRoadSegment = (x: number, z: number, len: number, width: number, horizontal: boolean, yElev = 0.05) => {
    const texClone = roadTex.clone();
    texClone.needsUpdate = true;
    texClone.repeat.set(1, Math.max(1, Math.round(len / 24)));
    const mat = roadMaterial.clone();
    mat.map = texClone;

    const road = new THREE.Mesh(new THREE.PlaneGeometry(width, len), mat);
    road.rotation.x = -Math.PI / 2;
    if (horizontal) road.rotation.z = Math.PI / 2;
    road.position.set(x, yElev, z);
    road.receiveShadow = true;
    worldGroup.add(road);

    const walk = new THREE.Mesh(new THREE.PlaneGeometry(width + 4.5, len + 4.5), sidewalkMat);
    walk.rotation.x = -Math.PI / 2;
    if (horizontal) walk.rotation.z = Math.PI / 2;
    walk.position.set(x, yElev - 0.02, z);
    walk.receiveShadow = true;
    worldGroup.add(walk);
  };

  // Core Kochi / Ernakulam Grid
  addRoadSegment(-120, 0, 360, 14, false);
  addRoadSegment(0, 0, 580, 16, false);
  addRoadSegment(90, 0, 360, 14, false);
  addRoadSegment(0, -96, 360, 14, true);
  addRoadSegment(-10, 0, 340, 14, true);
  addRoadSegment(10, 88, 340, 14, true);
  addRoadSegment(-145, 18, 52, 10, true);

  // North Kerala Highways (Thrissur, Kozhikode, Kannur, Kasaragod, Malappuram, Palakkad, Munnar, Wayanad)
  addRoadSegment(95, -210, 440, 14, true);        // West-East Highway from Kozhikode (-125) -> Thrissur -> Malappuram -> Munnar (315)
  addRoadSegment(-125, -260, 175, 13, false);     // Kozhikode -> Kannur -> Kasaragod
  addRoadSegment(85, -270, 120, 12, false);       // Malappuram -> Nilambur Valley
  addRoadSegment(215, -180, 185, 12, false);      // Palakkad Dam Road north/south
  addRoadSegment(315, -270, 155, 13, false);      // Munnar -> Wayanad Summit
  addRoadSegment(200, -330, 235, 12, true);       // Wayanad Ghat Hairpin -> Nilambur
  addRoadSegment(-20, -295, 210, 12, true);       // Kannur -> Nilambur northern link

  // Guardrails along Wayanad cliff edge & Kuttanad Backwater Bridge!
  addGuardrail(worldGroup, colliders, 265, -337, 90, true, 0.05);
  addGuardrail(worldGroup, colliders, -180, 263, 125, true, 0.45);
  addGuardrail(worldGroup, colliders, -180, 277, 125, true, 0.45);
  addGuardrail(worldGroup, colliders, -12, 192, 40, false, 0.45);
  addGuardrail(worldGroup, colliders, 12, 192, 40, false, 0.45);

  // South Kerala & Backwater Bridges (Alappuzha, Pathanamthitta, Kollam, TVM, Kovalam)
  addRoadSegment(-120, 245, 240, 14, false, 0.45);
  addRoadSegment(-185, 270, 145, 12, true, 0.45);
  addRoadSegment(0, 280, 175, 16, false, 0.45);
  addRoadSegment(85, 280, 185, 14, true);
  addRoadSegment(90, 225, 120, 13, false, 0.45);   // Kottayam Link across Canal to TVM Airport Rd
  addRoadSegment(-60, 360, 145, 12, true);         // Kovalam - TVM Bypass

  // =========================================================================
  // 3. CENTRAL FORT KOCHI & ERNAKULAM ENTERABLE BUILDINGS
  // =========================================================================
  // Starter Tharavadu Home (-72, 68) — ENTERABLE INTERIOR + CHECKPOINT!
  addWalkthroughInteriorBuilding(
    worldGroup, colliders, -72, 68, 14, 5.2, 11,
    '#fef3c7', '#b45309', '#d6b37c',
    'Kochi Tharavadu', 'തറവാട് വീട്',
    'south', true, true, 'home'
  );

  // Vembanad Pearl Luxury Mansion (138, 142) — ENTERABLE INTERIOR + POOL!
  addWalkthroughInteriorBuilding(
    worldGroup, colliders, 138, 142, 22, 9.0, 16,
    '#f8fafc', '#0f172a', '#e2e8f0',
    'Vembanad Pearl Mansion', 'വേമ്പനാട് മാൻഷൻ',
    'north', false, true, 'home'
  );
  const pool = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.25, 7),
    new THREE.MeshPhysicalMaterial({ color: '#06b6d4', roughness: 0.1, clearcoat: 1 })
  );
  pool.position.set(138, 0.15, 126);
  worldGroup.add(pool);

  // Enterable Malabar Grand Shopping Mall (45, 62)
  addWalkthroughInteriorBuilding(
    worldGroup, colliders, 45, 62, 20, 9.5, 14,
    '#e2e8f0', '#0f172a', '#f1f5f9',
    'Malabar Grand Mall', 'മലബാർ ഗ്രാൻഡ് മാൾ',
    'south', false, false, 'mall'
  );

  // Enterable Kerala Federal Bank HQ (62, -74)
  addWalkthroughInteriorBuilding(
    worldGroup, colliders, 62, -74, 15, 7.2, 12,
    '#f8fafc', '#15803d', '#cbd5e1',
    'Kerala Federal Bank', 'കേരള ബാങ്ക്',
    'north', false, false, 'bank'
  );

  // Core Town Service Buildings
  addBuildingBox(worldGroup, colliders, -24, 22, 10, 4.6, 8, '#fde68a', '#9a3412', 'Nadan Chaya Kadai', 'നാടൻ ചായക്കട', true, '#78350f', '#fef08a', 'south');
  addBuildingBox(worldGroup, colliders, 22, 24, 18, 6.2, 12, '#e2e8f0', '#b91c1c', 'KSRTC Bus Terminal', 'ബസ് ടെർമിനൽ', false, '#991b1b', '#fef08a', 'north');
  addBuildingBox(worldGroup, colliders, 68, -42, 20, 10.5, 15, '#f8fafc', '#0284c7', 'General Hospital', 'ജനറൽ ആശുപത്രി', false, '#0c4a6e', '#38bdf8', 'south');
  addBuildingBox(worldGroup, colliders, -68, -38, 16, 7.2, 12, '#e7d3b0', '#1e3a8a', 'Kerala Police HQ', 'പോലീസ് സ്റ്റേഷൻ', true, '#1e3a8a', '#facc15', 'south');
  addBuildingBox(worldGroup, colliders, 45, 24, 14, 7.2, 11, '#fee2e2', '#dc2626', 'Fire & Rescue HQ', 'ഫയർ സ്റ്റേഷൻ', false, '#991b1b', '#fef08a', 'north');
  addBuildingBox(worldGroup, colliders, 24, -86, 22, 9.5, 14, '#f1f5f9', '#9a3412', 'District Collectorate', 'ജില്ലാ കളക്ടറേറ്റ്', true, '#1e293b', '#f59e0b', 'north');
  addBuildingBox(worldGroup, colliders, -22, -112, 18, 6.8, 12, '#1e293b', '#f59e0b', 'Malabar Auto Showroom', 'വാഹന ഷോറൂം', false, '#0f172a', '#f59e0b', 'south');
  addBuildingBox(worldGroup, colliders, 118, -16, 14, 7.4, 24, '#fef2f2', '#b91c1c', 'Ernakulam Junction', 'എറണാകുളം റെയിൽവേ', true, '#7f1d1d', '#fde047', 'west');
  addBuildingBox(worldGroup, colliders, 168, -135, 26, 10.5, 16, '#e0f2fe', '#0369a1', 'Cochin Air Terminal', 'കൊച്ചി വിമാനത്താവളം', true, '#0f172a', '#38bdf8', 'south');
  aircraftList.push(buildAirportRunwayAndJet(worldGroup, 220, -118, false, 0.2));

  // Kochi Highway Fuel Station (-18, -62)
  addBuildingBox(worldGroup, colliders, -18, -62, 11, 4.6, 8, '#f8fafc', '#dc2626', 'Bharat Fuel Station', 'പെട്രോൾ പമ്പ്', false, '#991b1b', '#fde047', 'east');
  // Fuel pump islands
  for (const pz of [-64, -58]) {
    const pump = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.8, 0.8),
      new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 })
    );
    pump.position.set(-10, 0.9, pz);
    worldGroup.add(pump);
    addWallCollider(colliders, -10, pz, 1.3, 1.0);
  }

  const extraBuildings: Array<[number, number, number, number, number, string, string, string]> = [
    [-44, -22, 12, 8, 10, '#f8fafc', '#9a3412', 'Malabar Silks'],
    [-95, -24, 14, 11, 12, '#e2e8f0', '#334155', 'Marine Suites'],
    [-95, 24, 13, 9, 11, '#fef9c3', '#9a3412', 'Kochi Bakery'],
    [-48, 24, 11, 7, 10, '#e0f2fe', '#0284c7', 'Spice Market'],
    [-95, -66, 15, 12, 11, '#f1f5f9', '#475569', 'Padma Cineplex'],
    [-25, 64, 14, 6.5, 11, '#fefce8', '#9a3412', 'Heritage College'],
    [136, 56, 16, 8, 12, '#fef3c7', '#9a3412', 'Backwater Resort'],
  ];
  for (const [bx, bz, bw, bh, bd, wc, rc, name] of extraBuildings) {
    addBuildingBox(worldGroup, colliders, bx, bz, bw, bh, bd, wc, rc, name, 'കേരള നഗരം', true, '#1e293b', '#f59e0b', 'south');
  }

  // 4. Boat Jetty & Chinese Fishing Nets
  const woodMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
  const jetty = new THREE.Mesh(new THREE.BoxGeometry(28, 0.7, 8.5), woodMat);
  jetty.position.set(-182, 0.35, 18);
  worldGroup.add(jetty);

  for (let n = 0; n < 3; n++) {
    const netZ = -55 - n * 28;
    const netGrp = new THREE.Group();
    netGrp.position.set(-178, 0, netZ);
    const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 14, 8), woodMat);
    pole1.position.set(-4, 5.5, 0);
    pole1.rotation.z = 0.65;
    const pole2 = pole1.clone();
    pole2.position.set(-4, 5.5, 3);
    const netMesh = new THREE.Mesh(
      new THREE.ConeGeometry(4.5, 3.2, 4),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', wireframe: true, transparent: true, opacity: 0.75 })
    );
    netMesh.position.set(-9.5, 6.2, 1.5);
    netMesh.rotation.x = Math.PI;
    netGrp.add(pole1, pole2, netMesh);
    worldGroup.add(netGrp);
  }

  // 5. Rideable Kerala Express Railway Track, Stations & Passenger Train (x = 136)
  const railMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.7, roughness: 0.35 });
  const ballast = new THREE.Mesh(new THREE.BoxGeometry(5, 0.14, 720), new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.95 }));
  ballast.position.set(136, 0.07, 0);
  worldGroup.add(ballast);
  for (const offset of [-0.9, 0.9]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 720), railMat);
    rail.position.set(136 + offset, 0.2, 0);
    worldGroup.add(rail);
  }

  // Railway Station Platforms, Footbridges & Signals at 4 Stops
  const platMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.8 });
  const bridgeMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.4, roughness: 0.5 });
  for (const sz of [-235, -16, 115, 240]) {
    const plat = new THREE.Mesh(new THREE.BoxGeometry(6, 0.85, 34), platMat);
    plat.position.set(131.2, 0.42, sz);
    plat.receiveShadow = true;
    worldGroup.add(plat);

    // Overhead pedestrian footbridge spanning tracks
    const footbridge = new THREE.Mesh(new THREE.BoxGeometry(12, 0.35, 2.6), bridgeMat);
    footbridge.position.set(134.5, 5.2, sz + 11);
    worldGroup.add(footbridge);
  }

  const trainGroup = new THREE.Group();
  trainGroup.position.set(136, 0.3, -120);
  const locoMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.35, metalness: 0.3 });
  const coachMat = new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.4, metalness: 0.2 });
  const coachWindowMat = new THREE.MeshStandardMaterial({ color: '#bae6fd', transparent: true, opacity: 0.45 });

  const loco = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.8, 12), locoMat);
  loco.position.set(0, 1.9, 8);
  loco.castShadow = true;
  trainGroup.add(loco);

  const coachFloor = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.2, 13.5), new THREE.MeshStandardMaterial({ color: '#334155' }));
  coachFloor.position.set(0, 0.4, -6);
  const coachRoof = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.25, 13.5), coachMat);
  coachRoof.position.set(0, 3.6, -6);
  const coachWallL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.0, 9.6), coachWindowMat);
  coachWallL.position.set(-1.48, 2.0, -7.8);
  const coachWallR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.0, 13.5), coachWindowMat);
  coachWallR.position.set(1.48, 2.0, -6);
  // Sliding Passenger Door on Platform side
  const coachDoorL = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 2.8, 3.4),
    new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4 })
  );
  coachDoorL.position.set(-1.5, 1.9, -1.2);
  trainGroup.add(coachFloor, coachRoof, coachWallL, coachWallR, coachDoorL);

  const seatMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.7 });
  for (let sz = -10; sz <= -2; sz += 2.5) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 0.7), seatMat);
    seat.position.set(-0.7, 0.9, sz);
    trainGroup.add(seat);
  }

  for (let c = 2; c <= 3; c++) {
    const coach = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.6, 13), coachMat);
    coach.position.set(0, 1.85, -6 - c * 14);
    coach.castShadow = true;
    trainGroup.add(coach);
  }
  worldGroup.add(trainGroup);

  const trainState: TrainState = {
    x: 136,
    z: -120,
    speed: 14,
    seatWorldPos: new THREE.Vector3(136 - 0.7, 1.25, -126),
    isStoppedAtStation: false,
    stationName: 'In Transit',
  };

  // 6. Instanced Coconut Palm Trees across Kerala WITH Solid Trunk Colliders!
  const palmPositions: Array<[number, number]> = [];
  const tryAddPalm = (px: number, pz: number) => {
    if (isWaterAt(px, pz)) return;
    if (Math.abs(px) < 12 || Math.abs(px + 120) < 11 || Math.abs(px - 90) < 11 || Math.abs(px - 136) < 9) return;
    if (Math.abs(pz) < 11 || Math.abs(pz + 96) < 11 || Math.abs(pz - 88) < 11 || Math.abs(pz + 210) < 11) return;
    if (Math.abs(pz - 280) < 12 || Math.abs(pz - 360) < 12 || Math.abs(pz + 330) < 12) return;
    for (const c of colliders) {
      if (px > c.minX - 4.5 && px < c.maxX + 4.5 && pz > c.minZ - 4.5 && pz < c.maxZ + 4.5) return;
    }
    palmPositions.push([px, pz]);
  };

  for (let gx = -320; gx <= 340; gx += 30) {
    for (let gz = -360; gz <= 360; gz += 30) {
      tryAddPalm(gx + ((gz * 7) % 11) - 5, gz + ((gx * 5) % 11) - 5);
    }
  }
  for (let bz = -150; bz <= 150; bz += 18) {
    tryAddPalm(-142 - (Math.abs(bz) % 7), bz);
  }

  const palmCount = palmPositions.length;
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.34, 9.5, 7);
  trunkGeo.translate(0, 4.75, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#6b4c35', roughness: 0.92 });
  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, palmCount);
  trunkInst.castShadow = true;

  const crownGeo = new THREE.ConeGeometry(3.4, 2.2, 7);
  crownGeo.translate(0, 9.5, 0);
  const crownMat = new THREE.MeshStandardMaterial({ color: '#2f7a2c', roughness: 0.8 });
  const crownInst = new THREE.InstancedMesh(crownGeo, crownMat, palmCount);
  crownInst.castShadow = true;

  const dummy = new THREE.Object3D();
  const palmTint = new THREE.Color();
  for (let i = 0; i < palmCount; i++) {
    const [px, pz] = palmPositions[i];
    const scale = 0.82 + ((i * 13) % 35) * 0.01;
    dummy.position.set(px, 0, pz);
    dummy.rotation.set(((i % 5) - 2) * 0.04, (i * 1.1) % (Math.PI * 2), ((i % 3) - 1) * 0.05);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(i, dummy.matrix);
    crownInst.setMatrixAt(i, dummy.matrix);
    palmTint.setHSL(0.28 + (i % 5) * 0.015, 0.55, 0.3 + (i % 4) * 0.03);
    crownInst.setColorAt(i, palmTint);

    // Solid tree trunk collider!
    addWallCollider(colliders, px, pz, 0.85, 0.85);
  }
  trunkInst.computeBoundingSphere();
  crownInst.computeBoundingSphere();
  worldGroup.add(trunkInst, crownInst);

  // 7. Traffic Signals & Electric/Streetlamp Poles (WITH Pole Colliders!)
  const intersections: Array<[number, number]> = [
    [0, 0],
    [-120, 0],
    [90, 0],
    [0, -96],
    [-120, -96],
    [0, 88],
    [0, -210],
    [0, 280],
  ];
  const poleMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.6, roughness: 0.4 });
  for (const [ix, iz] of intersections) {
    const px = ix - 9.5;
    const pz = iz - 9.5;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 5.8, 8), poleMat);
    pole.position.set(px, 2.9, pz);
    worldGroup.add(pole);
    addWallCollider(colliders, px, pz, 0.6, 0.6);

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), poleMat);
    box.position.set(px, 5.2, pz);
    worldGroup.add(box);

    const nsRedMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.1 });
    const nsGreenMat = new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 1.5 });
    const ewRedMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 1.5 });
    const ewGreenMat = new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 0.1 });

    const nsR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), nsRedMat);
    nsR.position.set(px, 5.5, pz + 0.4);
    const nsG = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), nsGreenMat);
    nsG.position.set(px, 4.95, pz + 0.4);
    const ewR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), ewRedMat);
    ewR.position.set(px + 0.4, 5.5, pz);
    const ewG = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), ewGreenMat);
    ewG.position.set(px + 0.4, 4.95, pz);

    worldGroup.add(nsR, nsG, ewR, ewG);
    trafficSignals.push({ x: ix, z: iz, nsGreen: true, nsRedMat, nsGreenMat, ewRedMat, ewGreenMat });
  }

  const lampMat = new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#f59e0b', emissiveIntensity: 0.1 });
  streetLampBulbs.push(lampMat);
  for (let lz = -240; lz <= 320; lz += 42) {
    for (const lx of [-10, 10]) {
      if (Math.abs(lz) < 12 || Math.abs(lz + 96) < 12 || Math.abs(lz - 88) < 12 || Math.abs(lz + 210) < 12 || Math.abs(lz - 280) < 12) continue;
      const lPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6, 6), poleMat);
      lPole.position.set(lx, 3, lz);
      worldGroup.add(lPole);
      addWallCollider(colliders, lx, lz, 0.55, 0.55);

      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.35), lampMat);
      bulb.position.set(lx + (lx < 0 ? 0.6 : -0.6), 5.9, lz);
      worldGroup.add(bulb);
    }
  }

  // Ground rings at service & checkpoint locations
  for (const loc of WORLD_LOCATIONS) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: loc.type === 'home' ? '#10b981' : loc.type === 'hospital' ? '#ef4444' : loc.type === 'police' ? '#3b82f6' : loc.type === 'fuel' ? '#f97316' : '#f59e0b',
      transparent: true,
      opacity: 0.48,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.95, 24), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(loc.x, 0.08, loc.z + (loc.type === 'home' ? 10 : 0));
    worldGroup.add(ring);
  }

  const oceanPosAttr = oceanGeo.attributes.position as THREE.BufferAttribute;
  const baseOceanZ = new Float32Array(oceanPosAttr.count);
  for (let i = 0; i < oceanPosAttr.count; i++) {
    baseOceanZ[i] = oceanPosAttr.getZ(i);
  }

  let trainStopTimer = 0;
  let lastStoppedZ = -999;

  const updateDynamicWorld = (dt: number, elapsed: number, isNight: boolean, wetness: number) => {
    const nsIsGreen = Math.floor(elapsed / 14) % 2 === 0;
    for (const sig of trafficSignals) {
      sig.nsGreen = nsIsGreen;
      sig.nsGreenMat.emissiveIntensity = nsIsGreen ? 1.8 : 0.08;
      sig.nsRedMat.emissiveIntensity = nsIsGreen ? 0.08 : 1.8;
      sig.ewGreenMat.emissiveIntensity = nsIsGreen ? 0.08 : 1.8;
      sig.ewRedMat.emissiveIntensity = nsIsGreen ? 1.8 : 0.08;
    }

    for (const bulb of streetLampBulbs) {
      bulb.emissiveIntensity = isNight ? 2.2 : 0.1;
    }

    roadMaterial.roughness = THREE.MathUtils.lerp(0.72, 0.16, wetness);
    roadMaterial.metalness = THREE.MathUtils.lerp(0.06, 0.35, wetness);

    // Animate Ocean Waves & Coastal Foam
    for (let i = 0; i < oceanPosAttr.count; i++) {
      const vx = oceanPosAttr.getX(i);
      const vy = oceanPosAttr.getY(i);
      const wave = Math.sin(vx * 0.04 + elapsed * 1.6) * 0.24 + Math.cos(vy * 0.05 + elapsed * 1.1) * 0.18;
      oceanPosAttr.setZ(i, baseOceanZ[i] + wave * (1 + wetness * 0.6));
    }
    oceanPosAttr.needsUpdate = true;
    shorelineFoam.position.x = -190.2 + Math.sin(elapsed * 1.6) * 1.25;
    foamMat.opacity = 0.38 + Math.sin(elapsed * 1.6) * 0.2;

    // Animate Regional Airport Planes (Takeoff, Climb, Cruise & Touchdown loop)
    for (const ac of aircraftList) {
      const cycle = (elapsed * 0.22 + ac.phaseOffset) % 1; // 0..1
      const along = (cycle - 0.5) * 160;
      const alt = cycle < 0.25 ? 0 : cycle < 0.5 ? Math.pow((cycle - 0.25) / 0.25, 1.4) * 28 : cycle < 0.8 ? 28 - ((cycle - 0.5) / 0.3) * 28 : 0;
      ac.group.position.set(ac.baseX, alt, ac.baseZ + along);
      ac.group.rotation.x = cycle > 0.24 && cycle < 0.48 ? -0.18 : cycle > 0.55 && cycle < 0.78 ? 0.12 : 0;
    }

    // Train schedule: loops between z = -310 and z = +310 with 4 Kerala station stops
    if (trainStopTimer > 0) {
      trainStopTimer -= dt;
      trainState.speed = 0;
      trainState.isStoppedAtStation = true;
      coachDoorL.position.z = THREE.MathUtils.damp(coachDoorL.position.z, -4.4, 8, dt);
    } else {
      trainState.isStoppedAtStation = false;
      trainState.speed = 16;
      trainState.z += trainState.speed * dt;
      coachDoorL.position.z = THREE.MathUtils.damp(coachDoorL.position.z, -1.2, 8, dt);
      if (trainState.z > 315) {
        trainState.z = -315;
        lastStoppedZ = -999;
      }
      for (const [stopZ, label] of [
        [-235, 'Thrissur Central'],
        [-16, 'Ernakulam Junction'],
        [115, 'Kottayam Rail'],
        [240, 'Thiruvananthapuram Central'],
      ] as Array<[number, string]>) {
        if (Math.abs(trainState.z - stopZ) < 1.2 && Math.abs(lastStoppedZ - stopZ) > 10) {
          trainState.z = stopZ;
          lastStoppedZ = stopZ;
          trainStopTimer = 5.5;
          trainState.stationName = label;
          break;
        }
      }
    }

    trainGroup.position.z = trainState.z;
    trainState.seatWorldPos.set(trainState.x - 0.7, 1.25, trainState.z - 6);
  };

  return {
    colliders,
    trafficSignals,
    streetLampBulbs,
    oceanMesh,
    trainGroup,
    trainState,
    roadMaterial,
    aircraftList,
    updateDynamicWorld,
  };
}
