# Python imports
import json
import pytz


# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
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
    Sum,
    FloatField,
)
from django.db import models
from django.db.models.functions import Coalesce, Cast, Concat
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import (
    CycleSerializer,
    CycleUserPropertiesSerializer,
    CycleWriteSerializer,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    Cycle,
    CycleIssue,
    UserFavorite,
    CycleUserProperties,
    Issue,
    Label,
    User,
    Project,
    ProjectMember,
    UserRecentVisit,
)
from plane.utils.analytics_plot import burndown_plot
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.utils.host import base_host
from .. import BaseAPIView, BaseViewSet
from plane.bgtasks.webhook_task import model_activity
from plane.utils.timezone_converter import convert_to_utc, user_timezone_converter


class CycleViewSet(BaseViewSet):
    serializer_class = CycleSerializer
    model = Cycle
    webhook_event = "cycle"

    def get_queryset(self):
        favorite_subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_identifier=OuterRef("pk"),
            entity_type="cycle",
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )

        project = Project.objects.get(id=self.kwargs.get("project_id"))

        # Fetch project for the specific record or pass project_id dynamically
        project_timezone = project.timezone

        # Convert the current time (timezone.now()) to the project's timezone
        local_tz = pytz.timezone(project_timezone)
        current_time_in_project_tz = timezone.now().astimezone(local_tz)

        # Convert project local time back to UTC for comparison (start_date is stored in UTC)
        current_time_in_utc = current_time_in_project_tz.astimezone(pytz.utc)

        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
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
                        issue_cycle__deleted_at__isnull=True,
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
                        issue_cycle__deleted_at__isnull=True,
                        issue_cycle__issue__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                cancelled_issues=Count(
                    "issue_cycle__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_cycle__issue__state__group__in=["cancelled"],
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                        issue_cycle__issue__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                status=Case(
                    When(
                        Q(start_date__lte=current_time_in_utc)
                        & Q(end_date__gte=current_time_in_utc),
                        then=Value("CURRENT"),
                    ),
                    When(start_date__gt=current_time_in_utc, then=Value("UPCOMING")),
                    When(end_date__lt=current_time_in_utc, then=Value("COMPLETED")),
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
                        filter=~Q(issue_cycle__issue__assignees__id__isnull=True)
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

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        queryset = self.get_queryset().filter(archived_at__isnull=True)
        cycle_view = request.GET.get("cycle_view", "all")

        # Update the order by
        queryset = queryset.order_by("-is_favorite", "-created_at")

        project = Project.objects.get(id=self.kwargs.get("project_id"))

        # Fetch project for the specific record or pass project_id dynamically
        project_timezone = project.timezone

        # Convert the current time (timezone.now()) to the project's timezone
        local_tz = pytz.timezone(project_timezone)
        current_time_in_project_tz = timezone.now().astimezone(local_tz)

        # Convert project local time back to UTC for comparison (start_date is stored in UTC)
        current_time_in_utc = current_time_in_project_tz.astimezone(pytz.utc)

        # Current Cycle
        if cycle_view == "current":
            queryset = queryset.filter(
                start_date__lte=current_time_in_utc, end_date__gte=current_time_in_utc
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
                "cancelled_issues",
                "assignee_ids",
                "status",
                "version",
                "created_by",
            )
            datetime_fields = ["start_date", "end_date"]
            data = user_timezone_converter(data, datetime_fields, project_timezone)

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
            "cancelled_issues",
            "completed_issues",
            "assignee_ids",
            "status",
            "version",
            "created_by",
        )
        datetime_fields = ["start_date", "end_date"]
        data = user_timezone_converter(data, datetime_fields, project_timezone)
        return Response(data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        if (
            request.data.get("start_date", None) is None
            and request.data.get("end_date", None) is None
        ) or (
            request.data.get("start_date", None) is not None
            and request.data.get("end_date", None) is not None
        ):
            serializer = CycleWriteSerializer(
                data=request.data, context={"project_id": project_id}
            )
            if serializer.is_valid():
                serializer.save(project_id=project_id, owned_by=request.user)
                cycle = (
                    self.get_queryset()
                    .filter(pk=serializer.data["id"])
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
                        "logo_props",
                        "version",
                        # meta fields
                        "is_favorite",
                        "total_issues",
                        "completed_issues",
                        "assignee_ids",
                        "status",
                        "created_by",
                    )
                    .first()
                )

                # Fetch the project timezone
                project = Project.objects.get(id=self.kwargs.get("project_id"))
                project_timezone = project.timezone

                datetime_fields = ["start_date", "end_date"]
                cycle = user_timezone_converter(
                    cycle, datetime_fields, project_timezone
                )

                # Send the model activity
                model_activity.delay(
                    model_name="cycle",
                    model_id=str(cycle["id"]),
                    requested_data=request.data,
                    current_instance=None,
                    actor_id=request.user.id,
                    slug=slug,
                    origin=base_host(request=request, is_app=True),
                )
                return Response(cycle, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(
                {
                    "error": "Both start date and end date are either required or are to be null"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, project_id, pk):
        queryset = self.get_queryset().filter(
            workspace__slug=slug, project_id=project_id, pk=pk
        )
        cycle = queryset.first()
        if cycle.archived_at:
            return Response(
                {"error": "Archived cycle cannot be updated"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_instance = json.dumps(
            CycleSerializer(cycle).data, cls=DjangoJSONEncoder
        )

        request_data = request.data

        if cycle.end_date is not None and cycle.end_date < timezone.now():
            if "sort_order" in request_data:
                # Can only change sort order for a completed cycle``
                request_data = {
                    "sort_order": request_data.get("sort_order", cycle.sort_order)
                }
            else:
                return Response(
                    {
                        "error": "The Cycle has already been completed so it cannot be edited"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = CycleWriteSerializer(
            cycle, data=request.data, partial=True, context={"project_id": project_id}
        )
        if serializer.is_valid():
            serializer.save()
            cycle = queryset.values(
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
                "version",
                # meta fields
                "is_favorite",
                "total_issues",
                "completed_issues",
                "assignee_ids",
                "status",
                "created_by",
            ).first()

            # Fetch the project timezone
            project = Project.objects.get(id=self.kwargs.get("project_id"))
            project_timezone = project.timezone

            datetime_fields = ["start_date", "end_date"]
            cycle = user_timezone_converter(cycle, datetime_fields, project_timezone)

            # Send the model activity
            model_activity.delay(
                model_name="cycle",
                model_id=str(cycle["id"]),
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )

            return Response(cycle, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def retrieve(self, request, slug, project_id, pk):
        queryset = self.get_queryset().filter(archived_at__isnull=True).filter(pk=pk)
        data = (
            self.get_queryset()
            .filter(pk=pk)
            .filter(archived_at__isnull=True)
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
                "version",
                # meta fields
                "is_favorite",
                "total_issues",
                "completed_issues",
                "assignee_ids",
                "status",
                "created_by",
            )
            .first()
        )

        if data is None:
            return Response(
                {"error": "Cycle not found"}, status=status.HTTP_404_NOT_FOUND
            )

        queryset = queryset.first()
        # Fetch the project timezone
        project = Project.objects.get(id=self.kwargs.get("project_id"))
        project_timezone = project.timezone
        datetime_fields = ["start_date", "end_date"]
        data = user_timezone_converter(data, datetime_fields, project_timezone)

        recent_visited_task.delay(
            slug=slug,
            entity_name="cycle",
            entity_identifier=pk,
            user_id=request.user.id,
            project_id=project_id,
        )
        return Response(data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], creator=True, model=Cycle)
    def destroy(self, request, slug, project_id, pk):
        cycle = Cycle.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        if cycle.owned_by_id != request.user.id and not (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                member=request.user,
                role=20,
                project_id=project_id,
                is_active=True,
            ).exists()
        ):
            return Response(
                {"error": "Only admin or owner can delete the cycle"},
                status=status.HTTP_403_FORBIDDEN,
            )

        cycle_issues = list(
            CycleIssue.objects.filter(cycle_id=self.kwargs.get("pk")).values_list(
                "issue", flat=True
            )
        )

        issue_activity.delay(
            type="cycle.activity.deleted",
            requested_data=json.dumps(
                {
                    "cycle_id": str(pk),
                    "cycle_name": str(cycle.name),
                    "issues": [str(issue_id) for issue_id in cycle_issues],
                }
            ),
            actor_id=str(request.user.id),
            issue_id=str(pk),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )
        # TODO: Soft delete the cycle break the onetoone relationship with cycle issue
        cycle.delete()

        # Delete the user favorite cycle
        UserFavorite.objects.filter(
            user=request.user,
            entity_type="cycle",
            entity_identifier=pk,
            project_id=project_id,
        ).delete()
        # Delete the cycle from recent visits
        UserRecentVisit.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_name="cycle",
        ).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CycleDateCheckEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        start_date = request.data.get("start_date", False)
        end_date = request.data.get("end_date", False)
        cycle_id = request.data.get("cycle_id")
        if not start_date or not end_date:
            return Response(
                {"error": "Start date and end date both are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        start_date = convert_to_utc(
            date=str(start_date), project_id=project_id, is_start_date=True
        )
        end_date = convert_to_utc(
            date=str(end_date),
            project_id=project_id,
        )

        # Check if any cycle intersects in the given interval
        cycles = Cycle.objects.filter(
            Q(workspace__slug=slug)
            & Q(project_id=project_id)
            & (
                Q(start_date__lte=start_date, end_date__gte=start_date)
                | Q(start_date__lte=end_date, end_date__gte=end_date)
                | Q(start_date__gte=start_date, end_date__lte=end_date)
            )
        ).exclude(pk=cycle_id)
        if cycles.exists():
            return Response(
                {
                    "error": "You have a cycle already on the given dates, if you want to create a draft cycle you can do that by removing dates",
                    "status": False,
                }
            )
        else:
            return Response({"status": True}, status=status.HTTP_200_OK)


class CycleFavoriteViewSet(BaseViewSet):
    model = UserFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related("cycle", "cycle__owned_by")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        _ = UserFavorite.objects.create(
            project_id=project_id,
            user=request.user,
            entity_type="cycle",
            entity_identifier=request.data.get("cycle"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, cycle_id):
        cycle_favorite = UserFavorite.objects.get(
            project=project_id,
            entity_type="cycle",
            user=request.user,
            workspace__slug=slug,
            entity_identifier=cycle_id,
        )
        cycle_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TransferCycleIssueEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, cycle_id):
        new_cycle_id = request.data.get("new_cycle_id", False)

        if not new_cycle_id:
            return Response(
                {"error": "New Cycle Id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_cycle = Cycle.objects.filter(
            workspace__slug=slug, project_id=project_id, pk=new_cycle_id
        ).first()

        old_cycle = (
            Cycle.objects.filter(
                workspace__slug=slug, project_id=project_id, pk=cycle_id
            )
            .annotate(
                total_issues=Count(
                    "issue_cycle",
                    filter=Q(
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                        issue_cycle__issue__deleted_at__isnull=True,
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
                        issue_cycle__issue__deleted_at__isnull=True,
                        issue_cycle__deleted_at__isnull=True,
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
                        issue_cycle__issue__deleted_at__isnull=True,
                        issue_cycle__deleted_at__isnull=True,
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
                        issue_cycle__issue__deleted_at__isnull=True,
                        issue_cycle__deleted_at__isnull=True,
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
                        issue_cycle__issue__deleted_at__isnull=True,
                        issue_cycle__deleted_at__isnull=True,
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
                        issue_cycle__issue__deleted_at__isnull=True,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
        )
        old_cycle = old_cycle.first()

        estimate_type = Project.objects.filter(
            workspace__slug=slug,
            pk=project_id,
            estimate__isnull=False,
            estimate__type="points",
        ).exists()

        if estimate_type:
            assignee_estimate_data = (
                Issue.issue_objects.filter(
                    issue_cycle__cycle_id=cycle_id,
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
            # assignee distribution serialization
            assignee_estimate_distribution = [
                {
                    "display_name": item["display_name"],
                    "assignee_id": (
                        str(item["assignee_id"]) if item["assignee_id"] else None
                    ),
                    "avatar": item.get("avatar"),
                    "avatar_url": item.get("avatar_url"),
                    "total_estimates": item["total_estimates"],
                    "completed_estimates": item["completed_estimates"],
                    "pending_estimates": item["pending_estimates"],
                }
                for item in assignee_estimate_data
            ]

            label_distribution_data = (
                Issue.issue_objects.filter(
                    issue_cycle__cycle_id=cycle_id,
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

            estimate_completion_chart = burndown_plot(
                queryset=old_cycle,
                slug=slug,
                project_id=project_id,
                plot_type="points",
                cycle_id=cycle_id,
            )
            # Label distribution serialization
            label_estimate_distribution = [
                {
                    "label_name": item["label_name"],
                    "color": item["color"],
                    "label_id": (str(item["label_id"]) if item["label_id"] else None),
                    "total_estimates": item["total_estimates"],
                    "completed_estimates": item["completed_estimates"],
                    "pending_estimates": item["pending_estimates"],
                }
                for item in label_distribution_data
            ]

        # Get the assignee distribution
        assignee_distribution = (
            Issue.issue_objects.filter(
                issue_cycle__cycle_id=cycle_id,
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
                        assignees__avatar_asset__isnull=True, then="assignees__avatar"
                    ),
                    default=Value(None),
                    output_field=models.CharField(),
                )
            )
            .values("display_name", "assignee_id", "avatar_url")
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
            .order_by("display_name")
        )
        # assignee distribution serialized
        assignee_distribution_data = [
            {
                "display_name": item["display_name"],
                "assignee_id": (
                    str(item["assignee_id"]) if item["assignee_id"] else None
                ),
                "avatar": item.get("avatar"),
                "avatar_url": item.get("avatar_url"),
                "total_issues": item["total_issues"],
                "completed_issues": item["completed_issues"],
                "pending_issues": item["pending_issues"],
            }
            for item in assignee_distribution
        ]

        # Get the label distribution
        label_distribution = (
            Issue.issue_objects.filter(
                issue_cycle__cycle_id=cycle_id,
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

        # Label distribution serilization
        label_distribution_data = [
            {
                "label_name": item["label_name"],
                "color": item["color"],
                "label_id": (str(item["label_id"]) if item["label_id"] else None),
                "total_issues": item["total_issues"],
                "completed_issues": item["completed_issues"],
                "pending_issues": item["pending_issues"],
            }
            for item in label_distribution
        ]

        # Pass the new_cycle queryset to burndown_plot
        completion_chart = burndown_plot(
            queryset=old_cycle,
            slug=slug,
            project_id=project_id,
            plot_type="issues",
            cycle_id=cycle_id,
        )

        current_cycle = Cycle.objects.filter(
            workspace__slug=slug, project_id=project_id, pk=cycle_id
        ).first()

        current_cycle.progress_snapshot = {
            "total_issues": old_cycle.total_issues,
            "completed_issues": old_cycle.completed_issues,
            "cancelled_issues": old_cycle.cancelled_issues,
            "started_issues": old_cycle.started_issues,
            "unstarted_issues": old_cycle.unstarted_issues,
            "backlog_issues": old_cycle.backlog_issues,
            "distribution": {
                "labels": label_distribution_data,
                "assignees": assignee_distribution_data,
                "completion_chart": completion_chart,
            },
            "estimate_distribution": (
                {}
                if not estimate_type
                else {
                    "labels": label_estimate_distribution,
                    "assignees": assignee_estimate_distribution,
                    "completion_chart": estimate_completion_chart,
                }
            ),
        }
        current_cycle.save(update_fields=["progress_snapshot"])

        if new_cycle.end_date is not None and new_cycle.end_date < timezone.now():
            return Response(
                {
                    "error": "The cycle where the issues are transferred is already completed"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cycle_issues = CycleIssue.objects.filter(
            cycle_id=cycle_id,
            project_id=project_id,
            workspace__slug=slug,
            issue__state__group__in=["backlog", "unstarted", "started"],
        )

        updated_cycles = []
        update_cycle_issue_activity = []
        for cycle_issue in cycle_issues:
            cycle_issue.cycle_id = new_cycle_id
            updated_cycles.append(cycle_issue)
            update_cycle_issue_activity.append(
                {
                    "old_cycle_id": str(cycle_id),
                    "new_cycle_id": str(new_cycle_id),
                    "issue_id": str(cycle_issue.issue_id),
                }
            )

        cycle_issues = CycleIssue.objects.bulk_update(
            updated_cycles, ["cycle_id"], batch_size=100
        )

        # Capture Issue Activity
        issue_activity.delay(
            type="cycle.activity.created",
            requested_data=json.dumps({"cycles_list": []}),
            actor_id=str(self.request.user.id),
            issue_id=None,
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=json.dumps(
                {
                    "updated_cycle_issues": update_cycle_issue_activity,
                    "created_cycle_issues": "[]",
                }
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )

        return Response({"message": "Success"}, status=status.HTTP_200_OK)


class CycleUserPropertiesEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def patch(self, request, slug, project_id, cycle_id):
        cycle_properties = CycleUserProperties.objects.get(
            user=request.user,
            cycle_id=cycle_id,
            project_id=project_id,
            workspace__slug=slug,
        )

        cycle_properties.filters = request.data.get("filters", cycle_properties.filters)
        cycle_properties.display_filters = request.data.get(
            "display_filters", cycle_properties.display_filters
        )
        cycle_properties.display_properties = request.data.get(
            "display_properties", cycle_properties.display_properties
        )
        cycle_properties.save()

        serializer = CycleUserPropertiesSerializer(cycle_properties)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, cycle_id):
        cycle_properties, _ = CycleUserProperties.objects.get_or_create(
            user=request.user,
            project_id=project_id,
            cycle_id=cycle_id,
            workspace__slug=slug,
        )
        serializer = CycleUserPropertiesSerializer(cycle_properties)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CycleProgressEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, cycle_id):
        cycle = Cycle.objects.filter(
            workspace__slug=slug, project_id=project_id, id=cycle_id
        ).first()
        if not cycle:
            return Response(
                {"error": "Cycle not found"}, status=status.HTTP_404_NOT_FOUND
            )
        aggregate_estimates = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                issue_cycle__cycle_id=cycle_id,
                issue_cycle__deleted_at__isnull=True,
                workspace__slug=slug,
                project_id=project_id,
            )
            .annotate(value_as_float=Cast("estimate_point__value", FloatField()))
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
                    "value_as_float", default=Value(0), output_field=FloatField()
                ),
            )
        )
        if cycle.progress_snapshot:
            backlog_issues = cycle.progress_snapshot.get("backlog_issues", 0)
            unstarted_issues = cycle.progress_snapshot.get("unstarted_issues", 0)
            started_issues = cycle.progress_snapshot.get("started_issues", 0)
            cancelled_issues = cycle.progress_snapshot.get("cancelled_issues", 0)
            completed_issues = cycle.progress_snapshot.get("completed_issues", 0)
            total_issues = cycle.progress_snapshot.get("total_issues", 0)
        else:
            backlog_issues = Issue.issue_objects.filter(
                issue_cycle__cycle_id=cycle_id,
                issue_cycle__deleted_at__isnull=True,
                workspace__slug=slug,
                project_id=project_id,
                state__group="backlog",
            ).count()

            unstarted_issues = Issue.issue_objects.filter(
                issue_cycle__cycle_id=cycle_id,
                issue_cycle__deleted_at__isnull=True,
                workspace__slug=slug,
                project_id=project_id,
                state__group="unstarted",
            ).count()

            started_issues = Issue.issue_objects.filter(
                issue_cycle__cycle_id=cycle_id,
                issue_cycle__deleted_at__isnull=True,
                workspace__slug=slug,
                project_id=project_id,
                state__group="started",
            ).count()

            cancelled_issues = Issue.issue_objects.filter(
                issue_cycle__cycle_id=cycle_id,
                issue_cycle__deleted_at__isnull=True,
                workspace__slug=slug,
                project_id=project_id,
                state__group="cancelled",
            ).count()

            completed_issues = Issue.issue_objects.filter(
                issue_cycle__cycle_id=cycle_id,
                issue_cycle__deleted_at__isnull=True,
                workspace__slug=slug,
                project_id=project_id,
                state__group="completed",
            ).count()

            total_issues = Issue.issue_objects.filter(
                issue_cycle__cycle_id=cycle_id,
                issue_cycle__deleted_at__isnull=True,
                workspace__slug=slug,
                project_id=project_id,
            ).count()

        return Response(
            {
                "backlog_estimate_points": aggregate_estimates["backlog_estimate_point"]
                or 0,
                "unstarted_estimate_points": aggregate_estimates[
                    "unstarted_estimate_point"
                ]
                or 0,
                "started_estimate_points": aggregate_estimates["started_estimate_point"]
                or 0,
                "cancelled_estimate_points": aggregate_estimates[
                    "cancelled_estimate_point"
                ]
                or 0,
                "completed_estimate_points": aggregate_estimates[
                    "completed_estimate_points"
                ]
                or 0,
                "total_estimate_points": aggregate_estimates["total_estimate_points"],
                "backlog_issues": backlog_issues,
                "total_issues": total_issues,
                "completed_issues": completed_issues,
                "cancelled_issues": cancelled_issues,
                "started_issues": started_issues,
                "unstarted_issues": unstarted_issues,
            },
            status=status.HTTP_200_OK,
        )


class CycleAnalyticsEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, cycle_id):
        analytic_type = request.GET.get("type", "issues")
        cycle = (
            Cycle.objects.filter(
                workspace__slug=slug, project_id=project_id, id=cycle_id
            )
            .annotate(
                total_issues=Count(
                    "issue_cycle__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__issue__deleted_at__isnull=True,
                        issue_cycle__deleted_at__isnull=True,
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

        # this will tell whether the issues were transferred to the new cycle
        """ 
        if the issues were transferred to the new cycle, then the progress_snapshot will be present
        return the progress_snapshot data in the analytics for each date
            
        else issues were not transferred to the new cycle then generate the stats from the cycle isssue bridge tables
        """

        if cycle.progress_snapshot:
            distribution = cycle.progress_snapshot.get("distribution", {})
            return Response(
                {
                    "labels": distribution.get("labels", []),
                    "assignees": distribution.get("assignees", []),
                    "completion_chart": distribution.get("completion_chart", {}),
                },
                status=status.HTTP_200_OK,
            )

        estimate_type = Project.objects.filter(
            workspace__slug=slug,
            pk=project_id,
            estimate__isnull=False,
            estimate__type="points",
        ).exists()

        assignee_distribution = []
        label_distribution = []
        completion_chart = {}

        if analytic_type == "points" and estimate_type:
            assignee_distribution = (
                Issue.issue_objects.filter(
                    issue_cycle__cycle_id=cycle_id,
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
                    issue_cycle__cycle_id=cycle_id,
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
                    issue_cycle__deleted_at__isnull=True,
                    project_id=project_id,
                    workspace__slug=slug,
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
                    total_issues=Count(
                        "assignee_id",
                        filter=Q(archived_at__isnull=True, is_draft=False),
                    )
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
                    issue_cycle__deleted_at__isnull=True,
                    project_id=project_id,
                    workspace__slug=slug,
                )
                .annotate(label_name=F("labels__name"))
                .annotate(color=F("labels__color"))
                .annotate(label_id=F("labels__id"))
                .values("label_name", "color", "label_id")
                .annotate(
                    total_issues=Count(
                        "label_id", filter=Q(archived_at__isnull=True, is_draft=False)
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
                "assignees": assignee_distribution,
                "labels": label_distribution,
                "completion_chart": completion_chart,
            },
            status=status.HTTP_200_OK,
        )
