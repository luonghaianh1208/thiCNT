import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DonVi {
  id: number;
  ten: string;
  loai: string;
}

export interface ChangThi {
  id: number;
  ten: string;
  bat_dau: string;
  ket_thuc: string;
  so_cau: number;
  thoi_gian_phut: number;
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
  chang_id: number;
  active: boolean;
}

export interface ThiSinh {
  id: number;
  ho_ten: string;
  so_dien_thoai: string;
  don_vi_id: number;
  ten_don_vi_nho: string;
}

export interface KetQua {
  id: number;
  thi_sinh_id: number;
  chang_id: number;
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
  chang_id: number;
  so_lan: number;
  lan_cuoi: string;
  created_at: string;
}

// ─── Public (Contestant) functions ───────────────────────────────────────────

/** Lấy chặng thi đang mở (hiện tại trong khoảng thời gian) */
export async function getChangDangMo(): Promise<ChangThi | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('chang_thi')
    .select('*')
    .lte('bat_dau', now)
    .gte('ket_thuc', now)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Lấy tất cả chặng thi (cho trang chủ) */
export async function getAllChangThiPublic(): Promise<ChangThi[]> {
  const { data, error } = await supabase
    .from('chang_thi')
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

/** Kiểm tra thí sinh đã thi bất kỳ chặng nào chưa — trả về tên chặng đã thi, rỗng nếu chưa thi */
export async function kiemTraDaThiChu(soDienThoai: string, hoTen: string, donViId: number): Promise<string> {
  const { data, error } = await supabase.rpc('kiem_tra_da_thi_chu', {
    p_sdt: soDienThoai.trim(),
    p_ho_ten: hoTen.trim(),
    p_don_vi_id: donViId,
  });
  if (error) throw error;
  return data as string;
}

/** Kiểm tra thí sinh (theo SĐT) đã thi chặng này chưa — dùng RPC 1 query */
export async function kiemTraDaThi(soDienThoai: string, changId: number, hoTen?: string, donViId?: number): Promise<'ok' | 'sdt' | 'trung_lap'> {
  const { data, error } = await supabase.rpc('kiem_tra_da_thi', {
    p_sdt: soDienThoai.trim(),
    p_chang_id: changId,
    p_ho_ten: hoTen || null,
    p_don_vi_id: donViId || null,
  });
  if (error) throw error;
  return data as 'ok' | 'sdt' | 'trung_lap';
}

/** Tạo thí sinh mới và trả về ID */
export async function taoThiSinh(data: {
  ho_ten: string;
  so_dien_thoai: string;
  don_vi_id: number;
  ten_don_vi_nho: string;
}): Promise<number> {
  const { data: result, error } = await supabase
    .from('thi_sinh')
    .insert(data)
    .select('id')
    .single();
  if (error) throw error;
  return result.id;
}

/** Lấy câu hỏi ngẫu nhiên cho chặng thi
 *  SECURITY: KHÔNG select dap_an_dung — đáp án đúng chỉ được chấm server-side
 */
export async function layCauHoiNgauNhien(changId: number, soCau: number): Promise<CauHoi[]> {
  const { data, error } = await supabase
    .from('cau_hoi')
    .select('id, noi_dung, dap_an_a, dap_an_b, dap_an_c, dap_an_d, chang_id, active')
    .eq('chang_id', changId)
    .eq('active', true);
  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Fisher-Yates shuffle
  const shuffled = [...data];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(soCau, shuffled.length));
}

/** Nộp bài và chấm điểm server-side (SECURITY: đáp án đúng không bao giờ lộ ra client)
 *  answers: [{cau_hoi_id, lua_chon}] — lua_chon là key gốc lowercase (a/b/c/d)
 *  Returns: {diem, so_cau_dung, tong_cau}
 */
export async function nopBaiVaChamDiem(params: {
  thi_sinh_id: number;
  chang_id: number;
  thoi_gian_lam: number;
  answers: { cau_hoi_id: number; lua_chon: string }[];
}): Promise<{ diem: number; so_cau_dung: number; tong_cau: number }> {
  const { data, error } = await supabase.rpc('nop_bai_va_cham_diem', {
    p_thi_sinh_id: params.thi_sinh_id,
    p_chang_id: params.chang_id,
    p_thoi_gian_lam: params.thoi_gian_lam,
    p_answers: params.answers,
  });
  if (error) throw error;
  return data as { diem: number; so_cau_dung: number; tong_cau: number };
}

// ─── Gian lận ─────────────────────────────────────────────────────────────────

/** Ghi/cập nhật cảnh báo gian lận (upsert theo thi_sinh + chang).
 *  Trả về số lần vi phạm hiện tại.
 */
export async function ghiCanhBaoGianLan(thiSinhId: number, changId: number): Promise<number> {
  const { data, error } = await supabase.rpc('ghi_canh_bao_gian_lan', {
    p_thi_sinh_id: thiSinhId,
    p_chang_id: changId,
  });
  if (error) throw error;
  return data as number;
}

/** Lấy danh sách cảnh báo gian lận (kèm thông tin thí sinh và chặng) */
export async function getCanhBaoGianLan(changId?: number): Promise<any[]> {
  let query = supabase
    .from('canh_bao_gian_lan')
    .select('*, thi_sinh(ho_ten, so_dien_thoai, ten_don_vi_nho, don_vi(ten)), chang_thi(ten)')
    .order('so_lan', { ascending: false });
  if (changId) query = query.eq('chang_id', changId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
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

// Chặng thi
export async function getAllChangThi(): Promise<ChangThi[]> {
  const { data, error } = await supabase.from('chang_thi').select('*').order('id');
  if (error) throw error;
  return data || [];
}

export async function addChangThi(ct: Omit<ChangThi, 'id'>): Promise<void> {
  const { error } = await supabase.from('chang_thi').insert(ct);
  if (error) throw error;
}

export async function updateChangThi(id: number, ct: Partial<ChangThi>): Promise<void> {
  const { error } = await supabase.from('chang_thi').update(ct).eq('id', id);
  if (error) throw error;
}

export async function deleteChangThi(id: number): Promise<void> {
  const { error } = await supabase.from('chang_thi').delete().eq('id', id);
  if (error) throw error;
}

// Câu hỏi
export async function getCauHoiByChang(changId: number): Promise<CauHoi[]> {
  const { data, error } = await supabase
    .from('cau_hoi')
    .select('*')
    .eq('chang_id', changId)
    .order('id');
  if (error) throw error;
  return data || [];
}

export async function addCauHoi(ch: Omit<CauHoi, 'id' | 'active'>): Promise<void> {
  const { error } = await supabase.from('cau_hoi').insert({ ...ch, active: true });
  if (error) throw error;
}

export async function updateCauHoi(id: number, ch: Partial<CauHoi>): Promise<void> {
  const { error } = await supabase.from('cau_hoi').update(ch).eq('id', id);
  if (error) throw error;
}

export async function deleteCauHoi(id: number): Promise<void> {
  const { error } = await supabase.from('cau_hoi').delete().eq('id', id);
  if (error) throw error;
}

export async function bulkInsertCauHoi(cauHois: Omit<CauHoi, 'id'>[]): Promise<void> {
  const { error } = await supabase.from('cau_hoi').insert(cauHois);
  if (error) throw error;
}

// Đơn vị
export async function addDonVi(ten: string, loai: string): Promise<void> {
  const { error } = await supabase.from('don_vi').insert({ ten, loai });
  if (error) throw error;
}

export async function bulkInsertDonVi(items: { ten: string; loai: string }[]): Promise<void> {
  if (items.length === 0) return;
  const { error } = await supabase.from('don_vi').insert(items);
  if (error) throw error;
}

export async function updateDonVi(id: number, ten: string, loai: string): Promise<void> {
  const { error } = await supabase.from('don_vi').update({ ten, loai }).eq('id', id);
  if (error) throw error;
}

export async function deleteDonVi(id: number): Promise<void> {
  const { error } = await supabase.from('don_vi').delete().eq('id', id);
  if (error) throw error;
}

// Thí sinh
export async function getAllThiSinh(): Promise<any[]> {
  const { data, error } = await supabase
    .from('thi_sinh')
    .select('*, don_vi(ten)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function bulkInsertThiSinh(list: { ho_ten: string; so_dien_thoai: string }[]): Promise<void> {
  const { error } = await supabase.from('thi_sinh').insert(list);
  if (error) throw error;
}

export async function deleteThiSinh(id: number): Promise<void> {
  const { error } = await supabase.from('thi_sinh').delete().eq('id', id);
  if (error) throw error;
}

// Kết quả
export async function getKetQuaAdmin(changId?: number): Promise<any[]> {
  let query = supabase
    .from('ket_qua')
    .select('*, thi_sinh(ho_ten, so_dien_thoai, ten_don_vi_nho, don_vi(ten)), chang_thi(ten)')
    .order('diem', { ascending: false });
  if (changId) query = query.eq('chang_id', changId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Thống kê tổng quan — DB tính avg, chỉ trả về kết quả
export async function getThongKe(changId?: number): Promise<{
  tongThiSinh: number;
  tongLuotThi: number;
  diemTrungBinh: number;
}> {
  const { data, error } = await supabase.rpc('get_thong_ke', {
    p_chang_id: changId ?? null,
  });
  if (error) throw error;
  // RPC trả về array 1 row
  const row = (data as any[])[0];
  return {
    tongThiSinh: Number(row.tong_thi_sinh),
    tongLuotThi: Number(row.tong_luot_thi),
    diemTrungBinh: Number(row.diem_trung_binh),
  };
}
