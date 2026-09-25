# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression test for the cycle/module work-item completion chart.

``ProjectAdvanceAnalyticsChartEndpoint.work_item_completion_chart`` reassigns
its queryset to a bare ``CycleIssue``/``ModuleIssue`` id list
(``values_list("issue_id", flat=True)``) when a ``cycle_id``/``module_id`` is
given, then buckets the chart with ``queryset.values("created_at__date")``.
Because the queryset is still shaped like ``CycleIssue``, not ``Issue``, that
groups by *when the issue was added to the cycle* instead of *when the issue
was created* -- so the "work items created" line on a cycle/module chart is
keyed to the wrong date entirely.

See: https://github.com/makeplane/plane/issues/9177
"""

from datetime import timedelta

import pytest
from django.utils import timezone

from plane.app.views.analytic.project_analytics import ProjectAdvanceAnalyticsChartEndpoint
from plane.db.models import Cycle, CycleIssue, Issue, Project, ProjectMember, State
from plane.utils.date_utils import get_analytics_filters


@pytest.mark.unit
@pytest.mark.django_db
class TestCycleWorkItemCompletionChartDateBucketing:
    def _build_view(self, workspace, user):
        view = ProjectAdvanceAnalyticsChartEndpoint()
        view.filters = get_analytics_filters(slug=workspace.slug, user=user, type="chart")
        return view

    def test_cycle_chart_buckets_by_issue_created_at_not_cycle_issue_created_at(self, workspace, create_user):
        project = Project.objects.create(name="Project 1", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, is_active=True)
        state = State.objects.create(project=project, name="Done", color="#000000", group="completed")

        today = timezone.now().date()
        issue_created_on = today - timedelta(days=10)
        added_to_cycle_on = today - timedelta(days=2)

        cycle = Cycle.objects.create(
            project=project,
            name="Cycle 1",
            owned_by=create_user,
            start_date=timezone.now() - timedelta(days=15),
            end_date=timezone.now(),
        )
        issue = Issue.objects.create(project=project, name="Issue 1", state=state)
        # created_at is auto_now_add — bypass save() to pin it to a controlled date.
        Issue.objects.filter(pk=issue.pk).update(
            created_at=timezone.make_aware(timezone.datetime.combine(issue_created_on, timezone.datetime.min.time()))
        )

        cycle_issue = CycleIssue.objects.create(project=project, cycle=cycle, issue=issue)
        CycleIssue.objects.filter(pk=cycle_issue.pk).update(
            created_at=timezone.make_aware(
                timezone.datetime.combine(added_to_cycle_on, timezone.datetime.min.time())
            )
        )

        view = self._build_view(workspace, create_user)
        result = view.work_item_completion_chart(project_id=project.id, cycle_id=cycle.id)

        by_key = {entry["key"]: entry for entry in result["data"]}
        issue_created_key = issue_created_on.strftime("%Y-%m-%d")
        added_to_cycle_key = added_to_cycle_on.strftime("%Y-%m-%d")

        assert by_key[issue_created_key]["created_issues"] == 1, (
            "expected the cycle chart to bucket the work item under the date it was "
            f"actually created ({issue_created_key}), but got "
            f"{by_key[issue_created_key]['created_issues']} -- it is bucketing by "
            "CycleIssue.created_at (when the issue was added to the cycle) instead "
            "of Issue.created_at"
        )
        assert by_key[added_to_cycle_key]["created_issues"] == 0, (
            f"the work item leaked into the {added_to_cycle_key} bucket (the date it "
            "was added to the cycle) instead of staying under its own creation date"
        )
