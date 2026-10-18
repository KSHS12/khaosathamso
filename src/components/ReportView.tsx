import React from 'react';
import { InvestigationResult } from '../math/types';
import { MathView, MathText } from './MathView';
import { VariationTable } from './VariationTable';
import { GraphCanvas } from './GraphCanvas';
import { Printer, Download, AlertCircle } from 'lucide-react';

interface ReportViewProps {
  result: InvestigationResult;
}

export const ReportView: React.FC<ReportViewProps> = ({ result }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReport = () => {
    const textContent = `
BÁO CÁO KHẢO SÁT HÀM SỐ
Hàm số: ${result.originalExpr}
Dạng chuẩn: ${result.standardFormulaLatex}

I. TẬP XÁC ĐỊNH
${result.domainExplanation}

II. KHẢO SÁT SỰ BIẾN THIÊN
1. Đạo hàm bậc 1:
   y' = ${result.fPrimeLatex}
   ${result.fPrimeRootsLatex}
2. Đạo hàm bậc 2:
   ${result.fDoublePrimeLatex ? `y'' = ${result.fDoublePrimeLatex}` : 'Không áp dụng'}
   ${result.fDoublePrimeRootsLatex ? result.fDoublePrimeRootsLatex : ''}
3. Giới hạn và tiệm cận:
${result.limitsLatex.map((l) => `   * ${l}`).join('\n')}
${result.asymptoteExplanation}
4. Kết luận về chiều biến thiên và cực trị:
   ${result.monotonicExplanation}
   ${result.extremaExplanation}

III. GIAO ĐIỂM VÀ ĐIỂM ĐẶC BIỆT
- Giao điểm trục tọa độ:
${result.intersections.map((i) => `  * ${i.axis}: ${i.exactLabel}`).join('\n')}
${result.symmetryCenter ? `- ${result.symmetryCenter.label}` : ''}
${result.symmetryAxis ? `- Trục đối xứng: ${result.symmetryAxis.equation}` : ''}
    `.trim();

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `khao-sat-${result.originalExpr.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 bg-slate-900/95 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl text-slate-200">
      {/* Header Lời giải */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="text-xs font-extrabold text-emerald-400 tracking-wider uppercase">
            Lời giải chi tiết theo chuẩn SGK Toán 12
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1.5 flex flex-wrap items-center gap-3">
            <span className="text-slate-100">Khảo sát hàm số:</span>
            <span className="text-emerald-400 font-extrabold bg-emerald-950/70 px-4 py-1.5 rounded-xl border border-emerald-500/40 shadow-inner">
              <MathView math={result.standardFormulaLatex} />
            </span>
          </h2>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 print:hidden">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white rounded-xl transition-colors border border-slate-700 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Tải lời giải</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-900/50 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In lời giải</span>
          </button>
        </div>
      </div>

      {/* Warnings if any */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl text-sm text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-300">Lưu ý về phương pháp giải:</div>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs text-amber-200/90">
              {result.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* MỤC I: TẬP XÁC ĐỊNH */}
      <section className="space-y-3">
        <h3 className="text-lg font-extrabold text-white flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-black shadow-sm">
            I
          </span>
          <span className="text-emerald-400 font-extrabold text-lg">Tập xác định</span>
        </h3>
        <div className="pl-9 text-sm text-slate-200 space-y-2">
          <MathText text={result.domainExplanation} className="text-slate-200 text-base font-normal" />
          {result.restrictedInterval && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs mt-2">
              <strong className="text-emerald-400 font-bold">Khảo sát thu hẹp trên khoảng người dùng chọn:</strong>{' '}
              <MathView
                math={`[${result.restrictedInterval.min};\\, ${result.restrictedInterval.max}]`}
              />
              . Miền khảo sát tương ứng là giao của khoảng này với tập xác định <MathView math="D" />.
            </div>
          )}
        </div>
      </section>

      {/* MỤC II: KHẢO SÁT SỰ BIẾN THIÊN (THEO TRÌNH TỰ 4 BƯỚC + BẢNG BIẾN THIÊN) */}
      <section className="space-y-5">
        <h3 className="text-lg font-extrabold text-white flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-black shadow-sm">
            II
          </span>
          <span className="text-emerald-400 font-extrabold text-lg">Sự biến thiên</span>
        </h3>

        <div className="pl-9 text-sm space-y-6 text-slate-200">
          {/* Bước 1: Đạo hàm bậc 1 */}
          <div className="space-y-2">
            <div className="font-extrabold text-emerald-300 text-base flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Đạo hàm bậc một:</span>
            </div>
            <div className="my-2 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl inline-block text-white shadow-inner">
              <MathView math={`y' = f'(x) = ${result.fPrimeLatex}`} displayMode />
            </div>
            <div className="mt-1 text-slate-200 font-medium">
              <MathView math={result.fPrimeRootsLatex} />
            </div>
          </div>

          {/* Bước 2: Đạo hàm bậc hai */}
          <div className="space-y-2">
            <div className="font-extrabold text-emerald-300 text-base flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Đạo hàm bậc hai:</span>
            </div>
            {result.fDoublePrimeLatex ? (
              <div>
                <div className="my-2 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl inline-block text-white shadow-inner">
                  <MathView math={`y'' = f''(x) = ${result.fDoublePrimeLatex}`} displayMode />
                </div>
                {result.fDoublePrimeRootsLatex && (
                  <div className="mt-1 text-slate-200 font-medium">
                    <MathView math={result.fDoublePrimeRootsLatex} />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-400 italic text-xs">
                (Đạo hàm bậc hai không yêu cầu bắt buộc đối với dạng hàm số này theo chuẩn SGK).
              </div>
            )}
          </div>

          {/* Bước 3: Giới hạn và tiệm cận */}
          <div className="space-y-3">
            <div className="font-extrabold text-emerald-300 text-base flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-center font-bold">
                3
              </span>
              <span>Giới hạn tại vô cực và các đường tiệm cận:</span>
            </div>

            {result.limitsLatex.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Các giới hạn:</div>
                <div className="flex flex-wrap gap-2.5">
                  {result.limitsLatex.map((l, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-white shadow-inner"
                    >
                      <MathView math={l} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kết luận tiệm cận:</div>
              <div className="leading-relaxed text-slate-200 bg-slate-950/70 p-4 border border-slate-800 rounded-xl">
                <MathText text={result.asymptoteExplanation} />
              </div>
            </div>
          </div>

          {/* BẢNG BIẾN THIÊN (ĐẶT NGAY TRONG TIẾN TRÌNH SỰ BIẾN THIÊN ĐỂ TỔNG HỢP TRƯỚC KHI KẾT LUẬN) */}
          <div className="space-y-2.5 pt-2">
            <div className="font-extrabold text-emerald-400 text-base flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-black">
                BẢNG
              </span>
              <span>Bảng biến thiên:</span>
            </div>
            <div className="pt-1">
              <VariationTable data={result.variationTable} restrictedInterval={result.restrictedInterval} />
            </div>
          </div>

          {/* Bước 4: Kết luận: về chiều biến thiên, cực trị của hàm số */}
          <div className="space-y-4 pt-2">
            <div className="font-extrabold text-emerald-300 text-base flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-center font-bold">
                4
              </span>
              <span>Kết luận về chiều biến thiên và cực trị của hàm số:</span>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div>
                <strong className="text-emerald-400 font-extrabold text-sm block mb-1">
                  a) Chiều biến thiên:
                </strong>
                <div className="text-slate-200 leading-relaxed pl-3 border-l-2 border-emerald-500/40">
                  <MathText text={result.monotonicExplanation} />
                </div>
              </div>

              <div>
                <strong className="text-emerald-400 font-extrabold text-sm block mb-1">
                  b) Cực trị của hàm số:
                </strong>
                <div className="text-slate-200 leading-relaxed pl-3 border-l-2 border-emerald-500/40">
                  <MathText text={result.extremaExplanation} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MỤC III: GIAO ĐIỂM VÀ ĐIỂM ĐẶC BIỆT */}
      <section className="space-y-3">
        <h3 className="text-lg font-extrabold text-white flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-black shadow-sm">
            III
          </span>
          <span className="text-emerald-400 font-extrabold text-lg">
            Giao điểm với các trục tọa độ & các điểm đặc biệt
          </span>
        </h3>

        <div className="pl-9 text-sm space-y-3 text-slate-200">
          <div>
            <div className="font-extrabold text-emerald-300 text-base">Giao điểm với các trục tọa độ:</div>
            <ul className="list-disc list-inside mt-2 space-y-1.5">
              {result.intersections.map((inter, idx) => (
                <li key={idx}>
                  Giao điểm với trục <strong className="text-emerald-400">{inter.axis}</strong>: điểm{' '}
                  <span className="font-mono font-bold text-emerald-300 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                    <MathView math={inter.exactLabel} />
                  </span>
                  {inter.isApproximate && (
                    <span className="text-xs text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded ml-2 border border-amber-500/40">
                      xấp xỉ
                    </span>
                  )}
                </li>
              ))}
              {result.intersections.length === 0 && <li>Đồ thị không cắt các trục tọa độ.</li>}
            </ul>
          </div>

          {result.symmetryCenter && (
            <div>
              <div className="font-extrabold text-emerald-300 text-base">Tâm đối xứng của đồ thị:</div>
              <div className="mt-1.5">
                Đồ thị nhận điểm{' '}
                <MathView math={result.symmetryCenter.latex} className="text-fuchsia-400 font-bold" /> làm tâm đối xứng.
              </div>
            </div>
          )}

          {result.symmetryAxis && (
            <div>
              <div className="font-extrabold text-emerald-300 text-base">Trục đối xứng:</div>
              <div className="mt-1.5">
                Đồ thị nhận đường thẳng{' '}
                <MathView math={result.symmetryAxis.latex} className="text-emerald-400 font-bold" /> làm trục đối xứng.
              </div>
            </div>
          )}

          {result.inflectionPoints.length > 0 && (
            <div>
              <div className="font-extrabold text-emerald-300 text-base">Điểm uốn:</div>
              <div className="mt-1.5">
                {result.inflectionPoints.map((ip, idx) => (
                  <span key={idx}>
                    Điểm uốn <MathView math={`U(${ip.exactX};\\, ${ip.exactY})`} className="text-fuchsia-400 font-bold" />.
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MỤC IV: ĐỒ THỊ HÀM SỐ (VỚI HỆ TRỤC TỌA ĐỘ NỀN TRẮNG SẮC NÉT) */}
      <section className="space-y-3">
        <h3 className="text-lg font-extrabold text-white flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-black shadow-sm">
            IV
          </span>
          <span className="text-emerald-400 font-extrabold text-lg">Đồ thị hàm số</span>
        </h3>

        <div className="pl-0 sm:pl-9 space-y-4">
          <GraphCanvas
            evaluate={result.evaluate}
            excludedPoints={result.excludedPoints}
            asymptotes={result.asymptotes}
            holes={result.holes}
            extrema={result.extrema}
            intersections={result.intersections}
            inflectionPoints={result.inflectionPoints}
            symmetryCenter={result.symmetryCenter}
            title={`Đồ thị ${result.standardFormulaLatex}`}
          />
        </div>
      </section>
    </div>
  );
};
