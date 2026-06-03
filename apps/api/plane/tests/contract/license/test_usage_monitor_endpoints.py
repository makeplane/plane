# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the instance usage-monitor endpoints.

Endpoints (InstanceAdminPermission):
  GET /api/instances/usage-monitor/users/
  GET /api/instances/usage-monitor/departments/

The responses carry no echoed filter fields — the client owns filter state and
sends explicit dates. Bad input must yield 400, never 500.
"""

import uuid
from datetime import date

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from plane.db.models import User
from plane.license.models import Instance, InstanceAdmin
from plane.tests.factories import (
    IssueFactory,
    IssueWorkLogFactory,
    ProjectFactory,
    UserFactory,
    WorkspaceFactory,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def setup_instance(db):
    instance_id = (
        uuid.uuid4() if not Instance.objects.exists() else Instance.objects.first().id
    )
    instance, _ = Instance.objects.update_or_create(
        id=instance_id,
        defaults={
            "instance_name": "Test Instance",
            "instance_id": str(uuid.uuid4()),
            "current_version": "1.0.0",
            "domain": "http://localhost:8000",
            "last_checked_at": timezone.now(),
            "is_setup_done": True,
        },
    )
    return instance


@pytest.fixture
def admin_user(db):
    user = User.objects.create(
        email="usage-admin@test.plane.so",
        first_name="Admin",
        last_name="User",
        username="usage-admin@test.plane.so",
    )
    user.set_password("admin-password-123")
    user.save()
    return user


@pytest.fixture
def instance_admin(setup_instance, admin_user):
    return InstanceAdmin.objects.create(
        instance=setup_instance, user=admin_user, role=20, is_super_admin=True
    )


@pytest.fixture
def admin_client(api_client, admin_user, instance_admin):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def worklog_data(db):
    """Two workspaces; one standard day in ws_a, one short day in ws_b."""
    user = UserFactory()
    ws_a = WorkspaceFactory()
    ws_b = WorkspaceFactory()
    issue_a = IssueFactory(project=ProjectFactory(workspace=ws_a, name="A", identifier="AAA"))
    issue_b = IssueFactory(project=ProjectFactory(workspace=ws_b, name="B", identifier="BBB"))
    IssueWorkLogFactory(issue=issue_a, logged_by=user, duration_minutes=500, logged_at=date(2026, 5, 10))
    IssueWorkLogFactory(issue=issue_b, logged_by=user, duration_minutes=120, logged_at=date(2026, 5, 11))
    return {"user": user, "ws_a": ws_a, "ws_b": ws_b}


WIDE_RANGE = {"date_from": "2026-05-01", "date_to": "2026-05-31", "granularity": "day"}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


@pytest.mark.contract
@pytest.mark.django_db
class TestUsageMonitorAuth:
    def test_users_requires_instance_admin(self, api_client):
        response = api_client.get(reverse("usage-monitor-users"))
        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_departments_requires_instance_admin(self, api_client):
        response = api_client.get(reverse("usage-monitor-departments"))
        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )


# ---------------------------------------------------------------------------
# Users endpoint
# ---------------------------------------------------------------------------


@pytest.mark.contract
@pytest.mark.django_db
class TestUsageMonitorUsers:
    def test_returns_expected_keys(self, admin_client, worklog_data):
        response = admin_client.get(reverse("usage-monitor-users"), WIDE_RANGE)
        assert response.status_code == status.HTTP_200_OK
        body = response.data
        assert set(body.keys()) == {
            "series_active",
            "series_standard",
            "total_active_users",
            "total_standard_users",
        }
        # series_standard mirrors series_active: one count per period bucket
        assert all(set(p.keys()) == {"period", "standard_users"} for p in body["series_standard"])
        # the two series cover the exact same period buckets (standard <= active per bucket)
        assert [p["period"] for p in body["series_standard"]] == [p["period"] for p in body["series_active"]]
        # No echoed filter fields in the envelope
        assert "granularity" not in body
        assert "date_from" not in body

    def test_metrics_reflect_data(self, admin_client, worklog_data):
        response = admin_client.get(reverse("usage-monitor-users"), WIDE_RANGE)
        body = response.data
        assert body["total_active_users"] == 1
        # the 500-min day on 05-10 makes the user standard at least once in range
        assert body["total_standard_users"] == 1
        # per-day status: standard on the 500-min day, not on the 120-min day
        series = {p["period"]: p["standard_users"] for p in body["series_standard"]}
        assert series.get("2026-05-10") == 1
        assert series.get("2026-05-11") == 0

    def test_workspace_filter_narrows(self, admin_client, worklog_data):
        params = {**WIDE_RANGE, "workspace_id": str(worklog_data["ws_b"].id)}
        response = admin_client.get(reverse("usage-monitor-users"), params)
        assert response.status_code == status.HTTP_200_OK
        # ws_b only has a 120-min day → active but never standard
        assert response.data["total_active_users"] == 1
        assert response.data["total_standard_users"] == 0

    def test_date_range_respected(self, admin_client, worklog_data):
        params = {"date_from": "2026-05-11", "date_to": "2026-05-11", "granularity": "day"}
        response = admin_client.get(reverse("usage-monitor-users"), params)
        # only the 120-min day on 05-11 is in range
        assert response.data["total_standard_users"] == 0
        assert response.data["total_active_users"] == 1

    def test_bad_granularity_returns_400(self, admin_client):
        response = admin_client.get(reverse("usage-monitor-users"), {"granularity": "weekly"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_bad_date_returns_400(self, admin_client):
        response = admin_client.get(reverse("usage-monitor-users"), {"date_from": "05-2026-01"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_bad_workspace_id_returns_400(self, admin_client):
        response = admin_client.get(reverse("usage-monitor-users"), {"workspace_id": "not-a-uuid"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_over_long_range_returns_400(self, admin_client):
        params = {"date_from": "2025-01-01", "date_to": "2026-05-31", "granularity": "day"}
        response = admin_client.get(reverse("usage-monitor-users"), params)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_inverted_range_returns_400(self, admin_client):
        params = {"date_from": "2026-05-31", "date_to": "2026-05-01", "granularity": "day"}
        response = admin_client.get(reverse("usage-monitor-users"), params)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Departments endpoint
# ---------------------------------------------------------------------------


@pytest.mark.contract
@pytest.mark.django_db
class TestUsageMonitorDepartments:
    def test_returns_workspaces_no_projects_without_filter(self, admin_client, worklog_data):
        response = admin_client.get(reverse("usage-monitor-departments"), WIDE_RANGE)
        assert response.status_code == status.HTTP_200_OK
        assert "workspaces" in response.data
        assert "projects" not in response.data
        slugs = {w["slug"] for w in response.data["workspaces"]}
        assert worklog_data["ws_a"].slug in slugs
        assert worklog_data["ws_b"].slug in slugs

    def test_projects_present_when_workspace_filtered(self, admin_client, worklog_data):
        params = {**WIDE_RANGE, "workspace_id": str(worklog_data["ws_a"].id)}
        response = admin_client.get(reverse("usage-monitor-departments"), params)
        assert response.status_code == status.HTTP_200_OK
        assert "projects" in response.data
        assert len(response.data["workspaces"]) == 1
        assert response.data["workspaces"][0]["slug"] == worklog_data["ws_a"].slug
        assert response.data["workspaces"][0]["total_logged_minutes"] == 500

    def test_bad_date_returns_400(self, admin_client):
        response = admin_client.get(reverse("usage-monitor-departments"), {"date_to": "garbage"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
