# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid
from unittest import mock

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    CopilotMemory,
    CopilotMessage,
    CopilotSession,
    CopilotToolCall,
    Issue,
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    User,
    WorkspaceMember,
)
from plane.utils.copilot_constants import (
    CopilotEntityType,
    CopilotMessageRole,
    CopilotToolName,
    CopilotToolStatus,
)


def _sessions_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/copilot/sessions/"


def _session_url(slug, project_id, session_id):
    return f"{_sessions_url(slug, project_id)}{session_id}/"


def _memories_url(slug, project_id, session_id):
    return f"{_session_url(slug, project_id, session_id)}memories/"


def _memory_url(slug, project_id, session_id, memory_id):
    return f"{_memories_url(slug, project_id, session_id)}{memory_id}/"


def _stream_url(slug, project_id, session_id):
    return f"{_session_url(slug, project_id, session_id)}stream/"


def _messages_url(slug, project_id, session_id):
    return f"{_session_url(slug, project_id, session_id)}messages/"


def _make_project(workspace, identifier):
    return Project.objects.create(name=f"Project {identifier}", identifier=identifier, workspace=workspace)


def _make_page(workspace, project, owner, access=Page.PUBLIC_ACCESS, name="Planning page"):
    page = Page.objects.create(workspace=workspace, owned_by=owner, access=access, name=name)
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    return page


def _demote_to_guest(workspace, project, user):
    # Workspace admins who belong to a project pass the permission check whatever their project role.
    WorkspaceMember.objects.filter(workspace=workspace, member=user).update(role=15)
    ProjectMember.objects.filter(project=project, member=user).update(role=5)


@pytest.fixture
def project(db, workspace, create_user):
    project = _make_project(workspace, "CPA")
    ProjectMember.objects.create(workspace=workspace, project=project, member=create_user, role=15)
    return project


@pytest.fixture
def other_user(db):
    return User.objects.create(email="other@plane.so", username=f"other_{uuid.uuid4().hex[:8]}")


@pytest.fixture
def page(workspace, project, other_user):
    return _make_page(workspace, project, other_user)


@pytest.mark.contract
@pytest.mark.django_db
class TestCopilotSessionCreate:
    def test_creates_a_session_for_a_page(self, session_client, workspace, project, page):
        response = session_client.post(
            _sessions_url(workspace.slug, project.id),
            {"entity_type": "page", "entity_id": str(page.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["entity_type"] == "page"
        assert data["entity_id"] == str(page.id)
        assert data["project"] == str(project.id)
        assert data["workspace"] == str(workspace.id)
        assert data["messages"] == []
        assert data["memories"] == []

    def test_creates_a_session_for_a_work_item(self, session_client, workspace, project):
        issue = Issue.objects.create(name="Plan the launch", project=project)

        response = session_client.post(
            _sessions_url(workspace.slug, project.id),
            {"entity_type": "issue", "entity_id": str(issue.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["entity_id"] == str(issue.id)

    def test_returns_the_existing_session_on_repeat(self, session_client, workspace, project, page):
        payload = {"entity_type": "page", "entity_id": str(page.id)}

        first = session_client.post(_sessions_url(workspace.slug, project.id), payload, format="json")
        second = session_client.post(_sessions_url(workspace.slug, project.id), payload, format="json")

        assert first.status_code == status.HTTP_201_CREATED
        assert second.status_code == status.HTTP_200_OK
        assert second.json()["id"] == first.json()["id"]
        assert CopilotSession.objects.filter(entity_id=page.id).count() == 1

    def test_unknown_entity_is_not_found(self, session_client, workspace, project):
        response = session_client.post(
            _sessions_url(workspace.slug, project.id),
            {"entity_type": "page", "entity_id": str(uuid.uuid4())},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not CopilotSession.objects.exists()

    def test_work_item_id_is_not_accepted_as_a_page(self, session_client, workspace, project):
        issue = Issue.objects.create(name="Plan the launch", project=project)

        response = session_client.post(
            _sessions_url(workspace.slug, project.id),
            {"entity_type": "page", "entity_id": str(issue.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.parametrize(
        "payload",
        [
            {},
            {"entity_type": "cycle", "entity_id": str(uuid.uuid4())},
            {"entity_type": "page", "entity_id": "not-a-uuid"},
            {"entity_type": "page"},
        ],
    )
    def test_invalid_payload_is_rejected(self, session_client, workspace, project, payload):
        response = session_client.post(_sessions_url(workspace.slug, project.id), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_page_of_another_project_is_not_found(self, session_client, workspace, project, other_user):
        other_project = _make_project(workspace, "CPB")
        other_page = _make_page(workspace, other_project, other_user)

        response = session_client.post(
            _sessions_url(workspace.slug, project.id),
            {"entity_type": "page", "entity_id": str(other_page.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_page_removed_from_the_project_is_not_found(self, session_client, workspace, project, page):
        ProjectPage.objects.filter(page=page, project=project).update(deleted_at=timezone.now())

        response = session_client.post(
            _sessions_url(workspace.slug, project.id),
            {"entity_type": "page", "entity_id": str(page.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_private_page_of_another_user_is_not_found(self, session_client, workspace, project, other_user):
        private_page = _make_page(workspace, project, other_user, access=Page.PRIVATE_ACCESS)

        response = session_client.post(
            _sessions_url(workspace.slug, project.id),
            {"entity_type": "page", "entity_id": str(private_page.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_own_private_page_is_allowed(self, session_client, workspace, project, create_user):
        private_page = _make_page(workspace, project, create_user, access=Page.PRIVATE_ACCESS)

        response = session_client.post(
            _sessions_url(workspace.slug, project.id),
            {"entity_type": "page", "entity_id": str(private_page.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

    def test_draft_work_item_is_not_found(self, session_client, workspace, project):
        draft = Issue.objects.create(name="Draft", project=project, is_draft=True)

        response = session_client.post(
            _sessions_url(workspace.slug, project.id),
            {"entity_type": "issue", "entity_id": str(draft.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_page_linked_to_another_project_keeps_its_first_session(
        self, session_client, workspace, project, create_user, page
    ):
        second_project = _make_project(workspace, "CPC")
        ProjectMember.objects.create(workspace=workspace, project=second_project, member=create_user, role=15)
        ProjectPage.objects.create(workspace=workspace, project=second_project, page=page)
        payload = {"entity_type": "page", "entity_id": str(page.id)}

        first = session_client.post(_sessions_url(workspace.slug, project.id), payload, format="json")
        second = session_client.post(_sessions_url(workspace.slug, second_project.id), payload, format="json")

        assert first.status_code == status.HTTP_201_CREATED
        assert second.status_code == status.HTTP_404_NOT_FOUND
        assert CopilotSession.objects.filter(entity_id=page.id).count() == 1

    @pytest.mark.parametrize("role", [20, 15])
    def test_admins_and_members_are_allowed(self, session_client, workspace, project, create_user, page, role):
        ProjectMember.objects.filter(project=project, member=create_user).update(role=role)

        response = session_client.post(
            _sessions_url(workspace.slug, project.id),
            {"entity_type": "page", "entity_id": str(page.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

    def test_guests_are_denied(self, session_client, workspace, project, create_user, page):
        _demote_to_guest(workspace, project, create_user)

        response = session_client.post(
            _sessions_url(workspace.slug, project.id),
            {"entity_type": "page", "entity_id": str(page.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not CopilotSession.objects.exists()

    def test_non_members_are_denied(self, session_client, workspace, project, create_user, page):
        ProjectMember.objects.filter(project=project, member=create_user).delete()

        response = session_client.post(
            _sessions_url(workspace.slug, project.id),
            {"entity_type": "page", "entity_id": str(page.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_anonymous_requests_are_denied(self, api_client, workspace, project, page):
        response = api_client.post(
            _sessions_url(workspace.slug, project.id),
            {"entity_type": "page", "entity_id": str(page.id)},
            format="json",
        )

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.contract
@pytest.mark.django_db
class TestCopilotSessionRetrieve:
    @pytest.fixture
    def copilot_session(self, project, page):
        return CopilotSession.objects.create(project=project, entity_type=CopilotEntityType.PAGE, entity_id=page.id)

    def test_returns_the_transcript_in_order(self, session_client, workspace, project, copilot_session):
        # Created out of order to show that the response is ordered by sequence.
        reply = CopilotMessage.objects.create(
            session=copilot_session, role=CopilotMessageRole.ASSISTANT, content="Which scope?", sequence=2
        )
        CopilotMessage.objects.create(
            session=copilot_session, role=CopilotMessageRole.USER, content="Plan the launch", sequence=1
        )
        CopilotToolCall.objects.create(
            message=reply,
            name=CopilotToolName.ASK_USER,
            args={"questions": []},
            status=CopilotToolStatus.DONE,
            result={"answers": {}},
            is_answered=True,
        )
        memory = CopilotMemory.objects.create(session=copilot_session, content="Launch is in March")

        response = session_client.get(_session_url(workspace.slug, project.id, copilot_session.id))

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(copilot_session.id)
        assert [m["sequence"] for m in data["messages"]] == [1, 2]
        assert [m["content"] for m in data["messages"]] == ["Plan the launch", "Which scope?"]
        assert data["messages"][0]["tool_calls"] == []
        (tool_call,) = data["messages"][1]["tool_calls"]
        assert tool_call["name"] == "ask_user"
        assert tool_call["status"] == "done"
        assert tool_call["result"] == {"answers": {}}
        assert tool_call["is_answered"] is True
        assert tool_call["is_stale"] is False
        assert tool_call["error"] is None
        assert [m["id"] for m in data["memories"]] == [str(memory.id)]
        assert data["memories"][0]["content"] == "Launch is in March"

    def test_awaiting_input_is_set_only_for_unanswered_running_interactive_tools(
        self, session_client, workspace, project, copilot_session
    ):
        message = CopilotMessage.objects.create(session=copilot_session, role=CopilotMessageRole.ASSISTANT, sequence=1)
        waiting = CopilotToolCall.objects.create(message=message, name=CopilotToolName.ASK_USER)
        answered = CopilotToolCall.objects.create(message=message, name=CopilotToolName.PROPOSE_EDIT, is_answered=True)
        failed = CopilotToolCall.objects.create(
            message=message, name=CopilotToolName.DRAFT_TICKETS, status=CopilotToolStatus.FAILED
        )
        searching = CopilotToolCall.objects.create(message=message, name=CopilotToolName.SEARCH_TICKETS)

        response = session_client.get(_session_url(workspace.slug, project.id, copilot_session.id))

        awaiting = {t["id"]: t["awaiting_input"] for t in response.json()["messages"][0]["tool_calls"]}
        assert awaiting == {
            str(waiting.id): True,
            str(answered.id): False,
            str(failed.id): False,
            str(searching.id): False,
        }

    def test_soft_deleted_rows_are_not_returned(self, session_client, workspace, project, copilot_session):
        message = CopilotMessage.objects.create(session=copilot_session, role=CopilotMessageRole.ASSISTANT, sequence=1)
        removed_call = CopilotToolCall.objects.create(message=message, name=CopilotToolName.REMEMBER)
        removed_memory = CopilotMemory.objects.create(session=copilot_session, content="Removed")
        removed_message = CopilotMessage.objects.create(
            session=copilot_session, role=CopilotMessageRole.USER, sequence=2
        )
        # delete() cascades via a Celery task (soft-delete); stub the broker.
        with mock.patch("plane.db.mixins.soft_delete_related_objects"):
            removed_call.delete()
            removed_memory.delete()
            removed_message.delete()

        response = session_client.get(_session_url(workspace.slug, project.id, copilot_session.id))

        data = response.json()
        assert [m["id"] for m in data["messages"]] == [str(message.id)]
        assert data["messages"][0]["tool_calls"] == []
        assert data["memories"] == []

    def test_unknown_session_is_not_found(self, session_client, workspace, project):
        response = session_client.get(_session_url(workspace.slug, project.id, uuid.uuid4()))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_session_of_another_project_is_not_found(
        self, session_client, workspace, project, create_user, copilot_session
    ):
        other_project = _make_project(workspace, "CPB")
        ProjectMember.objects.create(workspace=workspace, project=other_project, member=create_user, role=15)

        response = session_client.get(_session_url(workspace.slug, other_project.id, copilot_session.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_session_of_a_page_the_user_cannot_open_is_not_found(self, session_client, workspace, project, other_user):
        private_page = _make_page(workspace, project, other_user, access=Page.PRIVATE_ACCESS)
        private_session = CopilotSession.objects.create(
            project=project, entity_type=CopilotEntityType.PAGE, entity_id=private_page.id
        )

        response = session_client.get(_session_url(workspace.slug, project.id, private_session.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_session_of_a_page_removed_from_the_project_is_not_found(
        self, session_client, workspace, project, page, copilot_session
    ):
        ProjectPage.objects.filter(page=page, project=project).update(deleted_at=timezone.now())

        response = session_client.get(_session_url(workspace.slug, project.id, copilot_session.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_guests_are_denied(self, session_client, workspace, project, create_user, copilot_session):
        _demote_to_guest(workspace, project, create_user)

        response = session_client.get(_session_url(workspace.slug, project.id, copilot_session.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_non_members_are_denied(self, session_client, workspace, project, create_user, copilot_session):
        ProjectMember.objects.filter(project=project, member=create_user).delete()

        response = session_client.get(_session_url(workspace.slug, project.id, copilot_session.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_anonymous_requests_are_denied(self, api_client, workspace, project, copilot_session):
        response = api_client.get(_session_url(workspace.slug, project.id, copilot_session.id))

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.contract
@pytest.mark.django_db
class TestCopilotMemoryEndpoints:
    @pytest.fixture
    def copilot_session(self, project, page):
        return CopilotSession.objects.create(project=project, entity_type=CopilotEntityType.PAGE, entity_id=page.id)

    def test_list_returns_the_memories_of_the_session(
        self, session_client, workspace, project, copilot_session, other_user
    ):
        first = CopilotMemory.objects.create(session=copilot_session, content="Launch is in March")
        second = CopilotMemory.objects.create(session=copilot_session, content="Budget is fixed")
        other_page = _make_page(workspace, project, other_user)
        other_session = CopilotSession.objects.create(
            project=project, entity_type=CopilotEntityType.PAGE, entity_id=other_page.id
        )
        CopilotMemory.objects.create(session=other_session, content="Not this session")

        response = session_client.get(_memories_url(workspace.slug, project.id, copilot_session.id))

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert [m["id"] for m in data] == [str(first.id), str(second.id)]
        assert [m["content"] for m in data] == ["Launch is in March", "Budget is fixed"]

    def test_list_excludes_soft_deleted_memories(self, session_client, workspace, project, copilot_session, other_user):
        memory = CopilotMemory.objects.create(session=copilot_session, content="Removed")
        with mock.patch("plane.db.mixins.soft_delete_related_objects"):
            memory.delete()

        response = session_client.get(_memories_url(workspace.slug, project.id, copilot_session.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_list_of_another_session_is_not_found(self, session_client, workspace, project, copilot_session):
        other_session = CopilotSession.objects.create(
            project=project, entity_type=CopilotEntityType.PAGE, entity_id=uuid.uuid4()
        )

        response = session_client.get(_memories_url(workspace.slug, project.id, other_session.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_patch_updates_the_content(self, session_client, workspace, project, copilot_session):
        memory = CopilotMemory.objects.create(session=copilot_session, content="Launch is in March")

        response = session_client.patch(
            _memory_url(workspace.slug, project.id, copilot_session.id, memory.id),
            {"content": "Launch is in April"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["content"] == "Launch is in April"
        memory.refresh_from_db()
        assert memory.content == "Launch is in April"

    def test_patch_blank_content_is_rejected(self, session_client, workspace, project, copilot_session):
        memory = CopilotMemory.objects.create(session=copilot_session, content="Launch is in March")

        response = session_client.patch(
            _memory_url(workspace.slug, project.id, copilot_session.id, memory.id),
            {"content": "   "},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        memory.refresh_from_db()
        assert memory.content == "Launch is in March"

    def test_patch_of_another_session_is_not_found(self, session_client, workspace, project, copilot_session):
        memory = CopilotMemory.objects.create(session=copilot_session, content="Launch is in March")
        other_session = CopilotSession.objects.create(
            project=project, entity_type=CopilotEntityType.PAGE, entity_id=uuid.uuid4()
        )

        response = session_client.patch(
            _memory_url(workspace.slug, project.id, other_session.id, memory.id),
            {"content": "Launch is in April"},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        memory.refresh_from_db()
        assert memory.content == "Launch is in March"

    def test_patch_of_another_project_is_not_found(
        self, session_client, workspace, project, copilot_session, create_user
    ):
        memory = CopilotMemory.objects.create(session=copilot_session, content="Launch is in March")
        other_project = _make_project(workspace, "CPB")
        ProjectMember.objects.create(workspace=workspace, project=other_project, member=create_user, role=15)

        response = session_client.patch(
            _memory_url(workspace.slug, other_project.id, copilot_session.id, memory.id),
            {"content": "Launch is in April"},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        memory.refresh_from_db()
        assert memory.content == "Launch is in March"

    def test_delete_soft_deletes_the_memory(self, session_client, workspace, project, copilot_session):
        memory = CopilotMemory.objects.create(session=copilot_session, content="Launch is in March")

        with mock.patch("plane.db.mixins.soft_delete_related_objects") as task:
            response = session_client.delete(_memory_url(workspace.slug, project.id, copilot_session.id, memory.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not CopilotMemory.objects.filter(pk=memory.pk).exists()
        assert CopilotMemory.all_objects.filter(pk=memory.pk, deleted_at__isnull=False).exists()
        task.delay.assert_called_once()

    def test_delete_of_another_session_is_not_found(self, session_client, workspace, project, copilot_session):
        memory = CopilotMemory.objects.create(session=copilot_session, content="Launch is in March")
        other_session = CopilotSession.objects.create(
            project=project, entity_type=CopilotEntityType.PAGE, entity_id=uuid.uuid4()
        )

        response = session_client.delete(_memory_url(workspace.slug, project.id, other_session.id, memory.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert CopilotMemory.objects.filter(pk=memory.pk).exists()

    def test_guests_are_denied(self, session_client, workspace, project, create_user, copilot_session):
        memory = CopilotMemory.objects.create(session=copilot_session, content="Launch is in March")
        _demote_to_guest(workspace, project, create_user)

        list_response = session_client.get(_memories_url(workspace.slug, project.id, copilot_session.id))
        patch_response = session_client.patch(
            _memory_url(workspace.slug, project.id, copilot_session.id, memory.id),
            {"content": "Changed"},
            format="json",
        )
        delete_response = session_client.delete(_memory_url(workspace.slug, project.id, copilot_session.id, memory.id))

        assert list_response.status_code == status.HTTP_403_FORBIDDEN
        assert patch_response.status_code == status.HTTP_403_FORBIDDEN
        assert delete_response.status_code == status.HTTP_403_FORBIDDEN

    def test_non_members_are_denied(self, session_client, workspace, project, create_user, copilot_session):
        memory = CopilotMemory.objects.create(session=copilot_session, content="Launch is in March")
        ProjectMember.objects.filter(project=project, member=create_user).delete()

        list_response = session_client.get(_memories_url(workspace.slug, project.id, copilot_session.id))
        patch_response = session_client.patch(
            _memory_url(workspace.slug, project.id, copilot_session.id, memory.id),
            {"content": "Changed"},
            format="json",
        )
        delete_response = session_client.delete(_memory_url(workspace.slug, project.id, copilot_session.id, memory.id))

        assert list_response.status_code == status.HTTP_403_FORBIDDEN
        assert patch_response.status_code == status.HTTP_403_FORBIDDEN
        assert delete_response.status_code == status.HTTP_403_FORBIDDEN

    def test_anonymous_requests_are_denied(self, api_client, workspace, project, copilot_session):
        memory = CopilotMemory.objects.create(session=copilot_session, content="Launch is in March")

        list_response = api_client.get(_memories_url(workspace.slug, project.id, copilot_session.id))
        patch_response = api_client.patch(
            _memory_url(workspace.slug, project.id, copilot_session.id, memory.id),
            {"content": "Changed"},
            format="json",
        )
        delete_response = api_client.delete(_memory_url(workspace.slug, project.id, copilot_session.id, memory.id))

        assert list_response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        assert patch_response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        assert delete_response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


def _collect_stream(response, limit):
    body = b""
    events = []
    for chunk in response.streaming_content:
        body += chunk
        text = body.decode()
        while "\n\n" in text:
            raw, text = text.split("\n\n", 1)
            events.append(raw)
            if len(events) >= limit:
                return events
        body = text.encode()
    return events


@pytest.mark.contract
@pytest.mark.django_db
class TestCopilotSessionStream:
    @pytest.fixture
    def copilot_session(self, project, page):
        return CopilotSession.objects.create(project=project, entity_type=CopilotEntityType.PAGE, entity_id=page.id)

    def test_stream_is_open_and_sets_sse_headers(self, session_client, workspace, project, copilot_session):
        response = session_client.get(_stream_url(workspace.slug, project.id, copilot_session.id))

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"].startswith("text/event-stream")
        assert response["Cache-Control"] == "no-cache"
        assert response["X-Accel-Buffering"] == "no"
        first = _collect_stream(response, 1)
        assert first[0].startswith(": stream open")
        response.close()

    def test_stream_replays_persisted_transcript(self, session_client, workspace, project, copilot_session):
        CopilotMessage.objects.create(
            session=copilot_session, role=CopilotMessageRole.USER, content="Plan the launch", sequence=1
        )
        reply = CopilotMessage.objects.create(
            session=copilot_session, role=CopilotMessageRole.ASSISTANT, content="Which scope?", sequence=2
        )
        tool_call = CopilotToolCall.objects.create(
            message=reply,
            name=CopilotToolName.ASK_USER,
            args={
                "questions": [
                    {"id": "q1", "type": "short_text", "label": "Scope", "required": True, "allow_not_sure": False}
                ]
            },
            status=CopilotToolStatus.DONE,
            result={"answers": {"q1": {"value": "v1"}}},
            is_answered=True,
        )

        response = session_client.get(_stream_url(workspace.slug, project.id, copilot_session.id))
        events = _collect_stream(response, 4)
        response.close()

        # comment, then: assistant message_delta, then tool_call start, then tool_call end
        assert events[0].startswith(": stream open")
        assert events[1].startswith("id: 2000\nevent: message_delta")
        assert '"done": true' in events[1]
        assert '"message_id": "' + str(reply.id) + '"' in events[1]
        assert events[2].startswith("id: 2001\nevent: tool_call_start")
        assert '"id": "' + str(tool_call.id) + '"' in events[2]
        assert '"name": "ask_user"' in events[2]
        assert events[3].startswith("id: 2003\nevent: tool_call_end")
        assert '"status": "done"' in events[3]
        assert '"result"' in events[3]

    def test_stream_skips_user_messages(self, session_client, workspace, project, copilot_session):
        CopilotMessage.objects.create(
            session=copilot_session, role=CopilotMessageRole.USER, content="Only user", sequence=1
        )

        response = session_client.get(_stream_url(workspace.slug, project.id, copilot_session.id))
        events = _collect_stream(response, 2)
        response.close()

        assert events[0].startswith(": stream open")
        assert events[1].startswith(": replayed")

    def test_stream_resumes_after_last_event_id(self, session_client, workspace, project, copilot_session):
        reply = CopilotMessage.objects.create(
            session=copilot_session, role=CopilotMessageRole.ASSISTANT, content="First", sequence=1
        )
        CopilotToolCall.objects.create(message=reply, name=CopilotToolName.ASK_USER, status=CopilotToolStatus.RUNNING)
        later = CopilotMessage.objects.create(
            session=copilot_session, role=CopilotMessageRole.ASSISTANT, content="Second", sequence=2
        )

        response = session_client.get(
            _stream_url(workspace.slug, project.id, copilot_session.id),
            HTTP_LAST_EVENT_ID="1002",
        )
        events = _collect_stream(response, 2)
        response.close()

        # comment, then only the newer message (sequence 2 -> 2000)
        assert events[0].startswith(": stream open")
        assert events[1].startswith("id: 2000\nevent: message_delta")
        assert str(later.id) in events[1]

    def test_stream_running_tool_call_shows_awaiting_input(self, session_client, workspace, project, copilot_session):
        reply = CopilotMessage.objects.create(
            session=copilot_session, role=CopilotMessageRole.ASSISTANT, content="Question", sequence=1
        )
        CopilotToolCall.objects.create(
            message=reply, name=CopilotToolName.ASK_USER, status=CopilotToolStatus.RUNNING, is_answered=False
        )

        response = session_client.get(_stream_url(workspace.slug, project.id, copilot_session.id))
        events = _collect_stream(response, 3)
        response.close()

        # comment, message_delta, tool_call_start with awaiting_input true, then heartbeats
        assert events[2].startswith("id: 1001\nevent: tool_call_start")
        assert '"awaiting_input": true' in events[2]

    def test_stream_unknown_session_is_not_found(self, session_client, workspace, project):
        response = session_client.get(_stream_url(workspace.slug, project.id, uuid.uuid4()))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_stream_of_inaccessible_entity_is_not_found(
        self, session_client, workspace, project, page, copilot_session
    ):
        ProjectPage.objects.filter(page=page, project=project).update(deleted_at=timezone.now())

        response = session_client.get(_stream_url(workspace.slug, project.id, copilot_session.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_stream_guests_are_denied(self, session_client, workspace, project, create_user, copilot_session):
        _demote_to_guest(workspace, project, create_user)

        response = session_client.get(_stream_url(workspace.slug, project.id, copilot_session.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_stream_anonymous_is_denied(self, api_client, workspace, project, copilot_session):
        response = api_client.get(_stream_url(workspace.slug, project.id, copilot_session.id))

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.contract
@pytest.mark.django_db
class TestCopilotMessageCreate:
    @pytest.fixture
    def copilot_session(self, project, page):
        return CopilotSession.objects.create(project=project, entity_type=CopilotEntityType.PAGE, entity_id=page.id)

    def test_posts_a_message_and_runs_the_first_turn(self, session_client, workspace, project, copilot_session):
        response = session_client.post(
            _messages_url(workspace.slug, project.id, copilot_session.id),
            {"content": "Help me plan this"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["user_message"]["content"] == "Help me plan this"
        assert data["user_message"]["role"] == "user"
        assert data["user_message"]["sequence"] == 1
        # The first script step is a text-only opening, so the assistant replies with text.
        assert data["assistant_message"] is not None
        assert data["assistant_message"]["role"] == "assistant"
        assert data["assistant_message"]["sequence"] == 2
        assert data["assistant_message"]["content"]
        assert data["finished"] is False
        copilot_session.refresh_from_db()
        assert copilot_session.script_cursor == 1

    def test_persists_both_messages(self, session_client, workspace, project, copilot_session):
        session_client.post(
            _messages_url(workspace.slug, project.id, copilot_session.id),
            {"content": "Help me plan this"},
            format="json",
        )

        assert copilot_session.messages.filter(role="user").count() == 1
        assert copilot_session.messages.filter(role="assistant").count() == 1

    @pytest.mark.parametrize("payload", [{}, {"content": ""}, {"content": "   "}, {"content": "x" * 4001}])
    def test_invalid_content_is_rejected(self, session_client, workspace, project, copilot_session, payload):
        response = session_client.post(
            _messages_url(workspace.slug, project.id, copilot_session.id), payload, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert copilot_session.messages.count() == 0

    def test_rejects_a_message_while_an_interactive_turn_is_running(
        self, session_client, workspace, project, copilot_session
    ):
        # Start the ask_user turn so an interactive tool is running and unanswered.
        reply = CopilotMessage.objects.create(session=copilot_session, role=CopilotMessageRole.ASSISTANT, sequence=1)
        CopilotToolCall.objects.create(
            message=reply, name=CopilotToolName.ASK_USER, status=CopilotToolStatus.RUNNING, is_answered=False
        )

        response = session_client.post(
            _messages_url(workspace.slug, project.id, copilot_session.id),
            {"content": "Next"},
            format="json",
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        assert not copilot_session.messages.filter(role="user").exists()

    def test_allows_a_message_after_a_completed_turn(self, session_client, workspace, project, copilot_session):
        reply = CopilotMessage.objects.create(session=copilot_session, role=CopilotMessageRole.ASSISTANT, sequence=1)
        CopilotToolCall.objects.create(
            message=reply, name=CopilotToolName.ASK_USER, status=CopilotToolStatus.DONE, is_answered=True
        )

        response = session_client.post(
            _messages_url(workspace.slug, project.id, copilot_session.id),
            {"content": "Next"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

    def test_allows_a_message_after_a_failed_turn(self, session_client, workspace, project, copilot_session):
        reply = CopilotMessage.objects.create(session=copilot_session, role=CopilotMessageRole.ASSISTANT, sequence=1)
        CopilotToolCall.objects.create(
            message=reply, name=CopilotToolName.SEARCH_TICKETS, status=CopilotToolStatus.FAILED, is_answered=False
        )

        response = session_client.post(
            _messages_url(workspace.slug, project.id, copilot_session.id),
            {"content": "Next"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

    def test_message_on_unknown_session_is_not_found(self, session_client, workspace, project):
        response = session_client.post(
            _messages_url(workspace.slug, project.id, uuid.uuid4()), {"content": "Hi"}, format="json"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_message_on_inaccessible_entity_is_not_found(
        self, session_client, workspace, project, page, copilot_session
    ):
        ProjectPage.objects.filter(page=page, project=project).update(deleted_at=timezone.now())

        response = session_client.post(
            _messages_url(workspace.slug, project.id, copilot_session.id), {"content": "Hi"}, format="json"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_guests_are_denied(self, session_client, workspace, project, create_user, copilot_session):
        _demote_to_guest(workspace, project, create_user)

        response = session_client.post(
            _messages_url(workspace.slug, project.id, copilot_session.id), {"content": "Hi"}, format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not copilot_session.messages.exists()

    def test_non_members_are_denied(self, session_client, workspace, project, create_user, copilot_session):
        ProjectMember.objects.filter(project=project, member=create_user).delete()

        response = session_client.post(
            _messages_url(workspace.slug, project.id, copilot_session.id), {"content": "Hi"}, format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_anonymous_is_denied(self, api_client, workspace, project, copilot_session):
        response = api_client.post(
            _messages_url(workspace.slug, project.id, copilot_session.id), {"content": "Hi"}, format="json"
        )

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
