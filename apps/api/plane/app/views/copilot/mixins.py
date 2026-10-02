# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import CopilotSession

from ..base import BaseViewSet
from .base import is_entity_accessible

SESSION_NOT_FOUND_ERROR = {"error": "The required object does not exist."}


class CopilotBaseViewSet(BaseViewSet):
    model = CopilotSession

    def get_session_queryset(self):
        return CopilotSession.objects.filter(workspace__slug=self.workspace_slug, project_id=self.project_id)

    def get_session(self):
        return self.get_session_queryset().filter(pk=self.kwargs.get("session_id")).first()

    def check_session_entity_access(self, request, session):
        """Return a 404 response when the session's entity is not accessible, else None."""
        if session is None or not is_entity_accessible(
            request.user, session.workspace.slug, session.project_id, session.entity_type, session.entity_id
        ):
            return Response(SESSION_NOT_FOUND_ERROR, status=status.HTTP_404_NOT_FOUND)
        return None

    def get_session_or_error(self, request):
        session = self.get_session()
        return session, self.check_session_entity_access(request, session)
