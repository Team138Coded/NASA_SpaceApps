import React, { useEffect, useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Wind,
  Zap,
  Disc,
  Radio,
  Thermometer,
  CheckCircle2,
  Compass,
  ChevronRight,
} from 'lucide-react';
import { ActId, MissionDossier } from '../types/mission';
import { EnvState } from './MarsEnvSim';
import { MissionStageVisual } from './MissionStageVisual';

interface ActSimulatorProps {
  mission: MissionDossier;
  env: EnvState;
  onChangeEnv: (next: EnvState) => void;
  simState?: Record<string, any>;
  onUpdateSimState?: (patch: Record<string, any>) => void;
  completedActs: Record<string, boolean>;
  onCompleteExperiment: (actId: ActId) => void;
  onAdvanceAct: () => void;
}

export const ActSimulator: React.FC<ActSimulatorProps> = ({
  mission,
  env,
  onChangeEnv,
  simState,
  onUpdateSimState,
  completedActs,
  onCompleteExperiment,
  onAdvanceAct,
}) => {
  const isCompleted = !!completedActs[mission.id];

  // --- Prologue State ---
  const [mastAz, setMastAz] = useState(0);
  const [mastEl, setMastEl] = useState(18);
  const [lockedStars, setLockedStars] = useState<{ aldebaran: boolean; aquilae: boolean }>({
    aldebaran: false,
    aquilae: false,
  });

  // --- Viking State ---
  const [boomReach, setBoomReach] = useState<number>(simState?.vikingBoomReach ?? 25);
  const [scoopDepth, setScoopDepth] = useState<number>(simState?.vikingScoopDepth ?? 0);
  const [hasSample, setHasSample] = useState<boolean>(simState?.vikingHasSample ?? false);
  const [lrComplete, setLrComplete] = useState<boolean>(simState?.vikingLrComplete ?? false);
  const [gcmsComplete, setGcmsComplete] = useState<boolean>(simState?.vikingGcmsComplete ?? false);
  const [faultInjected, setFaultInjected] = useState(false);

  // --- Sojourner State ---
  const [roverPos, setRoverPos] = useState<{ xNorm: number; y: number; angle: number }>(
    simState?.sojournerPos ?? { xNorm: 0.16, y: 195, angle: -0.25 }
  );
  const [timeScale, setTimeScale] = useState<1 | 10>(10);
  const [apxsProgress, setApxsProgress] = useState(0);
  const [apxsScanning, setApxsScanning] = useState(false);
  const [apxsDone, setApxsDone] = useState<boolean>(simState?.sojournerApxsDone ?? false);

  // --- Spirit & Opportunity State ---
  const [merSol, setMerSol] = useState<number>(simState?.merSol ?? 5111);
  const [dustPanelLoad, setDustPanelLoad] = useState<number>(simState?.merDustPanelLoad ?? 0.72);
  const [dustDevilAnim, setDustDevilAnim] = useState(0);
  const [ratDone, setRatDone] = useState<boolean>(simState?.merRatDone ?? false);
  const [activeMerSite, setActiveMerSite] = useState<'opportunity' | 'spirit'>('opportunity');

  // --- Phoenix & InSight State ---
  const [act4Mode, setAct4Mode] = useState<'phoenix' | 'insight'>('phoenix');
  const [trenchDepthCm, setTrenchDepthCm] = useState<number>(simState?.phoenixTrenchDepthCm ?? 0);
  const [windFilter, setWindFilter] = useState<number>(simState?.insightWindFilter ?? 15);
  const [quakeDetected, setQuakeDetected] = useState(false);

  // --- Ingenuity State ---
  const [heaterOn, setHeaterOn] = useState<boolean>(simState?.ingenuityHeaterOn ?? true);
  const [rotorRpm, setRotorRpm] = useState<number>(simState?.ingenuityRotorRpm ?? 0);
  const [flightNumber, setFlightNumber] = useState<1 | 49 | 72>(1);
  const [flightStatus, setFlightStatus] = useState<'grounded' | 'flying' | 'landed' | 'strike'>('grounded');
  const [flightProgress, setFlightProgress] = useState(0);

  // --- Pioneer State ---
  const [dsnFreqOffset, setDsnFreqOffset] = useState<number>(simState?.pioneerFreqOffset ?? 14.5);
  const [dsnGain, setDsnGain] = useState<number>(simState?.pioneerDsnGain ?? 55);
  const [signalLocked, setSignalLocked] = useState<boolean>(simState?.pioneerSignalLocked ?? false);
  const [plaqueRegion, setPlaqueRegion] = useState<'hydrogen' | 'pulsars' | 'humans' | 'trajectory'>('pulsars');

  // --- In-Scene Discovery Handoff & Typewriter Dialogue ---
  const [handoffTriggered, setHandoffTriggered] = useState(false);
  const [autoPanCancelled, setAutoPanCancelled] = useState(false);
  const [bubble1Len, setBubble1Len] = useState(0);
  const [bubble2Len, setBubble2Len] = useState(0);

  useEffect(() => {
    setFaultInjected(false);
    setFlightStatus('grounded');
    setFlightProgress(0);
    setHandoffTriggered(false);
    setAutoPanCancelled(false);
    setBubble1Len(0);
    setBubble2Len(0);
  }, [mission.id]);

  // Persist key stage state snapshots back to Supabase session_progress
  useEffect(() => {
    if (!onUpdateSimState) return;
    onUpdateSimState({
      merSol,
      merDustPanelLoad: dustPanelLoad,
      merRatDone: ratDone,
      vikingBoomReach: boomReach,
      vikingScoopDepth: scoopDepth,
      vikingHasSample: hasSample,
      vikingLrComplete: lrComplete,
      vikingGcmsComplete: gcmsComplete,
      sojournerPos: roverPos,
      sojournerApxsDone: apxsDone,
      phoenixTrenchDepthCm: trenchDepthCm,
      insightWindFilter: windFilter,
      ingenuityHeaterOn: heaterOn,
      ingenuityRotorRpm: rotorRpm,
      pioneerFreqOffset: dsnFreqOffset,
      pioneerDsnGain: dsnGain,
      pioneerSignalLocked: signalLocked,
    });
  }, [
    merSol,
    dustPanelLoad,
    ratDone,
    boomReach,
    scoopDepth,
    hasSample,
    lrComplete,
    gcmsComplete,
    roverPos,
    apxsDone,
    trenchDepthCm,
    windFilter,
    heaterOn,
    rotorRpm,
    dsnFreqOffset,
    dsnGain,
    signalLocked,
    onUpdateSimState,
  ]);

  // Trigger discovery handoff dialogue when stage objective is completed
  useEffect(() => {
    if (isCompleted && !handoffTriggered && mission.id !== 'epilogue') {
      setHandoffTriggered(true);
      setBubble1Len(0);
      setBubble2Len(0);
    }
  }, [isCompleted, handoffTriggered, mission.id]);

  // Typewriter progression for on-viewport radio bubbles + optional smooth auto-pan
  useEffect(() => {
    if (!handoffTriggered) return;
    const line1 = mission.discoveryHandoff.senderLine;
    const line2 = mission.discoveryHandoff.receiverLine;

    const timer = window.setInterval(() => {
      setBubble1Len((prev1) => {
        if (prev1 < line1.length) {
          return Math.min(line1.length, prev1 + 3);
        }
        setBubble2Len((prev2) => Math.min(line2.length, prev2 + 3));
        return prev1;
      });
    }, 30);

    return () => window.clearInterval(timer);
  }, [handoffTriggered, mission.discoveryHandoff.senderLine, mission.discoveryHandoff.receiverLine]);

  useEffect(() => {
    if (!handoffTriggered || autoPanCancelled) return;
    const line2Done = bubble2Len >= mission.discoveryHandoff.receiverLine.length;
    if (!line2Done) return;

    const panTimer = window.setTimeout(() => {
      onAdvanceAct();
    }, 4500);

    return () => window.clearTimeout(panTimer);
  }, [
    handoffTriggered,
    autoPanCancelled,
    bubble2Len,
    mission.discoveryHandoff.receiverLine.length,
    onAdvanceAct,
  ]);

  // Prologue star-lock check
  useEffect(() => {
    if (mission.id !== 'prologue') return;
    const hitAld = Math.hypot(mastAz - -24, mastEl - 36) < 7;
    const hitAqu = Math.hypot(mastAz - 26, mastEl - 28) < 7;
    if (hitAld || hitAqu) {
      setLockedStars((prev) => {
        const next = {
          aldebaran: prev.aldebaran || hitAld,
          aquilae: prev.aquilae || hitAqu,
        };
        if (next.aldebaran && next.aquilae) {
          onCompleteExperiment('prologue');
        }
        return next;
      });
    }
  }, [mastAz, mastEl, mission.id, onCompleteExperiment]);

  // Sojourner APXS timer
  useEffect(() => {
    if (!apxsScanning) return;
    const interval = window.setInterval(() => {
      setApxsProgress((p) => {
        if (p + 10 >= 100) {
          setApxsScanning(false);
          setApxsDone(true);
          onCompleteExperiment('sojourner');
          return 100;
        }
        return p + 10;
      });
    }, 180);
    return () => window.clearInterval(interval);
  }, [apxsScanning, onCompleteExperiment]);

  // MER Dust Devil animation & completion when both dust gust & RAT ran
  useEffect(() => {
    if (dustDevilAnim <= 0) return;
    const id = window.setTimeout(() => setDustDevilAnim((d) => Math.max(0, d - 1)), 80);
    return () => window.clearTimeout(id);
  }, [dustDevilAnim]);

  useEffect(() => {
    if (mission.id === 'mer' && dustPanelLoad <= 0.15 && ratDone) {
      onCompleteExperiment('mer');
    }
  }, [mission.id, dustPanelLoad, ratDone, onCompleteExperiment]);

  // Phoenix & InSight completion
  useEffect(() => {
    if (mission.id !== 'phoenix_insight') return;
    if (windFilter >= 75) {
      setQuakeDetected(true);
    }
    if (trenchDepthCm >= 5 && windFilter >= 75) {
      onCompleteExperiment('phoenix_insight');
    }
  }, [trenchDepthCm, windFilter, mission.id, onCompleteExperiment]);

  // Ingenuity flight animation
  useEffect(() => {
    if (flightStatus !== 'flying') return;
    const id = window.setInterval(() => {
      setFlightProgress((p) => {
        if (p + 4 >= 100) {
          setFlightStatus(flightNumber === 72 ? 'strike' : 'landed');
          onCompleteExperiment('ingenuity');
          return 100;
        }
        return p + 4;
      });
    }, 80);
    return () => window.clearInterval(id);
  }, [flightStatus, flightNumber, onCompleteExperiment]);

  // Pioneer signal lock check
  useEffect(() => {
    if (mission.id !== 'pioneer') return;
    if (Math.abs(dsnFreqOffset) <= 1.2 && dsnGain >= 82) {
      setSignalLocked(true);
      onCompleteExperiment('pioneer');
    }
  }, [dsnFreqOffset, dsnGain, mission.id, onCompleteExperiment]);

  useEffect(() => {
    if (mission.id === 'epilogue') {
      onCompleteExperiment('epilogue');
    }
  }, [mission.id, onCompleteExperiment]);

  const getWhatsHappeningSentence = (): string => {
    switch (mission.id) {
      case 'prologue':
        if (lockedStars.aldebaran && lockedStars.aquilae) {
          return 'Both Aldebaran and Lambda Aquilae are locked in VALI’s Camera Mast—standby signal reaching Mars!';
        }
        if (lockedStars.aldebaran) {
          return 'Aldebaran (65 light-years away) is locked; now pan VALI’s Camera Mast right toward Lambda Aquilae.';
        }
        if (lockedStars.aquilae) {
          return 'Lambda Aquilae is locked; now pan VALI’s Camera Mast left toward Aldebaran.';
        }
        return `VALI’s Camera Mast is aimed at azimuth ${mastAz}°, elevation ${mastEl}°—aim the crosshair onto both stars through the glass.`;

      case 'mer':
        if (dustDevilAnim > 0) {
          return 'Swirling Martian wind lines are sweeping red dust off Opportunity’s solar wings and brightening sunbeams across Meridiani Planum!';
        }
        if (ratDone && dustPanelLoad <= 0.15) {
          return 'Solar panels are clear and sparkling blue hematite "blueberries" inside the rock confirm Mars once held liquid water!';
        }
        if (ratDone) {
          return 'Sparkling hematite "blueberries" uncovered! Now trigger a Martian wind gust to clear dust off the solar wings.';
        }
        if (dustPanelLoad <= 0.15) {
          return 'Dust cleared and sunlight restored! Now extend the Rock Grinder (RAT) to uncover mineral proof of ancient water.';
        }
        return `Dust haze (τ = ${env.dustTau.toFixed(1)}) dims the sky over Opportunity—trigger a wind gust and grind the rock below.`;

      case 'viking':
        if (faultInjected) {
          return 'A November 11, 1982 command typo just tilted Viking’s Earth Radio Dish away from home—silencing contact while the lander stays healthy.';
        }
        if (lrComplete && gcmsComplete) {
          return 'The Life-Test Oven detected gas while the Organic Analyzer found zero carbon—proving reactive Martian soil mimics life without microbes.';
        }
        if (hasSample) {
          return 'Chryse soil is loaded inside Viking’s scoop—run both the Life-Test Oven (LR) and Organic Analyzer (GCMS).';
        }
        return `Viking’s Soil Scoop Arm is at ${boomReach}% reach—click Scoop Chryse Soil to collect a sample.`;

      case 'sojourner': {
        const dist = Math.hypot(roverPos.xNorm * 880 - 115, roverPos.y + 32 - 238);
        if (apxsDone) {
          return 'The 10-hour APXS scan proved Yogi Rock is silica-rich rock shaped by ancient catastrophic Mars floods!';
        }
        if (apxsScanning) {
          return `Sojourner’s APXS Rock Scanner is measuring Yogi Rock’s chemistry (${apxsProgress}% complete).`;
        }
        if (dist > 440) {
          return 'Sojourner drove outside Pathfinder’s radio circle—steer closer to the triangle base station.';
        }
        return 'Sojourner’s 5 red laser hazard beams sweep ahead at 1 cm/s—drive to Yogi Rock and run the APXS Rock Scanner.';
      }

      case 'phoenix_insight':
        if (act4Mode === 'phoenix') {
          return trenchDepthCm >= 5
            ? 'At 5 cm down, Phoenix exposed gleaming frozen water ice—sublimating straight into vapor! Now switch to InSight’s Quake Detector.'
            : `Phoenix’s digging arm is at ${trenchDepthCm.toFixed(1)} cm—dig down to 5.0 cm to uncover buried polar water ice.`;
        }
        return windFilter >= 75
          ? 'Wind rumble cleared! InSight’s SEIS detector reveals the P-wave and S-wave of a Magnitude 4.7 Marsquake echoing off a 1,830 km liquid iron core.'
          : `Wind noise shakes the seismometer (${windFilter}% filtered)—raise the Wind Filter to 75%+ to isolate the Marsquake.`;

      case 'ingenuity':
        if (flightStatus === 'strike') {
          return 'On Flight 72, smooth sand dunes at Valinor Hills tricked the downward camera—tipping a rotor blade on landing.';
        }
        if (flightStatus === 'landed') {
          return `Flight #${flightNumber} landed safely in Jezero Crater after spinning carbon blades at ${rotorRpm} RPM in 1% Earth air!`;
        }
        if (flightStatus === 'flying') {
          return `Ingenuity is airborne across Jezero Crater (${flightProgress}% complete), tracking surface ripples at 30 frames/sec.`;
        }
        if (!heaterOn) {
          return 'Battery heaters are off—at -80°C nights, lithium batteries are too cold for safe takeoff.';
        }
        return rotorRpm >= 2450
          ? `Coaxial blades are spooled to ${rotorRpm} RPM—press Launch Flight #${flightNumber} to fly.`
          : `Keep heaters on and spool the blades to 2,537 RPM before launching Flight #${flightNumber}.`;

      case 'pioneer':
        if (signalLocked) {
          return 'Goldstone’s 70m dish locked onto Pioneer 10’s 8-watt whisper—revealing the Golden Plaque pointed toward Aldebaran and Lambda Aquilae!';
        }
        return `Signal is drifting ${dsnFreqOffset.toFixed(1)} kHz off target—set Doppler Offset near 0.0 kHz and Gain to 82+ dB.`;

      case 'epilogue':
        return 'Sunrise illuminates Pasadena’s High Bay 1: every pioneer’s story is archived inside VALI, who is ready for launch.';
    }
  };

  const typedLine1 = mission.discoveryHandoff.senderLine.slice(0, bubble1Len);
  const typedLine2 = mission.discoveryHandoff.receiverLine.slice(0, bubble2Len);

  return (
    <section className="bg-[#0C1322] border border-slate-800 rounded-lg overflow-hidden">
      {/* 1. Top Mission Objective Banner (Plain-English Goal + Live Checkmark) */}
      <div
        className={`px-4 sm:px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
          isCompleted
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : 'bg-[#0F1B31] border-slate-800'
        }`}
      >
        <div className="flex items-start gap-3 max-w-4xl">
          <div className="mt-0.5 shrink-0">
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E07A5F] mt-1.5" />
            )}
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#38BDF8]">
              {isCompleted ? 'Objective Complete' : 'Current Objective'} ·{' '}
              {mission.timelineHeader}
            </div>
            <p className="text-sm font-medium text-slate-100 leading-snug mt-0.5">
              {mission.objectiveText}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAdvanceAct}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#E07A5F] hover:bg-[#ea8c73] text-[#070B14] rounded transition-colors whitespace-nowrap shrink-0"
        >
          <span>
            {mission.id === 'prologue'
              ? 'Enter Overnight Standby'
              : mission.id === 'epilogue'
              ? 'Restart From Cleanroom'
              : `Next: ${mission.discoveryHandoff.targetName}`}
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Rover POV Narrative Strip */}
      <div className="px-4 sm:px-5 py-3 border-b border-slate-800 bg-[#0A101D]">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <h2 className="font-display text-lg sm:text-xl font-semibold text-slate-100">
            {mission.title}
          </h2>
          <span className="font-mono text-xs text-slate-400">
            {mission.coordinates}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
          {mission.povStory}
        </p>
      </div>

      {/* 3. Interactive SVG Viewport + In-Scene Typewriter Comms Bubbles */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="relative border border-slate-800 rounded overflow-hidden bg-[#060A14]">
          {/* Real-Time In-Scene Rover-to-Rover Comms Bubbles (Upper Corners) */}
          {handoffTriggered && (
            <div className="absolute top-2.5 left-2.5 right-2.5 z-10 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pointer-events-none">
              {/* Upper-Left Bubble: Active Spacecraft */}
              <div className="bg-[#070B14]/92 border border-[#38BDF8]/60 rounded px-3 py-2 shadow-lg backdrop-blur-sm">
                <div className="font-mono text-[10.5px] text-[#38BDF8] mb-0.5">
                  {mission.discoveryHandoff.senderName} · Radio Transmission
                </div>
                <p className="text-xs text-slate-100 leading-relaxed">
                  {typedLine1}
                </p>
              </div>

              {/* Upper-Right Bubble: Detected Next Spacecraft */}
              {bubble2Len > 0 && (
                <div className="bg-[#070B14]/92 border border-[#E07A5F]/70 rounded px-3 py-2 shadow-lg backdrop-blur-sm">
                  <div className="font-mono text-[10.5px] text-[#F4A28C] mb-0.5">
                    {mission.discoveryHandoff.receiverName} · Signal Locked ({mission.discoveryHandoff.targetCoords})
                  </div>
                  <p className="text-xs text-slate-100 leading-relaxed">
                    {typedLine2}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Ambient Opening Signal Tag before Handoff */}
          {!handoffTriggered && (
            <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none max-w-md bg-[#070B14]/85 border border-slate-700/80 rounded px-3 py-1.5">
              <div className="font-mono text-[10.5px] text-[#38BDF8]">
                {mission.shortName} · Live Telemetry Feed
              </div>
              <div className="text-xs text-slate-200">
                Complete the objective below to detect the next distant explorer on the horizon.
              </div>
            </div>
          )}

          {/* Handoff Camera Pan Action Bar inside bottom of viewport */}
          {handoffTriggered && bubble2Len >= mission.discoveryHandoff.receiverLine.length && (
            <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-2 bg-[#070B14]/95 border border-[#38BDF8]/50 rounded px-3 py-1.5">
              <span className="font-mono text-[11px] text-slate-300">
                {autoPanCancelled ? 'Auto-pan paused' : 'Panning across terrain...'}
              </span>
              {!autoPanCancelled && (
                <button
                  type="button"
                  onClick={() => setAutoPanCancelled(true)}
                  className="px-2 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-700 rounded"
                >
                  Stay Here
                </button>
              )}
              <button
                type="button"
                onClick={onAdvanceAct}
                className="px-3 py-1 text-xs font-semibold bg-[#38BDF8] hover:bg-sky-300 text-[#070B14] rounded"
              >
                Follow Signal to {mission.discoveryHandoff.targetName} →
              </button>
            </div>
          )}

          <MissionStageVisual
            mission={mission}
            env={env}
            handoffActive={handoffTriggered}
            mastAz={mastAz}
            mastEl={mastEl}
            lockedStars={lockedStars}
            boomReach={boomReach}
            scoopDepth={scoopDepth}
            hasSample={hasSample}
            lrComplete={lrComplete}
            gcmsComplete={gcmsComplete}
            faultInjected={faultInjected}
            roverPos={roverPos}
            apxsProgress={apxsProgress}
            apxsDone={apxsDone}
            merSol={merSol}
            dustPanelLoad={dustPanelLoad}
            dustDevilAnim={dustDevilAnim}
            ratDone={ratDone}
            activeMerSite={activeMerSite}
            act4Mode={act4Mode}
            trenchDepthCm={trenchDepthCm}
            windFilter={windFilter}
            heaterOn={heaterOn}
            rotorRpm={rotorRpm}
            flightNumber={flightNumber}
            flightStatus={flightStatus}
            flightProgress={flightProgress}
            dsnFreqOffset={dsnFreqOffset}
            dsnGain={dsnGain}
            signalLocked={signalLocked}
            plaqueRegion={plaqueRegion}
            onSelectPlaqueRegion={setPlaqueRegion}
          />
        </div>

        {/* Live 1-Sentence Plain-English Cause-and-Effect Box */}
        <div className="bg-[#070B14] border border-[#38BDF8]/30 rounded p-3.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#38BDF8] mb-0.5">
            What’s Happening Inside the Scene
          </div>
          <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
            {getWhatsHappeningSentence()}
          </p>
        </div>

        {/* Interactive Mission Controls */}
        {mission.id === 'prologue' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-center">
            <div>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-slate-200 font-medium">Camera Mast Turn (Left/Right)</span>
                <span className="font-mono text-slate-200">{mastAz}°</span>
              </div>
              <input
                type="range"
                min={-55}
                max={55}
                value={mastAz}
                onChange={(e) => setMastAz(Number(e.target.value))}
                className="telemetry-slider"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-slate-200 font-medium">Camera Mast Tilt (Up/Down)</span>
                <span className="font-mono text-slate-200">{mastEl}°</span>
              </div>
              <input
                type="range"
                min={5}
                max={55}
                value={mastEl}
                onChange={(e) => setMastEl(Number(e.target.value))}
                className="telemetry-slider"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setMastAz(-24);
                  setMastEl(36);
                }}
                className="px-3 py-2 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded"
              >
                Aim at Aldebaran
              </button>
              <button
                type="button"
                onClick={() => {
                  setMastAz(26);
                  setMastEl(28);
                }}
                className="px-3 py-2 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded"
              >
                Aim at Lambda Aquilae
              </button>
            </div>
          </div>
        )}

        {mission.id === 'mer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-5 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-200 font-medium">
                  Martian Day Timeline (90-Day Goal → 5,111 Days)
                </span>
                <span className="font-mono text-[#38BDF8]">Sol {merSol}</span>
              </div>
              <input
                type="range"
                min={1}
                max={5111}
                value={merSol}
                onChange={(e) => {
                  const s = Number(e.target.value);
                  setMerSol(s);
                  if (s >= 5090) {
                    onChangeEnv({ ...env, dustTau: 10.8 });
                    setDustPanelLoad(0.95);
                  } else if (s > 1200) {
                    setDustPanelLoad(0.45);
                  }
                }}
                className="telemetry-slider"
              />
            </div>

            <div className="lg:col-span-7 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDustDevilAnim(18);
                  setDustPanelLoad(0.06);
                  onChangeEnv({ ...env, dustTau: 0.55 });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/50 text-[#38BDF8] rounded"
              >
                <Wind className="w-3.5 h-3.5" />
                Trigger Martian Wind Gust
              </button>
              <button
                type="button"
                onClick={() => setRatDone(true)}
                title="Motorized diamond grinder that cleans fresh rock"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-[#E07A5F]/20 hover:bg-[#E07A5F]/30 border border-[#E07A5F]/50 text-[#F4A28C] rounded"
              >
                <Disc className="w-3.5 h-3.5" />
                Extend Rock Grinder (RAT)
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveMerSite((s) => (s === 'opportunity' ? 'spirit' : 'opportunity'))
                }
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded"
              >
                Rover: {activeMerSite === 'opportunity' ? 'Opportunity (Blueberries)' : 'Spirit (Silica)'}
              </button>
            </div>
          </div>
        )}

        {mission.id === 'viking' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-200">Soil Arm Reach</span>
                  <span className="font-mono">{boomReach}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={boomReach}
                  onChange={(e) => setBoomReach(Number(e.target.value))}
                  className="telemetry-slider"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-200">Digging Depth</span>
                  <span className="font-mono">{scoopDepth}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={scoopDepth}
                  onChange={(e) => setScoopDepth(Number(e.target.value))}
                  className="telemetry-slider amber"
                />
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setBoomReach(78);
                  setScoopDepth(88);
                  setHasSample(true);
                }}
                className="px-3 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 rounded"
              >
                Scoop Chryse Soil
              </button>
              <button
                type="button"
                disabled={!hasSample}
                onClick={() => {
                  setLrComplete(true);
                  if (gcmsComplete) onCompleteExperiment('viking');
                }}
                className="px-3 py-2 text-xs font-medium bg-[#E07A5F]/20 hover:bg-[#E07A5F]/30 disabled:opacity-40 border border-[#E07A5F]/50 text-[#F4A28C] rounded"
              >
                Run Life-Test Oven (LR)
              </button>
              <button
                type="button"
                disabled={!hasSample}
                onClick={() => {
                  setGcmsComplete(true);
                  if (lrComplete) onCompleteExperiment('viking');
                }}
                className="px-3 py-2 text-xs font-medium bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 disabled:opacity-40 border border-[#38BDF8]/50 text-[#38BDF8] rounded"
              >
                Run Organic Analyzer (GCMS)
              </button>
              <button
                type="button"
                onClick={() => setFaultInjected((v) => !v)}
                className="px-3 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-rose-500/40 text-rose-300 rounded"
              >
                {faultInjected ? 'Reset 1982 Dish' : 'Simulate 1982 Dish Typo'}
              </button>
            </div>
          </div>
        )}

        {mission.id === 'sojourner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setRoverPos((p) => ({
                    ...p,
                    xNorm: Math.max(
                      0.06,
                      Math.min(
                        0.92,
                        p.xNorm + Math.cos(p.angle) * (timeScale === 10 ? 0.045 : 0.008)
                      )
                    ),
                    y: Math.max(
                      40,
                      Math.min(
                        265,
                        p.y + Math.sin(p.angle) * (timeScale === 10 ? 28 : 5)
                      )
                    ),
                  }))
                }
                className="inline-flex items-center gap-1 px-3 py-2 text-xs bg-[#38BDF8] text-[#070B14] font-semibold rounded"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                Drive (1 cm/s)
              </button>
              <button
                type="button"
                onClick={() => setRoverPos((p) => ({ ...p, angle: p.angle - 0.3 }))}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Turn Left
              </button>
              <button
                type="button"
                onClick={() => setRoverPos((p) => ({ ...p, angle: p.angle + 0.3 }))}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Turn Right
              </button>
              <button
                type="button"
                onClick={() => setTimeScale((t) => (t === 1 ? 10 : 1))}
                className="px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300 rounded"
              >
                Speed: {timeScale}x
              </button>
            </div>

            <div className="lg:col-span-7 flex flex-wrap items-center justify-between gap-3 bg-[#070B14] border border-slate-800 rounded p-3">
              <div>
                <div className="text-xs font-medium text-slate-200">
                  APXS Rock Chemical Scanner
                </div>
                <div className="text-[11px] text-slate-400">
                  Measures minerals inside Yogi Rock
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRoverPos({ xNorm: 0.72, y: 138, angle: 0 })}
                  className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded"
                >
                  Drive to Yogi Rock
                </button>
                <button
                  type="button"
                  disabled={apxsScanning}
                  onClick={() => {
                    setApxsProgress(0);
                    setApxsScanning(true);
                  }}
                  className="px-3 py-1.5 text-xs bg-[#E07A5F] text-[#070B14] font-semibold rounded disabled:opacity-50"
                >
                  Run 10h APXS Scan
                </button>
              </div>
            </div>
          </div>
        )}

        {mission.id === 'phoenix_insight' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAct4Mode('phoenix')}
                className={`px-3 py-1.5 text-xs font-medium rounded border ${
                  act4Mode === 'phoenix'
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8]'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                Phoenix Polar Ice Scoop (68.22°N)
              </button>
              <button
                type="button"
                onClick={() => setAct4Mode('insight')}
                className={`px-3 py-1.5 text-xs font-medium rounded border ${
                  act4Mode === 'insight'
                    ? 'bg-[#E07A5F]/15 border-[#E07A5F] text-[#F4A28C]'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                InSight Quake Detector / Seismometer (4.50°N)
              </button>
            </div>

            {act4Mode === 'phoenix' ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-60">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-200">Soil Digging Depth</span>
                    <span className="font-mono">{trenchDepthCm.toFixed(1)} cm</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={6}
                    step={0.5}
                    value={trenchDepthCm}
                    onChange={(e) => setTrenchDepthCm(Number(e.target.value))}
                    className="telemetry-slider"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setTrenchDepthCm(5.0)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-[#38BDF8] text-[#070B14] font-semibold rounded"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  Dig 5 cm to Buried Ice
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-72">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-200">Wind-Noise Filter (Clears Gust Shaking)</span>
                    <span className="font-mono">{windFilter}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={windFilter}
                    onChange={(e) => setWindFilter(Number(e.target.value))}
                    className="telemetry-slider amber"
                  />
                </div>
                <span className="font-mono text-xs text-slate-300">
                  {quakeDetected
                    ? 'Core Radius Measured: ~1,830 km Liquid Iron'
                    : 'Raise filter to 75%+ to spot the Marsquake'}
                </span>
              </div>
            )}
          </div>
        )}

        {mission.id === 'ingenuity' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-5">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-200">Rotor Blade Speed (Needs 2,537 RPM for Lift)</span>
                <span className="font-mono text-[#38BDF8]">{rotorRpm} RPM</span>
              </div>
              <input
                type="range"
                min={0}
                max={2700}
                step={10}
                value={rotorRpm}
                onChange={(e) => setRotorRpm(Number(e.target.value))}
                className="telemetry-slider"
              />
            </div>

            <div className="lg:col-span-7 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setHeaterOn((h) => !h)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded border ${
                  heaterOn
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5" />
                Battery Heaters: {heaterOn ? 'On (-80°C Safe)' : 'Off'}
              </button>
              <button
                type="button"
                onClick={() => setRotorRpm(2537)}
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded"
              >
                Spool to 2,537 RPM
              </button>
              <button
                type="button"
                onClick={() =>
                  setFlightNumber((f) => (f === 1 ? 49 : f === 49 ? 72 : 1))
                }
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded"
              >
                Flight #{flightNumber} ({flightNumber === 72 ? 'Valinor Hills' : 'Rocky Plain'})
              </button>
              <button
                type="button"
                disabled={!heaterOn || rotorRpm < 2450 || flightStatus === 'flying'}
                onClick={() => {
                  setFlightProgress(0);
                  setFlightStatus('flying');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-[#E07A5F] text-[#070B14] font-semibold rounded disabled:opacity-40"
              >
                <Zap className="w-3.5 h-3.5" />
                Launch Flight #{flightNumber}
              </button>
            </div>
          </div>
        )}

        {mission.id === 'pioneer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-5 space-y-3 bg-[#070B14] border border-slate-800 rounded p-3.5">
              <div className="font-mono text-xs text-[#38BDF8] inline-flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                <span>Goldstone 70m Deep Space Dish Tuning</span>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-200">Radio Frequency Drift (Aim for 0.0 kHz)</span>
                  <span className="font-mono">{dsnFreqOffset.toFixed(1)} kHz</span>
                </div>
                <input
                  type="range"
                  min={-20}
                  max={20}
                  step={0.5}
                  value={dsnFreqOffset}
                  onChange={(e) => setDsnFreqOffset(Number(e.target.value))}
                  className="telemetry-slider amber"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-200">Dish Amplifier Gain (Needs 82+ dB)</span>
                  <span className="font-mono">{dsnGain} dB</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={dsnGain}
                  onChange={(e) => setDsnGain(Number(e.target.value))}
                  className="telemetry-slider"
                />
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#070B14] border border-amber-500/30 rounded p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span className="font-mono text-xs text-amber-300 inline-flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  Golden Plaque Decoder (Click Plaque or Buttons)
                </span>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ['hydrogen', 'Hydrogen Clock'],
                      ['pulsars', '14-Pulsar Map'],
                      ['humans', 'Human Scale'],
                      ['trajectory', 'Escape Path'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPlaqueRegion(key)}
                      className={`px-2 py-1 text-[11px] font-mono rounded border ${
                        plaqueRegion === key
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {plaqueRegion === 'hydrogen' &&
                  'Two hydrogen atoms flipping spin give a universal 21 cm ruler and frequency clock that any intelligent civilization in the galaxy can read.'}
                {plaqueRegion === 'pulsars' &&
                  'Fourteen starburst lines point from Earth’s Sun to bright spinning neutron stars (pulsars)—creating a cosmic GPS address for home.'}
                {plaqueRegion === 'humans' &&
                  'Silhouettes of two humans stand beside Pioneer’s 2.74-meter radio dish to show how tall Earth’s builders are.'}
                {plaqueRegion === 'trajectory' &&
                  'Planets along the bottom show Pioneer flying past the 5th planet (Jupiter) onto an endless escape path toward Aldebaran and Lambda Aquilae.'}
              </p>
            </div>
          </div>
        )}

        {mission.id === 'epilogue' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {[
              {
                name: 'Spirit & Opportunity',
                place: '2004–2018 · Gusev & Meridiani',
                note: '45.16 km marathon · Water blueberries & silica',
              },
              {
                name: 'Viking 1 & 2',
                place: '1976 · Chryse & Utopia',
                note: 'First long-term Mars weather & soil biology labs',
              },
              {
                name: 'Sojourner',
                place: '1997 · Ares Vallis',
                note: 'Microwave-sized pioneer proving wheeled driving on Mars',
              },
              {
                name: 'Phoenix & InSight',
                place: '2008–2022 · Polar Ice & Elysium',
                note: 'Touched buried water ice & measured Mars’s liquid core',
              },
              {
                name: 'Ingenuity',
                place: '2021–2024 · Jezero Crater',
                note: '72 powered helicopter flights in 1% Earth air',
              },
              {
                name: 'Pioneer 10 & 11',
                place: '1972+ · Deep Space',
                note: 'Coasting toward Aldebaran & Lambda Aquilae',
              },
            ].map((item) => (
              <div
                key={item.name}
                className="bg-[#070B14] border border-slate-800 rounded p-3"
              >
                <div className="text-xs font-mono text-[#38BDF8]">{item.place}</div>
                <div className="text-sm font-semibold text-slate-100 mt-0.5">
                  {item.name}
                </div>
                <div className="text-xs text-slate-400 mt-1">{item.note}</div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
          <span className="font-mono text-[#E07A5F] mr-2">Mission Outcome:</span>
          {mission.narrativeEnding}
        </div>
      </div>
    </section>
  );
};
