# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§7.3 — workflow type-assignment endpoints.

Workflow per ``(project, issue_type)`` so admins can override the
default workflow for a specific Work Item Type (§8 step 3a).
"""

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    WorkflowTypeAssignmentReadSerializer,
    WorkflowTypeAssignmentWriteSerializer,
)
from plane.app.views import BaseAPIView
from plane.db.models import WorkflowTypeAssignment


class WorkflowTypeAssignmentListEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        qs = WorkflowTypeAssignment.objects.filter(project_id=project_id)
        return Response(
            WorkflowTypeAssignmentReadSerializer(qs, many=True).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id):
        serializer = WorkflowTypeAssignmentWriteSerializer(
            data=request.data,
            context={"project_id": project_id},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        assignment = serializer.save()
        return Response(
            WorkflowTypeAssignmentReadSerializer(assignment).data,
            status=status.HTTP_201_CREATED,
        )


class WorkflowTypeAssignmentDetailEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN])
    def delete(self, request, slug, project_id, assignment_id):
        assignment = WorkflowTypeAssignment.objects.filter(
            project_id=project_id, pk=assignment_id
        ).first()
        if assignment is None:
            return Response(
                {"error": "Workflow type assignment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        assignment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
