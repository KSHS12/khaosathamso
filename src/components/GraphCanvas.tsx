import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Asymptote, AxisIntersection, CriticalPoint, Hole } from '../math/types';
import { Download, RotateCcw, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { formatNumberLatex } from '../math/fractions';

interface GraphCanvasProps {
  evaluate: (x: number) => number | null;
  excludedPoints: number[];
  asymptotes: Asymptote[];
  holes: Hole[];
  extrema: CriticalPoint[];
  intersections: AxisIntersection[];
  inflectionPoints: CriticalPoint[];
  symmetryCenter?: { x: number; y: number; label: string };
  initialBounds?: { xMin: number; xMax: number; yMin: number; yMax: number };
  title?: string;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  evaluate,
  excludedPoints,
  asymptotes,
  holes,
  extrema,
  intersections,
  inflectionPoints,
  symmetryCenter,
  initialBounds,
  title = 'Đồ thị hàm số y = f(x)',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [bounds, setBounds] = useState(() => {
    if (initialBounds) return initialBounds;
    let xMin = -6;
    let xMax = 6;
    let yMin = -6;
    let yMax = 6;

    const allPts = [
      ...extrema.map((p) => ({ x: p.x, y: p.y })),
      ...holes.map((h) => ({ x: h.x, y: h.y })),
      ...intersections.map((i) => ({ x: i.x, y: i.y })),
      ...inflectionPoints.map((p) => ({ x: p.x, y: p.y })),
    ];

    if (symmetryCenter) allPts.push({ x: symmetryCenter.x, y: symmetryCenter.y });

    for (const a of asymptotes) {
      if (a.type === 'vertical' && a.xVal !== undefined) {
        allPts.push({ x: a.xVal, y: 0 });
      }
      if (a.type === 'horizontal' && a.intercept !== undefined) {
        allPts.push({ x: 0, y: a.intercept });
      }
    }

    if (allPts.length > 0) {
      const xs = allPts.map((p) => p.x).filter(Number.isFinite);
      const ys = allPts.map((p) => p.y).filter(Number.isFinite);
      if (xs.length > 0) {
        xMin = Math.min(-4, Math.floor(Math.min(...xs) - 2));
        xMax = Math.max(4, Math.ceil(Math.max(...xs) + 2));
      }
      if (ys.length > 0) {
        yMin = Math.min(-4, Math.floor(Math.min(...ys) - 2));
        yMax = Math.max(4, Math.ceil(Math.max(...ys) + 2));
      }
    }

    return { xMin, xMax, yMin, yMax };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  const toScreenX = useCallback(
    (mathX: number, width: number) => {
      return ((mathX - bounds.xMin) / (bounds.xMax - bounds.xMin)) * width;
    },
    [bounds.xMin, bounds.xMax]
  );

  const toScreenY = useCallback(
    (mathY: number, height: number) => {
      return height - ((mathY - bounds.yMin) / (bounds.yMax - bounds.yMin)) * height;
    },
    [bounds.yMin, bounds.yMax]
  );

  const toMathX = useCallback(
    (screenX: number, width: number) => {
      return bounds.xMin + (screenX / width) * (bounds.xMax - bounds.xMin);
    },
    [bounds.xMin, bounds.xMax]
  );

  const toMathY = useCallback(
    (screenY: number, height: number) => {
      return bounds.yMin + ((height - screenY) / height) * (bounds.yMax - bounds.yMin);
    },
    [bounds.yMin, bounds.yMax]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Pure White Canvas Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 1. Grid
    const xSpan = bounds.xMax - bounds.xMin;
    const ySpan = bounds.yMax - bounds.yMin;

    let xStep = 1;
    if (xSpan > 25) xStep = 5;
    else if (xSpan > 12) xStep = 2;
    else if (xSpan < 4) xStep = 0.5;

    let yStep = 1;
    if (ySpan > 25) yStep = 5;
    else if (ySpan > 12) yStep = 2;
    else if (ySpan < 4) yStep = 0.5;

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#e2e8f0'; // slate-200 clean grid

    const xFirst = Math.floor(bounds.xMin / xStep) * xStep;
    for (let x = xFirst; x <= bounds.xMax; x += xStep) {
      const sx = toScreenX(x, width);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }

    const yFirst = Math.floor(bounds.yMin / yStep) * yStep;
    for (let y = yFirst; y <= bounds.yMax; y += yStep) {
      const sy = toScreenY(y, height);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
    }

    // 2. Axes
    const ox = toScreenX(0, width);
    const oy = toScreenY(0, height);

    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 1.6;

    // Ox
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.stroke();

    // Ox arrow
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(width - 8, oy - 4);
    ctx.lineTo(width, oy);
    ctx.lineTo(width - 8, oy + 4);
    ctx.fill();

    // Oy
    ctx.beginPath();
    ctx.moveTo(ox, height);
    ctx.lineTo(ox, 0);
    ctx.stroke();

    // Oy arrow
    ctx.beginPath();
    ctx.moveTo(ox - 4, 8);
    ctx.lineTo(ox, 0);
    ctx.lineTo(ox + 4, 8);
    ctx.fill();

    // Axis Labels
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('x', width - 14, oy - 8);
    ctx.fillText('y', ox + 8, 14);
    ctx.fillText('O', ox - 12, oy + 14);

    // Ticks & Numbers
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#475569';

    for (let x = xFirst; x <= bounds.xMax; x += xStep) {
      if (Math.abs(x) < 1e-6) continue;
      const sx = toScreenX(x, width);
      ctx.beginPath();
      ctx.moveTo(sx, oy - 3);
      ctx.lineTo(sx, oy + 3);
      ctx.stroke();
      ctx.fillText(Number(x.toFixed(2)).toString(), sx - 6, oy + 14);
    }

    for (let y = yFirst; y <= bounds.yMax; y += yStep) {
      if (Math.abs(y) < 1e-6) continue;
      const sy = toScreenY(y, height);
      ctx.beginPath();
      ctx.moveTo(ox - 3, sy);
      ctx.lineTo(ox + 3, sy);
      ctx.stroke();
      ctx.fillText(Number(y.toFixed(2)).toString(), ox - 24, sy + 3);
    }

    // 3. Asymptotes (Dashed lines)
    for (const asy of asymptotes) {
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.6;

      if (asy.type === 'vertical' && asy.xVal !== undefined) {
        ctx.strokeStyle = '#dc2626'; // Red-600
        const sx = toScreenX(asy.xVal, width);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.stroke();

        ctx.fillStyle = '#b91c1c';
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`TCĐ: x = ${Number(asy.xVal.toFixed(2))}`, sx + 6, 24);
      } else if (asy.type === 'horizontal' && asy.intercept !== undefined) {
        ctx.strokeStyle = '#0284c7'; // Sky-600
        const sy = toScreenY(asy.intercept, height);
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
        ctx.stroke();

        ctx.fillStyle = '#0369a1';
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`TCN: y = ${Number(asy.intercept.toFixed(2))}`, 16, sy - 6);
      } else if (asy.type === 'oblique' && asy.slope !== undefined && asy.intercept !== undefined) {
        ctx.strokeStyle = '#7c3aed'; // Purple-600
        const yLeft = asy.slope * bounds.xMin + asy.intercept;
        const yRight = asy.slope * bounds.xMax + asy.intercept;
        ctx.beginPath();
        ctx.moveTo(toScreenX(bounds.xMin, width), toScreenY(yLeft, height));
        ctx.lineTo(toScreenX(bounds.xMax, width), toScreenY(yRight, height));
        ctx.stroke();

        ctx.fillStyle = '#6d28d9';
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`TCX: ${asy.equation}`, width - 130, 24);
      }
      ctx.restore();
    }

    // 4. Function Curves (Splitting into branches around excluded points)
    const splits = [...new Set(excludedPoints)].sort((a, b) => a - b);
    const intervals: { start: number; end: number }[] = [];
    let curStart = bounds.xMin;

    for (const sp of splits) {
      if (sp > bounds.xMin && sp < bounds.xMax) {
        intervals.push({ start: curStart, end: sp - 0.005 });
        curStart = sp + 0.005;
      }
    }
    intervals.push({ start: curStart, end: bounds.xMax });

    // Imperial Jade Green Curve (Xanh lục phỉ thúy đậm nét)
    ctx.strokeStyle = '#059669'; // Emerald-600 / Jade green
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const numPointsPerInterval = Math.max(300, Math.floor(width / intervals.length));

    for (const intv of intervals) {
      ctx.beginPath();
      let started = false;
      const step = (intv.end - intv.start) / numPointsPerInterval;

      for (let x = intv.start; x <= intv.end; x += step) {
        const y = evaluate(x);
        if (y === null || Number.isNaN(y) || !Number.isFinite(y)) {
          started = false;
          continue;
        }

        if (y < bounds.yMin - (bounds.yMax - bounds.yMin) * 2 || y > bounds.yMax + (bounds.yMax - bounds.yMin) * 2) {
          started = false;
          continue;
        }

        const sx = toScreenX(x, width);
        const sy = toScreenY(y, height);

        if (!started) {
          ctx.moveTo(sx, sy);
          started = true;
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.stroke();
    }

    // 5. Special Points
    // Extrema
    for (const ext of extrema) {
      if (ext.x < bounds.xMin || ext.x > bounds.xMax || ext.y < bounds.yMin || ext.y > bounds.yMax) continue;
      const sx = toScreenX(ext.x, width);
      const sy = toScreenY(ext.y, height);

      // Projections
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, oy);
      ctx.moveTo(sx, sy);
      ctx.lineTo(ox, sy);
      ctx.stroke();
      ctx.restore();

      // Dot
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = ext.type === 'max' ? '#ea580c' : '#059669';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = ext.type === 'max' ? '#c2410c' : '#047857';
      const label = `${ext.type === 'max' ? 'CĐ' : 'CT'} (${formatNumberLatex(ext.x)}; ${formatNumberLatex(ext.y)})`;
      ctx.fillText(label, sx + 6, ext.type === 'max' ? sy - 8 : sy + 14);
    }

    // Intersections
    for (const inter of intersections) {
      if (inter.x < bounds.xMin || inter.x > bounds.xMax || inter.y < bounds.yMin || inter.y > bounds.yMax) continue;
      const sx = toScreenX(inter.x, width);
      const sy = toScreenY(inter.y, height);

      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1'; // Indigo-500
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Holes
    for (const h of holes) {
      if (h.x < bounds.xMin || h.x > bounds.xMax || h.y < bounds.yMin || h.y > bounds.yMax) continue;
      const sx = toScreenX(h.x, width);
      const sy = toScreenY(h.y, height);

      ctx.beginPath();
      ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#b91c1c';
      ctx.fillText(`Điểm khuyết (${h.exactX}; ${h.exactY})`, sx + 8, sy - 6);
    }

    // Inflection point / Symmetry Center
    if (symmetryCenter) {
      if (
        symmetryCenter.x >= bounds.xMin &&
        symmetryCenter.x <= bounds.xMax &&
        symmetryCenter.y >= bounds.yMin &&
        symmetryCenter.y <= bounds.yMax
      ) {
        const sx = toScreenX(symmetryCenter.x, width);
        const sy = toScreenY(symmetryCenter.y, height);

        ctx.beginPath();
        ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#c026d3'; // Fuchsia-600
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#a21caf';
        ctx.fillText(symmetryCenter.label, sx + 6, sy - 8);
      }
    }

    // Hover Indicator
    if (hoverCoord) {
      const sx = toScreenX(hoverCoord.x, width);
      const sy = toScreenY(hoverCoord.y, height);

      ctx.save();
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#059669';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [
    bounds,
    evaluate,
    excludedPoints,
    asymptotes,
    holes,
    extrema,
    intersections,
    inflectionPoints,
    symmetryCenter,
    hoverCoord,
    toScreenX,
    toScreenY,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      const dxScreen = e.clientX - dragStart.x;
      const dyScreen = e.clientY - dragStart.y;
      const dxMath = (dxScreen / rect.width) * (bounds.xMax - bounds.xMin);
      const dyMath = (dyScreen / rect.height) * (bounds.yMax - bounds.yMin);

      setBounds((prev) => ({
        xMin: prev.xMin - dxMath,
        xMax: prev.xMax - dxMath,
        yMin: prev.yMin + dyMath,
        yMax: prev.yMax + dyMath,
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      const mathX = toMathX(mouseX, rect.width);
      const mathY = evaluate(mathX);
      if (mathY !== null && Number.isFinite(mathY)) {
        setHoverCoord({ x: mathX, y: mathY });
      } else {
        setHoverCoord(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const focalX = toMathX(mouseX, rect.width);
    const focalY = toMathY(mouseY, rect.height);

    const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;
    zoomAt(focalX, focalY, zoomFactor);
  };

  const zoomAt = (focalX: number, focalY: number, factor: number) => {
    setBounds((prev) => {
      const newXMin = focalX - (focalX - prev.xMin) * factor;
      const newXMax = focalX + (prev.xMax - focalX) * factor;
      const newYMin = focalY - (focalY - prev.yMin) * factor;
      const newYMax = focalY + (prev.yMax - focalY) * factor;
      return { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
    });
  };

  const handleZoomIn = () => {
    const cx = (bounds.xMin + bounds.xMax) / 2;
    const cy = (bounds.yMin + bounds.yMax) / 2;
    zoomAt(cx, cy, 0.8);
  };

  const handleZoomOut = () => {
    const cx = (bounds.xMin + bounds.xMax) / 2;
    const cy = (bounds.yMin + bounds.yMax) / 2;
    zoomAt(cx, cy, 1.25);
  };

  const handleReset = () => {
    setBounds(initialBounds || { xMin: -6, xMax: 6, yMin: -6, yMax: 6 });
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `do-thi-ham-so-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden" ref={containerRef}>
      {/* Graph Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-bold text-emerald-400">
          <span>{title}</span>
          {hoverCoord && (
            <span className="ml-3 font-mono font-bold text-emerald-300 bg-emerald-950/70 px-2.5 py-0.5 rounded border border-emerald-500/40">
              x = {hoverCoord.x.toFixed(2)}, y = {hoverCoord.y.toFixed(2)}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomIn}
            title="Phóng to"
            className="p-1.5 text-slate-300 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Thu nhỏ"
            className="p-1.5 text-slate-300 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            title="Đặt lại khung nhìn"
            className="p-1.5 text-slate-300 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportPNG}
            title="Tải ảnh đồ thị PNG"
            className="flex items-center gap-1 px-2.5 py-1.5 text-slate-200 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 hover:text-white transition-colors font-bold text-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-bold">Tải ảnh PNG</span>
          </button>
        </div>
      </div>

      {/* Pure White Coordinate Canvas Area */}
      <div className="relative w-full h-[470px] cursor-crosshair bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full block bg-white"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            setHoverCoord(null);
          }}
          onWheel={handleWheel}
        />
        {/* Floating guide legend */}
        <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-md border border-slate-300 rounded-lg px-3 py-1.5 text-[11px] text-slate-700 shadow-md flex flex-wrap gap-3.5 pointer-events-none">
          <span className="flex items-center gap-1.5 font-bold text-emerald-700">
            <span className="w-3 h-0.5 bg-emerald-600 inline-block"></span> Đồ thị f(x)
          </span>
          {asymptotes.some((a) => a.type === 'vertical') && (
            <span className="flex items-center gap-1.5 text-red-600 font-semibold">
              <span className="w-3 h-0.5 border-b border-dashed border-red-600 inline-block"></span> Tiệm cận đứng
            </span>
          )}
          {asymptotes.some((a) => a.type === 'horizontal') && (
            <span className="flex items-center gap-1.5 text-sky-600 font-semibold">
              <span className="w-3 h-0.5 border-b border-dashed border-sky-600 inline-block"></span> Tiệm cận ngang
            </span>
          )}
          {asymptotes.some((a) => a.type === 'oblique') && (
            <span className="flex items-center gap-1.5 text-purple-600 font-semibold">
              <span className="w-3 h-0.5 border-b border-dashed border-purple-600 inline-block"></span> Tiệm cận xiên
            </span>
          )}
          {holes.length > 0 && (
            <span className="flex items-center gap-1.5 text-red-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-red-600 bg-white inline-block"></span> Điểm khuyết
            </span>
          )}
          <span className="flex items-center gap-1 text-slate-400">
            <Move className="w-3 h-3" /> Cuộn chuột zoom, kéo để pan
          </span>
        </div>
      </div>
    </div>
  );
};
