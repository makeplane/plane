# Phase 3 — Month Grid Color Fix (FIX MEDIUM-5: Semantic Tokens + Weekend Stripes + Today Ring)

## Context Links

- Parent: [plan.md](./plan.md)
- Depends on: [phase-01-route-simplification.md](./phase-01-route-simplification.md)
- Reads: `apps/admin/components/calendar/holidays-month-grid.tsx` (current raw colors), `apps/admin/components/calendar/holidays-year-view.tsx` (parent, needs `weekPattern` prop chain)
- Rule refs: `.claude/rules/color-tokens.md`, `.claude/rules/frontend-implementation-checklist.md`
- Related: code review finding **MEDIUM-5** from parent plan red-team — current cells use raw Tailwind colors (`bg-red-500/10`, `text-red-700`, `bg-amber-500/10`, `text-amber-700`, `bg-yellow-500/10`, `text-yellow-700`) which violate semantic token rule and break on `light-contrast`/`dark-contrast` themes

## Overview

- **Priority**: P2 (largest phase — biggest visual impact)
- **Status**: ✅ Complete
- **Effort**: 1d
- **Description**: Replace raw Tailwind colors with Plane semantic tokens. Add 5 visible cell states (working / weekend-stripe / holiday / override-workday / override-holiday). Overlay today ring (`ring-2 ring-accent-strong`). Compute weekend from `schedule.week_pattern[weekday]` — requires new `weekPattern: boolean[7]` prop. Verify on all 4 themes.

## Key Insights

- Current `CellState = "holiday" | "override-workday" | "override-holiday" | "default"` — must add `"weekend"` state (5 total visible states)
- Existing `MON_FIRST_OFFSET = [6, 0, 1, 2, 3, 4, 5]` maps JS `getDay()` (Sun=0..Sat=6) → Mon-first index (Mon=0..Sun=6) — reuse for weekend lookup
- Today detection: `dateStr === todayStr` where `todayStr = new Date().toISOString().slice(0, 10)`. Compute once at component-mount level (memoize via `useMemo`)
- Override-workday means "weekend day swapped to working" → border-dashed warning
- Override-holiday means "weekday swapped to off" → border-dashed success
- Stripes pattern: `repeating-linear-gradient(-45deg, transparent 0 4px, var(--color-border-subtle) 4px 5px)` applied via inline style (Tailwind v4 doesn't have arbitrary gradient utility for this)
- `var(--color-border-subtle)` token name verified in Plane theme files; fallback `currentColor` opacity if not defined
- `holidays-month-grid.tsx` currently 99 lines — adding 5 states + stripes + today ring will push past 150; extract `calendar-cell-helper.ts` (pure logic) and keep render-only inside grid
- `useMemo` `today` and `dayHeaders` to avoid per-cell recomputation
- **DECIDED 2026-04-28**: Weekend-empty cell click → open `DayOverrideFormModal` with date pre-filled + `type=WORKDAY` default (làm bù — most common case). NO context menu. Simplifies state machine + reduces cognitive load.

## Requirements

### Functional

1. New `weekPattern: boolean[7]` prop on `HolidaysMonthGrid` (Mon=0..Sun=6)
2. Weekend cells (no holiday/override): striped diagonal pattern via inline `style.backgroundImage`
3. Holiday cell: `bg-danger-subtle` + `text-danger-primary` + bullet dot below day number
4. Override-workday cell: `bg-warning-subtle` + `text-warning-primary` + dashed border
5. Override-holiday cell: `bg-success-subtle` + `text-success-primary` + dashed border
6. Today: overlay `ring-2 ring-accent-strong ring-inset` (combines with state above)
7. Working day: `bg-surface-1 text-primary` + `hover:bg-surface-2`
8. Cell click handler signature unchanged (`(date, state) => void`)
9. `state` enum extended to include `"weekend"` (parent's `handleCellClick` switch updated)
10. `HolidaysYearView` must thread `schedule.week_pattern` to each `HolidaysMonthGrid`

### Non-functional

- `holidays-month-grid.tsx` <150 lines after split (extract helper)
- `calendar-cell-helper.ts` <100 lines, pure functions, no React
- Zero raw Tailwind colors: `grep -E 'bg-(red|amber|yellow|green|blue|gray|orange|pink|purple|indigo|teal|cyan|emerald|lime|rose|sky|stone|slate|zinc|neutral)-' apps/admin/components/calendar/` returns 0 hits
- Verified on all 4 themes: `light`, `dark`, `light-contrast`, `dark-contrast`

## Architecture

### Cell state precedence (highest wins)

```
1. holiday              → bg-danger-subtle text-danger-primary (+ ● dot)
2. override-workday     → bg-warning-subtle text-warning-primary border-dashed
3. override-holiday     → bg-success-subtle text-success-primary border-dashed
4. weekend (no holiday & no override & week_pattern[wd]=false)
                        → bg-surface-2 text-tertiary + diagonal stripes
5. working (week_pattern[wd]=true, no holiday/override)
                        → bg-surface-1 text-primary hover:bg-surface-2

Today overlay: ring-2 ring-accent-strong ring-inset (additive, applied last)
```

### Helper signatures (`calendar-cell-helper.ts`)

```ts
export type CellState = "holiday" | "override-workday" | "override-holiday" | "weekend" | "working";

export function getCellState(
  dateStr: string,
  weekdayMonFirst: number, // 0..6 Mon..Sun
  holidays: IHoliday[],
  overrides: IDayOverride[],
  weekPattern: boolean[] // length 7, Mon=0..Sun=6
): CellState;

export function getCellClasses(
  state: CellState,
  isToday: boolean
): {
  className: string; // Tailwind classes
  style?: React.CSSProperties; // for stripes only (background-image)
};

export function getTodayString(): string; // YYYY-MM-DD in local TZ
```

### Class matrix (final, semantic tokens only)

| State            | Background                                                                                                                          | Text                                | Border                                       | Extra                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------- | ----------------------------- |
| working          | `bg-surface-1 hover:bg-surface-2`                                                                                                   | `text-primary`                      | (none)                                       | —                             |
| weekend          | `bg-surface-2` + inline `backgroundImage: repeating-linear-gradient(-45deg, transparent 0 4px, var(--color-border-subtle) 4px 5px)` | `text-tertiary`                     | (none)                                       | —                             |
| holiday          | `bg-danger-subtle hover:bg-danger-subtle`                                                                                           | `text-danger-primary font-semibold` | (none)                                       | bullet ● dot below day number |
| override-workday | `bg-warning-subtle hover:bg-warning-subtle`                                                                                         | `text-warning-primary`              | `border border-dashed border-warning-strong` | —                             |
| override-holiday | `bg-success-subtle hover:bg-success-subtle`                                                                                         | `text-success-primary`              | `border border-dashed border-success-strong` | —                             |
| Today overlay    | (additive)                                                                                                                          | (additive)                          | `ring-2 ring-accent-strong ring-inset`       | —                             |

### Render layout (per cell)

```tsx
<button
  type="button"
  title={`${dateStr} — ${monthLabel}`}
  aria-label={ariaLabel(state, dateStr)}
  onClick={() => onCellClick(dateStr, state)}
  className={cn(
    "relative aspect-square flex flex-col items-center justify-center rounded text-caption-sm-regular transition-colors cursor-pointer",
    cellClasses.className,
    isToday && "ring-2 ring-accent-strong ring-inset"
  )}
  style={cellClasses.style}
>
  <span>{day}</span>
  {state === "holiday" && <span className="text-[6px] leading-none mt-0.5">●</span>}
</button>
```

### Data flow

```
HolidaysYearView reads useBusinessCalendar()
  → schedule = schedulesMap[scheduleId]
  → maps 12 months → <HolidaysMonthGrid weekPattern={schedule.week_pattern} ... />
HolidaysMonthGrid receives weekPattern
  → for each day cell:
    → weekday = MON_FIRST_OFFSET[new Date(year, month, day).getDay()]
    → state = getCellState(dateStr, weekday, holidays, overrides, weekPattern)
    → isToday = dateStr === todayStr (memoized)
    → render with cellClasses(state, isToday)
```

### Cell click affordance update

Current `HolidaysYearView.handleCellClick` accepts `state: string`. Extend to handle `"weekend"`:

```ts
const handleCellClick = (date: string, state: CellState) => {
  setDefaultDate(date);
  if (state === "holiday") {
    const h = holidays.find((hol) => hol.date === date) ?? null;
    setEditHoliday(h);
    setModalMode("holiday");
  } else if (state === "override-workday" || state === "override-holiday") {
    const o = overrides.find((ov) => ov.date === date) ?? null;
    setEditOverride(o);
    setModalMode("override");
  } else if (state === "weekend") {
    // Defer context-menu to follow-up; for MVP open override modal pre-filled with type=WORKDAY
    setEditOverride(null);
    setModalMode("override");
  } else {
    // working
    setEditHoliday(null);
    setEditOverride(null);
    setModalMode("holiday");
  }
};
```

**Decision**: defer right-click context menu to follow-up (YAGNI). Single-click on weekend opens override modal pre-filled (intent: "add make-up workday"). Single-click on working day opens holiday modal. Re-evaluate after Phase 5 if UX feedback requests context menu.

## Related Code Files

### Modify

- `apps/admin/components/calendar/holidays-month-grid.tsx` — accept `weekPattern` prop, use helper, add stripes + today ring + 5 states
- `apps/admin/components/calendar/holidays-year-view.tsx` — read `schedule = schedulesMap[scheduleId]`, thread `weekPattern={schedule.week_pattern}` to each `HolidaysMonthGrid`; update `handleCellClick` to handle `"weekend"` state

### Create

- `apps/admin/components/calendar/calendar-cell-helper.ts` — pure helpers `getCellState`, `getCellClasses`, `getTodayString`, type `CellState`

### Delete

- (none)

## Implementation Steps

1. Create `apps/admin/components/calendar/calendar-cell-helper.ts`:
   - Export `CellState` type union (5 values)
   - `MON_FIRST_OFFSET` constant moved here (shared with month grid)
   - `getCellState(dateStr, weekdayMonFirst, holidays, overrides, weekPattern)` — implements precedence rules
   - `getCellClasses(state, isToday)` — returns `{ className, style? }`. For `weekend` state, returns `style.backgroundImage = "repeating-linear-gradient(-45deg, transparent 0 4px, var(--color-border-subtle) 4px 5px)"`
   - `getTodayString()` — `new Date().toLocaleDateString("en-CA")` returns `YYYY-MM-DD` in local TZ
2. Refactor `apps/admin/components/calendar/holidays-month-grid.tsx`:
   - Import helpers from `./calendar-cell-helper`
   - Add `weekPattern: boolean[]` prop to `Props` type
   - Memoize `today = useMemo(() => getTodayString(), [])`
   - In cell render loop:
     - Compute `weekdayMonFirst = MON_FIRST_OFFSET[new Date(year, month, day).getDay()]`
     - `state = getCellState(dateStr, weekdayMonFirst, holidays, overrides, weekPattern)`
     - `isToday = dateStr === today`
     - `{ className, style } = getCellClasses(state, isToday)`
     - Render `<button>` with combined classes via `cn()`
     - For holiday state, add bullet dot child
   - Remove old `CELL_STYLES` const
   - Remove old `getCellState` (now in helper)
3. Update `apps/admin/components/calendar/holidays-year-view.tsx`:
   - `const { schedulesMap, ... } = useBusinessCalendar()` — already has `useBusinessCalendar`; add `schedulesMap`
   - `const schedule = schedulesMap[scheduleId]`
   - Defensive: `if (!schedule) return null` (parent route guarantees existence after Phase 1)
   - Add `weekPattern={schedule.week_pattern}` prop to each `HolidaysMonthGrid`
   - Update legend at top: keep colored squares but use semantic tokens (`bg-danger-subtle`, `bg-warning-subtle`, `bg-success-subtle`)
   - Update `handleCellClick` `state` typed as `CellState`, add `"weekend"` branch
4. Verify `weekPattern` shape in `IWorkSchedule` type (`packages/types/src/calendar.ts` or similar) — must be `boolean[]` exactly 7 elements
5. Run `pnpm typecheck --filter admin` — 0 errors
6. Grep verification:
   ```bash
   grep -nE 'bg-(red|amber|yellow|green|blue|gray|orange|pink|purple|indigo|teal|cyan|emerald|lime|rose|sky|stone|slate|zinc|neutral)-' apps/admin/components/calendar/
   ```
   Expected: 0 matches.
7. Run `pnpm format`
8. Manual smoke (per theme, mandatory):
   - Switch to `light` → verify 5 states distinct
   - Switch to `dark` → verify contrast adequate
   - Switch to `light-contrast` → high-contrast variant readable
   - Switch to `dark-contrast` → high-contrast variant readable
   - Find today's date → verify accent ring visible
   - Click weekend cell → override modal opens
   - Click working day → holiday modal opens
   - Click holiday → edit-holiday modal opens with prefilled data
   - Click override → edit-override modal opens with prefilled data

## Todo List

- [ ] P3.1 Create `calendar-cell-helper.ts` with types + 3 pure helpers
- [ ] P3.2 Add `weekPattern` prop to `HolidaysMonthGrid` `Props` type
- [ ] P3.3 Refactor month-grid render to use helper + 5 cell states
- [ ] P3.4 Add today ring overlay (memoized today string)
- [ ] P3.5 Add holiday bullet dot below day number
- [ ] P3.6 Update `HolidaysYearView` to read `schedulesMap[scheduleId]` + thread `weekPattern`
- [ ] P3.7 Update legend in `HolidaysYearView` to use semantic tokens
- [ ] P3.8 Update `handleCellClick` to handle `"weekend"` state
- [ ] P3.9 Verify `IWorkSchedule.week_pattern` shape (`boolean[]` length 7)
- [ ] P3.10 `pnpm typecheck --filter admin` → 0 errors
- [ ] P3.11 Grep raw colors → 0 matches
- [ ] P3.12 Manual smoke 4 themes + today ring + 5 cell states + click affordances

## Success Criteria

- 5 cell states render distinctly: working, weekend (striped), holiday (red-subtle + ●), override-workday (warning-subtle + dashed), override-holiday (success-subtle + dashed)
- Today's cell shows accent ring overlay regardless of underlying state
- All 4 themes verified by manual screenshot/visual inspection
- Zero raw Tailwind colors via grep
- File sizes: `holidays-month-grid.tsx` <150 lines, `calendar-cell-helper.ts` <100 lines
- TypeScript: 0 errors
- Click affordances correct per state
- Backend untouched: `git diff apps/api/` empty
- FIX MEDIUM-5 (raw colors) closed

## Risk Assessment

| Risk                                                                        | Likelihood | Impact | Mitigation                                                                                                       |
| --------------------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `var(--color-border-subtle)` token not defined → stripes invisible          | Medium     | High   | Verify token in `packages/propel/src/styles/`; fallback `currentColor` with `opacity-30`                         |
| `ring-accent-strong` not in design tokens → today ring absent               | Low        | Med    | Verify via grep `packages/propel/src/styles/`; fallback `ring-[var(--color-accent-primary)]`                     |
| `bg-danger-subtle` looks similar to `bg-warning-subtle` on `light-contrast` | Medium     | Med    | Add bullet dot for holiday + dashed border for override → visual differentiation independent of bg               |
| `weekPattern` is undefined when `schedulesMap` not yet hydrated             | Medium     | High   | Defensive `if (!schedule) return null` in parent; helper handles missing weekPattern by treating as all-true     |
| TZ ambiguity in `getTodayString` (UTC vs local)                             | Low        | Med    | Use `toLocaleDateString("en-CA")` (local TZ in YYYY-MM-DD) — admin's browser TZ usually matches Asia/Ho_Chi_Minh |
| Cell aspect-ratio breaks at small widths (<1280px)                          | Low        | Low    | Desktop-only target ≥1920px; `aspect-square` with min ~44px enforced by Phase 5 grid sizing                      |
| Stripes pattern fights with hover bg                                        | Low        | Low    | Weekend has no hover bg change; stripes stay visible                                                             |

## Security Considerations

- No new auth/permission surface — display-only logic
- No new client-side data exposure (already-fetched holidays + overrides + schedule)
- `var(--color-...)` referenced via inline style is XSS-safe (CSS values are not interpolated from user input)

## Next Steps

- Unblocks P4 (stats panel reuses `getCellState` to count cells)
- Unblocks P5 (layout grid touches same file but different lines — sequential merge to avoid conflict)
- Future enhancement: right-click context menu for weekend cells (defer to follow-up if UX feedback requests)
