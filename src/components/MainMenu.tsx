import React from 'react';
import {
  Building2,
  Car,
  Compass,
  Play,
  RotateCcw,
  Save,
  Settings,
  User,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export const MainMenu: React.FC = () => {
  const {
    phase,
    hasSavedGame,
    activeModal,
    setPhase,
    setActiveModal,
    startNewGame,
    loadSavedGame,
    saveCurrentGame,
  } = useGameStore();

  if (phase === 'playing') return null;

  if (phase === 'paused' && activeModal === 'none') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/80 p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-white/15 rounded-xl p-6 space-y-4 shadow-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">Game Paused</h2>
            <p className="text-xs text-slate-400 mt-0.5">Infinity City · Fort Kochi, Kerala</p>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPhase('playing')}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> Resume Exploration
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('map')}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-amber-400" /> Kerala 14-District Map
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('settings')}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4 text-sky-400" /> Weather & Settings
            </button>
            <button
              type="button"
              onClick={() => saveCurrentGame()}
              className="w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Progress
            </button>
            <button
              type="button"
              onClick={() => setPhase('menu')}
              className="w-full py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-300 font-medium text-sm cursor-pointer"
            >
              Return to Main Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase !== 'menu' || activeModal !== 'none') return null;

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 sm:p-10 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-transparent">
      <div className="max-w-xl my-auto space-y-6">
        <div>
          <div className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
            Kerala Open World · Kasaragod to Thiruvananthapuram
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mt-2 leading-tight">
            INFINITY CITY
          </h1>
          <div className="font-malayalam text-lg text-amber-200 mt-1">
            ഇൻഫിനിറ്റി സിറ്റി · കേരള അൾട്ടിമേറ്റ് എഡിഷൻ
          </div>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-lg">
            Drive original Kerala vehicles, explore Fort Kochi & Ernakulam, interact with a living population of original 3D locals, manage properties, and experience dynamic Kerala monsoon weather.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 max-w-md">
          {hasSavedGame && (
            <button
              type="button"
              onClick={() => loadSavedGame()}
              className="flex-1 py-3 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> Continue
            </button>
          )}
          <button
            type="button"
            onClick={() => startNewGame()}
            className={`flex-1 py-3 px-5 rounded-lg font-bold text-sm shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              hasSavedGame
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/15'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {hasSavedGame ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{hasSavedGame ? 'New Game' : 'Play Infinity City'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveModal('character')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs font-medium text-slate-200 cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-rose-400" /> Character Studio
          </button>
          <button
            type="button"
            onClick={() => setActiveModal('map')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs font-medium text-slate-200 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" /> 14-District Map
          </button>
          <button
            type="button"
            onClick={() => setActiveModal('garage')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs font-medium text-slate-200 cursor-pointer"
          >
            <Car className="w-3.5 h-3.5 text-sky-400" /> Vehicles
          </button>
          <button
            type="button"
            onClick={() => setActiveModal('properties')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs font-medium text-slate-200 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Properties
          </button>
          <button
            type="button"
            onClick={() => setActiveModal('settings')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs font-medium text-slate-200 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" /> Settings
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        Left-hand Kerala driving rules · WASD + Mouse Look · [E] Enter/Exit any vehicle · [F] Talk to NPCs & Enter Services
      </div>
    </div>
  );
};
