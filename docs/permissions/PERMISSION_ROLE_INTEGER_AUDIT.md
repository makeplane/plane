# Inline Role-Integer Checks Audit

Audit of all hardcoded role-integer checks across the codebase that would break with custom roles. Excludes test files, migration files, and the permissions module (`plane/permissions/`).

**Date:** 2026-02-15

---

## Background: Why This Matters

The current role system uses fixed integers to represent authority levels:

| Integer | Enum          | Meaning                                                                  |
| ------- | ------------- | ------------------------------------------------------------------------ |
| 25      | (Owner)       | Workspace owner (not a settable role; derived from `Workspace.owner` FK) |
| 20      | `ROLE.ADMIN`  | Admin — full control over workspace/project settings and members         |
| 15      | `ROLE.MEMBER` | Member / Contributor — can create and edit content                       |
| 10      | (Commenter)   | Commenter — view-only + can comment (project-level only)                 |
| 5       | `ROLE.GUEST`  | Guest — minimal access, scoped to own content                            |

The integers serve a dual purpose today:

1. **Identity** — "is this user an admin?" (`role == 20`)
2. **Ordering** — "does this user outrank that user?" (`role > other_role`)

Custom roles break both assumptions. A custom "Project Lead" might have role integer 17 — it's neither Admin (20) nor Member (15), so identity checks miss it. And its position in the integer ordering may not match its actual authority, so ordinal comparisons produce wrong results.

The `@can` permission decorator already solves the gate-at-the-door problem by checking permission strings instead of role integers. But **business logic inside method bodies** still relies on raw integers for decisions like "can this user remove that user?" or "should we show admin-level detail in the response?" This audit catalogs every such location.

---

## Summary

**~55 files, ~150+ locations** with hardcoded role-integer checks.

| Category                           | Description                                        | Locations | Risk     | Breaks Custom Roles?                                                                |
| ---------------------------------- | -------------------------------------------------- | --------- | -------- | ----------------------------------------------------------------------------------- |
| 1. Hardcoded `role=20` assignments | Creating admins assumes "admin = 20"               | ~30       | Medium   | Only if custom roles need to create members with non-standard admin values          |
| 2. Ordinal comparisons             | `role > 5`, `role >= 15`, `role < member.role`     | ~25       | High     | Yes — custom role integers don't map to the expected hierarchy                      |
| 3. Hardcoded boundary at `10`      | Billing splits paid (>10) vs free (<=10) seats     | ~25       | Critical | Yes — a custom role with integer 12 would be "paid" even if it's a viewer-tier role |
| 4. Fixed allowed-set checks        | `role in [5, 15]`, `not in [ADMIN, MEMBER, GUEST]` | ~10       | Critical | Yes — custom roles are actively rejected at input validation                        |
| 5. ORM queryset filters            | `role__lte=15`, `role__gte=15`, `role__gt=5`       | ~20       | High     | Yes — custom roles at unexpected integers get wrong access tier                     |

---

## Category 1: Hardcoded `role=20` Assignments (~30 locations)

### What these do

These assign `role=20` (Admin) when creating new workspace or project members in setup flows: project creation (creator becomes admin), integration bot provisioning, data import, workspace seeding, and ownership transfer.

### Why they exist

When a user creates a project, they should become its admin. When an integration bot joins a workspace, it needs admin-level access to manage resources. These are bootstrapping operations where the role is always "the highest available."

### Risk with custom roles

**Medium.** These are mostly write-path operations that create an initial membership. If custom roles don't change the semantics of "admin" (i.e., admin is still integer 20), these are fine. They break only if custom roles redefine what integer represents "full control" — unlikely in practice since custom roles are additive (new roles between existing ones), not replacements.

### Suggested fix

Replace `role=20` with `role=ROLE.ADMIN.value` everywhere (for readability and grep-ability), and eventually provide a `RoleRegistry.admin_role()` or similar helper that returns the canonical admin role integer for a given workspace/project context.

### Locations

#### `plane/app/views/workspace/base.py`

| Line | Code       | Context                                                                                                                                                               |
| ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 144  | `role=20,` | **Workspace creation** — the creating user is added as a workspace member with admin role. This is the bootstrap step; without it, nobody could manage the workspace. |

#### `plane/app/views/workspace/member.py`

| Line | Code                                                                       | Context                                                                                                                                                                                                                                                                       |
| ---- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 180  | `project_projectmember__role=20,`                                          | **Workspace member removal** — when removing a workspace member, this annotation counts projects where the member is the sole admin (`role=20`). The intent is "don't remove a user who is the last admin of any project." Used in a `Count` annotation with `filter=Q(...)`. |
| 238  | `workspace_member.role == 20`                                              | **Leave workspace** — checks if the leaving user is an admin. If they're the last admin (next line counts `role=20`), block the leave to prevent an admin-less workspace.                                                                                                     |
| 239  | `WorkspaceMember.objects.filter(..., role=20, is_active=True).count() > 1` | **Leave workspace** — counts remaining active admins. If only 1 (the leaving user), the leave is blocked.                                                                                                                                                                     |

#### `plane/app/views/project/base.py`

| Line | Code                     | Context                                                                                                                                         |
| ---- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 381  | `role=ROLE.ADMIN.value,` | **Project creation** — creator is added as project admin. Uses the enum form (better than raw `20`), but still pinned to the fixed admin value. |
| 390  | `role=ROLE.ADMIN.value,` | **Project creation** — `ProjectUserProperty` creation for the admin user.                                                                       |
| 530  | `role=ROLE.ADMIN.value,` | **Project template creation** — template creator becomes project admin.                                                                         |

#### `plane/app/views/integration/slack.py`

| Line | Code                                                                                                      | Context                                                                                                                                                                                                                                                    |
| ---- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 69   | `ProjectMember.objects.get_or_create(member=workspace_integration.actor, role=20, project_id=project_id)` | **Slack integration setup** — the integration actor is given admin role in the project. The `get_or_create` means if they're already a member with a different role, this creates a duplicate (the `role=20` is part of the lookup, not just the default). |

#### `plane/app/views/integration/base.py`

| Line | Code                                                            | Context                                                                                                                               |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 148  | `WorkspaceMember.objects.create(..., member=bot_user, role=20)` | **Integration installation** — bot users get admin-level workspace membership so they can access all resources the integration needs. |

#### `plane/app/views/integration/github.py`

| Line | Code                                                                                                      | Context                                                                                           |
| ---- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 125  | `ProjectMember.objects.get_or_create(member=workspace_integration.actor, role=20, project_id=project_id)` | **GitHub repo sync** — same pattern as Slack: integration actor gets admin in the synced project. |

#### `plane/app/views/user/base.py`

| Line | Code                                                                  | Context                                                                                                                                                  |
| ---- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 279  | `When(Q(role=20, is_active=True) & ~Q(member=request.user), then=1),` | **User workspace list** — annotates each workspace with a count of other admins (`role=20`). Used to show a warning badge if the user is the sole admin. |
| 300  | `When(Q(role=20, is_active=True) & ~Q(member=request.user), then=1),` | **Same endpoint, duplicate annotation** — appears in a second queryset branch for a different response format.                                           |

#### `plane/app/views/view/base.py`

| Line | Code                                                                 | Context                                                                                                                                                                                                       |
| ---- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 141  | `workspace__slug=slug, member=request.user, role=20, is_active=True` | **Workspace view deletion** — checks if the requesting user is a workspace admin before allowing deletion of another user's workspace view. Admins can delete any view; non-admins can only delete their own. |
| 640  | `role=20,`                                                           | **Project view deletion** — same pattern at project level: checks if user is project admin (`role=20`) before allowing deletion of someone else's view.                                                       |

#### `plane/api/views/project.py`

| Line | Code                                                                                            | Context                                                                     |
| ---- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 316  | `ProjectMember.objects.create(project_id=serializer.instance.id, member=request.user, role=20)` | **Public API project creation** — same as `app/` layer: creator gets admin. |
| 324  | `role=20,`                                                                                      | **Public API project creation** — `ProjectUserProperty` for the new admin.  |

#### `plane/api/views/issue.py`, `module.py`, `cycle.py`

| File        | Line | Context                                                                                                                         |
| ----------- | ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| `issue.py`  | 920  | **Issue import** — imported issues create project member with `role=20` for the importing user if they're not already a member. |
| `module.py` | 523  | **Module import** — same pattern.                                                                                               |
| `cycle.py`  | 585  | **Cycle import** — same pattern.                                                                                                |

#### `plane/ee/views/app/project/template.py`

| Line | Code       | Context                                                                                 |
| ---- | ---------- | --------------------------------------------------------------------------------------- |
| 239  | `role=20,` | **Template-based project creation** — creator of project from template gets admin role. |

#### `plane/ee/views/app/teamspace/base.py`

| Line | Code                                    | Context                                                                                              |
| ---- | --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 51   | `role=ROLE.ADMIN.value,`                | **Teamspace creation** — creator gets admin membership in the teamspace.                             |
| 96   | `role=ROLE.ADMIN.value, is_active=True` | **Teamspace deletion** — verifies the requesting user is a teamspace admin before allowing deletion. |

#### `plane/ee/views/app/oauth/application.py`

| Line | Code                                                                  | Context                                                                                                                                                                                                    |
| ---- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 304  | `workspace=workspace, member=request.user, role=ROLE.ADMIN.value`     | **OAuth app management** — only workspace admins can create/manage OAuth applications. This is an authorization check disguised as a membership query.                                                     |
| 502  | `if user_workspace_member["role"] == ROLE.ADMIN.value or (`           | **OAuth app installation** — admins can always install; members can only install if the app is already installed (adding themselves). This is role-based business logic that should be a permission check. |
| 503  | `user_workspace_member["role"] == ROLE.MEMBER.value and is_installed` | **OAuth app installation** — continued from above.                                                                                                                                                         |

#### `plane/ee/views/app/intake/base.py`

| Line        | Code                    | Context                                                                                                                                                    |
| ----------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 85, 89, 109 | `role=ROLE.ADMIN.value` | **Intake settings** — only project admins can enable/disable/configure intake (triage) for a project. Three separate queryset filters checking admin role. |

#### `plane/ee/management/commands/change_ownership.py`

| Line | Code                                                                        | Context                                                             |
| ---- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 60   | `WorkspaceMember.objects.create(workspace=workspace, member=user, role=20)` | **Ownership transfer CLI** — new owner gets admin membership.       |
| 62   | `workspace_member.role = 20`                                                | **Ownership transfer CLI** — if already a member, promote to admin. |

#### `plane/license/api/views/workspace.py`

| Line | Code       | Context                                                                                       |
| ---- | ---------- | --------------------------------------------------------------------------------------------- |
| 103  | `role=20,` | **License management** — verifies user is workspace admin before allowing license operations. |

#### Background Tasks

| File                                              | Line       | Context                                                                                                                         |
| ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `plane/bgtasks/create_faker.py`                   | 48, 65, 79 | **Faker data generation** — test data creates workspace/project members with admin role. Low risk — only used in dev/test.      |
| `plane/bgtasks/dummy_data_task.py`                | 76, 92     | **Dummy data task** — same as faker. Dev-only.                                                                                  |
| `plane/bgtasks/copy_project_data_task.py`         | 249        | **Project duplication** — when copying a project, the requesting user becomes admin of the copy.                                |
| `plane/bgtasks/importer_task.py`                  | 189        | **Data import** — importer user gets admin in the imported project.                                                             |
| `plane/bgtasks/workspace_seed_task.py`            | 545        | **Workspace seeding** — seed data creates admin memberships.                                                                    |
| `plane/bgtasks/issue_version_sync.py`             | 86         | **Version sync** — finds an admin member to attribute version sync operations to.                                               |
| `plane/bgtasks/issue_description_version_sync.py` | 40         | **Description version sync** — same pattern as above.                                                                           |
| `plane/ee/bgtasks/app_bot_task.py`                | 58         | **App bot provisioning** — bot gets `ROLE.MEMBER.value` (15), not admin. Pinned to Member; a custom "bot" role would be better. |

#### GraphQL

| File                                        | Line    | Context                                                                                                                                       |
| ------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `plane/graphql/queries/search.py`           | 59      | **Search** — checks if user is workspace admin (`role=20`) to determine search scope. Admins see all projects; non-admins see only their own. |
| `plane/graphql/mutations/project.py`        | 93, 102 | **Project creation (GraphQL)** — creator gets admin role.                                                                                     |
| `plane/graphql/mutations/workspace/base.py` | 198     | **Workspace creation (GraphQL)** — creator gets admin role.                                                                                   |
| `plane/graphql/queries/users/delete.py`     | 33      | **User deletion check** — finds workspaces where user is the sole admin.                                                                      |
| `plane/graphql/mutations/user/delete.py`    | 39      | **User deletion** — same as above.                                                                                                            |

---

## Category 2: Ordinal Comparisons (~25 locations)

### What these do

These use `<`, `>`, `<=`, `>=` operators on role integers to make hierarchy decisions: "can user A remove user B?", "is this user at least a Member?", "is this user higher than a Guest?"

### Why they exist

The integer system was designed so that higher integers = more authority. This makes hierarchy checks trivial: `if requester.role < target.role: deny()`. The old system had a fixed, linear hierarchy (5 < 10 < 15 < 20), so ordinal comparison was a valid proxy for "outranks."

### Risk with custom roles

**High.** This is the most structurally fragile pattern. Custom roles destroy the linear ordering assumption. Examples:

- A "Security Reviewer" role (integer 12) should be able to view all issues but not edit them. `role >= 15` ("at least Member") would exclude them from assignee lists, even though they should be visible.
- A "Team Lead" role (integer 18) might have admin privileges for members but not for settings. `role < project_member.role` would let a Team Lead remove a Member (18 > 15), but the business rule might be that they can only manage their own team's members.
- Two custom roles with the same integer but different permissions would compare as "equal authority" even though one might outrank the other in a specific domain.

### Suggested fix

Replace ordinal comparisons with permission checks or explicit role-relationship queries. For hierarchy checks ("can A manage B?"), introduce a `can_manage(actor_role, target_role)` function that consults a role hierarchy graph instead of comparing integers. For tier checks ("is at least Member?"), check for the specific permission the code actually needs (e.g., `has_permission(user, "project.member:view_detail")`).

### Locations

#### `plane/app/views/workspace/member.py`

| Line | Code                                                       | Context                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 72   | `workspace_member.role > 5`                                | **Member list** — determines which serializer to use. If the requesting user's role is above Guest (>5), they get `WorkspaceMemberAdminSerializer` which includes more detail (email, join date, etc.). Guests get `WorkSpaceMemberSerializer` with just id/member/role. **Problem with custom roles:** a custom role with integer 8 would get admin-level detail even if it's functionally a viewer.                                                                                                                                                  |
| 91   | `workspace_member.role > ROLE.GUEST.value`                 | **Member retrieve** — same logic as line 72 but for single-member retrieval. Uses enum form instead of raw `5`.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 167  | `requesting_workspace_member.role < workspace_member.role` | **Member removal** — prevents a user from removing someone with a higher role. This is the core hierarchy check: "you can't kick your boss." **Problem with custom roles:** if both users have custom roles, the integer comparison may not reflect actual authority. A "Department Head" (role 18) should arguably be able to remove a "Contributor" (role 15) but not an "Admin" (role 20). With custom roles, a "Senior Viewer" (role 12) couldn't remove a "Junior Member" (role 15) even if organizational hierarchy says they should be able to. |

#### `plane/app/views/workspace/user.py`

| Line | Code                                     | Context                                                                                                                                                                                                                                                                                                                             |
| ---- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 293  | `requesting_workspace_member.role >= 15` | **User profile view** — only Members and above (role >= 15) can see other users' project-level stats (created issues, completed issues per project). Guests and below see no project breakdown. **Problem with custom roles:** a custom "Commenter+" role (integer 12) would be excluded even if it logically should see this data. |

#### `plane/app/views/workspace/invite.py`

| Line | Code                                                                                       | Context                                                                                                                                                                                                                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 72   | `if len([email for email in emails if int(email.get("role", 5)) > requesting_user.role]):` | **Workspace invitation** — prevents inviting someone with a higher role than your own. You can't invite an admin if you're a member. Uses hardcoded default 5 (Guest) if role not specified. **Problem with custom roles:** ordinal comparison may allow/deny invitations incorrectly when custom role integers don't reflect actual authority. |

#### `plane/app/views/project/member.py`

| Line | Code                                                                                           | Context                                                                                                                                                                                                                                                                                                                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 95   | `if workspace_member_role in [20] and member_roles.get(member) in [5, 15]:`                    | **Project member addition** — prevents adding a workspace admin (20) as a project guest (5) or member (15). The intent: "workspace admins should be project admins." **Problem with custom roles:** only checks the specific integers 5, 15, 20. A custom role with integer 18 would bypass this check entirely, potentially allowing a workspace admin to be added as a lower role in a project. |
| 101  | `if workspace_member_role in [5] and member_roles.get(member) in [15, 20]:`                    | **Project member addition** — reverse check: prevents adding a workspace guest (5) as a project member (15) or admin (20). The intent: "you can't have higher project role than workspace role." **Problem with custom roles:** same — custom role integers are not in the checked sets, so the constraint is silently bypassed.                                                                  |
| 310  | `requesting_project_member.role > ROLE.GUEST.value`                                            | **Member retrieval** — same serializer-switching pattern as workspace member list. Non-guests get the admin serializer with full details.                                                                                                                                                                                                                                                         |
| 341  | `if workspace_role in [5] and int(request.data.get("role", project_member.role)) in [15, 20]:` | **Member role update** — prevents promoting a workspace guest's project role above their workspace role. Only checks the specific integers `[5]` and `[15, 20]`. Custom roles bypass this constraint.                                                                                                                                                                                             |
| 349  | `int(request.data.get("role", project_member.role)) > requested_project_member.role`           | **Member role update** — prevents promoting someone to a role higher than your own (unless you're a workspace admin). This is the classic hierarchy check. **Problem with custom roles:** the `>` comparison assumes higher integer = more authority.                                                                                                                                             |
| 400  | `requesting_project_member.role < project_member.role`                                         | **Member removal** — prevents removing someone with a higher role. Same hierarchy issue as workspace member removal (line 167 above).                                                                                                                                                                                                                                                             |

#### `plane/app/views/project/invite.py`

| Line | Code                                                                       | Context                                                                                                                                                                                                                                                                                                                                       |
| ---- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 88   | `if workspace_role in [5, 20] and workspace_role != email.get("role", 5):` | **Project invitation** (unused viewset) — constrains invitation role based on workspace role. If workspace role is Guest (5) or Admin (20), the invitation role must match. Members (15) can invite at any role. **Problem with custom roles:** custom role integers aren't in `[5, 20]`, so the constraint doesn't apply.                    |
| 234  | `workspace_member.role != ROLE.ADMIN.value`                                | **Project join** (`UserProjectJoinEndpoint`) — only workspace admins can join secret (private) projects. Non-admins are blocked. **Problem with custom roles:** a custom role with admin-equivalent permissions but integer != 20 would be blocked from joining secret projects.                                                              |
| 321  | `role=(15 if project_invite.role >= 15 else project_invite.role),`         | **Token-based project join** (ProjectJoinEndpoint) — caps the workspace role assignment at 15 (Member) when an invited user joins. If the invite role is Admin (20), the workspace membership is set to Member (15) instead. **Problem with custom roles:** the `>= 15` comparison would incorrectly cap a custom role with integer 18 to 15. |

#### `plane/app/views/intake/base.py`

| Line | Code                                      | Context                                                                                                                                                                                                                                                                                                                              |
| ---- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 395  | `project_member.role <= ROLE.GUEST.value` | **Intake issue detail** — guests and below can only see their own intake issues. Non-guests see all. **Problem with custom roles:** a custom role with integer 8 ("Viewer") would be treated as above-Guest and see all intake issues.                                                                                               |
| 446  | `project_member.role <= ROLE.GUEST.value` | **Intake issue update** — same pattern: guests can only update their own intake issues.                                                                                                                                                                                                                                              |
| 475  | `project_member.role > ROLE.MEMBER.value` | **Intake issue status change** — only users above Member (i.e., Admin) can change intake issue status (accept/reject triage items). **Problem with custom roles:** a "Triage Manager" custom role (integer 18) would pass this check, but a "Senior Reviewer" (integer 12) would not, regardless of their actual triage permissions. |

#### `plane/api/views/intake.py`

| Line | Code                       | Context                                                                                                        |
| ---- | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 361  | `project_member.role <= 5` | **Public API intake detail** — same as app layer: guests can only see their own. Uses raw `5` instead of enum. |
| 410  | `project_member.role <= 5` | **Public API intake update** — same restriction.                                                               |
| 424  | `project_member.role > 15` | **Public API intake status** — only Admins (>15) can change triage status.                                     |

#### `plane/app/views/project/member.py` (leave flow)

| Line | Code                        | Context                                                                                                                                                                                                                                                  |
| ---- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 437  | `project_member.role == 20` | **Leave project** — checks if the leaving user is the project's admin. If they're the last admin, the leave is blocked. This is an identity check, not an ordinal comparison, but it's in this category because it assumes "admin" is always integer 20. |
| 439  | `role=20, is_active=True`   | **Leave project** — counts remaining project admins.                                                                                                                                                                                                     |

#### GraphQL Layer

The GraphQL layer has a pervasive pattern for teamspace members: since teamspace membership doesn't carry a role integer, the code **pins them to `Roles.MEMBER.value`** (15) and then uses ordinal checks to gate features. This is brittle — it assumes "Member" is the right default authority level for all teamspace users.

| File                                           | Line                                  | Context                                                                                                                                                            |
| ---------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plane/graphql/mutations/project.py`           | 214                                   | `if workspace_role not in [Roles.ADMIN.value, Roles.MEMBER.value]:` — blocks project creation for non-admin/non-member workspace roles. Custom roles are excluded. |
| `plane/graphql/mutations/issues/base.py`       | 643                                   | `current_user_role = Roles.MEMBER.value` — teamspace members get pinned to Member role.                                                                            |
| `plane/graphql/mutations/issues/base.py`       | 647                                   | `if current_user_role in [Roles.MEMBER.value, Roles.GUEST.value]:` — restricts issue creation fields (e.g., can't set state to done).                              |
| `plane/graphql/mutations/epics/base.py`        | 413, 417                              | Same pattern as issues — teamspace members pinned to Member, then ordinal check.                                                                                   |
| `plane/graphql/mutations/intake/base.py`       | 281, 285, 454, 458                    | Intake mutations — teamspace role pinning + fixed set checks.                                                                                                      |
| `plane/graphql/mutations/intake/attachment.py` | 180, 184, 289, 293                    | Intake attachments — teamspace role pinning + Guest equality check.                                                                                                |
| `plane/graphql/queries/intake/base.py`         | 88, 107, 169, 188, 230, 241, 283, 294 | Intake queries — extensive use of `current_user_role == Roles.GUEST.value` to scope results to own items.                                                          |
| `plane/graphql/queries/intake/search.py`       | 82, 88                                | Intake search — same Guest scoping pattern.                                                                                                                        |
| `plane/graphql/queries/roles/project.py`       | 92                                    | `user_project_roles.teamspace_role = Roles.MEMBER.value` — hardcodes teamspace role.                                                                               |

---

## Category 3: Hardcoded Boundary at `10` (Payment/Billing) (~25 locations)

### What these do

The billing system divides workspace members into two seat tiers:

- **Paid seats** (`role > 10`): Admin (20) and Member (15) — these consume purchased seat allocations
- **Free seats** (`role <= 10`): Commenter (10) and Guest (5) — these are free up to 5x the purchased seat count

The integer `10` (Commenter role) is the dividing line.

### Why they exist

Plane's pricing model charges per "full" seat (admin/member) and gives generous free viewer/guest seats. The boundary at 10 neatly splits the old role hierarchy: creative roles (15+) cost money, consumption-only roles (10 and below) are free.

### Risk with custom roles

**Critical.** This is the highest-risk category for billing correctness. Consider:

- A custom "Reviewer" role (integer 12) would be counted as a **paid seat** because 12 > 10, even if it's functionally a read-only role that should be free.
- A custom "Power Viewer" role (integer 8) would be counted as a **free seat** because 8 <= 10, even if it has edit capabilities that should require a paid seat.
- The billing boundary is purely an artifact of the original role integer assignment, not a semantic property of the role.

### Suggested fix

Instead of using integer boundaries, introduce a `is_paid_seat` boolean or `seat_tier` enum on the role definition. Custom roles should explicitly declare whether they consume paid or free seats. All `role__gt=10` / `role__lte=10` queries should be replaced with `seat_tier="paid"` / `seat_tier="free"` filters.

### Locations

#### `plane/payment/utils/member_payment_count.py`

This is the core seat-counting utility. Every function in this file uses the `10` boundary.

| Line    | Code                                | Context                                                                                                  |
| ------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 72      | `role__gt=10`                       | `handle_member_update_case()` — counts active admin/member (paid) seats when a role change is requested. |
| 77      | `role__lte=10`                      | Same function — counts active guest/viewer (free) seats.                                                 |
| 81      | `role__gt=10`                       | Counts invited admin/member seats.                                                                       |
| 84      | `role__lte=10`                      | Counts invited guest/viewer seats.                                                                       |
| 93      | `if int(requested_role) > 10:`      | Checks if the requested new role is a paid-tier role.                                                    |
| 95      | `if current_role > 10:`             | Checks if the user's current role is paid-tier (no net seat change if staying in same tier).             |
| 105     | `if int(requested_role) <= 10:`     | Checks if the requested new role is a free-tier role.                                                    |
| 107     | `if current_role <= 10:`            | Same tier check for free seats.                                                                          |
| 121–127 | `invite.get("role") > 10` / `<= 10` | `handle_member_invite_case()` — splits invited members into paid/free tiers for seat validation.         |
| 138–149 | `role__gt=10` / `role__lte=10`      | Counts existing + invited seats for admin-only invite batches.                                           |
| 170–191 | `role__gt=10` / `role__lte=10`      | Counts existing + invited seats for guest-only invite batches.                                           |
| 205–215 | `role__gt=10` / `role__lte=10`      | `handle_member_join_case()` — checks seat availability when a user joins via invitation.                 |

#### `plane/payment/views/payment.py`

| Line | Code          | Context                                                               |
| ---- | ------------- | --------------------------------------------------------------------- |
| 49   | `role__gt=10` | **Payment link generation** — counts paid seats to determine pricing. |
| 167  | `role__gt=10` | **Subscription info** — shows current paid seat usage.                |

#### `plane/payment/views/product.py`

| Line | Code            | Context                                                                     |
| ---- | --------------- | --------------------------------------------------------------------------- |
| 54   | `role__gt=10,`  | **Product listing** — includes current paid seat count in product response. |
| 56   | `role__gt=10`   | Same, includes invited paid seats.                                          |
| 64   | `role__lte=10,` | Same, includes free seat count.                                             |

#### `plane/payment/utils/workspace_license_request.py`

| Line | Code           | Context                                                           |
| ---- | -------------- | ----------------------------------------------------------------- |
| 154  | `role__gt=10,` | **License sync** — reports paid seat count to the license server. |
| 159  | `role__gt=10`  | Same, includes invited paid seats.                                |

#### `plane/graphql/utils/workspace_license.py`

| Line | Code           | Context                                                               |
| ---- | -------------- | --------------------------------------------------------------------- |
| 151  | `role__gt=10,` | **GraphQL license check** — same seat counting for the GraphQL layer. |
| 156  | `role__gt=10`  | Same, includes invited seats.                                         |

#### `plane/utils/porters/serializers/user.py`

| Line              | Code                           | Context                                                |
| ----------------- | ------------------------------ | ------------------------------------------------------ |
| 69–70             | `# role > 10` / `# role <= 10` | **Data export** — comments documenting the boundary.   |
| 81                | `if role > 10:`                | Categorizes exported members as admin or guest/viewer. |
| 95, 102, 107, 112 | `role__gt=10` / `role__lte=10` | Counts members by tier for export metadata.            |

---

## Category 4: Fixed Allowed-Set Checks (~10 locations)

### What these do

These validate that a role value belongs to the known set `{5, 10, 15, 20}` and reject anything outside it. They're input validators at API boundaries.

### Why they exist

When the role system was fixed, validating against the known enum prevented garbage values (e.g., `role=999`). This was a reasonable safety check when there were exactly 3-4 valid roles.

### Risk with custom roles

**Critical.** These are hard blockers. Any API request that includes a custom role integer will be rejected with a validation error before it reaches business logic. This means:

- The public API (`/api/v1/`) cannot create project members with custom roles — the serializer rejects them.
- Workspace invitations via the public API cannot use custom roles — same serializer rejection.
- The invite-acceptance flow silently coerces unknown roles to Member (15), losing the intended custom role.

These must be fixed before custom roles can be used via any API surface.

### Suggested fix

Replace fixed-set validation with a dynamic check: validate against the set of roles defined for the workspace (or a global role registry). For invite acceptance flows, preserve the original role instead of coercing to a hardcoded default.

### Locations

#### `plane/api/serializers/member.py`

| Line | Code                                                                       | Context                                                                                                                                                                                                                                                                                                                                     |
| ---- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 43   | `if value not in [ROLE.ADMIN.value, ROLE.MEMBER.value, ROLE.GUEST.value]:` | **Public API — project member creation/update.** This is the `validate_role()` method on `ProjectMemberSerializer`. Any API consumer trying to add a member with a custom role integer (e.g., 12, 18) gets `400 Invalid role`. This is the single most impactful blocker: the entire public API's member management is gated by this check. |

#### `plane/api/serializers/invite.py`

| Line | Code                                                                       | Context                                                                                                                                                             |
| ---- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 57   | `if value not in [ROLE.ADMIN.value, ROLE.MEMBER.value, ROLE.GUEST.value]:` | **Public API — workspace invitation.** Same pattern: `validate_role()` on `WorkspaceMemberInviteSerializer`. Invitations with custom roles are rejected.            |
| 71   | `"role": data.get("role", 5)`                                              | **Public API — invitation defaults.** If no role is specified, defaults to Guest (5). Not a rejection, but hardcodes the assumption that Guest is the safe default. |

#### `plane/authentication/utils/workspace_project_join.py`

| Line | Code                                                                                  | Context                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 80   | `role=(project_member_invite.role if project_member_invite.role in [5, 15] else 15),` | **Invite acceptance — workspace member creation.** When a user accepts a project invitation and joins the workspace, their workspace role is set from the invite role — but only if the invite role is Guest (5) or Member (15). Any other value (including Admin=20 or any custom role) is silently coerced to Member (15). This means: (a) an admin invite loses its admin status at the workspace level, and (b) a custom role invite is silently downgraded to Member. |
| 94   | `role=(project_member_invite.role if project_member_invite.role in [5, 15] else 15),` | **Invite acceptance — project member creation.** Same coercion for the project membership.                                                                                                                                                                                                                                                                                                                                                                                 |

#### `plane/ee/views/app/page/move.py`

| Line | Code                                              | Context                                                                                                                                                                                                                             |
| ---- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 77   | `role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],` | **Page move between projects** — only admins and members of the destination project can receive moved pages. Custom roles are excluded from the eligible set, so pages can't be moved to projects where the user has a custom role. |

---

## Category 5: ORM Queryset Filters with Hardcoded Boundaries (~20 locations)

### What these do

These use integer boundaries in ORM `filter()` calls to implement access tiers: "Guests see only their own content," "non-admins can't archive/delete," "assignee lists exclude viewers." They're the queryset-level counterpart to the ordinal comparisons in Category 2.

### Why they exist

Many features have tiered access: Guests see a restricted view, Members see everything, Admins can manage. Rather than checking permissions, the code filters querysets based on role integers. This was efficient and correct when roles were fixed.

### Risk with custom roles

**High.** Custom roles at unexpected integer positions get misclassified:

- `role=5` (exact Guest check): A custom role with integer 7 is NOT Guest but also NOT Member. These queries would NOT restrict them like Guests, giving them full Member-level visibility even if they should have limited access.
- `role__lte=15` ("not admin"): Used to mean "contributor or below." A custom role at 18 would pass this filter and be treated as non-admin, even if it should have admin-level page management.
- `role__gte=15` ("at least Member"): Filters assignee lists to Members and above. A custom "Reviewer" (12) would be excluded from assignee lists even if they should be assignable.
- `role__gt=5` ("above Guest"): Used to filter visible projects. A custom role at 8 would see all projects, which may or may not be intended.

### Suggested fix

Replace role-integer queryset filters with permission-based checks. For "is this user a Guest?" checks, query the permission system for the absence of the relevant permission. For assignee lists, check for an `assignable` permission. For admin-only operations, check for the specific admin permission needed.

### Locations

#### `plane/app/views/view/base.py`

| Line | Code                     | Context                                                                                                                                                                                                                                                                |
| ---- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 97   | `role=5, is_active=True` | **Workspace view list** — if the requesting user is a workspace Guest (`role=5`), they only see views they own. Non-guests see all workspace views. This is an exact equality check, so a custom role (e.g., 8) would NOT be treated as Guest and would see all views. |
| 563  | `role=5,`                | **Project view list** — same pattern at project level. Guests (`role=5`) only see own views; also checks `guest_view_all_features` project setting and teamspace membership.                                                                                           |
| 588  | `role=5,`                | **Project view retrieve** — same Guest check for individual view access.                                                                                                                                                                                               |

#### `plane/app/views/page/base.py`

| Line | Code           | Context                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 240  | `role=5,`      | **Page retrieve** — Guests only see pages they own (unless `guest_view_all_features` is enabled). Exact check: custom roles are not treated as Guest.                                                                                                                                                                                                                                                                   |
| 322  | `role=5,`      | **Page list** — same Guest scoping for page listing.                                                                                                                                                                                                                                                                                                                                                                    |
| 342  | `role__lte=15` | **Page archive** — checks if the user's role is "not admin" (`role <= 15`). If true AND they're not the page owner, the archive is denied. The intent: "only admins or page owners can archive." **Problem:** a custom role at 18 would pass `<= 15` as false (treated as admin), giving them archive power even if they shouldn't have it. Conversely, a custom role at 12 would be treated as "not admin" and denied. |
| 373  | `role__lte=15` | **Page unarchive** — same logic as archive.                                                                                                                                                                                                                                                                                                                                                                             |
| 409  | `role=20,`     | **Page delete** — only the page owner or a project admin (`role=20`) can delete. Exact admin check.                                                                                                                                                                                                                                                                                                                     |

#### `plane/app/views/notification/base.py`

| Line | Code           | Context                                                                                                                                                                                                                                                                                                                                                                      |
| ---- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 150  | `role__lt=15,` | **Notification list — "created" type** — if the user's workspace role is below Member (`< 15`, i.e., Guest or Commenter), they get no "created" notifications. The intent: low-privilege users shouldn't see notifications about issues they created (because they can't act on them). **Problem:** a custom role at 12 would be excluded even if it has create permissions. |
| 317  | `role__lt=15,` | **Notification list — same pattern in a different code path.** Duplicate of the above logic.                                                                                                                                                                                                                                                                                 |

#### `plane/app/views/search/issue.py`

| Line | Code     | Context                                                                                                  |
| ---- | -------- | -------------------------------------------------------------------------------------------------------- |
| 209  | `role=5` | **Issue search** — Guests (`role=5`) get restricted search results (only their own issues). Exact check. |

#### `plane/app/serializers/issue.py`

| Line | Code            | Context                                                                                                                                                                                                                                                                                                                                                                       |
| ---- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 186  | `role__gte=15,` | **Issue serializer — assignee validation** — when creating/updating an issue, assignees must have `role >= 15` (Member or Admin). This filters out Guests and Commenters from being assigned to issues. **Problem with custom roles:** a custom "Reviewer" (12) can't be assigned even if they should be. A custom "Observer" (18) CAN be assigned even if they shouldn't be. |
| 198  | `role__gte=15,` | **Same validation in a different code path** — duplicate assignee check.                                                                                                                                                                                                                                                                                                      |
| 253  | `role__gte=15,` | **Issue serializer — another assignee validation instance.**                                                                                                                                                                                                                                                                                                                  |

#### `plane/api/serializers/issue.py`

| Line | Code            | Context                                                                    |
| ---- | --------------- | -------------------------------------------------------------------------- |
| 120  | `role__gte=15,` | **Public API issue serializer — assignee validation** — same as app layer. |
| 207  | `role__gte=15,` | **Same, different code path.**                                             |

#### `plane/app/serializers/draft.py`

| Line | Code                           | Context                                                                                                   |
| ---- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| 108  | `role__gte=ROLE.MEMBER.value,` | **Draft issue serializer** — assignee validation for draft issues. Uses enum form but same ordinal logic. |

#### `plane/space/views/project.py`

| Line | Code          | Context                                                                                                                         |
| ---- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 122  | `role__gt=5,` | **Public space project view** — filters to show only members above Guest. Used to determine which deploy boards are accessible. |

#### `plane/app/views/workspace/member.py`

| Line | Code                                                                | Context                                                                                                                                                                                                                |
| ---- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 108  | `if "role" in request.data and int(request.data.get("role")) == 5:` | **Workspace member role update** — when demoting a workspace member to Guest (5), also demote all their project memberships to Guest. The intent: "workspace guests can only be project guests." Exact equality check. |
| 110  | `ProjectMember.objects.filter(...).update(role=5)`                  | **Same flow** — bulk-updates all project memberships to Guest role.                                                                                                                                                    |
| 327  | `project__project_projectmember__role__gt=5,`                       | **Dashboard endpoint** — counts active cycles only for projects where the user's role is above Guest.                                                                                                                  |

#### `plane/graphql/queries/notification.py`

| Line | Code           | Context                                                                       |
| ---- | -------------- | ----------------------------------------------------------------------------- |
| 175  | `role__lt=15,` | **GraphQL notifications** — same pattern as app layer notification filtering. |

#### EE Views

| File                                        | Line                    | Context                                                                                                       |
| ------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `plane/ee/views/app/workspace/issue.py`     | 56, 60                  | **Workspace issue list** — Guest role checks (`role=5`) for filtering issues.                                 |
| `plane/ee/views/app/workspace/issue.py`     | 66                      | `role__gt=5` — filters to projects where user is above Guest.                                                 |
| `plane/ee/views/app/epic/comment.py`        | 82                      | `role=5` — Guest check for epic comment visibility.                                                           |
| `plane/ee/views/app/page/project/base.py`   | 303, 453                | `role=5` — Guest checks for page access.                                                                      |
| `plane/ee/views/app/page/project/base.py`   | 475, 535                | `role__lte=15` — "not admin" check for page archive/unarchive.                                                |
| `plane/ee/views/app/page/project/base.py`   | 575                     | `role=20` — admin check for page deletion.                                                                    |
| `plane/ee/views/app/page/workspace/base.py` | 393, 445, 477           | `role__lte=15` — "not admin" checks for workspace page management.                                            |
| `plane/ee/views/app/teamspace/page/base.py` | 349, 543, 584, 622, 657 | `role__lte=15` — "not admin" checks for teamspace page management. Extensive duplication of the same pattern. |
| `plane/ee/views/app/cycle/active_cycle.py`  | 43                      | `role__gt=5` — filters active cycles to projects where user is above Guest.                                   |

---

## Other Locations

These don't fit neatly into the categories above but still contain hardcoded role integers.

#### `plane/authentication/utils/oauth_utils.py`

| Line | Code                      | Context                                                                                                                                                                                                                                                                                                              |
| ---- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 103  | `role=ROLE.MEMBER.value,` | **OAuth signup** — when a user signs up via OAuth (Google, GitHub, etc.) and auto-joins a workspace, they get Member role. This is a default-role assignment, not a validation check. **Risk:** Low — this is a reasonable default. Could be replaced with a workspace-level "default role for new members" setting. |

#### `plane/authentication/models/oauth.py`

| Line | Code                                   | Context                                                                                                        |
| ---- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 366  | `defaults={"role": ROLE.MEMBER.value}` | **OAuth app bot** — when an OAuth app is installed, the app's bot user gets Member role in workspace projects. |
| 377  | `role=ROLE.MEMBER.value,`              | **OAuth app bot** — same, different code path.                                                                 |

#### `plane/ee/models/automation.py`

| Line | Code                      | Context                                                                                 |
| ---- | ------------------------- | --------------------------------------------------------------------------------------- |
| 186  | `role=ROLE.MEMBER.value,` | **Automation bot** — automation actors get Member role in projects they need to access. |

#### `plane/db/models/workspace.py`

| Line | Code                  | Context                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 371  | `if self.role == 20:` | **Permission sync** — `WorkspaceMember._get_permission_relation()` maps role integers to permission relation strings. This is the bridge between the old role system and the new permission system. If `role == 20`, additional logic determines whether the user gets "owner" or "admin" relation based on the workspace's license plan. **This is a critical junction point** — custom roles would need their own mapping logic here. Currently, any role != 20 falls through to the `role_from_member_role()` utility, which handles 5/10/15 but would need extension for custom roles. |

#### `plane/api/views/intake.py`

| Line | Code       | Context                                                                             |
| ---- | ---------- | ----------------------------------------------------------------------------------- |
| 518  | `role=20,` | **Public API intake** — creates project member with admin role during intake setup. |

---

## Priority for Custom Roles Migration

### P0 — Critical (Hard blockers, must fix before custom roles ship)

**Category 4: Fixed allowed-set checks** — These actively reject custom roles at API input boundaries. No workaround exists for API consumers.

- `api/serializers/member.py:43` — Blocks project member creation with custom roles
- `api/serializers/invite.py:57` — Blocks workspace invitations with custom roles
- `authentication/utils/workspace_project_join.py:80,94` — Silently coerces custom roles to Member on invite acceptance

**Category 3: Payment boundary at `10`** — Custom roles would be incorrectly categorized as paid or free seats, leading to billing errors.

- `payment/utils/member_payment_count.py` — 20 locations, all seat counting logic
- Need a `seat_tier` attribute on role definitions

### P1 — High (Wrong access decisions, fix before custom roles GA)

**Category 2: Ordinal comparisons in member management** — These produce incorrect hierarchy decisions with custom roles.

- `app/views/project/member.py:349,400` — Role update and member removal hierarchy checks
- `app/views/workspace/member.py:167` — Workspace member removal hierarchy check
- `app/views/workspace/invite.py:72` — Invitation role ceiling check

**Category 5: Queryset filters for access tiers** — These misclassify custom roles, giving wrong visibility.

- `app/serializers/issue.py:186,198,253` — Assignee validation excludes valid custom roles
- `app/views/page/base.py:342,373` — Archive/unarchive admin checks
- `app/views/notification/base.py:150,317` — Notification filtering

### P2 — Medium (Cosmetic/setup, fix for polish)

**Category 1: Hardcoded `role=20` assignments** — These are mostly write-path bootstrap operations.

- Replace `role=20` with `role=ROLE.ADMIN.value` for readability (trivial grep-and-replace)
- Eventually provide a `get_admin_role(workspace)` helper for workspace-specific admin roles

### P3 — Low (Dev-only, informational)

- `bgtasks/create_faker.py`, `bgtasks/dummy_data_task.py` — Test data generators; only used in development
- GraphQL teamspace role pinning — Needs a broader teamspace role model, not just integer fixes

---

## Recommended Approach

1. **Define a `RoleMeta` model or registry** that maps role integers to semantic properties:
   - `is_paid_seat: bool` — replaces the `> 10` boundary
   - `authority_level: int` — explicit hierarchy ordering separate from the role integer
   - `can_be_assigned: bool` — replaces `role__gte=15` in assignee validation
   - `is_admin: bool` — replaces `role == 20` identity checks

2. **Add helper functions** that encapsulate role queries:
   - `is_role_admin(role) -> bool` — replaces `role == 20`
   - `can_manage(actor_role, target_role) -> bool` — replaces `actor.role > target.role`
   - `is_paid_tier(role) -> bool` — replaces `role > 10`
   - `get_admin_role(workspace) -> int` — returns the canonical admin role integer

3. **Migrate in priority order**: P0 first (unblock custom roles), then P1 (fix access decisions), then P2/P3.

4. **Add a lint rule** or pre-commit check that flags new raw integer comparisons on `.role` fields, forcing developers to use the helper functions.
