# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Apply one agent step to a copilot session's transcript (the database).

The engine is sync and DB-backed. It creates the assistant message and its tool
call, persists the final state of a completed step, advances the session's
script cursor, and returns the persisted rows plus the SSE events to stream.
"""

from django.db import transaction

from plane.db.models import CopilotMessage, CopilotToolCall
from plane.utils.copilot_constants import CopilotMessageRole, CopilotToolName, CopilotToolStatus

# Chunk size for message_delta events, to simulate typing.
MESSAGE_DELTA_CHUNK = 24

# Tools whose result the script fills in here rather than from a user response.
_FILLER_RESULTS = {
    CopilotToolName.SEARCH_TICKETS: lambda args, session: {
        "query": args.get("query", ""),
        "tickets": [],
        "selected_ticket_ids": [],
    },
    CopilotToolName.WEB_SEARCH: lambda args, session: {
        "queries": args.get("queries", []),
        "sources": [
            {
                "id": "s1",
                "title": "Planning copilots: an overview",
                "url": "https://example.com/planning-copilot",
                "domain": "example.com",
                "snippet": "How adversarial planning interviews improve specification quality.",
            }
        ],
        "answer": "Structured interviews before implementation surface hidden edge cases.",
        "citations": [{"start": 0, "end": 20, "source_ids": ["s1"]}],
    },
    CopilotToolName.REMEMBER: lambda args, session: {
        "memory_id": None,  # filled in after the memory row is created
        "content": args.get("content", ""),
        "deleted": False,
    },
}


def _next_message_sequence(session):
    last = session.messages.order_by("-sequence").values_list("sequence", flat=True).first()
    return (last or 0) + 1


def _chunk_text(text):
    """Split text into message_delta chunks."""
    if not text:
        return []
    return [text[i : i + MESSAGE_DELTA_CHUNK] for i in range(0, len(text), MESSAGE_DELTA_CHUNK)]


def run_turn(session, engine):
    """Run one scripted turn for the session.

    Creates the assistant message (and tool call for tool steps), persists the
    result for non-interactive tools, advances the cursor, and returns a list of
    SSE events plus the created rows. Returns None when the script is finished.
    """
    step = engine.next_step(session)
    if step is None:
        return None

    events = []
    with transaction.atomic():
        message_sequence = _next_message_sequence(session)
        message = CopilotMessage.objects.create(
            session=session,
            role=CopilotMessageRole.ASSISTANT,
            content="",
            sequence=message_sequence,
        )
        base_sequence = message_sequence * 1000

        # Stream the assistant text in chunks.
        chunks = _chunk_text(step.text or "")
        content_parts = []
        for index, chunk in enumerate(chunks):
            done = index == len(chunks) - 1
            events.append(
                {
                    "sequence": base_sequence,
                    "event": "message_delta",
                    "data": {"message_id": str(message.id), "delta": chunk, "done": done},
                }
            )
            content_parts.append(chunk)
        # Persist the assembled message content.
        message.content = "".join(content_parts)
        message.save(update_fields=["content", "updated_at"])

        tool_call = None
        if step.tool is not None:
            tool_call = CopilotToolCall.objects.create(
                message=message,
                name=step.tool,
                args=step.args,
                status=CopilotToolStatus.RUNNING,
            )
            awaiting_input = step.interactive
            events.append(
                {
                    "sequence": base_sequence + 1,
                    "event": "tool_call_start",
                    "data": {
                        "id": str(tool_call.id),
                        "name": step.tool,
                        "args": step.args,
                        "status": CopilotToolStatus.RUNNING,
                        "awaiting_input": awaiting_input,
                    },
                }
            )

            if step.fail_once and not tool_call.is_answered:
                # First run fails; the retry path (task 2.4) re-runs it as successful.
                tool_call.status = CopilotToolStatus.FAILED
                tool_call.error = {"code": "upstream_error", "message": "Simulated lookup failure"}
                tool_call.save(update_fields=["status", "error", "updated_at"])
                events.append(
                    {
                        "sequence": base_sequence + 3,
                        "event": "tool_call_end",
                        "data": {
                            "id": str(tool_call.id),
                            "status": CopilotToolStatus.FAILED,
                            "error": tool_call.error,
                        },
                    }
                )
            elif not step.interactive:
                # Complete the tool immediately with a scripted result.
                filler = _FILLER_RESULTS.get(step.tool)
                result = filler(step.args, session) if filler else {}
                if step.tool == CopilotToolName.REMEMBER:
                    memory = session.memories.create(content=step.args.get("content", ""))
                    result = {**result, "memory_id": str(memory.id)}
                tool_call.status = CopilotToolStatus.DONE
                tool_call.result = result
                tool_call.save(update_fields=["status", "result", "updated_at"])
                events.append(
                    {
                        "sequence": base_sequence + 3,
                        "event": "tool_call_end",
                        "data": {
                            "id": str(tool_call.id),
                            "status": CopilotToolStatus.DONE,
                            "result": result,
                        },
                    }
                )
            # Interactive tools stay running and awaiting input; the turn ends here.

        session.script_cursor += 1
        session.save(update_fields=["script_cursor", "updated_at"])

    return {"message": message, "tool_call": tool_call, "events": events, "step": step}
