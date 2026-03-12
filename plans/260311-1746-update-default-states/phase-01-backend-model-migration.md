---
phase: 1
title: "Backend: Model & Migration"
status: pending
effort: 1h
---

# Phase 1 — Backend: Model & Migration

## Context

- Parent: [plan.md](./plan.md)
- State model: `apps/api/plane/db/models/state.py`
- Migrations: `apps/api/plane/db/migrations/`

## Overview

Add `is_system` boolean field to State model to mark default-seeded states that only instance admins can modify. Update DEFAULT_STATES list to match new requirements.

## Requirements

1. Add `is_system: BooleanField(default=False)` to State model
2. Update `DEFAULT_STATES` list — new set with correct groups and colors
3. Change default state from "Draft" to "Scheduled"
4. Create Django migration

## Architecture

```
State model
├── existing fields (name, color, group, default, sequence, ...)
└── [NEW] is_system: BooleanField(default=False)
    └── When True → only InstanceAdmin can mutate
```

## Related Code Files

- `apps/api/plane/db/models/state.py` (lines 24-62: DEFAULT_STATES, State class)
- `apps/api/plane/db/migrations/` (create new migration)

## Implementation Steps

### 1. Update `DEFAULT_STATES` in `state.py`

```python
DEFAULT_STATES = [
    {
        "name": "Draft",
        "color": "#60646C",
        "sequence": 10000,
        "group": "backlog",
        "default": False,
        "is_system": True,
    },
    {
        "name": "Scheduled",
        "color": "#60646C",
        "sequence": 20000,
        "group": "unstarted",
        "default": True,   # ← new default
        "is_system": True,
    },
    {
        "name": "In Progress",
        "color": "#F59E0B",
        "sequence": 30000,
        "group": "started",
        "is_system": True,
    },
    {
        "name": "Internal Review",
        "color": "#8B5CF6",
        "sequence": 35000,
        "group": "started",
        "is_system": True,
    },
    {
        "name": "Postponed",
        "color": "#9AA4BC",
        "sequence": 40000,
        "group": "started",
        "is_system": True,
    },
    {
        "name": "Done",
        "color": "#46A758",
        "sequence": 50000,
        "group": "completed",
        "is_system": True,
    },
    {
        "name": "Cancelled",
        "color": "#9AA4BC",
        "sequence": 60000,
        "group": "cancelled",
        "is_system": True,
    },
    {
        "name": "Triage",
        "color": "#4E5355",
        "sequence": 65000,
        "group": "unstarted",  # 'triage' group exists in backend but not in frontend TStateGroups
        "is_system": True,
    },
    # Note: Session 4 — 'triage' group is valid in Django but excluded from TStateGroups TS type.
    # Using 'unstarted' for consistent frontend display.
]
```

### 2. Add `is_system` field to State class

```python
is_system = models.BooleanField(default=False)
```

Place after `is_triage` field.

### 3. Update `bulk_create` in project creation views

In `apps/api/plane/app/views/project/base.py` and `apps/api/plane/api/views/project.py`:

- Ensure `is_system` key is passed through from DEFAULT_STATES to bulk_create

### 4. Generate migration

```bash
cd apps/api && python manage.py makemigrations db --name="add_is_system_to_state"
```

## Prerequisite

- [ ] Commit `apps/api/plane/db/migrations/0136_remove_default_labels_from_projects.py` before running makemigrations
<!-- Updated: Validation Session 5 - Commit modified 0136 first to avoid dirty state conflicts -->

## Todo

- [ ] Add `is_system` field to State model
- [ ] Update DEFAULT_STATES constant
- [ ] Verify bulk_create passes `is_system` key
- [ ] Generate and review migration file
- [ ] Update seed data JSON: `apps/api/plane/seeds/data/states.json`

## Success Criteria

- Migration runs without errors
- New projects get 8 states (7 + Triage) with `is_system=True`
- Default state for new projects = "Scheduled"

## Risk Assessment

- **Low**: Additive change, `default=False` ensures backward compat on existing states
- Existing projects keep their states unchanged

## Next Steps

→ Phase 2: API permission guards
