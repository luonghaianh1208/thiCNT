# Task: Cleanup, Security & Feature Improvements

## 1. Dọn dẹp Dead Code & Dependencies
- [x] Xóa `src/lib/storage.ts` (code Hóa học)
- [x] Xóa `src/lib/AuthContext.tsx` (code Hóa học)
- [x] Xóa `src/lib/curriculum.ts`
- [x] Xóa `src/lib/roleStorage.ts`
- [x] Xóa toàn bộ `netlify/functions/` (5 files AI Hóa học)
- [x] Xóa `server/database.sqlite`
- [x] Xóa dependencies: `katex`, `rehype-katex`, `remark-math`, `remark-gfm`, `react-markdown`, `@tailwindcss/typography`, `better-sqlite3`, `express`, `tsx`, `motion`, `recharts`
- [x] Xóa `src/components/ui/MarkdownContent.tsx` và các UI không dùng
- [x] Xóa `src/lib/ThemeContext.tsx` nếu không dùng

## 2. Sửa Bảo Mật
- [x] Hash mật khẩu admin: tạo migration Supabase dùng `pgcrypto` / `crypt()`
- [x] Cập nhật `adminLogin()` trong `db.ts` để dùng `verify_admin_login` RPC
- [x] Cải thiện Admin Auth: dùng `sessionStorage` thay `localStorage`
- [x] Cập nhật RLS: chặn đọc trực tiếp bảng `admins`

## 3. Chống Mất Bài Thi Khi Refresh
- [x] Lưu `questions`, `answers`, `timeLeft`, `thiSinhId`, `startTime` vào `sessionStorage` khi bắt đầu thi
- [x] Restore state từ `sessionStorage` khi component mount
- [x] Xóa `sessionStorage` sau khi nộp bài thành công

## 4. Theo Dõi Gian Lận Thoát Màn Hình
- [x] Thêm bảng `canh_bao_gian_lan` vào Supabase (migration done)
- [x] Function `ghi_canh_bao_gian_lan` (SECURITY DEFINER, upsert)
- [x] Trong `TrangThi.tsx`: detect `visibilitychange` / `blur` event khi đang thi
- [x] Ghi log gian lận lên Supabase (thi_sinh_id, chang_id, so_lan)
- [x] Hiển thị cảnh báo overlay trên màn hình thí sinh khi phát hiện thoát
- [x] Thêm Tab "Cảnh báo gian lận" trong `TrangAdmin.tsx` → bảng log cheating

## 5. Deployment & Bug Fix
- [x] Xây dựng quy trình build sạch (linting, cleanup CSS)
- [x] Fix lỗi Tailwind typography plugin
- [x] Fix lỗi "trang trắng" sau khi deploy (do thiếu env vars và polyfills)

## 6. Branding & UI/UX Overhaul
- [x] Cập nhật Logo Huy hiệu Đoàn (Wikipedia link)
- [x] Cập nhật Header text: "Đoàn TNCS Hồ Chí Minh - Thành Đoàn Hải Phòng"
- [x] Thiết kế Hero section chuyên nghiệp, hiện đại hơn
- [x] Áp dụng Glassmorphism cho các Card chặng thi
- [x] Tối ưu UI/UX trang thi (Timer, Question layout)
- [x] Thêm hiệu ứng transition mượt mà giữa các trang
- [x] Polish Admin Dashboard (UI cleanup)

## 7. Refinement & Logo Fix
- [x] Cập nhật logo link mới (Hải Dương Đoàn)
- [x] Tăng độ tương phản (Contrast), giảm blur để dễ nhìn hơn
- [x] Kiểm tra hiển thị Logo trên các trang

## 8. Color Palette & Layout Refinement (New)
- [x] Áp dụng bộ màu 1E459F, CF2A2A, FABD32
- [x] Sửa lỗi xuống dòng Hero Title
- [x] Tối ưu Responsive (Mobile Menu)
- [x] Fix lỗi Admin Login (URL misconfig debugging)

## 9. Tech Aesthetic Overhaul (v4 - Futuristic)
- [x] Cập nhật Font chữ công nghệ (Orbitron, Space Grotesk)
- [x] Thiết kế Design System Tech (index.css)
- [x] Thiết kế nền Hero với họa tiết vi mạch (Circuitry) và hiệu ứng Glow
- [x] Tối ưu hóa UI các Card và Button theo phong cách "Công nghệ số" (card-tech, btn-cyber)
- [x] Đảm bảo độ sắc nét và tương phản tuyệt đối
- [x] Nâng cấp Trang Thi thành 'Mission Control' (Digital Timer)
- [x] Đồng bộ Admin Dashboard (Stats cards, Typography)

# ✅ TẤT CẢ ĐÃ HOÀN TẤT
