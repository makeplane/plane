# Plan Review: HO View Refactor — Table UX + Workspace/Project Filters

**Plan:** `plans/260330-0935-ho-ui-refactor-workspace-filter/`
**Reviewer role:** Assumption Destroyer
**Date:** 2026-03-30

---

## Finding 1: `ws.logo` Field Name Is Wrong — Serialization Will Return `None` for All Logos

- **Severity:** High
- **Location:** Phase 1, section "Add `HoAccessibleWorkspacesView`"
- **Flaw:** The plan accesses `ws.logo` directly in the manual dict:
  ```python
  "logo_url": ws.logo,
  ```
  The `Workspace` model has `logo` (raw TextField) AND a `@property logo_url` that resolves both `logo_asset` (FileAsset FK) and `logo` (legacy URL). Accessing `ws.logo` skips the `logo_asset` path entirely. Any workspace using the newer FileAsset upload will return `None` instead of the asset URL.
- **Failure scenario:** User uploads a workspace logo via the asset upload flow. In production, `ws.logo` is `None` and `ws.logo_asset` holds the reference. The API returns `"logo_url": null` for every such workspace; the selector renders broken/missing logos.
- **Evidence:** `apps/api/plane/db/models/workspace.py:147` — `logo_url` is a `@property`; plan uses `ws.logo` raw field instead.
- **Suggested fix:** Use `ws.logo_url` (the property) in the dict: `"logo_url": ws.logo_url`.

---

## Finding 2: `project_id` Filter Has No Workspace Boundary Enforcement — Cross-Workspace Data Leak

- **Severity:** Critical
- **Location:** Phase 1, section "Security" and implementation step 1
- **Flaw:** The plan filters `project_id__in=project_ids` against the full `workspace_id__in=workspace_ids` queryset. If `workspace_slug` is NOT provided (no workspace filter active), the queryset spans ALL accessible workspaces. A user can supply arbitrary project UUIDs from any of those workspaces and the filter will pass as long as the issue's workspace is in `workspace_ids`. This is fine for instance admins (they see everything), but for department managers who span multiple workspaces it allows leaking project data from a workspace they weren't intending to query.

  More concretely: the plan's security note says "`project_id` scoped within already-filtered `workspace_ids` queryset." This is true at the workspace level but not at the project level — projects are never validated against whether they actually belong to the specific workspace the user presumably selected.

- **Failure scenario:** Dept manager has access to WS-A (2 projects) and WS-B (3 projects). They select WS-A in the UI, which sends `workspace_slug=ws-a&project_id=<project-in-WS-B>`. Backend resolves `workspace_ids` → filters to WS-A only, then applies `project_id__in` — but the WS-B project has no issues in WS-A, so the query returns empty. At first glance safe. However: if `workspace_slug` is omitted (direct API call), `workspace_ids` covers both workspaces and `project_id` from WS-B returns data. The UI only omits the param when "All workspaces" is selected, but the API has no server-side guard enforcing that project UUIDs must match the provided `workspace_slug`.
- **Evidence:** Phase 1, implementation step 1 — no cross-check between `workspace_slug` filter result and `project_ids`. Security section does not mention this gap.
- **Suggested fix:** When `workspace_slug` is provided, validate that each supplied `project_id` belongs to `ws.id` before applying the filter:
  ```python
  valid_project_ids = list(
      ws.workspace_project.filter(id__in=project_ids, deleted_at__isnull=True).values_list("id", flat=True)
  )
  qs = qs.filter(project_id__in=valid_project_ids)
  ```
  When `workspace_slug` is absent, either disallow `project_id` param or validate against all accessible workspace projects.

---

## Finding 3: `setWorkspaceFilter` / `setProjectFilter` Mutate MobX Observables Outside `runInAction` — MobX Strict Mode Violation

- **Severity:** High
- **Location:** Phase 2, section "Store: Add actions"
- **Flaw:** The planned synchronous action body mutates observables directly without `runInAction`:
  ```typescript
  setWorkspaceFilter = (slug: string | null): void => {
    this.selectedWorkspaceSlug = slug; // direct mutation
    this.selectedProjectIds = []; // direct mutation
    this.currentPage = 1; // direct mutation
    void this.fetchIssues(1);
    void this.fetchCategorySummary();
  };
  ```
  The existing store uses `runInAction` consistently for ALL observable mutations (lines 102, 114, 121, 125, 137, 146, 152). MobX's `configure({ enforceActions: "always" })` — if active in this codebase — will throw at runtime. Even without strict mode, the inconsistency will cause MobX reaction batching to be skipped for these synchronous mutations, potentially causing two re-renders instead of one.
- **Failure scenario:** If MobX strict mode is enabled (common in production builds), calling `store.setWorkspaceFilter("slug")` throws: `[MobX] Since strict-mode is enabled, changing observables without using an action is not allowed`. Filter change silently fails, UI never updates.
- **Evidence:** Planned code (Phase 2, step 3) has no `runInAction` around the three direct mutations. Contrast with `setDateRange` in the existing store (line 163-169) which also does not use `runInAction` — but that is already a latent bug, not a justification to repeat it.
- **Suggested fix:** Wrap the synchronous mutations:
  ```typescript
  setWorkspaceFilter = (slug: string | null): void => {
    runInAction(() => {
      this.selectedWorkspaceSlug = slug;
      this.selectedProjectIds = [];
      this.currentPage = 1;
    });
    void this.fetchIssues(1);
    void this.fetchCategorySummary();
  };
  ```

---

## Finding 4: Double `fetchAccessibleWorkspaces` on Mount — Redundant API Call With No Deduplication

- **Severity:** Medium
- **Location:** Phase 3, steps 5 and 6 ("Refactor `ho-datasheet-view.tsx`" and "Refactor `ho-category-view.tsx`")
- **Flaw:** Both `ho-datasheet-view.tsx` and `ho-category-view.tsx` are planned to call `store.fetchAccessibleWorkspaces()` in a `useEffect` on mount. The plan notes this in the "Failure Modes" table (Phase 2) but dismisses it as acceptable ("last one wins"). However, the issue is not just double network requests — if a user loads the category view and the datasheet view is also mounted (e.g., both rendered in a tab layout), TWO concurrent fetches fire on the shared store, racing to write `accessibleWorkspaces`. There is no guard (no `if (this.accessibleWorkspaces.length > 0) return`) nor an in-flight deduplication flag (`isWorkspacesLoading` is set to `true` only AFTER the fetch starts, not checked before starting a new one).
- **Failure scenario:** Both views mount simultaneously. Two `GET /api/ho/workspaces/` calls fire. The first resolves and sets `accessibleWorkspaces = [A, B, C]`. While the user selects workspace A, the second response arrives and overwrites with `[A, B, C]` again — likely harmless in this case, but if the user made a selection between the two completions, the second response does NOT reset the filter, so the store is consistent. The real cost is the redundant network request and two isLoading flashes.
- **Evidence:** Phase 3, step 5: `void store.fetchAccessibleWorkspaces()` in `ho-datasheet-view.tsx`; step 6: same in `ho-category-view.tsx`. Phase 2 failure modes: "double fetch assumption" acknowledged but marked as acceptable.
- **Suggested fix:** Add an early return guard in `fetchAccessibleWorkspaces`:
  ```typescript
  if (this.isWorkspacesLoading || this.accessibleWorkspaces.length > 0) return;
  ```
  Or call fetch only from a single parent layout component, not both leaf views.

---

## Finding 5: `bg-inherit` on Frozen Column Will Not Work With Tailwind Zebra Row Classes

- **Severity:** High
- **Location:** Phase 3, step 9 ("Table UX: `ho-datasheet-row.tsx` — Frozen first column cell")
- **Flaw:** The plan sets frozen `<td>` to `sticky left-0 z-[5] bg-inherit`. `bg-inherit` in CSS inherits the background from the parent element. However, Tailwind's zebra striping (`odd:bg-surface-1 even:bg-surface-2`) is applied as CSS classes on `<tr>`. `bg-inherit` on a `<td>` inside a `<tr>` WILL correctly inherit the `<tr>` background — but only if the `<tr>` has an actual background color painted (not just a class). In many browsers, `background-color` on `<tr>` does not paint through to `sticky` positioned `<td>` children due to table stacking context rules. The sticky cell background must be set explicitly, not inherited.
- **Failure scenario:** User scrolls right. The frozen first column becomes sticky but its background is transparent (or picks up the page background, not the row stripe color). Content from non-frozen scrolled columns bleeds visually through the frozen column. The zebra row effect breaks on the frozen column — odd rows look different from even rows only in the non-frozen region.
- **Evidence:** Phase 3, step 9: `bg-inherit` explicitly chosen as the frozen cell background. The failure mode table in Phase 3 lists "Frozen column shadow/overlap on scroll" but only mentions adding a box-shadow, not the background color issue.
- **Suggested fix:** Set explicit backgrounds on frozen cells matching the row stripe:
  ```tsx
  // on <tr> odd rows frozen td:
  className = "sticky left-0 z-[5] bg-surface-1 odd:bg-surface-1 even:bg-surface-2";
  ```
  Or use a CSS variable approach / Tailwind group variant to conditionally apply the correct surface token.

---

## Finding 6: `HoAccessibleWorkspacesView` Uses `Issue.objects` Pattern Inconsistency — Wrong Manager (Existing Bug Propagated)

- **Severity:** Medium
- **Location:** Phase 1, existing `HoIssueListView` (propagated, not introduced)
- **Flaw:** This is not introduced by the plan but the plan's new view `HoAccessibleWorkspacesView` inherits the same `BaseAPIView` base. More importantly, the existing `HoIssueListView` uses `Issue.objects` (lines 126, 181 in `ho.py`) rather than `Issue.issue_objects` which is the `IssueManager` that presumably handles soft-deletion and other filters. The plan adds `project_id__in` filtering on top of this existing queryset without noting the manager discrepancy. If `IssueManager` applies additional global filters (e.g., excluding certain issue types), bypassing it means the filter results are inconsistent with the rest of the app.
- **Failure scenario:** `Issue.issue_objects` filters out issues that `Issue.objects` includes (e.g., issues with `is_draft=True` that somehow slipped through). The HO view returns issues that are invisible in every other view. Adding the workspace/project filter on this existing inconsistency amplifies the scope of the problem.
- **Evidence:** `ho.py` lines 126 and 181 both use `Issue.objects`; backend architecture rules (`plane-backend-architecture.md`) state "NEVER `Issue.objects` for user queries." The plan does not surface this discrepancy.
- **Suggested fix:** Note in the plan that the existing views should be audited to use `Issue.issue_objects` (or verify the manager does nothing extra for HO context). Do not add new filtering on top of an unvalidated base queryset.

---

## Finding 7: `fetchCategorySummary` Params Not Updated in the Plan's Step-by-Step — Silent Filter Miss

- **Severity:** High
- **Location:** Phase 2, step 4 ("Store: Update `fetchIssues` and `fetchCategorySummary`")
- **Flaw:** The plan shows param construction code for `fetchIssues` in detail but only says "Same pattern for `fetchCategorySummary`" without specifying the implementation. The existing `fetchCategorySummary` builds its own `params` dict (confirmed at store lines 141-144) independently of `fetchIssues`. If an implementer reads step 4 casually and only updates `fetchIssues`, the category summary view will never pass `workspace_slug` or `project_id` to the backend — it will always show unfiltered aggregate data regardless of the filter selection.
- **Failure scenario:** User selects "Workspace A" in the toolbar. The datasheet view correctly shows only WA issues. The category summary view still shows all workspaces' category counts because `fetchCategorySummary` was not updated to pass `workspace_slug`. The two views appear inconsistent, silently misleading the user.
- **Evidence:** Phase 2, step 4: "Same pattern for `fetchCategorySummary`" — no actual code provided. The todo list item (Phase 2, todo) says "Update `fetchCategorySummary` params" but gives no code. The existing method is independently implemented (store lines 136-156) and will not self-update.
- **Suggested fix:** Include the explicit code diff for `fetchCategorySummary` params in the plan, identical to what is shown for `fetchIssues`. Do not rely on "same pattern" shorthand for a critical path.

---

## Finding 8: Sticky Header `top-0` Assumption — Will Conflict With Page-Level Sticky Nav

- **Severity:** Medium
- **Location:** Phase 3, step 8 ("Table UX: `ho-datasheet-header.tsx`")
- **Flaw:** The plan sets `<thead>` to `sticky top-0 z-20`. This assumes the scroll container is the table's direct ancestor div (the `overflow-y-auto` wrapper added in step 7). If the page has any sticky navbar or toolbar above the table scroll container, and the container's `overflow-y-auto` is not the actual scrolling root, `top-0` will place the header at the top of the viewport — potentially behind the sticky nav bar. The plan does not verify the scroll container boundaries.
- **Failure scenario:** The HO page has a sticky toolbar at the top (added in step 4 via `position: relative`). The `overflow-y-auto` div is inside the content area below the toolbar. If browser treats the outer page as the scroll root (which happens if the `overflow-y-auto` div does not have a defined height or `flex-1`), the `sticky top-0` thead overlaps with the toolbar instead of sticking to the top of the table scroll container.
- **Evidence:** Phase 3, step 7 sets `max-h-[calc(100vh-200px)]` on the scroll container — the magic number `200px` is assumed to account for all content above but is not validated. Step 8 just adds `sticky top-0 z-20` with no mention of confirming scroll root.
- **Suggested fix:** Verify the scroll container is the actual scroll root by checking parent overflow. Consider using `top: 0` relative to the scroll container explicitly, or set `scroll-mt` / adjust the calc value to account for any sticky toolbars.

---

## Unresolved Questions

1. Does `Issue.issue_objects` in this codebase apply any additional filters beyond soft-delete? If so, `HoIssueListView` using `Issue.objects` is already returning incorrect data — the plan's new filter params will magnify, not introduce, this bug.
2. Is MobX `enforceActions: "always"` configured for the apps/web build? If yes, Finding 3 is `Critical` not `High`.
3. The `CustomSearchSelect` `multiple` prop confirmed to exist (line 34 of source). However, when `multiple=true`, does the component return `string[]` even when only one item is selected, or does it return a single `string`? The `onChange={(val: string[]) => ...}` type assertion in `ho-project-select.tsx` is unchecked at runtime.
4. The `max-h-[calc(100vh-200px)]` magic number — what is the measured height of all fixed/sticky content above the table in the actual HO layout?
