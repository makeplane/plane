---
title: "Default Labels for Work Items"
description: "Seed default labels (Bank-wide Project, Daily, Weekly, Monthly, Quarterly, Half-year, Yearly, Ad-hoc) for workspaces/projects"
status: complete
priority: P2
effort: 2h
branch: ngoc-feat/work-items
tags: [labels, seeding, defaults]
created: 2026-03-03
---

# Default Labels for Work Items

## Goal

Automatically seed 8 default labels when a new project is created, making them immediately available without manual setup.

Labels: **Bank-wide Project**, **Daily**, **Weekly**, **Monthly**, **Quarterly**, **Half-year**, **Yearly**, **Ad-hoc**

## Architecture Decision

**Scope: Project-level labels** (not workspace-level).

Rationale:

- `Label` model extends `WorkspaceBaseModel` which has both `workspace` FK and `project` FK (nullable)
- UniqueConstraint splits on `project__isnull`: workspace-level (project=NULL) vs project-level
- Existing seed flow (`workspace_seed_task.py`) creates labels per project via `labels.json`
- Project creation (`project/base.py` L276-290) already seeds `DEFAULT_STATES` per project -- same pattern works for labels
- The `LabelViewSet.get_queryset()` filters by `project_id`, so project-level labels are the standard UX

## Approach

Follow the **`DEFAULT_STATES` pattern**: define a `DEFAULT_LABELS` constant in the label model file, import it in project creation view, and `bulk_create` during `ProjectViewSet.create()`.

Additionally update the existing `labels.json` seed file and `seed_department_staff` management command to include these labels for seeded workspaces.

## Phases

| #   | Phase                                            | Status   | File                                                  |
| --- | ------------------------------------------------ | -------- | ----------------------------------------------------- |
| 1   | Backend: seed default labels on project creation | complete | [phase-01](./phase-01-backend-seed-default-labels.md) |

## Key Files

- `apps/api/plane/db/models/label.py` -- Label model + new `DEFAULT_LABELS` constant
- `apps/api/plane/db/models/__init__.py` -- export `DEFAULT_LABELS`
- `apps/api/plane/app/views/project/base.py` -- `ProjectViewSet.create()` seed labels
- `apps/api/plane/seeds/data/labels.json` -- update seed data for workspace onboarding
- `apps/api/plane/bgtasks/workspace_seed_task.py` -- already reads `labels.json`, no changes needed
- `apps/api/plane/db/management/commands/seed_department_staff.py` -- add label seeding

## Risk

- Low: UniqueConstraint prevents duplicate names per project; `bulk_create(ignore_conflicts=True)` handles edge cases
- **Data migration required**: Backfill existing projects with default labels (confirmed in validation)

## Validation Log

### Session 1 — 2026-03-03

**Trigger:** Initial plan validation before implementation
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** The plan seeds labels at project-level (one set per project). Should these labels instead be workspace-level?
   - Options: Project-level (per project) | Workspace-level (shared)
   - **Answer:** Project-level (per project)
   - **Rationale:** Matches DEFAULT_STATES pattern; LabelViewSet filters by project_id

2. **[Scope]** Should existing projects also get the default labels retroactively?
   - Options: No — new projects only | Yes — add a migration to backfill
   - **Answer:** Yes — add a migration to backfill
   - **Rationale:** Requires adding a Django data migration step to phase-01

3. **[Tradeoffs]** How to handle labels.json / issues.json compatibility?
   - Options: Remove label refs from issues.json | Update issue label IDs | Skip labels.json update
   - **Answer:** Remove label refs from issues.json
   - **Rationale:** Simplest approach; seed issues are demo data only

#### Confirmed Decisions

- Label scope: project-level — follows DEFAULT_STATES pattern
- Backfill: required via Django data migration
- issues.json: strip label references

#### Action Items

- [ ] Add data migration step to phase-01
- [ ] Add step to remove label refs from issues.json

#### Impact on Phases

- Phase 1: Add Step for Django data migration to backfill existing projects; add step to clean issues.json label refs

### Session 2 — 2026-03-03

**Trigger:** Re-validation to surface implementation details missed in Session 1
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** Phase-01 Post-Phase Checklist (line 259) says "No migration file needed" but Step 7 adds a Django data migration.
   - Options: Yes — fix checklist | No — keep as is
   - **Answer:** Yes — fix checklist
   - **Rationale:** Checklist must accurately reflect actual deliverables to prevent the implementer skipping the migration

2. **[Architecture]** Step 7 imports `DEFAULT_LABELS` from app model inside the migration. Django best practice is self-contained migrations.
   - Options: Inline the data | Import from app model
   - **Answer:** Inline the data
   - **Rationale:** Migration will not break if DEFAULT_LABELS is renamed/moved in the future

3. **[Tradeoffs]** Backfill migration uses `migrations.RunPython.noop` — no reverse removes seeded labels on rollback.
   - Options: Yes — noop is fine | No — add reverse
   - **Answer:** Yes — noop is fine
   - **Rationale:** Seeded labels are benign; simpler rollback path is acceptable

#### Confirmed Decisions

- Checklist: fix incorrect "no migration needed" item
- Migration import: inline DEFAULT_LABELS data directly in migration file
- Migration reversal: noop acceptable

#### Action Items

- [ ] Fix post-phase checklist item in phase-01
- [ ] Update Step 7 to inline label data instead of importing from app model

#### Impact on Phases

- Phase 1: Fix checklist line 259; update Step 7 migration to inline DEFAULT_LABELS dict
