# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views.messenger import (
    ChatListCreateAPIEndpoint,
    ChatDetailAPIEndpoint,
    ChatMemberListCreateAPIEndpoint,
    ChatMemberDetailAPIEndpoint,
    MessageListCreateAPIEndpoint,
    MessageDetailAPIEndpoint,
    MessageReactionListCreateAPIEndpoint,
    MessageReadAPIEndpoint,
    PinnedMessageListCreateAPIEndpoint,
    ChatStateUpdateAPIEndpoint,
    BlockListCreateAPIEndpoint,
    UserRelationListCreateAPIEndpoint,
    MessengerContactsAPIEndpoint,
    MessageForwardAPIEndpoint,
    ProjectTeamChatAPIEndpoint,
    ChatInviteLinkAPIEndpoint,
    ChatInviteJoinAPIEndpoint,
    ChatJoinByLinkAPIEndpoint,
    UserOnlineStatusAPIEndpoint,
    MessengerFileDownloadAPIEndpoint,
)

urlpatterns = [
    # Chats
    path(
        "messenger/chats/",
        ChatListCreateAPIEndpoint.as_view(),
        name="messenger-chats",
    ),
    path(
        "messenger/chats/<uuid:pk>/",
        ChatDetailAPIEndpoint.as_view(),
        name="messenger-chat-detail",
    ),
    # Project team chat
    path(
        "messenger/project-chats/<uuid:project_id>/",
        ProjectTeamChatAPIEndpoint.as_view(),
        name="messenger-project-chat",
    ),
    # Chat members
    path(
        "messenger/chats/<uuid:chat_id>/members/",
        ChatMemberListCreateAPIEndpoint.as_view(),
        name="messenger-chat-members",
    ),
    path(
        "messenger/chats/<uuid:chat_id>/members/<uuid:pk>/",
        ChatMemberDetailAPIEndpoint.as_view(),
        name="messenger-chat-member-detail",
    ),
    # Messages
    path(
        "messenger/chats/<uuid:chat_id>/messages/",
        MessageListCreateAPIEndpoint.as_view(),
        name="messenger-messages",
    ),
    path(
        "messenger/chats/<uuid:chat_id>/messages/<uuid:pk>/",
        MessageDetailAPIEndpoint.as_view(),
        name="messenger-message-detail",
    ),
    # Message reactions
    path(
        "messenger/chats/<uuid:chat_id>/messages/<uuid:message_id>/reactions/",
        MessageReactionListCreateAPIEndpoint.as_view(),
        name="messenger-message-reactions",
    ),
    # Read receipts
    path(
        "messenger/chats/<uuid:chat_id>/read/",
        MessageReadAPIEndpoint.as_view(),
        name="messenger-read",
    ),
    # Pinned messages
    path(
        "messenger/chats/<uuid:chat_id>/pinned/",
        PinnedMessageListCreateAPIEndpoint.as_view(),
        name="messenger-pinned",
    ),
    # Chat states (archive, mute, pin, draft)
    path(
        "messenger/states/",
        ChatStateUpdateAPIEndpoint.as_view(),
        name="messenger-states",
    ),
    path(
        "messenger/chats/<uuid:chat_id>/state/",
        ChatStateUpdateAPIEndpoint.as_view(),
        name="messenger-chat-state",
    ),
    # Invite links
    path(
        "messenger/chats/<uuid:chat_id>/invites/",
        ChatInviteLinkAPIEndpoint.as_view(),
        name="messenger-chat-invites",
    ),
    path(
        "messenger/invites/join/",
        ChatInviteJoinAPIEndpoint.as_view(),
        name="messenger-invite-join",
    ),
    # Blocks
    path(
        "users/me/messenger/blocks/",
        BlockListCreateAPIEndpoint.as_view(),
        name="messenger-blocks",
    ),
    # Relations (friends, team, etc.)
    path(
        "users/me/messenger/relations/",
        UserRelationListCreateAPIEndpoint.as_view(),
        name="messenger-relations",
    ),
    # Online status
    path(
        "users/me/messenger/online/",
        UserOnlineStatusAPIEndpoint.as_view(),
        name="messenger-online",
    ),
    # Contacts for new chat
    path(
        "messenger/contacts/",
        MessengerContactsAPIEndpoint.as_view(),
        name="messenger-contacts",
    ),
    # Join by internal link
    path(
        "messenger/join/",
        ChatJoinByLinkAPIEndpoint.as_view(),
        name="messenger-join-link",
    ),
    # Forward messages
    path(
        "messenger/forward/",
        MessageForwardAPIEndpoint.as_view(),
        name="messenger-forward",
    ),
    # File download
    path(
        "messenger/files/<path:file_path>",
        MessengerFileDownloadAPIEndpoint.as_view(),
        name="messenger-file-download",
    ),
]
