import * as THREE from 'three';
import { TimePeriod, WeatherType } from '../../types/game';

export interface WeatherAndTimeHandle {
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  update: (
    dt: number,
    elapsed: number,
    playerPos: THREE.Vector3,
    timePeriod: TimePeriod,
    weather: WeatherType,
    isSoftwareGl: boolean
  ) => { isNight: boolean; wetness: number; rainIntensity: number };
  dispose: () => void;
}

const TIME_CONFIG: Record<
  TimePeriod,
  {
    skyColor: number;
    fogColor: number;
    sunPos: [number, number, number];
    sunColor: number;
    sunIntensity: number;
    hemiSky: number;
    hemiGround: number;
    hemiIntensity: number;
    isNight: boolean;
  }
> = {
  sunrise: {
    skyColor: 0xf4a261,
    fogColor: 0xe9b48a,
    sunPos: [140, 38, -60],
    sunColor: 0xffb77a,
    sunIntensity: 1.4,
    hemiSky: 0xfde68a,
    hemiGround: 0x3b4d36,
    hemiIntensity: 0.75,
    isNight: false,
  },
  morning: {
    skyColor: 0x7dd3fc,
    fogColor: 0xbae6fd,
    sunPos: [95, 115, 65],
    sunColor: 0xfffbeb,
    sunIntensity: 1.85,
    hemiSky: 0x93c5fd,
    hemiGround: 0x3f6212,
    hemiIntensity: 0.85,
    isNight: false,
  },
  afternoon: {
    skyColor: 0x60a5fa,
    fogColor: 0xbfdbfe,
    sunPos: [-50, 145, 70],
    sunColor: 0xfff7ed,
    sunIntensity: 1.95,
    hemiSky: 0x7dd3fc,
    hemiGround: 0x365314,
    hemiIntensity: 0.85,
    isNight: false,
  },
  sunset: {
    skyColor: 0xc26d5a,
    fogColor: 0xd98a6c,
    sunPos: [-160, 32, 30],
    sunColor: 0xfb923c,
    sunIntensity: 1.45,
    hemiSky: 0xfdba74,
    hemiGround: 0x293524,
    hemiIntensity: 0.7,
    isNight: false,
  },
  night: {
    skyColor: 0x0b132b,
    fogColor: 0x0f172a,
    sunPos: [-60, 110, -40],
    sunColor: 0x93c5fd,
    sunIntensity: 0.42,
    hemiSky: 0x1e293b,
    hemiGround: 0x0f172a,
    hemiIntensity: 0.48,
    isNight: true,
  },
};

export function createWeatherAndTimeSystem(
  scene: THREE.Scene,
  isSoftwareGl: boolean
): WeatherAndTimeHandle {
  const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x3f6212, 0.85);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.85);
  sunLight.position.set(80, 110, 60);
  sunLight.castShadow = !isSoftwareGl;
  sunLight.shadow.mapSize.width = isSoftwareGl ? 512 : 2048;
  sunLight.shadow.mapSize.height = isSoftwareGl ? 512 : 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 320;
  const d = 95;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.025;
  scene.add(sunLight);
  scene.add(sunLight.target);

  const skyColor = new THREE.Color(0x7dd3fc);
  const fogColor = new THREE.Color(0xbae6fd);
  scene.background = skyColor;
  scene.fog = new THREE.FogExp2(fogColor.getHex(), 0.0022);

  // Monsoon Rain Particle System (allocated once, zero GC in loop)
  const rainCount = 900;
  const rainPositions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 90;
    rainPositions[i * 3 + 1] = Math.random() * 35;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.PointsMaterial({
    color: 0xcbd5e1,
    size: 0.28,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const rainPoints = new THREE.Points(rainGeo, rainMat);
  rainPoints.frustumCulled = false;
  rainPoints.visible = false;
  scene.add(rainPoints);

  let thunderCooldown = 5;
  let thunderFlash = 0;

  const targetSky = new THREE.Color();
  const targetFog = new THREE.Color();
  const targetSunColor = new THREE.Color();

  const update = (
    dt: number,
    _elapsed: number,
    playerPos: THREE.Vector3,
    timePeriod: TimePeriod,
    weather: WeatherType
  ) => {
    const cfg = TIME_CONFIG[timePeriod];
    targetSky.setHex(cfg.skyColor);
    targetFog.setHex(cfg.fogColor);
    targetSunColor.setHex(cfg.sunColor);

    const isRaining = weather === 'rain' || weather === 'monsoon';
    const isMonsoon = weather === 'monsoon';
    const isFoggy = weather === 'fog';

    if (weather === 'cloudy' || isRaining) {
      targetSky.lerp(new THREE.Color(0x475569), isMonsoon ? 0.72 : 0.45);
      targetFog.lerp(new THREE.Color(0x64748b), isMonsoon ? 0.75 : 0.5);
    } else if (isFoggy) {
      targetSky.lerp(new THREE.Color(0xcbd5e1), 0.65);
      targetFog.lerp(new THREE.Color(0xdbeafe), 0.7);
    }

    // Monsoon thunder flash
    if (isMonsoon) {
      thunderCooldown -= dt;
      if (thunderCooldown <= 0) {
        thunderFlash = 1.0;
        thunderCooldown = 6 + Math.random() * 10;
      }
    }
    thunderFlash = Math.max(0, thunderFlash - dt * 4.5);

    skyColor.lerp(targetSky, Math.min(1, dt * 2.5));
    fogColor.lerp(targetFog, Math.min(1, dt * 2.5));
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(fogColor);
      const targetDensity = isFoggy ? 0.011 : isMonsoon ? 0.0068 : isRaining ? 0.0044 : 0.0021;
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, targetDensity, dt * 2);
    }

    // Keep directional shadow frustum centered near player
    sunLight.position.set(
      playerPos.x + cfg.sunPos[0] * 0.6,
      cfg.sunPos[1],
      playerPos.z + cfg.sunPos[2] * 0.6
    );
    sunLight.target.position.set(playerPos.x, 0, playerPos.z);
    sunLight.color.lerp(targetSunColor, dt * 2.5);

    const weatherLightDim = isMonsoon ? 0.52 : isRaining ? 0.68 : weather === 'cloudy' ? 0.78 : 1.0;
    sunLight.intensity = cfg.sunIntensity * weatherLightDim + thunderFlash * 2.2;
    hemiLight.color.setHex(cfg.hemiSky);
    hemiLight.groundColor.setHex(cfg.hemiGround);
    hemiLight.intensity = cfg.hemiIntensity * (isMonsoon ? 0.75 : 1.0) + thunderFlash * 0.6;

    // Update rain particles around player
    rainPoints.visible = isRaining;
    if (isRaining) {
      const posAttr = rainGeo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const fallSpeed = isMonsoon ? 38 : 24;
      const windX = isMonsoon ? -7.5 : -2.2;
      rainPoints.position.set(playerPos.x, 0, playerPos.z);
      for (let i = 0; i < rainCount; i++) {
        const idx = i * 3;
        arr[idx] += windX * dt;
        arr[idx + 1] -= fallSpeed * dt;
        if (arr[idx + 1] < 0) {
          arr[idx] = (Math.random() - 0.5) * 90;
          arr[idx + 1] = 28 + Math.random() * 10;
          arr[idx + 2] = (Math.random() - 0.5) * 90;
        }
      }
      posAttr.needsUpdate = true;
    }

    return {
      isNight: cfg.isNight,
      wetness: isMonsoon ? 1.0 : isRaining ? 0.72 : 0.0,
      rainIntensity: isMonsoon ? 1.0 : isRaining ? 0.55 : 0.0,
    };
  };

  const dispose = () => {
    rainGeo.dispose();
    rainMat.dispose();
  };

  return { sunLight, hemiLight, update, dispose };
}
