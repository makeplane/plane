# Phase 03 — Frontend: recursive expandable rows + i18n

**Priority:** High · **Status:** ✅ Done — tsc + lint clean · **Depends on:** Phase 02

## Related code files

**Modify**

- `apps/web/ce/components/time-tracking/timesheet/timesheet-table.tsx` — render body via recursive row
  component (keep header + footer + visual layout).
  > **TanStack removal is NOT free (red-team #6, High).** All cell rendering lives in `columnHelper.accessor(...).cell`
  > callbacks + `flexRender` (`timesheet-table.tsx:65-118`), and `<th>`/`<td>` widths are keyed on
  > `header.id === "issue_identifier" ? "min-w-[260px]" : "w-20"` (`:139-141,:156`). Keeping the header on
  > TanStack while hand-rolling the body splits the column source-of-truth → header/body width desync,
  > especially the cross-workspace workspace column. **Pick ONE:** either (a) keep TanStack and use its
  > expanding/sub-row API (`getExpandedRowModel`), or (b) rewrite header AND body by hand together with an
  > explicit cell-by-cell width/class checklist. Do not split. "Output is identical" is only true if every
  > cell + width class is reproduced exactly — verify, don't assume.
- `apps/web/ce/components/time-tracking/timesheet/index.ts` — export new row component if needed.
- `packages/i18n/src/locales/{en,ko,vi}/translations.ts` — add `timesheet_show_sub_items` (aria-label).

**Create**

- `apps/web/ce/components/time-tracking/timesheet/timesheet-row.tsx` — recursive `TimesheetRow`
  (keeps `timesheet-table.tsx` < 150 lines).

## Design (mirror `core/components/issues/issue-layouts/spreadsheet/issue-row.tsx`)

`TimesheetRow` props: `row, nestingLevel, weekDates, showWorkspaceColumn, workspaceSlug, weekStart,
setPeekIssue, fetchSubIssues, ancestorIds`.

- Local state: `isExpanded`, `children: ITimesheetRow[] | null`, `isLoading`, `error: boolean`.
- **`ancestorIds: Set<string>` (red-team #4, Critical — load-bearing since the depth cap is removed).** The
  data model permits parent/child cycles (issue serializer validates parent project only, no ancestor guard
  — `serializers/issue.py:205-213`; departments guard cycles, issues don't — `db/models/department.py:82`).
  Pass the set of ancestor `issue_id`s down the render path. Suppress the chevron (and skip rendering) when
  `ancestorIds.has(row.issue_id)`. This terminates recursion AND prevents duplicate React `key` collisions
  among siblings when a cycle reintroduces an ancestor.
- **No `MAX_NESTING` cap (user decision: true recursion).** Chevron rendered in the Issue cell when
  `(row.sub_issues_count ?? 0) > 0` and `!ancestorIds.has(row.issue_id)`. Note `sub_issues_count` now means
  "current user's logged children for this week" (validation 2026-05-29) — so the chevron only appears when
  expanding will actually show the user's own logged sub-items, never an empty/placeholder list.
  `ChevronRightIcon` from
  `@plane/propel/icons`, `rotate-90` when expanded, `text-placeholder hover:text-tertiary`. Cost is bounded
  by lazy fetch + the cycle guard + the backend `[:200]` breadth cap (#13).
- Indent the Issue cell by `nestingLevel * 12px` (spacer div), like spreadsheet.
- `handleToggleExpand`: **gate re-entry on `isLoading` (red-team #15)** — `if (isLoading) return;`. On first
  expand with no children loaded → `setIsLoading(true)`, then
  **wrap in try/catch/finally (red-team #7):**
  ```ts
  try {
    const rows = await fetchSubIssues(rowWorkspaceSlug, row.project_id, row.issue_id, weekStart);
    setChildren(rows);
    setError(false);
    setIsExpanded(true);
  } catch {
    setError(true); /* setToast ERROR */
  } finally {
    setIsLoading(false);
  }
  ```
  On error, leave the chevron re-clickable to retry (don't get stuck spinning). The effective workspace slug
  = `row.workspace_slug ?? workspaceSlug` (cross-workspace support).
- **Reset on week change (red-team #8, High).** Children live in row-local state and rows are keyed by
  `issue_id`, so React reuses the instance across week navigation → expanded children would show stale
  (previous-week) worklogs under the new week's columns. Add `useEffect(() => { setChildren(null);
setIsExpanded(false); }, [weekStart])` (or key the row by `${weekStart}-${issue_id}` to force remount).
- Render: one `<tr>` (issue cell w/ chevron+indent, 7 day cells, total cell, optional workspace cell to
  match column order), then if `isExpanded` map `children` → `<TimesheetRow nestingLevel+1
ancestorIds={new Set([...ancestorIds, row.issue_id])} ...>`.
- Cells reuse `formatMinutes`; day value `row.days[date] ?? 0` (date key MUST match backend contract, see
  Phase 01 #3); issue click → `setPeekIssue(...)` (same as current). Column order MUST match header:
  `[Workspace?] | Issue | Mon..Sun | Total`.

`timesheet-table.tsx`:

- Keep `weekDates`, header `<thead>`, footer `<tfoot>` exactly as now.
- `<tbody>`: `rows.map(r => <TimesheetRow key={r.issue_id} row={r} nestingLevel={0}
ancestorIds={new Set()} ... />)`.
- Pass `weekStart`, `showWorkspaceColumn`, `workspaceSlug`, `setPeekIssue`, and `fetchSubIssues` (from
  `useWorklog().fetchTimesheetSubIssues`).
- Footer unchanged → `daily_totals` / `grand_total` still top-level only (requirement #2).

## i18n

Add to en/ko/vi: `timesheet_show_sub_items: "Show sub-items"` (aria-label on chevron; EN placeholder for
ko/vi). All other strings already keyed.

## Implementation steps

1. Create `timesheet-row.tsx` (recursive, < 150 lines) — `ancestorIds` cycle guard, `isLoading`/`error`
   state, try/catch/finally, re-entry guard, week-change reset.
2. Refactor `timesheet-table.tsx`: choose TanStack-expanding OR full hand-rewrite of header+body together
   (no split source-of-truth for columns); keep footer/layout identical.
3. Wire `fetchSubIssues` from `useWorklog()`; pass `weekStart={weekStart}` and `ancestorIds`.
4. Add i18n key to 3 locale files.
5. `pnpm check:lint` + `pnpm --filter web exec tsc --noEmit`.
6. Manual check: project tab + workspace tab, expand parent → children load; child-of-child expands;
   no-sub-item rows have no chevron; footer totals unchanged; **fetch-error → chevron retriable (not stuck);
   change week while expanded → children refetch/reset (no stale numbers); double-click → no duplicate
   request; deep (>5) recursion works; column widths aligned header↔body.**

## Todo

- [x] `timesheet-row.tsx` recursive component (ancestor guard, error/loading, week-reset, re-entry guard, `aria-expanded`)
- [x] refactor table body — chose full hand-rewrite (removed TanStack); single column source-of-truth, footer preserved
- [x] wire fetch + weekStart + ancestorIds + cross-workspace ws slug (`row.workspace_slug ?? workspaceSlug`)
- [x] i18n key `timesheet_show_sub_items` in en/ko/vi (ko/vi = EN placeholder per scope)
- [x] lint + typecheck clean (tsc exit 0; eslint 0 errors)

## Success criteria

- Rows whose parent has ≥1 of the current user's logged children show a working chevron in both scopes;
  expansion lazy-loads ONLY the current user's logged sub-items for that week (no 0-minute placeholders);
  recursive with no depth cap (cycle-safe via `ancestorIds`).
- Top-level list, footer totals, and Excel export unchanged (logged children still appear top-level too;
  nesting is additive, no restructure — duplication accepted per user decision).
- Fetch errors are recoverable (no stuck spinner); week change resets expanded children; double-click does
  not double-fetch; header/body columns stay aligned.
- Zero hardcoded strings; semantic tokens only; `observer()` on store-reading components.

## Risk

- **TanStack body refactor (red-team #6):** medium, not low. Header keeps TanStack-driven column widths;
  hand-rolled body must reproduce them exactly or columns desync. Mitigation: single source-of-truth for
  columns (don't split) + cell-by-cell width/class checklist + code-reviewer visual check.
- **Cycle recursion (red-team #4):** the data model allows parent/child cycles; with the depth cap removed,
  the `ancestorIds` guard is the ONLY termination guarantee + duplicate-key prevention. Mitigation: verify
  the guard in manual test with a deliberately deep chain.

## Next

- Finalize: project-management sync, docs check, optional commit, journal.
