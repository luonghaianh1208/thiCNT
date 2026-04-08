# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Golden Rule

> **Trước khi bắt đầu bất kỳ nhiệm vụ nào, hãy hỏi tôi những câu hỏi cần thiết để đưa ra kết quả tốt nhất. ĐỪNG giả định, ĐỪNG hiểu sai, HÃY hỏi trước.**

Khi nhận yêu cầu từ người dùng:
1. Đọc kỹ yêu cầu — nếu có điều chưa rõ, hỏi ngay
2. Nếu có nhiều cách làm, trình bày các lựa chọn và hỏi ý kiến
3. Nếu yêu cầu mơ hồ, đặt câu hỏi cụ thể trước khi làm
4. Chỉ bắt đầu code/sửa sau khi đã xác nhận hiểu đúng

## Project Overview

This is a Vietnamese contest/quiz application for the Ho Chi Minh Communist Youth Union ("Thi Chuyen Doi So"). It consists of:

- **Public exam interface** (`/thi`) — contestants register with name/phone/unit, take timed multiple-choice quizzes, with anti-cheat monitoring (tab-switch detection). Students can take multiple attempts per `CuocThi` (competition), up to the configured attempt limit.
- **Admin dashboard** (`/admin`) — manage competitions (cuộc thi), questions, units/classes (đơn vị/lớp), participants, results, and fraud logs
- **Home page** (`/`) — displays available competitions with banner images

## Tech Stack

- **React 19** + TypeScript, **Vite 6** (build tool)
- **Tailwind CSS v4** (utility-first styling, via `@tailwindcss/vite`)
- **Supabase** (`@supabase/supabase-js`) — auth, database (PostgreSQL), and RPC functions
- **React Router v7** — client-side routing
- **xlsx** — Excel import/export for bulk data operations
- **sonner** — toast notifications
- **lucide-react** — icons

## Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # TypeScript type check (no emit)
```

## Environment Variables

Two Supabase env vars are required (see `.env.example`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

GEMINI_API_KEY and APP_URL are injected at runtime by AI Studio and are not needed for local dev.

## Architecture

### Routing

```
/                    → TrangChu (home)
                    → TrangThi (exam interface)
/admin/login         → AdminLogin
/admin               → TrangAdmin (protected, requires admin_token in sessionStorage)
```

The `AdminRoute` component guards `/admin` — it checks `sessionStorage.getItem('admin_token') === 'authenticated'`.

### Database Layer (`src/lib/db.ts`)

All data access goes through Supabase. Key patterns:

- **Server-side scoring**: `dap_an_dung` (correct answer) is NEVER sent to the client. Questions are fetched without it (`select` excludes it), and grading happens via `nop_bai_va_cham_diem` RPC.
- **RPC functions**: Used for `kiem_tra_luot_thi`, `dem_luot_da_thi`, `lay_diem_cao_nhat`, `nop_bai_va_cham_diem`, `verify_admin_login`, `get_thong_ke`, `ghi_canh_bao_gian_lan`.
- **Time handling**: All DB timestamps are UTC. The admin uses `Asia/Ho_Chi_Minh` (`VN_TZ`) for display, converting via `fmtVN`, `toInputVN`, `fromInputVN` helpers.

### Exam / Multi-attempt

A student can take multiple attempts within a `CuocThi` (competition), up to `cuoc_thi.gioi_han_luot` attempts. The anti-cheat violation limit is `cuoc_thi.gioi_han_gian_lan`. Each attempt produces a new row in `ket_qua` with `luot_thi` incremented automatically by the `nop_bai_va_cham_diem` RPC.

The result screen shows the **highest score** across all attempts. A "Thi lại" (retake) button appears only when the competition is still active and the student has attempts remaining.

Session key: `thichuyendoiso_session` in sessionStorage — persists exam state so page refresh doesn't lose progress.

### State Management

No external state library — React `useState` + `useEffect` + `useRef` patterns. Exam uses `sessionStorage` for session persistence. `formSdt` and `formHoTen` are kept as state at the top TrangThi level (not just in RegisterPage) so the result page can access them for the retake flow.

### Styling

Tailwind v4 with CSS-first config in `src/index.css` (via `@import "tailwindcss"`). Custom theme tokens defined via `@theme`:

```
brand-blue: #1E459F   brand-red: #CF2A2A
brand-yellow: #FABD32 brand-beige: #E1DCCA  brand-dark: #0F172A
font-tech: Orbitron   font-ui: Be Vietnam Pro
```

Key components: `card-tech`, `btn-cyber`, `btn-cyber-gold` for the cyberpunk-tech aesthetic.

### DonVi (Units = Classes)

`don_vi` table has `id, ten, lop` (no `loai`). The admin manages them as "Lớp" — the `ten` field is the school name, `lop` is the free-text class name (e.g., "10A1"). Excel import template headers: `Tên đơn vị`, `Lớp`.

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client initialization |
| `src/lib/db.ts` | All DB operations (types + functions) — `CuocThi`, `DonVi`, `KetQua` with `luot_thi` |
| `src/App.tsx` | Router, AdminRoute guard, PageWrapper |
| `src/pages/TrangThi.tsx` | Exam flow: pending → register → exam → result. Handles multi-attempt and retake logic. |
| `src/pages/TrangAdmin.tsx` | Admin dashboard with tabs: Cuộc thi, Câu hỏi, Đơn vị, Thí sinh, Kết quả, Cảnh báo |
| `src/pages/TrangChu.tsx` | Home page — shows competition cards with `anh_banner` images |
| `src/components/SearchableSelect.tsx` | Searchable dropdown for unit/DonVi selection |

## Development Notes

- HMR is disabled via `DISABLE_HMR` env var in AI Studio — do not modify this
- Vite proxies `/api` requests to `http://localhost:3001` (for AI Studio backend integration)
- Anti-cheat uses `visibilitychange` + `blur` events; violations are recorded via `ghi_canh_bao_gian_lan` RPC; limit is `cuoc_thi.gioi_han_gian_lan`
- Exam questions are shuffled (Fisher-Yates) and answer options are independently shuffled per question via `optionOrders` state
- `ket_qua.luot_thi` tracks which attempt number this row represents (1, 2, 3...)
