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
        if date_filter == "today":
            return {
                "current": {
                    "gte": now.replace(hour=0, minute=0, second=0, microsecond=0),
                    "lte": now,
                },
                "previous": {
                    "gte": (now - timedelta(days=1)).replace(
                        hour=0, minute=0, second=0, microsecond=0
                    ),
                    "lte": now - timedelta(days=1),
                },
            }
        elif date_filter == "yesterday":
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
        date_filter = request.GET.get("date_filter", "today")

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
        self.base_filters = {
            "workspace__slug": slug,
            "project__project_projectmember__member": self.request.user,
            "project__project_projectmember__is_active": True,
        }

    def project_stats(self, filters):
        return (
            Project.objects.filter(
                workspace__slug=self._workspace_slug,
                project_projectmember__member=self.request.user,
                project_projectmember__is_active=True,
            )
            .annotate(
                total_work_items=Count("project_issue", distinct=True),
                total_cycles=Count("project_cycle", distinct=True),
                total_modules=Count("project_module", distinct=True),
                total_intake=Count(
                    "project_issue",
                    filter=Q(project_issue__issue_intake__isnull=False),
                    distinct=True,
                ),
                total_members=Count(
                    "project_projectmember",
                    filter=Q(
                        project_projectmember__is_active=True,
                    ),
                    distinct=True,
                ),
                total_epics=Count(
                    "project_issue",
                    filter=Q(project_issue__type__is_epic=True),
                    distinct=True,
                ),
                total_pages=Count("project_pages", distinct=True),
                total_views=Count("project_issueview", distinct=True),
            )
            .values(
                "id",
                "name",
                "logo_props",
                "total_work_items",
                "total_cycles",
                "total_modules",
                "total_intake",
                "total_members",
                "total_epics",
                "total_pages",
                "total_views",
            )
        )

    def get_project_issues_stats(self, filters):
        qs = Issue.objects.filter(
            project__workspace__slug=self._workspace_slug,
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
            **filters,
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
        self.base_filters = {
            "workspace__slug": slug,
            "project_projectmember__member": self.request.user,
            "project_projectmember__is_active": True,
        }

    def project_chart(self, filters):
        project_ids = (
            Project.objects.filter(**self.base_filters)
            .values_list("id", flat=True)
            .distinct()
        )

        total_work_items = Issue.issue_objects.filter(
            project_id__in=project_ids
        ).count()
        total_cycles = Cycle.objects.filter(project_id__in=project_ids).count()
        total_modules = Module.objects.filter(project_id__in=project_ids).count()
        total_intake = Issue.objects.filter(
            project_id__in=project_ids, issue_intake__isnull=False
        ).count()
        total_members = WorkspaceMember.objects.filter(
            workspace__slug=self._workspace_slug, is_active=True
        ).count()

        total_epics = Issue.objects.filter(
            project_id__in=project_ids, type__is_epic=True
        ).count()
        total_pages = ProjectPage.objects.filter(project_id__in=project_ids).count()
        total_views = IssueView.objects.filter(project_id__in=project_ids).count()

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

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):

        self.initialize_workspace(slug)
        type = request.GET.get("type", "overview")
        filters = request.GET.get("filters", {})
        group_by = request.GET.get("group_by", None)
        x_axis = request.GET.get("x_axis", "PRIORITY")

        if type == "projects":
            return Response(self.project_chart(filters), status=status.HTTP_200_OK)

        elif type == "work-items":
            queryset = (
                Issue.issue_objects.filter(
                    workspace__slug=self._workspace_slug,
                    project__project_projectmember__member=self.request.user,
                    project__project_projectmember__is_active=True,
                )
                .select_related("workspace", "project", "state", "parent")
                .prefetch_related(
                    "assignees", "labels", "issue_module__module", "issue_cycle__cycle"
                )
            )
            return Response(
                build_analytics_chart(queryset, x_axis, group_by),
                status=status.HTTP_200_OK,
            )

        return Response({"message": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)
