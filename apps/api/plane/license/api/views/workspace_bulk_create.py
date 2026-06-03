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
from plane.license.api.permissions import InstanceAdminMenuPermission
from plane.license.api.serializers import WorkspaceSerializer
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS
from plane.utils.general_director import (
    AmbiguousGeneralDirector,
    get_general_director_user,
)
from plane.utils.workspace_owner_resolver import (
    WorkspaceOwnerResolutionError,
    resolve_workspace_owner,
)

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

    permission_classes = [InstanceAdminMenuPermission]

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

        # Fail-fast: rows without owner_email default to the GD. If the GD
        # is unresolvable and any row relies on it, reject the whole batch
        # with one clear error instead of N identical per-row skips.
        rows_need_gd = any(not str(item.get("owner_email") or "").strip() for item in workspaces_data)
        default_owner = None
        if rows_need_gd:
            try:
                default_owner = get_general_director_user()
            except AmbiguousGeneralDirector:
                return Response(
                    {
                        "error": "Ambiguous General Director — multiple active staff hold "
                        "the GD grade. Fix staff data or provide owner_email per row."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if default_owner is None:
                return Response(
                    {"error": "No resolvable General Director — provide owner_email for every workspace row."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Pre-fetch all existing slugs, normalized to lowercase for case-insensitive uniqueness
        existing_slugs = set(s.lower() for s in Workspace.objects.values_list("slug", flat=True))

        created = []
        skipped = []

        for row_number, item in enumerate(workspaces_data, start=1):
            name = str(item.get("name") or "").strip()
            organization_size = str(item.get("organization_size") or "").strip()
            owner_email = str(item.get("owner_email") or "").strip()

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

            # Per-row owner: explicit owner_email wins, else the GD.
            # The acting instance admin is never an implicit owner/member.
            if owner_email:
                try:
                    owner = resolve_workspace_owner(owner_email=owner_email)
                except WorkspaceOwnerResolutionError as e:
                    skipped.append({
                        "row_number": row_number,
                        "name": name,
                        "slug": slug,
                        "reason": str(e),
                    })
                    continue
            else:
                owner = default_owner

            try:
                # Atomic: workspace + membership must both succeed or both roll back
                with transaction.atomic():
                    workspace = Workspace.objects.create(
                        name=name,
                        slug=slug,
                        organization_size=organization_size,
                        owner=owner,
                    )
                    WorkspaceMember.objects.create(
                        workspace=workspace,
                        member=owner,
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
