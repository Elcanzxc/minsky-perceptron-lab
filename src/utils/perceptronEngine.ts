import type {
  GateType,
  MLPArchitecture,
  MLPEvaluation,
  MLPForward,
  MLPResult,
  MLPWiring,
  NonSeparableGate,
  PerceptronEvaluation,
  PerceptronResult,
  Point2D,
  TrainingStepResult,
  Weights,
} from '../types/perceptron';
import { CANONICAL_WIRING, GATE_DEFINITIONS, SEPARABLE_GATES } from '../constants/gates';

const round = (value: number, decimals: number): number => {
  const f = 10 ** decimals;
  const r = Math.round(value * f) / f;
  return Object.is(r, -0) ? 0 : r;
};

/** Signed number formatting without the ugly "-0.00". */
export function formatSigned(value: number, decimals = 2): string {
  const v = Math.abs(value) < 0.5 * 10 ** -decimals ? 0 : value;
  return `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(decimals)}`;
}

/** Plain formatting, also normalising "-0". */
export function formatNumber(value: number, decimals = 2): string {
  const v = Math.abs(value) < 0.5 * 10 ** -decimals ? 0 : value;
  return v.toFixed(decimals);
}

/** Heaviside step activation: f(z) = 1 if z ≥ 0, otherwise 0. */
export function heavisideStep(z: number): 0 | 1 {
  return z >= 0 ? 1 : 0;
}

/** Net input z = w₁x₁ + w₂x₂ + b (rounded to suppress floating-point noise). */
export function computeNetInput(x1: number, x2: number, weights: Weights): number {
  return round(weights.w1 * x1 + weights.w2 * x2 + weights.bias, 6);
}

export function feedforward(x1: number, x2: number, weights: Weights): { z: number; y: 0 | 1 } {
  const z = computeNetInput(x1, x2, weights);
  return { z, y: heavisideStep(z) };
}

export function evaluateGate(gateType: GateType, weights: Weights): PerceptronEvaluation {
  const results: PerceptronResult[] = GATE_DEFINITIONS[gateType].points.map((pt) => {
    const { z, y } = feedforward(pt.x1, pt.x2, weights);
    return {
      x1: pt.x1,
      x2: pt.x2,
      target: pt.target,
      netInput: z,
      predicted: y,
      isCorrect: y === pt.target,
    };
  });
  const correct = results.filter((r) => r.isCorrect).length;
  return {
    results,
    accuracy: (correct / results.length) * 100,
    allPassed: correct === results.length,
  };
}

/**
 * One update of Rosenblatt's Perceptron Learning Rule (1958):
 *   Δwᵢ = η · (y* − y) · xᵢ
 *   Δb  = η · (y* − y)
 */
export function performTrainingStep(
  points: Point2D[],
  weights: Weights,
  learningRate: number,
  sampleIndex: number,
  epoch: number,
): TrainingStepResult {
  const sample = points[sampleIndex];
  const { z, y } = feedforward(sample.x1, sample.x2, weights);
  const error = sample.target - y;

  const deltaW1 = round(learningRate * error * sample.x1, 4);
  const deltaW2 = round(learningRate * error * sample.x2, 4);
  const deltaBias = round(learningRate * error, 4);

  const newWeights: Weights = {
    w1: round(weights.w1 + deltaW1, 4),
    w2: round(weights.w2 + deltaW2, 4),
    bias: round(weights.bias + deltaBias, 4),
  };

  const nextSampleIndex = (sampleIndex + 1) % points.length;
  return {
    newWeights,
    nextSampleIndex,
    nextEpoch: nextSampleIndex === 0 ? epoch + 1 : epoch,
    step: {
      epoch,
      sampleIndex,
      x1: sample.x1,
      x2: sample.x2,
      target: sample.target,
      predicted: y,
      netInput: z,
      error,
      prevWeights: { ...weights },
      newWeights: { ...newWeights },
      deltaW1,
      deltaW2,
      deltaBias,
    },
  };
}

/** Builds a 2-2-1 network whose neurons use the canonical weights of the plugged-in gates. */
export function buildMLPArchitecture(target: NonSeparableGate, wiring: MLPWiring): MLPArchitecture {
  const neuron = (gate: MLPWiring['h1']) => ({
    gateType: gate,
    weights: { ...GATE_DEFINITIONS[gate].canonicalWeights },
  });
  return {
    gateType: target,
    hidden1: neuron(wiring.h1),
    hidden2: neuron(wiring.h2),
    outputNeuron: neuron(wiring.out),
    formula: `${target}(x₁,x₂) = ${wiring.out}( ${wiring.h1}(x₁,x₂), ${wiring.h2}(x₁,x₂) )`,
  };
}

/** Forward pass through the 2-2-1 network for an arbitrary (even non-binary) point. */
export function mlpForward(arch: MLPArchitecture, x1: number, x2: number): MLPForward {
  const h1_z = computeNetInput(x1, x2, arch.hidden1.weights);
  const h1_out = heavisideStep(h1_z);
  const h2_z = computeNetInput(x1, x2, arch.hidden2.weights);
  const h2_out = heavisideStep(h2_z);
  const out_z = computeNetInput(h1_out, h2_out, arch.outputNeuron.weights);
  return { h1_z, h1_out, h2_z, h2_out, out_z, predicted: heavisideStep(out_z) };
}

export function evaluateMLP(arch: MLPArchitecture, points: Point2D[]): MLPEvaluation {
  const results: MLPResult[] = points.map((pt) => {
    const f = mlpForward(arch, pt.x1, pt.x2);
    return { ...f, x1: pt.x1, x2: pt.x2, target: pt.target, isCorrect: f.predicted === pt.target };
  });
  const correct = results.filter((r) => r.isCorrect).length;
  return {
    results,
    accuracy: (correct / results.length) * 100,
    allPassed: correct === results.length,
  };
}

export function isCanonicalWiring(target: NonSeparableGate, wiring: MLPWiring): boolean {
  const c = CANONICAL_WIRING[target];
  return c.h1 === wiring.h1 && c.h2 === wiring.h2 && c.out === wiring.out;
}

/** Random wiring that does NOT solve the target — the starting point of the patch-bay puzzle. */
export function randomBrokenWiring(target: NonSeparableGate): MLPWiring {
  const pick = () => SEPARABLE_GATES[Math.floor(Math.random() * SEPARABLE_GATES.length)];
  for (let attempt = 0; attempt < 100; attempt++) {
    const wiring: MLPWiring = { h1: pick(), h2: pick(), out: pick() };
    const arch = buildMLPArchitecture(target, wiring);
    if (!evaluateMLP(arch, GATE_DEFINITIONS[target].points).allPassed) return wiring;
  }
  return { h1: 'AND', h2: 'AND', out: 'AND' };
}

/** Number of misclassified samples in each epoch of the recorded training history. */
export function errorsPerEpoch(history: { epoch: number; error: number }[]): { epoch: number; errors: number }[] {
  const map = new Map<number, number>();
  for (const s of history) {
    map.set(s.epoch, (map.get(s.epoch) ?? 0) + (s.error !== 0 ? 1 : 0));
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([epoch, errors]) => ({ epoch, errors }));
}
