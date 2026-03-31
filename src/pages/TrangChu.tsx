import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllChangThiPublic, type ChangThi } from '@/lib/db';
import { Calendar, Clock, Award, Users, ChevronRight, BookOpen, Trophy, Star, ShieldCheck, Zap, Globe, Menu, X, Cpu, MousePointer2 } from 'lucide-react';

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
    <div className="min-h-screen bg-brand-beige/5 selection:bg-brand-yellow selection:text-brand-blue overflow-x-hidden circuit-pattern">
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-brand-blue/10">
        <div className="section-container">
          <div className="flex justify-between h-24 items-center">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="relative">
                <img src={LOGO_URL} alt="Logo" className="h-16 w-auto drop-shadow-lg" />
                <div className="absolute -inset-1 bg-brand-blue/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="border-l-2 border-brand-blue/20 pl-4 whitespace-nowrap">
                <p className="text-[12px] sm:text-[14px] font-black text-brand-blue uppercase tracking-[0.1em] leading-tight font-ui">Đoàn TNCS Hồ Chí Minh</p>
                <p className="text-[11px] sm:text-[12px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-tight font-ui">Thành Đoàn Hải Phòng</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-10">
              <a href="#gioi-thieu" className="nav-link-tech">Giới thiệu</a>
              <a href="#lich-thi" className="nav-link-tech">Lịch thi</a>
              <a href="#giai-thuong" className="nav-link-tech">Giải thưởng</a>
              <button
                onClick={() => navigate('/admin/login')}
                className="btn-cyber py-2 px-6 bg-brand-blue/5 text-brand-blue hover:bg-brand-blue hover:text-white border border-brand-blue/20"
              >
                ADMIN PORTAL
              </button>
            </div>

            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="text-brand-blue p-3 bg-brand-blue/5 rounded-xl hover:bg-brand-blue/10 transition-colors"
              >
                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-brand-blue/10 p-6 space-y-6 animate-in slide-in-from-top duration-300">
            <a href="#gioi-thieu" className="block nav-link-tech text-lg" onClick={() => setMobileMenuOpen(false)}>Giới thiệu</a>
            <a href="#lich-thi" className="block nav-link-tech text-lg" onClick={() => setMobileMenuOpen(false)}>Lịch thi</a>
            <a href="#giai-thuong" className="block nav-link-tech text-lg" onClick={() => setMobileMenuOpen(false)}>Giải thưởng</a>
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/admin/login'); }}
              className="w-full btn-cyber text-lg h-16"
            >
              HỆ THỐNG QUẢN TRỊ
            </button>
          </div>
        )}
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-[95vh] flex items-center pt-20 pb-32 overflow-hidden bg-hero-cyber">
        {/* Background Layer (Overlays) */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-blue/40 via-transparent to-brand-beige/5"></div>
          <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none"></div>
          {/* Subtle Particles/Circuit Highlights */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-yellow/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-blue/10 blur-[150px] rounded-full"></div>
        </div>

        <div className="section-container relative z-10 text-center">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full mb-12 animate-pulse-soft">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-yellow shadow-[0_0_15px_#FABD32]"></div>
            <span className="text-[12px] font-black text-white uppercase tracking-[0.2em] font-ui whitespace-nowrap">Cuộc thi trực tuyến • Thành đoàn Hải Phòng • 2026</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black text-white mb-8 leading-[1.15] font-ui drop-shadow-2xl">
            Thanh niên Hải Phòng với <br className="hidden md:block" />
            <span className="text-brand-yellow drop-shadow-[0_0_30px_rgba(250,189,50,0.5)]">
              Chuyển đổi số, Chuyển đổi xanh
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-white/90 mb-16 max-w-4xl mx-auto font-semibold leading-relaxed px-6 font-ui italic">
            "Hành động vì thành phố đáng sống"
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 px-6">
            {hasActiveChang ? (
              <button
                onClick={() => navigate('/thi')}
                className="w-full sm:w-auto btn-cyber btn-cyber-gold text-2xl h-20 px-20 group"
              >
                VÀO PHÒNG_THI
                <ChevronRight className="w-8 h-8 group-hover:translate-x-3 transition-transform" />
              </button>
            ) : (
              <div className="w-full sm:w-auto bg-white/10 backdrop-blur-xl border-2 border-brand-yellow px-12 py-6 rounded-2xl text-brand-yellow font-ui font-black text-xl flex items-center justify-center gap-4 shadow-2xl tracking-wider">
                <Clock className="w-8 h-8" />
                VÒNG SƠ KHẢO: 28/03 – 12/04/2026
              </div>
            )}
            <a href="#gioi-thieu" className="w-full sm:w-auto btn-cyber bg-white/10 border-2 border-white/20 text-white h-20 px-12 text-sm hover:bg-white/20 transition-all">
              HƯỚNG DẪN CHI TIẾT
            </a>
          </div>

          {/* Stats Bar (Cyber Style) */}
          <div className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-12 max-w-6xl mx-auto border-t border-white/20 pt-16 px-6">
            {[
              { icon: <Users size={32} />, val: "100+", label: "Đơn vị tham gia", color: "text-brand-yellow" },
              { icon: <Cpu size={32} />, val: "3", label: "Chặng thi Sơ khảo", color: "text-blue-400" },
              { icon: <Globe size={32} />, val: "Miễn phí", label: "Đăng ký dự thi", color: "text-emerald-400" },
              { icon: <Trophy size={32} />, val: "TOP 10", label: "Vào Vòng Chung kết", color: "text-brand-red" },
            ].map((s, i) => (
              <div key={i} className="text-center group transition-transform hover:scale-110">
                <div className={`${s.color} mb-4 flex justify-center drop-shadow-[0_0_15px_currentColor]`}>{s.icon}</div>
                <div className="text-3xl md:text-5xl font-tech font-black text-white mb-2">{s.val}</div>
                <div className="text-[11px] text-white/50 font-black uppercase tracking-[0.3em] font-tech">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Về Cuộc Thi ─── */}
      <section id="gioi-thieu" className="py-32 bg-white relative">
        <div className="section-container">
          <div className="flex flex-col lg:flex-row gap-24 lg:items-center">
            <div className="flex-1 space-y-12">
              <div className="inline-block px-6 py-2 bg-brand-red text-white text-xs font-black uppercase tracking-[0.2em] font-ui">Về Cuộc Thi</div>
              <h2 className="text-5xl md:text-6xl font-black text-brand-blue leading-tight font-ui">Mục đích <br />& Ý nghĩa</h2>
              <p className="text-xl md:text-2xl text-slate-500 leading-relaxed font-medium font-ui">
                Cuộc thi hướng tới nâng cao nhận thức và hành động của đoàn viên, thanh niên Hải Phòng về chuyển đổi số, chuyển đổi xanh và đổi mới sáng tạo.
              </p>
              <div className="space-y-8 pt-6">
                {[
                  "Nâng cao nhận thức về chuyển đổi số, chuyển đổi xanh và đổi mới sáng tạo.",
                  "Phát huy vai trò xung kích, sáng tạo của thanh niên Hải Phòng.",
                  "Đề xuất ý tưởng, sáng kiến ứng dụng công nghệ số gắn với bảo vệ môi trường, phát triển bền vững.",
                ].map((text, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <div className="mt-1 flex-shrink-0 w-12 h-12 bg-brand-blue/5 text-brand-blue rounded-2xl flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white group-hover:shadow-lg transition-all duration-300">
                      <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <span className="text-slate-800 font-bold text-lg md:text-xl pt-2 font-ui">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8 pt-12 lg:pt-0">
              <div className="card-tech hover:bg-brand-blue hover:text-white group">
                <Users className="w-16 h-16 text-brand-blue mb-8 group-hover:text-white" />
                <h3 className="font-ui font-black text-2xl mb-6 text-brand-blue group-hover:text-white transition-colors">Đối tượng dự thi</h3>
                <p className="font-medium text-slate-500 group-hover:text-white/80 text-lg leading-relaxed font-ui transition-colors">Thanh niên sinh sống tại Hải Phòng, độ tuổi từ 16 đến 35. Mỗi đơn vị tối thiểu 02 đội (3 thành viên/đội).</p>
              </div>
              <div className="card-tech sm:mt-16 bg-brand-beige/10 border-brand-red/20 group hover:bg-brand-red hover:text-white">
                <Trophy className="w-16 h-16 text-brand-red mb-8 group-hover:text-white" />
                <h3 className="font-ui font-black text-2xl mb-6 text-brand-red group-hover:text-white transition-colors">Giải thưởng</h3>
                <p className="font-medium text-slate-500 group-hover:text-white/80 text-lg leading-relaxed font-ui transition-colors">Giải Nhất, Nhì, Ba kèm Bằng khen và tiền mặt. Top 10 đội xuất sắc nhất vào Vòng Chung kết ngày 25/4/2026.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Lịch Thi ─── */}
      <section id="lich-thi" className="py-32 bg-brand-dark relative overflow-hidden">
        {/* Decoration Overlay */}
        <div className="absolute inset-0 bg-brand-blue/5 opacity-20 circuit-pattern"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-24">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 font-ui">Lịch thi Vòng Sơ khảo</h2>
            <div className="w-32 h-2 bg-brand-yellow mx-auto mb-10 rounded-full shadow-[0_0_20px_#FABD32]"></div>
            <p className="text-white/60 font-medium text-lg md:text-2xl max-w-3xl mx-auto font-ui">Thi trắc nghiệm trực tuyến • 30 câu hỏi • 25 phút • Mỗi đội 3 thành viên</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-16 h-16 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {changs.map((ct, idx) => {
                const active = isActive(ct);
                const colorClass = active ? 'border-brand-yellow bg-white shadow-[0_0_50px_rgba(250,189,50,0.15)] scale-105 z-20' : 'border-white/10 bg-white/5 opacity-80';
                const textTitle = active ? 'text-brand-blue' : 'text-white';
                const textSub = active ? 'text-slate-500' : 'text-white/50';

                return (
                  <div key={ct.id} className={`card-tech group ${colorClass}`}>
                    <div className="flex justify-between items-center mb-10">
                      <span className={`text-6xl font-tech font-black transition-colors ${active ? 'text-brand-blue/10' : 'text-white/5'}`}>0{idx + 1}</span>
                      {active && (
                        <div className="flex items-center gap-2 px-6 py-2 bg-brand-red rounded-full animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#fff]"></div>
                          <span className="text-white text-[11px] font-black uppercase tracking-[0.2em] font-tech text-glow-gold">Phòng Thi Mở</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className={`text-3xl font-tech font-black mb-8 uppercase tracking-tight text-left ${textTitle}`}>{ct.ten}</h3>
                    
                    <div className={`space-y-6 text-left mb-12 font-medium text-lg font-ui ${textSub}`}>
                      <div className="flex items-center gap-4">
                        <Calendar className="w-6 h-6 text-brand-yellow" />
                        <span>{formatDateTime(ct.bat_dau)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Clock className="w-6 h-6 text-brand-yellow" />
                        <span>{ct.thoi_gian_phut} PHÚT LÀM BÀI</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Cpu className="w-6 h-6 text-brand-yellow" />
                        <span>30 CÂU HỎI TRẮC NGHIỆM</span>
                      </div>
                    </div>

                    {active && (
                      <button 
                        onClick={() => navigate('/thi')} 
                        className="w-full btn-cyber text-lg h-16 group/btn"
                      >
                        THAM GIA NGAY
                        <ChevronRight className="group-hover/btn:translate-x-2 transition-transform" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Giải thưởng ─── */}
      <section id="giai-thuong" className="py-32 bg-white relative">
        <div className="section-container">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-2 bg-brand-yellow text-brand-blue text-xs font-black uppercase tracking-[0.2em] font-ui mb-6">Cơ cấu giải thưởng</div>
            <h2 className="text-5xl md:text-6xl font-black text-brand-blue leading-tight font-ui">Giải thưởng</h2>
            <div className="w-32 h-2 bg-brand-yellow mx-auto mt-8 rounded-full shadow-[0_0_20px_#FABD32]"></div>
            <p className="text-slate-500 font-ui text-lg mt-8 max-w-2xl mx-auto">Căn cứ kết quả chung cuộc, Ban Tổ chức trao giải thưởng kèm Bằng khen của Ban Chấp hành Thành đoàn Hải Phòng.</p>
          </div>

          {/* Giải chính */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="card-tech border-brand-yellow/40 bg-brand-yellow/5 text-center">
              <Trophy className="w-14 h-14 text-brand-yellow mx-auto mb-6" />
              <h3 className="text-3xl font-black text-brand-blue font-ui mb-3">01 Giải Nhất</h3>
              <p className="text-slate-500 font-ui">Bằng khen BCH Thành đoàn + Phần thưởng tiền mặt</p>
            </div>
            <div className="card-tech text-center sm:mt-10">
              <Award className="w-14 h-14 text-slate-400 mx-auto mb-6" />
              <h3 className="text-3xl font-black text-brand-blue font-ui mb-3">01 Giải Nhì</h3>
              <p className="text-slate-500 font-ui">Bằng khen BCH Thành đoàn + Phần thưởng tiền mặt</p>
            </div>
            <div className="card-tech border-amber-700/20 bg-amber-50/30 text-center">
              <Star className="w-14 h-14 text-amber-700 mx-auto mb-6" />
              <h3 className="text-3xl font-black text-brand-blue font-ui mb-3">03 Giải Ba</h3>
              <p className="text-slate-500 font-ui">Bằng khen BCH Thành đoàn + Phần thưởng tiền mặt</p>
            </div>
          </div>

          {/* Giải phụ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-tech text-center">
              <ShieldCheck className="w-10 h-10 text-brand-blue mx-auto mb-4" />
              <h3 className="text-xl font-black text-brand-blue font-ui mb-2">05 Giải Khuyến Khích</h3>
              <p className="text-slate-500 font-ui text-sm">Bằng khen BCH Thành đoàn Hải Phòng</p>
            </div>
            <div className="card-tech text-center">
              <Globe className="w-10 h-10 text-brand-red mx-auto mb-4" />
              <h3 className="text-xl font-black text-brand-blue font-ui mb-2">Giải Bình Chọn Facebook</h3>
              <p className="text-slate-500 font-ui text-sm">Bằng khen BCH Thành đoàn Hải Phòng</p>
            </div>
            <div className="card-tech text-center">
              <Users className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-xl font-black text-brand-blue font-ui mb-2">Giải Đơn Vị Xuất Sắc</h3>
              <p className="text-slate-500 font-ui text-sm">Đơn vị có tổng điểm cao nhất Vòng Sơ khảo</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-white py-24 relative overflow-hidden">
        <div className="section-container">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-20 lg:items-start text-center lg:text-left">
            <div className="flex flex-col items-center lg:items-start gap-10">
              <img src={LOGO_URL} alt="Logo" className="h-32 w-auto drop-shadow-xl" />
              <div>
                <p className="text-3xl sm:text-4xl font-ui font-black text-brand-blue uppercase tracking-tighter">Thành Đoàn Hải Phòng</p>
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mt-3 font-ui">Đoàn TNCS Hồ Chí Minh TP. Hải Phòng</p>
              </div>
            </div>
            
            <div className="max-w-xl space-y-8">
              <p className="text-brand-blue text-2xl font-black italic tracking-wide leading-relaxed font-ui">
                "Thanh niên Hải Phòng: <br /> 
                <span className="text-brand-red">Xung kích</span> - <span className="text-brand-yellow">Sáng tạo</span> - <span className="text-brand-blue">Chuyên nghiệp</span>"
              </p>
              <div className="text-sm font-bold text-slate-500 space-y-4 uppercase tracking-widest font-ui">
                <p className="flex items-center gap-3 justify-center lg:justify-start">
                  <Globe size={18} className="text-brand-blue" />
                  Lô 26A Lê Hồng Phong, phường Gia Viên, TP. Hải Phòng
                </p>
                <p className="flex items-center gap-3 justify-center lg:justify-start">
                  <Star size={18} className="text-brand-yellow" />
                  Hotline: 0921.545.555 • Email: banphongtrao.tdhp@gmail.com
                </p>
              </div>
            </div>
          </div>
          <div className="mt-24 pt-12 border-t-2 border-brand-blue/5 text-center">
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] font-tech text-grow-blue">© 2026 Thành Đoàn Hải Phòng Digital Solution.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
