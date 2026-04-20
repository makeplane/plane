# View Decorator Migration Guide: Universal Comment, Reaction & Attachment Permissions

This guide covers migrating view decorators from parent-specific actions (`workitem:comment`, `epic:react`) to universal ones (`comment:create`, `workitem:react`), and removing `allow_creator=True` (now handled by conditional grants in roles).

## Backward Compatibility

The old `Action.COMMENT` grants on parent resources (`workitem:comment`, `epic:comment`, `wiki:comment`, `page:comment`) are **temporarily kept** in `system_roles.py` and `RESOURCE_ACTIONS` for backward compatibility with existing view decorators. After all views in this guide are migrated, these deprecated entries should be removed:

1. Remove `Action.COMMENT` from `RESOURCE_ACTIONS[WORKITEM]`, `RESOURCE_ACTIONS[EPIC]`, `RESOURCE_ACTIONS[WIKI]`, `RESOURCE_ACTIONS[PAGE]`
2. Remove `WorkitemPermissions.COMMENT`, `EpicPermissions.COMMENT` from contributor/commenter grants in `system_roles.py`

**Note**: `Action.REACT` on parent resources (WORKITEM, EPIC, COMMENT, PROJECT, INITIATIVE) is the **standard** approach — reactions are actions on parent resources, not a separate resource type. These entries stay permanently.

## Background

### What Changed

1. **Universal comment permission strings**: Comment operations now use their own resource-type actions instead of parent-specific ones:
   - `workitem:comment` / `epic:comment` → `comment:create`

2. **Reaction permissions on parent resources**: Reactions use `Action.REACT` on the parent resource (e.g., `workitem:react`, `epic:react`, `comment:react`, `project:react`). There is no separate `REACTION` resource type.

3. **Conditional grants replace `allow_creator`**: Contributor/commenter roles now have `comment:edit+creator` instead of unconditional `comment:edit`. The engine evaluates the `+creator` condition automatically — no need for `allow_creator=True` on the decorator.

4. **New `scope_param_type` parameter**: When `resource_param` points to a parent UUID (e.g., `issue_id` for comment permissions), use `scope_param_type` to tell the engine where to find the tuple.

### When to Use `scope_param_type`

| Scenario                | `resource_param` | `scope_param_type`      | Why                                                                        |
| ----------------------- | ---------------- | ----------------------- | -------------------------------------------------------------------------- |
| CREATE (on parent)      | `"issue_id"`     | `ResourceType.WORKITEM` | Tuple is on issue's project; engine needs to know `issue_id` is a workitem |
| EDIT/DELETE (on own pk) | `"pk"`           | Not needed              | Engine traverses from comment/reaction pk → issue → project                |
| LIST (on project)       | `"project_id"`   | Auto-detected           | `_id` suffix auto-detects parent lookup                                    |

**Rule of thumb**: Set `scope_param_type` when `resource_param` is a parent resource ID that the engine can't auto-detect (i.e., not `project_id` or `workspace_id`).

---

## Migration Tables

### Issue Comments (`plane/app/views/issue/comment.py`)

| Method                               | Current                                                                    | New                                                                                                  | Notes                                                                                |
| ------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `IssueCommentViewSet.list`           | `@can(IssuePermissions.VIEW, resource_param="issue_id")`                   | No change                                                                                            | VIEW stays on parent resource                                                        |
| `IssueCommentViewSet.retrieve`       | `@can(IssuePermissions.VIEW, resource_param="issue_id")`                   | No change                                                                                            |                                                                                      |
| `IssueCommentViewSet.create`         | `@can(IssuePermissions.COMMENT, resource_param="issue_id")`                | `@can(CommentPermissions.CREATE, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Universal `comment:create`; `scope_param_type` tells engine `issue_id` is a workitem |
| `IssueCommentViewSet.partial_update` | `@can(CommentPermissions.EDIT, resource_param="pk", allow_creator=True)`   | `@can(CommentPermissions.EDIT, resource_param="pk")`                                                 | Remove `allow_creator` — role has `comment:edit+creator`                             |
| `IssueCommentViewSet.destroy`        | `@can(CommentPermissions.DELETE, resource_param="pk", allow_creator=True)` | `@can(CommentPermissions.DELETE, resource_param="pk")`                                               | Remove `allow_creator` — role has `comment:delete+creator`                           |

**Comment Reactions** (in same file):

| Method                           | Current                                                       | New                                                           | Notes                     |
| -------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------- |
| `CommentReactionViewSet.list`    | `@can(IssuePermissions.VIEW, resource_param="project_id")`    | No change                                                     |                           |
| `CommentReactionViewSet.create`  | `@can(IssuePermissions.COMMENT, resource_param="project_id")` | `@can(CommentPermissions.REACT, resource_param="project_id")` | `comment:react` on parent |
| `CommentReactionViewSet.destroy` | `@can(IssuePermissions.COMMENT, resource_param="project_id")` | `@can(CommentPermissions.REACT, resource_param="project_id")` | `comment:react` on parent |

### Issue Reactions (`plane/app/views/issue/reaction.py`)

| Method                         | Current                                                   | New       | Notes                                       |
| ------------------------------ | --------------------------------------------------------- | --------- | ------------------------------------------- |
| `IssueReactionViewSet.create`  | `@can(IssuePermissions.REACT, resource_param="issue_id")` | No change | `workitem:react` is the standard permission |
| `IssueReactionViewSet.destroy` | `@can(IssuePermissions.REACT, resource_param="issue_id")` | No change | `workitem:react` is the standard permission |

### Issue Attachments (`plane/app/views/issue/attachment.py`)

| Method                             | Current                                                                       | New                                                                                                     | Notes                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `IssueAttachmentEndpoint.get`      | `@can(AttachmentPermissions.VIEW, resource_param="issue_id")`                 | `@can(AttachmentPermissions.VIEW, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)`   | Add `scope_param_type`                                        |
| `IssueAttachmentEndpoint.post`     | `@can(AttachmentPermissions.CREATE, resource_param="issue_id")`               | `@can(AttachmentPermissions.CREATE, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Add `scope_param_type`                                        |
| `IssueAttachmentEndpoint.delete`   | `@can(AttachmentPermissions.DELETE, resource_param="pk", allow_creator=True)` | `@can(AttachmentPermissions.DELETE, resource_param="pk")`                                               | Remove `allow_creator` — role has `attachment:delete+creator` |
| `IssueAttachmentV2Endpoint.get`    | `@can(AttachmentPermissions.VIEW, resource_param="issue_id")`                 | `@can(AttachmentPermissions.VIEW, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)`   | Add `scope_param_type`                                        |
| `IssueAttachmentV2Endpoint.post`   | `@can(AttachmentPermissions.CREATE, resource_param="issue_id")`               | `@can(AttachmentPermissions.CREATE, resource_param="issue_id", scope_param_type=ResourceType.WORKITEM)` | Add `scope_param_type`                                        |
| `IssueAttachmentV2Endpoint.delete` | `@can(AttachmentPermissions.DELETE, resource_param="pk", allow_creator=True)` | `@can(AttachmentPermissions.DELETE, resource_param="pk")`                                               | Remove `allow_creator`                                        |
| `IssueAttachmentV2Endpoint.patch`  | `@can(AttachmentPermissions.EDIT, resource_param="pk")`                       | `@can(AttachmentPermissions.EDIT, resource_param="pk")`                                                 | No change — conditional grant handles edit-own                |

### Epic Comments (`plane/ee/views/app/epic/comment.py`)

| Method                              | Current                                                                    | New                                                                                             | Notes                                                 |
| ----------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `EpicCommentViewSet.create`         | `@can(EpicPermissions.COMMENT, resource_param="epic_id")`                  | `@can(CommentPermissions.CREATE, resource_param="epic_id", scope_param_type=ResourceType.EPIC)` | Universal `comment:create`; `scope_param_type` needed |
| `EpicCommentViewSet.partial_update` | `@can(CommentPermissions.EDIT, resource_param="pk", allow_creator=True)`   | `@can(CommentPermissions.EDIT, resource_param="pk")`                                            | Remove `allow_creator`                                |
| `EpicCommentViewSet.destroy`        | `@can(CommentPermissions.DELETE, resource_param="pk", allow_creator=True)` | `@can(CommentPermissions.DELETE, resource_param="pk")`                                          | Remove `allow_creator`                                |

### Epic Reactions (`plane/ee/views/app/epic/reaction.py`)

| Method                        | Current                                                 | New       | Notes                                   |
| ----------------------------- | ------------------------------------------------------- | --------- | --------------------------------------- |
| `EpicReactionViewSet.create`  | `@can(EpicPermissions.REACT, resource_param="epic_id")` | No change | `epic:react` is the standard permission |
| `EpicReactionViewSet.destroy` | `@can(EpicPermissions.REACT, resource_param="epic_id")` | No change | `epic:react` is the standard permission |

### Epic Attachments (`plane/ee/views/app/epic/attachment.py`)

| Method                          | Current                                                                       | New                                                                                                | Notes                                                     |
| ------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `EpicAttachmentEndpoint.get`    | `@can(EpicPermissions.VIEW, resource_param="epic_id")`                        | `@can(AttachmentPermissions.VIEW, resource_param="epic_id", scope_param_type=ResourceType.EPIC)`   | Universal `attachment:view`                               |
| `EpicAttachmentEndpoint.post`   | `@can(EpicPermissions.VIEW, resource_param="epic_id")`                        | `@can(AttachmentPermissions.CREATE, resource_param="epic_id", scope_param_type=ResourceType.EPIC)` | Fix: was using VIEW, should be CREATE                     |
| `EpicAttachmentEndpoint.delete` | `@can(AttachmentPermissions.DELETE, resource_param="pk", allow_creator=True)` | `@can(AttachmentPermissions.DELETE, resource_param="pk")`                                          | Remove `allow_creator`                                    |
| `EpicAttachmentEndpoint.patch`  | `@can(EpicPermissions.VIEW, resource_param="epic_id")`                        | `@can(AttachmentPermissions.EDIT, resource_param="pk")`                                            | Fix: was using epic VIEW, should be attachment EDIT on pk |

---

## Import Changes

When migrating, update imports in each file:

```python
# Before
from plane.permissions import IssuePermissions, EpicPermissions, CommentPermissions, AttachmentPermissions

# After (add ResourceType for scope_param_type)
from plane.permissions import (
    CommentPermissions,
    AttachmentPermissions,
    ResourceType,
)
```

Note: `IssuePermissions.REACT` and `EpicPermissions.REACT` are standard permissions for issue/epic reactions — no migration needed. `IssuePermissions.COMMENT` and `EpicPermissions.COMMENT` are deprecated and should be replaced with `CommentPermissions.CREATE`.

---

## `allow_creator` Removal (Completed)

All 22 `allow_creator=True` decorators across the codebase have been replaced with conditional grants in `system_roles.py`. The `allow_creator` parameter, `creator_resource_type` parameter, and `AllowCreatorPermission` DRF class have been removed from the permission engine entirely.

Creator-based permissions are now handled exclusively through:

- **Conditional grants**: `Permission & Condition.CREATOR` entries in `system_roles.py` (e.g., `WorkitemPermissions.DELETE & Condition.CREATOR` for contributor)
- **`creator_only=True`**: Decorator parameter for strict creator-only checks (used by view EDIT endpoints)

## Checklist

For each file:

- [x] Remove `allow_creator=True` from `@can` decorators (completed — all 22 removed)
- [ ] Update `@can` decorators per table above (comment/reaction/attachment migration)
- [ ] Update imports (add `ResourceType` if using `scope_param_type`)
- [ ] Remove unused imports (`IssuePermissions.COMMENT`, etc.)
- [ ] Run tests: `pytest -k "comment or reaction or attachment"`
- [ ] Verify `/permissions/me/` returns correct conditional strings
