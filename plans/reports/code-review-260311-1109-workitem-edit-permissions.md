# Code Review: Work Item Edit Permissions

**Date:** 2026-03-11
**Reviewer:** code-reviewer agent
**Branch:** ngoc-feat/workspaces
**Commit:** feb62837f (feat(work-items): make completed_at manually editable)

---

## Scope

| File                                                     | Change                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `apps/api/plane/app/permissions/base.py`                 | Added `assignee=False` param + `IssueAssignee` lookup                                               |
| `apps/api/plane/app/views/issue/base.py`                 | Changed `partial_update` decorator from `[ADMIN, MEMBER]` to `[ADMIN], creator=True, assignee=True` |
| `apps/web/ce/hooks/use-can-edit-issue.ts`                | NEW hook — client-side gate                                                                         |
| `apps/web/core/components/issues/issue-detail/root.tsx`  | Replaced `isEditable` computation                                                                   |
| `apps/web/core/components/issues/peek-overview/root.tsx` | Replaced `isEditable` computation                                                                   |

**Goal:** Restrict work item edits to workspace admins, project admins, issue creators, and assignees.

---

## Overall Assessment

The implementation is directionally sound. The server-side gate in `allow_permission` correctly checks role, creator, and assignee status. The client-side `useCanEditIssue` hook mirrors the same logic for UI gating. React hook rules compliance is handled correctly in `peek-overview/root.tsx` (hook called before the early return). Several issues are worth addressing before shipping.

---

## Critical Issues

### 1. Regression: Project Members (non-admin, non-creator, non-assignee) Can No Longer Edit Any Issue

**Severity: Critical**

**What changed:** The `partial_update` decorator on `IssueViewSet` changed from:

```python
@allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue)
```

to:

```python
@allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, assignee=True, model=Issue)
```

`ROLE.MEMBER` was removed from `allowed_roles`. The logic in `allow_permission` checks `creator` and `assignee` first (short-circuit), but a project `MEMBER` who did not create the issue and is not assigned to it is now entirely blocked from editing it — including changing the state, priority, labels, due date, etc.

**Impact:** This is a breaking behavior change. Before this diff, any project member could edit any issue. Now only admins, creators, and assignees can. This may be intentional per product requirements, but it deserves explicit confirmation. If unintentional, it is a critical regression.

**Action required:** Confirm with product whether this is the intended new policy. If so, update all documentation, user-facing messages, and the frontend sidebar/list views that still allow members to open the edit panel (they will get silent 403s from the API).

---

## Major Issues

### 2. Inconsistent Kwarg Access: `kwargs["pk"]` vs `kwargs.get("pk")`

**Severity: Major**

In `base.py`, the `creator` check uses:

```python
obj = model.objects.filter(id=kwargs["pk"], created_by=request.user).exists()
```

The `assignee` check uses:

```python
issue_id=kwargs.get("pk"),
```

These are inconsistent. The `assignee` branch silently passes `None` as `issue_id` if `pk` is absent from `kwargs` (e.g., if this decorator is ever reused on a different view with a different URL kwarg name). The DB query with `issue_id=None` will return no rows, so the assignee path silently denies access rather than raising a `KeyError` as the creator path would.

More importantly, if `kwargs.get("pk")` returns `None`, the query `IssueAssignee.objects.filter(issue_id=None, ...)` is evaluated against the database and returns empty — no crash, but a misleading permission denial. The inconsistency is a latent bug if this decorator is generalised further.

**Fix:** Use `kwargs.get("pk")` for the assignee check but add an early return if `pk` is None:

```python
if assignee:
    from plane.db.models import IssueAssignee
    issue_pk = kwargs.get("pk")
    if issue_pk:
        is_assignee = IssueAssignee.objects.filter(
            issue_id=issue_pk,
            assignee=request.user,
        ).exists()
        if is_assignee:
            return view_func(instance, request, *args, **kwargs)
```

### 3. Redundant `deleted_at__isnull=True` Filter in Assignee Lookup

**Severity: Minor / Informational**

The assignee check in `base.py` (line 35) explicitly filters `deleted_at__isnull=True`:

```python
IssueAssignee.objects.filter(
    issue_id=kwargs.get("pk"),
    assignee=request.user,
    deleted_at__isnull=True,
)
```

`IssueAssignee` inherits from `ProjectBaseModel → BaseModel → AuditModel → SoftDeleteModel`. `SoftDeleteModel` registers a `SoftDeletionManager` as the default `objects` manager, which already scopes all queries to `deleted_at__isnull=True`. The explicit filter is redundant. It does no harm, but it implies the author may not have been aware of the default manager behaviour, which could cause issues in future queries on this model.

### 4. Permission Asymmetry: `IssueBulkUpdateDateEndpoint` Still Allows Members to Edit Issue Dates

**Severity: Major**

`IssueBulkUpdateDateEndpoint.post` (line 1140) uses:

```python
@allow_permission([ROLE.ADMIN, ROLE.MEMBER])
```

A project member who is neither creator nor assignee of an issue can still change that issue's `start_date` / `target_date` via the bulk endpoint, bypassing the restriction applied to `partial_update`. If the permission change is intentional, this endpoint also needs updating to enforce consistent access control.

**File:** `apps/api/plane/app/views/issue/base.py` line 1140

---

## Medium Priority Issues

### 5. Frontend-Only Gate with No Visible Feedback for Blocked Members

**Severity: Medium**

`isEditable` coming from `useCanEditIssue` is passed as `disabled` props to form fields and sidebar controls. When a project member (non-creator, non-assignee) visits an issue detail page, all fields will be silently disabled without any explanation of why.

The `IssueDetailsSidebar` uses `opacity-60` when `!isEditable`, but there is no tooltip, banner, or message explaining the access restriction. The subscription panel (`subscription.tsx`) still uses its own `allowPermissions` check (line 46) independent of `useCanEditIssue` — this is an inconsistency worth noting.

**Recommendation:** Add a contextual tooltip or inline message ("You don't have permission to edit this issue") on disabled fields, consistent with how other permission-gated UI in the codebase communicates restrictions.

### 6. `useCanEditIssue`: `isAdmin` Resolves to `false` When `workspaceSlug` or `projectId` Is Undefined

**Severity: Medium**

In `use-can-edit-issue.ts`:

```typescript
const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);
if (isAdmin) return true;
```

`allowPermissions` falls back to `this.store.router` for `workspaceSlug`/`projectId` when they are `undefined`. This means the hook will silently use the current router context rather than the explicitly provided context.

In `peek-overview/root.tsx`, `useCanEditIssue` is called with `peekIssue?.workspaceSlug` and `peekIssue?.projectId` — both are potentially `undefined` before the peek data loads. During that window, `allowPermissions` resolves context from the router, which may refer to a different project than the peeked issue. This creates a brief permission state mismatch (admin in current project → shows editable → issue loads in a different project → still shows editable).

This is a UI flicker/race, not a security issue (the backend enforces correctly), but it could result in confusing UX.

### 7. Hook Called With Potentially Stale Store Data (Assignee Race Condition)

**Severity: Medium**

`useCanEditIssue` reads `issue.assignee_ids` from the MobX store:

```typescript
if (issue.assignee_ids?.includes(currentUser.id)) return true;
```

If the current user removes themselves as an assignee, the optimistic store update will immediately flip `assignee_ids`, revoking edit access before the server confirms the change. Similarly, if someone else adds the current user as an assignee via a real-time update, the UI gate updates correctly via MobX reactivity.

The concern is the reverse: a user assigned to an issue mid-session will not see the edit controls until the issue is refetched or the store is updated. This is acceptable given MobX observability, but worth documenting.

---

## Low Priority Issues

### 8. Import Order in `base.py` (Deferred Import)

**Severity: Low**

The `IssueAssignee` import in `base.py` is deferred inside the function:

```python
if assignee:
    from plane.db.models import IssueAssignee
```

This is done to avoid a circular import, which is valid. However, `IssueAssignee` is already imported at the top of `apps/api/plane/app/views/issue/base.py` and other view files without issues. The circular import concern should be verified. If it is not actually circular, the deferred import can be moved to the top of the file for consistency with the codebase's import style.

### 9. `useCanEditIssue` Is Not Memoised

**Severity: Low**

The hook runs `allowPermissions(...)`, `getIssueById(issueId)`, and the creator/assignee checks on every render. These are `computedFn`-memoised at the store level, so the cost is low. However, since this hook is called in both `IssueDetailRoot` (which is `observer`-wrapped) and `IssuePeekOverview` (also `observer`-wrapped), and the hook itself calls observable store values, MobX will correctly track dependencies and re-render only when relevant observables change. This is fine but worth noting as a pattern.

---

## Edge Cases Found by Scout

1. **Peek overview with undefined `peekIssue`:** Hook is called before the early return (line 52) — this is correctly handled per React hook rules. However, `isAdmin` evaluation during the undefined window uses the router context (see issue 6 above).

2. **Archived issue + non-assignee:** `IssueDetailsSidebar` receives `isEditable={!is_archived && isEditable}`, correctly preventing edits on archived issues regardless of role. The peek overview does not apply the archive gate (`disabled={!isEditable}` without archive check at line 239). Depending on whether archived peek is accessible, this could allow UI edits to proceed that the backend would reject.

3. **Issue not yet loaded in store:** `getIssueById(issueId)` returns `undefined` → hook returns `false` → all fields start as disabled → fields enable once issue loads. This "safe-default to read-only" is correct and intentional (documented in the hook JSDoc).

4. **Creator check with `pk` = UUID string vs UUID object:** `Issue.objects.filter(id=kwargs["pk"])` — Django URL converters with `<uuid:pk>` will pass a Python `uuid.UUID` object, which Django ORM handles correctly. Not an issue.

5. **`assignee=True` on non-issue endpoints:** The `assignee` parameter is generic in `allow_permission` but hardcodes `IssueAssignee` — if this decorator is used on a non-issue view with `assignee=True`, it silently does an `IssueAssignee` lookup with a non-issue `pk`, which will always return no rows. The decorator has no guard against this misuse.

---

## Positive Observations

- Hook placement before any early returns in `peek-overview/root.tsx` (line 52) correctly satisfies React's Rules of Hooks — the comment documenting this decision is good practice.
- The backend `allow_permission` short-circuits early for creator and assignee before doing the more expensive role lookups — correct ordering.
- `deleted_at__isnull=True` on `IssueAssignee` query shows awareness of soft deletion, even if redundant.
- `useCanEditIssue` returns `false` as the safe default when data is not yet loaded — correct fail-safe direction.
- Workspace admin → project admin elevation is handled transparently by `allowPermissions` via `getProjectRole` (line 127 in `base-permissions.store.ts`: `if (workspaceRole === EUserWorkspaceRoles.ADMIN) return EUserPermissions.ADMIN`) — consistent with backend behaviour.

---

## Recommended Actions

1. **[Critical]** Confirm with product whether blocking non-admin, non-creator, non-assignee project members from editing issues is the intended new policy. If yes, audit and update all related UI surfaces (list views, kanban, intake) that still surface edit affordances to members. If no, restore `ROLE.MEMBER` to the `allowed_roles` in `partial_update`.

2. **[Major]** Update `IssueBulkUpdateDateEndpoint` (`line 1140`) to apply the same permission policy as `partial_update` to avoid the bypass path.

3. **[Major]** Fix the `kwargs.get("pk")` inconsistency in `base.py` — add a guard if `pk` is `None` to avoid a silent no-op query.

4. **[Medium]** Add archive gate to the peek overview's `disabled` prop: `disabled={!isEditable || !!peekIssue.isArchived}`.

5. **[Medium]** Add user-facing feedback (tooltip or inline message) on disabled fields for non-editable issues to explain why they cannot edit.

6. **[Low]** Investigate whether the deferred `IssueAssignee` import in `base.py` is truly necessary; if not, move to top-level imports.

---

## Metrics

| Metric                                | Value                                                   |
| ------------------------------------- | ------------------------------------------------------- |
| Files changed                         | 5                                                       |
| Backend logic changes                 | 2                                                       |
| New frontend hook                     | 1                                                       |
| Frontend component changes            | 2                                                       |
| Type coverage (new hook)              | Full — explicit `boolean` return, optional params typed |
| Linting issues identified             | 0 (code is syntactically clean)                         |
| Test coverage for new permission path | None found                                              |

---

## Unresolved Questions

1. Is it intentional that project members (non-admin, non-creator, non-assignee) can no longer edit any issue? This is the most significant behaviour change in this diff.
2. Should the `assignee=True` parameter in `allow_permission` be limited to issue contexts, or is it being designed as a generic mechanism for future use on other models?
3. Does the product require the frontend to show a 403 error toast when a blocked member attempts an edit (e.g., via the API directly), or is silent UI disabling sufficient?
