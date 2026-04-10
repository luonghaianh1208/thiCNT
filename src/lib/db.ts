import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrangChu {
  id: number;
  tieu_de: string;
  mo_ta: string;
  anh_nen: string;
  duong_dan_fanpage: string;
}

export interface DonVi {
  id: number;
  ten: string;
  lop: string;
}

export interface CuocThi {
  id: number;
  ten: string;
  mo_ta: string;
  anh_banner: string;
  bat_dau: string;
  ket_thuc: string;
  so_cau_hoi: number;
  thoi_gian_lam_phut: number;
  gioi_han_luot: number;
  gioi_han_gian_lan: number;
}

export interface CauHoi {
  id: number;
  noi_dung: string;
  dap_an_a: string;
  dap_an_b: string;
  dap_an_c: string;
  dap_an_d: string;
  dap_an_dung?: string; // Chỉ trả về cho admin, KHÔNG trả về cho thí sinh
  cuoc_thi_id: number;
  active: boolean;
}

export interface ThiSinh {
  id: number;
  ho_ten: string;
  so_dien_thoai: string;
  don_vi_id: number;
  ten_lop: string;
}

export interface KetQua {
  id: number;
  thi_sinh_id: number;
  cuoc_thi_id: number;
  luot_thi: number;
  diem: number;
  so_cau_dung: number;
  tong_cau: number;
  thoi_gian_lam: number;
  answers: AnswerRecord[];
}

export interface AnswerRecord {
  cau_hoi_id: number;
  lua_chon: string;
  dung: boolean;
}

export interface CanhBaoGianLan {
  id: number;
  thi_sinh_id: number;
  cuoc_thi_id: number;
  so_lan: number;
  lan_cuoi: string;
  created_at: string;
}

export interface ThiSinhWithDonVi extends ThiSinh {
  created_at: string;
  don_vi: { ten: string } | null;
}

export interface KetQuaWithRelations extends KetQua {
  thi_sinh: { ho_ten: string; so_dien_thoai: string; ten_lop: string; don_vi: { ten: string } | null } | null;
  cuoc_thi: { ten: string } | null;
  created_at: string;
}

export interface CanhBaoWithRelations extends CanhBaoGianLan {
  thi_sinh: { ho_ten: string; so_dien_thoai: string; ten_lop: string; don_vi: { ten: string } | null } | null;
  cuoc_thi: { ten: string } | null;
}

// ─── Public (Contestant) functions ───────────────────────────────────────────

/** Lấy cuộc thi đang mở (hiện tại trong khoảng thời gian) */
export async function getCuocThiDangMo(): Promise<CuocThi | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('cuoc_thi')
    .select('*')
    .lte('bat_dau', now)
    .gte('ket_thuc', now)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Lấy tất cả cuộc thi (cho trang chủ) */
export async function getAllCuocThiPublic(): Promise<CuocThi[]> {
  const { data, error } = await supabase
    .from('cuoc_thi')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Lấy danh sách đơn vị */
export async function getDonViList(): Promise<DonVi[]> {
  const { data, error } = await supabase
    .from('don_vi')
    .select('*')
    .order('ten', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Lấy cấu hình trang chủ */
export async function getTrangChu(): Promise<TrangChu | null> {
  const { data, error } = await supabase
    .from('trang_chu')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Kiểm tra thí sinh đã thi cuộc thi nào chưa — trả về tên cuộc thi đã thi, rỗng nếu chưa thi */
export async function kiemTraDaThiChu(soDienThoai: string): Promise<string> {
  const { data, error } = await supabase.rpc('kiem_tra_da_thi_chu', {
    p_sdt: soDienThoai.trim(),
  });
  if (error) throw error;
  return data as string;
}

/** Kiểm tra thí sinh đã hết lượt thi chưa — trả về 'con_luot' | 'het_luot' */
export async function kiemTraLuotThi(soDienThoai: string, cuocThiId: number): Promise<'con_luot' | 'het_luot'> {
  const { data, error } = await supabase.rpc('kiem_tra_luot_thi', {
    p_sdt: soDienThoai.trim(),
    p_cuoc_thi_id: cuocThiId,
  });
  if (error) throw error;
  return data as 'con_luot' | 'het_luot';
}

/** Tạo thí sinh mới và trả về ID */
export async function taoThiSinh(data: {
  ho_ten: string;
  so_dien_thoai: string;
  don_vi_id: number;
  ten_lop: string;
}): Promise<number> {
  const { data: result, error } = await supabase
    .from('thi_sinh')
    .insert(data)
    .select('id')
    .single();
  if (error) throw error;
  return result.id;
}

/** Lấy câu hỏi ngẫu nhiên cho cuộc thi
 *  SECURITY: KHÔNG select dap_an_dung — đáp án đúng chỉ được chấm server-side
 */
export async function layCauHoiNgauNhien(cuocThiId: number, soCau: number): Promise<CauHoi[]> {
  const { data, error } = await supabase
    .from('cau_hoi')
    .select('id, noi_dung, dap_an_a, dap_an_b, dap_an_c, dap_an_d, cuoc_thi_id, active')
    .eq('cuoc_thi_id', cuocThiId)
    .eq('active', true);
  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Fisher-Yates shuffle
  const shuffled = [...data];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i]!, shuffled[j]!] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, Math.min(soCau, shuffled.length));
}

/** Nộp bài và chấm điểm server-side (SECURITY: đáp án đúng không bao giờ lộ ra client)
 *  answers: [{cau_hoi_id, lua_chon}] — lua_chon là key gốc lowercase (a/b/c/d)
 *  Returns: {diem, so_cau_dung, tong_cau, luot_thi}
 */
export async function nopBaiVaChamDiem(params: {
  thi_sinh_id: number;
  cuoc_thi_id: number;
  thoi_gian_lam: number;
  answers: { cau_hoi_id: number; lua_chon: string }[];
}): Promise<{ diem: number; so_cau_dung: number; tong_cau: number; luot_thi: number }> {
  const { data, error } = await supabase.rpc('nop_bai_va_cham_diem', {
    p_thi_sinh_id: params.thi_sinh_id,
    p_cuoc_thi_id: params.cuoc_thi_id,
    p_thoi_gian_lam: params.thoi_gian_lam,
    p_answers: params.answers,
  });
  if (error) throw error;
  return data as { diem: number; so_cau_dung: number; tong_cau: number; luot_thi: number };
}

// ─── Gian lận ─────────────────────────────────────────────────────────────────

/** Ghi/cập nhật cảnh báo gian lận (upsert theo thi_sinh + cuoc_thi).
 *  Trả về số lần vi phạm hiện tại.
 */
export async function ghiCanhBaoGianLan(thiSinhId: number, cuocThiId: number): Promise<number> {
  const { data, error } = await supabase.rpc('ghi_canh_bao_gian_lan', {
    p_thi_sinh_id: thiSinhId,
    p_cuoc_thi_id: cuocThiId,
  });
  if (error) throw error;
  return data as number;
}

/** Lấy danh sách cảnh báo gian lận (kèm thông tin thí sinh và cuộc thi) */
export async function getCanhBaoGianLan(cuocThiId?: number): Promise<CanhBaoWithRelations[]> {
  let query = supabase
    .from('canh_bao_gian_lan')
    .select('*, thi_sinh(ho_ten, so_dien_thoai, ten_lop, don_vi(ten)), cuoc_thi(ten)')
    .order('so_lan', { ascending: false });
  if (cuocThiId) query = query.eq('cuoc_thi_id', cuocThiId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as CanhBaoWithRelations[];
}

// ─── Admin functions ──────────────────────────────────────────────────────────

/** Đăng nhập admin — gọi SECURITY DEFINER function, so sánh bcrypt hash server-side */
export async function adminLogin(username: string, matKhau: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_admin_login', {
    p_username: username.trim(),
    p_password: matKhau,
  });
  if (error) throw error;
  return !!data;
}

// Trang chủ
export async function getTrangChuAdmin(): Promise<TrangChu | null> {
  const { data, error } = await supabase
    .from('trang_chu')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateTrangChu(ct: Partial<TrangChu>): Promise<void> {
  const { error } = await supabase.rpc('update_trang_chu', {
    p_tieu_de: ct.tieu_de ?? '',
    p_mo_ta: ct.mo_ta ?? '',
    p_anh_nen: ct.anh_nen ?? '',
    p_duong_dan_fanpage: ct.duong_dan_fanpage ?? '',
  });
  if (error) throw error;
}

// Cuộc thi
export async function getAllCuocThi(): Promise<CuocThi[]> {
  const { data, error } = await supabase.from('cuoc_thi').select('*').order('id');
  if (error) throw error;
  return data || [];
}

export async function addCuocThi(ct: Omit<CuocThi, 'id'>): Promise<void> {
  const { error } = await supabase.from('cuoc_thi').insert(ct);
  if (error) throw error;
}

export async function updateCuocThi(id: number, ct: Partial<CuocThi>): Promise<void> {
  const { error } = await supabase.from('cuoc_thi').update(ct).eq('id', id);
  if (error) throw error;
}

export async function deleteCuocThi(id: number): Promise<void> {
  const { error } = await supabase.from('cuoc_thi').delete().eq('id', id);
  if (error) throw error;
}

// Câu hỏi
export async function getCauHoiByCuocThi(cuocThiId: number): Promise<CauHoi[]> {
  const { data, error } = await supabase
    .from('cau_hoi')
    .select('*')
    .eq('cuoc_thi_id', cuocThiId)
    .order('id');
  if (error) throw error;
  return data || [];
}

export async function addCauHoi(ch: Omit<CauHoi, 'id' | 'active'>): Promise<void> {
  const { error } = await supabase.from('cau_hoi').insert({ ...ch, active: true });
  if (error) throw error;
}

export async function updateCauHoi(id: number, ch: Partial<CauHoi>): Promise<void> {
  const { error } = await supabase.rpc('update_cau_hoi', {
    p_id: id,
    p_noi_dung: ch.noi_dung ?? '',
    p_dap_an_a: ch.dap_an_a ?? '',
    p_dap_an_b: ch.dap_an_b ?? '',
    p_dap_an_c: ch.dap_an_c ?? '',
    p_dap_an_d: ch.dap_an_d ?? '',
    p_dap_an_dung: ch.dap_an_dung ?? 'A',
    p_active: ch.active ?? true,
  });
  if (error) throw error;
}

export async function deleteCauHoi(id: number): Promise<void> {
  const { error } = await supabase.rpc('delete_cau_hoi', { p_id: id });
  if (error) throw error;
}

export async function bulkInsertCauHoi(cauHois: Omit<CauHoi, 'id'>[]): Promise<void> {
  const { error } = await supabase.from('cau_hoi').insert(cauHois);
  if (error) throw error;
}

// Đơn vị / Lớp
export async function addDonVi(ten: string, lop: string): Promise<void> {
  const { error } = await supabase.from('don_vi').insert({ ten, lop });
  if (error) throw error;
}

export async function bulkInsertDonVi(items: { ten: string; lop: string }[]): Promise<void> {
  if (items.length === 0) return;
  const { error } = await supabase.from('don_vi').insert(items);
  if (error) throw error;
}

export async function updateDonVi(id: number, ten: string, lop: string): Promise<void> {
  const { error } = await supabase.from('don_vi').update({ ten, lop }).eq('id', id);
  if (error) throw error;
}

export async function deleteDonVi(id: number): Promise<void> {
  const { error } = await supabase.from('don_vi').delete().eq('id', id);
  if (error) throw error;
}

// Thí sinh
export async function getAllThiSinh(): Promise<ThiSinhWithDonVi[]> {
  const { data, error } = await supabase
    .from('thi_sinh')
    .select('*, don_vi(ten)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ThiSinhWithDonVi[];
}

export async function bulkInsertThiSinh(list: { ho_ten: string; so_dien_thoai: string; don_vi_id?: number; ten_lop?: string }[]): Promise<void> {
  const { error } = await supabase.from('thi_sinh').insert(list);
  if (error) throw error;
}

export async function deleteThiSinh(id: number): Promise<void> {
  const { error } = await supabase.from('thi_sinh').delete().eq('id', id);
  if (error) throw error;
}

// Kết quả
export async function getKetQuaAdmin(cuocThiId?: number): Promise<KetQuaWithRelations[]> {
  let query = supabase
    .from('ket_qua')
    .select('*, thi_sinh(ho_ten, so_dien_thoai, ten_lop, don_vi(ten)), cuoc_thi(ten)')
    .order('diem', { ascending: false });
  if (cuocThiId) query = query.eq('cuoc_thi_id', cuocThiId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as KetQuaWithRelations[];
}

// Thống kê tổng quan — DB tính avg, chỉ trả về kết quả
export async function getThongKe(cuocThiId?: number): Promise<{
  tongThiSinh: number;
  tongLuotThi: number;
  diemTrungBinh: number;
}> {
  const { data, error } = await supabase.rpc('get_thong_ke', {
    p_cuoc_thi_id: cuocThiId ?? null,
  });
  if (error) throw error;
  // RPC trả về array 1 row
  const rows = data as Array<{ tong_thi_sinh: number; tong_luot_thi: number; diem_trung_binh: number }> | null;
  const row = rows?.[0];
  return {
    tongThiSinh: Number(row?.tong_thi_sinh ?? 0),
    tongLuotThi: Number(row?.tong_luot_thi ?? 0),
    diemTrungBinh: Number(row?.diem_trung_binh ?? 0),
  };
}

// ─── Helper functions mới ────────────────────────────────────────────────────────

/** Đếm số lượt đã thi của thí sinh trong 1 cuộc thi */
export async function demLuotDaThi(thiSinhId: number, cuocThiId: number): Promise<number> {
  const { data, error } = await supabase.rpc('dem_luot_da_thi', {
    p_thi_sinh_id: thiSinhId,
    p_cuoc_thi_id: cuocThiId,
  });
  if (error) throw error;
  return data as number;
}

/** Lấy điểm cao nhất của thí sinh trong 1 cuộc thi */
export async function layDiemCaoNhat(thiSinhId: number, cuocThiId: number): Promise<number> {
  const { data, error } = await supabase.rpc('lay_diem_cao_nhat', {
    p_thi_sinh_id: thiSinhId,
    p_cuoc_thi_id: cuocThiId,
  });
  if (error) throw error;
  return data as number;
}
