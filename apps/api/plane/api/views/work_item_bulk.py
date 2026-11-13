# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""REST v1 bulk update of work items.

``POST /api/v1/workspaces/<slug>/projects/<project_id>/work-items/bulk-update/``

Body: ``{"work_item_ids": [...], "state": <id>, "priority": <str>, "labels": [...], "assignees": [...],
"cycle": <id or null>}``, at least one change. ``labels`` and ``assignees`` are added to the existing ones. At most
500 work items per call. One transaction (all or nothing), activity recorded per work item.
Answer 200 ``{"updated": [ids], "unchanged": [ids]}``; invalid input is 400 and nothing changes.
"""

# Third party imports
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, OpenApiTypes
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Project
from plane.utils.host import base_host
from plane.utils.openapi import work_item_docs
from plane.utils.work_item_bulk_update import SUPPORTED_CHANGES, BulkUpdateError, bulk_update_work_items

from .base import BaseAPIView


class WorkItemBulkUpdateAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @work_item_docs(
        operation_id="bulk_update_work_items",
        summary="Bulk update work items",
        description=(
            "Update up to 500 work items of a project at once: state, priority, cycle (null removes), and labels or "
            "assignees to add. Runs in one transaction (all or nothing); activity is recorded per work item."
        ),
        request=OpenApiTypes.OBJECT,
        examples=[
            OpenApiExample(
                "Move to a state",
                value={
                    "work_item_ids": ["5f1c...", "9a2b..."],
                    "state": "1d7e...",
                },
                request_only=True,
            )
        ],
        responses={
            200: OpenApiResponse(description="Work items updated"),
            400: OpenApiResponse(description="Invalid input; nothing was changed"),
        },
    )
    def post(self, request, slug, project_id):
        if not isinstance(request.data, dict):
            return Response({"non_field_errors": ["Expected an object."]}, status=status.HTTP_400_BAD_REQUEST)
        unknown = sorted(set(request.data) - set(SUPPORTED_CHANGES) - {"work_item_ids"})
        if unknown:
            return Response({"non_field_errors": [f"Unknown fields: {unknown}"]}, status=status.HTTP_400_BAD_REQUEST)
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        changes = {key: request.data[key] for key in SUPPORTED_CHANGES if key in request.data}
        try:
            result = bulk_update_work_items(
                project,
                request.data.get("work_item_ids"),
                changes,
                actor_id=request.user.id,
                origin=base_host(request=request, is_app=True),
            )
        except BulkUpdateError as e:
            return Response(e.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)
