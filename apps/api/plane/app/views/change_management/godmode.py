"""
God Mode API views for Assignment Groups and CAB Groups.
Super admin only — full CRUD + member management.
"""

from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseAPIView
from plane.license.api.permissions import InstanceAdminPermission
from plane.db.models import (
    Workspace,
    WorkspaceMember,
    AssignmentGroup,
    AssignmentGroupMember,
    CabGroup,
    CabGroupMember,
    WorkspaceSecOpsConfig,
)
from plane.app.serializers import (
    AssignmentGroupSerializer,
    AssignmentGroupMemberSerializer,
    CabGroupSerializer,
    CabGroupMemberSerializer,
)


# -----------------------------------------------------------------------
# Assignment Groups — God Mode CRUD
# -----------------------------------------------------------------------

class GodModeAssignmentGroupEndpoint(BaseAPIView):
    """Full CRUD for assignment groups — super admin only."""
    permission_classes = [InstanceAdminPermission]

    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response(
                {"error": f"Workspace '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        groups = (
            AssignmentGroup.objects.filter(workspace=workspace)
            .prefetch_related("group_members__member")
        )
        return Response(
            AssignmentGroupSerializer(groups, many=True).data,
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response(
                {"error": f"Workspace '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        name = request.data.get("name", "").strip()
        if not name:
            return Response(
                {"error": "Group name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if AssignmentGroup.objects.filter(workspace=workspace, name=name).exists():
            return Response(
                {"error": f"An assignment group named '{name}' already exists."},
                status=status.HTTP_409_CONFLICT,
            )

        group = AssignmentGroup.objects.create(
            workspace=workspace,
            name=name,
            description=request.data.get("description", ""),
            is_active=request.data.get("is_active", True),
        )
        return Response(
            AssignmentGroupSerializer(group).data,
            status=status.HTTP_201_CREATED,
        )


class GodModeAssignmentGroupDetailEndpoint(BaseAPIView):
    """Update/delete a single assignment group."""
    permission_classes = [InstanceAdminPermission]

    def patch(self, request, slug, pk):
        group = AssignmentGroup.objects.filter(
            workspace__slug=slug, pk=pk
        ).first()
        if not group:
            return Response(
                {"error": "Assignment group not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        for field in ("name", "description", "is_active"):
            if field in request.data:
                setattr(group, field, request.data[field])
        group.save()
        return Response(
            AssignmentGroupSerializer(group).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, slug, pk):
        group = AssignmentGroup.objects.filter(
            workspace__slug=slug, pk=pk
        ).first()
        if not group:
            return Response(
                {"error": "Assignment group not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        group.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GodModeAssignmentGroupMemberEndpoint(BaseAPIView):
    """Manage members of an assignment group."""
    permission_classes = [InstanceAdminPermission]

    def get(self, request, slug, group_id):
        group = AssignmentGroup.objects.filter(
            workspace__slug=slug, pk=group_id
        ).first()
        if not group:
            return Response(
                {"error": "Assignment group not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        members = group.group_members.select_related("member").all()
        return Response(
            AssignmentGroupMemberSerializer(members, many=True).data,
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug, group_id):
        group = AssignmentGroup.objects.filter(
            workspace__slug=slug, pk=group_id
        ).first()
        if not group:
            return Response(
                {"error": "Assignment group not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        member_id = request.data.get("member")
        if not member_id:
            return Response(
                {"error": "member is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Validate member belongs to this workspace
        if not WorkspaceMember.objects.filter(
            workspace=group.workspace, member_id=member_id, is_active=True,
        ).exists():
            return Response(
                {"error": "User is not a member of this workspace."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if AssignmentGroupMember.objects.filter(
            assignment_group=group, member_id=member_id
        ).exists():
            return Response(
                {"error": "User is already a member of this group."},
                status=status.HTTP_409_CONFLICT,
            )
        membership = AssignmentGroupMember.objects.create(
            assignment_group=group, member_id=member_id,
        )
        return Response(
            AssignmentGroupMemberSerializer(membership).data,
            status=status.HTTP_201_CREATED,
        )


class GodModeAssignmentGroupMemberDetailEndpoint(BaseAPIView):
    """Remove a member from an assignment group."""
    permission_classes = [InstanceAdminPermission]

    def delete(self, request, slug, group_id, pk):
        membership = AssignmentGroupMember.objects.filter(
            assignment_group__workspace__slug=slug,
            assignment_group_id=group_id,
            pk=pk,
        ).first()
        if not membership:
            return Response(
                {"error": "Membership not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# -----------------------------------------------------------------------
# CAB Groups — God Mode CRUD
# -----------------------------------------------------------------------

class GodModeCabGroupEndpoint(BaseAPIView):
    """Full CRUD for CAB groups — super admin only."""
    permission_classes = [InstanceAdminPermission]

    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response(
                {"error": f"Workspace '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        groups = (
            CabGroup.objects.filter(workspace=workspace)
            .prefetch_related("group_members__member")
        )

        # Include which group is the designated CAB group
        designated_id = None
        try:
            config = WorkspaceSecOpsConfig.objects.get(workspace=workspace)
            if config.cab_group_id:
                designated_id = str(config.cab_group_id)
        except WorkspaceSecOpsConfig.DoesNotExist:
            pass

        data = CabGroupSerializer(groups, many=True).data
        for item in data:
            item["is_designated"] = str(item["id"]) == designated_id

        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response(
                {"error": f"Workspace '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        name = request.data.get("name", "").strip()
        if not name:
            return Response(
                {"error": "Group name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if CabGroup.objects.filter(workspace=workspace, name=name).exists():
            return Response(
                {"error": f"A CAB group named '{name}' already exists."},
                status=status.HTTP_409_CONFLICT,
            )

        group = CabGroup.objects.create(
            workspace=workspace,
            name=name,
            description=request.data.get("description", ""),
            is_active=request.data.get("is_active", True),
        )
        return Response(
            CabGroupSerializer(group).data,
            status=status.HTTP_201_CREATED,
        )


class GodModeCabGroupDetailEndpoint(BaseAPIView):
    """Update/delete a single CAB group."""
    permission_classes = [InstanceAdminPermission]

    def patch(self, request, slug, pk):
        group = CabGroup.objects.filter(
            workspace__slug=slug, pk=pk
        ).first()
        if not group:
            return Response(
                {"error": "CAB group not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        for field in ("name", "description", "is_active"):
            if field in request.data:
                setattr(group, field, request.data[field])
        group.save()
        return Response(
            CabGroupSerializer(group).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, slug, pk):
        group = CabGroup.objects.filter(
            workspace__slug=slug, pk=pk
        ).first()
        if not group:
            return Response(
                {"error": "CAB group not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        group.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GodModeCabGroupMemberEndpoint(BaseAPIView):
    """Manage members of a CAB group."""
    permission_classes = [InstanceAdminPermission]

    def get(self, request, slug, group_id):
        group = CabGroup.objects.filter(
            workspace__slug=slug, pk=group_id
        ).first()
        if not group:
            return Response(
                {"error": "CAB group not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        members = group.group_members.select_related("member").all()
        return Response(
            CabGroupMemberSerializer(members, many=True).data,
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug, group_id):
        group = CabGroup.objects.filter(
            workspace__slug=slug, pk=group_id
        ).first()
        if not group:
            return Response(
                {"error": "CAB group not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        member_id = request.data.get("member")
        if not member_id:
            return Response(
                {"error": "member is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not WorkspaceMember.objects.filter(
            workspace=group.workspace, member_id=member_id, is_active=True,
        ).exists():
            return Response(
                {"error": "User is not a member of this workspace."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if CabGroupMember.objects.filter(
            cab_group=group, member_id=member_id
        ).exists():
            return Response(
                {"error": "User is already a member of this CAB group."},
                status=status.HTTP_409_CONFLICT,
            )
        membership = CabGroupMember.objects.create(
            cab_group=group, member_id=member_id,
        )
        return Response(
            CabGroupMemberSerializer(membership).data,
            status=status.HTTP_201_CREATED,
        )


class GodModeCabGroupMemberDetailEndpoint(BaseAPIView):
    """Remove a member from a CAB group."""
    permission_classes = [InstanceAdminPermission]

    def delete(self, request, slug, group_id, pk):
        membership = CabGroupMember.objects.filter(
            cab_group__workspace__slug=slug,
            cab_group_id=group_id,
            pk=pk,
        ).first()
        if not membership:
            return Response(
                {"error": "Membership not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GodModeDesignateCabGroupEndpoint(BaseAPIView):
    """Set a CAB group as the workspace's designated CAB group."""
    permission_classes = [InstanceAdminPermission]

    def post(self, request, slug, pk):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response(
                {"error": f"Workspace '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        group = CabGroup.objects.filter(
            workspace=workspace, pk=pk
        ).first()
        if not group:
            return Response(
                {"error": "CAB group not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        config, _ = WorkspaceSecOpsConfig.objects.get_or_create(
            workspace=workspace,
        )
        config.cab_group = group
        config.save(update_fields=["cab_group", "updated_at"])
        return Response(
            {"status": "ok", "cab_group_id": str(group.id), "cab_group_name": group.name},
            status=status.HTTP_200_OK,
        )


# -----------------------------------------------------------------------
# Workspace Members — God Mode read-only list
# -----------------------------------------------------------------------

class GodModeWorkspaceMembersEndpoint(BaseAPIView):
    """Read-only list of workspace members for member-selector dropdowns."""
    permission_classes = [InstanceAdminPermission]

    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response(
                {"error": f"Workspace '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        members = WorkspaceMember.objects.filter(
            workspace=workspace, is_active=True,
        ).select_related("member")

        data = [
            {
                "id": str(wm.member_id),
                "display_name": wm.member.display_name or "",
                "email": wm.member.email,
                "role": wm.role,
            }
            for wm in members
        ]
        return Response(data, status=status.HTTP_200_OK)
