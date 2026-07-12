# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest

from plane.bgtasks.issue_activities_task import track_estimate_points
from plane.db.models import Estimate, EstimatePoint, Issue, Project, ProjectMember


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Estimate Activity Project",
        identifier=f"EA{uuid4().hex[:3].upper()}",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def estimate_point(db, project):
    estimate = Estimate.objects.create(name="Points", type="points", project=project)
    return EstimatePoint.objects.create(
        estimate=estimate, key=1, value="3", project=project, workspace=project.workspace
    )


def run_tracker(requested, current, issue, actor):
    activities = []
    track_estimate_points(
        requested_data=requested,
        current_instance=current,
        issue_id=issue.id,
        project_id=issue.project_id,
        workspace_id=issue.workspace_id,
        actor_id=actor.id,
        issue_activities=activities,
        epoch=1,
    )
    return activities


@pytest.mark.contract
class TestTrackEstimatePointsRemoval:
    """Removing an estimate (requested estimate_point=None) used to raise
    AttributeError on `new_estimate.estimate.type`, losing every activity of
    the same PATCH (the whole task aborts before bulk_create)."""

    @pytest.mark.django_db
    def test_removal_records_a_removed_activity(self, workspace, project, estimate_point, create_user):
        issue = Issue.objects.create(name="I", project=project, workspace=workspace)

        activities = run_tracker(
            requested={"estimate_point": None},
            current={"estimate_point": str(estimate_point.id)},
            issue=issue,
            actor=create_user,
        )

        assert len(activities) == 1
        activity = activities[0]
        assert activity.verb == "removed"
        assert activity.field == "estimate_points"
        assert activity.old_value == "3"
        assert activity.new_value is None

    @pytest.mark.django_db
    def test_set_records_an_updated_activity(self, workspace, project, estimate_point, create_user):
        issue = Issue.objects.create(name="I", project=project, workspace=workspace)

        activities = run_tracker(
            requested={"estimate_point": str(estimate_point.id)},
            current={"estimate_point": None},
            issue=issue,
            actor=create_user,
        )

        assert len(activities) == 1
        activity = activities[0]
        assert activity.verb == "updated"
        assert activity.field == "estimate_points"
        assert activity.new_value == "3"

    @pytest.mark.django_db
    def test_unresolvable_points_do_not_crash_nor_record(self, workspace, project, create_user):
        """Both sides pointing at rows that no longer resolve — skip quietly."""
        issue = Issue.objects.create(name="I", project=project, workspace=workspace)

        activities = run_tracker(
            requested={"estimate_point": str(uuid4())},
            current={"estimate_point": None},
            issue=issue,
            actor=create_user,
        )

        assert activities == []
