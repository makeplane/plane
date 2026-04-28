# Phase 5 — Desktop Layout Tuning (21" 16:9 Only, Fixed 4×3 Grid)

## Context Links

- Parent: [plan.md](./plan.md)
- Depends on: [phase-04-stats-panel.md](./phase-04-stats-panel.md) (sequential — same file `holidays-year-view.tsx` for merge safety)
- Reads: `apps/admin/components/calendar/holidays-year-view.tsx`, `apps/admin/components/calendar/holidays-month-grid.tsx`, `apps/admin/components/common/page-wrapper.tsx`
- Rule refs: `.claude/rules/color-tokens.md`

## Overview

- **Priority**: P3 (cosmetic but locks final layout)
- **Status**: ✅ Complete
- **Effort**: 0.5d
- **Description**: User confirmed app shown only on 21" widescreen 16:9 (~1920×1080 or 2560×1440). Drop responsive breakpoint prefixes (`sm:`, `md:`, `lg:`). Year-view 12-month grid: fixed `grid-cols-4` (4×3 layout). Container: `max-w-[1600px] mx-auto` to prevent stretching on ultrawide. Cell `aspect-square` min ~44px. Workweek chip pills full-width.

## Key Insights

- Current `HolidaysYearView` uses `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` — drop responsive variants, use `grid-cols-4` only
- `PageWrapper` has size variants: `md` = `max-w-[1000px] 2xl:max-w-[1200px]` and `lg` = `px-4 lg:px-12` (no max-width). Neither matches 1600px target → switch `page.tsx` from default `md` to a custom override OR pass `size="lg"` and add `max-w-[1600px] mx-auto` wrapper inside content
- Decision: pass `size="lg"` to `PageWrapper` (no max-width restriction) and wrap content children in `max-w-[1600px] mx-auto` div for explicit control. Avoids editing shared `PageWrapper` (used by other admin pages).
- Cell `aspect-square` already in place; need to verify minimum cell width. With container 1600px / 4 cols × 7 day-cols = ~57px per cell → comfortable
- Workweek chip pills already use `flex w-full gap-2` (full-width via `flex-1` on each chip) per Phase 2 — verify no width clamp from parent
- Day overrides table at bottom of year view should also benefit from full-width — no changes needed, table already `w-full`

## Requirements

### Functional

1. Calendar route content centered with `max-w-[1600px] mx-auto`
2. 12-month grid: fixed `grid-cols-4` (no responsive prefixes), gap unchanged (`gap-3`)
3. Cell minimum width comfortable on 1920×1080 (≥40px aspect-square cells)
4. Workweek chip pills span full content width with even distribution
5. No horizontal scroll on 1920×1080
6. On 2560×1440, content does NOT stretch beyond 1600px (centered)
7. Year stats card from Phase 4 also constrained to 1600px container

### Non-functional

- No new files
- Zero behavior change — purely class-name adjustments
- Semantic tokens preserved
- TypeScript: 0 errors

## Architecture

### Layout chain

```
<CalendarPage>                                  ← page.tsx
  <PageWrapper size="lg">                       ← uses px-4 lg:px-12, no max-width
    <div className="max-w-[1600px] mx-auto">    ← NEW explicit max-width
      {schedules.length === 0 ? <EmptyState /> : <ScheduleDetail />}
    </div>
  </PageWrapper>
</CalendarPage>

<ScheduleDetail>
  <header />                                    ← name + Mặc định pill
  <tabs />                                      ← workweek | calendar
  <div>                                         ← tab content
    {tab === workweek ? <WorkweekToggle /> : <HolidaysYearView />}
  </div>
</ScheduleDetail>

<HolidaysYearView>
  <YearStatsCard />                             ← P4 (full-width inside 1600px)
  <YearNavRow />                                ← prev/year/next + legend + copy-year
  <div className="grid grid-cols-4 gap-3">      ← FIXED 4 COLS (was responsive)
    {12 × HolidaysMonthGrid}
  </div>
  <DayOverridesTable />
</HolidaysYearView>
```

### Class change diff

| Component                                      | Before                                                 | After                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `page.tsx` PageWrapper                         | `<PageWrapper header={...}>` (default md=1000px)       | `<PageWrapper header={...} size="lg">` + inner `<div className="max-w-[1600px] mx-auto">` |
| `holidays-year-view.tsx` 12-month grid         | `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3` | `grid grid-cols-4 gap-3`                                                                  |
| `workweek-toggle.tsx` chip container (Phase 2) | `flex w-full gap-2`                                    | `flex w-full gap-2` (unchanged — already full width)                                      |

### Resolution targets

| Resolution | Width | Container max                   | Cells per row                | Cell width |
| ---------- | ----- | ------------------------------- | ---------------------------- | ---------- |
| 1920×1080  | 1920  | 1600 (centered, ~160px gutters) | 7 (per month) × 4 months/row | ~50px      |
| 2560×1440  | 2560  | 1600 (centered, ~480px gutters) | 7 × 4                        | ~50px      |

Both target resolutions yield comfortable cell density without horizontal scroll.

## Related Code Files

### Modify

- `apps/admin/app/(all)/(dashboard)/calendar/page.tsx` — pass `size="lg"` to PageWrapper, wrap children in `max-w-[1600px] mx-auto` div
- `apps/admin/components/calendar/holidays-year-view.tsx` — change month grid to `grid-cols-4` fixed (drop responsive prefixes)

### Create

- (none)

### Delete

- (none)

## Implementation Steps

1. Edit `apps/admin/app/(all)/(dashboard)/calendar/page.tsx`:
   - Change `<PageWrapper header={...}>` → `<PageWrapper header={...} size="lg">`
   - Wrap inner content (empty-state OR ScheduleDetail) in `<div className="max-w-[1600px] mx-auto w-full">`
2. Edit `apps/admin/components/calendar/holidays-year-view.tsx`:
   - Find `<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">` (line ~94 pre-Phase 4)
   - Replace with `<div className="grid grid-cols-4 gap-3">`
3. Verify no other file in `apps/admin/components/calendar/` uses `sm:`/`md:`/`lg:` prefixes (those are responsive only):
   ```bash
   grep -E '(sm|md|lg|xl|2xl):' apps/admin/components/calendar/
   ```

   - Existing matches in `schedules-list.tsx` are acceptable (file unmounted from rendering per Phase 1)
   - Document any other matches and remove if part of rendered tree
4. Run `pnpm typecheck --filter admin` → 0 errors
5. Run `pnpm format`
6. Manual smoke:
   - Open browser at exactly `1920×1080` viewport (devtools custom resize) → verify no horizontal scroll, 4×3 grid renders, content centered
   - Open browser at `2560×1440` → verify content does NOT stretch, stays centered with gutters
   - Resize narrower (e.g., 1280px) — expected: content overflows / horizontal scroll appears (acceptable, NOT a target resolution per user)
   - Verify chip pills span full content width on workweek tab
   - Verify year stats card from Phase 4 stays within 1600px container

## Todo List

- [ ] P5.1 Update `page.tsx` to pass `size="lg"` + add `max-w-[1600px] mx-auto` inner wrapper
- [ ] P5.2 Change 12-month grid to `grid-cols-4` (drop responsive prefixes)
- [ ] P5.3 Audit `apps/admin/components/calendar/` for stray responsive prefixes in rendered files
- [ ] P5.4 `pnpm typecheck --filter admin` → 0 errors
- [ ] P5.5 `pnpm format` (Prettier 120-char clean)
- [ ] P5.6 Manual smoke: 1920×1080 + 2560×1440 + workweek chips full-width

## Success Criteria

- 1920×1080 renders 4×3 month grid, no horizontal scroll, content centered with `max-w-[1600px]`
- 2560×1440 same layout, content does not stretch beyond 1600px
- Workweek chip pills span full content width
- Year stats card centered within 1600px
- No responsive-prefix Tailwind utilities in rendered calendar files (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
- TypeScript: 0 errors
- Backend untouched

## Risk Assessment

| Risk                                                                         | Likelihood | Impact | Mitigation                                                                               |
| ---------------------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------- |
| `PageWrapper` size="lg" lacks max-width but inner `max-w-[1600px]` covers it | Low        | Low    | Verified — `lg` variant uses `px-4 lg:px-12` with no max-w → inner div adds 1600px clamp |
| Other admin pages change appearance after PageWrapper assumption shift       | Low        | High   | NOT changing PageWrapper itself; only passing prop in `page.tsx`. No shared-page impact  |
| `lg:px-12` on `size="lg"` adds horizontal padding visible at 1280px          | Low        | Low    | Acceptable — desktop-only target ≥1920px; `lg:` triggers at ≥1024px                      |
| Mobile/tablet users hit horizontal scroll                                    | Low        | Low    | Out of scope per user confirmation; document in plan as desktop-only                     |
| `grid-cols-4` causes overflow if month card minimum width > container/4      | Low        | Med    | Calculate: 1600px / 4 - gap = ~388px per month card — comfortable for 7 cells            |
| Year stats card gets cropped by inner `max-w-[1600px]`                       | Low        | Low    | Card itself flex layout, no fixed width — adapts                                         |

## Security Considerations

- No security impact — purely visual class changes

## Next Steps

- After P5 merges, full plan complete
- Future enhancements out of scope:
  - Mobile/tablet responsive behavior (drop or treat as breakage)
  - Print-stylesheet for calendar export
  - Density toggle (compact vs. comfortable cell padding)
- Documentation: parent plan journal already covers backend; no docs/ updates needed for UI-only refactor
