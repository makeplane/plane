# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db import IntegrityError, transaction
from django.db.models import Exists, F, Func, OuterRef, Prefetch, Q, Subquery, Count, UUIDField, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest, OpenApiParameter
from drf_spectacular.types import OpenApiTypes


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
    Label,
    Issue,
    IssueType,
    StateGroup,
    IntakeIssue,
    ProjectPage,
)
from plane.db.models.issue_type import ProjectIssueType
from plane.bgtasks.webhook_task import model_activity, webhook_activity
from plane.utils.exception_logger import log_exception
from .base import BaseAPIView
from plane.utils.host import base_host
from plane.utils.order_queryset import PROJECT_ORDER_BY_ALLOWLIST, sanitize_order_by
from plane.api.serializers import (
    ProjectSerializer,
    ProjectLiteSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
    ProjectFeatureSerializer,
    WorkspaceFeatureSerializer,
    IssueTypeSerializer,
)
from plane.app.permissions import (
    ProjectAdminPermission,
    ProjectArchiveUnarchivePermission,
    ProjectBasePermission,
    ProjectEntityPermission,
    ProjectLitePermission,
    WorkSpaceAdminPermission,
    WorkspaceUserPermission,
)
from plane.utils.openapi import (
    project_docs,
    workspace_docs,
    work_item_type_docs,
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
    INVALID_REQUEST_RESPONSE,
    DELETED_RESPONSE,
    ARCHIVED_RESPONSE,
    UNARCHIVED_RESPONSE,
)


class ProjectListCreateAPIEndpoint(BaseAPIView):
    """Project List and Create Endpoint"""

    serializer_class = ProjectSerializer
    model = Project
    webhook_event = "project"
    permission_classes = [ProjectBasePermission]
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
    def get(self, request, slug):
        """List projects

        Retrieve all projects in a workspace or get details of a specific project.
        Returns projects ordered by user's custom sort order with member information.
        """
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
            .order_by(
                sanitize_order_by(
                    request.GET.get("order_by", "sort_order"),
                    PROJECT_ORDER_BY_ALLOWLIST,
                    default="sort_order",
                )
            )
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
    def post(self, request, slug):
        """Create project

        Create a new project in the workspace with default states and member assignments.
        Automatically adds the creator as admin and sets up default workflow states.
        """
        try:
            workspace = Workspace.objects.get(slug=slug)

            serializer = ProjectCreateSerializer(data={**request.data}, context={"workspace_id": workspace.id})

            if serializer.is_valid():
                with transaction.atomic():
                    serializer.save()

                    # Add the creator as Administrator of the project.
                    _ = ProjectMember.objects.create(project_id=serializer.instance.id, member=request.user, role=20)

                    # If a different project_lead was provided, add them as
                    # Administrator too. Use project_lead_id (the FK column)
                    # rather than project_lead (the related descriptor, which
                    # would resolve to a User instance and break UUID coercion
                    # downstream in ProjectMember.objects.create).
                    if (
                        serializer.instance.project_lead_id is not None
                        and serializer.instance.project_lead_id != request.user.id
                    ):
                        ProjectMember.objects.create(
                            project_id=serializer.instance.id,
                            member_id=serializer.instance.project_lead_id,
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

                    # Defer the activity-log task until the surrounding
                    # transaction commits, so it never fires on a rolled-back
                    # creation.
                    # robust=True so broker / dispatch failures are logged
                    # internally by Django and don't surface as 500 after a
                    # successful commit (the inverse of the rollback path
                    # covered by test_model_activity_not_called_on_rollback).
                    # A nested function (rather than functools.partial) is
                    # used here because Django's robust on_commit logging
                    # path reads ``func.__qualname__`` to format the error
                    # message; ``partial`` objects don't have that dunder
                    # by default and the workaround is brittle when the
                    # wrapped callable is a mock. The closure captures
                    # the locals at construction time and they are never
                    # rebound, so late-binding is not a hazard here.
                    def _dispatch_model_activity():
                        model_activity.delay(
                            model_name="project",
                            model_id=str(project.id),
                            requested_data=request.data,
                            current_instance=None,
                            actor_id=request.user.id,
                            slug=slug,
                            origin=base_host(request=request, is_app=True),
                        )

                    transaction.on_commit(_dispatch_model_activity, robust=True)

                serializer = ProjectSerializer(project)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_409_CONFLICT,
                )
            # Any other IntegrityError is unexpected: log it the same way
            # the catch-all `except Exception` below would and return the
            # same generic 500 so the client gets a uniform error shape.
            # `raise` here would not fall through to a sibling except
            # clause — it would exit the try/except entirely and bypass
            # both the logging and the JSON response.
            log_exception(e)
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace does not exist"}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_409_CONFLICT,
            )
        except Exception as e:
            # Unexpected server-side failure: log the traceback and return a
            # generic 500 so the client can distinguish it from a 4xx caused
            # by bad input. Returning 400 here was the anti-pattern that
            # masked the original ghost-create bug.
            log_exception(e)
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProjectListLiteAPIEndpoint(BaseAPIView):
    """Project Lite List Endpoint"""

    serializer_class = ProjectLiteSerializer
    model = Project
    permission_classes = [ProjectBasePermission]
    use_read_replica = True

    def get_queryset(self):
        # Projects the user can access: those they are an active member of, plus
        # public (network=2) ones.
        return (
            Project.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                Q(
                    project_projectmember__member=self.request.user,
                    project_projectmember__is_active=True,
                )
                | Q(network=2)
            )
            .distinct()
        )

    @project_docs(
        operation_id="list_projects_lite",
        summary="List projects (lite)",
        description="Retrieve a paginated, lightweight list of projects for pickers and references.",
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            OpenApiParameter(
                name="include_archived",
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                required=False,
                description=(
                    "Include archived projects in the response. Defaults to false. "
                    "Each project carries an archived_at timestamp (null when not archived)."
                ),
            ),
        ],
        responses={
            200: create_paginated_response(
                ProjectLiteSerializer,
                "PaginatedProjectLiteResponse",
                "Paginated list of projects with minimal fields",
                "Paginated Projects (Lite)",
            ),
            404: WORKSPACE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug):
        """List projects (lite)

        Retrieve a paginated, lightweight list of projects the user can access in
        the workspace (projects they are an active member of, plus public projects),
        optimized for pickers and references.
        """
        if not Workspace.objects.filter(slug=slug).exists():
            return Response(
                {"error": "Provided workspace does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

        projects = self.get_queryset()

        # Archived projects are excluded by default; pass ?include_archived=true
        # (or 1) to include them. Each project's archived_at timestamp marks the
        # archived ones.
        include_archived = request.GET.get("include_archived", "false").lower() in ("true", "1")
        if not include_archived:
            projects = projects.filter(archived_at__isnull=True)

        projects = projects.order_by(
            sanitize_order_by(
                request.GET.get("order_by", "-created_at"),
                PROJECT_ORDER_BY_ALLOWLIST,
                default="-created_at",
            )
        )
        return self.paginate(
            request=request,
            queryset=projects,
            on_results=lambda projects: ProjectLiteSerializer(projects, many=True).data,
        )


def _apply_project_update(request, slug, workspace, project, update_data):
    """Shared project update path: archive check, serializer save, default intake, model_activity."""
    if project.archived_at:
        return Response(
            {"error": "Archived project cannot be updated"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    current_instance = json.dumps(ProjectSerializer(project).data, cls=DjangoJSONEncoder)
    intake_view = update_data.get("intake_view", project.intake_view)
    # Model-field payload: callers such as the features endpoint receive SDK names in request.data.
    requested_data = {**update_data, "intake_view": intake_view}

    serializer = ProjectUpdateSerializer(
        project,
        data=requested_data,
        context={"workspace_id": workspace.id},
        partial=True,
    )

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    if serializer.data["intake_view"]:
        intake = Intake.objects.filter(project=project, is_default=True).first()
        if not intake:
            Intake.objects.create(
                name=f"{project.name} Intake",
                project=project,
                is_default=True,
            )

    model_activity.delay(
        model_name="project",
        model_id=str(project.id),
        requested_data=requested_data,
        current_instance=current_instance,
        actor_id=request.user.id,
        slug=slug,
        origin=base_host(request=request, is_app=True),
    )
    return None


class ProjectDetailAPIEndpoint(BaseAPIView):
    """Project Endpoints to  update, retrieve and delete endpoint"""

    serializer_class = ProjectSerializer
    model = Project
    webhook_event = "project"

    permission_classes = [ProjectBasePermission]
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
    def patch(self, request, slug, pk):
        """Update project

        Partially update an existing project's properties like name, description, or settings.
        Tracks changes in model activity logs for audit purposes.
        """
        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=pk, workspace__slug=slug)
            error_response = _apply_project_update(request, slug, workspace, project, request.data)
            if error_response is not None:
                return error_response

            project = self.get_queryset().filter(pk=project.id).first()
            serializer = ProjectSerializer(project)
            return Response(serializer.data, status=status.HTTP_200_OK)
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


class ProjectArchiveUnarchiveAPIEndpoint(BaseAPIView):
    """Project Archive and Unarchive Endpoint"""

    # Archive/unarchive act on the URL project; ProjectBasePermission's POST
    # branch is for project creation.
    permission_classes = [ProjectArchiveUnarchivePermission]

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
    def delete(self, request, slug, project_id):
        """Unarchive project

        Restore an archived project to active status, making it available in regular workflows.
        The project will reappear in active project lists and become fully functional.
        """
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        project.archived_at = None
        project.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


ALLOWED_PROJECT_SUMMARY_FIELDS = [
    "members",
    "states",
    "labels",
    "cycles",
    "modules",
    "issues",
    "intakes",
    "pages",
]


class ProjectSummaryAPIEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]
    use_read_replica = True

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


UNSUPPORTED_PROJECT_FEATURES = (
    "epics",
    "workflows",
    "parallel_cycles",
    "project_updates",
)


class ProjectFeatureAPIEndpoint(BaseAPIView):
    """Project Features Get and Update Endpoint"""

    serializer_class = ProjectFeatureSerializer
    model = Project
    webhook_event = "project"
    permission_classes = [ProjectLitePermission]
    use_read_replica = True

    def get_permissions(self):
        if self.request.method == "GET":
            return [ProjectLitePermission()]
        return [ProjectAdminPermission()]

    @project_docs(
        operation_id="retrieve_project_features",
        summary="Retrieve project features",
        description="Retrieve feature flags for a project.",
        parameters=[PROJECT_ID_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="Project features",
                response=ProjectFeatureSerializer,
            ),
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id):
        """Retrieve project features

        Retrieve the enabled/disabled state of features on a project.
        """
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        return Response(ProjectFeatureSerializer(project).data, status=status.HTTP_200_OK)

    @project_docs(
        operation_id="update_project_features",
        summary="Update project features",
        description="Partially update feature flags for a project.",
        parameters=[PROJECT_ID_PARAMETER],
        request=OpenApiRequest(request=ProjectFeatureSerializer),
        responses={
            200: OpenApiResponse(
                description="Project features updated",
                response=ProjectFeatureSerializer,
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    def patch(self, request, slug, project_id):
        """Update project features

        Partially update feature flags for a project, creating the default intake
        if intakes is enabled and recording project activity.
        """
        workspace = Workspace.objects.get(slug=slug)
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        if project.archived_at:
            return Response(
                {"error": "Archived project cannot be updated"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        feature_serializer = ProjectFeatureSerializer(data=request.data, partial=True)
        if not feature_serializer.is_valid():
            return Response(feature_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        for feature in UNSUPPORTED_PROJECT_FEATURES:
            if feature_serializer.validated_data.get(feature) is True:
                return Response(
                    {"error": f"{feature} is not available on this edition"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        update_data = {
            k: v for k, v in feature_serializer.validated_data.items() if k not in UNSUPPORTED_PROJECT_FEATURES
        }

        error_response = _apply_project_update(request, slug, workspace, project, update_data)
        if error_response is not None:
            return error_response

        project.refresh_from_db()
        return Response(ProjectFeatureSerializer(project).data, status=status.HTTP_200_OK)


class WorkspaceFeatureAPIEndpoint(BaseAPIView):
    """Workspace Features Retrieve Endpoint"""

    serializer_class = WorkspaceFeatureSerializer
    model = Workspace
    permission_classes = [WorkspaceUserPermission]
    use_read_replica = True

    @workspace_docs(
        operation_id="retrieve_workspace_features",
        summary="Retrieve workspace features",
        description="Retrieve workspace-level feature flags.",
        responses={
            200: OpenApiResponse(
                description="Workspace features",
                response=WorkspaceFeatureSerializer,
            ),
            404: WORKSPACE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug):
        """Retrieve workspace features

        Retrieve workspace-level feature flags on Community Edition.
        """
        workspace = Workspace.objects.get(slug=slug)
        return Response(WorkspaceFeatureSerializer(workspace).data, status=status.HTTP_200_OK)


WORK_ITEM_TYPE_ID_PARAMETER = OpenApiParameter(
    name="pk",
    description="Work Item Type ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
)


class WorkItemTypeListCreateAPIEndpoint(BaseAPIView):
    """Work Item Type List and Create Endpoint"""

    serializer_class = IssueTypeSerializer
    model = IssueType
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [ProjectEntityPermission()]
        return [ProjectAdminPermission()]

    def get_queryset(self):
        return (
            IssueType.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                Exists(
                    ProjectIssueType.objects.filter(
                        issue_type_id=OuterRef("pk"),
                        project_id=self.kwargs.get("project_id"),
                        workspace__slug=self.kwargs.get("slug"),
                    )
                )
            )
            .annotate(
                project_ids=Coalesce(
                    ArrayAgg(
                        "project_issue_types__project_id",
                        distinct=True,
                        filter=Q(project_issue_types__deleted_at__isnull=True)
                        & ~Q(project_issue_types__project_id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
            .order_by("created_at")
        )

    @work_item_type_docs(
        operation_id="list_work_item_types",
        summary="List work item types",
        description="Retrieve all work item types linked to a project as an unpaginated array.",
        parameters=[FIELDS_PARAMETER, EXPAND_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="List of work item types",
                response=IssueTypeSerializer(many=True),
            ),
        },
    )
    def get(self, request, slug, project_id):
        """List work item types

        Retrieve all work item types linked to the specified project.
        """
        Project.objects.get(pk=project_id, workspace__slug=slug)
        serializer = IssueTypeSerializer(
            self.get_queryset(),
            many=True,
            fields=self.fields,
            expand=self.expand,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @work_item_type_docs(
        operation_id="create_work_item_type",
        summary="Create work item type",
        description="Create a new work item type in the project when work item types are enabled.",
        request=OpenApiRequest(request=IssueTypeSerializer),
        responses={
            201: OpenApiResponse(
                description="Work item type created",
                response=IssueTypeSerializer,
            ),
            400: INVALID_REQUEST_RESPONSE,
        },
    )
    def post(self, request, slug, project_id):
        """Create work item type

        Create a new work item type and link it to the project.
        """
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        if not project.is_issue_type_enabled:
            return Response(
                {"error": "Work item types are not enabled for this project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssueTypeSerializer(
            data=request.data,
            context={"project": project, "project_id": project_id},
        )
        if serializer.is_valid():
            with transaction.atomic():
                issue_type = serializer.save()
            return Response(IssueTypeSerializer(issue_type).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkItemTypeDetailAPIEndpoint(WorkItemTypeListCreateAPIEndpoint):
    """Work Item Type Retrieve, Update and Delete Endpoint"""

    @work_item_type_docs(
        operation_id="retrieve_work_item_type",
        summary="Retrieve work item type",
        description="Retrieve details of a specific work item type in the project.",
        parameters=[WORK_ITEM_TYPE_ID_PARAMETER, FIELDS_PARAMETER, EXPAND_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="Work item type details",
                response=IssueTypeSerializer,
            ),
        },
    )
    def get(self, request, slug, project_id, pk):
        """Retrieve work item type

        Retrieve details of a specific work item type linked to the project.
        """
        issue_type = self.get_queryset().get(pk=pk)
        serializer = IssueTypeSerializer(
            issue_type,
            fields=self.fields,
            expand=self.expand,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @work_item_type_docs(
        operation_id="update_work_item_type",
        summary="Update work item type",
        description="Partially update a work item type in the project.",
        parameters=[WORK_ITEM_TYPE_ID_PARAMETER],
        request=OpenApiRequest(request=IssueTypeSerializer),
        responses={
            200: OpenApiResponse(
                description="Work item type updated",
                response=IssueTypeSerializer,
            ),
            400: INVALID_REQUEST_RESPONSE,
        },
    )
    def patch(self, request, slug, project_id, pk):
        """Update work item type

        Partially update a work item type linked to the project.
        """
        issue_type = self.get_queryset().get(pk=pk)
        serializer = IssueTypeSerializer(
            issue_type,
            data=request.data,
            partial=True,
            context={"project_id": project_id},
        )
        if serializer.is_valid():
            issue_type = serializer.save()
            return Response(IssueTypeSerializer(issue_type).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @work_item_type_docs(
        operation_id="delete_work_item_type",
        summary="Delete work item type",
        description="Soft-delete the work item type from the project and clear it from work items.",
        parameters=[WORK_ITEM_TYPE_ID_PARAMETER],
        responses={
            204: DELETED_RESPONSE,
            400: INVALID_REQUEST_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, pk):
        """Delete work item type

        Remove a non-default work item type from the project, soft-deleting the
        type itself if no other project links remain.
        """
        project_issue_type = ProjectIssueType.objects.select_related("issue_type").get(
            workspace__slug=slug,
            project_id=project_id,
            issue_type_id=pk,
        )
        issue_type = project_issue_type.issue_type
        if project_issue_type.is_default or issue_type.is_default:
            return Response(
                {"error": "Default work item type cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            Issue.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                type_id=pk,
            ).update(type=None)
            project_issue_type.delete()
            if not ProjectIssueType.objects.filter(issue_type_id=pk).exists():
                issue_type.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
