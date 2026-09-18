# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests for the transfer_cycle_issues atomicity bug (#9599).

transfer_cycle_issues used to persist the source cycle's progress_snapshot
and then, in a second, unrelated DB write, move the CycleIssue rows to the
destination cycle. If the process crashed or the DB errored between the two
writes, the source cycle was left marked with a snapshot while its issues
were never actually transferred - a data-integrity bug with no recovery
path. Both writes must happen inside a single atomic transaction so a
failure during the issue move rolls back the snapshot write as well.
"""

from unittest import mock

import pytest
from django.http import HttpRequest

from plane.db.models import Cycle, CycleIssue, Issue, Project, ProjectMember, State
from plane.utils.cycle_transfer_issues import transfer_cycle_issues


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Project",
        identifier="TCT",
        workspace=workspace,
        created_by=create_user,
        cycle_view=True,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def backlog_state(db, project, create_user):
    return State.objects.create(
        name="Backlog",
        project=project,
        workspace=project.workspace,
        group="backlog",
        default=True,
    )


@pytest.fixture
def source_cycle(db, project, create_user):
    return Cycle.objects.create(
        name="Source Cycle",
        project=project,
        workspace=project.workspace,
        owned_by=create_user,
    )


@pytest.fixture
def destination_cycle(db, project, create_user):
    return Cycle.objects.create(
        name="Destination Cycle",
        project=project,
        workspace=project.workspace,
        owned_by=create_user,
    )


@pytest.fixture
def incomplete_cycle_issue(db, project, create_user, backlog_state, source_cycle):
    """A single incomplete issue assigned to the source cycle."""
    issue = Issue.objects.create(
        name="Incomplete Issue",
        workspace=project.workspace,
        project=project,
        state=backlog_state,
        created_by=create_user,
    )
    return CycleIssue.objects.create(
        issue=issue,
        cycle=source_cycle,
        project=project,
        workspace=project.workspace,
        created_by=create_user,
    )


@pytest.fixture
def dummy_request():
    request = HttpRequest()
    request.META["HTTP_HOST"] = "app.plane.so"
    return request


@pytest.mark.unit
@pytest.mark.django_db
class TestTransferCycleIssuesAtomicity:
    def test_bulk_update_failure_rolls_back_snapshot(
        self,
        project,
        source_cycle,
        destination_cycle,
        incomplete_cycle_issue,
        create_user,
        dummy_request,
    ):
        """If the CycleIssue move fails, the earlier progress_snapshot write
        must also be rolled back - the two must be all-or-nothing."""
        assert source_cycle.progress_snapshot == {}

        with mock.patch(
            "plane.utils.cycle_transfer_issues.CycleIssue.objects.bulk_update",
            side_effect=RuntimeError("simulated crash mid-transfer"),
        ):
            with pytest.raises(RuntimeError):
                transfer_cycle_issues(
                    slug=project.workspace.slug,
                    project_id=str(project.id),
                    cycle_id=str(source_cycle.id),
                    new_cycle_id=str(destination_cycle.id),
                    request=dummy_request,
                    user_id=str(create_user.id),
                )

        source_cycle.refresh_from_db()
        incomplete_cycle_issue.refresh_from_db()

        # The snapshot write must have been rolled back alongside the failed
        # issue move - not left committed on its own.
        assert source_cycle.progress_snapshot == {}
        # The issue must still belong to the source cycle.
        assert incomplete_cycle_issue.cycle_id == source_cycle.id

    def test_successful_transfer_moves_issues_and_saves_snapshot(
        self,
        project,
        source_cycle,
        destination_cycle,
        incomplete_cycle_issue,
        create_user,
        dummy_request,
        settings,
    ):
        settings.WEB_URL = "http://app.plane.so"

        with mock.patch("plane.utils.cycle_transfer_issues.issue_activity.delay"):
            result = transfer_cycle_issues(
                slug=project.workspace.slug,
                project_id=str(project.id),
                cycle_id=str(source_cycle.id),
                new_cycle_id=str(destination_cycle.id),
                request=dummy_request,
                user_id=str(create_user.id),
            )

        assert result == {"success": True}

        source_cycle.refresh_from_db()
        incomplete_cycle_issue.refresh_from_db()

        assert source_cycle.progress_snapshot != {}
        assert incomplete_cycle_issue.cycle_id == destination_cycle.id
