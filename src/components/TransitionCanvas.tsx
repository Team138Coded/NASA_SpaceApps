import React, { useEffect, useRef, useState } from 'react';
import { TransitionKind } from '../types/mission';

interface TransitionCanvasProps {
  active: boolean;
  kind: TransitionKind;
  targetTitle: string;
  targetSubtitle: string;
  onComplete: () => void;
}

export const TransitionCanvas: React.FC<TransitionCanvasProps> = ({
  active,
  kind,
  targetTitle,
  targetSubtitle,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (!active) {
      setFadingOut(false);
      return;
    }

    let finished = false;
    const finishOnce = () => {
      if (finished) return;
      finished = true;
      onCompleteRef.current();
    };

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      const quick = window.setTimeout(finishOnce, 200);
      return () => window.clearTimeout(quick);
    }

    const fadeTimer = window.setTimeout(() => setFadingOut(true), 1150);
    const hardStopTimer = window.setTimeout(finishOnce, 1450);

    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d') : null;
    if (!canvas || !ctx) {
      return () => {
        window.clearTimeout(fadeTimer);
        window.clearTimeout(hardStopTimer);
      };
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const duration = 1400;
    const start = performance.now();
    let rafId = 0;

    const particles = Array.from({ length: 120 }, (_, i) => ({
      x: ((i * 73) % 1000) / 1000,
      y: ((i * 197) % 1000) / 1000,
      z: ((i * 313) % 1000) / 1000 + 0.15,
      speed: 0.4 + ((i * 41) % 100) / 100,
    }));

    const drawFrame = (now: number) => {
      if (finished) return;
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      const alpha = p < 0.14 ? p / 0.14 : p > 0.78 ? Math.max(0, (1 - p) / 0.22) : 1;
      ctx.fillStyle = `rgba(7, 11, 20, ${0.9 * alpha})`;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      if (kind === 'terrain_pan') {
        // Smooth horizontal camera pan across Martian ridges + radio carrier arc
        const panOffset = p * w * 0.45;
        ctx.fillStyle = `rgba(45, 22, 18, ${0.7 * alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 24) {
          const ridgeY =
            h * 0.68 +
            Math.sin((x + panOffset) * 0.008) * 32 +
            Math.cos((x + panOffset) * 0.02) * 14;
          ctx.lineTo(x, ridgeY);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        // Radio signal arc sweeping across the sky
        ctx.beginPath();
        ctx.moveTo(w * 0.15, h * 0.56);
        ctx.quadraticCurveTo(w * 0.5, h * 0.2, w * 0.85, h * 0.56);
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.5 * alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        const px =
          (1 - p) * (1 - p) * (w * 0.15) +
          2 * (1 - p) * p * (w * 0.5) +
          p * p * (w * 0.85);
        const py =
          (1 - p) * (1 - p) * (h * 0.56) +
          2 * (1 - p) * p * (h * 0.2) +
          p * p * (h * 0.56);
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(224, 122, 95, ${alpha})`;
        ctx.fill();
      } else if (kind === 'carrier' || kind === 'awakening') {
        const accent = kind === 'awakening' ? '224, 122, 95' : '56, 189, 248';
        for (let i = 0; i < 6; i++) {
          const ringP = (p * 1.4 + i * 0.15) % 1;
          const radius = ringP * Math.max(w, h) * 0.5;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${accent}, ${(1 - ringP) * 0.45 * alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const normX = x / w;
          const env = Math.sin(normX * Math.PI);
          const y = cy + Math.sin(normX * 26 - p * 18) * 32 * env * (1 - p * 0.35);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${accent}, ${0.75 * alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (kind === 'flight') {
        ctx.beginPath();
        ctx.moveTo(w * 0.1, h * 0.25);
        ctx.quadraticCurveTo(w * 0.48, h * 0.22, w * 0.88, h * 0.72);
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 * alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);

        const px =
          (1 - p) * (1 - p) * (w * 0.1) +
          2 * (1 - p) * p * (w * 0.48) +
          p * p * (w * 0.88);
        const py =
          (1 - p) * (1 - p) * (h * 0.25) +
          2 * (1 - p) * p * (h * 0.22) +
          p * p * (h * 0.72);
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(224, 122, 95, ${alpha})`;
        ctx.fill();
      } else if (kind === 'dust') {
        particles.forEach((pt) => {
          const sx = ((pt.x + p * pt.speed * 1.4) % 1) * w;
          const sy = pt.y * h + Math.sin(p * 8 + pt.x * 10) * 18;
          ctx.fillStyle = `rgba(224, 122, 95, ${0.42 * pt.z * alpha})`;
          ctx.fillRect(sx, sy, 28 * pt.z, 1.5);
        });
      } else if (kind === 'seismic') {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const dist = Math.abs(x / w - p);
          const packet = Math.exp(-dist * dist * 45);
          const y = cy + Math.sin(x * 0.08 - p * 20) * 75 * packet;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.85 * alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (kind === 'interstellar') {
        particles.forEach((pt) => {
          const dx = pt.x - 0.5;
          const dy = pt.y - 0.5;
          const scale1 = 1 + p * 2.2 * pt.z;
          const scale2 = 1 + Math.max(0, p - 0.08) * 2.2 * pt.z;
          ctx.beginPath();
          ctx.moveTo(cx + dx * w * scale2, cy + dy * h * scale2);
          ctx.lineTo(cx + dx * w * scale1, cy + dy * h * scale1);
          ctx.strokeStyle = `rgba(226, 232, 240, ${0.65 * alpha})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        });
      }

      if (elapsed < duration) {
        rafId = requestAnimationFrame(drawFrame);
      } else {
        finishOnce();
      }
    };

    rafId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hardStopTimer);
    };
  }, [active, kind]);

  if (!active) return null;

  return (
    <div
      style={{ display: active ? 'flex' : 'none' }}
      className={`fixed inset-0 z-50 items-center justify-center pointer-events-none transition-opacity duration-300 ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      aria-live="polite"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 text-center px-6 max-w-xl">
        <div className="font-mono text-xs tracking-widest uppercase text-[#38BDF8] mb-2">
          {kind === 'terrain_pan'
            ? 'Panning Across Martian Horizon'
            : 'Deep Space Network Signal Lock'}
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-100 tracking-tight">
          {targetTitle}
        </h2>
        <p className="font-mono text-xs text-slate-400 mt-2">{targetSubtitle}</p>
      </div>
    </div>
  );
};
