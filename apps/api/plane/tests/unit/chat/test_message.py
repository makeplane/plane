# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Message senders, threads, removal, and work item references."""

import pytest
from crum import impersonate
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from plane.chat.models import Channel, ChannelKind, Message, MessageReference
from plane.tests.factories import WorkspaceFactory


@pytest.fixture
def channel(workspace):
    return Channel.objects.create(workspace=workspace, kind=ChannelKind.PUBLIC, name="general")


@pytest.fixture
def alice(make_member):
    return make_member()


@pytest.mark.unit
@pytest.mark.django_db
class TestMessageSender:
    def test_user_sender(self, channel, alice):
        message = Message.objects.create(channel=channel, sender=alice, body_html="<p>Hi <b>all</b></p>")
        assert message.workspace_id == channel.workspace_id
        assert message.body_stripped == "Hi all"

    def test_agent_sender(self, channel):
        assert Message.objects.create(channel=channel, sender_agent="maia").pk

    @pytest.mark.parametrize("agent", [None, ""])
    def test_requires_a_sender(self, channel, agent):
        with pytest.raises(IntegrityError), transaction.atomic():
            Message.objects.create(channel=channel, sender_agent=agent)

    def test_rejects_both_a_user_and_an_agent(self, channel, alice):
        with pytest.raises(IntegrityError), transaction.atomic():
            Message.objects.create(channel=channel, sender=alice, sender_agent="maia")


@pytest.mark.unit
@pytest.mark.django_db
class TestThreads:
    def test_reply(self, channel, alice):
        root = Message.objects.create(channel=channel, sender=alice)
        reply = Message.objects.create(channel=channel, sender=alice, parent=root)
        assert list(root.replies.all()) == [reply]

    def test_reply_must_be_in_the_parents_channel(self, workspace, channel, alice):
        other = Channel.objects.create(workspace=workspace, kind=ChannelKind.PUBLIC, name="random")
        root = Message.objects.create(channel=channel, sender=alice)
        with pytest.raises(ValidationError):
            Message.objects.create(channel=other, sender=alice, parent=root)

    def test_replies_cannot_nest(self, channel, alice):
        root = Message.objects.create(channel=channel, sender=alice)
        reply = Message.objects.create(channel=channel, sender=alice, parent=root)
        with pytest.raises(ValidationError):
            Message.objects.create(channel=channel, sender=alice, parent=reply)

    def test_removing_a_message_keeps_its_thread(self, channel, alice, make_issue):
        root = Message.objects.create(channel=channel, sender=alice, body_html="<p>EMP-1 is broken</p>")
        reply = Message.objects.create(channel=channel, sender=alice, parent=root)
        MessageReference.objects.create(message=root, issue=make_issue())

        root.remove()

        root.refresh_from_db()
        assert root.removed_at is not None
        assert (root.body_html, root.body_json, root.body_stripped) == ("", {}, "")
        assert Message.objects.filter(pk=root.pk).exists()
        assert list(root.replies.all()) == [reply]
        assert not root.references.exists()


@pytest.mark.unit
@pytest.mark.django_db
class TestMessageReference:
    def test_a_work_item_is_referenced_once_per_message(self, channel, alice, make_issue):
        message = Message.objects.create(channel=channel, sender=alice)
        issue = make_issue()
        reference = MessageReference.objects.create(message=message, issue=issue)
        assert reference.workspace_id == channel.workspace_id

        with pytest.raises(IntegrityError), transaction.atomic():
            MessageReference.objects.create(message=message, issue=issue)

    def test_rejects_a_work_item_from_another_workspace(self, channel, alice, make_issue):
        message = Message.objects.create(channel=channel, sender=alice)
        with pytest.raises(ValidationError):
            MessageReference.objects.create(message=message, issue=make_issue(in_workspace=WorkspaceFactory()))


@pytest.mark.unit
@pytest.mark.django_db
class TestRemovalAudit:
    def test_remove_records_who_removed_it(self, channel, alice, make_member):
        moderator = make_member()
        message = Message.objects.create(channel=channel, sender=alice, body_html="<p>hi</p>")
        with impersonate(moderator):
            message.remove()
        message.refresh_from_db()
        assert message.updated_by_id == moderator.id
