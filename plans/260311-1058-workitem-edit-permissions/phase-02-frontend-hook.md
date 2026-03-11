# Phase 02: Frontend Permission Hook

## Overview

Create a reusable `useCanEditIssue` hook that computes edit permission based on user role, issue ownership, and assignee status.

## Context

- Current approach: `allowPermissions([ADMIN, MEMBER], PROJECT)` -- purely role-based
- Need: also check `issue.created_by === currentUser.id` or `issue.assignee_ids.includes(currentUser.id)`
- Issue data available via `useIssueDetail().issue.getIssueById(issueId)`
- Current user ID available via `useUser().data?.id`

## Key Insight

The existing `allowPermissions` only checks role membership. We need a thin wrapper that also considers issue-level ownership. We keep `allowPermissions` for admin check and add creator/assignee checks on top.

## Implementation Steps

### 1. Create hook file

File: `apps/web/ce/hooks/use-can-edit-issue.ts`

```typescript
import { useCallback } from "react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser } from "@/hooks/store/user/user-user";
import { useUserPermissions } from "@/hooks/store/user";

/**
 * Returns whether the current user can edit the given issue.
 * Allowed: workspace admin, project admin, issue creator, issue assignee.
 */
export const useCanEditIssue = (issueId: string | undefined, workspaceSlug?: string, projectId?: string): boolean => {
  const { allowPermissions } = useUserPermissions();
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  // Admin check (workspace admin treated as project admin by allowPermissions)
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);

  if (isAdmin) return true;

  if (!issueId || !currentUser?.id) return false;

  const issue = getIssueById(issueId);
  if (!issue) return false;

  // Creator check
  if (issue.created_by === currentUser.id) return true;

  // Assignee check
  if (issue.assignee_ids?.includes(currentUser.id)) return true;

  return false;
};
```

### 2. Export from CE hooks index

File: `apps/web/ce/hooks/index.ts` (or wherever CE hooks are exported)

Add: `export { useCanEditIssue } from "./use-can-edit-issue";`

## Architecture Notes

- Hook is in `ce/` per CE pattern rules
- No core modifications needed
- Hook uses existing stores -- no new API calls
- Returns `false` when issue not yet loaded (safe default = read-only until data arrives)

## Todo

- [x] Create `apps/web/ce/hooks/use-can-edit-issue.ts`
- [x] Export from CE hooks index
- [x] Verify `issue.assignee_ids` is populated in issue detail store
- [x] Test: admin user returns true regardless of ownership
- [x] Test: creator returns true when not admin
- [x] Test: assignee returns true when not admin/creator
- [x] Test: random member returns false

## Success Criteria

- Hook returns `true` for admins, creators, assignees
- Hook returns `false` for non-authorized members
- Hook returns `false` when issue data not yet loaded (no flicker of editable state)
- No new API calls -- pure client-side computation

## Related Files

| File                                      | Change   |
| ----------------------------------------- | -------- |
| `apps/web/ce/hooks/use-can-edit-issue.ts` | New file |
| `apps/web/ce/hooks/index.ts`              | Export   |

## Next Steps

Phase 03 wires this hook into issue detail and peek overview components.
