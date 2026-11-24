# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Moving work items into a cycle records a cycle activity on each one.

The cycle activity task got its records in three shapes: a transfer sends
``created_cycle_issues`` as a plain list, adding work items sends it as a JSON
string, and converting a draft sends ``updated_cycle_issues`` as ``None``. The
task only handled the string and a list for the updated records, so a transfer
and a draft conversion raised ``TypeError`` inside the task and no activity was
saved.
"""

from datetime import timedelta
from unittest import mock

import pytest
from django.utils import timezone
from rest_framework import status

from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    Cycle,
    CycleIssue,
    DraftIssue,
    Issue,
    IssueActivity,
    Project,
    ProjectMember,
    State,
)


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Transfer", identifier="TRF", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def cycles(db, workspace, project, create_user):
    now = timezone.now()
    old_cycle = Cycle.objects.create(
        name="Sprint 1",
        project=project,
        workspace=workspace,
        owned_by=create_user,
        start_date=now - timedelta(days=14),
        end_date=now - timedelta(days=1),
    )
    new_cycle = Cycle.objects.create(
        name="Sprint 2",
        project=project,
        workspace=workspace,
        owned_by=create_user,
        start_date=now,
        end_date=now + timedelta(days=14),
    )
    return old_cycle, new_cycle


@pytest.fixture
def open_issue(db, workspace, project, cycles):
    started = State.objects.create(name="In Progress", group="started", project=project, workspace=workspace)
    issue = Issue.objects.create(name="Unfinished", project=project, workspace=workspace, state=started)
    CycleIssue.objects.create(issue=issue, cycle=cycles[0], project=project, workspace=workspace)
    return issue


@pytest.mark.contract
@pytest.mark.django_db
def test_transfer_records_a_cycle_activity(session_client, workspace, project, cycles, open_issue):
    old_cycle, new_cycle = cycles
    url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/cycles/{old_cycle.id}/transfer-issues/"

    with mock.patch("plane.utils.cycle_transfer_issues.issue_activity") as activity:
        response = session_client.post(url, {"new_cycle_id": str(new_cycle.id)}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert CycleIssue.objects.get(issue=open_issue).cycle_id == new_cycle.id

    # Run the queued task with the arguments the transfer sent it
    with mock.patch("plane.bgtasks.issue_activities_task.notifications"):
        issue_activity(**activity.delay.call_args.kwargs)

    recorded = IssueActivity.objects.get(issue=open_issue, field="cycles")
    assert (recorded.old_value, recorded.new_value) == ("Sprint 1", "Sprint 2")
    assert (recorded.old_identifier, recorded.new_identifier) == (old_cycle.id, new_cycle.id)


@pytest.mark.contract
@pytest.mark.django_db
def test_adding_to_a_cycle_still_records_a_cycle_activity(session_client, workspace, project, cycles):
    """Adding work items sends the created records as a JSON string; that keeps working."""
    new_cycle = cycles[1]
    issue = Issue.objects.create(name="New work", project=project, workspace=workspace)
    url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/cycles/{new_cycle.id}/cycle-issues/"

    with mock.patch("plane.app.views.cycle.issue.issue_activity") as activity:
        response = session_client.post(url, {"issues": [str(issue.id)]}, format="json")

    assert response.status_code == status.HTTP_201_CREATED

    with mock.patch("plane.bgtasks.issue_activities_task.notifications"):
        issue_activity(**activity.delay.call_args.kwargs)

    recorded = IssueActivity.objects.get(issue=issue, field="cycles")
    assert (recorded.verb, recorded.new_value) == ("created", "Sprint 2")


@pytest.mark.contract
@pytest.mark.django_db
def test_converting_a_draft_into_a_cycle_records_a_cycle_activity(
    session_client, workspace, project, cycles, create_user
):
    new_cycle = cycles[1]
    draft = DraftIssue(name="Drafted", workspace=workspace, project=project)
    draft.save(created_by_id=create_user.id)
    url = f"/api/workspaces/{workspace.slug}/draft-to-issue/{draft.id}/"

    with (
        mock.patch("plane.app.views.workspace.draft.issue_activity") as activity,
        mock.patch("plane.app.views.workspace.draft.base_host", return_value="http://testserver"),
        mock.patch("plane.db.mixins.soft_delete_related_objects"),
    ):
        response = session_client.post(url, {"name": "Drafted", "cycle_id": str(new_cycle.id)}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    (cycle_call,) = [c for c in activity.delay.call_args_list if c.kwargs["type"] == "cycle.activity.created"]

    with mock.patch("plane.bgtasks.issue_activities_task.notifications"):
        issue_activity(**cycle_call.kwargs)

    recorded = IssueActivity.objects.get(issue_id=response.data["id"], field="cycles")
    assert (recorded.verb, recorded.new_value) == ("created", "Sprint 2")
