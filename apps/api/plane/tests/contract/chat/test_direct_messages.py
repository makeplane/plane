# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""dms/: opening a DM or group DM wraps `Channel.objects.get_or_create_dm` / `get_or_create_group_dm`."""

from uuid import uuid4

import pytest

from plane.chat.models import GROUP_DM_MAX_MEMBERS, Channel, ChatGuestPermission
from plane.db.models import WorkspaceMember


@pytest.mark.contract
@pytest.mark.django_db
class TestOpenDirectMessage:
    def test_dm_is_created_once_from_either_side(self, member, member2, url):
        res = member.client.post(url("dms/"), {"member_ids": [str(member2.user.id)]}, format="json")
        assert res.status_code == 201
        assert res.data["kind"] == "dm" and res.data["is_member"] is True and res.data["member_count"] == 2
        again = member2.client.post(url("dms/"), {"member_ids": [str(member.user.id)]}, format="json")
        assert again.status_code == 200 and again.data["id"] == res.data["id"]

    def test_group_dm(self, member, member2, guest, url):
        others = [str(member2.user.id), str(guest.user.id)]
        res = member.client.post(url("dms/"), {"member_ids": others}, format="json")
        assert res.status_code == 201 and res.data["kind"] == "group_dm"
        assert sorted(res.data["dm_member_ids"]) == sorted([str(member.user.id), *others])
        # Listing yourself too is the same group.
        mine_too = [*others, str(member.user.id)]
        assert member.client.post(url("dms/"), {"member_ids": mine_too}, format="json").data["id"] == res.data["id"]

    def test_guest_needs_a_grant_to_open_a_dm(self, admin, guest, member, member2, url):
        one = {"member_ids": [str(member.user.id)]}
        group = {"member_ids": [str(member.user.id), str(member2.user.id)]}
        for payload in (one, group):
            res = guest.client.post(url("dms/"), payload, format="json")
            assert res.status_code == 403
            assert res.data == {"error": "Guests need a workspace admin to give them DM access."}
        assert not Channel.objects.exists()

        access = url(f"guests/{guest.user.id}/dm-access/")
        assert admin.client.put(access).status_code == 200
        assert guest.client.post(url("dms/"), one, format="json").status_code == 201
        assert guest.client.post(url("dms/"), group, format="json").status_code == 201

        assert admin.client.delete(access).status_code == 204
        assert guest.client.post(url("dms/"), one, format="json").status_code == 403

    def test_ungranted_guest_can_be_messaged_and_reply(self, guest, member, url):
        res = member.client.post(url("dms/"), {"member_ids": [str(guest.user.id)]}, format="json")
        assert res.status_code == 201
        dm_id = res.data["id"]
        assert dm_id in {row["id"] for row in guest.client.get(url("channels/")).data}
        reply = guest.client.post(url(f"channels/{dm_id}/messages/"), {"body_html": "<p>hi</p>"}, format="json")
        assert reply.status_code == 201

    def test_a_grant_in_another_workspace_does_not_count(self, guest, member, other_workspace, url):
        ChatGuestPermission.objects.create(workspace=other_workspace, user=guest.user, can_open_dms=True)
        assert guest.client.post(url("dms/"), {"member_ids": [str(member.user.id)]}, format="json").status_code == 403

    def test_bad_member_sets_are_400(self, member, member2, outsider, url):
        cases = [
            [str(member.user.id)],  # only yourself
            [],
            [str(uuid4())],  # nobody
            [str(outsider.user.id)],  # someone in another workspace
            ["not-a-uuid"],
        ]
        for member_ids in cases:
            res = member.client.post(url("dms/"), {"member_ids": member_ids}, format="json")
            assert res.status_code == 400, member_ids
        assert not Channel.objects.exists()

    def test_too_many_people(self, make_actor, member, url):
        others = [str(make_actor().user.id) for _ in range(GROUP_DM_MAX_MEMBERS)]
        assert member.client.post(url("dms/"), {"member_ids": others}, format="json").status_code == 400
        # The full group, listing yourself too, is fine.
        group = [*others[:-1], str(member.user.id)]
        assert member.client.post(url("dms/"), {"member_ids": group}, format="json").status_code == 201
        res = member.client.post(url("dms/"), {"member_ids": others[:-1]}, format="json")
        assert res.status_code == 200 and res.data["member_count"] == GROUP_DM_MAX_MEMBERS

    def test_inactive_workspace_member_gets_the_model_message(self, member, member2, workspace, url):
        WorkspaceMember.objects.filter(workspace=workspace, member=member2.user).update(is_active=False)
        res = member.client.post(url("dms/"), {"member_ids": [str(member2.user.id)]}, format="json")
        assert res.status_code == 400
        assert res.data == {"error": "Every member of a direct message must be an active member of the workspace."}

    def test_outsider_is_refused(self, outsider, member, url):
        assert (
            outsider.client.post(url("dms/"), {"member_ids": [str(member.user.id)]}, format="json").status_code == 403
        )

    def test_cannot_open_a_dm_in_another_workspace(self, member, outsider, other_workspace, url):
        res = member.client.post(
            url("dms/", slug=other_workspace.slug), {"member_ids": [str(outsider.user.id)]}, format="json"
        )
        assert res.status_code == 403
