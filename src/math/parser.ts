import { Polynomial } from './polynomial';

export type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'variable'; name: 'x' }
  | { type: 'constant'; name: 'e' | 'pi'; value: number }
  | { type: 'unary'; op: '+' | '-'; arg: ASTNode }
  | { type: 'binary'; op: '+' | '-' | '*' | '/' | '^'; left: ASTNode; right: ASTNode }
  | { type: 'func'; name: 'ln' | 'log' | 'exp'; args: ASTNode[] };

export interface ParsedFunction {
  raw: string;
  ast: ASTNode;
  evaluate: (x: number) => number;
  // If recognized as rational (including pure polynomial where denom = 1)
  isRational: boolean;
  numeratorPoly?: Polynomial;
  denominatorPoly?: Polynomial;
  // If recognized as exponential: A * a^(kx + h) + B
  isExponential: boolean;
  expParams?: {
    A: number;
    base: number;
    k: number;
    h: number;
    B: number;
  };
  // If recognized as logarithmic: A * log_a(kx + h) + B
  isLogarithmic: boolean;
  logParams?: {
    A: number;
    base: number;
    k: number;
    h: number;
    B: number;
  };
}

type TokenType =
  | 'NUMBER'
  | 'IDENT'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'CARET'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const str = input.trim();

  while (i < str.length) {
    const ch = str[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < str.length && /[0-9]/.test(str[i + 1]))) {
      let numStr = '';
      const startPos = i;
      while (i < str.length && (/[0-9]/.test(str[i]) || str[i] === '.')) {
        numStr += str[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr, pos: startPos });
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      const startPos = i;
      while (i < str.length && /[a-zA-Z0-9_]/.test(str[i])) {
        ident += str[i];
        i++;
      }
      tokens.push({ type: 'IDENT', value: ident.toLowerCase(), pos: startPos });
      continue;
    }

    const startPos = i;
    i++;
    switch (ch) {
      case '+':
        tokens.push({ type: 'PLUS', value: '+', pos: startPos });
        break;
      case '-':
        tokens.push({ type: 'MINUS', value: '-', pos: startPos });
        break;
      case '*':
        tokens.push({ type: 'STAR', value: '*', pos: startPos });
        break;
      case '/':
        tokens.push({ type: 'SLASH', value: '/', pos: startPos });
        break;
      case '^':
        tokens.push({ type: 'CARET', value: '^', pos: startPos });
        break;
      case '(':
        tokens.push({ type: 'LPAREN', value: '(', pos: startPos });
        break;
      case ')':
        tokens.push({ type: 'RPAREN', value: ')', pos: startPos });
        break;
      case ',':
        tokens.push({ type: 'COMMA', value: ',', pos: startPos });
        break;
      default:
        throw new Error(`Ký tự không hợp lệ tại vị trí ${startPos + 1}: '${ch}'`);
    }
  }

  // Insert implicit multiplication tokens where appropriate
  // e.g.: NUMBER followed by IDENT or LPAREN
  // IDENT('x') followed by NUMBER or LPAREN
  // RPAREN followed by LPAREN or IDENT or NUMBER
  const withImplicitMult: Token[] = [];
  for (let j = 0; j < tokens.length; j++) {
    const cur = tokens[j];
    withImplicitMult.push(cur);

    if (j + 1 < tokens.length) {
      const next = tokens[j + 1];

      const curCanImplicit =
        cur.type === 'NUMBER' ||
        (cur.type === 'IDENT' && (cur.value === 'x' || cur.value === 'e' || cur.value === 'pi')) ||
        cur.type === 'RPAREN';

      const nextCanImplicit =
        next.type === 'IDENT' ||
        next.type === 'LPAREN' ||
        (cur.type === 'RPAREN' && next.type === 'NUMBER');

      if (curCanImplicit && nextCanImplicit) {
        withImplicitMult.push({ type: 'STAR', value: '*', pos: cur.pos });
      }
    }
  }

  withImplicitMult.push({ type: 'EOF', value: '', pos: str.length });
  return withImplicitMult;
}

export class SafeParser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private advance(): Token {
    const t = this.tokens[this.current];
    if (this.current < this.tokens.length - 1) {
      this.current++;
    }
    return t;
  }

  private check(type: TokenType, val?: string): boolean {
    const t = this.peek();
    if (t.type !== type) return false;
    if (val !== undefined && t.value !== val) return false;
    return true;
  }

  private match(...types: TokenType[]): boolean {
    for (const t of types) {
      if (this.check(t)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, errMsg: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(`${errMsg} tại vị trí ${this.peek().pos + 1}`);
  }

  parse(): ASTNode {
    const node = this.expression();
    if (!this.check('EOF')) {
      throw new Error(`Cú pháp không hợp lệ tại vị trí ${this.peek().pos + 1}: '${this.peek().value}'`);
    }
    return node;
  }

  private expression(): ASTNode {
    return this.additive();
  }

  private additive(): ASTNode {
    let node = this.multiplicative();

    while (this.check('PLUS') || this.check('MINUS')) {
      const op = this.advance().value as '+' | '-';
      const right = this.multiplicative();
      node = { type: 'binary', op, left: node, right };
    }

    return node;
  }

  private multiplicative(): ASTNode {
    let node = this.power();

    while (this.check('STAR') || this.check('SLASH')) {
      const op = this.advance().value as '*' | '/';
      const right = this.power();
      node = { type: 'binary', op, left: node, right };
    }

    return node;
  }

  private power(): ASTNode {
    let node = this.unary();

    if (this.match('CARET')) {
      // Right associative: a^b^c = a^(b^c)
      const right = this.power();
      node = { type: 'binary', op: '^', left: node, right };
    }

    return node;
  }

  private unary(): ASTNode {
    if (this.check('PLUS') || this.check('MINUS')) {
      const op = this.advance().value as '+' | '-';
      const arg = this.unary();
      return { type: 'unary', op, arg };
    }
    return this.primary();
  }

  private primary(): ASTNode {
    const token = this.peek();

    if (this.match('NUMBER')) {
      const val = parseFloat(token.value);
      if (Number.isNaN(val)) {
        throw new Error(`Số không hợp lệ: ${token.value}`);
      }
      return { type: 'number', value: val };
    }

    if (this.check('IDENT')) {
      const ident = this.advance().value;

      if (ident === 'x') {
        return { type: 'variable', name: 'x' };
      }
      if (ident === 'e') {
        return { type: 'constant', name: 'e', value: Math.E };
      }
      if (ident === 'pi') {
        return { type: 'constant', name: 'pi', value: Math.PI };
      }

      // Check log_a (e.g. log_2 or log_3)
      if (ident.startsWith('log_')) {
        const baseNum = parseFloat(ident.slice(4));
        if (Number.isNaN(baseNum) || baseNum <= 0 || Math.abs(baseNum - 1) < 1e-9) {
          throw new Error(`Cơ số logarit không hợp lệ trong '${ident}'`);
        }
        this.consume('LPAREN', "Thiếu dấu '(' sau hàm logarit");
        const arg = this.expression();
        this.consume('RPAREN', "Thiếu dấu ')' đóng ngoặc cho hàm logarit");
        return {
          type: 'func',
          name: 'log',
          args: [arg, { type: 'number', value: baseNum }],
        };
      }

      if (ident === 'ln' || ident === 'log' || ident === 'exp') {
        this.consume('LPAREN', `Thiếu dấu '(' sau hàm ${ident}`);
        const arg1 = this.expression();
        const args = [arg1];

        if (this.match('COMMA')) {
          args.push(this.expression());
        }

        this.consume('RPAREN', `Thiếu dấu ')' cho hàm ${ident}`);
        return { type: 'func', name: ident, args };
      }

      throw new Error(`Biến hoặc hàm không xác định: '${ident}'`);
    }

    if (this.match('LPAREN')) {
      const expr = this.expression();
      this.consume('RPAREN', "Thiếu dấu đóng ngoặc ')'");
      return expr;
    }

    throw new Error(`Cú pháp không hợp lệ tại vị trí ${token.pos + 1}: '${token.value || 'kết thúc'}'`);
  }
}

/**
 * Safely evaluates AST at a given x value.
 */
export function evaluateAST(node: ASTNode, x: number): number {
  switch (node.type) {
    case 'number':
      return node.value;
    case 'variable':
      return x;
    case 'constant':
      return node.value;
    case 'unary': {
      const val = evaluateAST(node.arg, x);
      return node.op === '-' ? -val : val;
    }
    case 'binary': {
      const left = evaluateAST(node.left, x);
      const right = evaluateAST(node.right, x);

      switch (node.op) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          if (Math.abs(right) < 1e-12) return NaN;
          return left / right;
        case '^':
          if (left < 0 && !Number.isInteger(right)) return NaN;
          return Math.pow(left, right);
      }
      break;
    }
    case 'func': {
      const argVal = evaluateAST(node.args[0], x);
      if (node.name === 'ln') {
        if (argVal <= 0) return NaN;
        return Math.log(argVal);
      }
      if (node.name === 'exp') {
        return Math.exp(argVal);
      }
      if (node.name === 'log') {
        if (argVal <= 0) return NaN;
        if (node.args.length > 1) {
          const baseVal = evaluateAST(node.args[1], x);
          if (baseVal <= 0 || Math.abs(baseVal - 1) < 1e-9) return NaN;
          // log(arg, base) or log_base(arg)
          return Math.log(argVal) / Math.log(baseVal);
        }
        // Default log(x) is natural ln or log10? In VN THPT, ln is natural, log or lg is log10
        return Math.log10(argVal);
      }
      break;
    }
  }
  return NaN;
}

/**
 * Check if an AST can be represented as a pure Polynomial.
 */
export function astToPolynomial(node: ASTNode): Polynomial | null {
  switch (node.type) {
    case 'number':
      return new Polynomial([node.value]);
    case 'constant':
      return new Polynomial([node.value]);
    case 'variable':
      return new Polynomial([1, 0]); // 1*x + 0
    case 'unary': {
      const argPoly = astToPolynomial(node.arg);
      if (!argPoly) return null;
      return node.op === '-' ? argPoly.scale(-1) : argPoly;
    }
    case 'binary': {
      if (node.op === '+') {
        const l = astToPolynomial(node.left);
        const r = astToPolynomial(node.right);
        return l && r ? l.add(r) : null;
      }
      if (node.op === '-') {
        const l = astToPolynomial(node.left);
        const r = astToPolynomial(node.right);
        return l && r ? l.subtract(r) : null;
      }
      if (node.op === '*') {
        const l = astToPolynomial(node.left);
        const r = astToPolynomial(node.right);
        return l && r ? l.multiply(r) : null;
      }
      if (node.op === '/') {
        const l = astToPolynomial(node.left);
        const r = astToPolynomial(node.right);
        if (l && r && r.degree === 0 && Math.abs(r.coeffs[0]) > 1e-12) {
          return l.scale(1 / r.coeffs[0]);
        }
        return null;
      }
      if (node.op === '^') {
        const l = astToPolynomial(node.left);
        const r = astToPolynomial(node.right);
        if (l && r && r.degree === 0) {
          const p = r.coeffs[0];
          if (Number.isInteger(p) && p >= 0 && p <= 6) {
            let res = new Polynomial([1]);
            for (let i = 0; i < p; i++) {
              res = res.multiply(l);
            }
            return res;
          }
        }
        return null;
      }
      return null;
    }
    default:
      return null;
  }
}

/**
 * Check if expression is Rational: P(x) / Q(x)
 */
export function astToRational(node: ASTNode): { numerator: Polynomial; denominator: Polynomial } | null {
  // First check if it's already a single polynomial
  const directPoly = astToPolynomial(node);
  if (directPoly) {
    return { numerator: directPoly, denominator: new Polynomial([1]) };
  }

  // If top-level binary division: P / Q
  if (node.type === 'binary' && node.op === '/') {
    const numPoly = astToPolynomial(node.left);
    const denPoly = astToPolynomial(node.right);
    if (numPoly && denPoly) {
      return { numerator: numPoly, denominator: denPoly };
    }
  }

  return null;
}

/**
 * Recognize exponential: A * a^(kx + h) + B
 */
export function matchExponential(ast: ASTNode): { A: number; base: number; k: number; h: number; B: number } | null {
  // Let's sample and check if f(x) - B = A * a^(kx + h)
  // Or check AST patterns.
  // We can test if f(x) fits exponential curve:
  const y0 = evaluateAST(ast, 0);
  const y1 = evaluateAST(ast, 1);
  const y2 = evaluateAST(ast, 2);
  const y3 = evaluateAST(ast, 3);

  if (Number.isNaN(y0) || Number.isNaN(y1) || Number.isNaN(y2) || Number.isNaN(y3)) {
    return null;
  }

  // Common AST pattern: base^(kx+h) or A * base^(...) + B
  // Let's inspect AST structure:
  function extractExpTerm(n: ASTNode): { base: number; linear: { k: number; h: number }; coeff: number } | null {
    if (n.type === 'binary' && n.op === '^') {
      let baseVal: number | null = null;
      if (n.left.type === 'number') baseVal = n.left.value;
      if (n.left.type === 'constant' && n.left.name === 'e') baseVal = Math.E;

      if (baseVal !== null && baseVal > 0 && Math.abs(baseVal - 1) > 1e-9) {
        const powerPoly = astToPolynomial(n.right);
        if (powerPoly && powerPoly.degree <= 1) {
          const k = powerPoly.degree === 1 ? powerPoly.coeffs[0] : 0;
          const h = powerPoly.coeffs[powerPoly.coeffs.length - 1];
          if (Math.abs(k) > 1e-9) {
            return { base: baseVal, linear: { k, h }, coeff: 1 };
          }
        }
      }
    }
    if (n.type === 'func' && n.name === 'exp') {
      const powerPoly = astToPolynomial(n.args[0]);
      if (powerPoly && powerPoly.degree <= 1) {
        const k = powerPoly.degree === 1 ? powerPoly.coeffs[0] : 0;
        const h = powerPoly.coeffs[powerPoly.coeffs.length - 1];
        if (Math.abs(k) > 1e-9) {
          return { base: Math.E, linear: { k, h }, coeff: 1 };
        }
      }
    }
    if (n.type === 'binary' && n.op === '*') {
      const leftNum = astToPolynomial(n.left);
      if (leftNum && leftNum.degree === 0) {
        const sub = extractExpTerm(n.right);
        if (sub) return { ...sub, coeff: sub.coeff * leftNum.coeffs[0] };
      }
      const rightNum = astToPolynomial(n.right);
      if (rightNum && rightNum.degree === 0) {
        const sub = extractExpTerm(n.left);
        if (sub) return { ...sub, coeff: sub.coeff * rightNum.coeffs[0] };
      }
    }
    if (n.type === 'unary' && n.op === '-') {
      const sub = extractExpTerm(n.arg);
      if (sub) return { ...sub, coeff: -sub.coeff };
    }
    return null;
  }

  // Check top-level: ExpTerm + Constant
  const expTerm = extractExpTerm(ast);
  if (expTerm) {
    return {
      A: expTerm.coeff,
      base: expTerm.base,
      k: expTerm.linear.k,
      h: expTerm.linear.h,
      B: 0,
    };
  }

  if (ast.type === 'binary' && (ast.op === '+' || ast.op === '-')) {
    const rightConst = astToPolynomial(ast.right);
    if (rightConst && rightConst.degree === 0) {
      const leftExp = extractExpTerm(ast.left);
      if (leftExp) {
        const B = ast.op === '+' ? rightConst.coeffs[0] : -rightConst.coeffs[0];
        return {
          A: leftExp.coeff,
          base: leftExp.base,
          k: leftExp.linear.k,
          h: leftExp.linear.h,
          B,
        };
      }
    }

    const leftConst = astToPolynomial(ast.left);
    if (leftConst && leftConst.degree === 0 && ast.op === '+') {
      const rightExp = extractExpTerm(ast.right);
      if (rightExp) {
        return {
          A: rightExp.coeff,
          base: rightExp.base,
          k: rightExp.linear.k,
          h: rightExp.linear.h,
          B: leftConst.coeffs[0],
        };
      }
    }
  }

  return null;
}

/**
 * Recognize logarithm: A * log_a(kx + h) + B
 */
export function matchLogarithmic(ast: ASTNode): { A: number; base: number; k: number; h: number; B: number } | null {
  function extractLogTerm(n: ASTNode): { base: number; linear: { k: number; h: number }; coeff: number } | null {
    if (n.type === 'func' && (n.name === 'ln' || n.name === 'log')) {
      const base = n.name === 'ln' ? Math.E : n.args.length > 1 && n.args[1].type === 'number' ? n.args[1].value : 10;
      const poly = astToPolynomial(n.args[0]);
      if (poly && poly.degree === 1) {
        const k = poly.coeffs[0];
        const h = poly.coeffs[1];
        return { base, linear: { k, h }, coeff: 1 };
      }
    }
    if (n.type === 'binary' && n.op === '*') {
      const leftNum = astToPolynomial(n.left);
      if (leftNum && leftNum.degree === 0) {
        const sub = extractLogTerm(n.right);
        if (sub) return { ...sub, coeff: sub.coeff * leftNum.coeffs[0] };
      }
      const rightNum = astToPolynomial(n.right);
      if (rightNum && rightNum.degree === 0) {
        const sub = extractLogTerm(n.left);
        if (sub) return { ...sub, coeff: sub.coeff * rightNum.coeffs[0] };
      }
    }
    if (n.type === 'unary' && n.op === '-') {
      const sub = extractLogTerm(n.arg);
      if (sub) return { ...sub, coeff: -sub.coeff };
    }
    return null;
  }

  const direct = extractLogTerm(ast);
  if (direct) {
    return {
      A: direct.coeff,
      base: direct.base,
      k: direct.linear.k,
      h: direct.linear.h,
      B: 0,
    };
  }

  if (ast.type === 'binary' && (ast.op === '+' || ast.op === '-')) {
    const rightConst = astToPolynomial(ast.right);
    if (rightConst && rightConst.degree === 0) {
      const leftLog = extractLogTerm(ast.left);
      if (leftLog) {
        const B = ast.op === '+' ? rightConst.coeffs[0] : -rightConst.coeffs[0];
        return {
          A: leftLog.coeff,
          base: leftLog.base,
          k: leftLog.linear.k,
          h: leftLog.linear.h,
          B,
        };
      }
    }

    const leftConst = astToPolynomial(ast.left);
    if (leftConst && leftConst.degree === 0 && ast.op === '+') {
      const rightLog = extractLogTerm(ast.right);
      if (rightLog) {
        return {
          A: rightLog.coeff,
          base: rightLog.base,
          k: rightLog.linear.k,
          h: rightLog.linear.h,
          B: leftConst.coeffs[0],
        };
      }
    }
  }

  return null;
}

/**
 * Main parse entry point: turns input text into structured parsed model.
 */
export function parseExpression(input: string): ParsedFunction {
  let cleanInput = input.trim();
  // Strip "y =" or "f(x) =" prefix if user entered it
  cleanInput = cleanInput.replace(/^y\s*=\s*/i, '');
  cleanInput = cleanInput.replace(/^f\s*\(\s*x\s*\)\s*=\s*/i, '');

  if (!cleanInput) {
    throw new Error('Vui lòng nhập biểu thức hàm số');
  }

  const tokens = tokenize(cleanInput);
  const parser = new SafeParser(tokens);
  const ast = parser.parse();

  const evaluate = (x: number) => evaluateAST(ast, x);

  // Classify
  const rational = astToRational(ast);
  const expMatch = matchExponential(ast);
  const logMatch = matchLogarithmic(ast);

  return {
    raw: cleanInput,
    ast,
    evaluate,
    isRational: !!rational,
    numeratorPoly: rational?.numerator,
    denominatorPoly: rational?.denominator,
    isExponential: !!expMatch,
    expParams: expMatch || undefined,
    isLogarithmic: !!logMatch,
    logParams: logMatch || undefined,
  };
}
