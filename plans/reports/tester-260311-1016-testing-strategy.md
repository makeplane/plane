# Testing Strategy: Editable Completed_at Implementation

**Date:** 2026-03-11 10:16
**Scope:** Test Plan for Issue.completed_at State Transition & Manual Edit Feature
**Related Plan:** `/plans/260311-0949-editable-completed-date/`

---

## Overview

This document outlines the comprehensive test strategy for the completed_at editable feature across backend (Issue model, activity tracking) and frontend (sidebar/peek-overview UI components).

**Feature Behavior Summary:**

- New issues with completed state → auto-set completed_at to current time
- Existing issues transitioned to completed → auto-set completed_at to current time
- Existing issues transitioned away from completed → clear completed_at to None
- Manual edits to completed_at → preserved if state unchanged (allows manual override)
- Manual edits + state change simultaneously → state change takes precedence

---

## Backend Testing Strategy

### Unit Tests: Issue Model State Transitions

**File:** `/apps/api/plane/tests/unit/models/test_issue_state_transitions.py` (NEW)

#### Test Suite 1: Issue Creation with State Groups

```python
@pytest.mark.unit
class TestIssueCreationCompletedAt:
    """Test auto-set behavior for new issues"""

    @pytest.mark.django_db
    def test_new_issue_with_completed_state_auto_sets_completed_at(self, workspace, project, create_user):
        """New issue created with completed state should auto-set completed_at"""
        completed_state = State.objects.create(
            name="Done", project=project, group="completed", default=False
        )
        issue = Issue.objects.create(
            name="Test Issue", workspace=workspace, project=project,
            state=completed_state, created_by=create_user
        )
        assert issue.completed_at is not None
        # Verify it's set to a recent time (within last minute)
        assert (timezone.now() - issue.completed_at).total_seconds() < 60

    @pytest.mark.django_db
    def test_new_issue_with_backlog_state_does_not_set_completed_at(self, workspace, project, state, create_user):
        """New issue with non-completed state should NOT set completed_at"""
        issue = Issue.objects.create(
            name="Test Issue", workspace=workspace, project=project,
            state=state, created_by=create_user
        )
        assert issue.completed_at is None

    @pytest.mark.django_db
    def test_new_issue_with_started_state_does_not_set_completed_at(self, workspace, project, create_user):
        """New issue with started state should NOT set completed_at"""
        started_state = State.objects.create(
            name="In Progress", project=project, group="started", default=False
        )
        issue = Issue.objects.create(
            name="Test Issue", workspace=workspace, project=project,
            state=started_state, created_by=create_user
        )
        assert issue.completed_at is None
```

**Expected Results:**

- ✓ All 3 tests PASS
- Risk: If tests fail, state group detection broken

---

#### Test Suite 2: Issue State Transitions

```python
@pytest.mark.unit
class TestIssueStateTransitions:
    """Test auto-set behavior on state changes"""

    @pytest.mark.django_db
    def test_state_transition_to_completed_auto_sets_completed_at(self, workspace, project, state, issue, create_user):
        """Existing issue transitioned to completed should auto-set completed_at"""
        completed_state = State.objects.create(
            name="Done", project=project, group="completed", default=False
        )

        # Initial state: issue has no completed_at
        assert issue.completed_at is None

        # Transition to completed
        issue.state = completed_state
        before_save = timezone.now()
        issue.save()
        after_save = timezone.now()

        # Assert auto-set
        assert issue.completed_at is not None
        assert before_save <= issue.completed_at <= after_save

    @pytest.mark.django_db
    def test_state_transition_away_from_completed_clears_completed_at(self, workspace, project, create_user):
        """Existing issue transitioned away from completed should clear completed_at"""
        backlog_state = State.objects.create(
            name="Backlog", project=project, group="backlog", default=False
        )
        completed_state = State.objects.create(
            name="Done", project=project, group="completed", default=False
        )

        # Create issue in completed state
        issue = Issue.objects.create(
            name="Test", workspace=workspace, project=project,
            state=completed_state, created_by=create_user
        )
        assert issue.completed_at is not None

        # Transition back to backlog
        issue.state = backlog_state
        issue.save()

        # Assert cleared
        assert issue.completed_at is None

    @pytest.mark.django_db
    def test_state_remains_same_preserves_completed_at(self, workspace, project, issue, create_user):
        """Saving issue without state change should NOT modify completed_at"""
        # Create issue in completed state
        completed_state = State.objects.create(
            name="Done", project=project, group="completed", default=False
        )
        issue.state = completed_state
        issue.save()
        original_completed_at = issue.completed_at

        # Re-save without changing state (e.g., editing description)
        issue.name = "Updated Name"
        issue.save()

        # Assert completed_at unchanged
        assert issue.completed_at == original_completed_at
```

**Expected Results:**

- ✓ All 3 tests PASS
- Risk: If fails, state comparison logic broken

---

#### Test Suite 3: Manual completed_at Edits (CRITICAL)

```python
@pytest.mark.unit
class TestManualCompletedAtEdits:
    """Test manual edit preservation with state logic"""

    @pytest.mark.django_db
    def test_manual_completed_at_preserved_when_state_unchanged(self, workspace, project, create_user):
        """Manual edit to completed_at preserved if state not changed"""
        completed_state = State.objects.create(
            name="Done", project=project, group="completed", default=False
        )
        issue = Issue.objects.create(
            name="Test", workspace=workspace, project=project,
            state=completed_state, created_by=create_user
        )

        # Auto-set happens here
        auto_set_time = issue.completed_at
        assert auto_set_time is not None

        # Wait a bit, then manually edit to different time
        custom_time = auto_set_time.replace(day=1)  # Set to 1st of month
        issue.completed_at = custom_time
        issue.save()

        # Reload and verify manual edit preserved
        issue.refresh_from_db()
        assert issue.completed_at == custom_time
        assert issue.completed_at != auto_set_time

    @pytest.mark.django_db
    def test_manual_completed_at_cleared_on_state_transition_away(self, workspace, project, create_user):
        """Manual edit to completed_at should be cleared when transitioned away"""
        backlog_state = State.objects.create(
            name="Backlog", project=project, group="backlog", default=False
        )
        completed_state = State.objects.create(
            name="Done", project=project, group="completed", default=False
        )

        # Create completed issue with manual time
        issue = Issue.objects.create(
            name="Test", workspace=workspace, project=project,
            state=completed_state, created_by=create_user
        )
        custom_time = timezone.now().replace(year=2024)
        issue.completed_at = custom_time
        issue.save()

        # Transition away
        issue.state = backlog_state
        issue.save()

        # Manual edit should be cleared
        assert issue.completed_at is None

    @pytest.mark.django_db
    def test_state_transition_overrides_simultaneous_completed_at_edit(self, workspace, project, create_user):
        """State change takes precedence when both state and completed_at change simultaneously"""
        completed_state = State.objects.create(
            name="Done", project=project, group="completed", default=False
        )
        backlog_state = State.objects.create(
            name="Backlog", project=project, group="backlog", default=False
        )

        # Create issue
        issue = Issue.objects.create(
            name="Test", workspace=workspace, project=project,
            state=backlog_state, created_by=create_user
        )
        assert issue.completed_at is None

        # Simultaneously: transition to completed AND set custom completed_at
        old_custom_time = timezone.now().replace(year=2024)
        issue.state = completed_state
        issue.completed_at = old_custom_time
        before_save = timezone.now()
        issue.save()
        after_save = timezone.now()

        # State transition should win: completed_at set to now, not the custom time
        assert issue.completed_at is not None
        assert before_save <= issue.completed_at <= after_save
        assert issue.completed_at != old_custom_time
```

**Expected Results:**

- ✓ All 3 tests PASS (CRITICAL for feature correctness)
- Risk: If any fails, manual edits lost or behavior unpredictable

---

### Unit Tests: Activity Tracking

**File:** `/apps/api/plane/tests/unit/bgtasks/test_issue_activities_task.py` (NEW or extend existing)

```python
@pytest.mark.unit
class TestCompletedAtActivityTracking:
    """Test activity logging for completed_at changes"""

    def test_track_completed_at_creates_activity_entry(self):
        """track_completed_at should create IssueActivity entry on change"""
        from plane.bgtasks.issue_activities_task import track_completed_at
        from datetime import datetime

        old_completed_at = datetime(2026, 3, 1, 10, 0, 0)
        new_completed_at = datetime(2026, 3, 11, 14, 30, 0)

        activities = []
        track_completed_at(
            requested_data={"completed_at": new_completed_at},
            current_instance={"completed_at": old_completed_at},
            issue_id="issue-123",
            project_id="proj-456",
            workspace_id="ws-789",
            actor_id="user-999",
            issue_activities=activities,
            epoch=0
        )

        assert len(activities) == 1
        activity = activities[0]
        assert activity.field == "completed_at"
        assert activity.old_value == str(old_completed_at)
        assert activity.new_value == str(new_completed_at)
        assert activity.comment == "updated the completed date to"

    def test_track_completed_at_no_activity_when_unchanged(self):
        """track_completed_at should NOT create activity if value unchanged"""
        from plane.bgtasks.issue_activities_task import track_completed_at

        same_time = "2026-03-11T10:00:00Z"

        activities = []
        track_completed_at(
            requested_data={"completed_at": same_time},
            current_instance={"completed_at": same_time},
            issue_id="issue-123",
            project_id="proj-456",
            workspace_id="ws-789",
            actor_id="user-999",
            issue_activities=activities,
            epoch=0
        )

        assert len(activities) == 0

    def test_track_completed_at_handles_none_values(self):
        """track_completed_at should handle None -> value and value -> None transitions"""
        from plane.bgtasks.issue_activities_task import track_completed_at

        new_time = "2026-03-11T14:30:00Z"

        # None -> value
        activities = []
        track_completed_at(
            requested_data={"completed_at": new_time},
            current_instance={"completed_at": None},
            issue_id="issue-123",
            project_id="proj-456",
            workspace_id="ws-789",
            actor_id="user-999",
            issue_activities=activities,
            epoch=0
        )
        assert len(activities) == 1
        assert activities[0].old_value == ""
        assert activities[0].new_value == new_time

        # value -> None
        activities = []
        track_completed_at(
            requested_data={"completed_at": None},
            current_instance={"completed_at": new_time},
            issue_id="issue-123",
            project_id="proj-456",
            workspace_id="ws-789",
            actor_id="user-999",
            issue_activities=activities,
            epoch=0
        )
        assert len(activities) == 1
        assert activities[0].old_value == new_time
        assert activities[0].new_value == ""
```

**Expected Results:**

- ✓ All 3 tests PASS
- Risk: If fails, audit trail incomplete

---

### Integration Tests: State Transition → Activity

**File:** `/apps/api/plane/tests/contract/app/test_issue_completed_at.py` (NEW)

```python
@pytest.mark.contract
class TestIssueCompletedAtAPI:
    """Test completed_at behavior through API"""

    @pytest.mark.django_db
    def test_patch_issue_state_to_completed_sets_completed_at(self, session_client, workspace, project, state, create_user):
        """PATCH /issues/ with state transition should auto-set completed_at"""
        from rest_framework import status
        from django.urls import reverse

        completed_state = State.objects.create(
            name="Done", project=project, group="completed", default=False
        )

        issue = Issue.objects.create(
            name="Test", workspace=workspace, project=project,
            state=state, created_by=create_user
        )

        url = reverse("api:workspaces.projects.issues", args=[workspace.slug, project.id])
        response = session_client.patch(
            f"{url}{issue.id}/",
            {"state_id": completed_state.id},
            format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.completed_at is not None
        assert issue.state_id == completed_state.id

    @pytest.mark.django_db
    def test_patch_issue_completed_at_manually_preserves_when_state_unchanged(self, session_client, workspace, project, create_user):
        """PATCH /issues/ with only completed_at change should preserve value"""
        from rest_framework import status
        from django.urls import reverse

        completed_state = State.objects.create(
            name="Done", project=project, group="completed", default=False
        )

        # Create completed issue
        issue = Issue.objects.create(
            name="Test", workspace=workspace, project=project,
            state=completed_state, created_by=create_user
        )

        custom_time = "2026-03-01T10:00:00Z"
        url = reverse("api:workspaces.projects.issues", args=[workspace.slug, project.id])
        response = session_client.patch(
            f"{url}{issue.id}/",
            {"completed_at": custom_time},
            format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert str(issue.completed_at) == custom_time

    @pytest.mark.django_db
    def test_patch_issue_state_away_from_completed_clears_completed_at(self, session_client, workspace, project, create_user):
        """PATCH /issues/ transition away from completed should clear completed_at"""
        from rest_framework import status
        from django.urls import reverse

        completed_state = State.objects.create(
            name="Done", project=project, group="completed", default=False
        )
        backlog_state = State.objects.create(
            name="Backlog", project=project, group="backlog", default=False
        )

        issue = Issue.objects.create(
            name="Test", workspace=workspace, project=project,
            state=completed_state, created_by=create_user
        )

        url = reverse("api:workspaces.projects.issues", args=[workspace.slug, project.id])
        response = session_client.patch(
            f"{url}{issue.id}/",
            {"state_id": backlog_state.id},
            format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.completed_at is None
        assert issue.state_id == backlog_state.id
```

**Expected Results:**

- ✓ All 3 tests PASS
- Risk: If fails, API endpoint doesn't trigger Issue.save() correctly

---

## Frontend Testing Strategy

### Component Unit Tests: CompletedAtProperty

**File:** `/apps/web/ce/components/issues/issue-details/sidebar/__tests__/completed-at-property.test.tsx` (NEW)

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompletedAtProperty } from "../completed-at-property";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";

// Mock dependencies
jest.mock("@/hooks/store/use-issue-detail");
jest.mock("@/hooks/store/use-project-state");
jest.mock("@/hooks/store/user");

describe("CompletedAtProperty", () => {
  it("should render when state.group is 'completed'", () => {
    // Setup: mock issue with completed state
    const mockIssue = {
      id: "issue-123",
      state_id: "state-456",
      completed_at: "2026-03-11T14:30:00Z",
    };

    (useIssueDetail as jest.Mock).mockReturnValue({
      issue: { getIssueById: () => mockIssue },
      updateIssue: jest.fn(),
    });

    (useProjectState as jest.Mock).mockReturnValue({
      getStateById: () => ({ id: "state-456", name: "Done", group: "completed" }),
    });

    (useUserPermissions as jest.Mock).mockReturnValue({
      allowPermissions: () => true,
    });

    render(<CompletedAtProperty issueId="issue-123" />);

    // Assert component rendered
    expect(screen.getByText(/completed_at/i)).toBeInTheDocument();
  });

  it("should NOT render when state.group is not 'completed'", () => {
    const mockIssue = {
      id: "issue-123",
      state_id: "state-456",
      completed_at: null,
    };

    (useIssueDetail as jest.Mock).mockReturnValue({
      issue: { getIssueById: () => mockIssue },
    });

    (useProjectState as jest.Mock).mockReturnValue({
      getStateById: () => ({ id: "state-456", name: "In Progress", group: "started" }),
    });

    const { container } = render(<CompletedAtProperty issueId="issue-123" />);

    // Assert component not rendered (returns null)
    expect(container.firstChild).toBeNull();
  });

  it("should be disabled when user lacks permissions", () => {
    const mockIssue = {
      id: "issue-123",
      state_id: "state-456",
      completed_at: "2026-03-11T14:30:00Z",
    };

    (useIssueDetail as jest.Mock).mockReturnValue({
      issue: { getIssueById: () => mockIssue },
      updateIssue: jest.fn(),
    });

    (useProjectState as jest.Mock).mockReturnValue({
      getStateById: () => ({ id: "state-456", name: "Done", group: "completed" }),
    });

    (useUserPermissions as jest.Mock).mockReturnValue({
      allowPermissions: () => false, // No permissions
    });

    render(<CompletedAtProperty issueId="issue-123" />);

    // Assert picker is disabled
    const picker = screen.getByRole("button", { name: /completed/i });
    expect(picker).toBeDisabled();
  });

  it("should call updateIssue when value changes", async () => {
    const mockUpdateIssue = jest.fn();
    const mockIssue = {
      id: "issue-123",
      state_id: "state-456",
      completed_at: "2026-03-11T14:30:00Z",
    };

    (useIssueDetail as jest.Mock).mockReturnValue({
      issue: { getIssueById: () => mockIssue },
      updateIssue: mockUpdateIssue,
    });

    (useProjectState as jest.Mock).mockReturnValue({
      getStateById: () => ({ id: "state-456", name: "Done", group: "completed" }),
    });

    (useUserPermissions as jest.Mock).mockReturnValue({
      allowPermissions: () => true,
    });

    render(<CompletedAtProperty issueId="issue-123" />);

    // Simulate date change
    const newDate = "2026-03-15T10:00:00Z";
    const picker = screen.getByRole("button", { name: /completed/i });
    await userEvent.click(picker);
    // ... simulate date selection

    // Assert updateIssue called with correct payload
    expect(mockUpdateIssue).toHaveBeenCalledWith(expect.any(String), expect.any(String), "issue-123", {
      completed_at: newDate,
    });
  });

  it("should default to current time if no completed_at exists", () => {
    const mockIssue = {
      id: "issue-123",
      state_id: "state-456",
      completed_at: null,
    };

    (useIssueDetail as jest.Mock).mockReturnValue({
      issue: { getIssueById: () => mockIssue },
      updateIssue: jest.fn(),
    });

    (useProjectState as jest.Mock).mockReturnValue({
      getStateById: () => ({ id: "state-456", name: "Done", group: "completed" }),
    });

    (useUserPermissions as jest.Mock).mockReturnValue({
      allowPermissions: () => true,
    });

    render(<CompletedAtProperty issueId="issue-123" />);

    // Verify component renders with default (should use current ISO time)
    const picker = screen.getByRole("button", { name: /completed/i });
    expect(picker).toBeInTheDocument();
  });
});
```

**Expected Results:**

- ✓ All 5 tests PASS
- Risk: If fails, frontend UI broken or permissions not enforced

---

## Test Execution Checklist

### Prerequisites

- [ ] Django test database configured
- [ ] pytest and pytest-django installed
- [ ] Redis available (if mocked in tests)
- [ ] Postgres running or in-memory SQLite
- [ ] All migrations applied

### Backend Tests (Execute in order)

**Phase 1: Unit Tests**

```bash
cd /Users/ngoctran/Documents/Shinhan/plane/apps/api
python -m pytest plane/tests/unit/models/test_issue_state_transitions.py -v --reuse-db --nomigrations
python -m pytest plane/tests/unit/bgtasks/test_issue_activities_task.py::TestCompletedAtActivityTracking -v --reuse-db --nomigrations
```

**Expected:** ✓ 8 passing tests (3 creation + 3 transitions + 2 manual edits + 3 activity)

**Phase 2: Integration Tests**

```bash
python -m pytest plane/tests/contract/app/test_issue_completed_at.py -v --reuse-db --nomigrations
```

**Expected:** ✓ 3 passing tests (API state transition, manual edit, clear on transition)

**Phase 3: Existing Tests (Regression)**

```bash
python -m pytest plane/tests/unit/models/test_issue_comment_modal.py -v --reuse-db --nomigrations
python -m pytest plane/tests/unit/ -v --reuse-db --nomigrations
```

**Expected:** ✓ All existing tests still pass (no regressions)

### Frontend Tests (TypeScript)

**Phase 1: Component Unit Tests**

```bash
cd /Users/ngoctran/Documents/Shinhan/plane/apps/web
npm test -- apps/web/ce/components/issues/issue-details/sidebar/__tests__/completed-at-property.test.tsx
```

**Expected:** ✓ 5 passing tests

**Phase 2: Integration Tests (E2E)**

```bash
# If Cypress/Playwright available
npm run test:e2e
```

**Expected:** User can edit completed_at in sidebar/peek-overview, values persist, activity logs created

---

## Risk Matrix

| Scenario                                  | Impact | Likelihood | Mitigation                    |
| ----------------------------------------- | ------ | ---------- | ----------------------------- |
| Manual edits overwritten by state change  | HIGH   | MEDIUM     | Test Suite 3, Contract Test 2 |
| State transition doesn't set completed_at | HIGH   | MEDIUM     | Test Suite 2, Contract Test 1 |
| Activity logging fails silently           | MEDIUM | LOW        | Test Suite 4                  |
| Frontend permission check fails           | HIGH   | LOW        | Frontend Test 4               |
| Regression: existing tests break          | MEDIUM | LOW        | Phase 3 regression tests      |

---

## Success Criteria

✓ **ALL backend unit tests PASS**
✓ **ALL backend contract tests PASS**
✓ **ALL frontend component tests PASS**
✓ **NO regressions in existing tests**
✓ **Manual completed_at edits survive Issue.save()**
✓ **Activity entries created for manual edits**
✓ **State transitions auto-set/clear completed_at correctly**

---

## Timeline

- **Backend Tests:** 30 min execution + 10 min analysis = 40 min
- **Frontend Tests:** 20 min execution + 5 min analysis = 25 min
- **Regression Tests:** 20 min execution
- **Total:** ~1.5 hours

---

## Notes

- All tests assume Issue.save() properly implements the conditional logic from phase-01
- CompletedAtDateTimePicker component must be tested separately (not found in initial scan)
- Activity integration requires end-to-end flow: PATCH → Issue.save() → track_completed_at() called
- Frontend assumes DueDatePropertyIcon is available and styled correctly
- Permission checks critical for security — read-only users must see disabled UI

---

## Unresolved Questions

1. Is `CompletedAtDateTimePicker` implemented? Need file path and test coverage.
2. Does Issue model import State correctly in save() method?
3. Are there existing tests that would catch regressions?
4. Is the backend API endpoint actually wired to call Issue.save()?
5. How should manual edits interact with concurrent state changes?
