# Research Report: Default Labels Implementation

## Findings

### Label Model

- `Label` extends `WorkspaceBaseModel` (has `workspace` FK + nullable `project` FK)
- UniqueConstraint: `(name)` when `project__isnull=True` AND `(project, name)` when `project__isnull=False`
- `sort_order` defaults to 65535, auto-increments by 10000 on save
- Located: `apps/api/plane/db/models/label.py`

### Existing Seed Patterns

**Pattern 1: DEFAULT_STATES (project creation)**

- `DEFAULT_STATES` constant defined in `state.py`, exported from `__init__.py`
- `ProjectViewSet.create()` calls `State.objects.bulk_create([...DEFAULT_STATES...])` at line 276-290
- This is the cleanest pattern to follow for default labels

**Pattern 2: Workspace onboarding seed (labels.json)**

- `workspace_seed_task.py` reads `seeds/data/labels.json` via `read_seed_file()`
- Currently seeds 2 demo labels: "admin" (#0693e3) and "concepts" (#9900ef) with `project_id: 1`
- Called via `create_project_labels()` during `workspace_seed()` Celery task
- Triggered on workspace creation: `WorkSpaceViewSet.create()` -> `workspace_seed.delay(workspace_id)`

**Pattern 3: seed_department_staff command**

- Management command seeds departments, staff, projects, issues
- Creates states per project via `_create_states()` but does NOT create labels
- Uses `get_or_create` and `bulk_create(ignore_conflicts=True)` patterns

### Project Creation Flow

1. `ProjectViewSet.create()` in `apps/api/plane/app/views/project/base.py`
2. Creates project, adds member, seeds `DEFAULT_STATES`
3. No label seeding currently -- gap to fill

### Label API Endpoints

- Project labels: `GET/POST /api/workspaces/{slug}/projects/{project_id}/labels/` (LabelViewSet)
- Workspace labels: `GET /api/workspaces/{slug}/labels/` (WorkspaceLabelsEndpoint) -- read-only, aggregates project labels
- Only ADMIN role can create/update/delete labels

### Workspace Labels Endpoint Behavior

- `WorkspaceLabelsEndpoint.get()` filters labels by `project__project_projectmember__member=request.user`
- Returns all labels across projects user is a member of
- Default labels per project will automatically appear in workspace label list

## Decision: Project-Level Labels

Labels should be project-scoped (not workspace-scoped with `project=NULL`) because:

1. Existing `LabelViewSet` and all frontend code expects `project_id` on labels
2. `WorkspaceLabelsEndpoint` aggregates from project labels
3. `DEFAULT_STATES` pattern creates states per project -- consistent approach
4. If workspace-level (project=NULL), they wouldn't show in existing project label UIs

## No Unresolved Questions
