# Phase 01: Backend - Conditional completed_at Override

## Context

- Plan: [plan.md](./plan.md)
- Model: `apps/api/plane/db/models/issue.py` (line ~194-202)
- Serializer: `apps/api/plane/app/serializers/issue.py` (`IssueCreateSerializer`)
- View: `apps/api/plane/app/views/issue/base.py` (`IssueViewSet.partial_update`)

## Overview

`Issue.save()` always overrides `completed_at` regardless of whether user explicitly set it. Need to make `save()` only auto-set `completed_at` on state transitions, not on every save of a completed issue.

## Key Insights

1. `Issue.save()` runs on EVERY save, including non-state-change updates (e.g., changing name, priority)
2. When user PATCHes `completed_at` directly, `save()` will overwrite it with `timezone.now()`
3. The serializer already accepts `completed_at` -- no serializer changes needed
4. `IssueVersion` also copies `completed_at` from the issue, so version history will naturally reflect edits

## Requirements

- Auto-set `completed_at = now()` ONLY when state transitions TO completed group
- Auto-clear `completed_at = None` ONLY when state transitions FROM completed group
- Preserve user-provided `completed_at` when: (a) state doesn't change, or (b) user explicitly passes `completed_at` in request
- No regression: new issues entering completed state still get auto-timestamped

## Architecture

Modify `Issue.save()` to track state changes using Django's `_state` or by comparing old vs new state. Two approaches:

**Option A (recommended): Check if `completed_at` was explicitly provided**

- In the view's `partial_update`, if `completed_at` is in `request.data`, skip auto-set in model
- Add a transient flag on the instance: `self._skip_completed_at_auto = True`

**Option B: Track state transition in save()**

- Compare `self.state_id` with the DB value before saving
- Only auto-set/clear when state actually changed

Option B is cleaner -- no view changes needed.

## Related Code Files

| File                                      | Purpose                                     |
| ----------------------------------------- | ------------------------------------------- |
| `apps/api/plane/db/models/issue.py`       | Issue model `save()` method                 |
| `apps/api/plane/app/views/issue/base.py`  | `IssueViewSet.partial_update`               |
| `apps/api/plane/app/serializers/issue.py` | `IssueCreateSerializer` (no changes needed) |

## Implementation Steps

### Step 1: Modify Issue.save() to detect state changes

In `apps/api/plane/db/models/issue.py`, around line 193-202:

**Current code:**

```python
if self.state.group == "completed":
    self.completed_at = timezone.now()
else:
    self.completed_at = None
```

**New logic:**

```python
if not self._state.adding:
    # Only auto-set completed_at on state transitions
    try:
        old_state_id = Issue.objects.filter(pk=self.pk).values_list('state_id', flat=True).first()
        state_changed = old_state_id != self.state_id
    except Exception:
        state_changed = True

    if state_changed:
        if self.state.group == "completed":
            self.completed_at = timezone.now()
        else:
            self.completed_at = None
else:
    # New issue: auto-set as before
    if self.state.group == "completed":
        self.completed_at = timezone.now()
    else:
        self.completed_at = None
```

This adds a DB query per save but only for existing issues. The query is fast (PK lookup).

### Step 2: Add validation in serializer (optional guard)

In `IssueCreateSerializer.validate()`, add optional validation:

- If `completed_at` is provided but state.group != 'completed', reject or ignore
- Keeps data consistent even with direct API calls

### Step 3: Test scenarios

- Create issue in completed state -> completed_at auto-set
- Transition to completed -> completed_at auto-set
- PATCH completed_at on completed issue -> value preserved (not overwritten)
- Transition from completed -> completed_at cleared
- PATCH non-state fields on completed issue -> completed_at unchanged

<!-- Updated: Validation Session 1 - Add activity logging for completed_at -->

## Activity Logging

Add `completed_at` to the tracked fields in `issue_activities_task` so that manual edits appear in the issue activity feed.

### Where to add

- File: `apps/api/plane/bgtasks/issue_activites_task.py` (or similar activity task file)
- Pattern: Follow how other field changes (e.g., `due_date`, `priority`) are tracked
- Entry format: `"ISSUE_ACTIVITY.updated.completed_at"` with old/new values

### Activity entry

When `completed_at` changes and the change was NOT triggered by a state transition (i.e., user explicitly set it), log:

- `field`: `"completed_at"`
- `old_value`: previous datetime string (or null)
- `new_value`: new datetime string (or null)
- `verb`: `"updated"`

> Note: To distinguish manual edits from state-transition auto-sets, the activity task compares old vs new values — this works regardless of cause. Only log when the value actually differs.

## Todo

- [x] Modify `Issue.save()` to detect state transitions before auto-setting `completed_at`
- [x] Add `completed_at` activity tracking in `issue_activities_task`
- [x] Add optional serializer validation for `completed_at` vs state group
- [x] Test state transition scenarios
- [x] Test manual `completed_at` edit via API → verify activity entry created
- [x] Verify `IssueVersion` still syncs correctly

## Success Criteria

- PATCH `{"completed_at": "2026-01-15T10:00:00Z"}` on completed issue persists the value
- State transition to completed still auto-sets `completed_at`
- State transition from completed still clears `completed_at`
- Non-state updates on completed issues don't reset `completed_at`

## Risk Assessment

| Risk                                               | Impact                 | Mitigation                                         |
| -------------------------------------------------- | ---------------------- | -------------------------------------------------- |
| Extra DB query on every Issue.save()               | Low -- PK index lookup | Query is O(1), negligible overhead                 |
| Race condition: state + completed_at in same PATCH | Low                    | State change takes precedence (auto-set overrides) |
| Existing tests break                               | Medium                 | Run `python run_tests.py` to verify                |
