# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
from datetime import datetime

# Third party imports
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.db.models import Module, Project, Workspace
from plane.license.api.permissions import InstanceAdminPermission

logger = logging.getLogger(__name__)

MAX_MODULES = 100
VALID_STATUSES = {"backlog", "planned", "in-progress", "paused", "completed", "cancelled"}


def _parse_date(val):
    """Parse ISO YYYY-MM-DD string to date; return None on failure."""
    if not val:
        return None
    try:
        return datetime.strptime(str(val).strip(), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def _parse_status(val):
    """Return val if it's a valid Module status, else 'planned'."""
    s = str(val or "").strip().lower()
    return s if s in VALID_STATUSES else "planned"


class InstanceWorkspaceModuleBulkImportEndpoint(BaseAPIView):
    """Bulk import modules into projects from JSON array.

    Accepts: POST { "modules": [{ "workspace_slug": str, "project_name": str,
                                  "name": str, "description"?: str, "status"?: str,
                                  "start_date"?: str, "target_date"?: str }] }
    Returns: { created, skipped, total_created, total_skipped }
    - Duplicate module name (case-sensitive) in same project → skipped
    - Invalid date format → null, row continues
    """

    permission_classes = [InstanceAdminPermission]

    def post(self, request):
        modules_data = request.data.get("modules", None)

        if not isinstance(modules_data, list):
            return Response(
                {"error": "Request body must contain a 'modules' list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(modules_data) == 0:
            return Response(
                {"error": "The 'modules' list must not be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(modules_data) > MAX_MODULES:
            return Response(
                {"error": f"Too many modules. Maximum allowed per request is {MAX_MODULES}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace_cache = {}   # slug → Workspace | None
        project_cache = {}     # "slug:project_name" → Project | None

        created = []
        skipped = []

        for row_number, item in enumerate(modules_data, start=1):
            workspace_slug = str(item.get("workspace_slug") or "").strip()
            project_name = str(item.get("project_name") or "").strip()
            name = str(item.get("name") or "").strip()

            # Validate workspace_slug
            if not workspace_slug:
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": "",
                    "project_name": project_name,
                    "name": name,
                    "reason": "workspace_slug is required",
                })
                continue

            # Resolve workspace (cache per slug)
            if workspace_slug not in workspace_cache:
                try:
                    workspace_cache[workspace_slug] = Workspace.objects.get(slug=workspace_slug)
                except Workspace.DoesNotExist:
                    workspace_cache[workspace_slug] = None

            workspace = workspace_cache[workspace_slug]
            if workspace is None:
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "project_name": project_name,
                    "name": name,
                    "reason": f"Workspace '{workspace_slug}' not found",
                })
                continue

            # Validate project_name
            if not project_name:
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "project_name": "",
                    "name": name,
                    "reason": "project_name is required",
                })
                continue

            # Resolve project by name (cache by "slug:project_name")
            cache_key = f"{workspace_slug}:{project_name}"
            if cache_key not in project_cache:
                project_cache[cache_key] = Project.objects.filter(
                    name=project_name, workspace=workspace, deleted_at__isnull=True
                ).first()

            project = project_cache[cache_key]
            if project is None:
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "project_name": project_name,
                    "name": name,
                    "reason": f"Project '{project_name}' not found in workspace '{workspace_slug}'",
                })
                continue

            # Validate name
            if not name:
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "project_name": project_name,
                    "name": "",
                    "reason": "name is required",
                })
                continue
            if len(name) > 255:
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "project_name": project_name,
                    "name": name,
                    "reason": "name exceeds 255 characters",
                })
                continue

            # Duplicate check (soft-delete aware, case-sensitive)
            if Module.objects.filter(name=name, project=project, deleted_at__isnull=True).exists():
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "project_name": project_name,
                    "name": name,
                    "reason": "Module name already exists in this project",
                })
                continue

            # Parse dates (fail-safe — invalid date → None, row continues)
            start_date = _parse_date(item.get("start_date"))
            target_date = _parse_date(item.get("target_date"))

            try:
                Module.objects.create(
                    name=name,
                    description=str(item.get("description") or "").strip(),
                    start_date=start_date,
                    target_date=target_date,
                    status=_parse_status(item.get("status")),
                    project=project,
                    workspace=workspace,
                    created_by=request.user,
                    updated_by=request.user,
                )
                created.append({
                    "workspace_slug": workspace_slug,
                    "project_name": project_name,
                    "name": name,
                })
            except IntegrityError:
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "project_name": project_name,
                    "name": name,
                    "reason": "Module name already exists in this project (concurrent creation)",
                })
            except Exception:
                logger.exception(
                    "Module bulk import failed for row %s (name=%r, project=%r, workspace=%r)",
                    row_number, name, project_name, workspace_slug,
                )
                skipped.append({
                    "row_number": row_number,
                    "workspace_slug": workspace_slug,
                    "project_name": project_name,
                    "name": name,
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
