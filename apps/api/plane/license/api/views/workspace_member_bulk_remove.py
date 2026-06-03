# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import logging
import re

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.db.models import Project, ProjectMember, User, Workspace, WorkspaceMember
from plane.license.api.permissions import InstanceAdminPermission

logger = logging.getLogger(__name__)

MAX_ROWS = 500
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


class InstanceWorkspaceBulkRemoveMembersEndpoint(BaseAPIView):
    """Bulk remove existing members from workspaces (soft-delete).

    Accepts: POST { "members": [{ "workspace_slug": str, "email": str }] }
    Returns: { removed, skipped, total_removed, total_skipped }
    Skips rows where the user is the sole admin of any project in the workspace.
    """

    permission_classes = [InstanceAdminPermission]

    def post(self, request):
        members_data = request.data.get("members", None)

        if not isinstance(members_data, list):
            return Response(
                {"error": "Request body must contain a 'members' list."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(members_data) == 0:
            return Response(
                {"error": "The 'members' list must not be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(members_data) > MAX_ROWS:
            return Response(
                {"error": f"Too many rows. Maximum allowed per request is {MAX_ROWS}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        removed = []
        skipped = []

        for row_number, item in enumerate(members_data, start=1):
            workspace_slug = str(item.get("workspace_slug") or "").strip()
            email = str(item.get("email") or "").strip().lower()

            if not workspace_slug:
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "email": email,
                    "reason": "Missing workspace_slug",
                })
                continue

            if not email or not EMAIL_REGEX.match(email):
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "email": email,
                    "reason": "Invalid or missing email",
                })
                continue

            workspace = Workspace.objects.filter(slug=workspace_slug).first()
            if not workspace:
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "email": email,
                    "reason": "Workspace not found",
                })
                continue

            user = User.objects.filter(email=email).first()
            if not user:
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "email": email,
                    "reason": "User not found",
                })
                continue

            workspace_member = WorkspaceMember.objects.filter(
                workspace=workspace, member=user, is_active=True
            ).first()
            if not workspace_member:
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "email": email,
                    "reason": "User is not an active member of this workspace",
                })
                continue

            # Hard-skip if user is sole admin of any project in this workspace
            is_sole_project_admin = (
                Project.objects.filter(workspace=workspace)
                .annotate(
                    admin_count=Count(
                        "project_projectmember",
                        filter=Q(project_projectmember__role=20, project_projectmember__is_active=True),
                    ),
                    user_is_admin=Count(
                        "project_projectmember",
                        filter=Q(
                            project_projectmember__member=user,
                            project_projectmember__role=20,
                            project_projectmember__is_active=True,
                        ),
                    ),
                )
                .filter(admin_count=1, user_is_admin=1)
                .exists()
            )
            if is_sole_project_admin:
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "email": email,
                    "reason": "User is the sole admin of one or more projects in this workspace",
                })
                continue

            try:
                with transaction.atomic():
                    ProjectMember.objects.filter(
                        workspace=workspace, member=user, is_active=True
                    ).update(is_active=False, updated_at=timezone.now())
                    workspace_member.is_active = False
                    workspace_member.save()
                removed.append({"workspace_slug": workspace_slug, "email": email})
            except Exception:
                logger.exception(
                    "Bulk remove failed for row %s (email=%r, slug=%r)",
                    row_number, email, workspace_slug,
                )
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "email": email,
                    "reason": "Unexpected error — see server logs",
                })

        return Response(
            {
                "removed": removed,
                "skipped": skipped,
                "total_removed": len(removed),
                "total_skipped": len(skipped),
            },
            status=status.HTTP_200_OK,
        )
