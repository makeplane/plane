# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Q
from rest_framework import serializers, status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers.base import DynamicBaseSerializer
from plane.app.views.base import BaseAPIView
from plane.app.views.ho import _get_all_descendant_dept_ids, _is_instance_admin
from plane.db.models import Department, Project, ProjectMember, StaffProfile, WorkspaceMember


class BankWideProjectSerializer(DynamicBaseSerializer):
    """Lean serializer for cross-workspace bank-wide project list."""

    workspace_slug = serializers.SerializerMethodField()
    workspace_name = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    def get_workspace_slug(self, obj):
        return obj.workspace.slug

    def get_workspace_name(self, obj):
        return obj.workspace.name

    def get_member_count(self, obj):
        return obj.project_projectmember.filter(is_active=True).count()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "identifier",
            "logo_props",
            "cover_image",
            "cover_image_url",
            "description",
            "network",
            "is_bank_wide",
            "created_at",
            "archived_at",
            "member_count",
            "workspace_slug",
            "workspace_name",
        ]


class WorkspaceBankWideProjectsEndpoint(BaseAPIView):
    """
    Returns bank-wide projects visible to the requesting user.

    Visibility rules:
    - Instance admin: all bank-wide projects across all workspaces.
    - Department manager: all bank-wide projects in workspaces linked to
      their managed departments and every descendant department (dept tree).
    - Workspace admin (non-dept-manager): bank-wide projects they are a
      project member of, plus all bank-wide projects in workspaces where
      they hold the Admin role.
    - Regular member (non-dept-manager, non-workspace-admin): only
      bank-wide projects they are a project member of.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        show_archived = request.query_params.get("show_archived", "false") == "true"
        archived_filter = {"archived_at__isnull": not show_archived}

        base_qs = (
            Project.objects
            .select_related("workspace")
            .prefetch_related("project_projectmember")
            .order_by("workspace__name", "name")
        )

        # Instance admin → all bank-wide projects
        if _is_instance_admin(request.user):
            projects = base_qs.filter(is_bank_wide=True, **archived_filter)
            return Response(BankWideProjectSerializer(projects, many=True).data, status=status.HTTP_200_OK)

        user = request.user

        # Department manager: see all bank-wide projects in managed dept-tree workspaces
        managed_dept_ids = [
            d for d in StaffProfile.objects.filter(
                user=user,
                is_department_manager=True,
                deleted_at__isnull=True,
            ).values_list("department_id", flat=True)
            if d
        ]

        if managed_dept_ids:
            all_dept_ids = []
            for dept_id in managed_dept_ids:
                all_dept_ids.extend(_get_all_descendant_dept_ids(dept_id))

            dept_ws_ids = Department.objects.filter(
                id__in=all_dept_ids,
                linked_workspace__isnull=False,
                deleted_at__isnull=True,
            ).values_list("linked_workspace_id", flat=True)

            projects = base_qs.filter(
                is_bank_wide=True,
                workspace_id__in=dept_ws_ids,
                **archived_filter,
            )
            return Response(BankWideProjectSerializer(projects, many=True).data, status=status.HTTP_200_OK)

        # Non-dept-manager: always include projects the user is a member of
        joined_project_ids = ProjectMember.objects.filter(
            member=user,
            is_active=True,
        ).values_list("project_id", flat=True)

        # Workspace admins additionally see all bank-wide projects in their admin workspaces
        admin_ws_ids = WorkspaceMember.objects.filter(
            member=user,
            role=ROLE.ADMIN.value,
            deleted_at__isnull=True,
        ).values_list("workspace_id", flat=True)

        projects = base_qs.filter(
            is_bank_wide=True,
            **archived_filter,
        ).filter(
            Q(id__in=joined_project_ids) | Q(workspace_id__in=admin_ws_ids)
        )

        return Response(BankWideProjectSerializer(projects, many=True).data, status=status.HTTP_200_OK)
