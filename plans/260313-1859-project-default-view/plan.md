---
title: "Default Project View"
description: "Auto-seed a Daily Status spreadsheet view with 14 columns for every project (no department/project name columns)"
status: complete
priority: P1
effort: 8h
branch: ngoc-feat/workspaces
tags: [project, views, spreadsheet, default-view]
created: 2026-03-13
---

# Default Project View

## Goal

Every project gets an auto-seeded, non-deletable spreadsheet view ("Daily Status") with 14 ordered columns. Excludes `department_name` and `project_name` (redundant at project scope).

## Prerequisite

Workspace default view plan `plans/260313-1538-workspace-default-view` must be complete (provides `is_default` model field, 7 CE column components, extended API data).

## Phases

| #   | Phase                                       | Effort | Status  | File                                                                         |
| --- | ------------------------------------------- | ------ | ------- | ---------------------------------------------------------------------------- |
| 1   | Backend: Default view seed + Project signal | 3h     | ✅ Done | [phase-01](phase-01-backend-default-view-seed.md)                            |
| 2   | Frontend: Default view UI (project views)   | 3h     | ✅ Done | [phase-02-frontend-default-view-ui.md](phase-02-frontend-default-view-ui.md) |
| 3   | Integration & validation                    | 2h     | ✅ Done | [phase-03](phase-03-integration-validation.md)                               |

## Key Architecture Decisions

1. **Reuse `is_default` on IssueView** — field from workspace plan; project views use `project__isnull=False` to distinguish
2. **14 columns** — same CE column components as workspace view, but `department_name=False`, `project_name=False` in `display_properties`
3. **Project signal** — `apps/api/plane/db/signals/project.py`, `post_save` on `Project`, `created=True` only
4. **Data migration 0148** — seeds all existing projects; idempotent (skip if `is_default` view already exists)
5. **`owned_by`** — `project.created_by or project.workspace.owner`

## Column Order (14 columns)

```
assignee, modules, bank_wide_project, key, sub_issue_count,
priority, cycle, state, progress_tracking, start_date,
due_date, completed_date, reference_link, total_log_time
```

## Dependencies

- Migration 0145: `is_default` on IssueView ✅
- Migration 0146–0147: workspace default views ✅
- CE column components (7): all implemented ✅
- `total_logged_minutes` annotation in `ViewIssueListSerializer` ✅

## Validation Log

### Session 1 — 2026-03-13

**Trigger:** Initial plan validation before Phase 3 execution
**Questions asked:** 4

#### Questions & Answers

1. **[Risk]** Does `IssueViewViewSet.destroy()` for project views guard `is_default`? Workspace view has this guard — should we verify/add it before marking Phase 3 done?
   - Options: Verify + fix if missing | Assume it's covered | Skip — frontend guard is enough
   - **Answer:** Verify + fix if missing
   - **Rationale:** Backend deletion guard is critical safety; must explicitly confirm or add to project view destroy()

2. **[Scope]** The auto-nav uses `router.replace` on the views LIST page only. Should the view detail page also enforce redirect if a non-default view is accessed directly?
   - Options: List page only | Redirect on detail page too
   - **Answer:** List page only
   - **Rationale:** Direct `/views/{id}` URLs remain accessible; auto-nav is convenience-only on list page mount

3. **[Architecture]** `IssueViewSerializer` uses `fields = "__all__"` — trust it includes `is_default`, or explicitly add?
   - Options: Trust **all** | Explicitly add is_default
   - **Answer:** Trust **all**
   - **Rationale:** Verify via API response during Phase 3 manual testing; no serializer change needed unless test fails

4. **[Scope]** Phase 3 validation approach: manual checklist only, or include automated tests?
   - Options: Manual checklist only | Add backend unit test | Full automated + manual
   - **Answer:** Manual checklist only
   - **Rationale:** Keeps Phase 3 lean; developer runs checklist items manually

#### Confirmed Decisions

- Delete guard: verify project view `destroy()` guards `is_default`, fix if missing — confirmed critical
- Auto-nav: list page only, no redirect on direct detail page URL — intentional
- Serializer: trust `__all__`, verify during manual testing
- Validation mode: manual checklist only

#### Action Items

- [ ] Check `IssueViewViewSet.destroy()` in `apps/api/plane/app/views/view/base.py` — add 400 guard for project views if absent
- [ ] During Phase 3, hit GET `/api/v1/workspaces/{slug}/projects/{id}/views/` and confirm `is_default` is in response

#### Impact on Phases

- Phase 1: Add explicit todo to verify/fix `IssueViewViewSet.destroy()` project view guard
- Phase 3: Validation mode confirmed as manual checklist; add `is_default` API response check

### Session 2 — 2026-03-13

**Trigger:** Re-validation before Phase 3 execution
**Questions asked:** 3

#### Questions & Answers

1. **[Risk]** Has the `IssueViewViewSet.destroy()` deletion guard for project default views been verified/fixed yet?
   - Options: Yes, verified & done | Not yet — fix first | Skip — frontend guard sufficient
   - **Answer:** Yes, verified & done
   - **Rationale:** Phase 3 can proceed without a blocking fix; delete guard is confirmed in place

2. **[Architecture]** Before Phase 3 manual validation, does migration 0148 need to be applied first?
   - Options: Apply migration first | Already migrated | Staging only
   - **Answer:** Apply migration first
   - **Rationale:** Run `python manage.py migrate` locally before executing the Phase 3 checklist

3. **[Scope]** Is the `ViewIssueListSerializer` `total_logged_minutes` annotation already confirmed working?
   - Options: Already confirmed from workspace plan | Needs verification here | Out of scope for now
   - **Answer:** Already confirmed from workspace plan
   - **Rationale:** Lightweight check only — verify annotation appears in project view response, not a full re-test

#### Confirmed Decisions

- Delete guard: verified done — Phase 3 unblocked
- Environment: run `python manage.py migrate` before checklist
- `total_log_time`: annotation pre-confirmed; Phase 3 just verifies it surfaces in project view response

#### Action Items

- [ ] Run `python manage.py migrate` before starting Phase 3 checklist
- [ ] Mark Phase 1 delete guard TODO as complete (verified done)

#### Impact on Phases

- Phase 1: Mark destroy() guard todo as ✅ (confirmed done in Session 2)
- Phase 3: Add pre-condition note: run migration before checklist; `total_log_time` check is a lightweight verify-only step

### Session 3 — 2026-03-16

**Trigger:** Re-validation before testing phase; migration conflict investigation
**Questions asked:** 3

#### Questions & Answers

1. **[Risk]** Recent git log shows `fix: migration 149`. Did migration 0148 conflict with another migration, requiring a fix in 0149?
   - Options: 0148 merged cleanly | 0148 had a conflict fixed in 0149 | 0148 was renumbered to 0149
   - **Answer:** User asked to scan code — code inspection performed
   - **Rationale:** Migration 0149 is a standard Django merge migration (`operations = []`) that merges `0144_merge_...` and `0148_seed_default_project_views` branches. Migration 0148 is intact. No conflict — 0149 just resolves divergent history from parallel branches.

2. **[Scope]** Unchecked action items from Sessions 1 & 2 (e.g. "run migrate", "mark destroy() guard done") — are these done?
   - Options: All done — just not ticked | Some still outstanding | Not relevant anymore
   - **Answer:** All done — just not ticked
   - **Rationale:** Sessions 1 & 2 action items are complete; checkboxes were missed. No outstanding blockers.

3. **[Status]** Current deployment/merge status of the feature?
   - Options: Merged to develop/preview | PR open, pending review | Local only — needs PR
   - **Answer:** Local only — user wants to test first
   - **Rationale:** Code complete on feature branch; manual testing phase next before PR creation.

#### Confirmed Decisions

- Migration: 0148 is clean; 0149 is an unrelated merge migration — no impact on this plan
- Action items: All Sessions 1 & 2 items confirmed done
- Status: Testing phase next, then PR to develop

#### Action Items

- [x] Run Phase 3 checklist (manual testing)
- [x] Create PR to develop after testing passes

#### Impact on Phases

- Phase 3: No changes — checklist items are the test plan; proceed to manual testing

---

## Differences from Workspace Plan

| Aspect            | Workspace View         | Project View        |
| ----------------- | ---------------------- | ------------------- |
| Scope             | All workspace issues   | Project issues only |
| `department_name` | ✅ Enabled             | ❌ Disabled (False) |
| `project_name`    | ✅ Enabled             | ❌ Disabled (False) |
| Column count      | 16                     | 14                  |
| Signal target     | Workspace model        | Project model       |
| Auto-nav URL      | `?viewId=` query param | Route `/views/{id}` |
| Migration         | 0146                   | 0148                |
