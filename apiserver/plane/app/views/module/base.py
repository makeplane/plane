# Python imports
import json

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
)
from django.db.models.functions import Coalesce

# Django Imports
from django.utils import timezone
from rest_framework import status

# Third party imports
from rest_framework.response import Response

from plane.app.permissions import (
    ProjectEntityPermission,
    ProjectLitePermission,
)
from plane.app.serializers import (
    ModuleDetailSerializer,
    ModuleFavoriteSerializer,
    ModuleLinkSerializer,
    ModuleSerializer,
    ModuleUserPropertiesSerializer,
    ModuleWriteSerializer,
)
from plane.bgtasks.issue_activites_task import issue_activity
from plane.db.models import (
    Issue,
    Module,
    ModuleFavorite,
    ModuleIssue,
    ModuleLink,
    ModuleUserProperties,
    Project,
)
from plane.utils.analytics_plot import burndown_plot
from plane.utils.user_timezone_converter import user_timezone_converter


# Module imports
from .. import BaseAPIView, BaseViewSet, WebhookMixin


class ModuleViewSet(WebhookMixin, BaseViewSet):
    model = Module
    permission_classes = [
        ProjectEntityPermission,
    ]
    webhook_event = "module"

    def get_serializer_class(self):
        return (
            ModuleWriteSerializer
            if self.action in ["create", "update", "partial_update"]
            else ModuleSerializer
        )

    def get_queryset(self):
        favorite_subquery = ModuleFavorite.objects.filter(
            user=self.request.user,
            module_id=OuterRef("pk"),
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        cancelled_issues = (
            Issue.issue_objects.filter(
                state__group="cancelled",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        completed_issues = (
            Issue.issue_objects.filter(
                state__group="completed",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        started_issues = (
            Issue.issue_objects.filter(
                state__group="started",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        unstarted_issues = (
            Issue.issue_objects.filter(
                state__group="unstarted",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        backlog_issues = (
            Issue.issue_objects.filter(
                state__group="backlog",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        total_issues = (
            Issue.issue_objects.filter(
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        return (
            super()
            .get_queryset()
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(workspace__slug=self.kwargs.get("slug"))
            .annotate(is_favorite=Exists(favorite_subquery))
            .select_related("project")
            .select_related("workspace")
            .select_related("lead")
            .prefetch_related("members")
            .prefetch_related(
                Prefetch(
                    "link_module",
                    queryset=ModuleLink.objects.select_related(
                        "module", "created_by"
                    ),
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
            .annotate(
                started_issues=Coalesce(
                    Subquery(started_issues[:1]),
                    Value(0, output_field=IntegerField()),
                )
            )
            .annotate(
                unstarted_issues=Coalesce(
                    Subquery(unstarted_issues[:1]),
                    Value(0, output_field=IntegerField()),
                )
            )
            .annotate(
                backlog_issues=Coalesce(
                    Subquery(backlog_issues[:1]),
                    Value(0, output_field=IntegerField()),
                )
            )
            .annotate(
                total_issues=Coalesce(
                    Subquery(total_issues[:1]),
                    Value(0, output_field=IntegerField()),
                )
            )
            .annotate(
                member_ids=Coalesce(
                    ArrayAgg(
                        "members__id",
                        distinct=True,
                        filter=~Q(members__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
            .order_by("-is_favorite", "-created_at")
        )

    def create(self, request, slug, project_id):
        project = Project.objects.get(workspace__slug=slug, pk=project_id)
        serializer = ModuleWriteSerializer(
            data=request.data, context={"project": project}
        )

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
                    # computed fields
                    "is_favorite",
                    "cancelled_issues",
                    "completed_issues",
                    "total_issues",
                    "started_issues",
                    "unstarted_issues",
                    "backlog_issues",
                    "created_at",
                    "updated_at",
                )
            ).first()
            datetime_fields = ["created_at", "updated_at"]
            module = user_timezone_converter(
                module, datetime_fields, request.user.user_timezone
            )
            return Response(module, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, slug, project_id):
        queryset = self.get_queryset().filter(archived_at__isnull=True)
        if self.fields:
            modules = ModuleSerializer(
                queryset,
                many=True,
                fields=self.fields,
            ).data
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
                # computed fields
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
            modules = user_timezone_converter(
                modules, datetime_fields, request.user.user_timezone
            )
        return Response(modules, status=status.HTTP_200_OK)

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
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        )

        assignee_distribution = (
            Issue.objects.filter(
                issue_module__module_id=pk,
                workspace__slug=slug,
                project_id=project_id,
            )
            .annotate(first_name=F("assignees__first_name"))
            .annotate(last_name=F("assignees__last_name"))
            .annotate(assignee_id=F("assignees__id"))
            .annotate(display_name=F("assignees__display_name"))
            .annotate(avatar=F("assignees__avatar"))
            .values(
                "first_name",
                "last_name",
                "assignee_id",
                "avatar",
                "display_name",
            )
            .annotate(
                total_issues=Count(
                    "id",
                    filter=Q(
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
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

        label_distribution = (
            Issue.objects.filter(
                issue_module__module_id=pk,
                workspace__slug=slug,
                project_id=project_id,
            )
            .annotate(label_name=F("labels__name"))
            .annotate(color=F("labels__color"))
            .annotate(label_id=F("labels__id"))
            .values("label_name", "color", "label_id")
            .annotate(
                total_issues=Count(
                    "id",
                    filter=Q(
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                ),
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

        data = ModuleDetailSerializer(queryset.first()).data
        data["distribution"] = {
            "assignees": assignee_distribution,
            "labels": label_distribution,
            "completion_chart": {},
        }

        # Fetch the modules
        modules = queryset.first()
        if modules and modules.start_date and modules.target_date:
            data["distribution"]["completion_chart"] = burndown_plot(
                queryset=modules,
                slug=slug,
                project_id=project_id,
                module_id=pk,
            )

        return Response(
            data,
            status=status.HTTP_200_OK,
        )

    def partial_update(self, request, slug, project_id, pk):
        module = self.get_queryset().filter(pk=pk)

        if module.first().archived_at:
            return Response(
                {"error": "Archived module cannot be updated"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ModuleWriteSerializer(
            module.first(), data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            module = module.values(
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
                # computed fields
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
            datetime_fields = ["created_at", "updated_at"]
            module = user_timezone_converter(
                module, datetime_fields, request.user.user_timezone
            )
            return Response(module, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, project_id, pk):
        module = Module.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )
        module_issues = list(
            ModuleIssue.objects.filter(module_id=pk).values_list(
                "issue", flat=True
            )
        )
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
                origin=request.META.get("HTTP_ORIGIN"),
            )
            for issue in module_issues
        ]
        module.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ModuleLinkViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]

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
    serializer_class = ModuleFavoriteSerializer
    model = ModuleFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related("module")
        )

    def create(self, request, slug, project_id):
        serializer = ModuleFavoriteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, project_id=project_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, project_id, module_id):
        module_favorite = ModuleFavorite.objects.get(
            project=project_id,
            user=request.user,
            workspace__slug=slug,
            module_id=module_id,
        )
        module_favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ModuleUserPropertiesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectLitePermission,
    ]

    def patch(self, request, slug, project_id, module_id):
        module_properties = ModuleUserProperties.objects.get(
            user=request.user,
            module_id=module_id,
            project_id=project_id,
            workspace__slug=slug,
        )

        module_properties.filters = request.data.get(
            "filters", module_properties.filters
        )
        module_properties.display_filters = request.data.get(
            "display_filters", module_properties.display_filters
        )
        module_properties.display_properties = request.data.get(
            "display_properties", module_properties.display_properties
        )
        module_properties.save()

        serializer = ModuleUserPropertiesSerializer(module_properties)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request, slug, project_id, module_id):
        module_properties, _ = ModuleUserProperties.objects.get_or_create(
            user=request.user,
            project_id=project_id,
            module_id=module_id,
            workspace__slug=slug,
        )
        serializer = ModuleUserPropertiesSerializer(module_properties)
        return Response(serializer.data, status=status.HTTP_200_OK)
