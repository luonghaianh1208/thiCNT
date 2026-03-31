import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllChangThiPublic, type ChangThi } from '@/lib/db';
import { Calendar, Clock, Award, Users, ChevronRight, BookOpen, Trophy, Star, ShieldCheck, Zap, Globe, Menu, X } from 'lucide-react';

const LOGO_URL = "https://doantruong.chuyennguyentrai.edu.vn/wp-content/uploads/2025/12/Huy_Hieu_Doan.png";

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

function isActive(ct: ChangThi) {
  const now = new Date();
  return now >= new Date(ct.bat_dau) && now <= new Date(ct.ket_thuc);
}

function isUpcoming(ct: ChangThi) {
  return new Date() < new Date(ct.bat_dau);
}

export default function TrangChu() {
  const navigate = useNavigate();
  const [changs, setChangs] = useState<ChangThi[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    getAllChangThiPublic()
      .then(setChangs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hasActiveChang = changs.some(isActive);

  return (
    <div className="min-h-screen bg-brand-beige/10 selection:bg-brand-yellow selection:text-brand-blue overflow-x-hidden">
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Logo" className="h-12 w-auto" />
              <div className="border-l border-slate-200 pl-3">
                <p className="text-[10px] sm:text-xs font-black text-brand-blue uppercase tracking-widest leading-tight">Đoàn TNCS Hồ Chí Minh</p>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Thành Đoàn Hải Phòng</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#gioi-thieu" className="nav-link">Giới thiệu</a>
              <a href="#lich-thi" className="nav-link">Lịch thi</a>
              <a href="#giai-thuong" className="nav-link">Giải thưởng</a>
              <button
                onClick={() => navigate('/admin/login')}
                className="bg-brand-blue/5 text-brand-blue font-black text-[10px] px-4 py-2 rounded-xl hover:bg-brand-blue hover:text-white transition-all uppercase tracking-widest"
              >
                ADMIN
              </button>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-brand-blue p-2">
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 animate-in slide-in-from-top duration-300">
            <a href="#gioi-thieu" className="block nav-link py-2" onClick={() => setMobileMenuOpen(false)}>Giới thiệu</a>
            <a href="#lich-thi" className="block nav-link py-2" onClick={() => setMobileMenuOpen(false)}>Lịch thi</a>
            <a href="#giai-thuong" className="block nav-link py-2" onClick={() => setMobileMenuOpen(false)}>Giải thưởng</a>
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/admin/login'); }}
              className="w-full bg-brand-blue text-white font-black text-xs py-4 rounded-2xl uppercase tracking-widest"
            >
              Đăng nhập Admin
            </button>
          </div>
        )}
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-hero-gradient pt-20 pb-32 md:pt-32 md:pb-48">
        {/* Abstract shapes for premium feel */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
          <div className="absolute -top-24 -left-24 w-[40rem] h-[40rem] bg-brand-yellow rounded-full blur-[120px]"></div>
          <div className="absolute top-1/2 right-0 w-[30rem] h-[30rem] bg-brand-red rounded-full blur-[100px] -translate-y-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full mb-10">
            <Zap className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Kỷ nguyên 4.0 - Hải Phòng vươn tầm</span>
          </div>

          <h1 className="hero-title mb-10">
            Thanh niên Hải Phòng <br className="hidden md:block" />
            <span className="hero-subtitle text-brand-yellow">
              Chuyển đổi số, Chuyển đổi xanh
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-white/90 mb-14 max-w-3xl mx-auto font-bold leading-relaxed px-4">
            Xung kích, sáng tạo trong kỷ nguyên số <br className="sm:hidden" /> 
            Hành động vì Hải Phòng xanh, bền vững.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 px-6">
            {hasActiveChang ? (
              <button
                onClick={() => navigate('/thi')}
                className="w-full sm:w-auto btn-primary text-xl px-16 py-6 shadow-2xl group"
              >
                Tham gia thi ngay
                <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
              </button>
            ) : (
              <div className="w-full sm:w-auto bg-white px-10 py-5 rounded-2xl text-brand-blue font-black text-lg flex items-center justify-center gap-3 shadow-xl">
                <Clock className="w-6 h-6 text-brand-blue" />
                Vòng Sơ khảo: 28/3 – 12/4/2026
              </div>
            )}
            <a href="#gioi-thieu" className="w-full sm:w-auto px-10 py-5 text-white font-black hover:text-brand-yellow transition-colors border-2 border-white/20 rounded-2xl text-center uppercase tracking-widest text-sm">
              Tìm hiểu thêm
            </a>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 md:mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto border-t border-white/10 pt-12 px-4">
            {[
              { icon: <Users />, val: "100+", label: "Đoàn trực thuộc" },
              { icon: <ShieldCheck />, val: "30", label: "Câu hỏi/Chặng" },
              { icon: <Globe />, val: "24/7", label: "Nền tảng trực tuyến" },
              { icon: <Award />, val: "🥇 🥈 🥉", label: "Cơ cấu giải thưởng" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-brand-yellow mb-2 flex justify-center scale-110">{s.icon}</div>
                <div className="text-2xl md:text-3xl font-black text-white mb-1">{s.val}</div>
                <div className="text-[9px] md:text-[10px] text-white/50 font-black uppercase tracking-[0.2em]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Về Cuộc Thi ─── */}
      <section id="gioi-thieu" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 lg:items-center">
            <div className="flex-1 space-y-8">
              <div className="w-16 h-2 bg-brand-red rounded-full"></div>
              <h2 className="text-4xl md:text-6xl font-black text-brand-blue tracking-tighter leading-tight uppercase">Tầm nhìn <br />& Mục tiêu</h2>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-bold">
                "Hải Phòng vươn lên tầm cao mới bằng sức mạnh công nghệ và tinh thần xanh. Thanh niên chính là hạt nhân dẫn dắt sự thay đổi này."
              </p>
              <div className="space-y-6 pt-4">
                {[
                  "Nâng cao nhận thức về chuyển đổi số và chuyển đổi xanh.",
                  "Tìm kiếm giải pháp sáng tạo, khởi nghiệp ứng dụng công nghệ 4.0.",
                  "Kết nối thanh niên toàn thành phố hành động vì tương lai.",
                ].map((text, i) => (
                  <div key={i} className="flex gap-4 items-start group">
                    <div className="mt-1 flex-shrink-0 w-8 h-8 bg-brand-blue/5 text-brand-blue rounded-xl flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-all">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <span className="text-slate-800 font-black text-base md:text-lg">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10 lg:pt-0">
              <div className="card-premium">
                <Users className="w-12 h-12 text-brand-blue mb-6" />
                <h3 className="font-black text-xl text-brand-blue mb-4 uppercase tracking-tight">Đối tượng dự thi</h3>
                <p className="text-slate-500 font-bold text-sm leading-relaxed">Đoàn viên, thanh niên, sinh viên đang học tập và làm việc tại Hải Phòng.</p>
              </div>
              <div className="card-premium sm:mt-12">
                <Trophy className="w-12 h-12 text-brand-red mb-6" />
                <h3 className="font-black text-xl text-brand-blue mb-4 uppercase tracking-tight">Phần thưởng</h3>
                <p className="text-slate-500 font-bold text-sm leading-relaxed">Bộ giải thưởng giá trị cùng giấy khen chính thức từ Thành đoàn.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Lịch Thi ─── */}
      <section id="lich-thi" className="py-24 bg-brand-blue relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter">Lịch trình thi đấu</h2>
            <div className="w-24 h-1.5 bg-brand-yellow mx-auto mb-6 rounded-full"></div>
            <p className="text-white/70 font-bold text-base md:text-lg max-w-2xl mx-auto">Chinh phục 3 chặng thi cam go để bước tới ngôi vị quán quân</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {changs.map((ct, idx) => {
                const active = isActive(ct);
                const upcoming = isUpcoming(ct);
                const colorClass = active ? 'border-brand-yellow bg-white' : 'border-white/10 bg-brand-blue/40';
                return (
                  <div key={ct.id} className={`p-10 rounded-[2.5rem] border-2 transition-all ${colorClass}`}>
                    <div className="flex justify-between items-center mb-8">
                      <span className={`text-4xl font-black ${active ? 'text-brand-blue' : 'text-white/20'}`}>0{idx + 1}</span>
                      {active && <span className="bg-brand-red text-white text-[10px] font-black px-4 py-1.5 rounded-full animate-pulse uppercase tracking-[0.2em]">LIVE NOW</span>}
                    </div>
                    <h3 className={`text-2xl font-black mb-6 uppercase tracking-tight text-left ${active ? 'text-brand-blue' : 'text-white'}`}>{ct.ten}</h3>
                    <div className={`space-y-4 text-left mb-10 font-bold text-sm ${active ? 'text-slate-600' : 'text-white/50'}`}>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-brand-yellow" />
                        <span>{formatDateTime(ct.bat_dau)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-brand-yellow" />
                        <span>{ct.thoi_gian_phut} phút làm bài</span>
                      </div>
                    </div>
                    {active && (
                      <button onClick={() => navigate('/thi')} className="w-full btn-accent py-5">
                        Thi ngay <ChevronRight />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-white border-t border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-12 lg:items-start text-center lg:text-left">
            <div className="flex flex-col items-center lg:items-start gap-6">
              <img src={LOGO_URL} alt="Logo" className="h-20 w-auto" />
              <div>
                <p className="text-xl font-black text-brand-blue uppercase tracking-tight">Thành Đoàn Hải Phòng</p>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Đoàn TNCS Hồ Chí Minh TP. Hải Phòng</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-brand-blue text-lg font-black italic">"Thanh niên Hải Phòng: Xung kích - Sáng tạo - Chuyên nghiệp"</p>
              <div className="text-xs font-bold text-slate-400 space-y-2 uppercase tracking-wide">
                <p>Lô 26A Lê Hồng Phong, Gia Viên, Ngô Quyền, Hải Phòng</p>
                <p>Hotline: 0921.545.555</p>
              </div>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-slate-50 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">© 2026 Thành Đoàn Hải Phòng. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
