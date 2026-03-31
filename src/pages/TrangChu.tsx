import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllChangThiPublic, type ChangThi } from '@/lib/db';
import { Calendar, Clock, Award, Users, ChevronRight, BookOpen, Trophy, Star, ShieldCheck, Zap, Globe } from 'lucide-react';

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
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
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
                <a href="#gioi-thieu" className="text-sm font-bold text-slate-600 hover:text-brand-blue transition-colors">Giới thiệu</a>
                <a href="#lich-thi" className="text-sm font-bold text-slate-600 hover:text-brand-blue transition-colors">Lịch thi</a>
                <a href="#giai-thuong" className="text-sm font-bold text-slate-600 hover:text-brand-blue transition-colors">Giải thưởng</a>
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
      <section className="relative overflow-hidden bg-hero-solid pt-24 pb-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full mb-10">
            <Zap className="w-4 h-4 text-brand-yellow fill-brand-yellow" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Cuộc thi trực tuyến 2026</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black text-white mb-8 leading-tight tracking-tighter">
            Thanh niên Hải Phòng <br />
            <span className="text-brand-yellow drop-shadow-lg">
              Chuyển đổi số, Chuyển đổi xanh
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white mb-14 max-w-3xl mx-auto font-bold leading-relaxed opacity-95">
            Phát huy vai trò xung kích, sáng tạo của tuổi trẻ trong kỷ nguyên số và hành động vì một Hải Phòng xanh, bền vững.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {hasActiveChang ? (
              <button
                onClick={() => navigate('/thi')}
                className="btn-primary text-2xl px-14 py-6 shadow-2xl shadow-black/30"
              >
                Tham gia thi ngay
                <ChevronRight className="w-8 h-8" />
              </button>
            ) : (
              <div className="bg-white px-10 py-5 rounded-2xl text-brand-blue font-black text-lg flex items-center gap-3 shadow-xl border-2 border-brand-blue/10">
                <Clock className="w-6 h-6" />
                Vòng Sơ khảo: 28/3 – 12/4/2026
              </div>
            )}
            <a href="#gioi-thieu" className="px-10 py-5 text-white font-bold hover:text-brand-yellow transition-colors bg-white/10 rounded-2xl border-2 border-white/20">
              Tìm hiểu thêm
            </a>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto border-t border-white/20 pt-10">
            {[
              { icon: <Users />, val: "100+", label: "Đoàn trực thuộc" },
              { icon: <ShieldCheck />, val: "30", label: "Câu hỏi/Chặng" },
              { icon: <Globe />, val: "24/7", label: "Nền tảng trực tuyến" },
              { icon: <Award />, val: "🥇 🥈 🥉", label: "Cơ cấu giải thưởng" },
            ].map((s, i) => (
              <div key={i} className="text-center group">
                <div className="text-brand-yellow mb-2 flex justify-center group-hover:scale-110 transition-transform">{s.icon}</div>
                <div className="text-2xl font-black text-white">{s.val}</div>
                <div className="text-xs text-white/70 font-bold uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Về Cuộc Thi ─── */}
      <section id="gioi-thieu" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 space-y-6 text-left">
              <div className="w-16 h-2 bg-brand-yellow rounded-full"></div>
              <h2 className="text-5xl font-black text-brand-blue tracking-tight">Tầm nhìn & Mục tiêu</h2>
              <p className="text-xl text-slate-700 leading-relaxed font-medium">
                "Thành phố Hải Phòng đang bước vào giai đoạn then chốt của công cuộc chuyển đổi số toàn diện. Thanh niên chính là lực lượng đi đầu, là chủ thể của sự thay đổi này."
              </p>
              <div className="space-y-4 pt-4">
                {[
                  "Nâng cao nhận thức về chuyển đổi số và chuyển đổi xanh.",
                  "Tìm kiếm các giải pháp, ý tưởng khởi nghiệp sáng tạo ứng dụng công nghệ.",
                  "Kết nối thanh niên, sinh viên toàn thành phố hành động vì môi trường.",
                ].map((text, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 bg-blue-100 text-brand-blue rounded-full flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <span className="text-slate-800 font-bold text-lg">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-8 rounded-[2.5rem] shadow-lg border border-slate-200 card-hover">
                <Users className="w-12 h-12 text-brand-blue mb-6" />
                <h3 className="font-black text-2xl text-brand-blue mb-3 uppercase tracking-tight">Thí sinh</h3>
                <p className="text-slate-600 font-bold leading-relaxed">Đoàn viên, thanh niên sinh sống tại Hải Phòng (16-35 tuổi).</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] shadow-lg border border-slate-200 card-hover sm:translate-y-12">
                <Trophy className="w-12 h-12 text-brand-yellow mb-6" />
                <h3 className="font-black text-2xl text-brand-blue mb-3 uppercase tracking-tight">Giải thưởng</h3>
                <p className="text-slate-600 font-bold leading-relaxed">Giấy khen Thành đoàn Hải Phòng và giá trị tiền mặt xứng đáng.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Lịch Thi (Sharp Modern Cards) ─── */}
      <section id="lich-thi" className="py-28 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter">Lịch trình thi đấu</h2>
            <div className="w-24 h-1.5 bg-brand-yellow mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-blue-200 font-bold max-w-2xl mx-auto">3 chặng thi trực tuyến để tìm ra những ngôi sao chuyển đổi số xuất sắc nhất</p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-10">
              {changs.map((ct, idx) => {
                const active = isActive(ct);
                const upcoming = isUpcoming(ct);
                const past = !active && !upcoming;
                return (
                  <div
                    key={ct.id}
                    className={`group relative p-1 rounded-[2.5rem] transition-all duration-500 hover:scale-[1.03] ${
                      active ? 'bg-gradient-to-br from-brand-yellow to-orange-500 shadow-3xl shadow-yellow-500/20' : 'bg-slate-800'
                    }`}
                  >
                    <div className={`h-full rounded-[2.3rem] p-10 ${active ? 'bg-white' : 'bg-slate-900 border border-slate-800'}`}>
                      <div className="flex justify-between items-start mb-8">
                        <span className={`text-5xl font-black ${active ? 'text-brand-blue' : 'text-slate-700'}`}>0{idx + 1}</span>
                        {active && (
                          <span className="bg-green-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full animate-pulse uppercase tracking-widest">
                            Đang mở
                          </span>
                        )}
                        {past && <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Đã đóng</span>}
                        {upcoming && <span className="text-brand-yellow text-[10px] font-black uppercase tracking-widest">Sắp tới</span>}
                      </div>

                      <h3 className={`text-2xl font-black mb-6 uppercase tracking-tight ${active ? 'text-brand-blue' : 'text-white'}`}>{ct.ten}</h3>
                      
                      <div className={`space-y-4 mb-10 text-base font-bold ${active ? 'text-slate-600' : 'text-slate-400'}`}>
                        <div className="flex items-center gap-4">
                          <Calendar className={`w-5 h-5 flex-shrink-0 ${active ? 'text-brand-blue' : 'text-brand-yellow'}`} />
                          <span>{formatDateTime(ct.bat_dau)}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Clock className={`w-5 h-5 flex-shrink-0 ${active ? 'text-brand-blue' : 'text-brand-yellow'}`} />
                          <span> {ct.thoi_gian_phut} phút làm bài</span>
                        </div>
                      </div>

                      {active && (
                        <button
                          onClick={() => navigate('/thi')}
                          className="w-full btn-primary text-xl py-5 shadow-xl shadow-yellow-500/20"
                        >
                          Thi ngay <ChevronRight className="w-6 h-6" />
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
      <footer className="bg-white border-t border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-16">
            <div className="flex items-center gap-8">
              <img src={LOGO_URL} alt="Logo" className="h-24 w-auto" />
              <div className="text-left">
                <p className="text-2xl font-black text-brand-blue uppercase tracking-tight">Thành Đoàn Hải Phòng</p>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">BCH Đoàn TNCS Hồ Chí Minh TP. Hải Phòng</p>
              </div>
            </div>
            
            <div className="text-center md:text-right space-y-3">
              <p className="text-brand-blue text-xl font-bold italic">"Tuổi trẻ Hải Phòng xung kích vì tương lai số"</p>
              <div className="text-sm text-slate-500 font-bold">
                <p>Địa chỉ: Lô 26A Lê Hồng Phong, Phường Gia Viên, TP. Hải Phòng</p>
                <p>Hotline hỗ trợ: 0921.545.555</p>
              </div>
            </div>
          </div>
          <div className="mt-16 pt-10 border-t border-slate-100 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            © 2026 Cuộc thi Chuyển đổi số, Chuyển đổi xanh. Bản quyền thuộc về Thành đoàn Hải Phòng.
          </div>
        </div>
      </footer>
    </div>
  );
}
