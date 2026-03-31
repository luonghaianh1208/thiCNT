import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  getThongKe, getAllChangThi, addChangThi, updateChangThi, deleteChangThi,
  getCauHoiByChang, addCauHoi, updateCauHoi, deleteCauHoi, bulkInsertCauHoi,
  getDonViList, addDonVi, updateDonVi, deleteDonVi,
  getAllThiSinh, bulkInsertThiSinh,
  getKetQuaAdmin, getCanhBaoGianLan,
  type ChangThi, type CauHoi, type DonVi
} from '@/lib/db';
import { 
  BarChart3, LayoutDashboard, Database, HelpCircle, Users, Trophy, LogOut, Plus, Pencil, Trash2, 
  Upload, Search, ChevronRight, FileSpreadsheet, ShieldAlert, AlertTriangle, Building2, Menu, X, CheckCircle, Zap, Loader2, Cpu, Award
} from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = "https://doantruong.chuyennguyentrai.edu.vn/wp-content/uploads/2025/12/Huy_Hieu_Doan.png";

type Tab = 'dashboard' | 'chang-thi' | 'cau-hoi' | 'don-vi' | 'thi-sinh' | 'ket-qua' | 'gian-lan';

export default function TrangAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile

  // Data states
  const [thongKe, setThongKe] = useState({ tongThiSinh: 0, tongLuotThi: 0, diemTrungBinh: 0 });
  const [changs, setChangs] = useState<ChangThi[]>([]);
  const [cauHois, setCauHois] = useState<CauHoi[]>([]);
  const [donVis, setDonVis] = useState<DonVi[]>([]);
  const [thiSinhs, setThiSinhs] = useState<any[]>([]);
  const [ketQuas, setKetQuas] = useState<any[]>([]);
  const [giantLanLogs, setGianLanLogs] = useState<any[]>([]);
  
  // Selection
  const [selectedChangId, setSelectedChangId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshData();
  }, [activeTab, selectedChangId]);

  const refreshData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') setThongKe(await getThongKe());
      if (activeTab === 'chang-thi') setChangs(await getAllChangThi());
      if (activeTab === 'don-vi') setDonVis(await getDonViList());
      if (activeTab === 'thi-sinh') setThiSinhs(await getAllThiSinh());
      if (activeTab === 'ket-qua') setKetQuas(await getKetQuaAdmin(selectedChangId || undefined));
      if (activeTab === 'gian-lan') setGianLanLogs(await getCanhBaoGianLan(selectedChangId || undefined));
      if (activeTab === 'cau-hoi' && selectedChangId) setCauHois(await getCauHoiByChang(selectedChangId));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'chang-thi', label: 'Chặng thi', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'cau-hoi', label: 'Câu hỏi', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'don-vi', label: 'Đơn vị', icon: <Building2 className="w-5 h-5" /> },
    { id: 'thi-sinh', label: 'Thí sinh', icon: <Users className="w-5 h-5" /> },
    { id: 'ket-qua', label: 'Kết quả', icon: <Trophy className="w-5 h-5" /> },
    { id: 'gian-lan', label: 'Gian lận', icon: <ShieldAlert className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-ui">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-brand-dark/50 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-brand-blue text-white transition-all duration-500 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col shadow-2xl`}>
        <div className="p-6 flex items-center gap-4 border-b border-white/10">
          <img src={LOGO_URL} alt="Logo" className="h-12 w-auto drop-shadow-lg" />
          <div className="border-l-2 border-white/20 pl-4 whitespace-nowrap">
            <p className="text-[13px] font-black text-white uppercase tracking-[0.1em] leading-tight font-ui">Đoàn TNCS Hồ Chí Minh</p>
            <p className="text-[11px] font-semibold text-white/60 leading-tight font-ui mt-0.5">Thành Đoàn Hải Phòng</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-3 mt-10 overflow-y-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); if(window.innerWidth < 1024) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-ui font-bold text-sm ${
                activeTab === t.id 
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
                value={selectedChangId || ''}
                onChange={e => setSelectedChangId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Tất cả chặng thi</option>
                {changs.map(c => <option key={c.id} value={c.id}>{c.ten.toUpperCase()}</option>)}
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
                          { label: 'Thêm Chặng', tab: 'chang-thi', icon: <BarChart3 /> },
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
                    {activeTab === 'chang-thi' && <ChangManager changs={changs} refresh={refreshData} />}
                    {activeTab === 'cau-hoi' && <CauHoiManager changId={selectedChangId} cauHois={cauHois} refresh={refreshData} />}
                    {activeTab === 'don-vi' && <DonViManager donVis={donVis} refresh={refreshData} />}
                    {activeTab === 'thi-sinh' && <ThiSinhManager thiSinhs={thiSinhs} refresh={refreshData} />}
                    {activeTab === 'ket-qua' && <KetQuaManager ketQuas={ketQuas} />}
                    {activeTab === 'gian-lan' && <GianLanManager logs={giantLanLogs} />}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
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

// ─── PHỤ LỤC CÁC MANAGER COMPONENTS (Rút gọn cho Dashboard Tech) ───

function ChangManager({ changs, refresh }: { changs: ChangThi[], refresh: () => void }) {
  const [editing, setEditing] = useState<ChangThi | null>(null);
  const [form, setForm] = useState({ ten: '', bat_dau: '', ket_thuc: '', thoi_gian_phut: 25, so_cau: 30 });

  const resetForm = () => {
    setEditing(null);
    setForm({ ten: '', bat_dau: '', ket_thuc: '', thoi_gian_phut: 25, so_cau: 30 });
  };

  const handleAdd = async () => {
    if (!form.ten || !form.bat_dau || !form.ket_thuc) return toast.error('Vui lòng nhập đủ thông tin.');
    await addChangThi({
      ten: form.ten,
      bat_dau: fromInputVN(form.bat_dau),
      ket_thuc: fromInputVN(form.ket_thuc),
      thoi_gian_phut: Number(form.thoi_gian_phut),
      so_cau: Number(form.so_cau),
    });
    resetForm(); refresh(); toast.success('Đã thêm chặng thi.');
  };

  const handleUpdate = async () => {
    if (!editing) return;
    await updateChangThi(editing.id, {
      ten: form.ten,
      bat_dau: fromInputVN(form.bat_dau),
      ket_thuc: fromInputVN(form.ket_thuc),
      thoi_gian_phut: Number(form.thoi_gian_phut),
      so_cau: Number(form.so_cau),
    });
    resetForm(); refresh(); toast.success('Cập nhật thành công.');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa chặng thi này sẽ xóa toàn bộ câu hỏi và kết quả liên quan. Bạn chắc chắn?')) return;
    await deleteChangThi(id); refresh();
  };

  return (
    <div className="space-y-8 p-4">
      <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
        <h4 className="text-sm font-bold text-brand-blue mb-5 font-ui">
          {editing ? `Đang chỉnh sửa: ${editing.ten}` : 'Thêm chặng thi mới'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Tên chặng</label>
            <input className="input-admin-tech w-full" placeholder="Vd: Chặng 1" value={form.ten} onChange={e => setForm({...form, ten: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Thời gian bắt đầu</label>
            <input className="input-admin-tech w-full" type="datetime-local" value={form.bat_dau} onChange={e => setForm({...form, bat_dau: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Thời gian kết thúc</label>
            <input className="input-admin-tech w-full" type="datetime-local" value={form.ket_thuc} onChange={e => setForm({...form, ket_thuc: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Số câu hỏi mỗi bài thi</label>
            <input className="input-admin-tech w-full" type="number" min={1} max={100} placeholder="30" value={form.so_cau} onChange={e => setForm({...form, so_cau: parseInt(e.target.value) || 30})} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 font-ui mb-1 block">Thời lượng làm bài (phút)</label>
            <input className="input-admin-tech w-full" type="number" min={1} max={180} placeholder="25" value={form.thoi_gian_phut} onChange={e => setForm({...form, thoi_gian_phut: parseInt(e.target.value) || 25})} />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={editing ? handleUpdate : handleAdd} className="bg-brand-blue text-white font-ui font-bold text-sm px-6 py-3 rounded-xl hover:bg-brand-blue/90 transition-all">
            {editing ? 'Cập nhật chặng' : 'Thêm chặng thi'}
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
              <th className="px-5 py-4">Tên chặng</th>
              <th className="px-5 py-4">Bắt đầu</th>
              <th className="px-5 py-4">Kết thúc</th>
              <th className="px-5 py-4 text-center">Số câu</th>
              <th className="px-5 py-4 text-center">Thời gian</th>
              <th className="px-5 py-4">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {changs.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 text-brand-blue font-bold">{c.ten}</td>
                <td className="px-5 py-4 text-slate-500">{fmtVN(c.bat_dau)}</td>
                <td className="px-5 py-4 text-slate-500">{fmtVN(c.ket_thuc)}</td>
                <td className="px-5 py-4 text-center">
                  <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue text-xs font-bold rounded-lg">{c.so_cau} câu</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">{c.thoi_gian_phut} phút</span>
                </td>
                <td className="px-5 py-4 space-x-1">
                  <button onClick={() => { setEditing(c); setForm({ ten: c.ten, bat_dau: toInputVN(c.bat_dau), ket_thuc: toInputVN(c.ket_thuc), thoi_gian_phut: c.thoi_gian_phut, so_cau: c.so_cau }); }} className="p-2 text-brand-blue hover:bg-blue-50 rounded-lg"><Pencil size={15}/></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-brand-red hover:bg-red-50 rounded-lg"><Trash2 size={15}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CauHoiManager({ changId, cauHois, refresh }: { changId: number | null, cauHois: CauHoi[], refresh: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const sample = [
      { 'Câu hỏi': 'Chuyển đổi số là gì?', 'A': 'Ứng dụng công nghệ số', 'B': 'In tài liệu', 'C': 'Họp trực tiếp', 'D': 'Viết tay', 'Đáp án đúng': 'A', 'Giải thích': 'Chuyển đổi số là ứng dụng công nghệ số vào mọi mặt.' },
      { 'Câu hỏi': 'Câu hỏi mẫu 2?', 'A': 'Đáp án A', 'B': 'Đáp án B', 'C': 'Đáp án C', 'D': 'Đáp án D', 'Đáp án đúng': 'B', 'Giải thích': '' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CauHoi');
    XLSX.writeFile(wb, 'mau_cau_hoi.xlsx');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!changId) return toast.error('Chọn chặng thi để import.');
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(ws);
      const clean = data
        .filter(r => r['Câu hỏi'] && r['A'] && r['B'] && r['C'] && r['D'] && r['Đáp án đúng'])
        .map(r => ({
          chang_id: changId,
          noi_dung: String(r['Câu hỏi']),
          dap_an_a: String(r['A']),
          dap_an_b: String(r['B']),
          dap_an_c: String(r['C']),
          dap_an_d: String(r['D']),
          dap_an_dung: String(r['Đáp án đúng']).toUpperCase().trim(),
          active: true,
        }));
      if (clean.length === 0) return toast.error('Không tìm thấy dữ liệu hợp lệ. Kiểm tra lại file mẫu.');
      await bulkInsertCauHoi(clean);
      if (fileInputRef.current) fileInputRef.current.value = '';
      refresh(); toast.success(`Đã import ${clean.length} câu hỏi thành công.`);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-4 space-y-6">
      {!changId ? (
        <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-ui font-semibold">Vui lòng chọn chặng thi ở trên để quản lý câu hỏi.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
            <div>
              <h4 className="text-sm font-bold text-brand-blue font-ui">Ngân hàng câu hỏi</h4>
              <p className="text-xs text-slate-500 font-ui mt-1">Hiện có <strong>{cauHois.length}</strong> câu hỏi trong chặng này.</p>
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
          <div className="space-y-3">
            {cauHois.map((q, idx) => (
              <div key={q.id} className="p-5 bg-white border border-slate-100 rounded-2xl hover:shadow-sm transition-all">
                <div className="flex gap-4">
                  <span className="font-tech font-black text-brand-blue/20 text-2xl flex-shrink-0">{String(idx+1).padStart(2,'0')}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 mb-3 font-ui">{q.noi_dung}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-ui">
                      {['a','b','c','d'].map(k => {
                        const isCorrect = q.dap_an_dung.toUpperCase() === k.toUpperCase();
                        return (
                          <div key={k} className={`px-3 py-2 rounded-xl border font-semibold ${isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                            {k.toUpperCase()}. {String(q[`dap_an_${k}` as keyof CauHoi])}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const LOAI_DON_VI = [
  { value: 'phuong', label: 'Phường' },
  { value: 'xa', label: 'Xã' },
  { value: 'dac_khu', label: 'Đặc khu' },
];

function DonViManager({ donVis, refresh }: { donVis: DonVi[], refresh: () => void }) {
  const [ten, setTen] = useState('');
  const [loai, setLoai] = useState('phuong');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!ten.trim()) return;
    await addDonVi(ten.trim(), loai);
    setTen(''); refresh();
    toast.success('Đã thêm đơn vị.');
  };

  const downloadTemplate = () => {
    const sample = [
      { 'Tên đơn vị': 'Phường Hồng Bàng', 'Loại': 'phuong' },
      { 'Tên đơn vị': 'Phường Lê Chân', 'Loại': 'phuong' },
      { 'Tên đơn vị': 'Xã Tân Dương', 'Loại': 'xa' },
      { 'Tên đơn vị': 'Đặc khu Đồ Sơn', 'Loại': 'dac_khu' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DonVi');
    XLSX.writeFile(wb, 'mau_don_vi.xlsx');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(ws);
      const valid = data.filter(r => r['Tên đơn vị']);
      if (valid.length === 0) return toast.error('Không tìm thấy dữ liệu hợp lệ. Kiểm tra lại file mẫu.');
      for (const r of valid) {
        await addDonVi(String(r['Tên đơn vị']).trim(), String(r['Loại'] || 'phuong').trim());
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
      refresh(); toast.success(`Đã import ${valid.length} đơn vị thành công.`);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Thêm 1 đơn vị */}
      <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
        <h4 className="text-sm font-bold text-brand-blue font-ui mb-4">Thêm đơn vị</h4>
        <div className="flex gap-3">
          <input
            className="input-admin-tech flex-1"
            placeholder="Nhập tên đơn vị mới..."
            value={ten}
            onChange={e => setTen(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <select
            className="input-admin-tech"
            value={loai}
            onChange={e => setLoai(e.target.value)}
          >
            {LOAI_DON_VI.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
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
        <p className="text-xs text-slate-400 font-ui mt-3">File mẫu gồm cột: <strong>Tên đơn vị</strong> và <strong>Loại</strong> (phuong / xa / dac_khu)</p>
      </div>

      {/* Danh sách */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {donVis.map(dv => (
          <div key={dv.id} className="p-4 bg-white border border-slate-100 rounded-xl flex justify-between items-center group hover:border-brand-blue/30 transition-all">
            <span className="font-semibold text-slate-700 text-sm font-ui">{dv.ten}</span>
            <button onClick={() => deleteDonVi(dv.id).then(refresh)} className="p-1.5 text-slate-300 hover:text-brand-red transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 size={14}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThiSinhManager({ thiSinhs, refresh }: { thiSinhs: any[], refresh: () => void }) {
  return (
    <div className="p-4">
      <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
        <table className="w-full text-left text-sm font-bold">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="px-6 py-4">Họ tên</th><th className="px-6 py-4">SĐT</th><th className="px-6 py-4">Đơn vị</th><th className="px-6 py-4">Ngày tạo</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {thiSinhs.map(ts => (
              <tr key={ts.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-brand-blue font-black">{ts.ho_ten}</td>
                <td className="px-6 py-4 text-slate-500">{ts.sdt}</td>
                <td className="px-6 py-4 font-black">{ts.don_vi?.ten}</td>
                <td className="px-6 py-4 text-slate-400">{new Date(ts.created_at).toLocaleDateString('vi-VN', { timeZone: VN_TZ })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KetQuaManager({ ketQuas }: { ketQuas: any[] }) {
  const exportExcel = () => {
    const data = ketQuas.map(r => ({
      'Họ tên': r.thi_sinh?.ho_ten,
      'SĐT': r.thi_sinh?.sdt,
      'Đơn vị': r.thi_sinh?.don_vi?.ten,
      'Chặng thi': r.chang_thi?.ten,
      'Điểm số': r.diem,
      'Câu đúng': r.so_cau_dung,
      'Thời gian (giây)': r.thoi_gian_giay,
      'Ngày thi': new Date(r.created_at).toLocaleString('vi-VN', { timeZone: VN_TZ })
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KetQua");
    XLSX.writeFile(wb, "KetQua_Thi_ChuyenDoiSo.xlsx");
  };

  return (
    <div className="p-4 space-y-8">
      <div className="flex justify-between items-center bg-brand-blue/5 p-8 rounded-3xl">
        <h4 className="text-sm font-bold text-brand-blue font-ui">Bảng xếp hạng hệ thống</h4>
        <button onClick={exportExcel} className="flex items-center gap-2 bg-brand-yellow text-brand-blue font-ui font-bold text-sm px-6 py-3 rounded-xl hover:bg-brand-yellow/90 transition-all">
          <FileSpreadsheet size={16} /> Xuất Excel
        </button>
      </div>
      <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
        <table className="w-full text-left text-sm font-bold">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="px-6 py-4">Hạng</th><th className="px-6 py-4">Họ tên</th><th className="px-6 py-4">Đơn vị</th><th className="px-6 py-4">Điểm</th><th className="px-6 py-4">Thời gian</th><th className="px-6 py-4">Chặng</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {ketQuas.map((r, i) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4"><span className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${i<3 ? 'bg-brand-yellow text-brand-blue' : 'bg-slate-100 text-slate-400'}`}>{i+1}</span></td>
                <td className="px-6 py-4"><div className="text-brand-blue font-black uppercase">{r.thi_sinh?.ho_ten}</div><div className="text-[10px] text-slate-400">{r.thi_sinh?.sdt}</div></td>
                <td className="px-6 py-4 font-black">{r.thi_sinh?.don_vi?.ten}</td>
                <td className="px-6 py-4 text-xl font-tech font-black text-brand-blue">{r.diem}</td>
                <td className="px-6 py-4 text-slate-400 font-tech">{r.thoi_gian_giay}s</td>
                <td className="px-6 py-4"><span className="px-3 py-1 bg-brand-blue/5 text-brand-blue text-[10px] rounded-lg border border-brand-blue/10">{r.chang_thi?.ten}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GianLanManager({ logs }: { logs: any[] }) {
  return (
    <div className="p-4 space-y-8">
      <div className="flex items-center gap-4 bg-brand-red/5 p-8 rounded-3xl border border-brand-red/10 animate-pulse">
        <ShieldAlert className="text-brand-red w-10 h-10" />
        <div>
          <h4 className="text-sm font-bold text-brand-red font-ui">Giám sát gian lận</h4>
          <p className="text-xs text-brand-red/60 font-ui">Phát hiện hoạt động bất thường: chuyển tab, thu nhỏ trình duyệt.</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-[2rem] border border-brand-red/10">
        <table className="w-full text-left text-sm font-bold">
          <thead className="bg-brand-red/5 text-[10px] font-black text-brand-red uppercase tracking-widest">
            <tr><th className="px-6 py-4">Thí sinh</th><th className="px-6 py-4">Chặng</th><th className="px-6 py-4">Số lần vi phạm</th><th className="px-6 py-4">Lần cuối</th></tr>
          </thead>
          <tbody className="divide-y divide-brand-red/5">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-brand-red/5 transition-colors">
                <td className="px-6 py-4"><div className="font-black text-slate-800 uppercase">{log.thi_sinh?.ho_ten}</div><div className="text-[10px] text-slate-400">{log.thi_sinh?.sdt} • {log.thi_sinh?.don_vi?.ten}</div></td>
                <td className="px-6 py-4 text-brand-blue font-black">{log.chang_thi?.ten}</td>
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
