# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for guest write restrictions on ``IssueChecklistItemViewSet``.

``ProjectEntityPermission`` allows SAFE_METHODS for any active project member
but restricts writes to role ADMIN (20) or MEMBER (15) — a project GUEST
(role 5) can see a checklist but cannot change it (spec FR-030). This is a
deliberate v1 decision, not an oversight: kept for consistency with every
other issue child object (links, attachments), revisit with usage data.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, IssueChecklistItem, Project, ProjectMember, User, WorkspaceMember

CHECKLIST_LIST_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/checklist-items/"
CHECKLIST_DETAIL_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/checklist-items/{pk}/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Scoped Project", identifier="SP", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def issue(db, workspace, project, create_user):
    issue = Issue(name="Test issue", project=project, workspace=workspace)
    issue.save(created_by_id=create_user.id)
    return issue


@pytest.fixture
def checklist_item(db, workspace, project, issue, create_user):
    item = IssueChecklistItem(name="Existing item", issue=issue, project=project, workspace=workspace)
    item.save(created_by_id=create_user.id)
    return item


@pytest.fixture
def guest(db, workspace, project):
    """An active project GUEST (role=5) with guest_view_all_features=True,
    so read-visibility is not the thing under test here — write restriction is.
    """
    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"guest-{unique_id}@plane.so",
        username=f"guest_{unique_id}",
        first_name="Guest",
        last_name="User",
    )
    user.set_password("test-password")
    user.save()
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=5)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=5)
    project.guest_view_all_features = True
    project.save()
    return user


@pytest.fixture
def guest_client(guest):
    client = APIClient()
    client.force_authenticate(user=guest)
    return client


@pytest.mark.contract
class TestChecklistGuestWriteDenied:
    """A project guest can read a checklist but cannot change it."""

    @pytest.mark.django_db
    def test_guest_can_list(self, guest_client, workspace, project, issue, checklist_item):
        url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)
        response = guest_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        # response.data holds pre-render values (UUID objects here, not JSON
        # strings), so compare both sides as str for a representation-agnostic check.
        assert str(checklist_item.id) in {str(row["id"]) for row in response.data}

    @pytest.mark.django_db
    def test_guest_cannot_create(self, guest_client, workspace, project, issue):
        url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)
        response = guest_client.post(url, {"name": "Guest's item"}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not IssueChecklistItem.objects.filter(name="Guest's item").exists()

    @pytest.mark.django_db
    def test_guest_cannot_update(self, guest_client, workspace, project, issue, checklist_item):
        url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=checklist_item.id
        )
        response = guest_client.patch(url, {"status": "done"}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        checklist_item.refresh_from_db()
        assert checklist_item.status == "to_do"

    @pytest.mark.django_db
    def test_guest_cannot_delete(self, guest_client, workspace, project, issue, checklist_item):
        url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=checklist_item.id
        )
        response = guest_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        checklist_item.refresh_from_db()
        assert checklist_item.deleted_at is None
