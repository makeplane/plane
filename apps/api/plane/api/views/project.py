# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import json

# Django imports
from django.db import IntegrityError
from django.db.models import Count, Exists, F, Func, OuterRef, Prefetch, Q, Subquery
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest


# Module imports
from plane.db.models import (
    Cycle,
    Intake,
    Module,
    Project,
    DeployBoard,
    ProjectMember,
    State,
    DEFAULT_STATES,
    Workspace,
    UserFavorite,
    IssueType,
    ProjectIssueType,
    IntakeIssue,
    Issue,
    Label,
    ProjectPage,
    StateGroup,
)
from plane.bgtasks.webhook_task import model_activity, webhook_activity
from plane.api.views.base import ScopedBaseAPIView
from plane.utils.host import base_host
from plane.api.serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
    ProjectFeatureSerializer,
)
from plane.permissions import can, ProjectPermissions
from plane.utils.openapi import (
    project_docs,
    PROJECT_ID_PARAMETER,
    PROJECT_PK_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    ORDER_BY_PARAMETER,
    FIELDS_PARAMETER,
    EXPAND_PARAMETER,
    create_paginated_response,
    # Request Examples
    PROJECT_CREATE_EXAMPLE,
    PROJECT_UPDATE_EXAMPLE,
    # Response Examples
    PROJECT_EXAMPLE,
    PROJECT_NOT_FOUND_RESPONSE,
    WORKSPACE_NOT_FOUND_RESPONSE,
    PROJECT_NAME_TAKEN_RESPONSE,
    DELETED_RESPONSE,
    ARCHIVED_RESPONSE,
    UNARCHIVED_RESPONSE,
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_FEATURE_EXAMPLE,
)

from plane.ee.models import ProjectFeature, IssueProperty
from plane.utils.oauth import (
    READ_SCOPE,
    WRITE_SCOPE,
    PROJECTS_READ_SCOPE,
    PROJECTS_WRITE_SCOPE,
    PROJECTS_FEATURES_READ_SCOPE,
    PROJECTS_FEATURES_WRITE_SCOPE,
)


class ProjectListCreateAPIEndpoint(ScopedBaseAPIView):
    """Project List and Create Endpoint"""

    serializer_class = ProjectSerializer
    model = Project
    webhook_event = "project"
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [PROJECTS_WRITE_SCOPE]],
    }
    use_read_replica = True

    def get_queryset(self):
        return (
            Project.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                Q(
                    project_projectmember__member=self.request.user,
                    project_projectmember__is_active=True,
                )
                | Q(network=2)
            )
            .select_related("project_lead")
            .annotate(
                is_member=Exists(
                    ProjectMember.objects.filter(
                        member=self.request.user,
                        project_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                        is_active=True,
                    )
                )
            )
            .annotate(
                total_members=ProjectMember.objects.filter(
                    project_id=OuterRef("id"), member__is_bot=False, is_active=True
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                total_cycles=Cycle.objects.filter(project_id=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                total_modules=Module.objects.filter(project_id=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                member_role=ProjectMember.objects.filter(
                    project_id=OuterRef("pk"),
                    member_id=self.request.user.id,
                    is_active=True,
                ).values("role")
            )
            .annotate(
                is_deployed=Exists(
                    DeployBoard.objects.filter(
                        project_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                    )
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    @project_docs(
        operation_id="list_projects",
        summary="List or retrieve projects",
        description="Retrieve all projects in a workspace or get details of a specific project.",
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                ProjectSerializer,
                "PaginatedProjectResponse",
                "Paginated list of projects",
                "Paginated Projects",
            ),
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    @can(ProjectPermissions.BROWSE, resource_param="workspace_id", scope_param_type="workspace")
    def get(self, request, slug):
        """List projects

        Retrieve all projects in a workspace or get details of a specific project.
        Returns projects ordered by user's custom sort order with member information.
        """
        external_id = request.GET.get("external_id")
        external_source = request.GET.get("external_source")

        if external_id and external_source:
            project = Project.objects.get(
                external_id=external_id,
                external_source=external_source,
                workspace__slug=slug,
            )
            return Response(
                ProjectSerializer(project, fields=self.fields, expand=self.expand).data,
                status=status.HTTP_200_OK,
            )

        sort_order_query = ProjectMember.objects.filter(
            member=request.user,
            project_id=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
            is_active=True,
        ).values("sort_order")
        projects = (
            self.get_queryset()
            .annotate(sort_order=Subquery(sort_order_query))
            .prefetch_related(
                Prefetch(
                    "project_projectmember",
                    queryset=ProjectMember.objects.filter(workspace__slug=slug, is_active=True).select_related(
                        "member"
                    ),
                )
            )
            .order_by(request.GET.get("order_by", "sort_order"))
        )
        return self.paginate(
            request=request,
            queryset=(projects),
            on_results=lambda projects: (
                ProjectSerializer(projects, many=True, fields=self.fields, expand=self.expand).data
            ),
        )

    @project_docs(
        operation_id="create_project",
        summary="Create project",
        description="Create a new project in the workspace with default states and member assignments.",
        request=OpenApiRequest(
            request=ProjectCreateSerializer,
            examples=[PROJECT_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Project created successfully",
                response=ProjectSerializer,
                examples=[PROJECT_EXAMPLE],
            ),
            404: WORKSPACE_NOT_FOUND_RESPONSE,
            409: PROJECT_NAME_TAKEN_RESPONSE,
        },
    )
    @can(ProjectPermissions.CREATE, resource_param="workspace_id", scope_param_type="workspace")
    def post(self, request, slug):
        """Create project

        Create a new project in the workspace with default states and member assignments.
        Automatically adds the creator as admin and sets up default workflow states.
        """

        try:
            workspace = Workspace.objects.get(slug=slug)

            serializer = ProjectCreateSerializer(data={**request.data}, context={"workspace_id": workspace.id})

            if serializer.is_valid():
                if (
                    request.data.get("external_id")
                    and request.data.get("external_source")
                    and Project.objects.filter(
                        external_id=request.data.get("external_id"),
                        external_source=request.data.get("external_source"),
                        workspace__slug=slug,
                    ).exists()
                ):
                    project = Project.objects.filter(
                        external_id=request.data.get("external_id"),
                        external_source=request.data.get("external_source"),
                        workspace__slug=slug,
                    ).first()
                    return Response(
                        {
                            "error": "Project with the same external id and external source already exists",
                            "id": str(project.id),
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                serializer.save()

                intake_view = request.data.get("intake_view", None)
                is_issue_type_enabled = request.data.get("is_issue_type_enabled", False)

                if intake_view:
                    intake = Intake.objects.filter(project=serializer.instance.id, is_default=True).first()

                    if not intake:
                        Intake.objects.create(
                            name=f"{serializer.instance.name} Intake",
                            project_id=serializer.instance.id,
                            is_default=True,
                            workspace_id=serializer.instance.workspace.id,
                        )

                if is_issue_type_enabled:
                    issue_type = IssueType.objects.filter(
                        workspace_id=serializer.instance.workspace.id,
                        project_issue_types__project_id__in=[serializer.instance.id],
                        is_default=True,
                    ).first()

                    if not issue_type:
                        # Create a new default issue type
                        issue_type = IssueType.objects.create(
                            workspace_id=serializer.instance.workspace.id,
                            name="Task",
                            is_default=True,
                            description="Default work item type with the option to add new properties",
                            logo_props={
                                "in_use": "icon",
                                "icon": {"color": "#ffffff", "background_color": "#6695FF"},
                            },
                        )

                        ProjectIssueType.objects.create(
                            issue_type_id=issue_type.id,
                            is_default=True,
                            project_id=serializer.instance.id,
                            workspace_id=serializer.instance.workspace.id,
                            level=0,
                        )

                # Add the user as Administrator to the project
                _ = ProjectMember.objects.create(project_id=serializer.instance.id, member=request.user, role=20)

                if serializer.instance.project_lead is not None and str(serializer.instance.project_lead) != str(
                    request.user.id
                ):
                    ProjectMember.objects.create(
                        project_id=serializer.instance.id,
                        member_id=serializer.instance.project_lead,
                        role=20,
                    )

                State.objects.bulk_create(
                    [
                        State(
                            name=state["name"],
                            color=state["color"],
                            project=serializer.instance,
                            sequence=state["sequence"],
                            workspace=serializer.instance.workspace,
                            group=state["group"],
                            default=state.get("default", False),
                            created_by=request.user,
                        )
                        for state in DEFAULT_STATES
                    ]
                )

                project = self.get_queryset().filter(pk=serializer.instance.id).first()

                # Model activity
                model_activity.delay(
                    model_name="project",
                    model_id=str(project.id),
                    requested_data=request.data,
                    current_instance=None,
                    actor_id=request.user.id,
                    slug=slug,
                    origin=base_host(request=request, is_app=True),
                )

                serializer = ProjectSerializer(project)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_409_CONFLICT,
                )
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace does not exist"}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_409_CONFLICT,
            )


class ProjectDetailAPIEndpoint(ScopedBaseAPIView):
    """Project Endpoints to  update, retrieve and delete endpoint"""

    serializer_class = ProjectSerializer
    model = Project
    webhook_event = "project"

    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_READ_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [PROJECTS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [PROJECTS_WRITE_SCOPE]],
    }
    use_read_replica = True

    def get_queryset(self):
        return (
            Project.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                Q(
                    project_projectmember__member=self.request.user,
                    project_projectmember__is_active=True,
                )
                | Q(network=2)
            )
            .select_related("workspace", "workspace__owner", "default_assignee", "project_lead")
            .annotate(
                is_member=Exists(
                    ProjectMember.objects.filter(
                        member=self.request.user,
                        project_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                        is_active=True,
                    )
                )
            )
            .annotate(
                total_members=ProjectMember.objects.filter(
                    project_id=OuterRef("id"), member__is_bot=False, is_active=True
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                total_cycles=Cycle.objects.filter(project_id=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                total_modules=Module.objects.filter(project_id=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                member_role=ProjectMember.objects.filter(
                    project_id=OuterRef("pk"),
                    member_id=self.request.user.id,
                    is_active=True,
                ).values("role")
            )
            .annotate(
                is_deployed=Exists(
                    DeployBoard.objects.filter(
                        project_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                    )
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    @project_docs(
        operation_id="retrieve_project",
        summary="Retrieve project",
        description="Retrieve details of a specific project.",
        parameters=[
            PROJECT_PK_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Project details",
                response=ProjectSerializer,
                examples=[PROJECT_EXAMPLE],
            ),
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    @can(ProjectPermissions.VIEW, resource_param="pk")
    def get(self, request, slug, pk):
        """Retrieve project

        Retrieve details of a specific project.
        """
        project = self.get_queryset().get(workspace__slug=slug, pk=pk)
        serializer = ProjectSerializer(project, fields=self.fields, expand=self.expand)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @project_docs(
        operation_id="update_project",
        summary="Update project",
        description="Partially update an existing project's properties like name, description, or settings.",
        parameters=[
            PROJECT_PK_PARAMETER,
        ],
        request=OpenApiRequest(
            request=ProjectUpdateSerializer,
            examples=[PROJECT_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Project updated successfully",
                response=ProjectSerializer,
                examples=[PROJECT_EXAMPLE],
            ),
            404: PROJECT_NOT_FOUND_RESPONSE,
            409: PROJECT_NAME_TAKEN_RESPONSE,
        },
    )
    @can(ProjectPermissions.EDIT, resource_param="pk")
    def patch(self, request, slug, pk):
        """Update project

        Partially update an existing project's properties like name, description, or settings.
        Tracks changes in model activity logs for audit purposes.
        """
        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=pk, workspace=workspace)
            current_instance = json.dumps(ProjectSerializer(project).data, cls=DjangoJSONEncoder)

            intake_view = request.data.get("intake_view", project.intake_view)

            if project.archived_at:
                return Response(
                    {"error": "Archived project cannot be updated"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = ProjectUpdateSerializer(
                project,
                data={**request.data, "intake_view": intake_view},
                context={"workspace_id": workspace.id},
                partial=True,
            )

            if serializer.is_valid():
                # don't allow external id and external source to be changed
                # if they are already set for an existing project
                # if (
                #     request.data.get("external_id")
                #     and request.data.get("external_source")
                #     and Project.objects.filter(
                #         external_id=request.data.get("external_id"),
                #         external_source=request.data.get("external_source"),
                #         workspace__slug=slug,
                #     )
                #     .exclude(id=pk)
                #     .exists()
                # ):
                #     return Response(
                #         {
                #             "error": "Project with the same external id and external source already exists",
                #             "id": str(project.id),
                #         },
                #         status=status.HTTP_409_CONFLICT,
                #     )

                serializer.save()
                if serializer.data["intake_view"]:
                    intake = Intake.objects.filter(project=project, is_default=True).first()

                    if not intake:
                        Intake.objects.create(
                            name=f"{project.name} Intake",
                            project=project,
                            is_default=True,
                        )

                project = self.get_queryset().filter(pk=serializer.instance.id).first()

                model_activity.delay(
                    model_name="project",
                    model_id=str(project.id),
                    requested_data=request.data,
                    current_instance=current_instance,
                    actor_id=request.user.id,
                    slug=slug,
                    origin=base_host(request=request, is_app=True),
                )

                serializer = ProjectSerializer(project)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_409_CONFLICT,
                )
        except (Project.DoesNotExist, Workspace.DoesNotExist):
            return Response({"error": "Project does not exist"}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_409_CONFLICT,
            )

    @project_docs(
        operation_id="delete_project",
        summary="Delete project",
        description="Permanently remove a project and all its associated data from the workspace.",
        parameters=[
            PROJECT_PK_PARAMETER,
        ],
        responses={
            204: DELETED_RESPONSE,
        },
    )
    @can(ProjectPermissions.DELETE, resource_param="pk")
    def delete(self, request, slug, pk):
        """Delete project

        Permanently remove a project and all its associated data from the workspace.
        Only admins can delete projects and the action cannot be undone.
        """
        project = Project.objects.get(pk=pk, workspace__slug=slug)
        # Delete the user favorite cycle
        UserFavorite.objects.filter(entity_type="project", entity_identifier=pk, project_id=pk).delete()
        project.delete()
        webhook_activity.delay(
            event="project",
            verb="deleted",
            field=None,
            old_value=None,
            new_value=None,
            actor_id=request.user.id,
            slug=slug,
            current_site=base_host(request=request, is_app=True),
            event_id=project.id,
            old_identifier=None,
            new_identifier=None,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectArchiveUnarchiveAPIEndpoint(ScopedBaseAPIView):
    """Project Archive and Unarchive Endpoint"""

    required_alternate_scopes = {
        "POST": [[WRITE_SCOPE], [PROJECTS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [PROJECTS_WRITE_SCOPE]],
    }

    @project_docs(
        operation_id="archive_project",
        summary="Archive project",
        description="Move a project to archived status, hiding it from active project lists.",
        parameters=[
            PROJECT_ID_PARAMETER,
        ],
        request={},
        responses={
            204: ARCHIVED_RESPONSE,
        },
    )
    @can(ProjectPermissions.ARCHIVE, resource_param="project_id")
    def post(self, request, slug, project_id):
        """Archive project

        Move a project to archived status, hiding it from active project lists.
        Archived projects remain accessible but are excluded from regular workflows.
        """
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        project.archived_at = timezone.now()
        project.save()
        UserFavorite.objects.filter(workspace__slug=slug, project=project_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @project_docs(
        operation_id="unarchive_project",
        summary="Unarchive project",
        description="Restore an archived project to active status, making it available in regular workflows.",
        parameters=[
            PROJECT_ID_PARAMETER,
        ],
        request={},
        responses={
            204: UNARCHIVED_RESPONSE,
        },
    )
    @can(ProjectPermissions.ARCHIVE, resource_param="project_id")
    def delete(self, request, slug, project_id):
        """Unarchive project

        Restore an archived project to active status, making it available in regular workflows.
        The project will reappear in active project lists and become fully functional.
        """
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        project.archived_at = None
        project.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectFeatureAPIEndpoint(ScopedBaseAPIView):
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_FEATURES_READ_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [PROJECTS_FEATURES_WRITE_SCOPE]],
    }
    serializer_class = ProjectFeatureSerializer

    def get_queryset(self):
        project = Project.objects.filter(
            workspace__slug=self.kwargs.get("slug"), id=self.kwargs.get("project_id")
        ).first()
        # get or create the project feature
        project_feature, _ = ProjectFeature.objects.get_or_create(project=project)
        is_epic_enabled = project_feature.is_epic_enabled
        return {
            "epics": is_epic_enabled,
            "modules": project.module_view,
            "cycles": project.cycle_view,
            "views": project.issue_views_view,
            "pages": project.page_view,
            "intakes": project.intake_view,
            "work_item_types": project.is_issue_type_enabled,
            "workflows": project_feature.is_workflow_enabled,
        }

    @project_docs(
        operation_id="get_project_features",
        summary="Get project features",
        description="Get the features of a project",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Project features",
                response=ProjectFeatureSerializer,
                examples=[PROJECT_FEATURE_EXAMPLE],
            ),
        },
    )
    @can(ProjectPermissions.VIEW, resource_param="project_id")
    def get(self, request, slug, project_id):
        project_features = self.get_queryset()
        return Response(project_features, status=status.HTTP_200_OK)

    @project_docs(
        operation_id="update_project_features",
        summary="Update project features",
        description="Update the features of a project",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=ProjectFeatureSerializer,
            examples=[PROJECT_FEATURE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Project features updated successfully",
                response=ProjectFeatureSerializer,
                examples=[PROJECT_FEATURE_EXAMPLE],
            ),
        },
    )
    @can(ProjectPermissions.EDIT, resource_param="project_id")
    def patch(self, request, slug, project_id):
        project_features = self.get_queryset()
        serializer = ProjectFeatureSerializer(
            project_features, data=request.data, partial=True, context={"slug": slug, "project_id": project_id}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


ALLOWED_PROJECT_SUMMARY_FIELDS = [
    "members",
    "states",
    "labels",
    "cycles",
    "modules",
    "issues",
    "intakes",
    "work_item_types",
    "work_item_properties",
    "pages",
]


class ProjectSummaryAPIEndpoint(ScopedBaseAPIView):
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_READ_SCOPE]],
    }
    use_read_replica = True

    @project_docs(
        operation_id="get_project_summary",
        summary="Get project summary",
        description="Get the summary of a project",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
        ],
    )
    @can(ProjectPermissions.MANAGE, resource_param="project_id")
    def get(self, request, slug, project_id):
        """Get project summary

        Get the summary of a project
        """
        project = Project.objects.filter(pk=project_id, workspace__slug=slug).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        fields = request.GET.get("fields", "").split(",")
        requested_fields = set(filter(None, (f.strip() for f in fields))) & set(ALLOWED_PROJECT_SUMMARY_FIELDS)
        if not requested_fields:
            requested_fields = set(ALLOWED_PROJECT_SUMMARY_FIELDS)

        # Single DB round-trip with only requested count subqueries
        counts = self._get_all_summary_counts(project_id, requested_fields)
        counts_dict = {field: counts[field] for field in requested_fields}
        summary = {
            "id": project.id,
            "name": project.name,
            "identifier": project.identifier,
            "counts": counts_dict,
        }
        return Response(summary, status=status.HTTP_200_OK)

    # Getting all summary counts in one ORM query; only runs subqueries for requested fields.
    def _get_all_summary_counts(self, project_id, requested_fields):
        """Return requested summary counts in one ORM query; only runs subqueries for requested fields."""

        # Using a different annotation name for 'pages' to avoid conflict with Project.pages (M2M from Page)
        def _annotation_name(field):
            return "pages_count" if field == "pages" else field

        subquery_builders = {
            "members": lambda: (
                ProjectMember.objects.filter(project_id=OuterRef("pk"), is_active=True)
                .values("project_id")
                .annotate(count=Count("*"))
                .values("count")
            ),
            "states": lambda: (
                State.objects.filter(project_id=OuterRef("pk"))
                .values("project_id")
                .annotate(count=Count("*"))
                .values("count")
            ),
            "labels": lambda: (
                Label.objects.filter(project_id=OuterRef("pk"))
                .values("project_id")
                .annotate(count=Count("*"))
                .values("count")
            ),
            "cycles": lambda: (
                Cycle.objects.filter(project_id=OuterRef("pk"))
                .values("project_id")
                .annotate(count=Count("*"))
                .values("count")
            ),
            "modules": lambda: (
                Module.objects.filter(project_id=OuterRef("pk"))
                .values("project_id")
                .annotate(count=Count("*"))
                .values("count")
            ),
            "issues": lambda: (
                Issue.objects.filter(project_id=OuterRef("pk"))
                .exclude(state__group=StateGroup.TRIAGE.value)
                .values("project_id")
                .annotate(count=Count("*"))
                .values("count")
            ),
            "intakes": lambda: (
                IntakeIssue.objects.filter(project_id=OuterRef("pk"))
                .values("project_id")
                .annotate(count=Count("*"))
                .values("count")
            ),
            "work_item_types": lambda: (
                ProjectIssueType.objects.filter(project_id=OuterRef("pk"))
                .values("project_id")
                .annotate(count=Count("*"))
                .values("count")
            ),
            "work_item_properties": lambda: (
                IssueProperty.objects.filter(project_id=OuterRef("pk"))
                .values("project_id")
                .annotate(count=Count("*"))
                .values("count")
            ),
            "pages": lambda: (
                ProjectPage.objects.filter(project_id=OuterRef("pk"))
                .values("project_id")
                .annotate(count=Count("*"))
                .values("count")
            ),
        }

        # Build annotations dictionary for the requested fields
        annotations = {
            _annotation_name(field): Coalesce(Subquery(subquery_builders[field]()), 0) for field in requested_fields
        }

        # Prepare values list for the annotation names
        fields_list = sorted(requested_fields)
        values_list = [_annotation_name(f) for f in fields_list]
        # Execute the query and get the result
        query_result = Project.objects.filter(pk=project_id).annotate(**annotations).values(*values_list).first()
        if not query_result:
            return {field: 0 for field in requested_fields}
        # Return the result as a dictionary
        return {field: query_result[_annotation_name(field)] for field in requested_fields}
