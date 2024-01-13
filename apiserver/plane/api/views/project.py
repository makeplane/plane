# Django imports
from django.db import IntegrityError
from django.db.models import Exists, OuterRef, Q, F, Func, Subquery, Prefetch

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.serializers import ValidationError

# Module imports
from plane.db.models import (
    Workspace,
    Project,
    ProjectFavorite,
    ProjectMember,
    ProjectDeployBoard,
    State,
    Cycle,
    Module,
    IssueProperty,
    Inbox,
)
from plane.app.permissions import ProjectBasePermission
from plane.api.serializers import ProjectSerializer
from .base import BaseAPIView, WebhookMixin


class ProjectAPIEndpoint(WebhookMixin, BaseAPIView):
    """Project Endpoints to create, update, list, retrieve and delete endpoint"""

    serializer_class = ProjectSerializer
    model = Project
    webhook_event = "project"

    permission_classes = [
        ProjectBasePermission,
    ]

    def get_queryset(self):
        return (
            Project.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                Q(project_projectmember__member=self.request.user)
                | Q(network=2)
            )
            .select_related(
                "workspace",
                "workspace__owner",
                "default_assignee",
                "project_lead",
            )
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
                    project_id=OuterRef("id"),
                    member__is_bot=False,
                    is_active=True,
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
                    ProjectDeployBoard.objects.filter(
                        project_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                    )
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    def get(self, request, slug, project_id=None):
        if project_id is None:
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
                        queryset=ProjectMember.objects.filter(
                            workspace__slug=slug,
                            is_active=True,
                        ).select_related("member"),
                    )
                )
                .order_by(request.GET.get("order_by", "sort_order"))
            )
            return self.paginate(
                request=request,
                queryset=(projects),
                on_results=lambda projects: ProjectSerializer(
                    projects,
                    many=True,
                    fields=self.fields,
                    expand=self.expand,
                ).data,
            )
        project = self.get_queryset().get(workspace__slug=slug, pk=project_id)
        serializer = ProjectSerializer(
            project,
            fields=self.fields,
            expand=self.expand,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)
            serializer = ProjectSerializer(
                data={**request.data}, context={"workspace_id": workspace.id}
            )
            if serializer.is_valid():
                serializer.save()

                # Add the user as Administrator to the project
                project_member = ProjectMember.objects.create(
                    project_id=serializer.data["id"],
                    member=request.user,
                    role=20,
                )
                # Also create the issue property for the user
                _ = IssueProperty.objects.create(
                    project_id=serializer.data["id"],
                    user=request.user,
                )

                if serializer.data["project_lead"] is not None and str(
                    serializer.data["project_lead"]
                ) != str(request.user.id):
                    ProjectMember.objects.create(
                        project_id=serializer.data["id"],
                        member_id=serializer.data["project_lead"],
                        role=20,
                    )
                    # Also create the issue property for the user
                    IssueProperty.objects.create(
                        project_id=serializer.data["id"],
                        user_id=serializer.data["project_lead"],
                    )

                # Default states
                states = [
                    {
                        "name": "Backlog",
                        "color": "#A3A3A3",
                        "sequence": 15000,
                        "group": "backlog",
                        "default": True,
                    },
                    {
                        "name": "Todo",
                        "color": "#3A3A3A",
                        "sequence": 25000,
                        "group": "unstarted",
                    },
                    {
                        "name": "In Progress",
                        "color": "#F59E0B",
                        "sequence": 35000,
                        "group": "started",
                    },
                    {
                        "name": "Done",
                        "color": "#16A34A",
                        "sequence": 45000,
                        "group": "completed",
                    },
                    {
                        "name": "Cancelled",
                        "color": "#EF4444",
                        "sequence": 55000,
                        "group": "cancelled",
                    },
                ]

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
                        for state in states
                    ]
                )

                project = (
                    self.get_queryset()
                    .filter(pk=serializer.data["id"])
                    .first()
                )
                serializer = ProjectSerializer(project)
                return Response(
                    serializer.data, status=status.HTTP_201_CREATED
                )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_410_GONE,
                )
        except Workspace.DoesNotExist as e:
            return Response(
                {"error": "Workspace does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except ValidationError as e:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_410_GONE,
            )

    def patch(self, request, slug, project_id=None):
        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=project_id)

            serializer = ProjectSerializer(
                project,
                data={**request.data},
                context={"workspace_id": workspace.id},
                partial=True,
            )

            if serializer.is_valid():
                serializer.save()
                if serializer.data["inbox_view"]:
                    Inbox.objects.get_or_create(
                        name=f"{project.name} Inbox",
                        project=project,
                        is_default=True,
                    )

                    # Create the triage state in Backlog group
                    State.objects.get_or_create(
                        name="Triage",
                        group="backlog",
                        description="Default state for managing all Inbox Issues",
                        project_id=project_id,
                        color="#ff7700",
                    )

                project = (
                    self.get_queryset()
                    .filter(pk=serializer.data["id"])
                    .first()
                )
                serializer = ProjectSerializer(project)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_410_GONE,
                )
        except (Project.DoesNotExist, Workspace.DoesNotExist):
            return Response(
                {"error": "Project does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except ValidationError as e:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_410_GONE,
            )

    def delete(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
