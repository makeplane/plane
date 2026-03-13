# Phase 4: Frontend -- Default View UI (Project Scope)

## Context

- Project views page: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/[projectId]/views/page.tsx`
- Project views header: corresponding `header.tsx`
- Project view store: (grep for ProjectViewStore or look in `apps/web/core/store/`)
- View type: `IProjectView` in `packages/types/src/project/` or `packages/types/src/views.ts`
- Reference: workspace plan phase-05 (same pattern, different store/page paths)

## Overview

Mark the project default view with a lock icon, prevent deletion, auto-navigate to it on the project views page load, and ensure the 14-column order matches spec. Mirrors workspace plan phase-05 but scoped to project views page and project view store.

## Requirements

1. Default view shows lock icon + "Default" badge in project views sidebar/list
2. Delete option hidden/disabled for `is_default=True` views in project views
3. Project views page auto-selects default view on first load
4. Column order in spreadsheet matches spec (14 columns in fixed order)
5. No drag handles on columns when viewing default view

## Architecture

### Auto-select Default View

On project views page mount, if no `viewId` in URL:

1. Fetch all project views via store's fetch method
2. Find view with `is_default === true`
3. Use `router.replace('/[workspaceSlug]/projects/[projectId]/views?viewId={defaultViewId}')` — query param pattern, avoids history pollution

> ⚠️ **Check existing URL pattern**: the workspace plan used `?viewId=`. Verify project views page uses the same `viewId` query param, or adapt accordingly.

### Delete Protection

- Project view store `deleteView` method: check `view.is_default` before API call
- Show toast: "Default views cannot be deleted"
- View list item: conditionally render delete button (hide if `is_default`)
- Backend already guards (Phase 1)

### Column Order (FIXED — non-reorderable in default view)

```
assignee, modules, bank_wide_project, key, sub_issue_count, priority,
cycle, state, progress_tracking, start_date, due_date,
completed_date, reference_link, total_log_time
```

When `view.is_default === true`, hide column drag handles in spreadsheet header.

## Related Files

- `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/[projectId]/views/page.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/[projectId]/views/header.tsx`
- Project view store (grep: `ProjectViewStore`, likely in `apps/web/core/store/`)
- Project views list component (grep: `ProjectViewsList` or similar in CE/core)
- `packages/types/src/project/` — IProjectView type

## Implementation Steps

### 4.1 Verify `is_default` in `IProjectView` type

- Check `packages/types/src/project/` for project view type
- Add `is_default?: boolean` if missing
- Workspace plan may have added it to a shared base — check inheritance

### 4.2 Lock icon + "Default" badge in project views list

- Find project views list component (grep for where `ProjectView[]` items are rendered)
- Conditionally render `<Lock />` icon from propel/lucide when `view.is_default`
- Hide "Delete" action in context menu for default views
- Follow existing pattern from workspace views list (copy structure)

### 4.3 Auto-select default view on page load

- In project views `page.tsx` (or a layout wrapper component)
- On mount: read `viewId` from search params
- If absent: find `is_default` view from store, `router.replace` with query param
- Wait for views fetch to complete before auto-navigating

```typescript
useEffect(() => {
  if (searchParams.get("viewId")) return;
  const defaultView = projectViews.find((v) => v.is_default);
  if (defaultView) {
    router.replace(`/${workspaceSlug}/projects/${projectId}/views?viewId=${defaultView.id}`);
  }
}, [projectViews]);
```

### 4.4 Delete guard in project view store

- In `ProjectViewStore.deleteView`: early return if view `is_default`
- Show toast: `setToast({ type: "error", title: "Default views cannot be deleted" })`
- Pattern same as workspace plan phase-05 step 5.4

### 4.5 Column order enforcement for default view

- `SPREADSHEET_PROPERTY_LIST` from workspace plan already sets shared order
- For default view: when `view.is_default === true`, disable column reorder UI
- In spreadsheet header component: conditionally hide drag handle icon
- Workspace plan phase-05 step 5.5 implemented this — verify it works for project spreadsheet too

### 4.6 Add i18n keys (if missing)

- Verify `spreadsheet.columns.bank_wide_project`, `.progress_tracking`, `.completed_date`, `.reference_link`, `.total_log_time` exist in en/ko/vi translations
- Workspace plan added these — verify they're present; add if missing

## Todo

- [ ] Verify `is_default` in IProjectView type
- [ ] Find project views list component and add lock icon / badge
- [ ] Hide delete for default views in project views UI
- [ ] Add auto-select logic on page mount
- [ ] Add store-level delete guard with toast
- [ ] Verify column ordering matches 14-column spec
- [ ] Verify i18n keys for CE columns are present

## Post-Phase Checklist

- [ ] Navigate to `/:slug/projects/:id/views` — default view auto-selected
- [ ] Lock icon visible on default view item in list
- [ ] Delete button hidden/disabled for default view
- [ ] 14 columns visible in correct order in spreadsheet
- [ ] Column drag handles hidden when viewing default view
- [ ] Trying to delete default view shows toast error
- [ ] Regular views still fully functional (create, edit, delete)
- [ ] `pnpm check:lint` — 0 errors

## Success Criteria

- Default view auto-selected on project views page
- Lock icon visible, delete not possible
- All 14 columns visible in correct order
- Regular project views unaffected

## Risk Assessment

- **Race condition**: auto-select must wait for `fetchProjectViews` to complete — use `isLoaded` flag
- **URL pattern mismatch**: if project views use different query param than `viewId`, must adapt
- **Store method name**: grep to confirm exact method name for fetching/deleting project views

## Security Considerations

- Delete protection is defense-in-depth (frontend + backend)
- No new API surface in this phase

## Next Steps

Phase 5: integration testing and validation
