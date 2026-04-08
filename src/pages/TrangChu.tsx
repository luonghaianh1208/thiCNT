import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCuocThiPublic, getTrangChu, type CuocThi, type TrangChu } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, ChevronRight, Users, MapPin, Facebook, Menu, X, Loader2, PlayCircle } from 'lucide-react';

const LOGO_DOAN = "https://doantruong.chuyennguyentrai.edu.vn/wp-content/uploads/2025/12/Huy_Hieu_Doan.png";
const LOGO_TRUONG = "https://doantruong.chuyennguyentrai.edu.vn/wp-content/uploads/2026/02/Logo-CNT.png";
const DEFAULT_BANNER = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1400&h=500&fit=crop";

const SCHOOL_NAME = "Đoàn TNCS Hồ Chí Minh – THPT Chuyên Nguyễn Trãi";
const SCHOOL_ADDRESS = "Đường Nguyễn Văn Linh, P. Lê Thanh Nghị, TP. Hải Phòng";
const FANPAGE_URL = "https://www.facebook.com/doantruongthptchuyennguyentrai";

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

function isActive(ct: CuocThi) {
  const now = new Date();
  return now >= new Date(ct.bat_dau) && now <= new Date(ct.ket_thuc);
}

function isUpcoming(ct: CuocThi) {
  return new Date() < new Date(ct.bat_dau);
}

function getCuocThiStatus(ct: CuocThi) {
  const now = new Date();
  if (now < new Date(ct.bat_dau)) return 'upcoming';
  if (now <= new Date(ct.ket_thuc)) return 'active';
  return 'ended';
}

function CuocThiCard({ ct, onJoin }: { ct: CuocThi; onJoin: () => void }) {
  const status = getCuocThiStatus(ct);

  return (
    <div className="card-tech bg-white flex flex-col group">
      {/* Banner */}
      {ct.anh_banner && (
        <div className="relative h-40 -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-2xl">
          <img src={ct.anh_banner} alt={ct.ten} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      {/* Status badge */}
      <div className="flex justify-between items-start mb-4">
        <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full font-ui
          ${status === 'active' ? 'bg-emerald-500 text-white' :
            status === 'upcoming' ? 'bg-brand-blue text-white' :
            'bg-slate-200 text-slate-500'}`}>
          {status === 'active' ? 'Đang mở' : status === 'upcoming' ? 'Sắp diễn ra' : 'Đã kết thúc'}
        </span>
        <span className="text-slate-300 text-xs font-ui font-bold">#{ct.id}</span>
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-black text-brand-blue mb-2 font-ui leading-snug group-hover:text-brand-red transition-colors">
        {ct.ten}
      </h3>
      {ct.mo_ta && (
        <p className="text-slate-500 text-sm font-medium font-ui mb-5 line-clamp-2 flex-1">
          {ct.mo_ta}
        </p>
      )}

      {/* Info */}
      <div className="space-y-2.5 mb-6">
        <div className="flex items-center gap-2.5 text-slate-400 text-xs font-semibold font-ui">
          <Calendar className="w-3.5 h-3.5 text-brand-yellow flex-shrink-0" />
          <span>{formatDateTime(ct.bat_dau)}</span>
        </div>
        <div className="flex items-center gap-2.5 text-slate-400 text-xs font-semibold font-ui">
          <Clock className="w-3.5 h-3.5 text-brand-yellow flex-shrink-0" />
          <span>{ct.thoi_gian_lam_phut} phút · {ct.so_cau_hoi} câu</span>
        </div>
        <div className="flex items-center gap-2.5 text-slate-400 text-xs font-semibold font-ui">
          <Users className="w-3.5 h-3.5 text-brand-yellow flex-shrink-0" />
          <span>Tối đa {ct.gioi_han_luot} lượt thi</span>
        </div>
      </div>

      {/* CTA */}
      {status === 'active' && (
        <button
          onClick={onJoin}
          className="w-full bg-brand-blue text-white font-bold text-sm py-3.5 rounded-xl hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-2 group/btn font-ui mt-auto"
        >
          <PlayCircle className="w-4 h-4" />
          Tham gia thi
          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      )}
      {status === 'upcoming' && (
        <div className="w-full text-center text-slate-400 text-xs font-bold py-3.5 font-ui uppercase tracking-widest mt-auto">
          Chưa mở đăng ký
        </div>
      )}
    </div>
  );
}

export default function TrangChu() {
  const navigate = useNavigate();
  const [trangChu, setTrangChu] = useState<TrangChu | null>(null);
  const [cuocs, setCuocs] = useState<CuocThi[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    Promise.all([getTrangChu(), getAllCuocThiPublic()])
      .then(([tc, cc]) => {
        setTrangChu(tc);
        setCuocs(cc);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Realtime subscription — cập nhật ngay khi admin thay đổi hero
    const channel = supabase
      .channel('trang_chu_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trang_chu' }, (payload) => {
        if (payload.new) {
          setTrangChu(payload.new as TrangChu);
        }
      })
      .subscribe();

    // Realtime subscription cho cuộc thi — cập nhật khi admin thêm/sửa/xóa cuộc thi
    const channel2 = supabase
      .channel('cuoc_thi_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cuoc_thi' }, async () => {
        // Refetch all competitions
        const cc = await getAllCuocThiPublic();
        setCuocs(cc);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(channel2);
    };
  }, []);

  const heroTitle = trangChu?.tieu_de?.trim() || 'Hệ thống thi trực tuyến';
  const heroDesc = trangChu?.mo_ta?.trim() || 'Nền tảng thi trắc nghiệm dành cho học sinh THPT Chuyên Nguyễn Trãi';
  const heroBg = trangChu?.anh_nen?.trim() || '';
  const heroFanpage = trangChu?.duong_dan_fanpage?.trim() || FANPAGE_URL;

  const activeCuocs = cuocs.filter(isActive);
  const upcomingCuocs = cuocs.filter(isUpcoming);
  const endedCuocs = cuocs.filter(c => getCuocThiStatus(c) === 'ended');

  const displayCuocs = [...activeCuocs, ...upcomingCuocs];

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* ─── Sticky Header ─── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-brand-blue/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-20 items-center">
            {/* Dual Logos */}
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <img src={LOGO_DOAN} alt="Logo Đoàn" className="h-12 w-auto" />
              <img src={LOGO_TRUONG} alt="Logo Trường" className="h-12 w-auto" />
              <div className="border-l-2 border-brand-blue/20 pl-3">
                <p className="text-xs font-black text-brand-blue uppercase tracking-wide leading-tight font-ui hidden sm:block">
                  {SCHOOL_NAME}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight font-ui hidden md:block">
                  Hải Phòng
                </p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <a
                href={heroFanpage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-500 hover:text-brand-blue text-sm font-bold font-ui transition-colors"
              >
                <Facebook className="w-4 h-4" />
                <span>Fanpage</span>
              </a>
              {activeCuocs.length > 0 && (
                <button
                  onClick={() => navigate('/thi')}
                  className="flex items-center gap-2 bg-brand-blue text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-blue/90 transition-all font-ui shadow-lg shadow-brand-blue/20"
                >
                  <PlayCircle className="w-4 h-4" />
                  Vào thi ngay
                </button>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-brand-blue p-2 hover:bg-brand-blue/5 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-brand-blue/10 px-4 py-6 space-y-4 animate-in slide-in-from-top duration-200">
            <a
              href={heroFanpage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-slate-600 hover:text-brand-blue text-base font-bold font-ui transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Facebook className="w-5 h-5" />
              Fanpage Đoàn trường
            </a>
            <div className="border-t border-slate-100 pt-4">
              {activeCuocs.length > 0 && (
                <button
                  onClick={() => { navigate('/thi'); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white font-bold text-base py-3.5 rounded-xl font-ui"
                >
                  <PlayCircle className="w-5 h-5" />
                  Vào thi ngay
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero Section ─── */}
      <section
        className="relative py-20 md:py-28 overflow-hidden"
        style={
          heroBg
            ? { backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(135deg, #1E459F 0%, #0F172A 60%, #1E459F 100%)' }
        }
      >
        {/* Overlay when bg image is set */}
        {heroBg && <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />}

        {/* Circuit pattern overlay */}
        <div className="absolute inset-0 circuit-pattern opacity-10 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Top decorative line */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12 bg-white/30" />
            <img src={LOGO_DOAN} alt="" className="h-10 w-auto opacity-80" />
            <div className="h-px w-12 bg-white/30" />
          </div>

          {/* Hero Title */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.15] font-ui drop-shadow-2xl"
            style={{ textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
          >
            {heroTitle}
          </h1>

          {/* Hero Description */}
          {heroDesc && (
            <p className="text-base sm:text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto font-medium leading-relaxed font-ui">
              {heroDesc}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {activeCuocs.length > 0 ? (
              <>
                <button
                  onClick={() => navigate('/thi')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-yellow text-brand-dark font-black text-base px-10 py-4 rounded-2xl hover:bg-yellow-400 transition-all shadow-xl shadow-brand-yellow/30 font-ui"
                >
                  <PlayCircle className="w-5 h-5" />
                  Vào thi ngay
                </button>
                <a
                  href={heroFanpage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-white/30 text-white font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/10 transition-all font-ui"
                >
                  <Facebook className="w-5 h-5" />
                  Fanpage
                </a>
              </>
            ) : upcomingCuocs.length > 0 ? (
              <>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur text-white font-bold text-base px-8 py-4 rounded-2xl font-ui">
                  <Clock className="w-5 h-5 text-brand-yellow" />
                  {upcomingCuocs.length} cuộc thi sắp diễn ra
                </div>
                <a
                  href={heroFanpage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-white/30 text-white font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/10 transition-all font-ui"
                >
                  <Facebook className="w-5 h-5" />
                  Fanpage
                </a>
              </>
            ) : (
              <a
                href={heroFanpage}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-white/30 text-white font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/10 transition-all font-ui"
              >
                <Facebook className="w-5 h-5" />
                Fanpage Đoàn trường
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ─── Competitions Grid ─── */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-brand-blue font-ui">Cuộc thi</h2>
              <div className="w-12 h-1 bg-brand-yellow mt-2 rounded-full" />
            </div>
            {cuocs.length > 0 && (
              <span className="text-slate-400 text-sm font-bold font-ui hidden sm:block">
                {activeCuocs.length > 0 ? `${activeCuocs.length} đang mở · ` : ''}{upcomingCuocs.length > 0 ? `${upcomingCuocs.length} sắp diễn ra` : endedCuocs.length > 0 ? `${endedCuocs.length} đã kết thúc` : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
            </div>
          ) : displayCuocs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold text-base font-ui">Chưa có cuộc thi nào.</p>
              <p className="text-slate-300 text-sm font-ui mt-1">Hãy quay lại sau!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayCuocs.map((ct) => (
                <CuocThiCard
                  key={ct.id}
                  ct={ct}
                  onJoin={() => navigate(`/thi?changId=${ct.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Left: Logos + School */}
            <div className="flex items-center gap-4">
              <img src={LOGO_DOAN} alt="Logo Đoàn" className="h-10 w-auto" />
              <img src={LOGO_TRUONG} alt="Logo Trường" className="h-10 w-auto" />
              <div className="border-l-2 border-slate-200 pl-4">
                <p className="text-sm font-black text-brand-blue font-ui leading-tight">{SCHOOL_NAME}</p>
                <a
                  href={heroFanpage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-slate-400 hover:text-brand-blue text-xs font-bold font-ui mt-0.5 transition-colors"
                >
                  <Facebook className="w-3 h-3" />
                  Fanpage
                </a>
              </div>
            </div>

            {/* Right: Address */}
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium font-ui">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-brand-yellow" />
              <span>{SCHOOL_ADDRESS}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-300 font-ui">
              © {new Date().getFullYear()} {SCHOOL_NAME}. Bảo lưu mọi quyền.
            </p>
            <button
              onClick={() => navigate('/admin/login')}
              className="text-xs text-slate-300 hover:text-slate-500 transition-colors font-ui"
            >
              Quản trị hệ thống
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
