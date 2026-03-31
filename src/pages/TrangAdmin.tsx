import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  getAllChangThi, addChangThi, updateChangThi, deleteChangThi,
  getCauHoiByChang, addCauHoi, updateCauHoi, deleteCauHoi, bulkInsertCauHoi,
  getDonViList, addDonVi, updateDonVi, deleteDonVi,
  getAllThiSinh, bulkInsertThiSinh,
  getKetQuaAdmin, getThongKe, getCanhBaoGianLan,
  type ChangThi, type CauHoi, type DonVi,
} from '@/lib/db';
import {
  LayoutDashboard, Clock, BookOpen, Building2, Users, LogOut,
  Plus, Pencil, Trash2, Upload, Download, Loader2, CheckCircle, X, Save,
  ShieldAlert,
} from 'lucide-react';

type Tab = 'thongke' | 'changthi' | 'cauhoi' | 'donvi' | 'thisinh' | 'gianlAN';

const VN_DATETIME = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const localToISO = (val: string) => val ? new Date(val).toISOString() : '';
const isoToLocal = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const offset = 7 * 60;
  const local = new Date(d.getTime() + offset * 60000);
  return local.toISOString().slice(0, 16);
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className="fixed bottom-6 right-6 bg-green-700 text-white text-sm px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50">
      <CheckCircle className="w-4 h-4" />
      {msg}
      <button onClick={onClose}><X className="w-4 h-4 opacity-60 hover:opacity-100" /></button>
    </div>
  );
}

// ── Modal wrapper ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Thống kê ──────────────────────────────────────────────────────────────────
function TabThongKe() {
  const [stats, setStats] = useState<any>(null);
  const [ketQua, setKetQua] = useState<any[]>([]);
  const [changs, setChangs] = useState<ChangThi[]>([]);
  const [selChang, setSelChang] = useState<number | ''>('');

  useEffect(() => {
    getThongKe().then(setStats);
    getAllChangThi().then(setChangs);
  }, []);

  useEffect(() => {
    getKetQuaAdmin(selChang || undefined).then(setKetQua);
  }, [selChang]);

  const exportExcel = () => {
    const rows = ketQua.map((k: any) => ({
      'Họ tên': k.thi_sinh?.ho_ten || '',
      'SĐT': k.thi_sinh?.so_dien_thoai || '',
      'Đơn vị': k.thi_sinh?.don_vi?.ten || '',
      'Đơn vị nhỏ': k.thi_sinh?.ten_don_vi_nho || '',
      'Chặng': k.chang_thi?.ten || '',
      'Điểm': k.diem,
      'Câu đúng': k.so_cau_dung,
      'Tổng câu': k.tong_cau,
      'Thời gian (s)': k.thoi_gian_lam,
      'Thời điểm nộp': VN_DATETIME(k.created_at),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kết quả');
    XLSX.writeFile(wb, 'ket_qua_thi.xlsx');
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Tổng thí sinh', value: stats?.tongThiSinh ?? '–', color: 'text-blue-700' },
          { label: 'Lượt thi', value: stats?.tongLuotThi ?? '–', color: 'text-green-700' },
          { label: 'Điểm TB', value: stats ? `${stats.diemTrungBinh}/100` : '–', color: 'text-orange-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Kết quả thi</h3>
          <div className="flex gap-3 items-center">
            <select
              value={selChang}
              onChange={e => setSelChang(e.target.value ? Number(e.target.value) : '')}
              className="border border-gray-200 rounded-lg text-sm px-3 py-1.5"
            >
              <option value="">Tất cả chặng</option>
              {changs.map(c => <option key={c.id} value={c.id}>{c.ten}</option>)}
            </select>
            <button onClick={exportExcel} className="flex items-center gap-1.5 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700">
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Họ tên</th>
                <th className="px-4 py-3 text-left">SĐT</th>
                <th className="px-4 py-3 text-left">Đơn vị</th>
                <th className="px-4 py-3 text-left">Chặng</th>
                <th className="px-4 py-3 text-center">Điểm</th>
                <th className="px-4 py-3 text-center">Đúng/Tổng</th>
                <th className="px-4 py-3 text-left">Thời điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ketQua.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Chưa có kết quả</td></tr>
              )}
              {ketQua.map((k: any, i: number) => (
                <tr key={k.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{k.thi_sinh?.ho_ten}</td>
                  <td className="px-4 py-3 text-gray-500">{k.thi_sinh?.so_dien_thoai}</td>
                  <td className="px-4 py-3 text-gray-500">{k.thi_sinh?.don_vi?.ten}</td>
                  <td className="px-4 py-3 text-gray-500">{k.chang_thi?.ten}</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-700">{k.diem}</td>
                  <td className="px-4 py-3 text-center">{k.so_cau_dung}/{k.tong_cau}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{VN_DATETIME(k.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Chặng thi ─────────────────────────────────────────────────────────────────
function TabChangThi({ onToast }: { onToast: (m: string) => void }) {
  const [list, setList] = useState<ChangThi[]>([]);
  const [editing, setEditing] = useState<Partial<ChangThi> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => getAllChangThi().then(setList);
  useEffect(() => { load(); }, []);

  const blank: Partial<ChangThi> = { ten: '', bat_dau: '', ket_thuc: '', so_cau: 30, thoi_gian_phut: 25 };

  const save = async () => {
    if (!editing) return;
    if (!editing.ten?.trim() || !editing.bat_dau || !editing.ket_thuc) { alert('Vui lòng điền đầy đủ.'); return; }
    setLoading(true);
    try {
      if (editing.id) await updateChangThi(editing.id, { ...editing, bat_dau: localToISO(editing.bat_dau), ket_thuc: localToISO(editing.ket_thuc) });
      else await addChangThi({ ...editing as Omit<ChangThi, 'id'>, bat_dau: localToISO(editing.bat_dau!), ket_thuc: localToISO(editing.ket_thuc!) });
      await load();
      setEditing(null);
      onToast('Đã lưu chặng thi');
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Xóa chặng này (và toàn bộ câu hỏi)?')) return;
    await deleteChangThi(id); await load(); onToast('Đã xóa');
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing(blank)} className="flex items-center gap-2 bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800">
          <Plus className="w-4 h-4" /> Thêm chặng thi
        </button>
      </div>

      <div className="space-y-3">
        {list.map(ct => {
          const now = new Date();
          const active = now >= new Date(ct.bat_dau) && now <= new Date(ct.ket_thuc);
          return (
            <div key={ct.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{ct.ten}</h3>
                    {active && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">Đang mở</span>}
                  </div>
                  <div className="text-sm text-gray-500 space-y-0.5">
                    <p>Bắt đầu: <strong>{VN_DATETIME(ct.bat_dau)}</strong></p>
                    <p>Kết thúc: <strong>{VN_DATETIME(ct.ket_thuc)}</strong></p>
                    <p>{ct.so_cau} câu · {ct.thoi_gian_phut} phút</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing({ ...ct, bat_dau: isoToLocal(ct.bat_dau), ket_thuc: isoToLocal(ct.ket_thuc) })}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => del(ct.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="text-center text-gray-400 py-8">Chưa có chặng thi nào.</p>}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Sửa chặng thi' : 'Thêm chặng thi'} onClose={() => setEditing(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên chặng</label>
              <input value={editing.ten || ''} onChange={e => setEditing(p => ({ ...p!, ten: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Chặng 1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu (giờ VN)</label>
                <input type="datetime-local" value={editing.bat_dau || ''}
                  onChange={e => setEditing(p => ({ ...p!, bat_dau: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc (giờ VN)</label>
                <input type="datetime-local" value={editing.ket_thuc || ''}
                  onChange={e => setEditing(p => ({ ...p!, ket_thuc: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số câu hỏi</label>
                <input type="number" min={1} value={editing.so_cau || 30}
                  onChange={e => setEditing(p => ({ ...p!, so_cau: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút)</label>
                <input type="number" min={1} value={editing.thoi_gian_phut || 25}
                  onChange={e => setEditing(p => ({ ...p!, thoi_gian_phut: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <button onClick={save} disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Câu hỏi ──────────────────────────────────────────────────────────────────
function TabCauHoi({ onToast }: { onToast: (m: string) => void }) {
  const [changs, setChangs] = useState<ChangThi[]>([]);
  const [selChang, setSelChang] = useState<number | ''>('');
  const [list, setList] = useState<CauHoi[]>([]);
  const [editing, setEditing] = useState<Partial<CauHoi> | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getAllChangThi().then(d => { setChangs(d); if (d.length) setSelChang(d[0].id); }); }, []);
  useEffect(() => { if (selChang) getCauHoiByChang(selChang as number).then(setList); }, [selChang]);

  const reload = () => { if (selChang) getCauHoiByChang(selChang as number).then(setList); };

  const blank: Partial<CauHoi> = { noi_dung: '', dap_an_a: '', dap_an_b: '', dap_an_c: '', dap_an_d: '', dap_an_dung: 'A', chang_id: selChang as number };

  const save = async () => {
    if (!editing) return;
    const { noi_dung, dap_an_a, dap_an_b, dap_an_c, dap_an_d } = editing;
    if (!noi_dung?.trim() || !dap_an_a?.trim() || !dap_an_b?.trim() || !dap_an_c?.trim() || !dap_an_d?.trim()) {
      alert('Vui lòng điền đầy đủ nội dung câu hỏi và 4 đáp án.'); return;
    }
    setLoading(true);
    try {
      if (editing.id) await updateCauHoi(editing.id, editing);
      else await addCauHoi({ ...editing, chang_id: selChang as number } as Omit<CauHoi, 'id' | 'active'>);
      reload(); setEditing(null); onToast('Đã lưu câu hỏi');
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    await deleteCauHoi(id); reload(); onToast('Đã xóa');
  };

  const importExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !selChang) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    const newItems = rows.map(r => ({
      noi_dung: String(r['Nội dung'] || r['noi_dung'] || '').trim(),
      dap_an_a: String(r['A'] || r['dap_an_a'] || '').trim(),
      dap_an_b: String(r['B'] || r['dap_an_b'] || '').trim(),
      dap_an_c: String(r['C'] || r['dap_an_c'] || '').trim(),
      dap_an_d: String(r['D'] || r['dap_an_d'] || '').trim(),
      dap_an_dung: String(r['Đáp án'] || r['dap_an_dung'] || 'A').trim().toUpperCase(),
      chang_id: selChang as number,
      active: true,
    })).filter(r => r.noi_dung);
    if (newItems.length === 0) { alert('Không tìm thấy câu hỏi trong file. Kiểm tra lại tên cột.'); return; }
    await bulkInsertCauHoi(newItems as any);
    reload(); onToast(`Đã import ${newItems.length} câu hỏi`);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      'Nội dung': 'Chuyển đổi số là gì?',
      A: 'Số hóa tài liệu', B: 'Ứng dụng công nghệ số', C: 'In ấn tài liệu', D: 'Gửi thư điện tử',
      'Đáp án': 'B',
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Câu hỏi');
    XLSX.writeFile(wb, 'mau_cau_hoi.xlsx');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <select value={selChang} onChange={e => setSelChang(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {changs.map(c => <option key={c.id} value={c.id}>{c.ten}</option>)}
        </select>
        <span className="text-sm text-gray-500">{list.length} câu</span>
        <button onClick={downloadTemplate} className="flex items-center gap-1.5 border border-gray-300 text-gray-600 text-sm px-3 py-2 rounded-lg hover:bg-gray-50">
          <Download className="w-3.5 h-3.5" /> Mẫu Excel
        </button>
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 bg-orange-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-orange-700">
          <Upload className="w-3.5 h-3.5" /> Import Excel
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importExcel} />
        <button onClick={() => setEditing({ ...blank, chang_id: selChang as number })}
          className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-3 py-2 rounded-lg hover:bg-blue-800">
          <Plus className="w-3.5 h-3.5" /> Thêm câu
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left w-8">#</th>
              <th className="px-4 py-3 text-left">Nội dung câu hỏi</th>
              <th className="px-4 py-3 text-center w-20">Đáp án</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                Chưa có câu hỏi. Import Excel hoặc thêm thủ công.
              </td></tr>
            )}
            {list.map((q, i) => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800 line-clamp-2">{q.noi_dung}</p>
                  <p className="text-xs text-gray-400 mt-0.5">A: {q.dap_an_a} · B: {q.dap_an_b} · C: {q.dap_an_c} · D: {q.dap_an_d}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded">{q.dap_an_dung}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setEditing(q)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => del(q.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? 'Sửa câu hỏi' : 'Thêm câu hỏi'} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung câu hỏi</label>
              <textarea rows={3} value={editing.noi_dung || ''}
                onChange={e => setEditing(p => ({ ...p!, noi_dung: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            {(['a', 'b', 'c', 'd'] as const).map(opt => (
              <div key={opt}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đáp án {opt.toUpperCase()}</label>
                <input value={(editing as any)[`dap_an_${opt}`] || ''}
                  onChange={e => setEditing(p => ({ ...p!, [`dap_an_${opt}`]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đáp án đúng</label>
              <select value={editing.dap_an_dung || 'A'}
                onChange={e => setEditing(p => ({ ...p!, dap_an_dung: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['A', 'B', 'C', 'D'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <button onClick={save} disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Đơn vị ────────────────────────────────────────────────────────────────────
function TabDonVi({ onToast }: { onToast: (m: string) => void }) {
  const [list, setList] = useState<DonVi[]>([]);
  const [editing, setEditing] = useState<Partial<DonVi> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => getDonViList().then(setList);
  useEffect(() => { load(); }, []);

  const LOAI_LABELS: Record<string, string> = {
    phuong: 'Phường', xa: 'Xã', dac_khu: 'Đặc khu', doan_truc_thuoc: 'Đoàn trực thuộc',
  };

  const save = async () => {
    if (!editing?.ten?.trim() || !editing.loai) { alert('Nhập đầy đủ tên và loại đơn vị.'); return; }
    setLoading(true);
    try {
      if (editing.id) await updateDonVi(editing.id, editing.ten, editing.loai);
      else await addDonVi(editing.ten, editing.loai);
      await load(); setEditing(null); onToast('Đã lưu đơn vị');
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Xóa đơn vị này?')) return;
    await deleteDonVi(id); await load(); onToast('Đã xóa');
  };

  const grouped = Object.entries(LOAI_LABELS).map(([loai, label]) => ({
    loai, label, items: list.filter(d => d.loai === loai),
  })).filter(g => g.items.length > 0);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing({ ten: '', loai: 'phuong' })}
          className="flex items-center gap-2 bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800">
          <Plus className="w-4 h-4" /> Thêm đơn vị
        </button>
      </div>

      <div className="space-y-4">
        {grouped.map(g => (
          <div key={g.loai} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-700 text-sm">{g.label} ({g.items.length})</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {g.items.map(d => (
                <div key={d.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-800">{d.ten}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(d)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => del(d.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-center text-gray-400 py-8">Chưa có đơn vị nào.</p>}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Sửa đơn vị' : 'Thêm đơn vị'} onClose={() => setEditing(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại đơn vị</label>
              <select value={editing.loai || 'phuong'}
                onChange={e => setEditing(p => ({ ...p!, loai: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(LOAI_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đơn vị</label>
              <input value={editing.ten || ''}
                onChange={e => setEditing(p => ({ ...p!, ten: e.target.value }))}
                placeholder="VD: Phường Lê Chân"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={save} disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Thí sinh ──────────────────────────────────────────────────────────────────
function TabThiSinh({ onToast }: { onToast: (m: string) => void }) {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => getAllThiSinh().then(setList);
  useEffect(() => { load(); }, []);

  const filtered = list.filter(t =>
    t.ho_ten?.toLowerCase().includes(search.toLowerCase()) ||
    t.so_dien_thoai?.includes(search)
  );

  const importExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    const newItems = rows.map(r => ({
      ho_ten: String(r['Họ tên'] || r['ho_ten'] || '').trim(),
      so_dien_thoai: String(r['Số điện thoại'] || r['so_dien_thoai'] || '').trim(),
    })).filter(r => r.ho_ten && r.so_dien_thoai);
    if (newItems.length === 0) { alert('Không tìm thấy dữ liệu. Cột cần có: "Họ tên", "Số điện thoại"'); return; }
    await bulkInsertThiSinh(newItems);
    load(); onToast(`Đã import ${newItems.length} thí sinh`);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ 'Họ tên': 'Nguyễn Văn A', 'Số điện thoại': '0912345678' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Thí sinh');
    XLSX.writeFile(wb, 'mau_thi_sinh.xlsx');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc SĐT..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <span className="text-sm text-gray-500">{filtered.length}/{list.length}</span>
        <button onClick={downloadTemplate} className="flex items-center gap-1.5 border border-gray-300 text-gray-600 text-sm px-3 py-2 rounded-lg hover:bg-gray-50">
          <Download className="w-3.5 h-3.5" /> Mẫu
        </button>
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 bg-orange-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-orange-700">
          <Upload className="w-3.5 h-3.5" /> Import Excel
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importExcel} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Họ tên</th>
              <th className="px-4 py-3 text-left">SĐT</th>
              <th className="px-4 py-3 text-left">Đơn vị</th>
              <th className="px-4 py-3 text-left">Đơn vị nhỏ</th>
              <th className="px-4 py-3 text-left">Đăng ký lúc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Không có dữ liệu</td></tr>
            )}
            {filtered.map((t, i) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{t.ho_ten}</td>
                <td className="px-4 py-3 text-gray-500">{t.so_dien_thoai}</td>
                <td className="px-4 py-3 text-gray-500">{t.don_vi?.ten || '–'}</td>
                <td className="px-4 py-3 text-gray-500">{t.ten_don_vi_nho || '–'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{VN_DATETIME(t.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Gian lận ──────────────────────────────────────────────────────────────────
function TabGianLan() {
  const [list, setList] = useState<any[]>([]);
  const [changs, setChangs] = useState<ChangThi[]>([]);
  const [selChang, setSelChang] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllChangThi().then(setChangs);
  }, []);

  useEffect(() => {
    setLoading(true);
    getCanhBaoGianLan(selChang || undefined)
      .then(setList)
      .finally(() => setLoading(false));
  }, [selChang]);

  const exportExcel = () => {
    const rows = list.map((r: any, i: number) => ({
      'STT': i + 1,
      'Họ tên': r.thi_sinh?.ho_ten || '',
      'SĐT': r.thi_sinh?.so_dien_thoai || '',
      'Đơn vị': r.thi_sinh?.don_vi?.ten || '',
      'Đơn vị nhỏ': r.thi_sinh?.ten_don_vi_nho || '',
      'Chặng': r.chang_thi?.ten || '',
      'Số lần thoát': r.so_lan,
      'Lần cuối': VN_DATETIME(r.lan_cuoi),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cảnh báo gian lận');
    XLSX.writeFile(wb, 'canh_bao_gian_lan.xlsx');
  };

  return (
    <div>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm text-red-800 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Theo dõi gian lận rời màn hình</p>
          <p>Hệ thống ghi nhận khi thí sinh chuyển tab, thu nhỏ cửa sổ hoặc rời khỏi màn hình thi. Đây là dữ liệu tham khảo, không tự động trừ điểm.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            Danh sách vi phạm
            {list.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{list.length}</span>
            )}
          </h3>
          <div className="flex gap-3 items-center">
            <select
              value={selChang}
              onChange={e => setSelChang(e.target.value ? Number(e.target.value) : '')}
              className="border border-gray-200 rounded-lg text-sm px-3 py-1.5"
            >
              <option value="">Tất cả chặng</option>
              {changs.map(c => <option key={c.id} value={c.id}>{c.ten}</option>)}
            </select>
            {list.length > 0 && (
              <button onClick={exportExcel} className="flex items-center gap-1.5 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700">
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Họ tên</th>
                  <th className="px-4 py-3 text-left">SĐT</th>
                  <th className="px-4 py-3 text-left">Đơn vị</th>
                  <th className="px-4 py-3 text-left">Chặng</th>
                  <th className="px-4 py-3 text-center">Số lần thoát</th>
                  <th className="px-4 py-3 text-left">Lần cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    <ShieldAlert className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    Chưa có vi phạm nào được ghi nhận.
                  </td></tr>
                )}
                {list.map((r: any, i: number) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{r.thi_sinh?.ho_ten}</td>
                    <td className="px-4 py-3 text-gray-500">{r.thi_sinh?.so_dien_thoai}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.thi_sinh?.don_vi?.ten}
                      {r.thi_sinh?.ten_don_vi_nho && <span className="text-xs text-gray-400 ml-1">· {r.thi_sinh.ten_don_vi_nho}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.chang_thi?.ten}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block font-bold px-2.5 py-0.5 rounded-full text-xs ${
                        r.so_lan >= 5 ? 'bg-red-100 text-red-700' :
                        r.so_lan >= 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{r.so_lan} lần</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{VN_DATETIME(r.lan_cuoi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'thongke', label: 'Thống kê & Kết quả', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'changthi', label: 'Chặng thi', icon: <Clock className="w-4 h-4" /> },
  { id: 'cauhoi', label: 'Ngân hàng câu hỏi', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'donvi', label: 'Đơn vị đoàn', icon: <Building2 className="w-4 h-4" /> },
  { id: 'thisinh', label: 'Thí sinh', icon: <Users className="w-4 h-4" /> },
  { id: 'gianlAN', label: 'Cảnh báo gian lận', icon: <ShieldAlert className="w-4 h-4" /> },
];

export default function TrangAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('thongke');
  const [toast, setToast] = useState('');

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    navigate('/admin/login', { replace: true });
  };

  const showToast = (msg: string) => setToast(msg);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-800 text-white px-6 py-3 flex items-center justify-between shadow">
        <div>
          <p className="text-xs text-blue-300">Quản trị viên</p>
          <h1 className="font-bold text-sm">Cuộc thi Chuyển đổi số – Thành đoàn Hải Phòng</h1>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" className="text-xs text-blue-300 hover:text-white">Xem trang chủ ↗</a>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white">
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 shrink-0">
          <nav className="py-4">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  activeTab === t.id
                    ? 'bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-700'
                    : t.id === 'gianlAN'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <h2 className="text-lg font-bold text-gray-900 mb-5">
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>
          {activeTab === 'thongke' && <TabThongKe />}
          {activeTab === 'changthi' && <TabChangThi onToast={showToast} />}
          {activeTab === 'cauhoi' && <TabCauHoi onToast={showToast} />}
          {activeTab === 'donvi' && <TabDonVi onToast={showToast} />}
          {activeTab === 'thisinh' && <TabThiSinh onToast={showToast} />}
          {activeTab === 'gianlAN' && <TabGianLan />}
        </main>
      </div>

      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </div>
  );
}
