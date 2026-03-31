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
    { id: 'dashboard', label: 'TỔNG QUAN', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'chang-thi', label: 'CHẶNG THI', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'cau-hoi', label: 'CÂU HỎI', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'don-vi', label: 'ĐƠN VỊ', icon: <Building2 className="w-5 h-5" /> },
    { id: 'thi-sinh', label: 'THÍ SINH', icon: <Users className="w-5 h-5" /> },
    { id: 'ket-qua', label: 'KẾT QUẢ', icon: <Trophy className="w-5 h-5" /> },
    { id: 'gian-lan', label: 'GIAN LÂN', icon: <ShieldAlert className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-ui">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-brand-dark/50 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-brand-blue text-white transition-all duration-500 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col shadow-2xl`}>
        <div className="p-8 flex items-center gap-4 bg-brand-blue/20">
          <img src={LOGO_URL} alt="Logo" className="h-14 w-auto drop-shadow-lg" />
          <div className="border-l-2 border-brand-blue/20 pl-4 whitespace-nowrap">
            <p className="text-[14px] font-black text-brand-blue uppercase tracking-[0.1em] leading-tight font-ui">Đoàn TNCS Hồ Chí Minh</p>
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-tight font-ui">Thành Đoàn Hải Phòng</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-3 mt-10 overflow-y-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); if(window.innerWidth < 1024) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-tech font-black text-[10px] uppercase tracking-[0.2em] ${
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
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-tech font-black uppercase tracking-[0.3em] hover:bg-brand-red hover:border-brand-red transition-all"
          >
            <LogOut size={16} /> ĐĂNG XUẤT
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
            <h2 className="text-2xl font-tech font-black text-brand-blue uppercase tracking-tighter">
              {TABS.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {activeTab === 'cau-hoi' || activeTab === 'ket-qua' || activeTab === 'gian-lan' ? (
              <select 
                className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black text-brand-blue focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none transition-all uppercase tracking-widest"
                value={selectedChangId || ''}
                onChange={e => setSelectedChangId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">TẤT CẢ CHẶNG THI_</option>
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
                <p className="text-slate-400 font-tech font-black text-[10px] uppercase tracking-[0.4em]">Đang đồng bộ dữ liệu số...</p>
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
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-tech">Tổng số thí sinh</h3>
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
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-tech">Tổng lượt dự thi</h3>
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
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-tech">Điểm trung bình</h3>
                        <p className="text-5xl font-tech font-black text-brand-blue">{thongKe.diemTrungBinh.toFixed(1)}</p>
                        <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-red w-3/4 shadow-[0_0_10px_rgba(207,42,42,0.3)]"></div>
                        </div>
                      </div>
                    </div>

                    <div className="card-tech bg-white p-10">
                      <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-tech font-black text-brand-blue uppercase tracking-tight">Hành động nhanh</h3>
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
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-brand-blue">{btn.label}</span>
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

// ─── PHỤ LỤC CÁC MANAGER COMPONENTS (Rút gọn cho Dashboard Tech) ───

function ChangManager({ changs, refresh }: { changs: ChangThi[], refresh: () => void }) {
  const [editing, setEditing] = useState<ChangThi | null>(null);
  const [form, setForm] = useState({ ten: '', bat_dau: '', ket_thuc: '', thoi_gian_phut: 15 });

  const handleAdd = async () => {
    if(!form.ten || !form.bat_dau || !form.ket_thuc) return toast.error('Vui lòng nhập đủ thông tin.');
    await addChangThi({ 
      ten: form.ten, 
      bat_dau: form.bat_dau, 
      ket_thuc: form.ket_thuc, 
      thoi_gian_phut: form.thoi_gian_phut,
      so_cau: 30 
    });
    refresh(); toast.success('Đã thêm chặng thi.');
  };

  const handleUpdate = async () => {
    if(!editing) return;
    await updateChangThi(editing.id, {
      ten: form.ten,
      bat_dau: form.bat_dau,
      ket_thuc: form.ket_thuc,
      thoi_gian_phut: form.thoi_gian_phut
    });
    setEditing(null); refresh(); toast.success('Cập nhật thành công.');
  };

  const handleDelete = async (id: number) => {
    if(!confirm('Xóa chặng thi này sẽ xóa toàn bộ câu hỏi và kết quả liên quan. Bạn chắc chắn?')) return;
    await deleteChangThi(id); refresh();
  };

  return (
    <div className="space-y-8 p-4">
      <div className="bg-brand-blue/5 p-8 rounded-3xl border border-brand-blue/10">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-blue mb-6 font-tech">Cấu hình tham số chặng thi</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <input className="input-admin-tech" placeholder="Tên chặng thi..." value={form.ten} onChange={e => setForm({...form, ten: e.target.value})} />
          <input className="input-admin-tech" type="datetime-local" value={form.bat_dau} onChange={e => setForm({...form, bat_dau: e.target.value})} />
          <input className="input-admin-tech" type="datetime-local" value={form.ket_thuc} onChange={e => setForm({...form, ket_thuc: e.target.value})} />
          <button onClick={editing ? handleUpdate : handleAdd} className="btn-cyber h-full text-[9px] min-h-[52px]">
            {editing ? 'CẬP NHẬT_DATA' : 'KHỞI TẠO_CHẶNG'}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
        <table className="w-full text-left text-sm font-bold">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="px-6 py-4">Tên</th><th className="px-6 py-4">Bắt đầu</th><th className="px-6 py-4">Kết thúc</th><th className="px-6 py-4">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {changs.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-brand-blue font-black">{c.ten}</td>
                <td className="px-6 py-4 text-slate-500">{new Date(c.bat_dau).toLocaleString()}</td>
                <td className="px-6 py-4 text-slate-500">{new Date(c.ket_thuc).toLocaleString()}</td>
                <td className="px-6 py-4 space-x-2">
                  <button onClick={() => { setEditing(c); setForm(c); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={16}/></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-brand-red hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!changId) return toast.error('Chọn chặng thi để import.');
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(ws);
      const clean = data.map(r => ({
        chang_id: changId,
        noi_dung: r['Câu hỏi'] || r['noi_dung'],
        dap_an_a: r['A'] || r['dap_an_a'],
        dap_an_b: r['B'] || r['dap_an_b'],
        dap_an_c: r['C'] || r['dap_an_c'],
        dap_an_d: r['D'] || r['dap_an_d'],
        dap_an_dung: r['Đáp án đúng'] || r['dap_an_dung'],
        mo_ta_giai_thich: r['Giải thích'] || r['mo_ta_giai_thich'],
        active: true
      }));
      await bulkInsertCauHoi(clean);
      refresh(); toast.success(`Import success ${clean.length} questions.`);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-4 space-y-8">
      {!changId ? (
        <div className="py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold">Vui lòng chọn 1 chặng thi cụ thể để quản lý câu hỏi.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center bg-brand-blue/5 p-8 rounded-3xl">
             <div>
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-blue mb-2 font-tech">Kho dữ liệu tri thức</h4>
               <p className="text-xs text-slate-500 font-bold">Hiện có {cauHois.length} câu hỏi trong chặng này.</p>
             </div>
             <div className="flex gap-4">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleImport} accept=".xlsx,.xls" />
                <button onClick={() => fileInputRef.current?.click()} className="btn-cyber-gold px-8 py-3 rounded-2xl flex items-center gap-2 text-[9px] font-tech min-h-[52px]">
                   <FileSpreadsheet size={16} /> IMPORT EXCEL_DATA
                </button>
             </div>
          </div>
          <div className="space-y-4">
            {cauHois.map((q, idx) => (
              <div key={q.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                <div className="flex gap-4">
                  <span className="font-tech font-black text-brand-blue/20 text-3xl">0{idx+1}</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 mb-4 selection:bg-brand-yellow pr-10">{q.noi_dung}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] font-bold">
                       {['a','b','c','d'].map(k => (
                         <div key={k} className={`px-4 py-2 rounded-xl rounded-bl-sm border ${q.dap_an_dung.toLowerCase() === k.toLowerCase() || q[`dap_an_${k}` as keyof CauHoi] === q.dap_an_dung ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-50'}`}>
                           {k.toUpperCase()}. {String(q[`dap_an_${k}` as keyof CauHoi])}
                         </div>
                       ))}
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

function DonViManager({ donVis, refresh }: { donVis: DonVi[], refresh: () => void }) {
  const [ten, setTen] = useState('');
  const handleAdd = async () => { if(!ten) return; await addDonVi(ten, 'Khác'); setTen(''); refresh(); };
  return (
    <div className="p-4 space-y-8">
      <div className="flex gap-4 bg-brand-blue/5 p-8 rounded-3xl border border-brand-blue/10">
        <input className="input-admin-tech flex-1" placeholder="Nhập tên đơn vị mới..." value={ten} onChange={e=>setTen(e.target.value)} />
        <button onClick={handleAdd} className="btn-cyber px-10 h-full min-h-[52px] text-[9px]">XÁC NHẬN_SYSTEM</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {donVis.map(dv => (
          <div key={dv.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex justify-between items-center group hover:border-brand-blue transition-all">
            <span className="font-bold text-slate-700 uppercase tracking-tight text-xs">{dv.ten}</span>
            <button onClick={() => deleteDonVi(dv.id).then(refresh)} className="p-2 text-slate-300 hover:text-brand-red transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
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
                <td className="px-6 py-4 text-slate-400">{new Date(ts.created_at).toLocaleDateString()}</td>
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
      'Ngày thi': new Date(r.created_at).toLocaleString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KetQua");
    XLSX.writeFile(wb, "KetQua_Thi_ChuyenDoiSo.xlsx");
  };

  return (
    <div className="p-4 space-y-8">
      <div className="flex justify-between items-center bg-brand-blue/5 p-8 rounded-3xl">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-blue font-tech">Bảng xếp hạng hệ thống</h4>
        <button onClick={exportExcel} className="btn-cyber-gold px-10 py-3 rounded-2xl flex items-center gap-2 text-[9px] min-h-[52px]">
           <FileSpreadsheet size={16} /> XUẤT FILE EXCEL_REPORT
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
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red font-tech">Hệ thống giám sát gian lận (Anti-Cheat)</h4>
          <p className="text-xs text-brand-red/60 font-bold">Phát hiện các hoạt động bất thường: chuyển tab, thu nhỏ trình duyệt.</p>
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
