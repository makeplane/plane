# Phase Implementation Report

## Executed Phase

- Phase: phase-04-cleanup-workspace-settings
- Plan: plans/260307-1053-dept-workspace-migration
- Status: completed

## Files Modified

### Edited

- `packages/types/src/settings.ts` — removed `"departments"` and `"staff"` from `TWorkspaceSettingsTabs` union
- `packages/constants/src/settings/workspace.ts` — removed `departments`/`staff` entries from `WORKSPACE_SETTINGS` record and `GROUPED_WORKSPACE_SETTINGS[ADMINISTRATION]` array
- `apps/web/core/components/settings/workspace/sidebar/item-icon.tsx` — removed `departments`/`staff` entries and unused `Network`/`UserCheck` lucide imports
- `apps/web/app/routes/core.ts` — removed two route() entries for `settings/departments` and `settings/staff`
- `apps/web/ce/hooks/use-my-staff-profile.ts` — removed `workspaceSlug` param, updated API endpoint to `/api/v1/users/me/staff-profile/`, removed workspaceSlug from useEffect deps, imports now from new service
- `apps/web/ce/components/settings/profile/staff-profile-section.tsx` — removed `useUserSettings` import and `workspaceSlug` derivation, call `useMyStaffProfile()` with no args

### Created

- `apps/web/ce/services/my-staff-profile.service.ts` — slim service with `IMyStaffProfile` interface and `getMyStaffProfile()` using global `/api/v1/users/me/staff-profile/` endpoint

### Deleted

- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/` (entire directory: page.tsx, header.tsx, components/\*)
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/` (entire directory: page.tsx, header.tsx, components/\*)
- `apps/web/ce/services/department.service.ts`
- `apps/web/ce/services/staff.service.ts`

## Tasks Completed

- [x] Read all target files before changes
- [x] Removed `"departments"` and `"staff"` from `TWorkspaceSettingsTabs`
- [x] Removed departments/staff entries from `WORKSPACE_SETTINGS` and `GROUPED_WORKSPACE_SETTINGS`
- [x] Removed departments/staff icons and unused imports from `item-icon.tsx`
- [x] Removed departments/staff routes from `core.ts`
- [x] Deleted all workspace settings department/staff page files and directories
- [x] Deleted old workspace-scoped `department.service.ts` and `staff.service.ts`
- [x] Updated `use-my-staff-profile.ts` — no workspaceSlug, new global endpoint
- [x] Updated `staff-profile-section.tsx` — no workspaceSlug, no useUserSettings
- [x] Verified grep checks return empty for `department.service|staff.service` and `settings/departments|settings/staff`

## Tests Status

- Type check: not run (requires full pnpm build environment)
- Unit tests: not run
- Integration tests: not run

## Notes

- Two extra files found beyond the task list (`departments/components/link-project-modal.tsx`, `staff/components/staff-stats-cards.tsx`) — both removed via `rm -rf` on the full directories.
- New `my-staff-profile.service.ts` retains the `IMyStaffProfile` interface that was previously in `staff.service.ts`, keeping the type contract intact for the hook and profile section component.

## Issues Encountered

None. All files existed as expected, grep verifications passed clean.

## Next Steps

- Phase 5/6 (org-chart workspace, autojoin polish) can proceed — no shared file ownership conflicts detected.
- Backend must expose `GET /api/v1/users/me/staff-profile/` for the hook to function correctly.
