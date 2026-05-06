# Phase 1 — Route Simplification (Hide Schedules List)

## Context Links

- Parent: [plan.md](./plan.md)
- Reads: `apps/admin/store/business-calendar.store.ts` (already exposes `defaultSchedule` getter), `apps/admin/components/calendar/schedules-list.tsx` (kept on disk, unmounted)
- Rule refs: `.claude/rules/component-libraries.md`, `.claude/rules/dialogs-modals.md`

## Overview

- **Priority**: P1 (blocks P2/P3 — they need stable host route)
- **Status**: ✅ Complete
- **Effort**: 0.5d
- **Description**: `/calendar` auto-picks `is_default=true` schedule and renders `ScheduleDetail` directly. Hide list-of-schedules UI from DOM (do NOT delete files — workspace-scoped reuse later). If no default schedule exists, show empty-state with one-click "Khởi tạo lịch mặc định" CTA calling `createSchedule({ ...VN defaults, is_default: true })`.

## Key Insights

- `business-calendar.store.ts` already exposes `defaultSchedule` getter (line 95-97) — no store change needed
- `useSWR("BUSINESS_CALENDAR_SCHEDULES", fetchSchedules)` pattern from `schedules-list.tsx` must be hoisted to `page.tsx`
- `ScheduleDetail` currently has `<button onClick={navigate("/calendar/")}>` back-arrow — must be removed (no list to go back to)
- Delete button → hide entirely per Unresolved Question #1 (foot-gun reduction)
- `/calendar/detail/:scheduleId/page.tsx` route is ONLY entry point now obsolete (was used by list-card click); remove the route file to avoid orphan URLs
- Empty-state CTA must be idempotent — if user double-clicks, store de-dupes via `set(schedulesMap, created.id, ...)` (already handled)

## Requirements

### Functional

1. Visiting `/calendar` triggers `fetchSchedules()` once on mount (SWR-cached)
2. If `schedules.length === 0` AND not loading → render empty-state card with single button "Khởi tạo lịch mặc định"
3. If `defaultSchedule` exists → render `<ScheduleDetail scheduleId={defaultSchedule.id} />`
4. If `schedules.length > 0` but no default → render first schedule (defensive; backend ensures one default but UI must not crash)
5. Empty-state CTA disabled while creation pending; on success show toast `"Đã khởi tạo lịch mặc định"` and rerender to `ScheduleDetail`
6. `/calendar/detail/:scheduleId/page.tsx` route removed (404 if accessed directly — acceptable since no link emits this URL anymore)

### Non-functional

- File size: `page.tsx` < 100 lines (currently 30, will grow with empty-state); `schedule-detail.tsx` < 130 (currently 117, simpler after header trim)
- Zero new dependencies
- Zero API change

## Architecture

```
/calendar route
├─ page.tsx (NEW responsibility)
│   ├─ useSWR("BUSINESS_CALENDAR_SCHEDULES", fetchSchedules)  ← was in schedules-list.tsx
│   ├─ const { schedules, defaultSchedule, loader, createSchedule } = useBusinessCalendar()
│   ├─ if loader → <Loader />
│   ├─ if schedules.length === 0 → <EmptyStateInit onInit={...} />  ← inline component
│   └─ else → <ScheduleDetail scheduleId={defaultSchedule?.id ?? schedules[0].id} />
│
└─ ScheduleDetail (TRIMMED)
    ├─ ❌ remove ArrowLeft back-button
    ├─ ❌ remove "Xoá" Trash2 button + handleDelete
    ├─ ❌ remove "Quay lại danh sách" link in not-found state (replace text)
    ├─ ✅ keep tabs: workweek | calendar
    └─ ✅ keep header: name + Mặc định pill + timezone/country
```

### Data flow

```
User visits /calendar
  → page.tsx mounts
  → SWR triggers fetchSchedules()
  → store.schedulesMap populated
  → defaultSchedule getter returns schedule with is_default=true
  → ScheduleDetail receives scheduleId, reads schedulesMap[scheduleId]
  → renders WorkweekToggle (default tab) + HolidaysYearView (other tab)
```

### VN default constants (used by empty-state CTA)

```ts
const VN_DEFAULT_SCHEDULE: IWorkScheduleCreate = {
  name: "VN Banking",
  timezone: "Asia/Ho_Chi_Minh",
  country_code: "VN",
  week_pattern: [true, true, true, true, true, false, false], // T2-T6
  is_default: true,
};
```

## Related Code Files

### Modify

- `apps/admin/app/(all)/(dashboard)/calendar/page.tsx` — fetch + branch on schedule existence, inline empty-state
- `apps/admin/components/calendar/schedule-detail.tsx` — remove back-arrow, delete button, "Quay lại danh sách" text
- `apps/admin/components/calendar/index.ts` — drop exports of `schedules-list`, `schedule-card`, `create-schedule-modal` (files stay on disk)

### Create

- (none)

### Delete

- `apps/admin/app/(all)/(dashboard)/calendar/detail/page.tsx` (and parent `/detail/` directory + `+types/page.d.ts` if generated)

### Untouched on disk (unmounted only)

- `apps/admin/components/calendar/schedules-list.tsx`
- `apps/admin/components/calendar/schedule-card.tsx`
- `apps/admin/components/calendar/create-schedule-modal.tsx`

## Implementation Steps

1. Update `apps/admin/components/calendar/index.ts` — remove `export * from "./schedule-card"` / `./schedules-list` / `./create-schedule-modal`. Keep all other exports.
2. Refactor `apps/admin/app/(all)/(dashboard)/calendar/page.tsx`:
   - Import `useBusinessCalendar`, `useSWR`, `Button`, `Loader`, `ScheduleDetail`, `setToast`
   - Define `VN_DEFAULT_SCHEDULE` const
   - Hook: `const { schedules, defaultSchedule, loader, createSchedule } = useBusinessCalendar()`
   - SWR: `useSWR("BUSINESS_CALENDAR_SCHEDULES", fetchSchedules)`
   - State: `const [initing, setIniting] = useState(false)`
   - Render branches: loader → skeleton; empty → init card; else → `<ScheduleDetail scheduleId={(defaultSchedule ?? schedules[0]).id} />`
   - Empty-state inline component renders centered card with title "Chưa có lịch làm việc", description, primary Button "Khởi tạo lịch mặc định" calling `createSchedule(VN_DEFAULT_SCHEDULE)` then toast success/error
3. Trim `apps/admin/components/calendar/schedule-detail.tsx`:
   - Remove `useNavigate`, `ArrowLeft`, `Trash2` imports
   - Remove `isDeleting` state, `handleDelete` callback
   - Remove back-arrow button (lines 63-69)
   - Remove "Xoá" button block (lines 84-87)
   - Replace not-found state link "Quay lại danh sách" with simple text "Vui lòng làm mới trang." (no nav target)
   - Confirm component still <130 lines
4. Delete `apps/admin/app/(all)/(dashboard)/calendar/detail/` directory entirely (route + +types):
   ```
   rm -rf apps/admin/app/(all)/(dashboard)/calendar/detail
   ```
   (verify no router config references this path; React Router v7 file-based routing auto-detects)
5. Run `pnpm typecheck --filter admin` — expect zero errors
6. Run `pnpm build --filter admin` — expect zero errors
7. Manual smoke: navigate `/calendar`, verify empty-state appears on fresh DB; click "Khởi tạo lịch mặc định"; verify ScheduleDetail renders with name "VN Banking"

## Todo List

- [ ] P1.1 Update `index.ts` exports (drop list/card/modal)
- [ ] P1.2 Rewrite `page.tsx` with SWR fetch + branching
- [ ] P1.3 Add `VN_DEFAULT_SCHEDULE` const + empty-state inline component
- [ ] P1.4 Trim `schedule-detail.tsx` (remove back-arrow + delete button + nav)
- [ ] P1.5 Delete `app/(all)/(dashboard)/calendar/detail/` directory
- [ ] P1.6 Run `pnpm typecheck --filter admin` (must be 0 errors)
- [ ] P1.7 Run `pnpm build --filter admin` (must succeed)
- [ ] P1.8 Manual smoke: empty state + init CTA + ScheduleDetail render

## Success Criteria

- `/calendar` route renders without "Lịch làm việc" list header / "Tạo lịch mới" button / list of cards
- Empty state with init CTA appears when DB has no schedules; click creates default and rerenders ScheduleDetail
- ScheduleDetail header has no back-arrow, no delete button
- `/calendar/detail/:id` returns 404 (route removed)
- TypeScript: `pnpm typecheck --filter admin` → 0 errors
- Build: `pnpm build --filter admin` → success
- Backend untouched: `git diff apps/api/` empty

## Risk Assessment

| Risk                                                                              | Likelihood | Impact | Mitigation                                                                                   |
| --------------------------------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------- |
| Empty-state CTA fires twice on double-click                                       | Medium     | Low    | `disabled={initing}` guard + setIniting before await                                         |
| Backend rejects duplicate `is_default=true` (parent migration already seeded one) | Medium     | Med    | Catch 4xx, re-fetch schedules; if `defaultSchedule` now exists, swallow error and toast info |
| `defaultSchedule` undefined when only non-default schedules exist                 | Low        | Low    | Fallback `schedules[0].id`; defensive                                                        |
| Existing bookmarks to `/calendar/detail/<id>` break                               | Low        | Low    | Acceptable — no public link to this route from anywhere; admin only                          |
| `Loader` from `@plane/ui` not yet imported in `page.tsx`                          | Low        | Low    | Add import (already used in `schedules-list.tsx`)                                            |

## Security Considerations

- `createSchedule` already enforces `InstanceAdminPermission` on backend — no client-side gate needed
- No new PII exposed — schedule data is admin-only metadata
- CSRF + auth via existing service-level interceptors (unchanged)

## Next Steps

- Unblocks P2 (workweek-toggle now hosted in trimmed ScheduleDetail)
- Unblocks P3 (HolidaysYearView still receives same `scheduleId` prop, can extend with `weekPattern`)
- Future workspace-scoped schedules: re-export `SchedulesList` from `index.ts`, restore route under `/workspaces/:slug/calendar` (out of scope here)
