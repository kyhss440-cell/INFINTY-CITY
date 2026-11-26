import {
  DensityPreset,
  GraphicsPreset,
  HumanAppearance,
  InventoryItem,
  OwnedVehicle,
  TimePeriod,
  TrafficFine,
  TransitTicket,
  WeatherType,
} from '../types/game';

export interface SaveGamePayload {
  version: number;
  savedAt: number;
  cash: number;
  bankBalance: number;
  points: number;
  health: number;
  playerPos: { x: number; y: number; z: number; yaw: number };
  currentDistrictId: string;
  activeHomeId: string;
  ownedPropertyIds: string[];
  houseUpgrades: Record<string, string[]>;
  ownedVehicles: OwnedVehicle[];
  inventory: InventoryItem[];
  discoveredLocationIds: string[];
  transitTickets: TransitTicket[];
  completedMissionIds: string[];
  fines: TrafficFine[];
  playerAppearance: HumanAppearance;
  settings: {
    graphics: GraphicsPreset;
    npcDensity: DensityPreset;
    language: 'en' | 'ml_en';
    weather: WeatherType;
    timePeriod: TimePeriod;
    audioEnabled: boolean;
    mobileControlsOverride: boolean | null;
  };
}

const DB_NAME = 'infinity_city_kerala_db';
const DB_VERSION = 1;
const STORE_NAME = 'saves';
const SAVE_KEY = 'primary_slot';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveGameToIndexedDB(payload: SaveGamePayload): Promise<boolean> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(payload, SAVE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }
}

export async function loadGameFromIndexedDB(): Promise<SaveGamePayload | null> {
  try {
    const db = await openDatabase();
    const data = await new Promise<SaveGamePayload | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(SAVE_KEY);
      req.onsuccess = () => resolve((req.result as SaveGamePayload) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (data) return data;
  } catch {
    // Fallback to localStorage below
  }
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as SaveGamePayload) : null;
  } catch {
    return null;
  }
}

export async function clearSavedGame(): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(SAVE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    // Ignore
  }
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}
