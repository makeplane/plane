# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for workspace time tracking endpoints.
Run with: cd apps/api && python run_tests.py -c -v
"""

from datetime import timedelta
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from plane.db.models import Issue, IssueWorkLog, Project, User, Workspace
from plane.tests.factories import (
    ProjectFactory,
    ProjectMemberFactory,
    UserFactory,
    WorkspaceFactory,
    WorkspaceMemberFactory,
)


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceTimeTracking:
    """Test all workspace time tracking API endpoints."""

    @pytest.fixture(autouse=True)
    def setup(self, db):
        """Set up test fixtures."""
        # Get or create the test user
        self.user = User.objects.get(email="ngocyt001@gmail.com")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Get workspaces
        self.workspace_huhuh = Workspace.objects.get(slug="huhuhhahaha")
        self.workspace_yesyes = Workspace.objects.get(slug="yesyes")

        # Get project IDs
        self.project_huhuh = Project.objects.filter(
            workspace=self.workspace_huhuh, archived_at__isnull=True
        ).first()
        self.project_yesyes = Project.objects.filter(
            workspace=self.workspace_yesyes, archived_at__isnull=True
        ).first()

    def test_workspace_time_tracking_endpoints(self):
        """Test all 8 time tracking endpoints across both workspaces."""
        results = []

        # Define test cases: (workspace_slug, project_id, endpoint_key, url_pattern)
        test_cases = []

        for slug, project in [("huhuhhahaha", self.project_huhuh), ("yesyes", self.project_yesyes)]:
            if project is None:
                pytest.skip(f"No active project found for workspace {slug}")
                continue

            pid = str(project.id)
            base = f"/api/workspaces/{slug}"

            test_cases.extend([
                # 1. Project-scoped timesheet
                (slug, f"{base}/projects/{pid}/time-tracking/timesheet/", "project_timesheet"),

                # 2. Workspace analytics timesheet
                (slug, f"{base}/time-tracking/analytics/timesheet/", "analytics_timesheet"),

                # 3. Workspace analytics capacity
                (slug, f"{base}/time-tracking/analytics/capacity/", "analytics_capacity"),

                # 4. Cross-workspace timesheet
                (slug, f"{base}/time-tracking/cross-workspace/timesheet/", "cross_timesheet"),

                # 5. Cross-workspace capacity
                (slug, f"{base}/time-tracking/cross-workspace/capacity/", "cross_capacity"),

                # 6. Project capacity
                (slug, f"{base}/projects/{pid}/time-tracking/capacity/", "project_capacity"),

                # 7. Project capacity + cross_workspace=true
                (slug, f"{base}/projects/{pid}/time-tracking/capacity/?cross_workspace=true", "project_capacity_cw"),

                # 8. Workspace analytics capacity + cross_workspace=true
                (slug, f"{base}/time-tracking/analytics/capacity/?cross_workspace=true", "analytics_capacity_cw"),
            ])

        # Execute all tests
        for slug, url, endpoint_key in test_cases:
            resp = self.client.get(url)
            results.append({
                "workspace": slug,
                "endpoint": endpoint_key,
                "url": url,
                "status": resp.status_code,
            })

            # Print result for visibility
            body_preview = resp.content.decode()[:200] if resp.content else ""
            print(f"\n  [{resp.status_code}] {slug} - {endpoint_key}")
            if resp.status_code >= 400:
                print(f"    Body: {body_preview}")

        # Summary
        print("\n\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)

        by_status = {}
        for r in results:
            by_status.setdefault(r["status"], []).append(f"{r['workspace']}/{r['endpoint']}")

        for st in sorted(by_status.keys()):
            endpoints = by_status[st]
            print(f"\n  Status {st} ({len(endpoints)} endpoints):")
            for e in endpoints:
                print(f"    - {e}")

        # Assert all are 2xx
        errors = [r for r in results if r["status"] >= 400]
        if errors:
            print(f"\n  [!] {len(errors)} error(s):")
            for r in errors:
                print(f"      {r['workspace']} - {r['endpoint']}: status={r['status']}")
                resp = self.client.get(r["url"])
                print(f"      Body: {resp.content.decode()[:300]}")

        assert len(errors) == 0, f"{len(errors)} endpoint(s) returned non-2xx status"


@pytest.mark.contract
@pytest.mark.django_db
class TestTimesheetSubIssues:
    """Sub-items expansion: sub_issues_count on grid rows + lazy sub-issues endpoint.

    Self-contained fixtures (no reliance on seeded DB rows) so the suite runs on a
    clean --reuse-db --nomigrations database. sub_issues_count and the endpoint are
    both scoped to the *current user's own logged children for the week* — so the
    chevron only appears when expanding shows the user's logged sub-items.
    """

    @pytest.fixture(autouse=True)
    def setup(self, db):
        self.user = UserFactory(email="me-subissues@plane.so", username=f"me-{uuid4().hex[:8]}")
        self.other = UserFactory(email="other-subissues@plane.so", username=f"other-{uuid4().hex[:8]}")

        self.workspace = WorkspaceFactory(slug=f"sub-issues-{uuid4().hex[:8]}", owner=self.user)
        WorkspaceMemberFactory(workspace=self.workspace, member=self.user, role=20)

        self.project = ProjectFactory(name="Sub Issues Project", workspace=self.workspace, identifier="SUB")
        ProjectMemberFactory(project=self.project, member=self.user, workspace=self.workspace, role=20)

        # A second project in the same workspace, to test parent_id cross-project 404.
        self.other_project = ProjectFactory(name="Other Project", workspace=self.workspace, identifier="OTH")

        # Issue hierarchy: parent -> [child_logged, child_unlogged]
        self.parent = self._make_issue("Parent", seq=1)
        self.child_logged = self._make_issue("Logged child", seq=2, parent=self.parent)
        self.child_unlogged = self._make_issue("Unlogged child", seq=3, parent=self.parent)

        # Week anchored to current Monday so the default (no week_start) view matches.
        today = timezone.now().date()
        self.week_start = today - timedelta(days=today.weekday())

        # Current user logs time on the parent + exactly ONE child.
        self._log(self.parent, self.user, 60)
        self._log(self.child_logged, self.user, 30)
        # The second child is logged only by a DIFFERENT user -> must not surface for us.
        self._log(self.child_unlogged, self.other, 45)

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _make_issue(self, name, seq, parent=None):
        return Issue.objects.create(
            name=name,
            sequence_id=seq,
            parent=parent,
            project=self.project,
            workspace=self.workspace,
            created_by=self.user,
        )

    def _log(self, issue, who, minutes):
        return IssueWorkLog.objects.create(
            issue=issue,
            project=self.project,
            workspace=self.workspace,
            logged_by=who,
            duration_minutes=minutes,
            logged_at=self.week_start,
        )

    def _grid_url(self):
        return (
            f"/api/workspaces/{self.workspace.slug}/projects/{self.project.id}"
            f"/time-tracking/timesheet/?week_start={self.week_start.isoformat()}"
        )

    def _sub_url(self, parent_id, project=None, week_start=None):
        project = project or self.project
        url = (
            f"/api/workspaces/{self.workspace.slug}/projects/{project.id}"
            f"/time-tracking/timesheet/sub-issues/?parent_id={parent_id}"
        )
        if week_start:
            url += f"&week_start={week_start}"
        return url

    def _row(self, rows, issue_id):
        return next((r for r in rows if r["issue_id"] == str(issue_id)), None)

    def test_timesheet_grid_includes_sub_issues_count(self):
        """Parent row reports exactly 1 logged child (not both children)."""
        resp = self.client.get(self._grid_url())
        assert resp.status_code == 200
        parent_row = self._row(resp.data["rows"], self.parent.id)
        assert parent_row is not None
        assert parent_row["sub_issues_count"] == 1
        # The logged child appears top-level too, with no logged children of its own.
        child_row = self._row(resp.data["rows"], self.child_logged.id)
        assert child_row is not None
        assert child_row["sub_issues_count"] == 0

    def test_timesheet_grid_totals_unchanged(self):
        """Adding sub_issues_count must not alter daily totals / grand total."""
        resp = self.client.get(self._grid_url())
        assert resp.status_code == 200
        # User logged 60 (parent) + 30 (child) = 90 for the week (child_unlogged is another user's).
        assert resp.data["grand_total_minutes"] == 90
        assert resp.data["daily_totals"][self.week_start.isoformat()] == 90

    def test_timesheet_sub_issues_endpoint(self):
        """Returns ONLY the current user's logged child; no 0-minute placeholder."""
        resp = self.client.get(self._sub_url(self.parent.id, week_start=self.week_start.isoformat()))
        assert resp.status_code == 200
        rows = resp.data["rows"]
        assert len(rows) == 1
        row = rows[0]
        assert row["issue_id"] == str(self.child_logged.id)
        assert row["total_minutes"] == 30
        assert row["days"][self.week_start.isoformat()] == 30
        assert row["sub_issues_count"] == 0
        # The unlogged child is absent (no placeholder row).
        assert all(r["issue_id"] != str(self.child_unlogged.id) for r in rows)

    def test_timesheet_sub_issues_excludes_other_users_logs(self):
        """A child logged only by another user is neither returned nor counted."""
        resp = self.client.get(self._sub_url(self.parent.id, week_start=self.week_start.isoformat()))
        assert resp.status_code == 200
        ids = {r["issue_id"] for r in resp.data["rows"]}
        assert str(self.child_unlogged.id) not in ids
        # And the grid count stays 1 (only the user's logged child).
        grid = self.client.get(self._grid_url())
        assert self._row(grid.data["rows"], self.parent.id)["sub_issues_count"] == 1

    def test_timesheet_sub_issues_cross_workspace_count(self):
        """Cross-workspace grid rows include sub_issues_count (the default view)."""
        url = (
            f"/api/workspaces/{self.workspace.slug}/time-tracking/cross-workspace/timesheet/"
            f"?week_start={self.week_start.isoformat()}"
        )
        resp = self.client.get(url)
        assert resp.status_code == 200
        parent_row = self._row(resp.data["rows"], self.parent.id)
        assert parent_row is not None
        assert parent_row["sub_issues_count"] == 1

    def test_timesheet_sub_issues_requires_parent_id(self):
        """400 when parent_id missing or malformed; 404 when in another project."""
        # Missing parent_id
        no_parent = (
            f"/api/workspaces/{self.workspace.slug}/projects/{self.project.id}"
            f"/time-tracking/timesheet/sub-issues/"
        )
        assert self.client.get(no_parent).status_code == 400
        # Malformed UUID
        assert self.client.get(self._sub_url("not-a-uuid")).status_code == 400
        # parent_id belongs to a DIFFERENT project -> 404
        cross_project_parent = self._make_other_project_issue()
        assert self.client.get(self._sub_url(cross_project_parent.id)).status_code == 404

    def _make_other_project_issue(self):
        return Issue.objects.create(
            name="Foreign parent",
            sequence_id=1,
            project=self.other_project,
            workspace=self.workspace,
            created_by=self.user,
        )

    def test_timesheet_sub_issues_forbidden_for_non_member(self):
        """A user with no project membership is denied (403)."""
        stranger = UserFactory(email="stranger-subissues@plane.so", username=f"stranger-{uuid4().hex[:8]}")
        WorkspaceMemberFactory(workspace=self.workspace, member=stranger, role=15)
        client = APIClient()
        client.force_authenticate(user=stranger)
        resp = client.get(self._sub_url(self.parent.id))
        assert resp.status_code == 403
