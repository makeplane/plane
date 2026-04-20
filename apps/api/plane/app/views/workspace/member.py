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
from django.db.models import Count, Q, OuterRef, Subquery, IntegerField
from django.utils import timezone
from django.db.models.functions import Coalesce
from django.core.serializers.json import DjangoJSONEncoder

# Third party modules
from rest_framework import status
from rest_framework.response import Response

from plane.permissions import WorkspacePermissions, WorkspaceMemberPermissions, can
from plane.permissions.system_roles import (
    get_workspace_role_slug,
    get_workspace_roles_for_workspace,
    can_manage_role,
    can_assign_role,
    member_role_from_role_ref,
)

# Module imports
from plane.app.serializers import (
    ProjectMemberRoleSerializer,
    WorkspaceMemberAdminSerializer,
    WorkspacePreferencesSerializer,
    WorkSpaceMemberSerializer,
    WorkspaceMemberUserOnboardingSerializer,
)
from plane.app.views.base import BaseAPIView
from plane.utils.cache import invalidate_cache
from plane.db.models import (
    Project,
    ProjectMember,
    WorkspaceMember,
    DraftIssue,
    Cycle,
)
from plane.ee.models import TeamspaceMember, PageUser
from plane.payment.bgtasks.member_sync_task import member_sync_task
from plane.payment.utils.member_payment_count import workspace_member_check
from .. import BaseViewSet
from plane.ee.bgtasks.workspace_member_activities_task import workspace_members_activity


class WorkSpaceMemberViewSet(BaseViewSet):
    serializer_class = WorkspaceMemberAdminSerializer
    model = WorkspaceMember

    search_fields = ["member__display_name", "member__first_name"]
    use_read_replica = True

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("member", "member__avatar_asset", "role_ref")
        )

    @can(WorkspaceMemberPermissions.VIEW, resource_param="workspace_id")
    def list(self, request, slug):
        workspace_member = WorkspaceMember.objects.select_related("role_ref").get(
            member=request.user, workspace__slug=slug, is_active=True
        )

        # Get all active workspace members
        workspace_members = self.get_queryset()
        if workspace_member.role_ref and workspace_member.role_ref.slug != "guest":
            serializer = WorkspaceMemberAdminSerializer(workspace_members, many=True)
        else:
            serializer = WorkSpaceMemberSerializer(workspace_members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    def retrieve(self, request, slug, pk):
        workspace_member = WorkspaceMember.objects.select_related("role_ref").get(
            member=request.user, workspace__slug=slug, is_active=True
        )

        try:
            # Get the specific workspace member by pk
            member = self.get_queryset().get(pk=pk)
        except WorkspaceMember.DoesNotExist:
            return Response(
                {"error": "Workspace member not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if workspace_member.role_ref and workspace_member.role_ref.slug != "guest":
            serializer = WorkspaceMemberAdminSerializer(member)
        else:
            serializer = WorkSpaceMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @can(WorkspaceMemberPermissions.CHANGE_ROLE, resource_param="pk")
    def partial_update(self, request, slug, pk):
        workspace_member = WorkspaceMember.objects.select_related("role_ref").get(
            pk=pk, workspace__slug=slug, member__is_bot=False, is_active=True
        )
        if request.user.id == workspace_member.member_id:
            return Response(
                {"error": "You cannot update your own role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Tier protection — resolve actor role
        actor_member = WorkspaceMember.objects.select_related("role_ref").get(
            workspace__slug=slug, member=request.user, is_active=True
        )
        actor_slug = get_workspace_role_slug(actor_member)
        target_slug = get_workspace_role_slug(workspace_member)

        # Can the actor manage the target's CURRENT role?
        allowed, error = can_manage_role(actor_slug, target_slug)
        if not allowed:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)

        # Capture current state before mutation for accurate audit trail
        current_instance = json.dumps(WorkSpaceMemberSerializer(workspace_member).data, cls=DjangoJSONEncoder)

        # Resolve role_slug to role level if provided
        target_role = None
        target_ws_role = None
        if "role_slug" in request.data:
            ws_role_cache = get_workspace_roles_for_workspace(workspace_member.workspace_id)
            target_ws_role = ws_role_cache.get(request.data["role_slug"])
            if not target_ws_role:
                return Response(
                    {"error": f"Invalid role_slug: {request.data['role_slug']}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            target_role = member_role_from_role_ref(target_ws_role)
            # Can the actor assign the NEW role?
            allowed, error = can_assign_role(actor_slug, target_ws_role.slug)
            if not allowed:
                return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        elif "role" in request.data:
            return Response(
                {"error": "Use role_slug instead of role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target_role is not None:
            # Seat limit check FIRST (before any side effects)
            allowed, _, _ = workspace_member_check(
                slug=slug,
                requested_role_slug=target_ws_role.slug if target_ws_role else None,
                current_role_slug=workspace_member.role_ref.slug if workspace_member.role_ref else None,
            )
            if not allowed:
                return Response(
                    {"error": "Cannot update the role as it exceeds the purchased seat limit"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Guest demotion side effects (only after seat check passes)
            if target_ws_role and target_ws_role.slug == "guest":
                ProjectMember.objects.filter(workspace__slug=slug, member_id=workspace_member.member_id).update(role=5)
                TeamspaceMember.objects.filter(workspace__slug=slug, member_id=workspace_member.member_id).delete()

            # Set role and role_ref
            workspace_member.role = target_role
            workspace_member.role_ref = target_ws_role

        serializer = WorkSpaceMemberSerializer(workspace_member, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()

            workspace_members_activity.delay(
                type="workspace_member.activity.updated",
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                workspace_id=workspace_member.workspace_id,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                workspace_member_id=workspace_member.id,
            )
            # Sync workspace members
            member_sync_task.delay(slug)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(WorkspaceMemberPermissions.REMOVE, resource_param="pk")
    def destroy(self, request, slug, pk):
        # Check the user role who is deleting the user
        workspace_member = WorkspaceMember.objects.select_related("role_ref").get(
            workspace__slug=slug, pk=pk, member__is_bot=False, is_active=True
        )

        if request.user.id == workspace_member.member_id:
            return Response(
                {"error": "You cannot remove yourself from the workspace. Please use leave workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Tier protection — can actor remove this member?
        actor_member = WorkspaceMember.objects.select_related("role_ref").get(
            workspace__slug=slug, member=request.user, is_active=True
        )
        actor_slug = get_workspace_role_slug(actor_member)
        target_slug = get_workspace_role_slug(workspace_member)

        allowed, error = can_manage_role(actor_slug, target_slug)
        if not allowed:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)

        if (
            Project.objects.annotate(
                total_members=Count("project_projectmember"),
                member_with_role=Count(
                    "project_projectmember",
                    filter=Q(
                        project_projectmember__member_id=workspace_member.id,
                        project_projectmember__role=20,
                    ),
                ),
            )
            .filter(total_members=1, member_with_role=1, workspace__slug=slug)
            .exists()
        ):
            return Response(
                {
                    "error": "User is a part of some projects where they are the only admin, they should either leave that project or promote another user to admin."  # noqa: E501
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deactivate the users from the projects where the user is part of
        _ = ProjectMember.objects.filter(
            workspace__slug=slug, member_id=workspace_member.member_id, is_active=True
        ).update(is_active=False, updated_at=timezone.now())

        removed_member_name = workspace_member.member.display_name
        workspace_member.is_active = False
        workspace_member.save()

        # Remove the user from the teamspaces where the user is part of
        TeamspaceMember.objects.filter(workspace__slug=slug, member_id=workspace_member.member_id).delete()

        # Remove the user from the pages where the user is part of
        PageUser.objects.filter(workspace__slug=slug, user_id=workspace_member.member_id).delete()

        # Sync workspace members
        member_sync_task.delay(slug)

        workspace_members_activity.delay(
            type="workspace_member.activity.removed",
            requested_data={"name": removed_member_name},
            current_instance=None,
            actor_id=request.user.id,
            workspace_id=workspace_member.workspace_id,
            epoch=int(timezone.now().timestamp()),
            notification=True,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @invalidate_cache(
        path="/api/workspaces/:slug/members/",
        url_params=True,
        user=False,
        multiple=True,
    )
    @invalidate_cache(path="/api/users/me/settings/")
    @invalidate_cache(path="api/users/me/workspaces/", user=False, multiple=True)
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def leave(self, request, slug):
        workspace_member = WorkspaceMember.objects.select_related("role_ref").get(
            workspace__slug=slug, member=request.user, is_active=True
        )

        # Check if the leaving user is the only admin/owner of the workspace
        if (
            workspace_member.role_ref
            and workspace_member.role_ref.slug in ("admin", "owner")
            and not WorkspaceMember.objects.filter(
                workspace__slug=slug, role_ref__slug__in=["admin", "owner"], is_active=True
            ).count()
            > 1
        ):
            return Response(
                {
                    "error": "You cannot leave the workspace as you are the only admin of the workspace you will have to either delete the workspace or promote another user to admin."  # noqa: E501
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            Project.objects.annotate(
                total_members=Count("project_projectmember"),
                member_with_role=Count(
                    "project_projectmember",
                    filter=Q(
                        project_projectmember__member_id=request.user.id,
                        project_projectmember__role_ref__slug="admin",
                    ),
                ),
            )
            .filter(total_members=1, member_with_role=1, workspace__slug=slug)
            .exists()
        ):
            return Response(
                {
                    "error": "You are a part of some projects where you are the only admin, you should either leave the project or promote another user to admin."  # noqa: E501
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # # Deactivate the users from the projects where the user is part of
        _ = ProjectMember.objects.filter(
            workspace__slug=slug, member_id=workspace_member.member_id, is_active=True
        ).update(is_active=False, updated_at=timezone.now())

        # # Deactivate the user
        workspace_member.is_active = False
        workspace_member.save()

        # Remove the user from the teamspaces where the user is part of
        TeamspaceMember.objects.filter(workspace__slug=slug, member_id=workspace_member.member_id).delete()

        # Remove the user from the pages where the user is part of
        PageUser.objects.filter(workspace__slug=slug, user_id=workspace_member.member_id).delete()

        # # Sync workspace members
        member_sync_task.delay(slug)

        workspace_members_activity.delay(
            type="workspace_member.activity.left",
            requested_data=None,
            current_instance=None,
            actor_id=request.user.id,
            workspace_id=workspace_member.workspace_id,
            epoch=int(timezone.now().timestamp()),
            notification=True,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceMemberUserViewsEndpoint(BaseAPIView):
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def post(self, request, slug):
        workspace_member = WorkspaceMember.objects.get(workspace__slug=slug, member=request.user, is_active=True)
        workspace_member.view_props = request.data.get("view_props", {})
        workspace_member.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspacePreferencesEndpoint(BaseAPIView):
    use_read_replica = True

    def _get_annotated_member(self, request, slug):
        draft_issue_count = (
            DraftIssue.objects.filter(
                created_by=OuterRef("member"),
                workspace_id=OuterRef("workspace_id"),
                project__project_projectmember__member=OuterRef("member"),
                project__project_projectmember__is_active=True,
            )
            .values("workspace_id")
            .annotate(count=Count("id", distinct=True))
            .values("count")
        )
        active_cycles_count = (
            Cycle.objects.filter(
                ~Q(project__project_projectmember__role_ref__slug="guest"),
                workspace__slug=OuterRef("workspace__slug"),
                project__project_projectmember__member=OuterRef("member"),
                project__project_projectmember__is_active=True,
                start_date__lte=timezone.now(),
                end_date__gte=timezone.now(),
            )
            .values("workspace__slug")
            .annotate(count=Count("id", distinct=True))
            .values("count")
        )

        return (
            WorkspaceMember.objects.filter(member=request.user, workspace__slug=slug, is_active=True)
            .select_related("role_ref")
            .annotate(draft_issue_count=Coalesce(Subquery(draft_issue_count, output_field=IntegerField()), 0))
            .annotate(active_cycles_count=Coalesce(Subquery(active_cycles_count, output_field=IntegerField()), 0))
            .first()
        )

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug):
        workspace_member = self._get_annotated_member(request, slug)
        if workspace_member:
            serializer = WorkspacePreferencesSerializer(workspace_member)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "You are not a member of this workspace"}, status=status.HTTP_403_FORBIDDEN)

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def patch(self, request, slug):
        workspace_member = self._get_annotated_member(request, slug)
        if not workspace_member:
            return Response(
                {"error": "You are not a member of this workspace"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = WorkspacePreferencesSerializer(workspace_member, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# For WorkspaceMember fields:
# - getting_started_checklist
# - tips
# - explored_features
class WorkspaceMemberUserOnboardingEndpoint(BaseAPIView):
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def patch(self, request, slug):
        try:
            workspace_member = WorkspaceMember.objects.get(workspace__slug=slug, member=request.user, is_active=True)

        except WorkspaceMember.DoesNotExist:
            return Response(
                {"error": "You are not a member of this workspace"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = WorkspaceMemberUserOnboardingSerializer(
            workspace_member,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkspaceProjectMemberEndpoint(BaseAPIView):
    serializer_class = ProjectMemberRoleSerializer
    model = ProjectMember

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug):
        # Fetch all project IDs where the user is involved
        project_ids = (
            ProjectMember.objects.filter(member=request.user, is_active=True)
            .values_list("project_id", flat=True)
            .distinct()
        )

        # Get all the project members in which the user is involved
        project_members = ProjectMember.objects.filter(
            workspace__slug=slug, project_id__in=project_ids, is_active=True
        ).select_related("project", "member", "workspace", "role_ref")
        project_members = ProjectMemberRoleSerializer(project_members, many=True).data

        project_members_dict = dict()

        # Construct a dictionary with project_id as key and project_members as value
        for project_member in project_members:
            project_id = project_member.pop("project")
            if str(project_id) not in project_members_dict:
                project_members_dict[str(project_id)] = []
            project_members_dict[str(project_id)].append(project_member)

        return Response(project_members_dict, status=status.HTTP_200_OK)
