# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework.response import Response
from rest_framework import status
from typing import Dict, List, Any
from django.db.models import QuerySet, Q, Count
from django.http import HttpRequest
from django.db.models.functions import TruncMonth
from django.utils import timezone
from plane.app.views.base import BaseAPIView
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import (
    WorkspaceMember,
    Project,
    Issue,
    Cycle,
    Module,
    IssueView,
    ProjectPage,
    Workspace,
    ProjectMember,
)
from plane.utils.build_chart import build_analytics_chart
from plane.utils.date_utils import (
    get_analytics_filters,
)


class AdvanceAnalyticsBaseView(BaseAPIView):
    def initialize_workspace(self, slug: str, type: str) -> None:
        self._workspace_slug = slug
        self.filters = get_analytics_filters(
            slug=slug,
            type=type,
            user=self.request.user,
            date_filter=self.request.GET.get("date_filter", None),
            project_ids=self.request.GET.get("project_ids", None),
        )


class AdvanceAnalyticsEndpoint(AdvanceAnalyticsBaseView):
    def get_filtered_counts(self, queryset: QuerySet) -> Dict[str, int]:
        def get_filtered_count() -> int:
            if self.filters["analytics_date_range"]:
                return queryset.filter(
                    created_at__gte=self.filters["analytics_date_range"]["current"]["gte"],
                    created_at__lte=self.filters["analytics_date_range"]["current"]["lte"],
                ).count()
            return queryset.count()

        def get_previous_count() -> int:
            if self.filters["analytics_date_range"] and self.filters["analytics_date_range"].get("previous"):
                return queryset.filter(
                    created_at__gte=self.filters["analytics_date_range"]["previous"]["gte"],
                    created_at__lte=self.filters["analytics_date_range"]["previous"]["lte"],
                ).count()
            return 0

        return {
            "count": get_filtered_count(),
            # "filter_count": get_previous_count(),
        }

    def get_overview_data(self) -> Dict[str, Dict[str, int]]:
        members_query = WorkspaceMember.objects.filter(
            workspace__slug=self._workspace_slug, is_active=True, member__is_bot=False
        )

        if self.request.GET.get("project_ids", None):
            project_ids = self.request.GET.get("project_ids", None)
            project_ids = [str(project_id) for project_id in project_ids.split(",")]
            members_query = ProjectMember.objects.filter(
                project_id__in=project_ids, is_active=True, member__is_bot=False
            )

        return {
            "total_users": self.get_filtered_counts(members_query),
            "total_admins": self.get_filtered_counts(members_query.filter(role=ROLE.ADMIN.value)),
            "total_members": self.get_filtered_counts(members_query.filter(role=ROLE.MEMBER.value)),
            "total_guests": self.get_filtered_counts(members_query.filter(role=ROLE.GUEST.value)),
            "total_projects": self.get_filtered_counts(Project.objects.filter(**self.filters["project_filters"])),
            "total_work_items": self.get_filtered_counts(Issue.issue_objects.filter(**self.filters["base_filters"])),
            "total_cycles": self.get_filtered_counts(Cycle.objects.filter(**self.filters["base_filters"])),
            "total_intake": self.get_filtered_counts(
                Issue.objects.filter(**self.filters["base_filters"]).filter(
                    issue_intake__status__in=["-2", "-1", "0", "1", "2"]  # TODO: Add description for reference.
                )
            ),
        }

    def get_work_items_stats(self) -> Dict[str, Dict[str, int]]:
        base_queryset = Issue.issue_objects.filter(**self.filters["base_filters"])

        return {
            "total_work_items": self.get_filtered_counts(base_queryset),
            "started_work_items": self.get_filtered_counts(base_queryset.filter(state__group="started")),
            "backlog_work_items": self.get_filtered_counts(base_queryset.filter(state__group="backlog")),
            "un_started_work_items": self.get_filtered_counts(base_queryset.filter(state__group="unstarted")),
            "completed_work_items": self.get_filtered_counts(base_queryset.filter(state__group="completed")),
        }

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request: HttpRequest, slug: str) -> Response:
        self.initialize_workspace(slug, type="analytics")
        tab = request.GET.get("tab", "overview")

        if tab == "overview":
            return Response(
                self.get_overview_data(),
                status=status.HTTP_200_OK,
            )
        elif tab == "work-items":
            return Response(
                self.get_work_items_stats(),
                status=status.HTTP_200_OK,
            )
        elif tab == "projects":
            return Response(
                {
                    "total_projects": self.get_filtered_counts(Project.objects.filter(**self.filters["project_filters"])),
                    "on_track_updates": {"count": 0},  # Mocked until Page/Update integration
                    "off_track_updates": {"count": 0},
                    "at_risk_updates": {"count": 0},
                },
                status=status.HTTP_200_OK,
            )
        elif tab == "users":
            members_query = WorkspaceMember.objects.filter(
                workspace__slug=self._workspace_slug, is_active=True, member__is_bot=False
            )
            if request.GET.get("project_ids", None):
                project_ids = request.GET.get("project_ids", None)
                project_ids = [str(project_id) for project_id in project_ids.split(",")]
                members_query = ProjectMember.objects.filter(
                    project_id__in=project_ids, is_active=True, member__is_bot=False
                )
            return Response(
                {
                    "total_users": self.get_filtered_counts(members_query),
                    "total_admins": self.get_filtered_counts(members_query.filter(role=ROLE.ADMIN.value)),
                    "total_members": self.get_filtered_counts(members_query.filter(role=ROLE.MEMBER.value)),
                    "total_guests": self.get_filtered_counts(members_query.filter(role=ROLE.GUEST.value)),
                },
                status=status.HTTP_200_OK,
            )
        elif tab == "cycles":
            base_queryset = Cycle.objects.filter(**self.filters["base_filters"])
            return Response(
                {
                    "total_cycles": self.get_filtered_counts(base_queryset),
                    "current_cycles": self.get_filtered_counts(
                        base_queryset.filter(
                            start_date__lte=timezone.now().date(), end_date__gte=timezone.now().date()
                        )
                    ),
                    "upcoming_cycles": self.get_filtered_counts(base_queryset.filter(start_date__gt=timezone.now().date())),
                    "completed_cycles": self.get_filtered_counts(base_queryset.filter(end_date__lt=timezone.now().date())),
                },
                status=status.HTTP_200_OK,
            )
        elif tab == "modules":
            base_queryset = Module.objects.filter(**self.filters["base_filters"])
            return Response(
                {
                    "total_modules": self.get_filtered_counts(base_queryset),
                    "completed_modules": self.get_filtered_counts(base_queryset.filter(status="completed")),
                    "in_progress_modules": self.get_filtered_counts(base_queryset.filter(status="in-progress")),
                    "planned_modules": self.get_filtered_counts(base_queryset.filter(status="planned")),
                    "paused_modules": self.get_filtered_counts(base_queryset.filter(status="paused")),
                },
                status=status.HTTP_200_OK,
            )
        elif tab == "intake":
            base_queryset = Issue.objects.filter(**self.filters["base_filters"]).filter(
                issue_intake__isnull=False
            )
            return Response(
                {
                    "total_intake": self.get_filtered_counts(base_queryset),
                    "accepted": self.get_filtered_counts(base_queryset.filter(issue_intake__status="1")),  # 1 is accepted
                    "declined": self.get_filtered_counts(base_queryset.filter(issue_intake__status="-1")), # -1 is declined
                    "duplicate": self.get_filtered_counts(base_queryset.filter(issue_intake__status="-2")),# -2 is duplicate
                },
                status=status.HTTP_200_OK,
            )
        return Response({"message": "Invalid tab"}, status=status.HTTP_400_BAD_REQUEST)


class AdvanceAnalyticsStatsEndpoint(AdvanceAnalyticsBaseView):
    def get_project_issues_stats(self) -> QuerySet:
        # Get the base queryset with workspace and project filters
        base_queryset = Issue.issue_objects.filter(**self.filters["base_filters"])

        # Apply date range filter if available
        if self.filters["chart_period_range"]:
            start_date, end_date = self.filters["chart_period_range"]
            base_queryset = base_queryset.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)

        return (
            base_queryset.values("project_id", "project__name")
            .annotate(
                cancelled_work_items=Count("id", filter=Q(state__group="cancelled")),
                completed_work_items=Count("id", filter=Q(state__group="completed")),
                backlog_work_items=Count("id", filter=Q(state__group="backlog")),
                un_started_work_items=Count("id", filter=Q(state__group="unstarted")),
                started_work_items=Count("id", filter=Q(state__group="started")),
            )
            .order_by("project_id")
        )

    def get_work_items_stats(self) -> Dict[str, Dict[str, int]]:
        base_queryset = Issue.issue_objects.filter(**self.filters["base_filters"])
        return (
            base_queryset.values("project_id", "project__name")
            .annotate(
                cancelled_work_items=Count("id", filter=Q(state__group="cancelled")),
                completed_work_items=Count("id", filter=Q(state__group="completed")),
                backlog_work_items=Count("id", filter=Q(state__group="backlog")),
                un_started_work_items=Count("id", filter=Q(state__group="unstarted")),
                started_work_items=Count("id", filter=Q(state__group="started")),
            )
            .order_by("project_id")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request: HttpRequest, slug: str) -> Response:
        self.initialize_workspace(slug, type="chart")
        type = request.GET.get("type", "work-items")

        if type == "work-items":
            return Response(
                self.get_work_items_stats(),
                status=status.HTTP_200_OK,
            )

        elif type == "projects":
            return Response(
                [
                    {
                        "project_id": item["id"],
                        "project__name": item["name"],
                        "members": item["member_count"],
                        "work_items": item["issue_count"],
                        "state_groups": {
                            "started": item["started_issues"],
                            "completed": item["completed_issues"],
                            "backlog": item["backlog_issues"],
                            "unstarted": item["un_started_issues"],
                            "cancelled": item["cancelled_issues"],
                        },
                    }
                    for item in Project.objects.filter(**self.filters["project_filters"])
                    .annotate(
                        member_count=Count("project_projectmember", distinct=True, filter=Q(project_projectmember__is_active=True)),
                        issue_count=Count("project_issue", distinct=True),
                        started_issues=Count("project_issue", filter=Q(project_issue__state__group="started"), distinct=True),
                        completed_issues=Count("project_issue", filter=Q(project_issue__state__group="completed"), distinct=True),
                        backlog_issues=Count("project_issue", filter=Q(project_issue__state__group="backlog"), distinct=True),
                        un_started_issues=Count("project_issue", filter=Q(project_issue__state__group="unstarted"), distinct=True),
                        cancelled_issues=Count("project_issue", filter=Q(project_issue__state__group="cancelled"), distinct=True),
                    )
                    .values(
                        "id", "name", "member_count", "issue_count",
                        "started_issues", "completed_issues", "backlog_issues", "un_started_issues", "cancelled_issues"
                    )
                ],
                status=status.HTTP_200_OK,
            )
        elif type == "users":
            members_query = WorkspaceMember.objects.filter(
                workspace__slug=self._workspace_slug, is_active=True, member__is_bot=False
            )
            if request.GET.get("project_ids", None):
                project_ids = request.GET.get("project_ids", None)
                project_ids = [str(project_id) for project_id in project_ids.split(",")]
                members_query = ProjectMember.objects.filter(
                    project_id__in=project_ids, is_active=True, member__is_bot=False
                )
            
            return Response(
                [
                    {
                        "assignee_id": item["member__id"],
                        "display_name": item["member__display_name"],
                        "avatar_url": item["member__avatar_url"],
                        "started_work_items": item.get("started_count", 0),
                        "completed_work_items": item.get("completed_count", 0),
                        "un_started_work_items": item.get("unstarted_count", 0),
                    }
                    for item in members_query.values("member__id", "member__display_name", "member__avatar_url")
                ],
                status=status.HTTP_200_OK,
            )
        elif type == "cycles":
            base_queryset = Cycle.objects.filter(**self.filters["base_filters"])
            return Response(
                [
                    {
                        "id": item["id"],
                        "name": item["name"],
                        "start_date": item["start_date"],
                        "end_date": item["end_date"],
                        "project_id": item["project_id"],
                        "project__name": item["project__name"],
                        "lead__display_name": item["owned_by__display_name"],
                        "completed_issues": item["completed_issues"],
                        "total_issues": item["total_issues"],
                        "completion_percent": (item["completed_issues"] / item["total_issues"] * 100) if item["total_issues"] > 0 else 0,
                    }
                    for item in base_queryset.annotate(
                        completed_issues=Count("issue_cycle", filter=Q(issue_cycle__issue__state__group="completed")),
                        total_issues=Count("issue_cycle"),
                    ).values(
                        "id", "name", "start_date", "end_date", "project_id", "project__name", "owned_by__display_name",
                        "completed_issues", "total_issues"
                    )
                ],
                status=status.HTTP_200_OK,
            )
        elif type == "modules":
            base_queryset = Module.objects.filter(**self.filters["base_filters"])
            return Response(
                [
                    {
                        "id": item["id"],
                        "name": item["name"],
                        "start_date": item["start_date"],
                        "target_date": item["target_date"],
                        "project_id": item["project_id"],
                        "project__name": item["project__name"],
                        "lead__display_name": item["lead__display_name"],
                        "completed_issues": item["completed_issues"],
                        "total_issues": item["total_issues"],
                        "completion_percent": (item["completed_issues"] / item["total_issues"] * 100) if item["total_issues"] > 0 else 0,
                    }
                    for item in base_queryset.annotate(
                        completed_issues=Count("issue_module", filter=Q(issue_module__issue__state__group="completed")),
                        total_issues=Count("issue_module"),
                    ).values(
                        "id", "name", "start_date", "target_date", "project_id", "project__name", "lead__display_name",
                        "completed_issues", "total_issues"
                    )
                ],
                status=status.HTTP_200_OK,
            )
        elif type == "intake":
            base_queryset = Project.objects.filter(**self.filters["project_filters"])
            return Response(
                [
                    {
                        "project_id": item["id"],
                        "project__name": item["name"],
                        "total_intakes": item["total_intakes"],
                        "accepted": item["accepted_intakes"],
                        "declined": item["declined_intakes"],
                        "duplicate": item["duplicate_intakes"],
                    }
                    for item in base_queryset.annotate(
                        total_intakes=Count("project_issue", filter=Q(project_issue__issue_intake__isnull=False)),
                        accepted_intakes=Count("project_issue", filter=Q(project_issue__issue_intake__status="1")),
                        declined_intakes=Count("project_issue", filter=Q(project_issue__issue_intake__status="-1")),
                        duplicate_intakes=Count("project_issue", filter=Q(project_issue__issue_intake__status="-2")),
                    ).values(
                        "id", "name", "total_intakes", "accepted_intakes", "declined_intakes", "duplicate_intakes"
                    )
                ],
                status=status.HTTP_200_OK,
            )

        return Response({"message": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)


class AdvanceAnalyticsChartEndpoint(AdvanceAnalyticsBaseView):
    def project_chart(self) -> List[Dict[str, Any]]:
        # Get the base queryset with workspace and project filters
        base_queryset = Issue.issue_objects.filter(**self.filters["base_filters"])
        date_filter = {}

        # Apply date range filter if available
        if self.filters["chart_period_range"]:
            start_date, end_date = self.filters["chart_period_range"]
            date_filter = {
                "created_at__date__gte": start_date,
                "created_at__date__lte": end_date,
            }

        total_work_items = base_queryset.filter(**date_filter).count()
        total_cycles = Cycle.objects.filter(**self.filters["base_filters"], **date_filter).count()
        total_modules = Module.objects.filter(**self.filters["base_filters"], **date_filter).count()
        total_intake = Issue.objects.filter(
            issue_intake__isnull=False, **self.filters["base_filters"], **date_filter
        ).count()
        total_members = WorkspaceMember.objects.filter(
            workspace__slug=self._workspace_slug, is_active=True, **date_filter
        ).count()
        total_pages = ProjectPage.objects.filter(**self.filters["base_filters"], **date_filter).count()
        total_views = IssueView.objects.filter(**self.filters["base_filters"], **date_filter).count()

        data = {
            "work_items": total_work_items,
            "cycles": total_cycles,
            "modules": total_modules,
            "intake": total_intake,
            "members": total_members,
            "pages": total_pages,
            "views": total_views,
        }

        return [
            {
                "key": key,
                "name": key.replace("_", " ").title(),
                "count": value or 0,
            }
            for key, value in data.items()
        ]

    def work_item_completion_chart(self) -> Dict[str, Any]:
        # Get the base queryset
        queryset = (
            Issue.issue_objects.filter(**self.filters["base_filters"])
            .select_related("workspace", "state", "parent")
            .prefetch_related("assignees", "labels", "issue_module__module", "issue_cycle__cycle")
        )

        workspace = Workspace.objects.get(slug=self._workspace_slug)
        start_date = workspace.created_at.date().replace(day=1)

        # Apply date range filter if available
        if self.filters["chart_period_range"]:
            start_date, end_date = self.filters["chart_period_range"]
            queryset = queryset.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)

        # Annotate by month and count
        monthly_stats = (
            queryset.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(
                created_count=Count("id"),
                completed_count=Count("id", filter=Q(state__group="completed")),
            )
            .order_by("month")
        )

        # Create dictionary of month -> counts
        stats_dict = {
            stat["month"].strftime("%Y-%m-%d"): {
                "created_count": stat["created_count"],
                "completed_count": stat["completed_count"],
            }
            for stat in monthly_stats
        }

        # Generate monthly data (ensure months with 0 count are included)
        data = []
        # include the current date at the end
        end_date = timezone.now().date()
        last_month = end_date.replace(day=1)
        current_month = start_date

        while current_month <= last_month:
            date_str = current_month.strftime("%Y-%m-%d")
            stats = stats_dict.get(date_str, {"created_count": 0, "completed_count": 0})
            data.append(
                {
                    "key": date_str,
                    "name": date_str,
                    "count": stats["created_count"],
                    "completed_issues": stats["completed_count"],
                    "created_issues": stats["created_count"],
                }
            )
            # Move to next month
            if current_month.month == 12:
                current_month = current_month.replace(year=current_month.year + 1, month=1)
            else:
                current_month = current_month.replace(month=current_month.month + 1)

        schema = {
            "completed_issues": "completed_issues",
            "created_issues": "created_issues",
        }

        return {"data": data, "schema": schema}

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request: HttpRequest, slug: str) -> Response:
        self.initialize_workspace(slug, type="chart")
        type = request.GET.get("type", "projects")
        group_by = request.GET.get("group_by", None)
        x_axis = request.GET.get("x_axis", "PRIORITY")

        if type == "projects":
            return Response(self.project_chart(), status=status.HTTP_200_OK)

        elif type == "custom-work-items":
            queryset = (
                Issue.issue_objects.filter(**self.filters["base_filters"])
                .select_related("workspace", "state", "parent")
                .prefetch_related("assignees", "labels", "issue_module__module", "issue_cycle__cycle")
            )

            # Apply date range filter if available
            if self.filters["chart_period_range"]:
                start_date, end_date = self.filters["chart_period_range"]
                queryset = queryset.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)

            return Response(
                build_analytics_chart(queryset, x_axis, group_by),
                status=status.HTTP_200_OK,
            )

        elif type == "work-items":
            return Response(
                self.work_item_completion_chart(),
                status=status.HTTP_200_OK,
            )
        elif type == "users":
            members_query = WorkspaceMember.objects.filter(
                workspace__slug=self._workspace_slug, is_active=True, member__is_bot=False
            )
            if request.GET.get("project_ids", None):
                project_ids = request.GET.get("project_ids", None)
                project_ids = [str(project_id) for project_id in project_ids.split(",")]
                members_query = ProjectMember.objects.filter(
                    project_id__in=project_ids, is_active=True, member__is_bot=False
                )
            
            data = [
                {
                    "key": item["member__id"],
                    "name": item["member__display_name"],
                    "count": item.get("started_count", 0) + item.get("completed_count", 0) + item.get("unstarted_count", 0),
                    "completed_issues": item.get("completed_count", 0),
                    "pending_issues": item.get("started_count", 0) + item.get("unstarted_count", 0),
                }
                for item in members_query.values("member__id", "member__display_name")
            ]
            
            schema = {
                "completed_issues": "completed_issues",
                "pending_issues": "pending_issues",
            }
            
            return Response(
                {"data": data, "schema": schema},
                status=status.HTTP_200_OK,
            )
        elif type == "cycles":
            base_queryset = Cycle.objects.filter(**self.filters["base_filters"])
            data = [
                {
                    "key": item["id"],
                    "name": item["name"],
                    "count": item["total_issues"],
                    "completed_issues": item["completed_issues"],
                    "total_issues": item["total_issues"],
                    "completion_percent": (item["completed_issues"] / item["total_issues"] * 100) if item["total_issues"] > 0 else 0,
                    "is_current": timezone.now().date() >= item["start_date"] and timezone.now().date() <= item["end_date"] if item["start_date"] and item["end_date"] else False,
                    "is_completed": timezone.now().date() > item["end_date"] if item["end_date"] else False,
                    "is_upcoming": timezone.now().date() < item["start_date"] if item["start_date"] else False,
                }
                for item in base_queryset.annotate(
                    completed_issues=Count("issue_cycle", filter=Q(issue_cycle__issue__state__group="completed")),
                    total_issues=Count("issue_cycle"),
                ).values(
                    "id", "name", "start_date", "end_date", "completed_issues", "total_issues"
                )
            ]
            
            schema = {
                "completion_percent": "completion_percent",
            }
            
            return Response(
                {"data": data, "schema": schema},
                status=status.HTTP_200_OK,
            )
        elif type == "modules":
            base_queryset = Module.objects.filter(**self.filters["base_filters"])
            data = [
                {
                    "key": item["id"],
                    "name": item["name"],
                    "count": item["total_issues"],
                    "completed_issues": item["completed_issues"],
                    "total_issues": item["total_issues"],
                    "status": item["status"],
                    "completion_percent": (item["completed_issues"] / item["total_issues"] * 100) if item["total_issues"] > 0 else 0,
                }
                for item in base_queryset.annotate(
                    completed_issues=Count("issue_module", filter=Q(issue_module__issue__state__group="completed")),
                    total_issues=Count("issue_module"),
                ).values(
                    "id", "name", "status", "completed_issues", "total_issues"
                )
            ]
            
            schema = {
                "completion_percent": "completion_percent",
            }
            
            return Response(
                {"data": data, "schema": schema},
                status=status.HTTP_200_OK,
            )
        elif type == "intake":
            base_queryset = Issue.objects.filter(
                **self.filters["base_filters"]
            ).filter(issue_intake__isnull=False)

            workspace = Workspace.objects.get(slug=self._workspace_slug)
            start_date = workspace.created_at.date().replace(day=1)

            if self.filters["chart_period_range"]:
                start_date, end_date = self.filters["chart_period_range"]
                base_queryset = base_queryset.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)

            monthly_stats = (
                base_queryset.annotate(month=TruncMonth("created_at"))
                .values("month")
                .annotate(
                    accepted_count=Count("id", filter=Q(issue_intake__status="1")),
                    declined_count=Count("id", filter=Q(issue_intake__status="-1")),
                )
                .order_by("month")
            )

            stats_dict = {
                stat["month"].strftime("%Y-%m-%d"): {
                    "accepted_count": stat["accepted_count"],
                    "declined_count": stat["declined_count"],
                }
                for stat in monthly_stats
            }

            data = []
            end_date = timezone.now().date()
            last_month = end_date.replace(day=1)
            current_month = start_date

            while current_month <= last_month:
                date_str = current_month.strftime("%Y-%m-%d")
                stats = stats_dict.get(date_str, {"accepted_count": 0, "declined_count": 0})
                data.append(
                    {
                        "key": date_str,
                        "name": date_str,
                        "accepted_issues": stats["accepted_count"],
                        "declined_issues": stats["declined_count"],
                    }
                )
                if current_month.month == 12:
                    current_month = current_month.replace(year=current_month.year + 1, month=1)
                else:
                    current_month = current_month.replace(month=current_month.month + 1)

            schema = {
                "accepted_issues": "accepted_issues",
                "declined_issues": "declined_issues",
            }

            return Response(
                {"data": data, "schema": schema},
                status=status.HTTP_200_OK,
            )

        return Response({"message": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)
