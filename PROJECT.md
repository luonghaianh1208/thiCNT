# PROJECT.md — Thi Chuyển đổi số Thành đoàn Hải Phòng

> **Đọc file này trước khi code bất cứ thứ gì. Cập nhật ngay sau mỗi thay đổi lớn.**

---

## 1. Tổng quan

- **Tên dự án:** Thi Trực tuyến Chuyển đổi số — Thành đoàn Hải Phòng 2026
- **Mục đích:** Hệ thống thi trắc nghiệm trực tuyến cho thanh niên Hải Phòng
- **URL Netlify:** https://thichuyendoisothanhdoanhaiphong.netlify.app (auto deploy từ `main`)
- **Supabase Project:** `nloaugmnbqcvzqfiotyl`
- **Repo:** https://github.com/luonghaianh1208/thichuyendoiso.thanhdoanhaiphong
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS v4 + Supabase + Netlify

---

## 2. Cấu trúc thư mục

```
src/
├── pages/
│   ├── TrangChu.tsx      ← Landing page (hero, lịch thi, giới thiệu)
│   ├── TrangThi.tsx      ← Core thi (pending → register → exam → result)
│   ├── TrangAdmin.tsx    ← Dashboard admin (quản lý chặng, câu hỏi, kết quả...)
│   └── AdminLogin.tsx    ← Trang đăng nhập admin
├── components/
│   ├── SearchableSelect.tsx  ← Dropdown có tìm kiếm (133 đơn vị)
│   └── ErrorBoundary.tsx     ← Bọc toàn app tránh crash
├── lib/
│   ├── db.ts             ← Tất cả Supabase queries + types
│   └── supabase.ts       ← Supabase client init
├── App.tsx               ← Router (/, /thi, /admin, /admin/login)
└── index.css             ← Design tokens, custom classes
setup.sql                 ← Source of truth cho DB schema
PROJECT.md                ← File này
RULES.md                  ← Quy tắc dự án
```

---

## 3. Database Schema

### Bảng chính

| Bảng | Mô tả | Ghi chú |
|---|---|---|
| `don_vi` | Đơn vị (phường/xã/đặc khu/khác) | 133 đơn vị Hải Phòng |
| `chang_thi` | Chặng thi (Chặng 1/2/3) | có `gioi_han_gian_lan` (default 3) |
| `cau_hoi` | Ngân hàng câu hỏi | 252 câu, có `active` flag |
| `thi_sinh` | Thí sinh đã đăng ký | tạo khi bắt đầu thi |
| `ket_qua` | Kết quả thi | UNIQUE(thi_sinh_id, chang_id) |
| `canh_bao_gian_lan` | Log vi phạm gian lận | upsert theo thi_sinh+chang |
| `exam_sessions` | (Legacy, không còn dùng) | giữ lại trong DB, không dùng trong code |
| `admins` | Tài khoản admin | bcrypt hash |

### RPC Functions (Security Definer)

| Function | Mô tả | Return |
|---|---|---|
| `kiem_tra_da_thi(p_sdt, p_chang_id, p_ho_ten?, p_don_vi_id?)` | Kiểm tra đã thi chặng này chưa | `'ok'` / `'sdt'` / `'trung_lap'` |
| `kiem_tra_da_thi_chu(p_sdt, p_ho_ten, p_don_vi_id)` | Kiểm tra đã thi bất kỳ chặng nào chưa | `string` (tên chặng hoặc rỗng) |
| `nop_bai_va_cham_diem(p_thi_sinh_id, p_chang_id, p_thoi_gian_lam, p_answers)` | Chấm điểm server-side | `{diem, so_cau_dung, tong_cau}` |
| `ghi_canh_bao_gian_lan(p_thi_sinh_id, p_chang_id)` | Upsert cảnh báo gian lận | `number` (số lần) |
| `get_thong_ke(p_chang_id?)` | Thống kê tổng quan | `{tong_thi_sinh, tong_luot_thi, diem_trung_binh}` |
| `verify_admin_login(p_username, p_password)` | Xác thực admin bcrypt | `boolean` |

---

## 4. Luồng thi (TrangThi.tsx)

```
loading → pending (đếm ngược) → register → exam → result
```

### Register Page
1. Nhập: Họ tên, SĐT (10 số), Đơn vị (SearchableSelect)
2. Validate local
3. `kiemTraDaThi()` → chặn nếu `'sdt'` hoặc `'trung_lap'`
4. `kiemTraDaThiChu()` → chặn nếu đã thi chặng khác
5. `taoThiSinh()` + `layCauHoiNgauNhien()` → vào thi
6. Nếu lỗi → rollback `deleteThiSinh()`

### Exam Page
- Fisher-Yates shuffle đáp án per câu
- **Label hiển thị: A/B/C/D theo vị trí** (không phải key gốc)
- `answers[cau_hoi_id] = key_goc_lowercase` (a/b/c/d)
- Anti-cheat: `visibilitychange` + `blur` → `ghiCanhBaoGianLan()`
- Đạt `gioi_han_gian_lan` → auto-submit
- Timer: 1 interval duy nhất, dùng `submitStateRef` tránh stale closure
- sessionStorage persist: F5 không mất bài

### Submit
- Gọi `nopBaiVaChamDiem()` — **server-side scoring**
- Client KHÔNG bao giờ biết đáp án đúng
- `dap_an_dung` KHÔNG được select trong `layCauHoiNgauNhien()`

---

## 5. Admin Dashboard (TrangAdmin.tsx)

**Các tab:**
- **Dashboard** — Thống kê tổng quan
- **Chặng thi** — CRUD chặng, bao gồm `gioi_han_gian_lan`
- **Câu hỏi** — CRUD + bulk import Excel
- **Đơn vị** — CRUD + bulk import Excel, hỗ trợ loại: phường/xã/đặc khu/khác
- **Thí sinh** — Danh sách + xóa
- **Kết quả** — Bảng xếp hạng theo chặng (sort by điểm/thời gian)
- **Gian lận** — Log vi phạm + cài đặt `gioi_han_gian_lan` per chặng

---

## 6. Design System

- **Font:** `font-ui` (Inter/Roboto — tiếng Việt), `font-tech` (monospace — số/code)
- **Màu chính:** `brand-blue` (#004B87), `brand-yellow` (#FABD32), `brand-red`, `brand-beige`, `brand-dark`
- **Components:** `card-tech`, `btn-cyber`, `input-admin-tech`
- **KHÔNG** dùng `tracking-tighter` với tiếng Việt (vỡ dấu)

---

## 7. Lịch sử thay đổi

| Ngày | Thay đổi |
|---|---|
| 31/03/2026 | Khởi tạo dự án, setup DB, admin dashboard cơ bản |
| 31/03/2026 | Thêm exam_sessions tracking, anti-cheat overlay |
| 01/04/2026 | Xóa exam_sessions khỏi frontend, fix data binding admin |
| 01/04/2026 | Nâng cấp `kiem_tra_da_thi` trả `'ok'/'sdt'/'trung_lap'` |
| 02/04/2026 | **SECURITY:** Server-side scoring, bỏ `dap_an_dung` khỏi client |
| 02/04/2026 | Fix UI label đáp án: hiển thị A/B/C/D theo vị trí |
| 02/04/2026 | Fix timer: chỉ depend `stage`, dùng `submitStateRef` |
| 02/04/2026 | Thêm `gioi_han_gian_lan` — auto-submit khi đạt giới hạn gian lận |
| 02/04/2026 | Thêm `ErrorBoundary`, race condition guard, rollback khi lỗi |
| 02/04/2026 | SearchableSelect cho dropdown đơn vị (133 đơn vị) |
| 02/04/2026 | `kiem_tra_da_thi_chu` — chặn thi nhiều chặng |
| 02/04/2026 | Hero section: ảnh sân khấu thực tế + glassmorphism card |
| 02/04/2026 | Fluid font size `clamp()` cho heading không bị wrap |
