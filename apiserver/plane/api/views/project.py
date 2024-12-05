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

from plane.api.serializers import ProjectSerializer
from plane.app.permissions import ProjectBasePermission

# Module imports
from plane.db.models import (
    Cycle,
    Intake,
    IssueUserProperty,
    Module,
    Project,
    DeployBoard,
    ProjectMember,
    State,
    Workspace,
    UserFavorite,
)
from plane.bgtasks.webhook_task import model_activity
from .base import BaseAPIView


class ProjectAPIEndpoint(BaseAPIView):
    """Project Endpoints to create, update, list, retrieve and delete endpoint"""

    serializer_class = ProjectSerializer
    model = Project
    webhook_event = "project"

    permission_classes = [ProjectBasePermission]

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
            .select_related(
                "workspace", "workspace__owner", "default_assignee", "project_lead"
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

    def get(self, request, slug, pk=None):
        if pk is None:
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
                            workspace__slug=slug, is_active=True
                        ).select_related("member"),
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
        project = self.get_queryset().get(workspace__slug=slug, pk=pk)
        serializer = ProjectSerializer(project, fields=self.fields, expand=self.expand)
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
                _ = ProjectMember.objects.create(
                    project_id=serializer.data["id"], member=request.user, role=20
                )
                # Also create the issue property for the user
                _ = IssueUserProperty.objects.create(
                    project_id=serializer.data["id"], user=request.user
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
                    IssueUserProperty.objects.create(
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

                project = self.get_queryset().filter(pk=serializer.data["id"]).first()

                # Model activity
                model_activity.delay(
                    model_name="project",
                    model_id=str(project.id),
                    requested_data=request.data,
                    current_instance=None,
                    actor_id=request.user.id,
                    slug=slug,
                    origin=request.META.get("HTTP_ORIGIN"),
                )

                serializer = ProjectSerializer(project)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_410_GONE,
                )
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_410_GONE,
            )

    def patch(self, request, slug, pk):
        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=pk)
            current_instance = json.dumps(
                ProjectSerializer(project).data, cls=DjangoJSONEncoder
            )

            intake_view = request.data.get("inbox_view", project.intake_view)

            if project.archived_at:
                return Response(
                    {"error": "Archived project cannot be updated"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = ProjectSerializer(
                project,
                data={**request.data, "intake_view": intake_view},
                context={"workspace_id": workspace.id},
                partial=True,
            )

            if serializer.is_valid():
                serializer.save()
                if serializer.data["intake_view"]:
                    intake = Intake.objects.filter(
                        project=project, is_default=True
                    ).first()
                    if not intake:
                        Intake.objects.create(
                            name=f"{project.name} Intake",
                            project=project,
                            is_default=True,
                        )

                    # Create the triage state in Backlog group
                    State.objects.get_or_create(
                        name="Triage",
                        group="triage",
                        description="Default state for managing all Intake Issues",
                        project_id=pk,
                        color="#ff7700",
                        is_triage=True,
                    )

                project = self.get_queryset().filter(pk=serializer.data["id"]).first()

                model_activity.delay(
                    model_name="project",
                    model_id=str(project.id),
                    requested_data=request.data,
                    current_instance=current_instance,
                    actor_id=request.user.id,
                    slug=slug,
                    origin=request.META.get("HTTP_ORIGIN"),
                )

                serializer = ProjectSerializer(project)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_410_GONE,
                )
        except (Project.DoesNotExist, Workspace.DoesNotExist):
            return Response(
                {"error": "Project does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_410_GONE,
            )

    def delete(self, request, slug, pk):
        project = Project.objects.get(pk=pk, workspace__slug=slug)
        # Delete the user favorite cycle
        UserFavorite.objects.filter(
            entity_type="project", entity_identifier=pk, project_id=pk
        ).delete()
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectArchiveUnarchiveAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectBasePermission]

    def post(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        project.archived_at = timezone.now()
        project.save()
        UserFavorite.objects.filter(workspace__slug=slug, project=project_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        project.archived_at = None
        project.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
