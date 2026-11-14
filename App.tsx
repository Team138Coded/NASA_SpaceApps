import { useCallback, useEffect, useRef, useState } from 'react';
import { Award, CheckCircle2, ChevronRight, RotateCcw, X } from 'lucide-react';
import { ActId, ChatMessage, MissionDossier } from './types/mission';
import { MISSIONS } from './data/missionsData';
import {
  createSessionId,
  ensureSeededAndLoadMissions,
  loadSessionChats,
  loadSessionProgress,
  saveChatMessages,
  saveSessionProgress,
} from './lib/missionStore';
import { TransitionCanvas } from './components/TransitionCanvas';
import { EnvState, MarsEnvSim } from './components/MarsEnvSim';
import { Spacecraft3D } from './components/Spacecraft3D';
import { FloatingRoverChat } from './components/FloatingRoverChat';
import Prologue from './components/stages/Prologue';
import Act1 from './components/stages/Act1';
import Act2 from './components/stages/Act2';
import Act3 from './components/stages/Act3';
import Act4 from './components/stages/Act4';
import Act5 from './components/stages/Act5';
import Act6 from './components/stages/Act6';
import Epilogue from './components/stages/Epilogue';

function findMission(list: MissionDossier[], id: ActId): MissionDossier {
  return list.find((m) => m.id === id) ?? list[0];
}

function buildDefaultEnv(list: MissionDossier[], missionId: ActId): EnvState {
  const m = findMission(list, missionId);
  return {
    dustTau: m.baseline.dustTau,
    tempOffsetC: 0,
    pressureOffsetMbar: 0,
    heaterLoadWatts: m.id === 'pioneer' ? 8 : m.id === 'ingenuity' ? 21 : 35,
  };
}

export default function App() {
  const [sessionId, setSessionId] = useState<string>(() => createSessionId());
  const [missions, setMissions] = useState<MissionDossier[]>(MISSIONS);
  const [activeActId, setActiveActId] = useState<ActId>('prologue');
  const [pendingActId, setPendingActId] = useState<ActId | null>(null);
  const [completedActs, setCompletedActs] = useState<Record<string, boolean>>({});
  const [simState, setSimState] = useState<Record<string, unknown>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [env, setEnv] = useState<EnvState>(() => buildDefaultEnv(MISSIONS, 'prologue'));
  const [badgesOpen, setBadgesOpen] = useState(false);

  const hydratedRef = useRef(false);

  // Initial seed + hydrate from Supabase (falls back cleanly to verified in-memory MISSIONS)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loadedMissions = await ensureSeededAndLoadMissions();
      if (cancelled) return;
      setMissions(loadedMissions);

      const [savedProgress, savedChats] = await Promise.all([
        loadSessionProgress(sessionId),
        loadSessionChats(sessionId),
      ]);
      if (cancelled) return;

      if (savedProgress) {
        const validStage = loadedMissions.some(
          (m) => m.id === savedProgress.activeStage
        )
          ? (savedProgress.activeStage as ActId)
          : 'prologue';
        setActiveActId(validStage);
        setSimState(savedProgress.simState || {});
        setCompletedActs(savedProgress.completedObjectives || {});
        setEnv(buildDefaultEnv(loadedMissions, validStage));
      }
      if (savedChats.length > 0) {
        setMessages(savedChats);
      }
      hydratedRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Persist session progress to Supabase whenever active stage, simState, or badges change
  useEffect(() => {
    if (!hydratedRef.current) return;
    const earnedBadges = missions
      .filter((m) => !!completedActs[m.id])
      .map((m) => m.badge.id);

    const timer = window.setTimeout(() => {
      saveSessionProgress(sessionId, {
        activeStage: activeActId,
        simState,
        completedObjectives: completedActs,
        earnedBadges,
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [sessionId, activeActId, simState, completedActs, missions]);

  const activeMission = findMission(missions, activeActId);
  const pendingMission = pendingActId
    ? findMission(missions, pendingActId)
    : activeMission;

  const navigateToAct = useCallback(
    (targetId: ActId) => {
      if (targetId === activeActId) return;
      setPendingActId(targetId);
    },
    [activeActId]
  );

  const handleTransitionComplete = useCallback(() => {
    setPendingActId((currentPending) => {
      if (!currentPending) return null;
      setActiveActId(currentPending);
      setEnv(buildDefaultEnv(missions, currentPending));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return null;
    });
  }, [missions]);

  const handleUpdateSimState = useCallback((patch: Record<string, unknown>) => {
    setSimState((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleCompleteExperiment = useCallback((actId: ActId) => {
    setCompletedActs((prev) => (prev[actId] ? prev : { ...prev, [actId]: true }));
  }, []);

  const handleCompletePrologue = useCallback((stageId: string) => {
    const id = (stageId as ActId) || 'prologue';
    setCompletedActs((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
    window.setTimeout(() => {
      setPendingActId('mer');
    }, 650);
  }, []);

  const handleAdvanceAct = useCallback(() => {
    const idx = missions.findIndex((m) => m.id === activeActId);
    const next = missions[(idx + 1) % missions.length];
    navigateToAct(next.id);
  }, [activeActId, missions, navigateToAct]);

  const handleAppendMessages = useCallback(
    (newMsgs: ChatMessage[]) => {
      setMessages((prev) => [...prev, ...newMsgs]);
      saveChatMessages(sessionId, newMsgs);
    },
    [sessionId]
  );

  const handleResetProgress = () => {
    hydratedRef.current = false;
    setSessionId(createSessionId());
    setCompletedActs({});
    setSimState({});
    setMessages([]);
    setActiveActId('prologue');
    setEnv(buildDefaultEnv(missions, 'prologue'));
    setBadgesOpen(false);
  };

  const unlockedCount = Object.values(completedActs).filter(Boolean).length;
  const telemetrySummary = `Pressure ${(
    activeMission.baseline.pressureMbar + env.pressureOffsetMbar
  ).toFixed(2)} mbar, Temp ${(activeMission.baseline.tempC + env.tempOffsetC).toFixed(
    1
  )}°C, Dust Haze τ=${env.dustTau.toFixed(2)}`;

  const nextMission =
    missions[(missions.findIndex((m) => m.id === activeActId) + 1) % missions.length];

  const renderStage = () => {
    if (activeActId === 'prologue') {
      const prologueDone = !!completedActs.prologue;
      return (
        <section className="bg-[#0C1322] border border-slate-800 rounded-lg overflow-hidden">
          <div
            className={`px-4 sm:px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
              prologueDone
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-[#0F1B31] border-slate-800'
            }`}
          >
            <div className="flex items-start gap-3 max-w-4xl">
              <div className="mt-0.5 shrink-0">
                {prologueDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E07A5F] mt-1.5" />
                )}
              </div>
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-[#38BDF8]">
                  {prologueDone ? 'Objective Complete' : 'Current Objective'} ·{' '}
                  {activeMission.timelineHeader}
                </div>
                <p className="text-sm font-medium text-slate-100 leading-snug mt-0.5">
                  {activeMission.objectiveText}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdvanceAct}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#E07A5F] hover:bg-[#ea8c73] text-[#070B14] rounded transition-colors whitespace-nowrap shrink-0"
            >
              <span>Enter Overnight Standby</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-4 sm:px-5 py-3 border-b border-slate-800 bg-[#0A101D]">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-slate-100">
                {activeMission.title}
              </h2>
              <span className="font-mono text-xs text-slate-400">
                {activeMission.coordinates}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
              {activeMission.povStory}
            </p>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            <Prologue
              stageId="prologue"
              simState={simState}
              onUpdateSimState={handleUpdateSimState}
              onCompleteObjective={handleCompletePrologue}
            />
            <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
              <span className="font-mono text-[#E07A5F] mr-2">Mission Outcome:</span>
              {activeMission.narrativeEnding}
            </div>
          </div>
        </section>
      );
    }

    const commonProps = {
      mission: activeMission,
      env,
      onChangeEnv: setEnv,
      simState,
      onUpdateSimState: handleUpdateSimState,
      completedActs,
      onCompleteExperiment: handleCompleteExperiment,
      onAdvanceAct: handleAdvanceAct,
    };

    switch (activeActId) {
      case 'mer':
        return <Act1 {...commonProps} />;
      case 'viking':
        return <Act2 {...commonProps} />;
      case 'sojourner':
        return <Act3 {...commonProps} />;
      case 'phoenix_insight':
        return <Act4 {...commonProps} />;
      case 'ingenuity':
        return <Act5 {...commonProps} />;
      case 'pioneer':
        return <Act6 {...commonProps} />;
      case 'epilogue':
        return <Epilogue {...commonProps} />;
      default:
        return <Act1 {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col">
      {/* Auto-unmounting 1.45s Transition Overlay */}
      <TransitionCanvas
        active={pendingActId !== null}
        kind={pendingMission.transitionKind}
        targetTitle={pendingMission.timelineHeader}
        targetSubtitle={pendingMission.title}
        onComplete={handleTransitionComplete}
      />

      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-[#070B14]/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          <a
            href="#stage"
            className="font-display text-lg font-semibold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
          >
            The Quiet Vigil
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a
              href="#stage"
              className="hover:text-[#38BDF8] transition-colors whitespace-nowrap shrink-0"
            >
              Mission Stage
            </a>
            <a
              href="#physics"
              className="hover:text-[#38BDF8] transition-colors whitespace-nowrap shrink-0"
            >
              Mars Physics
            </a>
            <a
              href="#hardware"
              className="hover:text-[#38BDF8] transition-colors whitespace-nowrap shrink-0"
            >
              3D Hardware
            </a>
            <button
              type="button"
              onClick={() => setBadgesOpen(true)}
              className="hover:text-[#E07A5F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Badges ({unlockedCount}/{missions.length})
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleAdvanceAct}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#38BDF8] hover:bg-sky-300 text-[#070B14] rounded transition-colors whitespace-nowrap shrink-0"
            >
              <span>
                {activeActId === 'epilogue'
                  ? 'Restart Vigil'
                  : `Next: ${nextMission.shortNavLabel}`}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* NASA Mission Journey Strip */}
      <div className="border-b border-slate-800/80 bg-[#0C1322]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
          {missions.map((m, idx) => {
            const isActive = m.id === activeActId;
            const isDone = !!completedActs[m.id];
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => navigateToAct(m.id)}
                className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#E07A5F]/15 border-[#E07A5F] text-[#F4A28C]'
                    : isDone
                    ? 'bg-[#070B14] border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
                    : 'bg-[#070B14] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {idx + 1}. {m.shortNavLabel}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setBadgesOpen(true)}
            className="md:hidden ml-auto inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-[#070B14] border border-slate-700 text-slate-200 rounded whitespace-nowrap shrink-0"
          >
            <Award className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>
              {unlockedCount}/{missions.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Full-Width Mission Console */}
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
        <div id="stage">{renderStage()}</div>

        <div id="physics">
          <MarsEnvSim
            mission={activeMission}
            env={env}
            onChangeEnv={setEnv}
            onResetEnv={() => setEnv(buildDefaultEnv(missions, activeActId))}
          />
        </div>

        <div id="hardware">
          <Spacecraft3D mission={activeMission} />
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-[1320px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <span>
            The Quiet Vigil · Verified NASA NSSDCA Mission Records (1972–2024)
          </span>
          <span className="font-mono">
            {unlockedCount} of {missions.length} Explorer Badges unlocked
          </span>
        </div>
      </footer>

      {/* Floating 1-on-1 Rover Chat Button (Bottom-Right) */}
      <FloatingRoverChat
        mission={activeMission}
        telemetrySummary={telemetrySummary}
        messages={messages}
        onAppendMessages={handleAppendMessages}
      />

      {/* Explorer Badges Modal */}
      {badgesOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="NASA Explorer Badges"
        >
          <div className="bg-[#0C1322] border border-slate-700 rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-100">
                  NASA Explorer Badges &amp; Archive Log
                </h3>
                <p className="font-mono text-xs text-slate-400">
                  {unlockedCount} of {missions.length} mission experiments completed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBadgesOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded border border-slate-800"
                aria-label="Close badges dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              {missions.map((m) => {
                const earned = !!completedActs[m.id];
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setBadgesOpen(false);
                      navigateToAct(m.id);
                    }}
                    className={`text-left p-3.5 rounded border transition-colors ${
                      earned
                        ? 'bg-[#070B14] border-emerald-500/40 hover:border-emerald-400'
                        : 'bg-[#070B14] border-slate-800 hover:border-slate-600 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="text-[#38BDF8]">{m.shortNavLabel}</span>
                      <span className={earned ? 'text-emerald-400' : 'text-slate-500'}>
                        {earned ? '● Unlocked' : '○ Locked'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-100">
                      {m.badge.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {m.badge.criteria}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetProgress}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200 bg-slate-900 border border-rose-500/30 rounded"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Session Progress</span>
              </button>
              <button
                type="button"
                onClick={() => setBadgesOpen(false)}
                className="px-4 py-1.5 text-xs font-medium bg-[#38BDF8] text-[#070B14] rounded"
              >
                Return to Console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
