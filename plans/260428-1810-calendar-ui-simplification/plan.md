---
title: "Calendar UI Simplification (Frontend-Only Refactor)"
description: "Hide schedules-list, chip-pill workweek, semantic month grid + weekend stripes + today ring, year/month stats panel, fixed 4×3 desktop layout."
status: completed
priority: P2
effort: 3d
branch: duonglx/chore/gitignore-claude-state
tags: [admin, calendar, ui, refactor, semantic-tokens, vn-localization]
created: 2026-04-28
---

# Calendar UI Simplification

## Goal

Frontend-only refactor of `/calendar` admin route: hide list-of-schedules UI (single-default flow), replace vertical workweek toggle with horizontal chip pills, fix month-grid raw-color tokens (FIX MEDIUM-5) + add weekend stripes + today ring, add year/month stats panel, lock layout to desktop 21" 16:9 (4×3 fixed).

**Backend untouched** — zero migrations, zero API changes. All data already fetched in parent plan.

## Phases

| ID  | File                                                                                 | Priority | Effort | Status      |
| --- | ------------------------------------------------------------------------------------ | -------- | ------ | ----------- |
| P1  | [phase-01-route-simplification.md](./phase-01-route-simplification.md)               | P1       | 0.5d   | ✅ Complete |
| P2  | [phase-02-workweek-chip-pills.md](./phase-02-workweek-chip-pills.md)                 | P2       | 0.5d   | ✅ Complete |
| P3  | [phase-03-month-grid-color-fix.md](./phase-03-month-grid-color-fix.md)               | P2       | 1d     | ✅ Complete |
| P4  | [phase-04-stats-panel.md](./phase-04-stats-panel.md)                                 | P3       | 0.5d   | ✅ Complete |
| P5  | [phase-05-desktop-layout-tuning.md](./phase-05-desktop-layout-tuning.md)             | P3       | 0.5d   | ✅ Complete |
| P6  | [phase-06-month-tab-and-workweek-chip.md](./phase-06-month-tab-and-workweek-chip.md) | P2       | 0.5d   | ✅ Complete |

**Total**: ~3.5 ngày sequential. Parallel possible: P2 ↔ P4 ↔ P5 sau khi P1 + P3 done (different file owners). P6 sequential (depends on P1–P4 stable).

## Dependencies

- P1 → P2 (P2 chỉnh `workweek-toggle.tsx` rendered từ `schedule-detail.tsx` trong P1)
- P1 → P3 (P3 cần `weekPattern` prop chained from `ScheduleDetail` schedule)
- P3 → P4 (P4 reuse cell-state classifier from P3 helper)
- P3 → P5 (P5 chỉnh container of `HolidaysYearView` already touched in P3)
- P5 độc lập với P2/P4 nếu file ownership respected
- P1–P4 → P6 (P6 reuses cell-helper, stats-helper, modals; demotes workweek tab introduced in P1; chip reuses `WorkweekToggle` from P2)

## File Ownership Map (no overlap)

| Phase | Owns (write)                                                                                                                                                           | Reads only                                                                                                |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| P1    | `app/(all)/(dashboard)/calendar/page.tsx`, `schedule-detail.tsx`, `index.ts`, delete `app/(all)/(dashboard)/calendar/detail/page.tsx`                                  | `business-calendar.store.ts`, `schedules-list.tsx` (untouched on disk)                                    |
| P2    | `workweek-toggle.tsx`, optional new `weekday-chip.tsx`                                                                                                                 | `schedule-detail.tsx`                                                                                     |
| P3    | `holidays-month-grid.tsx`, optional new `calendar-cell-helper.ts`                                                                                                      | `holidays-year-view.tsx` (read prop signature only)                                                       |
| P4    | `holidays-year-view.tsx`, new `calendar-stats-helper.ts`, new `month-card-stats.tsx`                                                                                   | `holidays-month-grid.tsx`                                                                                 |
| P5    | `holidays-year-view.tsx` (layout grid only)                                                                                                                            | `page.tsx`                                                                                                |
| P6    | new `month-overview.tsx`, `month-grid.tsx`, `month-summary-lists.tsx`, `workweek-edit-modal.tsx`; modify `schedule-detail.tsx`, `calendar-stats-helper.ts`, `index.ts` | `workweek-toggle.tsx`, `holiday-form-modal.tsx`, `day-override-form-modal.tsx`, `calendar-cell-helper.ts` |

**Conflict point**: P3 + P4 + P5 all touch `holidays-year-view.tsx`. Resolution: P3 only changes prop chain (adds `weekPattern` pass-through), P4 adds top-of-file stats panel + month sub-component slot, P5 only changes outer grid container classes. Run sequentially P3 → P4 → P5 to avoid merge. P6 does NOT touch `holidays-year-view.tsx` — only `schedule-detail.tsx` (tab list + chip).

## Reference Documents

- Parent plan: [/plans/260428-1427-vietnam-working-day-holiday-management/plan.md](../260428-1427-vietnam-working-day-holiday-management/plan.md) (5 phases all complete, commit `abb188d80b`)
- Parent journal: [/docs/journals/260428-1705-vietnam-working-day-holiday-management.md](../../docs/journals/260428-1705-vietnam-working-day-holiday-management.md)
- Frontend rules: `.claude/rules/color-tokens.md`, `.claude/rules/component-libraries.md`, `.claude/rules/dialogs-modals.md`, `.claude/rules/frontend-implementation-checklist.md`
- Admin app: `apps/admin/AGENTS.md`

## Critical Constraints (NON-NEGOTIABLE)

- **Backend untouched** — zero `apps/api/` changes, zero migrations, zero API contract change
- **Semantic tokens only** — ZERO raw Tailwind colors (`bg-red-500`, `text-amber-700`, `bg-yellow-*`, `bg-blue-*`, etc.). Use Plane semantic tokens auto-adapting across `light`, `dark`, `light-contrast`, `dark-contrast`
- **`@plane/propel/*` subpath imports** — Button, Toast, Dialog, Switch, Input, ContextMenu
- **`observer()` from `mobx-react`** on every component reading `useBusinessCalendar()`
- **Files <200 lines, components <150 lines** — split helpers/sub-components if needed
- **No i18n** — admin app does NOT use `useTranslation`. Vietnamese strings hardcoded as in existing code
- **Desktop-only target** — drop responsive breakpoint prefixes (`sm:`, `md:`, `lg:`); fixed `grid-cols-4` for year view
- **Files NOT deleted** — `schedules-list.tsx`, `schedule-card.tsx`, `create-schedule-modal.tsx` stay on disk (unmount + drop exports), workspace-scoped reuse later

## Success Criteria (overall)

- `/calendar` renders default schedule directly; if no default → init CTA works (one-click bootstrap)
- Workweek = 7 horizontal chip pills, click toggles backend (300ms debounced), semantic tokens
- Month grid: 5 visible states (working / weekend-stripe / holiday / override-workday / override-holiday) + today ring overlay, all 4 themes verified
- Year stats accurate: `working_days + holidays + weekends ± overrides = total_days_in_year`; per-month sums = year total
- Layout fixed grid-cols-4 (4×3) on 1920×1080 and 2560×1440, no horizontal scroll, container `max-w-[1600px] mx-auto`
- `grep -E 'bg-(red|amber|yellow|green|blue|gray)-' apps/admin/components/calendar/` returns zero matches
- TypeScript `pnpm typecheck --filter admin` clean, build `pnpm build --filter admin` clean

## Out of Scope (defer)

- Workspace-scoped schedules (parent plan deferred to post-MVP)
- `worklog_daily_reminder` decorator (parent plan open follow-up)
- New holiday seeding for years > 2026
- i18n translation keys
- Mobile/tablet responsive behavior

## Validation Log

- 2026-04-28 — All 5 phases implemented as bundled refactor (sequential file-ownership). `pnpm --filter admin check:types` clean, `pnpm --filter admin check:lint` 0 errors, `pnpm check:format` clean. Backend untouched (`git diff --stat HEAD -- apps/api/` empty). Code review by code-reviewer subagent: 1 critical (CSS var name `--color-border-subtle` → `--border-color-subtle`) fixed; 6 non-blocking concerns noted. New files: `calendar-cell-helper.ts` (77L), `calendar-stats-helper.ts` (113L), `year-stats-card.tsx` (35L). Pre-existing fix: dropped invalid `id` prop on Switch in `create-schedule-modal.tsx` (unmounted but tsc still scans). Color cleanup: `day-overrides-table.tsx` raw amber/yellow → semantic warning/success tokens. Route deletion: `apps/admin/app/(all)/(dashboard)/calendar/detail/` + `routes.ts` entry removed.
- 2026-04-28 — **English-only correction**: User flagged that `apps/admin/AGENTS.md` mandates English-only (no i18n). Original feature shipped in `abb188d80b` had VN strings; my refactor matched that pattern. Converted ALL calendar strings to English across 13 files: page, schedule-detail, workweek-toggle, holidays-month-grid, holidays-year-view, year-stats-card, holiday-form-modal, day-override-form-modal, day-overrides-table, copy-year-modal, schedule-card, schedules-list, create-schedule-modal. Weekday labels Mon..Sun (was T2..CN). Month labels via `toLocaleDateString("en-US", { month: "long", year: "numeric" })`. Saved feedback memory `feedback_admin-app-english-only.md` to prevent recurrence.
- 2026-04-28 — **Phase 6 (Month tab + Workweek chip)**: Added Month view between Workweek and Year tabs per user request, then user requested Workweek tab removal. Designer recommendation accepted: demote `week_pattern` to header chip with edit modal — frequency-of-use justifies metadata-style placement, not a primary tab. Implemented 4 new files (`month-overview.tsx` 166L, `month-grid.tsx` 98L, `month-summary-lists.tsx` 91L, `workweek-edit-modal.tsx` 34L) + minor edits to `schedule-detail.tsx`, `calendar-stats-helper.ts` (added `getMonthOverrides`), `index.ts`. Final tabs: `Month` (default) | `Year calendar`. Cell uniformity preserved via `aspect-square` + `truncate` + native `title` tooltip. Modal width fix: bumped `EDialogWidth.SM` → `MD` (448px) after user reported Sat/Sun chip overflow. `tsc --noEmit` clean, `eslint` clean, `prettier` clean. Admin English-only respected, no `useTranslation`, semantic tokens only. Backend untouched.

## Resolved Decisions (user-confirmed 2026-04-28)

1. **Delete-schedule UX** — REMOVE entirely. Phase 1 deletes "Xoá" button + `handleDelete` flow from `schedule-detail.tsx`. Re-init via empty-state CTA if needed.
2. **Empty-state init CTA defaults** — `name="VN Banking"`, `timezone="Asia/Ho_Chi_Minh"`, `country_code="VN"`, `week_pattern=[true, true, true, true, true, false, false]` (T2-T6 active, T7+CN off), `is_default=true`.
3. **Today ring token** — `ring-accent-strong` CONFIRMED EXISTS (`packages/propel/src/input/input.tsx:focus:ring-accent-strong`, `packages/propel/src/toolbar/toolbar.tsx:focus:ring-accent-strong/20`). Use directly, no fallback needed.
4. **Stats leap-year handling** — JS native `new Date(year, month + 1, 0).getDate()` handles 2024-02 → 29 correctly. Existing `getDaysInMonth` in `holidays-month-grid.tsx` is reused. No special test required beyond stats helper unit test.
5. **Weekend-empty cell click** — single-click → opens `DayOverrideFormModal` with date pre-filled, type defaulting to `WORKDAY` (làm bù — most common case). NO context-menu. Removes `[Thêm lễ]/[Thêm làm bù]` branching from Phase 3 spec.
6. **Phase 6 — Default tab + Workweek placement** (user-confirmed): Default tab = `Month` (most-used view). Workweek tab REMOVED. `WorkweekToggle` reused inside Propel Dialog triggered by header chip (`Working: M T W T F S̶ S̶ ✎`). Rationale: `week_pattern` is set-once metadata, doesn't deserve equal hierarchy with Month/Year. Cell labels show holiday/override name truncated 1-line + native tooltip — uniformity preserved via `aspect-square`.

## Unresolved Questions

(none — all resolved above, ready for implementation)
