# IdP Group Syncing

## Overview

Group Sync lets you manage project memberships in Plane directly from your IdP. With this feature, Plane workspace admins can map users to Plane projects using group claims from their IdP and stay in sync with user onboarding and offboarding from a single source of truth.

## How it works

### Authentication flow

1. User authenticates via your IdP provider like Okta, Keycloak, Azure Active Directory, Google Workspace, and others.

2. Plane receives the user's group claims from the `userinfo` endpoint or ID token.

3. Plane checks if any received groups are mapped to projects in the workspace.

4. If the user belongs to a mapped group, they are automatically added to the workspace (if not already a member) and to the corresponding project(s).

5. On subsequent logins, memberships are synchronized such that users are added to new projects if they are in new mapped groups, and, optionally, are removed from projects if they are no longer in those groups.

## Configuration

### Prerequisites

- SSO via OIDC or LDAP must be configured and enabled for your workspace.

- Domain verification must have been done if you are on our Cloud.

- Your IdP must be configured to include group claims in its response.

1. Turn on **Group Sync**.

2. Configure the **Name of group claim** to exactly what your IdP sends.

   Values for Name of group claim

   Default: `groups`

   Others: `groups`, `roles`, `memberOf`, `custom:groups`

3. Configure group maps.

   Add **Group name** as it exactly is on your IdP (`engineering-team`, `product-managers`), select the target project on Plane, and assign a role for auto-added members (**Admin**, **Member**, **Guest**).

4. Configure sync behavior.

   | Setting            | Description                                           | Options                          |
   | ------------------ | ----------------------------------------------------- | -------------------------------- |
   | **Sync on log-in** | Sync group memberships each time users logs in.       | Enabled • _Recommended_ Disabled |
   | **Auto-remove**    | Remove users from projects when they leave the group. | Enabled Disabled • _Default_     |
   | **Sync interval**  | Background sync frequency for membership updates      | Set to 24 hours                  |

## Behavior

### Adding users to workspaces and projects

Group Sync on, user logs in:

| Condition                                                       | Result                                                          |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| User is not workspace member + in mapped group                  | **Added to workspace with Member role AND added to project(s)** |
| User is workspace member + in mapped group + not in project     | **Added to project** with configured role                       |
| User is workspace member + in mapped group + already in project | No change                                                       |
| User is workspace member + not in mapped group                  | No automatic addition                                           |

### Removing users from projects

| Condition                          | Result                                             |
| ---------------------------------- | -------------------------------------------------- |
| User removed from group            | **Removed from project only** (stays in workspace) |
| User was manually added to project | **Never auto-removed**                             |
| User is only project admin         | **Not removed** (prevents orphan projects)         |

**Important:** When a user is removed from an IdP group, they are only removed from the mapped **projects**, not from the **workspace**. This ensures users don't lose access to other projects or workspace resources.

### Role precedence

- If a user belongs to **multiple groups** mapped to the same project, they receive the **highest role** among all mappings.

- **Manually assigned roles** are never downgraded by Group Sync.

- Workspace role constraints still apply.
  `Workspace guests cannot be project admins.`

---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Authentication Flow                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────────┐     ┌─────────────────────────┐  │
│  │     IdP      │────▶│  OIDC Callback   │────▶│  process_group_sync_    │  │
│  │ (Okta, etc.) │     │    Endpoint      │     │      on_login()         │  │
│  └──────────────┘     └──────────────────┘     └───────────┬─────────────┘  │
│                                                             │                │
│                                                             ▼                │
│                              ┌──────────────────────────────────────────┐   │
│                              │         GroupProviderRegistry            │   │
│                              │  ┌────────────┐  ┌────────────────────┐  │   │
│                              │  │   OIDC     │  │  OIDC Cloud        │  │   │
│                              │  │  Provider  │  │    Provider        │  │   │
│                              │  └────────────┘  └────────────────────┘  │   │
│                              └───────────────────┬──────────────────────┘   │
│                                                  │ extract_groups()         │
│                                                  ▼                          │
│                              ┌──────────────────────────────────────────┐   │
│                              │          GroupSyncService                │   │
│                              │  • sync_user_memberships()               │   │
│                              │  • _add_to_workspace()                   │   │
│                              │  • _add_to_project()                     │   │
│                              │  • _remove_from_project()                │   │
│                              └───────────────────┬──────────────────────┘   │
│                                                  │                          │
│                                                  ▼                          │
│                              ┌──────────────────────────────────────────┐   │
│                              │            Database Models               │   │
│                              │  ┌─────────────────┐ ┌────────────────┐  │   │
│                              │  │ GroupSyncConfig │ │  GroupMapping  │  │   │
│                              │  └─────────────────┘ └────────────────┘  │   │
│                              │  ┌─────────────────┐ ┌────────────────┐  │   │
│                              │  │ WorkspaceMember │ │ ProjectMember  │  │   │
│                              │  └─────────────────┘ └────────────────┘  │   │
│                              └──────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
apps/api/plane/authentication/
├── group_sync/
│   ├── __init__.py
│   ├── service.py              # Core sync logic (GroupSyncService)
│   └── providers/
│       ├── __init__.py
│       ├── base.py             # BaseGroupProvider abstract class
│       ├── oidc.py             # OIDC provider implementations
│       └── registry.py         # Provider registry
├── models/
│   └── group_sync.py           # GroupSyncConfig, GroupMapping models
├── utils/
│   └── group_sync.py           # Login-time orchestration
├── views/
│   ├── app/
│   │   └── oidc.py             # Self-hosted OIDC callback
│   └── sso/
│       ├── oidc.py             # Cloud OIDC callback
│       └── group_sync.py       # Config & mapping API endpoints
└── serializers/
    └── sso/
        └── group_sync.py       # API serializers
```

---

## Implementation Details

### Database Models

#### GroupSyncConfig

Workspace-level configuration for IdP group syncing.

```python
# Location: plane/authentication/models/group_sync.py

class GroupSyncConfig(BaseModel):
    workspace = ForeignKey("db.Workspace")
    is_enabled = BooleanField(default=False)
    sync_on_login = BooleanField(default=True)
    auto_remove = BooleanField(default=False)
    group_attribute_key = CharField(max_length=255, default="groups")
```

| Field                 | Type   | Description                                 |
| --------------------- | ------ | ------------------------------------------- |
| `workspace`           | FK     | One config per workspace                    |
| `is_enabled`          | bool   | Master switch for group sync                |
| `sync_on_login`       | bool   | Sync memberships on each login              |
| `auto_remove`         | bool   | Remove from projects when user leaves group |
| `group_attribute_key` | string | Claim name in IdP response (e.g., `groups`) |

#### GroupMapping

Maps an IdP group name to a project with a default role.

```python
# Location: plane/authentication/models/group_sync.py

class GroupMapping(BaseModel):
    ROLE_ADMIN = 20
    ROLE_MEMBER = 15
    ROLE_GUEST = 5

    workspace = ForeignKey("db.Workspace")
    idp_group_name = CharField(max_length=255, db_index=True)
    project = ForeignKey("db.Project")
    default_role = PositiveSmallIntegerField(default=ROLE_MEMBER)
```

| Field            | Type   | Description                           |
| ---------------- | ------ | ------------------------------------- |
| `workspace`      | FK     | Workspace this mapping belongs to     |
| `idp_group_name` | string | Exact group name from IdP             |
| `project`        | FK     | Target project to add users to        |
| `default_role`   | int    | Role for auto-added members (20/15/5) |

#### ProjectMember Source Tracking

```python
# Location: plane/db/models/project.py

class ProjectMemberSource(models.TextChoices):
    MANUAL = "manual", "Manual"
    GROUP_SYNC = "group_sync", "Group Sync"
    TEAMSPACE = "teamspace", "Teamspace"

class ProjectMember(BaseModel):
    # ... other fields
    source = CharField(choices=ProjectMemberSource.choices, default=MANUAL)
```

The `source` field tracks how a member was added, enabling:

- Auto-removal only for `GROUP_SYNC` members
- Manual members are never auto-removed

---

### Core Service Layer

#### GroupSyncService

The main service class handling all sync operations.

```python
# Location: plane/authentication/group_sync/service.py

class GroupSyncService:
    def sync_user_memberships(
        self,
        user_id: UUID,
        workspace_id: UUID,
        groups: list[str],
    ) -> SyncResult:
        """
        Main sync entry point. Called on each login.

        Flow:
        1. Get sync config for workspace
        2. Get all group mappings
        3. Calculate target project memberships based on user's groups
        4. If user has matching groups but isn't workspace member, add to workspace
        5. Add user to new projects
        6. If auto_remove enabled, remove from projects no longer mapped
        """
```

#### SyncResult

```python
@dataclass
class SyncResult:
    user_id: UUID
    workspace_id: UUID
    added_to_workspace: bool = False      # True if user was added to workspace
    projects_added: list[UUID]            # Projects user was added to
    projects_removed: list[UUID]          # Projects user was removed from
    projects_unchanged: list[UUID]        # Projects with no change
    errors: list[str]                     # Any errors encountered
```

#### Key Methods

| Method                              | Description                                          |
| ----------------------------------- | ---------------------------------------------------- |
| `sync_user_memberships()`           | Main entry point - orchestrates the full sync        |
| `_is_workspace_member()`            | Check if user is active workspace member             |
| `_add_to_workspace()`               | Add user to workspace with Member role               |
| `_build_group_mapping_lookup()`     | Build group name → (project_id, role) lookup         |
| `_calculate_target_memberships()`   | Determine target projects based on user's groups     |
| `_get_current_synced_memberships()` | Get projects where user was added via group sync     |
| `_add_to_project()`                 | Add user to project with GROUP_SYNC source           |
| `_remove_from_project()`            | Remove user from project (only if source=GROUP_SYNC) |

---

### Provider Abstraction

#### BaseGroupProvider

Abstract base class for all group providers.

```python
# Location: plane/authentication/group_sync/providers/base.py

class BaseGroupProvider(ABC):
    @abstractmethod
    def extract_groups(
        self,
        auth_response: dict,
        group_attribute_key: str,
    ) -> list[str]:
        """Extract group names from authentication response."""
        pass

    def can_fetch_groups_offline(self) -> bool:
        """Whether provider supports background group fetching."""
        return False

    def fetch_groups_offline(
        self,
        user_id: UUID,
        workspace_id: UUID,
    ) -> list[str]:
        """Fetch groups without user interaction (for background sync)."""
        raise NotImplementedError
```

#### OIDCGroupProvider (Self-hosted)

```python
# Location: plane/authentication/group_sync/providers/oidc.py

class OIDCGroupProvider(BaseGroupProvider):
    """
    OIDC provider for self-hosted instances.
    Uses instance-level OIDC config from environment variables.
    """

    def extract_groups(self, auth_response, group_attribute_key):
        # Extract from userinfo response using configured claim key
        return auth_response.get(group_attribute_key, [])
```

#### OIDCGroupCloudProvider (Cloud)

```python
class OIDCGroupCloudProvider(BaseGroupProvider):
    """
    OIDC provider for cloud instances.
    Uses workspace-specific IdentityProvider configuration from database.
    """
```

#### GroupProviderRegistry

```python
# Location: plane/authentication/group_sync/providers/registry.py

class GroupProviderRegistry:
    @staticmethod
    def get_provider(provider_type: str, is_cloud: bool = False):
        if provider_type == "oidc":
            return OIDCGroupCloudProvider() if is_cloud else OIDCGroupProvider()
        # Future: saml, ldap
        return None
```

---

### Login-Time Orchestration

#### process_group_sync_on_login

Called after successful OIDC authentication.

```python
# Location: plane/authentication/utils/group_sync.py

def process_group_sync_on_login(
    user,
    userinfo_response: dict,
    workspace_id: Optional[UUID] = None,
    is_cloud: bool = False,
) -> None:
    """
    Process group sync after successful OIDC authentication.

    For self-hosted: syncs groups across ALL workspaces with group sync enabled
    For cloud: syncs groups only for the specified workspace
    """
```

#### Cloud vs Self-hosted Flow

| Aspect          | Cloud                             | Self-hosted                            |
| --------------- | --------------------------------- | -------------------------------------- |
| Config source   | Database (IdentityProvider model) | Environment variables                  |
| Workspace scope | Single workspace per auth         | All workspaces with group sync enabled |
| Provider class  | `OIDCGroupCloudProvider`          | `OIDCGroupProvider`                    |
| Called from     | `OIDCAuthCloudCallbackEndpoint`   | `OIDCallbackEndpoint`                  |

---

### Sync Flow Diagram

```
User Login via OIDC
        │
        ▼
┌───────────────────────────────────────┐
│  OIDC Callback Endpoint               │
│  • Validate tokens                    │
│  • Create/update user                 │
│  • Call process_group_sync_on_login() │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│  process_group_sync_on_login()        │
│  • Get provider (OIDC/LDAP/SAML)      │
│  • For each workspace with sync on:   │
│    └─ Call sync_user_memberships()    │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│  GroupSyncService.sync_user_memberships()
│                                       │
│  1. Get GroupSyncConfig               │
│  2. Get all GroupMappings             │
│  3. Extract groups from userinfo      │
│  4. Calculate target memberships      │
│     (highest role if multiple groups) │
│                                       │
│  5. If user has matching groups:      │
│     ├─ If not workspace member:       │
│     │  └─ Add to workspace (Member)   │
│     ├─ Add to new projects            │
│     └─ Remove from old projects       │
│        (if auto_remove enabled)       │
└───────────────────────────────────────┘
```

---

### API Endpoints

| Endpoint                                           | Method | Description               |
| -------------------------------------------------- | ------ | ------------------------- |
| `/sso/workspaces/<slug>/group-sync/config/`        | GET    | Get sync config           |
| `/sso/workspaces/<slug>/group-sync/config/`        | PUT    | Update/create sync config |
| `/sso/workspaces/<slug>/group-sync/mappings/`      | GET    | List all group mappings   |
| `/sso/workspaces/<slug>/group-sync/mappings/`      | POST   | Create new mapping        |
| `/sso/workspaces/<slug>/group-sync/mappings/<pk>/` | GET    | Get specific mapping      |
| `/sso/workspaces/<slug>/group-sync/mappings/<pk>/` | PATCH  | Update mapping            |
| `/sso/workspaces/<slug>/group-sync/mappings/<pk>/` | DELETE | Delete mapping            |

**Permission:** Workspace Owner only

---

## Safety Guards

1. **Never remove manually added members** - Only members with `source=GROUP_SYNC` are auto-removed

2. **Never remove workspace membership** - Users are only removed from projects, not workspaces

3. **Never remove last project admin** - Prevents orphan projects

4. **Role precedence** - If user is in multiple groups mapping to same project, highest role wins

5. **Manual role changes preserved** - Group sync never downgrades manually assigned roles

6. **Graceful error handling** - Sync errors don't fail the login

---

## Common use cases

### New team member access

**Scenario**
New engineers should automatically get access to all Engineering projects.

**Solution**

- Create IdP group called `engineering`.

- Map `engineering` to the project Engineering Backend with `Member` as role.

- Map `engineering` to the project Engineering Frontend with `Member` as role.

- Map `engineering` to the project Infrastructure with `Guest` as role.

When done, each new engineer added to the `engineering` group in your IdP automatically gets access to the workspace and all three projects with defined roles on their first Plane log-in.

### Department-based access

**Scenario**
Each department has their own projects and should only see those.

**Solution**

- Map `product-team` to the project Product Roadmap.

- Map `design-team` to the project Design System.

- Map `marketing-team` to the project Marketing Campaigns.

Users only see projects relevant to their department or team on their next log-in.

### Cross-functional projects

**Scenario**
A special project needs members from multiple teams.

**Solution**

- Create IdP group called `project-apollo`.

- Map `project-apollo` to the project Project Apollo with `Member` as role.

- Add people to `project-apollo` in your IdP.

All Project Apollo team members get access regardless of their department.

### Contractor access

**Scenario**
Freelancers, consultants, or any other type of temp worker needs limited, view-only access to specific projects.

**Solution**

- Create IdP group called `contractors`.

- Map `contractors` to relevant projects with `Guest` as role.

- Turn on **Auto-remove** so access from all projects is at once removed when group membership ends on IdP.

---

## FAQs

**What happens to existing project members when I turn on Group Sync?**

Existing members are completely unaffected. Group Sync only adds new members going forward. Your current project membership remains intact.

**Can users be in a project via both Group Sync and manual assignment?**

Yes. If a user is manually added and also belongs to a mapped group, both are tracked. If auto-remove is enabled and they leave the group, they remain in the project because of their manual assignment.

**What if I delete a group map?**

Deleting a map stops automatic additions from that group from the time of the deletion. Users who were already added remain in the project. They are not automatically removed.

**How do I handle a user who needs a different role than their group's default?**

Manually change their role in the project. Manual role changes are preserved and not overwritten by Group Sync.

**Can I map the same group to multiple projects?**

Yes. Create separate maps for each project. Users will be added to all mapped projects when they log in.

**How quickly do changes take effect?**

With `Sync on login` enabled, changes take effect on the user's next login. If a user is currently logged in, they will see updates after their next authentication.

**Does this work with SAML?**

Group Sync is available for OIDC and LDAP right now. Support for SAML will come a little later.

**What happens when a user is removed from all IdP groups?**

The user is removed from all mapped projects (if auto-remove is enabled) but remains a workspace member. They will still have access to the workspace but won't be in any projects that were assigned via group sync.

**What role do users get when added to the workspace via group sync?**

Users are added to the workspace with the **Member** role (role=15). This gives them standard workspace access while their project-level roles are determined by the individual group mappings.
