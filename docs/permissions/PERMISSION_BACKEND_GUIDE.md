# Permission System — Backend Developer Guide

> **Scope:** backend Python / Django / DRF development only. Frontend developers: `PERMISSION_FE_REFACTOR_GUIDE.md`.
> **Reference data:** role × action matrix in `PERMISSION_MATRIX.md`; per-endpoint migration log in `PERMISSION_MIGRATION.md`.
> **Deep-dive:** architecture essays in `permissions/CLAUDE.md` and the focused docs (`PERMISSION_LINK_RELATIONS.md`, `PERMISSION_MANAGEMENT_AUTHORITY.md`, `PERMISSION_TEAMSPACE_CONTENT_ACCESS.md`).

---

## 30-second overview

Plane's permission system is Zanzibar-inspired RBAC with conditional grants (`+creator`, `+lead`). Every permission check resolves against tuples of the form `(subject_type, subject_id, relation, resource_type, resource_id)` stored in `ResourcePermission`. Membership models (`WorkspaceMember`, `ProjectMember`, `TeamspaceMember`) sync to these tuples automatically via `PermissionSyncMixin`.

Resources are arranged in a three-level hierarchy — `workspace > project > {workitem, page, cycle, module, ...}` — so permissions inherit upward (a workspace admin sees everything inside it).

Backend authorization happens in two layers:

| Layer          | Lives in                                               | Decides                                                              |
| -------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| **Gate**       | `@can(...)` decorator                                  | _Can this caller even attempt this action?_ Returns 403 or proceeds. |
| **Row filter** | `.authorized_for(request, permission)` queryset method | _Which rows of the collection can they actually see?_ For listings.  |

Single-resource endpoints (`retrieve`, `partial_update`, `destroy`) need only the gate. Listing endpoints need both.

---

## When to use what

```
┌─────────────────────────────────────────────────────────────────┐
│ Am I writing a view that reads/mutates…                         │
├─────────────────────────────────────────────────────────────────┤
│ …one specific resource (by pk/id)?                              │
│   → @can(ItemPermission, resource_param='pk')                   │
│                                                                 │
│ …a collection of resources (list/search/feed)?                  │
│   → @can(ScopePermission, resource_param='...') on the view     │
│   → .authorized_for(request, ItemPermission) on the queryset    │
│   → AuthorizedListingView on the class bases                    │
│                                                                 │
│ …a resource-free action (workspace settings, dashboards)?       │
│   → @can(ScopePermission, resource_param='workspace_id')        │
│                                                                 │
│ Do I need to check permission inside a handler body?            │
│   → self.has_permission(permission, context)   # PermissionMixin│
│                                                                 │
│ Am I running in a Celery task or management command?            │
│   → permission_engine.check(user=..., permission=...)           │
│                                                                 │
│ Do I need to let the frontend render buttons conditionally?     │
│   → Add PermissionSerializerMixin to the serializer             │
│                                                                 │
│ Am I granting/revoking a permission programmatically?           │
│   → grant_permission(granter, Grant(...)) / revoke_permission() │
│     (but first confirm the Membership-model auto-sync doesn't   │
│     already cover your case — it usually does)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tasks

### Protect a single-resource endpoint

**When to use.** `GET /issues/<pk>/`, `PATCH /issues/<pk>/`, `DELETE /issues/<pk>/` — anything where the URL identifies one resource.

**Pattern.**

```python
from plane.permissions import can, WorkitemPermissions

class IssueDetailEndpoint(BaseAPIView):
    @can(WorkitemPermissions.VIEW, resource_param="pk")
    def get(self, request, slug, project_id, pk):
        issue = Issue.issue_objects.get(pk=pk)
        return Response(IssueSerializer(issue).data)

    @can(WorkitemPermissions.EDIT, resource_param="pk")
    def patch(self, request, slug, project_id, pk):
        ...

    @can(WorkitemPermissions.DELETE, resource_param="pk")
    def delete(self, request, slug, project_id, pk):
        ...
```

**What happens.**

- `@can(perm, resource_param="pk")` resolves the resource by ID from `kwargs['pk']`, walks up the hierarchy (issue → project → workspace) to validate the URL's `project_id` / `slug` match the resource's actual parents (**IDOR check**), then calls `permission_engine.check(user, perm, resource_id=pk)`.
- On deny → `PermissionDenied` (403). On allow → the view runs.
- Conditional grants (`workitem:edit+creator`) are evaluated against the specific resource: the engine checks if the caller is the issue's `created_by`. No extra work in the view.

**Common mistakes.**

- Using `resource_param="project_id"` for a per-issue endpoint — the gate then only checks project-level access, letting users edit issues across projects they can see. Always use the child-ID URL param when the permission is about the child resource.
- Forgetting `@can` entirely — the request still succeeds (no implicit deny at the DRF level). There is no "fail closed" net below `@can`; the decorator is the fence.

---

### Protect a listing endpoint

**When to use.** `GET /issues/`, `GET /pages/` — any view returning a collection scoped by the caller's access. This is the _most common_ kind of view and the one that historically leaked rows.

**Pattern.**

```python
from plane.permissions import (
    AuthorizedListingView,
    WorkitemPermissions,
    WorkspacePermissions,
    can,
)

class WorkItemListWorkspaceEndpoint(AuthorizedListingView, BaseAPIView):
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug):
        # Canonical variable order: authorize FIRST, snapshot total_count_queryset
        # SECOND, annotate / prefetch / order LAST. This ensures total_count
        # and total_results reflect only rows the caller can see.
        queryset = Issue.issue_objects.filter(workspace__slug=slug)
        queryset = queryset.authorized_for(request, WorkitemPermissions.VIEW)

        total_count_queryset = queryset  # snapshot AFTER authorize
        queryset = self._annotate(queryset)
        return self.paginate(
            request=request,
            queryset=queryset,
            total_count_queryset=total_count_queryset,
            ...
        )
```

**Three cooperating pieces.**

1. **`@can(ScopePermission, ...)`** — scope-membership gate. Use `WorkspacePermissions.VIEW` (or `ProjectPermissions.VIEW` for project-scoped listings), **not** the item permission. Item permissions like `workitem:view` may not exist at workspace scope for non-admin roles.
2. **`.authorized_for(request, ItemPermission)`** — row filter. Calls `permission_engine.get_accessible_resources_with_conditions(...)`, handles the workspace-admin fast path, merges grants across direct + teamspace-link paths (deny wins > unconditional upgrades conditional > conditionals union), and narrows rows in guest-relation projects to `created_by=request.user` via `workitem:view+creator`.
3. **`AuthorizedListingView` mixin** — `finalize_response` check enforces that `.authorized_for()` was called. Omitting the call returns a structured 500 with `code="listing_authorization_misconfigured"`.

**Public listings (no per-row authorization).** Use the explicit bypass:

```python
queryset = Project.objects.filter(network=ProjectNetwork.PUBLIC)
queryset = queryset.authorization_not_required(request)   # searchable, reviewable
```

**Common mistakes.**

- Putting `.authorized_for()` _after_ annotations/filters so `total_count_queryset` snapshots an authorized set but the displayed queryset has already been annotated — or vice versa. Stick to the canonical variable order above.
- Asserting on `response.data["count"]` in tests — that's current-page length. Use `total_count` / `total_results` for the authorization-sensitive total.
- Using `.authorized_for()` on a model without `PermissionMeta` — raises `PermissionConfigurationError`. See the "Add a new resource type" task.

---

### Check a permission programmatically

**When to use.** Inside a handler body, when the gate permission isn't sufficient and you need a secondary check (e.g., "only show this field if the caller can manage the project").

**Pattern A — inside a DRF view (use `PermissionMixin`):**

```python
from plane.permissions import PermissionContext, PermissionMixin, ProjectPermissions

class ProjectDashboardEndpoint(PermissionMixin, BaseAPIView):
    @can(ProjectPermissions.VIEW, resource_param="project_id")
    def get(self, request, slug, project_id):
        data = {...}
        # Show management section only to project admins
        if self.has_permission(
            ProjectPermissions.MANAGE,
            PermissionContext.project(project_id, request.workspace_id),
        ):
            data["management"] = build_admin_section(...)
        return Response(data)
```

**Pattern B — inside a Celery task / management command (no `self`):**

```python
from plane.permissions import permission_engine, WorkitemPermissions

def some_celery_task(user_id, issue_id, workspace_id):
    result = permission_engine.check(
        user=user_id,
        permission=WorkitemPermissions.EDIT,
        resource_id=issue_id,
        workspace_id=workspace_id,
    )
    if not result:
        return  # deny
    ...
```

**Pattern C — raising check (use when you want to short-circuit with 403):**

```python
self.check_can(ProjectPermissions.MANAGE, PermissionContext.project(project_id, ws_id))
# Raises PermissionDenied if not allowed; returns True otherwise.
```

**What happens.**

- `PermissionContext` factory methods build the scope: `PermissionContext.workspace(ws_id)`, `PermissionContext.project(project_id, ws_id)`, `PermissionContext.teamspace(teamspace_id, ws_id)`, `PermissionContext.resource(scope_id, workspace_id=..., project_id=..., resource_type=...)`.
- `permission_engine.check()` returns an `AccessResult`. `bool(result)` is `True` for unconditional allow. Conditional results carry a `conditions` tuple — don't treat them as booleans without deciding how to handle them.
- All checks are cached per-request (5-minute TTL, versioned). A repeated check on the same `(user, permission, context)` within a request hits the cache.

**Common mistakes.**

- Calling `permission_engine.check()` from a view when `self.has_permission()` would work — the mixin version is simpler and uses `self.request.user` automatically.
- Building `PermissionContext` by hand with wrong `scope_id` / `workspace_id` / `project_id` — always use the factory methods.

---

### Return `_permissions` on an API response

**When to use.** The frontend needs to render buttons conditionally ("show Edit only if the user can edit this resource"). Computing permissions per-action client-side is wasteful; serializing them server-side is cheap and cached.

**Pattern.**

```python
from plane.permissions.serializers import PermissionSerializerMixin

class ProjectSerializer(PermissionSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = (...)
        permission_resource_type = "project"    # required
        include_permissions = True              # default True
```

**What happens.**

- `PermissionSerializerMixin` injects `_permissions` into the output: `{"relation": "contributor", "permission_grants": ["project:view", "workitem:view", ...]}`.
- For list endpoints, `PermissionListSerializer` pre-computes permissions for the whole page in one batch query — O(1) per item, not N per-item round trips.
- Users with no tuple on the resource get `{"relation": null, "permission_grants": []}`.

**Common mistakes.**

- Omitting `permission_resource_type` — the mixin silently skips and returns a response without `_permissions`. Always declare it on `Meta`.
- Using the mixin on a serializer for a model that has no `ResourcePermission` tuples (e.g., a pure read-only analytics model). `_permissions` will always be empty. Fine, but prefer not adding the mixin.

---

### Grant / revoke a permission (GAC)

**When to use — rare.** In most cases you don't call this directly. Membership models (`WorkspaceMember`, `ProjectMember`, etc.) inherit `PermissionSyncMixin` and automatically call `grant_permission` on save and `revoke_permission` on delete. Manual grants are for inline overrides — e.g., temporarily giving a specific user `workitem:manage` on a specific project, beyond what their role allows.

**Pattern — grant:**

```python
from plane.permissions import permission_engine
from plane.permissions.grants import Grant, grant_permission

grant_permission(
    granter=request.user,
    grant_obj=Grant(
        subject_type="user",
        subject_id=target_user.id,
        relation="contributor",
        resource_type="project",
        resource_id=project.id,
        workspace_id=workspace.id,
        permissions_grant=["workitem:manage"],   # inline grants on top of role
        permissions_deny=[],                      # or inline denies (wins over role)
        expires_at=None,                          # or a datetime for time-bounded access
    ),
)
```

**Pattern — revoke:**

```python
from plane.permissions.grants import revoke_permission

revoke_permission(
    revoker=request.user,
    subject_type="user",
    subject_id=target_user.id,
    resource_type="project",
    resource_id=project.id,
    workspace_id=workspace.id,   # required
)
```

**What happens.**

- A `ResourcePermission` row is created or updated (via `update_or_create` on the subject×resource key).
- A `PermissionAuditLog` row is written — every grant/revoke is auditable.
- The per-user permission cache is invalidated (O(1) versioned key bump).
- The response time is dominated by the audit write, not the permission math.

**Common mistakes.**

- Manually creating `ResourcePermission` rows via the ORM instead of `grant_permission` — skips the audit log, skips cache invalidation, leaves the system in a silently-wrong state.
- Calling `grant_permission` when you should have set the caller's role via `ProjectMember.role` — the member model auto-syncs. Prefer model-level changes; drop to `grant_permission` only for genuine GAC overrides.

---

### Test a permission-gated endpoint

**When to use.** Every permission-gated endpoint needs role-matrix tests. For listings, use the shared `listing_auth` fixture + `authorized_listing_roles` parametrize.

**Pattern — contract test for a listing endpoint:**

```python
import pytest
from plane.tests.contract.conftest_listing_authorization import (
    EXPECTED_FORBIDDEN,
    authorized_listing_roles,
    expected_ids_from_fixtures,
)

@pytest.mark.contract
@pytest.mark.django_db
class TestMyListingAuthorized:
    @authorized_listing_roles
    def test_role_matrix(self, role, expected_ids_key, listing_auth, api_client):
        api_client.force_authenticate(user=listing_auth.users[role])
        response = api_client.get(f"/api/workspaces/{listing_auth.workspace.slug}/my-things/")

        if expected_ids_key == EXPECTED_FORBIDDEN:
            assert response.status_code == 403
            return

        assert response.status_code == 200
        expected = expected_ids_from_fixtures(listing_auth, expected_ids_key)
        returned = {str(row["id"]) for row in response.data["results"]}
        assert returned == {str(i) for i in expected}
        assert response.data["total_count"] == len(expected)
        assert response.data["total_results"] == len(expected)
```

**Pattern — unit test for a single-resource gate (using permission fixtures):**

```python
# Uses fixtures from plane/tests/unit/permissions/conftest.py
@pytest.mark.unit
@pytest.mark.django_db
def test_contributor_can_edit_own_issue(
    engine, perm_project, project_contributor, test_issue, member_user,
):
    from plane.permissions import WorkitemPermissions
    result = engine.check(
        user=member_user,
        permission=WorkitemPermissions.EDIT,
        resource_id=test_issue.id,
        workspace_id=perm_project.workspace_id,
    )
    assert bool(result) is True
```

**What happens.**

- `listing_auth` fixture builds a workspace with two projects, 5 issues distributed across users with different roles (owner, admin, contributor, two guests, a workspace-member-with-no-project, an outsider).
- `authorized_listing_roles` parametrize covers the full role matrix in one decorator.
- Assertions use `total_count` and `total_results` (not `count`, which is current-page length) so `total_count_queryset` divergence is caught.
- Pre-made unit fixtures in `plane/tests/unit/permissions/conftest.py`: `perm_workspace`, `perm_project`, `project_admin`, `project_contributor`, `project_guest`, `owner_user`, `member_user`, `guest_user`, `outsider_user`, `engine` (cache-disabled `PermissionEngine`).

**Common mistakes.**

- Only testing admin + regular member. The historical bugs all slipped through because guest / outsider / no-project-access cases weren't in the matrix. The shared parametrize covers them; use it.
- Testing with `--reuse-db` and hitting stale migrations. Run `pytest --create-db` when adding new role / permission / migration code.

---

### Add a new resource type (end-to-end)

**When to use.** You're adding a new kind of object that participates in the permission system — e.g., a new "Campaign" resource under Project.

**The places you touch (in order):**

1. **`ResourceType` enum** — `permissions/definitions.py`:

   ```python
   class ResourceType(str, Enum):
       CAMPAIGN = "campaign"
   ```

2. **Permission class** — same file:

   ```python
   class CampaignPermissions:
       VIEW = Permission(ResourceType.CAMPAIGN, Action.VIEW)
       CREATE = Permission(ResourceType.CAMPAIGN, Action.CREATE)
       EDIT = Permission(ResourceType.CAMPAIGN, Action.EDIT)
       DELETE = Permission(ResourceType.CAMPAIGN, Action.DELETE)
   ```

   (Registry `_PERMISSION_CLASSES` and derived `RESOURCE_ACTIONS` are auto-built — no manual entry needed.)

3. **Hierarchy registration** — `permissions/inheritance.py`, `_PARENT_DECLARATIONS`:

   ```python
   ResourceType.CAMPAIGN: (ResourceType.PROJECT, "project_id"),
   ```

   Children + scope groupings are auto-derived from this.

4. **Model resolution** — `permissions/resource_models.py`, add `ResourceType.CAMPAIGN → Campaign`. Used by `ConditionEvaluator` for creator/lead checks.

5. **Role grants** — `permissions/system_roles.py` and `permissions/permission_schemes.py`: add entries for each role × each permission. Use typed grants only:

   ```python
   CampaignPermissions.VIEW
   CampaignPermissions.DELETE & Condition.CREATOR
   WildcardGrant(ResourceType.CAMPAIGN)
   ```

6. **Model `PermissionMeta`** — on the Django model itself, if the resource will be listed. Required for `.authorized_for()`:

   ```python
   class Campaign(ProjectBaseModel):
       class PermissionMeta:
           scope_map = {
               CampaignPermissions: ScopeSpec(resource_type="project", fk="project_id"),
           }
           condition_fields = {
               Condition.CREATOR: "created_by",
           }
   ```

7. **Exports** — `permissions/__init__.py`: add `CampaignPermissions` to the public API (auto-derived from `_PERMISSION_CLASSES`, so usually no change).

**Startup validator.** `validate_permission_system_consistency()` in `inheritance.py` runs at app start and catches missing `_PARENT_DECLARATIONS` entries, unmapped resource types, etc. If you forget step 3 or 4, the app refuses to boot.

**What you don't need to touch.** `ALL_PERMISSIONS`, `PERMISSION_MAP`, `RESOURCE_ACTIONS` — all auto-derived from the registry.

---

### Add or modify a role / permission scheme

**When to use.** Granting a new permission to an existing role, adding a role slug, changing a permission scheme's contents.

**Where permissions live.**

- **Permission schemes** (`permissions/permission_schemes.py`) — named, reusable bundles of permissions. One per system role. Customer-visible name; code changes here change the customer-facing role capability.
- **System roles** (`permissions/system_roles.py`) — map slugs to permission schemes and levels. The slug is what appears in `ResourcePermission.relation`.

**Pattern — grant a new permission to contributors:**

```python
# permission_schemes.py
"contributor": {
    "name": "Project Contributor",
    "namespace": "project",
    "permissions": [
        ...,
        WorkitemPermissions.ARCHIVE,    # ← new entry
        ...,
    ],
},
```

Then run the cache invalidation (normally auto via `Role.save()` signals; in dev: `cache.clear()`).

**Pattern — add a conditional grant:**

```python
WorkitemPermissions.DELETE & Condition.CREATOR
```

This uses the `&` operator overload that returns a `ConditionalGrant`. The engine's `ConditionEvaluator` resolves `creator` against the model's `PermissionMeta.condition_fields` (defaulting to `created_by_id` if not declared).

**Mandatory doc updates when you change a role grant:**

1. `docs/permissions/PERMISSION_MATRIX.md` — update the role access columns.
2. `docs/permissions/PERMISSION_MIGRATION.md` — document the grant change.
3. `designs/permissions/permission-role-alignment-review.md` — update per-role permission tables.

**Common mistakes.**

- Adding a raw string like `"workitem:archive"` instead of a typed `Permission` — violates the type-safety invariant (`system_roles.py` docstring: "No raw strings in role definitions"). The typed form catches typos at import time.
- Forgetting to update the three docs — the migration workflow bakes this in (see `CLAUDE.md`).

---

### Custom roles (workspace-admin-authored)

**What exists today.** Workspace admins can create custom `Role` records (via `Role.objects.create(..., is_system=False, workspace=ws)`) that compose any mix of system + custom `PermissionScheme` entries. These roles behave identically to system roles at resolution time — `RoleLookup.has_permission` / `get_conditions` consult compiled system permissions first, then cached custom-role permissions from the DB.

**What the engine does with them.**

- Compiled system role permissions are in-memory O(1) lookups. Custom roles hit Redis (24-hour TTL, invalidated on `Role.save()` via `ChangeTrackerMixin`).
- The permission engine treats both identically — no special casing in `check()` or `get_accessible_resources_with_conditions()`.

**What you don't need to do.** Nothing backend-side when a customer creates a custom role. The membership sync (`PermissionSyncMixin`) handles the relation string, the cache gets the perm set, and the engine resolves against it.

---

### Extend with a new condition (e.g., `+assignee`)

**When to use.** Adding a new conditional grant that isn't creator or lead.

**The places you touch:**

1. **`Condition` enum** — `permissions/definitions.py`:

   ```python
   class Condition(str, Enum):
       CREATOR = "creator"
       LEAD = "lead"
       ASSIGNEE = "assignee"    # new
   ```

2. **Engine evaluation** — `permissions/engine/conditions.py`:
   - For simple field-based conditions (like `creator`, which maps to `created_by`), the current `ConditionEvaluator` resolves via the model's `PermissionMeta.condition_fields`. Nothing to change if your condition can be expressed as "this field matches user".
   - For complex conditions (like `assignee`, where assignees live in a M2M table `IssueAssignee`), add a special-case `_eval_condition_assignee` method that does the right query.

3. **Queryset filter helper** — `permissions/queryset.py`:
   - Field-based conditions use the model's `condition_fields` + `Q(field=user)`.
   - M2M conditions (like `assignee`) need either a custom branch in `.authorized_for()` or a richer `condition_fields` value (e.g., a callable that returns a `Q` object). Prefer the callable approach to keep the system extensible.

4. **Role declarations** — grant the new condition in `permission_schemes.py`:

   ```python
   WorkitemPermissions.EDIT & Condition.ASSIGNEE
   ```

5. **Model meta on affected models** — declare the field mapping:
   ```python
   class Issue(ProjectBaseModel):
       class PermissionMeta:
           condition_fields = {
               Condition.CREATOR: "created_by",
               Condition.ASSIGNEE: "issue_assignee__assignee",    # M2M reverse path
           }
   ```

**The engine-queryset parity invariant.** Whatever `ConditionEvaluator` decides for a single resource, `.authorized_for()` must produce the same set of rows when applied to a queryset. If they drift, a user can pass the gate but see different rows than the per-row check would allow (or vice versa). Write a regression test that exercises both paths for any new condition.

---

## Architecture at a glance

```
          ┌──────────────────┐
          │ ResourcePermission│   (subject_type, subject_id, relation,
          │   tuple store     │    resource_type, resource_id,
          └────────┬──────────┘    permissions_grant, permissions_deny,
                   │                expires_at)
            writes │ via PermissionSyncMixin
                   │
     ┌─────────────┴──────────────┐
     │ WorkspaceMember / ProjectMember / TeamspaceMember │
     │  (auto-sync on save() via ChangeTrackerMixin)     │
     └─────────────────────────────┘

     reads via
     ┌────────────────────────────────────────────────┐
     │ PermissionEngine (facade)                      │
     │   ├── HierarchyResolver  (parent chain, IDOR)  │
     │   ├── TupleFetcher       (direct + link tuples)│
     │   ├── RoleLookup         (role→permissions)    │
     │   ├── ConditionEvaluator (creator/lead)        │
     │   ├── PermissionResolver (the Zanzibar loop)   │
     │   └── PermissionQueries  (accessible_resources)│
     └────────────┬───────────────────────────────────┘
                  │
     ┌────────────┴───────────────────────────────────┐
     │ @can decorator    PermissionMixin    @serializer│
     │ (gate)            .has_permission()  _permissions│
     │                                                  │
     │ .authorized_for(request, permission)             │
     │   — reads model.PermissionMeta.scope_map,        │
     │     calls get_accessible_resources_with_conditions│
     │     builds the row-filter Q.                     │
     └──────────────────────────────────────────────────┘
```

**Resolution order** inside `PermissionEngine.check()`, per hierarchy level:

1. Resource-ownership validation (IDOR check — caller's `workspace_id`/`project_id` must match the resource's actual parents).
2. Explicit `permissions_deny` on the tuple → **deny**.
3. Explicit `permissions_grant` on the tuple → **allow** (unconditional).
4. Role's unconditional permissions → **allow**.
5. Role's conditional permissions → evaluate against the resource → allow if condition holds (or defer if `defer_conditions=True` was passed).
6. Link-relation traversal (teamspace → project) — repeat 2–5 on linked tuples.
7. Inherited from parent (project → workspace) — recurse up.
8. Default → **deny**.

For deep-dives: `permissions/CLAUDE.md` covers the full engine design; `PERMISSION_LINK_RELATIONS.md` walks the teamspace traversal; `PERMISSION_MANAGEMENT_AUTHORITY.md` explains who can grant what.

---

## Glossary

| Term                             | Meaning                                                                                                                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Permission string**            | `"{resource_type}:{action}"`, e.g., `"workitem:view"`. The canonical string form; `WorkitemPermissions.VIEW` is the typed form.                                                                                     |
| **Conditional grant**            | Permission that only applies when a condition holds: `"workitem:view+creator"`. Compose via `Permission & Condition.CREATOR`.                                                                                       |
| **Relation**                     | The role slug attached to a `ResourcePermission` tuple: `"admin"`, `"contributor"`, `"commenter"`, `"guest"`, or a custom role slug.                                                                                |
| **Scope (in PermissionContext)** | The resource layer a check happens at: `workspace`, `project`, `teamspace`, or `resource` (for specific-resource checks).                                                                                           |
| **Resource type**                | The Plane-defined kind of object: `workspace`, `project`, `workitem`, `page`, `cycle`, `module`, etc. Listed in `ResourceType` enum.                                                                                |
| **Subject type**                 | Who the tuple is about: `user` or `teamspace`. (Teamspace tuples enable link-relation traversal.)                                                                                                                   |
| **IDOR check**                   | The parent-chain walk the engine does before returning `allow` — verifies the caller's URL parameters match the resource's actual parent chain, preventing cross-workspace / cross-project access via crafted URLs. |
| **GAC**                          | Grant-Access Control — the inline `permissions_grant` / `permissions_deny` arrays on a `ResourcePermission` tuple. Wins over role defaults.                                                                         |
| **Link relation**                | A tuple whose subject is a teamspace, granting members of that teamspace access to the resource transitively. Enables "grant a whole team access to project X".                                                     |
| **`defer_conditions=True`**      | Legacy flag on `@can` that stores conditions on the request and expects the view to filter by them manually. Superseded for listing endpoints by `.authorized_for()`.                                               |

---

## Troubleshooting

### My endpoint returns 403 but the user "should" have access

1. **Check the exact permission and scope.** Log the `permission_engine.check(...)` call with `PermissionContext` explicitly — is the context scope the one you expect? A `PermissionContext.workspace(ws_id)` check does not see a project tuple.
2. **Check the role.** `Role.objects.filter(slug=..., workspace=...)` — does the user's `ProjectMember.role_ref` point to the role you think?
3. **Check the tuple.** `ResourcePermission.objects.filter(subject_id=user.id, workspace_id=ws.id)` — is the tuple there? Did the `ProjectMember` save fire `PermissionSyncMixin`? (A `bulk_create`/`bulk_update` bypasses it — must dispatch manually.)
4. **Check the permission_schemes.** `get_compiled_permissions(role_slug, namespace)` returns the in-memory set. If a permission is missing, the scheme is the source of truth.

### My listing returns empty, or raises `listing_authorization_misconfigured`

1. **Missing `.authorized_for()`.** Look at the response body — `code="listing_authorization_misconfigured"` means `AuthorizedListingView` fired. Add the call.
2. **Wrong permission in `.authorized_for()`.** You're filtering with `WorkitemPermissions.VIEW` but the model's `PermissionMeta.scope_map` has a different permission class. Check the mapping.
3. **Missing `PermissionMeta` on the model.** `PermissionConfigurationError` at request time. Add the nested meta class (see "Add a new resource type").
4. **Scope mismatch.** The `.authorized_for()` call uses a permission whose parent (from `_PARENT_DECLARATIONS`) is `project`, but the model's `scope_map` declares `workspace` — engine walks projects, model expects workspace_id filter. Align them.

### My test passes locally but fails in CI with `role_ref_id column does not exist`

Stale test DB. Run `pytest --create-db` once to rebuild.

### My `@can` check passes but `.authorized_for()` returns empty rows

Gate/filter divergence — the engine's single-resource check says "yes", but the accessible-resources query says "no". Usually one of:

- A conditional grant that the gate evaluates against `resource_param` (pk) but the listing query doesn't see because the model's `condition_fields` doesn't map the condition.
- Deny applied per-resource in the listing path but not evaluated by the gate (or vice versa).

Add a regression test asserting both paths agree for the same user and resource. The primitive `get_accessible_resources_with_conditions` is designed to match the engine resolver — divergences are bugs, not tradeoffs.

### The permissions cache seems stale after I changed a role

Role changes trigger cache invalidation via `ChangeTrackerMixin` on `Role.save()`. If you're mutating via raw SQL or `bulk_update`, the signal doesn't fire. Manual nuke: `cache.clear()` (fine in dev, terrible in prod).
