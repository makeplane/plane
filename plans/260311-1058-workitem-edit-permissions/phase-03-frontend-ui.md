# Phase 03: Frontend UI Enforcement

## Overview

Replace role-only `isEditable` with the new `useCanEditIssue` hook in issue detail and peek overview components.

## Context

- `issue-detail/root.tsx` line 221: `const isEditable = allowPermissions([ADMIN, MEMBER], PROJECT, ...)`
- `peek-overview/root.tsx` line 231: same pattern
- Both pass `isEditable` to `IssueMainContent` and `IssueDetailsSidebar`
- All downstream components already respect `isEditable`/`disabled` props -- no changes needed

## Implementation Steps

### 1. Update Issue Detail Root

File: `apps/web/core/components/issues/issue-detail/root.tsx`

Replace lines 221-226:

```typescript
// OLD
const isEditable = allowPermissions(
  [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  EUserPermissionsLevel.PROJECT,
  workspaceSlug,
  projectId
);
```

With:

```typescript
// NEW
import { useCanEditIssue } from "@/plane-web/hooks/use-can-edit-issue";
// ...
const isEditable = useCanEditIssue(issueId, workspaceSlug, projectId);
```

Note: `allowPermissions` import and `useUserPermissions` hook can be removed if no longer used in this component (check if used elsewhere in the file).

### 2. Update Peek Overview Root

File: `apps/web/core/components/issues/peek-overview/root.tsx`

Same pattern -- find the `isEditable` computation and replace with `useCanEditIssue`.

The peek overview uses `peekIssue?.issueId`, `peekIssue?.workspaceSlug`, `peekIssue?.projectId`.

```typescript
import { useCanEditIssue } from "@/plane-web/hooks/use-can-edit-issue";
// ...
const isEditable = useCanEditIssue(peekIssue?.issueId, peekIssue?.workspaceSlug, peekIssue?.projectId);
```

### 3. Verify downstream components

These already accept and respect `isEditable` prop:

- `IssueMainContent` -- disables title, description, type switcher
- `IssueDetailsSidebar` -- disables all property dropdowns (state, priority, assignees, labels, dates, etc.)
- All use `disabled={!isEditable}` pattern

No changes needed in downstream.

### 4. Handle edge cases

- **Archived issues**: `issue-detail/root.tsx` line 261 already does `isEditable={!is_archived && isEditable}`. This continues to work.
- **Loading state**: `useCanEditIssue` returns `false` when issue not loaded. This means UI starts read-only and becomes editable once data loads. This is acceptable UX (better than flash of editable → read-only).

## Todo

- [x] Import `useCanEditIssue` in `issue-detail/root.tsx`
- [x] Replace `isEditable` computation in `issue-detail/root.tsx`
- [x] Remove unused `allowPermissions`/`useUserPermissions` import if applicable
- [x] Import `useCanEditIssue` in `peek-overview/root.tsx`
- [x] Replace `isEditable` computation in `peek-overview/root.tsx`
- [x] Manual test: admin can edit any issue
- [x] Manual test: creator can edit their issue
- [x] Manual test: assignee can edit assigned issue
- [x] Manual test: regular member sees read-only
- [x] Manual test: archived issue stays read-only regardless
- [x] Run `pnpm check:lint` on modified files

## Success Criteria

- Issue detail shows editable fields for authorized users
- Issue detail shows read-only fields for unauthorized users
- Peek overview follows same behavior
- No console errors or TypeScript errors
- Lint passes

## Related Files

| File                                                     | Change                           |
| -------------------------------------------------------- | -------------------------------- |
| `apps/web/core/components/issues/issue-detail/root.tsx`  | Replace `isEditable` computation |
| `apps/web/core/components/issues/peek-overview/root.tsx` | Replace `isEditable` computation |

## Next Steps

After all 3 phases complete:

- Run backend tests: `cd apps/api && python run_tests.py`
- Run frontend lint: `pnpm check:lint`
- Manual E2E testing with different user roles
- Code review via `code-reviewer` agent
