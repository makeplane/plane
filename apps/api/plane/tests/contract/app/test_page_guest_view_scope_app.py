# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
ProjectPagePermission applies the guest_view_all_features rule to every
page-scoped endpoint: project guests may only access pages they own unless the
project enables guest_view_all_features.
"""

import uuid

import pytest
from rest_framework import status

from plane.db.models import Page, PageVersion, Project, ProjectMember, ProjectPage, User


def _urls(slug, project_id, page_id, version_id):
    base = f"/api/workspaces/{slug}/projects/{project_id}/pages/{page_id}/"
    return {
        "retrieve": f"{base}?track_visit=false",
        "description": f"{base}description/",
        "versions": f"{base}versions/",
        "version_detail": f"{base}versions/{version_id}/",
    }


def _make_page(workspace, project, owner):
    page = Page.objects.create(workspace=workspace, owned_by=owner, access=Page.PUBLIC_ACCESS, name="Page")
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    version = PageVersion.objects.create(
        workspace=workspace, page=page, owned_by=owner, description_html="<p>content</p>"
    )
    return page, version


@pytest.mark.contract
class TestPageGuestViewScope:
    """create_user (session_client) is a GUEST of the project; another user
    owns a public page in it."""

    def _setup(self, workspace, guest, guest_view_all_features):
        owner = User.objects.create(email=f"owner-{uuid.uuid4().hex[:8]}@plane.so", username=uuid.uuid4().hex[:8])
        project = Project.objects.create(
            name="Project", identifier="PGV", workspace=workspace, guest_view_all_features=guest_view_all_features
        )
        ProjectMember.objects.create(workspace=workspace, project=project, member=owner, role=20)
        ProjectMember.objects.create(workspace=workspace, project=project, member=guest, role=5)
        return owner, project

    @pytest.mark.django_db
    @pytest.mark.parametrize("endpoint", ["retrieve", "description", "versions", "version_detail"])
    def test_guest_denied_other_users_page(self, session_client, workspace, create_user, endpoint):
        owner, project = self._setup(workspace, create_user, guest_view_all_features=False)
        page, version = _make_page(workspace, project, owner)

        response = session_client.get(_urls(workspace.slug, project.id, page.id, version.id)[endpoint])

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    @pytest.mark.parametrize("endpoint", ["retrieve", "description", "versions", "version_detail"])
    def test_guest_allowed_own_page(self, session_client, workspace, create_user, endpoint):
        _, project = self._setup(workspace, create_user, guest_view_all_features=False)
        page, version = _make_page(workspace, project, create_user)

        response = session_client.get(_urls(workspace.slug, project.id, page.id, version.id)[endpoint])

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    @pytest.mark.parametrize("endpoint", ["retrieve", "description", "versions", "version_detail"])
    def test_guest_allowed_when_guest_view_all_features(self, session_client, workspace, create_user, endpoint):
        owner, project = self._setup(workspace, create_user, guest_view_all_features=True)
        page, version = _make_page(workspace, project, owner)

        response = session_client.get(_urls(workspace.slug, project.id, page.id, version.id)[endpoint])

        assert response.status_code == status.HTTP_200_OK
