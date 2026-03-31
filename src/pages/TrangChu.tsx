import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllChangThiPublic, type ChangThi } from '@/lib/db';
import { Calendar, Clock, Award, Users, ChevronRight, BookOpen, Trophy, Star, ShieldCheck, Zap, Globe } from 'lucide-react';

const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/d/d7/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png";

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

  useEffect(() => {
    getAllChangThiPublic()
      .then(setChangs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hasActiveChang = changs.some(isActive);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-yellow selection:text-brand-blue">
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-4">
              <img src={LOGO_URL} alt="Huy hiệu Đoàn" className="h-14 w-auto drop-shadow-sm" />
              <div className="hidden sm:block border-l border-slate-300 pl-4">
                <p className="text-sm font-bold text-brand-blue leading-tight uppercase tracking-wide">Đoàn TNCS Hồ Chí Minh</p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Thành Đoàn Hải Phòng</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-6">
              <div className="hidden md:flex gap-8">
                <a href="#gioi-thieu" className="text-sm font-semibold text-slate-600 hover:text-brand-blue transition-colors">Giới thiệu</a>
                <a href="#lich-thi" className="text-sm font-semibold text-slate-600 hover:text-brand-blue transition-colors">Lịch thi</a>
                <a href="#giai-thuong" className="text-sm font-semibold text-slate-600 hover:text-brand-blue transition-colors">Giải thưởng</a>
              </div>
              <button
                onClick={() => navigate('/admin/login')}
                className="text-xs font-bold text-slate-400 hover:text-brand-blue px-3 py-1 rounded-md border border-slate-200 hover:border-brand-blue transition-all"
              >
                ADMIN
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-hero-pattern pt-20 pb-32">
        {/* Animated Orbs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-8">
            <Zap className="w-4 h-4 text-brand-yellow fill-brand-yellow" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Cuộc thi trực tuyến 2026</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
            Thanh niên Hải Phòng <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-orange-300">
              Chuyển đổi số, Chuyển đổi xanh
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto font-medium opacity-90">
            Phát huy vai trò xung kích, sáng tạo của tuổi trẻ trong kỷ nguyên số và hành động vì một Hải Phòng xanh, bền vững.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {hasActiveChang ? (
              <button
                onClick={() => navigate('/thi')}
                className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-brand-yellow/30"
              >
                Tham gia thi ngay
                <ChevronRight className="w-6 h-6 animate-float" />
              </button>
            ) : (
              <div className="glass px-8 py-4 rounded-full text-brand-blue font-bold flex items-center gap-3">
                <Clock className="w-6 h-6 text-brand-blue" />
                Vòng Sơ khảo: 28/3 – 12/4/2026
              </div>
            )}
            <a href="#gioi-thieu" className="px-8 py-4 text-white font-bold hover:text-brand-yellow transition-colors bg-white/5 hover:bg-white/10 rounded-full border border-white/10">
              Tìm hiểu thêm
            </a>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto border-t border-white/10 pt-10">
            {[
              { icon: <Users />, val: "100+", label: "Đoàn trực thuộc" },
              { icon: <ShieldCheck />, val: "30", label: "Câu hỏi/Chặng" },
              { icon: <Globe />, val: "24/7", label: "Nền tảng trực tuyến" },
              { icon: <Award />, val: "🥇 🥈 🥉", label: "Cơ cấu giải thưởng" },
            ].map((s, i) => (
              <div key={i} className="text-center group">
                <div className="text-brand-yellow mb-2 flex justify-center group-hover:scale-110 transition-transform">{s.icon}</div>
                <div className="text-2xl font-black text-white">{s.val}</div>
                <div className="text-xs text-blue-200 font-bold uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Về Cuộc Thi ─── */}
      <section id="gioi-thieu" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 space-y-6">
              <div className="w-16 h-1.5 bg-brand-yellow rounded-full"></div>
              <h2 className="text-4xl font-black text-brand-blue">Tầm nhìn & Mục tiêu</h2>
              <p className="text-lg text-slate-600 leading-relaxed italic">
                "Thành phố Hải Phòng đang bước vào giai đoạn then chốt của công cuộc chuyển đổi số toàn diện. Thanh niên chính là lực lượng đi đầu, là chủ thể của sự thay đổi này."
              </p>
              <div className="space-y-4">
                {[
                  "Nâng cao nhận thức về chuyển đổi số và chuyển đổi xanh.",
                  "Tìm kiếm các giải pháp, ý tưởng khởi nghiệp sáng tạo ứng dụng công nghệ.",
                  "Kết nối thanh niên, sinh viên toàn thành phố hành động vì môi trường.",
                ].map((text, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 fill-current" />
                    </div>
                    <span className="text-slate-700 font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 card-hover">
                <Users className="w-10 h-10 text-brand-blue mb-4" />
                <h3 className="font-bold text-xl mb-2">Thí sinh</h3>
                <p className="text-sm text-slate-500">Đoàn viên, thanh niên sinh sống tại Hải Phòng (16-35 tuổi).</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 card-hover sm:translate-y-8">
                <Trophy className="w-10 h-10 text-brand-yellow mb-4" />
                <h3 className="font-bold text-xl mb-2">Giải thưởng</h3>
                <p className="text-sm text-slate-500">Giấy khen Thành đoàn Hải Phòng và giá trị tiền mặt xứng đáng.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Lịch Thi (Modern Cards) ─── */}
      <section id="lich-thi" className="py-24 bg-brand-blue relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Lịch trình thi đấu</h2>
            <p className="text-blue-200 opacity-80">3 chặng thi trực tuyến để tìm ra những ngôi sao chuyển đổi số xuất sắc nhất</p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {changs.map((ct, idx) => {
                const active = isActive(ct);
                const upcoming = isUpcoming(ct);
                const past = !active && !upcoming;
                return (
                  <div
                    key={ct.id}
                    className={`group relative p-1 rounded-[2rem] transition-all duration-500 hover:scale-105 ${
                      active ? 'bg-gradient-to-br from-brand-yellow to-orange-400 shadow-2xl' : 'bg-white/10'
                    }`}
                  >
                    <div className={`h-full rounded-[1.8rem] p-8 ${active ? 'bg-white' : 'bg-slate-900/40 backdrop-blur-md border border-white/10'}`}>
                      <div className="flex justify-between items-start mb-6">
                        <span className={`text-4xl font-black ${active ? 'text-brand-blue' : 'text-white/20'}`}>0{idx + 1}</span>
                        {active && (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                            🚀 ĐANG MỞ
                          </span>
                        )}
                        {past && <span className="text-white/40 text-xs font-bold uppercase">Đã đóng</span>}
                        {upcoming && <span className="text-brand-yellow/60 text-xs font-bold uppercase">Sắp tới</span>}
                      </div>

                      <h3 className={`text-xl font-bold mb-4 ${active ? 'text-slate-900' : 'text-white'}`}>{ct.ten}</h3>
                      
                      <div className={`space-y-3 mb-8 text-sm ${active ? 'text-slate-600' : 'text-blue-100/60'}`}>
                        <div className="flex items-center gap-3">
                          <Calendar className={`w-4 h-4 ${active ? 'text-brand-blue' : 'text-brand-yellow'}`} />
                          <span>{formatDateTime(ct.bat_dau)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className={`w-4 h-4 ${active ? 'text-brand-blue' : 'text-brand-yellow'}`} />
                          <span>Thời gian: {ct.thoi_gian_phut} phút</span>
                        </div>
                      </div>

                      {active && (
                        <button
                          onClick={() => navigate('/thi')}
                          className="w-full btn-primary text-sm py-4"
                        >
                          Tham gia ngay <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-6">
              <img src={LOGO_URL} alt="Logo" className="h-20 w-auto opacity-80" />
              <div>
                <p className="text-xl font-black text-brand-blue uppercase">Thành Đoàn Hải Phòng</p>
                <p className="text-slate-500 font-medium">BCH Đoàn TNCS Hồ Chí Minh TP. Hải Phòng</p>
              </div>
            </div>
            
            <div className="text-center md:text-right space-y-2">
              <p className="text-slate-700 font-semibold italic">"Tuổi trẻ Hải Phòng xung kích vì tương lai số"</p>
              <div className="text-sm text-slate-500">
                <p>Địa chỉ: Lô 26A Lê Hồng Phong, Phường Gia Viên, TP. Hải Phòng</p>
                <p>Hotline hỗ trợ: 0921.545.555</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-100 text-center text-xs text-slate-400 uppercase tracking-widest">
            © 2026 Cuộc thi Chuyển đổi số, Chuyển đổi xanh. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
