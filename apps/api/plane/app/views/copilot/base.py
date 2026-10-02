# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import CopilotSessionCreateSerializer, CopilotSessionSerializer
from plane.db.models import CopilotSession, Issue, Page
from plane.utils.copilot_constants import CopilotEntityType

from ..base import BaseViewSet

ENTITY_NOT_FOUND_ERROR = {"error": "The page or work item was not found."}


def is_entity_accessible(user, slug, project_id, entity_type, entity_id):
    """Check that the entity lives in the project of the URL and that the user may open it."""
    if entity_type == CopilotEntityType.PAGE:
        return (
            Page.objects.filter(
                id=entity_id,
                workspace__slug=slug,
                project_pages__project_id=project_id,
                project_pages__deleted_at__isnull=True,
            )
            .filter(Q(owned_by=user) | Q(access=Page.PUBLIC_ACCESS))
            .exists()
        )

    return Issue.objects.filter(id=entity_id, workspace__slug=slug, project_id=project_id, is_draft=False).exists()


class CopilotSessionViewSet(BaseViewSet):
    model = CopilotSession
    serializer_class = CopilotSessionSerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.workspace_slug, project_id=self.project_id)
            .prefetch_related("messages__tool_calls", "memories")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        payload = CopilotSessionCreateSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        entity_type = payload.validated_data["entity_type"]
        entity_id = payload.validated_data["entity_id"]

        if not is_entity_accessible(request.user, slug, project_id, entity_type, entity_id):
            return Response(ENTITY_NOT_FOUND_ERROR, status=status.HTTP_404_NOT_FOUND)

        session, created = CopilotSession.objects.get_or_create(
            entity_type=entity_type, entity_id=entity_id, defaults={"project_id": project_id}
        )
        # A page linked to several projects keeps the session of the project that opened it first.
        if session.project_id != project_id:
            return Response(ENTITY_NOT_FOUND_ERROR, status=status.HTTP_404_NOT_FOUND)

        return Response(
            CopilotSessionSerializer(session).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def retrieve(self, request, slug, project_id, pk):
        session = self.get_queryset().get(pk=pk)

        if not is_entity_accessible(request.user, slug, project_id, session.entity_type, session.entity_id):
            return Response(ENTITY_NOT_FOUND_ERROR, status=status.HTTP_404_NOT_FOUND)

        return Response(CopilotSessionSerializer(session).data, status=status.HTTP_200_OK)
