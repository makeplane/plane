# Python imports
import json

# Django imports
from django.db import IntegrityError
from django.db.models import Exists, F, Func, OuterRef, Prefetch, Q, Subquery
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
    ProjectUserProperty,
    Module,
    Project,
    DeployBoard,
    ProjectMember,
    State,
    DEFAULT_STATES,
    Workspace,
    UserFavorite,
)
from plane.bgtasks.webhook_task import model_activity, webhook_activity
from .base import BaseAPIView
from plane.utils.host import base_host
from plane.api.serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
)
from plane.app.permissions import ProjectBasePermission
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
            .order_by(request.GET.get("order_by", "sort_order"))
        )
        return self.paginate(
            request=request,
            queryset=(projects),
            on_results=lambda projects: ProjectSerializer(
                projects, many=True, fields=self.fields, expand=self.expand
            ).data,
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
                serializer.save()

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
            project = Project.objects.get(pk=pk)
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

    permission_classes = [ProjectBasePermission]

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
