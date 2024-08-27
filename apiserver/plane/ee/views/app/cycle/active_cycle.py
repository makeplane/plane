# Django imports
from django.db.models import (
    Case,
    Count,
    Exists,
    F,
    OuterRef,
    Prefetch,
    Q,
    Value,
    Sum,
    When,
    FloatField,
)
from django.db.models.functions import Cast
from django.utils import timezone

# Module imports
from plane.db.models import Cycle, UserFavorite, Issue, Label, User, Project
from plane.utils.analytics_plot import burndown_plot

# ee imports
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import (
    WorkspaceUserPermission,
)
from plane.ee.serializers import (
    WorkspaceActiveCycleSerializer,
)
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag

# Third party imports
from rest_framework import status
from rest_framework.response import Response


class WorkspaceActiveCycleEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceUserPermission,
    ]

    @check_feature_flag(FeatureFlag.WORKSPACE_ACTIVE_CYCLES)
    def get(self, request, slug):

        favorite_subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_identifier=OuterRef("pk"),
            entity_type="cycle",
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )

        active_cycles = (
            Cycle.objects.filter(
                workspace__slug=slug,
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                start_date__lte=timezone.now(),
                end_date__gte=timezone.now(),
            )
            .filter(project__archived_at__isnull=True)
            .select_related("project", "workspace", "owned_by")
            .prefetch_related(
                Prefetch(
                    "issue_cycle__issue__assignees",
                    queryset=User.objects.only(
                        "avatar", "first_name", "id"
                    ).distinct(),
                )
            )
            .prefetch_related(
                Prefetch(
                    "issue_cycle__issue__labels",
                    queryset=Label.objects.only(
                        "name", "color", "id"
                    ).distinct(),
                )
            )
            .annotate(is_favorite=Exists(favorite_subquery))
            .order_by("-is_favorite", "name")
            .distinct()
        )
        return self.paginate(
            request=request,
            queryset=active_cycles,
            on_results=lambda active_cycles: WorkspaceActiveCycleSerializer(
                active_cycles,
                many=True,
            ).data,
            default_per_page=int(request.GET.get("per_page", 3)),
        )


class ActiveCycleProgressEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceUserPermission,
    ]

    @check_feature_flag(FeatureFlag.WORKSPACE_ACTIVE_CYCLES)
    def get(self, request, slug, project_id, cycle_id):

        aggregate_estimates = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                issue_cycle__cycle_id=cycle_id,
                workspace__slug=slug,
                project_id=project_id,
            )
            .annotate(
                value_as_float=Cast("estimate_point__value", FloatField())
            )
            .aggregate(
                backlog_estimate_point=Sum(
                    Case(
                        When(state__group="backlog", then="value_as_float"),
                        default=Value(0),
                        output_field=FloatField(),
                    )
                ),
                unstarted_estimate_point=Sum(
                    Case(
                        When(state__group="unstarted", then="value_as_float"),
                        default=Value(0),
                        output_field=FloatField(),
                    )
                ),
                started_estimate_point=Sum(
                    Case(
                        When(state__group="started", then="value_as_float"),
                        default=Value(0),
                        output_field=FloatField(),
                    )
                ),
                cancelled_estimate_point=Sum(
                    Case(
                        When(state__group="cancelled", then="value_as_float"),
                        default=Value(0),
                        output_field=FloatField(),
                    )
                ),
                completed_estimate_points=Sum(
                    Case(
                        When(state__group="completed", then="value_as_float"),
                        default=Value(0),
                        output_field=FloatField(),
                    )
                ),
                total_estimate_points=Sum(
                    "value_as_float",
                    default=Value(0),
                    output_field=FloatField(),
                ),
            )
        )

        backlog_issues = Issue.issue_objects.filter(
            issue_cycle__cycle_id=cycle_id,
            workspace__slug=slug,
            project_id=project_id,
            state__group="backlog",
        ).count()

        unstarted_issues = Issue.issue_objects.filter(
            issue_cycle__cycle_id=cycle_id,
            workspace__slug=slug,
            project_id=project_id,
            state__group="unstarted",
        ).count()

        started_issues = Issue.issue_objects.filter(
            issue_cycle__cycle_id=cycle_id,
            workspace__slug=slug,
            project_id=project_id,
            state__group="started",
        ).count()

        cancelled_issues = Issue.issue_objects.filter(
            issue_cycle__cycle_id=cycle_id,
            workspace__slug=slug,
            project_id=project_id,
            state__group="cancelled",
        ).count()

        completed_issues = Issue.issue_objects.filter(
            issue_cycle__cycle_id=cycle_id,
            workspace__slug=slug,
            project_id=project_id,
            state__group="completed",
        ).count()

        total_issues = Issue.issue_objects.filter(
            issue_cycle__cycle_id=cycle_id,
            workspace__slug=slug,
            project_id=project_id,
        ).count()

        return Response(
            {
                "backlog_estimate_point": aggregate_estimates[
                    "backlog_estimate_point"
                ]
                or 0,
                "unstarted_estimate_point": aggregate_estimates[
                    "unstarted_estimate_point"
                ]
                or 0,
                "started_estimate_point": aggregate_estimates[
                    "started_estimate_point"
                ]
                or 0,
                "cancelled_estimate_point": aggregate_estimates[
                    "cancelled_estimate_point"
                ]
                or 0,
                "completed_estimate_point": aggregate_estimates[
                    "completed_estimate_points"
                ]
                or 0,
                "total_estimate_point": aggregate_estimates[
                    "total_estimate_points"
                ],
                "backlog_issues": backlog_issues,
                "total_issues": total_issues,
                "completed_issues": completed_issues,
                "cancelled_issues": cancelled_issues,
                "started_issues": started_issues,
                "unstarted_issues": unstarted_issues,
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceActiveAnalyticsCycleEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceUserPermission,
    ]
    @check_feature_flag(FeatureFlag.WORKSPACE_ACTIVE_CYCLES)
    def get(self, request, slug, project_id, cycle_id):
        analytic_type = request.GET.get("type", "issues")
        cycle = (
            Cycle.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                id=cycle_id,
            )
            .annotate(
                total_issues=Count(
                    "issue_cycle__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                    ),
                )
            )
            .first()
        )

        if not cycle.start_date or not cycle.end_date:
            return Response(
                {"error": "Cycle has no start or end date"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if (
            not cycle.start_date <= timezone.now().date()
            or not cycle.end_date >= timezone.now().date()
        ):
            return Response(
                {"error": "Cycle is not active"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        estimate_type = Project.objects.filter(
            workspace__slug=slug,
            pk=project_id,
            estimate__isnull=False,
            estimate__type="points",
        ).exists()

        assignee_distribution = {}
        label_distribution = {}
        completion_chart = {}

        if analytic_type == "points" and estimate_type:
            assignee_distribution = (
                Issue.issue_objects.filter(
                    issue_cycle__cycle_id=cycle_id,
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(display_name=F("assignees__display_name"))
                .annotate(assignee_id=F("assignees__id"))
                .annotate(avatar=F("assignees__avatar"))
                .values("display_name", "assignee_id", "avatar")
                .annotate(
                    total_estimates=Sum(
                        Cast("estimate_point__value", FloatField())
                    )
                )
                .annotate(
                    completed_estimates=Sum(
                        Cast("estimate_point__value", FloatField()),
                        filter=Q(
                            completed_at__isnull=False,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .annotate(
                    pending_estimates=Sum(
                        Cast("estimate_point__value", FloatField()),
                        filter=Q(
                            completed_at__isnull=True,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .order_by("display_name")
            )

            label_distribution = (
                Issue.issue_objects.filter(
                    issue_cycle__cycle_id=cycle_id,
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(label_name=F("labels__name"))
                .annotate(color=F("labels__color"))
                .annotate(label_id=F("labels__id"))
                .values("label_name", "color", "label_id")
                .annotate(
                    total_estimates=Sum(
                        Cast("estimate_point__value", FloatField())
                    )
                )
                .annotate(
                    completed_estimates=Sum(
                        Cast("estimate_point__value", FloatField()),
                        filter=Q(
                            completed_at__isnull=False,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .annotate(
                    pending_estimates=Sum(
                        Cast("estimate_point__value", FloatField()),
                        filter=Q(
                            completed_at__isnull=True,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .order_by("label_name")
            )
            completion_chart = burndown_plot(
                queryset=cycle,
                slug=slug,
                project_id=project_id,
                plot_type="points",
                cycle_id=cycle_id,
            )

        if analytic_type == "issues":
            assignee_distribution = (
                Issue.issue_objects.filter(
                    issue_cycle__cycle_id=cycle_id,
                    project_id=project_id,
                    workspace__slug=slug,
                )
                .annotate(display_name=F("assignees__display_name"))
                .annotate(assignee_id=F("assignees__id"))
                .annotate(avatar=F("assignees__avatar"))
                .values("display_name", "assignee_id", "avatar")
                .annotate(
                    total_issues=Count(
                        "assignee_id",
                        filter=Q(archived_at__isnull=True, is_draft=False),
                    ),
                )
                .annotate(
                    completed_issues=Count(
                        "assignee_id",
                        filter=Q(
                            completed_at__isnull=False,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .annotate(
                    pending_issues=Count(
                        "assignee_id",
                        filter=Q(
                            completed_at__isnull=True,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .order_by("display_name")
            )

            label_distribution = (
                Issue.issue_objects.filter(
                    issue_cycle__cycle_id=cycle_id,
                    project_id=project_id,
                    workspace__slug=slug,
                )
                .annotate(label_name=F("labels__name"))
                .annotate(color=F("labels__color"))
                .annotate(label_id=F("labels__id"))
                .values("label_name", "color", "label_id")
                .annotate(
                    total_issues=Count(
                        "label_id",
                        filter=Q(archived_at__isnull=True, is_draft=False),
                    )
                )
                .annotate(
                    completed_issues=Count(
                        "label_id",
                        filter=Q(
                            completed_at__isnull=False,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .annotate(
                    pending_issues=Count(
                        "label_id",
                        filter=Q(
                            completed_at__isnull=True,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .order_by("label_name")
            )
            completion_chart = burndown_plot(
                queryset=cycle,
                slug=slug,
                project_id=project_id,
                cycle_id=cycle_id,
                plot_type="issues",
            )

        return Response(
            {
                "assignee": assignee_distribution,
                "label": label_distribution,
                "completion_chart": completion_chart,
            },
            status=status.HTTP_200_OK,
        )
