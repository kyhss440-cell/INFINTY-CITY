export type GamePhase = 'menu' | 'playing' | 'paused';

export type CameraMode = 'third-person' | 'first-person' | 'cinematic';

export type GraphicsPreset = 'low' | 'medium' | 'high' | 'ultra';
export type DensityPreset = 'low' | 'medium' | 'high';
export type WeatherType = 'sunny' | 'cloudy' | 'rain' | 'monsoon' | 'fog';
export type TimePeriod = 'sunrise' | 'morning' | 'afternoon' | 'sunset' | 'night';

export type Gender = 'male' | 'female';
export type AgeGroup = 'child' | 'teen' | 'adult' | 'senior';

export type FaceShape = 'oval' | 'square' | 'round' | 'heart' | 'long';
export type HairStyle =
  | 'shortSidePart'
  | 'curlyVoluminous'
  | 'slickBack'
  | 'longBun'
  | 'braided'
  | 'shoulderLength'
  | 'recedingSenior'
  | 'policeCap'
  | 'sunHat'
  | 'helmet';

export type OutfitStyle =
  | 'shirtMundu'
  | 'kasavuSaree'
  | 'churidar'
  | 'casualDenim'
  | 'kurtaPajama'
  | 'doctorCoat'
  | 'nurseScrubs'
  | 'trafficPolice'
  | 'policeUniform'
  | 'busCrew'
  | 'autoDriver'
  | 'fishermanLungi'
  | 'schoolUniform'
  | 'touristLinen'
  | 'deliveryVest'
  | 'govtFormal';

export interface HumanAppearance {
  id: string;
  name: string;
  malayalamName: string;
  role: string;
  gender: Gender;
  ageGroup: AgeGroup;
  skinTone: string;
  faceShape: FaceShape;
  eyeColor: string;
  hairStyle: HairStyle;
  hairColor: string;
  facialHair: 'none' | 'mustache' | 'stubble' | 'fullBeard';
  outfit: OutfitStyle;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  heightScale: number;
  buildScale: number; // width/muscle/torso thickness
  glasses: boolean;
  sunglasses: boolean;
  prop: 'none' | 'phone' | 'teaGlass' | 'bag' | 'stethoscope' | 'ticketMachine' | 'camera' | 'umbrella';
  walkStyle: 'relaxed' | 'brisk' | 'elderly' | 'confident';
}

export type VehicleCategory =
  | 'hatchback'
  | 'suv'
  | 'auto'
  | 'bus'
  | 'motorcycle'
  | 'truck'
  | 'police'
  | 'ambulance'
  | 'boat';

export interface VehicleSpec {
  id: string;
  modelName: string;
  brand: string;
  category: VehicleCategory;
  plateNumber: string;
  color: string;
  secondaryColor: string;
  maxSpeedKmh: number;
  acceleration: number;
  braking: number;
  handling: number;
  mass: number;
  price: number;
  seats: number;
  isWatercraft?: boolean;
  isEmergency?: boolean;
  destinationBoard?: string;
}

export interface OwnedVehicle extends VehicleSpec {
  instanceId: string;
  customColor: string;
  engineLevel: number;
  handlingLevel: number;
  health: number; // 0-100
}

export interface KeralaDistrict {
  id: string;
  name: string;
  malayalamName: string;
  region: 'North' | 'Central' | 'Highlands' | 'South';
  mapX: number; // 0-100% on Kerala SVG map
  mapY: number; // 0-100% on Kerala SVG map
  description: string;
  highlights: string[];
  hasAirport?: boolean;
  hasRailway?: boolean;
  hasBackwaters?: boolean;
  spawnOffset?: { x: number; z: number };
  unlocked: boolean;
}

export interface WorldLocation {
  id: string;
  name: string;
  malayalamName: string;
  type:
    | 'home'
    | 'mansion'
    | 'hospital'
    | 'police'
    | 'govt'
    | 'railway'
    | 'busstand'
    | 'airport'
    | 'jetty'
    | 'shop'
    | 'restaurant'
    | 'garage'
    | 'landmark';
  x: number;
  z: number;
  radius: number;
  districtId: string;
  description: string;
  interactPrompt?: string;
}

export interface PropertyListing {
  id: string;
  name: string;
  malayalamName: string;
  type: 'House' | 'Apartment' | 'Villa' | 'Luxury Mansion';
  district: string;
  price: number;
  owned: boolean;
  garageSlots: number;
  spawnX: number;
  spawnZ: number;
  description: string;
  features: string[];
}

export interface MissionDef {
  id: string;
  title: string;
  malayalamTitle: string;
  category: 'Taxi' | 'Bus' | 'Ambulance' | 'Delivery' | 'Racing' | 'Story' | 'Boat';
  giverName: string;
  description: string;
  rewardCash: number;
  targetX: number;
  targetZ: number;
  targetLabel: string;
  timeLimitSec?: number;
  requiredVehicleCategory?: VehicleCategory;
}

export interface ActiveMissionState {
  mission: MissionDef;
  stage: 'go_to_target' | 'return_or_complete';
  timeRemaining: number;
  progressText: string;
}

export interface TrafficFine {
  id: string;
  reason: string;
  malayalamReason: string;
  amount: number;
  timestamp: number;
  paid: boolean;
}

export interface NpcDialogueSession {
  npcId: string;
  name: string;
  malayalamName: string;
  role: string;
  greetingEn: string;
  greetingMl: string;
  serviceType: 'general' | 'teaShop' | 'hospital' | 'police' | 'railway' | 'bus' | 'airport' | 'boat' | 'showroom' | 'property' | 'govt';
  nearbyMissionId?: string;
}

export interface GameNotification {
  id: string;
  title: string;
  message: string;
  variant: 'info' | 'success' | 'warning' | 'alert';
}

export interface MinimapEntity {
  x: number;
  z: number;
  type: 'npc' | 'vehicle' | 'police' | 'location' | 'mission';
  label?: string;
}
