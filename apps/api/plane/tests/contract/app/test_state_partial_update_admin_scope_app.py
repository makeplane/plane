# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for StateViewSet.partial_update authorization.

Editing a workflow state is project
configuration — its sibling writes (create, destroy, mark_as_default) are all
``@allow_permission([ROLE.ADMIN])``. ``partial_update`` was the outlier at
``[ADMIN, MEMBER, GUEST]``, so any project Guest could rewrite any state
(name/color/group/description/sequence/order) and set it as the project default,
functionally bypassing the admin-only ``mark_as_default``.

The fix restricts ``partial_update`` to ADMIN.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, State, User, WorkspaceMember


def _state_url(slug, project_id, pk):
    return f"/api/workspaces/{slug}/projects/{project_id}/states/{pk}/"


def _member_of(workspace, project, *, role):
    unique = uuid4().hex[:8]
    user = User.objects.create(email=f"state-{role}-{unique}@plane.so", username=f"state_{role}_{unique}")
    user.set_password("test-password")
    user.save()
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role, is_active=True)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=role, is_active=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="State Project", identifier="ST", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20, is_active=True)
    return project


@pytest.fixture
def state(db, workspace, project):
    return State.objects.create(
        name="Backlog", color="#60646C", group="backlog", default=False, project=project, workspace=workspace
    )


@pytest.mark.contract
@pytest.mark.django_db
class TestStatePartialUpdateAdminScope:
    """Editing a workflow state must be ADMIN-only (matches create/destroy/default)."""

    def test_guest_cannot_patch_state(self, workspace, project, state):
        guest_client = _member_of(workspace, project, role=5)
        response = guest_client.patch(
            _state_url(workspace.slug, project.id, state.id), {"name": "Guest Renamed", "default": True}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        state.refresh_from_db()
        assert state.name == "Backlog"
        assert state.default is False

    def test_member_cannot_patch_state(self, workspace, project, state):
        member_client = _member_of(workspace, project, role=15)
        response = member_client.patch(
            _state_url(workspace.slug, project.id, state.id),
            {"name": "Member Renamed", "default": True},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        state.refresh_from_db()
        assert state.name == "Backlog"
        assert state.default is False

    def test_admin_can_patch_state(self, session_client, workspace, project, state):
        """Positive control: a project admin may still edit a state."""
        response = session_client.patch(
            _state_url(workspace.slug, project.id, state.id), {"name": "Admin Renamed"}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        state.refresh_from_db()
        assert state.name == "Admin Renamed"
