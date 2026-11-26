import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Camera,
  Car,
  CloudRain,
  Compass,
  Flag,
  MapPin,
  Pause,
  ShieldAlert,
  Sun,
  User,
  Wallet,
} from 'lucide-react';
import { InfinityCityEngine } from '../game/InfinityCityEngine';
import { useGameStore } from '../store/gameStore';
import { Minimap } from './Minimap';

interface GameHudProps {
  engineRef: React.MutableRefObject<InfinityCityEngine | null>;
}

export const GameHud: React.FC<GameHudProps> = ({ engineRef }) => {
  const {
    cash,
    bankBalance,
    health,
    wantedLevel,
    currentLocationName,
    inVehicle,
    inTrain,
    currentVehicleName,
    currentVehiclePlate,
    speedKmh,
    gearLabel,
    interactionPrompt,
    cameraMode,
    weather,
    timePeriod,
    activeMission,
    notifications,
    mobileControlsOverride,
    setPhase,
    setActiveModal,
    cycleCameraMode,
  } = useGameStore();

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const joystickOrigin = useRef<{ x: number; y: number } | null>(null);
  const [joyOffset, setJoyOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 840;
    setIsTouchDevice(touch);
  }, []);

  const showMobileHud = mobileControlsOverride !== null ? mobileControlsOverride : isTouchDevice;

  const handleJoystickStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    joystickOrigin.current = { x: t.clientX, y: t.clientY };
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!joystickOrigin.current || !engineRef.current) return;
    const t = e.touches[0];
    const dx = Math.max(-40, Math.min(40, t.clientX - joystickOrigin.current.x));
    const dy = Math.max(-40, Math.min(40, t.clientY - joystickOrigin.current.y));
    setJoyOffset({ x: dx, y: dy });
    engineRef.current.mobileInput.moveX = dx / 40;
    engineRef.current.mobileInput.moveY = -dy / 40;
  };

  const handleJoystickEnd = () => {
    joystickOrigin.current = null;
    setJoyOffset({ x: 0, y: 0 });
    if (engineRef.current) {
      engineRef.current.mobileInput.moveX = 0;
      engineRef.current.mobileInput.moveY = 0;
    }
  };

  const handleActionTrigger = () => {
    if (!engineRef.current) return;
    if (
      interactionPrompt?.includes('Enter') ||
      interactionPrompt?.includes('Exit') ||
      interactionPrompt?.includes('Board')
    ) {
      engineRef.current.triggerEnterExitVehicle();
    } else {
      engineRef.current.triggerInteraction();
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 sm:p-5">
      {/* TOP BAR ROW */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Radar Minimap + Location */}
        <div className="pointer-events-auto flex items-start gap-3">
          <Minimap onOpenFullMap={() => setActiveModal('map')} />
          <div className="hidden sm:flex flex-col gap-1 bg-slate-950/90 border border-white/10 rounded-lg px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{currentLocationName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              {weather === 'rain' || weather === 'monsoon' ? (
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span className="capitalize">{timePeriod}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{weather}</span>
            </div>
          </div>
        </div>

        {/* Top-Center: Active Mission Tracker & Toast Notifications */}
        <div className="flex flex-col items-center gap-2 max-w-md w-full mx-auto">
          {activeMission && (
            <div className="pointer-events-auto bg-slate-950/92 border border-amber-500/40 rounded-lg px-4 py-2 text-center shadow-lg">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-400">
                <Flag className="w-3.5 h-3.5" />
                <span>{activeMission.mission.title}</span>
                <span aria-hidden="true">·</span>
                <span className="font-hud text-white">
                  {Math.max(0, Math.ceil(activeMission.timeRemaining))}s
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                Destination: <span className="font-semibold text-white">{activeMission.mission.targetLabel}</span>
              </p>
            </div>
          )}

          {notifications.map((n) => (
            <div
              key={n.id}
              className={`px-4 py-2 rounded-lg border text-xs shadow-lg max-w-sm text-center ${
                n.variant === 'alert'
                  ? 'bg-red-950/95 border-red-500/60 text-red-100'
                  : n.variant === 'success'
                  ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100'
                  : n.variant === 'warning'
                  ? 'bg-amber-950/95 border-amber-500/50 text-amber-100'
                  : 'bg-slate-950/92 border-white/15 text-slate-100'
              }`}
            >
              <div className="font-semibold">{n.title}</div>
              <div className="text-[11px] opacity-90">{n.message}</div>
            </div>
          ))}
        </div>

        {/* Top-Right: Economy, Wanted Stars & Quick Menu */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 bg-slate-950/90 border border-white/10 rounded-lg px-3.5 py-2">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 font-hud text-base font-bold text-emerald-400">
                <Wallet className="w-4 h-4" />
                <span>₹{cash.toLocaleString('en-IN')}</span>
              </div>
              <div className="font-hud text-[11px] text-slate-400">
                Bank ₹{bankBalance.toLocaleString('en-IN')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPhase('paused')}
              className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Pause Menu (ESC)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {wantedLevel > 0 && (
            <div className="flex items-center gap-1.5 bg-red-950/95 border border-red-500/60 rounded-md px-3 py-1 text-xs font-semibold text-red-200">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Wanted</span>
              <span className="font-hud text-amber-300">{'★'.repeat(wantedLevel)}</span>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM BAR ROW */}
      <div className="flex items-end justify-between gap-4">
        {/* Bottom-Left: Mobile Thumbstick OR Quick Shortcuts Bar */}
        {showMobileHud ? (
          <div
            className="pointer-events-auto relative w-28 h-28 rounded-full bg-slate-950/75 border border-white/20 flex items-center justify-center touch-none"
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
          >
            <div
              className="w-11 h-11 rounded-full bg-amber-500/90 border-2 border-white/60 shadow-md"
              style={{ transform: `translate(${joyOffset.x}px, ${joyOffset.y}px)` }}
            />
          </div>
        ) : (
          <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/90 border border-white/10 rounded-lg p-1.5">
            <button
              type="button"
              onClick={() => setActiveModal('map')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Kerala Map</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('missions')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer whitespace-nowrap"
            >
              <Flag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Missions</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('garage')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer whitespace-nowrap"
            >
              <Car className="w-3.5 h-3.5 text-sky-400" />
              <span>Garage</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('properties')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer whitespace-nowrap"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Properties</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('character')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5 text-rose-400" />
              <span>Character</span>
            </button>
            <button
              type="button"
              onClick={cycleCameraMode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer whitespace-nowrap"
              title="Switch Camera (C)"
            >
              <Camera className="w-3.5 h-3.5 text-slate-300" />
              <span className="capitalize">{cameraMode.replace('-', ' ')}</span>
            </button>
          </div>
        )}

        {/* Bottom-Center: Contextual Interaction Prompt */}
        <div className="flex flex-col items-center gap-2 mb-1">
          {interactionPrompt && (
            <button
              type="button"
              onClick={handleActionTrigger}
              className="pointer-events-auto px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs sm:text-sm shadow-lg hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              {interactionPrompt}
            </button>
          )}
          {!showMobileHud && (
            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-300 bg-slate-950/80 border border-white/10 rounded px-3 py-1">
              <span>WASD Move/Drive</span>
              <span aria-hidden="true">·</span>
              <span>Drag Mouse Look</span>
              <span aria-hidden="true">·</span>
              <span>E Enter/Train</span>
              <span aria-hidden="true">·</span>
              <span>F Talk/Home</span>
              <span aria-hidden="true">·</span>
              <span>J Strike</span>
              <span aria-hidden="true">·</span>
              <span>Space Jump/Brake</span>
              <span aria-hidden="true">·</span>
              <span>C Camera</span>
            </div>
          )}
        </div>

        {/* Bottom-Right: Speedometer / Health + Mobile Driving Pedals */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {showMobileHud && (
            <div className="flex flex-wrap justify-end items-center gap-2">
              {inVehicle && (
                <>
                  <button
                    type="button"
                    onTouchStart={() => {
                      if (engineRef.current) engineRef.current.mobileInput.moveY = -1;
                    }}
                    onTouchEnd={() => {
                      if (engineRef.current) engineRef.current.mobileInput.moveY = 0;
                    }}
                    className="px-3.5 py-2.5 rounded-lg bg-red-700/90 border border-white/20 text-xs font-bold text-white"
                  >
                    Brake
                  </button>
                  <button
                    type="button"
                    onTouchStart={() => {
                      if (engineRef.current) engineRef.current.mobileInput.moveY = 1;
                    }}
                    onTouchEnd={() => {
                      if (engineRef.current) engineRef.current.mobileInput.moveY = 0;
                    }}
                    className="px-4 py-2.5 rounded-lg bg-emerald-600/95 border border-white/20 text-xs font-bold text-white"
                  >
                    Gas
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={cycleCameraMode}
                className="px-3 py-2 rounded-lg bg-slate-900/90 border border-white/15 text-xs font-semibold text-white"
              >
                Cam
              </button>
              {!inVehicle && !inTrain && (
                <button
                  type="button"
                  onClick={() => engineRef.current?.triggerMeleePunch()}
                  className="px-3 py-2 rounded-lg bg-rose-600 text-xs font-semibold text-white"
                >
                  Strike
                </button>
              )}
              <button
                type="button"
                onClick={() => engineRef.current?.triggerEnterExitVehicle()}
                className="px-3 py-2 rounded-lg bg-sky-600 text-xs font-semibold text-white"
              >
                {inVehicle || inTrain ? 'Exit' : 'Enter'}
              </button>
              <button
                type="button"
                onClick={() => engineRef.current?.triggerInteraction()}
                className="px-3 py-2 rounded-lg bg-amber-500 text-xs font-semibold text-slate-950"
              >
                Talk/Use
              </button>
            </div>
          )}

          {inTrain ? (
            <div className="bg-slate-950/92 border border-sky-500/40 rounded-lg px-4 py-2.5 min-w-[205px]">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-hud text-3xl font-bold text-white leading-none">
                  {speedKmh}
                  <span className="text-xs font-medium text-slate-400 ml-1">KM/H</span>
                </div>
                <div className="font-hud text-xs font-bold text-sky-400">EXPRESS</div>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-300">
                <span>Kerala Express</span>
                <span className="text-amber-300">E · Disembark</span>
              </div>
            </div>
          ) : inVehicle ? (
            <div className="bg-slate-950/92 border border-white/15 rounded-lg px-4 py-2.5 min-w-[195px]">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-hud text-3xl font-bold text-white leading-none">
                  {speedKmh}
                  <span className="text-xs font-medium text-slate-400 ml-1">KM/H</span>
                </div>
                <div className="font-hud text-lg font-bold text-amber-400">G{gearLabel}</div>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-300">
                <span className="truncate max-w-[125px]">{currentVehicleName}</span>
                <span className="font-hud text-amber-200">{currentVehiclePlate}</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/92 border border-white/15 rounded-lg px-4 py-2.5 min-w-[165px]">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                <span>Health</span>
                <span className="font-hud font-semibold text-emerald-400">{health}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${health}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
