# Phase 03 — Refactor Detail: Lazy `xlsx` + `@react-pdf/renderer`

**Date:** 2026-04-28 21:36 | **Scope:** 10 files xlsx + 3 files pdf
**Bundle impact đo thực:** xlsx-vendor 276KB raw / ~75KB gzip, pdf-vendor 647KB raw / ~170KB gzip → tổng ~245KB gzip có thể defer khỏi initial load.

## Bảng XLSX (10 files)

| # | File | Function/handler | Strategy | Caller change | Risk |
|---|------|------------------|----------|---------------|------|
| 1 | `apps/web/ce/components/profile/export-work-items.ts` | `exportWorkItemsXLSX(issues, filename)` (utility, sync void) | (a) async + `await import("xlsx")` | callers (today-work-items, overdue-work-items) phải `void` hoặc `await` | MED |
| 2 | `apps/web/ce/components/workspace/members/members-excel-export-button.tsx` | component → `handleExport()` onClick | (a) inside handler | none | LOW |
| 3 | `apps/web/ce/components/profile/profile-issues-export-button.tsx` | component → `handleExport()` (đã async) | (a) inside handler | none | LOW |
| 4 | `apps/web/ce/components/ho/ho-category-view.tsx` | `handleExport()` onClick | (a) async handler | none | LOW |
| 5 | `apps/web/ce/components/time-tracking/analytics/analytics-timesheet-grid.tsx` | `handleExport()` onClick | (a) async handler | none | LOW |
| 6 | `apps/web/ce/components/views/project-view-excel-export-button.tsx` | `doExport()` (đã async) | (a) inside handler | none | LOW |
| 7 | `apps/web/ce/components/workspace/views/excel-export-button.tsx` | `doExport()` (đã async) | (a) inside handler | none | LOW |
| 8 | `apps/web/ce/components/time-tracking/timesheet/timesheet-grid.tsx` | `handleExport()` onClick | (a) async handler | none | LOW |
| 9 | `apps/web/ce/components/time-tracking/analytics/workspace-analytics-timesheet-grid.tsx` | `handleExport()` onClick | (a) async handler | none | LOW |
| 10 | `apps/web/ce/components/ho/ho-datasheet-toolbar.tsx` | `handleExport()` onClick | (a) async handler | none | LOW |

**XLSX pattern chuẩn cho 9/10 file (button handlers):**
```ts
// ❌ trước
import * as XLSX from "xlsx";
const handleExport = () => {
  const wb = XLSX.utils.book_new();
  XLSX.writeFile(wb, "x.xlsx");
};

// ✅ sau
const handleExport = async () => {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  XLSX.writeFile(wb, "x.xlsx");
};
```
Nên thêm loading toast trước import vì xlsx download lần đầu tốn ~75KB gzip + parse:
```ts
const handleExport = async () => {
  setToast({ type: TOAST_TYPE.LOADING, title: t("common.preparing_export") });
  const XLSX = await import("xlsx");
  // ...
};
```

**File #1 đặc biệt** (utility, có 2 callers):
- File: `export-work-items.ts` exports `exportWorkItemsXLSX` sync
- Callers: `today-work-items.tsx`, `overdue-work-items.tsx` (cần grep verify)
- Đổi signature: `(issues, filename) => void` → `(issues, filename) => Promise<void>`
- 2 callers phải dùng `void exportWorkItemsXLSX(...)` hoặc `await` + handler async

## Bảng PDF (3 files)

| # | File | Component/value | Strategy | Caller change | Risk |
|---|------|-----------------|----------|---------------|------|
| 1 | `apps/web/core/constants/editor.ts` | `import { StyleSheet } from "@react-pdf/renderer"` + `StyleSheet.create()` ở module level | (c) extract → wrapper function lazy | callers ở document.tsx phải lấy stylesheet qua function | HIGH |
| 2 | `apps/web/core/components/pages/modals/export-page-modal.tsx` | `import { pdf }` + gọi `pdf()` trong async handler | (a) `await import` trong handler | none | MED |
| 3 | `apps/web/core/components/editor/pdf/document.tsx` | `import { Document, Font, Page }` — JSX components | (b) React.lazy + Suspense | export-page-modal phải wrap `<Suspense>` | MED |

**Chi tiết file #1 (constants/editor.ts):**

```ts
// ❌ trước (top-level side effect)
import { StyleSheet } from "@react-pdf/renderer";
export const EDITOR_PDF_STYLES = StyleSheet.create({ /* ... */ });

// ✅ sau
let cached: any = null;
export const getEditorPdfStyles = async () => {
  if (cached) return cached;
  const { StyleSheet } = await import("@react-pdf/renderer");
  cached = StyleSheet.create({ /* ... */ });
  return cached;
};
```
Caller `document.tsx` phải:
- Pre-fetch styles trong useEffect khi mount, hoặc
- Đợi promise trong render (cần Suspense / state)

Pre-fetch khi `ExportPageModal` mở là hợp lý — user click "Export PDF" → modal mở → useEffect fetch styles + lazy load PDF lib song song → khi user nhấn confirm thì sẵn sàng.

**Chi tiết file #2 (export-page-modal.tsx):**

```ts
// ❌ trước
import { pdf } from "@react-pdf/renderer";
const handleExportAsPDF = async () => {
  const blob = await pdf(<PDFDocument {...} />).toBlob();
};

// ✅ sau
const handleExportAsPDF = async () => {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<PDFDocument {...} />).toBlob();
};
```

**Chi tiết file #3 (document.tsx):**

```tsx
// ❌ trước
import { Document, Font, Page } from "@react-pdf/renderer";
export const PDFDocument: React.FC<Props> = (props) => (
  <Document>...<Page>...</Page></Document>
);

// ✅ sau (Option B: wrapper sibling)
// Tạo file: apps/web/core/components/editor/pdf/lazy-document.tsx
const PDFDocument = React.lazy(() =>
  import("./document").then((m) => ({ default: m.PDFDocument }))
);
export { PDFDocument };

// Caller export-page-modal.tsx:
<Suspense fallback={<Spinner />}>
  <PDFDocument {...props} />
</Suspense>
```

**Lưu ý PDF**: `PDFDocument` chỉ render trong `pdf()` function ở handler, không render lên DOM trực tiếp → React.lazy có thể không hoạt động (Suspense cần component mount lên DOM). Thay vào đó, dùng strategy (a) trong handler, KHÔNG cần React.lazy:

```ts
// Sửa lại file #3 simplified
const handleExportAsPDF = async () => {
  const [{ pdf }, { PDFDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/editor/pdf/document"),
  ]);
  const blob = await pdf(<PDFDocument {...} />).toBlob();
};
```

→ KHÔNG cần Suspense, KHÔNG cần lazy-document.tsx wrapper. Chỉ cần dynamic import 2 module trong handler. Risk giảm từ MED xuống LOW.

## Caller verification cần làm

Grep callers trước khi sửa:
```bash
grep -rn "exportWorkItemsXLSX" apps/web/ packages/ | grep -v node_modules
grep -rn "EDITOR_PDF_STYLES\|getEditorPdfStyles" apps/web/ packages/
grep -rn "PDFDocument" apps/web/ packages/ | grep -v node_modules
grep -rn "ExportPageModal" apps/web/ packages/
```

## Risk-reduced strategy (sửa lại từ agent report)

| File | Strategy ban đầu agent | Strategy thực dụng | Lý do |
|------|------------------------|--------------------|-------|
| `editor.ts` constants | (c) wrapper fn, HIGH risk | Pre-fetch trong `ExportPageModal` mount via useEffect — mid risk | UX không bị flash nếu pre-fetch khi mở modal |
| `document.tsx` | (b) React.lazy + Suspense | (a) `Promise.all([import pdf, import document])` trong handler | PDF component không mount DOM, dynamic import đủ |
| `export-page-modal.tsx` | (a) | (a) | giữ nguyên |

## LOC + effort estimate

- **9 file xlsx button handlers** (#2-#10): mỗi file 3-5 dòng đổi → **~36 LOC**
- **File xlsx utility** (#1): đổi signature + 2 caller updates → **~10 LOC**
- **3 file pdf** (sau khi simplify): **~25 LOC** (handler async + dynamic imports)
- **Tổng: ~71 LOC** trong 13 file + 2 caller files

**Effort:** 2-3 giờ (implement + smoke test)

## Recommended order

| # | Việc | Thời gian | Risk |
|---|------|-----------|------|
| 1 | Verify callers (grep `exportWorkItemsXLSX`, `PDFDocument`, `ExportPageModal`) | 5 phút | — |
| 2 | Refactor 9 xlsx button handlers (cùng pattern, copy-paste) | 30 phút | LOW |
| 3 | Refactor `export-work-items.ts` + 2 callers | 15 phút | MED |
| 4 | Refactor `export-page-modal.tsx` + `editor.ts` + `document.tsx` cùng lúc (cùng flow PDF) | 30 phút | MED |
| 5 | Build + deploy + measure | 15 phút | — |
| 6 | Smoke test 10 export flow (Excel/PDF) | 30 phút | — |

## Bundle impact ước tính (sau Phase 03)

So với Phase 01 (đã đạt 0.62 MB gzip initial):
- Trừ ~75KB gzip (xlsx defer)
- Trừ ~170KB gzip (pdf defer)
- **Initial gzip: 0.62 MB → ~0.38 MB (~-39%)**
- Tổng so với baseline production no-opt: 2.41 MB → 0.38 MB = **-84%**

**Note**: Phase 02 manualChunks bị regression vì preload all chunks. Sau Phase 03 (heavy deps thực sự lazy via dynamic import), Rollup tự tách chunk lazy (KHÔNG preload eager) → có thể safely revisit Phase 02 manualChunks cho `react`/`mobx` core deps.

## Câu hỏi chưa giải quyết

- Có muốn add loading toast / skeleton khi user click Export Excel/PDF (delay đầu ~200-500ms để load chunk)?
- Cần test trên LAN nội bộ để xem load chunk delay có chấp nhận được không (cold-load lần đầu)?
- File `editor.ts` constants có dùng ở chỗ nào KHÔNG phải PDF flow không? Cần grep verify trước.
- PDF flow có require pre-warm chunk khi mở modal (UX tốt hơn) hay defer hết tới click confirm (tiết kiệm chunk)?
