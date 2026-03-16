# Phase 2: Frontend — Default View UI (Project Views)

## Context

- Parent plan: [plan.md](plan.md)
- Project views list page: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(list)/page.tsx`
- View list item: `apps/web/core/components/views/view-list-item.tsx`
- Project view store: `apps/web/core/store/project-view.store.ts`
- Type: `packages/types/src/views.ts` (`IProjectView`)

## Overview

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| Date        | 2026-03-13                                         |
| Description | Lock icon, delete guard, auto-nav for project view |
| Priority    | P1                                                 |
| Status      | ✅ Done                                            |
| Review      | Pending                                            |

## Requirements

1. `IProjectView` type has `is_default: boolean`
2. Default view shows lock icon + "Default" badge in view list
3. Delete option hidden/disabled for `is_default=True` views
4. Project views page auto-navigates to default view on load
5. Store-level delete guard with toast notification

## Architecture

### Auto-navigate on Page Load

On project views page mount, if default view exists in store:

```typescript
const defaultView = projectViews.find((v) => v.is_default === true);
if (defaultView) {
  router.replace(`/${workspaceSlug}/projects/${projectId}/views/${defaultView.id}`);
}
```

Key difference from workspace plan: uses **route segment** `/views/{id}` not `?viewId=` query param.

### Delete Guard in Store

`ProjectViewStore.deleteProjectView()` — early return + toast if `view.is_default`.

### View List Item UI

`view-list-item.tsx`: conditionally renders `<Lock />` icon and "Default" badge; hides delete action for default views.

## Related Files

- `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(list)/page.tsx` ✅
- `apps/web/core/components/views/view-list-item.tsx` ✅
- `apps/web/core/store/project-view.store.ts` ✅
- `packages/types/src/views.ts` ✅

## Implementation Steps

### 2.1 Add `is_default` to `IProjectView`

- `packages/types/src/views.ts`: add `is_default?: boolean`

### 2.2 Auto-navigate on page load

- `page.tsx`: `useEffect` on `projectViews` — find `is_default`, `router.replace` to view route
- Guard: only redirect if `projectViews` is loaded and not undefined

### 2.3 Lock icon + Default badge in list

- `view-list-item.tsx`: render `<Lock />` icon when `view.is_default`
- Hide "Delete" option in context menu for default views

### 2.4 Store delete guard

- `project-view.store.ts`: check `view.is_default` before API call
- Show toast: "Default views cannot be deleted"

## Todo

- [x] Add `is_default` to `IProjectView` type
- [x] Auto-navigate on page mount
- [x] Lock icon + Default badge in `view-list-item.tsx`
- [x] Hide delete for default views
- [x] Store-level delete guard with toast

## Success Criteria

- Default project view auto-selected on project views page load
- Lock icon visible + actions menu has no delete for default view
- Attempting store delete shows toast, no API call made

## Risk Assessment

- **Race condition**: `projectViews` may load after mount — useEffect dependency on `projectViews` handles this
- **Redirect loop**: guard with `if (defaultView)` prevents loop when already on view detail page

## Security Considerations

- Delete protection is defense-in-depth (frontend store + backend 400 guard)

## Next Steps

Phase 3: integration & validation
