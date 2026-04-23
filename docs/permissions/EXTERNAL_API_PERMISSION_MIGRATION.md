# External API (v1) Permission Migration Tracker

This document tracks the migration of the external API (`/api/v1/`) from old permission classes (`ProjectEntityPermission`, `WorkSpaceAdminPermission`, etc.) to the `@can` decorator with granular permission checks. See the plan file for full context on approach, edge cases, and intentional permission changes.

**Common changes for ALL migrated views:**

- `permission_classes` replaced with `[IsAuthenticated, OauthApplicationWorkspacePermission, TokenHasScopeIfOAuth]`
- Feature-flagged views additionally include the relevant feature flag permission class
- `workspace_id` property added to `BaseAPIView` and `BaseViewSet`
- `get_permissions()` overrides removed where present (member.py)

## Migration Status

| Batch                              | Files    | Views                    | Status   |
| ---------------------------------- | -------- | ------------------------ | -------- |
| 1 — States + Labels                | 3 files  | 6 views                  | Migrated |
| 2 — Issues + Sub-resources         | 1 file   | 15 views (+1 kept as-is) | Migrated |
| 3 — Cycles + Modules + Epics       | 3 files  | 13 views                 | Migrated |
| 4 — Projects + Workspace resources | 9 files  | 15 views (+2 kept as-is) | Migrated |
| 5 — EE features + Properties       | 15 files | 34 views (+1 kept as-is) | Migrated |

## Batch 1: States + Labels

### `plane/api/views/state.py`

#### StateListCreateAPIEndpoint

| Method | URL Pattern                                                    | Old Permission            | New Permission                                               | Differences                            |
| ------ | -------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------ | -------------------------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/states/`  | `ProjectEntityPermission` | `@can(StatePermissions.VIEW, resource_param="project_id")`   | Checks `state:view` from role grants   |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/states/` | `ProjectEntityPermission` | `@can(StatePermissions.CREATE, resource_param="project_id")` | Checks `state:create` from role grants |

#### StateDetailAPIEndpoint

| Method   | URL Pattern                                                                 | Old Permission            | New Permission                                               | Differences                            |
| -------- | --------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------ | -------------------------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/states/<state_id>/`    | `ProjectEntityPermission` | `@can(StatePermissions.VIEW, resource_param="project_id")`   | No conditional grants; parent param OK |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/states/<state_id>/`  | `ProjectEntityPermission` | `@can(StatePermissions.EDIT, resource_param="project_id")`   | Checks `state:edit`                    |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/states/<state_id>/` | `ProjectEntityPermission` | `@can(StatePermissions.DELETE, resource_param="project_id")` | Checks `state:delete`                  |

### `plane/api/views/issue.py` -- Labels

#### LabelListCreateAPIEndpoint

| Method | URL Pattern                                                    | Old Permission            | New Permission                                               | Differences           |
| ------ | -------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------ | --------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/labels/`  | `ProjectMemberPermission` | `@can(LabelPermissions.VIEW, resource_param="project_id")`   | Checks `label:view`   |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/labels/` | `ProjectMemberPermission` | `@can(LabelPermissions.CREATE, resource_param="project_id")` | Checks `label:create` |

#### LabelDetailAPIEndpoint

| Method   | URL Pattern                                                           | Old Permission            | New Permission                                               | Differences           |
| -------- | --------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------ | --------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/labels/<pk>/`    | `ProjectMemberPermission` | `@can(LabelPermissions.VIEW, resource_param="project_id")`   | Checks `label:view`   |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/labels/<pk>/`  | `ProjectMemberPermission` | `@can(LabelPermissions.EDIT, resource_param="project_id")`   | Checks `label:edit`   |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/labels/<pk>/` | `ProjectMemberPermission` | `@can(LabelPermissions.DELETE, resource_param="project_id")` | Checks `label:delete` |

### `plane/api/views/project_label.py`

#### ProjectLabelListCreateAPIEndpoint

| Method | URL Pattern                                      | Old Permission             | New Permission                                                                                   | Differences                                    |
| ------ | ------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/project-labels/`  | `WorkSpaceAdminPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped; matches internal app pattern |
| `post` | `POST /api/v1/workspaces/<slug>/project-labels/` | `WorkSpaceAdminPermission` | `@can(WorkspacePermissions.MANAGE, resource_param="workspace_id", scope_param_type="workspace")` | Checks `workspace:manage`                      |

#### ProjectLabelDetailAPIEndpoint

| Method   | URL Pattern                                             | Old Permission             | New Permission                                                                                   | Differences               |
| -------- | ------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/project-labels/<pk>/`    | `WorkSpaceAdminPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped          |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/project-labels/<pk>/`  | `WorkSpaceAdminPermission` | `@can(WorkspacePermissions.MANAGE, resource_param="workspace_id", scope_param_type="workspace")` | Checks `workspace:manage` |
| `delete` | `DELETE /api/v1/workspaces/<slug>/project-labels/<pk>/` | `WorkSpaceAdminPermission` | `@can(WorkspacePermissions.MANAGE, resource_param="workspace_id", scope_param_type="workspace")` | Checks `workspace:manage` |

---

## Batch 2: Issues + Sub-resources

### `plane/api/views/issue.py` -- Issues

#### WorkspaceIssueAPIEndpoint

| Method | URL Pattern                                                                     | Old Permission            | New Permission                                                                                | Differences                                             |
| ------ | ------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/issues/<project_identifier>-<issue_identifier>/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped; queryset validates project membership |

#### IssueListCreateAPIEndpoint

| Method | URL Pattern                                                        | Old Permission            | New Permission                                                                       | Differences                                                               |
| ------ | ------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/`  | `ProjectEntityPermission` | `@can(WorkitemPermissions.VIEW, resource_param="project_id", defer_conditions=True)` | Guest: `workitem:view+creator` deferred; queryset filters by `created_by` |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/work-items/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.CREATE, resource_param="project_id")`                      | Checks `workitem:create`                                                  |

#### IssueDetailAPIEndpoint

| Method   | URL Pattern                                                               | Old Permission            | New Permission                                                  | Differences                                 |
| -------- | ------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<pk>/`    | `ProjectEntityPermission` | `@can(WorkitemPermissions.VIEW, resource_param="pk")`           | Guest: `workitem:view+creator` conditional  |
| `put`    | `PUT /api/v1/workspaces/<slug>/projects/<project_id>/work-items/`         | `ProjectEntityPermission` | `@can(WorkitemPermissions.CREATE, resource_param="project_id")` | Upsert = create-level                       |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<pk>/`  | `ProjectEntityPermission` | `@can(WorkitemPermissions.EDIT, resource_param="pk")`           | `workitem:edit+creator` for commenter/guest |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<pk>/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.DELETE, resource_param="pk")`         | `workitem:delete+creator` for contributor   |

### `plane/api/views/issue.py` -- Links

#### IssueLinkListCreateAPIEndpoint

| Method | URL Pattern                                                                         | Old Permission            | New Permission                                                                                            | Differences                                        |
| ------ | ----------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/links/`  | `ProjectEntityPermission` | `@can(WorkitemLinkPermissions.VIEW, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)`   | Checks `workitem_link:view` with workitem parent   |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/links/` | `ProjectEntityPermission` | `@can(WorkitemLinkPermissions.CREATE, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Checks `workitem_link:create` with workitem parent |

#### IssueLinkDetailAPIEndpoint

| Method   | URL Pattern                                                                                | Old Permission            | New Permission                                                                                          | Differences                        |
| -------- | ------------------------------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/links/<pk>/`    | `ProjectEntityPermission` | `@can(WorkitemLinkPermissions.VIEW, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Checks `workitem_link:view`        |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/links/<pk>/`  | `ProjectEntityPermission` | `@can(WorkitemLinkPermissions.EDIT, resource_param="pk")`                                               | `pk`-level for creator conditional |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/links/<pk>/` | `ProjectEntityPermission` | `@can(WorkitemLinkPermissions.DELETE, resource_param="pk")`                                             | `pk`-level for creator conditional |

### `plane/api/views/issue.py` -- Comments

#### IssueCommentListCreateAPIEndpoint

| Method | URL Pattern                                                                            | Old Permission          | New Permission                                                                                       | Differences                                  |
| ------ | -------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/comments/`  | `ProjectLitePermission` | `@can(WorkitemPermissions.VIEW, resource_param="issue_id")`                                          | Checks issue-level VIEW                      |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/comments/` | `ProjectLitePermission` | `@can(CommentPermissions.CREATE, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Checks `comment:create` with workitem parent |

#### IssueCommentDetailAPIEndpoint

| Method   | URL Pattern                                                                                   | Old Permission          | New Permission                                              | Differences                          |
| -------- | --------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------- | ------------------------------------ |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/comments/<pk>/`    | `ProjectLitePermission` | `@can(WorkitemPermissions.VIEW, resource_param="issue_id")` | Checks issue-level VIEW              |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/comments/<pk>/`  | `ProjectLitePermission` | `@can(CommentPermissions.EDIT, resource_param="pk")`        | `comment:edit+creator` conditional   |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/comments/<pk>/` | `ProjectLitePermission` | `@can(CommentPermissions.DELETE, resource_param="pk")`      | `comment:delete+creator` conditional |

### `plane/api/views/issue.py` -- Activities

#### IssueActivityListAPIEndpoint

| Method | URL Pattern                                                                             | Old Permission            | New Permission                                              | Differences             |
| ------ | --------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------- | ----------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/activities/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.VIEW, resource_param="issue_id")` | Checks issue-level VIEW |

#### IssueActivityDetailAPIEndpoint

| Method | URL Pattern                                                                                  | Old Permission            | New Permission                                              | Differences             |
| ------ | -------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------- | ----------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/activities/<pk>/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.VIEW, resource_param="issue_id")` | Checks issue-level VIEW |

### `plane/api/views/issue.py` -- Attachments

#### IssueAttachmentListCreateAPIEndpoint

| Method | URL Pattern                                                                               | Old Permission          | New Permission                                                    | Differences                                 |
| ------ | ----------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/attachments/`  | `ProjectLitePermission` | `@can(AttachmentPermissions.VIEW, resource_param="project_id")`   | Checks `attachment:view` at project level   |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/attachments/` | `ProjectLitePermission` | `@can(AttachmentPermissions.CREATE, resource_param="project_id")` | Checks `attachment:create` at project level |

#### IssueAttachmentDetailAPIEndpoint

| Method   | URL Pattern                                                                                      | Old Permission          | New Permission                                                  | Differences              |
| -------- | ------------------------------------------------------------------------------------------------ | ----------------------- | --------------------------------------------------------------- | ------------------------ |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/attachments/<pk>/`    | `ProjectLitePermission` | `@can(AttachmentPermissions.VIEW, resource_param="project_id")` | Checks `attachment:view` |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/attachments/<pk>/` | `ProjectLitePermission` | `@can(AttachmentPermissions.DELETE, resource_param="pk")`       | `pk`-level for delete    |

#### IssueAttachmentServerEndpoint

| Method | URL Pattern                                                                                      | Old Permission          | New Permission                                                    | Differences             |
| ------ | ------------------------------------------------------------------------------------------------ | ----------------------- | ----------------------------------------------------------------- | ----------------------- |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/attachments/server/` | `ProjectLitePermission` | `@can(AttachmentPermissions.CREATE, resource_param="project_id")` | Server-initiated upload |

### `plane/api/views/issue.py` -- Relations

#### IssueRelationListCreateAPIEndpoint

| Method | URL Pattern                                                                             | Old Permission            | New Permission                                                                                                | Differences                                            |
| ------ | --------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/relations/`  | `ProjectEntityPermission` | `@can(WorkitemRelationPermissions.VIEW, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)`   | Checks `workitem_relation:view` with workitem parent   |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/relations/` | `ProjectEntityPermission` | `@can(WorkitemRelationPermissions.CREATE, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Checks `workitem_relation:create` with workitem parent |

#### IssueRelationRemoveAPIEndpoint

| Method | URL Pattern                                                                                    | Old Permission            | New Permission                                                                                                | Differences                                                            |
| ------ | ---------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/relations/remove/` | `ProjectEntityPermission` | `@can(WorkitemRelationPermissions.DELETE, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Uses DELETE permission via POST method, scoped to the parent work item |

#### IssueSearchEndpoint -- KEPT AS-IS

No `@can` applied. Uses `[IsAuthenticated, TokenHasScopeIfOAuth]` with inline queryset membership filter. Cross-project search cannot use a single `resource_id`.

---

## Batch 3: Cycles + Modules + Epics

### `plane/api/views/cycle.py`

#### CycleListCreateAPIEndpoint

| Method | URL Pattern                                                    | Old Permission            | New Permission                                               | Differences           |
| ------ | -------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------ | --------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/cycles/`  | `ProjectEntityPermission` | `@can(CyclePermissions.VIEW, resource_param="project_id")`   | Checks `cycle:view`   |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/cycles/` | `ProjectEntityPermission` | `@can(CyclePermissions.CREATE, resource_param="project_id")` | Checks `cycle:create` |

#### CycleDetailAPIEndpoint

| Method   | URL Pattern                                                           | Old Permission            | New Permission                                       | Differences                        |
| -------- | --------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------- | ---------------------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/cycles/<pk>/`    | `ProjectEntityPermission` | `@can(CyclePermissions.VIEW, resource_param="pk")`   | Detail-level VIEW                  |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/cycles/<pk>/`  | `ProjectEntityPermission` | `@can(CyclePermissions.EDIT, resource_param="pk")`   | `pk`-level for creator conditional |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/cycles/<pk>/` | `ProjectEntityPermission` | `@can(CyclePermissions.DELETE, resource_param="pk")` | `pk`-level for creator conditional |

#### CycleArchiveUnarchiveAPIEndpoint

| Method   | URL Pattern                                                                                    | Old Permission            | New Permission                                             | Differences                            |
| -------- | ---------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/archived-cycles/`                         | `ProjectEntityPermission` | `@can(CyclePermissions.VIEW, resource_param="project_id")` | List archived cycles                   |
| `post`   | `POST /api/v1/workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/archive/`              | `ProjectEntityPermission` | `@can(CyclePermissions.ARCHIVE, resource_param="pk")`      | Checks `cycle:archive`                 |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/archived-cycles/<cycle_id>/unarchive/` | `ProjectEntityPermission` | `@can(CyclePermissions.ARCHIVE, resource_param="pk")`      | Unarchive uses same ARCHIVE permission |

#### CycleIssueListCreateAPIEndpoint

| Method | URL Pattern                                                                            | Old Permission            | New Permission                                           | Differences                   |
| ------ | -------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------- | ----------------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/cycle-issues/`  | `ProjectEntityPermission` | `@can(CyclePermissions.VIEW, resource_param="cycle_id")` | Checks cycle-level VIEW       |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/cycle-issues/` | `ProjectEntityPermission` | `@can(CyclePermissions.EDIT, resource_param="cycle_id")` | Adding issues = editing cycle |

#### CycleIssueDetailAPIEndpoint

| Method   | URL Pattern                                                                                         | Old Permission            | New Permission                                           | Differences                     |
| -------- | --------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------- | ------------------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/cycle-issues/<issue_id>/`    | `ProjectEntityPermission` | `@can(CyclePermissions.VIEW, resource_param="cycle_id")` | Checks cycle-level VIEW         |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/cycle-issues/<issue_id>/` | `ProjectEntityPermission` | `@can(CyclePermissions.EDIT, resource_param="cycle_id")` | Removing issues = editing cycle |

#### TransferCycleIssueAPIEndpoint

| Method | URL Pattern                                                                               | Old Permission            | New Permission                                           | Differences              |
| ------ | ----------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------- | ------------------------ |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/cycles/<cycle_id>/transfer-issues/` | `ProjectEntityPermission` | `@can(CyclePermissions.EDIT, resource_param="cycle_id")` | Transfer = editing cycle |

### `plane/api/views/module.py`

#### ModuleListCreateAPIEndpoint

| Method | URL Pattern                                                     | Old Permission            | New Permission                                                | Differences            |
| ------ | --------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------- | ---------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/modules/`  | `ProjectEntityPermission` | `@can(ModulePermissions.VIEW, resource_param="project_id")`   | Checks `module:view`   |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/modules/` | `ProjectEntityPermission` | `@can(ModulePermissions.CREATE, resource_param="project_id")` | Checks `module:create` |

#### ModuleDetailAPIEndpoint

| Method   | URL Pattern                                                            | Old Permission            | New Permission                                        | Differences           |
| -------- | ---------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------- | --------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/modules/<pk>/`    | `ProjectEntityPermission` | `@can(ModulePermissions.VIEW, resource_param="pk")`   | Detail-level VIEW     |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/modules/<pk>/`  | `ProjectEntityPermission` | `@can(ModulePermissions.EDIT, resource_param="pk")`   | `pk`-level for edit   |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/modules/<pk>/` | `ProjectEntityPermission` | `@can(ModulePermissions.DELETE, resource_param="pk")` | `pk`-level for delete |

#### ModuleArchiveUnarchiveAPIEndpoint

| Method   | URL Pattern                                                                               | Old Permission            | New Permission                                              | Differences                            |
| -------- | ----------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------- | -------------------------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/archived-modules/`                   | `ProjectEntityPermission` | `@can(ModulePermissions.VIEW, resource_param="project_id")` | List archived modules                  |
| `post`   | `POST /api/v1/workspaces/<slug>/projects/<project_id>/modules/<pk>/archive/`              | `ProjectEntityPermission` | `@can(ModulePermissions.ARCHIVE, resource_param="pk")`      | Checks `module:archive`                |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/archived-modules/<pk>/unarchive/` | `ProjectEntityPermission` | `@can(ModulePermissions.ARCHIVE, resource_param="pk")`      | Unarchive uses same ARCHIVE permission |

#### ModuleIssueListCreateAPIEndpoint

| Method | URL Pattern                                                                               | Old Permission            | New Permission                                             | Differences                    |
| ------ | ----------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------- | ------------------------------ |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/modules/<module_id>/module-issues/`  | `ProjectEntityPermission` | `@can(ModulePermissions.VIEW, resource_param="module_id")` | Checks module-level VIEW       |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/modules/<module_id>/module-issues/` | `ProjectEntityPermission` | `@can(ModulePermissions.EDIT, resource_param="module_id")` | Adding issues = editing module |

#### ModuleIssueDetailAPIEndpoint

| Method   | URL Pattern                                                                                            | Old Permission            | New Permission                                             | Differences                      |
| -------- | ------------------------------------------------------------------------------------------------------ | ------------------------- | ---------------------------------------------------------- | -------------------------------- |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/modules/<module_id>/module-issues/<issue_id>/` | `ProjectEntityPermission` | `@can(ModulePermissions.EDIT, resource_param="module_id")` | Removing issues = editing module |

### `plane/api/views/epic.py`

#### EpicListCreateAPIEndpoint

| Method | URL Pattern                                                  | Old Permission            | New Permission                                            | Differences        |
| ------ | ------------------------------------------------------------ | ------------------------- | --------------------------------------------------------- | ------------------ |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/epics/` | `ProjectEntityPermission` | `@can(EpicPermissions.VIEW, resource_param="project_id")` | Checks `epic:view` |

#### EpicDetailAPIEndpoint

| Method | URL Pattern                                                       | Old Permission            | New Permission                                    | Differences       |
| ------ | ----------------------------------------------------------------- | ------------------------- | ------------------------------------------------- | ----------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/epics/<pk>/` | `ProjectEntityPermission` | `@can(EpicPermissions.VIEW, resource_param="pk")` | Detail-level VIEW |

**Note:** Epic endpoints are read-only in v1 (GET only). The URL config allows POST/PATCH/DELETE but no handler methods are defined.

---

## Batch 4: Projects + Workspace Resources

### `plane/api/views/project.py`

#### ProjectListCreateAPIEndpoint

| Method | URL Pattern                                | Old Permission          | New Permission                                                                                 | Differences             |
| ------ | ------------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------- | ----------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/`  | `ProjectBasePermission` | `@can(ProjectPermissions.BROWSE, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped browse |
| `post` | `POST /api/v1/workspaces/<slug>/projects/` | `ProjectBasePermission` | `@can(ProjectPermissions.CREATE, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped create |

#### ProjectDetailAPIEndpoint

| Method   | URL Pattern                                       | Old Permission          | New Permission                                         | Differences          |
| -------- | ------------------------------------------------- | ----------------------- | ------------------------------------------------------ | -------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<pk>/`    | `ProjectBasePermission` | `@can(ProjectPermissions.VIEW, resource_param="pk")`   | Project-level VIEW   |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/projects/<pk>/`  | `ProjectBasePermission` | `@can(ProjectPermissions.EDIT, resource_param="pk")`   | Project-level EDIT   |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<pk>/` | `ProjectBasePermission` | `@can(ProjectPermissions.DELETE, resource_param="pk")` | Project-level DELETE |

#### ProjectArchiveUnarchiveAPIEndpoint

| Method   | URL Pattern                                                       | Old Permission          | New Permission                                          | Differences                            |
| -------- | ----------------------------------------------------------------- | ----------------------- | ------------------------------------------------------- | -------------------------------------- |
| `post`   | `POST /api/v1/workspaces/<slug>/projects/<project_id>/archive/`   | `ProjectBasePermission` | `@can(ProjectPermissions.ARCHIVE, resource_param="pk")` | Checks `project:archive`               |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/archive/` | `ProjectBasePermission` | `@can(ProjectPermissions.ARCHIVE, resource_param="pk")` | Unarchive uses same ARCHIVE permission |

#### ProjectFeatureAPIEndpoint

| Method  | URL Pattern                                                       | Old Permission          | New Permission                                       | Differences        |
| ------- | ----------------------------------------------------------------- | ----------------------- | ---------------------------------------------------- | ------------------ |
| `get`   | `GET /api/v1/workspaces/<slug>/projects/<project_id>/features/`   | `ProjectBasePermission` | `@can(ProjectPermissions.VIEW, resource_param="pk")` | Project-level VIEW |
| `patch` | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/features/` | `ProjectBasePermission` | `@can(ProjectPermissions.EDIT, resource_param="pk")` | Project-level EDIT |

### `plane/api/views/workspace.py`

#### WorkspaceFeatureAPIEndpoint

| Method  | URL Pattern                                 | Old Permission             | New Permission                                                                                   | Differences                                                                                    |
| ------- | ------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `get`   | `GET /api/v1/workspaces/<slug>/features/`   | `WorkSpaceAdminPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")`   | Widened from W-Admin-only to all workspace members (feature toggle state is non-sensitive).    |
| `patch` | `PATCH /api/v1/workspaces/<slug>/features/` | `WorkSpaceAdminPermission` | `@can(WorkspacePermissions.MANAGE, resource_param="workspace_id", scope_param_type="workspace")` | Parity with old W-Admin-only check; kept admin-only since toggles are workspace-wide settings. |

### `plane/api/views/member.py`

#### WorkspaceMemberAPIEndpoint

| Method | URL Pattern                              | Old Permission             | New Permission                                                                                       | Differences      |
| ------ | ---------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/members/` | `WorkSpaceAdminPermission` | `@can(WorkspaceMemberPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped |

#### ProjectMemberSiloEndpoint

`get_permissions()` override removed. Per-method `@can` replaces dynamic permission switching.

| Method | URL Pattern                                                     | Old Permission                                      | New Permission                                                       | Differences                                |
| ------ | --------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/members/`  | `ProjectMemberPermission` (via `get_permissions()`) | `@can(ProjectMemberPermissions.VIEW, resource_param="project_id")`   | Direct decorator replaces dynamic dispatch |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/members/` | `ProjectAdminPermission` (via `get_permissions()`)  | `@can(ProjectMemberPermissions.INVITE, resource_param="project_id")` | Direct decorator replaces dynamic dispatch |

#### ProjectMemberListCreateAPIEndpoint

`get_permissions()` override removed.

| Method | URL Pattern                                                             | Old Permission                                      | New Permission                                                       | Differences      |
| ------ | ----------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------- | ---------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/project-members/`  | `ProjectMemberPermission` (via `get_permissions()`) | `@can(ProjectMemberPermissions.VIEW, resource_param="project_id")`   | Direct decorator |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/project-members/` | `ProjectAdminPermission` (via `get_permissions()`)  | `@can(ProjectMemberPermissions.INVITE, resource_param="project_id")` | Direct decorator |

#### ProjectMemberDetailAPIEndpoint

| Method   | URL Pattern                                                                    | Old Permission            | New Permission                                                            | Differences                         |
| -------- | ------------------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------------------- | ----------------------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/project-members/<pk>/`    | `ProjectMemberPermission` | `@can(ProjectMemberPermissions.VIEW, resource_param="project_id")`        | Checks `project_member:view`        |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/project-members/<pk>/`  | `ProjectAdminPermission`  | `@can(ProjectMemberPermissions.CHANGE_ROLE, resource_param="project_id")` | Checks `project_member:change_role` |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/project-members/<pk>/` | `ProjectAdminPermission`  | `@can(ProjectMemberPermissions.REMOVE, resource_param="project_id")`      | Checks `project_member:remove`      |

### `plane/api/views/invite.py`

#### WorkspaceInvitationsViewset

| Method   | URL Pattern                                   | Old Permission             | New Permission                                                                                         | Differences                      |
| -------- | --------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------- |
| `create` | `POST /api/v1/workspaces/<slug>/invitations/` | `WorkspaceOwnerPermission` | `@can(WorkspaceMemberPermissions.INVITE, resource_param="workspace_id", scope_param_type="workspace")` | Checks `workspace_member:invite` |

### `plane/api/views/sticky.py`

#### StickyViewSet

All operations use `WorkspacePermissions.VIEW` -- stickies are user-scoped via `queryset.filter(owner_id=request.user.id)`.

| Method           | URL Pattern                                       | Old Permission            | New Permission                                                                                 | Differences          |
| ---------------- | ------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- | -------------------- |
| `list`           | `GET /api/v1/workspaces/<slug>/stickies/`         | `WorkspaceUserPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")` | Any workspace member |
| `create`         | `POST /api/v1/workspaces/<slug>/stickies/`        | `WorkspaceUserPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")` | Any workspace member |
| `retrieve`       | `GET /api/v1/workspaces/<slug>/stickies/<pk>/`    | `WorkspaceUserPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")` | Any workspace member |
| `partial_update` | `PATCH /api/v1/workspaces/<slug>/stickies/<pk>/`  | `WorkspaceUserPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")` | Any workspace member |
| `destroy`        | `DELETE /api/v1/workspaces/<slug>/stickies/<pk>/` | `WorkspaceUserPermission` | `@can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")` | Any workspace member |

### `plane/api/views/worklog.py`

#### WorkItemWorklogEndpoint

Scoped to the parent work item via `issue_id` (per-issue granularity). `@can` runs **before** `@check_feature_flag` so unauthorized callers receive 403, not a feature-flag 402.

| Method   | URL Pattern                                                                                   | Old Permission            | New Permission                                              | Differences                                    |
| -------- | --------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/worklogs/`         | `ProjectEntityPermission` | `@can(WorkitemPermissions.VIEW, resource_param="issue_id")` | Checks `workitem:view` on the parent work item |
| `post`   | `POST /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/worklogs/`        | `ProjectEntityPermission` | `@can(WorkitemPermissions.EDIT, resource_param="issue_id")` | Checks `workitem:edit` on the parent work item |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/worklogs/<pk>/`  | `ProjectEntityPermission` | `@can(WorkitemPermissions.EDIT, resource_param="issue_id")` | Checks `workitem:edit` on the parent work item |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<issue_id>/worklogs/<pk>/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.EDIT, resource_param="issue_id")` | Checks `workitem:edit` on the parent work item |

#### ProjectWorklogAPIEndpoint

| Method | URL Pattern                                                           | Old Permission            | New Permission                                                | Differences            |
| ------ | --------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------- | ---------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/total-worklogs/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.VIEW, resource_param="project_id")` | Checks `workitem:view` |

### `plane/api/views/asset.py`

#### GenericAssetEndpoint

| Method  | URL Pattern                                          | Old Permission            | New Permission                                                                                        | Differences                     |
| ------- | ---------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------- |
| `get`   | `GET /api/v1/workspaces/<slug>/assets/<asset_id>/`   | `ProjectEntityPermission` | `@can(WorkspaceAssetPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")`   | Checks `workspace_asset:view`   |
| `post`  | `POST /api/v1/workspaces/<slug>/assets/`             | `ProjectEntityPermission` | `@can(WorkspaceAssetPermissions.CREATE, resource_param="workspace_id", scope_param_type="workspace")` | Checks `workspace_asset:create` |
| `patch` | `PATCH /api/v1/workspaces/<slug>/assets/<asset_id>/` | `ProjectEntityPermission` | `@can(WorkspaceAssetPermissions.EDIT, resource_param="workspace_id", scope_param_type="workspace")`   | Checks `workspace_asset:edit`   |

Generic assets are workspace-scoped on the external API (stored under the workspace, optionally tagged with `project_id` for folder organisation). When `project_id` is supplied in the POST body, the view additionally verifies that the caller is an active member of that project before generating the presigned URL.

#### UserAssetEndpoint / UserServerAssetEndpoint -- KEPT AS-IS

No workspace context in URL (`assets/user-assets/`). Uses `[TokenHasScopeIfOAuth]` only.

### `plane/api/views/work_item_search.py`

#### WorkItemAdvancedSearchEndpoint

| Method | URL Pattern                                                  | Old Permission             | New Permission                                                                                | Differences                                            |
| ------ | ------------------------------------------------------------ | -------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `post` | `POST /api/v1/workspaces/<slug>/work-items/advanced-search/` | `WorkSpaceAdminPermission` | `@can(WorkitemPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped; inline `accessible_to()` filter kept |

---

## Batch 5: EE Features + Properties

### `plane/api/views/initiative.py`

**`permission_classes`** includes `InitiativesFeatureFlagPermission`.

#### InitiativeViewSet

| Method           | URL Pattern                                                            | Old Permission             | New Permission                                                                                    | Differences                                 |
| ---------------- | ---------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `list`           | `GET /api/v1/workspaces/<slug>/initiatives/`                           | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped                            |
| `create`         | `POST /api/v1/workspaces/<slug>/initiatives/`                          | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.CREATE, resource_param="workspace_id", scope_param_type="workspace")` | Tightened: member (15) can no longer create |
| `retrieve`       | `GET /api/v1/workspaces/<slug>/initiatives/<pk>/`                      | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.VIEW, resource_param="pk")`                                           | Detail-level VIEW                           |
| `partial_update` | `PATCH /api/v1/workspaces/<slug>/initiatives/<pk>/`                    | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.EDIT, resource_param="pk")`                                           | Detail-level EDIT                           |
| `destroy`        | `DELETE /api/v1/workspaces/<slug>/initiatives/<pk>/`                   | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.DELETE, resource_param="pk")`                                         | Detail-level DELETE                         |
| `get_labels`     | `GET /api/v1/workspaces/<slug>/initiatives/<initiative_id>/labels/`    | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.VIEW, resource_param="initiative_id")`                                | Initiative-level VIEW                       |
| `add_labels`     | `POST /api/v1/workspaces/<slug>/initiatives/<initiative_id>/labels/`   | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.EDIT, resource_param="initiative_id")`                                | Initiative-level EDIT                       |
| `remove_labels`  | `DELETE /api/v1/workspaces/<slug>/initiatives/<initiative_id>/labels/` | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.EDIT, resource_param="initiative_id")`                                | Initiative-level EDIT                       |

#### InitiativeEpicsViewSet

| Method         | URL Pattern                                                           | Old Permission             | New Permission                                                     | Differences           |
| -------------- | --------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------ | --------------------- |
| `get_epics`    | `GET /api/v1/workspaces/<slug>/initiatives/<initiative_id>/epics/`    | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.VIEW, resource_param="initiative_id")` | Initiative-level VIEW |
| `add_epics`    | `POST /api/v1/workspaces/<slug>/initiatives/<initiative_id>/epics/`   | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.EDIT, resource_param="initiative_id")` | Initiative-level EDIT |
| `remove_epics` | `DELETE /api/v1/workspaces/<slug>/initiatives/<initiative_id>/epics/` | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.EDIT, resource_param="initiative_id")` | Initiative-level EDIT |

#### InitiativeProjectsViewSet

| Method            | URL Pattern                                                              | Old Permission             | New Permission                                                     | Differences           |
| ----------------- | ------------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------ | --------------------- |
| `get_projects`    | `GET /api/v1/workspaces/<slug>/initiatives/<initiative_id>/projects/`    | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.VIEW, resource_param="initiative_id")` | Initiative-level VIEW |
| `add_projects`    | `POST /api/v1/workspaces/<slug>/initiatives/<initiative_id>/projects/`   | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.EDIT, resource_param="initiative_id")` | Initiative-level EDIT |
| `remove_projects` | `DELETE /api/v1/workspaces/<slug>/initiatives/<initiative_id>/projects/` | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.EDIT, resource_param="initiative_id")` | Initiative-level EDIT |

#### InitiativeLabelViewSet

| Method           | URL Pattern                                                 | Old Permission             | New Permission                                                                                  | Differences                                |
| ---------------- | ----------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `list`           | `GET /api/v1/workspaces/<slug>/initiatives/labels/`         | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped                           |
| `create`         | `POST /api/v1/workspaces/<slug>/initiatives/labels/`        | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.EDIT, resource_param="workspace_id", scope_param_type="workspace")` | Creating label = editing initiative config |
| `retrieve`       | `GET /api/v1/workspaces/<slug>/initiatives/labels/<pk>/`    | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.VIEW, resource_param="pk")`                                         | Detail-level VIEW                          |
| `partial_update` | `PATCH /api/v1/workspaces/<slug>/initiatives/labels/<pk>/`  | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.EDIT, resource_param="pk")`                                         | Detail-level EDIT                          |
| `destroy`        | `DELETE /api/v1/workspaces/<slug>/initiatives/labels/<pk>/` | `WorkSpaceAdminPermission` | `@can(InitiativePermissions.EDIT, resource_param="pk")`                                         | Detail-level EDIT                          |

### `plane/api/views/teamspace.py`

**`permission_classes`** includes `TeamspaceFeatureFlagPermission`.

#### TeamspaceViewSet

| Method           | URL Pattern                                         | Old Permission             | New Permission                                                                                   | Differences         |
| ---------------- | --------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ | ------------------- |
| `list`           | `GET /api/v1/workspaces/<slug>/teamspaces/`         | `WorkSpaceAdminPermission` | `@can(TeamspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped    |
| `create`         | `POST /api/v1/workspaces/<slug>/teamspaces/`        | `WorkSpaceAdminPermission` | `@can(TeamspacePermissions.CREATE, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped    |
| `retrieve`       | `GET /api/v1/workspaces/<slug>/teamspaces/<pk>/`    | `WorkSpaceAdminPermission` | `@can(TeamspacePermissions.VIEW, resource_param="pk")`                                           | Detail-level VIEW   |
| `partial_update` | `PATCH /api/v1/workspaces/<slug>/teamspaces/<pk>/`  | `WorkSpaceAdminPermission` | `@can(TeamspacePermissions.EDIT, resource_param="pk")`                                           | Detail-level EDIT   |
| `destroy`        | `DELETE /api/v1/workspaces/<slug>/teamspaces/<pk>/` | `WorkSpaceAdminPermission` | `@can(TeamspacePermissions.DELETE, resource_param="pk")`                                         | Detail-level DELETE |

#### TeamspaceProjectViewSet

| Method            | URL Pattern                                                            | Old Permission             | New Permission                                                   | Differences          |
| ----------------- | ---------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------- | -------------------- |
| `get_projects`    | `GET /api/v1/workspaces/<slug>/teamspaces/<teamspace_id>/projects/`    | `WorkSpaceAdminPermission` | `@can(TeamspacePermissions.VIEW, resource_param="teamspace_id")` | Teamspace-level VIEW |
| `add_projects`    | `POST /api/v1/workspaces/<slug>/teamspaces/<teamspace_id>/projects/`   | `WorkSpaceAdminPermission` | `@can(TeamspacePermissions.EDIT, resource_param="teamspace_id")` | Teamspace-level EDIT |
| `remove_projects` | `DELETE /api/v1/workspaces/<slug>/teamspaces/<teamspace_id>/projects/` | `WorkSpaceAdminPermission` | `@can(TeamspacePermissions.EDIT, resource_param="teamspace_id")` | Teamspace-level EDIT |

#### TeamspaceMemberViewSet

| Method           | URL Pattern                                                           | Old Permission             | New Permission                                                   | Differences          |
| ---------------- | --------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------- | -------------------- |
| `get_members`    | `GET /api/v1/workspaces/<slug>/teamspaces/<teamspace_id>/members/`    | `WorkSpaceAdminPermission` | `@can(TeamspacePermissions.VIEW, resource_param="teamspace_id")` | Teamspace-level VIEW |
| `add_members`    | `POST /api/v1/workspaces/<slug>/teamspaces/<teamspace_id>/members/`   | `WorkSpaceAdminPermission` | `@can(TeamspacePermissions.EDIT, resource_param="teamspace_id")` | Teamspace-level EDIT |
| `remove_members` | `DELETE /api/v1/workspaces/<slug>/teamspaces/<teamspace_id>/members/` | `WorkSpaceAdminPermission` | `@can(TeamspacePermissions.EDIT, resource_param="teamspace_id")` | Teamspace-level EDIT |

### `plane/api/views/milestone.py`

#### MilestoneViewSet

| Method     | URL Pattern                                                                         | Old Permission            | New Permission                                                     | Differences               |
| ---------- | ----------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------ | ------------------------- |
| `list`     | `GET /api/v1/workspaces/<slug>/projects/<project_id>/milestones/`                   | `ProjectEntityPermission` | `@can(MilestonePermissions.VIEW, resource_param="project_id")`     | Checks `milestone:view`   |
| `create`   | `POST /api/v1/workspaces/<slug>/projects/<project_id>/milestones/`                  | `ProjectEntityPermission` | `@can(MilestonePermissions.CREATE, resource_param="project_id")`   | Checks `milestone:create` |
| `retrieve` | `GET /api/v1/workspaces/<slug>/projects/<project_id>/milestones/<milestone_id>/`    | `ProjectEntityPermission` | `@can(MilestonePermissions.VIEW, resource_param="milestone_id")`   | Detail-level VIEW         |
| `patch`    | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/milestones/<milestone_id>/`  | `ProjectEntityPermission` | `@can(MilestonePermissions.EDIT, resource_param="milestone_id")`   | Detail-level EDIT         |
| `destroy`  | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/milestones/<milestone_id>/` | `ProjectEntityPermission` | `@can(MilestonePermissions.DELETE, resource_param="milestone_id")` | Detail-level DELETE       |

#### MilestoneWorkItemsViewSet

| Method              | URL Pattern                                                                                    | Old Permission            | New Permission                                                   | Differences          |
| ------------------- | ---------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------- | -------------------- |
| `list`              | `GET /api/v1/workspaces/<slug>/projects/<project_id>/milestones/<milestone_id>/work-items/`    | `ProjectEntityPermission` | `@can(MilestonePermissions.VIEW, resource_param="milestone_id")` | Milestone-level VIEW |
| `add_work_items`    | `POST /api/v1/workspaces/<slug>/projects/<project_id>/milestones/<milestone_id>/work-items/`   | `ProjectEntityPermission` | `@can(MilestonePermissions.EDIT, resource_param="milestone_id")` | Milestone-level EDIT |
| `remove_work_items` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/milestones/<milestone_id>/work-items/` | `ProjectEntityPermission` | `@can(MilestonePermissions.EDIT, resource_param="milestone_id")` | Milestone-level EDIT |

### `plane/api/views/customer.py`

All customer endpoints: `WorkSpaceAdminPermission` replaced with `@can(CustomerPermissions.*, resource_param="workspace_id", scope_param_type="workspace")`. Tightened: workspace member (15) can no longer access customer data.

#### CustomerAPIEndpoint

| Method | URL Pattern                                 | Old Permission             | New Permission                                                                                  | Differences      |
| ------ | ------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/customers/`  | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped |
| `post` | `POST /api/v1/workspaces/<slug>/customers/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.CREATE, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped |

#### CustomerDetailAPIEndpoint

| Method   | URL Pattern                                        | Old Permission             | New Permission                                                                                  | Differences      |
| -------- | -------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/customers/<pk>/`    | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/customers/<pk>/`  | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.EDIT, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped |
| `delete` | `DELETE /api/v1/workspaces/<slug>/customers/<pk>/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.DELETE, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped |

#### CustomerRequestAPIEndpoint

| Method | URL Pattern                                                        | Old Permission             | New Permission                                                                                  | Differences      |
| ------ | ------------------------------------------------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/customers/<customer_id>/requests/`  | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped |
| `post` | `POST /api/v1/workspaces/<slug>/customers/<customer_id>/requests/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.CREATE, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped |

#### CustomerRequestDetailAPIEndpoint

| Method   | URL Pattern                                                               | Old Permission             | New Permission                                                                                  | Differences      |
| -------- | ------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/customers/<customer_id>/requests/<pk>/`    | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/customers/<customer_id>/requests/<pk>/`  | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.EDIT, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped |
| `delete` | `DELETE /api/v1/workspaces/<slug>/customers/<customer_id>/requests/<pk>/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.DELETE, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped |

#### CustomerIssuesAPIEndpoint

| Method | URL Pattern                                                      | Old Permission             | New Permission                                                                                | Differences                 |
| ------ | ---------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------- | --------------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/customers/<customer_id>/issues/`  | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped            |
| `post` | `POST /api/v1/workspaces/<slug>/customers/<customer_id>/issues/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.EDIT, resource_param="workspace_id", scope_param_type="workspace")` | Linking issues = edit-level |

#### CustomerIssueDetailAPIEndpoint

| Method   | URL Pattern                                                                   | Old Permission             | New Permission                                                                                | Differences                   |
| -------- | ----------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------- |
| `delete` | `DELETE /api/v1/workspaces/<slug>/customers/<customer_id>/issues/<issue_id>/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.EDIT, resource_param="workspace_id", scope_param_type="workspace")` | Unlinking issues = edit-level |

#### CustomerPropertiesAPIEndpoint

| Method | URL Pattern                                           | Old Permission             | New Permission                                                                                  | Differences      |
| ------ | ----------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/customer-properties/`  | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped |
| `post` | `POST /api/v1/workspaces/<slug>/customer-properties/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.CREATE, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped |

#### CustomerPropertyDetailAPIEndpoint

| Method   | URL Pattern                                                  | Old Permission             | New Permission                                                                                  | Differences      |
| -------- | ------------------------------------------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/customer-properties/<pk>/`    | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/customer-properties/<pk>/`  | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.EDIT, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped |
| `delete` | `DELETE /api/v1/workspaces/<slug>/customer-properties/<pk>/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.DELETE, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped |

#### CustomerPropertyValuesAPIEndpoint

| Method | URL Pattern                                                               | Old Permission             | New Permission                                                                                  | Differences      |
| ------ | ------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/customers/<customer_id>/property-values/`  | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")`   | Workspace-scoped |
| `post` | `POST /api/v1/workspaces/<slug>/customers/<customer_id>/property-values/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.CREATE, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped |

#### CustomerPropertyValueDetailAPIEndpoint

| Method  | URL Pattern                                                                              | Old Permission             | New Permission                                                                                | Differences      |
| ------- | ---------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------- | ---------------- |
| `get`   | `GET /api/v1/workspaces/<slug>/customers/<customer_id>/property-values/<property_id>/`   | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped |
| `patch` | `PATCH /api/v1/workspaces/<slug>/customers/<customer_id>/property-values/<property_id>/` | `WorkSpaceAdminPermission` | `@can(CustomerPermissions.EDIT, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped |

### `plane/api/views/intake.py`

#### IntakeIssueListCreateAPIEndpoint

| Method | URL Pattern                                                           | Old Permission            | New Permission                                                                     | Differences                                     |
| ------ | --------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/intake-issues/`  | `ProjectEntityPermission` | `@can(IntakePermissions.VIEW, resource_param="project_id", defer_conditions=True)` | Guest/Commenter: `intake:view+creator` deferred |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/intake-issues/` | `ProjectEntityPermission` | `@can(IntakePermissions.SUBMIT, resource_param="project_id")`                      | Checks `intake:submit`                          |

#### IntakeIssueDetailAPIEndpoint

| Method   | URL Pattern                                                                        | Old Permission            | New Permission                                                | Differences          |
| -------- | ---------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------- | -------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/intake-issues/<issue_id>/`    | `ProjectEntityPermission` | `@can(IntakePermissions.VIEW, resource_param="project_id")`   | Project-level VIEW   |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/intake-issues/<issue_id>/`  | `ProjectEntityPermission` | `@can(IntakePermissions.EDIT, resource_param="project_id")`   | Project-level EDIT   |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/intake-issues/<issue_id>/` | `ProjectEntityPermission` | `@can(IntakePermissions.DELETE, resource_param="project_id")` | Project-level DELETE |

### `plane/api/views/issue_type.py`

#### IssueTypeListCreateAPIEndpoint

| Method | URL Pattern                                                             | Old Permission            | New Permission                                                       | Differences                    |
| ------ | ----------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------- | ------------------------------ |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-item-types/`  | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.VIEW, resource_param="project_id")`   | Checks `issue_property:view`   |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/work-item-types/` | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.CREATE, resource_param="project_id")` | Checks `issue_property:create` |

#### IssueTypeDetailAPIEndpoint

| Method   | URL Pattern                                                                         | Old Permission            | New Permission                                                       | Differences                    |
| -------- | ----------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------- | ------------------------------ |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-item-types/<type_id>/`    | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.VIEW, resource_param="project_id")`   | Checks `issue_property:view`   |
| `patch`  | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/work-item-types/<type_id>/`  | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.EDIT, resource_param="project_id")`   | Checks `issue_property:edit`   |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/work-item-types/<type_id>/` | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.DELETE, resource_param="project_id")` | Checks `issue_property:delete` |

### `plane/api/views/work_item_property.py`

#### IssuePropertyListCreateAPIEndpoint

| Method | URL Pattern                                                                                            | Old Permission            | New Permission                                                       | Differences                    |
| ------ | ------------------------------------------------------------------------------------------------------ | ------------------------- | -------------------------------------------------------------------- | ------------------------------ |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-item-types/<type_id>/work-item-properties/`  | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.VIEW, resource_param="project_id")`   | Checks `issue_property:view`   |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/work-item-types/<type_id>/work-item-properties/` | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.CREATE, resource_param="project_id")` | Checks `issue_property:create` |

#### IssuePropertyDetailAPIEndpoint

| Method   | URL Pattern                                              | Old Permission            | New Permission                                                       | Differences                    |
| -------- | -------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------- | ------------------------------ |
| `get`    | `GET /api/v1/.../work-item-properties/<property_id>/`    | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.VIEW, resource_param="project_id")`   | Checks `issue_property:view`   |
| `patch`  | `PATCH /api/v1/.../work-item-properties/<property_id>/`  | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.EDIT, resource_param="project_id")`   | Checks `issue_property:edit`   |
| `delete` | `DELETE /api/v1/.../work-item-properties/<property_id>/` | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.DELETE, resource_param="project_id")` | Checks `issue_property:delete` |

### `plane/api/views/work_item_property_option.py`

#### IssuePropertyOptionListCreateAPIEndpoint

| Method | URL Pattern                                                                                        | Old Permission            | New Permission                                                       | Differences                    |
| ------ | -------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------- | ------------------------------ |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-item-properties/<property_id>/options/`  | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.VIEW, resource_param="project_id")`   | Checks `issue_property:view`   |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/work-item-properties/<property_id>/options/` | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.CREATE, resource_param="project_id")` | Checks `issue_property:create` |

#### IssuePropertyOptionDetailAPIEndpoint

| Method   | URL Pattern                               | Old Permission            | New Permission                                                       | Differences                    |
| -------- | ----------------------------------------- | ------------------------- | -------------------------------------------------------------------- | ------------------------------ |
| `get`    | `GET /api/v1/.../options/<option_id>/`    | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.VIEW, resource_param="project_id")`   | Checks `issue_property:view`   |
| `patch`  | `PATCH /api/v1/.../options/<option_id>/`  | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.EDIT, resource_param="project_id")`   | Checks `issue_property:edit`   |
| `delete` | `DELETE /api/v1/.../options/<option_id>/` | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.DELETE, resource_param="project_id")` | Checks `issue_property:delete` |

### `plane/api/views/work_item_property_value.py`

#### IssuePropertyValueAPIEndpoint (deprecated)

| Method | URL Pattern                                                                 | Old Permission            | New Permission                                                | Differences            |
| ------ | --------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------- | ---------------------- |
| `get`  | `GET /api/v1/.../issues/<issue_id>/issue-properties/<property_id>/values/`  | `ProjectEntityPermission` | `@can(WorkitemPermissions.VIEW, resource_param="project_id")` | Checks `workitem:view` |
| `post` | `POST /api/v1/.../issues/<issue_id>/issue-properties/<property_id>/values/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Checks `workitem:edit` |

#### IssuePropertyValueListAPIEndpoint (deprecated)

| Method | URL Pattern                                                  | Old Permission            | New Permission                                                | Differences            |
| ------ | ------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------- | ---------------------- |
| `get`  | `GET /api/v1/.../issues/<issue_id>/issue-properties/values/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.VIEW, resource_param="project_id")` | Checks `workitem:view` |

#### WorkItemPropertyValueAPIEndpoint

| Method   | URL Pattern                                                                               | Old Permission            | New Permission                                                | Differences            |
| -------- | ----------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------- | ---------------------- |
| `get`    | `GET /api/v1/.../work-items/<work_item_id>/work-item-properties/<property_id>/values/`    | `ProjectEntityPermission` | `@can(WorkitemPermissions.VIEW, resource_param="project_id")` | Checks `workitem:view` |
| `post`   | `POST /api/v1/.../work-items/<work_item_id>/work-item-properties/<property_id>/values/`   | `ProjectEntityPermission` | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Checks `workitem:edit` |
| `patch`  | `PATCH /api/v1/.../work-items/<work_item_id>/work-item-properties/<property_id>/values/`  | `ProjectEntityPermission` | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Checks `workitem:edit` |
| `delete` | `DELETE /api/v1/.../work-items/<work_item_id>/work-item-properties/<property_id>/values/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Checks `workitem:edit` |

### `plane/api/views/work_item_properties.py`

#### WorkItemPropertiesAPIEndpoint

| Method  | URL Pattern                                                                         | Old Permission            | New Permission                                                | Differences            |
| ------- | ----------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------- | ---------------------- |
| `get`   | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<pk>/properties/`   | `ProjectEntityPermission` | `@can(WorkitemPermissions.VIEW, resource_param="project_id")` | Checks `workitem:view` |
| `patch` | `PATCH /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<pk>/properties/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.EDIT, resource_param="project_id")` | Checks `workitem:edit` |

### `plane/api/views/work_item_type_schema.py`

#### WorkItemTypeSchemaAPIEndpoint

| Method | URL Pattern                                                                   | Old Permission            | New Permission                                                     | Differences                  |
| ------ | ----------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------ | ---------------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-item-types/schema/` | `ProjectEntityPermission` | `@can(IssuePropertyPermissions.VIEW, resource_param="project_id")` | Checks `issue_property:view` |

### `plane/api/views/work_item_type_create.py`

#### WorkItemCreateAPIEndpoint

| Method | URL Pattern                                                               | Old Permission            | New Permission                                                  | Differences              |
| ------ | ------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------- | ------------------------ |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/work-items/create/` | `ProjectEntityPermission` | `@can(WorkitemPermissions.CREATE, resource_param="project_id")` | Checks `workitem:create` |

### `plane/api/views/project_page.py`

#### ProjectPageDetailAPIEndpoint

| Method | URL Pattern                                                       | Old Permission            | New Permission                                    | Differences       |
| ------ | ----------------------------------------------------------------- | ------------------------- | ------------------------------------------------- | ----------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/pages/<pk>/` | `ProjectEntityPermission` | `@can(PagePermissions.VIEW, resource_param="pk")` | Detail-level VIEW |

#### ProjectPageAPIEndpoint

| Method | URL Pattern                                                   | Old Permission            | New Permission                                              | Differences          |
| ------ | ------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------- | -------------------- |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/pages/` | `ProjectEntityPermission` | `@can(PagePermissions.CREATE, resource_param="project_id")` | Checks `page:create` |

#### PublishedPageDetailAPIEndpoint -- KEPT AS-IS

Uses `[IsAuthenticated]` only. Serves published content with no RBAC needed.

### `plane/api/views/workspace_page.py`

#### WorkspacePageDetailAPIEndpoint

| Method | URL Pattern                                 | Old Permission             | New Permission                                    | Differences       |
| ------ | ------------------------------------------- | -------------------------- | ------------------------------------------------- | ----------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/pages/<pk>/` | `WorkSpaceAdminPermission` | `@can(WikiPermissions.VIEW, resource_param="pk")` | Detail-level VIEW |

#### WorkspacePageAPIEndpoint

| Method | URL Pattern                             | Old Permission             | New Permission                                                                              | Differences      |
| ------ | --------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------- | ---------------- |
| `post` | `POST /api/v1/workspaces/<slug>/pages/` | `WorkSpaceAdminPermission` | `@can(WikiPermissions.CREATE, resource_param="workspace_id", scope_param_type="workspace")` | Workspace-scoped |

### `plane/api/views/work_item_page.py`

#### WorkItemPageListCreateAPIEndpoint

| Method | URL Pattern                                                                             | Old Permission            | New Permission                                              | Differences          |
| ------ | --------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------- | -------------------- |
| `get`  | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/pages/`  | `ProjectEntityPermission` | `@can(PagePermissions.VIEW, resource_param="project_id")`   | Checks `page:view`   |
| `post` | `POST /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/pages/` | `ProjectEntityPermission` | `@can(PagePermissions.CREATE, resource_param="project_id")` | Checks `page:create` |

#### WorkItemPageDetailAPIEndpoint

`pk` here is the `WorkItemPage` link-row id, not a Page id, so both methods gate at `resource_param="project_id"` (parent scope) and rely on `get_queryset()` to scope the link lookup. Using `pk` would make `@can` evaluate against the link uuid rather than a page, yielding incorrect allow/deny.

| Method   | URL Pattern                                                                                    | Old Permission            | New Permission                                              | Differences         |
| -------- | ---------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------- | ------------------- |
| `get`    | `GET /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/pages/<pk>/`    | `ProjectEntityPermission` | `@can(PagePermissions.VIEW, resource_param="project_id")`   | Detail-level VIEW   |
| `delete` | `DELETE /api/v1/workspaces/<slug>/projects/<project_id>/work-items/<work_item_id>/pages/<pk>/` | `ProjectEntityPermission` | `@can(PagePermissions.DELETE, resource_param="project_id")` | Detail-level DELETE |
