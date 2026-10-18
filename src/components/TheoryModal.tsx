import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { MathView } from './MathView';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5 text-white font-extrabold text-lg">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>Sơ đồ khảo sát hàm số — SGK Toán 12 (Kết nối tri thức)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          <div>
            <h4 className="font-black text-emerald-400 text-base mb-3">
              Trình tự khảo sát sự biến thiên và vẽ đồ thị hàm số:
            </h4>
            <ol className="list-decimal list-inside space-y-3.5 pl-2 text-slate-200">
              <li>
                <strong className="text-emerald-300 font-extrabold">Tìm tập xác định của hàm số:</strong>
                <p className="font-normal text-slate-400 mt-1 pl-4">
                  Xác định điều kiện để biểu thức có nghĩa (mẫu số khác 0, biểu thức dưới dấu logarit dương...).
                </p>
              </li>
              <li>
                <strong className="text-emerald-300 font-extrabold">Khảo sát sự biến thiên (theo 4 bước chuẩn):</strong>
                <ul className="list-disc list-inside font-normal text-slate-400 mt-1 pl-4 space-y-1.5">
                  <li><strong className="text-emerald-400 font-bold">1. Đạo hàm bậc 1:</strong> Tính <MathView math="y' = f'(x)" className="text-white font-bold" />, giải <MathView math="y' = 0" className="text-white font-bold" /> và tìm các điểm tại đó đạo hàm không xác định.</li>
                  <li><strong className="text-emerald-400 font-bold">2. Đạo hàm bậc 2:</strong> Tính <MathView math="y'' = f''(x)" className="text-white font-bold" />, tìm điểm uốn (với hàm bậc 3).</li>
                  <li><strong className="text-emerald-400 font-bold">3. Giới hạn & tiệm cận:</strong> Tìm giới hạn tại vô cực (<MathView math="\\lim_{x \\to \\pm\\infty} f(x)" className="text-white font-bold" />), tiệm cận ngang, tiệm cận xiên (phép chia đa thức), và giới hạn một bên để kết luận tiệm cận đứng / điểm khuyết.</li>
                  <li><strong className="text-emerald-400 font-bold">Lập Bảng biến thiên:</strong> Tổng hợp đầy đủ dấu đạo hàm, chiều biến thiên và các giới hạn ở hai đầu nhánh trên nền trắng trực quan.</li>
                  <li><strong className="text-emerald-400 font-bold">4. Kết luận:</strong> Nêu rõ các khoảng đồng biến, nghịch biến và tọa độ các điểm cực đại, cực tiểu của hàm số.</li>
                </ul>
              </li>
              <li>
                <strong className="text-emerald-300 font-extrabold">Giao điểm và các điểm đặc biệt:</strong>
                <ul className="list-disc list-inside font-normal text-slate-400 mt-1 pl-4 space-y-1">
                  <li>Xác định giao điểm với các trục tọa độ Ox, Oy.</li>
                  <li>Xác định tâm đối xứng (giao hai đường tiệm cận hoặc điểm uốn) và trục đối xứng (nếu có).</li>
                </ul>
              </li>
              <li>
                <strong className="text-emerald-300 font-extrabold">Vẽ đồ thị:</strong>
                <p className="font-normal text-slate-400 mt-1 pl-4">
                  Vẽ đồ thị trên hệ trục tọa độ nền trắng với các đường tiệm cận nét đứt và các nhánh cong tách biệt qua điểm gián đoạn.
                </p>
              </li>
            </ol>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5">
            <h5 className="font-extrabold text-emerald-400">Các dạng hàm trọng tâm THPT:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-200">
                <strong className="text-emerald-300 font-bold">1. Hàm bậc ba:</strong> <MathView math="y = ax^3 + bx^2 + cx + d" className="text-white" />
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-200">
                <strong className="text-emerald-300 font-bold">2. Hàm bậc bốn trùng phương:</strong> <MathView math="y = ax^4 + bx^2 + c" className="text-white" />
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-200">
                <strong className="text-emerald-300 font-bold">3. Hàm nhất biến:</strong> <MathView math="y = \\frac{ax+b}{cx+d}" className="text-white" />
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-200">
                <strong className="text-emerald-300 font-bold">4. Hàm bậc 2 trên bậc 1:</strong> <MathView math="y = \\frac{ax^2+bx+c}{dx+e}" className="text-white" />
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-200">
                <strong className="text-emerald-300 font-bold">5. Hàm số mũ:</strong> <MathView math="y = A \\cdot a^{kx+h} + B" className="text-white" />
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-200">
                <strong className="text-emerald-300 font-bold">6. Hàm số lôgarit:</strong> <MathView math="y = A \\cdot \\log_a(kx+h) + B" className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
