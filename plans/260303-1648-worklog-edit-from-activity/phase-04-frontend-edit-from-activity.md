# Phase 04: Frontend — Edit Worklog from Activity Click

## Context Links

- Target file: `apps/web/ce/components/issues/worklog/activity/root.tsx`
- Modal: `apps/web/ce/components/issues/worklog/worklog-modal.tsx`
- Create button pattern: `apps/web/ce/components/issues/worklog/activity/worklog-create-button.tsx`
- Worklog types: `packages/types/src/worklog.ts`
- Previous phase file: [phase-01 (original)](./phase-01-add-edit-click-to-activity.md)

## Overview

- **Priority**: P2
- **Status**: Pending
- **Description**: Add onClick handler + WorklogModal to IssueActivityWorklog so users can click to edit worklogs. Depends on Phase 1 (backend permissions verified).

## Key Insights

- `WorklogModal` already accepts `existingWorklog?: IWorkLog` prop for edit mode
- `worklog-create-button.tsx` shows exact pattern: `useState(false)` + render `<WorklogModal>`
- `useUserPermissions()` returns `{ allowPermissions }` function
- Must grep existing edit-on-click patterns first (validation decision)
- Backend PATCH must be admin-only (verified in Phase 1)

## Permission Rules

- **Edit/Delete**: Only **Project admin**

## Requirements

- Clicking worklog activity entry opens WorklogModal in edit mode
- Only clickable if current user is **Project admin**
- Visual hint matching existing codebase patterns (determined by grep)
- Keyboard accessible (Enter/Space)

## Related Code Files

- **Modify**: `apps/web/ce/components/issues/worklog/activity/root.tsx`
- No new files needed

## Embedded Rules

- `observer()` on all MobX-reading components (already present)
- Use `@plane/propel/*` for UI components
- Semantic color tokens only
- Keep file under 200 lines
- Match existing edit-on-click patterns in codebase

## Implementation Steps

### 1. Grep existing edit-on-click patterns

Search codebase for similar patterns where items become clickable to edit:

- Activity items with edit actions
- Inline edit triggers in lists/tables
- How hover states and cursors are applied

### 2. Add imports

```tsx
import { useState } from "react";
import { Pencil } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
import { WorklogModal } from "../worklog-modal";
```

### 3. Add state and permission logic

```tsx
const { allowPermissions } = useUserPermissions();
const [isEditModalOpen, setIsEditModalOpen] = useState(false);

const canEdit = !!(
  worklog && allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId)
);
```

### 4. Add click handler and visual hint

Apply pattern found in Step 1. Default plan:

- `onClick` + `cursor-pointer` + hover styling when `canEdit`
- Pencil icon on hover (admin only)
- `role="button"` + `tabIndex={0}` + `onKeyDown` for a11y

### 5. Render WorklogModal

```tsx
{
  canEdit && (
    <WorklogModal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      existingWorklog={worklog}
    />
  );
}
```

### 6. Wrap return in fragment

Wrap `<div>` + `<WorklogModal>` in `<>...</>`.

## Post-Phase Checklist

- [ ] `observer()` wrapper preserved
- [ ] File under 200 lines
- [ ] Semantic color tokens only
- [ ] Permission: Project admin only
- [ ] Pencil icon on hover (or matching pattern)
- [ ] Click handler only when `canEdit`
- [ ] Keyboard accessible
- [ ] No TypeScript errors
- [ ] Matches existing edit-on-click patterns in codebase

## Todo List

- [ ] Grep existing edit patterns in codebase
- [ ] Add imports
- [ ] Add state + admin permission logic
- [ ] Add click handler + visual hint
- [ ] Render WorklogModal
- [ ] Run lint check
- [ ] Manual test: admin clicks → modal opens in edit mode
- [ ] Manual test: member clicks → nothing happens

## Success Criteria

- Admin clicks worklog → edit modal opens
- Non-admin sees no change
- Edit saves correctly via WorklogModal + store
- UX consistent with other editable items in codebase
