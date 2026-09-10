# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for checklist item activity logging (spec FR-024 - FR-027).

``IssueChecklistItemViewSet`` fires ``issue_activity.delay(...)`` without a
``notification`` kwarg (defaulting to ``False``), unlike ``IssueLinkViewSet``,
which passes ``notification=True`` — copying that would email every
subscriber on every checklist status change. ``issue_activity.delay`` is
patched here with a synchronous ``side_effect`` so the real activity-handler
logic in ``bgtasks/issue_activities_task.py`` runs in-process (Celery tasks
are directly callable without a broker), letting these tests assert on the
actual ``IssueActivity`` rows it writes rather than just the call arguments.
"""

import pytest
from rest_framework import status

from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import Issue, IssueActivity, IssueChecklistItem, Project, ProjectMember

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


@pytest.fixture
def run_activity_synchronously(mocker):
    """Make issue_activity.delay(...) run the task body in-process instead of
    queuing it, so tests can assert on the IssueActivity rows it produces."""
    return mocker.patch(
        "plane.app.views.issue.checklist.issue_activity.delay",
        side_effect=lambda **kwargs: issue_activity(**kwargs),
    )


@pytest.mark.contract
class TestChecklistActivity:
    @pytest.mark.django_db
    def test_create_writes_activity(
        self, session_client, run_activity_synchronously, workspace, project, issue
    ):
        url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)
        response = session_client.post(url, {"name": "Write tests"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED

        activities = IssueActivity.objects.filter(issue_id=issue.id, field="checklist_item", verb="created")
        assert activities.count() == 1, f"Expected one create activity row, found {activities.count()}"
        assert activities.first().new_value == "Write tests"

    @pytest.mark.django_db
    def test_rename_writes_activity(
        self, session_client, run_activity_synchronously, workspace, project, issue, checklist_item
    ):
        url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=checklist_item.id
        )
        response = session_client.patch(url, {"name": "Ship it today"}, format="json")
        assert response.status_code == status.HTTP_200_OK

        activities = IssueActivity.objects.filter(
            issue_id=issue.id, field="checklist_item", verb="updated"
        )
        assert activities.count() == 1
        assert activities.first().old_value == "Ship it"
        assert activities.first().new_value == "Ship it today"

    @pytest.mark.django_db
    def test_status_change_writes_activity(
        self, session_client, run_activity_synchronously, workspace, project, issue, checklist_item
    ):
        url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=checklist_item.id
        )
        response = session_client.patch(url, {"status": "done"}, format="json")
        assert response.status_code == status.HTTP_200_OK

        activities = IssueActivity.objects.filter(issue_id=issue.id, field="checklist_item_status")
        assert activities.count() == 1, f"Expected one status activity row, found {activities.count()}"
        assert activities.first().old_value == "to_do"
        assert activities.first().new_value == "done"

    @pytest.mark.django_db
    def test_delete_writes_activity(
        self, session_client, run_activity_synchronously, workspace, project, issue, checklist_item
    ):
        url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=checklist_item.id
        )
        response = session_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

        activities = IssueActivity.objects.filter(issue_id=issue.id, field="checklist_item", verb="deleted")
        assert activities.count() == 1
        assert activities.first().old_value == "Ship it"

    @pytest.mark.django_db
    def test_reorder_writes_no_activity(
        self, session_client, run_activity_synchronously, workspace, project, issue, checklist_item
    ):
        """A drag-reorder PATCH carries only sort_order; it must not appear in
        the activity feed (spec FR-025) — a drag would otherwise flood it."""
        url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=checklist_item.id
        )
        response = session_client.patch(url, {"sort_order": 999.5}, format="json")
        assert response.status_code == status.HTTP_200_OK

        activities = IssueActivity.objects.filter(issue_id=issue.id)
        assert activities.count() == 0, (
            f"Reorder must write no activity, found: {list(activities.values('field', 'verb'))!r}"
        )

    @pytest.mark.django_db
    def test_no_op_status_write_no_activity(
        self, session_client, run_activity_synchronously, workspace, project, issue, checklist_item
    ):
        """PATCHing a status the item already holds must be a silent no-op
        (spec FR-026), matching the idempotent-retry rationale for having no
        separate toggle endpoint."""
        url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=checklist_item.id
        )
        response = session_client.patch(url, {"status": "to_do"}, format="json")
        assert response.status_code == status.HTTP_200_OK

        activities = IssueActivity.objects.filter(issue_id=issue.id)
        assert activities.count() == 0

    @pytest.mark.django_db
    def test_no_notification_fan_out(self, mocker, session_client, workspace, project, issue, checklist_item):
        """issue_activity defaults notification=False; IssueChecklistItemViewSet
        must never override it — a status change must not email subscribers."""
        mock_notifications = mocker.patch("plane.bgtasks.issue_activities_task.notifications.delay")
        mocker.patch(
            "plane.app.views.issue.checklist.issue_activity.delay",
            side_effect=lambda **kwargs: issue_activity(**kwargs),
        )

        url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=checklist_item.id
        )
        response = session_client.patch(url, {"status": "done"}, format="json")
        assert response.status_code == status.HTTP_200_OK

        mock_notifications.assert_not_called()
