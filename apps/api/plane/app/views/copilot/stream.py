# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.http import StreamingHttpResponse

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.utils.copilot_constants import CopilotEventName, CopilotMessageRole, CopilotToolName, CopilotToolStatus
from plane.utils.sse import encode_sse_comment, encode_sse_event

from .mixins import CopilotBaseViewSet

# The mock agent emits events by writing them to the database before a turn starts, so a
# reconnect replays them. A live push channel is added in task 1.2.


class CopilotSessionStreamViewSet(CopilotBaseViewSet):
    def _parse_last_event_id(self, request):
        """Read the SSE resume cursor from Last-Event-ID or the `from_sequence` query param."""
        raw = request.headers.get("Last-Event-ID") or request.GET.get("from_sequence")
        if raw is None:
            return None
        try:
            value = int(str(raw).strip())
        except (TypeError, ValueError):
            return None
        return value if value > 0 else None

    def _replay_events(self, session, after_sequence):
        """Yield the persisted events of the session that come after `after_sequence` (or all when None)."""
        messages = session.messages.all().order_by("sequence")
        for message in messages:
            if message.role == CopilotMessageRole.USER:
                continue
            base_sequence = message.sequence * 1000
            if after_sequence is None or base_sequence > after_sequence:
                yield (
                    base_sequence,
                    CopilotEventName.MESSAGE_DELTA,
                    {
                        "message_id": str(message.id),
                        "delta": message.content,
                        "done": True,
                    },
                )
            for tool_call in message.tool_calls.all():
                tool_call_sequence = base_sequence + 1
                if after_sequence is not None and tool_call_sequence <= after_sequence:
                    continue
                args = tool_call.args if isinstance(tool_call.args, dict) else {}
                awaiting_input = (
                    tool_call.name
                    in (CopilotToolName.ASK_USER, CopilotToolName.PROPOSE_EDIT, CopilotToolName.DRAFT_TICKETS)
                    and tool_call.status == CopilotToolStatus.RUNNING
                    and not tool_call.is_answered
                )
                yield (
                    tool_call_sequence,
                    CopilotEventName.TOOL_CALL_START,
                    {
                        "id": str(tool_call.id),
                        "name": tool_call.name,
                        "args": args,
                        "status": CopilotToolStatus.RUNNING,
                        "awaiting_input": awaiting_input,
                    },
                )
                if tool_call.is_stale:
                    yield (
                        tool_call_sequence + 1,
                        CopilotEventName.TOOL_CALL_UPDATE,
                        {
                            "id": str(tool_call.id),
                            "status": tool_call.status,
                            "stale": True,
                            "result": tool_call.result,
                        },
                    )
                if tool_call.status in (CopilotToolStatus.DONE, CopilotToolStatus.FAILED):
                    end_payload = {"id": str(tool_call.id), "status": tool_call.status}
                    if tool_call.result is not None:
                        end_payload["result"] = tool_call.result
                    if tool_call.error is not None:
                        end_payload["error"] = tool_call.error
                    yield tool_call_sequence + 2, CopilotEventName.TOOL_CALL_END, end_payload

    def _initial_events(self, session, after_sequence):
        # When not resuming, send everything from the start; when resuming, send only what is newer.
        return list(self._replay_events(session, after_sequence))

    def _stream_events(self, session, after_sequence):
        # Send a leading comment so proxies flush headers immediately.
        yield encode_sse_comment("stream open")
        for sequence, event, data in self._initial_events(session, after_sequence):
            yield encode_sse_event(sequence, event, data)
        # The current skeleton replays persisted events then closes; a live push channel
        # with heartbeats is added when the mock agent streams new events in task 1.2.
        yield encode_sse_comment("replayed")

    def _build_stream_response(self, session, after_sequence):
        response = StreamingHttpResponse(
            self._stream_events(session, after_sequence),
            content_type="text/event-stream",
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def stream(self, request, slug, project_id, session_id):
        session, error_response = self.get_session_or_error(request)
        if error_response:
            return error_response

        after_sequence = self._parse_last_event_id(request)
        return self._build_stream_response(session, after_sequence)
