# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import logging
import re

from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.db.models import User, Workspace, WorkspaceMember
from plane.license.api.permissions import InstanceAdminPermission

logger = logging.getLogger(__name__)

MAX_ROWS = 500
VALID_ROLES = {5, 15, 20}
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


class InstanceWorkspaceBulkAssignMembersEndpoint(BaseAPIView):
    """Bulk assign existing users to workspaces.

    Accepts: POST { "members": [{ "email": str, "workspace_slug": str, "role": int }] }
    Returns: { assigned, skipped, total_assigned, total_skipped }
    Valid roles: 5 (Guest), 15 (Member), 20 (Admin).
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

        assigned = []
        skipped = []

        for row_number, item in enumerate(members_data, start=1):
            email = str(item.get("email") or "").strip().lower()
            workspace_slug = str(item.get("workspace_slug") or "").strip()
            role = item.get("role", 15)

            # Validate email
            if not email or not EMAIL_REGEX.match(email):
                skipped.append({
                    "row_number": row_number,
                    "email": email,
                    "workspace_slug": workspace_slug,
                    "reason": "Invalid or missing email",
                })
                continue

            # Validate workspace_slug
            if not workspace_slug:
                skipped.append({
                    "row_number": row_number,
                    "email": email,
                    "workspace_slug": workspace_slug,
                    "reason": "Missing workspace_slug",
                })
                continue

            # Validate role
            try:
                role = int(role)
            except (TypeError, ValueError):
                skipped.append({
                    "row_number": row_number,
                    "email": email,
                    "workspace_slug": workspace_slug,
                    "reason": "Invalid role — must be 5, 15, or 20",
                })
                continue
            if role not in VALID_ROLES:
                skipped.append({
                    "row_number": row_number,
                    "email": email,
                    "workspace_slug": workspace_slug,
                    "reason": f"Invalid role {role} — must be 5 (Guest), 15 (Member), or 20 (Admin)",
                })
                continue

            # Lookup user
            user = User.objects.filter(email=email).first()
            if not user:
                skipped.append({
                    "row_number": row_number,
                    "email": email,
                    "workspace_slug": workspace_slug,
                    "reason": "User not found",
                })
                continue

            # Lookup workspace
            workspace = Workspace.objects.filter(slug=workspace_slug).first()
            if not workspace:
                skipped.append({
                    "row_number": row_number,
                    "email": email,
                    "workspace_slug": workspace_slug,
                    "reason": "Workspace not found",
                })
                continue

            # Check existing membership (active only)
            if WorkspaceMember.objects.filter(
                workspace=workspace, member=user, deleted_at__isnull=True
            ).exists():
                skipped.append({
                    "row_number": row_number,
                    "email": email,
                    "workspace_slug": workspace_slug,
                    "reason": "User already a member of this workspace",
                })
                continue

            try:
                with transaction.atomic():
                    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
                assigned.append({"email": email, "workspace_slug": workspace_slug, "role": role})
            except IntegrityError:
                skipped.append({
                    "row_number": row_number,
                    "email": email,
                    "workspace_slug": workspace_slug,
                    "reason": "Already a member (concurrent assignment)",
                })
            except Exception:
                logger.exception(
                    "Bulk assign failed for row %s (email=%r, slug=%r)",
                    row_number, email, workspace_slug,
                )
                skipped.append({
                    "row_number": row_number,
                    "email": email,
                    "workspace_slug": workspace_slug,
                    "reason": "Unexpected error — see server logs",
                })

        return Response(
            {
                "assigned": assigned,
                "skipped": skipped,
                "total_assigned": len(assigned),
                "total_skipped": len(skipped),
            },
            status=status.HTTP_200_OK,
        )
