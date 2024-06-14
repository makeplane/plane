# Django imports
from django.db.models import (
    Case,
    CharField,
    Count,
    Exists,
    F,
    OuterRef,
    Prefetch,
    Q,
    Value,
    Sum,
    When,
    Subquery,
    IntegerField,
)
from django.db.models.functions import Cast, Coalesce
from django.utils import timezone


# Module imports
from plane.app.permissions import (
    WorkspaceUserPermission,
)
from plane.app.serializers import (
    ActiveCycleSerializer,
)
from plane.db.models import Cycle, CycleFavorite, Issue, Label, User, Project
from plane.utils.analytics_plot import burndown_plot
from plane.app.views.base import BaseAPIView


class ActiveCycleEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceUserPermission,
    ]

    def get_results_controller(self, results, plot_type, active_cycles=None):
        for cycle in results:
            estimate_type = Project.objects.filter(
                pk=cycle["project_id"],
                workspace__slug=self.kwargs.get("slug"),
                estimate__isnull=False,
                estimate__type="points",
            ).exists()
            cycle["estimate_distribution"] = {}
            if estimate_type:
                assignee_distribution = (
                    Issue.objects.filter(
                        issue_cycle__cycle_id=cycle["id"],
                        project_id=cycle["project_id"],
                        workspace__slug=self.kwargs.get("slug"),
                    )
                    .annotate(display_name=F("assignees__display_name"))
                    .annotate(assignee_id=F("assignees__id"))
                    .annotate(avatar=F("assignees__avatar"))
                    .values("display_name", "assignee_id", "avatar")
                    .annotate(
                        total_estimates=Sum(
                            Cast("estimate_point__value", IntegerField())
                        )
                    )
                    .annotate(
                        completed_estimates=Sum(
                            Cast("estimate_point__value", IntegerField()),
                            filter=Q(
                                completed_at__isnull=False,
                                archived_at__isnull=True,
                                is_draft=False,
                            ),
                        )
                    )
                    .annotate(
                        pending_estimates=Sum(
                            Cast("estimate_point__value", IntegerField()),
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
                    Issue.objects.filter(
                        issue_cycle__cycle_id=cycle["id"],
                        project_id=cycle["project_id"],
                        workspace__slug=self.kwargs.get("slug"),
                    )
                    .annotate(label_name=F("labels__name"))
                    .annotate(color=F("labels__color"))
                    .annotate(label_id=F("labels__id"))
                    .values("label_name", "color", "label_id")
                    .annotate(
                        total_estimates=Sum(
                            Cast("estimate_point__value", IntegerField())
                        )
                    )
                    .annotate(
                        completed_estimates=Sum(
                            Cast("estimate_point__value", IntegerField()),
                            filter=Q(
                                completed_at__isnull=False,
                                archived_at__isnull=True,
                                is_draft=False,
                            ),
                        )
                    )
                    .annotate(
                        pending_estimates=Sum(
                            Cast("estimate_point__value", IntegerField()),
                            filter=Q(
                                completed_at__isnull=True,
                                archived_at__isnull=True,
                                is_draft=False,
                            ),
                        )
                    )
                    .order_by("label_name")
                )
                cycle["estimate_distribution"] = {
                    "assignees": assignee_distribution,
                    "labels": label_distribution,
                    "completion_chart": {},
                }

                if cycle["start_date"] and cycle["end_date"]:
                    cycle["estimate_distribution"]["completion_chart"] = (
                        burndown_plot(
                            queryset=active_cycles.get(pk=cycle["id"]),
                            slug=self.kwargs.get("slug"),
                            project_id=cycle["project_id"],
                            cycle_id=cycle["id"],
                            plot_type="points",
                        )
                    )

            assignee_distribution = (
                Issue.issue_objects.filter(
                    issue_cycle__cycle_id=cycle["id"],
                    project_id=cycle["project_id"],
                    workspace__slug=self.kwargs.get("slug"),
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
                    issue_cycle__cycle_id=cycle["id"],
                    project_id=cycle["project_id"],
                    workspace__slug=self.kwargs.get("slug"),
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
            cycle["distribution"] = {
                "assignees": assignee_distribution,
                "labels": label_distribution,
                "completion_chart": {},
            }
            if cycle["start_date"] and cycle["end_date"]:
                cycle["distribution"]["completion_chart"] = burndown_plot(
                    queryset=active_cycles.get(pk=cycle["id"]),
                    slug=self.kwargs.get("slug"),
                    project_id=cycle["project_id"],
                    cycle_id=cycle["id"],
                    plot_type="issues",
                )
        return results

    def get(self, request, slug):
        plot_type = request.GET.get("plot_type", "issues")
        subquery = CycleFavorite.objects.filter(
            user=self.request.user,
            cycle_id=OuterRef("pk"),
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        backlog_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="backlog",
                issue_cycle__cycle_id=OuterRef("pk"),
            )
            .values("issue_cycle__cycle_id")
            .annotate(
                backlog_estimate_point=Sum(
                    Cast("estimate_point__value", IntegerField())
                )
            )
            .values("backlog_estimate_point")[:1]
        )
        unstarted_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="unstarted",
                issue_cycle__cycle_id=OuterRef("pk"),
            )
            .values("issue_cycle__cycle_id")
            .annotate(
                unstarted_estimate_point=Sum(
                    Cast("estimate_point__value", IntegerField())
                )
            )
            .values("unstarted_estimate_point")[:1]
        )
        started_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="started",
                issue_cycle__cycle_id=OuterRef("pk"),
            )
            .values("issue_cycle__cycle_id")
            .annotate(
                started_estimate_point=Sum(
                    Cast("estimate_point__value", IntegerField())
                )
            )
            .values("started_estimate_point")[:1]
        )
        cancelled_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="cancelled",
                issue_cycle__cycle_id=OuterRef("pk"),
            )
            .values("issue_cycle__cycle_id")
            .annotate(
                cancelled_estimate_point=Sum(
                    Cast("estimate_point__value", IntegerField())
                )
            )
            .values("cancelled_estimate_point")[:1]
        )
        completed_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="completed",
                issue_cycle__cycle_id=OuterRef("pk"),
            )
            .values("issue_cycle__cycle_id")
            .annotate(
                completed_estimate_points=Sum(
                    Cast("estimate_point__value", IntegerField())
                )
            )
            .values("completed_estimate_points")[:1]
        )
        total_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                issue_cycle__cycle_id=OuterRef("pk"),
            )
            .values("issue_cycle__cycle_id")
            .annotate(
                total_estimate_points=Sum(
                    Cast("estimate_point__value", IntegerField())
                )
            )
            .values("total_estimate_points")[:1]
        )
        active_cycles = (
            Cycle.objects.filter(
                workspace__slug=slug,
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                start_date__lte=timezone.now(),
                end_date__gte=timezone.now(),
            )
            .select_related("project")
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(is_favorite=Exists(subquery))
            .annotate(
                total_issues=Count(
                    "issue_cycle",
                    filter=Q(
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                    ),
                )
            )
            .annotate(
                completed_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="completed",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                    ),
                )
            )
            .annotate(
                cancelled_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="cancelled",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                    ),
                )
            )
            .annotate(
                started_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="started",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                    ),
                )
            )
            .annotate(
                unstarted_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="unstarted",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                    ),
                )
            )
            .annotate(
                backlog_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="backlog",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                    ),
                )
            )
            .annotate(
                status=Case(
                    When(
                        Q(start_date__lte=timezone.now())
                        & Q(end_date__gte=timezone.now()),
                        then=Value("CURRENT"),
                    ),
                    When(
                        start_date__gt=timezone.now(), then=Value("UPCOMING")
                    ),
                    When(end_date__lt=timezone.now(), then=Value("COMPLETED")),
                    When(
                        Q(start_date__isnull=True) & Q(end_date__isnull=True),
                        then=Value("DRAFT"),
                    ),
                    default=Value("DRAFT"),
                    output_field=CharField(),
                )
            )
            .annotate(
                backlog_estimate_points=Coalesce(
                    Subquery(backlog_estimate_point),
                    Value(0, output_field=IntegerField()),
                ),
            )
            .annotate(
                unstarted_estimate_points=Coalesce(
                    Subquery(unstarted_estimate_point),
                    Value(0, output_field=IntegerField()),
                ),
            )
            .annotate(
                started_estimate_points=Coalesce(
                    Subquery(started_estimate_point),
                    Value(0, output_field=IntegerField()),
                ),
            )
            .annotate(
                cancelled_estimate_points=Coalesce(
                    Subquery(cancelled_estimate_point),
                    Value(0, output_field=IntegerField()),
                ),
            )
            .annotate(
                completed_estimate_points=Coalesce(
                    Subquery(completed_estimate_point),
                    Value(0, output_field=IntegerField()),
                ),
            )
            .annotate(
                total_estimate_points=Coalesce(
                    Subquery(total_estimate_point),
                    Value(0, output_field=IntegerField()),
                ),
            )
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
            .order_by("-created_at")
        )

        return self.paginate(
            request=request,
            queryset=active_cycles,
            on_results=lambda active_cycles: ActiveCycleSerializer(
                active_cycles, many=True
            ).data,
            controller=lambda results: self.get_results_controller(
                results, plot_type, active_cycles
            ),
            default_per_page=int(request.GET.get("per_page", 3)),
        )
