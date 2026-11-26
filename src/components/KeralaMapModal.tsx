import React, { useMemo, useState } from 'react';
import {
  Anchor,
  Bike,
  Bus,
  Car,
  Footprints,
  Home,
  MapPin,
  Navigation,
  Plane,
  Route,
  Search,
  Train,
  Wrench,
  X,
} from 'lucide-react';
import { KERALA_DISTRICTS, PROPERTY_CATALOG, WORLD_LOCATIONS } from '../data/keralaWorldData';
import { useGameStore } from '../store/gameStore';
import { GpsTravelMode } from '../types/game';

export const KeralaMapModal: React.FC = () => {
  const {
    activeModal,
    currentDistrictId,
    playerPos,
    gpsRoute,
    ownedPropertyIds,
    ownedVehicles,
    setActiveModal,
    fastTravelToDistrict,
    teleportPlayerTo,
    setGpsDestination,
    setGpsTravelMode,
    toggleGpsAlternative,
    clearGpsRoute,
  } = useGameStore();

  const [selectedDistrictId, setSelectedDistrictId] = useState(currentDistrictId || 'ernakulam');
  const [tab, setTab] = useState<'gps' | 'state'>('gps');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return WORLD_LOCATIONS;
    return WORLD_LOCATIONS.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.malayalamName.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q) ||
        l.districtId.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (activeModal !== 'map') return null;

  const selectedDistrict =
    KERALA_DISTRICTS.find((d) => d.id === selectedDistrictId) ?? KERALA_DISTRICTS[7];

  // World coord mapper for interactive 2D Kerala GPS SVG (-350..400, -380..400) -> (0..100, 0..100)
  const toSvgX = (wx: number) => ((wx + 360) / 780) * 100;
  const toSvgY = (wz: number) => ((wz + 385) / 800) * 100;

  const formatEta = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/85 p-4">
      <div className="w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-white/15 rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-white/10 bg-slate-950">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" />
              Kerala Interactive GPS & 14-District Atlas · കേരള ഭൂപടം
            </h2>
            <p className="text-xs text-slate-400">
              Search destinations · Shortest & Alternative routes · Separate icons for My House, Garage, Cars & Bikes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setTab('gps')}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                  tab === 'gps' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-300'
                }`}
              >
                Live GPS Map & Search
              </button>
              <button
                type="button"
                onClick={() => setTab('state')}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                  tab === 'state' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300'
                }`}
              >
                14 Districts & Transit
              </button>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal('none')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {tab === 'gps' ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left: Interactive 2D GPS Vector Map */}
            <div className="lg:col-span-7 relative bg-slate-950 p-3 flex flex-col justify-between border-r border-white/10 min-h-[380px]">
              {/* Active GPS Route Control Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 bg-slate-900/90 border border-white/10 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1">
                  {(
                    [
                      ['car', 'Car', Car],
                      ['bike', 'Bike', Bike],
                      ['walk', 'Walk', Footprints],
                      ['boat', 'Boat', Anchor],
                    ] as Array<[GpsTravelMode, string, React.ComponentType<{ className?: string }>]>
                  ).map(([m, label, Icon]) => {
                    const active = (gpsRoute?.mode ?? 'car') === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setGpsTravelMode(m)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                          active ? 'bg-cyan-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                {gpsRoute ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-hud text-cyan-300 font-bold">
                      {gpsRoute.distanceMeters}m · ETA {formatEta(gpsRoute.etaSeconds)}
                    </span>
                    <button
                      type="button"
                      onClick={toggleGpsAlternative}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 cursor-pointer"
                    >
                      <Route className="w-3 h-3" />
                      <span>{gpsRoute.useAlternative ? 'Alt Route' : 'Shortest'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={clearGpsRoute}
                      className="px-2 py-1 rounded bg-red-900/70 hover:bg-red-800 text-red-100 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Select any landmark right to start GPS</span>
                )}
              </div>

              <div className="relative flex-1 bg-slate-900 rounded-lg border border-white/10 overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-full h-full max-h-[460px]">
                  {/* Landmass */}
                  <rect x="0" y="0" width="100" height="100" fill="#132a1c" />
                  {/* Arabian Sea */}
                  <rect x="0" y="0" width={toSvgX(-190)} height="100" fill="#082f49" />
                  {/* Vembanad Backwaters */}
                  <rect
                    x={toSvgX(-360)}
                    y={toSvgY(168)}
                    width={toSvgX(-48) - toSvgX(-360)}
                    height={toSvgY(425) - toSvgY(168)}
                    fill="#082f49"
                  />
                  {/* Eastern Canal */}
                  <rect
                    x={toSvgX(-48)}
                    y={toSvgY(174)}
                    width={toSvgX(410) - toSvgX(-48)}
                    height={toSvgY(210) - toSvgY(174)}
                    fill="#082f49"
                  />
                  {/* Kuttanad Islands */}
                  <rect
                    x={toSvgX(-312)}
                    y={toSvgY(222)}
                    width={toSvgX(-198) - toSvgX(-312)}
                    height={toSvgY(318) - toSvgY(222)}
                    fill="#365314"
                  />

                  {/* Major Roads */}
                  <g stroke="#475569" strokeWidth="0.9">
                    <line x1={toSvgX(0)} y1={toSvgY(-290)} x2={toSvgX(0)} y2={toSvgY(365)} />
                    <line x1={toSvgX(-120)} y1={toSvgY(-180)} x2={toSvgX(-120)} y2={toSvgY(360)} />
                    <line x1={toSvgX(90)} y1={toSvgY(-180)} x2={toSvgX(90)} y2={toSvgY(285)} />
                    <line x1={toSvgX(-180)} y1={toSvgY(0)} x2={toSvgX(180)} y2={toSvgY(0)} />
                    <line x1={toSvgX(-180)} y1={toSvgY(-96)} x2={toSvgX(180)} y2={toSvgY(-96)} />
                    <line x1={toSvgX(-180)} y1={toSvgY(88)} x2={toSvgX(180)} y2={toSvgY(88)} />
                    <line x1={toSvgX(-130)} y1={toSvgY(-210)} x2={toSvgX(315)} y2={toSvgY(-210)} />
                    <line x1={toSvgX(-125)} y1={toSvgY(-345)} x2={toSvgX(-125)} y2={toSvgY(-180)} />
                    <line x1={toSvgX(315)} y1={toSvgY(-340)} x2={toSvgX(315)} y2={toSvgY(-190)} />
                    <line x1={toSvgX(85)} y1={toSvgY(-330)} x2={toSvgX(315)} y2={toSvgY(-330)} />
                    <line x1={toSvgX(-255)} y1={toSvgY(270)} x2={toSvgX(-112)} y2={toSvgY(270)} />
                    <line x1={toSvgX(0)} y1={toSvgY(280)} x2={toSvgX(175)} y2={toSvgY(280)} />
                    <line x1={toSvgX(-135)} y1={toSvgY(360)} x2={toSvgX(10)} y2={toSvgY(360)} />
                  </g>

                  {/* Alternative Route Preview */}
                  {gpsRoute && gpsRoute.altWaypoints.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="0.7"
                      strokeDasharray="1.5,1"
                      opacity={gpsRoute.useAlternative ? 0.95 : 0.4}
                      points={gpsRoute.altWaypoints.map((w) => `${toSvgX(w.x)},${toSvgY(w.z)}`).join(' ')}
                    />
                  )}

                  {/* Primary Shortest Route */}
                  {gpsRoute && gpsRoute.waypoints.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={gpsRoute.useAlternative ? '0.6' : '1.15'}
                      opacity={gpsRoute.useAlternative ? 0.45 : 1}
                      points={gpsRoute.waypoints.map((w) => `${toSvgX(w.x)},${toSvgY(w.z)}`).join(' ')}
                    />
                  )}

                  {/* Landmarks & Garage */}
                  {WORLD_LOCATIONS.map((loc) => (
                    <g
                      key={loc.id}
                      onClick={() => setGpsDestination(loc.id, loc.name, loc.x, loc.z)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={toSvgX(loc.x)}
                        cy={toSvgY(loc.z)}
                        r={loc.type === 'garage' ? 1.45 : 0.95}
                        fill={
                          loc.type === 'garage'
                            ? '#a855f7'
                            : loc.type === 'airport'
                            ? '#38bdf8'
                            : loc.type === 'fuel'
                            ? '#fb923c'
                            : '#94a3b8'
                        }
                      />
                    </g>
                  ))}

                  {/* Owned Houses */}
                  {ownedPropertyIds.map((pid) => {
                    const prop = PROPERTY_CATALOG.find((p) => p.id === pid);
                    if (!prop) return null;
                    return (
                      <g key={pid}>
                        <rect
                          x={toSvgX(prop.spawnX) - 1.3}
                          y={toSvgY(prop.spawnZ) - 1.3}
                          width="2.6"
                          height="2.6"
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="0.35"
                        />
                      </g>
                    );
                  })}

                  {/* Owned Cars & Bikes */}
                  {ownedVehicles.map((ov) => (
                    <circle
                      key={ov.instanceId}
                      cx={toSvgX(ov.parkedX)}
                      cy={toSvgY(ov.parkedZ)}
                      r="1.3"
                      fill={ov.category === 'motorcycle' ? '#a3e635' : '#22d3ee'}
                      stroke="#0f172a"
                      strokeWidth="0.35"
                    />
                  ))}

                  {/* Current Player Marker */}
                  <circle
                    cx={toSvgX(playerPos.x)}
                    cy={toSvgY(playerPos.z)}
                    r="1.8"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="0.45"
                  />
                </svg>
              </div>

              {/* Separate Legend for House, Garage, Cars, Bikes, Player */}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded border border-white/10">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Home className="w-3.5 h-3.5" /> My House
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  <Wrench className="w-3.5 h-3.5" /> My Garage
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <Car className="w-3.5 h-3.5" /> My Cars
                </span>
                <span className="flex items-center gap-1 text-lime-400">
                  <Bike className="w-3.5 h-3.5" /> My Bikes
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  ● Current Player
                </span>
              </div>
            </div>

            {/* Right: Search & Landmark Directory */}
            <div className="lg:col-span-5 flex flex-col overflow-hidden p-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Kerala towns, airports, malls, fuel, houses..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {gpsRoute && (
                <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-xs">
                  <div className="font-semibold text-cyan-300">Active Turn-by-Turn GPS</div>
                  <div className="text-white font-bold mt-0.5">{gpsRoute.destinationName}</div>
                  <div className="text-slate-200 mt-0.5">{gpsRoute.nextTurnHint}</div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {filteredLocations.map((loc) => {
                  const dist = Math.round(Math.hypot(playerPos.x - loc.x, playerPos.z - loc.z));
                  const isRouted = gpsRoute?.destinationId === loc.id;
                  return (
                    <div
                      key={loc.id}
                      className={`p-3 rounded-lg border flex flex-col gap-2 ${
                        isRouted ? 'bg-cyan-950/35 border-cyan-400/60' : 'bg-slate-950 border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-amber-400 uppercase font-semibold">
                            {loc.districtId} · {loc.type}
                          </div>
                          <div className="font-semibold text-sm text-white">{loc.name}</div>
                          <div className="font-malayalam text-xs text-slate-400">{loc.malayalamName}</div>
                        </div>
                        <span className="font-hud text-xs text-slate-300 shrink-0">{dist}m</span>
                      </div>
                      <p className="text-xs text-slate-300">{loc.description}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setGpsDestination(loc.id, loc.name, loc.x, loc.z)}
                          className="flex-1 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Set GPS Route</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => teleportPlayerTo(loc.x, loc.z + 9)}
                          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-xs font-semibold text-white cursor-pointer flex items-center gap-1"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Go</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            <div className="md:col-span-7 relative bg-slate-950 p-4 flex items-center justify-center min-h-[360px] overflow-hidden border-r border-white/10">
              <svg viewBox="0 0 100 100" className="w-full h-full max-h-[520px]">
                <rect x="0" y="0" width="100" height="100" fill="#082f49" />
                <path
                  d="M 20,4 L 32,4 L 46,16 L 56,22 L 50,32 L 66,40 L 62,54 L 76,62 L 68,76 L 72,88 L 65,97 L 54,93 L 45,76 L 44,62 L 42,46 L 34,30 L 26,16 Z"
                  fill="#14532d"
                  stroke="#22c55e"
                  strokeWidth="0.6"
                />
                <path
                  d="M 24,7 L 33,16 L 38,28 L 46,36 L 50,50 L 52,60 L 49,75 L 57,85 L 64,94"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="0.7"
                  strokeDasharray="1.5,1"
                />
                <path
                  d="M 25,8 L 34,17 L 39,29 L 61,42 L 51,50 L 53,60 L 59,70 L 57,85 L 64,94"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="0.5"
                />
                {KERALA_DISTRICTS.map((d) => {
                  const isSel = d.id === selectedDistrict.id;
                  const isCur = d.id === currentDistrictId;
                  return (
                    <g key={d.id} onClick={() => setSelectedDistrictId(d.id)} className="cursor-pointer">
                      <circle
                        cx={d.mapX}
                        cy={d.mapY}
                        r={isSel ? 2.6 : 1.7}
                        fill={isCur ? '#10b981' : isSel ? '#f59e0b' : '#e2e8f0'}
                        stroke="#0f172a"
                        strokeWidth="0.5"
                      />
                      <text
                        x={d.mapX + 2.8}
                        y={d.mapY + 0.8}
                        fontSize="2.7"
                        fill={isSel ? '#fbbf24' : '#cbd5e1'}
                        fontWeight={isSel ? '700' : '500'}
                      >
                        {d.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="md:col-span-5 p-5 overflow-y-auto flex flex-col justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-amber-400">
                  {selectedDistrict.region} Kerala · District #{KERALA_DISTRICTS.findIndex((x) => x.id === selectedDistrict.id) + 1} of 14
                </div>
                <h3 className="text-2xl font-bold text-white mt-1">{selectedDistrict.name}</h3>
                <div className="font-malayalam text-base text-slate-300">{selectedDistrict.malayalamName}</div>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">{selectedDistrict.description}</p>
                <div className="mt-4">
                  <div className="text-xs font-semibold text-slate-400 mb-2">Recognizable Landmarks</div>
                  <div className="text-xs text-slate-200">{selectedDistrict.highlights.join(' · ')}</div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2.5">
                {selectedDistrict.spawnOffset && (
                  <button
                    type="button"
                    onClick={() => {
                      setGpsDestination(
                        selectedDistrict.id,
                        selectedDistrict.name,
                        selectedDistrict.spawnOffset!.x,
                        selectedDistrict.spawnOffset!.z
                      );
                      setTab('gps');
                    }}
                    className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Plot GPS Route to {selectedDistrict.name}</span>
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fastTravelToDistrict(selectedDistrict.id, 'bus', 250)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-red-900/60 hover:bg-red-800/80 border border-red-500/40 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Bus className="w-4 h-4 text-amber-300" />
                    <span>KSRTC Bus · ₹250</span>
                  </button>
                  {selectedDistrict.hasRailway && (
                    <button
                      type="button"
                      onClick={() => fastTravelToDistrict(selectedDistrict.id, 'train', 450)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-sky-900/60 hover:bg-sky-800/80 border border-sky-500/40 text-xs font-semibold text-white cursor-pointer"
                    >
                      <Train className="w-4 h-4 text-sky-300" />
                      <span>Express Train · ₹450</span>
                    </button>
                  )}
                  {selectedDistrict.hasAirport && (
                    <button
                      type="button"
                      onClick={() => fastTravelToDistrict(selectedDistrict.id, 'flight', 2800)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-500/40 text-xs font-semibold text-white cursor-pointer"
                    >
                      <Plane className="w-4 h-4 text-indigo-300" />
                      <span>Air Shuttle · ₹2,800</span>
                    </button>
                  )}
                  {selectedDistrict.hasBackwaters && (
                    <button
                      type="button"
                      onClick={() => fastTravelToDistrict(selectedDistrict.id, 'boat', 350)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-teal-900/60 hover:bg-teal-800/80 border border-teal-500/40 text-xs font-semibold text-white cursor-pointer"
                    >
                      <Anchor className="w-4 h-4 text-teal-300" />
                      <span>Water Ferry · ₹350</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
