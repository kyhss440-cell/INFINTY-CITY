import { useEffect, useRef } from 'react';
import { GameHud } from './components/GameHud';
import { GameModals } from './components/GameModals';
import { KeralaMapModal } from './components/KeralaMapModal';
import { MainMenu } from './components/MainMenu';
import { InfinityCityEngine } from './game/InfinityCityEngine';
import { useGameStore } from './store/gameStore';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<InfinityCityEngine | null>(null);
  const phase = useGameStore((s) => s.phase);
  const checkExistingSave = useGameStore((s) => s.checkExistingSave);

  useEffect(() => {
    checkExistingSave();
  }, [checkExistingSave]);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const engine = new InfinityCityEngine(mountEl);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* Isolated WebGL canvas mount */}
      <div ref={canvasMountRef} className="w-full h-full" />

      {/* Game HUD & Menus */}
      {phase === 'playing' && <GameHud engineRef={engineRef} />}
      <MainMenu />
      <KeralaMapModal />
      <GameModals />
    </div>
  );
}
