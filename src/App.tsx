import { useEffect, useRef, useState } from "react";
// @ts-ignore - no types shipped
import functionPlot from "function-plot";

const SAMPLES = [
  "x^3 - 3*x + 1",
  "(x - 2) / (x - 1)",
  "(x^2 - 2*x + 1) / (x - 2)",
];

function toJs(expr: string): string {
  // function-plot accepts ^, but our evaluator needs ** for JS
  return expr
    .replace(/\^/g, "**")
    .replace(/\bsin\b/g, "Math.sin")
    .replace(/\bcos\b/g, "Math.cos")
    .replace(/\btan\b/g, "Math.tan")
    .replace(/\bexp\b/g, "Math.exp")
    .replace(/\blog\b/g, "Math.log")
    .replace(/\bsqrt\b/g, "Math.sqrt")
    .replace(/\babs\b/g, "Math.abs");
}

function tryEval(expr: string, x: number): number | null {
  try {
    const js = toJs(expr);
    // eslint-disable-next-line no-new-func
    const fn = new Function("x", `"use strict"; return (${js});`);
    const v = fn(x);
    if (typeof v !== "number" || !isFinite(v)) return null;
    return v;
  } catch {
    return null;
  }
}

interface RootInfo {
  approx: number;
  fValue: number;
}

// Bisection within [a,b], requires sign change
function bisect(expr: string, a: number, b: number, iters = 200): RootInfo | null {
  let fa = tryEval(expr, a);
  let fb = tryEval(expr, b);
  if (fa === null || fb === null || fa * fb > 0) return null;
  let lo = a;
  let hi = b;
  for (let i = 0; i < iters; i++) {
    const mid = (lo + hi) / 2;
    const fm = tryEval(expr, mid);
    if (fm === null) return null;
    if (Math.abs(fm) < 1e-12) return { approx: mid, fValue: fm };
    if (fa! * fm < 0) {
      hi = mid;
      fb = fm;
    } else {
      lo = mid;
      fa = fm;
    }
  }
  const mid = (lo + hi) / 2;
  return { approx: mid, fValue: tryEval(expr, mid) ?? NaN };
}

function findRoots(expr: string, lo: number, hi: number, step = 0.02): RootInfo[] {
  const roots: RootInfo[] = [];
  // sign-change roots (bisection)
  let prevX = lo;
  let prevY = tryEval(expr, lo);
  for (let x = lo + step; x <= hi; x += step) {
    const y = tryEval(expr, x);
    if (prevY !== null && y !== null && prevY * y < 0) {
      const r = bisect(expr, prevX, x);
      if (r && !roots.some((e) => Math.abs(e.approx - r.approx) < 1e-4)) {
        roots.push(r);
      }
    }
    prevX = x;
    prevY = y;
  }
  // touch roots: local min of |f| near zero without sign change (double/even roots)
  for (let x = lo; x <= hi; x += step) {
    const y = tryEval(expr, x);
    if (y === null) continue;
    if (Math.abs(y) < 1e-6) {
      if (!roots.some((e) => Math.abs(e.approx - x) < 1e-3)) {
        roots.push({ approx: x, fValue: y });
      }
    }
  }
  return roots;
}

function findPoles(expr: string, lo: number, hi: number, step = 0.02): number[] {
  const poles: number[] = [];
  let prevX = lo;
  let prevY = tryEval(expr, lo);
  for (let x = lo + step; x <= hi; x += step) {
    const y = tryEval(expr, x);
    if (prevY !== null && y !== null) {
      // detect sign flip across a near-infinite jump: large magnitude product and opposite sign
      if (prevY * y < 0 && (Math.abs(prevY) > 1e3 || Math.abs(y) > 1e3)) {
        const pole = prevX + (x - prevX) * (Math.abs(prevY) / (Math.abs(prevY) + Math.abs(y)));
        if (!poles.some((p) => Math.abs(p - pole) < 1e-3)) poles.push(pole);
      }
    }
    prevX = x;
    prevY = y;
  }
  return poles;
}

function findExtrema(
  expr: string,
  lo: number,
  hi: number,
  step = 0.02
): { x: number; y: number; kind: "max" | "min" }[] {
  const out: { x: number; y: number; kind: "max" | "min" }[] = [];
  // skip windows near known poles to avoid spurious extrema from the asymptote jump
  const poles = findPoles(expr, lo, hi);
  const nearPole = (x: number) => poles.some((p) => Math.abs(p - x) < 0.1);
  let pX = lo;
  let pY = tryEval(expr, lo);
  let cX = lo + step;
  let cY = tryEval(expr, cX);
  for (let x = lo + 2 * step; x <= hi; x += step) {
    const nY = tryEval(expr, x);
    if (pY !== null && cY !== null && nY !== null) {
      if (!nearPole(cX) && Math.abs(cY) < 1e4) {
        if (cY > pY && cY > nY) {
          if (!out.some((e) => Math.abs(e.x - cX) < 1e-3))
            out.push({ x: cX, y: cY, kind: "max" });
        } else if (cY < pY && cY < nY) {
          if (!out.some((e) => Math.abs(e.x - cX) < 1e-3))
            out.push({ x: cX, y: cY, kind: "min" });
        }
      }
    }
    pX = cX;
    pY = cY;
    cX = x;
    cY = nY;
  }
  return out;
}

function fmt(n: number): string {
  if (!isFinite(n)) return n > 0 ? "+∞" : n < 0 ? "-∞" : "NaN";
  if (Math.abs(n) < 1e-10) return "0";
  return Number(n.toFixed(6)).toString();
}

interface Analysis {
  expr: string;
  roots: RootInfo[];
  poles: number[];
  extrema: { x: number; y: number; kind: "max" | "min" }[];
  values: { x: number; y: number | null }[];
}

function analyze(expr: string, lo: number, hi: number): Analysis {
  return {
    expr,
    roots: findRoots(expr, lo, hi),
    poles: findPoles(expr, lo, hi),
    extrema: findExtrema(expr, lo, hi),
    values: [-2, -1, 0, 1, 2, 3].map((x) => ({ x, y: tryEval(expr, x) })),
  };
}

export default function App() {
  const [expr, setExpr] = useState(SAMPLES[0]);
  const [xMin, setXMin] = useState(-4);
  const [xMax, setXMax] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  const draw = () => {
    if (!plotRef.current) return;
    setError(null);
    try {
      functionPlot({
        target: "#plot",
        width: plotRef.current.clientWidth,
        height: 420,
        xAxis: { domain: [xMin, xMax] },
        yAxis: { domain: [-10, 10] },
        grid: true,
        data: [
          {
            fn: expr,
            color: "#4a9eff",
          },
        ],
      });
    } catch (e: any) {
      setError(e?.message ?? "Không thể vẽ hàm số này");
    }
  };

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expr, xMin, xMax]);

  // resize handling
  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expr, xMin, xMax]);

  const analyses: Analysis[] = SAMPLES.map((s) => analyze(s, xMin, xMax));

  return (
    <div className="app">
      <header className="app__header">
        <h1>Function Plotter</h1>
        <p>Nhập hàm số theo biến x. Dùng ^ cho lũy thừa, *, /, +, − như bình thường.</p>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="field">
            <label>Hàm số f(x)</label>
            <input value={expr} onChange={(e) => setExpr(e.target.value)} />
            {error && <div className="error">{error}</div>}
          </div>

          <div className="row">
            <div className="field">
              <label>x min</label>
              <input
                type="number"
                value={xMin}
                onChange={(e) => setXMin(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>x max</label>
              <input
                type="number"
                value={xMax}
                onChange={(e) => setXMax(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="row">
            <button className="btn" onClick={draw}>Vẽ lại</button>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setExpr("");
                setError(null);
              }}
            >
              Xóa
            </button>
          </div>

          <div className="samples">
            <span className="samples__label">Hàm mẫu</span>
            {SAMPLES.map((s) => (
              <button
                key={s}
                className="samples__item"
                onClick={() => setExpr(s)}
              >
                f(x) = {s}
              </button>
            ))}
          </div>
        </aside>

        <main className="plot-wrap">
          <div className="plot-wrap__title">Đồ thị f(x) = {expr}</div>
          <div id="plot" ref={plotRef} />
        </main>
      </div>

      <section className="results">
        <h2>Kết quả phân tích 3 hàm mẫu trên [{xMin}, {xMax}]</h2>
        <div className="results__grid">
          {analyses.map((a) => (
            <div className="result-card" key={a.expr}>
              <div className="result-card__fn">f(x) = {a.expr}</div>
              <div className="result-card__row">
                <span>Nghiệm (f=0)</span>
                <span>
                  {a.roots.length
                    ? a.roots.map((r) => fmt(r.approx)).join(", ")
                    : "không có"}
                </span>
              </div>
              <div className="result-card__row">
                <span>Tiên kỷ (pole)</span>
                <span>
                  {a.poles.length ? a.poles.map(fmt).join(", ") : "không có"}
                </span>
              </div>
              <div className="result-card__row">
                <span>Cực trị</span>
                <span>
                  {a.extrema.length
                    ? a.extrema
                        .map((e) => `${e.kind === "max" ? "max" : "min"}@${fmt(e.x)}=${fmt(e.y)}`)
                        .join(", ")
                    : "không có"}
                </span>
              </div>
              <div className="result-card__row">
                <span>f(−2…3)</span>
                <span>
                  {a.values.map((v) => `${v.x}:${v.y === null ? "—" : fmt(v.y)}`).join("  ")}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="notice" style={{ marginTop: 14 }}>
          Nghiệm và cực trị tìm theo phương pháp chia đôi / quét mẫu numerically; tiệm cận
          dọc phát hiện qua dấu nhảy lớn. Giá trị chỉ xấp xỉ, đúng trong khoảng hiển thị.
        </p>
      </section>
    </div>
  );
}
