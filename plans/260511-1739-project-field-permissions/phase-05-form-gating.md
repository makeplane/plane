# Phase 05 — Work Item Form Enforcement

## Context Links

- CE sidebar properties: `apps/web/ce/components/issues/issue-details/sidebar/`
  - `completed-at-property.tsx`
  - `due-date-property.tsx`
- Hook to use: `useProjectFieldPermission()` (Phase 03)
- Permission hook reference: `useUserPermissions(projectId)` (memory)

## Overview

Priority: P2 | Status: pending
Disable/hide locked inputs and delete actions for non-admin users on work item forms.

<!-- Updated: Validation Session 1 -->

**Decisions applied:**

- Locked UX = **read-only text + tooltip** "Locked by project admin" (Validation #6).
- start_date gating = **CE wrapper override** if input lives in core/, no core/ edits (Validation #5).
- Lock semantics for date fields = **Empty→Value allowed; Value→Value blocked** (Validation #7). Frontend must mirror: render editable picker when current value is null even for locked members; render read-only once value exists.

## Key Insights

- Three date pickers live in CE already (`completed-at-property.tsx`, `due-date-property.tsx`, and start-date variant). Each must check toggle + role.
- Delete action button — locate in work item action menus (sidebar/peek/list quick actions).
- Pattern: compute `isLocked = !isAdmin && !canMemberAction(slug, projectId, key)` → pass `disabled` prop OR conditionally render read-only display.
- Admin check must OR project-admin AND workspace-admin (workspace admins should never be gated).
- DO NOT touch `apps/web/core/` except hook files. All gating logic stays in CE components (memory rule).

## Requirements

- Functional:
  - Locked date field → renders read-only text — no DateDropdown trigger
  - Locked delete → hide menu item entirely
  - Hover tooltip on read-only date field: "Locked by project admin"
- Non-functional: no flash of editable state during load.

## Architecture

```
DateProperty (CE)
 ├─ useProjectFieldPermission() → canMemberAction(slug, projectId, "target_date")
 ├─ useUserPermissions(projectId) → isProjectAdmin || isWorkspaceAdmin
 └─ isEditable = isAdmin || canMember
```

## Related Code Files

**Create**

- `apps/web/ce/hooks/use-work-item-field-lock.ts` — small hook returning `{ isLocked, lockReasonKey }` per field key; deduplicates check logic

**Modify** (CE only — no core/ edits)

- `apps/web/ce/components/issues/issue-details/sidebar/completed-at-property.tsx`
- `apps/web/ce/components/issues/issue-details/sidebar/due-date-property.tsx`
- `apps/web/ce/components/issues/issue-details/sidebar/` — locate start_date property (may live in core; if so, mirror via CE wrapper rather than edit core)
- CE quick-actions / delete trigger for work item (`apps/web/ce/components/issues/...` — locate via grep)

## Implementation Steps

1. Create `use-work-item-field-lock.ts`:
   ```ts
   // currentValue param supports the Empty→Value-allowed rule (Validation #7).
   // For delete action, pass currentValue=undefined; isLocked is then a pure role/toggle check.
   export const useWorkItemFieldLock = (fieldKey: EProjectFieldPermissionKey, currentValue?: unknown) => {
     const { workspaceSlug, projectId } = useParams();
     const { canMemberAction } = useProjectFieldPermission();
     const { allowPermissions } = useUserPermissions();
     const isProjectAdmin = allowPermissions(
       [EUserPermissions.ADMIN],
       EUserPermissionsLevel.PROJECT,
       workspaceSlug,
       projectId
     );
     const isWorkspaceAdmin = allowPermissions(
       [EUserPermissions.ADMIN],
       EUserPermissionsLevel.WORKSPACE,
       workspaceSlug
     );
     const isAdmin = isProjectAdmin || isWorkspaceAdmin;
     const canMember = canMemberAction(workspaceSlug, projectId, fieldKey);
     const isDateField = fieldKey !== "delete_work_item";
     // Empty→Value allowed: members may set when current is null/undefined.
     const allowFillEmpty = isDateField && (currentValue === null || currentValue === undefined);
     return { isLocked: !isAdmin && !canMember && !allowFillEmpty };
   };
   ```
2. In each CE date property: pass current value into hook (`useWorkItemFieldLock(key, issue.<field>)`); when `isLocked`, render value as read-only text with tooltip key `project_settings.field_permissions.locked_tooltip`. When value is null and member is not admin → render editable picker (Empty→Value allowed).
3. Locate delete trigger (grep `confirm.*delete.*issue` in `ce/components/issues/`); guard with `useWorkItemFieldLock("delete_work_item")`.
4. Trigger initial fetch of permissions on project mount (call from project layout-level hook so it's available before issue details render). Reuse pattern from `useWorkflow` initial fetch.

## Todo List

- [ ] `use-work-item-field-lock.ts`
- [ ] Gate `completed-at-property.tsx`
- [ ] Gate `due-date-property.tsx`
- [ ] Gate start_date property
- [ ] Gate delete action(s)
- [ ] Initial permission fetch on project layout
- [ ] Manual test all 4 toggle states × admin/member

## Success Criteria

- Member with locked toggle cannot trigger DateDropdown
- Member with unlocked toggle CAN edit
- Project Admin OR Workspace Admin always edits regardless of toggle
- Delete menu item hidden for member when locked
- No console errors during project switch

## Risk Assessment

- **R:** start_date property may live in `core/` — cannot modify per memory. Mitigation: if so, create CE wrapper component and override via existing CE component map (mirror `CompletedAtProperty` override). If no override mechanism exists, escalate to user.
- **R:** Stale permission cache after admin toggle. Mitigation: store update mutates ObservableMap → all consumers re-render automatically.

## Security Considerations

- UI gate only; server enforces. Avoid leaking permission row to non-admins beyond the 4 booleans (already minimal).

## Next Steps

- Phase 06 (i18n + tests)
