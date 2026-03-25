# Header Daily Logtime Indicator

**Branch**: `ngoc-feat/workspaces-default-view`
**Created**: 2026-03-25
**Status**: Pending

## Summary

Add circular progress indicator showing current user's total logged time today (across all workspaces) to the left of the notification button in the top navigation header. Max 12 hours = full circle.

## Architecture Decision

**Backend**: New lightweight endpoint `GET /api/users/me/daily-worklog-total/` — returns only `total_minutes` for current user today, across ALL workspaces. Avoids calling per-workspace endpoints. Single DB query with date filter.

**Frontend**: New `DailyLogtimeIndicator` component using SVG circular progress ring. Fetched via SWR with 60s refresh. Placed in `top-navigation-root.tsx` before the notification button.

## Phases

| # | Phase | Status | Priority |
|---|-------|--------|----------|
| 1 | [Backend: Daily total endpoint](./phase-01-backend-endpoint.md) | Pending | High |
| 2 | [Frontend: Circular progress component](./phase-02-frontend-component.md) | Pending | High |
| 3 | [Integration: Header placement](./phase-03-header-integration.md) | Pending | High |

## Dependencies

- Phase 2 depends on Phase 1 (needs API contract)
- Phase 3 depends on Phase 2 (needs component)

## Risk

- Low complexity — single query endpoint, pure SVG component, minimal header change
- Timezone handling adds slight backend complexity (pytz/zoneinfo date computation)

## Validation Log

### Session 1 — 2026-03-25
**Trigger:** Initial plan validation before implementation
**Questions asked:** 5

#### Questions & Answers

1. **[Architecture]** The backend uses `date.today()` (server timezone) to filter today's worklogs. If users are in a different timezone than the server, their "today" may differ. How should date filtering work?
   - Options: Server timezone | User's browser timezone | UTC always
   - **Answer:** User's browser timezone
   - **Rationale:** Users may be in different timezone than server (e.g., server UTC, user Asia/Saigon). Server must compute "today" in user's local timezone to return correct data.

2. **[Assumptions]** The plan uses 12 hours as the max for a full progress ring. Should this cap be hardcoded or configurable?
   - Options: Hardcoded 12h | Per-workspace setting | Per-user preference
   - **Answer:** Hardcoded 12h (Recommended)
   - **Rationale:** Simple constant — no config infrastructure needed for MVP.

3. **[Scope]** The plan shows the total across ALL workspaces the user belongs to. Is this the correct scope?
   - Options: All workspaces | Current workspace only
   - **Answer:** All workspaces (Recommended)
   - **Rationale:** Cross-workspace total gives a complete picture of the user's day.

4. **[Architecture]** The component uses SWR with a 60-second refresh interval. Is this acceptable, or should it also refresh on user actions?
   - Options: 60s polling only | 60s + mutate on log | Manual refresh only
   - **Answer:** 60s polling only (Recommended)
   - **Rationale:** Simpler implementation; acceptable lag for a summary header indicator.

5. **[Architecture]** How should the frontend pass the user's timezone to the backend?
   - Options: Query param `?tz=Asia/Saigon` | HTTP header `X-Timezone` | Pass date string directly `?date=2026-03-25`
   - **Answer:** Query param `?tz=Asia/Saigon`
   - **Rationale:** Simple, explicit — backend reads `request.GET.get('tz')` and computes local date with zoneinfo.

#### Confirmed Decisions
- Timezone: pass user TZ as `?tz=` query param — backend computes local date
- Max hours: hardcoded 12h constant
- Scope: all workspaces
- Refresh: 60s SWR polling only

#### Action Items
- [ ] Phase 1: backend must accept `?tz=` param, use `zoneinfo` to compute today's date in user timezone
- [ ] Phase 2: service call must append `?tz=Intl.DateTimeFormat().resolvedOptions().timeZone`

#### Impact on Phases
- Phase 1: Add timezone-aware date computation using `zoneinfo.ZoneInfo(tz_param)` instead of `date.today()`
- Phase 2: Pass `tz` query param in `getUserDailyTotal()` service method

---

### Session 2 — 2026-03-25
**Trigger:** Re-validation to surface CE pattern and structural decisions before coding
**Questions asked:** 3

#### Questions & Answers

1. **[CE Pattern]** Phase 2 proposes modifying `apps/web/core/services/worklog.service.ts`. Per CE rules, core/ should not be modified except layout/hook files. Where should `getUserDailyTotal()` live?
   - Options: Add to core/services/worklog.service.ts | Create ce/services/worklog.service.ts
   - **Answer:** Create ce/services/worklog.service.ts
   - **Rationale:** CE rules prohibit modifying core/ services. New CE-specific service keeps core/ untouched and follows the established pattern.

2. **[Backend structure]** The plan creates `apps/api/plane/app/views/user/daily_worklog.py` inside a `user/` subdirectory. Does this subdirectory exist?
   - Options: Check & create subdirectory if missing | Add to existing flat user views file
   - **Answer:** Check & create subdirectory if missing
   - **Rationale:** Must verify actual backend structure before placing the file; create `user/__init__.py` if needed.

3. **[Architecture]** Where should the SWR key constant `USER_DAILY_WORKLOG_TOTAL` be defined?
   - Options: Inline string key in component | Add to existing SWR constants file
   - **Answer:** Inline string key in component (Recommended)
   - **Rationale:** Simple, no constants file needed — avoids over-engineering for a single-use key.

#### Confirmed Decisions
- CE service: create `apps/web/ce/services/worklog.service.ts`, do NOT modify core/services/
- Backend view: check if `views/user/` subdir exists; create with `__init__.py` if missing
- SWR key: inline string directly in component

#### Action Items
- [ ] Phase 2: Replace "Modify: core/services/worklog.service.ts" with "Create: ce/services/worklog.service.ts"
- [ ] Phase 1: Verify/create `apps/api/plane/app/views/user/` directory structure

#### Impact on Phases
- Phase 2: Service location changes from `core/services/worklog.service.ts` → new `ce/services/worklog.service.ts`
- Phase 1: Add step to check `views/user/` subdirectory existence before creating view file
