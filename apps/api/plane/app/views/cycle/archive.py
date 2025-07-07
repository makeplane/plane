# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import (
    Case,
    CharField,
    Count,
    Exists,
    F,
    Func,
    OuterRef,
    Prefetch,
    Q,
    UUIDField,
    Value,
    When,
    Subquery,
    Sum,
    FloatField,
)
from django.db.models.functions import Coalesce, Cast, Concat
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Cycle, UserFavorite, Issue, Label, User, Project
from plane.utils.analytics_plot import burndown_plot

# Module imports
from .. import BaseAPIView


class CycleArchiveUnarchiveEndpoint(BaseAPIView):
    def get_queryset(self):
        favorite_subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="cycle",
            entity_identifier=OuterRef("pk"),
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        backlog_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="backlog",
                issue_cycle__cycle_id=OuterRef("pk"),
                issue_cycle__deleted_at__isnull=True,
            )
            .values("issue_cycle__cycle_id")
            .annotate(
                backlog_estimate_point=Sum(Cast("estimate_point__value", FloatField()))
            )
            .values("backlog_estimate_point")[:1]
        )
        unstarted_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="unstarted",
                issue_cycle__cycle_id=OuterRef("pk"),
                issue_cycle__deleted_at__isnull=True,
            )
            .values("issue_cycle__cycle_id")
            .annotate(
                unstarted_estimate_point=Sum(
                    Cast("estimate_point__value", FloatField())
                )
            )
            .values("unstarted_estimate_point")[:1]
        )
        started_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="started",
                issue_cycle__cycle_id=OuterRef("pk"),
                issue_cycle__deleted_at__isnull=True,
            )
            .values("issue_cycle__cycle_id")
            .annotate(
                started_estimate_point=Sum(Cast("estimate_point__value", FloatField()))
            )
            .values("started_estimate_point")[:1]
        )
        cancelled_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="cancelled",
                issue_cycle__cycle_id=OuterRef("pk"),
                issue_cycle__deleted_at__isnull=True,
            )
            .values("issue_cycle__cycle_id")
            .annotate(
                cancelled_estimate_point=Sum(
                    Cast("estimate_point__value", FloatField())
                )
            )
            .values("cancelled_estimate_point")[:1]
        )
        completed_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="completed",
                issue_cycle__cycle_id=OuterRef("pk"),
                issue_cycle__deleted_at__isnull=True,
            )
            .values("issue_cycle__cycle_id")
            .annotate(
                completed_estimate_points=Sum(
                    Cast("estimate_point__value", FloatField())
                )
            )
            .values("completed_estimate_points")[:1]
        )
        total_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                issue_cycle__cycle_id=OuterRef("pk"),
                issue_cycle__deleted_at__isnull=True,
            )
            .values("issue_cycle__cycle_id")
            .annotate(
                total_estimate_points=Sum(Cast("estimate_point__value", FloatField()))
            )
            .values("total_estimate_points")[:1]
        )
        return (
            Cycle.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(archived_at__isnull=False)
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("project", "workspace", "owned_by")
            .prefetch_related(
                Prefetch(
                    "issue_cycle__issue__assignees",
                    queryset=User.objects.only(
                        "avatar_asset", "first_name", "id"
                    ).distinct(),
                )
            )
            .prefetch_related(
                Prefetch(
                    "issue_cycle__issue__labels",
                    queryset=Label.objects.only("name", "color", "id").distinct(),
                )
            )
            .annotate(is_favorite=Exists(favorite_subquery))
            .annotate(
                total_issues=Count(
                    "issue_cycle__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__issue__deleted_at__isnull=True,
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
                        issue_cycle__issue__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                cancelled_issues=Count(
                    "issue_cycle__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_cycle__issue__state__group="cancelled",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__issue__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                started_issues=Count(
                    "issue_cycle__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_cycle__issue__state__group="started",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__issue__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                unstarted_issues=Count(
                    "issue_cycle__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_cycle__issue__state__group="unstarted",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__issue__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                backlog_issues=Count(
                    "issue_cycle__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_cycle__issue__state__group="backlog",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__issue__deleted_at__isnull=True,
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
            .annotate(
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "issue_cycle__issue__assignees__id",
                        distinct=True,
                        filter=~Q(issue_cycle__issue__assignees__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
            .annotate(
                backlog_estimate_points=Coalesce(
                    Subquery(backlog_estimate_point),
                    Value(0, output_field=FloatField()),
                )
            )
            .annotate(
                unstarted_estimate_points=Coalesce(
                    Subquery(unstarted_estimate_point),
                    Value(0, output_field=FloatField()),
                )
            )
            .annotate(
                started_estimate_points=Coalesce(
                    Subquery(started_estimate_point),
                    Value(0, output_field=FloatField()),
                )
            )
            .annotate(
                cancelled_estimate_points=Coalesce(
                    Subquery(cancelled_estimate_point),
                    Value(0, output_field=FloatField()),
                )
            )
            .annotate(
                completed_estimate_points=Coalesce(
                    Subquery(completed_estimate_point),
                    Value(0, output_field=FloatField()),
                )
            )
            .annotate(
                total_estimate_points=Coalesce(
                    Subquery(total_estimate_point), Value(0, output_field=FloatField())
                )
            )
            .order_by("-is_favorite", "name")
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id, pk=None):
        if pk is None:
            queryset = (
                self.get_queryset().values(
                    # necessary fields
                    "id",
                    "workspace_id",
                    "project_id",
                    # model fields
                    "name",
                    "description",
                    "start_date",
                    "end_date",
                    "owned_by_id",
                    "view_props",
                    "sort_order",
                    "external_source",
                    "external_id",
                    "progress_snapshot",
                    # meta fields
                    "total_issues",
                    "is_favorite",
                    "cancelled_issues",
                    "completed_issues",
                    "started_issues",
                    "unstarted_issues",
                    "backlog_issues",
                    "assignee_ids",
                    "status",
                    "archived_at",
                )
            ).order_by("-is_favorite", "-created_at")
            return Response(queryset, status=status.HTTP_200_OK)
        else:
            queryset = (
                self.get_queryset().filter(archived_at__isnull=False).filter(pk=pk)
            )
            data = (
                self.get_queryset()
                .filter(pk=pk)
                .annotate(
                    sub_issues=Issue.issue_objects.filter(
                        project_id=self.kwargs.get("project_id"),
                        parent__isnull=False,
                        issue_cycle__cycle_id=pk,
                        issue_cycle__deleted_at__isnull=True,
                    )
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
                .values(
                    # necessary fields
                    "id",
                    "workspace_id",
                    "project_id",
                    # model fields
                    "name",
                    "description",
                    "start_date",
                    "end_date",
                    "owned_by_id",
                    "view_props",
                    "sort_order",
                    "external_source",
                    "external_id",
                    "progress_snapshot",
                    "sub_issues",
                    "logo_props",
                    # meta fields
                    "completed_estimate_points",
                    "total_estimate_points",
                    "is_favorite",
                    "total_issues",
                    "cancelled_issues",
                    "completed_issues",
                    "started_issues",
                    "unstarted_issues",
                    "backlog_issues",
                    "assignee_ids",
                    "status",
                    "created_by",
                    "archived_at",
                )
                .first()
            )
            queryset = queryset.first()

            estimate_type = Project.objects.filter(
                workspace__slug=slug,
                pk=project_id,
                estimate__isnull=False,
                estimate__type="points",
            ).exists()

            data["estimate_distribution"] = {}
            if estimate_type:
                assignee_distribution = (
                    Issue.issue_objects.filter(
                        issue_cycle__cycle_id=pk,
                        issue_cycle__deleted_at__isnull=True,
                        workspace__slug=slug,
                        project_id=project_id,
                    )
                    .annotate(display_name=F("assignees__display_name"))
                    .annotate(assignee_id=F("assignees__id"))
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
                                assignees__avatar_asset__isnull=True,
                                then="assignees__avatar",
                            ),
                            default=Value(None),
                            output_field=models.CharField(),
                        )
                    )
                    .values("display_name", "assignee_id", "avatar_url")
                    .annotate(
                        total_estimates=Sum(Cast("estimate_point__value", FloatField()))
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
                        issue_cycle__cycle_id=pk,
                        issue_cycle__deleted_at__isnull=True,
                        workspace__slug=slug,
                        project_id=project_id,
                    )
                    .annotate(label_name=F("labels__name"))
                    .annotate(color=F("labels__color"))
                    .annotate(label_id=F("labels__id"))
                    .values("label_name", "color", "label_id")
                    .annotate(
                        total_estimates=Sum(Cast("estimate_point__value", FloatField()))
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
                data["estimate_distribution"] = {
                    "assignees": assignee_distribution,
                    "labels": label_distribution,
                    "completion_chart": {},
                }

                if data["start_date"] and data["end_date"]:
                    data["estimate_distribution"]["completion_chart"] = burndown_plot(
                        queryset=queryset,
                        slug=slug,
                        project_id=project_id,
                        plot_type="points",
                        cycle_id=pk,
                    )

            # Assignee Distribution
            assignee_distribution = (
                Issue.issue_objects.filter(
                    issue_cycle__cycle_id=pk,
                    issue_cycle__deleted_at__isnull=True,
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(first_name=F("assignees__first_name"))
                .annotate(last_name=F("assignees__last_name"))
                .annotate(assignee_id=F("assignees__id"))
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
                            assignees__avatar_asset__isnull=True,
                            then="assignees__avatar",
                        ),
                        default=Value(None),
                        output_field=models.CharField(),
                    )
                )
                .annotate(display_name=F("assignees__display_name"))
                .values(
                    "first_name",
                    "last_name",
                    "assignee_id",
                    "avatar_url",
                    "display_name",
                )
                .annotate(
                    total_issues=Count(
                        "id", filter=Q(archived_at__isnull=True, is_draft=False)
                    )
                )
                .annotate(
                    completed_issues=Count(
                        "id",
                        filter=Q(
                            completed_at__isnull=False,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .annotate(
                    pending_issues=Count(
                        "id",
                        filter=Q(
                            completed_at__isnull=True,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .order_by("first_name", "last_name")
            )

            # Label Distribution
            label_distribution = (
                Issue.issue_objects.filter(
                    issue_cycle__cycle_id=pk,
                    issue_cycle__deleted_at__isnull=True,
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(label_name=F("labels__name"))
                .annotate(color=F("labels__color"))
                .annotate(label_id=F("labels__id"))
                .values("label_name", "color", "label_id")
                .annotate(
                    total_issues=Count(
                        "id", filter=Q(archived_at__isnull=True, is_draft=False)
                    )
                )
                .annotate(
                    completed_issues=Count(
                        "id",
                        filter=Q(
                            completed_at__isnull=False,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .annotate(
                    pending_issues=Count(
                        "id",
                        filter=Q(
                            completed_at__isnull=True,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .order_by("label_name")
            )

            data["distribution"] = {
                "assignees": assignee_distribution,
                "labels": label_distribution,
                "completion_chart": {},
            }

            if queryset.start_date and queryset.end_date:
                data["distribution"]["completion_chart"] = burndown_plot(
                    queryset=queryset,
                    slug=slug,
                    project_id=project_id,
                    plot_type="issues",
                    cycle_id=pk,
                )

            return Response(data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, cycle_id):
        cycle = Cycle.objects.get(
            pk=cycle_id, project_id=project_id, workspace__slug=slug
        )

        if cycle.end_date >= timezone.now():
            return Response(
                {"error": "Only completed cycles can be archived"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cycle.archived_at = timezone.now()
        cycle.save()
        UserFavorite.objects.filter(
            entity_type="cycle",
            entity_identifier=cycle_id,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()
        return Response(
            {"archived_at": str(cycle.archived_at)}, status=status.HTTP_200_OK
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def delete(self, request, slug, project_id, cycle_id):
        cycle = Cycle.objects.get(
            pk=cycle_id, project_id=project_id, workspace__slug=slug
        )
        cycle.archived_at = None
        cycle.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
