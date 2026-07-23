# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    ChatMemberMessenger,
    ChatMessenger,
    MessageMessenger,
    User,
    UserChatStateMessenger,
    WorkspaceMember,
)


@pytest.fixture
def messenger_chat(workspace, create_user):
    other_user = User.objects.create(email="messenger-other@gizmo.so", first_name="Other")
    WorkspaceMember.objects.create(workspace=workspace, member=other_user, role=15)
    chat = ChatMessenger.objects.create(organization=workspace, type="direct", created_by=create_user)
    ChatMemberMessenger.objects.create(chat=chat, user=create_user, role="member")
    ChatMemberMessenger.objects.create(chat=chat, user=other_user, role="member")
    return chat, other_user


@pytest.mark.unit
@pytest.mark.django_db
def test_message_list_returns_latest_page_and_supports_search(session_client, messenger_chat, create_user):
    chat, _ = messenger_chat
    for index in range(55):
        MessageMessenger.objects.create(
            chat=chat,
            sender=create_user,
            text="needle" if index == 2 else f"message-{index}",
            status="sent",
        )

    response = session_client.get(f"/api/messenger/chats/{chat.id}/messages/")

    assert response.status_code == 200
    assert response.data["offset"] == 5
    assert len(response.data["results"]) == 50
    assert response.data["results"][-1]["text"] == "message-54"

    search_response = session_client.get(f"/api/messenger/chats/{chat.id}/messages/?q=needle&offset=0")
    assert search_response.status_code == 200
    assert [message["text"] for message in search_response.data["results"]] == ["needle"]


@pytest.mark.unit
@pytest.mark.django_db
def test_sending_message_increments_recipient_unread_count(session_client, messenger_chat):
    chat, other_user = messenger_chat

    response = session_client.post(
        f"/api/messenger/chats/{chat.id}/messages/",
        {"text": "Hello"},
        format="json",
    )

    assert response.status_code == 201
    state = UserChatStateMessenger.objects.get(chat=chat, user=other_user)
    assert state.unread_count_cache == 1


@pytest.mark.unit
@pytest.mark.django_db
def test_outsider_cannot_react_or_change_chat_state(messenger_chat):
    chat, _ = messenger_chat
    outsider = User.objects.create(email="messenger-outsider@gizmo.so", first_name="Outsider")
    message = MessageMessenger.objects.create(chat=chat, sender=chat.members.first().user, text="Private")
    client = APIClient()
    client.force_authenticate(user=outsider)

    reaction_response = client.post(
        f"/api/messenger/chats/{chat.id}/messages/{message.id}/reactions/",
        {"emoji": "👍"},
        format="json",
    )
    state_response = client.patch(
        f"/api/messenger/chats/{chat.id}/state/",
        {"pinned_at": "2099-01-01T00:00:00Z"},
        format="json",
    )

    assert reaction_response.status_code == 403
    assert state_response.status_code == 403
