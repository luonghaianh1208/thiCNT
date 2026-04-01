-- ============================================================
-- SETUP DATABASE - Cuộc thi Chuyển đổi số Thành đoàn Hải Phòng
-- Chạy script này trong Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/nloaugmnbqcvzqfiotyl/sql
-- ============================================================

-- 1. Bảng đơn vị đoàn (xã, phường, đặc khu, đoàn trực thuộc)
CREATE TABLE IF NOT EXISTS don_vi (
  id SERIAL PRIMARY KEY,
  ten TEXT NOT NULL,
  loai TEXT NOT NULL DEFAULT 'phuong', -- 'xa', 'phuong', 'dac_khu', 'doan_truc_thuoc'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng chặng thi
CREATE TABLE IF NOT EXISTS chang_thi (
  id SERIAL PRIMARY KEY,
  ten TEXT NOT NULL,
  bat_dau TIMESTAMPTZ NOT NULL,
  ket_thuc TIMESTAMPTZ NOT NULL,
  so_cau INTEGER NOT NULL DEFAULT 30,
  thoi_gian_phut INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ngân hàng câu hỏi
CREATE TABLE IF NOT EXISTS cau_hoi (
  id SERIAL PRIMARY KEY,
  noi_dung TEXT NOT NULL,
  dap_an_a TEXT NOT NULL,
  dap_an_b TEXT NOT NULL,
  dap_an_c TEXT NOT NULL,
  dap_an_d TEXT NOT NULL,
  dap_an_dung TEXT NOT NULL CHECK (dap_an_dung IN ('A','B','C','D')),
  chang_id INTEGER REFERENCES chang_thi(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Thí sinh
CREATE TABLE IF NOT EXISTS thi_sinh (
  id SERIAL PRIMARY KEY,
  ho_ten TEXT NOT NULL,
  so_dien_thoai TEXT NOT NULL,
  don_vi_id INTEGER REFERENCES don_vi(id),
  ten_don_vi_nho TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Kết quả thi (UNIQUE per thí sinh per chặng → mỗi người chỉ thi 1 lần/chặng)
CREATE TABLE IF NOT EXISTS ket_qua (
  id SERIAL PRIMARY KEY,
  thi_sinh_id INTEGER REFERENCES thi_sinh(id),
  chang_id INTEGER REFERENCES chang_thi(id),
  diem INTEGER NOT NULL DEFAULT 0,
  so_cau_dung INTEGER NOT NULL DEFAULT 0,
  tong_cau INTEGER NOT NULL DEFAULT 0,
  thoi_gian_lam INTEGER DEFAULT 0, -- giây
  answers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thi_sinh_id, chang_id)
);

-- 6. Admin
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  mat_khau TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tài khoản admin mặc định: admin / Admin@2026
INSERT INTO admins (username, mat_khau)
VALUES ('admin', 'Admin@2026')
ON CONFLICT (username) DO NOTHING;

-- 7. Exam Sessions (track active exams in real-time)
CREATE TABLE IF NOT EXISTS exam_sessions (
  id SERIAL PRIMARY KEY,
  thi_sinh_id INTEGER NOT NULL REFERENCES thi_sinh(id) ON DELETE CASCADE,
  chang_id INTEGER NOT NULL REFERENCES chang_thi(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_question INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}', -- {cau_hoi_id: lua_chon (A/B/C/D)}
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(thi_sinh_id, chang_id)
);

-- 8. Cảnh báo gian lận (upsert: mỗi thí sinh chỉ có 1 record/chặng, so_lan tăng dần)
CREATE TABLE IF NOT EXISTS canh_bao_gian_lan (
  id SERIAL PRIMARY KEY,
  thi_sinh_id INTEGER NOT NULL REFERENCES thi_sinh(id) ON DELETE CASCADE,
  chang_id INTEGER NOT NULL REFERENCES chang_thi(id) ON DELETE CASCADE,
  so_lan INTEGER NOT NULL DEFAULT 1,
  lan_cuoi TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thi_sinh_id, chang_id) -- upsert target
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE don_vi ENABLE ROW LEVEL SECURITY;
ALTER TABLE chang_thi ENABLE ROW LEVEL SECURITY;
ALTER TABLE cau_hoi ENABLE ROW LEVEL SECURITY;
ALTER TABLE thi_sinh ENABLE ROW LEVEL SECURITY;
ALTER TABLE ket_qua ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE canh_bao_gian_lan ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả thao tác với anon key (public competition)
CREATE POLICY "allow_all_don_vi" ON don_vi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_chang_thi" ON chang_thi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_cau_hoi" ON cau_hoi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_thi_sinh" ON thi_sinh FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ket_qua" ON ket_qua FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_read_admins" ON admins FOR SELECT USING (true);
CREATE POLICY "allow_all_exam_sessions" ON exam_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_canh_bao_gian_lan" ON canh_bao_gian_lan FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DỮ LIỆU MẪU - 3 chặng thi theo kế hoạch
-- ============================================================
INSERT INTO chang_thi (ten, bat_dau, ket_thuc, so_cau, thoi_gian_phut) VALUES
  ('Chặng 1', '2026-03-28 08:00:00+07', '2026-03-29 23:59:59+07', 30, 25),
  ('Chặng 2', '2026-04-04 08:00:00+07', '2026-04-05 23:59:59+07', 30, 25),
  ('Chặng 3', '2026-04-11 08:00:00+07', '2026-04-12 23:59:59+07', 30, 25)
ON CONFLICT DO NOTHING;
