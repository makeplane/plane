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
import jwt
import json
from datetime import datetime

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.conf import settings
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder


# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

# Module imports
from .base import BaseViewSet, BaseAPIView
from plane.app.serializers import ProjectMemberInviteSerializer
from plane.ee.bgtasks.project_member_activities_tasks import project_member_activities
from plane.app.permissions import allow_permission, ROLE
from plane.permissions import can, ProjectPermissions
from plane.permissions.system_roles import (
    is_project_role_allowed_for_workspace_role,
    resolve_project_role_for_ws_member,
    get_project_roles_for_workspace,
    enforce_project_role_ceiling,
    member_role_from_role_ref,
)
from plane.db.models import (
    ProjectMember,
    Workspace,
    ProjectMemberInvite,
    User,
    WorkspaceMember,
    Project,
    ProjectUserProperty,
)
from plane.db.models.project import ProjectNetwork
from plane.utils.host import base_host
from plane.payment.bgtasks.member_sync_task import member_sync_task


class ProjectInvitationsViewset(BaseViewSet):
    # TODO: Unused endpoint — not called by FE. URLs commented out. Migrate to @can before re-enabling.
    # The FE uses direct member addition via ProjectMemberViewSet.create instead.
    # When reactivated, migrate all methods to @can:
    #   create   → @can(ProjectMemberPermissions.INVITE, resource_param="project_id")
    #   list     → @can(ProjectMemberPermissions.VIEW, resource_param="project_id")
    #   retrieve → @can(ProjectMemberPermissions.VIEW, resource_param="project_id")
    #   destroy  → @can(ProjectMemberPermissions.INVITE, resource_param="project_id")
    # Note: list/retrieve/destroy currently have NO permission checks (security gap).
    use_read_replica = True

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
            return Response({"error": "Emails are required"}, status=status.HTTP_400_BAD_REQUEST)

        for email in emails:
            ws_member = WorkspaceMember.objects.filter(
                workspace__slug=slug, member__email=email.get("email"), is_active=True
            ).select_related("role_ref").first()

            if ws_member is not None:
                from plane.permissions.system_roles import get_workspace_role_slug, project_role_from_member_role
                ws_slug = get_workspace_role_slug(ws_member)
                proj_slug = project_role_from_member_role(email.get("role", 5))
                if not is_project_role_allowed_for_workspace_role(ws_slug, proj_slug):
                    return Response(
                        {"error": "Workspace guests can only be assigned commenter or guest roles on projects"},
                        status=status.HTTP_400_BAD_REQUEST,
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
                        "error": f"Invalid email - {email} provided a valid email address is required to send the invite"  # noqa: E501
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Create workspace member invite
        project_invitations = ProjectMemberInvite.objects.bulk_create(
            project_invitations, batch_size=10, ignore_conflicts=True
        )
        current_site = base_host(request=request, is_app=True)

        # Send invitations
        for invitation in project_invitations:
            project_invitations.delay(
                invitation.email,
                project_id,
                invitation.token,
                current_site,
                request.user.email,
            )

        return Response({"message": "Email sent successfully"}, status=status.HTTP_200_OK)


class UserProjectInvitationsViewset(BaseViewSet):
    # TODO: Unused endpoint — not called by FE. No URL registration exists. Migrate to @can before re-enabling.
    use_read_replica = True

    serializer_class = ProjectMemberInviteSerializer
    model = ProjectMemberInvite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(email=self.request.user.email)
            .select_related("workspace", "workspace__owner", "project")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        project_ids = request.data.get("project_ids", [])

        # Get the workspace user role
        workspace_member = WorkspaceMember.objects.select_related("role_ref").get(
            member=request.user, workspace__slug=slug, is_active=True
        )

        # Get all the projects
        projects = Project.objects.filter(id__in=project_ids, workspace__slug=slug).only("id", "network")
        # Check if user has permission to join each project
        for project in projects:
            if project.network == ProjectNetwork.SECRET.value and workspace_member.role != ROLE.ADMIN.value:
                return Response(
                    {"error": "Only workspace admins can join private project"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        workspace = workspace_member.workspace

        # Resolve the project role from workspace role (slug-based auto-join mapping)
        role_cache = get_project_roles_for_workspace(workspace_member.workspace_id)
        proj_role = resolve_project_role_for_ws_member(workspace_member, workspace_member.workspace_id, role_cache)

        # If the user was already part of workspace
        _ = ProjectMember.objects.filter(workspace__slug=slug, project_id__in=project_ids, member=request.user).update(
            is_active=True
        )

        ProjectMember.objects.bulk_create(
            [
                ProjectMember(
                    project_id=project_id,
                    member=request.user,
                    role=member_role_from_role_ref(proj_role, default=workspace_member.role),
                    role_ref=proj_role,
                    workspace=workspace,
                    created_by=request.user,
                )
                for project_id in project_ids
            ],
            ignore_conflicts=True,
        )

        ProjectUserProperty.objects.bulk_create(
            [
                ProjectUserProperty(
                    project_id=project_id,
                    user=request.user,
                    workspace=workspace,
                    created_by=request.user,
                )
                for project_id in project_ids
            ],
            ignore_conflicts=True,
        )

        for project_id in project_ids:
            project_member_activities.delay(
                type="project_member.activity.joined",
                requested_data=json.dumps(
                    {"member_id": request.user.id},
                    cls=DjangoJSONEncoder,
                ),
                current_instance=None,
                actor_id=str(request.user.id),
                project_id=str(project_id),
                epoch=int(timezone.now().timestamp()),
            )

        return Response({"message": "Projects joined successfully"}, status=status.HTTP_201_CREATED)


class UserProjectJoinEndpoint(BaseAPIView):
    @can(ProjectPermissions.BROWSE, resource_param="workspace_id")
    def post(self, request, slug):
        project_ids = request.data.get("project_ids", [])

        # Get the workspace user role
        workspace_member = WorkspaceMember.objects.select_related("role_ref").get(
            member=request.user, workspace__slug=slug, is_active=True
        )

        # Get all the projects
        projects = Project.objects.filter(id__in=project_ids, workspace__slug=slug).only("id", "network")
        # Check if user has permission to join each project
        for project in projects:
            if project.network == ProjectNetwork.SECRET.value and workspace_member.role != ROLE.ADMIN.value:
                return Response(
                    {"error": "Only workspace admins can join private project"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        workspace = workspace_member.workspace

        # Resolve the project role from workspace role (slug-based auto-join mapping)
        role_cache = get_project_roles_for_workspace(workspace_member.workspace_id)
        proj_role = resolve_project_role_for_ws_member(workspace_member, workspace_member.workspace_id, role_cache)

        # If the user was already part of workspace
        _ = ProjectMember.objects.filter(workspace__slug=slug, project_id__in=project_ids, member=request.user).update(
            is_active=True
        )

        ProjectMember.objects.bulk_create(
            [
                ProjectMember(
                    project_id=project_id,
                    member=request.user,
                    role=member_role_from_role_ref(proj_role, default=workspace_member.role),
                    role_ref=proj_role,
                    workspace=workspace,
                    created_by=request.user,
                )
                for project_id in project_ids
            ],
            ignore_conflicts=True,
        )

        ProjectUserProperty.objects.bulk_create(
            [
                ProjectUserProperty(
                    project_id=project_id,
                    user=request.user,
                    workspace=workspace,
                    created_by=request.user,
                )
                for project_id in project_ids
            ],
            ignore_conflicts=True,
        )

        for project_id in project_ids:
            project_member_activities.delay(
                type="project_member.activity.joined",
                requested_data=json.dumps(
                    {"member_id": request.user.id},
                    cls=DjangoJSONEncoder,
                ),
                current_instance=None,
                actor_id=str(request.user.id),
                project_id=str(project_id),
                epoch=int(timezone.now().timestamp()),
            )

        return Response({"message": "Projects joined successfully"}, status=status.HTTP_201_CREATED)


class ProjectJoinEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [AllowAny]

    def post(self, request, slug, project_id, pk):
        project_invite = ProjectMemberInvite.objects.select_related("role_ref").get(
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
                ).select_related("role_ref").first()
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

                # Sync workspace members
                member_sync_task.delay(slug)

                # Enforce workspace guest ceiling on the invite role
                invite_role = project_invite.role
                # Re-fetch workspace_member if it was just created (no role_ref yet via .create() save)
                ws_member_for_ceiling = workspace_member or WorkspaceMember.objects.filter(
                    workspace_id=project_invite.workspace_id, member=user, is_active=True
                ).select_related("role_ref").first()
                if ws_member_for_ceiling:
                    invite_role = enforce_project_role_ceiling(ws_member_for_ceiling, invite_role)

                # Use invite's role_ref when ceiling didn't change (preserves custom roles);
                # when ceiling capped the role, pass None so save() resolves from the numeric value.
                invite_role_ref = project_invite.role_ref if invite_role == project_invite.role else None

                # Check if the user was already a member of project then activate the user
                project_member = ProjectMember.objects.filter(
                    workspace_id=project_invite.workspace_id, member=user
                ).first()
                if project_member is None:
                    # Create a Project Member
                    _ = ProjectMember.objects.create(
                        project_id=project_id,
                        workspace_id=project_invite.workspace_id,
                        member=user,
                        role=invite_role,
                        role_ref=invite_role_ref,
                    )
                else:
                    project_member.is_active = True
                    project_member.role = invite_role
                    project_member.role_ref = invite_role_ref
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
        project_invitation = ProjectMemberInvite.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        serializer = ProjectMemberInviteSerializer(project_invitation)
        return Response(serializer.data, status=status.HTTP_200_OK)
