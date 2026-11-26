import { create } from 'zustand';
import {
  ActiveMissionState,
  CameraMode,
  DensityPreset,
  GameNotification,
  GamePhase,
  GraphicsPreset,
  HumanAppearance,
  MinimapEntity,
  NpcDialogueSession,
  OwnedVehicle,
  TimePeriod,
  TrafficFine,
  WeatherType,
} from '../types/game';
import {
  KERALA_DISTRICTS,
  MISSION_CATALOG,
  PROPERTY_CATALOG,
  VEHICLE_CATALOG,
} from '../data/keralaWorldData';
import {
  clearSavedGame,
  loadGameFromIndexedDB,
  SaveGamePayload,
  saveGameToIndexedDB,
} from '../services/saveSystem';

export const DEFAULT_PLAYER_APPEARANCE: HumanAppearance = {
  id: 'player',
  name: 'Arjun Menon',
  malayalamName: 'അർജുൻ മേനോൻ',
  role: 'Explorer',
  gender: 'male',
  ageGroup: 'adult',
  skinTone: '#b87d56',
  faceShape: 'oval',
  eyeColor: '#2a1d17',
  hairStyle: 'shortSidePart',
  hairColor: '#171412',
  facialHair: 'stubble',
  outfit: 'shirtMundu',
  primaryColor: '#1e3a8a',
  secondaryColor: '#f8fafc',
  accentColor: '#d97706',
  heightScale: 1.0,
  buildScale: 1.0,
  glasses: false,
  sunglasses: false,
  prop: 'none',
  walkStyle: 'confident',
};

const STARTER_VEHICLE: OwnedVehicle = {
  ...VEHICLE_CATALOG[0],
  instanceId: 'owned_starter_kaveri',
  customColor: '#e2e8f0',
  engineLevel: 1,
  handlingLevel: 1,
  health: 100,
};

export interface GameStoreState {
  phase: GamePhase;
  hasSavedGame: boolean;
  activeModal:
    | 'none'
    | 'map'
    | 'garage'
    | 'properties'
    | 'character'
    | 'missions'
    | 'settings'
    | 'dialogue';

  // Player telemetry
  cash: number;
  bankBalance: number;
  health: number;
  stamina: number;
  wantedLevel: number;
  currentDistrictId: string;
  currentLocationName: string;
  playerPos: { x: number; y: number; z: number; yaw: number };

  // Vehicle & Train HUD telemetry
  inVehicle: boolean;
  inTrain: boolean;
  currentVehicleName: string;
  currentVehiclePlate: string;
  currentVehicleCategory: string;
  speedKmh: number;
  gearLabel: string;

  // Interaction prompt
  interactionPrompt: string | null;
  activeDialogue: NpcDialogueSession | null;

  // Camera & Environment
  cameraMode: CameraMode;
  weather: WeatherType;
  timePeriod: TimePeriod;
  graphics: GraphicsPreset;
  npcDensity: DensityPreset;
  language: 'en' | 'ml_en';
  audioEnabled: boolean;
  mobileControlsOverride: boolean | null;

  // Player Progression
  playerAppearance: HumanAppearance;
  ownedVehicles: OwnedVehicle[];
  activeGarageVehicleId: string;
  ownedPropertyIds: string[];
  activeHomeId: string;
  completedMissionIds: string[];
  activeMission: ActiveMissionState | null;
  fines: TrafficFine[];
  notifications: GameNotification[];

  // Minimap live entities (updated at ~10Hz)
  minimapEntities: MinimapEntity[];

  // Pending commands consumed by the 3D engine
  pendingTeleport: { x: number; z: number; nonce: number } | null;
  pendingSpawnVehicle: { specId: string; color?: string; nonce: number } | null;
  pendingExitVehicleNonce: number;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setActiveModal: (modal: GameStoreState['activeModal']) => void;
  cycleCameraMode: () => void;
  setWeather: (weather: WeatherType) => void;
  setTimePeriod: (period: TimePeriod) => void;
  setGraphics: (preset: GraphicsPreset) => void;
  setNpcDensity: (density: DensityPreset) => void;
  setLanguage: (lang: 'en' | 'ml_en') => void;
  setAudioEnabled: (enabled: boolean) => void;
  setMobileControlsOverride: (val: boolean | null) => void;

  updateTelemetry: (partial: Partial<GameStoreState>) => void;
  setPlayerAppearance: (appearance: Partial<HumanAppearance>) => void;

  pushNotification: (title: string, message: string, variant?: GameNotification['variant']) => void;
  dismissNotification: (id: string) => void;

  openDialogue: (session: NpcDialogueSession) => void;
  closeDialogue: () => void;

  adjustCash: (delta: number) => void;
  healPlayer: (amount: number, cost?: number) => void;
  issueTrafficFine: (reason: string, malayalamReason: string, amount: number) => void;
  escalateWanted: (reason: string, addStars?: number) => void;
  saveHomeCheckpoint: (homeId?: string) => Promise<void>;
  payFine: (fineId: string) => void;
  payAllFines: () => void;
  clearWantedLevel: () => void;

  startMission: (missionId: string) => void;
  completeActiveMission: () => void;
  failActiveMission: (reason: string) => void;

  buyVehicle: (specId: string) => boolean;
  customizeOwnedVehicle: (instanceId: string, color: string, upgradeEngine?: boolean) => void;
  spawnOwnedVehicle: (instanceId: string) => void;

  buyProperty: (propertyId: string) => boolean;
  setHomeProperty: (propertyId: string) => void;
  fastTravelToDistrict: (districtId: string, mode: 'train' | 'flight' | 'bus' | 'boat', cost: number) => void;
  teleportPlayerTo: (x: number, z: number) => void;

  saveCurrentGame: () => Promise<boolean>;
  loadSavedGame: () => Promise<boolean>;
  startNewGame: () => Promise<void>;
  checkExistingSave: () => Promise<void>;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  phase: 'menu',
  hasSavedGame: false,
  activeModal: 'none',

  cash: 45000,
  bankBalance: 180000,
  health: 100,
  stamina: 100,
  wantedLevel: 0,
  currentDistrictId: 'ernakulam',
  currentLocationName: 'Fort Kochi · Ernakulam',
  playerPos: { x: -64, y: 0, z: 58, yaw: 0 },

  inVehicle: false,
  inTrain: false,
  currentVehicleName: '',
  currentVehiclePlate: '',
  currentVehicleCategory: '',
  speedKmh: 0,
  gearLabel: 'N',

  interactionPrompt: null,
  activeDialogue: null,

  cameraMode: 'third-person',
  weather: 'sunny',
  timePeriod: 'morning',
  graphics: 'high',
  npcDensity: 'high',
  language: 'ml_en',
  audioEnabled: true,
  mobileControlsOverride: null,

  playerAppearance: { ...DEFAULT_PLAYER_APPEARANCE },
  ownedVehicles: [STARTER_VEHICLE],
  activeGarageVehicleId: STARTER_VEHICLE.instanceId,
  ownedPropertyIds: ['prop_tharavadu'],
  activeHomeId: 'prop_tharavadu',
  completedMissionIds: [],
  activeMission: null,
  fines: [],
  notifications: [],
  minimapEntities: [],

  pendingTeleport: null,
  pendingSpawnVehicle: null,
  pendingExitVehicleNonce: 0,

  setPhase: (phase) => set({ phase }),
  setActiveModal: (activeModal) => set({ activeModal }),

  cycleCameraMode: () =>
    set((state) => {
      const order: CameraMode[] = ['third-person', 'first-person', 'cinematic'];
      const next = order[(order.indexOf(state.cameraMode) + 1) % order.length];
      return { cameraMode: next };
    }),

  setWeather: (weather) => set({ weather }),
  setTimePeriod: (timePeriod) => set({ timePeriod }),
  setGraphics: (graphics) => set({ graphics }),
  setNpcDensity: (npcDensity) => set({ npcDensity }),
  setLanguage: (language) => set({ language }),
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setMobileControlsOverride: (mobileControlsOverride) => set({ mobileControlsOverride }),

  updateTelemetry: (partial) => set(partial),

  setPlayerAppearance: (appearance) =>
    set((state) => ({
      playerAppearance: { ...state.playerAppearance, ...appearance },
    })),

  pushNotification: (title, message, variant = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      notifications: [...state.notifications.slice(-3), { id, title, message, variant }],
    }));
    setTimeout(() => {
      get().dismissNotification(id);
    }, 4800);
  },

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  openDialogue: (session) =>
    set({
      activeDialogue: session,
      activeModal: 'dialogue',
    }),

  closeDialogue: () =>
    set({
      activeDialogue: null,
      activeModal: 'none',
    }),

  adjustCash: (delta) =>
    set((state) => ({
      cash: Math.max(0, state.cash + delta),
    })),

  healPlayer: (amount, cost = 0) => {
    const s = get();
    if (cost > 0 && s.cash < cost) {
      s.pushNotification('Insufficient Funds', `Need ₹${cost.toLocaleString('en-IN')}`, 'warning');
      return;
    }
    set({
      cash: s.cash - cost,
      health: Math.min(100, s.health + amount),
      stamina: 100,
    });
    s.pushNotification('Health Restored', 'Feeling refreshed and ready to explore Kerala.', 'success');
  },

  issueTrafficFine: (reason, malayalamReason, amount) => {
    const s = get();
    const fine: TrafficFine = {
      id: `fine_${Date.now()}`,
      reason,
      malayalamReason,
      amount,
      timestamp: Date.now(),
      paid: false,
    };
    const unpaidCount = s.fines.filter((f) => !f.paid).length + 1;
    const nextWanted = Math.min(3, Math.max(s.wantedLevel, unpaidCount >= 2 ? 2 : 1));
    set({
      fines: [fine, ...s.fines],
      wantedLevel: nextWanted,
    });
    s.pushNotification(
      'Kerala Traffic e-Challan',
      `${reason} (${malayalamReason}) · ₹${amount.toLocaleString('en-IN')}`,
      'alert'
    );
  },

  payFine: (fineId) => {
    const s = get();
    const target = s.fines.find((f) => f.id === fineId && !f.paid);
    if (!target) return;
    if (s.cash < target.amount) {
      s.pushNotification('Insufficient Cash', `Need ₹${target.amount.toLocaleString('en-IN')} to clear fine.`, 'warning');
      return;
    }
    const updated = s.fines.map((f) => (f.id === fineId ? { ...f, paid: true } : f));
    const remaining = updated.filter((f) => !f.paid).length;
    set({
      cash: s.cash - target.amount,
      fines: updated,
      wantedLevel: remaining === 0 ? 0 : s.wantedLevel,
    });
    s.pushNotification('Fine Paid', 'e-Challan cleared at Traffic Police desk.', 'success');
  },

  payAllFines: () => {
    const s = get();
    const unpaid = s.fines.filter((f) => !f.paid);
    const total = unpaid.reduce((acc, f) => acc + f.amount, 0);
    if (total === 0) {
      set({ wantedLevel: 0 });
      return;
    }
    if (s.cash < total) {
      s.pushNotification('Insufficient Cash', `Need ₹${total.toLocaleString('en-IN')} to clear all fines.`, 'warning');
      return;
    }
    set({
      cash: s.cash - total,
      fines: s.fines.map((f) => ({ ...f, paid: true })),
      wantedLevel: 0,
    });
    s.pushNotification('All Fines Cleared', 'Wanted level reset. Drive safely on Kerala roads!', 'success');
  },

  escalateWanted: (reason, addStars = 1) => {
    const s = get();
    const nextWanted = Math.min(5, Math.max(1, s.wantedLevel + addStars));
    const fine: TrafficFine = {
      id: `fine_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      reason,
      malayalamReason: 'നിയമലംഘനം · പോലീസ് അലർട്ട്',
      amount: 2500,
      timestamp: Date.now(),
      paid: false,
    };
    set({
      wantedLevel: nextWanted,
      fines: [fine, ...s.fines],
    });
    s.pushNotification(
      `Kerala Police Alert (${'★'.repeat(nextWanted)})`,
      `${reason} · Interceptors dispatched!`,
      'alert'
    );
  },

  saveHomeCheckpoint: async (homeId) => {
    const s = get();
    const targetHomeId = homeId ?? s.activeHomeId;
    set({
      activeHomeId: targetHomeId,
      health: 100,
      stamina: 100,
    });
    const ok = await get().saveCurrentGame();
    if (ok) {
      s.pushNotification(
        'Home Checkpoint Saved',
        'Health restored to 100% and checkpoint saved at your Kerala home.',
        'success'
      );
    }
  },

  clearWantedLevel: () => set({ wantedLevel: 0 }),

  startMission: (missionId) => {
    const def = MISSION_CATALOG.find((m) => m.id === missionId);
    if (!def) return;
    set({
      activeMission: {
        mission: def,
        stage: 'go_to_target',
        timeRemaining: def.timeLimitSec ?? 120,
        progressText: `Head to ${def.targetLabel}`,
      },
      activeModal: 'none',
    });
    get().pushNotification(`Mission Started: ${def.title}`, def.description, 'info');
  },

  completeActiveMission: () => {
    const s = get();
    if (!s.activeMission) return;
    const { mission } = s.activeMission;
    const completed = s.completedMissionIds.includes(mission.id)
      ? s.completedMissionIds
      : [...s.completedMissionIds, mission.id];
    set({
      cash: s.cash + mission.rewardCash,
      completedMissionIds: completed,
      activeMission: null,
    });
    s.pushNotification(
      'Mission Accomplished!',
      `${mission.title} completed · Earned ₹${mission.rewardCash.toLocaleString('en-IN')}`,
      'success'
    );
  },

  failActiveMission: (reason) => {
    const s = get();
    if (!s.activeMission) return;
    const title = s.activeMission.mission.title;
    set({ activeMission: null });
    s.pushNotification(`Mission Failed: ${title}`, reason, 'alert');
  },

  buyVehicle: (specId) => {
    const s = get();
    const spec = VEHICLE_CATALOG.find((v) => v.id === specId);
    if (!spec) return false;
    if (s.cash + s.bankBalance < spec.price) {
      s.pushNotification('Insufficient Funds', `Need ₹${spec.price.toLocaleString('en-IN')}`, 'warning');
      return false;
    }
    let nextCash = s.cash;
    let nextBank = s.bankBalance;
    if (nextCash >= spec.price) {
      nextCash -= spec.price;
    } else {
      const rem = spec.price - nextCash;
      nextCash = 0;
      nextBank -= rem;
    }
    const owned: OwnedVehicle = {
      ...spec,
      instanceId: `owned_${spec.id}_${Date.now()}`,
      customColor: spec.color,
      engineLevel: 1,
      handlingLevel: 1,
      health: 100,
    };
    set({
      cash: nextCash,
      bankBalance: nextBank,
      ownedVehicles: [...s.ownedVehicles, owned],
      activeGarageVehicleId: owned.instanceId,
      pendingSpawnVehicle: { specId: owned.id, color: owned.customColor, nonce: Date.now() },
      activeModal: 'none',
    });
    s.pushNotification('Vehicle Purchased!', `${spec.modelName} delivered outside Showroom.`, 'success');
    return true;
  },

  customizeOwnedVehicle: (instanceId, color, upgradeEngine = false) => {
    const s = get();
    const target = s.ownedVehicles.find((v) => v.instanceId === instanceId);
    if (!target) return;
    const cost = upgradeEngine ? 25000 : 5000;
    if (s.cash < cost) {
      s.pushNotification('Insufficient Cash', `Customization costs ₹${cost.toLocaleString('en-IN')}`, 'warning');
      return;
    }
    set({
      cash: s.cash - cost,
      ownedVehicles: s.ownedVehicles.map((v) =>
        v.instanceId === instanceId
          ? {
              ...v,
              customColor: color,
              engineLevel: upgradeEngine ? Math.min(3, v.engineLevel + 1) : v.engineLevel,
              health: 100,
            }
          : v
      ),
    });
    s.pushNotification('Garage Updated', `${target.modelName} customized & repaired.`, 'success');
  },

  spawnOwnedVehicle: (instanceId) => {
    const s = get();
    const target = s.ownedVehicles.find((v) => v.instanceId === instanceId);
    if (!target) return;
    set({
      activeGarageVehicleId: instanceId,
      pendingSpawnVehicle: { specId: target.id, color: target.customColor, nonce: Date.now() },
      activeModal: 'none',
    });
    s.pushNotification('Vehicle Delivered', `${target.modelName} brought to your nearby street.`, 'info');
  },

  buyProperty: (propertyId) => {
    const s = get();
    const prop = PROPERTY_CATALOG.find((p) => p.id === propertyId);
    if (!prop || s.ownedPropertyIds.includes(propertyId)) return false;
    const total = s.cash + s.bankBalance;
    if (total < prop.price) {
      s.pushNotification('Insufficient Funds', `Need ₹${prop.price.toLocaleString('en-IN')}`, 'warning');
      return false;
    }
    let nextCash = s.cash;
    let nextBank = s.bankBalance;
    if (nextCash >= prop.price) {
      nextCash -= prop.price;
    } else {
      const rem = prop.price - nextCash;
      nextCash = 0;
      nextBank -= rem;
    }
    set({
      cash: nextCash,
      bankBalance: nextBank,
      ownedPropertyIds: [...s.ownedPropertyIds, propertyId],
      activeHomeId: propertyId,
    });
    s.pushNotification('Property Acquired!', `Welcome to ${prop.name} (${prop.malayalamName})!`, 'success');
    return true;
  },

  setHomeProperty: (propertyId) => {
    const s = get();
    const prop = PROPERTY_CATALOG.find((p) => p.id === propertyId);
    if (!prop || !s.ownedPropertyIds.includes(propertyId)) return;
    set({
      activeHomeId: propertyId,
      pendingTeleport: { x: prop.spawnX, z: prop.spawnZ + 12, nonce: Date.now() },
      activeModal: 'none',
    });
    s.pushNotification('Arrived Home', `Spawned outside ${prop.name}.`, 'info');
  },

  fastTravelToDistrict: (districtId, mode, cost) => {
    const s = get();
    const district = KERALA_DISTRICTS.find((d) => d.id === districtId);
    if (!district) return;
    if (s.cash < cost) {
      s.pushNotification('Insufficient Cash', `Ticket costs ₹${cost.toLocaleString('en-IN')}`, 'warning');
      return;
    }
    // Map Kerala district travel into distinct scenic hubs / viewpoints around the playable Kerala map
    const hubCoords: Record<string, { x: number; z: number }> = {
      ernakulam: { x: 0, z: 0 },
      kasaragod: { x: -120, z: -240 },
      kannur: { x: -115, z: -180 },
      wayanad: { x: 245, z: -315 },
      kozhikode: { x: -125, z: -120 },
      malappuram: { x: 85, z: -210 },
      palakkad: { x: 185, z: -155 },
      thrissur: { x: -25, z: -215 },
      idukki: { x: 300, z: -225 },
      kottayam: { x: 112, z: 120 },
      alappuzha: { x: -248, z: 255 },
      pathanamthitta: { x: 138, z: 185 },
      kollam: { x: -135, z: 335 },
      thiruvananthapuram: { x: 55, z: 280 },
    };
    const dest = hubCoords[districtId] ?? { x: 0, z: 0 };
    const modeLabel = mode === 'train' ? 'Indian Railways' : mode === 'flight' ? 'Kerala Air Shuttle' : mode === 'boat' ? 'Water Metro' : 'KSRTC Express';
    set({
      cash: s.cash - cost,
      currentDistrictId: districtId,
      currentLocationName: `${district.name} (${district.malayalamName})`,
      pendingTeleport: { x: dest.x, z: dest.z, nonce: Date.now() },
      activeModal: 'none',
    });
    s.pushNotification(
      `Arrived via ${modeLabel}`,
      `Welcome to ${district.name} · ${district.malayalamName}`,
      'success'
    );
  },

  teleportPlayerTo: (x, z) =>
    set({
      pendingTeleport: { x, z, nonce: Date.now() },
      activeModal: 'none',
    }),

  saveCurrentGame: async () => {
    const s = get();
    const payload: SaveGamePayload = {
      version: 1,
      savedAt: Date.now(),
      cash: s.cash,
      bankBalance: s.bankBalance,
      health: s.health,
      playerPos: s.playerPos,
      currentDistrictId: s.currentDistrictId,
      activeHomeId: s.activeHomeId,
      ownedPropertyIds: s.ownedPropertyIds,
      ownedVehicles: s.ownedVehicles,
      completedMissionIds: s.completedMissionIds,
      fines: s.fines,
      playerAppearance: s.playerAppearance,
      settings: {
        graphics: s.graphics,
        npcDensity: s.npcDensity,
        language: s.language,
        weather: s.weather,
        timePeriod: s.timePeriod,
        audioEnabled: s.audioEnabled,
        mobileControlsOverride: s.mobileControlsOverride,
      },
    };
    const ok = await saveGameToIndexedDB(payload);
    if (ok) {
      set({ hasSavedGame: true });
      s.pushNotification('Game Saved', 'Progress stored safely in local IndexedDB.', 'success');
    } else {
      s.pushNotification('Save Warning', 'Could not persist save data.', 'warning');
    }
    return ok;
  },

  loadSavedGame: async () => {
    const data = await loadGameFromIndexedDB();
    if (!data) return false;
    set({
      cash: data.cash,
      bankBalance: data.bankBalance,
      health: data.health,
      playerPos: data.playerPos,
      currentDistrictId: data.currentDistrictId,
      activeHomeId: data.activeHomeId,
      ownedPropertyIds: data.ownedPropertyIds,
      ownedVehicles: data.ownedVehicles.length > 0 ? data.ownedVehicles : [STARTER_VEHICLE],
      completedMissionIds: data.completedMissionIds,
      fines: data.fines,
      playerAppearance: data.playerAppearance ?? { ...DEFAULT_PLAYER_APPEARANCE },
      graphics: data.settings.graphics,
      npcDensity: data.settings.npcDensity,
      language: data.settings.language,
      weather: data.settings.weather,
      timePeriod: data.settings.timePeriod,
      audioEnabled: data.settings.audioEnabled,
      mobileControlsOverride: data.settings.mobileControlsOverride,
      pendingTeleport: { x: data.playerPos.x, z: data.playerPos.z, nonce: Date.now() },
      phase: 'playing',
      activeModal: 'none',
    });
    get().pushNotification('Save Loaded', 'Welcome back to Infinity City, Kerala!', 'success');
    return true;
  },

  startNewGame: async () => {
    await clearSavedGame();
    set({
      phase: 'playing',
      hasSavedGame: false,
      activeModal: 'none',
      cash: 45000,
      bankBalance: 180000,
      health: 100,
      stamina: 100,
      wantedLevel: 0,
      currentDistrictId: 'ernakulam',
      currentLocationName: 'Fort Kochi · Ernakulam',
      playerPos: { x: -64, y: 0, z: 58, yaw: 0 },
      ownedVehicles: [STARTER_VEHICLE],
      activeGarageVehicleId: STARTER_VEHICLE.instanceId,
      ownedPropertyIds: ['prop_tharavadu'],
      activeHomeId: 'prop_tharavadu',
      completedMissionIds: [],
      activeMission: null,
      fines: [],
      pendingTeleport: { x: -64, z: 58, nonce: Date.now() },
    });
    get().pushNotification(
      'Welcome to Infinity City',
      'Explore Fort Kochi, drive Kerala vehicles, talk to locals [F], or start a mission!',
      'info'
    );
  },

  checkExistingSave: async () => {
    const data = await loadGameFromIndexedDB();
    set({ hasSavedGame: !!data });
  },
}));
