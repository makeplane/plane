# Phase 03 — Backend Seed / Dummy Data + Data Migration

**Parent:** [plan.md](plan.md)
**Date:** 2026-03-06 | **Status:** pending

## Overview

Rename the display name "Backlog" → "Draft" in all backend data creation code **and** in existing DB records via a data migration. The `group = "backlog"` enum value stays.

## Key Insights

- `StateGroup.BACKLOG = "backlog", "Backlog"` — Django enum verbose name changes to "Draft" (cosmetic, shown only in Django admin)
- Seed data and management commands create states with `name="Backlog"` — these must be updated so new projects get "Draft"
- Existing DB records **will be renamed** via a new data migration (user decision: consistent display for existing projects)
- Migration `0063` hardcodes `"Backlog"` as a name filter — this is a historical migration, do NOT change it

## Related Files

| File                                                                | Change                                                                                       |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `apps/api/plane/db/models/state.py`                                 | `StateGroup.BACKLOG = "backlog", "Backlog"` verbose name → `"Draft"`                         |
| `apps/api/plane/seeds/data/states.json`                             | `"name": "Backlog"` → `"name": "Draft"`                                                      |
| `apps/api/plane/bgtasks/dummy_data_task.py`                         | `"name": "Backlog"` in inline dict → `"Draft"`                                               |
| `apps/api/plane/db/management/commands/seed_department_staff.py`    | `("Backlog", ...)` tuple → `("Draft", ...)`                                                  |
| `apps/api/plane/db/migrations/XXXX_rename_backlog_state_display.py` | New data migration — UPDATE states set name='Draft' where name='Backlog' and group='backlog' |

## Do NOT Change

- `apps/api/plane/db/migrations/0063_state_is_triage_alter_state_group.py` — historical migration, changing it would corrupt migration history
- `apps/api/plane/db/migrations/0009_*` and `0011_*` — same reason
- `group = "backlog"` anywhere — this is the internal key, not a display name

## Implementation Steps

<!-- Updated: Validation Session 1 - Add data migration for existing DB records -->

1. `state.py` line 15: `"Backlog"` → `"Draft"` in verbose name
2. `states.json` line 4: `"name": "Backlog"` → `"name": "Draft"`
3. `dummy_data_task.py` line 85: `"name": "Backlog"` → `"name": "Draft"`
4. `seed_department_staff.py` line 127: `("Backlog", ...)` → `("Draft", ...)`
5. **Create Django data migration** — rename existing state records:

   ```bash
   cd apps/api && python manage.py makemigrations plane --empty --name rename_backlog_state_display
   ```

   Then in the generated migration file:

   ```python
   from django.db import migrations

   # Updated: Validation Session 2 - filter deleted_at__isnull=True (active records only)
   def rename_backlog_to_draft(apps, schema_editor):
       State = apps.get_model("plane", "State")
       State.objects.filter(name="Backlog", group="backlog", deleted_at__isnull=True).update(name="Draft")

   def rename_draft_to_backlog(apps, schema_editor):
       State = apps.get_model("plane", "State")
       State.objects.filter(name="Draft", group="backlog", deleted_at__isnull=True).update(name="Backlog")

   class Migration(migrations.Migration):
       # Before committing: run `ls apps/api/plane/db/migrations/ | sort | tail -1`
       # to find the latest migration and replace XXXX_previous below
       # Updated: Validation Session 2 - auto-detect dependency at implementation time
       dependencies = [("plane", "XXXX_previous")]
       operations = [migrations.RunPython(rename_backlog_to_draft, rename_draft_to_backlog)]
   ```

## Success Criteria

- New projects seeded via management commands create a state named "Draft"
- Existing DB state records with `name="Backlog"` and `group="backlog"` are renamed to "Draft"
- Historical migration files (`0063`, `0009`, `0011`) not modified
- All `group="backlog"` references intact
