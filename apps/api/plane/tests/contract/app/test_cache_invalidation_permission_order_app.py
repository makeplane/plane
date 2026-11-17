# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: a write endpoint invalidates its cache only after the role check passes."""

from unittest.mock import patch

import pytest
from rest_framework import status

from plane.db.models import Project, ProjectMember, WorkspaceMember
from plane.tests.factories import WorkspaceFactory

INVALIDATE = "plane.utils.cache.invalidate_cache_directly"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Cache", identifier="CCH", workspace=workspace)
    ProjectMember.objects.create(workspace=workspace, project=project, member=create_user, role=20, is_active=True)
    return project


def _project_url(workspace, project, resource):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/{resource}/"


@pytest.mark.contract
class TestCacheInvalidationPermissionOrder:
    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "resource, payload",
        [
            ("issue-labels", {"name": "Bug"}),
            ("states", {"name": "Review", "color": "#000000", "group": "started"}),
        ],
    )
    def test_denied_project_write_does_not_invalidate_cache(
        self, session_client, workspace, project, create_user, resource, payload
    ):
        # A workspace and project member: allowed into the project, but not an admin
        WorkspaceMember.objects.filter(workspace=workspace, member=create_user).update(role=15)
        ProjectMember.objects.filter(project=project, member=create_user).update(role=15)

        with patch(INVALIDATE) as invalidate:
            response = session_client.post(_project_url(workspace, project, resource), payload, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        invalidate.assert_not_called()

    @pytest.mark.django_db
    def test_denied_workspace_leave_does_not_invalidate_cache(self, session_client):
        other_workspace = WorkspaceFactory()

        with patch(INVALIDATE) as invalidate:
            response = session_client.post(f"/api/workspaces/{other_workspace.slug}/members/leave/")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        invalidate.assert_not_called()

    @pytest.mark.django_db
    def test_allowed_write_still_invalidates_cache(self, session_client, workspace, project):
        with patch(INVALIDATE) as invalidate:
            response = session_client.post(
                _project_url(workspace, project, "issue-labels"), {"name": "Bug"}, format="json"
            )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        invalidate.assert_called_once()
