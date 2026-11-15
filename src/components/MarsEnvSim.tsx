import React from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { MissionDossier } from '../types/mission';

export interface EnvState {
  dustTau: number;
  tempOffsetC: number;
  pressureOffsetMbar: number;
  heaterLoadWatts: number;
}

interface MarsEnvSimProps {
  mission: MissionDossier;
  env: EnvState;
  onChangeEnv: (next: EnvState) => void;
  onResetEnv: () => void;
}

function formatLightTime(seconds: number): string {
  if (seconds < 1) return '< 0.01 s';
  if (seconds < 120) return `${seconds.toFixed(0)} s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export const MarsEnvSim: React.FC<MarsEnvSimProps> = ({
  mission,
  env,
  onChangeEnv,
  onResetEnv,
}) => {
  const isInterstellar = mission.id === 'pioneer';
  const isEarth = mission.id === 'prologue' || mission.id === 'epilogue';
  const isSolarPowered =
    mission.id === 'sojourner' ||
    mission.id === 'mer' ||
    mission.id === 'phoenix_insight' ||
    mission.id === 'ingenuity';

  const effectivePressure = Math.max(
    0,
    +(mission.baseline.pressureMbar + env.pressureOffsetMbar).toFixed(2)
  );
  const effectiveTemp = +(mission.baseline.tempC + env.tempOffsetC).toFixed(1);
  const effectiveTau = +env.dustTau.toFixed(2);

  // Beer-Lambert attenuation for Martian solar power
  const effectivePower = isSolarPowered
    ? Math.max(
        1.2,
        +(
          mission.baseline.powerWatts *
          Math.exp(-0.42 * Math.max(0, effectiveTau - mission.baseline.dustTau))
        ).toFixed(1)
      )
    : mission.baseline.powerWatts;

  const netMarginWatts = +(effectivePower - env.heaterLoadWatts).toFixed(1);

  let powerStatusLabel = '● Healthy Power';
  let powerStatusClass = 'text-emerald-400';
  if (netMarginWatts < 0) {
    powerStatusLabel = '✖ Low Power Deficit';
    powerStatusClass = 'text-rose-400';
  } else if (netMarginWatts < 25 || (isSolarPowered && effectiveTau > 3.5)) {
    powerStatusLabel = '▲ Strained Power';
    powerStatusClass = 'text-amber-400';
  }

  const buildSensoryLog = (): string => {
    if (isInterstellar) {
      return `My plutonium battery radiates 8 watts of warmth against -270°C deep space. Each radio whisper takes ${formatLightTime(
        mission.baseline.lightTimeSeconds
      )} at the speed of light to travel 12.23 billion km back to Earth.`;
    }
    if (isEarth) {
      return mission.id === 'prologue'
        ? `Earth cleanroom air presses gently at ${effectivePressure} mbar (${effectiveTemp}°C). My Camera Mast motors hum quietly as I track two bright stars outside High Bay 1.`
        : `Morning sunshine warms the cleanroom gantry at ${effectiveTemp}°C. My power bus holds steady at ${effectivePower} W while all seven historical missions rest in my memory.`;
    }
    if (isSolarPowered && effectiveTau >= 6.0) {
      return `Heavy dust haze (opacity τ = ${effectiveTau}) blocks almost all sunlight, turning noon into dark twilight. Solar power drops to ${effectivePower} W while survival heaters need ${env.heaterLoadWatts} W to stop electronics from freezing at ${effectiveTemp}°C.`;
    }
    if (effectiveTemp <= -70) {
      return `Bitter ${effectiveTemp}°C cold settles over ${effectivePressure} mbar thin carbon-dioxide air. Internal heaters draw ${env.heaterLoadWatts} W to keep batteries and joints from cracking.`;
    }
    return `Thin ${effectivePressure} mbar CO₂ wind vibrates my mast and solar struts at ${effectiveTemp}°C. Dust haze is τ = ${effectiveTau}; ${mission.baseline.powerSource} supplies ${effectivePower} W (${netMarginWatts >= 0 ? '+' : ''}${netMarginWatts} W spare margin).`;
  };

  return (
    <section className="bg-[#0C1322] border border-slate-800 rounded-lg p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-100">
            Real-Feel Mars Environmental Simulator
          </h3>
          <p className="text-xs text-slate-400">
            {mission.baseline.locationName} · {mission.baseline.powerSource}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-mono text-xs font-medium ${powerStatusClass}`}>
            {powerStatusLabel}
          </span>
          <button
            type="button"
            onClick={onResetEnv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded whitespace-nowrap shrink-0 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Physics</span>
          </button>
        </div>
      </div>

      {/* 6 Live Physics Gauges with plain-English subtitles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-4 border-b border-slate-800">
        <div
          className="bg-[#070B14] border border-slate-800/90 rounded p-3"
          title="Air thickness on the surface; Earth sea level is 1,013 mbar"
        >
          <div className="text-xs font-medium text-slate-300">Air Pressure</div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
              {effectivePressure.toFixed(isEarth ? 1 : 2)}
            </span>
            <span className="text-[11px] font-mono text-slate-400 ml-1">mbar</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {isEarth ? 'Earth sea level' : isInterstellar ? 'Space vacuum' : '<1% of Earth air'}
          </div>
        </div>

        <div
          className="bg-[#070B14] border border-slate-800/90 rounded p-3"
          title="Outside air or space temperature around the craft"
        >
          <div className="text-xs font-medium text-slate-300">Outside Temp</div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
              {effectiveTemp.toFixed(1)}
            </span>
            <span className="text-[11px] font-mono text-slate-400 ml-1">°C</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {effectiveTemp < -40 ? 'Deep freeze' : 'Room temperature'}
          </div>
        </div>

        <div
          className="bg-[#070B14] border border-slate-800/90 rounded p-3"
          title="Atmospheric Dust Opacity (Tau): 0.5 is clear Martian sky; 10.8 is a pitch-dark global storm"
        >
          <div className="text-xs font-medium text-slate-300">Dust Haze (τ)</div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-mono font-semibold text-[#E07A5F] tabular-nums">
              {effectiveTau.toFixed(2)}
            </span>
            <span className="text-[11px] font-mono text-slate-400 ml-1">tau</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {effectiveTau >= 6 ? 'Global storm dark' : effectiveTau >= 2 ? 'Hazy sky' : 'Clear sky'}
          </div>
        </div>

        <div
          className="bg-[#070B14] border border-slate-800/90 rounded p-3"
          title="Electrical power generated right now by solar panels or nuclear battery"
        >
          <div className="text-xs font-medium text-slate-300">Power Output</div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-mono font-semibold text-[#38BDF8] tabular-nums">
              {effectivePower.toFixed(1)}
            </span>
            <span className="text-[11px] font-mono text-slate-400 ml-1">W</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {isSolarPowered ? 'Sunlight dependent' : 'Steady nuclear'}
          </div>
        </div>

        <div
          className="bg-[#070B14] border border-slate-800/90 rounded p-3"
          title="Downward pull of gravity; Mars is 38% of Earth gravity"
        >
          <div className="text-xs font-medium text-slate-300">Gravity Pull</div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
              {mission.baseline.gravityMs2.toFixed(2)}
            </span>
            <span className="text-[11px] font-mono text-slate-400 ml-1">m/s²</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {isEarth ? '100% Earth' : isInterstellar ? 'Zero-G coast' : '38% of Earth'}
          </div>
        </div>

        <div
          className="bg-[#070B14] border border-slate-800/90 rounded p-3"
          title="How long one radio message takes to travel at light speed to Earth"
        >
          <div className="text-xs font-medium text-slate-300">Radio Delay</div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
              {formatLightTime(mission.baseline.lightTimeSeconds)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">One-way to Earth</div>
        </div>
      </div>

      {/* Interactive Physics Controls + First-Person Sensory Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 items-start">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label
                htmlFor="slider-tau"
                className="text-slate-200 font-medium inline-flex items-center gap-1"
              >
                <Sliders className="w-3 h-3 text-[#E07A5F]" />
                Dust Opacity (τ)
              </label>
              <span className="font-mono text-slate-200 tabular-nums">
                {effectiveTau.toFixed(2)}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mb-1.5">
              How thick the dust haze is
            </div>
            <input
              id="slider-tau"
              type="range"
              min={isInterstellar ? 0 : 0.05}
              max={isInterstellar ? 0.05 : 10.8}
              step={0.05}
              disabled={isInterstellar}
              value={env.dustTau}
              onChange={(e) =>
                onChangeEnv({ ...env, dustTau: parseFloat(e.target.value) })
              }
              className="telemetry-slider amber disabled:opacity-40"
            />
            <div className="flex justify-between font-mono text-[10px] text-slate-500 mt-1">
              <span>Clear</span>
              <span>2018 Storm (10.8)</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label htmlFor="slider-temp" className="text-slate-200 font-medium">
                Day / Night Shift
              </label>
              <span className="font-mono text-slate-200 tabular-nums">
                {env.tempOffsetC >= 0 ? '+' : ''}
                {env.tempOffsetC.toFixed(0)} °C
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mb-1.5">
              Warm midday to freezing night
            </div>
            <input
              id="slider-temp"
              type="range"
              min={-35}
              max={35}
              step={1}
              disabled={isInterstellar}
              value={env.tempOffsetC}
              onChange={(e) =>
                onChangeEnv({ ...env, tempOffsetC: parseFloat(e.target.value) })
              }
              className="telemetry-slider disabled:opacity-40"
            />
            <div className="flex justify-between font-mono text-[10px] text-slate-500 mt-1">
              <span>Night (-35°C)</span>
              <span>Noon (+35°C)</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label htmlFor="slider-heater" className="text-slate-200 font-medium">
                Survival Heaters
              </label>
              <span className="font-mono text-slate-200 tabular-nums">
                {env.heaterLoadWatts.toFixed(0)} W
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mb-1.5">
              Power spent staying warm
            </div>
            <input
              id="slider-heater"
              type="range"
              min={5}
              max={120}
              step={5}
              value={env.heaterLoadWatts}
              onChange={(e) =>
                onChangeEnv({
                  ...env,
                  heaterLoadWatts: parseFloat(e.target.value),
                })
              }
              className="telemetry-slider"
            />
            <div className="flex justify-between font-mono text-[10px] text-slate-500 mt-1">
              <span>Low (5 W)</span>
              <span>High (120 W)</span>
            </div>
          </div>
        </div>

        {/* First-person sensory box */}
        <div className="lg:col-span-5 bg-[#070B14] border border-slate-800 rounded p-3.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
            <span>What the Spacecraft Feels Right Now</span>
            <span className="font-mono text-[#38BDF8] tabular-nums">
              {netMarginWatts >= 0 ? '+' : ''}
              {netMarginWatts} W Margin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {buildSensoryLog()}
          </p>
        </div>
      </div>
    </section>
  );
};
