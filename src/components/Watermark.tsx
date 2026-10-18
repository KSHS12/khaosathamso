import React from 'react';

export const Watermark: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none z-20 flex items-center justify-center overflow-hidden"
    >
      <div className="animate-watermark-move flex flex-col items-center justify-center px-8 py-5 border-y-2 border-dashed border-emerald-400/[0.12] print:border-slate-800/[0.15]">
        <div className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-[0.25em] text-emerald-400/[0.12] print:text-slate-800/[0.15] text-center whitespace-nowrap">
          Toán 12 — Thầy Hữu
        </div>
        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.35em] text-emerald-400/[0.10] print:text-slate-800/[0.12] mt-1.5 text-center">
          Khảo Sát Hàm Số — Toán THPT
        </div>
      </div>
    </div>
  );
};
