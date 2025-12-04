# Python imports
import json

# Django Imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import (
    Count,
    Exists,
    F,
    Func,
    IntegerField,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    UUIDField,
    Value,
    Sum,
    FloatField,
    Case,
    When,
)
from django.db import models, transaction
from django.db.models.functions import Coalesce, Cast, Concat
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

# Module imports
from plane.app.permissions import (
    ProjectEntityPermission,
    ProjectLitePermission,
    allow_permission,
    ROLE,
)

from plane.app.serializers import (
    ModuleDetailSerializer,
    ModuleLinkSerializer,
    ModuleSerializer,
    ModuleUserPropertiesSerializer,
    ModuleWriteSerializer, CycleSerializer,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    Issue,
    Module,
    UserFavorite,
    ModuleIssue,
    ModuleLink,
    ModuleUserProperties,
    Project,
    UserRecentVisit, Cycle, CycleIssue,
)
from plane.utils.analytics_plot import burndown_plot
from plane.utils.paginator import CustomPaginator
from plane.utils.response import list_response
from plane.utils.timezone_converter import user_timezone_converter
from plane.bgtasks.webhook_task import model_activity
from .. import BaseAPIView, BaseViewSet
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.utils.host import base_host


class ModuleViewSet(BaseViewSet):
    model = Module
    webhook_event = "module"

    def get_serializer_class(self):
        return ModuleWriteSerializer if self.action in ["create", "update", "partial_update"] else ModuleSerializer

    def get_queryset(self):
        favorite_subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="module",
            entity_identifier=OuterRef("pk"),
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        cancelled_issues = (
            Issue.issue_objects.filter(
                state__group="cancelled",
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        completed_issues = (
            Issue.issue_objects.filter(
                state__group="completed",
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        started_issues = (
            Issue.issue_objects.filter(
                state__group="started",
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        unstarted_issues = (
            Issue.issue_objects.filter(
                state__group="unstarted",
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        backlog_issues = (
            Issue.issue_objects.filter(
                state__group="backlog",
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        total_issues = (
            Issue.issue_objects.filter(
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        completed_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="completed",
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(completed_estimate_points=Sum(Cast("estimate_point__value", FloatField())))
            .values("completed_estimate_points")[:1]
        )

        total_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(total_estimate_points=Sum(Cast("estimate_point__value", FloatField())))
            .values("total_estimate_points")[:1]
        )
        backlog_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="backlog",
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(backlog_estimate_point=Sum(Cast("estimate_point__value", FloatField())))
            .values("backlog_estimate_point")[:1]
        )
        unstarted_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="unstarted",
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(unstarted_estimate_point=Sum(Cast("estimate_point__value", FloatField())))
            .values("unstarted_estimate_point")[:1]
        )
        started_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="started",
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(started_estimate_point=Sum(Cast("estimate_point__value", FloatField())))
            .values("started_estimate_point")[:1]
        )
        cancelled_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="cancelled",
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(cancelled_estimate_point=Sum(Cast("estimate_point__value", FloatField())))
            .values("cancelled_estimate_point")[:1]
        )
        return (
            super()
            .get_queryset()
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(workspace__slug=self.kwargs.get("slug"))
            .annotate(is_favorite=Exists(favorite_subquery))
            .prefetch_related("members")
            .prefetch_related(
                Prefetch(
                    "link_module",
                    queryset=ModuleLink.objects.select_related("module", "created_by"),
                )
            )
            .annotate(
                completed_issues=Coalesce(
                    Subquery(completed_issues[:1]),
                    Value(0, output_field=IntegerField()),
                )
            )
            .annotate(
                cancelled_issues=Coalesce(
                    Subquery(cancelled_issues[:1]),
                    Value(0, output_field=IntegerField()),
                )
            )
            .annotate(started_issues=Coalesce(Subquery(started_issues[:1]), Value(0, output_field=IntegerField())))
            .annotate(
                unstarted_issues=Coalesce(
                    Subquery(unstarted_issues[:1]),
                    Value(0, output_field=IntegerField()),
                )
            )
            .annotate(backlog_issues=Coalesce(Subquery(backlog_issues[:1]), Value(0, output_field=IntegerField())))
            .annotate(total_issues=Coalesce(Subquery(total_issues[:1]), Value(0, output_field=IntegerField())))
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
                total_estimate_points=Coalesce(Subquery(total_estimate_point), Value(0, output_field=FloatField()))
            )
            .annotate(
                member_ids=Coalesce(
                    ArrayAgg(
                        "members__id",
                        distinct=True,
                        filter=Q(
                            members__id__isnull=False,
                            modulemember__deleted_at__isnull=True,
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
            .order_by("-is_favorite", "-created_at")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        project = Project.objects.get(workspace__slug=slug, pk=project_id)
        serializer = ModuleWriteSerializer(data=request.data, context={"project": project})

        if serializer.is_valid():
            serializer.save()

            module = (
                self.get_queryset()
                .filter(pk=serializer.data["id"])
                .values(  # Required fields
                    "id",
                    "workspace_id",
                    "project_id",
                    # Model fields
                    "name",
                    "description",
                    "description_text",
                    "description_html",
                    "start_date",
                    "target_date",
                    "status",
                    "lead_id",
                    "member_ids",
                    "view_props",
                    "sort_order",
                    "external_source",
                    "external_id",
                    "logo_props",
                    # computed fields
                    "is_favorite",
                    "cancelled_issues",
                    "completed_issues",
                    "total_issues",
                    "started_issues",
                    "unstarted_issues",
                    "completed_estimate_points",
                    "total_estimate_points",
                    "backlog_issues",
                    "created_at",
                    "updated_at",
                )
            ).first()
            # Send the model activity
            model_activity.delay(
                model_name="module",
                model_id=str(module["id"]),
                requested_data=request.data,
                current_instance=None,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )
            datetime_fields = ["created_at", "updated_at"]
            module = user_timezone_converter(module, datetime_fields, request.user.user_timezone)
            return Response(module, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        queryset = self.get_queryset().filter(archived_at__isnull=True)
        if self.fields:
            modules = ModuleSerializer(queryset, many=True, fields=self.fields).data
        else:
            modules = queryset.values(  # Required fields
                "id",
                "workspace_id",
                "project_id",
                # Model fields
                "name",
                "description",
                "description_text",
                "description_html",
                "start_date",
                "target_date",
                "status",
                "lead_id",
                "member_ids",
                "view_props",
                "sort_order",
                "external_source",
                "external_id",
                "logo_props",
                # computed fields
                "completed_estimate_points",
                "total_estimate_points",
                "total_issues",
                "is_favorite",
                "cancelled_issues",
                "completed_issues",
                "started_issues",
                "unstarted_issues",
                "backlog_issues",
                "created_at",
                "updated_at",
            )
            datetime_fields = ["created_at", "updated_at"]
            modules = user_timezone_converter(modules, datetime_fields, request.user.user_timezone)
        return Response(modules, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def retrieve(self, request, slug, project_id, pk):
        queryset = (
            self.get_queryset()
            .filter(archived_at__isnull=True)
            .filter(pk=pk)
            .annotate(
                sub_issues=Issue.issue_objects.filter(
                    project_id=self.kwargs.get("project_id"),
                    parent__isnull=False,
                    issue_module__module_id=pk,
                    issue_module__deleted_at__isnull=True,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        )

        if not queryset.exists():
            return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)

        estimate_type = Project.objects.filter(
            workspace__slug=slug,
            pk=project_id,
            estimate__isnull=False,
            estimate__type="points",
        ).exists()

        data = ModuleDetailSerializer(queryset.first()).data
        modules = queryset.first()

        data["estimate_distribution"] = {}

        if estimate_type:
            assignee_distribution = (
                Issue.issue_objects.filter(
                    issue_module__module_id=pk,
                    issue_module__deleted_at__isnull=True,
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(first_name=F("assignees__first_name"))
                .annotate(last_name=F("assignees__last_name"))
                .annotate(assignee_id=F("assignees__id"))
                .annotate(display_name=F("assignees__display_name"))
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
                .values(
                    "first_name",
                    "last_name",
                    "assignee_id",
                    "avatar_url",
                    "display_name",
                )
                .annotate(total_estimates=Sum(Cast("estimate_point__value", FloatField())))
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
                .order_by("first_name", "last_name")
            )

            label_distribution = (
                Issue.issue_objects.filter(
                    issue_module__module_id=pk,
                    issue_module__deleted_at__isnull=True,
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(label_name=F("labels__name"))
                .annotate(color=F("labels__color"))
                .annotate(label_id=F("labels__id"))
                .values("label_name", "color", "label_id")
                .annotate(total_estimates=Sum(Cast("estimate_point__value", FloatField())))
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
            data["estimate_distribution"]["assignees"] = assignee_distribution
            data["estimate_distribution"]["labels"] = label_distribution

            if modules and modules.start_date and modules.target_date:
                data["estimate_distribution"]["completion_chart"] = burndown_plot(
                    queryset=modules,
                    slug=slug,
                    project_id=project_id,
                    plot_type="points",
                    module_id=pk,
                )

        assignee_distribution = (
            Issue.issue_objects.filter(
                issue_module__module_id=pk,
                issue_module__deleted_at__isnull=True,
                workspace__slug=slug,
                project_id=project_id,
            )
            .annotate(first_name=F("assignees__first_name"))
            .annotate(last_name=F("assignees__last_name"))
            .annotate(assignee_id=F("assignees__id"))
            .annotate(display_name=F("assignees__display_name"))
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
                    When(assignees__avatar_asset__isnull=True, then="assignees__avatar"),
                    default=Value(None),
                    output_field=models.CharField(),
                )
            )
            .values("first_name", "last_name", "assignee_id", "avatar_url", "display_name")
            .annotate(total_issues=Count("id", filter=Q(archived_at__isnull=True, is_draft=False)))
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

        label_distribution = (
            Issue.issue_objects.filter(
                issue_module__module_id=pk,
                issue_module__deleted_at__isnull=True,
                workspace__slug=slug,
                project_id=project_id,
            )
            .annotate(label_name=F("labels__name"))
            .annotate(color=F("labels__color"))
            .annotate(label_id=F("labels__id"))
            .values("label_name", "color", "label_id")
            .annotate(total_issues=Count("id", filter=Q(archived_at__isnull=True, is_draft=False)))
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

        if modules and modules.start_date and modules.target_date and modules.total_issues > 0:
            data["distribution"]["completion_chart"] = burndown_plot(
                queryset=modules,
                slug=slug,
                project_id=project_id,
                plot_type="issues",
                module_id=pk,
            )

        recent_visited_task.delay(
            slug=slug,
            entity_name="module",
            entity_identifier=pk,
            user_id=request.user.id,
            project_id=project_id,
        )

        return Response(data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, project_id, pk):
        module_queryset = self.get_queryset().filter(pk=pk)

        current_module = module_queryset.first()

        if not current_module:
            return Response(
                {"error": "Module not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if current_module.archived_at:
            return Response(
                {"error": "Archived module cannot be updated"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        current_instance = json.dumps(ModuleSerializer(current_module).data, cls=DjangoJSONEncoder)
        serializer = ModuleWriteSerializer(current_module, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            module = module_queryset.values(
                # Required fields
                "id",
                "workspace_id",
                "project_id",
                # Model fields
                "name",
                "description",
                "description_text",
                "description_html",
                "start_date",
                "target_date",
                "status",
                "lead_id",
                "member_ids",
                "view_props",
                "sort_order",
                "external_source",
                "external_id",
                "logo_props",
                # computed fields
                "completed_estimate_points",
                "total_estimate_points",
                "is_favorite",
                "cancelled_issues",
                "completed_issues",
                "started_issues",
                "total_issues",
                "unstarted_issues",
                "backlog_issues",
                "created_at",
                "updated_at",
            ).first()

            # Send the model activity
            model_activity.delay(
                model_name="module",
                model_id=str(module["id"]),
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )

            datetime_fields = ["created_at", "updated_at"]
            module = user_timezone_converter(module, datetime_fields, request.user.user_timezone)
            return Response(module, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], creator=True, model=Module)
    def destroy(self, request, slug, project_id, pk):
        module = Module.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)

        module_issues = list(ModuleIssue.objects.filter(module_id=pk).values_list("issue", flat=True))
        _ = [
            issue_activity.delay(
                type="module.activity.deleted",
                requested_data=json.dumps({"module_id": str(pk)}),
                actor_id=str(request.user.id),
                issue_id=str(issue),
                project_id=project_id,
                current_instance=json.dumps({"module_name": str(module.name)}),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )
            for issue in module_issues
        ]
        module.delete()
        # Delete the module issues
        ModuleIssue.objects.filter(module=pk, project_id=project_id).delete()
        # Delete the user favorite module
        UserFavorite.objects.filter(
            user=request.user,
            entity_type="module",
            entity_identifier=pk,
            project_id=project_id,
        ).delete()
        # delete the module from recent visits
        UserRecentVisit.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_name="module",
        ).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ModuleLinkViewSet(BaseViewSet):
    permission_classes = [ProjectEntityPermission]

    model = ModuleLink
    serializer_class = ModuleLinkSerializer

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            module_id=self.kwargs.get("module_id"),
        )

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(module_id=self.kwargs.get("module_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .order_by("-created_at")
            .distinct()
        )


class ModuleFavoriteViewSet(BaseViewSet):
    model = UserFavorite
    permission_classes = [ProjectLitePermission]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related("module")
        )

    def create(self, request, slug, project_id):
        _ = UserFavorite.objects.create(
            project_id=project_id,
            user=request.user,
            entity_type="module",
            entity_identifier=request.data.get("module"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def destroy(self, request, slug, project_id, module_id):
        module_favorite = UserFavorite.objects.get(
            project_id=project_id,
            user=request.user,
            workspace__slug=slug,
            entity_type="module",
            entity_identifier=module_id,
        )
        module_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ModuleUserPropertiesEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def patch(self, request, slug, project_id, module_id):
        module_properties = ModuleUserProperties.objects.get(
            user=request.user,
            module_id=module_id,
            project_id=project_id,
            workspace__slug=slug,
        )

        module_properties.filters = request.data.get("filters", module_properties.filters)
        module_properties.rich_filters = request.data.get("rich_filters", module_properties.rich_filters)
        module_properties.display_filters = request.data.get("display_filters", module_properties.display_filters)
        module_properties.display_properties = request.data.get(
            "display_properties", module_properties.display_properties
        )
        module_properties.save()

        serializer = ModuleUserPropertiesSerializer(module_properties)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, module_id):
        module_properties, _ = ModuleUserProperties.objects.get_or_create(
            user=request.user,
            project_id=project_id,
            module_id=module_id,
            workspace__slug=slug,
        )
        serializer = ModuleUserPropertiesSerializer(module_properties)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ModuleAPI(BaseViewSet):
    pagination_class = CustomPaginator

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @action(detail=False, methods=["post"], url_path="associate-cycle")
    def associate_cycle(self, request, slug, project_id):
        module_id = request.data.get("module_id")
        cycle_id = request.data.get("cycle_id")

        if not module_id or not cycle_id:
            return Response({"error": "module_id and cycle_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cycle_info = Cycle.objects.values("project_id", "workspace_id").get(id=cycle_id)
        except Cycle.DoesNotExist:
            return Response({"error": "Cycle not found"}, status=status.HTTP_404_NOT_FOUND)

        if not Module.objects.filter(id=module_id, project_id=cycle_info["project_id"]).exists():
            return Response({"error": "Module not found in cycle's project"}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            Cycle.objects.filter(id=cycle_id).update(module_id=module_id)

            issue_rows = list(
                CycleIssue.objects.filter(cycle_id=cycle_id).values("issue_id", "project_id", "workspace_id")
            )

            if not issue_rows:
                return Response(
                    {"module_id": module_id, "cycle_id": cycle_id, "created": 0},
                    status=status.HTTP_201_CREATED,
                )

            existing_issue_ids = set(
                ModuleIssue.objects.filter(module_id=module_id, project_id=cycle_info["project_id"]).values_list(
                    "issue_id", flat=True
                )
            )

            to_create = [
                ModuleIssue(
                    project_id=row["project_id"],
                    workspace_id=row["workspace_id"],
                    issue_id=row["issue_id"],
                    module_id=module_id,
                )
                for row in issue_rows
                if row["issue_id"] not in existing_issue_ids
            ]

            if to_create:
                ModuleIssue.objects.bulk_create(to_create, batch_size=1000)

        return Response(
            {"module_id": module_id, "cycle_id": cycle_id, "created": len(to_create)},
            status=status.HTTP_201_CREATED,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @action(detail=False, methods=["get"], url_path="select-cycle-list")
    def select_cycle_list(self, request, slug, project_id):
        query = Cycle.objects.filter(workspace__slug=slug, project=project_id, module__isnull=True)
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(query, request)
        serializer = CycleSerializer(paginated_queryset, many=True)
        return list_response(data=serializer.data, count=query.count())

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @action(detail=False, methods=["get"], url_path="cycles")
    def cycle_list(self, request, slug, project_id):
        module_id = request.query_params.get("module_id")
        query = Cycle.objects.filter(workspace__slug=slug, project=project_id, module_id=module_id)
        serializer = CycleSerializer(query, many=True)
        return Response(data=serializer.data)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @action(detail=False, methods=["post"], url_path="cancel-cycle")
    def cancel_cycle(self, request, slug, project_id):
        module_id = request.data.get("module_id")
        cycle_id = request.data.get("cycle_id")

        # 取消发布和迭代的关联关系
        Cycle.objects.filter(id=cycle_id).update(module_id=None)

        # 将绑定的迭代的工作项同步删除
        cycle_issue_query = CycleIssue.objects.filter(cycle_id=cycle_id).values_list('issue_id', flat=True)
        ModuleIssue.objects.filter(module_id=module_id, issue_id__in=cycle_issue_query).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @action(detail=False, methods=["get"], url_path="statistics")
    def statistics(self, request, slug, project_id):
        module_id = request.GET.get("module_id")
        if not module_id:
            return Response(
                {"error": "Module ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 基础查询：获取该模块下所有未归档、未删除且非草稿的 issues
        issues = Issue.objects.filter(
            issue_module__module_id=module_id,
            issue_module__deleted_at__isnull=True,
            project_id=project_id,
            workspace__slug=slug,
            archived_at__isnull=True,
            is_draft=False,
            deleted_at__isnull=True
        ).select_related('state', 'type').distinct()

        # 1. 统计总数及各状态组的数量
        total_count = issues.count()
        state_distribution = issues.aggregate(
            backlog=Count('id', filter=Q(state__group='backlog'), distinct=True),
            unstarted=Count('id', filter=Q(state__group='unstarted'), distinct=True),
            started=Count('id', filter=Q(state__group='started'), distinct=True),
            completed=Count('id', filter=Q(state__group='completed'), distinct=True),
            cancelled=Count('id', filter=Q(state__group='cancelled'), distinct=True)
        )

        # 2. 统计各 Issue Type 的数量及对应各状态组的数量
        # 使用 values() 分组统计
        type_stats = issues.values(
            'type__id', 'type__name'
        ).annotate(
            total=Count('id', distinct=True),
            backlog=Count('id', filter=Q(state__group='backlog'), distinct=True),
            unstarted=Count('id', filter=Q(state__group='unstarted'), distinct=True),
            started=Count('id', filter=Q(state__group='started'), distinct=True),
            completed=Count('id', filter=Q(state__group='completed'), distinct=True),
            cancelled=Count('id', filter=Q(state__group='cancelled'), distinct=True)
        ).order_by('type__name')

        response_data = {
            "total_issues": total_count,
            "state_distribution": state_distribution,
            "type_distribution": list(type_stats)
        }

        return Response(response_data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @action(detail=False, methods=["post"], url_path="note")
    def update_note(self, request, slug, project_id):
        module_id = request.data.get("module_id")
        note = request.data.get("note")
        Module.objects.filter(pk=module_id).update(note=note)
        return Response(status=status.HTTP_200_OK)
