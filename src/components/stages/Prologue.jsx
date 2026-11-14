import { useState, useRef, useEffect } from "react";

/*
  Sol Zero - Prologue (VALI, JPL High Bay 1, Pasadena)
  Props follow the SRD contract: { stageId, simState, onUpdateSimState, onCompleteObjective }
  onCompleteObjective(stageId) is called exactly once, after the radio pulse ends.
  Physics rule (SRD section 4): Mast Azimuth/Elevation slider + Standby toggle.
  Standby triggers a 1.5 s radio carrier pulse.
*/

const PULSE_MS = 1500;
const AZ_MIN = -60;
const AZ_MAX = 60;
const EL_MIN = 0;
const EL_MAX = 60;
const LOCK_TOLERANCE_DEG = 7;

// The two bright stars outside the cleanroom glass (angles in degrees)
const STAR_A = { az: 24, el: 32 };
const STAR_B = { az: 31, el: 36 };
const TARGET = { az: (STAR_A.az + STAR_B.az) / 2, el: (STAR_A.el + STAR_B.el) / 2 };

// Fixed background stars so the sky never changes between renders
const BG_STARS = [
  [110, 70, 1.2], [180, 130, 1], [240, 60, 1.4], [300, 150, 1], [350, 90, 1.2],
  [420, 55, 1], [470, 130, 1.3], [520, 80, 1], [620, 60, 1.2], [680, 120, 1],
  [140, 210, 1], [260, 240, 1.2], [380, 220, 1], [450, 250, 1], [610, 230, 1.3],
  [700, 200, 1], [90, 280, 1], [330, 290, 1.1], [560, 285, 1], [660, 270, 1.2],
];

const toX = (az) => 400 + az * 5.6;
const toY = (el) => 330 - el * 4.6;

export default function Prologue({
  stageId = "prologue",
  simState,
  onUpdateSimState,
  onCompleteObjective,
}) {
  const [az, setAz] = useState(simState?.mastAzimuth ?? 0);
  const [el, setEl] = useState(simState?.mastElevation ?? 18);
  const [phase, setPhase] = useState(
    simState?.prologuePhase === "linked" ? "linked" : "idle"
  );
  const [pulseProgress, setPulseProgress] = useState(0);

  const completedRef = useRef(simState?.prologuePhase === "linked");
  const pulseRafRef = useRef(null);

  const distTarget = Math.hypot(az - TARGET.az, el - TARGET.el);
  const lockedStarA = Math.hypot(az - STAR_A.az, el - STAR_A.el) <= LOCK_TOLERANCE_DEG + 1.5;
  const lockedStarB = Math.hypot(az - STAR_B.az, el - STAR_B.el) <= LOCK_TOLERANCE_DEG + 1.5;
  const starsLocked = distTarget <= LOCK_TOLERANCE_DEG;

  useEffect(() => {
    return () => {
      if (pulseRafRef.current) cancelAnimationFrame(pulseRafRef.current);
    };
  }, []);

  const handleAzChange = (nextAz) => {
    setAz(nextAz);
    onUpdateSimState?.({ mastAzimuth: nextAz });
  };

  const handleElChange = (nextEl) => {
    setEl(nextEl);
    onUpdateSimState?.({ mastElevation: nextEl });
  };

  const triggerStandbyPulse = () => {
    if (phase === "sending" || phase === "linked") return;
    setPhase("sending");
    onUpdateSimState?.({ prologuePhase: "sending" });

    const start = performance.now();
    const step = (now) => {
      const ratio = Math.min(1, (now - start) / PULSE_MS);
      setPulseProgress(ratio);

      if (ratio < 1) {
        pulseRafRef.current = requestAnimationFrame(step);
        return;
      }

      setPhase("linked");
      onUpdateSimState?.({ prologuePhase: "linked" });
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteObjective?.(stageId);
      }
    };

    pulseRafRef.current = requestAnimationFrame(step);
  };

  const aimX = toX(az);
  const aimY = toY(el);
  const starAX = toX(STAR_A.az);
  const starAY = toY(STAR_A.el);
  const starBX = toX(STAR_B.az);
  const starBY = toY(STAR_B.el);
  const mastTipX = 400 + (az / AZ_MAX) * 24;
  const mastTipY = 304 - (el / EL_MAX) * 14;

  return (
    <div className="space-y-4">
      {/* Cleanroom Window & Night Sky Viewport */}
      <div className="relative border border-slate-800 rounded overflow-hidden bg-[#060A14]">
        <svg
          viewBox="0 0 800 430"
          className="w-full h-auto block"
          role="img"
          aria-label="VALI inside JPL High Bay 1 cleanroom looking through the night glass at Aldebaran and Lambda Aquilae"
        >
          <defs>
            <linearGradient id="hb1Sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#03060E" />
              <stop offset="70%" stopColor="#0A1428" />
              <stop offset="100%" stopColor="#13223D" />
            </linearGradient>
            <linearGradient id="glassReflect" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Night sky outside cleanroom window */}
          <rect x="0" y="0" width="800" height="330" fill="url(#hb1Sky)" />

          {/* San Gabriel ridge silhouette */}
          <path
            d="M0 330 L0 296 Q110 264 230 288 T460 278 T670 290 L800 274 L800 330 Z"
            fill="#070E1C"
          />

          {/* Fixed background starfield */}
          {BG_STARS.map(([sx, sy, sr], idx) => (
            <circle
              key={idx}
              cx={sx}
              cy={sy}
              r={sr}
              fill="#CBD5E1"
              opacity={0.72}
            />
          ))}

          {/* Star A: Aldebaran */}
          <circle
            cx={starAX}
            cy={starAY}
            r={lockedStarA ? 6.5 : 4.5}
            fill="#FDBA74"
          />
          <circle
            cx={starAX}
            cy={starAY}
            r={16}
            fill="none"
            stroke={lockedStarA ? "#34D399" : "#FDBA74"}
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          <text
            x={starAX - 92}
            y={starAY - 14}
            fill="#FDBA74"
            fontSize="10.5"
            fontFamily="IBM Plex Mono, monospace"
          >
            Aldebaran (Pioneer 10)
          </text>

          {/* Star B: Lambda Aquilae */}
          <circle
            cx={starBX}
            cy={starBY}
            r={lockedStarB ? 6.5 : 4.5}
            fill="#93C5FD"
          />
          <circle
            cx={starBX}
            cy={starBY}
            r={16}
            fill="none"
            stroke={lockedStarB ? "#34D399" : "#93C5FD"}
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          <text
            x={starBX + 18}
            y={starBY + 4}
            fill="#93C5FD"
            fontSize="10.5"
            fontFamily="IBM Plex Mono, monospace"
          >
            Lambda Aquilae (Pioneer 11)
          </text>

          {/* Cleanroom glass framing & subtle sheen */}
          <rect x="0" y="0" width="800" height="14" fill="#0F172A" />
          {[200, 400, 600].map((mx) => (
            <rect key={mx} x={mx - 3} y="0" width="6" height="330" fill="#1E293B" opacity="0.85" />
          ))}
          <polygon points="80,14 270,330 560,330 340,14" fill="url(#glassReflect)" />

          {/* Cleanroom floor */}
          <rect x="0" y="330" width="800" height="100" fill="#0A101D" />
          <line x1="0" y1="330" x2="800" y2="330" stroke="#334155" strokeWidth="1.5" />

          {/* Sightline & Camera Mast Reticle */}
          <line
            x1={mastTipX}
            y1={mastTipY}
            x2={aimX}
            y2={aimY}
            stroke={starsLocked ? "#34D399" : "#38BDF8"}
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.7"
          />
          <circle
            cx={aimX}
            cy={aimY}
            r={starsLocked ? 22 : 17}
            fill="none"
            stroke={starsLocked ? "#34D399" : "#38BDF8"}
            strokeWidth="1.6"
          />
          <line
            x1={aimX - 26}
            y1={aimY}
            x2={aimX + 26}
            y2={aimY}
            stroke={starsLocked ? "#34D399" : "#38BDF8"}
            strokeWidth="1"
          />
          <line
            x1={aimX}
            y1={aimY - 26}
            x2={aimX}
            y2={aimY + 26}
            stroke={starsLocked ? "#34D399" : "#38BDF8"}
            strokeWidth="1"
          />

          {/* 1.5 s Radio Carrier Pulse when Standby is triggered */}
          {phase === "sending" && (
            <g transform={`translate(${mastTipX}, ${mastTipY})`}>
              <circle
                r={16 + pulseProgress * 110}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2"
                opacity={1 - pulseProgress}
              />
              <circle
                r={10 + pulseProgress * 72}
                fill="none"
                stroke="#E07A5F"
                strokeWidth="1.5"
                opacity={1 - pulseProgress * 0.85}
              />
            </g>
          )}

          {/* VALI Rover in High Bay 1 */}
          <g transform="translate(400, 344)">
            <ellipse cx="0" cy="40" rx="84" ry="8" fill="#04070E" opacity="0.72" />
            <path
              d="M-54,10 L-32,-8 L0,6 L34,-8 L56,10"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {[-56, 0, 56].map((wx) => (
              <g key={wx} transform={`translate(${wx}, 20)`}>
                <circle r="15" fill="#1E293B" stroke="#64748B" strokeWidth="3" />
                <circle r="6" fill="#38BDF8" opacity="0.75" />
              </g>
            ))}
            <rect
              x="-46"
              y="-26"
              width="92"
              height="32"
              rx="4"
              fill="#1E293B"
              stroke="#38BDF8"
              strokeWidth="1.5"
            />
            <rect x="-38" y="-20" width="76" height="18" rx="2" fill="#D97706" opacity="0.32" />
            <rect
              x="-74"
              y="-22"
              width="26"
              height="20"
              rx="2"
              fill="#334155"
              stroke="#E07A5F"
              strokeWidth="1.2"
            />
            <line
              x1="10"
              y1="-26"
              x2={mastTipX - 400}
              y2={mastTipY - 344}
              stroke="#CBD5E1"
              strokeWidth="5"
            />
            <g transform={`translate(${mastTipX - 400}, ${mastTipY - 344})`}>
              <rect
                x="-18"
                y="-11"
                width="36"
                height="20"
                rx="3"
                fill="#0F172A"
                stroke={starsLocked ? "#34D399" : "#38BDF8"}
                strokeWidth="1.8"
              />
              <circle cx="-7" cy="-1" r="5" fill="#020617" stroke="#38BDF8" strokeWidth="1.4" />
              <circle cx="7" cy="-1" r="5" fill="#020617" stroke="#38BDF8" strokeWidth="1.4" />
              <circle cx="-6" cy="-2" r="2" fill="#7DD3FC" />
              <circle cx="8" cy="-2" r="2" fill="#7DD3FC" />
            </g>
          </g>

          {/* Bottom telemetry bar */}
          <text
            x="20"
            y="414"
            fill="#94A3B8"
            fontSize="11"
            fontFamily="IBM Plex Mono, monospace"
          >
            {phase === "linked"
              ? "CARRIER LOCKED · MERIDIANI PLANUM SIGNAL DETECTED"
              : phase === "sending"
              ? `TRANSMITTING STANDBY CARRIER PULSE (${Math.round(pulseProgress * 100)}%)`
              : `MAST AZIMUTH ${az}° · ELEVATION ${el}° · ${starsLocked ? "BOTH STARS LOCKED" : "AIM RETICLE AT TARGET STARS"}`}
          </text>
        </svg>
      </div>

      {/* Live Cause-and-Effect Explanation */}
      <div className="bg-[#070B14] border border-[#38BDF8]/30 rounded p-3.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#38BDF8] mb-0.5">
          What’s Happening Inside the Scene
        </div>
        <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
          {phase === "linked"
            ? "Overnight standby carrier pulse completed! VALI picked up Opportunity’s faint storm-dimmed beacon from Meridiani Planum."
            : phase === "sending"
            ? "VALI’s high-gain antenna is sweeping the Deep Space Network archive carrier for legacy Mars signals..."
            : starsLocked
            ? "Both Aldebaran and Lambda Aquilae are inside VALI’s camera mast lock ring—turn on Overnight Standby to begin listening."
            : `VALI’s Camera Mast is aimed at azimuth ${az}°, elevation ${el}°. Move the sliders toward +27° Azimuth and +34° Elevation to frame both stars.`}
        </p>
      </div>

      {/* Mast Azimuth / Elevation Sliders + Overnight Standby Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-200 font-medium">Mast Azimuth (Left / Right)</span>
            <span className="font-mono text-slate-200">{az}°</span>
          </div>
          <input
            type="range"
            min={AZ_MIN}
            max={AZ_MAX}
            value={az}
            onChange={(e) => handleAzChange(Number(e.target.value))}
            className="telemetry-slider"
          />
        </div>

        <div className="md:col-span-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-200 font-medium">Mast Elevation (Up / Down)</span>
            <span className="font-mono text-slate-200">{el}°</span>
          </div>
          <input
            type="range"
            min={EL_MIN}
            max={EL_MAX}
            value={el}
            onChange={(e) => handleElChange(Number(e.target.value))}
            className="telemetry-slider"
          />
        </div>

        <div className="md:col-span-4 flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              handleAzChange(Math.round(TARGET.az));
              handleElChange(Math.round(TARGET.el));
            }}
            className="px-3 py-2 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded"
          >
            Align Both Stars
          </button>

          <button
            type="button"
            disabled={!starsLocked || phase === "sending" || phase === "linked"}
            onClick={triggerStandbyPulse}
            className={`px-4 py-2 text-xs font-semibold rounded transition-colors ${
              phase === "linked"
                ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300"
                : starsLocked
                ? "bg-[#38BDF8] hover:bg-sky-300 text-[#070B14]"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            {phase === "linked"
              ? "Overnight Standby Active"
              : phase === "sending"
              ? "Sending Carrier Pulse..."
              : "Engage Overnight Standby"}
          </button>
        </div>
      </div>
    </div>
  );
}
