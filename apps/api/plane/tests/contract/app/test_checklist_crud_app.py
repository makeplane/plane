# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the ``IssueChecklistItemViewSet`` CRUD round-trip and
name validation (spec FR-001, FR-003, FR-004, FR-005, FR-006)."""

import pytest
from rest_framework import status

from plane.db.models import Issue, IssueChecklistItem, Project, ProjectMember

CHECKLIST_LIST_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/checklist-items/"
CHECKLIST_DETAIL_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/checklist-items/{pk}/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Project", identifier="TP", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def issue(db, workspace, project, create_user):
    issue = Issue(name="Test issue", project=project, workspace=workspace)
    issue.save(created_by_id=create_user.id)
    return issue


@pytest.mark.contract
class TestChecklistCrud:
    @pytest.mark.django_db
    def test_create_rename_delete_round_trip(self, session_client, workspace, project, issue):
        list_url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)

        create_response = session_client.post(list_url, {"name": "Write tests"}, format="json")
        assert create_response.status_code == status.HTTP_201_CREATED, (
            f"Got {create_response.status_code}: {getattr(create_response, 'data', None)!r}"
        )
        assert create_response.data["name"] == "Write tests"
        assert create_response.data["status"] == "to_do"
        item_id = create_response.data["id"]

        list_response = session_client.get(list_url)
        assert list_response.status_code == status.HTTP_200_OK
        # response.data holds pre-render values (UUID objects here, not JSON
        # strings), so compare both sides as str for a representation-agnostic check.
        assert str(item_id) in {str(row["id"]) for row in list_response.data}

        detail_url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=item_id
        )
        rename_response = session_client.patch(detail_url, {"name": "Write and run tests"}, format="json")
        assert rename_response.status_code == status.HTTP_200_OK
        assert rename_response.data["name"] == "Write and run tests"

        delete_response = session_client.delete(detail_url)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        # `objects` excludes soft-deleted rows, so use `all_objects` to confirm
        # the row still exists with `deleted_at` set rather than being purged.
        item = IssueChecklistItem.all_objects.get(id=item_id)
        assert item.deleted_at is not None, "Item was not soft-deleted"
        # excluded from the default manager, which the endpoint reads through
        list_response = session_client.get(list_url)
        assert str(item_id) not in {str(row["id"]) for row in list_response.data}

    @pytest.mark.django_db
    def test_blank_name_rejected(self, session_client, workspace, project, issue):
        url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)
        response = session_client.post(url, {"name": ""}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not IssueChecklistItem.objects.filter(issue=issue).exists()

    @pytest.mark.django_db
    def test_whitespace_only_name_rejected(self, session_client, workspace, project, issue):
        url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)
        response = session_client.post(url, {"name": "   "}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not IssueChecklistItem.objects.filter(issue=issue).exists()

    @pytest.mark.django_db
    def test_name_over_255_chars_rejected(self, session_client, workspace, project, issue):
        url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)
        response = session_client.post(url, {"name": "x" * 256}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not IssueChecklistItem.objects.filter(issue=issue).exists()

    @pytest.mark.django_db
    def test_name_is_stripped(self, session_client, workspace, project, issue):
        url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)
        response = session_client.post(url, {"name": "  Ship it  "}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Ship it"
