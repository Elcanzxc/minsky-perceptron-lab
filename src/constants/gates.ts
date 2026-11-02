import type {
  GateType,
  Language,
  MLPWiring,
  NonSeparableGate,
  Point2D,
  SeparableGate,
  Weights,
} from '../types/perceptron';

export interface GateDefinition {
  type: GateType;
  isLinearlySeparable: boolean;
  /** Theoretically optimal weights (for XOR/XNOR: the best possible single line, 75%). */
  canonicalWeights: Weights;
  points: Point2D[];
  /** Boolean formula of the gate. */
  formula: string;
  description: Record<Language, string>;
}

const truth = (t00: 0 | 1, t01: 0 | 1, t10: 0 | 1, t11: 0 | 1): Point2D[] => [
  { x1: 0, x2: 0, target: t00 },
  { x1: 0, x2: 1, target: t01 },
  { x1: 1, x2: 0, target: t10 },
  { x1: 1, x2: 1, target: t11 },
];

export const GATE_DEFINITIONS: Record<GateType, GateDefinition> = {
  AND: {
    type: 'AND',
    isLinearlySeparable: true,
    canonicalWeights: { w1: 1.0, w2: 1.0, bias: -1.5 },
    points: truth(0, 0, 0, 1),
    formula: 'y = x₁ ∧ x₂',
    description: {
      EN: 'Fires only when BOTH inputs are 1. One straight line cuts the corner (1,1) away from the rest.',
      AZ: 'Yalnız HƏR İKİ giriş 1 olduqda aktivləşir. Bir düz xətt (1,1) küncünü digər nöqtələrdən ayırır.',
      RU: 'Срабатывает, только когда ОБА входа равны 1. Одна прямая отсекает угол (1,1) от остальных точек.',
    },
  },
  NAND: {
    type: 'NAND',
    isLinearlySeparable: true,
    canonicalWeights: { w1: -1.0, w2: -1.0, bias: 1.5 },
    points: truth(1, 1, 1, 0),
    formula: 'y = ¬(x₁ ∧ x₂)',
    description: {
      EN: 'The inverse of AND — and a universal gate: any digital circuit can be built from NAND alone.',
      AZ: 'AND-in tərsi və universal qapı: istənilən rəqəmsal sxem yalnız NAND-lardan qurula bilər.',
      RU: 'Инверсия AND и универсальный вентиль: любую цифровую схему можно собрать из одних NAND.',
    },
  },
  OR: {
    type: 'OR',
    isLinearlySeparable: true,
    canonicalWeights: { w1: 1.0, w2: 1.0, bias: -0.5 },
    points: truth(0, 1, 1, 1),
    formula: 'y = x₁ ∨ x₂',
    description: {
      EN: 'Fires when AT LEAST ONE input is 1. One line separates (0,0) from the other three corners.',
      AZ: 'Girişlərdən ƏN AZI BİRİ 1 olduqda aktivləşir. Bir xətt (0,0)-ı digər üç küncdən ayırır.',
      RU: 'Срабатывает, если ХОТЯ БЫ ОДИН вход равен 1. Одна прямая отделяет (0,0) от трёх других углов.',
    },
  },
  NOR: {
    type: 'NOR',
    isLinearlySeparable: true,
    canonicalWeights: { w1: -1.0, w2: -1.0, bias: 0.5 },
    points: truth(1, 0, 0, 0),
    formula: 'y = ¬(x₁ ∨ x₂)',
    description: {
      EN: 'Fires only when both inputs are 0. Also universal — the Apollo Guidance Computer was built from NOR gates.',
      AZ: 'Yalnız hər iki giriş 0 olduqda aktivləşir. Universaldır — Apollon kompüteri NOR qapılarından qurulmuşdu.',
      RU: 'Срабатывает, только когда оба входа равны 0. Тоже универсален — бортовой компьютер «Аполлона» собран из NOR.',
    },
  },
  XOR: {
    type: 'XOR',
    isLinearlySeparable: false,
    canonicalWeights: { w1: 1.0, w2: 1.0, bias: -1.0 },
    points: truth(0, 1, 1, 0),
    formula: 'y = x₁ ⊕ x₂',
    description: {
      EN: 'Fires when the inputs DIFFER. The 1s sit on one diagonal, the 0s on the other — no single line can split them.',
      AZ: 'Girişlər FƏRQLİ olduqda aktivləşir. 1-lər bir diaqonalda, 0-lar digərində — heç bir tək xətt onları ayıra bilməz.',
      RU: 'Срабатывает, когда входы РАЗНЫЕ. Единицы лежат на одной диагонали, нули — на другой: одной прямой их не разделить.',
    },
  },
  XNOR: {
    type: 'XNOR',
    isLinearlySeparable: false,
    canonicalWeights: { w1: -1.0, w2: -1.0, bias: 1.0 },
    points: truth(1, 0, 0, 1),
    formula: 'y = ¬(x₁ ⊕ x₂)',
    description: {
      EN: 'The equality detector: fires when the inputs are the SAME. Exactly as impossible for one line as XOR.',
      AZ: 'Bərabərlik detektoru: girişlər EYNİ olduqda aktivləşir. Tək xətt üçün XOR qədər mümkünsüzdür.',
      RU: 'Детектор равенства: срабатывает, когда входы ОДИНАКОВЫ. Для одной прямой так же невозможен, как XOR.',
    },
  },
};

export const SEPARABLE_GATES: SeparableGate[] = ['AND', 'OR', 'NAND', 'NOR'];
export const NON_SEPARABLE_GATES: NonSeparableGate[] = ['XOR', 'XNOR'];

export const isNonSeparable = (gate: GateType): gate is NonSeparableGate =>
  gate === 'XOR' || gate === 'XNOR';

/** Textbook decompositions:
 *  XOR(x₁,x₂)  = AND( OR(x₁,x₂),  NAND(x₁,x₂) )
 *  XNOR(x₁,x₂) = OR ( AND(x₁,x₂), NOR(x₁,x₂)  )
 */
export const CANONICAL_WIRING: Record<NonSeparableGate, MLPWiring> = {
  XOR: { h1: 'OR', h2: 'NAND', out: 'AND' },
  XNOR: { h1: 'AND', h2: 'NOR', out: 'OR' },
};
