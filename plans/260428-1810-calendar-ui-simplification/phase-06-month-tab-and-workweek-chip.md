# Phase 6 — Month Tab + Workweek Chip-in-Header (Tab IA Cleanup)

## Context Links

- Parent: [plan.md](./plan.md)
- Depends on: phase-01 (route stable), phase-02 (workweek toggle reusable), phase-03 (month grid helpers), phase-04 (stats helpers)
- Reads: `apps/admin/components/calendar/workweek-toggle.tsx`, `holidays-month-grid.tsx`, `holidays-year-view.tsx`, `calendar-cell-helper.ts`, `calendar-stats-helper.ts`
- Rule refs: `.claude/rules/admin-app-conventions.md` (English-only, Propel Dialog), `.claude/rules/dialogs-modals.md`, `.claude/rules/forms-inputs.md`

## Overview

- **Priority**: P2
- **Status**: ✅ Complete
- **Effort**: 0.5d
- **Description**: Add a single-month "Month" view (large cells, click-to-edit, holiday/override lists). Demote `Workweek` from a tab to a header chip + edit modal — `week_pattern` is set-once metadata, not a daily-use mode. Final tab structure: `Month` (default) | `Year calendar`.

## Key Insights

- Year-view month grids (4×3, ~60×60 cells) are too dense for daily scanning of working days within current month → dedicated single-month view at ~80×80 cells
- `week_pattern` changes near-zero times per schedule lifetime → does NOT deserve equal hierarchy with Month/Year tabs
- Chip-in-header co-locates schedule metadata (`name` · `timezone` · `country_code` · `working days`) — consistent grouping
- Reuse existing `WorkweekToggle` inside Propel Dialog (no duplicate UI logic)
- Cell uniformity preserved via `aspect-square` shell + `truncate` 1-line label inside; native `title` attribute carries full holiday/override name on hover
- Modal needs `EDialogWidth.MD` (448px) — `SM` (384px) too narrow for 7 buttons with `Wed/Thu` labels and `px-3` padding (overflow on Sat/Sun)

## Requirements

### Functional

1. Default tab on `/calendar` = **Month** (was `workweek`)
2. Tab list: `[Month] [Year calendar]` (Workweek tab removed)
3. Header shows working-days chip: `Working: M T W T F S̶ S̶` with `Edit ✎` affordance
4. Chip click → opens `WorkweekEditModal` (Propel Dialog, MD width) wrapping `WorkweekToggle`
5. Modal `Done` button just closes — `WorkweekToggle` already auto-saves at 300ms debounce
6. Month view shows:
   - Stats card (`Working / Holidays / Weekends / Overrides` for the visible month)
   - Month nav (`<` `April 2026` `>` + `Today`)
   - Color legend (Holiday / Make-up workday / Make-up day off)
   - Single-month grid (large `aspect-square` cells with day# + state badge + truncated label + native tooltip)
   - 2-column lists below grid: Holidays in [Month] / Overrides in [Month]
7. Cell click in Month view reuses same edit flow as year view (`HolidayFormModal` / `DayOverrideFormModal` based on cell state)
8. Today cell highlighted with `ring-accent-strong ring-inset`

### Non-functional

- All new files <200 lines, components <150 lines (split into 3 files for month view)
- Admin English-only — zero `useTranslation`, hardcoded English strings (`Working`, `Today`, `Holidays in [Month]`, `Make-up workday`, etc.)
- Propel Dialog (`onOpenChange` signature, `EDialogWidth.MD`, single `<div className="p-6">` content wrapper)
- Semantic tokens only (`bg-surface-1`, `text-primary`, `border-subtle`, `text-tertiary`)
- `observer()` from `mobx-react` on store-reading components

## Architecture

### Header chip (replaces Workweek tab)

```
┌─────────────────────────────────────────────────────────────┐
│ VN Banking  [Default]                                       │
│ Asia/Ho_Chi_Minh · VN · [ Working: M T W T F S̶ S̶  ✎ ]       │
└─────────────────────────────────────────────────────────────┘
   ↑ chip clickable, hover: border-strong + bg-surface-2
```

- Day initials: `M T W T F S S`. Active = `text-primary`, inactive = `text-tertiary line-through`
- Pencil icon (`lucide-react`, `w-3 h-3 text-tertiary`)
- Container: `inline-flex border border-subtle rounded px-2 py-0.5 hover:border-strong hover:bg-surface-2`

### Month view layout (top → bottom)

```
┌─────────────────────────────────────────────────────────────┐
│  [Stats card] Working / Holidays / Weekends / Overrides    │
├─────────────────────────────────────────────────────────────┤
│  [<]  April 2026  [>]  [Today]   ●Holiday ▩MakeUp ▩DayOff  │
├─────────────────────────────────────────────────────────────┤
│  Mon Tue Wed Thu Fri Sat Sun                                │
│  ┌───┬───┬───┬───┬───┬───┬───┐                              │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ ← aspect-square cells       │
│  │   │   │   │   │ ●│   │   │   ~80×80 with day# + badge   │
│  │Lab│   │   │   │Hol│   │   │ + truncated label (text-10) │
│  └───┴───┴───┴───┴───┴───┴───┘                              │
│  (5–6 rows)                                                  │
├─────────────────────────────────────────────────────────────┤
│  Holidays in April          Overrides in April              │
│  • 30/04 Reunification Day  • 27/04 Make-up workday         │
│  • ...                      • 02/05 Make-up day off  [pill] │
└─────────────────────────────────────────────────────────────┘
```

### Cell uniformity strategy

```tsx
<button className="aspect-square flex flex-col p-2 rounded text-left ...">
  <div className="flex justify-between items-start text-body-sm-medium leading-none">
    <span>{day}</span>
    {badge && <span className="text-[8px] mt-0.5">{badge}</span>}
  </div>
  {label && <div className="text-[10px] leading-tight truncate mt-1 w-full">{label}</div>}
</button>
```

- `aspect-square` fixes shell — content variation does NOT distort grid
- `truncate` ensures 1-line cap regardless of holiday name length (`International Workers' Day` → `International...`)
- `title` attribute on `<button>` provides full name on hover (no custom tooltip dependency)

### Modular file split (month view)

Single file would exceed 200 LoC after Prettier wrapping → split by concern:

| File                      | LoC | Concern                                                                                   |
| ------------------------- | --- | ----------------------------------------------------------------------------------------- |
| `month-overview.tsx`      | 166 | Composition, state (current month, modal mode), data fetch, cell-click router, modals     |
| `month-grid.tsx`          | 98  | Pure render: day headers + 7×N grid of cells (cellLabel + onCellClick passed from parent) |
| `month-summary-lists.tsx` | 91  | Stats card + 2 list panels (holidays + overrides for visible month)                       |

### Modal wrap

```tsx
// workweek-edit-modal.tsx (~34 lines)
<Dialog open={open} onOpenChange={(o) => !o && onClose()} modal>
  <Dialog.Panel width={EDialogWidth.MD}>
    <div className="p-6">
      <Dialog.Title>Working week</Dialog.Title>
      <div className="mt-4">
        <WorkweekToggle schedule={schedule} />
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="primary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  </Dialog.Panel>
</Dialog>
```

- `MD` (448px) chosen over `SM` (384px) — `SM` causes Sat/Sun chip overflow
- `WorkweekToggle` reused as-is (no prop changes); auto-save behavior preserved
- `Done` is a soft-close — changes already persisted via debounce inside toggle

### Data flow (month view)

```
mount / scheduleId or year change
  → fetchHolidays(scheduleId, year)
  → fetchOverrides(scheduleId, year)
  → store hydrates getHolidaysForYear / getOverridesForYear
  → useMemo: monthStats / monthHolidays / monthOverrides
  → grid renders, cell click → modal (with date pre-fill + edit context)
```

## Related Code Files

### Create

- `apps/admin/components/calendar/month-overview.tsx` (166 LoC)
- `apps/admin/components/calendar/month-grid.tsx` (98 LoC)
- `apps/admin/components/calendar/month-summary-lists.tsx` (91 LoC)
- `apps/admin/components/calendar/workweek-edit-modal.tsx` (34 LoC)

### Modify

- `apps/admin/components/calendar/schedule-detail.tsx` — drop `workweek` tab; default tab → `month`; add `WorkweekChip` (inline component, ~25 LoC) + modal trigger; remove `WorkweekToggle` import
- `apps/admin/components/calendar/calendar-stats-helper.ts` — add `getMonthOverrides(year, month, overrides)` helper (mirror of `getMonthHolidays`)
- `apps/admin/components/calendar/index.ts` — export new modules

### Delete

- (none — `workweek-toggle.tsx` retained, reused inside modal)

## Implementation Steps

1. Add `getMonthOverrides` to `calendar-stats-helper.ts`
2. Create `month-grid.tsx`: pure grid renderer; reuses `MON_FIRST_OFFSET`, `getCellState`, `getCellClasses`, `formatDate`, `getDaysInMonth`, `getFirstDayOfWeek`, `getTodayString`
3. Create `month-summary-lists.tsx`: `MonthSummaryCard` (4-stat grid) + `MonthLists` (2 panels via internal `Panel` helper)
4. Create `month-overview.tsx`: composes the above + state + modals; reuses `HolidayFormModal` and `DayOverrideFormModal`
5. Create `workweek-edit-modal.tsx`: Propel Dialog `MD` wrapping `WorkweekToggle`
6. Edit `schedule-detail.tsx`: drop `workweek` tab from `TAB_ITEMS`, change default `useState<Tab>("month")`, add `<WorkweekChip>` to header meta row, add `<WorkweekEditModal>` mount
7. Update `index.ts` exports
8. Run `tsc --noEmit` (admin) — 0 errors
9. Run `eslint` on changed files — 0 errors
10. Run `prettier --check` then `--write` if needed
11. Manual smoke (admin dev server):
    - `/calendar` default → Month view loads first
    - Month nav prev/next/today works
    - Cell click → correct modal (holiday vs override based on state)
    - Workweek chip click → modal opens, MD width fits 7 buttons (no Sat/Sun overflow)
    - Toggle in modal → state persists after closing modal + page refresh
    - Year tab still works (no regression)

## Todo List

- [x] P6.1 Add `getMonthOverrides` helper
- [x] P6.2 Create `month-grid.tsx`
- [x] P6.3 Create `month-summary-lists.tsx`
- [x] P6.4 Create `month-overview.tsx`
- [x] P6.5 Create `workweek-edit-modal.tsx`
- [x] P6.6 Drop Workweek tab + add chip in `schedule-detail.tsx`
- [x] P6.7 Update `index.ts` exports
- [x] P6.8 Bump modal width SM → MD (Sat/Sun overflow fix)
- [x] P6.9 `tsc --noEmit` (admin) clean
- [x] P6.10 `eslint` + `prettier --check` clean

## Success Criteria

- `/calendar` opens Month view by default
- Tab nav contains exactly 2 items: `Month`, `Year calendar`
- Workweek chip visible in header, click opens modal, modal fits 7 buttons without horizontal overflow
- Month view: stats card, nav (`<` `[label]` `>` `[Today]`), legend, grid, 2 lists below — all render
- Month grid cells: uniform `aspect-square`, day# + badge top row, truncated label below, today cell ringed
- Cell click on Month view reuses Year-view modal flow (`HolidayFormModal` / `DayOverrideFormModal`) with `defaultDate` pre-fill
- All new files <200 LoC; `month-overview.tsx` (166), `month-grid.tsx` (98), `month-summary-lists.tsx` (91), `workweek-edit-modal.tsx` (34)
- TypeScript: 0 errors
- ESLint: 0 errors
- Prettier: clean
- Admin English-only respected — no Vietnamese strings introduced, no `useTranslation` import
- Backend untouched (`git diff apps/api/` empty)

## Risk Assessment

| Risk                                               | Likelihood | Impact | Mitigation                                                                                                          |
| -------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Long holiday names break uniformity                | Low        | Low    | `truncate` + `aspect-square` shell — already verified visually                                                      |
| Modal SM width clips Sat/Sun chips                 | Realized   | Med    | Bumped to `EDialogWidth.MD` after user-reported overflow                                                            |
| User confused chip is clickable                    | Med        | Low    | Pencil icon + hover state (`hover:border-strong hover:bg-surface-2`) signals affordance                             |
| Discoverability loss for `week_pattern` (no tab)   | Low        | Low    | Chip always visible in header — same total clicks (1 tab→1 chip click→1 modal)                                      |
| Missing `WorkweekToggle` heading text inside modal | Low        | Low    | `Dialog.Title` ("Working week") + existing toggle help text inside provide adequate context                         |
| `Done` button implies save needed (it doesn't)     | Low        | Low    | Auto-save tooltip in `WorkweekToggle` already says "Changes auto-save after 300ms" — close button is just dismissal |

## Security Considerations

- No new auth surface — `updateSchedule` mutation path unchanged (`InstanceAdminPermission`)
- No new endpoints, no new client-side privilege checks
- Modal does not bypass any existing validation (`week_pattern` length=7 enforced server-side)

## Next Steps

- Watch for user feedback on chip discoverability (consider tooltip "Click to edit working week" if confusion arises)
- Future: collapse Year view's bottom overrides table into the `MonthLists` pattern (DRY) — defer to separate phase
- Future: add keyboard shortcut `T` to jump to today in Month view (nice-to-have)
