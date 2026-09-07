# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Reports.

A report is a period plus a point of view -- there is no report *data* that the
dashboards and analytics endpoints do not already produce. What this module
adds is the framing: the right window for the period, a headline set for the
audience, and a narrative section a person can paste into an email.

PROJECT.md asks for weekly, monthly, sprint, executive and team reports; each
is a preset over the same machinery rather than a separate pipeline.
"""

# Python imports
from datetime import timedelta

# Django imports
from django.db.models import Count, Sum
from django.utils import timezone
from django.utils.dateparse import parse_date

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
    OperationsRecord,
    OperationsTicket,
    OperationsTicketStatus,
    WorkLog,
    Workspace,
    WorkspaceMember,
)
from workspaces.utils.engineering_ops import average, avatar_url, days_between, get_operations_config

from .dashboard import qa_failure_count
from .helpers import overdue_filter, scoped_issues, scoped_project_ids, state_ids_by_bucket

REPORT_TYPES = ("weekly", "monthly", "sprint", "executive", "team")

REPORT_BUCKETS = ("in_progress", "ready_for_test", "qa", "ready_for_release", "deployed", "blocked")


def report_period(report_type, request):
    """
    The window a report covers.

    Explicit dates always win. Otherwise each preset gets the window its name
    promises -- a "weekly" report that silently covered thirty days would be
    worse than no report.
    """
    today = timezone.localdate()
    start = parse_date(request.query_params.get("start_date") or "")
    end = parse_date(request.query_params.get("end_date") or "") or today

    if start:
        return (start, end) if start <= end else (end, start)

    if report_type == "weekly":
        # The week that just finished, Monday to Sunday.
        return end - timedelta(days=end.weekday() + 7), end - timedelta(days=end.weekday() + 1)
    if report_type == "monthly":
        first_of_month = end.replace(day=1)
        previous_month_end = first_of_month - timedelta(days=1)
        return previous_month_end.replace(day=1), previous_month_end
    if report_type == "executive":
        return end - timedelta(days=89), end
    return end - timedelta(days=29), end


class OperationsReportEndpoint(BaseAPIView):
    """One assembled report."""

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, report_type):
        if report_type not in REPORT_TYPES:
            return Response(
                {"error": f"Unknown report type. Expected one of {', '.join(REPORT_TYPES)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)
        config = get_operations_config(workspace.id)
        project_ids = scoped_project_ids(request, slug)
        buckets = state_ids_by_bucket(project_ids, config, REPORT_BUCKETS)
        start, end = report_period(report_type, request)

        payload = {
            "report_type": report_type,
            "generated_at": timezone.now(),
            "period": {"start_date": start.isoformat(), "end_date": end.isoformat()},
            "workspace": {"id": str(workspace.id), "slug": workspace.slug, "name": workspace.name},
            "project_ids": [str(pid) for pid in project_ids],
        }

        if report_type == "sprint":
            payload["sprint"] = self.sprint_section(project_ids, config, start, end)
        if report_type == "team":
            payload["team"] = self.team_section(workspace, project_ids, buckets, start, end)
        if report_type in ("weekly", "monthly", "executive"):
            payload["delivery"] = self.delivery_section(project_ids, config, buckets, start, end)
            payload["quality"] = self.quality_section(project_ids, config, start, end)
            payload["operations"] = self.operations_section(workspace, start, end)
        if report_type == "executive":
            payload["headline"] = self.headline(payload)
            payload["records"] = self.records_section(workspace, start, end)
        if report_type in ("weekly", "monthly"):
            payload["team"] = self.team_section(workspace, project_ids, buckets, start, end)

        return Response(payload, status=status.HTTP_200_OK)

    def delivery_section(self, project_ids, config, buckets, start, end):
        issues = scoped_issues(project_ids)
        completed = issues.filter(state__group="completed", completed_at__date__gte=start, completed_at__date__lte=end)
        created = issues.filter(created_at__date__gte=start, created_at__date__lte=end)

        deployments = Deployment.objects.filter(
            project_id__in=project_ids, completed_at__date__gte=start, completed_at__date__lte=end
        )

        return {
            "created": created.count(),
            "completed": completed.count(),
            "net_flow": completed.count() - created.count(),
            "lead_time_days": average(
                [
                    days_between(row["created_at"], row["completed_at"])
                    for row in completed.values("created_at", "completed_at")
                ]
            ),
            "in_progress": issues.filter(state_id__in=buckets["in_progress"]).count(),
            "waiting_qa": issues.filter(state_id__in=buckets["ready_for_test"] + buckets["qa"]).count(),
            "waiting_deployment": issues.filter(state_id__in=buckets["ready_for_release"]).count(),
            "blocked": issues.filter(state_id__in=buckets["blocked"]).count(),
            "overdue": issues.filter(overdue_filter()).count(),
            "deployments": {
                "total": deployments.count(),
                "successful": deployments.filter(status=DeploymentStatus.DEPLOYED).count(),
                "failed": deployments.filter(status=DeploymentStatus.FAILED).count(),
                "rolled_back": deployments.filter(status=DeploymentStatus.ROLLED_BACK).count(),
            },
            "by_project": list(
                completed.values("project_id", "project__name", "project__identifier")
                .annotate(count=Count("id", distinct=True))
                .order_by("-count")
            ),
        }

    def quality_section(self, project_ids, config, start, end):
        issues = scoped_issues(project_ids)
        created = issues.filter(created_at__date__gte=start, created_at__date__lte=end)
        total = created.count()
        bugs = created.filter(type__name__iexact="Bug").count()

        return {
            "bugs_filed": bugs,
            "bug_rate": round(bugs / total, 4) if total else None,
            "hotfixes": created.filter(type__name__iexact="Hotfix").count(),
            "qa_failures": qa_failure_count(project_ids, config, start=start, end=end),
            "open_bugs": issues.filter(type__name__iexact="Bug")
            .exclude(state__group__in=["completed", "cancelled"])
            .count(),
        }

    def sprint_section(self, project_ids, config, start, end):
        velocity_types = config.get("velocity_issue_types") or []
        cycles = Cycle.objects.filter(
            project_id__in=project_ids, end_date__date__gte=start, end_date__date__lte=end
        ).select_related("project")

        rows = []
        for cycle in cycles:
            cycle_issues = Issue.issue_objects.filter(issue_cycle__cycle_id=cycle.id).distinct()
            completed = cycle_issues.filter(state__group="completed")
            counted = completed.filter(type__name__in=velocity_types) if velocity_types else completed
            carried = cycle_issues.exclude(state__group__in=["completed", "cancelled"]).count() if cycle.end_date else 0
            rows.append(
                {
                    "cycle_id": str(cycle.id),
                    "name": cycle.name,
                    "project": cycle.project.name,
                    "start_date": cycle.start_date,
                    "end_date": cycle.end_date,
                    "total": cycle_issues.count(),
                    "completed": completed.count(),
                    "velocity": counted.count(),
                    "carry_over": carried,
                }
            )

        return {"cycles": rows, "average_velocity": average([row["velocity"] for row in rows])}

    def team_section(self, workspace, project_ids, buckets, start, end):
        members = list(
            WorkspaceMember.objects.filter(workspace=workspace, is_active=True)
            .exclude(member__is_bot=True)
            .annotate(member_avatar_url=avatar_url("member"))
            .values("member_id", "member__display_name", "member_avatar_url")
        )
        member_ids = [m["member_id"] for m in members]
        issues = scoped_issues(project_ids)

        completed = issues.filter(state__group="completed", completed_at__date__gte=start, completed_at__date__lte=end)
        completed_by = {
            row["assignee_id"]: row["count"]
            for row in IssueAssignee.objects.filter(issue__in=completed, assignee_id__in=member_ids)
            .values("assignee_id")
            .annotate(count=Count("issue_id", distinct=True))
            .order_by()
        }
        logs = {
            row["owner_id"]: (row["filed"], float(row["hours"] or 0))
            for row in WorkLog.objects.filter(
                workspace=workspace, owner_id__in=member_ids, date__gte=start, date__lte=end
            )
            .values("owner_id")
            .annotate(filed=Count("id", distinct=True), hours=Sum("time_spent"))
            .order_by()
        }

        return {
            "members": [
                {
                    "member_id": str(m["member_id"]),
                    "display_name": m["member__display_name"],
                    "avatar_url": m["member_avatar_url"],
                    "completed": completed_by.get(m["member_id"], 0),
                    "work_logs_filed": logs.get(m["member_id"], (0, 0.0))[0],
                    "logged_hours": logs.get(m["member_id"], (0, 0.0))[1],
                }
                for m in members
            ],
            "member_count": len(members),
        }

    def operations_section(self, workspace, start, end):
        tickets = OperationsTicket.objects.filter(workspace=workspace)
        raised = tickets.filter(created_at__date__gte=start, created_at__date__lte=end)
        return {
            "raised": raised.count(),
            "converted": tickets.filter(converted_at__date__gte=start, converted_at__date__lte=end).count(),
            "open": tickets.exclude(
                status__in=[
                    OperationsTicketStatus.CONVERTED,
                    OperationsTicketStatus.REJECTED,
                    OperationsTicketStatus.CLOSED,
                ]
            ).count(),
            "by_source": {
                row["source"]: row["count"]
                for row in raised.values("source").annotate(count=Count("id", distinct=True)).order_by()
            },
        }

    def records_section(self, workspace, start, end):
        records = OperationsRecord.objects.filter(
            workspace=workspace, created_at__date__gte=start, created_at__date__lte=end
        )
        return {
            "total": records.count(),
            "by_type": {
                row["record_type"]: row["count"]
                for row in records.values("record_type").annotate(count=Count("id", distinct=True)).order_by()
            },
        }

    def headline(self, payload):
        """
        Two or three sentences an executive can read without a chart.

        Deliberately plain and derived only from numbers already in the
        payload, so it can never disagree with the tables underneath it.
        """
        delivery = payload.get("delivery", {})
        quality = payload.get("quality", {})
        operations = payload.get("operations", {})

        sentences = [
            f"{delivery.get('completed', 0)} work items were completed and "
            f"{delivery.get('created', 0)} were raised in this period."
        ]

        lead_time = delivery.get("lead_time_days")
        if lead_time is not None:
            sentences.append(f"Average lead time was {lead_time} days.")

        deployments = delivery.get("deployments", {})
        if deployments.get("total"):
            sentences.append(
                f"{deployments.get('successful', 0)} of {deployments['total']} deployments succeeded, "
                f"with {deployments.get('rolled_back', 0)} rolled back."
            )

        blocked = delivery.get("blocked", 0)
        overdue = delivery.get("overdue", 0)
        if blocked or overdue:
            sentences.append(f"{blocked} items are on hold and {overdue} are past their target date.")

        if quality.get("bug_rate") is not None:
            sentences.append(f"Bugs were {round(quality['bug_rate'] * 100, 1)}% of everything raised.")

        if operations.get("open"):
            sentences.append(f"{operations['open']} operations requests are still open.")

        return " ".join(sentences)
