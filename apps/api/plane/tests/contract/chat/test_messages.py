# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""messages/, messages/<id>/ and messages/<id>/replies/: reading, paging, sending, editing and removing."""

import json
import threading
from unittest import mock
from uuid import uuid4

import pytest
from django.db import connection

from plane.chat.models import Channel, ChannelKind, Message
from plane.chat.serializers import MessageEditSerializer


def _texts(response):
    return [row["body_stripped"] for row in response.data["results"]]


@pytest.fixture
def channel(make_channel, member):
    return make_channel(members=[member.user])


@pytest.fixture
def five(channel, member, send):
    return [send(channel, member.user, f"m{i}") for i in range(1, 6)]


@pytest.mark.contract
@pytest.mark.django_db
class TestMessageVisibility:
    def test_anyone_who_can_see_a_public_channel_reads_it(self, member2, channel, five, url):
        res = member2.client.get(url(f"channels/{channel.id}/messages/"))
        assert res.status_code == 200 and _texts(res) == ["m1", "m2", "m3", "m4", "m5"]

    def test_hidden_channels_are_404(self, admin, member, member2, guest, workspace, make_channel, send, url):
        private = make_channel(ChannelKind.PRIVATE, members=[member2.user])
        dm, _ = Channel.objects.get_or_create_dm(workspace, member.user, member2.user)
        public = make_channel()
        for actor, channel in [(member, private), (admin, dm), (guest, public)]:
            message = send(channel, member2.user)
            assert actor.client.get(url(f"channels/{channel.id}/messages/")).status_code == 404
            assert actor.client.get(url(f"channels/{channel.id}/messages/{message.id}/")).status_code == 404
            assert actor.client.get(url(f"channels/{channel.id}/messages/{message.id}/replies/")).status_code == 404

    def test_guest_in_a_channel_reads_it(self, guest, make_channel, send, member, url):
        channel = make_channel(members=[guest.user])
        send(channel, member.user, "hello")
        assert _texts(guest.client.get(url(f"channels/{channel.id}/messages/"))) == ["hello"]

    def test_other_workspace(self, admin, outsider, foreign_channel, channel, five, url):
        assert admin.client.get(url(f"channels/{foreign_channel.id}/messages/")).status_code == 404
        assert outsider.client.get(url(f"channels/{channel.id}/messages/")).status_code == 403

    def test_message_from_another_channel_is_404(self, member, channel, make_channel, send, url):
        elsewhere = send(make_channel(members=[member.user]), member.user)
        assert member.client.get(url(f"channels/{channel.id}/messages/{elsewhere.id}/")).status_code == 404


@pytest.mark.contract
@pytest.mark.django_db
class TestPagination:
    def test_empty_channel(self, member, channel, url):
        res = member.client.get(url(f"channels/{channel.id}/messages/"))
        assert res.status_code == 200 and res.data == {"results": [], "has_more": False}

    def test_exactly_one_page(self, member, channel, send, url):
        for i in range(3):
            send(channel, member.user, f"m{i}")
        res = member.client.get(url(f"channels/{channel.id}/messages/"), {"limit": 3})
        assert _texts(res) == ["m0", "m1", "m2"] and res.data["has_more"] is False

    def test_scrolling_back_with_before(self, member, channel, five, url):
        messages = url(f"channels/{channel.id}/messages/")
        first = member.client.get(messages, {"limit": 2})
        assert _texts(first) == ["m4", "m5"] and first.data["has_more"] is True
        second = member.client.get(messages, {"limit": 2, "before": first.data["results"][0]["id"]})
        assert _texts(second) == ["m2", "m3"] and second.data["has_more"] is True
        last = member.client.get(messages, {"limit": 2, "before": second.data["results"][0]["id"]})
        assert _texts(last) == ["m1"] and last.data["has_more"] is False

    def test_catching_up_with_after(self, member, channel, five, url):
        messages = url(f"channels/{channel.id}/messages/")
        res = member.client.get(messages, {"limit": 2, "after": str(five[1].id)})
        assert _texts(res) == ["m3", "m4"] and res.data["has_more"] is True
        res = member.client.get(messages, {"limit": 2, "after": str(five[3].id)})
        assert _texts(res) == ["m5"] and res.data["has_more"] is False
        res = member.client.get(messages, {"after": str(five[4].id)})
        assert res.data == {"results": [], "has_more": False}

    def test_same_timestamp_is_ordered_by_id(self, member, channel, five, url):
        Message.objects.filter(channel=channel).update(created_at=five[0].created_at)
        by_id = sorted(five, key=lambda m: m.id)
        messages = url(f"channels/{channel.id}/messages/")
        res = member.client.get(messages, {"after": str(by_id[1].id)})
        assert [str(row["id"]) for row in res.data["results"]] == [str(m.id) for m in by_id[2:]]
        res = member.client.get(messages, {"before": str(by_id[2].id)})
        assert [str(row["id"]) for row in res.data["results"]] == [str(m.id) for m in by_id[:2]]

    def test_before_and_after_together_is_400(self, member, channel, five, url):
        res = member.client.get(
            url(f"channels/{channel.id}/messages/"), {"before": str(five[3].id), "after": str(five[1].id)}
        )
        assert res.status_code == 400 and res.data == {"error": "Pass either before or after, not both."}

    @pytest.mark.parametrize("params", [{"limit": 0}, {"limit": 101}, {"limit": "x"}, {"before": "x"}, {"after": "x"}])
    def test_bad_params_are_400(self, member, channel, five, url, params):
        assert member.client.get(url(f"channels/{channel.id}/messages/"), params).status_code == 400

    def test_cursor_must_be_in_the_same_list(self, member, channel, five, make_channel, send, url):
        elsewhere = send(make_channel(members=[member.user]), member.user)
        reply = send(channel, member.user, "reply", parent=five[0])
        for cursor in (elsewhere.id, reply.id, uuid4()):
            res = member.client.get(url(f"channels/{channel.id}/messages/"), {"before": str(cursor)})
            assert res.status_code == 400

    def test_removed_messages_are_tombstones_and_valid_cursors(self, member, channel, five, url):
        five[2].remove()
        res = member.client.get(url(f"channels/{channel.id}/messages/"))
        tombstone = res.data["results"][2]
        assert tombstone["id"] == five[2].id and tombstone["removed_at"] is not None
        assert (tombstone["body_html"], tombstone["body_json"], tombstone["body_stripped"]) == ("", {}, "")
        res = member.client.get(url(f"channels/{channel.id}/messages/"), {"after": str(five[2].id)})
        assert _texts(res) == ["m4", "m5"]

    def test_replies_stay_out_of_the_channel_and_page_by_thread(self, member, channel, five, send, url):
        replies = [send(channel, member.user, f"r{i}", parent=five[0]) for i in range(3)]
        res = member.client.get(url(f"channels/{channel.id}/messages/"))
        assert _texts(res) == ["m1", "m2", "m3", "m4", "m5"]
        assert res.data["results"][0]["reply_count"] == 3 and res.data["results"][1]["reply_count"] == 0
        assert res.data["results"][0]["last_reply_at"] is not None

        thread = url(f"channels/{channel.id}/messages/{five[0].id}/replies/")
        res = member.client.get(thread, {"limit": 2})
        assert _texts(res) == ["r1", "r2"] and res.data["has_more"] is True
        res = member.client.get(thread, {"before": str(replies[1].id)})
        assert _texts(res) == ["r0"] and res.data["has_more"] is False
        res = member.client.get(thread, {"after": str(replies[0].id), "limit": 1})
        assert _texts(res) == ["r1"] and res.data["has_more"] is True
        assert member.client.get(thread, {"after": str(five[1].id)}).status_code == 400

    def test_replies_of_a_reply_or_another_channel_are_404(self, member, channel, five, make_channel, send, url):
        reply = send(channel, member.user, "reply", parent=five[0])
        assert member.client.get(url(f"channels/{channel.id}/messages/{reply.id}/replies/")).status_code == 404
        elsewhere = send(make_channel(members=[member.user]), member.user)
        assert member.client.get(url(f"channels/{channel.id}/messages/{elsewhere.id}/replies/")).status_code == 404


@pytest.mark.contract
@pytest.mark.django_db
class TestSend:
    def test_member_sends_as_themselves(self, member, channel, url):
        res = member.client.post(
            url(f"channels/{channel.id}/messages/"),
            {
                "body_html": "<p>Hi <script>x()</script><b>all</b></p>",
                "body_json": {"type": "doc"},
                "sender_agent": "maia",
            },
            format="json",
        )
        assert res.status_code == 201
        assert res.data["sender"] == member.user.id and res.data["sender_agent"] is None
        assert "<script>" not in res.data["body_html"] and res.data["body_stripped"] == "Hi all"
        assert res.data["body_json"] == {"type": "doc"} and res.data["reply_count"] == 0

    def test_mention_only_message_is_not_empty(self, member, channel, url):
        mention = f'<mention-component entity_identifier="{member.user.id}" entity_name="user_mention">'
        body = f"<p>{mention}</mention-component></p>"
        res = member.client.post(url(f"channels/{channel.id}/messages/"), {"body_html": body}, format="json")
        assert res.status_code == 201

    @pytest.mark.parametrize(
        "body",
        [
            "",
            "<p></p>",
            "<p> &nbsp; <br></p>",
            "<script>x()</script>",
            # What packages/editor produces for an empty composer.
            '<p class="editor-paragraph-block"></p>',
            '<p class="editor-paragraph-block"><br class="ProseMirror-trailingBreak"></p>',
        ],
    )
    def test_empty_message_is_400(self, member, channel, url, body):
        assert (
            member.client.post(url(f"channels/{channel.id}/messages/"), {"body_html": body}, format="json").status_code
            == 400
        )

    @pytest.mark.parametrize(
        "body_json",
        [{"text": "nul \u0000 byte"}, {"nul \u0000 key": 1}, {"content": [{"text": "lone \ud800 surrogate"}]}],
    )
    def test_json_postgres_cannot_store_is_400(self, member, channel, url, body_json):
        # Encoded by hand: the test client's renderer refuses a lone surrogate before it is sent.
        payload = json.dumps({"body_html": "<p>hi</p>", "body_json": body_json})
        res = member.client.post(url(f"channels/{channel.id}/messages/"), payload, content_type="application/json")
        assert res.status_code == 400

    def test_text_that_only_looks_like_an_escape_is_fine(self, member, channel, url):
        body_json = {"text": "a literal \\u0000 in a code sample"}
        res = member.client.post(
            url(f"channels/{channel.id}/messages/"), {"body_html": "<p>hi</p>", "body_json": body_json}, format="json"
        )
        assert res.status_code == 201

    def test_too_long_is_400(self, member, channel, url):
        body = "<p>" + "a" * 40_000 + "</p>"
        assert (
            member.client.post(url(f"channels/{channel.id}/messages/"), {"body_html": body}, format="json").status_code
            == 400
        )

    def test_reply(self, member, channel, five, url):
        res = member.client.post(
            url(f"channels/{channel.id}/messages/"),
            {"body_html": "<p>re</p>", "parent_id": str(five[0].id)},
            format="json",
        )
        assert res.status_code == 201 and res.data["parent"] == five[0].id

    def test_bad_parent_is_400(self, member, channel, five, make_channel, send, url):
        reply = send(channel, member.user, "reply", parent=five[0])
        elsewhere = send(make_channel(members=[member.user]), member.user)
        for parent in (reply.id, elsewhere.id, uuid4()):
            res = member.client.post(
                url(f"channels/{channel.id}/messages/"),
                {"body_html": "<p>x</p>", "parent_id": str(parent)},
                format="json",
            )
            assert res.status_code == 400
        assert not Message.objects.filter(body_stripped="x").exists()

    def test_guest_in_the_channel_can_send(self, guest, make_channel, url):
        channel = make_channel(members=[guest.user])
        assert (
            guest.client.post(
                url(f"channels/{channel.id}/messages/"), {"body_html": "<p>x</p>"}, format="json"
            ).status_code
            == 201
        )

    def test_refused(self, admin, member, member2, guest, workspace, make_channel, foreign_channel, outsider, url):
        body = {"body_html": "<p>x</p>"}
        public = make_channel()
        # A public channel can be read without joining, but not written to.
        assert member.client.post(url(f"channels/{public.id}/messages/"), body, format="json").status_code == 403
        assert guest.client.post(url(f"channels/{public.id}/messages/"), body, format="json").status_code == 404
        private = make_channel(ChannelKind.PRIVATE, members=[member2.user])
        assert admin.client.post(url(f"channels/{private.id}/messages/"), body, format="json").status_code == 404
        dm, _ = Channel.objects.get_or_create_dm(workspace, member.user, member2.user)
        assert admin.client.post(url(f"channels/{dm.id}/messages/"), body, format="json").status_code == 404
        assert (
            admin.client.post(url(f"channels/{foreign_channel.id}/messages/"), body, format="json").status_code == 404
        )
        joined = make_channel(members=[member.user])
        assert outsider.client.post(url(f"channels/{joined.id}/messages/"), body, format="json").status_code == 403
        assert not Message.objects.exists()

    def test_archived_channel_is_read_only(self, member, channel, five, url):
        channel.archived_at = channel.created_at
        channel.save()
        res = member.client.post(url(f"channels/{channel.id}/messages/"), {"body_html": "<p>x</p>"}, format="json")
        assert res.status_code == 409
        assert member.client.get(url(f"channels/{channel.id}/messages/")).status_code == 200


@pytest.mark.contract
@pytest.mark.django_db
class TestEdit:
    def test_sender_edits(self, member, channel, five, url):
        res = member.client.patch(
            url(f"channels/{channel.id}/messages/{five[0].id}/"), {"body_html": "<p>fixed</p>"}, format="json"
        )
        assert res.status_code == 200 and res.data["body_stripped"] == "fixed" and res.data["edited_at"] is not None
        assert res.data["parent"] is None

    def test_edit_cannot_move_a_message_into_a_thread(self, member, channel, five, url):
        target = url(f"channels/{channel.id}/messages/{five[1].id}/")
        res = member.client.patch(target, {"body_html": "<p>x</p>", "parent_id": str(five[0].id)}, format="json")
        assert res.status_code == 200 and res.data["parent"] is None

    def test_only_the_sender(self, admin, member2, channel, five, url):
        channel.members.create(user=member2.user, role="admin")
        target = url(f"channels/{channel.id}/messages/{five[0].id}/")
        for actor in (member2, admin):  # a channel admin, a workspace admin
            assert actor.client.patch(target, {"body_html": "<p>x</p>"}, format="json").status_code == 403

    def test_refused(self, member, channel, five, url):
        target = url(f"channels/{channel.id}/messages/{five[0].id}/")
        assert member.client.patch(target, {"body_html": "<p></p>"}, format="json").status_code == 400
        assert member.client.patch(target, {}, format="json").status_code == 400
        five[0].remove()
        assert member.client.patch(target, {"body_html": "<p>x</p>"}, format="json").status_code == 409
        channel.archived_at = channel.created_at
        channel.save()
        archived = url(f"channels/{channel.id}/messages/{five[1].id}/")
        assert member.client.patch(archived, {"body_html": "<p>x</p>"}, format="json").status_code == 409

    def test_sender_who_left_a_public_channel_cannot_edit(self, member, channel, five, url):
        channel.members.filter(user=member.user).delete()
        target = url(f"channels/{channel.id}/messages/{five[0].id}/")
        assert member.client.patch(target, {"body_html": "<p>x</p>"}, format="json").status_code == 403
        five[0].refresh_from_db()
        assert five[0].edited_at is None

    def test_hidden_channel_is_404(self, member, member2, make_channel, send, url):
        private = make_channel(ChannelKind.PRIVATE, members=[member2.user])
        message = send(private, member2.user)
        private.members.filter(user=member2.user).delete()
        target = url(f"channels/{private.id}/messages/{message.id}/")
        # member2 left: their own message's channel is now hidden from them.
        for actor in (member2, member):
            assert actor.client.patch(target, {"body_html": "<p>x</p>"}, format="json").status_code == 404


@pytest.mark.contract
@pytest.mark.django_db
class TestRemove:
    def test_sender_removes_and_replies_survive(self, member, channel, five, send, url):
        reply = send(channel, member.user, "reply", parent=five[0])
        assert member.client.delete(url(f"channels/{channel.id}/messages/{five[0].id}/")).status_code == 204
        removed = Message.objects.get(pk=five[0].pk)  # still there, not soft deleted
        assert removed.removed_at is not None and removed.deleted_at is None and removed.body_html == ""
        assert Message.objects.filter(pk=reply.pk, parent=removed).exists()
        assert member.client.delete(url(f"channels/{channel.id}/messages/{five[0].id}/")).status_code == 204

    def test_channel_admin_and_workspace_admin_moderate(self, admin, member, member2, channel, five, url):
        channel.members.create(user=member2.user, role="admin")
        assert member2.client.delete(url(f"channels/{channel.id}/messages/{five[0].id}/")).status_code == 204
        # The workspace admin isn't in this public channel but can see it.
        assert admin.client.delete(url(f"channels/{channel.id}/messages/{five[1].id}/")).status_code == 204

    def test_refused(self, admin, member, member2, workspace, channel, five, send, url):
        channel.members.create(user=member2.user)
        assert member2.client.delete(url(f"channels/{channel.id}/messages/{five[0].id}/")).status_code == 403
        dm, _ = Channel.objects.get_or_create_dm(workspace, member.user, member2.user)
        in_dm = send(dm, member.user)
        assert admin.client.delete(url(f"channels/{dm.id}/messages/{in_dm.id}/")).status_code == 404
        assert Message.objects.filter(removed_at__isnull=False).count() == 0
        channel.archived_at = channel.created_at
        channel.save()
        assert member.client.delete(url(f"channels/{channel.id}/messages/{five[0].id}/")).status_code == 409

    def test_sender_who_left_a_public_channel_cannot_remove(self, member, channel, five, url):
        channel.members.filter(user=member.user).delete()
        assert member.client.delete(url(f"channels/{channel.id}/messages/{five[0].id}/")).status_code == 403
        five[0].refresh_from_db()
        assert five[0].removed_at is None

    def test_other_workspace(self, admin, outsider, other_workspace, foreign_channel, channel, five, send, url):
        foreign = send(foreign_channel, other_workspace.owner)
        assert admin.client.delete(url(f"channels/{foreign_channel.id}/messages/{foreign.id}/")).status_code == 404
        assert admin.client.delete(url(f"channels/{channel.id}/messages/{foreign.id}/")).status_code == 404
        assert outsider.client.delete(url(f"channels/{channel.id}/messages/{five[0].id}/")).status_code == 403
        assert not Message.objects.filter(removed_at__isnull=False).exists()


@pytest.mark.contract
@pytest.mark.django_db(transaction=True)
class TestEditDuringRemoval:
    def test_a_removal_during_an_edit_is_not_undone(self, member, channel, five, url):
        """Two connections: the removal lands while the edit is validating, and must still win."""
        target = five[0]
        validating, removal_finished = threading.Event(), threading.Event()
        real_is_valid = MessageEditSerializer.is_valid

        def pause_while_validating(serializer, *args, **kwargs):
            validating.set()
            removal_finished.wait(timeout=1)  # Long enough for an unguarded removal to land first.
            return real_is_valid(serializer, *args, **kwargs)

        def remove():
            try:
                validating.wait(timeout=10)
                Message.objects.get(pk=target.pk).remove()
            finally:
                removal_finished.set()
                connection.close()

        remover = threading.Thread(target=remove)
        remover.start()
        with mock.patch.object(MessageEditSerializer, "is_valid", pause_while_validating):
            member.client.patch(
                url(f"channels/{channel.id}/messages/{target.id}/"), {"body_html": "<p>edited</p>"}, format="json"
            )
        remover.join(timeout=10)

        target.refresh_from_db()
        assert target.removed_at is not None
        assert (target.body_html, target.body_stripped, target.body_json) == ("", "", {})
