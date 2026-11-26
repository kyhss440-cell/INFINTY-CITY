import { HumanAppearance, NpcDialogueSession } from '../../types/game';

export interface KeralaNpcDefinition {
  appearance: HumanAppearance;
  homeX: number;
  homeZ: number;
  patrolRadius: number;
  routine: 'stationary' | 'patrol' | 'commute' | 'coastal' | 'market';
  serviceType: NpcDialogueSession['serviceType'];
  greetingEn: string;
  greetingMl: string;
  nearbyMissionId?: string;
}

const SKIN_TONES = ['#d49c78', '#c68b65', '#b87d56', '#a46945', '#8f5838', '#78472b', '#e0b08d'];
const HAIR_COLORS = ['#141210', '#1f1a17', '#2b211b', '#3b2c23', '#8a8d91'];

function pick<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length];
}

export const KERALA_NAMED_NPCS: KeralaNpcDefinition[] = [
  // 1. Tea Shop Master
  {
    appearance: {
      id: 'npc_krishnan',
      name: 'Krishnan Ettan',
      malayalamName: 'കൃഷ്ണൻ ഏട്ടൻ',
      role: 'Tea Shop Master',
      gender: 'male',
      ageGroup: 'senior',
      skinTone: '#9e6743',
      faceShape: 'round',
      eyeColor: '#261a14',
      hairStyle: 'recedingSenior',
      hairColor: '#9ca3af',
      facialHair: 'mustache',
      outfit: 'shirtMundu',
      primaryColor: '#0f766e',
      secondaryColor: '#f8fafc',
      accentColor: '#d97706',
      heightScale: 0.98,
      buildScale: 1.08,
      glasses: false,
      sunglasses: false,
      prop: 'teaGlass',
      walkStyle: 'elderly',
    },
    homeX: -24,
    homeZ: 28,
    patrolRadius: 2.5,
    routine: 'stationary',
    serviceType: 'teaShop',
    greetingEn: 'Welcome! Fresh hot samovar chai and crispy Pazham Pori are ready.',
    greetingMl: 'സ്വാഗതം! നല്ല ചൂട് സമോവർ ചായയും പഴംപൊരിയും റെഡിയാണ്.',
  },
  // 2. Hospital Doctor
  {
    appearance: {
      id: 'npc_dr_meera',
      name: 'Dr. Meera Nair',
      malayalamName: 'ഡോ. മീര നായർ',
      role: 'Senior Physician',
      gender: 'female',
      ageGroup: 'adult',
      skinTone: '#c68b65',
      faceShape: 'oval',
      eyeColor: '#2b1e16',
      hairStyle: 'longBun',
      hairColor: '#181412',
      facialHair: 'none',
      outfit: 'doctorCoat',
      primaryColor: '#f8fafc',
      secondaryColor: '#0284c7',
      accentColor: '#0f172a',
      heightScale: 0.97,
      buildScale: 0.92,
      glasses: true,
      sunglasses: false,
      prop: 'stethoscope',
      walkStyle: 'brisk',
    },
    homeX: 66,
    homeZ: -31,
    patrolRadius: 3.5,
    routine: 'stationary',
    serviceType: 'hospital',
    greetingEn: 'Ernakulam General Hospital is on 24/7 duty. Need treatment or an ambulance shift?',
    greetingMl: 'എറണാകുളം ജനറൽ ആശുപത്രി 24 മണിക്കൂറും സജ്ജമാണ്. ചികിത്സയോ ആംബുലൻസ് ഡ്യൂട്ടിയോ വേണോ?',
    nearbyMissionId: 'mission_ambulance_108',
  },
  // 3. Nurse
  {
    appearance: {
      id: 'npc_nurse_ann',
      name: 'Annamma Joseph',
      malayalamName: 'അന്നമ്മ ജോസഫ്',
      role: 'Staff Nurse',
      gender: 'female',
      ageGroup: 'adult',
      skinTone: '#d49c78',
      faceShape: 'heart',
      eyeColor: '#2e2017',
      hairStyle: 'braided',
      hairColor: '#1f1a17',
      facialHair: 'none',
      outfit: 'nurseScrubs',
      primaryColor: '#0d9488',
      secondaryColor: '#f8fafc',
      accentColor: '#14b8a6',
      heightScale: 0.95,
      buildScale: 0.9,
      glasses: false,
      sunglasses: false,
      prop: 'phone',
      walkStyle: 'brisk',
    },
    homeX: 73,
    homeZ: -32,
    patrolRadius: 5,
    routine: 'patrol',
    serviceType: 'hospital',
    greetingEn: 'Please drive carefully near the hospital zone—patients are resting inside.',
    greetingMl: 'ആശുപത്രി പരിസരത്ത് വേഗത കുറയ്ക്കുക. രോഗികൾ വിശ്രമിക്കുകയാണ്.',
  },
  // 4. Traffic Police Officer
  {
    appearance: {
      id: 'npc_traffic_suresh',
      name: 'SI Suresh Babu',
      malayalamName: 'എസ്.ഐ സുരേഷ് ബാബു',
      role: 'Traffic Police',
      gender: 'male',
      ageGroup: 'adult',
      skinTone: '#a46945',
      faceShape: 'square',
      eyeColor: '#211812',
      hairStyle: 'policeCap',
      hairColor: '#141210',
      facialHair: 'mustache',
      outfit: 'trafficPolice',
      primaryColor: '#b49a67',
      secondaryColor: '#f8fafc',
      accentColor: '#f59e0b',
      heightScale: 1.04,
      buildScale: 1.05,
      glasses: false,
      sunglasses: true,
      prop: 'none',
      walkStyle: 'confident',
    },
    homeX: -66,
    homeZ: -26,
    patrolRadius: 4,
    routine: 'stationary',
    serviceType: 'police',
    greetingEn: 'Keep left on Kerala roads and obey traffic lights. You can settle e-Challans here.',
    greetingMl: 'ഇടതുവശം ചേർന്ന് വാഹനമോടിക്കുക. ട്രാഫിക് പിഴകൾ ഇവിടെ അടയ്ക്കാം.',
  },
  // 5. Collectorate / Police Mission Officer
  {
    appearance: {
      id: 'npc_officer_sreekumar',
      name: 'Officer Sreekumar',
      malayalamName: 'ഓഫീസർ ശ്രീകുമാർ',
      role: 'Government Officer',
      gender: 'male',
      ageGroup: 'adult',
      skinTone: '#b87d56',
      faceShape: 'long',
      eyeColor: '#241a13',
      hairStyle: 'slickBack',
      hairColor: '#1b1715',
      facialHair: 'mustache',
      outfit: 'govtFormal',
      primaryColor: '#e2e8f0',
      secondaryColor: '#334155',
      accentColor: '#1d4ed8',
      heightScale: 1.02,
      buildScale: 0.98,
      glasses: true,
      sunglasses: false,
      prop: 'bag',
      walkStyle: 'confident',
    },
    homeX: 24,
    homeZ: -74,
    patrolRadius: 3,
    routine: 'stationary',
    serviceType: 'govt',
    greetingEn: 'District Collectorate & RTO desk. Need an urgent VIP transfer to Cochin Airport?',
    greetingMl: 'ജില്ലാ കളക്ടറേറ്റ് & ആർ.ടി.ഒ. എയർപോർട്ടിലേക്ക് ഒരു അടിയന്തര വി.ഐ.പി യാത്ര ഏറ്റെടുക്കാമോ?',
    nearbyMissionId: 'mission_airport_vip',
  },
  // 6. KSRTC Bus Conductor
  {
    appearance: {
      id: 'npc_conductor_rajan',
      name: 'Conductor Rajan',
      malayalamName: 'കണ്ടക്ടർ രാജൻ',
      role: 'Bus Conductor',
      gender: 'male',
      ageGroup: 'adult',
      skinTone: '#8f5838',
      faceShape: 'square',
      eyeColor: '#1f1610',
      hairStyle: 'shortSidePart',
      hairColor: '#171412',
      facialHair: 'mustache',
      outfit: 'busCrew',
      primaryColor: '#2563eb',
      secondaryColor: '#1e293b',
      accentColor: '#facc15',
      heightScale: 1.0,
      buildScale: 1.02,
      glasses: false,
      sunglasses: false,
      prop: 'ticketMachine',
      walkStyle: 'brisk',
    },
    homeX: 20,
    homeZ: 14,
    patrolRadius: 4,
    routine: 'stationary',
    serviceType: 'bus',
    greetingEn: 'Fort Kochi – Ernakulam Express departing soon! Want to drive a bus shift?',
    greetingMl: 'ഫോർട്ട് കൊച്ചി - എറണാകുളം ബസ് ഉടൻ പുറപ്പെടും! ബസ് ഡ്യൂട്ടി എടുക്കുന്നുണ്ടോ?',
    nearbyMissionId: 'mission_bus_route',
  },
  // 7. Auto Driver Mani
  {
    appearance: {
      id: 'npc_auto_mani',
      name: 'Auto Mani',
      malayalamName: 'ഓട്ടോ മണി',
      role: 'Auto Rickshaw Driver',
      gender: 'male',
      ageGroup: 'adult',
      skinTone: '#995f3c',
      faceShape: 'round',
      eyeColor: '#221813',
      hairStyle: 'curlyVoluminous',
      hairColor: '#141210',
      facialHair: 'stubble',
      outfit: 'autoDriver',
      primaryColor: '#a18862',
      secondaryColor: '#f8fafc',
      accentColor: '#eab308',
      heightScale: 0.96,
      buildScale: 0.98,
      glasses: false,
      sunglasses: false,
      prop: 'none',
      walkStyle: 'relaxed',
    },
    homeX: 12,
    homeZ: 16,
    patrolRadius: 3.5,
    routine: 'stationary',
    serviceType: 'general',
    greetingEn: 'Hey brother! Need a quick passenger mission from the bus stand to the railway station?',
    greetingMl: 'ഹലോ ചേട്ടാ! ബസ് സ്റ്റാൻഡിൽ നിന്ന് റെയിൽവേ സ്റ്റേഷനിലേക്ക് ഒരു ഓട്ടം പോകാമോ?',
    nearbyMissionId: 'mission_auto_station',
  },
  // 8. Railway Station Master
  {
    appearance: {
      id: 'npc_rail_thomas',
      name: 'Mathew Thomas',
      malayalamName: 'മാത്യു തോമസ്',
      role: 'Railway Station Master',
      gender: 'male',
      ageGroup: 'senior',
      skinTone: '#b87d56',
      faceShape: 'oval',
      eyeColor: '#261b14',
      hairStyle: 'slickBack',
      hairColor: '#94a3b8',
      facialHair: 'mustache',
      outfit: 'govtFormal',
      primaryColor: '#ffffff',
      secondaryColor: '#1e293b',
      accentColor: '#dc2626',
      heightScale: 1.01,
      buildScale: 1.04,
      glasses: true,
      sunglasses: false,
      prop: 'ticketMachine',
      walkStyle: 'confident',
    },
    homeX: 106,
    homeZ: -16,
    patrolRadius: 3,
    routine: 'stationary',
    serviceType: 'railway',
    greetingEn: 'Ernakulam Junction South. Buy tickets here for trains across all 14 Kerala districts.',
    greetingMl: 'എറണാകുളം സൗത്ത് റെയിൽവേ സ്റ്റേഷൻ. കേരളത്തിലെ എല്ലാ ജില്ലകളിലേക്കും ടിക്കറ്റ് ലഭ്യമാണ്.',
  },
  // 9. Boat Jetty Ferry Master
  {
    appearance: {
      id: 'npc_jetty_basheer',
      name: 'Basheer K.',
      malayalamName: 'ബഷീർ കെ.',
      role: 'Water Metro Captain',
      gender: 'male',
      ageGroup: 'adult',
      skinTone: '#8f5838',
      faceShape: 'square',
      eyeColor: '#1b1410',
      hairStyle: 'shortSidePart',
      hairColor: '#171412',
      facialHair: 'fullBeard',
      outfit: 'fishermanLungi',
      primaryColor: '#0284c7',
      secondaryColor: '#0f766e',
      accentColor: '#f8fafc',
      heightScale: 1.02,
      buildScale: 1.08,
      glasses: false,
      sunglasses: true,
      prop: 'none',
      walkStyle: 'relaxed',
    },
    homeX: -154,
    homeZ: 18,
    patrolRadius: 3,
    routine: 'stationary',
    serviceType: 'boat',
    greetingEn: 'Backwater ferries & Water Metro departures to Alappuzha, Kottayam, and Kollam.',
    greetingMl: 'ആലപ്പുഴ, കോട്ടയം, കൊല്ലം ഭാഗങ്ങളിലേക്കുള്ള ബോട്ട് സർവീസ് ഇവിടെ നിന്ന് പുറപ്പെടും.',
  },
  // 10. Showroom Manager & Racing Host
  {
    appearance: {
      id: 'npc_vikram',
      name: 'Vikram Menon',
      malayalamName: 'വിക്രം മേനോൻ',
      role: 'Showroom Director',
      gender: 'male',
      ageGroup: 'adult',
      skinTone: '#d49c78',
      faceShape: 'oval',
      eyeColor: '#291c15',
      hairStyle: 'slickBack',
      hairColor: '#141210',
      facialHair: 'stubble',
      outfit: 'casualDenim',
      primaryColor: '#0f172a',
      secondaryColor: '#1e293b',
      accentColor: '#f59e0b',
      heightScale: 1.05,
      buildScale: 1.0,
      glasses: false,
      sunglasses: true,
      prop: 'phone',
      walkStyle: 'confident',
    },
    homeX: -22,
    homeZ: -100,
    patrolRadius: 3,
    routine: 'stationary',
    serviceType: 'showroom',
    greetingEn: 'Malabar Auto Showroom! Browse Kerala vehicles, upgrade your engine, or try our coastal race.',
    greetingMl: 'മലബാർ ഓട്ടോ ഷോറൂമിലേക്ക് സ്വാഗതം! പുതിയ വാഹനങ്ങൾ വാങ്ങാം, റേസിംഗിൽ പങ്കെടുക്കാം.',
    nearbyMissionId: 'mission_coastal_race',
  },
  // 11. Airport Desk Attendant
  {
    appearance: {
      id: 'npc_air_devika',
      name: 'Devika Varma',
      malayalamName: 'ദേവിക വർമ്മ',
      role: 'Airline Ground Staff',
      gender: 'female',
      ageGroup: 'adult',
      skinTone: '#d49c78',
      faceShape: 'oval',
      eyeColor: '#261a14',
      hairStyle: 'longBun',
      hairColor: '#1b1715',
      facialHair: 'none',
      outfit: 'kasavuSaree',
      primaryColor: '#0369a1',
      secondaryColor: '#f8fafc',
      accentColor: '#eab308',
      heightScale: 0.96,
      buildScale: 0.88,
      glasses: false,
      sunglasses: false,
      prop: 'bag',
      walkStyle: 'confident',
    },
    homeX: 155,
    homeZ: -124,
    patrolRadius: 3,
    routine: 'stationary',
    serviceType: 'airport',
    greetingEn: 'Cochin International Air Terminal. Check in for flights to Kozhikode, Kannur, or Trivandrum.',
    greetingMl: 'കൊച്ചി അന്താരാഷ്ട്ര വിമാനത്താവളം. കോഴിക്കോട്, കണ്ണൂർ, തിരുവനന്തപുരം വിമാനങ്ങൾ ലഭ്യമാണ്.',
  },
  // 12. Real Estate Broker at Mansion
  {
    appearance: {
      id: 'npc_broker_latha',
      name: 'Latha Pillai',
      malayalamName: 'ലത പിള്ള',
      role: 'Luxury Estate Advisor',
      gender: 'female',
      ageGroup: 'adult',
      skinTone: '#c68b65',
      faceShape: 'heart',
      eyeColor: '#211812',
      hairStyle: 'shoulderLength',
      hairColor: '#1f1a17',
      facialHair: 'none',
      outfit: 'kasavuSaree',
      primaryColor: '#fef3c7',
      secondaryColor: '#991b1b',
      accentColor: '#d4af37',
      heightScale: 0.95,
      buildScale: 0.92,
      glasses: true,
      sunglasses: false,
      prop: 'phone',
      walkStyle: 'confident',
    },
    homeX: 126,
    homeZ: 132,
    patrolRadius: 3,
    routine: 'stationary',
    serviceType: 'property',
    greetingEn: 'Welcome to Vembanad Pearl Mansion! Inspect properties and expand your Kerala real estate.',
    greetingMl: 'വേമ്പനാട് ലക്ഷ്വറി മാൻഷനിലേക്ക് സ്വാഗതം! പുതിയ വീടുകളും മാൻഷനുകളും സ്വന്തമാക്കാം.',
  },
];

// Generate 44 additional diverse Kerala-inspired roaming & ambient NPCs
const FIRST_NAMES_M = [
  ['Akhil', 'അഖിൽ'],
  ['Pranav', 'പ്രണവ്'],
  ['Shaji', 'ഷാജി'],
  ['Faisal', 'ഫൈസൽ'],
  ['Biju', 'ബിജു'],
  ['Vineeth', 'വിനീത്'],
  ['Gokul', 'ഗോകുൽ'],
  ['Ramesh', 'രമേശ്'],
  ['Nithin', 'നിതിൻ'],
  ['Jibin', 'ജിബിൻ'],
  ['Harish', 'ഹരീഷ്'],
  ['Kiran', 'കിരൺ'],
];
const FIRST_NAMES_F = [
  ['Anjali', 'അഞ്ജലി'],
  ['Sneha', 'സ്നേഹ'],
  ['Fathima', 'ഫാത്തിമ'],
  ['Lakshmi', 'ലക്ഷ്മി'],
  ['Reshma', 'രേഷ്മ'],
  ['Aiswarya', 'ഐശ്വര്യ'],
  ['Nandana', 'നന്ദന'],
  ['Merin', 'മെറിൻ'],
  ['Deepthi', 'ദീപ്തി'],
  ['Kavya', 'കാവ്യ'],
  ['Sreelakshmi', 'ശ്രീലക്ഷ്മി'],
  ['Hanna', 'ഹന്ന'],
];

const KERALA_ROLES: Array<{
  role: string;
  gender: 'male' | 'female';
  ageGroup: 'child' | 'teen' | 'adult' | 'senior';
  outfit: HumanAppearance['outfit'];
  prop: HumanAppearance['prop'];
  colors: [string, string, string];
}> = [
  { role: 'College Student', gender: 'female', ageGroup: 'teen', outfit: 'churidar', prop: 'bag', colors: ['#be185d', '#fce7f3', '#f59e0b'] },
  { role: 'College Student', gender: 'male', ageGroup: 'teen', outfit: 'casualDenim', prop: 'phone', colors: ['#1d4ed8', '#1e293b', '#e2e8f0'] },
  { role: 'School Student', gender: 'male', ageGroup: 'child', outfit: 'schoolUniform', prop: 'bag', colors: ['#38bdf8', '#1e3a8a', '#f8fafc'] },
  { role: 'School Student', gender: 'female', ageGroup: 'child', outfit: 'schoolUniform', prop: 'bag', colors: ['#38bdf8', '#1e3a8a', '#f8fafc'] },
  { role: 'Kerala Teacher', gender: 'female', ageGroup: 'adult', outfit: 'kasavuSaree', prop: 'bag', colors: ['#fefce8', '#047857', '#d4af37'] },
  { role: 'Local Trader', gender: 'male', ageGroup: 'adult', outfit: 'shirtMundu', prop: 'phone', colors: ['#f8fafc', '#f1f5f9', '#b45309'] },
  { role: 'Fisherman', gender: 'male', ageGroup: 'adult', outfit: 'fishermanLungi', prop: 'none', colors: ['#0369a1', '#0f766e', '#f59e0b'] },
  { role: 'Tourist', gender: 'female', ageGroup: 'adult', outfit: 'touristLinen', prop: 'camera', colors: ['#fef3c7', '#fb7185', '#d97706'] },
  { role: 'Tourist', gender: 'male', ageGroup: 'adult', outfit: 'touristLinen', prop: 'camera', colors: ['#e0f2fe', '#78350f', '#0284c7'] },
  { role: 'Delivery Rider', gender: 'male', ageGroup: 'adult', outfit: 'deliveryVest', prop: 'bag', colors: ['#ea580c', '#1e293b', '#facc15'] },
  { role: 'Office Commuter', gender: 'male', ageGroup: 'adult', outfit: 'govtFormal', prop: 'bag', colors: ['#e2e8f0', '#334155', '#0284c7'] },
  { role: 'Senior Resident', gender: 'male', ageGroup: 'senior', outfit: 'kurtaPajama', prop: 'umbrella', colors: ['#fef9c3', '#f8fafc', '#a16207'] },
  { role: 'Senior Resident', gender: 'female', ageGroup: 'senior', outfit: 'kasavuSaree', prop: 'none', colors: ['#fffbeb', '#7c2d12', '#d4af37'] },
  { role: 'Shopper', gender: 'female', ageGroup: 'adult', outfit: 'churidar', prop: 'bag', colors: ['#0f766e', '#ccfbf1', '#f59e0b'] },
  { role: 'Hotel Staff', gender: 'male', ageGroup: 'adult', outfit: 'govtFormal', prop: 'none', colors: ['#1e293b', '#0f172a', '#d97706'] },
  { role: 'Farmer', gender: 'male', ageGroup: 'adult', outfit: 'shirtMundu', prop: 'none', colors: ['#65a30d', '#f8fafc', '#854d0e'] },
];

// Sidewalk / plaza anchor hubs where crowds naturally gather
const CROWD_HUBS = [
  { x: -18, z: 22, r: 22 },   // Chaya Kadai & Town Center
  { x: 20, z: 20, r: 24 },    // Bus Stand
  { x: 105, z: -15, r: 24 },  // Railway Station
  { x: -162, z: -42, r: 30 }, // Fort Kochi Beach & Chinese Nets
  { x: 64, z: -32, r: 22 },   // Hospital Plaza
  { x: -64, z: 48, r: 25 },   // Residential Tharavadu Street
  { x: 22, z: -72, r: 22 },   // Collectorate Promenade
  { x: -20, z: -96, r: 20 },  // Showroom Market
];

export function generateAmbientKeralaNpcs(count = 44): KeralaNpcDefinition[] {
  const list: KeralaNpcDefinition[] = [];
  const faceShapes: HumanAppearance['faceShape'][] = ['oval', 'square', 'round', 'heart', 'long'];
  const maleHairs: HumanAppearance['hairStyle'][] = ['shortSidePart', 'curlyVoluminous', 'slickBack', 'recedingSenior'];
  const femaleHairs: HumanAppearance['hairStyle'][] = ['longBun', 'braided', 'shoulderLength', 'curlyVoluminous'];
  const walkStyles: HumanAppearance['walkStyle'][] = ['relaxed', 'brisk', 'confident', 'elderly'];

  for (let i = 0; i < count; i++) {
    const roleCfg = pick(KERALA_ROLES, i);
    const isFemale = roleCfg.gender === 'female';
    const namePair = isFemale ? pick(FIRST_NAMES_F, i) : pick(FIRST_NAMES_M, i);
    const hub =
      roleCfg.role === 'Fisherman' || roleCfg.role === 'Tourist'
        ? CROWD_HUBS[3]
        : CROWD_HUBS[i % CROWD_HUBS.length];

    const angle = (i * 2.39996) % (Math.PI * 2);
    const dist = 4 + ((i * 7) % Math.max(8, hub.r - 4));
    const hx = hub.x + Math.cos(angle) * dist;
    const hz = hub.z + Math.sin(angle) * dist;

    const ageScale =
      roleCfg.ageGroup === 'child'
        ? 0.78
        : roleCfg.ageGroup === 'teen'
        ? 0.93
        : 0.96 + ((i % 5) * 0.025);

    const hairColor =
      roleCfg.ageGroup === 'senior'
        ? '#9ca3af'
        : roleCfg.role === 'Tourist' && i % 2 === 0
        ? '#5c3c24'
        : pick(HAIR_COLORS, i);

    const hairStyle =
      roleCfg.role === 'Delivery Rider'
        ? 'helmet'
        : roleCfg.role === 'Tourist' && i % 3 === 0
        ? 'sunHat'
        : isFemale
        ? pick(femaleHairs, i)
        : roleCfg.ageGroup === 'senior'
        ? 'recedingSenior'
        : pick(maleHairs, i);

    const facialHair: HumanAppearance['facialHair'] =
      isFemale || roleCfg.ageGroup === 'child' || roleCfg.ageGroup === 'teen'
        ? 'none'
        : (['mustache', 'stubble', 'fullBeard', 'none'][i % 4] as HumanAppearance['facialHair']);

    list.push({
      appearance: {
        id: `npc_ambient_${i}`,
        name: namePair[0],
        malayalamName: namePair[1],
        role: roleCfg.role,
        gender: roleCfg.gender,
        ageGroup: roleCfg.ageGroup,
        skinTone: pick(SKIN_TONES, i * 3 + 1),
        faceShape: pick(faceShapes, i * 2),
        eyeColor: '#231711',
        hairStyle,
        hairColor,
        facialHair,
        outfit: roleCfg.outfit,
        primaryColor: roleCfg.colors[0],
        secondaryColor: roleCfg.colors[1],
        accentColor: roleCfg.colors[2],
        heightScale: ageScale,
        buildScale: roleCfg.ageGroup === 'child' ? 0.82 : 0.9 + ((i % 4) * 0.06),
        glasses: roleCfg.ageGroup === 'senior' || (roleCfg.role === 'Kerala Teacher' && i % 2 === 0),
        sunglasses: roleCfg.role === 'Tourist' && i % 2 === 1,
        prop: roleCfg.prop,
        walkStyle:
          roleCfg.ageGroup === 'senior'
            ? 'elderly'
            : walkStyles[i % 3],
      },
      homeX: hx,
      homeZ: hz,
      patrolRadius: 16 + (i % 14),
      routine: i % 5 === 0 ? 'stationary' : 'patrol',
      serviceType: 'general',
      greetingEn: `Hello! Lovely day here in Kochi. Enjoy exploring Kerala's streets and backwaters!`,
      greetingMl: `നമസ്കാരം! കൊച്ചിയിലെ കാഴ്ചകൾ ആസ്വദിക്കൂ. ശ്രദ്ധയോടെ യാത്ര ചെയ്യൂ!`,
    });
  }
  return list;
}
