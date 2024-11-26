# Python imports
import jwt
from datetime import datetime

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.conf import settings
from django.utils import timezone

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

# Module imports
from .base import BaseViewSet, BaseAPIView
from plane.app.serializers import ProjectMemberInviteSerializer

from plane.app.permissions import allow_permission, ROLE

from plane.db.models import (
    ProjectMember,
    Workspace,
    ProjectMemberInvite,
    User,
    WorkspaceMember,
    IssueUserProperty,
)


class ProjectInvitationsViewset(BaseViewSet):
    serializer_class = ProjectMemberInviteSerializer
    model = ProjectMemberInvite

    search_fields = []

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .select_related("project")
            .select_related("workspace", "workspace__owner")
        )

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        emails = request.data.get("emails", [])

        # Check if email is provided
        if not emails:
            return Response(
                {"error": "Emails are required"}, status=status.HTTP_400_BAD_REQUEST
            )

        for email in emails:
            workspace_role = WorkspaceMember.objects.filter(
                workspace__slug=slug, member__email=email.get("email"), is_active=True
            ).role

            if workspace_role in [5, 20] and workspace_role != email.get("role", 5):
                return Response(
                    {
                        "error": "You cannot invite a user with different role than workspace role"
                    }
                )

        workspace = Workspace.objects.get(slug=slug)

        project_invitations = []
        for email in emails:
            try:
                validate_email(email.get("email"))
                project_invitations.append(
                    ProjectMemberInvite(
                        email=email.get("email").strip().lower(),
                        project_id=project_id,
                        workspace_id=workspace.id,
                        token=jwt.encode(
                            {"email": email, "timestamp": datetime.now().timestamp()},
                            settings.SECRET_KEY,
                            algorithm="HS256",
                        ),
                        role=email.get("role", 5),
                        created_by=request.user,
                    )
                )
            except ValidationError:
                return Response(
                    {
                        "error": f"Invalid email - {email} provided a valid email address is required to send the invite"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Create workspace member invite
        project_invitations = ProjectMemberInvite.objects.bulk_create(
            project_invitations, batch_size=10, ignore_conflicts=True
        )
        current_site = request.META.get("HTTP_ORIGIN")

        # Send invitations
        for invitation in project_invitations:
            project_invitations.delay(
                invitation.email,
                project_id,
                invitation.token,
                current_site,
                request.user.email,
            )

        return Response(
            {"message": "Email sent successfully"}, status=status.HTTP_200_OK
        )


class UserProjectInvitationsViewset(BaseViewSet):
    serializer_class = ProjectMemberInviteSerializer
    model = ProjectMemberInvite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(email=self.request.user.email)
            .select_related("workspace", "workspace__owner", "project")
        )

    def create(self, request, slug):
        project_ids = request.data.get("project_ids", [])

        # Get the workspace user role
        workspace_member = WorkspaceMember.objects.get(
            member=request.user, workspace__slug=slug, is_active=True
        )

        if workspace_member.role not in [ROLE.ADMIN.value, ROLE.MEMBER.value]:
            return Response(
                {"error": "You do not have permission to join the project"},
                status=status.HTTP_403_FORBIDDEN,
            )

        workspace_role = workspace_member.role
        workspace = workspace_member.workspace

        # If the user was already part of workspace
        _ = ProjectMember.objects.filter(
            workspace__slug=slug, project_id__in=project_ids, member=request.user
        ).update(is_active=True)

        ProjectMember.objects.bulk_create(
            [
                ProjectMember(
                    project_id=project_id,
                    member=request.user,
                    role=workspace_role,
                    workspace=workspace,
                    created_by=request.user,
                )
                for project_id in project_ids
            ],
            ignore_conflicts=True,
        )

        IssueUserProperty.objects.bulk_create(
            [
                IssueUserProperty(
                    project_id=project_id,
                    user=request.user,
                    workspace=workspace,
                    created_by=request.user,
                )
                for project_id in project_ids
            ],
            ignore_conflicts=True,
        )

        return Response(
            {"message": "Projects joined successfully"}, status=status.HTTP_201_CREATED
        )


class ProjectJoinEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def post(self, request, slug, project_id, pk):
        project_invite = ProjectMemberInvite.objects.get(
            pk=pk, project_id=project_id, workspace__slug=slug
        )

        email = request.data.get("email", "")

        if email == "" or project_invite.email != email:
            return Response(
                {"error": "You do not have permission to join the project"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if project_invite.responded_at is None:
            project_invite.accepted = request.data.get("accepted", False)
            project_invite.responded_at = timezone.now()
            project_invite.save()

            if project_invite.accepted:
                # Check if the user account exists
                user = User.objects.filter(email=email).first()

                # Check if user is a part of workspace
                workspace_member = WorkspaceMember.objects.filter(
                    workspace__slug=slug, member=user
                ).first()
                # Add him to workspace
                if workspace_member is None:
                    _ = WorkspaceMember.objects.create(
                        workspace_id=project_invite.workspace_id,
                        member=user,
                        role=(15 if project_invite.role >= 15 else project_invite.role),
                    )
                else:
                    # Else make him active
                    workspace_member.is_active = True
                    workspace_member.save()

                # Check if the user was already a member of project then activate the user
                project_member = ProjectMember.objects.filter(
                    workspace_id=project_invite.workspace_id, member=user
                ).first()
                if project_member is None:
                    # Create a Project Member
                    _ = ProjectMember.objects.create(
                        workspace_id=project_invite.workspace_id,
                        member=user,
                        role=project_invite.role,
                    )
                else:
                    project_member.is_active = True
                    project_member.role = project_member.role
                    project_member.save()

                return Response(
                    {"message": "Project Invitation Accepted"},
                    status=status.HTTP_200_OK,
                )

            return Response(
                {"message": "Project Invitation was not accepted"},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "You have already responded to the invitation request"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def get(self, request, slug, project_id, pk):
        project_invitation = ProjectMemberInvite.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )
        serializer = ProjectMemberInviteSerializer(project_invitation)
        return Response(serializer.data, status=status.HTTP_200_OK)
