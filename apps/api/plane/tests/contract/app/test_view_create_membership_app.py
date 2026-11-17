# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Creating a view requires membership: workspace views need an active workspace
member, project views an active project member."""

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import IssueView, Project, ProjectMember, User, Workspace


def _user(prefix):
    suffix = uuid4().hex[:8]
    return User.objects.create(email=f"{prefix}-{suffix}@plane.so", username=f"{prefix}_{suffix}")


def _project(workspace, identifier, member):
    project = Project.objects.create(name=f"{identifier} project", identifier=identifier, workspace=workspace)
    ProjectMember.objects.create(workspace=workspace, project=project, member=member, role=20)
    return project


@pytest.mark.contract
class TestViewCreateMembership:
    @pytest.mark.django_db
    def test_workspace_member_can_create_workspace_view(self, session_client, workspace, create_user):
        response = session_client.post(f"/api/workspaces/{workspace.slug}/views/", {"name": "Mine"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        view = IssueView.objects.get(pk=response.json()["id"])
        assert view.workspace_id == workspace.id
        assert view.project_id is None
        assert view.owned_by_id == create_user.id

    @pytest.mark.django_db
    def test_non_member_cannot_create_workspace_view(self, session_client, workspace):
        other = _user("other")
        foreign = Workspace.objects.create(name="Foreign", owner=other, slug=f"foreign-{uuid4().hex[:8]}")

        response = session_client.post(f"/api/workspaces/{foreign.slug}/views/", {"name": "Nope"}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not IssueView.objects.filter(workspace=foreign).exists()

    @pytest.mark.django_db
    def test_project_member_can_create_project_view(self, session_client, workspace, create_user):
        project = _project(workspace, "OWN", create_user)

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/views/", {"name": "Mine"}, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        view = IssueView.objects.get(pk=response.json()["id"])
        assert view.project_id == project.id
        assert view.owned_by_id == create_user.id

    @pytest.mark.django_db
    def test_non_member_cannot_create_project_view(self, session_client, workspace):
        project = _project(workspace, "SEC", _user("other"))

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/views/", {"name": "Nope"}, format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not IssueView.objects.filter(project=project).exists()
