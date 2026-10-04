# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Lapsed intake snoozes return to PENDING; snoozes are day-granular in the project timezone."""

from datetime import datetime, timedelta, timezone as dt_timezone

import pytest
from django.utils import timezone

from plane.app.serializers import IntakeIssueSerializer
from plane.bgtasks.issue_automation_task import unsnooze_expired_intake_issues
from plane.db.models import Intake, IntakeIssue, Issue, Project, State
from plane.db.models.intake import IntakeIssueStatus

pytestmark = pytest.mark.unit


def _utc(*args):
    return datetime(*args, tzinfo=dt_timezone.utc)


@pytest.fixture
def make_row(db, workspace, create_user):
    project = Project.objects.create(
        name="Unsnooze", identifier="UNS", workspace=workspace, created_by=create_user, timezone="Asia/Kolkata"
    )
    state = State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    intake = Intake.objects.create(name="Intake", project=project, workspace=workspace)

    def make(status=IntakeIssueStatus.PENDING, snoozed_till=None):
        issue = Issue.objects.create(name="I", project=project, workspace=workspace, state=state)
        return IntakeIssue.objects.create(
            intake=intake, issue=issue, project=project, workspace=workspace, status=status, snoozed_till=snoozed_till
        )

    return make


def _snooze(intake_issue, value):
    serializer = IntakeIssueSerializer(
        intake_issue, data={"status": IntakeIssueStatus.SNOOZED, "snoozed_till": value}, partial=True
    )
    assert serializer.is_valid(), serializer.errors
    return serializer.save().snoozed_till


def test_only_lapsed_snoozes_return_to_pending(make_row):
    now = timezone.now()
    lapsed = make_row(IntakeIssueStatus.SNOOZED, now - timedelta(days=1))
    active = make_row(IntakeIssueStatus.SNOOZED, now + timedelta(days=2))
    # A decided item keeping a stale snoozed_till must not be reopened.
    accepted = make_row(IntakeIssueStatus.ACCEPTED, now - timedelta(days=1))

    assert unsnooze_expired_intake_issues() == 1

    for obj in (lapsed, active, accepted):
        obj.refresh_from_db()
    assert (lapsed.status, lapsed.snoozed_till) == (IntakeIssueStatus.PENDING, None)
    assert active.status == IntakeIssueStatus.SNOOZED
    assert accepted.status == IntakeIssueStatus.ACCEPTED


def test_date_only_snooze_wakes_at_project_midnight(make_row):
    row = make_row()
    # A picked day is midnight in the project's timezone (IST = UTC+05:30).
    assert _snooze(row, "2026-10-05") == _utc(2026, 10, 4, 18, 30)
    # A full datetime is floored to its day's midnight in the project timezone
    # (09:00Z = 14:30 IST on Oct 5 -> Oct 5 00:00 IST).
    assert _snooze(row, "2026-10-05T09:00:00Z") == _utc(2026, 10, 4, 18, 30)


def test_direct_model_write_is_floored_to_project_midnight(make_row):
    row = make_row()
    row.status = IntakeIssueStatus.SNOOZED
    row.snoozed_till = _utc(2026, 10, 5, 20, 0)  # 01:30 IST on Oct 6
    row.save()
    row.refresh_from_db()
    assert row.snoozed_till == _utc(2026, 10, 5, 18, 30)  # Oct 6 00:00 IST


def test_project_timezone_change_retimes_snoozes(make_row):
    snoozed = make_row()
    _snooze(snoozed, "2026-10-05")

    project = snoozed.project
    project.timezone = "America/New_York"
    project.save()

    snoozed.refresh_from_db()
    # Same day, now midnight in New York (EDT = UTC-04:00).
    assert snoozed.snoozed_till == _utc(2026, 10, 5, 4, 0)
