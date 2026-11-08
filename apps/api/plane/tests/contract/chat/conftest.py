# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared fixtures for the Nexus Messages API contract tests.

Each person is an `Actor` (a user and a session-authenticated client). `admin` is the
root conftest's `create_user`, who owns `workspace`, and drives `session_client`.
"""

from dataclasses import dataclass
from unittest import mock
from uuid import uuid4

import pytest
from rest_framework.test import APIClient

from plane.chat.models import Channel, ChannelKind, ChannelMember, ChannelMemberRole, Message
from plane.db.models import User, Workspace, WorkspaceMember

ADMIN, MEMBER, GUEST = 20, 15, 5


@dataclass
class Actor:
    user: User
    client: APIClient


@pytest.fixture(autouse=True)
def no_soft_delete_task():
    """`BaseModel.delete()` queues a Celery task to soft delete related rows; keep it off the broker."""
    with mock.patch("plane.db.mixins.soft_delete_related_objects"):
        yield


@pytest.fixture
def make_actor(db, workspace):
    """A user with `role` in `workspace` (or `in_workspace`); `role=None` means in no workspace at all."""

    def make(role=MEMBER, in_workspace=None):
        user = User.objects.create(email=f"{uuid4().hex[:10]}@example.com", username=uuid4().hex[:12])
        if role is not None:
            WorkspaceMember.objects.create(workspace=in_workspace or workspace, member=user, role=role)
        client = APIClient()
        client.force_authenticate(user=user)
        return Actor(user, client)

    return make


@pytest.fixture
def admin(create_user, session_client, workspace):
    return Actor(create_user, session_client)


@pytest.fixture
def member(make_actor):
    return make_actor(MEMBER)


@pytest.fixture
def member2(make_actor):
    return make_actor(MEMBER)


@pytest.fixture
def guest(make_actor):
    return make_actor(GUEST)


@pytest.fixture
def other_workspace(db):
    owner = User.objects.create(email=f"{uuid4().hex[:10]}@example.com", username=uuid4().hex[:12])
    other = Workspace.objects.create(name="Other", slug=f"other-{uuid4().hex[:6]}", owner=owner)
    WorkspaceMember.objects.create(workspace=other, member=owner, role=ADMIN)
    return other


@pytest.fixture
def outsider(make_actor, other_workspace):
    """An admin of a different workspace, and nothing in `workspace`."""
    return make_actor(ADMIN, in_workspace=other_workspace)


@pytest.fixture
def make_channel(workspace):
    """A named channel; `admins` and `members` are users added with those channel roles."""

    def make(kind=ChannelKind.PUBLIC, name=None, admins=(), members=(), in_workspace=None):
        channel = Channel.objects.create(
            workspace=in_workspace or workspace, kind=kind, name=name or f"c-{uuid4().hex[:8]}"
        )
        for user in admins:
            ChannelMember.objects.create(channel=channel, user=user, role=ChannelMemberRole.ADMIN)
        for user in members:
            ChannelMember.objects.create(channel=channel, user=user)
        return channel

    return make


@pytest.fixture
def foreign_channel(make_channel, other_workspace):
    """A public channel in another workspace."""
    return make_channel(in_workspace=other_workspace)


@pytest.fixture
def send():
    def send(channel, user, text="hi", parent=None):
        return Message.objects.create(channel=channel, sender=user, parent=parent, body_html=f"<p>{text}</p>")

    return send


@pytest.fixture
def url(workspace):
    """url("channels/") -> /api/workspaces/<slug>/chat/channels/"""
    return lambda suffix="", slug=None: f"/api/workspaces/{slug or workspace.slug}/chat/{suffix}"
