# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import CopilotToolCall
from plane.utils.copilot_constants import CopilotToolStatus

from .mixins import CopilotBaseViewSet


class CopilotStopViewSet(CopilotBaseViewSet):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, session_id):
        session, error_response = self.get_session_or_error(request)
        if error_response:
            return error_response

        with transaction.atomic():
            locked_session = session.__class__.objects.select_for_update().get(pk=session.pk)
            # Cancel every running tool call. The message content is already persisted,
            # so the partial reply is kept; the cancelled calls are marked failed.
            running_ids = list(
                locked_session.messages.filter(tool_calls__status=CopilotToolStatus.RUNNING).values_list(
                    "tool_calls__id", flat=True
                )
            )
            if running_ids:
                CopilotToolCall.objects.filter(id__in=running_ids).update(
                    status=CopilotToolStatus.FAILED,
                    error={"code": "cancelled", "message": "Stopped by the user"},
                )

        return Response({"cancelled": len(running_ids)}, status=status.HTTP_200_OK)
