# RULES.md — Quy tắc dự án

> **Đọc file này trước khi code.** Mọi thay đổi phải tuân thủ các quy tắc dưới đây.

---

## 🔴 RULE 0 — Context bắt buộc

**Trước khi code bất cứ thứ gì:**
1. Đọc `PROJECT.md` để nắm cấu trúc, schema, luồng
2. Đọc `RULES.md` (file này)
3. Sau khi thay đổi lớn → cập nhật `PROJECT.md` (phần "Lịch sử thay đổi")

---

## 🔒 RULE 1 — Bảo mật đáp án (CRITICAL)

- **KHÔNG BAO GIỜ** select `dap_an_dung` trong `layCauHoiNgauNhien()`
- Chấm điểm **phải** qua RPC `nop_bai_va_cham_diem` — server-side hoàn toàn
- Client chỉ gửi `{cau_hoi_id, lua_chon}` — không biết đáp án đúng
- `dap_an_dung` trong type `CauHoi` là **optional** (`?`) — chỉ trả về cho admin query

```typescript
// ✅ ĐÚNG — không có dap_an_dung
.select('id, noi_dung, dap_an_a, dap_an_b, dap_an_c, dap_an_d, chang_id, active')

// ❌ SAI — lộ đáp án
.select('*')
```

---

## 🎨 RULE 2 — Typography & Font

- **Tiếng Việt:** luôn dùng `font-ui` (Inter/Roboto)
- **Số, code, điểm:** dùng `font-tech` (monospace)
- **KHÔNG** dùng `tracking-tighter` với tiếng Việt — vỡ dấu thanh
- **KHÔNG** dùng `tracking-tight` cho heading tiếng Việt dài
- Heading dài → dùng `clamp()` cho fluid font size:

```css
style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3.5rem)' }}
```

---

## 🏗️ RULE 3 — Database

- `dap_an_dung` trong DB luôn là UPPERCASE: `'A'`, `'B'`, `'C'`, `'D'`
- `lua_chon` client gửi lên là lowercase key gốc: `'a'`, `'b'`, `'c'`, `'d'`
- RPC `nop_bai_va_cham_diem` tự `UPPER()` khi so sánh
- `ket_qua` có `UNIQUE(thi_sinh_id, chang_id)` → dùng `ON CONFLICT DO NOTHING`
- Mọi thay đổi schema → cập nhật `setup.sql` + migrate DB thực tế
- Mọi migration quan trọng → dùng `mcp_supabase-mcp-server_apply_migration`

---

## ⚛️ RULE 4 — React Patterns

### Timer
```typescript
// ✅ ĐÚNG: 1 interval, ref tránh stale closure
const submitStateRef = React.useRef({ ... });
useEffect(() => { submitStateRef.current = { ... }; }); // sync mỗi render
useEffect(() => {
  if (stage !== 'exam') return;
  const timer = setInterval(() => { ... }, 1000);
  return () => clearInterval(timer);
}, [stage]); // ← CHỈ stage, không phải timeLeft
```

### Race Condition Guard
```typescript
// ✅ Luôn guard trước khi submit
if (isSubmitting) return;
if (stage === 'result') return;
```

### Rollback Pattern
```typescript
let tsId: number | null = null;
try {
  tsId = await taoThiSinh(...);
  // ... các bước tiếp theo
} catch {
  if (tsId) await deleteThiSinh(tsId);
}
```

---

## 🎨 RULE 5 — UI/UX

- **Label đáp án:** Luôn hiển thị `A/B/C/D` theo **vị trí** (index), tidak phải key gốc

```tsx
// ✅ ĐÚNG
{(optionOrders[q.id] || ['a','b','c','d']).map((key, displayIdx) => {
  const displayLabel = ['A','B','C','D'][displayIdx]; // Vị trí, không phải key
  const isSelected = answers[q.id] === key; // Track bằng key gốc lowercase
  ...
})}
```

- **Input tiếng Việt:** Luôn dùng `font-ui` class
- **Glassmorphism:** `bg-brand-dark/40 backdrop-blur-md border border-white/10`
- **Màu sắc:** Không dùng `purple/violet` — dùng palette `brand-*`

---

## 🛡️ RULE 6 — Anti-cheat

- `gioi_han_gian_lan` lưu trong DB bảng `chang_thi` (default: 3)
- Cooldown 1 giây giữa các lần ghi vi phạm (`lastViolationRef`)
- Đạt giới hạn → auto-submit ngay, không cho đóng overlay
- Vi phạm = `visibilitychange` (tab switch) + `blur` (window mất focus)

---

## 📋 RULE 7 — Git & Deploy

- Branch duy nhất: `main`
- Mọi push lên `main` → Netlify auto deploy
- **Luôn chạy `npx tsc --noEmit` trước khi push**
- Commit message format: `type: mô tả tiếng Anh`
  - `feat:` tính năng mới
  - `fix:` sửa lỗi
  - `ui:` thay đổi UI/UX
  - `security:` liên quan bảo mật
  - `perf:` tối ưu hiệu năng
  - `refactor:` tái cấu trúc

---

## 📁 RULE 8 — File Dependencies

| File thay đổi | Cần kiểm tra |
|---|---|
| `db.ts` (types) | `TrangThi.tsx`, `TrangAdmin.tsx` |
| `db.ts` (functions) | Mọi file import từ `@/lib/db` |
| `setup.sql` | DB thực tế (migrate nếu cần) |
| `index.css` (tokens) | Tất cả component dùng class `brand-*` |
| `TrangThi.tsx` (handleSubmit) | Luồng submit, anti-cheat, timer |

---

## 🚫 RULE 9 — Những điều KHÔNG được làm

- ❌ Không select `dap_an_dung` cho thí sinh
- ❌ Không để `timeLeft` trong dependency array của timer
- ❌ Không dùng `tracking-tighter` với heading tiếng Việt
- ❌ Không chấm điểm client-side (phải qua RPC)
- ❌ Không xóa `UNIQUE(thi_sinh_id, chang_id)` trong `ket_qua`
- ❌ Không push code chưa pass TypeScript check
- ❌ Không hardcode giới hạn gian lận — đọc từ `chang.gioi_han_gian_lan`

---

## ✅ RULE 10 — Checklist trước khi push

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] Không lộ `dap_an_dung` trong query thí sinh
- [ ] Nếu đổi DB schema → update `setup.sql`
- [ ] Nếu thay đổi lớn → update `PROJECT.md` (Lịch sử thay đổi)
