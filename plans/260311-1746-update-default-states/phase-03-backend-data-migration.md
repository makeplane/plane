---
phase: 3
title: "Backend: Data Migration"
status: pending
effort: 0.5h
---

# Phase 3 — Backend: Data Migration

## Context

- Parent: [plan.md](./plan.md)
- Depends on: Phase 1 (is_system field must exist)

## Overview

Migrate existing projects' seeded states to reflect new names and `is_system=True`. Handle the transition from old DEFAULT_STATES (Draft/Todo/In Progress/Done/Cancelled) to new set.

## Requirements

1. Existing states matching old default names → set `is_system=True`
2. Rename "Todo" → "Scheduled" and change group if needed, set as default
3. Add missing new states (Internal Review, Postponed) to existing projects
4. Update `default=True` to point to "Scheduled" (unmark "Draft")
5. Update seed JSON file

## Architecture

```
Data migration strategy:
├── For each existing project
│   ├── Mark known system state names as is_system=True
│   ├── Rename "Todo" → "Scheduled", set default=True
│   ├── Unmark "Draft" as default
│   ├── Add "Internal Review" + "Postponed" to started group
│   └── Leave any custom (non-system) states untouched
└── Update states.json seed file
```

## Related Code Files

- `apps/api/plane/db/migrations/` — new data migration
- `apps/api/plane/seeds/data/states.json`

## Implementation Steps

### 1. Create data migration

```bash
cd apps/api && python manage.py makemigrations db --name="seed_update_system_states" --empty
```

### 2. Migration logic

```python
def migrate_system_states(apps, schema_editor):
    State = apps.get_model("db", "State")

    OLD_SYSTEM_NAMES = {"Draft", "Todo", "In Progress", "Done", "Cancelled", "Triage"}

    # Mark existing system states (non-Triage)
    State.objects.filter(
        name__in=OLD_SYSTEM_NAMES - {"Triage"},
        deleted_at__isnull=True
    ).update(is_system=True)

    # Mark Triage as is_system=True and force group='unstarted'
    # Note: 'triage' is a valid Django group choice but not in frontend TStateGroups;
    # setting group='unstarted' ensures correct frontend display
    State.objects.filter(
        name="Triage",
        deleted_at__isnull=True
    ).update(is_system=True, group="unstarted")
    # NOTE: Phase 1 DEFAULT_STATES Triage must also use group='unstarted' for consistency

    # Unmark "Draft" as default FIRST (safe ordering to avoid unique constraint violation)
    State.objects.filter(
        name="Draft",
        deleted_at__isnull=True
    ).update(default=False)

    # Rename "Todo" → "Scheduled", update group, set as new default
    State.objects.filter(
        name="Todo",
        group="unstarted",
        deleted_at__isnull=True
    ).update(name="Scheduled", default=True)
    # NOTE: Draft default unset first — prevents potential unique(project, default=True) violation

    # Add missing states per project
    # NOTE: name-check (has_review / has_postponed) is the primary duplicate guard
    projects_with_states = (
        State.objects
        .filter(deleted_at__isnull=True, is_system=True)
        .values("project", "workspace")
        .distinct()
    )

    new_states = []
    for entry in projects_with_states:
        pid = entry["project"]
        wid = entry["workspace"]

        has_review = State.objects.filter(
            project_id=pid, name="Internal Review", deleted_at__isnull=True
        ).exists()
        has_postponed = State.objects.filter(
            project_id=pid, name="Postponed", deleted_at__isnull=True
        ).exists()

        if not has_review:
            new_states.append(State(
                project_id=pid, workspace_id=wid,
                name="Internal Review", color="#8B5CF6",
                sequence=35000, group="started",
                is_system=True, default=False
            ))
        if not has_postponed:
            new_states.append(State(
                project_id=pid, workspace_id=wid,
                name="Postponed", color="#9AA4BC",
                sequence=40000, group="started",
                is_system=True, default=False
            ))

    if new_states:
        State.objects.bulk_create(new_states, ignore_conflicts=True)
```

<!-- Updated: Validation Session 7 - Triage NOT added to existing projects (intentional); only new projects created after migration get all 8 states including Triage -->

### 3. Update seed JSON `apps/api/plane/seeds/data/states.json`

Replace content with new state set matching DEFAULT_STATES (all 8 states including Triage, with `is_system: true`).

<!-- Updated: Validation Session 3 - Include Triage in states.json (consistent with DEFAULT_STATES) -->

## Todo

- [ ] Create empty data migration
- [ ] Implement `migrate_system_states` function
- [ ] Add `reverse_code` (no-op is acceptable)
- [ ] Update `states.json` seed file
- [ ] Test migration on local DB with existing projects

## Success Criteria

- All existing "Todo" states renamed to "Scheduled" with `default=True`
- "Draft" no longer marked as default
- `is_system=True` on all old seeded states
- Each project has "Internal Review" and "Postponed" in started group
- Migration is idempotent (safe to run twice)

## Risk Assessment

- **Medium**: Renames affect existing issues in "Todo" state — state still works, just renamed
- Projects with custom "Scheduled" or "Internal Review" states may get duplicates → `ignore_conflicts=True` handles name collision

<!-- Updated: Validation Session 2 - Reorder unset Draft default before setting Scheduled; name-check confirmed as primary duplicate guard -->

## Next Steps

→ Phase 4: Frontend types & store
