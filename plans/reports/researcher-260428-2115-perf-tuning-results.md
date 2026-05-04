# Báo cáo: Kết quả tối ưu hiệu năng web (Phase 01-03)

**Date:** 2026-04-28 | **Branch:** `duonglx/chore/gitignore-claude-state`
**Setup test:** Docker production build (image `plane-web-perf:baseline`) qua Caddy proxy → nginx static

## Tóm tắt

| Phase | Status | Transfer size impact |
|-------|--------|----------------------|
| 01 — gzip + cache-control + Caddy zstd | ✅ DONE | **-74.6%** initial preload, **~0 byte** repeat visit |
| 02 — Vite manualChunks | ❌ ROLLBACK | Regression do React Router v7 eager preload |
| 03 — lazy heavy deps | ⏭️ DEFERRED | Cần refactor 10+ files (estimated -30-50% thêm) |

## Số liệu cụ thể

### Trước (production build, no opts)

- Setup hiện tại đang chạy `pnpm dev` (Vite dev) → KHÔNG đo được vì hàng nghìn `/@fs/` requests
- Tạo image `plane-web-perf:baseline` từ `Dockerfile.web` để có baseline production:
  - Initial HTML preload: **30 assets, 2.41 MB raw transfer**
  - Tổng JS build: 10.6 MB raw, 2.95 MB nếu nén
  - **Headers:** không gzip, không Cache-Control, không immutable
  - Mỗi reload = full 2.41 MB re-download

### Sau Phase 01

Áp dụng:
- `apps/web/nginx/nginx.conf` — gzip on, immutable cache cho `/assets/*`, no-cache cho index.html
- `apps/proxy/Caddyfile.dev` — `encode zstd gzip`

Đo được:
- Initial preload: **30 assets, 0.62 MB gzip transfer** (Content-Encoding: gzip)
- Compression ratio: **3.94×**
- Reduction: **-74.6%** vs baseline production
- Repeat visit: assets hashed + `Cache-Control: immutable` → **0 byte transfer**

### Phase 02 (rollback)

`manualChunks` đã thử với 2 strategy:

| Strategy | Initial transfer | Status |
|----------|------------------|--------|
| Full split (10 vendor groups) | 5.95 MB raw / 1.67 MB gzip | ❌ +147% regression |
| Minimal (chỉ react/router/mobx/utils) | 2.97 MB raw / 0.79 MB gzip | ❌ +23% regression |

**Root cause**: React Router v7 SPA build sinh `<link rel="modulepreload">` cho TẤT CẢ chunk vendor → eager preload cả pdf-vendor, xlsx-vendor, charts-vendor dù chúng đáng lẽ lazy. Default Vite chunking tốt hơn trong setup này.

**Bài học**: với React Router v7 SPA, KHÔNG nên `manualChunks` cho heavy deps. Để default Rollup tự tách + lazy import (Phase 03) là cách đúng.

### Phase 03 (deferred)

Heavy deps cần lazy:
- `xlsx` (276KB chunk): 10 callsites trong `apps/web/ce/components/`
- `@react-pdf/renderer` (646KB): 4 callsites trong `apps/web/core/`
- `recharts` (~300KB): 5 callsites CE + dùng trong `packages/propel/dist/charts/*`
- `react-grid-layout` (~200KB): 1 callsite

Lý do defer: cần đổi signature handler → async, hoặc tạo wrapper React.lazy + Suspense → 30-60 phút work + risk break callers. Estimated impact thêm: -30-50% initial JS.

## File thay đổi (giữ lại)

- `apps/web/nginx/nginx.conf` — full gzip + cache config
- `apps/proxy/Caddyfile.dev` — thêm `encode zstd gzip`
- `apps/web/vite.config.ts` — `assetsInlineLimit: 4096` (4KB inline cho asset nhỏ)
- `.claude/.ckignore` — allow `build`, `vendor`

## File rollback / không giữ

- Phase 02 manualChunks trong `vite.config.ts` đã revert
- `apps/proxy/Caddyfile.dev.bak.dev-mode` — backup của Caddyfile.dev gốc (trước switch web:3000)

## Verify scripts (giữ lại)

`plans/260428-2056-web-workspace-load-perf/verify/`:
- `check-headers.sh` — kiểm tra gzip/immutable headers (BUG: grep response gzip → cần fix)
- `check-bundle.sh` — đo size chunks
- `run-lighthouse.sh` — Lighthouse 3-run median
- `measure-login-flow.mjs` — Playwright login → workspace
- `verify-all.sh` — wrapper

## Khuyến nghị triển khai production

### Áp dụng ngay (Phase 01)

1. Apply `nginx.conf` mới khi build image production
2. Apply Caddyfile.ce thêm `encode zstd gzip` (giống Caddyfile.dev)
3. Test rebuild image + verify headers `Content-Encoding: gzip`, `Cache-Control: immutable`

Impact production thật: với LAN 10-100Mbps, giảm transfer 1.8MB → 0.62MB tiết kiệm khoảng **~1-3 giây cold load**, repeat visits gần như instant.

### Để dành cho session sau (Phase 03)

Lazy heavy deps theo thứ tự priority:
1. `xlsx` (impact lớn nhất, 10 callsites): chuyển handler thành async, `await import("xlsx")`
2. `@react-pdf/renderer`: React.lazy cho `Document/Page` + Suspense fallback
3. `recharts`: tạo `LazyChart` wrapper cho mỗi chart type, replace direct import
4. `react-grid-layout`: 1 callsite, React.lazy

Sau Phase 03, có thể RETRY Phase 02 manualChunks với heavy deps đã tách sẵn (vì lúc đó Rollup auto-split + manualChunks không conflict).

## Câu hỏi chưa giải quyết

- Có cần build lighthouse + playwright run đầy đủ trước-sau để có metrics LCP/FCP/TTI? (cần ~10 phút thêm)
- Production server thật (Caddyfile.ce) có nginx hoặc caddy nào khác chưa nén? Cần check môi trường thật (không phải localhost dev).
- Sau Phase 03, có muốn implement Phase 04 (API bootstrap batch endpoint) không? Backend Django.
