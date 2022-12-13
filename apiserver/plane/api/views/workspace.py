# Python imports
import jwt
from datetime import datetime

# Django imports
from django.db import IntegrityError
from django.db.models import Prefetch
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.contrib.sites.shortcuts import get_current_site
from django.db.models import CharField
from django.db.models.functions import Cast

# Third party modules
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from sentry_sdk import capture_exception

# Module imports
from plane.api.serializers import (
    WorkSpaceSerializer,
    WorkSpaceMemberSerializer,
    TeamSerializer,
    WorkSpaceMemberInviteSerializer,
    UserLiteSerializer,
    ProjectMemberSerializer,
)
from plane.api.views.base import BaseAPIView
from . import BaseViewSet
from plane.db.models import (
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceMemberInvite,
    Team,
    ProjectMember,
)
from plane.api.permissions import WorkSpaceBasePermission, WorkSpaceAdminPermission
from plane.bgtasks.workspace_invitation_task import workspace_invitation


class WorkSpaceViewSet(BaseViewSet):

    model = Workspace
    serializer_class = WorkSpaceSerializer
    permission_classes = [
        WorkSpaceBasePermission,
    ]

    search_fields = [
        "name",
    ]
    filterset_fields = [
        "owner",
    ]

    lookup_field = "slug"

    def get_queryset(self):
        return self.filter_queryset(super().get_queryset().select_related("owner"))

    def create(self, request):
        try:
            serializer = WorkSpaceSerializer(data=request.data)

            if serializer.is_valid():
                serializer.save(owner=request.user)
                # Create Workspace member
                _ = WorkspaceMember.objects.create(
                    workspace_id=serializer.data["id"],
                    member=request.user,
                    role=20,
                    company_role=request.data.get("company_role", ""),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(
                [serializer.errors[error][0] for error in serializer.errors],
                status=status.HTTP_400_BAD_REQUEST,
            )

        ## Handling unique integrity error for now
        ## TODO: Extend this to handle other common errors which are not automatically handled by APIException
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The workspace with the name already exists"},
                    status=status.HTTP_410_GONE,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {
                    "error": "Something went wrong please try again later",
                    "identifier": None,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserWorkSpacesEndpoint(BaseAPIView):

    search_fields = [
        "name",
    ]
    filterset_fields = [
        "owner",
    ]

    def get(self, request):
        try:
            workspace = (
                Workspace.objects.prefetch_related(
                    Prefetch("workspace_member", queryset=WorkspaceMember.objects.all())
                )
                .filter(
                    workspace_member__member=request.user,
                )
                .select_related("owner")
            )
            serializer = WorkSpaceSerializer(self.filter_queryset(workspace), many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            print(e)
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class WorkSpaceAvailabilityCheckEndpoint(BaseAPIView):

    permission_classes = [
        AllowAny,
    ]

    def get(self, request):
        try:
            name = request.GET.get("name", False)

            if not name:
                return Response(
                    {"error": "Workspace Name is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            workspace = Workspace.objects.filter(name=name).exists()

            return Response({"status": workspace}, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class InviteWorkspaceEndpoint(BaseAPIView):

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def post(self, request, slug):
        try:

            email = request.data.get("email", False)

            # Check if email is provided
            if not email:
                return Response(
                    {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            validate_email(email)
            # Check if user is already a member of workspace
            workspace = Workspace.objects.get(slug=slug)

            if WorkspaceMember.objects.filter(
                workspace_id=workspace.id, member__email=email
            ).exists():
                return Response(
                    {"error": "User is already member of workspace"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = jwt.encode(
                {"email": email, "timestamp": datetime.now().timestamp()},
                settings.SECRET_KEY,
                algorithm="HS256",
            )

            workspace_invitation_obj = WorkspaceMemberInvite.objects.create(
                email=email.strip().lower(),
                workspace_id=workspace.id,
                token=token,
                role=request.data.get("role", 10),
            )

            domain = settings.WEB_URL

            workspace_invitation.delay(
                email, workspace.id, token, domain, request.user.email
            )

            return Response(
                {
                    "message": "Email sent successfully",
                    "id": workspace_invitation_obj.id,
                },
                status=status.HTTP_200_OK,
            )
        except ValidationError:
            return Response(
                {
                    "error": "Invalid email address provided a valid email address is required to send the invite"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            print(e)
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class JoinWorkspaceEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request, slug, pk):
        try:

            workspace_invite = WorkspaceMemberInvite.objects.get(
                pk=pk, workspace__slug=slug
            )

            email = request.data.get("email", "")

            if email == "" or workspace_invite.email != email:
                return Response(
                    {"error": "You do not have permission to join the workspace"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if workspace_invite.responded_at is None:
                workspace_invite.accepted = request.data.get("accepted", False)
                workspace_invite.responded_at = timezone.now()
                workspace_invite.save()

                if workspace_invite.accepted:
                    return Response(
                        {"message": "Workspace Invitation Accepted"},
                        status=status.HTTP_200_OK,
                    )

                return Response(
                    {"message": "Workspace Invitation was not accepted"},
                    status=status.HTTP_200_OK,
                )

            return Response(
                {"error": "You have already responded to the invitation request"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except WorkspaceMemberInvite.DoesNotExist:
            return Response(
                {"error": "The invitation either got expired or could not be found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            print(e)
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class WorkspaceInvitationsViewset(BaseViewSet):

    serializer_class = WorkSpaceMemberInviteSerializer
    model = WorkspaceMemberInvite

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace")
        )


class UserWorkspaceInvitationsEndpoint(BaseViewSet):

    serializer_class = WorkSpaceMemberInviteSerializer
    model = WorkspaceMemberInvite

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
            workspace_invitations = WorkspaceMemberInvite.objects.filter(
                pk__in=invitations
            )

            WorkspaceMember.objects.bulk_create(
                [
                    WorkspaceMember(
                        workspace=invitation.workspace,
                        member=request.user,
                        role=invitation.role,
                    )
                    for invitation in workspace_invitations
                ],
                ignore_conflicts=True,
            )

            # Delete joined workspace invites
            workspace_invitations.delete()

            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class WorkSpaceMemberViewSet(BaseViewSet):

    serializer_class = WorkSpaceMemberSerializer
    model = WorkspaceMember

    permission_classes = [
        WorkSpaceAdminPermission,
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
            .select_related("workspace", "workspace__owner")
            .select_related("member")
        )


class TeamMemberViewSet(BaseViewSet):

    serializer_class = TeamSerializer
    model = Team

    search_fields = [
        "member__email",
        "member__first_name",
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "workspace__owner")
            .prefetch_related("members")
        )

    def create(self, request, slug):

        try:

            members = list(
                WorkspaceMember.objects.filter(
                    workspace__slug=slug, member__id__in=request.data.get("members", [])
                )
                .annotate(member_str_id=Cast("member", output_field=CharField()))
                .distinct()
                .values_list("member_str_id", flat=True)
            )

            if len(members) != len(request.data.get("members", [])):

                users = list(set(request.data.get("members", [])).difference(members))
                users = User.objects.filter(pk__in=users)

                serializer = UserLiteSerializer(users, many=True)
                return Response(
                    {
                        "error": f"{len(users)} of the member(s) are not a part of the workspace",
                        "members": serializer.data,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            workspace = Workspace.objects.get(slug=slug)

            serializer = TeamSerializer(
                data=request.data, context={"workspace": workspace}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "The team with the name already exists"},
                    status=status.HTTP_410_GONE,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserWorkspaceInvitationEndpoint(BaseViewSet):

    model = WorkspaceMemberInvite
    serializer_class = WorkSpaceMemberInviteSerializer

    permission_classes = [
        AllowAny,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(pk=self.kwargs.get("pk"))
            .select_related("workspace")
        )


class UserLastProjectWithWorkspaceEndpoint(BaseAPIView):
    def get(self, request):
        try:

            user = User.objects.get(pk=request.user.id)

            last_workspace_id = user.last_workspace_id

            if last_workspace_id is None:
                return Response(
                    {
                        "project_details": [],
                        "workspace_details": {},
                    },
                    status=status.HTTP_200_OK,
                )

            workspace = Workspace.objects.get(pk=last_workspace_id)
            workspace_serializer = WorkSpaceSerializer(workspace)

            project_member = ProjectMember.objects.filter(
                workspace_id=last_workspace_id, member=request.user
            ).select_related("workspace", "project", "member")

            project_member_serializer = ProjectMemberSerializer(
                project_member, many=True
            )

            return Response(
                {
                    "workspace_details": workspace_serializer.data,
                    "project_details": project_member_serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )