# Python imports
import json

# Django Imports
from django.utils import timezone
from django.db.models import Prefetch, F, OuterRef, Func, Exists, Count, Q
from django.core import serializers
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.core.serializers.json import DjangoJSONEncoder


# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from . import BaseViewSet, BaseAPIView, WebhookMixin
from plane.app.serializers import (
    ModuleWriteSerializer,
    ModuleSerializer,
    ModuleIssueSerializer,
    ModuleLinkSerializer,
    ModuleFavoriteSerializer,
    IssueSerializer,
    ModuleUserPropertiesSerializer,
)
from plane.app.permissions import (
    ProjectEntityPermission,
    ProjectLitePermission,
)
from plane.db.models import (
    Module,
    ModuleIssue,
    Project,
    Issue,
    ModuleLink,
    ModuleFavorite,
    IssueLink,
    IssueAttachment,
    IssueSubscriber,
    ModuleUserProperties,
)
from plane.bgtasks.issue_activites_task import issue_activity
from plane.utils.grouper import group_results
from plane.utils.issue_filters import issue_filters
from plane.utils.analytics_plot import burndown_plot


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
        subquery = ModuleFavorite.objects.filter(
            user=self.request.user,
            module_id=OuterRef("pk"),
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return (
            super()
            .get_queryset()
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(workspace__slug=self.kwargs.get("slug"))
            .annotate(is_favorite=Exists(subquery))
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
                total_issues=Count(
                    "issue_module",
                    filter=Q(
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                    ),
                ),
            )
            .annotate(
                completed_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="completed",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                    ),
                )
            )
            .annotate(
                cancelled_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="cancelled",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                    ),
                )
            )
            .annotate(
                started_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="started",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                    ),
                )
            )
            .annotate(
                unstarted_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="unstarted",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                    ),
                )
            )
            .annotate(
                backlog_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="backlog",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                    ),
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

            module = Module.objects.get(pk=serializer.data["id"])
            serializer = ModuleSerializer(module)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, slug, project_id):
        queryset = self.get_queryset()
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]
        modules = ModuleSerializer(
            queryset, many=True, fields=fields if fields else None
        ).data
        return Response(modules, status=status.HTTP_200_OK)

    def retrieve(self, request, slug, project_id, pk):
        queryset = self.get_queryset().get(pk=pk)

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
                    "assignee_id",
                    filter=Q(
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
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
                    "label_id",
                    filter=Q(
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                ),
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

        data = ModuleSerializer(queryset).data
        data["distribution"] = {
            "assignees": assignee_distribution,
            "labels": label_distribution,
            "completion_chart": {},
        }

        if queryset.start_date and queryset.target_date:
            data["distribution"]["completion_chart"] = burndown_plot(
                queryset=queryset,
                slug=slug,
                project_id=project_id,
                module_id=pk,
            )

        return Response(
            data,
            status=status.HTTP_200_OK,
        )

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


class ModuleIssueViewSet(WebhookMixin, BaseViewSet):
    serializer_class = ModuleIssueSerializer
    model = ModuleIssue
    webhook_event = "module_issue"
    bulk = True

    filterset_fields = [
        "issue__labels__id",
        "issue__assignees__id",
    ]

    permission_classes = [
        ProjectEntityPermission,
    ]


    def get_queryset(self):
        return (
            Issue.objects.filter(
                project_id=self.kwargs.get("project_id"),
                workspace__slug=self.kwargs.get("slug"),
                issue_module__module_id=self.kwargs.get("module_id")
            )
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("labels", "assignees")
            .prefetch_related('issue_module__module')
            .annotate(cycle_id=F("issue_cycle__cycle_id"))
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=IssueAttachment.objects.filter(
                    issue=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        ).distinct()

    @method_decorator(gzip_page)
    def list(self, request, slug, project_id, module_id):
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]
        filters = issue_filters(request.query_params, "GET")
        issue_queryset = self.get_queryset().filter(**filters)
        serializer = IssueSerializer(
            issue_queryset, many=True, fields=fields if fields else None
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    # create multiple issues inside a module
    def create_module_issues(self, request, slug, project_id, module_id):
        issues = request.data.get("issues", [])
        if not len(issues):
            return Response(
                {"error": "Issues are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        project = Project.objects.get(pk=project_id)
        _ = ModuleIssue.objects.bulk_create(
            [
                ModuleIssue(
                    issue_id=str(issue),
                    module_id=module_id,
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    created_by=request.user,
                    updated_by=request.user,
                )
                for issue in issues
            ],
            batch_size=10,
            ignore_conflicts=True,
        )
        # Bulk Update the activity
        _ = [
            issue_activity.delay(
                type="module.activity.created",
                requested_data=json.dumps({"module_id": str(module_id)}),
                actor_id=str(request.user.id),
                issue_id=str(issue),
                project_id=project_id,
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            for issue in issues
        ]
        issues = (self.get_queryset().filter(pk__in=issues))
        serializer = IssueSerializer(issues , many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    

    # create multiple module inside an issue
    def create_issue_modules(self, request, slug, project_id, issue_id):
        modules = request.data.get("modules", [])
        if not len(modules):
            return Response(
                {"error": "Modules are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project = Project.objects.get(pk=project_id)
        _ = ModuleIssue.objects.bulk_create(
            [
                ModuleIssue(
                    issue_id=issue_id,
                    module_id=module,
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    created_by=request.user,
                    updated_by=request.user,
                )
                for module in modules
            ],
            batch_size=10,
            ignore_conflicts=True,
        )
        # Bulk Update the activity
        _ = [
            issue_activity.delay(
                type="module.activity.created",
                requested_data=json.dumps({"module_id": module}),
                actor_id=str(request.user.id),
                issue_id=issue_id,
                project_id=project_id,
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            for module in modules
        ]

        issue = (self.get_queryset().filter(pk=issue_id).first())
        serializer = IssueSerializer(issue)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


    def destroy(self, request, slug, project_id, module_id, issue_id):
        module_issue = ModuleIssue.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            module_id=module_id,
            issue_id=issue_id,
        )
        issue_activity.delay(
            type="module.activity.deleted",
            requested_data=json.dumps({"module_id": str(module_id)}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=json.dumps({"module_name": module_issue.module.name}),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        module_issue.delete()
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
            .filter(project__project_projectmember__member=self.request.user)
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
