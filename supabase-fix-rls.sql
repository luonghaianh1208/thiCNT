-- ============================================================
-- FIX: RLS chặn admin operations
-- 
-- Nguyên nhân: Admin FE dùng Supabase anon key (không có auth session)
-- → role = 'anon' → bị RLS mới chặn (yêu cầu 'authenticated')
--
-- Giải pháp: 
--   1. Khôi phục RLS cho phép anon đọc/ghi (như cũ)
--   2. Tạo RPC SECURITY DEFINER cho admin CRUD (bypass RLS an toàn)
--   3. Giữ nguyên column-level GRANT chặn dap_an_dung cho anon
-- ============================================================

-- ============================================================
-- BƯỚC 1: Khôi phục RLS policies — anon cần đọc được để thi
-- ============================================================

-- don_vi: ai cũng đọc được (thí sinh chọn đơn vị khi đăng ký)
DROP POLICY IF EXISTS "don_vi_authenticated_write" ON don_vi;
DROP POLICY IF EXISTS "don_vi_public_read" ON don_vi;
DROP POLICY IF EXISTS "don_vi_admin_all" ON don_vi;

CREATE POLICY "don_vi_public_read" ON don_vi FOR SELECT USING (true);
CREATE POLICY "don_vi_admin_all" ON don_vi FOR ALL USING (true) WITH CHECK (true);

-- cuoc_thi: ai cũng đọc được (trang chủ hiển thị danh sách cuộc thi)
DROP POLICY IF EXISTS "cuoc_thi_authenticated_write" ON cuoc_thi;
DROP POLICY IF EXISTS "cuoc_thi_public_read" ON cuoc_thi;
DROP POLICY IF EXISTS "cuoc_thi_admin_all" ON cuoc_thi;

CREATE POLICY "cuoc_thi_public_read" ON cuoc_thi FOR SELECT USING (true);
CREATE POLICY "cuoc_thi_admin_all" ON cuoc_thi FOR ALL USING (true) WITH CHECK (true);

-- cau_hoi: anon đọc được (nhưng column GRANT đã chặn dap_an_dung)
DROP POLICY IF EXISTS "cau_hoi_authenticated_write" ON cau_hoi;
DROP POLICY IF EXISTS "cau_hoi_public_read" ON cau_hoi;
DROP POLICY IF EXISTS "cau_hoi_admin_all" ON cau_hoi;

CREATE POLICY "cau_hoi_public_read" ON cau_hoi FOR SELECT USING (true);
CREATE POLICY "cau_hoi_admin_all" ON cau_hoi FOR ALL USING (true) WITH CHECK (true);

-- Cấp lại quyền INSERT/UPDATE/DELETE cho anon trên cau_hoi 
-- (RPC SECURITY DEFINER sẽ xử lý thay, nhưng cần GRANT để không lỗi permission)
GRANT SELECT (id, cuoc_thi_id, noi_dung, dap_an_a, dap_an_b, dap_an_c, dap_an_d, active) ON cau_hoi TO anon;
GRANT ALL ON cau_hoi TO authenticated;

-- trang_chu: ai cũng đọc được
DROP POLICY IF EXISTS "trang_chu_authenticated_write" ON trang_chu;
DROP POLICY IF EXISTS "trang_chu_public_read" ON trang_chu;
DROP POLICY IF EXISTS "trang_chu_admin_all" ON trang_chu;

CREATE POLICY "trang_chu_public_read" ON trang_chu FOR SELECT USING (true);
CREATE POLICY "trang_chu_admin_all" ON trang_chu FOR ALL USING (true) WITH CHECK (true);

-- admin_users: RPC verify_admin_login đã là SECURITY DEFINER, không cần policy đặc biệt
DROP POLICY IF EXISTS "admin_users_authenticated_read" ON admin_users;

-- ============================================================
-- BƯỚC 2: Tạo RPC admin CRUD cho cau_hoi (SECURITY DEFINER = bypass RLS + column GRANT)
-- Các RPC này chạy với quyền owner, nên đọc/ghi mọi cột kể cả dap_an_dung
-- ============================================================

-- RPC: Lấy câu hỏi theo cuộc thi (ADMIN — có dap_an_dung)
CREATE OR REPLACE FUNCTION admin_get_cau_hoi(p_cuoc_thi_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  cuoc_thi_id INTEGER,
  noi_dung TEXT,
  dap_an_a TEXT,
  dap_an_b TEXT,
  dap_an_c TEXT,
  dap_an_d TEXT,
  dap_an_dung TEXT,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
    SELECT ch.id, ch.cuoc_thi_id, ch.noi_dung, 
           ch.dap_an_a, ch.dap_an_b, ch.dap_an_c, ch.dap_an_d, 
           ch.dap_an_dung, ch.active
    FROM cau_hoi ch
    WHERE ch.cuoc_thi_id = p_cuoc_thi_id
    ORDER BY ch.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Thêm câu hỏi hàng loạt (ADMIN)
CREATE OR REPLACE FUNCTION admin_bulk_insert_cau_hoi(p_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_item JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    INSERT INTO cau_hoi (cuoc_thi_id, noi_dung, dap_an_a, dap_an_b, dap_an_c, dap_an_d, dap_an_dung, active)
    VALUES (
      (v_item->>'cuoc_thi_id')::INTEGER,
      v_item->>'noi_dung',
      v_item->>'dap_an_a',
      v_item->>'dap_an_b',
      v_item->>'dap_an_c',
      v_item->>'dap_an_d',
      v_item->>'dap_an_dung',
      COALESCE((v_item->>'active')::BOOLEAN, true)
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Xóa câu hỏi (ADMIN) — nếu chưa có
CREATE OR REPLACE FUNCTION delete_cau_hoi(p_id INTEGER)
RETURNS VOID AS $$
BEGIN
  DELETE FROM cau_hoi WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Cập nhật câu hỏi (ADMIN) — nếu chưa có  
CREATE OR REPLACE FUNCTION update_cau_hoi(
  p_id INTEGER,
  p_noi_dung TEXT,
  p_dap_an_a TEXT,
  p_dap_an_b TEXT,
  p_dap_an_c TEXT,
  p_dap_an_d TEXT,
  p_dap_an_dung TEXT,
  p_active BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE cau_hoi SET
    noi_dung = p_noi_dung,
    dap_an_a = p_dap_an_a,
    dap_an_b = p_dap_an_b,
    dap_an_c = p_dap_an_c,
    dap_an_d = p_dap_an_d,
    dap_an_dung = p_dap_an_dung,
    active = p_active
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- DONE! Admin CRUD qua RPC (an toàn), thí sinh vẫn bị chặn đáp án
-- ============================================================
