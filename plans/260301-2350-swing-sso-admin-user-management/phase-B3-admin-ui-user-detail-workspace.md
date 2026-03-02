# Phase B3: Admin UI — User Detail & Workspace Assignment

## Context Links

- [Workspace list page (reference)](<../../apps/admin/app/(all)/(dashboard)/workspace/page.tsx>)
- [User store](./phase-B2-admin-ui-user-list-create.md) (Phase B2)
- [Backend user APIs](./phase-B1-backend-user-apis.md) (Phase B1)

## Overview

- **Priority:** P2
- **Status:** pending
- **Description:** User detail page showing info + workspace memberships, and dialog to add user to workspace with role selection

## Key Insights

- User detail fetches from `GET /api/instances/users/<id>/` — returns user fields + `workspaces[]` array
- Add to workspace: dialog with workspace selector (dropdown of all workspaces) + role picker
- Workspace list already available via `InstanceWorkspaceService.list()` from existing workspace store
- Role options: Admin (20), Member (15), Guest (5)

## Requirements

**Functional:**

- `/users/:id` page: display user info (name, email, active status, joined date)
- Workspace memberships table: workspace name, slug, role, joined date
- "Add to Workspace" button → opens dialog
- Dialog: workspace dropdown (searchable) + role selector + confirm
- Edit user fields inline or via edit mode (first_name, last_name, is_active toggle)
<!-- Updated: Validation Session 3 - Reset password auto-generates, hardcode English -->
- "Reset Password" button → confirm dialog → `POST /api/instances/users/<id>/reset-password/` (no body) → backend generates random password → display generated password with copy button

**Non-functional:**

- Components under 150 lines
- Propel components for dialog, button, input
- Semantic color tokens
- Hardcode English strings (admin app does not use i18n)

## Architecture

```
apps/admin/
├── app/(all)/(dashboard)/users/
│   └── [id]/
│       └── page.tsx                    # User detail page
├── components/users/
│   ├── user-detail-info.tsx            # User info card
│   ├── user-workspace-list.tsx         # Workspace memberships table
│   ├── add-to-workspace-dialog.tsx     # Add to workspace modal
│   └── reset-password-dialog.tsx       # Reset password modal
```

## Related Code Files

**Files to create:**

- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/users/[id]/page.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/components/users/user-detail-info.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/components/users/user-workspace-list.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/components/users/add-to-workspace-dialog.tsx`

**Files to modify:**

- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/routes.ts` — add user detail route
- `/Volumes/Data/SHBVN/plane.so/apps/admin/store/user.store.ts` — add `updateUser`, `addToWorkspace` actions

## Implementation Steps

### Step 1: Add route for user detail

In `routes.ts`:

```typescript
route("users/:id", "./(all)/(dashboard)/users/[id]/page.tsx"),
```

### Step 2: Add store actions

In `user.store.ts`, add:

```typescript
updateUser = async (userId: string, data: Partial<IInstanceUser>): Promise<IInstanceUser> => {
  const user = await this.service.update(userId, data);
  runInAction(() => {
    set(this.users, user.id, user);
  });
  return user;
};

addUserToWorkspace = async (userId: string, workspaceId: string, role: number): Promise<any> => {
  const result = await this.service.addToWorkspace(userId, { workspace_id: workspaceId, role });
  // Refresh user detail to get updated workspace list
  await this.fetchUserDetail(userId);
  return result;
};
```

### Step 3: Create user detail page (`users/[id]/page.tsx`)

```typescript
// apps/admin/app/(all)/(dashboard)/users/[id]/page.tsx
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { UserDetailInfo } from "@/components/users/user-detail-info";
import { UserWorkspaceList } from "@/components/users/user-workspace-list";
import { AddToWorkspaceDialog } from "@/components/users/add-to-workspace-dialog";
// hooks — access user store

function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showAddDialog, setShowAddDialog] = useState(false);
  // Fetch user detail on mount
  // Render: UserDetailInfo + UserWorkspaceList + "Add to Workspace" button
  // AddToWorkspaceDialog controlled by showAddDialog state
}

export default observer(UserDetailPage);
```

### Step 4: Create user detail info component (`user-detail-info.tsx`)

```typescript
// Display: avatar (or initials), first_name, last_name, email
// Active status toggle (calls updateUser)
// Date joined, last login
// Edit button for name fields (inline edit or modal)
// Uses propel components: Button, Input, Badge
```

Key fields:

- Name: `{first_name} {last_name}` — editable
- Email: read-only (displayed, not editable)
- Status: `ToggleSwitch` for `is_active` — calls `updateUser(id, { is_active })`
- Dates: `date_joined`, `last_login` — formatted

### Step 5: Create workspace list component (`user-workspace-list.tsx`)

```typescript
// Table/list of workspace memberships
// Columns: Workspace Name, Slug, Role (badge), Joined Date
// Role badges: Admin (purple), Member (blue), Guest (gray)
// Empty state: "Not a member of any workspace"
```

### Step 6: Create add to workspace dialog (`add-to-workspace-dialog.tsx`)

```typescript
// apps/admin/components/users/add-to-workspace-dialog.tsx
import { useState } from "react";
import { observer } from "mobx-react";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";

// Props: { open, onClose, userId, onSuccess }
// State: selectedWorkspaceId, selectedRole, isSubmitting
//
// Workspace selector: dropdown/combobox of all workspaces
//   - Fetch from workspace store (existing)
//   - Filter out workspaces user is already a member of
//
// Role selector: radio or dropdown
//   - Admin (20), Member (15), Guest (5)
//   - Default: Member (15)
//
// Submit: addUserToWorkspace(userId, workspaceId, role)
//   - Success: toast + close + refresh
//   - Error: toast error

// Dialog structure:
// <Dialog open={open} onClose={onClose} modal>
//   <Dialog.Panel width={EDialogWidth.MD}>
//     <Dialog.Title>Add to Workspace</Dialog.Title>
//     <div className="p-5 space-y-4">
//       {/* Workspace selector */}
//       {/* Role selector */}
//     </div>
//     <div className="flex justify-end gap-2 p-4 border-t border-color-subtle">
//       <Button variant="secondary" onClick={onClose}>Cancel</Button>
//       <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>Add</Button>
//     </div>
//   </Dialog.Panel>
// </Dialog>
```

### ~~Step 7: Add i18n translations~~ (REMOVED — Validation Session 3)

Admin app hardcodes English strings. No translation keys needed.

## Todo List

- [ ] Add user detail route to `routes.ts`
- [ ] Add `updateUser` and `addUserToWorkspace` to user store
- [ ] Create `users/[id]/page.tsx` — detail page
- [ ] Create `user-detail-info.tsx` — info card with edit
- [ ] Create `user-workspace-list.tsx` — memberships table
- [ ] Create `add-to-workspace-dialog.tsx` — workspace + role selection
- [ ] ~~Add i18n translations~~ (REMOVED — hardcode English)
- [ ] Create `reset-password-dialog.tsx` — confirm → API call → display generated password with copy button
- [ ] Verify all components under 150 lines

## Success Criteria

- `/users/:id` displays user info and workspace memberships
- Active status toggle works (API call + UI update)
- "Add to Workspace" dialog shows available workspaces
- Role selection works (Admin/Member/Guest)
- Adding to workspace → toast + list updates
- Duplicate membership → error toast
- Navigation: list → detail → back to list

## Risk Assessment

- **Workspace selector**: need all workspaces loaded — may need to fetch if not in store. Workspace store `fetchWorkspaces()` already exists.
- **Dynamic route**: verify React Router v7 param pattern `[id]` or `:id` in admin app (check existing patterns)
- **User detail refresh**: after adding to workspace, re-fetch user detail to get updated `workspaces` array

## Security Considerations

- All endpoints admin-only
- Cannot change user email (prevent impersonation)
- Role assignment validated by backend (only 5, 15, 20)
- Cannot add self to workspace through this flow (no functional issue, but noted)

## Next Steps

- Plan A + Plan B complete — proceed to implementation
