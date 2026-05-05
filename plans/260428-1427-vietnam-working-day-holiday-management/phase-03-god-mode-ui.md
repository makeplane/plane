# Phase 03 — God-Mode UI

<!-- Updated: Validation Session 1 — Q7 (use @plane/propel/calendar if available; fallback custom Tailwind grid) -->

## Context Links

- Research: `/plans/reports/researcher-260428-1412-vietnam-working-day-holiday-management.md` (Section 7)
- Admin app: `apps/admin/AGENTS.md`
- Routes config: `apps/admin/app/routes.ts`
- Reference store: `apps/admin/store/instance-task-category.store.ts`, `instance-job-position.store.ts`
- Reference services: `packages/services/src/task-category/task-category.service.ts`, `packages/services/src/instance/instance.service.ts`
- Project memory: admin app uses NO i18n (hardcode VN strings)

## Overview

- **Priority**: P2
- **Status**: ✅ Complete
- **Effort**: 3 ngày
- **Description**: God-mode UI tại `/calendar` route — Schedules list + Schedule detail (workweek toggle + holidays year-view + overrides table) + Copy-from-previous-year action.

## Key Insights

- Admin app: React 18 + React Router v7 + MobX + Tailwind v4 + `@plane/propel/*`
- Service layer ở **`packages/services/src/`** (shared package), NOT `apps/admin/services/` (chỗ này không tồn tại)
- Pattern `observer()` từ `mobx-react`; `makeObservable` explicit; `set()` từ `lodash-es`
- Semantic color tokens: `text-primary`, `bg-surface-1`, `border-subtle`
- File <150 lines cho component; split lớn ra
- Hardcode VN strings (admin no i18n per memory)

## Requirements

### Functional

- Nav entry: sidebar "Business Calendar" trong dashboard layout
- Schedules list page: card grid, badge "Default" cho `is_default=true`, button "Create Schedule"
- Schedule detail page: 2 tabs
  - **Workweek**: 7 toggle T2–CN; auto-save on change
  - **Calendar**: year picker + 12-month grid (lễ đỏ, override-workday cam, override-holiday vàng); click ô → modal CRUD
- Day Overrides table: list ngày swap, columns date / type / swap_with / reason / actions
- "Copy from previous year" button → modal chọn from/to year → submit → toast warning về lunar holidays
- Form validation: date format YYYY-MM-DD, type ∈ {WORKDAY,HOLIDAY}

### Non-functional

- Component <150 lines (split khi vượt)
- All `observer()` wrap MobX-reading components
- `@plane/propel/*` first; `@plane/ui` chỉ dùng nếu propel không có
- Loading skeleton + error toast (existing util `setToast`)
- Responsive desktop ưu tiên (admin chủ yếu desktop)

## Architecture

### Component Tree

```
/calendar (page) → SchedulesList
  ├── ScheduleCard × N
  └── CreateScheduleModal

/calendar/:scheduleId (page) → ScheduleDetail
  ├── ScheduleHeader (name + edit + delete)
  ├── Tabs
  │   ├── WorkweekTab → WorkweekToggle (7 switches)
  │   └── CalendarTab
  │       ├── YearPicker + CopyYearButton
  │       ├── HolidaysYearView (12-month grid)
  │       └── DayOverridesTable
  ├── HolidayFormModal
  ├── DayOverrideFormModal
  └── CopyYearModal
```

### Data Flow

```
Component (observer) → store action → service.fetchX/createX
                                     → API → server
                       store.runInAction(() => set())
                       → component re-render
```

### MobX Store

```ts
class BusinessCalendarStore {
  schedulesMap: Record<string, IWorkSchedule> = {}
  holidaysMap: Record<string, IHoliday[]>      // keyed `${scheduleId}:${year}`
  overridesMap: Record<string, IDayOverride[]>
  loader: boolean = false
  error: string | null = null

  fetchSchedules()
  createSchedule(data)
  updateSchedule(id, data)
  deleteSchedule(id)
  fetchHolidays(scheduleId, year)
  createHoliday / updateHoliday / deleteHoliday
  fetchOverrides / create / update / delete
  copyYear(scheduleId, fromYear, toYear)
  // computed
  schedules: IWorkSchedule[]
  defaultSchedule: IWorkSchedule | undefined
  getHolidaysForYear(scheduleId, year)
  getOverridesForYear(scheduleId, year)
}
```

## Related Code Files

### To create (frontend)

- `apps/admin/store/business-calendar.store.ts` — MobX store (≤150 lines)
- `apps/admin/store/business-calendar.types.ts` — TypeScript interfaces (if not in `packages/types`)
- `apps/admin/app/(all)/(dashboard)/calendar/page.tsx` — Schedules list page
- `apps/admin/app/(all)/(dashboard)/calendar/[id]/page.tsx` — Schedule detail page (router param syntax — verify v7 convention from existing route)
- `apps/admin/components/calendar/index.ts` — barrel
- `apps/admin/components/calendar/schedules-list.tsx`
- `apps/admin/components/calendar/schedule-card.tsx`
- `apps/admin/components/calendar/create-schedule-modal.tsx`
- `apps/admin/components/calendar/schedule-detail.tsx`
- `apps/admin/components/calendar/workweek-toggle.tsx`
- `apps/admin/components/calendar/holidays-year-view.tsx`
- `apps/admin/components/calendar/holidays-month-grid.tsx`
- `apps/admin/components/calendar/day-overrides-table.tsx`
- `apps/admin/components/calendar/holiday-form-modal.tsx`
- `apps/admin/components/calendar/day-override-form-modal.tsx`
- `apps/admin/components/calendar/copy-year-modal.tsx`

### To create (shared services package)

- `packages/services/src/business-calendar/business-calendar.service.ts`
- `packages/services/src/business-calendar/index.ts`
- Update `packages/services/src/index.ts` — export new service

### To create (types package — if exists; else local types)

- `packages/types/src/business-calendar/index.ts` — `IWorkSchedule, IHoliday, IDayOverride` (verify packages/types layout first)

### To modify

- `apps/admin/app/routes.ts` — add `/calendar` and `/calendar/:scheduleId` routes
- `apps/admin/store/root.store.ts` — wire `businessCalendar: BusinessCalendarStore` (verify root store import pattern from existing stores)
- Sidebar nav component (find via grep for "task-categories" link in admin to locate nav file) — add Business Calendar item

## Implementation Steps

1. **Recon**: read these files first to confirm patterns:
   - `apps/admin/store/instance-task-category.store.ts` (store shape)
   - `apps/admin/store/root.store.ts` (root wiring)
   - `apps/admin/app/(all)/(dashboard)/task-categories/page.tsx` (page shape)
   - `packages/services/src/task-category/task-category.service.ts` (service shape)
   - **`packages/propel/src/calendar/`** (or grep `Calendar` export from `@plane/propel`) — verify if propel ships a calendar primitive. **If yes:** use it for month grid. **If no:** fallback to custom Tailwind grid + `date-fns` (~150 lines).
2. **Types**: define `IWorkSchedule`, `IHoliday`, `IDayOverride` interfaces. Locate `packages/types/src/` — add there if convention; else `apps/admin/store/business-calendar.types.ts`.
3. **Service**: create `packages/services/src/business-calendar/business-calendar.service.ts`:
   - Class extends `APIService` (existing base in package)
   - Methods mirror API endpoints (P1): `fetchSchedules, createSchedule, ...`
   - Base URL `/api/instances/calendar/`
   - Export from `packages/services/src/index.ts`
4. **Store**: `business-calendar.store.ts` (≤150 lines):
   - `makeObservable` explicit annotations
   - All async actions → try/catch + `runInAction` for state mutation
   - `set()` from `lodash-es` for nested updates
5. **Wire root store**: `root.store.ts` add `businessCalendar = new BusinessCalendarStore(this)`. Use existing root pattern.
6. **Routes**: edit `routes.ts` add 2 routes. Pages re-export components.
7. **Sidebar nav**: grep for existing "Departments" or "Task Categories" entry in nav config, add "Business Calendar" item with calendar icon.
8. **Build components** in order:
   - `schedules-list.tsx` — fetch on mount, map to `schedule-card.tsx`
   - `schedule-card.tsx` — propel Card; click → navigate
   - `create-schedule-modal.tsx` — propel Modal + form
   - `schedule-detail.tsx` — Tabs (propel Tabs), state for active tab
   - `workweek-toggle.tsx` — 7 propel Switch; debounced auto-save
   - `holidays-year-view.tsx` — year picker + grid container, lazy fetch by year
   - `holidays-month-grid.tsx` — render 1 month, color-code cells
   - `day-overrides-table.tsx` — propel Table
   - `holiday-form-modal.tsx`, `day-override-form-modal.tsx` — create/edit forms
   - `copy-year-modal.tsx` — from/to year inputs + submit + warnings
9. **Visual polish**: Tailwind tokens `bg-red-500/10 text-red-700` cho holiday, `bg-amber-500/10 text-amber-700` cho override-workday. Use semantic `text-primary` / `bg-surface-1` for backgrounds.
10. **Build check**: `pnpm build --filter @plane/admin` (or relevant filter). Resolve TS errors.
11. **Lint**: `pnpm check:lint`.

## Todo List

- [x] Recon existing patterns (3 files)
- [x] Define types `IWorkSchedule, IHoliday, IDayOverride`
- [x] Create `business-calendar.service.ts` in packages/services
- [x] Export service from packages/services index
- [x] Create `business-calendar.store.ts` MobX store
- [x] Wire store into `root.store.ts`
- [x] Add routes to `routes.ts`
- [x] Create page components (`page.tsx` + `[id]/page.tsx`)
- [x] Create `schedules-list.tsx` + `schedule-card.tsx` + `create-schedule-modal.tsx`
- [x] Create `schedule-detail.tsx` + tabs structure
- [x] Create `workweek-toggle.tsx` with auto-save
- [x] Create `holidays-year-view.tsx` + `holidays-month-grid.tsx`
- [x] Create `day-overrides-table.tsx`
- [x] Create `holiday-form-modal.tsx`, `day-override-form-modal.tsx`
- [x] Create `copy-year-modal.tsx` with warning UI
- [x] Add sidebar nav entry "Business Calendar"
- [x] Tailwind semantic tokens used throughout
- [x] All files ≤150 lines (component) / ≤200 lines (store/service)
- [x] `pnpm build` clean
- [x] `pnpm check:lint` clean

## Outcome (Session 2 — Implementation)

12 React components (all <150 LOC). MobX store + APIService in packages layer. Routes + sidebar nav added. `/calendar` list + `/calendar/:id` detail with 2 tabs (workweek toggles + year calendar grid). Holidays color-coded red, overrides amber. Copy-year modal with lunar holiday warning. Build clean, typecheck 0 errors, lint 113 pre-existing warnings (codebase baseline). Frontend service layer properly modularized. Components follow propel/admin conventions throughout.

## Success Criteria

- Visit `/calendar` as instance admin → see schedules list
- Create new schedule → appears in list
- Visit `/calendar/<id>` → workweek tab + calendar tab functional
- Toggle T7 in workweek → POST to API → state updated → no full reload
- Add holiday on 30/4/2025 → cell turns red in calendar grid
- Add override workday on 26/4/2025 → cell turns amber, table row shows
- Click "Copy from 2025 to 2026" → all entries copied, banner warns about lunar
- Non-admin user sees 403 redirect (existing admin guard)

## Risk Assessment

| Risk                                                                       | Likelihood | Impact | Mitigation                                                                                                             |
| -------------------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| `@plane/propel/calendar` không có sẵn                                      | Medium     | Medium | **Decision Q7**: prefer propel; fallback custom Tailwind grid + `date-fns` (NOT react-day-picker — keep zero new deps) |
| Component bloat >150 lines                                                 | High       | Low    | Split aggressively; review each at completion                                                                          |
| Store state shape không matching component needs                           | Medium     | Medium | Define types FIRST; review store API trước khi build components                                                        |
| MobX missing `observer()` → no re-render                                   | Medium     | High   | Code review checklist; test by mutating state and observing                                                            |
| Sidebar nav location khó tìm                                               | Low        | Low    | Grep "Task Categories" in admin app to locate file                                                                     |
| Routes config v7 syntax wrong                                              | Low        | Medium | Mirror existing route patterns in `routes.ts` exactly                                                                  |
| Service base URL mismatch with API (`/api/instances/` vs `/api/instance/`) | Medium     | High   | Confirm against P1 actual URL prefix; URL conventions in plane = plural `instances`                                    |
| Copy-year UI not handling 401 race                                         | Low        | Low    | Toast on error; refetch after success                                                                                  |

## Security Considerations

- Routes already gated by admin layout (`(all)/(dashboard)/layout.tsx`)
- Store should not log sensitive data; admin endpoints over HTTPS already enforced
- Form inputs sanitized (date validation prevents invalid year-shift)
- No localStorage of schedules (all server-fetched)

## Next Steps

- **Blocks**: nothing (UI is leaf)
- **Depends on**: P1 (API endpoints)
- **Can run parallel with**: P3 (Celery integration) — different file owners
- **Follow-up**: P4 hardening + smoke test
