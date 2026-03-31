import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getChangDangMo, 
  getDonViList, 
  taoThiSinh, 
  layCauHoiNgauNhien, 
  nopBaiThi, 
  ghiCanhBaoGianLan,
  type ChangThi, 
  type DonVi, 
  type CauHoi,
  type AnswerRecord
} from '@/lib/db';
import { 
  Loader2, 
  Send, 
  Timer, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  BookOpen,
  User,
  ShieldCheck,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = "https://doantruong.chuyennguyentrai.edu.vn/wp-content/uploads/2025/12/Huy_Hieu_Doan.png";

type Stage = 'register' | 'exam' | 'result';

export default function TrangThi() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('register');
  const [chang, setChang] = useState<ChangThi | null>(null);
  const [donVis, setDonVis] = useState<DonVi[]>([]);
  const [loading, setLoading] = useState(true);

  // Form đăng ký
  const [form, setForm] = useState({ ho_ten: '', so_dien_thoai: '', don_vi_id: 0, ten_don_vi_nho: '' });
  
  // Trạng thái thi
  const [questions, setQuestions] = useState<CauHoi[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thiSinhId, setThiSinhId] = useState<number | null>(null);
  const [cheatingCount, setCheatingCount] = useState(0);
  const [showCheatingOverlay, setShowCheatingOverlay] = useState(false);
  const isSubmittingRef = useRef(false);

  // Kết quả
  const [result, setResult] = useState<{ score: number; total: number; correct: number } | null>(null);

  useEffect(() => {
    Promise.all([getChangDangMo(), getDonViList()])
      .then(([activeChang, dvActive]) => {
        setChang(activeChang);
        setDonVis(dvActive);
        
        // Khôi phục trạng thái thi nếu có trong sessionStorage
        if (activeChang) {
          const saved = sessionStorage.getItem('thi_state');
          if (saved) {
            const state = JSON.parse(saved);
            if (state.changId === activeChang.id) {
              setQuestions(state.questions);
              setAnswers(state.answers);
              setTimeLeft(state.timeLeft);
              setThiSinhId(state.thiSinhId);
              setCheatingCount(state.cheatingCount || 0);
              setStage('exam');
            }
          }
        }
      })
      .catch(err => { toast.error('Lỗi tải dữ liệu. Vui lòng thử lại.'); console.error(err); })
      .finally(() => setLoading(false));
  }, []);

  // Timer & Auto-save
  useEffect(() => {
    if (stage !== 'exam' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          if (!isSubmittingRef.current) setTimeout(submitExam, 500); 
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  // Luôn lưu trạng thái vào sessionStorage để chống F5
  useEffect(() => {
    if (stage === 'exam' && chang && thiSinhId) {
      sessionStorage.setItem('thi_state', JSON.stringify({
        changId: chang.id,
        questions,
        answers,
        timeLeft,
        thiSinhId,
        cheatingCount
      }));
    }
  }, [stage, answers, timeLeft, cheatingCount]);

  // Chống gian lận: Theo dõi thoát màn hình
  useEffect(() => {
    if (stage !== 'exam' || !thiSinhId || !chang) return;

    const handleVisibility = async () => {
      if (document.hidden) {
        try {
          const count = await ghiCanhBaoGianLan(thiSinhId, chang.id);
          setCheatingCount(count);
          setShowCheatingOverlay(true);
        } catch (e) { console.error('Lỗi ghi log gian lận', e); }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [stage, thiSinhId, chang]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ho_ten || !form.so_dien_thoai || !form.don_vi_id) {
      toast.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    if (!chang) return;

    setLoading(true);
    try {
      const tsId = await taoThiSinh(form);
      const ques = await layCauHoiNgauNhien(chang.id, chang.so_cau);
      if (ques.length === 0) {
        toast.error('Chặng thi hiện chưa có câu hỏi. Vui lòng quay lại sau.');
        setLoading(false);
        return;
      }
      setThiSinhId(tsId);
      setQuestions(ques);
      setTimeLeft(chang.thoi_gian_phut * 60);
      setStage('exam');
      toast.success('Bắt đầu làm bài. Chúc bạn thi tốt!');
    } catch (err) {
      toast.error('Lỗi đăng ký thi. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitExam = async () => {
    if (isSubmittingRef.current || !chang || !thiSinhId) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    let correctCount = 0;
    const formattedAnswers: AnswerRecord[] = questions.map(q => {
      const isCorrect = answers[q.id] === q.dap_an_dung;
      if (isCorrect) correctCount++;
      return { cau_hoi_id: q.id, lua_chon: answers[q.id] || '', dung: isCorrect };
    });

    const score = Math.round((correctCount / questions.length) * 100);

    try {
      await nopBaiThi({
        thi_sinh_id: thiSinhId,
        chang_id: chang.id,
        diem: score,
        so_cau_dung: correctCount,
        tong_cau: questions.length,
        thoi_gian_lam: (chang.thoi_gian_phut * 60) - timeLeft,
        answers: formattedAnswers
      });
      setResult({ score, total: questions.length, correct: correctCount });
      setStage('result');
      sessionStorage.removeItem('thi_state');
      toast.success('Đã nộp bài thành công!');
    } catch (err) {
      toast.error('Lỗi khi nộp bài. Đang thử lại...');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (loading && stage === 'register') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-blue animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Đang chuẩn bị phòng thi...</p>
      </div>
    );
  }

  if (!chang && stage === 'register') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-20 h-20 text-brand-red mb-6" />
        <h1 className="text-3xl font-black text-brand-blue uppercase mb-4">Hiện không có chặng thi nào mở</h1>
        <p className="text-slate-500 font-bold mb-8">Vui lòng quay lại theo lịch trình của Ban Tổ chức.</p>
        <button onClick={() => navigate('/')} className="btn-primary">Quay về trang chủ</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Header ─── */}
      <header className="bg-white border-b border-slate-100 h-16 sm:h-20 flex items-center sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Logo" className="h-10 sm:h-12" />
            <div className="hidden sm:block border-l border-slate-200 pl-3">
              <p className="text-[10px] font-black text-brand-blue uppercase leading-tight">Cuộc thi trực tuyến 2026</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">Thành Đoàn Hải Phòng</p>
            </div>
          </div>
          
          {stage === 'exam' && (
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-6 py-2 rounded-2xl font-black text-lg transition-colors ${timeLeft < 60 ? 'bg-brand-red text-white animate-pulse' : 'bg-brand-blue/5 text-brand-blue'}`}>
                <Timer className="w-5 h-5" />
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <button 
                onClick={() => { if(window.confirm('Bạn có chắc chắn muốn nộp bài sớm?')) submitExam(); }}
                disabled={isSubmitting}
                className="hidden md:flex btn-accent !py-2 !px-6 !rounded-xl text-xs"
              >
                Nộp bài
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        {/* ─── Stage: Register ─── */}
        {stage === 'register' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-slate-100 animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-10">
              <div className="inline-flex p-3 bg-brand-blue/5 rounded-2xl text-brand-blue mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-brand-blue uppercase tracking-tight">{chang?.ten}</h2>
              <p className="text-slate-400 font-bold mt-2 text-sm uppercase tracking-widest">Vui lòng điền thông tin để bắt đầu</p>
            </div>
            
            <form onSubmit={handleStart} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      required
                      placeholder="NGUYỄN VĂN A"
                      className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-black focus:ring-2 focus:ring-brand-blue transition-all"
                      value={form.ho_ten}
                      onChange={e => setForm({ ...form, ho_ten: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Số điện thoại</label>
                  <input
                    type="tel"
                    required
                    placeholder="0912xxxxxx"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-brand-blue transition-all"
                    value={form.so_dien_thoai}
                    onChange={e => setForm({ ...form, so_dien_thoai: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Đơn vị (Quận/Huyện/Trực thuộc)</label>
                <select
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-brand-blue transition-all"
                  value={form.don_vi_id}
                  onChange={e => setForm({ ...form, don_vi_id: Number(e.target.value) })}
                >
                  <option value={0}>Chọn đơn vị...</option>
                  {donVis.map(dv => <option key={dv.id} value={dv.id}>{dv.ten}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Chi tiết đơn vị (Trường/Phường/Xã)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Trường THPT Chuyên Trần Phú"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-brand-blue transition-all"
                  value={form.ten_don_vi_nho}
                  onChange={e => setForm({ ...form, ten_don_vi_nho: e.target.value })}
                />
              </div>

              <div className="pt-6">
                <button type="submit" disabled={loading} className="w-full btn-primary py-5">
                  Bắt đầu cuộc thi <ChevronRight />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── Stage: Exam ─── */}
        {stage === 'exam' && (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Progress */}
            <div className="mb-8 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tiến độ làm bài</p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {questions.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full transition-all ${
                          i < currentIdx ? 'bg-brand-blue' : i === currentIdx ? 'bg-brand-yellow w-6' : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-black text-brand-blue">{currentIdx + 1}/{questions.length}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vi phạm thoát màn hình</span>
                <p className={`font-black ${cheatingCount > 0 ? 'text-brand-red' : 'text-slate-300'}`}>{cheatingCount} lần</p>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-slate-100 min-h-[400px] flex flex-col">
              <div className="flex-1">
                <p className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em] mb-4">Câu hỏi số {currentIdx + 1}</p>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-snug mb-10">
                  {questions[currentIdx].noi_dung}
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {['a', 'b', 'c', 'd'].map(opt => {
                    const key = `dap_an_${opt}` as keyof CauHoi;
                    const val = questions[currentIdx][key] as string;
                    const isSelected = answers[questions[currentIdx].id] === opt.toUpperCase();
                    return (
                      <button
                        key={opt}
                        onClick={() => setAnswers({ ...answers, [questions[currentIdx].id]: opt.toUpperCase() })}
                        className={`flex items-center gap-5 p-6 rounded-2xl text-left border-2 transition-all group ${
                          isSelected 
                            ? 'bg-brand-blue border-brand-blue text-white shadow-lg shadow-brand-blue/20' 
                            : 'bg-white border-slate-100 hover:border-brand-blue/30 text-slate-700'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black uppercase tracking-widest flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-brand-blue group-hover:text-white'
                        }`}>
                          {opt}
                        </div>
                        <span className="font-bold text-base md:text-lg">{val}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-50">
                <button
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-brand-blue disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft /> Câu trước
                </button>
                
                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                    className="btn-primary !px-8 !py-3 !text-xs"
                  >
                    Câu tiếp theo <ChevronRight />
                  </button>
                ) : (
                  <button
                    onClick={() => { if(window.confirm('Xác nhận nộp bài?')) submitExam(); }}
                    disabled={isSubmitting}
                    className="btn-accent !px-8 !py-3 !text-xs"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Nộp bài ngay'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Stage: Result ─── */}
        {stage === 'result' && result && (
          <div className="text-center animate-in fade-in zoom-in duration-700">
            <div className="bg-white rounded-[3rem] shadow-2xl p-12 mb-8 border border-slate-100 relative overflow-hidden">
              {/* Confetti-like background circle */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-yellow/10 rounded-full blur-3xl"></div>
              
              <div className="relative">
                <div className="mb-8 inline-flex p-5 bg-brand-yellow/10 text-brand-yellow rounded-full">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
                <h2 className="text-4xl font-black text-brand-blue uppercase tracking-tighter mb-2">Hoàn thành bài thi!</h2>
                <p className="text-slate-400 font-bold mb-12 uppercase tracking-widest text-sm">Kết quả của bạn đã được ghi nhận</p>

                <div className="grid grid-cols-2 gap-8 max-w-sm mx-auto mb-12">
                  <div className="bg-brand-blue/5 p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Số câu đúng</p>
                    <p className="text-3xl font-black text-brand-blue">{result.correct}/{result.total}</p>
                  </div>
                  <div className="bg-brand-yellow/5 p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Điểm số</p>
                    <p className="text-3xl font-black text-brand-yellow">{result.score}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-slate-600 font-bold max-w-xs mx-auto text-sm leading-relaxed">
                    Kết quả chính thức sẽ được công bố trên fanpage Thành đoàn sau khi kết thúc chặng.
                  </p>
                  <button onClick={() => navigate('/')} className="btn-primary !w-full sm:!w-auto px-12">
                     Quay về trang chủ
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Cảm ơn bạn đã tham gia cuộc thi!</p>
          </div>
        )}
      </main>

      {/* Cheating Overlay */}
      {showCheatingOverlay && (
        <div className="fixed inset-0 z-[100] bg-brand-blue/95 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-sm w-full text-center border-b-8 border-brand-red">
            <div className="w-20 h-20 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-brand-blue uppercase tracking-tight mb-4">Phát hiện gian lận!</h3>
            <p className="text-slate-600 font-bold text-sm leading-relaxed mb-8">
              Bạn vừa thoát khỏi màn hình thi. Hành động này đã được hệ thống ghi nhận (Vi phạm: <span className="text-brand-red">{cheatingCount}</span> lần).
              <br /><br />
              <span className="text-xs uppercase tracking-widest text-slate-400">Vui lòng không rời khỏi màn hình khi đang thi</span>
            </p>
            <button 
              onClick={() => setShowCheatingOverlay(false)}
              className="w-full bg-brand-blue text-white font-black py-4 rounded-2xl hover:bg-brand-dark transition-all uppercase tracking-widest text-xs"
            >
              Tôi đã hiểu & tiếp tục
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
