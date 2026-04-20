# Permission Role Comparison — Per-Feature Reference

This document provides a **feature-level** view of what each role can do. It complements the endpoint-level `PERMISSION_MATRIX.md` by organizing permissions around features rather than API endpoints.

**Related documents:**

- `PERMISSION_MATRIX.md` — endpoint-level permission matrix (current-state reference)
- `PERMISSION_MIGRATION.md` — old→new migration changelog
- `apps/api/plane/ee/rbac/system_roles.py` — source of truth for role→permission grants

## How to Read This Document

- Each feature section has one table: **actions as rows**, **roles as columns**
- W-Owner, W-Admin, W-Member, W-Guest = Workspace roles (levels 25, 20, 15, 5)
- P-Admin, P-Contributor, P-Commenter, P-Guest = Project roles (levels 20, 15, 10, 5)
- TS-Member, TS-Member+Lead = Teamspace roles

### Legend

| Symbol              | Meaning                                                            |
| ------------------- | ------------------------------------------------------------------ |
| ✅                  | Unconditional access                                               |
| ✅ `*`              | Access via full wildcard (W-Owner)                                 |
| ✅ `w`              | Access via resource wildcard (W-Admin, e.g., `workitem:*`)         |
| +Creator            | Conditional — only on resources the user created                   |
| +Lead               | Conditional — only for teamspace leads                             |
| +Creator (deferred) | Conditional — queryset filtered to own resources on list endpoints |
| ❌                  | No access                                                          |
| —                   | Not applicable (role doesn't operate at this scope)                |

> **Note:** W-Member and W-Guest are omitted from project-level feature tables — they have no project content access without explicit project membership. W-Owner and W-Admin are shown in project tables because they get project-level access via workspace wildcards.

---

# Workspace Features

## 1. Workspace Management

| Action  | W-Owner | W-Admin | W-Member | W-Guest |
| ------- | ------- | ------- | -------- | ------- |
| View    | ✅ `*`  | ✅      | ✅       | ✅      |
| Edit    | ✅ `*`  | ✅      | ❌       | ❌      |
| Manage  | ✅ `*`  | ✅      | ❌       | ❌      |
| Archive | ✅ `*`  | ✅      | ❌       | ❌      |
| Delete  | ✅ `*`  | ❌      | ❌       | ❌      |
| Invite  | ✅ `*`  | ✅      | ❌       | ❌      |

> Only the Owner can delete the workspace. Admins cannot delete even on Business/Enterprise plans.

## 2. Workspace Members

| Action       | W-Owner | W-Admin | W-Member | W-Guest |
| ------------ | ------- | ------- | -------- | ------- |
| View members | ✅ `*`  | ✅      | ✅       | ✅      |
| Invite       | ✅ `*`  | ✅      | ❌       | ❌      |
| Remove       | ✅ `*`  | ✅      | ❌       | ❌      |
| Change role  | ✅ `*`  | ✅      | ❌       | ❌      |
| Import       | ✅ `*`  | ✅      | ❌       | ❌      |
| Leave        | ✅ `*`  | ✅      | ✅       | ✅      |

> Inline checks enforce role hierarchy (can't modify higher roles) and last-admin protection.

## 3. Projects (Workspace-Level)

| Action               | W-Owner | W-Admin | W-Member | W-Guest |
| -------------------- | ------- | ------- | -------- | ------- |
| Browse (list detail) | ✅ `*`  | ✅      | ✅       | ❌      |
| Create               | ✅ `*`  | ✅      | ❌       | ❌      |
| Join (public)        | ✅ `*`  | ✅      | ✅       | ❌      |

> W-Guest can list projects (basic) via `workspace:view` but cannot browse details or join.

## 4. Wiki / Workspace Pages

| Action                       | W-Owner | W-Admin | W-Member | W-Guest |
| ---------------------------- | ------- | ------- | -------- | ------- |
| View                         | ✅ `*`  | ✅      | ✅       | ❌      |
| Create                       | ✅ `*`  | ✅      | ✅       | ❌      |
| Edit                         | ✅ `*`  | ✅      | ✅       | ❌      |
| Delete                       | ✅ `*`  | ✅      | ✅       | ❌      |
| Archive / Unarchive          | ✅ `*`  | ✅      | ✅       | ❌      |
| Lock / Unlock                | ✅ `*`  | ✅      | ✅       | ❌      |
| Share / Unshare              | ✅ `*`  | ✅      | ✅       | ❌      |
| Publish / Unpublish          | ✅ `*`  | ✅      | ✅       | ❌      |
| Export                       | ✅ `*`  | ✅      | ✅       | ❌      |
| Comment (create/edit/delete) | ✅ `*`  | ✅      | ✅       | ❌      |
| Comment (react)              | ✅ `*`  | ✅      | ✅       | ❌      |
| Comment (resolve)            | ✅ `*`  | ✅      | ✅       | ❌      |

> Wiki pages use `WorkspacePagePermission` for owner bypass and private/shared logic.

## 5. Workspace Views

| Action        | W-Owner | W-Admin | W-Member | W-Guest |
| ------------- | ------- | ------- | -------- | ------- |
| View          | ✅ `*`  | ✅      | ✅       | ✅      |
| Create        | ✅ `*`  | ✅      | ✅       | ❌      |
| Edit          | ✅ `*`  | ✅      | +Creator | ❌      |
| Delete        | ✅ `*`  | ✅      | +Creator | ❌      |
| Export        | ✅ `*`  | ✅      | ✅       | ❌      |
| Lock / Unlock | ✅ `*`  | ✅      | +Creator | ❌      |

> W-Guest can view workspace views but only sees own views (data-level filter on `workspace_workitem_view:create`).
> W-Member edit/delete restricted to own views via inline creator check.

## 6. Initiatives

All initiative endpoints gated by `FeatureFlag.INITIATIVES`.

| Action            | W-Owner | W-Admin | W-Member | W-Guest |
| ----------------- | ------- | ------- | -------- | ------- |
| View              | ✅ `*`  | ✅      | ✅       | ❌      |
| Create            | ✅ `*`  | ✅      | ❌       | ❌      |
| Edit              | ✅ `*`  | ✅      | ❌       | ❌      |
| Delete            | ✅ `*`  | ✅      | ❌       | ❌      |
| React             | ✅ `*`  | ✅      | ✅       | ❌      |
| Manage labels     | ✅ `*`  | ✅      | ❌       | ❌      |
| **Comments**      |         |         |          |         |
| Create comment    | ✅ `*`  | ✅      | ✅       | ❌      |
| Edit comment      | ✅ `*`  | ✅      | +Creator | ❌      |
| Delete comment    | ✅ `*`  | ✅      | +Creator | ❌      |
| React to comment  | ✅ `*`  | ✅      | ✅       | ❌      |
| **Attachments**   |         |         |          |         |
| View              | ✅ `*`  | ✅      | ✅       | ❌      |
| Create            | ✅ `*`  | ✅      | ✅       | ❌      |
| Edit              | ✅ `*`  | ✅      | ✅       | ❌      |
| Delete            | ✅ `*`  | ✅      | +Creator | ❌      |
| **Links**         |         |         |          |         |
| View              | ✅ `*`  | ✅      | ✅       | ❌      |
| Create            | ✅ `*`  | ✅      | ✅       | ❌      |
| Edit              | ✅ `*`  | ✅      | ✅       | ❌      |
| Delete            | ✅ `*`  | ✅      | ✅       | ❌      |
| **Updates**       |         |         |          |         |
| View              | ✅ `*`  | ✅      | ✅       | ❌      |
| Comment on update | ✅ `*`  | ✅      | ✅       | ❌      |
| React to update   | ✅ `*`  | ✅      | ✅       | ❌      |

## 7. Teamspaces (Workspace-Level)

| Action | W-Owner | W-Admin | W-Member | W-Guest |
| ------ | ------- | ------- | -------- | ------- |
| Browse | ✅ `*`  | ✅      | ✅       | ❌      |
| Create | ✅ `*`  | ✅      | ❌       | ❌      |

> Teamspace content access (edit, delete, manage) requires teamspace membership — see [Teamspace Features](#teamspace-features) below.

## 8. Dashboards

All dashboard endpoints gated by `FeatureFlag.DASHBOARDS`.

| Action | W-Owner | W-Admin | W-Member | W-Guest |
| ------ | ------- | ------- | -------- | ------- |
| View   | ✅ `*`  | ✅      | ✅       | ❌      |
| Create | ✅ `*`  | ✅      | ❌       | ❌      |
| Edit   | ✅ `*`  | ✅      | ❌       | ❌      |
| Delete | ✅ `*`  | ✅      | ❌       | ❌      |

## 9. Analytics

| Action           | W-Owner | W-Admin | W-Member | W-Guest |
| ---------------- | ------- | ------- | -------- | ------- |
| View analytics   | ✅ `*`  | ✅      | ✅       | ❌      |
| Export analytics | ✅ `*`  | ✅      | ✅       | ❌      |

> Default analytics and project stats use `workspace:view` (all roles). Advanced analytics use `analytics:view`/`analytics:export` (excludes W-Guest).

## 10. Workspace Drafts

| Action           | W-Owner | W-Admin | W-Member | W-Guest  |
| ---------------- | ------- | ------- | -------- | -------- |
| View (own)       | ✅ `*`  | ✅      | ✅       | ✅       |
| Create           | ✅ `*`  | ✅      | ✅       | ✅       |
| Edit (own)       | ✅ `*`  | ✅      | ✅       | ✅       |
| Delete           | ✅ `*`  | ✅      | +Creator | +Creator |
| Convert to issue | ✅ `*`  | ✅      | ✅       | ❌       |

> Drafts are user-scoped — data-level filter ensures users only see/modify their own drafts.

## 11. Integrations (OAuth)

| Action             | W-Owner | W-Admin | W-Member | W-Guest |
| ------------------ | ------- | ------- | -------- | ------- |
| View               | ✅ `*`  | ✅      | ✅       | ❌      |
| Create             | ✅ `*`  | ✅      | ✅       | ❌      |
| Edit               | ✅ `*`  | ✅      | ✅       | ❌      |
| Delete             | ✅ `*`  | ✅      | ✅       | ❌      |
| Connect / Install  | ✅ `*`  | ✅      | ✅       | ❌      |
| Manage (uninstall) | ✅ `*`  | ✅      | ❌       | ❌      |

> First-time install requires W-Admin role (inline business logic). Members can install after admin has installed.

## 12. Webhooks

| Action    | W-Owner | W-Admin | W-Member | W-Guest |
| --------- | ------- | ------- | -------- | ------- |
| View      | ✅ `*`  | ✅      | ❌       | ❌      |
| Create    | ✅ `*`  | ✅      | ❌       | ❌      |
| Edit      | ✅ `*`  | ✅      | ❌       | ❌      |
| Delete    | ✅ `*`  | ✅      | ❌       | ❌      |
| View logs | ✅ `*`  | ✅      | ❌       | ❌      |

## 13. API Tokens

| Action | W-Owner | W-Admin | W-Member | W-Guest |
| ------ | ------- | ------- | -------- | ------- |
| View   | ✅ `*`  | ✅      | ✅       | ❌      |
| Create | ✅ `*`  | ✅      | ✅       | ❌      |
| Delete | ✅ `*`  | ✅      | ✅       | ❌      |

## 14. Customers

| Action             | W-Owner | W-Admin | W-Member | W-Guest |
| ------------------ | ------- | ------- | -------- | ------- |
| View               | ✅ `*`  | ✅      | ❌       | ❌      |
| Create             | ✅ `*`  | ✅      | ❌       | ❌      |
| Edit               | ✅ `*`  | ✅      | ❌       | ❌      |
| Delete             | ✅ `*`  | ✅      | ❌       | ❌      |
| Manage properties  | ✅ `*`  | ✅      | ❌       | ❌      |
| Manage requests    | ✅ `*`  | ✅      | ❌       | ❌      |
| Link/unlink issues | ✅ `*`  | ✅      | ❌       | ❌      |

## 15. Workspace Assets

| Action               | W-Owner | W-Admin | W-Member | W-Guest |
| -------------------- | ------- | ------- | -------- | ------- |
| View / Download      | ✅ `*`  | ✅      | ✅       | ✅      |
| Create / Upload      | ✅ `*`  | ✅      | ✅       | ❌      |
| Manage (silo upload) | ✅ `*`  | ✅      | ❌       | ❌      |

## 16. Workspace Templates

### Workitem Templates

| Action | W-Owner | W-Admin | W-Member | W-Guest |
| ------ | ------- | ------- | -------- | ------- |
| View   | ✅ `*`  | ✅      | ✅       | ❌      |
| Create | ✅ `*`  | ✅      | ❌       | ❌      |
| Edit   | ✅ `*`  | ✅      | ❌       | ❌      |
| Delete | ✅ `*`  | ✅      | ❌       | ❌      |

### Page Templates

| Action | W-Owner | W-Admin | W-Member | W-Guest |
| ------ | ------- | ------- | -------- | ------- |
| View   | ✅ `*`  | ✅      | ✅       | ❌      |
| Create | ✅ `*`  | ✅      | ❌       | ❌      |
| Edit   | ✅ `*`  | ✅      | ❌       | ❌      |
| Delete | ✅ `*`  | ✅      | ❌       | ❌      |

### Project Templates

| Action                    | W-Owner | W-Admin | W-Member | W-Guest |
| ------------------------- | ------- | ------- | -------- | ------- |
| View                      | ✅ `*`  | ✅      | ✅       | ❌      |
| Create                    | ✅ `*`  | ✅      | ❌       | ❌      |
| Edit                      | ✅ `*`  | ✅      | ❌       | ❌      |
| Delete                    | ✅ `*`  | ✅      | ❌       | ❌      |
| Use (create project from) | ✅ `*`  | ✅      | ✅       | ❌      |
| Publish                   | ✅ `*`  | ✅      | ❌       | ❌      |

## 17. AI

| Action          | W-Owner | W-Admin | W-Member | W-Guest |
| --------------- | ------- | ------- | -------- | ------- |
| Use AI features | ✅ `*`  | ✅      | ✅       | ❌      |

## 18. Favorites

| Action | W-Owner | W-Admin | W-Member | W-Guest |
| ------ | ------- | ------- | -------- | ------- |
| View   | ✅ `*`  | ✅      | ✅       | ❌      |
| Create | ✅ `*`  | ✅      | ✅       | ❌      |
| Edit   | ✅ `*`  | ✅      | ✅       | ❌      |
| Delete | ✅ `*`  | ✅      | ✅       | ❌      |

> Project favorites use `workspace:view` (all roles including W-Guest). Workspace favorites use `favorite:*` permissions (W-Guest excluded).

## 19. Workspace Activity

| Action               | W-Owner | W-Admin | W-Member | W-Guest |
| -------------------- | ------- | ------- | -------- | ------- |
| View activity        | ✅ `*`  | ✅      | ✅       | ❌      |
| Export activity      | ✅ `*`  | ✅      | ✅       | ❌      |
| View user activity   | ✅ `*`  | ✅      | ✅       | ❌      |
| Export user activity | ✅ `*`  | ✅      | ✅       | ❌      |

## 20. Workspace Worklogs

| Action | W-Owner | W-Admin | W-Member | W-Guest |
| ------ | ------- | ------- | -------- | ------- |
| View   | ✅ `*`  | ✅      | ✅       | ❌      |
| Export | ✅ `*`  | ✅      | ✅       | ❌      |

## 21. Workspace Features

| Action | W-Owner | W-Admin | W-Member | W-Guest |
| ------ | ------- | ------- | -------- | ------- |
| View   | ✅ `*`  | ✅      | ✅       | ✅      |
| Edit   | ✅ `*`  | ✅      | ✅       | ❌      |

## 22. Workspace Project States

| Action | W-Owner | W-Admin | W-Member | W-Guest |
| ------ | ------- | ------- | -------- | ------- |
| View   | ✅ `*`  | ✅      | ✅       | ✅      |
| Create | ✅ `*`  | ✅      | ✅       | ❌      |
| Edit   | ✅ `*`  | ✅      | ✅       | ❌      |
| Delete | ✅ `*`  | ✅      | ✅       | ❌      |

---

# Project Features

> W-Owner always has access via `*` wildcard. W-Admin always has access via resource wildcards (e.g., `workitem:*`). Both are omitted from project tables below for readability — assume **✅** for both unless noted otherwise.

## 1. Issues / Work Items

| Action              | P-Admin | P-Contributor | P-Commenter | P-Guest             |
| ------------------- | ------- | ------------- | ----------- | ------------------- |
| View                | ✅      | ✅            | ✅          | +Creator (deferred) |
| Create              | ✅      | ✅            | ❌          | ❌                  |
| Edit                | ✅      | ✅            | +Creator    | +Creator            |
| Delete              | ✅      | +Creator      | ❌          | ❌                  |
| Bulk delete         | ✅      | ❌            | ❌          | ❌                  |
| Assign              | ✅      | ✅            | ❌          | ❌                  |
| Archive / Unarchive | ✅      | ✅            | ❌          | ❌                  |
| Bulk archive        | ✅      | ✅            | ❌          | ❌                  |
| Bulk edit dates     | ✅      | ✅            | ❌          | ❌                  |
| Export              | ✅      | ✅            | ❌          | ❌                  |
| React               | ✅      | ✅            | ✅          | ❌                  |
| Subscribe           | ✅      | ✅            | ✅          | +Creator            |
| View activity       | ✅      | ✅            | ✅          | +Creator            |
| View versions       | ✅      | ✅            | ✅          | +Creator            |

> P-Guest sees only their own issues (created via intake). +Creator conditional grant with deferred queryset filtering.

## 2. Comments (Issue/Epic)

| Action       | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------------ | ------- | ------------- | ----------- | ------- |
| View         | ✅      | ✅            | ✅          | ❌      |
| Create       | ✅      | ✅            | ✅          | ❌      |
| Edit (any)   | ✅      | ❌            | ❌          | ❌      |
| Edit (own)   | —       | +Creator      | +Creator    | ❌      |
| Delete (any) | ✅      | ❌            | ❌          | ❌      |
| Delete (own) | —       | +Creator      | +Creator    | ❌      |
| React        | ✅      | ✅            | ✅          | ✅      |

> P-Admin has `comment:*` wildcard — can edit/delete any comment. Others can only edit/delete own comments.

## 3. Attachments

| Action       | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------------ | ------- | ------------- | ----------- | ------- |
| View         | ✅      | ✅            | ✅          | ✅      |
| Create       | ✅      | ✅            | ✅          | ❌      |
| Edit (any)   | ✅      | ❌            | ❌          | ❌      |
| Edit (own)   | —       | +Creator      | ❌          | ❌      |
| Delete (any) | ✅      | ❌            | ❌          | ❌      |
| Delete (own) | —       | +Creator      | ❌          | ❌      |

## 4. Issue Links

| Action | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------ | ------- | ------------- | ----------- | ------- |
| View   | ✅      | ✅            | ✅          | ❌      |
| Create | ✅      | ✅            | ❌          | ❌      |
| Edit   | ✅      | ✅            | ❌          | ❌      |
| Delete | ✅      | ✅            | ❌          | ❌      |

## 5. Issue Relations

| Action | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------ | ------- | ------------- | ----------- | ------- |
| View   | ✅      | ✅            | ✅          | ❌      |
| Create | ✅      | ✅            | ❌          | ❌      |
| Delete | ✅      | ✅            | ❌          | ❌      |

> No EDIT action — relations are created and removed, never edited.

## 6. Epics

| Action               | P-Admin | P-Contributor | P-Commenter | P-Guest |
| -------------------- | ------- | ------------- | ----------- | ------- |
| View                 | ✅      | ✅            | ✅          | ❌      |
| Create               | ✅      | ✅            | ❌          | ❌      |
| Edit                 | ✅      | ✅            | ❌          | ❌      |
| Delete               | ✅      | +Creator      | ❌          | ❌      |
| Archive / Unarchive  | ✅      | ✅            | ❌          | ❌      |
| Export               | ✅      | ✅            | ❌          | ❌      |
| React                | ✅      | ✅            | ❌          | ❌      |
| Comment              | ✅      | ✅            | ❌          | ❌      |
| Delete comment (own) | —       | +Creator      | ❌          | ❌      |
| Subscribe            | ✅      | ✅            | ✅          | ❌      |
| View activity        | ✅      | ✅            | ✅          | ❌      |
| Toggle epic status   | ✅      | ❌            | ❌          | ❌      |

## 7. Epic Updates

| Action            | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ----------------- | ------- | ------------- | ----------- | ------- |
| View              | ✅      | ✅            | ✅          | ❌      |
| Create            | ✅      | ✅            | ❌          | ❌      |
| Edit              | ✅      | +Creator      | ❌          | ❌      |
| Delete            | ✅      | +Creator      | ❌          | ❌      |
| React             | ✅      | ✅            | ❌          | ❌      |
| Comment on update | ✅      | ✅            | ❌          | ❌      |

## 8. Epic Links & Properties

### Epic Links

| Action | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------ | ------- | ------------- | ----------- | ------- |
| View   | ✅      | ✅            | ✅          | ❌      |
| Create | ✅      | ✅            | ❌          | ❌      |
| Edit   | ✅      | ✅            | ❌          | ❌      |
| Delete | ✅      | ✅            | ❌          | ❌      |

### Epic Properties

| Action             | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------------------ | ------- | ------------- | ----------- | ------- |
| View               | ✅      | ✅            | ✅          | ❌      |
| Create             | ✅      | ✅            | ❌          | ❌      |
| Edit               | ✅      | ✅            | ❌          | ❌      |
| Delete             | ✅      | ✅            | ❌          | ❌      |
| Set values on epic | ✅      | ✅            | ❌          | ❌      |
| Manage options     | ✅      | ✅            | ❌          | ❌      |

## 9. Cycles

| Action                    | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------------------------- | ------- | ------------- | ----------- | ------- |
| View                      | ✅      | ✅            | ✅          | ❌      |
| Create                    | ✅      | ✅            | ❌          | ❌      |
| Edit                      | ✅      | ✅            | ❌          | ❌      |
| Delete                    | ✅      | +Creator      | ❌          | ❌      |
| Archive / Unarchive       | ✅      | ✅            | ❌          | ❌      |
| Add/remove issues         | ✅      | ✅            | ❌          | ❌      |
| Transfer issues           | ✅      | ✅            | ❌          | ❌      |
| Start / Stop              | ✅      | ✅            | ❌          | ❌      |
| Manage (automated cycles) | ✅      | ❌            | ❌          | ❌      |
| Export                    | ✅      | ✅            | ❌          | ❌      |
| View analytics            | ✅      | ✅            | ✅          | ❌      |
| Favorite                  | ✅      | ✅            | ✅          | ❌      |

## 10. Cycle Updates

| Action | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------ | ------- | ------------- | ----------- | ------- |
| View   | ✅      | ✅            | ✅          | ❌      |
| Create | ✅      | ✅            | ❌          | ❌      |
| Edit   | ✅      | +Creator      | ❌          | ❌      |
| Delete | ✅      | +Creator      | ❌          | ❌      |
| React  | ✅      | ✅            | ✅          | ❌      |

## 11. Modules

| Action              | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------------------- | ------- | ------------- | ----------- | ------- |
| View                | ✅      | ✅            | ✅          | ❌      |
| Create              | ✅      | ✅            | ❌          | ❌      |
| Edit                | ✅      | ✅            | ❌          | ❌      |
| Delete              | ✅      | +Creator      | ❌          | ❌      |
| Archive / Unarchive | ✅      | ✅            | ❌          | ❌      |
| Add/remove issues   | ✅      | ✅            | ❌          | ❌      |
| Manage links        | ✅      | ✅            | ❌          | ❌      |
| Export              | ✅      | ✅            | ❌          | ❌      |
| Favorite            | ✅      | ✅            | ✅          | ❌      |

## 12. Pages

| Action              | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------------------- | ------- | ------------- | ----------- | ------- |
| View                | ✅      | ✅            | ✅          | ✅      |
| Create              | ✅      | ✅            | ❌          | ❌      |
| Edit                | ✅      | ✅            | ❌          | ❌      |
| Delete              | ✅      | ❌            | ❌          | ❌      |
| Duplicate           | ✅      | ✅            | ❌          | ❌      |
| Lock / Unlock       | ✅      | ✅            | ❌          | ❌      |
| Archive / Unarchive | ✅      | ✅            | ❌          | ❌      |
| Share / Unshare     | ✅      | ✅            | ❌          | ❌      |
| Publish / Unpublish | ✅ / ✅ | ❌ / ❌       | ❌          | ❌      |
| Export              | ✅      | ✅            | ✅          | ✅      |
| Comment (create)    | ✅      | ✅            | ❌          | ❌      |
| Comment (react)     | ✅      | ✅            | ✅          | ✅      |
| Favorite            | ✅      | ✅            | ✅          | ✅      |

> `page:delete` is admin-only. Contributor can edit but cannot delete pages. Unpublish requires `page:delete`.
> `ProjectPagePermission` handles owner bypass and private/shared page logic.

## 13. Views / Saved Filters

| Action        | P-Admin             | P-Contributor       | P-Commenter | P-Guest |
| ------------- | ------------------- | ------------------- | ----------- | ------- |
| View          | ✅                  | ✅                  | ✅          | ✅      |
| Create        | ✅                  | ✅                  | ❌          | ❌      |
| Edit          | ✅ (inline creator) | ✅ (inline creator) | ❌          | ❌      |
| Delete        | ✅                  | +Creator            | ❌          | ❌      |
| Share         | ✅                  | ✅                  | ❌          | ❌      |
| Publish       | ✅                  | ✅                  | ❌          | ❌      |
| Export        | ✅                  | ✅                  | ❌          | ❌      |
| Lock / Unlock | ✅                  | ✅                  | ❌          | ❌      |
| Change access | ✅ (owner only)     | ✅ (owner only)     | ❌          | ❌      |
| Favorite      | ✅                  | ✅                  | ❌          | ❌      |

> Edit enforces inline creator check — only the creator can edit, regardless of role. Change access is owner-only.

## 14. Intake

| Action                  | P-Admin | P-Contributor | P-Commenter | P-Guest             |
| ----------------------- | ------- | ------------- | ----------- | ------------------- |
| View all issues         | ✅      | ✅            | ✅          | ❌                  |
| View own issues         | ✅      | ✅            | ✅          | +Creator (deferred) |
| Create / Submit         | ✅      | ✅            | ✅          | ✅                  |
| Edit (full)             | ✅      | ❌            | ❌          | ❌                  |
| Edit (own — fields)     | —       | +Creator      | +Creator    | +Creator            |
| Change status           | ✅      | ❌            | ❌          | ❌                  |
| Delete                  | ✅      | +Creator      | +Creator    | +Creator            |
| Export                  | ✅      | ✅            | ❌          | ❌                  |
| React                   | ✅      | ✅            | ✅          | ❌                  |
| Configure settings      | ✅      | ❌            | ❌          | ❌                  |
| Configure forms         | ✅      | ❌            | ❌          | ❌                  |
| Manage responsibilities | ✅      | ❌            | ❌          | ❌                  |

> **View:** Guest has `intake:view+creator` (deferred) — queryset filtered to own items. All other roles see all issues unconditionally.
>
> **Edit (own — fields):** Creator-only roles can edit: name, description, priority, target_date, start_date, label_ids, assignee_ids. State changes blocked by `IntakeIssueUpdateSerializer` (read-only `state_id`).
>
> **Change status:** Gated by `intake:manage` (admin-only). Enforced via inline `has_permission()` in `partial_update` and dedicated `update_status` endpoint.

## 15. Labels

| Action | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------ | ------- | ------------- | ----------- | ------- |
| View   | ✅      | ✅            | ✅          | ✅      |
| Create | ✅      | ❌            | ❌          | ❌      |
| Edit   | ✅      | ❌            | ❌          | ❌      |
| Delete | ✅      | ❌            | ❌          | ❌      |

## 16. States

| Action | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------ | ------- | ------------- | ----------- | ------- |
| View   | ✅      | ✅            | ✅          | ✅      |
| Create | ✅      | ❌            | ❌          | ❌      |
| Edit   | ✅      | ❌            | ❌          | ❌      |
| Delete | ✅      | ❌            | ❌          | ❌      |

## 17. Estimates

| Action | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------ | ------- | ------------- | ----------- | ------- |
| View   | ✅      | ✅            | ✅          | ✅      |
| Create | ✅      | ❌            | ❌          | ❌      |
| Edit   | ✅      | ❌            | ❌          | ❌      |
| Delete | ✅      | ❌            | ❌          | ❌      |

## 18. Project Settings

| Action                   | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------------------------ | ------- | ------------- | ----------- | ------- |
| View                     | ✅      | ✅            | ✅          | ✅      |
| Edit                     | ✅      | ❌            | ❌          | ❌      |
| Manage (toggle features) | ✅      | ❌            | ❌          | ❌      |
| Delete project           | ✅      | ❌            | ❌          | ❌      |
| Archive / Unarchive      | ✅      | ❌            | ❌          | ❌      |
| Publish (deploy board)   | ✅      | ❌            | ❌          | ❌      |
| Deploy board (view)      | ✅      | ✅            | ✅          | ✅      |

## 19. Project Members

| Action      | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ----------- | ------- | ------------- | ----------- | ------- |
| View        | ✅      | ✅            | ✅          | ✅      |
| Invite      | ✅      | ❌            | ❌          | ❌      |
| Change role | ✅      | ❌            | ❌          | ❌      |
| Remove      | ✅      | ❌            | ❌          | ❌      |
| Leave       | ✅      | ✅            | ✅          | ✅      |

> Inline checks enforce role hierarchy, self-update prevention, and workspace↔project role constraints.

## 20. Project Activity

| Action                | P-Admin | P-Contributor | P-Commenter | P-Guest |
| --------------------- | ------- | ------------- | ----------- | ------- |
| View project activity | ✅      | ✅            | ✅          | ✅      |
| View member activity  | ✅      | ❌            | ❌          | ❌      |

## 21. Project Analytics

| Action         | P-Admin | P-Contributor | P-Commenter | P-Guest |
| -------------- | ------- | ------------- | ----------- | ------- |
| View analytics | ✅      | ✅            | ✅          | ❌      |
| Export         | ✅      | ✅            | ❌          | ❌      |

> P-Commenter granted VIEW for FE parity (progress section shown to all project members).

## 22. Automations

All automation endpoints gated by `FeatureFlag.PROJECT_AUTOMATIONS`.

| Action        | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------------- | ------- | ------------- | ----------- | ------- |
| View          | ✅      | ✅            | ❌          | ❌      |
| Create        | ✅      | ❌            | ❌          | ❌      |
| Edit          | ✅      | ❌            | ❌          | ❌      |
| Delete        | ✅      | ❌            | ❌          | ❌      |
| Toggle status | ✅      | ❌            | ❌          | ❌      |

## 23. Workflows

| Action                   | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------------------------ | ------- | ------------- | ----------- | ------- |
| View                     | ✅      | ✅            | ✅          | ✅      |
| Edit (transitions/rules) | ✅      | ❌            | ❌          | ❌      |
| Delete                   | ✅      | ❌            | ❌          | ❌      |

## 24. Milestones

| Action                | P-Admin | P-Contributor | P-Commenter | P-Guest |
| --------------------- | ------- | ------------- | ----------- | ------- |
| View                  | ✅      | ✅            | ✅          | ❌      |
| Create                | ✅      | ✅            | ❌          | ❌      |
| Edit                  | ✅      | ✅            | ❌          | ❌      |
| Delete                | ✅      | ✅            | ❌          | ❌      |
| Add/remove work items | ✅      | ✅            | ❌          | ❌      |

## 25. Recurring Work Items

All recurring work item endpoints gated by `FeatureFlag.RECURRING_WORKITEMS`.

| Action | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------ | ------- | ------------- | ----------- | ------- |
| View   | ✅      | ✅            | ❌          | ❌      |
| Create | ✅      | ✅            | ❌          | ❌      |
| Edit   | ✅      | ✅            | ❌          | ❌      |
| Delete | ✅      | ✅            | ❌          | ❌      |

## 26. Project Assets

| Action          | P-Admin | P-Contributor | P-Commenter | P-Guest |
| --------------- | ------- | ------------- | ----------- | ------- |
| View / Download | ✅      | ✅            | ✅          | ✅      |
| Create / Upload | ✅      | ✅            | ✅          | ❌      |
| Edit (own)      | ✅      | +Creator      | +Creator    | ❌      |
| Delete (own)    | ✅      | +Creator      | +Creator    | ❌      |

## 27. Project Links

| Action | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------ | ------- | ------------- | ----------- | ------- |
| View   | ✅      | ✅            | ✅          | ❌      |
| Create | ✅      | ✅            | ❌          | ❌      |
| Edit   | ✅      | ✅            | ❌          | ❌      |

> `project_link:delete` not explicitly granted to contributor in `system_roles.py`.

## 28. Project Updates

| Action        | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------------- | ------- | ------------- | ----------- | ------- |
| View          | ✅      | ✅            | ✅          | ✅      |
| Create        | ✅      | ✅            | ❌          | ❌      |
| Edit          | ✅      | +Creator      | ❌          | ❌      |
| Delete        | ✅      | +Creator      | ❌          | ❌      |
| Comment       | ✅      | ✅            | ❌          | ❌      |
| React         | ✅      | ✅            | ✅          | ❌      |
| Comment React | ✅      | ✅            | ✅          | ❌      |

> P-Guest has `project_update:view` and `project_update_comment:view`.
> P-Commenter has `project_update:react` and `project_update_comment:react` — can react to updates and update comments but cannot create/edit/delete them.

## 29. Project Templates

### Workitem Templates

| Action | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------ | ------- | ------------- | ----------- | ------- |
| View   | ✅      | ✅            | ❌          | ❌      |
| Create | ✅      | ❌            | ❌          | ❌      |
| Edit   | ✅      | ❌            | ❌          | ❌      |
| Delete | ✅      | ❌            | ❌          | ❌      |

### Page Templates

| Action | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------ | ------- | ------------- | ----------- | ------- |
| View   | ✅      | ✅            | ❌          | ❌      |
| Create | ✅      | ❌            | ❌          | ❌      |
| Edit   | ✅      | ❌            | ❌          | ❌      |
| Delete | ✅      | ❌            | ❌          | ❌      |

## 30. Project Worklogs

| Action | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------ | ------- | ------------- | ----------- | ------- |
| View   | ✅      | ❌            | ❌          | ❌      |
| Export | ✅      | ❌            | ❌          | ❌      |

> Uses `project:manage` — admin-only.

## 31. Issue Properties

| Action | P-Admin | P-Contributor | P-Commenter | P-Guest |
| ------ | ------- | ------------- | ----------- | ------- |
| View   | ✅      | ✅            | ✅          | ❌      |
| Create | ✅      | ✅            | ❌          | ❌      |
| Edit   | ✅      | ✅            | ❌          | ❌      |
| Delete | ✅      | ✅            | ❌          | ❌      |

---

# Teamspace Features

Teamspace access requires **teamspace membership** (separate from workspace/project membership). W-Owner has full bypass via `*`. W-Admin has resource wildcards at workspace level (e.g., `teamspace_comment:*`).

## 1. Teamspace Content

| Action           | W-Owner | W-Admin | TS-Member | TS-Member+Lead |
| ---------------- | ------- | ------- | --------- | -------------- |
| View             | ✅ `*`  | ✅      | ✅        | ✅             |
| Edit             | ✅ `*`  | ❌      | ❌        | ✅ +Lead       |
| Delete           | ✅ `*`  | ❌      | ❌        | ✅ +Lead       |
| Manage (members) | ✅ `*`  | ❌      | ❌        | ✅ +Lead       |

> W-Admin lost `teamspace:edit`/`teamspace:delete`/`teamspace:manage` — these now resolve in the teamspace namespace and require LEAD condition.

## 2. Teamspace Comments

| Action           | W-Owner | W-Admin | TS-Member         | TS-Member+Lead |
| ---------------- | ------- | ------- | ----------------- | -------------- |
| View             | ✅ `*`  | ✅      | ✅                | ✅             |
| Create           | ✅ `*`  | ✅      | ✅                | ✅             |
| Edit (own)       | ✅ `*`  | ✅      | ✅ (creator only) | ✅             |
| Delete (own/any) | ✅ `*`  | ✅      | ✅ (creator only) | ✅ (any)       |
| React            | ✅ `*`  | ✅      | ✅                | ✅             |

> Inline check: non-creators fall back to admin/lead check for edit/delete.

## 3. Teamspace Views

| Action           | W-Owner | W-Admin | TS-Member       | TS-Member+Lead |
| ---------------- | ------- | ------- | --------------- | -------------- |
| View             | ✅ `*`  | ✅      | ✅              | ✅             |
| Create           | ✅ `*`  | ✅      | ✅              | ✅             |
| Edit (own/any)   | ✅ `*`  | ✅      | ✅ (owner only) | ✅ (any)       |
| Delete (own/any) | ✅ `*`  | ✅      | ✅ (owner only) | ✅ (any)       |

> Inline check: non-owners fall back to admin/lead check for edit/delete.

## 4. Teamspace Pages

| Action              | W-Owner | W-Admin | TS-Member          | TS-Member+Lead |
| ------------------- | ------- | ------- | ------------------ | -------------- |
| View                | ✅ `*`  | ✅      | ✅                 | ✅             |
| Create              | ✅ `*`  | ✅      | ✅                 | ✅             |
| Edit                | ✅ `*`  | ✅      | ✅ (collaborative) | ✅             |
| Delete              | ✅ `*`  | ✅      | ✅ (owner only)    | ✅ (any)       |
| Archive / Unarchive | ✅ `*`  | ✅      | ✅ (owner only)    | ✅ (any)       |
| Lock / Unlock       | ✅ `*`  | ✅      | ✅ (owner only)    | ✅ (any)       |

> Edit is collaborative (any member can edit). Delete/archive/lock restricted to owner or lead.

## 5. Teamspace Page Comments

| Action              | W-Owner | W-Admin | TS-Member         | TS-Member+Lead |
| ------------------- | ------- | ------- | ----------------- | -------------- |
| View                | ✅ `*`  | ✅      | ✅                | ✅             |
| Create              | ✅ `*`  | ✅      | ✅                | ✅             |
| Edit (own/any)      | ✅ `*`  | ✅      | ✅ (creator only) | ✅ (any)       |
| Delete (own/any)    | ✅ `*`  | ✅      | ✅ (creator only) | ✅ (any)       |
| React               | ✅ `*`  | ✅      | ✅                | ✅             |
| Resolve / Unresolve | ✅ `*`  | ✅      | ✅                | ✅             |

---

# Quick-Reference Summary

## Workspace Roles at a Glance

| Feature Category      | W-Owner | W-Admin       | W-Member             | W-Guest          |
| --------------------- | ------- | ------------- | -------------------- | ---------------- |
| Workspace Settings    | Full    | Edit/Manage   | View                 | View             |
| Members & Invitations | Full    | Full          | View                 | View             |
| Projects              | Full    | Browse/Create | Browse               | —                |
| Wiki Pages            | Full    | Full          | Full (CRUD)          | —                |
| Workspace Views       | Full    | Full          | View/Create/+Creator | View (own)       |
| Initiatives           | Full    | Full          | View/React/Comment   | —                |
| Teamspaces            | Full    | Browse/Create | Browse               | —                |
| Dashboards            | Full    | Full          | View                 | —                |
| Analytics             | Full    | View/Export   | View/Export          | —                |
| Drafts                | Full    | Full          | Full (CRUD)          | View/Create/Edit |
| Integrations          | Full    | Full          | View/CRUD/Connect    | —                |
| Webhooks              | Full    | Full          | —                    | —                |
| API Tokens            | Full    | Full          | View/Create/Delete   | —                |
| Customers             | Full    | Full          | —                    | —                |
| Assets                | Full    | Full          | View/Create          | View             |
| Templates             | Full    | Full          | View (+Use)          | —                |
| AI                    | Full    | Full          | Full                 | —                |
| Favorites             | Full    | Full          | Full                 | —                |
| Activity & Worklogs   | Full    | View/Export   | View/Export          | —                |
| Features & States     | Full    | Full          | View/CUD             | View             |

## Project Roles at a Glance

| Feature Category        | P-Admin     | P-Contributor          | P-Commenter         | P-Guest         |
| ----------------------- | ----------- | ---------------------- | ------------------- | --------------- |
| Issues                  | Full        | CRUD (+Creator delete) | View/Edit own/React | View own only   |
| Comments                | Full (any)  | Create/+Creator        | Create/+Creator     | React only      |
| Attachments             | Full        | Create/+Creator        | View/Create         | View            |
| Links                   | Full        | Full CRUD              | View                | —               |
| Relations               | Full        | View/Create/Delete     | View                | —               |
| Epics                   | Full        | CRUD (+Creator delete) | View                | —               |
| Cycles                  | Full        | CRUD (+Creator delete) | View                | —               |
| Modules                 | Full        | CRUD (+Creator delete) | View                | —               |
| Pages                   | Full        | View/Create/Edit       | View                | View            |
| Views                   | Full        | Create/Edit/+Creator   | View                | View            |
| Intake                  | Full        | Create/View/+Creator   | Create/View         | Create/View own |
| Labels/States/Estimates | Full        | View                   | View                | View            |
| Project Settings        | Full        | View                   | View                | View            |
| Members                 | Full        | View/Leave             | View/Leave          | View/Leave      |
| Activity                | Full        | View                   | View                | View            |
| Analytics               | Full        | View/Export            | View                | —               |
| Automations             | Full        | View                   | —                   | —               |
| Workflows               | Full (edit) | View                   | View                | View            |
| Milestones              | Full        | CRUD                   | View                | —               |
| Recurring Items         | Full        | Full CRUD              | —                   | —               |
| Assets                  | Full        | Create/+Creator        | Create/+Creator     | View            |
| Templates               | Full        | View                   | —                   | —               |
| Worklogs                | View/Export | —                      | —                   | —               |
