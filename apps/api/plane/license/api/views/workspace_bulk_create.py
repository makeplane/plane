# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging

# Third party imports
from django.db import IntegrityError, transaction
from django.utils.text import slugify
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace, WorkspaceMember
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.serializers import WorkspaceSerializer
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS

logger = logging.getLogger(__name__)

MAX_WORKSPACES = 200


def _generate_unique_slug(name, existing_slugs):
    """Auto-generate a unique slug from workspace name.

    Appends numeric suffix (-1, -2, ...) on collision.
    Returns None if name slugifies to empty string.
    existing_slugs must be a lowercase-normalized set.
    """
    base = slugify(name)[:48]
    if not base:
        return None
    candidate = base
    counter = 1
    while candidate.lower() in existing_slugs or candidate in RESTRICTED_WORKSPACE_SLUGS:
        suffix = f"-{counter}"
        candidate = base[: 48 - len(suffix)] + suffix
        counter += 1
    return candidate


class InstanceWorkspaceBulkCreateEndpoint(BaseAPIView):
    """Bulk create workspaces from JSON array.

    Accepts: POST { "workspaces": [{ "name": str, "organization_size"?: str }, ...] }
    Returns: { created, skipped, total_created, total_skipped }
    Skips invalid rows with reason; creates valid ones with auto-generated slug.
    """

    permission_classes = [InstanceAdminPermission]

    def post(self, request):
        workspaces_data = request.data.get("workspaces", None)

        if not isinstance(workspaces_data, list):
            return Response(
                {"error": "Request body must contain a 'workspaces' list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(workspaces_data) == 0:
            return Response(
                {"error": "The 'workspaces' list must not be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(workspaces_data) > MAX_WORKSPACES:
            return Response(
                {"error": f"Too many workspaces. Maximum allowed per request is {MAX_WORKSPACES}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Pre-fetch all existing slugs, normalized to lowercase for case-insensitive uniqueness
        existing_slugs = set(s.lower() for s in Workspace.objects.values_list("slug", flat=True))

        created = []
        skipped = []

        for row_number, item in enumerate(workspaces_data, start=1):
            name = str(item.get("name") or "").strip()
            organization_size = str(item.get("organization_size") or "").strip()

            # Validate name
            if not name:
                skipped.append({"row_number": row_number, "name": name, "slug": "", "reason": "Name is required"})
                continue
            if len(name) > 80:
                skipped.append({
                    "row_number": row_number,
                    "name": name,
                    "slug": "",
                    "reason": "Name exceeds 80 characters",
                })
                continue

            # Auto-generate slug
            slug = _generate_unique_slug(name, existing_slugs)
            if not slug:
                skipped.append({
                    "row_number": row_number,
                    "name": name,
                    "slug": "",
                    "reason": "Name produces an empty slug (only special characters)",
                })
                continue

            try:
                # Atomic: workspace + membership must both succeed or both roll back
                with transaction.atomic():
                    workspace = Workspace.objects.create(
                        name=name,
                        slug=slug,
                        organization_size=organization_size,
                        owner=request.user,
                    )
                    WorkspaceMember.objects.create(
                        workspace=workspace,
                        member=request.user,
                        role=20,
                    )
                # Track newly created slug to prevent intra-batch duplicates
                existing_slugs.add(slug.lower())
                created.append(WorkspaceSerializer(workspace).data)
            except IntegrityError:
                skipped.append({
                    "row_number": row_number,
                    "name": name,
                    "slug": slug,
                    "reason": "Workspace slug already exists (concurrent creation)",
                })
            except Exception:
                logger.exception(
                    "Workspace bulk create failed for row %s (name=%r)",
                    row_number, name,
                )
                skipped.append({
                    "row_number": row_number,
                    "name": name,
                    "slug": slug,
                    "reason": "Unexpected error — see server logs",
                })

        return Response(
            {
                "created": created,
                "skipped": skipped,
                "total_created": len(created),
                "total_skipped": len(skipped),
            },
            status=status.HTTP_200_OK,
        )
