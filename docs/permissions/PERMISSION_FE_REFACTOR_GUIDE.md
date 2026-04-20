# RBAC/GAC Frontend Permission System — Comprehensive Reference

This document is the **single source of truth** for all frontend permission work in Plane. It covers the permission string format, core stores, implementation patterns, UI conventions, and the role management system. Follow it exactly when implementing or refactoring any permission-related code.

> **Scope:** Frontend only. For backend migration details, see `PERMISSION_MIGRATION.md`, `PERMISSION_MATRIX.md`, and other docs in this directory.

---

## Table of Contents

1. [Permission String Format](#1-permission-string-format)
2. [Core Stores](#2-core-stores)
3. [Role System Migration](#3-role-system-migration)
4. [Store Decoupling Pattern](#4-store-decoupling-pattern)
5. [Instance-Based Permission Classes](#5-instance-based-permission-classes)
6. [Comment, Reaction & Sub-Entity Permission Classes](#6-comment-reaction--sub-entity-permission-classes)
7. [Update Permission Classes](#7-update-permission-classes)
8. [Flat Permission Types for Prop-Drilling](#8-flat-permission-types-for-prop-drilling)
9. [UI Implementation — Prop-Drilling Pattern](#9-ui-implementation--prop-drilling-pattern)
10. [Layout-Level Permission Patterns](#10-layout-level-permission-patterns)
11. [List Context vs Item Context](#11-list-context-vs-item-context)
12. [Quick Action Dropdown Components](#12-quick-action-dropdown-components)
13. [Replacing `disabled` Props](#13-replacing-disabled-props)
14. [Removing In-Component Store Access](#14-removing-in-component-store-access)
15. [Condition Context System](#15-condition-context-system)
16. [Access Control Hooks](#16-access-control-hooks)
17. [Archive vs Restore Guards](#17-archive-vs-restore-guards)
18. [Property-Level Permissions](#18-property-level-permissions)
19. [Default Permission Fallbacks](#19-default-permission-fallbacks)
20. [Incomplete Surfaces & TODO Areas](#20-incomplete-surfaces--todo-areas)
21. [Naming Conventions](#21-naming-conventions)
22. [Checklist Before Marking Feature Done](#22-checklist-before-marking-feature-done)
23. [File Reference Index](#23-file-reference-index)

---

## 1. Permission String Format

### Base Format

```
resource:action+condition1+condition2
```

- **resource** — the entity being acted on (e.g., `workitem`, `epic`, `comment`, `project`)
- **action** — what the user wants to do (e.g., `view`, `create`, `edit`, `delete`, `archive`, `react`)
- **condition** — optional, separated by `+`. Restricts the grant to specific conditions (e.g., `creator`, `lead`)

### Three Scopes

| Scope         | Resource Count | Examples                                                                                   |
| ------------- | -------------- | ------------------------------------------------------------------------------------------ |
| **Workspace** | 38             | `workspace`, `project`, `initiative`, `wiki`, `dashboard`, `customer`, `teamspace`         |
| **Teamspace** | 4              | `teamspace_workitem_view`, `teamspace_comment`, `teamspace_page`, `teamspace_page_comment` |
| **Project**   | 40             | `workitem`, `epic`, `comment`, `cycle`, `module`, `page`, `attachment`, `state`, `label`   |

### Two Conditions

| Condition | Meaning                                     |
| --------- | ------------------------------------------- |
| `creator` | Current user created this resource          |
| `lead`    | Current user is the lead (teamspace-scoped) |

### Wildcards

- `resource:*` — grants all actions for a specific resource (e.g., `workitem:*`)
- `*` — grants everything (global wildcard)

### Grant Resolution Cascade

When `can()` evaluates a permission, it checks grants in this order:

1. **Project-scoped grants** (if `projectId` is available)
2. **Teamspace-scoped grants** (if `teamspaceId` is available)
3. **Workspace-scoped grants** (always checked as fallback)

A grant at any level that matches the requested permission returns `true`.

### Conditional Permission Semantics

The **absence** of an unconditional grant combined with the **presence** of a conditional grant is the signal that the user can only perform the action under the specified condition.

**Admin response:**

```json
{
  "relation": "admin",
  "permission_grants": ["comment:edit", "comment:delete", "comment:react"]
}
```

Admin has `comment:edit` (unconditional) — can edit ANY comment.

**Contributor response:**

```json
{
  "relation": "contributor",
  "permission_grants": ["comment:edit+creator", "comment:delete+creator", "comment:react"]
}
```

Contributor has `comment:edit+creator` (conditional) — can edit only OWN comments.

| Role        | `comment:edit` | `comment:edit+creator` | Meaning                    |
| ----------- | -------------- | ---------------------- | -------------------------- |
| Admin       | present        | —                      | Can edit ANY comment       |
| Contributor | —              | present                | Can edit OWN comments only |
| Guest       | —              | —                      | Cannot edit comments       |

### Key Type Files

- `packages/types/src/permissions/resource-actions.ts` — all resources and their allowed actions
- `packages/types/src/permissions/conditions.ts` — `PERMISSION_CONDITIONS_BY_PERMISSION` map
- `packages/types/src/permissions/permission-strings.ts` — `PermissionString` and `PermissionGrantString` types
- `packages/types/src/permissions/permission-check.ts` — `PermissionCheckArgs` type

---

## 2. Core Stores

### PermissionAccessStore

**File:** `apps/web/core/store/permission-access.store.ts`

The runtime access-evaluation store for the current user. This is the **single entry point** for all permission checks.

**Observable state:**

- `workspacePermissionsMap: Map<string, CurrentUserPermissionState>` — keyed by workspace slug
- `projectPermissionsMap: Map<string, CurrentUserPermissionState>` — keyed by project ID
- `teamspacePermissionsMap: Map<string, CurrentUserPermissionState>` — keyed by teamspace ID

**Core method:**

```ts
can(args: PermissionCheckArgs): boolean
```

Uses `computedFn` for memoization. Evaluates grants in cascade order (project → teamspace → workspace). Uses `buildPermissionString()` and `matchesPermissionGrant()` utilities from `@plane/utils`.

**Other methods:**

```ts
getCurrentUserWorkspaceRelation(workspaceSlug: string): string | undefined;
getCurrentUserProjectRelation(projectId: string): string | undefined;
getCurrentUserTeamspaceRelation(teamspaceId: string): string | undefined;
fetchCurrentUserWorkspacePermissions(workspaceSlug: string): Promise<void>;
hydrateProjectPermissionsFromEntities(entities: TPermissionHydrationEntity[]): void;
hydrateTeamspacePermissionsFromEntities(entities: TPermissionHydrationEntity[]): void;
```

**Hydration:** When the API returns entities with embedded `_permissions` metadata, use the hydration methods to bulk-load project/teamspace permissions without separate API calls.

### RoleManagementStore

**File:** `apps/web/core/store/role-management.store.ts`

Manages role definitions (CRUD). Does NOT evaluate access — that's the PermissionAccessStore's job.

**Observable state:**

- `rolesMap: Map<string, PermissionRole>` — all roles by ID
- `workspaceRoleIdsMap: Map<string, string[]>` — role IDs per workspace (workspace namespace)
- `projectRoleIdsMap: Map<string, string[]>` — role IDs per workspace (project namespace)
- `roleIdToNamespaceMap: Map<string, PermissionNamespace>` — maps role ID to namespace

**Key methods:**

```ts
getRoleDetailsByRoleSlug(args: { workspaceSlug, roleSlug, namespace }): PermissionRole | undefined;
getRoleDetailsByRoleId(roleId: string): PermissionRole | undefined;
getRoleNamespaceByRoleId(roleId: string): PermissionNamespace | undefined;
fetchAllWorkspaceRoles(workspaceSlug: string): Promise<void>;
createRole(args: { workspaceSlug, data }): Promise<void>;
updateRole(args: { workspaceSlug, roleId, data }): Promise<void>;
deleteRole(args: { workspaceSlug, roleId }): Promise<void>;
```

**Namespaces:** Currently supports `"workspace"` and `"project"`. `"teamspace"` is eval-only (not yet in role management UI).

**Role data model:**

```ts
type PermissionRole = {
  id: string;
  slug: string; // "admin", "member", or custom slug
  name: string;
  description: string;
  is_system: boolean; // true for predefined roles
  level: number;
  permissions: Partial<Record<PermissionGrantString, true>>;
  sort_order: number;
};
```

### OLD UserPermissionStore (DEPRECATED)

**File:** `apps/web/core/store/user/permissions.store.ts`

> **Do NOT use in new code.** This store is being removed.

Uses the old `allowPermissions(roles[], level)` pattern with numeric role integers. All references must be migrated to `PermissionAccessStore.can()`.

---

## 3. Role System Migration

### Old System → New System

| Aspect              | Old                                                         | New                                                                       |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Identification**  | Numeric integers                                            | Slug strings                                                              |
| **Workspace roles** | 25=owner, 20=admin, 15=member, 5=guest                      | `"owner"`, `"admin"`, `"member"`, `"guest"`                               |
| **Project roles**   | 20=admin, 15=contributor, 10=commenter, 5=guest             | `"admin"`, `"contributor"`, `"commenter"`, `"guest"`                      |
| **Access check**    | `allowPermissions([20, 15], EUserPermissionsLevel.PROJECT)` | `can({ resource: "workitem", action: "edit", projectId, workspaceSlug })` |
| **Custom roles**    | Not supported                                               | Supported on enterprise plans                                             |
| **Comparison**      | `role >= 15` (ordinal)                                      | `can(...)` (grant-based)                                                  |

### Key Rules

- All code must use slug-based lookups via `getRoleDetailsByRoleSlug()` — never numeric comparisons
- System roles (`owner`, `admin`, `member`, `contributor`, `commenter`, `guest`) are predefined and immutable
- Custom roles can be created by workspace admins on enterprise plans with specific permission subsets
- Use `getCurrentUserWorkspaceRelation()` or `getCurrentUserProjectRelation()` when you need the role slug (e.g., to check if user is `"guest"`)

---

## 4. Store Decoupling Pattern

**Key principle:** New stores and permission classes do NOT take the root store as a constructor argument. They receive only what they need.

### Why

The old pattern coupled every store to the root store, creating circular dependencies and making testing difficult:

```ts
// OLD — avoid this
class EntityStore {
  constructor(private rootStore: RootStore) {
    // Has access to EVERYTHING
  }
}
```

### New Pattern

Pass only the specific methods needed:

```ts
// NEW — follow this
type EntityPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean; // from PermissionAccessStore
  getConditionContext: (id: string) => { creator: boolean }; // from parent entity store
  getAdditionalMeta: (id: string) => { isArchived: boolean };
};

class EntityPermissionsInstance {
  constructor(private args: EntityPermissionsArgs) {}
}
```

### Real Examples

**InitiativePermissionsInstance** — receives `can` + context getters:

```ts
// From apps/web/core/store/initiatives/permissions/root.ts
type InitiativePermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  getAttachmentConditionContext: (initiativeId: string, attachmentId: string) => { creator: boolean };
  getCommentConditionContext: (initiativeId: string, commentId: string) => { creator: boolean };
};
```

**WorkspaceViewPermissionsStore** — receives `can` + metadata getter:

```ts
// From apps/web/ee/store/workspace-views/permissions.ts
type WorkspaceViewPermissionsArgs = {
  can: IPermissionAccessStore["can"];
  getWorkspaceViewMetaById: (workspaceViewId: string) => WorkspaceViewMeta | undefined;
};
```

### Benefits

- Testable: mock only the specific functions needed
- No circular dependencies
- Clear contract of what each class requires

---

## 5. Instance-Based Permission Classes

### The Pattern

Every entity gets its own permission class at `apps/web/core/store/<entity>/permissions/root.ts`.

**Rules:**

- Constructor receives `can()` + context-specific getters — never the root store
- Use `computedFn` from `mobx-utils` for every getter that takes arguments
- Use MobX `computed` for zero-argument properties (e.g., `canCreate`)
- Every action the UI exposes gets its own named method — even if two actions share the same `can()` call today
- Property-level permissions use `getCanEditProperty(slug, id, property)` — delegates to `getCanEdit` for now, but provides a hook point for future granularity

### Template

```ts
import { computedFn } from "mobx-utils";
import type { PermissionCheckArgs } from "@plane/types";

export interface EntityPermissions {
  getCanView: (workspaceSlug: string, projectId: string) => boolean;
  getCanCreate: (workspaceSlug: string, projectId: string) => boolean;
  getCanEdit: (workspaceSlug: string, projectId: string, entityId: string) => boolean;
  getCanDelete: (workspaceSlug: string, projectId: string, entityId: string) => boolean;
  // ... every action the UI exposes
}

type EntityPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  getEntityConditionContext: (entityId: string) => { creator: boolean };
  getAdditionalMeta: (entityId: string) => { isArchived: boolean };
};

export class EntityPermissionsInstance implements EntityPermissions {
  constructor(private args: EntityPermissionsArgs) {}

  getCanView: EntityPermissions["getCanView"] = computedFn((workspaceSlug, projectId) =>
    this.args.can({ resource: "entity", action: "view", projectId, workspaceSlug })
  );

  getCanCreate: EntityPermissions["getCanCreate"] = computedFn((workspaceSlug, projectId) =>
    this.args.can({ resource: "entity", action: "create", projectId, workspaceSlug })
  );

  getCanEdit: EntityPermissions["getCanEdit"] = computedFn((workspaceSlug, projectId, entityId) => {
    const { isArchived } = this.args.getAdditionalMeta(entityId);
    return (
      !isArchived &&
      this.args.can({
        resource: "entity",
        action: "edit",
        projectId,
        workspaceSlug,
        resourceMeta: {
          resourceId: entityId,
          conditionContext: this.args.getEntityConditionContext(entityId),
        },
      })
    );
  });
}
```

### Real Implementation: WorkItemPermissionsInstance

**File:** `apps/web/core/store/work-items/permissions/root.ts`

This is the reference implementation. Key points:

- **Every sub-action is named separately** even when delegating: `getCanAddSubWorkItems`, `getCanAddDependencies`, `getCanAddRelations`, `getCanAddLinks`, `getCanAddAttachments`, `getCanAddPages`, `getCanAddCustomerRequests` — all delegate to `getCanEdit` today
- **`getCanEditProperty`** takes a `property: TWorkItemProperty` parameter — delegates to `getCanEdit` now, but provides the hook for per-property permissions later
- **`getCanDuplicate`** delegates to `getCanCreate` (not `getCanEdit`)
- **`getCommentPermissions`** returns a new `WorkItemCommentPermissionsInstance` (see [Section 6](#6-comment-reaction--sub-entity-permission-classes))

### Real Implementation: InitiativePermissionsInstance

**File:** `apps/web/core/store/initiatives/permissions/root.ts`

Shows the workspace-scoped pattern (no `projectId`):

- Constructor args: `can`, `getAttachmentConditionContext`, `getCommentConditionContext`
- Workspace-only methods: `getCanView(workspaceSlug)`, `getCanCreate(workspaceSlug)`
- Instance-scoped methods: `getCanEdit(workspaceSlug, initiativeId)`
- Sub-entity instances: `getLabelPermissions(workspaceSlug)`, `getCommentPermissions(workspaceSlug, initiativeId)`

### Real Implementation: WorkspaceViewPermissionsStore

**File:** `apps/web/ee/store/workspace-views/permissions.ts`

Shows a simpler pattern with a private helper to reduce duplication:

```ts
private checkWorkspaceViewPermission = computedFn((workspaceViewId: string, action: "edit" | "delete") => {
  const meta = this.args.getWorkspaceViewMetaById(workspaceViewId);
  if (!meta) return false;
  return this.args.can({
    resource: "workspace_workitem_view",
    action,
    workspaceSlug: meta.workspaceSlug,
    resourceMeta: { resourceId: workspaceViewId, conditionContext: meta.conditionContext },
  });
});
```

---

## 6. Comment, Reaction & Sub-Entity Permission Classes

### Comment Permission Class

**File:** `apps/web/core/store/work-items/permissions/comment.ts`

Comments get their own permission class that is instantiated by the parent entity's `getCommentPermissions` method.

```ts
export interface WorkItemCommentPermissions {
  canCreate: boolean; // MobX computed property
  getCanEdit: (commentId: string) => boolean; // computedFn
  getCanDelete: (commentId: string) => boolean;
  getCanReact: (commentId: string) => boolean;
}

export type WorkItemCommentPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
  projectId: string;
  isWorkItemArchived: boolean; // parent entity's archive state
  getCommentConditionContext: (commentId: string) => { creator: boolean };
};
```

**Key patterns:**

- `canCreate` is a MobX `computed` property (zero args — uses `makeObservable` with `{ canCreate: computed }`)
- `getCanEdit`, `getCanDelete`, `getCanReact` are `computedFn` methods (take `commentId`)
- `canCreate` and `getCanEdit` are guarded by `!this.args.isWorkItemArchived`

> **CRITICAL:** The archive guard on comment `getCanEdit` must be `!isWorkItemArchived`. Writing `isWorkItemArchived &&` instead of `!isWorkItemArchived &&` is a **silent bug** that inverts the guard — allowing editing only on archived entities.

### Inheritance

`EpicCommentPermissionsInstance` extends `WorkItemCommentPermissionsInstance`:

```ts
// From apps/web/core/store/work-items/epic/permissions/comment.ts
export class EpicCommentPermissionsInstance extends WorkItemCommentPermissionsInstance {
  constructor(args: EpicCommentPermissionsArgs) {
    super(args);
  }
}
```

Most subclasses add zero custom implementation — just type alias + constructor.

### How Parent Creates Comment Instances

```ts
// From WorkItemPermissionsInstance
getCommentPermissions = computedFn((workspaceSlug, projectId, workItemId) => {
  const additionalMeta = this.args.getAdditionalWorkItemPermissionMeta(workItemId);
  return new WorkItemCommentPermissionsInstance({
    can: this.args.can,
    workspaceSlug,
    projectId,
    isWorkItemArchived: additionalMeta.isArchived,
    getCommentConditionContext: (commentId) => this.args.getWorkItemCommentConditionContext(workItemId, commentId),
  });
});
```

### Reaction Permissions

Reactions use the parent resource's `react` action:

- Work item reactions: `workitem:react`
- Epic reactions: `epic:react`
- Comment reactions: `comment:react`
- Initiative reactions: `initiative:react`
- Project reactions: `project:react`

No conditional check needed for reactions — the view layer filters to own reactions.

---

## 7. Update Permission Classes

For entities with "updates" (epics, projects, cycles), a dedicated `UpdatePermissionsInstance` handles update CRUD and nests comment permissions within the update context.

**Files:**

- `apps/web/core/store/work-items/epic/permissions/updates/root.ts` — `EpicUpdatePermissionsInstance`
- `apps/web/core/store/work-items/epic/permissions/updates/comment.ts` — `EpicUpdateCommentPermissionsInstance`

**Pattern:**

```ts
getUpdatePermissions = computedFn((workspaceSlug, projectId, epicId) => {
  const additionalMeta = this.args.getEpicAdditionalMeta(epicId);
  return new EpicUpdatePermissionsInstance({
    can: this.args.can,
    workspaceSlug,
    projectId,
    isEpicArchived: additionalMeta.isArchived,
    getUpdateConditionContext: (updateId) => this.args.getEpicUpdateConditionContext(epicId, updateId),
    getUpdateCommentConditionContext: (updateId, commentId) =>
      this.args.getEpicUpdateCommentConditionContext(epicId, updateId, commentId),
  });
});
```

The update instance itself exposes `getCommentPermissions(updateId)` which returns yet another comment permissions instance scoped to that specific update.

---

## 8. Flat Permission Types for Prop-Drilling

Every permission file co-locates flat type definitions that describe the shape of the permission object passed to UI components. These are **plain objects**, not class instances.

### Detail/Peek View Type

```ts
// From apps/web/core/store/initiatives/permissions/root.ts
export type TInitiativeDetailPermissions = {
  canEdit: boolean;
  canDelete: boolean;
  canReact: boolean;
  canEditProperty: (property: TInitiativeProperty) => boolean;
  canAddLink: boolean;
  canEditLink: boolean;
  canDeleteLink: boolean;
  canAddAttachment: boolean;
  canDeleteAttachment: (attachmentId: string) => boolean;
  canAddScope: boolean;
  canAddProject: boolean;
  canRemoveProject: boolean;
  canAddEpic: boolean;
  canRemoveEpic: boolean;
  labels: {
    canCreate: boolean;
    canEdit: (labelId: string) => boolean;
    canDelete: (labelId: string) => boolean;
    canReorder: (labelId: string) => boolean;
  };
  comments: {
    canCreate: boolean;
    canEdit: (commentId: string) => boolean;
    canDelete: (commentId: string) => boolean;
    canReact: (commentId: string) => boolean;
  };
};
```

### List/Board Item Type

```ts
// From apps/web/core/store/initiatives/permissions/root.ts
export type TInitiativeItemPermissions = {
  canEditProperty: (property: TInitiativeProperty) => boolean;
  canDragAndDrop: boolean;
  quickActions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};
```

### Convention

- Define flat types in the **same file** as the permission class
- Use `TEntityDetailPermissions` for detail/peek views
- Use `TEntityItemPermissions` for list/board items
- Never include class instance types in these definitions

---

## 9. UI Implementation — Prop-Drilling Pattern

### Golden Rule

Assemble ALL permissions at the **root component**, convert to a **flat plain object**, and **prop-drill downward**. Never pass permission class instances as props.

### The Pattern

```
Root Component (route-level or peek-overview)
  ├── Gets permission instance from store hook
  ├── Gets sub-entity instances locally (commentPerms, labelPerms, etc.)
  ├── Assembles flat permission object
  └── Passes to child as `permissions` prop
      └── Child receives plain object, never calls store
```

### Reference Implementation: InitiativePeekOverview

**File:** `apps/web/core/components/initiatives/peek-overview/root.tsx`

```tsx
const InitiativePeekOverview = observer(() => {
  const {
    initiative: { peekInitiative, permissions },
  } = useInitiatives();

  // Get instances locally — never pass these as props
  const labelPerms = permissions.getLabelPermissions(peekInitiative.workspaceSlug);
  const commentPerms = permissions.getCommentPermissions(peekInitiative.workspaceSlug, peekInitiative.initiativeId);

  const peekPermissions: TInitiativeDetailPermissions = {
    // Initiative-level
    canEdit: permissions.getCanEdit(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canDelete: permissions.getCanDelete(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canReact: permissions.getCanReact(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canEditProperty: (property) =>
      permissions.getCanEditProperty(peekInitiative.workspaceSlug, peekInitiative.initiativeId, property),

    // Labels — plain object, NOT the instance
    labels: {
      canCreate: labelPerms.canCreate,
      canEdit: (labelId) => labelPerms.getCanEdit(labelId),
      canDelete: (labelId) => labelPerms.getCanDelete(labelId),
      canReorder: (labelId) => labelPerms.getCanReorder(labelId),
    },

    // Comments — plain object, NOT the instance
    comments: {
      canCreate: commentPerms.canCreate,
      canEdit: (commentId) => commentPerms.getCanEdit(commentId),
      canDelete: (commentId) => commentPerms.getCanDelete(commentId),
      canReact: (commentId) => commentPerms.getCanReact(commentId),
    },
  };

  return <InitiativeView permissions={peekPermissions} />;
});
```

### What NOT to Do

```tsx
// WRONG — never pass class instances as props
<ChildComponent permissions={permissionsClassInstance} />;

// WRONG — never call store methods in leaf/mid components
function LeafComponent() {
  const { permissions } = useIssues();
  const canEdit = permissions.getCanEdit(slug, projectId, issueId); // NO
}
```

---

## 10. Layout-Level Permission Patterns

Every layout (list, board, table, calendar) receives permissions from outside, split into exactly **two shapes**.

### Shape 1 — Layout-level permissions (creation, bulk ops)

```ts
permissions={{
  creation: {
    viaHeader: canCreate && !isConstraintActive,
    viaQuickAdd: canCreate && !isConstraintActive,
  },
  canPerformBulkOps: canPerformBulkOps && !isConstraintActive,
}}
```

### Shape 2 — Per-item permissions (inline editing, drag)

```ts
getWorkItemPermissions={(workItem) =>
  workItem.project_id
    ? {
        canEditProperty: (property) =>
          permissions.getCanEditProperty(workspaceSlug, workItem.project_id!, workItem.id, property),
        canDragAndDrop: !isConstraintActive &&
          permissions.getCanDragAndDrop(workspaceSlug, workItem.project_id, workItem.id),
      }
    : DEFAULT_WORK_ITEM_PERMISSIONS
}
```

### Constraint Folding

Constraints like `isCompletedCycle` must be folded **INTO** the permission objects before passing to layouts. Never pass raw constraint flags to layouts.

> **CRITICAL:** `isCompletedCycle` must be applied to BOTH `creation` permissions AND per-item `canEditProperty`/`canDragAndDrop`. Otherwise inline property editing remains unblocked in completed cycles.

### Mobile Calendar Override

Mobile views force `canDragAndDrop: false` while preserving `canEditProperty`:

```ts
getWorkItemPermissions={(workItem) => {
  const perms = getWorkItemPermissions(workItem);
  return { canEditProperty: perms.canEditProperty, canDragAndDrop: false };
}}
```

### Layout Component Rule

The base layout component (`BaseKanBanRoot`, `BaseListRoot`, etc.) only types and forwards these two shapes — it **never** imports or calls any permission store hook.

---

## 11. List Context vs Item Context

### List Level — Functions That Accept Entity ID

```ts
// In the list/container component — pass the resolver:
permissions={{
  canEdit: (entityId: string) => permissions.getCanEdit(workspaceSlug, projectId, entityId),
  canDelete: (entityId: string) => permissions.getCanDelete(workspaceSlug, projectId, entityId),
}}
```

### Item Level — Resolved Booleans

```tsx
// When iterating and rendering each item — resolve to boolean:
<EntityListItem
  key={entity.id}
  permissions={{
    canEdit: permissions.canEdit(entity.id), // resolved to boolean
    canDelete: permissions.canDelete(entity.id),
  }}
/>;

// The item component interface takes resolved booleans only:
type TEntityListItemProps = {
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};
```

**The rule:** Functions that accept an ID live at the list/container level. Booleans live at the item level. Never pass an `(entityId) => boolean` function into an item component.

---

## 12. Quick Action Dropdown Components

Each QuickActions component gets a typed `permissions` prop. Remove `readOnly` and `disabled` props entirely.

```ts
type TEntityQuickActionProps = Omit<IQuickActionProps, "readOnly" | "disabled"> & {
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canArchive: boolean;
    canRestore: boolean;
    canDuplicate: boolean;
    canRemoveFromView: boolean; // only for view-scoped contexts (cycle, module, etc.)
  };
};
```

When `handleArchive` may be `undefined` in some contexts, gate it:

```ts
canArchive: permissions.canArchive && !!handleArchive;
```

---

## 13. Replacing `disabled` Props

Find every component that receives a `disabled?: boolean` prop derived from auth/role checks. Replace with the relevant `can*` boolean.

**Before:**

```tsx
<CommentCard disabled={!isEditingAllowed} />
<IssueSubscription disabled={!isEditable} />
```

**After:**

```tsx
<CommentCard permissions={{ canEdit, canDelete, canReact }} />
<IssueSubscription canSubscribe={permissions.canSubscribe} />
```

The **receiving component** maps `canEdit → disabled={!canEdit}` internally. It should not re-derive this from role checks.

---

## 14. Removing In-Component Store Access

Delete **all** of the following patterns from every leaf/mid-level component being refactored:

```ts
// DELETE THESE — never in a leaf/mid-level component
const { allowPermissions } = useUserPermissions();
const isEditingAllowed = allowPermissions([EUserPermissions.ADMIN, ...], EUserPermissionsLevel.PROJECT);
const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issues?.viewFlags || {};
```

These must only exist in:

1. Permission classes
2. Root-level assembler components (the component that constructs the flat permissions object)

### `viewFlags` / `enableInlineEditing` / `enableQuickAdd`

Before removing any `viewFlags` reference, confirm whether the flag controls something beyond role-based access (e.g., workflow rules, feature flags, store-type-specific behavior). If it does, fold the constraint into the creation permissions object passed from the layout root — don't silently drop it.

---

## 15. Condition Context System

### How It Works

When a permission has conditions (e.g., `comment:edit+creator`), the `can()` method needs a `conditionContext` to evaluate whether the condition is met.

```ts
this.args.can({
  resource: "comment",
  action: "edit",
  workspaceSlug,
  projectId,
  resourceMeta: {
    resourceId: commentId,
    conditionContext: { creator: true }, // Is current user the creator?
  },
});
```

### Data Flow

```
Parent Entity Store
  └── Has access to entity data (created_by, etc.)
  └── Defines getter: getConditionContext(entityId) => { creator: boolean }
      └── Permission Instance (receives getter via constructor args)
          └── Calls getter when evaluating instance-level permissions
              └── Passes context to can() method
                  └── matchesPermissionGrant() checks conditions against grants
```

### Implementation Pattern

```ts
// In the parent entity store:
private getWorkItemConditionContext(workItemId: string): { creator: boolean } {
  const workItem = this.getWorkItemById(workItemId);
  const currentUserId = this.currentUser?.id;
  return {
    creator: !!workItem?.created_by && !!currentUserId && workItem.created_by === currentUserId,
  };
}

// Passed to permission instance:
new WorkItemPermissionsInstance({
  can: this.permissionAccessStore.can,
  getWorkItemConditionContext: this.getWorkItemConditionContext.bind(this),
  // ...
});
```

### Conditions Reference

| Condition | Used for                                         | Example grants                                                                 |
| --------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `creator` | Resources where only the creator can edit/delete | `comment:edit+creator`, `workitem:delete+creator`, `attachment:delete+creator` |
| `lead`    | Teamspace actions restricted to the lead         | `teamspace:edit+lead`, `teamspace:manage+lead`                                 |

Full list: `packages/types/src/permissions/conditions.ts` → `PERMISSION_CONDITIONS_BY_PERMISSION`

---

## 16. Access Control Hooks

These hooks combine permission checks with feature flags and project configuration for navigation/access control. They live at `apps/web/core/hooks/permissions/`.

### useWorkspaceAccess

**File:** `apps/web/core/hooks/permissions/use-workspace-access.ts`

Combines workspace permissions with feature flags. Returns:

- `canAccessWorkspaceResource(workspaceSlug, resourceKey)` — checks both permission AND feature flag
- `hasWorkspaceResourcePermission(workspaceSlug, resourceKey)` — permission only
- `isWorkspaceFeatureEnabled(workspaceSlug, featureKey)` — feature flag only

### useProjectAccess

**File:** `apps/web/core/hooks/permissions/use-project-access.ts`

Combines project permissions with project feature settings. Returns:

- `canAccessProjectResource(workspaceSlug, projectId, resourceKey)` — checks both
- `hasProjectResourcePermission(workspaceSlug, projectId, resourceKey)` — permission only
- `isProjectFeatureEnabled(workspaceSlug, projectId, featureKey)` — feature check only

### Other Hooks

- `use-workspace-settings-access.ts` — workspace settings page access
- `use-project-settings-access.ts` — project settings page access
- `use-permission-group-access.ts` — permission group UI access

---

## 17. Archive vs Restore Guards

`getCanArchive` and `getCanRestore` are **separate checks** with **opposite** `isArchived` guards. Both call the same underlying `can({ action: "archive" })` but with inverted guards.

```ts
// Archive: only when NOT archived
getCanArchive = computedFn((workspaceSlug, projectId, entityId) => {
  const { isArchived } = this.args.getAdditionalMeta(entityId);
  return !isArchived && this.args.can({ resource: "entity", action: "archive", ... });
});

// Restore: only when IS archived
getCanRestore = computedFn((workspaceSlug, projectId, entityId) => {
  const { isArchived } = this.args.getAdditionalMeta(entityId);
  return isArchived && this.args.can({ resource: "entity", action: "archive", ... });
});
```

> **CRITICAL:** Never delegate one to the other. Never write `getCanRestore = !getCanArchive`. They are independent methods with independent guards.

---

## 18. Property-Level Permissions

### Work Items and Epics

`getCanEditProperty` takes a `property: TWorkItemProperty` parameter (where `TWorkItemProperty = keyof TIssue`):

```ts
getCanEditProperty: WorkItemPermissions["getCanEditProperty"] = computedFn((workspaceSlug, projectId, workItemId) => {
  return this.getCanEdit(workspaceSlug, projectId, workItemId);
});
```

Today this delegates to `getCanEdit`. The property parameter exists so that **when product decides** certain properties need different permissions, we can add per-property logic without touching every component.

### Initiatives

Same pattern with `TInitiativeProperty = keyof TInitiative`:

```ts
getCanEditProperty = computedFn((workspaceSlug, initiativeId, _property) =>
  this.getCanEdit(workspaceSlug, initiativeId)
);
```

### Spreadsheet/Table Columns

Each spreadsheet column maps to a `TWorkItemProperty` key. The column uses:

```ts
disabled={!canEditProperty(columnDetails.workItemProperty)}
```

---

## 19. Default Permission Fallbacks

**File:** `apps/web/core/components/issues/issue-layouts/constants.ts`

```ts
export const DEFAULT_WORK_ITEM_PERMISSIONS = {
  canEditProperty: () => false,
  canDragAndDrop: false,
};

export const DEFAULT_QUICK_ACTION_PERMISSIONS = {
  canEdit: false,
  canDelete: false,
  canArchive: false,
  canRestore: false,
  canDuplicate: false,
  canRemoveFromView: false,
};
```

Use these in **every** `workItem.project_id ? {...} : DEFAULT_*_PERMISSIONS` guard. Entities without a `project_id` or entities that cannot be resolved must fall back to safe-deny defaults.

---

## 20. Incomplete Surfaces & TODO Areas

If a permission surface is not yet fully defined, add an explicit `// TODO` comment and use hardcoded safe defaults:

```ts
permissions={{
  canAddWorklog: false,
  comments: {
    canCreate: true,   // TODO: intake-specific comment permission
    canEdit: () => true,
    canDelete: () => true,
    canReact: () => true,
  },
}}
```

**Before marking a surface complete:** Walk every component in that surface's tree. Don't assume a simple `canEdit` covers everything. Common surfaces that need full audits:

- Every field in intake forms
- Accept/decline/convert action buttons
- Comment threads with different rules than project comments
- Status transitions specific to workflows
- Attachment and link actions

---

## 21. Naming Conventions

| Concept                         | Convention                      | Example                                                   |
| ------------------------------- | ------------------------------- | --------------------------------------------------------- |
| Permission class interface      | `EntityPermissions`             | `WorkItemPermissions`, `EpicPermissions`                  |
| Permission class implementation | `EntityPermissionsInstance`     | `WorkItemPermissionsInstance`                             |
| Store property                  | `permissions`                   | `this.permissions = new WorkItemPermissionsInstance(...)` |
| Getter methods (with args)      | `getCanAction`                  | `getCanEdit`, `getCanDelete`, `getCanArchive`             |
| Computed properties (no args)   | `canAction`                     | `canCreate` (on comment class)                            |
| Flat assembled fields           | `canAction` (no `get` prefix)   | `canEdit: boolean`, `canDelete: boolean`                  |
| Per-item callback in layouts    | `getWorkItemPermissions`        | `(workItem) => { canEditProperty, canDragAndDrop }`       |
| Layout creation permissions     | `permissions.creation`          | `{ viaHeader: boolean, viaQuickAdd: boolean }`            |
| Bulk op permission              | `permissions.canPerformBulkOps` | `boolean`                                                 |
| Default fallback constant       | `DEFAULT_*_PERMISSIONS`         | `DEFAULT_WORK_ITEM_PERMISSIONS`                           |
| Flat type for detail view       | `TEntityDetailPermissions`      | `TInitiativeDetailPermissions`                            |
| Flat type for list/board item   | `TEntityItemPermissions`        | `TInitiativeItemPermissions`                              |

---

## 22. Checklist Before Marking Feature Done

- [ ] Permission class created with **all actions** defined separately
- [ ] Every UI action has its own named permission method (even if delegating to `getCanEdit`)
- [ ] `getCanArchive` uses `!isArchived` guard; `getCanRestore` uses `isArchived` guard — never delegating one to the other
- [ ] Comment `getCanEdit` uses `!isParentArchived` (not `isParentArchived` — silent bug inverter)
- [ ] All permissions assembled at the root component, not in leaf components
- [ ] Permissions passed as **flat plain objects**, never class instances
- [ ] No `useUserPermissions()` calls in mid/leaf components
- [ ] No `allowPermissions()` calls anywhere in new code
- [ ] No `viewFlags` / `enableInlineEditing` / `enableQuickAdd` references in base layouts (verify or fold into permissions)
- [ ] `isCompletedCycle` (or equivalent constraint) applied to BOTH creation AND per-item `canEditProperty`/`canDragAndDrop`
- [ ] `disabled` props replaced with `can*` permission props throughout
- [ ] `DEFAULT_*_PERMISSIONS` constants used in `project_id` null guards
- [ ] QuickActions uses typed `permissions` prop, not `readOnly`/`disabled`
- [ ] Mobile calendar drag-drop override in place
- [ ] Intake/incomplete surfaces have explicit `// TODO` comments with safe defaults
- [ ] Property-level `getCanEditProperty` includes property parameter (even if unused today)
- [ ] Permission class constructor takes only `can()` + context getters — NOT root store
- [ ] Condition context getters are injected, not imported from root store
- [ ] Flat permission types (`TEntityDetailPermissions`, `TEntityItemPermissions`) defined in same file as permission class

---

## 23. File Reference Index

### Types

| File                                                   | Description                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| `packages/types/src/permissions/resource-actions.ts`   | All 82 resources and their allowed actions                          |
| `packages/types/src/permissions/conditions.ts`         | Condition definitions and `PERMISSION_CONDITIONS_BY_PERMISSION`     |
| `packages/types/src/permissions/permission-strings.ts` | `PermissionString` and `PermissionGrantString` union types          |
| `packages/types/src/permissions/permission-check.ts`   | `PermissionCheckArgs` type for `can()` method                       |
| `packages/types/src/permissions/models.ts`             | `PermissionRole`, `CurrentUserPermissionState`                      |
| `packages/types/src/permissions/selection.ts`          | `PermissionSelection`, `PermissionMatrixState` (role management UI) |
| `packages/types/src/permissions/namespaces.ts`         | `PermissionNamespace` type                                          |

### Constants

| File                                                                          | Description                                           |
| ----------------------------------------------------------------------------- | ----------------------------------------------------- |
| `packages/constants/src/roles-and-permissions/workspace-permission-groups.ts` | 13 workspace permission groups for role management UI |
| `packages/constants/src/roles-and-permissions/project-permission-groups.ts`   | 12 project permission groups for role management UI   |
| `packages/constants/src/roles-and-permissions/matrix-types.ts`                | `PermissionMatrixRow`, `PermissionMatrixGroup` types  |
| `packages/constants/src/roles-and-permissions/permission-matrix-utils.ts`     | `buildPermissionGroups()`, condition label helpers    |
| `packages/constants/src/roles-and-permissions/roles.ts`                       | `SETTINGS_ROLES_LIST`                                 |

### Core Stores

| File                                             | Description                                          |
| ------------------------------------------------ | ---------------------------------------------------- |
| `apps/web/core/store/permission-access.store.ts` | `PermissionAccessStore` — `can()` evaluator          |
| `apps/web/core/store/role-management.store.ts`   | `RoleManagementStore` — role CRUD                    |
| `apps/web/core/store/user/permissions.store.ts`  | **DEPRECATED** `UserPermissionStore` — to be removed |

### Permission Classes

| File                                                                 | Description                            |
| -------------------------------------------------------------------- | -------------------------------------- |
| `apps/web/core/store/work-items/permissions/root.ts`                 | `WorkItemPermissionsInstance`          |
| `apps/web/core/store/work-items/permissions/comment.ts`              | `WorkItemCommentPermissionsInstance`   |
| `apps/web/core/store/work-items/epic/permissions/root.ts`            | `EpicPermissionsInstance`              |
| `apps/web/core/store/work-items/epic/permissions/comment.ts`         | `EpicCommentPermissionsInstance`       |
| `apps/web/core/store/work-items/epic/permissions/updates/root.ts`    | `EpicUpdatePermissionsInstance`        |
| `apps/web/core/store/work-items/epic/permissions/updates/comment.ts` | `EpicUpdateCommentPermissionsInstance` |
| `apps/web/core/store/initiatives/permissions/root.ts`                | `InitiativePermissionsInstance`        |
| `apps/web/core/store/initiatives/permissions/comment.ts`             | `InitiativeCommentPermissionsInstance` |
| `apps/web/core/store/initiatives/permissions/label.ts`               | `InitiativeLabelPermissionsInstance`   |
| `apps/web/ee/store/workspace-views/permissions.ts`                   | `WorkspaceViewPermissionsStore`        |

### Hooks

| File                                                               | Description                                              |
| ------------------------------------------------------------------ | -------------------------------------------------------- |
| `apps/web/core/hooks/permissions/use-workspace-access.ts`          | Workspace resource access (permissions + feature flags)  |
| `apps/web/core/hooks/permissions/use-project-access.ts`            | Project resource access (permissions + project features) |
| `apps/web/core/hooks/permissions/use-workspace-settings-access.ts` | Workspace settings access                                |
| `apps/web/core/hooks/permissions/use-project-settings-access.ts`   | Project settings access                                  |
| `apps/web/core/hooks/permissions/use-permission-group-access.ts`   | Permission group UI access                               |

### UI Examples

| File                                                          | Description                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| `apps/web/core/components/initiatives/peek-overview/root.tsx` | Initiative peek — flat object prop-drilling pattern                 |
| `apps/web/core/components/issues/peek-overview/root.tsx`      | Issue peek — flat object prop-drilling pattern                      |
| `apps/web/core/components/issues/issue-layouts/constants.ts`  | `DEFAULT_WORK_ITEM_PERMISSIONS`, `DEFAULT_QUICK_ACTION_PERMISSIONS` |

### Backend Docs (Reference Only)

| File                                             | Description                                     |
| ------------------------------------------------ | ----------------------------------------------- |
| `docs/permissions/PERMISSION_SYSTEM.md`          | Overall architecture (ReBAC, Zanzibar-inspired) |
| `docs/permissions/PERMISSION_MIGRATION.md`       | 349 endpoint migration tracker                  |
| `docs/permissions/PERMISSION_MATRIX.md`          | Endpoint-level permission matrix                |
| `docs/permissions/PERMISSION_ROLE_COMPARISON.md` | Feature-level role comparison tables            |
