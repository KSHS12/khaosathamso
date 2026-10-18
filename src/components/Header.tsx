import React from 'react';

interface HeaderProps {
  onNewSurvey: () => void;
  onOpenTheoryModal?: () => void;
  onOpenGuideModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewSurvey, onOpenTheoryModal, onOpenGuideModal }) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 print:hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand title wordmark */}
        <a
          href="/"
          className="flex items-center shrink-0 group"
        >
          <span className="text-lg font-black tracking-tight text-white whitespace-nowrap group-hover:text-emerald-400 transition-colors">
            <span className="text-emerald-400 font-black">Toán 12</span> — Khảo Sát Hàm Số - Thầy Hữu
          </span>
        </a>

        {/* Zone 2: 4-5 nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-300">
          <button
            onClick={onOpenTheoryModal}
            className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Lý thuyết SGK
          </button>
          <a
            href="#cac-dang-ham"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0"
          >
            Các dạng hàm
          </a>
          <button
            onClick={onOpenGuideModal}
            className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Quy tắc khảo sát
          </button>
          <a
            href="#huong-dan-dung"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0"
          >
            Hướng dẫn
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onNewSurvey}
            className="px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-950 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Khảo sát mới
          </button>
        </div>
      </div>
    </header>
  );
};
