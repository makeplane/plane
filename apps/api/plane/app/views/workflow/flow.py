# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§17.2 — workflow flow + actor CRUD on a draft revision."""

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    WorkflowFlowActorReadSerializer,
    WorkflowFlowActorWriteSerializer,
    WorkflowFlowReadSerializer,
    WorkflowFlowUpdateSerializer,
    WorkflowFlowWriteSerializer,
)
from plane.app.views import BaseAPIView
from plane.db.models import (
    WorkflowFlow,
    WorkflowFlowActor,
    WorkflowRevision,
    WorkflowRevisionStatus,
)
from plane.services.workflow.errors import WorkflowRevisionNotDraft


def _get_draft_revision(project_id, revision_id) -> WorkflowRevision | None:
    return (
        WorkflowRevision.objects.filter(project_id=project_id, pk=revision_id)
        .filter(status=WorkflowRevisionStatus.DRAFT)
        .first()
    )


class WorkflowRevisionFlowListEndpoint(BaseAPIView):
    """§17.2 — ``POST`` create a flow on a draft revision."""

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id, revision_id):
        revision = _get_draft_revision(project_id, revision_id)
        if revision is None:
            raise WorkflowRevisionNotDraft(
                "Revision not found or not in draft state."
            )
        serializer = WorkflowFlowWriteSerializer(
            data=request.data, context={"revision": revision}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        flow = serializer.save(
            project_id=project_id,
            created_by_id=request.user.id,
            updated_by_id=request.user.id,
        )
        return Response(
            WorkflowFlowReadSerializer(flow).data, status=status.HTTP_201_CREATED
        )


class WorkflowRevisionFlowDetailEndpoint(BaseAPIView):
    """§17.2 — ``PATCH``/``DELETE`` a flow on a draft revision."""

    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id, revision_id, flow_id):
        revision = _get_draft_revision(project_id, revision_id)
        if revision is None:
            raise WorkflowRevisionNotDraft(
                "Revision not found or not in draft state."
            )
        flow = (
            WorkflowFlow.objects.filter(
                project_id=project_id, revision=revision, pk=flow_id
            )
            .first()
        )
        if flow is None:
            return Response(
                {"error": "Workflow flow not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = WorkflowFlowUpdateSerializer(
            flow,
            data=request.data,
            partial=True,
            context={"revision": revision},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(updated_by_id=request.user.id)
        return Response(
            WorkflowFlowReadSerializer(flow).data, status=status.HTTP_200_OK
        )

    @allow_permission([ROLE.ADMIN])
    def delete(self, request, slug, project_id, revision_id, flow_id):
        revision = _get_draft_revision(project_id, revision_id)
        if revision is None:
            raise WorkflowRevisionNotDraft(
                "Revision not found or not in draft state."
            )
        flow = (
            WorkflowFlow.objects.filter(
                project_id=project_id, revision=revision, pk=flow_id
            )
            .first()
        )
        if flow is None:
            return Response(
                {"error": "Workflow flow not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        flow.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkflowFlowActorListEndpoint(BaseAPIView):
    """§17.2 — actor CRUD on a flow."""

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id, revision_id, flow_id):
        revision = _get_draft_revision(project_id, revision_id)
        if revision is None:
            raise WorkflowRevisionNotDraft(
                "Revision not found or not in draft state."
            )
        flow = (
            WorkflowFlow.objects.filter(
                project_id=project_id, revision=revision, pk=flow_id
            ).first()
        )
        if flow is None:
            return Response(
                {"error": "Workflow flow not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = WorkflowFlowActorWriteSerializer(
            data=request.data, context={"flow": flow}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        actor = serializer.save(
            flow=flow,
            project_id=project_id,
            created_by_id=request.user.id,
            updated_by_id=request.user.id,
        )
        return Response(
            WorkflowFlowActorReadSerializer(actor).data,
            status=status.HTTP_201_CREATED,
        )


class WorkflowFlowActorDetailEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id, revision_id, flow_id, actor_id):
        revision = _get_draft_revision(project_id, revision_id)
        if revision is None:
            raise WorkflowRevisionNotDraft(
                "Revision not found or not in draft state."
            )
        actor = (
            WorkflowFlowActor.objects.filter(
                project_id=project_id,
                flow_id=flow_id,
                flow__revision=revision,
                pk=actor_id,
            ).first()
        )
        if actor is None:
            return Response(
                {"error": "Workflow flow actor not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = WorkflowFlowActorWriteSerializer(
            actor,
            data=request.data,
            partial=True,
            context={"flow": actor.flow},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(updated_by_id=request.user.id)
        return Response(
            WorkflowFlowActorReadSerializer(actor).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN])
    def delete(self, request, slug, project_id, revision_id, flow_id, actor_id):
        revision = _get_draft_revision(project_id, revision_id)
        if revision is None:
            raise WorkflowRevisionNotDraft(
                "Revision not found or not in draft state."
            )
        actor = (
            WorkflowFlowActor.objects.filter(
                project_id=project_id,
                flow_id=flow_id,
                flow__revision=revision,
                pk=actor_id,
            ).first()
        )
        if actor is None:
            return Response(
                {"error": "Workflow flow actor not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        actor.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
