---
title: "Default Project View"
description: "Auto-seed a daily-status spreadsheet view with 14 columns for every project"
status: done
priority: P1
effort: 18h
branch: ngoc-feat/workspaces
tags: [project, views, spreadsheet, default-view]
created: 2026-03-13
---

# Default Project View

## Goal

Every project gets an auto-seeded, non-deletable spreadsheet view ("Daily Status") with 14 ordered columns. Mirrors the workspace default view, but scoped to projects — columns `department_name` and `project_name` are omitted because all issues already belong to a single project.

## Phases

| #   | Phase                                                              | Effort | Status  | File                                                      |
| --- | ------------------------------------------------------------------ | ------ | ------- | --------------------------------------------------------- |
| 1   | Backend: Default view seed + `is_default` flag on ProjectView      | 4h     | ✅ Done | [phase-01](phase-01-backend-default-view-seed.md)         |
| 2   | Backend: Extended spreadsheet data (completed_at, links, worklogs) | 2h     | ✅ Done | [phase-02](phase-02-backend-extended-spreadsheet-data.md) |
| 3   | Frontend: 5 new spreadsheet columns in CE                          | 4h     | ✅ Done | [phase-03](phase-03-frontend-spreadsheet-columns.md)      |
| 4   | Frontend: Default view UI (lock icon, auto-select, column order)   | 4h     | ✅ Done | [phase-04](phase-04-frontend-default-view-ui.md)          |
| 5   | Integration & validation                                           | 2h     | ✅ Done | [phase-05](phase-05-integration-validation.md)            |

## Key Architecture Decisions

1. **`is_default` on IssueView (project scope)** — same `IssueView` model as workspace but with `project != null`; `destroy()` checks it before deletion
2. **Data migration + post_save signal** — migration seeds existing projects; signal handles future ones
3. **CE-only columns** — 5 new column components reuse existing workspace ones where possible:
   - `bank-wide-project-column.tsx` ✅ reuse
   - `progress-tracking-column.tsx` ✅ reuse
   - `completed-date-column.tsx` ✅ reuse
   - `reference-link-column.tsx` ✅ reuse
   - `total-log-time-column.tsx` ✅ reuse
   - `department-name-column.tsx` ❌ omit
   - `project-name-column.tsx` ❌ omit
4. **`display_properties` JSON** — 14 column toggles; inherits existing 7 CE keys, only enables 5 of them
5. **Signal placement** — dedicated `apps/api/plane/db/signals/project.py` file, imported in `AppConfig.ready()`
6. **owned_by** — `project.created_by` (project creator), always exists, no fallback query needed

## Column Spec (14 columns, fixed order)

| #   | Column Key          | Source                      | Notes     |
| --- | ------------------- | --------------------------- | --------- |
| 1   | `assignee`          | `issue.assignees`           | core      |
| 2   | `modules`           | project modules             | core      |
| 3   | `bank_wide_project` | `project.is_bank_wide`      | CE, reuse |
| 4   | `key`               | `issue.sequence_id`         | core      |
| 5   | `sub_issue_count`   | annotation                  | core      |
| 6   | `priority`          | `issue.priority`            | core      |
| 7   | `cycle`             | project cycles              | core      |
| 8   | `state`             | `issue.state`               | core      |
| 9   | `progress_tracking` | computed from `target_date` | CE, reuse |
| 10  | `start_date`        | `issue.start_date`          | core      |
| 11  | `due_date`          | `issue.target_date`         | core      |
| 12  | `completed_date`    | `issue.completed_at`        | CE, reuse |
| 13  | `reference_link`    | lazy-loaded links           | CE, reuse |
| 14  | `total_log_time`    | worklog annotation          | CE, reuse |

## Dependencies

- `is_bank_wide` field already exists on Project model (migration 0143)
- `completed_at` already serialized in `IssueSerializer`
- `WorklogStore.getTotalMinutesForIssue` exists in core store
- `SPREADSHEET_COLUMNS` in CE `utils.tsx` is the extension point
- CE columns from workspace plan already built (reuse 5 of 7)

## Risks

- **Column reuse**: verify existing CE columns work in project view context (same props/stores)
- **IssueView scope**: `project=` FK must be set when creating project default views (vs `workspace=` + `project=None` for workspace views)
- **Migration on large DB**: batch for projects with many rows

## Differences from Workspace Default View

| Aspect              | Workspace View            | Project View                      |
| ------------------- | ------------------------- | --------------------------------- |
| IssueView scope     | `project=None`            | `project=<id>`                    |
| Signal trigger      | `post_save` Workspace     | `post_save` Project               |
| Signal file         | `db/signals/workspace.py` | `db/signals/project.py`           |
| ViewSet             | `WorkspaceViewViewSet`    | `ProjectViewViewSet`              |
| View type           | `IWorkspaceView`          | `IProjectView`                    |
| Store               | `GlobalViewStore`         | project view store                |
| UI page             | `/workspace-views/`       | `/:slug/projects/:id/views/`      |
| Number of columns   | 16                        | 14                                |
| Excluded CE columns | —                         | `department_name`, `project_name` |
| `owned_by`          | `workspace.owner`         | `project.created_by`              |
