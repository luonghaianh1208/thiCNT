import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllChangThiPublic, type ChangThi } from '@/lib/db';
import { Calendar, Clock, Award, Users, ChevronRight, Trophy, Star, ShieldCheck, Zap, Globe, Menu, X, Cpu, PlayCircle } from 'lucide-react';

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
  const activeChang = changs.find(isActive);
  const nextChang = changs.find(c => new Date() < new Date(c.bat_dau));

  // Compute stats from actual chang data
  const statsChang = activeChang || nextChang || changs[0];
  const totalSoCau = changs.reduce((sum, c) => sum + c.so_cau, 0);
  const totalThoiGian = changs.reduce((sum, c) => sum + c.thoi_gian_phut, 0);

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
              <div className="border-l-2 border-brand-blue/20 pl-3 lg:pl-4 min-w-0">
                <p className="text-[11px] sm:text-[14px] font-black text-brand-blue uppercase tracking-[0.05em] leading-tight font-ui truncate">Đoàn TNCS Hồ Chí Minh</p>
                <p className="text-[10px] sm:text-[12px] font-bold text-slate-500 uppercase tracking-[0.1em] leading-tight font-ui hidden sm:block">Thành Đoàn Hải Phòng</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#gioi-thieu" className="nav-link-tech">Giới thiệu</a>
              <a href="#lich-thi" className="nav-link-tech">Lịch thi</a>
              <a href="#giai-thuong" className="nav-link-tech">Giải thưởng</a>
              {hasActiveChang ? (
                <button
                  onClick={() => navigate('/thi')}
                  className="flex items-center gap-2 bg-brand-yellow text-brand-blue font-black text-sm px-6 py-3 rounded-xl hover:bg-yellow-400 transition-all shadow-lg shadow-brand-yellow/30 font-ui animate-pulse-soft"
                >
                  <PlayCircle size={18} />
                  Vào thi ngay
                </button>
              ) : (
                <button
                  onClick={() => navigate('/thi')}
                  className="flex items-center gap-2 bg-brand-blue/5 border-2 border-brand-blue/20 text-brand-blue font-bold text-sm px-6 py-3 rounded-xl hover:bg-brand-blue/10 transition-all font-ui"
                >
                  <Clock size={16} />
                  Xem lịch thi
                </button>
              )}
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
          <div className="md:hidden bg-white border-t border-brand-blue/10 p-6 space-y-4 animate-in slide-in-from-top duration-300">
            <a href="#gioi-thieu" className="block nav-link-tech text-lg" onClick={() => setMobileMenuOpen(false)}>Giới thiệu</a>
            <a href="#lich-thi" className="block nav-link-tech text-lg" onClick={() => setMobileMenuOpen(false)}>Lịch thi</a>
            <a href="#giai-thuong" className="block nav-link-tech text-lg" onClick={() => setMobileMenuOpen(false)}>Giải thưởng</a>
            <div className="pt-2">
              {hasActiveChang ? (
                <button
                  onClick={() => { navigate('/thi'); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-3 bg-brand-yellow text-brand-blue font-black text-base py-4 rounded-2xl hover:bg-yellow-400 transition-all shadow-lg font-ui"
                >
                  <PlayCircle size={20} /> Vào thi ngay
                </button>
              ) : (
                <button
                  onClick={() => { navigate('/thi'); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-3 bg-brand-blue/5 border-2 border-brand-blue/20 text-brand-blue font-bold text-sm py-4 rounded-2xl font-ui"
                >
                  <Clock size={16} />
                  {nextChang ? `Mở thi: ${formatDateTime(nextChang.bat_dau)}` : 'Xem lịch thi'}
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-[95vh] flex items-center pt-20 pb-32 overflow-hidden bg-hero-cyber">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-blue/40 via-transparent to-brand-beige/5"></div>
          <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-yellow/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-blue/10 blur-[150px] rounded-full"></div>
        </div>

        <div className="section-container relative z-10 text-center">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full mb-12 animate-pulse-soft">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-yellow shadow-[0_0_15px_#FABD32]"></div>
            <span className="text-[12px] font-bold text-white uppercase tracking-[0.2em] font-ui whitespace-nowrap">Cuộc thi trực tuyến • Thành đoàn Hải Phòng • 2026</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black text-white mb-8 leading-[1.2] font-ui drop-shadow-2xl">
            Thanh niên Hải Phòng với<br className="hidden md:block" />
            <span className="text-brand-yellow drop-shadow-[0_0_30px_rgba(250,189,50,0.5)]">
              {' '}Chuyển đổi số, Chuyển đổi xanh
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-white/90 mb-16 max-w-3xl mx-auto font-semibold leading-relaxed px-6 font-ui italic">
            "Hành động vì thành phố đáng sống"
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 px-6">
            <a
              href="#lich-thi"
              className={`w-full sm:w-auto relative font-black text-xl px-14 py-6 rounded-2xl flex items-center justify-center gap-3 group overflow-hidden transition-all shadow-[0_0_40px_rgba(250,189,50,0.4)] ${hasActiveChang ? 'bg-brand-yellow text-brand-blue hover:bg-yellow-400' : 'bg-white/10 backdrop-blur-xl border-2 border-brand-yellow/60 text-white hover:bg-white/20'}`}
            >
              <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></span>
              <PlayCircle className="w-7 h-7" />
              {hasActiveChang ? 'Vào thi ngay' : 'Xem lịch thi'}
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#gioi-thieu"
              className="w-full sm:w-auto border-2 border-white/40 text-white font-bold text-base px-10 py-5 rounded-2xl hover:bg-white/10 transition-all font-ui flex items-center justify-center"
            >
              Hướng dẫn chi tiết
            </a>
          </div>

          {/* Stats */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto border-t border-white/20 pt-16 px-6">
            {[
              { icon: <Users size={28} />, val: "100+", label: "Đơn vị tham gia", color: "text-brand-yellow" },
              { icon: <Cpu size={28} />, val: "3", label: "Chặng thi Sơ khảo", color: "text-blue-400" },
              { icon: <Globe size={28} />, val: "Miễn phí", label: "Đăng ký dự thi", color: "text-emerald-400" },
              { icon: <Trophy size={28} />, val: "TOP 10", label: "Vào Vòng Chung kết", color: "text-brand-red" },
            ].map((s, i) => (
              <div key={i} className="text-center group transition-transform hover:scale-105">
                <div className={`${s.color} mb-3 flex justify-center`}>{s.icon}</div>
                <div className="text-2xl md:text-4xl font-ui font-black text-white mb-2">{s.val}</div>
                <div className="text-[11px] text-white/50 font-semibold uppercase tracking-[0.2em] font-ui">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Về Cuộc Thi ─── */}
      <section id="gioi-thieu" className="py-28 bg-white relative">
        <div className="section-container">
          <div className="flex flex-col lg:flex-row gap-20 lg:items-center">
            <div className="flex-1 space-y-10">
              <div className="inline-block px-5 py-2 bg-brand-red text-white text-xs font-black uppercase tracking-[0.2em] font-ui rounded">Về Cuộc Thi</div>
              <h2 className="text-4xl md:text-5xl font-black text-brand-blue leading-tight font-ui">Mục đích & Ý nghĩa</h2>
              <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium font-ui">
                Cuộc thi hướng tới nâng cao nhận thức và hành động của đoàn viên, thanh niên Hải Phòng về chuyển đổi số, chuyển đổi xanh và đổi mới sáng tạo.
              </p>
              <div className="space-y-6 pt-2">
                {[
                  "Nâng cao nhận thức về chuyển đổi số, chuyển đổi xanh và đổi mới sáng tạo.",
                  "Phát huy vai trò xung kích, sáng tạo của thanh niên Hải Phòng.",
                  "Đề xuất ý tưởng, sáng kiến ứng dụng công nghệ số gắn với bảo vệ môi trường, phát triển bền vững.",
                ].map((text, i) => (
                  <div key={i} className="flex gap-5 items-start">
                    <div className="mt-1 flex-shrink-0 w-10 h-10 bg-brand-blue text-white rounded-xl flex items-center justify-center shadow-md">
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-slate-700 font-semibold text-base md:text-lg pt-1.5 font-ui">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 lg:pt-0">
              {/* Card màu xanh — không cần hover mới thấy */}
              <div className="card-tech bg-brand-blue text-white">
                <Users className="w-12 h-12 text-white/80 mb-6" />
                <h3 className="font-ui font-black text-xl mb-4 text-white">Đối tượng dự thi</h3>
                <p className="font-medium text-white/80 text-base leading-relaxed font-ui">Thanh niên sinh sống tại Hải Phòng, độ tuổi 16–35. Tối thiểu 02 đội/đơn vị (3 thành viên/đội).</p>
              </div>
              {/* Card màu đỏ */}
              <div className="card-tech sm:mt-12 bg-brand-red text-white border-brand-red/20">
                <Trophy className="w-12 h-12 text-white/80 mb-6" />
                <h3 className="font-ui font-black text-xl mb-4 text-white">Giải thưởng</h3>
                <p className="font-medium text-white/80 text-base leading-relaxed font-ui">Giải Nhất, Nhì, Ba kèm Bằng khen và tiền mặt. Top 10 đội xuất sắc vào Chung kết ngày 25/4/2026.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Lịch Thi ─── */}
      <section id="lich-thi" className="py-28 bg-brand-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-blue/5 opacity-20 circuit-pattern"></div>

        <div className="section-container text-center relative z-10">
          <div className="mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 font-ui">Lịch thi Vòng Sơ khảo</h2>
            <div className="w-24 h-1.5 bg-brand-yellow mx-auto mb-8 rounded-full shadow-[0_0_20px_#FABD32]"></div>
            <p className="text-white/60 font-medium text-base md:text-xl max-w-2xl mx-auto font-ui">
              Thi trắc nghiệm trực tuyến • {totalSoCau} câu hỏi • {totalThoiGian} phút • Mỗi đội 3 thành viên
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-14 h-14 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {changs.map((ct, idx) => {
                const active = isActive(ct);
                const cardCls = active
                  ? 'border-brand-yellow bg-white shadow-[0_0_50px_rgba(250,189,50,0.15)] scale-105 z-20'
                  : 'border-white/10 bg-white/5 opacity-75';
                const titleCls = active ? 'text-brand-blue' : 'text-white';
                const subCls = active ? 'text-slate-500' : 'text-white/50';

                return (
                  <div key={ct.id} className={`card-tech ${cardCls}`}>
                    <div className="flex justify-between items-center mb-8">
                      <span className={`text-5xl font-tech font-black ${active ? 'text-brand-blue/10' : 'text-white/5'}`}>0{idx + 1}</span>
                      {active && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-brand-red rounded-full animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                          <span className="text-white text-[11px] font-black uppercase tracking-[0.15em] font-ui">Phòng Thi Mở</span>
                        </div>
                      )}
                    </div>

                    <h3 className={`text-2xl font-ui font-black mb-6 text-left ${titleCls}`}>{ct.ten}</h3>

                    <div className={`space-y-4 text-left mb-10 font-medium text-base font-ui ${subCls}`}>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                        <span>{formatDateTime(ct.bat_dau)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                        <span>{ct.thoi_gian_phut} phút làm bài</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Cpu className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                        <span>{ct.so_cau} câu hỏi trắc nghiệm</span>
                      </div>
                    </div>

                    {active && (
                      <button
                        onClick={() => navigate('/thi')}
                        className="w-full bg-brand-blue text-white font-bold text-base py-4 rounded-xl hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-2 group font-ui"
                      >
                        Tham gia ngay
                        <ChevronRight className="group-hover:translate-x-1 transition-transform" />
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
      <section id="giai-thuong" className="py-28 bg-white relative">
        <div className="section-container">
          <div className="text-center mb-16">
            <div className="inline-block px-5 py-2 bg-brand-yellow text-brand-blue text-xs font-black uppercase tracking-[0.2em] font-ui mb-5 rounded">Cơ cấu giải thưởng</div>
            <h2 className="text-4xl md:text-5xl font-black text-brand-blue leading-tight font-ui">Giải thưởng</h2>
            <div className="w-24 h-1.5 bg-brand-yellow mx-auto mt-6 rounded-full shadow-[0_0_20px_#FABD32]"></div>
            <p className="text-slate-500 font-ui text-base mt-6 max-w-xl mx-auto">
              Căn cứ kết quả chung cuộc, Ban Tổ chức trao giải kèm Bằng khen của Ban Chấp hành Thành đoàn Hải Phòng.
            </p>
          </div>

          {/* Giải chính */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="rounded-2xl border-2 border-brand-yellow/60 bg-brand-yellow/5 p-8 text-center flex flex-col items-center">
              <Trophy className="w-12 h-12 text-brand-yellow mb-5" />
              <h3 className="text-2xl font-black text-brand-blue font-ui mb-2">01 Giải Nhất</h3>
              <p className="text-slate-500 font-ui text-sm">Bằng khen BCH Thành đoàn + Phần thưởng tiền mặt</p>
            </div>
            <div className="rounded-2xl border-2 border-brand-yellow/60 bg-brand-yellow/5 p-8 text-center flex flex-col items-center">
              <Award className="w-12 h-12 text-brand-yellow mb-5" />
              <h3 className="text-2xl font-black text-brand-blue font-ui mb-2">01 Giải Nhì</h3>
              <p className="text-slate-500 font-ui text-sm">Bằng khen BCH Thành đoàn + Phần thưởng tiền mặt</p>
            </div>
            <div className="rounded-2xl border-2 border-brand-yellow/60 bg-brand-yellow/5 p-8 text-center flex flex-col items-center">
              <Star className="w-12 h-12 text-brand-yellow mb-5" />
              <h3 className="text-2xl font-black text-brand-blue font-ui mb-2">03 Giải Ba</h3>
              <p className="text-slate-500 font-ui text-sm">Bằng khen BCH Thành đoàn + Phần thưởng tiền mặt</p>
            </div>
          </div>

          {/* Giải phụ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
              <ShieldCheck className="w-9 h-9 text-brand-blue mx-auto mb-3" />
              <h3 className="text-lg font-black text-brand-blue font-ui mb-1">05 Giải Khuyến Khích</h3>
              <p className="text-slate-500 font-ui text-sm">Bằng khen BCH Thành đoàn Hải Phòng</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
              <Globe className="w-9 h-9 text-brand-red mx-auto mb-3" />
              <h3 className="text-lg font-black text-brand-blue font-ui mb-1">Giải Bình Chọn Facebook</h3>
              <p className="text-slate-500 font-ui text-sm">Bằng khen BCH Thành đoàn Hải Phòng</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
              <Users className="w-9 h-9 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-lg font-black text-brand-blue font-ui mb-1">Giải Đơn Vị Xuất Sắc</h3>
              <p className="text-slate-500 font-ui text-sm">Đơn vị có tổng điểm cao nhất Vòng Sơ khảo</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-white border-t border-brand-blue/10 py-20 relative overflow-hidden">
        <div className="section-container">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-16 lg:items-start text-center lg:text-left">
            <div className="flex flex-col items-center lg:items-start gap-8">
              <img src={LOGO_URL} alt="Logo" className="h-24 w-auto drop-shadow-xl" />
              <div>
                <p className="text-2xl sm:text-3xl font-ui font-black text-brand-blue">Thành Đoàn Hải Phòng</p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 font-ui">Đoàn TNCS Hồ Chí Minh TP. Hải Phòng</p>
              </div>
            </div>

            <div className="max-w-lg space-y-6">
              <p className="text-brand-blue text-xl font-bold italic leading-relaxed font-ui">
                "Thanh niên Hải Phòng:<br />
                <span className="text-brand-red">Xung kích</span>
                {' – '}
                <span className="text-brand-yellow">Sáng tạo</span>
                {' – '}
                <span className="text-brand-blue">Chuyên nghiệp</span>"
              </p>
              <div className="text-sm font-semibold text-slate-500 space-y-3 font-ui">
                <p className="flex items-center gap-3 justify-center lg:justify-start">
                  <Globe size={16} className="text-brand-blue flex-shrink-0" />
                  Lô 26A Lê Hồng Phong, phường Gia Viên, TP. Hải Phòng
                </p>
                <p className="flex items-center gap-3 justify-center lg:justify-start">
                  <Star size={16} className="text-brand-yellow flex-shrink-0" />
                  Hotline: 0921.545.555 | Email: banphongtrao.tdhp@gmail.com
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-brand-blue/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-semibold text-slate-300 font-ui">© 2026 Thành Đoàn Hải Phòng. Bảo lưu mọi quyền.</p>
            {/* Admin link — chỉ dành cho quản trị viên */}
            <button
              onClick={() => navigate('/admin/login')}
              className="text-xs text-slate-200 hover:text-slate-400 transition-colors font-ui"
            >
              Quản trị hệ thống
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
