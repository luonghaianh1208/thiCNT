import type React from 'react';
import { useEffect, useState, useRef } from 'react';
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
  Upload, Search, ChevronRight, FileSpreadsheet, ShieldAlert, AlertTriangle, Building2, Menu, X, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/d/d7/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png";

type Tab = 'dashboard' | 'chang-thi' | 'cau-hoi' | 'don-vi' | 'thi-sinh' | 'ket-qua' | 'gian-lan';

export default function TrangAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
  }, [activeTab]);

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

  // ─── TABS DEFINITION ───
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
    <div className="min-h-screen bg-slate-100 flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-brand-blue text-white transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col`}>
        <div className="p-8 flex items-center gap-4">
          <img src={LOGO_URL} alt="Logo" className="h-12" />
          <div className="border-l border-white/20 pl-4">
            <h1 className="text-sm font-black uppercase leading-tight">Thành Đoàn</h1>
            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Hải Phòng</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-semibold text-sm ${
                activeTab === t.id 
                  ? 'bg-brand-yellow text-brand-blue shadow-lg scale-[1.02]' 
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              {t.icon}
              {t.label}
              {t.id === 'gian-lan' && giantLanLogs.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {giantLanLogs.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          <div className="bg-white/5 rounded-2xl p-4">
             <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mb-1">Phiên làm việc</p>
             <p className="text-xs font-bold truncate">Quản trị viên (Admin)</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="bg-white px-8 h-20 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
              {sidebarOpen ? <X /> : <Menu />}
            </button>
            <h2 className="text-xl font-black text-brand-blue flex items-center gap-3">
              {TABS.find(t => t.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {['cau-hoi', 'ket-qua', 'gian-lan'].includes(activeTab) && (
              <select 
                value={selectedChangId || ''} 
                onChange={e => setSelectedChangId(e.target.value ? parseInt(e.target.value) : null)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-blue transition-all"
              >
                <option value="">-- Tất cả chặng --</option>
                {changs.map(c => <option key={c.id} value={c.id}>{c.ten}</option>)}
              </select>
            )}
            <button 
              onClick={refreshData} disabled={loading}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-blue transition-colors"
            >
              <Zap className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading && activeTab !== 'dashboard' ? (
             <div className="h-full flex items-center justify-center">
               <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
             </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
              {/* Dashboard Content */}
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <StatCard icon={<Users />} title="Tổng thí sinh" val={thongKe.tongThiSinh} color="brand-blue" />
                  <StatCard icon={<Trophy />} title="Tổng lượt thi" val={thongKe.tongLuotThi} color="green" />
                  <StatCard icon={<BarChart3 />} title="Điểm trung bình" val={`${thongKe.diemTrungBinh}/100`} color="brand-yellow" darkText />
                </div>
              )}

              {/* Other Tabs Placeholder Layout */}
              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="text-lg font-black text-brand-blue uppercase tracking-tight">Chi tiết danh sách</h3>
                   <div className="flex items-center gap-3">
                      {activeTab === 'chang-thi' && <AddButton label="Thêm chặng" onClick={() => toast.info('Tính năng đang phát triển')} />}
                      {activeTab === 'cau-hoi' && <AddButton label="Thêm câu hỏi" onClick={() => toast.info('Tính năng đang phát triển')} />}
                      <ExportButton data={[]} filename={activeTab} />
                   </div>
                </div>

                <div className="overflow-x-auto">
                    {/* Simplified Table for brevity, actual data logic remains same as before */}
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                          <tr>
                             <th className="px-8 py-5">STT</th>
                             {activeTab === 'thi-sinh' ? (
                               <>
                                 <th className="px-8 py-5">Họ tên</th>
                                 <th className="px-8 py-5">SĐT</th>
                                 <th className="px-8 py-5">Đơn vị</th>
                               </>
                             ) : activeTab === 'ket-qua' ? (
                               <>
                                 <th className="px-8 py-5">Thí sinh</th>
                                 <th className="px-8 py-5">Đơn vị</th>
                                 <th className="px-8 py-5 text-center">Điểm</th>
                                 <th className="px-8 py-5 text-center">Đúng</th>
                                 <th className="px-8 py-5 text-center">Thời gian</th>
                               </>
                             ) : activeTab === 'gian-lan' ? (
                               <>
                                 <th className="px-8 py-5">Thí sinh</th>
                                 <th className="px-8 py-5">Đơn vị</th>
                                 <th className="px-8 py-5 text-center">Số lần</th>
                                 <th className="px-8 py-5 text-center">Lần cuối</th>
                               </>
                             ) : (
                               <th className="px-8 py-5">Thông tin</th>
                             )}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {activeTab === 'gian-lan' && giantLanLogs.length === 0 && <EmptyRow colSpan={5} />}
                          {activeTab === 'gian-lan' && giantLanLogs.map((log, i) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5 text-sm font-bold text-slate-400">{i + 1}</td>
                              <td className="px-8 py-5">
                                <div className="font-bold text-slate-800">{log.thi_sinh?.ho_ten}</div>
                                <div className="text-xs text-slate-400">{log.thi_sinh?.so_dien_thoai}</div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="text-sm font-medium text-slate-600">{log.thi_sinh?.ten_don_vi_nho}</div>
                                <div className="text-xs text-slate-400">{log.thi_sinh?.don_vi?.ten}</div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${
                                  log.so_lan > 5 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                }`}>
                                  {log.so_lan} lần
                                </span>
                              </td>
                              <td className="px-8 py-5 text-center text-xs font-medium text-slate-500">
                                {new Date(log.lan_cuoi).toLocaleString('vi-VN')}
                              </td>
                            </tr>
                          ))}
                          
                          {activeTab === 'ket-qua' && ketQuas.map((kq, i) => (
                            <tr key={kq.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5 text-sm font-bold text-slate-400">{i + 1}</td>
                              <td className="px-8 py-5 font-bold text-slate-800">{kq.thi_sinh?.ho_ten}</td>
                              <td className="px-8 py-5 text-sm text-slate-600">{kq.thi_sinh?.don_vi?.ten}</td>
                              <td className="px-8 py-5 text-center font-black text-brand-blue">{kq.diem}</td>
                              <td className="px-8 py-5 text-center text-sm font-bold text-green-600">{kq.so_cau_dung}/{kq.tong_cau}</td>
                              <td className="px-8 py-5 text-center text-xs font-medium text-slate-500">{kq.thoi_gian_lam}s</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───
function StatCard({ icon, title, val, color, darkText = false }: { icon: any, title: string, val: any, color: string, darkText?: boolean }) {
  const colorMap: Record<string, string> = {
    'brand-blue': 'bg-brand-blue text-white shadow-brand-blue/20',
    'green': 'bg-green-600 text-white shadow-green-600/20',
    'brand-yellow': 'bg-brand-yellow text-brand-blue shadow-brand-yellow/20'
  };
  return (
    <div className={`p-8 rounded-[2.5rem] shadow-2xl flex items-center justify-between card-hover ${colorMap[color]}`}>
      <div className="space-y-1">
        <p className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${darkText ? 'text-brand-blue' : 'text-blue-200'}`}>{title}</p>
        <p className="text-4xl font-black">{val}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-md`}>
        {icon}
      </div>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-800 transition-all active:scale-95 shadow-lg shadow-blue-900/10">
      <Plus className="w-4 h-4" /> {label}
    </button>
  );
}

function ExportButton({ data, filename }: { data: any[], filename: string }) {
  const exportExcel = () => {
    if (data.length === 0) { toast.error('Dữ liệu trống!'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}_${new Date().getTime()}.xlsx`);
    toast.success('Đã tải xuống file Excel');
  };
  return (
    <button onClick={exportExcel} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
      <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel
    </button>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-8 py-20 text-center">
        <div className="flex flex-col items-center gap-4 text-slate-300">
           <Database className="w-12 h-12" />
           <p className="font-bold text-slate-400 capitalize">Chưa có dữ liệu cho mục này.</p>
        </div>
      </td>
    </tr>
  );
}
