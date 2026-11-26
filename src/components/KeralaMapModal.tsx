import React, { useState } from 'react';
import { Anchor, Bus, MapPin, Plane, Train, X } from 'lucide-react';
import { KERALA_DISTRICTS, WORLD_LOCATIONS } from '../data/keralaWorldData';
import { useGameStore } from '../store/gameStore';

export const KeralaMapModal: React.FC = () => {
  const {
    activeModal,
    currentDistrictId,
    playerPos,
    setActiveModal,
    fastTravelToDistrict,
    teleportPlayerTo,
  } = useGameStore();

  const [selectedDistrictId, setSelectedDistrictId] = useState(currentDistrictId || 'ernakulam');
  const [tab, setTab] = useState<'state' | 'local'>('state');

  if (activeModal !== 'map') return null;

  const selectedDistrict =
    KERALA_DISTRICTS.find((d) => d.id === selectedDistrictId) ?? KERALA_DISTRICTS[7];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/85 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-white/15 rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-950">
          <div>
            <h2 className="text-lg font-bold text-white">
              Kerala Open World Atlas · കേരള ഭൂപടം
            </h2>
            <p className="text-xs text-slate-400">
              All 14 Districts from Kasaragod to Thiruvananthapuram · Inter-district Rail, Air, Bus & Water Metro
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setTab('state')}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                  tab === 'state' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300'
                }`}
              >
                14 Kerala Districts
              </button>
              <button
                type="button"
                onClick={() => setTab('local')}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                  tab === 'local' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300'
                }`}
              >
                Kerala Landmarks GPS
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
        {tab === 'state' ? (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Stylized Kerala State Map (Kasaragod -> Thiruvananthapuram) */}
            <div className="md:col-span-7 relative bg-slate-950 p-4 flex items-center justify-center min-h-[360px] overflow-hidden border-r border-white/10">
              <svg viewBox="0 0 100 100" className="w-full h-full max-h-[520px]">
                {/* Arabian Sea */}
                <rect x="0" y="0" width="100" height="100" fill="#082f49" />
                {/* Kerala Landmass Silhouette */}
                <path
                  d="M 20,4 L 32,4 L 46,16 L 56,22 L 50,32 L 66,40 L 62,54 L 76,62 L 68,76 L 72,88 L 65,97 L 54,93 L 45,76 L 44,62 L 42,46 L 34,30 L 26,16 Z"
                  fill="#14532d"
                  stroke="#22c55e"
                  strokeWidth="0.6"
                />
                {/* NH-66 Coastal Highway Spine */}
                <path
                  d="M 24,7 L 33,16 L 38,28 L 46,36 L 50,50 L 52,60 L 49,75 L 57,85 L 64,94"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="0.7"
                  strokeDasharray="1.5,1"
                />
                {/* Railway Spine */}
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
                    <g
                      key={d.id}
                      onClick={() => setSelectedDistrictId(d.id)}
                      className="cursor-pointer"
                    >
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
              <div className="absolute bottom-3 left-4 text-[11px] text-slate-300 flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded border border-white/10">
                <span className="text-amber-400">━ NH-66 Highway</span>
                <span className="text-sky-400">━ Kerala Rail</span>
                <span className="text-emerald-400">● Current Location</span>
              </div>
            </div>

            {/* District Details & Travel Booking */}
            <div className="md:col-span-5 p-5 overflow-y-auto flex flex-col justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-amber-400">
                  {selectedDistrict.region} Kerala · District #{KERALA_DISTRICTS.findIndex((x) => x.id === selectedDistrict.id) + 1} of 14
                </div>
                <h3 className="text-2xl font-bold text-white mt-1">{selectedDistrict.name}</h3>
                <div className="font-malayalam text-base text-slate-300">{selectedDistrict.malayalamName}</div>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  {selectedDistrict.description}
                </p>

                <div className="mt-4">
                  <div className="text-xs font-semibold text-slate-400 mb-2">Recognizable Towns & Landmarks</div>
                  <div className="flex flex-wrap gap-1.5 text-xs text-slate-200">
                    {selectedDistrict.highlights.map((h, idx) => (
                      <span key={h}>
                        {h}
                        {idx < selectedDistrict.highlights.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2.5">
                <div className="text-xs font-semibold text-slate-300">
                  Travel to {selectedDistrict.name}
                </div>
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
        ) : (
          <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {WORLD_LOCATIONS.map((loc) => {
              const dist = Math.round(Math.hypot(playerPos.x - loc.x, playerPos.z - loc.z));
              return (
                <div
                  key={loc.id}
                  className="p-3.5 rounded-lg bg-slate-950 border border-white/10 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-amber-400">
                      <span className="capitalize">{loc.type}</span>
                      <span className="font-hud">{dist}m away</span>
                    </div>
                    <div className="font-semibold text-sm text-white mt-0.5">{loc.name}</div>
                    <div className="font-malayalam text-xs text-slate-400">{loc.malayalamName}</div>
                    <p className="text-xs text-slate-300 mt-1.5">{loc.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => teleportPlayerTo(loc.x, loc.z + 9)}
                    className="mt-1 w-full py-1.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />
                    Fast Travel Here
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
