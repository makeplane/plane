# Permission Matrix — Current State Reference

This document shows **who can do what** for every endpoint that has been migrated to the `@can` permission system. It is the current-state reference for auditing and reviewing access control.

**Related documents:**

- `PERMISSION_MIGRATION.md` — tracks old→new migration changes per endpoint
- `designs/permissions/plan-view-migration.md` — view inventory and migration status
- `apps/api/plane/permissions/system_roles.py` — source of truth for role→permission mappings

## How to Read the Matrix

- **Permission Checked** — the exact `@can(...)` permission string the endpoint checks
- Each role column shows ✅ with the **granting permission string** from `system_roles.py` (e.g., `workitem:*` wildcard vs explicit `workitem:view`)
- ❌ means the role does not have this permission
- **+Creator** — conditional grant (`Permission & Condition.CREATOR`) in `system_roles.py`; the role doesn't have the unconditional permission, but creators with active project membership can perform the action. The engine evaluates this automatically via `_role_get_conditions` / `_evaluate_condition`.
- **+Creator (deferred)** — conditional grant with `defer_conditions=True` on list endpoints; the decorator passes the gate, and the view filters the queryset to only return resources created by the user. Used for project-level `workitem:view` checks where the condition can't be evaluated against the project.
- **Inline Creator Check** — view method checks `created_by_id != request.user.id` after the decorator; only the creator can perform this action, admin cannot override (used by workspace/project view EDIT endpoints)
- W-Owner always has `*` (full wildcard); W-Admin always has the resource wildcard (e.g., `workitem:*`, `cycle:*`)
- W-Member and W-Guest are omitted from project-level tables — they have no project content access without explicit project membership

## Role Reference

### Workspace Roles

| Role   | Level | Description                                                                           |
| ------ | ----- | ------------------------------------------------------------------------------------- |
| Owner  | 25    | Full control including workspace deletion and transfer (`*` wildcard)                 |
| Admin  | 20    | Manage workspace settings, users, projects, integrations (Business/Enterprise only)   |
| Member | 15    | View workspace, browse projects; no project content access without project membership |
| Guest  | 5     | View workspace only; no project browsing without explicit project membership          |

### Project Roles

| Role        | Level | Description                                                                                   |
| ----------- | ----- | --------------------------------------------------------------------------------------------- |
| Admin       | 20    | Full control over project settings, members, and all content (resource wildcards)             |
| Contributor | 15    | Create/edit issues, modules, cycles, pages, views; delete own content via `+Creator`          |
| Commenter   | 10    | View issues, add comments and reactions; create intake issues                                 |
| Guest       | 5     | View pages/views, submit intake forms, add attachments; view own intake issues via `+Creator` |

---

## Workspace-Level Endpoints

### Workspace CRUD — `WorkSpaceViewSet`

| Action             | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| ------------------ | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| Create workspace   | (auth only)        | N/A ¹   | N/A ¹               | N/A ¹               | N/A ¹               |
| Retrieve workspace | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Update workspace   | `workspace:edit`   | ✅ `*`  | ✅ `workspace:edit` | ❌                  | ❌                  |
| Delete workspace   | `workspace:delete` | ✅ `*`  | ❌ ²                | ❌                  | ❌                  |

> ¹ Any authenticated user can create a workspace (no workspace-level role required). The user becomes owner automatically. Subject to `DISABLE_WORKSPACE_CREATION` instance config.
> ² Workspace Admin does not have `workspace:delete`. Only the workspace Owner can delete. This is intentional — on Business/Enterprise plans, admins cannot delete the workspace.

### Workspace Stickies — `WorkspaceStickyViewSet`

All actions check `workspace:view`. Stickies are user-scoped — queryset filters to `owner=request.user`.

| Action          | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| --------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| List stickies   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Create sticky   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Retrieve sticky | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Update sticky   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Delete sticky   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

### Workspace Issues — `WorkspaceViewIssuesViewSet`

| Action                | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| --------------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| List workspace issues | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

> **Note:** Data-level filtering uses `permission_engine.get_accessible_resources()` to scope issues to projects the user has access to.

### Workspace Views — `WorkspaceViewViewSet`

| Action        | Permission Checked                 | W-Owner                          | W-Admin                          | W-Member                            | W-Guest                             |
| ------------- | ---------------------------------- | -------------------------------- | -------------------------------- | ----------------------------------- | ----------------------------------- |
| List views    | `workspace_workitem_view:view`     | ✅ `*`                           | ✅ `workspace_workitem_view:*`   | ✅ `workspace_workitem_view:view`   | ✅ `workspace_workitem_view:view` ³ |
| Create view   | `workspace_workitem_view:create`   | ✅ `*`                           | ✅ `workspace_workitem_view:*`   | ✅ `workspace_workitem_view:create` | ❌                                  |
| Retrieve view | `workspace_workitem_view:view`     | ✅ `*`                           | ✅ `workspace_workitem_view:*`   | ✅ `workspace_workitem_view:view`   | ✅ `workspace_workitem_view:view`   |
| Update view   | `workspace_workitem_view:edit` ¹   | ✅ `workspace_workitem_view:*` ¹ | ✅ `workspace_workitem_view:*` ¹ | +Creator ¹                          | ❌                                  |
| Delete view   | `workspace_workitem_view:delete` ² | ✅ `*`                           | ✅ `workspace_workitem_view:*`   | +Creator                            | ❌                                  |

> ¹ Inline private-view check — the decorator checks EDIT permission (owner/admin pass via wildcard, member passes via `workspace_workitem_view:edit+creator` conditional grant), then for **private** views (`access == 0`) the view method enforces `created_by_id == request.user.id`. Public views can be edited by anyone with the permission.
> ² Inline private-view check on delete — same rule: `access == 0` requires creator; otherwise conditional `+creator` grant in `system_roles.py` applies (admin/owner via wildcard OR creator with active workspace membership).
> ³ Data-level filter: `list` also checks `workspace_workitem_view:create` inline — users without it only see their own views (not public views)

### Notifications — `NotificationViewSet`

All actions check `workspace:view`. Notifications are user-scoped — all queries filter to `receiver=request.user`.

| Action                 | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| ---------------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| List notifications     | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Update notification    | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Mark read              | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Mark unread            | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Archive notification   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Unarchive notification | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Retrieve notification  | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Delete notification    | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

> **Data-level filter:** `list` also checks `WorkspaceMember.role__lt=15` inline — workspace guests are excluded from "created" type notifications. This is a business logic filter, not a permission gate.

### Inbox (Stacked Notifications) — `InboxViewSet`

All actions check `workspace:view`. Inbox items are user-scoped — queryset filters to `receiver=request.user`. Methods `partial_update`, `mark_read`, and `mark_unread` are also gated by `@check_feature_flag(FeatureFlag.INBOX_STACKING)`.

| Action          | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| --------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| Update inbox    | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Mark read       | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Mark unread     | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Archive inbox   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Unarchive inbox | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

### Unread Notifications — `UnreadNotificationEndpoint`

| Action            | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| ----------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| Get unread counts | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

### Mark All Read — `MarkAllReadNotificationViewSet`

| Action                      | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| --------------------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| Mark all notifications read | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

> **Data-level filter:** `create` also checks `WorkspaceMember.role__lt=15` inline — workspace guests are excluded from "created" type notifications when marking all as read. Same business logic filter as `NotificationViewSet.list`.

### Project Collection — `ProjectViewSet`

| Action                 | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| ---------------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| List projects          | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| List projects (detail) | `project:browse`   | ✅ `*`  | ✅ `project:browse` | ✅ `project:browse` | ❌                  |
| Retrieve project       | `workspace:view` ¹ | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Create project         | `project:create`   | ✅ `*`  | ✅ `project:create` | ❌                  | ❌                  |

> ¹ Retrieve also does an inline `has_permission(ProjectPermissions.VIEW, pk)` check to differentiate 403 (secret project) vs 409 (public, not a member) for the frontend join-project flow.

### Webhooks — `WebhookEndpoint` / `WebhookSecretRegenerateEndpoint` / `WebhookLogsEndpoint`

| Action            | Permission Checked | W-Owner | W-Admin        | W-Member | W-Guest |
| ----------------- | ------------------ | ------- | -------------- | -------- | ------- |
| List webhooks     | `webhook:view`     | ✅ `*`  | ✅ `webhook:*` | ❌       | ❌      |
| Retrieve webhook  | `webhook:view`     | ✅ `*`  | ✅ `webhook:*` | ❌       | ❌      |
| Create webhook    | `webhook:create`   | ✅ `*`  | ✅ `webhook:*` | ❌       | ❌      |
| Update webhook    | `webhook:edit`     | ✅ `*`  | ✅ `webhook:*` | ❌       | ❌      |
| Delete webhook    | `webhook:delete`   | ✅ `*`  | ✅ `webhook:*` | ❌       | ❌      |
| Regenerate secret | `webhook:edit`     | ✅ `*`  | ✅ `webhook:*` | ❌       | ❌      |
| View webhook logs | `webhook:view`     | ✅ `*`  | ✅ `webhook:*` | ❌       | ❌      |

### Project Identifiers — `ProjectIdentifierEndpoint`

| Action            | Permission Checked | W-Owner | W-Admin             | W-Member | W-Guest |
| ----------------- | ------------------ | ------- | ------------------- | -------- | ------- |
| Get identifiers   | `project:create`   | ✅ `*`  | ✅ `project:create` | ❌       | ❌      |
| Delete identifier | `project:create`   | ✅ `*`  | ✅ `project:create` | ❌       | ❌      |

### Quick Links — `QuickLinkViewSet`

All actions check `workspace:view`. Quick links are user-scoped — queryset filters to `owner=request.user`.

| Action              | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| ------------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| List quick links    | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Create quick link   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Retrieve quick link | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Update quick link   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Delete quick link   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

### Recent Visits — `UserRecentVisitViewSet`

All actions check `workspace:view`. Recent visits are user-scoped — queryset filters to `user=request.user`.

| Action             | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| ------------------ | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| List recent visits | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

### Home Preferences — `WorkspaceHomePreferenceViewSet`

All actions check `workspace:view`. Preferences are user-scoped — queryset filters to `user=request.user`.

| Action                 | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| ---------------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| Get home preferences   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Update home preference | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

### Sidebar Preferences — `WorkspaceUserPreferenceViewSet`

All actions check `workspace:view`. Preferences are user-scoped — queryset filters to `user=request.user`.

| Action                     | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| -------------------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| Get sidebar preferences    | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Update sidebar preferences | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

### Project Favorites — `ProjectFavoritesViewSet`

Workspace-level permission used intentionally — favorites are personal, user-scoped operations.

| Action               | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| -------------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| List favorites       | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Favorite a project   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Unfavorite a project | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

### Project Join — `UserProjectJoinEndpoint`

| Action        | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest |
| ------------- | ------------------ | ------- | ------------------- | ------------------- | ------- |
| Join projects | `project:browse`   | ✅ `*`  | ✅ `project:browse` | ✅ `project:browse` | ❌      |

### Initiatives — `InitiativeEndpoint` / `InitiativeProjectEndpoint` / Analytics

All initiative endpoints are gated by `@check_feature_flag(FeatureFlag.INITIATIVES)`.

| Action               | Permission Checked  | W-Owner | W-Admin           | W-Member             | W-Guest |
| -------------------- | ------------------- | ------- | ----------------- | -------------------- | ------- |
| List initiatives     | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| Retrieve initiative  | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| Create initiative    | `initiative:create` | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| Update initiative    | `initiative:edit`   | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| Delete initiative    | `initiative:delete` | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| View projects        | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| Add/remove projects  | `initiative:edit`   | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| View analytics       | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| View workspace stats | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| View epic analytics  | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| View progress        | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| View activities      | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |

### Initiative Comments — `InitiativeCommentViewSet` / `InitiativeCommentReactionViewSet`

All initiative comment endpoints are gated by `@check_feature_flag(FeatureFlag.INITIATIVES)`.

| Action           | Permission Checked          | W-Owner | W-Admin                   | W-Member                                          | W-Guest |
| ---------------- | --------------------------- | ------- | ------------------------- | ------------------------------------------------- | ------- |
| Create comment   | `initiative_comment:create` | ✅ `*`  | ✅ `initiative_comment:*` | ✅ `initiative_comment:create`                    | ❌      |
| Edit comment     | `initiative_comment:edit`   | ✅ `*`  | ✅ `initiative_comment:*` | ✅ `initiative_comment:edit+creator` (own only)   | ❌      |
| Delete comment   | `initiative_comment:delete` | ✅ `*`  | ✅ `initiative_comment:*` | ✅ `initiative_comment:delete+creator` (own only) | ❌      |
| React to comment | `initiative_comment:react`  | ✅ `*`  | ✅ `initiative_comment:*` | ✅ `initiative_comment:react`                     | ❌      |

### Initiative Attachments — `InitiativeAttachmentEndpoint`

All initiative attachment endpoints are gated by `@check_feature_flag(FeatureFlag.INITIATIVES)`.

| Action            | Permission Checked             | W-Owner | W-Admin                      | W-Member                                               | W-Guest |
| ----------------- | ------------------------------ | ------- | ---------------------------- | ------------------------------------------------------ | ------- |
| Upload attachment | `initiative_attachment:create` | ✅ `*`  | ✅ `initiative_attachment:*` | ✅ `initiative_attachment:create`                      | ❌      |
| List attachments  | `initiative_attachment:view`   | ✅ `*`  | ✅ `initiative_attachment:*` | ✅ `initiative_attachment:view`                        | ❌      |
| Mark uploaded     | `initiative_attachment:edit`   | ✅ `*`  | ✅ `initiative_attachment:*` | ✅ `initiative_attachment:edit`                        | ❌      |
| Delete attachment | `initiative_attachment:delete` | ✅ `*`  | ✅ `initiative_attachment:*` | ✅ `initiative_attachment:delete+creator` (own only) ¹ | ❌      |

> ¹ `defer_conditions=True` — Member delete uses deferred `+creator` condition checked inline in the view method. Admin deletes any attachment unconditionally.

### Initiative Epics — `InitiativeEpicViewSet` / `InitiativeEpicIssueViewSet`

Uses existing `InitiativePermissions` (no separate resource type). Managing an initiative's epic scope is an edit operation on the initiative itself.

| Action      | Permission Checked | W-Owner | W-Admin           | W-Member             | W-Guest |
| ----------- | ------------------ | ------- | ----------------- | -------------------- | ------- |
| List epics  | `initiative:view`  | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| Add epics   | `initiative:edit`  | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| Remove epic | `initiative:edit`  | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| List issues | `initiative:view`  | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |

### Initiative Reactions — `InitiativeReactionViewSet`

| Action          | Permission Checked | W-Owner | W-Admin           | W-Member              | W-Guest |
| --------------- | ------------------ | ------- | ----------------- | --------------------- | ------- |
| List reactions  | `initiative:view`  | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view`  | ❌      |
| Add reaction    | `initiative:react` | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:react` | ❌      |
| Remove reaction | `initiative:react` | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:react` | ❌      |

### Initiative Labels — `InitiativeLabelsEndpoint`

| Action       | Permission Checked  | W-Owner | W-Admin           | W-Member             | W-Guest |
| ------------ | ------------------- | ------- | ----------------- | -------------------- | ------- |
| List labels  | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| Create label | `initiative:manage` | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| Update label | `initiative:manage` | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| Delete label | `initiative:manage` | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |

> W-Member loses CUD — `initiative:manage` is admin-only (consistent with workspace labels pattern).

### Initiative Links — `InitiativeLinkViewSet`

| Action      | Permission Checked       | W-Owner | W-Admin                | W-Member                    | W-Guest |
| ----------- | ------------------------ | ------- | ---------------------- | --------------------------- | ------- |
| List links  | `initiative_link:view`   | ✅ `*`  | ✅ `initiative_link:*` | ✅ `initiative_link:view`   | ❌      |
| Create link | `initiative_link:create` | ✅ `*`  | ✅ `initiative_link:*` | ✅ `initiative_link:create` | ❌      |
| Update link | `initiative_link:edit`   | ✅ `*`  | ✅ `initiative_link:*` | ✅ `initiative_link:edit`   | ❌      |
| Delete link | `initiative_link:delete` | ✅ `*`  | ✅ `initiative_link:*` | ✅ `initiative_link:delete` | ❌      |

### Initiative Updates — `InitiativeUpdateViewSet`

| Action       | Permission Checked       | W-Owner | W-Admin                  | W-Member                    | W-Guest |
| ------------ | ------------------------ | ------- | ------------------------ | --------------------------- | ------- |
| View updates | `initiative_update:view` | ✅ `*`  | ✅ `initiative_update:*` | ✅ `initiative_update:view` | ❌      |

### Initiative Update Comments — `InitiativeUpdateCommentsViewSet`

| Action         | Permission Checked                 | W-Owner | W-Admin                          | W-Member                              | W-Guest |
| -------------- | ---------------------------------- | ------- | -------------------------------- | ------------------------------------- | ------- |
| View comments  | `initiative_update:view`           | ✅ `*`  | ✅ `initiative_update:*`         | ✅ `initiative_update:view`           | ❌      |
| Create comment | `initiative_update_comment:create` | ✅ `*`  | ✅ `initiative_update_comment:*` | ✅ `initiative_update_comment:create` | ❌      |

### Initiative Update Reactions — `InitiativeUpdatesReactionViewSet`

| Action          | Permission Checked        | W-Owner | W-Admin                  | W-Member                     | W-Guest |
| --------------- | ------------------------- | ------- | ------------------------ | ---------------------------- | ------- |
| Add reaction    | `initiative_update:react` | ✅ `*`  | ✅ `initiative_update:*` | ✅ `initiative_update:react` | ❌      |
| Remove reaction | `initiative_update:react` | ✅ `*`  | ✅ `initiative_update:*` | ✅ `initiative_update:react` | ❌      |

### Initiative User Properties — `InitiativeUserPropertiesEndpoint`

| Action           | Permission Checked | W-Owner | W-Admin           | W-Member             | W-Guest |
| ---------------- | ------------------ | ------- | ----------------- | -------------------- | ------- |
| Get properties   | `initiative:view`  | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| Patch properties | `initiative:view`  | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |

> `initiative:view` for PATCH — personal user display settings, not initiative data modification.

### Teamspaces — `TeamspaceEndpoint`

| Action      | Permission Checked | W-Owner | W-Admin          | W-Member              | W-Guest | TS-Member | TS-Member+Lead |
| ----------- | ------------------ | ------- | ---------------- | --------------------- | ------- | --------- | -------------- |
| List/Browse | `teamspace:browse` | ✅ `*`  | ✅ `teamspace:*` | ✅ `teamspace:browse` | ❌      | ✅        | ✅             |
| Create      | `teamspace:create` | ✅ `*`  | ✅ `teamspace:*` | ❌                    | ❌      | —         | —              |
| Update      | `teamspace:edit`   | ✅ `*`  | ✅ `teamspace:*` | ❌                    | ❌      | ❌        | ✅ +Lead       |
| Delete      | `teamspace:delete` | ✅ `*`  | ✅ `teamspace:*` | ❌                    | ❌      | ❌        | ✅ +Lead       |

> Workspace admin has `teamspace:*` (wildcard) via the workspace-level admin role — the engine walks the teamspace→workspace hierarchy and resolves admin's grant at the workspace level. W-Member edit/delete require teamspace membership with LEAD condition.

### Teamspace Members — `TeamspaceMembersEndpoint`

| Action        | Permission Checked | W-Owner | W-Admin          | W-Member              | W-Guest | TS-Member | TS-Member+Lead |
| ------------- | ------------------ | ------- | ---------------- | --------------------- | ------- | --------- | -------------- |
| List/Browse   | `teamspace:browse` | ✅ `*`  | ✅ `teamspace:*` | ✅ `teamspace:browse` | ❌      | ✅        | ✅             |
| Add members   | `teamspace:manage` | ✅ `*`  | ✅ `teamspace:*` | ❌                    | ❌      | ❌        | ✅ +Lead       |
| Remove member | `teamspace:manage` | ✅ `*`  | ✅ `teamspace:*` | ❌                    | ❌      | ❌        | ✅ +Lead       |

> Workspace admin manages teamspace members via `teamspace:*` at the workspace level (hierarchy traversal). W-Member manage requires teamspace membership with LEAD condition.

### Teamspace Projects — `AddTeamspaceProjectEndpoint`

URL: `POST /workspaces/<slug>/projects/<project_id>/teamspaces/`

This endpoint is project-centric (URL contains `project_id`), so it checks project-level permissions.

| Action         | Permission Checked | P-Admin        | P-Contributor | P-Commenter | P-Guest | W-Owner | W-Admin        |
| -------------- | ------------------ | -------------- | ------------- | ----------- | ------- | ------- | -------------- |
| Add teamspaces | `project:manage`   | ✅ `project:*` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `project:*` |

> W-Admin access **broadened**: old `@allow_permission([ROLE.ADMIN])` required W-Admin to have project/teamspace membership for the bypass; new `project:manage` via `project:*` at workspace level removes that requirement.
>
> Feature-flag gated: `@check_feature_flag(FeatureFlag.TEAMSPACES)` — added for consistency with all other teamspace endpoints.

### Workspace Estimates — `WorkspaceEstimatesEndpoint`

| Action         | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| -------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| List estimates | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

> **Note:** Uses `.accessible_to(request.user.id, slug)` to scope results to the user's accessible projects. Also filters out estimates from archived projects.

### Workspace Cycles / Modules / States / Search / Project Members / User Roles — Batch

All workspace-level GET-only endpoints. Every workspace role has `workspace:view`.

| Endpoint                         | Action               | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| -------------------------------- | -------------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| `WorkspaceCyclesEndpoint`        | List cycles          | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| `WorkspaceModulesEndpoint`       | List modules         | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| `WorkspaceStatesEndpoint`        | List states          | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| `WorkspaceSearchEndpoint`        | Search workspace     | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| `WorkspaceProjectMemberEndpoint` | List project members | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| `UserProjectRolesEndpoint`       | Get user roles       | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

> Cycles, modules, and states all use `.accessible_to()` — properly scoped to the user's accessible projects. Cycles and modules also filter out archived projects. Search, project members, and user roles are user-scoped.

### Work Item Relation Definitions — `WorkItemRelationDefinitionViewSet`

Workspace-scoped resource: `WORKITEM_RELATION` (child of `WORKSPACE`). Manages custom relation type definitions.

| Action                     | Permission Checked         | W-Owner | W-Admin                  | W-Member                      | W-Guest                     |
| -------------------------- | -------------------------- | ------- | ------------------------ | ----------------------------- | --------------------------- |
| List relation definitions  | `workitem_relation:view`   | ✅ `*`  | ✅ `workitem_relation:*` | ✅ `workitem_relation:view`   | ✅ `workitem_relation:view` |
| Retrieve definition        | `workitem_relation:view`   | ✅ `*`  | ✅ `workitem_relation:*` | ✅ `workitem_relation:view`   | ✅ `workitem_relation:view` |
| Create relation definition | `workitem_relation:create` | ✅ `*`  | ✅ `workitem_relation:*` | ✅ `workitem_relation:create` | ❌                          |
| Edit relation definition   | `workitem_relation:edit`   | ✅ `*`  | ✅ `workitem_relation:*` | ✅ `workitem_relation:edit`   | ❌                          |
| Delete relation definition | `workitem_relation:delete` | ✅ `*`  | ✅ `workitem_relation:*` | ✅ `workitem_relation:delete` | ❌                          |

> **Repurposed resource:** `WORKITEM_RELATION` was changed from project-scoped (child of `WORKITEM`) to workspace-scoped (child of `WORKSPACE`). It now represents custom relation definitions (`WorkItemRelationDefinition` model), not issue-to-issue relations. EDIT action was added.
>
> **Role grant changes:** Project roles (Admin, Contributor, Commenter) no longer have `workitem_relation` grants — these moved to workspace roles. W-Admin has wildcard. W-Member has explicit VIEW/CREATE/EDIT/DELETE. W-Guest has VIEW only.

### Releases — `ReleaseEndpoint` / `ReleaseTagEndpoint` / `ReleaseLabelEndpoint` / `ReleaseWorkItemEndpoint` / `ReleaseChangelogEndpoint` / `ReleasePageEndpoint` / `ReleaseAttachmentEndpoint` / `ReleaseActivityEndpoint` / `ReleaseLinkViewSet`

Workspace-scoped resource: `RELEASE`. New resource type with actions VIEW, CREATE, EDIT, DELETE.

| Action               | Permission Checked | W-Owner | W-Admin        | W-Member            | W-Guest           |
| -------------------- | ------------------ | ------- | -------------- | ------------------- | ----------------- |
| List releases        | `release:view`     | ✅ `*`  | ✅ `release:*` | ✅ `release:view`   | ✅ `release:view` |
| Retrieve release     | `release:view`     | ✅ `*`  | ✅ `release:*` | ✅ `release:view`   | ✅ `release:view` |
| Create release       | `release:create`   | ✅ `*`  | ✅ `release:*` | ✅ `release:create` | ❌                |
| Update release       | `release:edit`     | ✅ `*`  | ✅ `release:*` | ✅ `release:edit`   | ❌                |
| Delete release       | `release:delete`   | ✅ `*`  | ✅ `release:*` | ✅ `release:delete` | ❌                |
| List/view tags       | `release:view`     | ✅ `*`  | ✅ `release:*` | ✅ `release:view`   | ✅ `release:view` |
| Create tag           | `release:create`   | ✅ `*`  | ✅ `release:*` | ✅ `release:create` | ❌                |
| Update tag           | `release:edit`     | ✅ `*`  | ✅ `release:*` | ✅ `release:edit`   | ❌                |
| Delete tag           | `release:delete`   | ✅ `*`  | ✅ `release:*` | ✅ `release:delete` | ❌                |
| List/view labels     | `release:view`     | ✅ `*`  | ✅ `release:*` | ✅ `release:view`   | ✅ `release:view` |
| Create label         | `release:create`   | ✅ `*`  | ✅ `release:*` | ✅ `release:create` | ❌                |
| Update label         | `release:edit`     | ✅ `*`  | ✅ `release:*` | ✅ `release:edit`   | ❌                |
| Delete label         | `release:delete`   | ✅ `*`  | ✅ `release:*` | ✅ `release:delete` | ❌                |
| List work items      | `release:view`     | ✅ `*`  | ✅ `release:*` | ✅ `release:view`   | ✅ `release:view` |
| Add work items       | `release:create`   | ✅ `*`  | ✅ `release:*` | ✅ `release:create` | ❌                |
| Remove work item     | `release:delete`   | ✅ `*`  | ✅ `release:*` | ✅ `release:delete` | ❌                |
| List comments        | `release:view`     | ✅ `*`  | ✅ `release:*` | ✅ `release:view`   | ✅ `release:view` |
| Create comment       | `release:create`   | ✅ `*`  | ✅ `release:*` | ✅ `release:create` | ❌                |
| Update comment       | `release:edit` ¹   | ✅ `*`  | ✅ `release:*` | ✅ `release:edit`   | ❌                |
| Delete comment       | `release:delete` ¹ | ✅ `*`  | ✅ `release:*` | ✅ `release:delete` | ❌                |
| List reactions       | `release:view`     | ✅ `*`  | ✅ `release:*` | ✅ `release:view`   | ✅ `release:view` |
| Add reaction         | `release:view`     | ✅ `*`  | ✅ `release:*` | ✅ `release:view`   | ✅ `release:view` |
| Remove reaction      | `release:view`     | ✅ `*`  | ✅ `release:*` | ✅ `release:view`   | ✅ `release:view` |
| List/view changelogs | `release:view`     | ✅ `*`  | ✅ `release:*` | ✅ `release:view`   | ✅ `release:view` |
| Create changelog     | `release:create`   | ✅ `*`  | ✅ `release:*` | ✅ `release:create` | ❌                |
| Update changelog     | `release:edit`     | ✅ `*`  | ✅ `release:*` | ✅ `release:edit`   | ❌                |
| Delete changelog     | `release:delete`   | ✅ `*`  | ✅ `release:*` | ✅ `release:delete` | ❌                |
| List pages           | `release:view`     | ✅ `*`  | ✅ `release:*` | ✅ `release:view`   | ✅ `release:view` |
| Add page             | `release:create`   | ✅ `*`  | ✅ `release:*` | ✅ `release:create` | ❌                |
| Remove page          | `release:delete`   | ✅ `*`  | ✅ `release:*` | ✅ `release:delete` | ❌                |
| List attachments     | `release:view`     | ✅ `*`  | ✅ `release:*` | ✅ `release:view`   | ✅ `release:view` |
| Upload attachment    | `release:create`   | ✅ `*`  | ✅ `release:*` | ✅ `release:create` | ❌                |
| Delete attachment    | `release:delete` ¹ | ✅ `*`  | ✅ `release:*` | ✅ `release:delete` | ❌                |
| List activities      | `release:view`     | ✅ `*`  | ✅ `release:*` | ✅ `release:view`   | ✅ `release:view` |
| Create link          | `release:create`   | ✅ `*`  | ✅ `release:*` | ✅ `release:create` | ❌                |
| Update link          | `release:edit`     | ✅ `*`  | ✅ `release:*` | ✅ `release:edit`   | ❌                |
| Delete link          | `release:delete`   | ✅ `*`  | ✅ `release:*` | ✅ `release:delete` | ❌                |

> ¹ Inline creator check — only the comment/attachment creator can edit/delete, regardless of role.

**Endpoints:** `ReleaseEndpoint` (base.py), `ReleaseTagEndpoint` (tag.py), `ReleaseLabelEndpoint` (label.py), `ReleaseWorkItemEndpoint` (work_item.py), `ReleaseCommentViewSet` / `ReleaseCommentReactionViewSet` (comment.py), `ReleaseChangelogEndpoint` (changelog.py), `ReleasePageEndpoint` (page.py), `ReleaseAttachmentEndpoint` (attachment.py), `ReleaseActivityEndpoint` (activity.py), `ReleaseLinkViewSet` (link.py)

---

## Project-Level Endpoints

### Issues

#### `IssueViewSet`

| Action         | Permission Checked  | P-Admin         | P-Contributor        | P-Commenter        | P-Guest    | W-Owner | W-Admin         |
| -------------- | ------------------- | --------------- | -------------------- | ------------------ | ---------- | ------- | --------------- |
| List issues    | `workitem:view`     | ✅ `workitem:*` | ✅ `workitem:view`   | ✅ `workitem:view` | +Creator ² | ✅ `*`  | ✅ `workitem:*` |
| Create issue   | `workitem:create`   | ✅ `workitem:*` | ✅ `workitem:create` | ❌                 | ❌         | ✅ `*`  | ✅ `workitem:*` |
| Retrieve issue | `workitem:view` ¹   | ✅ `workitem:*` | ✅ `workitem:view`   | ✅ `workitem:view` | +Creator   | ✅ `*`  | ✅ `workitem:*` |
| Update issue   | `workitem:edit` ¹   | ✅ `workitem:*` | ✅ `workitem:edit`   | +Creator           | +Creator   | ✅ `*`  | ✅ `workitem:*` |
| Delete issue   | `workitem:delete` ¹ | ✅ `workitem:*` | +Creator             | ❌                 | ❌         | ✅ `*`  | ✅ `workitem:*` |

> ¹ conditional `+creator` grant in `system_roles.py` — creators with active project membership can perform the action even if their role doesn't grant it.
>
> ² `defer_conditions=True` — guest sees only own issues via `created_by` queryset filter.

#### `IssueListEndpoint`

| Action               | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest    | W-Owner | W-Admin         |
| -------------------- | ------------------ | --------------- | ------------------ | ------------------ | ---------- | ------- | --------------- |
| List issues (by IDs) | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator ² | ✅ `*`  | ✅ `workitem:*` |

> ² `defer_conditions=True` — guest sees only own issues via `created_by` queryset filter.

#### `IssuePaginatedViewSet`

| Action                  | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest    | W-Owner | W-Admin         |
| ----------------------- | ------------------ | --------------- | ------------------ | ------------------ | ---------- | ------- | --------------- |
| List issues (paginated) | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator ² | ✅ `*`  | ✅ `workitem:*` |

> ² `defer_conditions=True` — guest sees only own issues via `created_by` queryset filter.

#### `WorkItemListProjectEndpoint`

| Action                         | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest    | W-Owner | W-Admin         |
| ------------------------------ | ------------------ | --------------- | ------------------ | ------------------ | ---------- | ------- | --------------- |
| List work items (w/ properties) | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator ² | ✅ `*`  | ✅ `workitem:*` |

> ² `defer_conditions=True` — guest sees only own issues via `created_by` queryset filter.

#### `WorkItemListWorkspaceEndpoint`

| Action                          | Permission Checked | P-Admin | P-Contributor | P-Commenter | P-Guest | W-Owner | W-Admin |
| ------------------------------- | ------------------ | ------- | ------------- | ----------- | ------- | ------- | ------- |
| List work items (workspace-scope) | `workspace:view`   | —       | —             | —           | —       | ✅ `*`  | ✅ `workspace:view` |

> Gate on workspace membership (matches `IssueDetailIdentifierEndpoint`). Queryset is already filtered to the workspace; the decorator just verifies the user can see the workspace.

#### `IssueVoteEndpoint`

| Action       | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest            | W-Owner | W-Admin         |
| ------------ | ------------------ | --------------- | ------------------ | ------------------ | ------------------ | ------- | --------------- |
| List votes   | `workitem:react`   | ✅ `workitem:*` | ✅ `workitem:react` | ✅ `workitem:react` | ✅ `workitem:react` | ✅ `*`  | ✅ `workitem:*` |
| Cast vote    | `workitem:react`   | ✅ `workitem:*` | ✅ `workitem:react` | ✅ `workitem:react` | ✅ `workitem:react` | ✅ `*`  | ✅ `workitem:*` |
| Remove vote  | `workitem:react`   | ✅ `workitem:*` | ✅ `workitem:react` | ✅ `workitem:react` | ✅ `workitem:react` | ✅ `*`  | ✅ `workitem:*` |

#### `WorkItemStateDurationEndpoint`

| Action                         | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest    | W-Owner | W-Admin         |
| ------------------------------ | ------------------ | --------------- | ------------------ | ------------------ | ---------- | ------- | --------------- |
| View state transition duration | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator   | ✅ `*`  | ✅ `workitem:*` |

> Inline guards additionally deny guests access to epics and non-owned items (preserved from legacy).

#### `WorkItemWorklogEndpoint` (External API — `api/views/worklog.py`)

| Action            | Permission Checked | P-Admin         | P-Contributor      | P-Commenter | P-Guest | W-Owner | W-Admin         |
| ----------------- | ------------------ | --------------- | ------------------ | ----------- | ------- | ------- | --------------- |
| Create worklog    | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌          | ❌      | ✅ `*`  | ✅ `workitem:*` |
| List worklogs     | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌          | ❌      | ✅ `*`  | ✅ `workitem:*` |
| Update worklog    | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌          | ❌      | ✅ `*`  | ✅ `workitem:*` |
| Delete worklog    | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌          | ❌      | ✅ `*`  | ✅ `workitem:*` |

#### `ProjectWorklogAPIEndpoint` (External API — `api/views/worklog.py`)

| Action                     | Permission Checked | P-Admin         | P-Contributor      | P-Commenter | P-Guest | W-Owner | W-Admin         |
| -------------------------- | ------------------ | --------------- | ------------------ | ----------- | ------- | ------- | --------------- |
| Project worklog summary    | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌          | ❌      | ✅ `*`  | ✅ `workitem:*` |

#### `IssueDetailEndpoint`

| Action           | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest    | W-Owner | W-Admin         |
| ---------------- | ------------------ | --------------- | ------------------ | ------------------ | ---------- | ------- | --------------- |
| Get issue detail | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator ² | ✅ `*`  | ✅ `workitem:*` |

> ² `defer_conditions=True` — guest sees only own issues via `created_by` queryset filter.

#### `IssueDetailIdentifierEndpoint`

Uses inline `permission_engine.check()` (not `@can`) due to string identifier URL params.

| Action                  | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest  | W-Owner | W-Admin         |
| ----------------------- | ------------------ | --------------- | ------------------ | ------------------ | -------- | ------- | --------------- |
| Get issue by identifier | `workitem:view` ¹  | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator | ✅ `*`  | ✅ `workitem:*` |

> ¹ conditional `+creator` grant in `system_roles.py`; also checks `EpicPermissions.VIEW` for epic issues.

#### `BulkDeleteIssuesEndpoint`

| Action             | Permission Checked | P-Admin         | P-Contributor | P-Commenter | P-Guest | W-Owner | W-Admin         |
| ------------------ | ------------------ | --------------- | ------------- | ----------- | ------- | ------- | --------------- |
| Bulk delete issues | `workitem:delete`  | ✅ `workitem:*` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `workitem:*` |

> No `+creator` conditional grant since this is a bulk operation.

#### `DeletedIssuesListViewSet`

| Action              | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest    | W-Owner | W-Admin         |
| ------------------- | ------------------ | --------------- | ------------------ | ------------------ | ---------- | ------- | --------------- |
| List deleted issues | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator ² | ✅ `*`  | ✅ `workitem:*` |

> ² `defer_conditions=True` — guest sees only own issues via `created_by` queryset filter.

#### `IssueBulkUpdateDateEndpoint`

| Action                  | Permission Checked | P-Admin         | P-Contributor      | P-Commenter | P-Guest | W-Owner | W-Admin         |
| ----------------------- | ------------------ | --------------- | ------------------ | ----------- | ------- | ------- | --------------- |
| Bulk update issue dates | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌          | ❌      | ✅ `*`  | ✅ `workitem:*` |

#### `IssueMetaEndpoint`

| Action         | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest  | W-Owner | W-Admin         |
| -------------- | ------------------ | --------------- | ------------------ | ------------------ | -------- | ------- | --------------- |
| Get issue meta | `workitem:view` ¹  | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator | ✅ `*`  | ✅ `workitem:*` |

> ¹ conditional `+creator` grant in `system_roles.py`

#### `ProjectUserDisplayPropertyEndpoint`

| Action                      | Permission Checked | P-Admin        | P-Contributor     | P-Commenter       | P-Guest           | W-Owner | W-Admin        |
| --------------------------- | ------------------ | -------------- | ----------------- | ----------------- | ----------------- | ------- | -------------- |
| Get user display properties | `project:view`     | ✅ `project:*` | ✅ `project:view` | ✅ `project:view` | ✅ `project:view` | ✅ `*`  | ✅ `project:*` |
| Set user display properties | `project:view`     | ✅ `project:*` | ✅ `project:view` | ✅ `project:view` | ✅ `project:view` | ✅ `*`  | ✅ `project:*` |

### Comments

#### `IssueCommentViewSet`

| Action           | Permission Checked | P-Admin         | P-Contributor         | P-Commenter           | P-Guest               | W-Owner | W-Admin         |
| ---------------- | ------------------ | --------------- | --------------------- | --------------------- | --------------------- | ------- | --------------- |
| List comments    | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view`    | ✅ `workitem:view`    | ❌                    | ✅ `*`  | ✅ `workitem:*` |
| Retrieve comment | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view`    | ✅ `workitem:view`    | ❌                    | ✅ `*`  | ✅ `workitem:*` |
| Create comment   | `workitem:comment` | ✅ `workitem:*` | ✅ `workitem:comment` | ✅ `workitem:comment` | ✅ `workitem:comment` | ✅ `*`  | ✅ `workitem:*` |
| Update comment   | `comment:edit` ¹   | ✅ `comment:*`  | ✅ `comment:edit`     | +Creator              | +Creator              | ✅ `*`  | ✅ `comment:*`  |
| Delete comment   | `comment:delete` ¹ | ✅ `comment:*`  | +Creator              | +Creator              | +Creator              | ✅ `*`  | ✅ `comment:*`  |

> ¹ conditional `+creator` grant in `system_roles.py`

#### `IssueCommentRepliesEndpoint`

| Action               | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest | W-Owner | W-Admin         |
| -------------------- | ------------------ | --------------- | ------------------ | ------------------ | ------- | ------- | --------------- |
| List comment replies | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | ❌      | ✅ `*`  | ✅ `workitem:*` |

#### `CommentReactionViewSet`

| Action          | Permission Checked | P-Admin         | P-Contributor         | P-Commenter           | P-Guest               | W-Owner | W-Admin         |
| --------------- | ------------------ | --------------- | --------------------- | --------------------- | --------------------- | ------- | --------------- |
| List reactions  | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view`    | ✅ `workitem:view`    | ❌                    | ✅ `*`  | ✅ `workitem:*` |
| Create reaction | `workitem:comment` | ✅ `workitem:*` | ✅ `workitem:comment` | ✅ `workitem:comment` | ✅ `workitem:comment` | ✅ `*`  | ✅ `workitem:*` |
| Delete reaction | `workitem:comment` | ✅ `workitem:*` | ✅ `workitem:comment` | ✅ `workitem:comment` | ✅ `workitem:comment` | ✅ `*`  | ✅ `workitem:*` |

### Reactions

#### `IssueReactionViewSet`

| Action          | Permission Checked | P-Admin         | P-Contributor       | P-Commenter         | P-Guest | W-Owner | W-Admin         |
| --------------- | ------------------ | --------------- | ------------------- | ------------------- | ------- | ------- | --------------- |
| Create reaction | `workitem:react`   | ✅ `workitem:*` | ✅ `workitem:react` | ✅ `workitem:react` | ❌      | ✅ `*`  | ✅ `workitem:*` |
| Delete reaction | `workitem:react`   | ✅ `workitem:*` | ✅ `workitem:react` | ✅ `workitem:react` | ❌      | ✅ `*`  | ✅ `workitem:*` |

### Attachments

#### `IssueAttachmentEndpoint` (v1)

| Action            | Permission Checked    | P-Admin           | P-Contributor          | P-Commenter            | P-Guest                | W-Owner | W-Admin           |
| ----------------- | --------------------- | ----------------- | ---------------------- | ---------------------- | ---------------------- | ------- | ----------------- |
| List attachments  | `attachment:view`     | ✅ `attachment:*` | ✅ `attachment:view`   | ✅ `attachment:view`   | ✅ `attachment:view`   | ✅ `*`  | ✅ `attachment:*` |
| Upload attachment | `attachment:create`   | ✅ `attachment:*` | ✅ `attachment:create` | ✅ `attachment:create` | ✅ `attachment:create` | ✅ `*`  | ✅ `attachment:*` |
| Delete attachment | `attachment:delete` ¹ | ✅ `attachment:*` | +Creator               | +Creator               | +Creator               | ✅ `*`  | ✅ `attachment:*` |

> ¹ conditional `+creator` grant in `system_roles.py`

#### `IssueAttachmentV2Endpoint`

| Action            | Permission Checked    | P-Admin           | P-Contributor          | P-Commenter            | P-Guest                | W-Owner | W-Admin           |
| ----------------- | --------------------- | ----------------- | ---------------------- | ---------------------- | ---------------------- | ------- | ----------------- |
| List attachments  | `attachment:view`     | ✅ `attachment:*` | ✅ `attachment:view`   | ✅ `attachment:view`   | ✅ `attachment:view`   | ✅ `*`  | ✅ `attachment:*` |
| Upload attachment | `attachment:create`   | ✅ `attachment:*` | ✅ `attachment:create` | ✅ `attachment:create` | ✅ `attachment:create` | ✅ `*`  | ✅ `attachment:*` |
| Update attachment | `attachment:edit`     | ✅ `attachment:*` | ❌                     | ❌                     | ❌                     | ✅ `*`  | ✅ `attachment:*` |
| Delete attachment | `attachment:delete` ¹ | ✅ `attachment:*` | +Creator               | +Creator               | +Creator               | ✅ `*`  | ✅ `attachment:*` |

> ¹ conditional `+creator` grant in `system_roles.py`

### Issue Links

#### `IssueLinkViewSet`

| Action      | Permission Checked     | P-Admin              | P-Contributor             | P-Commenter             | P-Guest | W-Owner | W-Admin              |
| ----------- | ---------------------- | -------------------- | ------------------------- | ----------------------- | ------- | ------- | -------------------- |
| List links  | `workitem_link:view`   | ✅ `workitem_link:*` | ✅ `workitem_link:view`   | ✅ `workitem_link:view` | ❌      | ✅ `*`  | ✅ `workitem_link:*` |
| Get link    | `workitem_link:view`   | ✅ `workitem_link:*` | ✅ `workitem_link:view`   | ✅ `workitem_link:view` | ❌      | ✅ `*`  | ✅ `workitem_link:*` |
| Create link | `workitem_link:create` | ✅ `workitem_link:*` | ✅ `workitem_link:create` | ❌                      | ❌      | ✅ `*`  | ✅ `workitem_link:*` |
| Edit link   | `workitem_link:edit`   | ✅ `workitem_link:*` | ✅ `workitem_link:edit`   | ❌                      | ❌      | ✅ `*`  | ✅ `workitem_link:*` |
| Delete link | `workitem_link:delete` | ✅ `workitem_link:*` | ✅ `workitem_link:delete` | ❌                      | ❌      | ✅ `*`  | ✅ `workitem_link:*` |

> Links have a dedicated `WORKITEM_LINK` resource type (child of `workitem` in the hierarchy). `resource_param="issue_id"` with `scope_param_type=ResourceType.WORKITEM` — the engine resolves the parent issue → project → checks role grants for `workitem_link:*` permissions. Admin and Contributor have full CRUD. Commenter has VIEW only. Guest has no link access.

### Issue Relations / Dependencies

#### `WorkItemRelationRelationViewSet`

| Action          | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest    | W-Owner | W-Admin         |
| --------------- | ------------------ | --------------- | ------------------ | ------------------ | ---------- | ------- | --------------- |
| List relations  | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator ² | ✅ `*`  | ✅ `workitem:*` |
| Create relation | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌                 | ❌         | ✅ `*`  | ✅ `workitem:*` |
| Remove relation | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌                 | ❌         | ✅ `*`  | ✅ `workitem:*` |

> ² P-Guest has `workitem:view+creator` conditional grant — can only view relations on own issues.

#### `WorkItemRelationDependencyViewSet`

| Action            | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest    | W-Owner | W-Admin         |
| ----------------- | ------------------ | --------------- | ------------------ | ------------------ | ---------- | ------- | --------------- |
| List dependencies | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator ² | ✅ `*`  | ✅ `workitem:*` |
| Create dependency | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌                 | ❌         | ✅ `*`  | ✅ `workitem:*` |
| Remove dependency | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌                 | ❌         | ✅ `*`  | ✅ `workitem:*` |

> ² P-Guest has `workitem:view+creator` conditional grant — can only view dependencies on own issues.
>
> **Change from previous:** Issue-to-issue relations and dependencies now use `WorkitemPermissions` (VIEW/EDIT) instead of the old `WorkitemRelationPermissions` (VIEW/CREATE/DELETE). Adding/removing a relation or dependency is conceptually editing the work item. The `WORKITEM_RELATION` resource type was repurposed to workspace-scoped relation definitions — see Workspace-Level section.

### Labels

#### `LabelViewSet`

| Action         | Permission Checked | P-Admin      | P-Contributor   | P-Commenter     | P-Guest         | W-Owner | W-Admin      |
| -------------- | ------------------ | ------------ | --------------- | --------------- | --------------- | ------- | ------------ |
| List labels    | `label:view`       | ✅ `label:*` | ✅ `label:view` | ✅ `label:view` | ✅ `label:view` | ✅ `*`  | ✅ `label:*` |
| Retrieve label | `label:view`       | ✅ `label:*` | ✅ `label:view` | ✅ `label:view` | ✅ `label:view` | ✅ `*`  | ✅ `label:*` |
| Create label   | `label:create`     | ✅ `label:*` | ❌              | ❌              | ❌              | ✅ `*`  | ✅ `label:*` |
| Update label   | `label:edit`       | ✅ `label:*` | ❌              | ❌              | ❌              | ✅ `*`  | ✅ `label:*` |
| Delete label   | `label:delete`     | ✅ `label:*` | ❌              | ❌              | ❌              | ✅ `*`  | ✅ `label:*` |

#### `BulkCreateIssueLabelsEndpoint`

| Action             | Permission Checked | P-Admin      | P-Contributor | P-Commenter | P-Guest | W-Owner | W-Admin      |
| ------------------ | ------------------ | ------------ | ------------- | ----------- | ------- | ------- | ------------ |
| Bulk create labels | `label:create`     | ✅ `label:*` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `label:*` |

### States

#### `StateViewSet`

| Action          | Permission Checked | P-Admin      | P-Contributor   | P-Commenter     | P-Guest         | W-Owner | W-Admin      |
| --------------- | ------------------ | ------------ | --------------- | --------------- | --------------- | ------- | ------------ |
| List states     | `state:view`       | ✅ `state:*` | ✅ `state:view` | ✅ `state:view` | ✅ `state:view` | ✅ `*`  | ✅ `state:*` |
| Create state    | `state:create`     | ✅ `state:*` | ❌              | ❌              | ❌              | ✅ `*`  | ✅ `state:*` |
| Update state    | `state:edit`       | ✅ `state:*` | ❌              | ❌              | ❌              | ✅ `*`  | ✅ `state:*` |
| Mark as default | `state:edit`       | ✅ `state:*` | ❌              | ❌              | ❌              | ✅ `*`  | ✅ `state:*` |
| Delete state    | `state:delete`     | ✅ `state:*` | ❌              | ❌              | ❌              | ✅ `*`  | ✅ `state:*` |

#### `IntakeStateEndpoint`

| Action           | Permission Checked | P-Admin      | P-Contributor   | P-Commenter     | P-Guest         | W-Owner | W-Admin      |
| ---------------- | ------------------ | ------------ | --------------- | --------------- | --------------- | ------- | ------------ |
| Get intake state | `state:view`       | ✅ `state:*` | ✅ `state:view` | ✅ `state:view` | ✅ `state:view` | ✅ `*`  | ✅ `state:*` |

### Archives — Issues

#### `IssueArchiveViewSet`

| Action                  | Permission Checked | P-Admin         | P-Contributor         | P-Commenter        | P-Guest    | W-Owner | W-Admin         |
| ----------------------- | ------------------ | --------------- | --------------------- | ------------------ | ---------- | ------- | --------------- |
| List archived issues    | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view`    | ✅ `workitem:view` | +Creator ² | ✅ `*`  | ✅ `workitem:*` |
| Retrieve archived issue | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view`    | ✅ `workitem:view` | ❌         | ✅ `*`  | ✅ `workitem:*` |
| Archive issue           | `workitem:archive` | ✅ `workitem:*` | ✅ `workitem:archive` | ❌                 | ❌         | ✅ `*`  | ✅ `workitem:*` |
| Unarchive issue         | `workitem:archive` | ✅ `workitem:*` | ✅ `workitem:archive` | ❌                 | ❌         | ✅ `*`  | ✅ `workitem:*` |

> ² `defer_conditions=True` — guest sees only own archived issues via `created_by` queryset filter.

#### `BulkArchiveIssuesEndpoint`

| Action              | Permission Checked | P-Admin         | P-Contributor         | P-Commenter | P-Guest | W-Owner | W-Admin         |
| ------------------- | ------------------ | --------------- | --------------------- | ----------- | ------- | ------- | --------------- |
| Bulk archive issues | `workitem:archive` | ✅ `workitem:*` | ✅ `workitem:archive` | ❌          | ❌      | ✅ `*`  | ✅ `workitem:*` |

#### `BulkArchiveIssuesEndpoint` (EE)

| Action              | Permission Checked | P-Admin         | P-Contributor         | P-Commenter | P-Guest | W-Owner | W-Admin         |
| ------------------- | ------------------ | --------------- | --------------------- | ----------- | ------- | ------- | --------------- |
| Bulk archive issues | `workitem:archive` | ✅ `workitem:*` | ✅ `workitem:archive` | ❌          | ❌      | ✅ `*`  | ✅ `workitem:*` |

> EE version at `ee/views/app/issue/bulk_operations.py`. Same permission as CE version. Feature-flag gated (`BULK_OPS_ONE`).

### Activity & Versions

#### `IssueActivityEndpoint`

| Action                | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest  | W-Owner | W-Admin         |
| --------------------- | ------------------ | --------------- | ------------------ | ------------------ | -------- | ------- | --------------- |
| List issue activities | `workitem:view` ¹  | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator | ✅ `*`  | ✅ `workitem:*` |

> ¹ conditional `+creator` grant in `system_roles.py` — intake issue creators can view activities on their issues.

#### `IssueVersionEndpoint`

| Action                 | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest  | W-Owner | W-Admin         |
| ---------------------- | ------------------ | --------------- | ------------------ | ------------------ | -------- | ------- | --------------- |
| List/retrieve versions | `workitem:view` ¹  | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator | ✅ `*`  | ✅ `workitem:*` |

> ¹ conditional `+creator` grant in `system_roles.py`

#### `WorkItemDescriptionVersionEndpoint`

| Action                             | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest  | W-Owner | W-Admin         |
| ---------------------------------- | ------------------ | --------------- | ------------------ | ------------------ | -------- | ------- | --------------- |
| List/retrieve description versions | `workitem:view` ¹  | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator | ✅ `*`  | ✅ `workitem:*` |

> ¹ conditional `+creator` grant in `system_roles.py`

### Cycles

#### `CycleViewSet`

| Action         | Permission Checked | P-Admin      | P-Contributor     | P-Commenter     | P-Guest | W-Owner | W-Admin      |
| -------------- | ------------------ | ------------ | ----------------- | --------------- | ------- | ------- | ------------ |
| List cycles    | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view`   | ✅ `cycle:view` | ❌      | ✅ `*`  | ✅ `cycle:*` |
| Create cycle   | `cycle:create`     | ✅ `cycle:*` | ✅ `cycle:create` | ❌              | ❌      | ✅ `*`  | ✅ `cycle:*` |
| Retrieve cycle | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view`   | ✅ `cycle:view` | ❌      | ✅ `*`  | ✅ `cycle:*` |
| Update cycle   | `cycle:edit`       | ✅ `cycle:*` | ✅ `cycle:edit`   | ❌              | ❌      | ✅ `*`  | ✅ `cycle:*` |
| Delete cycle   | `cycle:delete` ¹   | ✅ `cycle:*` | +Creator          | ❌              | ❌      | ✅ `*`  | ✅ `cycle:*` |

> ¹ conditional `+creator` grant in `system_roles.py`

#### `CycleDateCheckEndpoint`

| Action            | Permission Checked | P-Admin      | P-Contributor     | P-Commenter | P-Guest | W-Owner | W-Admin      |
| ----------------- | ------------------ | ------------ | ----------------- | ----------- | ------- | ------- | ------------ |
| Check cycle dates | `cycle:create`     | ✅ `cycle:*` | ✅ `cycle:create` | ❌          | ❌      | ✅ `*`  | ✅ `cycle:*` |

#### `CycleFavoriteViewSet`

| Action           | Permission Checked | P-Admin      | P-Contributor   | P-Commenter     | P-Guest | W-Owner | W-Admin      |
| ---------------- | ------------------ | ------------ | --------------- | --------------- | ------- | ------- | ------------ |
| Favorite cycle   | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view` | ✅ `cycle:view` | ❌      | ✅ `*`  | ✅ `cycle:*` |
| Unfavorite cycle | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view` | ✅ `cycle:view` | ❌      | ✅ `*`  | ✅ `cycle:*` |

#### `TransferCycleIssueEndpoint`

| Action                | Permission Checked | P-Admin      | P-Contributor   | P-Commenter | P-Guest | W-Owner | W-Admin      |
| --------------------- | ------------------ | ------------ | --------------- | ----------- | ------- | ------- | ------------ |
| Transfer cycle issues | `cycle:edit`       | ✅ `cycle:*` | ✅ `cycle:edit` | ❌          | ❌      | ✅ `*`  | ✅ `cycle:*` |

#### `CycleUserPropertiesEndpoint`

| Action              | Permission Checked | P-Admin      | P-Contributor   | P-Commenter     | P-Guest | W-Owner | W-Admin      |
| ------------------- | ------------------ | ------------ | --------------- | --------------- | ------- | ------- | ------------ |
| Get user properties | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view` | ✅ `cycle:view` | ❌      | ✅ `*`  | ✅ `cycle:*` |
| Set user properties | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view` | ✅ `cycle:view` | ❌      | ✅ `*`  | ✅ `cycle:*` |

#### `CycleProgressEndpoint`

| Action             | Permission Checked | P-Admin      | P-Contributor   | P-Commenter     | P-Guest | W-Owner | W-Admin      |
| ------------------ | ------------------ | ------------ | --------------- | --------------- | ------- | ------- | ------------ |
| Get cycle progress | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view` | ✅ `cycle:view` | ❌      | ✅ `*`  | ✅ `cycle:*` |

#### `CycleAnalyticsEndpoint`

| Action              | Permission Checked | P-Admin      | P-Contributor   | P-Commenter     | P-Guest | W-Owner | W-Admin      |
| ------------------- | ------------------ | ------------ | --------------- | --------------- | ------- | ------- | ------------ |
| Get cycle analytics | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view` | ✅ `cycle:view` | ❌      | ✅ `*`  | ✅ `cycle:*` |

### Cycle Issues

#### `CycleIssueViewSet`

| Action                  | Permission Checked | P-Admin      | P-Contributor   | P-Commenter     | P-Guest | W-Owner | W-Admin      |
| ----------------------- | ------------------ | ------------ | --------------- | --------------- | ------- | ------- | ------------ |
| List cycle issues       | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view` | ✅ `cycle:view` | ❌      | ✅ `*`  | ✅ `cycle:*` |
| Add issues to cycle     | `cycle:edit`       | ✅ `cycle:*` | ✅ `cycle:edit` | ❌              | ❌      | ✅ `*`  | ✅ `cycle:*` |
| Remove issue from cycle | `cycle:edit`       | ✅ `cycle:*` | ✅ `cycle:edit` | ❌              | ❌      | ✅ `*`  | ✅ `cycle:*` |

### Cycle Archives

#### `CycleArchiveUnarchiveEndpoint`

| Action               | Permission Checked | P-Admin      | P-Contributor      | P-Commenter     | P-Guest | W-Owner | W-Admin      |
| -------------------- | ------------------ | ------------ | ------------------ | --------------- | ------- | ------- | ------------ |
| List archived cycles | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view`    | ✅ `cycle:view` | ❌      | ✅ `*`  | ✅ `cycle:*` |
| Archive cycle        | `cycle:archive`    | ✅ `cycle:*` | ✅ `cycle:archive` | ❌              | ❌      | ✅ `*`  | ✅ `cycle:*` |
| Unarchive cycle      | `cycle:archive`    | ✅ `cycle:*` | ✅ `cycle:archive` | ❌              | ❌      | ✅ `*`  | ✅ `cycle:*` |

### Modules

#### `ModuleViewSet`

| Action          | Permission Checked | P-Admin       | P-Contributor      | P-Commenter      | P-Guest | W-Owner | W-Admin       |
| --------------- | ------------------ | ------------- | ------------------ | ---------------- | ------- | ------- | ------------- |
| List modules    | `module:view`      | ✅ `module:*` | ✅ `module:view`   | ✅ `module:view` | ❌      | ✅ `*`  | ✅ `module:*` |
| Create module   | `module:create`    | ✅ `module:*` | ✅ `module:create` | ❌               | ❌      | ✅ `*`  | ✅ `module:*` |
| Retrieve module | `module:view`      | ✅ `module:*` | ✅ `module:view`   | ✅ `module:view` | ❌      | ✅ `*`  | ✅ `module:*` |
| Update module   | `module:edit`      | ✅ `module:*` | ✅ `module:edit`   | ❌               | ❌      | ✅ `*`  | ✅ `module:*` |
| Delete module   | `module:delete` ¹  | ✅ `module:*` | +Creator           | ❌               | ❌      | ✅ `*`  | ✅ `module:*` |

> ¹ conditional `+creator` grant in `system_roles.py`

#### `ModuleFavoriteViewSet`

| Action            | Permission Checked | P-Admin       | P-Contributor    | P-Commenter      | P-Guest | W-Owner | W-Admin       |
| ----------------- | ------------------ | ------------- | ---------------- | ---------------- | ------- | ------- | ------------- |
| Favorite module   | `module:view`      | ✅ `module:*` | ✅ `module:view` | ✅ `module:view` | ❌      | ✅ `*`  | ✅ `module:*` |
| Unfavorite module | `module:view`      | ✅ `module:*` | ✅ `module:view` | ✅ `module:view` | ❌      | ✅ `*`  | ✅ `module:*` |

#### `ModuleUserPropertiesEndpoint`

| Action              | Permission Checked | P-Admin       | P-Contributor    | P-Commenter      | P-Guest | W-Owner | W-Admin       |
| ------------------- | ------------------ | ------------- | ---------------- | ---------------- | ------- | ------- | ------------- |
| Get user properties | `module:view`      | ✅ `module:*` | ✅ `module:view` | ✅ `module:view` | ❌      | ✅ `*`  | ✅ `module:*` |
| Set user properties | `module:view`      | ✅ `module:*` | ✅ `module:view` | ✅ `module:view` | ❌      | ✅ `*`  | ✅ `module:*` |

### Module Issues

#### `ModuleIssueViewSet`

| Action                   | Permission Checked | P-Admin       | P-Contributor    | P-Commenter      | P-Guest | W-Owner | W-Admin       |
| ------------------------ | ------------------ | ------------- | ---------------- | ---------------- | ------- | ------- | ------------- |
| List module issues       | `module:view`      | ✅ `module:*` | ✅ `module:view` | ✅ `module:view` | ❌      | ✅ `*`  | ✅ `module:*` |
| Add issues to module     | `module:edit`      | ✅ `module:*` | ✅ `module:edit` | ❌               | ❌      | ✅ `*`  | ✅ `module:*` |
| Add modules to issue     | `module:edit`      | ✅ `module:*` | ✅ `module:edit` | ❌               | ❌      | ✅ `*`  | ✅ `module:*` |
| Remove issue from module | `module:edit`      | ✅ `module:*` | ✅ `module:edit` | ❌               | ❌      | ✅ `*`  | ✅ `module:*` |

### Module Archives

#### `ModuleArchiveViewSet`

| Action                | Permission Checked | P-Admin       | P-Contributor       | P-Commenter      | P-Guest | W-Owner | W-Admin       |
| --------------------- | ------------------ | ------------- | ------------------- | ---------------- | ------- | ------- | ------------- |
| List archived modules | `module:view`      | ✅ `module:*` | ✅ `module:view`    | ✅ `module:view` | ❌      | ✅ `*`  | ✅ `module:*` |
| Archive module        | `module:archive`   | ✅ `module:*` | ✅ `module:archive` | ❌               | ❌      | ✅ `*`  | ✅ `module:*` |
| Unarchive module      | `module:archive`   | ✅ `module:*` | ✅ `module:archive` | ❌               | ❌      | ✅ `*`  | ✅ `module:*` |

### Module Links — `ModuleLinkViewSet`

| Action                    | Permission Checked | P-Admin       | P-Contributor    | P-Commenter      | P-Guest | W-Owner | W-Admin       |
| ------------------------- | ------------------ | ------------- | ---------------- | ---------------- | ------- | ------- | ------------- |
| List/retrieve links       | `module:view`      | ✅ `module:*` | ✅ `module:view` | ✅ `module:view` | ❌      | ✅ `*`  | ✅ `module:*` |
| Create/update/delete link | `module:edit`      | ✅ `module:*` | ✅ `module:edit` | ❌               | ❌      | ✅ `*`  | ✅ `module:*` |

> P-Guest has no module access by design (`system_roles.py` — `# Modules - no access` for Guest role).

### Projects (Project-Level Actions)

#### `ProjectViewSet` (project-scoped actions)

| Action         | Permission Checked | P-Admin             | P-Contributor | P-Commenter | P-Guest | W-Owner | W-Admin        |
| -------------- | ------------------ | ------------------- | ------------- | ----------- | ------- | ------- | -------------- |
| Update project | `project:edit`     | ✅ `project:edit`   | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `project:*` |
| Delete project | `project:delete`   | ✅ `project:delete` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `project:*` |

### Project Settings

#### `ProjectArchiveUnarchiveEndpoint`

| Action            | Permission Checked | P-Admin              | P-Contributor | P-Commenter | P-Guest | W-Owner | W-Admin        |
| ----------------- | ------------------ | -------------------- | ------------- | ----------- | ------- | ------- | -------------- |
| Archive project   | `project:archive`  | ✅ `project:archive` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `project:*` |
| Unarchive project | `project:archive`  | ✅ `project:archive` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `project:*` |

#### `ProjectUserViewsEndpoint`

| Action                    | Permission Checked | P-Admin           | P-Contributor     | P-Commenter       | P-Guest           | W-Owner | W-Admin        |
| ------------------------- | ------------------ | ----------------- | ----------------- | ----------------- | ----------------- | ------- | -------------- |
| Set user view preferences | `project:view`     | ✅ `project:view` | ✅ `project:view` | ✅ `project:view` | ✅ `project:view` | ✅ `*`  | ✅ `project:*` |

#### `DeployBoardViewSet`

| Action                | Permission Checked | P-Admin              | P-Contributor     | P-Commenter       | P-Guest           | W-Owner | W-Admin        |
| --------------------- | ------------------ | -------------------- | ----------------- | ----------------- | ----------------- | ------- | -------------- |
| List deploy boards    | `project:view`     | ✅ `project:view`    | ✅ `project:view` | ✅ `project:view` | ✅ `project:view` | ✅ `*`  | ✅ `project:*` |
| Retrieve deploy board | `project:view`     | ✅ `project:view`    | ✅ `project:view` | ✅ `project:view` | ✅ `project:view` | ✅ `*`  | ✅ `project:*` |
| Create deploy board   | `project:publish`  | ✅ `project:publish` | ❌                | ❌                | ❌                | ✅ `*`  | ✅ `project:*` |
| Update deploy board   | `project:publish`  | ✅ `project:publish` | ❌                | ❌                | ❌                | ✅ `*`  | ✅ `project:*` |
| Delete deploy board   | `project:publish`  | ✅ `project:publish` | ❌                | ❌                | ❌                | ✅ `*`  | ✅ `project:*` |

#### `ProjectFeatureEndpoint` (EE)

| Action          | Permission Checked | P-Admin             | P-Contributor | P-Commenter | P-Guest | W-Owner | W-Admin        |
| --------------- | ------------------ | ------------------- | ------------- | ----------- | ------- | ------- | -------------- |
| Toggle features | `project:manage`   | ✅ `project:manage` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `project:*` |

> Direct mapping from old `@allow_permission([ROLE.ADMIN])`. P-Admin is the only project role with `project:manage`.

### Estimates

#### `BulkEstimatePointEndpoint`

| Action            | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest            | W-Owner | W-Admin         |
| ----------------- | ------------------ | --------------- | ------------------ | ------------------ | ------------------ | ------- | --------------- |
| List estimates    | `estimate:view`    | ✅ `estimate:*` | ✅ `estimate:view` | ✅ `estimate:view` | ✅ `estimate:view` | ✅ `*`  | ✅ `estimate:*` |
| Create estimate   | `estimate:create`  | ✅ `estimate:*` | ❌                 | ❌                 | ❌                 | ✅ `*`  | ✅ `estimate:*` |
| Retrieve estimate | `estimate:view`    | ✅ `estimate:*` | ✅ `estimate:view` | ✅ `estimate:view` | ✅ `estimate:view` | ✅ `*`  | ✅ `estimate:*` |
| Update estimate   | `estimate:edit`    | ✅ `estimate:*` | ❌                 | ❌                 | ❌                 | ✅ `*`  | ✅ `estimate:*` |
| Delete estimate   | `estimate:delete`  | ✅ `estimate:*` | ❌                 | ❌                 | ❌                 | ✅ `*`  | ✅ `estimate:*` |

#### `EstimatePointEndpoint`

| Action                | Permission Checked | P-Admin         | P-Contributor | P-Commenter | P-Guest | W-Owner | W-Admin         |
| --------------------- | ------------------ | --------------- | ------------- | ----------- | ------- | ------- | --------------- |
| Create estimate point | `estimate:create`  | ✅ `estimate:*` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `estimate:*` |
| Update estimate point | `estimate:edit`    | ✅ `estimate:*` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `estimate:*` |
| Delete estimate point | `estimate:delete`  | ✅ `estimate:*` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `estimate:*` |

### Views (Saved Filters)

#### `IssueViewViewSet`

| Action        | Permission Checked       | P-Admin                | P-Contributor             | P-Commenter             | P-Guest                 | W-Owner  | W-Admin                |
| ------------- | ------------------------ | ---------------------- | ------------------------- | ----------------------- | ----------------------- | -------- | ---------------------- |
| List views    | `workitem_view:view`     | ✅ `workitem_view:*`   | ✅ `workitem_view:view`   | ✅ `workitem_view:view` | ✅ `workitem_view:view` | ✅ `*`   | ✅ `workitem_view:*`   |
| Create view   | `workitem_view:create`   | ✅ `workitem_view:*`   | ✅ `workitem_view:create` | ❌                      | ❌                      | ✅ `*`   | ✅ `workitem_view:*`   |
| Retrieve view | `workitem_view:view`     | ✅ `workitem_view:*`   | ✅ `workitem_view:view`   | ✅ `workitem_view:view` | ✅ `workitem_view:view` | ✅ `*`   | ✅ `workitem_view:*`   |
| Update view   | `workitem_view:edit` ¹   | ✅ `workitem_view:*` ¹ | ✅ `workitem_view:edit` ¹ | ❌                      | ❌                      | ✅ `*` ¹ | ✅ `workitem_view:*` ¹ |
| Delete view   | `workitem_view:delete` ² | ✅ `workitem_view:*`   | +Creator                  | ❌                      | ❌                      | ✅ `*`   | ✅ `workitem_view:*`   |

> ¹ Inline private-view check — the decorator checks EDIT permission (admin/contributor pass via unconditional grant or wildcard), then for **private** views (`access == 0`) the view method enforces `created_by_id == request.user.id`. Public views can be edited by anyone with the permission.
> ² Inline private-view check on delete — `access == 0` requires creator; otherwise conditional `+creator` grant in `system_roles.py` applies (admin via `workitem_view:*` OR creator with active membership).

#### `IssueViewFavoriteViewSet`

All operations are user-scoped — queryset filters to `user=request.user`.

| Action              | Permission Checked     | P-Admin              | P-Contributor             | P-Commenter             | P-Guest                 | W-Owner | W-Admin              |
| ------------------- | ---------------------- | -------------------- | ------------------------- | ----------------------- | ----------------------- | ------- | -------------------- |
| List view favorites | `workitem_view:view`   | ✅ `workitem_view:*` | ✅ `workitem_view:view`   | ✅ `workitem_view:view` | ✅ `workitem_view:view` | ✅ `*`  | ✅ `workitem_view:*` |
| Favorite view       | `workitem_view:create` | ✅ `workitem_view:*` | ✅ `workitem_view:create` | ❌                      | ❌                      | ✅ `*`  | ✅ `workitem_view:*` |
| Unfavorite view     | `workitem_view:create` | ✅ `workitem_view:*` | ✅ `workitem_view:create` | ❌                      | ❌                      | ✅ `*`  | ✅ `workitem_view:*` |

#### `IssueViewEEViewSet`

| Action        | Permission Checked     | P-Admin                | P-Contributor             | P-Commenter | P-Guest | W-Owner  | W-Admin                |
| ------------- | ---------------------- | ---------------------- | ------------------------- | ----------- | ------- | -------- | ---------------------- |
| Lock view     | `workitem_view:edit`   | ✅ `workitem_view:*`   | ✅ `workitem_view:edit`   | ❌          | ❌      | ✅ `*`   | ✅ `workitem_view:*`   |
| Unlock view   | `workitem_view:edit`   | ✅ `workitem_view:*`   | ✅ `workitem_view:edit`   | ❌          | ❌      | ✅ `*`   | ✅ `workitem_view:*`   |
| Change access | `workitem_view:edit` ¹ | ✅ `workitem_view:*` ¹ | ✅ `workitem_view:edit` ¹ | ❌          | ❌      | ✅ `*` ¹ | ✅ `workitem_view:*` ¹ |

> ¹ Inline owner check — the decorator checks EDIT permission, then the view enforces `owned_by == request.user`. Only the view owner can change access, regardless of role. Feature-flagged behind `VIEW_ACCESS_PRIVATE`.

#### `IssueViewsPublishEndpoint`

| Action         | Permission Checked        | P-Admin              | P-Contributor              | P-Commenter | P-Guest | W-Owner | W-Admin              |
| -------------- | ------------------------- | -------------------- | -------------------------- | ----------- | ------- | ------- | -------------------- |
| Publish view   | `workitem_view:publish` ¹ | ✅ `workitem_view:*` | ✅ `workitem_view:publish` | ❌          | ❌      | ✅ `*`  | ✅ `workitem_view:*` |
| Update publish | `workitem_view:publish`   | ✅ `workitem_view:*` | ✅ `workitem_view:publish` | ❌          | ❌      | ✅ `*`  | ✅ `workitem_view:*` |
| Get publish    | `workitem_view:publish`   | ✅ `workitem_view:*` | ✅ `workitem_view:publish` | ❌          | ❌      | ✅ `*`  | ✅ `workitem_view:*` |
| Unpublish      | `workitem_view:publish`   | ✅ `workitem_view:*` | ✅ `workitem_view:publish` | ❌          | ❌      | ✅ `*`  | ✅ `workitem_view:*` |

> ¹ Inline owner check on `post` — only the view owner can publish. Feature-flagged behind `VIEW_PUBLISH`. All methods require the feature flag.

#### `WorkspaceViewEEViewSet`

| Action        | Permission Checked                 | W-Owner    | W-Admin                            | W-Member     | W-Guest |
| ------------- | ---------------------------------- | ---------- | ---------------------------------- | ------------ | ------- |
| Lock view     | `workspace_workitem_view:edit` ¹   | ✅ `*` ¹   | ✅ `workspace_workitem_view:*` ¹   | +Creator ¹   | ❌      |
| Unlock view   | `workspace_workitem_view:edit` ¹   | ✅ `*` ¹   | ✅ `workspace_workitem_view:*` ¹   | +Creator ¹   | ❌      |
| Change access | `workspace_workitem_view:edit` ¹ ² | ✅ `*` ¹ ² | ✅ `workspace_workitem_view:*` ¹ ² | +Creator ¹ ² | ❌      |

> ¹ Inline owner check — the decorator checks EDIT permission (owner/admin pass via wildcard, member passes via `workspace_workitem_view:edit+creator` conditional grant), then the view enforces `owned_by == request.user`. Only the view owner can lock/unlock/change access, regardless of role.
> ² Feature-flagged behind `VIEW_ACCESS_PRIVATE`.

### Intake Issues

#### `IntakeIssueViewSet`

| Action          | Permission Checked      | P-Admin       | P-Contributor         | P-Commenter           | P-Guest               | W-Owner | W-Admin       |
| --------------- | ----------------------- | ------------- | --------------------- | --------------------- | --------------------- | ------- | ------------- |
| List            | `intake:view` (defer)   | ✅ `intake:*` | ✅ `intake:view`      | ✅ `intake:view`      | +Creator (deferred)   | ✅ `*`  | ✅ `intake:*` |
| Create          | `intake:submit`         | ✅ `intake:*` | ✅ `intake:submit`    | ✅ `intake:submit`    | ✅ `intake:submit`    | ✅ `*`  | ✅ `intake:*` |
| Retrieve        | `intake:view` (defer)   | ✅ `intake:*` | ✅ `intake:view`      | ✅ `intake:view`      | +Creator (deferred)   | ✅ `*`  | ✅ `intake:*` |
| Edit issue data | `intake:edit` (defer)   | ✅ `intake:*` | +Creator (deferred) ¹ | +Creator (deferred) ¹ | +Creator (deferred) ¹ | ✅ `*`  | ✅ `intake:*` |
| Change status   | `intake:manage`         | ✅ `intake:*` | ❌                    | ❌                    | ❌                    | ✅ `*`  | ✅ `intake:*` |
| Delete          | `intake:delete` (defer) | ✅ `intake:*` | +Creator (deferred)   | +Creator (deferred)   | +Creator (deferred)   | ✅ `*`  | ✅ `intake:*` |

> ¹ Creator field whitelist: name, description, priority, dates, labels, assignees. Admin gets all fields.

#### `IntakeWorkItemDescriptionVersionEndpoint`

| Action                             | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest  | W-Owner | W-Admin         |
| ---------------------------------- | ------------------ | --------------- | ------------------ | ------------------ | -------- | ------- | --------------- |
| List/retrieve description versions | `workitem:view` ¹  | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator | ✅ `*`  | ✅ `workitem:*` |

> ¹ conditional `+creator` grant in `system_roles.py` — matches `WorkItemDescriptionVersionEndpoint` pattern.

#### `IntakeFormWorkitemTypeEndpoint`

| Action             | Permission Checked | P-Admin       | P-Contributor | P-Commenter | P-Guest | W-Owner | W-Admin       |
| ------------------ | ------------------ | ------------- | ------------- | ----------- | ------- | ------- | ------------- |
| List intake forms  | `intake:configure` | ✅ `intake:*` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `intake:*` |
| Get intake form    | `intake:configure` | ✅ `intake:*` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `intake:*` |
| Create intake form | `intake:configure` | ✅ `intake:*` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `intake:*` |
| Update intake form | `intake:configure` | ✅ `intake:*` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `intake:*` |
| Delete intake form | `intake:configure` | ✅ `intake:*` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `intake:*` |

#### `IntakeSettingEndpoint`

| Action                 | Permission Checked | P-Admin       | P-Contributor    | P-Commenter      | P-Guest | W-Owner | W-Admin       |
| ---------------------- | ------------------ | ------------- | ---------------- | ---------------- | ------- | ------- | ------------- |
| Get intake settings    | `intake:view`      | ✅ `intake:*` | ✅ `intake:view` | ✅ `intake:view` | ❌      | ✅ `*`  | ✅ `intake:*` |
| Update intake settings | `intake:configure` | ✅ `intake:*` | ❌               | ❌               | ❌      | ✅ `*`  | ✅ `intake:*` |

#### `IntakeResponsibilityEndpoint`

| Action                         | Permission Checked  | P-Admin       | P-Contributor    | P-Commenter      | P-Guest | W-Owner | W-Admin       |
| ------------------------------ | ------------------- | ------------- | ---------------- | ---------------- | ------- | ------- | ------------- |
| Assign intake responsibilities | `intake:configure`  | ✅ `intake:*` | ❌               | ❌               | ❌      | ✅ `*`  | ✅ `intake:*` |
| List intake responsibilities   | `intake:view`       | ✅ `intake:*` | ✅ `intake:view` | ✅ `intake:view` | ❌      | ✅ `*`  | ✅ `intake:*` |
| Delete intake responsibility   | ⏸ URL commented out | —             | —                | —                | —       | —       | —             |

#### `ProjectInTakePublishViewSet`

| Action                   | Permission Checked | P-Admin       | P-Contributor | P-Commenter | P-Guest | W-Owner | W-Admin       |
| ------------------------ | ------------------ | ------------- | ------------- | ----------- | ------- | ------- | ------------- |
| Regenerate intake anchor | `intake:configure` | ✅ `intake:*` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `intake:*` |

#### `IntakeFormRegenerateViewSet`

| Action                 | Permission Checked | P-Admin       | P-Contributor | P-Commenter | P-Guest | W-Owner | W-Admin       |
| ---------------------- | ------------------ | ------------- | ------------- | ----------- | ------- | ------- | ------------- |
| Regenerate form anchor | `intake:configure` | ✅ `intake:*` | ❌            | ❌          | ❌      | ✅ `*`  | ✅ `intake:*` |

### Epics

#### `EpicViewSet`

| Action        | Permission Checked | P-Admin             | P-Contributor    | P-Commenter    | P-Guest  | W-Owner | W-Admin        |
| ------------- | ------------------ | ------------------- | ---------------- | -------------- | -------- | ------- | -------------- |
| List epics    | `epic:view`        | ✅ `epic:*`         | ✅ `epic:view`   | ✅ `epic:view` | ❌       | ✅ `*`  | ✅ `epic:*`    |
| Create epic   | `epic:create`      | ✅ `epic:*`         | ✅ `epic:create` | ❌             | ❌       | ✅ `*`  | ✅ `epic:*`    |
| Retrieve epic | `epic:view` ¹      | ✅ `epic:*`         | ✅ `epic:view`   | ✅ `epic:view` | +Creator | ✅ `*`  | ✅ `epic:*`    |
| Update epic   | `epic:edit` ¹      | ✅ `epic:*`         | ✅ `epic:edit`   | +Creator       | +Creator | ✅ `*`  | ✅ `epic:*`    |
| Delete epic   | `epic:delete` ¹    | ✅ `epic:*`         | +Creator         | +Creator       | +Creator | ✅ `*`  | ✅ `epic:*`    |
| Epic status   | `project:manage`   | ✅ `project:manage` | ❌               | ❌             | ❌       | ✅ `*`  | ✅ `project:*` |

> ¹ conditional `+creator` grant in `system_roles.py` — creators with active project membership can perform the action regardless of role.

#### Epic Comments — `EpicCommentViewSet`

| Action         | Permission Checked | P-Admin        | P-Contributor     | P-Commenter | P-Guest | W-Owner | W-Admin        |
| -------------- | ------------------ | -------------- | ----------------- | ----------- | ------- | ------- | -------------- |
| Create comment | `epic:comment`     | ✅ `epic:*`    | ✅ `epic:comment` | ❌          | ❌      | ✅ `*`  | ✅ `epic:*`    |
| Update comment | `comment:edit` ¹   | ✅ `comment:*` | ✅ `comment:edit` | ❌          | ❌      | ✅ `*`  | ✅ `comment:*` |
| Delete comment | `comment:delete` ¹ | ✅ `comment:*` | +Creator          | ❌          | ❌      | ✅ `*`  | ✅ `comment:*` |

> ¹ conditional `+creator` grant in `system_roles.py`

#### Epic Reactions — `EpicReactionViewSet`

| Action          | Permission Checked | P-Admin     | P-Contributor   | P-Commenter | P-Guest | W-Owner | W-Admin     |
| --------------- | ------------------ | ----------- | --------------- | ----------- | ------- | ------- | ----------- |
| Create reaction | `epic:react`       | ✅ `epic:*` | ✅ `epic:react` | ❌          | ❌      | ✅ `*`  | ✅ `epic:*` |
| Delete reaction | `epic:react`       | ✅ `epic:*` | ✅ `epic:react` | ❌          | ❌      | ✅ `*`  | ✅ `epic:*` |

#### Epic Attachments — `EpicAttachmentEndpoint`

| Action            | Permission Checked    | P-Admin           | P-Contributor  | P-Commenter    | P-Guest | W-Owner | W-Admin           |
| ----------------- | --------------------- | ----------------- | -------------- | -------------- | ------- | ------- | ----------------- |
| Upload attachment | `epic:view`           | ✅ `epic:*`       | ✅ `epic:view` | ✅ `epic:view` | ❌      | ✅ `*`  | ✅ `epic:*`       |
| List attachments  | `epic:view`           | ✅ `epic:*`       | ✅ `epic:view` | ✅ `epic:view` | ❌      | ✅ `*`  | ✅ `epic:*`       |
| Mark uploaded     | `epic:view`           | ✅ `epic:*`       | ✅ `epic:view` | ✅ `epic:view` | ❌      | ✅ `*`  | ✅ `epic:*`       |
| Delete attachment | `attachment:delete` ¹ | ✅ `attachment:*` | +Creator       | ❌             | ❌      | ✅ `*`  | ✅ `attachment:*` |

> ¹ conditional `+creator` grant in `system_roles.py`

#### Epic Activity — `EpicActivityEndpoint`

| Action               | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest | W-Owner | W-Admin     |
| -------------------- | ------------------ | ----------- | -------------- | -------------- | ------- | ------- | ----------- |
| List epic activities | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      | ✅ `*`  | ✅ `epic:*` |

#### Epic Issues — `EpicIssuesEndpoint`

| Action            | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest | W-Owner | W-Admin     |
| ----------------- | ------------------ | ----------- | -------------- | -------------- | ------- | ------- | ----------- |
| List child issues | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      | ✅ `*`  | ✅ `epic:*` |
| Add child issues  | `epic:edit`        | ✅ `epic:*` | ✅ `epic:edit` | ❌             | ❌      | ✅ `*`  | ✅ `epic:*` |

#### Epic Updates — `EpicsUpdateViewSet`

| Action        | Permission Checked     | P-Admin            | P-Contributor           | P-Commenter           | P-Guest | W-Owner | W-Admin            |
| ------------- | ---------------------- | ------------------ | ----------------------- | --------------------- | ------- | ------- | ------------------ |
| List updates  | `epic_update:view`     | ✅ `epic_update:*` | ✅ `epic_update:view`   | ✅ `epic_update:view` | ❌      | ✅ `*`  | ✅ `epic_update:*` |
| Create update | `epic_update:create`   | ✅ `epic_update:*` | ✅ `epic_update:create` | ❌                    | ❌      | ✅ `*`  | ✅ `epic_update:*` |
| Edit update   | `epic_update:edit` ¹   | ✅ `epic_update:*` | +Creator                | ❌                    | ❌      | ✅ `*`  | ✅ `epic_update:*` |
| Delete update | `epic_update:delete` ¹ | ✅ `epic_update:*` | +Creator                | ❌                    | ❌      | ✅ `*`  | ✅ `epic_update:*` |
| React         | `epic_update:react`    | ✅ `epic_update:*` | ✅ `epic_update:react`  | ❌                    | ❌      | ✅ `*`  | ✅ `epic_update:*` |

> ¹ conditional `+creator` grant in `system_roles.py` — creators with active project membership can edit/delete their own updates

#### Epic Update Comments — `EpicsUpdateCommentsViewSet`

| Action         | Permission Checked           | P-Admin                    | P-Contributor                   | P-Commenter           | P-Guest | W-Owner | W-Admin                    |
| -------------- | ---------------------------- | -------------------------- | ------------------------------- | --------------------- | ------- | ------- | -------------------------- |
| List comments  | `epic_update:view`           | ✅ `epic_update:*`         | ✅ `epic_update:view`           | ✅ `epic_update:view` | ❌      | ✅ `*`  | ✅ `epic_update:*`         |
| Create comment | `epic_update_comment:create` | ✅ `epic_update_comment:*` | ✅ `epic_update_comment:create` | ❌                    | ❌      | ✅ `*`  | ✅ `epic_update_comment:*` |

#### Epic Archive — `EpicArchiveViewSet`

| Action            | Permission Checked | P-Admin     | P-Contributor     | P-Commenter | P-Guest | W-Owner | W-Admin     |
| ----------------- | ------------------ | ----------- | ----------------- | ----------- | ------- | ------- | ----------- |
| List archived     | `epic:view`        | ✅ `epic:*` | ✅ `epic:view`    | ❌          | ❌      | ✅ `*`  | ✅ `epic:*` |
| Retrieve archived | `epic:view`        | ✅ `epic:*` | ✅ `epic:view`    | ❌          | ❌      | ✅ `*`  | ✅ `epic:*` |
| Archive epic      | `epic:archive`     | ✅ `epic:*` | ✅ `epic:archive` | ❌          | ❌      | ✅ `*`  | ✅ `epic:*` |
| Unarchive epic    | `epic:archive`     | ✅ `epic:*` | ✅ `epic:archive` | ❌          | ❌      | ✅ `*`  | ✅ `epic:*` |

#### Epic Update Reactions — `EpicsUpdatesReactionViewSet`

| Action          | Permission Checked  | P-Admin            | P-Contributor          | P-Commenter | P-Guest | W-Owner | W-Admin            |
| --------------- | ------------------- | ------------------ | ---------------------- | ----------- | ------- | ------- | ------------------ |
| Add reaction    | `epic_update:react` | ✅ `epic_update:*` | ✅ `epic_update:react` | ❌          | ❌      | ✅ `*`  | ✅ `epic_update:*` |
| Remove reaction | `epic_update:react` | ✅ `epic_update:*` | ✅ `epic_update:react` | ❌          | ❌      | ✅ `*`  | ✅ `epic_update:*` |

---

## Reactions (Parent-Level)

Reactions use `Action.REACT` on the parent resource. The "own only" constraint for delete is enforced at the view layer (queryset filter by `actor=request.user`).

| Action           | Permission Checked | P-Admin         | P-Contributor       | P-Commenter         | P-Guest            |
| ---------------- | ------------------ | --------------- | ------------------- | ------------------- | ------------------ |
| React to issue   | `workitem:react`   | ✅ `workitem:*` | ✅ `workitem:react` | ✅ `workitem:react` | ❌                 |
| React to epic    | `epic:react`       | ✅ `epic:*`     | ✅ `epic:react`     | ❌                  | ❌                 |
| React to comment | `comment:react`    | ✅ `comment:*`  | ✅ `comment:react`  | ✅ `comment:react`  | ✅ `comment:react` |
| React to project | `project:react`    | ✅ `project:*`  | ✅ `project:react`  | ❌                  | ❌                 |

> **Note**: Reaction permissions are unconditional — all users with the parent `*:react` grant can add/remove reactions. View-layer enforcement ensures users can only delete their own reactions.

## Comments (Universal — Conditional Grants)

Comments use conditional grants (`+creator`) for edit/delete on non-admin roles.

| Action               | Permission Checked       | P-Admin        | P-Contributor       | P-Commenter         | P-Guest |
| -------------------- | ------------------------ | -------------- | ------------------- | ------------------- | ------- |
| Create comment       | `comment:create`         | ✅ `comment:*` | ✅ `comment:create` | ✅ `comment:create` | ❌      |
| Edit comment (any)   | `comment:edit`           | ✅ `comment:*` | ❌                  | ❌                  | ❌      |
| Edit comment (own)   | `comment:edit+creator`   | —              | ✅                  | ✅                  | ❌      |
| Delete comment (any) | `comment:delete`         | ✅ `comment:*` | ❌                  | ❌                  | ❌      |
| Delete comment (own) | `comment:delete+creator` | —              | ✅                  | ✅                  | ❌      |

> **Note**: Admin has `comment:*` which grants unconditional edit/delete. Contributor/commenter have `comment:edit+creator` which grants edit only when user is the `created_by` of the comment.

## Attachments (Conditional Grants)

| Action                  | Permission Checked          | P-Admin           | P-Contributor          | P-Commenter            | P-Guest              |
| ----------------------- | --------------------------- | ----------------- | ---------------------- | ---------------------- | -------------------- |
| View attachments        | `attachment:view`           | ✅ `attachment:*` | ✅ `attachment:view`   | ✅ `attachment:view`   | ✅ `attachment:view` |
| Create attachment       | `attachment:create`         | ✅ `attachment:*` | ✅ `attachment:create` | ✅ `attachment:create` | ❌                   |
| Edit attachment (any)   | `attachment:edit`           | ✅ `attachment:*` | ❌                     | ❌                     | ❌                   |
| Edit attachment (own)   | `attachment:edit+creator`   | —                 | ✅                     | ❌                     | ❌                   |
| Delete attachment (any) | `attachment:delete`         | ✅ `attachment:*` | ❌                     | ❌                     | ❌                   |
| Delete attachment (own) | `attachment:delete+creator` | —                 | ✅                     | ❌                     | ❌                   |

## Pages (Interim — HasResourcePermission + ProjectPagePermission)

`HasResourcePermission` provides engine-based action gating; `ProjectPagePermission` handles page-specific business logic (owner bypass, private/shared pages). DRF runs both in AND order. Note: commenter/guest owner bypass no longer applies for edit/delete actions (blocked by `HasResourcePermission` before `ProjectPagePermission` runs). This is an interim migration — proper page GAC will be defined later.

#### `PageExtendedViewSet`

| Action         | Permission Checked | P-Admin     | P-Contributor    | P-Commenter    | P-Guest        | W-Owner | W-Admin     |
| -------------- | ------------------ | ----------- | ---------------- | -------------- | -------------- | ------- | ----------- |
| List pages     | `page:view`        | ✅ `page:*` | ✅ `page:view`   | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |
| Create page    | `page:create`      | ✅ `page:*` | ✅ `page:create` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Retrieve page  | `page:view`        | ✅ `page:*` | ✅ `page:view`   | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |
| Update page    | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Delete page    | `page:delete`      | ✅ `page:*` | ❌               | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Lock page      | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Unlock page    | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Access page    | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Archive page   | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Unarchive page | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Sub pages      | `page:view`        | ✅ `page:*` | ✅ `page:view`   | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |
| Parent pages   | `page:view`        | ✅ `page:*` | ✅ `page:view`   | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |
| Summary        | `page:view`        | ✅ `page:*` | ✅ `page:view`   | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |

#### `PageFavoriteExtendedViewSet`

Favorites are user-scoped — `page:view` is sufficient.

| Action          | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest        | W-Owner | W-Admin     |
| --------------- | ------------------ | ----------- | -------------- | -------------- | -------------- | ------- | ----------- |
| Favorite page   | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |
| Unfavorite page | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |

#### `PageFavoriteViewSet` (CE)

Uses `page:edit` — more restrictive than `PageFavoriteExtendedViewSet` (which uses `page:view`). This is the CE endpoint; Admin + Contributor only.

| Action          | Permission Checked | P-Admin     | P-Contributor  | P-Commenter | P-Guest | W-Owner | W-Admin     |
| --------------- | ------------------ | ----------- | -------------- | ----------- | ------- | ------- | ----------- |
| Favorite page   | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌          | ❌      | ✅ `*`  | ✅ `page:*` |
| Unfavorite page | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌          | ❌      | ✅ `*`  | ✅ `page:*` |

#### `PagesDescriptionExtendedViewSet`

| Action             | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest        | W-Owner | W-Admin     |
| ------------------ | ------------------ | ----------- | -------------- | -------------- | -------------- | ------- | ----------- |
| Get description    | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |
| Update description | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |

#### `PageDuplicateExtendedEndpoint`

| Action         | Permission Checked | P-Admin     | P-Contributor    | P-Commenter | P-Guest | W-Owner | W-Admin     |
| -------------- | ------------------ | ----------- | ---------------- | ----------- | ------- | ------- | ----------- |
| Duplicate page | `page:create`      | ✅ `page:*` | ✅ `page:create` | ❌          | ❌      | ✅ `*`  | ✅ `page:*` |

#### `PageVersionExtendedEndpoint`

| Action      | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest        | W-Owner | W-Admin     |
| ----------- | ------------------ | ----------- | -------------- | -------------- | -------------- | ------- | ----------- |
| Get version | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |

#### `ProjectPageCommentViewSet`

| Action            | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest        | W-Owner | W-Admin     |
| ----------------- | ------------------ | ----------- | -------------- | -------------- | -------------- | ------- | ----------- |
| List comments     | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |
| Create comment    | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Update comment    | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Delete comment    | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Resolve comment   | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Unresolve comment | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Restore comment   | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| List replies      | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |

#### `ProjectPageCommentReactionViewSet`

Reactions are self-scoped — `page:view` is sufficient.

| Action          | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest        | W-Owner | W-Admin     |
| --------------- | ------------------ | ----------- | -------------- | -------------- | -------------- | ------- | ----------- |
| Create reaction | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |
| Delete reaction | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |

#### `ProjectPageUserViewSet`

Share operations use `page:edit` — matches existing access model.

| Action      | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest        | W-Owner | W-Admin     |
| ----------- | ------------------ | ----------- | -------------- | -------------- | -------------- | ------- | ----------- |
| Share page  | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| List shares | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |
| Unshare     | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |

#### `ProjectPageExportViewSet`

Export is a read operation — `page:view` is sufficient.

| Action      | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest        | W-Owner | W-Admin     |
| ----------- | ------------------ | ----------- | -------------- | -------------- | -------------- | ------- | ----------- |
| Export page | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |

#### `ProjectPagePublishEndpoint`

| Action         | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest        | W-Owner | W-Admin     |
| -------------- | ------------------ | ----------- | -------------- | -------------- | -------------- | ------- | ----------- |
| Publish page   | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Update publish | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Get publish    | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |
| Unpublish page | `page:delete`      | ✅ `page:*` | ❌             | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |

#### `ProjectPageRestoreEndpoint`

| Action       | Permission Checked | P-Admin     | P-Contributor  | P-Commenter | P-Guest | W-Owner | W-Admin     |
| ------------ | ------------------ | ----------- | -------------- | ----------- | ------- | ------- | ----------- |
| Restore page | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌          | ❌      | ✅ `*`  | ✅ `page:*` |

#### `PageViewSet` (CE Base)

Same permissions as `PageExtendedViewSet` — CE base class overridden in production by `PageExtendedViewSet`. Uses `@can` + `ProjectPagePermission`.

| Action         | Permission Checked | P-Admin     | P-Contributor    | P-Commenter    | P-Guest        | W-Owner | W-Admin     |
| -------------- | ------------------ | ----------- | ---------------- | -------------- | -------------- | ------- | ----------- |
| List pages     | `page:view`        | ✅ `page:*` | ✅ `page:view`   | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |
| Create page    | `page:create`      | ✅ `page:*` | ✅ `page:create` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Retrieve page  | `page:view`        | ✅ `page:*` | ✅ `page:view`   | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |
| Update page    | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Delete page    | `page:delete`      | ✅ `page:*` | ❌               | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Lock page      | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Unlock page    | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Access page    | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Archive page   | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Unarchive page | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |
| Summary        | `page:view`        | ✅ `page:*` | ✅ `page:view`   | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |

#### `PagesDescriptionViewSet` (CE Base)

| Action             | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest        | W-Owner | W-Admin     |
| ------------------ | ------------------ | ----------- | -------------- | -------------- | -------------- | ------- | ----------- |
| Get description    | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |
| Update description | `page:edit`        | ✅ `page:*` | ✅ `page:edit` | ❌             | ❌             | ✅ `*`  | ✅ `page:*` |

#### `PageDuplicateEndpoint` (CE Base)

| Action         | Permission Checked | P-Admin     | P-Contributor    | P-Commenter | P-Guest | W-Owner | W-Admin     |
| -------------- | ------------------ | ----------- | ---------------- | ----------- | ------- | ------- | ----------- |
| Duplicate page | `page:create`      | ✅ `page:*` | ✅ `page:create` | ❌          | ❌      | ✅ `*`  | ✅ `page:*` |

#### `PageVersionEndpoint` (CE Base)

| Action      | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest        | W-Owner | W-Admin     |
| ----------- | ------------------ | ----------- | -------------- | -------------- | -------------- | ------- | ----------- |
| Get version | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` | ✅ `*`  | ✅ `page:*` |

#### `PageEmbedEndpoint` + `PageMentionEndpoint` + `PageFetchMetadataEndpoint`

Dynamic routing via inline `permission_engine.check()` — checks `page:view` (project), `teamspace_page:view` (teamspace), or `wiki:view` (workspace) based on query params.

| Context   | Permission Checked    | Access                                                                           |
| --------- | --------------------- | -------------------------------------------------------------------------------- |
| Project   | `page:view`           | P-Admin ✅, P-Contributor ✅, P-Commenter ✅, P-Guest ✅, W-Owner ✅, W-Admin ✅ |
| Teamspace | `teamspace_page:view` | TS-Member ✅, TS-Member+Lead ✅                                                  |
| Workspace | `wiki:view`           | W-Owner ✅, W-Admin ✅, W-Member ✅, W-Guest ❌                                  |

#### `MovePageEndpoint`

Workspace-level gate via `@can(WikiPermissions.EDIT)`. Inline `_check_move_permission()` validates source/target access.

| Action    | Permission Checked | W-Owner | W-Admin     | W-Member       | W-Guest |
| --------- | ------------------ | ------- | ----------- | -------------- | ------- |
| Move page | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit` | ❌      |

> **Note:** `_check_move_permission()` additionally validates project access (`role >= 15`, i.e., Admin or Contributor) and teamspace membership for source/target containers.

---

## Workspace Pages (Wiki) — Interim Migration

`HasResourcePermission` provides engine-based action gating; `WorkspacePagePermission` handles page-specific business logic (owner bypass, private/shared pages). DRF runs both in AND order.

#### `WorkspacePageViewSet`

| Action         | Permission Checked | W-Owner | W-Admin     | W-Member         | W-Guest |
| -------------- | ------------------ | ------- | ----------- | ---------------- | ------- |
| List pages     | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view`   | ❌      |
| Create page    | `wiki:create`      | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:create` | ❌      |
| Retrieve page  | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view`   | ❌      |
| Update page    | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit`   | ❌      |
| Delete page    | `wiki:delete`      | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:delete` | ❌      |
| Lock page      | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit`   | ❌      |
| Unlock page    | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit`   | ❌      |
| Access page    | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit`   | ❌      |
| Archive page   | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit`   | ❌      |
| Unarchive page | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit`   | ❌      |
| Sub pages      | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view`   | ❌      |
| Parent pages   | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view`   | ❌      |
| Summary        | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view`   | ❌      |

#### Other Workspace Page Endpoints

| Action             | Permission Checked | W-Owner | W-Admin     | W-Member         | W-Guest |
| ------------------ | ------------------ | ------- | ----------- | ---------------- | ------- |
| Duplicate page     | `wiki:create`      | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:create` | ❌      |
| Get description    | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view`   | ❌      |
| Update description | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit`   | ❌      |
| Get version        | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view`   | ❌      |
| Favorite page      | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view`   | ❌      |
| Unfavorite page    | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view`   | ❌      |
| Restore version    | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit`   | ❌      |

#### `WorkspacePageCommentViewSet`

| Action            | Permission Checked | W-Owner | W-Admin     | W-Member       | W-Guest |
| ----------------- | ------------------ | ------- | ----------- | -------------- | ------- |
| List comments     | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view` | ❌      |
| Create comment    | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit` | ❌      |
| Update comment    | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit` | ❌      |
| Delete comment    | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit` | ❌      |
| Resolve comment   | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit` | ❌      |
| Unresolve comment | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit` | ❌      |
| Restore comment   | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit` | ❌      |
| List replies      | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view` | ❌      |

#### `WorkspacePageCommentReactionViewSet`

Security improvement: previously had NO `permission_classes`. Reactions are self-scoped — `wiki:view` is sufficient.

| Action          | Permission Checked | W-Owner | W-Admin     | W-Member       | W-Guest |
| --------------- | ------------------ | ------- | ----------- | -------------- | ------- |
| Create reaction | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view` | ❌      |
| Delete reaction | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view` | ❌      |

#### `WorkspacePageUserViewSet`

Share operations use `wiki:edit` (not `wiki:share`) because W-Member has `wiki:edit` but not `wiki:share`.

| Action      | Permission Checked | W-Owner | W-Admin     | W-Member       | W-Guest |
| ----------- | ------------------ | ------- | ----------- | -------------- | ------- |
| Share page  | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit` | ❌      |
| List shares | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view` | ❌      |
| Unshare     | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit` | ❌      |

#### `WorkspacePageExportViewSet`

Export is a read operation — `wiki:view` is sufficient.

| Action      | Permission Checked | W-Owner | W-Admin     | W-Member       | W-Guest |
| ----------- | ------------------ | ------- | ----------- | -------------- | ------- |
| Export page | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view` | ❌      |

#### `WorkspacePagePublishEndpoint`

| Action         | Permission Checked | W-Owner | W-Admin     | W-Member         | W-Guest |
| -------------- | ------------------ | ------- | ----------- | ---------------- | ------- |
| Publish page   | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit`   | ❌      |
| Update publish | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit`   | ❌      |
| Get publish    | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view`   | ❌      |
| Unpublish page | `wiki:delete`      | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:delete` | ❌      |

---

## Teamspace Resources

### Teamspace Management

Workspace-level permissions for teamspaces. Workspace admin has wildcard access
(`teamspace:*`); the engine walks teamspace→workspace hierarchy so admin grants
resolve even without teamspace membership.

| Permission         | W-Owner | W-Admin          | W-Member              | W-Guest |
| ------------------ | ------- | ---------------- | --------------------- | ------- |
| `teamspace:browse` | ✅ `*`  | ✅ `teamspace:*` | ✅ `teamspace:browse` | ❌      |
| `teamspace:create` | ✅ `*`  | ✅ `teamspace:*` | ❌                    | ❌      |
| `teamspace:view`   | ✅ `*`  | ✅ `teamspace:*` | ❌                    | ❌      |
| `teamspace:edit`   | ✅ `*`  | ✅ `teamspace:*` | ❌                    | ❌      |
| `teamspace:delete` | ✅ `*`  | ✅ `teamspace:*` | ❌                    | ❌      |
| `teamspace:manage` | ✅ `*`  | ✅ `teamspace:*` | ❌                    | ❌      |

### Teamspace Content Access

Teamspace-level permissions resolved against the teamspace membership tuple
(used when the user is not a workspace admin):

| Permission         | TS-Member           | TS-Member+Lead             |
| ------------------ | ------------------- | -------------------------- |
| `teamspace:view`   | ✅ `teamspace:view` | ✅ `teamspace:view`        |
| `teamspace:edit`   | ❌                  | ✅ `teamspace:edit+lead`   |
| `teamspace:delete` | ❌                  | ✅ `teamspace:delete+lead` |
| `teamspace:manage` | ❌                  | ✅ `teamspace:manage+lead` |

### Teamspace Content Permissions (Granular)

Content endpoints use granular resource types (`teamspace_comment`, `teamspace_view`, `teamspace_page`, `teamspace_page_comment`) with `scope_param_type=ResourceType.TEAMSPACE`. The engine resolves against the teamspace membership tuple. Creator/lead enforcement is handled inline in view code.

W-Admin gets `teamspace_comment:*`, `teamspace_view:*`, `teamspace_page:*`, `teamspace_page_comment:*` wildcards at workspace level.

#### Teamspace Comments — `TeamspaceCommentEndpoint`

| Action   | Permission Checked         | W-Owner | W-Admin                  | TS-Member           |
| -------- | -------------------------- | ------- | ------------------------ | ------------------- |
| List     | `teamspace:view`           | ✅ `*`  | ✅                       | ✅ `teamspace:view` |
| Create   | `teamspace_comment:create` | ✅ `*`  | ✅ `teamspace_comment:*` | ✅                  |
| Edit ¹   | `teamspace_comment:edit`   | ✅ `*`  | ✅ `teamspace_comment:*` | ✅                  |
| Delete ¹ | `teamspace_comment:delete` | ✅ `*`  | ✅ `teamspace_comment:*` | ✅                  |
| React    | `teamspace_comment:react`  | ✅ `*`  | ✅ `teamspace_comment:*` | ✅                  |

> ¹ Inline check: `comment.actor_id != request.user.id` → `is_admin_or_teamspace_lead()` fallback

#### Teamspace Views — `TeamspaceViewEndpoint`

| Action        | Permission Checked      | W-Owner | W-Admin               | TS-Member           |
| ------------- | ----------------------- | ------- | --------------------- | ------------------- |
| List/Retrieve | `teamspace:view`        | ✅ `*`  | ✅                    | ✅ `teamspace:view` |
| Create        | `teamspace_view:create` | ✅ `*`  | ✅ `teamspace_view:*` | ✅                  |
| Edit ¹        | `teamspace_view:edit`   | ✅ `*`  | ✅ `teamspace_view:*` | ✅                  |
| Delete ¹      | `teamspace_view:delete` | ✅ `*`  | ✅ `teamspace_view:*` | ✅                  |

> ¹ Inline check: `issue_view.owned_by_id != request.user.id` → `is_admin_or_teamspace_lead()` fallback

#### Teamspace Pages — `TeamspacePageEndpoint` and related

| Action             | Permission Checked       | W-Owner | W-Admin               | TS-Member           |
| ------------------ | ------------------------ | ------- | --------------------- | ------------------- |
| List/Retrieve      | `teamspace:view`         | ✅ `*`  | ✅                    | ✅ `teamspace:view` |
| Create             | `teamspace_page:create`  | ✅ `*`  | ✅ `teamspace_page:*` | ✅                  |
| Duplicate          | `teamspace_page:create`  | ✅ `*`  | ✅ `teamspace_page:*` | ✅                  |
| Edit (metadata)    | `teamspace_page:edit`    | ✅ `*`  | ✅ `teamspace_page:*` | ✅                  |
| Edit (description) | `teamspace_page:edit`    | ✅ `*`  | ✅ `teamspace_page:*` | ✅                  |
| View (description) | `teamspace_page:view`    | ✅ `*`  | ✅ `teamspace_page:*` | ✅                  |
| Delete ¹           | `teamspace_page:delete`  | ✅ `*`  | ✅ `teamspace_page:*` | ✅                  |
| Archive ¹          | `teamspace_page:archive` | ✅ `*`  | ✅ `teamspace_page:*` | ✅                  |
| Unarchive ¹        | `teamspace_page:archive` | ✅ `*`  | ✅ `teamspace_page:*` | ✅                  |
| Lock ¹             | `teamspace_page:edit`    | ✅ `*`  | ✅ `teamspace_page:*` | ✅                  |
| Unlock ¹           | `teamspace_page:edit`    | ✅ `*`  | ✅ `teamspace_page:*` | ✅                  |

> ¹ Inline check: `page.owned_by_id != request.user.id` → `is_admin_or_teamspace_lead()` fallback

#### Teamspace Page Comments — `TeamspacePageCommentEndpoint` and related

| Action         | Permission Checked               | W-Owner | W-Admin                       | TS-Member           |
| -------------- | -------------------------------- | ------- | ----------------------------- | ------------------- |
| List/Retrieve  | `teamspace:view`                 | ✅ `*`  | ✅                            | ✅ `teamspace:view` |
| Replies (list) | `teamspace:view`                 | ✅ `*`  | ✅                            | ✅ `teamspace:view` |
| Create         | `teamspace_page_comment:create`  | ✅ `*`  | ✅ `teamspace_page_comment:*` | ✅                  |
| Edit ¹         | `teamspace_page_comment:edit`    | ✅ `*`  | ✅ `teamspace_page_comment:*` | ✅                  |
| Delete ¹       | `teamspace_page_comment:delete`  | ✅ `*`  | ✅ `teamspace_page_comment:*` | ✅                  |
| Restore ¹      | `teamspace_page_comment:delete`  | ✅ `*`  | ✅ `teamspace_page_comment:*` | ✅                  |
| Resolve        | `teamspace_page_comment:resolve` | ✅ `*`  | ✅ `teamspace_page_comment:*` | ✅                  |
| Unresolve      | `teamspace_page_comment:resolve` | ✅ `*`  | ✅ `teamspace_page_comment:*` | ✅                  |
| React          | `teamspace_page_comment:react`   | ✅ `*`  | ✅ `teamspace_page_comment:*` | ✅                  |

> ¹ Inline check: `page_comment.created_by_id != request.user.id` → `_is_admin_or_teamspace_lead()` fallback

### Read-Only / Self-Scoped Teamspace Endpoints (Unchanged)

These endpoints keep `@can(TeamspacePermissions.VIEW, resource_param="team_space_id")`:

| Endpoint                           | Method(s) | Permission       | Access     |
| ---------------------------------- | --------- | ---------------- | ---------- |
| `TeamspaceEntitiesEndpoint`        | GET       | `teamspace:view` | TS members |
| `TeamspaceProgressChartEndpoint`   | GET       | `teamspace:view` | TS members |
| `TeamspaceProgressSummaryEndpoint` | GET       | `teamspace:view` | TS members |
| `TeamspaceRelationEndpoint`        | GET       | `teamspace:view` | TS members |
| `TeamspaceStatisticsEndpoint`      | GET       | `teamspace:view` | TS members |
| `TeamspaceCycleEndpoint`           | GET       | `teamspace:view` | TS members |
| `TeamspaceModuleEndpoint`          | GET       | `teamspace:view` | TS members |
| `TeamspaceIssueEndpoint`           | GET       | `teamspace:view` | TS members |
| `TeamspaceUserPropertiesEndpoint`  | PATCH/GET | `teamspace:view` | TS members |
| `TeamspaceActivityEndpoint`        | GET       | `teamspace:view` | TS members |
| `TeamspacePageSummaryEndpoint`     | GET       | `teamspace:view` | TS members |
| `TeamspaceSubPageEndpoint`         | GET       | `teamspace:view` | TS members |
| `TeamspaceParentPageEndpoint`      | GET       | `teamspace:view` | TS members |
| `TeamspacePageVersionEndpoint`     | GET       | `teamspace:view` | TS members |

### Teamspace Link Relations

Teamspace members get **contributor-level** project permissions on linked projects via link relation traversal. The role is stored on the teamspace->project `ResourcePermission` tuple (`relation="contributor"`), not hardcoded in config.

See `PERMISSION_LINK_RELATIONS.md` for full documentation of the link relation system.

#### Effective Access for Teamspace Members on Linked Projects

Teamspace members get the same permissions as direct project contributors:

| Resource         | View | Create | Edit     | Delete   | Notes                  |
| ---------------- | ---- | ------ | -------- | -------- | ---------------------- |
| Issues           | ✅   | ✅     | ✅       | +Creator | Same as P-Contributor  |
| Cycles           | ✅   | ✅     | ✅       | +Creator |                        |
| Modules          | ✅   | ✅     | ✅       | +Creator |                        |
| Pages            | ✅   | ✅     | ✅       | +Creator |                        |
| Views            | ✅   | ✅     | ✅ ¹     | +Creator | ¹ Inline creator check |
| Labels           | ✅   | ❌     | ❌       | ❌       | View only              |
| States           | ✅   | ❌     | ❌       | ❌       | View only              |
| Estimates        | ✅   | ❌     | ❌       | ❌       | View only              |
| Project Settings | ✅   | —      | ❌       | ❌       | View only              |
| Comments         | ✅   | ✅     | +Creator | +Creator |                        |
| Attachments      | ✅   | ✅     | +Creator | +Creator |                        |

> Direct project membership takes priority over teamspace-linked access. If a user has both, the direct role is checked first.

### Workspace User Endpoints — Batch

User-scoped workspace endpoints. All filter by `user_id` param or `request.user`.

| Endpoint                             | Action              | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| ------------------------------------ | ------------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| `WorkspaceUserProfileIssuesEndpoint` | List user issues    | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| `WorkspaceUserPropertiesEndpoint`    | Get/patch own props | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| `WorkspaceUserActivityEndpoint`      | List user activity  | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

> All three are user-scoped. ProfileIssues and Activity use `.accessible_to()`. Properties is self-scoped (own data only).

### Workspace Labels — `WorkspaceLabelsEndpoint`

| Action       | Permission Checked | W-Owner | W-Admin               | W-Member            | W-Guest             |
| ------------ | ------------------ | ------- | --------------------- | ------------------- | ------------------- |
| List labels  | `workspace:view`   | ✅ `*`  | ✅ `workspace:view`   | ✅ `workspace:view` | ✅ `workspace:view` |
| Create label | `workspace:manage` | ✅ `*`  | ✅ `workspace:manage` | ❌                  | ❌                  |

> Labels GET uses `.accessible_to()` and filters archived projects.

### Workspace Analytics (Default) — Batch

| Endpoint                   | Action            | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| -------------------------- | ----------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| `DefaultAnalyticsEndpoint` | Default analytics | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| `ProjectStatsEndpoint`     | Project stats     | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

> No project-level data filtering — returns stats from all projects. Existing behavior preserved for parity.

### Project Labels — `ProjectLabelsEndpoint` / `ProjectLabelDetailEndpoint`

| Action       | Permission Checked | W-Owner | W-Admin               | W-Member            | W-Guest             |
| ------------ | ------------------ | ------- | --------------------- | ------------------- | ------------------- |
| List labels  | `workspace:view`   | ✅ `*`  | ✅ `workspace:view`   | ✅ `workspace:view` | ✅ `workspace:view` |
| Create label | `workspace:manage` | ✅ `*`  | ✅ `workspace:manage` | ❌                  | ❌                  |
| Get label    | `workspace:view`   | ✅ `*`  | ✅ `workspace:view`   | ✅ `workspace:view` | ✅ `workspace:view` |
| Update label | `workspace:manage` | ✅ `*`  | ✅ `workspace:manage` | ❌                  | ❌                  |
| Delete label | `workspace:manage` | ✅ `*`  | ✅ `workspace:manage` | ❌                  | ❌                  |

### Onboarding — `WorkspaceMemberUserOnboardingEndpoint`

| Action            | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| ----------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| Update onboarding | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

> Self-scoped: user can only update their own onboarding fields (`WorkspaceMember.objects.get(member=request.user)` inline check).

### Analytics — `AnalyticsEndpoint`, `SavedAnalyticEndpoint`, `ExportAnalyticsEndpoint`

| Action           | Permission Checked | W-Owner | W-Admin               | W-Member              | W-Guest |
| ---------------- | ------------------ | ------- | --------------------- | --------------------- | ------- |
| View analytics   | `analytics:view`   | ✅ `*`  | ✅ `analytics:view`   | ✅ `analytics:view`   | ❌      |
| View saved       | `analytics:view`   | ✅ `*`  | ✅ `analytics:view`   | ✅ `analytics:view`   | ❌      |
| Export analytics | `analytics:export` | ✅ `*`  | ✅ `analytics:export` | ✅ `analytics:export` | ❌      |

### Advance Analytics — `AdvanceAnalyticsEndpoint`, `AdvanceAnalyticsStatsEndpoint`, `AdvanceAnalyticsChartEndpoint`

| Action         | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest |
| -------------- | ------------------ | ------- | ------------------- | ------------------- | ------- |
| Overview/tabs  | `analytics:view`   | ✅ `*`  | ✅ `analytics:view` | ✅ `analytics:view` | ❌      |
| Stats by type  | `analytics:view`   | ✅ `*`  | ✅ `analytics:view` | ✅ `analytics:view` | ❌      |
| Charts by type | `analytics:view`   | ✅ `*`  | ✅ `analytics:view` | ✅ `analytics:view` | ❌      |

> Analytics endpoints query all workspace data (no project-level filtering). Some tabs/types are additionally gated by `check_workspace_feature_flag(FeatureFlag.ANALYTICS_ADVANCED)`.

### Issue Exports — `ExportIssuesEndpoint`

| Action        | Permission Checked | W-Owner | W-Admin               | W-Member                | W-Guest |
| ------------- | ------------------ | ------- | --------------------- | ----------------------- | ------- |
| Create export | `analytics:export` | ✅ `*`  | ✅ `analytics:export` | ✅ `analytics:export`   | ❌      |
| List exports  | `analytics:export` | ✅ `*`  | ✅ `analytics:export` | ✅ `analytics:export` ¹ | ❌      |

> ¹ Data-level filter: members see only exports they initiated (`initiated_by=request.user`). Admins/owners see all exports.

### Workspace Members — `WorkSpaceMemberViewSet`

| Action        | Permission Checked             | W-Owner | W-Admin                           | W-Member                   | W-Guest                      |
| ------------- | ------------------------------ | ------- | --------------------------------- | -------------------------- | ---------------------------- |
| List members  | `workspace_member:view`        | ✅ `*`  | ✅ `workspace_member:view`        | ✅ `workspace_member:view` | ✅ `workspace_member:view` ¹ |
| Update role   | `workspace_member:change_role` | ✅ `*`  | ✅ `workspace_member:change_role` | ❌                         | ❌                           |
| Remove member | `workspace_member:remove`      | ✅ `*`  | ✅ `workspace_member:remove`      | ❌                         | ❌                           |
| Leave         | `workspace:view`               | ✅ `*`  | ✅ `workspace:view`               | ✅ `workspace:view`        | ✅ `workspace:view`          |

> ¹ Guest grant added to `system_roles.py` — FE fetches member list on workspace init. Guests receive basic serializer (no PII); non-guests receive admin serializer (includes email, last_login_medium).
> `retrieve` removed from URL config (unused by FE).
> **Inline checks:** `partial_update` — self-update prevention, role hierarchy enforcement (can't modify higher role / can't assign higher than own), guest cascade, seat limit validation. `destroy` — self-removal prevention, role hierarchy check, last admin protection.

### Project Members — `ProjectMemberViewSet`

| Action        | Permission Checked             | P-Admin               | P-Contributor            | P-Commenter              | P-Guest                  |
| ------------- | ------------------------------ | --------------------- | ------------------------ | ------------------------ | ------------------------ |
| Invite member | `project_member:invite`        | ✅ `project_member:*` | ❌                       | ❌                       | ❌                       |
| List members  | `project_member:view`          | ✅ `project_member:*` | ✅ `project_member:view` | ✅ `project_member:view` | ✅ `project_member:view` |
| View member   | `project_member:view`          | ✅ `project_member:*` | ✅ `project_member:view` | ✅ `project_member:view` | ✅ `project_member:view` |
| Update role   | `project_member:change_role` ² | ✅ `project_member:*` | ❌                       | ❌                       | ❌                       |
| Remove member | `project_member:remove`        | ✅ `project_member:*` | ❌                       | ❌                       | ❌                       |
| Leave         | `project:view`                 | ✅ `project_member:*` | ✅ `project:view`        | ✅ `project:view`        | ✅ `project:view`        |

> W-Owner/W-Admin always have access via workspace-level wildcards (omitted from project table). W-Admin has `project_member:*` in workspace admin bypass grants.
> ² **Tightened from `@allow_permission([ADMIN, MEMBER, GUEST])` to admin-only.** Old code allowed all roles but inline hierarchy checks prevented non-admins from useful operations. FE gates role dropdown to admin only.
> **Inline checks:** `create` — workspace↔project role constraints. `retrieve` — serializer PII gating (guests see limited fields). `partial_update` — self-update prevention (unless workspace admin), workspace↔project role constraint, role hierarchy check. `destroy` — self-removal prevention, role hierarchy check. `leave` — last admin protection.

### Workspace Member User Endpoints — `WorkspaceMemberUserViewsEndpoint`, `WorkspaceMemberUserEndpoint`

Self-scoped: both endpoints only operate on `member=request.user`.

| Action            | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| ----------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| Update view props | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Get member-me     | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

### Project Subscribers — `ProjectSubscriberEndpoint`

| Action            | Permission Checked | P-Admin        | P-Contributor | P-Commenter | P-Guest |
| ----------------- | ------------------ | -------------- | ------------- | ----------- | ------- |
| List subscribers  | `project:manage`   | ✅ `project:*` | ❌            | ❌          | ❌      |
| Create/update sub | `project:manage`   | ✅ `project:*` | ❌            | ❌          | ❌      |

> W-Owner/W-Admin always have access via workspace-level `project:*` wildcard (omitted from project table).

### AI Endpoints — `WorkspaceGPTIntegrationEndpoint`, `RephraseGrammarEndpoint`

| Action           | Permission Checked | W-Owner | W-Admin   | W-Member  | W-Guest |
| ---------------- | ------------------ | ------- | --------- | --------- | ------- |
| Workspace GPT    | `ai:use`           | ✅ `*`  | ✅ `ai:*` | ✅ `ai:*` | ❌      |
| Rephrase/Grammar | `ai:use`           | ✅ `*`  | ✅ `ai:*` | ✅ `ai:*` | ❌      |

> `GPTIntegrationEndpoint` (project-level) is unused — URL commented out. Not called by FE.

### Workspace Activity — `WorkspaceMemberActivityEndpoint`

| Action               | Permission Checked        | W-Owner | W-Admin                      | W-Member                     | W-Guest |
| -------------------- | ------------------------- | ------- | ---------------------------- | ---------------------------- | ------- |
| View member activity | `workspace_activity:view` | ✅ `*`  | ✅ `workspace_activity:view` | ✅ `workspace_activity:view` | ❌      |

### Export Workspace User Activity — `ExportWorkspaceUserActivityEndpoint`

| Action                 | Permission Checked          | W-Owner | W-Admin                        | W-Member                       | W-Guest |
| ---------------------- | --------------------------- | ------- | ------------------------------ | ------------------------------ | ------- |
| Export member activity | `workspace_activity:export` | ✅ `*`  | ✅ `workspace_activity:export` | ✅ `workspace_activity:export` | ❌      |

### Workspace Favorites — `WorkspaceFavoriteEndpoint`, `WorkspaceFavoriteGroupEndpoint`

| Action          | Permission Checked | W-Owner | W-Admin         | W-Member             | W-Guest |
| --------------- | ------------------ | ------- | --------------- | -------------------- | ------- |
| List favorites  | `favorite:view`    | ✅ `*`  | ✅ `favorite:*` | ✅ `favorite:view`   | ❌      |
| Create favorite | `favorite:create`  | ✅ `*`  | ✅ `favorite:*` | ✅ `favorite:create` | ❌      |
| Update favorite | `favorite:edit`    | ✅ `*`  | ✅ `favorite:*` | ✅ `favorite:edit`   | ❌      |
| Delete favorite | `favorite:delete`  | ✅ `*`  | ✅ `favorite:*` | ✅ `favorite:delete` | ❌      |
| List group      | `favorite:view`    | ✅ `*`  | ✅ `favorite:*` | ✅ `favorite:view`   | ❌      |

> Collection endpoints (`list`, `create`) use `resource_param="workspace_id"` — resolved via `BaseAPIView.workspace_id` property. Detail endpoints (`update`, `delete`, `group list`) use `resource_param="favorite_id"` — engine resolves `UserFavorite` → workspace via hierarchy.
>
> **Data-level filter:** `WorkspaceFavoriteGroupEndpoint.get` additionally filters by project membership inline (`Q(project__project_projectmember__member=request.user)`). This is a data-level filter, not a permission gate.

### Project Activity — `ProjectActivityEndpoint`

| Action                | Permission Checked      | P-Admin                 | P-Contributor              | P-Commenter                | P-Guest                    |
| --------------------- | ----------------------- | ----------------------- | -------------------------- | -------------------------- | -------------------------- |
| View project activity | `project_activity:view` | ✅ `project_activity:*` | ✅ `project_activity:view` | ✅ `project_activity:view` | ✅ `project_activity:view` |

> W-Owner/W-Admin always have access via workspace-level `project_activity:*` wildcard (omitted from project table).

### Project Member Activity — `ProjectMemberActivityEndpoint`

| Action               | Permission Checked             | P-Admin                        | P-Contributor | P-Commenter | P-Guest |
| -------------------- | ------------------------------ | ------------------------------ | ------------- | ----------- | ------- |
| View member activity | `project_member_activity:view` | ✅ `project_member_activity:*` | ❌            | ❌          | ❌      |

> W-Owner/W-Admin always have access via workspace-level `project_member_activity:*` wildcard (omitted from project table).

### EE Project Worklogs — `ProjectWorkLogsEndpoint`, `ProjectExportWorkLogsEndpoint`

| Action              | Permission Checked | P-Admin        | P-Contributor | P-Commenter | P-Guest |
| ------------------- | ------------------ | -------------- | ------------- | ----------- | ------- |
| View worklogs       | `project:manage`   | ✅ `project:*` | ❌            | ❌          | ❌      |
| View export history | `project:manage`   | ✅ `project:*` | ❌            | ❌          | ❌      |
| Export worklogs     | `project:manage`   | ✅ `project:*` | ❌            | ❌          | ❌      |

> W-Owner/W-Admin always have access via workspace-level `project:*` wildcard (omitted from project table).

### Issue Subscribers — `IssueSubscriberViewSet`

| Action              | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest                         |
| ------------------- | ------------------ | --------------- | ------------------ | ------------------ | ------------------------------- |
| Subscribe           | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | ✅ own issues (`+creator`) only |
| Unsubscribe         | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | ✅ own issues (`+creator`) only |
| Subscription status | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | ✅ own issues (`+creator`) only |

> W-Owner/W-Admin always have access via workspace-level `workitem:*` wildcard (omitted from project table).
>
> Unused endpoints (`list`, `create`, `destroy` via `/issue-subscribers/` URLs) have been commented out — not called by FE. Migrate to `@can` before re-enabling.

### Sub-Issues — `SubIssuesEndpoint`

| Action            | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest  | W-Owner | W-Admin         |
| ----------------- | ------------------ | --------------- | ------------------ | ------------------ | -------- | ------- | --------------- |
| List sub-issues   | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator | ✅ `*`  | ✅ `workitem:*` |
| Assign sub-issues | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | +Creator           | +Creator | ✅ `*`  | ✅ `workitem:*` |

> `resource_param="issue_id"` — permission is checked against the parent issue. Guest access via `workitem:view+creator` / `workitem:edit+creator` conditional grants — only on issues they created.

### Issue Search — `IssueSearchEndpoint`

| Action        | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest               |
| ------------- | ------------------ | --------------- | ------------------ | ------------------ | --------------------- |
| Search issues | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator (deferred) ¹ |

> W-Owner/W-Admin always have access via workspace-level `workitem:*` wildcard (omitted from project table).
>
> ¹ `defer_conditions=True` — guest sees only own issues via `created_by` queryset filter. Old system had no permission gate (any authenticated user could access); new system requires project membership.
>
> Cross-project results (when `workspace_search=true`) are scoped by `.accessible_to()` queryset manager, not by the `@can` decorator.

### Project Analytics

#### `ProjectAdvanceAnalyticsEndpoint`

| Action                 | Permission Checked       | P-Admin                  | P-Contributor               | P-Commenter                 | P-Guest | W-Owner | W-Admin                  |
| ---------------------- | ------------------------ | ------------------------ | --------------------------- | --------------------------- | ------- | ------- | ------------------------ |
| View advance analytics | `project_analytics:view` | ✅ `project_analytics:*` | ✅ `project_analytics:view` | ✅ `project_analytics:view` | ❌      | ✅ `*`  | ✅ `project_analytics:*` |

#### `ProjectAdvanceAnalyticsStatsEndpoint`

| Action               | Permission Checked       | P-Admin                  | P-Contributor               | P-Commenter                 | P-Guest | W-Owner | W-Admin                  |
| -------------------- | ------------------------ | ------------------------ | --------------------------- | --------------------------- | ------- | ------- | ------------------------ |
| View analytics stats | `project_analytics:view` | ✅ `project_analytics:*` | ✅ `project_analytics:view` | ✅ `project_analytics:view` | ❌      | ✅ `*`  | ✅ `project_analytics:*` |

#### `ProjectAdvanceAnalyticsChartEndpoint`

| Action                | Permission Checked       | P-Admin                  | P-Contributor               | P-Commenter                 | P-Guest | W-Owner | W-Admin                  |
| --------------------- | ------------------------ | ------------------------ | --------------------------- | --------------------------- | ------- | ------- | ------------------------ |
| View analytics charts | `project_analytics:view` | ✅ `project_analytics:*` | ✅ `project_analytics:view` | ✅ `project_analytics:view` | ❌      | ✅ `*`  | ✅ `project_analytics:*` |

> P-Commenter granted `project_analytics:view` (2026-02-22) for FE parity — progress-section-root.tsx is shown to all project members. P-Guest excluded: analytics exposes aggregate issue counts beyond guest's creator-only scope.

#### `ProjectAnalyticsEndpoint` (EE)

| Action                 | Permission Checked       | P-Admin                  | P-Contributor               | P-Commenter                 | P-Guest | W-Owner | W-Admin                  |
| ---------------------- | ------------------------ | ------------------------ | --------------------------- | --------------------------- | ------- | ------- | ------------------------ |
| View project analytics | `project_analytics:view` | ✅ `project_analytics:*` | ✅ `project_analytics:view` | ✅ `project_analytics:view` | ❌      | ✅ `*`  | ✅ `project_analytics:*` |

> Access tightened from old `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")`. Now requires project membership or workspace admin bypass.

### Epics — `EpicViewSet` & Related Endpoints

| Action      | Permission Checked | P-Admin     | P-Contributor    | P-Commenter    | P-Guest | W-Owner | W-Admin     |
| ----------- | ------------------ | ----------- | ---------------- | -------------- | ------- | ------- | ----------- |
| Create epic | `epic:create`      | ✅ `epic:*` | ✅ `epic:create` | ❌             | ❌      | ✅ `*`  | ✅ `epic:*` |
| List epics  | `epic:view`        | ✅ `epic:*` | ✅ `epic:view`   | ✅ `epic:view` | ❌      | ✅ `*`  | ✅ `epic:*` |
| View epic   | `epic:view`        | ✅ `epic:*` | ✅ `epic:view`   | ✅ `epic:view` | ❌      | ✅ `*`  | ✅ `epic:*` |
| Edit epic   | `epic:edit`        | ✅ `epic:*` | ✅ `epic:edit`   | ❌             | ❌      | ✅ `*`  | ✅ `epic:*` |
| Delete epic | `epic:delete`      | ✅ `epic:*` | ❌               | ❌             | ❌      | ✅ `*`  | ✅ `epic:*` |

> W-Owner/W-Admin always have access via workspace-level wildcards (omitted from project table above for brevity).

#### `EpicMetaListEndpoint`

| Action         | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest |
| -------------- | ------------------ | ----------- | -------------- | -------------- | ------- |
| List epic meta | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |

#### `EpicUserDisplayPropertyEndpoint`

| Action                    | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest |
| ------------------------- | ------------------ | ----------- | -------------- | -------------- | ------- |
| Get display properties    | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |
| Update display properties | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |

> `VIEW` is correct for PATCH — this updates the user's own display preferences, not the epic itself.

#### `EpicAnalyticsEndpoint`

| Action              | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest |
| ------------------- | ------------------ | ----------- | -------------- | -------------- | ------- |
| View epic analytics | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |

#### `EpicDetailEndpoint`

| Action            | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest |
| ----------------- | ------------------ | ----------- | -------------- | -------------- | ------- |
| List epic details | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |

#### `WorkspaceEpicEndpoint`

| Action               | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| -------------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| List workspace epics | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

> Access broadening: W-Guest gains gate access. Safe — `.accessible_to()` filters by project membership, and project guests have no `epic:view` grants so the queryset returns empty results.

#### `EpicListAnalyticsEndpoint`

| Action              | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest |
| ------------------- | ------------------ | ----------- | -------------- | -------------- | ------- |
| List epic analytics | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |

#### `EpicMetaEndpoint`

| Action         | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest |
| -------------- | ------------------ | ----------- | -------------- | -------------- | ------- |
| View epic meta | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |

#### `EpicDescriptionVersionEndpoint`

| Action                    | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest |
| ------------------------- | ------------------ | ----------- | -------------- | -------------- | ------- |
| View description versions | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |

> Dead code removed: inline `guest_view_all_features` check was unreachable after migration (P-Guest blocked by `@can`, P-Commenter not `role=5`).

#### `EpicSubscriberViewSet`

| Action              | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest |
| ------------------- | ------------------ | ----------- | -------------- | -------------- | ------- |
| Subscribe           | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |
| Unsubscribe         | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |
| Subscription status | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |

> Subscribing is a personal preference, not an edit — `epic:view` is sufficient.

#### `EpicLinkViewSet`

| Action      | Permission Checked | P-Admin          | P-Contributor         | P-Commenter         | P-Guest |
| ----------- | ------------------ | ---------------- | --------------------- | ------------------- | ------- |
| List links  | `epic_link:view`   | ✅ `epic_link:*` | ✅ `epic_link:view`   | ✅ `epic_link:view` | ❌      |
| View link   | `epic_link:view`   | ✅ `epic_link:*` | ✅ `epic_link:view`   | ✅ `epic_link:view` | ❌      |
| Create link | `epic_link:create` | ✅ `epic_link:*` | ✅ `epic_link:create` | ❌                  | ❌      |
| Edit link   | `epic_link:edit`   | ✅ `epic_link:*` | ✅ `epic_link:edit`   | ❌                  | ❌      |
| Delete link | `epic_link:delete` | ✅ `epic_link:*` | ✅ `epic_link:delete` | ❌                  | ❌      |

#### `EpicPropertyEndpoint`

| Action          | Permission Checked     | P-Admin              | P-Contributor             | P-Commenter             | P-Guest |
| --------------- | ---------------------- | -------------------- | ------------------------- | ----------------------- | ------- |
| View properties | `epic_property:view`   | ✅ `epic_property:*` | ✅ `epic_property:view`   | ✅ `epic_property:view` | ❌      |
| Create property | `epic_property:create` | ✅ `epic_property:*` | ✅ `epic_property:create` | ❌                      | ❌      |
| Edit property   | `epic_property:edit`   | ✅ `epic_property:*` | ✅ `epic_property:edit`   | ❌                      | ❌      |
| Delete property | `epic_property:delete` | ✅ `epic_property:*` | ✅ `epic_property:delete` | ❌                      | ❌      |

#### `WorkspaceEpicTypeEndpoint`

| Action          | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| --------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| List epic types | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

> Access broadening: W-Guest gains gate access. Safe — `.accessible_to()` filters by project membership.

#### `ProjectEpicTypeEndpoint`

| Action          | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest |
| --------------- | ------------------ | ----------- | -------------- | -------------- | ------- |
| List epic types | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |

#### `EpicPropertyOptionEndpoint`

| Action        | Permission Checked   | P-Admin              | P-Contributor           | P-Commenter             | P-Guest |
| ------------- | -------------------- | -------------------- | ----------------------- | ----------------------- | ------- |
| View options  | `epic_property:view` | ✅ `epic_property:*` | ✅ `epic_property:view` | ✅ `epic_property:view` | ❌      |
| Create option | `epic_property:edit` | ✅ `epic_property:*` | ✅ `epic_property:edit` | ❌                      | ❌      |
| Edit option   | `epic_property:edit` | ✅ `epic_property:*` | ✅ `epic_property:edit` | ❌                      | ❌      |
| Delete option | `epic_property:edit` | ✅ `epic_property:*` | ✅ `epic_property:edit` | ❌                      | ❌      |

> Option CRUD uses `epic_property:edit` — managing options is part of editing the property schema, not a separate resource lifecycle.

#### `EpicPropertyValueEndpoint`

| Action      | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest |
| ----------- | ------------------ | ----------- | -------------- | -------------- | ------- |
| View values | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |
| Set values  | `epic:edit`        | ✅ `epic:*` | ✅ `epic:edit` | ❌             | ❌      |
| Patch value | `epic:edit`        | ✅ `epic:*` | ✅ `epic:edit` | ❌             | ❌      |

> Uses `EpicPermissions` (not `EpicPropertyPermissions`) — setting property values is editing the epic, not the property schema.

#### `EpicPropertyActivityEndpoint`

| Action          | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest |
| --------------- | ------------------ | ----------- | -------------- | -------------- | ------- |
| View activities | `epic:view`        | ✅ `epic:*` | ✅ `epic:view` | ✅ `epic:view` | ❌      |

### Workspace Draft Issues — `WorkspaceDraftIssueViewSet`

Drafts are personal workspace resources. Data-level scoping (`created_by=request.user`) ensures users only see/modify their own drafts.

| Action             | Permission Checked       | W-Owner | W-Admin                | W-Member                    | W-Guest                     |
| ------------------ | ------------------------ | ------- | ---------------------- | --------------------------- | --------------------------- |
| List own drafts    | `workspace_draft:view`   | ✅ `*`  | ✅ `workspace_draft:*` | ✅ `workspace_draft:view`   | ✅ `workspace_draft:view`   |
| Create draft       | `workspace_draft:create` | ✅ `*`  | ✅ `workspace_draft:*` | ✅ `workspace_draft:create` | ✅ `workspace_draft:create` |
| Retrieve own draft | `workspace_draft:view`   | ✅ `*`  | ✅ `workspace_draft:*` | ✅ `workspace_draft:view`   | ✅ `workspace_draft:view`   |
| Edit own draft     | `workspace_draft:edit`   | ✅ `*`  | ✅ `workspace_draft:*` | ✅ `workspace_draft:edit`   | ✅ `workspace_draft:edit`   |
| Delete draft       | `workspace_draft:delete` | ✅ `*`  | ✅ `workspace_draft:*` | +Creator                    | +Creator                    |
| Convert to issue   | `workspace_draft:manage` | ✅ `*`  | ✅ `workspace_draft:*` | ✅ `workspace_draft:manage` | ❌                          |

### Workspace Invitations — `WorkspaceInvitationsViewset`

| Action                 | Permission Checked        | W-Owner | W-Admin                      | W-Member | W-Guest |
| ---------------------- | ------------------------- | ------- | ---------------------------- | -------- | ------- |
| List invitations       | `workspace_member:invite` | ✅ `*`  | ✅ `workspace_member:invite` | ❌       | ❌      |
| Create invitation      | `workspace_member:invite` | ✅ `*`  | ✅ `workspace_member:invite` | ❌       | ❌      |
| Retrieve invitation    | `workspace_member:invite` | ✅ `*`  | ✅ `workspace_member:invite` | ❌       | ❌      |
| Update invitation role | `workspace_member:invite` | ✅ `*`  | ✅ `workspace_member:invite` | ❌       | ❌      |
| Delete invitation      | `workspace_member:invite` | ✅ `*`  | ✅ `workspace_member:invite` | ❌       | ❌      |

### Automations — `AutomationEndpoint`, `AutomationStatusEndpoint`

All automation endpoints are gated by `@check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)` in addition to `@can`.

| Action              | Permission Checked  | P-Admin           | P-Contributor        | P-Commenter | P-Guest |
| ------------------- | ------------------- | ----------------- | -------------------- | ----------- | ------- |
| List automations    | `automation:view`   | ✅ `automation:*` | ✅ `automation:view` | ❌          | ❌      |
| Retrieve automation | `automation:view`   | ✅ `automation:*` | ✅ `automation:view` | ❌          | ❌      |
| Create automation   | `automation:create` | ✅ `automation:*` | ❌                   | ❌          | ❌      |
| Update automation   | `automation:edit`   | ✅ `automation:*` | ❌                   | ❌          | ❌      |
| Delete automation   | `automation:delete` | ✅ `automation:*` | ❌                   | ❌          | ❌      |
| Toggle status       | `automation:edit`   | ✅ `automation:*` | ❌                   | ❌          | ❌      |

> W-Owner has access via `*` wildcard. W-Admin has access via `automation:*` in project-level bypass section.

### Automation Nodes — `AutomationNodeEndpoint`

| Action        | Permission Checked | P-Admin           | P-Contributor        | P-Commenter | P-Guest |
| ------------- | ------------------ | ----------------- | -------------------- | ----------- | ------- |
| List nodes    | `automation:view`  | ✅ `automation:*` | ✅ `automation:view` | ❌          | ❌      |
| Retrieve node | `automation:view`  | ✅ `automation:*` | ✅ `automation:view` | ❌          | ❌      |
| Create node   | `automation:edit`  | ✅ `automation:*` | ❌                   | ❌          | ❌      |
| Update node   | `automation:edit`  | ✅ `automation:*` | ❌                   | ❌          | ❌      |
| Delete node   | `automation:edit`  | ✅ `automation:*` | ❌                   | ❌          | ❌      |

> Node mutations use `automation:edit` (not `automation:create`/`automation:delete`) because managing nodes IS editing the automation.

### Automation Edges — `AutomationEdgeEndpoint`

Same pattern as `AutomationNodeEndpoint`.

| Action        | Permission Checked | P-Admin           | P-Contributor        | P-Commenter | P-Guest |
| ------------- | ------------------ | ----------------- | -------------------- | ----------- | ------- |
| List edges    | `automation:view`  | ✅ `automation:*` | ✅ `automation:view` | ❌          | ❌      |
| Retrieve edge | `automation:view`  | ✅ `automation:*` | ✅ `automation:view` | ❌          | ❌      |
| Create edge   | `automation:edit`  | ✅ `automation:*` | ❌                   | ❌          | ❌      |
| Update edge   | `automation:edit`  | ✅ `automation:*` | ❌                   | ❌          | ❌      |
| Delete edge   | `automation:edit`  | ✅ `automation:*` | ❌                   | ❌          | ❌      |

### Automation Activities — `AutomationActivityEndpoint`

| Action            | Permission Checked | P-Admin           | P-Contributor        | P-Commenter | P-Guest |
| ----------------- | ------------------ | ----------------- | -------------------- | ----------- | ------- |
| List activities   | `automation:view`  | ✅ `automation:*` | ✅ `automation:view` | ❌          | ❌      |
| Retrieve activity | `automation:view`  | ✅ `automation:*` | ✅ `automation:view` | ❌          | ❌      |

### Dashboards — `DashboardViewSet`

All endpoints gated by `@check_feature_flag(FeatureFlag.DASHBOARDS)` above `@can`.

| Action             | Permission Checked | W-Owner | W-Admin          | W-Member            | W-Guest |
| ------------------ | ------------------ | ------- | ---------------- | ------------------- | ------- |
| List dashboards    | `dashboard:view`   | ✅ `*`  | ✅ `dashboard:*` | ✅ `dashboard:view` | ❌      |
| Create dashboard   | `dashboard:create` | ✅ `*`  | ✅ `dashboard:*` | ❌                  | ❌      |
| Retrieve dashboard | `dashboard:view`   | ✅ `*`  | ✅ `dashboard:*` | ✅ `dashboard:view` | ❌      |
| Update dashboard   | `dashboard:edit`   | ✅ `*`  | ✅ `dashboard:*` | ❌                  | ❌      |
| Delete dashboard   | `dashboard:delete` | ✅ `*`  | ✅ `dashboard:*` | ❌                  | ❌      |

### Dashboard Widgets — `WidgetEndpoint`

| Action        | Permission Checked | W-Owner | W-Admin          | W-Member            | W-Guest |
| ------------- | ------------------ | ------- | ---------------- | ------------------- | ------- |
| List widgets  | `dashboard:view`   | ✅ `*`  | ✅ `dashboard:*` | ✅ `dashboard:view` | ❌      |
| Create widget | `dashboard:create` | ✅ `*`  | ✅ `dashboard:*` | ❌                  | ❌      |
| Update widget | `dashboard:edit`   | ✅ `*`  | ✅ `dashboard:*` | ❌                  | ❌      |
| Delete widget | `dashboard:delete` | ✅ `*`  | ✅ `dashboard:*` | ❌                  | ❌      |

### Widget Charts — `WidgetListEndpoint`

| Action     | Permission Checked | W-Owner | W-Admin          | W-Member            | W-Guest |
| ---------- | ------------------ | ------- | ---------------- | ------------------- | ------- |
| View chart | `dashboard:view`   | ✅ `*`  | ✅ `dashboard:*` | ✅ `dashboard:view` | ❌      |

### Bulk Widget Update — `BulkWidgetEndpoint`

| Action              | Permission Checked | W-Owner | W-Admin          | W-Member | W-Guest |
| ------------------- | ------------------ | ------- | ---------------- | -------- | ------- |
| Bulk update widgets | `dashboard:edit`   | ✅ `*`  | ✅ `dashboard:*` | ❌       | ❌      |

### Cycle State Analytics — `CycleIssueStateAnalyticsEndpoint`

| Action               | Permission Checked | P-Admin      | P-Contributor   | P-Commenter     | P-Guest |
| -------------------- | ------------------ | ------------ | --------------- | --------------- | ------- |
| View state analytics | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view` | ✅ `cycle:view` | ❌      |

> W-Owner/W-Admin always have access via workspace-level wildcards (omitted from project tables). Feature flag `CYCLE_PROGRESS_CHARTS` gates access above `@can`.

### Automated Cycles — `AutomatedCycleViewSet`

| Action                 | Permission Checked | P-Admin      | P-Contributor | P-Commenter | P-Guest |
| ---------------------- | ------------------ | ------------ | ------------- | ----------- | ------- |
| List automated cycles  | `cycle:manage`     | ✅ `cycle:*` | ❌            | ❌          | ❌      |
| Create automated cycle | `cycle:manage`     | ✅ `cycle:*` | ❌            | ❌          | ❌      |
| Update automated cycle | `cycle:manage`     | ✅ `cycle:*` | ❌            | ❌          | ❌      |

> Admin-only (`cycle:manage` only granted via `cycle:*` wildcard). Feature flag `AUTO_SCHEDULE_CYCLES` gates access above `@can`.

### Cycle Start/Stop — `CycleStartStopEndpoint`

| Action           | Permission Checked | P-Admin      | P-Contributor   | P-Commenter | P-Guest |
| ---------------- | ------------------ | ------------ | --------------- | ----------- | ------- |
| Start/stop cycle | `cycle:edit`       | ✅ `cycle:*` | ✅ `cycle:edit` | ❌          | ❌      |

> Feature flag `CYCLE_PROGRESS_CHARTS` gates access above `@can`.

### Cycle Updates — `CycleUpdatesViewSet`

New resource type: `CYCLE_UPDATE` (actions: VIEW, CREATE, EDIT, DELETE, REACT). Follows `EPIC_UPDATE` pattern.

| Action          | Permission Checked    | P-Admin             | P-Contributor            | P-Commenter            | P-Guest |
| --------------- | --------------------- | ------------------- | ------------------------ | ---------------------- | ------- |
| List updates    | `cycle_update:view`   | ✅ `cycle_update:*` | ✅ `cycle_update:view`   | ✅ `cycle_update:view` | ❌      |
| Retrieve update | `cycle_update:view`   | ✅ `cycle_update:*` | ✅ `cycle_update:view`   | ✅ `cycle_update:view` | ❌      |
| List comments   | `cycle_update:view`   | ✅ `cycle_update:*` | ✅ `cycle_update:view`   | ✅ `cycle_update:view` | ❌      |
| Create update   | `cycle_update:create` | ✅ `cycle_update:*` | ✅ `cycle_update:create` | ❌                     | ❌      |
| Edit update     | `cycle_update:edit`   | ✅ `cycle_update:*` | +Creator                 | ❌                     | ❌      |
| Delete update   | `cycle_update:delete` | ✅ `cycle_update:*` | +Creator                 | ❌                     | ❌      |

> W-Owner/W-Admin always have access via workspace-level `cycle_update:*` wildcard.
> +Creator = conditional grant (`cycle_update:edit+creator` / `cycle_update:delete+creator`); only creators with active membership.
> Feature flag `CYCLE_PROGRESS_CHARTS` gates access above `@can`.

### Cycle Update Reactions — `CycleUpdatesReactionViewSet`

REACT action added to `CYCLE_UPDATE` resource type (2026-02-22). Follows `EPIC_UPDATE` and `COMMENT` REACT pattern. URL changed — `cycle_id` now in path.

| Action          | Permission Checked   | P-Admin             | P-Contributor           | P-Commenter             | P-Guest |
| --------------- | -------------------- | ------------------- | ----------------------- | ----------------------- | ------- |
| Add reaction    | `cycle_update:react` | ✅ `cycle_update:*` | ✅ `cycle_update:react` | ✅ `cycle_update:react` | ❌      |
| Remove reaction | `cycle_update:react` | ✅ `cycle_update:*` | ✅ `cycle_update:react` | ✅ `cycle_update:react` | ❌      |

> Access tightened from old `@allow_permission([ADMIN, MEMBER, GUEST])`. P-Guest loses access (no `cycle_update` grants at all). P-Commenter gains REACT (can view updates, should be able to react).

### Milestones — `MilestoneViewSet`, `MilestoneWorkItemsSearchEndpoint`, `MilestoneWorkItemsEndpoint`, `WorkItemMilestoneEndpoint`

New resource type: `MILESTONE` (actions: VIEW, CREATE, EDIT, DELETE). Follows cycle/module access pattern — guest has no access.

| Action             | Permission Checked | P-Admin          | P-Contributor         | P-Commenter         | P-Guest |
| ------------------ | ------------------ | ---------------- | --------------------- | ------------------- | ------- |
| List milestones    | `milestone:view`   | ✅ `milestone:*` | ✅ `milestone:view`   | ✅ `milestone:view` | ❌      |
| Retrieve milestone | `milestone:view`   | ✅ `milestone:*` | ✅ `milestone:view`   | ✅ `milestone:view` | ❌      |
| Create milestone   | `milestone:create` | ✅ `milestone:*` | ✅ `milestone:create` | ❌                  | ❌      |
| Edit milestone     | `milestone:edit`   | ✅ `milestone:*` | ✅ `milestone:edit`   | ❌                  | ❌      |
| Delete milestone   | `milestone:delete` | ✅ `milestone:*` | ✅ `milestone:delete` | ❌                  | ❌      |
| Search work items  | `milestone:view`   | ✅ `milestone:*` | ✅ `milestone:view`   | ✅ `milestone:view` | ❌      |
| List work items    | `milestone:view`   | ✅ `milestone:*` | ✅ `milestone:view`   | ✅ `milestone:view` | ❌      |
| Add work items     | `milestone:edit`   | ✅ `milestone:*` | ✅ `milestone:edit`   | ❌                  | ❌      |
| Remove work items  | `milestone:edit`   | ✅ `milestone:*` | ✅ `milestone:edit`   | ❌                  | ❌      |
| Assign work item   | `milestone:edit`   | ✅ `milestone:*` | ✅ `milestone:edit`   | ❌                  | ❌      |
| Unassign work item | `milestone:edit`   | ✅ `milestone:*` | ✅ `milestone:edit`   | ❌                  | ❌      |

> W-Owner/W-Admin always have access via workspace-level `milestone:*` wildcard.
> **Access change from old system:** `ProjectMemberPermission` allowed GET for Admin (20), Member (15), Guest (5). New system removes Guest VIEW access, consistent with cycle/module pattern. Commenter (10) gains VIEW.

### Recurring Work Items — `RecurringWorkItemViewSet`, `RecurringWorkItemActivitiesEndpoint`

New resource type: `RECURRING_WORKITEM` (actions: VIEW, CREATE, EDIT, DELETE). Admin + Contributor only. Feature flag `RECURRING_WORKITEMS` gates access above `@can`.

| Action          | Permission Checked          | P-Admin                   | P-Contributor                  | P-Commenter | P-Guest |
| --------------- | --------------------------- | ------------------------- | ------------------------------ | ----------- | ------- |
| List items      | `recurring_workitem:view`   | ✅ `recurring_workitem:*` | ✅ `recurring_workitem:view`   | ❌          | ❌      |
| Retrieve item   | `recurring_workitem:view`   | ✅ `recurring_workitem:*` | ✅ `recurring_workitem:view`   | ❌          | ❌      |
| Create item     | `recurring_workitem:create` | ✅ `recurring_workitem:*` | ✅ `recurring_workitem:create` | ❌          | ❌      |
| Edit item       | `recurring_workitem:edit`   | ✅ `recurring_workitem:*` | ✅ `recurring_workitem:edit`   | ❌          | ❌      |
| Delete item     | `recurring_workitem:delete` | ✅ `recurring_workitem:*` | ✅ `recurring_workitem:delete` | ❌          | ❌      |
| View activities | `recurring_workitem:view`   | ✅ `recurring_workitem:*` | ✅ `recurring_workitem:view`   | ❌          | ❌      |

> W-Owner/W-Admin always have access via workspace-level `recurring_workitem:*` wildcard.
> Direct mapping from old `@allow_permission([ADMIN, MEMBER])` → P-Admin + P-Contributor. No access change.

### Workspace Active Cycles — `WorkspaceActiveCycleEndpoint`

| Action             | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| ------------------ | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| List active cycles | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

> All workspace roles have `workspace:view`. Data-level filtering via `.accessible_to()` limits results per user's project membership. Feature flag `WORKSPACE_ACTIVE_CYCLES` gates access above `@can`.

### Workflows — `WorkflowTransitionEndpoint`, `WorkflowEndpoint`, `DefaultWorkflowEndpoint`, `WorkflowActivityEndpoint`, `WorkflowTransitionApproverEndpoint`, `WorkflowStatesEndpoint`, `WorkflowStateTransitionsEndpoint`

Resource type: `WORKFLOW` (actions: VIEW, CREATE, EDIT, DELETE). Admin-only create/edit/delete; all project roles can view.

| Action                     | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest            |
| -------------------------- | ------------------ | --------------- | ------------------ | ------------------ | ------------------ |
| List workflows             | `workspace:view`   | ✅ (workspace)  | ✅ (workspace)     | ✅ (workspace)     | ✅ (workspace)     |
| View activities            | `workflow:view`    | ✅ `workflow:*` | ✅ `workflow:view` | ✅ `workflow:view` | ✅ `workflow:view` |
| Create workflow            | `workflow:create`  | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |
| Create default workflow    | `workflow:create`  | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |
| Create transition          | `workflow:edit`    | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |
| Edit transition            | `workflow:edit`    | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |
| Delete transition          | `workflow:edit`    | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |
| Add states to workflow     | `workflow:edit`    | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |
| Update workflow state      | `workflow:edit`    | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |
| Remove state from workflow | `workflow:edit`    | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |
| Create state transition    | `workflow:edit`    | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |
| Update state transition    | `workflow:edit`    | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |
| Delete state transition    | `workflow:edit`    | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |
| Edit workflow (patch)      | `workflow:edit`    | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |
| Delete workflow            | `workflow:delete`  | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |
| Add transition approver    | `workflow:edit`    | ✅ `workflow:*` | ❌                 | ❌                 | ❌                 |

> W-Owner/W-Admin always have access via workspace-level `workflow:*` wildcard.
> **List workflows** uses `WorkspacePermissions.VIEW` (`workspace:view`) — accessible to any workspace member. All other operations are project-scoped.
> **CREATE action added:** `WorkflowPermissions` now includes CREATE. Used by `WorkflowEndpoint.post` and `DefaultWorkflowEndpoint.post`.
> **Access change on `WorkflowStatesEndpoint.post` (add states):** Old system allowed ADMIN + MEMBER (Contributor). New system checks `workflow:edit`, which is only granted to P-Admin. Intentionally tighter — adding states to a workflow is a project settings operation.
> **Access change on `WorkflowEndpoint.patch`:** Old system allowed W-Admin + W-Member. New system resolves `state_id` to parent project and checks `workflow:edit`, which is only granted to P-Admin (and W-Admin/W-Owner via wildcard). Intentionally tighter — workflow rules are project settings.

## Customer

### Customer CRUD — `CustomerEndpoint`

| Action                    | Permission Checked | W-Owner | W-Admin         | W-Member | W-Guest |
| ------------------------- | ------------------ | ------- | --------------- | -------- | ------- |
| List / retrieve customers | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Create customer           | `customer:create`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Update customer           | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Delete customer           | `customer:delete`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |

### Customer Properties — `CustomerPropertyEndpoint`

| Action                     | Permission Checked | W-Owner | W-Admin         | W-Member | W-Guest |
| -------------------------- | ------------------ | ------- | --------------- | -------- | ------- |
| List / retrieve properties | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Create property            | `customer:create`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Update property            | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Delete property            | `customer:delete`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |

### Customer Property Options — `CustomerPropertyOptionEndpoint`

| Action                  | Permission Checked | W-Owner | W-Admin         | W-Member | W-Guest |
| ----------------------- | ------------------ | ------- | --------------- | -------- | ------- |
| List / retrieve options | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |

### Customer Requests — `CustomerRequestEndpoint`

| Action                   | Permission Checked | W-Owner | W-Admin         | W-Member | W-Guest |
| ------------------------ | ------------------ | ------- | --------------- | -------- | ------- |
| List / retrieve requests | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Create request           | `customer:create`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Update request           | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Delete request           | `customer:delete`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |

### Customer Issues — `CustomerIssuesEndpoint`

> **Security fix**: Previously had NO `permission_classes` — any authenticated user could access.

| Action                     | Permission Checked | W-Owner | W-Admin         | W-Member | W-Guest |
| -------------------------- | ------------------ | ------- | --------------- | -------- | ------- |
| List customer issues       | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Link issues to customer    | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Unlink issue from customer | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |

### Customer Property Values — `CustomerPropertyValueEndpoint`

| Action                | Permission Checked | W-Owner | W-Admin         | W-Member | W-Guest |
| --------------------- | ------------------ | ------- | --------------- | -------- | ------- |
| Get property values   | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Set property values   | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Update property value | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |

### Customer Issue Search — `CustomerIssueSearchEndpoint`

| Action                     | Permission Checked | W-Owner | W-Admin         | W-Member | W-Guest |
| -------------------------- | ------------------ | ------- | --------------- | -------- | ------- |
| Search issues for customer | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |

### Customer Request Attachments — `CustomerRequestAttachmentV2Endpoint`

| Action                      | Permission Checked | W-Owner | W-Admin         | W-Member | W-Guest |
| --------------------------- | ------------------ | ------- | --------------- | -------- | ------- |
| List / download attachments | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Upload attachment           | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Update attachments          | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Delete attachment           | `customer:delete`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |

### Issue Customer Lookup — `IssueCustomerEndpoint`

| Action                  | Permission Checked | W-Owner | W-Admin         | W-Member | W-Guest |
| ----------------------- | ------------------ | ------- | --------------- | -------- | ------- |
| Get customers for issue | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |

### Issue Customer Requests — `IssueCustomerRequestEndpoint`

| Action                          | Permission Checked | W-Owner | W-Admin         | W-Member | W-Guest |
| ------------------------------- | ------------------ | ------- | --------------- | -------- | ------- |
| Get customer requests for issue | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |

## Integration (OAuth) — `INTEGRATION` resource type

> Workspace-scoped. W-Admin has `"integration:*"` (wildcard). W-Member has explicit VIEW/CREATE/EDIT/DELETE/CONNECT grants (no MANAGE). W-Guest has no integration grants.

### OAuth Applications — `OAuthApplicationEndpoint`

| Action                  | Permission Checked   | W-Owner | W-Admin            | W-Member                | W-Guest |
| ----------------------- | -------------------- | ------- | ------------------ | ----------------------- | ------- |
| List / get applications | `integration:view`   | ✅ `*`  | ✅ `integration:*` | ✅ `integration:view`   | ❌      |
| Create application      | `integration:create` | ✅ `*`  | ✅ `integration:*` | ✅ `integration:create` | ❌      |
| Update application      | `integration:edit`   | ✅ `*`  | ✅ `integration:*` | ✅ `integration:edit`   | ❌      |
| Delete application      | `integration:delete` | ✅ `*`  | ✅ `integration:*` | ✅ `integration:delete` | ❌      |

### Regenerate Secret — `OAuthApplicationRegenerateSecretEndpoint`

| Action                   | Permission Checked | W-Owner | W-Admin            | W-Member              | W-Guest |
| ------------------------ | ------------------ | ------- | ------------------ | --------------------- | ------- |
| Regenerate client secret | `integration:edit` | ✅ `*`  | ✅ `integration:*` | ✅ `integration:edit` | ❌      |

### Check Slug — `OAuthApplicationCheckSlugEndpoint`

| Action                  | Permission Checked   | W-Owner | W-Admin            | W-Member                | W-Guest |
| ----------------------- | -------------------- | ------- | ------------------ | ----------------------- | ------- |
| Check slug availability | `integration:create` | ✅ `*`  | ✅ `integration:*` | ✅ `integration:create` | ❌      |

### Install Application — `OAuthApplicationInstallEndpoint`

| Action              | Permission Checked    | W-Owner | W-Admin            | W-Member                 | W-Guest |
| ------------------- | --------------------- | ------- | ------------------ | ------------------------ | ------- |
| Install application | `integration:connect` | ✅ `*`  | ✅ `integration:*` | ✅ `integration:connect` | ❌      |

> **Note:** Inline business logic requires `ROLE.ADMIN` for first-time installs. Members can only install after an admin has installed first.

### Publish Application — `OAuthApplicationPublishEndpoint`

| Action              | Permission Checked | W-Owner | W-Admin            | W-Member              | W-Guest |
| ------------------- | ------------------ | ------- | ------------------ | --------------------- | ------- |
| Publish application | `integration:edit` | ✅ `*`  | ✅ `integration:*` | ✅ `integration:edit` | ❌      |

> **Note:** Inline business logic restricts publishing to the `ApplicationOwner` only — not all users with `integration:edit`.

### Uninstall Application (Workspace) — `OAuthAppInstallationDetailEndpoint`

| Action                    | Permission Checked   | W-Owner | W-Admin            | W-Member | W-Guest |
| ------------------------- | -------------------- | ------- | ------------------ | -------- | ------- |
| Uninstall app (workspace) | `integration:manage` | ✅ `*`  | ✅ `integration:*` | ❌       | ❌      |

### Disconnect User Installation — `OAuthUserAppInstallationDetailEndpoint`

| Action                  | Permission Checked    | W-Owner | W-Admin            | W-Member                 | W-Guest |
| ----------------------- | --------------------- | ------- | ------------------ | ------------------------ | ------- |
| Disconnect user install | `integration:connect` | ✅ `*`  | ✅ `integration:*` | ✅ `integration:connect` | ❌      |

### Published Application by Slug — `OAuthPublishedApplicationBySlugEndpoint`

| Action                       | Permission Checked | W-Owner | W-Admin | W-Member | W-Guest |
| ---------------------------- | ------------------ | ------- | ------- | -------- | ------- |
| (Unused — URL commented out) | N/A                | N/A     | N/A     | N/A      | N/A     |

### Legacy Integration — `WorkspaceIntegrationViewSet`

> Workspace-scoped. GitHub/Slack OAuth callback integration install. Only `create` is active; list/retrieve/destroy URLs commented out (Pattern H).

| Action                     | Permission Checked           | W-Owner | W-Admin            | W-Member                 | W-Guest |
| -------------------------- | ---------------------------- | ------- | ------------------ | ------------------------ | ------- |
| Connect integration (POST) | `integration:connect`        | ✅ `*`  | ✅ `integration:*` | ✅ `integration:connect` | ❌      |
| List / Retrieve / Destroy  | (Unused — URL commented out) | N/A     | N/A                | N/A                      | N/A     |

### Legacy Integration — `SlackProjectSyncViewSet`

> Workspace-scoped (permission check via workspace_id). Slack channel sync for a project. Only `create` is active; list/retrieve/destroy URLs commented out (Pattern H).

| Action                       | Permission Checked           | W-Owner | W-Admin            | W-Member                 | W-Guest |
| ---------------------------- | ---------------------------- | ------- | ------------------ | ------------------------ | ------- |
| Connect Slack channel (POST) | `integration:connect`        | ✅ `*`  | ✅ `integration:*` | ✅ `integration:connect` | ❌      |
| List / Retrieve / Destroy    | (Unused — URL commented out) | N/A     | N/A                | N/A                      | N/A     |

### Legacy Integration — Unused Views (Pattern H)

> All URLs commented out. `IntegrationViewSet`, `GithubRepositoriesEndpoint`, `GithubRepositorySyncViewSet`, `GithubIssueSyncViewSet`, `BulkCreateGithubIssueSyncEndpoint` (SECURITY: had no permission_classes), `GithubCommentSyncViewSet`.

| Action                     | Permission Checked | W-Owner | W-Admin | W-Member | W-Guest |
| -------------------------- | ------------------ | ------- | ------- | -------- | ------- |
| (All — URLs commented out) | N/A                | N/A     | N/A     | N/A      | N/A     |

## Workspace Asset Operations — `WORKSPACE_ASSET` resource type

> Workspace-scoped. New resource type for asset utility operations (download, serve, check, reupload, restore, duplicate, bulk-link). W-Owner has `"*"` (full bypass). W-Admin has `"workspace_asset:*"` (wildcard). W-Member has VIEW + CREATE. W-Guest has VIEW only.

### Workspace Asset Utility — `WorkspaceReuploadAssetEndpoint`, `AssetRestoreEndpoint`, `AssetCheckEndpoint`, `DuplicateAssetEndpoint` (CE), `WorkspaceAssetDownloadEndpoint`, `WorkspaceFileAssetServerEndpoint`, `WorkspaceBulkAssetEndpoint`

| Action                                                                | Permission Checked     | W-Owner | W-Admin                | W-Member                  | W-Guest                   |
| --------------------------------------------------------------------- | ---------------------- | ------- | ---------------------- | ------------------------- | ------------------------- |
| Download / Serve / Check / Reupload / Restore / Duplicate / Bulk-link | `workspace_asset:view` | ✅ `*`  | ✅ `workspace_asset:*` | ✅ `workspace_asset:view` | ✅ `workspace_asset:view` |

### EE Bulk Duplicate — `DuplicateAssetEndpoint` (EE)

| Action                | Permission Checked       | W-Owner | W-Admin                | W-Member                    | W-Guest |
| --------------------- | ------------------------ | ------- | ---------------------- | --------------------------- | ------- |
| Bulk duplicate assets | `workspace_asset:create` | ✅ `*`  | ✅ `workspace_asset:*` | ✅ `workspace_asset:create` | ❌      |

### Silo Upload — `SiloAssetsEndpoint`

| Action                             | Permission Checked       | W-Owner | W-Admin                | W-Member | W-Guest |
| ---------------------------------- | ------------------------ | ------- | ---------------------- | -------- | ------- |
| Silo file upload (Notion importer) | `workspace_asset:manage` | ✅ `*`  | ✅ `workspace_asset:*` | ❌       | ❌      |

> **Note:** `SiloAssetsEndpoint` also requires `@check_feature_flag(FeatureFlag.NOTION_IMPORTER)` (checked before permission).

## Project Asset Operations — `PROJECT_ASSET` resource type

> Project-scoped. New resource type for project asset operations (upload, mark uploaded, delete, view, download, serve). P-Admin has `"project_asset:*"` (wildcard). P-Contributor and P-Commenter have VIEW + CREATE + EDIT(+creator) + DELETE(+creator). P-Guest has VIEW only.

### Project Asset CRUD — `ProjectAssetEndpoint`

| Action                | Permission Checked     | P-Admin              | P-Contributor                     | P-Commenter                       | P-Guest                 |
| --------------------- | ---------------------- | -------------------- | --------------------------------- | --------------------------------- | ----------------------- |
| Upload asset (POST)   | `project_asset:create` | ✅ `project_asset:*` | ✅ `project_asset:create`         | ✅ `project_asset:create`         | ❌                      |
| Mark uploaded (PATCH) | `project_asset:edit`   | ✅ `project_asset:*` | ✅ `project_asset:edit+creator`   | ✅ `project_asset:edit+creator`   | ❌                      |
| Delete asset          | `project_asset:delete` | ✅ `project_asset:*` | ✅ `project_asset:delete+creator` | ✅ `project_asset:delete+creator` | ❌                      |
| Get presigned URL     | `project_asset:view`   | ✅ `project_asset:*` | ✅ `project_asset:view`           | ✅ `project_asset:view`           | ✅ `project_asset:view` |

### Project Asset Upload Flow — `ProjectReuploadAssetEndpoint`, `ProjectBulkAssetEndpoint`

| Action                      | Permission Checked     | P-Admin              | P-Contributor             | P-Commenter               | P-Guest |
| --------------------------- | ---------------------- | -------------------- | ------------------------- | ------------------------- | ------- |
| Reupload / Bulk-link assets | `project_asset:create` | ✅ `project_asset:*` | ✅ `project_asset:create` | ✅ `project_asset:create` | ❌      |

### Project Asset Download / Serve — `ProjectAssetDownloadEndpoint`, `ProjectAssetServerEndpoint`

| Action                 | Permission Checked   | P-Admin              | P-Contributor           | P-Commenter             | P-Guest                 |
| ---------------------- | -------------------- | -------------------- | ----------------------- | ----------------------- | ----------------------- |
| Download / Serve asset | `project_asset:view` | ✅ `project_asset:*` | ✅ `project_asset:view` | ✅ `project_asset:view` | ✅ `project_asset:view` |

## Workspace Templates

### Workspace Workitem Templates

#### `WorkitemTemplateEndpoint`

| Action                     | Permission Checked                   | W-Owner | W-Admin                            | W-Member                              | W-Guest |
| -------------------------- | ------------------------------------ | ------- | ---------------------------------- | ------------------------------------- | ------- |
| List workitem templates    | `workspace_workitem_template:view`   | ✅ `*`  | ✅ `workspace_workitem_template:*` | ✅ `workspace_workitem_template:view` | ❌      |
| Retrieve workitem template | `workspace_workitem_template:view`   | ✅ `*`  | ✅ `workspace_workitem_template:*` | ✅ `workspace_workitem_template:view` | ❌      |
| Create workitem template   | `workspace_workitem_template:create` | ✅ `*`  | ✅ `workspace_workitem_template:*` | ❌                                    | ❌      |
| Update workitem template   | `workspace_workitem_template:edit`   | ✅ `*`  | ✅ `workspace_workitem_template:*` | ❌                                    | ❌      |
| Delete workitem template   | `workspace_workitem_template:delete` | ✅ `*`  | ✅ `workspace_workitem_template:*` | ❌                                    | ❌      |

### Workspace Page Templates

#### `PageTemplateEndpoint`

| Action                 | Permission Checked               | W-Owner | W-Admin                        | W-Member                          | W-Guest |
| ---------------------- | -------------------------------- | ------- | ------------------------------ | --------------------------------- | ------- |
| List page templates    | `workspace_page_template:view`   | ✅ `*`  | ✅ `workspace_page_template:*` | ✅ `workspace_page_template:view` | ❌      |
| Retrieve page template | `workspace_page_template:view`   | ✅ `*`  | ✅ `workspace_page_template:*` | ✅ `workspace_page_template:view` | ❌      |
| Create page template   | `workspace_page_template:create` | ✅ `*`  | ✅ `workspace_page_template:*` | ❌                                | ❌      |
| Update page template   | `workspace_page_template:edit`   | ✅ `*`  | ✅ `workspace_page_template:*` | ❌                                | ❌      |
| Delete page template   | `workspace_page_template:delete` | ✅ `*`  | ✅ `workspace_page_template:*` | ❌                                | ❌      |

> **Access change:** Old code granted W-Guest VIEW on `PageTemplateEndpoint`. Removed — FE never shows template picker to guests (`isContentEditable` requires `role >= MEMBER`). Dead access removed.

### Workspace Project Templates

#### `ProjectTemplateEndpoint`

| Action                    | Permission Checked                  | W-Owner | W-Admin                           | W-Member                             | W-Guest |
| ------------------------- | ----------------------------------- | ------- | --------------------------------- | ------------------------------------ | ------- |
| List project templates    | `workspace_project_template:view`   | ✅ `*`  | ✅ `workspace_project_template:*` | ✅ `workspace_project_template:view` | ❌      |
| Retrieve project template | `workspace_project_template:view`   | ✅ `*`  | ✅ `workspace_project_template:*` | ✅ `workspace_project_template:view` | ❌      |
| Create project template   | `workspace_project_template:create` | ✅ `*`  | ✅ `workspace_project_template:*` | ❌                                   | ❌      |
| Update project template   | `workspace_project_template:edit`   | ✅ `*`  | ✅ `workspace_project_template:*` | ❌                                   | ❌      |
| Delete project template   | `workspace_project_template:delete` | ✅ `*`  | ✅ `workspace_project_template:*` | ❌                                   | ❌      |

#### `CopyProjectTemplateEndpoint`

| Action                | Permission Checked                  | W-Owner | W-Admin                           | W-Member | W-Guest |
| --------------------- | ----------------------------------- | ------- | --------------------------------- | -------- | ------- |
| Copy project template | `workspace_project_template:create` | ✅ `*`  | ✅ `workspace_project_template:*` | ❌       | ❌      |

#### `ProjectTemplateUseEndpoint`

| Action                       | Permission Checked               | W-Owner | W-Admin                           | W-Member                            | W-Guest |
| ---------------------------- | -------------------------------- | ------- | --------------------------------- | ----------------------------------- | ------- |
| Create project from template | `workspace_project_template:use` | ✅ `*`  | ✅ `workspace_project_template:*` | ✅ `workspace_project_template:use` | ❌      |

## Project Templates

### Project Workitem Templates

#### `WorkitemProjectTemplateEndpoint`

| Action                     | Permission Checked                 | P-Admin                          | P-Contributor                       | P-Commenter | P-Guest | W-Owner | W-Admin                          |
| -------------------------- | ---------------------------------- | -------------------------------- | ----------------------------------- | ----------- | ------- | ------- | -------------------------------- |
| List workitem templates    | `project_workitem_template:view`   | ✅ `project_workitem_template:*` | ✅ `project_workitem_template:view` | ❌          | ❌      | ✅ `*`  | ✅ `project_workitem_template:*` |
| Retrieve workitem template | `project_workitem_template:view`   | ✅ `project_workitem_template:*` | ✅ `project_workitem_template:view` | ❌          | ❌      | ✅ `*`  | ✅ `project_workitem_template:*` |
| Create workitem template   | `project_workitem_template:create` | ✅ `project_workitem_template:*` | ❌                                  | ❌          | ❌      | ✅ `*`  | ✅ `project_workitem_template:*` |
| Update workitem template   | `project_workitem_template:edit`   | ✅ `project_workitem_template:*` | ❌                                  | ❌          | ❌      | ✅ `*`  | ✅ `project_workitem_template:*` |
| Delete workitem template   | `project_workitem_template:delete` | ✅ `project_workitem_template:*` | ❌                                  | ❌          | ❌      | ✅ `*`  | ✅ `project_workitem_template:*` |

### Project Page Templates

#### `PageProjectTemplateEndpoint`

| Action               | Permission Checked             | P-Admin                      | P-Contributor                   | P-Commenter | P-Guest | W-Owner | W-Admin                      |
| -------------------- | ------------------------------ | ---------------------------- | ------------------------------- | ----------- | ------- | ------- | ---------------------------- |
| List page templates  | `project_page_template:view`   | ✅ `project_page_template:*` | ✅ `project_page_template:view` | ❌          | ❌      | ✅ `*`  | ✅ `project_page_template:*` |
| Create page template | `project_page_template:create` | ✅ `project_page_template:*` | ❌                              | ❌          | ❌      | ✅ `*`  | ✅ `project_page_template:*` |
| Update page template | `project_page_template:edit`   | ✅ `project_page_template:*` | ❌                              | ❌          | ❌      | ✅ `*`  | ✅ `project_page_template:*` |
| Delete page template | `project_page_template:delete` | ✅ `project_page_template:*` | ❌                              | ❌          | ❌      | ✅ `*`  | ✅ `project_page_template:*` |

### SubWorkitemTemplateEndpoint (Security Fix)

| Action                             | Permission Checked | P-Admin         | P-Contributor        | P-Commenter | P-Guest | W-Owner | W-Admin         |
| ---------------------------------- | ------------------ | --------------- | -------------------- | ----------- | ------- | ------- | --------------- |
| Create workitems from sub-template | `workitem:create`  | ✅ `workitem:*` | ✅ `workitem:create` | ❌          | ❌      | ✅ `*`  | ✅ `workitem:*` |

> Uses `WorkitemPermissions.CREATE` (not a template permission) because this endpoint creates workitems, not templates. Previously had **no project-level permission check** — only `IsAuthenticated` + feature flag.

### IssueTotalWorkLogEndpoint (Security Fix)

| Action             | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest                           | W-Owner | W-Admin         |
| ------------------ | ------------------ | --------------- | ------------------ | ------------------ | --------------------------------- | ------- | --------------- |
| Get total worklogs | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | ✅ +Creator (deferred at project) | ✅ `*`  | ✅ `workitem:*` |

> **Security fix:** Previously had no project-level permission — only `IsAuthenticated` + feature flag. Any authenticated user could query worklog totals for any project. Now requires `workitem:view`.

### IssuePropertyActivityEndpoint

| Action                  | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest                           | W-Owner | W-Admin         |
| ----------------------- | ------------------ | --------------- | ------------------ | ------------------ | --------------------------------- | ------- | --------------- |
| Get property activities | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | ✅ +Creator (deferred at project) | ✅ `*`  | ✅ `workitem:*` |

### ProjectLinkViewSet (New Resource Type: `PROJECT_LINK`)

| Action        | Permission Checked    | P-Admin             | P-Contributor            | P-Commenter            | P-Guest | W-Owner | W-Admin             |
| ------------- | --------------------- | ------------------- | ------------------------ | ---------------------- | ------- | ------- | ------------------- |
| List links    | `project_link:view`   | ✅ `project_link:*` | ✅ `project_link:view`   | ✅ `project_link:view` | ❌      | ✅ `*`  | ✅ `project_link:*` |
| Retrieve link | `project_link:view`   | ✅ `project_link:*` | ✅ `project_link:view`   | ✅ `project_link:view` | ❌      | ✅ `*`  | ✅ `project_link:*` |
| Create link   | `project_link:create` | ✅ `project_link:*` | ✅ `project_link:create` | ❌                     | ❌      | ✅ `*`  | ✅ `project_link:*` |
| Edit link     | `project_link:edit`   | ✅ `project_link:*` | ✅ `project_link:edit`   | ❌                     | ❌      | ✅ `*`  | ✅ `project_link:*` |
| Delete link   | `project_link:delete` | ✅ `project_link:*` | ❌                       | ❌                     | ❌      | ✅ `*`  | ✅ `project_link:*` |

### WorkspaceProjectFeatureEndpoint

| Action                 | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| ---------------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| Get workspace features | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

### IssueConvertEndpoint

| Action                           | Permission Checked       | P-Admin         | P-Contributor      | P-Commenter                           | P-Guest                               |
| -------------------------------- | ------------------------ | --------------- | ------------------ | ------------------------------------- | ------------------------------------- |
| Convert work item (to/from epic) | `workitem:edit`          | ✅ `workitem:*` | ✅ `workitem:edit` | ✅ `workitem:edit+creator` (own only) | ✅ `workitem:edit+creator` (own only) |
| Convert epic to work item        | `epic:edit` (additional) | ✅ `epic:*`     | ✅ `epic:edit`     | ❌ no grant                           | ❌ no grant                           |

> **Security fix:** Previously had zero permission checks — any authenticated user could convert any issue. Now requires project membership + `workitem:edit`. Epic conversion additionally requires `epic:edit`. Inline `permission_engine.check()` used (no `@can` decorator) because epic dual-check requires loading the issue first. Added `project_id` scope filter to prevent cross-project entity access.

### IssueDuplicateEndpoint

| Action                        | Permission Checked               | P-Admin         | P-Contributor        | P-Commenter        | P-Guest                               |
| ----------------------------- | -------------------------------- | --------------- | -------------------- | ------------------ | ------------------------------------- |
| View source issue             | `workitem:view` (via `@can`)     | ✅ `workitem:*` | ✅ `workitem:view`   | ✅ `workitem:view` | ✅ `workitem:view+creator` (own only) |
| Create in destination project | `workitem:create` (inline check) | ✅ `workitem:*` | ✅ `workitem:create` | ❌ no grant        | ❌ no grant                           |

> **Security fix:** Source issue had no visibility check — now requires `workitem:view`. Destination project was bare `ProjectMember.exists()` (any role) — now requires `workitem:create` via `permission_engine.check()` with `scope_param_type=ResourceType.PROJECT`. P-Commenter/P-Guest lose destination create access (correct: duplicating creates a new issue).

### Issue Property Schema (`IssuePropertyEndpoint`, `IssuePropertyOptionEndpoint`, `IssueTypeEndpoint`, `DefaultIssueTypeEndpoint`)

New resource type: `ISSUE_PROPERTY` (mirrors `EPIC_PROPERTY`). Added 2026-02-22.

| Action                            | Permission              | P-Admin               | P-Contributor | P-Commenter | P-Guest |
| --------------------------------- | ----------------------- | --------------------- | ------------- | ----------- | ------- |
| View properties/types             | `issue_property:view`   | ✅ `issue_property:*` | ✅ explicit   | ✅ explicit | ❌      |
| Create property/type              | `issue_property:create` | ✅ `issue_property:*` | ✅ explicit   | ❌          | ❌      |
| Edit property/type/option/default | `issue_property:edit`   | ✅ `issue_property:*` | ✅ explicit   | ❌          | ❌      |
| Delete property/type              | `issue_property:delete` | ✅ `issue_property:*` | ✅ explicit   | ❌          | ❌      |

> Option mutations (create/update/delete) use `issue_property:edit` (not separate CREATE/DELETE) — modifying options is a schema-level change. Mirrors `EpicPropertyOptionEndpoint`.

### Issue Property Values (`IssuePropertyValueEndpoint`, `DraftIssuePropertyValueEndpoint`)

Uses `WorkitemPermissions` — setting values = editing the workitem. Mirrors `EpicPropertyValueEndpoint` using `EpicPermissions`. Added 2026-02-22.

| Action                  | Permission      | P-Admin         | P-Contributor | P-Commenter | P-Guest     |
| ----------------------- | --------------- | --------------- | ------------- | ----------- | ----------- |
| View values             | `workitem:view` | ✅ `workitem:*` | ✅ explicit   | ✅ explicit | ✅ +Creator |
| Set values (POST/PATCH) | `workitem:edit` | ✅ `workitem:*` | ✅ explicit   | ✅ +Creator | ✅ +Creator |

> `IssuePropertyValueEndpoint.patch()` retains inline archived issue check (returns 403 if `issue.archived_at is not None`).

### Workspace Issue Types (`WorkspaceIssueTypeEndpoint`)

Added 2026-02-22.

| Action     | Permission       | W-Owner | W-Admin     | W-Member    | W-Guest     |
| ---------- | ---------------- | ------- | ----------- | ----------- | ----------- |
| List types | `workspace:view` | ✅ `*`  | ✅ explicit | ✅ explicit | ✅ explicit |

## EE Exporter Endpoints

### Project-Level Exports

| Action               | Permission Checked     | P-Admin              | P-Contributor             | P-Commenter | P-Guest |
| -------------------- | ---------------------- | -------------------- | ------------------------- | ----------- | ------- |
| Export work items    | `workitem:export`      | ✅ `workitem:*`      | ✅ `workitem:export`      | ❌          | ❌      |
| Export cycle issues  | `cycle:export`         | ✅ `cycle:*`         | ✅ `cycle:export`         | ❌          | ❌      |
| Export module issues | `module:export`        | ✅ `module:*`        | ✅ `module:export`        | ❌          | ❌      |
| Export view issues   | `workitem_view:export` | ✅ `workitem_view:*` | ✅ `workitem_view:export` | ❌          | ❌      |
| Export epics         | `epic:export`          | ✅ `epic:*`          | ✅ `epic:export`          | ❌          | ❌      |
| Export intake issues | `intake:export`        | ✅ `intake:*`        | ✅ `intake:export`        | ❌          | ❌      |

> All 6 project-level export endpoints also require `@check_feature_flag(FeatureFlag.ADVANCED_EXPORTS)` above `@can`.

### Workspace-Level Exports

| Action                       | Permission Checked               | W-Owner | W-Admin                        | W-Member                            | W-Guest |
| ---------------------------- | -------------------------------- | ------- | ------------------------------ | ----------------------------------- | ------- |
| Export workspace view issues | `workspace_workitem_view:export` | ✅ `*`  | ✅ `workspace_workitem_view:*` | ✅ `workspace_workitem_view:export` | ❌      |

## Import Endpoints

### Workspace Member Import — `WorkspaceMembersImportEndpoint`

| Action         | Permission Checked        | W-Owner | W-Admin                      | W-Member | W-Guest |
| -------------- | ------------------------- | ------- | ---------------------------- | -------- | ------- |
| Import members | `workspace_member:import` | ✅ `*`  | ✅ `workspace_member:import` | ❌       | ❌      |

### Project Member Import — `ProjectMembersImportEndpoint`

Also gated by `@check_feature_flag(FeatureFlag.PROJECT_MEMBERS_IMPORT)`.

| Action         | Permission Checked       | P-Admin               | P-Contributor | P-Commenter | P-Guest |
| -------------- | ------------------------ | --------------------- | ------------- | ----------- | ------- |
| Import members | `project_member:invite`  | ✅ `project_member:*` | ❌            | ❌          | ❌      |

> W-Owner/W-Admin always have access via workspace-level `project_member:*` wildcard (omitted from project table).

### Project Work Item Import — `ProjectWorkItemImportEndpoint`

| Action            | Permission Checked | P-Admin         | P-Contributor | P-Commenter | P-Guest |
| ----------------- | ------------------ | --------------- | ------------- | ----------- | ------- |
| Import work items | `workitem:import`  | ✅ `workitem:*` | ❌            | ❌          | ❌      |

> W-Owner/W-Admin always have access via workspace-level wildcards (`*` / `workitem:*`).
> **Intentional access expansion:** P-Admin gains import access via `workitem:*` wildcard — project admins can import into their projects. Follows export precedent.

### Import Jobs — `ImportJobView`

Also gated by `@check_feature_flag(FeatureFlag.SILO)`.

| Action                           | Permission Checked   | W-Owner | W-Admin            | W-Member | W-Guest |
| -------------------------------- | -------------------- | ------- | ------------------ | -------- | ------- |
| List/retrieve/create/edit/delete | `integration:manage` | ✅ `*`  | ✅ `integration:*` | ❌       | ❌      |

> **Intentional tightening:** Old `ProjectBasePermission` allowed any project member. Now W-Owner + W-Admin only — imports are privileged admin operations.

### Import Reports — `ImportReportView`

Also gated by `@check_feature_flag(FeatureFlag.SILO)`.

| Action             | Permission Checked   | W-Owner | W-Admin            | W-Member | W-Guest |
| ------------------ | -------------------- | ------- | ------------------ | -------- | ------- |
| List/retrieve/edit | `integration:manage` | ✅ `*`  | ✅ `integration:*` | ❌       | ❌      |

> **Intentional tightening:** Old `ProjectBasePermission` allowed any project member. Now W-Owner + W-Admin only — imports are privileged admin operations.

### Workspace Issue Retrieve — `WorkspaceIssueRetrieveEndpoint`

| Action         | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| -------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| Retrieve issue | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

### Project Attributes — `ProjectAttributesEndpoint`

Also gated by `@check_feature_flag(FeatureFlag.PROJECT_GROUPING)`.

| Action          | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| --------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| List attributes | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

## P3 Enterprise Views (Batch Migration)

### Bulk Issue Operations — `BulkIssueOperationsEndpoint`

| Action             | Permission Checked   | P-Admin         | P-Contributor           | P-Commenter | P-Guest |
| ------------------ | -------------------- | --------------- | ----------------------- | ----------- | ------- |
| Bulk update issues | `workitem:bulk_edit` | ✅ `workitem:*` | ✅ `workitem:bulk_edit` | ❌          | ❌      |

### Bulk Subscribe Issues — `BulkSubscribeIssuesEndpoint`

| Action         | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest             |
| -------------- | ------------------ | --------------- | ------------------ | ------------------ | ------------------- |
| Bulk subscribe | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator (deferred) |

### Issue Pages — `IssuePageViewSet`

| Action      | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest             |
| ----------- | ------------------ | --------------- | ------------------ | ------------------ | ------------------- |
| List pages  | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator (deferred) |
| Link page   | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌                 | ❌                  |
| Unlink page | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌                 | ❌                  |

### Page Search — `PageSearchViewSet`

| Action       | Permission Checked | P-Admin     | P-Contributor  | P-Commenter    | P-Guest        |
| ------------ | ------------------ | ----------- | -------------- | -------------- | -------------- |
| Search pages | `page:view`        | ✅ `page:*` | ✅ `page:view` | ✅ `page:view` | ✅ `page:view` |

### Issue Work Logs — `IssueWorkLogsEndpoint`

| Action         | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest             |
| -------------- | ------------------ | --------------- | ------------------ | ------------------ | ------------------- |
| List worklogs  | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator (deferred) |
| Create worklog | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌                 | ❌                  |
| Update worklog | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌                 | ❌                  |
| Delete worklog | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | ❌                 | ❌                  |

### Project Updates — `ProjectUpdatesViewSet`

| Action         | Permission Checked              | P-Admin                       | P-Contributor                      | P-Commenter                      | P-Guest                          |
| -------------- | ------------------------------- | ----------------------------- | ---------------------------------- | -------------------------------- | -------------------------------- |
| List updates   | `project_update:view`           | ✅ `project_update:*`         | ✅ `project_update:view`           | ✅ `project_update:view`         | ✅ `project_update:view`         |
| Create update  | `project_update:create`         | ✅ `project_update:*`         | ✅ `project_update:create`         | ❌                               | ❌                               |
| View update    | `project_update:view`           | ✅ `project_update:*`         | ✅ `project_update:view`           | ✅ `project_update:view`         | ✅ `project_update:view`         |
| Edit update    | `project_update:edit`           | ✅ `project_update:*`         | +Creator                           | ❌                               | ❌                               |
| Delete update  | `project_update:delete`         | ✅ `project_update:*`         | +Creator                           | ❌                               | ❌                               |
| List comments  | `project_update_comment:view`   | ✅ `project_update_comment:*` | ✅ `project_update_comment:view`   | ✅ `project_update_comment:view` | ✅ `project_update_comment:view` |
| Create comment | `project_update_comment:create` | ✅ `project_update_comment:*` | ✅ `project_update_comment:create` | ❌                               | ❌                               |

### Project Update Reactions — `ProjectUpdatesReactionViewSet`

| Action          | Permission Checked     | P-Admin               | P-Contributor             | P-Commenter               | P-Guest |
| --------------- | ---------------------- | --------------------- | ------------------------- | ------------------------- | ------- |
| Add reaction    | `project_update:react` | ✅ `project_update:*` | ✅ `project_update:react` | ✅ `project_update:react` | ❌      |
| Remove reaction | `project_update:react` | ✅ `project_update:*` | ✅ `project_update:react` | ✅ `project_update:react` | ❌      |

> Feature flag `PROJECT_OVERVIEW` gates access above `@can`.

### Project Update Comment Reactions — `ProjectUpdateCommentsReactionViewSet`

| Action          | Permission Checked             | P-Admin                       | P-Contributor                     | P-Commenter                       | P-Guest |
| --------------- | ------------------------------ | ----------------------------- | --------------------------------- | --------------------------------- | ------- |
| Add reaction    | `project_update_comment:react` | ✅ `project_update_comment:*` | ✅ `project_update_comment:react` | ✅ `project_update_comment:react` | ❌      |
| Remove reaction | `project_update_comment:react` | ✅ `project_update_comment:*` | ✅ `project_update_comment:react` | ✅ `project_update_comment:react` | ❌      |

> Feature flag `PROJECT_OVERVIEW` gates access above `@can`. Uses `scope_param_type=ResourceType.PROJECT_UPDATE` since resource_param is the parent update ID.

### Project Attachments — `ProjectAttachmentV2Endpoint`

| Action          | Permission Checked     | P-Admin              | P-Contributor             | P-Commenter             | P-Guest                 |
| --------------- | ---------------------- | -------------------- | ------------------------- | ----------------------- | ----------------------- |
| Upload (create) | `project_asset:create` | ✅ `project_asset:*` | ✅ `project_asset:create` | ✅ +Creator             | ✅ +Creator             |
| List            | `project_asset:view`   | ✅ `project_asset:*` | ✅ `project_asset:view`   | ✅ `project_asset:view` | ✅ `project_asset:view` |
| Download        | `project_asset:view`   | ✅ `project_asset:*` | ✅ `project_asset:view`   | ✅ `project_asset:view` | ✅ `project_asset:view` |
| Confirm upload  | `project_asset:edit`   | ✅ `project_asset:*` | ✅ `project_asset:edit`   | +Creator                | +Creator                |
| Delete          | `project_asset:delete` | ✅ `project_asset:*` | +Creator                  | +Creator                | +Creator                |

### Workspace Issue Detail — `WorkspaceIssueDetailEndpoint`

| Action      | Permission Checked | W-Owner | W-Admin          | W-Member            | W-Guest             |
| ----------- | ------------------ | ------- | ---------------- | ------------------- | ------------------- |
| List issues | `workspace:view`   | ✅ `*`  | ✅ `workspace:*` | ✅ `workspace:view` | ✅ `workspace:view` |

> Per-project filtering applied inline: issues scoped to projects where user has `workitem:view` permission.

### Workspace Issue Bulk Update Dates — `WorkspaceIssueBulkUpdateDateEndpoint`

| Action            | Permission Checked                                    | W-Owner | W-Admin          | W-Member            | W-Guest              |
| ----------------- | ----------------------------------------------------- | ------- | ---------------- | ------------------- | -------------------- |
| Bulk update dates | `workspace:view` + inline `workitem:edit` per project | ✅ `*`  | ✅ `workspace:*` | ✅ `workspace:view` | ✅¹ `workspace:view` |

> ¹ W-Guest passes decorator but inline `permission_engine.check(WorkitemPermissions.EDIT)` per project blocks guests from actual mutations.

### Workspace Worklogs — `WorkspaceWorkLogsEndpoint`

| Action        | Permission Checked       | W-Owner | W-Admin                  | W-Member                    | W-Guest |
| ------------- | ------------------------ | ------- | ------------------------ | --------------------------- | ------- |
| List worklogs | `workspace_worklog:view` | ✅ `*`  | ✅ `workspace_worklog:*` | ✅ `workspace_worklog:view` | ❌      |

### Workspace Export Worklogs — `WorkspaceExportWorkLogsEndpoint`

| Action         | Permission Checked         | W-Owner | W-Admin                  | W-Member                      | W-Guest |
| -------------- | -------------------------- | ------- | ------------------------ | ----------------------------- | ------- |
| List exports   | `workspace_worklog:view`   | ✅ `*`  | ✅ `workspace_worklog:*` | ✅ `workspace_worklog:view`   | ❌      |
| Trigger export | `workspace_worklog:export` | ✅ `*`  | ✅ `workspace_worklog:*` | ✅ `workspace_worklog:export` | ❌      |

### Workspace Project States — `WorkspaceProjectStatesEndpoint`

| Action       | Permission Checked               | W-Owner | W-Admin                        | W-Member                            | W-Guest                           |
| ------------ | -------------------------------- | ------- | ------------------------------ | ----------------------------------- | --------------------------------- |
| List states  | `workspace_project_state:view`   | ✅ `*`  | ✅ `workspace_project_state:*` | ✅ `workspace_project_state:view`   | ✅ `workspace_project_state:view` |
| Create state | `workspace_project_state:create` | ✅ `*`  | ✅ `workspace_project_state:*` | ✅ `workspace_project_state:create` | ❌                                |
| Edit state   | `workspace_project_state:edit`   | ✅ `*`  | ✅ `workspace_project_state:*` | ✅ `workspace_project_state:edit`   | ❌                                |
| Delete state | `workspace_project_state:delete` | ✅ `*`  | ✅ `workspace_project_state:*` | ✅ `workspace_project_state:delete` | ❌                                |

### Set Default State — `WorkspaceProjectStatesDefaultEndpoint`

| Action            | Permission Checked             | W-Owner | W-Admin                        | W-Member                          | W-Guest |
| ----------------- | ------------------------------ | ------- | ------------------------------ | --------------------------------- | ------- |
| Set default state | `workspace_project_state:edit` | ✅ `*`  | ✅ `workspace_project_state:*` | ✅ `workspace_project_state:edit` | ❌      |

### Workspace Credentials — `WorkspaceCredentialView`

| Action            | Permission Checked   | W-Owner | W-Admin            | W-Member                | W-Guest |
| ----------------- | -------------------- | ------- | ------------------ | ----------------------- | ------- |
| Delete credential | `integration:delete` | ✅ `*`  | ✅ `integration:*` | ✅ `integration:delete` | ❌      |

### Verify Credentials — `VerifyWorkspaceCredentialView`

| Action            | Permission Checked    | W-Owner | W-Admin            | W-Member                 | W-Guest |
| ----------------- | --------------------- | ------- | ------------------ | ------------------------ | ------- |
| Check auth status | `integration:view`    | ✅ `*`  | ✅ `integration:*` | ✅ `integration:view`    | ❌      |
| Update credential | `integration:connect` | ✅ `*`  | ✅ `integration:*` | ✅ `integration:connect` | ❌      |

### Workspace Connections — `WorkspaceConnectionView`

| Action            | Permission Checked   | W-Owner | W-Admin            | W-Member                | W-Guest |
| ----------------- | -------------------- | ------- | ------------------ | ----------------------- | ------- |
| List connections  | `integration:view`   | ✅ `*`  | ✅ `integration:*` | ✅ `integration:view`   | ❌      |
| Get connection    | `integration:view`   | ✅ `*`  | ✅ `integration:*` | ✅ `integration:view`   | ❌      |
| Delete connection | `integration:delete` | ✅ `*`  | ✅ `integration:*` | ✅ `integration:delete` | ❌      |

### User Connections — `WorkspaceUserConnectionView`

| Action               | Permission Checked | W-Owner | W-Admin            | W-Member              | W-Guest |
| -------------------- | ------------------ | ------- | ------------------ | --------------------- | ------- |
| Get user connections | `integration:view` | ✅ `*`  | ✅ `integration:*` | ✅ `integration:view` | ❌      |

### Entity Connections — `WorkspaceEntityConnectionView`

| Action               | Permission Checked | W-Owner | W-Admin            | W-Member              | W-Guest |
| -------------------- | ------------------ | ------- | ------------------ | --------------------- | ------- |
| List entity mappings | `integration:view` | ✅ `*`  | ✅ `integration:*` | ✅ `integration:view` | ❌      |
| Get entity mapping   | `integration:view` | ✅ `*`  | ✅ `integration:*` | ✅ `integration:view` | ❌      |

### Workspace Features — `WorkspaceFeaturesEndpoint`

| Action          | Permission Checked       | W-Owner | W-Admin                  | W-Member                    | W-Guest                     |
| --------------- | ------------------------ | ------- | ------------------------ | --------------------------- | --------------------------- |
| Get features    | `workspace_feature:view` | ✅ `*`  | ✅ `workspace_feature:*` | ✅ `workspace_feature:view` | ✅ `workspace_feature:view` |
| Toggle features | `workspace_feature:edit` | ✅ `*`  | ✅ `workspace_feature:*` | ✅ `workspace_feature:edit` | ❌                          |

### Invite Capacity Check — `WorkspaceInviteCheckEndpoint`

| Action                | Permission Checked        | W-Owner | W-Admin                 | W-Member | W-Guest |
| --------------------- | ------------------------- | ------- | ----------------------- | -------- | ------- |
| Check invite capacity | `workspace_member:invite` | ✅ `*`  | ✅ `workspace_member:*` | ❌       | ❌      |

### Internal Webhooks — `InternalWebhookEndpoint`

| Action         | Permission Checked | W-Owner | W-Admin        | W-Member | W-Guest |
| -------------- | ------------------ | ------- | -------------- | -------- | ------- |
| Create webhook | `webhook:create`   | ✅ `*`  | ✅ `webhook:*` | ❌ ¹     | ❌      |
| Delete webhook | `webhook:delete`   | ✅ `*`  | ✅ `webhook:*` | ❌ ¹     | ❌      |

> ¹ **Access tightened:** Old `WorkSpaceAdminPermission` allowed W-Member; new system restricts to W-Admin+ (W-Member has no `webhook:*` grant). FE already gates integration management to admin-only.

### Service API Token — `ServiceApiTokenEndpoint`

| Action               | Permission Checked | W-Owner | W-Admin          | W-Member              | W-Guest |
| -------------------- | ------------------ | ------- | ---------------- | --------------------- | ------- |
| Create service token | `api_token:create` | ✅ `*`  | ✅ `api_token:*` | ✅ `api_token:create` | ❌      |

### Workspace API Tokens — `WorkspaceAPITokenEndpoint`

All actions are user-scoped — queryset filters by `user=request.user` (users see/delete only their own tokens).

| Action       | Permission Checked | W-Owner | W-Admin          | W-Member              | W-Guest |
| ------------ | ------------------ | ------- | ---------------- | --------------------- | ------- |
| Create token | `api_token:create` | ✅ `*`  | ✅ `api_token:*` | ✅ `api_token:create` | ❌      |
| List tokens  | `api_token:view`   | ✅ `*`  | ✅ `api_token:*` | ✅ `api_token:view`   | ❌      |
| View token   | `api_token:view`   | ✅ `*`  | ✅ `api_token:*` | ✅ `api_token:view`   | ❌      |
| Delete token | `api_token:delete` | ✅ `*`  | ✅ `api_token:*` | ✅ `api_token:delete` | ❌      |

## Notes

No outstanding permission gaps. All tables reflect the current state of `system_roles.py`.

### Key Access Restrictions

- **P-Guest**: No access to issue properties, project links, assets (create/edit/delete), templates, recurring work items, exports, imports, bulk operations, worklogs (edit), or project updates (create/edit/delete). `workitem:view+creator` limits visibility to own issues.
- **P-Commenter**: View-only for issue properties, project links, project analytics, assets, templates, project updates. No export, import, or bulk edit access.
- **W-Guest**: No access to worklogs, credentials, connections, integrations, or workspace member invite.
- **+creator conditional**: Asset edit/delete (P-Contributor/Commenter/Guest), project update edit/delete (P-Contributor), project update comment edit/delete (P-Contributor).

### Security Fixes Applied During Migration

- `IssueConvertEndpoint`: Was open to any authenticated user, now requires `workitem:edit` + `epic:edit`
- `IssueDuplicateEndpoint`: Source had no permission check, now requires `workitem:view` (source) + `workitem:create` (destination)
- `IssueTotalWorkLogEndpoint`: Was open to any authenticated user, now requires `workitem:view`
- `SubWorkitemTemplateEndpoint`: Added `workitem:create` check
- `WorkspacePageCommentReactionViewSet`: Had no `permission_classes`, now uses `HasResourcePermission`
- `ProjectAttachmentV2Endpoint` DELETE / `ProjectUpdatesViewSet` edit+delete: Old `creator=True` bypassed membership; new `@can` always verifies membership first

---

## Baseline-Only Batch Migration (2026-02-22)

### Workspace Permission & Role Management

| Action                               | Permission Checked | W-Owner | W-Admin            | W-Member            | W-Guest             |
| ------------------------------------ | ------------------ | ------- | ------------------ | ------------------- | ------------------- |
| View permissions / resources / roles | `workspace:view`   | ✅ `*`  | ✅ `workspace:*`   | ✅ `workspace:view` | ✅ `workspace:view` |
| Create/update/delete custom roles    | `custom_role:*`    | ✅ `*`  | ✅ `custom_role:*` | ❌                  | ❌                  |

**Endpoints:** `ResourcePermissionEndpoint`, `UserPermissionEndpoint` (GET), `RoleEndpoint` (GET/POST/PATCH/DELETE)

### Workspace Search

| Action                                           | Permission Checked | W-Owner | W-Admin          | W-Member            | W-Guest             |
| ------------------------------------------------ | ------------------ | ------- | ---------------- | ------------------- | ------------------- |
| Global search / mention search / enhanced search | `workspace:view`   | ✅ `*`  | ✅ `workspace:*` | ✅ `workspace:view` | ✅ `workspace:view` |

**Endpoints:** `GlobalSearchEndpoint`, `SearchEndpoint`, `EnhancedGlobalSearchEndpoint` (also requires `ADVANCED_SEARCH` feature flag)

> **Data-level filters:** All search endpoints have inline data-level filtering (project membership, `.accessible_to()`, OpenSearch user_id filters) to restrict results per user.

### Workspace Dashboard & User Profile

| Action                                            | Permission Checked | W-Owner | W-Admin          | W-Member            | W-Guest             |
| ------------------------------------------------- | ------------------ | ------- | ---------------- | ------------------- | ------------------- |
| View dashboard / activity graph / completed graph | `workspace:view`   | ✅ `*`  | ✅ `workspace:*` | ✅ `workspace:view` | ✅ `workspace:view` |
| View user profile                                 | `workspace:view`   | ✅ `*`  | ✅ `workspace:*` | ✅ `workspace:view` | ✅ `workspace:view` |
| View user profile stats                           | `workspace:view`   | ✅ `*`  | ✅ `workspace:*` | ✅ `workspace:view` | ✅ `workspace:view` |

**Endpoints:** `UserWorkspaceDashboardEndpoint`, `UserActivityGraphEndpoint`, `UserIssueCompletedGraphEndpoint`, `WorkspaceUserProfileEndpoint`, `WorkspaceUserProfileStatsEndpoint`

> **Data-level filters:** `WorkspaceUserProfileEndpoint` has inline `role >= 15` check — only Admin/Member see project-level stats. `WorkspaceUserProfileStatsEndpoint` uses inline `.accessible_to()` filter.

### Workspace File Assets

| Action                      | Permission Checked       | W-Owner | W-Admin                | W-Member                    | W-Guest                   |
| --------------------------- | ------------------------ | ------- | ---------------------- | --------------------------- | ------------------------- |
| Upload workspace file asset | `workspace_asset:create` | ✅ `*`  | ✅ `workspace_asset:*` | ✅ `workspace_asset:create` | ❌                        |
| View workspace file asset   | `workspace_asset:view`   | ✅ `*`  | ✅ `workspace_asset:*` | ✅ `workspace_asset:view`   | ✅ `workspace_asset:view` |
| Update workspace file asset | `workspace_asset:edit`   | ✅ `*`  | ✅ `workspace_asset:*` | ❌                          | ❌                        |
| Delete workspace file asset | `workspace_asset:delete` | ✅ `*`  | ✅ `workspace_asset:*` | ❌                          | ❌                        |

**Endpoints:** `WorkspaceFileAssetEndpoint` (v2), `FileAssetEndpoint` (v1 legacy — `post` uses `@can`, `get`/`delete` use inline `permission_engine.check()` since URL has no slug)

### Project Member Self-Check

| Action                       | Permission Checked | P-Admin        | P-Contributor     | P-Commenter       | P-Guest           |
| ---------------------------- | ------------------ | -------------- | ----------------- | ----------------- | ----------------- |
| Check own project membership | `project:view`     | ✅ `project:*` | ✅ `project:view` | ✅ `project:view` | ✅ `project:view` |

**Endpoint:** `ProjectMemberUserEndpoint`

### Epic Detail (by Identifier)

| Action                  | Permission Checked | W-Owner | W-Admin          | W-Member            | W-Guest             |
| ----------------------- | ------------------ | ------- | ---------------- | ------------------- | ------------------- |
| View epic by identifier | `workspace:view`   | ✅ `*`  | ✅ `workspace:*` | ✅ `workspace:view` | ✅ `workspace:view` |

**Endpoint:** `EpicDetailIdentifierEndpoint` — workspace-level gate only (no `project_id` UUID in URL). Inline `ProjectMember.objects.filter()` check enforces project-level access.

---

## Maintenance

When a new view is migrated to the `@can` permission system:

1. Update `PERMISSION_MIGRATION.md` — add old→new migration entry
2. Update `designs/permissions/plan-view-migration.md` — update view inventory status
3. **Update this document** — add rows to the appropriate resource table

### Adding a New Row

1. Identify the `@can(Permission, ...)` on the endpoint
2. Convert the Permission to its string form (e.g., `IssuePermissions.VIEW` → `workitem:view`)
3. Check each role in `system_roles.py` for that permission string (exact match or wildcard)
4. Note if conditional `+creator` grant in `system_roles.py` or inline creator check is used
5. Add the row to the appropriate table in this document
