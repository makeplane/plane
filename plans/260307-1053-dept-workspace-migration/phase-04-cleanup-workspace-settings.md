# Phase 4: Cleanup Workspace Settings

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2: Backend API Migration](./phase-02-backend-api-migration.md)
- [Phase 3: God-mode Frontend](./phase-03-godmode-frontend.md)
- Workspace settings: `packages/constants/src/settings/workspace.ts`
- Settings types: `packages/types/src/settings.ts`
- Settings icons: `apps/web/core/components/settings/workspace/sidebar/item-icon.tsx`
- Routes: `apps/web/app/routes/core.ts`
- Staff profile hook: `apps/web/ce/hooks/use-my-staff-profile.ts`
- Staff profile section: `apps/web/ce/components/settings/profile/staff-profile-section.tsx`

## Overview

- **Priority:** P2
- **Status:** pending
- **Effort:** 3h
- Remove department and staff pages from workspace settings. Remove related routes, types, constants, icons, services. Update `useMyStaffProfile` hook to use new global API path (`/api/v1/me/staff-profile/`). Keep StaffProfileSection in My Profile but update to use global hook.

## Key Insights

- 14 files in workspace settings for departments + staff (pages, headers, components)
- `TWorkspaceSettingsTabs` type used across multiple packages -- must remove "departments" | "staff" union members
- `GROUPED_WORKSPACE_SETTINGS[ADMINISTRATION]` includes departments and staff entries -- remove them
- `WORKSPACE_SETTINGS_ICONS` maps departments/staff to icons -- remove entries
- Routes in `core.ts` lines 310-315 define workspace settings dept/staff routes
- `useMyStaffProfile` hook currently takes `workspaceSlug` param -- simplify to no params
- StaffService and DepartmentService in `apps/web/ce/services/` become dead code -- delete
- StaffProfileSection stays but uses updated hook

## Requirements

### Functional

- No departments/staff tabs in workspace settings sidebar
- No routes for `/:workspaceSlug/settings/departments` or `/:workspaceSlug/settings/staff`
- My Profile still shows staff info (department, position, staff_id) via global API
- `useMyStaffProfile()` no longer requires workspaceSlug

### Non-functional

- No broken imports or dead code left behind
- TypeScript compiles without errors
- Lint passes

## Architecture

```
REMOVE from workspace settings:
  - departments/ page, header, 4 components
  - staff/ page, header, 7 components
  - DepartmentService, StaffService (apps/web/ce/services/)
  - Routes, types, constants, icons entries

UPDATE (keep but modify):
  - useMyStaffProfile hook -> no workspaceSlug param, call /api/v1/me/staff-profile/
  - StaffProfileSection -> use updated hook
```

## Related Code Files

### Files to Delete

- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/page.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/header.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/components/department-form-fields.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/components/department-form-modal.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/components/department-tree-item.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/components/department-tree.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/page.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/header.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/components/staff-form-fields.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/components/staff-form-modal.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/components/staff-import-modal.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/components/staff-status-badge.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/components/staff-table.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/components/staff-action-buttons.tsx`
- `apps/web/ce/services/department.service.ts`
- `apps/web/ce/services/staff.service.ts`

### Files to Modify

- `packages/types/src/settings.ts` -- remove `"departments"` and `"staff"` from `TWorkspaceSettingsTabs`
- `packages/constants/src/settings/workspace.ts` -- remove `departments` and `staff` entries from `WORKSPACE_SETTINGS`, remove from `GROUPED_WORKSPACE_SETTINGS[ADMINISTRATION]`
- `apps/web/core/components/settings/workspace/sidebar/item-icon.tsx` -- remove `departments: Network` and `staff: UserCheck` entries, remove unused imports
- `apps/web/app/routes/core.ts` -- remove routes for `:workspaceSlug/settings/departments` and `:workspaceSlug/settings/staff`
- `apps/web/ce/hooks/use-my-staff-profile.ts` -- remove `workspaceSlug` param, call `/api/v1/me/staff-profile/` directly
- `apps/web/ce/components/settings/profile/staff-profile-section.tsx` -- update to use `useMyStaffProfile()` without workspaceSlug

## Implementation Steps

1. **Update types** (`packages/types/src/settings.ts`):
   - Remove `"departments"` and `"staff"` from `TWorkspaceSettingsTabs` union type

2. **Update constants** (`packages/constants/src/settings/workspace.ts`):
   - Remove `departments` and `staff` entries from `WORKSPACE_SETTINGS` record
   - Remove `WORKSPACE_SETTINGS["departments"]` and `WORKSPACE_SETTINGS["staff"]` from `GROUPED_WORKSPACE_SETTINGS[ADMINISTRATION]` array

3. **Update icons** (`apps/web/core/components/settings/workspace/sidebar/item-icon.tsx`):
   - Remove `departments: Network` and `staff: UserCheck` from `WORKSPACE_SETTINGS_ICONS`
   - Remove `Network` and `UserCheck` from lucide-react imports

4. **Update routes** (`apps/web/app/routes/core.ts`):
   - Remove the two `route()` entries for `:workspaceSlug/settings/departments` and `:workspaceSlug/settings/staff`

5. **Delete workspace settings pages**:
   - Delete all 14 files in departments/ and staff/ directories
   - Delete the directories themselves

6. **Delete workspace-scoped services**:
   - Delete `apps/web/ce/services/department.service.ts`
   - Delete `apps/web/ce/services/staff.service.ts`

7. **Update useMyStaffProfile hook** (`apps/web/ce/hooks/use-my-staff-profile.ts`):
   - Remove `workspaceSlug` parameter
   - Change API call from `/api/workspaces/${workspaceSlug}/me/staff-profile/` to `/api/v1/me/staff-profile/`
   - Remove workspaceSlug dependency from useEffect
   - Create a simple APIService instance or use fetch directly for the call

8. **Update StaffProfileSection** (`apps/web/ce/components/settings/profile/staff-profile-section.tsx`):
   - Remove `useUserSettings` import and workspaceSlug derivation
   - Call `useMyStaffProfile()` with no args

9. **Verify no broken imports**:
   - `grep -r "department.service" apps/web/` should return nothing
   - `grep -r "staff.service" apps/web/` should only return staff-profile-section or hook
   - `grep -r "settings/departments" apps/web/` should return nothing
   - `grep -r "settings/staff" apps/web/` should return nothing

10. **Run build checks**:
    - `pnpm check:lint`
    - `pnpm check:format`
    - Verify TypeScript compiles: `pnpm --filter web build` or tsc check

## Todo List

- [ ] Remove "departments" | "staff" from TWorkspaceSettingsTabs type
- [ ] Remove departments/staff from WORKSPACE_SETTINGS constant
- [ ] Remove from GROUPED_WORKSPACE_SETTINGS[ADMINISTRATION]
- [ ] Remove from WORKSPACE_SETTINGS_ICONS
- [ ] Remove routes from core.ts
- [ ] Delete 14 department/staff component files
- [ ] Delete DepartmentService and StaffService from apps/web/ce/services/
- [ ] Update useMyStaffProfile hook (no workspaceSlug)
- [ ] Update StaffProfileSection (no workspaceSlug)
- [ ] Verify no broken imports (grep scan)
- [ ] Run lint and type checks

## Success Criteria

- No departments/staff tabs visible in workspace settings
- Navigating to old URLs returns 404 (route removed)
- My Profile page still shows staff info when user has StaffProfile
- TypeScript compiles without errors
- No dead imports or references to old services

## Risk Assessment

| Risk                                           | Impact                | Mitigation                                        |
| ---------------------------------------------- | --------------------- | ------------------------------------------------- |
| Other components import deleted services       | Build failure         | Grep scan for all imports before deleting         |
| TWorkspaceSettingsTabs change breaks consumers | Type errors           | Search for all usages of the type across packages |
| My Profile breaks if new API not ready         | Staff info disappears | Coordinate with Phase 2 completion                |

## Security Considerations

- No security changes; removing UI only
- New MyStaffProfile API uses IsAuthenticated (same access level as before)

## Next Steps

- Phase 5: Org Chart Workspace Page (new read-only page)
