# Django imports
from django.db.models import (
    Count,
    Exists,
    OuterRef,
    Prefetch,
    Q,
    Value,
    When,
    CharField,
    UUIDField,
    Case,
)
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.aggregates import ArrayAgg

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.models import TeamSpaceProject
from plane.db.models import Cycle, UserFavorite, User, Label
from .base import TeamBaseEndpoint
from plane.ee.permissions import TeamSpacePermission
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class TeamSpaceCycleEndpoint(TeamBaseEndpoint):

    permission_classes = [
        TeamSpacePermission,
    ]
    model = Cycle

    def get_queryset(self):
        favorite_subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_identifier=OuterRef("pk"),
            entity_type="cycle",
            workspace__slug=self.kwargs.get("slug"),
        )
        return (
            Cycle.objects.filter(workspace__slug=self.kwargs.get("slug"))
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
                    queryset=Label.objects.only(
                        "name", "color", "id"
                    ).distinct(),
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
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "issue_cycle__issue__assignees__id",
                        distinct=True,
                        filter=~Q(
                            issue_cycle__issue__assignees__id__isnull=True
                        )
                        & (
                            Q(
                                issue_cycle__issue__issue_assignee__deleted_at__isnull=True
                            )
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
            .order_by("-is_favorite", "name")
            .distinct()
        )

    @check_feature_flag(FeatureFlag.TEAMS)
    def get(self, request, slug, team_space_id):
        project_ids = TeamSpaceProject.objects.filter(
            workspace__slug=slug, team_space_id=team_space_id
        ).values_list("project_id", flat=True)

        queryset = self.get_queryset().filter(
            archived_at__isnull=True, project_id__in=project_ids
        )
        cycle_view = request.GET.get("cycle_view", "all")

        # Update the order by
        queryset = queryset.order_by("-is_favorite", "-created_at")

        # Current Cycle
        if cycle_view == "current":
            queryset = queryset.filter(
                start_date__lte=timezone.now(),
                end_date__gte=timezone.now(),
            )

            data = queryset.values(
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
                "logo_props",
                "is_favorite",
                "total_issues",
                "completed_issues",
                "assignee_ids",
                "status",
                "version",
                "created_by",
            )

            if data:
                return Response(data, status=status.HTTP_200_OK)

        data = queryset.values(
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
            "logo_props",
            # meta fields
            "is_favorite",
            "total_issues",
            "completed_issues",
            "assignee_ids",
            "status",
            "version",
            "created_by",
        )
        return Response(data, status=status.HTTP_200_OK)
