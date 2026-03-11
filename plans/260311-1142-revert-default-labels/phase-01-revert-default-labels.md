# Phase 01: Revert Default Labels

## Context Links

- Label model: `apps/api/plane/db/models/label.py`
- Model exports: `apps/api/plane/db/models/__init__.py`
- Project view: `apps/api/plane/app/views/project/base.py`
- Seed command: `apps/api/plane/db/management/commands/seed_department_staff.py`
- Labels seed: `apps/api/plane/seeds/data/labels.json`
- Issues seed: `apps/api/plane/seeds/data/issues.json`
- Migration to delete: `apps/api/plane/db/migrations/0128_seed_default_labels_existing_projects.py`
- Migration to delete: `apps/api/plane/db/migrations/0134_add_biweekly_default_label.py`
- Latest migration: `apps/api/plane/db/migrations/0135_rename_backlog_state_display.py`

## Overview

- **Priority**: P2
- **Status**: todo
- **Description**: Undo all changes from plan 260303-2042-default-labels. Remove DEFAULT_LABELS constant, seeding code, seed data updates, and create a reverse data migration to clean the DB.

## Embedded Rules

- YAGNI/KISS: Remove code only, add nothing extra
- No mocks: Real migration that actually deletes seeded labels
- File size: All files stay under 200 lines
- Conventional commits: `revert(labels): remove default labels seeding`

## Implementation Steps

### Step 0: Grep scope check

Before any changes, verify no files beyond the plan's scope reference `DEFAULT_LABELS` or `_seed_labels`:

```bash
grep -r "DEFAULT_LABELS" apps/api/ --include="*.py" -l
grep -r "_seed_labels" apps/api/ --include="*.py" -l
```

If files appear outside the 3 known files (label.py, **init**.py, base.py, seed_department_staff.py, 0128/0134 migrations), update the scope table before proceeding.

Also grep frontend:

```bash
grep -r "DEFAULT_LABELS" apps/web/ --include="*.ts" --include="*.tsx" -l
grep -r "_seed_labels" apps/web/ --include="*.ts" --include="*.tsx" -l
```

<!-- Updated: Validation Session 3 - Add pre-implementation grep to confirm full scope -->
<!-- Updated: Validation Session 4 - Extend grep to include apps/web frontend -->

### Step 1: Remove DEFAULT_LABELS from label.py

In `apps/api/plane/db/models/label.py`, delete the entire `DEFAULT_LABELS` list (lines ~63–75).

Before:

```python
# ...Label class...

DEFAULT_LABELS = [
    {"name": "Bank-wide Project", "color": "#0E8A16", "sort_order": 65535},
    {"name": "Daily",             "color": "#0075CA", "sort_order": 75535},
    {"name": "Weekly",            "color": "#E4E669", "sort_order": 85535},
    {"name": "Monthly",           "color": "#D93F0B", "sort_order": 95535},
    {"name": "Quarterly",         "color": "#0693E3", "sort_order": 105535},
    {"name": "Half-year",         "color": "#FBCA04", "sort_order": 115535},
    {"name": "Yearly",            "color": "#B60205", "sort_order": 125535},
    {"name": "Ad-hoc",            "color": "#D876E3", "sort_order": 135535},
]
```

After: remove entirely.

### Step 2: Remove DEFAULT_LABELS from **init**.py

In `apps/api/plane/db/models/__init__.py`, revert:

```python
# Before:
from .label import Label, DEFAULT_LABELS

# After:
from .label import Label
```

### Step 3: Remove Label seeding from project/base.py

In `apps/api/plane/app/views/project/base.py`:

1. Remove `DEFAULT_LABELS` from the import at line ~33:

   ```python
   # Before:
   from plane.db.models import (
       ...
       DEFAULT_LABELS,
       ...
   )
   # After: remove DEFAULT_LABELS from this import
   ```

2. Remove the Label bulk_create block (~lines 298–314):

   ```python
   # Remove this entire block:
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

3. If `Label` is no longer used anywhere in `base.py` after removing, also remove it from the import. Check first.

### Step 4: Restore labels.json

Replace `apps/api/plane/seeds/data/labels.json` with original content:

```json
[
  {
    "id": 1,
    "name": "admin",
    "color": "#0693e3",
    "sort_order": 85535,
    "project_id": 1
  },
  {
    "id": 2,
    "name": "concepts",
    "color": "#9900ef",
    "sort_order": 95535,
    "project_id": 1
  }
]
```

### Step 5: Restore issues.json label reference

In `apps/api/plane/seeds/data/issues.json`, restore issue id=2:

- Find the object with `"id": 2`
- Change `"labels": []` back to `"labels": [2]`

### Step 6: Remove \_seed_labels from seed_department_staff.py

In `apps/api/plane/db/management/commands/seed_department_staff.py`:

1. Remove `DEFAULT_LABELS` from imports (line ~14):

   ```python
   # Before:
   from plane.db.models import Department, StaffProfile, Label, DEFAULT_LABELS
   # After:
   from plane.db.models import Department, StaffProfile, Label
   ```

   Verify first: grep for `Label` usage outside `_seed_labels` in this file. If only used there, remove from import too.
   <!-- Updated: Validation Session 2 - Verify Label usage before removing import -->

2. Remove the `self._seed_labels(ws, admin, projects)` call (line ~46).

3. Delete the entire `_seed_labels()` method (lines ~200–220).

### Step 7: Create reverse migration 0136

Create `apps/api/plane/db/migrations/0136_remove_default_labels_from_projects.py`:

```python
# Data migration: remove seeded default labels from all projects
# and clean up ghost migration records from the deleted 0128/0134 files.
#
# NOTE: Migrations 0128 and 0134 were custom data-only migrations added in
# plan 260303-2042-default-labels (private fork). They have been intentionally
# deleted as part of the revert. The sequence gap (0128→0134 missing) is
# expected — Django resolves the dependency chain via 0135 as the base.
from django.db import migrations

_SEEDED_NAMES_SQL = (
    "'Bank-wide Project','Daily','Weekly','Bi-weekly',"
    "'Monthly','Quarterly','Half-year','Yearly','Ad-hoc'"
)

class Migration(migrations.Migration):
    dependencies = [
        ("db", "0135_rename_backlog_state_display"),
    ]
    operations = [
        # Hard delete via raw SQL to bypass SoftDeletionManager.
        # Using ORM .delete() on Label would only soft-delete (sets deleted_at).
        migrations.RunSQL(
            sql=f"DELETE FROM db_label WHERE name IN ({_SEEDED_NAMES_SQL})",
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Remove ghost records left by deleted migration files 0128 and 0134.
        migrations.RunSQL(
            sql=(
                "DELETE FROM django_migrations WHERE app = 'db' AND name IN ("
                "'0128_seed_default_labels_existing_projects',"
                "'0134_add_biweekly_default_label'"
                ")"
            ),
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
```

<!-- Updated: Validation Session 1 - Add RunSQL to clean ghost migration rows for 0128 and 0134 -->
<!-- Updated: Validation Session 5 - Replace RunPython ORM delete with RunSQL hard delete to bypass SoftDeletionManager -->

### Step 8: Delete obsolete migration files

Delete:

- `apps/api/plane/db/migrations/0128_seed_default_labels_existing_projects.py`
- `apps/api/plane/db/migrations/0134_add_biweekly_default_label.py`

> Note: The 0128 collision (there's also `0128_usernotificationpreference_worklog_reminder.py`) won't matter once our file is deleted — Django will only see the remaining 0128 as a valid leaf.

### Step 9: Verify

```bash
cd apps/api && python manage.py check
cd apps/api && python manage.py migrate
# Confirm seeded labels are fully removed (raw SQL bypasses SoftDeletionManager)
python manage.py shell -c "
from django.db import connection
names = \"'Bank-wide Project','Daily','Weekly','Bi-weekly','Monthly','Quarterly','Half-year','Yearly','Ad-hoc'\"
with connection.cursor() as cursor:
    cursor.execute(f'SELECT COUNT(*) FROM db_label WHERE name IN ({names})')
    count = cursor.fetchone()[0]
print(f'Seeded labels remaining (physical rows): {count} (expected 0)')
"
```

<!-- Updated: Validation Session 2 - Add migrate command to confirm 0136 applies cleanly and ghost rows removed -->
<!-- Updated: Validation Session 4 - Add DB count assertion to confirm labels deleted -->
<!-- Updated: Validation Session 5 - Replace ORM count with raw SQL count to detect physical rows regardless of deleted_at -->

## Post-Phase Checklist

- [ ] `DEFAULT_LABELS` fully removed from label.py, **init**.py, base.py, seed_department_staff.py
- [ ] `labels.json` has original 2 entries (admin, concepts)
- [ ] `issues.json` issue id=2 has `"labels": [2]`
- [ ] Migration 0136 correctly targets all 9 label names (including Bi-weekly)
- [ ] Migration 0136 depends on `0135_rename_backlog_state_display`
- [ ] Files 0128_seed_default_labels and 0134_add_biweekly deleted
- [ ] `python manage.py check` passes
- [ ] `python manage.py migrate` passes (0136 applied, ghost rows removed)
<!-- Updated: Validation Session 4 - Add migrate to Post-Phase Checklist -->

## Todo List

- [ ] Remove `DEFAULT_LABELS` constant from `label.py`
- [ ] Remove `DEFAULT_LABELS` from `__init__.py` import
- [ ] Remove Label seeding block from `project/base.py`
- [ ] Restore `labels.json`
- [ ] Restore `issues.json` label ref on issue id=2
- [ ] Remove `_seed_labels()` + call from `seed_department_staff.py`
- [ ] Create migration `0136_remove_default_labels_from_projects.py`
- [ ] Delete `0128_seed_default_labels_existing_projects.py`
- [ ] Delete `0134_add_biweekly_default_label.py`
- [ ] Run `python manage.py check`
- [ ] Run `python manage.py migrate`
