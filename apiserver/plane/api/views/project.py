# Python imports
import jwt
from datetime import datetime

# Django imports
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db.models import Q
from django.core.validators import validate_email
from django.conf import settings

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers
from sentry_sdk import capture_exception

# Module imports
from .base import BaseViewSet, BaseAPIView
from plane.api.serializers import (
    ProjectSerializer,
    ProjectMemberSerializer,
    ProjectDetailSerializer,
    ProjectMemberInviteSerializer,
    ProjectIdentifierSerializer,
)

from plane.api.permissions import ProjectBasePermission

from plane.db.models import (
    Project,
    ProjectMember,
    Workspace,
    ProjectMemberInvite,
    User,
    WorkspaceMember,
    State,
    TeamMember,
)

from plane.db.models import (
    Project,
    ProjectMember,
    Workspace,
    ProjectMemberInvite,
    User,
    ProjectIdentifier,
)
from plane.bgtasks.project_invitation_task import project_invitation


class ProjectViewSet(BaseViewSet):
    serializer_class = ProjectSerializer
    model = Project

    permission_classes = [
        ProjectBasePermission,
    ]

    def get_serializer_class(self, *args, **kwargs):
        if self.action == "update" or self.action == "partial_update":
            return ProjectSerializer
        return ProjectDetailSerializer

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(Q(project_projectmember__member=self.request.user) | Q(network=2))
            .select_related("workspace", "workspace__owner")
            .distinct()
        )

    def create(self, request, slug):
        try:

            workspace = Workspace.objects.get(slug=slug)

            serializer = ProjectSerializer(
                data={**request.data}, context={"workspace_id": workspace.id}
            )
            if serializer.is_valid():
                serializer.save()

                ## Add the user as Administrator to the project
                ProjectMember.objects.create(
                    project_id=serializer.data["id"], member=request.user, role=20
                )

                ## Default states
                states = [
                    {
                        "name": "Backlog",
                        "color": "#5e6ad2",
                        "sequence": 15000,
                        "group": "backlog",
                    },
                    {
                        "name": "Todo",
                        "color": "#eb5757",
                        "sequence": 25000,
                        "group": "unstarted",
                    },
                    {
                        "name": "In Progress",
                        "color": "#26b5ce",
                        "sequence": 35000,
                        "group": "started",
                    },
                    {
                        "name": "Done",
                        "color": "#f2c94c",
                        "sequence": 45000,
                        "group": "completed",
                    },
                    {
                        "name": "Cancelled",
                        "color": "#4cb782",
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
                        )
                        for state in states
                    ]
                )

                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(
                [serializer.errors[error][0] for error in serializer.errors],
                status=status.HTTP_400_BAD_REQUEST,
            )
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_410_GONE,
                )
        except serializers.ValidationError as e:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_410_GONE,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def partial_update(self, request, slug, pk=None):
        try:
            workspace = Workspace.objects.get(slug=slug)

            project = Project.objects.get(pk=pk)

            serializer = ProjectSerializer(
                project,
                data={**request.data},
                context={"workspace_id": workspace.id},
                partial=True,
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_410_GONE,
                )
        except serializers.ValidationError as e:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_410_GONE,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class InviteProjectEndpoint(BaseAPIView):

    permission_classes = [
        ProjectBasePermission,
    ]

    def post(self, request, slug, project_id):
        try:

            email = request.data.get("email", False)
            role = request.data.get("role", False)

            # Check if email is provided
            if not email:
                return Response(
                    {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            validate_email(email)
            # Check if user is already a member of workspace
            if ProjectMember.objects.filter(
                project_id=project_id, member__email=email
            ).exists():
                return Response(
                    {"error": "User is already member of workspace"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User.objects.filter(email=email).first()

            if user is None:
                token = jwt.encode(
                    {"email": email, "timestamp": datetime.now().timestamp()},
                    settings.SECRET_KEY,
                    algorithm="HS256",
                )
                project_invitation_obj = ProjectMemberInvite.objects.create(
                    email=email.strip().lower(),
                    project_id=project_id,
                    token=token,
                    role=role,
                )
                domain = settings.WEB_URL
                project_invitation.delay(email, project_id, token, domain)

                return Response(
                    {
                        "message": "Email sent successfully",
                        "id": project_invitation_obj.id,
                    },
                    status=status.HTTP_200_OK,
                )

            project_member = ProjectMember.objects.create(
                member=user, project_id=project_id, role=role
            )

            return Response(
                ProjectMemberSerializer(project_member).data, status=status.HTTP_200_OK
            )

        except ValidationError:
            return Response(
                {
                    "error": "Invalid email address provided a valid email address is required to send the invite"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except (Workspace.DoesNotExist, Project.DoesNotExist) as e:
            return Response(
                {"error": "Workspace or Project does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserProjectInvitationsViewset(BaseViewSet):

    serializer_class = ProjectMemberInviteSerializer
    model = ProjectMemberInvite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(email=self.request.user.email)
            .select_related("workspace")
        )

    def create(self, request):
        try:

            invitations = request.data.get("invitations")
            project_invitations = ProjectMemberInvite.objects.filter(
                pk__in=invitations, accepted=True
            )
            ProjectMember.objects.bulk_create(
                [
                    ProjectMember(
                        project=invitation.project,
                        workspace=invitation.project.workspace,
                        member=request.user,
                        role=invitation.role,
                    )
                    for invitation in project_invitations
                ]
            )

            ## Delete joined project invites
            project_invitations.delete()

            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProjectMemberViewSet(BaseViewSet):

    serializer_class = ProjectMemberSerializer
    model = ProjectMember
    permission_classes = [
        ProjectBasePermission,
    ]

    search_fields = [
        "member__email",
        "member__first_name",
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .select_related("project")
            .select_related("member")
        )


class AddMemberToProjectEndpoint(BaseAPIView):
    def post(self, request, slug, project_id):
        try:

            member_id = request.data.get("member_id", False)
            role = request.data.get("role", False)

            if not member_id or not role:
                return Response(
                    {"error": "Member ID and role is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if the user is a member in the workspace
            if not WorkspaceMember.objects.filter(
                workspace__slug=slug, member_id=member_id
            ).exists():
                # TODO: Update this error message - nk
                return Response(
                    {
                        "error": "User is not a member of the workspace. Invite the user to the workspace to add him to project"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if the user is already member of project
            if ProjectMember.objects.filter(
                project=project_id, member_id=member_id
            ).exists():
                return Response(
                    {"error": "User is already a member of the project"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Add the user to project
            project_member = ProjectMember.objects.create(
                project_id=project_id, member_id=member_id, role=role
            )

            serializer = ProjectMemberSerializer(project_member)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AddTeamToProjectEndpoint(BaseAPIView):
    def post(self, request, slug, project_id):

        try:
            team_members = TeamMember.objects.filter(
                workspace__slug=slug, team__in=request.data.get("teams", [])
            ).values_list("member", flat=True)

            if len(team_members) == 0:
                return Response(
                    {"error": "No such team exists"}, status=status.HTTP_400_BAD_REQUEST
                )

            workspace = Workspace.objects.get(slug=slug)

            project_members = []
            for member in team_members:
                project_members.append(
                    ProjectMember(
                        project_id=project_id,
                        member_id=member,
                        workspace=workspace,
                    )
                )

            ProjectMember.objects.bulk_create(
                project_members, batch_size=10, ignore_conflicts=True
            )

            serializer = ProjectMemberSerializer(project_members, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "The team with the name already exists"},
                    status=status.HTTP_410_GONE,
                )
        except Workspace.DoesNotExist:
            return Response(
                {"error": "The requested workspace could not be found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProjectMemberInvitationsViewset(BaseViewSet):

    serializer_class = ProjectMemberInviteSerializer
    model = ProjectMemberInvite

    search_fields = []

    permission_classes = [
        ProjectBasePermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .select_related("project")
        )


class ProjectMemberInviteDetailViewSet(BaseViewSet):

    serializer_class = ProjectMemberInviteSerializer
    model = ProjectMemberInvite

    search_fields = []

    permission_classes = [
        ProjectBasePermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(super().get_queryset().select_related("project"))


class ProjectIdentifierEndpoint(BaseAPIView):

    permission_classes = [
        ProjectBasePermission,
    ]

    def get(self, request, slug):
        try:

            name = request.GET.get("name", "").strip().upper()

            if name == "":
                return Response(
                    {"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            exists = ProjectIdentifier.objects.filter(name=name).values(
                "id", "name", "project"
            )

            return Response(
                {"exists": len(exists), "identifiers": exists},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request, slug):
        try:

            name = request.data.get("name", "").strip().upper()

            if name == "":
                return Response(
                    {"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            if Project.objects.filter(identifier=name).exists():
                return Response(
                    {"error": "Cannot delete an identifier of an existing project"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            ProjectIdentifier.objects.filter(name=name).delete()

            return Response(
                status=status.HTTP_204_NO_CONTENT,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProjectJoinEndpoint(BaseAPIView):
    def post(self, request, slug):
        try:
            project_ids = request.data.get("project_ids", [])

            # Get the workspace user role
            workspace_member = WorkspaceMember.objects.get(
                member=request.user, workspace__slug=slug
            )

            workspace_role = workspace_member.role
            workspace = workspace_member.workspace

            ProjectMember.objects.bulk_create(
                [
                    ProjectMember(
                        project_id=project_id,
                        member=request.user,
                        role=20
                        if workspace_role >= 15
                        else (15 if workspace_role == 10 else workspace_role),
                        workspace=workspace,
                    )
                    for project_id in project_ids
                ],
                ignore_conflicts=True,
            )

            return Response(
                {"message": "Projects joined successfully"},
                status=status.HTTP_201_CREATED,
            )
        except WorkspaceMember.DoesNotExist:
            return Response(
                {"error": "User is not a member of workspace"},
                status=status.HTTP_403_FORBIDDEN,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProjectUserViewsEndpoint(BaseAPIView):
    def post(self, request, slug, project_id):
        try:

            project = Project.objects.get(pk=project_id, workspace__slug=slug)

            project_member = ProjectMember.objects.filter(
                member=request.user, project=project
            ).first()

            if project_member is None:
                return Response(
                    {"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN
                )

            project_member.view_props = request.data

            project_member.save()

            return Response(status=status.HTTP_200_OK)

        except Project.DoesNotExist:
            return Response(
                {"error": "The requested resource does not exists"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
