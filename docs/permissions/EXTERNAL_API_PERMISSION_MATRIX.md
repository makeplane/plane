# External API (v1) Permission Matrix — Current State Reference

This document shows **who can do what** for every v1 API endpoint (`/api/v1/`) that has been migrated to the `@can` permission system. It is the current-state reference for auditing and reviewing access control on the external API surface.

**Related documents:**

- `EXTERNAL_API_PERMISSION_MIGRATION.md` — tracks old→new migration changes per v1 endpoint
- `PERMISSION_MATRIX.md` — internal app API permission matrix (same permission engine)
- `apps/api/plane/permissions/system_roles.py` — source of truth for role→permission mappings

## How to Read the Matrix

- **Permission Checked** — the exact `@can(...)` permission string the endpoint checks
- Each role column shows ✅ with the **granting permission string** from `system_roles.py` (e.g., `workitem:*` wildcard vs explicit `workitem:view`)
- ❌ means the role does not have this permission
- **+Creator** — conditional grant (`Permission & Condition.CREATOR`) in `system_roles.py`; the role doesn't have the unconditional permission, but creators with active membership can perform the action. The engine evaluates this automatically via `_role_get_conditions` / `_evaluate_condition`.
- **+Creator (deferred)** — conditional grant with `defer_conditions=True` on list endpoints; the decorator passes the gate, and the view filters the queryset to only return resources created by the user. Used for project-level `workitem:view` and `intake:view` checks where the condition can't be evaluated against the project.
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

### Workspace Features — `WorkspaceFeatureAPIEndpoint`

| Action          | Permission Checked       | W-Owner | W-Admin                  | W-Member                    | W-Guest                     |
| --------------- | ------------------------ | ------- | ------------------------ | --------------------------- | --------------------------- |
| Get features    | `workspace_feature:view` | ✅ `*`  | ✅ `workspace_feature:*` | ✅ `workspace_feature:view` | ✅ `workspace_feature:view` |
| Update features | `workspace_feature:edit` | ✅ `*`  | ✅ `workspace_feature:*` | ✅ `workspace_feature:edit` | ❌                          |

### Workspace Members — `WorkspaceMemberAPIEndpoint`

| Action       | Permission Checked      | W-Owner | W-Admin                    | W-Member                   | W-Guest                    |
| ------------ | ----------------------- | ------- | -------------------------- | -------------------------- | -------------------------- |
| List members | `workspace_member:view` | ✅ `*`  | ✅ `workspace_member:view` | ✅ `workspace_member:view` | ✅ `workspace_member:view` |

### Workspace Invitations — `WorkspaceInvitationsViewset`

| Action            | Permission Checked        | W-Owner | W-Admin                      | W-Member | W-Guest |
| ----------------- | ------------------------- | ------- | ---------------------------- | -------- | ------- |
| Create invitation | `workspace_member:invite` | ✅ `*`  | ✅ `workspace_member:invite` | ❌       | ❌      |

### Workspace Stickies — `StickyViewSet`

All actions check `workspace:view`. Stickies are user-scoped — queryset filters to `owner=request.user`.

| Action          | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest             |
| --------------- | ------------------ | ------- | ------------------- | ------------------- | ------------------- |
| List stickies   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Create sticky   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Retrieve sticky | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Update sticky   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |
| Delete sticky   | `workspace:view`   | ✅ `*`  | ✅ `workspace:view` | ✅ `workspace:view` | ✅ `workspace:view` |

### Workspace Pages / Wiki — `WorkspacePageAPIEndpoint` / `WorkspacePageDetailAPIEndpoint`

| Action        | Permission Checked | W-Owner | W-Admin     | W-Member         | W-Guest |
| ------------- | ------------------ | ------- | ----------- | ---------------- | ------- |
| List pages    | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view`   | ❌      |
| Create page   | `wiki:create`      | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:create` | ❌      |
| Retrieve page | `wiki:view`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:view`   | ❌      |
| Update page   | `wiki:edit`        | ✅ `*`  | ✅ `wiki:*` | ✅ `wiki:edit`   | ❌      |

### Workspace Issues Search — `WorkItemAdvancedSearchEndpoint`

| Action                  | Permission Checked | W-Owner | W-Admin         | W-Member | W-Guest |
| ----------------------- | ------------------ | ------- | --------------- | -------- | ------- |
| Search workspace issues | `workitem:view`    | ✅ `*`  | ✅ `workitem:*` | ❌ ¹     | ❌      |

> ¹ Workspace member does not have `workitem:view` at the workspace scope. Project-level `workitem:view` is only available via project membership. The endpoint uses `accessible_to()` inline filter for data-level scoping.

### Project Labels (workspace-scoped) — `ProjectLabelListCreateAPIEndpoint`

| Action       | Permission Checked | W-Owner | W-Admin               | W-Member            | W-Guest             |
| ------------ | ------------------ | ------- | --------------------- | ------------------- | ------------------- |
| List labels  | `workspace:view`   | ✅ `*`  | ✅ `workspace:view`   | ✅ `workspace:view` | ✅ `workspace:view` |
| Create label | `workspace:manage` | ✅ `*`  | ✅ `workspace:manage` | ❌                  | ❌                  |

### Initiatives — `InitiativeViewSet` / `InitiativeEpicsViewSet` / `InitiativeProjectsViewSet` / `InitiativeLabelViewSet`

Feature-flagged: requires `InitiativesFeatureFlagPermission`.

| Action              | Permission Checked  | W-Owner | W-Admin           | W-Member             | W-Guest |
| ------------------- | ------------------- | ------- | ----------------- | -------------------- | ------- |
| List initiatives    | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| Create initiative   | `initiative:create` | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| Retrieve initiative | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| Update initiative   | `initiative:edit`   | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| Delete initiative   | `initiative:delete` | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| List epics          | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| Add epic            | `initiative:edit`   | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| Remove epic         | `initiative:edit`   | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| List projects       | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| Add project         | `initiative:edit`   | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| Remove project      | `initiative:edit`   | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| List labels         | `initiative:view`   | ✅ `*`  | ✅ `initiative:*` | ✅ `initiative:view` | ❌      |
| Add label           | `initiative:edit`   | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |
| Remove label        | `initiative:edit`   | ✅ `*`  | ✅ `initiative:*` | ❌                   | ❌      |

### Teamspaces — `TeamspaceViewSet` / `TeamspaceProjectViewSet` / `TeamspaceMemberViewSet`

Feature-flagged: requires `TeamspaceFeatureFlagPermission`.

| Action             | Permission Checked | W-Owner | W-Admin               | W-Member | W-Guest |
| ------------------ | ------------------ | ------- | --------------------- | -------- | ------- |
| List teamspaces    | `teamspace:view`   | ✅ `*`  | ✅ ¹                  | ❌ ²     | ❌      |
| Create teamspace   | `teamspace:create` | ✅ `*`  | ✅ `teamspace:create` | ❌       | ❌      |
| Retrieve teamspace | `teamspace:view`   | ✅ `*`  | ✅ ¹                  | ❌ ²     | ❌      |
| Update teamspace   | `teamspace:edit`   | ✅ `*`  | ✅ ¹                  | ❌       | ❌      |
| Delete teamspace   | `teamspace:delete` | ✅ `*`  | ✅ ¹                  | ❌       | ❌      |
| List projects      | `teamspace:view`   | ✅ `*`  | ✅ ¹                  | ❌ ²     | ❌      |
| Add project        | `teamspace:edit`   | ✅ `*`  | ✅ ¹                  | ❌       | ❌      |
| Remove project     | `teamspace:edit`   | ✅ `*`  | ✅ ¹                  | ❌       | ❌      |
| List members       | `teamspace:view`   | ✅ `*`  | ✅ ¹                  | ❌ ²     | ❌      |
| Add member         | `teamspace:edit`   | ✅ `*`  | ✅ ¹                  | ❌       | ❌      |
| Remove member      | `teamspace:edit`   | ✅ `*`  | ✅ ¹                  | ❌       | ❌      |

> ¹ Workspace admin has `teamspace:browse` and `teamspace:create` at workspace scope. The `teamspace:view/edit/delete` permissions are resolved via the teamspace membership roles (TEAMSPACE_ROLES). However, workspace admin also has full project-level bypass (`project:*`, etc.) which grants workspace admin content access. For the v1 API endpoints, workspace admin passes because the engine's workspace admin bypass grants full access.
> ² Workspace member has `teamspace:browse` at workspace scope, which does NOT match `teamspace:view`. Content access requires explicit teamspace membership.

### Customers — `CustomerAPIEndpoint` / `CustomerDetailAPIEndpoint` / `CustomerRequestAPIEndpoint` / `CustomerRequestDetailAPIEndpoint` / `CustomerIssuesAPIEndpoint` / `CustomerIssueDetailAPIEndpoint` / `CustomerPropertiesAPIEndpoint` / `CustomerPropertyDetailAPIEndpoint` / `CustomerPropertyValuesAPIEndpoint` / `CustomerPropertyValueDetailAPIEndpoint`

| Action                  | Permission Checked | W-Owner | W-Admin         | W-Member | W-Guest |
| ----------------------- | ------------------ | ------- | --------------- | -------- | ------- |
| List customers          | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Create customer         | `customer:create`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Retrieve customer       | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Update customer         | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Delete customer         | `customer:delete`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| List requests           | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Create request          | `customer:create`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Retrieve request        | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Update request          | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Delete request          | `customer:delete`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| List customer issues    | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Add customer issue      | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Remove customer issue   | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| List properties         | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Create property         | `customer:create`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Retrieve property       | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Update property         | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Delete property         | `customer:delete`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| List property values    | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Create property value   | `customer:create`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Retrieve property value | `customer:view`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Update property value   | `customer:edit`    | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |
| Delete property value   | `customer:delete`  | ✅ `*`  | ✅ `customer:*` | ❌       | ❌      |

---

## Project-Level Endpoints

### Projects — `ProjectListCreateAPIEndpoint` / `ProjectDetailAPIEndpoint` / `ProjectArchiveUnarchiveAPIEndpoint` / `ProjectFeatureAPIEndpoint`

List/Create are workspace-scoped; Detail actions are project-scoped.

**Workspace-scoped (list/create):**

| Action         | Permission Checked | W-Owner | W-Admin             | W-Member            | W-Guest |
| -------------- | ------------------ | ------- | ------------------- | ------------------- | ------- |
| List projects  | `project:browse`   | ✅ `*`  | ✅ `project:browse` | ✅ `project:browse` | ❌      |
| Create project | `project:create`   | ✅ `*`  | ✅ `project:create` | ❌                  | ❌      |

**Project-scoped (detail):**

| Action            | Permission Checked | P-Admin              | P-Contributor     | P-Commenter       | P-Guest           |
| ----------------- | ------------------ | -------------------- | ----------------- | ----------------- | ----------------- |
| Retrieve project  | `project:view`     | ✅ `project:view`    | ✅ `project:view` | ✅ `project:view` | ✅ `project:view` |
| Update project    | `project:edit`     | ✅ `project:edit`    | ❌                | ❌                | ❌                |
| Delete project    | `project:delete`   | ✅ `project:delete`  | ❌                | ❌                | ❌                |
| Archive project   | `project:archive`  | ✅ `project:archive` | ❌                | ❌                | ❌                |
| Unarchive project | `project:archive`  | ✅ `project:archive` | ❌                | ❌                | ❌                |
| Get features      | `project:view`     | ✅ `project:view`    | ✅ `project:view` | ✅ `project:view` | ✅ `project:view` |
| Update features   | `project:edit`     | ✅ `project:edit`    | ❌                | ❌                | ❌                |

### States — `StateListCreateAPIEndpoint` / `StateDetailAPIEndpoint`

| Action         | Permission Checked | P-Admin      | P-Contributor   | P-Commenter     | P-Guest         |
| -------------- | ------------------ | ------------ | --------------- | --------------- | --------------- |
| List states    | `state:view`       | ✅ `state:*` | ✅ `state:view` | ✅ `state:view` | ✅ `state:view` |
| Create state   | `state:create`     | ✅ `state:*` | ❌              | ❌              | ❌              |
| Retrieve state | `state:view`       | ✅ `state:*` | ✅ `state:view` | ✅ `state:view` | ✅ `state:view` |
| Update state   | `state:edit`       | ✅ `state:*` | ❌              | ❌              | ❌              |
| Delete state   | `state:delete`     | ✅ `state:*` | ❌              | ❌              | ❌              |

### Labels (project-scoped) — `LabelListCreateAPIEndpoint`

| Action       | Permission Checked | P-Admin      | P-Contributor   | P-Commenter     | P-Guest         |
| ------------ | ------------------ | ------------ | --------------- | --------------- | --------------- |
| List labels  | `label:view`       | ✅ `label:*` | ✅ `label:view` | ✅ `label:view` | ✅ `label:view` |
| Create label | `label:create`     | ✅ `label:*` | ❌              | ❌              | ❌              |

### Issues / Work Items — `IssueListCreateAPIEndpoint` / `IssueDetailAPIEndpoint` / `WorkspaceIssueAPIEndpoint`

| Action         | Permission Checked         | P-Admin         | P-Contributor        | P-Commenter        | P-Guest             |
| -------------- | -------------------------- | --------------- | -------------------- | ------------------ | ------------------- |
| List issues    | `workitem:view` (deferred) | ✅ `workitem:*` | ✅ `workitem:view`   | ✅ `workitem:view` | +Creator (deferred) |
| Create issue   | `workitem:create`          | ✅ `workitem:*` | ✅ `workitem:create` | ❌                 | ❌                  |
| Upsert issue   | `workitem:create`          | ✅ `workitem:*` | ✅ `workitem:create` | ❌                 | ❌                  |
| Retrieve issue | `workitem:view`            | ✅ `workitem:*` | ✅ `workitem:view`   | ✅ `workitem:view` | +Creator            |
| Update issue   | `workitem:edit`            | ✅ `workitem:*` | ✅ `workitem:edit`   | +Creator           | +Creator            |
| Delete issue   | `workitem:delete`          | ✅ `workitem:*` | +Creator             | +Creator           | +Creator            |

> **Workspace issue lookup** (`WorkspaceIssueAPIEndpoint`): Uses `resource_param="workspace_id"` with `scope_param_type="workspace"`. The queryset validates project membership inline.

### Issue Comments — `IssueCommentListCreateAPIEndpoint` / `IssueCommentDetailAPIEndpoint`

| Action           | Permission Checked | P-Admin         | P-Contributor       | P-Commenter         | P-Guest    |
| ---------------- | ------------------ | --------------- | ------------------- | ------------------- | ---------- |
| List comments    | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view`  | ✅ `workitem:view`  | +Creator ¹ |
| Create comment   | `comment:create`   | ✅ `comment:*`  | ✅ `comment:create` | ✅ `comment:create` | ❌         |
| Retrieve comment | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view`  | ✅ `workitem:view`  | +Creator ¹ |
| Update comment   | `comment:edit`     | ✅ `comment:*`  | +Creator            | +Creator            | ❌         |
| Delete comment   | `comment:delete`   | ✅ `comment:*`  | +Creator            | +Creator            | ❌         |

> ¹ Comment list/retrieve checks `workitem:view` on the parent issue. Guest has `workitem:view+creator` — only sees comments on own issues.

### Issue Links — `IssueLinkListCreateAPIEndpoint` / `IssueLinkDetailAPIEndpoint`

| Action        | Permission Checked     | P-Admin              | P-Contributor             | P-Commenter             | P-Guest |
| ------------- | ---------------------- | -------------------- | ------------------------- | ----------------------- | ------- |
| List links    | `workitem_link:view`   | ✅ `workitem_link:*` | ✅ `workitem_link:view`   | ✅ `workitem_link:view` | ❌      |
| Create link   | `workitem_link:create` | ✅ `workitem_link:*` | ✅ `workitem_link:create` | ❌                      | ❌      |
| Retrieve link | `workitem_link:view`   | ✅ `workitem_link:*` | ✅ `workitem_link:view`   | ✅ `workitem_link:view` | ❌      |
| Update link   | `workitem_link:edit`   | ✅ `workitem_link:*` | ✅ `workitem_link:edit`   | ❌                      | ❌      |
| Delete link   | `workitem_link:delete` | ✅ `workitem_link:*` | ✅ `workitem_link:delete` | ❌                      | ❌      |

### Issue Relations — `IssueRelationListCreateAPIEndpoint` / `IssueRelationRemoveAPIEndpoint`

| Action          | Permission Checked         | P-Admin                  | P-Contributor                 | P-Commenter                 | P-Guest |
| --------------- | -------------------------- | ------------------------ | ----------------------------- | --------------------------- | ------- |
| List relations  | `workitem_relation:view`   | ✅ `workitem_relation:*` | ✅ `workitem_relation:view`   | ✅ `workitem_relation:view` | ❌      |
| Create relation | `workitem_relation:create` | ✅ `workitem_relation:*` | ✅ `workitem_relation:create` | ❌                          | ❌      |
| Delete relation | `workitem_relation:delete` | ✅ `workitem_relation:*` | ✅ `workitem_relation:delete` | ❌                          | ❌      |

### Issue Attachments — `IssueAttachmentListCreateAPIEndpoint` / `IssueAttachmentDetailAPIEndpoint` / `IssueAttachmentServerEndpoint`

| Action              | Permission Checked  | P-Admin           | P-Contributor          | P-Commenter            | P-Guest              |
| ------------------- | ------------------- | ----------------- | ---------------------- | ---------------------- | -------------------- |
| List attachments    | `attachment:view`   | ✅ `attachment:*` | ✅ `attachment:view`   | ✅ `attachment:view`   | ✅ `attachment:view` |
| Create attachment   | `attachment:create` | ✅ `attachment:*` | ✅ `attachment:create` | ✅ `attachment:create` | ❌                   |
| Retrieve attachment | `attachment:view`   | ✅ `attachment:*` | ✅ `attachment:view`   | ✅ `attachment:view`   | ✅ `attachment:view` |
| Delete attachment   | `attachment:delete` | ✅ `attachment:*` | +Creator               | ❌ ¹                   | ❌                   |
| Upload (server)     | `attachment:create` | ✅ `attachment:*` | ✅ `attachment:create` | ✅ `attachment:create` | ❌                   |

> ¹ Commenter has `attachment:create` but not `attachment:delete`. Contributor has `attachment:delete+creator` conditional grant.

### Issue Activities — `IssueActivityListAPIEndpoint` / `IssueActivityDetailAPIEndpoint`

| Action            | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest  |
| ----------------- | ------------------ | --------------- | ------------------ | ------------------ | -------- |
| List activities   | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator |
| Retrieve activity | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator |

### Cycles — `CycleListCreateAPIEndpoint` / `CycleDetailAPIEndpoint` / `CycleArchiveUnarchiveAPIEndpoint` / `CycleIssueListCreateAPIEndpoint` / `CycleIssueDetailAPIEndpoint` / `TransferCycleIssueAPIEndpoint`

| Action             | Permission Checked | P-Admin      | P-Contributor      | P-Commenter     | P-Guest |
| ------------------ | ------------------ | ------------ | ------------------ | --------------- | ------- |
| List cycles        | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view`    | ✅ `cycle:view` | ❌      |
| Create cycle       | `cycle:create`     | ✅ `cycle:*` | ✅ `cycle:create`  | ❌              | ❌      |
| Retrieve cycle     | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view`    | ✅ `cycle:view` | ❌      |
| Update cycle       | `cycle:edit`       | ✅ `cycle:*` | ✅ `cycle:edit`    | ❌              | ❌      |
| Delete cycle       | `cycle:delete`     | ✅ `cycle:*` | +Creator           | ❌              | ❌      |
| Archive cycle      | `cycle:archive`    | ✅ `cycle:*` | ✅ `cycle:archive` | ❌              | ❌      |
| Unarchive cycle    | `cycle:archive`    | ✅ `cycle:*` | ✅ `cycle:archive` | ❌              | ❌      |
| List cycle issues  | `cycle:view`       | ✅ `cycle:*` | ✅ `cycle:view`    | ✅ `cycle:view` | ❌      |
| Add cycle issue    | `cycle:edit`       | ✅ `cycle:*` | ✅ `cycle:edit`    | ❌              | ❌      |
| Remove cycle issue | `cycle:edit`       | ✅ `cycle:*` | ✅ `cycle:edit`    | ❌              | ❌      |
| Transfer issues    | `cycle:edit`       | ✅ `cycle:*` | ✅ `cycle:edit`    | ❌              | ❌      |

### Modules — `ModuleListCreateAPIEndpoint` / `ModuleDetailAPIEndpoint` / `ModuleArchiveUnarchiveAPIEndpoint` / `ModuleIssueListCreateAPIEndpoint` / `ModuleIssueDetailAPIEndpoint`

| Action              | Permission Checked | P-Admin       | P-Contributor       | P-Commenter      | P-Guest |
| ------------------- | ------------------ | ------------- | ------------------- | ---------------- | ------- |
| List modules        | `module:view`      | ✅ `module:*` | ✅ `module:view`    | ✅ `module:view` | ❌      |
| Create module       | `module:create`    | ✅ `module:*` | ✅ `module:create`  | ❌               | ❌      |
| Retrieve module     | `module:view`      | ✅ `module:*` | ✅ `module:view`    | ✅ `module:view` | ❌      |
| Update module       | `module:edit`      | ✅ `module:*` | ✅ `module:edit`    | ❌               | ❌      |
| Delete module       | `module:delete`    | ✅ `module:*` | +Creator            | ❌               | ❌      |
| Archive module      | `module:archive`   | ✅ `module:*` | ✅ `module:archive` | ❌               | ❌      |
| List module issues  | `module:view`      | ✅ `module:*` | ✅ `module:view`    | ✅ `module:view` | ❌      |
| Add module issue    | `module:edit`      | ✅ `module:*` | ✅ `module:edit`    | ❌               | ❌      |
| Remove module issue | `module:edit`      | ✅ `module:*` | ✅ `module:edit`    | ❌               | ❌      |

### Epics — `EpicListCreateAPIEndpoint` / `EpicDetailAPIEndpoint`

| Action        | Permission Checked | P-Admin     | P-Contributor    | P-Commenter    | P-Guest |
| ------------- | ------------------ | ----------- | ---------------- | -------------- | ------- |
| List epics    | `epic:view`        | ✅ `epic:*` | ✅ `epic:view`   | ✅ `epic:view` | ❌      |
| Create epic   | `epic:create`      | ✅ `epic:*` | ✅ `epic:create` | ❌             | ❌      |
| Retrieve epic | `epic:view`        | ✅ `epic:*` | ✅ `epic:view`   | ✅ `epic:view` | ❌      |
| Update epic   | `epic:edit`        | ✅ `epic:*` | ✅ `epic:edit`   | ❌             | ❌      |
| Delete epic   | `epic:delete`      | ✅ `epic:*` | +Creator         | ❌             | ❌      |

### Milestones — `MilestoneViewSet` / `MilestoneWorkItemsViewSet`

| Action             | Permission Checked | P-Admin          | P-Contributor         | P-Commenter         | P-Guest |
| ------------------ | ------------------ | ---------------- | --------------------- | ------------------- | ------- |
| List milestones    | `milestone:view`   | ✅ `milestone:*` | ✅ `milestone:view`   | ✅ `milestone:view` | ❌      |
| Create milestone   | `milestone:create` | ✅ `milestone:*` | ✅ `milestone:create` | ❌                  | ❌      |
| Retrieve milestone | `milestone:view`   | ✅ `milestone:*` | ✅ `milestone:view`   | ✅ `milestone:view` | ❌      |
| Update milestone   | `milestone:edit`   | ✅ `milestone:*` | ✅ `milestone:edit`   | ❌                  | ❌      |
| Delete milestone   | `milestone:delete` | ✅ `milestone:*` | ✅ `milestone:delete` | ❌                  | ❌      |

### Intake Issues — `IntakeIssueListCreateAPIEndpoint` / `IntakeIssueDetailAPIEndpoint`

| Action          | Permission Checked       | P-Admin       | P-Contributor      | P-Commenter         | P-Guest             |
| --------------- | ------------------------ | ------------- | ------------------ | ------------------- | ------------------- |
| List intake     | `intake:view` (deferred) | ✅ `intake:*` | ✅ `intake:view`   | +Creator (deferred) | +Creator (deferred) |
| Submit intake   | `intake:submit`          | ✅ `intake:*` | ✅ `intake:submit` | ✅ `intake:submit`  | ✅ `intake:submit`  |
| Retrieve intake | `intake:view`            | ✅ `intake:*` | ✅ `intake:view`   | +Creator            | +Creator            |
| Update intake   | `intake:edit`            | ✅ `intake:*` | +Creator           | +Creator            | +Creator            |
| Delete intake   | `intake:delete`          | ✅ `intake:*` | +Creator           | +Creator            | +Creator            |

> **Note:** Commenter and Guest have `intake:view/edit/delete` only with `+creator` conditional grants. The list endpoint uses `defer_conditions=True` so the queryset filters to `created_by=request.user` for these roles.

### Issue Properties — `IssueTypeListCreateAPIEndpoint` / `IssueTypeDetailAPIEndpoint` / `WorkItemPropertyListCreateEndpoint` / `WorkItemPropertyDetailEndpoint`

| Action            | Permission Checked      | P-Admin               | P-Contributor              | P-Commenter              | P-Guest |
| ----------------- | ----------------------- | --------------------- | -------------------------- | ------------------------ | ------- |
| List properties   | `issue_property:view`   | ✅ `issue_property:*` | ✅ `issue_property:view`   | ✅ `issue_property:view` | ❌      |
| Create property   | `issue_property:create` | ✅ `issue_property:*` | ✅ `issue_property:create` | ❌                       | ❌      |
| Retrieve property | `issue_property:view`   | ✅ `issue_property:*` | ✅ `issue_property:view`   | ✅ `issue_property:view` | ❌      |
| Update property   | `issue_property:edit`   | ✅ `issue_property:*` | ✅ `issue_property:edit`   | ❌                       | ❌      |
| Delete property   | `issue_property:delete` | ✅ `issue_property:*` | ✅ `issue_property:delete` | ❌                       | ❌      |

### Property Options — `WorkItemPropertyOptionListCreateEndpoint` / `WorkItemPropertyOptionDetailEndpoint`

| Action        | Permission Checked      | P-Admin               | P-Contributor              | P-Commenter              | P-Guest |
| ------------- | ----------------------- | --------------------- | -------------------------- | ------------------------ | ------- |
| List options  | `issue_property:view`   | ✅ `issue_property:*` | ✅ `issue_property:view`   | ✅ `issue_property:view` | ❌      |
| Create option | `issue_property:create` | ✅ `issue_property:*` | ✅ `issue_property:create` | ❌                       | ❌      |
| Update option | `issue_property:edit`   | ✅ `issue_property:*` | ✅ `issue_property:edit`   | ❌                       | ❌      |
| Delete option | `issue_property:delete` | ✅ `issue_property:*` | ✅ `issue_property:delete` | ❌                       | ❌      |

### Property Values — `WorkItemPropertyValueEndpoint` / `WorkItemPropertiesAPIEndpoint`

| Action     | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest  |
| ---------- | ------------------ | --------------- | ------------------ | ------------------ | -------- |
| Get values | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator |
| Set values | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | +Creator           | +Creator |

### Work Item Type Schema — `WorkItemTypeSchemaEndpoint`

| Action     | Permission Checked    | P-Admin               | P-Contributor            | P-Commenter              | P-Guest |
| ---------- | --------------------- | --------------------- | ------------------------ | ------------------------ | ------- |
| Get schema | `issue_property:view` | ✅ `issue_property:*` | ✅ `issue_property:view` | ✅ `issue_property:view` | ❌      |

### Work Item Type Create — `WorkItemTypeCreateEndpoint`

| Action           | Permission Checked | P-Admin         | P-Contributor        | P-Commenter | P-Guest |
| ---------------- | ------------------ | --------------- | -------------------- | ----------- | ------- |
| Create with type | `workitem:create`  | ✅ `workitem:*` | ✅ `workitem:create` | ❌          | ❌      |

### Pages (project-scoped) — `ProjectPageAPIEndpoint` / `ProjectPageDetailAPIEndpoint`

| Action        | Permission Checked | P-Admin     | P-Contributor    | P-Commenter    | P-Guest        |
| ------------- | ------------------ | ----------- | ---------------- | -------------- | -------------- |
| List pages    | `page:view`        | ✅ `page:*` | ✅ `page:view`   | ✅ `page:view` | ✅ `page:view` |
| Create page   | `page:create`      | ✅ `page:*` | ✅ `page:create` | ❌             | ❌             |
| Retrieve page | `page:view`        | ✅ `page:*` | ✅ `page:view`   | ✅ `page:view` | ✅ `page:view` |
| Update page   | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             |
| Delete page   | `page:delete`      | ✅ `page:*` | ❌ ¹             | ❌             | ❌             |

> ¹ Contributor has `page:view`, `page:create`, `page:edit`, `page:share` but NOT `page:delete`. Only project admin can delete pages.

### Work Item Pages — `WorkItemPageListCreateAPIEndpoint` / `WorkItemPageDetailAPIEndpoint`

| Action                | Permission Checked | P-Admin     | P-Contributor    | P-Commenter    | P-Guest        |
| --------------------- | ------------------ | ----------- | ---------------- | -------------- | -------------- |
| List work item pages  | `page:view`        | ✅ `page:*` | ✅ `page:view`   | ✅ `page:view` | ✅ `page:view` |
| Create work item page | `page:create`      | ✅ `page:*` | ✅ `page:create` | ❌             | ❌             |
| Retrieve page         | `page:view`        | ✅ `page:*` | ✅ `page:view`   | ✅ `page:view` | ✅ `page:view` |
| Update page           | `page:edit`        | ✅ `page:*` | ✅ `page:edit`   | ❌             | ❌             |
| Delete page           | `page:delete`      | ✅ `page:*` | ❌               | ❌             | ❌             |

### Worklogs — `WorkItemWorklogEndpoint` / `ProjectWorklogAPIEndpoint`

| Action         | Permission Checked | P-Admin         | P-Contributor      | P-Commenter        | P-Guest  |
| -------------- | ------------------ | --------------- | ------------------ | ------------------ | -------- |
| List worklogs  | `workitem:view`    | ✅ `workitem:*` | ✅ `workitem:view` | ✅ `workitem:view` | +Creator |
| Create worklog | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | +Creator           | +Creator |
| Update worklog | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | +Creator           | +Creator |
| Delete worklog | `workitem:edit`    | ✅ `workitem:*` | ✅ `workitem:edit` | +Creator           | +Creator |

### Assets (workspace-scoped) — `GenericAssetEndpoint`

Generic assets are stored under the workspace and are gated by `WorkspaceAssetPermissions` with `scope_param_type="workspace"`. If the POST body supplies a `project_id`, the view additionally verifies active project membership before issuing the presigned URL (inline data-level check; does not change the `@can` permission).

| Action       | Permission Checked       | WS-Owner / WS-Admin    | WS-Member                   | WS-Guest |
| ------------ | ------------------------ | ---------------------- | --------------------------- | -------- |
| Get asset    | `workspace_asset:view`   | ✅ `workspace_asset:*` | ✅ `workspace_asset:view`   | ❌       |
| Create asset | `workspace_asset:create` | ✅ `workspace_asset:*` | ✅ `workspace_asset:create` | ❌       |
| Edit asset   | `workspace_asset:edit`   | ✅ `workspace_asset:*` | ❌                          | ❌       |

### Project Members — `ProjectMemberSiloEndpoint` / `ProjectMemberListCreateAPIEndpoint`

| Action        | Permission Checked           | P-Admin               | P-Contributor            | P-Commenter              | P-Guest                  |
| ------------- | ---------------------------- | --------------------- | ------------------------ | ------------------------ | ------------------------ |
| List members  | `project_member:view`        | ✅ `project_member:*` | ✅ `project_member:view` | ✅ `project_member:view` | ✅ `project_member:view` |
| Add member    | `project_member:invite`      | ✅ `project_member:*` | ❌                       | ❌                       | ❌                       |
| Change role   | `project_member:change_role` | ✅ `project_member:*` | ❌                       | ❌                       | ❌                       |
| Remove member | `project_member:remove`      | ✅ `project_member:*` | ❌                       | ❌                       | ❌                       |

> **Note:** Role hierarchy checks (can't add/remove a member with a higher role than your own) are enforced inline as business logic, alongside `@can`.

---

## Endpoints Kept As-Is (no `@can`)

These endpoints are not migrated to `@can` and retain their original permission setup:

| Endpoint                         | Permission Classes                        | Reason                                                                        |
| -------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `UserEndpoint`                   | `[TokenHasScopeIfOAuth]`                  | Serves `users/me/` — no workspace context in URL                              |
| `UserAssetEndpoint`              | `[TokenHasScopeIfOAuth]`                  | User-scoped asset upload at `assets/user-assets/` — no workspace context      |
| `UserServerAssetEndpoint`        | `[TokenHasScopeIfOAuth]`                  | User-scoped server asset at `assets/user-assets/` — no workspace context      |
| `IssueSearchEndpoint`            | `[IsAuthenticated, TokenHasScopeIfOAuth]` | Cross-project search; inline queryset membership filter IS the access control |
| `PublishedPageDetailAPIEndpoint` | `[IsAuthenticated]`                       | Serves published (public) page content; no RBAC needed                        |
