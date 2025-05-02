from datetime import datetime

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

from django.utils import timezone
from django.db.models import (
    Q,
    Count,
)
from plane.utils.build_chart import build_analytics_chart
from datetime import timedelta
from django.db.models.functions import TruncDay
from plane.bgtasks.analytic_plot_export import export_analytics_to_csv_email


class AdvanceAnalyticsEndpoint(BaseAPIView):
    def initialize_workspace(self, slug):
        self._workspace_slug = slug
        project_ids = self.request.GET.get("project_ids", None)
        self.base_filters = {
            "workspace__slug": slug,
            "project__project_projectmember__member": self.request.user,
            "project__project_projectmember__is_active": True,
        }

        self.project_filters = {
            "workspace__slug": slug,
            "project_projectmember__member": self.request.user,
            "project_projectmember__is_active": True,
        }

        if project_ids:
            if isinstance(project_ids, str):
                project_ids = [str(project_id) for project_id in project_ids.split(",")]
            self.base_filters["project_id__in"] = project_ids
            self.project_filters["id__in"] = project_ids

    def get_date_filters(self, date_filter):
        now = timezone.now()
        if date_filter == "yesterday":
            return {
                "current": {
                    "gte": (now - timedelta(days=1)).replace(
                        hour=0, minute=0, second=0, microsecond=0
                    ),
                    "lte": now - timedelta(days=1),
                },
                "previous": {
                    "gte": (now - timedelta(days=2)).replace(
                        hour=0, minute=0, second=0, microsecond=0
                    ),
                    "lte": now - timedelta(days=2),
                },
            }
        elif date_filter == "last_7_days":
            return {
                "current": {"gte": now - timedelta(days=7), "lte": now},
                "previous": {
                    "gte": now - timedelta(days=14),
                    "lte": now - timedelta(days=7),
                },
            }
        elif date_filter == "last_30_days":
            return {
                "current": {"gte": now - timedelta(days=30), "lte": now},
                "previous": {
                    "gte": now - timedelta(days=60),
                    "lte": now - timedelta(days=30),
                },
            }
        elif date_filter == "last_3_months":
            return {
                "current": {"gte": now - timedelta(days=90), "lte": now},
                "previous": {
                    "gte": now - timedelta(days=180),
                    "lte": now - timedelta(days=90),
                },
            }
        return None

    def get_filtered_counts(self, queryset, date_filters):
        def get_filtered_count():
            if date_filters:
                return queryset.filter(
                    created_at__gte=date_filters["current"]["gte"],
                    created_at__lte=date_filters["current"]["lte"],
                ).count()
            return queryset.count()

        def get_previous_count():
            if date_filters:
                return queryset.filter(
                    created_at__gte=date_filters["previous"]["gte"],
                    created_at__lte=date_filters["previous"]["lte"],
                ).count()
            return 0

        return {
            "count": get_filtered_count(),
            "filter_count": get_previous_count(),
        }

    def get_overview_data(self, date_filter, project_ids):
        date_filters = self.get_date_filters(date_filter)

        return {
            "total_users": self.get_filtered_counts(
                WorkspaceMember.objects.filter(
                    workspace__slug=self._workspace_slug, is_active=True
                ),
                date_filters,
            ),
            "total_admins": self.get_filtered_counts(
                WorkspaceMember.objects.filter(
                    workspace__slug=self._workspace_slug,
                    role=ROLE.ADMIN.value,
                    is_active=True,
                ),
                date_filters,
            ),
            "total_members": self.get_filtered_counts(
                WorkspaceMember.objects.filter(
                    workspace__slug=self._workspace_slug,
                    role=ROLE.MEMBER.value,
                    is_active=True,
                ),
                date_filters,
            ),
            "total_guests": self.get_filtered_counts(
                WorkspaceMember.objects.filter(
                    workspace__slug=self._workspace_slug,
                    role=ROLE.GUEST.value,
                    is_active=True,
                ),
                date_filters,
            ),
            "total_projects": self.get_filtered_counts(
                Project.objects.filter(**self.project_filters),
                date_filters,
            ),
            "total_work_items": self.get_filtered_counts(
                Issue.issue_objects.filter(**self.base_filters), date_filters
            ),
            "total_cycles": self.get_filtered_counts(
                Cycle.objects.filter(**self.base_filters), date_filters
            ),
            "total_intake": self.get_filtered_counts(
                Issue.objects.filter(**self.base_filters).filter(
                    issue_intake__isnull=False
                ),
                date_filters,
            ),
        }

    def get_work_items_stats(self, date_filter, project_ids):
        date_filters = self.get_date_filters(date_filter)
        base_queryset = Issue.objects.filter(**self.base_filters)

        return {
            "total_work_items": self.get_filtered_counts(base_queryset, date_filters),
            "started_work_items": self.get_filtered_counts(
                base_queryset.filter(state__group="started"), date_filters
            ),
            "backlog_work_items": self.get_filtered_counts(
                base_queryset.filter(state__group="backlog"), date_filters
            ),
            "un_started_work_items": self.get_filtered_counts(
                base_queryset.filter(state__group="un-started"), date_filters
            ),
            "completed_work_items": self.get_filtered_counts(
                base_queryset.filter(state__group="completed"), date_filters
            ),
        }

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        self.initialize_workspace(slug)
        tab = request.GET.get("tab", "overview")
        project_ids = request.GET.get("project_ids", None)
        date_filter = request.GET.get("date_filter", "yesterday")

        if project_ids:
            project_ids = [str(project_id) for project_id in project_ids.split(",")]

        if tab == "overview":
            return Response(
                self.get_overview_data(date_filter, project_ids),
                status=status.HTTP_200_OK,
            )

        elif tab == "work-items":
            return Response(
                self.get_work_items_stats(date_filter, project_ids),
                status=status.HTTP_200_OK,
            )

        return Response({"message": "Invalid tab"}, status=status.HTTP_400_BAD_REQUEST)


class AdvanceAnalyticsStatsEndpoint(BaseAPIView):

    def initialize_workspace(self, slug):
        self._workspace_slug = slug
        project_ids = self.request.GET.get("project_ids", None)
        self.base_filters = {
            "workspace__slug": slug,
            "project__project_projectmember__member": self.request.user,
            "project__project_projectmember__is_active": True,
        }

        self.project_filters = {
            "workspace__slug": slug,
            "project_projectmember__member": self.request.user,
            "project_projectmember__is_active": True,
        }

        if project_ids:
            if isinstance(project_ids, str):
                project_ids = [str(project_id) for project_id in project_ids.split(",")]
            self.base_filters["project_id__in"] = project_ids
            self.project_filters["id__in"] = project_ids

    def get_project_issues_stats(self, filters):
        qs = Issue.objects.filter(
            **filters,
            **self.base_filters,
        )

        return (
            qs.values("project_id", "project__name")
            .annotate(
                cancelled_work_items=Count("id", filter=Q(state__group="cancelled")),
                completed_work_items=Count("id", filter=Q(state__group="completed")),
                backlog_work_items=Count("id", filter=Q(state__group="backlog")),
                un_started_work_items=Count("id", filter=Q(state__group="un-started")),
                started_work_items=Count("id", filter=Q(state__group="started")),
            )
            .order_by("project_id")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        self.initialize_workspace(slug)
        type = request.GET.get("type", "overview")
        filters = request.GET.get("filters", {})

        if type == "work-items":
            return Response(
                self.get_project_issues_stats(filters), status=status.HTTP_200_OK
            )

        return Response({"message": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)


class AdvanceAnalyticsChartEndpoint(BaseAPIView):

    def initialize_workspace(self, slug):
        self._workspace_slug = slug
        project_ids = self.request.GET.get("project_ids", None)
        self.base_filters = {
            "workspace__slug": slug,
            "project__project_projectmember__member": self.request.user,
            "project__project_projectmember__is_active": True,
        }

        self.project_filters = {
            "workspace__slug": slug,
            "project_projectmember__member": self.request.user,
            "project_projectmember__is_active": True,
        }

        if project_ids:
            if isinstance(project_ids, str):
                project_ids = [str(project_id) for project_id in project_ids.split(",")]
            self.base_filters["project_id__in"] = project_ids
            self.project_filters["id__in"] = project_ids

    def project_chart(self, filters):

        total_work_items = Issue.issue_objects.filter(**self.base_filters).count()
        total_cycles = Cycle.objects.filter(**self.base_filters).count()
        total_modules = Module.objects.filter(**self.base_filters).count()
        total_intake = Issue.objects.filter(
            issue_intake__isnull=False, **self.base_filters
        ).count()
        total_members = WorkspaceMember.objects.filter(
            workspace__slug=self._workspace_slug, is_active=True
        ).count()

        total_epics = Issue.objects.filter(
            type__is_epic=True, **self.base_filters
        ).count()
        total_pages = ProjectPage.objects.filter(**self.base_filters).count()
        total_views = IssueView.objects.filter(**self.base_filters).count()

        data = {
            "work_items": total_work_items,
            "cycles": total_cycles,
            "modules": total_modules,
            "intake": total_intake,
            "members": total_members,
            "epics": total_epics,
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

    def work_item_completion_chart(self, filters, date_filter="last_30_days"):
        # Get the base queryset
        queryset = (
            Issue.issue_objects.filter(**self.base_filters)
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related(
                "assignees", "labels", "issue_module__module", "issue_cycle__cycle"
            )
        )

        # Apply any additional filters
        if filters:
            queryset = queryset.filter(**filters)

        # Get the date range
        today = timezone.now().date()
        date_ranges = {
            "yesterday": (
                today - timedelta(days=1),
                today - timedelta(days=1),
            ),
            "last_7_days": (today - timedelta(days=7), today),
            "last_30_days": (today - timedelta(days=30), today),
            "last_3_months": (today - timedelta(days=90), today),
        }

        # Handle custom date range if provided in filters
        if (
            isinstance(filters, dict)
            and "start_date" in filters
            and "end_date" in filters
        ):
            try:
                start_date = datetime.strptime(filters["start_date"], "%Y-%m-%d").date()
                end_date = datetime.strptime(filters["end_date"], "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            start_date, end_date = date_ranges.get(
                date_filter, date_ranges["last_30_days"]
            )

        # Get daily stats
        daily_stats = (
            queryset.filter(
                Q(created_at__date__gte=start_date, created_at__date__lte=end_date)
                | Q(
                    completed_at__date__gte=start_date, completed_at__date__lte=end_date
                )
            )
            .annotate(
                date=TruncDay("created_at"),
                created_count=Count(
                    "id",
                    filter=Q(
                        created_at__date__gte=start_date, created_at__date__lte=end_date
                    ),
                ),
                completed_count=Count(
                    "id",
                    filter=Q(
                        completed_at__date__gte=start_date,
                        completed_at__date__lte=end_date,
                    ),
                ),
            )
            .values("date", "created_count", "completed_count")
            .order_by("date")
        )

        # Create a dictionary of existing stats
        stats_dict = {
            stat["date"].strftime("%Y-%m-%d"): {
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
        self.initialize_workspace(slug)
        type = request.GET.get("type", "overview")
        filters = request.GET.get("filters", {})
        group_by = request.GET.get("group_by", None)
        x_axis = request.GET.get("x_axis", "PRIORITY")
        date_filter = request.GET.get("date_filter", "last_30_days")

        if type == "projects":
            return Response(self.project_chart(filters), status=status.HTTP_200_OK)

        elif type == "custom-work-items":
            queryset = (
                Issue.issue_objects.filter(**self.base_filters)
                .select_related("workspace", "project", "state", "parent")
                .prefetch_related(
                    "assignees", "labels", "issue_module__module", "issue_cycle__cycle"
                )
            )
            return Response(
                build_analytics_chart(queryset, x_axis, group_by),
                status=status.HTTP_200_OK,
            )

        elif type == "work-items":
            return Response(
                self.work_item_completion_chart(filters, date_filter),
                status=status.HTTP_200_OK,
            )

        return Response({"message": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)


class AdvanceAnalyticsExportEndpoint(BaseAPIView):

    def initialize_workspace(self, slug):
        self._workspace_slug = slug
        project_ids = self.request.GET.get("project_ids", None)
        self.base_filters = {
            "workspace__slug": slug,
            "project__project_projectmember__member": self.request.user,
            "project__project_projectmember__is_active": True,
        }

        self.project_filters = {
            "workspace__slug": slug,
            "project_projectmember__member": self.request.user,
            "project_projectmember__is_active": True,
        }

        if project_ids:
            if isinstance(project_ids, str):
                project_ids = [str(project_id) for project_id in project_ids.split(",")]
            self.base_filters["project_id__in"] = project_ids
            self.project_filters["id__in"] = project_ids

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        filters = request.GET.get("filters", {})

        data = (
            Issue.objects.filter(
                workspace__slug=slug,
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                **filters,
                **self.base_filters,
            )
            .values("project_id", "project__name")
            .annotate(
                cancelled_work_items=Count("id", filter=Q(state__group="cancelled")),
                completed_work_items=Count("id", filter=Q(state__group="completed")),
                backlog_work_items=Count("id", filter=Q(state__group="backlog")),
                un_started_work_items=Count("id", filter=Q(state__group="un-started")),
                started_work_items=Count("id", filter=Q(state__group="started")),
            )
            .order_by("project_id")
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
