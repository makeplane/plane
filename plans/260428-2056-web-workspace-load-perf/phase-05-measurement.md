# Phase 05: Đo lường + verify web-vitals

**Priority:** P0 (chạy TRƯỚC + SAU mỗi phase) | **Status:** TODO

## Context Links

- Report: tổng quan
- Tools: Lighthouse, Chrome DevTools, `vite-bundle-visualizer`, `web-vitals` lib

## Overview

Tối ưu cần có baseline + so sánh số liệu. Phase này tạo bảng metrics chuẩn, chạy trước Phase 01 và lặp lại sau mỗi phase.

## Key Insights

- LCP (Largest Contentful Paint), FCP, TTI là chỉ số ưu tiên
- Network: total transfer, request count, max chunk size
- Server: TTFB của bootstrap calls

## Metrics Template

| Metric | Baseline | Sau P01 | Sau P02 | Sau P03 | Sau P04 | Target |
|--------|----------|---------|---------|---------|---------|--------|
| LCP (cold cache) | ? | | | | | <2.5s |
| FCP | ? | | | | | <1.8s |
| TTI | ? | | | | | <3.5s |
| Total transfer (gzip) | ? | | | | | <1.5MB |
| Request count initial | ? | | | | | <40 |
| Main entry chunk size (gzip) | ? | | | | | <300KB |
| API bootstrap p95 | ? | | | | | <600ms |
| Repeat visit transfer | ? | | | | | <50KB (cache hit) |

## Implementation Steps

### Step 1 — Lighthouse CLI baseline

```bash
npx lighthouse http://localhost/{workspaceSlug}/ \
  --preset=desktop \
  --output=json --output=html \
  --output-path=./plans/260428-2056-web-workspace-load-perf/measurements/baseline.html \
  --chrome-flags="--headless"
```

Lưu artifact vào `plans/260428-2056-web-workspace-load-perf/measurements/`.

### Step 2 — Chrome DevTools manual

- Mở DevTools → Network tab → Disable cache → Slow 3G profile
- Đo: LCP (Performance tab), total transfer, request count
- Capture HAR file lưu vào `measurements/baseline.har`

### Step 3 — Bundle size

```bash
cd apps/web
npx vite-bundle-visualizer -t treemap -o ../../plans/260428-2056-web-workspace-load-perf/measurements/bundle-baseline.html
```

### Step 4 — Backend timing

- Bật Django middleware log response time (đã có?)
- Curl đo p95 bootstrap endpoint sau Phase 04:
```bash
for i in {1..30}; do curl -w "%{time_total}\n" -o /dev/null -s \
  -H "Cookie: sessionid=..." \
  http://localhost/api/workspaces/shinhan-bank-vn/bootstrap/; done | sort -n
```

### Step 5 — Lặp sau mỗi phase

Sau khi merge mỗi phase, chạy lại Step 1-3, ghi vào bảng metrics, commit artifacts.

## Todo List

- [ ] Tạo thư mục `measurements/`
- [ ] Chạy Lighthouse baseline
- [ ] Capture HAR baseline
- [ ] Bundle visualizer baseline
- [ ] Ghi số liệu baseline vào bảng
- [ ] Lặp sau Phase 01 (compression)
- [ ] Lặp sau Phase 02 (manualChunks)
- [ ] Lặp sau Phase 03 (lazy deps)
- [ ] Lặp sau Phase 04 (bootstrap batch)
- [ ] Báo cáo cuối: so sánh trước/sau toàn bộ

## Success Criteria

- Có dữ liệu định lượng cho mọi phase
- Verify từng phase đạt mục tiêu trước khi qua phase tiếp theo

## Risks

- Lighthouse score biến động giữa các lần chạy → chạy 3 lần lấy median
- Mạng nội bộ Docker khác mạng public → đo cả 2 môi trường

## Next

Sau Phase 05 cuối: tổng kết, đề xuất phase 06+ nếu cần (service worker, http2 push, font subsetting, …)
