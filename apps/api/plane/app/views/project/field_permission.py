# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers.project_field_permission import ProjectFieldPermissionSerializer
from plane.db.models import Project, ProjectFieldPermission, ProjectMember, WorkspaceMember

from ..base import BaseViewSet


class ProjectFieldPermissionViewSet(BaseViewSet):
    """
    GET   /workspaces/<slug>/projects/<project_id>/field-permissions/  → retrieve (lazy-created)
    PATCH /workspaces/<slug>/projects/<project_id>/field-permissions/  → admin-only update
    """

    serializer_class = ProjectFieldPermissionSerializer
    model = ProjectFieldPermission

    def _get_or_create(self, slug: str, project_id: str) -> ProjectFieldPermission:
        project = Project.objects.select_related("workspace").get(
            pk=project_id, workspace__slug=slug
        )
        obj, _ = ProjectFieldPermission.objects.get_or_create(
            project=project,
            defaults={"workspace": project.workspace},
        )
        return obj

    def _is_project_or_workspace_admin(self, request, slug: str, project_id: str) -> bool:
        """Dual-level admin check: project admin OR workspace admin."""
        is_project_admin = ProjectMember.objects.filter(
            member=request.user,
            workspace__slug=slug,
            project_id=project_id,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists()
        if is_project_admin:
            return True

        return WorkspaceMember.objects.filter(
            member=request.user,
            workspace__slug=slug,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists()

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def retrieve(self, request, slug, project_id):
        obj = self._get_or_create(slug, project_id)
        serializer = ProjectFieldPermissionSerializer(obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def partial_update(self, request, slug, project_id):
        # Dual-level admin check (project admin OR workspace admin)
        if not self._is_project_or_workspace_admin(request, slug, project_id):
            return Response(
                {"error": "You don't have the required permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        obj = self._get_or_create(slug, project_id)
        old_values = {
            "allow_member_modify_completed_date": obj.allow_member_modify_completed_date,
            "allow_member_modify_target_date": obj.allow_member_modify_target_date,
            "allow_member_modify_start_date": obj.allow_member_modify_start_date,
            "allow_member_delete_work_item": obj.allow_member_delete_work_item,
        }

        serializer = ProjectFieldPermissionSerializer(obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        # Emit project activity for each toggled field
        self._log_toggle_activity(request, obj, old_values, serializer.data)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def _log_toggle_activity(self, request, obj, old_values: dict, new_data: dict) -> None:
        """Dispatch project activity entries for each toggled boolean."""
        from plane.bgtasks.webhook_task import model_activity
        from plane.utils.host import base_host

        changed_fields = {
            field: {"old": old_values[field], "new": new_data.get(field)}
            for field in old_values
            if field in new_data and old_values[field] != new_data.get(field)
        }

        if not changed_fields:
            return

        model_activity.delay(
            model_name="project_field_permission",
            model_id=str(obj.id),
            requested_data=changed_fields,
            current_instance={f: v["old"] for f, v in changed_fields.items()},
            actor_id=request.user.id,
            slug=request.parser_context["kwargs"].get("slug", ""),
            origin=base_host(request=request, is_app=True),
        )
