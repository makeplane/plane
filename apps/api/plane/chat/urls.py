# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Every Nexus Messages route, mounted at /api/workspaces/<str:slug>/chat/ (see plane/urls.py).

The mount captures the workspace slug, so each view here receives it as the `slug` kwarg.
"""

from django.urls import path

from plane.chat.views import (
    ChannelArchiveEndpoint,
    ChannelDetailEndpoint,
    ChannelEndpoint,
    ChannelJoinEndpoint,
    ChannelLeaveEndpoint,
    ChannelMemberDetailEndpoint,
    ChannelMemberEndpoint,
    ChannelReadEndpoint,
    DirectMessageEndpoint,
    GuestDmAccessEndpoint,
    GuestDmAccessListEndpoint,
    MessageDetailEndpoint,
    MessageEndpoint,
    MessageReplyEndpoint,
)

CHANNEL = "channels/<uuid:channel_id>/"

urlpatterns = [
    path("channels/", ChannelEndpoint.as_view(), name="chat-channels"),
    path("dms/", DirectMessageEndpoint.as_view(), name="chat-dms"),
    path("guests/dm-access/", GuestDmAccessListEndpoint.as_view(), name="chat-guest-dm-access-list"),
    path("guests/<uuid:user_id>/dm-access/", GuestDmAccessEndpoint.as_view(), name="chat-guest-dm-access"),
    path(CHANNEL, ChannelDetailEndpoint.as_view(), name="chat-channel"),
    path(f"{CHANNEL}archive/", ChannelArchiveEndpoint.as_view(), name="chat-channel-archive"),
    path(f"{CHANNEL}join/", ChannelJoinEndpoint.as_view(), name="chat-channel-join"),
    path(f"{CHANNEL}leave/", ChannelLeaveEndpoint.as_view(), name="chat-channel-leave"),
    path(f"{CHANNEL}read/", ChannelReadEndpoint.as_view(), name="chat-channel-read"),
    path(f"{CHANNEL}members/", ChannelMemberEndpoint.as_view(), name="chat-channel-members"),
    path(f"{CHANNEL}members/<uuid:user_id>/", ChannelMemberDetailEndpoint.as_view(), name="chat-channel-member"),
    path(f"{CHANNEL}messages/", MessageEndpoint.as_view(), name="chat-messages"),
    path(f"{CHANNEL}messages/<uuid:message_id>/", MessageDetailEndpoint.as_view(), name="chat-message"),
    path(f"{CHANNEL}messages/<uuid:message_id>/replies/", MessageReplyEndpoint.as_view(), name="chat-message-replies"),
]
