# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest import mock
from uuid import uuid4

import pytest
from django.db import IntegrityError, transaction

from plane.db.models import (
    CopilotMemory,
    CopilotMessage,
    CopilotSession,
    CopilotToolCall,
    Project,
)
from plane.utils.copilot_constants import (
    CopilotEntityType,
    CopilotMessageRole,
    CopilotToolName,
    CopilotToolStatus,
)


@pytest.fixture
def project(db, workspace, create_user):
    return Project.objects.create(name="Test Project", identifier="TP", workspace=workspace, created_by=create_user)


@pytest.fixture
def session(project):
    return CopilotSession.objects.create(project=project, entity_type=CopilotEntityType.PAGE, entity_id=uuid4())


@pytest.fixture
def assistant_message(session):
    return CopilotMessage.objects.create(session=session, role=CopilotMessageRole.ASSISTANT, sequence=1)


@pytest.fixture
def stub_soft_delete_task():
    # Soft delete cascades through a Celery task, so stub the broker.
    with mock.patch("plane.db.mixins.soft_delete_related_objects") as task:
        yield task


@pytest.mark.unit
@pytest.mark.django_db
class TestCopilotSessionModel:
    def test_creation_sets_workspace_from_project_and_defaults(self, project, workspace):
        entity_id = uuid4()

        session = CopilotSession.objects.create(
            project=project, entity_type=CopilotEntityType.ISSUE, entity_id=entity_id
        )

        assert session.workspace == workspace
        assert session.entity_type == CopilotEntityType.ISSUE
        assert session.entity_id == entity_id
        assert session.script_cursor == 0

    def test_one_session_per_entity(self, project, session):
        with pytest.raises(IntegrityError), transaction.atomic():
            CopilotSession.objects.create(project=project, entity_type=session.entity_type, entity_id=session.entity_id)

    def test_same_entity_id_allowed_for_other_entity_type(self, project, session):
        other = CopilotSession.objects.create(
            project=project, entity_type=CopilotEntityType.ISSUE, entity_id=session.entity_id
        )

        assert other.pk != session.pk

    def test_new_session_allowed_after_soft_delete(self, project, session, stub_soft_delete_task):
        session.delete()

        replacement = CopilotSession.objects.create(
            project=project, entity_type=session.entity_type, entity_id=session.entity_id
        )

        assert replacement.pk != session.pk
        assert not CopilotSession.objects.filter(pk=session.pk).exists()
        assert CopilotSession.all_objects.filter(pk=session.pk, deleted_at__isnull=False).exists()
        stub_soft_delete_task.delay.assert_called_once()


@pytest.mark.unit
@pytest.mark.django_db
class TestCopilotMessageModel:
    def test_messages_are_ordered_by_sequence(self, session):
        CopilotMessage.objects.create(session=session, role=CopilotMessageRole.ASSISTANT, sequence=2)
        CopilotMessage.objects.create(session=session, role=CopilotMessageRole.USER, sequence=1)

        assert [m.sequence for m in session.messages.all()] == [1, 2]

    def test_content_defaults_to_empty(self, assistant_message):
        assert assistant_message.content == ""

    def test_sequence_is_unique_per_session(self, session, assistant_message):
        with pytest.raises(IntegrityError), transaction.atomic():
            CopilotMessage.objects.create(session=session, role=CopilotMessageRole.USER, sequence=1)

    def test_sequence_can_repeat_across_sessions(self, project, assistant_message):
        other_session = CopilotSession.objects.create(
            project=project, entity_type=CopilotEntityType.PAGE, entity_id=uuid4()
        )

        message = CopilotMessage.objects.create(
            session=other_session, role=CopilotMessageRole.ASSISTANT, sequence=assistant_message.sequence
        )

        assert message.pk != assistant_message.pk

    def test_sequence_can_be_reused_after_soft_delete(self, session, assistant_message, stub_soft_delete_task):
        assistant_message.delete()

        message = CopilotMessage.objects.create(session=session, role=CopilotMessageRole.USER, sequence=1)

        assert message.pk != assistant_message.pk


@pytest.mark.unit
@pytest.mark.django_db
class TestCopilotToolCallModel:
    def test_defaults(self, assistant_message):
        tool_call = CopilotToolCall.objects.create(message=assistant_message, name=CopilotToolName.ASK_USER)

        assert tool_call.status == CopilotToolStatus.RUNNING
        assert tool_call.args == {}
        assert tool_call.result is None
        assert tool_call.error is None
        assert tool_call.is_stale is False
        assert tool_call.is_answered is False

    def test_json_fields_round_trip(self, assistant_message):
        args = {"queries": ["plane copilot"]}
        result = {"sources": [{"id": "s1", "url": "https://example.com"}], "citations": []}
        error = {"code": "upstream_error", "message": "failed"}

        tool_call = CopilotToolCall.objects.create(
            message=assistant_message,
            name=CopilotToolName.WEB_SEARCH,
            args=args,
            result=result,
            error=error,
            status=CopilotToolStatus.FAILED,
        )
        tool_call.refresh_from_db()

        assert tool_call.args == args
        assert tool_call.result == result
        assert tool_call.error == error
        assert tool_call.status == CopilotToolStatus.FAILED

    def test_tool_calls_are_reachable_from_message(self, assistant_message):
        first = CopilotToolCall.objects.create(message=assistant_message, name=CopilotToolName.SEARCH_TICKETS)
        second = CopilotToolCall.objects.create(message=assistant_message, name=CopilotToolName.REMEMBER)

        assert list(assistant_message.tool_calls.all()) == [first, second]

    def test_soft_deleted_tool_call_is_hidden_from_default_manager(self, assistant_message, stub_soft_delete_task):
        tool_call = CopilotToolCall.objects.create(message=assistant_message, name=CopilotToolName.PROPOSE_EDIT)

        tool_call.delete()

        assert not assistant_message.tool_calls.exists()
        assert CopilotToolCall.all_objects.filter(pk=tool_call.pk).exists()


@pytest.mark.unit
@pytest.mark.django_db
class TestCopilotMemoryModel:
    def test_memories_belong_to_a_session(self, project, session):
        other_session = CopilotSession.objects.create(
            project=project, entity_type=CopilotEntityType.PAGE, entity_id=uuid4()
        )
        memory = CopilotMemory.objects.create(session=session, content="Launch is on the first of March")
        CopilotMemory.objects.create(session=other_session, content="Unrelated fact")

        assert list(session.memories.all()) == [memory]

    def test_soft_deleted_memory_is_hidden_from_default_manager(self, session, stub_soft_delete_task):
        memory = CopilotMemory.objects.create(session=session, content="Remove me")

        memory.delete()

        assert not session.memories.exists()
        assert CopilotMemory.all_objects.filter(pk=memory.pk).exists()
