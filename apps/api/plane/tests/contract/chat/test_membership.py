# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""join/, leave/, members/ and members/<user_id>/."""

import pytest

from plane.chat.models import Channel, ChannelKind, ChannelMember
from plane.db.models import WorkspaceMember


def _member_ids(response):
    return {str(row["user"]) for row in response.data}


@pytest.fixture
def dm(workspace, member, member2):
    return Channel.objects.get_or_create_dm(workspace, member.user, member2.user)[0]


@pytest.mark.contract
@pytest.mark.django_db
class TestJoin:
    def test_member_joins_a_public_channel(self, member, make_channel, url):
        channel = make_channel()
        res = member.client.post(url(f"channels/{channel.id}/join/"))
        assert res.status_code == 201 and res.data["is_member"] is True and res.data["my_role"] == "member"
        assert member.client.post(url(f"channels/{channel.id}/join/")).status_code == 200  # already in

    def test_cannot_join_what_you_cannot_see(self, member, member2, guest, dm, make_channel, foreign_channel, url):
        private = make_channel(ChannelKind.PRIVATE, members=[member2.user])
        assert member.client.post(url(f"channels/{private.id}/join/")).status_code == 404
        assert guest.client.post(url(f"channels/{dm.id}/join/")).status_code == 404
        assert guest.client.post(url(f"channels/{make_channel().id}/join/")).status_code == 404
        assert member.client.post(url(f"channels/{foreign_channel.id}/join/")).status_code == 404
        assert not ChannelMember.objects.filter(user=guest.user).exists()
        assert not ChannelMember.objects.filter(user=member.user).exclude(channel=dm).exists()

    def test_archived_channel_cannot_be_joined(self, member, make_channel, url):
        channel = make_channel()
        channel.archived_at = channel.created_at
        channel.save()
        assert member.client.post(url(f"channels/{channel.id}/join/")).status_code == 409

    def test_outsider_is_refused(self, outsider, make_channel, url):
        assert outsider.client.post(url(f"channels/{make_channel().id}/join/")).status_code == 403


@pytest.mark.contract
@pytest.mark.django_db
class TestLeave:
    def test_leave_and_rejoin(self, member, make_channel, url):
        channel = make_channel(members=[member.user])
        assert member.client.post(url(f"channels/{channel.id}/leave/")).status_code == 204
        assert member.client.get(url(f"channels/{channel.id}/")).data["is_member"] is False
        assert member.client.post(url(f"channels/{channel.id}/leave/")).status_code == 204  # idempotent
        assert member.client.post(url(f"channels/{channel.id}/join/")).status_code == 201

    def test_leaving_a_private_channel_hides_it(self, member, make_channel, url):
        channel = make_channel(ChannelKind.PRIVATE, members=[member.user])
        assert member.client.post(url(f"channels/{channel.id}/leave/")).status_code == 204
        assert member.client.get(url(f"channels/{channel.id}/")).status_code == 404

    def test_dm_cannot_be_left(self, member, dm, url):
        assert member.client.post(url(f"channels/{dm.id}/leave/")).status_code == 409
        assert ChannelMember.objects.filter(channel=dm, user=member.user).exists()

    def test_refused(self, member, member2, outsider, make_channel, foreign_channel, url):
        private = make_channel(ChannelKind.PRIVATE, members=[member2.user])
        assert member.client.post(url(f"channels/{private.id}/leave/")).status_code == 404
        assert member.client.post(url(f"channels/{foreign_channel.id}/leave/")).status_code == 404
        assert outsider.client.post(url(f"channels/{private.id}/leave/")).status_code == 403


@pytest.mark.contract
@pytest.mark.django_db
class TestMemberList:
    def test_anyone_who_can_see_the_channel(self, member, member2, make_channel, url):
        channel = make_channel(admins=[member2.user])
        res = member.client.get(url(f"channels/{channel.id}/members/"))
        assert res.status_code == 200 and _member_ids(res) == {str(member2.user.id)}
        assert res.data[0]["role"] == "admin"
        assert set(res.data[0]) == {"id", "channel", "user", "role", "created_at"}  # no read cursor

    def test_private_and_dm_members_are_hidden(self, admin, member, member2, guest, dm, make_channel, url):
        private = make_channel(ChannelKind.PRIVATE, members=[member2.user])
        assert member.client.get(url(f"channels/{private.id}/members/")).status_code == 404
        assert member2.client.get(url(f"channels/{private.id}/members/")).status_code == 200
        assert admin.client.get(url(f"channels/{dm.id}/members/")).status_code == 404
        assert _member_ids(member.client.get(url(f"channels/{dm.id}/members/"))) == {
            str(member.user.id),
            str(member2.user.id),
        }
        assert guest.client.get(url(f"channels/{make_channel().id}/members/")).status_code == 404

    def test_other_workspace(self, admin, outsider, foreign_channel, make_channel, url):
        assert admin.client.get(url(f"channels/{foreign_channel.id}/members/")).status_code == 404
        assert outsider.client.get(url(f"channels/{make_channel().id}/members/")).status_code == 403


@pytest.mark.contract
@pytest.mark.django_db
class TestMemberAdd:
    def test_any_member_adds_people_to_a_private_channel(self, member, member2, guest, make_channel, url):
        channel = make_channel(ChannelKind.PRIVATE, members=[member.user])
        ids = [str(member2.user.id), str(guest.user.id)]
        res = member.client.post(url(f"channels/{channel.id}/members/"), {"member_ids": ids}, format="json")
        assert res.status_code == 201 and _member_ids(res) == set(ids)
        assert {row["role"] for row in res.data} == {"member"}
        # The guest now sees it.
        assert guest.client.get(url(f"channels/{channel.id}/")).status_code == 200
        # Adding them again changes nothing.
        again = member.client.post(url(f"channels/{channel.id}/members/"), {"member_ids": ids}, format="json")
        assert again.status_code == 200 and again.data == []

    def test_refused(self, admin, member, member2, guest, dm, make_channel, url):
        public = make_channel()
        payload = {"member_ids": [str(guest.user.id)]}
        # Not in the public channel yet.
        assert member.client.post(url(f"channels/{public.id}/members/"), payload, format="json").status_code == 403
        private = make_channel(ChannelKind.PRIVATE, members=[member2.user])
        assert admin.client.post(url(f"channels/{private.id}/members/"), payload, format="json").status_code == 404
        assert member.client.post(url(f"channels/{dm.id}/members/"), payload, format="json").status_code == 409
        assert not ChannelMember.objects.filter(user=guest.user).exists()

    def test_only_active_workspace_members(self, member, outsider, make_channel, url):
        channel = make_channel(members=[member.user])
        payload = {"member_ids": [str(outsider.user.id)]}
        assert member.client.post(url(f"channels/{channel.id}/members/"), payload, format="json").status_code == 400
        empty = member.client.post(url(f"channels/{channel.id}/members/"), {"member_ids": []}, format="json")
        assert empty.status_code == 400

    def test_archived(self, member, member2, make_channel, url):
        channel = make_channel(members=[member.user])
        channel.archived_at = channel.created_at
        channel.save()
        payload = {"member_ids": [str(member2.user.id)]}
        assert member.client.post(url(f"channels/{channel.id}/members/"), payload, format="json").status_code == 409

    def test_other_workspace(self, admin, outsider, member, foreign_channel, make_channel, url):
        payload = {"member_ids": [str(member.user.id)]}
        assert (
            admin.client.post(url(f"channels/{foreign_channel.id}/members/"), payload, format="json").status_code == 404
        )
        channel = make_channel()
        assert outsider.client.post(url(f"channels/{channel.id}/members/"), payload, format="json").status_code == 403


@pytest.mark.contract
@pytest.mark.django_db
class TestMemberDetail:
    def test_channel_admin_changes_roles(self, member, member2, make_channel, url):
        channel = make_channel(admins=[member.user], members=[member2.user])
        target = url(f"channels/{channel.id}/members/{member2.user.id}/")
        res = member.client.patch(target, {"role": "admin"}, format="json")
        assert res.status_code == 200 and res.data["role"] == "admin"
        assert member.client.patch(target, {"role": "owner"}, format="json").status_code == 400

    def test_workspace_admin_moderates_a_public_channel_they_are_not_in(self, admin, member, make_channel, url):
        channel = make_channel(members=[member.user])
        target = url(f"channels/{channel.id}/members/{member.user.id}/")
        assert admin.client.patch(target, {"role": "admin"}, format="json").status_code == 200
        assert admin.client.delete(target).status_code == 204
        assert not ChannelMember.objects.filter(channel=channel, user=member.user).exists()

    def test_plain_member_cannot_manage_others(self, member, member2, make_channel, url):
        channel = make_channel(members=[member.user, member2.user])
        target = url(f"channels/{channel.id}/members/{member2.user.id}/")
        assert member.client.patch(target, {"role": "admin"}, format="json").status_code == 403
        assert member.client.delete(target).status_code == 403
        assert ChannelMember.objects.filter(channel=channel, user=member2.user).exists()

    def test_removing_yourself_is_leaving(self, member, dm, make_channel, url):
        channel = make_channel(members=[member.user])
        assert member.client.delete(url(f"channels/{channel.id}/members/{member.user.id}/")).status_code == 204
        assert member.client.delete(url(f"channels/{dm.id}/members/{member.user.id}/")).status_code == 409

    def test_refused(self, admin, member, member2, guest, dm, make_channel, url):
        channel = make_channel(admins=[member.user])
        missing = url(f"channels/{channel.id}/members/{guest.user.id}/")
        assert member.client.patch(missing, {"role": "admin"}, format="json").status_code == 404
        assert member.client.delete(missing).status_code == 404
        in_dm = url(f"channels/{dm.id}/members/{member2.user.id}/")
        assert member.client.patch(in_dm, {"role": "admin"}, format="json").status_code == 409
        assert member.client.delete(in_dm).status_code == 409
        private = make_channel(ChannelKind.PRIVATE, admins=[member2.user])
        assert admin.client.delete(url(f"channels/{private.id}/members/{member2.user.id}/")).status_code == 404

    def test_archived(self, member, member2, make_channel, url):
        channel = make_channel(admins=[member.user], members=[member2.user])
        channel.archived_at = channel.created_at
        channel.save()
        target = url(f"channels/{channel.id}/members/{member2.user.id}/")
        assert member.client.patch(target, {"role": "admin"}, format="json").status_code == 409
        assert member.client.delete(target).status_code == 409

    def test_other_workspace(self, admin, outsider, other_workspace, make_channel, foreign_channel, url):
        target = url(f"channels/{foreign_channel.id}/members/{other_workspace.owner_id}/")
        assert admin.client.delete(target).status_code == 404
        channel = make_channel(members=[admin.user])
        assert outsider.client.delete(url(f"channels/{channel.id}/members/{admin.user.id}/")).status_code == 403


@pytest.mark.contract
@pytest.mark.django_db
class TestLastPrivateChannelAdmin:
    """A private channel keeps an admin while anyone else is in it: workspace admins can't see it to rescue it."""

    LAST_ADMIN = {"error": "Make someone else a channel admin first; a private channel needs one."}

    def test_last_admin_cannot_leave_or_step_down(self, member, member2, make_channel, url):
        channel = make_channel(ChannelKind.PRIVATE, admins=[member.user], members=[member2.user])
        me = url(f"channels/{channel.id}/members/{member.user.id}/")
        for res in (
            member.client.post(url(f"channels/{channel.id}/leave/")),
            member.client.delete(me),
            member.client.patch(me, {"role": "member"}, format="json"),
        ):
            assert res.status_code == 409 and res.data == self.LAST_ADMIN
        assert ChannelMember.objects.get(channel=channel, user=member.user).role == "admin"

    def test_last_admin_cannot_be_removed_or_demoted_by_a_workspace_admin_in_the_channel(
        self, admin, member, make_channel, url
    ):
        channel = make_channel(ChannelKind.PRIVATE, admins=[member.user], members=[admin.user])
        target = url(f"channels/{channel.id}/members/{member.user.id}/")
        assert admin.client.patch(target, {"role": "member"}, format="json").status_code == 409
        assert admin.client.delete(target).status_code == 409
        assert ChannelMember.objects.get(channel=channel, user=member.user).role == "admin"

    def test_fine_once_someone_else_is_admin(self, member, member2, make_channel, url):
        channel = make_channel(ChannelKind.PRIVATE, admins=[member.user], members=[member2.user])
        promote = url(f"channels/{channel.id}/members/{member2.user.id}/")
        assert member.client.patch(promote, {"role": "admin"}, format="json").status_code == 200
        assert member.client.post(url(f"channels/{channel.id}/leave/")).status_code == 204

    def test_fine_when_nobody_else_is_left(self, member, make_channel, url):
        channel = make_channel(ChannelKind.PRIVATE, admins=[member.user])
        assert member.client.post(url(f"channels/{channel.id}/leave/")).status_code == 204

    def test_promoting_an_admin_again_is_fine(self, member, member2, make_channel, url):
        channel = make_channel(ChannelKind.PRIVATE, admins=[member.user], members=[member2.user])
        me = url(f"channels/{channel.id}/members/{member.user.id}/")
        assert member.client.patch(me, {"role": "admin"}, format="json").status_code == 200

    def test_public_channels_are_not_affected(self, member, member2, make_channel, url):
        channel = make_channel(admins=[member.user], members=[member2.user])
        assert member.client.post(url(f"channels/{channel.id}/leave/")).status_code == 204


@pytest.mark.contract
@pytest.mark.django_db
class TestLeavingTheWorkspace:
    def _remove_from_workspace(self, workspace, user):
        membership = WorkspaceMember.objects.get(workspace=workspace, member=user)
        membership.is_active = False
        membership.save()

    def test_invited_back_they_do_not_regain_a_private_channel(self, member, member2, workspace, make_channel, url):
        channel = make_channel(ChannelKind.PRIVATE, admins=[member2.user], members=[member.user])
        self._remove_from_workspace(workspace, member.user)
        # Accepting a new invite reactivates the row with `.update()`, as plane.app does.
        WorkspaceMember.objects.filter(workspace=workspace, member=member.user).update(is_active=True)

        assert member.client.get(url(f"channels/{channel.id}/")).status_code == 404

    def test_someone_gone_from_the_workspace_does_not_count_as_another_admin(
        self, member, member2, make_actor, workspace, make_channel, url
    ):
        stays = make_actor()
        channel = make_channel(ChannelKind.PRIVATE, admins=[member.user, member2.user], members=[stays.user])
        self._remove_from_workspace(workspace, member2.user)

        assert member.client.post(url(f"channels/{channel.id}/leave/")).status_code == 409
