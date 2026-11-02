import { ChevronLeft, ChevronRight, CircleOff, Lock, RotateCcw, Sliders } from 'lucide-react';
import type { ControlMode, GateType, Language, Weights } from '../types/perceptron';
import type { Dictionary } from '../constants/translations';
import { TRANSLATIONS } from '../constants/translations';
import { GATE_DEFINITIONS } from '../constants/gates';
import { formatSigned } from '../utils/perceptronEngine';
import { audioSynth } from '../utils/audio';

interface AnalogConsoleProps {
  weights: Weights;
  onChangeWeights: (w: Weights) => void;
  onZero: () => void;
  selectedGate: GateType;
  mode: ControlMode;
  onModeChange: (mode: ControlMode) => void;
  offline: boolean;
  language: Language;
}

const CHANNELS: { key: keyof Weights; label: keyof Dictionary; hint: keyof Dictionary; color: string }[] = [
  { key: 'w1', label: 'weight1Label', hint: 'weight1Hint', color: '#38bdf8' },
  { key: 'w2', label: 'weight2Label', hint: 'weight2Hint', color: '#f59e0b' },
  { key: 'bias', label: 'biasLabel', hint: 'biasHint', color: '#34d399' },
];

const clamp = (v: number) => Math.max(-3, Math.min(3, Math.round(v * 10) / 10));

function Knob({ value, color }: { value: number; color: string }) {
  const angle = (Math.max(-3, Math.min(3, value)) / 3) * 135;
  return (
    <div className="relative w-12 h-12 shrink-0">
      <div className="absolute inset-0 rounded-full border border-zinc-600 bg-[radial-gradient(circle_at_35%_30%,#71717a,#27272a_65%,#09090b)] shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.25)]" />
      <div className="absolute inset-0 transition-transform duration-150" style={{ transform: `rotate(${angle}deg)` }}>
        <div className="absolute left-1/2 top-1 -translate-x-1/2 w-1 h-4 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
    </div>
  );
}

export function AnalogConsole({
  weights,
  onChangeWeights,
  onZero,
  selectedGate,
  mode,
  onModeChange,
  offline,
  language,
}: AnalogConsoleProps) {
  const t = TRANSLATIONS[language];
  const locked = mode === 'auto' || offline;
  const def = GATE_DEFINITIONS[selectedGate];

  const set = (key: keyof Weights, value: number) => {
    if (locked) return;
    audioSynth.playDial();
    onChangeWeights({ ...weights, [key]: clamp(value) });
  };

  return (
    <section id="analog-console" className="relative rounded-xl brushed-aluminum p-4">
      <div className="vintage-screw absolute top-3 left-3" />
      <div className="vintage-screw absolute top-3 right-3" />
      <div className="vintage-screw absolute bottom-3 left-3" />
      <div className="vintage-screw absolute bottom-3 right-3" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-4 border-b border-zinc-700/80 px-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-500" />
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">{t.consoleTitle}</h3>
            <p className="text-[10px] font-mono text-zinc-400">{t.consoleSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Two-position toggle switch */}
          <div className="flex items-center p-1 rounded-md bg-zinc-950 border border-zinc-700 shadow-inner">
            {(['manual', 'auto'] as ControlMode[]).map((m) => (
              <button
                key={m}
                disabled={offline}
                onClick={() => {
                  audioSynth.playClick();
                  onModeChange(m);
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-all disabled:opacity-40 ${
                  mode === m
                    ? m === 'manual'
                      ? 'bg-sky-500 text-zinc-950 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                      : 'bg-amber-500 text-zinc-950 shadow-crt-amber'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {m === 'manual' ? t.modeManual : t.modeAuto}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              audioSynth.playClick();
              onChangeWeights({ ...def.canonicalWeights });
            }}
            disabled={locked}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-crt-green hover:border-crt-green/50 disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.restoreCanonical}
          </button>
          <button
            onClick={() => {
              audioSynth.playClick();
              onZero();
            }}
            disabled={locked}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-40 transition-colors"
          >
            <CircleOff className="w-3.5 h-3.5" />
            {t.zeroWeights}
          </button>
        </div>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3 px-2">
        {CHANNELS.map((ch) => {
          const value = weights[ch.key];
          return (
            <div key={ch.key} className={`p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 transition-opacity ${locked ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 mb-2">
                <Knob value={value} color={ch.color} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold text-zinc-200">{t[ch.label]}</div>
                  <div className="text-[10px] font-mono text-zinc-500 truncate">{t[ch.hint]}</div>
                </div>
                <div className="nixie-tube px-2 py-0.5 rounded font-display text-2xl leading-none min-w-[72px] text-center">
                  {formatSigned(value)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => set(ch.key, value - 0.1)}
                  disabled={locked}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.1}
                  value={Math.max(-3, Math.min(3, value))}
                  disabled={locked}
                  onChange={(e) => set(ch.key, parseFloat(e.target.value))}
                  className="potentiometer-slider disabled:cursor-not-allowed"
                />
                <button
                  onClick={() => set(ch.key, value + 0.1)}
                  disabled={locked}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between text-[9px] font-mono text-zinc-600 mt-1.5 px-7">
                <span>−3</span>
                <span>0</span>
                <span>+3</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-2 mt-3 space-y-1.5">
        {mode === 'auto' && !offline && (
          <p className="flex items-center gap-2 text-[11px] font-mono text-amber-300/90">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            {t.modeAutoHint}
          </p>
        )}
        {offline && <p className="text-[11px] font-mono text-zinc-500">{t.consoleDisabledMLP}</p>}
        {!def.isLinearlySeparable && !offline && <p className="text-[11px] font-mono text-red-300/80">⚠ {t.bestAttemptNote}</p>}
      </div>
    </section>
  );
}
