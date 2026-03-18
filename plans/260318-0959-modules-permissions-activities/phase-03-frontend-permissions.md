# Phase 3: Frontend Permissions (UI-Only)

## Context Links

- [Plan Overview](plan.md)
- No backend dependency -- just hide UI buttons

## Overview

- **Priority**: P1
- **Status**: completed
- **Effort**: 0.5h
- **Description**: Hide module create/edit/delete buttons for non-admin users. Frontend-only approach -- no backend permission changes.

## Key Insights

- Current pattern: `allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT)` used across 5+ components
- Change to: `allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT)`
- `isEditingAllowed` variable controls disabled states on form fields, button visibility, context menu items
- No new components needed -- just changing permission arrays
- Favorite toggle must remain accessible to all members (personal preference, not a module mutation)

## Requirements

- Module create button: hidden for non-ADMIN
- Module edit (sidebar fields, status, dates, lead, members): hidden/disabled for non-ADMIN
- Module delete option: hidden for non-ADMIN
- Module archive/unarchive: hidden for non-ADMIN
- Module list empty state actions (create): hidden for non-ADMIN
- Module work item add/remove: unchanged (ADMIN+MEMBER)
- Favorite toggle: unchanged (all members)
- **No backend changes** -- this is a UI-only restriction

## Architecture

No architectural changes. Pure permission constant swap in existing components.

Pattern change:
```typescript
// Before
const isEditingAllowed = allowPermissions(
  [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  EUserPermissionsLevel.PROJECT
);

// After
const isEditingAllowed = allowPermissions(
  [EUserPermissions.ADMIN],
  EUserPermissionsLevel.PROJECT
);
```

## Related Code Files

- **Modify**: `apps/web/core/components/modules/analytics-sidebar/root.tsx`
- **Modify**: `apps/web/core/components/modules/module-list-item-action.tsx`
- **Modify**: `apps/web/core/components/modules/module-card-item.tsx`
- **Modify**: `apps/web/core/components/modules/quick-actions.tsx`
- **Modify**: `apps/web/core/components/modules/modules-list-view.tsx`

## Implementation Steps

1. **Update `ModuleAnalyticsSidebar` permissions**
   - File: `apps/web/core/components/modules/analytics-sidebar/root.tsx`
   - Change `allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], ...)` to `allowPermissions([EUserPermissions.ADMIN], ...)`
   - Controls: status dropdown, date range, lead, members, links add/edit/delete

2. **Update `ModuleListItemAction` permissions**
   - File: `apps/web/core/components/modules/module-list-item-action.tsx`
   - Change permission array to ADMIN-only
   - Ensure favorite toggle is NOT gated by `isEditingAllowed`

3. **Update `ModuleCardItem` permissions**
   - File: `apps/web/core/components/modules/module-card-item.tsx`
   - Change permission array to ADMIN-only
   - Ensure favorite toggle is NOT gated by `isEditingAllowed`

4. **Update `ModuleQuickActions` permissions**
   - File: `apps/web/core/components/modules/quick-actions.tsx`
   - Change permission array to ADMIN-only
   - Controls: edit, delete, archive options in quick action menu

5. **Update `ModulesListView` empty state permissions**
   - File: `apps/web/core/components/modules/modules-list-view.tsx`
   - Change `canPerformEmptyStateActions` to ADMIN-only

6. **Search for additional permission checks**
   - Grep for module creation modal triggers
   - Verify no other components need updating

## Post-Phase Checklist

- [x] All 5 component files updated with ADMIN-only permission check
- [x] `pnpm check:lint` passes
- [x] Favorite toggle accessible to all members
- [x] Module work item add/remove unchanged
- [x] Manual test: member cannot see create/edit/delete buttons
- [x] Manual test: admin can still create/edit/delete modules

## Todo List

- [x] Update `analytics-sidebar/root.tsx`
- [x] Update `module-list-item-action.tsx`
- [x] Update `module-card-item.tsx`
- [x] Update `quick-actions.tsx`
- [x] Update `modules-list-view.tsx`
- [x] Grep verify no MEMBER in module editing permissions
- [x] Run `pnpm check:lint`
- [x] Mark phase complete

## Success Criteria

- Non-admin members don't see edit/create/delete buttons on module views
- Admin users retain full editing capability
- No visual regressions for read-only viewing
- Lint passes clean

## Risk Assessment

- **Very Low**: Simple constant swap, no logic or backend changes
- Frontend-only = no 403 errors, just hidden UI. If a non-admin somehow triggers an API call, backend still allows it (acceptable tradeoff per user decision)
