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
  Loader2, Send, Timer, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, BookOpen, User, ShieldCheck, Award, Cpu, Activity, Info, Zap, ShieldAlert, Clock
} from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = "https://doantruong.chuyennguyentrai.edu.vn/wp-content/uploads/2025/12/Huy_Hieu_Doan.png";

export default function TrangThi() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [donVis, setDonVis] = useState<DonVi[]>([]);
  const [chang, setChang] = useState<ChangThi | null>(null);
  
  const [stage, setStage] = useState<'info' | 'exam' | 'result'>('info');
  
  // Registration
  const [form, setForm] = useState({ hoTen: '', sdt: '', donViId: '' });
  
  // Exam State
  const [questions, setQuestions] = useState<CauHoi[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [thiSinhId, setThiSinhId] = useState<number | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Anti-cheat
  const [cheatCount, setCheatCount] = useState(0);
  const [showCheatOverlay, setShowCheatOverlay] = useState(false);
  
  // Results
  const [finalResult, setFinalResult] = useState<{ diem: number; so_cau_dung: number; thoi_gian_giay: number } | null>(null);

  // Persistence Key
  const STORAGE_KEY = 'thichuyendoiso_session';

  // 1. Initial Load & Restore Session
  useEffect(() => {
    const init = async () => {
      try {
        const [changData, dvData] = await Promise.all([getChangDangMo(), getDonViList()]);
        setChang(changData);
        setDonVis(dvData);

        // Check for existing session
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved && changData) {
          const state = JSON.parse(saved);
          if (state.changId === changData.id) {
            setQuestions(state.questions);
            setAnswers(state.answers || {});
            setThiSinhId(state.thiSinhId);
            setTimeLeft(state.timeLeft);
            setCheatCount(state.cheatCount || 0);
            setStage('exam');
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Không thể kết nối hệ thống. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2. Anti-cheat Logic
  useEffect(() => {
    if (stage !== 'exam' || !thiSinhId || !chang) return;

    const handleViolation = async () => {
      setCheatCount(prev => {
        const next = prev + 1;
        ghiCanhBaoGianLan(thiSinhId, chang.id).catch(console.error);
        setShowCheatOverlay(true);
        return next;
      });
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
  }, [stage, thiSinhId, chang]);

  // 3. Timer & Persistence
  useEffect(() => {
    if (stage !== 'exam' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        // Save state every 5 seconds or simplified
        if (next % 5 === 0) {
          saveSession(next);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  const saveSession = (currentRemaining: number) => {
    if (stage !== 'exam' || !chang) return;
    const state = {
      changId: chang.id,
      questions,
      answers,
      thiSinhId,
      timeLeft: currentRemaining,
      cheatCount
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // Sync answers to session immediately
  useEffect(() => {
    if (stage === 'exam') saveSession(timeLeft);
  }, [answers, cheatCount]);

  // 4. Handlers
  const handleStart = async () => {
    if (!form.hoTen || !form.sdt || !form.donViId || !chang) {
      toast.error('Vui lòng điền đầy đủ thông tin hành chính.');
      return;
    }
    setLoading(true);
    try {
      const tsId = await taoThiSinh({
        ho_ten: form.hoTen,
        so_dien_thoai: form.sdt,
        don_vi_id: parseInt(form.donViId),
        ten_don_vi_nho: '' 
      });
      const qs = await layCauHoiNgauNhien(chang.id, chang.so_cau);
      
      setThiSinhId(tsId);
      setQuestions(qs);
      setTimeLeft(chang.thoi_gian_phut * 60);
      setStage('exam');
      
      // Save initial session
      const initialState = {
        changId: chang.id,
        questions: qs,
        answers: {},
        thiSinhId: tsId,
        timeLeft: chang.thoi_gian_phut * 60,
        cheatCount: 0
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
      
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khởi tạo bài thi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (cauHoiId: number, option: string) => {
    setAnswers(prev => ({ ...prev, [cauHoiId]: option }));
  };

  const handleSubmit = async () => {
    if (submitting || !thiSinhId || !chang) return;
    setSubmitting(true);
    try {
      const thoi_gian_lam = (chang.thoi_gian_phut * 60) - timeLeft;
      
      // Calculate score locally for immediate display
      const correctAnswers = questions.filter(q => answers[q.id] === q.dap_an_dung).length;
      const diem = (correctAnswers / questions.length) * 100;

      await nopBaiThi({
        thi_sinh_id: thiSinhId,
        chang_id: chang.id,
        diem: Math.round(diem),
        so_cau_dung: correctAnswers,
        tong_cau: questions.length,
        thoi_gian_lam: thoi_gian_lam,
        answers: questions.map(q => ({
          cau_hoi_id: q.id,
          lua_chon: answers[q.id] || '',
          dung: answers[q.id] === q.dap_an_dung
        }))
      });

      setFinalResult({
        diem: Math.round(diem),
        so_cau_dung: correctAnswers,
        thoi_gian_giay: thoi_gian_lam
      });
      sessionStorage.removeItem(STORAGE_KEY);
      setStage('result');
      toast.success('Nộp bài thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi nộp bài. Đừng lo lắng, dữ liệu của bạn đã được lưu tạm thời.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && stage === 'info') {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 gap-6 circuit-pattern">
        <Loader2 className="w-16 h-16 text-brand-yellow animate-spin" />
        <p className="text-white/50 font-ui font-bold uppercase tracking-[0.2em] text-xs">Đang đồng bộ giao thức bảo mật...</p>
      </div>
    );
  }

  if (!chang && stage === 'info') {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 circuit-pattern">
        <div className="card-tech max-w-lg text-center bg-white p-12">
          <AlertTriangle className="w-20 h-20 text-brand-red mx-auto mb-8" />
          <h2 className="text-3xl font-ui font-black text-brand-blue mb-4 uppercase">HỆ THỐNG ĐANG ĐÓNG</h2>
          <p className="text-slate-500 font-bold mb-10 font-ui">Hiện tại không có chặng thi nào đang mở. Vui lòng quay lại sau theo lịch trình quy định.</p>
          <button onClick={() => navigate('/')} className="btn-cyber w-full py-5">QUAY LẠI TRẠM CHỈ HUY</button>
        </div>
      </div>
    );
  }

  // ─── STAGE: INFO (REGISTRATION) ───
  if (stage === 'info') {
    return (
      <div className="min-h-screen bg-brand-dark py-20 px-6 circuit-pattern flex items-center justify-center">
        <div className="card-tech w-full max-w-2xl bg-white p-12 border-brand-blue/20">
          <div className="text-center mb-12">
            <img src={LOGO_URL} alt="Logo" className="h-24 mx-auto mb-8 drop-shadow-xl" />
            <h1 className="text-4xl font-ui font-black text-brand-blue uppercase tracking-tighter mb-4">{chang?.ten}</h1>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] font-ui">Hệ thống xác thực thí sinh 4.0</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 bg-brand-blue/5 p-8 rounded-3xl border border-brand-blue/10">
            <div className="flex items-center gap-4">
              <Timer className="text-brand-blue w-8 h-8" />
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-ui">Thời gian</p>
                <p className="text-lg font-ui font-black text-brand-blue">{chang?.thoi_gian_phut} PHÚT</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <BookOpen className="text-brand-blue w-8 h-8" />
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-ui">Số lượng</p>
                <p className="text-lg font-ui font-black text-brand-blue">30 CÂU HỎI</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 px-2 font-ui">Họ và tên thí sinh</label>
              <input
                type="text"
                placeholder="NHẬP HỌ TÊN ĐẦY ĐỦ..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-6 text-lg font-bold focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none font-ui"
                value={form.hoTen}
                onChange={e => setForm({ ...form, hoTen: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 px-2 font-ui">Số điện thoại liên hệ</label>
              <input
                type="text"
                placeholder="NHẬP SỐ ĐIỆN THOẠI..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-6 text-lg font-bold focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none font-ui"
                value={form.sdt}
                onChange={e => setForm({ ...form, sdt: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 px-2 font-ui">Đơn vị trực thuộc</label>
              <select
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-6 text-lg font-bold focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none appearance-none font-ui"
                value={form.donViId}
                onChange={e => setForm({ ...form, donViId: e.target.value })}
              >
                <option value="">CHỌN ĐƠN VỊ CỦA BẠN...</option>
                {donVis.map(dv => (
                  <option key={dv.id} value={dv.id}>{dv.ten.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-12">
            <button 
              onClick={handleStart}
              className="w-full btn-cyber h-20 text-lg shadow-2xl shadow-brand-blue/20"
            >
              KHỞI TẠO BÀI THI_
              <Zap className="fill-current" />
            </button>
            <p className="text-center mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              Dữ liệu được bảo mật bởi hệ thống Thành đoàn
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── STAGE: EXAM ───
  if (stage === 'exam') {
    const q = questions[currentQuestionIdx];
    const formatSeconds = (s: number) => {
      const min = Math.floor(s / 60);
      const sec = s % 60;
      return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-ui relative overflow-hidden">
        {/* Anti-cheat Overlay */}
        {showCheatOverlay && (
          <div className="fixed inset-0 z-[100] bg-brand-dark/95 backdrop-blur-md flex items-center justify-center p-6">
            <div className="card-tech bg-white max-w-lg p-12 text-center animate-in zoom-in duration-300 border-brand-red">
              <div className="w-24 h-24 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <ShieldAlert size={48} />
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-brand-red mb-4 tracking-tighter font-ui uppercase">MISSION CONTROL</h1>
              <p className="text-slate-600 font-bold text-lg mb-4">
                Hệ thống phát hiện bạn vừa rời khỏi màn hình thi!
              </p>
              <div className="bg-brand-red/5 p-6 rounded-2xl mb-10">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Số lần vi phạm</p>
                <p className="text-5xl font-ui font-black text-brand-red">0{cheatCount}</p>
              </div>
              <button 
                onClick={() => setShowCheatOverlay(false)}
                className="btn-cyber w-full h-16 bg-brand-blue text-white"
              >
                TÔI ĐÃ HIỂU VÀ CAM KẾT KHÔNG TÁI PHẠM
              </button>
            </div>
          </div>
        )}

        {/* ─── Header Exam ─── */}
        <header className="sticky top-0 z-40 bg-brand-blue text-white p-4 shadow-xl border-b-2 border-white/10">
          <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md hidden sm:block">
                <img src={LOGO_URL} alt="Logo" className="h-10 w-auto" />
              </div>
              <div>
                <h2 className="text-xs sm:text-base font-tech font-black tracking-tight leading-none truncate max-w-[150px] sm:max-w-md">{chang?.ten.toUpperCase()}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest truncate max-w-[120px]">{form.hoTen}</p>
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-tech font-black text-2xl transition-colors min-w-[160px] justify-center
              ${timeLeft < 60 ? 'bg-brand-red shadow-[0_0_20px_#CF2A2A]' : 'bg-white/10'}`}>
              <Timer className={timeLeft < 60 ? 'animate-bounce' : ''} size={28} />
              <span className="tracking-[0.1em]">{formatSeconds(timeLeft)}</span>
            </div>

            <div className="hidden md:block">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1 text-right">Tiến độ hoàn thành</div>
              <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-brand-yellow transition-all duration-500 shadow-[0_0_10px_#FABD32]"
                  style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </header>

        {/* ─── Main Exam Area ─── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 circuit-pattern">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
            
            {/* Question Card */}
            <div className="flex-1 space-y-8">
              <div className="card-tech bg-white p-8 md:p-16 border-2 border-brand-blue/5 min-h-[400px] flex flex-col">
                <div className="flex items-center gap-4 mb-10">
                  <div className="px-5 py-2 bg-brand-blue text-white text-xs font-tech font-black rounded-xl">CÂU HỎI {currentQuestionIdx + 1}</div>
                  <div className="h-0.5 flex-1 bg-slate-100"></div>
                </div>
                
                <p className="text-xl md:text-3xl font-bold text-slate-800 leading-snug mb-12 selection:bg-brand-yellow">
                  {q?.noi_dung}
                </p>

                <div className="grid grid-cols-1 gap-5 mt-auto">
                  {['a', 'b', 'c', 'd'].map(key => {
                    const optionText = q?.[`dap_an_${key}` as keyof CauHoi];
                    if (!optionText) return null;
                    const isSelected = answers[q.id] === optionText;
                    return (
                      <button
                        key={key}
                        onClick={() => handleAnswer(q.id, optionText as string)}
                        className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left flex items-start gap-5
                          ${isSelected 
                            ? 'bg-brand-blue border-brand-blue text-white shadow-xl translate-x-2' 
                            : 'bg-white border-slate-100 hover:border-brand-blue/30 hover:bg-slate-50'}`}
                      >
                        <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-colors
                          ${isSelected ? 'bg-white text-brand-blue' : 'bg-slate-100 text-slate-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue'}`}>
                          {key.toUpperCase()}
                        </span>
                        <span className="flex-1 font-bold text-base md:text-lg pt-1">{optionText}</span>
                        {isSelected && <CheckCircle2 className="w-6 h-6 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-between items-center gap-6">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                  className="flex-1 h-16 btn-cyber bg-white/50 border-2 border-slate-200 text-slate-500 hover:text-brand-blue disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft /> QUAY LẠI
                </button>
                {currentQuestionIdx < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                    className="flex-1 h-16 btn-cyber group"
                  >
                    CÂU TIẾP THEO <ChevronRight className="group-hover:translate-x-2 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 h-16 btn-cyber bg-brand-red text-white hover:shadow-brand-red/30"
                  >
                    {submitting ? <Loader2 className="animate-spin" /> : (
                      <div className="flex items-center gap-3">KẾT THÚC BÀI THI <Send size={20} /></div>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-96 space-y-8">
              <div className="card-tech bg-white p-8 border-brand-blue/10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-tech font-black text-brand-blue uppercase tracking-widest text-sm flex items-center gap-2">
                    <Cpu size={18} /> THIẾT BỊ ĐIỀU KHIỂN
                  </h3>
                  <div className="px-3 py-1 bg-brand-blue/5 rounded-lg text-[10px] font-black text-brand-blue">
                    {Object.keys(answers).length}/{questions.length}
                  </div>
                </div>
                
                <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {questions.map((q, idx) => {
                    const isAnswered = !!answers[q.id];
                    const isCurrent = currentQuestionIdx === idx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIdx(idx)}
                        className={`h-12 w-full rounded-xl flex items-center justify-center font-black text-sm transition-all relative overflow-hidden group
                          ${isCurrent 
                            ? 'ring-2 ring-brand-blue ring-offset-2' 
                            : isAnswered 
                              ? 'bg-brand-blue text-white shadow-lg' 
                              : 'bg-slate-100 text-slate-400 hover:bg-brand-blue/10 hover:text-brand-blue'}`}
                      >
                        {idx + 1}
                        {isCurrent && <div className="absolute inset-0 bg-brand-blue/20 animate-pulse"></div>}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-10 border-t border-slate-100 pt-8 space-y-4">
                  <div className="flex items-center gap-3 text-xs font-black text-slate-400">
                    <div className="w-3 h-3 rounded bg-brand-blue"></div> Đã trả lời
                  </div>
                  <div className="flex items-center gap-3 text-xs font-black text-slate-400">
                    <div className="w-3 h-3 rounded bg-slate-100"></div> Chưa trả lời
                  </div>
                </div>
              </div>
              
              <div className="bg-brand-blue p-8 rounded-[2rem] text-white space-y-4 shadow-xl">
                <div className="flex items-center gap-3 font-tech font-black uppercase tracking-widest text-xs opacity-50">
                   <ShieldCheck size={16} /> TRẠNG THÁI BẢO MẬT
                </div>
                <p className="font-bold text-sm leading-relaxed">Hệ thống đang giám sát phiên thi. Vui lòng không thoát trình duyệt hoặc chuyển tab.</p>
                <div className="flex items-center gap-2 text-brand-yellow font-black text-xs uppercase tracking-widest">
                  <Activity size={14} className="animate-pulse" /> Đang truyền dữ liệu (Live)
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  // ─── STAGE: RESULT ───
  if (stage === 'result' && finalResult) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 relative overflow-hidden circuit-pattern">
        <div className="absolute inset-0 bg-brand-blue/5 bg-scanlines opacity-20"></div>

        <div className="card-tech w-full max-w-2xl bg-white p-12 md:p-20 text-center relative z-10 border-brand-yellow/30">
          <div className="mb-12 relative inline-flex items-center justify-center">
            <Award className="w-32 h-32 text-brand-yellow drop-shadow-[0_0_20px_rgba(250,189,50,0.5)]" />
            <div className="absolute inset-0 bg-brand-yellow/20 rounded-full blur-3xl scale-125 animate-pulse-soft"></div>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-tech font-black text-brand-blue mb-4 uppercase tracking-tighter">BÁO CÁO_KẾT QUẢ</h2>
          <p className="text-slate-400 font-black text-xs md:text-sm uppercase tracking-[0.4em] mb-16">CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH CHẶNG THI!</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-brand-blue/5 p-10 rounded-[2.5rem] border-2 border-brand-blue/10 group transition-all hover:bg-brand-blue hover:text-white">
              <p className="text-[10px] font-tech font-black uppercase tracking-[0.3em] mb-4 opacity-50 group-hover:text-white">ĐIỂM SỐ ĐẠT ĐƯỢC</p>
              <div className="text-6xl font-tech font-black text-brand-blue group-hover:text-brand-yellow">{finalResult.diem}</div>
            </div>
            <div className="bg-brand-blue/5 p-10 rounded-[2.5rem] border-2 border-brand-blue/10 group transition-all hover:bg-brand-blue hover:text-white">
              <p className="text-[10px] font-tech font-black uppercase tracking-[0.3em] mb-4 opacity-50 group-hover:text-white">CÂU TRẢ LỜI ĐÚNG</p>
              <div className="text-6xl font-tech font-black text-brand-blue group-hover:text-brand-yellow">{finalResult.so_cau_dung}/30</div>
            </div>
          </div>

          <div className="bg-brand-beige/20 p-8 rounded-3xl mb-16 flex items-center justify-between font-bold text-slate-600">
            <div className="flex gap-4 items-center">
              <Clock className="text-brand-blue" />
              <span>Thời gian hoàn thành:</span>
            </div>
            <span className="text-xl text-brand-blue">{Math.floor(finalResult.thoi_gian_giay / 60)} phút {finalResult.thoi_gian_giay % 60} giây</span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full btn-cyber h-20 text-lg shadow-2xl"
          >
            QUAY LẠI TRẠM CHỈ HUY
          </button>
          
          {cheatCount > 0 && (
            <div className="mt-10 flex items-center justify-center gap-3 p-4 bg-brand-red/5 text-brand-red rounded-2xl border border-brand-red/10 animate-in fade-in duration-1000">
              <ShieldAlert size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cảnh báo: Đã ghi nhận {cheatCount} lần vi phạm gian lận vào hồ sơ số.</span>
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="mt-12 flex items-center gap-6 text-white/20 font-tech font-black text-[10px] uppercase tracking-[0.4em]">
          <span className="flex items-center gap-2"><Info size={14} /> Dữ liệu đã được mã hóa</span>
          <div className="w-1 h-1 bg-white/20 rounded-full"></div>
          <span>Thành Đoàn Hải Phòng Digital ID</span>
        </div>
      </div>
    );
  }

  return null;
}
