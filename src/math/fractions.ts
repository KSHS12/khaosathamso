/**
 * Exact Rational Arithmetic (Fractions)
 */

export class Fraction {
  readonly num: number;
  readonly den: number;

  constructor(numerator: number, denominator: number = 1) {
    if (denominator === 0) {
      throw new Error('Mẫu số không thể bằng 0');
    }
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
      throw new Error('Tử số và mẫu số phải là số hữu hạn');
    }

    // Convert potential floats by rounding to 6 decimal places if close to integers
    let n = Math.round(numerator * 1e8);
    let d = Math.round(denominator * 1e8);

    if (d < 0) {
      n = -n;
      d = -d;
    }

    const common = Fraction.gcd(Math.abs(n), d);
    this.num = n / common;
    this.den = d / common;
  }

  static gcd(a: number, b: number): number {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b !== 0) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  static fromNumber(val: number): Fraction {
    if (Number.isInteger(val)) {
      return new Fraction(val, 1);
    }
    // Check if it's close to a simple fraction
    for (let d = 1; d <= 120; d++) {
      const n = Math.round(val * d);
      if (Math.abs(val - n / d) < 1e-7) {
        return new Fraction(n, d);
      }
    }
    // Fallback
    return new Fraction(val, 1);
  }

  valueOf(): number {
    return this.num / this.den;
  }

  add(other: Fraction | number): Fraction {
    const o = other instanceof Fraction ? other : Fraction.fromNumber(other);
    return new Fraction(this.num * o.den + o.num * this.den, this.den * o.den);
  }

  sub(other: Fraction | number): Fraction {
    const o = other instanceof Fraction ? other : Fraction.fromNumber(other);
    return new Fraction(this.num * o.den - o.num * this.den, this.den * o.den);
  }

  mul(other: Fraction | number): Fraction {
    const o = other instanceof Fraction ? other : Fraction.fromNumber(other);
    return new Fraction(this.num * o.num, this.den * o.den);
  }

  div(other: Fraction | number): Fraction {
    const o = other instanceof Fraction ? other : Fraction.fromNumber(other);
    if (o.num === 0) throw new Error('Chia cho 0');
    return new Fraction(this.num * o.den, this.den * o.num);
  }

  neg(): Fraction {
    return new Fraction(-this.num, this.den);
  }

  equals(other: Fraction | number): boolean {
    const o = other instanceof Fraction ? other : Fraction.fromNumber(other);
    return this.num === o.num && this.den === o.den;
  }

  toLatex(): string {
    if (this.den === 1) {
      return `${this.num}`;
    }
    if (this.num < 0) {
      return `-\\frac{${-this.num}}{${this.den}}`;
    }
    return `\\frac{${this.num}}{${this.den}}`;
  }

  toString(): string {
    if (this.den === 1) return `${this.num}`;
    return `${this.num}/${this.den}`;
  }
}

/**
 * Format a number nicely for Vietnamese math display.
 * E.g., integer => "2", simple fraction => "\frac{1}{2}", irrational => "1.414"
 */
export function formatNumberLatex(val: number): string {
  if (Math.abs(val) < 1e-10) return '0';
  if (val === Infinity) return '+\\infty';
  if (val === -Infinity) return '-\\infty';

  // Check if integer
  if (Number.isInteger(Math.round(val * 1e6) / 1e6)) {
    return `${Math.round(val)}`;
  }

  // Check if simple fraction with denominator <= 60
  for (let d = 2; d <= 60; d++) {
    const n = Math.round(val * d);
    if (Math.abs(val - n / d) < 1e-6) {
      const sign = n * d < 0 ? '-' : '';
      const absN = Math.abs(n);
      const absD = Math.abs(d);
      const g = Fraction.gcd(absN, absD);
      const redN = absN / g;
      const redD = absD / g;
      if (redD === 1) return `${sign}${redN}`;
      return `${sign}\\frac{${redN}}{${redD}}`;
    }
  }

  // Rounded decimal display
  const rounded = Number(val.toFixed(3));
  return `${rounded}`;
}

export function formatIntervalLatex(
  start: number,
  end: number,
  startOpen = true,
  endOpen = true
): string {
  const leftBracket = startOpen || start === -Infinity ? '(' : '[';
  const rightBracket = endOpen || end === Infinity ? ')' : ']';
  const startStr = start === -Infinity ? '-\\infty' : formatNumberLatex(start);
  const endStr = end === Infinity ? '+\\infty' : formatNumberLatex(end);
  return `${leftBracket}${startStr};\\, ${endStr}${rightBracket}`;
}
