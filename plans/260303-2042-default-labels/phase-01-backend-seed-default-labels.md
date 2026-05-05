# Phase 01: Backend - Seed Default Labels on Project Creation

## Context Links

- Label model: `apps/api/plane/db/models/label.py`
- Label model exports: `apps/api/plane/db/models/__init__.py`
- Project creation view: `apps/api/plane/app/views/project/base.py`
- DEFAULT_STATES pattern: `apps/api/plane/db/models/state.py` (line 24+)
- Workspace seed task: `apps/api/plane/bgtasks/workspace_seed_task.py`
- Labels seed JSON: `apps/api/plane/seeds/data/labels.json`
- Seed management command: `apps/api/plane/db/management/commands/seed_department_staff.py`
- Label ViewSet (project): `apps/api/plane/app/views/issue/label.py`

## Overview

- **Priority**: P2
- **Status**: complete
- **Description**: Define `DEFAULT_LABELS` constant and seed them on every project creation, matching the `DEFAULT_STATES` pattern.

## Key Insights

1. `Label` extends `WorkspaceBaseModel` (has `workspace` FK + `project` FK nullable). Labels are project-scoped.
2. `ProjectViewSet.create()` (line 252-307 in `project/base.py`) already does `State.objects.bulk_create(...)` with `DEFAULT_STATES` -- exact same pattern for labels.
3. `DEFAULT_STATES` is defined in `state.py` and exported from `__init__.py`. Follow same structure.
4. Label model has UniqueConstraint on `(project, name)` when not deleted -- `ignore_conflicts=True` in bulk_create handles duplicates safely.
5. `workspace_seed_task.py` reads `labels.json` for onboarding seed data -- update this file with the 8 default labels.
6. `seed_department_staff.py` management command creates projects but does NOT seed labels -- add label seeding there too.

## Requirements

### Functional

- 8 labels auto-created for every new project: Bank-wide Project, Daily, Weekly, Monthly, Quarterly, Half-year, Yearly, Ad-hoc
- Each label has a distinct color for visual differentiation
- Labels seeded during workspace onboarding (via `labels.json` seed file)
- Labels seeded for projects created by `seed_department_staff` command

### Non-functional

- No database migration required (data-only change)
- Idempotent: `ignore_conflicts=True` prevents duplicates on re-runs

## Architecture

```
Project Creation Flow:
  ProjectViewSet.create()
    -> State.objects.bulk_create(DEFAULT_STATES)  [existing]
    -> Label.objects.bulk_create(DEFAULT_LABELS)   [NEW]

Workspace Onboarding Flow:
  workspace_seed() -> create_project_labels() -> reads labels.json [update file]

Management Command Flow:
  seed_department_staff -> _seed_projects() -> _seed_labels() [NEW method]
```

## Related Code Files

### Files to Modify

1. **`apps/api/plane/db/models/label.py`** -- Add `DEFAULT_LABELS` constant
2. **`apps/api/plane/db/models/__init__.py`** -- Export `DEFAULT_LABELS`
3. **`apps/api/plane/app/views/project/base.py`** -- Add `Label.objects.bulk_create()` in `create()`
4. **`apps/api/plane/seeds/data/labels.json`** -- Replace with 8 default labels
5. **`apps/api/plane/db/management/commands/seed_department_staff.py`** -- Add `_seed_labels()` method

### Files to Create

- None

### Files to Delete

- None

## Embedded Rules

- YAGNI: Only seed labels, no UI changes needed (labels already rendered in existing label UI)
- KISS: Follow exact `DEFAULT_STATES` pattern; no new abstractions
- DRY: Define labels once in `DEFAULT_LABELS`, reference everywhere
- File size: All modified files stay under 200 lines (label.py ~75 lines, additions are small)
- No mocks/fakes: Real data seeding
- Conventional commits: `feat(labels): add default labels on project creation`

## Implementation Steps

### Step 1: Define DEFAULT_LABELS in label.py

Add after the `Label` class definition in `apps/api/plane/db/models/label.py`:

```python
# Default labels seeded on project creation
DEFAULT_LABELS = [
    {"name": "Bank-wide Project", "color": "#0E8A16", "sort_order": 65535},
    {"name": "Daily", "color": "#0075CA", "sort_order": 75535},
    {"name": "Weekly", "color": "#E4E669", "sort_order": 85535},
    {"name": "Monthly", "color": "#D93F0B", "sort_order": 95535},
    {"name": "Quarterly", "color": "#0693E3", "sort_order": 105535},
    {"name": "Half-year", "color": "#FBCA04", "sort_order": 115535},
    {"name": "Yearly", "color": "#B60205", "sort_order": 125535},
    {"name": "Ad-hoc", "color": "#D876E3", "sort_order": 135535},
]
```

### Step 2: Export DEFAULT_LABELS from **init**.py

In `apps/api/plane/db/models/__init__.py`, update the label import line:

```python
from .label import Label, DEFAULT_LABELS
```

### Step 3: Seed labels in ProjectViewSet.create()

In `apps/api/plane/app/views/project/base.py`:

1. Add `Label, DEFAULT_LABELS` to imports from `plane.db.models`
2. After the `State.objects.bulk_create(...)` block (around line 290), add:

```python
Label.objects.bulk_create(
    [
        Label(
            name=label["name"],
            color=label["color"],
            sort_order=label["sort_order"],
            project=serializer.instance,
            workspace=serializer.instance.workspace,
            created_by=request.user,
        )
        for label in DEFAULT_LABELS
    ],
    ignore_conflicts=True,
)
```

### Step 4: Update labels.json seed file

Replace `apps/api/plane/seeds/data/labels.json` with the 8 default labels (keeping `project_id: 1` to match existing seed structure and existing `id` field for mapping):

```json
[
  { "id": 1, "name": "Bank-wide Project", "color": "#0E8A16", "sort_order": 65535, "project_id": 1 },
  { "id": 2, "name": "Daily", "color": "#0075CA", "sort_order": 75535, "project_id": 1 },
  { "id": 3, "name": "Weekly", "color": "#E4E669", "sort_order": 85535, "project_id": 1 },
  { "id": 4, "name": "Monthly", "color": "#D93F0B", "sort_order": 95535, "project_id": 1 },
  { "id": 5, "name": "Quarterly", "color": "#0693E3", "sort_order": 105535, "project_id": 1 },
  { "id": 6, "name": "Half-year", "color": "#FBCA04", "sort_order": 115535, "project_id": 1 },
  { "id": 7, "name": "Yearly", "color": "#B60205", "sort_order": 125535, "project_id": 1 },
  { "id": 8, "name": "Ad-hoc", "color": "#D876E3", "sort_order": 135535, "project_id": 1 }
]
```

**Note**: The existing `issues.json` references label IDs `[2]` in some issues. After this change, label ID 2 = "Daily" instead of "concepts". Update any issue seed label references if needed, or remove label refs from issues.json since the seed issue labels are just demo data.

### Step 5: Add label seeding to seed_department_staff command

In `apps/api/plane/db/management/commands/seed_department_staff.py`:

1. Add `Label` to model imports
2. Add `DEFAULT_LABELS` import from `plane.db.models`
3. Add `_seed_labels()` method:

```python
def _seed_labels(self, ws, admin, projects):
    """Seed default labels for all projects."""
    self.stdout.write("Seeding labels...")
    count = 0
    for proj in projects.values():
        labels = Label.objects.bulk_create(
            [
                Label(
                    name=lbl["name"],
                    color=lbl["color"],
                    sort_order=lbl["sort_order"],
                    project=proj,
                    workspace=ws,
                    created_by=admin,
                    updated_by=admin,
                )
                for lbl in DEFAULT_LABELS
            ],
            ignore_conflicts=True,
        )
        count += len(labels)
    self.stdout.write(self.style.SUCCESS(f"  {count} labels."))
```

4. Call `self._seed_labels(ws, admin, projects)` in `handle()` after `_seed_projects()` and before `_seed_issues()`.

<!-- Updated: Validation Session 1 - Add data migration backfill + issues.json cleanup -->

### Step 6: Clean issues.json label references

In `apps/api/plane/seeds/data/issues.json`, remove any label ID references from issue objects (e.g. `"label_ids": [2]` → `"label_ids": []`). Seed issues are demo data; label assignments are optional.

### Step 7: Create data migration to backfill existing projects

Create a new migration in `apps/api/plane/db/migrations/`. **Inline the label data** (do not import from app models — keeps migration self-contained):

```python
# apps/api/plane/db/migrations/XXXX_seed_default_labels_existing_projects.py
from django.db import migrations

# Inlined: matches DEFAULT_LABELS in label.py. Do NOT import from app models.
_DEFAULT_LABELS = [
    {"name": "Bank-wide Project", "color": "#0E8A16", "sort_order": 65535},
    {"name": "Daily",             "color": "#0075CA", "sort_order": 75535},
    {"name": "Weekly",            "color": "#E4E669", "sort_order": 85535},
    {"name": "Monthly",           "color": "#D93F0B", "sort_order": 95535},
    {"name": "Quarterly",         "color": "#0693E3", "sort_order": 105535},
    {"name": "Half-year",         "color": "#FBCA04", "sort_order": 115535},
    {"name": "Yearly",            "color": "#B60205", "sort_order": 125535},
    {"name": "Ad-hoc",            "color": "#D876E3", "sort_order": 135535},
]

def seed_default_labels(apps, schema_editor):
    Label = apps.get_model("db", "Label")
    Project = apps.get_model("db", "Project")
    for project in Project.objects.all():
        Label.objects.bulk_create(
            [
                Label(
                    name=lbl["name"],
                    color=lbl["color"],
                    sort_order=lbl["sort_order"],
                    project=project,
                    workspace=project.workspace,
                )
                for lbl in _DEFAULT_LABELS
            ],
            ignore_conflicts=True,
        )

class Migration(migrations.Migration):
    dependencies = [
        ("db", "PREV_MIGRATION"),  # replace with actual last migration
    ]
    operations = [
        migrations.RunPython(seed_default_labels, migrations.RunPython.noop),
    ]
```

**Note:** Replace `"PREV_MIGRATION"` with the actual latest migration name. Run `python manage.py showmigrations db` to find it.

<!-- Updated: Validation Session 2 - Inline DEFAULT_LABELS in migration (self-contained); noop reverse confirmed -->

### Step 8: Verify compilation

Run Django check:

```bash
cd apps/api && python manage.py check
```

## Todo List

- [x] Define `DEFAULT_LABELS` constant in `label.py`
- [x] Export `DEFAULT_LABELS` from `__init__.py`
- [x] Add `Label.objects.bulk_create()` in `ProjectViewSet.create()`
- [x] Update `labels.json` seed file
- [x] Remove label refs from `issues.json` (do not remap IDs)
- [x] Add `_seed_labels()` to `seed_department_staff` command
- [x] Create data migration to backfill existing projects
- [x] Run `python manage.py check` to verify no errors
- [x] Test: create new project via API, verify 8 labels exist
- [x] Test: run migration on existing DB, verify labels added to existing projects

## Post-Phase Checklist

- [x] `DEFAULT_LABELS` constant follows same pattern as `DEFAULT_STATES`
- [x] `Label` and `DEFAULT_LABELS` properly exported in `__init__.py`
- [x] `bulk_create` uses `ignore_conflicts=True` for idempotency
- [x] `labels.json` has valid JSON with sequential IDs
- [x] No broken seed references in `issues.json`
- [x] `seed_department_staff` command seeds labels for all projects
- [x] Django `check` passes with no errors
- [x] Data migration created and tested (backfills existing projects)

## Success Criteria

- New project creation automatically includes 8 default labels
- Workspace onboarding seed creates projects with 8 default labels
- `seed_department_staff --workspace X --email Y` seeds labels for all projects
- Existing label CRUD (create/update/delete) still works normally

## Risk Assessment

| Risk                             | Likelihood | Impact | Mitigation                                     |
| -------------------------------- | ---------- | ------ | ---------------------------------------------- |
| Duplicate labels on re-seed      | Low        | Low    | `ignore_conflicts=True` in bulk_create         |
| Broken issue seed label refs     | Medium     | Low    | Update issues.json label IDs or remove refs    |
| Color clashes with custom labels | Low        | None   | Users can change colors; defaults are distinct |

## Security Considerations

- No auth changes; label creation uses existing permission model
- `created_by` properly set to requesting user (or admin in seed commands)
- No sensitive data in label names/colors

## Next Steps

- After merge: run `seed_department_staff --clean` on staging to reseed with labels
- Consider: workspace-level "label templates" (YAGNI for now)
- Consider: admin UI to manage default labels per workspace (YAGNI for now)
