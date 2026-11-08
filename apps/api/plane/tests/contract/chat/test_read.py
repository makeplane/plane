# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""read/: moving the caller's read cursor, and what the unread count then says."""

import pytest

from plane.chat.models import Channel, ChannelKind, ChannelMember


@pytest.fixture
def channel(make_channel, member, member2):
    return make_channel(members=[member.user, member2.user])


@pytest.mark.contract
@pytest.mark.django_db
class TestMarkRead:
    def test_marking_read_clears_the_unread_count(self, member, member2, channel, send, url):
        first, second = send(channel, member2.user), send(channel, member2.user)
        read = url(f"channels/{channel.id}/read/")
        res = member.client.post(read, {"message_id": str(first.id)}, format="json")
        assert res.status_code == 200 and res.data["unread_count"] == 1
        assert res.data["last_read_message_id"] == str(first.id)
        res = member.client.post(read, {"message_id": str(second.id)}, format="json")
        assert res.data["unread_count"] == 0

        # My own messages, thread replies and removed messages don't count.
        send(channel, member.user)
        send(channel, member2.user, parent=second)
        send(channel, member2.user).remove()
        assert member.client.get(url(f"channels/{channel.id}/")).data["unread_count"] == 0
        send(channel, member2.user)
        assert member.client.get(url(f"channels/{channel.id}/")).data["unread_count"] == 1

    def test_cursor_only_moves_forward(self, member, member2, channel, send, url):
        first, second = send(channel, member2.user), send(channel, member2.user)
        read = url(f"channels/{channel.id}/read/")
        member.client.post(read, {"message_id": str(second.id)}, format="json")
        res = member.client.post(read, {"message_id": str(first.id)}, format="json")
        assert res.status_code == 200 and res.data["last_read_message_id"] == str(second.id)

    def test_cursors_are_per_person(self, member, member2, channel, send, url):
        message = send(channel, member.user)
        member2.client.post(url(f"channels/{channel.id}/read/"), {"message_id": str(message.id)}, format="json")
        mine = ChannelMember.objects.get(channel=channel, user=member.user)
        assert mine.last_read_message is None

    def test_dm_member_marks_read(self, member, member2, workspace, send, url):
        dm, _ = Channel.objects.get_or_create_dm(workspace, member.user, member2.user)
        message = send(dm, member2.user)
        res = member.client.post(url(f"channels/{dm.id}/read/"), {"message_id": str(message.id)}, format="json")
        assert res.status_code == 200 and res.data["unread_count"] == 0

    def test_refused(self, admin, member, member2, guest, make_channel, channel, send, url):
        message = send(channel, member2.user)
        payload = {"message_id": str(message.id)}
        # Can see the public channel, but isn't in it.
        assert admin.client.post(url(f"channels/{channel.id}/read/"), payload, format="json").status_code == 403
        assert guest.client.post(url(f"channels/{channel.id}/read/"), payload, format="json").status_code == 404
        private = make_channel(ChannelKind.PRIVATE, members=[member2.user])
        hidden = {"message_id": str(send(private, member2.user).id)}
        assert member.client.post(url(f"channels/{private.id}/read/"), hidden, format="json").status_code == 404

    def test_message_must_be_in_the_channel(self, member, member2, channel, make_channel, send, url):
        elsewhere = send(make_channel(members=[member.user]), member2.user)
        read = url(f"channels/{channel.id}/read/")
        assert member.client.post(read, {"message_id": str(elsewhere.id)}, format="json").status_code == 400
        # A thread reply isn't a cursor: it would mark older unseen top-level messages as read.
        reply = send(channel, member2.user, parent=send(channel, member2.user))
        assert member.client.post(read, {"message_id": str(reply.id)}, format="json").status_code == 400
        assert member.client.post(read, {}, format="json").status_code == 400

    def test_other_workspace(self, admin, outsider, other_workspace, foreign_channel, channel, send, url):
        foreign = send(foreign_channel, other_workspace.owner)
        payload = {"message_id": str(foreign.id)}
        assert admin.client.post(url(f"channels/{foreign_channel.id}/read/"), payload, format="json").status_code == 404
        assert outsider.client.post(url(f"channels/{channel.id}/read/"), payload, format="json").status_code == 403
