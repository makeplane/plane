# ho-filter-options-null-audit.md

# Track A.2 — Null-safe access audit for store.filterOptions consumers

## Type

`filterOptions: THoFilterOptions | null = null` (ho-issue.store.ts:81)

## Consumer inventory

### 1. ho-datasheet-header.tsx:28

```tsx
const options = store.filterOptions;
// ...
if (!options) return undefined; // line 162 — explicit null guard before any field access
```

**Status: SAFE.** `getFilterOptions()` returns `undefined` when options is null; `HoHeaderFilter` receives `options={undefined}` and renders header with no filter chips populated. No crash.

### 2. ho-category-view.tsx

No direct read of `filterOptions` — uses `store.filters`, `store.categorySummary`, `store.selectedDepartmentIds`, `store.accessibleWorkspaces`. All populated from separate fetch calls.
**Status: N/A (no filterOptions access).**

### 3. ho-datasheet-view.tsx

No direct read of `filterOptions`.
**Status: N/A (no filterOptions access).**

### 4. ho-issue.store.ts internal methods

`filterOptions` is written (not read) inside `fetchFilterOptions()`. Internal store methods read `filterParams` (computed from filters/dates/ids), not `filterOptions`.
**Status: N/A.**

## Null-race analysis

**Pre-fix race scenario:**

- HoPage mounts → HoDatasheetView mounts → useEffect fires fetchFilterOptions()
- Filter options is null until first HTTP response arrives (~400ms)
- During this window: HoDatasheetHeader renders with `options = null` → `getFilterOptions()` returns `undefined` → filter dropdowns show "no options" loading state
- This is correct UX behavior (chips are inactive until data arrives)

**Post-fix behavior:**

- HoPage useEffect fires fetchFilterOptions() once on mount
- isFilterOptionsLoading = true during fetch
- HoDatasheetHeader already has `if (!options) return undefined` guard
- No child view can crash due to null filterOptions

## Gate: does parent block children?

No explicit Suspense/loading gate required. The filter options populating lazily is acceptable UX:

- Issues list loads independently (fetchIssues)
- Filter chips appear populated once filterOptions resolves
- Filter chips are non-blocking — user can scroll/browse issues while options load
- No crash risk because all 3 access sites are null-guarded

**Decision: No loading sentinel needed.** Existing null-guard at ho-datasheet-header.tsx:162 is sufficient.
