import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getDonViList, kiemTraDaThi, taoThiSinh, layCauHoiNgauNhien, nopBaiThi, getChangDangMo, ghiCanhBaoGianLan,
  type DonVi, type ChangThi, type CauHoi, type AnswerRecord 
} from '@/lib/db';
import { 
  Loader2, CheckCircle2, AlertCircle, Clock, Send, ChevronRight, 
  User, Phone, Building2, BookOpen, ShieldAlert, Zap
} from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/d/d7/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png";

type Stage = 'register' | 'exam' | 'result';

export default function TrangThi() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('register');
  const [chang, setChang] = useState<ChangThi | null>(null);
  const [donViList, setDonViList] = useState<DonVi[]>([]);
  
  // Registration
  const [hoTen, setHoTen] = useState('');
  const [sdt, setSdt] = useState('');
  const [donViId, setDonViId] = useState('');
  const [donViNho, setDonViNho] = useState('');
  const [loading, setLoading] = useState(false);

  // Exam
  const [questions, setQuestions] = useState<CauHoi[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [thiSinhId, setThiSinhId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showCheatOverlay, setShowCheatOverlay] = useState(false);
  const [cheatCount, setCheatCount] = useState(0);
  const isSubmitting = useRef(false);

  // Result
  const [result, setResult] = useState<{ score: number, correct: number, total: number } | null>(null);

  // ─── Initial Setup ───
  useEffect(() => {
    getChangDangMo().then(setChang).catch(console.error);
    getDonViList().then(setDonViList).catch(console.error);

    // Persistence Check
    const saved = sessionStorage.getItem('thi_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        // Only restore if it's the same contest
        getChangDangMo().then(currentChang => {
          if (currentChang && state.changId === currentChang.id) {
            setChang(currentChang);
            setQuestions(state.questions);
            setAnswers(state.answers || {});
            setThiSinhId(state.thiSinhId);
            setStartTime(state.startTime);
            const elapsed = Math.floor((Date.now() - state.resumeAt) / 1000);
            const remaining = state.timeLeft - elapsed;
            if (remaining > 0) {
              setTimeLeft(remaining);
              setStage('exam');
            } else {
              sessionStorage.removeItem('thi_state');
            }
          }
        });
      } catch (e) {
        console.error('Error restoring state', e);
      }
    }
  }, []);

  // ─── Persistence Logic ───
  useEffect(() => {
    if (stage === 'exam' && chang && thiSinhId && startTime) {
      const state = {
        questions, answers, timeLeft, thiSinhId, startTime,
        changId: chang.id,
        resumeAt: Date.now()
      };
      sessionStorage.setItem('thi_state', JSON.stringify(state));
    }
  }, [answers, timeLeft, stage, questions, chang, thiSinhId, startTime]);

  // ─── Timer & Auto-submit ───
  useEffect(() => {
    if (stage !== 'exam' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmitting.current) submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  // ─── Cheat Detection ───
  useEffect(() => {
    if (stage !== 'exam') return;
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        if (thiSinhId && chang) {
          try {
            const count = await ghiCanhBaoGianLan(thiSinhId, chang.id);
            setCheatCount(count);
            setShowCheatOverlay(true);
          } catch (e) { console.error(e); }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stage, thiSinhId, chang]);

  // ─── Actions ───
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chang) return;
    if (!hoTen.trim() || !sdt.trim() || !donViId) {
      toast.error('Vui lòng điền đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const daThi = await kiemTraDaThi(sdt, chang.id);
      if (daThi) {
        toast.error('Số điện thoại này đã tham gia thi chặng này rồi.');
        setLoading(false);
        return;
      }

      const id = await taoThiSinh({
        ho_ten: hoTen.trim(),
        so_dien_thoai: sdt.trim(),
        don_vi_id: parseInt(donViId),
        ten_don_vi_nho: donViNho.trim()
      });

      const qs = await layCauHoiNgauNhien(chang.id, chang.so_cau);
      if (qs.length === 0) {
        toast.error('Chưa có câu hỏi cho chặng này.');
        setLoading(false);
        return;
      }

      setThiSinhId(id);
      setQuestions(qs);
      setTimeLeft(chang.thoi_gian_phut * 60);
      setStartTime(Date.now());
      setStage('exam');
      toast.success('Bắt đầu làm bài. Chúc bạn thi tốt!');
    } catch (err) {
      console.error(err);
      toast.error('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const submitExam = async (isAuto = false) => {
    if (isSubmitting.current) return;
    if (!isAuto && !window.confirm('Bạn chắc chắn muốn nộp bài?')) return;

    isSubmitting.current = true;
    setLoading(true);
    try {
      let correct = 0;
      const results: AnswerRecord[] = questions.map(q => {
        const luaChon = answers[q.id] || '';
        const isCorrect = luaChon === q.dap_an_dung;
        if (isCorrect) correct++;
        return { cau_hoi_id: q.id, lua_chon: luaChon, dung: isCorrect };
      });

      const diem = Math.round((correct / questions.length) * 100);
      const thoiGianLam = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

      await nopBaiThi({
        thi_sinh_id: thiSinhId!,
        chang_id: chang!.id,
        diem,
        so_cau_dung: correct,
        tong_cau: questions.length,
        thoi_gian_lam,
        answers: results
      });

      setResult({ score: diem, correct, total: questions.length });
      setStage('result');
      sessionStorage.removeItem('thi_state');
      toast.success('Nộp bài thành công!');
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi nộp bài. Vui lòng liên hệ BTC.');
      isSubmitting.current = false;
    } finally {
      setLoading(false);
    }
  };

  // ─── Render Helpers ───
  if (!chang && stage === 'register') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <Loader2 className="w-12 h-12 text-brand-blue animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-slate-700">Đang tải chặng thi...</h2>
          <p className="text-sm text-slate-500">Hệ thống đang kiểm tra các chặng thi đang mở.</p>
          <button onClick={() => navigate('/')} className="text-brand-blue font-semibold underline">Quay về trang chủ</button>
        </div>
      </div>
    );
  }

  // ─── STAGE: REGISTER ───
  if (stage === 'register') {
    return (
      <div className="min-h-screen bg-hero-pattern py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <img src={LOGO_URL} alt="Logo" className="h-24 mx-auto animate-float" />
            <h1 className="text-4xl font-black text-white leading-tight uppercase tracking-tight">Đăng ký tham tài dự thi</h1>
            <div className="inline-block bg-brand-yellow text-brand-blue px-4 py-1 rounded-full font-bold text-sm">
              {chang?.ten}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/20">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                    <User className="w-3 h-3" /> Họ và tên (đúng CCCD)
                  </label>
                  <input
                    type="text" required value={hoTen} onChange={e => setHoTen(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-brand-blue transition-all font-medium"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                    <Phone className="w-3 h-3" /> Số điện thoại
                  </label>
                  <input
                    type="tel" required value={sdt} onChange={e => setSdt(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-brand-blue transition-all font-medium"
                    placeholder="09xx xxx xxx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                  <Building2 className="w-3 h-3" /> Đơn vị trực thuộc
                </label>
                <select
                  required value={donViId} onChange={e => setDonViId(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-brand-blue transition-all font-medium"
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {donViList.map(dv => <option key={dv.id} value={dv.id}>{dv.ten}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                  <Zap className="w-3 h-3" /> Đơn vị nhỏ (Tổ/Lớp/Chi đoàn)
                </label>
                <input
                  type="text" value={donViNho} onChange={e => setDonViNho(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-brand-blue transition-all font-medium"
                  placeholder="Ví dụ: Chi đoàn Lớp 12A1 / Phòng Kế hoạch"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit" disabled={loading}
                  className="w-full btn-primary text-xl py-5 group"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      Xác nhận đăng ký
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
            
            <p className="mt-8 text-center text-xs text-slate-400 font-medium leading-relaxed">
              * Lưu ý: Mỗi thí sinh chỉ được sử dụng một số điện thoại duy nhất để tham gia mỗi chặng thi.
              Hệ thống sẽ tự động ghi lại log gian lận nếu bạn thoát màn hình.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── STAGE: EXAM ───
  if (stage === 'exam') {
    const total = questions.length;
    const answered = Object.keys(answers).length;
    const progress = (answered / total) * 100;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Exam Header */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3 sm:px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <img src={LOGO_URL} alt="Logo" className="h-10 hidden sm:block" />
             <div>
               <h1 className="text-sm font-black text-brand-blue leading-tight uppercase line-clamp-1">{chang?.ten}</h1>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{hoTen}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex flex-col items-end ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
               <div className="flex items-center gap-2">
                 <Clock className="w-4 h-4" />
                 <span className="text-xl font-black font-mono">
                   {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                 </span>
               </div>
            </div>
            <button
              onClick={() => submitExam()} disabled={loading}
              className="bg-brand-blue text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors flex items-center gap-2"
            >
              Nộp bài
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="fixed top-[64px] left-0 right-0 z-40 h-1 bg-slate-100">
          <div 
            className="h-full bg-brand-yellow transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 mt-20 p-4 sm:p-8 max-w-5xl mx-auto w-full">
          <div className="space-y-12 pb-32">
            {questions.map((q, idx) => (
              <div 
                key={q.id} 
                id={`q-${q.id}`} 
                className={`bg-white rounded-3xl p-6 sm:p-10 shadow-xl border-2 transition-all duration-300 ${
                  answers[q.id] ? 'border-green-100' : 'border-transparent'
                }`}
              >
                <div className="flex gap-4 mb-8">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                    answers[q.id] ? 'bg-green-500 text-white' : 'bg-brand-blue text-white'
                  }`}>
                    {idx + 1}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 leading-relaxed pt-1">
                    {q.noi_dung}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-0 sm:ml-14">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const key = `dap_an_${opt.toLowerCase()}` as keyof CauHoi;
                    const isSelected = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        className={`text-left p-4 rounded-2xl border-2 font-medium transition-all group flex gap-3 ${
                          isSelected 
                            ? 'bg-blue-50 border-brand-blue text-brand-blue' 
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                          isSelected ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-200 text-slate-400 group-hover:border-slate-300'
                        }`}>
                          {opt}
                        </div>
                        <span className="flex-1 text-sm sm:text-base">{q[key] as string}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Cheat Overlay */}
        {showCheatOverlay && (
          <div className="fixed inset-0 z-[100] bg-red-950/95 backdrop-blur-xl flex items-center justify-center p-6 text-white">
            <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-300">
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <ShieldAlert className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Cảnh báo gian lận!</h2>
              <p className="text-red-200 text-lg">
                Hệ thống phát hiện bạn vừa rời khỏi màn hình thi. Hành động này đã được ghi lại trong hệ thống quản trị.
              </p>
              <div className="bg-red-900/50 p-6 rounded-3xl border border-red-800/50">
                <div className="text-4xl font-black text-brand-yellow mb-1">{cheatCount}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-red-300">Số lần vi phạm</div>
              </div>
              <button
                onClick={() => setShowCheatOverlay(false)}
                className="w-full bg-white text-red-950 font-bold py-5 rounded-2xl text-xl hover:bg-slate-100 transition-colors"
              >
                Tôi đã hiểu và cam kết không tái phạm
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── STAGE: RESULT ───
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-[3rem] p-10 sm:p-14 shadow-2xl border border-slate-100 text-center relative overflow-hidden">
        {/* Confetti-like Orbs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-50">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-yellow-100 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
            <h1 className="text-4xl font-black text-brand-blue uppercase">Kết quả bài thi</h1>
            <p className="text-slate-500 font-medium">Bạn đã hoàn thành tốt phần thi của mình!</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100">
               <div className="text-5xl font-black text-brand-blue mb-2">{result?.score}</div>
               <div className="text-xs font-bold uppercase tracking-widest text-blue-500">Điểm số</div>
            </div>
            <div className="bg-green-50 p-8 rounded-[2rem] border border-green-100">
               <div className="text-5xl font-black text-green-600 mb-2">{result?.correct}/{result?.total}</div>
               <div className="text-xs font-bold uppercase tracking-widest text-green-500">Câu đúng</div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/')}
              className="w-full btn-primary text-lg py-5"
            >
              Về trang chủ
            </button>
            <p className="text-xs text-slate-400 font-medium">
              Cảm ơn bạn đã tham gia cuộc thi. Chúc bạn đạt kết quả cao nhất!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
