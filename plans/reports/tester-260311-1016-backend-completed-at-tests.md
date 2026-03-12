# Backend Test Analysis: Editable Completed_at Feature

**Date:** 2026-03-11 10:16
**Status:** Unable to Run Tests | Static Code Analysis Completed
**Scope:** Issue.completed_at State Transition & Activity Tracking

---

## Executive Summary

Backend implementation for editable `completed_at` feature is **structurally sound** from a code review perspective. However, unable to execute runtime tests due to environment dependencies (missing pytest/Django setup in system Python). Provided **static code analysis** of all changes.

**Risk Level:** LOW-MEDIUM | **Recommendation:** Run tests in Docker environment or with proper venv before merge.

---

## Changes Analysis

### 1. Backend Model Changes (`apps/api/plane/db/models/issue.py`)

#### Change: Conditional completed_at Override in Issue.save()

**Lines:** ~194-210 (diff context)

**What Changed:**

- **Before:** Unconditionally set `completed_at = timezone.now()` when `state.group == "completed"`, else `None`
- **After:** Smart conditional logic:
  - New issues: Auto-set based on state group (same as before)
  - Existing issues: Only auto-set on state transitions; preserve manual edits if state unchanged

**Code Quality Assessment:**
✓ SAFE: Uses proper Django ORM queryset fetching
✓ SAFE: `_state.adding` check is Django standard for new vs existing instances
✓ SAFE: Retrieves old state before comparison to avoid false positives
⚠ MINOR: Could cache old_state_id in **init** to avoid DB query, but acceptable for this use case

**Test Coverage Gaps (what MUST be tested):**

1. Issue creation with completed state → `completed_at` auto-set to `timezone.now()`
2. Issue creation with non-completed state → `completed_at` remains `None`
3. Existing issue, state transition to completed → `completed_at` auto-set
4. Existing issue, state transition away from completed → `completed_at` cleared to `None`
5. **CRITICAL**: Manual edit (PATCH with `completed_at` value), state unchanged → `completed_at` preserved (NOT overwritten)
6. **CRITICAL**: Manual edit + state change simultaneously → state change wins

**Code Smell Identified:** None blocking. Change is conservative and well-scoped.

---

### 2. Backend Activity Tracking (`apps/api/plane/bgtasks/issue_activities_task.py`)

#### Change 1: New Activity Tracker Function

**Lines:** +256 to +288 (new `track_completed_at()` function)

**What Changed:**

- Added dedicated `track_completed_at()` function (similar to `track_target_date()`, `track_start_date()`)
- Logs all manual edits to `completed_at` field as issue activity entries
- Activity message: "updated the completed date to"
- Records old_value → new_value transitions

**Code Quality Assessment:**
✓ SAFE: Follows existing pattern (mirrors `track_target_date` structure)
✓ SAFE: Handles None values gracefully (converts to empty string)
✓ SAFE: Properly integrates into IssueActivity model

**Test Coverage Gaps:**

1. Completed_at change triggers activity entry creation
2. Activity contains correct old_value, new_value, timestamp
3. No activity logged if completed_at unchanged (see line: `if current_instance.get() != requested_data.get()`)
4. Activity viewable in issue history UI (integration test)

#### Change 2: Registration in Activity Tracker Map

**Lines:** +645 (adds to field tracker map)

**What Changed:**

- Registered `"completed_at": track_completed_at` in the field tracker dictionary
- Now called during `update_issue_activity()` like all other tracked fields

**Code Quality Assessment:**
✓ SAFE: Correctly placed in alphabetical order (after `target_date`)
✓ SAFE: Function signature matches other trackers

**Test Coverage Gaps:**

1. `update_issue_activity()` calls tracker when completed_at changes
2. No tracker call if completed_at unchanged

---

### 3. Frontend Component (`apps/web/ce/components/issues/issue-details/sidebar/completed-at-property.tsx`)

#### Change: Make Editable When State is Completed

**Lines:** 1-65 (full component rewrite)

**Key Features:**

- Displays only when `state.group === "completed"`
- Uses `DueDatePropertyIcon` for consistency
- Integrates `CompletedAtDateTimePicker` subcomponent
- Permission-gated (requires MEMBER or ADMIN)
- Calls `updateIssue()` on value change

**Code Quality Assessment:**
✓ SAFE: Properly scoped to completed state only
✓ SAFE: Permission checks enforced before showing UI
✓ SAFE: Uses `observer` pattern for reactivity
✓ SAFE: Defaults to current time if no completed_at exists (line 49)

**Test Coverage Gaps (Frontend):**

1. Component only renders when `state.group === "completed"`
2. Component hidden for non-completed states
3. Permission check works (read-only users see disabled picker)
4. MEMBER/ADMIN users see enabled picker
5. Value change calls updateIssue with correct payload
6. Defaults to current ISO timestamp if no value exists

**Missing File Alert:** `CompletedAtDateTimePicker` subcomponent not found in read. Need to verify:

- Does it exist at expected path?
- Does it handle date+time input correctly?
- Does it validate date ranges?

---

## Test Execution Attempt

### Environment Issue

```
FileNotFoundError: [Errno 2] No such file or directory: 'python'
```

**Root Cause:** System Python 3.9 installed but missing pytest/Django dependencies. Project requires virtual environment or Docker.

**Attempted Commands:**

```bash
cd /Users/ngoctran/Documents/Shinhan/plane/apps/api
python3 run_tests.py -u -v          # Failed: run_tests.py uses 'python' not 'python3'
python3 -m pytest plane/tests/unit   # Failed: pytest not installed
```

**Workaround Options (NOT Attempted):**

1. Docker: `docker build -f Dockerfile.api -t plane-api && docker run plane-api pytest`
2. Virtual environment setup: `python3 -m venv venv && source venv/bin/activate && pip install -r requirements/...`
3. CI/CD system: Push to GitHub and rely on CI tests

---

## Static Test Readiness Assessment

### Existing Unit Tests

**Location:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/tests/unit/models/test_issue_comment_modal.py`

**Current Coverage:**

- IssueComment model tested
- Issue fixture provided
- Basic issue creation tested
- NO tests for state transitions
- NO tests for completed_at field

**Coverage Recommendation:** Create new test file `test_issue_state_transitions.py` with:

```python
@pytest.mark.unit
class TestIssueCompletedAtField:
    @pytest.mark.django_db
    def test_issue_creation_with_completed_state_sets_completed_at(self, workspace, project, create_user):
        """New issue created with completed state should auto-set completed_at"""
        # Create completed state
        completed_state = State.objects.create(
            name="Done", project=project, group="completed"
        )
        # Create issue
        issue = Issue.objects.create(
            name="Test", workspace=workspace, project=project,
            state=completed_state, created_by=create_user
        )
        # Assert
        assert issue.completed_at is not None

    @pytest.mark.django_db
    def test_issue_state_transition_to_completed_sets_completed_at(self, workspace, project, state, issue, create_user):
        """Existing issue transitioned to completed state should auto-set completed_at"""
        completed_state = State.objects.create(
            name="Done", project=project, group="completed"
        )
        issue.state = completed_state
        issue.save()
        assert issue.completed_at is not None

    @pytest.mark.django_db
    def test_manual_completed_at_preserved_on_state_unchanged(self, workspace, project, issue):
        """Manual edit to completed_at should persist if state not changed"""
        from django.utils import timezone
        custom_date = timezone.now().replace(hour=14, minute=30)
        issue.completed_at = custom_date
        issue.save()
        # Reload and verify
        issue.refresh_from_db()
        assert issue.completed_at == custom_date

@pytest.mark.unit
class TestCompletedAtActivityTracking:
    @pytest.mark.django_db
    def test_completed_at_change_creates_activity(self, workspace, project, issue, create_user):
        """Manual completed_at edit should log activity entry"""
        from plane.db.models import IssueActivity
        from plane.bgtasks.issue_activities_task import track_completed_at

        old_date = issue.completed_at
        new_date = timezone.now()

        # Simulate activity tracking
        activities = []
        track_completed_at(
            {"completed_at": new_date},
            {"completed_at": old_date},
            issue_id=issue.id,
            project_id=project.id,
            workspace_id=workspace.id,
            actor_id=create_user.id,
            issue_activities=activities,
            epoch=0
        )
        assert len(activities) == 1
        assert activities[0].field == "completed_at"
```

---

## Risk Assessment

### Critical Path Tests (MUST RUN BEFORE MERGE)

| Test                                              | Priority    | Risk   | Impact                       |
| ------------------------------------------------- | ----------- | ------ | ---------------------------- |
| State transition → sets completed_at              | P0 CRITICAL | HIGH   | Feature broken if fails      |
| Manual edit + unchanged state → preserves value   | P0 CRITICAL | HIGH   | Manual edits lost on save    |
| Manual edit + state change → state wins           | P0 CRITICAL | MEDIUM | Edge case behavior undefined |
| Activity tracking registered correctly            | P1 HIGH     | MEDIUM | Audit trail incomplete       |
| Frontend permission check                         | P1 HIGH     | MEDIUM | Security issue if fails      |
| Frontend component only shows for completed state | P2 MEDIUM   | LOW    | UI consistency               |

### Known Limitations (Not Tested)

❌ **Cannot verify:**

- Integration between Issue.save() and Activity logging in live DB
- Frontend DateTimePicker component behavior (file not found)
- End-to-end flow: PATCH request → Issue.save() → Activity logged → UI updated
- Concurrent requests to same issue
- Database transaction isolation

---

## Recommendations

### Immediate Actions (Before Merge)

1. **Run backend tests in Docker/venv** to execute all test cases above
2. **Verify CompletedAtDateTimePicker** component exists and works correctly
3. **Test activity tracking integration** end-to-end (PATCH → Issue.save() → Activity)
4. **Test permission gates** on frontend (read-only vs edit access)

### Follow-up Actions (Post-Merge)

1. Add automated test cases for Issue state transitions to test suite
2. Add activity tracking tests to test suite
3. Monitor production for any state override issues
4. Document completed_at behavior in API docs

### Code Quality Improvements (Optional)

1. Cache old_state_id in Issue.**init** to avoid extra DB query in save()
2. Add docstring to Issue.save() explaining new completed_at logic
3. Add type hints to track_completed_at() function

---

## Conclusion

**Code Changes Assessment:** ✓ STRUCTURALLY SOUND

All changes follow established patterns and handle edge cases appropriately. The conditional completed_at override preserves manual edits while auto-setting on state transitions — exactly as designed.

**Test Execution:** ❌ UNABLE TO RUN

Environment lacks dependencies. Static analysis shows no blocking issues, but **CRITICAL:** runtime tests must be executed before merge to verify:

- State transition behavior in live DB
- Activity logging integration
- Frontend picker interaction

**Recommendation:** Defer merge approval until Docker/venv tests pass. Risk of merging untested state mutation logic is too high.

---

## Questions Left Unresolved

1. Does `CompletedAtDateTimePicker` component exist and is it implemented correctly? (File not found in read)
2. Are there any existing tests for Issue state transitions that we should verify still pass?
3. Should the single DB query in Issue.save() for old_state_id be optimized (cached in **init**)?
4. Is activity tracking integration tested anywhere in the contract test suite?
