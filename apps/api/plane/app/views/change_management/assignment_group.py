# Django imports
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseViewSet
from plane.app.permissions import WorkSpaceBasePermission, allow_permission, ROLE
from plane.app.serializers.change_management import (
    AssignmentGroupSerializer,
    AssignmentGroupMemberSerializer,
    CabGroupSerializer,
)
from plane.db.models import (
    Workspace,
    AssignmentGroup,
    AssignmentGroupMember,
    CabGroup,
)


class AssignmentGroupViewSet(BaseViewSet):
    """
    ViewSet for managing Assignment Groups at the workspace level.
    Now READ-ONLY from port 3000. Full CRUD is in God Mode.
    """
    serializer_class = AssignmentGroupSerializer
    model = AssignmentGroup
    permission_classes = [
        WorkSpaceBasePermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace")
            .prefetch_related("members")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug):
        groups = self.get_queryset()
        serializer = self.get_serializer(groups, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AssignmentGroupMemberViewSet(BaseViewSet):
    """
    ViewSet for managing members of an Assignment Group.
    Now READ-ONLY from port 3000. Full CRUD is in God Mode.
    """
    serializer_class = AssignmentGroupMemberSerializer
    model = AssignmentGroupMember
    permission_classes = [
        WorkSpaceBasePermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(
                assignment_group_id=self.kwargs.get("group_id"),
                assignment_group__workspace__slug=self.kwargs.get("slug"),
            )
            .select_related("member", "assignment_group")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug, group_id):
        members = self.get_queryset()
        serializer = self.get_serializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CabGroupViewSet(BaseViewSet):
    """
    Read-only ViewSet for CAB Groups at the workspace level.
    Full CRUD is in God Mode.
    """
    serializer_class = CabGroupSerializer
    model = CabGroup
    permission_classes = [
        WorkSpaceBasePermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace")
            .prefetch_related("group_members__member")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug):
        groups = self.get_queryset()
        serializer = self.get_serializer(groups, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

