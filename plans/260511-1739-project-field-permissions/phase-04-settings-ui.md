# Phase 04 — Project Settings Page UI

## Context Links

- Project settings sidebar constants: `packages/constants/src/settings/project.ts`
- Reference project-settings page (similar shape): `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/workflows/`
- Rules: `.claude/rules/plane-design-system.md`, `forms-inputs.md`, `component-libraries.md`

## Overview

Priority: P2 | Status: pending
Add "Field Permissions" entry to Project Settings sidebar + page with toggle list.

## Key Insights

- Project sidebar entries defined in `packages/constants/src/settings/project.ts`. Add new key `field-permissions`, access = `[ADMIN]`.
- `TProjectSettingsTabs` (or equivalent union) must include `"field-permissions"`.
- Page directory: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/field-permissions/` with `page.tsx` + `header.tsx`.
- Toggle UI = `Switch` from `@plane/propel/switch`.
- Editor visibility: sidebar entry shown when user is project ADMIN. Workspace Admin should ALSO see it; rely on Plane's permission helper that auto-elevates workspace admins to project-admin level in UI (verify; otherwise OR-check both levels).

## Requirements

- Functional:
  - List 4 toggles with description + state from store
  - Switch toggles call `updatePermissions(slug, projectId, { [key]: !current })` → optimistic update + toast
  - Non-admins see read-only state (no switch interaction); page itself gated by `access: [ADMIN]` so members don't see link
- Non-functional: <150 lines per file; i18n keys for all visible text.

## Architecture

```
page.tsx (observer)
 └─ <FieldPermissionList projectId={...}>
     ├─ <FieldPermissionRow key="completed_date" />
     ├─ <FieldPermissionRow key="target_date" />
     ├─ <FieldPermissionRow key="start_date" />
     └─ <FieldPermissionRow key="delete_work_item" />
```

## Related Code Files

**Create**

- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/field-permissions/page.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/field-permissions/header.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/field-permissions/components/field-permission-row.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/field-permissions/components/field-permission-list.tsx`

**Modify**

- `packages/types/src/settings.ts` (or wherever `TProjectSettingsTabs` lives) — add `"field-permissions"`
- `packages/constants/src/settings/project.ts` — add sidebar entry (i18n_label, href, access `[ADMIN]`, highlight regex)

## Implementation Steps

1. Extend project settings tabs union with `"field-permissions"`.
2. Add entry in `packages/constants/src/settings/project.ts` (i18n_label `project_settings.settings.field_permissions.title`, href `/settings/projects/[projectId]/field-permissions`, access `[ADMIN]`, highlight regex).
3. Create page directory mirroring `workflows/`:
   - `header.tsx` exports `FieldPermissionsHeader`
   - `page.tsx` `observer`, uses `useProjectFieldPermission()` + `useSWR` for fetch (key includes slug+projectId), renders `<FieldPermissionList>`
4. `field-permission-row.tsx`: props `{ titleKey, descriptionKey, value, disabled, onToggle }`; renders `Switch` with `bg-layer-2` row container.
5. `field-permission-list.tsx`: maps 4 keys → rows.
6. Use `SettingsContentWrapper` + `PageHead` for consistency.

## Todo List

- [ ] Type union update
- [ ] Sidebar constant entry
- [ ] page.tsx (<100 lines)
- [ ] header.tsx
- [ ] field-permission-list.tsx
- [ ] field-permission-row.tsx
- [ ] Verify sidebar shows entry for project admin AND workspace admin
- [ ] Verify toggle flow end-to-end

## Success Criteria

- Sidebar entry visible only to admins (project or workspace)
- Toggles persist + reflect across reloads
- Toast on success/error
- All strings via `t()`

## Risk Assessment

- **R:** Forgetting type union update → TS error at constants. Mitigation: TS will block compile.
- **R:** Member directly navigating to URL. Mitigation: page-level guard via `useUserPermissions()` redirect or render-empty.
- **R:** Workspace Admin not seeing entry if sidebar only checks PROJECT-level role. Mitigation: ensure sidebar access check ORs PROJECT-admin and WORKSPACE-admin (follow existing pattern from `workflows`/`members` settings).

## Security Considerations

- Backend is authoritative; UI gate is convenience.

## Next Steps

- Phase 05 (Form gating)
