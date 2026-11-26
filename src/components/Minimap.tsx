import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

interface MinimapProps {
  onOpenFullMap: () => void;
}

export const Minimap: React.FC<MinimapProps> = ({ onOpenFullMap }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerPos = useGameStore((s) => s.playerPos);
  const minimapEntities = useGameStore((s) => s.minimapEntities);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 148;
    const half = size / 2;
    const scale = 0.65; // world meters -> pixels

    ctx.clearRect(0, 0, size, size);

    // Background
    ctx.fillStyle = '#0b1322';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(half, half, half - 2, 0, Math.PI * 2);
    ctx.clip();

    // Helper to project world coords centered on player
    const toMap = (wx: number, wz: number) => ({
      x: half + (wx - playerPos.x) * scale,
      y: half + (wz - playerPos.z) * scale,
    });

    // Arabian Sea Ocean West (x < -190)
    const seaEdge = toMap(-190, 0);
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(0, 0, Math.max(0, seaEdge.x), size);

    // Sandy Beach (-190 to -142)
    const beachRight = toMap(-142, 0);
    ctx.fillStyle = '#a18862';
    ctx.fillRect(Math.max(0, seaEdge.x), 0, Math.max(0, beachRight.x - seaEdge.x), size);

    // Vembanad & Kuttanad Backwater Lake (x: -420..-40, z: 165..435)
    const lakeTL = toMap(-420, 165);
    const lakeBR = toMap(-40, 435);
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(lakeTL.x, lakeTL.y, lakeBR.x - lakeTL.x, lakeBR.y - lakeTL.y);

    // Kuttanad Paddy Islands inside Backwater Lake
    const isl1 = toMap(-312, 222);
    const isl1BR = toMap(-198, 318);
    ctx.fillStyle = '#365314';
    ctx.fillRect(isl1.x, isl1.y, isl1BR.x - isl1.x, isl1BR.y - isl1.y);

    // Railway Line (x = 136, z: -340..340)
    const rTop = toMap(136, -340);
    const rBot = toMap(136, 340);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(rTop.x, rTop.y);
    ctx.lineTo(rBot.x, rBot.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Expanded Kerala Roads & Highways
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 8;
    const drawLine = (x1: number, z1: number, x2: number, z2: number) => {
      const p1 = toMap(x1, z1);
      const p2 = toMap(x2, z2);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    };
    // Core Fort Kochi / Ernakulam Grid
    drawLine(-120, -180, -120, 180);
    drawLine(0, -280, 0, 360);
    drawLine(90, -180, 90, 180);
    drawLine(-180, -96, 180, -96);
    drawLine(-180, 0, 180, 0);
    drawLine(-180, 88, 180, 88);
    // Thrissur, Munnar & Wayanad Highland Highways
    drawLine(-60, -210, 325, -210);
    drawLine(315, -350, 315, -190);
    drawLine(225, -330, 325, -330);
    // Kuttanad Backwater Bridge & Trivandrum / Kovalam Highways
    drawLine(-120, 135, -120, 315);
    drawLine(-268, 270, -112, 270);
    drawLine(-15, 280, 75, 280);
    drawLine(-152, 360, 22, 360);

    // Draw entities
    for (const ent of minimapEntities) {
      const p = toMap(ent.x, ent.z);
      if (p.x < -6 || p.x > size + 6 || p.y < -6 || p.y > size + 6) continue;
      if (ent.type === 'npc') {
        ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      } else if (ent.type === 'vehicle') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      } else if (ent.type === 'police') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.type === 'location') {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.type === 'mission') {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Player Arrow at center
    ctx.save();
    ctx.translate(half, half);
    ctx.rotate(-playerPos.yaw + Math.PI);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, -6.5);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(0, 2.5);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }, [playerPos, minimapEntities]);

  return (
    <button
      type="button"
      onClick={onOpenFullMap}
      title="Open Full Kerala Map (M)"
      className="group relative w-[148px] h-[148px] rounded-full border-2 border-slate-600/80 bg-slate-950 overflow-hidden shadow-lg hover:border-amber-400 transition-colors cursor-pointer"
    >
      <canvas ref={canvasRef} width={148} height={148} className="block w-full h-full" />
      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-slate-200 bg-slate-950/90 rounded">
        MAP · M
      </span>
    </button>
  );
};
