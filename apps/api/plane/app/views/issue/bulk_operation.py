# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""``bulk-operation-issues/``: the endpoint the web client's ``bulkOperations`` already calls.

Payload ``{"issue_ids": [...], "properties": {...}}`` (``TBulkOperationsPayload``). Supported properties: ``state_id``,
``priority``, ``label_ids`` and ``assignee_ids`` (added to the existing ones, as the web store applies them) and
``cycle_id`` (``null`` removes). Other properties are 400. See ``plane.utils.work_item_bulk_update``.
"""

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Project
from plane.utils.host import base_host
from plane.utils.work_item_bulk_update import BulkUpdateError, bulk_update_work_items

PROPERTY_TO_CHANGE = {
    "state_id": "state",
    "priority": "priority",
    "label_ids": "labels",
    "assignee_ids": "assignees",
    "cycle_id": "cycle",
}


class BulkOperationIssuesEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        properties = request.data.get("properties")
        if not isinstance(properties, dict):
            return Response({"properties": ["Expected an object."]}, status=status.HTTP_400_BAD_REQUEST)
        unsupported = sorted(set(properties) - set(PROPERTY_TO_CHANGE))
        if unsupported:
            return Response(
                {"properties": [f"Unsupported properties: {unsupported}"]}, status=status.HTTP_400_BAD_REQUEST
            )
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        changes = {PROPERTY_TO_CHANGE[key]: value for key, value in properties.items()}
        try:
            result = bulk_update_work_items(
                project,
                request.data.get("issue_ids"),
                changes,
                actor_id=request.user.id,
                origin=base_host(request=request, is_app=True),
            )
        except BulkUpdateError as e:
            return Response(e.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)
