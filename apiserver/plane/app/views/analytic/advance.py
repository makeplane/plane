from rest_framework.response import Response
from rest_framework import status

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
)

from django.db.models import (
    Q,
    Count,
)
from plane.utils.build_chart import build_analytics_chart
from datetime import timedelta
from plane.bgtasks.analytic_plot_export import export_analytics_to_csv_email
from plane.utils.date_utils import (
    get_analytics_filters,
)


class AdvanceAnalyticsBaseView(BaseAPIView):
    def initialize_workspace(self, slug, type):
        self._workspace_slug = slug
        self.filters = get_analytics_filters(
            slug=slug,
            type=type,
            user=self.request.user,
            date_filter=self.request.GET.get("date_filter", None),
            project_ids=self.request.GET.get("project_ids", None),
        )


class AdvanceAnalyticsEndpoint(AdvanceAnalyticsBaseView):
    def get_filtered_counts(self, queryset):
        def get_filtered_count():
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

        def get_previous_count():
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
            "filter_count": get_previous_count(),
        }

    def get_overview_data(self):
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

    def get_work_items_stats(self):
        base_queryset = Issue.objects.filter(**self.filters["base_filters"])

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
    def get(self, request, slug):
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

        return Response({"message": "Invalid tab"}, status=status.HTTP_400_BAD_REQUEST)


class AdvanceAnalyticsStatsEndpoint(AdvanceAnalyticsBaseView):
    def get_project_issues_stats(self):
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

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        self.initialize_workspace(slug, type="chart")
        type = request.GET.get("type", "work-items")

        if type == "work-items":
            return Response(
                self.get_project_issues_stats(),
                status=status.HTTP_200_OK,
            )

        return Response({"message": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)


class AdvanceAnalyticsChartEndpoint(AdvanceAnalyticsBaseView):
    def project_chart(self):
        # Get the base queryset with workspace and project filters
        base_queryset = Issue.issue_objects.filter(**self.filters["base_filters"])

        # Apply date range filter if available
        if self.filters["chart_period_range"]:
            start_date, end_date = self.filters["chart_period_range"]
            date_filter = {
                "created_at__date__gte": start_date,
                "created_at__date__lte": end_date,
            }

        total_work_items = base_queryset.count()
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

    def work_item_completion_chart(self):
        # Get the base queryset
        queryset = (
            Issue.issue_objects.filter(**self.filters["base_filters"])
            .select_related("workspace", "state", "parent")
            .prefetch_related(
                "assignees", "labels", "issue_module__module", "issue_cycle__cycle"
            )
        )
        # Apply date range filter if available
        if self.filters["chart_period_range"]:
            start_date, end_date = self.filters["chart_period_range"]
            queryset = queryset.filter(
                created_at__date__gte=start_date, created_at__date__lte=end_date
            )

        # Get daily stats with optimized query
        daily_stats = (
            queryset.values("created_at__date")
            .annotate(
                created_count=Count("id"),
                completed_count=Count("id", filter=Q(completed_at__isnull=False)),
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
            stats = stats_dict.get(date_str, {"created_count": 0, "completed_count": 0})
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

        schema = {
            "completed_issues": "completed_issues",
            "created_issues": "created_issues",
        }

        return {"data": data, "schema": schema}

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        self.initialize_workspace(slug, type="chart")
        type = request.GET.get("type", "projects")
        group_by = request.GET.get("group_by", None)
        x_axis = request.GET.get("x_axis", "PRIORITY")

        if type == "projects":
            return Response(self.project_chart(), status=status.HTTP_200_OK)

        elif type == "custom-work-items":
            # Get the base queryset
            queryset = (
                Issue.issue_objects.filter(**self.filters["base_filters"])
                .select_related("workspace", "state", "parent")
                .prefetch_related(
                    "assignees", "labels", "issue_module__module", "issue_cycle__cycle"
                )
            )

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
            return Response(
                self.work_item_completion_chart(),
                status=status.HTTP_200_OK,
            )

        return Response({"message": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)


class AdvanceAnalyticsExportEndpoint(AdvanceAnalyticsBaseView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        self.initialize_workspace(slug, type="chart")
        data = (
            Issue.issue_objects.filter(**self.filters["base_filters"])
            .values("project_id", "project__name")
            .annotate(
                cancelled_work_items=Count("id", filter=Q(state__group="cancelled")),
                completed_work_items=Count("id", filter=Q(state__group="completed")),
                backlog_work_items=Count("id", filter=Q(state__group="backlog")),
                un_started_work_items=Count("id", filter=Q(state__group="unstarted")),
                started_work_items=Count("id", filter=Q(state__group="started")),
            )
            .order_by("project_id")
        )

        # Apply date range filter if available
        if self.filters["chart_period_range"]:
            start_date, end_date = self.filters["chart_period_range"]
            data = data.filter(
                created_at__date__gte=start_date, created_at__date__lte=end_date
            )

        # Convert QuerySet to list of dictionaries for serialization
        serialized_data = list(data)

        headers = [
            "Projects",
            "Completed Issues",
            "Backlog Issues",
            "Unstarted Issues",
            "Started Issues",
        ]

        keys = [
            "project__name",
            "completed_work_items",
            "backlog_work_items",
            "un_started_work_items",
            "started_work_items",
        ]

        email = request.user.email

        # Send serialized data to background task
        export_analytics_to_csv_email.delay(serialized_data, headers, keys, email, slug)

        return Response(
            {
                "message": f"Once the export is ready it will be emailed to you at {str(email)}"
            },
            status=status.HTTP_200_OK,
        )
