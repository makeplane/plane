# Researcher 02 — Issue Fields & Custom Column Requirements

## Issue Type Fields (`packages/types/src/issues/issue.ts`)

| Field              | Type             | Notes                              |
| ------------------ | ---------------- | ---------------------------------- |
| `sub_issues_count` | `number`         | Count of child issues              |
| `start_date`       | `string \| null` | ISO date                           |
| `target_date`      | `string \| null` | ISO date (due date)                |
| `completed_at`     | `string \| null` | Auto-set by state group transition |
| `link_count`       | `number`         | Count of links                     |
| `attachment_count` | `number`         | Count of attachments               |
| `label_ids`        | `string[]`       | Label references                   |

## Reference Links

- Type: `TIssueLink[]` in `packages/types/src/issues/issue_link.ts`
- Fields: `id`, `title`, `url`, `metadata`, `created_at`, `created_by_id`, `issue_id`
- Backend: `IssueLink` model in `apps/api/plane/db/models/issue.py`
- Loaded separately via issue detail endpoint (not in TBaseIssue list)

## Worklog (Total Log Time)

- `WorklogStore.getTotalMinutesForIssue(issueId)` → sum of `duration_minutes`
- Location: `apps/web/core/store/worklog.store.ts:96-100`
- Must call `fetchWorklogs(issueId)` first; returns 0 if not loaded

## Spreadsheet Existing Columns (reusable)

| Column                 | Status                               |
| ---------------------- | ------------------------------------ |
| Assignee               | Exists                               |
| Priority               | Exists                               |
| Status (state)         | Exists                               |
| Start Date             | Exists                               |
| Due Date (target_date) | Exists                               |
| Module                 | Exists                               |
| Cycle                  | Exists                               |
| Sub-issues count       | Exists (`SpreadsheetSubIssueColumn`) |

## New Columns Required

| Column            | Source                                 | Implementation                       |
| ----------------- | -------------------------------------- | ------------------------------------ |
| Department name   | workspace.name                         | Derived from URL/workspace store     |
| Team/Project name | project.name                           | From project store by project_id     |
| Bank-wide Project | project.is_bank_wide                   | New `BooleanField` on Project model  |
| Progress Tracking | Computed from target_date              | Frontend-only computed logic         |
| Reference link    | `issue.issue_link` (lazy load)         | New column, links list               |
| Total Log time    | `WorklogStore.getTotalMinutesForIssue` | New column, lazy load worklogs       |
| Completed Date    | `issue.completed_at`                   | New column (field exists, no column) |

## Bank-wide Project Decision

- **Recommended**: Add `is_bank_wide_project: BooleanField(default=False)` to Project model
- Displayed in spreadsheet as "Y" / "N" per project
- Needs Django migration + serializer update + type extension

## Progress Tracking Logic (Frontend Computed)

```ts
function getProgressTracking(targetDate: string | null): { label: string; color: "red" | "green" } {
  if (!targetDate) return { label: "—", color: "green" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(targetDate);
  due.setHours(0, 0, 0, 0);
  const diff = differenceInCalendarDays(due, today);
  if (diff < 0) return { label: "Off Track", color: "red" };
  if (diff === 0) return { label: "Due Today", color: "red" };
  if (diff === 1) return { label: "At Risk", color: "red" };
  return { label: "On Track", color: "green" };
}
```

## Unresolved

- How reference links are fetched in bulk for spreadsheet (may need batch endpoint)
- How worklogs are fetched in bulk (currently per-issue; may be slow in spreadsheet)
- Whether `display_properties` for new columns uses boolean toggles or ordered list
