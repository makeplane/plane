---
title: "Work Item Edit Permission Restrictions"
description: "Restrict work item modifications to workspace admins, project admins, item creators, and assignees"
status: completed
priority: P1
effort: 6h
branch: ngoc-feat/workspaces
tags: [permissions, issues, backend, frontend]
created: 2026-03-11
---

# Work Item Edit Permission Restrictions

## Problem

Currently any project MEMBER can edit any issue in a project. Need to restrict so only:

1. Workspace admins (role >= 20)
2. Project admins (role = 20)
3. Issue creator (`created_by`)
4. Issue assignees (`IssueAssignee`)

Others get 403 on backend, read-only UI on frontend.

## Current State

### Backend

- `IssueViewSet.partial_update` uses `@allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue)` (line 627 of `base.py`)
- The `allow_permission` decorator already supports `creator=True` which checks `Issue.created_by == request.user`
- But it does NOT check assignees -- a regular MEMBER who is not creator can still edit
- Role constants: ADMIN=20, MEMBER=15, GUEST=5 (same in workspace and project)
- `allow_permission` also grants access if user is workspace ADMIN + project member (lines 53-67 of `base.py`)

### Frontend

- `isEditable` computed via `allowPermissions([ADMIN, MEMBER], PROJECT)` in `issue-detail/root.tsx` (line 221) and `peek-overview/root.tsx` (line 231)
- `isEditable` boolean passed down to `IssueMainContent` and `IssueDetailsSidebar` which disable all fields when false
- Issue object has `created_by` (user ID string) and `assignee_ids` available
- Current user accessible via `useUser()` hook from `@/hooks/store/user/user-user.ts`

## Architecture

### Phase 1: Backend Permission Layer (~2h)

- Modify `allow_permission` decorator to support `assignee=True` parameter
- When `assignee=True`, check `IssueAssignee.objects.filter(issue_id=pk, assignee=request.user).exists()`
- Update `partial_update` decorator: `@allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, assignee=True, model=Issue)`
- This means: ADMIN role passes, OR creator passes, OR assignee passes
- Workspace admin fallback already handled by decorator (lines 53-67)

### Phase 2: Frontend Permission Hook (~2h)

- Create `useCanEditIssue` hook in `apps/web/ce/hooks/use-can-edit-issue.ts`
- Logic: check if user is workspace admin, project admin, issue creator, or assignee
- Returns boolean `canEdit`
- Uses existing `useUserPermissions`, `useUser`, and issue data from store

### Phase 3: Frontend UI Enforcement (~2h)

- Replace `isEditable` computation in `issue-detail/root.tsx` and `peek-overview/root.tsx`
- Use new `useCanEditIssue(issueId)` hook instead of role-only `allowPermissions`
- All downstream components already accept `isEditable` prop -- no changes needed there

## Phases

- [Phase 01: Backend Permission Layer](./phase-01-backend-permission.md)
- [Phase 02: Frontend Permission Hook](./phase-02-frontend-hook.md)
- [Phase 03: Frontend UI Enforcement](./phase-03-frontend-ui.md)

## Key Files

| File                                                     | Purpose                                    |
| -------------------------------------------------------- | ------------------------------------------ |
| `apps/api/plane/app/permissions/base.py`                 | `allow_permission` decorator + `ROLE` enum |
| `apps/api/plane/app/views/issue/base.py`                 | `IssueViewSet.partial_update` (line 627)   |
| `apps/web/core/components/issues/issue-detail/root.tsx`  | Issue detail `isEditable` (line 221)       |
| `apps/web/core/components/issues/peek-overview/root.tsx` | Peek overview `isEditable` (line 231)      |
| `apps/web/core/store/user/base-permissions.store.ts`     | `allowPermissions` method                  |
| `apps/web/core/hooks/store/user/user-user.ts`            | `useUser` hook for current user ID         |

## Risk Assessment

- **Low**: Backend change is additive (new `assignee` param) -- existing decorators unaffected
- **Medium**: Frontend hook needs issue data loaded before computing permissions -- must handle loading state
- **Low**: Downstream components already use `isEditable` prop pattern, no cascading changes

## Unresolved Questions

1. Should assignee check apply to `destroy` too? Currently `@allow_permission([ROLE.ADMIN], creator=True, model=Issue)` -- only ADMIN or creator can delete. Recommend keeping as-is.
2. Should inline edits in list/kanban views also be gated? Currently those use different code paths (quick-add, drag-drop). Recommend Phase 3 scope covers detail/peek only; list views can be a follow-up.
3. Should the API return `can_edit` field in issue responses for frontend convenience? Recommend no -- compute client-side to avoid N+1 queries on list endpoints.

## Validation Log

### Session 1 — 2026-03-11

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Breaking Change]** Phase 1 removes MEMBER from partial_update allowed_roles, so any member who is not a creator or assignee loses edit access immediately. Is this breaking change intentional and acceptable?
   - Options: Yes, intentional | Soft rollout with feature flag | Keep MEMBER edits, add to unresolved
   - **Answer:** Yes, intentional
   - **Rationale:** Confirms the restriction is a deliberate product decision, not an oversight. No feature flag needed — proceed with hard enforcement.

2. **[Edit Scope]** Should inline edits in list/kanban views (quick-edit cells, drag-drop state changes) also be gated by the same permission? Currently Phase 3 only covers issue-detail and peek-overview.
   - Options: Detail/peek only for now | Include list/kanban in this plan
   - **Answer:** Detail/peek only for now
   - **Rationale:** Scopes implementation to detail + peek. List/kanban inline edits are a separate follow-up — no Phase 4 needed.

3. **[Assignee Delete]** Should issue assignees also be allowed to delete issues? Currently delete is ADMIN + creator only.
   - Options: Keep delete ADMIN+creator only | Allow assignees to delete too
   - **Answer:** Keep delete ADMIN+creator only
   - **Rationale:** Delete endpoint (`destroy`) stays unchanged. `assignee=True` only applies to `partial_update`.

4. **[Other Endpoints]** Are there other mutating endpoints that should be restricted — e.g., bulk updates, issue subscriptions, reactions, or adding labels/cycles via quick actions?
   - Options: No, partial_update only | Yes, include bulk update too
   - **Answer:** No, partial_update only
   - **Rationale:** Scope is tightly bounded to single-issue PATCH. Bulk update, subscriptions, and reactions are out of scope.

#### Confirmed Decisions

- Breaking change: intentional — MEMBER role removed from partial_update, strict enforcement from day one
- Edit scope: detail/peek only — list/kanban inline edits deferred to follow-up
- Delete permission: ADMIN + creator only — assignees excluded from delete
- Other endpoints: partial_update only — no other endpoints restricted in this plan

#### Action Items

- No plan changes required — all recommended options confirmed

#### Impact on Phases

- No phase changes required — plan proceeds as written
