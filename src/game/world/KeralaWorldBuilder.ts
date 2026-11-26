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

export interface KeralaWorldHandles {
  colliders: AABBCollider[];
  trafficSignals: TrafficSignalNode[];
  streetLampBulbs: THREE.MeshStandardMaterial[];
  oceanMesh: THREE.Mesh;
  trainGroup: THREE.Group;
  trainState: TrainState;
  roadMaterial: THREE.MeshStandardMaterial;
  updateDynamicWorld: (dt: number, elapsed: number, isNight: boolean, wetness: number) => void;
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

  const signW = Math.min(w * 0.78, 8.5);
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

// Enterable 3D Interior Walkthrough Building (with real doorway + furnished room + collidable outer walls)
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
  isSecretariat = false
): THREE.Group {
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);

  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.72 });
  const floorMat = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.35, metalness: 0.08 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.65 });
  const fabricMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.85 });

  // Interior Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, d), floorMat);
  floor.position.y = 0.09;
  floor.receiveShadow = true;
  grp.add(floor);

  const wallT = 0.45;
  // Back wall
  const backZ = doorSide === 'south' ? -d / 2 + wallT / 2 : d / 2 - wallT / 2;
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallT), wallMat);
  backWall.position.set(0, h / 2, backZ);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  grp.add(backWall);
  addWallCollider(colliders, x, z + backZ, w, wallT + 0.4);

  // Left & Right side walls
  for (const sx of [-1, 1]) {
    const wx = sx * (w / 2 - wallT / 2);
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, h, d), wallMat);
    sideWall.position.set(wx, h / 2, 0);
    sideWall.castShadow = true;
    sideWall.receiveShadow = true;
    grp.add(sideWall);
    addWallCollider(colliders, x + wx, z, wallT + 0.4, d);
  }

  // Front wall split into Left & Right wings around a wide 3.8m walkable doorway!
  const doorWidth = isSecretariat ? 6.0 : 3.6;
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
  // Lintel beam above doorway
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, Math.max(1.2, h - 3.2), wallT), wallMat);
  lintel.position.set(0, h - Math.max(1.2, h - 3.2) / 2, frontZ);
  grp.add(lintel);

  // Ceiling + Roof
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

  // Signboard above doorway
  const signTex = createSignboardTexture(titleEn, titleMl, '#0f172a', '#f8fafc', '#f59e0b');
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(Math.min(w * 0.7, 9.5), 1.6, 0.2),
    new THREE.MeshStandardMaterial({ map: signTex, emissive: '#ffffff', emissiveMap: signTex, emissiveIntensity: 0.25 })
  );
  sign.position.set(0, h - 0.5, frontZ + (doorSide === 'south' ? 0.35 : -0.35));
  if (doorSide === 'north') sign.rotation.y = Math.PI;
  grp.add(sign);

  // Interior Furniture & Walkthrough Decor
  if (isSecretariat) {
    // Grand red carpet runner + classical pillars + reception counter
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.04, d - 3), fabricMat);
    carpet.position.set(0, 0.2, 0);
    grp.add(carpet);

    const desk = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.15, 1.6), woodMat);
    desk.position.set(0, 0.68, 4);
    grp.add(desk);

    // Exterior & Interior colonnade pillars
    for (const px of [-w * 0.36, -w * 0.18, w * 0.18, w * 0.36]) {
      const extPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, h, 12), wallMat);
      extPillar.position.set(px, h / 2, frontZ - 2.6);
      grp.add(extPillar);
      const intPillar = extPillar.clone();
      intPillar.position.set(px, h / 2, 0);
      grp.add(intPillar);
    }
  } else {
    // Home Living Room Furniture: Wooden Sofa, Coffee Table, Bed, Warm Lamp
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

    // Warm interior ceiling chandelier/lamp
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 10),
      new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#f59e0b', emissiveIntensity: 1.6 })
    );
    lamp.position.set(0, h - 0.5, 0);
    grp.add(lamp);
  }

  // Glowing Home Save Checkpoint Pad right inside & on veranda!
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

export function buildKeralaWorld(scene: THREE.Scene, maxAnisotropy = 4): KeralaWorldHandles {
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  const colliders: AABBCollider[] = [];
  const trafficSignals: TrafficSignalNode[] = [];
  const streetLampBulbs: THREE.MeshStandardMaterial[] = [];

  // 1. Massive Continuous Kerala Terrain (1400m x 1400m)
  const grassTex = getGrassPaddyTexture(maxAnisotropy);
  const groundMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.92,
    metalness: 0.02,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  worldGroup.add(ground);

  // Arabian Sea Sandy Coastline (West: x = -195 to -142)
  const sandMat = new THREE.MeshStandardMaterial({ color: '#e5c99b', roughness: 0.94 });
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(75, 1100), sandMat);
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(-165, 0.02, 40);
  beach.receiveShadow = true;
  worldGroup.add(beach);

  // Arabian Sea Ocean (West)
  const oceanMat = new THREE.MeshPhysicalMaterial({
    color: '#0369a1',
    roughness: 0.18,
    metalness: 0.15,
    clearcoat: 0.85,
    clearcoatRoughness: 0.15,
  });
  const oceanMesh = new THREE.Mesh(new THREE.PlaneGeometry(600, 1400, 24, 24), oceanMat);
  oceanMesh.rotation.x = -Math.PI / 2;
  oceanMesh.position.set(-485, -0.35, 0);
  worldGroup.add(oceanMesh);

  // Vembanad & Kuttanad Backwater Lake (South-West: x = -420..-90, z = 165..430)
  const backwaterLake = new THREE.Mesh(new THREE.PlaneGeometry(420, 290), oceanMat);
  backwaterLake.rotation.x = -Math.PI / 2;
  backwaterLake.position.set(-250, -0.25, 290);
  worldGroup.add(backwaterLake);

  // Eastern Backwater Canal strip connecting Kochi to South
  const canal = new THREE.Mesh(new THREE.PlaneGeometry(450, 42), oceanMat);
  canal.rotation.x = -Math.PI / 2;
  canal.position.set(160, -0.28, 192);
  worldGroup.add(canal);

  // =========================================================================
  // EXPANDED REGION A: ALAPPUZHA KUTTANAD BACKWATER ISLANDS (x: -255, z: 270)
  // =========================================================================
  const paddyMat = new THREE.MeshStandardMaterial({ color: '#4d7c0f', roughness: 0.88 });
  const island1 = new THREE.Mesh(new THREE.BoxGeometry(115, 0.65, 95), paddyMat);
  island1.position.set(-255, 0.05, 270);
  island1.receiveShadow = true;
  worldGroup.add(island1);

  const island2 = new THREE.Mesh(new THREE.BoxGeometry(85, 0.65, 70), paddyMat);
  island2.position.set(-290, 0.05, 365);
  island2.receiveShadow = true;
  worldGroup.add(island2);

  // Kuttanad Toddy/Village Heritage Building & Houseboats
  addBuildingBox(
    worldGroup,
    colliders,
    -255,
    250,
    13,
    4.8,
    9,
    '#fef3c7',
    '#b45309',
    'Kuttanad Kayal Hub',
    'കുട്ടനാട് കായൽ',
    true,
    '#14532d',
    '#fde047',
    'south'
  );

  // Traditional Kerala Kettuvallam Houseboats moored in Alappuzha Backwaters
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
    houseboat.add(hull);
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.1, 9.5, 10, 1, false, 0, Math.PI), thatchMat);
    canopy.rotation.z = Math.PI / 2;
    canopy.rotation.y = Math.PI / 2;
    canopy.position.set(0, 0.85, -0.5);
    houseboat.add(canopy);
    worldGroup.add(houseboat);
  }

  // =========================================================================
  // EXPANDED REGION B: MUNNAR TEA ESTATES & WAYANAD GHATS (NE: x: 200..420, z: -380..-130)
  // =========================================================================
  const teaGreenMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.9 });
  const teaDeepMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.92 });
  const cliffRockMat = new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.95 });

  // Terraced Munnar Tea Hills around (315, -240)
  const teaHills: Array<[number, number, number, number]> = [
    [350, -200, 42, 18],
    [380, -270, 52, 24],
    [280, -185, 34, 14],
    [290, -295, 44, 20],
    [215, -365, 48, 26],
    [340, -355, 55, 28],
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

    // Tea bush contour rows
    const row = new THREE.Mesh(
      new THREE.TorusGeometry(tr * 0.55, 1.4, 6, 18),
      teaDeepMat
    );
    row.rotation.x = Math.PI / 2;
    row.position.set(tx, th * 0.35, tz);
    worldGroup.add(row);
  }

  // Munnar Tea Factory & Highland Resort
  addBuildingBox(
    worldGroup,
    colliders,
    315,
    -252,
    20,
    7.5,
    13,
    '#f8fafc',
    '#15803d',
    'Munnar Tea Estate',
    'മൂന്നാർ തേയില ഫാക്ടറി',
    true,
    '#14532d',
    '#fde047',
    'south'
  );

  // Wayanad Ghat Cliff & Waterfall (x: 245, z: -330)
  const ghatCliff = new THREE.Mesh(new THREE.BoxGeometry(36, 22, 26), cliffRockMat);
  ghatCliff.position.set(252, 10, -356);
  worldGroup.add(ghatCliff);
  const waterfall = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 21),
    new THREE.MeshPhysicalMaterial({ color: '#bae6fd', roughness: 0.1, emissive: '#38bdf8', emissiveIntensity: 0.25 })
  );
  waterfall.position.set(252, 10.5, -342.8);
  worldGroup.add(waterfall);

  // =========================================================================
  // EXPANDED REGION C: THIRUVANANTHAPURAM SECRETARIAT & KOVALAM (z: 240..400)
  // =========================================================================
  // Enterable Grand Kerala Secretariat Complex with Walkthrough Atrium Hall!
  addWalkthroughInteriorBuilding(
    worldGroup,
    colliders,
    55,
    315,
    34,
    11.5,
    24,
    '#fef3c7',
    '#b91c1c',
    '#e2e8f0',
    'Kerala Secretariat',
    'തിരുവനന്തപുരം സെക്രട്ടേറിയറ്റ്',
    'north',
    true,
    false,
    true
  );

  // Kovalam Red-and-White Lighthouse (x: -135, z: 365)
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

  // Thrissur Swaraj Round Heritage Pavilion (x: -25, z: -235)
  addBuildingBox(
    worldGroup,
    colliders,
    -25,
    -248,
    18,
    7.0,
    12,
    '#fffbeb',
    '#b45309',
    'Thrissur Heritage Hall',
    'തൃശ്ശൂർ സ്വരാജ് റൗണ്ട്',
    true,
    '#7c2d12',
    '#fde047',
    'south'
  );

  // Distant Western Ghats Horizon Perimeter (natural hills)
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
  }

  // =========================================================================
  // 2. INTERCONNECTED KERALA ROAD & HIGHWAY NETWORK
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
  addRoadSegment(0, 0, 560, 16, false);    // Extended NH-66 Spine North to Thrissur & South to Trivandrum!
  addRoadSegment(90, 0, 360, 14, false);

  addRoadSegment(0, -96, 360, 14, true);
  addRoadSegment(-10, 0, 340, 14, true);
  addRoadSegment(10, 88, 340, 14, true);
  addRoadSegment(-145, 18, 52, 10, true);

  // Expanded Highways to New Kerala Regions:
  // 1) NH-66 North to Thrissur (-25, -235)
  addRoadSegment(0, -210, 120, 14, true);
  // 2) Highway East-North-East to Munnar Tea Estates & Wayanad Ghats
  addRoadSegment(195, -210, 260, 13, true);
  addRoadSegment(315, -270, 160, 13, false);
  addRoadSegment(275, -330, 100, 12, true);
  // 3) Bridge & Coastal Highway South-West to Alappuzha Kuttanad Backwater Island (-255, 270)
  addRoadSegment(-120, 225, 180, 14, false, 0.45);
  addRoadSegment(-190, 270, 155, 12, true, 0.45);
  // 4) Southern Highway to Thiruvananthapuram Secretariat (55, 315) & Kovalam Lighthouse (-135, 365)
  addRoadSegment(0, 280, 160, 16, false, 0.45);
  addRoadSegment(30, 280, 90, 14, true);
  addRoadSegment(-65, 360, 175, 12, true);

  // =========================================================================
  // 3. CENTRAL FORT KOCHI & ERNAKULAM BUILDINGS (INCLUDING ENTERABLE HOMES!)
  // =========================================================================
  // Player's Starter Tharavadu Home (-72, 68) — ENTERABLE INTERIOR + HOME CHECKPOINT!
  addWalkthroughInteriorBuilding(
    worldGroup,
    colliders,
    -72,
    68,
    14,
    5.2,
    11,
    '#fef3c7',
    '#b45309',
    '#d6b37c',
    'Kochi Tharavadu',
    'തറവാട് വീട്',
    'south',
    true,
    true,
    false
  );

  // Vembanad Pearl Luxury Mansion (138, 142) — ENTERABLE LUXURY HALL + POOL!
  addWalkthroughInteriorBuilding(
    worldGroup,
    colliders,
    138,
    142,
    22,
    9.0,
    16,
    '#f8fafc',
    '#0f172a',
    '#e2e8f0',
    'Vembanad Pearl Mansion',
    'വേമ്പനാട് മാൻഷൻ',
    'north',
    false,
    true,
    false
  );
  const pool = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.25, 7),
    new THREE.MeshPhysicalMaterial({ color: '#06b6d4', roughness: 0.1, clearcoat: 1 })
  );
  pool.position.set(138, 0.15, 126);
  worldGroup.add(pool);

  // Core Town Buildings
  addBuildingBox(worldGroup, colliders, -24, 22, 10, 4.6, 8, '#fde68a', '#9a3412', 'Nadan Chaya Kadai', 'നാടൻ ചായക്കട', true, '#78350f', '#fef08a', 'south');
  addBuildingBox(worldGroup, colliders, 22, 24, 18, 6.2, 12, '#e2e8f0', '#b91c1c', 'KSRTC Bus Terminal', 'ബസ് ടെർമിനൽ', false, '#991b1b', '#fef08a', 'north');
  addBuildingBox(worldGroup, colliders, 68, -42, 20, 10.5, 15, '#f8fafc', '#0284c7', 'General Hospital', 'ജനറൽ ആശുപത്രി', false, '#0c4a6e', '#38bdf8', 'south');
  addBuildingBox(worldGroup, colliders, -68, -38, 16, 7.2, 12, '#e7d3b0', '#1e3a8a', 'Kerala Police HQ', 'പോലീസ് സ്റ്റേഷൻ', true, '#1e3a8a', '#facc15', 'south');
  addBuildingBox(worldGroup, colliders, 24, -86, 22, 9.5, 14, '#f1f5f9', '#9a3412', 'District Collectorate', 'ജില്ലാ കളക്ടറേറ്റ്', true, '#1e293b', '#f59e0b', 'north');
  addBuildingBox(worldGroup, colliders, -22, -112, 18, 6.8, 12, '#1e293b', '#f59e0b', 'Malabar Auto Showroom', 'വാഹന ഷോറൂം', false, '#0f172a', '#f59e0b', 'south');
  addBuildingBox(worldGroup, colliders, 118, -16, 14, 7.4, 24, '#fef2f2', '#b91c1c', 'Ernakulam Junction', 'എറണാകുളം റെയിൽവേ', true, '#7f1d1d', '#fde047', 'west');
  addBuildingBox(worldGroup, colliders, 168, -135, 26, 10.5, 16, '#e0f2fe', '#0369a1', 'Cochin Air Terminal', 'കൊച്ചി വിമാനത്താവളം', true, '#0f172a', '#38bdf8', 'south');

  const extraBuildings: Array<[number, number, number, number, number, string, string, string]> = [
    [-44, -22, 12, 8, 10, '#f8fafc', '#9a3412', 'Malabar Silks'],
    [-95, -24, 14, 11, 12, '#e2e8f0', '#334155', 'Marine Suites'],
    [-95, 24, 13, 9, 11, '#fef9c3', '#9a3412', 'Kochi Bakery'],
    [-48, 24, 11, 7, 10, '#e0f2fe', '#0284c7', 'Spice Market'],
    [-95, -66, 15, 12, 11, '#f1f5f9', '#475569', 'Harbor Plaza'],
    [45, 24, 14, 10, 11, '#fef3c7', '#b45309', 'Highland Hotel'],
    [45, 62, 16, 13, 12, '#e2e8f0', '#0f172a', 'City Mall'],
    [-25, 64, 14, 6.5, 11, '#fefce8', '#9a3412', 'Govt High School'],
    [62, -74, 13, 8.5, 11, '#f8fafc', '#15803d', 'Kerala Co-op Bank'],
    [136, 56, 16, 8, 12, '#fef3c7', '#9a3412', 'Backwater Resort'],
  ];
  for (const [bx, bz, bw, bh, bd, wc, rc, name] of extraBuildings) {
    addBuildingBox(worldGroup, colliders, bx, bz, bw, bh, bd, wc, rc, name, 'കേരള നഗരം', true, '#1e293b', '#f59e0b', 'south');
  }

  // 4. Boat Jetty & Chinese Fishing Nets
  const woodMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
  const jetty = new THREE.Mesh(new THREE.BoxGeometry(26, 0.7, 8), woodMat);
  jetty.position.set(-185, 0.35, 18);
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

  // 5. Rideable Kerala Express Railway Track & Passenger Train (x = 136, z = -340..340)
  const railMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.7, roughness: 0.35 });
  const ballast = new THREE.Mesh(new THREE.BoxGeometry(5, 0.14, 720), new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.95 }));
  ballast.position.set(136, 0.07, 0);
  worldGroup.add(ballast);
  for (const offset of [-0.9, 0.9]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 720), railMat);
    rail.position.set(136 + offset, 0.2, 0);
    worldGroup.add(rail);
  }

  const trainGroup = new THREE.Group();
  trainGroup.position.set(136, 0.3, -120);
  const locoMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.35, metalness: 0.3 });
  const coachMat = new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.4, metalness: 0.2 });
  const coachWindowMat = new THREE.MeshStandardMaterial({ color: '#bae6fd', transparent: true, opacity: 0.45 });

  // Locomotive
  const loco = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.8, 12), locoMat);
  loco.position.set(0, 1.9, 8);
  loco.castShadow = true;
  trainGroup.add(loco);

  // Coach 1 (Boardable Open Interior Coach centered at local z = -6!)
  const coachFloor = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.2, 13.5), new THREE.MeshStandardMaterial({ color: '#334155' }));
  coachFloor.position.set(0, 0.4, -6);
  const coachRoof = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.25, 13.5), coachMat);
  coachRoof.position.set(0, 3.6, -6);
  const coachWallL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.0, 13.5), coachWindowMat);
  coachWallL.position.set(-1.48, 2.0, -6);
  const coachWallR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.0, 13.5), coachWindowMat);
  coachWallR.position.set(1.48, 2.0, -6);
  trainGroup.add(coachFloor, coachRoof, coachWallL, coachWallR);

  // Seats inside passenger coach
  const seatMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.7 });
  for (let sz = -10; sz <= -2; sz += 2.5) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 0.7), seatMat);
    seat.position.set(-0.7, 0.9, sz);
    trainGroup.add(seat);
  }

  // Trailing Coaches
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

  // 6. Instanced Coconut Palm Trees across entire Kerala map
  const palmPositions: Array<[number, number]> = [];
  const tryAddPalm = (px: number, pz: number) => {
    if (Math.abs(px) < 12 || Math.abs(px + 120) < 11 || Math.abs(px - 90) < 11 || Math.abs(px - 136) < 8) return;
    if (Math.abs(pz) < 11 || Math.abs(pz + 96) < 11 || Math.abs(pz - 88) < 11) return;
    if (px < -150 && pz > 165) return; // Keep off backwater lake
    for (const c of colliders) {
      if (px > c.minX - 4 && px < c.maxX + 4 && pz > c.minZ - 4 && pz < c.maxZ + 4) return;
    }
    palmPositions.push([px, pz]);
  };

  for (let gx = -320; gx <= 340; gx += 28) {
    for (let gz = -340; gz <= 360; gz += 28) {
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
  }
  trunkInst.computeBoundingSphere();
  crownInst.computeBoundingSphere();
  worldGroup.add(trunkInst, crownInst);

  // 7. Traffic Signals & Streetlamps
  const intersections: Array<[number, number]> = [
    [0, 0],
    [-120, 0],
    [90, 0],
    [0, -96],
    [-120, -96],
    [0, 88],
  ];
  const poleMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.6, roughness: 0.4 });
  for (const [ix, iz] of intersections) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 5.8, 8), poleMat);
    pole.position.set(ix - 9.5, 2.9, iz - 9.5);
    worldGroup.add(pole);

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), poleMat);
    box.position.set(ix - 9.5, 5.2, iz - 9.5);
    worldGroup.add(box);

    const nsRedMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.1 });
    const nsGreenMat = new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 1.5 });
    const ewRedMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 1.5 });
    const ewGreenMat = new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 0.1 });

    const nsR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), nsRedMat);
    nsR.position.set(ix - 9.5, 5.5, iz - 9.1);
    const nsG = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), nsGreenMat);
    nsG.position.set(ix - 9.5, 4.95, iz - 9.1);
    const ewR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), ewRedMat);
    ewR.position.set(ix - 9.1, 5.5, iz - 9.5);
    const ewG = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), ewGreenMat);
    ewG.position.set(ix - 9.1, 4.95, iz - 9.5);

    worldGroup.add(nsR, nsG, ewR, ewG);
    trafficSignals.push({ x: ix, z: iz, nsGreen: true, nsRedMat, nsGreenMat, ewRedMat, ewGreenMat });
  }

  const lampMat = new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#f59e0b', emissiveIntensity: 0.1 });
  streetLampBulbs.push(lampMat);
  for (let lz = -160; lz <= 320; lz += 42) {
    for (const lx of [-10, 10]) {
      const lPole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 6, 6), poleMat);
      lPole.position.set(lx, 3, lz);
      worldGroup.add(lPole);
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.35), lampMat);
      bulb.position.set(lx + (lx < 0 ? 0.6 : -0.6), 5.9, lz);
      worldGroup.add(bulb);
    }
  }

  // Ground rings at service & checkpoint locations
  for (const loc of WORLD_LOCATIONS) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: loc.type === 'home' ? '#10b981' : loc.type === 'hospital' ? '#ef4444' : loc.type === 'police' ? '#3b82f6' : '#f59e0b',
      transparent: true,
      opacity: 0.48,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.95, 24), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(loc.x, 0.08, loc.z + (loc.type === 'home' ? 10 : 0));
    worldGroup.add(ring);
  }

  // Train schedule state: loops between z = -300 and z = +300 with station stops at Ernakulam (-16) & South (240)
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

    // Train station stop & travel logic
    if (trainStopTimer > 0) {
      trainStopTimer -= dt;
      trainState.speed = 0;
      trainState.isStoppedAtStation = true;
    } else {
      trainState.isStoppedAtStation = false;
      trainState.speed = 16;
      trainState.z += trainState.speed * dt;
      if (trainState.z > 320) {
        trainState.z = -320;
        lastStoppedZ = -999;
      }
      // Stop for 5.5s at Ernakulam Junction (-16) and Thiruvananthapuram Central (240)
      for (const [stopZ, label] of [
        [-16, 'Ernakulam Junction'],
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
    oceanMesh.position.y = -0.35 + Math.sin(elapsed * 1.4) * 0.12;
  };

  return {
    colliders,
    trafficSignals,
    streetLampBulbs,
    oceanMesh,
    trainGroup,
    trainState,
    roadMaterial,
    updateDynamicWorld,
  };
}
