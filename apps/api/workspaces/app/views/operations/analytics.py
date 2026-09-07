# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Engineering analytics.

Every metric here is generated from data the team already produces -- issue
activity, cycles, deployments, work logs -- rather than from anything anybody
has to fill in. That is the constraint PROJECT.md sets, and it is what stops
these numbers rotting the moment people stop humouring them.

Where a metric has more than one defensible definition, the one used is stated
in the docstring and returned in the payload's ``definitions`` block, so a
number on a screen can always be traced back to what it counts.
"""

# Python imports
from datetime import timedelta

# Django imports
from django.db.models import Count, Q, Subquery, Sum

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from workspaces.app.permissions import ROLE, allow_permission
from workspaces.app.views.base import BaseAPIView
from workspaces.db.models import (
    Cycle,
    Deployment,
    DeploymentStatus,
    Issue,
    IssueAssignee,
    WorkLog,
    Workspace,
    WorkspaceMember,
)
from workspaces.utils.engineering_ops import (
    avatar_url,
    average,
    days_between,
    get_operations_config,
    resolve_period,
)

from .helpers import (
    names_for,
    scoped_issues,
    scoped_project_ids,
    state_ids_by_bucket,
    state_transitions,
)

ANALYTICS_BUCKETS = ("in_progress", "ready_for_test", "qa", "ready_for_release", "deployed", "developer_owned")


def analytics_context(request, slug):
    workspace = Workspace.objects.get(slug=slug)
    config = get_operations_config(workspace.id)
    project_ids = scoped_project_ids(request, slug)
    start, end = resolve_period(request)
    return workspace, config, project_ids, state_ids_by_bucket(project_ids, config, ANALYTICS_BUCKETS), start, end


def weekly_buckets(start, end):
    """Week-start dates covering the period, Monday-aligned."""
    cursor = start - timedelta(days=start.weekday())
    weeks = []
    while cursor <= end:
        weeks.append(cursor)
        cursor += timedelta(days=7)
    return weeks


class DeliveryAnalyticsEndpoint(BaseAPIView):
    """Lead time, cycle time, throughput, velocity and deployment frequency."""

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        _workspace, config, project_ids, buckets, start, end = analytics_context(request, slug)
        issues = scoped_issues(project_ids)

        completed = issues.filter(state__group="completed", completed_at__date__gte=start, completed_at__date__lte=end)

        lead_times = [
            days_between(row["created_at"], row["completed_at"])
            for row in completed.values("created_at", "completed_at")
        ]

        first_dev_touch = self.first_developer_touch(project_ids, config, completed)
        cycle_times = [
            days_between(first_dev_touch[row["id"]], row["completed_at"])
            for row in completed.values("id", "completed_at")
            if row["id"] in first_dev_touch
        ]

        deployments = Deployment.objects.filter(
            project_id__in=project_ids,
            status=DeploymentStatus.DEPLOYED,
            completed_at__date__gte=start,
            completed_at__date__lte=end,
        )
        weeks = max(1, ((end - start).days + 1) / 7)

        return Response(
            {
                "period": {"start_date": start.isoformat(), "end_date": end.isoformat()},
                "lead_time_days": average(lead_times),
                "cycle_time_days": average(cycle_times),
                "throughput": {
                    "total": completed.count(),
                    "per_week": round(completed.count() / weeks, 2),
                    "series": self.completed_series(completed, start, end),
                },
                "velocity": self.velocity(project_ids, config, start, end),
                "deployment_frequency": {
                    "total": deployments.count(),
                    "per_week": round(deployments.count() / weeks, 2),
                    "by_environment": {
                        row["environment"]: row["count"]
                        for row in deployments.values("environment").annotate(count=Count("id")).order_by()
                    },
                },
                "definitions": {
                    "lead_time_days": "Created to completed, for issues completed in the period.",
                    "cycle_time_days": (
                        "First entry into a developer-owned state to completed. Issues that never "
                        "passed through one are excluded rather than counted as zero."
                    ),
                    "throughput": "Issues reaching a completed state in the period.",
                    "velocity": "Completed issues per cycle, counting only velocity-bearing issue types.",
                },
            },
            status=status.HTTP_200_OK,
        )

    def first_developer_touch(self, project_ids, config, issues):
        """
        ``{issue_id: when it first entered a developer-owned state}``.

        Cycle time has to start when somebody picked the work up, not when it
        was filed -- an issue that sat in the backlog for a quarter did not
        take a quarter to build.

        Deliberately *not* bounded by the reporting period: an issue completed
        this week may have been picked up last month, and clipping the trail
        would silently shorten its cycle time. It is bounded by the issues we
        actually need instead, so the scan stays proportional to the answer.
        """
        dev_names = names_for(config, "developer_owned")
        touch = {}
        for activity in (
            state_transitions(project_ids)
            .filter(issue_id__in=Subquery(issues.values("id")))
            .order_by("created_at")
            .values("issue_id", "new_value", "created_at")
        ):
            if (activity["new_value"] or "").casefold() in dev_names:
                touch.setdefault(activity["issue_id"], activity["created_at"])
        return touch

    def completed_series(self, completed, start, end):
        per_day = {
            row["completed_at__date"]: row["count"]
            for row in completed.values("completed_at__date").annotate(count=Count("id", distinct=True)).order_by()
        }
        series = []
        cursor = start
        while cursor <= end:
            series.append({"date": cursor.isoformat(), "count": per_day.get(cursor, 0)})
            cursor += timedelta(days=1)
        return series

    def velocity(self, project_ids, config, start, end):
        velocity_types = config.get("velocity_issue_types") or []
        cycles = Cycle.objects.filter(
            project_id__in=project_ids, end_date__date__gte=start, end_date__date__lte=end
        ).order_by("end_date")

        rows = []
        for cycle in cycles:
            cycle_issues = Issue.issue_objects.filter(issue_cycle__cycle_id=cycle.id).distinct()
            counted = cycle_issues.filter(state__group="completed")
            if velocity_types:
                counted = counted.filter(type__name__in=velocity_types)
            rows.append(
                {
                    "cycle_id": str(cycle.id),
                    "name": cycle.name,
                    "project_id": str(cycle.project_id),
                    "end_date": cycle.end_date,
                    "completed": counted.count(),
                    "total": cycle_issues.count(),
                }
            )

        return {"cycles": rows, "average": average([row["completed"] for row in rows])}


class QualityAnalyticsEndpoint(BaseAPIView):
    """Bug rate, reopened rate, hotfixes and escaped bugs."""

    use_read_replica = True

    # Bugs filed within this many days of a production release, in the same
    # project, are treated as having escaped that release. A window rather than
    # a link, because nobody attributes bugs to releases by hand.
    ESCAPE_WINDOW_DAYS = 14

    # A cap on the OR-chain the window builds. A workspace releasing more than
    # this inside one reporting period is measuring deployment frequency, not
    # escaped bugs, and the newest releases are the ones that matter.
    MAX_RELEASES_CONSIDERED = 200

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        _workspace, config, project_ids, _buckets, start, end = analytics_context(request, slug)
        issues = scoped_issues(project_ids)

        created = issues.filter(created_at__date__gte=start, created_at__date__lte=end)
        created_total = created.count()
        bugs = created.filter(type__name__iexact="Bug")
        hotfixes = created.filter(type__name__iexact="Hotfix")

        reached_qa, sent_back = self.qa_flow(project_ids, config, start, end)

        return Response(
            {
                "period": {"start_date": start.isoformat(), "end_date": end.isoformat()},
                "created_total": created_total,
                "bug_count": bugs.count(),
                "bug_rate": round(bugs.count() / created_total, 4) if created_total else None,
                "hotfix_count": hotfixes.count(),
                "reopened_count": sent_back,
                "reopened_rate": round(sent_back / reached_qa, 4) if reached_qa else None,
                "reached_qa": reached_qa,
                "escaped_bugs": self.escaped_bugs(project_ids, start, end),
                "by_type": {
                    row["type__name"] or "Untyped": row["count"]
                    for row in created.values("type__name").annotate(count=Count("id", distinct=True)).order_by()
                },
                "definitions": {
                    "bug_rate": "Issues of type Bug created in the period, over all issues created.",
                    "reopened_rate": (
                        "Moves from a QA state back to development, over the number of issues that "
                        "entered QA in the period."
                    ),
                    "escaped_bugs": (
                        f"Bugs and hotfixes filed within {self.ESCAPE_WINDOW_DAYS} days after a "
                        "production deployment in the same project."
                    ),
                },
            },
            status=status.HTTP_200_OK,
        )

    def qa_flow(self, project_ids, config, start, end):
        """``(issues that entered QA, moves back out to development)``."""
        qa_names = names_for(config, "qa")
        dev_names = names_for(config, "in_progress")

        entered = set()
        sent_back = 0
        for old_value, new_value, issue_id in state_transitions(project_ids, start, end).values_list(
            "old_value", "new_value", "issue_id"
        ):
            old_folded = (old_value or "").casefold()
            new_folded = (new_value or "").casefold()
            if new_folded in qa_names:
                entered.add(issue_id)
            if old_folded in qa_names and new_folded in dev_names:
                sent_back += 1
        return len(entered), sent_back

    def escaped_bugs(self, project_ids, start, end):
        # Only releases that could still be blamed for a bug filed inside the
        # period matter. Without this bound the OR-chain below grows with every
        # release the workspace has ever recorded.
        releases = list(
            Deployment.objects.filter(
                project_id__in=project_ids,
                environment="production",
                status=DeploymentStatus.DEPLOYED,
                completed_at__isnull=False,
                completed_at__date__gte=start - timedelta(days=self.ESCAPE_WINDOW_DAYS),
                completed_at__date__lte=end,
            )
            .order_by("-completed_at")
            .values_list("project_id", "completed_at")[: self.MAX_RELEASES_CONSIDERED]
        )

        if not releases:
            return 0

        window = Q()
        for project_id, completed_at in releases:
            window |= Q(
                project_id=project_id,
                created_at__gte=completed_at,
                created_at__lte=completed_at + timedelta(days=self.ESCAPE_WINDOW_DAYS),
            )

        return (
            scoped_issues(project_ids)
            .filter(window)
            .filter(type__name__in=["Bug", "Hotfix"], created_at__date__gte=start, created_at__date__lte=end)
            .distinct()
            .count()
        )


class ProductivityAnalyticsEndpoint(BaseAPIView):
    """Completion counts, WIP and work log completion, per member."""

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        workspace, config, project_ids, buckets, start, end = analytics_context(request, slug)
        issues = scoped_issues(project_ids)

        members = list(
            WorkspaceMember.objects.filter(workspace=workspace, is_active=True)
            .exclude(member__is_bot=True)
            .annotate(member_avatar_url=avatar_url("member"))
            .values("member_id", "member__display_name", "member_avatar_url")
        )
        member_ids = [m["member_id"] for m in members]

        completed = issues.filter(state__group="completed", completed_at__date__gte=start, completed_at__date__lte=end)
        completed_by_member = {
            row["assignee_id"]: row["count"]
            for row in IssueAssignee.objects.filter(issue__in=completed, assignee_id__in=member_ids)
            .values("assignee_id")
            .annotate(count=Count("issue_id", distinct=True))
            .order_by()
        }

        wip_states = buckets["in_progress"] + buckets["ready_for_test"]
        wip_by_member = {
            row["assignee_id"]: row["count"]
            for row in IssueAssignee.objects.filter(
                issue__in=issues.filter(state_id__in=wip_states), assignee_id__in=member_ids
            )
            .values("assignee_id")
            .annotate(count=Count("issue_id", distinct=True))
            .order_by()
        }

        completion_times = {}
        for row in completed.values("id", "created_at", "completed_at"):
            completion_times[row["id"]] = days_between(row["created_at"], row["completed_at"])

        expected_days = self.expected_log_days(config, start, end)
        logs_by_member = {
            row["owner_id"]: row["count"]
            for row in WorkLog.objects.filter(
                workspace=workspace,
                owner_id__in=member_ids,
                date__gte=start,
                date__lte=end,
                submitted_at__isnull=False,
            )
            .values("owner_id")
            .annotate(count=Count("id", distinct=True))
            .order_by()
        }
        return Response(
            {
                "period": {"start_date": start.isoformat(), "end_date": end.isoformat()},
                "completed_total": completed.count(),
                "average_completion_days": average(list(completion_times.values())),
                "wip_total": issues.filter(state_id__in=wip_states).count(),
                "expected_work_log_days": expected_days,
                "members": [
                    {
                        "member_id": str(m["member_id"]),
                        "display_name": m["member__display_name"],
                        "avatar_url": m["member_avatar_url"],
                        "completed": completed_by_member.get(m["member_id"], 0),
                        "wip": wip_by_member.get(m["member_id"], 0),
                        "work_logs_filed": logs_by_member.get(m["member_id"], 0),
                        "work_log_completion": (
                            round(logs_by_member.get(m["member_id"], 0) / expected_days, 4) if expected_days else None
                        ),
                    }
                    for m in members
                ],
                "definitions": {
                    "work_log_completion": "Submitted logs over the number of working days in the period.",
                    "wip": "Issues assigned to the member sitting in a developer-owned state right now.",
                },
            },
            status=status.HTTP_200_OK,
        )

    def expected_log_days(self, config, start, end):
        required = set(config["work_log"]["required_weekdays"])
        count = 0
        cursor = start
        while cursor <= end:
            if cursor.isoweekday() in required:
                count += 1
            cursor += timedelta(days=1)
        return count


class TeamAnalyticsEndpoint(BaseAPIView):
    """
    Utilisation and availability, from what Workspaces can see.

    Leave and attendance trends are Odoo's, not ours: the attendance endpoints
    proxy them per person, and the parts of PROJECT.md that need a team-wide
    history are blocked on the bridge growing the endpoints listed in
    ``odoo-implementation/ODOO_MODULE_SPEC.md``. Everything derivable from
    Workspaces is here, and the gaps say so rather than returning a plausible zero.
    """

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        workspace, config, project_ids, buckets, start, end = analytics_context(request, slug)
        issues = scoped_issues(project_ids)

        members = list(
            WorkspaceMember.objects.filter(workspace=workspace, is_active=True)
            .exclude(member__is_bot=True)
            .annotate(member_avatar_url=avatar_url("member"))
            .values("member_id", "member__display_name", "member_avatar_url", "role")
        )
        member_ids = [m["member_id"] for m in members]

        open_states = buckets["in_progress"] + buckets["ready_for_test"] + buckets["qa"] + buckets["ready_for_release"]
        assigned_open = {
            row["assignee_id"]: row["count"]
            for row in IssueAssignee.objects.filter(
                issue__in=issues.filter(state_id__in=open_states), assignee_id__in=member_ids
            )
            .values("assignee_id")
            .annotate(count=Count("issue_id", distinct=True))
            .order_by()
        }

        hours = {
            row["owner_id"]: float(row["total"] or 0)
            for row in WorkLog.objects.filter(
                workspace=workspace, owner_id__in=member_ids, date__gte=start, date__lte=end
            )
            .values("owner_id")
            .annotate(total=Sum("time_spent"))
            .order_by()
        }

        return Response(
            {
                "period": {"start_date": start.isoformat(), "end_date": end.isoformat()},
                "member_count": len(members),
                "members": [
                    {
                        "member_id": str(m["member_id"]),
                        "display_name": m["member__display_name"],
                        "avatar_url": m["member_avatar_url"],
                        "role": m["role"],
                        "open_assigned": assigned_open.get(m["member_id"], 0),
                        "logged_hours": hours.get(m["member_id"], 0.0),
                    }
                    for m in members
                ],
                "unassigned_open": issues.filter(state_id__in=open_states, assignees__isnull=True).count(),
                "attendance": {
                    "available": False,
                    "reason": "Team-wide attendance history needs the Odoo bridge endpoints in ODOO_MODULE_SPEC.md.",
                },
            },
            status=status.HTTP_200_OK,
        )
