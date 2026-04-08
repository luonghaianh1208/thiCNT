import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getAllCuocThiPublic,
  getDonViList,
  taoThiSinh,
  layCauHoiNgauNhien,
  nopBaiVaChamDiem,
  ghiCanhBaoGianLan,
  kiemTraLuotThi,
  kiemTraDaThiChu,
  deleteThiSinh,
  type CuocThi,
  type DonVi,
  type CauHoi,
} from '@/lib/db';
import { SearchableSelect } from '@/components/SearchableSelect';
import {
  Loader2, Send, Timer, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft,
  ShieldCheck, Award, Cpu, Activity, Zap, ShieldAlert, Clock, BookOpen, User,
  Info, MapPin, Eye, EyeOff, StopCircle, HelpCircle, BadgeCheck, ArrowRight, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = "https://doantruong.chuyennguyentrai.edu.vn/wp-content/uploads/2025/12/Huy_Hieu_Doan.png";

// ─── Types ────────────────────────────────────────────────────────────────────
type ExamStage = 'loading' | 'pending' | 'register' | 'exam' | 'result';

const STORAGE_KEY = 'thichuyendoiso_session';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

const formatCountdown = (ms: number) => {
  if (ms <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
  const totalSecs = Math.floor(ms / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return { days, hours, mins, secs };
};

// Fisher-Yates shuffle
const shuffleArray = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ─── Skeleton Component ───────────────────────────────────────────────────────
function ExamSkeleton() {
  return (
    <div className="min-h-screen bg-brand-dark py-20 px-6 flex items-center justify-center circuit-pattern">
      <div className="card-tech w-full max-w-2xl bg-white p-12 border-brand-blue/20">
        <div className="text-center mb-12">
          <div className="h-24 w-24 mx-auto mb-8 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-10 w-64 mx-auto mb-4 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-4 w-48 mx-auto rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="space-y-6 mb-12">
          <div className="grid grid-cols-2 gap-8">
            <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
        <div className="h-20 mt-12 rounded-2xl bg-brand-blue/20 animate-pulse" />
      </div>
    </div>
  );
}

// ─── Pending Page (Before Exam Time) ─────────────────────────────────────────
function PendingPage({ cuocThi, onStart }: { cuocThi: CuocThi; onStart: () => void }) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const startTime = new Date(cuocThi.bat_dau).getTime();

  useEffect(() => {
    const update = () => {
      const diff = startTime - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }
      setCountdown(formatCountdown(diff));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <div className="min-h-screen bg-brand-dark py-20 px-6 circuit-pattern">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="card-tech bg-white p-10 md:p-14 text-center mb-8 border-brand-blue/20">
          <img src={LOGO_URL} alt="Logo" className="h-20 mx-auto mb-6 drop-shadow-xl" />
          <div className="inline-flex items-center gap-2 bg-brand-blue/10 px-4 py-2 rounded-full mb-6">
            <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
            <span className="text-brand-blue font-black text-xs uppercase tracking-widest">Sắp diễn ra</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-ui font-black text-brand-blue uppercase tracking-tighter mb-4">
            {cuocThi.ten}
          </h1>
          <p className="text-slate-500 font-ui text-lg">Hãy sẵn sàng để bước vào thử thách!</p>
        </div>

        {/* Countdown */}
        <div className="card-tech bg-brand-blue text-white p-10 mb-8 border-brand-blue/40">
          <h3 className="text-center font-ui font-black text-sm uppercase tracking-widest mb-8 opacity-60">
            Thời gian đến khi bắt đầu
          </h3>
          <div className="grid grid-cols-4 gap-4 md:gap-8">
            {[
              { val: countdown.days, label: 'Ngày' },
              { val: countdown.hours, label: 'Giờ' },
              { val: countdown.mins, label: 'Phút' },
              { val: countdown.secs, label: 'Giây' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-6xl font-tech font-black mb-2">
                  {String(item.val).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-50">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Exam Info */}
        <div className="card-tech bg-white p-10 mb-8">
          <h3 className="font-ui font-black text-brand-blue uppercase tracking-widest text-sm mb-8 flex items-center gap-2">
            <BookOpen size={18} /> Thông tin bài thi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-brand-blue/10 rounded-xl">
                  <Timer size={20} className="text-brand-blue" />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Thời gian làm bài</span>
              </div>
              <p className="text-3xl font-ui font-black text-brand-blue">{cuocThi.thoi_gian_lam_phut} <span className="text-base font-normal text-slate-500">phút</span></p>
            </div>
            <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-brand-blue/10 rounded-xl">
                  <HelpCircle size={20} className="text-brand-blue" />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Số câu hỏi</span>
              </div>
              <p className="text-3xl font-ui font-black text-brand-blue">{cuocThi.so_cau_hoi} <span className="text-base font-normal text-slate-500">câu</span></p>
            </div>
            <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-brand-blue/10 rounded-xl">
                  <BadgeCheck size={20} className="text-brand-blue" />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Điểm đạt được</span>
              </div>
              <p className="text-3xl font-ui font-black text-brand-blue">{cuocThi.so_cau_hoi} <span className="text-base font-normal text-slate-500">điểm</span></p>
            </div>
          </div>
          <div className="mt-6 bg-brand-yellow/10 p-6 rounded-2xl border border-brand-yellow/20">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-brand-yellow" />
              <span className="font-ui font-bold text-brand-blue">Mở cửa: {formatDateTime(cuocThi.bat_dau)}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="card-tech bg-white p-10 mb-8">
          <h3 className="font-ui font-black text-brand-blue uppercase tracking-widest text-sm mb-8 flex items-center gap-2">
            <Info size={18} /> Hướng dẫn thi
          </h3>
          <div className="space-y-6">
            {[
              { icon: <User size={18} />, title: 'Đăng ký thông tin', desc: 'Nhập đầy đủ họ tên, số điện thoại và chọn đơn vị của bạn trước khi bắt đầu.' },
              { icon: <Timer size={18} />, title: 'Thời gian làm bài', desc: `Bạn có ${cuocThi.thoi_gian_lam_phut} phút để hoàn thành ${cuocThi.so_cau_hoi} câu hỏi.` },
              { icon: <Eye size={18} />, title: 'Cấm thoát màn hình', desc: 'Hệ thống giám sát sẽ phát hiện nếu bạn chuyển tab hoặc thu nhỏ trình duyệt. Vi phạm sẽ được ghi nhận.' },
              { icon: <MapPin size={18} />, title: 'Điều hướng nhanh', desc: 'Sử dụng bảng câu hỏi bên cạnh để nhảy nhanh giữa các câu hoặc xem câu nào đã làm.' },
              { icon: <StopCircle size={18} />, title: 'Nộp bài', desc: 'Bạn có thể nộp bài trước khi hết giờ. Hệ thống sẽ cảnh báo nếu có câu chưa trả lời.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="p-3 bg-brand-blue/5 rounded-xl text-brand-blue flex-shrink-0">{item.icon}</div>
                <div>
                  <h4 className="font-ui font-bold text-brand-blue mb-1">{item.title}</h4>
                  <p className="text-slate-500 text-sm font-ui">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anti-cheat Warning */}
        <div className="card-tech bg-brand-red/5 p-10 mb-8 border-brand-red/20">
          <h3 className="font-ui font-black text-brand-red uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
            <ShieldAlert size={18} /> Lưu ý quan trọng
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-brand-red flex-shrink-0 mt-1" />
              <p className="text-slate-600 font-ui text-sm">Không được chuyển tab hoặc thu nhỏ cửa sổ trình duyệt trong quá trình thi.</p>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-brand-red flex-shrink-0 mt-1" />
              <p className="text-slate-600 font-ui text-sm">Không được mở các ứng dụng khác trong khi đang thi.</p>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-brand-red flex-shrink-0 mt-1" />
              <p className="text-slate-600 font-ui text-sm">Mỗi hành vi vi phạm sẽ được ghi nhận vào hồ sơ dự thi.</p>
            </div>
          </div>
        </div>

        {/* Start Button - Disabled */}
        <button
          disabled
          className="w-full h-20 rounded-2xl bg-slate-200 text-slate-400 font-ui font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 cursor-not-allowed"
        >
          <Clock size={24} />
          Chưa đến giờ thi — Vui lòng chờ đến {formatDateTime(cuocThi.bat_dau)}
        </button>
      </div>
    </div>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────
function RegisterPage({
  cuocThi,
  donVis,
  onStart,
  loading
}: {
  cuocThi: CuocThi;
  donVis: DonVi[];
  onStart: (hoTen: string, sdt: string, donViId: string) => void;
  loading: boolean;
}) {
  const [hoTen, setHoTen] = useState('');
  const [sdt, setSdt] = useState('');
  const [donViId, setDonViId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!hoTen.trim() || !sdt || !donViId) {
      toast.error('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (!/^\d{10}$/.test(sdt)) {
      toast.error('Số điện thoại phải có đúng 10 chữ số.');
      return;
    }
    setSubmitting(true);
    try {
      // Kiểm tra đã thi cuộc thi nào chưa
      const daThiChu = await kiemTraDaThiChu(sdt.trim());
      if (daThiChu) {
        toast.error(`Số điện thoại này đã hoàn thành cuộc thi "${daThiChu}". Mỗi thí sinh chỉ thi một lần.`);
        setSubmitting(false);
        return;
      }
      // Kiểm tra còn lượt thi không
      const luotStatus = await kiemTraLuotThi(sdt.trim(), cuocThi.id);
      if (luotStatus === 'het_luot') {
        toast.error('Bạn đã hết lượt thi cho cuộc thi này.');
        setSubmitting(false);
        return;
      }
      onStart(hoTen.trim(), sdt, donViId);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi kiểm tra dữ liệu. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark py-20 px-6 circuit-pattern">
      <div className="max-w-2xl mx-auto">
        <div className="card-tech bg-white p-10 md:p-14 border-brand-blue/20">
          {/* Header */}
          <div className="text-center mb-10">
            <img src={LOGO_URL} alt="Logo" className="h-20 mx-auto mb-6 drop-shadow-xl" />
            <div className="inline-flex items-center gap-2 bg-brand-yellow/20 px-4 py-2 rounded-full mb-4">
              <div className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse" />
              <span className="text-brand-blue font-black text-xs uppercase tracking-widest">Đang mở</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-ui font-black text-brand-blue uppercase tracking-tighter mb-2">
              {cuocThi.ten}
            </h1>
            <p className="text-slate-500 font-ui">Điền thông tin để bắt đầu bài thi</p>
          </div>

          {/* Exam Summary */}
          <div className="grid grid-cols-2 gap-4 mb-10 p-6 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
            <div className="flex items-center gap-3">
              <Timer size={20} className="text-brand-blue" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Thời gian</p>
                <p className="font-bold text-brand-blue font-ui">{cuocThi.thoi_gian_lam_phut} phút</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HelpCircle size={20} className="text-brand-blue" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Câu hỏi</p>
                <p className="font-bold text-brand-blue font-ui">{cuocThi.so_cau_hoi} câu</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest font-ui block">Họ và tên thí sinh</label>
              <input
                type="text"
                placeholder="NHẬP HỌ TÊN ĐẦY ĐỦ..."
                value={hoTen}
                onChange={e => setHoTen(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-base font-bold focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none font-ui"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest font-ui block">Số điện thoại</label>
              <input
                type="text"
                placeholder="0XXXXXXXXX..."
                value={sdt}
                onChange={e => setSdt(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-base font-bold focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none font-ui"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest font-ui block">Đơn vị</label>
              <SearchableSelect
                value={donViId}
                onChange={setDonViId}
                options={donVis.map(dv => ({ value: dv.id.toString(), label: dv.ten }))}
                placeholder="CHỌN ĐƠN VỊ..."
                className="w-full"
              />
            </div>
          </div>

          {/* Warning */}
          <div className="mt-6 p-4 bg-brand-yellow/10 rounded-xl border border-brand-yellow/20 flex items-start gap-3">
            <ShieldCheck size={18} className="text-brand-yellow flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 font-ui leading-relaxed">
              Khi bấm "BẮT ĐẦU", bạn cam kết tuân thủ các quy tắc thi và không chuyển tab, thoát ứng dụng trong suốt quá trình làm bài.
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || submitting}
            className="w-full mt-8 h-20 rounded-2xl bg-brand-blue text-white font-ui font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-blue/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-brand-blue/20"
          >
            {loading || submitting ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <Zap size={24} className="fill-current" />
                BẮT ĐẦU LÀM BÀI
                <ArrowRight size={24} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Submit Confirmation Modal ────────────────────────────────────────────────
function SubmitConfirmModal({
  totalQuestions,
  answeredCount,
  onConfirm,
  onCancel,
  submitting
}: {
  totalQuestions: number;
  answeredCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const unanswered = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card-tech bg-white max-w-lg w-full p-10 text-center animate-in zoom-in duration-300">
        {unanswered > 0 ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-yellow/10 flex items-center justify-center">
              <AlertTriangle size={40} className="text-brand-yellow" />
            </div>
            <h2 className="text-2xl font-ui font-black text-brand-blue mb-4">CẢNH BÁO</h2>
            <p className="text-slate-500 font-ui mb-2">
              Bạn còn <strong className="text-brand-red">{unanswered} câu chưa trả lời</strong> trong bài thi.
            </p>
            <p className="text-slate-400 text-sm font-ui mb-8">
              Bạn có chắc chắn muốn nộp bài không?
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-blue/10 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-brand-blue" />
            </div>
            <h2 className="text-2xl font-ui font-black text-brand-blue mb-4">XÁC NHẬN NỘP BÀI</h2>
            <p className="text-slate-500 font-ui mb-8">
              Bạn đã trả lời đủ {totalQuestions} câu. Xác nhận nộp bài?
            </p>
          </>
        )}

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 h-14 rounded-2xl bg-slate-100 text-slate-600 font-ui font-bold hover:bg-slate-200 transition-all"
          >
            Quay lại làm bài
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 h-14 rounded-2xl bg-brand-red text-white font-ui font-bold hover:bg-brand-red/90 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Đang chấm điểm...
              </>
            ) : (
              'Nộp bài'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Exam Page ────────────────────────────────────────────────────────────────
function ExamPage({
  questions,
  answers,
  setAnswers,
  timeLeft,
  currentQuestionIdx,
  setCurrentQuestionIdx,
  optionOrders,
  formHoTen,
  cuocThi,
  onSubmit,
  submitting,
  showSubmitConfirm,
  setShowSubmitConfirm,
  onAnswer,
  onPrev,
  onNext,
}: {
  questions: CauHoi[];
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  timeLeft: number;
  currentQuestionIdx: number;
  setCurrentQuestionIdx: React.Dispatch<React.SetStateAction<number>>;
  optionOrders: Record<number, string[]>;
  formHoTen: string;
  cuocThi: CuocThi;
  onSubmit: () => void;
  submitting: boolean;
  showSubmitConfirm: boolean;
  setShowSubmitConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  onAnswer: (cauHoiId: number, option: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const q = questions[currentQuestionIdx];

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-ui relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-blue text-white p-4 shadow-xl border-b-2 border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-14">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl hidden sm:block">
              <img src={LOGO_URL} alt="Logo" className="h-8 w-auto" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-ui font-black tracking-tight truncate max-w-[120px] sm:max-w-xs">
                {cuocThi.ten.toUpperCase()}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest truncate max-w-[100px] sm:max-w-[150px]">
                  {formHoTen}
                </p>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-tech font-black text-lg sm:text-2xl transition-colors min-w-[120px] sm:min-w-[160px] justify-center
            ${timeLeft < 60 ? 'bg-brand-red shadow-[0_0_20px_#CF2A2A] animate-pulse' : 'bg-white/10'}`}>
            <Timer className={timeLeft < 60 ? 'animate-bounce' : ''} size={timeLeft < 60 ? 20 : 24} />
            <span className="tracking-[0.1em]">{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="h-10 px-4 sm:px-6 rounded-xl bg-brand-red text-white font-ui font-bold text-xs sm:text-sm hover:bg-brand-red/90 transition-all flex items-center gap-2"
          >
            <Send size={16} />
            <span className="hidden sm:inline">NỘP BÀI</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 circuit-pattern">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Question */}
          <div className="flex-1 space-y-6">
            <div className="card-tech bg-white p-6 md:p-12 border-2 border-brand-blue/5 min-h-[350px] flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="px-4 py-2 bg-brand-blue text-white text-xs font-ui font-black rounded-xl">
                  CÂU {currentQuestionIdx + 1} / {questions.length}
                </div>
                <div className="h-0.5 flex-1 bg-slate-100" />
                {answers[q.id] && (
                  <div className="flex items-center gap-1 text-emerald-500 text-xs font-black">
                    <CheckCircle2 size={14} /> Đã trả lời
                  </div>
                )}
              </div>

              <p className="text-lg sm:text-2xl font-bold text-slate-800 leading-snug mb-10 flex-1">
                {q.noi_dung}
              </p>

              <div className="grid grid-cols-1 gap-4">
                {(optionOrders[q.id] || ['a', 'b', 'c', 'd']).map((key, displayIdx) => {
                  const displayLabel = ['A', 'B', 'C', 'D'][displayIdx];
                  const optionText = q[`dap_an_${key}` as keyof CauHoi] as string;
                  if (!optionText) return null;
                  const isSelected = answers[q.id] === key; // track by original key

                  return (
                    <button
                      key={key}
                      onClick={() => onAnswer(q.id, key)} // store original key (lowercase)
                      className={`group relative p-4 sm:p-6 rounded-2xl border-2 transition-all duration-300 text-left flex items-center gap-4 sm:gap-5
                        ${isSelected
                          ? 'bg-brand-blue border-brand-blue text-white shadow-xl -translate-x-1'
                          : 'bg-white border-slate-100 hover:border-brand-blue/30 hover:bg-slate-50'}`}
                    >
                      <span className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm sm:text-lg transition-colors
                        ${isSelected ? 'bg-white text-brand-blue' : 'bg-slate-100 text-slate-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue'}`}>
                        {displayLabel}  {/* Luôn hiển thị A, B, C, D theo vị trí */}
                      </span>
                      <span className="flex-1 font-bold text-sm sm:text-base pt-0.5">{optionText}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={onPrev}
                className="flex-1 h-14 rounded-2xl bg-white border-2 border-slate-200 text-slate-500 font-ui font-bold hover:border-brand-blue hover:text-brand-blue disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} /> Câu trước
              </button>
              {currentQuestionIdx === questions.length - 1 ? (
                <button
                  onClick={onSubmit}
                  className="flex-1 h-14 rounded-2xl bg-brand-red text-white font-ui font-bold hover:bg-brand-red/90 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={20} /> Nộp bài
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="flex-1 h-14 rounded-2xl bg-brand-blue text-white font-ui font-bold hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-2"
                >
                  Câu tiếp <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 xl:w-96 space-y-6">
            {/* Question Navigator */}
            <div className="card-tech bg-white p-6 border-brand-blue/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-ui font-black text-brand-blue uppercase tracking-widest text-xs flex items-center gap-2">
                  <Cpu size={16} /> Câu hỏi
                </h3>
                <div className="px-3 py-1 bg-brand-blue/5 rounded-lg text-[10px] font-black text-brand-blue">
                  {answeredCount}/{questions.length}
                </div>
              </div>

              <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[35vh] sm:max-h-[40vh] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = currentQuestionIdx === idx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`h-10 w-full rounded-xl flex items-center justify-center font-black text-xs transition-all relative
                        ${isCurrent
                          ? 'ring-2 ring-brand-blue ring-offset-2 bg-brand-blue text-white'
                          : isAnswered
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-400 hover:bg-brand-blue/10 hover:text-brand-blue'}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400">
                  <div className="w-4 h-4 rounded bg-emerald-500"></div> Đã trả lời
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-slate-400">
                  <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200"></div> Chưa trả lời
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="card-tech bg-brand-blue text-white p-6">
              <h3 className="font-ui font-black uppercase tracking-widest text-xs opacity-60 mb-4 flex items-center gap-2">
                <Activity size={14} /> Tiến độ
              </h3>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-brand-yellow transition-all duration-500 rounded-full"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>
              <p className="text-center font-bold text-sm">
                {answeredCount} / {questions.length} câu đã trả lời
              </p>
            </div>

            {/* Security Status */}
            <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
              <div className="flex items-center gap-2 font-ui font-black uppercase tracking-widest text-xs text-brand-blue mb-3">
                <ShieldCheck size={14} /> Trạng thái bảo mật
              </div>
              <p className="text-xs text-slate-500 font-ui leading-relaxed">
                Hệ thống đang giám sát phiên thi. Vui lòng không thoát trình duyệt.
              </p>
              <div className="flex items-center gap-2 mt-3 text-brand-yellow text-[10px] font-black uppercase tracking-widest font-ui">
                <Activity size={12} className="animate-pulse" /> Đang theo dõi
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Submit Confirm Modal */}
      {showSubmitConfirm && (
        <SubmitConfirmModal
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          onConfirm={onSubmit}
          onCancel={() => setShowSubmitConfirm(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}

// ─── Main TrangThi Component ─────────────────────────────────────────────────
export default function TrangThi() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stage, setStage] = useState<ExamStage>('loading');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Chống race condition
  const isMountedRef = React.useRef(true); // Ngăn toast/state update sau unmount
  const [donVis, setDonVis] = useState<DonVi[]>([]);
  const [cuocThi, setCuocThi] = useState<CuocThi | null>(null);

  // Exam state
  const [questions, setQuestions] = useState<CauHoi[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStartTime, setExamStartTime] = useState<number | null>(null);
  const [thiSinhId, setThiSinhId] = useState<number | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [optionOrders, setOptionOrders] = useState<Record<number, string[]>>({});
  const [formHoTen, setFormHoTen] = useState('');
  const [formDonViId, setFormDonViId] = useState<number | null>(null);

  // Anti-cheat
  const [cheatCount, setCheatCount] = useState(0);
  const [showCheatOverlay, setShowCheatOverlay] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Results
  const [finalResult, setFinalResult] = useState<{ diem: number; so_cau_dung: number; thoi_gian_giay: number; tong_cau: number; luot_thi: number } | null>(null);
  const [formSdt, setFormSdt] = useState('');

  // ─── Initial Load ────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [allCuocs, dvData] = await Promise.all([getAllCuocThiPublic(), getDonViList()]);
        setDonVis(dvData);

        const now = Date.now();

        // Check existing session first
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const state = JSON.parse(saved);
          const sessionCuoc = allCuocs.find(c => c.id === state.changId);
          if (sessionCuoc) {
            const elapsed = Math.floor((Date.now() - state.examStartTime) / 1000);
            const remaining = Math.max(0, (sessionCuoc.thoi_gian_lam_phut * 60) - elapsed);

            setCuocThi(sessionCuoc);
            setQuestions(state.questions);
            setAnswers(state.answers || {});
            setThiSinhId(state.thiSinhId);
            setExamStartTime(state.examStartTime);
            setOptionOrders(state.optionOrders || {});
            setTimeLeft(remaining);
            setCheatCount(state.cheatCount || 0);
            setFormHoTen(state.formHoTen || '');

            if (remaining <= 0) {
              setStage('loading');
              setTimeout(() => handleSubmit(state), 100);
            } else {
              setStage('exam');
            }
            return;
          }
        }

        // No session - find exam
        // 1. If changId in URL, use that specific cuocThi
        const urlChangId = searchParams.get('changId');
        if (urlChangId) {
          const urlChang = allCuocs.find(c => c.id === parseInt(urlChangId));
          if (urlChang) {
            const start = new Date(urlChang.bat_dau).getTime();
            const end = new Date(urlChang.ket_thuc).getTime();
            if (now >= start && now <= end) {
              setCuocThi(urlChang);
              setStage('register');
            } else if (now < start) {
              setCuocThi(urlChang);
              setStage('pending');
            } else {
              setCuocThi(urlChang);
              setStage('loading');
            }
            return;
          }
        }

        // 2. Find currently open exam (in time window)
        const openCuoc = allCuocs.find(c => {
          const start = new Date(c.bat_dau).getTime();
          const end = new Date(c.ket_thuc).getTime();
          return now >= start && now <= end;
        });

        // 2. Find next upcoming exam
        const upcomingCuoc = allCuocs
          .filter(c => new Date(c.bat_dau).getTime() > now)
          .sort((a, b) => new Date(a.bat_dau).getTime() - new Date(b.bat_dau).getTime())[0];

        if (openCuoc) {
          setCuocThi(openCuoc);
          setStage('register');
        } else if (upcomingCuoc) {
          setCuocThi(upcomingCuoc);
          setStage('pending');
        } else {
          setCuocThi(null);
          setStage('loading'); // No exam available
        }
      } catch (err) {
        console.error(err);
        toast.error('Không thể kết nối hệ thống.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Cleanup: ngăn toast/state update sau unmount
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // ─── Anti-cheat ──────────────────────────────────────────────────────────────
  const lastViolationRef = React.useRef(0); // Cooldown để tránh đếm 2 lần khi quay về tab

  useEffect(() => {
    if (stage !== 'exam' || !thiSinhId || !cuocThi) return;

    const limit = cuocThi.gioi_han_gian_lan ?? 3;

    const handleViolation = async () => {
      const now = Date.now();
      if (now - lastViolationRef.current < 1000) return; // Cooldown 1 giây
      lastViolationRef.current = now;

      const next = cheatCount + 1;
      ghiCanhBaoGianLan(thiSinhId, cuocThi.id).catch(console.error);

      if (next >= limit) {
        // Đạt giới hạn → auto submit
        setCheatCount(next);
        setShowCheatOverlay(false);
        setTimeout(() => handleSubmit(submitStateRef.current), 100);
      } else {
        setCheatCount(next);
        setShowCheatOverlay(true);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) handleViolation();
    };
    const handleBlur = () => handleViolation();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [stage, thiSinhId, cuocThi, cheatCount]);

  // ─── Timer ───────────────────────────────────────────────────────────────────
  // Dùng ref để giữ giá trị mới nhất tránh stale closure khi auto-submit
  const submitStateRef = React.useRef({ questions, answers, thiSinhId, cuocThi });
  const isSubmittingRef = React.useRef(false);
  useEffect(() => {
    submitStateRef.current = { questions, answers, thiSinhId, cuocThi };
    isSubmittingRef.current = isSubmitting;
  });

  useEffect(() => {
    if (stage !== 'exam') return;  // Chỉ depend vào stage, không phải timeLeft

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          // Chỉ submit nếu chưa đang submit (tránh race condition)
          if (!isSubmittingRef.current) {
            setTimeout(() => handleSubmit(submitStateRef.current), 100);
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);  // ← Chỉ stage: interval tạo 1 lần, không unmount mỗi giây

  // ─── Session Persistence ────────────────────────────────────────────────────
  useEffect(() => {
    if (stage === 'exam' && cuocThi && examStartTime) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        changId: cuocThi.id,
        questions,
        answers,
        thiSinhId,
        examStartTime,
        totalDuration: cuocThi.thoi_gian_lam_phut * 60,
        optionOrders,
        formHoTen,
        cheatCount
      }));
    }
  }, [questions, answers, cheatCount, stage, cuocThi, examStartTime, optionOrders, formHoTen]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleStart = async (hoTen: string, sdt: string, donViId: string) => {
    if (!cuocThi) return;
    setLoading(true);
    let tsId: number | null = null;
    try {
      tsId = await taoThiSinh({
        ho_ten: hoTen,
        so_dien_thoai: sdt,
        don_vi_id: parseInt(donViId),
        ten_lop: ''
      });
      const qs = await layCauHoiNgauNhien(cuocThi.id, cuocThi.so_cau_hoi);
      if (qs.length === 0) throw new Error('Không có câu hỏi');
      const startTime = Date.now();
      const totalDuration = cuocThi.thoi_gian_lam_phut * 60;

      // Shuffle options per question
      const orders: Record<number, string[]> = {};
      for (const q of qs) orders[q.id] = shuffleArray(['a', 'b', 'c', 'd']);

      setThiSinhId(tsId);
      setQuestions(qs);
      setAnswers({});
      setOptionOrders(orders);
      setExamStartTime(startTime);
      setTimeLeft(totalDuration);
      setFormHoTen(hoTen);
      setFormDonViId(parseInt(donViId));
      setFormSdt(sdt);
      setCurrentQuestionIdx(0);
      setStage('exam');

    } catch (err) {
      console.error(err);
      if (!isMountedRef.current) return;
      // Rollback: xóa thi_sinh đã tạo nếu bước tiếp theo fail
      if (tsId) {
        try { await deleteThiSinh(tsId); } catch { /* ignore rollback error */ }
      }
      toast.error('Lỗi khởi tạo bài thi. Vui lòng thử lại.');
    } finally {
      if (!isMountedRef.current) return;
      setLoading(false);
    }
  };

  const handleSubmit = async (stateOverride?: any) => {
    if (isSubmitting) return; // Chống race condition
    if (stage === 'result') return; // Đã nộp rồi
    const state = stateOverride || { questions, answers, thiSinhId, cuocThi };
    if (!state.thiSinhId || !state.cuocThi) return;
    setIsSubmitting(true);
    setSubmitting(true);
    setShowSubmitConfirm(false);
    try {
      const thoi_gian_lam = (state.cuocThi.thoi_gian_lam_phut * 60) - timeLeft;

      // Server-side scoring — client không biết đáp án đúng
      const result = await nopBaiVaChamDiem({
        thi_sinh_id: state.thiSinhId,
        cuoc_thi_id: state.cuocThi.id,
        thoi_gian_lam,
        answers: state.questions.map((q: CauHoi) => ({
          cau_hoi_id: q.id,
          lua_chon: state.answers[q.id] || '',
        })),
      });

      if (!isMountedRef.current) return;

      // Clear exam state completely
      setQuestions([]);
      setAnswers({});
      setThiSinhId(null);
      setCheatCount(0);
      setShowCheatOverlay(false);
      sessionStorage.removeItem(STORAGE_KEY);

      setFinalResult({ diem: result.diem, so_cau_dung: result.so_cau_dung, thoi_gian_giay: thoi_gian_lam, tong_cau: state.questions.length, luot_thi: result.luot_thi });
      setStage('result');
      toast.success('Nộp bài thành công!');
    } catch (err) {
      console.error(err);
      if (!isMountedRef.current) return;
      toast.error('Lỗi khi nộp bài.');
    } finally {
      if (!isMountedRef.current) return;
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  const handleAnswer = (cauHoiId: number, option: string) => {
    setAnswers(prev => ({ ...prev, [cauHoiId]: option }));
  };

  const handlePrev = () => setCurrentQuestionIdx(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1));

  // ─── Render ──────────────────────────────────────────────────────────────────
  // Loading
  if (stage === 'loading' || (loading && stage !== 'exam')) {
    if (!cuocThi) {
      return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 circuit-pattern">
          <div className="card-tech max-w-lg text-center bg-white p-12">
            <AlertTriangle className="w-20 h-20 text-brand-red mx-auto mb-8" />
            <h2 className="text-3xl font-ui font-black text-brand-blue mb-4 uppercase">HỆ THỐNG ĐÓNG</h2>
            <p className="text-slate-500 font-bold mb-10 font-ui">Hiện tại không có chặng thi nào đang mở.</p>
            <button onClick={() => navigate('/')} className="btn-cyber w-full py-5">QUAY LẠI TRANG CHỦ</button>
          </div>
        </div>
      );
    }
    return <ExamSkeleton />;
  }

  // Pending (before exam time)
  if (stage === 'pending' && cuocThi) {
    return <PendingPage cuocThi={cuocThi} onStart={() => {}} />;
  }

  // Register (during exam time, need to sign up)
  if (stage === 'register' && cuocThi) {
    return (
      <RegisterPage
        cuocThi={cuocThi}
        donVis={donVis}
        onStart={handleStart}
        loading={loading}
      />
    );
  }

  // Exam
  if (stage === 'exam' && cuocThi) {
    return (
      <>
        {/* Anti-cheat overlay */}
        {showCheatOverlay && (
          <div className="fixed inset-0 z-[100] bg-brand-dark/95 backdrop-blur-md flex items-center justify-center p-6">
            <div className="card-tech bg-white max-w-lg p-12 text-center animate-in zoom-in duration-300 border-brand-red">
              <div className="w-24 h-24 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <ShieldAlert size={48} />
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-brand-red mb-4 tracking-tighter font-ui uppercase">CẢNH BÁO</h1>
              <p className="text-slate-600 font-bold text-lg mb-4">
                Hệ thống phát hiện bạn vừa rời khỏi màn hình thi!
              </p>
              <div className="bg-brand-red/5 p-6 rounded-2xl mb-10">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Số lần vi phạm</p>
                <p className="text-5xl font-ui font-black text-brand-red">{cheatCount}</p>
              </div>
              <button
                onClick={() => setShowCheatOverlay(false)}
                className="btn-cyber w-full h-16 bg-brand-blue text-white"
              >
                {cheatCount >= (cuocThi.gioi_han_gian_lan ?? 3) - 1
                  ? 'LƯU Ý: Lần cuối cùng!'
                  : 'TÔI ĐÃ HIỂU VÀ CAM KẾT KHÔNG TÁI PHẠM'}
              </button>
            </div>
          </div>
        )}

        <ExamPage
          questions={questions}
          answers={answers}
          setAnswers={setAnswers}
          timeLeft={timeLeft}
          currentQuestionIdx={currentQuestionIdx}
          setCurrentQuestionIdx={setCurrentQuestionIdx}
          optionOrders={optionOrders}
          formHoTen={formHoTen}
          cuocThi={cuocThi}
          onSubmit={() => handleSubmit({ questions, answers, thiSinhId, cuocThi })}
          submitting={submitting}
          showSubmitConfirm={showSubmitConfirm}
          setShowSubmitConfirm={setShowSubmitConfirm}
          onAnswer={handleAnswer}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      </>
    );
  }

  // Result
  if (stage === 'result' && finalResult) {
    const donViName = donVis.find(d => d.id === formDonViId)?.ten || '';
    const isCuocThiActive = cuocThi ? new Date() < new Date(cuocThi.ket_thuc) : false;
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 relative overflow-hidden circuit-pattern">
        <div className="absolute inset-0 bg-brand-blue/5 bg-scanlines opacity-20" />

        <div className="card-tech w-full max-w-2xl bg-white p-12 md:p-20 text-center relative z-10 border-brand-yellow/30">
          <div className="mb-12 relative inline-flex items-center justify-center">
            <Award className="w-32 h-32 text-brand-yellow drop-shadow-[0_0_20px_rgba(250,189,50,0.5)]" />
            <div className="absolute inset-0 bg-brand-yellow/20 rounded-full blur-3xl scale-125 animate-pulse-soft" />
          </div>

          <h2 className="text-3xl md:text-5xl font-ui font-black text-brand-blue mb-4 uppercase">BÁO CÁO KẾT QUẢ</h2>
          <p className="text-slate-500 font-ui font-bold text-sm md:text-base mb-16">
            Chúc mừng đồng chí <span className="text-brand-blue font-black">{formHoTen}</span>{donViName ? ` - ${donViName}` : ''} đã hoàn thành lượt thi thứ {finalResult.luot_thi} của cuộc thi {cuocThi?.ten}!
          </p>

          <div className="mb-16">
            <div className="bg-brand-blue/5 p-10 rounded-[2.5rem] border-2 border-brand-blue/10 group transition-all hover:bg-brand-blue hover:text-white text-center">
              <p className="text-[10px] font-ui font-black uppercase tracking-[0.3em] mb-4 opacity-50 group-hover:text-white">ĐIỂM SỐ</p>
              <div className="text-6xl font-tech font-black text-brand-blue group-hover:text-brand-yellow">{finalResult.diem}/{finalResult.tong_cau}</div>
            </div>
          </div>

          <div className="bg-brand-beige/20 p-8 rounded-3xl mb-16 flex items-center justify-between font-bold text-slate-600 font-ui">
            <div className="flex gap-4 items-center">
              <Clock className="text-brand-blue" />
              <span>Thời gian hoàn thành:</span>
            </div>
            <span className="text-xl text-brand-blue font-ui font-black">
              {Math.floor(finalResult.thoi_gian_giay / 60)} phút {finalResult.thoi_gian_giay % 60} giây
            </span>
          </div>

          <div className="space-y-4">
            {isCuocThiActive && (
              <button
                onClick={async () => {
                  if (!cuocThi) return;
                  try {
                    const status = await kiemTraLuotThi(formSdt, cuocThi.id);
                    if (status === 'con_luot') {
                      handleStart(formHoTen, formSdt, String(formDonViId));
                    } else {
                      toast.error('Bạn đã hết lượt thi.');
                    }
                  } catch {
                    toast.error('Không thể bắt đầu lượt thi mới.');
                  }
                }}
                className="w-full bg-brand-blue text-white font-bold text-base py-4 rounded-xl hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-2 group font-ui"
              >
                <RotateCcw size={18} />
                Thi lại lượt mới
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="w-full btn-cyber h-20 text-lg shadow-2xl"
            >
              QUAY LẠI TRANG CHỦ
            </button>
          </div>

          {cheatCount > 0 && (
            <div className="mt-10 flex items-center justify-center gap-3 p-4 bg-brand-red/5 text-brand-red rounded-2xl border border-brand-red/10 animate-in fade-in duration-1000">
              <ShieldAlert size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] font-ui">
                Cảnh báo: Đã ghi nhận {cheatCount} lần vi phạm gian lận.
              </span>
            </div>
          )}
        </div>

        <div className="mt-12 flex items-center gap-6 text-white/20 font-ui font-bold text-[10px] uppercase tracking-[0.4em]">
          <span className="flex items-center gap-2"><Info size={14} /> Dữ liệu đã được mã hóa</span>
          <div className="w-1 h-1 bg-white/20 rounded-full" />
          <span>Thành Đoàn Hải Phòng</span>
        </div>
      </div>
    );
  }

  return null;
}
