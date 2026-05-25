---
title: "Draft Categories Persistence + Backlog Default"
description: "Persist main/sub task category on DraftIssue; auto-default draft state to backlog; forward draft categories into move-to-project payload; surface field-level errors on move failure."
status: completed
priority: P1
branch: "ngoc-feat/categories"
tags: [draft, categories, work-item, backend, frontend, tdd]
blockedBy: []
blocks: []
created: "2026-05-25"
createdBy: "ck:plan"
source: skill
---

# Draft Categories Persistence + Backlog Default

## Problem

When user creates draft work item with `main_task_category_id` / `sub_task_category_id`, both fields are silently dropped on save (DraftIssue model lacks columns). On "Move to team/project", `IssueCreateSerializer.validate()` rejects with 400 because categories are mandatory for non-backlog/cancelled states. Frontend shows generic toast — user loses data.

## Solution

1. Add 2 nullable FKs to `DraftIssue` → categories now persist
2. Default new drafts to state `group=backlog` → existing drafts (no categories) still movable since validator skips category check for backlog
3. On move endpoint, forward draft's stored categories into payload (fallback)
4. Extend TS type + replace generic toast with field-level error surface

## Related Plans

- `plans/260312-1307-draft-state-optional-fields/` (completed) — established that backlog-group skips required-field validation
- `plans/270303-0244-task-category-columns/` (completed) — Issue model already has category FKs; this plan mirrors to DraftIssue

## Phases (TDD: Red → Green → Refactor per phase)

| Phase | Name                                                                                 | Status    |
| ----- | ------------------------------------------------------------------------------------ | --------- |
| 1     | [Backend Tests Scaffold](./phase-01-backend-tests-scaffold.md)                       | Completed |
| 2     | [Backend Model + Migration](./phase-02-backend-model-migration.md)                   | Completed |
| 3     | [Backend Serializer + Move Endpoint](./phase-03-backend-serializer-move-endpoint.md) | Completed |
| 4     | [Frontend Types + Error UX](./phase-04-frontend-types-error-ux.md)                   | Completed |
| 5     | [Integration Tests](./phase-05-integration-tests.md)                                 | Completed |

## Key Decisions (User-Locked)

- **Q1** Draft default state → `group=backlog` (auto-select; user can override). Non-draft create unchanged (existing `default=True` lookup picks system-seeded "Scheduled").
- **Q2** Full field audit done — only `main_task_category_id` + `sub_task_category_id` dropped (see `plans/reports/audit-260525-1106-draft-dropped-fields.md`).
- **Q3** No backfill — existing drafts default to backlog state, validator skips category enforcement on move.

## Context Links

- Audit: [`plans/reports/audit-260525-1106-draft-dropped-fields.md`](../reports/audit-260525-1106-draft-dropped-fields.md)

## Validation Log

### Session 1 (2026-05-25)

**Verification Pass (Standard tier):**

- Claims checked: 8 | Verified: 8 | Failed: 0 | Unverified: 0
- `DraftIssue.save()` at `db/models/draft.py:83` ✓
- `IssueCreateSerializer.validate()` backlog skip at `serializers/issue.py:228` ✓
- DRF error key returned as `main_task_category_id` at `serializers/issue.py:234` ✓ (NOT `main_task_category` — Phase 4 normalize is unnecessary)
- `create_draft_to_issue` at `views/workspace/draft.py:206` ✓
- `DraftIssueSerializer` explicit fields list at `serializers/draft.py:300-334` ✓
- `DraftIssueCreateSerializer` uses `fields = "__all__"` at line 54 ✓ (auto-picks new columns)
- Category FK targets `db.MainTaskCategory` / `db.SubTaskCategory` per `issue.py:188,195` ✓
- `TWorkspaceDraftIssue` at `packages/types/src/workspace-draft-issues/base.ts:9` ✓

**Decisions:**

- **V1 (Phase 2):** Drop `is_system=True` from backlog state lookup. Filter on `group="backlog"` only; fallback to `default=True`. Reason: validator only checks group; legacy projects without seeded `is_system` backlog risk NULL state.
- **V2 (Phase 3):** Forward-fill semantics — treat null/missing as "use draft value". Trigger fill when key absent OR value is None/empty (`not payload.get(key)`). Reason: RHF sends explicit null; "not in payload" check would never fire.
- **V3 (Phase 4):** Drop `_id`-suffix normalize. Backend already returns form-compatible keys (`main_task_category_id`). Pass DRF error map straight to `setError`.
- **V4 (Phase 1):** Add `DraftIssueFactory`, `MainTaskCategoryFactory`, `SubTaskCategoryFactory` inline in Phase 1 step 2 (extend `factories.py`). No separate phase.

### Whole-Plan Consistency Sweep

- Scanned all 6 plan files for stale terms (`is_system=True`, `setdefault`, `endsWith("_id")`, `not in payload`, `main_task_category` ≠ `_id`).
- Reconciled 2 stale references in `phase-02` (Requirements line + step 5 inspection note).
- Phase 3 narrative + code block both updated to `not payload.get(...)`.
- Phase 4 narrative + code block both pass keys through unchanged.
- No remaining contradictions. Plan ready for `/ck:cook`.
