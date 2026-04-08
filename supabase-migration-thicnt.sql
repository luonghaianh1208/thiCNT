-- ============================================================
-- THI CNT — Database Migration v2
-- Chạy toàn bộ script này trong Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- 1. DROP (bỏ comment nếu muốn reset hoàn toàn)
-- ============================================================
-- DROP TABLE IF EXISTS canh_bao_gian_lan CASCADE;
-- DROP TABLE IF EXISTS ket_qua CASCADE;
-- DROP TABLE IF EXISTS thi_sinh CASCADE;
-- DROP TABLE IF EXISTS cau_hoi CASCADE;
-- DROP TABLE IF EXISTS cuoc_thi CASCADE;
-- DROP TABLE IF EXISTS don_vi CASCADE;
-- DROP TABLE IF EXISTS admin_users CASCADE;
-- DROP FUNCTION IF EXISTS kiem_tra_luot_thi(TEXT, INTEGER);
-- DROP FUNCTION IF EXISTS dem_luot_da_thi(INTEGER, INTEGER);
-- DROP FUNCTION IF EXISTS lay_diem_cao_nhat(INTEGER, INTEGER);
-- DROP FUNCTION IF EXISTS kiem_tra_da_thi_chu(TEXT);
-- DROP FUNCTION IF EXISTS nop_bai_va_cham_diem(INTEGER, INTEGER, INTEGER, JSONB);
-- DROP FUNCTION IF EXISTS ghi_canh_bao_gian_lan(INTEGER, INTEGER);
-- DROP FUNCTION IF EXISTS verify_admin_login(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS get_thong_ke(INTEGER);

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Đơn vị / Lớp
CREATE TABLE IF NOT EXISTS don_vi (
  id SERIAL PRIMARY KEY,
  ten TEXT NOT NULL,
  lop TEXT NOT NULL DEFAULT ''
);

-- Cuộc thi
CREATE TABLE IF NOT EXISTS cuoc_thi (
  id SERIAL PRIMARY KEY,
  ten TEXT NOT NULL,
  mo_ta TEXT DEFAULT '',
  anh_banner TEXT DEFAULT '',
  bat_dau TIMESTAMPTZ NOT NULL,
  ket_thuc TIMESTAMPTZ NOT NULL,
  so_cau_hoi INTEGER NOT NULL DEFAULT 10,
  thoi_gian_lam_phut INTEGER NOT NULL DEFAULT 15,
  gioi_han_luot INTEGER NOT NULL DEFAULT 3,
  gioi_han_gian_lan INTEGER NOT NULL DEFAULT 3
);

-- Câu hỏi
CREATE TABLE IF NOT EXISTS cau_hoi (
  id SERIAL PRIMARY KEY,
  cuoc_thi_id INTEGER REFERENCES cuoc_thi(id) ON DELETE CASCADE,
  noi_dung TEXT NOT NULL,
  dap_an_a TEXT NOT NULL,
  dap_an_b TEXT NOT NULL,
  dap_an_c TEXT NOT NULL,
  dap_an_d TEXT NOT NULL,
  dap_an_dung TEXT NOT NULL CHECK (dap_an_dung IN ('A','B','C','D','a','b','c','d')),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Thí sinh
CREATE TABLE IF NOT EXISTS thi_sinh (
  id SERIAL PRIMARY KEY,
  ho_ten TEXT NOT NULL,
  so_dien_thoai TEXT NOT NULL,
  don_vi_id INTEGER REFERENCES don_vi(id),
  ten_lop TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kết quả thi (mỗi lượt = 1 dòng)
CREATE TABLE IF NOT EXISTS ket_qua (
  id SERIAL PRIMARY KEY,
  thi_sinh_id INTEGER REFERENCES thi_sinh(id) ON DELETE CASCADE,
  cuoc_thi_id INTEGER REFERENCES cuoc_thi(id) ON DELETE CASCADE,
  luot_thi INTEGER NOT NULL DEFAULT 1,
  diem NUMERIC NOT NULL,
  so_cau_dung INTEGER NOT NULL,
  tong_cau INTEGER NOT NULL,
  thoi_gian_lam INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cảnh báo gian lận
CREATE TABLE IF NOT EXISTS canh_bao_gian_lan (
  id SERIAL PRIMARY KEY,
  thi_sinh_id INTEGER REFERENCES thi_sinh(id) ON DELETE CASCADE,
  cuoc_thi_id INTEGER REFERENCES cuoc_thi(id) ON DELETE CASCADE,
  so_lan INTEGER NOT NULL DEFAULT 1,
  lan_cuoi TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin credentials
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_cau_hoi_cuoc_thi ON cau_hoi(cuoc_thi_id);
CREATE INDEX IF NOT EXISTS idx_cau_hoi_active ON cau_hoi(cuoc_thi_id, active);
CREATE INDEX IF NOT EXISTS idx_thi_sinh_sdt ON thi_sinh(so_dien_thoai);
CREATE INDEX IF NOT EXISTS idx_ket_qua_cuoc_thi ON ket_qua(cuoc_thi_id);
CREATE INDEX IF NOT EXISTS idx_ket_qua_thi_sinh ON ket_qua(thi_sinh_id);
CREATE INDEX IF NOT EXISTS idx_canh_bao_ts_ct ON canh_bao_gian_lan(thi_sinh_id, cuoc_thi_id);

-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

-- Kiểm tra số lượt còn lại — trả về 'con_luot', 'het_luot'
CREATE OR REPLACE FUNCTION kiem_tra_luot_thi(
  p_sdt TEXT,
  p_cuoc_thi_id INTEGER
)
RETURNS TEXT AS $$
DECLARE
  v_luot_da_thi INTEGER;
  v_gioi_han INTEGER;
BEGIN
  SELECT gioi_han_luot INTO v_gioi_han
  FROM cuoc_thi WHERE id = p_cuoc_thi_id;

  IF v_gioi_han IS NULL THEN
    RETURN 'khong_ton_tai';
  END IF;

  SELECT COUNT(*) INTO v_luot_da_thi
  FROM ket_qua kq
  JOIN thi_sinh ts ON ts.id = kq.thi_sinh_id
  WHERE ts.so_dien_thoai = p_sdt AND kq.cuoc_thi_id = p_cuoc_thi_id;

  IF v_luot_da_thi >= v_gioi_han THEN
    RETURN 'het_luot';
  END IF;

  RETURN 'con_luot';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Đếm số lượt đã thi
CREATE OR REPLACE FUNCTION dem_luot_da_thi(
  p_thi_sinh_id INTEGER,
  p_cuoc_thi_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM ket_qua
  WHERE thi_sinh_id = p_thi_sinh_id AND cuoc_thi_id = p_cuoc_thi_id;
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lấy điểm cao nhất
CREATE OR REPLACE FUNCTION lay_diem_cao_nhat(
  p_thi_sinh_id INTEGER,
  p_cuoc_thi_id INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
  v_diem NUMERIC;
BEGIN
  SELECT MAX(diem) INTO v_diem
  FROM ket_qua
  WHERE thi_sinh_id = p_thi_sinh_id AND cuoc_thi_id = p_cuoc_thi_id;
  RETURN COALESCE(v_diem, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kiểm tra đã thi cuộc thi nào chưa — trả về tên cuộc thi đã thi
CREATE OR REPLACE FUNCTION kiem_tra_da_thi_chu(p_sdt TEXT)
RETURNS TEXT AS $$
DECLARE
  v_ten TEXT;
BEGIN
  SELECT ct.ten INTO v_ten
  FROM thi_sinh ts
  JOIN ket_qua kq ON kq.thi_sinh_id = ts.id
  JOIN cuoc_thi ct ON ct.id = kq.cuoc_thi_id
  WHERE ts.so_dien_thoai = p_sdt
  LIMIT 1;
  RETURN COALESCE(v_ten, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nộp bài và chấm điểm server-side
CREATE OR REPLACE FUNCTION nop_bai_va_cham_diem(
  p_thi_sinh_id INTEGER,
  p_cuoc_thi_id INTEGER,
  p_thoi_gian_lam INTEGER,
  p_answers JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_diem NUMERIC := 0;
  v_so_cau_dung INTEGER := 0;
  v_tong_cau INTEGER;
  v_luot_thi INTEGER;
  v_answer JSONB;
  v_dap_an_dung TEXT;
BEGIN
  SELECT COALESCE(COUNT(*), 0) + 1 INTO v_luot_thi
  FROM ket_qua
  WHERE thi_sinh_id = p_thi_sinh_id AND cuoc_thi_id = p_cuoc_thi_id;

  SELECT COUNT(*) INTO v_tong_cau
  FROM cau_hoi
  WHERE cuoc_thi_id = p_cuoc_thi_id AND active = true;

  FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    SELECT ch.dap_an_dung INTO v_dap_an_dung
    FROM cau_hoi ch
    WHERE ch.id = (v_answer->>'cau_hoi_id')::INTEGER;

    IF v_dap_an_dung IS NOT NULL THEN
      IF UPPER(v_dap_an_dung) = UPPER((v_answer->>'lua_chon')::TEXT) THEN
        v_diem := v_diem + 1;
        v_so_cau_dung := v_so_cau_dung + 1;
      END IF;
      v_answer := jsonb_set(v_answer, '{dung}', to_jsonb(UPPER(v_dap_an_dung) = UPPER((v_answer->>'lua_chon')::TEXT)));
    END IF;
  END LOOP;

  INSERT INTO ket_qua (thi_sinh_id, cuoc_thi_id, luot_thi, diem, so_cau_dung, tong_cau, thoi_gian_lam, answers)
  VALUES (p_thi_sinh_id, p_cuoc_thi_id, v_luot_thi, v_diem, v_so_cau_dung, v_tong_cau, p_thoi_gian_lam, p_answers);

  RETURN jsonb_build_object(
    'diem', v_diem,
    'so_cau_dung', v_so_cau_dung,
    'tong_cau', v_tong_cau,
    'luot_thi', v_luot_thi
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ghi cảnh báo gian lận
CREATE OR REPLACE FUNCTION ghi_canh_bao_gian_lan(
  p_thi_sinh_id INTEGER,
  p_cuoc_thi_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_so_lan INTEGER;
BEGIN
  INSERT INTO canh_bao_gian_lan (thi_sinh_id, cuoc_thi_id, so_lan, lan_cuoi)
  VALUES (p_thi_sinh_id, p_cuoc_thi_id, 1, NOW())
  ON CONFLICT (thi_sinh_id, cuoc_thi_id)
  DO UPDATE SET
    so_lan = canh_bao_gian_lan.so_lan + 1,
    lan_cuoi = NOW();

  SELECT so_lan INTO v_so_lan
  FROM canh_bao_gian_lan
  WHERE thi_sinh_id = p_thi_sinh_id AND cuoc_thi_id = p_cuoc_thi_id;

  RETURN v_so_lan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify admin login
CREATE OR REPLACE FUNCTION verify_admin_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT password_hash INTO v_hash
  FROM admin_users
  WHERE username = p_username;

  IF v_hash IS NULL THEN
    RETURN false;
  END IF;

  RETURN crypt(p_password, v_hash) = v_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Thống kê tổng quan
CREATE OR REPLACE FUNCTION get_thong_ke(p_cuoc_thi_id INTEGER DEFAULT NULL)
RETURNS TABLE(
  tong_thi_sinh BIGINT,
  tong_luot_thi BIGINT,
  diem_trung_binh NUMERIC
) AS $$
BEGIN
  IF p_cuoc_thi_id IS NULL THEN
    RETURN QUERY SELECT
      COUNT(DISTINCT ts.id)::BIGINT,
      COUNT(kq.id)::BIGINT,
      COALESCE(AVG(subq.max_diem), 0)::NUMERIC
    FROM thi_sinh ts
    LEFT JOIN ket_qua kq ON kq.thi_sinh_id = ts.id
    LEFT JOIN LATERAL (
      SELECT MAX(kq2.diem) as max_diem
      FROM ket_qua kq2
      WHERE kq2.thi_sinh_id = ts.id
    ) subq ON true;
  ELSE
    RETURN QUERY SELECT
      COUNT(DISTINCT ts.id)::BIGINT,
      COUNT(kq.id)::BIGINT,
      COALESCE(AVG(subq.max_diem), 0)::NUMERIC
    FROM thi_sinh ts
    JOIN ket_qua kq ON kq.thi_sinh_id = ts.id AND kq.cuoc_thi_id = p_cuoc_thi_id
    JOIN LATERAL (
      SELECT MAX(kq2.diem) as max_diem
      FROM ket_qua kq2
      WHERE kq2.thi_sinh_id = ts.id AND kq2.cuoc_thi_id = p_cuoc_thi_id
    ) subq ON true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE don_vi ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuoc_thi ENABLE ROW LEVEL SECURITY;
ALTER TABLE cau_hoi ENABLE ROW LEVEL SECURITY;
ALTER TABLE thi_sinh ENABLE ROW LEVEL SECURITY;
ALTER TABLE ket_qua ENABLE ROW LEVEL SECURITY;
ALTER TABLE canh_bao_gian_lan ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "don_vi_public_read" ON don_vi FOR SELECT USING (true);
CREATE POLICY "don_vi_admin_all" ON don_vi FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE username = current_setting('request.jwt.username', true))
);

CREATE POLICY "cuoc_thi_public_read" ON cuoc_thi FOR SELECT USING (true);
CREATE POLICY "cuoc_thi_admin_all" ON cuoc_thi FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE username = current_setting('request.jwt.username', true))
);

CREATE POLICY "cau_hoi_public_read" ON cau_hoi FOR SELECT USING (true);
CREATE POLICY "cau_hoi_admin_all" ON cau_hoi FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE username = current_setting('request.jwt.username', true))
);

CREATE POLICY "thi_sinh_public_insert" ON thi_sinh FOR INSERT WITH CHECK (true);
CREATE POLICY "thi_sinh_admin_read" ON thi_sinh FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE username = current_setting('request.jwt.username', true))
);
CREATE POLICY "thi_sinh_admin_delete" ON thi_sinh FOR DELETE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE username = current_setting('request.jwt.username', true))
);

CREATE POLICY "ket_qua_public_insert" ON ket_qua FOR INSERT WITH CHECK (true);
CREATE POLICY "ket_qua_admin_read" ON ket_qua FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE username = current_setting('request.jwt.username', true))
);

CREATE POLICY "canh_bao_public_insert" ON canh_bao_gian_lan FOR INSERT WITH CHECK (true);
CREATE POLICY "canh_bao_admin_read" ON canh_bao_gian_lan FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE username = current_setting('request.jwt.username', true))
);
CREATE POLICY "canh_bao_admin_update" ON canh_bao_gian_lan FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE username = current_setting('request.jwt.username', true))
);

CREATE POLICY "admin_users_admin_read" ON admin_users FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE username = current_setting('request.jwt.username', true))
);

-- ============================================================
-- 6. SEED — Tài khoản admin mặc định
--    Password: Admin@1234 — đổi ngay sau khi chạy xong!
-- ============================================================

INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '$2a$10$rQZ8K7xX5O9Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- 7. SEED DATA MẪU (xóa phần này trong production)
-- ============================================================

-- Lớp mẫu
INSERT INTO don_vi (ten, lop) VALUES
  ('Trường THPT Chuyên Nguyễn Trãi', '10A1'),
  ('Trường THPT Chuyên Nguyễn Trãi', '10A2'),
  ('Trường THPT Chuyên Nguyễn Trãi', '10A3'),
  ('Trường THPT Chuyên Nguyễn Trãi', '11A1'),
  ('Trường THPT Chuyên Nguyễn Trãi', '11A2'),
  ('Trường THPT Chuyên Nguyễn Trãi', '12A1')
ON CONFLICT DO NOTHING;

-- Cuộc thi mẫu
INSERT INTO cuoc_thi (ten, mo_ta, anh_banner, bat_dau, ket_thuc, so_cau_hoi, thoi_gian_lam_phut, gioi_han_luot, gioi_han_gian_lan)
VALUES (
  'Cuộc thi Chuyển đổi số lần 1',
  'Cuộc thi hưởng ứng ngày Chuyển đổi số quốc gia, dành cho học sinh toàn trường.',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=400&fit=crop',
  NOW(),
  NOW() + INTERVAL '7 days',
  10,
  15,
  3,
  3
) ON CONFLICT DO NOTHING;

-- Câu hỏi mẫu
DO $$
DECLARE
  v_ct_id INTEGER;
BEGIN
  SELECT id INTO v_ct_id FROM cuoc_thi LIMIT 1;
  IF v_ct_id IS NOT NULL THEN
    INSERT INTO cau_hoi (cuoc_thi_id, noi_dung, dap_an_a, dap_an_b, dap_an_c, dap_an_d, dap_an_dung)
    VALUES
      (v_ct_id, 'Chuyển đổi số là gì?', 'Ứng dụng công nghệ số trong mọi lĩnh vực', 'Số hóa tài liệu giấy', 'Sử dụng máy tính', 'Sử dụng điện thoại thông minh', 'A'),
      (v_ct_id, 'Cơ sở dữ liệu quốc gia về dân cư Việt Nam tên là gì?', 'CSDL Dân cư Quốc gia', 'CSDL Bộ Công an', 'CSDL Bộ Thông tin', 'CSDL Chính phủ', 'A'),
      (v_ct_id, 'Nghị quyết số 13 của Bộ Chính trị về chuyển đổi số được ban hành năm nào?', '2020', '2019', '2021', '2022', 'C'),
      (v_ct_id, 'Mục tiêu đến 2025, Việt Nam phấn đấu có bao nhiêu % dân số có tài khoản thanh toán điện tử?', '70%', '50%', '80%', '60%', 'B'),
      (v_ct_id, 'Đề án phát triển hạ tầng số quốc gia giai đoạn 2021-2025 được phê duyệt bởi ai?', 'Thủ tướng Chính phủ', 'Bộ trưởng Bộ TT&TT', 'Chủ tịch nước', 'Quốc hội', 'A')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
