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
  buildScale: number;
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
  | 'boat'
  | 'airplane';

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
  isAircraft?: boolean;
  isEmergency?: boolean;
  destinationBoard?: string;
}

export interface OwnedVehicle extends VehicleSpec {
  instanceId: string;
  customColor: string;
  engineLevel: number;
  handlingLevel: number;
  health: number; // 0-100
  fuel: number; // 0-100
  parkedX: number;
  parkedZ: number;
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

export type WorldLocationType =
  | 'home'
  | 'mansion'
  | 'hospital'
  | 'police'
  | 'firestation'
  | 'bank'
  | 'govt'
  | 'railway'
  | 'busstand'
  | 'airport'
  | 'jetty'
  | 'shop'
  | 'mall'
  | 'clothing'
  | 'electronics'
  | 'restaurant'
  | 'hotel'
  | 'cinema'
  | 'school'
  | 'fuel'
  | 'garage'
  | 'landmark';

export interface WorldLocation {
  id: string;
  name: string;
  malayalamName: string;
  type: WorldLocationType;
  x: number;
  z: number;
  radius: number;
  districtId: string;
  description: string;
  interactPrompt?: string;
  enterable?: boolean;
}

export interface PropertyListing {
  id: string;
  name: string;
  malayalamName: string;
  type: 'House' | 'Apartment' | 'Villa' | 'Luxury Mansion';
  district: string;
  districtId: string;
  price: number;
  owned: boolean;
  garageSlots: number;
  spawnX: number;
  spawnZ: number;
  description: string;
  features: string[];
}

export interface HouseUpgradeDef {
  id: string;
  name: string;
  category: 'Furniture' | 'Exterior' | 'Security' | 'Garage';
  price: number;
  description: string;
}

export interface StoreItemDef {
  id: string;
  name: string;
  malayalamName: string;
  category: 'food' | 'clothing' | 'electronics' | 'gear' | 'vehicle';
  shopTypes: WorldLocationType[];
  price: number;
  healthGain?: number;
  description: string;
}

export interface InventoryItem {
  itemId: string;
  name: string;
  category: StoreItemDef['category'];
  quantity: number;
  healthGain?: number;
}

export interface MissionDef {
  id: string;
  title: string;
  malayalamTitle: string;
  category: 'Taxi' | 'Bus' | 'Ambulance' | 'Delivery' | 'Racing' | 'Story' | 'Boat' | 'Rival';
  giverName: string;
  description: string;
  rewardCash: number;
  rewardPoints: number;
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

export interface TransitTicket {
  id: string;
  mode: 'train' | 'flight' | 'boat' | 'bus';
  fromLabel: string;
  toLabel: string;
  destX: number;
  destZ: number;
  price: number;
  issuedAt: number;
  used: boolean;
}

export type GpsTravelMode = 'car' | 'bike' | 'walk' | 'boat';

export interface GpsRouteState {
  destinationId: string;
  destinationName: string;
  destX: number;
  destZ: number;
  mode: GpsTravelMode;
  useAlternative: boolean;
  waypoints: Array<{ x: number; z: number; label?: string }>;
  altWaypoints: Array<{ x: number; z: number; label?: string }>;
  distanceMeters: number;
  etaSeconds: number;
  nextTurnHint: string;
}

export interface NpcDialogueSession {
  npcId: string;
  name: string;
  malayalamName: string;
  role: string;
  greetingEn: string;
  greetingMl: string;
  serviceType:
    | 'general'
    | 'teaShop'
    | 'hospital'
    | 'police'
    | 'railway'
    | 'bus'
    | 'airport'
    | 'boat'
    | 'showroom'
    | 'property'
    | 'govt'
    | 'mall'
    | 'fuel'
    | 'bank'
    | 'cinema';
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
  type:
    | 'npc'
    | 'vehicle'
    | 'police'
    | 'location'
    | 'mission'
    | 'my_house'
    | 'my_garage'
    | 'my_car'
    | 'my_bike';
  label?: string;
}
