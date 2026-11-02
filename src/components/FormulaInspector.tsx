import { Calculator, CheckCircle2, AlertOctagon } from 'lucide-react';
import type { Language, MLPArchitecture, MLPNeuron, Point2D, Weights } from '../types/perceptron';
import { TRANSLATIONS } from '../constants/translations';
import { computeNetInput, formatNumber, formatSigned, heavisideStep, mlpForward } from '../utils/perceptronEngine';

interface FormulaInspectorProps {
  point: Point2D;
  weights: Weights;
  mlpArchitecture: MLPArchitecture | null;
  language: Language;
}

const paren = (v: number, d = 1) => (v < 0 ? `(${formatNumber(v, d)})` : formatNumber(v, d));

function NeuronLine({ title, neuron, a, b, color }: { title: string; neuron: MLPNeuron; a: number; b: number; color: string }) {
  const z = computeNetInput(a, b, neuron.weights);
  const y = heavisideStep(z);
  const w = neuron.weights;
  return (
    <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
      <div className={`font-bold ${color}`}>
        {title} · {neuron.gateType}
      </div>
      <div className="text-zinc-300 text-[11px] mt-0.5">
        z = {paren(w.w1)}×{a} + {paren(w.w2)}×{b} + {paren(w.bias)} = <span className="text-white">{formatSigned(z)}</span>
        {'  →  '}
        <strong className={y === 1 ? 'text-crt-green' : 'text-zinc-400'}>f(z) = {y}</strong>
      </div>
    </div>
  );
}

export function FormulaInspector({ point, weights, mlpArchitecture, language }: FormulaInspectorProps) {
  const t = TRANSLATIONS[language];
  const { x1, x2, target } = point;

  const term1 = weights.w1 * x1;
  const term2 = weights.w2 * x2;
  const z = computeNetInput(x1, x2, weights);
  const y = heavisideStep(z);
  const error = target - y;
  const norm = Math.hypot(weights.w1, weights.w2);
  const distance = norm > 1e-9 ? z / norm : null;

  const mlp = mlpArchitecture ? mlpForward(mlpArchitecture, x1, x2) : null;
  const correct = mlp ? mlp.predicted === target : y === target;

  return (
    <section className="relative rounded-xl brushed-aluminum p-4">
      <div className="vintage-screw absolute top-3 left-3" />
      <div className="vintage-screw absolute top-3 right-3" />
      <div className="vintage-screw absolute bottom-3 left-3" />
      <div className="vintage-screw absolute bottom-3 right-3" />

      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-700/80 px-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-sky-400" />
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">{t.formulaInspectorTitle}</h3>
            <p className="text-[10px] font-mono text-zinc-400">{t.formulaInspectorSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 font-mono text-[11px]">
          <span className="text-zinc-500">{t.selectedLabel}</span>
          <span className="text-crt-green font-bold">
            x⃗ = ({x1}, {x2})
          </span>
          <span className="text-zinc-400">y* = {target}</span>
        </div>
      </div>

      <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800 font-mono text-xs space-y-2.5">
        {mlpArchitecture && mlp ? (
          <>
            <div className="text-[11px] text-amber-400 font-bold">{mlpArchitecture.formula}</div>
            <NeuronLine title={`${t.hiddenNeuron} H₁`} neuron={mlpArchitecture.hidden1} a={x1} b={x2} color="text-sky-400" />
            <NeuronLine title={`${t.hiddenNeuron} H₂`} neuron={mlpArchitecture.hidden2} a={x1} b={x2} color="text-amber-400" />
            <NeuronLine title={`${t.outputNeuron} Y (h₁=${mlp.h1_out}, h₂=${mlp.h2_out})`} neuron={mlpArchitecture.outputNeuron} a={mlp.h1_out} b={mlp.h2_out} color="text-emerald-400" />
          </>
        ) : (
          <>
            <div>
              <div className="text-[10px] text-zinc-500 mb-1">{t.stepNet}</div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-sky-300 leading-relaxed">
                z = w₁·x₁ + w₂·x₂ + b
                <br />z = ({formatNumber(weights.w1, 1)} × {x1}) + ({formatNumber(weights.w2, 1)} × {x2}) + ({formatNumber(weights.bias, 1)})
                <br />
                <span className="text-white font-bold">
                  z = {formatNumber(term1)} + {formatNumber(term2)} + ({formatNumber(weights.bias)}) = {formatSigned(z)}
                </span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 mb-1">{t.stepAct}</div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-emerald-300">
                f(z) = 1 if z ≥ 0, else 0
                <br />
                <span className="text-white font-bold">
                  f({formatSigned(z)}) = {y}
                </span>
                <span className="text-zinc-500 ml-2">({y === 1 ? t.fires : t.silent})</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 mb-1">{t.stepErr}</div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                e = y* − y = {target} − {y} = <strong className={error === 0 ? 'text-crt-green' : 'text-crt-red'}>{error > 0 ? `+${error}` : error}</strong>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 mb-1">{t.stepGeo}</div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                {distance === null ? (
                  <span className="text-zinc-500">{t.noLine}</span>
                ) : (
                  <span>
                    d = z / |w⃗| = {formatSigned(z)} / {formatNumber(norm)} = <strong className="text-sky-300">{formatSigned(distance)}</strong>
                  </span>
                )}
                <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{t.distanceExplain}</p>
              </div>
            </div>
          </>
        )}

        <div
          className={`flex items-center gap-2 p-2 rounded border font-bold ${
            correct ? 'bg-green-950/40 border-green-700/50 text-crt-green' : 'bg-red-950/40 border-red-700/50 text-crt-red'
          }`}
        >
          {correct ? <CheckCircle2 className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4 animate-pulse" />}
          <span>
            y = {mlp ? mlp.predicted : y}, y* = {target} → [{correct ? t.correct : t.wrong}]
          </span>
        </div>
      </div>
    </section>
  );
}
