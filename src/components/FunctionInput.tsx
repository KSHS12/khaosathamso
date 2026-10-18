import React, { useState } from 'react';
import { Play, RotateCcw, HelpCircle, BookOpen } from 'lucide-react';
import { MathView } from './MathView';

interface FunctionInputProps {
  onInvestigate: (expr: string, interval?: { min: number; max: number }) => void;
  isLoading?: boolean;
}

const PRESET_EXAMPLES = [
  {
    category: '1. Bậc 3',
    expr: 'x^3 - 3*x + 1',
    label: 'x^3 - 3x + 1',
    description: 'Hàm bậc ba có 2 điểm cực trị và điểm uốn',
  },
  {
    category: '2. Bậc 1/1',
    expr: '(x-2)/(x-1)',
    label: '\\frac{x-2}{x-1}',
    description: 'Nhất biến: TCĐ x=1, TCN y=1, không cực trị',
  },
  {
    category: '3. Điểm khuyết',
    expr: '(x^2-1)/(x-1)',
    label: '\\frac{x^2-1}{x-1}',
    description: 'Điểm khuyết tại x=1, rút gọn thành x+1',
  },
  {
    category: '4. Bậc 4',
    expr: 'x^4 - 2*x^2 - 1',
    label: 'x^4 - 2x^2 - 1',
    description: 'Trùng phương: 3 cực trị, nhận Oy làm trục đối xứng',
  },
  {
    category: '5. Bậc 4 đơn thức',
    expr: 'x^4',
    label: 'x^4',
    description: 'Đơn thức bậc 4: 1 cực tiểu tại x=0',
  },
  {
    category: '6. Bậc 2/1 (TCX)',
    expr: '(x^2 - 2*x + 1)/(x - 2)',
    label: '\\frac{x^2-2x+1}{x-2}',
    description: 'Phân thức bậc 2/1: TCĐ x = 2, TCX y = x',
  },
  {
    category: '7. Hàm mũ',
    expr: '2^(x+1) - 3',
    label: '2^{x+1} - 3',
    description: 'Hàm số mũ: TCN y = -3, đồng biến',
  },
  {
    category: '8. Hàm logarit',
    expr: 'ln(x-1)',
    label: '\\ln(x-1)',
    description: 'TXĐ (1; +∞), TCĐ x = 1',
  },
  {
    category: '9. Logarit cơ số a',
    expr: 'log(x+2, 3)',
    label: '\\log_3(x+2)',
    description: 'Cơ số 3: TXĐ (-2; +∞), TCĐ x = -2',
  },
];

export const FunctionInput: React.FC<FunctionInputProps> = ({ onInvestigate, isLoading = false }) => {
  const [expr, setExpr] = useState('x^3 - 3*x + 1');
  const [useRestrictedInterval, setUseRestrictedInterval] = useState(false);
  const [intervalMin, setIntervalMin] = useState('-3');
  const [intervalMax, setIntervalMax] = useState('3');
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expr.trim()) return;

    let interval: { min: number; max: number } | undefined;
    if (useRestrictedInterval) {
      const minVal = parseFloat(intervalMin);
      const maxVal = parseFloat(intervalMax);
      if (!Number.isNaN(minVal) && !Number.isNaN(maxVal) && minVal < maxVal) {
        interval = { min: minVal, max: maxVal };
      }
    }

    onInvestigate(expr.trim(), interval);
  };

  const handleSelectPreset = (presetExpr: string) => {
    setExpr(presetExpr);
    onInvestigate(
      presetExpr,
      useRestrictedInterval ? { min: parseFloat(intervalMin), max: parseFloat(intervalMax) } : undefined
    );
  };

  const handleReset = () => {
    setExpr('');
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl text-slate-100">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Main Input Row */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="function-input" className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5">
              <span>Nhập hàm số y = f(x):</span>
            </label>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Hướng dẫn nhập</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-black italic font-serif text-lg select-none">
                y =
              </span>
              <input
                id="function-input"
                type="text"
                value={expr}
                onChange={(e) => setExpr(e.target.value)}
                placeholder="Ví dụ: x^3 - 3*x + 1 hoặc (x-2)/(x-1)"
                className="w-full pl-11 pr-4 py-3 text-base font-mono font-bold text-white bg-slate-950 border border-slate-700/90 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-500 placeholder:font-sans shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isLoading || !expr.trim()}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-950 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current text-white" />
                <span>{isLoading ? 'Đang giải...' : 'Khảo sát hàm số'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Xóa ô nhập"
                className="p-3 text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl transition-colors border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Syntax Help Drawer */}
        {showHelp && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-slate-200 space-y-2">
            <div className="font-extrabold text-emerald-300">Quy tắc nhập công thức chuẩn:</div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
              <li>• Lũy thừa: dùng dấu <code className="bg-slate-900 px-1.5 py-0.5 rounded border border-emerald-500/40 font-mono text-emerald-300">^</code> (vd: <code className="font-mono text-white">x^3</code>, <code className="font-mono text-white">x^4</code>)</li>
              <li>• Phép nhân: dùng <code className="bg-slate-900 px-1.5 py-0.5 rounded border border-emerald-500/40 font-mono text-emerald-300">*</code> hoặc viết liền (vd: <code className="font-mono text-white">3*x</code> hoặc <code className="font-mono text-white">3x</code>)</li>
              <li>• Phân thức: đóng ngoặc tử và mẫu (vd: <code className="font-mono text-white">(x-2)/(x-1)</code>, <code className="font-mono text-white">(x^2-1)/(x+2)</code>)</li>
              <li>• Hàm số mũ: <code className="font-mono text-white">2^(x+1)-3</code> hoặc <code className="font-mono text-white">e^(2x)</code></li>
              <li>• Hàm logarit: <code className="font-mono text-white">ln(x-1)</code> hoặc <code className="font-mono text-white">log(x+2, 3)</code> (nghĩa là <MathView math="\\log_3(x+2)" />)</li>
            </ul>
          </div>
        )}

        {/* Interval Selection Toggle */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-extrabold select-none">
            <input
              type="checkbox"
              checked={useRestrictedInterval}
              onChange={(e) => setUseRestrictedInterval(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700 focus:ring-emerald-500"
            />
            <span className="text-slate-200">Khảo sát thu hẹp trên khoảng [a; b] (mặc định là toàn tập xác định)</span>
          </label>

          {useRestrictedInterval && (
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-extrabold">Từ a =</span>
              <input
                type="number"
                value={intervalMin}
                onChange={(e) => setIntervalMin(e.target.value)}
                className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-xs font-mono text-white font-bold"
              />
              <span className="text-emerald-400 font-extrabold">đến b =</span>
              <input
                type="number"
                value={intervalMax}
                onChange={(e) => setIntervalMax(e.target.value)}
                className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-xs font-mono text-white font-bold"
              />
            </div>
          )}
        </div>

        {/* Quick Presets */}
        <div className="pt-2">
          <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ví dụ SGK chọn nhanh:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_EXAMPLES.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(item.expr)}
                title={item.description}
                className="px-3 py-2 text-xs font-bold text-slate-200 bg-slate-800/90 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-500 border border-slate-700/80 rounded-xl transition-all text-left flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span className="text-emerald-400 font-bold text-[11px]">{item.category}:</span>
                <span className="text-white font-bold">
                  <MathView math={item.label} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
