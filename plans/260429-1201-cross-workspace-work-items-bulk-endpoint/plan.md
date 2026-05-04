# Plan: Cross-workspace Work Items Bulk Endpoint

**Created:** 2026-04-29 12:01 | **Owner:** duonglx + backend dev
**Goal:** Giải quyết dứt điểm vấn đề profile "Your Work" page chậm với 50-100 workspaces toàn ngân hàng Shinhan.

## Context

- **Hiện tại:** 50 workspaces → 300+ API calls/profile load → ~10-20s
- **Target:** 100 workspaces (toàn ngân hàng) → 1 API call → <1s
- **Constraint:** KHÔNG break logic hiện tại của TodayWorkItems + OverdueWorkItems
- **Reports liên quan:**
  - [Profile page perf analysis](../reports/researcher-260429-0818-profile-page-perf-analysis.md)
  - [Cross-workspace fetch optimization](../reports/researcher-260429-0921-cross-workspace-fetch-optimization.md)

## Phases

| # | Phase | Owner | Status | Effort |
|---|-------|-------|--------|--------|
| 01 | [Design spec — logic preservation](phase-01-design-spec.md) | full-stack | TODO | 30 phút |
| 02 | [Backend bulk endpoint](phase-02-backend-bulk-endpoint.md) | backend | TODO | 2-3 giờ |
| 03 | [Redis cache](phase-03-redis-cache.md) | backend | TODO | 30 phút |
| 04 | [Frontend refactor](phase-04-frontend-refactor.md) | frontend | TODO | 1-1.5 giờ |
| 05 | [Testing + rollout + deprecate old](phase-05-testing-and-rollout.md) | full-stack | TODO | 1 giờ |

**Tổng effort:** 5-6 giờ (1 backend + 1 frontend dev có thể parallel Phase 02 + 04 sau khi Phase 01 done).

## Strategy

1. **Phase 01 trước** — Lock design (request/response contract) để backend + frontend làm parallel
2. **Phase 02 + 04 parallel** sau khi spec lock
3. **Phase 03** có thể merge với Phase 02 nếu cùng dev
4. **Phase 05** sau khi merge, verify production

## Success criteria

- API calls khi mở profile: 300+ → **2** (1 today + 1 overdue, hoặc gộp 1)
- TTFB profile page: <1s (từ ~10-20s)
- Backend cache hit ratio: >70% sau warmup
- Logic preserved: tất cả cases TodayWorkItems + OverdueWorkItems hoạt động giống cũ
- **Bug Fix kèm**: categories cross-workspace hiển thị đúng (hiện tại empty)

## Dependencies

- Backend dev có quyền add endpoint + view trong `apps/api/plane/`
- Redis container đã sẵn sàng (`planeso-plane-redis-1` đã chạy)
- Frontend dev có quyền refactor `apps/web/ce/components/profile/`

## Risks

| Risk | Mitigation |
|------|-----------|
| Break logic existing (filter/sort/category) | Phase 01 lock spec, Phase 05 regression test |
| Endpoint mới perm leak (user thấy issue ngoài quyền) | Filter `WorkspaceMember.is_active=True` + `project_projectmember.is_active=True` (giữ nguyên logic cũ) |
| Cache stale data sau create/update issue | TTL ngắn 30s + invalidate trên signal post_save Issue |
| Endpoint cũ vẫn dùng bởi mobile/third-party | Phase 05 deprecate có thông báo, giữ song song 1 quarter |
| Payload lớn nếu user có >500 issues | Cap `[:500]` server-side + add pagination param sau |

## Branch + PR strategy

- Branch: `duonglx/perf/profile-cross-workspace-bulk`
- Base: `develop`
- 1 PR cho cả backend + frontend (atomic deploy) hoặc 2 PR (BE merge trước với feature flag, FE merge sau khi BE production-ready)

## Next

Bắt đầu Phase 01 — lock design spec.
