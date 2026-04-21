# RBAC + GAC — Frontend Architecture

This is the conceptual overview of how our new permission system is wired on the frontend. It explains the **model** and the **design decisions** so that when you open a component, a store, or a permission type, you already know where it fits.

For the mechanical migration playbook (old pattern → new pattern, checklists, replacement recipes), see [`PERMISSION_FE_REFACTOR_GUIDE.md`](./PERMISSION_FE_REFACTOR_GUIDE.md). For the endpoint-by-endpoint permission table, see [`PERMISSION_MATRIX.md`](./PERMISSION_MATRIX.md). This doc links out liberally instead of duplicating them.

> **History**: the rewrite landed in `f7c0def12b` (PR #6121, [WEB-2973]). The old `UserPermissionStore` and everything it touched has been removed.

---

## Table of contents

1. [Why we rewrote it](#1-why-we-rewrote-it)
2. [The grant model — resource, action, condition](#2-the-grant-model--resource-action-condition)
3. [Type safety end-to-end](#3-type-safety-end-to-end)
4. [`resourceId` — always passed, here's why](#4-resourceid--always-passed-heres-why)
5. [The three stores](#5-the-three-stores)
6. [Permission instances — the per-entity layer](#6-permission-instances--the-per-entity-layer)
7. [Components consume props, not stores](#7-components-consume-props-not-stores)
8. [Route and sidebar access — the composition hooks](#8-route-and-sidebar-access--the-composition-hooks)
9. [Conditional checks (creator / lead)](#9-conditional-checks-creator--lead)
10. [One permission per UI action (even when the backend reuses)](#10-one-permission-per-ui-action-even-when-the-backend-reuses)
11. [Lifecycle — how grants reach the store](#11-lifecycle--how-grants-reach-the-store)
12. [Role and scheme management](#12-role-and-scheme-management)
13. [Cheat sheet](#13-cheat-sheet)
14. [Further reading](#14-further-reading)

---

## 1. Why we rewrote it

The old system checked **role levels** in component code:

```ts
// OLD — gone
const { allowPermissions } = useUserPermissions();
const isEditingAllowed = allowPermissions(
  [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  EUserPermissionsLevel.PROJECT
);
```

Role levels were integers (`25` = owner, `20` = admin, `15` = member/contributor, `10` = commenter, `5` = guest) and `>=` comparisons were the ACL. Each component encoded its own interpretation of "who is allowed to do this."

That model had three structural problems:

1. **Role is not access.** A site admin can grant specific permissions to one role and not another. Ordinal comparisons can't express that.
2. **Permission logic was strewn across components.** The same "can edit this comment?" check existed — with subtle variations — in every place a comment rendered.
3. **Custom roles are impossible.** With role integers you can add a level, but you can't let an operator compose a role from a bundle of permissions.

The new system replaces all of that with **grant strings** evaluated against the current user's permission snapshot. Concretely:

| Aspect           | Old                                              | New                                                                                 |
| ---------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Identification   | numeric integer per role                         | slug string (`"admin"`, `"contributor"`, custom slugs)                              |
| Access check     | `allowPermissions([20, 15], LEVEL)` in component | `can({ resource: "workitem", action: "edit", projectId, workspaceSlug, ... })`      |
| Where it happens | leaf components                                  | single evaluator in a store; leaf components get booleans as props                  |
| Comparison       | ordinal (`role >= 15`)                           | grant-based (`"workitem:edit"` is in the user's grants — or is it `+creator` only?) |
| Custom roles     | not supported                                    | first-class (enterprise)                                                            |

Sections 2–9 below are the details of how the new pieces fit.

---

## 2. The grant model — resource, action, condition

A **grant** is a string. The backend returns a list of them for the current user at each scope. The matcher in the frontend decides whether a given check is authorized.

### Anatomy

```
resource : action [+condition1 [+condition2]]
```

Examples:

- `workitem:edit` — can edit any work item
- `comment:delete+creator` — can delete a comment only if I created it
- `teamspace:manage+lead` — can manage a teamspace only if I'm its lead
- `workitem:*` — can do every action on work items
- `*` — unrestricted (owner / root)

### Three namespaces

Every resource belongs to exactly one namespace:

| Namespace   | Count (today) | Examples                                                                             |
| ----------- | ------------- | ------------------------------------------------------------------------------------ |
| `workspace` | ~35           | `workspace`, `project`, `initiative`, `wiki`, `dashboard`, `customer`, `custom_role` |
| `teamspace` | 4             | `teamspace_workitem_view`, `teamspace_comment`, `teamspace_page`, …                  |
| `project`   | ~35           | `workitem`, `epic`, `cycle`, `module`, `page`, `comment`, `label`, `state`           |

The canonical source list is `packages/types/src/permissions/resource-actions.ts:20–116`. That file is `as const` by design — see [§3](#3-type-safety-end-to-end).

Namespaces exist because evaluation has a cascade (§5): project-scoped grants win over teamspace-scoped, which win over workspace-scoped fallback.

### The two conditions

Only two conditions exist today:

| Condition | Satisfied when …                               |
| --------- | ---------------------------------------------- |
| `creator` | The current user is the `created_by` principal |
| `lead`    | The current user is the lead of this teamspace |

This is deliberate. Conditions are expensive — they force the caller to derive runtime context and the evaluator to do a secondary check. If we find ourselves wanting a new condition (e.g. `assignee`, `reviewer`), the default answer is **make it a new action instead**. A new condition is a schema change; a new action is additive.

See `packages/types/src/permissions/conditions.ts` — especially `PERMISSION_CONDITIONS_BY_PERMISSION`, which is the authoritative map of which permissions accept which conditions.

### Conditional semantics

The absence of an unconditional grant combined with the presence of a conditional grant is the signal that the user is restricted:

```json
// admin
{ "permission_grants": ["comment:edit", "comment:delete"] }

// contributor
{ "permission_grants": ["comment:edit+creator", "comment:delete+creator"] }

// guest
{ "permission_grants": [] }
```

- Admin can edit **any** comment.
- Contributor can edit **only their own** comments.
- Guest cannot edit comments at all.

### Wildcards

- `resource:*` — backend shorthand for "every action on this resource"
- `*` — global wildcard

Wildcards short-circuit the matcher. See `packages/utils/src/permissions/match.ts:31–62` for the exact precedence:

1. `*` (global)
2. Exact `resource:action` match
3. `resource:*`
4. Conditional grant with a satisfied `conditionContext`

**The matcher refuses conditional grants when `conditionContext` is missing** — it is not permissive by default. See [§9](#9-conditional-checks-creator--lead).

---

## 3. Type safety end-to-end

The permission system is fully typed. The compiler enforces the grant model so that an impossible `can()` call fails `tsc`, not runtime.

The chain of types:

**Resource / action maps are `as const`.**

```ts
// packages/types/src/permissions/resource-actions.ts:20
export const WORKSPACE_PERMISSION_RESOURCE_ACTIONS = {
  workspace: ["view", "edit", "delete", "manage", "invite", "transfer"],
  workitem_relation: ["view", "create", "edit", "delete"],
  // …
} as const;
```

Because of `as const`, every action is a literal, not just a `string`.

**`PermissionActionForResource<R>` resolves actions by resource.**

```ts
// packages/types/src/permissions/resource-actions.ts:142
export type PermissionActionForResource<R extends PermissionResource> =
  R extends keyof WorkspacePermissionResourceActionMap
    ? WorkspacePermissionResourceActionMap[R][number]
    : R extends keyof TeamspacePermissionResourceActionMap
      ? TeamspacePermissionResourceActionMap[R][number]
      : R extends keyof ProjectPermissionResourceActionMap
        ? ProjectPermissionResourceActionMap[R][number]
        : never;
```

`PermissionActionForResource<"workitem">` is `"view" | "create" | "edit" | "delete" | "assign" | "archive" | ...`.

**`PermissionCheckArgs` is a discriminated union over the whole matrix.**

```ts
// packages/types/src/permissions/permission-check.ts:117
export type PermissionCheckArgs =
  | WorkspacePermissionCheckArgs
  | ProjectPermissionCheckArgs
  | TeamspacePermissionCheckArgs;
```

Which gives us, at call sites:

- valid `resource` + `action` pairs only
- project-scoped checks always carry `projectId`
- teamspace-scoped checks always carry `teamspaceId`
- `resourceMeta` optional for collection actions, required for instance actions
- `conditionContext` required **only** when the chosen permission actually supports a condition (see `PermissionResourceMeta<P>` at `permission-check.ts:30`)

**Collection vs instance actions.**

```ts
// packages/types/src/permissions/permission-check.ts:49
export const COLLECTION_PERMISSION_ACTIONS = [
  "create",
  "submit",
  "view",
  "browse",
  "export",
] as const satisfies readonly AllPermissionActions[];
```

For those actions `resourceMeta` is optional. For everything else (`edit`, `delete`, `archive`, `assign`, etc.) the compiler demands `resourceMeta.resourceId`.

**Concrete compile errors you should see.**

```ts
can({ resource: "workitem", action: "invite", workspaceSlug, projectId });
//                            ^^^^^^^^
// Type '"invite"' is not assignable to type '"view" | "create" | "edit" | ...'.
```

```ts
can({ resource: "workitem", action: "edit", workspaceSlug, projectId });
//    Property 'resourceMeta' is missing
```

```ts
can({
  resource: "workitem",
  action: "edit",
  workspaceSlug,
  projectId,
  resourceMeta: { resourceId: wi.id },
  //              ^^^^^^^^^^^
  // Property 'conditionContext' is missing — `workitem:edit` supports `creator`.
});
```

This type-level contract is the biggest reason the grant model pays for itself. You can't ship a permission check that references a resource that doesn't exist or an action that resource doesn't allow.

---

## 4. `resourceId` — always passed, here's why

On every instance action we require `resourceMeta.resourceId`, even though today's evaluator almost never reads it. The reason is deliberate forward compatibility.

### What `resourceId` does today

1. **Condition context derivation.** For `workitem:edit+creator`, we need to know whether the current user created _that specific_ work item. The permission instance uses the id to ask its entity store (§6, §9).
2. **Project / teamspace inference.** For resource = `project` or `teamspace`, if the caller omits `projectId` / `teamspaceId`, the access store infers it from `resourceMeta.resourceId`. See `apps/web/core/store/permission-access.store.ts:76–107`:

   ```ts
   if (args.resource === "project" && resourceMeta?.resourceId) {
     return { projectId: resourceMeta.resourceId, ... };
   }
   ```

### What `resourceId` is reserved for tomorrow

The backend's grant model is scoped (workspace / project / teamspace) but not yet per-resource. In other words, today a grant says "you can edit any work item in this project," not "you can edit work-item X." The system is designed so that when we flip the switch and start issuing per-resource grants — the true GAC layer — the frontend already has the id in hand. We don't want a refactor that threads `resourceId` through hundreds of call sites on the day the backend supports it.

So the rule is: **pass it now, even when it does nothing**. The type system will force you to; that's the feature.

One more nuance: `PermissionResourceMeta<P>` is conditional on whether `P` has conditions. For an action with no conditions, the type is `{ resourceId: string; conditionContext?: undefined }` — ID alone. For one with conditions, `conditionContext` becomes required. See `permission-check.ts:27–34`.

---

## 5. The three stores

The old `UserPermissionStore` did everything in one class: held the current user's role, held role definitions, evaluated access, and drove the admin UI. We split it three ways along the axis of concern.

```
apps/web/core/store/
  permission-access.store.ts      —  runtime "can this user do X?" evaluator
  role-management.store.ts        —  CRUD of role definitions (role catalog)
  permission-scheme.store.ts      —  CRUD of permission schemes (reusable grant bundles)
```

All three are constructed by `CoreRootStore` (`apps/web/core/store/root.store.ts:352–355`) and reset on sign-out (`:465–467`).

The key invariant: **reading access is decoupled from managing definitions.** A component that renders a project page will read from `PermissionAccessStore` and never touch `RoleManagementStore` or `PermissionSchemeStore`. The management stores are loaded only by the `/settings/roles-and-schemes` surfaces.

### 5.1 `PermissionAccessStore`

`apps/web/core/store/permission-access.store.ts` — 203 lines. The whole runtime evaluator.

**Observable state:**

```ts
private workspacePermissionsMap: Map<string, CurrentUserPermissionState> = new Map();
private projectPermissionsMap:   Map<string, CurrentUserPermissionState> = new Map();
private teamspacePermissionsMap: Map<string, CurrentUserPermissionState> = new Map();
```

Each `CurrentUserPermissionState` is `{ relation: roleSlug | null; permission_grants: PermissionGrantString[] }` — the minimum needed to evaluate.

**Public surface:**

- `can(args: PermissionCheckArgs): boolean` — the one call everything funnels through
- `getCurrentUser{Workspace,Project,Teamspace}RoleSlug` — for the rare cases where the UI legitimately needs a role slug (e.g. rendering "You are a Guest")
- `fetchCurrentUserWorkspacePermissions(workspaceSlug)` — explicit workspace fetch on mount
- `hydrateProjectPermissionsFromEntities(entities)` — bulk seed from a project list response
- `hydrateTeamspacePermissionsFromEntities(entities)` — same, for teamspaces

**`can()` cascade** — `permission-access.store.ts:117`:

1. If a `projectId` is available, check `projectPermissionsMap.get(projectId)`. Match → `true`.
2. Else if `teamspaceId` is available, check `teamspacePermissionsMap.get(teamspaceId)`. Match → `true`.
3. Fall back to `workspacePermissionsMap.get(workspaceSlug)`. Match → `true`, else `false`.

`can()` is wrapped in `computedFn` — cheap, memoized per args identity.

### 5.2 `RoleManagementStore`

`apps/web/core/store/role-management.store.ts` — the **role catalog**. CRUD and state for the named collections of permissions users are assigned to.

**Observable state:**

```ts
private rolesMap:                Map<string, PermissionRole>;   // all roles by id
private workspaceRoleIdsMap:     Map<string, string[]>;         // per workspace
private projectRoleIdsMap:       Map<string, string[]>;         // per workspace
private roleIdToNamespaceMap:    Map<string, PermissionNamespace>;
```

**Public surface** (abridged — see file for full list):

- `getWorkspaceRolesByWorkspaceSlug(slug, statusFilter)`
- `getProjectRolesByWorkspaceSlug(slug, statusFilter)`
- `getRoleDetailsByRoleSlug({ workspaceSlug, roleSlug, namespace })`
- `fetchAllWorkspaceRoles(slug)`
- `createRole`, `updateRole`, `deleteRole`, `disableRole`, `enableRole`

Every getter that returns a role list requires an explicit `statusFilter: "active" | "inactive" | "all"`. The reason is subtle: once you can disable roles (without deleting them), a naive list getter risks rendering a "select a role" dropdown with defunct options. Making the filter mandatory forces every call site to think about it.

Teamspace roles live in evaluation-land only right now; the role-management UI is workspace + project scoped. See the file header for the `// TODO` on that.

### 5.3 `PermissionSchemeStore`

`apps/web/core/store/permission-scheme.store.ts` — the **scheme catalog**. Schemes are named bundles of grants that roles are composed from (one role can reference multiple schemes; one scheme can be referenced by many roles).

Same shape as `RoleManagementStore` — namespace-scoped maps, CRUD actions, plus scheme impact queries that power the confirmation dialogs in the admin UI.

If you're working outside `/settings/roles-and-schemes`, you almost never touch this store.

---

## 6. Permission instances — the per-entity layer

This is the layer you'll touch most often. Every entity store has a co-located permission instance at `apps/web/core/store/<entity>/permissions/root.ts`.

- `apps/web/core/store/work-items/permissions/root.ts` — reference implementation
- `apps/web/core/store/work-items/permissions/comment.ts` — child-instance pattern
- `apps/web/core/store/initiatives/permissions/root.ts` — workspace-scoped example (no `projectId`)
- `apps/web/core/store/customers/permissions/root.ts` — simpler reference

### What a permission instance is for

A permission instance wraps `can()` with the entity-specific plumbing that `can()` can't know about on its own:

- Deriving condition context (`creator` boolean) from the entity store
- Enforcing cross-cutting runtime gates like "is this entity archived?" or "is the parent cycle completed?"
- Exposing one method per UI action so call sites don't have to build `PermissionCheckArgs` themselves

### The constructor contract — no root store

Instances take **only what they need**. They are not given the root store.

```ts
// apps/web/core/store/work-items/permissions/root.ts:70
type WorkItemPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  getWorkItemConditionContext: (workItemId: string) => { creator: boolean };
  getWorkItemCommentConditionContext: (workItemId: string, commentId: string) => { creator: boolean };
  getAdditionalWorkItemPermissionMeta: (workItemId: string) => AdditionalWorkItemPermissionMeta;
};
```

This is the decoupling. The instance is unit-testable with a mock `can` and mock getters. It can't accidentally reach into `rootStore.somethingElse` and grow unmanageable dependencies.

### Method naming — one per UI action

Every UI action gets its own `getCan…` method on the instance, even when two methods resolve to the same `can()` call today.

From `WorkItemPermissionsInstance`:

- `getCanEdit`
- `getCanDelete`
- `getCanArchive`, `getCanRestore`
- `getCanReact`
- `getCanAddSubWorkItems`, `getCanAddDependencies`, `getCanAddRelations`, `getCanAddLinks`, `getCanAddAttachments`, `getCanAddPages`, `getCanAddCustomerRequests`
- `getCanEditProperty(property)` — delegates to `getCanEdit` today, but provides the hook for per-property grants later
- `getCommentPermissions(...)` — returns a `WorkItemCommentPermissionsInstance` scoped to a specific work item

The add-\* family all call `workitem:edit` today. That's fine — see [§10](#10-one-permission-per-ui-action-even-when-the-backend-reuses) for why this is deliberate.

### MobX notes

- Parameterised methods use `computedFn` from `mobx-utils`. Memoized per-args, cheap to call in render.
- Zero-argument properties (typically on child instances scoped to a specific parent, like `WorkItemCommentPermissionsInstance.canCreate`) use MobX `computed` via `makeObservable`.

### Child instances

When a parent entity has sub-entities (comments, updates, links, labels), the parent's instance returns a **child instance**:

```ts
// WorkItemPermissionsInstance
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

Child instances inherit cross-cutting gates from the parent (notice `isWorkItemArchived` being threaded in — an archived work item freezes its comments too). They expose a small, focused surface: for comments, typically `canCreate`, `getCanEdit(commentId)`, `getCanDelete(commentId)`, `getCanReact(commentId)`.

The `Epic*` permission classes extend their `WorkItem*` counterparts by inheritance, adding only what's different.

---

## 7. Components consume props, not stores

The old system had every component calling `useUserPermissions()` directly. The new system does the opposite: **permissions flow as props**, assembled once at the top of a view.

### The rule

- A leaf component declares a `permissions` prop whose type is a **flat plain-object type** (booleans and small resolver functions), declared next to the permission instance.
- No permission class instance crosses a prop boundary. The shapes have names like `TInitiativeDetailPermissions`, `TWorkItemItemPermissions`, `TCustomerDetailPermissions`.
- The assembly happens at the **root of a view** — a route component, a peek-overview root, or a detail page. That root calls the hook, gets the instance, and builds the plain object.

### Why

Three reasons to bake this discipline in:

1. **Consistency.** One place decides "what can the user do on this page" — not fifteen leaf components, each with its own subtle interpretation.
2. **Testability.** Leaf components are pure functions of props. You can render them in Storybook or tests with any permission configuration you like.
3. **Performance and correctness.** Permission resolution runs once per render tree, not once per leaf. MobX reactivity still works because the resolver hook is called in the observer root.

### Reference — initiative peek overview

```tsx
// apps/web/core/components/initiatives/peek-overview/root.tsx
const InitiativePeekOverview = observer(() => {
  const {
    initiative: { peekInitiative, permissions },
  } = useInitiatives();

  const labelPerms = permissions.getLabelPermissions(peekInitiative.workspaceSlug);
  const commentPerms = permissions.getCommentPermissions(peekInitiative.workspaceSlug, peekInitiative.initiativeId);

  const peekPermissions: TInitiativeDetailPermissions = {
    canEdit: permissions.getCanEdit(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canDelete: permissions.getCanDelete(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canReact: permissions.getCanReact(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canEditProperty: (property) =>
      permissions.getCanEditProperty(peekInitiative.workspaceSlug, peekInitiative.initiativeId, property),
    labels: {
      canCreate: labelPerms.canCreate,
      canEdit: (id) => labelPerms.getCanEdit(id),
      canDelete: (id) => labelPerms.getCanDelete(id),
      canReorder: (id) => labelPerms.getCanReorder(id),
    },
    comments: {
      canCreate: commentPerms.canCreate,
      canEdit: (id) => commentPerms.getCanEdit(id),
      canDelete: (id) => commentPerms.getCanDelete(id),
      canReact: (id) => commentPerms.getCanReact(id),
    },
  };

  return <InitiativeView permissions={peekPermissions} />;
});
```

Everything downstream of `<InitiativeView>` is a pure consumer.

### Two prop shapes

- **Detail / peek views** — `TEntityDetailPermissions`: booleans, plus `(id) => boolean` resolvers for nested items where the parent shows many children of one kind.
- **List / board / table items** — `TEntityItemPermissions`: **booleans only**, resolved at the list level.

The rule of thumb: **functions that accept an ID live one level up; at the item, everything is already a boolean.** Never pass `(id) => boolean` into an item component — resolve it in the list and pass the boolean.

See [`PERMISSION_FE_REFACTOR_GUIDE.md` §10–11](./PERMISSION_FE_REFACTOR_GUIDE.md#10-layout-level-permission-patterns) for the full shapes and the "constraint folding" rule for cycles / modules.

### The escape hatch — `PermissionWrapper`

For one-off cases where a single child needs gating and prop assembly is overkill, use the wrapper:

```tsx
// apps/web/core/components/roles-and-permissions/permission-wrapper.tsx
<PermissionWrapper resource="project" action="create" workspaceSlug={workspaceSlug} fallback={<LockedIcon />}>
  <CreateProjectButton />
</PermissionWrapper>
```

This is the exception, not the norm. Prefer the prop-drilling pattern whenever the consumer is a rendered view (not a tiny piece of chrome).

### What you must NOT do anymore

```tsx
// WRONG — do not import `usePermissionAccess` in a leaf/mid component.
function WorkItemRow() {
  const { can } = usePermissionAccess();
  const canEdit = can({ resource: "workitem", action: "edit", ... });
  ...
}

// WRONG — do not pass a permission class instance as a prop.
<Child permissions={workItemPermissionsInstance} />

// WRONG — do not wire a `disabled` prop to a role check.
<CommentCard disabled={!isEditingAllowed} />
```

All of these exist only in:

1. The permission instance itself (store layer)
2. The root-level assembler component

Everything below reads booleans off the assembled `permissions` prop.

---

## 8. Route and sidebar access — the composition hooks

Per-entity permission instances (§6) answer "can I edit this work item?" — one entity at a time. **Navigation and route gates ask a different question**: "should this sidebar entry render?" or "can this user even land on this route?" That question is rarely a single `can()` call — it's a composition of feature flags, workspace feature toggles, and one or more permission-instance checks.

To keep that composition out of navigation components (and consistent across them), we have a dedicated set of hooks at:

```
apps/web/core/hooks/permissions/
  use-workspace-access.ts            — workspace sidebar items + workspace routes
  use-workspace-settings-access.ts   — workspace settings tabs (/settings/…)
  use-project-access.ts              — project sidebar items + project routes
  use-project-settings-access.ts     — project settings tabs
  use-permission-group-access.ts     — permission matrix group visibility (roles-and-schemes UI)
  use-release-permissions.ts         — release-specific gates
```

### The shape they share

Every access hook exposes the same trio:

- `is<Scope>FeatureEnabled(...)` — feature-flag + workspace-feature gate (e.g. is `initiatives` turned on?)
- `has<Scope>ResourcePermission(...)` — pure permission gate (does the user have the grants?)
- `canAccess<Scope>Resource(...)` — the AND composition. **This is what UI should call.**

The AND is deliberate. Features can be disabled at the workspace level even for admins; permissions can be absent even when the feature is on. Sidebar/route rendering needs both to be true.

### Reference — workspace access

```ts
// apps/web/core/hooks/permissions/use-workspace-access.ts:84
const hasWorkspaceResourcePermission = (workspaceSlug: string, resourceKey: WorkspaceResourceKey) => {
  const workspaceRoleSlug = getCurrentUserWorkspaceRoleSlug(workspaceSlug);
  const resourcePermissionChecks: Record<WorkspaceResourceKey, boolean> = {
    home: true,
    your_work: !isGuestRole(workspaceRoleSlug),
    drafts: workspaceDraftWorkItemsPermissions.getCanCreate(workspaceSlug),
    projects: projectPermissions.getCanBrowse(workspaceSlug),
    dashboards: getCanViewDashboard(workspaceSlug),
    analytics: can({ resource: "analytics", action: "view", workspaceSlug }),
    initiatives: initiativePermissions.getCanView(workspaceSlug),
    team_spaces: teamspacePermissions.getCanBrowse(workspaceSlug),
    customers: customerPermissions.getCanView(workspaceSlug),
    // …
  };
  return workspacePermissions.getCanView(workspaceSlug) && Boolean(resourcePermissionChecks[resourceKey]);
};
```

Two things worth noting:

1. **The resource key is the UI concept, not a backend resource.** `WorkspaceResourceKey` enumerates sidebar items (`home`, `your_work`, `drafts`, `projects`, `dashboards`, `analytics`, `initiatives`, `team_spaces`, `customers`, `active-cycles`, `pi_chat`, `releases`, …). Each row composes whatever the UI item actually needs — often a single per-entity permission check, sometimes a direct `can()` call, occasionally a role-slug check (e.g. "not a guest").
2. **A baseline check runs for all items** — `workspacePermissions.getCanView(workspaceSlug)` is AND'd into every result. If you can't view the workspace, no sidebar item is visible, period.

`useProjectAccess` follows the same pattern, keyed on `ProjectResourceKey` (`overview`, `work_items`, `epics`, `cycles`, `modules`, `views`, `pages`, `intake`, `archives`) with `projectPermissions.getCanView(...)` as the baseline. See `apps/web/core/hooks/permissions/use-project-access.ts:60`.

### Settings tabs

`use-workspace-settings-access.ts` and `use-project-settings-access.ts` do the same for settings surfaces. They also expose a route variant:

```ts
// apps/web/core/hooks/permissions/use-workspace-settings-access.ts:86
const canAccessWorkspaceSettingByRoute = (workspaceSlug: string, accessKey: string): boolean => {
  const settingKey = Object.values(WORKSPACE_SETTINGS)
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (setting) => accessKey === setting.href || (setting.href !== "" && accessKey.startsWith(`${setting.href}/`))
    )?.key;
  if (!settingKey) return false;
  return canAccessWorkspaceSetting(workspaceSlug, settingKey);
};
```

The longest-href-first match prevents a short `href: "/settings"` from swallowing every nested settings route. Route-guard wrappers use this form.

### Where these hooks are consumed

- **Sidebar components.** Workspace sidebar items, project navigation, project-list items, teamspace sidebar — all call `canAccessWorkspaceResource` / `canAccessProjectResource` when deciding whether to render a row.
- **Route wrappers.** `apps/web/core/layouts/access/workspace-wrapper.tsx` uses `useWorkspaceAccess` to guard the workspace route itself — if the user has no permission, they're redirected or shown an access-denied view before any child component mounts.
- **Settings shells.** Workspace/project settings shells iterate visible tabs through the settings access hooks.
- **Permission matrix UI.** `usePermissionGroupAccess(workspaceSlug, namespace).filterGroups(groups)` hides groups like `initiatives` / `teamspaces` / `customers` when the feature flag is off. The matrix UI stays dumb — it renders whatever comes back.

### Rules

- **Never re-derive sidebar/route access from raw role checks in the navigation component.** If a sidebar item's gate isn't in an access hook, add it — don't inline it.
- **UI should call `canAccess*Resource` (the composition).** Only call the separate `is*FeatureEnabled` / `has*ResourcePermission` helpers when you need them apart — for example, to differentiate "feature is off" from "you don't have permission" in an empty-state message.
- **Per-entity permission instances stay the source of truth.** Access hooks are thin composers — they pull `getCanView`, `getCanCreate`, etc. from the instances in §6. If a row needs a new permission, add the `getCan…` method on the instance first; the access hook should stay a one-liner.

### Deciding which to use

| You're gating…                      | Use                                       |
| ----------------------------------- | ----------------------------------------- |
| A sidebar row or a top-level route  | `useWorkspaceAccess` / `useProjectAccess` |
| A settings tab                      | `use{Workspace,Project}SettingsAccess`    |
| A button, menu item, inline control | Per-entity permission instance via props  |
| A one-off wrapper around a child    | `<PermissionWrapper>` (escape hatch)      |
| Permission-matrix group visibility  | `usePermissionGroupAccess`                |

The short rule: **access hooks for navigation and route shells, permission instances for everything inside them.**

---

## 9. Conditional checks (creator / lead)

Conditions tie a grant to runtime context. They're what lets us express "contributors can edit their own comments but not anyone else's" without exploding the role catalog.

### How the loop closes

Conditions are never _guessed_ by the access store. The caller — the permission instance — provides the context explicitly.

End-to-end for "can I delete this comment?":

1. A component reads `permissions.comments.getCanDelete(commentId)` off its props.
2. That resolver was produced by `WorkItemCommentPermissionsInstance.getCanDelete(commentId)`.
3. The child instance calls its own `can()` with `resourceMeta: { resourceId: commentId, conditionContext }`.
4. The condition context came from the parent (`WorkItemPermissionsInstance`) at construction time — `getCommentConditionContext: (commentId) => ({ creator: iAmCreator(commentId) })`.
5. `PermissionAccessStore.can()` forwards context into `matchesPermissionGrant()`.
6. The matcher either finds an unconditional `comment:delete` (admin case) or a conditional `comment:delete+creator` that the context satisfies (contributor-on-own case).

### Safe default when context is missing

The matcher refuses conditional grants when no `conditionContext` is provided:

```ts
// packages/utils/src/permissions/match.ts:55
// Conditional grants are never assumed true without explicit runtime context.
if (!conditionContext) return false;
```

This is a deliberate safety choice: missing context must fail closed. A silent pass would turn "I forgot to wire up creator" into a vulnerability.

### Where to derive the context

The permission **instance** is the right place. It was passed a `get<Entity>ConditionContext` function at construction, and it has access to the entity store via that closure. Leaf components never derive context — they just consume booleans.

Two more rules worth internalising:

- **The matcher checks exact-grant / wildcard before conditional grants.** If a user has `comment:edit` unconditionally, we never even look at condition context. Admins don't need to be marked as the creator of every comment.
- **Conditions are additive, not disjunctive at the grant level.** `comment:edit+creator+lead` means "edit only when the user is _both_ creator and lead." If you want "creator OR lead," that's two separate grants: `comment:edit+creator` and `comment:edit+lead`.

---

## 10. One permission per UI action (even when the backend reuses)

On the frontend, **every distinct UI action gets its own `getCan…` method on the permission instance**, even if multiple methods currently resolve to the same backend permission.

From `WorkItemPermissionsInstance`:

```ts
getCanAddSubWorkItems;
getCanAddDependencies;
getCanAddRelations;
getCanAddLinks;
getCanAddAttachments;
getCanAddPages;
getCanAddCustomerRequests;
```

All seven currently delegate to `workitem:edit`. We keep them separate anyway.

### Why this is worth the duplication

1. **Future backend splits are cheap.** The day the backend decides `workitem:add_link` is its own permission, the change is a one-line edit in `getCanAddLinks`. Zero call sites change.
2. **Readable grep-ability.** `rg "canAddLinks"` finds every UI affordance that gates link creation. `rg "canEdit"` would find half the app and tell you nothing.
3. **Prevents semantic drift.** Left alone, teams reuse `canEdit` as a proxy for "any mutation on this entity" until two actions diverge and subtly break. One-method-per-action prevents the foundation that drift rests on.
4. **Same rule for property-level checks.** `getCanEditProperty(slug, id, property)` is distinct from `getCanEdit` for the same reason: one day a specific property will be gated separately, and we want the hook ready.

The same pattern applies to `getCanDuplicate` (delegates to `getCanCreate` today — but "duplicate" is a different UI concept and may someday need its own grant).

The cost of this discipline is a few extra lines per instance. The benefit is a codebase where "add a permission" is always a local change.

---

## 11. Lifecycle — how grants reach the store

The permission store is populated through **two channels**. Understanding the difference matters when you hit a bug where a component renders before its permissions are loaded.

### Channel 1 — explicit workspace fetch

On workspace mount, the app calls:

```ts
permissionAccessStore.fetchCurrentUserWorkspacePermissions(workspaceSlug);
```

This hits `GET /api/workspaces/{slug}/permissions/` and populates `workspacePermissionsMap`. It's a dedicated call because workspace-level grants are needed globally (cross-project gates, admin settings access, etc.).

### Channel 2 — inline hydration from entity lists

Project and teamspace list endpoints return each entity with a `_permissions` field — the current user's grants for that specific project/teamspace, inline. On receiving the response, the project/teamspace stores call:

```ts
permissionAccessStore.hydrateProjectPermissionsFromEntities(projects);
// or
permissionAccessStore.hydrateTeamspacePermissionsFromEntities(teamspaces);
```

This bulk-seeds `projectPermissionsMap` / `teamspacePermissionsMap` without N extra calls.

`hydrate*` intentionally skips entities missing `_permissions` (see commit `5510c2adb0`) — older responses or partial fetches don't clobber state.

### After writes — refresh on self-role change

When the current user's own role changes (for example, an admin demotes themselves), we refetch the workspace snapshot. Otherwise the UI would keep rendering from stale grants. See commit `863ccc7c63` for the fix.

### Eviction

The three maps are reset when a new `CoreRootStore` is constructed on sign-out (`root.store.ts:465–467`). There's no partial cache invalidation — a new session is a new snapshot.

---

## 12. Role and scheme management

The admin surface at `/settings/roles-and-schemes` is where `RoleManagementStore` and `PermissionSchemeStore` earn their keep. Most frontend work doesn't touch this flow, but the mental model is worth skimming.

- A **scheme** is a named bundle of permissions. System schemes are seeded; custom schemes are created by workspace admins.
- A **role** references 1+ schemes. Its effective permissions are the union of its schemes' permissions.
- **System roles** (`owner`, `admin`, `member`, `contributor`, `commenter`, `guest`) are `is_system: true`. They can be extended or disabled, never deleted. See [`PERMISSION_EXTEND_DISABLE_SYSTEM_ROLES.md`](./PERMISSION_EXTEND_DISABLE_SYSTEM_ROLES.md).
- **Custom roles** are an enterprise feature.
- Deleting or disabling a role with members requires `reassign_to` — the API forces you to pick a replacement role for existing assignees.

When the admin UI saves a role, the current user's own grants may change, which is why we refresh after self-role changes (§11).

---

## 13. Cheat sheet

### Add a new action to an existing resource

1. Add the action literal to the resource's tuple in `packages/types/src/permissions/resource-actions.ts`.
2. If the permission should be conditional, add it (and its allowed conditions) to `packages/types/src/permissions/conditions.ts` (`PERMISSION_CONDITIONS_BY_PERMISSION`).
3. Add a `getCan…` method on the relevant permission instance (`apps/web/core/store/<entity>/permissions/root.ts`) that calls `this.args.can({ resource, action, ... })`.
4. Surface it in the `TEntityDetailPermissions` / `TEntityItemPermissions` type next to the instance.
5. Wire it up in the root assembler for the affected views.

### Add a new resource

1. Add the resource key and its action tuple to the appropriate map (`WORKSPACE_` / `PROJECT_` / `TEAMSPACE_PERMISSION_RESOURCE_ACTIONS`) in `resource-actions.ts`.
2. Create the permission instance at `apps/web/core/store/<entity>/permissions/root.ts`, following the `WorkItemPermissionsInstance` shape.
3. Define `TEntityDetailPermissions` / `TEntityItemPermissions` shapes in the same file.
4. Instantiate it from the entity store and expose it to hooks.

### Introduce a new condition

First, stop and reconsider. A new action is almost always the better answer (§2). If a new condition really is necessary:

1. Extend `PermissionCondition` / `PERMISSION_CONDITION_VALUES` in `packages/types/src/permissions/conditions.ts`.
2. Add mappings to `PERMISSION_CONDITIONS_BY_PERMISSION`.
3. Extend `PermissionConditionContext` to include the new key.
4. Derive the condition in the relevant `get<Entity>ConditionContext` function inside the entity store.

### Place a new permission instance

Always at `apps/web/core/store/<entity>/permissions/root.ts`. If the entity has nested entities with their own permission concerns (comments, updates, labels), add `apps/web/core/store/<entity>/permissions/<child>.ts` and return a child instance from the parent via a `get<Child>Permissions(…)` method.

### Which hook?

- `usePermissionAccess()` — access the `can()` evaluator and role-slug helpers. Use it in **permission instances** and **root assemblers**. Never in a leaf.
- `usePermissionScheme()` — only in `/settings/roles-and-schemes` components.
- `useRoleManagement()` — only in `/settings/roles-and-schemes` components.

---

## 14. Further reading

- [`PERMISSION_FE_REFACTOR_GUIDE.md`](./PERMISSION_FE_REFACTOR_GUIDE.md) — migration patterns, refactor checklists, layout-level conventions, quick-action prop shapes, list-vs-item rules
- [`PERMISSION_SYSTEM.md`](./PERMISSION_SYSTEM.md) — full architecture including backend (`@can` decorator, resource hierarchy, caching)
- [`PERMISSION_MATRIX.md`](./PERMISSION_MATRIX.md) — endpoint-by-endpoint permission table
- [`PERMISSION_ROLE_COMPARISON.md`](./PERMISSION_ROLE_COMPARISON.md) — what each role can do, feature by feature
- [`PERMISSION_EXTEND_DISABLE_SYSTEM_ROLES.md`](./PERMISSION_EXTEND_DISABLE_SYSTEM_ROLES.md) — rules for extending vs disabling system roles
- [`FE_API_CHANGES_ROLE_SLUG.md`](./FE_API_CHANGES_ROLE_SLUG.md) — notes on the slug migration
- [`PERMISSION_LINK_RELATIONS.md`](./PERMISSION_LINK_RELATIONS.md) — Zanzibar-style tuple traversal (backend)
- [`PERMISSION_TEAMSPACE_CONTENT_ACCESS.md`](./PERMISSION_TEAMSPACE_CONTENT_ACCESS.md) — teamspace access semantics

**Source anchors worth bookmarking:**

- `apps/web/core/store/permission-access.store.ts` — `can()`, cascade, hydration
- `apps/web/core/store/role-management.store.ts` — role CRUD
- `apps/web/core/store/permission-scheme.store.ts` — scheme CRUD
- `apps/web/core/store/work-items/permissions/root.ts` — reference permission instance
- `apps/web/core/hooks/permissions/` — route / sidebar / settings-tab access hooks
- `apps/web/core/components/initiatives/peek-overview/root.tsx` — reference assembly pattern
- `packages/types/src/permissions/` — all permission types
- `packages/utils/src/permissions/match.ts` — the matcher (62 lines)
- `packages/utils/src/permissions/string.ts` — `buildPermissionString`, `parsePermissionGrantString`

**History:** merge commit `f7c0def12b` (PR #6121, [WEB-2973]).
