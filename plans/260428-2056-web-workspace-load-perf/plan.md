# Plan: Tối ưu tải sau login → workspace

**Created:** 2026-04-28 20:56 | **Branch:** `duonglx/perf/web-workspace-load`
**Goal:** Giảm thời gian load trang `/{workspaceSlug}/` sau login (cả localhost + Docker LAN nội bộ)

## Context

- Setup: React Router v7 + Vite static build → nginx → Caddy → :80
- Pain: Bundle JS lớn, nginx/caddy không nén, 11 API calls song song
- Report: [`../reports/researcher-260428-2056-web-load-analysis.md`](../reports/researcher-260428-2056-web-load-analysis.md)

## Phases

| # | Phase | Status | Impact | Effort |
|---|-------|--------|--------|--------|
| 01 | [Nén + cache-control nginx/caddy](phase-01-compression-and-cache.md) | TODO | CAO | XS |
| 02 | [Vite manualChunks + bundle splitting](phase-02-vite-bundle-split.md) | TODO | CAO | S |
| 03 | [Lazy heavy deps (xlsx, pdf, recharts)](phase-03-lazy-heavy-deps.md) | TODO | CAO | M |
| 04 | [Giảm/gộp 11 API calls bootstrap](phase-04-api-bootstrap-batch.md) | TODO | TB | M |
| 05 | [Đo lường + verify web-vitals](phase-05-measurement.md) | TODO | — | S |

## Strategy

- Triển khai theo thứ tự: Phase 01 → 02 → 03 (3 quick wins độc lập, có thể PR riêng)
- Phase 04 yêu cầu thay đổi backend (Django) → PR riêng, cần review team
- Phase 05 chạy trước Phase 01 để có baseline, chạy lại sau mỗi phase

## Success criteria

- LCP <2.5s trên Docker LAN với cold cache (hiện ~5-8s)
- Total transfer (initial load) <1.5MB gzip/br (hiện ~3-5MB)
- TTFB workspace API <500ms p95
- Số request initial load <40 (hiện ~70+)

## Dependencies

- Cần access modify `apps/web/nginx/nginx.conf`, `apps/proxy/Caddyfile.ce`, `apps/web/vite.config.ts`
- Phase 04 cần backend dev review (thay đổi Django ViewSet)

## Risks

- Brotli module nginx:1.27-alpine có sẵn? Fallback: dùng zstd ở caddy (đã có module)
- `manualChunks` sai config có thể tăng waterfall → cần verify với `vite-bundle-visualizer`
- Lazy import sai có thể vỡ SSR (React Router v7 hỗ trợ SPA mode nên rủi ro thấp)

## Next

Bắt đầu phase 01 sau khi user phê duyệt plan.
