# Python imports
import json

# Django imports
from django.core import serializers
from django.db.models import Count, F, Func, OuterRef, Prefetch, Q
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiExample, OpenApiRequest

# Module imports
from plane.api.serializers import (
    IssueSerializer,
    ModuleIssueSerializer,
    ModuleSerializer,
    ModuleIssueRequestSerializer,
    ModuleCreateSerializer,
    ModuleUpdateSerializer,
)
from plane.app.permissions import ProjectEntityPermission
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    Issue,
    FileAsset,
    IssueLink,
    Module,
    ModuleIssue,
    ModuleLink,
    Project,
    ProjectMember,
    UserFavorite,
)

from .base import BaseAPIView
from plane.bgtasks.webhook_task import model_activity
from plane.utils.host import base_host
from plane.utils.openapi import (
    module_docs,
    module_issue_docs,
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_ID_PARAMETER,
    MODULE_ID_PARAMETER,
    MODULE_PK_PARAMETER,
    ISSUE_ID_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    ORDER_BY_PARAMETER,
    FIELDS_PARAMETER,
    EXPAND_PARAMETER,
    create_paginated_response,
    # Request Examples
    MODULE_CREATE_EXAMPLE,
    MODULE_UPDATE_EXAMPLE,
    MODULE_ISSUE_REQUEST_EXAMPLE,
    # Response Examples
    MODULE_EXAMPLE,
    MODULE_ISSUE_EXAMPLE,
    INVALID_REQUEST_RESPONSE,
    PROJECT_NOT_FOUND_RESPONSE,
    EXTERNAL_ID_EXISTS_RESPONSE,
    MODULE_NOT_FOUND_RESPONSE,
    DELETED_RESPONSE,
    ADMIN_ONLY_RESPONSE,
    REQUIRED_FIELDS_RESPONSE,
    MODULE_ISSUE_NOT_FOUND_RESPONSE,
    ARCHIVED_RESPONSE,
    CANNOT_ARCHIVE_RESPONSE,
    UNARCHIVED_RESPONSE,
)


class ModuleListCreateAPIEndpoint(BaseAPIView):
    """Module List and Create Endpoint"""

    serializer_class = ModuleSerializer
    model = Module
    webhook_event = "module"
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            Module.objects.filter(project_id=self.kwargs.get("project_id"))
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("project")
            .select_related("workspace")
            .select_related("lead")
            .prefetch_related("members")
            .prefetch_related(
                Prefetch(
                    "link_module",
                    queryset=ModuleLink.objects.select_related("module", "created_by"),
                )
            )
            .annotate(
                total_issues=Count(
                    "issue_module",
                    filter=Q(
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                completed_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="completed",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                cancelled_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="cancelled",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                started_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="started",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                unstarted_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="unstarted",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                backlog_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="backlog",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
        )

    @module_docs(
        operation_id="create_module",
        summary="Create module",
        description="Create a new project module with specified name, description, and timeline.",
        request=OpenApiRequest(
            request=ModuleCreateSerializer,
            examples=[MODULE_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Module created",
                response=ModuleSerializer,
                examples=[MODULE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
            409: EXTERNAL_ID_EXISTS_RESPONSE,
        },
    )
    def post(self, request, slug, project_id):
        """Create module

        Create a new project module with specified name, description, and timeline.
        Automatically assigns the creator as module lead and tracks activity.
        """
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        serializer = ModuleCreateSerializer(
            data=request.data,
            context={"project_id": project_id, "workspace_id": project.workspace_id},
        )
        if serializer.is_valid():
            if (
                request.data.get("external_id")
                and request.data.get("external_source")
                and Module.objects.filter(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source"),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                module = Module.objects.filter(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source"),
                    external_id=request.data.get("external_id"),
                ).first()
                return Response(
                    {
                        "error": "Module with the same external id and external source already exists",
                        "id": str(module.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            serializer.save()
            # Send the model activity
            model_activity.delay(
                model_name="module",
                model_id=str(serializer.instance.id),
                requested_data=request.data,
                current_instance=None,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )
            module = Module.objects.get(pk=serializer.instance.id)
            serializer = ModuleSerializer(module)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @module_docs(
        operation_id="list_modules",
        summary="List modules",
        description="Retrieve all modules in a project.",
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                ModuleSerializer,
                "PaginatedModuleResponse",
                "Paginated list of modules",
                "Paginated Modules",
            ),
            404: OpenApiResponse(description="Module not found"),
        },
    )
    def get(self, request, slug, project_id):
        """List or retrieve modules

        Retrieve all modules in a project or get details of a specific module.
        Returns paginated results with module statistics and member information.
        """
        return self.paginate(
            request=request,
            queryset=(self.get_queryset().filter(archived_at__isnull=True)),
            on_results=lambda modules: ModuleSerializer(
                modules, many=True, fields=self.fields, expand=self.expand
            ).data,
        )


class ModuleDetailAPIEndpoint(BaseAPIView):
    """Module Detail Endpoint"""

    model = Module
    permission_classes = [ProjectEntityPermission]
    serializer_class = ModuleSerializer
    webhook_event = "module"
    use_read_replica = True

    def get_queryset(self):
        return (
            Module.objects.filter(project_id=self.kwargs.get("project_id"))
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("project")
            .select_related("workspace")
            .select_related("lead")
            .prefetch_related("members")
            .prefetch_related(
                Prefetch(
                    "link_module",
                    queryset=ModuleLink.objects.select_related("module", "created_by"),
                )
            )
            .annotate(
                total_issues=Count(
                    "issue_module",
                    filter=Q(
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                completed_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="completed",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                cancelled_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="cancelled",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                started_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="started",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                unstarted_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="unstarted",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                backlog_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="backlog",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
        )

    @module_docs(
        operation_id="update_module",
        summary="Update module",
        description="Modify an existing module's properties like name, description, status, or timeline.",
        parameters=[
            MODULE_PK_PARAMETER,
        ],
        request=OpenApiRequest(
            request=ModuleUpdateSerializer,
            examples=[MODULE_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Module updated successfully",
                response=ModuleSerializer,
                examples=[MODULE_EXAMPLE],
            ),
            400: OpenApiResponse(
                description="Invalid request data",
                response=ModuleSerializer,
                examples=[MODULE_UPDATE_EXAMPLE],
            ),
            404: OpenApiResponse(description="Module not found"),
            409: OpenApiResponse(
                description="Module with same external ID already exists"
            ),
        },
    )
    def patch(self, request, slug, project_id, pk):
        """Update module

        Modify an existing module's properties like name, description, status, or timeline.
        Tracks all changes in model activity logs for audit purposes.
        """
        module = Module.objects.get(pk=pk, project_id=project_id, workspace__slug=slug)

        current_instance = json.dumps(
            ModuleSerializer(module).data, cls=DjangoJSONEncoder
        )

        if module.archived_at:
            return Response(
                {"error": "Archived module cannot be edited"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ModuleSerializer(
            module, data=request.data, context={"project_id": project_id}, partial=True
        )
        if serializer.is_valid():
            if (
                request.data.get("external_id")
                and (module.external_id != request.data.get("external_id"))
                and Module.objects.filter(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get(
                        "external_source", module.external_source
                    ),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                return Response(
                    {
                        "error": "Module with the same external id and external source already exists",
                        "id": str(module.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            serializer.save()

            # Send the model activity
            model_activity.delay(
                model_name="module",
                model_id=str(serializer.instance.id),
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @module_docs(
        operation_id="retrieve_module",
        summary="Retrieve module",
        description="Retrieve details of a specific module.",
        parameters=[
            MODULE_PK_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Module",
                response=ModuleSerializer,
                examples=[MODULE_EXAMPLE],
            ),
            404: OpenApiResponse(description="Module not found"),
        },
    )
    def get(self, request, slug, project_id, pk):
        """Retrieve module

        Retrieve details of a specific module.
        """
        queryset = self.get_queryset().filter(archived_at__isnull=True).get(pk=pk)
        data = ModuleSerializer(queryset, fields=self.fields, expand=self.expand).data
        return Response(data, status=status.HTTP_200_OK)

    @module_docs(
        operation_id="delete_module",
        summary="Delete module",
        description="Permanently remove a module and all its associated issue relationships.",
        parameters=[
            MODULE_PK_PARAMETER,
        ],
        responses={
            204: DELETED_RESPONSE,
            403: ADMIN_ONLY_RESPONSE,
            404: MODULE_NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, pk):
        """Delete module

        Permanently remove a module and all its associated issue relationships.
        Only admins or the module creator can perform this action.
        """
        module = Module.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        if module.created_by_id != request.user.id and (
            not ProjectMember.objects.filter(
                workspace__slug=slug,
                member=request.user,
                role=20,
                project_id=project_id,
                is_active=True,
            ).exists()
        ):
            return Response(
                {"error": "Only admin or creator can delete the module"},
                status=status.HTTP_403_FORBIDDEN,
            )

        module_issues = list(
            ModuleIssue.objects.filter(module_id=pk).values_list("issue", flat=True)
        )
        issue_activity.delay(
            type="module.activity.deleted",
            requested_data=json.dumps(
                {
                    "module_id": str(pk),
                    "module_name": str(module.name),
                    "issues": [str(issue_id) for issue_id in module_issues],
                }
            ),
            actor_id=str(request.user.id),
            issue_id=None,
            project_id=str(project_id),
            current_instance=json.dumps({"module_name": str(module.name)}),
            epoch=int(timezone.now().timestamp()),
            origin=base_host(request=request, is_app=True),
        )
        module.delete()
        # Delete the module issues
        ModuleIssue.objects.filter(module=pk, project_id=project_id).delete()
        # Delete the user favorite module
        UserFavorite.objects.filter(
            entity_type="module", entity_identifier=pk, project_id=project_id
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ModuleIssueListCreateAPIEndpoint(BaseAPIView):
    """Module Work Item List and Create Endpoint"""

    serializer_class = ModuleIssueSerializer
    model = ModuleIssue
    webhook_event = "module_issue"
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            ModuleIssue.objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("issue"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(module_id=self.kwargs.get("module_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("project")
            .select_related("workspace")
            .select_related("module")
            .select_related("issue", "issue__state", "issue__project")
            .prefetch_related("issue__assignees", "issue__labels")
            .prefetch_related("module__members")
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    @module_issue_docs(
        operation_id="list_module_work_items",
        summary="List module work items",
        description="Retrieve all work items assigned to a module with detailed information.",
        parameters=[
            MODULE_ID_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        request={},
        responses={
            200: create_paginated_response(
                IssueSerializer,
                "PaginatedModuleIssueResponse",
                "Paginated list of module work items",
                "Paginated Module Work Items",
            ),
            404: OpenApiResponse(description="Module not found"),
        },
    )
    def get(self, request, slug, project_id, module_id):
        """List module work items

        Retrieve all work items assigned to a module with detailed information.
        Returns paginated results including assignees, labels, and attachments.
        """
        order_by = request.GET.get("order_by", "created_at")
        issues = (
            Issue.issue_objects.filter(
                issue_module__module_id=module_id, issue_module__deleted_at__isnull=True
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(bridge_id=F("issue_module__id"))
            .filter(project_id=project_id)
            .filter(workspace__slug=slug)
            .select_related("project")
            .select_related("workspace")
            .select_related("state")
            .select_related("parent")
            .prefetch_related("assignees")
            .prefetch_related("labels")
            .order_by(order_by)
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        )
        return self.paginate(
            request=request,
            queryset=(issues),
            on_results=lambda issues: IssueSerializer(
                issues, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    @module_issue_docs(
        operation_id="add_module_work_items",
        summary="Add Work Items to Module",
        description="Assign multiple work items to a module or move them from another module. Automatically handles bulk creation and updates with activity tracking.",
        parameters=[
            MODULE_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=ModuleIssueRequestSerializer,
            examples=[MODULE_ISSUE_REQUEST_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Module issues added",
                response=ModuleIssueSerializer,
                examples=[MODULE_ISSUE_EXAMPLE],
            ),
            400: REQUIRED_FIELDS_RESPONSE,
            404: MODULE_NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug, project_id, module_id):
        """Add module work items

        Assign multiple work items to a module or move them from another module.
        Automatically handles bulk creation and updates with activity tracking.
        """
        issues = request.data.get("issues", [])
        if not len(issues):
            return Response(
                {"error": "Issues are required"}, status=status.HTTP_400_BAD_REQUEST
            )
        module = Module.objects.get(
            workspace__slug=slug, project_id=project_id, pk=module_id
        )

        issues = Issue.objects.filter(
            workspace__slug=slug, project_id=project_id, pk__in=issues
        ).values_list("id", flat=True)

        module_issues = list(ModuleIssue.objects.filter(issue_id__in=issues))

        update_module_issue_activity = []
        records_to_update = []
        record_to_create = []

        for issue in issues:
            module_issue = [
                module_issue
                for module_issue in module_issues
                if str(module_issue.issue_id) in issues
            ]

            if len(module_issue):
                if module_issue[0].module_id != module_id:
                    update_module_issue_activity.append(
                        {
                            "old_module_id": str(module_issue[0].module_id),
                            "new_module_id": str(module_id),
                            "issue_id": str(module_issue[0].issue_id),
                        }
                    )
                    module_issue[0].module_id = module_id
                    records_to_update.append(module_issue[0])
            else:
                record_to_create.append(
                    ModuleIssue(
                        module=module,
                        issue_id=issue,
                        project_id=project_id,
                        workspace=module.workspace,
                        created_by=request.user,
                        updated_by=request.user,
                    )
                )

        ModuleIssue.objects.bulk_create(
            record_to_create, batch_size=10, ignore_conflicts=True
        )

        ModuleIssue.objects.bulk_update(records_to_update, ["module"], batch_size=10)

        # Capture Issue Activity
        issue_activity.delay(
            type="module.activity.created",
            requested_data=json.dumps({"modules_list": str(issues)}),
            actor_id=str(self.request.user.id),
            issue_id=None,
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=json.dumps(
                {
                    "updated_module_issues": update_module_issue_activity,
                    "created_module_issues": serializers.serialize(
                        "json", record_to_create
                    ),
                }
            ),
            epoch=int(timezone.now().timestamp()),
            origin=base_host(request=request, is_app=True),
        )

        return Response(
            ModuleIssueSerializer(self.get_queryset(), many=True).data,
            status=status.HTTP_200_OK,
        )


class ModuleIssueDetailAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to module work items.

    """

    serializer_class = ModuleIssueSerializer
    model = ModuleIssue
    webhook_event = "module_issue"
    bulk = True
    use_read_replica = True

    permission_classes = [ProjectEntityPermission]

    def get_queryset(self):
        return (
            ModuleIssue.objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("issue"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(module_id=self.kwargs.get("module_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("project")
            .select_related("workspace")
            .select_related("module")
            .select_related("issue", "issue__state", "issue__project")
            .prefetch_related("issue__assignees", "issue__labels")
            .prefetch_related("module__members")
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    @module_issue_docs(
        operation_id="retrieve_module_work_item",
        summary="Retrieve module work item",
        description="Retrieve details of a specific module work item.",
        parameters=[
            MODULE_ID_PARAMETER,
            ISSUE_ID_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                IssueSerializer,
                "PaginatedModuleIssueDetailResponse",
                "Paginated list of module work item details",
                "Module Work Item Details",
            ),
            404: OpenApiResponse(description="Module not found"),
        },
    )
    def get(self, request, slug, project_id, module_id, issue_id):
        """List module work items

        Retrieve all work items assigned to a module with detailed information.
        Returns paginated results including assignees, labels, and attachments.
        """
        order_by = request.GET.get("order_by", "created_at")
        issues = (
            Issue.issue_objects.filter(
                issue_module__module_id=module_id,
                issue_module__deleted_at__isnull=True,
                pk=issue_id,
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(bridge_id=F("issue_module__id"))
            .filter(project_id=project_id)
            .filter(workspace__slug=slug)
            .select_related("project")
            .select_related("workspace")
            .select_related("state")
            .select_related("parent")
            .prefetch_related("assignees")
            .prefetch_related("labels")
            .order_by(order_by)
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        )
        return self.paginate(
            request=request,
            queryset=(issues),
            on_results=lambda issues: IssueSerializer(
                issues, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    @module_issue_docs(
        operation_id="delete_module_work_item",
        summary="Delete module work item",
        description="Remove a work item from a module while keeping the work item in the project.",
        parameters=[
            MODULE_ID_PARAMETER,
            ISSUE_ID_PARAMETER,
        ],
        responses={
            204: DELETED_RESPONSE,
            404: MODULE_ISSUE_NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, module_id, issue_id):
        """Remove module work item

        Remove a work item from a module while keeping the work item in the project.
        Records the removal activity for tracking purposes.
        """
        module_issue = ModuleIssue.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            module_id=module_id,
            issue_id=issue_id,
        )
        module_issue.delete()
        issue_activity.delay(
            type="module.activity.deleted",
            requested_data=json.dumps(
                {"module_id": str(module_id), "issues": [str(module_issue.issue_id)]}
            ),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ModuleArchiveUnarchiveAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            Module.objects.filter(project_id=self.kwargs.get("project_id"))
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(archived_at__isnull=False)
            .select_related("project")
            .select_related("workspace")
            .select_related("lead")
            .prefetch_related("members")
            .prefetch_related(
                Prefetch(
                    "link_module",
                    queryset=ModuleLink.objects.select_related("module", "created_by"),
                )
            )
            .annotate(
                total_issues=Count(
                    "issue_module",
                    filter=Q(
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                completed_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="completed",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                cancelled_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="cancelled",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                started_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="started",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                unstarted_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="unstarted",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                backlog_issues=Count(
                    "issue_module__issue__state__group",
                    filter=Q(
                        issue_module__issue__state__group="backlog",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
        )

    @module_docs(
        operation_id="list_archived_modules",
        summary="List archived modules",
        description="Retrieve all modules that have been archived in the project.",
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        request={},
        responses={
            200: create_paginated_response(
                ModuleSerializer,
                "PaginatedArchivedModuleResponse",
                "Paginated list of archived modules",
                "Paginated Archived Modules",
            ),
            404: OpenApiResponse(description="Project not found"),
        },
    )
    def get(self, request, slug, project_id):
        """List archived modules

        Retrieve all modules that have been archived in the project.
        Returns paginated results with module statistics.
        """
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda modules: ModuleSerializer(
                modules, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    @module_docs(
        operation_id="archive_module",
        summary="Archive module",
        description="Move a module to archived status for historical tracking.",
        parameters=[
            MODULE_PK_PARAMETER,
        ],
        request={},
        responses={
            204: ARCHIVED_RESPONSE,
            400: CANNOT_ARCHIVE_RESPONSE,
            404: MODULE_NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug, project_id, pk):
        """Archive module

        Move a completed module to archived status for historical tracking.
        Only modules with completed status can be archived.
        """
        module = Module.objects.get(pk=pk, project_id=project_id, workspace__slug=slug)
        if module.status not in ["completed", "cancelled"]:
            return Response(
                {"error": "Only completed or cancelled modules can be archived"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        module.archived_at = timezone.now()
        module.save()
        UserFavorite.objects.filter(
            entity_type="module",
            entity_identifier=pk,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @module_docs(
        operation_id="unarchive_module",
        summary="Unarchive module",
        description="Restore an archived module to active status, making it available for regular use.",
        parameters=[
            MODULE_PK_PARAMETER,
        ],
        responses={
            204: UNARCHIVED_RESPONSE,
            404: MODULE_NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, pk):
        """Unarchive module

        Restore an archived module to active status, making it available for regular use.
        The module will reappear in active module lists and become fully functional.
        """
        module = Module.objects.get(pk=pk, project_id=project_id, workspace__slug=slug)
        module.archived_at = None
        module.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
