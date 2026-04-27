# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import Project, ProjectMember, State, User, WorkspaceMember


@pytest.fixture
def other_workspace_member(db, workspace):
    """Create another user that is a member of the workspace, distinct from the creator."""
    from uuid import uuid4

    unique_id = uuid4().hex[:8]
    other = User.objects.create(
        email=f"other-{unique_id}@plane.so",
        username=f"other_user_{unique_id}",
        first_name="Other",
        last_name="User",
    )
    other.set_password("test-password")
    other.save()
    WorkspaceMember.objects.create(workspace=workspace, member=other, role=20)
    return other


@pytest.mark.contract
class TestProjectListCreateAPIEndpoint:
    """Contract tests for POST /api/v1/workspaces/{slug}/projects/."""

    def get_url(self, workspace_slug):
        return f"/api/v1/workspaces/{workspace_slug}/projects/"

    @pytest.mark.django_db
    def test_create_project_with_lead_as_creator(self, api_key_client, workspace, create_user):
        """Regression for the ghost-create bug.

        When project_lead points to the creator's own user_id, the endpoint
        must return 201 and create a fully-populated project (single
        ProjectMember as admin, default workflow states).

        Before the fix, the endpoint returned 400 "Please provide valid detail"
        but had already persisted the Project row without states or members,
        leaving an unusable orphan.
        """
        url = self.get_url(workspace.slug)
        payload = {
            "name": "Self Lead Project",
            "identifier": "SL",
            "project_lead": str(create_user.id),
        }

        response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"
        assert Project.objects.count() == 1

        project = Project.objects.first()
        # Creator is registered as admin (single membership; lead == creator
        # should not produce a duplicate row).
        assert ProjectMember.objects.filter(project=project, member=create_user, role=20).count() == 1
        # Default workflow states must be created.
        assert State.objects.filter(project=project).count() == 5

    @pytest.mark.django_db
    def test_create_project_with_lead_as_other_user(
        self, api_key_client, workspace, create_user, other_workspace_member
    ):
        """When project_lead is a different workspace member, both creator
        and lead become admins of the project."""
        url = self.get_url(workspace.slug)
        payload = {
            "name": "Other Lead Project",
            "identifier": "OL",
            "project_lead": str(other_workspace_member.id),
        }

        response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"
        project = Project.objects.first()

        # Both creator and other_workspace_member are admins.
        assert ProjectMember.objects.filter(project=project, member=create_user, role=20).exists()
        assert ProjectMember.objects.filter(project=project, member=other_workspace_member, role=20).exists()
        assert State.objects.filter(project=project).count() == 5

    @pytest.mark.django_db
    def test_create_project_without_lead(self, api_key_client, workspace, create_user):
        """Baseline regression: omitting project_lead must succeed and the
        creator becomes the sole admin."""
        url = self.get_url(workspace.slug)
        payload = {
            "name": "Basic Project",
            "identifier": "BP",
        }

        response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"
        project = Project.objects.first()
        assert ProjectMember.objects.filter(project=project, member=create_user, role=20).count() == 1
        assert State.objects.filter(project=project).count() == 5
