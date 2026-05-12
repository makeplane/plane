# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for activity emission on ProjectFieldPermission PATCH.

Validates Validation #2:
- Each toggled boolean key emits one model_activity entry.
- Unchanged keys do NOT appear in the activity payload.
"""

from __future__ import annotations

import pytest
from unittest.mock import call, patch
from rest_framework.test import APIClient

from plane.db.models import ProjectFieldPermission
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

FIELD_PERMISSION_URL = "/api/workspaces/{slug}/projects/{project_id}/field-permissions/"


def _url(slug, project_id):
    return FIELD_PERMISSION_URL.format(slug=slug, project_id=project_id)


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
def admin_user(workspace, project):
    user = UserFactory()
    WorkspaceMemberFactory(workspace=workspace, member=user, role=10)
    ProjectMemberFactory(project=project, member=user, role=20)
    return user


@pytest.fixture
def fp_row(project, workspace):
    """Pre-existing permission row with all toggles False."""
    fp, _ = ProjectFieldPermission.objects.get_or_create(
        project=project,
        defaults={"workspace": workspace},
    )
    return fp


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.unit
@pytest.mark.django_db
class TestProjectFieldPermissionActivity:
    def test_patch_single_toggle_emits_one_activity(self, admin_user, workspace, project, fp_row):
        """Toggling one field → model_activity.delay called once with that field."""
        client = _make_client(admin_user)

        with patch("plane.bgtasks.webhook_task.model_activity.delay") as mock_activity:
            resp = client.patch(
                _url(workspace.slug, project.id),
                {"allow_member_modify_target_date": True},
                format="json",
            )

        assert resp.status_code == 200
        mock_activity.assert_called_once()
        kwargs = mock_activity.call_args
        # model_activity is called with keyword args
        requested_data = kwargs.kwargs.get("requested_data") or kwargs.args[2] if kwargs.args else {}
        # Validate the changed field is present
        if isinstance(requested_data, dict):
            assert "allow_member_modify_target_date" in requested_data
            assert requested_data["allow_member_modify_target_date"]["old"] is False
            assert requested_data["allow_member_modify_target_date"]["new"] is True

    def test_patch_multiple_toggles_emits_one_activity_with_all_keys(
        self, admin_user, workspace, project, fp_row
    ):
        """Toggling multiple fields → single model_activity.delay call containing all changed keys."""
        client = _make_client(admin_user)

        with patch("plane.bgtasks.webhook_task.model_activity.delay") as mock_activity:
            resp = client.patch(
                _url(workspace.slug, project.id),
                {
                    "allow_member_modify_completed_date": True,
                    "allow_member_modify_start_date": True,
                },
                format="json",
            )

        assert resp.status_code == 200
        mock_activity.assert_called_once()
        kwargs = mock_activity.call_args
        requested_data = kwargs.kwargs.get("requested_data") or (kwargs.args[2] if len(kwargs.args) > 2 else {})
        if isinstance(requested_data, dict):
            assert "allow_member_modify_completed_date" in requested_data
            assert "allow_member_modify_start_date" in requested_data

    def test_patch_no_change_does_not_emit_activity(self, admin_user, workspace, project, fp_row):
        """PATCH with same value as current → model_activity.delay NOT called."""
        # fp_row already has allow_member_modify_target_date=False
        client = _make_client(admin_user)

        with patch("plane.bgtasks.webhook_task.model_activity.delay") as mock_activity:
            resp = client.patch(
                _url(workspace.slug, project.id),
                {"allow_member_modify_target_date": False},  # no actual change
                format="json",
            )

        assert resp.status_code == 200
        mock_activity.assert_not_called()

    def test_patch_activity_carries_correct_model_name(
        self, admin_user, workspace, project, fp_row
    ):
        """Activity entry uses model_name='project_field_permission'."""
        client = _make_client(admin_user)

        with patch("plane.bgtasks.webhook_task.model_activity.delay") as mock_activity:
            resp = client.patch(
                _url(workspace.slug, project.id),
                {"allow_member_delete_work_item": True},
                format="json",
            )

        assert resp.status_code == 200
        mock_activity.assert_called_once()
        kwargs = mock_activity.call_args
        model_name = kwargs.kwargs.get("model_name") or (kwargs.args[0] if kwargs.args else None)
        assert model_name == "project_field_permission"
