# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""guests/dm-access/ and guests/<user_id>/dm-access/: workspace admins grant guests DM access one by one."""

from uuid import uuid4

import pytest

from plane.chat.models import ChatGuestPermission
from plane.db.models import WorkspaceMember

from .conftest import GUEST


def _granted(workspace, user):
    return ChatGuestPermission.objects.filter(workspace=workspace, user=user, can_open_dms=True).exists()


@pytest.mark.contract
@pytest.mark.django_db
class TestGrant:
    def test_admin_grants_lists_and_revokes(self, admin, guest, make_actor, workspace, url):
        other_guest = make_actor(GUEST)
        access = url(f"guests/{guest.user.id}/dm-access/")

        res = admin.client.put(access)
        assert res.status_code == 200
        assert (res.data["user"], res.data["can_open_dms"]) == (guest.user.id, True)
        assert admin.client.put(access).status_code == 200  # idempotent
        assert ChatGuestPermission.objects.filter(user=guest.user).count() == 1

        listed = admin.client.get(url("guests/dm-access/"))
        assert listed.status_code == 200 and [row["user"] for row in listed.data] == [guest.user.id]

        assert admin.client.delete(access).status_code == 204
        assert admin.client.delete(access).status_code == 204  # idempotent
        assert not _granted(workspace, guest.user)
        assert admin.client.get(url("guests/dm-access/")).data == []
        assert admin.client.put(access).status_code == 200  # and back again
        assert _granted(workspace, guest.user) and not _granted(workspace, other_guest.user)

    def test_only_workspace_admins(self, member, guest, outsider, workspace, url):
        access = url(f"guests/{guest.user.id}/dm-access/")
        for actor in (member, guest):
            assert actor.client.put(access).status_code == 403
            assert actor.client.delete(access).status_code == 403
            assert actor.client.get(url("guests/dm-access/")).status_code == 403
        assert outsider.client.put(access).status_code == 403
        assert outsider.client.get(url("guests/dm-access/")).status_code == 403
        assert not _granted(workspace, guest.user)

    def test_target_must_be_an_active_guest_here(self, admin, member, outsider, guest, workspace, url):
        assert admin.client.put(url(f"guests/{member.user.id}/dm-access/")).status_code == 400
        assert admin.client.put(url(f"guests/{admin.user.id}/dm-access/")).status_code == 400
        for user_id in (outsider.user.id, uuid4()):
            assert admin.client.put(url(f"guests/{user_id}/dm-access/")).status_code == 404
            assert admin.client.delete(url(f"guests/{user_id}/dm-access/")).status_code == 404
        WorkspaceMember.objects.filter(workspace=workspace, member=guest.user).update(is_active=False)
        assert admin.client.put(url(f"guests/{guest.user.id}/dm-access/")).status_code == 404
        assert not ChatGuestPermission.objects.exists()

    def test_other_workspace(self, admin, outsider, other_workspace, make_actor, url):
        """A grant is per workspace: an admin here can't touch another workspace's guests, or see its grants."""
        their_guest = make_actor(GUEST, in_workspace=other_workspace)
        ChatGuestPermission.objects.create(workspace=other_workspace, user=their_guest.user, can_open_dms=True)
        assert admin.client.get(url("guests/dm-access/")).data == []
        assert admin.client.put(url(f"guests/{their_guest.user.id}/dm-access/")).status_code == 404
        assert admin.client.delete(url(f"guests/{their_guest.user.id}/dm-access/")).status_code == 404
        assert _granted(other_workspace, their_guest.user)
        # And their admin can't reach in here through our slug.
        assert outsider.client.put(url(f"guests/{their_guest.user.id}/dm-access/")).status_code == 403
