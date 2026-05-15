# Phase 01 — Backend: ProjectCopyJob Model + Celery Task

## Overview

- **Priority:** P1 (blocks all other phases)
- **Status:** complete
- **Effort:** 8h
- **Description:** Persist copy job state and implement async deep-copy task in Celery.

## Context Links

- Pattern reference: `apps/api/plane/db/models/exporter.py` (status tracking)
- Pattern reference: `apps/api/plane/bgtasks/export_task.py` (Celery shape)
- Pattern reference: `apps/api/plane/bgtasks/copy_s3_object.py` (S3 copy for cover image)
- Backend rules: `.claude/rules/plane-backend-architecture.md`, `backend-models.md`, `backend-urls-celery.md`

## Requirements

### Functional

- New model `ProjectCopyJob` tracks (source_project, target_workspace, target_identifier, target_name, created_by, status, new_project_id, error, started_at, completed_at)
- Status enum: `queued`, `processing`, `completed`, `failed`
- Celery task `copy_project_task(job_id)` performs deep copy in a single `transaction.atomic()` block
- Copies entities in dependency order (project → estimates → states → labels → modules → cycles → issues → issue-label/cycle/module → comments → pages → cover image)
- Builds in-memory `id_map` dicts (old_id → new_id) per entity, used to remap FKs on dependents
- Drops assignees (cross-workspace). Drops attachments. Drops members/invites/views/drafts/intake.

### Non-Functional

- Use `bulk_create(batch_size=100)` for issues/labels/comments
- Task soft-time-limit 600s, retry 0 (atomic — failure rolls back)
- All FKs verified in remap before write

## Architecture

### Model `ProjectCopyJob` (apps/api/plane/db/models/project_copy.py)

```python
class ProjectCopyJob(BaseModel):
    STATUS_CHOICES = (
        ("queued", "Queued"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    )
    source_project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="copy_jobs_from")
    target_workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="copy_jobs_to")
    target_identifier = models.CharField(max_length=12)
    target_name = models.CharField(max_length=255)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="queued")
    new_project = models.ForeignKey("db.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="copy_jobs_created")
    error = models.TextField(blank=True, default="")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "project_copy_jobs"
        ordering = ("-created_at",)
```

### Task `copy_project_task(job_id)` flow

```
1. Fetch job; set status=processing, started_at=now()
2. with transaction.atomic():
   a. Fetch source project + all related (select_related/prefetch_related)
   b. Create new Project in target_workspace (copy metadata; identifier from job; name from job)
   c. Copy ProjectMember (only created_by as ADMIN of new project)
   d. Copy Estimates + EstimatePoints (build estimate_id_map, point_id_map)
   e. Copy States (build state_id_map; remap project.default_state, estimate)
   f. Copy Labels (workspace-scoped — re-create in target workspace) → label_id_map
   g. Copy Modules (empty) → module_id_map
   h. Copy Cycles (empty) → cycle_id_map
   i. Bulk-copy Issues (remap state, parent, estimate_point); two passes for sub-issue parent:
      - Pass 1: insert without parent → issue_id_map
      - Pass 2: bulk_update parent_id using map
   j. Bulk-copy IssueLabel (m2m through, remap issue+label)
   k. Bulk-copy IssueModule + IssueCycle (remap)
   l. Bulk-copy IssueComment (drop actor remap; set actor=created_by)
   m. Copy Pages (workspace-scoped; copy ProjectPage join; remap parent_id for nested pages)
   n. Update default fields on new Project (default_state, default_assignee=created_by)
3. (Outside transaction) Fire copy_s3_object for cover image if present
4. Set status=completed, new_project_id, completed_at=now()
5. On any exception: rollback transaction; set status=failed, error=str(e), completed_at=now()
```

### FK Remap Maps

```python
estimate_id_map: dict[UUID, UUID]
state_id_map: dict[UUID, UUID]
label_id_map: dict[UUID, UUID]
module_id_map: dict[UUID, UUID]
cycle_id_map: dict[UUID, UUID]
issue_id_map: dict[UUID, UUID]
page_id_map: dict[UUID, UUID]
```

## Related Code Files

### To Create

- `apps/api/plane/db/models/project_copy.py` — ProjectCopyJob model
- `apps/api/plane/bgtasks/copy_project_task.py` — Celery task
- `apps/api/plane/utils/porters/project_copy.py` — pure-function copy logic (split for testability)
- `apps/api/plane/db/migrations/00XX_project_copy_job.py` — auto-generated

### To Modify

- `apps/api/plane/db/models/__init__.py` — export `ProjectCopyJob`

### To Read for Context

- `apps/api/plane/db/models/project.py` — Project fields, identifier validation
- `apps/api/plane/db/models/state.py`, `label.py`, `cycle.py`, `module.py`, `estimate.py`, `page.py`
- `apps/api/plane/db/models/issue.py` — Issue, IssueLabel, IssueModule, IssueCycle, IssueComment, parent FK
- `apps/api/plane/bgtasks/export_task.py` — status update pattern
- `apps/api/plane/bgtasks/copy_s3_object.py` — `copy_assets` function (reuse for cover image)

## Implementation Steps

1. Create `project_copy.py` model with fields listed above
2. Register in `plane/db/models/__init__.py`
3. Run `python manage.py makemigrations` → verify generated migration has correct FKs
4. Create `utils/porters/project_copy.py` with one function per entity (`_copy_estimates`, `_copy_states`, `_copy_labels`, `_copy_modules`, `_copy_cycles`, `_copy_issues`, `_copy_issue_relations`, `_copy_comments`, `_copy_pages`). Each takes (source_project, new_project, id_maps) and returns updated id_maps.
5. Create `bgtasks/copy_project_task.py`:
   - `@shared_task(soft_time_limit=600, time_limit=660)`
   - Import porter functions
   - Orchestrate steps 1–5 above
   - Catch + log via `log_exception`
6. Register task in `plane/bgtasks/__init__.py` (if a registry exists; otherwise auto-discovered via Celery autodiscover)
7. Write unit tests (`apps/api/plane/tests/bgtasks/test_copy_project_task.py`):
   - `test_copy_creates_new_project_with_states`
   - `test_copy_remaps_issue_state_fk`
   - `test_copy_preserves_sub_issue_parent_within_project`
   - `test_copy_drops_assignees`
   - `test_copy_drops_attachments`
   - `test_copy_rolls_back_on_state_creation_failure`
   - `test_copy_sets_status_failed_on_exception`
   - `test_copy_uses_target_identifier`

## Todo List

- [x] Create `ProjectCopyJob` model
- [x] Register model in `__init__.py`
- [x] Generate + verify migration
- [x] Implement porter functions (one per entity)
- [x] Implement Celery task orchestration
- [x] Wire cover image S3 copy (post-transaction)
- [x] Write 8 unit tests above
- [x] `cd apps/api && python run_tests.py -u` green

## Success Criteria

- Migration applies cleanly to fresh DB and existing DB
- Unit tests above all green
- `gitnexus_detect_changes()` reports only expected new symbols (model, task, porter)
- Manual test: copy a project with 100 issues, 5 modules, 3 cycles, 10 pages — verify counts match in new workspace, sub-issues correctly nested

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Migration conflicts with other open PRs | Pull develop before `makemigrations` |
| `bulk_create` skips `save()` signals (activity tracking) | Acceptable — copy is silent, no activity log expected |
| Labels could collide with existing labels in target workspace by name | DB allows duplicates (uniqueness is on `(name, workspace, project)` — verify); just re-create |
| Issue.sequence_id collisions across workspaces | sequence_id is per-project — fresh new project starts at 1; safe |
| Estimate FK on Project.estimate could be unset | Remap via estimate_id_map; if source has no estimate, skip |

## Security Considerations

- Task accepts only `job_id` (UUID) — re-fetches user from job to prevent privilege escalation
- All ORM queries scoped by `source_project`; no leakage from other projects/workspaces
- No raw SQL

## Next Steps

- Unblocks Phase 02 (API endpoint imports task + model)
