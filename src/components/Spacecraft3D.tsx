import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Play, Pause, Crosshair } from 'lucide-react';
import { HardwarePin, MissionDossier } from '../types/mission';

interface Spacecraft3DProps {
  mission: MissionDossier;
}

type Vec3 = [number, number, number];
type Edge = [number, number];
type Face = { indices: number[]; fill: string; stroke?: string };

interface GeometrySpec {
  vertices: Vec3[];
  edges: Edge[];
  faces: Face[];
}

function addBox(
  vertices: Vec3[],
  edges: Edge[],
  faces: Face[],
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  fill: string,
  stroke?: string
) {
  const base = vertices.length;
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  vertices.push(
    [cx - hw, cy - hh, cz - hd],
    [cx + hw, cy - hh, cz - hd],
    [cx + hw, cy + hh, cz - hd],
    [cx - hw, cy + hh, cz - hd],
    [cx - hw, cy - hh, cz + hd],
    [cx + hw, cy - hh, cz + hd],
    [cx + hw, cy + hh, cz + hd],
    [cx - hw, cy + hh, cz + hd]
  );
  const boxEdges: Edge[] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  boxEdges.forEach(([a, b]) => edges.push([base + a, base + b]));
  const boxFaces = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [2, 3, 7, 6],
    [1, 2, 6, 5],
    [0, 3, 7, 4],
  ];
  boxFaces.forEach((idxs) =>
    faces.push({ indices: idxs.map((i) => base + i), fill, stroke })
  );
}

function addRing(
  vertices: Vec3[],
  edges: Edge[],
  faces: Face[],
  cx: number,
  cy: number,
  cz: number,
  radius: number,
  segments: number,
  axis: 'x' | 'y' | 'z',
  fill?: string,
  stroke?: string
) {
  const base = vertices.length;
  const idxs: number[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const c = Math.cos(a) * radius;
    const s = Math.sin(a) * radius;
    if (axis === 'y') vertices.push([cx + c, cy, cz + s]);
    else if (axis === 'z') vertices.push([cx + c, cy + s, cz]);
    else vertices.push([cx, cy + c, cz + s]);
    idxs.push(base + i);
  }
  for (let i = 0; i < segments; i++) {
    edges.push([base + i, base + ((i + 1) % segments)]);
  }
  if (fill) {
    faces.push({ indices: idxs, fill, stroke });
  }
}

function buildSpacecraftGeometry(modelType: MissionDossier['modelType']): GeometrySpec {
  const vertices: Vec3[] = [];
  const edges: Edge[] = [];
  const faces: Face[] = [];

  if (modelType === 'vali' || modelType === 'mer') {
    // Rover chassis
    addBox(vertices, edges, faces, 0, 0.05, 0, 0.8, 0.35, 1.0, 'rgba(56, 189, 248, 0.14)', '#38BDF8');
    // Mast + stereo head
    addBox(vertices, edges, faces, 0.1, 0.55, 0.3, 0.08, 0.65, 0.08, 'rgba(226, 232, 240, 0.2)', '#94A3B8');
    addBox(vertices, edges, faces, 0.1, 0.92, 0.3, 0.36, 0.14, 0.18, 'rgba(56, 189, 248, 0.25)', '#38BDF8');

    if (modelType === 'mer') {
      // Triangular solar wings
      addBox(vertices, edges, faces, 0.72, 0.18, -0.08, 0.65, 0.04, 0.95, 'rgba(224, 122, 95, 0.2)', '#E07A5F');
      addBox(vertices, edges, faces, -0.72, 0.18, -0.08, 0.65, 0.04, 0.95, 'rgba(224, 122, 95, 0.2)', '#E07A5F');
      // RAT arm
      addBox(vertices, edges, faces, 0.08, -0.05, 0.72, 0.1, 0.08, 0.45, 'rgba(224, 122, 95, 0.25)', '#E07A5F');
    } else {
      // MMRTG tail
      addBox(vertices, edges, faces, 0, 0.15, -0.72, 0.28, 0.26, 0.42, 'rgba(224, 122, 95, 0.22)', '#E07A5F');
    }

    // 6 Wheels
    [-0.56, 0.56].forEach((wx) => {
      [-0.48, 0, 0.48].forEach((wz) => {
        addRing(vertices, edges, faces, wx, -0.38, wz, 0.16, 10, 'x', 'rgba(148, 163, 184, 0.18)', '#64748B');
      });
    });
  } else if (modelType === 'viking') {
    // Hexagonal lander deck
    addRing(vertices, edges, faces, 0, 0.22, 0, 0.75, 6, 'y', 'rgba(56, 189, 248, 0.15)', '#38BDF8');
    addRing(vertices, edges, faces, 0, -0.08, 0, 0.75, 6, 'y', 'rgba(56, 189, 248, 0.1)', '#38BDF8');
    // 3 landing legs
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.3;
      const bIdx = vertices.length;
      vertices.push([Math.cos(a) * 0.62, -0.08, Math.sin(a) * 0.62]);
      vertices.push([Math.cos(a) * 1.02, -0.62, Math.sin(a) * 1.02]);
      edges.push([bIdx, bIdx + 1]);
      addRing(vertices, edges, faces, Math.cos(a) * 1.02, -0.62, Math.sin(a) * 1.02, 0.14, 8, 'y', 'rgba(224, 122, 95, 0.22)', '#E07A5F');
    }
    // HGA Dish
    addRing(vertices, edges, faces, -0.25, 0.76, -0.35, 0.38, 14, 'z', 'rgba(226, 232, 240, 0.2)', '#E2E8F0');
    // RTG covers
    addBox(vertices, edges, faces, 0.68, 0.18, -0.15, 0.28, 0.22, 0.48, 'rgba(224, 122, 95, 0.24)', '#E07A5F');
    // Sampler arm
    addBox(vertices, edges, faces, 0.05, 0.12, 0.78, 0.08, 0.08, 0.85, 'rgba(56, 189, 248, 0.25)', '#38BDF8');
  } else if (modelType === 'sojourner') {
    // Microwave-sized boxy chassis + top solar panel
    addBox(vertices, edges, faces, 0, 0.08, 0, 0.66, 0.26, 0.88, 'rgba(56, 189, 248, 0.18)', '#38BDF8');
    addBox(vertices, edges, faces, 0, 0.24, 0, 0.72, 0.04, 0.94, 'rgba(224, 122, 95, 0.26)', '#E07A5F');
    // APXS rear mount
    addBox(vertices, edges, faces, 0, -0.02, -0.55, 0.16, 0.16, 0.22, 'rgba(56, 189, 248, 0.28)', '#38BDF8');
    // UHF Whip
    const uBase = vertices.length;
    vertices.push([-0.25, 0.25, -0.25], [-0.25, 0.65, -0.25]);
    edges.push([uBase, uBase + 1]);
    // 6 compact wheels
    [-0.42, 0.42].forEach((wx) => {
      [-0.34, 0, 0.34].forEach((wz) => {
        addRing(vertices, edges, faces, wx, -0.22, wz, 0.12, 10, 'x', 'rgba(148, 163, 184, 0.22)', '#94A3B8');
      });
    });
  } else if (modelType === 'phoenix_insight') {
    // Octagonal deck + dual circular Ultraflex solar fans
    addBox(vertices, edges, faces, 0, 0.1, 0, 0.68, 0.24, 0.68, 'rgba(56, 189, 248, 0.18)', '#38BDF8');
    addRing(vertices, edges, faces, 0.86, 0.12, 0, 0.56, 10, 'y', 'rgba(224, 122, 95, 0.22)', '#E07A5F');
    addRing(vertices, edges, faces, -0.86, 0.12, 0, 0.56, 10, 'y', 'rgba(224, 122, 95, 0.22)', '#E07A5F');
    // SEIS dome deployed in front
    addRing(vertices, edges, faces, 0.15, -0.45, 0.78, 0.22, 12, 'y', 'rgba(224, 122, 95, 0.28)', '#E07A5F');
    addRing(vertices, edges, faces, 0.15, -0.32, 0.78, 0.16, 12, 'y', 'rgba(224, 122, 95, 0.22)', '#E07A5F');
    // 3 legs
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      const idx = vertices.length;
      vertices.push([Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42]);
      vertices.push([Math.cos(a) * 0.68, -0.48, Math.sin(a) * 0.68]);
      edges.push([idx, idx + 1]);
    }
  } else if (modelType === 'ingenuity') {
    // Central fuselage cube
    addBox(vertices, edges, faces, 0, 0.08, 0, 0.32, 0.28, 0.32, 'rgba(224, 122, 95, 0.24)', '#E07A5F');
    // Rotor mast + top solar panel
    addBox(vertices, edges, faces, 0, 0.55, 0, 0.05, 0.68, 0.05, 'rgba(226, 232, 240, 0.25)', '#CBD5E1');
    addBox(vertices, edges, faces, 0, 0.92, 0, 0.46, 0.04, 0.26, 'rgba(56, 189, 248, 0.28)', '#38BDF8');
    // Coaxial 1.2m rotor blades (two crossed pairs)
    addBox(vertices, edges, faces, 0, 0.74, 0, 1.85, 0.02, 0.12, 'rgba(56, 189, 248, 0.22)', '#38BDF8');
    addBox(vertices, edges, faces, 0, 0.64, 0, 0.12, 0.02, 1.85, 'rgba(56, 189, 248, 0.22)', '#38BDF8');
    // 4 splayed landing legs
    [
      [-0.45, -0.48, -0.45],
      [0.45, -0.48, -0.45],
      [0.45, -0.48, 0.45],
      [-0.45, -0.48, 0.45],
    ].forEach(([lx, ly, lz]) => {
      const idx = vertices.length;
      vertices.push([lx * 0.28, -0.04, lz * 0.28], [lx, ly, lz]);
      edges.push([idx, idx + 1]);
    });
  } else if (modelType === 'pioneer') {
    // 2.74m Parabolic Dish
    addRing(vertices, edges, faces, 0, 0.1, 0.15, 0.92, 18, 'z', 'rgba(226, 232, 240, 0.14)', '#E2E8F0');
    addRing(vertices, edges, faces, 0, 0.1, 0.35, 0.25, 12, 'z', 'rgba(56, 189, 248, 0.2)', '#38BDF8');
    // Feed tripod
    const tipIdx = vertices.length;
    vertices.push([0, 0.1, 0.92]);
    [0, 2.09, 4.18].forEach((a) => {
      const b = vertices.length;
      vertices.push([Math.cos(a) * 0.78, 0.1 + Math.sin(a) * 0.78, 0.15]);
      edges.push([tipIdx, b]);
    });
    // Hex equipment bus behind dish + Golden Plaque
    addBox(vertices, edges, faces, 0, -0.05, -0.18, 0.56, 0.52, 0.32, 'rgba(56, 189, 248, 0.18)', '#38BDF8');
    addBox(vertices, edges, faces, 0, -0.25, 0.4, 0.26, 0.18, 0.03, 'rgba(245, 158, 11, 0.38)', '#F59E0B');
    // Magnetometer boom (long truss) + 2 RTG booms
    addBox(vertices, edges, faces, 0.98, 0.0, -0.15, 1.35, 0.05, 0.05, 'rgba(148, 163, 184, 0.22)', '#94A3B8');
    addBox(vertices, edges, faces, -0.82, -0.15, -0.2, 1.05, 0.08, 0.14, 'rgba(224, 122, 95, 0.28)', '#E07A5F');
  }

  return { vertices, edges, faces };
}

function projectPoint(
  v: Vec3,
  yaw: number,
  pitch: number,
  zoom: number,
  cx: number,
  cy: number
): { x: number; y: number; z: number } {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  // Rotate around Y
  const x1 = v[0] * cosY - v[2] * sinY;
  const z1 = v[0] * sinY + v[2] * cosY;
  const y1 = v[1];

  // Rotate around X
  const y2 = y1 * cosP - z1 * sinP;
  const z2 = y1 * sinP + z1 * cosP;

  const camDist = 3.8;
  const scale = (camDist / (camDist - z2)) * 115 * zoom;
  return {
    x: cx + x1 * scale,
    y: cy - y2 * scale,
    z: z2,
  };
}

export const Spacecraft3D: React.FC<Spacecraft3DProps> = ({ mission }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [yaw, setYaw] = useState(0.55);
  const [pitch, setPitch] = useState(0.32);
  const [zoom, setZoom] = useState(1.0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedPinId, setSelectedPinId] = useState<string>(mission.hardwarePins[0]?.id ?? '');
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const projectedPinsRef = useRef<Array<{ pin: HardwarePin; x: number; y: number }>>([]);

  useEffect(() => {
    setSelectedPinId(mission.hardwarePins[0]?.id ?? '');
    setYaw(0.55);
    setPitch(0.32);
    setZoom(1.0);
  }, [mission.id, mission.hardwarePins]);

  const geometry = useMemo(() => buildSpacecraftGeometry(mission.modelType), [mission.modelType]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (autoRotate && !dragRef.current.active) {
        setYaw((prev) => prev + dt * 0.35);
      }
      rafId = requestAnimationFrame(render);
    };

    if (autoRotate) {
      rafId = requestAnimationFrame(render);
    }
    return () => cancelAnimationFrame(rafId);
  }, [autoRotate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(rect.width, 320);
    const h = Math.max(rect.height, 280);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2 + 8;

    // Subtle engineering reference grid underneath
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let gx = -2; gx <= 2; gx++) {
      const p1 = projectPoint([gx * 0.55, -0.68, -1.1], yaw, pitch, zoom, cx, cy);
      const p2 = projectPoint([gx * 0.55, -0.68, 1.1], yaw, pitch, zoom, cx, cy);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    for (let gz = -2; gz <= 2; gz++) {
      const p1 = projectPoint([-1.1, -0.68, gz * 0.55], yaw, pitch, zoom, cx, cy);
      const p2 = projectPoint([1.1, -0.68, gz * 0.55], yaw, pitch, zoom, cx, cy);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    const projectedVerts = geometry.vertices.map((v) =>
      projectPoint(v, yaw, pitch, zoom, cx, cy)
    );

    // Painter's algorithm sort for shaded faces
    const sortedFaces = geometry.faces
      .map((f) => {
        const avgZ =
          f.indices.reduce((acc, idx) => acc + projectedVerts[idx].z, 0) / f.indices.length;
        return { face: f, avgZ };
      })
      .sort((a, b) => a.avgZ - b.avgZ);

    sortedFaces.forEach(({ face }) => {
      ctx.beginPath();
      face.indices.forEach((idx, i) => {
        const pt = projectedVerts[idx];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.fillStyle = face.fill;
      ctx.fill();
      if (face.stroke) {
        ctx.strokeStyle = face.stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Crisp wireframe edges
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1;
    geometry.edges.forEach(([a, b]) => {
      const pa = projectedVerts[a];
      const pb = projectedVerts[b];
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    });

    // Project and draw clickable hardware pins
    const pinScreenCoords: Array<{ pin: HardwarePin; x: number; y: number }> = [];
    mission.hardwarePins.forEach((pin) => {
      const pt = projectPoint(pin.position, yaw, pitch, zoom, cx, cy);
      pinScreenCoords.push({ pin, x: pt.x, y: pt.y });
      const isSelected = pin.id === selectedPinId;

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isSelected ? 8 : 5.5, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#E07A5F' : '#38BDF8';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#070B14';
      ctx.stroke();

      // Callout tag
      ctx.font = '500 11px "IBM Plex Mono", monospace';
      const labelW = ctx.measureText(pin.shortCode).width + 12;
      const lx = pt.x + 12;
      const ly = pt.y - 10;
      ctx.fillStyle = isSelected ? 'rgba(224, 122, 95, 0.92)' : 'rgba(12, 19, 34, 0.88)';
      ctx.fillRect(lx, ly, labelW, 18);
      ctx.strokeStyle = isSelected ? '#E07A5F' : 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(lx, ly, labelW, 18);
      ctx.fillStyle = isSelected ? '#070B14' : '#E2E8F0';
      ctx.fillText(pin.shortCode, lx + 6, ly + 13);
    });
    projectedPinsRef.current = pinScreenCoords;
  }, [geometry, yaw, pitch, zoom, mission.hardwarePins, selectedPinId]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Hit-test hardware pins first
    const hit = projectedPinsRef.current.find(
      ({ x, y }) => Math.hypot(px - x, py - y) < 18
    );
    if (hit) {
      setSelectedPinId(hit.pin.id);
      return;
    }

    dragRef.current = { active: true, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;
    setYaw((prev) => prev + dx * 0.01);
    setPitch((prev) => Math.max(-1.1, Math.min(1.1, prev + dy * 0.01)));
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  const activePin =
    mission.hardwarePins.find((p) => p.id === selectedPinId) ?? mission.hardwarePins[0];

  return (
    <div className="bg-[#0C1322] border border-slate-800 rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-100">
            3D Hardware Inspector &amp; NSSDCA Dossier
          </h3>
          <p className="font-mono text-xs text-slate-400">
            {mission.nssdcaIds} · Drag to orbit · Click pins to inspect
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded whitespace-nowrap shrink-0 transition-colors"
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoRotate ? 'Pause Spin' : 'Auto Spin'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setYaw(0.55);
              setPitch(0.32);
              setZoom(1.0);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded whitespace-nowrap shrink-0 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Interactive 3D Canvas */}
        <div className="lg:col-span-7 relative bg-[#070B14] border-b lg:border-b-0 lg:border-r border-slate-800">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-[320px] sm:h-[360px] cursor-grab active:cursor-grabbing block touch-none"
          />
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <span className="font-mono text-[11px] text-slate-400 bg-[#070B14]/85 px-2 py-1 border border-slate-800 rounded">
              YAW {(yaw * 57.3).toFixed(0)}° · PITCH {(pitch * 57.3).toFixed(0)}°
            </span>
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}
                className="px-2.5 py-1 text-xs font-mono bg-[#0C1322] border border-slate-700 hover:border-[#38BDF8] text-slate-200 rounded"
              >
                -
              </button>
              <span className="font-mono text-[11px] text-slate-300 bg-[#0C1322] border border-slate-800 px-2 py-1 rounded">
                {(zoom * 100).toFixed(0)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.15).toFixed(2)))}
                className="px-2.5 py-1 text-xs font-mono bg-[#0C1322] border border-slate-700 hover:border-[#38BDF8] text-slate-200 rounded"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Right: Selected Pin Spec + Verified NSSDCA Metadata */}
        <div className="lg:col-span-5 p-4 flex flex-col justify-between gap-4">
          {/* Hardware Pin Selector */}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {mission.hardwarePins.map((pin) => {
                const active = pin.id === activePin?.id;
                return (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => setSelectedPinId(pin.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded border transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#E07A5F]/15 border-[#E07A5F] text-[#F4A28C]'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>{pin.shortCode}</span>
                  </button>
                );
              })}
            </div>

            {activePin && (
              <div className="pb-3 border-b border-slate-800">
                <div className="text-xs font-mono text-[#38BDF8] mb-0.5">
                  {activePin.subsystem}
                </div>
                <div className="text-sm font-semibold text-slate-100">{activePin.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {activePin.plainEnglishRole}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                  {activePin.description}
                </p>
                <div className="mt-2 font-mono text-xs text-[#E07A5F]">
                  {activePin.telemetryReading}
                </div>
              </div>
            )}
          </div>

          {/* Verified NSSDCA Dossier Table */}
          <dl className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex justify-between gap-3 py-1 border-b border-slate-800/70">
              <dt className="text-slate-400 shrink-0">Coordinates</dt>
              <dd className="font-mono text-slate-200 text-right">{mission.coordinates}</dd>
            </div>
            <div className="flex justify-between gap-3 py-1 border-b border-slate-800/70">
              <dt className="text-slate-400 shrink-0">Launch Vehicle</dt>
              <dd className="font-mono text-slate-200 text-right">{mission.launchVehicle}</dd>
            </div>
            <div className="flex justify-between gap-3 py-1 border-b border-slate-800/70">
              <dt className="text-slate-400 shrink-0">Launch / Event</dt>
              <dd className="font-mono text-slate-200 text-right">
                {mission.launchDate} · {mission.landingOrEventDate}
              </dd>
            </div>
            <div className="flex justify-between gap-3 py-1 border-b border-slate-800/70">
              <dt className="text-slate-400 shrink-0">Personnel</dt>
              <dd className="text-slate-200 text-right">{mission.personnel.join(' · ')}</dd>
            </div>
            <div className="py-1 border-b border-slate-800/70">
              <dt className="text-slate-400 mb-0.5">Data Collected</dt>
              <dd className="text-slate-200 leading-relaxed">{mission.dataCollected}</dd>
            </div>
            <div className="py-1">
              <dt className="text-slate-400 mb-0.5">Final Status</dt>
              <dd className="text-[#E07A5F] leading-relaxed">{mission.finalStatus}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};
