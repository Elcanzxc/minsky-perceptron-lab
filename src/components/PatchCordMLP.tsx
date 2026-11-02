import { CheckCircle2, Network, RotateCcw, Shuffle, Zap, AlertTriangle } from 'lucide-react';
import type {
  Language,
  MLPArchitecture,
  MLPEvaluation,
  MLPWiring,
  NonSeparableGate,
  Point2D,
  SeparableGate,
} from '../types/perceptron';
import { CANONICAL_WIRING, SEPARABLE_GATES } from '../constants/gates';
import { TRANSLATIONS } from '../constants/translations';
import { formatSigned, isCanonicalWiring, mlpForward } from '../utils/perceptronEngine';
import { audioSynth } from '../utils/audio';

interface PatchCordMLPProps {
  target: NonSeparableGate;
  point: Point2D;
  wiring: MLPWiring;
  architecture: MLPArchitecture;
  evaluation: MLPEvaluation;
  isMLPMode: boolean;
  onToggleMLP: () => void;
  onChangeWiring: (w: MLPWiring) => void;
  onScramble: () => void;
  language: Language;
}

const nextGate = (g: SeparableGate): SeparableGate =>
  SEPARABLE_GATES[(SEPARABLE_GATES.indexOf(g) + 1) % SEPARABLE_GATES.length];

export function PatchCordMLP({
  target,
  point,
  wiring,
  architecture,
  evaluation,
  isMLPMode,
  onToggleMLP,
  onChangeWiring,
  onScramble,
  language,
}: PatchCordMLPProps) {
  const t = TRANSLATIONS[language];
  const f = mlpForward(architecture, point.x1, point.x2);
  const solved = evaluation.allPassed;
  const nonCanonicalSolution = solved && !isCanonicalWiring(target, wiring);

  const cycle = (slot: keyof MLPWiring) => {
    audioSynth.playPatch();
    onChangeWiring({ ...wiring, [slot]: nextGate(wiring[slot]) });
  };

  // Cord helper: bright & animated when the source node carries signal 1
  const cord = (d: string, active: boolean, activeColor: string) => (
    <g>
      <path d={d} fill="none" stroke={active ? activeColor : '#3f3f46'} strokeWidth={active ? 3.5 : 2} opacity={active ? 0.95 : 0.45} />
      {active && <path d={d} fill="none" stroke="#ffffff" strokeWidth={1.4} strokeDasharray="5 7" className="animate-pulse" />}
    </g>
  );

  return (
    <section id="patch-bay" className="relative rounded-xl brushed-aluminum p-4">
      <div className="vintage-screw absolute top-3 left-3" />
      <div className="vintage-screw absolute top-3 right-3" />
      <div className="vintage-screw absolute bottom-3 left-3" />
      <div className="vintage-screw absolute bottom-3 right-3" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-zinc-700/80 px-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-crt-amber" />
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">{t.mlpPanelTitle}</h3>
            <p className="text-[10px] font-mono text-zinc-400">{t.mlpPanelSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              audioSynth.playPatch();
              onScramble();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-mono text-zinc-200 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            {t.scrambleButton}
          </button>
          <button
            onClick={() => {
              audioSynth.playPatch();
              onChangeWiring({ ...CANONICAL_WIRING[target] });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-mono text-zinc-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            {t.canonicalButton}
          </button>
          <button
            onClick={() => {
              audioSynth.playClick();
              onToggleMLP();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              isMLPMode
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-600 hover:text-white'
                : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-crt-amber'
            }`}
          >
            <Zap className="w-4 h-4" />
            {isMLPMode ? t.singleLayerRevertButton : t.mlpEngageButton}
          </button>
        </div>
      </div>

      <p className="text-[11px] font-mono text-zinc-400 px-2 mb-3">{t.patchHint}</p>

      {/* Self-contained viewBox diagram: cables and sockets share one coordinate system so they never drift */}
      <div className={`relative rounded-xl bg-zinc-950/90 border border-zinc-800 p-3 ${isMLPMode ? '' : 'opacity-65'}`}>
        <div className="grid grid-cols-3 text-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest pb-2 border-b border-zinc-900">
          <span>{t.layerInput}</span>
          <span>{t.layerHidden}</span>
          <span>{t.layerOutput}</span>
        </div>

        <svg viewBox="0 0 720 220" className="w-full h-auto select-none">
          {/* Cords: inputs → hidden */}
          {cord('M 150 65 C 230 65, 230 60, 300 60', isMLPMode && point.x1 === 1, '#38bdf8')}
          {cord('M 150 65 C 230 65, 230 155, 300 155', isMLPMode && point.x1 === 1, '#38bdf8')}
          {cord('M 150 155 C 230 155, 230 75, 300 75', isMLPMode && point.x2 === 1, '#f59e0b')}
          {cord('M 150 155 C 230 155, 230 170, 300 170', isMLPMode && point.x2 === 1, '#f59e0b')}
          {/* Cords: hidden → output */}
          {cord('M 430 68 C 490 68, 490 102, 555 102', isMLPMode && f.h1_out === 1, '#38bdf8')}
          {cord('M 430 162 C 490 162, 490 118, 555 118', isMLPMode && f.h2_out === 1, '#f59e0b')}

          {/* Input terminals */}
          {[
            { y: 65, label: 'x₁', val: point.x1, color: '#38bdf8' },
            { y: 155, label: 'x₂', val: point.x2, color: '#f59e0b' },
          ].map((inp) => (
            <g key={inp.label} transform={`translate(40, ${inp.y - 26})`}>
              <rect width="110" height="52" rx="8" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
              <text x="16" y="31" fill="#d4d4d8" fontFamily="JetBrains Mono, monospace" fontSize="14" fontWeight="bold">
                {inp.label}
              </text>
              <circle cx="84" cy="26" r="15" fill="#09090b" stroke={inp.val === 1 ? inp.color : '#52525b'} strokeWidth="2.5" />
              <text x="84" y="31" textAnchor="middle" fill={inp.val === 1 ? inp.color : '#71717a'} fontFamily="VT323, monospace" fontSize="22">
                {inp.val}
              </text>
            </g>
          ))}

          {/* Hidden neurons (clickable to re-plug!) */}
          {[
            { slot: 'h1' as const, y: 68, title: 'H₁', neuron: architecture.hidden1, z: f.h1_z, out: f.h1_out, color: '#38bdf8' },
            { slot: 'h2' as const, y: 162, title: 'H₂', neuron: architecture.hidden2, z: f.h2_z, out: f.h2_out, color: '#f59e0b' },
          ].map((h) => (
            <g
              key={h.title}
              transform={`translate(300, ${h.y - 36})`}
              onClick={() => cycle(h.slot)}
              className="cursor-pointer"
            >
              <rect width="130" height="72" rx="10" fill="#18181b" stroke={h.color} strokeWidth="2" />
              <text x="12" y="22" fill={h.color} fontFamily="JetBrains Mono, monospace" fontSize="12" fontWeight="bold">
                {h.title} · [{h.neuron.gateType}] ↻
              </text>
              <text x="12" y="40" fill="#a1a1aa" fontFamily="JetBrains Mono, monospace" fontSize="10">
                w=({h.neuron.weights.w1},{h.neuron.weights.w2}) b={h.neuron.weights.bias}
              </text>
              <text x="12" y="58" fill="#e4e4e7" fontFamily="JetBrains Mono, monospace" fontSize="11">
                z={formatSigned(h.z, 1)} → h={h.out}
              </text>
              <circle cx="110" cy="52" r="11" fill="#09090b" stroke={h.out === 1 ? '#22c55e' : '#52525b'} strokeWidth="2" />
              <text x="110" y="56" textAnchor="middle" fill={h.out === 1 ? '#22c55e' : '#71717a'} fontFamily="VT323, monospace" fontSize="18">
                {h.out}
              </text>
            </g>
          ))}

          {/* Output neuron (clickable to re-plug!) */}
          <g transform="translate(555, 66)" onClick={() => cycle('out')} className="cursor-pointer">
            <rect
              width="140"
              height="88"
              rx="10"
              fill="#18181b"
              stroke={f.predicted === point.target ? '#22c55e' : '#ef4444'}
              strokeWidth="2.4"
            />
            <text x="12" y="22" fill="#34d399" fontFamily="JetBrains Mono, monospace" fontSize="12" fontWeight="bold">
              Y · [{architecture.outputNeuron.gateType}] ↻
            </text>
            <text x="12" y="40" fill="#a1a1aa" fontFamily="JetBrains Mono, monospace" fontSize="10">
              v=({architecture.outputNeuron.weights.w1},{architecture.outputNeuron.weights.w2}) b={architecture.outputNeuron.weights.bias}
            </text>
            <text x="12" y="58" fill="#e4e4e7" fontFamily="JetBrains Mono, monospace" fontSize="11">
              z={formatSigned(f.out_z, 1)} (y*={point.target})
            </text>
            <circle cx="112" cy="58" r="16" fill="#09090b" stroke={f.predicted === 1 ? '#22c55e' : '#ef4444'} strokeWidth="2.5" />
            <text x="112" y="64" textAnchor="middle" fill={f.predicted === 1 ? '#22c55e' : '#ef4444'} fontFamily="VT323, monospace" fontSize="24">
              {f.predicted}
            </text>
          </g>
        </svg>
      </div>

      {/* Status & explanation */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          {solved ? (
            <CheckCircle2 className="w-4 h-4 text-crt-green shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className={solved ? 'text-crt-green font-bold' : 'text-amber-300'}>
            {nonCanonicalSolution ? t.mlpAltSolution : solved ? t.mlpSolved : `${t.mlpUnsolved} (${evaluation.accuracy}%)`}
          </span>
        </div>
        <span className="text-[11px] text-zinc-400">{target === 'XOR' ? t.xorResolution : t.xnorResolution}</span>
      </div>
    </section>
  );
}
