import * as THREE from 'three';
import { HumanAppearance } from '../../types/game';
import {
  createClothingPatternTexture,
  createHumanSkinTexture,
} from '../materials/ProceduralTextures';

export interface HumanRig {
  root: THREE.Group;
  pelvis: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  jaw: THREE.Group;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  leftEyelid: THREE.Mesh;
  rightEyelid: THREE.Mesh;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  leftKnee: THREE.Group;
  rightHip: THREE.Group;
  rightKnee: THREE.Group;
  highDetailGroup: THREE.Group;
  lowDetailProxy: THREE.Mesh;
  appearance: HumanAppearance;
}

// Shared low-overhead geometry cache to maximize instancing/memory efficiency
const sharedGeo = {
  eyeWhite: new THREE.SphereGeometry(0.017, 10, 10),
  iris: new THREE.SphereGeometry(0.011, 10, 10),
  pupil: new THREE.SphereGeometry(0.006, 8, 8),
  eyelid: new THREE.SphereGeometry(0.0185, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
  ear: new THREE.SphereGeometry(0.022, 8, 8),
  nose: new THREE.ConeGeometry(0.016, 0.044, 6),
  upperArm: new THREE.CylinderGeometry(0.046, 0.04, 0.27, 10),
  forearm: new THREE.CylinderGeometry(0.038, 0.031, 0.25, 10),
  hand: new THREE.SphereGeometry(0.036, 10, 8),
  thigh: new THREE.CylinderGeometry(0.068, 0.056, 0.41, 10),
  calf: new THREE.CylinderGeometry(0.052, 0.038, 0.39, 10),
  shoe: new THREE.BoxGeometry(0.088, 0.055, 0.21),
  proxyBody: new THREE.CylinderGeometry(0.18, 0.2, 1.65, 8),
};

export function buildHumanRig(appearance: HumanAppearance): HumanRig {
  const root = new THREE.Group();
  root.scale.set(
    appearance.heightScale * appearance.buildScale,
    appearance.heightScale,
    appearance.heightScale * appearance.buildScale
  );

  const highDetailGroup = new THREE.Group();
  root.add(highDetailGroup);

  // Distant LOD proxy (>85m)
  const proxyMat = new THREE.MeshStandardMaterial({
    color: appearance.primaryColor,
    roughness: 0.75,
  });
  const lowDetailProxy = new THREE.Mesh(sharedGeo.proxyBody, proxyMat);
  lowDetailProxy.position.y = 0.825;
  lowDetailProxy.visible = false;
  root.add(lowDetailProxy);

  const skinTex = createHumanSkinTexture(
    appearance.skinTone,
    appearance.eyeColor,
    appearance.facialHair,
    appearance.gender,
    appearance.ageGroup
  );

  const skinMat = new THREE.MeshStandardMaterial({
    color: appearance.skinTone,
    roughness: 0.62,
    metalness: 0.02,
  });

  const faceMat = new THREE.MeshStandardMaterial({
    map: skinTex,
    roughness: 0.58,
    metalness: 0.02,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: appearance.hairColor,
    roughness: 0.78,
    metalness: 0.05,
  });

  // Clothing materials
  const isSaree = appearance.outfit === 'kasavuSaree';
  const isMundu =
    appearance.outfit === 'shirtMundu' ||
    appearance.outfit === 'autoDriver' ||
    appearance.outfit === 'fishermanLungi';

  const topPattern =
    appearance.outfit === 'fishermanLungi' || appearance.outfit === 'shirtMundu'
      ? 'plaid'
      : appearance.outfit === 'trafficPolice' || appearance.outfit === 'policeUniform' || appearance.outfit === 'busCrew'
      ? 'uniform'
      : isSaree
      ? 'kasavu'
      : 'stripes';

  const topTex = createClothingPatternTexture(
    appearance.primaryColor,
    appearance.secondaryColor,
    appearance.accentColor,
    topPattern
  );
  const topMat = new THREE.MeshStandardMaterial({
    map: topTex,
    roughness: 0.76,
    metalness: 0.04,
  });

  const bottomTex = createClothingPatternTexture(
    appearance.secondaryColor,
    appearance.primaryColor,
    appearance.accentColor,
    isSaree ? 'kasavu' : isMundu ? 'munduBorder' : 'uniform'
  );
  const bottomMat = new THREE.MeshStandardMaterial({
    map: bottomTex,
    roughness: 0.8,
    metalness: 0.02,
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: appearance.outfit === 'fishermanLungi' ? '#451a03' : '#18181b',
    roughness: 0.6,
    metalness: 0.1,
  });

  // 1. Pelvis (anchored at hip height ~0.88m)
  const pelvis = new THREE.Group();
  pelvis.position.set(0, 0.88, 0);
  highDetailGroup.add(pelvis);

  const pelvisMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.15, 0.16, 12),
    bottomMat
  );
  pelvisMesh.scale.set(1.15, 1, 0.78);
  pelvisMesh.castShadow = true;
  pelvis.add(pelvisMesh);

  // 2. Spine & Chest
  const spine = new THREE.Group();
  spine.position.set(0, 0.08, 0);
  pelvis.add(spine);

  const torsoW = appearance.gender === 'female' ? 0.135 : 0.162;
  const waistW = appearance.gender === 'female' ? 0.115 : 0.138;
  const abdomen = new THREE.Mesh(
    new THREE.CylinderGeometry(torsoW * 0.92, waistW, 0.2, 12),
    topMat
  );
  abdomen.position.y = 0.1;
  abdomen.scale.set(1.1, 1, 0.75);
  abdomen.castShadow = true;
  spine.add(abdomen);

  const chest = new THREE.Group();
  chest.position.set(0, 0.2, 0);
  spine.add(chest);

  const chestMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(torsoW * 1.08, torsoW * 0.9, 0.24, 14),
    topMat
  );
  chestMesh.position.y = 0.12;
  chestMesh.scale.set(1.16, 1, 0.76);
  chestMesh.castShadow = true;
  chest.add(chestMesh);

  // Outfit-specific realistic garments (Saree pallu drape, Traffic vest, Doctor coat lapels)
  if (isSaree) {
    const pallu = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.44, 0.21),
      bottomMat
    );
    pallu.position.set(-0.08, 0.05, 0.01);
    pallu.rotation.z = 0.34;
    chest.add(pallu);
  }
  if (appearance.outfit === 'trafficPolice' || appearance.outfit === 'deliveryVest') {
    const vestMat = new THREE.MeshStandardMaterial({
      color: appearance.outfit === 'trafficPolice' ? '#f8fafc' : '#f97316',
      roughness: 0.45,
      emissive: appearance.outfit === 'trafficPolice' ? '#334155' : '#431407',
      emissiveIntensity: 0.25,
    });
    const vest = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 1.13, waistW * 1.08, 0.3, 12), vestMat);
    vest.position.y = 0.06;
    vest.scale.set(1.16, 1, 0.8);
    chest.add(vest);
  }
  if (appearance.outfit === 'doctorCoat') {
    const coatMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.65 });
    const coatBody = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.5, 12), coatMat);
    coatBody.position.y = -0.05;
    coatBody.scale.set(1.18, 1, 0.82);
    chest.add(coatBody);
  }
  if (appearance.prop === 'stethoscope') {
    const stethMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.5, roughness: 0.3 });
    const steth = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.01, 8, 16, Math.PI * 1.3), stethMat);
    steth.position.set(0, 0.22, 0.03);
    steth.rotation.x = Math.PI / 2.2;
    steth.rotation.z = Math.PI * 0.85;
    chest.add(steth);
  }

  // 3. Neck & Sculpted Realistic Head
  const neck = new THREE.Group();
  neck.position.set(0, 0.25, 0);
  chest.add(neck);

  const neckMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.056, 0.1, 10),
    skinMat
  );
  neckMesh.position.y = 0.04;
  neck.add(neckMesh);

  const head = new THREE.Group();
  head.position.set(0, 0.09, 0);
  neck.add(head);

  // Face shape proportions
  const shapeScale: Record<HumanAppearance['faceShape'], [number, number, number]> = {
    oval: [0.095, 0.122, 0.105],
    square: [0.102, 0.118, 0.104],
    round: [0.106, 0.114, 0.108],
    heart: [0.098, 0.12, 0.1],
    long: [0.089, 0.13, 0.104],
  };
  const [hx, hy, hz] = shapeScale[appearance.faceShape];

  const craniumGeo = new THREE.SphereGeometry(1, 20, 18);
  const cranium = new THREE.Mesh(craniumGeo, faceMat);
  cranium.scale.set(hx, hy, hz);
  cranium.position.y = hy * 0.95;
  // Rotate so UV face center aligns forward (+Z)
  cranium.rotation.y = -Math.PI / 2;
  cranium.castShadow = true;
  head.add(cranium);

  // Articulated Jaw / Chin
  const jaw = new THREE.Group();
  jaw.position.set(0, hy * 0.48, 0.015);
  head.add(jaw);

  const chin = new THREE.Mesh(
    new THREE.SphereGeometry(hx * 0.65, 12, 10),
    skinMat
  );
  chin.scale.set(0.95, 0.72, 0.9);
  chin.position.set(0, -0.015, 0.02);
  jaw.add(chin);

  // Nose bridge & tip
  const nose = new THREE.Mesh(sharedGeo.nose, skinMat);
  nose.position.set(0, hy * 0.9, hz * 0.96);
  nose.rotation.x = Math.PI * 0.35;
  head.add(nose);

  // Ears
  const earL = new THREE.Mesh(sharedGeo.ear, skinMat);
  earL.scale.set(0.45, 1.2, 0.75);
  earL.position.set(hx * 0.96, hy * 0.92, -0.01);
  head.add(earL);

  const earR = earL.clone();
  earR.position.x = -hx * 0.96;
  head.add(earR);

  // Detailed Eyes (Sclera + Iris + Pupil + Blinking Eyelid)
  const scleraMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.2 });
  const irisMat = new THREE.MeshStandardMaterial({ color: appearance.eyeColor, roughness: 0.15 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.1 });

  const buildEye = (side: number) => {
    const eyeGroup = new THREE.Mesh(sharedGeo.eyeWhite, scleraMat);
    eyeGroup.position.set(side * 0.036, hy * 1.03, hz * 0.83);

    const iris = new THREE.Mesh(sharedGeo.iris, irisMat);
    iris.position.set(0, 0, 0.008);
    eyeGroup.add(iris);

    const pupil = new THREE.Mesh(sharedGeo.pupil, pupilMat);
    pupil.position.set(0, 0, 0.013);
    eyeGroup.add(pupil);

    const eyelid = new THREE.Mesh(sharedGeo.eyelid, skinMat);
    eyelid.position.copy(eyeGroup.position);
    eyelid.rotation.x = -0.35; // Open state
    head.add(eyeGroup);
    head.add(eyelid);
    return { eyeGroup, eyelid };
  };

  const { eyeGroup: leftEye, eyelid: leftEyelid } = buildEye(1);
  const { eyeGroup: rightEye, eyelid: rightEyelid } = buildEye(-1);

  // Hairstyles
  const hairGroup = new THREE.Group();
  hairGroup.position.set(0, hy * 1.05, -0.006);
  head.add(hairGroup);

  if (appearance.hairStyle === 'shortSidePart' || appearance.hairStyle === 'slickBack') {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(hx * 1.06, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    cap.scale.set(1.02, 1.15, 1.06);
    cap.position.y = 0.01;
    hairGroup.add(cap);
  } else if (appearance.hairStyle === 'curlyVoluminous') {
    for (let c = 0; c < 9; c++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), hairMat);
      const a = (c / 9) * Math.PI * 2;
      puff.position.set(Math.cos(a) * 0.058, 0.045 + (c % 2) * 0.02, Math.sin(a) * 0.06);
      hairGroup.add(puff);
    }
    const topPuff = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), hairMat);
    topPuff.position.y = 0.075;
    hairGroup.add(topPuff);
  } else if (appearance.hairStyle === 'longBun') {
    const baseHair = new THREE.Mesh(
      new THREE.SphereGeometry(hx * 1.07, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65),
      hairMat
    );
    hairGroup.add(baseHair);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), hairMat);
    bun.position.set(0, -0.01, -hz * 1.02);
    hairGroup.add(bun);
    // Traditional Kerala jasmine gajra accent on bun
    const gajra = new THREE.Mesh(
      new THREE.TorusGeometry(0.044, 0.011, 6, 14),
      new THREE.MeshStandardMaterial({ color: '#fefce8', roughness: 0.85 })
    );
    gajra.position.set(0, -0.01, -hz * 0.96);
    hairGroup.add(gajra);
  } else if (appearance.hairStyle === 'braided' || appearance.hairStyle === 'shoulderLength') {
    const baseHair = new THREE.Mesh(
      new THREE.SphereGeometry(hx * 1.07, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65),
      hairMat
    );
    hairGroup.add(baseHair);
    const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.22, 12), hairMat);
    drape.position.set(0, -0.08, -0.04);
    hairGroup.add(drape);
  } else if (appearance.hairStyle === 'recedingSenior') {
    const sideBand = new THREE.Mesh(
      new THREE.TorusGeometry(hx * 0.92, 0.025, 8, 16, Math.PI * 1.35),
      hairMat
    );
    sideBand.rotation.x = Math.PI / 2;
    sideBand.rotation.z = Math.PI * 0.82;
    sideBand.position.y = -0.01;
    hairGroup.add(sideBand);
  } else if (appearance.hairStyle === 'policeCap') {
    const capCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.098, 0.075, 14),
      new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.5 })
    );
    capCrown.position.y = 0.075;
    hairGroup.add(capCrown);
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.014, 0.075),
      new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.25 })
    );
    visor.position.set(0, 0.045, 0.09);
    visor.rotation.x = 0.15;
    hairGroup.add(visor);
  } else if (appearance.hairStyle === 'sunHat') {
    const hatMat = new THREE.MeshStandardMaterial({ color: '#e7d3b0', roughness: 0.85 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.012, 16), hatMat);
    brim.position.y = 0.05;
    hairGroup.add(brim);
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.105, 0.08, 14), hatMat);
    dome.position.y = 0.09;
    hairGroup.add(dome);
  } else if (appearance.hairStyle === 'helmet') {
    const helmetMat = new THREE.MeshStandardMaterial({
      color: '#ea580c',
      roughness: 0.25,
      metalness: 0.35,
    });
    const shell = new THREE.Mesh(new THREE.SphereGeometry(hx * 1.25, 16, 14), helmetMat);
    shell.position.y = 0.01;
    hairGroup.add(shell);
  }

  // Eyeglasses / Sunglasses
  if (appearance.glasses || appearance.sunglasses) {
    const frameMat = new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.7, roughness: 0.2 });
    const lensMat = new THREE.MeshStandardMaterial({
      color: appearance.sunglasses ? '#09090b' : '#e0f2fe',
      roughness: 0.1,
      metalness: 0.6,
      transparent: !appearance.sunglasses,
      opacity: appearance.sunglasses ? 0.95 : 0.35,
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.006, 0.006), frameMat);
    bridge.position.set(0, hy * 1.04, hz * 0.97);
    head.add(bridge);
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.022, 0.006), lensMat);
      lens.position.set(side * 0.034, hy * 1.04, hz * 0.97);
      head.add(lens);
    }
  }

  // 4. Arms (Shoulders -> Elbows -> Hands + Handheld Props)
  const buildArm = (side: number) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * (torsoW * 1.32), 0.21, 0);
    chest.add(shoulder);

    const upperArm = new THREE.Mesh(sharedGeo.upperArm, topMat);
    upperArm.position.y = -0.135;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.27, 0);
    shoulder.add(elbow);

    const forearm = new THREE.Mesh(sharedGeo.forearm, skinMat);
    forearm.position.y = -0.125;
    forearm.castShadow = true;
    elbow.add(forearm);

    const hand = new THREE.Mesh(sharedGeo.hand, skinMat);
    hand.position.y = -0.25;
    elbow.add(hand);

    return { shoulder, elbow, hand };
  };

  const leftArm = buildArm(1);
  const rightArm = buildArm(-1);

  // Attach handheld props to right hand or shoulder
  if (appearance.prop === 'phone') {
    const phone = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.09, 0.012),
      new THREE.MeshStandardMaterial({ color: '#0f172a', emissive: '#38bdf8', emissiveIntensity: 0.4 })
    );
    phone.position.set(0, -0.02, 0.04);
    rightArm.hand.add(phone);
  } else if (appearance.prop === 'teaGlass') {
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.022, 0.075, 10),
      new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.2, transparent: true, opacity: 0.85 })
    );
    glass.position.set(0, -0.02, 0.04);
    rightArm.hand.add(glass);
  } else if (appearance.prop === 'bag') {
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.22, 0.08),
      new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.8 })
    );
    bag.position.set(0.06, -0.08, 0);
    leftArm.hand.add(bag);
  } else if (appearance.prop === 'camera') {
    const cam = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.055, 0.045),
      new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.6, roughness: 0.3 })
    );
    cam.position.set(0, 0.08, 0.14);
    chest.add(cam);
  } else if (appearance.prop === 'ticketMachine') {
    const machine = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.11, 0.04),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4 })
    );
    machine.position.set(0, -0.02, 0.04);
    rightArm.hand.add(machine);
  }

  // 5. Legs (Hips -> Knees -> Shoes)
  const buildLeg = (side: number) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.085, -0.05, 0);
    pelvis.add(hip);

    const thigh = new THREE.Mesh(
      sharedGeo.thigh,
      isSaree || isMundu ? bottomMat : bottomMat
    );
    thigh.position.y = -0.205;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.set(0, -0.41, 0);
    hip.add(knee);

    const calf = new THREE.Mesh(
      sharedGeo.calf,
      isSaree || isMundu ? bottomMat : appearance.ageGroup === 'child' ? skinMat : bottomMat
    );
    calf.position.y = -0.195;
    calf.castShadow = true;
    knee.add(calf);

    const shoe = new THREE.Mesh(sharedGeo.shoe, shoeMat);
    shoe.position.set(0, -0.395, 0.04);
    shoe.castShadow = true;
    knee.add(shoe);

    return { hip, knee };
  };

  const leftLeg = buildLeg(1);
  const rightLeg = buildLeg(-1);

  return {
    root,
    pelvis,
    spine,
    chest,
    neck,
    head,
    jaw,
    leftEye,
    rightEye,
    leftEyelid,
    rightEyelid,
    leftShoulder: leftArm.shoulder,
    leftElbow: leftArm.elbow,
    rightShoulder: rightArm.shoulder,
    rightElbow: rightArm.elbow,
    leftHip: leftLeg.hip,
    leftKnee: leftLeg.knee,
    rightHip: rightLeg.hip,
    rightKnee: rightLeg.knee,
    highDetailGroup,
    lowDetailProxy,
    appearance,
  };
}
