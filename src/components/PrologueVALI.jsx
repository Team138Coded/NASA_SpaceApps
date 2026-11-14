import { useState, useRef, useEffect } from "react";

/*
  The Quiet Vigil - Prologue (VALI, JPL High Bay 1, Pasadena)
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

export default function PrologueVALI({
  stageId = "prologue",
  simState,
  onUpdateSimState,
  onCompleteObjective,
}) {
  const [az, setAz] = useState(simState?.mastAzimuth ?? -30);
  const [el, setEl] = useState(simState?.mastElevation ?? 10);
  const [phase, setPhase] = useState(simState?.prologuePhase ?? "idle"); // idle | sending | linked
  const completedRef = useRef(phase === "linked");
  const timerRef = useRef(null);

  const distance = Math.hypot(az - TARGET.az, el - TARGET.el);
  const locked = distance <= LOCK_TOLERANCE_DEG;
  const near = !locked && distance <= 15;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const report = (patch) => {
    if (onUpdateSimState) onUpdateSimState(patch);
  };

  const handleAz = (value) => {
    if (phase !== "idle") return;
    setAz(value);
    report({ mastAzimuth: value });
  };

  const handleEl = (value) => {
    if (phase !== "idle") return;
    setEl(value);
    report({ mastElevation: value });
  };

  const handleStandby = () => {
    if (phase !== "idle" || !locked) return;
    setPhase("sending");
    report({ prologuePhase: "sending" });
    timerRef.current = setTimeout(() => {
      setPhase("linked");
      report({ prologuePhase: "linked" });
      if (!completedRef.current) {
        completedRef.current = true;
        if (onCompleteObjective) onCompleteObjective(stageId);
      }
    }, PULSE_MS);
  };

  // Plain-English "What's Happening" text
  let status;
  if (phase === "sending") {
    status =
      "Overnight Standby is on. VALI is sending a radio carrier signal through NASA's Deep Space Network.";
  } else if (phase === "linked") {
    status = "The radio link is made. VALI goes to sleep, and its dream begins.";
  } else if (locked) {
    status =
      "Both bright stars are in the centre of the camera ring. Turn on Overnight Standby to start the radio link.";
  } else if (near) {
    status = "Getting closer. Keep moving the sliders until the ring turns blue.";
  } else {
    status =
      "VALI's camera is looking at the dark sky. Move the sliders to find the two bright stars outside the window.";
  }

  const camX = toX(az);
  const camY = toY(el);
  const mastTipX = 400 + az * 1.2;
  const mastTipY = 352 - el * 0.8;

  const ringColor = locked || phase !== "idle" ? "#38BDF8" : "#E07A5F";
  const frozen = phase !== "idle";

  return (
    <section
      className="w-full max-w-4xl mx-auto text-slate-100"
      aria-label="Prologue: VALI in the JPL cleanroom"
    >
      <style>{`
        @keyframes qv-pulse { 0% { r: 8; opacity: 0.9; } 100% { r: 150; opacity: 0; } }
        .qv-ring { animation: qv-pulse ${PULSE_MS}ms ease-out forwards; }
        @media (prefers-reduced-motion: reduce) { .qv-ring { animation: none; opacity: 0.6; r: 80; } }
      `}</style>

      <div className="rounded-xl overflow-hidden border border-slate-700 bg-[#070B14]">
        <svg
          viewBox="0 0 800 450"
          className="w-full h-auto block"
          role="img"
          aria-label="VALI looks through the cleanroom window at two bright stars"
        >
          <defs>
            <linearGradient id="qv-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#02040A" />
              <stop offset="100%" stopColor="#101A33" />
            </linearGradient>
          </defs>

          {/* Cleanroom wall */}
          <rect width="800" height="450" fill="#0C1322" />

          {/* Window with night sky */}
          <rect x="60" y="30" width="680" height="300" rx="14" fill="url(#qv-sky)" stroke="#334155" strokeWidth="6" />
          {BG_STARS.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#94A3B8" opacity="0.7" />
          ))}

          {/* The two bright stars */}
          {[STAR_A, STAR_B].map((s, i) => (
            <g key={i}>
              <circle cx={toX(s.az)} cy={toY(s.el)} r={locked || phase !== "idle" ? 12 : 8} fill="#38BDF8" opacity="0.2" />
              <circle cx={toX(s.az)} cy={toY(s.el)} r="4" fill="#F8FAFC" />
            </g>
          ))}

          {/* Camera ring: where VALI's camera looks */}
          <circle cx={camX} cy={camY} r="46" fill="none" stroke={ringColor} strokeWidth="2.5" strokeDasharray={locked ? "0" : "6 5"} />
          <line x1={camX - 58} y1={camY} x2={camX - 34} y2={camY} stroke={ringColor} strokeWidth="2" />
          <line x1={camX + 34} y1={camY} x2={camX + 58} y2={camY} stroke={ringColor} strokeWidth="2" />
          <line x1={camX} y1={camY - 58} x2={camX} y2={camY - 34} stroke={ringColor} strokeWidth="2" />
          <line x1={camX} y1={camY + 34} x2={camX} y2={camY + 58} stroke={ringColor} strokeWidth="2" />
          <text x={camX} y={camY + 76} textAnchor="middle" fontSize="13" fill={ringColor}>
            {locked || phase !== "idle" ? "Stars locked" : "Camera view"}
          </text>

          {/* Floor and VALI */}
          <rect x="0" y="340" width="800" height="110" fill="#111827" />
          <line x1="0" y1="340" x2="800" y2="340" stroke="#334155" strokeWidth="2" />

          {/* Optical mast (camera pole) */}
          <line x1="400" y1="372" x2={mastTipX} y2={mastTipY} stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
          <circle cx={mastTipX} cy={mastTipY} r="11" fill="#1E293B" stroke="#E07A5F" strokeWidth="3" />
          <circle cx={mastTipX} cy={mastTipY} r="4" fill="#38BDF8" />

          {/* Rover body and wheels */}
          <rect x="330" y="372" width="140" height="38" rx="8" fill="#E07A5F" />
          <rect x="350" y="380" width="100" height="10" rx="3" fill="#7C3A2A" />
          {[345, 400, 455].map((x) => (
            <circle key={x} cx={x} cy="420" r="14" fill="#1E293B" stroke="#475569" strokeWidth="3" />
          ))}
          <text x="400" y="445" textAnchor="middle" fontSize="12" fill="#94A3B8">VALI</text>

          {/* Radio carrier pulse */}
          {phase === "sending" && (
            <g>
              <circle className="qv-ring" cx={mastTipX} cy={mastTipY} r="8" fill="none" stroke="#38BDF8" strokeWidth="3" />
              <circle className="qv-ring" cx={mastTipX} cy={mastTipY} r="8" fill="none" stroke="#38BDF8" strokeWidth="2" style={{ animationDelay: "250ms" }} />
              <circle className="qv-ring" cx={mastTipX} cy={mastTipY} r="8" fill="none" stroke="#38BDF8" strokeWidth="1.5" style={{ animationDelay: "500ms" }} />
            </g>
          )}

          <text x="76" y="56" fontSize="13" fill="#94A3B8">JPL High Bay 1, Pasadena</text>
        </svg>

        {/* Controls */}
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label htmlFor="qv-az" className="flex justify-between text-sm font-medium">
                <span>Mast left / right (azimuth)</span>
                <span className="text-[#38BDF8]">{az}°</span>
              </label>
              <p className="text-xs text-slate-400 mb-1" title="The optical mast is the camera on a pole">
                Optical mast: the camera on a pole. Azimuth is how far it turns sideways.
              </p>
              <input
                id="qv-az"
                type="range"
                min={AZ_MIN}
                max={AZ_MAX}
                step="1"
                value={az}
                disabled={frozen}
                onChange={(e) => handleAz(Number(e.target.value))}
                className="w-full accent-[#38BDF8]"
              />
            </div>

            <div>
              <label htmlFor="qv-el" className="flex justify-between text-sm font-medium">
                <span>Mast up / down (elevation)</span>
                <span className="text-[#38BDF8]">{el}°</span>
              </label>
              <p className="text-xs text-slate-400 mb-1">Elevation is how far the camera tilts up from flat.</p>
              <input
                id="qv-el"
                type="range"
                min={EL_MIN}
                max={EL_MAX}
                step="1"
                value={el}
                disabled={frozen}
                onChange={(e) => handleEl(Number(e.target.value))}
                className="w-full accent-[#38BDF8]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleStandby}
              disabled={!locked || phase !== "idle"}
              aria-pressed={phase !== "idle"}
              className={
                "w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] " +
                (phase !== "idle"
                  ? "bg-[#38BDF8] text-[#070B14]"
                  : locked
                  ? "bg-[#E07A5F] text-[#070B14] hover:bg-[#EB8F76]"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed")
              }
              title="Standby is a sleep mode. VALI sends a radio signal to NASA's Deep Space Network (DSN) while it rests."
            >
              {phase === "idle" ? "Turn on Overnight Standby" : phase === "sending" ? "Sending radio signal..." : "Standby on"}
            </button>
            {!locked && phase === "idle" && (
              <p className="text-xs text-slate-400">This button works after both stars are locked.</p>
            )}

            <div className="rounded-lg border border-slate-700 bg-[#0C1322] p-3" aria-live="polite">
              <p className="text-xs font-semibold text-slate-300 mb-1">What's happening</p>
              <p className="text-sm text-slate-200">{status}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}