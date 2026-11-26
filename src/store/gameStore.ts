import { create } from 'zustand';
import {
  ActiveMissionState,
  CameraMode,
  DensityPreset,
  GameNotification,
  GamePhase,
  GpsRouteState,
  GpsTravelMode,
  GraphicsPreset,
  HumanAppearance,
  InventoryItem,
  MinimapEntity,
  NpcDialogueSession,
  OwnedVehicle,
  TimePeriod,
  TrafficFine,
  TransitTicket,
  WeatherType,
  WorldLocationType,
} from '../types/game';
import {
  HOUSE_UPGRADES,
  KERALA_DISTRICTS,
  MISSION_CATALOG,
  POINTS_TO_RUPEES,
  PROPERTY_CATALOG,
  STORE_ITEMS,
  VEHICLE_CATALOG,
} from '../data/keralaWorldData';
import { computeKeralaGpsRoute } from '../game/navigation/KeralaGpsRouter';
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
  fuel: 100,
  parkedX: -58,
  parkedZ: 66,
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
    | 'dialogue'
    | 'shop'
    | 'inventory'
    | 'arrest';

  activeShopContext: { title: string; malayalamTitle: string; shopType: WorldLocationType } | null;

  // Player telemetry & economy (1 Point = ₹10,000)
  cash: number;
  bankBalance: number;
  points: number;
  health: number;
  stamina: number;
  wantedLevel: number;
  currentDistrictId: string;
  currentLocationName: string;
  playerPos: { x: number; y: number; z: number; yaw: number };

  // Vehicle & Transit HUD telemetry
  inVehicle: boolean;
  inAircraft: boolean;
  inTrain: boolean;
  inFlight: boolean;
  altitudeMeters: number;
  currentVehicleName: string;
  currentVehiclePlate: string;
  currentVehicleCategory: string;
  currentVehicleFuel: number;
  currentVehicleHealth: number;
  speedKmh: number;
  gearLabel: string;
  leftIndicator: boolean;
  rightIndicator: boolean;

  // GPS Navigation
  gpsRoute: GpsRouteState | null;

  // Interaction prompt & Police stop notice
  interactionPrompt: string | null;
  activeDialogue: NpcDialogueSession | null;
  arrestBailAmount: number;
  boatRentalUntil: number;

  // Camera & Environment
  cameraMode: CameraMode;
  weather: WeatherType;
  timePeriod: TimePeriod;
  graphics: GraphicsPreset;
  npcDensity: DensityPreset;
  language: 'en' | 'ml_en';
  audioEnabled: boolean;
  mobileControlsOverride: boolean | null;

  // Player Progression & Ownership
  playerAppearance: HumanAppearance;
  ownedVehicles: OwnedVehicle[];
  activeGarageVehicleId: string;
  ownedPropertyIds: string[];
  activeHomeId: string;
  houseUpgrades: Record<string, string[]>;
  inventory: InventoryItem[];
  discoveredLocationIds: string[];
  transitTickets: TransitTicket[];
  completedMissionIds: string[];
  activeMission: ActiveMissionState | null;
  fines: TrafficFine[];
  notifications: GameNotification[];

  // Minimap live entities
  minimapEntities: MinimapEntity[];

  // Pending commands consumed by the 3D engine
  pendingTeleport: { x: number; z: number; nonce: number } | null;
  pendingSpawnVehicle: { specId: string; color?: string; nonce: number } | null;
  pendingExitVehicleNonce: number;
  pendingFlightTakeoff: { destName: string; destX: number; destZ: number; nonce: number } | null;
  pendingRefuelActiveNonce: number;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setActiveModal: (modal: GameStoreState['activeModal']) => void;
  openShopModal: (title: string, malayalamTitle: string, shopType: WorldLocationType) => void;
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
  takePlayerDamage: (amount: number) => void;

  pushNotification: (title: string, message: string, variant?: GameNotification['variant']) => void;
  dismissNotification: (id: string) => void;

  openDialogue: (session: NpcDialogueSession) => void;
  closeDialogue: () => void;

  adjustCash: (delta: number) => void;
  awardPoints: (pts: number, reason?: string) => void;
  redeemPoints: (pts: number) => boolean;
  depositToBank: (amount: number) => void;
  withdrawFromBank: (amount: number) => void;
  healPlayer: (amount: number, cost?: number) => void;

  // Inventory & Shopping
  buyStoreItem: (itemId: string) => boolean;
  useInventoryItem: (itemId: string) => void;
  hasInventoryItem: (itemId: string) => boolean;

  // Police & Fines
  issueTrafficFine: (reason: string, malayalamReason: string, amount: number) => void;
  escalateWanted: (reason: string, addStars?: number) => void;
  triggerPoliceArrest: () => void;
  payBailAndRelease: () => void;
  payFine: (fineId: string) => void;
  payAllFines: () => void;
  clearWantedLevel: () => void;

  // Homes & Upgrades
  saveHomeCheckpoint: (homeId?: string, sleepAndAdvanceTime?: boolean) => Promise<void>;
  buyProperty: (propertyId: string) => boolean;
  setHomeProperty: (propertyId: string) => void;
  buyHouseUpgrade: (propertyId: string, upgradeId: string) => boolean;

  // Missions & Discovery
  startMission: (missionId: string) => void;
  completeActiveMission: () => void;
  failActiveMission: (reason: string) => void;
  markLocationDiscovered: (locId: string, locName: string) => void;

  // Vehicles
  buyVehicle: (specId: string) => boolean;
  sellVehicle: (instanceId: string) => void;
  customizeOwnedVehicle: (instanceId: string, color: string, upgradeEngine?: boolean) => void;
  refuelAndRepairVehicle: (instanceId: string, cost: number) => boolean;
  refuelActiveVehicleAtPump: (cost: number) => boolean;
  spawnOwnedVehicle: (instanceId: string) => void;
  updateOwnedVehicleParkedPos: (specId: string, x: number, z: number, fuel?: number, health?: number) => void;

  // Transit Tickets & Boat Rentals
  buyTransitTicket: (
    mode: TransitTicket['mode'],
    fromLabel: string,
    toLabel: string,
    destX: number,
    destZ: number,
    price: number
  ) => boolean;
  hasValidTicketForMode: (mode: TransitTicket['mode']) => TransitTicket | undefined;
  consumeTransitTicket: (ticketId: string) => void;
  boardFlightWithPass: (destName: string, destX: number, destZ: number) => void;
  rentBoat: (cost: number) => boolean;
  fastTravelToDistrict: (districtId: string, mode: 'train' | 'flight' | 'bus' | 'boat', cost: number) => void;
  teleportPlayerTo: (x: number, z: number) => void;

  // GPS Navigation
  setGpsDestination: (destId: string, destName: string, destX: number, destZ: number, mode?: GpsTravelMode) => void;
  setGpsTravelMode: (mode: GpsTravelMode) => void;
  toggleGpsAlternative: () => void;
  refreshGpsProgress: (px: number, pz: number) => void;
  clearGpsRoute: () => void;

  // Save/Load
  saveCurrentGame: () => Promise<boolean>;
  loadSavedGame: () => Promise<boolean>;
  startNewGame: () => Promise<void>;
  checkExistingSave: () => Promise<void>;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  phase: 'menu',
  hasSavedGame: false,
  activeModal: 'none',
  activeShopContext: null,

  cash: 45000,
  bankBalance: 180000,
  points: 5, // Starter 5 Game Points (= ₹50,000 value)
  health: 100,
  stamina: 100,
  wantedLevel: 0,
  currentDistrictId: 'ernakulam',
  currentLocationName: 'Fort Kochi · Ernakulam',
  playerPos: { x: -64, y: 0, z: 58, yaw: 0 },

  inVehicle: false,
  inAircraft: false,
  inTrain: false,
  inFlight: false,
  altitudeMeters: 0,
  currentVehicleName: '',
  currentVehiclePlate: '',
  currentVehicleCategory: '',
  currentVehicleFuel: 100,
  currentVehicleHealth: 100,
  speedKmh: 0,
  gearLabel: 'N',
  leftIndicator: false,
  rightIndicator: false,

  gpsRoute: null,

  interactionPrompt: null,
  activeDialogue: null,
  arrestBailAmount: 0,
  boatRentalUntil: 0,

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
  houseUpgrades: {},
  inventory: [
    { itemId: 'item_chai_snack', name: 'Samovar Chai & Pazham Pori', category: 'food', quantity: 2, healthGain: 25 },
  ],
  discoveredLocationIds: ['home_tharavadu'],
  transitTickets: [],
  completedMissionIds: [],
  activeMission: null,
  fines: [],
  notifications: [],
  minimapEntities: [],

  pendingTeleport: null,
  pendingSpawnVehicle: null,
  pendingExitVehicleNonce: 0,
  pendingFlightTakeoff: null,
  pendingRefuelActiveNonce: 0,

  setPhase: (phase) => set({ phase }),
  setActiveModal: (activeModal) => set({ activeModal }),
  openShopModal: (title, malayalamTitle, shopType) =>
    set({
      activeShopContext: { title, malayalamTitle, shopType },
      activeModal: 'shop',
    }),

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

  takePlayerDamage: (amount) => {
    const s = get();
    const nextHp = Math.max(0, s.health - amount);
    if (nextHp <= 0) {
      // Respawn safely at Ernakulam General Hospital or Active Home
      const home = PROPERTY_CATALOG.find((p) => p.id === s.activeHomeId);
      set({
        health: 100,
        stamina: 100,
        wantedLevel: 0,
        pendingTeleport: { x: home ? home.spawnX : 68, z: home ? home.spawnZ + 10 : -26, nonce: Date.now() },
      });
      s.pushNotification('Medical Recovery', 'Restored to full health back at your safe house.', 'info');
    } else {
      set({ health: nextHp });
    }
  },

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

  awardPoints: (pts, reason) => {
    if (pts <= 0) return;
    set((s) => ({ points: s.points + pts }));
    if (reason) {
      get().pushNotification(
        `+${pts} Game Point${pts > 1 ? 's' : ''}`,
        `${reason} (Worth ₹${(pts * POINTS_TO_RUPEES).toLocaleString('en-IN')})`,
        'success'
      );
    }
  },

  redeemPoints: (pts) => {
    const s = get();
    if (pts <= 0 || s.points < pts) {
      s.pushNotification('Insufficient Points', 'Earn more Points via missions and exploration.', 'warning');
      return false;
    }
    const rupees = pts * POINTS_TO_RUPEES;
    set({
      points: s.points - pts,
      cash: s.cash + rupees,
    });
    s.pushNotification(
      'Points Redeemed',
      `Converted ${pts} Points into ₹${rupees.toLocaleString('en-IN')} cash!`,
      'success'
    );
    return true;
  },

  depositToBank: (amount) => {
    const s = get();
    const amt = Math.min(amount, s.cash);
    if (amt <= 0) return;
    set({ cash: s.cash - amt, bankBalance: s.bankBalance + amt });
    s.pushNotification('Bank Deposit', `Deposited ₹${amt.toLocaleString('en-IN')} into Kerala Federal Bank.`, 'success');
  },

  withdrawFromBank: (amount) => {
    const s = get();
    const amt = Math.min(amount, s.bankBalance);
    if (amt <= 0) return;
    set({ bankBalance: s.bankBalance - amt, cash: s.cash + amt });
    s.pushNotification('Cash Withdrawn', `Withdrew ₹${amt.toLocaleString('en-IN')} from Kerala Federal Bank.`, 'success');
  },

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

  buyStoreItem: (itemId) => {
    const s = get();
    const def = STORE_ITEMS.find((i) => i.id === itemId);
    if (!def) return false;
    if (s.cash < def.price) {
      s.pushNotification('Insufficient Cash', `Need ₹${def.price.toLocaleString('en-IN')} for ${def.name}.`, 'warning');
      return false;
    }
    const existing = s.inventory.find((x) => x.itemId === itemId);
    const nextInv = existing
      ? s.inventory.map((x) => (x.itemId === itemId ? { ...x, quantity: x.quantity + 1 } : x))
      : [
          ...s.inventory,
          {
            itemId: def.id,
            name: def.name,
            category: def.category,
            quantity: 1,
            healthGain: def.healthGain,
          },
        ];

    // If buying clothing, also reflect immediately or keep in inventory
    set({
      cash: s.cash - def.price,
      inventory: nextInv,
    });
    s.pushNotification('Purchased Item', `${def.name} added to your Inventory.`, 'success');
    return true;
  },

  useInventoryItem: (itemId) => {
    const s = get();
    const item = s.inventory.find((x) => x.itemId === itemId && x.quantity > 0);
    if (!item) return;

    if (item.healthGain) {
      set({
        health: Math.min(100, s.health + item.healthGain),
        stamina: 100,
      });
      s.pushNotification('Item Used', `${item.name} restored +${item.healthGain} Health.`, 'success');
    } else if (itemId === 'item_kasavu_set') {
      const nextOutfit = s.playerAppearance.gender === 'female' ? 'kasavuSaree' : 'shirtMundu';
      set({
        playerAppearance: { ...s.playerAppearance, outfit: nextOutfit },
      });
      s.pushNotification('Equipped Kasavu Attire', 'Wearing traditional Kerala handloom attire!', 'info');
      return;
    } else if (itemId === 'item_helmet') {
      set({
        playerAppearance: {
          ...s.playerAppearance,
          hairStyle: s.playerAppearance.hairStyle === 'helmet' ? 'shortSidePart' : 'helmet',
        },
      });
      s.pushNotification('Helmet Toggled', 'Rider safety helmet updated.', 'info');
      return;
    } else if (itemId === 'item_fuel_can') {
      set({
        currentVehicleFuel: Math.min(100, s.currentVehicleFuel + 50),
        pendingRefuelActiveNonce: Date.now(),
      });
      s.pushNotification('Fuel Added', 'Refilled +50% fuel using Fuel Canister.', 'success');
    } else if (itemId === 'item_repair_kit') {
      set({
        currentVehicleHealth: 100,
        pendingRefuelActiveNonce: Date.now(),
      });
      s.pushNotification('Vehicle Repaired', 'Chassis condition restored to 100%.', 'success');
    } else {
      s.pushNotification(item.name, 'Item equipped and ready for Kerala exploration.', 'info');
      return;
    }

    // Consume 1 quantity for consumables
    const nextInv = s.inventory
      .map((x) => (x.itemId === itemId ? { ...x, quantity: x.quantity - 1 } : x))
      .filter((x) => x.quantity > 0);
    set({ inventory: nextInv });
  },

  hasInventoryItem: (itemId) => get().inventory.some((x) => x.itemId === itemId && x.quantity > 0),

  issueTrafficFine: (reason, malayalamReason, amount) => {
    const s = get();
    const fine: TrafficFine = {
      id: `fine_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
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
      'Police Signal · Traffic Violation',
      `${reason} (${malayalamReason}) · Fine ₹${amount.toLocaleString('en-IN')}`,
      'alert'
    );
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

  triggerPoliceArrest: () => {
    const s = get();
    if (s.activeModal === 'arrest' || s.wantedLevel <= 0) return;
    const unpaidSum = s.fines.filter((f) => !f.paid).reduce((acc, f) => acc + f.amount, 0);
    const bail = Math.max(3000, unpaidSum + s.wantedLevel * 2000);
    set({
      arrestBailAmount: bail,
      activeModal: 'arrest',
      pendingExitVehicleNonce: Date.now(),
    });
  },

  payBailAndRelease: () => {
    const s = get();
    const paidAmount = Math.min(s.cash, s.arrestBailAmount);
    set({
      cash: s.cash - paidAmount,
      wantedLevel: 0,
      fines: s.fines.map((f) => ({ ...f, paid: true })),
      activeModal: 'none',
      pendingTeleport: { x: -68, z: -24, nonce: Date.now() },
    });
    s.pushNotification(
      'Released from Police Custody',
      `Settled ₹${paidAmount.toLocaleString('en-IN')} charges at Fort Kochi Police HQ.`,
      'info'
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

  clearWantedLevel: () => set({ wantedLevel: 0 }),

  saveHomeCheckpoint: async (homeId, sleepAndAdvanceTime = true) => {
    const s = get();
    const targetHomeId = homeId ?? s.activeHomeId;
    const nextTime: TimePeriod = sleepAndAdvanceTime
      ? s.timePeriod === 'night'
        ? 'morning'
        : s.timePeriod === 'sunset'
        ? 'sunrise'
        : s.timePeriod
      : s.timePeriod;
    set({
      activeHomeId: targetHomeId,
      health: 100,
      stamina: 100,
      timePeriod: nextTime,
    });
    const ok = await get().saveCurrentGame();
    if (ok) {
      s.pushNotification(
        'Slept & Saved at Home',
        'Health restored to 100% and checkpoint saved in IndexedDB.',
        'success'
      );
    }
  },

  buyHouseUpgrade: (propertyId, upgradeId) => {
    const s = get();
    const upg = HOUSE_UPGRADES.find((u) => u.id === upgradeId);
    if (!upg) return false;
    const existing = s.houseUpgrades[propertyId] ?? [];
    if (existing.includes(upgradeId)) return false;
    if (s.cash + s.bankBalance < upg.price) {
      s.pushNotification('Insufficient Funds', `Need ₹${upg.price.toLocaleString('en-IN')}.`, 'warning');
      return false;
    }
    let nextCash = s.cash;
    let nextBank = s.bankBalance;
    if (nextCash >= upg.price) nextCash -= upg.price;
    else {
      nextBank -= upg.price - nextCash;
      nextCash = 0;
    }
    set({
      cash: nextCash,
      bankBalance: nextBank,
      houseUpgrades: {
        ...s.houseUpgrades,
        [propertyId]: [...existing, upgradeId],
      },
    });
    s.pushNotification('Home Upgraded!', `Installed ${upg.name} at your property.`, 'success');
    return true;
  },

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
    // Also set GPS route automatically to mission target!
    get().setGpsDestination(def.id, def.targetLabel, def.targetX, def.targetZ);
    get().pushNotification(`Mission Started: ${def.title}`, def.description, 'info');
  },

  completeActiveMission: () => {
    const s = get();
    if (!s.activeMission) return;
    const { mission } = s.activeMission;
    const completed = s.completedMissionIds.includes(mission.id)
      ? s.completedMissionIds
      : [...s.completedMissionIds, mission.id];
    const pts = mission.rewardPoints ?? 2;
    set({
      cash: s.cash + mission.rewardCash,
      points: s.points + pts,
      completedMissionIds: completed,
      activeMission: null,
    });
    s.pushNotification(
      'Mission Accomplished!',
      `${mission.title} · +₹${mission.rewardCash.toLocaleString('en-IN')} & +${pts} Game Points!`,
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

  markLocationDiscovered: (locId, locName) => {
    const s = get();
    if (s.discoveredLocationIds.includes(locId)) return;
    set({
      discoveredLocationIds: [...s.discoveredLocationIds, locId],
      points: s.points + 1,
    });
    s.pushNotification(
      'Landmark Discovered (+1 Pt)',
      `Visited ${locName} · Earned 1 Game Point (worth ₹10,000)!`,
      'success'
    );
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
    const spawnX = spec.isWatercraft ? -206 : spec.isAircraft ? 192 : s.playerPos.x + 5;
    const spawnZ = spec.isWatercraft ? 18 : spec.isAircraft ? -138 : s.playerPos.z + 5;
    const owned: OwnedVehicle = {
      ...spec,
      instanceId: `owned_${spec.id}_${Date.now()}`,
      customColor: spec.color,
      engineLevel: 1,
      handlingLevel: 1,
      health: 100,
      fuel: 100,
      parkedX: spawnX,
      parkedZ: spawnZ,
    };
    set({
      cash: nextCash,
      bankBalance: nextBank,
      ownedVehicles: [...s.ownedVehicles, owned],
      activeGarageVehicleId: owned.instanceId,
      pendingSpawnVehicle: { specId: owned.id, color: owned.customColor, nonce: Date.now() },
      activeModal: 'none',
    });
    s.pushNotification('Vehicle Purchased!', `${spec.modelName} added to your personal Garage & marked on GPS.`, 'success');
    return true;
  },

  sellVehicle: (instanceId) => {
    const s = get();
    if (s.ownedVehicles.length <= 1) {
      s.pushNotification('Cannot Sell Last Vehicle', 'Keep at least 1 personal vehicle in your garage.', 'warning');
      return;
    }
    const target = s.ownedVehicles.find((v) => v.instanceId === instanceId);
    if (!target) return;
    const resale = Math.round(target.price * 0.65);
    const nextList = s.ownedVehicles.filter((v) => v.instanceId !== instanceId);
    set({
      cash: s.cash + resale,
      ownedVehicles: nextList,
      activeGarageVehicleId: nextList[0].instanceId,
    });
    s.pushNotification('Vehicle Sold', `Sold ${target.modelName} for ₹${resale.toLocaleString('en-IN')}.`, 'success');
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

  refuelAndRepairVehicle: (instanceId, cost) => {
    const s = get();
    if (s.cash < cost) {
      s.pushNotification('Insufficient Cash', `Service costs ₹${cost.toLocaleString('en-IN')}.`, 'warning');
      return false;
    }
    set({
      cash: s.cash - cost,
      ownedVehicles: s.ownedVehicles.map((v) =>
        v.instanceId === instanceId ? { ...v, fuel: 100, health: 100 } : v
      ),
      currentVehicleFuel: 100,
      currentVehicleHealth: 100,
      pendingRefuelActiveNonce: Date.now(),
    });
    s.pushNotification('Full Tank & Repair', 'Vehicle refueled to 100% and fully repaired.', 'success');
    return true;
  },

  refuelActiveVehicleAtPump: (cost) => {
    const s = get();
    if (s.cash < cost) {
      s.pushNotification('Insufficient Cash', `Fuel costs ₹${cost.toLocaleString('en-IN')}.`, 'warning');
      return false;
    }
    set({
      cash: s.cash - cost,
      currentVehicleFuel: 100,
      pendingRefuelActiveNonce: Date.now(),
    });
    s.pushNotification('Tank Filled', 'Refueled at Kerala Highway Fuel Station.', 'success');
    return true;
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
    s.pushNotification('Vehicle Delivered', `${target.modelName} brought out from your garage.`, 'info');
  },

  updateOwnedVehicleParkedPos: (specId, x, z, fuel, health) => {
    set((s) => ({
      ownedVehicles: s.ownedVehicles.map((v) =>
        v.id === specId
          ? {
              ...v,
              parkedX: x,
              parkedZ: z,
              fuel: fuel ?? v.fuel,
              health: health ?? v.health,
            }
          : v
      ),
    }));
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
    s.pushNotification('Property Acquired!', `Welcome home to ${prop.name} (${prop.malayalamName})!`, 'success');
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

  buyTransitTicket: (mode, fromLabel, toLabel, destX, destZ, price) => {
    const s = get();
    if (s.cash < price) {
      s.pushNotification('Insufficient Cash', `Ticket costs ₹${price.toLocaleString('en-IN')}.`, 'warning');
      return false;
    }
    const ticket: TransitTicket = {
      id: `tkt_${mode}_${Date.now()}`,
      mode,
      fromLabel,
      toLabel,
      destX,
      destZ,
      price,
      issuedAt: Date.now(),
      used: false,
    };
    set({
      cash: s.cash - price,
      transitTickets: [ticket, ...s.transitTickets.slice(0, 9)],
    });
    s.pushNotification(
      `${mode.toUpperCase()} Ticket Issued`,
      `Valid boarding pass: ${fromLabel} → ${toLabel}`,
      'success'
    );
    return true;
  },

  hasValidTicketForMode: (mode) =>
    get().transitTickets.find((t) => t.mode === mode && !t.used),

  consumeTransitTicket: (ticketId) =>
    set((s) => ({
      transitTickets: s.transitTickets.map((t) => (t.id === ticketId ? { ...t, used: true } : t)),
    })),

  boardFlightWithPass: (destName, destX, destZ) => {
    const s = get();
    const ticket = s.transitTickets.find((t) => t.mode === 'flight' && !t.used);
    if (!ticket) {
      s.issueTrafficFine('Ticketless Airport Boarding Attempt', 'ടിക്കറ്റില്ലാതെ വിമാനത്തിൽ കയറാൻ ശ്രമം', 3000);
      return;
    }
    s.consumeTransitTicket(ticket.id);
    set({
      activeModal: 'none',
      pendingFlightTakeoff: { destName, destX, destZ, nonce: Date.now() },
    });
    s.pushNotification('Boarding Pass Verified', `Boarding Kerala Air Shuttle to ${destName}!`, 'success');
  },

  rentBoat: (cost) => {
    const s = get();
    if (s.cash < cost) {
      s.pushNotification('Insufficient Cash', `Boat rental costs ₹${cost.toLocaleString('en-IN')}.`, 'warning');
      return false;
    }
    set({
      cash: s.cash - cost,
      boatRentalUntil: Date.now() + 5 * 60 * 1000,
    });
    s.pushNotification('Boat Rented', '5-minute Kerala Backwater boat pass active! Press E near any dock boat.', 'success');
    return true;
  },

  fastTravelToDistrict: (districtId, mode, cost) => {
    const s = get();
    const district = KERALA_DISTRICTS.find((d) => d.id === districtId);
    if (!district) return;
    if (s.cash < cost) {
      s.pushNotification('Insufficient Cash', `Ticket costs ₹${cost.toLocaleString('en-IN')}`, 'warning');
      return;
    }
    const dest = district.spawnOffset ?? { x: 0, z: 0 };
    const modeLabel =
      mode === 'train'
        ? 'Indian Railways'
        : mode === 'flight'
        ? 'Kerala Air Shuttle'
        : mode === 'boat'
        ? 'Water Metro'
        : 'KSRTC Express';

    if (mode === 'flight') {
      set({
        cash: s.cash - cost,
        currentDistrictId: districtId,
        currentLocationName: `${district.name} (${district.malayalamName})`,
        activeModal: 'none',
        pendingFlightTakeoff: { destName: district.name, destX: dest.x, destZ: dest.z, nonce: Date.now() },
      });
      return;
    }

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

  setGpsDestination: (destId, destName, destX, destZ, mode) => {
    const s = get();
    const activeMode: GpsTravelMode =
      mode ??
      (s.inVehicle && s.currentVehicleCategory === 'boat'
        ? 'boat'
        : s.inVehicle && s.currentVehicleCategory === 'motorcycle'
        ? 'bike'
        : s.inVehicle
        ? 'car'
        : 'car');
    const route = computeKeralaGpsRoute(
      s.playerPos.x,
      s.playerPos.z,
      destId,
      destName,
      destX,
      destZ,
      activeMode,
      false
    );
    set({ gpsRoute: route });
  },

  setGpsTravelMode: (mode) => {
    const s = get();
    if (!s.gpsRoute) return;
    const updated = computeKeralaGpsRoute(
      s.playerPos.x,
      s.playerPos.z,
      s.gpsRoute.destinationId,
      s.gpsRoute.destinationName,
      s.gpsRoute.destX,
      s.gpsRoute.destZ,
      mode,
      s.gpsRoute.useAlternative
    );
    set({ gpsRoute: updated });
  },

  toggleGpsAlternative: () => {
    const s = get();
    if (!s.gpsRoute) return;
    const updated = computeKeralaGpsRoute(
      s.playerPos.x,
      s.playerPos.z,
      s.gpsRoute.destinationId,
      s.gpsRoute.destinationName,
      s.gpsRoute.destX,
      s.gpsRoute.destZ,
      s.gpsRoute.mode,
      !s.gpsRoute.useAlternative
    );
    set({ gpsRoute: updated });
  },

  refreshGpsProgress: (px, pz) => {
    const s = get();
    if (!s.gpsRoute) return;
    const distToDest = Math.hypot(px - s.gpsRoute.destX, pz - s.gpsRoute.destZ);
    if (distToDest < 12) {
      s.pushNotification('GPS Arrived', `Reached ${s.gpsRoute.destinationName}!`, 'success');
      set({ gpsRoute: null });
      return;
    }
    const updated = computeKeralaGpsRoute(
      px,
      pz,
      s.gpsRoute.destinationId,
      s.gpsRoute.destinationName,
      s.gpsRoute.destX,
      s.gpsRoute.destZ,
      s.gpsRoute.mode,
      s.gpsRoute.useAlternative
    );
    set({ gpsRoute: updated });
  },

  clearGpsRoute: () => set({ gpsRoute: null }),

  saveCurrentGame: async () => {
    const s = get();
    const payload: SaveGamePayload = {
      version: 2,
      savedAt: Date.now(),
      cash: s.cash,
      bankBalance: s.bankBalance,
      points: s.points,
      health: s.health,
      playerPos: s.playerPos,
      currentDistrictId: s.currentDistrictId,
      activeHomeId: s.activeHomeId,
      ownedPropertyIds: s.ownedPropertyIds,
      houseUpgrades: s.houseUpgrades,
      ownedVehicles: s.ownedVehicles,
      inventory: s.inventory,
      discoveredLocationIds: s.discoveredLocationIds,
      transitTickets: s.transitTickets,
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
      s.pushNotification('Game Saved', 'All progress stored safely in local IndexedDB.', 'success');
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
      points: data.points ?? 5,
      health: data.health,
      playerPos: data.playerPos,
      currentDistrictId: data.currentDistrictId,
      activeHomeId: data.activeHomeId,
      ownedPropertyIds: data.ownedPropertyIds,
      houseUpgrades: data.houseUpgrades ?? {},
      ownedVehicles:
        data.ownedVehicles.length > 0
          ? data.ownedVehicles.map((v) => ({
              ...v,
              fuel: v.fuel ?? 100,
              parkedX: v.parkedX ?? -58,
              parkedZ: v.parkedZ ?? 66,
            }))
          : [STARTER_VEHICLE],
      inventory: data.inventory ?? [],
      discoveredLocationIds: data.discoveredLocationIds ?? ['home_tharavadu'],
      transitTickets: data.transitTickets ?? [],
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
      points: 5,
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
      houseUpgrades: {},
      inventory: [
        { itemId: 'item_chai_snack', name: 'Samovar Chai & Pazham Pori', category: 'food', quantity: 2, healthGain: 25 },
      ],
      discoveredLocationIds: ['home_tharavadu'],
      transitTickets: [],
      completedMissionIds: [],
      activeMission: null,
      fines: [],
      gpsRoute: null,
      pendingTeleport: { x: -64, z: 58, nonce: Date.now() },
    });
    get().pushNotification(
      'Welcome to Infinity City',
      'Explore all 14 Kerala districts, buy houses & cars, use GPS [M], and earn Points (1 Pt = ₹10,000)!',
      'info'
    );
  },

  checkExistingSave: async () => {
    const data = await loadGameFromIndexedDB();
    set({ hasSavedGame: !!data });
  },
}));
