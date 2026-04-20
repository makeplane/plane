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


# Third Party imports
from rest_framework.response import Response
from rest_framework import status

import json

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Q, Min


# Module imports
from .base import BaseViewSet, BaseAPIView
from plane.app.serializers import (
    ProjectMemberSerializer,
    ProjectMemberAdminSerializer,
    ProjectMemberRoleSerializer,
    ProjectMemberPreferenceSerializer,
)

from plane.db.models import Project, ProjectMember, ProjectUserProperty, WorkspaceMember
from plane.permissions import ProjectPermissions, ProjectMemberPermissions, can
from plane.db.models.user import BotTypeEnum
from plane.ee.models import PageUser
from plane.bgtasks.project_add_user_email_task import project_add_user_email
from plane.utils.host import base_host
from plane.app.permissions.base import ROLE
from plane.permissions.system_roles import (
    project_role_from_member_role,
    get_workspace_role_slug,
    get_project_role_slug,
    is_project_role_allowed_for_workspace_role,
    get_project_roles_for_workspace,
    can_manage_role,
    can_assign_role,
    member_role_from_role_ref,
    PROJECT_PROTECTED_ROLE_SLUGS,
)
from plane.ee.bgtasks.project_member_activities_tasks import project_member_activities


class ProjectMemberViewSet(BaseViewSet):
    serializer_class = ProjectMemberAdminSerializer
    model = ProjectMember

    search_fields = ["member__display_name", "member__first_name"]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(member__is_bot=False)
            .filter()
            .select_related("project")
            .select_related("member")
            .select_related("role_ref")
            .select_related("workspace", "workspace__owner")
        )

    @can(ProjectMemberPermissions.INVITE, resource_param="project_id")
    def create(self, request, slug, project_id):
        # Get the list of members to be added to the project and their roles i.e. the user_id and the role
        members = request.data.get("members", [])

        # get the project
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        # Check if the members array is empty
        if not len(members):
            return Response(
                {"error": "At least one member is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Initialize the bulk arrays
        bulk_project_members = []
        bulk_issue_props = []

        # Pre-fetch project roles for role_ref resolution
        role_cache = get_project_roles_for_workspace(project.workspace_id)

        # Pre-fetch workspace members for ceiling checks (single query, avoids N+1)
        ws_members_by_id = {
            str(wm.member_id): wm
            for wm in WorkspaceMember.objects.filter(
                workspace__slug=slug,
                member_id__in=[m.get("member_id") for m in members],
                is_active=True,
            ).select_related("role_ref")
        }

        # Resolve actor's project role for tier protection
        actor_pm = (
            ProjectMember.objects.select_related("role_ref")
            .filter(project_id=project_id, member=request.user, is_active=True)
            .first()
        )
        if actor_pm:
            actor_slug = get_project_role_slug(actor_pm)
        else:
            # Workspace admin/owner fallback — they can manage project members
            # without being a project member themselves
            ws_actor = WorkspaceMember.objects.select_related("role_ref").get(
                workspace__slug=slug, member=request.user, is_active=True
            )
            ws_slug = get_workspace_role_slug(ws_actor)
            actor_slug = "admin" if ws_slug in ("owner", "admin") else ws_slug

        # Resolve role_slug → Role FK for each member and validate
        # NOTE: Old code also prevented workspace admins from being assigned lower project roles.
        # That guard was intentionally removed — only workspace guests are constrained.
        member_roles = {}
        for member in members:
            role_slug = member.get("role_slug")
            if not role_slug:
                return Response(
                    {"error": "role_slug is required for each member"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            proj_role = role_cache.get(role_slug)
            if not proj_role:
                return Response(
                    {"error": f"Invalid role_slug: {role_slug}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Ceiling check
            ws_member = ws_members_by_id.get(str(member.get("member_id")))
            if not ws_member:
                return Response(
                    {"error": "One or more members are not active workspace members"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ws_slug = get_workspace_role_slug(ws_member)
            if not is_project_role_allowed_for_workspace_role(ws_slug, role_slug):
                return Response(
                    {"error": "Workspace guests can only be assigned commenter or guest roles on projects"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Tier protection — can actor assign this role?
            allowed, error = can_assign_role(actor_slug, role_slug, PROJECT_PROTECTED_ROLE_SLUGS)
            if not allowed:
                return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
            member_roles[member.get("member_id")] = proj_role

        # Update roles in the members array based on the member_roles dictionary and set is_active to True
        for project_member in ProjectMember.objects.filter(
            project_id=project_id,
            member_id__in=[member.get("member_id") for member in members],
        ):
            proj_role = member_roles[str(project_member.member_id)]
            project_member.role = member_role_from_role_ref(proj_role)
            project_member.role_ref = proj_role
            project_member.is_active = True
            bulk_project_members.append(project_member)

        # Update the roles of the existing members
        ProjectMember.objects.bulk_update(bulk_project_members, ["is_active", "role", "role_ref_id"], batch_size=100)

        # Reset for new member creation (don't pass already-updated members to bulk_create)
        bulk_project_members = []

        # Get the minimum sort_order for each member in the workspace
        member_sort_orders = (
            ProjectUserProperty.objects.filter(
                workspace__slug=slug,
                user_id__in=[member.get("member_id") for member in members],
            )
            .values("user_id")
            .annotate(min_sort_order=Min("sort_order"))
        )
        # Convert to dictionary for easy lookup: {user_id: min_sort_order}
        sort_order_map = {str(item["user_id"]): item["min_sort_order"] for item in member_sort_orders}

        # Loop through requested members
        for member in members:
            member_id = str(member.get("member_id"))
            proj_role = member_roles[member.get("member_id")]
            # Get the minimum sort_order for this member, or use default
            min_sort_order = sort_order_map.get(member_id)
            # Create a new project member
            bulk_project_members.append(
                ProjectMember(
                    member_id=member.get("member_id"),
                    role=member_role_from_role_ref(proj_role),
                    role_ref=proj_role,
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                )
            )
            # Create a new issue property
            bulk_issue_props.append(
                ProjectUserProperty(
                    user_id=member.get("member_id"),
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    sort_order=(min_sort_order - 10000 if min_sort_order is not None else 65535),
                )
            )

        # Bulk create the project members and issue properties
        project_members = ProjectMember.objects.bulk_create(bulk_project_members, batch_size=10, ignore_conflicts=True)

        _ = ProjectUserProperty.objects.bulk_create(bulk_issue_props, batch_size=10, ignore_conflicts=True)

        project_members = ProjectMember.objects.filter(
            project_id=project_id,
            member_id__in=[member.get("member_id") for member in members],
        )
        # Send emails to notify the users
        for project_member in project_members:
            project_add_user_email.delay(
                base_host(request=request, is_app=True),
                project_member.id,
                request.user.id,
            )
        # Serialize the project members
        serializer = ProjectMemberRoleSerializer(project_members, many=True)

        project_member_activities.delay(
            type="project_member.activity.added",
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            current_instance=None,
            actor_id=str(request.user.id),
            project_id=str(project_id),
            epoch=int(timezone.now().timestamp()),
        )
        # Return the serialized data
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @can(ProjectMemberPermissions.VIEW, resource_param="project_id")
    def list(self, request, slug, project_id):
        bot_filter = Q(member__is_bot=False) | Q(member__bot_type=BotTypeEnum.APP_BOT.value)
        project_members = ProjectMember.objects.filter(
            bot_filter,
            project_id=project_id,
            workspace__slug=slug,
            is_active=True,
            member__member_workspace__workspace__slug=slug,
            member__member_workspace__is_active=True,
        ).select_related("role_ref")
        serializer = ProjectMemberRoleSerializer(project_members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @can(ProjectMemberPermissions.VIEW, resource_param="pk")
    def retrieve(self, request, slug, project_id, pk):
        requesting_project_member = ProjectMember.objects.get(
            project_id=project_id,
            workspace__slug=slug,
            member=request.user,
            is_active=True,
        )

        project_member = (
            ProjectMember.objects.filter(
                pk=pk,
                project_id=project_id,
                workspace__slug=slug,
                member__is_bot=False,
                is_active=True,
            )
            .select_related("project", "member", "workspace", "role_ref")
            .first()
        )

        if not project_member:
            return Response(
                {"error": "Project member not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if project_role_from_member_role(requesting_project_member.role) != "guest":
            serializer = ProjectMemberAdminSerializer(project_member)
        else:
            serializer = ProjectMemberRoleSerializer(project_member, fields=("id", "member", "role"))

        return Response(serializer.data, status=status.HTTP_200_OK)

    @can(ProjectMemberPermissions.CHANGE_ROLE, resource_param="pk")
    def partial_update(self, request, slug, project_id, pk):
        project_member = ProjectMember.objects.select_related("role_ref").get(
            pk=pk, workspace__slug=slug, project_id=project_id, is_active=True
        )

        # Fetch the workspace role of the project member
        ws_member = WorkspaceMember.objects.select_related("role_ref").get(
            workspace__slug=slug, member=project_member.member, is_active=True
        )
        workspace_role = ws_member.role
        is_workspace_admin = workspace_role == ROLE.ADMIN.value

        # Check if the user is not editing their own role if they are not an admin
        if request.user.id == project_member.member_id and not is_workspace_admin:
            return Response(
                {"error": "You cannot update your own role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Tier protection — can actor manage the target's CURRENT role?
        actor_pm = (
            ProjectMember.objects.select_related("role_ref")
            .filter(project_id=project_id, member=request.user, is_active=True)
            .first()
        )
        if actor_pm:
            actor_slug = get_project_role_slug(actor_pm)
        else:
            ws_slug = get_workspace_role_slug(ws_member)
            actor_slug = "admin" if ws_slug in ("owner", "admin") else ws_slug
        target_slug = get_project_role_slug(project_member)

        allowed, error = can_manage_role(actor_slug, target_slug, PROJECT_PROTECTED_ROLE_SLUGS)
        if not allowed:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)

        # Capture current state before mutation for accurate audit trail
        current_instance = json.dumps(ProjectMemberSerializer(project_member).data, cls=DjangoJSONEncoder)
        requested_data = json.dumps(request.data, cls=DjangoJSONEncoder)

        # Resolve role_slug if provided
        if "role_slug" in request.data:
            role_cache = get_project_roles_for_workspace(project_member.workspace_id)
            target_proj_role = role_cache.get(request.data["role_slug"])
            if not target_proj_role:
                return Response(
                    {"error": f"Invalid role_slug: {request.data['role_slug']}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            target_slug = request.data["role_slug"]

            # Enforce workspace guest ceiling
            ws_slug = get_workspace_role_slug(ws_member)
            if not is_project_role_allowed_for_workspace_role(ws_slug, target_slug):
                return Response(
                    {"error": "Workspace guests can only be assigned commenter or guest roles on projects"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Tier protection — can actor assign the NEW role?
            allowed, error = can_assign_role(actor_slug, request.data["role_slug"], PROJECT_PROTECTED_ROLE_SLUGS)
            if not allowed:
                return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)

            # Set role and role_ref directly on the member before serializer save
            project_member.role = member_role_from_role_ref(target_proj_role)
            project_member.role_ref = target_proj_role
        elif "role" in request.data:
            return Response(
                {"error": "Use role_slug instead of role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ProjectMemberSerializer(project_member, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            project_member_activities.delay(
                type="project_member.activity.update",
                requested_data=requested_data,
                current_instance=current_instance,
                actor_id=str(request.user.id),
                project_id=str(project_id),
                project_member_id=str(project_member.id),
                epoch=int(timezone.now().timestamp()),
            )

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(ProjectMemberPermissions.REMOVE, resource_param="pk")
    def destroy(self, request, slug, project_id, pk):
        project_member = ProjectMember.objects.select_related("role_ref").get(
            workspace__slug=slug,
            project_id=project_id,
            pk=pk,
            member__is_bot=False,
            is_active=True,
        )
        # User cannot remove himself
        if project_member.member_id == request.user.id:
            return Response(
                {"error": "You cannot remove yourself from the project. Please use leave project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Tier protection — can actor remove this member?
        actor_pm = (
            ProjectMember.objects.select_related("role_ref")
            .filter(project_id=project_id, member=request.user, is_active=True)
            .first()
        )
        if actor_pm:
            actor_slug = get_project_role_slug(actor_pm)
        else:
            # Workspace admin/owner fallback
            ws_actor = WorkspaceMember.objects.select_related("role_ref").get(
                workspace__slug=slug, member=request.user, is_active=True
            )
            ws_slug = get_workspace_role_slug(ws_actor)
            actor_slug = "admin" if ws_slug in ("owner", "admin") else ws_slug
        target_slug = get_project_role_slug(project_member)

        allowed, error = can_manage_role(actor_slug, target_slug, PROJECT_PROTECTED_ROLE_SLUGS)
        if not allowed:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)

        project_member.is_active = False
        project_member.save()

        # Remove the user from the pages where the user is part of
        PageUser.objects.filter(
            user_id=project_member.member_id,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()

        project_member_activities.delay(
            type="project_member.activity.removed",
            actor_id=str(request.user.id),
            project_id=str(project_id),
            current_instance=json.dumps({"members": [str(project_member.member_id)]}),
            requested_data=None,
            epoch=int(timezone.now().timestamp()),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @can(ProjectPermissions.VIEW, resource_param="project_id")
    def leave(self, request, slug, project_id):
        project_member = ProjectMember.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            member=request.user,
            is_active=True,
        )

        # Check if the leaving user is the only admin of the project
        if (
            project_member.role == 20
            and not ProjectMember.objects.filter(
                workspace__slug=slug, project_id=project_id, role=20, is_active=True
            ).count()
            > 1
        ):
            return Response(
                {
                    "error": """
                    You cannot leave the project as your the only admin of the project
                    you will have to either delete the project or create an another admin
                    """
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deactivate the user
        project_member.is_active = False
        project_member.save()

        # Remove the user from the pages where the user is part of
        PageUser.objects.filter(
            user_id=project_member.member_id,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()

        project_member_activities.delay(
            type="project_member.activity.left",
            actor_id=str(request.user.id),
            project_id=str(project_id),
            current_instance=json.dumps(
                {
                    "members": [str(request.user.id)],
                }
            ),
            requested_data=None,
            epoch=int(timezone.now().timestamp()),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

# TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
class ProjectMemberPreferenceEndpoint(BaseAPIView):
    def get_queryset(self, slug, project_id, member_id):
        return ProjectMember.objects.get(
            project_id=project_id,
            member_id=member_id,
            workspace__slug=slug,
        )

    def patch(self, request, slug, project_id, member_id):
        project_member = self.get_queryset(slug, project_id, member_id)
        serializer = ProjectMemberPreferenceSerializer(project_member, {"preferences": request.data}, partial=True)
        if serializer.is_valid():
            serializer.save()

            return Response({"preferences": serializer.data["preferences"]}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, slug, project_id, member_id):
        project_member = self.get_queryset(slug, project_id, member_id)

        serializer = ProjectMemberPreferenceSerializer(project_member)

        return Response(serializer.data, status=status.HTTP_200_OK)
