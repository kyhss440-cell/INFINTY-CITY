import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

function finalizeTexture(
  canvas: HTMLCanvasElement,
  key: string,
  repeatX = 1,
  repeatY = 1,
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

export function getAsphaltTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const key = 'asphalt_kerala_lh';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark weathered monsoon asphalt base
  ctx.fillStyle = '#252930';
  ctx.fillRect(0, 0, 512, 512);

  // Mineral aggregate speckle
  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = 28 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 5})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Subtle tire wear tracks (left-hand lanes)
  ctx.fillStyle = 'rgba(15, 18, 22, 0.25)';
  ctx.fillRect(80, 0, 120, 512);
  ctx.fillRect(312, 0, 120, 512);

  // Road shoulder white edge lines
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(14, 0, 8, 512);
  ctx.fillRect(490, 0, 8, 512);

  // Indian highway dashed yellow center divider
  ctx.fillStyle = '#f59e0b';
  for (let y = 16; y < 512; y += 64) {
    ctx.fillRect(252, y, 8, 36);
  }

  return finalizeTexture(canvas, key, 1, 1, maxAnisotropy);
}

export function getGrassPaddyTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const key = 'kerala_grass_paddy';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#36682c';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const g = 75 + Math.floor(Math.random() * 55);
    const r = 34 + Math.floor(Math.random() * 32);
    ctx.fillStyle = `rgb(${r},${g},28)`;
    ctx.fillRect(x, y, 2, 4);
  }

  return finalizeTexture(canvas, key, 32, 32, maxAnisotropy);
}

export function getMangaloreTileTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const key = 'mangalore_roof_tiles';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#9a3412';
  ctx.fillRect(0, 0, 256, 256);

  for (let row = 0; row < 16; row++) {
    const y = row * 16;
    ctx.fillStyle = row % 2 === 0 ? '#b45309' : '#9a3412';
    ctx.fillRect(0, y, 256, 15);
    ctx.fillStyle = 'rgba(40, 12, 5, 0.35)';
    ctx.fillRect(0, y + 14, 256, 2);
    for (let col = 0; col < 16; col++) {
      ctx.fillStyle = 'rgba(255, 200, 150, 0.08)';
      ctx.fillRect(col * 16 + 2, y + 2, 10, 10);
      ctx.fillStyle = 'rgba(30, 8, 2, 0.28)';
      ctx.fillRect(col * 16, y, 2, 16);
    }
  }

  return finalizeTexture(canvas, key, 4, 4, maxAnisotropy);
}

export function getSidewalkTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const key = 'kerala_interlock_paver';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#78716c';
  ctx.fillRect(0, 0, 256, 256);

  // Interlocking concrete tiles common across Kerala towns
  for (let y = 0; y < 256; y += 32) {
    for (let x = 0; x < 256; x += 32) {
      const tint = (x / 32 + y / 32) % 2 === 0 ? '#9ca3af' : '#b97b63';
      ctx.fillStyle = tint;
      ctx.fillRect(x + 2, y + 2, 28, 28);
    }
  }

  return finalizeTexture(canvas, key, 8, 8, maxAnisotropy);
}

export function createSignboardTexture(
  titleEn: string,
  titleMl: string,
  bgHex = '#0f172a',
  fgHex = '#f8fafc',
  accentHex = '#f59e0b'
): THREE.CanvasTexture {
  const key = `sign_${titleEn}_${titleMl}_${bgHex}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 144);

  ctx.fillStyle = accentHex;
  ctx.font = 'bold 40px "Noto Sans Malayalam", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(titleMl, 256, 68);

  ctx.fillStyle = fgHex;
  ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(titleEn.toUpperCase(), 256, 118);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

export function createPlateTexture(plateText: string, isCommercial = false): THREE.CanvasTexture {
  const key = `plate_${plateText}_${isCommercial}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isCommercial ? '#facc15' : '#f8fafc';
  ctx.fillRect(0, 0, 256, 64);

  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(0, 0, 22, 64);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('IND', 2, 42);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 252, 60);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(plateText, 138, 42);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

export function createHumanSkinTexture(
  skinHex: string,
  eyeHex: string,
  facialHair: 'none' | 'mustache' | 'stubble' | 'fullBeard',
  gender: 'male' | 'female',
  ageGroup: 'child' | 'teen' | 'adult' | 'senior'
): THREE.CanvasTexture {
  const key = `face_${skinHex}_${eyeHex}_${facialHair}_${gender}_${ageGroup}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base warm skin tone
  ctx.fillStyle = skinHex;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle cheek/nose warmth gradient (organic subsurface feel)
  const cheekGrad = ctx.createRadialGradient(90, 148, 4, 90, 148, 36);
  cheekGrad.addColorStop(0, 'rgba(195, 78, 65, 0.22)');
  cheekGrad.addColorStop(1, 'rgba(195, 78, 65, 0)');
  ctx.fillStyle = cheekGrad;
  ctx.fillRect(45, 110, 90, 80);

  const cheekGradR = ctx.createRadialGradient(166, 148, 4, 166, 148, 36);
  cheekGradR.addColorStop(0, 'rgba(195, 78, 65, 0.22)');
  cheekGradR.addColorStop(1, 'rgba(195, 78, 65, 0)');
  ctx.fillStyle = cheekGradR;
  ctx.fillRect(120, 110, 90, 80);

  // Subtle skin micro-pores / tone variation
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.025)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  // Under-eye / brow shading
  ctx.fillStyle = 'rgba(40, 20, 15, 0.14)';
  ctx.beginPath();
  ctx.ellipse(92, 108, 22, 10, 0, 0, Math.PI * 2);
  ctx.ellipse(164, 108, 22, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows
  ctx.strokeStyle = ageGroup === 'senior' ? '#9ca3af' : '#181412';
  ctx.lineWidth = gender === 'male' ? 6 : 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(72, 95);
  ctx.quadraticCurveTo(94, 87, 112, 94);
  ctx.moveTo(144, 94);
  ctx.quadraticCurveTo(162, 87, 184, 95);
  ctx.stroke();

  // Nose bridge shadow
  ctx.fillStyle = 'rgba(45, 22, 12, 0.16)';
  ctx.fillRect(123, 108, 10, 34);

  // Lips
  ctx.fillStyle = gender === 'female' ? '#9f3e48' : '#7c3f38';
  ctx.beginPath();
  ctx.ellipse(128, 174, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30, 10, 10, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(111, 174);
  ctx.lineTo(145, 174);
  ctx.stroke();

  // Facial hair details
  if (facialHair === 'stubble') {
    ctx.fillStyle = 'rgba(20, 18, 18, 0.18)';
    for (let i = 0; i < 450; i++) {
      const x = 86 + Math.random() * 84;
      const y = 162 + Math.random() * 52;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  } else if (facialHair === 'mustache') {
    ctx.fillStyle = ageGroup === 'senior' ? '#9ca3af' : '#1b1715';
    ctx.beginPath();
    ctx.moveTo(106, 164);
    ctx.quadraticCurveTo(128, 155, 150, 164);
    ctx.quadraticCurveTo(128, 168, 106, 164);
    ctx.fill();
  } else if (facialHair === 'fullBeard') {
    ctx.fillStyle = ageGroup === 'senior' ? '#9ca3af' : '#1b1715';
    ctx.beginPath();
    ctx.moveTo(82, 154);
    ctx.quadraticCurveTo(128, 224, 174, 154);
    ctx.lineTo(168, 210);
    ctx.quadraticCurveTo(128, 236, 88, 210);
    ctx.closePath();
    ctx.fill();
  }

  // Senior forehead / smile lines
  if (ageGroup === 'senior') {
    ctx.strokeStyle = 'rgba(60, 35, 20, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(92, 62);
    ctx.lineTo(164, 62);
    ctx.moveTo(96, 70);
    ctx.lineTo(160, 70);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

export function createClothingPatternTexture(
  baseColor: string,
  secondaryColor: string,
  accentColor: string,
  pattern: 'kasavu' | 'plaid' | 'stripes' | 'munduBorder' | 'uniform'
): THREE.CanvasTexture {
  const key = `cloth_${baseColor}_${secondaryColor}_${accentColor}_${pattern}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);

  if (pattern === 'kasavu') {
    // Cream fabric with woven gold Kasavu border
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 212, 256, 28);
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 206, 256, 5);
    ctx.fillRect(0, 242, 256, 4);
  } else if (pattern === 'munduBorder') {
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 224, 256, 14);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(0, 220, 256, 3);
  } else if (pattern === 'plaid') {
    ctx.fillStyle = secondaryColor;
    ctx.globalAlpha = 0.28;
    for (let i = 0; i < 256; i += 32) {
      ctx.fillRect(i, 0, 8, 256);
      ctx.fillRect(0, i, 256, 8);
    }
    ctx.globalAlpha = 1;
  } else if (pattern === 'stripes') {
    ctx.fillStyle = secondaryColor;
    for (let i = 0; i < 256; i += 24) {
      ctx.fillRect(i, 0, 6, 256);
    }
  } else if (pattern === 'uniform') {
    ctx.fillStyle = secondaryColor;
    ctx.fillRect(0, 0, 256, 24);
    ctx.fillStyle = accentColor;
    ctx.fillRect(24, 56, 48, 48);
  }

  // Subtle fabric weave grain
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let y = 0; y < 256; y += 4) {
    ctx.fillRect(0, y, 256, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}
