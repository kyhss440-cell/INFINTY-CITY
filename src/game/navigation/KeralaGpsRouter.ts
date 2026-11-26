import { GpsRouteState, GpsTravelMode } from '../../types/game';

interface GraphNode {
  id: string;
  x: number;
  z: number;
  label: string;
  water?: boolean;
}

const ROAD_NODES: GraphNode[] = [
  // Core Kochi / Ernakulam Grid
  { id: 'n_c0', x: 0, z: 0, label: 'MG Road Junction' },
  { id: 'n_c1', x: -120, z: 0, label: 'Fort Kochi Coastal Ave' },
  { id: 'n_c2', x: 90, z: 0, label: 'Ernakulam Station Rd' },
  { id: 'n_n0', x: 0, z: -96, label: 'Collectorate NH-66 Junction' },
  { id: 'n_n1', x: -120, z: -96, label: 'Showroom North West' },
  { id: 'n_n2', x: 90, z: -96, label: 'Hospital & Airport Spur' },
  { id: 'n_s0', x: 0, z: 88, label: 'Vembanad South Bypass' },
  { id: 'n_s1', x: -120, z: 88, label: 'Tharavadu Corner' },
  { id: 'n_s2', x: 90, z: 88, label: 'Kottayam Link Road' },
  { id: 'n_jetty', x: -152, z: 18, label: 'Fort Kochi Boat Jetty' },
  { id: 'n_c1_j', x: -120, z: 18, label: 'Boat Jetty Turnoff' },

  // North Kerala & Highlands
  { id: 'n_thrissur_j', x: 0, z: -210, label: 'Thrissur Highway Turn' },
  { id: 'n_thrissur', x: -25, z: -210, label: 'Thrissur Swaraj Round' },
  { id: 'n_kozhikode', x: -125, z: -210, label: 'Kozhikode Coastal Bypass' },
  { id: 'n_kannur', x: -125, z: -265, label: 'Kannur Terminal Rd' },
  { id: 'n_kasaragod', x: -130, z: -340, label: 'Kasaragod Bekal Hwy' },
  { id: 'n_malappuram', x: 85, z: -210, label: 'Malappuram Hill Rd' },
  { id: 'n_palakkad', x: 215, z: -175, label: 'Palakkad Dam Road' },
  { id: 'n_munnar_j', x: 315, z: -210, label: 'Munnar Estate Junction' },
  { id: 'n_munnar', x: 315, z: -240, label: 'Munnar Tea Valley' },
  { id: 'n_wayanad_e', x: 315, z: -330, label: 'Wayanad Hairpin Summit' },
  { id: 'n_wayanad', x: 245, z: -330, label: 'Wayanad Ghat Viewpoint' },
  { id: 'n_wayanad_w', x: 85, z: -330, label: 'Nilambur Valley Link' },

  // South Kerala & Backwaters
  { id: 'n_kuttanad_b', x: -120, z: 270, label: 'Alappuzha Backwater Bridge' },
  { id: 'n_kuttanad', x: -245, z: 270, label: 'Kuttanad Paddy Island' },
  { id: 'n_kollam', x: -120, z: 315, label: 'Kollam Ashtamudi Hwy' },
  { id: 'n_kovalam', x: -120, z: 360, label: 'Kovalam Lighthouse Rd' },
  { id: 'n_tvm_j', x: 0, z: 280, label: 'Thiruvananthapuram NH-66' },
  { id: 'n_tvm_sec', x: 55, z: 280, label: 'Secretariat Boulevard' },
  { id: 'n_tvm_s', x: 0, z: 360, label: 'Kovalam - TVM Bypass' },
  { id: 'n_tvm_air', x: 165, z: 280, label: 'Trivandrum Air Terminal Rd' },

  // Boat Waterways
  { id: 'w_kochi', x: -205, z: 18, label: 'Fort Kochi Harbour Channel', water: true },
  { id: 'w_mid', x: -205, z: 155, label: 'Vembanad Shipping Channel', water: true },
  { id: 'w_kuttanad', x: -205, z: 245, label: 'Alappuzha Backwater Channel', water: true },
  { id: 'w_kollam', x: -175, z: 315, label: 'Ashtamudi Coastal Channel', water: true },
  { id: 'w_kovalam', x: -175, z: 375, label: 'Kovalam Arabian Sea', water: true },
];

const ROAD_EDGES: Array<[string, string]> = [
  ['n_c0', 'n_c1'],
  ['n_c0', 'n_c2'],
  ['n_c0', 'n_n0'],
  ['n_c0', 'n_s0'],
  ['n_c1', 'n_c1_j'],
  ['n_c1_j', 'n_jetty'],
  ['n_c1_j', 'n_s1'],
  ['n_c1', 'n_n1'],
  ['n_n1', 'n_n0'],
  ['n_n0', 'n_n2'],
  ['n_n2', 'n_c2'],
  ['n_c2', 'n_s2'],
  ['n_s2', 'n_s0'],
  ['n_s0', 'n_s1'],

  // North connections
  ['n_n0', 'n_thrissur_j'],
  ['n_thrissur_j', 'n_thrissur'],
  ['n_thrissur', 'n_kozhikode'],
  ['n_kozhikode', 'n_n1'],
  ['n_kozhikode', 'n_kannur'],
  ['n_kannur', 'n_kasaragod'],
  ['n_thrissur_j', 'n_malappuram'],
  ['n_malappuram', 'n_palakkad'],
  ['n_palakkad', 'n_n2'],
  ['n_malappuram', 'n_munnar_j'],
  ['n_munnar_j', 'n_munnar'],
  ['n_munnar', 'n_wayanad_e'],
  ['n_wayanad_e', 'n_wayanad'],
  ['n_wayanad', 'n_wayanad_w'],
  ['n_wayanad_w', 'n_malappuram'],
  ['n_wayanad_w', 'n_kannur'],

  // South connections
  ['n_s1', 'n_kuttanad_b'],
  ['n_kuttanad_b', 'n_kuttanad'],
  ['n_kuttanad_b', 'n_kollam'],
  ['n_kollam', 'n_kovalam'],
  ['n_kovalam', 'n_tvm_s'],
  ['n_s0', 'n_tvm_j'],
  ['n_tvm_j', 'n_tvm_s'],
  ['n_tvm_j', 'n_tvm_sec'],
  ['n_tvm_sec', 'n_tvm_air'],
  ['n_tvm_air', 'n_s2'],

  // Waterways
  ['w_kochi', 'w_mid'],
  ['w_mid', 'w_kuttanad'],
  ['w_kuttanad', 'w_kollam'],
  ['w_kollam', 'w_kovalam'],
];

const NODE_MAP = new Map(ROAD_NODES.map((n) => [n.id, n]));

function findNearestNode(x: number, z: number, waterOnly: boolean): GraphNode {
  let best = ROAD_NODES[0];
  let bestD2 = Infinity;
  for (const n of ROAD_NODES) {
    if (Boolean(n.water) !== waterOnly) continue;
    const d2 = (n.x - x) ** 2 + (n.z - z) ** 2;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = n;
    }
  }
  return best;
}

function runDijkstra(
  startId: string,
  endId: string,
  waterOnly: boolean,
  penalizedEdge?: [string, string]
): string[] {
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const unvisited = new Set<string>();

  for (const n of ROAD_NODES) {
    if (Boolean(n.water) !== waterOnly) continue;
    dist.set(n.id, Infinity);
    unvisited.add(n.id);
  }
  dist.set(startId, 0);

  while (unvisited.size > 0) {
    let curr: string | null = null;
    let minD = Infinity;
    for (const id of unvisited) {
      const d = dist.get(id) ?? Infinity;
      if (d < minD) {
        minD = d;
        curr = id;
      }
    }
    if (!curr || curr === endId || minD === Infinity) break;
    unvisited.delete(curr);

    const currNode = NODE_MAP.get(curr)!;
    for (const [a, b] of ROAD_EDGES) {
      const next = a === curr ? b : b === curr ? a : null;
      if (!next || !unvisited.has(next)) continue;
      const nextNode = NODE_MAP.get(next)!;
      let weight = Math.hypot(nextNode.x - currNode.x, nextNode.z - currNode.z);
      if (
        penalizedEdge &&
        ((penalizedEdge[0] === curr && penalizedEdge[1] === next) ||
          (penalizedEdge[1] === curr && penalizedEdge[0] === next))
      ) {
        weight *= 4.2;
      }
      const alt = minD + weight;
      if (alt < (dist.get(next) ?? Infinity)) {
        dist.set(next, alt);
        prev.set(next, curr);
      }
    }
  }

  const path: string[] = [];
  let trace: string | undefined = endId;
  while (trace) {
    path.unshift(trace);
    if (trace === startId) break;
    trace = prev.get(trace);
  }
  return path.length > 0 && path[0] === startId ? path : [startId, endId];
}

export function computeKeralaGpsRoute(
  fromX: number,
  fromZ: number,
  destId: string,
  destName: string,
  destX: number,
  destZ: number,
  mode: GpsTravelMode,
  useAlternative = false
): GpsRouteState {
  const waterOnly = mode === 'boat';
  const startNode = findNearestNode(fromX, fromZ, waterOnly);
  const endNode = findNearestNode(destX, destZ, waterOnly);

  const primaryIds = runDijkstra(startNode.id, endNode.id, waterOnly);
  const midIdx = Math.floor(primaryIds.length / 2);
  const penalized: [string, string] | undefined =
    primaryIds.length >= 3 ? [primaryIds[midIdx - 1], primaryIds[midIdx]] : undefined;
  const altIds = penalized
    ? runDijkstra(startNode.id, endNode.id, waterOnly, penalized)
    : primaryIds;

  const toWaypoints = (ids: string[]) => {
    const pts: Array<{ x: number; z: number; label?: string }> = [{ x: fromX, z: fromZ, label: 'Start' }];
    for (const id of ids) {
      const node = NODE_MAP.get(id);
      if (node) pts.push({ x: node.x, z: node.z, label: node.label });
    }
    pts.push({ x: destX, z: destZ, label: destName });
    return pts;
  };

  const waypoints = toWaypoints(primaryIds);
  const altWaypoints = toWaypoints(altIds);
  const activePts = useAlternative ? altWaypoints : waypoints;

  let distanceMeters = 0;
  for (let i = 1; i < activePts.length; i++) {
    distanceMeters += Math.hypot(activePts[i].x - activePts[i - 1].x, activePts[i].z - activePts[i - 1].z);
  }
  distanceMeters = Math.round(distanceMeters);

  // Average speed m/s by mode
  const speedMs = mode === 'car' ? 22 : mode === 'bike' ? 20 : mode === 'boat' ? 14 : 4.2;
  const etaSeconds = Math.max(1, Math.round(distanceMeters / speedMs));

  const nextWp = activePts[1] ?? activePts[0];
  const nextTurnHint =
    distanceMeters < 18
      ? `Arriving at ${destName}`
      : nextWp.label
      ? `Head toward ${nextWp.label} (${Math.round(Math.hypot(nextWp.x - fromX, nextWp.z - fromZ))}m)`
      : `Continue ${distanceMeters}m to ${destName}`;

  return {
    destinationId: destId,
    destinationName: destName,
    destX,
    destZ,
    mode,
    useAlternative,
    waypoints,
    altWaypoints,
    distanceMeters,
    etaSeconds,
    nextTurnHint,
  };
}
