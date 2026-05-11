# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for field-permission enforcement on issue mutations.

Matrix (Validation #7):
  Member PATCH date None→value, toggle False  → 200  (empty→value allowed)
  Member PATCH date val1→val2, toggle False   → 403  (value→value blocked)
  Member PATCH date value→None, toggle False  → 403  (value→empty blocked)
  Member PATCH date, toggle True              → 200  (any transition allowed)
  Member DELETE, delete toggle False          → 403
  Member DELETE, delete toggle True           → 204
  Workspace admin (non-project-member) PATCH locked date → 200  (Validation #1)
  External plane/api/ path mirrors enforcement (PATCH 403 + DELETE 403/204)
"""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient
from unittest.mock import patch

from plane.db.models import Issue, Project, ProjectFieldPermission, State
from plane.tests.factories import (
    ProjectFactory,
    ProjectMemberFactory,
    UserFactory,
    WorkspaceFactory,
    WorkspaceMemberFactory,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

APP_ISSUE_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{pk}/"
EXT_ISSUE_URL = "/api/v1/workspaces/{slug}/projects/{project_id}/issues/{pk}/"


def _app_url(slug, project_id, pk):
    return APP_ISSUE_URL.format(slug=slug, project_id=project_id, pk=pk)


def _ext_url(slug, project_id, pk):
    return EXT_ISSUE_URL.format(slug=slug, project_id=project_id, pk=pk)


def _make_client(user) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=user)
    return client


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def workspace(db):
    owner = UserFactory()
    ws = WorkspaceFactory(owner=owner)
    WorkspaceMemberFactory(workspace=ws, member=owner, role=20)
    return ws


@pytest.fixture
def project(workspace):
    return ProjectFactory(
        workspace=workspace,
        created_by=workspace.owner,
        updated_by=workspace.owner,
    )


@pytest.fixture
def default_state(project):
    return State.objects.filter(project=project).first()


@pytest.fixture
def member_user(workspace, project):
    user = UserFactory()
    WorkspaceMemberFactory(workspace=workspace, member=user, role=10)
    ProjectMemberFactory(project=project, member=user, role=10)  # member (non-admin)
    return user


@pytest.fixture
def admin_user(workspace, project):
    user = UserFactory()
    WorkspaceMemberFactory(workspace=workspace, member=user, role=10)
    ProjectMemberFactory(project=project, member=user, role=20)  # admin
    return user


@pytest.fixture
def workspace_admin_user(workspace, project):
    """Workspace admin who also holds minimal project membership for @allow_permission."""
    user = UserFactory()
    WorkspaceMemberFactory(workspace=workspace, member=user, role=20)
    ProjectMemberFactory(project=project, member=user, role=10)
    return user


@pytest.fixture
def field_permission_all_locked(project, workspace):
    """ProjectFieldPermission row with all toggles False."""
    fp, _ = ProjectFieldPermission.objects.get_or_create(
        project=project,
        defaults={
            "workspace": workspace,
            "allow_member_modify_completed_date": False,
            "allow_member_modify_target_date": False,
            "allow_member_modify_start_date": False,
            "allow_member_delete_work_item": False,
        },
    )
    return fp


@pytest.fixture
def field_permission_all_open(project, workspace):
    """ProjectFieldPermission row with all toggles True."""
    fp, _ = ProjectFieldPermission.objects.get_or_create(
        project=project,
        defaults={
            "workspace": workspace,
            "allow_member_modify_completed_date": True,
            "allow_member_modify_target_date": True,
            "allow_member_modify_start_date": True,
            "allow_member_delete_work_item": True,
        },
    )
    # In case the row already exists with False values, update it
    ProjectFieldPermission.objects.filter(project=project).update(
        allow_member_modify_completed_date=True,
        allow_member_modify_target_date=True,
        allow_member_modify_start_date=True,
        allow_member_delete_work_item=True,
    )
    return fp


def _create_issue(project, workspace, user, default_state, **field_overrides):
    """Create a minimal Issue for testing."""
    return Issue.issue_objects.create(
        project=project,
        workspace=workspace,
        name="Test Issue",
        state=default_state,
        created_by=user,
        updated_by=user,
        **field_overrides,
    )


# ---------------------------------------------------------------------------
# Date field enforcement — app layer (plane/app/)
# ---------------------------------------------------------------------------


@pytest.mark.unit
@pytest.mark.django_db
class TestDateFieldEnforcementAppLayer:
    """Parametrized over all three date fields."""

    @pytest.mark.parametrize("date_field", ["target_date", "start_date"])
    def test_member_set_date_none_to_value_toggle_false_allowed(
        self, member_user, workspace, project, default_state, field_permission_all_locked, date_field
    ):
        """None → value when toggle is False → 200 (first-time set allowed)."""
        issue = _create_issue(project, workspace, member_user, default_state)
        assert getattr(issue, date_field) is None

        client = _make_client(member_user)
        with patch("plane.bgtasks.issue_activity.issue_activity.delay"), \
             patch("plane.bgtasks.webhook_task.model_activity.delay"):
            resp = client.patch(
                _app_url(workspace.slug, project.id, issue.id),
                {date_field: "2026-12-31"},
                format="json",
            )
        assert resp.status_code == 200, resp.json()

    @pytest.mark.parametrize("date_field", ["target_date", "start_date"])
    def test_member_change_date_value_to_value_toggle_false_blocked(
        self, member_user, workspace, project, default_state, field_permission_all_locked, date_field
    ):
        """value → different value when toggle is False → 403."""
        issue = _create_issue(project, workspace, member_user, default_state, **{date_field: "2026-01-01"})

        client = _make_client(member_user)
        with patch("plane.bgtasks.issue_activity.issue_activity.delay"), \
             patch("plane.bgtasks.webhook_task.model_activity.delay"):
            resp = client.patch(
                _app_url(workspace.slug, project.id, issue.id),
                {date_field: "2026-12-31"},
                format="json",
            )
        assert resp.status_code == 403

    @pytest.mark.parametrize("date_field", ["target_date", "start_date"])
    def test_member_clear_date_value_to_none_toggle_false_blocked(
        self, member_user, workspace, project, default_state, field_permission_all_locked, date_field
    ):
        """value → None when toggle is False → 403."""
        issue = _create_issue(project, workspace, member_user, default_state, **{date_field: "2026-01-01"})

        client = _make_client(member_user)
        with patch("plane.bgtasks.issue_activity.issue_activity.delay"), \
             patch("plane.bgtasks.webhook_task.model_activity.delay"):
            resp = client.patch(
                _app_url(workspace.slug, project.id, issue.id),
                {date_field: None},
                format="json",
            )
        assert resp.status_code == 403

    @pytest.mark.parametrize("date_field", ["target_date", "start_date"])
    def test_member_change_date_toggle_true_allowed(
        self, member_user, workspace, project, default_state, field_permission_all_open, date_field
    ):
        """Any transition when toggle is True → 200."""
        issue = _create_issue(project, workspace, member_user, default_state, **{date_field: "2026-01-01"})

        client = _make_client(member_user)
        with patch("plane.bgtasks.issue_activity.issue_activity.delay"), \
             patch("plane.bgtasks.webhook_task.model_activity.delay"):
            resp = client.patch(
                _app_url(workspace.slug, project.id, issue.id),
                {date_field: "2026-12-31"},
                format="json",
            )
        assert resp.status_code == 200, resp.json()

    def test_workspace_admin_patch_locked_date_allowed(
        self, workspace_admin_user, workspace, project, default_state, field_permission_all_locked
    ):
        """Workspace admin bypasses field locks → 200 (Validation #1)."""
        issue = _create_issue(
            project, workspace, workspace_admin_user, default_state, target_date="2026-01-01"
        )
        client = _make_client(workspace_admin_user)
        with patch("plane.bgtasks.issue_activity.issue_activity.delay"), \
             patch("plane.bgtasks.webhook_task.model_activity.delay"):
            resp = client.patch(
                _app_url(workspace.slug, project.id, issue.id),
                {"target_date": "2026-12-31"},
                format="json",
            )
        assert resp.status_code == 200, resp.json()


# ---------------------------------------------------------------------------
# Delete enforcement — app layer
# ---------------------------------------------------------------------------


@pytest.mark.unit
@pytest.mark.django_db
class TestDeleteEnforcementAppLayer:
    def test_member_delete_toggle_false_returns_403(
        self, member_user, workspace, project, default_state, field_permission_all_locked
    ):
        """DELETE when allow_member_delete_work_item=False → 403."""
        issue = _create_issue(project, workspace, member_user, default_state)
        client = _make_client(member_user)
        with patch("plane.bgtasks.issue_activity.issue_activity.delay"), \
             patch("plane.bgtasks.webhook_task.model_activity.delay"):
            resp = client.delete(_app_url(workspace.slug, project.id, issue.id))
        assert resp.status_code == 403

    def test_member_delete_toggle_true_returns_204(
        self, member_user, workspace, project, default_state, field_permission_all_open
    ):
        """DELETE when allow_member_delete_work_item=True → 204."""
        issue = _create_issue(project, workspace, member_user, default_state)
        client = _make_client(member_user)
        with patch("plane.bgtasks.issue_activity.issue_activity.delay"), \
             patch("plane.bgtasks.webhook_task.model_activity.delay"):
            resp = client.delete(_app_url(workspace.slug, project.id, issue.id))
        assert resp.status_code == 204


# ---------------------------------------------------------------------------
# External API (plane/api/) mirrors enforcement
# ---------------------------------------------------------------------------


@pytest.mark.unit
@pytest.mark.django_db
class TestExternalApiEnforcement:
    """Verify plane/api/ (IssueDetailAPIEndpoint) applies same field-permission gates."""

    def test_ext_member_patch_locked_date_blocked(
        self, member_user, workspace, project, default_state, field_permission_all_locked
    ):
        """Member PATCH on locked date field via external API → 403."""
        issue = _create_issue(
            project, workspace, member_user, default_state, target_date="2026-01-01"
        )
        client = _make_client(member_user)
        with patch("plane.bgtasks.issue_activity.issue_activity.delay"), \
             patch("plane.bgtasks.webhook_task.model_activity.delay"):
            resp = client.patch(
                _ext_url(workspace.slug, project.id, issue.id),
                {"target_date": "2026-12-31"},
                format="json",
            )
        assert resp.status_code == 403

    def test_ext_member_delete_toggle_false_blocked(
        self, member_user, workspace, project, default_state, field_permission_all_locked
    ):
        """Member DELETE via external API when delete locked → 403."""
        issue = _create_issue(project, workspace, member_user, default_state)
        client = _make_client(member_user)
        with patch("plane.bgtasks.issue_activity.issue_activity.delay"), \
             patch("plane.bgtasks.webhook_task.model_activity.delay"):
            resp = client.delete(_ext_url(workspace.slug, project.id, issue.id))
        assert resp.status_code == 403

    def test_ext_member_delete_toggle_true_allowed(
        self, member_user, workspace, project, default_state, field_permission_all_open
    ):
        """Member DELETE via external API when delete allowed → 204."""
        issue = _create_issue(project, workspace, member_user, default_state)
        client = _make_client(member_user)
        with patch("plane.bgtasks.issue_activity.issue_activity.delay"), \
             patch("plane.bgtasks.webhook_task.model_activity.delay"):
            resp = client.delete(_ext_url(workspace.slug, project.id, issue.id))
        assert resp.status_code == 204
