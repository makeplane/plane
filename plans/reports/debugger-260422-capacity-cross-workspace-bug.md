# Debugger Report: Cross-Workspace Capacity Day-Details Bug

**Date:** 2026-04-22
**File:** `apps/api/plane/app/views/workspace/time_tracking/cross_workspace.py`
**Severity:** Medium — data silently missing, no error shown to admin

---

## Executive Summary

Root cause confirmed. `CrossWorkspaceCapacityDayDetailsEndpoint.get()` filters worklogs using the **viewing admin's** workspace memberships, not the **target member's**. Logs the target user recorded in workspaces the admin doesn't belong to are silently excluded.

A secondary (milder) bug exists in `WorkspaceCapacityDayDetailsEndpoint` when `cross_workspace=true`: it fetches _all_ worklogs for `member_id` with **no workspace scoping at all** — technically correct for cross-workspace intent but has no authorization guard (any valid workspace admin can pull logs from workspaces they have no relation to, as long as they know the `member_id`).

---

## Evidence & Proof

### Bug 1 (Primary) — `CrossWorkspaceCapacityDayDetailsEndpoint`

File: `apps/api/plane/app/views/workspace/time_tracking/cross_workspace.py` lines 253–266

```python
# BUGGY — uses request.user (the admin viewing), not the target member
user_workspace_ids = list(
    WorkspaceMember.objects.filter(
        member=request.user,   # ← admin's workspaces
        is_active=True,
    ).values_list("workspace_id", flat=True)
)

worklogs = IssueWorkLog.objects.filter(
    workspace_id__in=user_workspace_ids,   # ← restricts to admin's workspaces
    logged_by_id=member_id,               # ← target member correct
    logged_at=date_str,
)
```

**Proof of intent mismatch:** The parent `CrossWorkspaceCapacityEndpoint` (lines 157–162) correctly uses `request.user` to get workspace IDs for _listing members_, but the day-details endpoint should scope to **the target member's** workspaces, not the viewer's.

**Scenario that fails:**

- Admin A belongs to workspaces W1 only
- User B belongs to W1 and W2
- User B logs time in W2
- Admin A clicks User B's day-details cell → filter is `workspace_id IN [W1]` → W2 logs not returned → shows incomplete total

### Bug 2 (Secondary) — `WorkspaceCapacityDayDetailsEndpoint` cross_workspace=true

File: `apps/api/plane/app/views/workspace/time_tracking/workspace_capacity.py` lines 242–247

```python
if cross_workspace:
    # No workspace filter at all — any member_id, any workspace
    worklog_filter = {"logged_by": member_id, "logged_at": date}
else:
    worklog_filter = {"workspace__slug": slug, "logged_by": member_id, "logged_at": date}
```

- Functionally correct (returns all logs across workspaces), but has **no authorization gate** on which workspaces are exposed
- The `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` only verifies membership in the slug workspace, not in all returned workspaces
- Mild exposure risk: member-role users (not just admins) can query cross-workspace logs for any `member_id`

### Frontend Routing (confirmed correct)

The frontend `capacity-day-details-popover.tsx` routes correctly:

| Condition                                   | Method called                           | Backend endpoint                                              |
| ------------------------------------------- | --------------------------------------- | ------------------------------------------------------------- |
| `isWorkspaceMode=true`                      | `fetchWorkspaceCapacityDayDetails`      | `GET /analytics/capacity/day-details/?cross_workspace=<bool>` |
| `!isWorkspaceMode && isCrossWorkspace=true` | `fetchCrossWorkspaceCapacityDayDetails` | `GET /cross-workspace/capacity/day-details/`                  |
| `!isWorkspaceMode && !isCrossWorkspace`     | `fetchCapacityDayDetails`               | `GET /projects/:id/capacity/day-details/`                     |

The project-scoped endpoint (`ProjectCapacityDayDetailsEndpoint`) is correctly scoped to workspace+project — no bug there.

---

## URL Routing Map

```
GET /api/workspaces/<slug>/time-tracking/cross-workspace/capacity/day-details/
  → CrossWorkspaceCapacityDayDetailsEndpoint   [BUG 1]

GET /api/workspaces/<slug>/time-tracking/analytics/capacity/day-details/?cross_workspace=true
  → WorkspaceCapacityDayDetailsEndpoint        [BUG 2]

GET /api/workspaces/<slug>/projects/<id>/time-tracking/capacity/day-details/
  → ProjectCapacityDayDetailsEndpoint          [OK]
```

---

## Fix

### Bug 1 fix — `CrossWorkspaceCapacityDayDetailsEndpoint`

Replace `member=request.user` with `member_id=member_id` (the target member):

```python
# FIXED: scope to target member's workspaces, not the admin's
user_workspace_ids = list(
    WorkspaceMember.objects.filter(
        member_id=member_id,   # ← target member, not request.user
        is_active=True,
    ).values_list("workspace_id", flat=True)
)
```

This ensures the day-details popover shows all logs from every workspace the _target user_ belongs to, matching the same logic used by `CrossWorkspaceCapacityEndpoint` to aggregate their totals.

### Bug 2 fix — `WorkspaceCapacityDayDetailsEndpoint` (optional hardening)

Scope cross-workspace queries to workspaces the **admin** is a member of (consistent with how the capacity list is generated in `CrossWorkspaceCapacityEndpoint`):

```python
if cross_workspace:
    visible_workspace_ids = list(
        WorkspaceMember.objects.filter(
            member=request.user, is_active=True
        ).values_list("workspace_id", flat=True)
    )
    worklog_filter = {
        "workspace_id__in": visible_workspace_ids,
        "logged_by": member_id,
        "logged_at": date,
    }
```

Note: this intentionally keeps the admin-visibility restriction (you only see logs from workspaces you can access). If the intent is "admin sees all member logs everywhere", add an admin-only guard.

---

## DB Verification

PostgreSQL at `plane-db:5432` was not reachable from this shell (Docker-internal host). To manually verify:

```sql
-- Find users with logs across multiple workspaces
SELECT logged_by_id, workspace_id, COUNT(*)
FROM db_issueworklog
GROUP BY logged_by_id, workspace_id
HAVING COUNT(*) > 0
ORDER BY logged_by_id, workspace_id;

-- Cross-check: admin A's workspaces vs user B's logged workspaces
SELECT DISTINCT workspace_id FROM db_issueworklog WHERE logged_by_id = '<user_B_uuid>';
SELECT workspace_id FROM db_workspacemember WHERE member_id = '<admin_A_uuid>' AND is_active = true;
```

---

## Timeline / Root Cause Chain

1. `CrossWorkspaceCapacityEndpoint` aggregates member totals using `workspace_id__in` from admin's memberships — **correct for listing**
2. Frontend shows a day-cell with the full total (pulled from Bug 2 endpoint or cross-workspace capacity)
3. On cell click → `CrossWorkspaceCapacityDayDetailsEndpoint` fires
4. Backend re-derives workspace scope using `request.user` (admin) instead of `member_id` (target)
5. Worklogs in workspaces admin isn't in are excluded → popover shows less than the heatmap cell total

---

## Unresolved Questions

1. **Intent of Bug 2:** Should workspace admins see cross-workspace logs for members in workspaces the admin doesn't belong to? Current behavior says yes (no guard). If no, the hardening fix should be applied.
2. **DB unreachable:** Could not verify live data distribution across workspaces to quantify impact. Needs Docker access.
3. **`WorkspaceCapacityEndpoint` cross_workspace mode** (lines 149–153): When `cross_workspace=true`, worklog filter switches to `logged_by__in=member_map.keys()` with no workspace restriction — same authorization gap as Bug 2 in the capacity list itself, not just day-details.
