import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronRight, Lock, Music, Pause, Play,
  RotateCcw, Star, Volume2, VolumeX, Map as MapIcon, Radio, Gauge, Timer, Wind, Satellite, LayoutDashboard,
} from 'lucide-react';
import App from '../App';
import { getMissionById } from '../data/missionsData';
import { MissionDossier } from '../types/mission';
import { audio } from './audio';
import { Game, GameEvent, HudState } from './engine';
import { LEVELS, LevelDef } from './levels';

type Screen = 'title' | 'map' | 'briefing' | 'play' | 'debrief' | 'fail' | 'finale' | 'console';

interface Save {
  unlocked: number;
  stars: Record<string, number>;
}

const SAVE_KEY = 'quiet-vigil-save-v1';
function loadSave(): Save {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage blocked: play without saves */
  }
  return { unlocked: 0, stars: {} };
}
function writeSave(s: Save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

const mission = (l: LevelDef) => getMissionById(l.id) as MissionDossier;
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const isTouch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

const VEHICLE_NAME: Record<LevelDef['vehicle'], string> = {
  rover: 'Rover',
  arm: 'Robotic arm',
  heli: 'Rotorcraft',
  probe: 'Deep-space probe',
};

// ---------- shared bits ----------
function Btn({
  children, onClick, variant = 'primary', className = '', autoFocus,
}: { children: React.ReactNode; onClick: () => void; variant?: 'primary' | 'ghost'; className?: string; autoFocus?: boolean }) {
  return (
    <button
      type="button"
      autoFocus={autoFocus}
      onMouseEnter={() => audio.sfxPlay('hover')}
      onClick={() => {
        audio.unlock();
        audio.sfxPlay('select');
        onClick();
      }}
      className={`qv-btn ${variant === 'primary' ? 'qv-btn-primary' : 'qv-btn-ghost'} ${className}`}
    >
      {children}
    </button>
  );
}

function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-1" aria-label={`${n} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <Star key={i} width={size} height={size} className={i < n ? 'fill-[#f6c76b] text-[#f6c76b]' : 'text-white/20'} />
      ))}
    </span>
  );
}

function AudioToggles({ muted, setMuted }: { muted: boolean; setMuted: (m: boolean) => void }) {
  const [musicOn, setMusicOn] = useState(audio.musicOn);
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="qv-icon"
        aria-label={musicOn ? 'Turn music off' : 'Turn music on'}
        onClick={() => {
          audio.unlock();
          audio.setMusic(!musicOn);
          setMusicOn(!musicOn);
        }}
      >
        <Music className={`w-4 h-4 ${musicOn ? '' : 'opacity-40'}`} />
      </button>
      <button
        type="button"
        className="qv-icon"
        aria-label={muted ? 'Unmute' : 'Mute'}
        onClick={() => {
          audio.unlock();
          setMuted(!muted);
        }}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ---------- canvas host ----------
function GameCanvas({
  level, demo, paused, onEvent, gameRef,
}: {
  level: LevelDef;
  demo?: boolean;
  paused?: boolean;
  onEvent?: (e: GameEvent) => void;
  gameRef?: React.MutableRefObject<Game | null>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const evRef = useRef(onEvent);
  evRef.current = onEvent;
  const localGame = useRef<Game | null>(null);

  useEffect(() => {
    const g = new Game(ref.current!, level, { demo, onEvent: (e) => evRef.current?.(e) });
    localGame.current = g;
    if (gameRef) gameRef.current = g;
    return () => {
      g.destroy();
      if (gameRef) gameRef.current = null;
    };
  }, [level, demo, gameRef]);

  useEffect(() => {
    localGame.current?.setPaused(!!paused);
  }, [paused]);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full block" aria-label={`${level.name} game view`} />;
}

// ---------- screens ----------
function TitleScreen({ save, onStart, onConsole, muted, setMuted }: { save: Save; onStart: () => void; onConsole: () => void; muted: boolean; setMuted: (m: boolean) => void }) {
  const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
  return (
    <div className="absolute inset-0">
      <GameCanvas level={LEVELS[1]} demo />
      <div className="absolute inset-0 bg-gradient-to-r from-[#070B14]/95 via-[#070B14]/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-transparent to-[#070B14]/40" />
      <div className="absolute top-5 right-5 z-10">
        <AudioToggles muted={muted} setMuted={setMuted} />
      </div>
      <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-14 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
          <p className="qv-kicker mb-5">NASA Mission Archive · 1972 – 2024</p>
          <h1 className="font-display font-bold leading-[0.9] tracking-tight text-[clamp(3rem,9vw,7.5rem)] text-white">
            The Quiet
            <br />
            <span className="qv-title-glow">Vigil</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
            Take the controls of seven real NASA explorers — rovers, landers, a helicopter and a deep-space probe — and relive
            the hours that made them legends.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Btn onClick={onStart} autoFocus>
              <Play className="w-4 h-4 fill-current" />
              {save.unlocked > 0 ? 'Continue the vigil' : 'Begin the vigil'}
            </Btn>
            <Btn variant="ghost" onClick={onConsole}>
              <LayoutDashboard className="w-4 h-4" />
              Mission console
            </Btn>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs text-slate-400">
            <span>7 missions</span>
            <span>{total} / 21 stars</span>
            <span>Press Enter to start</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MapScreen({ save, onPick, onBack, onFinale, muted, setMuted }: { save: Save; onPick: (i: number) => void; onBack: () => void; onFinale: () => void; muted: boolean; setMuted: (m: boolean) => void }) {
  const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
  const allDone = save.unlocked >= LEVELS.length;
  return (
    <div className="absolute inset-0 overflow-y-auto qv-space">
      <div className="qv-planet" aria-hidden />
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-8 min-h-full flex flex-col">
        <header className="flex items-center justify-between gap-4">
          <button type="button" onClick={onBack} className="font-display text-lg font-semibold text-white hover:text-[#ffb08a] transition-colors">
            The Quiet Vigil
          </button>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-slate-300 hidden sm:inline-flex items-center gap-2">
              <Star className="w-3.5 h-3.5 fill-[#f6c76b] text-[#f6c76b]" /> {total} / 21
            </span>
            <AudioToggles muted={muted} setMuted={setMuted} />
          </div>
        </header>

        <div className="mt-10 sm:mt-14">
          <p className="qv-kicker">Mission log</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mt-2">Choose your explorer</h2>
          <p className="text-slate-400 mt-3 max-w-xl">Each mission unlocks the next. Earn stars by finishing fast and keeping your power above half.</p>
        </div>

        <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
          {LEVELS.map((l, i) => {
            const locked = i > save.unlocked;
            const stars = save.stars[l.id] ?? 0;
            return (
              <motion.li key={l.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.5 }}>
                <button
                  type="button"
                  disabled={locked}
                  onMouseEnter={() => !locked && audio.sfxPlay('hover')}
                  onClick={() => {
                    audio.sfxPlay('select');
                    onPick(i);
                  }}
                  className={`qv-card w-full text-left h-full ${locked ? 'opacity-45 cursor-not-allowed' : ''} ${i === save.unlocked && !allDone ? 'qv-card-next' : ''}`}
                >
                  <div className={`qv-card-art qv-art-${l.scene}`}>
                    <span className="font-display text-5xl font-bold text-white/90">{l.code}</span>
                    {locked && <Lock className="absolute top-3 right-3 w-4 h-4 text-white/70" />}
                    {stars > 0 && <span className="absolute top-3 right-3"><Stars n={stars} size={13} /></span>}
                  </div>
                  <div className="p-4">
                    <div className="font-mono text-[11px] uppercase tracking-wider text-[#8fe3ff]">{VEHICLE_NAME[l.vehicle]} · {l.year}</div>
                    <div className="font-display text-xl font-semibold text-white mt-1">{l.name}</div>
                    <div className="text-sm text-slate-400 mt-1">{mission(l).shortName} — {l.place}</div>
                  </div>
                </button>
              </motion.li>
            );
          })}
          <motion.li initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
            <button
              type="button"
              disabled={!allDone}
              onClick={() => {
                audio.sfxPlay('select');
                onFinale();
              }}
              className={`qv-card w-full text-left h-full ${allDone ? 'qv-card-next' : 'opacity-45 cursor-not-allowed'}`}
            >
              <div className="qv-card-art qv-art-dawn">
                <span className="font-display text-5xl font-bold text-white/90">07</span>
                {!allDone && <Lock className="absolute top-3 right-3 w-4 h-4 text-white/70" />}
              </div>
              <div className="p-4">
                <div className="font-mono text-[11px] uppercase tracking-wider text-[#8fe3ff]">Finale · Dawn</div>
                <div className="font-display text-xl font-semibold text-white mt-1">The Reunion</div>
                <div className="text-sm text-slate-400 mt-1">VALI wakes in Pasadena</div>
              </div>
            </button>
          </motion.li>
        </ol>
      </div>
    </div>
  );
}

function BriefingScreen({ level, onLaunch, onBack }: { level: LevelDef; onLaunch: () => void; onBack: () => void }) {
  const m = mission(level);
  return (
    <div className="absolute inset-0 overflow-y-auto qv-space">
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-8 min-h-full flex flex-col justify-center">
        <button type="button" onClick={onBack} className="self-start inline-flex items-center gap-2 font-mono text-xs text-slate-400 hover:text-white mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Mission log
        </button>
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <p className="qv-kicker">Mission {level.code} · {m.timelineHeader}</p>
            <h2 className="font-display text-4xl sm:text-6xl font-bold text-white mt-3 leading-[0.95]">{level.name}</h2>
            <p className="font-mono text-sm text-[#ffb08a] mt-3">{m.coordinates}</p>
            <blockquote className="mt-6 text-lg text-slate-200 leading-relaxed border-l-2 border-[#e8875f] pl-5">{m.povStory}</blockquote>
            <div className="mt-8">
              <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-3">Objectives</h3>
              <ol className="space-y-2">
                {level.objectives.map((o, i) => (
                  <li key={i} className="flex gap-3 text-slate-200">
                    <span className="font-mono text-xs text-[#8fe3ff] mt-1 w-5">{String(i + 1).padStart(2, '0')}</span>
                    <span>{o.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
          <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="qv-panel p-6">
            <div className={`qv-card-art qv-art-${level.scene} rounded-lg !h-28 mb-5`}>
              <span className="font-display text-2xl font-bold text-white">{m.shortName}</span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {[
                ['Vehicle', VEHICLE_NAME[level.vehicle]],
                ['Mass', m.massKg],
                ['Launch', m.launchDate],
                ['Power', m.baseline.powerSource],
                ['Gravity', `${m.baseline.gravityMs2} m/s²`],
                ['Air', `${m.baseline.pressureMbar} mbar`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{k}</dt>
                  <dd className="text-slate-200 leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 pt-5 border-t border-white/10">
              <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-2">Controls</h3>
              <ul className="space-y-1 text-sm text-slate-300">
                {level.controls.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
            <Btn onClick={onLaunch} className="w-full mt-6 justify-center" autoFocus>
              Launch mission <ChevronRight className="w-4 h-4" />
            </Btn>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

function TouchPad({ game, level }: { game: React.MutableRefObject<Game | null>; level: LevelDef }) {
  const bind = (k: keyof Game['keys']) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      game.current?.setKey(k, true);
    },
    onPointerUp: () => game.current?.setKey(k, false),
    onPointerCancel: () => game.current?.setKey(k, false),
  });
  const vertical = level.vehicle !== 'rover';
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 p-4 flex items-end justify-between pointer-events-none select-none">
      <div className="grid grid-cols-3 gap-2 pointer-events-auto">
        {vertical ? <button type="button" aria-label="Up" className="qv-pad col-start-2" {...bind('up')}><ArrowUp /></button> : <span />}
        <button type="button" aria-label="Left" className="qv-pad col-start-1 row-start-2" {...bind('left')}><ArrowLeft /></button>
        {vertical && level.vehicle !== 'heli' && <button type="button" aria-label="Down" className="qv-pad col-start-2 row-start-2" {...bind('down')}><ArrowDown /></button>}
        <button type="button" aria-label="Right" className="qv-pad col-start-3 row-start-2" {...bind('right')}><ArrowRight /></button>
      </div>
      <button type="button" aria-label="Use instrument" className="qv-pad qv-pad-action pointer-events-auto" {...bind('action')}>E</button>
    </div>
  );
}

function Hud({ level, hud, onPause, toast }: { level: LevelDef; hud: HudState | null; onPause: () => void; toast: { label: string; fact: string; key: number } | null }) {
  const m = mission(level);
  if (!hud) return null;
  const pct = Math.round(hud.resource);
  const low = pct < 25;
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* objectives */}
      <div className="absolute top-4 left-4 qv-panel p-4 w-[min(320px,calc(100vw-2rem))] hidden sm:block">
        <div className="font-mono text-[11px] uppercase tracking-wider text-[#8fe3ff]">Mission {level.code} · {m.shortName}</div>
        <div className="font-display text-lg font-semibold text-white leading-tight">{level.name}</div>
        <ol className="mt-3 space-y-1.5">
          {level.objectives.map((o, i) => {
            const done = hud.done[i];
            const cur = i === hud.objIndex;
            return (
              <li key={i} className={`flex gap-2 text-[13px] leading-snug ${done ? 'text-emerald-300/80' : cur ? 'text-white' : 'text-slate-500'}`}>
                <span className={`mt-0.5 w-4 h-4 shrink-0 rounded-full border flex items-center justify-center ${done ? 'bg-emerald-400/20 border-emerald-400' : cur ? 'border-[#8fe3ff] qv-pulse' : 'border-slate-600'}`}>
                  {done && <Check className="w-2.5 h-2.5" />}
                </span>
                <span className={done ? 'line-through decoration-emerald-400/40' : ''}>{o.label}</span>
              </li>
            );
          })}
        </ol>
      </div>
      {/* mobile objective */}
      <div className="absolute top-3 left-3 right-28 sm:hidden qv-panel px-3 py-2 text-[13px] text-white">
        {level.objectives[Math.min(hud.objIndex, level.objectives.length - 1)].label}
      </div>

      {/* progress track */}
      {level.vehicle !== 'arm' && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-[min(420px,40vw)] hidden md:block">
          <div className="relative h-1.5 rounded-full bg-white/10">
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#e8875f] to-[#ffc59a]" style={{ width: `${hud.progress * 100}%` }} />
            {hud.markers.map((mk, i) => (
              <span key={i} className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 ${hud.done[i] ? 'bg-emerald-400' : i === hud.objIndex ? 'bg-[#8fe3ff] qv-pulse' : 'bg-slate-500'}`} style={{ left: `${mk * 100}%` }} />
            ))}
            <span className="absolute -top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" style={{ left: `${hud.progress * 100}%` }} />
          </div>
        </div>
      )}

      {/* gauges */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex flex-col items-end gap-2">
        <div className="flex gap-2 pointer-events-auto">
          <button type="button" className="qv-icon" aria-label="Pause" onClick={onPause}><Pause className="w-4 h-4" /></button>
        </div>
        <div className={`qv-panel px-4 py-3 w-[200px] hidden sm:block ${low ? 'qv-danger' : ''}`}>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">{hud.resourceLabel}</span>
            <span className={`font-mono text-lg font-semibold ${low ? 'text-[#ff8a7a]' : 'text-white'}`}>{pct}%</span>
          </div>
          <div className="mt-2 flex gap-[3px]">
            {Array.from({ length: 20 }, (_, i) => (
              <span key={i} className={`h-2.5 flex-1 rounded-[1px] ${i < pct / 5 ? (low ? 'bg-[#ff6b5b]' : pct < 50 ? 'bg-[#f6c76b]' : 'bg-[#5fe0b0]') : 'bg-white/10'}`} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-y-1.5 font-mono text-[12px] text-slate-300">
            <span className="inline-flex items-center gap-1.5"><Timer className="w-3 h-3 text-slate-500" />{fmtTime(hud.time)}</span>
            {level.vehicle === 'heli' ? (
              <>
                <span className="inline-flex items-center gap-1.5"><ArrowUp className="w-3 h-3 text-slate-500" />{hud.altitude.toFixed(1)} m</span>
                <span className={`inline-flex items-center gap-1.5 col-span-2 ${hud.vspeed > 3.4 ? 'text-[#ff8a7a]' : ''}`}><Gauge className="w-3 h-3 text-slate-500" />descent {Math.max(0, hud.vspeed).toFixed(1)} m/s</span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5"><Gauge className="w-3 h-3 text-slate-500" />{(hud.speed / 30).toFixed(1)} {level.vehicle === 'probe' ? 'km/s' : 'cm/s'}</span>
            )}
            {level.dustDevils ? (
              <>
                <span className="inline-flex items-center gap-1.5"><Wind className="w-3 h-3 text-slate-500" />τ {hud.tau.toFixed(1)}</span>
                <span className="inline-flex items-center gap-1.5">dust {Math.round(hud.panelDust * 100)}%</span>
              </>
            ) : null}
            {level.tether ? <span className="inline-flex items-center gap-1.5 col-span-2"><Radio className="w-3 h-3 text-slate-500" />UHF link {Math.round(hud.signal * 100)}%</span> : null}
            {level.vehicle === 'probe' ? <span className="inline-flex items-center gap-1.5"><Satellite className="w-3 h-3 text-slate-500" />{(hud.progress * 82).toFixed(1)} AU</span> : null}
          </div>
        </div>
        {/* compact mobile gauge */}
        <div className={`sm:hidden qv-panel px-3 py-1.5 font-mono text-xs ${low ? 'text-[#ff8a7a]' : 'text-white'}`}>{hud.resourceLabel} {pct}%</div>
      </div>

      {/* warning */}
      <AnimatePresence>
        {hud.warning && (
          <motion.div key={hud.warning} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-16 sm:top-14 left-1/2 -translate-x-1/2 qv-warn">
            {hud.warning}
          </motion.div>
        )}
      </AnimatePresence>

      {/* interaction prompt */}
      <AnimatePresence>
        {hud.prompt && (
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-28 sm:bottom-10 left-1/2 -translate-x-1/2 qv-panel px-5 py-3 flex items-center gap-4">
            <span className="relative w-11 h-11 shrink-0">
              <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
                <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                <circle cx="22" cy="22" r="19" fill="none" stroke="#8fe3ff" strokeWidth="3" strokeDasharray={119.4} strokeDashoffset={119.4 * (1 - hud.prompt.progress)} strokeLinecap="round" />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center font-display font-bold ${hud.prompt.ready ? 'text-white' : 'text-slate-500'}`}>E</span>
            </span>
            <span>
              <span className="block font-mono text-[11px] uppercase tracking-wider text-[#8fe3ff]">{hud.prompt.ready ? `Hold — ${hud.prompt.verb}` : hud.prompt.hint ?? hud.prompt.verb}</span>
              <span className="block text-sm text-white max-w-[260px]">{hud.prompt.label}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* discovery toast */}
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.key} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ type: 'spring', damping: 22 }} className="absolute bottom-44 sm:bottom-6 left-4 qv-panel qv-toast p-4 w-[min(360px,calc(100vw-2rem))]">
            <div className="font-mono text-[11px] uppercase tracking-wider text-emerald-300 flex items-center gap-1.5"><Check className="w-3 h-3" /> Discovery logged</div>
            <div className="font-display font-semibold text-white mt-1">{toast.label}</div>
            <p className="text-[13px] text-slate-300 mt-1.5 leading-relaxed">{toast.fact}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PauseMenu({ onResume, onRestart, onQuit, muted, setMuted }: { onResume: () => void; onRestart: () => void; onQuit: () => void; muted: boolean; setMuted: (m: boolean) => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-30 bg-[#070B14]/70 backdrop-blur-md flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Paused">
      <div className="qv-panel p-8 w-full max-w-sm text-center">
        <p className="qv-kicker">Standby</p>
        <h2 className="font-display text-4xl font-bold text-white mt-2">Paused</h2>
        <div className="mt-7 flex flex-col gap-3">
          <Btn onClick={onResume} autoFocus className="justify-center"><Play className="w-4 h-4 fill-current" />Resume</Btn>
          <Btn variant="ghost" onClick={onRestart} className="justify-center"><RotateCcw className="w-4 h-4" />Restart mission</Btn>
          <Btn variant="ghost" onClick={onQuit} className="justify-center"><MapIcon className="w-4 h-4" />Mission log</Btn>
        </div>
        <div className="mt-6 flex justify-center"><AudioToggles muted={muted} setMuted={setMuted} /></div>
      </div>
    </motion.div>
  );
}

function useTypewriter(text: string, start: boolean, speed = 22) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    setN(0);
    const id = window.setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          window.clearInterval(id);
          return v;
        }
        if (v % 3 === 0) audio.sfxPlay('tick');
        return v + 1;
      });
    }, speed);
    return () => window.clearInterval(id);
  }, [text, start, speed]);
  return text.slice(0, n);
}

function DebriefScreen({ level, result, onNext, onReplay, onMap }: { level: LevelDef; result: { time: number; resource: number; stars: number }; onNext: () => void; onReplay: () => void; onMap: () => void }) {
  const m = mission(level);
  const h = m.discoveryHandoff;
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setPhase(1), 1400);
    return () => window.clearTimeout(t);
  }, []);
  const line1 = useTypewriter(h.senderLine, phase >= 1);
  useEffect(() => {
    if (phase === 1 && line1.length === h.senderLine.length) {
      const t = window.setTimeout(() => setPhase(2), 500);
      return () => window.clearTimeout(t);
    }
  }, [line1, phase, h.senderLine.length]);
  const line2 = useTypewriter(h.receiverLine, phase >= 2);
  const last = level.id === 'pioneer';
  return (
    <div className="absolute inset-0 overflow-y-auto qv-space">
      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-10 min-h-full flex flex-col justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <p className="qv-kicker text-emerald-300">Mission {level.code} complete</p>
          <h2 className="font-display text-4xl sm:text-6xl font-bold text-white mt-2">{level.name}</h2>
          <div className="mt-6 flex flex-wrap items-center gap-8">
            <span className="inline-flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.4 + i * 0.25, type: 'spring', stiffness: 260, damping: 14 }} onAnimationStart={() => i < result.stars && setTimeout(() => audio.sfxPlay('select'), 400 + i * 250)}>
                  <Star className={`w-10 h-10 ${i < result.stars ? 'fill-[#f6c76b] text-[#f6c76b] drop-shadow-[0_0_14px_rgba(246,199,107,0.6)]' : 'text-white/15'}`} />
                </motion.span>
              ))}
            </span>
            <dl className="flex gap-8 font-mono text-sm">
              <div><dt className="text-slate-500 text-[11px] uppercase tracking-wider">Time</dt><dd className="text-white text-xl">{fmtTime(result.time)}</dd><dd className="text-slate-500 text-[11px]">par {fmtTime(level.par)}</dd></div>
              <div><dt className="text-slate-500 text-[11px] uppercase tracking-wider">{level.vehicle === 'probe' ? 'Hull' : 'Power'}</dt><dd className="text-white text-xl">{result.resource}%</dd><dd className="text-slate-500 text-[11px]">45% for a star</dd></div>
            </dl>
          </div>

          <div className="mt-8 qv-panel p-5 flex items-center gap-4 max-w-md">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f6c76b] to-[#e8875f] flex items-center justify-center shrink-0 shadow-[0_0_24px_rgba(246,199,107,0.4)]">
              <Star className="w-6 h-6 fill-[#070B14] text-[#070B14]" />
            </div>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#f6c76b]">Badge earned</div>
              <div className="font-display text-lg font-semibold text-white">{m.badge.title}</div>
            </div>
          </div>

          <div className="mt-8 space-y-3 max-w-3xl">
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Incoming on the archive carrier · {h.targetCoords}</p>
            {phase >= 1 && (
              <div className="qv-panel p-4">
                <div className="font-mono text-xs text-[#8fe3ff]">{h.senderName}</div>
                <p className="text-slate-100 mt-1 min-h-[1.5em]">{line1}</p>
              </div>
            )}
            {phase >= 2 && (
              <div className="qv-panel p-4 ml-6 sm:ml-12 border-[#e8875f]/40">
                <div className="font-mono text-xs text-[#ffb08a]">{h.receiverName}</div>
                <p className="text-slate-100 mt-1 min-h-[1.5em]">{line2}</p>
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Btn onClick={onNext} autoFocus>{last ? 'Watch the dawn' : `Next: ${h.targetName}`}<ChevronRight className="w-4 h-4" /></Btn>
            <Btn variant="ghost" onClick={onReplay}><RotateCcw className="w-4 h-4" />Replay for stars</Btn>
            <Btn variant="ghost" onClick={onMap}><MapIcon className="w-4 h-4" />Mission log</Btn>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FailScreen({ level, reason, onRetry, onMap }: { level: LevelDef; reason: string; onRetry: () => void; onMap: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-30 bg-[#12070a]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="qv-panel p-8 w-full max-w-md text-center">
        <p className="qv-kicker text-[#ff8a7a]">Signal lost · Mission {level.code}</p>
        <h2 className="font-display text-4xl font-bold text-white mt-2">Silence on the carrier</h2>
        <p className="text-slate-300 mt-4 leading-relaxed">{reason}</p>
        <div className="mt-7 flex flex-col gap-3">
          <Btn onClick={onRetry} autoFocus className="justify-center"><RotateCcw className="w-4 h-4" />Try again</Btn>
          <Btn variant="ghost" onClick={onMap} className="justify-center"><MapIcon className="w-4 h-4" />Mission log</Btn>
        </div>
      </div>
    </motion.div>
  );
}

function FinaleScreen({ save, onMap, onReset }: { save: Save; onMap: () => void; onReset: () => void }) {
  const ep = getMissionById('epilogue') as MissionDossier;
  const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
  return (
    <div className="absolute inset-0 overflow-y-auto qv-dawn">
      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-12 min-h-full flex flex-col justify-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
          <p className="qv-kicker">{ep.timelineHeader}</p>
          <h2 className="font-display text-5xl sm:text-7xl font-bold text-white mt-3 leading-[0.95]">Nothing we launched<br />was ever truly lost.</h2>
          <p className="mt-6 text-lg text-slate-200 max-w-2xl leading-relaxed">{ep.povStory}</p>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {LEVELS.map((l, i) => (
              <motion.div key={l.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.12 }} className="qv-panel p-3 text-center">
                <div className="font-display text-sm font-semibold text-white leading-tight">{mission(l).badge.title}</div>
                <div className="mt-2"><Stars n={save.stars[l.id] ?? 0} size={12} /></div>
              </motion.div>
            ))}
          </div>
          <p className="mt-6 font-mono text-sm text-slate-300">{total} of 21 stars</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Btn onClick={onMap} autoFocus><MapIcon className="w-4 h-4" />Mission log</Btn>
            <Btn variant="ghost" onClick={onReset}><RotateCcw className="w-4 h-4" />New vigil</Btn>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ---------- root ----------
export default function GameApp() {
  const [screen, setScreen] = useState<Screen>('title');
  const [save, setSave] = useState<Save>(loadSave);
  const [levelIdx, setLevelIdx] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [hud, setHud] = useState<HudState | null>(null);
  const [toast, setToast] = useState<{ label: string; fact: string; key: number } | null>(null);
  const [result, setResult] = useState<{ time: number; resource: number; stars: number } | null>(null);
  const [failReason, setFailReason] = useState('');
  const gameRef = useRef<Game | null>(null);
  const level = LEVELS[levelIdx];
  // new object identity per attempt so the canvas host rebuilds the world
  const levelInstance = useMemo(() => ({ ...level }), [level, attempt]);

  const setMuted = useCallback((m: boolean) => {
    audio.setMuted(m);
    setMutedState(m);
  }, []);

  useEffect(() => {
    audio.setMood(screen === 'play' ? level.mood : screen === 'finale' || screen === 'debrief' ? 'triumph' : screen === 'briefing' ? level.scene === 'space' ? 'space' : 'lab' : 'title');
  }, [screen, level]);

  // HUD polling at ~12 fps keeps React work tiny while the canvas runs at 60
  useEffect(() => {
    if (screen !== 'play') return;
    const id = window.setInterval(() => gameRef.current && setHud(gameRef.current.getHud()), 80);
    return () => window.clearInterval(id);
  }, [screen, attempt]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 6500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const startLevel = useCallback((i: number) => {
    setLevelIdx(i);
    setScreen('briefing');
  }, []);

  const launch = useCallback(() => {
    audio.unlock();
    setPaused(false);
    setToast(null);
    setHud(null);
    setAttempt((a) => a + 1);
    setScreen('play');
  }, []);

  const onEvent = useCallback(
    (e: GameEvent) => {
      if (e.type === 'pause') setPaused((p) => !p);
      if (e.type === 'objective') setToast({ label: e.obj.label, fact: e.obj.fact, key: Date.now() });
      if (e.type === 'fail') {
        setFailReason(e.reason);
        setScreen('fail');
      }
      if (e.type === 'complete') {
        setResult(e);
        setSave((s) => {
          const next: Save = {
            unlocked: Math.max(s.unlocked, levelIdx + 1),
            stars: { ...s.stars, [level.id]: Math.max(s.stars[level.id] ?? 0, e.stars) },
          };
          writeSave(next);
          return next;
        });
        setScreen('debrief');
      }
    },
    [levelIdx, level.id]
  );

  // global keys: Enter on menu screens, M to mute
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyM' && screen !== 'console') setMuted(!audio.muted);
      if (e.code === 'Enter' && screen === 'title' && document.activeElement === document.body) {
        audio.unlock();
        setScreen('map');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, setMuted]);

  if (screen === 'console') {
    return (
      <>
        <App />
        <button type="button" onClick={() => setScreen('title')} className="fixed bottom-5 left-5 z-[60] qv-btn qv-btn-primary">
          <Play className="w-4 h-4 fill-current" /> Back to the game
        </button>
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#070B14] overflow-hidden text-slate-100 select-none">
      <AnimatePresence mode="wait">
        <motion.div key={screen === 'fail' ? 'play' : screen} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
          {screen === 'title' && <TitleScreen save={save} muted={muted} setMuted={setMuted} onStart={() => setScreen('map')} onConsole={() => setScreen('console')} />}
          {screen === 'map' && (
            <MapScreen save={save} muted={muted} setMuted={setMuted} onPick={startLevel} onBack={() => setScreen('title')} onFinale={() => setScreen('finale')} />
          )}
          {screen === 'briefing' && <BriefingScreen level={level} onLaunch={launch} onBack={() => setScreen('map')} />}
          {(screen === 'play' || screen === 'fail') && (
            <div className="absolute inset-0">
              <GameCanvas key={attempt} level={levelInstance} paused={paused || screen === 'fail'} onEvent={onEvent} gameRef={gameRef} />
              <Hud level={level} hud={hud} onPause={() => setPaused(true)} toast={toast} />
              {isTouch() && screen === 'play' && <TouchPad game={gameRef} level={level} />}
              {paused && screen === 'play' && (
                <PauseMenu muted={muted} setMuted={setMuted} onResume={() => setPaused(false)} onRestart={launch} onQuit={() => { setPaused(false); setScreen('map'); }} />
              )}
              {screen === 'fail' && <FailScreen level={level} reason={failReason} onRetry={launch} onMap={() => setScreen('map')} />}
            </div>
          )}
          {screen === 'debrief' && result && (
            <DebriefScreen
              level={level}
              result={result}
              onReplay={launch}
              onMap={() => setScreen('map')}
              onNext={() => (levelIdx + 1 < LEVELS.length ? startLevel(levelIdx + 1) : setScreen('finale'))}
            />
          )}
          {screen === 'finale' && (
            <FinaleScreen
              save={save}
              onMap={() => setScreen('map')}
              onReset={() => {
                const fresh = { unlocked: 0, stars: {} };
                writeSave(fresh);
                setSave(fresh);
                setScreen('title');
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
