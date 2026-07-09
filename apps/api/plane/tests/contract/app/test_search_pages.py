# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from uuid import uuid4
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Page, Project, ProjectMember, ProjectPage, User, WorkspaceMember


@pytest.fixture
def project(db, workspace, create_user):
    """Create a project with the test user as an administrator"""
    project = Project.objects.create(name="Search Project", identifier="SRCH", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def other_member_client(db, workspace, project):
    """A second active member of the same project, with their own session client"""
    member = User.objects.create(
        email=f"member-{uuid4().hex[:8]}@plane.so", username=f"member-{uuid4().hex[:12]}", first_name="Member"
    )
    WorkspaceMember.objects.create(workspace=workspace, member=member, role=15, is_active=True)
    ProjectMember.objects.create(project=project, member=member, role=15, is_active=True)
    client = APIClient()
    client.force_authenticate(user=member)
    return client


def make_page(workspace, project, owner, name, access=0):
    page = Page.objects.create(workspace=workspace, name=name, owned_by=owner, access=access)
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    return page


def search_url(slug):
    return f"/api/workspaces/{slug}/search/?search=Secret&entities=page&workspace_search=true"


@pytest.mark.contract
class TestGlobalSearchPrivatePages:
    """A private page must only be searchable by its owner (leak fix)."""

    @pytest.mark.django_db
    def test_private_page_hidden_from_other_members(
        self, other_member_client, workspace, project, create_user
    ):
        make_page(workspace, project, create_user, "Secret roadmap", access=1)
        response = other_member_client.get(search_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        names = [p["name"] for p in response.json()["results"]["page"]]
        assert "Secret roadmap" not in names

    @pytest.mark.django_db
    def test_private_page_visible_to_owner(self, session_client, workspace, project, create_user):
        make_page(workspace, project, create_user, "Secret roadmap", access=1)
        response = session_client.get(search_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        names = [p["name"] for p in response.json()["results"]["page"]]
        assert "Secret roadmap" in names

    @pytest.mark.django_db
    def test_public_page_visible_to_other_members(
        self, other_member_client, workspace, project, create_user
    ):
        make_page(workspace, project, create_user, "Secret handbook", access=0)
        response = other_member_client.get(search_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        names = [p["name"] for p in response.json()["results"]["page"]]
        assert "Secret handbook" in names
