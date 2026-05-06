# Báo cáo: Phân tích tải chậm sau login → workspace

**Date:** 2026-04-28 20:56 (Asia/Saigon)
**Scope:** `apps/web` post-login load (`/` → `/[workspaceSlug]/`)
**Stack:** React Router v7 + Vite + MobX + SWR, served by nginx (static) qua Caddy proxy

## Setup runtime hiện tại

- `planeso-proxy-1` (caddy:2-alpine) listen :80 → proxy tới `web:3000` (nginx static)
- `apps/web` build sẵn (`react-router build`) → `build/client` → nginx serve
- KHÔNG phải dev mode (vite-dev compile-on-demand)

## Nguyên nhân chính (xếp theo impact)

### 1. Nginx & Caddy KHÔNG nén + KHÔNG cache (impact: CAO nhất)
- `apps/web/nginx/nginx.conf`: thiếu `gzip on`, thiếu `brotli`, thiếu `expires`/`Cache-Control: immutable` cho assets có hash
- `Caddyfile.ce`: không config `encode gzip zstd`, không cache headers
- Hệ quả: mỗi reload tải lại nguyên bundle JS (vài MB) ở dạng raw → trên LAN nội bộ vẫn chậm vì size/bandwidth

### 2. Vite không cấu hình `manualChunks` (impact: CAO)
- `apps/web/vite.config.ts` chỉ có `assetsInlineLimit: 0`, không define `build.rollupOptions.output.manualChunks`
- React Router v7 + Vite mặc định ship vendor chung trong main chunk lớn
- Heavy deps đi chung chunk: `recharts`, `@react-pdf/renderer`, `xlsx`, `react-pdf-html`, `@atlaskit/pragmatic-drag-and-drop` (3 packages), `react-grid-layout`, `emoji-picker-react`, `@plane/editor`, `react-markdown`, `@tanstack/react-table`

### 3. Heavy deps không lazy theo feature (impact: CAO)
- `xlsx@0.18.5` (~600KB minified) load dù chỉ dùng khi export Excel
- `@react-pdf/renderer@^3.4.5` + `react-pdf-html` (~1MB+) load dù chỉ dùng khi export PDF
- `recharts@^2.12.7` (~500KB) load dù chỉ dashboard hiển thị
- `xlsx` + `export-to-csv` cùng tồn tại → có thể bỏ 1 cái
- 5 font packages: `@fontsource-variable/inter`, `@fontsource/ibm-plex-mono`, `@fontsource/material-symbols-rounded` → font icon set có thể MB

### 4. 11 API calls song song khi mount workspace (impact: TRUNG BÌNH)
File `apps/web/core/layouts/auth-layout/workspace-wrapper.tsx:76-128` (8 SWR) + thêm 3 calls:
1. `WORKSPACE_MEMBER_ME_INFORMATION`
2. `WORKSPACE_PROJECTS_ROLES_INFORMATION`
3. `WORKSPACE_PARTIAL_PROJECTS`
4. `WORKSPACE_MEMBERS`
5. `WORKSPACE_FAVORITE` (conditional)
6. `WORKSPACE_STATES`
7. `WORKSPACE_SIDEBAR_PREFERENCES`
8. `WORKSPACE_PROJECT_NAVIGATION_PREFERENCES`
9. `WORKSPACE_TASK_CATEGORIES` (`ce/components/workspace/content-wrapper.tsx`)
10. `WORKSPACE_UNREAD_NOTIFICATION_COUNT` (`ce/components/navigations/top-navigation-root.tsx`)
11. `USER_DAILY_WORKLOG_TOTAL` (`ce/components/navigations/daily-logtime-indicator.tsx`, refresh 60s)

→ Backend Django (gunicorn) bị 11 request đồng thời, mỗi req: auth check + perm check + serialize → tăng TTFB nếu workers ít

### 5. Bootstrap providers không lazy theo route (impact: TRUNG BÌNH)
- `app/provider.tsx`: chỉ 4 component lazy (AppProgressBar, StoreWrapper, InstanceWrapper, ChatSupportModal)
- `StoreWrapper` init full 33+ MobX stores ngay khi mount, kể cả store không dùng ở workspace landing
- `ProjectsAppPowerKProvider` + `TopNavigationRoot` + `AppRailRoot` load eager → command palette commands eager

### 6. `assetsInlineLimit: 0` (impact: THẤP)
- Không inline asset nhỏ → nhiều request HTTP nhỏ. HTTP/2 mitigates nhưng vẫn cost RTT

## Quick wins (ưu tiên triển khai trước)

| # | Hành động | Effort | Impact ước tính |
|---|-----------|--------|------------------|
| QW1 | Bật gzip + brotli + cache-control immutable trong `nginx.conf` | 15 phút | -50→70% transfer size, -1→3s reload |
| QW2 | Bật `encode zstd gzip` trong Caddyfile | 5 phút | bổ trợ QW1 khi traffic qua caddy |
| QW3 | Add `manualChunks` vào `vite.config.ts` (vendor split) | 30 phút | giảm main chunk 40-60% |
| QW4 | Lazy import `xlsx`, `@react-pdf/renderer`, `recharts` ở point-of-use (dynamic import) | 1-2 giờ | giảm initial JS ~1.5-2MB |
| QW5 | Loại bỏ `xlsx` nếu chỉ dùng cho CSV export, dùng `export-to-csv` | 30 phút | -600KB |

## Long-term

- Tạo endpoint backend `/api/workspaces/{slug}/bootstrap/` gộp 8 calls → 1 round-trip
- Subset font Material Symbols Rounded (chỉ load icon dùng thực)
- Add `<link rel="preload">` cho font + chunk critical
- Service Worker cho repeat-visit offline-first
- HTTP/2 server push hoặc 103 Early Hints

## Câu hỏi chưa giải quyết

- Có dùng được Brotli trong nginx:1.27-alpine official không? (cần `nginx-module-brotli` hoặc dùng zstd qua caddy)
- Backend Django có bao nhiêu gunicorn workers trong setup hiện tại? (ảnh hưởng khả năng phục vụ 11 parallel calls)
- Có cho phép thay đổi backend (`/bootstrap/` endpoint) hay chỉ tối ưu phía frontend?
- User có muốn đo lường lighthouse/web-vitals trước-sau để verify số liệu không?
