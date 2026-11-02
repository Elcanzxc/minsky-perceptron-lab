export type GateType = 'AND' | 'NAND' | 'OR' | 'NOR' | 'XOR' | 'XNOR';

/** Gates that a single perceptron can compute (usable as building blocks of the MLP). */
export type SeparableGate = 'AND' | 'NAND' | 'OR' | 'NOR';

/** Gates that are NOT linearly separable — the heart of the Minsky Paradox. */
export type NonSeparableGate = 'XOR' | 'XNOR';

export type Language = 'AZ' | 'EN' | 'RU';

export type ControlMode = 'manual' | 'auto';

export type MissionId = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7';

export interface Point2D {
  x1: 0 | 1;
  x2: 0 | 1;
  target: 0 | 1;
}

export interface CartesianPoint {
  x: number;
  y: number;
}

export interface Weights {
  w1: number;
  w2: number;
  bias: number;
}

/** Minimal shape needed to draw a classification ring on the CRT. */
export interface Classified {
  x1: number;
  x2: number;
  isCorrect: boolean;
}

export interface PerceptronResult extends Classified {
  target: 0 | 1;
  netInput: number;
  predicted: 0 | 1;
}

export interface PerceptronEvaluation {
  accuracy: number;
  allPassed: boolean;
  results: PerceptronResult[];
}

export interface TrainingStep {
  epoch: number;
  sampleIndex: number;
  x1: number;
  x2: number;
  target: 0 | 1;
  predicted: 0 | 1;
  netInput: number;
  error: number;
  prevWeights: Weights;
  newWeights: Weights;
  deltaW1: number;
  deltaW2: number;
  deltaBias: number;
}

export interface TrainingStepResult {
  newWeights: Weights;
  step: TrainingStep;
  nextSampleIndex: number;
  nextEpoch: number;
}

export interface MLPNeuron {
  gateType: SeparableGate;
  weights: Weights;
}

/** Which gate each patch-bay socket is plugged into. */
export interface MLPWiring {
  h1: SeparableGate;
  h2: SeparableGate;
  out: SeparableGate;
}

export interface MLPArchitecture {
  gateType: NonSeparableGate;
  hidden1: MLPNeuron;
  hidden2: MLPNeuron;
  outputNeuron: MLPNeuron;
  formula: string;
}

export interface MLPForward {
  h1_z: number;
  h1_out: 0 | 1;
  h2_z: number;
  h2_out: 0 | 1;
  out_z: number;
  predicted: 0 | 1;
}

export interface MLPResult extends MLPForward, Classified {
  target: 0 | 1;
}

export interface MLPEvaluation {
  accuracy: number;
  allPassed: boolean;
  results: MLPResult[];
}

export interface AudioSettings {
  muted: boolean;
  crtHum: boolean;
}
