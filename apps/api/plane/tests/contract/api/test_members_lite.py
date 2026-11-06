# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the workspace/project members-lite endpoints.

GET /api/v1/workspaces/<slug>/members-lite/
GET /api/v1/workspaces/<slug>/projects/<project_id>/project-members-lite/
"""

import pytest
from rest_framework import status

from plane.db.models import Project, ProjectMember

_LITE_MEMBER_FIELDS = (
    "id",
    "first_name",
    "last_name",
    "email",
    "avatar",
    "avatar_url",
    "display_name",
    "role",
    "is_active",
    "is_bot",
)


def _ws_url(slug):
    return f"/api/v1/workspaces/{slug}/members-lite/"


def _project_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/project-members-lite/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Members Lite Project",
        identifier="MLP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=create_user,
        role=20,
        is_active=True,
    )
    return project


@pytest.mark.contract
class TestWorkspaceMembersLite:
    @pytest.mark.django_db
    def test_returns_paginated_member(self, api_key_client, workspace):
        response = api_key_client.get(_ws_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        emails = {item["email"] for item in response.data["results"]}
        assert "test@plane.so" in emails

    @pytest.mark.django_db
    def test_lite_member_shape(self, api_key_client, workspace):
        response = api_key_client.get(_ws_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        item = response.data["results"][0]
        for key in _LITE_MEMBER_FIELDS:
            assert key in item
        # The requesting user is the workspace owner (admin role = 20).
        assert item["role"] == 20

    @pytest.mark.django_db
    def test_unknown_workspace_is_rejected(self, api_key_client):
        response = api_key_client.get(_ws_url("does-not-exist"))
        assert response.status_code in (
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )


@pytest.mark.contract
class TestProjectMembersLite:
    @pytest.mark.django_db
    def test_returns_paginated_member(self, api_key_client, workspace, project):
        response = api_key_client.get(_project_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        emails = {item["email"] for item in response.data["results"]}
        assert "test@plane.so" in emails

    @pytest.mark.django_db
    def test_lite_member_shape(self, api_key_client, workspace, project):
        response = api_key_client.get(_project_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        item = response.data["results"][0]
        for key in _LITE_MEMBER_FIELDS:
            assert key in item


@pytest.fixture
def roster(db, workspace):
    """Three more workspace members besides the owner: a guest, a removed member and a bot."""
    from uuid import uuid4

    from plane.db.models import User, WorkspaceMember

    def add(first, email, role, *, active=True, bot=False):
        user = User.objects.create(
            email=email, username=uuid4().hex[:12], first_name=first, display_name=first.lower(), is_bot=bot
        )
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=role, is_active=active)
        return user

    return {
        "alice": add("Alice", "alice@example.com", 5),
        "bob": add("Bob", "bob@example.com", 15, active=False),
        "robo": add("Robo", "robo@bots.example.com", 15, bot=True),
    }


@pytest.mark.contract
class TestWorkspaceMembersLiteFilters:
    """plane-sdk's MemberListQueryParams. The endpoint ignored them all, so a lookup
    by email returned every member and an agent could act on the wrong person."""

    def _emails(self, client, workspace, query):
        response = client.get(_ws_url(workspace.slug), query)
        assert response.status_code == status.HTTP_200_OK, response.data
        return sorted(item["email"] for item in response.data["results"])

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        ("query", "expected"),
        [
            ({"email": "ALICE@example"}, ["alice@example.com"]),
            ({"first_name": "bo"}, ["bob@example.com", "robo@bots.example.com"]),
            ({"first_name": "bo", "is_bot": "false"}, ["bob@example.com"]),
            ({"display_name": "robo"}, ["robo@bots.example.com"]),
            ({"role_slug": "guest"}, ["alice@example.com"]),
            ({"is_active": "false"}, ["bob@example.com"]),
            ({"email": "nobody@nowhere"}, []),
        ],
    )
    def test_filters_narrow_the_list(self, api_key_client, workspace, roster, query, expected):
        assert self._emails(api_key_client, workspace, query) == expected

    @pytest.mark.django_db
    def test_order_by(self, api_key_client, workspace, roster):
        response = api_key_client.get(_ws_url(workspace.slug), {"order_by": "-email", "is_active": "true"})
        assert [item["email"] for item in response.data["results"]] == [
            "test@plane.so",
            "robo@bots.example.com",
            "alice@example.com",
        ]

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "query", [{"is_active": "True!"}, {"role_slug": "owner"}, {"order_by": "member__password"}]
    )
    def test_bad_filter_is_400(self, api_key_client, workspace, query):
        assert api_key_client.get(_ws_url(workspace.slug), query).status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_project_lite_filters_too(self, api_key_client, workspace, project, create_user):
        response = api_key_client.get(_project_url(workspace.slug, project.id), {"email": "nobody@nowhere"})
        assert response.status_code == status.HTTP_200_OK and response.data["results"] == []
        response = api_key_client.get(_project_url(workspace.slug, project.id), {"email": create_user.email})
        assert [item["email"] for item in response.data["results"]] == [create_user.email]
