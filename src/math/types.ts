export type FunctionFamily =
  | 'polynomial_deg1'
  | 'polynomial_deg2'
  | 'polynomial_deg3'
  | 'polynomial_deg4'
  | 'rational_deg1_1'
  | 'rational_deg2_1'
  | 'exponential'
  | 'logarithmic'
  | 'general';

export interface Interval {
  start: number; // -Infinity or number
  end: number;   // +Infinity or number
  startOpen: boolean;
  endOpen: boolean;
  label?: string; // e.g. "(-∞; 1)"
}

export interface CriticalPoint {
  x: number;
  y: number;
  type: 'max' | 'min' | 'inflection' | 'stationary' | 'undefined';
  label: string;
  exactX?: string;
  exactY?: string;
}

export interface Asymptote {
  type: 'vertical' | 'horizontal' | 'oblique';
  equation: string; // e.g., "x = 1", "y = 2", "y = 2x - 1"
  latex: string;
  // Numerical coefficients for graphing
  xVal?: number; // for vertical x = xVal
  slope?: number; // for oblique/horizontal y = slope * x + intercept
  intercept?: number;
}

export interface Hole {
  x: number;
  y: number;
  exactX: string;
  exactY: string;
}

export interface AxisIntersection {
  axis: 'Ox' | 'Oy';
  x: number;
  y: number;
  exactLabel: string;
  isApproximate?: boolean;
}

export interface MonotonicInterval {
  interval: Interval;
  direction: 'increasing' | 'decreasing' | 'constant';
  latex: string;
}

export interface VariationMilestone {
  x: number;
  label: string; // e.g. "-\\infty", "-1", "1", "+\\infty"
  yPrimeValue: '0' | '+' | '-' | 'undefined_single' | 'undefined_double';
  yValue?: string; // value at the point
  yLeftLimit?: string;  // limit as x -> milestone-
  yRightLimit?: string; // limit as x -> milestone+
  isUndefined: boolean;
  isHole?: boolean;
}

export interface VariationSegment {
  sign: '+' | '-';
  direction: 'up' | 'down';
  fromY: string;
  toY: string;
}

export interface VariationTableData {
  milestones: VariationMilestone[];
  segments: VariationSegment[];
}

export interface GraphBranchPoint {
  x: number;
  y: number;
}

export interface InvestigationResult {
  family: FunctionFamily;
  originalExpr: string;
  standardFormulaLatex: string;
  domainLatex: string;
  domainExplanation: string;
  restrictedInterval?: { min: number; max: number };
  
  // Derivatives
  fPrimeLatex: string;
  fPrimeRootsLatex: string;
  fDoublePrimeLatex?: string;
  fDoublePrimeRootsLatex?: string;

  // Sign & Monotonicity
  monotonicIntervals: MonotonicInterval[];
  monotonicExplanation: string;

  // Extrema
  extrema: CriticalPoint[];
  extremaExplanation: string;

  // Limits & Asymptotes
  limitsLatex: string[];
  asymptotes: Asymptote[];
  holes: Hole[];
  asymptoteExplanation: string;

  // Special Points
  intersections: AxisIntersection[];
  symmetryCenter?: { x: number; y: number; label: string; latex: string };
  symmetryAxis?: { equation: string; latex: string };
  inflectionPoints: CriticalPoint[];

  // Table
  variationTable: VariationTableData;

  // Function evaluation for graphing
  evaluate: (x: number) => number | null;
  evaluateFPrime: (x: number) => number | null;
  excludedPoints: number[]; // points where denominator = 0 or outside domain

  // Warnings / notices
  warnings?: string[];
  hasApproximateRoots?: boolean;
}
