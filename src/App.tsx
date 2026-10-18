import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FunctionInput } from './components/FunctionInput';
import { ReportView } from './components/ReportView';
import { TheoryModal } from './components/TheoryModal';
import { Watermark } from './components/Watermark';
import { investigateFunction } from './math/investigator';
import { InvestigationResult } from './math/types';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  const [currentExpr, setCurrentExpr] = useState('x^3 - 3*x + 1');
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);

  const runInvestigation = useCallback(
    (expr: string, interval?: { min: number; max: number }) => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const res = investigateFunction(expr, interval);
        setResult(res);
        setCurrentExpr(expr);
      } catch (err: unknown) {
        console.error('Lỗi khảo sát:', err);
        const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi phân tích hàm số';
        setErrorMsg(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    runInvestigation('x^3 - 3*x + 1');
  }, [runInvestigation]);

  const handleNewSurvey = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const inputEl = document.getElementById('function-input') as HTMLInputElement | null;
    if (inputEl) {
      inputEl.focus();
      inputEl.select();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-600 selection:text-white relative">
      {/* Floating Centered Watermark that travels to all positions */}
      <Watermark />

      {/* 3-Zone Header Contract */}
      <Header
        onNewSurvey={handleNewSurvey}
        onOpenTheoryModal={() => setIsTheoryOpen(true)}
        onOpenGuideModal={() => setIsTheoryOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Title & Introduction */}
        <div className="space-y-2 text-center sm:text-left print:hidden">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-slate-400">
            <span className="text-emerald-400 font-black">Chương trình GDPT 2018</span>
            <span aria-hidden="true">·</span>
            <span>Toán 12 Kết nối tri thức</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-300 font-extrabold">Bộ giải ký hiệu chính xác</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Khảo sát sự biến thiên & vẽ đồ thị hàm số
          </h1>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            Hệ thống giải tích chuẩn mực: tính đạo hàm bậc 1, đạo hàm bậc 2, giới hạn và tiệm cận, bảng biến thiên và kết luận chiều biến thiên, cực trị theo đúng quy tắc SGK Toán 12.
          </p>
        </div>

        {/* Function Input Box */}
        <section className="print:hidden">
          <FunctionInput onInvestigate={runInvestigation} isLoading={isLoading} />
        </section>

        {/* Error Callout if any */}
        {errorMsg && (
          <div className="p-4 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-rose-200 flex items-start gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-300 text-base">Không thể khảo sát biểu thức này</div>
              <div className="text-sm mt-0.5 text-rose-200">{errorMsg}</div>
              <div className="text-xs text-rose-300/80 mt-2">
                Gợi ý: Kiểm tra lại ngoặc đơn <code className="bg-slate-900 px-1.5 py-0.5 rounded border border-rose-400 font-mono text-white">(...)</code>, dấu lũy thừa <code className="bg-slate-900 px-1.5 py-0.5 rounded border border-rose-400 font-mono text-white">^</code>, hoặc bấm chọn một ví dụ mẫu ở trên.
              </div>
            </div>
          </div>
        )}

        {/* Investigation Report Solution */}
        {result && (
          <section id="loi-giai-chi-tiet">
            <ReportView result={result} />
          </section>
        )}

        {/* Educational Reference Cards */}
        <section id="cac-dang-ham" className="pt-6 border-t border-slate-800 space-y-4 print:hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white">
              Phạm vi các dạng hàm số <span className="text-emerald-400 font-black">Toán 12 THPT</span>
            </h3>
            <span className="text-xs text-emerald-400 font-extrabold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              Chuẩn GDPT 2018
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-2">
              <div className="font-extrabold text-emerald-400 text-base">Hàm đa thức</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bậc 1, bậc 2, bậc 3 (có điểm uốn làm tâm đối xứng) và bậc 4 trùng phương (nhận trục tung làm trục đối xứng).
              </p>
              <div className="text-xs font-mono font-bold text-emerald-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                x^3 - 3*x + 1, x^4 - 2*x^2 + 1
              </div>
            </div>

            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-2">
              <div className="font-extrabold text-emerald-400 text-base">Hàm phân thức hữu tỉ</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Nhất biến (ax+b)/(cx+d) và bậc hai trên bậc một (ax²+bx+c)/(dx+e) có tiệm cận xiên. Tự động nhận diện điểm khuyết (hỗng).
              </p>
              <div className="text-xs font-mono font-bold text-emerald-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                (x-2)/(x-1), (x^2-2*x+1)/(x-2)
              </div>
            </div>

            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-2">
              <div className="font-extrabold text-emerald-400 text-base">Hàm số mũ & Lôgarit</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hàm số mũ A·a^(kx+h)+B và hàm số lôgarit A·log_a(kx+h)+B (hỗ trợ ln). Tự động tìm tập xác định và tiệm cận tương ứng.
              </p>
              <div className="text-xs font-mono font-bold text-emerald-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                2^(x+1)-3, ln(x-1), log(x+2, 3)
              </div>
            </div>
          </div>
        </section>

        {/* Guideline section for Pedagogical reference */}
        <section id="huong-dan-dung" className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-2.5 print:hidden">
          <div className="font-extrabold text-emerald-400 text-sm">Lưu ý sư phạm & toán học:</div>
          <p>
            • Khi giải phương trình đạo hàm hoặc tìm giao điểm trục hoành, các nghiệm hữu tỉ được hiển thị dưới dạng phân số tối giản chính xác. Trong trường hợp nghiệm vô tỉ, ứng dụng hiển thị giá trị căn thức hoặc số thực có ghi chú <span className="text-amber-400 font-bold">“xấp xỉ”</span>.
          </p>
          <p>
            • Đồ thị được chia thành các nhánh tách biệt qua các đường tiệm cận đứng hoặc điểm khuyết, tuyệt đối không nối đoạn thẳng xuyên qua điểm gián đoạn.
          </p>
          <p>
            • Bạn có thể dùng nút <span className="text-emerald-400 font-bold">“In lời giải”</span> hoặc <span className="text-emerald-400 font-bold">“Tải lời giải”</span> để xuất đề tài liệu khảo sát hoàn chỉnh cho học sinh hoặc đính kèm vào giáo án.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-12 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Khảo Sát Hàm Số - Thầy Hữu — Ứng dụng hỗ trợ giảng dạy và học tập môn Toán THPT theo chương trình SGK 2018.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsTheoryOpen(true)}
              className="hover:text-emerald-400 transition-colors cursor-pointer font-bold"
            >
              Lý thuyết SGK
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleNewSurvey}
              className="hover:text-emerald-400 transition-colors cursor-pointer font-bold"
            >
              Lên đầu trang
            </button>
          </div>
        </div>
      </footer>

      {/* Theory Reference Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
}
