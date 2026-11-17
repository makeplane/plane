# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
A page's system fields (``is_locked``, ``archived_at`` and the audit fields) are
read-only on the page serializer. Lock state and archival only change through
the dedicated lock and archive endpoints, which carry their own rules.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.app.serializers import PageDetailSerializer
from plane.db.models import Page, Project, ProjectMember, ProjectPage, User, WorkspaceMember


def _page_url(slug, project_id, page_id, suffix=""):
    return f"/api/workspaces/{slug}/projects/{project_id}/pages/{page_id}/{suffix}"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Pages Project", identifier="PP", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def page(db, workspace, project, create_user):
    """A public page owned by ``create_user``."""
    page = Page.objects.create(workspace=workspace, owned_by=create_user, access=Page.PUBLIC_ACCESS, name="Page")
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    return page


@pytest.fixture
def member(db, workspace, project):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(email=f"member-{unique_id}@plane.so", username=f"member_{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=15)
    return user


@pytest.mark.contract
@pytest.mark.django_db
class TestPageSystemFieldsReadOnly:
    def test_partial_update_ignores_lock_and_archive_fields(self, workspace, project, page, member):
        client = APIClient()
        client.force_authenticate(user=member)

        response = client.patch(
            _page_url(workspace.slug, project.id, page.id),
            {"name": "Renamed", "is_locked": True, "archived_at": "2020-01-01"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        page.refresh_from_db()
        assert page.name == "Renamed"
        assert page.is_locked is False
        assert page.archived_at is None

    def test_serializer_does_not_accept_system_fields(self, page, member):
        serializer = PageDetailSerializer(
            page,
            data={
                "is_locked": True,
                "archived_at": "2020-01-01",
                "created_by": str(member.id),
                "updated_by": str(member.id),
                "created_at": "2020-01-01T00:00:00Z",
                "updated_at": "2020-01-01T00:00:00Z",
            },
            partial=True,
        )

        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data == {}

    def test_lock_and_archive_endpoints_still_work(self, session_client, workspace, project, page):
        lock_url = _page_url(workspace.slug, project.id, page.id, "lock/")
        archive_url = _page_url(workspace.slug, project.id, page.id, "archive/")

        response = session_client.post(lock_url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        page.refresh_from_db()
        assert page.is_locked is True

        response = session_client.delete(lock_url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        page.refresh_from_db()
        assert page.is_locked is False

        response = session_client.post(archive_url)
        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.archived_at is not None

        response = session_client.delete(archive_url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        page.refresh_from_db()
        assert page.archived_at is None
