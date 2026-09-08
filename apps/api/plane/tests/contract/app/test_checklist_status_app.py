# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``IssueChecklistItem`` status transitions.

The single most important assertion in this feature: entering ``done`` sets
``completed_at``/``completed_by``, but entering ``skipped`` sets NEITHER —
skipping is not completing (spec FR-017, FR-018, FR-019). This is the
assumption most likely to be miscoded by anyone carrying over boolean-era
"any terminal state means completed" habits.
"""

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


@pytest.fixture
def checklist_item(db, workspace, project, issue, create_user):
    item = IssueChecklistItem(name="Ship it", issue=issue, project=project, workspace=workspace)
    item.save(created_by_id=create_user.id)
    return item


def _detail_url(workspace, project, issue, item):
    return CHECKLIST_DETAIL_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=item.id)


@pytest.mark.contract
class TestChecklistStatusTransitions:
    @pytest.mark.django_db
    def test_new_item_defaults_to_to_do(self, session_client, workspace, project, issue):
        url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)
        response = session_client.post(url, {"name": "Fresh item"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["status"] == "to_do"
        assert response.data["completed_at"] is None
        assert response.data["completed_by"] is None

    @pytest.mark.django_db
    def test_done_sets_completed_at_and_completed_by(
        self, session_client, workspace, project, issue, checklist_item, create_user
    ):
        url = _detail_url(workspace, project, issue, checklist_item)
        response = session_client.patch(url, {"status": "done"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "done"
        assert response.data["completed_at"] is not None, "completed_at was not set on entering done"
        assert response.data["completed_by"] == str(create_user.id), "completed_by was not set on entering done"

    @pytest.mark.django_db
    def test_skipped_sets_neither_completed_field(self, session_client, workspace, project, issue, checklist_item):
        """The critical case: skipped is a terminal state but NOT completion."""
        url = _detail_url(workspace, project, issue, checklist_item)
        response = session_client.patch(url, {"status": "skipped"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "skipped"
        assert response.data["completed_at"] is None, (
            f"skipped incorrectly set completed_at: {response.data!r}"
        )
        assert response.data["completed_by"] is None, (
            f"skipped incorrectly set completed_by: {response.data!r}"
        )

    @pytest.mark.django_db
    def test_leaving_done_clears_completed_fields(self, session_client, workspace, project, issue, checklist_item):
        url = _detail_url(workspace, project, issue, checklist_item)
        response = session_client.patch(url, {"status": "done"}, format="json")
        assert response.data["completed_at"] is not None

        response = session_client.patch(url, {"status": "to_do"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "to_do"
        assert response.data["completed_at"] is None, "completed_at was not cleared leaving done"
        assert response.data["completed_by"] is None, "completed_by was not cleared leaving done"

    @pytest.mark.django_db
    def test_in_progress_sets_neither_completed_field(
        self, session_client, workspace, project, issue, checklist_item
    ):
        url = _detail_url(workspace, project, issue, checklist_item)
        response = session_client.patch(url, {"status": "in_progress"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["completed_at"] is None
        assert response.data["completed_by"] is None

    @pytest.mark.django_db
    def test_invalid_status_value_rejected(self, session_client, workspace, project, issue, checklist_item):
        url = _detail_url(workspace, project, issue, checklist_item)
        response = session_client.patch(url, {"status": "not_a_real_status"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        checklist_item.refresh_from_db()
        assert checklist_item.status == "to_do", "Invalid status value was persisted"

    @pytest.mark.django_db
    def test_client_supplied_completed_by_is_ignored(
        self, session_client, workspace, project, issue, checklist_item, create_user
    ):
        """completed_by is read-only — a client cannot claim someone else finished the item."""
        url = _detail_url(workspace, project, issue, checklist_item)
        response = session_client.patch(
            url,
            {"status": "done", "completed_by": "00000000-0000-0000-0000-000000000000"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["completed_by"] == str(create_user.id), (
            "Client-supplied completed_by was honoured instead of the actual actor"
        )
