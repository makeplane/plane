# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""A guest's DM grant ends when they stop being an active guest, and channel seats when they leave the workspace."""

import pytest

from plane.chat.models import Channel, ChannelKind, ChannelMember, ChatGuestPermission
from plane.db.models import WorkspaceMember
from plane.tests.factories import WorkspaceFactory

GUEST, MEMBER = 5, 15


@pytest.fixture
def guest_membership(workspace, make_member):
    user = make_member(role=GUEST)
    ChatGuestPermission.objects.create(workspace=workspace, user=user, can_open_dms=True)
    return WorkspaceMember.objects.get(workspace=workspace, member=user)


def _granted(membership):
    return ChatGuestPermission.objects.filter(
        workspace_id=membership.workspace_id, user_id=membership.member_id, can_open_dms=True
    ).exists()


@pytest.mark.unit
@pytest.mark.django_db
class TestRevokeGuestGrants:
    def test_promotion_revokes_and_demotion_does_not_restore(self, guest_membership):
        guest_membership.role = MEMBER
        guest_membership.save(update_fields=["role", "updated_at"])
        assert not _granted(guest_membership)
        guest_membership.role = GUEST
        guest_membership.save()
        assert not _granted(guest_membership)

    def test_deactivation_revokes(self, guest_membership):
        guest_membership.is_active = False
        guest_membership.save()
        assert not _granted(guest_membership)

    def test_removal_revokes(self, guest_membership):
        guest_membership.delete()
        assert not _granted(guest_membership)

    def test_other_saves_keep_the_grant(self, guest_membership):
        guest_membership.view_props = {"x": 1}
        guest_membership.save(update_fields=["view_props"])
        guest_membership.save()
        assert _granted(guest_membership)

    def test_only_that_workspace(self, guest_membership, make_member):
        elsewhere = WorkspaceFactory()
        WorkspaceMember.objects.create(workspace=elsewhere, member=guest_membership.member, role=MEMBER)
        assert _granted(guest_membership)


@pytest.mark.unit
@pytest.mark.django_db
class TestLeavingTheWorkspace:
    @pytest.fixture
    def membership(self, workspace, make_member):
        user = make_member(role=MEMBER)
        return WorkspaceMember.objects.get(workspace=workspace, member=user)

    @pytest.fixture
    def seats(self, workspace, make_member, membership):
        """`membership`'s user in a public channel, a private channel and a DM."""
        user = membership.member
        public = Channel.objects.create(workspace=workspace, kind=ChannelKind.PUBLIC, name="general")
        private = Channel.objects.create(workspace=workspace, kind=ChannelKind.PRIVATE, name="secret")
        for channel in (public, private):
            ChannelMember.objects.create(channel=channel, user=user)
        dm, _ = Channel.objects.get_or_create_dm(workspace, user, make_member())
        return public, private, dm

    def _channels_of(self, user):
        return set(ChannelMember.objects.filter(user=user).values_list("channel_id", flat=True))

    def test_deactivation_ends_named_channels_but_not_dms(self, membership, seats):
        membership.is_active = False
        membership.save()
        assert self._channels_of(membership.member) == {seats[2].id}

    def test_removal_ends_named_channels_but_not_dms(self, membership, seats):
        membership.delete()
        assert self._channels_of(membership.member) == {seats[2].id}

    def test_role_changes_and_other_saves_keep_channels(self, membership, seats):
        membership.role = GUEST
        membership.save(update_fields=["role", "updated_at"])
        membership.view_props = {"x": 1}
        membership.save()
        assert self._channels_of(membership.member) == {channel.id for channel in seats}

    def test_only_that_workspace(self, membership, seats):
        elsewhere = WorkspaceFactory()
        WorkspaceMember.objects.create(workspace=elsewhere, member=membership.member, role=MEMBER)
        other = Channel.objects.create(workspace=elsewhere, kind=ChannelKind.PUBLIC, name="general")
        ChannelMember.objects.create(channel=other, user=membership.member)

        membership.is_active = False
        membership.save()

        assert self._channels_of(membership.member) == {seats[2].id, other.id}

    def test_account_deactivation_ends_channels_and_grants_everywhere(self, workspace, membership, seats):
        """Plane deactivates the memberships with `bulk_update`, which sends no signal, then saves the user."""
        user = membership.member
        ChatGuestPermission.objects.create(workspace=workspace, user=user, can_open_dms=True)

        user.is_active = False
        user.save()

        assert self._channels_of(user) == {seats[2].id}
        assert not _granted(membership)

    def test_other_saves_of_the_user_change_nothing(self, workspace, membership, seats):
        user = membership.member
        ChatGuestPermission.objects.create(workspace=workspace, user=user, can_open_dms=True)

        user.first_name = "Renamed"
        user.save()

        assert self._channels_of(user) == {channel.id for channel in seats}
        assert _granted(membership)
