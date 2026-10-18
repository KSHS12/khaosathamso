import { formatNumberLatex } from './fractions';

export interface RootInfo {
  x: number;
  multiplicity: number;
  latex: string;
  isExact: boolean;
}

/**
 * Polynomial representation with coefficients from highest degree to degree 0.
 * E.g., 2*x^3 - 3*x + 1 -> coeffs: [2, 0, -3, 1]
 */
export class Polynomial {
  readonly coeffs: number[]; // [a_n, a_{n-1}, ..., a_0]

  constructor(coeffs: number[]) {
    // Strip leading zeros
    let start = 0;
    while (start < coeffs.length - 1 && Math.abs(coeffs[start]) < 1e-12) {
      start++;
    }
    const trimmed = coeffs.slice(start);
    this.coeffs = trimmed.length > 0 ? trimmed : [0];
  }

  get degree(): number {
    return this.coeffs.length - 1;
  }

  get leadingCoefficient(): number {
    return this.coeffs[0];
  }

  evaluate(x: number): number {
    let result = 0;
    for (const c of this.coeffs) {
      result = result * x + c;
    }
    return result;
  }

  derivative(): Polynomial {
    if (this.degree === 0) {
      return new Polynomial([0]);
    }
    const dCoeffs: number[] = [];
    const deg = this.degree;
    for (let i = 0; i < deg; i++) {
      const power = deg - i;
      dCoeffs.push(this.coeffs[i] * power);
    }
    return new Polynomial(dCoeffs);
  }

  add(other: Polynomial): Polynomial {
    const deg1 = this.degree;
    const deg2 = other.degree;
    const maxDeg = Math.max(deg1, deg2);
    const newCoeffs: number[] = new Array(maxDeg + 1).fill(0);

    for (let i = 0; i <= deg1; i++) {
      newCoeffs[maxDeg - (deg1 - i)] += this.coeffs[i];
    }
    for (let i = 0; i <= deg2; i++) {
      newCoeffs[maxDeg - (deg2 - i)] += other.coeffs[i];
    }
    return new Polynomial(newCoeffs);
  }

  subtract(other: Polynomial): Polynomial {
    return this.add(other.scale(-1));
  }

  scale(factor: number): Polynomial {
    return new Polynomial(this.coeffs.map((c) => c * factor));
  }

  multiply(other: Polynomial): Polynomial {
    const deg1 = this.degree;
    const deg2 = other.degree;
    const newCoeffs: number[] = new Array(deg1 + deg2 + 1).fill(0);

    for (let i = 0; i <= deg1; i++) {
      for (let j = 0; j <= deg2; j++) {
        newCoeffs[i + j] += this.coeffs[i] * other.coeffs[j];
      }
    }
    return new Polynomial(newCoeffs);
  }

  /**
   * Polynomial long division: this / divisor = quotient, with remainder.
   */
  divide(divisor: Polynomial): { quotient: Polynomial; remainder: Polynomial } {
    if (divisor.degree === 0 && Math.abs(divisor.leadingCoefficient) < 1e-12) {
      throw new Error('Chia cho đa thức 0');
    }

    if (this.degree < divisor.degree) {
      return {
        quotient: new Polynomial([0]),
        remainder: new Polynomial([...this.coeffs]),
      };
    }

    const expectedQuotientDeg = this.degree - divisor.degree;
    const quotientCoeffs = new Array(expectedQuotientDeg + 1).fill(0);
    let remainder = new Polynomial([...this.coeffs]);

    const divDeg = divisor.degree;
    const divLead = divisor.leadingCoefficient;

    while (
      remainder.degree >= divDeg &&
      !(remainder.degree === 0 && Math.abs(remainder.coeffs[0]) < 1e-12)
    ) {
      const degDiff = remainder.degree - divDeg;
      const factor = remainder.leadingCoefficient / divLead;

      const qIndex = expectedQuotientDeg - degDiff;
      if (qIndex >= 0 && qIndex < quotientCoeffs.length) {
        quotientCoeffs[qIndex] += factor;
      }

      // term = factor * x^degDiff * divisor
      const termCoeffs = new Array(degDiff + divDeg + 1).fill(0);
      for (let i = 0; i <= divDeg; i++) {
        termCoeffs[i] = factor * divisor.coeffs[i];
      }
      const termPoly = new Polynomial(termCoeffs);
      remainder = remainder.subtract(termPoly);
    }

    return {
      quotient: new Polynomial(quotientCoeffs),
      remainder,
    };
  }

  /**
   * Finds all real roots of the polynomial (degrees 0 to 4 supported symbolically/analytically).
   */
  findRealRoots(): RootInfo[] {
    const deg = this.degree;

    if (deg === 0) {
      return [];
    }

    if (deg === 1) {
      // ax + b = 0 -> x = -b/a
      const [a, b] = this.coeffs;
      const root = -b / a;
      return [
        {
          x: root,
          multiplicity: 1,
          latex: formatNumberLatex(root),
          isExact: true,
        },
      ];
    }

    if (deg === 2) {
      return this.solveQuadratic();
    }

    if (deg === 3) {
      return this.solveCubic();
    }

    if (deg === 4) {
      return this.solveQuartic();
    }

    // Fallback: Newton / companion matrix for higher degrees if ever encountered
    return this.findRootsNumerical();
  }

  private solveQuadratic(): RootInfo[] {
    const [a, b, c] = this.coeffs;
    const delta = b * b - 4 * a * c;

    if (Math.abs(delta) < 1e-11) {
      const root = -b / (2 * a);
      return [
        {
          x: root,
          multiplicity: 2,
          latex: formatNumberLatex(root),
          isExact: true,
        },
      ];
    }

    if (delta < 0) {
      return [];
    }

    const sqrtDelta = Math.sqrt(delta);
    const r1 = (-b - sqrtDelta) / (2 * a);
    const r2 = (-b + sqrtDelta) / (2 * a);

    // Format exact latex if delta is a perfect square of a rational
    const isPerfSquare = Number.isInteger(Math.round(sqrtDelta * 1e6) / 1e6);
    const roots = [r1, r2].sort((m, n) => m - n);

    return roots.map((r) => ({
      x: r,
      multiplicity: 1,
      latex: isPerfSquare ? formatNumberLatex(r) : formatNumberLatex(r),
      isExact: isPerfSquare,
    }));
  }

  private solveCubic(): RootInfo[] {
    const [a, b, c, d] = this.coeffs;

    // First try rational root theorem with candidates p/q
    const rationalRoots = this.findRationalRoots();
    if (rationalRoots.length > 0) {
      const firstRoot = rationalRoots[0];
      const factorPoly = new Polynomial([1, -firstRoot]);
      const { quotient } = this.divide(factorPoly);
      const quadRoots = quotient.solveQuadratic();

      const allRoots = [firstRoot, ...quadRoots.map((q) => q.x)];
      return this.groupRoots(allRoots);
    }

    // Cardano / Trigonometric formula for real cubic:
    // Depress cubic: y = x + b/(3a)
    const p = (3 * a * c - b * b) / (3 * a * a);
    const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
    const discriminant = (q / 2) ** 2 + (p / 3) ** 3;

    if (discriminant < -1e-12) {
      // 3 real distinct roots (trigonometric method)
      const m = 2 * Math.sqrt(-p / 3);
      const theta = Math.acos((-q / 2) / Math.sqrt((-p / 3) ** 3));
      const r1 = m * Math.cos(theta / 3) - b / (3 * a);
      const r2 = m * Math.cos((theta + 2 * Math.PI) / 3) - b / (3 * a);
      const r3 = m * Math.cos((theta + 4 * Math.PI) / 3) - b / (3 * a);
      return this.groupRoots([r1, r2, r3]);
    } else if (Math.abs(discriminant) <= 1e-12) {
      // Multiple roots
      const u = Math.cbrt(-q / 2);
      const r1 = 2 * u - b / (3 * a);
      const r2 = -u - b / (3 * a);
      return this.groupRoots([r1, r2, r2]);
    } else {
      // 1 real root
      const sqrtD = Math.sqrt(discriminant);
      const u = Math.cbrt(-q / 2 + sqrtD);
      const v = Math.cbrt(-q / 2 - sqrtD);
      const r1 = u + v - b / (3 * a);
      return this.groupRoots([r1]);
    }
  }

  private solveQuartic(): RootInfo[] {
    const [a, b, c, d, e] = this.coeffs;

    // Check if biquadratic: ax^4 + cx^2 + e = 0 (b=0, d=0)
    if (Math.abs(b) < 1e-11 && Math.abs(d) < 1e-11) {
      // Substitute u = x^2 >= 0
      const quad = new Polynomial([a, c, e]);
      const quadRoots = quad.solveQuadratic();
      const realRoots: number[] = [];

      for (const qr of quadRoots) {
        if (qr.x > 1e-11) {
          const s = Math.sqrt(qr.x);
          realRoots.push(-s, s);
        } else if (Math.abs(qr.x) <= 1e-11) {
          realRoots.push(0);
        }
      }
      return this.groupRoots(realRoots);
    }

    // Try rational root theorem
    const rationalRoots = this.findRationalRoots();
    if (rationalRoots.length > 0) {
      const r = rationalRoots[0];
      const { quotient } = this.divide(new Polynomial([1, -r]));
      const remainingRoots = quotient.solveCubic();
      const allRoots = [r, ...remainingRoots.map((ro) => ro.x)];
      return this.groupRoots(allRoots);
    }

    // Numerical root search for general quartics
    return this.findRootsNumerical();
  }

  private findRationalRoots(): number[] {
    // If degree is 0, no roots
    if (this.degree === 0) return [];

    const a0 = Math.round(this.coeffs[this.coeffs.length - 1] * 1e4) / 1e4;
    const an = Math.round(this.coeffs[0] * 1e4) / 1e4;

    // If constant term is 0, 0 is a root!
    if (Math.abs(a0) < 1e-9) {
      return [0];
    }

    // Only apply if coefficients are close to integers
    const intCoeffs = this.coeffs.map((c) => Math.round(c));
    const allInt = this.coeffs.every((c, i) => Math.abs(c - intCoeffs[i]) < 1e-5);
    if (!allInt) return [];

    const pFactors = this.getFactors(Math.abs(intCoeffs[intCoeffs.length - 1]));
    const qFactors = this.getFactors(Math.abs(intCoeffs[0]));

    const tested = new Set<number>();
    const roots: number[] = [];

    for (const p of pFactors) {
      for (const q of qFactors) {
        for (const sign of [1, -1]) {
          const candidate = (sign * p) / q;
          if (!tested.has(candidate)) {
            tested.add(candidate);
            if (Math.abs(this.evaluate(candidate)) < 1e-8) {
              roots.push(candidate);
            }
          }
        }
      }
    }
    return roots;
  }

  private getFactors(n: number): number[] {
    if (n === 0) return [1];
    const factors: number[] = [];
    const max = Math.min(Math.floor(Math.sqrt(n)), 100);
    for (let i = 1; i <= max; i++) {
      if (n % i === 0) {
        factors.push(i);
        if (i !== n / i) factors.push(n / i);
      }
    }
    return factors.sort((a, b) => a - b);
  }

  private groupRoots(roots: number[]): RootInfo[] {
    // Sort and remove duplicates within 1e-7, tally multiplicity
    const sorted = [...roots].sort((a, b) => a - b);
    const result: RootInfo[] = [];

    for (const r of sorted) {
      if (!Number.isFinite(r)) continue;
      const last = result[result.length - 1];
      if (last && Math.abs(last.x - r) < 1e-5) {
        last.multiplicity++;
      } else {
        result.push({
          x: r,
          multiplicity: 1,
          latex: formatNumberLatex(r),
          isExact: Number.isInteger(Math.round(r * 1e5) / 1e5),
        });
      }
    }
    return result;
  }

  private findRootsNumerical(): RootInfo[] {
    // Grid sampling followed by Newton-Raphson
    const roots: number[] = [];
    const deriv = this.derivative();

    for (let x = -50; x <= 50; x += 0.25) {
      const y1 = this.evaluate(x);
      const y2 = this.evaluate(x + 0.25);

      if (y1 * y2 <= 0 || Math.abs(y1) < 1e-7) {
        // Newton refine
        let curr = x;
        for (let iter = 0; iter < 20; iter++) {
          const val = this.evaluate(curr);
          const dVal = deriv.evaluate(curr);
          if (Math.abs(val) < 1e-12) break;
          if (Math.abs(dVal) < 1e-12) break;
          curr = curr - val / dVal;
        }
        if (Math.abs(this.evaluate(curr)) < 1e-6) {
          roots.push(curr);
        }
      }
    }
    return this.groupRoots(roots);
  }

  toLatex(varName = 'x'): string {
    const deg = this.degree;
    if (deg === 0) {
      return formatNumberLatex(this.coeffs[0]);
    }

    const parts: string[] = [];

    for (let i = 0; i <= deg; i++) {
      const power = deg - i;
      const c = this.coeffs[i];
      if (Math.abs(c) < 1e-10) continue;

      const isFirst = parts.length === 0;
      const sign = c < 0 ? '-' : isFirst ? '' : '+';
      const absC = Math.abs(c);

      let coeffStr = '';
      if (power === 0) {
        coeffStr = formatNumberLatex(absC);
      } else if (Math.abs(absC - 1) < 1e-10) {
        coeffStr = '';
      } else {
        coeffStr = formatNumberLatex(absC);
      }

      let varPowerStr = '';
      if (power === 0) {
        varPowerStr = '';
      } else if (power === 1) {
        varPowerStr = varName;
      } else {
        varPowerStr = `${varName}^{${power}}`;
      }

      const term = `${coeffStr}${varPowerStr}`;
      if (isFirst) {
        parts.push(c < 0 ? `-${term}` : term);
      } else {
        parts.push(`${sign} ${term}`);
      }
    }

    return parts.length > 0 ? parts.join(' ') : '0';
  }
}
