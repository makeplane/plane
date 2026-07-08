# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for workspace-wide cycles/modules project-scoping.

Regression coverage for GHSA-wcc5-qgfr-8g9c (WEB-8068). ``WorkspaceCyclesEndpoint``
and ``WorkspaceModulesEndpoint`` are guarded only by ``WorkspaceViewerPermission``
(any active workspace member) and previously filtered by ``workspace__slug`` alone.
That let any workspace member enumerate cycle/module metadata (names, dates, issue
counts) for private projects they were not a member of.

The fix restricts both querysets to projects the requesting user is an active
member of, mirroring ``WorkspaceStatesEndpoint`` / ``WorkspaceLabelsEndpoint``.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Cycle,
    Module,
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
)

CYCLES_URL = "/api/workspaces/{slug}/cycles/"
MODULES_URL = "/api/workspaces/{slug}/modules/"


@pytest.fixture
def project(db, workspace, create_user):
    """A project in the fixture workspace; ``create_user`` is an active member."""
    project = Project.objects.create(
        name="Private Project",
        identifier="PP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=20
    )
    return project


@pytest.fixture
def cycle(db, workspace, project, create_user):
    return Cycle.objects.create(
        name="Private Cycle",
        project=project,
        workspace=workspace,
        owned_by=create_user,
    )


@pytest.fixture
def module(db, workspace, project):
    return Module.objects.create(
        name="Private Module",
        project=project,
        workspace=workspace,
    )


@pytest.fixture
def outsider_client(db, workspace):
    """Session client for a workspace member who is NOT in ``project``."""
    unique_id = uuid4().hex[:8]
    outsider = User.objects.create(
        email=f"outsider-{unique_id}@plane.so",
        username=f"outsider_{unique_id}",
        first_name="Outsider",
        last_name="User",
    )
    outsider.set_password("test-password")
    outsider.save()
    WorkspaceMember.objects.create(workspace=workspace, member=outsider, role=15)
    client = APIClient()
    client.force_authenticate(user=outsider)
    return client


@pytest.mark.contract
class TestWorkspaceCyclesModulesProjectScope:
    """A workspace member must not see cycles/modules of projects they aren't in."""

    @pytest.mark.django_db
    def test_cycles_hidden_from_non_project_member(self, outsider_client, workspace, cycle):
        response = outsider_client.get(CYCLES_URL.format(slug=workspace.slug))
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert response.data == [], f"Leaked cycle metadata: {response.data!r}"

    @pytest.mark.django_db
    def test_modules_hidden_from_non_project_member(self, outsider_client, workspace, module):
        response = outsider_client.get(MODULES_URL.format(slug=workspace.slug))
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert response.data == [], f"Leaked module metadata: {response.data!r}"

    @pytest.mark.django_db
    def test_cycles_visible_to_project_member(self, session_client, workspace, cycle):
        """Positive control: an active project member still sees the cycle."""
        response = session_client.get(CYCLES_URL.format(slug=workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data}
        assert str(cycle.id) in ids, f"Expected cycle {cycle.id} in {response.data!r}"

    @pytest.mark.django_db
    def test_modules_visible_to_project_member(self, session_client, workspace, module):
        """Positive control: an active project member still sees the module."""
        response = session_client.get(MODULES_URL.format(slug=workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data}
        assert str(module.id) in ids, f"Expected module {module.id} in {response.data!r}"
