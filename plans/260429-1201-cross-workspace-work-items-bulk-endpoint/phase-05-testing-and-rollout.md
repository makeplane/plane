# Phase 05: Testing + rollout + deprecate old endpoint

**Priority:** P0 | **Status:** TODO | **Effort:** 1 giờ | **Owner:** full-stack

## Goal

Verify production-ready, rollout an toàn, deprecate code cũ.

## Test matrix

### Backend (Django)

- [x] Unit tests Phase 02 (>= 10 cases)
- [ ] Integration test: end-to-end với DB sample data
- [ ] Performance test: EXPLAIN ANALYZE <100ms p95
- [ ] Permission test: user A không thấy issue user B
- [ ] Permission test: user A không thấy issue ngoài workspace là member
- [ ] Cache test: HIT vs MISS, TTL expiry, invalidate
- [ ] Edge case: user 0 workspace → empty response
- [ ] Edge case: user >500 issues → cap + meta.capped=true

### Frontend (Vite)

- [ ] Type check: `pnpm check:types`
- [ ] Lint: `pnpm check:lint`
- [ ] Build: `pnpm --filter web build`
- [ ] Smoke test trang profile:
  - Load profile của bản thân
  - Toggle crossWorkspaces ON/OFF
  - Verify sort + filter table
  - Verify export XLSX
  - Verify category name hiển thị (cross-workspace)
- [ ] Network tab: 2 calls thay 300 calls
- [ ] Lighthouse: LCP <2s

### E2E (Playwright)

```bash
PLANE_USER=leduong12c@gmail.com PLANE_PASS='Shinhan@1' \
  node plans/260428-2056-web-workspace-load-perf/verify/measure-login-flow.mjs \
  http://localhost shinhan-bank-vn
```

Đo:
- TTFB profile page <500ms
- LCP <2s
- Total request count <50 (so với baseline 300+)

## Rollout strategy

### Strategy A: Feature flag (RECOMMENDED nếu có infra)

```python
# Backend feature flag
USE_BULK_WORK_ITEMS = os.getenv("FEATURE_BULK_WORK_ITEMS", "false") == "true"

# Frontend
const USE_BULK = process.env.VITE_FEATURE_BULK_WORK_ITEMS === "true";
const Component = USE_BULK ? WorkItemsSection : TodayWorkItems;
```

→ Bật flag dần: dev → staging → 10% prod → 100% prod.

### Strategy B: Direct cutover

1. Merge BE PR → deploy → verify endpoint mới hoạt động
2. Merge FE PR → deploy → verify UI dùng endpoint mới
3. Monitor 24h
4. Nếu ổn → remove endpoint cũ Phase 05

→ Nhanh hơn nhưng risk rollback phức tạp.

**Recommend Strategy B** cho team nhỏ Shinhan (4 người).

## Deprecate old code

Sau khi Strategy B verify ổn (≥1 tuần):

### Files to remove

```
apps/web/ce/components/profile/today-work-items.tsx       (DELETE)
apps/web/ce/components/profile/overdue-work-items.tsx     (DELETE)
```

### Backend endpoint cũ

`apps/api/plane/app/views/workspace/user.py:WorkspaceUserProfileIssuesEndpoint` — KHÔNG xoá vì:
- Có thể còn được dùng cho `/[profileViewId]/` (assigned/created/subscribed) sub-routes
- Mobile/third-party clients có thể consume

→ Giữ song song. Add deprecation comment:
```python
class WorkspaceUserProfileIssuesEndpoint(BaseAPIView):
    """
    DEPRECATED for "Today Work" and "Overdue Work" use cases.
    Use UserWorkItemsTimelineEndpoint (/api/users/me/work-items/) instead
    for cross-workspace + better performance.

    Still active for /profile/[userId]/[profileViewId]/ filtered views.
    """
```

### Frontend service cũ

`apps/web/core/services/user.service.ts:getUserProfileIssues` — KHÔNG xoá, vẫn dùng cho:
- `apps/web/core/store/user/profile/issues.ts` (profile view filter)
- Các sub-routes assigned/created/subscribed

## Monitoring sau rollout

### Metrics to watch

| Metric | Source | Threshold |
|--------|--------|-----------|
| Profile page LCP | Sentry / Lighthouse | <2s |
| API `/users/me/work-items/` p95 | Django middleware logs | <500ms |
| API `/users/me/work-items/` cache hit ratio | Redis logs | >70% |
| API `/workspaces/{slug}/user-issues/{userId}/` call count | API logs | giảm 90% |
| User feedback "load chậm" | Slack / support | giảm |

### Rollback plan

Nếu có bug critical:
1. Frontend: revert PR FE → page lại dùng TodayWorkItems/OverdueWorkItems cũ
2. Backend: endpoint mới giữ trên prod (idle, không hại)
3. Investigate + fix forward

## Acceptance criteria Phase 05

- [ ] All tests pass
- [ ] Smoke test profile page OK
- [ ] Network calls <50 (so với 300+)
- [ ] LCP <2s on staging
- [ ] No regression trong sub-routes profile
- [ ] Monitor 24h sau deploy không có error spike
- [ ] User feedback positive

## Final checklist trước khi đóng plan

- [ ] PR backend merged
- [ ] PR frontend merged
- [ ] Production deployed
- [ ] Old code TodayWorkItems/OverdueWorkItems removed (sau 1 tuần verify)
- [ ] Documentation updated (`docs/codebase-summary.md` nếu có)
- [ ] Plan này archived → `plans/archived/`

## Câu hỏi unresolved

- Có Sentry/APM trong môi trường Shinhan không? Để monitor metrics tốt hơn.
- Mobile app có dùng endpoint cũ không?
- Có cần update OpenAPI / API doc không?
