import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  getThongKe, getAllCuocThi, addCuocThi, updateCuocThi, deleteCuocThi,
  getCauHoiByCuocThi, addCauHoi, updateCauHoi, deleteCauHoi, bulkInsertCauHoi,
  getDonViList, addDonVi, bulkInsertDonVi, updateDonVi, deleteDonVi,
  getAllThiSinh, bulkInsertThiSinh, deleteThiSinh,
  getKetQuaAdmin, getCanhBaoGianLan,
  getTrangChuAdmin, updateTrangChu,
  type CuocThi, type CauHoi, type DonVi, type TrangChu
} from '@/lib/db';
import {
  BarChart3, LayoutDashboard, Database, HelpCircle, Users, Trophy, LogOut, Plus, Pencil, Trash2,
  Upload, Search, ChevronRight, FileSpreadsheet, ShieldAlert, AlertTriangle, Building2, Menu, X, CheckCircle, Zap, Loader2, Cpu, Award, Globe, Image, Facebook
} from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = "https://doantruong.chuyennguyentrai.edu.vn/wp-content/uploads/2025/12/Huy_Hieu_Doan.png";

type Tab = 'dashboard' | 'cuoc-thi' | 'cau-hoi' | 'don-vi' | 'thi-sinh' | 'ket-qua' | 'gian-lan' | 'trang-chu';

export default function TrangAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile

  // Data states
  const [thongKe, setThongKe] = useState({ tongThiSinh: 0, tongLuotThi: 0, diemTrungBinh: 0 });
  const [cuocs, setCuocs] = useState<CuocThi[]>([]);
  const [cauHois, setCauHois] = useState<CauHoi[]>([]);
  const [donVis, setDonVis] = useState<DonVi[]>([]);
  const [thiSinhs, setThiSinhs] = useState<any[]>([]);
  const [ketQuas, setKetQuas] = useState<any[]>([]);
  const [gianLanLogs, setGianLanLogs] = useState<any[]>([]);
  const [trangChu, setTrangChu] = useState<TrangChu | null>(null);

  // Selection
  const [selectedCuocThiId, setSelectedCuocThiId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Shared Preview Modal state (lifted to root to avoid overflow clipping)
  type PreviewCol = { header: string; key: string; type: 'text' | 'select'; options?: { value: string; label: string }[] };
  const [previewState, setPreviewState] = useState<{
    open: boolean;
    title: string;
    columns: PreviewCol[];
    data: Record<string, string>[];
    onConfirm: (data: Record<string, string>[]) => void;
  }>({ open: false, title: '', columns: [], data: [], onConfirm: () => { } });

  useEffect(() => {
    refreshData();
  }, [activeTab, selectedCuocThiId]);

  // Load cuoc_thi when entering tabs that need it
  useEffect(() => {
    if (['cau-hoi', 'ket-qua', 'gian-lan'].includes(activeTab)) {
      getAllCuocThi().then(data => {
        setCuocs(data);
        // Auto-select first cuoc_thi if none selected
        if (!selectedCuocThiId && data.length > 0) {
          setSelectedCuocThiId(data[0].id);
        }
      });
    }
  }, [activeTab]);

  const refreshData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') setThongKe(await getThongKe());
      if (activeTab === 'cuoc-thi') setCuocs(await getAllCuocThi());
      if (activeTab === 'don-vi') setDonVis(await getDonViList());
      if (activeTab === 'thi-sinh') setThiSinhs(await getAllThiSinh());
      if (activeTab === 'ket-qua') setKetQuas(await getKetQuaAdmin(selectedCuocThiId || undefined));
      if (activeTab === 'gian-lan') setGianLanLogs(await getCanhBaoGianLan(selectedCuocThiId || undefined));
      if (activeTab === 'cau-hoi' && selectedCuocThiId) setCauHois(await getCauHoiByCuocThi(selectedCuocThiId));
      if (activeTab === 'trang-chu') setTrangChu(await getTrangChuAdmin());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'cuoc-thi', label: 'Cuộc thi', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'cau-hoi', label: 'Câu hỏi', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'don-vi', label: 'Đơn vị', icon: <Building2 className="w-5 h-5" /> },
    { id: 'thi-sinh', label: 'Thí sinh', icon: <Users className="w-5 h-5" /> },
    { id: 'ket-qua', label: 'Kết quả', icon: <Trophy className="w-5 h-5" /> },
    { id: 'gian-lan', label: 'Gian lận', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'trang-chu', label: 'Trang chủ', icon: <Globe className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-ui relative">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-brand-dark/50 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-brand-blue text-white transition-all duration-500 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col shadow-2xl`}>
        <div className="p-4 lg:p-6 flex items-center gap-3 lg:gap-4 border-b border-white/10">
          <img src={LOGO_URL} alt="Logo" className="h-10 lg:h-12 w-auto drop-shadow-lg flex-shrink-0" />
          <div className="border-l-2 border-white/20 pl-3 lg:pl-4 min-w-0">
            <p className="text-[10px] sm:text-[11px] lg:text-[13px] font-black text-white uppercase tracking-[0.05em] leading-tight font-ui truncate">Đoàn TNCS Hồ Chí Minh</p>
            <p className="text-[10px] lg:text-[11px] font-semibold text-white/60 leading-tight font-ui mt-0.5 hidden sm:block">Thành Đoàn Hải Phòng</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-3 mt-10 overflow-y-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-ui font-bold text-sm ${activeTab === t.id
                  ? 'bg-brand-yellow text-brand-blue shadow-[0_10px_20px_rgba(250,189,50,0.2)] scale-105'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
            >
              {t.icon}
              {t.label}
              {activeTab === t.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse"></div>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10 bg-brand-blue/30 backdrop-blur-md">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-ui font-semibold hover:bg-brand-red hover:border-brand-red transition-all"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-brand-blue hover:bg-slate-100 rounded-xl transition-colors">
              <Menu />
            </button>
            <h2 className="text-xl font-ui font-black text-brand-blue">
              {TABS.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {activeTab === 'cau-hoi' || activeTab === 'ket-qua' || activeTab === 'gian-lan' ? (
              <select
                className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-blue focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none transition-all font-ui"
                value={selectedCuocThiId || ''}
                onChange={e => setSelectedCuocThiId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Tất cả cuộc thi</option>
                {cuocs.map(c => <option key={c.id} value={c.id}>{c.ten.toUpperCase()}</option>)}
              </select>
            ) : null}

            <div className="h-10 w-10 rounded-xl bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center text-brand-blue">
              <Cpu size={20} className="animate-pulse" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 circuit-pattern">
          <div className="max-w-7xl mx-auto pb-12">
            {loading && activeTab !== 'dashboard' ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6">
                <Loader2 className="w-16 h-16 text-brand-blue animate-spin" />
                <p className="text-slate-400 font-ui font-semibold text-sm">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <>
                {/* ─── TAB: DASHBOARD ─── */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="card-tech bg-white p-8 group">
                        <div className="flex justify-between items-start mb-6">
                          <Users className="w-12 h-12 text-brand-blue group-hover:scale-110 transition-transform" />
                          <div className="bg-brand-blue/5 p-2 rounded-xl text-[10px] font-black text-brand-blue uppercase tracking-widest">User Base</div>
                        </div>
                        <h3 className="text-xs font-bold text-slate-400 mb-2 font-ui">Tổng số thí sinh</h3>
                        <p className="text-5xl font-tech font-black text-brand-blue">{thongKe.tongThiSinh}</p>
                        <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-blue w-2/3 shadow-[0_0_10px_rgba(30,69,159,0.3)]"></div>
                        </div>
                      </div>
                      <div className="card-tech bg-white p-8 group">
                        <div className="flex justify-between items-start mb-6">
                          <Zap className="w-12 h-12 text-brand-yellow group-hover:scale-110 transition-transform" />
                          <div className="bg-brand-yellow/5 p-2 rounded-xl text-[10px] font-black text-brand-yellow uppercase tracking-widest">Active Hits</div>
                        </div>
                        <h3 className="text-xs font-bold text-slate-400 mb-2 font-ui">Tổng lượt dự thi</h3>
                        <p className="text-5xl font-tech font-black text-brand-blue">{thongKe.tongLuotThi}</p>
                        <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-yellow w-1/2 shadow-[0_0_10px_rgba(250,189,50,0.3)]"></div>
                        </div>
                      </div>
                      <div className="card-tech bg-white p-8 group">
                        <div className="flex justify-between items-start mb-6">
                          <Award className="w-12 h-12 text-brand-red group-hover:scale-110 transition-transform" />
                          <div className="bg-brand-red/5 p-2 rounded-xl text-[10px] font-black text-brand-red uppercase tracking-widest">Avg Score</div>
                        </div>
                        <h3 className="text-xs font-bold text-slate-400 mb-2 font-ui">Điểm trung bình</h3>
                        <p className="text-5xl font-tech font-black text-brand-blue">{thongKe.diemTrungBinh.toFixed(1)}</p>
                        <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-red w-3/4 shadow-[0_0_10px_rgba(207,42,42,0.3)]"></div>
                        </div>
                      </div>
                    </div>

                    <div className="card-tech bg-white p-10">
                      <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-ui font-black text-brand-blue">Hành động nhanh</h3>
                        <Zap size={24} className="text-brand-yellow fill-current" />
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { label: 'Thêm Cuộc thi', tab: 'cuoc-thi', icon: <BarChart3 /> },
                          { label: 'Quản lý Thí sinh', tab: 'thi-sinh', icon: <Users /> },
                          { label: 'Xem Kết quả', tab: 'ket-qua', icon: <Trophy /> },
                          { label: 'Cảnh báo Gian lận', tab: 'gian-lan', icon: <ShieldAlert /> },
                        ].map((btn, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveTab(btn.tab as Tab)}
                            className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-slate-50 border-2 border-slate-100 hover:border-brand-blue hover:bg-white transition-all group"
                          >
                            <div className="p-4 bg-white rounded-2xl shadow-sm text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all">
                              {btn.icon}
                            </div>
                            <span className="text-sm font-semibold text-slate-500 group-hover:text-brand-blue font-ui">{btn.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Các Tab khác hiển thị bảng dữ liệu */}
                {activeTab !== 'dashboard' && (
                  <div className="card-tech bg-white p-2 md:p-6 overflow-hidden animate-in slide-in-from-bottom duration-500">
                    {activeTab === 'cuoc-thi' && <CuocThiManager cuocs={cuocs} refresh={refreshData} />}
                    {activeTab === 'cau-hoi' && <CauHoiManager cuocThiId={selectedCuocThiId} cauHois={cauHois} refresh={refreshData} setPreviewState={setPreviewState} />}
                    {activeTab === 'don-vi' && <DonViManager donVis={donVis} refresh={refreshData} setPreviewState={setPreviewState} />}
                    {activeTab === 'thi-sinh' && <ThiSinhManager thiSinhs={thiSinhs} refresh={refreshData} />}
                    {activeTab === 'ket-qua' && <KetQuaManager ketQuas={ketQuas} cuocs={cuocs} />}
                    {activeTab === 'gian-lan' && <GianLanManager logs={gianLanLogs} cuocs={cuocs} />}
                    {activeTab === 'trang-chu' && <TrangChuManager trangChu={trangChu} onSaved={refreshData} />}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Shared Preview Modal - rendered at root level to avoid overflow clipping */}
      {previewState.open && (
        <PreviewModal
          title={previewState.title}
          columns={previewState.columns}
          data={previewState.data}
          onChange={(data) => setPreviewState(prev => ({ ...prev, data }))}
          onConfirm={previewState.onConfirm}
          onCancel={() => setPreviewState(prev => ({ ...prev, open: false }))}
        />
      )}
    </div>
  );
}

// ─── TIMEZONE HELPERS (UTC+7 — Asia/Ho_Chi_Minh) ───
const VN_TZ = 'Asia/Ho_Chi_Minh';

/** Format a UTC timestamp for display in Vietnam time */
const fmtVN = (utcStr: string) =>
  new Date(utcStr).toLocaleString('vi-VN', { timeZone: VN_TZ });

/** Convert a UTC timestamp from DB into "YYYY-MM-DDTHH:mm" for datetime-local input */
const toInputVN = (utcStr: string): string => {
  const d = new Date(utcStr);
  const offset = 7 * 60 * 60 * 1000;
  const vnDate = new Date(d.getTime() + offset);
  return vnDate.toISOString().slice(0, 16);
};

/** Convert datetime-local value (Vietnam time) to ISO string with +07:00 for DB */
const fromInputVN = (local: string): string => local + ':00+07:00';

// ─── PHỤ LỤC CÁC MANAGER COMPONENTS ───

function CuocThiManager({ cuocs, refresh }: { cuocs: CuocThi[], refresh: () => void }) {
  const [editing, setEditing] = useState<CuocThi | null>(null);
  const [form, setForm] = useState({
    ten: '', mo_ta: '', anh_banner: '',
    bat_dau: '', ket_thuc: '',
    so_cau_hoi: 10, thoi_gian_lam_phut: 15,
    gioi_han_luot: 3, gioi_han_gian_lan: 3,
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ ten: '', mo_ta: '', anh_banner: '', bat_dau: '', ket_thuc: '', so_cau_hoi: 10, thoi_gian_lam_phut: 15, gioi_han_luot: 3, gioi_han_gian_lan: 3 });
  };

  const handleAdd = async () => {
    if (!form.ten || !form.bat_dau || !form.ket_thuc) return toast.error('Vui lòng nhập đủ thông tin.');
    await addCuocThi({
      ten: form.ten,
      mo_ta: form.mo_ta,
      anh_banner: form.anh_banner,
      bat_dau: fromInputVN(form.bat_dau),
      ket_thuc: fromInputVN(form.ket_thuc),
      so_cau_hoi: Number(form.so_cau_hoi),
      thoi_gian_lam_phut: Number(form.thoi_gian_lam_phut),
      gioi_han_luot: Number(form.gioi_han_luot),
      gioi_han_gian_lan: Number(form.gioi_han_gian_lan),
    });
    resetForm(); refresh(); toast.success('Đã thêm cuộc thi.');
  };

  const handleUpdate = async () => {
    if (!editing) return;
    await updateCuocThi(editing.id, {
      ten: form.ten,
      mo_ta: form.mo_ta,
      anh_banner: form.anh_banner,
      bat_dau: fromInputVN(form.bat_dau),
      ket_thuc: fromInputVN(form.ket_thuc),
      so_cau_hoi: Number(form.so_cau_hoi),
      thoi_gian_lam_phut: Number(form.thoi_gian_lam_phut),
      gioi_han_luot: Number(form.gioi_han_luot),
      gioi_han_gian_lan: Number(form.gioi_han_gian_lan),
    });
    resetForm(); refresh(); toast.success('Cập nhật thành công.');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa cuộc thi này sẽ xóa toàn bộ câu hỏi và kết quả liên quan. Bạn chắc chắn?')) return;
    await deleteCuocThi(id); refresh();
  };

  return (
    <div className="space-y-8 p-4">
      <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
        <h4 className="text-sm font-bold text-brand-blue mb-5 font-ui">
          {editing ? `Đang chỉnh sửa: ${editing.ten}` : 'Thêm cuộc thi mới'}
        </h4>
        <div className="space-y-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Tên cuộc thi</label>
              <input className="input-admin-tech w-full" placeholder="Vd: Cuộc thi Chuyển đổi số lần 1" value={form.ten} onChange={e => setForm({ ...form, ten: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Ảnh bìa (URL)</label>
              <input className="input-admin-tech w-full" placeholder="https://..." value={form.anh_banner} onChange={e => setForm({ ...form, anh_banner: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Mô tả</label>
            <textarea className="input-admin-tech w-full" rows={2} placeholder="Mô tả cuộc thi..." value={form.mo_ta} onChange={e => setForm({ ...form, mo_ta: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Bắt đầu</label>
              <input className="input-admin-tech w-full" type="datetime-local" value={form.bat_dau} onChange={e => setForm({ ...form, bat_dau: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Kết thúc</label>
              <input className="input-admin-tech w-full" type="datetime-local" value={form.ket_thuc} onChange={e => setForm({ ...form, ket_thuc: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Số câu hỏi</label>
              <input className="input-admin-tech w-full" type="number" min={1} max={100} value={form.so_cau_hoi} onChange={e => setForm({ ...form, so_cau_hoi: parseInt(e.target.value) || 10 })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Thời gian làm (phút)</label>
              <input className="input-admin-tech w-full" type="number" min={1} max={180} value={form.thoi_gian_lam_phut} onChange={e => setForm({ ...form, thoi_gian_lam_phut: parseInt(e.target.value) || 15 })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Số lượt thi tối đa</label>
              <input className="input-admin-tech w-full" type="number" min={1} max={20} value={form.gioi_han_luot} onChange={e => setForm({ ...form, gioi_han_luot: parseInt(e.target.value) || 3 })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Số lần thoát màn hình</label>
              <input className="input-admin-tech w-full" type="number" min={1} max={10} value={form.gioi_han_gian_lan} onChange={e => setForm({ ...form, gioi_han_gian_lan: parseInt(e.target.value) || 3 })} />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={editing ? handleUpdate : handleAdd} className="bg-brand-blue text-white font-ui font-bold text-sm px-6 py-3 rounded-xl hover:bg-brand-blue/90 transition-all">
            {editing ? 'Cập nhật cuộc thi' : 'Thêm cuộc thi'}
          </button>
          {editing && (
            <button onClick={resetForm} className="bg-slate-100 text-slate-600 font-ui font-semibold text-sm px-6 py-3 rounded-xl hover:bg-slate-200 transition-all">
              Hủy
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-left text-sm font-ui">
          <thead className="bg-slate-50 text-xs font-bold text-slate-500">
            <tr>
              <th className="px-5 py-4">Tên cuộc thi</th>
              <th className="px-5 py-4">Bắt đầu</th>
              <th className="px-5 py-4">Kết thúc</th>
              <th className="px-5 py-4 text-center">Câu/Lượt</th>
              <th className="px-5 py-4 text-center">Thời gian</th>
              <th className="px-5 py-4 text-center">Lần thoát</th>
              <th className="px-5 py-4">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cuocs.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="text-brand-blue font-bold">{c.ten}</div>
                  {c.mo_ta && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{c.mo_ta}</div>}
                </td>
                <td className="px-5 py-4 text-slate-500">{fmtVN(c.bat_dau)}</td>
                <td className="px-5 py-4 text-slate-500">{fmtVN(c.ket_thuc)}</td>
                <td className="px-5 py-4 text-center">
                  <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue text-xs font-bold rounded-lg">{c.so_cau_hoi} câu</span>
                  <span className="ml-1 px-2 py-1 bg-brand-yellow/20 text-brand-yellow text-xs font-bold rounded-lg">{c.gioi_han_luot} lượt</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">{c.thoi_gian_lam_phut} phút</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg">{c.gioi_han_gian_lan} lần</span>
                </td>
                <td className="px-5 py-4 space-x-1">
                  <button onClick={() => { setEditing(c); setForm({ ten: c.ten, mo_ta: c.mo_ta || '', anh_banner: c.anh_banner || '', bat_dau: toInputVN(c.bat_dau), ket_thuc: toInputVN(c.ket_thuc), so_cau_hoi: c.so_cau_hoi, thoi_gian_lam_phut: c.thoi_gian_lam_phut, gioi_han_luot: c.gioi_han_luot, gioi_han_gian_lan: c.gioi_han_gian_lan }); }} className="p-2 text-brand-blue hover:bg-blue-50 rounded-lg"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-brand-red hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CauHoiManager({ cuocThiId, cauHois, refresh, setPreviewState }: { cuocThiId: number | null, cauHois: CauHoi[], refresh: () => void, setPreviewState: any }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchText, setSearchText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ noi_dung: '', dap_an_a: '', dap_an_b: '', dap_an_c: '', dap_an_d: '', dap_an_dung: 'A', active: true });
  const [savingEdit, setSavingEdit] = useState(false);

  const filteredCauHois = cauHois.filter(q =>
    q.noi_dung.toLowerCase().includes(searchText.toLowerCase())
  );

  const startEdit = (q: CauHoi) => {
    setEditingId(q.id);
    setEditForm({
      noi_dung: q.noi_dung,
      dap_an_a: q.dap_an_a,
      dap_an_b: q.dap_an_b,
      dap_an_c: q.dap_an_c,
      dap_an_d: q.dap_an_d,
      dap_an_dung: q.dap_an_dung?.toUpperCase() || 'A',
      active: q.active,
    });
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async () => {
    if (!editForm.noi_dung.trim() || !editForm.dap_an_a.trim() || !editForm.dap_an_b.trim() || !editForm.dap_an_c.trim() || !editForm.dap_an_d.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setSavingEdit(true);
    try {
      await updateCauHoi(editingId!, {
        noi_dung: editForm.noi_dung.trim(),
        dap_an_a: editForm.dap_an_a.trim(),
        dap_an_b: editForm.dap_an_b.trim(),
        dap_an_c: editForm.dap_an_c.trim(),
        dap_an_d: editForm.dap_an_d.trim(),
        dap_an_dung: editForm.dap_an_dung.toUpperCase(),
        active: editForm.active,
      });
      toast.success('Đã cập nhật câu hỏi!');
      setEditingId(null);
      refresh();
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi lưu.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    try {
      await deleteCauHoi(id);
      toast.success('Đã xóa câu hỏi.');
      refresh();
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi xóa.');
    }
  };

  const downloadTemplate = () => {
    const sample = [
      { 'Câu hỏi': 'Chuyển đổi số là gì?', 'A': 'Ứng dụng công nghệ số', 'B': 'In tài liệu', 'C': 'Họp trực tiếp', 'D': 'Viết tay', 'Đáp án đúng': 'A' },
      { 'Câu hỏi': 'Câu hỏi mẫu 2?', 'A': 'Đáp án A', 'B': 'Đáp án B', 'C': 'Đáp án C', 'D': 'Đáp án D', 'Đáp án đúng': 'B' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CauHoi');
    XLSX.writeFile(wb, 'mau_cau_hoi.xlsx');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!cuocThiId) return toast.error('Chọn cuộc thi để import.');
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(ws);
      const clean = data
        .filter(r => r['Câu hỏi'] && r['A'] && r['B'] && r['C'] && r['D'] && r['Đáp án đúng'])
        .map(r => ({
          cuoc_thi_id: String(cuocThiId),
          noi_dung: String(r['Câu hỏi']),
          dap_an_a: String(r['A']),
          dap_an_b: String(r['B']),
          dap_an_c: String(r['C']),
          dap_an_d: String(r['D']),
          dap_an_dung: String(r['Đáp án đúng']).toUpperCase().trim(),
          active: 'true',
        }));
      if (clean.length === 0) {
        toast.error('Không tìm thấy dữ liệu hợp lệ. Kiểm tra lại file mẫu.');
        return;
      }
      setPreviewState({
        open: true,
        title: 'Xem trước import câu hỏi',
        columns: [
          { header: 'Câu hỏi', key: 'noi_dung', type: 'text' },
          { header: 'A', key: 'dap_an_a', type: 'text' },
          { header: 'B', key: 'dap_an_b', type: 'text' },
          { header: 'C', key: 'dap_an_c', type: 'text' },
          { header: 'D', key: 'dap_an_d', type: 'text' },
          {
            header: 'Đáp án', key: 'dap_an_dung', type: 'select', options: [
              { value: 'A', label: 'A' },
              { value: 'B', label: 'B' },
              { value: 'C', label: 'C' },
              { value: 'D', label: 'D' },
            ]
          },
        ],
        data: clean,
        onConfirm: async (editedData) => {
          const toInsert = editedData.map(r => ({
            cuoc_thi_id: Number(r.cuoc_thi_id),
            noi_dung: r.noi_dung,
            dap_an_a: r.dap_an_a,
            dap_an_b: r.dap_an_b,
            dap_an_c: r.dap_an_c,
            dap_an_d: r.dap_an_d,
            dap_an_dung: r.dap_an_dung,
            active: true,
          }));
          await bulkInsertCauHoi(toInsert);
          setPreviewState(prev => ({ ...prev, open: false }));
          refresh();
          toast.success(`Đã import ${toInsert.length} câu hỏi thành công.`);
        },
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const inputCls = "w-full border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none font-ui";

  return (
    <div className="p-4 space-y-6">
      {!cuocThiId ? (
        <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-ui font-semibold">Vui lòng chọn cuộc thi ở trên để quản lý câu hỏi.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
            <div>
              <h4 className="text-sm font-bold text-brand-blue font-ui">Ngân hàng câu hỏi</h4>
              <p className="text-xs text-slate-500 font-ui mt-1">Hiện có <strong>{cauHois.length}</strong> câu hỏi trong cuộc thi này.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={downloadTemplate} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 font-ui font-semibold text-sm px-4 py-2.5 rounded-xl hover:border-brand-blue hover:text-brand-blue transition-all">
                <FileSpreadsheet size={15} /> Tải file mẫu
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleImport} accept=".xlsx,.xls" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-brand-blue text-white font-ui font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-brand-blue/90 transition-all">
                <FileSpreadsheet size={15} /> Import Excel
              </button>
            </div>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-ui focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none"
            />
          </div>

          {searchText && (
            <p className="text-xs text-slate-400 font-ui">
              Tìm thấy {filteredCauHois.length} / {cauHois.length} câu hỏi
            </p>
          )}

          <div className="space-y-3">
            {(searchText ? filteredCauHois : cauHois).map((q, idx) => (
              <div key={q.id} className="p-5 bg-white border border-slate-100 rounded-2xl hover:shadow-sm transition-all group">
                {editingId === q.id ? (
                  /* ── Edit Form ── */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-ui">Câu hỏi</label>
                      <input value={editForm.noi_dung} onChange={e => setEditForm(f => ({ ...f, noi_dung: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-ui">A</label><input value={editForm.dap_an_a} onChange={e => setEditForm(f => ({ ...f, dap_an_a: e.target.value }))} className={inputCls} /></div>
                      <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-ui">B</label><input value={editForm.dap_an_b} onChange={e => setEditForm(f => ({ ...f, dap_an_b: e.target.value }))} className={inputCls} /></div>
                      <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-ui">C</label><input value={editForm.dap_an_c} onChange={e => setEditForm(f => ({ ...f, dap_an_c: e.target.value }))} className={inputCls} /></div>
                      <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-ui">D</label><input value={editForm.dap_an_d} onChange={e => setEditForm(f => ({ ...f, dap_an_d: e.target.value }))} className={inputCls} /></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-ui">Đáp án đúng</label>
                        <select value={editForm.dap_an_dung} onChange={e => setEditForm(f => ({ ...f, dap_an_dung: e.target.value }))} className={inputCls}>
                          <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-ui">Trạng thái</label>
                        <select value={editForm.active ? '1' : '0'} onChange={e => setEditForm(f => ({ ...f, active: e.target.value === '1' }))} className={inputCls}>
                          <option value="1">Hiệu lực</option><option value="0">Không hiệu lực</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button onClick={cancelEdit} className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all font-ui">Hủy</button>
                      <button onClick={saveEdit} disabled={savingEdit} className="px-5 py-2.5 bg-brand-blue text-white font-bold text-sm rounded-xl hover:bg-brand-blue/90 transition-all font-ui disabled:opacity-50 flex items-center gap-2">
                        {savingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                        Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View Mode ── */
                  <div className="flex gap-4">
                    <span className="font-tech font-black text-brand-blue/20 text-2xl flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-slate-800 mb-3 font-ui">{q.noi_dung}</p>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4">
                          <button onClick={() => startEdit(q)} className="p-1.5 text-slate-400 hover:text-brand-blue bg-slate-100 hover:bg-brand-blue/10 rounded-lg transition-all" title="Sửa"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(q.id)} className="p-1.5 text-slate-400 hover:text-brand-red bg-slate-100 hover:bg-brand-red/10 rounded-lg transition-all" title="Xóa"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-ui">
                        {['a', 'b', 'c', 'd'].map(k => {
                          const isCorrect = q.dap_an_dung?.toUpperCase() === k.toUpperCase();
                          return (
                            <div key={k} className={`px-3 py-2 rounded-xl border font-semibold ${isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                              {k.toUpperCase()}. {String(q[`dap_an_${k}` as keyof CauHoi])}
                            </div>
                          );
                        })}
                      </div>
                      {!q.active && <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest text-brand-red bg-brand-red/10 px-2 py-1 rounded">Không hiệu lực</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {searchText && filteredCauHois.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-ui">Không tìm thấy câu hỏi nào.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── SHARED PREVIEW MODAL ───────────────────────────────────────────────────────

type ColText = { header: string; key: string; type: 'text' };
type ColSelect = { header: string; key: string; type: 'select'; options?: { value: string; label: string }[] };
type ColType = ColText | ColSelect;

function PreviewModal({
  title,
  columns,
  data,
  onChange,
  onConfirm,
  onCancel,
}: {
  title: string;
  columns: ColType[];
  data: Record<string, string>[];
  onChange: (data: Record<string, string>[]) => void;
  onConfirm: (data: Record<string, string>[]) => void;
  onCancel: () => void;
}) {
  const updateCell = (rowIdx: number, key: string, value: string) => {
    const updated = data.map((row, i) => i === rowIdx ? { ...row, [key]: value } : row);
    onChange(updated);
  };

  const removeRow = (rowIdx: number) => {
    onChange(data.filter((_, i) => i !== rowIdx));
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-7xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-black text-brand-blue font-ui">{title}</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 font-ui mt-0.5">{data.length} dòng sẽ được import</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Table section title */}
        <div className="px-4 sm:px-6 pt-2 pb-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue"></div>
            <h4 className="text-[11px] sm:text-xs font-black text-slate-400 uppercase tracking-widest font-ui">Bảng dữ liệu</h4>
          </div>
        </div>

        {/* Table wrapper - scrollable */}
        <div className="flex-1 overflow-auto min-h-0 px-3 sm:px-4 pb-3">
          <div className="overflow-x-auto min-w-full rounded-xl border border-slate-100">
            <table className="w-full text-[11px] sm:text-sm font-ui border-collapse">
              <thead className="sticky top-0 z-10 bg-brand-blue text-white shadow-lg">
                <tr>
                  <th className="px-3 py-3 text-left text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-tl-xl w-10">#</th>
                  {columns.map(col => (
                    <th key={col.key} className="px-3 py-3 text-left text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap min-w-[120px]">{col.header}</th>
                  ))}
                  <th className="w-10 rounded-tr-xl"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-2.5 text-slate-400 font-bold text-[10px] sm:text-xs bg-slate-50/50">{rowIdx + 1}</td>
                    {columns.map(col => (
                      <td key={col.key} className="px-3 py-2 min-w-[120px]">
                        {col.type === 'text' ? (
                          <input
                            type="text"
                            value={row[col.key] ?? ''}
                            onChange={e => updateCell(rowIdx, col.key, e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 outline-none text-slate-700 font-medium text-[11px] sm:text-sm shadow-sm"
                          />
                        ) : (
                          <select
                            value={row[col.key] ?? ''}
                            onChange={e => updateCell(rowIdx, col.key, e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 outline-none text-slate-700 font-medium text-[11px] sm:text-sm shadow-sm"
                          >
                            {col.options.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => removeRow(rowIdx)}
                        className="p-1.5 text-slate-300 hover:text-brand-red hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length === 0 && (
              <p className="text-center text-slate-400 py-16 font-ui text-sm">Không có dữ liệu nào.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-ui font-semibold text-sm hover:bg-slate-200 transition-all">
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirm(data)}
            disabled={data.length === 0}
            className="px-6 py-2.5 rounded-xl bg-brand-blue text-white font-ui font-semibold text-sm hover:bg-brand-blue/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-blue/20"
          >
            Xác nhận import ({data.length})
          </button>
        </div>
      </div>
    </div>
  );

  return modalContent;
}

function DonViManager({ donVis, refresh, setPreviewState }: { donVis: DonVi[], refresh: () => void, setPreviewState: any }) {
  const [tenChiDoan, setTenChiDoan] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search state
  const [searchText, setSearchText] = useState('');

  // Filtered data — search by chi doan name (lop field contains the chi doan name)
  const filteredDonVis = donVis.filter(dv => {
    const matchSearch = dv.lop.toLowerCase().includes(searchText.toLowerCase()) ||
      dv.ten.toLowerCase().includes(searchText.toLowerCase());
    return matchSearch;
  });

  const handleAdd = async () => {
    if (!tenChiDoan.trim()) return;
    // ten = school name (fixed), lop = chi doan name
    await addDonVi('Trường THPT Chuyên Nguyễn Trãi', tenChiDoan.trim());
    setTenChiDoan(''); refresh();
    toast.success('Đã thêm chi đoàn.');
  };

  const downloadTemplate = () => {
    const sample = [
      { 'Tên chi đoàn': 'Chi đoàn 10A1' },
      { 'Tên chi đoàn': 'Chi đoàn 10A2' },
      { 'Tên chi đoàn': 'Chi đoàn 11A1' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DonVi');
    XLSX.writeFile(wb, 'mau_chi_doan.xlsx');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(ws);
      const valid = data.filter(r => r['Tên chi đoàn']);
      if (valid.length === 0) {
        toast.error('Không tìm thấy dữ liệu hợp lệ. Kiểm tra lại file mẫu.');
        return;
      }
      const items = valid.map(r => ({
        ten: 'Trường THPT Chuyên Nguyễn Trãi',
        lop: String(r['Tên chi đoàn']).trim(),
      }));
      setPreviewState({
        open: true,
        title: 'Xem trước import chi đoàn',
        columns: [
          { header: 'Tên chi đoàn', key: 'lop', type: 'text' },
        ],
        data: items.map(r => ({ lop: r.lop })),
        onConfirm: async (editedData) => {
          const finalItems = editedData.map(r => ({ ten: 'Trường THPT Chuyên Nguyễn Trãi', lop: r.lop }));
          await bulkInsertDonVi(finalItems);
          setPreviewState(prev => ({ ...prev, open: false }));
          refresh();
          toast.success(`Đã import ${finalItems.length} chi đoàn thành công.`);
        },
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-4 space-y-6">

      {/* Thêm 1 chi đoàn */}
      <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
        <h4 className="text-sm font-bold text-brand-blue font-ui mb-4">Thêm chi đoàn</h4>
        <div className="flex gap-3">
          <input
            className="input-admin-tech flex-1"
            placeholder="Nhập tên chi đoàn (VD: Chi đoàn 10A1)..."
            value={tenChiDoan}
            onChange={e => setTenChiDoan(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button onClick={handleAdd} className="bg-brand-blue text-white font-ui font-semibold text-sm px-6 py-3 rounded-xl hover:bg-brand-blue/90 transition-all whitespace-nowrap">
            Thêm
          </button>
        </div>
      </div>

      {/* Import hàng loạt */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h4 className="text-sm font-bold text-slate-700 font-ui mb-3">Import hàng loạt từ Excel</h4>
        <div className="flex flex-wrap gap-3">
          <button onClick={downloadTemplate} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 font-ui font-semibold text-sm px-4 py-2.5 rounded-xl hover:border-brand-blue hover:text-brand-blue transition-all">
            <FileSpreadsheet size={15} /> Tải file mẫu
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleImport} accept=".xlsx,.xls" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-brand-blue text-white font-ui font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-brand-blue/90 transition-all">
            <FileSpreadsheet size={15} /> Import Excel
          </button>
        </div>
        <p className="text-xs text-slate-400 font-ui mt-3">File mẫu gồm cột: <strong>Tên chi đoàn</strong></p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-100">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên chi đoàn..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-ui focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none"
          />
        </div>
      </div>

      {/* Danh sách */}
      {filteredDonVis.length === 0 ? (
        <div className="text-center py-12 text-slate-400 font-ui">
          {searchText ? 'Không tìm thấy chi đoàn phù hợp.' : 'Chưa có chi đoàn nào.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {filteredDonVis.map(dv => (
            <div key={dv.id} className="p-4 bg-white border border-slate-100 rounded-xl flex justify-between items-center group hover:border-brand-blue/30 transition-all">
              <span className="font-semibold text-slate-700 text-sm font-ui">{dv.lop}</span>
              <button onClick={() => deleteDonVi(dv.id).then(refresh)} className="p-1.5 text-slate-300 hover:text-brand-red transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {searchText && (
        <p className="text-xs text-slate-400 font-ui">
          Hiển thị {filteredDonVis.length} / {donVis.length} chi đoàn
        </p>
      )}
    </div>
  );
}

function ThiSinhManager({ thiSinhs, refresh }: { thiSinhs: any[], refresh: () => void }) {
  const [searchText, setSearchText] = useState('');

  const filteredThiSinhs = thiSinhs.filter(ts =>
    ts.ho_ten.toLowerCase().includes(searchText.toLowerCase()) ||
    ts.so_dien_thoai.includes(searchText) ||
    ts.don_vi?.ten.toLowerCase().includes(searchText.toLowerCase()) ||
    (ts.ten_lop && ts.ten_lop.toLowerCase().includes(searchText.toLowerCase()))
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa thí sinh này?')) return;
    await deleteThiSinh(id);
    refresh();
    toast.success('Đã xóa thí sinh.');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo tên, SĐT hoặc đơn vị..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-ui focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none"
        />
      </div>

      {/* Summary */}
      {searchText && (
        <p className="text-xs text-slate-400 font-ui">
          Tìm thấy {filteredThiSinhs.length} / {thiSinhs.length} thí sinh
        </p>
      )}

      <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
        <table className="w-full text-left text-sm font-bold">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="px-6 py-4">Họ tên</th><th className="px-6 py-4">SĐT</th><th className="px-6 py-4">Đơn vị</th><th className="px-6 py-4">Lớp</th><th className="px-6 py-4">Ngày tạo</th><th className="px-6 py-4"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(searchText ? filteredThiSinhs : thiSinhs).map(ts => (
              <tr key={ts.id} className="hover:bg-slate-50 group">
                <td className="px-6 py-4 text-brand-blue font-black">{ts.ho_ten}</td>
                <td className="px-6 py-4 text-slate-500">{ts.so_dien_thoai}</td>
                <td className="px-6 py-4 font-black">{ts.don_vi?.ten}</td>
                <td className="px-6 py-4 text-slate-600 font-ui">{ts.ten_lop || '-'}</td>
                <td className="px-6 py-4 text-slate-400">{new Date(ts.created_at).toLocaleDateString('vi-VN', { timeZone: VN_TZ })}</td>
                <td className="px-6 py-4">
                  <button onClick={() => handleDelete(ts.id)} className="p-2 text-slate-300 hover:text-brand-red hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(searchText ? filteredThiSinhs : thiSinhs).length === 0 && (
          <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-ui">Không tìm thấy thí sinh nào.</td></tr>
        )}
      </div>
    </div>
  );
}

function KetQuaManager({ ketQuas, cuocs }: { ketQuas: any[]; cuocs: CuocThi[] }) {
  const [sortBy, setSortBy] = useState<'diem' | 'time'>('diem');
  const [searchText, setSearchText] = useState('');
  const [selectedCuocThiId, setSelectedCuocThiId] = useState<number | null>(null);

  // Group by thi_sinh_id, keep highest score + count attempts
  const groupedMap = new Map<number, { best: any; attempts: number; cuoc_thi_id: number }>();
  for (const r of ketQuas) {
    const key = r.thi_sinh_id;
    const existing = groupedMap.get(key);
    if (!existing || r.diem > existing.best.diem) {
      groupedMap.set(key, { best: r, attempts: existing ? existing.attempts + 1 : 1, cuoc_thi_id: r.cuoc_thi_id });
    } else {
      existing.attempts++;
    }
  }

  const allRows = Array.from(groupedMap.values());

  // Filter
  const filtered = allRows.filter(({ best }) => {
    const matchSearch = !searchText ||
      best.thi_sinh?.ho_ten?.toLowerCase().includes(searchText.toLowerCase()) ||
      best.thi_sinh?.so_dien_thoai?.includes(searchText) ||
      best.thi_sinh?.don_vi?.ten?.toLowerCase().includes(searchText.toLowerCase());
    const matchCuoc = !selectedCuocThiId || best.cuoc_thi_id === selectedCuocThiId;
    return matchSearch && matchCuoc;
  });

  // Sort
  const sortedRows = [...filtered].sort((a, b) => {
    if (sortBy === 'diem') {
      if (b.best.diem !== a.best.diem) return b.best.diem - a.best.diem;
      return a.best.thoi_gian_lam - b.best.thoi_gian_lam;
    }
    return a.best.thoi_gian_lam - b.best.thoi_gian_lam;
  });

  const exportExcel = () => {
    const data = sortedRows.map((row, i) => ({
      'Hạng': i + 1,
      'Họ tên': row.best.thi_sinh?.ho_ten,
      'SĐT': row.best.thi_sinh?.so_dien_thoai,
      'Đơn vị': row.best.thi_sinh?.don_vi?.ten,
      'Lớp': row.best.thi_sinh?.ten_lop,
      'Cuộc thi': row.best.cuoc_thi?.ten,
      'Điểm cao nhất': row.best.diem,
      'Số lượt': row.attempts,
      'Thời gian (giây)': row.best.thoi_gian_lam,
      'Ngày thi': new Date(row.best.created_at).toLocaleString('vi-VN', { timeZone: VN_TZ })
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KetQua");
    XLSX.writeFile(wb, "KetQua_Thi_ChuyenDoiSo.xlsx");
  };

  const formatThoiGian = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  };

  return (
    <div className="p-4 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-blue/5 p-8 rounded-3xl">
        <div>
          <h4 className="text-sm font-bold text-brand-blue font-ui">Bảng xếp hạng</h4>
          <p className="text-xs text-slate-500 font-ui mt-1">
            {searchText || selectedCuocThiId ? `Tìm thấy ${sortedRows.length} kết quả` : `Tổng ${allRows.length} thí sinh`}
            {sortBy === 'diem' ? ' — Ưu tiên điểm cao nhất, nếu bằng thì xét thời gian' : ' — Ít thời gian hơn = xếp trên'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, đơn vị..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-ui text-slate-700 focus:ring-2 focus:ring-brand-blue/10 outline-none"
            />
          </div>
          <select
            value={selectedCuocThiId ?? ''}
            onChange={e => setSelectedCuocThiId(e.target.value ? Number(e.target.value) : null)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-ui font-semibold text-brand-blue focus:ring-2 focus:ring-brand-blue/10 outline-none"
          >
            <option value="">Tất cả cuộc thi</option>
            {cuocs.map(c => <option key={c.id} value={c.id}>{c.ten}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'diem' | 'time')}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-ui font-semibold text-brand-blue focus:ring-2 focus:ring-brand-blue/10 outline-none"
          >
            <option value="diem">Theo điểm</option>
            <option value="time">Theo thời gian</option>
          </select>
          <button onClick={exportExcel} className="flex items-center gap-2 bg-brand-yellow text-brand-blue font-ui font-bold text-sm px-6 py-2 rounded-xl hover:bg-brand-yellow/90 transition-all">
            <FileSpreadsheet size={16} /> Xuất Excel
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
        <table className="w-full text-left text-sm font-bold">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="px-6 py-4">Hạng</th><th className="px-6 py-4">Họ tên</th><th className="px-6 py-4">Đơn vị</th><th className="px-6 py-4">Lớp</th><th className="px-6 py-4">Điểm cao nhất</th><th className="px-6 py-4">Số lượt</th><th className="px-6 py-4">Thời gian</th><th className="px-6 py-4">Cuộc thi</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedRows.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-400 font-ui">Chưa có kết quả thi nào.</td></tr>
            ) : sortedRows.map((row, i) => (
              <tr key={row.best.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4"><span className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${i < 3 ? 'bg-brand-yellow text-brand-blue' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</span></td>
                <td className="px-6 py-4"><div className="text-brand-blue font-black uppercase">{row.best.thi_sinh?.ho_ten}</div><div className="text-[10px] text-slate-400">{row.best.thi_sinh?.so_dien_thoai}</div></td>
                <td className="px-6 py-4 font-black">{row.best.thi_sinh?.don_vi?.ten}</td>
                <td className="px-6 py-4 text-slate-600 font-ui">{row.best.thi_sinh?.ten_lop || '-'}</td>
                <td className="px-6 py-4 text-xl font-tech font-black text-brand-blue">{row.best.diem}</td>
                <td className="px-6 py-4"><span className="px-3 py-1 bg-brand-blue/5 text-brand-blue text-[10px] rounded-lg border border-brand-blue/10 font-bold">{row.attempts}</span></td>
                <td className="px-6 py-4 text-slate-400 font-tech">{formatThoiGian(row.best.thoi_gian_lam)}</td>
                <td className="px-6 py-4"><span className="px-3 py-1 bg-brand-blue/5 text-brand-blue text-[10px] rounded-lg border border-brand-blue/10">{row.best.cuoc_thi?.ten}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GianLanManager({ logs, cuocs }: { logs: any[]; cuocs: CuocThi[] }) {
  const [selectedCuocThiId, setSelectedCuocThiId] = useState<number | null>(null);

  const filteredLogs = selectedCuocThiId
    ? logs.filter(l => l.cuoc_thi_id === selectedCuocThiId)
    : logs;

  return (
    <div className="p-4 space-y-8">
      {/* Filter bar */}
      <div className="flex items-center gap-4 bg-brand-red/5 p-6 rounded-3xl border border-brand-red/10">
        <ShieldAlert className="text-brand-red w-8 h-8 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-bold text-brand-red font-ui">Giám sát gian lận</h4>
          <p className="text-xs text-brand-red/60 font-ui mt-0.5">Phát hiện hoạt động bất thường: chuyển tab, thu nhỏ trình duyệt. Giới hạn thoát màn hình được cấu hình trong từng cuộc thi.</p>
        </div>
        <select
          value={selectedCuocThiId ?? ""}
          onChange={e => setSelectedCuocThiId(e.target.value ? Number(e.target.value) : null)}
          className="bg-white border-2 border-brand-red/20 rounded-xl px-4 py-2.5 text-sm font-semibold font-ui text-brand-red focus:ring-2 focus:ring-brand-red/10 outline-none min-w-[200px]"
        >
          <option value="">Tất cả cuộc thi</option>
          {cuocs.map(c => <option key={c.id} value={c.id}>{c.ten}</option>)}
        </select>
      </div>

      {/* logs table */}
      <div className="overflow-x-auto rounded-[2rem] border border-brand-red/10">
        <table className="w-full text-left text-sm font-bold">
          <thead className="bg-brand-red/5 text-[10px] font-black text-brand-red uppercase tracking-widest">
            <tr><th className="px-6 py-4">Thí sinh</th><th className="px-6 py-4">Cuộc thi</th><th className="px-6 py-4">Số lần vi phạm</th><th className="px-6 py-4">Lần cuối</th></tr>
          </thead>
          <tbody className="divide-y divide-brand-red/5">
            {filteredLogs.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-ui">Chưa có cảnh báo gian lận nào.</td></tr>
            ) : filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-brand-red/5 transition-colors">
                <td className="px-6 py-4"><div className="font-black text-slate-800 uppercase">{log.thi_sinh?.ho_ten}</div><div className="text-[10px] text-slate-400">{log.thi_sinh?.so_dien_thoai} • {log.thi_sinh?.don_vi?.ten} • {log.thi_sinh?.ten_lop}</div></td>
                <td className="px-6 py-4 text-brand-blue font-black">{log.cuoc_thi?.ten}</td>
                <td className="px-6 py-4"><span className="px-4 py-1.5 bg-brand-red text-white text-lg font-tech font-black rounded-xl shadow-lg shadow-brand-red/20">{log.so_lan}</span></td>
                <td className="px-6 py-4 text-slate-400 text-xs">{new Date(log.lan_cuoi).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TrangChu Manager ──────────────────────────────────────────────────────────
function TrangChuManager({ trangChu, onSaved }: { trangChu: TrangChu | null; onSaved: () => void }) {
  const [tieuDe, setTieuDe] = useState(trangChu?.tieu_de ?? '');
  const [moTa, setMoTa] = useState(trangChu?.mo_ta ?? '');
  const [anhNen, setAnhNen] = useState(trangChu?.anh_nen ?? '');
  const [duongDanFanpage, setDuongDanFanpage] = useState(trangChu?.duong_dan_fanpage ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (trangChu) {
      setTieuDe(trangChu.tieu_de ?? '');
      setMoTa(trangChu.mo_ta ?? '');
      setAnhNen(trangChu.anh_nen ?? '');
      setDuongDanFanpage(trangChu.duong_dan_fanpage ?? '');
    }
  }, [trangChu]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTrangChu({
        tieu_de: tieuDe,
        mo_ta: moTa,
        anh_nen: anhNen,
        duong_dan_fanpage: duongDanFanpage,
      });
      toast.success('Đã lưu cấu hình trang chủ!');
      onSaved(); // Trigger parent to refetch so state stays in sync
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi lưu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-brand-blue font-ui">Cấu hình trang chủ</h2>
          <p className="text-slate-400 text-sm font-ui mt-1">Nội dung này hiển thị ở phần Hero đầu trang.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-blue text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-brand-blue/90 transition-all font-ui disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Lưu thay đổi
        </button>
      </div>

      {anhNen && (
        <div className="rounded-2xl overflow-hidden h-40 relative">
          <img src={anhNen} alt="Banner preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
          <p className="absolute bottom-3 left-4 text-white text-sm font-ui font-bold">Xem trước ảnh nền Hero</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
        <div className="p-6">
          <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2 font-ui">
            Tiêu đề Hero
          </label>
          <p className="text-slate-400 text-xs mb-3 font-ui">VD: "Hệ thống thi trực tuyến"</p>
          <input
            type="text"
            value={tieuDe}
            onChange={e => setTieuDe(e.target.value)}
            placeholder="Nhập tiêu đề hiển thị trên Hero..."
            className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none font-ui"
          />
        </div>

        <div className="p-6">
          <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2 font-ui">
            Mô tả Hero
          </label>
          <p className="text-slate-400 text-xs mb-3 font-ui">VD: "Nền tảng thi trắc nghiệm dành cho học sinh THPT Chuyên Nguyễn Trãi"</p>
          <textarea
            value={moTa}
            onChange={e => setMoTa(e.target.value)}
            placeholder="Nhập mô tả ngắn hiển thị trên Hero..."
            rows={3}
            className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none font-ui resize-none"
          />
        </div>

        <div className="p-6">
          <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest mb-2 font-ui">
            <Image className="w-4 h-4" /> Ảnh nền Hero
          </label>
          <p className="text-slate-400 text-xs mb-3 font-ui">URL ảnh nền cho phần Hero. Để trống = dùng gradient xanh mặc định.</p>
          <input
            type="url"
            value={anhNen}
            onChange={e => setAnhNen(e.target.value)}
            placeholder="https://..."
            className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none font-ui"
          />
          {anhNen && (
            <div className="mt-3 rounded-xl overflow-hidden h-24">
              <img src={anhNen} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="p-6">
          <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest mb-2 font-ui">
            <Facebook className="w-4 h-4" /> Link Fanpage
          </label>
          <p className="text-slate-400 text-xs mb-3 font-ui">Link Facebook Fanpage của Đoàn trường.</p>
          <input
            type="url"
            value={duongDanFanpage}
            onChange={e => setDuongDanFanpage(e.target.value)}
            placeholder="https://www.facebook.com/..."
            className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none font-ui"
          />
        </div>
      </div>
    </div>
  );
}
