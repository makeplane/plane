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
from plane.app.serializers import CopilotMessageCreateSerializer, CopilotMessageSerializer
from plane.db.models import CopilotMessage
from plane.utils.copilot_constants import CopilotMessageRole, CopilotToolName, CopilotToolStatus

from .agent import get_agent_engine
from .engine import run_turn
from .mixins import CopilotBaseViewSet

MESSAGE_IN_PROGRESS_ERROR = {"error": "A turn is already running for this session."}

# Tools that pause a turn while they wait for a user response.
INTERACTIVE_TOOL_NAMES = (
    CopilotToolName.ASK_USER,
    CopilotToolName.PROPOSE_EDIT,
    CopilotToolName.DRAFT_TICKETS,
)


def session_has_running_turn(session):
    """True when the session has an unfinished interactive turn that a new message would interrupt."""
    return session.messages.filter(
        tool_calls__status=CopilotToolStatus.RUNNING,
        tool_calls__is_answered=False,
        tool_calls__name__in=INTERACTIVE_TOOL_NAMES,
    ).exists()


class CopilotMessageViewSet(CopilotBaseViewSet):
    model = CopilotMessage

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, session_id):
        session, error_response = self.get_session_or_error(request)
        if error_response:
            return error_response

        payload = CopilotMessageCreateSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        content = payload.validated_data["content"]

        # Persist the user's message, then run the next scripted turn. Both stay
        # in one transaction so a partial turn never lands in the transcript.
        with transaction.atomic():
            # Re-check the running state inside the transaction so two concurrent
            # requests cannot both start a turn.
            locked_session = session.__class__.objects.select_for_update().get(pk=session.pk)

            if session_has_running_turn(locked_session):
                return Response(MESSAGE_IN_PROGRESS_ERROR, status=status.HTTP_409_CONFLICT)

            next_sequence = (
                locked_session.messages.order_by("-sequence").values_list("sequence", flat=True).first() or 0
            ) + 1
            user_message = CopilotMessage.objects.create(
                session=locked_session,
                role=CopilotMessageRole.USER,
                content=content,
                sequence=next_sequence,
            )

            turn = run_turn(locked_session, get_agent_engine())

        assistant_message = turn["message"] if turn else None
        response_data = {
            "user_message": CopilotMessageSerializer(user_message).data,
            "assistant_message": CopilotMessageSerializer(assistant_message).data if assistant_message else None,
            "finished": turn is None,
        }
        return Response(response_data, status=status.HTTP_201_CREATED)
