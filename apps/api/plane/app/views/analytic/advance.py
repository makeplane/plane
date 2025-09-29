from rest_framework.response import Response
from rest_framework import status
from typing import Dict, List, Any

from django.db.models import QuerySet, Q, Count
from django.http import HttpRequest
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.db.models.functions import Cast
from django.db.models.fields.json import KeyTextTransform

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
from plane.ee.models import EntityUpdates, ProjectAttribute
from plane.utils.build_chart import build_analytics_chart
from plane.utils.date_utils import (
    get_analytics_filters,
)
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from django.db.models import Max
from django.db import models
from django.db.models import Case, When, Value, F, CharField
from django.db.models.functions import Concat
from plane.payment.flags.flag_decorator import ErrorCodes


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

    def get_users_stats(self) -> Dict[str, Dict[str, int]]:
        members_query = WorkspaceMember.objects.filter(
            workspace__slug=self._workspace_slug,
            is_active=True,
            member__is_bot=False,
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
        }

    def get_projects_stats(self) -> Dict[str, Dict[str, int]]:
        latest_updates = EntityUpdates.objects.filter(
            **self.filters["base_filters"],
            entity_type="PROJECT",
            created_at__in=EntityUpdates.objects.filter(**self.filters["base_filters"], entity_type="PROJECT")
            .values("project_id")
            .annotate(latest_created_at=Max("created_at"))
            .values("latest_created_at"),
        ).order_by("project_id", "-created_at")

        return {
            "total_projects": self.get_filtered_counts(
                Project.objects.filter(**self.filters["project_filters"]),
            ),
            "on_track_updates": self.get_filtered_counts(
                latest_updates.filter(status="ON-TRACK"),
            ),
            "off_track_updates": self.get_filtered_counts(
                latest_updates.filter(status="OFF-TRACK"),
            ),
            "at_risk_updates": self.get_filtered_counts(
                latest_updates.filter(status="AT-RISK"),
            ),
        }

    def get_cycles_stats(self) -> Dict[str, Dict[str, int]]:
        base_queryset = Cycle.objects.filter(**self.filters["base_filters"])

        return {
            "total_cycles": self.get_filtered_counts(base_queryset),
            "current_cycles": self.get_filtered_counts(
                base_queryset.filter(start_date__lte=timezone.now(), end_date__gte=timezone.now()),
            ),
            "upcoming_cycles": self.get_filtered_counts(base_queryset.filter(start_date__gte=timezone.now())),
            "completed_cycles": self.get_filtered_counts(base_queryset.filter(end_date__lte=timezone.now())),
        }

    def get_module_stats(self) -> Dict[str, Dict[str, int]]:
        base_queryset = Module.objects.filter(**self.filters["base_filters"])

        return {
            "total_modules": self.get_filtered_counts(base_queryset),
            "completed_modules": self.get_filtered_counts(base_queryset.filter(status="completed")),
            "in_progress_modules": self.get_filtered_counts(base_queryset.filter(status="in-progress")),
            "planned_modules": self.get_filtered_counts(base_queryset.filter(status="planned")),
            "paused_modules": self.get_filtered_counts(base_queryset.filter(status="paused")),
        }

    def get_intake_stats(self) -> Dict[str, Dict[str, int]]:
        base_queryset = Issue.objects.filter(**self.filters["base_filters"]).filter(
            issue_intake__isnull=False,
            issue_intake__status__in=["-2", "-1", "0", "1", "2"],
        )

        return {
            "total_intake": self.get_filtered_counts(base_queryset),
            "accepted_intake": self.get_filtered_counts(base_queryset.filter(issue_intake__status=1)),
            "rejected_intake": self.get_filtered_counts(base_queryset.filter(issue_intake__status=-1)),
            "duplicate_intake": self.get_filtered_counts(base_queryset.filter(issue_intake__status=2)),
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

        if check_workspace_feature_flag(
            feature_key=FeatureFlag.ANALYTICS_ADVANCED,
            slug=slug,
            user_id=str(request.user.id),
        ):
            if tab == "users":
                return Response(
                    self.get_users_stats(),
                    status=status.HTTP_200_OK,
                )
            elif tab == "projects":
                return Response(
                    self.get_projects_stats(),
                    status=status.HTTP_200_OK,
                )
            elif tab == "work-items":
                return Response(
                    self.get_work_items_stats(),
                    status=status.HTTP_200_OK,
                )
            elif tab == "cycles":
                return Response(
                    self.get_cycles_stats(),
                    status=status.HTTP_200_OK,
                )
            elif tab == "modules":
                return Response(
                    self.get_module_stats(),
                    status=status.HTTP_200_OK,
                )
            elif tab == "intake":
                return Response(
                    self.get_intake_stats(),
                    status=status.HTTP_200_OK,
                )
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
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

    def get_work_items_stats(self) -> QuerySet:
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

    def get_project_stats(self) -> List[Dict[str, Any]]:
        # Get all project stats in a single query using annotations
        projects = (
            Project.objects.filter(**self.filters["project_filters"])
            .annotate(
                # Issue stats
                total_work_items=Count(
                    "project_issue",
                    filter=Q(
                        project_issue__archived_at__isnull=True,
                        project_issue__is_draft=False,
                    ),
                    distinct=True,
                ),
                completed_work_items=Count(
                    "project_issue",
                    filter=Q(
                        project_issue__archived_at__isnull=True,
                        project_issue__is_draft=False,
                        project_issue__state__group="completed",
                    ),
                    distinct=True,
                ),
                total_epics=Count(
                    "project_issue",
                    filter=Q(
                        project_issue__archived_at__isnull=True,
                        project_issue__is_draft=False,
                        project_issue__type__is_epic=True,
                    ),
                    distinct=True,
                ),
                total_intake=Count(
                    "project_issue",
                    filter=Q(
                        project_issue__archived_at__isnull=True,
                        project_issue__is_draft=False,
                        project_issue__issue_intake__isnull=False,
                        project_issue__issue_intake__status__in=[
                            "-2",
                            "-1",
                            "0",
                            "1",
                            "2",
                        ],
                    ),
                    distinct=True,
                ),
                # Cycle stats
                total_cycles=Count(
                    "project_cycle",
                    filter=Q(project_cycle__archived_at__isnull=True),
                    distinct=True,
                ),
                # Module stats
                total_modules=Count(
                    "project_module",
                    filter=Q(project_module__archived_at__isnull=True),
                    distinct=True,
                ),
                # Member stats
                total_members=Count(
                    "project_projectmember",
                    filter=Q(
                        project_projectmember__is_active=True,
                        project_projectmember__member__is_bot=False,
                    ),
                    distinct=True,
                ),
                # Page stats
                total_pages=Count(
                    "project_pages",
                    filter=Q(project_pages__page__archived_at__isnull=True),
                    distinct=True,
                ),
                # View stats
                total_views=Count(
                    "project_issueview",
                    distinct=True,
                ),
            )
            .values(
                "id",
                "name",
                "logo_props",
                "identifier",
                "total_work_items",
                "completed_work_items",
                "total_epics",
                "total_intake",
                "total_cycles",
                "total_modules",
                "total_members",
                "total_pages",
                "total_views",
            )
        )

        return list(projects)

    def get_users_stats(self) -> QuerySet:
        # First get all project members
        if self.request.GET.get("project_ids", None):
            project_ids = [str(project_id) for project_id in self.request.GET.get("project_ids", "").split(",")]
            member_ids = ProjectMember.objects.filter(
                project_id__in=project_ids, is_active=True, member__is_bot=False
            ).values_list("member_id", flat=True)
        else:
            member_ids = WorkspaceMember.objects.filter(
                workspace__slug=self._workspace_slug,
                is_active=True,
                member__is_bot=False,
            ).values_list("member_id", flat=True)

        # Get stats for all members in a single query
        return (
            Issue.issue_objects.filter(
                **self.filters["base_filters"],
            )
            .annotate(
                display_name=Case(
                    When(Q(created_by__in=member_ids), then=F("created_by__display_name")),
                    When(Q(assignees__in=member_ids), then=F("assignees__display_name")),
                    default=Value(None),
                    output_field=models.CharField(),
                ),
                user_id=Case(
                    When(Q(created_by__in=member_ids), then=F("created_by")),
                    When(Q(assignees__in=member_ids), then=F("assignees__id")),
                    default=Value(None),
                    output_field=models.CharField(),
                ),
                avatar=Case(
                    When(Q(created_by__in=member_ids), then=F("created_by__avatar")),
                    When(Q(assignees__in=member_ids), then=F("assignees__avatar")),
                    default=Value(None),
                    output_field=models.CharField(),
                ),
                avatar_url=Case(
                    When(
                        Q(created_by__in=member_ids) & Q(created_by__avatar_asset__isnull=False),
                        then=Concat(
                            Value("/api/assets/v2/static/"),
                            "created_by__avatar_asset",
                            Value("/"),
                        ),
                    ),
                    When(
                        Q(assignees__in=member_ids) & Q(assignees__avatar_asset__isnull=False),
                        then=Concat(
                            Value("/api/assets/v2/static/"),
                            "assignees__avatar_asset",
                            Value("/"),
                        ),
                    ),
                    When(Q(created_by__in=member_ids), then=F("created_by__avatar")),
                    When(Q(assignees__in=member_ids), then=F("assignees__avatar")),
                    default=Value(None),
                    output_field=models.CharField(),
                ),
            )
            .values("display_name", "user_id", "avatar_url")
            .annotate(
                cancelled_work_items=Count(
                    "id",
                    filter=Q(state__group="cancelled") & Q(assignees__in=member_ids),
                    distinct=True,
                ),
                completed_work_items=Count(
                    "id",
                    filter=Q(state__group="completed") & Q(assignees__in=member_ids),
                    distinct=True,
                ),
                backlog_work_items=Count(
                    "id",
                    filter=Q(state__group="backlog") & Q(assignees__in=member_ids),
                    distinct=True,
                ),
                un_started_work_items=Count(
                    "id",
                    filter=Q(state__group="unstarted") & Q(assignees__in=member_ids),
                    distinct=True,
                ),
                started_work_items=Count(
                    "id",
                    filter=Q(state__group="started") & Q(assignees__in=member_ids),
                    distinct=True,
                ),
                created_work_items=Count("id", filter=Q(created_by__in=member_ids), distinct=True),
            )
            .order_by("display_name")
        )

    def get_cycle_stats(self, filters: Dict[str, Any]) -> QuerySet:
        qs = Cycle.objects.filter(
            **self.filters["base_filters"],
        )

        return (
            qs.values(
                "id",
                "name",
                "project__name",
                "project__logo_props",
                "owned_by_id",
                "start_date",
                "end_date",
            )
            .annotate(
                total_issues=Count(
                    "issue_cycle__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                completed_issues=Count(
                    "issue_cycle__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_cycle__issue__state__group="completed",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                status=Case(
                    When(
                        Q(start_date__lte=timezone.now()) & Q(end_date__gte=timezone.now()),
                        then=Value("CURRENT"),
                    ),
                    When(start_date__gt=timezone.now(), then=Value("UPCOMING")),
                    When(end_date__lt=timezone.now(), then=Value("COMPLETED")),
                    When(
                        Q(start_date__isnull=True) & Q(end_date__isnull=True),
                        then=Value("DRAFT"),
                    ),
                    default=Value("DRAFT"),
                    output_field=CharField(),
                )
            )
        )

    def get_module_stats(self, filters: Dict[str, Any]) -> QuerySet:
        qs = Module.objects.filter(
            **self.filters["base_filters"],
        )

        return (
            qs.values(
                "id",
                "name",
                "project__name",
                "project__logo_props",
                "start_date",
                "target_date",
                "lead_id",
                "status",
            )
            .annotate(
                total_issues=Count(
                    "issue_module__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                completed_issues=Count(
                    "issue_module__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_module__issue__state__group="completed",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                )
            )
        )

    def get_intake_stats(self, filters: Dict[str, Any]) -> QuerySet:
        qs = Issue.objects.filter(
            **self.filters["base_filters"],
        ).filter(
            issue_intake__isnull=False,
            issue_intake__status__in=["-2", "-1", "0", "1", "2"],
        )

        return qs.values("project_id", "project__name", "project__logo_props").annotate(
            total_work_items=Count("issue_intake__issue_id"),
            accepted_intake=Count("issue_intake__issue_id", filter=Q(issue_intake__status=1)),
            rejected_intake=Count("issue_intake__issue_id", filter=Q(issue_intake__status=-1)),
            duplicate_intake=Count("issue_intake__issue_id", filter=Q(issue_intake__status=2)),
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

        if check_workspace_feature_flag(
            feature_key=FeatureFlag.ANALYTICS_ADVANCED,
            slug=slug,
            user_id=str(request.user.id),
        ):
            if type == "users":
                return Response(
                    self.get_users_stats(),
                    status=status.HTTP_200_OK,
                )
            elif type == "projects":
                return Response(
                    self.get_project_stats(),
                    status=status.HTTP_200_OK,
                )
            elif type == "cycles":
                return Response(
                    self.get_cycle_stats(self.filters["base_filters"]),
                    status=status.HTTP_200_OK,
                )
            elif type == "modules":
                return Response(
                    self.get_module_stats(self.filters["base_filters"]),
                    status=status.HTTP_200_OK,
                )
            elif type == "intake":
                return Response(
                    self.get_intake_stats(self.filters["base_filters"]),
                    status=status.HTTP_200_OK,
                )
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        return Response({"message": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)


# TODO : Add pagination for the charts
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
            issue_intake__isnull=False,
            issue_intake__status__in=["-2", "-1", "0", "1", "2"],
            **self.filters["base_filters"],
            **date_filter,
        ).count()
        total_members = WorkspaceMember.objects.filter(
            workspace__slug=self._workspace_slug,
            is_active=True,
            member__is_bot=False,
            **date_filter,
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
        current_year = timezone.now().year
        start_date = timezone.datetime(current_year, 1, 1).date()
        end_date = timezone.datetime(current_year, 12, 1).date()
        current_month = start_date

        while current_month <= end_date:
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

    def project_status_chart(self) -> Dict[str, Any]:
        # Get the base queryset
        queryset = (
            ProjectAttribute.objects.filter(**self.filters["base_filters"])
            .values("state__group")
            .annotate(
                count=Count("project", distinct=True),
                states=Count("state", distinct=True),
            )
            .order_by("state__group")
        )

        # Transform data into required format
        data = [
            {
                "key": item["state__group"],
                "name": item["state__group"],
                "count": item["count"],
            }
            for item in queryset
        ]

        return {"data": data, "schema": {}}

    def cycle_chart(self) -> Dict[str, Any]:
        # Get the base queryset
        queryset = (
            Cycle.objects.filter(**self.filters["base_filters"])
            .values("id", "name", "progress_snapshot", "start_date", "end_date")
            .annotate(
                total_issues=Case(
                    When(
                        Q(progress_snapshot__isnull=False) & ~Q(progress_snapshot={}),
                        then=Cast(
                            KeyTextTransform("total_issues", "progress_snapshot"),
                            output_field=models.IntegerField(),
                        ),
                    ),
                    default=Count(
                        "issue_cycle__issue__id",
                        distinct=True,
                        filter=Q(
                            issue_cycle__issue__archived_at__isnull=True,
                            issue_cycle__issue__is_draft=False,
                            issue_cycle__issue__deleted_at__isnull=True,
                        ),
                    ),
                    output_field=models.IntegerField(),
                )
            )
            .annotate(
                completed_issues=Case(
                    When(
                        Q(progress_snapshot__isnull=False) & ~Q(progress_snapshot={}),
                        then=Cast(
                            KeyTextTransform("completed_issues", "progress_snapshot"),
                            output_field=models.IntegerField(),
                        ),
                    ),
                    default=Count(
                        "issue_cycle__issue__id",
                        distinct=True,
                        filter=Q(
                            issue_cycle__issue__state__group="completed",
                            issue_cycle__issue__archived_at__isnull=True,
                            issue_cycle__issue__is_draft=False,
                            issue_cycle__issue__deleted_at__isnull=True,
                        ),
                    ),
                    output_field=models.IntegerField(),
                )
            )
            .annotate(
                unstarted_issues=Case(
                    When(
                        Q(progress_snapshot__isnull=False) & ~Q(progress_snapshot={}),
                        then=Cast(
                            KeyTextTransform("unstarted_issues", "progress_snapshot"),
                            output_field=models.IntegerField(),
                        ),
                    ),
                    default=Count(
                        "issue_cycle__issue__id",
                        distinct=True,
                        filter=Q(
                            issue_cycle__issue__state__group="unstarted",
                            issue_cycle__issue__archived_at__isnull=True,
                            issue_cycle__issue__is_draft=False,
                            issue_cycle__issue__deleted_at__isnull=True,
                        ),
                    ),
                    output_field=models.IntegerField(),
                )
            )
            .annotate(
                started_issues=Case(
                    When(
                        Q(progress_snapshot__isnull=False) & ~Q(progress_snapshot={}),
                        then=Cast(
                            KeyTextTransform("started_issues", "progress_snapshot"),
                            output_field=models.IntegerField(),
                        ),
                    ),
                    default=Count(
                        "issue_cycle__issue__id",
                        distinct=True,
                        filter=Q(issue_cycle__issue__state__group="started"),
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__issue__deleted_at__isnull=True,
                    ),
                    output_field=models.IntegerField(),
                )
            )
            .annotate(
                backlog_issues=Case(
                    When(
                        Q(progress_snapshot__isnull=False) & ~Q(progress_snapshot={}),
                        then=Cast(
                            KeyTextTransform("backlog_issues", "progress_snapshot"),
                            output_field=models.IntegerField(),
                        ),
                    ),
                    default=Count(
                        "issue_cycle__issue__id",
                        distinct=True,
                        filter=Q(
                            issue_cycle__issue__state__group="backlog",
                            issue_cycle__issue__archived_at__isnull=True,
                            issue_cycle__issue__is_draft=False,
                            issue_cycle__issue__deleted_at__isnull=True,
                        ),
                    ),
                    output_field=models.IntegerField(),
                )
            )
            .annotate(
                cancelled_issues=Case(
                    When(
                        Q(progress_snapshot__isnull=False) & ~Q(progress_snapshot={}),
                        then=Cast(
                            KeyTextTransform("cancelled_issues", "progress_snapshot"),
                            output_field=models.IntegerField(),
                        ),
                    ),
                    default=Count(
                        "issue_cycle__issue__id",
                        distinct=True,
                        filter=Q(
                            issue_cycle__issue__state__group="cancelled",
                            issue_cycle__issue__archived_at__isnull=True,
                            issue_cycle__issue__is_draft=False,
                            issue_cycle__issue__deleted_at__isnull=True,
                        ),
                    ),
                    output_field=models.IntegerField(),
                )
            )
            .annotate(
                status=Case(
                    When(
                        Q(start_date__lte=timezone.now()) & Q(end_date__gte=timezone.now()),
                        then=Value("CURRENT"),
                    ),
                    When(start_date__gt=timezone.now(), then=Value("UPCOMING")),
                    When(end_date__lt=timezone.now(), then=Value("COMPLETED")),
                    When(
                        Q(start_date__isnull=True) & Q(end_date__isnull=True),
                        then=Value("DRAFT"),
                    ),
                    default=Value("DRAFT"),
                    output_field=CharField(),
                )
            )
        )[:30]

        # Calculate completion percentage for each cycle
        data = []
        for cycle in queryset:
            total_issues = cycle.get("total_issues", 0)
            completed_issues = cycle.get("completed_issues", 0)
            completion_percentage = (completed_issues / total_issues * 100) if total_issues > 0 else 0

            data.append(
                {
                    "key": cycle.get("name"),
                    "name": cycle.get("name"),
                    "count": round(completion_percentage, 2),
                    "total_issues": total_issues,
                    "completed_issues": completed_issues,
                    "unstarted_issues": cycle.get("unstarted_issues", 0),
                    "started_issues": cycle.get("started_issues", 0),
                    "backlog_issues": cycle.get("backlog_issues", 0),
                    "cancelled_issues": cycle.get("cancelled_issues", 0),
                    "status": cycle.get("status"),
                    "start_date": cycle.get("start_date"),
                    "end_date": cycle.get("end_date"),
                }
            )

        return {"data": data, "schema": {}}

    def module_chart(self) -> Dict[str, Any]:
        # Get the base queryset with module stats
        queryset = (
            Module.objects.filter(**self.filters["base_filters"])
            .annotate(
                total_issues=Count(
                    "issue_module__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                ),
                completed_issues=Count(
                    "issue_module__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_module__issue__state__group="completed",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                ),
                cancelled_issues=Count(
                    "issue_module__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_module__issue__state__group__in=["cancelled"],
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                ),
                unstarted_issues=Count(
                    "issue_module__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_module__issue__state__group__in=["unstarted"],
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                ),
                started_issues=Count(
                    "issue_module__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_module__issue__state__group__in=["started"],
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                ),
            )
            .values(
                "id",
                "name",
                "project__name",
                "total_issues",
                "completed_issues",
                "unstarted_issues",
                "started_issues",
                "cancelled_issues",
                "status",
                "start_date",
                "target_date",
            )
        )
        # Calculate completion percentage for each module
        data = []
        for module in queryset:
            total_issues = module.get("total_issues", 0)
            completed_issues = module.get("completed_issues", 0)
            completion_percentage = (completed_issues / total_issues * 100) if total_issues > 0 else 0

            data.append(
                {
                    "key": module.get("name"),
                    "name": module.get("name"),
                    "count": round(completion_percentage, 2),
                    "total_issues": total_issues,
                    "completed_issues": completed_issues,
                    "unstarted_issues": module.get("unstarted_issues", 0),
                    "started_issues": module.get("started_issues", 0),
                    "cancelled_issues": module.get("cancelled_issues", 0),
                    "status": module.get("status"),
                    "start_date": module.get("start_date"),
                    "target_date": module.get("target_date"),
                }
            )

        return {"data": data, "schema": {}}

    def intake_chart(self) -> Dict[str, Any]:
        # Get the base queryset
        queryset = (
            Issue.objects.filter(**self.filters["base_filters"])
            .filter(issue_intake__isnull=False, issue_intake__status__in=[1, -1])
            .select_related("workspace", "issue_intake")
        )

        # Annotate by month and count accepted/rejected intakes
        monthly_stats = (
            queryset.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(
                accepted_count=Count("id", filter=Q(issue_intake__status=1)),
                rejected_count=Count("id", filter=Q(issue_intake__status=-1)),
            )
            .order_by("month")
        )

        # Create dictionary of month -> counts
        stats_dict = {
            stat["month"].strftime("%Y-%m-%d"): {
                "accepted_count": stat["accepted_count"],
                "rejected_count": stat["rejected_count"],
            }
            for stat in monthly_stats
        }

        # Generate monthly data (ensure months with 0 count are included)
        data = []
        current_year = timezone.now().year
        start_date = timezone.datetime(current_year, 1, 1).date()
        end_date = timezone.datetime(current_year, 12, 1).date()
        current_month = start_date

        while current_month <= end_date:
            date_str = current_month.strftime("%Y-%m-%d")
            stats = stats_dict.get(date_str, {"accepted_count": 0, "rejected_count": 0})
            data.append(
                {
                    "key": date_str,
                    "name": date_str,
                    "count": stats["accepted_count"] + stats["rejected_count"],
                    "accepted_count": stats["accepted_count"],
                    "rejected_count": stats["rejected_count"],
                }
            )
            # Move to next month
            if current_month.month == 12:
                break
            current_month = current_month.replace(month=current_month.month + 1)

        schema = {
            "accepted_count": "accepted_count",
            "rejected_count": "rejected_count",
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

        if check_workspace_feature_flag(
            feature_key=FeatureFlag.ANALYTICS_ADVANCED,
            slug=slug,
            user_id=str(request.user.id),
        ):
            if type == "project-status":
                return Response(
                    self.project_status_chart(),
                    status=status.HTTP_200_OK,
                )
            elif type == "cycles":
                return Response(
                    self.cycle_chart(),
                    status=status.HTTP_200_OK,
                )
            elif type == "modules":
                return Response(
                    self.module_chart(),
                    status=status.HTTP_200_OK,
                )
            elif type == "intake":
                return Response(
                    self.intake_chart(),
                    status=status.HTTP_200_OK,
                )
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        return Response({"message": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)
