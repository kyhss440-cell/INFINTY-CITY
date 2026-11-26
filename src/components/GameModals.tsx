import React, { useState } from 'react';
import {
  Anchor,
  Backpack,
  Banknote,
  Building2,
  Car,
  Check,
  Coffee,
  Flag,
  Fuel,
  HeartPulse,
  Moon,
  Paintbrush,
  Plane,
  Save,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Ticket,
  Train,
  Trash2,
  User,
  Wrench,
  X,
} from 'lucide-react';
import {
  HOUSE_UPGRADES,
  MISSION_CATALOG,
  POINTS_TO_RUPEES,
  PROPERTY_CATALOG,
  STORE_ITEMS,
  VEHICLE_CATALOG,
} from '../data/keralaWorldData';
import { useGameStore } from '../store/gameStore';
import {
  DensityPreset,
  GraphicsPreset,
  HairStyle,
  OutfitStyle,
  TimePeriod,
  WeatherType,
} from '../types/game';

const PAINT_SWATCHES = ['#e2e8f0', '#0f172a', '#b91c1c', '#0284c7', '#eab308', '#15803d', '#ea580c', '#6d28d9'];
const SKIN_SWATCHES = ['#e0b08d', '#d49c78', '#c68b65', '#b87d56', '#a46945', '#8f5838', '#78472b'];

export const GameModals: React.FC = () => {
  const store = useGameStore();
  const {
    activeModal,
    activeShopContext,
    setActiveModal,
    activeDialogue,
    closeDialogue,
    cash,
    bankBalance,
    points,
    fines,
    ownedVehicles,
    ownedPropertyIds,
    activeHomeId,
    houseUpgrades,
    inventory,
    discoveredLocationIds,
    transitTickets,
    completedMissionIds,
    activeMission,
    playerAppearance,
    arrestBailAmount,
  } = store;

  const [selectedColor, setSelectedColor] = useState('#0284c7');

  if (activeModal === 'none' || activeModal === 'map') return null;

  const activeHomeUpgrades = houseUpgrades[activeHomeId] ?? [];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/85 p-4">
      <div className="w-full max-w-4xl max-h-[88vh] bg-slate-900 border border-white/15 rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* NPC DIALOGUE & KERALA SERVICES (Airport Gates, Rail Tickets, Boat Rentals, Fuel, Bank, Mall) */}
        {activeModal === 'dialogue' && activeDialogue && (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-950">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {activeDialogue.name} · <span className="font-malayalam text-amber-400">{activeDialogue.malayalamName}</span>
                </h2>
                <p className="text-xs text-slate-400">{activeDialogue.role}</p>
              </div>
              <button
                type="button"
                onClick={closeDialogue}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="p-4 rounded-lg bg-slate-950 border border-white/10 space-y-2">
                <p className="text-sm text-slate-100 leading-relaxed">“{activeDialogue.greetingEn}”</p>
                <p className="font-malayalam text-sm text-amber-300/95 leading-relaxed">“{activeDialogue.greetingMl}”</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeDialogue.serviceType === 'teaShop' && (
                  <>
                    <button
                      type="button"
                      onClick={() => store.healPlayer(25, 40)}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/30 text-left cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-sm text-white">Samovar Chai & Pazham Pori</div>
                        <div className="text-xs text-slate-300">+25 Health · Instant Energy</div>
                      </div>
                      <span className="font-hud text-sm font-bold text-amber-400">₹40</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => store.healPlayer(60, 180)}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/30 text-left cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-sm text-white">Kerala Malabar Meals</div>
                        <div className="text-xs text-slate-300">+60 Health · Full Stamina</div>
                      </div>
                      <span className="font-hud text-sm font-bold text-amber-400">₹180</span>
                    </button>
                  </>
                )}

                {activeDialogue.serviceType === 'hospital' && (
                  <>
                    <button
                      type="button"
                      onClick={() => store.healPlayer(100, 500)}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <HeartPulse className="w-5 h-5 text-emerald-400" />
                        <div>
                          <div className="font-semibold text-sm text-white">Full Medical Checkup</div>
                          <div className="text-xs text-slate-300">Restore 100% Health</div>
                        </div>
                      </div>
                      <span className="font-hud text-sm font-bold text-emerald-400">₹500</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => store.buyStoreItem('item_medkit')}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-white/15 text-left cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-sm text-white">Buy Portable First-Aid Kit</div>
                        <div className="text-xs text-slate-300">Store in Inventory Bag</div>
                      </div>
                      <span className="font-hud text-sm font-bold text-emerald-400">₹450</span>
                    </button>
                  </>
                )}

                {activeDialogue.serviceType === 'police' && (
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">
                        Traffic e-Challan Records ({fines.filter((f) => !f.paid).length} unpaid)
                      </span>
                      <button
                        type="button"
                        onClick={() => store.payAllFines()}
                        className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white cursor-pointer"
                      >
                        Pay All Fines & Clear Wanted
                      </button>
                    </div>
                    {fines.length === 0 ? (
                      <p className="text-xs text-slate-400">Clean driving record! No pending traffic violations.</p>
                    ) : (
                      fines.slice(0, 4).map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-white/10 text-xs"
                        >
                          <div>
                            <span className="text-white font-medium">{f.reason}</span>
                            <span className="text-slate-400 ml-2 font-malayalam">({f.malayalamReason})</span>
                          </div>
                          {f.paid ? (
                            <span className="text-emerald-400 font-semibold">Paid</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => store.payFine(f.id)}
                              className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-semibold cursor-pointer"
                            >
                              Pay ₹{f.amount}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeDialogue.serviceType === 'railway' && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        store.buyTransitTicket('train', 'Ernakulam Jn', 'Kerala Express All-Stops', 118, -16, 350)
                      }
                      className="flex items-center justify-between p-3.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/40 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Train className="w-5 h-5 text-sky-300" />
                        <div>
                          <div className="font-semibold text-sm text-white">Buy Kerala Express Ticket</div>
                          <div className="text-xs text-slate-300">Valid for boarding Train [E] without TTE fine</div>
                        </div>
                      </div>
                      <span className="font-hud text-sm font-bold text-sky-300">₹350</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal('map')}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-left cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-sm text-white">Inter-District Rail Atlas</div>
                        <div className="text-xs text-slate-300">Travel across all Kerala Rail districts</div>
                      </div>
                      <span className="text-xs font-bold text-amber-400">Open GPS</span>
                    </button>
                  </>
                )}

                {activeDialogue.serviceType === 'airport' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const px = store.playerPos.x;
                        const pz = store.playerPos.z;
                        // Send player right next to the nearest airport's parked airplane on the tarmac
                        if (px < 0) {
                          store.teleportPlayerTo(-155, -270);
                        } else if (pz > 100) {
                          store.teleportPlayerTo(188, 295);
                        } else {
                          store.teleportPlayerTo(188, -138);
                        }
                        store.pushNotification(
                          'Runway Tarmac Access',
                          'Walk beside the parked airplane and press E to enter and fly it yourself!',
                          'success'
                        );
                      }}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/50 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Plane className="w-5 h-5 text-emerald-300" />
                        <div>
                          <div className="font-semibold text-sm text-white">Walk to Runway Airplane (Pilot Yourself!)</div>
                          <div className="text-xs text-slate-300">Step onto the tarmac and press E to enter &amp; fly</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-300">Go Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        store.buyTransitTicket('flight', 'Air Terminal', 'All-Kerala Air Pass', 168, -135, 2200)
                      }
                      className="flex items-center justify-between p-3.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-500/40 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Ticket className="w-5 h-5 text-indigo-300" />
                        <div>
                          <div className="font-semibold text-sm text-white">Purchase Boarding Pass</div>
                          <div className="text-xs text-slate-300">Required for Gate Security Check</div>
                        </div>
                      </div>
                      <span className="font-hud text-sm font-bold text-indigo-300">₹2,200</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => store.boardFlightWithPass('Trivandrum International', 165, 290)}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-sky-900/60 hover:bg-sky-800/70 border border-sky-400/40 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Plane className="w-5 h-5 text-sky-300" />
                        <div>
                          <div className="font-semibold text-sm text-white">Fly to Trivandrum Airport</div>
                          <div className="text-xs text-slate-300">Requires Boarding Pass (Fine if missing!)</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">Board</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => store.boardFlightWithPass('Kannur International', -125, -265)}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-sky-900/60 hover:bg-sky-800/70 border border-sky-400/40 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Plane className="w-5 h-5 text-sky-300" />
                        <div>
                          <div className="font-semibold text-sm text-white">Fly to Kannur Airport</div>
                          <div className="text-xs text-slate-300">Gate check boarding pass</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">Board</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => store.boardFlightWithPass('Cochin International', 168, -135)}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-sky-900/60 hover:bg-sky-800/70 border border-sky-400/40 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Plane className="w-5 h-5 text-sky-300" />
                        <div>
                          <div className="font-semibold text-sm text-white">Fly to Cochin Airport</div>
                          <div className="text-xs text-slate-300">Gate check boarding pass</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">Board</span>
                    </button>
                  </>
                )}

                {activeDialogue.serviceType === 'boat' && (
                  <>
                    <button
                      type="button"
                      onClick={() => store.rentBoat(350)}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-teal-950/60 hover:bg-teal-900/70 border border-teal-500/40 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Anchor className="w-5 h-5 text-teal-300" />
                        <div>
                          <div className="font-semibold text-sm text-white">Rent Speedboat / Fishing Boat</div>
                          <div className="text-xs text-slate-300">5-minute Water Jetty Boating Pass</div>
                        </div>
                      </div>
                      <span className="font-hud text-sm font-bold text-teal-300">₹350</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => store.fastTravelToDistrict('alappuzha', 'boat', 250)}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/40 text-left cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-sm text-white">Water Ferry to Alappuzha</div>
                        <div className="text-xs text-slate-300">Travel across Vembanad Backwaters</div>
                      </div>
                      <span className="font-hud text-sm font-bold text-sky-300">₹250</span>
                    </button>
                  </>
                )}

                {activeDialogue.serviceType === 'bus' && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('map')}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-red-950/60 hover:bg-red-900/70 border border-red-500/35 text-left cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white">KSRTC Inter-District Counter</div>
                      <div className="text-xs text-slate-300">Book buses across all 14 Kerala districts</div>
                    </div>
                    <span className="text-xs font-bold text-amber-300">Open Atlas</span>
                  </button>
                )}

                {(activeDialogue.serviceType === 'bank' ||
                  activeDialogue.serviceType === 'fuel' ||
                  activeDialogue.serviceType === 'mall') && (
                  <button
                    type="button"
                    onClick={() =>
                      store.openShopModal(
                        activeDialogue.name,
                        activeDialogue.malayalamName,
                        activeDialogue.serviceType === 'bank'
                          ? 'bank'
                          : activeDialogue.serviceType === 'fuel'
                          ? 'fuel'
                          : 'mall'
                      )
                    }
                    className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-left cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white">
                        {activeDialogue.serviceType === 'bank'
                          ? 'Open Bank & Points Exchange'
                          : activeDialogue.serviceType === 'fuel'
                          ? 'Open Fuel Pump & Pit Shop'
                          : 'Browse Mall Store Catalog'}
                      </div>
                      <div className="text-xs text-slate-300">Manage items, fuel, or redeem Points</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-300">Open</span>
                  </button>
                )}

                {activeDialogue.serviceType === 'showroom' && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('garage')}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/35 text-left cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white">Browse Malabar Showroom & Garage</div>
                      <div className="text-xs text-slate-300">Buy/sell cars, bikes, boats & refuel</div>
                    </div>
                    <span className="text-xs font-bold text-amber-400">Open</span>
                  </button>
                )}

                {activeDialogue.serviceType === 'property' && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('properties')}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/35 text-left cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white">Inspect Kerala Real Estate</div>
                      <div className="text-xs text-slate-300">Buy Houses, Villas & Luxury Mansions</div>
                    </div>
                    <span className="text-xs font-bold text-amber-400">View Estates</span>
                  </button>
                )}

                {activeDialogue.nearbyMissionId && (
                  <button
                    type="button"
                    onClick={() => store.startMission(activeDialogue.nearbyMissionId!)}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-900/50 hover:bg-emerald-800/70 border border-emerald-400/40 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Flag className="w-4 h-4 text-emerald-300" />
                      <div>
                        <div className="font-semibold text-sm text-white">Accept Local Mission</div>
                        <div className="text-xs text-emerald-200">Earn cash & Game Points</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-300">Start</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    store.pushNotification(
                      `${activeDialogue.name}`,
                      'Tip: Open GPS Map [M] to search any Kerala landmark across all 14 districts!',
                      'info'
                    );
                    closeDialogue();
                  }}
                  className="flex items-center gap-2 p-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-left text-xs font-medium text-slate-200 cursor-pointer"
                >
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>Ask for Local Directions (വഴി ചോദിക്കുക)</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* SHOPPING MALL, STORES, BANK & FUEL STATION MODAL */}
        {activeModal === 'shop' && activeShopContext && (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-950">
              <div className="flex items-center gap-2.5">
                {activeShopContext.shopType === 'bank' ? (
                  <Banknote className="w-5 h-5 text-emerald-400" />
                ) : activeShopContext.shopType === 'fuel' ? (
                  <Fuel className="w-5 h-5 text-orange-400" />
                ) : (
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <h2 className="text-lg font-bold text-white">{activeShopContext.title}</h2>
                  <p className="text-xs text-slate-400">
                    Cash: ₹{cash.toLocaleString('en-IN')} · Bank: ₹{bankBalance.toLocaleString('en-IN')} · {points} Points
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal('none')} className="p-2 rounded-lg bg-slate-800 text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {activeShopContext.shopType === 'bank' && (
                <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/35 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Kerala Federal Bank · Points Conversion (1 Point = ₹{POINTS_TO_RUPEES.toLocaleString('en-IN')})
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Your Balance: <span className="font-hud font-bold text-amber-300">{points} Points</span> (= ₹
                        {(points * POINTS_TO_RUPEES).toLocaleString('en-IN')})
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => store.redeemPoints(1)}
                      className="py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      Redeem 1 Pt (+₹10k)
                    </button>
                    <button
                      type="button"
                      onClick={() => store.redeemPoints(5)}
                      className="py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      Redeem 5 Pts (+₹50k)
                    </button>
                    <button
                      type="button"
                      onClick={() => store.depositToBank(10000)}
                      className="py-2 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Deposit ₹10,000
                    </button>
                    <button
                      type="button"
                      onClick={() => store.withdrawFromBank(10000)}
                      className="py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Withdraw ₹10,000
                    </button>
                  </div>
                </div>
              )}

              {activeShopContext.shopType === 'fuel' && (
                <div className="p-4 rounded-lg bg-orange-950/40 border border-orange-500/35 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">Highway Fuel Pump Service</h3>
                    <p className="text-xs text-slate-300">Instantly top up tank to 100% fuel</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => store.refuelActiveVehicleAtPump(450)}
                    className="px-4 py-2 rounded bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    Fill Full Tank · ₹450
                  </button>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Available Goods & Gear</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STORE_ITEMS.filter(
                    (it) => activeShopContext.shopType === 'mall' || it.shopTypes.includes(activeShopContext.shopType) || activeShopContext.shopType === 'bank'
                  ).map((item) => (
                    <div key={item.id} className="p-3.5 rounded-lg bg-slate-950 border border-white/10 flex flex-col justify-between gap-2.5">
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-amber-400 uppercase font-semibold">{item.category}</span>
                          <span className="font-hud font-bold text-emerald-400">₹{item.price.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="font-semibold text-sm text-white mt-0.5">{item.name}</div>
                        <div className="font-malayalam text-xs text-slate-400">{item.malayalamName}</div>
                        <p className="text-xs text-slate-300 mt-1">{item.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => store.buyStoreItem(item.id)}
                        className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                      >
                        Buy & Add to Inventory
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* INVENTORY & WALLET MODAL */}
        {activeModal === 'inventory' && (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <Backpack className="w-5 h-5 text-purple-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Backpack Inventory & Kerala Wallet</h2>
                  <p className="text-xs text-slate-400">
                    Landmarks Discovered: {discoveredLocationIds.length} · Game Points: {points}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal('none')} className="p-2 rounded-lg bg-slate-800 text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Wallet & Points Redemption Card */}
              <div className="p-4 rounded-lg bg-slate-950 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-slate-400">Separate Points & Money Balance (1 Game Point = ₹10,000)</div>
                  <div className="flex items-center gap-4">
                    <span className="font-hud text-xl font-bold text-amber-400">{points} Points</span>
                    <span className="font-hud text-xl font-bold text-emerald-400">₹{cash.toLocaleString('en-IN')} Cash</span>
                    <span className="font-hud text-sm text-slate-300">Bank: ₹{bankBalance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => store.redeemPoints(1)}
                    className="px-3 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    Redeem 1 Pt (+₹10,000)
                  </button>
                  <button
                    type="button"
                    onClick={() => store.redeemPoints(5)}
                    className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Redeem 5 Pts (+₹50,000)
                  </button>
                </div>
              </div>

              {/* Purchased Items */}
              <div>
                <h3 className="text-sm font-semibold text-purple-300 mb-2.5">Owned Items ({inventory.length})</h3>
                {inventory.length === 0 ? (
                  <p className="text-xs text-slate-400">Your bag is empty. Visit Malabar Grand Mall, Chaya Kadai, or Fuel Stations to shop!</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {inventory.map((it) => (
                      <div key={it.itemId} className="p-3.5 rounded-lg bg-slate-950 border border-white/10 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-sm text-white">
                            {it.name} <span className="font-hud text-amber-400">×{it.quantity}</span>
                          </div>
                          <div className="text-xs text-slate-400 capitalize">{it.category}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => store.useInventoryItem(it.itemId)}
                          className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white cursor-pointer"
                        >
                          Use / Equip
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Transit Tickets */}
              <div>
                <h3 className="text-sm font-semibold text-sky-300 mb-2">Transit Tickets & Boarding Passes</h3>
                {transitTickets.filter((t) => !t.used).length === 0 ? (
                  <p className="text-xs text-slate-400">No active tickets. Purchase Rail or Airport passes at station/terminal counters.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {transitTickets
                      .filter((t) => !t.used)
                      .map((t) => (
                        <div key={t.id} className="p-3 rounded-lg bg-sky-950/40 border border-sky-500/35 text-xs">
                          <div className="font-bold text-sky-300 uppercase">{t.mode} PASS</div>
                          <div className="text-white mt-0.5">{t.fromLabel} → {t.toLabel}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* POLICE CUSTODY & BAIL MODAL */}
        {activeModal === 'arrest' && (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-red-500/30 bg-red-950/80">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Kerala Police Custody · Station Detention</h2>
                  <p className="text-xs text-red-200">Stopped by Kerala Highway Patrol</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-4 rounded-lg bg-slate-950 border border-red-500/30 space-y-2">
                <p className="text-sm text-slate-200">
                  Your vehicle was intercepted by Kerala Highway Police due to active charges and unpaid violations.
                </p>
                <div className="font-hud text-xl font-bold text-amber-400">
                  Bail & Fine Settlement: ₹{arrestBailAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => store.payBailAndRelease()}
                className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer"
              >
                Pay Bail & Release at Fort Kochi Police HQ
              </button>
            </div>
          </>
        )}

        {/* GARAGE & VEHICLE SHOWROOM (With Buy, Sell, Refuel & Repair!) */}
        {activeModal === 'garage' && (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <Car className="w-5 h-5 text-sky-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Malabar Showroom & Personal Garage</h2>
                  <p className="text-xs text-slate-400">
                    Buy, Sell, Customize, Refuel & Repair · Funds: ₹{(cash + bankBalance).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal('none')} className="p-2 rounded-lg bg-slate-800 text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-amber-400 mb-3">Your Owned Vehicles ({ownedVehicles.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ownedVehicles.map((ov) => (
                    <div key={ov.instanceId} className="p-4 rounded-lg bg-slate-950 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">{ov.modelName}</div>
                          <div className="text-xs text-slate-400">
                            {ov.brand} · <span className="font-hud text-amber-300">{ov.plateNumber}</span> · Engine Lv.{ov.engineLevel}
                          </div>
                        </div>
                        <span className="w-5 h-5 rounded-full border border-white/30" style={{ backgroundColor: ov.customColor }} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                        <div>Fuel: <span className="font-hud text-orange-400">{Math.round(ov.fuel)}%</span></div>
                        <div>Body: <span className="font-hud text-emerald-400">{Math.round(ov.health)}%</span></div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {PAINT_SWATCHES.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => setSelectedColor(hex)}
                            className={`w-5 h-5 rounded-full border cursor-pointer ${selectedColor === hex ? 'border-amber-400 scale-110' : 'border-white/20'}`}
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => store.spawnOwnedVehicle(ov.instanceId)}
                          className="py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white cursor-pointer"
                        >
                          Deliver Nearby
                        </button>
                        <button
                          type="button"
                          onClick={() => store.refuelAndRepairVehicle(ov.instanceId, 1200)}
                          className="py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-xs font-semibold text-white cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Fuel className="w-3.5 h-3.5" /> Refuel/Fix ₹1.2k
                        </button>
                        <button
                          type="button"
                          onClick={() => store.customizeOwnedVehicle(ov.instanceId, selectedColor, false)}
                          className="py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Paintbrush className="w-3.5 h-3.5" /> Repaint ₹5k
                        </button>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => store.customizeOwnedVehicle(ov.instanceId, ov.customColor, true)}
                            className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Wrench className="w-3 h-3" /> ₹25k
                          </button>
                          {ownedVehicles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => store.sellVehicle(ov.instanceId)}
                              title={`Sell for ₹${Math.round(ov.price * 0.65).toLocaleString('en-IN')}`}
                              className="px-2 py-1.5 rounded bg-red-900/80 hover:bg-red-800 text-xs text-red-100 cursor-pointer flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-sky-400 mb-3">Kerala Vehicle, Boat &amp; Aircraft Showroom</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {VEHICLE_CATALOG.filter((v) => v.price > 0).map((spec) => (
                    <div key={spec.id} className="p-3.5 rounded-lg bg-slate-950 border border-white/10 flex flex-col justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-400 uppercase">{spec.category}</div>
                        <div className="font-semibold text-white">{spec.modelName}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          Top Speed: <span className="font-hud text-slate-200">{spec.maxSpeedKmh} km/h</span> · {spec.seats} seats
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => store.buyVehicle(spec.id)}
                        className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                      >
                        Buy · ₹{spec.price.toLocaleString('en-IN')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* PROPERTIES, SLEEP CHECKPOINT & HOUSE CUSTOMIZATION */}
        {activeModal === 'properties' && (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Kerala Homes, Estates & Interior Upgrades</h2>
                  <p className="text-xs text-slate-400">
                    Buy homes across districts · Customize interiors · Funds: ₹{(cash + bankBalance).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal('none')} className="p-2 rounded-lg bg-slate-800 text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-6">
              {/* Active Home Checkpoint & Customization Upgrades */}
              <div className="p-4 rounded-lg bg-emerald-950/35 border border-emerald-500/35 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-emerald-400">Active Home Base & Save Checkpoint</div>
                    <div className="font-bold text-white">
                      {PROPERTY_CATALOG.find((p) => p.id === activeHomeId)?.name ?? 'Kochi Tharavadu'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void store.saveHomeCheckpoint(activeHomeId, true)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer flex items-center gap-1.5"
                  >
                    <Moon className="w-4 h-4" />
                    <span>Sleep & Save Progress</span>
                  </button>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    House Interior, Garden, Security & Garage Upgrades ({activeHomeUpgrades.length}/{HOUSE_UPGRADES.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {HOUSE_UPGRADES.map((upg) => {
                      const installed = activeHomeUpgrades.includes(upg.id);
                      return (
                        <div key={upg.id} className="p-3 rounded bg-slate-950 border border-white/10 flex flex-col justify-between gap-2">
                          <div>
                            <div className="text-[11px] text-amber-400 font-semibold">{upg.category}</div>
                            <div className="text-xs font-semibold text-white">{upg.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{upg.description}</div>
                          </div>
                          {installed ? (
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Installed
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => store.buyHouseUpgrade(activeHomeId, upg.id)}
                              className="w-full py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                            >
                              Install · ₹{upg.price.toLocaleString('en-IN')}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Property Catalog across Districts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROPERTY_CATALOG.map((prop) => {
                  const isOwned = ownedPropertyIds.includes(prop.id);
                  const isActive = activeHomeId === prop.id;
                  return (
                    <div key={prop.id} className="p-4 rounded-lg bg-slate-950 border border-white/10 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-amber-400 font-semibold">{prop.type} · {prop.district}</span>
                          {isOwned && <span className="text-emerald-400 font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Owned</span>}
                        </div>
                        <h3 className="text-lg font-bold text-white mt-1">{prop.name}</h3>
                        <div className="font-malayalam text-xs text-slate-400">{prop.malayalamName}</div>
                        <p className="text-xs text-slate-300 mt-2">{prop.description}</p>
                        <div className="mt-2.5 text-[11px] text-slate-400">
                          {prop.features.join(' · ')}
                        </div>
                      </div>
                      {isOwned ? (
                        <button
                          type="button"
                          onClick={() => store.setHomeProperty(prop.id)}
                          className={`w-full py-2 rounded text-xs font-semibold cursor-pointer ${
                            isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-white'
                          }`}
                        >
                          {isActive ? 'Spawn Outside This Home' : 'Move Home Location Here'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => store.buyProperty(prop.id)}
                          className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                        >
                          Purchase · ₹{prop.price.toLocaleString('en-IN')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* PLAYER CHARACTER CUSTOMIZATION STUDIO */}
        {activeModal === 'character' && (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-rose-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Character Appearance Studio</h2>
                  <p className="text-xs text-slate-400">Customize your realistic Kerala avatar in real time</p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal('none')} className="p-2 rounded-lg bg-slate-800 text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Gender</label>
                  <div className="flex gap-2">
                    {(['male', 'female'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() =>
                          store.setPlayerAppearance({
                            gender: g,
                            outfit: g === 'female' ? 'kasavuSaree' : 'shirtMundu',
                            hairStyle: g === 'female' ? 'longBun' : 'shortSidePart',
                            facialHair: g === 'female' ? 'none' : playerAppearance.facialHair,
                          })
                        }
                        className={`flex-1 py-2 rounded text-xs font-semibold capitalize cursor-pointer ${
                          playerAppearance.gender === g ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Natural Skin Tone</label>
                  <div className="flex gap-2">
                    {SKIN_SWATCHES.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => store.setPlayerAppearance({ skinTone: hex })}
                        className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                          playerAppearance.skinTone === hex ? 'border-amber-400 scale-110' : 'border-white/20'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Hairstyle</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        ['shortSidePart', 'Side Part'],
                        ['curlyVoluminous', 'Curly'],
                        ['slickBack', 'Slick Back'],
                        ['longBun', 'Kerala Bun'],
                        ['braided', 'Braided'],
                        ['shoulderLength', 'Long'],
                      ] as Array<[HairStyle, string]>
                    ).map(([style, label]) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => store.setPlayerAppearance({ hairStyle: style })}
                        className={`py-1.5 px-2 rounded text-xs cursor-pointer ${
                          playerAppearance.hairStyle === style ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Kerala Outfit</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ['shirtMundu', 'Shirt & Mundu'],
                        ['kasavuSaree', 'Kasavu Saree'],
                        ['kurtaPajama', 'Kerala Kurta'],
                        ['casualDenim', 'Modern Casual'],
                        ['churidar', 'Churidar'],
                        ['policeUniform', 'Police Uniform'],
                      ] as Array<[OutfitStyle, string]>
                    ).map(([outfit, label]) => (
                      <button
                        key={outfit}
                        type="button"
                        onClick={() => store.setPlayerAppearance({ outfit })}
                        className={`py-2 px-3 rounded text-xs cursor-pointer ${
                          playerAppearance.outfit === outfit ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Outfit Primary Color</label>
                  <div className="flex gap-2">
                    {PAINT_SWATCHES.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => store.setPlayerAppearance({ primaryColor: hex })}
                        className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                          playerAppearance.primaryColor === hex ? 'border-amber-400 scale-110' : 'border-white/20'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => store.setPlayerAppearance({ sunglasses: !playerAppearance.sunglasses })}
                    className={`flex-1 py-2 rounded text-xs font-semibold cursor-pointer ${
                      playerAppearance.sunglasses ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Sunglasses: {playerAppearance.sunglasses ? 'On' : 'Off'}
                  </button>
                  <button
                    type="button"
                    onClick={() => store.setPlayerAppearance({ glasses: !playerAppearance.glasses })}
                    className={`flex-1 py-2 rounded text-xs font-semibold cursor-pointer ${
                      playerAppearance.glasses ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Eyeglasses: {playerAppearance.glasses ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MISSIONS BOARD */}
        {activeModal === 'missions' && (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <Flag className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Kerala Missions & Career Contracts</h2>
                  <p className="text-xs text-slate-400">
                    Completed: {completedMissionIds.length} / {MISSION_CATALOG.length} · Earn Cash & Game Points!
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal('none')} className="p-2 rounded-lg bg-slate-800 text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
              {MISSION_CATALOG.map((m) => {
                const done = completedMissionIds.includes(m.id);
                const isRunning = activeMission?.mission.id === m.id;
                return (
                  <div key={m.id} className="p-4 rounded-lg bg-slate-950 border border-white/10 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400 font-semibold">{m.category} · From {m.giverName}</span>
                        <span className="font-hud text-emerald-400 font-bold">
                          +₹{m.rewardCash.toLocaleString('en-IN')} · +{m.rewardPoints} Pts
                        </span>
                      </div>
                      <h3 className="font-bold text-white mt-1">{m.title}</h3>
                      <div className="font-malayalam text-xs text-slate-400">{m.malayalamTitle}</div>
                      <p className="text-xs text-slate-300 mt-1.5">{m.description}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={() => store.startMission(m.id)}
                      className={`w-full py-2 rounded text-xs font-semibold cursor-pointer ${
                        isRunning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : done
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isRunning ? 'Mission Active' : done ? 'Replay Mission' : 'Start Mission'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* SETTINGS */}
        {activeModal === 'settings' && (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Game Settings & Kerala Environment</h2>
              </div>
              <button type="button" onClick={() => setActiveModal('none')} className="p-2 rounded-lg bg-slate-800 text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1.5">Kerala Weather</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['sunny', 'cloudy', 'rain', 'monsoon', 'fog'] as WeatherType[]).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => store.setWeather(w)}
                        className={`py-2 rounded capitalize cursor-pointer ${
                          store.weather === w ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1.5">Time of Day</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['sunrise', 'morning', 'afternoon', 'sunset', 'night'] as TimePeriod[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => store.setTimePeriod(t)}
                        className={`py-2 rounded capitalize cursor-pointer ${
                          store.timePeriod === t ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1.5">NPC Human Population Density</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as DensityPreset[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => store.setNpcDensity(d)}
                        className={`flex-1 py-2 rounded capitalize cursor-pointer ${
                          store.npcDensity === d ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1.5">Graphics Preset</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['low', 'medium', 'high', 'ultra'] as GraphicsPreset[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => store.setGraphics(g)}
                        className={`py-2 rounded capitalize cursor-pointer ${
                          store.graphics === g ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => store.setAudioEnabled(!store.audioEnabled)}
                    className={`flex-1 py-2 rounded font-semibold cursor-pointer ${
                      store.audioEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Audio: {store.audioEnabled ? 'On' : 'Muted'}
                  </button>
                  <button
                    type="button"
                    onClick={() => store.saveCurrentGame()}
                    className="flex-1 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Game
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
