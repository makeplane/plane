# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Internal addition (not part of upstream makeplane/plane): lets a project admin
# email the project's current custom field data to selected project members.

# Third-party imports
from rest_framework import status
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.bgtasks.project_custom_field_data_email_task import send_project_custom_field_data_email
from plane.db.models import ProjectMember
from plane.throttles.project_custom_field_email import ProjectCustomFieldDataEmailThrottle
from plane.utils.host import base_host
from .base import BaseAPIView

# A hard cap on how many recipients one request may target, independent of how
# many real project members exist: without this, an oversized recipient_ids
# payload (garbage or duplicate UUIDs) still costs a large SQL IN-clause
# evaluation before any of it is validated against real membership.
MAX_RECIPIENTS = 100


class ProjectCustomFieldDataEmailAccessPermission(BasePermission):
    """Deliberately not shared with ProjectCustomFieldAccessPermission (project_custom_field.py):
    that class governs in-app read/write access to custom field data, while this one governs
    pushing that same data outside the app via email. Keeping them separate means a future
    change to one (e.g. loosening in-app GET access) can never silently loosen the other."""

    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False
        return ProjectMember.objects.filter(
            workspace__slug=view.workspace_slug,
            member=request.user,
            project_id=view.project_id,
            role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
            is_active=True,
        ).exists()


class ProjectCustomFieldDataEmailEndpoint(BaseAPIView):
    permission_classes = [ProjectCustomFieldDataEmailAccessPermission]
    throttle_classes = [ProjectCustomFieldDataEmailThrottle]

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id):
        recipient_ids = request.data.get("recipient_ids", [])
        if not isinstance(recipient_ids, list) or not recipient_ids:
            return Response({"error": "recipient_ids is required"}, status=status.HTTP_400_BAD_REQUEST)
        if len(recipient_ids) > MAX_RECIPIENTS:
            return Response(
                {"error": f"recipient_ids must not contain more than {MAX_RECIPIENTS} entries"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only send to users who are actually active members of this project:
        # never trust recipient ids as supplied by the client.
        valid_recipient_ids = list(
            ProjectMember.objects.filter(
                workspace__slug=slug, project_id=project_id, member_id__in=recipient_ids, is_active=True
            ).values_list("member_id", flat=True)
        )
        if not valid_recipient_ids:
            return Response(
                {"error": "None of the given recipients are active members of this project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        send_project_custom_field_data_email.delay(
            base_host(request=request, is_app=True), project_id, valid_recipient_ids, request.user.id
        )
        return Response({"queued": len(valid_recipient_ids)}, status=status.HTTP_202_ACCEPTED)
