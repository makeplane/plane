# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§17.2 — workflow state inclusion CRUD on a draft revision."""

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    WorkflowStateReadSerializer,
    WorkflowStateUpdateSerializer,
    WorkflowStateWriteSerializer,
)
from plane.app.views import BaseAPIView
from plane.db.models import (
    WorkflowRevision,
    WorkflowRevisionStatus,
    WorkflowState,
)
from plane.services.workflow.errors import WorkflowRevisionNotDraft


def _get_draft_revision(project_id, revision_id) -> WorkflowRevision | None:
    return (
        WorkflowRevision.objects.filter(project_id=project_id, pk=revision_id)
        .filter(status=WorkflowRevisionStatus.DRAFT)
        .first()
    )


class WorkflowRevisionStateListEndpoint(BaseAPIView):
    """§17.2 — ``POST`` include a state in a draft revision."""

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id, revision_id):
        revision = _get_draft_revision(project_id, revision_id)
        if revision is None:
            raise WorkflowRevisionNotDraft(
                "Revision not found or not in draft state."
            )
        serializer = WorkflowStateWriteSerializer(
            data=request.data, context={"revision": revision}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        ws = serializer.save(
            project_id=project_id,
            created_by_id=request.user.id,
            updated_by_id=request.user.id,
        )
        return Response(
            WorkflowStateReadSerializer(ws).data, status=status.HTTP_201_CREATED
        )


class WorkflowRevisionStateDetailEndpoint(BaseAPIView):
    """§17.2 — ``PATCH``/``DELETE`` a single state inclusion."""

    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id, revision_id, state_id):
        revision = _get_draft_revision(project_id, revision_id)
        if revision is None:
            raise WorkflowRevisionNotDraft(
                "Revision not found or not in draft state."
            )
        ws = (
            WorkflowState.objects.filter(
                project_id=project_id, revision=revision, pk=state_id
            ).first()
        )
        if ws is None:
            return Response(
                {"error": "Workflow state inclusion not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = WorkflowStateUpdateSerializer(
            ws,
            data=request.data,
            partial=True,
            context={"revision": revision},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(updated_by_id=request.user.id)
        return Response(
            WorkflowStateReadSerializer(ws).data, status=status.HTTP_200_OK
        )

    @allow_permission([ROLE.ADMIN])
    def delete(self, request, slug, project_id, revision_id, state_id):
        revision = _get_draft_revision(project_id, revision_id)
        if revision is None:
            raise WorkflowRevisionNotDraft(
                "Revision not found or not in draft state."
            )
        ws = (
            WorkflowState.objects.filter(
                project_id=project_id, revision=revision, pk=state_id
            ).first()
        )
        if ws is None:
            return Response(
                {"error": "Workflow state inclusion not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        ws.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
