# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import CopilotMemorySerializer, CopilotMemoryUpdateSerializer
from plane.db.models import CopilotMemory, CopilotSession

from ..base import BaseViewSet
from .base import is_entity_accessible


class CopilotMemoryViewSet(BaseViewSet):
    model = CopilotMemory
    serializer_class = CopilotMemorySerializer

    def _get_session(self):
        return (
            CopilotSession.objects.filter(
                id=self.kwargs.get("session_id"),
                workspace__slug=self.workspace_slug,
                project_id=self.project_id,
            )
            .prefetch_related("memories")
            .first()
        )

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                session_id=self.kwargs.get("session_id"),
                session__workspace__slug=self.workspace_slug,
                session__project_id=self.project_id,
            )
        )

    def _check_entity_access(self, request, session):
        if not is_entity_accessible(
            request.user, session.workspace.slug, session.project_id, session.entity_type, session.entity_id
        ):
            return Response({"error": "The required object does not exist."}, status=status.HTTP_404_NOT_FOUND)
        return None

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def list(self, request, slug, project_id, session_id):
        session = self._get_session()
        if session is None:
            return Response({"error": "The required object does not exist."}, status=status.HTTP_404_NOT_FOUND)

        access_error = self._check_entity_access(request, session)
        if access_error:
            return access_error

        return Response(CopilotMemorySerializer(session.memories, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, project_id, session_id, pk):
        memory = self.get_queryset().filter(pk=pk).first()
        if memory is None:
            return Response({"error": "The required object does not exist."}, status=status.HTTP_404_NOT_FOUND)

        access_error = self._check_entity_access(request, memory.session)
        if access_error:
            return access_error

        payload = CopilotMemoryUpdateSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        memory.content = payload.validated_data["content"]
        memory.save(update_fields=["content", "updated_at"])

        return Response(CopilotMemorySerializer(memory).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, session_id, pk):
        memory = self.get_queryset().filter(pk=pk).first()
        if memory is None:
            return Response({"error": "The required object does not exist."}, status=status.HTTP_404_NOT_FOUND)

        access_error = self._check_entity_access(request, memory.session)
        if access_error:
            return access_error

        memory.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
