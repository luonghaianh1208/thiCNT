-- ============================================================
-- THI CNT — Security Migration v3
-- Chạy toàn bộ script này trong Supabase Dashboard → SQL Editor
-- ⚠️ CHẠY SAU migration v2 (supabase-migration-thicnt.sql)
-- ============================================================

-- ============================================================
-- 1. ENABLE pgcrypto extension (cần cho bcrypt)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 2. UPDATE admin password → bcrypt hash
-- ============================================================

UPDATE admin_users
SET password_hash = crypt('Admin@1234', gen_salt('bf'))
WHERE username = 'admin';

-- ============================================================
-- 3. FIX verify_admin_login → dùng bcrypt thay vì plaintext
-- ============================================================

CREATE OR REPLACE FUNCTION verify_admin_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_password_hash TEXT;
BEGIN
  SELECT password_hash INTO v_password_hash
  FROM admin_users
  WHERE username = p_username;

  IF v_password_hash IS NULL THEN
    RETURN false;
  END IF;

  -- So sánh bằng bcrypt hash thay vì plaintext
  RETURN v_password_hash = crypt(p_password, v_password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 4. UNIQUE constraint cho canh_bao_gian_lan (cần cho ON CONFLICT)
-- ============================================================

-- Drop existing index nếu có
DROP INDEX IF EXISTS idx_canh_bao_unique;

-- Thêm UNIQUE constraint
ALTER TABLE canh_bao_gian_lan
  DROP CONSTRAINT IF EXISTS uq_canh_bao_thi_sinh_cuoc_thi;

ALTER TABLE canh_bao_gian_lan
  ADD CONSTRAINT uq_canh_bao_thi_sinh_cuoc_thi
  UNIQUE (thi_sinh_id, cuoc_thi_id);

-- ============================================================
-- 5. FIX RLS — Chặn dap_an_dung khỏi public read
--    Dùng column-level GRANT trên anon role
-- ============================================================

-- Bước 1: Revoke ALL trên cau_hoi cho anon
REVOKE ALL ON cau_hoi FROM anon;

-- Bước 2: GRANT SELECT chỉ các cột KHÔNG chứa đáp án đúng cho anon
GRANT SELECT (id, cuoc_thi_id, noi_dung, dap_an_a, dap_an_b, dap_an_c, dap_an_d, active)
ON cau_hoi TO anon;

-- Bước 3: authenticated role vẫn có full access (cho admin)
GRANT ALL ON cau_hoi TO authenticated;

-- ============================================================
-- 6. FIX RLS Policies — Thắt chặt admin policies
-- ============================================================

-- === don_vi: public chỉ đọc, chỉ authenticated mới sửa/xóa ===
DROP POLICY IF EXISTS "don_vi_admin_all" ON don_vi;
CREATE POLICY "don_vi_authenticated_write" ON don_vi
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- === cuoc_thi: public chỉ đọc, chỉ authenticated mới sửa/xóa ===
DROP POLICY IF EXISTS "cuoc_thi_admin_all" ON cuoc_thi;
CREATE POLICY "cuoc_thi_authenticated_write" ON cuoc_thi
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- === cau_hoi: public đọc (không đáp án), chỉ authenticated sửa ===
DROP POLICY IF EXISTS "cau_hoi_admin_all" ON cau_hoi;
CREATE POLICY "cau_hoi_authenticated_write" ON cau_hoi
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- === trang_chu: public đọc, chỉ authenticated sửa ===
DROP POLICY IF EXISTS "trang_chu_admin_all" ON trang_chu;
CREATE POLICY "trang_chu_authenticated_write" ON trang_chu
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- === admin_users: chỉ authenticated đọc ===
DROP POLICY IF EXISTS "admin_users_admin_read" ON admin_users;
CREATE POLICY "admin_users_authenticated_read" ON admin_users
  FOR SELECT USING (auth.role() = 'authenticated');

-- === ket_qua: đã OK — public insert, public read ===
-- (Giữ nguyên vì thí sinh cần xem kết quả)

-- === canh_bao_gian_lan: update chỉ cho authenticated ===
DROP POLICY IF EXISTS "canh_bao_admin_update" ON canh_bao_gian_lan;
CREATE POLICY "canh_bao_authenticated_update" ON canh_bao_gian_lan
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 7. FIX thi_sinh — thêm index cho hiệu năng
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_thi_sinh_donvi ON thi_sinh(don_vi_id);

-- ============================================================
-- DONE!
-- Sau khi chạy, password admin vẫn là: Admin@1234
-- Nhưng bây giờ được lưu dưới dạng bcrypt hash
-- ============================================================
