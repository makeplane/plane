# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for workspace time tracking endpoints.
Run with: cd apps/api && python run_tests.py -c -v
"""

import pytest
from rest_framework.test import APIClient
from plane.db.models import User, Workspace, Project


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
