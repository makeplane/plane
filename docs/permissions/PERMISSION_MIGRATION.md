# Permission System Migration Tracker

This document tracks the migration from `@allow_permission` to `@can` decorator across all views.

## Migration Status

| Status   | Count |
| -------- | ----- |
| Migrated | 393   |
| Pending  | 0     |

## Completed Migrations

### IssueViewSet

**File:** `apps/api/plane/app/views/issue/base.py`

| Method           | URL Pattern                                                    | Old Permission                                                                        | New Permission                                                                    | Differences                                                                                                                                                                    |
| ---------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/issues/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`                            | `@can(IssuePermissions.VIEW, resource_param="project_id", defer_conditions=True)` | Now checks `project.workitem:view` permission from role. Guest access via `workitem:view+creator` conditional grant with `defer_conditions=True` — guest sees only own issues. |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/issues/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`                                        | `@can(IssuePermissions.CREATE, resource_param="project_id")`                      | Now checks `project.issue:create` permission from role                                                                                                                         |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/issues/<pk>/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], creator=True, model=Issue)` | `@can(IssuePermissions.VIEW, resource_param="pk")`                                | Guest-creator access now via `workitem:view+creator` conditional grant in system_roles.py                                                                                      |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/issues/<pk>/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue)`             | `@can(IssuePermissions.EDIT, resource_param="pk")`                                | Creator access via `workitem:edit+creator` conditional grant (commenter/guest)                                                                                                 |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/issues/<pk>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue)`             | `@can(IssuePermissions.DELETE, resource_param="pk")`                              | Creator access via `workitem:delete+creator` conditional grant (contributor/commenter/guest)                                                                                   |

**Post-migration cleanup (`guest_view_all_features`):**

- **`list`**: Removed dead `guest_view_all_features` queryset filter (lines 436-448). Guest list access restored via `defer_conditions=True` on decorator + `created_by` queryset filter. Guests see only issues they created.
- **`retrieve`**: Guest-creator access for intake-created issues restored via `workitem:view+creator` conditional grant in `system_roles.py`. Removed dead `guest_view_all_features` block (lines 808-828) — the conditional grant handles guest creator access; non-creator guests are blocked by the decorator.

### IssueListEndpoint

**File:** `apps/api/plane/app/views/issue/base.py`

| Method | URL Pattern                                                          | Old Permission                                             | New Permission                                                                    | Differences                                                                                                           |
| ------ | -------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/issues/list/?issues=…` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(IssuePermissions.VIEW, resource_param="project_id", defer_conditions=True)` | Guest access via `workitem:view+creator` conditional grant with `defer_conditions=True` — guest sees only own issues. |

### IssuePaginatedViewSet

**File:** `apps/api/plane/app/views/issue/base.py`

| Method | URL Pattern                                                      | Old Permission                                             | New Permission                                                                    | Differences                                                                                                                                                         |
| ------ | ---------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list` | `GET /workspaces/<slug>/projects/<project_id>/issues/paginated/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(IssuePermissions.VIEW, resource_param="project_id", defer_conditions=True)` | Dead `guest_view_all_features` block removed. Guest access via `workitem:view+creator` conditional grant with `defer_conditions=True` — guest sees only own issues. |

### IssueDetailEndpoint

**File:** `apps/api/plane/app/views/issue/base.py`

| Method | URL Pattern                                                   | Old Permission                                             | New Permission                                                                    | Differences                                                                                                                                                                                    |
| ------ | ------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/issues/detail/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(IssuePermissions.VIEW, resource_param="project_id", defer_conditions=True)` | Dead `permission_subquery` and `guest_view_all_features` blocks removed. Guest access via `workitem:view+creator` conditional grant with `defer_conditions=True` — guest sees only own issues. |

### WorkspaceViewIssuesViewSet

**File:** `apps/api/plane/app/views/view/base.py`

| Method | URL Pattern                      | Old Permission                                                                | New Permission                                                                                                                                          | Differences                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------ | -------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list` | `GET /workspaces/<slug>/issues/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` + `AuthorizedListingView` mixin + `.authorized_for(request, WorkitemPermissions.VIEW)` | Uses the canonical authorized-listing pattern. Scope-membership gate (`workspace:view`) decides 200 vs 403 for outsiders. `.authorized_for()` on the queryset handles per-project row filtering via the engine's `get_accessible_resources_with_conditions` primitive — correctly merging direct + teamspace-link paths (deny wins > unconditional upgrades conditional > conditionals union), so project guests with `workitem:view+creator` see only their own issues. `AuthorizedListingView` enforces the `.authorized_for()` call at `finalize_response`; omitting it returns a structured 500 (`code="listing_authorization_misconfigured"`). |

**Additional Changes:**

This migration also replaced the data-level filtering to use `ResourcePermission` as the source of truth:

| Aspect                  | Old Approach                                                                               | New Approach                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **Endpoint gate**       | `@allow_permission` (role membership check)                                                | `@can(WorkspacePermissions.VIEW)` (permission-based)                          |
| **Accessible projects** | `accessible_to()` → queries `ProjectMember` + `TeamspaceMember`                            | `permission_engine.get_accessible_resources()` → queries `ResourcePermission` |
| **Guest filtering**     | `_get_project_permission_filters()` → joins through `project__project_projectmember__role` | Uses `include_relations=True` to get user's relation per project              |
| **Teamspace access**    | Handled by `accessible_to()` via `TeamspaceProject` query                                  | Handled by link relation traversal in `get_accessible_resources()`            |

**New pattern:**

- Inherits from `PermissionMixin` (provides `get_accessible_resources()` and other helpers)
- `workspace_id` property — required for `@can` decorator and `PermissionMixin`
- `_get_accessible_projects()` — cached wrapper around `self.get_accessible_resources(include_relations=True)`

### IssueCommentViewSet

**File:** `apps/api/plane/app/views/issue/comment.py`

| Method           | URL Pattern                                                                        | Old Permission                                                      | New Permission                                                                                       | Differences                                                                     |
| ---------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/comments/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`          | `@can(IssuePermissions.VIEW, resource_param="issue_id")`                                             | Now checks `project.issue:view` permission from role                            |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/comments/<pk>/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`          | `@can(IssuePermissions.VIEW, resource_param="issue_id")`                                             | Now checks `project.issue:view` permission from role                            |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/comments/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`          | `@can(CommentPermissions.CREATE, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Now checks `comment:create` with workitem parent lookup                         |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/comments/<pk>/`  | `@allow_permission([ROLE.ADMIN], creator=True, model=IssueComment)` | `@can(CommentPermissions.EDIT, resource_param="pk")`                                                 | **Security fix**: creator access via `comment:edit+creator` conditional grant   |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/comments/<pk>/` | `@allow_permission([ROLE.ADMIN], creator=True, model=IssueComment)` | `@can(CommentPermissions.DELETE, resource_param="pk")`                                               | **Security fix**: creator access via `comment:delete+creator` conditional grant |

**Post-migration cleanup (`guest_view_all_features`):**

- **`create`**: Removed dead `guest_view_all_features` block (lines 78-95). `@can(IssuePermissions.COMMENT, resource_param="issue_id")` blocks guests entirely — the block was unreachable. Removed unused imports: `Project`, `Issue` from `plane.db.models`, and `check_if_current_user_is_teamspace_member` from `plane.ee.utils`.

**Deprecated grant cleanup (`Action.COMMENT` removal):**

- Decorators now use `CommentPermissions.CREATE` (with `scope_param_type`) and `CommentPermissions.REACT` instead of `IssuePermissions.COMMENT` / `EpicPermissions.COMMENT`. The deprecated `WorkitemPermissions.COMMENT` and `EpicPermissions.COMMENT` grants were removed from contributor and commenter roles in `system_roles.py`. `Action.COMMENT` was removed from `RESOURCE_ACTIONS` for WORKITEM, EPIC, WIKI, and PAGE — these attributes (`WorkitemPermissions.COMMENT`, `EpicPermissions.COMMENT`, etc.) are no longer generated. All roles already have `CommentPermissions.CREATE` and `CommentPermissions.REACT` which are now the only grants checked.
- `"put": "update"` removed from IssueCommentViewSet detail URL (FE uses PATCH only).

**Related endpoints in same file:**

| Endpoint                      | Method    | Old Permission                                             | New Permission                                                |
| ----------------------------- | --------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `IssueCommentRepliesEndpoint` | `get`     | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(IssuePermissions.VIEW, resource_param="issue_id")`      |
| `CommentReactionViewSet`      | `list`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(IssuePermissions.VIEW, resource_param="project_id")`    |
| `CommentReactionViewSet`      | `create`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(CommentPermissions.REACT, resource_param="project_id")` |
| `CommentReactionViewSet`      | `destroy` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(CommentPermissions.REACT, resource_param="project_id")` |

### CycleViewSet (complete)

**File:** `apps/api/plane/app/views/cycle/base.py`

| Method           | URL Pattern                                                    | Old Permission                                               | New Permission                                                           | Differences                                            |
| ---------------- | -------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/cycles/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`   | `@can(CyclePermissions.VIEW, resource_param="project_id")`               | Now checks `project.cycle:view` permission from role   |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/cycles/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`               | `@can(CyclePermissions.CREATE, resource_param="project_id")`             | Now checks `project.cycle:create` permission from role |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/cycles/<pk>/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`               | `@can(CyclePermissions.VIEW, resource_param="pk")`                       | Now checks `project.cycle:view` permission from role   |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/cycles/<pk>/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`               | `@can(CyclePermissions.EDIT, resource_param="pk")`                       | Now checks `project.cycle:edit` permission from role   |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/cycles/<pk>/` | `@allow_permission([ROLE.ADMIN], creator=True, model=Cycle)` | `@can(CyclePermissions.DELETE, resource_param="pk", allow_creator=True)` | **Security fix**: creator must still be project member |

**Related endpoints in same file:**

| Endpoint                      | Method    | Old Permission                                             | New Permission                                               |
| ----------------------------- | --------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| `CycleDateCheckEndpoint`      | `post`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`             | `@can(CyclePermissions.CREATE, resource_param="project_id")` |
| `CycleFavoriteViewSet`        | `create`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`             | `@can(CyclePermissions.VIEW, resource_param="project_id")`   |
| `CycleFavoriteViewSet`        | `destroy` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`             | `@can(CyclePermissions.VIEW, resource_param="project_id")`   |
| `TransferCycleIssueEndpoint`  | `post`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`             | `@can(CyclePermissions.EDIT, resource_param="cycle_id")`     |
| `CycleUserPropertiesEndpoint` | `patch`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(CyclePermissions.VIEW, resource_param="cycle_id")`     |
| `CycleUserPropertiesEndpoint` | `get`     | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(CyclePermissions.VIEW, resource_param="cycle_id")`     |
| `CycleProgressEndpoint`       | `get`     | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(CyclePermissions.VIEW, resource_param="cycle_id")`     |
| `CycleAnalyticsEndpoint`      | `get`     | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(CyclePermissions.VIEW, resource_param="cycle_id")`     |

### CycleArchiveUnarchiveEndpoint

**File:** `apps/api/plane/app/views/cycle/archive.py`

| Method   | URL Pattern                                                                  | Old Permission                                 | New Permission                                              | Differences                                                        |
| -------- | ---------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/archived-cycles/[<pk>/]`       | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(CyclePermissions.VIEW, resource_param="project_id")`  | Equivalent access; commenter has no cycle:view so remains blocked  |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/archive/`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(CyclePermissions.ARCHIVE, resource_param="cycle_id")` | New `cycle:archive` action added to definitions + contributor role |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/archive/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(CyclePermissions.ARCHIVE, resource_param="cycle_id")` | New `cycle:archive` action added to definitions + contributor role |

### CycleIssueViewSet

**File:** `apps/api/plane/app/views/cycle/issue.py`

| Method    | URL Pattern                                                                                  | Old Permission                                 | New Permission                                           | Differences                                            |
| --------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| `list`    | `GET /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/cycle-issues/`               | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(CyclePermissions.VIEW, resource_param="cycle_id")` | Equivalent access; commenter has no cycle:view         |
| `create`  | `POST /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/cycle-issues/`              | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(CyclePermissions.EDIT, resource_param="cycle_id")` | Equivalent access; adding issues to cycle = cycle:edit |
| `destroy` | `DELETE /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/cycle-issues/<issue_id>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(CyclePermissions.EDIT, resource_param="cycle_id")` | Equivalent access; removing issues = cycle:edit        |

### ModuleViewSet (complete)

**File:** `apps/api/plane/app/views/module/base.py`

| Method           | URL Pattern                                                     | Old Permission                                                | New Permission                                                            | Differences                                             |
| ---------------- | --------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/modules/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`    | `@can(ModulePermissions.VIEW, resource_param="project_id")`               | Now checks `project.module:view` permission from role   |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/modules/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`                | `@can(ModulePermissions.CREATE, resource_param="project_id")`             | Now checks `project.module:create` permission from role |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/modules/<pk>/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`                | `@can(ModulePermissions.VIEW, resource_param="pk")`                       | Now checks `project.module:view` permission from role   |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/modules/<pk>/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`                | `@can(ModulePermissions.EDIT, resource_param="pk")`                       | Now checks `project.module:edit` permission from role   |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/modules/<pk>/` | `@allow_permission([ROLE.ADMIN], creator=True, model=Module)` | `@can(ModulePermissions.DELETE, resource_param="pk", allow_creator=True)` | **Security fix**: creator must still be project member  |

**Related endpoints in same file:**

| Endpoint                       | Method    | Old Permission                                             | New Permission                                              |
| ------------------------------ | --------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| `ModuleFavoriteViewSet`        | `create`  | `permission_classes = [ProjectLitePermission]`             | `@can(ModulePermissions.VIEW, resource_param="project_id")` |
| `ModuleFavoriteViewSet`        | `destroy` | `permission_classes = [ProjectLitePermission]`             | `@can(ModulePermissions.VIEW, resource_param="project_id")` |
| `ModuleUserPropertiesEndpoint` | `patch`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(ModulePermissions.VIEW, resource_param="module_id")`  |
| `ModuleUserPropertiesEndpoint` | `get`     | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(ModulePermissions.VIEW, resource_param="module_id")`  |

### IssueAttachmentEndpoint

**File:** `apps/api/plane/app/views/issue/attachment.py`

| Method   | URL Pattern                                                                           | Old Permission                                                   | New Permission                                                                                           | Differences                                                                                                                                                               |
| -------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/attachments/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`       | `@can(AttachmentPermissions.CREATE, resource_param="project_id", scope_param_type=ResourceType.PROJECT)` | Checks `attachment:create` via project membership tuple                                                                                                                   |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/attachments/<pk>/` | `@allow_permission([ROLE.ADMIN], creator=True, model=FileAsset)` | `@can(AttachmentPermissions.DELETE, resource_param="pk")`                                                | **Security fix**: creator must still be project member; added workspace/project scope filter. Conditional grant `attachment:delete+creator` replaces `allow_creator=True` |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/attachments/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`       | `@can(AttachmentPermissions.VIEW, resource_param="project_id", scope_param_type=ResourceType.PROJECT)`   | Checks `attachment:view` via project membership tuple                                                                                                                     |

**Additional fix:** V1 `delete` method now scopes the `FileAsset` query with `workspace__slug=slug, project_id=project_id` (was previously `FileAsset.objects.get(pk=pk)` with no scope filter — SECURITY-002).

**Decorator fix (2026-02-19):** Collection-level ops (`post`, `get`) changed from `resource_param="issue_id"` to `resource_param="project_id", scope_param_type=ResourceType.PROJECT`. The previous `resource_param="issue_id"` caused engine to default to `resource_type="attachment"` and try `FileAsset.objects.filter(id=<issue_id>)`, which returned nothing — denying access for all users.

### IssueAttachmentV2Endpoint

**File:** `apps/api/plane/app/views/issue/attachment.py`

| Method   | URL Pattern                                                                              | Old Permission                                                   | New Permission                                                                                           | Differences                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/attachments/v2/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`       | `@can(AttachmentPermissions.CREATE, resource_param="project_id", scope_param_type=ResourceType.PROJECT)` | Checks `attachment:create` via project membership tuple                                                                             |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/attachments/v2/<pk>/` | `@allow_permission([ROLE.ADMIN], creator=True, model=FileAsset)` | `@can(AttachmentPermissions.DELETE, resource_param="pk")`                                                | **Security fix**: creator must still be project member. Conditional grant `attachment:delete+creator` replaces `allow_creator=True` |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/attachments/v2/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`       | `@can(AttachmentPermissions.VIEW, resource_param="project_id", scope_param_type=ResourceType.PROJECT)`   | Checks `attachment:view` via project membership tuple                                                                               |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/attachments/v2/<pk>/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`       | `@can(AttachmentPermissions.EDIT, resource_param="pk")`                                                  | Checks `attachment:edit` via FileAsset→project hierarchy                                                                            |

**Decorator fix (2026-02-19):** Collection-level ops (`post`, `get`) changed from `resource_param="issue_id"` to `resource_param="project_id", scope_param_type=ResourceType.PROJECT`. The previous `resource_param="issue_id"` caused engine to default to `resource_type="attachment"` and try `FileAsset.objects.filter(id=<issue_id>)`, which returned nothing — denying access for all users.

### IssueReactionViewSet

**File:** `apps/api/plane/app/views/issue/reaction.py`

| Method    | URL Pattern                                                                                    | Old Permission                                             | New Permission                                            | Differences                                                                       |
| --------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `create`  | `POST /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/reactions/`                   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(IssuePermissions.REACT, resource_param="issue_id")` | Now checks `project.issue:react` permission; guest no longer has access           |
| `destroy` | `DELETE /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/reactions/<reaction_code>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(IssuePermissions.REACT, resource_param="issue_id")` | Now checks `project.issue:react` permission; destroy scoped to actor=request.user |

**Notes:**

- Added `Action.REACT` to Issue resource type in `definitions.py` (generates `IssuePermissions.REACT`)
- Granted `IssuePermissions.REACT` to contributor and commenter roles in `system_roles.py`
- Guest no longer has access (no `project.issue:react` permission in guest role)
- `destroy` already filters by `actor=request.user`, so users can only remove their own reactions

### LabelViewSet

**File:** `apps/api/plane/app/views/issue/label.py`

| Method           | URL Pattern                                                    | Old Permission                                 | New Permission                                               | Differences                                                                                                |
| ---------------- | -------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/labels/`         | `permission_classes = [ProjectBasePermission]` | `@can(LabelPermissions.VIEW, resource_param="project_id")`   | Was any workspace member for SAFE methods; now requires `project.label:view` (admin/contributor/commenter) |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/labels/<pk>/`    | `permission_classes = [ProjectBasePermission]` | `@can(LabelPermissions.VIEW, resource_param="pk")`           | Same as list                                                                                               |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/labels/`        | `@allow_permission([ROLE.ADMIN])`              | `@can(LabelPermissions.CREATE, resource_param="project_id")` | Now checks `project.label:create` permission from role                                                     |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/labels/<pk>/`  | `@allow_permission([ROLE.ADMIN])`              | `@can(LabelPermissions.EDIT, resource_param="pk")`           | Now checks `project.label:edit` permission from role                                                       |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/labels/<pk>/` | `@allow_permission([ROLE.ADMIN])`              | `@can(LabelPermissions.DELETE, resource_param="pk")`         | Now checks `project.label:delete` permission from role                                                     |

**Related endpoints in same file:**

| Endpoint                        | Method | Old Permission                    | New Permission                                               |
| ------------------------------- | ------ | --------------------------------- | ------------------------------------------------------------ |
| `BulkCreateIssueLabelsEndpoint` | `post` | `@allow_permission([ROLE.ADMIN])` | `@can(LabelPermissions.CREATE, resource_param="project_id")` |

### IssueArchiveViewSet

**File:** `apps/api/plane/app/views/issue/archive.py`

| Method      | URL Pattern                                                            | Old Permission                                 | New Permission                                                                    | Differences                                                                                                                                            |
| ----------- | ---------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `list`      | `GET /workspaces/<slug>/projects/<project_id>/archived-issues/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(IssuePermissions.VIEW, resource_param="project_id", defer_conditions=True)` | Commenters gain access. Guest access via `workitem:view+creator` conditional grant with `defer_conditions=True` — guest sees only own archived issues. |
| `retrieve`  | `GET /workspaces/<slug>/projects/<project_id>/archived-issues/<pk>/`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(IssuePermissions.VIEW, resource_param="pk")`                                | Commenters gain access; guests still blocked                                                                                                           |
| `archive`   | `POST /workspaces/<slug>/projects/<project_id>/issues/<pk>/archive/`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(IssuePermissions.ARCHIVE, resource_param="pk")`                             | Now checks `project.issue:archive` permission from role                                                                                                |
| `unarchive` | `POST /workspaces/<slug>/projects/<project_id>/issues/<pk>/unarchive/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(IssuePermissions.ARCHIVE, resource_param="pk")`                             | Now checks `project.issue:archive` permission from role                                                                                                |

**Related endpoints in same file:**

| Endpoint                    | Method | Old Permission                                                                                    | New Permission                                                |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `BulkArchiveIssuesEndpoint` | `post` | `permission_classes = [ProjectEntityPermission]` + `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(IssuePermissions.ARCHIVE, resource_param="project_id")` |

**Notes:**

- No new permissions added — `IssuePermissions.ARCHIVE` already existed in `definitions.py`
- Role grants already configured in `system_roles.py`: admin (wildcard), contributor (explicit `ARCHIVE`)
- Commenter and guest have no `project.issue:archive` permission
- `list`/`retrieve` use `IssuePermissions.VIEW` — commenters gain read access to archived issues (intentional consistency with regular issue viewing)
- Removed `permission_classes = [ProjectEntityPermission]` from `BulkArchiveIssuesEndpoint` — `@can` replaces both DRF class and method decorator

### IssueActivityEndpoint

**File:** `apps/api/plane/app/views/issue/activity.py`

| Method | URL Pattern                                                                  | Old Permission                                                                                                | New Permission                                                               | Differences                                                                               |
| ------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/activities/` | `permission_classes = [ProjectEntityPermission]` + `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(IssuePermissions.VIEW, resource_param="issue_id", allow_creator=True)` | Guest access now requires creator status (intake issue creator can view their activities) |

**Notes:**

- Removed `permission_classes = [ProjectEntityPermission]` — `@can` replaces both DRF class and method decorator
- `allow_creator=True` enables guest access for intake issue creators — guests who created an issue via intake can view its activities
- No new permissions added — `IssuePermissions.VIEW` already exists and is granted to admin (wildcard), contributor, and commenter
- `@method_decorator(gzip_page)` retained as outermost decorator

### IssueVersionEndpoint / WorkItemDescriptionVersionEndpoint

**File:** `apps/api/plane/app/views/issue/version.py`

| Method | URL Pattern                                                                                   | Old Permission                                             | New Permission                                                                   | Differences                                                                              |
| ------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/versions/[<pk>/]`             | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(IssuePermissions.VIEW, resource_param="issue_id", allow_creator=True)`     | Guest access now requires creator status (intake issue creator can view version history) |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/descriptions/[<pk>/]` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(IssuePermissions.VIEW, resource_param="work_item_id", allow_creator=True)` | Guest access now requires creator status (intake issue creator can view version history) |

**Post-migration cleanup (`guest_view_all_features`):**

- **`WorkItemDescriptionVersionEndpoint.get`**: Removed dead `guest_view_all_features` block (lines 98-116). `@can(IssuePermissions.VIEW, allow_creator=True)` handles guest creator access; non-creator guests are blocked by the decorator.
- Removed unused imports: `Project`, `ProjectMember`, `Issue` from `plane.db.models`, `allow_permission`, `ROLE` from `plane.app.permissions`, and `check_if_current_user_is_teamspace_member` from `plane.ee.utils`.

### ProjectUserDisplayPropertyEndpoint

**File:** `apps/api/plane/app/views/issue/base.py`

| Method  | URL Pattern                                                       | Old Permission                                             | New Permission                                               | Differences                                                                                               |
| ------- | ----------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `patch` | `PATCH /workspaces/<slug>/projects/<project_id>/user-properties/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(ProjectPermissions.VIEW, resource_param="project_id")` | Exact parity — all project roles (admin, contributor, commenter, guest) have unconditional `project:view` |
| `get`   | `GET /workspaces/<slug>/projects/<project_id>/user-properties/`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(ProjectPermissions.VIEW, resource_param="project_id")` | Exact parity — user-scoped (operates on `request.user` only)                                              |

**Notes:**

- Initially migrated to `IssuePermissions.VIEW`, which blocked guests (they only have conditional `workitem:view+creator`). Changed to `ProjectPermissions.VIEW` since user display preferences are a project-level resource, not an issue-level one.
- Both methods operate only on `request.user`'s own `ProjectUserProperty` record
- All project members have unconditional `project:view`, so no role is blocked

### BulkDeleteIssuesEndpoint

**File:** `apps/api/plane/app/views/issue/base.py`

| Method   | URL Pattern                                                           | Old Permission                    | New Permission                                               | Differences                                                                                                           |
| -------- | --------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/bulk-delete-issues/` | `@allow_permission([ROLE.ADMIN])` | `@can(IssuePermissions.DELETE, resource_param="project_id")` | Same effective access — only admin has `project.issue:delete` (via wildcard); no `allow_creator` since bulk operation |

### DeletedIssuesListViewSet

**File:** `apps/api/plane/app/views/issue/base.py`

| Method | URL Pattern                                                    | Old Permission                                             | New Permission                                                                    | Differences                                                                                                                            |
| ------ | -------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/deleted-issues/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(IssuePermissions.VIEW, resource_param="project_id", defer_conditions=True)` | Guest access via `workitem:view+creator` conditional grant with `defer_conditions=True` — guest sees only own deleted/archived issues. |

### IssueBulkUpdateDateEndpoint

**File:** `apps/api/plane/app/views/issue/base.py`

| Method | URL Pattern                                                  | Old Permission                                 | New Permission                                             | Differences                                                                                                                                         |
| ------ | ------------------------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/issue-dates/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(IssuePermissions.EDIT, resource_param="project_id")` | Equivalent access: admin + contributor retain access. **Security fix**: issue query now scoped to workspace + project (was unscoped `id__in` only). |

### IssueMetaEndpoint

**File:** `apps/api/plane/app/views/issue/base.py`

| Method | URL Pattern                                                            | Old Permission                                                              | New Permission                                                               | Differences                                                                                                                                                                                                               |
| ------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/meta/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")` | `@can(IssuePermissions.VIEW, resource_param="issue_id", allow_creator=True)` | Guests blocked unless creator (intake issue creators retain access via `allow_creator`); consistent with `IssueViewSet.retrieve` migration. Import cleanup: `allow_permission` and `ROLE` removed from file (last usage). |

### IssueDetailIdentifierEndpoint

**File:** `apps/api/plane/app/views/issue/base.py`

| Method | URL Pattern                                                                  | Old Permission                                                       | New Permission                                                                                                    | Differences                                                                                                                                                                                                                                                                    |
| ------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `get`  | `GET /workspaces/<slug>/work-items/<project_identifier>-<issue_identifier>/` | No decorator (manual ProjectMember + TeamspaceMember + guest checks) | Inline `permission_engine.check(IssuePermissions.VIEW, allow_creator=True)` + `EpicPermissions.VIEW` engine check | Inline checks (not `@can`) due to string identifier URL params. Guests blocked unless creator. `guest_view_all_features` no longer bypasses. TeamspaceMember → permission engine. Epic check → `EpicPermissions.VIEW` engine-based. New `EpicPermissions` resource type added. |

### ModuleIssueViewSet

**File:** `apps/api/plane/app/views/module/issue.py`

| Method                 | URL Pattern                                         | Old Permission                                 | New Permission                                              | Differences                                              |
| ---------------------- | --------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| `list`                 | `GET .../modules/<module_id>/issues/`               | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(ModulePermissions.VIEW, resource_param="module_id")`  | Equivalent access; commenter has no module:view          |
| `create_module_issues` | `POST .../modules/<module_id>/issues/`              | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(ModulePermissions.EDIT, resource_param="module_id")`  | Equivalent access; adding issues to module = module:edit |
| `create_issue_modules` | `POST .../issues/<issue_id>/modules/`               | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(ModulePermissions.EDIT, resource_param="project_id")` | Equivalent; uses project_id (no module_id in URL)        |
| `destroy`              | `DELETE .../modules/<module_id>/issues/<issue_id>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(ModulePermissions.EDIT, resource_param="module_id")`  | Equivalent access; removing issues = module:edit         |

### ModuleArchiveUnarchiveEndpoint

**File:** `apps/api/plane/app/views/module/archive.py`

| Method   | URL Pattern                               | Old Permission                                   | New Permission                                                | Differences                                                         |
| -------- | ----------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| `get`    | `GET .../archived-modules/[<pk>/]`        | `permission_classes = [ProjectEntityPermission]` | `@can(ModulePermissions.VIEW, resource_param="project_id")`   | Commenter/guest lose access (no module:view); matches cycle pattern |
| `post`   | `POST .../modules/<module_id>/archive/`   | `permission_classes = [ProjectEntityPermission]` | `@can(ModulePermissions.ARCHIVE, resource_param="module_id")` | New `module:archive` action added to definitions + contributor role |
| `delete` | `DELETE .../modules/<module_id>/archive/` | `permission_classes = [ProjectEntityPermission]` | `@can(ModulePermissions.ARCHIVE, resource_param="module_id")` | New `module:archive` action added to definitions + contributor role |

### WorkspaceStickyViewSet

**File:** `apps/api/plane/app/views/workspace/sticky.py`

| Method           | URL Pattern                                | Old Permission                                             | New Permission                                                   | Differences                                                                                   |
| ---------------- | ------------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `create`         | `POST /workspaces/<slug>/stickies/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now checks `workspace:view` permission via tuple lookup instead of role list                  |
| `list`           | `GET /workspaces/<slug>/stickies/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Same behavior — queryset filters to owner's stickies                                          |
| `retrieve`       | `GET /workspaces/<slug>/stickies/<pk>/`    | **None** (no decorator)                                    | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | **NEW** — adds missing workspace membership check (was unprotected)                           |
| `partial_update` | `PATCH /workspaces/<slug>/stickies/<pk>/`  | `@allow_permission([], creator=True, model=Sticky)`        | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Creator check removed — queryset `owner_id` filter provides equivalent access control via 404 |
| `destroy`        | `DELETE /workspaces/<slug>/stickies/<pk>/` | `@allow_permission([], creator=True, model=Sticky)`        | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Creator check removed — queryset `owner_id` filter provides equivalent access control via 404 |

### ProjectViewSet

**File:** `apps/api/plane/app/views/project/base.py`

| Method           | URL Pattern                                 | Old Permission                                                                         | New Permission                                                                                                          | Differences                                                                                                                                                             |
| ---------------- | ------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/`          | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")`          | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`                                                        | Now checks `workspace:view` permission; queryset filtering uses `permission_engine.check()` + `get_accessible_resources()` instead of `WorkspaceMember.role` checks     |
| `list_detail`    | `GET /workspaces/<slug>/projects/` (detail) | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")`          | `@can(ProjectPermissions.BROWSE, resource_param="workspace_id")`                                                        | Guest blocked (no `project:browse`); queryset filtering uses permission engine instead of role checks; teamspace access via `get_accessible_resources()` link relations |
| `retrieve`       | `GET /workspaces/<slug>/projects/<pk>/`     | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` + inline | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` + inline `has_permission(ProjectPermissions.VIEW, pk)` | Workspace-level gate + inline project check preserves differentiated 403 (secret) / 409 (public, not a member) responses for FE "join project" flow                     |
| `create`         | `POST /workspaces/<slug>/projects/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`                      | `@can(ProjectPermissions.CREATE, resource_param="workspace_id")`                                                        | WS member loses access (intentional — only admin/owner can create projects)                                                                                             |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<pk>/`   | Manual `is_workspace_admin OR is_project_admin` check                                  | `@can(ProjectPermissions.EDIT, resource_param="pk")`                                                                    | Replaces manual permission checks; project admin + workspace admin (via `project:*` inheritance)                                                                        |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<pk>/`  | Manual `is_workspace_admin OR is_project_admin` check                                  | `@can(ProjectPermissions.DELETE, resource_param="pk")`                                                                  | Replaces manual permission checks; project admin + workspace admin (via `project:*` inheritance)                                                                        |

**Access changes:**

- **`create`**: WS member (role 15) loses access — only admin/owner can create projects (intentional tightening)
- **`list_detail`**: WS guest blocked — no `project:browse` permission in guest role
- **`retrieve`**: Preserves differentiated 403 (secret) / 409 (public) via workspace-level `@can` gate + inline `has_permission()` check

**Additional changes:**

- Added `PermissionMixin` to class hierarchy and `workspace_id` property
- Removed `get_teamspace_project_ids()` method — `get_accessible_resources()` handles teamspace via link relations
- Restored `ProjectNetwork` import (needed for inline 403/409 check in `retrieve()`); replaced `Q(network=2)` magic numbers with `Q(network=ProjectNetwork.PUBLIC.value)`
- `ROLE` import preserved (still needed for data writes in `create()` and by `DeployBoardViewSet`)

### ProjectArchiveUnarchiveEndpoint

**File:** `apps/api/plane/app/views/project/base.py`

| Method   | URL Pattern                                                          | Old Permission                                 | New Permission                                                  | Differences                                                                                                                                        |
| -------- | -------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/archive-unarchive/`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(ProjectPermissions.ARCHIVE, resource_param="project_id")` | Contributors (old MEMBER, level 15) lose archive access — only project admin has `project:archive`; WS admin/owner retain via `project:*` wildcard |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/archive-unarchive/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(ProjectPermissions.ARCHIVE, resource_param="project_id")` | Same as `post` — intentional tightening, archiving a project is a significant action                                                               |

**Additional changes:**

- Added `workspace_id` property (needed for `@can` decorator's resource resolution)
- `allow_permission` import removed from file (no longer used by any class)

### ProjectIdentifierEndpoint

**File:** `apps/api/plane/app/views/project/base.py`

| Method   | URL Pattern                                      | Old Permission                                                    | New Permission                                                   | Differences                                                                                                        |
| -------- | ------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `get`    | `GET /workspaces/<slug>/project-identifiers/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` | `@can(ProjectPermissions.CREATE, resource_param="workspace_id")` | WS member (role 15) loses access — only owner/admin have `project:create`; consistent with `ProjectViewSet.create` |
| `delete` | `DELETE /workspaces/<slug>/project-identifiers/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` | `@can(ProjectPermissions.CREATE, resource_param="workspace_id")` | Same as `get` — identifier management is part of project creation flow                                             |

**Additional changes:**

- Added `workspace_id` property (resolves from `request.workspace_id` since URL has `<slug>`, not `<workspace_id>`)

### ProjectUserViewsEndpoint

**File:** `apps/api/plane/app/views/project/base.py`

| Method | URL Pattern                                                    | Old Permission                                   | New Permission                                               | Differences                                                                                       |
| ------ | -------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/project-views/` | Manual `ProjectMember.objects.filter(...)` + 403 | `@can(ProjectPermissions.VIEW, resource_param="project_id")` | Replaces inline membership check; any user with project view access can set their own preferences |

**Additional changes:**

- Removed manual `if project_member is None` → 403 guard (decorator handles authorization)
- Kept `ProjectMember` query — still needed to read/update `view_props`, `default_props`, `preferences`, `sort_order`

### ProjectFavoritesViewSet

**File:** `apps/api/plane/app/views/project/base.py`

| Method    | URL Pattern                                                      | Old Permission    | New Permission                                                   | Differences                                                                                     |
| --------- | ---------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `list`    | `GET /workspaces/<slug>/user-favorite-projects/`                 | `IsAuthenticated` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Adds workspace membership check; queryset already scoped by `user=request.user`                 |
| `create`  | `POST /workspaces/<slug>/user-favorite-projects/`                | `IsAuthenticated` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Adds workspace membership check; project_id comes from request body, not URL                    |
| `destroy` | `DELETE /workspaces/<slug>/user-favorite-projects/<project_id>/` | `IsAuthenticated` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Workspace-level check (not project-level) so users removed from a project can still un-favorite |

**Additional changes:**

- Added explicit `list` method override to attach `@can` decorator (delegates to `super().list()`)
- Workspace-level permission used intentionally — favorites are personal, user-scoped operations

### DeployBoardViewSet

**File:** `apps/api/plane/app/views/project/base.py`

| Method           | URL Pattern                                                                   | Old Permission                          | New Permission                                                  | Differences                                                                    |
| ---------------- | ----------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/project-deploy-boards/`         | `ProjectMemberPermission` (class-level) | `@can(ProjectPermissions.VIEW, resource_param="project_id")`    | Method-level decorator; any project member can view deploy board settings      |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/project-deploy-boards/`        | `ProjectMemberPermission` (class-level) | `@can(ProjectPermissions.PUBLISH, resource_param="project_id")` | Permission narrowed from `project:edit` to `project:publish`                   |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/project-deploy-boards/<pk>/`    | `ProjectMemberPermission` (class-level) | `@can(ProjectPermissions.VIEW, resource_param="project_id")`    | Explicit override added to attach decorator; delegates to `super().retrieve()` |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/project-deploy-boards/<pk>/`  | `ProjectMemberPermission` (class-level) | `@can(ProjectPermissions.PUBLISH, resource_param="project_id")` | Permission narrowed from `project:edit` to `project:publish`                   |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/project-deploy-boards/<pk>/` | `ProjectMemberPermission` (class-level) | `@can(ProjectPermissions.PUBLISH, resource_param="project_id")` | Permission narrowed from `project:edit` to `project:publish`                   |

**Additional changes:**

- Removed `permission_classes = [ProjectMemberPermission]` (replaced by per-method `@can` decorators)
- Removed `ProjectMemberPermission` from file imports (no longer used by any class in this file)
- `ROLE` import preserved (still needed by `ProjectViewSet.create()`)

### StateViewSet

**File:** `apps/api/plane/app/views/state/base.py`

| Method            | URL Pattern                                                                  | Old Permission                                             | New Permission                                               | Differences                                                                                               |
| ----------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `list`            | `GET /workspaces/<slug>/projects/<project_id>/states/`                       | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(StatePermissions.VIEW, resource_param="project_id")`   | Equivalent after grant fix (guest retains access via `StatePermissions.VIEW` added to guest role)         |
| `create`          | `POST /workspaces/<slug>/projects/<project_id>/states/`                      | `@allow_permission([ROLE.ADMIN])`                          | `@can(StatePermissions.CREATE, resource_param="project_id")` | Same — only admin has `state:create` (via `state:*` wildcard)                                             |
| `partial_update`  | `PATCH /workspaces/<slug>/projects/<project_id>/states/<pk>/`                | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(StatePermissions.EDIT, resource_param="project_id")`   | **Narrows**: contributor+commenter+guest lose edit — only admin has `state:edit` (via `state:*` wildcard) |
| `mark_as_default` | `POST /workspaces/<slug>/projects/<project_id>/states/<pk>/mark-as-default/` | `@allow_permission([ROLE.ADMIN])`                          | `@can(StatePermissions.EDIT, resource_param="project_id")`   | Same — only admin has `state:edit` (via `state:*` wildcard)                                               |
| `destroy`         | `DELETE /workspaces/<slug>/projects/<project_id>/states/<pk>/`               | `@allow_permission([ROLE.ADMIN])`                          | `@can(StatePermissions.DELETE, resource_param="project_id")` | Same — only admin has `state:delete` (via `state:*` wildcard)                                             |

### IntakeStateEndpoint

**File:** `apps/api/plane/app/views/state/base.py`

| Method | URL Pattern                                                   | Old Permission                                             | New Permission                                             | Differences                                                                                       |
| ------ | ------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/intake-states/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(StatePermissions.VIEW, resource_param="project_id")` | Equivalent after grant fix (guest retains access via `StatePermissions.VIEW` added to guest role) |

**Role grant fix (`state:view` for project guest):**

- `StateViewSet.list` and `IntakeStateEndpoint.get` check `state:view` via `@can(StatePermissions.VIEW, ...)`. Project guest was missing `StatePermissions.VIEW` in `system_roles.py` — the old `@allow_permission` included `ROLE.GUEST` explicitly. Fixed by adding `StatePermissions.VIEW` to the guest role permissions list.

### IssueViewViewSet

**File:** `apps/api/plane/app/views/view/base.py`

| Method           | URL Pattern                                                   | Old Permission                                                   | New Permission                                                                  | Differences                                                                             |
| ---------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/views/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`       | `@can(WorkitemViewPermissions.VIEW, resource_param="project_id")`               | Equivalent after grant fix; `guest_view_all_features` block removed                     |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/views/`        | **None** (security gap)                                          | `@can(WorkitemViewPermissions.CREATE, resource_param="project_id")`             | **Security fix**: was unprotected; now admin + contributor only                         |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/views/<pk>/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`       | `@can(WorkitemViewPermissions.VIEW, resource_param="project_id")`               | Same as `list`; `guest_view_all_features` block removed                                 |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/views/<pk>/`  | `@allow_permission([], creator=True, model=IssueView)`           | `@can(WorkitemViewPermissions.EDIT, resource_param="pk", creator_only=True)`    | **Security fix**: creator must have active membership; inline `owned_by` check removed  |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/views/<pk>/` | `@allow_permission([ROLE.ADMIN], creator=True, model=IssueView)` | `@can(WorkitemViewPermissions.DELETE, resource_param="pk", allow_creator=True)` | **Security fix**: creator must have active membership; inline admin/owner check removed |

**Resource type rename (`VIEW` → `WORKITEM_VIEW`):**

- `ResourceType.VIEW` renamed to `ResourceType.WORKITEM_VIEW` to avoid confusing `view:view` permission strings
- Permission class: `ViewPermissions` → `WorkitemViewPermissions`
- Wildcard strings: `"view:*"` → `"workitem_view:*"` in WS admin + P-admin roles
- No data migration needed — no `ResourcePermission` rows existed with `resource_type="view"`

**Role grant fix (`workitem_view:view` for commenter):**

- `IssueViewViewSet.list` and `.retrieve` check `workitem_view:view` via `@can(WorkitemViewPermissions.VIEW, ...)`. Commenter was missing `WorkitemViewPermissions.VIEW` in `system_roles.py` — guest (level 5) already had it, but commenter (level 10) did not. Parity fix: added `WorkitemViewPermissions.VIEW` to commenter role.

**URL fix:**

- Removed `"put": "update"` from the detail URL pattern. The FE only uses PATCH (`patchView()`), and there was no explicit `update` method — this closes a security gap where the implicit `ModelViewSet.update()` was unprotected.

**Post-migration cleanup:**

- **`list`**: Removed `guest_view_all_features` + teamspace member check block and `Project.objects.get()`. Queryset filter `Q(owned_by=self.request.user) | Q(access=1)` in `get_queryset()` limits visibility.
- **`retrieve`**: Removed `guest_view_all_features` + teamspace member check block, `Project.objects.get()`, and 403 response. Queryset filter handles visibility.
- **`partial_update`**: Removed inline `owned_by` check. `creator_only=True` on `@can` handles this. Kept `is_locked` check (business logic).
- **`destroy`**: Removed inline `ProjectMember` admin check and `owned_by` check. `allow_creator=True` on `@can` handles both admin access (via wildcard) and creator access. Kept cleanup code for `UserFavorite`, `UserRecentVisit`, and `DeployBoard`.

### WorkspaceViewViewSet

**File:** `apps/api/plane/app/views/view/base.py`

| Method           | URL Pattern                             | Old Permission                                                                | New Permission                                                                           | Differences                                                                                       |
| ---------------- | --------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/views/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspaceWorkitemViewPermissions.VIEW, resource_param="workspace_id")`             | Guest filter replaced: old `role=5` check → inline `has_permission(CREATE)` check                 |
| `create`         | `POST /workspaces/<slug>/views/`        | **None** (security gap — implicit via `perform_create`)                       | `@can(WorkspaceWorkitemViewPermissions.CREATE, resource_param="workspace_id")`           | **Security fix**: was unprotected; now owner + admin + member only                                |
| `retrieve`       | `GET /workspaces/<slug>/views/<pk>/`    | **None** (no decorator)                                                       | `@can(WorkspaceWorkitemViewPermissions.VIEW, resource_param="workspace_id")`             | **Security fix**: was unprotected; now requires workspace membership                              |
| `partial_update` | `PATCH /workspaces/<slug>/views/<pk>/`  | `@allow_permission([], creator=True, model=IssueView)`                        | `@can(WorkspaceWorkitemViewPermissions.EDIT, resource_param="pk", creator_only=True)`    | **Security fix**: creator must have active workspace membership; inline `owned_by` check removed  |
| `destroy`        | `DELETE /workspaces/<slug>/views/<pk>/` | `@allow_permission([ROLE.ADMIN], creator=True, model=IssueView)`              | `@can(WorkspaceWorkitemViewPermissions.DELETE, resource_param="pk", allow_creator=True)` | **Security fix**: creator must have active workspace membership; inline admin/owner check removed |

**Role grant additions:**

| Role      | Permission Added                          | Rationale                                              |
| --------- | ----------------------------------------- | ------------------------------------------------------ |
| WS member | `WorkspaceWorkitemViewPermissions.VIEW`   | Old: ADMIN+MEMBER+GUEST could list/retrieve            |
| WS member | `WorkspaceWorkitemViewPermissions.CREATE` | Old: create was unprotected (all members could create) |
| WS guest  | `WorkspaceWorkitemViewPermissions.VIEW`   | Old: guests could list (filtered to own views)         |

**Inline permission check (data-level filter):** `list` is protected by `@can(VIEW)` for access, but also checks `has_permission(CREATE)` inline to determine visibility. Users without `workspace_workitem_view:create` (i.e., workspace guests) only see views they own. This replaces the old `WorkspaceMember.objects.filter(role=5)` inline check.

**URL fix:**

- Removed `"put": "update"` from the workspace view detail URL pattern. No `update` method existed — this exposed the unprotected implicit `ModelViewSet.update()`.

**Post-migration cleanup:**

- **`partial_update`**: Removed inline `owned_by` check. `creator_only=True` on `@can` handles this. Kept `is_locked` check (business logic).
- **`destroy`**: Removed inline `WorkspaceMember` admin check and `owned_by` conditional. `allow_creator=True` on `@can` handles both admin access (via wildcard) and creator access.
- Removed `WorkspaceMember` from file imports (no longer used by any class in `WorkspaceViewViewSet`).

### IssueViewFavoriteViewSet

**File:** `apps/api/plane/app/views/view/base.py`

| Method    | URL Pattern                                                                      | Old Permission                                 | New Permission                                                      | Differences                                                             |
| --------- | -------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `list`    | `GET /workspaces/<slug>/projects/<project_id>/user-favorite-views/`              | **None** (no decorator)                        | `@can(WorkitemViewPermissions.VIEW, resource_param="project_id")`   | **Security fix**: adds project membership check where none existed      |
| `create`  | `POST /workspaces/<slug>/projects/<project_id>/user-favorite-views/`             | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(WorkitemViewPermissions.CREATE, resource_param="project_id")` | Parity: admin + contributor only                                        |
| `destroy` | `DELETE /workspaces/<slug>/projects/<project_id>/user-favorite-views/<view_id>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(WorkitemViewPermissions.CREATE, resource_param="project_id")` | Parity: admin + contributor only; uses CREATE (same gate as favoriting) |

**Notes:**

- `list` had no permission decorator — any authenticated user could call it. Now requires `workitem_view:view` (project membership check). Queryset is user-scoped (`user=request.user`), so it returns empty for users without favorites.
- `create`/`destroy` use `WorkitemViewPermissions.CREATE` (not VIEW) because old code excluded GUEST — only ADMIN + MEMBER could favorite/unfavorite. `workitem_view:create` is granted to admin + contributor only.
- All operations are user-scoped — no cross-user risk.
- Import cleanup: removed `allow_permission` and `ROLE` from file imports (last usage in this file).

### BulkEstimatePointEndpoint

**File:** `apps/api/plane/app/views/estimate/base.py`

| Method           | URL Pattern                                                       | Old Permission                                   | New Permission                                                  | Differences                                                                                        |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/estimates/`         | `permission_classes = [ProjectEntityPermission]` | `@can(EstimatePermissions.VIEW, resource_param="project_id")`   | Equivalent after grant fix (guest retains view via `EstimatePermissions.VIEW` added to guest role) |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/estimates/`        | `permission_classes = [ProjectEntityPermission]` | `@can(EstimatePermissions.CREATE, resource_param="project_id")` | **Narrows**: contributor loses create (admin-only settings)                                        |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/estimates/<id>/`    | `permission_classes = [ProjectEntityPermission]` | `@can(EstimatePermissions.VIEW, resource_param="project_id")`   | Equivalent after grant fix (same as `list`)                                                        |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/estimates/<id>/`  | `permission_classes = [ProjectEntityPermission]` | `@can(EstimatePermissions.EDIT, resource_param="project_id")`   | **Narrows**: contributor loses edit (admin-only settings)                                          |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/estimates/<id>/` | `permission_classes = [ProjectEntityPermission]` | `@can(EstimatePermissions.DELETE, resource_param="project_id")` | **Narrows**: contributor loses delete (admin-only settings)                                        |

**Additional changes:**

- Removed `permission_classes = [ProjectEntityPermission]` — replaced by per-method `@can` decorators
- `@invalidate_cache` retained as outermost decorator on `create`, `partial_update`, `destroy`

**Role grant fix (`estimate:view` for project guest):**

`BulkEstimatePointEndpoint.list` and `.retrieve` check `estimate:view` via `@can(EstimatePermissions.VIEW, ...)`. Project guest was missing `EstimatePermissions.VIEW` in `system_roles.py` — the old `ProjectEntityPermission` allowed all project members (including guest) for GET. Fixed by adding `EstimatePermissions.VIEW` to the guest role permissions list.

### EstimatePointEndpoint

**File:** `apps/api/plane/app/views/estimate/base.py`

| Method           | URL Pattern                                                                                  | Old Permission                                 | New Permission                                                  | Differences                                                 |
| ---------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/estimates/<id>/estimate-points/`              | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(EstimatePermissions.CREATE, resource_param="project_id")` | **Narrows**: contributor loses create (admin-only settings) |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/estimates/<id>/estimate-points/<point_id>/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(EstimatePermissions.EDIT, resource_param="project_id")`   | **Narrows**: contributor loses edit (admin-only settings)   |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/estimates/<id>/estimate-points/<point_id>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(EstimatePermissions.DELETE, resource_param="project_id")` | **Narrows**: contributor loses delete (admin-only settings) |

### ProjectEstimatePointEndpoint — UNUSED

**File:** `apps/api/plane/app/views/estimate/base.py`

**Status:** URL commented out in `apps/api/plane/app/urls/estimate.py`. Not called by the frontend. Class annotated with TODO comment for future `@can` migration if re-enabled.

### NotificationViewSet

**File:** `apps/api/plane/app/views/notification/base.py`

| Method           | URL Pattern                                             | Old Permission                                                                | New Permission                                                   | Differences                                                                  |
| ---------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/notifications/`                 | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now checks `workspace:view` permission via tuple lookup instead of role list |
| `partial_update` | `PATCH /workspaces/<slug>/notifications/<pk>/`          | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Same behavior — queryset filters to receiver=request.user                    |
| `mark_read`      | `POST /workspaces/<slug>/notifications/<pk>/read/`      | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Same behavior                                                                |
| `mark_unread`    | `POST /workspaces/<slug>/notifications/<pk>/unread/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Same behavior                                                                |
| `archive`        | `POST /workspaces/<slug>/notifications/<pk>/archive/`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Same behavior                                                                |
| `unarchive`      | `DELETE /workspaces/<slug>/notifications/<pk>/archive/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Same behavior                                                                |
| `retrieve`       | `GET /workspaces/<slug>/notifications/<pk>/`            | **None** (inherited from BaseViewSet)                                         | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | **Security fix**: adds workspace membership check where none existed         |
| `destroy`        | `DELETE /workspaces/<slug>/notifications/<pk>/`         | **None** (inherited from BaseViewSet)                                         | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | **Security fix**: adds workspace membership check where none existed         |

**Notes:**

- Notifications are workspace-scoped and user-personal — all queries filter to `receiver=request.user`
- All workspace roles (owner, admin, member, guest) have `workspace:view` — this is purely a workspace membership gate
- `retrieve` and `destroy` had no decorator — inherited from `BaseViewSet` without permission checks. Adding `@can` fixes this security gap.
- **Data-level filter (inline check):** `list` (lines 147–153) checks `WorkspaceMember.role__lt=15` to exclude workspace guests from "created" type notifications. This is a business logic filter, not a permission gate — it stays as-is. The inline check uses `WorkspaceMember.role` directly, not the permission engine.

### UnreadNotificationEndpoint

**File:** `apps/api/plane/app/views/notification/base.py`

| Method | URL Pattern                                    | Old Permission                                                                | New Permission                                                   | Differences                                                                  |
| ------ | ---------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/notifications/unread/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now checks `workspace:view` permission via tuple lookup instead of role list |

### MarkAllReadNotificationViewSet

**File:** `apps/api/plane/app/views/notification/base.py`

| Method   | URL Pattern                                            | Old Permission                                                                | New Permission                                                   | Differences                                                                  |
| -------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `create` | `POST /workspaces/<slug>/notifications/mark-all-read/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now checks `workspace:view` permission via tuple lookup instead of role list |

**Data-level filter (inline check):** `create` (lines 322–328) checks `WorkspaceMember.role__lt=15` to exclude workspace guests from "created" type notifications when marking all as read. Same business logic filter as `NotificationViewSet.list`.

### UserProjectJoinEndpoint (extracted from UserProjectInvitationsViewset)

**File:** `apps/api/plane/app/views/project/invite.py`

| Method | URL Pattern                                       | Old Permission                                                    | New Permission                                                   | Differences                                                                                          |
| ------ | ------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `post` | `POST /users/me/workspaces/<slug>/projects/join/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` | `@can(ProjectPermissions.BROWSE, resource_param="workspace_id")` | Equivalent: WS owner/admin/member retain; WS guest excluded. Refactored from ViewSet to BaseAPIView. |

**Additional changes:**

- Extracted from `UserProjectInvitationsViewset.create` into new `UserProjectJoinEndpoint` (BaseAPIView)
- Dropped unused GET route (`UserProjectInvitationsViewset.list`)
- URL name changed from `user-project-invitations` to `user-project-join`
- Unused viewsets (`ProjectInvitationsViewset`, `UserProjectInvitationsViewset`) annotated with TODO comments for future migration

### InboxViewSet

**File:** `apps/api/plane/ee/views/app/inbox/base.py`

| Method           | URL Pattern                                | Old Permission                                                                | New Permission                                                   | Differences                                                                  |
| ---------------- | ------------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `partial_update` | `PATCH /workspaces/<slug>/inbox/`          | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now checks `workspace:view` permission via tuple lookup instead of role list |
| `mark_read`      | `POST /workspaces/<slug>/inbox/read/`      | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Same behavior                                                                |
| `mark_unread`    | `DELETE /workspaces/<slug>/inbox/read/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Same behavior                                                                |
| `archive`        | `POST /workspaces/<slug>/inbox/archive/`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Same behavior                                                                |
| `unarchive`      | `DELETE /workspaces/<slug>/inbox/archive/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Same behavior                                                                |

**Notes:**

- Inbox is workspace-scoped and user-personal — all queries filter to `receiver=request.user`
- All workspace roles (owner, admin, member, guest) have `workspace:view` — this is purely a workspace membership gate
- `partial_update`, `mark_read`, and `mark_unread` also have `@check_feature_flag(FeatureFlag.INBOX_STACKING)` as outermost decorator — preserved as-is
- No security fixes needed — all methods had `@allow_permission` decorators
- No data-level filters or inline permission checks

### IntakeViewSet — UNUSED

**File:** `apps/api/plane/app/views/intake/base.py`

**Status:** URL patterns commented out in `apps/api/plane/app/urls/intake.py`.
Not called by the frontend. Class annotated with TODO comment for future `@can`
migration if re-enabled.

**Note:** `retrieve` and `partial_update` are inherited from `BaseViewSet` without
permission decorators — latent security gap (same as NotificationViewSet pre-migration).
Must add `@can` when re-enabling.

### IntakeIssueViewSet

**File:** `apps/api/plane/app/views/intake/base.py`

| Method           | URL Pattern                                                                 | Old Permission                                                 | New Permission                                          | Differences                                                                                                     |
| ---------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/intake-issues/`               | `@can(IntakePermissions.CREATE)` + inline VIEW check           | `@can(IntakePermissions.VIEW, defer_conditions=True)`   | Proper VIEW gate; Guest sees own items via defer                                                                |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/intake-issues/`              | `@can(IntakePermissions.CREATE)`                               | `@can(IntakePermissions.SUBMIT)`                        | Uses SUBMIT (was CREATE)                                                                                        |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/intake-issues/<pk>/`          | `@can(IntakePermissions.CREATE)` + inline VIEW check           | `@can(IntakePermissions.VIEW, defer_conditions=True)`   | Guest creator-only via defer                                                                                    |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/intake-issues/<pk>/`        | `@can(IntakePermissions.CREATE)` + inline EDIT/creator check   | `@can(IntakePermissions.EDIT, defer_conditions=True)`   | Creator whitelist expanded; status changes gated by inline `intake:manage` check (403 instead of silent ignore) |
| `update_status`  | `PATCH /workspaces/<slug>/projects/<project_id>/intake-issues/<pk>/status/` | (inline in partial_update, silently ignored for non-admin)     | `@can(IntakePermissions.MANAGE)`                        | **NEW endpoint**. Admin-only. Proper 403 for non-admin                                                          |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/intake-issues/<pk>/`       | `@can(IntakePermissions.CREATE)` + inline DELETE/creator check | `@can(IntakePermissions.DELETE, defer_conditions=True)` | Creator-only via defer for non-admin                                                                            |

> **Data-level filter (list):** `intake:view+creator` deferred condition filters queryset to `created_by=request.user` for Guest role.
> **Data-level filter (partial_update):** `intake:edit+creator` deferred condition applies field whitelist (name, description, priority, dates, labels, assignees) and verifies Issue creator.
> **Role grant changes:** Added `intake:edit+creator`, `intake:delete+creator` to Contributor, Commenter, Guest. Added `intake:view+creator` to Guest. Changed Guest `intake:view` from absent to `+creator`.

### IntakeWorkItemDescriptionVersionEndpoint

**File:** `apps/api/plane/app/views/intake/base.py`

| Method | URL Pattern                                                   | Old Permission                              | New Permission                                                                   | Differences                                                                                 |
| ------ | ------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `get`  | `GET /intake-work-items/<work_item_id>/description-versions/` | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(IssuePermissions.VIEW, resource_param="work_item_id", allow_creator=True)` | Matches WorkItemDescriptionVersionEndpoint pattern; `guest_view_all_features` check removed |

### WebhookEndpoint / WebhookSecretRegenerateEndpoint / WebhookLogsEndpoint

**File:** `apps/api/plane/app/views/webhook/base.py`

| Method              | URL Pattern                                | Old Permission                                  | New Permission                                                   | Differences                        |
| ------------------- | ------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `post`              | `POST /webhooks/`                          | `@allow_permission([ADMIN], level="WORKSPACE")` | `@can(WebhookPermissions.CREATE, resource_param="workspace_id")` | Direct mapping                     |
| `get`               | `GET /webhooks/` and `GET /webhooks/<pk>/` | same                                            | `@can(WebhookPermissions.VIEW, resource_param="workspace_id")`   | Direct mapping                     |
| `patch`             | `PATCH /webhooks/<pk>/`                    | same                                            | `@can(WebhookPermissions.EDIT, resource_param="workspace_id")`   | Direct mapping                     |
| `delete`            | `DELETE /webhooks/<pk>/`                   | same                                            | `@can(WebhookPermissions.DELETE, resource_param="workspace_id")` | Direct mapping                     |
| `post` (regenerate) | `POST /webhooks/<pk>/regenerate/`          | same                                            | `@can(WebhookPermissions.EDIT, resource_param="workspace_id")`   | Secret regeneration mapped to edit |
| `get` (logs)        | `GET /webhook-logs/<webhook_id>/`          | same                                            | `@can(WebhookPermissions.VIEW, resource_param="workspace_id")`   | Direct mapping                     |

**Grant change:** Added `"webhook:*"` to workspace admin role in `system_roles.py`. Required for parity — old `ROLE.ADMIN` at workspace level included both WS Owner and WS Admin.

### QuickLinkViewSet

**File:** `apps/api/plane/app/views/workspace/quick_link.py`

| Method           | URL Pattern                 | Old Permission                                                 | New Permission                                                   | Differences                           |
| ---------------- | --------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| `create`         | `POST /quick-links/`        | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping — user-scoped resource |
| `list`           | `GET /quick-links/`         | same                                                           | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping                        |
| `retrieve`       | `GET /quick-links/<pk>/`    | same                                                           | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping                        |
| `partial_update` | `PATCH /quick-links/<pk>/`  | same                                                           | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping                        |
| `destroy`        | `DELETE /quick-links/<pk>/` | same                                                           | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping                        |

### UserRecentVisitViewSet

**File:** `apps/api/plane/app/views/workspace/recent_visit.py`

| Method | URL Pattern           | Old Permission                                                 | New Permission                                                   | Differences                           |
| ------ | --------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| `list` | `GET /recent-visits/` | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping — user-scoped resource |

### WorkspaceHomePreferenceViewSet

**File:** `apps/api/plane/app/views/workspace/home.py`

| Method  | URL Pattern                      | Old Permission                                                 | New Permission                                                   | Differences                           |
| ------- | -------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| `get`   | `GET /home-preferences/`         | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping — user-scoped resource |
| `patch` | `PATCH /home-preferences/<key>/` | same                                                           | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping — user-scoped resource |

### WorkspaceUserPreferenceViewSet

**File:** `apps/api/plane/app/views/workspace/user_preference.py`

| Method  | URL Pattern                   | Old Permission                                                 | New Permission                                                   | Differences                           |
| ------- | ----------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| `get`   | `GET /sidebar-preferences/`   | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping — user-scoped resource |
| `patch` | `PATCH /sidebar-preferences/` | same                                                           | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping — user-scoped resource |

### EpicViewSet

**File:** `apps/api/plane/ee/views/app/epic/base.py`

| Method           | URL Pattern                                                   | Old Permission                                                         | New Permission                                                          | Differences                                                                                                                                        |
| ---------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/epics/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`                         | `@can(EpicPermissions.CREATE, resource_param="project_id")`             | Now checks `epic:create` permission. Admin + Contributor retain access. Exact parity.                                                              |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/epics/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`                         | `@can(EpicPermissions.VIEW, resource_param="project_id")`               | Now checks `epic:view` permission. Admin + Contributor retain access. Exact parity.                                                                |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/epics/<pk>/`    | `@allow_permission([ADMIN, MEMBER, GUEST], creator=True, model=Issue)` | `@can(EpicPermissions.VIEW, resource_param="pk", allow_creator=True)`   | Commenter/Guest now restricted to own epics via `allow_creator=True`. Old: all roles could view any epic. Intentional tightening — see note below. |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/epics/<pk>/`  | `@allow_permission([ADMIN, MEMBER], creator=True, model=Issue)`        | `@can(EpicPermissions.EDIT, resource_param="pk", allow_creator=True)`   | Same behavior: Admin + Contributor by role, creators with active membership. P0 fix: creator bypass now checks membership first.                   |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/epics/<pk>/` | `@allow_permission([ROLE.ADMIN], creator=True, model=Issue)`           | `@can(EpicPermissions.DELETE, resource_param="pk", allow_creator=True)` | Admin by role; Contributor/Commenter/Guest if creator with active membership. P0 fix: creator bypass now checks membership first.                  |
| `epic_status`    | `POST /workspaces/<slug>/projects/<project_id>/epic-status/`  | `@allow_permission([ROLE.ADMIN])`                                      | `@can(ProjectPermissions.MANAGE, resource_param="project_id")`          | Admin-only project config action. `project:manage` granted only to P-Admin. Exact parity.                                                          |

**`retrieve` behavioral change:** Old decorator `[ADMIN, MEMBER, GUEST]` allowed all project members to view any epic, with `creator=True` as an additional non-member fallback. New `EpicPermissions.VIEW` is granted only to Admin + Contributor. Commenter/Guest can only view epics they created via `allow_creator=True`. Since `list` also excludes Commenter/Guest, they can't discover epics in the UI — the only path to `retrieve` would be a direct URL. This is an intentional tightening, not a regression.

### Epic Resource Type — Grant Additions

Added `Action.COMMENT` and `Action.REACT` to `RESOURCE_ACTIONS[ResourceType.EPIC]` in `definitions.py`, auto-generating `EpicPermissions.COMMENT` and `EpicPermissions.REACT`.

**Role grant changes in `system_roles.py`:**

| Role        | `epic:comment` | `epic:react` | Via                   |
| ----------- | -------------- | ------------ | --------------------- |
| Admin       | ✅             | ✅           | `epic:*` wildcard     |
| Contributor | ✅             | ✅           | Explicit grants added |
| Commenter   | ❌             | ❌           | No epic access        |
| Guest       | ❌             | ❌           | No epic access        |

### EpicCommentViewSet

**File:** `apps/api/plane/ee/views/app/epic/comment.py`

| Method           | URL Pattern                                                                      | Old Permission                                                      | New Permission                                                             | Differences                                                                                  |
| ---------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/comments/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`          | `@can(EpicPermissions.COMMENT, resource_param="epic_id")`                  | Dead `guest_view_all_features` block removed; now checks `epic:comment` permission from role |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/comments/<pk>/`  | `@allow_permission([ROLE.ADMIN], creator=True, model=IssueComment)` | `@can(CommentPermissions.EDIT, resource_param="pk", allow_creator=True)`   | **Security fix**: creator must still be project member                                       |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/comments/<pk>/` | `@allow_permission([ROLE.ADMIN], creator=True, model=IssueComment)` | `@can(CommentPermissions.DELETE, resource_param="pk", allow_creator=True)` | **Security fix**: creator must still be project member                                       |

**Post-migration cleanup:**

- **`create`**: Removed dead `guest_view_all_features` block (lines 75-92). `@can(EpicPermissions.COMMENT, resource_param="epic_id")` blocks guests entirely — the block was unreachable. Removed unused imports: `Project`, `Issue` from `plane.db.models`, and `check_if_current_user_is_teamspace_member` from `plane.ee.utils`.

### EpicReactionViewSet

**File:** `apps/api/plane/ee/views/app/epic/reaction.py`

| Method    | URL Pattern                                                                                  | Old Permission                                             | New Permission                                          | Differences                                                     |
| --------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| `create`  | `POST /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/reactions/`                   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicPermissions.REACT, resource_param="epic_id")` | Now checks `epic:react` permission; decorator order normalized  |
| `destroy` | `DELETE /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/reactions/<reaction_code>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicPermissions.REACT, resource_param="epic_id")` | Now checks `epic:react` permission; bug fix on `issue_id` kwarg |

**Bug fix:** `destroy` method had `self.kwargs.get("issue_id", None)` in the `issue_activity.delay()` call — URL kwarg is `epic_id`, not `issue_id`. Fixed to `self.kwargs.get("epic_id", None)`.

### EpicAttachmentEndpoint

**File:** `apps/api/plane/ee/views/app/epic/attachment.py`

| Method   | URL Pattern                                                                         | Old Permission                                                   | New Permission                                                                                           | Differences                                                                                                                         |
| -------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/attachments/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`       | `@can(AttachmentPermissions.CREATE, resource_param="project_id", scope_param_type=ResourceType.PROJECT)` | Checks `attachment:create` via project membership tuple                                                                             |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/attachments/<pk>/` | `@allow_permission([ROLE.ADMIN], creator=True, model=FileAsset)` | `@can(AttachmentPermissions.DELETE, resource_param="pk")`                                                | **Security fix**: creator must still be project member. Conditional grant `attachment:delete+creator` replaces `allow_creator=True` |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/attachments/[<pk>/]`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`       | `@can(AttachmentPermissions.VIEW, resource_param="project_id", scope_param_type=ResourceType.PROJECT)`   | Checks `attachment:view` via project membership tuple                                                                               |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/attachments/<pk>/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`       | `@can(AttachmentPermissions.EDIT, resource_param="pk")`                                                  | Checks `attachment:edit` via FileAsset→project hierarchy                                                                            |

**Decorator fix (2026-02-19):** Originally used `EpicPermissions.VIEW` with `resource_param="epic_id"` as a workaround for the model mismatch issue. Now fixed properly: collection-level ops (`post`, `get`) use `AttachmentPermissions.*` with `resource_param="project_id", scope_param_type=ResourceType.PROJECT`, which tells the engine to look up the project directly. Specific-attachment ops (`delete`, `patch`) use `resource_param="pk"` and the engine resolves `FileAsset → project_id` via hierarchy chain. Removed `EpicPermissions` import, added `ResourceType`.

### EpicActivityEndpoint

**File:** `apps/api/plane/ee/views/app/epic/activity.py`

| Method | URL Pattern                                                                | Old Permission                                                                                                | New Permission                                         | Differences                                                     |
| ------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/activities/` | `permission_classes = [ProjectEntityPermission]` + `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicPermissions.VIEW, resource_param="epic_id")` | Removed redundant `permission_classes`; Commenter/Guest blocked |

### EpicIssuesEndpoint

**File:** `apps/api/plane/ee/views/app/epic/issue.py`

| Method | URL Pattern                                                             | Old Permission                                             | New Permission                                         | Differences                                                          |
| ------ | ----------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/issues/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicPermissions.VIEW, resource_param="epic_id")` | Now checks `epic:view`; Commenter/Guest blocked                      |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/issues/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`             | `@can(EpicPermissions.EDIT, resource_param="epic_id")` | Adding child issues = editing epic; exact parity (Admin+Contributor) |

### EpicsUpdateViewSet

**File:** `apps/api/plane/ee/views/app/epic/update.py`

**New resource types:** `epic_update` and `epic_update_comment` added to `definitions.py`, `inheritance.py`, `engine.py`, `system_roles.py`.

| Method   | URL Pattern                                                                     | Old Permission                                                                     | New Permission                                                    | Differences                                                                                               |
| -------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/updates/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`                         | `@can(EpicUpdatePermissions.VIEW, resource_param="project_id")`   | Now checks `epic_update:view`; Commenter gets VIEW, Guest loses access (consistent with `epic:view`)      |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/updates/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`                                     | `@can(EpicUpdatePermissions.CREATE, resource_param="project_id")` | Exact parity (Admin+Contributor)                                                                          |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/updates/<pk>/`  | `@allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=EntityUpdates)` | `@can(EpicUpdatePermissions.EDIT, resource_param="pk")`           | **P0 fix**: creator bypass bug fixed; engine evaluates `+creator` natively via hierarchy walk + model map |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/updates/<pk>/` | `@allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=EntityUpdates)` | `@can(EpicUpdatePermissions.DELETE, resource_param="pk")`         | **P0 fix**: same creator bypass bug; Admin gets unconditional, Contributor gets `+creator` conditional    |

**Security fix:** Old `creator=True` on `@allow_permission` had a known bypass bug where the creator check could be circumvented. The `@can` migration fixes this by having the engine evaluate `+creator` conditions natively.

### EpicsUpdateCommentsViewSet

**File:** `apps/api/plane/ee/views/app/epic/update.py`

| Method | URL Pattern                                                                            | Old Permission                                             | New Permission                                                           | Differences                                                               |
| ------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/updates/<pk>/comments/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicUpdatePermissions.VIEW, resource_param="project_id")`          | Uses parent's VIEW; Guest loses access                                    |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/updates/<pk>/comments/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`             | `@can(EpicUpdateCommentPermissions.CREATE, resource_param="project_id")` | Now checks `epic_update_comment:create`; exact parity (Admin+Contributor) |

### EpicsUpdatesReactionViewSet

**File:** `apps/api/plane/ee/views/app/epic/update.py`

| Method   | URL Pattern                                                                                                      | Old Permission                                             | New Permission                                                   | Differences                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/updates/<update_id>/reactions/`                   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicUpdatePermissions.REACT, resource_param="project_id")` | Commenter/Guest lose access (consistent with `epic:react`)         |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/updates/<update_id>/reactions/<reaction_code>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicUpdatePermissions.REACT, resource_param="project_id")` | Same narrowing; own-only enforced by queryset `actor=request.user` |

**Access narrowing:**

- **VIEW** (get): Guest loses access — consistent with `EpicViewSet` where Guest has no `epic:view`
- **REACT**: Commenter/Guest lose access — consistent with `EpicReactionViewSet`

### EpicArchiveViewSet

**File:** `apps/api/plane/ee/views/app/epic/archive.py`

| Method      | URL Pattern                                                           | Old Permission                                 | New Permission                                            | Differences                                                                                      |
| ----------- | --------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `list`      | `GET /workspaces/<slug>/projects/<project_id>/archived-epics/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(EpicPermissions.VIEW, resource_param="project_id")` | Commenter/Guest still excluded — no `epic:view` grant for commenter/guest                        |
| `retrieve`  | `GET /workspaces/<slug>/projects/<project_id>/epics/<pk>/archive/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(EpicPermissions.VIEW, resource_param="pk")`         | Same access — admin (`epic:*`) + contributor (`epic:view`)                                       |
| `archive`   | `POST /workspaces/<slug>/projects/<project_id>/epics/<pk>/archive/`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(EpicPermissions.ARCHIVE, resource_param="pk")`      | New `epic:archive` action added to definitions.py; admin (`epic:*`) + contributor explicit grant |
| `unarchive` | `DELETE /workspaces/<slug>/projects/<project_id>/epics/<pk>/archive/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(EpicPermissions.ARCHIVE, resource_param="pk")`      | Same as archive — uses same `epic:archive` permission                                            |

**New permission added:**

- `Action.ARCHIVE` added to `ResourceType.EPIC` in `definitions.py`
- `EpicPermissions.ARCHIVE` granted to contributor role (unconditional) in `system_roles.py`
- Admin has access via `epic:*` wildcard

### New Resource Types: EPIC_LINK & EPIC_PROPERTY

Added two new resource types to the permission system:

**`definitions.py`:**

- `ResourceType.EPIC_LINK = "epic_link"` — actions: VIEW, CREATE, EDIT, DELETE
- `ResourceType.EPIC_PROPERTY = "epic_property"` — actions: VIEW, CREATE, EDIT, DELETE
- `EpicLinkPermissions` and `EpicPropertyPermissions` permission classes auto-generated
- Both added to `PROJECT_RESOURCE_TYPES`

**`inheritance.py`:**

- `EPIC_LINK` → child of `EPIC`, parent_field `issue_id`
- `EPIC_PROPERTY` → child of `PROJECT`, parent_field `project_id`

**`engine.py`:**

- `epic_link` → `IssueLink` model
- `epic_property` → `IssueProperty` model

**Role grant changes in `system_roles.py`:**

| Role        | `epic_link:*` | `epic_property:*` | Via                                                        |
| ----------- | ------------- | ----------------- | ---------------------------------------------------------- |
| W-Admin     | ✅            | ✅                | `epic_link:*`, `epic_property:*`                           |
| P-Admin     | ✅            | ✅                | `epic_link:*`, `epic_property:*`                           |
| Contributor | ✅ full CRUD  | ✅ full CRUD      | Explicit VIEW/CREATE/EDIT/DELETE                           |
| Commenter   | ✅ view only  | ✅ view only      | `EpicLinkPermissions.VIEW`, `EpicPropertyPermissions.VIEW` |
| Guest       | ❌            | ❌                | No grants                                                  |

### EpicSubscriberViewSet

**File:** `apps/api/plane/ee/views/app/epic/subscriber.py`

| Method                | URL Pattern                                                                  | Old Permission                                | New Permission                                         | Differences                                                                  |
| --------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `subscribe`           | `POST /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/subscribe/`   | `ProjectLitePermission` (via get_permissions) | `@can(EpicPermissions.VIEW, resource_param="epic_id")` | Now checks `epic:view`. Admin + Contributor + Commenter retain. Guest loses. |
| `unsubscribe`         | `DELETE /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/subscribe/` | `ProjectLitePermission` (via get_permissions) | `@can(EpicPermissions.VIEW, resource_param="epic_id")` | Same as subscribe                                                            |
| `subscription_status` | `GET /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/subscribe/`    | `ProjectLitePermission` (via get_permissions) | `@can(EpicPermissions.VIEW, resource_param="epic_id")` | Same as subscribe                                                            |

**Dead code removed:**

- `permission_classes = [ProjectEntityPermission]` — replaced by `@can`
- `get_permissions()` method — dynamic DRF permission switching no longer needed
- `perform_create()` method — never called (subscribe creates directly)
- `get_queryset()` method — list/retrieve not routed; subscribe/unsubscribe don't use it

### EpicLinkViewSet

**File:** `apps/api/plane/ee/views/app/epic/link.py`

| Method           | URL Pattern                                                                   | Old Permission            | New Permission                                                                                   | Differences                                                             |
| ---------------- | ----------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/links/`         | `ProjectEntityPermission` | `@can(EpicLinkPermissions.VIEW, resource_param="epic_id", scope_param_type=ResourceType.EPIC)`   | New `epic_link:view`. Admin + Contributor + Commenter. Guest loses GET. |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/links/<pk>/`    | `ProjectEntityPermission` | `@can(EpicLinkPermissions.VIEW, resource_param="pk")`                                            | Same access as list                                                     |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/links/`        | `ProjectEntityPermission` | `@can(EpicLinkPermissions.CREATE, resource_param="epic_id", scope_param_type=ResourceType.EPIC)` | Admin + Contributor. Commenter/Guest lose write access.                 |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/links/<pk>/`  | `ProjectEntityPermission` | `@can(EpicLinkPermissions.EDIT, resource_param="pk")`                                            | Admin + Contributor. Same as create.                                    |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/links/<pk>/` | `ProjectEntityPermission` | `@can(EpicLinkPermissions.DELETE, resource_param="pk")`                                          | Admin + Contributor. Same as create.                                    |

**Added `list` and `retrieve` method overrides** to attach `@can` decorators (base class methods don't have decorators).

### EpicPropertyEndpoint

**File:** `apps/api/plane/ee/views/app/epic_property/base.py`

| Method   | URL Pattern                                                             | Old Permission            | New Permission                                                      | Differences                                                             |
| -------- | ----------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/epic-properties/[<pk>/]`  | `ProjectEntityPermission` | `@can(EpicPropertyPermissions.VIEW, resource_param="project_id")`   | New `epic_property:view`. Admin + Contributor + Commenter. Guest loses. |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/epic-properties/`        | `ProjectEntityPermission` | `@can(EpicPropertyPermissions.CREATE, resource_param="project_id")` | Admin + Contributor. Commenter/Guest lose write access.                 |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/epic-properties/<pk>/`  | `ProjectEntityPermission` | `@can(EpicPropertyPermissions.EDIT, resource_param="project_id")`   | Admin + Contributor.                                                    |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/epic-properties/<pk>/` | `ProjectEntityPermission` | `@can(EpicPropertyPermissions.DELETE, resource_param="project_id")` | Admin + Contributor.                                                    |

### WorkspaceEpicTypeEndpoint

**File:** `apps/api/plane/ee/views/app/epic_property/type.py`

| Method | URL Pattern                          | Old Permission              | New Permission                                                   | Differences                                                                         |
| ------ | ------------------------------------ | --------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/epic-types/` | `WorkspaceEntityPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | W-Guest gains gate access (safe — `.accessible_to()` filters by project membership) |

### ProjectEpicTypeEndpoint

**File:** `apps/api/plane/ee/views/app/epic_property/type.py`

| Method | URL Pattern                                                | Old Permission              | New Permission                                            | Differences                                                            |
| ------ | ---------------------------------------------------------- | --------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/epic-types/` | `WorkspaceEntityPermission` | `@can(EpicPermissions.VIEW, resource_param="project_id")` | Now project-level check. Admin + Contributor + Commenter. Guest loses. |

### EpicPropertyOptionEndpoint

**File:** `apps/api/plane/ee/views/app/epic_property/option.py`

| Method   | URL Pattern                                                                                       | Old Permission            | New Permission                                                    | Differences                                                             |
| -------- | ------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/epic-property-options/[<epic_property_id>/][<pk>/]` | `ProjectEntityPermission` | `@can(EpicPropertyPermissions.VIEW, resource_param="project_id")` | New `epic_property:view`. Admin + Contributor + Commenter. Guest loses. |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/epic-property-options/<epic_property_id>/`         | `ProjectEntityPermission` | `@can(EpicPropertyPermissions.EDIT, resource_param="project_id")` | Uses EDIT (managing options = editing property). Admin + Contributor.   |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/epic-property-options/<epic_property_id>/<pk>/`   | `ProjectEntityPermission` | `@can(EpicPropertyPermissions.EDIT, resource_param="project_id")` | Same as post                                                            |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/epic-property-options/<epic_property_id>/<pk>/`  | `ProjectEntityPermission` | `@can(EpicPropertyPermissions.EDIT, resource_param="project_id")` | Same as post                                                            |

### EpicPropertyValueEndpoint

**File:** `apps/api/plane/ee/views/app/epic_property/value.py`

| Method  | URL Pattern                                                                                 | Old Permission            | New Permission                                            | Differences                                                                        |
| ------- | ------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `get`   | `GET /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/values/[<epic_property_id>/]` | `ProjectEntityPermission` | `@can(EpicPermissions.VIEW, resource_param="project_id")` | Uses `epic:view` (reading values = viewing epic). Admin + Contributor + Commenter. |
| `post`  | `POST /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/values/`                     | `ProjectEntityPermission` | `@can(EpicPermissions.EDIT, resource_param="project_id")` | Uses `epic:edit` (setting values = editing epic). Admin + Contributor.             |
| `patch` | `PATCH /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/values/<property_id>/`      | `ProjectEntityPermission` | `@can(EpicPermissions.EDIT, resource_param="project_id")` | Same as post                                                                       |

### EpicPropertyActivityEndpoint

**File:** `apps/api/plane/ee/views/app/epic_property/activity.py`

| Method | URL Pattern                                                                         | Old Permission                                             | New Permission                                            | Differences                                                                   |
| ------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/epics/<epic_id>/property-activities/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicPermissions.VIEW, resource_param="project_id")` | Guest loses access. Commenter gains (has `epic:view`). Decorator order fixed. |

**Decorator order change:** `@check_feature_flag` moved outermost, `@can` innermost (was reversed).

### WorkSpaceViewSet

**File:** `apps/api/plane/app/views/workspace/base.py`

| Method           | URL Pattern                  | Old Permission                                          | New Permission                                                     | Differences                                                                                                                            |
| ---------------- | ---------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `create`         | `POST /workspaces/`          | `WorkSpaceBasePermission` → POST → True (any auth user) | `IsAuthenticated` only (no `@can`)                                 | No change in behavior — any authenticated user can create; `DISABLE_WORKSPACE_CREATION` config check retained as inline business logic |
| `retrieve`       | `GET /workspaces/<slug>/`    | `WorkSpaceBasePermission` → GET → True (any member)     | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`   | Now checks `workspace:view` permission. All workspace roles have access. FE service `getWorkspace()` exists.                           |
| `partial_update` | `PATCH /workspaces/<slug>/`  | `@allow_permission([ROLE.ADMIN], level="WORKSPACE")`    | `@can(WorkspacePermissions.EDIT, resource_param="workspace_id")`   | Now checks `workspace:edit` permission. Owner (wildcard) + Admin have access. Equivalent on all plans.                                 |
| `destroy`        | `DELETE /workspaces/<slug>/` | `WorkSpaceBasePermission` → DELETE → role=20 (Admin)    | `@can(WorkspacePermissions.DELETE, resource_param="workspace_id")` | Now checks `workspace:delete`. **Tightened on Business/Enterprise:** only Owner can delete (Admin cannot). Free/Pro/One unchanged.     |
| `list`           | `GET /workspaces/`           | `@allow_permission([ADMIN, MEMBER, GUEST])`             | ⏸ URL commented out — unused by FE (uses `UserWorkSpacesEndpoint`) | FE calls `/api/users/me/workspaces/` instead. Old decorator had latent bug (`kwargs["slug"]` KeyError on slug-less URL).               |
| `update`         | `PUT /workspaces/<slug>/`    | `WorkSpaceBasePermission` → PUT → role∈[20,15]          | ⏸ URL commented out — FE uses PATCH only                           | —                                                                                                                                      |

**Additional changes:**

- Removed `permission_classes = [WorkSpaceBasePermission]` from class — BaseViewSet default `IsAuthenticated` handles auth
- `WorkSpaceBasePermission` import kept — still used by other classes in the same file (`WorkspaceThemeViewSet` etc.)

---

### WorkitemTemplateEndpoint

**File:** `apps/api/plane/ee/views/app/template/workitem.py`

**New resource types:** `WORKSPACE_WORKITEM_TEMPLATE` (workspace-level), `PROJECT_WORKITEM_TEMPLATE` (project-level) — created in `definitions.py`, `inheritance.py`, `engine.py`, `system_roles.py`.

| Method   | URL Pattern                                           | Old Permission                                  | New Permission                                      | Differences                                                                  |
| -------- | ----------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/workitems/templates/`         | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(WorkspaceWorkitemTemplatePermissions.VIEW)`   | W-Admin + W-Member retain access. W-Guest: no access (was already excluded). |
| `get`    | `GET /workspaces/<slug>/workitems/templates/<pk>/`    | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(WorkspaceWorkitemTemplatePermissions.VIEW)`   | Same as above.                                                               |
| `post`   | `POST /workspaces/<slug>/workitems/templates/`        | `@allow_permission([ADMIN], WORKSPACE)`         | `@can(WorkspaceWorkitemTemplatePermissions.CREATE)` | W-Admin retains access. W-Member: no create access (matches old behavior).   |
| `patch`  | `PATCH /workspaces/<slug>/workitems/templates/<pk>/`  | `@allow_permission([ADMIN], WORKSPACE)`         | `@can(WorkspaceWorkitemTemplatePermissions.EDIT)`   | W-Admin retains access.                                                      |
| `delete` | `DELETE /workspaces/<slug>/workitems/templates/<pk>/` | `@allow_permission([ADMIN], WORKSPACE)`         | `@can(WorkspaceWorkitemTemplatePermissions.DELETE)` | W-Admin retains access.                                                      |

### WorkitemProjectTemplateEndpoint

**File:** `apps/api/plane/ee/views/app/template/workitem.py`

| Method   | URL Pattern                                                                 | Old Permission                                | New Permission                                                                 | Differences                                                                     |
| -------- | --------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/workitems/templates/`         | `@allow_permission([ADMIN, MEMBER], PROJECT)` | `@can(ProjectWorkitemTemplatePermissions.VIEW, resource_param="project_id")`   | P-Admin + P-Contributor retain access. P-Commenter/Guest: no access.            |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/workitems/templates/<pk>/`    | `@allow_permission([ADMIN, MEMBER], PROJECT)` | `@can(ProjectWorkitemTemplatePermissions.VIEW, resource_param="project_id")`   | Same as above.                                                                  |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/workitems/templates/`        | `@allow_permission([ADMIN], PROJECT)`         | `@can(ProjectWorkitemTemplatePermissions.CREATE, resource_param="project_id")` | P-Admin retains access. P-Contributor: no create access (matches old behavior). |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/workitems/templates/<pk>/`  | `@allow_permission([ADMIN], PROJECT)`         | `@can(ProjectWorkitemTemplatePermissions.EDIT, resource_param="pk")`           | P-Admin retains access.                                                         |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/workitems/templates/<pk>/` | `@allow_permission([ADMIN], PROJECT)`         | `@can(ProjectWorkitemTemplatePermissions.DELETE, resource_param="pk")`         | P-Admin retains access.                                                         |

### ProjectTemplateEndpoint

**File:** `apps/api/plane/ee/views/app/template/project.py`

| Method   | URL Pattern                                          | Old Permission                                  | New Permission                                     | Differences                       |
| -------- | ---------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- | --------------------------------- |
| `get`    | `GET /workspaces/<slug>/projects/templates/`         | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(WorkspaceProjectTemplatePermissions.VIEW)`   | W-Admin + W-Member retain access. |
| `get`    | `GET /workspaces/<slug>/projects/templates/<pk>/`    | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(WorkspaceProjectTemplatePermissions.VIEW)`   | Same as above.                    |
| `post`   | `POST /workspaces/<slug>/projects/templates/`        | `@allow_permission([ADMIN], WORKSPACE)`         | `@can(WorkspaceProjectTemplatePermissions.CREATE)` | W-Admin retains access.           |
| `patch`  | `PATCH /workspaces/<slug>/projects/templates/<pk>/`  | `@allow_permission([ADMIN], WORKSPACE)`         | `@can(WorkspaceProjectTemplatePermissions.EDIT)`   | W-Admin retains access.           |
| `delete` | `DELETE /workspaces/<slug>/projects/templates/<pk>/` | `@allow_permission([ADMIN], WORKSPACE)`         | `@can(WorkspaceProjectTemplatePermissions.DELETE)` | W-Admin retains access.           |

### CopyProjectTemplateEndpoint

**File:** `apps/api/plane/ee/views/app/template/project.py`

| Method | URL Pattern                                        | Old Permission                          | New Permission                                     | Differences             |
| ------ | -------------------------------------------------- | --------------------------------------- | -------------------------------------------------- | ----------------------- |
| `post` | `POST /workspaces/<slug>/projects/templates/copy/` | `@allow_permission([ADMIN], WORKSPACE)` | `@can(WorkspaceProjectTemplatePermissions.CREATE)` | W-Admin retains access. |

### PageTemplateEndpoint

**File:** `apps/api/plane/ee/views/app/template/page.py`

| Method   | URL Pattern                                       | Old Permission                                         | New Permission                                  | Differences                                                                                                    |
| -------- | ------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/pages/templates/`         | `@allow_permission([ADMIN, MEMBER, GUEST], WORKSPACE)` | `@can(WorkspacePageTemplatePermissions.VIEW)`   | **W-Guest VIEW removed** (security tightening). FE never shows template picker to guests. Dead access removed. |
| `get`    | `GET /workspaces/<slug>/pages/templates/<pk>/`    | `@allow_permission([ADMIN, MEMBER, GUEST], WORKSPACE)` | `@can(WorkspacePageTemplatePermissions.VIEW)`   | Same — W-Guest VIEW removed.                                                                                   |
| `post`   | `POST /workspaces/<slug>/pages/templates/`        | `@allow_permission([ADMIN], WORKSPACE)`                | `@can(WorkspacePageTemplatePermissions.CREATE)` | W-Admin retains access.                                                                                        |
| `patch`  | `PATCH /workspaces/<slug>/pages/templates/<pk>/`  | `@allow_permission([ADMIN], WORKSPACE)`                | `@can(WorkspacePageTemplatePermissions.EDIT)`   | W-Admin retains access.                                                                                        |
| `delete` | `DELETE /workspaces/<slug>/pages/templates/<pk>/` | `@allow_permission([ADMIN], WORKSPACE)`                | `@can(WorkspacePageTemplatePermissions.DELETE)` | W-Admin retains access.                                                                                        |

### PageProjectTemplateEndpoint

**File:** `apps/api/plane/ee/views/app/template/page.py`

| Method   | URL Pattern                                                             | Old Permission                                | New Permission                                                             | Differences                            |
| -------- | ----------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------- |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/pages/templates/`         | `@allow_permission([ADMIN, MEMBER], PROJECT)` | `@can(ProjectPageTemplatePermissions.VIEW, resource_param="project_id")`   | P-Admin + P-Contributor retain access. |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/pages/templates/`        | `@allow_permission([ADMIN], PROJECT)`         | `@can(ProjectPageTemplatePermissions.CREATE, resource_param="project_id")` | P-Admin retains access.                |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/pages/templates/<pk>/`  | `@allow_permission([ADMIN], PROJECT)`         | `@can(ProjectPageTemplatePermissions.EDIT, resource_param="pk")`           | P-Admin retains access.                |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/pages/templates/<pk>/` | `@allow_permission([ADMIN], PROJECT)`         | `@can(ProjectPageTemplatePermissions.DELETE, resource_param="pk")`         | P-Admin retains access.                |

### ProjectTemplateUseEndpoint

**File:** `apps/api/plane/ee/views/app/project/template.py`

| Method | URL Pattern                                      | Old Permission                                  | New Permission                                  | Differences                                                                                                |
| ------ | ------------------------------------------------ | ----------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/use-template/` | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(WorkspaceProjectTemplatePermissions.USE)` | W-Admin + W-Member retain access. Uses new `USE` action. `ROLE` import kept for business logic (line 231). |

### AssetCopyEndpoint — UNUSED

**File:** `apps/api/plane/ee/views/app/template/asset.py`

Not called by FE — no service method or component references found. URL commented out in `plane/ee/urls/app/template.py`. TODO note added on view class and URL. No `@can` decorator applied.

### SubWorkitemTemplateEndpoint — SECURITY FIX

**File:** `apps/api/plane/ee/views/app/issue/template.py`

| Method | URL Pattern                                                                                     | Old Permission                                    | New Permission                                                  | Differences                                                                                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/work-items/<workitem_id>/sub-workitem-template/` | `IsAuthenticated` only (inherited) + feature flag | `@can(WorkitemPermissions.CREATE, resource_param="project_id")` | **Security fix:** Added project-level permission check. Uses `workitem:create` (not a template permission) because this endpoint creates workitems from a template. |

**New resource types created:** `WORKSPACE_WORKITEM_TEMPLATE`, `WORKSPACE_PAGE_TEMPLATE`, `WORKSPACE_PROJECT_TEMPLATE`, `PROJECT_WORKITEM_TEMPLATE`, `PROJECT_PAGE_TEMPLATE` — added to `definitions.py`, `inheritance.py`, `engine.py`, `system_roles.py`, `__init__.py`.

**Role grants added:**

- W-Admin: `workspace_workitem_template:*`, `workspace_page_template:*`, `workspace_project_template:*`, `project_workitem_template:*`, `project_page_template:*`
- W-Member: `workspace_workitem_template:view`, `workspace_page_template:view`, `workspace_project_template:view`, `workspace_project_template:use`
- W-Guest: no template grants
- P-Admin: `project_workitem_template:*`, `project_page_template:*`
- P-Contributor: `project_workitem_template:view`, `project_page_template:view`
- P-Commenter/P-Guest: no template grants

---

## Security Issues Discovered

Document security vulnerabilities found in existing views during migration review.

### Template

```markdown
### SECURITY-XXX: Brief Title

**Severity:** Critical | High | Medium | Low
**View:** `ViewClassName` in `path/to/file.py`
**Method:** `method_name`

**Issue:** Description of the security vulnerability.

**Impact:** What an attacker could do by exploiting this.

**Fix:** How the new permission system addresses this (or if a separate fix is needed).
```

### Issues

### SECURITY-001: Creator Bypass Vulnerability

**Severity:** High
**Views:** `IssueCommentViewSet`, `CycleViewSet`, `ModuleViewSet` (and others using `creator=True`)
**Methods:** `partial_update`, `destroy`

**Issue:** The legacy `@allow_permission([ROLE.ADMIN], creator=True, model=Model)` decorator allowed creators to edit/delete their resources even after being removed from the project. The `creator=True` check only verified that `created_by == request.user` without confirming current project membership.

**Impact:** A user who created a comment, cycle, or module could continue to modify or delete it after losing project access, potentially:

- Deleting important project data maliciously after being removed
- Modifying comments to inject misleading information
- Disrupting project workflows by deleting cycles/modules

**Fix:** The conditional grant system (and formerly `allow_creator=True`) checks:

1. First attempts permission resolution via role (admin can delete any resource)
2. If role check fails, verifies creator AND confirms user has active project membership via `ResourcePermission` tuples
3. Removed users have no `ResourcePermission` tuples, so creator check fails

### SECURITY-002: Missing Scope Filter in V1 Attachment Delete

**Severity:** High
**View:** `IssueAttachmentEndpoint` in `plane/app/views/issue/attachment.py`
**Method:** `delete`

**Issue:** `FileAsset.objects.get(pk=pk)` had no workspace or project filter. Any authenticated user who knew the UUID of an attachment could delete it, even from other projects/workspaces they had no access to.

**Impact:** Cross-project/cross-workspace attachment deletion by any authenticated user with a valid attachment UUID.

**Fix:** Added scope filters: `FileAsset.objects.get(pk=pk, workspace__slug=slug, project_id=project_id)`. Combined with the `@can` decorator migration, this ensures both permission check and data scoping are correct.

---

## Pending Migrations

### Template

```markdown
### ViewClassName

**File:** `apps/api/plane/app/views/path/file.py`

| Method        | URL Pattern          | Old Permission           | New Permission | Differences |
| ------------- | -------------------- | ------------------------ | -------------- | ----------- |
| `method_name` | `VERB /url/pattern/` | `@allow_permission(...)` | `@can(...)`    | Notes       |
```

### How to Document

1. **Old Permission**: Copy the existing `@allow_permission` decorator and any DRF `permission_classes`
2. **New Permission**: The `@can` decorator with Permission object
3. **Differences**: Note any behavioral changes:
   - Role-based → Permission-based (more granular)
   - Creator behavior changes
   - Guest access changes
   - Any permission that was implicit but now explicit

### Permission Mapping Reference

**Workspace Roles:**

| Old (ROLE)         | New (Free/Pro/One) | New (Business/Enterprise)                 |
| ------------------ | ------------------ | ----------------------------------------- |
| `ROLE.ADMIN` (20)  | `owner`            | `admin` (or `owner` if workspace creator) |
| `ROLE.MEMBER` (15) | `member`           | `member`                                  |
| `ROLE.GUEST` (5)   | `guest`            | `guest`                                   |

On Free/Pro/One plans, the Admin role does not exist — all `role=20` members get the Owner relation. On Business/Enterprise, only the `Workspace.owner` FK user gets Owner; other `role=20` members get Admin.

**Project Roles:**

| Old (ROLE)         | New (System Role) | Key Permissions                                                                                                   |
| ------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `ROLE.ADMIN` (20)  | `admin`           | `project:*`, `project.issue:*`, `project.module:*`, `project.cycle:*`, `project.page:*`, `project.member:*`, etc. |
| `ROLE.MEMBER` (15) | `contributor`     | Create/edit issues, modules, cycles, pages, views; delete own (Creator Only)                                      |
| N/A (new)          | `commenter` (10)  | `project.issue:view`, `project.comment:create/react`, `project.intake:create/submit`                              |
| `ROLE.GUEST` (5)   | `guest`           | `project.page:view`, `project.view:view`, `project.intake:submit`, `project.attachment:view/create`               |

### Creator Patterns

| Old Pattern                 | New Pattern (Current)                                                     | Behavior                                                |
| --------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| `creator=True, model=Model` | Conditional grant (`Permission & Condition.CREATOR`) in `system_roles.py` | Role permission OR creator (must be member)             |
| N/A                         | `creator_only=True`                                                       | ONLY creator can perform action (admin cannot override) |

---

## Conditional Grants & Universal Comment/Reaction/Attachment Permissions

**Date:** 2026-02-16

This section documents the introduction of conditional grants and the migration of comment, reaction, and attachment permissions to universal resource-type actions.

### System-Level Changes (No View Decorator Changes)

**Files modified:**

- `plane/permissions/definitions.py` — Added `Condition` enum, `ConditionalGrant` class, `Permission.__and__`; updated `RESOURCE_ACTIONS` (added `REACT` to COMMENT/PROJECT/INITIATIVE, un-deprecated `REACT` on WORKITEM/EPIC; removed `REACTION` resource type)
- `plane/permissions/engine.py` — Added `_role_get_conditions()`, `_evaluate_condition()`, `get_grant_conditions()`; updated `_role_has_permission()` to skip conditional patterns; updated `_resolve_permission()` to evaluate conditional grants
- `plane/permissions/decorators.py` — Added `scope_param_type` parameter to `can()`; extract `resource_model` from view for condition evaluation
- `plane/permissions/system_roles.py` — Updated grants using `& Condition.CREATOR`; replaced `ReactionPermissions.*` with parent-level REACT grants; fixed guest bugs
- `plane/permissions/__init__.py` — Exported `Condition`, `ConditionalGrant`; removed `ReactionPermissions`
- `plane/app/views/permission/user.py` — Updated to return conditional grant strings

### Role Grant Changes

| Role        | Permission                      | Before                  | After                  | Reason                                                                     |
| ----------- | ------------------------------- | ----------------------- | ---------------------- | -------------------------------------------------------------------------- |
| Contributor | `workitem:comment`              | Granted                 | **Removed**            | Replaced by universal `comment:create`                                     |
| Contributor | `workitem:react`                | Granted                 | **Kept**               | Un-deprecated — now the standard reaction permission on issues             |
| Contributor | `epic:comment`                  | Granted                 | **Removed**            | Replaced by universal `comment:create`                                     |
| Contributor | `epic:react`                    | Granted                 | **Kept**               | Un-deprecated — now the standard reaction permission on epics              |
| Contributor | `comment:edit`                  | Granted (unconditional) | `comment:edit+creator` | **Bug fix**: was allowing edit of ANY comment                              |
| Contributor | `comment:create`                | Not present             | **Added**              | Universal comment creation                                                 |
| Contributor | `comment:delete+creator`        | Not present             | **Added**              | Can delete own comments                                                    |
| Contributor | `comment:react`                 | Not present             | **Added**              | React to comments                                                          |
| Contributor | `project:react`                 | Not present             | **Added**              | React to projects                                                          |
| Contributor | `attachment:edit+creator`       | Not present             | **Added**              | Can edit own attachments                                                   |
| Contributor | `attachment:delete+creator`     | Not present             | **Added**              | Can delete own attachments                                                 |
| Commenter   | `workitem:comment`              | Granted                 | **Removed**            | Replaced by universal `comment:create`                                     |
| Commenter   | `workitem:react`                | Granted                 | **Kept**               | Un-deprecated — now the standard reaction permission on issues             |
| Commenter   | `comment:create`                | Not present             | **Added**              | Universal comment creation                                                 |
| Commenter   | `comment:edit+creator`          | Not present             | **Added**              | Can edit own comments                                                      |
| Commenter   | `comment:delete+creator`        | Not present             | **Added**              | Can delete own comments                                                    |
| Commenter   | `comment:react`                 | Not present             | **Added**              | React to comments                                                          |
| Guest       | `workitem:comment`              | Granted                 | **Removed**            | **Bug fix**: guests should not be able to comment                          |
| Guest       | `attachment:create`             | Granted                 | **Removed**            | **Bug fix**: guests should not create attachments                          |
| Guest       | `comment:react`                 | Not present             | **Added**              | Guests can react to page comments                                          |
| W-Admin     | `react:*`                       | Was present             | **Removed**            | Parent wildcards (`workitem:*`, `comment:*`, etc.) already cover `*:react` |
| P-Admin     | `react:create` / `react:delete` | Was present             | **Removed**            | Parent wildcards (`workitem:*`, `comment:*`, etc.) already cover `*:react` |

### `/permissions/me/` Endpoint Changes

The endpoint now returns conditional permission strings for the FE:

- Contributor: `{"comment:edit+creator": true, "comment:delete+creator": true, ...}`
- Admin: `{"comment:edit": true, "comment:delete": true, ...}` (unconditional)
- Guest: No comment permissions

See `docs/permissions/PERMISSION_FE_CONDITIONAL_PERMISSIONS_GUIDE.md` for FE migration details.

### View Decorator Changes (Pending — Separate Implementation)

View decorators for comment/reaction/attachment migrations have NOT been updated in this change. See `docs/permissions/PERMISSION_VIEW_DECORATOR_MIGRATION_GUIDE.md` for the decorator migration tables.

---

### `allow_creator` → Conditional Grant Refactoring

**Date:** 2026-02-16

All 22 `allow_creator=True` decorators have been replaced with conditional grants in `system_roles.py`. The `allow_creator` parameter, `creator_resource_type` parameter, and `AllowCreatorPermission` DRF class have been removed from the permission engine.

**New conditional grants added to `system_roles.py`:**

| Role        | Permission                       | Grant      |
| ----------- | -------------------------------- | ---------- |
| Contributor | `workitem:delete`                | `+creator` |
| Contributor | `epic:delete`                    | `+creator` |
| Contributor | `cycle:delete`                   | `+creator` |
| Contributor | `module:delete`                  | `+creator` |
| Contributor | `workitem_view:delete`           | `+creator` |
| Commenter   | `workitem:edit`                  | `+creator` |
| Commenter   | `workitem:delete`                | `+creator` |
| Guest       | `workitem:view`                  | `+creator` |
| Guest       | `workitem:edit`                  | `+creator` |
| Guest       | `workitem:delete`                | `+creator` |
| WS Member   | `workspace_workitem_view:delete` | `+creator` |

**Engine cleanup:**

- Removed `allow_creator` and `creator_resource_type` parameters from `check()`, `_resolve_permission()`, `_check_creator_permission()`, `_check_creator_only_permission()`
- Removed `allow_creator` fallback block in `_resolve_permission()` hierarchy traversal
- Removed `AllowCreatorPermission` class from `drf.py` and `__init__.py`
- `creator_only=True` remains unchanged (used by 2 view EDIT decorators) — removed in subsequent migration below

**Caching improvement:** Conditional grants use the standard cache path (5-min TTL, versioned invalidation). Previously, `allow_creator=True` bypassed the cache entirely.

### `creator_only` Removal

**Date:** 2026-02-16

Removed `creator_only=True` parameter from the permission engine. The "only creator can edit their own view" rule is a business rule about data ownership, not a permission, and now lives in the view layer.

**Why conditional grants alone don't work:** Admin has `workitem_view:*` and `workspace_workitem_view:*` wildcards. The engine resolves wildcards as unconditional grants (step 3, before conditional grants at step 4), so admin would always get unconditional EDIT access. The business rule requires that even admins cannot edit someone else's view.

**View changes:**

| ViewSet                            | Method           | Old                                                                                   | New                                                                                               |
| ---------------------------------- | ---------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `WorkspaceViewViewSet`             | `partial_update` | `@can(WorkspaceWorkitemViewPermissions.EDIT, resource_param="pk", creator_only=True)` | `@can(WorkspaceWorkitemViewPermissions.EDIT, resource_param="pk")` + inline `created_by_id` check |
| `IssueViewViewSet` (project views) | `partial_update` | `@can(WorkitemViewPermissions.EDIT, resource_param="pk", creator_only=True)`          | `@can(WorkitemViewPermissions.EDIT, resource_param="pk")` + inline `created_by_id` check          |

**Role grant change:**

| Role      | Permission                     | Change                                                                   |
| --------- | ------------------------------ | ------------------------------------------------------------------------ |
| WS Member | `workspace_workitem_view:edit` | Added `+creator` conditional grant (member can edit own workspace views) |

No change needed for project contributor — already has unconditional `workitem_view:edit`.

**Engine cleanup:**

- Removed `creator_only` parameter from `check()` and `_resolve_permission()`
- Deleted `_check_creator_only_permission()` method
- Removed `creator_only` parameter from `can()` decorator
- Deleted `CreatorOnlyPermission` class from `drf.py` and `__init__.py`
- Removed `creator_only` from `HasResourcePermission.has_permission()`

**Caching improvement:** `creator_only=True` previously bypassed the permission cache entirely. Now all view EDIT checks go through the standard cache path.

### Private-only Creator Restriction — View EDIT & DELETE

**Date:** 2026-04-20

The inline creator check on view EDIT was originally unconditional ("only the creator can edit, regardless of role"). Admins reported they could not edit or delete views created by others even when those views are public to the workspace/project, which contradicts the `workitem_view:*` / `workspace_workitem_view:*` wildcard grants admins already hold.

The inline check is now scoped to **private views only** (`access == 0`). Public views (`access == 1`, default) can be edited and deleted by anyone with the underlying permission — admins via wildcards, contributors/members via unconditional/conditional grants.

**View changes:**

| ViewSet                            | Method           | Old Inline Check                                    | New Inline Check                                                      |
| ---------------------------------- | ---------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| `WorkspaceViewViewSet`             | `partial_update` | `if view.created_by_id != request.user.id: deny`    | `if view.access == 0 and view.created_by_id != request.user.id: deny` |
| `WorkspaceViewViewSet`             | `destroy`        | _(no check — any `workspace_workitem_view:delete`)_ | `if view.access == 0 and view.created_by_id != request.user.id: deny` |
| `IssueViewViewSet` (project views) | `partial_update` | `if view.created_by_id != request.user.id: deny`    | `if view.access == 0 and view.created_by_id != request.user.id: deny` |
| `IssueViewViewSet` (project views) | `destroy`        | _(no check — any `workitem_view:delete`)_           | `if view.access == 0 and view.created_by_id != request.user.id: deny` |

**No permission grant changes** — all role grants are unchanged. The check is purely a business rule enforced in the view layer. `access=0` is Private, `access=1` is Public (see `IssueView.access` field in `plane/db/models/view.py`).

**Lock/unlock/access endpoints** in `IssueViewEEViewSet` are unchanged — they remain owner-only (`issue_view.owned_by != request.user`) because they control view visibility and structural state.

---

### Missing Permission Grant Additions — Commenter & Guest Roles

**Date:** 2026-02-16

After migrating views to `@can` decorators, the Commenter (10) and Guest (5) roles in `system_roles.py` were missing several VIEW grants that the old Guest role had. This caused regressions where users were denied access to resources they could previously view.

**Role mapping reminder:**

- Old Guest + `guest_view_all_features=true` → new **Commenter (10)**
- Old Guest + `guest_view_all_features=false` → new **Guest (5)**

**File modified:** `plane/permissions/system_roles.py`

#### Commenter (10) — grants added

| Permission          | Evidence                                                                                                                           | Impact before fix                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `epic:view`         | Old EE epic views: `@allow_permission([ADMIN, MEMBER, GUEST])`. Guest(5) didn't have it either but Commenter should per hierarchy. | Commenter denied access to view epics    |
| `module:view`       | Migrated views use `@can(ModulePermissions.VIEW)`. Old system allowed guest.                                                       | Commenter denied access to view modules  |
| `cycle:view`        | Migrated views use `@can(CyclePermissions.VIEW)`. Old EE: `@allow_permission([..., GUEST])`.                                       | Commenter denied access to view cycles   |
| `page:view`         | Guest (5) has it, Commenter (10) didn't — hierarchy violation.                                                                     | Commenter can't view pages but Guest can |
| `attachment:create` | Old asset endpoints: `@allow_permission([..., GUEST])` on POST. Commenter can comment but can't attach.                            | Commenter can't upload attachments       |

#### Guest (5) — grants added

| Permission            | Evidence                                                                                                                           | Impact before fix                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `label:view`          | Guest had `state:view` and `estimate:view` but NOT `label:view`. Old system: `@allow_permission([..., GUEST])` on label endpoints. | Guest can view issues but can't see labels |
| `project_member:view` | Old system: `@allow_permission([..., GUEST])` on member list/retrieve.                                                             | Guest can't see project member list        |

---

### InitiativeEndpoint

**File:** `apps/api/plane/ee/views/app/initiative/base.py`

| Method   | URL Pattern                                   | Old Permission                                                 | New Permission                                                      | Differences                                                                                |
| -------- | --------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `get`    | `GET /workspaces/<slug>/initiatives/[<pk>/]`  | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@can(InitiativePermissions.VIEW, resource_param="workspace_id")`   | Member keeps view access via `initiative:view`. Guest loses access (no initiative grants). |
| `post`   | `POST /workspaces/<slug>/initiatives/`        | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")`        | `@can(InitiativePermissions.CREATE, resource_param="workspace_id")` | Member loses create access — only has `initiative:view` in new system.                     |
| `patch`  | `PATCH /workspaces/<slug>/initiatives/<pk>/`  | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")`        | `@can(InitiativePermissions.EDIT, resource_param="pk")`             | Member loses edit access — only has `initiative:view` in new system.                       |
| `delete` | `DELETE /workspaces/<slug>/initiatives/<pk>/` | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")`        | `@can(InitiativePermissions.DELETE, resource_param="pk")`           | Member loses delete access — only has `initiative:view` in new system.                     |

### InitiativeProjectEndpoint (Security Fix)

**File:** `apps/api/plane/ee/views/app/initiative/base.py`

| Method   | URL Pattern                                                                    | Old Permission                                    | New Permission                                                     | Differences                                                                                 |
| -------- | ------------------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/initiatives/<initiative_id>/projects/[<project_id>/]`  | None (class-level `WorkspaceUserPermission` only) | `@can(InitiativePermissions.VIEW, resource_param="initiative_id")` | **Security fix**: previously any workspace member could access. Now checks initiative:view. |
| `post`   | `POST /workspaces/<slug>/initiatives/<initiative_id>/projects/`                | None (class-level `WorkspaceUserPermission` only) | `@can(InitiativePermissions.EDIT, resource_param="initiative_id")` | **Security fix**: previously any workspace member could modify. Now checks initiative:edit. |
| `delete` | `DELETE /workspaces/<slug>/initiatives/<initiative_id>/projects/<project_id>/` | None (class-level `WorkspaceUserPermission` only) | `@can(InitiativePermissions.EDIT, resource_param="initiative_id")` | **Security fix**: previously any workspace member could delete. Now checks initiative:edit. |

### InitiativeAnalyticsEndpoint / WorkspaceInitiativeAnalytics / InitiativeEpicAnalytics

**File:** `apps/api/plane/ee/views/app/initiative/base.py`

| Endpoint                       | Method | URL Pattern                                                          | Old Permission                                                 | New Permission                                                     | Differences                                |
| ------------------------------ | ------ | -------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| `InitiativeAnalyticsEndpoint`  | `get`  | `GET /workspaces/<slug>/initiatives/<initiative_id>/analytics/`      | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@can(InitiativePermissions.VIEW, resource_param="initiative_id")` | Guest loses access (no initiative grants). |
| `WorkspaceInitiativeAnalytics` | `get`  | `GET /workspaces/<slug>/initiatives/analytics/`                      | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@can(InitiativePermissions.VIEW, resource_param="workspace_id")`  | Guest loses access (no initiative grants). |
| `InitiativeEpicAnalytics`      | `get`  | `GET /workspaces/<slug>/initiatives/<initiative_id>/epic-analytics/` | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@can(InitiativePermissions.VIEW, resource_param="initiative_id")` | Guest loses access (no initiative grants). |

### InitiativeProgressEndpoint

**File:** `apps/api/plane/ee/views/app/initiative/base.py`

| Method | URL Pattern                                                    | Old Permission                                                 | New Permission                                                     | Differences                                |
| ------ | -------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| `get`  | `GET /workspaces/<slug>/initiatives/<initiative_id>/progress/` | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@can(InitiativePermissions.VIEW, resource_param="initiative_id")` | Guest loses access (no initiative grants). |

### InitiativeActivityEndpoint

**File:** `apps/api/plane/ee/views/app/initiative/activity.py`

| Method | URL Pattern                                                      | Old Permission                                                 | New Permission                                                     | Differences                                |
| ------ | ---------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| `get`  | `GET /workspaces/<slug>/initiatives/<initiative_id>/activities/` | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@can(InitiativePermissions.VIEW, resource_param="initiative_id")` | Guest loses access (no initiative grants). |

### New Resource Type: `INITIATIVE_COMMENT`

A new `INITIATIVE_COMMENT` resource type was added to support initiative comment permissions separately from `COMMENT` (which maps to `IssueComment`).

**Infrastructure changes:**

- `definitions.py`: Added `ResourceType.INITIATIVE_COMMENT` enum, `RESOURCE_ACTIONS` entry (view, create, edit, delete, react), `InitiativeCommentPermissions` class, added to `WORKSPACE_RESOURCE_TYPES`
- `inheritance.py`: Added as child of `INITIATIVE` with `parent_field="initiative_id"`; updated `INITIATIVE.children` to include it
- `engine.py`: Added `"initiative_comment": InitiativeComment` to model map
- `system_roles.py`: W-Admin gets `"initiative_comment:*"`; W-Member gets view, create, edit+creator, delete+creator, react
- `__init__.py`: Exported `InitiativeCommentPermissions`

**Role grant additions (W-Member):**

- `InitiativePermissions.REACT` — react to initiatives
- `InitiativeCommentPermissions.VIEW` — view comments
- `InitiativeCommentPermissions.CREATE` — create comments
- `InitiativeCommentPermissions.EDIT & Condition.CREATOR` — edit own comments
- `InitiativeCommentPermissions.DELETE & Condition.CREATOR` — delete own comments
- `InitiativeCommentPermissions.REACT` — react to comments

### InitiativeCommentViewSet

**File:** `apps/api/plane/ee/views/app/initiative/comment.py`

| Method   | URL Pattern                                                            | Old Permission                                                                                       | New Permission                                                                                             | Differences                                                                |
| -------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `post`   | `POST /workspaces/<slug>/initiatives/<initiative_id>/comments/`        | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")`                                              | `@can(InitiativeCommentPermissions.CREATE, resource_param="initiative_id", scope_param_type="initiative")` | Exact parity. Admin via `initiative_comment:*`, Member via explicit grant. |
| `patch`  | `PATCH /workspaces/<slug>/initiatives/<initiative_id>/comments/<pk>/`  | `@allow_permission(allowed_roles=[ADMIN], creator=True, model=InitiativeComment, level="WORKSPACE")` | `@can(InitiativeCommentPermissions.EDIT, resource_param="pk")`                                             | Exact parity. Admin: unconditional. Member: `+creator` conditional grant.  |
| `delete` | `DELETE /workspaces/<slug>/initiatives/<initiative_id>/comments/<pk>/` | `@allow_permission(allowed_roles=[ADMIN], creator=True, model=InitiativeComment, level="WORKSPACE")` | `@can(InitiativeCommentPermissions.DELETE, resource_param="pk")`                                           | Exact parity. Admin: unconditional. Member: `+creator` conditional grant.  |

### InitiativeCommentReactionViewSet

**File:** `apps/api/plane/ee/views/app/initiative/comment.py`

| Method   | URL Pattern                                                                                              | Old Permission                                                 | New Permission                                                                                            | Differences                                        |
| -------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `post`   | `POST /workspaces/<slug>/initiatives/<initiative_id>/comments/<comment_id>/reactions/`                   | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@can(InitiativeCommentPermissions.REACT, resource_param="initiative_id", scope_param_type="initiative")` | Guest loses access (no initiative_comment grants). |
| `delete` | `DELETE /workspaces/<slug>/initiatives/<initiative_id>/comments/<comment_id>/reactions/<reaction_code>/` | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@can(InitiativeCommentPermissions.REACT, resource_param="initiative_id", scope_param_type="initiative")` | Guest loses access (no initiative_comment grants). |

### Bug Fix: InitiativeComment `scope_param_type`

Three `@can` decorators on `InitiativeCommentViewSet.create` and `InitiativeCommentReactionViewSet` used `resource_param="initiative_id"` but lacked `scope_param_type="initiative"`. The `@can` auto-detection only handles `workspace_id` and `project_id` param names — for `initiative_id`, the engine treated the initiative UUID as an `initiative_comment` UUID, causing hierarchy chain failure.

**Fix:** Added `scope_param_type="initiative"` to all three decorators. The `partial_update` and `destroy` methods on `InitiativeCommentViewSet` use `resource_param="pk"` and are unaffected (engine resolves `InitiativeComment(pk)` → initiative → workspace via FK).

### New Resource Type: `INITIATIVE_ATTACHMENT`

A new `INITIATIVE_ATTACHMENT` resource type was added to support initiative attachment permissions separately from `ATTACHMENT` (which maps to project-level `FileAsset` with `parent_field="project_id"`). Initiative attachments use `entity_identifier` to store the initiative ID, so the project-level hierarchy would not resolve correctly.

**Infrastructure changes:**

- `definitions.py`: Added `ResourceType.INITIATIVE_ATTACHMENT` enum, `RESOURCE_ACTIONS` entry (view, create, edit, delete), `InitiativeAttachmentPermissions` class, added to `WORKSPACE_RESOURCE_TYPES`
- `inheritance.py`: Added as child of `INITIATIVE` with `parent_field="entity_identifier"`; updated `INITIATIVE.children` to include it
- `system_roles.py`: W-Admin gets `"initiative_attachment:*"`; W-Member gets view, create, edit, delete+creator
- `__init__.py`: Exported `InitiativeAttachmentPermissions`

**Role grant additions (W-Member):**

- `InitiativeAttachmentPermissions.VIEW` — view attachments
- `InitiativeAttachmentPermissions.CREATE` — upload attachments
- `InitiativeAttachmentPermissions.EDIT` — mark attachment as uploaded
- `InitiativeAttachmentPermissions.DELETE & Condition.CREATOR` — delete own attachments

### InitiativeAttachmentEndpoint

**File:** `apps/api/plane/ee/views/app/initiative/attachment.py`

| Method   | URL Pattern                                                               | Old Permission                                                                 | New Permission                                                                                                                       | Differences                                                                                               |
| -------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `post`   | `POST /workspaces/<slug>/initiatives/<initiative_id>/attachments/`        | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")`                 | `@can(InitiativeAttachmentPermissions.CREATE, resource_param="initiative_id", scope_param_type="initiative")`                        | Guest loses access (no initiative_attachment grants).                                                     |
| `get`    | `GET /workspaces/<slug>/initiatives/<initiative_id>/attachments/[<pk>/]`  | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")`                 | `@can(InitiativeAttachmentPermissions.VIEW, resource_param="initiative_id", scope_param_type="initiative")`                          | Guest loses access (no initiative_attachment grants).                                                     |
| `patch`  | `PATCH /workspaces/<slug>/initiatives/<initiative_id>/attachments/<pk>/`  | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")`                 | `@can(InitiativeAttachmentPermissions.EDIT, resource_param="initiative_id", scope_param_type="initiative")`                          | Guest loses access (no initiative_attachment grants).                                                     |
| `delete` | `DELETE /workspaces/<slug>/initiatives/<initiative_id>/attachments/<pk>/` | `@allow_permission([ADMIN], creator=True, model=FileAsset, level="WORKSPACE")` | `@can(InitiativeAttachmentPermissions.DELETE, resource_param="initiative_id", scope_param_type="initiative", defer_conditions=True)` | Admin: unconditional. Member: deferred +creator condition checked in view. Exact parity for Admin/Member. |

### InitiativeEpicViewSet

**File:** `apps/api/plane/ee/views/app/initiative/epic.py`

Uses existing `InitiativePermissions` — no new resource type needed. Managing an initiative's epic scope is an edit operation on the initiative itself (same pattern as `InitiativeProjectEndpoint`).

| Method    | URL Pattern                                                              | Old Permission                                          | New Permission                                                                                    | Differences                                                                                    |
| --------- | ------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `create`  | `POST /workspaces/<slug>/initiatives/<initiative_id>/epics/`             | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")` | `@can(InitiativePermissions.EDIT, resource_param="initiative_id", scope_param_type="initiative")` | Member loses access (no `initiative:edit` grant). Matches `InitiativeProjectEndpoint` pattern. |
| `list`    | `GET /workspaces/<slug>/initiatives/<initiative_id>/epics/`              | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")` | `@can(InitiativePermissions.VIEW, resource_param="initiative_id", scope_param_type="initiative")` | Exact parity. Admin via `initiative:*`, Member via `initiative:view`.                          |
| `destroy` | `DELETE /workspaces/<slug>/initiatives/<initiative_id>/epics/<epic_id>/` | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")` | `@can(InitiativePermissions.EDIT, resource_param="initiative_id", scope_param_type="initiative")` | Member loses access (no `initiative:edit` grant). Same as create.                              |

### InitiativeEpicIssueViewSet

**File:** `apps/api/plane/ee/views/app/initiative/epic.py`

| Method | URL Pattern                                                       | Old Permission                                          | New Permission                                                                                    | Differences                                                           |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `list` | `GET /workspaces/<slug>/initiatives/<initiative_id>/epic-issues/` | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")` | `@can(InitiativePermissions.VIEW, resource_param="initiative_id", scope_param_type="initiative")` | Exact parity. Admin via `initiative:*`, Member via `initiative:view`. |

### TeamspaceEndpoint

**File:** `apps/api/plane/ee/views/app/teamspace/base.py`

**Permission system additions:**

- Added `Condition.LEAD` to the `Condition` enum (`definitions.py`) — checks `lead_id == user_id` on the resource model, analogous to `Condition.CREATOR` checking `created_by_id`.
- Added `"lead"` evaluation branch in `engine.py:_evaluate_condition()` — filters by `lead_id` + `workspace_id`, then verifies active membership.
- Added `teamspace:edit+lead` and `teamspace:delete+lead` conditional grants to W-Member in `system_roles.py`.
- Scoped existing `"creator"` condition evaluation in `engine.py` by `workspace_id` when available (defense-in-depth).

| Method   | URL Pattern                                              | Old Permission                                                                                                  | New Permission                                                      | Differences                                                                                                                                   |
| -------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/team-spaces/`                    | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` + `permission_classes=[WorkspaceUserPermission]` | `@can(TeamspacePermissions.VIEW, resource_param="workspace_id")`    | Guest loses access (no `teamspace:view` grant). Admin via `teamspace:*`, Member via `teamspace:view`.                                         |
| `get`    | `GET /workspaces/<slug>/team-spaces/<team_space_id>/`    | Same as above                                                                                                   | Same as above                                                       | Same as above.                                                                                                                                |
| `post`   | `POST /workspaces/<slug>/team-spaces/`                   | `@allow_permission([ADMIN], level="WORKSPACE")` + `permission_classes=[WorkspaceUserPermission]`                | `@can(TeamspacePermissions.CREATE, resource_param="workspace_id")`  | Exact parity. Only Admin (via `teamspace:*`) and Owner (via `*`). Member has no `teamspace:create`.                                           |
| `patch`  | `PATCH /workspaces/<slug>/team-spaces/<team_space_id>/`  | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")` + inline `is_admin_or_teamspace_lead` check             | `@can(TeamspacePermissions.EDIT, resource_param="team_space_id")`   | Inline check removed — engine evaluates `teamspace:edit+lead` condition for Members. Admin via `teamspace:*` (unconditional). Exact parity.   |
| `delete` | `DELETE /workspaces/<slug>/team-spaces/<team_space_id>/` | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")` + inline `is_admin_or_teamspace_lead` check             | `@can(TeamspacePermissions.DELETE, resource_param="team_space_id")` | Inline check removed — engine evaluates `teamspace:delete+lead` condition for Members. Admin via `teamspace:*` (unconditional). Exact parity. |

**Removed class-level `permission_classes = [WorkspaceUserPermission]`** — the `@can` decorator handles permission checks.

**`is_admin_or_teamspace_lead` helper retained** on `TeamspaceBaseEndpoint` — other subclass views may still use it.

### TeamspaceMembersEndpoint

**File:** `apps/api/plane/ee/views/app/teamspace/member.py`

**Permission system additions:**

- Added `TeamspacePermissions.MANAGE & Condition.LEAD` to W-Member in `system_roles.py` — only the teamspace lead among W-Members can add/remove members.

| Method   | URL Pattern                                                          | Old Permission                                                                    | New Permission                                                      | Differences                                                                                                                                                                                                                                                                                                   |
| -------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/teamspace-members/`                          | `permission_classes=[WorkspaceUserPermission]` (any workspace member incl. guest) | `@can(TeamspacePermissions.VIEW, resource_param="workspace_id")`    | Guest loses access (no `teamspace:view` grant). Uses `workspace_id` because this URL has no `team_space_id`.                                                                                                                                                                                                  |
| `get`    | `GET /workspaces/<slug>/teamspaces/<team_space_id>/members/`         | Same as above                                                                     | Same as above                                                       | Same as above.                                                                                                                                                                                                                                                                                                |
| `get`    | `GET /workspaces/<slug>/teamspaces/<team_space_id>/members/<pk>/`    | Same as above                                                                     | Same as above                                                       | Same as above.                                                                                                                                                                                                                                                                                                |
| `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/members/`        | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")`                           | `@can(TeamspacePermissions.MANAGE, resource_param="team_space_id")` | **Tightened:** W-Member manage now requires `+lead` condition (was unconditional). Admin via `teamspace:*` — workspace admin PS granted `WildcardGrant(ResourceType.TEAMSPACE)` (replaces narrower `teamspace:browse` + `teamspace:create`). Engine walks teamspace→workspace hierarchy for permission check. |
| `delete` | `DELETE /workspaces/<slug>/teamspaces/<team_space_id>/members/<pk>/` | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")`                           | `@can(TeamspacePermissions.MANAGE, resource_param="team_space_id")` | Same tightening as `post`. Inline business logic retained: "cannot delete lead" and "cannot delete last member" checks are not permission-related.                                                                                                                                                            |

**Removed class-level `permission_classes = [WorkspaceUserPermission]`** — the `@can` decorator handles permission checks.

**Removed imports:** `WorkspaceUserPermission`, `allow_permission`, `ROLE` — replaced by `can`, `TeamspacePermissions` from `plane.permissions`.

### AddTeamspaceProjectEndpoint

**File:** `apps/api/plane/ee/views/app/teamspace/project.py`

| Method | URL Pattern                                                 | Old Permission                                            | New Permission                                                                                                 | Differences                                                                                                                                                                                                                                                                                                          |
| ------ | ----------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/teamspaces/` | `@allow_permission([ROLE.ADMIN])` (default level=PROJECT) | `@check_feature_flag(FeatureFlag.TEAMSPACES)` + `@can(ProjectPermissions.MANAGE, resource_param="project_id")` | **Added `@check_feature_flag`** — all other teamspace endpoints have this; its absence was an oversight. **W-Admin broadened:** old code required project/teamspace membership for W-Admin bypass; new `project:manage` grant at workspace level removes that requirement. P-Admin access preserved via `project:*`. |

**Added `@check_feature_flag(FeatureFlag.TEAMSPACES)`** — consistent with all other teamspace endpoints.

**Replaced imports:** `allow_permission`, `ROLE` → `can`, `ProjectPermissions`, `FeatureFlag`, `check_feature_flag`.

### TeamspaceIssueEndpoint

**File:** `apps/api/plane/ee/views/app/teamspace/issue.py`

**Note:** `permission_classes = [TeamspacePermission]` is **retained** on both classes in this file. The `TeamspacePermission` DRF class gates on teamspace membership (`TeamspaceMember` table). Without it, workspace-level `teamspace:view` would allow any W-Member to access teamspace content via the engine's hierarchy walk. See `docs/permissions/PERMISSION_TEAMSPACE_CONTENT_ACCESS.md` for future architectural paths to eliminate this layering.

| Method | URL Pattern                                                 | Old Permission                             | New Permission                                                                                                                                                 | Differences                                                                   |
| ------ | ----------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/teamspaces/<team_space_id>/issues/` | `permission_classes=[TeamspacePermission]` | `permission_classes=[TeamspacePermission]` + `@check_feature_flag(FeatureFlag.TEAMSPACES)` + `@can(TeamspacePermissions.VIEW, resource_param="team_space_id")` | Added `@can` + `@check_feature_flag`. Membership gate retained. Exact parity. |

### TeamspaceUserPropertiesEndpoint

**File:** `apps/api/plane/ee/views/app/teamspace/issue.py`

| Method  | URL Pattern                                                            | Old Permission                             | New Permission                                                                                                                                                 | Differences                                                                   |
| ------- | ---------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `patch` | `PATCH /workspaces/<slug>/teamspaces/<team_space_id>/user-properties/` | `permission_classes=[TeamspacePermission]` | `permission_classes=[TeamspacePermission]` + `@check_feature_flag(FeatureFlag.TEAMSPACES)` + `@can(TeamspacePermissions.VIEW, resource_param="team_space_id")` | Added `@can` + `@check_feature_flag`. Membership gate retained. Exact parity. |
| `get`   | `GET /workspaces/<slug>/teamspaces/<team_space_id>/user-properties/`   | `permission_classes=[TeamspacePermission]` | `permission_classes=[TeamspacePermission]` + `@check_feature_flag(FeatureFlag.TEAMSPACES)` + `@can(TeamspacePermissions.VIEW, resource_param="team_space_id")` | Added `@can` + `@check_feature_flag`. Membership gate retained. Exact parity. |

**Access — exact parity (no broadening):**

| Role                            | Old | New | Change                                  |
| ------------------------------- | --- | --- | --------------------------------------- |
| W-Owner (teamspace member)      | ✅  | ✅  | Same                                    |
| W-Owner (NOT teamspace member)  | ❌  | ❌  | Same — blocked by `TeamspacePermission` |
| W-Admin (teamspace member)      | ✅  | ✅  | Same                                    |
| W-Admin (NOT teamspace member)  | ❌  | ❌  | Same — blocked by `TeamspacePermission` |
| W-Member (teamspace member)     | ✅  | ✅  | Same                                    |
| W-Member (NOT teamspace member) | ❌  | ❌  | Same — blocked by `TeamspacePermission` |
| W-Guest                         | ❌  | ❌  | Same                                    |

### TeamspaceActivityEndpoint

**File:** `apps/api/plane/ee/views/app/teamspace/activity.py`

**Note:** `permission_classes = [TeamspacePermission]` is **retained**. The `TeamspacePermission` DRF class gates on teamspace membership (`TeamspaceMember` table). Without it, workspace-level `teamspace:view` would allow any W-Member to access teamspace content via the engine's hierarchy walk. See `docs/permissions/PERMISSION_TEAMSPACE_CONTENT_ACCESS.md` for future architectural paths to eliminate this layering.

| Method | URL Pattern                                                  | Old Permission                             | New Permission                                                                                                                                                 | Differences                                                                   |
| ------ | ------------------------------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/teamspaces/<team_space_id>/history/` | `permission_classes=[TeamspacePermission]` | `permission_classes=[TeamspacePermission]` + `@check_feature_flag(FeatureFlag.TEAMSPACES)` + `@can(TeamspacePermissions.VIEW, resource_param="team_space_id")` | Added `@can` + `@check_feature_flag`. Membership gate retained. Exact parity. |

**Access — exact parity (no broadening):**

| Role                            | Old | New | Change                                  |
| ------------------------------- | --- | --- | --------------------------------------- |
| W-Owner (teamspace member)      | ✅  | ✅  | Same                                    |
| W-Owner (NOT teamspace member)  | ❌  | ❌  | Same — blocked by `TeamspacePermission` |
| W-Admin (teamspace member)      | ✅  | ✅  | Same                                    |
| W-Admin (NOT teamspace member)  | ❌  | ❌  | Same — blocked by `TeamspacePermission` |
| W-Member (teamspace member)     | ✅  | ✅  | Same                                    |
| W-Member (NOT teamspace member) | ❌  | ❌  | Same — blocked by `TeamspacePermission` |
| W-Guest                         | ❌  | ❌  | Same                                    |

---

## Teamspace Role Namespace Migration (Batch)

**Date:** 2026-02-17
**Scope:** All teamspace content endpoints

### Infrastructure Changes

- **`definitions.py`**: Added `Action.BROWSE` to `RESOURCE_ACTIONS[ResourceType.TEAMSPACE]`; created `TEAMSPACE_RESOURCE_TYPES` set; removed `ResourceType.TEAMSPACE` from `WORKSPACE_RESOURCE_TYPES`
- **`engine.py`**: Updated `_get_namespace()` to route `teamspace` resource type to `"teamspace"` namespace (instead of `"workspace"`)
- **`system_roles.py`**: Added `TEAMSPACE_ROLES` with single `"member"` role; updated workspace `"admin"` to replace `"teamspace:*"` with `TeamspacePermissions.BROWSE, TeamspacePermissions.CREATE`; updated workspace `"member"` to replace all teamspace grants with just `TeamspacePermissions.BROWSE`; registered `"teamspace"` in `SYSTEM_ROLES`

### Already-Migrated Views (Updated)

| View                              | Method        | URL Pattern                                                                 | Old Permission                                                                                   | New Permission                                                      | Differences                                                                                 |
| --------------------------------- | ------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `TeamspaceEndpoint`               | `get`         | `GET /workspaces/<slug>/team-spaces/`                                       | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` + `WorkspaceUserPermission` (DRF) | `@can(TeamspacePermissions.BROWSE, resource_param="workspace_id")`  | Guest loses access. `WorkspaceUserPermission` removed. `VIEW` changed to `BROWSE`.          |
| `TeamspaceEndpoint`               | `patch`       | `PATCH /workspaces/<slug>/team-spaces/<team_space_id>/`                     | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")` + inline `is_admin_or_teamspace_lead`    | `@can(TeamspacePermissions.EDIT, resource_param="team_space_id")`   | Inline check removed — engine evaluates `+lead` condition. Resolves in teamspace namespace. |
| `TeamspaceEndpoint`               | `delete`      | `DELETE /workspaces/<slug>/team-spaces/<team_space_id>/`                    | `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")` + inline `is_admin_or_teamspace_lead`    | `@can(TeamspacePermissions.DELETE, resource_param="team_space_id")` | Inline check removed — engine evaluates `+lead` condition. Resolves in teamspace namespace. |
| `TeamspaceMembersEndpoint`        | `get`         | `GET /workspaces/<slug>/teamspace-members/`                                 | `WorkspaceUserPermission` (DRF)                                                                  | `@can(TeamspacePermissions.BROWSE, resource_param="workspace_id")`  | Guest loses access. `VIEW` changed to `BROWSE`.                                             |
| `TeamspaceIssueEndpoint`          | `get`         | `GET /workspaces/<slug>/teamspaces/<team_space_id>/issues/`                 | `TeamspacePermission` (DRF)                                                                      | `@can(TeamspacePermissions.VIEW, resource_param="team_space_id")`   | `TeamspacePermission` removed. Added `@check_feature_flag`.                                 |
| `TeamspaceUserPropertiesEndpoint` | `patch`/`get` | `PATCH\|GET /workspaces/<slug>/teamspaces/<team_space_id>/user-properties/` | `TeamspacePermission` (DRF)                                                                      | `@can(TeamspacePermissions.VIEW, resource_param="team_space_id")`   | `TeamspacePermission` removed. Added `@check_feature_flag`.                                 |
| `TeamspaceActivityEndpoint`       | `get`         | `GET /workspaces/<slug>/teamspaces/<team_space_id>/history/`                | `TeamspacePermission` (DRF)                                                                      | `@can(TeamspacePermissions.VIEW, resource_param="team_space_id")`   | `TeamspacePermission` removed. Added `@check_feature_flag`.                                 |

### Newly Migrated Endpoints

| View                                    | Method(s)             | URL Pattern                                                                   | Old Permission                                    | New Permission                                                           | Differences                                                           |
| --------------------------------------- | --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `TeamspaceViewEndpoint`                 | GET/POST/PATCH/DELETE | `/workspaces/<slug>/teamspaces/<team_space_id>/views/[<pk>/]`                 | `TeamspacePermission` (DRF)                       | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions for per-method breakdown   |
| `TeamspaceEntitiesEndpoint`             | GET                   | `/workspaces/<slug>/teamspaces/<team_space_id>/entities/`                     | `WorkspaceUserPermission` + `TeamspacePermission` | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | Both DRF classes removed                                              |
| `TeamspaceProgressChartEndpoint`        | GET                   | `/workspaces/<slug>/teamspaces/<team_space_id>/progress-chart/`               | None                                              | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | **Security fix**: previously unprotected                              |
| `TeamspaceProgressSummaryEndpoint`      | GET                   | `/workspaces/<slug>/teamspaces/<team_space_id>/progress-summary/`             | None                                              | `@can(TeamspacePermissions.VIEW, team_space_id)` + `@check_feature_flag` | **Security fix**: previously unprotected. Added `@check_feature_flag` |
| `TeamspaceRelationEndpoint`             | GET                   | `/workspaces/<slug>/teamspaces/<team_space_id>/relations/`                    | None                                              | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | **Security fix**: previously unprotected                              |
| `TeamspaceStatisticsEndpoint`           | GET                   | `/workspaces/<slug>/teamspaces/<team_space_id>/statistics/`                   | None                                              | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | **Security fix**: previously unprotected                              |
| `TeamspaceCycleEndpoint`                | GET                   | `/workspaces/<slug>/teamspaces/<team_space_id>/cycles/`                       | `TeamspacePermission`                             | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | —                                                                     |
| `TeamspaceCommentEndpoint`              | GET/POST/PATCH/DELETE | `/workspaces/<slug>/teamspaces/<team_space_id>/comments/[<pk>/]`              | `TeamspacePermission`                             | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions for per-method breakdown   |
| `TeamspaceCommentReactionEndpoint`      | POST/DELETE           | `.../comments/<comment_id>/reactions/[<reaction_code>/]`                      | None                                              | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | **Security fix**: previously unprotected. See Granular Permissions    |
| `TeamspacePageEndpoint`                 | GET/POST/PATCH/DELETE | `/workspaces/<slug>/teamspaces/<team_space_id>/pages/[<pk>/]`                 | `TeamspacePermission`                             | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions for per-method breakdown   |
| `TeamspacePageSummaryEndpoint`          | GET                   | `/workspaces/<slug>/teamspaces/<team_space_id>/pages-summary/`                | `TeamspacePermission`                             | `@can(TeamspacePermissions.VIEW, team_space_id)` + `@check_feature_flag` | Added `@check_feature_flag`                                           |
| `TeamspaceSubPageEndpoint`              | GET                   | `/workspaces/<slug>/teamspaces/<team_space_id>/pages/<page_id>/sub-pages/`    | `TeamspacePermission`                             | `@can(TeamspacePermissions.VIEW, team_space_id)` + `@check_feature_flag` | Added `@check_feature_flag`                                           |
| `TeamspaceParentPageEndpoint`           | GET                   | `/workspaces/<slug>/teamspaces/<team_space_id>/pages/<page_id>/parent-pages/` | `TeamspacePermission`                             | `@can(TeamspacePermissions.VIEW, team_space_id)` + `@check_feature_flag` | Added `@check_feature_flag`                                           |
| `TeamspacePageDuplicateEndpoint`        | POST                  | `.../pages/<pk>/duplicate/`                                                   | `TeamspacePermission`                             | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions                            |
| `TeamspacePageArchiveEndpoint`          | POST                  | `.../pages/<pk>/archive/`                                                     | `TeamspacePermission`                             | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions                            |
| `TeamspacePageUnarchiveEndpoint`        | POST                  | `.../pages/<pk>/unarchive/`                                                   | `TeamspacePermission`                             | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions                            |
| `TeamspacePageLockEndpoint`             | POST/DELETE           | `.../pages/<pk>/lock/`                                                        | `TeamspacePermission`                             | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions                            |
| `TeamspacePagesDescriptionEndpoint`     | GET/PATCH             | `.../pages/<pk>/description/`                                                 | `TeamspacePermission`                             | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions                            |
| `TeamspacePageVersionEndpoint`          | GET                   | `.../pages/<page_id>/versions/[<pk>/]`                                        | `TeamspacePermission`                             | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | —                                                                     |
| `TeamspacePageCommentEndpoint`          | GET/POST/PATCH/DELETE | `.../pages/<page_id>/comments/[<comment_id>/]`                                | `TeamspacePagePermission`                         | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions for per-method breakdown   |
| `TeamspacePageResolveCommentEndpoint`   | POST                  | `.../comments/<comment_id>/resolve/`                                          | `TeamspacePagePermission`                         | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions                            |
| `TeamspacePageUnresolveCommentEndpoint` | POST                  | `.../comments/<comment_id>/un-resolve/`                                       | `TeamspacePagePermission`                         | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions                            |
| `TeamspacePageRestoreCommentEndpoint`   | POST                  | `.../comments/<comment_id>/restore/`                                          | `TeamspacePagePermission`                         | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions                            |
| `TeamspacePageCommentRepliesEndpoint`   | GET                   | `.../comments/<comment_id>/replies/`                                          | `TeamspacePagePermission`                         | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions                            |
| `TeamspacePageCommentReactionEndpoint`  | POST/DELETE           | `.../comments/<comment_id>/reactions/[<reaction_code>/]`                      | `TeamspacePagePermission`                         | `@can(TeamspacePermissions.VIEW, team_space_id)`                         | See Teamspace Content Granular Permissions                            |

### Unused Endpoints (Not Migrated)

| View                            | Status                                |
| ------------------------------- | ------------------------------------- |
| `TeamspacePageFavoriteEndpoint` | URL commented out -- not called by FE |
| `TeamspacePagePublishEndpoint`  | URL already commented out             |
| `TeamspacePageUserEndpoint`     | URL already commented out             |

---

### Teamspace Content Granular Permissions (2026-02-18)

**Phase 2: Granular resource types for teamspace content.**

Previously all content endpoints used `@can(TeamspacePermissions.VIEW, team_space_id)` as a catch-all.
Now each content type has its own resource type with per-action granularity.

**New resource types:** `teamspace_comment`, `teamspace_view`, `teamspace_page`, `teamspace_page_comment`
**New action:** `Action.RESOLVE` (resolve/unresolve page comments)
**Approach:** All grants unconditional in `system_roles.py`; creator/lead enforcement inline in view code via `is_admin_or_teamspace_lead()`.

All content decorators use `scope_param_type=ResourceType.TEAMSPACE` with `resource_param="team_space_id"`.

#### TeamspaceCommentEndpoint

**File:** `apps/api/plane/ee/views/app/teamspace/comment.py`

| Method   | URL Pattern                                                           | Old Permission              | New Permission                       | Differences                                        |
| -------- | --------------------------------------------------------------------- | --------------------------- | ------------------------------------ | -------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/teamspaces/<team_space_id>/comments/`         | `TeamspacePermission` (DRF) | No change                            | —                                                  |
| `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/comments/`        | `TeamspacePermission` (DRF) | `TeamspaceCommentPermissions.CREATE` | —                                                  |
| `patch`  | `PATCH /workspaces/<slug>/teamspaces/<team_space_id>/comments/<pk>/`  | `TeamspacePermission` (DRF) | `TeamspaceCommentPermissions.EDIT`   | Inline: Creator OR admin/lead (`comment.actor_id`) |
| `delete` | `DELETE /workspaces/<slug>/teamspaces/<team_space_id>/comments/<pk>/` | `TeamspacePermission` (DRF) | `TeamspaceCommentPermissions.DELETE` | Inline: Creator OR admin/lead (`comment.actor_id`) |

#### TeamspaceCommentReactionEndpoint

| Method   | URL Pattern                                                                                             | Old Permission | New Permission                      | Differences                              |
| -------- | ------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------- | ---------------------------------------- |
| `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/comments/<comment_id>/reactions/`                   | None           | `TeamspaceCommentPermissions.REACT` | **Security fix**: previously unprotected |
| `delete` | `DELETE /workspaces/<slug>/teamspaces/<team_space_id>/comments/<comment_id>/reactions/<reaction_code>/` | None           | `TeamspaceCommentPermissions.REACT` | **Security fix**: previously unprotected |

#### TeamspaceViewEndpoint

**File:** `apps/api/plane/ee/views/app/teamspace/views.py`

| Method   | URL Pattern                                                        | Old Permission              | New Permission                    | Differences                                                                                       |
| -------- | ------------------------------------------------------------------ | --------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/teamspaces/<team_space_id>/views/`         | `TeamspacePermission` (DRF) | No change                         | —                                                                                                 |
| `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/views/`        | `TeamspacePermission` (DRF) | `TeamspaceViewPermissions.CREATE` | —                                                                                                 |
| `patch`  | `PATCH /workspaces/<slug>/teamspaces/<team_space_id>/views/<pk>/`  | `TeamspacePermission` (DRF) | `TeamspaceViewPermissions.EDIT`   | Inline: Owner OR admin/lead (`issue_view.owned_by_id`) — **changed from 400 to PermissionDenied** |
| `delete` | `DELETE /workspaces/<slug>/teamspaces/<team_space_id>/views/<pk>/` | `TeamspacePermission` (DRF) | `TeamspaceViewPermissions.DELETE` | Inline: Owner OR admin/lead (`issue_view_details.owned_by_id`) — **added**                        |

#### TeamspacePageEndpoint

**File:** `apps/api/plane/ee/views/app/teamspace/page/base.py`

| Method   | URL Pattern                                                        | Old Permission              | New Permission                    | Differences                                                    |
| -------- | ------------------------------------------------------------------ | --------------------------- | --------------------------------- | -------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/teamspaces/<team_space_id>/pages/`         | `TeamspacePermission` (DRF) | No change                         | —                                                              |
| `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/pages/`        | `TeamspacePermission` (DRF) | `TeamspacePagePermissions.CREATE` | —                                                              |
| `patch`  | `PATCH /workspaces/<slug>/teamspaces/<team_space_id>/pages/<pk>/`  | `TeamspacePermission` (DRF) | `TeamspacePagePermissions.EDIT`   | — (collaborative)                                              |
| `delete` | `DELETE /workspaces/<slug>/teamspaces/<team_space_id>/pages/<pk>/` | `TeamspacePermission` (DRF) | `TeamspacePagePermissions.DELETE` | Inline: Owner OR admin/lead — **replaced ProjectMember check** |

#### Other Page Endpoints

| Endpoint                            | Method   | URL Pattern                                                                   | Old Permission              | New Permission                     | Differences                                                    |
| ----------------------------------- | -------- | ----------------------------------------------------------------------------- | --------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| `TeamspacePageDuplicateEndpoint`    | `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/pages/<pk>/duplicate/`    | `TeamspacePermission` (DRF) | `TeamspacePagePermissions.CREATE`  | —                                                              |
| `TeamspacePageArchiveEndpoint`      | `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/pages/<pk>/archive/`      | `TeamspacePermission` (DRF) | `TeamspacePagePermissions.ARCHIVE` | Inline: Owner OR admin/lead — **replaced ProjectMember check** |
| `TeamspacePageUnarchiveEndpoint`    | `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/pages/<pk>/unarchive/`    | `TeamspacePermission` (DRF) | `TeamspacePagePermissions.ARCHIVE` | Inline: Owner OR admin/lead — **replaced ProjectMember check** |
| `TeamspacePageLockEndpoint`         | `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/pages/<pk>/lock/`         | `TeamspacePermission` (DRF) | `TeamspacePagePermissions.EDIT`    | Inline: Owner OR admin/lead — **replaced ProjectMember check** |
| `TeamspacePageLockEndpoint`         | `delete` | `DELETE /workspaces/<slug>/teamspaces/<team_space_id>/pages/<pk>/lock/`       | `TeamspacePermission` (DRF) | `TeamspacePagePermissions.EDIT`    | Inline: Owner OR admin/lead — **replaced ProjectMember check** |
| `TeamspacePagesDescriptionEndpoint` | `get`    | `GET /workspaces/<slug>/teamspaces/<team_space_id>/pages/<pk>/description/`   | `TeamspacePermission` (DRF) | `TeamspacePagePermissions.VIEW`    | —                                                              |
| `TeamspacePagesDescriptionEndpoint` | `patch`  | `PATCH /workspaces/<slug>/teamspaces/<team_space_id>/pages/<pk>/description/` | `TeamspacePermission` (DRF) | `TeamspacePagePermissions.EDIT`    | — (collaborative)                                              |

#### TeamspacePageCommentEndpoint

**File:** `apps/api/plane/ee/views/app/teamspace/page/comment.py`

| Method   | URL Pattern                                                                                   | Old Permission                  | New Permission                           | Differences                                                  |
| -------- | --------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| `get`    | `GET /workspaces/<slug>/teamspaces/<team_space_id>/pages/<page_id>/comments/`                 | `TeamspacePagePermission` (DRF) | No change                                | —                                                            |
| `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/pages/<page_id>/comments/`                | `TeamspacePagePermission` (DRF) | `TeamspacePageCommentPermissions.CREATE` | —                                                            |
| `patch`  | `PATCH /workspaces/<slug>/teamspaces/<team_space_id>/pages/<page_id>/comments/<comment_id>/`  | `TeamspacePagePermission` (DRF) | `TeamspacePageCommentPermissions.EDIT`   | Inline: Creator OR admin/lead (`page_comment.created_by_id`) |
| `delete` | `DELETE /workspaces/<slug>/teamspaces/<team_space_id>/pages/<page_id>/comments/<comment_id>/` | `TeamspacePagePermission` (DRF) | `TeamspacePageCommentPermissions.DELETE` | Inline: Creator OR admin/lead (`page_comment.created_by_id`) |

#### Other Page Comment Endpoints

| Endpoint                                | Method   | URL Pattern                                                                                                             | Old Permission                  | New Permission                            | Differences                                                  |
| --------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| `TeamspacePageResolveCommentEndpoint`   | `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/pages/<page_id>/comments/<comment_id>/resolve/`                     | `TeamspacePagePermission` (DRF) | `TeamspacePageCommentPermissions.RESOLVE` | — (any member)                                               |
| `TeamspacePageUnresolveCommentEndpoint` | `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/pages/<page_id>/comments/<comment_id>/un-resolve/`                  | `TeamspacePagePermission` (DRF) | `TeamspacePageCommentPermissions.RESOLVE` | — (any member)                                               |
| `TeamspacePageRestoreCommentEndpoint`   | `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/pages/<page_id>/comments/<comment_id>/restore/`                     | `TeamspacePagePermission` (DRF) | `TeamspacePageCommentPermissions.DELETE`  | Inline: Creator OR admin/lead (`page_comment.created_by_id`) |
| `TeamspacePageCommentRepliesEndpoint`   | `get`    | `GET /workspaces/<slug>/teamspaces/<team_space_id>/pages/<page_id>/comments/<comment_id>/replies/`                      | `TeamspacePagePermission` (DRF) | No change                                 | —                                                            |
| `TeamspacePageCommentReactionEndpoint`  | `post`   | `POST /workspaces/<slug>/teamspaces/<team_space_id>/pages/<page_id>/comments/<comment_id>/reactions/`                   | `TeamspacePagePermission` (DRF) | `TeamspacePageCommentPermissions.REACT`   | —                                                            |
| `TeamspacePageCommentReactionEndpoint`  | `delete` | `DELETE /workspaces/<slug>/teamspaces/<team_space_id>/pages/<page_id>/comments/<comment_id>/reactions/<reaction_code>/` | `TeamspacePagePermission` (DRF) | `TeamspacePageCommentPermissions.REACT`   | — (self-scoped)                                              |

#### system_roles.py Changes

**Workspace admin (`WORKSPACE_ROLES["admin"]`):** Added wildcards `teamspace_comment:*`, `teamspace_view:*`, `teamspace_page:*`, `teamspace_page_comment:*`.

**Teamspace member (`TEAMSPACE_ROLES["member"]`):** Added all granular content grants (unconditional). Creator/lead enforcement is inline in view code.

#### ProjectMember Checks Removed

Replaced 5 `ProjectMember.objects.filter(member=request.user, is_active=True, role__lte=15)` checks in page endpoints with `is_admin_or_teamspace_lead()` — the old check was incorrect for teamspace context (it checked project membership role, not teamspace role).

### Project Page ViewSets (Interim Migration)

**File:** `apps/api/plane/ee/views/app/page/project/base.py`

**Approach:** Added `HasResourcePermission` alongside existing `ProjectPagePermission` as a blanket engine-based membership check. `ProjectPagePermission` is unchanged and continues handling all page-specific authorization (owner bypass, private/shared pages, role checks). DRF runs both in AND order — `HasResourcePermission` gates on the action-specific permission, then `ProjectPagePermission` handles page business logic. This is an interim migration; proper page GAC will be defined later.

#### PageExtendedViewSet

| Method           | URL Pattern                                                                  | Old Permission          | New Permission           | Differences                           |
| ---------------- | ---------------------------------------------------------------------------- | ----------------------- | ------------------------ | ------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/pages/`                        | `ProjectPagePermission` | `PagePermissions.VIEW`   | DRF `ProjectPagePermission` unchanged |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/pages/`                       | `ProjectPagePermission` | `PagePermissions.CREATE` | DRF `ProjectPagePermission` unchanged |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/pages/<page_id>/`              | `ProjectPagePermission` | `PagePermissions.VIEW`   | DRF `ProjectPagePermission` unchanged |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/pages/<page_id>/`            | `ProjectPagePermission` | `PagePermissions.EDIT`   | DRF `ProjectPagePermission` unchanged |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/pages/<page_id>/`           | `ProjectPagePermission` | `PagePermissions.DELETE` | DRF `ProjectPagePermission` unchanged |
| `lock`           | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/lock/`        | `ProjectPagePermission` | `PagePermissions.EDIT`   | DRF `ProjectPagePermission` unchanged |
| `unlock`         | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/lock/`        | `ProjectPagePermission` | `PagePermissions.EDIT`   | DRF `ProjectPagePermission` unchanged |
| `access`         | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/access/`      | `ProjectPagePermission` | `PagePermissions.EDIT`   | DRF `ProjectPagePermission` unchanged |
| `archive`        | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/archive/`     | `ProjectPagePermission` | `PagePermissions.EDIT`   | DRF `ProjectPagePermission` unchanged |
| `unarchive`      | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/archive/`     | `ProjectPagePermission` | `PagePermissions.EDIT`   | DRF `ProjectPagePermission` unchanged |
| `sub_pages`      | `GET /workspaces/<slug>/projects/<project_id>/pages/<page_id>/sub-pages/`    | `ProjectPagePermission` | `PagePermissions.VIEW`   | DRF `ProjectPagePermission` unchanged |
| `parent_pages`   | `GET /workspaces/<slug>/projects/<project_id>/pages/<page_id>/parent-pages/` | `ProjectPagePermission` | `PagePermissions.VIEW`   | DRF `ProjectPagePermission` unchanged |
| `summary`        | `GET /workspaces/<slug>/projects/<project_id>/pages-summary/`                | `ProjectPagePermission` | `PagePermissions.VIEW`   | DRF `ProjectPagePermission` unchanged |

#### PageFavoriteExtendedViewSet

Favorites are user-scoped, not page mutations — `page:view` is sufficient.

| Method    | URL Pattern                                                                 | Old Permission          | New Permission         | Differences                           |
| --------- | --------------------------------------------------------------------------- | ----------------------- | ---------------------- | ------------------------------------- |
| `create`  | `POST /workspaces/<slug>/projects/<project_id>/favorite-pages/<page_id>/`   | `ProjectPagePermission` | `PagePermissions.VIEW` | DRF `ProjectPagePermission` unchanged |
| `destroy` | `DELETE /workspaces/<slug>/projects/<project_id>/favorite-pages/<page_id>/` | `ProjectPagePermission` | `PagePermissions.VIEW` | DRF `ProjectPagePermission` unchanged |

#### PagesDescriptionExtendedViewSet

| Method           | URL Pattern                                                                   | Old Permission          | New Permission         | Differences                           |
| ---------------- | ----------------------------------------------------------------------------- | ----------------------- | ---------------------- | ------------------------------------- |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/pages/<page_id>/description/`   | `ProjectPagePermission` | `PagePermissions.VIEW` | DRF `ProjectPagePermission` unchanged |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/pages/<page_id>/description/` | `ProjectPagePermission` | `PagePermissions.EDIT` | DRF `ProjectPagePermission` unchanged |

#### PageDuplicateExtendedEndpoint

`BaseAPIView` (not a ViewSet). `HasResourcePermission` falls back to `_get_action_from_method()` — maps POST → "create".

| Method   | URL Pattern                                                                | Old Permission          | New Permission           | Differences                           |
| -------- | -------------------------------------------------------------------------- | ----------------------- | ------------------------ | ------------------------------------- |
| `create` | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/duplicate/` | `ProjectPagePermission` | `PagePermissions.CREATE` | DRF `ProjectPagePermission` unchanged |

#### Behavioral Change

Because DRF uses AND logic, `HasResourcePermission` will deny commenter/guest users on edit/delete actions _before_ `ProjectPagePermission` can apply its owner bypass. Previously, a commenter who owned a page could edit/delete it via the owner bypass in `ProjectPagePermission`. This is an accepted behavioral tightening for this interim migration — it will be revisited when proper page GAC is defined.

#### No system_roles.py Changes

No changes to role grants. Existing page permissions in `system_roles.py`:

- Admin: `page:*`
- Contributor: `page:view`, `page:create`, `page:edit`, `page:share`
- Commenter: `page:view`
- Guest: `page:view`

### Workspace Page ViewSets (Interim Migration)

**File:** `apps/api/plane/ee/views/app/page/workspace/base.py`

**Approach:** Added `HasResourcePermission` alongside existing `WorkspacePagePermission` as a blanket engine-based membership check. `WorkspacePagePermission` is unchanged and continues handling all page-specific authorization (owner bypass, private/shared pages, role checks). DRF runs both in AND order — `HasResourcePermission` gates on the action-specific permission, then `WorkspacePagePermission` handles page business logic. Uses `resource_param="workspace_id"` — resolved via `BaseViewSet.workspace_id` property → `request.workspace_id` set by middleware. This is an interim migration; proper page GAC will be defined later.

#### WorkspacePageViewSet

| Method           | URL Pattern                                            | Old Permission            | New Permission           | Differences                             |
| ---------------- | ------------------------------------------------------ | ------------------------- | ------------------------ | --------------------------------------- |
| `list`           | `GET /workspaces/<slug>/pages/`                        | `WorkspacePagePermission` | `WikiPermissions.VIEW`   | DRF `WorkspacePagePermission` unchanged |
| `create`         | `POST /workspaces/<slug>/pages/`                       | `WorkspacePagePermission` | `WikiPermissions.CREATE` | DRF `WorkspacePagePermission` unchanged |
| `retrieve`       | `GET /workspaces/<slug>/pages/<page_id>/`              | `WorkspacePagePermission` | `WikiPermissions.VIEW`   | DRF `WorkspacePagePermission` unchanged |
| `partial_update` | `PATCH /workspaces/<slug>/pages/<page_id>/`            | `WorkspacePagePermission` | `WikiPermissions.EDIT`   | DRF `WorkspacePagePermission` unchanged |
| `destroy`        | `DELETE /workspaces/<slug>/pages/<page_id>/`           | `WorkspacePagePermission` | `WikiPermissions.DELETE` | DRF `WorkspacePagePermission` unchanged |
| `lock`           | `POST /workspaces/<slug>/pages/<page_id>/lock/`        | `WorkspacePagePermission` | `WikiPermissions.EDIT`   | DRF `WorkspacePagePermission` unchanged |
| `unlock`         | `POST /workspaces/<slug>/pages/<page_id>/lock/`        | `WorkspacePagePermission` | `WikiPermissions.EDIT`   | DRF `WorkspacePagePermission` unchanged |
| `access`         | `POST /workspaces/<slug>/pages/<page_id>/access/`      | `WorkspacePagePermission` | `WikiPermissions.EDIT`   | DRF `WorkspacePagePermission` unchanged |
| `archive`        | `POST /workspaces/<slug>/pages/<page_id>/archive/`     | `WorkspacePagePermission` | `WikiPermissions.EDIT`   | DRF `WorkspacePagePermission` unchanged |
| `unarchive`      | `POST /workspaces/<slug>/pages/<page_id>/archive/`     | `WorkspacePagePermission` | `WikiPermissions.EDIT`   | DRF `WorkspacePagePermission` unchanged |
| `sub_pages`      | `GET /workspaces/<slug>/pages/<page_id>/sub-pages/`    | `WorkspacePagePermission` | `WikiPermissions.VIEW`   | DRF `WorkspacePagePermission` unchanged |
| `parent_pages`   | `GET /workspaces/<slug>/pages/<page_id>/parent-pages/` | `WorkspacePagePermission` | `WikiPermissions.VIEW`   | DRF `WorkspacePagePermission` unchanged |
| `summary`        | `GET /workspaces/<slug>/pages-summary/`                | `WorkspacePagePermission` | `WikiPermissions.VIEW`   | DRF `WorkspacePagePermission` unchanged |

#### Other Workspace Page Endpoints

| Endpoint                           | Method           | URL Pattern                                                      | Old Permission            | New Permission           | Differences                             |
| ---------------------------------- | ---------------- | ---------------------------------------------------------------- | ------------------------- | ------------------------ | --------------------------------------- |
| `WorkspacePageDuplicateEndpoint`   | `post`           | `POST /workspaces/<slug>/pages/<page_id>/duplicate/`             | `WorkspacePagePermission` | `WikiPermissions.CREATE` | DRF `WorkspacePagePermission` unchanged |
| `WorkspacePagesDescriptionViewSet` | `retrieve`       | `GET /workspaces/<slug>/pages/<page_id>/description/`            | `WorkspacePagePermission` | `WikiPermissions.VIEW`   | DRF `WorkspacePagePermission` unchanged |
| `WorkspacePagesDescriptionViewSet` | `partial_update` | `PATCH /workspaces/<slug>/pages/<page_id>/description/`          | `WorkspacePagePermission` | `WikiPermissions.EDIT`   | DRF `WorkspacePagePermission` unchanged |
| `WorkspacePageVersionEndpoint`     | `get`            | `GET /workspaces/<slug>/pages/<page_id>/versions/[<pk>/]`        | `WorkspacePagePermission` | `WikiPermissions.VIEW`   | DRF `WorkspacePagePermission` unchanged |
| `WorkspacePageFavoriteEndpoint`    | `post`           | `POST /workspaces/<slug>/favorite-pages/<page_id>/`              | `WorkspacePagePermission` | `WikiPermissions.VIEW`   | DRF `WorkspacePagePermission` unchanged |
| `WorkspacePageFavoriteEndpoint`    | `delete`         | `DELETE /workspaces/<slug>/favorite-pages/<page_id>/`            | `WorkspacePagePermission` | `WikiPermissions.VIEW`   | DRF `WorkspacePagePermission` unchanged |
| `WorkspacePageRestoreEndpoint`     | `post`           | `POST /workspaces/<slug>/pages/<page_id>/versions/<pk>/restore/` | `WorkspacePagePermission` | `WikiPermissions.EDIT`   | DRF `WorkspacePagePermission` unchanged |

#### system_roles.py Changes

**Workspace member (`WORKSPACE_ROLES["member"]`):** Added `wiki:create`, `wiki:edit`, `wiki:delete` (previously only had `wiki:view`). Aligns permission engine with existing `WorkspacePagePermission` behavior where members can create, edit, and delete own pages. Actual delete access gated by `WorkspacePagePermission` owner bypass + inline `destroy()` check.

#### Behavioral Change

Guest users lose workspace page view access — `HasResourcePermission` denies before `WorkspacePagePermission` runs (guests have no `wiki:view` grant). Previously guests could view workspace pages via role check in `_has_public_page_access`. This is an accepted tightening.

### Project Page Sub-Views (Interim Migration — Batch 2)

**Files:** `ee/views/app/page/project/version.py`, `comment.py`, `share.py`, `export.py`, `publish.py`, `restore.py`

**Approach:** Added `HasResourcePermission` alongside existing `ProjectPagePermission` — same pattern as the batch 1 project page interim migration. Uses `action_permissions` dict with `resource_param="project_id"`. `ProjectPagePermission` is unchanged and continues handling page-specific business logic.

#### PageVersionExtendedEndpoint

`BaseAPIView` — `HasResourcePermission` maps GET → "retrieve" via `_get_action_from_method()`.

| Method     | URL Pattern                                                                    | Old Permission          | New Permission         | Differences                           |
| ---------- | ------------------------------------------------------------------------------ | ----------------------- | ---------------------- | ------------------------------------- |
| `retrieve` | `GET /workspaces/<slug>/projects/<project_id>/pages/<page_id>/versions/[<pk>]` | `ProjectPagePermission` | `PagePermissions.VIEW` | DRF `ProjectPagePermission` unchanged |

#### ProjectPageCommentViewSet

| Method           | URL Pattern                                                                                       | Old Permission          | New Permission         | Differences                           |
| ---------------- | ------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------- | ------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/pages/<page_id>/comments/`                          | `ProjectPagePermission` | `PagePermissions.VIEW` | DRF `ProjectPagePermission` unchanged |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/comments/`                         | `ProjectPagePermission` | `PagePermissions.EDIT` | DRF `ProjectPagePermission` unchanged |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/pages/<page_id>/comments/<comment_id>/`           | `ProjectPagePermission` | `PagePermissions.EDIT` | DRF `ProjectPagePermission` unchanged |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/pages/<page_id>/comments/<comment_id>/`          | `ProjectPagePermission` | `PagePermissions.EDIT` | DRF `ProjectPagePermission` unchanged |
| `resolve`        | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/comments/<comment_id>/resolve/`    | `ProjectPagePermission` | `PagePermissions.EDIT` | DRF `ProjectPagePermission` unchanged |
| `un_resolve`     | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/comments/<comment_id>/un-resolve/` | `ProjectPagePermission` | `PagePermissions.EDIT` | DRF `ProjectPagePermission` unchanged |
| `restore`        | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/comments/<comment_id>/restore/`    | `ProjectPagePermission` | `PagePermissions.EDIT` | DRF `ProjectPagePermission` unchanged |
| `replies`        | `GET /workspaces/<slug>/projects/<project_id>/pages/<page_id>/comments/<comment_id>/replies/`     | `ProjectPagePermission` | `PagePermissions.VIEW` | DRF `ProjectPagePermission` unchanged |

#### ProjectPageCommentReactionViewSet

Reactions are self-scoped — `page:view` is sufficient.

| Method    | URL Pattern                                                                                                        | Old Permission          | New Permission         | Differences                           |
| --------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------- | ---------------------- | ------------------------------------- |
| `create`  | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/comments/<comment_id>/reactions/`                   | `ProjectPagePermission` | `PagePermissions.VIEW` | DRF `ProjectPagePermission` unchanged |
| `destroy` | `DELETE /workspaces/<slug>/projects/<project_id>/pages/<page_id>/comments/<comment_id>/reactions/<reaction_code>/` | `ProjectPagePermission` | `PagePermissions.VIEW` | DRF `ProjectPagePermission` unchanged |

#### ProjectPageUserViewSet

Share operations use `page:edit` (not `page:share`) because this matches the existing access model.

| Method    | URL Pattern                                                                        | Old Permission          | New Permission         | Differences                           |
| --------- | ---------------------------------------------------------------------------------- | ----------------------- | ---------------------- | ------------------------------------- |
| `create`  | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/users/`             | `ProjectPagePermission` | `PagePermissions.EDIT` | DRF `ProjectPagePermission` unchanged |
| `list`    | `GET /workspaces/<slug>/projects/<project_id>/pages/<page_id>/users/`              | `ProjectPagePermission` | `PagePermissions.VIEW` | DRF `ProjectPagePermission` unchanged |
| `destroy` | `DELETE /workspaces/<slug>/projects/<project_id>/pages/<page_id>/users/<user_id>/` | `ProjectPagePermission` | `PagePermissions.EDIT` | DRF `ProjectPagePermission` unchanged |

#### ProjectPageExportViewSet

Export is a read operation — `page:view` is sufficient.

| Method   | URL Pattern                                                             | Old Permission          | New Permission         | Differences                           |
| -------- | ----------------------------------------------------------------------- | ----------------------- | ---------------------- | ------------------------------------- |
| `create` | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/export/` | `ProjectPagePermission` | `PagePermissions.VIEW` | DRF `ProjectPagePermission` unchanged |

#### ProjectPagePublishEndpoint

`BaseAPIView` — `HasResourcePermission` maps POST→create, PATCH→partial_update, GET→retrieve, DELETE→destroy.

| Method           | URL Pattern                                                                | Old Permission          | New Permission           | Differences                           |
| ---------------- | -------------------------------------------------------------------------- | ----------------------- | ------------------------ | ------------------------------------- |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/publish/`   | `ProjectPagePermission` | `PagePermissions.EDIT`   | DRF `ProjectPagePermission` unchanged |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/pages/<page_id>/publish/`  | `ProjectPagePermission` | `PagePermissions.EDIT`   | DRF `ProjectPagePermission` unchanged |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/pages/<page_id>/publish/`    | `ProjectPagePermission` | `PagePermissions.VIEW`   | DRF `ProjectPagePermission` unchanged |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/pages/<page_id>/publish/` | `ProjectPagePermission` | `PagePermissions.DELETE` | DRF `ProjectPagePermission` unchanged |

#### ProjectPageRestoreEndpoint

`BaseAPIView` — `HasResourcePermission` maps POST → "create".

| Method   | URL Pattern                                                                            | Old Permission          | New Permission         | Differences                           |
| -------- | -------------------------------------------------------------------------------------- | ----------------------- | ---------------------- | ------------------------------------- |
| `create` | `POST /workspaces/<slug>/projects/<project_id>/pages/<page_id>/versions/<pk>/restore/` | `ProjectPagePermission` | `PagePermissions.EDIT` | DRF `ProjectPagePermission` unchanged |

#### No system_roles.py Changes

No changes to role grants. Same grants as batch 1.

### Workspace Page Sub-Views (Interim Migration — Batch 2)

**Files:** `ee/views/app/page/workspace/comment.py`, `share.py`, `export.py`, `publish.py`

**Approach:** Added `HasResourcePermission` alongside existing `WorkspacePagePermission` — same pattern as the batch 1 workspace page interim migration. Uses `action_permissions` dict with `resource_param="workspace_id"`.

**Security improvement:** `WorkspacePageCommentReactionViewSet` previously had no `permission_classes` — only base authentication. Now has both `HasResourcePermission` and `WorkspacePagePermission`.

#### WorkspacePageCommentViewSet

| Method           | URL Pattern                                                                 | Old Permission            | New Permission         | Differences                             |
| ---------------- | --------------------------------------------------------------------------- | ------------------------- | ---------------------- | --------------------------------------- |
| `list`           | `GET /workspaces/<slug>/pages/<page_id>/comments/`                          | `WorkspacePagePermission` | `WikiPermissions.VIEW` | DRF `WorkspacePagePermission` unchanged |
| `create`         | `POST /workspaces/<slug>/pages/<page_id>/comments/`                         | `WorkspacePagePermission` | `WikiPermissions.EDIT` | DRF `WorkspacePagePermission` unchanged |
| `partial_update` | `PATCH /workspaces/<slug>/pages/<page_id>/comments/<comment_id>/`           | `WorkspacePagePermission` | `WikiPermissions.EDIT` | DRF `WorkspacePagePermission` unchanged |
| `destroy`        | `DELETE /workspaces/<slug>/pages/<page_id>/comments/<comment_id>/`          | `WorkspacePagePermission` | `WikiPermissions.EDIT` | DRF `WorkspacePagePermission` unchanged |
| `resolve`        | `POST /workspaces/<slug>/pages/<page_id>/comments/<comment_id>/resolve/`    | `WorkspacePagePermission` | `WikiPermissions.EDIT` | DRF `WorkspacePagePermission` unchanged |
| `un_resolve`     | `POST /workspaces/<slug>/pages/<page_id>/comments/<comment_id>/un-resolve/` | `WorkspacePagePermission` | `WikiPermissions.EDIT` | DRF `WorkspacePagePermission` unchanged |
| `restore`        | `POST /workspaces/<slug>/pages/<page_id>/comments/<comment_id>/restore/`    | `WorkspacePagePermission` | `WikiPermissions.EDIT` | DRF `WorkspacePagePermission` unchanged |
| `replies`        | `GET /workspaces/<slug>/pages/<page_id>/comments/<comment_id>/replies/`     | `WorkspacePagePermission` | `WikiPermissions.VIEW` | DRF `WorkspacePagePermission` unchanged |

#### WorkspacePageCommentReactionViewSet

Security improvement: previously had NO `permission_classes` — only base auth. Now requires both `HasResourcePermission` (wiki:view) and `WorkspacePagePermission`.

| Method    | URL Pattern                                                                                  | Old Permission | New Permission         | Differences                                                                 |
| --------- | -------------------------------------------------------------------------------------------- | -------------- | ---------------------- | --------------------------------------------------------------------------- |
| `create`  | `POST /workspaces/<slug>/pages/<page_id>/comments/<comment_id>/reactions/`                   | _(none)_       | `WikiPermissions.VIEW` | **Security fix:** added `HasResourcePermission` + `WorkspacePagePermission` |
| `destroy` | `DELETE /workspaces/<slug>/pages/<page_id>/comments/<comment_id>/reactions/<reaction_code>/` | _(none)_       | `WikiPermissions.VIEW` | **Security fix:** added `HasResourcePermission` + `WorkspacePagePermission` |

#### WorkspacePageUserViewSet

Share operations use `wiki:edit` (not `wiki:share`) because W-Member has `wiki:edit` but not `wiki:share`.

| Method    | URL Pattern                                                  | Old Permission            | New Permission         | Differences                             |
| --------- | ------------------------------------------------------------ | ------------------------- | ---------------------- | --------------------------------------- |
| `create`  | `POST /workspaces/<slug>/pages/<page_id>/users/`             | `WorkspacePagePermission` | `WikiPermissions.EDIT` | DRF `WorkspacePagePermission` unchanged |
| `list`    | `GET /workspaces/<slug>/pages/<page_id>/users/`              | `WorkspacePagePermission` | `WikiPermissions.VIEW` | DRF `WorkspacePagePermission` unchanged |
| `destroy` | `DELETE /workspaces/<slug>/pages/<page_id>/users/<user_id>/` | `WorkspacePagePermission` | `WikiPermissions.EDIT` | DRF `WorkspacePagePermission` unchanged |

#### WorkspacePageExportViewSet

Export is a read operation — `wiki:view` is sufficient.

| Method   | URL Pattern                                         | Old Permission            | New Permission         | Differences                             |
| -------- | --------------------------------------------------- | ------------------------- | ---------------------- | --------------------------------------- |
| `create` | `POST /workspaces/<slug>/pages/[<page_id>/]export/` | `WorkspacePagePermission` | `WikiPermissions.VIEW` | DRF `WorkspacePagePermission` unchanged |

#### WorkspacePagePublishEndpoint

`BaseAPIView` — `HasResourcePermission` maps POST→create, PATCH→partial_update, GET→retrieve, DELETE→destroy.

| Method           | URL Pattern                                          | Old Permission            | New Permission           | Differences                             |
| ---------------- | ---------------------------------------------------- | ------------------------- | ------------------------ | --------------------------------------- |
| `create`         | `POST /workspaces/<slug>/pages/<page_id>/publish/`   | `WorkspacePagePermission` | `WikiPermissions.EDIT`   | DRF `WorkspacePagePermission` unchanged |
| `partial_update` | `PATCH /workspaces/<slug>/pages/<page_id>/publish/`  | `WorkspacePagePermission` | `WikiPermissions.EDIT`   | DRF `WorkspacePagePermission` unchanged |
| `retrieve`       | `GET /workspaces/<slug>/pages/<page_id>/publish/`    | `WorkspacePagePermission` | `WikiPermissions.VIEW`   | DRF `WorkspacePagePermission` unchanged |
| `destroy`        | `DELETE /workspaces/<slug>/pages/<page_id>/publish/` | `WorkspacePagePermission` | `WikiPermissions.DELETE` | DRF `WorkspacePagePermission` unchanged |

#### No system_roles.py Changes

No changes to role grants. Same grants as batch 1.

### WorkspaceEstimatesEndpoint

**File:** `apps/api/plane/app/views/workspace/estimate.py`

| Method | URL Pattern                         | Old Permission                                      | New Permission                                                   | Differences                   |
| ------ | ----------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------- |
| `get`  | `GET /workspaces/<slug>/estimates/` | `WorkspaceEntityPermission` (any WS member for GET) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping — exact parity |

> **Data-level note:** Endpoint uses `.accessible_to(request.user.id, slug)` on the `Estimate` queryset to scope results to the user's accessible projects. Also filters out estimates from archived projects via `project__archived_at__isnull=True`.

### Workspace Read-Only Endpoints (Batch Migration)

Six workspace-level GET-only endpoints migrated from legacy DRF permission classes to `@can(WorkspacePermissions.VIEW)`. All are exact parity — every workspace role has `workspace:view`.

| Endpoint                         | File                            | Old Permission              | New Permission                                                   |
| -------------------------------- | ------------------------------- | --------------------------- | ---------------------------------------------------------------- |
| `WorkspaceCyclesEndpoint`        | `app/views/workspace/cycle.py`  | `WorkspaceViewerPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` |
| `WorkspaceModulesEndpoint`       | `app/views/workspace/module.py` | `WorkspaceViewerPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` |
| `WorkspaceStatesEndpoint`        | `app/views/workspace/state.py`  | `WorkspaceEntityPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` |
| `WorkspaceSearchEndpoint`        | `app/views/search/workspace.py` | `WorkspaceEntityPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` |
| `WorkspaceProjectMemberEndpoint` | `app/views/workspace/member.py` | `WorkspaceEntityPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` |
| `UserProjectRolesEndpoint`       | `app/views/project/member.py`   | `WorkspaceUserPermission`   | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` |

> **Data-level notes:**
>
> - `WorkspaceCyclesEndpoint`, `WorkspaceModulesEndpoint`, and `WorkspaceStatesEndpoint` use `.accessible_to(request.user.id, slug)` — properly scoped to the user's accessible projects. Cycles and modules also filter out archived projects via `project__archived_at__isnull=True`.
> - `WorkspaceSearchEndpoint`, `WorkspaceProjectMemberEndpoint`, and `UserProjectRolesEndpoint` are user-scoped (query by `request.user`).

### Workspace User Endpoints (Batch Migration)

Three workspace-level user-scoped endpoints migrated from legacy DRF permission classes to `@can(WorkspacePermissions.VIEW)`. All are exact parity — every workspace role has `workspace:view`.

| Endpoint                             | File                          | Old Permission              | New Permission                                                   |
| ------------------------------------ | ----------------------------- | --------------------------- | ---------------------------------------------------------------- |
| `WorkspaceUserProfileIssuesEndpoint` | `app/views/workspace/user.py` | `WorkspaceViewerPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` |
| `WorkspaceUserPropertiesEndpoint`    | `app/views/workspace/user.py` | `WorkspaceViewerPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` |
| `WorkspaceUserActivityEndpoint`      | `app/views/workspace/user.py` | `WorkspaceEntityPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` |

> **Data-level notes:**
>
> - All three endpoints are user-scoped (filter by `user_id` URL param or `request.user`).
> - `WorkspaceUserProfileIssuesEndpoint` uses `.accessible_to(request.user.id, slug)` — properly scoped to accessible projects.
> - `WorkspaceUserActivityEndpoint` uses `.accessible_to(request.user.id, slug)` — properly scoped.
> - `WorkspaceUserPropertiesEndpoint` is self-scoped — user can only GET/PATCH their own properties.

### Workspace Labels (Previous Batch) & Analytics Endpoints (Batch Migration)

| Endpoint                   | File                           | Method | Old Permission                                         | New Permission                                                     | Differences                       |
| -------------------------- | ------------------------------ | ------ | ------------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------- |
| `WorkspaceLabelsEndpoint`  | `app/views/workspace/label.py` | `get`  | `WorkspaceViewerPermission`                            | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`   | Exact parity                      |
| `WorkspaceLabelsEndpoint`  | `app/views/workspace/label.py` | `post` | `@allow_permission([ROLE.ADMIN])`                      | `@can(WorkspacePermissions.MANAGE, resource_param="workspace_id")` | Exact parity — owner + admin only |
| `DefaultAnalyticsEndpoint` | `app/views/analytic/base.py`   | `get`  | `@allow_permission([ADMIN, MEMBER, GUEST], WORKSPACE)` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`   | Exact parity                      |
| `ProjectStatsEndpoint`     | `app/views/analytic/base.py`   | `get`  | `@allow_permission([ADMIN, MEMBER, GUEST], WORKSPACE)` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`   | Exact parity                      |

> **Data-level notes:**
>
> - `WorkspaceLabelsEndpoint` GET uses `.accessible_to(request.user.id, slug)` and filters archived projects — properly scoped.
> - `DefaultAnalyticsEndpoint` and `ProjectStatsEndpoint` query all workspace data (no project-level filtering). Existing behavior preserved for parity.

### Project Labels, Onboarding & Analytics (Batch Migration)

**New permission resources added:** `AnalyticsPermissions` (`analytics:view`, `analytics:export`) and `AIPermissions` (`ai:view`, `ai:create`) — workspace-level. Grants: owner (wildcard), admin, member. Guest excluded.

#### Group A: Exact-Parity Migrations

| Endpoint                                | File                            | Method   | Old Permission                                            | New Permission                                                     | Differences                                      |
| --------------------------------------- | ------------------------------- | -------- | --------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| `ProjectLabelsEndpoint`                 | `app/views/project/label.py`    | `get`    | `@allow_permission([ADMIN, MEMBER, GUEST], WORKSPACE)`    | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`   | Exact parity                                     |
| `ProjectLabelsEndpoint`                 | `app/views/project/label.py`    | `post`   | `@allow_permission([ADMIN], WORKSPACE)`                   | `@can(WorkspacePermissions.MANAGE, resource_param="workspace_id")` | Exact parity — owner + admin only                |
| `ProjectLabelDetailEndpoint`            | `app/views/project/label.py`    | `get`    | `@allow_permission([ADMIN, MEMBER, GUEST], WORKSPACE)`    | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`   | Exact parity                                     |
| `ProjectLabelDetailEndpoint`            | `app/views/project/label.py`    | `patch`  | `@allow_permission([ADMIN], WORKSPACE)`                   | `@can(WorkspacePermissions.MANAGE, resource_param="workspace_id")` | Exact parity — owner + admin only                |
| `ProjectLabelDetailEndpoint`            | `app/views/project/label.py`    | `delete` | `@allow_permission([ADMIN], WORKSPACE)`                   | `@can(WorkspacePermissions.MANAGE, resource_param="workspace_id")` | Exact parity — owner + admin only                |
| `WorkspaceMemberUserOnboardingEndpoint` | `app/views/workspace/member.py` | `patch`  | No decorator (manual `WorkspaceMember.objects.get` check) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`   | Self-scoped — user updates own onboarding fields |

**Additional changes:**

- `label.py`: Removed `from plane.app.permissions import allow_permission, ROLE`; added `from plane.permissions import WorkspacePermissions, can`.
- `member.py`: `WorkspacePermissions` and `can` were already imported from previous batch. Inline `WorkspaceMember.objects.get(member=request.user)` check retained for self-scoping.

#### Group B: Analytics Migrations (New `AnalyticsPermissions` Resource)

| Endpoint                        | File                            | Method | Old Permission                                  | New Permission                                                     | Differences                                           |
| ------------------------------- | ------------------------------- | ------ | ----------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| `AnalyticsEndpoint`             | `app/views/analytic/base.py`    | `get`  | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(AnalyticsPermissions.VIEW, resource_param="workspace_id")`   | Exact parity — owner + admin + member; guest excluded |
| `SavedAnalyticEndpoint`         | `app/views/analytic/base.py`    | `get`  | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(AnalyticsPermissions.VIEW, resource_param="workspace_id")`   | Exact parity — owner + admin + member; guest excluded |
| `ExportAnalyticsEndpoint`       | `app/views/analytic/base.py`    | `post` | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(AnalyticsPermissions.EXPORT, resource_param="workspace_id")` | Exact parity — owner + admin + member; guest excluded |
| `AdvanceAnalyticsEndpoint`      | `app/views/analytic/advance.py` | `get`  | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(AnalyticsPermissions.VIEW, resource_param="workspace_id")`   | Exact parity — owner + admin + member; guest excluded |
| `AdvanceAnalyticsStatsEndpoint` | `app/views/analytic/advance.py` | `get`  | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(AnalyticsPermissions.VIEW, resource_param="workspace_id")`   | Exact parity — owner + admin + member; guest excluded |
| `AdvanceAnalyticsChartEndpoint` | `app/views/analytic/advance.py` | `get`  | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(AnalyticsPermissions.VIEW, resource_param="workspace_id")`   | Exact parity — owner + admin + member; guest excluded |

**Additional changes:**

- `analytic/base.py`: Removed unused `from plane.app.permissions import allow_permission, ROLE`; added `AnalyticsPermissions` to existing import. `AnalyticViewViewset` retains `WorkSpaceAdminPermission` DRF class (unmigrated).
- `analytic/advance.py`: Replaced `from plane.app.permissions import ROLE, allow_permission` with `from plane.app.permissions import ROLE` (retained for business logic) + `from plane.permissions import AnalyticsPermissions, can`.

### Workspace Members, Project Members, Project Preferences & Subscribers (Batch Migration)

#### WorkSpaceMemberViewSet (Fully Migrated)

**File:** `apps/api/plane/app/views/workspace/member.py`

| Method           | URL Pattern                               | Old Permission                                         | New Permission                                                         | Differences                                                     |
| ---------------- | ----------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/members/`         | `@allow_permission([ADMIN, MEMBER, GUEST], WORKSPACE)` | `@can(WorkspaceMemberPermissions.VIEW, resource_param="workspace_id")` | Permission changed to resource-specific `workspace_member:view` |
| `partial_update` | `PATCH /workspaces/<slug>/members/<pk>/`  | `@allow_permission([ADMIN], WORKSPACE)`                | `@can(WorkspaceMemberPermissions.CHANGE_ROLE, resource_param="pk")`    | Exact parity (admin-only)                                       |
| `destroy`        | `DELETE /workspaces/<slug>/members/<pk>/` | `@allow_permission([ADMIN], WORKSPACE)`                | `@can(WorkspaceMemberPermissions.REMOVE, resource_param="pk")`         | Exact parity (admin-only)                                       |
| `leave`          | `POST /workspaces/<slug>/members/leave/`  | `@allow_permission([ADMIN, MEMBER, GUEST], WORKSPACE)` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`       | Unchanged — self-action gate                                    |

> `retrieve` marked unused (not called by FE) — not in URL config. No decorator applied.

**Grant change:** Added `WorkspaceMemberPermissions.VIEW` to workspace guest role in `system_roles.py`. Required because old `@allow_permission([ADMIN, MEMBER, GUEST])` gave guests access, and FE fetches member list on workspace init via `workspace-wrapper.tsx`.

**Inline business logic (retained, not expressible in @can):**

- `list`: Serializer PII gating — `role_from_member_role(role) != "guest"` selects `WorkspaceMemberAdminSerializer` (includes email, last_login_medium) vs. `WorkSpaceMemberSerializer` (basic). This is data-level filtering, not permission gating.
- `partial_update`: Self-update prevention (`request.user.id == workspace_member.member_id`); role hierarchy enforcement (can't modify higher role, can't assign higher than own); guest cascade (demote project roles + remove teamspace memberships when moving to role=5); seat limit validation (`workspace_member_check()`).
- `destroy`: Self-removal prevention; role hierarchy check (`requesting_workspace_member.role < workspace_member.role`); last admin protection (checks sole admin in projects).

**Import cleanup:** Removed `allow_permission` and `ROLE` imports from `plane.app.permissions`. Added `WorkspaceMemberPermissions` and `role_from_member_role` imports.

#### ProjectMemberViewSet (Fully Migrated)

**File:** `apps/api/plane/app/views/project/member.py`

| Method           | URL Pattern                                             | Old Permission                              | New Permission                                                       | Differences                            |
| ---------------- | ------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------- |
| `create`         | `POST /workspaces/<slug>/projects/<id>/members/`        | `@allow_permission([ADMIN])`                | `@can(ProjectMemberPermissions.INVITE, resource_param="project_id")` | Exact parity (admin-only)              |
| `list`           | `GET /workspaces/<slug>/projects/<id>/members/`         | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectMemberPermissions.VIEW, resource_param="project_id")`   | Exact parity (all roles)               |
| `retrieve`       | `GET /workspaces/<slug>/projects/<id>/members/<pk>/`    | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectMemberPermissions.VIEW, resource_param="pk")`           | Exact parity (all roles)               |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<id>/members/<pk>/`  | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectMemberPermissions.CHANGE_ROLE, resource_param="pk")`    | **Tightened** to admin-only (see note) |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<id>/members/<pk>/` | `@allow_permission([ADMIN])`                | `@can(ProjectMemberPermissions.REMOVE, resource_param="pk")`         | Exact parity (admin-only)              |
| `leave`          | `POST /workspaces/<slug>/projects/<id>/members/leave/`  | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectPermissions.VIEW, resource_param="project_id")`         | Self-action gate — all roles           |

**Tightened `partial_update`:** Old decorator allowed all roles (`[ADMIN, MEMBER, GUEST]`), but inline hierarchy checks prevented non-admins from useful operations. FE gates role dropdown to admin only (`allowPermissions([ROLE.ADMIN])`). New `@can(ProjectMemberPermissions.CHANGE_ROLE)` restricts to project admin (has `project_member:*` wildcard) and workspace admin (has `project_member:*` in workspace admin bypass grants). Safe tightening — no behavioral change for any user.

**No grant changes needed.** All project roles already have `project_member:view` in `system_roles.py`. Project admin has `project_member:*` wildcard. Workspace admin bypass grants include `project_member:*`.

**Inline business logic (retained, not expressible in @can):**

- `create`: Workspace↔project role constraints (prevents assigning project role inconsistent with workspace role).
- `retrieve`: Serializer PII gating — `project_role_from_member_role(role) != "guest"` selects `ProjectMemberAdminSerializer` (includes email via `UserAdminLiteSerializer`) vs. `ProjectMemberRoleSerializer` (id, member, role only).
- `partial_update`: Self-update prevention (unless workspace admin); workspace↔project role constraint; role hierarchy check (can't assign higher than own, unless workspace admin).
- `destroy`: Self-removal prevention; role hierarchy check.
- `leave`: Last admin protection.

**Import cleanup:** Removed `allow_permission` import. Added `ProjectMemberPermissions` and `project_role_from_member_role`. Kept `ROLE` — still used by `_process_direct_members()`, `_process_teamspace_only_members()`, `ProjectMemberUserEndpoint`, and `UserProjectRolesEndpoint` for data processing.

**`ProjectMemberPreferenceEndpoint` (Unused):** Removed `@allow_permission` decorators from `patch` and `get` methods — class is unused (URL commented out), decorators were stale references.

#### WorkspaceMemberUserViewsEndpoint

**File:** `apps/api/plane/app/views/workspace/member.py`

| Method | URL Pattern                                | Old Permission | New Permission                                                   | Differences                 |
| ------ | ------------------------------------------ | -------------- | ---------------------------------------------------------------- | --------------------------- |
| `post` | `POST /workspaces/<slug>/workspace-views/` | None           | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Added permission (was open) |

> Self-scoped: always operates on `member=request.user`. Permission added as baseline access control.

#### WorkspaceMemberUserEndpoint

**File:** `apps/api/plane/app/views/workspace/member.py`

| Method | URL Pattern                                    | Old Permission | New Permission                                                   | Differences                 |
| ------ | ---------------------------------------------- | -------------- | ---------------------------------------------------------------- | --------------------------- |
| `get`  | `GET /workspaces/<slug>/workspace-members/me/` | None           | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Added permission (was open) |

> Self-scoped: always returns data for `member=request.user`.

#### ProjectMemberPreferenceEndpoint (Unused)

**File:** `apps/api/plane/app/views/project/member.py`

| Method  | URL Pattern                                                              | Old Permission                              | New Permission | Differences        |
| ------- | ------------------------------------------------------------------------ | ------------------------------------------- | -------------- | ------------------ |
| `get`   | `GET /workspaces/<slug>/projects/<id>/preferences/member/<member_id>/`   | `@allow_permission([ADMIN, MEMBER, GUEST])` | N/A — unused   | URLs commented out |
| `patch` | `PATCH /workspaces/<slug>/projects/<id>/preferences/member/<member_id>/` | `@allow_permission([ADMIN, MEMBER, GUEST])` | N/A — unused   | URLs commented out |

> Not called by FE. Duplicate URL entries both commented out in `project.py`. TODO added on view class. Import removed from URL config.

#### ProjectSubscriberEndpoint

**File:** `apps/api/plane/app/views/project/subscriber.py`

| Method             | URL Pattern                                          | Old Permission                                  | New Permission                                                 | Differences                                   |
| ------------------ | ---------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------- |
| `list`             | `GET /workspaces/<slug>/projects/<id>/subscribers/`  | `permission_classes = [ProjectAdminPermission]` | `@can(ProjectPermissions.MANAGE, resource_param="project_id")` | W-Admin gains access via `project:*` wildcard |
| `create_or_update` | `POST /workspaces/<slug>/projects/<id>/subscribers/` | `permission_classes = [ProjectAdminPermission]` | `@can(ProjectPermissions.MANAGE, resource_param="project_id")` | Same                                          |

> Old `ProjectAdminPermission` required project membership with `role=20` only, with no workspace admin bypass. New `@can(ProjectPermissions.MANAGE)` grants workspace admin access via `project:*` wildcard — this is intentional.

**Import cleanup:** Removed `ProjectAdminPermission`; added `ProjectPermissions, can`. Removed `permission_classes` class attribute.

### AI, Activities & Worklogs (Batch Migration)

**Infrastructure changes:**

- Added `Action.USE` to `definitions.py` for feature/service usage actions
- Changed `ResourceType.AI` actions from `{VIEW, CREATE}` to `{USE}`
- Added resource types: `WORKSPACE_ACTIVITY`, `PROJECT_ACTIVITY`, `PROJECT_MEMBER_ACTIVITY` (all VIEW-only)
- Added permission classes: `WorkspaceActivityPermissions`, `ProjectActivityPermissions`, `ProjectMemberActivityPermissions`
- Added grants in `system_roles.py`:
  - W-Admin: `WorkspaceActivityPermissions.VIEW` + `"project_activity:*"` + `"project_member_activity:*"` (project bypass)
  - W-Member: `WorkspaceActivityPermissions.VIEW`
  - P-Admin: `"project_activity:*"` + `"project_member_activity:*"`
  - P-Contributor/Commenter/Guest: `ProjectActivityPermissions.VIEW`

#### Group A: AI Endpoints

##### GPTIntegrationEndpoint (Unused)

**File:** `apps/api/plane/app/views/external/base.py`

| Method | URL Pattern                                                   | Old Permission                       | New Permission | Differences                         |
| ------ | ------------------------------------------------------------- | ------------------------------------ | -------------- | ----------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/ai-assistant/` | `@allow_permission([ADMIN, MEMBER])` | N/A — unused   | URL commented out; not called by FE |

> Not called by FE — only the workspace-level `WorkspaceGPTIntegrationEndpoint` is used. URL commented out in `external.py`. TODO added on view class.

##### WorkspaceGPTIntegrationEndpoint

**File:** `apps/api/plane/app/views/external/base.py`

| Method | URL Pattern                             | Old Permission                                  | New Permission                                           | Differences                                          |
| ------ | --------------------------------------- | ----------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/ai-assistant/` | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(AIPermissions.USE, resource_param="workspace_id")` | Exact parity — W-Admin+W-Member have `ai:*` wildcard |

##### RephraseGrammarEndpoint

**File:** `apps/api/plane/ee/views/app/ai/rephrase.py`

| Method | URL Pattern                                 | Old Permission                                     | New Permission                                           | Differences                                               |
| ------ | ------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/rephrase-grammar/` | `permission_classes = [WorkspaceEntityPermission]` | `@can(AIPermissions.USE, resource_param="workspace_id")` | Exact parity — `WorkspaceEntityPermission` = Admin+Member |

**Import cleanup:** Removed `WorkspaceEntityPermission`; added `AIPermissions, can`. Removed `permission_classes` class attribute.

#### Group B: Activity Endpoints

##### WorkspaceMemberActivityEndpoint

**File:** `apps/api/plane/ee/views/app/workspace/activity.py`

| Method | URL Pattern                                         | Old Permission                                  | New Permission                                                           | Differences    |
| ------ | --------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ | -------------- |
| `get`  | `GET /workspaces/<slug>/workspace-member-activity/` | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(WorkspaceActivityPermissions.VIEW, resource_param="workspace_id")` | Direct mapping |

**Import cleanup:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import WorkspaceActivityPermissions, can`.

##### ProjectActivityEndpoint

**File:** `apps/api/plane/ee/views/app/project/activity.py`

| Method | URL Pattern                                                      | Old Permission                                                                                 | New Permission                                                       | Differences                                                                                |
| ------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/project-activity/` | `permission_classes = [ProjectEntityPermission]` + `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectActivityPermissions.VIEW, resource_param="project_id")` | Removed both `permission_classes` and `@allow_permission`; all 4 project roles have access |

**Decorator ordering:** `@check_feature_flag` outermost → `@method_decorator(gzip_page)` → `@can` innermost.

##### ProjectMemberActivityEndpoint

**File:** `apps/api/plane/ee/views/app/project/activity.py`

| Method | URL Pattern                                                             | Old Permission               | New Permission                                                             | Differences              |
| ------ | ----------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- | ------------------------ |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/project-member-activity/` | `@allow_permission([ADMIN])` | `@can(ProjectMemberActivityPermissions.VIEW, resource_param="project_id")` | Admin-only; exact parity |

**Import cleanup:** Removed `from plane.app.permissions import (ProjectEntityPermission, allow_permission, ROLE,)`; added `from plane.permissions import ProjectActivityPermissions, ProjectMemberActivityPermissions, can`.

#### Group C: EE Project Worklogs

##### ProjectWorkLogsEndpoint

**File:** `apps/api/plane/ee/views/app/project/worklogs.py`

| Method | URL Pattern                                              | Old Permission               | New Permission                                                 | Differences              |
| ------ | -------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------- | ------------------------ |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/worklogs/` | `@allow_permission([ADMIN])` | `@can(ProjectPermissions.MANAGE, resource_param="project_id")` | Admin-only; exact parity |

##### ProjectExportWorkLogsEndpoint

**File:** `apps/api/plane/ee/views/app/project/worklogs.py`

| Method | URL Pattern                                                      | Old Permission               | New Permission                                                 | Differences              |
| ------ | ---------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------- | ------------------------ |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/export-worklogs/`  | `@allow_permission([ADMIN])` | `@can(ProjectPermissions.MANAGE, resource_param="project_id")` | Admin-only; exact parity |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/export-worklogs/` | `@allow_permission([ADMIN])` | `@can(ProjectPermissions.MANAGE, resource_param="project_id")` | Admin-only; exact parity |

**Import cleanup:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import ProjectPermissions, can`.

### IssueLinkViewSet

**File:** `apps/api/plane/app/views/issue/link.py`

| Method           | URL Pattern                                                                           | Old Permission                                                                | New Permission                                                                                            | Differences                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-links/`         | `permission_classes = [ProjectEntityPermission]` (any project member for GET) | `@can(WorkitemLinkPermissions.VIEW, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)`   | Checks `workitem_link:view` with parent issue lookup. Admin/Contributor/Commenter: unconditional. Guest: no access. |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-links/<pk>/`    | `permission_classes = [ProjectEntityPermission]` (any project member for GET) | `@can(WorkitemLinkPermissions.VIEW, resource_param="pk")`                                                 | Checks `workitem_link:view` at link level. Engine resolves link → issue → project → workspace.                      |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-links/`        | `permission_classes = [ProjectEntityPermission]` (ADMIN+MEMBER for POST)      | `@can(WorkitemLinkPermissions.CREATE, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Admin/Contributor: unconditional. Commenter/Guest: no access.                                                       |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-links/<pk>/`  | `permission_classes = [ProjectEntityPermission]` (ADMIN+MEMBER for PATCH)     | `@can(WorkitemLinkPermissions.EDIT, resource_param="pk")`                                                 | Engine resolves link → issue → project → workspace. Admin/Contributor: unconditional.                               |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-links/<pk>/` | `permission_classes = [ProjectEntityPermission]` (ADMIN+MEMBER for DELETE)    | `@can(WorkitemLinkPermissions.DELETE, resource_param="pk")`                                               | Engine resolves link → issue → project → workspace. Admin/Contributor: unconditional.                               |

> **Dedicated resource type:** Links now have their own `WORKITEM_LINK` resource type in `definitions.py` with a dedicated `WorkitemLinkPermissions` class. This allows independent access control for links separate from issue CRUD. The resource hierarchy has `workitem_link` as a child of `workitem`.
>
> **`scope_param_type=ResourceType.WORKITEM`:** Required because `resource_param="issue_id"` points to a workitem, not a workitem_link. The engine uses this to find the resource (issue) → walk up hierarchy → project → check role grants.
>
> **Role access:** Admin and Contributor have full CRUD (`workitem_link:*` / explicit grants). Commenter has VIEW only. Guest has no link access.
>
> **Import cleanup:** Replaced `from plane.permissions import can, WorkitemPermissions` with `from plane.permissions import can, WorkitemLinkPermissions` and added `from plane.permissions.definitions import ResourceType`.

### IssueRelationViewSet (superseded)

**File:** `apps/api/plane/app/views/issue/relation.py`

> **Superseded:** The original `IssueRelationViewSet` migration below has been replaced. The `WORKITEM_RELATION` resource was repurposed from project-scoped (child of WORKITEM) to workspace-scoped (child of WORKSPACE) — it now represents custom relation definitions, not issue-to-issue relations. Issue-to-issue relation endpoints now use `WorkitemPermissions` instead. See `WorkItemRelationDependencyViewSet`, `WorkItemRelationRelationViewSet`, and `WorkItemRelationDefinitionViewSet` below.

| Method            | URL Pattern                                                                        | Old Permission                                                                | New Permission                                                                                                | Differences                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `list`            | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-relation/`   | `permission_classes = [ProjectEntityPermission]` (any project member for GET) | `@can(WorkitemRelationPermissions.VIEW, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)`   | Checks `workitem_relation:view` with parent issue lookup. Admin/Contributor/Commenter: unconditional. Guest: no access. |
| `create`          | `POST /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-relation/`  | `permission_classes = [ProjectEntityPermission]` (ADMIN+MEMBER for POST)      | `@can(WorkitemRelationPermissions.CREATE, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Admin/Contributor: unconditional. Commenter/Guest: no access.                                                           |
| `remove_relation` | `POST /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/remove-relation/` | `permission_classes = [ProjectEntityPermission]` (ADMIN+MEMBER for POST)      | `@can(WorkitemRelationPermissions.DELETE, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Admin/Contributor: unconditional. Commenter/Guest: no access.                                                           |

> **Dedicated resource type:** Relations now have their own `WORKITEM_RELATION` resource type in `definitions.py` with a dedicated `WorkitemRelationPermissions` class. This allows independent access control for relations separate from issue CRUD. The resource hierarchy has `workitem_relation` as a child of `workitem`.
>
> **`scope_param_type=ResourceType.WORKITEM`:** Required because `resource_param="issue_id"` points to a workitem, not a workitem_relation. The engine uses this to find the resource (issue) → walk up hierarchy → project → check role grants.
>
> **Role access:** Admin and Contributor have full access (view/create/delete via `workitem_relation:*` / explicit grants). Commenter has VIEW only. Guest has no relation access.
>
> **No EDIT action:** Relations are created and removed, never edited — so `WORKITEM_RELATION` only has VIEW, CREATE, DELETE actions (no EDIT).
>
> **Import cleanup:** Replaced `from plane.app.permissions import ProjectEntityPermission` with `from plane.permissions import can, WorkitemRelationPermissions` and added `from plane.permissions.definitions import ResourceType`. Removed `permission_classes = [ProjectEntityPermission]`.

---

### IssueSubscriberViewSet — `issue/subscriber.py`

**File:** `plane/app/views/issue/subscriber.py`

**Pattern:** Partial migration — active endpoints migrated to `@can`, unused endpoints' URLs commented out.

**Unused endpoints (URLs commented out):**

- `list` — `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-subscribers/`
- `create` — `POST /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-subscribers/`
- `destroy` — `DELETE /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-subscribers/<subscriber_id>/`

These endpoints are not called by the frontend. Their URL definitions in `plane/app/urls/issue.py` have been commented out with a TODO note. The view methods (`list`, `destroy`, `perform_create`) retain TODO annotations for future migration.

**Active endpoints:**

| Action                | Method/URL                                                                     | Old Permission                                                     | New Permission                                                                                      | Notes                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `subscribe`           | `POST /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/subscribe/`   | `get_permissions()` → `ProjectLitePermission` (any project member) | `@can(WorkitemPermissions.VIEW, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Checks `workitem:view`. Admin/Contributor/Commenter: unconditional. Guest: own issues only (`workitem:view+creator`). |
| `unsubscribe`         | `DELETE /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/subscribe/` | `get_permissions()` → `ProjectLitePermission` (any project member) | `@can(WorkitemPermissions.VIEW, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Same as subscribe.                                                                                                    |
| `subscription_status` | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/subscribe/`    | `get_permissions()` → `ProjectLitePermission` (any project member) | `@can(WorkitemPermissions.VIEW, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Same as subscribe.                                                                                                    |

> **Why `workitem:view`?** Subscribing to an issue is semantically gated on being able to view it. No new `SUBSCRIBE` action is needed — `VIEW` is the correct permission level.
>
> **`scope_param_type=ResourceType.WORKITEM`:** Required because `model = IssueSubscriber` but `resource_param="issue_id"` points to a workitem (Issue). Without explicit lookup type, the engine would query `IssueSubscriber.objects.filter(id=<issue_id>)` instead of `Issue.objects.filter(id=<issue_id>)`, causing the guest conditional `workitem:view+creator` check to always fail. Same pattern as `IssueRelationViewSet`.
>
> **Guest access tightening (security improvement):** Old system (`ProjectLitePermission`) let any project member — including guests — subscribe to any issue. New system restricts guests to issues they created via `workitem:view+creator`. This closes a security gap where guests could subscribe to issues they couldn't view.
>
> **Import cleanup:** Replaced `from plane.app.permissions import ProjectEntityPermission, ProjectLitePermission` with `from plane.permissions import can, WorkitemPermissions` and added `from plane.permissions.definitions import ResourceType`. Removed `permission_classes = [ProjectEntityPermission]` and `get_permissions()` method.

---

### SubIssuesEndpoint — `issue/sub_issue.py`

**File:** `plane/app/views/issue/sub_issue.py`

| Method | URL Pattern                                                                   | Old Permission                                                  | New Permission                                              | Differences                                                                                                                                                                       |
| ------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/sub-issues/`  | `ProjectEntityPermission` (any project member for GET)          | `@can(WorkitemPermissions.VIEW, resource_param="issue_id")` | Guest access tightened — old system allowed any guest to list sub-issues of any issue; new system restricts guests to issues they created (`workitem:view+creator`).              |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/sub-issues/` | `ProjectEntityPermission` (ADMIN + MEMBER for POST, role >= 15) | `@can(WorkitemPermissions.EDIT, resource_param="issue_id")` | Commenter/Guest can now assign sub-issues to issues they created (`workitem:edit+creator`). Previously impossible since old Guest couldn't POST. Admin/Contributor: exact parity. |

> **Why `workitem:view` / `workitem:edit`?** Sub-issues are child workitems of a parent issue. Viewing them requires VIEW access on the parent issue; assigning sub-issues is an edit operation on the parent issue's relationships (same pattern as `CycleIssueViewSet` using `CyclePermissions.EDIT` for adding issues to a cycle).
>
> **No `scope_param_type` needed:** The `resource_param="issue_id"` maps directly to an `Issue` model instance, so the default workitem resource resolution works correctly without an explicit override.
>
> **Import cleanup:** Replaced `from plane.app.permissions import ProjectEntityPermission` with `from plane.permissions import can, WorkitemPermissions`. Removed `permission_classes = [ProjectEntityPermission]`.

---

### IssueSearchEndpoint — `search/issue.py`

**File:** `plane/app/views/search/issue.py`

| Method | URL Pattern                                                   | Old Permission                                             | New Permission                                                                       | Differences                                                                                                                                                                                                                 |
| ------ | ------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/search-issues/` | None (`IsAuthenticated` inherited from `BaseAPIView` only) | `@can(WorkitemPermissions.VIEW, resource_param="project_id", defer_conditions=True)` | **Security fix:** Old system had no permission gate — any authenticated user could hit this endpoint. New system requires project membership with `workitem:view`. Guest data filtering maintained via deferred conditions. |

> **Why `defer_conditions=True`?** Guest has `workitem:view+creator` conditional grant. This is a collection-level search endpoint — the condition can't be evaluated against a single issue. The decorator passes guests through and stores `'creator'` in `request.permission_conditions`, which the view uses to filter the queryset to `created_by=request.user`.
>
> **Inline role check replaced:** Old code checked `ProjectMember.objects.filter(project_id=project_id, member=user, is_active=True, role=5).exists()` to filter guests to own issues. Replaced with `getattr(self.request, "permission_conditions", ())` deferred conditions pattern. Same data-level filtering behavior, but driven by the permission system instead of a hardcoded role check.
>
> **`.accessible_to()` retained:** The queryset manager filter `.accessible_to(user_id, slug)` remains in place for cross-project data scoping when `workspace_search=true`. The `@can` decorator gates access on the URL's `project_id`; `.accessible_to()` handles which projects' data appears in results.
>
> **Import cleanup:** Removed `ProjectMember` from imports (only usage was the inline role check). Added `from plane.permissions import can, WorkitemPermissions`.

---

### WorkspaceFavoriteEndpoint — `workspace/favorite.py`

**File:** `plane/app/views/workspace/favorite.py`

| Method   | URL Pattern                                               | Old Permission                                  | New Permission                                                    | Differences                                                                |
| -------- | --------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/user-favorites/`                  | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(FavoritePermissions.VIEW, resource_param="workspace_id")`   | Exact parity — W-Owner/Admin/Member allowed, W-Guest denied                |
| `post`   | `POST /workspaces/<slug>/user-favorites/`                 | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(FavoritePermissions.CREATE, resource_param="workspace_id")` | Exact parity                                                               |
| `patch`  | `PATCH /workspaces/<slug>/user-favorites/<favorite_id>/`  | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(FavoritePermissions.EDIT, resource_param="favorite_id")`    | Exact parity — detail endpoint resolves favorite → workspace via hierarchy |
| `delete` | `DELETE /workspaces/<slug>/user-favorites/<favorite_id>/` | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(FavoritePermissions.DELETE, resource_param="favorite_id")`  | Exact parity                                                               |

> **New resource type:** Created `FAVORITE` resource type (`favorite:view`, `favorite:create`, `favorite:edit`, `favorite:delete`) as favorites had no existing permission type. Added to `definitions.py`, `inheritance.py` (child of workspace), `engine.py` (maps to `UserFavorite` model), and `system_roles.py`.
>
> **Role grants:** W-Owner gets access via `"*"` wildcard. W-Admin gets `"favorite:*"`. W-Member gets explicit `favorite:view`, `favorite:create`, `favorite:edit`, `favorite:delete`. W-Guest has no grants (no access — matches old behavior).
>
> **Import cleanup:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import can, FavoritePermissions`.

---

### WorkspaceFavoriteGroupEndpoint — `workspace/favorite.py`

**File:** `plane/app/views/workspace/favorite.py`

| Method | URL Pattern                                                  | Old Permission                                  | New Permission                                                 | Differences                                                                |
| ------ | ------------------------------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/user-favorites/<favorite_id>/group/` | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(FavoritePermissions.VIEW, resource_param="favorite_id")` | Exact parity — detail endpoint resolves favorite → workspace via hierarchy |

> **Data-level filter preserved:** The inline `Q(project__project_projectmember__member=request.user)` filter in the queryset is a data-level filter (not a permission gate). It ensures users only see favorites for projects they are members of. This filter is preserved as-is — it operates independently of the `@can` permission check.

---

### IssueViewEEViewSet

**File:** `apps/api/plane/ee/views/app/views/project.py`

| Method   | URL Pattern                                                        | Old Permission                                   | New Permission                                            | Differences                                                                       |
| -------- | ------------------------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `lock`   | `POST /workspaces/<slug>/projects/<project_id>/views/<pk>/lock/`   | `permission_classes = [ProjectEntityPermission]` | `@can(WorkitemViewPermissions.EDIT, resource_param="pk")` | Parity: old Admin+Member → new Admin+Contributor (both have `workitem_view:edit`) |
| `unlock` | `DELETE /workspaces/<slug>/projects/<project_id>/views/<pk>/lock/` | `permission_classes = [ProjectEntityPermission]` | `@can(WorkitemViewPermissions.EDIT, resource_param="pk")` | Same as `lock`                                                                    |
| `access` | `POST /workspaces/<slug>/projects/<project_id>/views/<pk>/access/` | `permission_classes = [ProjectEntityPermission]` | `@can(WorkitemViewPermissions.EDIT, resource_param="pk")` | Same as `lock`; `@check_feature_flag(VIEW_ACCESS_PRIVATE)` above `@can`           |

> **Inline owner check preserved:** `access` method retains `if issue_view.owned_by != request.user` check — only the view owner can change access. This is a business rule, not a permission gate.
>
> **Import cleanup:** Replaced `from plane.app.permissions import ProjectEntityPermission` with `from plane.permissions import can, WorkitemViewPermissions`. Removed `permission_classes` attribute.

---

### WorkspaceViewEEViewSet

**File:** `apps/api/plane/ee/views/app/views/workspace.py`

| Method   | URL Pattern                                  | Old Permission                                     | New Permission                                                     | Differences                                                                                   |
| -------- | -------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `lock`   | `POST /workspaces/<slug>/views/<pk>/lock/`   | `permission_classes = [WorkspaceEntityPermission]` | `@can(WorkspaceWorkitemViewPermissions.EDIT, resource_param="pk")` | Parity: old Admin+Member → new W-Owner/W-Admin (wildcard) + W-Member (`+creator` conditional) |
| `unlock` | `DELETE /workspaces/<slug>/views/<pk>/lock/` | `permission_classes = [WorkspaceEntityPermission]` | `@can(WorkspaceWorkitemViewPermissions.EDIT, resource_param="pk")` | Same as `lock`                                                                                |
| `access` | `POST /workspaces/<slug>/views/<pk>/access/` | `permission_classes = [WorkspaceEntityPermission]` | `@can(WorkspaceWorkitemViewPermissions.EDIT, resource_param="pk")` | Same as `lock`; `@check_feature_flag(VIEW_ACCESS_PRIVATE)` above `@can`                       |

> **Inline owner checks preserved:** All three methods retain `if workspace_view.owned_by != request.user` — only the view owner can lock/unlock/change access. These are business rules, not permission gates. Follows the same pattern as `WorkspaceViewViewSet.partial_update`.
>
> **Import cleanup:** Replaced `from plane.app.permissions import WorkspaceEntityPermission` with `from plane.permissions import can, WorkspaceWorkitemViewPermissions`. Removed `permission_classes` attribute.

---

### IssueViewsPublishEndpoint

**File:** `apps/api/plane/ee/views/app/views/publish.py`

| Method   | URL Pattern                                                           | Old Permission                                   | New Permission                                               | Differences                                                                          |
| -------- | --------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/views/<pk>/publish/`   | `permission_classes = [ProjectMemberPermission]` | `@can(WorkitemViewPermissions.PUBLISH, resource_param="pk")` | Parity: old Admin+Member → new Admin+Contributor (both have `workitem_view:publish`) |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/views/<pk>/publish/`  | `permission_classes = [ProjectMemberPermission]` | `@can(WorkitemViewPermissions.PUBLISH, resource_param="pk")` | Same as `post`                                                                       |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/views/<pk>/publish/`    | `permission_classes = [ProjectMemberPermission]` | `@can(WorkitemViewPermissions.PUBLISH, resource_param="pk")` | Same as `post`                                                                       |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/views/<pk>/publish/` | `permission_classes = [ProjectMemberPermission]` | `@can(WorkitemViewPermissions.PUBLISH, resource_param="pk")` | Same as `post`                                                                       |

> **Feature flag:** All methods have `@check_feature_flag(FeatureFlag.VIEW_PUBLISH)` stacked above `@can` (outermost runs first).
>
> **Inline owner check preserved:** `post` method retains `if request.user != issue_view.owned_by` — only the view owner can publish. This is a business rule, not a permission gate.
>
> **Import cleanup:** Removed `ProjectMemberPermission` from imports (replaced with `from plane.permissions import can, WorkitemViewPermissions`). Kept `WorkSpaceAdminPermission` import for `WorkspaceViewsPublishEndpoint` (unused endpoint, not migrated).
>
> **WorkspaceViewsPublishEndpoint:** Marked as unused — not routed in URL config, not called by FE. Added TODO comment on the class: `# TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.`

---

### IntakeFormWorkitemTypeEndpoint

**File:** `apps/api/plane/ee/views/app/intake/form.py`

| Method   | URL Pattern                                                          | Old Permission                                     | New Permission                                                   | Differences                                                                     |
| -------- | -------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/intake-forms/`         | `@allow_permission([ROLE.ADMIN], level="PROJECT")` | `@can(IntakePermissions.CONFIGURE, resource_param="project_id")` | Parity: old ADMIN-only → new `intake:configure` via P-Admin `intake:*` wildcard |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/intake-forms/<pk>/`    | `@allow_permission([ROLE.ADMIN], level="PROJECT")` | `@can(IntakePermissions.CONFIGURE, resource_param="project_id")` | Same as above                                                                   |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/intake-forms/`        | `@allow_permission([ROLE.ADMIN], level="PROJECT")` | `@can(IntakePermissions.CONFIGURE, resource_param="project_id")` | Same as above                                                                   |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/intake-forms/<pk>/`  | `@allow_permission([ROLE.ADMIN], level="PROJECT")` | `@can(IntakePermissions.CONFIGURE, resource_param="project_id")` | Same as above                                                                   |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/intake-forms/<pk>/` | `@allow_permission([ROLE.ADMIN], level="PROJECT")` | `@can(IntakePermissions.CONFIGURE, resource_param="project_id")` | Same as above                                                                   |

> **Feature flag:** All methods have `@check_feature_flag(FeatureFlag.WORKITEM_TYPE_INTAKE_FORM)` stacked above `@can` (outermost runs first). Reordered from old code where `@allow_permission` was above `@check_feature_flag`.
>
> **Import cleanup:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import can, IntakePermissions`.
>
> **Why `resource_param="project_id"`:** `IntakeForm` is not registered in the permission engine's resource model map. Using `project_id` resolves via the project hierarchy. All methods are admin-level configuration so project scope is correct.
>
> **Why `CONFIGURE`:** All 4 methods were `[ROLE.ADMIN]` only — this is intake form configuration, not intake issue CRUD. `intake:configure` is only available to P-Admin (via `intake:*` wildcard). No other role has it. Exact parity.

---

### IntakeSettingEndpoint

**File:** `apps/api/plane/ee/views/app/intake/base.py`

| Method  | URL Pattern                                                       | Old Permission                                                              | New Permission                                                                     | Differences                                                                                                                                                                           |
| ------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`   | `GET /workspaces/<slug>/projects/<project_id>/intake-settings/`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")` | `@can(IntakePermissions.VIEW, resource_param="project_id", defer_conditions=True)` | Parity: any role with `intake:view` (unconditional or conditional) reads settings. P-Guest's `+creator` condition is deferred, then discarded in the view — settings aren't per-item. |
| `patch` | `PATCH /workspaces/<slug>/projects/<project_id>/intake-settings/` | `@allow_permission([ROLE.ADMIN], level="PROJECT")`                          | `@can(IntakePermissions.CONFIGURE, resource_param="project_id")`                   | Exact parity: Admin-only via `intake:*` wildcard                                                                                                                                      |

> **`ROLE` import retained:** `ROLE.ADMIN.value` is used in `create_intake_user_bot` for setting membership role values when creating the intake bot user. This is business logic, not permission checking.
>
> **Feature flag reorder:** `@check_feature_flag` decorators moved above `@can` (outermost runs first) so feature flags are checked before permission evaluation.
>
> **GET uses `intake:view` with `defer_conditions=True`:** A plain `@can(IntakePermissions.VIEW)` breaks P-Guest — guest holds `intake:view+creator`, and at project scope the engine evaluates creator against `Project.created_by_id` (guest is never the project creator) → 403. `defer_conditions=True` lets the engine pass conditional grants through the gate (intake is a child of project in the hierarchy, so `is_child_of` holds) and hands the condition to the view. The view calls `get_permission_conditions(request)` purely to satisfy `finalize_response`'s consumption check — the settings endpoint returns a single project-level config document, so there is no row to filter. We stick with `intake:view` (not `intake:submit`) because custom permission schemes may grant intake read access without granting submit, and `intake:view` is the canonical read gate.
>
> **Why `resource_param="project_id"`:** `IntakeSetting` is not registered in the permission engine's resource model map. Using `project_id` resolves via the project hierarchy. Both methods are project-scoped.

---

### IntakeResponsibilityEndpoint

**File:** `apps/api/plane/ee/views/app/intake/responsibility.py`

| Method   | URL Pattern                                                                          | Old Permission                                                  | New Permission                                                   | Differences                                                                    |
| -------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/intake-responsibilities/`             | `@allow_permission([ROLE.ADMIN], level="PROJECT")`              | `@can(IntakePermissions.CONFIGURE, resource_param="project_id")` | Exact parity: Admin-only via `intake:*` wildcard                               |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/intake-responsibilities/`              | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")` | `@can(IntakePermissions.VIEW, resource_param="project_id")`      | P-Commenter gains access. FE guards via `project:manage`.                      |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/intake-responsibilities/<user_id>/` | `@allow_permission([ROLE.ADMIN], level="PROJECT")`              | ⏸ URL commented out — unused by FE                               | POST replaces entire list atomically. DELETE URL commented out in `intake.py`. |

> **Feature flag reorder:** `@check_feature_flag(FeatureFlag.INTAKE_RESPONSIBILITY)` moved above `@can` on `post` and `get` (outermost runs first) so feature flags are checked before permission evaluation.
>
> **Import cleanup:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import can, IntakePermissions`.
>
> **DELETE — Unused Endpoint Protocol:** DELETE is not called by FE — POST replaces the entire responsibility list atomically. URL commented out in `intake.py`. Decorators removed from `delete` method; TODO comment added.
>
> **GET access broadening (P-Commenter):** Old `[ADMIN, MEMBER]` = Admin + Member. New: P-Admin (`intake:*` ✅), P-Contributor (`intake:view` ✅), P-Commenter (`intake:view` ✅), P-Guest (❌). Minor broadening — P-Commenter gains access. Safe because FE calls from settings page guarded by `project:manage` (admin-only).
>
> **Why `resource_param="project_id"`:** `IntakeResponsibility` is not registered in the permission engine's resource model map. Using `project_id` resolves via the project hierarchy. Both active methods are project-scoped.

---

### ProjectInTakePublishViewSet

**File:** `apps/api/plane/ee/views/app/intake/publish.py`

| Method       | URL Pattern                                                                       | Old Permission                                   | New Permission                                                   | Differences                                                                                   |
| ------------ | --------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `regenerate` | `POST /workspaces/<slug>/projects/<project_id>/publish-intake-regenerate/<type>/` | `permission_classes = [ProjectMemberPermission]` | `@can(IntakePermissions.CONFIGURE, resource_param="project_id")` | Access narrowing: old workspace admin+member → now admin-only. FE already restricts to admin. |

> **Import cleanup:** Replaced `from plane.ee.permissions import ProjectMemberPermission` with `from plane.permissions import can, IntakePermissions`.
>
> **Feature flag reorder:** `@check_feature_flag` decorators kept above `@can` (outermost runs first) so feature flags are checked before permission evaluation.
>
> **Access narrowing:** Old `ProjectMemberPermission` for POST allowed any workspace member with role in [ADMIN, MEMBER]. New: P-Admin (`intake:*` ✅), W-Owner (`*` ✅), W-Admin (`intake:*` ✅). P-Contributor/Commenter/Guest: ❌. FE already restricts to `EUserProjectRoles.ADMIN` only. Safe.
>
> **Why `resource_param="project_id"`:** `DeployBoard` and `IntakeEmail` are not registered in the permission engine's resource model map. Using `project_id` resolves via the project hierarchy. Consistent with all other intake migrations.

---

### IntakeFormRegenerateViewSet

**File:** `apps/api/plane/ee/views/app/intake/publish.py`

| Method | URL Pattern                                                                  | Old Permission                                   | New Permission                                                   | Differences                                                                                                                       |
| ------ | ---------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/intake-forms/<pk>/regenerate/` | `permission_classes = [ProjectMemberPermission]` | `@can(IntakePermissions.CONFIGURE, resource_param="project_id")` | Access narrowing: any project member → admin-only. GET is actually a mutation (regenerates anchor). FE calls from admin settings. |

> **Significant access narrowing:** Old `ProjectMemberPermission` for GET/SAFE allowed any project member (including Guest). New: P-Admin (`intake:*` ✅), W-Owner (`*` ✅), W-Admin (`intake:*` ✅). P-Contributor/Commenter/Guest: ❌. Despite being a GET, this endpoint is a mutation (regenerates the form anchor). CONFIGURE is the correct permission. FE calls from settings page (admin-only). Safe.
>
> **Why `resource_param="project_id"`:** `IntakeForm` is not registered in the permission engine's resource model map. Using `project_id` resolves via the project hierarchy.

---

### ProjectAdvanceAnalyticsEndpoint

**File:** `apps/api/plane/app/views/analytic/project_analytics.py`

| Method | URL Pattern                                        | Old Permission                                 | New Permission                                                        | Differences                        |
| ------ | -------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------- |
| `get`  | `GET .../projects/<project_id>/advance-analytics/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(ProjectAnalyticsPermissions.VIEW, resource_param="project_id")` | Exact parity: Admin + Contributor. |

### ProjectAdvanceAnalyticsStatsEndpoint

**File:** `apps/api/plane/app/views/analytic/project_analytics.py`

| Method | URL Pattern                                              | Old Permission                                 | New Permission                                                        | Differences                        |
| ------ | -------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------- |
| `get`  | `GET .../projects/<project_id>/advance-analytics-stats/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(ProjectAnalyticsPermissions.VIEW, resource_param="project_id")` | Exact parity: Admin + Contributor. |

### ProjectAdvanceAnalyticsChartEndpoint

**File:** `apps/api/plane/app/views/analytic/project_analytics.py`

| Method | URL Pattern                                               | Old Permission                                             | New Permission                                                        | Differences                                                                                                 |
| ------ | --------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `get`  | `GET .../projects/<project_id>/advance-analytics-charts/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(ProjectAnalyticsPermissions.VIEW, resource_param="project_id")` | Access narrowing: old GUEST included → new Commenter/Guest excluded. FE analytics page is workspace-scoped. |

> **New resource type:** Created `ResourceType.PROJECT_ANALYTICS` to separate project-scoped analytics from workspace-scoped `AnalyticsPermissions`. Project analytics lives in `PROJECT_RESOURCE_TYPES`, workspace analytics stays in `WORKSPACE_RESOURCE_TYPES`.
>
> **Why `resource_param="project_id"`:** `project_analytics` has no model in the engine's resource model map. The decorator auto-detects `effective_lookup_type="project"` from the param name, so the engine checks tuples at the project level.
>
> **Import cleanup:** Replaced `from plane.app.permissions import ROLE, allow_permission` with `from plane.permissions import can, ProjectAnalyticsPermissions`.

---

### EpicMetaListEndpoint

**File:** `apps/api/plane/ee/views/app/epic/base.py`

| Method | URL Pattern                                 | Old Permission                                             | New Permission                                            | Differences                                                    |
| ------ | ------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| `get`  | `GET .../projects/<project_id>/epics/meta/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicPermissions.VIEW, resource_param="project_id")` | Access narrowing: P-Guest loses access (no `epic:view` grant). |

---

### EpicUserDisplayPropertyEndpoint

**File:** `apps/api/plane/ee/views/app/epic/base.py`

| Method  | URL Pattern                                              | Old Permission                                             | New Permission                                            | Differences                                                                       |
| ------- | -------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `patch` | `PATCH .../projects/<project_id>/epics-user-properties/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicPermissions.VIEW, resource_param="project_id")` | `VIEW` is correct — updates user's own display preferences. P-Guest loses access. |
| `get`   | `GET .../projects/<project_id>/epics-user-properties/`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicPermissions.VIEW, resource_param="project_id")` | Access narrowing: P-Guest loses access.                                           |

> **Feature flag reorder:** `@check_feature_flag(FeatureFlag.EPICS)` moved above `@can` (outermost runs first) so feature flags are checked before permission evaluation.

---

### EpicAnalyticsEndpoint

**File:** `apps/api/plane/ee/views/app/epic/base.py`

| Method | URL Pattern                                                | Old Permission                                                                | New Permission                                         | Differences                                                                    |
| ------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `get`  | `GET .../projects/<project_id>/epics/<epic_id>/analytics/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(EpicPermissions.VIEW, resource_param="epic_id")` | Level changed: WORKSPACE → project-scoped via `epic_id`. P-Guest loses access. |

> **Level change:** Old `level="WORKSPACE"` was overly broad — this is a per-epic, per-project endpoint. Changed to project-scoped with `resource_param="epic_id"`.

---

### EpicDetailEndpoint

**File:** `apps/api/plane/ee/views/app/epic/base.py`

| Method | URL Pattern                                   | Old Permission                                             | New Permission                                            | Differences                             |
| ------ | --------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| `get`  | `GET .../projects/<project_id>/epics-detail/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicPermissions.VIEW, resource_param="project_id")` | Access narrowing: P-Guest loses access. |

---

### WorkspaceEpicEndpoint

**File:** `apps/api/plane/ee/views/app/epic/base.py`

| Method | URL Pattern                        | Old Permission                                                    | New Permission                                                   | Differences                                                                                            |
| ------ | ---------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `get`  | `GET .../epics/` (workspace-level) | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Access broadening: W-Guest gains gate access. Safe — `.accessible_to()` filters by project membership. |

> **Workspace-scoped endpoint** (no `project_id` in URL). Same pattern as `WorkspaceCyclesEndpoint`, `WorkspaceModulesEndpoint`, `WorkspaceStatesEndpoint`.
>
> **Access broadening (W-Guest):** Old `[ADMIN, MEMBER]` excluded W-Guest. New `WorkspacePermissions.VIEW` includes W-Guest. Safe — `.accessible_to()` inline filter scopes results to projects the user is a member of, and project guests have no `epic:view` grants so the queryset returns empty results.

---

### EpicListAnalyticsEndpoint

**File:** `apps/api/plane/ee/views/app/epic/base.py`

| Method | URL Pattern                                     | Old Permission                                             | New Permission                                            | Differences                             |
| ------ | ----------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| `get`  | `GET .../projects/<project_id>/epic-analytics/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicPermissions.VIEW, resource_param="project_id")` | Access narrowing: P-Guest loses access. |

---

### EpicMetaEndpoint

**File:** `apps/api/plane/ee/views/app/epic/base.py`

| Method | URL Pattern                                           | Old Permission                                                              | New Permission                                         | Differences                             |
| ------ | ----------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------- |
| `get`  | `GET .../projects/<project_id>/epics/<epic_id>/meta/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")` | `@can(EpicPermissions.VIEW, resource_param="epic_id")` | Access narrowing: P-Guest loses access. |

---

### EpicDescriptionVersionEndpoint

**File:** `apps/api/plane/ee/views/app/epic/base.py`

| Method | URL Pattern                                                                  | Old Permission                                             | New Permission                                         | Differences                              |
| ------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| `get`  | `GET .../projects/<project_id>/epics/<epic_id>/description-versions/[<pk>/]` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(EpicPermissions.VIEW, resource_param="epic_id")` | Dead code removed. P-Guest loses access. |

> **Dead code removal:** Inline `guest_view_all_features` check (lines 954-972 in old code) removed. After migration: P-Guest (5) has no `EpicPermissions.VIEW` → blocked by `@can` before reaching inline check. P-Commenter (10) has `EpicPermissions.VIEW` → passes `@can`, but is not `role=GUEST.value` (5) so inline condition never triggered. The `Project.objects.get(pk=project_id)` and `Issue.objects.get(...)` lookups were only needed for the inline check and have been removed.
>
> **Import cleanup:** Removed `check_if_current_user_is_teamspace_member` import — only used in the removed dead code block.
>
> **Import cleanup (file-level):** Replaced `from plane.app.permissions import allow_permission, ROLE` with addition of `WorkspacePermissions` to existing `from plane.permissions import can, EpicPermissions, ProjectPermissions` import. Old import removed entirely — no remaining usages.
>
> **Feature flag reorder:** On views where `@allow_permission` was outermost and `@check_feature_flag` was inner, decorators reordered so `@check_feature_flag` is outermost (runs first) and `@can` is inner. This ensures feature flag check happens before permission evaluation.
>
> **Access narrowing (P-Guest) on all project-level views:** Old `[ADMIN, MEMBER, GUEST]` included all project roles. New: P-Admin (`epic:*` ✅), P-Contributor (`epic:view` ✅), P-Commenter (`epic:view` ✅), P-Guest (no epic grants ❌). Guest maps to old `guest_view_all_features=false`, which had inline restrictions. This tightens access for a role that was borderline.

---

### Initiative Batch Migration (2026-02-21)

> **New resource types:** `INITIATIVE_LINK`, `INITIATIVE_UPDATE`, `INITIATIVE_UPDATE_COMMENT` added to `definitions.py`, `inheritance.py`, `engine.py`, `system_roles.py`. Follows `EPIC_LINK` / `EPIC_UPDATE` / `EPIC_UPDATE_COMMENT` precedents.
>
> **W-Admin grants:** `"initiative_link:*"`, `"initiative_update:*"`, `"initiative_update_comment:*"` (wildcards).
>
> **W-Member grants:** `InitiativeLinkPermissions.VIEW/CREATE/EDIT/DELETE`, `InitiativeUpdatePermissions.VIEW/REACT`, `InitiativeUpdateCommentPermissions.CREATE/REACT`.
>
> **W-Guest:** No grants for any initiative resource — access narrowing from old `[ADMIN, MEMBER, GUEST]` on reactions.

### InitiativeReactionViewSet

**File:** `apps/api/plane/ee/views/app/initiative/reaction.py`

| Method    | URL Pattern                                                                  | Old Permission                                             | New Permission                                                      | Differences                                   |
| --------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------- |
| `list`    | `GET .../workspaces/<slug>/initiatives/<initiative_id>/reactions/`           | _(implicit, no perm)_                                      | `@can(InitiativePermissions.VIEW, resource_param="initiative_id")`  | Added explicit list override with VIEW check. |
| `create`  | `POST .../workspaces/<slug>/initiatives/<initiative_id>/reactions/`          | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(InitiativePermissions.REACT, resource_param="initiative_id")` | W-Guest loses access (no initiative grants).  |
| `destroy` | `DELETE .../workspaces/<slug>/initiatives/<initiative_id>/reactions/<code>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(InitiativePermissions.REACT, resource_param="initiative_id")` | W-Guest loses access.                         |

### InitiativeLabelsEndpoint

**File:** `apps/api/plane/ee/views/app/initiative/label.py`

| Method   | URL Pattern                                                  | Old Permission                                             | New Permission                                                      | Differences                                                                   |
| -------- | ------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `get`    | `GET .../workspaces/<slug>/initiative-labels/`               | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(InitiativePermissions.VIEW, resource_param="workspace_id")`   | W-Guest loses access.                                                         |
| `post`   | `POST .../workspaces/<slug>/initiative-labels/`              | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`             | `@can(InitiativePermissions.MANAGE, resource_param="workspace_id")` | W-Member loses CUD (MANAGE is admin-only, matching workspace labels pattern). |
| `patch`  | `PATCH .../workspaces/<slug>/initiative-labels/<label_id>/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`             | `@can(InitiativePermissions.MANAGE, resource_param="workspace_id")` | W-Member loses access.                                                        |
| `delete` | `DELETE .../workspaces/<slug>/initiative-labels/<label_id>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`             | `@can(InitiativePermissions.MANAGE, resource_param="workspace_id")` | W-Member loses access.                                                        |

### InitiativeLinkViewSet

**File:** `apps/api/plane/ee/views/app/initiative/link.py`

| Method           | URL Pattern                                                            | Old Permission                                 | New Permission                                                                                                     | Differences                                                 |
| ---------------- | ---------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `list`           | `GET .../workspaces/<slug>/initiatives/<initiative_id>/links/`         | `WorkspaceEntityPermission` (DRF class)        | `@can(InitiativeLinkPermissions.VIEW, resource_param="initiative_id", scope_param_type=ResourceType.INITIATIVE)`   | Added explicit list override. `permission_classes` removed. |
| `create`         | `POST .../workspaces/<slug>/initiatives/<initiative_id>/links/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(InitiativeLinkPermissions.CREATE, resource_param="initiative_id", scope_param_type=ResourceType.INITIATIVE)` | Parity: W-Admin ✅, W-Member ✅.                            |
| `partial_update` | `PATCH .../workspaces/<slug>/initiatives/<initiative_id>/links/<pk>/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(InitiativeLinkPermissions.EDIT, resource_param="pk")`                                                        | Instance-level check on pk.                                 |
| `destroy`        | `DELETE .../workspaces/<slug>/initiatives/<initiative_id>/links/<pk>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(InitiativeLinkPermissions.DELETE, resource_param="pk")`                                                      | Instance-level check on pk.                                 |

> **Import cleanup:** Removed `WorkspaceEntityPermission` import and `permission_classes` attribute. Removed `allow_permission, ROLE` import.

### InitiativeUpdateViewSet

**File:** `apps/api/plane/ee/views/app/initiative/update.py`

| Method | URL Pattern                                                                      | Old Permission                                 | New Permission                                                                                                     | Differences |
| ------ | -------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------- |
| `get`  | `GET .../workspaces/<slug>/initiatives/<initiative_id>/updates/?search=<status>` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(InitiativeUpdatePermissions.VIEW, resource_param="initiative_id", scope_param_type=ResourceType.INITIATIVE)` | Parity.     |

### InitiativeUpdateCommentsViewSet

**File:** `apps/api/plane/ee/views/app/initiative/update.py`

| Method | URL Pattern                                                                            | Old Permission                                 | New Permission                                                                                                              | Differences           |
| ------ | -------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `get`  | `GET .../workspaces/<slug>/initiatives/<initiative_id>/updates/<update_id>/comments/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(InitiativeUpdatePermissions.VIEW, resource_param="initiative_id", scope_param_type=ResourceType.INITIATIVE)`          | Read comments = VIEW. |
| `post` | `POST .../workspaces/<slug>/initiatives/<initiative_id>/updates/<update_id>/comments/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(InitiativeUpdateCommentPermissions.CREATE, resource_param="initiative_id", scope_param_type=ResourceType.INITIATIVE)` | Parity.               |

### InitiativeUpdatesReactionViewSet

**File:** `apps/api/plane/ee/views/app/initiative/update.py`

| Method   | URL Pattern                                                                                               | Old Permission                                 | New Permission                                                                                                      | Differences |
| -------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------- |
| `post`   | `POST .../workspaces/<slug>/initiatives/<initiative_id>/updates/<update_id>/reactions/`                   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(InitiativeUpdatePermissions.REACT, resource_param="initiative_id", scope_param_type=ResourceType.INITIATIVE)` | Parity.     |
| `delete` | `DELETE .../workspaces/<slug>/initiatives/<initiative_id>/updates/<update_id>/reactions/<reaction_code>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(InitiativeUpdatePermissions.REACT, resource_param="initiative_id", scope_param_type=ResourceType.INITIATIVE)` | Parity.     |

### InitiativeUserPropertiesEndpoint

**File:** `apps/api/plane/ee/views/app/initiative/user_properties.py`

| Method  | URL Pattern                                               | Old Permission                          | New Permission                                                    | Differences                                                           |
| ------- | --------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| `get`   | `GET .../workspaces/<slug>/initiative-user-properties/`   | `WorkspaceEntityPermission` (DRF class) | `@can(InitiativePermissions.VIEW, resource_param="workspace_id")` | `permission_classes` removed. Added `@check_feature_flag`. Parity.    |
| `patch` | `PATCH .../workspaces/<slug>/initiative-user-properties/` | `WorkspaceEntityPermission` (DRF class) | `@can(InitiativePermissions.VIEW, resource_param="workspace_id")` | VIEW for PATCH — personal settings only. Added `@check_feature_flag`. |

> **Import cleanup:** Removed `WorkspaceEntityPermission` import and `permission_classes` attribute. Added `@check_feature_flag(FeatureFlag.INITIATIVES)` to both methods (was missing before — other initiative views have it).

### WorkspaceDraftIssueViewSet

**File:** `apps/api/plane/app/views/workspace/draft.py`

**New resource type:** `WORKSPACE_DRAFT` added to `definitions.py`, `inheritance.py`, `engine.py`, `system_roles.py`.

| Method                  | URL Pattern                                          | Old Permission                                                  | New Permission                                                          | Differences                                                                                                     |
| ----------------------- | ---------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `list`                  | `GET /workspaces/<slug>/draft-issues/`               | `@allow_permission([ADMIN, MEMBER, GUEST], WORKSPACE)`          | `@can(WorkspaceDraftPermissions.VIEW, resource_param="workspace_id")`   | Now checks `workspace_draft:view`; all workspace roles granted                                                  |
| `create`                | `POST /workspaces/<slug>/draft-issues/`              | `@allow_permission([ADMIN, MEMBER, GUEST], WORKSPACE)`          | `@can(WorkspaceDraftPermissions.CREATE, resource_param="workspace_id")` | Now checks `workspace_draft:create`; all workspace roles granted                                                |
| `retrieve`              | `GET /workspaces/<slug>/draft-issues/<pk>/`          | `@allow_permission([ADMIN], creator=True, model=Issue)`         | `@can(WorkspaceDraftPermissions.VIEW, resource_param="pk")`             | **Security fix**: membership always verified. All roles have VIEW; queryset scopes to own drafts                |
| `partial_update`        | `PATCH /workspaces/<slug>/draft-issues/<pk>/`        | `@allow_permission([ADMIN, MEMBER], creator=True, model=Issue)` | `@can(WorkspaceDraftPermissions.EDIT, resource_param="pk")`             | **Security fix**: membership always verified. All roles have EDIT; queryset scopes to own drafts                |
| `destroy`               | `DELETE /workspaces/<slug>/draft-issues/<pk>/`       | `@allow_permission([ADMIN], creator=True, model=DraftIssue)`    | `@can(WorkspaceDraftPermissions.DELETE, resource_param="pk")`           | **Security fix**: membership always verified. Admin: unconditional delete. Member/Guest: `+creator` conditional |
| `create_draft_to_issue` | `POST /workspaces/<slug>/draft-to-issue/<draft_id>/` | `@allow_permission([ADMIN, MEMBER], WORKSPACE)`                 | `@can(WorkspaceDraftPermissions.MANAGE, resource_param="draft_id")`     | Now checks `workspace_draft:manage`; guest excluded (parity)                                                    |

**Notes:**

- Old code had `creator=True, model=Issue` on retrieve/partial_update — the model should have been `DraftIssue` (bug in old code, but functionally equivalent since both inherit `created_by`).
- All list/retrieve/update methods filter by `created_by=request.user` in the queryset — this data-level scoping is unchanged.
- `destroy` does not filter by `created_by` — admin can delete any draft (matches old behavior where ADMIN role passes unconditionally). Member/Guest require `+creator` conditional grant.

### WorkspaceInvitationsViewset

**File:** `apps/api/plane/app/views/workspace/invite.py`

| Method           | URL Pattern                                   | Old Permission                                    | New Permission                                                           | Differences                                                 |
| ---------------- | --------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/invitations/`         | `permission_classes = [WorkspaceOwnerPermission]` | `@can(WorkspaceMemberPermissions.INVITE, resource_param="workspace_id")` | Parity. Override added for inherited method.                |
| `create`         | `POST /workspaces/<slug>/invitations/`        | `permission_classes = [WorkspaceOwnerPermission]` | `@can(WorkspaceMemberPermissions.INVITE, resource_param="workspace_id")` | Parity. Inline role hierarchy + seat limit checks retained. |
| `retrieve`       | `GET /workspaces/<slug>/invitations/<pk>/`    | `permission_classes = [WorkspaceOwnerPermission]` | `@can(WorkspaceMemberPermissions.INVITE, resource_param="workspace_id")` | Parity. Override added for inherited method.                |
| `partial_update` | `PATCH /workspaces/<slug>/invitations/<pk>/`  | `permission_classes = [WorkspaceOwnerPermission]` | `@can(WorkspaceMemberPermissions.INVITE, resource_param="workspace_id")` | Parity. Inline seat limit check retained.                   |
| `destroy`        | `DELETE /workspaces/<slug>/invitations/<pk>/` | `permission_classes = [WorkspaceOwnerPermission]` | `@can(WorkspaceMemberPermissions.INVITE, resource_param="workspace_id")` | Parity.                                                     |

**Notes:**

- Class-level `permission_classes = [WorkspaceOwnerPermission]` removed. All methods now use `@can` decorator.
- `resource_param="workspace_id"` used for all methods (including detail) because `WorkspaceMemberInvite` is not in the engine's model map and invitation management is a workspace-level privilege.
- Inline role hierarchy check (create: "cannot invite higher role") and seat limit checks (create, partial_update) retained — these are business logic independent of the permission system.
- `WorkspaceJoinEndpoint` and `UserWorkspaceInvitationsViewSet` in the same file are NOT part of this migration (separate viewsets with different permission patterns).

### AutomationEndpoint

**File:** `apps/api/plane/ee/views/app/automation/base.py`

| Method   | URL Pattern                                                         | Old Permission                                 | New Permission                                                    | Differences                                                                     |
| -------- | ------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/automations/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(AutomationPermissions.VIEW, resource_param="project_id")`   | New `automation` resource type. Contributor gets VIEW; commenter/guest get 403. |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/automations/<pk>/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(AutomationPermissions.VIEW, resource_param="project_id")`   | Same as list.                                                                   |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/automations/`        | `@allow_permission([ROLE.ADMIN])`              | `@can(AutomationPermissions.CREATE, resource_param="project_id")` | Parity. Only P-Admin can create.                                                |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/automations/<pk>/`  | `@allow_permission([ROLE.ADMIN])`              | `@can(AutomationPermissions.EDIT, resource_param="pk")`           | Parity. Only P-Admin can edit. Uses `pk` for resource-level check.              |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/automations/<pk>/` | `@allow_permission([ROLE.ADMIN])`              | `@can(AutomationPermissions.DELETE, resource_param="pk")`         | Parity. Only P-Admin can delete. Uses `pk` for resource-level check.            |

**Notes:**

- New `AUTOMATION` resource type added to permission infrastructure (`definitions.py`, `inheritance.py`, `engine.py`, `system_roles.py`).
- `@check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)` retained above `@can` on all methods.
- W-Admin gets `"automation:*"` via project-level bypass section.

### AutomationStatusEndpoint

**File:** `apps/api/plane/ee/views/app/automation/base.py`

| Method | URL Pattern                                                              | Old Permission                    | New Permission                                          | Differences                                                 |
| ------ | ------------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/automations/<pk>/status/` | `@allow_permission([ROLE.ADMIN])` | `@can(AutomationPermissions.EDIT, resource_param="pk")` | Parity. Toggling status is an edit operation. Only P-Admin. |

### AutomationNodeEndpoint

**File:** `apps/api/plane/ee/views/app/automation/node.py`

| Method   | URL Pattern                                                                               | Old Permission                                 | New Permission                                                     | Differences                                                                             |
| -------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/automations/<automation_id>/nodes/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(AutomationPermissions.VIEW, resource_param="automation_id")` | Contributor gets VIEW; commenter/guest get 403.                                         |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/automations/<automation_id>/nodes/<pk>/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(AutomationPermissions.VIEW, resource_param="automation_id")` | Same as list.                                                                           |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/automations/<automation_id>/nodes/`        | `@allow_permission([ROLE.ADMIN])`              | `@can(AutomationPermissions.EDIT, resource_param="automation_id")` | Node creation = editing the automation. Only P-Admin.                                   |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/automations/<automation_id>/nodes/<pk>/`  | `@allow_permission([ROLE.ADMIN])`              | `@can(AutomationPermissions.EDIT, resource_param="automation_id")` | Parity. Only P-Admin.                                                                   |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/automations/<automation_id>/nodes/<pk>/` | `@allow_permission([ROLE.ADMIN])`              | `@can(AutomationPermissions.EDIT, resource_param="automation_id")` | Node mutations use EDIT (not CREATE/DELETE) — nodes are part of editing the automation. |

### AutomationEdgeEndpoint

**File:** `apps/api/plane/ee/views/app/automation/edge.py`

| Method   | URL Pattern                                                                               | Old Permission                                 | New Permission                                                     | Differences                                                         |
| -------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/automations/<automation_id>/edges/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(AutomationPermissions.VIEW, resource_param="automation_id")` | Contributor gets VIEW; commenter/guest get 403.                     |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/automations/<automation_id>/edges/<pk>/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(AutomationPermissions.VIEW, resource_param="automation_id")` | Same as list.                                                       |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/automations/<automation_id>/edges/`        | `@allow_permission([ROLE.ADMIN])`              | `@can(AutomationPermissions.EDIT, resource_param="automation_id")` | Edge creation = editing the automation. Only P-Admin.               |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/automations/<automation_id>/edges/<pk>/`  | `@allow_permission([ROLE.ADMIN])`              | `@can(AutomationPermissions.EDIT, resource_param="automation_id")` | Parity. Only P-Admin.                                               |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/automations/<automation_id>/edges/<pk>/` | `@allow_permission([ROLE.ADMIN])`              | `@can(AutomationPermissions.EDIT, resource_param="automation_id")` | Edge mutations use EDIT — edges are part of editing the automation. |

### AutomationActivityEndpoint

**File:** `apps/api/plane/ee/views/app/automation/activity.py`

| Method | URL Pattern                                                                                 | Old Permission                                 | New Permission                                                     | Differences                                     |
| ------ | ------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/automations/<automation_id>/activities/`      | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(AutomationPermissions.VIEW, resource_param="automation_id")` | Contributor gets VIEW; commenter/guest get 403. |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/automations/<automation_id>/activities/<pk>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(AutomationPermissions.VIEW, resource_param="automation_id")` | Same as list.                                   |

### AutomationRunEndpoint (Unused)

**File:** `apps/api/plane/ee/views/app/automation/run.py`

Not migrated — endpoint is not exported in `__init__.py` and not wired to URL config. TODO comment added to class.

### DashboardViewSet

**File:** `apps/api/plane/ee/views/app/dashboard/base.py`

| Method           | URL Pattern                                  | Old Permission                                                                | New Permission                                                     | Differences                                                                             |
| ---------------- | -------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/dashboards/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(DashboardPermissions.VIEW, resource_param="workspace_id")`   | Guest blocked (no `dashboard:view` grant). Member gets VIEW only.                       |
| `create`         | `POST /workspaces/<slug>/dashboards/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(DashboardPermissions.CREATE, resource_param="workspace_id")` | Guest and Member blocked (Admin-only via `dashboard:*`). Old backend allowed all roles. |
| `retrieve`       | `GET /workspaces/<slug>/dashboards/<pk>/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(DashboardPermissions.VIEW, resource_param="workspace_id")`   | Guest blocked. Member gets VIEW only.                                                   |
| `partial_update` | `PATCH /workspaces/<slug>/dashboards/<pk>/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(DashboardPermissions.EDIT, resource_param="workspace_id")`   | Guest and Member blocked (Admin-only via `dashboard:*`). Old backend allowed all roles. |
| `destroy`        | `DELETE /workspaces/<slug>/dashboards/<pk>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(DashboardPermissions.DELETE, resource_param="workspace_id")` | Guest and Member blocked (Admin-only via `dashboard:*`). Old backend allowed all roles. |

> **Access tightened:** Old backend allowed Admin + Member + Guest for all operations. New system: Admin has full CRUD (`dashboard:*`), Member has VIEW only (`dashboard:view`), Guest has no access. Aligns with FE behavior.

### WidgetEndpoint

**File:** `apps/api/plane/ee/views/app/dashboard/widget.py`

| Method   | URL Pattern                                                         | Old Permission                                                                | New Permission                                                     | Differences                               |
| -------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------- |
| `get`    | `GET /workspaces/<slug>/dashboards/<dashboard_id>/widgets/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(DashboardPermissions.VIEW, resource_param="workspace_id")`   | Guest blocked. Member gets VIEW only.     |
| `post`   | `POST /workspaces/<slug>/dashboards/<dashboard_id>/widgets/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(DashboardPermissions.CREATE, resource_param="workspace_id")` | Guest and Member blocked (Admin-only).    |
| `patch`  | `PATCH /workspaces/<slug>/dashboards/<dashboard_id>/widgets/<pk>/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(DashboardPermissions.EDIT, resource_param="workspace_id")`   | Guest and Member blocked (Admin-only).    |
| `delete` | `DELETE /workspaces/<slug>/dashboards/<dashboard_id>/widgets/<pk>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`             | `@can(DashboardPermissions.DELETE, resource_param="workspace_id")` | Member blocked (was allowed). Admin-only. |

### WidgetListEndpoint

**File:** `apps/api/plane/ee/views/app/dashboard/widget.py`

| Method | URL Pattern                                                                    | Old Permission                                                                | New Permission                                                   | Differences                           |
| ------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| `get`  | `GET /workspaces/<slug>/dashboards/<dashboard_id>/widgets/<widget_id>/charts/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(DashboardPermissions.VIEW, resource_param="workspace_id")` | Guest blocked. Member gets VIEW only. |

### BulkWidgetEndpoint

**File:** `apps/api/plane/ee/views/app/dashboard/widget.py`

| Method | URL Pattern                                                              | Old Permission                                                                | New Permission                                                   | Differences                            |
| ------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------- |
| `post` | `POST /workspaces/<slug>/dashboards/<dashboard_id>/bulk-update-widgets/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(DashboardPermissions.EDIT, resource_param="workspace_id")` | Guest and Member blocked (Admin-only). |

### DashboardQuickFilterEndpoint (Unused)

**File:** `apps/api/plane/ee/views/app/dashboard/base.py`

Not migrated — endpoint is not called by the FE. URL patterns commented out in `ee/urls/app/dashboard.py`. TODO comment added to class and URL config.

### CycleIssueStateAnalyticsEndpoint

**File:** `apps/api/plane/ee/views/app/cycle/base.py`

| Method | URL Pattern                                                                       | Old Permission                                             | New Permission                                           | Differences                                                                   |
| ------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/state-analytics/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(CyclePermissions.VIEW, resource_param="cycle_id")` | Guest blocked (no `cycle:view` grant). Commenter gains VIEW via `cycle:view`. |

> Feature flag `CYCLE_PROGRESS_CHARTS` remains above `@can`.

### AutomatedCycleViewSet

**File:** `apps/api/plane/ee/views/app/cycle/schedule.py`

| Method           | URL Pattern                                                        | Old Permission                    | New Permission                                               | Differences                                                                             |
| ---------------- | ------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/automated-cycles/`   | `@allow_permission([ROLE.ADMIN])` | `@can(CyclePermissions.MANAGE, resource_param="project_id")` | Admin-only (cycle:manage via cycle:\*). Decorator order fixed: feature flag above @can. |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/automated-cycles/`  | `@allow_permission([ROLE.ADMIN])` | `@can(CyclePermissions.MANAGE, resource_param="project_id")` | Same. `ROLE` import retained for bot member creation (line 83, 93).                     |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/automated-cycles/` | `@allow_permission([ROLE.ADMIN])` | `@can(CyclePermissions.MANAGE, resource_param="project_id")` | Same.                                                                                   |

> Feature flag `AUTO_SCHEDULE_CYCLES` now correctly above `@can` (was below `@allow_permission`). `from plane.app.permissions import ROLE` retained for bot creation (`ROLE.ADMIN.value`).

### CycleStartStopEndpoint

**File:** `apps/api/plane/ee/views/app/cycle/start_stop.py`

| Method | URL Pattern                                                                   | Old Permission                                 | New Permission                                           | Differences                                                                       |
| ------ | ----------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/start-stop/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(CyclePermissions.EDIT, resource_param="cycle_id")` | Contributor gets EDIT; commenter/guest blocked. Direct mapping from ADMIN+MEMBER. |

> Feature flag `CYCLE_PROGRESS_CHARTS` remains above `@can`.

### CycleUpdatesViewSet

**File:** `apps/api/plane/ee/views/app/cycle/update.py`

New resource type: `CYCLE_UPDATE` (following `EPIC_UPDATE` pattern — `EntityUpdates` model). Actions: VIEW, CREATE, EDIT, DELETE. Hierarchy parent: PROJECT (`parent_field: "project_id"`). Added to `PROJECT_RESOURCE_TYPES`.

| Method           | URL Pattern                                                                                    | Old Permission                                                                     | New Permission                                                     | Differences                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/updates/`                      | _(no decorator — only feature flag)_                                               | `@can(CycleUpdatePermissions.VIEW, resource_param="project_id")`   | **Security fix:** adds missing permission gate. Admin + Contributor + Commenter have VIEW.                           |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/updates/<pk>/`                 | _(no explicit method)_                                                             | `@can(CycleUpdatePermissions.VIEW, resource_param="pk")`           | **New method added** with explicit decorator. Was implicit from ViewSet routing.                                     |
| `comments_list`  | `GET /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/updates/<update_id>/comments/` | _(no decorator — only feature flag)_                                               | `@can(CycleUpdatePermissions.VIEW, resource_param="project_id")`   | **Security fix:** adds missing permission gate.                                                                      |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/updates/`                     | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`                         | `@can(CycleUpdatePermissions.CREATE, resource_param="project_id")` | Guest blocked (no `cycle_update:create`). Commenter blocked. Only Admin + Contributor.                               |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/updates/<pk>/`               | `@allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=EntityUpdates)` | `@can(CycleUpdatePermissions.EDIT, resource_param="pk")`           | **Security fix:** creator bypass now verifies active membership via conditional grant (`cycle_update:edit+creator`). |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/updates/<pk>/`              | `@allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=EntityUpdates)` | `@can(CycleUpdatePermissions.DELETE, resource_param="pk")`         | **Security fix:** same as partial_update — conditional grant with membership verification.                           |

> Feature flag `CYCLE_PROGRESS_CHARTS` remains above `@can` on all methods.
>
> **Role grants (in `system_roles.py`):** W-Admin: `cycle_update:*`. P-Admin: `cycle_update:*`. P-Contributor: VIEW, CREATE, EDIT+creator, DELETE+creator. P-Commenter: VIEW. P-Guest: no access.

### WorkspaceActiveCycleEndpoint

**File:** `apps/api/plane/ee/views/app/cycle/active_cycle.py`

| Method | URL Pattern                             | Old Permission                                   | New Permission                                                   | Differences                                                                                            |
| ------ | --------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `get`  | `GET /workspaces/<slug>/active-cycles/` | `permission_classes = [WorkspaceUserPermission]` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Any workspace member (all 4 roles have `workspace:view`). Data-level filtering via `.accessible_to()`. |

> `permission_classes = [WorkspaceUserPermission]` removed. Import replaced: `from plane.ee.permissions import WorkspaceUserPermission` → `from plane.permissions import can, WorkspacePermissions`. Feature flag `WORKSPACE_ACTIVE_CYCLES` remains above `@can`.

### ProjectReactionViewSet

**File:** `apps/api/plane/ee/views/app/project/reaction.py`

| Method    | URL Pattern                                                                  | Old Permission                                             | New Permission                                                | Differences                                                                 |
| --------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `list`    | `GET /workspaces/<slug>/projects/<project_id>/reactions/`                    | (inherited; no explicit permission)                        | `@can(ProjectPermissions.VIEW, resource_param="project_id")`  | New explicit gate — all 4 project roles; data filtered by `accessible_to()` |
| `create`  | `POST /workspaces/<slug>/projects/<project_id>/reactions/`                   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(ProjectPermissions.REACT, resource_param="project_id")` | Commenter/Guest lose access — matches system_roles grants                   |
| `destroy` | `DELETE /workspaces/<slug>/projects/<project_id>/reactions/<reaction_code>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(ProjectPermissions.REACT, resource_param="project_id")` | Commenter/Guest lose access; own-only via queryset `actor=request.user`     |

**Import cleanup:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import can, ProjectPermissions`.

### MilestoneViewSet

**File:** `apps/api/plane/ee/views/app/milestone/base.py`

New resource type: `MILESTONE` (actions: VIEW, CREATE, EDIT, DELETE). Hierarchy parent: PROJECT (`parent_field: "project_id"`). Added to `PROJECT_RESOURCE_TYPES`.

| Method           | URL Pattern                                                        | Old Permission                                            | New Permission                                                   | Differences                                                                                             |
| ---------------- | ------------------------------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/milestones/`         | `permission_classes = [ProjectMemberPermission]` (GET)    | `@can(MilestonePermissions.VIEW, resource_param="project_id")`   | Guest loses VIEW (old allowed all members for GET). Commenter gains explicit VIEW via `milestone:view`. |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/milestones/`        | `permission_classes = [ProjectMemberPermission]` (POST)   | `@can(MilestonePermissions.CREATE, resource_param="project_id")` | Direct mapping: Admin + Contributor only. Commenter/Guest blocked.                                      |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/milestones/<pk>/`  | `permission_classes = [ProjectMemberPermission]` (PATCH)  | `@can(MilestonePermissions.EDIT, resource_param="pk")`           | Direct mapping: Admin + Contributor only. Commenter/Guest blocked.                                      |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/milestones/<pk>/` | `permission_classes = [ProjectMemberPermission]` (DELETE) | `@can(MilestonePermissions.DELETE, resource_param="pk")`         | Direct mapping: Admin + Contributor only. Commenter/Guest blocked.                                      |
| `get` (search)   | `GET /workspaces/<slug>/projects/<project_id>/milestones/<pk>/`    | `permission_classes = [ProjectMemberPermission]` (GET)    | `@can(MilestonePermissions.VIEW, resource_param="project_id")`   | Same as list — guest loses VIEW, commenter gains VIEW.                                                  |

> **Access change:** `ProjectMemberPermission` allowed GET for Admin (20), Member (15), Guest (5). New system: Admin + Contributor + Commenter have VIEW; Guest has no access. Follows cycle/module pattern.
>
> **Role grants (in `system_roles.py`):** W-Admin: `milestone:*`. P-Admin: `milestone:*`. P-Contributor: VIEW, CREATE, EDIT, DELETE. P-Commenter: VIEW. P-Guest: no access.

**Import cleanup:** Replaced `permission_classes = [ProjectMemberPermission]` with `@can(MilestonePermissions.X)` decorators. Removed `ProjectMemberPermission` import; added `from plane.permissions import can, MilestonePermissions`.

### MilestoneWorkItemsSearchEndpoint

**File:** `apps/api/plane/ee/views/app/milestone/search.py`

| Method | URL Pattern                                                                  | Old Permission                                         | New Permission                                                 | Differences                                                                                             |
| ------ | ---------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/milestones/work-items/search/` | `permission_classes = [ProjectMemberPermission]` (GET) | `@can(MilestonePermissions.VIEW, resource_param="project_id")` | Guest loses VIEW (old allowed all members for GET). Commenter gains explicit VIEW via `milestone:view`. |

**Import cleanup:** Replaced `permission_classes = [ProjectMemberPermission]` with `@can(MilestonePermissions.VIEW)` decorator. Removed `ProjectMemberPermission` import; added `from plane.permissions import can, MilestonePermissions`.

### MilestoneWorkItemsEndpoint

**File:** `apps/api/plane/ee/views/app/milestone/work_item.py`

| Method | URL Pattern                                                                           | Old Permission                                          | New Permission                                                   | Differences                                                                                             |
| ------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/milestones/<milestone_id>/work-items/`  | `permission_classes = [ProjectMemberPermission]` (GET)  | `@can(MilestonePermissions.VIEW, resource_param="milestone_id")` | Guest loses VIEW (old allowed all members for GET). Commenter gains explicit VIEW via `milestone:view`. |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/milestones/<milestone_id>/work-items/` | `permission_classes = [ProjectMemberPermission]` (POST) | `@can(MilestonePermissions.EDIT, resource_param="milestone_id")` | Direct mapping: Admin + Contributor only. Adding work items to a milestone is an edit operation.        |

### WorkItemMilestoneEndpoint

**File:** `apps/api/plane/ee/views/app/milestone/work_item.py`

| Method   | URL Pattern                                                                             | Old Permission                                            | New Permission                                                 | Differences                                                                                           |
| -------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/milestones/work-items/<work_item_id>/`   | `permission_classes = [ProjectMemberPermission]` (POST)   | `@can(MilestonePermissions.EDIT, resource_param="project_id")` | Direct mapping: Admin + Contributor only. Assigning a work item to a milestone is an edit operation.  |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/milestones/work-items/<work_item_id>/` | `permission_classes = [ProjectMemberPermission]` (DELETE) | `@can(MilestonePermissions.EDIT, resource_param="project_id")` | Direct mapping: Admin + Contributor only. Removing a work item from a milestone is an edit operation. |

**Import cleanup:** Replaced `permission_classes = [ProjectMemberPermission]` with `@can(MilestonePermissions.X)` decorators on both endpoint classes. Removed `ProjectMemberPermission` import; added `from plane.permissions import can, MilestonePermissions`.

### WorkflowTransitionEndpoint

**File:** `apps/api/plane/ee/views/app/workflow/base.py`

New resource type: `WORKFLOW` (actions: VIEW, EDIT, DELETE). Hierarchy parent: PROJECT (`parent_field: "project_id"`). Added to `PROJECT_RESOURCE_TYPES`.

| Method           | URL Pattern                                                                   | Old Permission                                                   | New Permission                                                | Differences                                          |
| ---------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/workflows/transitions/`        | `@allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")` | `@can(WorkflowPermissions.EDIT, resource_param="project_id")` | Parity: P-Admin only (W-Admin/W-Owner via wildcard). |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/workflows/transitions/<pk>/`  | `@allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")` | `@can(WorkflowPermissions.EDIT, resource_param="project_id")` | Parity: P-Admin only (W-Admin/W-Owner via wildcard). |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/workflows/transitions/<pk>/` | `@allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")` | `@can(WorkflowPermissions.EDIT, resource_param="project_id")` | Parity: P-Admin only (W-Admin/W-Owner via wildcard). |

> **Role grants (in `system_roles.py`):** W-Admin: `workflow:*`. P-Admin: `workflow:*`. P-Contributor: VIEW only. P-Commenter: VIEW only. P-Guest: VIEW only.

**Import cleanup:** Replaced `@allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")` with `@can(WorkflowPermissions.EDIT)` decorators. Removed `allow_permission`, `ROLE` imports; added `from plane.permissions import can, WorkflowPermissions`.

### WorkflowEndpoint

**File:** `apps/api/plane/ee/views/app/workflow/base.py`

| Method   | URL Pattern                                                  | Old Permission                                                                              | New Permission                                                                                   | Differences                                                                                                          |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/workflows/`                          | `@allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`                                 | Parity: any workspace member (all roles have `workspace:view`).                                                      |
| `patch`  | `PATCH /workspaces/<slug>/workflows/<state_id>/`             | `@allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`             | `@can(WorkflowPermissions.EDIT, resource_param="state_id", scope_param_type=ResourceType.STATE)` | **Tighter:** was W-Admin + W-Member, now P-Admin only (via `workflow:edit` grant). Appropriate for project settings. |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/workflows/` | `@allow_permission([ROLE.ADMIN])`                                                           | `@can(WorkflowPermissions.DELETE, resource_param="project_id")`                                  | Parity: P-Admin only (W-Admin/W-Owner via wildcard).                                                                 |

> **Access change on `patch`:** Old system allowed any workspace Admin or Member. New system resolves `state_id` → parent project via `scope_param_type=ResourceType.STATE`, then checks `workflow:edit` which is only granted to W-Admin (`workflow:*`) and P-Admin (`workflow:*`). This is **intentionally tighter** — workflow transition rules are project-level settings that should require project admin access.

**Import cleanup:** Replaced `@allow_permission` decorators with `@can(WorkspacePermissions.VIEW)`, `@can(WorkflowPermissions.EDIT)`, and `@can(WorkflowPermissions.DELETE)`. Removed `allow_permission`, `ROLE` imports; added `from plane.permissions import can, WorkspacePermissions, WorkflowPermissions` and `from plane.permissions.resources import ResourceType`.

### WorkflowActivityEndpoint

**File:** `apps/api/plane/ee/views/app/workflow/activity.py`

| Method | URL Pattern                                                          | Old Permission                                             | New Permission                                                | Differences                                                                               |
| ------ | -------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/workflows/activities/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(WorkflowPermissions.VIEW, resource_param="project_id")` | Parity: all project roles have `workflow:view` (Admin via `workflow:*`, others explicit). |

**Import cleanup:** Replaced `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` with `@can(WorkflowPermissions.VIEW)`. Removed `allow_permission`, `ROLE` imports; added `from plane.permissions import can, WorkflowPermissions`.

### WorkflowTransitionApproverEndpoint

**File:** `apps/api/plane/ee/views/app/workflow/approver.py`

| Method   | URL Pattern                                                                                               | Old Permission                                                   | New Permission                                                | Differences                                          |
| -------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| `create` | `POST /workspaces/<slug>/projects/<project_id>/workflows/transitions/<workflow_transition_id>/approvers/` | `@allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")` | `@can(WorkflowPermissions.EDIT, resource_param="project_id")` | Parity: P-Admin only (W-Admin/W-Owner via wildcard). |

**Import cleanup:** Replaced `@allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")` with `@can(WorkflowPermissions.EDIT)`. Removed `allow_permission`, `ROLE` imports; added `from plane.permissions import can, WorkflowPermissions`.

---

### Customer Batch Migration (2026-02-22)

> **New resource type:** `CUSTOMER` added to `definitions.py` with actions: VIEW, CREATE, EDIT, DELETE. Hierarchy parent: WORKSPACE (`parent_field: "workspace_id"`). Added to `WORKSPACE_RESOURCE_TYPES`.
>
> **W-Admin grants:** `"customer:*"` (wildcard — full access to all customer actions).
>
> **W-Member:** No customer grants — FE hides customer features from members; old `WorkSpaceAdminPermission` allowed Admin+Member but Member was never exposed in FE.
>
> **W-Guest:** No customer grants.
>
> **Security fixes:** `CustomerIssuesEndpoint` previously had **no permission checks** (auth only). Now protected with `@can(CustomerPermissions.VIEW/EDIT)`.

### CustomerEndpoint

**File:** `plane/ee/views/app/customer/customer.py`

| Method   | URL Pattern                                 | Old Permission             | New Permission                                                    | Differences                                                                |
| -------- | ------------------------------------------- | -------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/customers/`         | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id")`   | Now uses `@can` decorator; W-Member loses access (was never exposed in FE) |
| `post`   | `POST /workspaces/<slug>/customers/`        | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.CREATE, resource_param="workspace_id")` | Same                                                                       |
| `patch`  | `PATCH /workspaces/<slug>/customers/<pk>/`  | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.EDIT, resource_param="workspace_id")`   | Same                                                                       |
| `delete` | `DELETE /workspaces/<slug>/customers/<pk>/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.DELETE, resource_param="workspace_id")` | Same                                                                       |

---

### CustomerPropertyEndpoint

**File:** `plane/ee/views/app/customer/customer_property.py`

| Method   | URL Pattern                                           | Old Permission             | New Permission                                                    | Differences     |
| -------- | ----------------------------------------------------- | -------------------------- | ----------------------------------------------------------------- | --------------- |
| `get`    | `GET /workspaces/<slug>/customer-properties/`         | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id")`   | Now uses `@can` |
| `post`   | `POST /workspaces/<slug>/customer-properties/`        | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.CREATE, resource_param="workspace_id")` | Same            |
| `patch`  | `PATCH /workspaces/<slug>/customer-properties/<pk>/`  | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.EDIT, resource_param="workspace_id")`   | Same            |
| `delete` | `DELETE /workspaces/<slug>/customer-properties/<pk>/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.DELETE, resource_param="workspace_id")` | Same            |

---

### CustomerPropertyOptionEndpoint

**File:** `plane/ee/views/app/customer/option.py`

| Method | URL Pattern                                         | Old Permission             | New Permission                                                  | Differences     |
| ------ | --------------------------------------------------- | -------------------------- | --------------------------------------------------------------- | --------------- |
| `get`  | `GET /workspaces/<slug>/customer-property-options/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id")` | Now uses `@can` |

---

### CustomerRequestEndpoint

**File:** `plane/ee/views/app/customer/request.py`

| Method   | URL Pattern                                                        | Old Permission             | New Permission                                                    | Differences     |
| -------- | ------------------------------------------------------------------ | -------------------------- | ----------------------------------------------------------------- | --------------- |
| `get`    | `GET /workspaces/<slug>/customers/<customer_id>/requests/`         | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id")`   | Now uses `@can` |
| `post`   | `POST /workspaces/<slug>/customers/<customer_id>/requests/`        | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.CREATE, resource_param="workspace_id")` | Same            |
| `patch`  | `PATCH /workspaces/<slug>/customers/<customer_id>/requests/<pk>/`  | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.EDIT, resource_param="workspace_id")`   | Same            |
| `delete` | `DELETE /workspaces/<slug>/customers/<customer_id>/requests/<pk>/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.DELETE, resource_param="workspace_id")` | Same            |

---

### CustomerIssuesEndpoint (SECURITY FIX)

**File:** `plane/ee/views/app/customer/request.py`

| Method   | URL Pattern                                                                | Old Permission       | New Permission                                                  | Differences                                          |
| -------- | -------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/customers/<customer_id>/issues/`                   | _(none — auth only)_ | `@can(CustomerPermissions.VIEW, resource_param="workspace_id")` | **Security fix**: previously had no permission check |
| `post`   | `POST /workspaces/<slug>/customers/<customer_id>/issues/`                  | _(none — auth only)_ | `@can(CustomerPermissions.EDIT, resource_param="workspace_id")` | **Security fix**: link issues = edit customer data   |
| `delete` | `DELETE /workspaces/<slug>/customers/<customer_id>/issues/<work_item_id>/` | _(none — auth only)_ | `@can(CustomerPermissions.EDIT, resource_param="workspace_id")` | **Security fix**: unlink issues = edit customer data |

> **Security fix:** `CustomerIssuesEndpoint` previously had no `permission_classes` and no `@allow_permission` decorator — any authenticated user could list, link, or unlink customer issues. Now protected with `@can(CustomerPermissions.VIEW)` for listing and `@can(CustomerPermissions.EDIT)` for linking/unlinking. EDIT (not CREATE/DELETE) is used for link/unlink because these operations modify customer data rather than creating or destroying the customer resource itself.

---

### CustomerPropertyValueEndpoint

**File:** `plane/ee/views/app/customer/value.py`

| Method  | URL Pattern                                                              | Old Permission             | New Permission                                                  | Differences                                       |
| ------- | ------------------------------------------------------------------------ | -------------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| `get`   | `GET /workspaces/<slug>/customers/<customer_id>/values/`                 | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id")` | Now uses `@can`                                   |
| `post`  | `POST /workspaces/<slug>/customers/<customer_id>/values/`                | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.EDIT, resource_param="workspace_id")` | EDIT not CREATE: sets values on existing customer |
| `patch` | `PATCH /workspaces/<slug>/customers/<customer_id>/values/<property_id>/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.EDIT, resource_param="workspace_id")` | Same                                              |

> **EDIT for `post`:** The `post` method on `CustomerPropertyValueEndpoint` uses `CustomerPermissions.EDIT` rather than `CustomerPermissions.CREATE` because it sets property values on an existing customer — this is an edit operation on customer data, not creation of a new customer resource.

---

### CustomerIssueSearchEndpoint

**File:** `plane/ee/views/app/customer/search.py`

| Method | URL Pattern                                                     | Old Permission             | New Permission                                                  | Differences     |
| ------ | --------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------- | --------------- |
| `get`  | `GET /workspaces/<slug>/customers/<customer_id>/search-issues/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id")` | Now uses `@can` |

---

### CustomerRequestAttachmentV2Endpoint

**File:** `plane/ee/views/app/customer/attachment.py`

| Method   | URL Pattern                                                                     | Old Permission             | New Permission                                                    | Differences                                                                            |
| -------- | ------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/customer-requests/<customer_request_id>/attachments/`   | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id")`   | Now uses `@can`                                                                        |
| `post`   | `POST /workspaces/<slug>/customer-request-attachments/`                         | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.EDIT, resource_param="workspace_id")`   | EDIT: uploading attachment to request                                                  |
| `patch`  | `PATCH /workspaces/<slug>/customer-requests/<customer_request_id>/attachments/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.EDIT, resource_param="workspace_id")`   | Same                                                                                   |
| `delete` | `DELETE /workspaces/<slug>/customer-request-attachments/<pk>/`                  | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.DELETE, resource_param="workspace_id")` | Note: uses `@check_feature_flag(FeatureFlag.INITIATIVES)` — likely a bug, out of scope |

---

### IssueCustomerEndpoint

**File:** `plane/ee/views/app/customer/issue.py`

| Method | URL Pattern                                                   | Old Permission             | New Permission                                                  | Differences     |
| ------ | ------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------- | --------------- |
| `get`  | `GET /workspaces/<slug>/work-items/<work_item_id>/customers/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id")` | Now uses `@can` |

---

### IssueCustomerRequestEndpoint

**File:** `plane/ee/views/app/customer/issue.py`

| Method | URL Pattern                                                           | Old Permission             | New Permission                                                  | Differences     |
| ------ | --------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------- | --------------- |
| `get`  | `GET /workspaces/<slug>/work-items/<work_item_id>/customer-requests/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id")` | Now uses `@can` |

---

### OAuth Application Batch Migration (2026-02-22)

> **Existing resource type:** `INTEGRATION` reused from `definitions.py` (actions: VIEW, CREATE, EDIT, DELETE, MANAGE, CONNECT). Hierarchy parent: WORKSPACE (`parent_field: "workspace_id"`). Already in `WORKSPACE_RESOURCE_TYPES`.
>
> **W-Admin grants changed:** Expanded from `IntegrationPermissions.VIEW` + `IntegrationPermissions.CONNECT` to `"integration:*"` (wildcard — full access including MANAGE for admin-only operations like app uninstall).
>
> **W-Member grants added:** `IntegrationPermissions.VIEW`, `IntegrationPermissions.CREATE`, `IntegrationPermissions.EDIT`, `IntegrationPermissions.DELETE`, `IntegrationPermissions.CONNECT`. No `MANAGE` — preserves admin-only uninstall behavior.
>
> **W-Guest:** No integration grants (parity with old system).
>
> **Inline business logic preserved:**
>
> - `OAuthApplicationInstallEndpoint.post`: Admin-first install check (`ROLE.ADMIN.value` for first-time installs) — business rule, not permission check
> - `OAuthApplicationPublishEndpoint.post`: `ApplicationOwner` check — only the app owner can publish
>
> **Pattern H:** `OAuthPublishedApplicationBySlugEndpoint` — not called by FE, URL commented out.
>
> **4 `IsAuthenticated` endpoints unchanged:** `OAuthApplicationClientIdEndpoint`, `OAuthApplicationCategoryEndpoint`, `OAuthWorkspacesCheckAppInstallationAllowedEndpoint`, `OAuthApplicationSupportedWorkspacesEndpoint` — cross-workspace OAuth flows and marketplace UI.

### OAuthApplicationEndpoint

**File:** `plane/ee/views/app/oauth/application.py`

| Method   | URL Pattern                                          | Old Permission             | New Permission                                                       | Differences                      |
| -------- | ---------------------------------------------------- | -------------------------- | -------------------------------------------------------------------- | -------------------------------- |
| `get`    | `GET /workspaces/<slug>/applications/`               | `WorkSpaceAdminPermission` | `@can(IntegrationPermissions.VIEW, resource_param="workspace_id")`   | W-Member retains access (parity) |
| `get`    | `GET /workspaces/<slug>/applications/<app_slug>/`    | `WorkSpaceAdminPermission` | `@can(IntegrationPermissions.VIEW, resource_param="workspace_id")`   | Same                             |
| `post`   | `POST /workspaces/<slug>/applications/`              | `WorkSpaceAdminPermission` | `@can(IntegrationPermissions.CREATE, resource_param="workspace_id")` | W-Member retains access (parity) |
| `patch`  | `PATCH /workspaces/<slug>/applications/<app_slug>/`  | `WorkSpaceAdminPermission` | `@can(IntegrationPermissions.EDIT, resource_param="workspace_id")`   | W-Member retains access (parity) |
| `delete` | `DELETE /workspaces/<slug>/applications/<app_slug>/` | `WorkSpaceAdminPermission` | `@can(IntegrationPermissions.DELETE, resource_param="workspace_id")` | W-Member retains access (parity) |

### OAuthApplicationRegenerateSecretEndpoint

**File:** `plane/ee/views/app/oauth/application.py`

| Method  | URL Pattern                                                     | Old Permission             | New Permission                                                     | Differences                      |
| ------- | --------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------ | -------------------------------- |
| `patch` | `PATCH /workspaces/<slug>/applications/<pk>/regenerate-secret/` | `WorkSpaceAdminPermission` | `@can(IntegrationPermissions.EDIT, resource_param="workspace_id")` | W-Member retains access (parity) |

### OAuthApplicationCheckSlugEndpoint

**File:** `plane/ee/views/app/oauth/application.py`

| Method | URL Pattern                                                    | Old Permission             | New Permission                                                       | Differences                      |
| ------ | -------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------- | -------------------------------- |
| `post` | `POST /workspaces/<slug>/applications/validations/check-slug/` | `WorkSpaceAdminPermission` | `@can(IntegrationPermissions.CREATE, resource_param="workspace_id")` | W-Member retains access (parity) |

### OAuthApplicationInstallEndpoint

**File:** `plane/ee/views/app/oauth/application.py`

| Method | URL Pattern                                          | Old Permission             | New Permission                                                        | Differences                                                           |
| ------ | ---------------------------------------------------- | -------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/applications/<pk>/install/` | `WorkSpaceAdminPermission` | `@can(IntegrationPermissions.CONNECT, resource_param="workspace_id")` | W-Member retains access (parity). Inline admin-first check preserved. |

> **Inline business logic:** Lines 305-312 check `role=ROLE.ADMIN.value` for first-time installs. This is a business rule (admin must install first, then members can install) — not a permission check. Preserved as-is.

### OAuthApplicationPublishEndpoint

**File:** `plane/ee/views/app/oauth/application.py`

| Method | URL Pattern                                          | Old Permission             | New Permission                                                     | Differences                                                     |
| ------ | ---------------------------------------------------- | -------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/applications/<pk>/publish/` | `WorkSpaceAdminPermission` | `@can(IntegrationPermissions.EDIT, resource_param="workspace_id")` | W-Member retains access (parity). Inline owner check preserved. |

> **Inline business logic:** Lines 350-357 check `ApplicationOwner` — only the app owner can publish. This is a business rule that goes beyond role-based access. Preserved as-is.

### OAuthAppInstallationDetailEndpoint

**File:** `plane/ee/views/app/oauth/application.py`

| Method   | URL Pattern                                         | Old Permission             | New Permission                                                       | Differences                                                                                                       |
| -------- | --------------------------------------------------- | -------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `delete` | `DELETE /workspaces/<slug>/app-installations/<pk>/` | `WorkspaceOwnerPermission` | `@can(IntegrationPermissions.MANAGE, resource_param="workspace_id")` | Parity: W-Owner (`*`) + W-Admin (`integration:*`) have MANAGE; W-Member does NOT (no `integration:manage` grant). |

### OAuthPublishedApplicationBySlugEndpoint (Pattern H — Unused)

**File:** `plane/ee/views/app/oauth/application.py`

| Method | URL Pattern                                                 | Old Permission             | New Permission    | Differences                               |
| ------ | ----------------------------------------------------------- | -------------------------- | ----------------- | ----------------------------------------- |
| `get`  | `GET /workspaces/<slug>/published-applications/<app_slug>/` | `WorkSpaceAdminPermission` | URL commented out | Pattern H: not called by FE, URL disabled |

> **Pattern H:** URL definition commented out in `plane/ee/urls/app/oauth.py`. TODO comment added on both the view class and the URL. No `@can` decorator applied.

### OAuthUserAppInstallationDetailEndpoint

**File:** `plane/ee/views/app/oauth/application.py`

| Method   | URL Pattern                                            | Old Permission             | New Permission                                                        | Differences                      |
| -------- | ------------------------------------------------------ | -------------------------- | --------------------------------------------------------------------- | -------------------------------- |
| `delete` | `DELETE /workspaces/<slug>/my-app-installations/<pk>/` | `WorkSpaceAdminPermission` | `@can(IntegrationPermissions.CONNECT, resource_param="workspace_id")` | W-Member retains access (parity) |

**Import cleanup:** Replaced `WorkSpaceAdminPermission`, `WorkspaceOwnerPermission` imports with `from plane.permissions import can, IntegrationPermissions`. Kept `from plane.app.permissions import ROLE` (used by inline admin-first install check and `IsAuthenticated` endpoints).

---

## Asset Views Migration

Two new resource types created:

- `WORKSPACE_ASSET` — workspace-scoped asset utility operations (download, serve, check, reupload, restore, duplicate, bulk-link)
- `PROJECT_ASSET` — project-scoped asset operations (upload, mark uploaded, delete, view, download, serve)

### Workspace Asset Operations

**File:** `plane/app/views/asset/v2.py`

| Method                                   | URL Pattern                                            | Old Permission                                                                | New Permission                                                        | Differences                                              |
| ---------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| `post` (WorkspaceReuploadAssetEndpoint)  | `POST /workspaces/<slug>/assets/<asset_id>/reupload/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspaceAssetPermissions.VIEW, resource_param="workspace_id")` | Uses `workspace_asset:view` — all WS roles retain access |
| `post` (AssetRestoreEndpoint)            | `POST /workspaces/<slug>/assets/<asset_id>/restore/`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspaceAssetPermissions.VIEW, resource_param="workspace_id")` | Uses `workspace_asset:view` — all WS roles retain access |
| `get` (AssetCheckEndpoint)               | `GET /workspaces/<slug>/assets/<asset_id>/check/`      | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspaceAssetPermissions.VIEW, resource_param="workspace_id")` | Uses `workspace_asset:view` — all WS roles retain access |
| `post` (DuplicateAssetEndpoint)          | `POST /workspaces/<slug>/assets/<asset_id>/duplicate/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspaceAssetPermissions.VIEW, resource_param="workspace_id")` | Uses `workspace_asset:view` — all WS roles retain access |
| `get` (WorkspaceAssetDownloadEndpoint)   | `GET /workspaces/<slug>/assets/<asset_id>/download/`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspaceAssetPermissions.VIEW, resource_param="workspace_id")` | Uses `workspace_asset:view` — all WS roles retain access |
| `get` (WorkspaceFileAssetServerEndpoint) | `GET /workspaces/<slug>/assets/<asset_id>/serve/`      | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspaceAssetPermissions.VIEW, resource_param="workspace_id")` | Uses `workspace_asset:view` — all WS roles retain access |

**Import cleanup:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import can, ProjectAssetPermissions, WorkspaceAssetPermissions`.

### Project Asset Operations

**File:** `plane/app/views/asset/v2.py`

| Method                                | URL Pattern                                                                 | Old Permission                                                              | New Permission                                                      | Differences                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `post` (ProjectAssetEndpoint)         | `POST /workspaces/<slug>/projects/<project_id>/assets/`                     | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`                  | `@can(ProjectAssetPermissions.CREATE, resource_param="project_id")` | P-Guest loses CREATE (was granted via old GUEST role). P-Commenter retains CREATE. |
| `patch` (ProjectAssetEndpoint)        | `PATCH /workspaces/<slug>/projects/<project_id>/assets/<pk>/`               | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`                  | `@can(ProjectAssetPermissions.EDIT, resource_param="pk")`           | P-Guest loses EDIT. P-Contributor/Commenter: EDIT own only (+creator).             |
| `delete` (ProjectAssetEndpoint)       | `DELETE /workspaces/<slug>/projects/<project_id>/assets/<pk>/`              | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`                  | `@can(ProjectAssetPermissions.DELETE, resource_param="pk")`         | P-Guest loses DELETE. P-Contributor/Commenter: DELETE own only (+creator).         |
| `get` (ProjectAssetEndpoint)          | `GET /workspaces/<slug>/projects/<project_id>/assets/<pk>/`                 | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`                  | `@can(ProjectAssetPermissions.VIEW, resource_param="pk")`           | All project roles retain VIEW access                                               |
| `post` (ProjectReuploadAssetEndpoint) | `POST /workspaces/<slug>/projects/<project_id>/assets/<asset_id>/reupload/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`                  | `@can(ProjectAssetPermissions.CREATE, resource_param="project_id")` | P-Guest loses CREATE                                                               |
| `post` (ProjectBulkAssetEndpoint)     | `POST /workspaces/<slug>/projects/<project_id>/assets/<entity_id>/bulk/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`                  | `@can(ProjectAssetPermissions.CREATE, resource_param="project_id")` | P-Guest loses CREATE                                                               |
| `get` (ProjectAssetDownloadEndpoint)  | `GET /workspaces/<slug>/projects/<project_id>/assets/<asset_id>/download/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")` | `@can(ProjectAssetPermissions.VIEW, resource_param="project_id")`   | All project roles retain VIEW                                                      |
| `get` (ProjectAssetServerEndpoint)    | `GET /workspaces/<slug>/projects/<project_id>/assets/<asset_id>/serve/`     | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`                  | `@can(ProjectAssetPermissions.VIEW, resource_param="project_id")`   | All project roles retain VIEW                                                      |

### Silo Assets

**File:** `plane/app/views/asset/silo.py`

| Method                      | URL Pattern                            | Old Permission                                                                                            | New Permission                                                                                                               | Differences                                                                                                       |
| --------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `post` (SiloAssetsEndpoint) | `POST /workspaces/<slug>/silo/assets/` | `@allow_permission([ROLE.ADMIN], level="WORKSPACE")` + `@check_feature_flag(FeatureFlag.NOTION_IMPORTER)` | `@check_feature_flag(FeatureFlag.NOTION_IMPORTER)` + `@can(WorkspaceAssetPermissions.MANAGE, resource_param="workspace_id")` | Uses `workspace_asset:manage` — W-Owner + W-Admin only (exact parity). Feature flag moved to outermost decorator. |

**Import cleanup:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import can, WorkspaceAssetPermissions`.

### EE Bulk Duplicate Asset

**File:** `plane/ee/views/app/assets/base.py`

| Method                             | URL Pattern                                 | Old Permission                                                    | New Permission                                                          | Differences                                                                                                      |
| ---------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `post` (DuplicateAssetEndpoint EE) | `POST /workspaces/<slug>/assets/duplicate/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` | `@can(WorkspaceAssetPermissions.CREATE, resource_param="workspace_id")` | Uses `workspace_asset:create` — W-Owner + W-Admin + W-Member (exact parity). W-Guest excluded (no create grant). |

**Import cleanup:** Replaced `from plane.app.permissions import ROLE, allow_permission` with `from plane.permissions import can, WorkspaceAssetPermissions`.

### EE Workspace Bulk Asset

**File:** `plane/ee/views/app/workspace/asset.py`

| Method                              | URL Pattern                                        | Old Permission                                                                | New Permission                                                        | Differences                                              |
| ----------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| `post` (WorkspaceBulkAssetEndpoint) | `POST /workspaces/<slug>/assets/<entity_id>/bulk/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspaceAssetPermissions.VIEW, resource_param="workspace_id")` | Uses `workspace_asset:view` — all WS roles retain access |

**Import cleanup:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import can, WorkspaceAssetPermissions`.

### ProjectAnalyticsEndpoint

**File:** `plane/ee/views/app/project/base.py`

| Method | URL Pattern                                               | Old Permission                                                                                           | New Permission                                                                                                  | Differences                                                                                                                                                                                                                                                                                            |
| ------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/analytics/` | `@check_feature_flag(PROJECT_OVERVIEW)` + `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@check_feature_flag(PROJECT_OVERVIEW)` + `@can(ProjectAnalyticsPermissions.VIEW, resource_param="project_id")` | Access tightened: old allowed any workspace member (workspace-level check). New requires project membership or workspace admin bypass. P-Admin: wildcard. P-Contributor: explicit grant. P-Commenter: grant added. P-Guest: NO (analytics exposes aggregate counts beyond guest's creator-only scope). |

**Import cleanup:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import can, ProjectPermissions, ProjectAnalyticsPermissions`.

**Role grant change:** Added `ProjectAnalyticsPermissions.VIEW` to P-Commenter in `system_roles.py`.

### ProjectFeatureEndpoint

**File:** `plane/ee/views/app/project/base.py`

| Method  | URL Pattern                                                | Old Permission                    | New Permission                                                 | Differences                                                            |
| ------- | ---------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `patch` | `PATCH /workspaces/<slug>/projects/<project_id>/features/` | `@allow_permission([ROLE.ADMIN])` | `@can(ProjectPermissions.MANAGE, resource_param="project_id")` | Direct mapping: P-Admin only (has `project:manage`). No access change. |

### PageFavoriteViewSet

**File:** `plane/app/views/page/base.py`

| Method    | URL Pattern                                                                 | Old Permission                       | New Permission                                         | Differences                                                                                                                                |
| --------- | --------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `create`  | `POST /workspaces/<slug>/projects/<project_id>/favorite-pages/<page_id>/`   | `@allow_permission([ADMIN, MEMBER])` | `@can(PagePermissions.EDIT, resource_param="page_id")` | Uses `page:edit` for project-level gate. P-Admin + P-Contributor only (exact parity). P-Commenter/P-Guest have only `page:view`, excluded. |
| `destroy` | `DELETE /workspaces/<slug>/projects/<project_id>/favorite-pages/<page_id>/` | `@allow_permission([ADMIN, MEMBER])` | `@can(PagePermissions.EDIT, resource_param="page_id")` | Same as create.                                                                                                                            |

**Import cleanup:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.app.permissions import ROLE` + `from plane.permissions import can, PagePermissions`. `ROLE` kept because `PageStatsEndpoint` uses `ROLE.GUEST.value` inline (line 473).

### CycleUpdatesReactionViewSet

**File:** `plane/ee/views/app/update/reaction.py`

| Method   | URL Pattern                                                                                                        | Old Permission                              | New Permission                                                   | Differences                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/updates/<update_id>/reactions/`                   | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(CycleUpdatePermissions.REACT, resource_param="update_id")` | Access tightened: old GUEST (role 5) could react. New P-Guest has no `cycle_update` access. P-Commenter gains REACT. |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/updates/<update_id>/reactions/<reaction_code>/` | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(CycleUpdatePermissions.REACT, resource_param="update_id")` | Same as create.                                                                                                      |

**Note:** Converted from `BaseViewSet` to `BaseAPIView` (`post`/`delete` instead of `create`/`destroy`); `list` removed. URL patterns now include `/cycles/<cycle_id>/` segment.

**Import cleanup:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import can, CycleUpdatePermissions`.

**Infrastructure change:** Added `Action.REACT` to `RESOURCE_ACTIONS[ResourceType.CYCLE_UPDATE]` in `definitions.py`. Added `CycleUpdatePermissions.REACT` grants to P-Contributor and P-Commenter in `system_roles.py`. P-Admin covered by `cycle_update:*` wildcard.

**Shared view split** — project update reactions moved to `ProjectUpdatesReactionViewSet`.

### RecurringWorkItemViewSet

**File:** `plane/ee/views/app/issue/recurring_work_item.py`

| Method                | URL Pattern                                                                  | Old Permission                       | New Permission                                                           | Differences                                   |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------- |
| `get` (list/retrieve) | `GET /workspaces/<slug>/projects/<project_id>/recurring-work-items/[<pk>/]`  | `@allow_permission([ADMIN, MEMBER])` | `@can(RecurringWorkitemPermissions.VIEW, resource_param="project_id")`   | Direct mapping. P-Admin + P-Contributor only. |
| `post`                | `POST /workspaces/<slug>/projects/<project_id>/recurring-work-items/`        | `@allow_permission([ADMIN, MEMBER])` | `@can(RecurringWorkitemPermissions.CREATE, resource_param="project_id")` | Direct mapping.                               |
| `patch`               | `PATCH /workspaces/<slug>/projects/<project_id>/recurring-work-items/<pk>/`  | `@allow_permission([ADMIN, MEMBER])` | `@can(RecurringWorkitemPermissions.EDIT, resource_param="pk")`           | Direct mapping.                               |
| `delete`              | `DELETE /workspaces/<slug>/projects/<project_id>/recurring-work-items/<pk>/` | `@allow_permission([ADMIN, MEMBER])` | `@can(RecurringWorkitemPermissions.DELETE, resource_param="pk")`         | Direct mapping.                               |

**Decorator stacking:** Feature flag `@check_feature_flag(FeatureFlag.RECURRING_WORKITEMS)` placed ABOVE `@can` per migration convention.

### RecurringWorkItemActivitiesEndpoint

**File:** `plane/ee/views/app/issue/recurring_work_item.py`

| Method | URL Pattern                                                                          | Old Permission                       | New Permission                                                 | Differences                                   |
| ------ | ------------------------------------------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------- | --------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/recurring-work-items/<pk>/activities/` | `@allow_permission([ADMIN, MEMBER])` | `@can(RecurringWorkitemPermissions.VIEW, resource_param="pk")` | Direct mapping. P-Admin + P-Contributor only. |

**Import cleanup:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import can, RecurringWorkitemPermissions`.

**Infrastructure change:** Added `RECURRING_WORKITEM` resource type to `definitions.py` (enum, RESOURCE_ACTIONS, permissions class, PROJECT_RESOURCE_TYPES). Added to `engine.py` (model map → `RecurringWorkitemTask`). Added to `inheritance.py` (hierarchy: parent=PROJECT, parent_field=project_id). Added grants in `system_roles.py`: W-Admin `"recurring_workitem:*"`, P-Admin `"recurring_workitem:*"`, P-Contributor full CRUD. P-Commenter/P-Guest: no grants.

### IssueTotalWorkLogEndpoint (Security Fix)

**File:** `plane/ee/views/app/issue/worklog.py`

| Method | URL Pattern                                                                      | Old Permission                                       | New Permission                                                | Differences                                                                                                                |
| ------ | -------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/total-worklogs/` | ⚠️ Only `IsAuthenticated` (inherited) + feature flag | `@can(WorkitemPermissions.VIEW, resource_param="project_id")` | **Security fix:** Added project-level `workitem:view` check. Previously any authenticated user could query worklog totals. |

**Decorator stacking:** Feature flag `@check_feature_flag(FeatureFlag.ISSUE_WORKLOG)` placed ABOVE `@can` per migration convention.

### IssuePropertyActivityEndpoint

**File:** `plane/ee/views/app/issue_property/activity.py`

| Method | URL Pattern                                                                         | Old Permission                                   | New Permission                                                | Differences                                                                                                              |
| ------ | ----------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/property-activity/` | `permission_classes = [ProjectEntityPermission]` | `@can(WorkitemPermissions.VIEW, resource_param="project_id")` | Direct mapping. Old allowed any project member for GET. New checks `workitem:view` — P-Guest has conditional `+creator`. |

**Import cleanup:** Removed `from plane.ee.permissions import ProjectEntityPermission`. Added `from plane.permissions import can, WorkitemPermissions`.

**Decorator stacking:** Feature flag `@check_feature_flag(FeatureFlag.ISSUE_TYPES)` placed ABOVE `@can` per migration convention.

### ProjectLinkViewSet (New Resource Type)

**File:** `plane/ee/views/app/project/link.py`

| Method           | URL Pattern                                                   | Old Permission                                                   | New Permission                                                     | Differences                                                                        |
| ---------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/projects/<project_id>/links/`         | `permission_classes = [ProjectEntityPermission]` (class-level)   | `@can(ProjectLinkPermissions.VIEW, resource_param="project_id")`   | New resource type `PROJECT_LINK`. P-Guest loses access (no `project_link` grants). |
| `retrieve`       | `GET /workspaces/<slug>/projects/<project_id>/links/<pk>/`    | `permission_classes = [ProjectEntityPermission]` (class-level)   | `@can(ProjectLinkPermissions.VIEW, resource_param="pk")`           | Same as list.                                                                      |
| `create`         | `POST /workspaces/<slug>/projects/<project_id>/links/`        | `@allow_permission([ADMIN, MEMBER])` + `ProjectEntityPermission` | `@can(ProjectLinkPermissions.CREATE, resource_param="project_id")` | Direct mapping. P-Admin + P-Contributor.                                           |
| `partial_update` | `PATCH /workspaces/<slug>/projects/<project_id>/links/<pk>/`  | `@allow_permission([ADMIN, MEMBER])` + `ProjectEntityPermission` | `@can(ProjectLinkPermissions.EDIT, resource_param="pk")`           | Direct mapping. P-Admin + P-Contributor.                                           |
| `destroy`        | `DELETE /workspaces/<slug>/projects/<project_id>/links/<pk>/` | `@allow_permission([ADMIN])` + `ProjectEntityPermission`         | `@can(ProjectLinkPermissions.DELETE, resource_param="pk")`         | Direct mapping. P-Admin only. P-Contributor does NOT get DELETE.                   |

**Import cleanup:** Removed `from plane.app.permissions import ProjectEntityPermission, allow_permission, ROLE`. Added `from plane.permissions import can, ProjectLinkPermissions`. Removed class-level `permission_classes = [ProjectEntityPermission]`.

**Decorator stacking:** Feature flag `@check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)` placed ABOVE `@can` per migration convention.

**Infrastructure change:** Added `PROJECT_LINK` resource type to `definitions.py` (enum, RESOURCE_ACTIONS, permissions class, PROJECT_RESOURCE_TYPES). Added to `engine.py` (model map → `ProjectLink`). Added to `inheritance.py` (hierarchy: parent=PROJECT, parent_field=project_id; added to PROJECT's children list). Added grants in `system_roles.py`: W-Admin `"project_link:*"`, P-Admin `"project_link:*"`, P-Contributor `project_link:view`, `project_link:create`, `project_link:edit`. P-Commenter `project_link:view`. P-Guest: no grants.

### WorkspaceProjectFeatureEndpoint

**File:** `plane/ee/views/app/project/base.py`

| Method | URL Pattern                                          | Old Permission                                                 | New Permission                                                   | Differences                                              |
| ------ | ---------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/workspace-project-features/` | `@allow_permission([ADMIN, MEMBER, GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Exact parity. All workspace roles have `workspace:view`. |

**Import change:** Added `WorkspacePermissions` to existing `from plane.permissions import ...`. Kept `allow_permission, ROLE` import — still used by `ProjectAttributesEndpoint` in same file.

### IssueConvertEndpoint

**File:** `plane/ee/views/app/issue/convert.py`

| Method | URL Pattern                                                             | Old Permission                                                                                                                | New Permission                                                                                                                  | Differences                                                                                                                                                                                                                                                                                                                                                              |
| ------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/conversion/<entity_id>/` | None — no decorator, no permission class, no inline check. Any authenticated user could convert any issue across any project. | Inline `permission_engine.check(WorkitemPermissions.EDIT)` + `permission_engine.check(EpicPermissions.EDIT)` if source is epic. | **Security fix.** Previously zero permission checks. Now requires `workitem:edit` on the entity. If source is an epic, additionally requires `epic:edit`. Added `project_id` scope filter to `Issue.objects.get()` to prevent cross-project entity access. P-Admin/P-Contributor: full access. P-Commenter/P-Guest: own workitems only (`+creator`), no epic conversion. |

**Import change:** Added `permission_engine, WorkitemPermissions, EpicPermissions` from `plane.permissions`. Added `PermissionDenied` from `rest_framework.exceptions`.

### IssueDuplicateEndpoint

**File:** `plane/ee/views/app/issue/duplicate.py`

| Method | URL Pattern                                            | Old Permission                                                                                                                                                                                                 | New Permission                                                                                                                                                                                              | Differences                                                                                                                                                                                                                                                                                                                         |
| ------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/issues/<issue_id>/duplicate/` | Feature flag + bare `ProjectMember.objects.filter(project_id, member_id, is_active).exists()` on destination project. Any project role (including Guest) could duplicate. No check on source issue visibility. | `@can(WorkitemPermissions.VIEW, resource_param="issue_id")` for source issue + inline `permission_engine.check(WorkitemPermissions.CREATE, scope_param_type=ResourceType.PROJECT)` for destination project. | **Security fix.** Source issue: now requires `workitem:view` — P-Guest limited to own issues (`+creator`). Destination project: tightened from any-role to `workitem:create` — only P-Admin and P-Contributor can duplicate into a project. P-Commenter/P-Guest lose destination access (correct: duplicating creates a new issue). |

**Import change:** Added `can, permission_engine, WorkitemPermissions` from `plane.permissions`. Added `ResourceType` from `plane.permissions.definitions`. Added `PermissionDenied` from `rest_framework.exceptions`. Removed `Project, ProjectMember` from `plane.db.models` import.

---

## Issue Property Views (Batch Migration — 2026-02-22)

**New resource type:** `ISSUE_PROPERTY` — mirrors existing `EPIC_PROPERTY`. Added to `definitions.py` (enum, `RESOURCE_ACTIONS`, `IssuePropertyPermissions` class, `PROJECT_RESOURCE_TYPES`), `inheritance.py` (hierarchy entry under `PROJECT`), `engine.py` (model map → `IssueProperty`), `system_roles.py` (role grants), `__init__.py` (export).

**Role grants:**

- **W-Admin:** `"issue_property:*"` (wildcard bypass)
- **P-Admin:** `"issue_property:*"` (wildcard)
- **P-Contributor:** explicit `issue_property:view`, `issue_property:create`, `issue_property:edit`, `issue_property:delete`
- **P-Commenter:** explicit `issue_property:view`
- **P-Guest:** no grants

### IssuePropertyEndpoint

**File:** `plane/ee/views/app/issue_property/base.py`

| Method   | URL Pattern                                                                                          | Old Permission                                       | New Permission                                                       | Differences                                            |
| -------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/issue-properties/`                                     | `ProjectEntityPermission` (any project member)       | `@can(IssuePropertyPermissions.VIEW, resource_param="project_id")`   | P-Guest loses access (no `issue_property:view` grant). |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/issue-types/<issue_type_id>/issue-properties/`        | `ProjectEntityPermission` (Admin + Member for write) | `@can(IssuePropertyPermissions.CREATE, resource_param="project_id")` | Direct mapping to P-Admin + P-Contributor.             |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/issue-types/<issue_type_id>/issue-properties/<pk>/`  | `ProjectEntityPermission` (Admin + Member for write) | `@can(IssuePropertyPermissions.EDIT, resource_param="project_id")`   | Direct mapping.                                        |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/issue-types/<issue_type_id>/issue-properties/<pk>/` | `ProjectEntityPermission` (Admin + Member for write) | `@can(IssuePropertyPermissions.DELETE, resource_param="project_id")` | Direct mapping.                                        |

**Import change:** Replaced `ProjectEntityPermission` from `plane.ee.permissions` with `can, IssuePropertyPermissions` from `plane.permissions`. Removed `permission_classes`.

### IssuePropertyOptionEndpoint

**File:** `plane/ee/views/app/issue_property/option.py`

| Method   | URL Pattern                                                                                        | Old Permission                                       | New Permission                                                     | Differences                                                                                                |
| -------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/issue-property-options/`                             | `ProjectEntityPermission` (any project member)       | `@can(IssuePropertyPermissions.VIEW, resource_param="project_id")` | P-Guest loses access.                                                                                      |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/issue-property-options/<issue_property_id>/`        | `ProjectEntityPermission` (Admin + Member for write) | `@can(IssuePropertyPermissions.EDIT, resource_param="project_id")` | Uses EDIT (not CREATE) — option mutations are property schema edits. Mirrors `EpicPropertyOptionEndpoint`. |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/issue-property-options/<issue_property_id>/<pk>/`  | `ProjectEntityPermission` (Admin + Member for write) | `@can(IssuePropertyPermissions.EDIT, resource_param="project_id")` | Uses EDIT — same rationale.                                                                                |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/issue-property-options/<issue_property_id>/<pk>/` | `ProjectEntityPermission` (Admin + Member for write) | `@can(IssuePropertyPermissions.EDIT, resource_param="project_id")` | Uses EDIT — deleting an option is a schema mutation.                                                       |

**Import change:** Replaced `ProjectEntityPermission` from `plane.ee.permissions` with `can, IssuePropertyPermissions` from `plane.permissions`. Removed `permission_classes`.

### IssuePropertyValueEndpoint

**File:** `plane/ee/views/app/issue_property/value.py`

Uses `WorkitemPermissions` (not `IssuePropertyPermissions`) — setting property values = editing the workitem. Mirrors `EpicPropertyValueEndpoint` using `EpicPermissions`.

| Method  | URL Pattern                                                                                             | Old Permission                                       | New Permission                                                | Differences                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `get`   | `GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-property-values/`                 | `ProjectEntityPermission` (any project member)       | `@can(WorkitemPermissions.VIEW, resource_param="project_id")` | Follows existing workitem permission grants. P-Guest: conditional `+creator`.         |
| `post`  | `POST /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-property-values/`                | `ProjectEntityPermission` (Admin + Member for write) | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Direct mapping.                                                                       |
| `patch` | `PATCH /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-property-values/<property_id>/` | `ProjectEntityPermission` (Admin + Member for write) | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Retains inline archived issue check (returns 403 if `issue.archived_at is not None`). |

**Import change:** Replaced `ProjectEntityPermission` from `plane.ee.permissions` with `can, WorkitemPermissions` from `plane.permissions`. Removed `permission_classes`.

### DraftIssuePropertyValueEndpoint

**File:** `plane/ee/views/app/issue_property/draft.py`

Uses `WorkitemPermissions` — same rationale as `IssuePropertyValueEndpoint`.

| Method  | URL Pattern                                                                                                         | Old Permission                                       | New Permission                                                | Differences                       |
| ------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- | --------------------------------- |
| `get`   | `GET /workspaces/<slug>/projects/<project_id>/draft-issues/<draft_issue_id>/issue-property-values/`                 | `ProjectEntityPermission` (any project member)       | `@can(WorkitemPermissions.VIEW, resource_param="project_id")` | Follows existing workitem grants. |
| `post`  | `POST /workspaces/<slug>/projects/<project_id>/draft-issues/<draft_issue_id>/issue-property-values/`                | `ProjectEntityPermission` (Admin + Member for write) | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Direct mapping.                   |
| `patch` | `PATCH /workspaces/<slug>/projects/<project_id>/draft-issues/<draft_issue_id>/issue-property-values/<property_id>/` | `ProjectEntityPermission` (Admin + Member for write) | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Direct mapping.                   |

**Import change:** Replaced `ProjectEntityPermission` from `plane.ee.permissions` with `can, WorkitemPermissions` from `plane.permissions`. Removed `permission_classes`.

### WorkspaceIssueTypeEndpoint

**File:** `plane/ee/views/app/issue_property/type.py`

| Method | URL Pattern                           | Old Permission                                     | New Permission                                                   | Differences                                                 |
| ------ | ------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/issue-types/` | `WorkspaceEntityPermission` (any workspace member) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping — all workspace roles have `workspace:view`. |

**Import change:** Replaced `WorkspaceEntityPermission` from `plane.ee.permissions` with `can, WorkspacePermissions` from `plane.permissions`.

### IssueTypeEndpoint

**File:** `plane/ee/views/app/issue_property/type.py`

| Method   | URL Pattern                                                         | Old Permission                                       | New Permission                                                       | Differences           |
| -------- | ------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- | --------------------- |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/issue-types/`         | `ProjectEntityPermission` (any project member)       | `@can(IssuePropertyPermissions.VIEW, resource_param="project_id")`   | P-Guest loses access. |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/issue-types/`        | `ProjectEntityPermission` (Admin + Member for write) | `@can(IssuePropertyPermissions.CREATE, resource_param="project_id")` | Direct mapping.       |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/issue-types/<pk>/`  | `ProjectEntityPermission` (Admin + Member for write) | `@can(IssuePropertyPermissions.EDIT, resource_param="project_id")`   | Direct mapping.       |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/issue-types/<pk>/` | `ProjectEntityPermission` (Admin + Member for write) | `@can(IssuePropertyPermissions.DELETE, resource_param="project_id")` | Direct mapping.       |

**Import change:** Replaced `ProjectEntityPermission` with `can, IssuePropertyPermissions` from `plane.permissions`.

### DefaultIssueTypeEndpoint

**File:** `plane/ee/views/app/issue_property/type.py`

| Method | URL Pattern                                                          | Old Permission                                       | New Permission                                                     | Differences                                                             |
| ------ | -------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/issue-types/default/` | `ProjectEntityPermission` (Admin + Member for write) | `@can(IssuePropertyPermissions.EDIT, resource_param="project_id")` | Uses EDIT — setting the default type is a project configuration change. |

**Import change:** Same as `IssueTypeEndpoint` (shared file).

### ExportIssuesEndpoint

**File:** `apps/api/plane/app/views/exporter/base.py`

| Method | URL Pattern                              | Old Permission                                                    | New Permission                                                     | Differences                                                                                        |
| ------ | ---------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/export-issues/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` | `@can(AnalyticsPermissions.EXPORT, resource_param="workspace_id")` | Direct mapping. W-Owner/Admin/Member have `analytics:export`.                                      |
| `get`  | `GET /workspaces/<slug>/export-issues/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` | `@can(AnalyticsPermissions.EXPORT, resource_param="workspace_id")` | Direct mapping. Data-level filter retained: members see only own exports (inline `role=15` check). |

> **Data-level filter (GET):** Inline `WorkspaceMember` role check (not a permission gate). Members (`role=15`) see only exports they initiated; admins/owners see all. This filter is business logic, not expressible via `@can`.

**Import change:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import can, AnalyticsPermissions`. Inline `ROLE.MEMBER.value` replaced with literal `15`.

### EE Exporter Views (Batch)

7 EE exporter endpoints migrated. All are single `post` methods with no inline business logic, no creator bypasses, no data-level filtering. New `Action.EXPORT` added to 7 resource types; 6 explicit P-Contributor grants + 1 W-Member grant added.

#### ProjectWorkItemExportEndpoint

**File:** `apps/api/plane/ee/views/app/exporter/workitem.py`

| Method | URL Pattern                                                    | Old Permission                                 | New Permission                                                  | Differences                                                                         |
| ------ | -------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/export-issues/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(WorkitemPermissions.EXPORT, resource_param="project_id")` | New `workitem:export` permission. P-Admin via `workitem:*`, P-Contributor explicit. |

#### ProjectCycleExportEndpoint

**File:** `apps/api/plane/ee/views/app/exporter/cycle.py`

| Method | URL Pattern                                                                      | Old Permission                                 | New Permission                                               | Differences                                                                   |
| ------ | -------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/export-issues/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(CyclePermissions.EXPORT, resource_param="project_id")` | New `cycle:export` permission. P-Admin via `cycle:*`, P-Contributor explicit. |

#### ProjectModuleExportEndpoint

**File:** `apps/api/plane/ee/views/app/exporter/module.py`

| Method | URL Pattern                                                                        | Old Permission                                 | New Permission                                                | Differences                                                                     |
| ------ | ---------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/modules/<module_id>/export-issues/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(ModulePermissions.EXPORT, resource_param="project_id")` | New `module:export` permission. P-Admin via `module:*`, P-Contributor explicit. |

#### ProjectViewExportEndpoint

**File:** `apps/api/plane/ee/views/app/exporter/view.py`

| Method | URL Pattern                                                                    | Old Permission                                 | New Permission                                                      | Differences                                                                                   |
| ------ | ------------------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/views/<view_id>/export-issues/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(WorkitemViewPermissions.EXPORT, resource_param="project_id")` | New `workitem_view:export` permission. P-Admin via `workitem_view:*`, P-Contributor explicit. |

#### WorkspaceViewExportEndpoint

**File:** `apps/api/plane/ee/views/app/exporter/view.py`

| Method | URL Pattern                                              | Old Permission                                                    | New Permission                                                                 | Differences                                                                                                  |
| ------ | -------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `post` | `POST /workspaces/<slug>/views/<view_id>/export-issues/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` | `@can(WorkspaceWorkitemViewPermissions.EXPORT, resource_param="workspace_id")` | New `workspace_workitem_view:export` permission. W-Admin via `workspace_workitem_view:*`, W-Member explicit. |

#### ProjectEpicExportEndpoint

**File:** `apps/api/plane/ee/views/app/exporter/epic.py`

| Method | URL Pattern                                                   | Old Permission                                 | New Permission                                              | Differences                                                                 |
| ------ | ------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/export-epics/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(EpicPermissions.EXPORT, resource_param="project_id")` | New `epic:export` permission. P-Admin via `epic:*`, P-Contributor explicit. |

#### ProjectIntakeExportEndpoint

**File:** `apps/api/plane/ee/views/app/exporter/intake.py`

| Method | URL Pattern                                                    | Old Permission                                 | New Permission                                                | Differences                                                                     |
| ------ | -------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/export-intake/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(IntakePermissions.EXPORT, resource_param="project_id")` | New `intake:export` permission. P-Admin via `intake:*`, P-Contributor explicit. |

**Import changes (all 6 files):** Replaced `from plane.app.permissions import ROLE, allow_permission` with `from plane.permissions import can, <DomainPermissions>`. Feature flag decorator (`@check_feature_flag`) moved above `@can` (6 project endpoints). `WorkspaceViewExportEndpoint` has no feature flag.

### Tier A Simple Views (Batch)

4 simple single-method endpoints with no inline business logic, no creator bypasses, no data-level filtering. New `Action.IMPORT` added to `WORKSPACE_MEMBER` and `WORKITEM` resource types. `WorkspaceMemberPermissions.IMPORT` explicit grant added to W-Admin.

#### WorkspaceIssueRetrieveEndpoint

**File:** `apps/api/plane/ee/views/app/workspace/issue.py`

| Method | URL Pattern                                 | Old Permission                                                                | New Permission                                                   | Differences                                                 |
| ------ | ------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/issues/<issue_id>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping — all workspace roles have `workspace:view`. |

**Import change:** Added `from plane.permissions import can, WorkspacePermissions`. Kept existing `allow_permission, ROLE` import — other views in file still use it.

#### ProjectAttributesEndpoint

**File:** `apps/api/plane/ee/views/app/project/base.py`

| Method | URL Pattern                                  | Old Permission                                                                | New Permission                                                   | Differences                                                                                                                    |
| ------ | -------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `get`  | `GET /workspaces/<slug>/project-attributes/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Direct mapping — all workspace roles have `workspace:view`. Also gated by `@check_feature_flag(FeatureFlag.PROJECT_GROUPING)`. |

**Import change:** Removed `from plane.app.permissions import allow_permission, ROLE` — no other view in file uses it. File already imports `from plane.permissions import can, ... WorkspacePermissions`.

#### WorkspaceMembersImportEndpoint

**File:** `apps/api/plane/ee/views/app/workspace/user_import.py`

| Method | URL Pattern                               | Old Permission                                       | New Permission                                                           | Differences                                                                                     |
| ------ | ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/members-import/` | `@allow_permission([ROLE.ADMIN], level="WORKSPACE")` | `@can(WorkspaceMemberPermissions.IMPORT, resource_param="workspace_id")` | New `workspace_member:import` permission. W-Owner via `*` wildcard, W-Admin via explicit grant. |

**Import change:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import can, WorkspaceMemberPermissions`.

#### ProjectWorkItemImportEndpoint

**File:** `apps/api/plane/ee/views/app/importer/workitem.py`

| Method | URL Pattern                                                        | Old Permission                                       | New Permission                                                  | Differences                                                                                                                                                                                                                              |
| ------ | ------------------------------------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/work-items/import/` | `@allow_permission([ROLE.ADMIN], level="WORKSPACE")` | `@can(WorkitemPermissions.IMPORT, resource_param="project_id")` | New `workitem:import` permission. W-Owner via `*`, W-Admin via `workitem:*`. **Intentional access expansion:** P-Admin gains access via `workitem:*` wildcard — project admins can import into their projects. Follows export precedent. |

**Import change:** Replaced `from plane.app.permissions import allow_permission, ROLE` with `from plane.permissions import can, WorkitemPermissions`.

### BulkIssueOperationsEndpoint

**File:** `plane/ee/views/app/issue/bulk_operations.py`

| Method | URL Pattern                                                            | Old Permission            | New Permission                                                     | Differences                                                                                                   |
| ------ | ---------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/bulk-operation-issues/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.BULK_EDIT, resource_param="project_id")` | Direct mapping. Old: Admin/Member for mutations. New: P-Admin (wildcard), P-Contributor (workitem:bulk_edit). |

### BulkSubscribeIssuesEndpoint

**File:** `plane/ee/views/app/issue/bulk_operations.py`

| Method | URL Pattern                                                            | Old Permission            | New Permission                                                | Differences                                             |
| ------ | ---------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/bulk-subscribe-issues/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.VIEW, resource_param="project_id")` | Subscribing is view-level. Broader: includes Commenter. |

### IssuePageViewSet

**File:** `plane/ee/views/app/issue/issue_page.py`

| Method   | URL Pattern                                         | Old Permission          | New Permission                                                | Differences                      |
| -------- | --------------------------------------------------- | ----------------------- | ------------------------------------------------------------- | -------------------------------- |
| `post`   | `POST .../work-items/<issue_id>/pages/`             | `ProjectLitePermission` | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Tighter: Admin+Contributor only. |
| `get`    | `GET .../work-items/<issue_id>/pages/`              | `ProjectLitePermission` | `@can(WorkitemPermissions.VIEW, resource_param="project_id")` | Parity.                          |
| `delete` | `DELETE .../work-items/<issue_id>/pages/<page_id>/` | `ProjectLitePermission` | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Tighter: Admin+Contributor only. |

### PageSearchViewSet

**File:** `plane/ee/views/app/issue/issue_page.py`

| Method | URL Pattern             | Old Permission          | New Permission                                            | Differences |
| ------ | ----------------------- | ----------------------- | --------------------------------------------------------- | ----------- |
| `get`  | `GET .../pages-search/` | `ProjectLitePermission` | `@can(PagePermissions.VIEW, resource_param="project_id")` | Parity.     |

### IssueWorkLogsEndpoint

**File:** `plane/ee/views/app/issue/worklog.py`

| Method   | URL Pattern                 | Old Permission            | New Permission                                                | Differences                |
| -------- | --------------------------- | ------------------------- | ------------------------------------------------------------- | -------------------------- |
| `get`    | `GET .../worklogs/`         | `ProjectEntityPermission` | `@can(WorkitemPermissions.VIEW, resource_param="project_id")` | Parity.                    |
| `post`   | `POST .../worklogs/`        | `ProjectEntityPermission` | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Parity: Admin+Contributor. |
| `patch`  | `PATCH .../worklogs/<pk>/`  | `ProjectEntityPermission` | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Same.                      |
| `delete` | `DELETE .../worklogs/<pk>/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Same.                      |

### ProjectUpdatesViewSet

**File:** `plane/ee/views/app/project/update.py`

| Method            | URL Pattern                       | Old Permission                              | New Permission                                                       | Differences                               |
| ----------------- | --------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| `list`            | `GET .../updates/`                | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectUpdatePermissions.VIEW, resource_param="project_id")`   | Parity.                                   |
| `retrieve`        | `GET .../updates/<pk>/`           | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectUpdatePermissions.VIEW, resource_param="pk")`           | Parity.                                   |
| `create`          | `POST .../updates/`               | `@allow_permission([ADMIN, MEMBER])`        | `@can(ProjectUpdatePermissions.CREATE, resource_param="project_id")` | Parity.                                   |
| `partial_update`  | `PATCH .../updates/<pk>/`         | `@allow_permission([ADMIN], creator=True)`  | `@can(ProjectUpdatePermissions.EDIT, resource_param="pk")`           | Security fix: membership always verified. |
| `destroy`         | `DELETE .../updates/<pk>/`        | `@allow_permission([ADMIN], creator=True)`  | `@can(ProjectUpdatePermissions.DELETE, resource_param="pk")`         | Security fix.                             |
| `comments_list`   | `GET .../updates/<pk>/comments/`  | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectUpdateCommentPermissions.VIEW, ...)`                    | Parity.                                   |
| `comments_create` | `POST .../updates/<pk>/comments/` | `@allow_permission([ADMIN, MEMBER])`        | `@can(ProjectUpdateCommentPermissions.CREATE, ...)`                  | Parity.                                   |

### ProjectUpdatesReactionViewSet

**File:** `plane/ee/views/app/project/update.py`

| Method   | URL Pattern                                                 | Old Permission | New Permission                                                      | Differences   |
| -------- | ----------------------------------------------------------- | -------------- | ------------------------------------------------------------------- | ------------- |
| `post`   | `POST .../updates/<update_id>/reactions/`                   | (new view)     | `@can(ProjectUpdatePermissions.REACT, resource_param="project_id")` | New endpoint. |
| `delete` | `DELETE .../updates/<update_id>/reactions/<reaction_code>/` | (new view)     | `@can(ProjectUpdatePermissions.REACT, resource_param="project_id")` | New endpoint. |

**Infrastructure change:** Added `Action.REACT` to `RESOURCE_ACTIONS[ResourceType.PROJECT_UPDATE]` in `definitions.py`. Grants added to P-Contributor and P-Commenter. Split from shared `UpdatesReactionViewSet`.

### ProjectUpdateCommentsReactionViewSet

**File:** `plane/ee/views/app/project/update.py`

| Method   | URL Pattern                                                                | Old Permission | New Permission                                                                                                   | Differences   |
| -------- | -------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- | ------------- |
| `post`   | `POST .../updates/<pk>/comments/<comment_id>/reactions/`                   | (new view)     | `@can(ProjectUpdateCommentPermissions.REACT, resource_param="pk", scope_param_type=ResourceType.PROJECT_UPDATE)` | New endpoint. |
| `delete` | `DELETE .../updates/<pk>/comments/<comment_id>/reactions/<reaction_code>/` | (new view)     | `@can(ProjectUpdateCommentPermissions.REACT, resource_param="pk", scope_param_type=ResourceType.PROJECT_UPDATE)` | New endpoint. |

**Infrastructure change:** Added `Action.REACT` to `RESOURCE_ACTIONS[ResourceType.PROJECT_UPDATE_COMMENT]` in `definitions.py`. Grants added to P-Contributor and P-Commenter.

### ProjectAttachmentV2Endpoint

**File:** `plane/ee/views/app/project/attachment.py`

| Method   | URL Pattern                    | Old Permission                              | New Permission                                                      | Differences                               |
| -------- | ------------------------------ | ------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------- |
| `post`   | `POST .../attachments/`        | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectAssetPermissions.CREATE, resource_param="project_id")` | Parity.                                   |
| `get`    | `GET .../attachments/`         | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectAssetPermissions.VIEW, resource_param="project_id")`   | Parity.                                   |
| `patch`  | `PATCH .../attachments/<pk>/`  | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectAssetPermissions.EDIT, resource_param="project_id")`   | Commenter/Guest via +creator.             |
| `delete` | `DELETE .../attachments/<pk>/` | `@allow_permission([ADMIN], creator=True)`  | `@can(ProjectAssetPermissions.DELETE, resource_param="pk")`         | Security fix: membership always verified. |

### WorkspaceIssueDetailEndpoint

**File:** `plane/ee/views/app/workspace/issue.py`

| Method | URL Pattern                             | Old Permission                                         | New Permission                                                   | Differences                                        |
| ------ | --------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/issues-detail/` | `@allow_permission([ADMIN, MEMBER, GUEST], WORKSPACE)` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Parity. Inline filter updated for new role system. |

### WorkspaceIssueBulkUpdateDateEndpoint

**File:** `plane/ee/views/app/workspace/issue.py`

| Method | URL Pattern                            | Old Permission                                  | New Permission                                                                                                  | Differences                                   |
| ------ | -------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `post` | `POST /workspaces/<slug>/issue-dates/` | `@allow_permission([ADMIN, MEMBER], WORKSPACE)` | `@can(WorkspacePermissions.VIEW, ...)` + inline `permission_engine.check(WorkitemPermissions.EDIT)` per project | More secure: per-project workitem:edit check. |

### WorkspaceWorkLogsEndpoint

**File:** `plane/ee/views/app/workspace/worklogs.py`

| Method | URL Pattern                        | Old Permission             | New Permission                                                          | Differences                            |
| ------ | ---------------------------------- | -------------------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| `get`  | `GET /workspaces/<slug>/worklogs/` | `WorkSpaceAdminPermission` | `@can(WorkspaceWorklogPermissions.VIEW, resource_param="workspace_id")` | Parity: Admin+Member. W-Guest blocked. |

### WorkspaceExportWorkLogsEndpoint

**File:** `plane/ee/views/app/workspace/worklogs.py`

| Method | URL Pattern                                | Old Permission             | New Permission                                                            | Differences           |
| ------ | ------------------------------------------ | -------------------------- | ------------------------------------------------------------------------- | --------------------- |
| `get`  | `GET /workspaces/<slug>/export-worklogs/`  | `WorkSpaceAdminPermission` | `@can(WorkspaceWorklogPermissions.VIEW, resource_param="workspace_id")`   | Parity: Admin+Member. |
| `post` | `POST /workspaces/<slug>/export-worklogs/` | `WorkSpaceAdminPermission` | `@can(WorkspaceWorklogPermissions.EXPORT, resource_param="workspace_id")` | Parity: Admin+Member. |

### WorkspaceProjectStatesEndpoint

**File:** `plane/ee/views/app/workspace/project_state.py`

| Method   | URL Pattern                       | Old Permission              | New Permission                                                                 | Differences           |
| -------- | --------------------------------- | --------------------------- | ------------------------------------------------------------------------------ | --------------------- |
| `get`    | `GET .../project-states/`         | `WorkspaceEntityPermission` | `@can(WorkspaceProjectStatePermissions.VIEW, resource_param="workspace_id")`   | Parity.               |
| `post`   | `POST .../project-states/`        | `WorkspaceEntityPermission` | `@can(WorkspaceProjectStatePermissions.CREATE, resource_param="workspace_id")` | Parity: Admin+Member. |
| `patch`  | `PATCH .../project-states/<pk>/`  | `WorkspaceEntityPermission` | `@can(WorkspaceProjectStatePermissions.EDIT, resource_param="pk")`             | Parity.               |
| `delete` | `DELETE .../project-states/<pk>/` | `WorkspaceEntityPermission` | `@can(WorkspaceProjectStatePermissions.DELETE, resource_param="pk")`           | Parity.               |

### WorkspaceProjectStatesDefaultEndpoint

**File:** `plane/ee/views/app/workspace/project_state.py`

| Method | URL Pattern                             | Old Permission              | New Permission                                                     | Differences           |
| ------ | --------------------------------------- | --------------------------- | ------------------------------------------------------------------ | --------------------- |
| `post` | `POST .../project-states/<pk>/default/` | `WorkspaceEntityPermission` | `@can(WorkspaceProjectStatePermissions.EDIT, resource_param="pk")` | Parity: Admin+Member. |

### WorkspaceCredentialView

**File:** `plane/ee/views/app/workspace/credential.py`

| Method   | URL Pattern                    | Old Permission              | New Permission                                                       | Differences                    |
| -------- | ------------------------------ | --------------------------- | -------------------------------------------------------------------- | ------------------------------ |
| `delete` | `DELETE .../credentials/<pk>/` | `WorkspaceEntityPermission` | `@can(IntegrationPermissions.DELETE, resource_param="workspace_id")` | Tighter: W-Guest loses access. |

### VerifyWorkspaceCredentialView

**File:** `plane/ee/views/app/workspace/credential.py`

| Method | URL Pattern                               | Old Permission              | New Permission                                                        | Differences                         |
| ------ | ----------------------------------------- | --------------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| `get`  | `GET .../credentials/token-verify/`       | `WorkspaceEntityPermission` | `@can(IntegrationPermissions.VIEW, resource_param="workspace_id")`    | W-Guest loses access (intentional). |
| `post` | `POST .../credentials/<pk>/token-verify/` | `WorkspaceEntityPermission` | `@can(IntegrationPermissions.CONNECT, resource_param="workspace_id")` | Parity for Admin+Member.            |

### WorkspaceConnectionView

**File:** `plane/ee/views/app/workspace/connection.py`

| Method   | URL Pattern                    | Old Permission              | New Permission                                                       | Differences              |
| -------- | ------------------------------ | --------------------------- | -------------------------------------------------------------------- | ------------------------ |
| `get`    | `GET .../connections/`         | `WorkspaceEntityPermission` | `@can(IntegrationPermissions.VIEW, resource_param="workspace_id")`   | W-Guest loses access.    |
| `delete` | `DELETE .../connections/<pk>/` | `WorkspaceEntityPermission` | `@can(IntegrationPermissions.DELETE, resource_param="workspace_id")` | Parity for Admin+Member. |

### WorkspaceUserConnectionView

**File:** `plane/ee/views/app/workspace/connection.py`

| Method | URL Pattern                           | Old Permission              | New Permission                                                     | Differences           |
| ------ | ------------------------------------- | --------------------------- | ------------------------------------------------------------------ | --------------------- |
| `get`  | `GET .../user-connections/<user_id>/` | `WorkspaceEntityPermission` | `@can(IntegrationPermissions.VIEW, resource_param="workspace_id")` | W-Guest loses access. |

### WorkspaceEntityConnectionView

**File:** `plane/ee/views/app/workspace/entity_connection.py`

| Method | URL Pattern                   | Old Permission              | New Permission                                                     | Differences           |
| ------ | ----------------------------- | --------------------------- | ------------------------------------------------------------------ | --------------------- |
| `get`  | `GET .../entity-connections/` | `WorkspaceEntityPermission` | `@can(IntegrationPermissions.VIEW, resource_param="workspace_id")` | W-Guest loses access. |

### WorkspaceFeaturesEndpoint

**File:** `plane/ee/views/app/workspace/feature.py`

| Method  | URL Pattern           | Old Permission              | New Permission                                                     | Differences                                                                                                           |
| ------- | --------------------- | --------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `get`   | `GET .../features/`   | `WorkspaceEntityPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`   | Widened to W-Guest (feature toggle state is non-sensitive; FE already surfaces it to all workspace members).          |
| `patch` | `PATCH .../features/` | `WorkspaceEntityPermission` | `@can(WorkspacePermissions.MANAGE, resource_param="workspace_id")` | Tightened: W-Member loses edit. Workspace feature toggles are admin-only settings; not used by FE for W-Member today. |

### WorkspaceInviteCheckEndpoint

**File:** `plane/ee/views/app/workspace/invite.py`

| Method | URL Pattern             | Old Permission             | New Permission                                                           | Differences                                                             |
| ------ | ----------------------- | -------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `get`  | `GET .../invite-check/` | `WorkSpaceAdminPermission` | `@can(WorkspaceMemberPermissions.INVITE, resource_param="workspace_id")` | Tighter: W-Admin only (W-Member does not have workspace_member:invite). |

---

## Legacy Integration Views Migration (2026-02-22)

> **Batch migration:** 8 views in `plane/app/views/integration/`. Only 2 endpoints actively called by FE (OAuth callback page `installations/[provider]/page.tsx`). 6 views + unused methods on active views handled via Pattern H (URLs commented out).

### WorkspaceIntegrationViewSet

**File:** `plane/app/views/integration/base.py`

| Method                 | URL Pattern                                                  | Old Permission             | New Permission                                                        | Differences                                                                       |
| ---------------------- | ------------------------------------------------------------ | -------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `create`               | `POST /workspaces/<slug>/workspace-integrations/<provider>/` | `WorkSpaceAdminPermission` | `@can(IntegrationPermissions.CONNECT, resource_param="workspace_id")` | Parity: W-Admin (`integration:*`) + W-Member (`integration:connect`). W-Guest ❌. |
| `list`                 | `GET /workspaces/<slug>/workspace-integrations/`             | `WorkSpaceAdminPermission` | ⏸ URL commented out (Pattern H — not called by FE)                    | N/A                                                                               |
| `retrieve` / `destroy` | `GET/DELETE .../workspace-integrations/<pk>/provider/`       | `WorkSpaceAdminPermission` | ⏸ URL commented out (Pattern H — not called by FE)                    | N/A                                                                               |

### SlackProjectSyncViewSet

**File:** `plane/app/views/integration/slack.py`

| Method                 | URL Pattern                                                                              | Old Permission          | New Permission                                                        | Differences                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `create`               | `POST /workspaces/<slug>/projects/<pid>/workspace-integrations/<id>/project-slack-sync/` | `ProjectBasePermission` | `@can(IntegrationPermissions.CONNECT, resource_param="workspace_id")` | Parity: W-Admin (`integration:*`) + W-Member (`integration:connect`). W-Guest ❌. |
| `list`                 | `GET .../project-slack-sync/`                                                            | `ProjectBasePermission` | ⏸ URL commented out (Pattern H — not called by FE)                    | N/A                                                                               |
| `retrieve` / `destroy` | `GET/DELETE .../project-slack-sync/<pk>/`                                                | `ProjectBasePermission` | ⏸ URL commented out (Pattern H — not called by FE)                    | N/A                                                                               |

### IntegrationViewSet (Unused — Pattern H)

**File:** `plane/app/views/integration/base.py`

| Method                                                          | URL Pattern                             | Old Permission                    | New Permission                                     | Differences |
| --------------------------------------------------------------- | --------------------------------------- | --------------------------------- | -------------------------------------------------- | ----------- |
| All (`list`, `create`, `retrieve`, `partial_update`, `destroy`) | `/integrations/`, `/integrations/<pk>/` | `IsAuthenticated` (baseline only) | ⏸ URL commented out (Pattern H — not called by FE) | N/A         |

### GithubRepositoriesEndpoint (Unused — Pattern H)

**File:** `plane/app/views/integration/github.py`

| Method | URL Pattern                    | Old Permission          | New Permission                                     | Differences |
| ------ | ------------------------------ | ----------------------- | -------------------------------------------------- | ----------- |
| `get`  | `GET .../github-repositories/` | `ProjectBasePermission` | ⏸ URL commented out (Pattern H — not called by FE) | N/A         |

### GithubRepositorySyncViewSet (Unused — Pattern H)

**File:** `plane/app/views/integration/github.py`

| Method                                        | URL Pattern                                                       | Old Permission          | New Permission                                     | Differences |
| --------------------------------------------- | ----------------------------------------------------------------- | ----------------------- | -------------------------------------------------- | ----------- |
| All (`list`, `create`, `retrieve`, `destroy`) | `.../github-repository-sync/`, `.../github-repository-sync/<pk>/` | `ProjectBasePermission` | ⏸ URL commented out (Pattern H — not called by FE) | N/A         |

### GithubIssueSyncViewSet (Unused — Pattern H)

**File:** `plane/app/views/integration/github.py`

| Method                                        | URL Pattern                                             | Old Permission            | New Permission                                     | Differences |
| --------------------------------------------- | ------------------------------------------------------- | ------------------------- | -------------------------------------------------- | ----------- |
| All (`create`, `list`, `retrieve`, `destroy`) | `.../github-issue-sync/`, `.../github-issue-sync/<pk>/` | `ProjectEntityPermission` | ⏸ URL commented out (Pattern H — not called by FE) | N/A         |

### BulkCreateGithubIssueSyncEndpoint (Unused — Pattern H, SECURITY)

**File:** `plane/app/views/integration/github.py`

| Method | URL Pattern                               | Old Permission                                                   | New Permission                                 | Differences |
| ------ | ----------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- | ----------- |
| `post` | `POST .../bulk-create-github-issue-sync/` | `IsAuthenticated` (NO `permission_classes` — **security issue**) | ⏸ URL commented out (Pattern H — security fix) | N/A         |

### GithubCommentSyncViewSet (Unused — Pattern H)

**File:** `plane/app/views/integration/github.py`

| Method                                        | URL Pattern                                                 | Old Permission            | New Permission                                     | Differences |
| --------------------------------------------- | ----------------------------------------------------------- | ------------------------- | -------------------------------------------------- | ----------- |
| All (`create`, `list`, `retrieve`, `destroy`) | `.../github-comment-sync/`, `.../github-comment-sync/<pk>/` | `ProjectEntityPermission` | ⏸ URL commented out (Pattern H — not called by FE) | N/A         |

---

## P4 Importer Batch (2026-02-22)

> **Scope:** 7 importer views — 2 active EE endpoints migrated to `@can(IntegrationPermissions.MANAGE)`, 5 old endpoints disabled (Pattern H — URLs commented out).
>
> **Security improvement:** 4 of the 5 old endpoints (`ServiceIssueImportSummaryEndpoint`, `UpdateServiceImportStatusEndpoint`, `BulkImportIssuesEndpoint`, `BulkImportModulesEndpoint`) had **no `permission_classes`** (only `IsAuthenticated` inherited from `BaseAPIView`) — any authenticated user could call them. URLs now disabled.
>
> **Intentional tightening:** `ImportJobView` and `ImportReportView` moved from `ProjectBasePermission` (any project member) to `IntegrationPermissions.MANAGE` (W-Owner + W-Admin only). W-Member and W-Guest lose access — imports are privileged admin operations.

### ImportJobView

**File:** `plane/ee/views/app/job/base.py`

| Method   | URL Pattern                                               | Old Permission          | New Permission                                                       | Differences                                                            |
| -------- | --------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `get`    | `GET .../importers/jobs/`, `GET .../importers/jobs/<pk>/` | `ProjectBasePermission` | `@can(IntegrationPermissions.MANAGE, resource_param="workspace_id")` | Tightened: W-Member + W-Guest lose access. Now W-Owner + W-Admin only. |
| `post`   | `POST .../importers/jobs/<pk>/`                           | `ProjectBasePermission` | `@can(IntegrationPermissions.MANAGE, resource_param="workspace_id")` | Tightened: W-Member loses access. Now W-Owner + W-Admin only.          |
| `patch`  | `PATCH .../importers/jobs/<pk>/`                          | `ProjectBasePermission` | `@can(IntegrationPermissions.MANAGE, resource_param="workspace_id")` | Parity (admin-only operations).                                        |
| `delete` | `DELETE .../importers/jobs/<pk>/`                         | `ProjectBasePermission` | `@can(IntegrationPermissions.MANAGE, resource_param="workspace_id")` | Parity (admin-only operations).                                        |

### ImportReportView

**File:** `plane/ee/views/app/job/report.py`

| Method  | URL Pattern                                                     | Old Permission          | New Permission                                                       | Differences                                                            |
| ------- | --------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `get`   | `GET .../importers/reports/`, `GET .../importers/reports/<pk>/` | `ProjectBasePermission` | `@can(IntegrationPermissions.MANAGE, resource_param="workspace_id")` | Tightened: W-Member + W-Guest lose access. Now W-Owner + W-Admin only. |
| `patch` | `PATCH .../importers/reports/<pk>/`                             | `ProjectBasePermission` | `@can(IntegrationPermissions.MANAGE, resource_param="workspace_id")` | Parity (admin-only operations).                                        |

### ImportServiceEndpoint (Unused — Pattern H)

**File:** `plane/app/views/importer/base.py`

| Method                                 | URL Pattern                                                                            | Old Permission             | New Permission                                     | Differences |
| -------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------- | ----------- |
| All (`post`, `get`, `delete`, `patch`) | `.../projects/importers/<service>/`, `.../importers/`, `.../importers/<service>/<pk>/` | `WorkSpaceAdminPermission` | ⏸ URL commented out (Pattern H — not called by FE) | N/A         |

### ServiceIssueImportSummaryEndpoint (Unused — Pattern H, SECURITY)

**File:** `plane/app/views/importer/base.py`

| Method | URL Pattern                    | Old Permission                                                   | New Permission                                 | Differences |
| ------ | ------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------- | ----------- |
| `get`  | `GET .../importers/<service>/` | `IsAuthenticated` (NO `permission_classes` — **security issue**) | ⏸ URL commented out (Pattern H — security fix) | N/A         |

### UpdateServiceImportStatusEndpoint (Unused — Pattern H, SECURITY)

**File:** `plane/app/views/importer/base.py`

| Method | URL Pattern                                           | Old Permission                                                   | New Permission                                 | Differences |
| ------ | ----------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- | ----------- |
| `post` | `POST .../service/<service>/importers/<importer_id>/` | `IsAuthenticated` (NO `permission_classes` — **security issue**) | ⏸ URL commented out (Pattern H — security fix) | N/A         |

### BulkImportIssuesEndpoint (Unused — Pattern H, SECURITY)

**File:** `plane/app/views/importer/base.py`

| Method | URL Pattern                              | Old Permission                                                   | New Permission                                 | Differences |
| ------ | ---------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- | ----------- |
| `post` | `POST .../bulk-import-issues/<service>/` | `IsAuthenticated` (NO `permission_classes` — **security issue**) | ⏸ URL commented out (Pattern H — security fix) | N/A         |

### BulkImportModulesEndpoint (Dead Code — Not Routed)

**File:** `plane/app/views/importer/base.py`

Not routed in any URL config. No `permission_classes`. TODO comment added to class.

---

## Baseline-Only Views Batch Migration (2026-02-22)

> **Batch migration:** 15 baseline-only views (no explicit permissions beyond `IsAuthenticated`) migrated to `@can`. Additionally, audit script fixed to detect `@can` on custom action methods — resolving 5 false positives (`IssueSubscriberViewSet`, `EpicSubscriberViewSet`, `ProjectInTakePublishViewSet`, `IssueViewEEViewSet`, `WorkspaceViewEEViewSet`).

### Group A: Read-Only Workspace Endpoints (10 views)

All GET-only, all use `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`.
All workspace roles (Owner, Admin, Member, Guest) have `workspace:view`.

### ResourcePermissionEndpoint

**File:** `plane/app/views/permission/base.py`

| Method | URL Pattern                                        | Old Permission               | New Permission                                                   | Differences                       |
| ------ | -------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| `get`  | `GET .../workspaces/<slug>/permissions/resources/` | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now requires workspace membership |

### UserPermissionEndpoint

**File:** `plane/app/views/permission/user.py`

| Method | URL Pattern                                 | Old Permission               | New Permission                                                   | Differences                       |
| ------ | ------------------------------------------- | ---------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| `get`  | `GET .../workspaces/<slug>/permissions/me/` | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now requires workspace membership |

### GlobalSearchEndpoint

**File:** `plane/app/views/search/base.py`

| Method | URL Pattern                         | Old Permission               | New Permission                                                   | Differences                       |
| ------ | ----------------------------------- | ---------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| `get`  | `GET .../workspaces/<slug>/search/` | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now requires workspace membership |

### SearchEndpoint

**File:** `plane/app/views/search/base.py`

| Method | URL Pattern                           | Old Permission               | New Permission                                                   | Differences                       |
| ------ | ------------------------------------- | ---------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| `get`  | `GET .../workspaces/<slug>/searches/` | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now requires workspace membership |

### UserWorkspaceDashboardEndpoint

**File:** `plane/app/views/workspace/base.py`

| Method | URL Pattern                            | Old Permission               | New Permission                                                   | Differences                       |
| ------ | -------------------------------------- | ---------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| `get`  | `GET .../workspaces/<slug>/dashboard/` | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now requires workspace membership |

### UserActivityGraphEndpoint

**File:** `plane/app/views/workspace/user.py`

| Method | URL Pattern                                      | Old Permission               | New Permission                                                   | Differences                       |
| ------ | ------------------------------------------------ | ---------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| `get`  | `GET .../workspaces/<slug>/user-activity-graph/` | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now requires workspace membership |

### UserIssueCompletedGraphEndpoint

**File:** `plane/app/views/workspace/user.py`

| Method | URL Pattern                                        | Old Permission               | New Permission                                                   | Differences                       |
| ------ | -------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| `get`  | `GET .../workspaces/<slug>/user-completed-issues/` | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now requires workspace membership |

### WorkspaceUserProfileEndpoint

**File:** `plane/app/views/workspace/user.py`

| Method | URL Pattern                                       | Old Permission               | New Permission                                                   | Differences                                                                                                                                              |
| ------ | ------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET .../workspaces/<slug>/user-stats/<user_id>/` | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now requires workspace membership. **Data-level filter:** inline `role >= 15` check gates project data visibility (only Admin/Member see project stats). |

### WorkspaceUserProfileStatsEndpoint

**File:** `plane/app/views/workspace/user.py`

| Method | URL Pattern                                               | Old Permission               | New Permission                                                   | Differences                                                                                                                                   |
| ------ | --------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET .../workspaces/<slug>/user-profile-stats/<user_id>/` | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now requires workspace membership. **Data-level filter:** inline `.accessible_to()` filter limits issue visibility per user's project access. |

### EnhancedGlobalSearchEndpoint

**File:** `plane/ee/views/app/search/base.py`

| Method | URL Pattern                                  | Old Permission                                                        | New Permission                                                                                            | Differences                                                                                                                                                |
| ------ | -------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET .../workspaces/<slug>/enhanced-search/` | `IsAuthenticated` (baseline) + `@check_feature_flag(ADVANCED_SEARCH)` | `@check_feature_flag(ADVANCED_SEARCH)` + `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Now requires workspace membership. Feature flag preserved. **Data-level filter:** OpenSearch queries include inline user_id filters for per-entity access. |

### Group B: Role Management Endpoint

### RoleEndpoint

**File:** `plane/app/views/permission/role.py`

| Method   | URL Pattern                                | Old Permission               | New Permission                                                     | Differences                                                       |
| -------- | ------------------------------------------ | ---------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `get`    | `GET .../workspaces/<slug>/roles/`         | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`   | Now requires workspace membership                                 |
| `post`   | `POST .../workspaces/<slug>/roles/`        | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.MANAGE, resource_param="workspace_id")` | Tightened: now Owner + Admin only (have `workspace:manage` grant) |
| `patch`  | `PATCH .../workspaces/<slug>/roles/<pk>/`  | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.MANAGE, resource_param="workspace_id")` | Tightened: now Owner + Admin only                                 |
| `delete` | `DELETE .../workspaces/<slug>/roles/<pk>/` | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.MANAGE, resource_param="workspace_id")` | Tightened: now Owner + Admin only                                 |

### Group C: Workspace Asset Endpoints

### WorkspaceFileAssetEndpoint

**File:** `plane/app/views/asset/v2.py`

| Method   | URL Pattern                                               | Old Permission               | New Permission                                                          | Differences                                                                                                                                          |
| -------- | --------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post`   | `POST .../workspaces/<slug>/file-assets/v2/`              | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`        | Any workspace member (incl. Guest, custom PS without `workspace_asset:create`). See note below — fixes project cover upload during project creation. |
| `get`    | `GET .../workspaces/<slug>/file-assets/v2/<asset_id>/`    | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")`        | Any workspace member. Download is read-only; no workspace/project state mutation.                                                                    |
| `patch`  | `PATCH .../workspaces/<slug>/file-assets/v2/<asset_id>/`  | `IsAuthenticated` (baseline) | `@can(WorkspaceAssetPermissions.EDIT, resource_param="workspace_id")`   | Kept on `workspace_asset:edit` — PATCH triggers `entity_asset_save`, which flips `workspace.logo_asset_id` / `project.cover_image_asset_id`.         |
| `delete` | `DELETE .../workspaces/<slug>/file-assets/v2/<asset_id>/` | `IsAuthenticated` (baseline) | `@can(WorkspaceAssetPermissions.DELETE, resource_param="workspace_id")` | Kept on `workspace_asset:delete` — DELETE triggers `entity_asset_delete`, which clears `workspace.logo_asset_id` / `project.cover_image_asset_id`.   |

> **Why POST uses `workspace:view`, not `workspace_asset:create`:** The project creation flow uploads the cover image _before_ the Project row exists, so `project_asset:create` isn't available; `workspace_asset:create` was gating this, but custom permission schemes can omit it, and workspace Guest doesn't hold it — either path produces a 403. The upload endpoint only writes a `FileAsset` row and returns a presigned URL; it does not mutate any workspace/project state. Attachment mutations (PATCH/DELETE) remain on the stricter `workspace_asset:*` gates to prevent a workspace Guest from overwriting or clearing `workspace.logo_asset_id` / `project.cover_image_asset_id` by submitting a crafted request with `entity_type=WORKSPACE_LOGO` or `PROJECT_COVER`.

### FileAssetEndpoint (Legacy v1)

**File:** `plane/app/views/asset/base.py`

| Method   | URL Pattern                                                     | Old Permission               | New Permission                                                          | Differences                                                                                          |
| -------- | --------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `post`   | `POST .../workspaces/<slug>/file-assets/`                       | `IsAuthenticated` (baseline) | `@can(WorkspaceAssetPermissions.CREATE, resource_param="workspace_id")` | Now requires workspace membership                                                                    |
| `get`    | `GET .../workspaces/file-assets/<workspace_id>/<asset_key>/`    | `IsAuthenticated` (baseline) | Inline `permission_engine.check(WorkspaceAssetPermissions.VIEW)`        | No slug in URL — `@can` can't resolve workspace_id; uses inline check with workspace_id from kwargs. |
| `delete` | `DELETE .../workspaces/file-assets/<workspace_id>/<asset_key>/` | `IsAuthenticated` (baseline) | Inline `permission_engine.check(WorkspaceAssetPermissions.DELETE)`      | No slug in URL — uses inline check with workspace_id from kwargs.                                    |

### Group D: Project-Scoped Endpoints

### ProjectMemberUserEndpoint

**File:** `plane/app/views/project/member.py`

| Method | URL Pattern                                                           | Old Permission               | New Permission                                               | Differences                                                             |
| ------ | --------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `get`  | `GET .../workspaces/<slug>/projects/<project_id>/project-members/me/` | `IsAuthenticated` (baseline) | `@can(ProjectPermissions.VIEW, resource_param="project_id")` | Now requires project membership. All project roles have `project:view`. |

### EpicDetailIdentifierEndpoint

**File:** `plane/ee/views/app/epic/base.py`

| Method | URL Pattern                                                               | Old Permission               | New Permission                                                   | Differences                                                                                                                                   |
| ------ | ------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET .../workspaces/<slug>/epics/<project_identifier>-<epic_identifier>/` | `IsAuthenticated` (baseline) | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` | Workspace-level gate (no `project_id` UUID in URL). Inline `ProjectMember.objects.filter()` check preserved for project-level access control. |

### PageViewSet (CE Base)

**File:** `apps/api/plane/app/views/page/base.py`

| Method           | URL Pattern                                                                   | Old Permission                      | New Permission                                              | Differences                                                                     |
| ---------------- | ----------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `list`           | `GET .../workspaces/<slug>/projects/<project_id>/pages/`                      | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.VIEW, resource_param="project_id")`   | Removed dead `guest_view_all_features` block — role split handles guest scoping |
| `create`         | `POST .../workspaces/<slug>/projects/<project_id>/pages/`                     | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.CREATE, resource_param="project_id")` | Now checks `page:create` permission from role                                   |
| `retrieve`       | `GET .../workspaces/<slug>/projects/<project_id>/pages/<page_id>/`            | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.VIEW, resource_param="project_id")`   | Removed dead `guest_view_all_features` block                                    |
| `partial_update` | `PATCH .../workspaces/<slug>/projects/<project_id>/pages/<page_id>/`          | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.EDIT, resource_param="project_id")`   | Inline owner-only access change check preserved                                 |
| `destroy`        | `DELETE .../workspaces/<slug>/projects/<project_id>/pages/<page_id>/`         | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.DELETE, resource_param="project_id")` | Inline owner/admin-only delete check preserved                                  |
| `archive`        | `POST .../workspaces/<slug>/projects/<project_id>/pages/<page_id>/archive/`   | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.EDIT, resource_param="project_id")`   | Inline owner/admin-only archive check preserved                                 |
| `unarchive`      | `DELETE .../workspaces/<slug>/projects/<project_id>/pages/<page_id>/archive/` | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.EDIT, resource_param="project_id")`   | Inline owner/admin-only unarchive check preserved                               |
| `lock`           | `POST .../workspaces/<slug>/projects/<project_id>/pages/<page_id>/lock/`      | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.EDIT, resource_param="project_id")`   | Now checks `page:edit` permission from role                                     |
| `unlock`         | `DELETE .../workspaces/<slug>/projects/<project_id>/pages/<page_id>/lock/`    | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.EDIT, resource_param="project_id")`   | Now checks `page:edit` permission from role                                     |
| `access`         | `POST .../workspaces/<slug>/projects/<project_id>/pages/<page_id>/access/`    | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.EDIT, resource_param="project_id")`   | Inline owner-only check preserved                                               |
| `summary`        | `GET .../workspaces/<slug>/projects/<project_id>/pages-summary/`              | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.VIEW, resource_param="project_id")`   | Removed dead `guest_view_all_features` block — role split handles guest scoping |

**Post-migration cleanup (`guest_view_all_features`):**

- **`list`**: Removed dead `guest_view_all_features` queryset filter. Guest access now handled by role split (Commenter vs Guest in new system).
- **`retrieve`**: Removed dead `guest_view_all_features` block and unused `Project` import. Role split handles guest scoping.
- **`summary`**: Removed dead `guest_view_all_features` block. Removed unused `ROLE` import.

### PagesDescriptionViewSet (CE Base)

**File:** `apps/api/plane/app/views/page/base.py`

| Method           | URL Pattern                                                                      | Old Permission                      | New Permission                                            | Differences                                 |
| ---------------- | -------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| `retrieve`       | `GET .../workspaces/<slug>/projects/<project_id>/pages/<page_id>/description/`   | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.VIEW, resource_param="project_id")` | Now checks `page:view` permission from role |
| `partial_update` | `PATCH .../workspaces/<slug>/projects/<project_id>/pages/<page_id>/description/` | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.EDIT, resource_param="project_id")` | Inline lock/archive checks preserved        |

### PageDuplicateEndpoint (CE Base)

**File:** `apps/api/plane/app/views/page/base.py`

| Method | URL Pattern                                                                   | Old Permission                      | New Permission                                              | Differences                                   |
| ------ | ----------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| `post` | `POST .../workspaces/<slug>/projects/<project_id>/pages/<page_id>/duplicate/` | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.CREATE, resource_param="project_id")` | Inline private page ownership check preserved |

### PageVersionEndpoint (CE Base)

**File:** `apps/api/plane/app/views/page/version.py`

| Method | URL Pattern                                                                      | Old Permission                      | New Permission                                            | Differences                                 |
| ------ | -------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| `get`  | `GET .../workspaces/<slug>/projects/<project_id>/pages/<page_id>/versions/`      | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.VIEW, resource_param="project_id")` | Now checks `page:view` permission from role |
| `get`  | `GET .../workspaces/<slug>/projects/<project_id>/pages/<page_id>/versions/<pk>/` | `ProjectPagePermission` (DRF class) | `@can(PagePermissions.VIEW, resource_param="project_id")` | Same endpoint, single version retrieval     |

### PageEmbedEndpoint

**File:** `apps/api/plane/ee/views/app/page/entities.py`

| Method | URL Pattern                                         | Old Permission                                                                                                | New Permission                                                                                                                                  | Differences                                                                                              |
| ------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `get`  | `GET .../workspaces/<slug>/pages/<page_id>/embeds/` | Dynamic `get_permissions()` → `ProjectPagePermission` / `TeamspacePagePermission` / `WorkspacePagePermission` | Inline `permission_engine.check()` with `PagePermissions.VIEW` / `TeamspacePagePermissions.VIEW` / `WikiPermissions.VIEW` based on query params | Replaces DRF permission routing with explicit engine checks; uses `request.workspace_id` from middleware |

### PageMentionEndpoint

**File:** `apps/api/plane/ee/views/app/page/entities.py`

| Method | URL Pattern                                           | Old Permission                                                                                                | New Permission                                                                                                                                  | Differences                       |
| ------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `get`  | `GET .../workspaces/<slug>/pages/<page_id>/mentions/` | Dynamic `get_permissions()` → `ProjectPagePermission` / `TeamspacePagePermission` / `WorkspacePagePermission` | Inline `permission_engine.check()` with `PagePermissions.VIEW` / `TeamspacePagePermissions.VIEW` / `WikiPermissions.VIEW` based on query params | Same pattern as PageEmbedEndpoint |

### PageFetchMetadataEndpoint

**File:** `apps/api/plane/ee/views/app/page/entities.py`

| Method | URL Pattern                                                 | Old Permission                                                                                                | New Permission                                                                                                                                  | Differences                                                             |
| ------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `get`  | `GET .../workspaces/<slug>/pages/<page_id>/fetch-metadata/` | Dynamic `get_permissions()` → `ProjectPagePermission` / `TeamspacePagePermission` / `WorkspacePagePermission` | Inline `permission_engine.check()` with `PagePermissions.VIEW` / `TeamspacePagePermissions.VIEW` / `WikiPermissions.VIEW` based on query params | Same pattern as PageEmbedEndpoint; called by live server for PDF export |

### MovePageEndpoint

**File:** `apps/api/plane/ee/views/app/page/move.py`

| Method | URL Pattern                                        | Old Permission                                                      | New Permission                                                                | Differences                                                                                                                                                                                                             |
| ------ | -------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post` | `POST .../workspaces/<slug>/pages/<page_id>/move/` | `WorkspacePagePermission` (DRF class) — W-Admin + W-Member for POST | `@can(WikiPermissions.EDIT)` — W-Admin via `wiki:*`, W-Member via `wiki:edit` | Exact parity: W-Admin and W-Member can move. W-Guest has no wiki grants. Inline `_check_move_permission()` preserved for source/target validation. `ROLE.ADMIN.value`/`ROLE.MEMBER.value` replaced with `role__gte=15`. |

### InternalWebhookEndpoint

**File:** `apps/api/plane/ee/views/app/webhook/base.py`

| Method   | URL Pattern                                            | Old Permission                         | New Permission                                                   | Differences                                                                                                                                  |
| -------- | ------------------------------------------------------ | -------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `post`   | `POST .../workspaces/<slug>/internal-webhooks/`        | `WorkSpaceAdminPermission` (DRF class) | `@can(WebhookPermissions.CREATE, resource_param="workspace_id")` | **Access tightened:** W-Member loses access. Old `WorkSpaceAdminPermission` allowed Admin+Member; new grants are admin-only via `webhook:*`. |
| `delete` | `DELETE .../workspaces/<slug>/internal-webhooks/<pk>/` | `WorkSpaceAdminPermission` (DRF class) | `@can(WebhookPermissions.DELETE, resource_param="workspace_id")` | Same tightening as `post`.                                                                                                                   |

### ServiceApiTokenEndpoint

**File:** `apps/api/plane/app/views/api/service.py`

| Method | URL Pattern                                      | Old Permission                          | New Permission                                                    | Differences                                                                                         |
| ------ | ------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `post` | `POST .../workspaces/<slug>/api-tokens/service/` | `WorkspaceEntityPermission` (DRF class) | `@can(ApiTokenPermissions.CREATE, resource_param="workspace_id")` | W-Admin via `api_token:*`, W-Member via `api_token:create`. W-Guest denied (was denied before too). |

### WorkspaceAPITokenEndpoint

**File:** `apps/api/plane/app/views/api/workspace.py`

| Method   | URL Pattern                                     | Old Permission                         | New Permission                                                    | Differences                                                                                                                 |
| -------- | ----------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `post`   | `POST .../workspaces/<slug>/api-tokens/`        | `WorkSpaceAdminPermission` (DRF class) | `@can(ApiTokenPermissions.CREATE, resource_param="workspace_id")` | **Access expanded:** W-Member gains `api_token:create`. Tokens are user-scoped (safe for members).                          |
| `get`    | `GET .../workspaces/<slug>/api-tokens/`         | `WorkSpaceAdminPermission` (DRF class) | `@can(ApiTokenPermissions.VIEW, resource_param="workspace_id")`   | **Access expanded:** W-Member gains `api_token:view`. Data-level filter preserved: queryset filters by `user=request.user`. |
| `get`    | `GET .../workspaces/<slug>/api-tokens/<pk>/`    | `WorkSpaceAdminPermission` (DRF class) | `@can(ApiTokenPermissions.VIEW, resource_param="workspace_id")`   | Same as list. Single token also filters by `user=request.user`.                                                             |
| `delete` | `DELETE .../workspaces/<slug>/api-tokens/<pk>/` | `WorkSpaceAdminPermission` (DRF class) | `@can(ApiTokenPermissions.DELETE, resource_param="workspace_id")` | **Access expanded:** W-Member gains `api_token:delete`. Delete also filters by `user=request.user`.                         |

### ProjectInvitationsViewset (Pattern H — Unused)

**File:** `apps/api/plane/app/views/project/invite.py`

| Method     | URL Pattern                                                            | Old Permission                    | New Permission     | Differences                                       |
| ---------- | ---------------------------------------------------------------------- | --------------------------------- | ------------------ | ------------------------------------------------- |
| `create`   | `POST .../workspaces/<slug>/projects/<project_id>/invitations/`        | `@allow_permission([ROLE.ADMIN])` | N/A — URL disabled | URLs commented out (Pattern H). Not called by FE. |
| `list`     | `GET .../workspaces/<slug>/projects/<project_id>/invitations/`         | None (no decorator on method)     | N/A — URL disabled | Same.                                             |
| `retrieve` | `GET .../workspaces/<slug>/projects/<project_id>/invitations/<pk>/`    | None (no decorator on method)     | N/A — URL disabled | Same.                                             |
| `destroy`  | `DELETE .../workspaces/<slug>/projects/<project_id>/invitations/<pk>/` | None (no decorator on method)     | N/A — URL disabled | Same.                                             |

### UserProjectInvitationsViewset (Pattern H — Unused)

**File:** `apps/api/plane/app/views/project/invite.py`

| Method   | URL Pattern | Old Permission                                                    | New Permission      | Differences                                  |
| -------- | ----------- | ----------------------------------------------------------------- | ------------------- | -------------------------------------------- |
| `create` | (no URL)    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` | N/A — no URL exists | No URL registration found. Not called by FE. |

### AnalyticViewViewset (Pattern H — Unused)

**File:** `apps/api/plane/app/views/analytic/base.py`

| Method           | URL Pattern                                        | Old Permission                         | New Permission     | Differences                                       |
| ---------------- | -------------------------------------------------- | -------------------------------------- | ------------------ | ------------------------------------------------- |
| `list`           | `GET .../workspaces/<slug>/analytic-view/`         | `WorkSpaceAdminPermission` (DRF class) | N/A — URL disabled | URLs commented out (Pattern H). Not called by FE. |
| `create`         | `POST .../workspaces/<slug>/analytic-view/`        | `WorkSpaceAdminPermission` (DRF class) | N/A — URL disabled | Same.                                             |
| `retrieve`       | `GET .../workspaces/<slug>/analytic-view/<pk>/`    | `WorkSpaceAdminPermission` (DRF class) | N/A — URL disabled | Same.                                             |
| `partial_update` | `PATCH .../workspaces/<slug>/analytic-view/<pk>/`  | `WorkSpaceAdminPermission` (DRF class) | N/A — URL disabled | Same.                                             |
| `destroy`        | `DELETE .../workspaces/<slug>/analytic-view/<pk>/` | `WorkSpaceAdminPermission` (DRF class) | N/A — URL disabled | Same.                                             |

### WorkspaceThemeViewSet (Pattern H — Unused)

**File:** `apps/api/plane/app/views/workspace/base.py`

| Method           | URL Pattern                                           | Old Permission                         | New Permission     | Differences                                       |
| ---------------- | ----------------------------------------------------- | -------------------------------------- | ------------------ | ------------------------------------------------- |
| `list`           | `GET .../workspaces/<slug>/workspace-themes/`         | `WorkSpaceAdminPermission` (DRF class) | N/A — URL disabled | URLs commented out (Pattern H). Not called by FE. |
| `create`         | `POST .../workspaces/<slug>/workspace-themes/`        | `WorkSpaceAdminPermission` (DRF class) | N/A — URL disabled | Same.                                             |
| `retrieve`       | `GET .../workspaces/<slug>/workspace-themes/<pk>/`    | `WorkSpaceAdminPermission` (DRF class) | N/A — URL disabled | Same.                                             |
| `partial_update` | `PATCH .../workspaces/<slug>/workspace-themes/<pk>/`  | `WorkSpaceAdminPermission` (DRF class) | N/A — URL disabled | Same.                                             |
| `destroy`        | `DELETE .../workspaces/<slug>/workspace-themes/<pk>/` | `WorkSpaceAdminPermission` (DRF class) | N/A — URL disabled | Same.                                             |

### ExportWorkspaceUserActivityEndpoint

**File:** `apps/api/plane/app/views/workspace/base.py`

| Method | URL Pattern                                                  | Old Permission                          | New Permission                                                             | Differences                                                                                              |
| ------ | ------------------------------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `post` | `POST .../workspaces/<slug>/user-activity/<user_id>/export/` | `WorkspaceEntityPermission` (DRF class) | `@can(WorkspaceActivityPermissions.EXPORT, resource_param="workspace_id")` | Direct mapping. W-Owner ✅ (`*`), W-Admin ✅ (explicit grant), W-Member ✅ (explicit grant), W-Guest ❌. |

> New `workspace_activity:export` action added to `definitions.py` and granted to W-Admin and W-Member in `system_roles.py`.

### ModuleLinkViewSet

**File:** `apps/api/plane/app/views/module/base.py`

| Method           | URL Pattern                                                                                 | Old Permission                        | New Permission                                             | Differences                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `list`           | `GET .../workspaces/<slug>/projects/<project_id>/modules/<module_id>/module-links/`         | `ProjectEntityPermission` (DRF class) | `@can(ModulePermissions.VIEW, resource_param="module_id")` | P-Guest loses access (by design — no module access for Guest role). All other roles maintain parity. |
| `retrieve`       | `GET .../workspaces/<slug>/projects/<project_id>/modules/<module_id>/module-links/<pk>/`    | `ProjectEntityPermission` (DRF class) | `@can(ModulePermissions.VIEW, resource_param="module_id")` | Same as list.                                                                                        |
| `create`         | `POST .../workspaces/<slug>/projects/<project_id>/modules/<module_id>/module-links/`        | `ProjectEntityPermission` (DRF class) | `@can(ModulePermissions.EDIT, resource_param="module_id")` | P-Commenter and P-Guest lose write access. Matches module permission model.                          |
| `update`         | `PUT .../workspaces/<slug>/projects/<project_id>/modules/<module_id>/module-links/<pk>/`    | `ProjectEntityPermission` (DRF class) | `@can(ModulePermissions.EDIT, resource_param="module_id")` | Same as create.                                                                                      |
| `partial_update` | `PATCH .../workspaces/<slug>/projects/<project_id>/modules/<module_id>/module-links/<pk>/`  | `ProjectEntityPermission` (DRF class) | `@can(ModulePermissions.EDIT, resource_param="module_id")` | Same as create.                                                                                      |
| `destroy`        | `DELETE .../workspaces/<slug>/projects/<project_id>/modules/<module_id>/module-links/<pk>/` | `ProjectEntityPermission` (DRF class) | `@can(ModulePermissions.EDIT, resource_param="module_id")` | Same as create.                                                                                      |

> P-Guest losing module link GET access is by design — `system_roles.py:776` explicitly states `# Modules - no access` for P-Guest. The old Guest role was split: Commenter (10) inherits module view access, Guest (5) does not.

### BulkArchiveIssuesEndpoint (EE)

**File:** `apps/api/plane/ee/views/app/issue/bulk_operations.py`

| Method | URL Pattern                                                             | Old Permission                        | New Permission                                                | Differences                                                                                               |
| ------ | ----------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `post` | `POST .../workspaces/<slug>/projects/<project_id>/bulk-archive-issues/` | `ProjectEntityPermission` (DRF class) | `@can(IssuePermissions.ARCHIVE, resource_param="project_id")` | Direct mapping. P-Admin ✅ (`workitem:*`), P-Contributor ✅ (explicit grant), P-Commenter ❌, P-Guest ❌. |

> Exact match of the CE version at `app/views/issue/archive.py:326`. Feature-flag decorator (`@check_feature_flag`) preserved above `@can`.

---

### WORKITEM_RELATION Resource Repurposed

> **Breaking change:** `WORKITEM_RELATION` was repurposed from project-scoped (child of `WORKITEM`) to workspace-scoped (child of `WORKSPACE`). It now represents **custom relation definitions** (the `WorkItemRelationDefinition` model), not issue-to-issue relations (`IssueRelation`). EDIT action added to `WorkitemRelationPermissions`. Issue-to-issue relation endpoints (`WorkItemRelationDependencyViewSet`, `WorkItemRelationRelationViewSet`) now use `WorkitemPermissions` (VIEW/EDIT) instead.
>
> **Role grant changes:**
>
> - **Workspace roles:** Admin keeps `WildcardGrant(WORKITEM_RELATION)`. Member gains VIEW, CREATE, EDIT, DELETE for `workitem_relation`. Guest gains VIEW for `workitem_relation`.
> - **Project roles:** Admin loses `WildcardGrant(WORKITEM_RELATION)`. Contributor loses VIEW, CREATE, DELETE for `workitem_relation`. Commenter loses VIEW for `workitem_relation`.

### WorkItemRelationDefinitionViewSet

**File:** `apps/api/plane/app/views/issue/relation_definition.py`

| Method           | URL Pattern                                                      | Old Permission                                                                | New Permission                                                            | Differences                                                                                                     |
| ---------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/work-item-relation-definitions/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkitemRelationPermissions.VIEW, resource_param="workspace_id")`   | Now checks `workitem_relation:view` at workspace scope. All workspace roles with VIEW grant can access.         |
| `retrieve`       | `GET /workspaces/<slug>/work-item-relation-definitions/<pk>/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkitemRelationPermissions.VIEW, resource_param="workspace_id")`   | Same as list.                                                                                                   |
| `create`         | `POST /workspaces/<slug>/work-item-relation-definitions/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`             | `@can(WorkitemRelationPermissions.CREATE, resource_param="workspace_id")` | W-Admin/W-Member: unconditional. W-Guest: no access.                                                            |
| `partial_update` | `PATCH /workspaces/<slug>/work-item-relation-definitions/<pk>/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`             | `@can(WorkitemRelationPermissions.EDIT, resource_param="workspace_id")`   | W-Admin/W-Member: unconditional. W-Guest: no access. Uses new EDIT action added to WorkitemRelationPermissions. |
| `destroy`        | `DELETE /workspaces/<slug>/work-item-relation-definitions/<pk>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`             | `@can(WorkitemRelationPermissions.DELETE, resource_param="workspace_id")` | W-Admin/W-Member: unconditional. W-Guest: no access.                                                            |

> **Workspace-scoped resource:** `WORKITEM_RELATION` is now a child of `WORKSPACE` in the resource hierarchy. `resource_param="workspace_id"` — the engine checks workspace-level role grants for `workitem_relation:*` permissions.
>
> **Model mapping:** `WorkItemRelationDefinition` (not `IssueRelation`). These endpoints manage custom relation type definitions at the workspace level.
>
> **EDIT action added:** `WorkitemRelationPermissions` now includes EDIT (previously only VIEW, CREATE, DELETE). Used by `partial_update` for editing relation definitions.

### WorkItemRelationDependencyViewSet

**File:** `apps/api/plane/app/views/issue/relation.py`

| Method            | URL Pattern                                                                                             | Old Permission                                                                                                | New Permission                                                                                          | Differences                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `list`            | `GET /workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/relation-dependencies/`         | `@can(WorkitemRelationPermissions.VIEW, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)`   | `@can(WorkitemPermissions.VIEW, resource_param="work_item_id", scope_param_type=ResourceType.WORKITEM)` | Changed from `workitem_relation:view` to `workitem:view`. Uses `WorkitemPermissions` instead of `WorkitemRelationPermissions`. |
| `create_relation` | `POST /workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/relation-dependencies/`        | `@can(WorkitemRelationPermissions.CREATE, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | `@can(WorkitemPermissions.EDIT, resource_param="work_item_id", scope_param_type=ResourceType.WORKITEM)` | Changed from `workitem_relation:create` to `workitem:edit`. Creating a dependency is editing the work item.                    |
| `remove_relation` | `DELETE /workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/relation-dependencies/<pk>/` | `@can(WorkitemRelationPermissions.DELETE, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | `@can(WorkitemPermissions.EDIT, resource_param="work_item_id", scope_param_type=ResourceType.WORKITEM)` | Changed from `workitem_relation:delete` to `workitem:edit`. Removing a dependency is editing the work item.                    |

> **Permission model change:** Issue-to-issue dependency relations are no longer gated by `WorkitemRelationPermissions`. They use `WorkitemPermissions` because adding/removing a dependency is conceptually editing the work item itself. The `resource_param` changed from `"issue_id"` to `"work_item_id"` to match the new URL pattern.

### WorkItemRelationRelationViewSet

**File:** `apps/api/plane/app/views/issue/relation.py`

| Method            | URL Pattern                                                                                 | Old Permission                                                     | New Permission                                                                                          | Differences                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `list`            | `GET /workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/relations/`         | `ProjectEntityPermission` (DRF class — any project member for GET) | `@can(WorkitemPermissions.VIEW, resource_param="work_item_id", scope_param_type=ResourceType.WORKITEM)` | Now checks `workitem:view` with parent workitem lookup. All project roles with `workitem:view` can access. |
| `create_relation` | `POST /workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/relations/`        | `ProjectEntityPermission` (DRF class — ADMIN+MEMBER for POST)      | `@can(WorkitemPermissions.EDIT, resource_param="work_item_id", scope_param_type=ResourceType.WORKITEM)` | Now checks `workitem:edit`. Admin/Contributor: unconditional. Commenter/Guest: no access.                  |
| `remove_relation` | `DELETE /workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/relations/<pk>/` | `ProjectEntityPermission` (DRF class — ADMIN+MEMBER for POST)      | `@can(WorkitemPermissions.EDIT, resource_param="work_item_id", scope_param_type=ResourceType.WORKITEM)` | Now checks `workitem:edit`. Admin/Contributor: unconditional. Commenter/Guest: no access.                  |

> **Fresh migration:** This view was previously using `ProjectEntityPermission` (DRF class-level permission). Now uses per-method `@can` decorators with `WorkitemPermissions`. Creating/removing a relation is treated as editing the work item.

### WorkflowEndpoint.post and DefaultWorkflowEndpoint.post

**File:** `apps/api/plane/ee/views/app/workflow/base.py`

| Method | URL Pattern                                                                 | Old Permission                                     | New Permission                                                  | Differences                                                                  |
| ------ | --------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/workflows/`                  | `@allow_permission([ROLE.ADMIN], level="PROJECT")` | `@can(WorkflowPermissions.CREATE, resource_param="project_id")` | Parity: P-Admin only (W-Admin/W-Owner via wildcard). Uses new CREATE action. |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/workflows/default-workflow/` | `@allow_permission([ROLE.ADMIN], level="PROJECT")` | `@can(WorkflowPermissions.CREATE, resource_param="project_id")` | Parity: P-Admin only (W-Admin/W-Owner via wildcard). Uses new CREATE action. |

> **CREATE action added:** `WorkflowPermissions` now includes CREATE (previously only VIEW, EDIT, DELETE). Used for creating workflows and default workflows. P-Admin via `workflow:*`, W-Admin/W-Owner via workspace-level `workflow:*` wildcard.

### WorkflowStatesEndpoint

**File:** `apps/api/plane/ee/views/app/workflow/states.py`

| Method   | URL Pattern                                                                                  | Old Permission                                                  | New Permission                                                | Differences                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/workflows/<workflow_id>/states/`              | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")` | `@can(WorkflowPermissions.EDIT, resource_param="project_id")` | **Tighter:** was ADMIN+MEMBER, now P-Admin only via `workflow:edit`. Adding states to a workflow is a project admin action. |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/workflows/<workflow_id>/states/<state_id>/`  | `@allow_permission([ROLE.ADMIN], level="PROJECT")`              | `@can(WorkflowPermissions.EDIT, resource_param="project_id")` | Parity: P-Admin only (W-Admin/W-Owner via wildcard).                                                                        |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/workflows/<workflow_id>/states/<state_id>/` | `@allow_permission([ROLE.ADMIN], level="PROJECT")`              | `@can(WorkflowPermissions.EDIT, resource_param="project_id")` | Parity: P-Admin only (W-Admin/W-Owner via wildcard).                                                                        |

> **Access change on `post` (add states):** Old system allowed ADMIN + MEMBER (Contributor). New system checks `workflow:edit`, which is only granted to P-Admin (`workflow:*`). Intentionally tighter — adding states to a workflow is a project settings operation.

### WorkflowStateTransitionsEndpoint

**File:** `apps/api/plane/ee/views/app/workflow/states.py`

| Method   | URL Pattern                                                                                                  | Old Permission                                     | New Permission                                                | Differences                                          |
| -------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/workflows/<workflow_id>/state-transitions/`                   | `@allow_permission([ROLE.ADMIN], level="PROJECT")` | `@can(WorkflowPermissions.EDIT, resource_param="project_id")` | Parity: P-Admin only (W-Admin/W-Owner via wildcard). |
| `patch`  | `PATCH /workspaces/<slug>/projects/<project_id>/workflows/<workflow_id>/state-transitions/<transition_id>/`  | `@allow_permission([ROLE.ADMIN], level="PROJECT")` | `@can(WorkflowPermissions.EDIT, resource_param="project_id")` | Parity: P-Admin only (W-Admin/W-Owner via wildcard). |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/workflows/<workflow_id>/state-transitions/<transition_id>/` | `@allow_permission([ROLE.ADMIN], level="PROJECT")` | `@can(WorkflowPermissions.EDIT, resource_param="project_id")` | Parity: P-Admin only (W-Admin/W-Owner via wildcard). |

> All state transition CRUD operations require `workflow:edit` — P-Admin only. W-Admin/W-Owner have access via workspace-level `workflow:*` wildcard.

---

### RELEASE Resource Type (New — Workspace-Scoped)

> **New resource type:** `RELEASE` is a workspace-scoped resource with actions VIEW, CREATE, EDIT, DELETE. W-Admin has `WildcardGrant(RELEASE)`. W-Member originally had full CRUD; W-Guest originally had VIEW. **Updated 2026-04-22:** W-Member reduced to VIEW-only and W-Guest removed entirely — see "Role Grant Change: Release — Member/Guest Tightening (2026-04-22)" below. The per-endpoint tables in this section describe the `@can` decorators on each endpoint (which have not changed); who satisfies those decorators is governed by the current role grants.

### ReleaseEndpoint

**File:** `apps/api/plane/app/views/release/base.py`

| Method   | URL Pattern                                | Old Permission | New Permission                                                   | Differences                                                           |
| -------- | ------------------------------------------ | -------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/releases/[<pk>/]`  | N/A (new)      | `@can(ReleasePermissions.VIEW, resource_param="workspace_id")`   | New endpoint. W-Admin via `release:*`, W-Member via `release:view`.   |
| `post`   | `POST /workspaces/<slug>/releases/`        | N/A (new)      | `@can(ReleasePermissions.CREATE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:create`. |
| `patch`  | `PATCH /workspaces/<slug>/releases/<pk>/`  | N/A (new)      | `@can(ReleasePermissions.EDIT, resource_param="workspace_id")`   | New endpoint. W-Admin via `release:*`, W-Member via `release:edit`.   |
| `delete` | `DELETE /workspaces/<slug>/releases/<pk>/` | N/A (new)      | `@can(ReleasePermissions.DELETE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:delete`. |

### ReleaseTagEndpoint

**File:** `apps/api/plane/app/views/release/tag.py`

| Method   | URL Pattern                                                  | Old Permission | New Permission                                                   | Differences                                                           |
| -------- | ------------------------------------------------------------ | -------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/releases/<release_id>/tags/[<pk>/]`  | N/A (new)      | `@can(ReleasePermissions.VIEW, resource_param="workspace_id")`   | New endpoint. W-Admin via `release:*`, W-Member via `release:view`.   |
| `post`   | `POST /workspaces/<slug>/releases/<release_id>/tags/`        | N/A (new)      | `@can(ReleasePermissions.CREATE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:create`. |
| `patch`  | `PATCH /workspaces/<slug>/releases/<release_id>/tags/<pk>/`  | N/A (new)      | `@can(ReleasePermissions.EDIT, resource_param="workspace_id")`   | New endpoint. W-Admin via `release:*`, W-Member via `release:edit`.   |
| `delete` | `DELETE /workspaces/<slug>/releases/<release_id>/tags/<pk>/` | N/A (new)      | `@can(ReleasePermissions.DELETE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:delete`. |

### ReleaseLabelEndpoint

**File:** `apps/api/plane/app/views/release/label.py`

| Method   | URL Pattern                                                    | Old Permission | New Permission                                                   | Differences                                                           |
| -------- | -------------------------------------------------------------- | -------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/releases/<release_id>/labels/[<pk>/]`  | N/A (new)      | `@can(ReleasePermissions.VIEW, resource_param="workspace_id")`   | New endpoint. W-Admin via `release:*`, W-Member via `release:view`.   |
| `post`   | `POST /workspaces/<slug>/releases/<release_id>/labels/`        | N/A (new)      | `@can(ReleasePermissions.CREATE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:create`. |
| `patch`  | `PATCH /workspaces/<slug>/releases/<release_id>/labels/<pk>/`  | N/A (new)      | `@can(ReleasePermissions.EDIT, resource_param="workspace_id")`   | New endpoint. W-Admin via `release:*`, W-Member via `release:edit`.   |
| `delete` | `DELETE /workspaces/<slug>/releases/<release_id>/labels/<pk>/` | N/A (new)      | `@can(ReleasePermissions.DELETE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:delete`. |

### ReleaseWorkItemEndpoint

**File:** `apps/api/plane/app/views/release/work_item.py`

| Method   | URL Pattern                                                        | Old Permission | New Permission                                                   | Differences                                                           |
| -------- | ------------------------------------------------------------------ | -------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/releases/<release_id>/work-items/`         | N/A (new)      | `@can(ReleasePermissions.VIEW, resource_param="workspace_id")`   | New endpoint. W-Admin via `release:*`, W-Member via `release:view`.   |
| `post`   | `POST /workspaces/<slug>/releases/<release_id>/work-items/`        | N/A (new)      | `@can(ReleasePermissions.CREATE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:create`. |
| `delete` | `DELETE /workspaces/<slug>/releases/<release_id>/work-items/<pk>/` | N/A (new)      | `@can(ReleasePermissions.DELETE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:delete`. |

### ReleaseCommentViewSet

**File:** `apps/api/plane/app/views/release/comment.py`

| Method           | URL Pattern                                                      | Old Permission | New Permission                                                   | Differences                                                               |
| ---------------- | ---------------------------------------------------------------- | -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `list`           | `GET /workspaces/<slug>/releases/<release_id>/comments/`         | N/A (new)      | `@can(ReleasePermissions.VIEW, resource_param="workspace_id")`   | New endpoint. W-Admin via `release:*`, W-Member via `release:view`.       |
| `create`         | `POST /workspaces/<slug>/releases/<release_id>/comments/`        | N/A (new)      | `@can(ReleasePermissions.CREATE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:create`.     |
| `partial_update` | `PATCH /workspaces/<slug>/releases/<release_id>/comments/<pk>/`  | N/A (new)      | `@can(ReleasePermissions.EDIT, resource_param="workspace_id")`   | New endpoint. Creator-only inline check — only comment author can edit.   |
| `destroy`        | `DELETE /workspaces/<slug>/releases/<release_id>/comments/<pk>/` | N/A (new)      | `@can(ReleasePermissions.DELETE, resource_param="workspace_id")` | New endpoint. Creator-only inline check — only comment author can delete. |

### ReleaseCommentReactionViewSet

**File:** `apps/api/plane/app/views/release/comment.py`

| Method    | URL Pattern                                                                             | Old Permission | New Permission                                                 | Differences                                                         |
| --------- | --------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| `list`    | `GET /workspaces/<slug>/releases/<release_id>/comments/<comment_id>/reactions/`         | N/A (new)      | `@can(ReleasePermissions.VIEW, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:view`. |
| `create`  | `POST /workspaces/<slug>/releases/<release_id>/comments/<comment_id>/reactions/`        | N/A (new)      | `@can(ReleasePermissions.VIEW, resource_param="workspace_id")` | New endpoint. VIEW-level gate — any user who can view can react.    |
| `destroy` | `DELETE /workspaces/<slug>/releases/<release_id>/comments/<comment_id>/reactions/<pk>/` | N/A (new)      | `@can(ReleasePermissions.VIEW, resource_param="workspace_id")` | New endpoint. VIEW-level gate — any user who can view can unreact.  |

### ReleaseChangelogEndpoint

**File:** `apps/api/plane/app/views/release/changelog.py`

| Method   | URL Pattern                                                        | Old Permission | New Permission                                                   | Differences                                                           |
| -------- | ------------------------------------------------------------------ | -------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/releases/<release_id>/changelogs/[<pk>/]`  | N/A (new)      | `@can(ReleasePermissions.VIEW, resource_param="workspace_id")`   | New endpoint. W-Admin via `release:*`, W-Member via `release:view`.   |
| `post`   | `POST /workspaces/<slug>/releases/<release_id>/changelogs/`        | N/A (new)      | `@can(ReleasePermissions.CREATE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:create`. |
| `patch`  | `PATCH /workspaces/<slug>/releases/<release_id>/changelogs/<pk>/`  | N/A (new)      | `@can(ReleasePermissions.EDIT, resource_param="workspace_id")`   | New endpoint. W-Admin via `release:*`, W-Member via `release:edit`.   |
| `delete` | `DELETE /workspaces/<slug>/releases/<release_id>/changelogs/<pk>/` | N/A (new)      | `@can(ReleasePermissions.DELETE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:delete`. |

### ReleasePageEndpoint

**File:** `apps/api/plane/app/views/release/page.py`

| Method   | URL Pattern                                                   | Old Permission | New Permission                                                   | Differences                                                           |
| -------- | ------------------------------------------------------------- | -------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/releases/<release_id>/pages/`         | N/A (new)      | `@can(ReleasePermissions.VIEW, resource_param="workspace_id")`   | New endpoint. W-Admin via `release:*`, W-Member via `release:view`.   |
| `post`   | `POST /workspaces/<slug>/releases/<release_id>/pages/`        | N/A (new)      | `@can(ReleasePermissions.CREATE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:create`. |
| `delete` | `DELETE /workspaces/<slug>/releases/<release_id>/pages/<pk>/` | N/A (new)      | `@can(ReleasePermissions.DELETE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:delete`. |

### ReleaseAttachmentEndpoint

**File:** `apps/api/plane/app/views/release/attachment.py`

| Method   | URL Pattern                                                         | Old Permission | New Permission                                                   | Differences                                                                    |
| -------- | ------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `get`    | `GET /workspaces/<slug>/releases/<release_id>/attachments/`         | N/A (new)      | `@can(ReleasePermissions.VIEW, resource_param="workspace_id")`   | New endpoint. W-Admin via `release:*`, W-Member via `release:view`.            |
| `post`   | `POST /workspaces/<slug>/releases/<release_id>/attachments/`        | N/A (new)      | `@can(ReleasePermissions.CREATE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:create`.          |
| `delete` | `DELETE /workspaces/<slug>/releases/<release_id>/attachments/<pk>/` | N/A (new)      | `@can(ReleasePermissions.DELETE, resource_param="workspace_id")` | New endpoint. Creator-only inline check — only attachment uploader can delete. |

### ReleaseActivityEndpoint

**File:** `apps/api/plane/app/views/release/activity.py`

| Method | URL Pattern                                                | Old Permission | New Permission                                                 | Differences                                                         |
| ------ | ---------------------------------------------------------- | -------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/releases/<release_id>/activities/` | N/A (new)      | `@can(ReleasePermissions.VIEW, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:view`. |

### ReleaseLinkViewSet

**File:** `apps/api/plane/app/views/release/link.py`

| Method           | URL Pattern                                                   | Old Permission | New Permission                                                   | Differences                                                           |
| ---------------- | ------------------------------------------------------------- | -------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| `create`         | `POST /workspaces/<slug>/releases/<release_id>/links/`        | N/A (new)      | `@can(ReleasePermissions.CREATE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:create`. |
| `partial_update` | `PATCH /workspaces/<slug>/releases/<release_id>/links/<pk>/`  | N/A (new)      | `@can(ReleasePermissions.EDIT, resource_param="workspace_id")`   | New endpoint. W-Admin via `release:*`, W-Member via `release:edit`.   |
| `destroy`        | `DELETE /workspaces/<slug>/releases/<release_id>/links/<pk>/` | N/A (new)      | `@can(ReleasePermissions.DELETE, resource_param="workspace_id")` | New endpoint. W-Admin via `release:*`, W-Member via `release:delete`. |

### IssuePropertyFormulaValidateEndpoint

**File:** `apps/api/plane/ee/views/app/issue_property/formula.py`

| Method | URL Pattern                                                                        | Old Permission                        | New Permission                                                     | Differences                                                                                                      |
| ------ | ---------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/issue-properties/formula/validate/` | `ProjectEntityPermission` (DRF class) | `@can(IssuePropertyPermissions.EDIT, resource_param="project_id")` | Direct mapping. P-Admin ✅ (`issue_property:*`), P-Contributor ✅ (`issue_property:edit`). P-Commenter/Guest ❌. |

### WorkItemListProjectEndpoint

**File:** `apps/api/plane/app/views/issue/work_item.py`

| Method | URL Pattern                                                | Old Permission                                             | New Permission                                                                       | Differences                                                                                                                                                   |
| ------ | ---------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/work-items/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(WorkitemPermissions.VIEW, resource_param="project_id", defer_conditions=True)` | Guest access via `workitem:view+creator` conditional grant with `defer_conditions=True` — guest sees only own issues via inline `created_by` queryset filter. |

### WorkItemListWorkspaceEndpoint

**File:** `apps/api/plane/app/views/issue/work_item.py`

| Method | URL Pattern                          | Old Permission                                                                | New Permission                                                                                                                                          | Differences                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------ | ------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/work-items/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id")` + `AuthorizedListingView` mixin + `.authorized_for(request, WorkitemPermissions.VIEW)` | Uses the canonical authorized-listing pattern. Scope-membership gate (`workspace:view`) decides 200 vs 403 for outsiders. `.authorized_for()` on the queryset handles per-project row filtering via `get_accessible_resources_with_conditions` — correctly handles `workitem:view+creator` conditional grants (project guests see only their own issues), merges direct + teamspace-link paths per resource (deny wins > unconditional upgrades conditional > conditionals union), and fast-paths workspace owner/admin via the workspace-scope wildcard grant. `AuthorizedListingView` enforces the `.authorized_for()` call at `finalize_response`; omitting it returns a structured 500 (`code="listing_authorization_misconfigured"`). Canonical variable order in the view: authorize FIRST, snapshot `total_count_queryset` SECOND, annotate / prefetch / order LAST — so `total_count` / `total_results` reflect only rows the caller can see. |

### IssueVoteEndpoint

**File:** `apps/api/plane/app/views/issue/vote.py`

| Method   | URL Pattern                                                                        | Old Permission                                                              | New Permission                                                   | Differences                                                                       |
| -------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `get`    | `GET /workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/votes/`    | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")` | `@can(WorkitemPermissions.REACT, resource_param="work_item_id")` | Matches `IssueReactionViewSet` pattern. Guests retain access via base role grant. |
| `post`   | `POST /workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/votes/`   | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")` | `@can(WorkitemPermissions.REACT, resource_param="work_item_id")` | Same.                                                                             |
| `delete` | `DELETE /workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/votes/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")` | `@can(WorkitemPermissions.REACT, resource_param="work_item_id")` | Same.                                                                             |

### WorkItemStateDurationEndpoint

**File:** `apps/api/plane/app/views/issue/state_duration.py`

| Method | URL Pattern                                                                              | Old Permission                                             | New Permission                                                  | Differences                                                                                                                                                                                                           |
| ------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/state-duration/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` | `@can(WorkitemPermissions.VIEW, resource_param="work_item_id")` | Per-item `workitem:view` check (matches `issue/comment.py`, `issue/version.py`). Inline guest/epic business guards preserved — they remain equal-or-more-restrictive than the engine's `workitem:view+creator` grant. |

### WorkItemWorklogEndpoint (External API)

**File:** `apps/api/plane/api/views/worklog.py`

| Method   | URL Pattern                                       | Old Permission                                 | New Permission                                              | Differences                                                                                                     |
| -------- | ------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `post`   | `POST .../work-items/<issue_id>/worklogs/`        | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(WorkitemPermissions.EDIT, resource_param="issue_id")` | Admin + Contributor have `workitem:edit` unconditionally; guests lack it. Parity with legacy ADMIN/MEMBER gate. |
| `get`    | `GET .../work-items/<issue_id>/worklogs/`         | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(WorkitemPermissions.EDIT, resource_param="issue_id")` | Same.                                                                                                           |
| `patch`  | `PATCH .../work-items/<issue_id>/worklogs/<pk>/`  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(WorkitemPermissions.EDIT, resource_param="issue_id")` | Same.                                                                                                           |
| `delete` | `DELETE .../work-items/<issue_id>/worklogs/<pk>/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(WorkitemPermissions.EDIT, resource_param="issue_id")` | Same.                                                                                                           |

### ProjectWorklogAPIEndpoint (External API)

**File:** `apps/api/plane/api/views/worklog.py`

| Method | URL Pattern                                                    | Old Permission                                 | New Permission                                                | Differences                                                           |
| ------ | -------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| `get`  | `GET /workspaces/<slug>/projects/<project_id>/total-worklogs/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Project-scope summary endpoint. Parity with legacy ADMIN/MEMBER gate. |

### ProjectMembersImportEndpoint

**File:** `apps/api/plane/ee/views/app/project/user_import.py`

| Method | URL Pattern                                                     | Old Permission                                                   | New Permission                                                       | Differences                                                                                                                       |
| ------ | --------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `post` | `POST /workspaces/<slug>/projects/<project_id>/member-imports/` | `@allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")` | `@can(ProjectMemberPermissions.INVITE, resource_param="project_id")` | Project admin required. New permission model: project admin has `project_member:*` wildcard; others lack `project_member:invite`. |

---

## Role Grant Change: Workspace Admin — Custom Role Access (2026-04-07)

**Change:** Added `WildcardGrant(ResourceType.CUSTOM_ROLE)` to workspace admin role in `system_roles.py`.

**Before:** Custom role management (`custom_role:create`, `custom_role:edit`, `custom_role:delete`, `custom_role:view`) was restricted to workspace owner only (`FULL_ACCESS`).

**After:** Workspace admin now has full access to custom roles via `custom_role:*`.

| Permission           | W-Owner | W-Admin (before) | W-Admin (after)    | W-Member | W-Guest |
| -------------------- | ------- | ---------------- | ------------------ | -------- | ------- |
| `custom_role:view`   | ✅ `*`  | ❌               | ✅ `custom_role:*` | ❌       | ❌      |
| `custom_role:create` | ✅ `*`  | ❌               | ✅ `custom_role:*` | ❌       | ❌      |
| `custom_role:edit`   | ✅ `*`  | ❌               | ✅ `custom_role:*` | ❌       | ❌      |
| `custom_role:delete` | ✅ `*`  | ❌               | ✅ `custom_role:*` | ❌       | ❌      |

---

## Permission Definition Change: `workspace:archive` Removed (2026-04-20)

**Change:** Removed `WorkspacePermissions.ARCHIVE` from `apps/api/plane/permissions/definitions.py` and from the workspace admin permission scheme in `permission_schemes.py`.

**Rationale:** Workspace archive was defined on the backend but never wired into any view or client call — there is no user-facing workspace-archive concept. Keeping it would leave stale permission surface and drift the backend from the frontend resource-action map (which never listed it).

**Impact:** None at runtime — no endpoint, store, or client call referenced `workspace:archive`. Any future attempt to emit that permission string (e.g. from a migrated role scheme) will now correctly fail fast in the role builder UI or backend serializer.

---

## Role Grant Change: Release — Member/Guest Tightening (2026-04-22)

**Change:** Tightened release access in the `member` and `guest` workspace permission schemes in `apps/api/plane/permissions/permission_schemes.py`.

- **Workspace Member** (`member` scheme): removed `ReleasePermissions.CREATE`, `ReleasePermissions.EDIT`, `ReleasePermissions.DELETE`. Retains `ReleasePermissions.VIEW` only.
- **Workspace Guest** (`guest` scheme): removed `ReleasePermissions.VIEW`. Now has no release access at all.
- Workspace Owner (`FULL_ACCESS`) and Workspace Admin (`WildcardGrant(ResourceType.RELEASE)`) are unchanged.

**Rationale:** Releases are a workspace-level publishing/coordination artifact; create/edit/delete should be gated to admins. Members retain read-only visibility so they can consume release content. Guests (minimal access) no longer see releases.

| Permission       | W-Owner | W-Admin        | W-Member (before) | W-Member (after)  | W-Guest (before)  | W-Guest (after) |
| ---------------- | ------- | -------------- | ----------------- | ----------------- | ----------------- | --------------- |
| `release:view`   | ✅ `*`  | ✅ `release:*` | ✅                | ✅ `release:view` | ✅ `release:view` | ❌              |
| `release:create` | ✅ `*`  | ✅ `release:*` | ✅                | ❌                | ❌                | ❌              |
| `release:edit`   | ✅ `*`  | ✅ `release:*` | ✅                | ❌                | ❌                | ❌              |
| `release:delete` | ✅ `*`  | ✅ `release:*` | ✅                | ❌                | ❌                | ❌              |

**Impact:**

- `@can` decorators on `apps/api/plane/app/views/release/*` are unchanged; the tightening is purely at the role-grant layer. Workspace members now receive 403 on any write to release endpoints (base, tag, label, work item, comment, changelog, page, attachment, link). Workspace guests receive 403 on any release endpoint.
- FE must hide release create/edit/delete affordances for workspace members, and hide the release surface entirely for workspace guests.
- Custom workspace roles built before this change that copied the member or guest system scheme will not be auto-updated — those custom schemes retain whatever permissions they were authored with.

---

## Role Grant Change: Initiatives — Member Attachment & Link Tightening (2026-04-22)

**Change:** Removed `initiative_attachment:create/edit/delete` and `initiative_link:create/edit/delete` from the `member` workspace permission scheme in `apps/api/plane/permissions/permission_schemes.py`. `initiative_attachment:view` and `initiative_link:view` are retained.

**Rationale:** In the FE permission matrix (`packages/constants/src/roles-and-permissions/workspace-permission-groups.ts`), `initiative_attachment:create` and `initiative_link:create/edit/delete` are declared with `foldedUnder: "initiative:edit"` — they are hidden rows that only appear (implicitly) when a role has `initiative:edit`. The member role does not have `initiative:edit`, so the prior grants put the role in a state that couldn't be represented or toggled from the custom-role editor: the UI showed `initiative:edit` off while the runtime still granted attachment/link mutations. Aligning the backend with the fold contract means members can view initiative attachments and links (read-only) but cannot add, modify, or delete them.

| Permission                     | W-Owner | W-Admin                      | W-Member (before) | W-Member (after)                | W-Guest |
| ------------------------------ | ------- | ---------------------------- | ----------------- | ------------------------------- | ------- |
| `initiative_attachment:view`   | ✅ `*`  | ✅ `initiative_attachment:*` | ✅                | ✅ `initiative_attachment:view` | ❌      |
| `initiative_attachment:create` | ✅ `*`  | ✅ `initiative_attachment:*` | ✅                | ❌                              | ❌      |
| `initiative_attachment:edit`   | ✅ `*`  | ✅ `initiative_attachment:*` | ✅                | ❌                              | ❌      |
| `initiative_attachment:delete` | ✅ `*`  | ✅ `initiative_attachment:*` | ✅ `+creator`     | ❌                              | ❌      |
| `initiative_link:view`         | ✅ `*`  | ✅ `initiative_link:*`       | ✅                | ✅ `initiative_link:view`       | ❌      |
| `initiative_link:create`       | ✅ `*`  | ✅ `initiative_link:*`       | ✅                | ❌                              | ❌      |
| `initiative_link:edit`         | ✅ `*`  | ✅ `initiative_link:*`       | ✅                | ❌                              | ❌      |
| `initiative_link:delete`       | ✅ `*`  | ✅ `initiative_link:*`       | ✅                | ❌                              | ❌      |

**Impact:**

- `@can` decorators on initiative attachment and link endpoints are unchanged; the tightening is at the role-grant layer. Workspace members now receive 403 on upload/mark-uploaded/delete for initiative attachments and on create/edit/delete for initiative links. Read (list/retrieve) continues to work.
- FE affordances for adding/editing/deleting initiative attachments and links must be hidden for workspace members. The fold already suppresses these rows in the custom-role editor, so no matrix-editor UI changes are needed.
- Custom workspace roles authored from the member system scheme before this change are frozen with their old grants — they are not auto-updated.
