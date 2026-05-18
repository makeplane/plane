# Phase 03 — Frontend: Copy-to-Workspace Modal + Menu Item

## Overview

- **Priority:** P1 (blocked by Phase 04)
- **Status:** complete
- **Effort:** 4h
- **Description:** Add menu entry "Copy to Workspace" in project actions menu and a CE modal for picking target workspace + identifier.

## Context Links

- Menu file: `apps/web/core/components/navigation/project-actions-menu.tsx` (line 76–81 has Copy Link)
- CE modal pattern: `apps/web/ce/components/issues/worklog/worklog-modal.tsx`
- CE modal pattern: `apps/web/ce/components/workspace/members/invite-modal.tsx`
- Frontend rules: `.claude/rules/plane-design-system.md`, `component-libraries.md`, `dialogs-modals.md`, `forms-inputs.md`, `i18n-rules.md`, `color-tokens.md`

## Requirements

### Functional

- New `CustomMenu.MenuItem` "Copy to Workspace" placed directly below "Copy Link" in `ProjectActionsMenu`
- Visible only when `isAdmin === true`
- Click opens `CopyProjectModal` (CE component, mounted from same parent that mounts `ProjectActionsMenu`)
- Modal contains:
  - Target workspace `<select>` (Propel combobox-style or `CustomSearchSelect`) — list from admin-workspaces endpoint, excludes source
  - Target name `<input>` (default `{currentProjectName} (copy)`)
  - Target identifier `<input>` (uppercase, max 12, regex `^[A-Z0-9]+$`) — defaults to source identifier
  - Inline error on identifier conflict (409 from API)
  - Submit button: "Start Copy"
  - Cancel button
- On submit success: toast "Copy started" + close modal + start polling (delegated to store via Phase 04)
- On poll-completed: toast "Project copied" + offer "Open project" link
- On poll-failed: error toast with `job.error`

### Non-Functional

- Modal: web app uses Headlessui (per `dialogs-modals.md` Pattern B) → use `ModalCore` from `@plane/ui` (existing project pattern, see `worklog-modal.tsx`)
- All strings via `t()`
- All colors via semantic tokens (`bg-layer-2` on inputs, `text-primary`, `border-subtle`)
- File <150 lines (split sub-form into helper if needed)
- `observer()` wrapper for MobX reads

## Architecture

### Component tree

```
ProjectActionsMenu (modified — adds menu item + boolean state)
└── CopyProjectModal (NEW, CE)
    ├── WorkspacePicker (Propel combobox or CustomSearchSelect)
    ├── NameInput (Propel Input)
    ├── IdentifierInput (Propel Input, uppercase, regex)
    └── Footer (Cancel + Submit Button)
```

### State flow (modal-local)

```typescript
const { control, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
  defaultValues: { targetWorkspaceSlug: "", targetName: `${project.name} (copy)`, targetIdentifier: project.identifier },
});

const { startCopy, adminWorkspaces, fetchAdminWorkspaces } = useProjectCopy();

const onSubmit = async (data: FormData) => {
  try {
    await startCopy(workspaceSlug, project.id, data);
    setToast({ type: SUCCESS, title: t("project_copy.toast.started_title"), message: t("project_copy.toast.started_message") });
    handleClose();
  } catch (err) {
    if (err?.status === 409) {
      setError("targetIdentifier", { message: t("project_copy.error.identifier_taken") });
      return;
    }
    setToast({ type: ERROR, title: t("project_copy.toast.failed_title") });
  }
};
```

### Props contract

```typescript
type CopyProjectModalProps = {
  isOpen: boolean;
  handleClose: () => void;
  workspaceSlug: string;
  project: { id: string; name: string; identifier: string };
};
```

### Menu item insertion (project-actions-menu.tsx)

After line 81 (`</CustomMenu.MenuItem>` for Copy Link), insert:

```tsx
{isAdmin && (
  <CustomMenu.MenuItem onClick={onCopyToWorkspace}>
    <span className="flex items-center justify-start gap-2">
      <CopyIcon className="h-3.5 w-3.5 stroke-[1.5]" />
      <span>{t("project_copy.menu.copy_to_workspace")}</span>
    </span>
  </CustomMenu.MenuItem>
)}
```

Add `onCopyToWorkspace: () => void` to Props.

## Related Code Files

### To Create

- `apps/web/ce/components/projects/copy-project-modal.tsx` — main modal (CE)
- `apps/web/ce/components/projects/copy-project-modal-form.tsx` — form body (split if >150L)
- `apps/web/ce/components/projects/copy-project-workspace-picker.tsx` — workspace combobox

### To Modify

- `apps/web/core/components/navigation/project-actions-menu.tsx` — add menu item + `onCopyToWorkspace` prop
- Parent of `ProjectActionsMenu` (find via grep: `apps/web/core/components/workspace/sidebar/projects-list-item.tsx` likely) — mount `CopyProjectModal` and pass `onCopyToWorkspace` handler

### To Read for Context

- `apps/web/ce/components/issues/worklog/worklog-modal.tsx` — modal shape
- `apps/web/ce/components/workspace/members/invite-modal.tsx` — picker shape
- `apps/web/core/components/dropdowns/` — check for existing WorkspacePicker/WorkspaceDropdown before building new

## Implementation Steps

1. Grep `apps/web/core/components/dropdowns/` for existing workspace picker — reuse if exists; otherwise small Propel combobox
2. Locate parent component that renders `ProjectActionsMenu` to know where to mount modal
3. Create `copy-project-modal.tsx` skeleton with `ModalCore` (from `@plane/ui`) + react-hook-form
4. Add identifier input with uppercase transform + regex validation (`pattern: /^[A-Z0-9]{1,12}$/`)
5. Add name input + workspace picker
6. Wire submit to `useProjectCopy().startCopy` (Phase 04 store hook)
7. Handle 409 inline error
8. Modify `project-actions-menu.tsx`: add `CopyIcon` import (lucide `Copy`), add `onCopyToWorkspace` prop, add menu item below Copy Link
9. Modify parent: add `isCopyModalOpen` state + mount modal + pass `onCopyToWorkspace={() => setIsCopyModalOpen(true)}`
10. Smoke-test in dev: menu shows, modal opens, identifier validation works locally

## Todo List

- [x] Grep for existing workspace picker
- [x] Locate parent mounting `ProjectActionsMenu`
- [x] Create `copy-project-modal.tsx`
- [x] Create `copy-project-modal-form.tsx` if needed
- [x] Create `copy-project-workspace-picker.tsx` if no reuse
- [x] Add menu item in `project-actions-menu.tsx`
- [x] Mount modal in parent
- [x] `pnpm check:lint` clean
- [x] `pnpm check:format` clean

## Success Criteria

- Menu item visible only for admins
- Clicking menu opens modal with defaults pre-filled
- Identifier auto-uppercases on type
- Submit disabled while loading
- 409 surfaces inline error without closing modal
- Successful submit closes modal and shows toast

## Risk Assessment

| Risk | Mitigation |
|---|---|
| `ProjectActionsMenu` consumed by multiple parents | Add modal mount only at the project list usage; or hoist to a shared container |
| `isAdmin` prop already false for non-admin paths | Re-verify upstream; menu item gated on `isAdmin` |
| `react-hook-form` regex validation differs from server | Use one shared constant `PROJECT_IDENTIFIER_REGEX` (export from `@plane/constants`) |
| Modal closed mid-copy loses job_id | Phase 04 store persists job_id; modal close does not cancel polling |

## Security Considerations

- Menu visibility gated on `isAdmin`; server re-validates (defense in depth)
- No PII rendered; only project + workspace names

## Next Steps

- Phase 05 finalizes i18n keys
