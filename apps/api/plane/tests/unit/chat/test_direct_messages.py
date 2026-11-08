# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""DMs have exactly 2 members, group DMs a fixed set, and neither is ever duplicated."""

import threading
from unittest import mock

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, connection, transaction

from plane.chat.models import GROUP_DM_MAX_MEMBERS, Channel, ChannelKind, ChannelMember
from plane.tests.factories import UserFactory, WorkspaceFactory


def _member_ids(channel):
    return set(channel.members.values_list("user_id", flat=True))


def channel_member_count(channel):
    return ChannelMember.objects.filter(channel=channel).count()


@pytest.mark.unit
@pytest.mark.django_db
class TestGetOrCreateDm:
    def test_creates_a_dm_with_exactly_both_members(self, workspace, make_member):
        alice, bob = make_member(), make_member()

        channel, created = Channel.objects.get_or_create_dm(workspace, alice, bob)

        assert created
        assert channel.kind == ChannelKind.DM
        assert channel.name == ""
        assert _member_ids(channel) == {alice.pk, bob.pk}
        assert all(m.workspace_id == workspace.pk for m in channel.members.all())

    def test_returns_the_same_dm_whichever_user_starts_it(self, workspace, make_member):
        alice, bob = make_member(), make_member()
        first, _ = Channel.objects.get_or_create_dm(workspace, alice, bob)

        second, created = Channel.objects.get_or_create_dm(workspace, bob, alice)

        assert not created
        assert second.pk == first.pk
        assert Channel.objects.filter(workspace=workspace, kind=ChannelKind.DM).count() == 1
        assert channel_member_count(first) == 2

    def test_same_pair_gets_a_separate_dm_in_another_workspace(self, workspace, make_member):
        alice, bob = make_member(), make_member()
        other = WorkspaceFactory()
        make_member(in_workspace=other, member=alice)
        make_member(in_workspace=other, member=bob)

        here, _ = Channel.objects.get_or_create_dm(workspace, alice, bob)
        there, created = Channel.objects.get_or_create_dm(other, alice, bob)

        assert created
        assert there.pk != here.pk

    def test_rejects_a_dm_with_yourself(self, workspace, make_member):
        alice = make_member()
        with pytest.raises(ValidationError):
            Channel.objects.get_or_create_dm(workspace, alice, alice)

    def test_rejects_users_outside_the_workspace(self, workspace, make_member):
        alice = make_member()
        with pytest.raises(ValidationError):
            Channel.objects.get_or_create_dm(workspace, alice, UserFactory())
        assert not Channel.objects.exists()

    def test_rejects_inactive_workspace_members(self, workspace, make_member):
        alice, gone = make_member(), make_member(is_active=False)
        with pytest.raises(ValidationError):
            Channel.objects.get_or_create_dm(workspace, alice, gone)

    def test_rejects_a_third_member(self, workspace, make_member):
        alice, bob, carol = make_member(), make_member(), make_member()
        channel, _ = Channel.objects.get_or_create_dm(workspace, alice, bob)

        with pytest.raises(ValidationError):
            ChannelMember.objects.create(channel=channel, user=carol)
        assert channel_member_count(channel) == 2

    def test_database_rejects_a_duplicate_dm_key(self, workspace, make_member):
        alice, bob = make_member(), make_member()
        channel, _ = Channel.objects.get_or_create_dm(workspace, alice, bob)

        with pytest.raises(IntegrityError), transaction.atomic():
            Channel.objects.create(workspace=workspace, kind=ChannelKind.DM, dm_key=channel.dm_key)

    def test_database_rejects_a_member_twice(self, workspace, make_member):
        alice, bob = make_member(), make_member()
        channel, _ = Channel.objects.get_or_create_dm(workspace, alice, bob)

        with pytest.raises(IntegrityError), transaction.atomic():
            ChannelMember.objects.create(channel=channel, user=alice)

    def test_restores_a_member_whose_row_was_soft_deleted(self, workspace, make_member):
        alice, bob = make_member(), make_member()
        channel, _ = Channel.objects.get_or_create_dm(workspace, alice, bob)
        channel.members.get(user=bob).delete()

        again, created = Channel.objects.get_or_create_dm(workspace, alice, bob)

        assert not created
        assert again.pk == channel.pk
        assert _member_ids(again) == {alice.pk, bob.pk}

    def test_soft_deleted_dm_is_replaced_by_a_new_one(self, workspace, make_member):
        alice, bob = make_member(), make_member()
        old, _ = Channel.objects.get_or_create_dm(workspace, alice, bob)
        old.delete()

        new, created = Channel.objects.get_or_create_dm(workspace, alice, bob)

        assert created
        assert new.pk != old.pk


@pytest.mark.unit
@pytest.mark.django_db
class TestGetOrCreateGroupDm:
    def test_same_people_always_get_the_same_group_dm(self, workspace, make_member):
        alice, bob, carol = make_member(), make_member(), make_member()
        first, created = Channel.objects.get_or_create_group_dm(workspace, [alice, bob, carol])

        second, created_again = Channel.objects.get_or_create_group_dm(workspace, [carol, alice, bob])

        assert created and not created_again
        assert second.pk == first.pk
        assert first.kind == ChannelKind.GROUP_DM
        assert _member_ids(first) == {alice.pk, bob.pk, carol.pk}

    def test_a_different_set_of_people_gets_a_different_group_dm(self, workspace, make_member):
        alice, bob, carol, dave = (make_member() for _ in range(4))
        first, _ = Channel.objects.get_or_create_group_dm(workspace, [alice, bob, carol])

        second, created = Channel.objects.get_or_create_group_dm(workspace, [alice, bob, carol, dave])

        assert created
        assert second.pk != first.pk

    def test_membership_is_fixed(self, workspace, make_member):
        alice, bob, carol, dave = (make_member() for _ in range(4))
        channel, _ = Channel.objects.get_or_create_group_dm(workspace, [alice, bob, carol])

        with pytest.raises(ValidationError):
            ChannelMember.objects.create(channel=channel, user=dave)

    @pytest.mark.parametrize("size", [2, GROUP_DM_MAX_MEMBERS + 1])
    def test_rejects_the_wrong_number_of_members(self, workspace, make_member, size):
        users = [make_member() for _ in range(size)]
        with pytest.raises(ValidationError):
            Channel.objects.get_or_create_group_dm(workspace, users)

    def test_rejects_duplicate_users(self, workspace, make_member):
        alice, bob = make_member(), make_member()
        with pytest.raises(ValidationError):
            Channel.objects.get_or_create_group_dm(workspace, [alice, bob, alice])


@pytest.mark.unit
@pytest.mark.django_db
class TestOpeningAtTheSameTime:
    def test_a_failed_member_insert_leaves_no_channel(self, workspace, make_member):
        alice, bob = make_member(), make_member()
        with mock.patch.object(ChannelMember, "save", side_effect=RuntimeError("boom")):
            with pytest.raises(RuntimeError):
                Channel.objects.get_or_create_dm(workspace, alice, bob)
        assert not Channel.objects.filter(workspace=workspace).exists()


@pytest.mark.unit
@pytest.mark.django_db(transaction=True)
class TestLosingTheRace:
    def test_someone_else_adding_the_member_first_is_not_an_error(self, workspace, make_member):
        alice, bob = make_member(), make_member()
        channel, _ = Channel.objects.get_or_create_dm(workspace, alice, bob)
        ChannelMember.objects.filter(channel=channel).delete()

        real_save = ChannelMember.save
        raced = []

        def commit_a_competing_row(user_id):
            try:
                ChannelMember.objects.bulk_create(
                    [ChannelMember(channel=channel, workspace=workspace, user_id=user_id)]
                )
            finally:
                connection.close()

        def save_after_someone_else_got_there(member, *args, **kwargs):
            if not raced:
                raced.append(member.user_id)
                # On its own connection, so it is committed and survives this save's rollback, as a real rival's is.
                rival = threading.Thread(target=commit_a_competing_row, args=(member.user_id,))
                rival.start()
                rival.join(timeout=10)
            return real_save(member, *args, **kwargs)

        with mock.patch.object(ChannelMember, "save", save_after_someone_else_got_there):
            again, created = Channel.objects.get_or_create_dm(workspace, alice, bob)

        assert raced and again.id == channel.id and created is False
        assert _member_ids(channel) == {alice.id, bob.id}
