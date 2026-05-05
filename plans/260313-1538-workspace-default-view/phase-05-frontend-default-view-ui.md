# Phase 5: Frontend -- Default View UI

## Context

- Workspace views page: `apps/web/app/(all)/[workspaceSlug]/(projects)/workspace-views/page.tsx`
- Views header: `apps/web/app/(all)/[workspaceSlug]/(projects)/workspace-views/header.tsx`
- GlobalViewStore: `apps/web/core/store/global-view.store.ts`
- View type: `packages/types/src/workspace-views.ts` (`IWorkspaceView`)
- Static views: `STATIC_VIEW_TYPES` in same file

## Overview

Mark the default view with a lock icon, prevent deletion, auto-navigate to it on workspace views page load, and ensure the 16-column order matches the spec.

## Requirements

1. Default view shows lock icon + "Default" badge in sidebar/list
2. Delete option hidden/disabled for `is_default=True` views
3. Workspace views page auto-selects default view on first load
4. Column order in spreadsheet matches spec (16 columns in fixed order)
5. Filters resolve "today" dynamically at load time

## Architecture

### Auto-select Default View

<!-- Updated: Validation Session 3 - Use ?viewId= query param pattern with router.replace -->

On workspace views page mount, if no `viewId` in URL:

1. Fetch all views via `fetchAllGlobalViews`
2. Find view with `is_default === true`
3. Use `router.replace('/workspace-views?viewId={defaultViewId}')` — query param pattern, avoids adding to history stack

### "Today" Filter Resolution

<!-- Updated: Validation Session 3 - Proactively implement token parser, don't just verify -->

Backend stores filter as `["today;after_including;"]` pattern. **Implement** a `today` date-token resolver in the frontend filter utilities (e.g., a `resolveDateToken(token: string): string` helper that maps `today` → current ISO date string). Apply in the workspace view issues filter store when processing date filter values.

### Delete Protection

- `GlobalViewStore.deleteGlobalView`: check `is_default` before calling API
- View list item: conditionally render delete button
- Backend already guards (Phase 2)

### Column Order

The `SPREADSHEET_PROPERTY_LIST` constant controls column order. For the default view, enforce this specific order:

```
department_name, project_name, assignee, modules, bank_wide_project,
key (work item), sub_issue_count, priority, cycle, state,
progress_tracking, start_date, due_date, completed_date,
reference_link, total_log_time
```

## Related Files

- `apps/web/app/(all)/[workspaceSlug]/(projects)/workspace-views/page.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/workspace-views/header.tsx`
- `apps/web/core/store/global-view.store.ts`
- `packages/types/src/workspace-views.ts`
- `packages/constants/src/issue/common.ts`

## Implementation Steps

### 5.1 Add `is_default` to `IWorkspaceView` type

- Already planned in Phase 2; verify in `packages/types/src/workspace-views.ts`

### 5.2 Lock icon + badge in view list

- In workspace views sidebar/list component
- Conditionally render `<Lock />` icon when `view.is_default`
- Hide "Delete" action in context menu for default views

### 5.3 Auto-select default view on page load

- In workspace views `page.tsx` or a wrapper component
- On mount: find `is_default` view from store, redirect if no viewId param
- Use `router.replace()` to avoid adding to history stack

### 5.4 Delete guard in store

- In `GlobalViewStore.deleteGlobalView`: early return if view `is_default`
- Show toast: "Default views cannot be deleted"

<!-- Updated: Validation Session 1 - Columns are FIXED/non-reorderable in default view -->

### 5.5 Column order for default view (FIXED — non-reorderable)

- Default view's `display_properties` enables exactly 16 columns
- `SPREADSHEET_PROPERTY_LIST` updated in Phase 4 controls render order
- For default view, all 16 properties set to `true`; for regular views, new properties default to `false`
- **Non-reorderable**: when `view.is_default === true`, hide column drag handles in spreadsheet header
- User-created views retain free column reordering

### 5.6 Verify "today" filter resolution

- Test that `start_date: ["today;after_including;"]` resolves correctly
- If not supported, add date token resolver in filter utilities

## Todo

- [ ] Add `is_default` to `IWorkspaceView` interface
- [ ] Add lock icon + "Default" badge to view list item
- [ ] Hide delete for default views in UI
- [ ] Add auto-select logic on page mount
- [ ] Add store-level delete guard with toast
- [ ] Verify column ordering matches spec
- [ ] Verify "today" filter token resolution

## Success Criteria

- Default view auto-selected on workspace views page
- Lock icon visible, delete not possible
- All 16 columns visible in correct order
- Filters show today's issues

## Risk Assessment

- **Filter "today" parsing**: existing filter system may not support date tokens; fallback to client-side date injection
- **Race condition**: auto-select must wait for `fetchAllGlobalViews` to complete

## Security Considerations

- Delete protection is defense-in-depth (both frontend + backend)
- No new API surface

## Next Steps

Phase 6: integration testing and validation
