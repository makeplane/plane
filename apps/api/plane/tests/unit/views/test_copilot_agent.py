# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest

from plane.app.views.copilot.agent import SCRIPT, AgentEngine, get_agent_engine
from plane.app.views.copilot.engine import run_turn
from plane.db.models import CopilotSession, CopilotToolCall, Project
from plane.utils.copilot_constants import CopilotEntityType, CopilotToolName, CopilotToolStatus


@pytest.fixture
def project(db, workspace, create_user):
    return Project.objects.create(name="Test Project", identifier="TP", workspace=workspace, created_by=create_user)


@pytest.fixture
def session(project):
    return CopilotSession.objects.create(project=project, entity_type=CopilotEntityType.PAGE, entity_id=uuid4())


@pytest.mark.unit
class TestAgentEngine:
    def test_script_covers_all_six_tools(self):
        tools = {step.tool for step in SCRIPT if step.tool is not None}
        assert tools == {
            CopilotToolName.ASK_USER,
            CopilotToolName.SEARCH_TICKETS,
            CopilotToolName.WEB_SEARCH,
            CopilotToolName.REMEMBER,
            CopilotToolName.PROPOSE_EDIT,
            CopilotToolName.DRAFT_TICKETS,
        }

    def test_script_has_one_fail_once_step(self):
        failing = [step for step in SCRIPT if step.fail_once]
        assert len(failing) == 1

    def test_next_step_advances_with_cursor(self, session):
        engine = AgentEngine()
        for index in range(len(SCRIPT)):
            session.script_cursor = index
            step = engine.next_step(session)
            assert step is SCRIPT[index]

    def test_next_step_returns_none_when_finished(self, session):
        session.script_cursor = len(SCRIPT)
        assert AgentEngine().next_step(session) is None

    def test_get_agent_engine_returns_an_engine(self):
        assert isinstance(get_agent_engine(), AgentEngine)


@pytest.mark.unit
@pytest.mark.django_db
class TestRunTurn:
    def test_text_only_step_streams_chunks_and_advances_cursor(self, session):
        engine = AgentEngine()
        session.script_cursor = 0
        result = run_turn(session, engine)

        assert result is not None
        step = result["step"]
        assert step is SCRIPT[0]
        assert result["tool_call"] is None
        events = result["events"]
        assert len(events) > 0
        assert all(e["event"] == "message_delta" for e in events)
        # First chunk not done, last chunk done
        assert events[0]["data"]["done"] is False
        assert events[-1]["data"]["done"] is True
        assert events[-1]["data"]["message_id"] == str(result["message"].id)
        session.refresh_from_db()
        assert session.script_cursor == 1
        result["message"].refresh_from_db()
        assert result["message"].content == step.text

    def test_interactive_tool_step_stays_running(self, session):
        engine = AgentEngine()
        # Jump to the ask_user step (index 1).
        session.script_cursor = 1
        result = run_turn(session, engine)

        assert result is not None
        tool_call = result["tool_call"]
        assert tool_call is not None
        assert tool_call.name == CopilotToolName.ASK_USER
        assert tool_call.status == CopilotToolStatus.RUNNING
        assert tool_call.is_answered is False
        events = result["events"]
        start = [e for e in events if e["event"] == "tool_call_start"]
        assert len(start) == 1
        assert start[0]["data"]["awaiting_input"] is True
        # No tool_call_end for an interactive step.
        assert not any(e["event"] == "tool_call_end" for e in events)

    def test_non_interactive_tool_completes_with_result(self, session):
        engine = AgentEngine()
        # Jump to the web_search step (index 3).
        session.script_cursor = 3
        result = run_turn(session, engine)

        assert result is not None
        tool_call = result["tool_call"]
        assert tool_call.name == CopilotToolName.WEB_SEARCH
        assert tool_call.status == CopilotToolStatus.DONE
        assert tool_call.result is not None
        assert tool_call.result["sources"]
        assert tool_call.result["citations"]
        end = [e for e in result["events"] if e["event"] == "tool_call_end"]
        assert len(end) == 1
        assert end[0]["data"]["status"] == CopilotToolStatus.DONE

    def test_remember_step_creates_a_memory(self, session):
        engine = AgentEngine()
        session.script_cursor = 4
        result = run_turn(session, engine)

        assert result is not None
        tool_call = result["tool_call"]
        assert tool_call.name == CopilotToolName.REMEMBER
        assert tool_call.status == CopilotToolStatus.DONE
        assert tool_call.result["memory_id"]
        memory = session.memories.get(pk=tool_call.result["memory_id"])
        assert memory.content == tool_call.result["content"]

    def test_fail_once_step_fails_on_first_run(self, session):
        engine = AgentEngine()
        failing_index = next(i for i, s in enumerate(SCRIPT) if s.fail_once)
        session.script_cursor = failing_index
        result = run_turn(session, engine)

        assert result is not None
        tool_call = result["tool_call"]
        assert tool_call.status == CopilotToolStatus.FAILED
        assert tool_call.error["code"] == "upstream_error"
        end = [e for e in result["events"] if e["event"] == "tool_call_end"]
        assert len(end) == 1
        assert end[0]["data"]["status"] == CopilotToolStatus.FAILED
        assert end[0]["data"]["error"]["code"] == "upstream_error"

    def test_script_finish_returns_none_and_does_not_create_rows(self, session):
        engine = AgentEngine()
        session.script_cursor = len(SCRIPT)
        result = run_turn(session, engine)

        assert result is None
        assert session.messages.count() == 0
        assert CopilotToolCall.objects.count() == 0

    def test_full_script_runs_to_completion(self, session):
        engine = AgentEngine()
        events_seen = []
        for _ in range(len(SCRIPT)):
            result = run_turn(session, engine)
            assert result is not None
            events_seen.extend(result["events"])

        assert session.script_cursor == len(SCRIPT)
        assert session.messages.count() == len(SCRIPT)
        # At least one failed tool call (the fail_once step).
        assert CopilotToolCall.objects.filter(message__session=session, status=CopilotToolStatus.FAILED).exists()
        # Interactive tools stayed running and unanswered.
        interactive = [s for s in SCRIPT if s.interactive]
        assert len(interactive) == 3
        running = CopilotToolCall.objects.filter(message__session=session, status=CopilotToolStatus.RUNNING)
        assert running.count() == 3
        # Done tools have results.
        done = CopilotToolCall.objects.filter(message__session=session, status=CopilotToolStatus.DONE)
        assert all(t.result is not None for t in done)
