import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, Layers, Zap } from 'lucide-react';
import type {
  AudioSettings,
  ControlMode,
  GateType,
  Language,
  MissionId,
  MLPWiring,
  NonSeparableGate,
  Point2D,
  TrainingStep,
  Weights,
} from './types/perceptron';
import {
  CANONICAL_WIRING,
  GATE_DEFINITIONS,
  NON_SEPARABLE_GATES,
  SEPARABLE_GATES,
  isNonSeparable,
} from './constants/gates';
import { TRANSLATIONS } from './constants/translations';
import {
  buildMLPArchitecture,
  evaluateGate,
  evaluateMLP,
  performTrainingStep,
  randomBrokenWiring,
} from './utils/perceptronEngine';
import { audioSynth } from './utils/audio';

import { Header } from './components/Header';
import { MissionBar } from './components/MissionBar';
import { Oscilloscope } from './components/Oscilloscope';
import { AnalogConsole } from './components/AnalogConsole';
import { TruthTablePanel } from './components/TruthTablePanel';
import { FormulaInspector } from './components/FormulaInspector';
import { TrainingControl } from './components/TrainingControl';
import type { TrainingSpeed } from './components/TrainingControl';
import { PatchCordMLP } from './components/PatchCordMLP';
import { ProofModal } from './components/ProofModal';

const INITIAL_MISSIONS: Record<MissionId, boolean> = {
  m1: false,
  m2: false,
  m3: false,
  m4: false,
  m5: false,
  m6: false,
  m7: false,
};

const SPEED_MS: Record<TrainingSpeed, number> = {
  slow: 420,
  normal: 180,
  fast: 60,
};

export default function App() {
  const [language, setLanguage] = useState<Language>('RU');
  const [selectedGate, setSelectedGate] = useState<GateType>('AND');
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({ muted: false, crtHum: false });

  const [weights, setWeights] = useState<Weights>(() => ({ ...GATE_DEFINITIONS.AND.canonicalWeights }));
  const [controlMode, setControlMode] = useState<ControlMode>('manual');
  const [learningRate, setLearningRate] = useState<number>(0.2);
  const [speed, setSpeed] = useState<TrainingSpeed>('normal');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sampleIndex, setSampleIndex] = useState<number>(0);
  const [epoch, setEpoch] = useState<number>(0);
  const [history, setHistory] = useState<TrainingStep[]>([]);
  const [trail, setTrail] = useState<Weights[]>([]);

  const [selectedPoint, setSelectedPoint] = useState<Point2D | null>(null);
  const [isMLPMode, setIsMLPMode] = useState<boolean>(false);
  const [wiring, setWiring] = useState<Record<NonSeparableGate, MLPWiring>>(() => ({
    XOR: { ...CANONICAL_WIRING.XOR },
    XNOR: { ...CANONICAL_WIRING.XNOR },
  }));
  const [isProofModalOpen, setIsProofModalOpen] = useState<boolean>(false);

  const [activeMission, setActiveMission] = useState<MissionId | null>('m1');
  const [completed, setCompleted] = useState<Record<MissionId, boolean>>(INITIAL_MISSIONS);
  const [puzzleAttempted, setPuzzleAttempted] = useState<boolean>(false);

  const t = TRANSLATIONS[language];
  const gateDef = GATE_DEFINITIONS[selectedGate];
  const activePoint = selectedPoint ?? gateDef.points[3];
  const isCrisis = !gateDef.isLinearlySeparable && !isMLPMode;

  const evaluation = useMemo(() => evaluateGate(selectedGate, weights), [selectedGate, weights]);

  const mlpTarget = isNonSeparable(selectedGate) ? selectedGate : null;
  const mlpArchitecture = useMemo(
    () => (mlpTarget ? buildMLPArchitecture(mlpTarget, wiring[mlpTarget]) : null),
    [mlpTarget, wiring],
  );
  const mlpEvaluation = useMemo(
    () => (mlpArchitecture ? evaluateMLP(mlpArchitecture, gateDef.points) : null),
    [mlpArchitecture, gateDef.points],
  );

  const effectiveAccuracy = isMLPMode && mlpEvaluation ? mlpEvaluation.accuracy : evaluation.accuracy;
  const effectiveAllPassed = isMLPMode && mlpEvaluation ? mlpEvaluation.allPassed : evaluation.allPassed;
  const classifiedForCRT = isMLPMode && mlpEvaluation ? mlpEvaluation.results : evaluation.results;

  const markMission = useCallback((id: MissionId) => {
    setCompleted((prev) => {
      if (prev[id]) return prev;
      audioSynth.playMission();
      return { ...prev, [id]: true };
    });
  }, []);

  // Chime when single-layer calibration transitions from <100% to 100%
  const prevPassedRef = useRef<boolean>(evaluation.allPassed);
  useEffect(() => {
    if (evaluation.allPassed && !prevPassedRef.current && !isMLPMode) {
      audioSynth.playSuccess();
    }
    prevPassedRef.current = evaluation.allPassed;
  }, [evaluation.allPassed, isMLPMode]);

  const pushTrail = (prev: Weights, next: Weights) => {
    if (prev.w1 === next.w1 && prev.w2 === next.w2 && prev.bias === next.bias) return;
    setTrail((t) => [...t.slice(-11), prev]);
  };

  const resetTrainingLog = () => {
    setIsRunning(false);
    setSampleIndex(0);
    setEpoch(0);
    setHistory([]);
    setTrail([]);
  };

  const selectGate = (gate: GateType, initialWeights?: Weights) => {
    audioSynth.playClick();
    resetTrainingLog();
    setSelectedGate(gate);
    const def = GATE_DEFINITIONS[gate];
    setWeights(initialWeights ? { ...initialWeights } : { ...def.canonicalWeights });
    setSelectedPoint(null);
    setIsMLPMode(false);
    if (!def.isLinearlySeparable) audioSynth.playAlarm();
    else audioSynth.stopAlarm();
  };

  const doOneStep = useCallback(() => {
    setControlMode('auto');
    const result = performTrainingStep(gateDef.points, weights, learningRate, sampleIndex, epoch);
    pushTrail(weights, result.newWeights);
    setWeights(result.newWeights);
    setSampleIndex(result.nextSampleIndex);
    setEpoch(result.nextEpoch);
    setHistory((h) => [...h.slice(-120), result.step]);
    setSelectedPoint(gateDef.points[sampleIndex]);
    if (result.step.error !== 0) audioSynth.playDial();

    const nextEval = evaluateGate(selectedGate, result.newWeights);
    if (nextEval.allPassed) {
      markMission('m2');
      if (gateDef.isLinearlySeparable) setIsRunning(false);
    }
    if (!gateDef.isLinearlySeparable) {
      if (result.nextEpoch >= 10) markMission('m4');
      if (result.nextEpoch >= 25) {
        setIsRunning(false);
        audioSynth.playAlarm();
      }
    }
  }, [gateDef, selectedGate, weights, learningRate, sampleIndex, epoch, markMission]);

  // Auto-learning timer
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setTimeout(doOneStep, SPEED_MS[speed]);
    return () => clearTimeout(id);
  }, [isRunning, speed, doOneStep]);

  const handleManualWeights = (next: Weights) => {
    setIsRunning(false);
    pushTrail(weights, next);
    setWeights(next);
    if (!isMLPMode && evaluateGate(selectedGate, next).allPassed) {
      markMission('m1');
    }
  };

  const handleRandomize = () => {
    const rand = () => Math.round((Math.random() * 3 - 1.5) * 10) / 10;
    resetTrainingLog();
    setControlMode('auto');
    setWeights({ w1: rand(), w2: rand(), bias: rand() });
  };

  const checkMlpMissions = (target: NonSeparableGate, w: MLPWiring, wasPuzzle: boolean) => {
    const ev = evaluateMLP(buildMLPArchitecture(target, w), GATE_DEFINITIONS[target].points);
    if (ev.allPassed) {
      markMission('m6');
      if (wasPuzzle) markMission('m7');
    }
  };

  const engageMLP = (target: NonSeparableGate, nextWiring?: MLPWiring, wasPuzzle = puzzleAttempted) => {
    const w = nextWiring ?? wiring[target];
    if (nextWiring) setWiring((prev) => ({ ...prev, [target]: nextWiring }));
    setIsMLPMode(true);
    setIsRunning(false);
    checkMlpMissions(target, w, wasPuzzle);
  };

  const handleStartMission = (id: MissionId) => {
    setActiveMission(id);
    switch (id) {
      case 'm1':
        selectGate('AND', { w1: 0, w2: 0, bias: 0 });
        setControlMode('manual');
        break;
      case 'm2':
        selectGate('OR', { w1: 0, w2: 0, bias: 0 });
        setControlMode('auto');
        setIsRunning(true);
        break;
      case 'm3':
        selectGate('AND');
        document.getElementById('truth-table')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'm4':
        selectGate('XOR', { w1: 0.4, w2: -0.3, bias: 0.1 });
        setControlMode('auto');
        setIsRunning(true);
        break;
      case 'm5':
        if (!isNonSeparable(selectedGate)) selectGate('XOR');
        setIsProofModalOpen(true);
        markMission('m5');
        break;
      case 'm6': {
        const target: NonSeparableGate = isNonSeparable(selectedGate) ? selectedGate : 'XOR';
        if (!isNonSeparable(selectedGate)) selectGate('XOR');
        engageMLP(target, { ...CANONICAL_WIRING[target] }, false);
        document.getElementById('patch-bay')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
      case 'm7': {
        const target: NonSeparableGate = isNonSeparable(selectedGate) ? selectedGate : 'XOR';
        if (!isNonSeparable(selectedGate)) selectGate('XOR');
        setPuzzleAttempted(true);
        engageMLP(target, randomBrokenWiring(target), true);
        document.getElementById('patch-bay')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  };

  const openProof = () => {
    setIsProofModalOpen(true);
    markMission('m5');
  };

  const handleSelectPoint = (pt: Point2D) => {
    setSelectedPoint(pt);
    markMission('m3');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-3 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto w-full">
        <Header
          language={language}
          onLanguageChange={setLanguage}
          audioSettings={audioSettings}
          onAudioChange={setAudioSettings}
          accuracy={effectiveAccuracy}
          allPassed={effectiveAllPassed}
          isCrisis={isCrisis}
          isMLPMode={isMLPMode}
          epoch={epoch}
          onOpenProof={openProof}
        />

        <MissionBar
          activeMission={activeMission}
          completed={completed}
          onStartMission={handleStartMission}
          onResetMissions={() => {
            setCompleted(INITIAL_MISSIONS);
            setPuzzleAttempted(false);
          }}
          language={language}
        />

        {/* Gate selector with explicit separable vs non-separable groups */}
        <section className="relative brushed-aluminum p-4 rounded-xl mb-6">
          <div className="vintage-screw absolute top-3 left-3" />
          <div className="vintage-screw absolute top-3 right-3" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-2">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-crt-amber" />
                <h2 className="text-xs font-mono font-bold tracking-widest text-zinc-200 uppercase">{t.gatesSectionTitle}</h2>
                <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-crt-green font-bold">
                  {gateDef.formula}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-1">{gateDef.description[language]}</p>
            </div>

            <div className="flex flex-wrap items-stretch gap-3">
              <div className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800">
                <div className="flex items-center justify-between gap-2 text-[9px] font-mono text-emerald-400 uppercase tracking-wider mb-1.5 px-1">
                  <span>{t.separableGatesGroup}</span>
                  <span className="text-zinc-500">· {t.separableTag}</span>
                </div>
                <div className="flex gap-1.5">
                  {SEPARABLE_GATES.map((gate) => (
                    <button
                      key={gate}
                      onClick={() => selectGate(gate)}
                      className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all border ${selectedGate === gate
                          ? 'bg-crt-green text-zinc-950 border-crt-green shadow-crt-green'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white hover:border-zinc-500'
                        }`}
                    >
                      {gate}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-zinc-950/70 border border-amber-700/40">
                <div className="flex items-center justify-between gap-2 text-[9px] font-mono text-amber-400 uppercase tracking-wider mb-1.5 px-1">
                  <span>{t.nonSeparableGatesGroup}</span>
                  <span className="text-zinc-500">· {t.nonSeparableTag}</span>
                </div>
                <div className="flex gap-1.5">
                  {NON_SEPARABLE_GATES.map((gate) => (
                    <button
                      key={gate}
                      onClick={() => selectGate(gate)}
                      className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all border ${selectedGate === gate
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-crt-amber'
                          : 'bg-zinc-900 text-amber-300 border-amber-600/40 hover:bg-amber-950/40 hover:border-amber-500'
                        }`}
                    >
                      {gate} ⚠
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 1969 Minsky Paradox Alert Banner */}
        {isCrisis && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/80 border-2 border-red-600 shadow-crt-red">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-full bg-red-900/60 border border-red-500 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-crt-red animate-bounce" />
                </div>
                <div className="font-mono">
                  <h3 className="text-sm font-bold crt-red-text tracking-wider uppercase">{t.minskyCrisisBannerTitle}</h3>
                  <p className="text-xs text-red-100 mt-0.5">{t.minskyCrisisBannerBody}</p>
                  <p className="text-[11px] text-amber-300/90 mt-1">{t.crisisTryHint}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    audioSynth.playClick();
                    openProof();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500 text-amber-300 font-mono text-xs font-semibold"
                >
                  <BookOpen className="w-4 h-4" />
                  {t.examineProofButton}
                </button>
                <button
                  onClick={() => {
                    audioSynth.playClick();
                    if (mlpTarget) engageMLP(mlpTarget);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider shadow-crt-amber"
                >
                  <Zap className="w-4 h-4" />
                  {t.mlpEngageButton}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main 12-column workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <Oscilloscope
              gateType={selectedGate}
              weights={weights}
              points={gateDef.points}
              classified={classifiedForCRT}
              selectedPoint={activePoint}
              onSelectPoint={handleSelectPoint}
              isMLPMode={isMLPMode}
              mlpArchitecture={mlpArchitecture}
              isCrisis={isCrisis}
              trail={trail}
              accuracy={effectiveAccuracy}
              language={language}
            />
            <AnalogConsole
              weights={weights}
              onChangeWeights={handleManualWeights}
              onZero={() => {
                resetTrainingLog();
                setWeights({ w1: 0, w2: 0, bias: 0 });
              }}
              selectedGate={selectedGate}
              mode={controlMode}
              onModeChange={(m) => {
                if (m === 'manual') setIsRunning(false);
                setControlMode(m);
              }}
              offline={isMLPMode}
              language={language}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <TruthTablePanel
              points={gateDef.points}
              results={evaluation.results}
              mlpResults={isMLPMode && mlpEvaluation ? mlpEvaluation.results : null}
              selectedPoint={activePoint}
              onSelectPoint={handleSelectPoint}
              language={language}
            />
            <FormulaInspector
              point={activePoint}
              weights={weights}
              mlpArchitecture={isMLPMode ? mlpArchitecture : null}
              language={language}
            />
            <TrainingControl
              points={gateDef.points}
              sampleIndex={sampleIndex}
              epoch={epoch}
              learningRate={learningRate}
              onChangeLearningRate={setLearningRate}
              speed={speed}
              onChangeSpeed={setSpeed}
              isRunning={isRunning}
              onToggleRun={() => {
                setControlMode('auto');
                setIsRunning((r) => !r);
              }}
              onSingleStep={doOneStep}
              onRandomize={handleRandomize}
              history={history}
              isLinearlySeparable={gateDef.isLinearlySeparable}
              allPassed={evaluation.allPassed}
              offline={isMLPMode}
              language={language}
            />
          </div>
        </div>

        {/* Interactive MLP Patch-Bay (for XOR & XNOR) */}
        {mlpTarget && mlpArchitecture && mlpEvaluation && (
          <div className="mb-6">
            <PatchCordMLP
              target={mlpTarget}
              point={activePoint}
              wiring={wiring[mlpTarget]}
              architecture={mlpArchitecture}
              evaluation={mlpEvaluation}
              isMLPMode={isMLPMode}
              onToggleMLP={() => {
                if (!isMLPMode) engageMLP(mlpTarget);
                else setIsMLPMode(false);
              }}
              onChangeWiring={(next) => engageMLP(mlpTarget, next)}
              onScramble={() => {
                setPuzzleAttempted(true);
                engageMLP(mlpTarget, randomBrokenWiring(mlpTarget), true);
              }}
              language={language}
            />
          </div>
        )}

        <ProofModal isOpen={isProofModalOpen} onClose={() => setIsProofModalOpen(false)} language={language} />
      </div>

      <footer className="w-full max-w-7xl mx-auto pt-4 pb-2 border-t border-zinc-800 text-center font-mono text-[11px] text-zinc-500">
        CORNELL AERONAUTICAL LABORATORY · FRANK ROSENBLATT (1958–1960) &nbsp;•&nbsp; MIT AI LABORATORY · MARVIN MINSKY &amp; SEYMOUR PAPERT (1969)
      </footer>
    </div>
  );
}
