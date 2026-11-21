# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests for the assignee distribution of cycles and modules.

The per-assignee aggregations join ``issue_assignees``. A soft-deleted assignment
(``deleted_at`` set) must not be counted: neither as an extra row for a user who
was unassigned, nor as a duplicate for a user who was unassigned and assigned
again. The totals must match the work items that are actually assigned.
"""

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    IssueAssignee,
    Module,
    ModuleIssue,
    Project,
    ProjectMember,
    State,
    User,
)


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Assignee Soft Delete Project",
        identifier="ASD",
        workspace=workspace,
        created_by=create_user,
        module_view=True,
        cycle_view=True,
    )
    ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=create_user,
        role=20,
        is_active=True,
    )
    return project


@pytest.fixture
def removed_user(db):
    """A user that was assigned to the work item and then unassigned."""
    return User.objects.create(
        email="removed-assignee@plane.so",
        username="removed_assignee",
        display_name="removed_assignee",
    )


@pytest.fixture
def work_item(db, project, create_user, removed_user):
    """One work item whose assignment history is:

    * ``create_user``: assigned, unassigned, assigned again (1 active + 1 soft-deleted row)
    * ``removed_user``: assigned, then unassigned (1 soft-deleted row only)
    """
    state = State.objects.create(name="Todo", group="unstarted", project=project, workspace=project.workspace)
    issue = Issue.objects.create(
        name="Assignee Soft Delete Issue",
        project=project,
        workspace=project.workspace,
        state=state,
        created_by=create_user,
    )

    def assign(user, deleted=False):
        row = IssueAssignee.objects.create(
            issue=issue,
            assignee=user,
            project=project,
            workspace=project.workspace,
        )
        if deleted:
            # Soft-delete through the queryset to keep the test independent from background tasks.
            IssueAssignee.all_objects.filter(pk=row.pk).update(deleted_at=timezone.now())

    assign(create_user, deleted=True)
    assign(create_user)
    assign(removed_user, deleted=True)
    return issue


@pytest.fixture
def cycle(db, project, work_item, create_user):
    cycle = Cycle.objects.create(
        name="Assignee Soft Delete Cycle",
        project=project,
        workspace=project.workspace,
        owned_by=create_user,
        start_date=timezone.now(),
        end_date=timezone.now() + timezone.timedelta(days=7),
    )
    CycleIssue.objects.create(issue=work_item, cycle=cycle, project=project, workspace=project.workspace)
    return cycle


@pytest.fixture
def archived_cycle(db, project, work_item, create_user):
    cycle = Cycle.objects.create(
        name="Archived Assignee Soft Delete Cycle",
        project=project,
        workspace=project.workspace,
        owned_by=create_user,
        archived_at=timezone.now(),
    )
    CycleIssue.objects.create(issue=work_item, cycle=cycle, project=project, workspace=project.workspace)
    return cycle


@pytest.fixture
def module(db, project, work_item):
    module = Module.objects.create(name="Assignee Soft Delete Module", project=project, workspace=project.workspace)
    ModuleIssue.objects.create(issue=work_item, module=module, project=project, workspace=project.workspace)
    return module


def _by_assignee(assignees):
    return {str(a["assignee_id"]): a for a in assignees if a["assignee_id"] is not None}


def _assert_only_active_assignment(assignees, create_user, removed_user):
    rows = _by_assignee(assignees)
    # The user that is assigned again counts the work item once, not once per assignment row.
    active = rows[str(create_user.id)]
    assert active["total_issues"] == 1
    assert active["completed_issues"] == 0
    assert active["pending_issues"] == 1
    # The unassigned user must not be credited with the work item.
    removed = rows.get(str(removed_user.id))
    if removed is not None:
        assert removed["total_issues"] == 0
        assert removed["completed_issues"] == 0
        assert removed["pending_issues"] == 0


@pytest.mark.contract
class TestAssigneeDistributionIgnoresSoftDeleted:
    @pytest.mark.django_db
    def test_cycle_analytics(self, session_client, workspace, project, cycle, create_user, removed_user):
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/cycles/{cycle.id}/analytics/?type=issues"
        )
        assert response.status_code == status.HTTP_200_OK
        _assert_only_active_assignment(response.data["assignees"], create_user, removed_user)

    @pytest.mark.django_db
    def test_archived_cycle_retrieve(
        self, session_client, workspace, project, archived_cycle, create_user, removed_user
    ):
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/archived-cycles/{archived_cycle.id}/"
        )
        assert response.status_code == status.HTTP_200_OK
        _assert_only_active_assignment(response.data["distribution"]["assignees"], create_user, removed_user)

    @pytest.mark.django_db
    def test_module_retrieve(self, session_client, workspace, project, module, create_user, removed_user):
        response = session_client.get(f"/api/workspaces/{workspace.slug}/projects/{project.id}/modules/{module.id}/")
        assert response.status_code == status.HTTP_200_OK
        _assert_only_active_assignment(response.data["distribution"]["assignees"], create_user, removed_user)
