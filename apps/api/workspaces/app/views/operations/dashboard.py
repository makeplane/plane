# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
The four role dashboards from PROJECT.md.

Each is one request. That is the whole point: a PM should be able to understand
team health from a single screen, and a screen that fires fourteen requests is
a screen that is half-loaded whenever somebody looks at it. Every number below
is derived from data Workspaces already holds -- none of these endpoints write.
"""

# Python imports
from datetime import timedelta

# Django imports
from django.db.models import Count
from django.utils import timezone

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
    OperationsTicket,
    OperationsTicketStatus,
    WorkLog,
    WorkspaceMember,
)
from workspaces.utils.engineering_ops import average, avatar_url, hours_between

from .helpers import (
    count_by,
    dashboard_context,
    names_for,
    overdue_filter,
    scoped_issues,
    state_transitions,
)

# Every bucket any dashboard needs, resolved once per request.
DASHBOARD_BUCKETS = (
    "planning",
    "in_progress",
    "ready_for_test",
    "qa",
    "ready_for_release",
    "deployed",
    "blocked",
    "cancelled",
    "developer_owned",
)


def quality_counts(issues, config):
    """
    Bug and hotfix counts over one issue set.

    Which types count toward quality is configurable -- PROJECT.md gives Bug
    and Hotfix, but a workspace that renamed them should not silently start
    reporting zero.
    """
    quality_types = config.get("quality_issue_types") or []
    return {
        "bugs": issues.filter(type__name__iexact="Bug").count(),
        "hotfixes": issues.filter(type__name__iexact="Hotfix").count(),
        "quality_items": issues.filter(type__name__in=quality_types).count() if quality_types else 0,
        "open_bugs": issues.filter(type__name__iexact="Bug")
        .exclude(state__group__in=["completed", "cancelled"])
        .count(),
    }


def qa_failure_count(project_ids, config, start=None, end=None):
    """
    Moves from QA back to development.

    This is what "QA failure" and "reopened" actually mean in the workflow:
    somebody put an issue into QA Testing and QA sent it back. Counted off the
    activity trail, because the issue's current state has no memory of it.
    """
    qa_names = names_for(config, "qa")
    dev_names = names_for(config, "in_progress")
    if not qa_names or not dev_names:
        return 0

    count = 0
    for old_value, new_value in state_transitions(project_ids, start, end).values_list("old_value", "new_value"):
        if (old_value or "").casefold() in qa_names and (new_value or "").casefold() in dev_names:
            count += 1
    return count


class PMDashboardEndpoint(BaseAPIView):
    """
    Operational visibility for a project manager.

    Sprint, team, delivery, quality, capacity and operations -- the six panels
    PROJECT.md asks for, in one payload.
    """

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        workspace, config, project_ids, buckets = dashboard_context(request, slug, DASHBOARD_BUCKETS)
        issues = scoped_issues(project_ids)
        today = timezone.localdate()

        return Response(
            {
                "project_ids": [str(pid) for pid in project_ids],
                "sprint": self.sprint(project_ids, config),
                "team": self.team(workspace, today),
                "delivery": self.delivery(issues, buckets),
                "quality": self.quality(issues, project_ids, config),
                "capacity": self.capacity(issues, buckets, workspace),
                "operations": self.operations(workspace),
            },
            status=status.HTTP_200_OK,
        )

    def sprint(self, project_ids, config):
        now = timezone.now()
        cycles = list(
            Cycle.objects.filter(
                project_id__in=project_ids,
                start_date__lte=now,
                end_date__gte=now,
                archived_at__isnull=True,
            ).select_related("project")
        )
        if not cycles:
            return {"active_cycles": [], "total": 0, "completed": 0, "remaining": 0, "velocity": 0, "carry_over": 0}

        velocity_types = config.get("velocity_issue_types") or []
        cycle_ids = [c.id for c in cycles]
        # `distinct` matters: an issue that sits in two active cycles would
        # otherwise be counted twice in every number below it.
        cycle_issues = (
            Issue.issue_objects.filter(issue_cycle__cycle_id__in=cycle_ids).exclude(type__is_epic=True).distinct()
        )

        total = cycle_issues.count()
        completed = cycle_issues.filter(state__group="completed").count()
        velocity = (
            cycle_issues.filter(state__group="completed", type__name__in=velocity_types).count()
            if velocity_types
            else completed
        )

        earliest_start = min(c.start_date for c in cycles if c.start_date)
        carry_over = (
            cycle_issues.filter(created_at__lt=earliest_start)
            .exclude(state__group__in=["completed", "cancelled"])
            .count()
            if earliest_start
            else 0
        )

        return {
            "active_cycles": [
                {
                    "id": str(cycle.id),
                    "name": cycle.name,
                    "project_id": str(cycle.project_id),
                    "start_date": cycle.start_date,
                    "end_date": cycle.end_date,
                }
                for cycle in cycles
            ],
            "total": total,
            "completed": completed,
            "remaining": total - completed,
            "velocity": velocity,
            "carry_over": carry_over,
            "burndown": self.burndown(cycles, cycle_issues),
        }

    def burndown(self, cycles, cycle_issues):
        """Remaining work per day across the widest active cycle window."""
        starts = [c.start_date for c in cycles if c.start_date]
        ends = [c.end_date for c in cycles if c.end_date]
        if not starts or not ends:
            return []

        start, end = min(starts).date(), max(ends).date()
        # A cycle longer than a quarter is a planning problem, not a chart.
        if (end - start).days > 120:
            start = end - timedelta(days=120)

        total = cycle_issues.count()
        completed_per_day = {
            row["completed_at__date"]: row["count"]
            for row in cycle_issues.filter(completed_at__date__gte=start, completed_at__date__lte=end)
            .values("completed_at__date")
            .annotate(count=Count("id", distinct=True))
            .order_by()
        }

        series = []
        remaining = total
        # Anything closed before the window opened is already off the board.
        remaining -= cycle_issues.filter(completed_at__date__lt=start).count()
        cursor = start
        today = timezone.localdate()
        while cursor <= end:
            remaining -= completed_per_day.get(cursor, 0)
            series.append(
                {
                    "date": cursor.isoformat(),
                    # The future has no measurement, only a projection nobody
                    # asked for. Leave it null and let the chart stop.
                    "remaining": remaining if cursor <= today else None,
                }
            )
            cursor += timedelta(days=1)
        return series

    def team(self, workspace, today):
        """
        Who is around, and who has not filed.

        Attendance itself lives in Odoo and is fetched separately by the
        team-availability endpoint -- one bridge round trip does not belong in
        the middle of six database queries.
        """
        members = list(
            WorkspaceMember.objects.filter(workspace=workspace, is_active=True)
            .exclude(member__is_bot=True)
            .annotate(member_avatar_url=avatar_url("member"))
            .values("member_id", "member__display_name", "member_avatar_url")
        )
        member_ids = [m["member_id"] for m in members]

        filed_today = set(
            WorkLog.objects.filter(
                workspace=workspace, owner_id__in=member_ids, date=today, submitted_at__isnull=False
            ).values_list("owner_id", flat=True)
        )

        return {
            "total": len(members),
            "work_logs_filed": len(filed_today),
            "missing_work_logs": [
                {
                    "member_id": str(m["member_id"]),
                    "display_name": m["member__display_name"],
                    "avatar_url": m["member_avatar_url"],
                }
                for m in members
                if m["member_id"] not in filed_today
            ],
        }

    def delivery(self, issues, buckets):
        return {
            "in_progress": issues.filter(state_id__in=buckets["in_progress"]).count(),
            "waiting_qa": issues.filter(state_id__in=buckets["ready_for_test"] + buckets["qa"]).count(),
            "waiting_deployment": issues.filter(state_id__in=buckets["ready_for_release"]).count(),
            "blocked": issues.filter(state_id__in=buckets["blocked"]).count(),
            "overdue": issues.filter(overdue_filter()).count(),
            "deployed": issues.filter(state_id__in=buckets["deployed"]).count(),
        }

    def quality(self, issues, project_ids, config):
        window_start = timezone.localdate() - timedelta(days=30)
        counts = quality_counts(issues, config)
        counts["qa_failures_30d"] = qa_failure_count(project_ids, config, start=window_start)
        counts["reopened_30d"] = counts["qa_failures_30d"]
        return counts

    def capacity(self, issues, buckets, workspace):
        """WIP per assignee, and where the queue is piling up."""
        wip_states = buckets["in_progress"] + buckets["ready_for_test"]
        per_assignee = (
            IssueAssignee.objects.filter(issue__in=issues.filter(state_id__in=wip_states))
            .annotate(assignee_avatar_url=avatar_url("assignee"))
            .values("assignee_id", "assignee__display_name", "assignee_avatar_url")
            .annotate(count=Count("issue_id", distinct=True))
            .order_by("-count")
        )

        # A bottleneck is a state holding more than its share of open work.
        # Reported as raw counts so the UI decides what "too much" looks like.
        bottlenecks = [
            {"stage": stage, "count": issues.filter(state_id__in=buckets[bucket]).count()}
            for stage, bucket in (
                ("In Progress", "in_progress"),
                ("Ready for Test Deployment", "ready_for_test"),
                ("QA Testing", "qa"),
                ("Ready for Release", "ready_for_release"),
            )
        ]

        return {
            "wip_total": issues.filter(state_id__in=wip_states).count(),
            "workload": [
                {
                    "member_id": str(row["assignee_id"]),
                    "display_name": row["assignee__display_name"],
                    "avatar_url": row["assignee_avatar_url"],
                    "wip": row["count"],
                }
                for row in per_assignee
            ],
            "unassigned": issues.filter(state_id__in=wip_states, assignees__isnull=True).count(),
            "bottlenecks": bottlenecks,
        }

    def operations(self, workspace):
        tickets = OperationsTicket.objects.filter(workspace=workspace)
        by_status = count_by(tickets, "status")
        return {
            "pending": sum(
                by_status.get(value, 0)
                for value in (
                    OperationsTicketStatus.NEW,
                    OperationsTicketStatus.PM_REVIEW,
                    OperationsTicketStatus.NEED_INFO,
                    OperationsTicketStatus.APPROVED,
                )
            ),
            "waiting_pm_review": by_status.get(OperationsTicketStatus.NEW, 0)
            + by_status.get(OperationsTicketStatus.PM_REVIEW, 0),
            "need_information": by_status.get(OperationsTicketStatus.NEED_INFO, 0),
            "waiting_conversion": by_status.get(OperationsTicketStatus.APPROVED, 0),
            "converted": by_status.get(OperationsTicketStatus.CONVERTED, 0),
            "by_status": by_status,
            "by_source": count_by(tickets, "source"),
        }


class DeveloperDashboardEndpoint(BaseAPIView):
    """
    One developer's day.

    Defaults to the signed-in user; ``?member_id=`` lets a PM look at somebody
    else's, which is scoped to the same projects the caller can see anyway.
    """

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace, config, project_ids, buckets = dashboard_context(request, slug, DASHBOARD_BUCKETS)
        member_id = request.query_params.get("member_id") or request.user.id
        today = timezone.localdate()

        assigned = scoped_issues(project_ids).filter(assignees__id=member_id).distinct()
        now = timezone.now()

        current_cycle_issues = assigned.filter(
            issue_cycle__cycle__start_date__lte=now, issue_cycle__cycle__end_date__gte=now
        )

        week_start = today - timedelta(days=today.weekday())
        completed_this_week = assigned.filter(
            state__group="completed", completed_at__date__gte=week_start, completed_at__date__lte=today
        )

        work_log = WorkLog.objects.filter(workspace=workspace, owner_id=member_id, date=today).first()
        week_logs = WorkLog.objects.filter(
            workspace=workspace, owner_id=member_id, date__gte=week_start, date__lte=today
        )

        return Response(
            {
                "member_id": str(member_id),
                "assigned": {
                    "total": assigned.exclude(state__group__in=["completed", "cancelled"]).count(),
                    "by_state_group": count_by(assigned, "state__group"),
                    "by_priority": count_by(assigned.exclude(state__group__in=["completed", "cancelled"]), "priority"),
                },
                "current_sprint": {
                    "total": current_cycle_issues.count(),
                    "completed": current_cycle_issues.filter(state__group="completed").count(),
                    "cycles": list(
                        current_cycle_issues.values("issue_cycle__cycle__id", "issue_cycle__cycle__name")
                        .annotate(count=Count("id", distinct=True))
                        .order_by()
                    ),
                },
                "modules": list(
                    assigned.exclude(state__group__in=["completed", "cancelled"])
                    .filter(issue_module__module__isnull=False)
                    .values("issue_module__module__id", "issue_module__module__name")
                    .annotate(count=Count("id", distinct=True))
                    .order_by("-count")[:10]
                ),
                "in_progress": list(
                    assigned.filter(state_id__in=buckets["developer_owned"]).values(
                        "id", "name", "sequence_id", "project_id", "state_id", "priority", "target_date"
                    )[:25]
                ),
                "blocked": list(
                    assigned.filter(state_id__in=buckets["blocked"]).values(
                        "id", "name", "sequence_id", "project_id", "target_date"
                    )[:25]
                ),
                "overdue": assigned.filter(overdue_filter()).count(),
                "recently_completed": list(
                    assigned.filter(state__group="completed")
                    .order_by("-completed_at")
                    .values("id", "name", "sequence_id", "project_id", "completed_at")[:10]
                ),
                "work_log": {
                    "today_filed": bool(work_log and work_log.submitted_at),
                    "today_id": str(work_log.id) if work_log else None,
                    "week_filed": week_logs.filter(submitted_at__isnull=False).count(),
                    "week_hours": float(sum(log.time_spent for log in week_logs)),
                },
                "weekly": {
                    "completed": completed_this_week.count(),
                    "week_start": week_start.isoformat(),
                },
            },
            status=status.HTTP_200_OK,
        )


class QADashboardEndpoint(BaseAPIView):
    """The testing queue, and how long it takes to get through it."""

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        _workspace, config, project_ids, buckets = dashboard_context(request, slug, DASHBOARD_BUCKETS)
        issues = scoped_issues(project_ids)
        window_start = timezone.localdate() - timedelta(days=30)

        ready_for_testing = issues.filter(state_id__in=buckets["ready_for_test"])
        in_testing = issues.filter(state_id__in=buckets["qa"])

        return Response(
            {
                "ready_for_testing": {
                    "count": ready_for_testing.count(),
                    "items": list(
                        ready_for_testing.order_by("updated_at").values(
                            "id", "name", "sequence_id", "project_id", "priority", "updated_at"
                        )[:25]
                    ),
                },
                "in_testing": {
                    "count": in_testing.count(),
                    "items": list(
                        in_testing.order_by("updated_at").values(
                            "id", "name", "sequence_id", "project_id", "priority", "updated_at"
                        )[:25]
                    ),
                },
                "passed_30d": self.passed_count(project_ids, config, window_start),
                "failed_30d": qa_failure_count(project_ids, config, start=window_start),
                "reopened_bugs": issues.filter(type__name__iexact="Bug", state_id__in=buckets["in_progress"]).count(),
                "average_qa_hours": self.average_qa_hours(project_ids, config, window_start),
                "waiting_release": issues.filter(state_id__in=buckets["ready_for_release"]).count(),
            },
            status=status.HTTP_200_OK,
        )

    def passed_count(self, project_ids, config, start):
        qa_names = names_for(config, "qa")
        release_names = names_for(config, "ready_for_release")
        count = 0
        for old_value, new_value in state_transitions(project_ids, start).values_list("old_value", "new_value"):
            if (old_value or "").casefold() in qa_names and (new_value or "").casefold() in release_names:
                count += 1
        return count

    def average_qa_hours(self, project_ids, config, start):
        """
        Mean hours between entering QA Testing and leaving it.

        Pairs each entry with the next exit for the same issue. An issue still
        sitting in QA contributes nothing -- it has no duration yet, and
        counting it as zero would make a stuck queue look fast.
        """
        qa_names = names_for(config, "qa")
        entries = {}
        durations = []

        for activity in (
            state_transitions(project_ids, start)
            .order_by("created_at")
            .values("issue_id", "old_value", "new_value", "created_at")
        ):
            old_value = (activity["old_value"] or "").casefold()
            new_value = (activity["new_value"] or "").casefold()
            issue_id = activity["issue_id"]

            if new_value in qa_names:
                entries[issue_id] = activity["created_at"]
            elif old_value in qa_names and issue_id in entries:
                durations.append(hours_between(entries.pop(issue_id), activity["created_at"]))

        return average(durations)


class DevOpsDashboardEndpoint(BaseAPIView):
    """The release queue and what happened to the last releases."""

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        _workspace, _config, project_ids, buckets = dashboard_context(request, slug, DASHBOARD_BUCKETS)
        issues = scoped_issues(project_ids)
        window_start = timezone.now() - timedelta(days=30)

        deployments = Deployment.objects.filter(project_id__in=project_ids)
        recent = deployments.filter(created_at__gte=window_start)

        return Response(
            {
                "release_queue": {
                    "count": issues.filter(state_id__in=buckets["ready_for_release"]).count(),
                    "items": list(
                        issues.filter(state_id__in=buckets["ready_for_release"])
                        .order_by("updated_at")
                        .values("id", "name", "sequence_id", "project_id", "priority", "updated_at")[:25]
                    ),
                },
                "pending_deployments": deployments.filter(
                    status__in=[DeploymentStatus.PENDING, DeploymentStatus.IN_PROGRESS]
                ).count(),
                "production_releases_30d": recent.filter(
                    environment="production", status=DeploymentStatus.DEPLOYED
                ).count(),
                "failed_30d": recent.filter(status=DeploymentStatus.FAILED).count(),
                "rollbacks_30d": recent.filter(status=DeploymentStatus.ROLLED_BACK).count(),
                "deployment_frequency_per_week": round(
                    recent.filter(status=DeploymentStatus.DEPLOYED).count() / (30 / 7), 2
                ),
                "history": list(
                    deployments.order_by("-created_at").values(
                        "id",
                        "version",
                        "environment",
                        "status",
                        "project_id",
                        "started_at",
                        "completed_at",
                        "created_at",
                    )[:25]
                ),
                "by_status": count_by(deployments, "status"),
                "by_environment": count_by(deployments, "environment"),
            },
            status=status.HTTP_200_OK,
        )
