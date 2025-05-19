from rest_framework.response import Response
from rest_framework import status
from typing import Dict, List, Any
from django.db.models import QuerySet, Q, Count
from django.http import HttpRequest
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
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
    CycleIssue,
    ModuleIssue,
)
from django.db import models
from django.db.models import F, Case, When, Value
from django.db.models.functions import Concat
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
                    created_at__gte=self.filters["analytics_date_range"]["current"][
                        "gte"
                    ],
                    created_at__lte=self.filters["analytics_date_range"]["current"][
                        "lte"
                    ],
                ).count()
            return queryset.count()

        def get_previous_count() -> int:
            if self.filters["analytics_date_range"] and self.filters[
                "analytics_date_range"
            ].get("previous"):
                return queryset.filter(
                    created_at__gte=self.filters["analytics_date_range"]["previous"][
                        "gte"
                    ],
                    created_at__lte=self.filters["analytics_date_range"]["previous"][
                        "lte"
                    ],
                ).count()
            return 0

        return {
            "count": get_filtered_count(),
            # "filter_count": get_previous_count(),
        }

    def get_overview_data(self) -> Dict[str, Dict[str, int]]:
        return {
            "total_users": self.get_filtered_counts(
                WorkspaceMember.objects.filter(
                    workspace__slug=self._workspace_slug, is_active=True
                )
            ),
            "total_admins": self.get_filtered_counts(
                WorkspaceMember.objects.filter(
                    workspace__slug=self._workspace_slug,
                    role=ROLE.ADMIN.value,
                    is_active=True,
                )
            ),
            "total_members": self.get_filtered_counts(
                WorkspaceMember.objects.filter(
                    workspace__slug=self._workspace_slug,
                    role=ROLE.MEMBER.value,
                    is_active=True,
                )
            ),
            "total_guests": self.get_filtered_counts(
                WorkspaceMember.objects.filter(
                    workspace__slug=self._workspace_slug,
                    role=ROLE.GUEST.value,
                    is_active=True,
                )
            ),
            "total_projects": self.get_filtered_counts(
                Project.objects.filter(**self.filters["project_filters"])
            ),
            "total_work_items": self.get_filtered_counts(
                Issue.issue_objects.filter(**self.filters["base_filters"])
            ),
            "total_cycles": self.get_filtered_counts(
                Cycle.objects.filter(**self.filters["base_filters"])
            ),
            "total_intake": self.get_filtered_counts(
                Issue.objects.filter(**self.filters["base_filters"]).filter(
                    issue_intake__isnull=False
                )
            ),
        }

    def get_work_items_stats(
        self, cycle_id=None, module_id=None
    ) -> Dict[str, Dict[str, int]]:
        """
        Returns work item stats for the workspace, or filtered by cycle_id or module_id if provided.
        """
        base_queryset = None
        if cycle_id is not None:
            cycle_issues = CycleIssue.objects.filter(
                **self.filters["base_filters"], cycle_id=cycle_id
            ).values_list("issue_id", flat=True)
            base_queryset = Issue.issue_objects.filter(id__in=cycle_issues)
        elif module_id is not None:
            module_issues = ModuleIssue.objects.filter(
                **self.filters["base_filters"], module_id=module_id
            ).values_list("issue_id", flat=True)
            base_queryset = Issue.issue_objects.filter(id__in=module_issues)
        else:
            base_queryset = Issue.issue_objects.filter(**self.filters["base_filters"])

        return {
            "total_work_items": self.get_filtered_counts(base_queryset),
            "started_work_items": self.get_filtered_counts(
                base_queryset.filter(state__group="started")
            ),
            "backlog_work_items": self.get_filtered_counts(
                base_queryset.filter(state__group="backlog")
            ),
            "un_started_work_items": self.get_filtered_counts(
                base_queryset.filter(state__group="unstarted")
            ),
            "completed_work_items": self.get_filtered_counts(
                base_queryset.filter(state__group="completed")
            ),
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
            # Optionally accept cycle_id or module_id as query params
            cycle_id = request.GET.get("cycle_id", None)
            module_id = request.GET.get("module_id", None)
            return Response(
                self.get_work_items_stats(cycle_id=cycle_id, module_id=module_id),
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
            base_queryset = base_queryset.filter(
                created_at__date__gte=start_date, created_at__date__lte=end_date
            )

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

    def get_work_items_stats(
        self, cycle_id=None, module_id=None, peek_view=False
    ) -> Dict[str, Dict[str, int]]:
        base_queryset = None
        if cycle_id is not None:
            cycle_issues = CycleIssue.objects.filter(
                **self.filters["base_filters"], cycle_id=cycle_id
            ).values_list("issue_id", flat=True)
            base_queryset = Issue.issue_objects.filter(id__in=cycle_issues)
        elif module_id is not None:
            module_issues = ModuleIssue.objects.filter(
                **self.filters["base_filters"], module_id=module_id
            ).values_list("issue_id", flat=True)
            base_queryset = Issue.issue_objects.filter(id__in=module_issues)
        elif peek_view:
            base_queryset = Issue.issue_objects.filter(**self.filters["base_filters"])
        else:
            base_queryset = Issue.issue_objects.filter(**self.filters["base_filters"])
            return (
                base_queryset.values("project_id", "project__name")
                .annotate(
                    cancelled_work_items=Count(
                        "id", filter=Q(state__group="cancelled")
                    ),
                    completed_work_items=Count(
                        "id", filter=Q(state__group="completed")
                    ),
                    backlog_work_items=Count("id", filter=Q(state__group="backlog")),
                    un_started_work_items=Count(
                        "id", filter=Q(state__group="unstarted")
                    ),
                    started_work_items=Count("id", filter=Q(state__group="started")),
                )
                .order_by("project_id")
            )

        return (
            base_queryset.annotate(display_name=F("assignees__display_name"))
            .annotate(assignee_id=F("assignees__id"))
            .annotate(avatar=F("assignees__avatar"))
            .annotate(
                avatar_url=Case(
                    # If `avatar_asset` exists, use it to generate the asset URL
                    When(
                        assignees__avatar_asset__isnull=False,
                        then=Concat(
                            Value("/api/assets/v2/static/"),
                            "assignees__avatar_asset",  # Assuming avatar_asset has an id or relevant field
                            Value("/"),
                        ),
                    ),
                    # If `avatar_asset` is None, fall back to using `avatar` field directly
                    When(
                        assignees__avatar_asset__isnull=True, then="assignees__avatar"
                    ),
                    default=Value(None),
                    output_field=models.CharField(),
                )
            )
            .values("display_name", "assignee_id", "avatar_url")
            .annotate(
                cancelled_work_items=Count(
                    "id", filter=Q(state__group="cancelled"), distinct=True
                ),
                completed_work_items=Count(
                    "id", filter=Q(state__group="completed"), distinct=True
                ),
                backlog_work_items=Count(
                    "id", filter=Q(state__group="backlog"), distinct=True
                ),
                un_started_work_items=Count(
                    "id", filter=Q(state__group="unstarted"), distinct=True
                ),
                started_work_items=Count(
                    "id", filter=Q(state__group="started"), distinct=True
                ),
            )
            .order_by("display_name")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request: HttpRequest, slug: str) -> Response:
        self.initialize_workspace(slug, type="chart")
        type = request.GET.get("type", "work-items")

        if type == "work-items":
            # Optionally accept cycle_id or module_id as query params
            cycle_id = request.GET.get("cycle_id", None)
            module_id = request.GET.get("module_id", None)
            peek_view = request.GET.get("peek_view", False)
            return Response(
                self.get_work_items_stats(
                    cycle_id=cycle_id, module_id=module_id, peek_view=peek_view
                ),
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
        total_cycles = Cycle.objects.filter(
            **self.filters["base_filters"], **date_filter
        ).count()
        total_modules = Module.objects.filter(
            **self.filters["base_filters"], **date_filter
        ).count()
        total_intake = Issue.objects.filter(
            issue_intake__isnull=False, **self.filters["base_filters"], **date_filter
        ).count()
        total_members = WorkspaceMember.objects.filter(
            workspace__slug=self._workspace_slug, is_active=True, **date_filter
        ).count()
        total_pages = ProjectPage.objects.filter(
            **self.filters["base_filters"], **date_filter
        ).count()
        total_views = IssueView.objects.filter(
            **self.filters["base_filters"], **date_filter
        ).count()

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

    def work_item_completion_chart(
        self, cycle_id=None, module_id=None, peek_view=False
    ) -> Dict[str, Any]:
        # Get the base queryset
        queryset = (
            Issue.issue_objects.filter(**self.filters["base_filters"])
            .select_related("workspace", "state", "parent")
            .prefetch_related(
                "assignees", "labels", "issue_module__module", "issue_cycle__cycle"
            )
        )

        if cycle_id is not None and peek_view:
            cycle_issues = CycleIssue.objects.filter(
                **self.filters["base_filters"], cycle_id=cycle_id
            ).values_list("issue_id", flat=True)
            cycle = Cycle.objects.filter(id=cycle_id).first()
            if cycle and cycle.start_date:
                start_date = cycle.start_date.date()
                end_date = cycle.end_date.date()
            else:
                return {"data": [], "schema": {}}
            queryset = cycle_issues
        elif module_id is not None and peek_view:
            module_issues = ModuleIssue.objects.filter(
                **self.filters["base_filters"], module_id=module_id
            ).values_list("issue_id", flat=True)
            module = Module.objects.filter(id=module_id).first()
            if module and module.start_date:
                start_date = module.start_date
                end_date = module.target_date
            else:
                return {"data": [], "schema": {}}
            queryset = module_issues
        elif peek_view:
            project_ids_str = self.request.GET.get("project_ids")
            if project_ids_str:
                project_id_list = [
                    pid.strip() for pid in project_ids_str.split(",") if pid.strip()
                ]
            else:
                project_id_list = []
                return {"data": [], "schema": {}}
            project_id = project_id_list[0]
            project = Project.objects.filter(id=project_id).first()
            if project.created_at:
                start_date = project.created_at.date().replace(day=1)
            else:
                return {"data": [], "schema": {}}
        else:
            workspace = Workspace.objects.get(slug=self._workspace_slug)
            start_date = workspace.created_at.date().replace(day=1)

        if cycle_id or module_id:
            # Get daily stats with optimized query
            daily_stats = (
                queryset.values("created_at__date")
                .annotate(
                    created_count=Count("id"),
                    completed_count=Count(
                        "id", filter=Q(issue__state__group="completed")
                    ),
                )
                .order_by("created_at__date")
            )

            # Create a dictionary of existing stats with summed counts
            stats_dict = {
                stat["created_at__date"].strftime("%Y-%m-%d"): {
                    "created_count": stat["created_count"],
                    "completed_count": stat["completed_count"],
                }
                for stat in daily_stats
            }

            # Generate data for all days in the range
            data = []
            current_date = start_date
            while current_date <= end_date:
                date_str = current_date.strftime("%Y-%m-%d")
                stats = stats_dict.get(
                    date_str, {"created_count": 0, "completed_count": 0}
                )
                data.append(
                    {
                        "key": date_str,
                        "name": date_str,
                        "count": stats["created_count"] + stats["completed_count"],
                        "completed_issues": stats["completed_count"],
                        "created_issues": stats["created_count"],
                    }
                )
                current_date += timedelta(days=1)
        else:
            # Apply date range filter if available
            if self.filters["chart_period_range"]:
                start_date, end_date = self.filters["chart_period_range"]
                queryset = queryset.filter(
                    created_at__date__gte=start_date, created_at__date__lte=end_date
                )

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
                stats = stats_dict.get(
                    date_str, {"created_count": 0, "completed_count": 0}
                )
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
                    current_month = current_month.replace(
                        year=current_month.year + 1, month=1
                    )
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
        cycle_id = request.GET.get("cycle_id", None)
        module_id = request.GET.get("module_id", None)

        if type == "projects":
            return Response(self.project_chart(), status=status.HTTP_200_OK)

        elif type == "custom-work-items":
            queryset = (
                Issue.issue_objects.filter(**self.filters["base_filters"])
                .select_related("workspace", "state", "parent")
                .prefetch_related(
                    "assignees", "labels", "issue_module__module", "issue_cycle__cycle"
                )
            )

            # Apply cycle/module filters if present
            if cycle_id is not None:
                cycle_issues = CycleIssue.objects.filter(
                    **self.filters["base_filters"], cycle_id=cycle_id
                ).values_list("issue_id", flat=True)
                queryset = queryset.filter(id__in=cycle_issues)

            elif module_id is not None:
                module_issues = ModuleIssue.objects.filter(
                    **self.filters["base_filters"], module_id=module_id
                ).values_list("issue_id", flat=True)
                queryset = queryset.filter(id__in=module_issues)

            # Apply date range filter if available
            if self.filters["chart_period_range"]:
                start_date, end_date = self.filters["chart_period_range"]
                queryset = queryset.filter(
                    created_at__date__gte=start_date, created_at__date__lte=end_date
                )

            return Response(
                build_analytics_chart(queryset, x_axis, group_by),
                status=status.HTTP_200_OK,
            )

        elif type == "work-items":
            # Optionally accept cycle_id or module_id as query params
            cycle_id = request.GET.get("cycle_id", None)
            module_id = request.GET.get("module_id", None)
            peek_view = request.GET.get("peek_view", False)
            return Response(
                self.work_item_completion_chart(
                    cycle_id=cycle_id, module_id=module_id, peek_view=peek_view
                ),
                status=status.HTTP_200_OK,
            )

        return Response({"message": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)
