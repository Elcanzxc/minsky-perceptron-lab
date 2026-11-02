import { Activity, Pause, Play, Shuffle, StepForward } from 'lucide-react';
import type { Language, Point2D, TrainingStep } from '../types/perceptron';
import { TRANSLATIONS } from '../constants/translations';
import { errorsPerEpoch, formatSigned } from '../utils/perceptronEngine';
import { audioSynth } from '../utils/audio';

export type TrainingSpeed = 'slow' | 'normal' | 'fast';

interface TrainingControlProps {
  points: Point2D[];
  sampleIndex: number;
  epoch: number;
  learningRate: number;
  onChangeLearningRate: (lr: number) => void;
  speed: TrainingSpeed;
  onChangeSpeed: (s: TrainingSpeed) => void;
  isRunning: boolean;
  onToggleRun: () => void;
  onSingleStep: () => void;
  onRandomize: () => void;
  history: TrainingStep[];
  isLinearlySeparable: boolean;
  allPassed: boolean;
  offline: boolean;
  language: Language;
}

function LearningCurves({ history, emptyLabel, errLabel, wLabel }: { history: TrainingStep[]; emptyLabel: string; errLabel: string; wLabel: string }) {
  if (history.length === 0) {
    return (
      <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-center text-[11px] font-mono text-zinc-500">
        {emptyLabel}
      </div>
    );
  }

  const epochErrs = errorsPerEpoch(history).slice(-24);
  const recent = history.slice(-40);
  const wVals = recent.flatMap((s) => [s.newWeights.w1, s.newWeights.w2, s.newWeights.bias]);
  const maxAbs = Math.max(2, ...wVals.map((v) => Math.abs(v)));

  const poly = (selector: (s: TrainingStep) => number) =>
    recent
      .map((s, i) => {
        const x = recent.length === 1 ? 100 : (i / (recent.length - 1)) * 200;
        const y = 30 - (selector(s) / maxAbs) * 26;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Errors per epoch bar chart */}
      <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
          <span>{errLabel}</span>
          <span className="text-zinc-500">0 … 4</span>
        </div>
        <svg viewBox="0 0 200 54" className="w-full h-14">
          <line x1="0" y1="48" x2="200" y2="48" stroke="#27272a" strokeWidth="1" />
          {epochErrs.map((e, i) => {
            const barW = Math.max(4, 180 / Math.max(8, epochErrs.length));
            const x = 6 + i * ((188) / Math.max(1, epochErrs.length));
            const h = e.errors === 0 ? 3 : (e.errors / 4) * 40;
            const y = 48 - h;
            return (
              <rect
                key={e.epoch}
                x={x}
                y={y}
                width={barW - 2}
                height={h}
                rx={1.5}
                fill={e.errors === 0 ? '#22c55e' : '#ef4444'}
              />
            );
          })}
        </svg>
      </div>

      {/* Weight trajectories */}
      <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
          <span>{wLabel}</span>
          <span className="flex items-center gap-2">
            <span className="text-sky-400">w₁</span>
            <span className="text-amber-400">w₂</span>
            <span className="text-emerald-400">b</span>
          </span>
        </div>
        <svg viewBox="0 0 200 60" className="w-full h-14">
          <line x1="0" y1="30" x2="200" y2="30" stroke="#27272a" strokeDasharray="2 2" strokeWidth="1" />
          <polyline fill="none" stroke="#38bdf8" strokeWidth="1.6" points={poly((s) => s.newWeights.w1)} />
          <polyline fill="none" stroke="#f59e0b" strokeWidth="1.6" points={poly((s) => s.newWeights.w2)} />
          <polyline fill="none" stroke="#34d399" strokeWidth="1.6" points={poly((s) => s.newWeights.bias)} />
        </svg>
      </div>
    </div>
  );
}

export function TrainingControl({
  points,
  sampleIndex,
  epoch,
  learningRate,
  onChangeLearningRate,
  speed,
  onChangeSpeed,
  isRunning,
  onToggleRun,
  onSingleStep,
  onRandomize,
  history,
  isLinearlySeparable,
  allPassed,
  offline,
  language,
}: TrainingControlProps) {
  const t = TRANSLATIONS[language];
  const lastStep = history.length > 0 ? history[history.length - 1] : null;
  const nextSample = points[sampleIndex];

  return (
    <section id="training-control" className="relative rounded-xl brushed-aluminum p-4">
      <div className="vintage-screw absolute top-3 left-3" />
      <div className="vintage-screw absolute top-3 right-3" />
      <div className="vintage-screw absolute bottom-3 left-3" />
      <div className="vintage-screw absolute bottom-3 right-3" />

      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-700/80 px-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-crt-amber" />
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">{t.trainingTitle}</h3>
            <p className="text-[10px] font-mono text-zinc-400">{t.trainingSubtitle}</p>
          </div>
        </div>
        {nextSample && !offline && (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-zinc-500">{t.sampleLabel} #{sampleIndex + 1}/4:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-sky-300">
              ({nextSample.x1}, {nextSample.x2}) → y*={nextSample.target}
            </span>
          </div>
        )}
      </div>

      {offline ? (
        <p className="px-3 py-4 text-xs font-mono text-zinc-400 bg-zinc-950/60 rounded-lg border border-zinc-800">{t.trainingDisabledMLP}</p>
      ) : (
        <div className="space-y-3 px-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left: action buttons + speed */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    audioSynth.playClick();
                    onSingleStep();
                  }}
                  disabled={isRunning}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-mono font-bold text-zinc-100 disabled:opacity-40 transition-colors"
                >
                  <StepForward className="w-4 h-4 text-crt-green" />
                  {t.stepButton}
                </button>
                <button
                  onClick={() => {
                    audioSynth.playClick();
                    onToggleRun();
                  }}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                    isRunning
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-crt-amber'
                      : 'bg-green-950/70 border-green-600 text-green-300 hover:bg-green-900/70'
                  }`}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isRunning ? t.pauseTrainButton : t.autoTrainButton}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    audioSynth.playClick();
                    onRandomize();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-mono text-zinc-300 transition-colors"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  {t.resetWeightsButton}
                </button>
                <div className="flex items-center p-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono">
                  {(['slow', 'normal', 'fast'] as TrainingSpeed[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        audioSynth.playClick();
                        onChangeSpeed(s);
                      }}
                      className={`px-2 py-1 rounded ${speed === s ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {s === 'slow' ? t.speedSlow : s === 'normal' ? t.speedNormal : t.speedFast}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: learning rate + last update */}
            <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-300 font-semibold">{t.learningRateLabel}</span>
                <span className="nixie-tube px-2 py-0.5 rounded font-display text-lg">η = {learningRate.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={learningRate}
                onChange={(e) => {
                  audioSynth.playDial();
                  onChangeLearningRate(parseFloat(e.target.value));
                }}
                className="potentiometer-slider"
              />
              <div className="pt-1.5 border-t border-zinc-800 text-[11px] font-mono">
                {lastStep ? (
                  lastStep.error === 0 ? (
                    <span className="text-zinc-500">
                      ({lastStep.x1},{lastStep.x2}): {t.noUpdate}
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400">
                        ({lastStep.x1},{lastStep.x2}) e={lastStep.error > 0 ? `+${lastStep.error}` : lastStep.error}:
                      </span>
                      <span className="text-sky-400">Δw₁={formatSigned(lastStep.deltaW1)}</span>
                      <span className="text-amber-400">Δw₂={formatSigned(lastStep.deltaW2)}</span>
                      <span className="text-emerald-400">Δb={formatSigned(lastStep.deltaBias)}</span>
                    </div>
                  )
                ) : (
                  <span className="text-zinc-500">Δwᵢ = η · (y* − y) · xᵢ  |  Δb = η · (y* − y)</span>
                )}
              </div>
            </div>
          </div>

          <LearningCurves history={history} emptyLabel={t.curveEmpty} errLabel={t.curveErrors} wLabel={t.curveWeights} />

          {allPassed && (
            <div className="px-3 py-1.5 rounded bg-green-950/50 border border-green-700/50 text-center font-mono text-xs crt-green-text font-bold">
              ★ {t.trainingConverged}
            </div>
          )}
          {!isLinearlySeparable && epoch >= 8 && (
            <div className="px-3 py-1.5 rounded bg-red-950/50 border border-red-700/50 text-center font-mono text-xs crt-red-text font-bold">
              ⚠ {t.trainingDiverged}
            </div>
          )}
          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">{t.convergenceTheorem}</p>
        </div>
      )}
    </section>
  );
}
