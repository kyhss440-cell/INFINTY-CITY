import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

interface MinimapProps {
  onOpenFullMap: () => void;
}

export const Minimap: React.FC<MinimapProps> = ({ onOpenFullMap }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerPos = useGameStore((s) => s.playerPos);
  const minimapEntities = useGameStore((s) => s.minimapEntities);
  const gpsRoute = useGameStore((s) => s.gpsRoute);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 148;
    const half = size / 2;
    const scale = 0.62;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#0b1322';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(half, half, half - 2, 0, Math.PI * 2);
    ctx.clip();

    const toMap = (wx: number, wz: number) => ({
      x: half + (wx - playerPos.x) * scale,
      y: half + (wz - playerPos.z) * scale,
    });

    // Arabian Sea West (x < -190)
    const seaEdge = toMap(-190, 0);
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(0, 0, Math.max(0, seaEdge.x), size);

    // Sandy Beach (-190 to -142)
    const beachRight = toMap(-142, 0);
    ctx.fillStyle = '#a18862';
    ctx.fillRect(Math.max(0, seaEdge.x), 0, Math.max(0, beachRight.x - seaEdge.x), size);

    // Vembanad & Kuttanad Backwater Lake
    const lakeTL = toMap(-370, 168);
    const lakeBR = toMap(-48, 425);
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(lakeTL.x, lakeTL.y, lakeBR.x - lakeTL.x, lakeBR.y - lakeTL.y);

    // Eastern Canal
    const canTL = toMap(-48, 174);
    const canBR = toMap(412, 210);
    ctx.fillRect(canTL.x, canTL.y, canBR.x - canTL.x, canBR.y - canTL.y);

    // Kuttanad Paddy Islands
    const isl1 = toMap(-312, 222);
    const isl1BR = toMap(-198, 318);
    ctx.fillStyle = '#365314';
    ctx.fillRect(isl1.x, isl1.y, isl1BR.x - isl1.x, isl1BR.y - isl1.y);

    // Railway Line (x = 136)
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

    // Kerala Highway Network
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 7.5;
    const drawLine = (x1: number, z1: number, x2: number, z2: number) => {
      const p1 = toMap(x1, z1);
      const p2 = toMap(x2, z2);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    };
    drawLine(-120, -180, -120, 180);
    drawLine(0, -290, 0, 365);
    drawLine(90, -180, 90, 285);
    drawLine(-180, -96, 180, -96);
    drawLine(-180, 0, 180, 0);
    drawLine(-180, 88, 180, 88);
    drawLine(-130, -210, 315, -210);
    drawLine(-125, -345, -125, -180);
    drawLine(315, -340, 315, -190);
    drawLine(85, -330, 315, -330);
    drawLine(-120, 135, -120, 360);
    drawLine(-255, 270, -112, 270);
    drawLine(0, 280, 175, 280);
    drawLine(-135, 360, 10, 360);

    // Active GPS Route Polyline
    if (gpsRoute) {
      const pts = gpsRoute.useAlternative ? gpsRoute.altWaypoints : gpsRoute.waypoints;
      if (pts.length > 1) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        pts.forEach((wp, idx) => {
          const mp = toMap(wp.x, wp.z);
          if (idx === 0) ctx.moveTo(mp.x, mp.y);
          else ctx.lineTo(mp.x, mp.y);
        });
        ctx.stroke();
      }
    }

    // Entities & Distinct Ownership Icons
    for (const ent of minimapEntities) {
      const p = toMap(ent.x, ent.z);
      if (p.x < -8 || p.x > size + 8 || p.y < -8 || p.y > size + 8) continue;

      if (ent.type === 'npc') {
        ctx.fillStyle = 'rgba(226, 232, 240, 0.5)';
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      } else if (ent.type === 'vehicle') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      } else if (ent.type === 'police') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.type === 'location') {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.type === 'my_house') {
        // Green house square with roof peak
        ctx.fillStyle = '#10b981';
        ctx.fillRect(p.x - 3.5, p.y - 2, 7, 5);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 5);
        ctx.lineTo(p.x + 4.5, p.y - 1.5);
        ctx.lineTo(p.x - 4.5, p.y - 1.5);
        ctx.closePath();
        ctx.fill();
      } else if (ent.type === 'my_garage') {
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(p.x - 3.5, p.y - 3.5, 7, 7);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x - 3.5, p.y - 3.5, 7, 7);
      } else if (ent.type === 'my_car') {
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 4);
        ctx.lineTo(p.x + 4, p.y);
        ctx.lineTo(p.x, p.y + 4);
        ctx.lineTo(p.x - 4, p.y);
        ctx.closePath();
        ctx.fill();
      } else if (ent.type === 'my_bike') {
        ctx.fillStyle = '#a3e635';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();
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
  }, [playerPos, minimapEntities, gpsRoute]);

  return (
    <button
      type="button"
      onClick={onOpenFullMap}
      title="Open Full Kerala GPS & Atlas (M)"
      className="group relative w-[148px] h-[148px] rounded-full border-2 border-slate-600/80 bg-slate-950 overflow-hidden shadow-lg hover:border-amber-400 transition-colors cursor-pointer"
    >
      <canvas ref={canvasRef} width={148} height={148} className="block w-full h-full" />
      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-slate-200 bg-slate-950/90 rounded">
        GPS · M
      </span>
    </button>
  );
};
