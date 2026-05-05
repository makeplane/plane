# Phase 4 — Stats Panel (Year Totals + Per-Month Breakdown + Inline Holiday List)

## Context Links

- Parent: [plan.md](./plan.md)
- Depends on: [phase-03-month-grid-color-fix.md](./phase-03-month-grid-color-fix.md) (reuses `getCellState` from `calendar-cell-helper.ts`)
- Reads: `apps/admin/components/calendar/holidays-year-view.tsx`, `apps/admin/components/calendar/holidays-month-grid.tsx`
- Rule refs: `.claude/rules/color-tokens.md`, `.claude/rules/component-libraries.md`

## Overview

- **Priority**: P3
- **Status**: ✅ Complete
- **Effort**: 0.5d
- **Description**: Add year-level summary card at top of `HolidaysYearView`. Add per-month header line + inline holiday list footer to each `HolidaysMonthGrid`. All client-side aggregation from already-fetched data — zero new API calls. Pure helper extracted for testability.

## Key Insights

- Aggregation primitives needed per year:
  - `total_days` = days in year (365 or 366)
  - `holidays_count` = `holidays.length` for year
  - `weekends_count` = days where `week_pattern[weekday] === false` AND not a holiday/override
  - `working_days` = `total_days - holidays_count - weekends_count + override_workday_count - override_holiday_count` (overrides flip)
  - `override_delta` = `override_workday_count - override_holiday_count` (signed; UI shows `+N` / `-N` / `±0`)
- Per-month aggregation = same primitives bounded to month
- Sum of per-month primitives MUST equal year primitives (sanity invariant — write Vitest test if test infra available, else manual smoke)
- Holiday name display uses `IHoliday.name_vi` (or fallback `name`) — verify field name on type
- Date formatting: `1/1`, `28/1` (D/M, no leading zeros) for inline list
- Stats card uses semantic tokens — no raw colors. Layout: top-of-page horizontal card with 4-5 stat columns
- Per-month header line uses `text-caption-sm-medium` text-secondary; per-month footer holiday list uses `text-caption-sm-regular` text-tertiary, max-h with scroll if >5 holidays in month

## Requirements

### Functional

1. Top of `HolidaysYearView` (above year-nav row): summary card showing
   - "📊 Tổng kết năm {year}: {N} làm việc · {N} lễ · {N} cuối tuần · {±N} override"
   - All numbers aggregated client-side
2. Each `HolidaysMonthGrid` receives optional `monthStats` prop: `{ working: N, holidays: N, weekends: N }` rendered as compact header line below existing `Tháng X / YYYY` title bar
3. Each `HolidaysMonthGrid` receives optional `monthHolidays: IHoliday[]` and renders below the day grid as bullet list:
   - `• 1/1 Tết Dương lịch`
   - `• 28/1 Tết Âm — 30 tháng Chạp`
   - (sorted by date asc)
4. If month has zero holidays → no footer block (skip rendering)
5. Stats computation isolated in `calendar-stats-helper.ts` (pure, testable, no React)

### Non-functional

- Stats helper: `<150 lines`, pure functions, exhaustive on edge cases (leap year, year boundaries)
- `month-card-stats.tsx` sub-component if month-card growth pushes `holidays-month-grid.tsx` past 150 lines
- Aggregation runs once per year change (memoize via `useMemo` keyed on `[year, holidays, overrides, weekPattern]`)
- Zero new API calls — uses already-fetched store data
- Semantic tokens only

## Architecture

### Helper signatures (`calendar-stats-helper.ts`)

```ts
export type YearStats = {
  totalDays: number;
  workingDays: number;
  holidayCount: number;
  weekendCount: number;
  overrideDelta: number; // signed: +N or -N
  overrideWorkdayCount: number;
  overrideHolidayCount: number;
};

export type MonthStats = {
  workingDays: number;
  holidayCount: number;
  weekendCount: number;
};

export function computeYearStats(
  year: number,
  holidays: IHoliday[],
  overrides: IDayOverride[],
  weekPattern: boolean[]
): YearStats;

export function computeMonthStats(
  year: number,
  month: number, // 0-indexed
  holidays: IHoliday[],
  overrides: IDayOverride[],
  weekPattern: boolean[]
): MonthStats;

export function getMonthHolidays(year: number, month: number, holidays: IHoliday[]): IHoliday[]; // sorted by date asc
```

### Aggregation algorithm (per year)

```ts
function computeYearStats(year, holidays, overrides, weekPattern): YearStats {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = isLeap ? 366 : 365;
  const holidaySet = new Set(holidays.map((h) => h.date));
  const overrideMap = new Map(overrides.map((o) => [o.date, o.type]));

  let working = 0,
    weekend = 0,
    holidayCount = 0,
    overWorkday = 0,
    overHoliday = 0;

  for (let m = 0; m < 12; m++) {
    const days = getDaysInMonth(year, m);
    for (let d = 1; d <= days; d++) {
      const dateStr = formatDate(year, m, d);
      const wd = MON_FIRST_OFFSET[new Date(year, m, d).getDay()];
      const ov = overrideMap.get(dateStr);

      // Resolution precedence: holiday > override > week_pattern
      // BUT override can flip weekday→holiday or weekend→workday
      if (holidaySet.has(dateStr)) {
        holidayCount++;
        continue;
      }
      if (ov === "WORKDAY") {
        working++;
        overWorkday++;
        continue;
      }
      if (ov === "HOLIDAY") {
        weekend++;
        overHoliday++;
        continue;
      }
      // No override, no holiday
      if (weekPattern[wd]) working++;
      else weekend++;
    }
  }

  return {
    totalDays,
    workingDays: working,
    holidayCount,
    weekendCount: weekend,
    overrideDelta: overWorkday - overHoliday,
    overrideWorkdayCount: overWorkday,
    overrideHolidayCount: overHoliday,
  };
}
```

**Invariant**: `workingDays + weekendCount + holidayCount === totalDays`

### Year stats card layout

```
┌──────────────────────────────────────────────────────────────────┐
│ 📊 Tổng kết năm 2026                                              │
│                                                                   │
│   250          11           104          ±0                       │
│   Làm việc     Lễ           Cuối tuần    Override                 │
└──────────────────────────────────────────────────────────────────┘
```

Classes: `bg-surface-1 border border-subtle rounded-lg p-4 mb-4`. Stat columns: `flex items-baseline gap-1` with big number `text-h4-semibold text-primary` + label `text-caption-sm-regular text-secondary ml-2`.

### Month card extended layout

```
┌─────────────────────────┐
│ Tháng 1 / 2026          │  ← existing title bar
│ 22 LV · 3 lễ · 6 nghỉ   │  ← NEW header stats line (text-caption-sm-medium text-secondary)
├─────────────────────────┤
│  T2 T3 T4 T5 T6 T7 CN   │  ← existing day headers
│  [grid of 7×N cells]    │  ← existing day grid
├─────────────────────────┤
│ • 1/1 Tết Dương lịch    │  ← NEW footer (only if monthHolidays.length > 0)
│ • 28/1 Tết Âm — ...     │
└─────────────────────────┘
```

### Data flow

```
HolidaysYearView mounts (year=2026)
  → useMemo:
    yearStats = computeYearStats(year, holidays, overrides, weekPattern)
  → render YearStatsCard with yearStats
  → render 12 × HolidaysMonthGrid:
    → for each m: computeMonthStats(year, m, ...) → pass as monthStats prop
    → for each m: getMonthHolidays(year, m, holidays) → pass as monthHolidays prop
HolidaysMonthGrid receives monthStats + monthHolidays
  → render header stats line (above day grid)
  → render existing day grid
  → render footer holiday list (if monthHolidays.length > 0)
```

## Related Code Files

### Modify

- `apps/admin/components/calendar/holidays-year-view.tsx` — add YearStatsCard at top, compute year stats memo, pass `monthStats` + `monthHolidays` to each month grid
- `apps/admin/components/calendar/holidays-month-grid.tsx` — accept optional `monthStats` + `monthHolidays` props, render header line + footer list

### Create

- `apps/admin/components/calendar/calendar-stats-helper.ts` — pure aggregation helpers
- **Conditional**: `apps/admin/components/calendar/month-card-stats.tsx` (sub-component for header+footer) — only if `holidays-month-grid.tsx` exceeds 150 lines after Phase 3+4 changes

### Delete

- (none)

## Implementation Steps

1. Create `apps/admin/components/calendar/calendar-stats-helper.ts`:
   - Import `MON_FIRST_OFFSET` from `./calendar-cell-helper`
   - Implement `computeYearStats`, `computeMonthStats`, `getMonthHolidays`
   - Helper `getDaysInMonth(year, month)` (private, not re-export — duplicated from month-grid is fine OR move both into shared helper)
   - Decision: move `getDaysInMonth` and `formatDate` into `calendar-cell-helper.ts` → import from one source (DRY)
2. Refactor `apps/admin/components/calendar/holidays-month-grid.tsx`:
   - Add optional `monthStats?: MonthStats` and `monthHolidays?: IHoliday[]` props
   - Render header stats line right after `Tháng X / YYYY` title:
     ```tsx
     {
       monthStats && (
         <div className="bg-surface-2 px-3 pb-2 text-caption-sm-medium text-secondary text-center border-b border-subtle">
           {monthStats.workingDays} LV · {monthStats.holidayCount} lễ · {monthStats.weekendCount} nghỉ
         </div>
       );
     }
     ```
   - Render footer holiday list after day grid:
     ```tsx
     {
       monthHolidays && monthHolidays.length > 0 && (
         <ul className="px-3 py-2 space-y-1 text-caption-sm-regular text-tertiary border-t border-subtle">
           {monthHolidays.map((h) => (
             <li key={h.id}>• {formatHolidayLine(h)}</li>
           ))}
         </ul>
       );
     }
     ```
     where `formatHolidayLine(h)` returns `"D/M HolidayName"` or `"D/M Name — note"` if `h.note` exists
   - Verify line count; if >150 → extract `month-card-stats.tsx` containing the header + footer JSX
3. Refactor `apps/admin/components/calendar/holidays-year-view.tsx`:
   - Import `computeYearStats`, `computeMonthStats`, `getMonthHolidays`
   - Add `useMemo` for `yearStats` keyed `[year, holidays, overrides, schedule.week_pattern]`
   - Insert `<YearStatsCard stats={yearStats} year={year} />` above existing year-nav row (or inline)
   - Inline `YearStatsCard` is fine (small JSX, ~15 lines) — avoid extracting unless needed
   - In month-grid loop, compute per-month stats:
     ```tsx
     {
       Array.from({ length: 12 }).map((_, m) => {
         const monthStats = computeMonthStats(year, m, holidays, overrides, schedule.week_pattern);
         const monthHolidays = getMonthHolidays(year, m, holidays);
         return (
           <HolidaysMonthGrid
             key={m}
             year={year}
             month={m}
             holidays={holidays}
             overrides={overrides}
             weekPattern={schedule.week_pattern}
             monthStats={monthStats}
             monthHolidays={monthHolidays}
             onCellClick={handleCellClick}
           />
         );
       });
     }
     ```
   - Wrap in `useMemo` if perf shows lag (12 × computeMonthStats per year change is cheap; skip premature optimization)
4. Verify `IHoliday` type has `name_vi` (or `name`) and optional `note` fields — adjust `formatHolidayLine` accordingly
5. Run `pnpm typecheck --filter admin` → 0 errors
6. Run `pnpm format`
7. Manual smoke:
   - Year nav 2026 → verify summary card shows 4 stats with correct math
   - Sum of 12 monthStats.workingDays === yearStats.workingDays (sanity)
   - January 2026 → 3 holidays footer list visible (Tết DL + ?)
   - Empty month (e.g., March if no MOLISA) → no footer block rendered
   - Override-heavy year → `overrideDelta` shows `+2` or `-1` correctly
   - Leap year (2024) → totalDays === 366

## Todo List

- [ ] P4.1 Move `getDaysInMonth` + `formatDate` into `calendar-cell-helper.ts` (DRY)
- [ ] P4.2 Create `calendar-stats-helper.ts` with `computeYearStats`, `computeMonthStats`, `getMonthHolidays`
- [ ] P4.3 Add optional `monthStats` + `monthHolidays` props to `HolidaysMonthGrid`
- [ ] P4.4 Render header stats line + footer holiday list in month grid
- [ ] P4.5 Compute `yearStats` via `useMemo` in `HolidaysYearView`
- [ ] P4.6 Render `YearStatsCard` (inline) at top of year view
- [ ] P4.7 Pass per-month stats + holidays to each `HolidaysMonthGrid`
- [ ] P4.8 Verify `holidays-month-grid.tsx` <150 lines (extract `month-card-stats.tsx` if needed)
- [ ] P4.9 `pnpm typecheck --filter admin` → 0 errors
- [ ] P4.10 Manual smoke: invariants + holiday list + leap year + override delta

## Success Criteria

- Year stats card visible at top of year view, 4 stats correct
- Per-month stats line visible in each month card
- Per-month holiday list visible (only if month has holidays)
- Mathematical invariant holds: `Σ monthStats.workingDays === yearStats.workingDays` (and weekends, holidays)
- Mathematical invariant holds: `workingDays + weekendCount + holidayCount === totalDays`
- Leap year (2024) → totalDays === 366
- Zero new API calls (verify Network tab — only existing `/holidays`/`/overrides` calls)
- File sizes within limits
- TypeScript: 0 errors
- Backend untouched

## Risk Assessment

| Risk                                                                             | Likelihood | Impact | Mitigation                                                                                                                                |
| -------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Override resolution wrong (counts override-workday as both working AND override) | Medium     | Med    | Algorithm uses early `continue` after each branch; unit test invariant                                                                    |
| `IHoliday.name_vi` field name mismatch with type                                 | Low        | Low    | Verify `packages/types/src/calendar.ts` before write; fallback `h.name`                                                                   |
| Holiday list overflow on month with 5+ holidays                                  | Low        | Low    | Add `max-h-32 overflow-y-auto` to footer ul                                                                                               |
| `useMemo` dep array mistake → stale stats                                        | Medium     | Med    | Include `[year, holidays.length, overrides.length, schedule.week_pattern]` as deps; test by mutating override and verifying stats refresh |
| Performance: 12 × computeMonthStats per render                                   | Low        | Low    | Each call is O(31) iterations; total ~365 ops per render — negligible                                                                     |
| TZ offset miscount on Dec 31 / Jan 1 cross-year                                  | Low        | Med    | Use `new Date(year, m, d)` (local TZ); never UTC ISO; `formatDate(year, m, d) = ${year}-${m+1pad}-${dpad}` deterministic                  |
| Date sort wrong if backend returns ISO with timezone                             | Low        | Low    | Sort by `date` string alphabetically (works for `YYYY-MM-DD` format)                                                                      |

## Security Considerations

- Display-only — no auth/permission surface change
- No new client-side data exposure
- Holiday name comes from already-fetched data (no XSS risk; React escapes by default)

## Next Steps

- After P4 merges, P5 can adjust outer grid layout (sequential to avoid `holidays-year-view.tsx` merge conflict)
- Future enhancement: clickable stats (e.g., click "11 lễ" filters to holiday-only month view) — out of scope
