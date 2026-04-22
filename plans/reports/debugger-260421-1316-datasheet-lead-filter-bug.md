# Datasheet View — TEAM/PROJECT LEAD Filter Bug Report

**Date:** 2026-04-21
**URL:** `http://localhost:3000/yesyes/ho/?view=datasheet`
**Affected column:** TEAM/PROJECT LEAD (`project_lead`)

---

## Root Causes (2 distinct bugs)

### Bug 1 — Filter dropdown shows leads not visible in the table

**Root cause:** `HoFilterOptionsView` builds its `base_qs` **without** `_get_user_scope_q()`.

- `HoIssueListView` applies `_get_user_scope_q(user, workspace_ids)` which for regular members restricts to only issues where `assignees=user`. The data table shows only those issues.
- `HoFilterOptionsView` builds `base_qs = Issue.objects.filter(workspace_id__in=workspace_ids, ...)` — no user scope restriction. It then derives leads from ALL issues in the workspace, including issues the user cannot see.
- Result: the leads filter dropdown contains project leads from projects whose issues never appear in the table.

**Evidence:**

- `ho.py:266` — `HoIssueListView` calls `scope_q = _get_user_scope_q(request.user, workspace_ids)` and applies it.
- `ho.py:489` — `HoFilterOptionsView` sets `base_qs = Issue.objects.filter(**filter_kwargs)` — no user scope Q applied.
- `ho.py:562-576` — leads extracted from that unscoped `base_qs`.

---

### Bug 2 — Clicking a lead filter item doesn't filter the table

**Root cause:** `HoIssueListView` never reads or applies the `leads` query param.

- Frontend `_filterParams()` (store line 166) correctly sends `leads=<uuid1>,<uuid2>`.
- Backend `HoIssueListView.get()` (lines 316–380) handles: `priority`, `state`, `assignees`, `main_task_category`, `sub_task_category`, `cycle`, `module`, `bank_wide`, `progress` — but **no `leads` param handling**.
- The API ignores the leads param entirely and returns the full result set, so the table does not change.

**Evidence:**

- `ho.py:316-380` — all filter params read and applied; `leads` is absent.
- `ho.py:166` in store — `params.leads = this.filters.leads.join(",")` sent correctly.

---

## Affected Files + Line References

| File                             | Lines   | Issue                                                            |
| -------------------------------- | ------- | ---------------------------------------------------------------- |
| `apps/api/plane/app/views/ho.py` | 489     | `HoFilterOptionsView` missing `_get_user_scope_q()` on `base_qs` |
| `apps/api/plane/app/views/ho.py` | 562–576 | leads derived from unscoped issues                               |
| `apps/api/plane/app/views/ho.py` | 316–380 | missing `leads` filter application in `HoIssueListView`          |

---

## Proposed Fix Direction

### Fix Bug 1 — Scope filter options to user-visible issues

In `HoFilterOptionsView.get()`, apply the same user scope restriction used in `HoIssueListView`:

```python
# After line 489 (base_qs = Issue.objects.filter(...))
scope_q = _get_user_scope_q(request.user, workspace_ids)
base_qs = base_qs.filter(scope_q).distinct()
```

This ensures filter dropdown options only contain values from issues the user can actually see.

### Fix Bug 2 — Apply leads filter in HoIssueListView

In `HoIssueListView.get()`, after the existing `assignees` filter block (around line 328), add:

```python
leads = request.query_params.get("leads")
if leads:
    qs = qs.filter(project__project_lead_id__in=leads.split(","))
```

`project_lead_id` is the FK on the `Project` model (same field used in serializer via `project.project_lead`).

---

## Secondary Note — `include_archived` not passed to filter-options

`fetchFilterOptions()` in the store (`ho-issue.store.ts:277–299`) does not pass `include_archived`, so the filter options always include states/leads from archived issues even when `showArchived = false`. Minor inconsistency, low priority.

---

## Unresolved Questions

- None — both root causes are confirmed with direct code evidence.
