# Phase 03: Lazy heavy deps (xlsx, pdf, recharts, …)

**Priority:** P0 | **Status:** TODO

## Context Links

- Report §3: deps nặng load eager
- Files: `apps/web/package.json`, các nơi import xlsx/pdf/recharts

## Overview

Sau khi tách chunk (Phase 02), bước tiếp là KHÔNG load các chunk này cho đến khi user thực sự cần (xuất file, mở chart, mở emoji picker). Mỗi heavy dep cần convert sang dynamic import tại điểm sử dụng.

## Key Insights

- `xlsx` chỉ cần khi user export Excel → có thể `await import('xlsx')` trong handler
- `@react-pdf/renderer` chỉ cần khi user export PDF
- `recharts` chỉ cần ở trang dashboard có chart
- `emoji-picker-react` chỉ cần khi mở emoji picker
- `react-grid-layout` chỉ cần ở dashboard customizable

## Requirements

- Toàn bộ điểm dùng heavy deps phải là dynamic import / `React.lazy`
- Có Suspense fallback hợp lý (skeleton/spinner) tại điểm load

## Related Code Files (cần grep + cập nhật)

**Search:**
- `grep -rn "from ['\"]xlsx" apps/web`
- `grep -rn "@react-pdf/renderer" apps/web`
- `grep -rn "recharts" apps/web`
- `grep -rn "emoji-picker-react" apps/web`
- `grep -rn "react-grid-layout" apps/web`
- `grep -rn "react-color" apps/web`

**Tạo wrappers nếu cần:**
- `apps/web/core/components/exports/excel-exporter.tsx` (lazy)
- `apps/web/core/components/exports/pdf-exporter.tsx` (lazy)
- `apps/web/core/components/charts/lazy-chart.tsx` (lazy)
- `apps/web/core/components/emoji/lazy-emoji-picker.tsx` (lazy)

## Implementation Steps

### Step 1 — Lazy `xlsx` ở handler

```ts
// trước
import * as XLSX from "xlsx";
const onExport = () => { const wb = XLSX.utils.book_new(); /* ... */ };

// sau
const onExport = async () => {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  /* ... */
};
```

Đặt loading toast: `setToast({ type: TOAST_TYPE.INFO, title: t("common.preparing_export") })` trước import.

### Step 2 — Lazy `@react-pdf/renderer`

```tsx
const PDFDownloadLink = React.lazy(() =>
  import("@react-pdf/renderer").then((m) => ({ default: m.PDFDownloadLink }))
);

<Suspense fallback={<Spinner />}>
  <PDFDownloadLink document={<MyDoc />} fileName="x.pdf">
    {({ loading }) => (loading ? "..." : t("export.download"))}
  </PDFDownloadLink>
</Suspense>
```

### Step 3 — Lazy `recharts` charts

```tsx
const LineChart = React.lazy(() => import("recharts").then((m) => ({ default: m.LineChart })));
// hoặc tạo wrapper component lazy với toàn bộ chart logic bên trong
```

Tốt hơn: lazy load toàn bộ component dashboard chart:
```tsx
const DashboardCharts = React.lazy(() => import("@/components/dashboard/charts"));
```

### Step 4 — Lazy emoji picker

```tsx
const EmojiPicker = React.lazy(() => import("emoji-picker-react"));
{open && <Suspense fallback={null}><EmojiPicker onEmojiClick={...} /></Suspense>}
```

### Step 5 — Đánh giá loại bỏ `xlsx`

- Nếu chỉ dùng `xlsx` cho export CSV → thay bằng `export-to-csv` (đã có sẵn) → bỏ luôn dep `xlsx`
- Grep usage trước khi quyết định: `grep -rn "XLSX\." apps/web`

### Step 6 — Subset font Material Symbols

- File `@fontsource/material-symbols-rounded` chứa toàn bộ icon → MB
- Cách 1: chỉ import subset cần dùng (xem doc package)
- Cách 2: dùng SVG icons (lucide-react đã có sẵn) cho icons phổ biến → loại bỏ Material Symbols nếu không cần

### Step 7 — Verify

```bash
pnpm --filter web build
ls -lh apps/web/build/client/assets/ | sort -k5 -h
# Xem chunk pdf-vendor, xlsx-vendor có trong initial load không (mở DevTools Network)
```

## Todo List

- [ ] Grep và list tất cả điểm dùng `xlsx`, `@react-pdf/renderer`, `recharts`, `emoji-picker-react`, `react-grid-layout`
- [ ] Convert xlsx usages → dynamic import
- [ ] Convert pdf usages → React.lazy + Suspense
- [ ] Convert recharts usages → React.lazy
- [ ] Convert emoji picker → React.lazy
- [ ] Convert react-grid-layout → React.lazy
- [ ] Đánh giá loại bỏ `xlsx` nếu chỉ dùng CSV
- [ ] Subset hoặc loại bỏ Material Symbols Rounded font nếu không cần
- [ ] Verify Network tab: chunk nặng KHÔNG load ở initial workspace page
- [ ] Smoke test: export Excel/PDF/chart vẫn hoạt động

## Success Criteria

- Initial JS download (workspace landing) <800KB gzip
- Heavy chunks (`pdf-vendor`, `xlsx-vendor`, `charts-vendor`) chỉ load ON-DEMAND
- Không regression: tất cả flow export/chart/emoji vẫn chạy

## Risks

- React.lazy + Suspense placement sai → flash UI / layout shift
- Dynamic import tại event handler có delay → cần loading state hợp lý (toast/spinner)
- Subset font sai → mất icon → cần regression test UI

## Security

- Không thay đổi

## Next

→ Phase 04 (API bootstrap batch)
