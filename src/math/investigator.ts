import { formatIntervalLatex, formatNumberLatex, Fraction } from './fractions';
import { ASTNode, evaluateAST, parseExpression, ParsedFunction } from './parser';
import { Polynomial, RootInfo } from './polynomial';
import {
  Asymptote,
  AxisIntersection,
  CriticalPoint,
  FunctionFamily,
  Hole,
  InvestigationResult,
  MonotonicInterval,
  VariationMilestone,
  VariationSegment,
  VariationTableData,
} from './types';

export function investigateFunction(
  rawInput: string,
  userInterval?: { min: number; max: number }
): InvestigationResult {
  const parsed = parseExpression(rawInput);

  if (parsed.isRational) {
    return investigateRational(parsed, userInterval);
  }

  if (parsed.isExponential && parsed.expParams) {
    return investigateExponential(parsed, userInterval);
  }

  if (parsed.isLogarithmic && parsed.logParams) {
    return investigateLogarithmic(parsed, userInterval);
  }

  // Fallback for general expressions
  return investigateGeneral(parsed, userInterval);
}

function investigateRational(
  parsed: ParsedFunction,
  userInterval?: { min: number; max: number }
): InvestigationResult {
  const P = parsed.numeratorPoly!;
  const Q = parsed.denominatorPoly!;

  const pDeg = P.degree;
  const qDeg = Q.degree;

  // Check if pure polynomial
  if (qDeg === 0) {
    return investigatePurePolynomial(P, parsed, userInterval);
  }

  // Check common roots (removable singularities / holes vs vertical asymptotes)
  const qRoots = Q.findRealRoots();
  const holes: Hole[] = [];
  const verticalAsymptotes: Asymptote[] = [];
  const excludedPoints: number[] = [];

  for (const qr of qRoots) {
    excludedPoints.push(qr.x);
    // Check if P(qr.x) == 0
    const pVal = P.evaluate(qr.x);
    if (Math.abs(pVal) < 1e-6) {
      // Common factor!
      const { quotient: pReduced } = P.divide(new Polynomial([1, -qr.x]));
      const { quotient: qReduced } = Q.divide(new Polynomial([1, -qr.x]));
      const limVal = pReduced.evaluate(qr.x) / qReduced.evaluate(qr.x);

      holes.push({
        x: qr.x,
        y: limVal,
        exactX: formatNumberLatex(qr.x),
        exactY: formatNumberLatex(limVal),
      });
    } else {
      // True pole -> Vertical asymptote!
      verticalAsymptotes.push({
        type: 'vertical',
        equation: `x = ${formatNumberLatex(qr.x)}`,
        latex: `x = ${formatNumberLatex(qr.x)}`,
        xVal: qr.x,
      });
    }
  }

  let family: FunctionFamily = 'rational_deg1_1';
  if (pDeg === 2 && qDeg === 1) {
    family = 'rational_deg2_1';
  } else if (pDeg > 2 || qDeg > 1) {
    family = 'general';
  }

  // Domain D
  let domainLatex = '\\mathbb{R}';
  let domainExplanation = 'Tập xác định: ';
  if (excludedPoints.length > 0) {
    const sortedExcluded = [...excludedPoints].sort((a, b) => a - b);
    const exclStr = sortedExcluded.map((pt) => formatNumberLatex(pt)).join(';\\, ');
    domainLatex = `\\mathbb{R} \\setminus \\{${exclStr}\\}`;
    domainExplanation = `Điều kiện xác định: $${Q.toLatex()} \\neq 0 \\Leftrightarrow x \\neq ${exclStr}$.\nVậy tập xác định là $D = \\mathbb{R} \\setminus \\{${exclStr}\\}$.`;
  } else {
    domainExplanation = `Do mẫu số luôn khác 0, tập xác định là $D = \\mathbb{R}$.`;
  }

  // Derivative: f'(x) = (P'*Q - P*Q') / Q^2
  const PPrime = P.derivative();
  const QPrime = Q.derivative();
  const numDerivative = PPrime.multiply(Q).subtract(P.multiply(QPrime));
  // Standard latex of f'(x)
  const fPrimeLatex = `\\frac{${numDerivative.toLatex()}}{(${Q.toLatex()})^2}`;

  // Find critical points: numDerivative = 0
  const fPrimeRoots = numDerivative.findRealRoots().filter((r) => !excludedPoints.some((ep) => Math.abs(ep - r.x) < 1e-6));
  const fPrimeRootsLatex =
    fPrimeRoots.length > 0
      ? `f'(x) = 0 \\Leftrightarrow ${numDerivative.toLatex()} = 0 \\Leftrightarrow x \\in \\{${fPrimeRoots.map((r) => r.latex).join(';\\, ')}\\}`
      : `f'(x) = 0 \\Leftrightarrow ${numDerivative.toLatex()} = 0 \\text{ (phương trình vô nghiệm)}`;

  // Evaluate f and f'
  const evaluate = (x: number) => {
    if (excludedPoints.some((ep) => Math.abs(ep - x) < 1e-6)) return null;
    const qVal = Q.evaluate(x);
    if (Math.abs(qVal) < 1e-12) return null;
    return P.evaluate(x) / qVal;
  };

  const evaluateFPrime = (x: number) => {
    if (excludedPoints.some((ep) => Math.abs(ep - x) < 1e-6)) return null;
    const qVal = Q.evaluate(x);
    if (Math.abs(qVal) < 1e-12) return null;
    return numDerivative.evaluate(x) / (qVal * qVal);
  };

  // Extrema: classify roots of f'
  const extrema: CriticalPoint[] = [];
  for (const r of fPrimeRoots) {
    const eps = 1e-3;
    const dLeft = evaluateFPrime(r.x - eps);
    const dRight = evaluateFPrime(r.x + eps);
    const yVal = evaluate(r.x);

    if (dLeft !== null && dRight !== null && yVal !== null) {
      if (dLeft > 0 && dRight < 0) {
        extrema.push({
          x: r.x,
          y: yVal,
          type: 'max',
          label: `Điểm cực đại (${formatNumberLatex(r.x)}; ${formatNumberLatex(yVal)})`,
          exactX: formatNumberLatex(r.x),
          exactY: formatNumberLatex(yVal),
        });
      } else if (dLeft < 0 && dRight > 0) {
        extrema.push({
          x: r.x,
          y: yVal,
          type: 'min',
          label: `Điểm cực tiểu (${formatNumberLatex(r.x)}; ${formatNumberLatex(yVal)})`,
          exactX: formatNumberLatex(r.x),
          exactY: formatNumberLatex(yVal),
        });
      }
    }
  }

  // Asymptotes:
  const asymptotes: Asymptote[] = [...verticalAsymptotes];
  const limitsLatex: string[] = [];

  // Horizontal or Oblique asymptote
  if (pDeg < qDeg) {
    asymptotes.push({
      type: 'horizontal',
      equation: 'y = 0',
      latex: 'y = 0',
      slope: 0,
      intercept: 0,
    });
    limitsLatex.push('\\lim_{x \\to \\pm\\infty} f(x) = 0');
  } else if (pDeg === qDeg) {
    const { remainder } = P.divide(Q);
    const isZeroRemainder = remainder.degree === 0 && Math.abs(remainder.coeffs[0]) < 1e-9;
    if (!isZeroRemainder) {
      const hVal = P.leadingCoefficient / Q.leadingCoefficient;
      asymptotes.push({
        type: 'horizontal',
        equation: `y = ${formatNumberLatex(hVal)}`,
        latex: `y = ${formatNumberLatex(hVal)}`,
        slope: 0,
        intercept: hVal,
      });
      limitsLatex.push(`\\lim_{x \\to +\\infty} f(x) = ${formatNumberLatex(hVal)}`, `\\lim_{x \\to -\\infty} f(x) = ${formatNumberLatex(hVal)}`);
    }
  } else if (pDeg === qDeg + 1) {
    // Oblique asymptote via long division: only when quotient is degree 1 (mx + n) and remainder != 0!
    const { quotient, remainder } = P.divide(Q);
    const isZeroRemainder = remainder.degree === 0 && Math.abs(remainder.coeffs[0]) < 1e-9;
    if (!isZeroRemainder && quotient.degree === 1) {
      const m = quotient.coeffs[0];
      const n = quotient.coeffs[1] ?? 0;
      const qLatex = quotient.toLatex();
      const rLatex = remainder.toLatex();
      const dLatex = Q.toLatex();

      asymptotes.push({
        type: 'oblique',
        equation: `y = ${qLatex}`,
        latex: `y = ${qLatex}`,
        slope: m,
        intercept: n,
      });
      limitsLatex.push(
        `\\lim_{x \\to +\\infty} [f(x) - (${qLatex})] = \\lim_{x \\to +\\infty} \\frac{${rLatex}}{${dLatex}} = 0`,
        `\\lim_{x \\to -\\infty} [f(x) - (${qLatex})] = \\lim_{x \\to -\\infty} \\frac{${rLatex}}{${dLatex}} = 0`
      );
    } else {
      limitsLatex.push('\\lim_{x \\to +\\infty} f(x) = \\pm\\infty', '\\lim_{x \\to -\\infty} f(x) = \\pm\\infty');
    }
  } else {
    // Degree of numerator >= degree of denominator + 2: no oblique asymptote
    limitsLatex.push('\\lim_{x \\to +\\infty} f(x) = \\pm\\infty', '\\lim_{x \\to -\\infty} f(x) = \\pm\\infty');
  }

  // One-sided limits for vertical asymptotes
  for (const va of verticalAsymptotes) {
    const x0 = va.xVal!;
    const eps = 1e-4;
    const yLeft = evaluate(x0 - eps) ?? 0;
    const yRight = evaluate(x0 + eps) ?? 0;
    const limLeft = yLeft > 0 ? '+\\infty' : '-\\infty';
    const limRight = yRight > 0 ? '+\\infty' : '-\\infty';
    limitsLatex.push(`\\lim_{x \\to ${formatNumberLatex(x0)}^-} f(x) = ${limLeft}`, `\\lim_{x \\to ${formatNumberLatex(x0)}^+} f(x) = ${limRight}`);
  }

  // Holes limits
  for (const h of holes) {
    limitsLatex.push(`\\lim_{x \\to ${h.exactX}} f(x) = ${h.exactY} \\text{ (điểm khuyết, không phải tiệm cận)}`);
  }

  // Explanation for asymptotes
  let asymptoteExplanation = '';
  if (verticalAsymptotes.length > 0) {
    asymptoteExplanation += `• Tiệm cận đứng: ${verticalAsymptotes.map((v) => `$${v.latex}$`).join(', ')} (do các giới hạn một bên khi $x$ tiến về điểm gián đoạn có kết quả vô cực).\n`;
  }
  const horiz = asymptotes.filter((a) => a.type === 'horizontal');
  if (horiz.length > 0) {
    asymptoteExplanation += `• Tiệm cận ngang: ${horiz.map((h) => `$${h.latex}$`).join(', ')} (do $\\lim_{x \\to \\pm\\infty} f(x) = ${formatNumberLatex(horiz[0].intercept ?? 0)}$).\n`;
  }
  const obliq = asymptotes.filter((a) => a.type === 'oblique');
  if (obliq.length > 0) {
    const { quotient, remainder } = P.divide(Q);
    asymptoteExplanation += `• Tiệm cận xiên: Thực hiện phép chia đa thức tử cho mẫu ta được:\n  $$f(x) = ${quotient.toLatex()} + \\frac{${remainder.toLatex()}}{${Q.toLatex()}}$$\n  Vì $\\lim_{x \\to \\pm\\infty} [f(x) - (${quotient.toLatex()})] = \\lim_{x \\to \\pm\\infty} \\frac{${remainder.toLatex()}}{${Q.toLatex()}} = 0$, đồ thị hàm số có đường tiệm cận xiên là $${obliq[0].latex}$.\n`;
  }
  if (holes.length > 0) {
    asymptoteExplanation += `• Lưu ý: Tại $x = ${holes.map((h) => h.exactX).join(', ')}$, giới hạn hữu hạn bằng $${holes.map((h) => h.exactY).join(', ')}$ nên đồ thị có điểm khuyết $(${holes[0].exactX}; ${holes[0].exactY})$, không có tiệm cận đứng tại đây.\n`;
  }
  if (asymptotes.length === 0 && holes.length === 0) {
    asymptoteExplanation = 'Đồ thị không có đường tiệm cận.';
  }

  // Monotonic intervals
  const boundaryPoints = [...new Set([...excludedPoints, ...fPrimeRoots.map((r) => r.x)])].sort((a, b) => a - b);
  const monotonicIntervals: MonotonicInterval[] = [];
  const allIntervals: { start: number; end: number }[] = [];

  const bounds = [-Infinity, ...boundaryPoints, Infinity];
  for (let i = 0; i < bounds.length - 1; i++) {
    const start = bounds[i];
    const end = bounds[i + 1];
    allIntervals.push({ start, end });
    const mid = start === -Infinity ? end - 2 : end === Infinity ? start + 2 : (start + end) / 2;
    const dVal = evaluateFPrime(mid) ?? 0;
    const dir = dVal > 0 ? 'increasing' : 'decreasing';
    monotonicIntervals.push({
      interval: { start, end, startOpen: true, endOpen: true },
      direction: dir,
      latex: formatIntervalLatex(start, end),
    });
  }

  const inc = monotonicIntervals.filter((m) => m.direction === 'increasing').map((m) => `$${m.latex}$`);
  const dec = monotonicIntervals.filter((m) => m.direction === 'decreasing').map((m) => `$${m.latex}$`);
  let monotonicExplanation = '';
  if (inc.length > 0) {
    monotonicExplanation += `Hàm số đồng biến trên các khoảng: ${inc.join(' và ')}.\n`;
  }
  if (dec.length > 0) {
    monotonicExplanation += `Hàm số nghịch biến trên các khoảng: ${dec.join(' và ')}.`;
  }

  // Extrema explanation
  let extremaExplanation = '';
  if (extrema.length === 0) {
    extremaExplanation = 'Hàm số không có cực trị.';
  } else {
    extremaExplanation = extrema
      .map((e) =>
        e.type === 'max'
          ? `Hàm số đạt cực đại tại $x = ${e.exactX}$, giá trị cực đại $y_{\\text{CĐ}} = ${e.exactY}$. Tọa độ điểm cực đại: $(${e.exactX}; ${e.exactY})$.`
          : `Hàm số đạt cực tiểu tại $x = ${e.exactX}$, giá trị cực tiểu $y_{\\text{CT}} = ${e.exactY}$. Tọa độ điểm cực tiểu: $(${e.exactX}; ${e.exactY})$.`
      )
      .join('\n');
  }

  // Intersections
  const intersections: AxisIntersection[] = [];
  // Oy: x = 0
  if (!excludedPoints.some((ep) => Math.abs(ep) < 1e-6)) {
    const y0 = evaluate(0);
    if (y0 !== null && Number.isFinite(y0)) {
      intersections.push({
        axis: 'Oy',
        x: 0,
        y: y0,
        exactLabel: `(0; ${formatNumberLatex(y0)})`,
      });
    }
  }
  // Ox: P(x) = 0
  const pRoots = P.findRealRoots().filter((pr) => !excludedPoints.some((ep) => Math.abs(ep - pr.x) < 1e-6));
  for (const pr of pRoots) {
    intersections.push({
      axis: 'Ox',
      x: pr.x,
      y: 0,
      exactLabel: `(${pr.latex}; 0)`,
      isApproximate: !pr.isExact,
    });
  }

  // Center of symmetry (tâm đối xứng)
  let symmetryCenter: { x: number; y: number; label: string; latex: string } | undefined;
  if (family === 'rational_deg1_1' && verticalAsymptotes.length === 1 && horiz.length === 1) {
    const ix = verticalAsymptotes[0].xVal!;
    const iy = horiz[0].intercept!;
    symmetryCenter = {
      x: ix,
      y: iy,
      label: `Tâm đối xứng I(${formatNumberLatex(ix)}; ${formatNumberLatex(iy)})`,
      latex: `I\\left(${formatNumberLatex(ix)};\\, ${formatNumberLatex(iy)}\\right)`,
    };
  } else if (family === 'rational_deg2_1' && verticalAsymptotes.length === 1 && obliq.length === 1) {
    const ix = verticalAsymptotes[0].xVal!;
    const iy = obliq[0].slope! * ix + obliq[0].intercept!;
    symmetryCenter = {
      x: ix,
      y: iy,
      label: `Tâm đối xứng I(${formatNumberLatex(ix)}; ${formatNumberLatex(iy)})`,
      latex: `I\\left(${formatNumberLatex(ix)};\\, ${formatNumberLatex(iy)}\\right)`,
    };
  }

  // Build Variation Table Data
  const variationTable = buildVariationTable({
    boundaryPoints,
    excludedPoints,
    holes,
    fPrimeRoots,
    evaluate,
    evaluateFPrime,
    userInterval,
    family,
  });

  return {
    family,
    originalExpr: parsed.raw,
    standardFormulaLatex: `y = \\frac{${P.toLatex()}}{${Q.toLatex()}}`,
    domainLatex,
    domainExplanation,
    restrictedInterval: userInterval,
    fPrimeLatex,
    fPrimeRootsLatex,
    monotonicIntervals,
    monotonicExplanation,
    extrema,
    extremaExplanation,
    limitsLatex,
    asymptotes,
    holes,
    asymptoteExplanation,
    intersections,
    symmetryCenter,
    inflectionPoints: [],
    variationTable,
    evaluate,
    evaluateFPrime,
    excludedPoints,
  };
}

function investigatePurePolynomial(
  P: Polynomial,
  parsed: ParsedFunction,
  userInterval?: { min: number; max: number }
): InvestigationResult {
  const deg = P.degree;
  let family: FunctionFamily = 'polynomial_deg1';
  if (deg === 2) family = 'polynomial_deg2';
  if (deg === 3) family = 'polynomial_deg3';
  if (deg >= 4) family = 'polynomial_deg4';

  const domainLatex = '\\mathbb{R}';
  const domainExplanation = 'Tập xác định: $D = \\mathbb{R}$.';

  const PPrime = P.derivative();
  const PDoublePrime = PPrime.derivative();

  const fPrimeLatex = PPrime.toLatex();
  const fDoublePrimeLatex = PDoublePrime.toLatex();

  const fPrimeRoots = PPrime.findRealRoots();
  const fPrimeRootsLatex =
    fPrimeRoots.length > 0
      ? `f'(x) = 0 \\Leftrightarrow ${PPrime.toLatex()} = 0 \\Leftrightarrow x \\in \\{${fPrimeRoots.map((r) => r.latex).join(';\\, ')}\\}`
      : `f'(x) = 0 \\Leftrightarrow ${PPrime.toLatex()} = 0 \\text{ (vô nghiệm trên } \\mathbb{R}\\text{)}`;

  const fDoublePrimeRoots = PDoublePrime.findRealRoots();
  const fDoublePrimeRootsLatex =
    fDoublePrimeRoots.length > 0
      ? `f''(x) = 0 \\Leftrightarrow ${PDoublePrime.toLatex()} = 0 \\Leftrightarrow x = ${fDoublePrimeRoots.map((r) => r.latex).join(';\\, ')}`
      : undefined;

  const evaluate = (x: number) => P.evaluate(x);
  const evaluateFPrime = (x: number) => PPrime.evaluate(x);

  // Extrema: classify via first or second derivative
  const extrema: CriticalPoint[] = [];
  for (const r of fPrimeRoots) {
    const d2 = PDoublePrime.evaluate(r.x);
    const yVal = P.evaluate(r.x);
    if (d2 < -1e-6) {
      extrema.push({
        x: r.x,
        y: yVal,
        type: 'max',
        label: `Điểm cực đại (${formatNumberLatex(r.x)}; ${formatNumberLatex(yVal)})`,
        exactX: formatNumberLatex(r.x),
        exactY: formatNumberLatex(yVal),
      });
    } else if (d2 > 1e-6) {
      extrema.push({
        x: r.x,
        y: yVal,
        type: 'min',
        label: `Điểm cực tiểu (${formatNumberLatex(r.x)}; ${formatNumberLatex(yVal)})`,
        exactX: formatNumberLatex(r.x),
        exactY: formatNumberLatex(yVal),
      });
    } else {
      // test sign change
      const eps = 1e-3;
      const dL = evaluateFPrime(r.x - eps);
      const dR = evaluateFPrime(r.x + eps);
      if (dL > 0 && dR < 0) {
        extrema.push({
          x: r.x,
          y: yVal,
          type: 'max',
          label: `Điểm cực đại (${formatNumberLatex(r.x)}; ${formatNumberLatex(yVal)})`,
          exactX: formatNumberLatex(r.x),
          exactY: formatNumberLatex(yVal),
        });
      } else if (dL < 0 && dR > 0) {
        extrema.push({
          x: r.x,
          y: yVal,
          type: 'min',
          label: `Điểm cực tiểu (${formatNumberLatex(r.x)}; ${formatNumberLatex(yVal)})`,
          exactX: formatNumberLatex(r.x),
          exactY: formatNumberLatex(yVal),
        });
      }
    }
  }

  // Inflection points (điểm uốn)
  const inflectionPoints: CriticalPoint[] = [];
  let symmetryCenter: { x: number; y: number; label: string; latex: string } | undefined;
  if (deg === 3 && fDoublePrimeRoots.length > 0) {
    const iu = fDoublePrimeRoots[0].x;
    const yu = P.evaluate(iu);
    const ipt: CriticalPoint = {
      x: iu,
      y: yu,
      type: 'inflection',
      label: `Điểm uốn U(${formatNumberLatex(iu)}; ${formatNumberLatex(yu)})`,
      exactX: formatNumberLatex(iu),
      exactY: formatNumberLatex(yu),
    };
    inflectionPoints.push(ipt);
    symmetryCenter = {
      x: iu,
      y: yu,
      label: `Tâm đối xứng I(${formatNumberLatex(iu)}; ${formatNumberLatex(yu)})`,
      latex: `I\\left(${formatNumberLatex(iu)};\\, ${formatNumberLatex(yu)}\\right)`,
    };
  }

  // Symmetry axis for biquadratic / quadratic
  let symmetryAxis: { equation: string; latex: string } | undefined;
  if (deg === 2) {
    const ax = -P.coeffs[1] / (2 * P.coeffs[0]);
    symmetryAxis = {
      equation: `x = ${formatNumberLatex(ax)}`,
      latex: `x = ${formatNumberLatex(ax)}`,
    };
  } else if (deg === 4 && Math.abs(P.coeffs[1]) < 1e-9 && Math.abs(P.coeffs[3]) < 1e-9) {
    // Pure biquadratic ax^4 + bx^2 + c
    symmetryAxis = {
      equation: 'x = 0',
      latex: 'x = 0 \\text{ (Trục } Oy\\text{)}',
    };
  }

  // Limits at infinity
  const an = P.leadingCoefficient;
  const limPos = an > 0 ? '+\\infty' : '-\\infty';
  let limNeg = limPos;
  if (deg % 2 !== 0) {
    limNeg = an > 0 ? '-\\infty' : '+\\infty';
  }
  const limitsLatex = [`\\lim_{x \\to +\\infty} f(x) = ${limPos}`, `\\lim_{x \\to -\\infty} f(x) = ${limNeg}`];

  // Monotonic intervals
  const boundaryPoints = fPrimeRoots.map((r) => r.x).sort((a, b) => a - b);
  const bounds = [-Infinity, ...boundaryPoints, Infinity];
  const monotonicIntervals: MonotonicInterval[] = [];

  for (let i = 0; i < bounds.length - 1; i++) {
    const start = bounds[i];
    const end = bounds[i + 1];
    const mid = start === -Infinity ? end - 2 : end === Infinity ? start + 2 : (start + end) / 2;
    const dVal = evaluateFPrime(mid);
    const dir = dVal > 0 ? 'increasing' : 'decreasing';
    monotonicIntervals.push({
      interval: { start, end, startOpen: true, endOpen: true },
      direction: dir,
      latex: formatIntervalLatex(start, end),
    });
  }

  const inc = monotonicIntervals.filter((m) => m.direction === 'increasing').map((m) => `$${m.latex}$`);
  const dec = monotonicIntervals.filter((m) => m.direction === 'decreasing').map((m) => `$${m.latex}$`);
  let monotonicExplanation = '';
  if (inc.length > 0) monotonicExplanation += `Hàm số đồng biến trên các khoảng: ${inc.join(' và ')}.\n`;
  if (dec.length > 0) monotonicExplanation += `Hàm số nghịch biến trên các khoảng: ${dec.join(' và ')}.`;

  let extremaExplanation = '';
  if (extrema.length === 0) {
    extremaExplanation = 'Hàm số không có cực trị.';
  } else {
    extremaExplanation = extrema
      .map((e) =>
        e.type === 'max'
          ? `Hàm số đạt cực đại tại $x = ${e.exactX}$, giá trị cực đại $y_{\\text{CĐ}} = ${e.exactY}$. Tọa độ điểm cực đại: $(${e.exactX}; ${e.exactY})$.`
          : `Hàm số đạt cực tiểu tại $x = ${e.exactX}$, giá trị cực tiểu $y_{\\text{CT}} = ${e.exactY}$. Tọa độ điểm cực tiểu: $(${e.exactX}; ${e.exactY})$.`
      )
      .join('\n');
  }

  // Intersections
  const intersections: AxisIntersection[] = [];
  // Oy
  const y0 = P.evaluate(0);
  intersections.push({
    axis: 'Oy',
    x: 0,
    y: y0,
    exactLabel: `(0; ${formatNumberLatex(y0)})`,
  });
  // Ox
  const roots = P.findRealRoots();
  for (const r of roots) {
    intersections.push({
      axis: 'Ox',
      x: r.x,
      y: 0,
      exactLabel: `(${r.latex}; 0)`,
      isApproximate: !r.isExact,
    });
  }

  const variationTable = buildVariationTable({
    boundaryPoints,
    excludedPoints: [],
    holes: [],
    fPrimeRoots,
    evaluate,
    evaluateFPrime,
    userInterval,
    family,
  });

  return {
    family,
    originalExpr: parsed.raw,
    standardFormulaLatex: `y = ${P.toLatex()}`,
    domainLatex,
    domainExplanation,
    restrictedInterval: userInterval,
    fPrimeLatex,
    fPrimeRootsLatex,
    fDoublePrimeLatex,
    fDoublePrimeRootsLatex,
    monotonicIntervals,
    monotonicExplanation,
    extrema,
    extremaExplanation,
    limitsLatex,
    asymptotes: [],
    holes: [],
    asymptoteExplanation: 'Hàm đa thức không có tiệm cận.',
    intersections,
    symmetryCenter,
    symmetryAxis,
    inflectionPoints,
    variationTable,
    evaluate,
    evaluateFPrime,
    excludedPoints: [],
  };
}

function investigateExponential(
  parsed: ParsedFunction,
  userInterval?: { min: number; max: number }
): InvestigationResult {
  const { A, base, k, h, B } = parsed.expParams!;
  const family: FunctionFamily = 'exponential';

  const domainLatex = '\\mathbb{R}';
  const domainExplanation = 'Tập xác định: $D = \\mathbb{R}$.';

  // Derivative: f'(x) = A * k * ln(base) * base^(k*x + h)
  const lnBase = Math.log(base);
  const derivCoeff = A * k * lnBase;
  const isIncreasing = derivCoeff > 0;

  const baseStr = Math.abs(base - Math.E) < 1e-6 ? 'e' : `${base}`;
  const powerStr = k === 1 && h === 0 ? 'x' : h === 0 ? `${k}x` : `${k}x ${h > 0 ? '+' : '-'} ${Math.abs(h)}`;
  const formulaLatex = `y = ${A !== 1 ? `${A} \\cdot ` : ''}${baseStr}^{${powerStr}}${B !== 0 ? ` ${B > 0 ? '+' : '-'} ${Math.abs(B)}` : ''}`;

  const fPrimeLatex = `${formatNumberLatex(derivCoeff)} \\cdot ${baseStr}^{${powerStr}}`;
  const fPrimeRootsLatex = `f'(x) = 0 \\text{ vô nghiệm (do } ${baseStr}^{${powerStr}} > 0, \\forall x \\in \\mathbb{R}\\text{)}`;

  const evaluate = (x: number) => A * Math.pow(base, k * x + h) + B;
  const evaluateFPrime = (x: number) => derivCoeff * Math.pow(base, k * x + h);

  // Limits & Horizontal Asymptote:
  // as (k * ln(base) * x) -> -infinity, base^(k*x+h) -> 0 => lim = B
  const asymptotes: Asymptote[] = [];
  const limitsLatex: string[] = [];

  const asymptoteEq = `y = ${formatNumberLatex(B)}`;
  asymptotes.push({
    type: 'horizontal',
    equation: asymptoteEq,
    latex: asymptoteEq,
    slope: 0,
    intercept: B,
  });

  if (k * lnBase > 0) {
    limitsLatex.push(`\\lim_{x \\to -\\infty} f(x) = ${formatNumberLatex(B)}`, `\\lim_{x \\to +\\infty} f(x) = ${A > 0 ? '+\\infty' : '-\\infty'}`);
  } else {
    limitsLatex.push(`\\lim_{x \\to +\\infty} f(x) = ${formatNumberLatex(B)}`, `\\lim_{x \\to -\\infty} f(x) = ${A > 0 ? '+\\infty' : '-\\infty'}`);
  }

  const asymptoteExplanation = `• Tiệm cận ngang: $${asymptoteEq}$ (do khi $x \\to ${k * lnBase > 0 ? '-\\infty' : '+\\infty'}$, $f(x) \\to ${formatNumberLatex(B)}$).\n• Không có tiệm cận đứng.`;

  // Monotonic
  const monotonicIntervals: MonotonicInterval[] = [
    {
      interval: { start: -Infinity, end: Infinity, startOpen: true, endOpen: true },
      direction: isIncreasing ? 'increasing' : 'decreasing',
      latex: '(-\\infty;\\, +\\infty)',
    },
  ];
  const monotonicExplanation = isIncreasing
    ? 'Do $f\'(x) > 0, \\forall x \\in \\mathbb{R}$, hàm số đồng biến trên $(-\\infty;\\, +\\infty)$.'
    : 'Do $f\'(x) < 0, \\forall x \\in \\mathbb{R}$, hàm số nghịch biến trên $(-\\infty;\\, +\\infty)$.';

  const extremaExplanation = 'Hàm số không có cực trị.';

  // Intersections
  const intersections: AxisIntersection[] = [];
  const y0 = evaluate(0);
  intersections.push({
    axis: 'Oy',
    x: 0,
    y: y0,
    exactLabel: `(0; ${formatNumberLatex(y0)})`,
  });

  // Solve f(x) = 0 => base^(kx + h) = -B / A
  if (-B / A > 0) {
    const rootX = (Math.log(-B / A) / lnBase - h) / k;
    intersections.push({
      axis: 'Ox',
      x: rootX,
      y: 0,
      exactLabel: `(${formatNumberLatex(rootX)}; 0)`,
    });
  }

  const variationTable = buildVariationTable({
    boundaryPoints: [],
    excludedPoints: [],
    holes: [],
    fPrimeRoots: [],
    evaluate,
    evaluateFPrime,
    userInterval,
    family,
  });

  return {
    family,
    originalExpr: parsed.raw,
    standardFormulaLatex: formulaLatex,
    domainLatex,
    domainExplanation,
    restrictedInterval: userInterval,
    fPrimeLatex,
    fPrimeRootsLatex,
    monotonicIntervals,
    monotonicExplanation,
    extrema: [],
    extremaExplanation,
    limitsLatex,
    asymptotes,
    holes: [],
    asymptoteExplanation,
    intersections,
    inflectionPoints: [],
    variationTable,
    evaluate,
    evaluateFPrime,
    excludedPoints: [],
  };
}

function investigateLogarithmic(
  parsed: ParsedFunction,
  userInterval?: { min: number; max: number }
): InvestigationResult {
  const { A, base, k, h, B } = parsed.logParams!;
  const family: FunctionFamily = 'logarithmic';

  const rootArg = -h / k;
  const isRightDomain = k > 0;
  const domainInterval: [number, number] = isRightDomain ? [rootArg, Infinity] : [-Infinity, rootArg];
  const domainLatex = isRightDomain
    ? `(${formatNumberLatex(rootArg)};\\, +\\infty)`
    : `(-\\infty;\\, ${formatNumberLatex(rootArg)})`;

  const domainExplanation = `Điều kiện xác định: $${k !== 1 ? `${k}x` : 'x'}${h !== 0 ? ` ${h > 0 ? '+' : '-'} ${Math.abs(h)}` : ''} > 0 \\Leftrightarrow x ${isRightDomain ? '>' : '<'} ${formatNumberLatex(rootArg)}$.\nVậy tập xác định là $D = ${domainLatex}$.`;

  const baseStr = Math.abs(base - Math.E) < 1e-6 ? 'e' : `${base}`;
  const isLn = Math.abs(base - Math.E) < 1e-6;
  const lnBase = Math.log(base);

  const logLatexName = isLn ? '\\ln' : `\\log_{${baseStr}}`;
  const argLatex = `${k !== 1 ? `${k}x` : 'x'}${h !== 0 ? ` ${h > 0 ? '+' : '-'} ${Math.abs(h)}` : ''}`;
  const formulaLatex = `y = ${A !== 1 ? `${A} ` : ''}${logLatexName}(${argLatex})${B !== 0 ? ` ${B > 0 ? '+' : '-'} ${Math.abs(B)}` : ''}`;

  // Derivative: f'(x) = A * k / ((kx + h) * ln(base))
  const fPrimeLatex = `\\frac{${formatNumberLatex(A * k)}}{(${argLatex})${isLn ? '' : ` \\ln(${baseStr})`}}`;
  const fPrimeRootsLatex = `f'(x) = 0 \\text{ vô nghiệm trên } D`;

  const evaluate = (x: number) => {
    const val = k * x + h;
    if (val <= 0) return null;
    return A * (Math.log(val) / lnBase) + B;
  };

  const evaluateFPrime = (x: number) => {
    const val = k * x + h;
    if (val <= 0) return null;
    return (A * k) / (val * lnBase);
  };

  const isIncreasing = (A * k) / lnBase > 0;

  // Asymptotes: vertical at rootArg
  const vaEq = `x = ${formatNumberLatex(rootArg)}`;
  const asymptotes: Asymptote[] = [
    {
      type: 'vertical',
      equation: vaEq,
      latex: vaEq,
      xVal: rootArg,
    },
  ];

  const limitsLatex: string[] = [];
  if (isRightDomain) {
    const limBoundary = evaluate(rootArg + 1e-4) ?? 0;
    const limSign = limBoundary > 0 ? '+\\infty' : '-\\infty';
    limitsLatex.push(
      `\\lim_{x \\to (${formatNumberLatex(rootArg)})^+} f(x) = ${limSign}`,
      `\\lim_{x \\to +\\infty} f(x) = ${isIncreasing ? '+\\infty' : '-\\infty'}`
    );
  } else {
    const limBoundary = evaluate(rootArg - 1e-4) ?? 0;
    const limSign = limBoundary > 0 ? '+\\infty' : '-\\infty';
    limitsLatex.push(
      `\\lim_{x \\to (${formatNumberLatex(rootArg)})^-} f(x) = ${limSign}`,
      `\\lim_{x \\to -\\infty} f(x) = ${isIncreasing ? '-\\infty' : '+\\infty'}`
    );
  }

  const asymptoteExplanation = `• Tiệm cận đứng: $${vaEq}$ (do $\\lim_{x \\to ${formatNumberLatex(rootArg)}^{${isRightDomain ? '+' : '-'}}} f(x) = \\pm\\infty$).\n• Không có tiệm cận ngang.`;

  // Monotonic
  const monotonicIntervals: MonotonicInterval[] = [
    {
      interval: { start: domainInterval[0], end: domainInterval[1], startOpen: true, endOpen: true },
      direction: isIncreasing ? 'increasing' : 'decreasing',
      latex: domainLatex,
    },
  ];
  const monotonicExplanation = isIncreasing
    ? `Hàm số đồng biến trên toàn tập xác định $D = ${domainLatex}$.`
    : `Hàm số nghịch biến trên toàn tập xác định $D = ${domainLatex}$.`;

  // Intersections
  const intersections: AxisIntersection[] = [];
  if ((isRightDomain && 0 > rootArg) || (!isRightDomain && 0 < rootArg)) {
    const y0 = evaluate(0);
    if (y0 !== null && Number.isFinite(y0)) {
      intersections.push({
        axis: 'Oy',
        x: 0,
        y: y0,
        exactLabel: `(0; ${formatNumberLatex(y0)})`,
      });
    }
  }

  // f(x) = 0 => log_base(kx + h) = -B / A => kx + h = base^(-B/A) => x = (base^(-B/A) - h) / k
  const oxX = (Math.pow(base, -B / A) - h) / k;
  if (Number.isFinite(oxX) && ((isRightDomain && oxX > rootArg) || (!isRightDomain && oxX < rootArg))) {
    intersections.push({
      axis: 'Ox',
      x: oxX,
      y: 0,
      exactLabel: `(${formatNumberLatex(oxX)}; 0)`,
    });
  }

  const variationTable = buildVariationTable({
    boundaryPoints: [rootArg],
    excludedPoints: [rootArg],
    holes: [],
    fPrimeRoots: [],
    evaluate,
    evaluateFPrime,
    userInterval,
    family,
    isLogarithmic: true,
    logBoundary: rootArg,
    logDomainSide: isRightDomain ? 'right' : 'left',
  });

  return {
    family,
    originalExpr: parsed.raw,
    standardFormulaLatex: formulaLatex,
    domainLatex,
    domainExplanation,
    restrictedInterval: userInterval,
    fPrimeLatex,
    fPrimeRootsLatex,
    monotonicIntervals,
    monotonicExplanation,
    extrema: [],
    extremaExplanation: 'Hàm số không có cực trị.',
    limitsLatex,
    asymptotes,
    holes: [],
    asymptoteExplanation,
    intersections,
    inflectionPoints: [],
    variationTable,
    evaluate,
    evaluateFPrime,
    excludedPoints: [rootArg],
  };
}

function investigateGeneral(
  parsed: ParsedFunction,
  userInterval?: { min: number; max: number }
): InvestigationResult {
  // Numerical fallback with clear approximate indicators
  const evaluate = (x: number) => {
    const val = parsed.evaluate(x);
    return Number.isFinite(val) ? val : null;
  };

  const evaluateFPrime = (x: number) => {
    const h = 1e-5;
    const y1 = evaluate(x - h);
    const y2 = evaluate(x + h);
    if (y1 === null || y2 === null) return null;
    return (y2 - y1) / (2 * h);
  };

  return {
    family: 'general',
    originalExpr: parsed.raw,
    standardFormulaLatex: `y = f(x)`,
    domainLatex: '\\mathbb{R}',
    domainExplanation: 'Tập xác định tổng quát được khảo sát bằng phương pháp xấp xỉ.',
    restrictedInterval: userInterval,
    fPrimeLatex: "f'(x)",
    fPrimeRootsLatex: 'Đang giải bằng phương pháp giải tích số',
    monotonicIntervals: [],
    monotonicExplanation: 'Khảo sát chiều biến thiên qua mẫu số liệu giải tích số.',
    extrema: [],
    extremaExplanation: 'Chưa xác định giải tích chính xác cho dạng hàm này.',
    limitsLatex: [],
    asymptotes: [],
    holes: [],
    asymptoteExplanation: 'Chưa hỗ trợ giải tích tiệm cận chính xác cho dạng biểu thức này.',
    intersections: [],
    inflectionPoints: [],
    variationTable: { milestones: [], segments: [] },
    evaluate,
    evaluateFPrime,
    excludedPoints: [],
    warnings: ['Biểu thức chưa thuộc dạng giải tích ký hiệu chuẩn; kết quả đồ thị hiển thị theo phương pháp số trị.'],
  };
}

/**
 * Constructs rigorous Variation Table (Bảng biến thiên)
 */
interface TableBuildParams {
  boundaryPoints: number[];
  excludedPoints: number[];
  holes: Hole[];
  fPrimeRoots: RootInfo[];
  evaluate: (x: number) => number | null;
  evaluateFPrime: (x: number) => number | null;
  userInterval?: { min: number; max: number };
  family: FunctionFamily;
  isLogarithmic?: boolean;
  logBoundary?: number;
  logDomainSide?: 'left' | 'right';
}

function buildVariationTable(params: TableBuildParams): VariationTableData {
  const {
    boundaryPoints,
    excludedPoints,
    holes,
    fPrimeRoots,
    evaluate,
    evaluateFPrime,
    userInterval,
    isLogarithmic,
    logBoundary,
    logDomainSide,
  } = params;

  // Gather unique milestone x values
  const rawPoints = new Set<number>();
  for (const b of boundaryPoints) rawPoints.add(b);
  for (const ep of excludedPoints) rawPoints.add(ep);
  for (const fr of fPrimeRoots) rawPoints.add(fr.x);
  if (logBoundary !== undefined) rawPoints.add(logBoundary);

  // Filter if user specified interval
  let minBound = -Infinity;
  let maxBound = Infinity;
  if (userInterval) {
    minBound = userInterval.min;
    maxBound = userInterval.max;
  }

  // If logarithmic, domain is bounded on one side
  if (isLogarithmic && logBoundary !== undefined) {
    if (logDomainSide === 'right') {
      minBound = Math.max(minBound, logBoundary);
    } else {
      maxBound = Math.min(maxBound, logBoundary);
    }
  }

  // Sort and remove duplicates within 1e-5
  const validPoints = Array.from(rawPoints)
    .filter((pt) => pt > minBound + 1e-6 && pt < maxBound - 1e-6)
    .sort((a, b) => a - b);

  const cleanPoints: number[] = [];
  for (const p of validPoints) {
    if (!cleanPoints.some((cp) => Math.abs(cp - p) < 1e-5)) {
      cleanPoints.push(p);
    }
  }

  const milestones: VariationMilestone[] = [];

  // Left boundary milestone
  if (minBound === -Infinity) {
    milestones.push({
      x: -Infinity,
      label: '-\\infty',
      yPrimeValue: 'undefined_single',
      yValue: formatEndpointLimit(-Infinity, evaluate),
      isUndefined: false,
    });
  } else {
    const isExcluded = excludedPoints.some((ep) => Math.abs(ep - minBound) < 1e-6);
    milestones.push({
      x: minBound,
      label: formatNumberLatex(minBound),
      yPrimeValue: isExcluded ? 'undefined_double' : 'undefined_single',
      yValue: isExcluded ? formatOneSidedLimit(minBound, 'right', evaluate) : formatNumberLatex(evaluate(minBound) ?? 0),
      isUndefined: isExcluded,
    });
  }

  // Interior points
  for (const pt of cleanPoints) {
    const isExcl = excludedPoints.some((ep) => Math.abs(ep - pt) < 1e-6);
    const isHole = holes.some((h) => Math.abs(h.x - pt) < 1e-6);
    const isRootOfFPrime = fPrimeRoots.some((fr) => Math.abs(fr.x - pt) < 1e-6);

    let yPrimeValue: VariationMilestone['yPrimeValue'] = '0';
    if (isExcl) {
      yPrimeValue = 'undefined_double';
    } else if (isRootOfFPrime) {
      yPrimeValue = '0';
    } else {
      const d = evaluateFPrime(pt);
      yPrimeValue = d !== null && d > 0 ? '+' : '-';
    }

    let yVal: string | undefined;
    let yLeftLimit: string | undefined;
    let yRightLimit: string | undefined;

    if (isExcl) {
      if (isHole) {
        const h = holes.find((hl) => Math.abs(hl.x - pt) < 1e-6)!;
        yVal = h.exactY;
      } else {
        // Vertical pole: distinct left and right limits!
        yLeftLimit = formatOneSidedLimit(pt, 'left', evaluate);
        yRightLimit = formatOneSidedLimit(pt, 'right', evaluate);
      }
    } else {
      const val = evaluate(pt);
      yVal = val !== null ? formatNumberLatex(val) : '';
    }

    milestones.push({
      x: pt,
      label: formatNumberLatex(pt),
      yPrimeValue,
      yValue: yVal,
      yLeftLimit,
      yRightLimit,
      isUndefined: isExcl,
      isHole,
    });
  }

  // Right boundary milestone
  if (maxBound === Infinity) {
    milestones.push({
      x: Infinity,
      label: '+\\infty',
      yPrimeValue: 'undefined_single',
      yValue: formatEndpointLimit(Infinity, evaluate),
      isUndefined: false,
    });
  } else {
    const isExcluded = excludedPoints.some((ep) => Math.abs(ep - maxBound) < 1e-6);
    milestones.push({
      x: maxBound,
      label: formatNumberLatex(maxBound),
      yPrimeValue: isExcluded ? 'undefined_double' : 'undefined_single',
      yValue: isExcluded ? formatOneSidedLimit(maxBound, 'left', evaluate) : formatNumberLatex(evaluate(maxBound) ?? 0),
      isUndefined: isExcluded,
    });
  }

  // Segments between milestones
  const segments: VariationSegment[] = [];
  for (let i = 0; i < milestones.length - 1; i++) {
    const mLeft = milestones[i];
    const mRight = milestones[i + 1];

    const testX =
      mLeft.x === -Infinity
        ? mRight.x - 2
        : mRight.x === Infinity
        ? mLeft.x + 2
        : (mLeft.x + mRight.x) / 2;

    const dVal = evaluateFPrime(testX) ?? 0;
    const sign = dVal > 0 ? '+' : '-';
    const direction = dVal > 0 ? 'up' : 'down';

    const fromY = mLeft.yRightLimit || mLeft.yValue || '';
    const toY = mRight.yLeftLimit || mRight.yValue || '';

    segments.push({
      sign,
      direction,
      fromY,
      toY,
    });
  }

  return { milestones, segments };
}

function formatEndpointLimit(xInf: number, evaluate: (x: number) => number | null): string {
  const testX = xInf === Infinity ? 1e4 : -1e4;
  const val = evaluate(testX);
  if (val === null) return '0';
  if (val > 1e3) return '+\\infty';
  if (val < -1e3) return '-\\infty';
  return formatNumberLatex(val);
}

function formatOneSidedLimit(
  x0: number,
  side: 'left' | 'right',
  evaluate: (x: number) => number | null
): string {
  const eps = 1e-5;
  const testX = side === 'left' ? x0 - eps : x0 + eps;
  const val = evaluate(testX);
  if (val === null) return '0';
  if (val > 1e2) return '+\\infty';
  if (val < -1e2) return '-\\infty';
  return formatNumberLatex(val);
}
