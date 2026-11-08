# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""channels/, channels/<id>/ and channels/<id>/archive/: who sees, creates, renames and archives what."""

from uuid import uuid4

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils.dateparse import parse_datetime
from rest_framework.test import APIClient

from plane.chat.models import Channel, ChannelKind, ChannelMember
from plane.db.models import Project, ProjectMember


def _ids(response):
    return {str(row["id"]) for row in response.data}


@pytest.mark.contract
@pytest.mark.django_db
class TestChannelList:
    def test_member_sees_public_and_their_own(self, member, member2, make_channel, foreign_channel, url):
        joined = make_channel(members=[member.user])
        public = make_channel()
        mine_private = make_channel(ChannelKind.PRIVATE, members=[member.user])
        other_private = make_channel(ChannelKind.PRIVATE, members=[member2.user])
        my_dm, _ = Channel.objects.get_or_create_dm(joined.workspace, member.user, member2.user)

        res = member.client.get(url("channels/"))
        assert res.status_code == 200
        assert _ids(res) == {str(c.id) for c in (joined, public, mine_private, my_dm)}
        by_id = {str(row["id"]): row for row in res.data}
        assert by_id[str(joined.id)]["is_member"] is True and by_id[str(joined.id)]["my_role"] == "member"
        assert by_id[str(public.id)]["is_member"] is False and by_id[str(public.id)]["my_role"] is None
        assert sorted(by_id[str(my_dm.id)]["dm_member_ids"]) == sorted([str(member.user.id), str(member2.user.id)])
        assert str(other_private.id) not in by_id and str(foreign_channel.id) not in by_id

    def test_guest_sees_only_channels_they_are_in(self, guest, make_channel, url):
        theirs = make_channel(members=[guest.user])
        make_channel()
        make_channel(ChannelKind.PRIVATE)
        res = guest.client.get(url("channels/"))
        assert res.status_code == 200 and _ids(res) == {str(theirs.id)}

    def test_workspace_admin_does_not_see_others_private_channels(self, admin, member, make_channel, url):
        make_channel(ChannelKind.PRIVATE, members=[member.user])
        assert admin.client.get(url("channels/")).data == []

    def test_outsider_and_anonymous_are_refused(self, outsider, make_channel, url):
        make_channel()
        assert outsider.client.get(url("channels/")).status_code == 403
        assert APIClient().get(url("channels/")).status_code in (401, 403)

    def test_archived_channels_are_listed_separately(self, member, make_channel, url):
        live = make_channel(members=[member.user])
        archived = make_channel(members=[member.user])
        archived.archived_at = archived.created_at
        archived.save()
        assert _ids(member.client.get(url("channels/"))) == {str(live.id)}
        assert _ids(member.client.get(url("channels/"), {"archived": "true"})) == {str(archived.id)}
        assert member.client.get(url("channels/"), {"archived": "maybe"}).status_code == 400

    def test_unread_count_and_last_message_at(self, member, member2, make_channel, send, url):
        channel = make_channel(members=[member.user, member2.user])
        read = send(channel, member2.user, "read")
        ChannelMember.objects.filter(channel=channel, user=member.user).update(last_read_message=read)
        unread = send(channel, member2.user, "new")
        send(channel, member2.user, "removed").remove()
        send(channel, member.user, "mine")
        send(channel, member2.user, "reply", parent=unread)
        latest = send(channel, member2.user, "latest")
        never_read = make_channel(members=[member.user])
        send(never_read, member2.user, "a")
        send(never_read, member2.user, "b")
        not_joined = make_channel()
        send(not_joined, member2.user, "c")

        rows = {str(row["id"]): row for row in member.client.get(url("channels/")).data}
        assert rows[str(channel.id)]["unread_count"] == 2  # "new" and "latest"
        assert rows[str(channel.id)]["last_read_message_id"] == str(read.id)
        assert parse_datetime(rows[str(channel.id)]["last_message_at"]) == latest.created_at
        assert rows[str(never_read.id)]["unread_count"] == 2
        assert rows[str(not_joined.id)]["unread_count"] == 0
        assert rows[str(channel.id)]["member_count"] == 2

    def test_no_query_per_channel(self, member, member2, make_channel, send, url):
        def count_queries():
            with CaptureQueriesContext(connection) as ctx:
                assert member.client.get(url("channels/")).status_code == 200
            return len(ctx.captured_queries)

        send(make_channel(members=[member.user]), member2.user)
        one = count_queries()
        for _ in range(4):
            send(make_channel(members=[member.user]), member2.user)
        assert count_queries() == one


@pytest.mark.contract
@pytest.mark.django_db
class TestChannelCreate:
    @pytest.mark.parametrize("kind", ["public", "private"])
    def test_member_creates_and_becomes_admin(self, member, url, kind):
        res = member.client.post(url("channels/"), {"name": " dev ", "kind": kind, "description": "d"}, format="json")
        assert res.status_code == 201
        assert (res.data["name"], res.data["kind"], res.data["my_role"]) == ("dev", kind, "admin")
        assert res.data["is_member"] is True and res.data["member_count"] == 1

    def test_kind_defaults_to_public(self, member, url):
        assert member.client.post(url("channels/"), {"name": "x"}, format="json").data["kind"] == "public"

    def test_guest_cannot_create(self, guest, url):
        assert guest.client.post(url("channels/"), {"name": "x"}, format="json").status_code == 403

    def test_outsider_cannot_create(self, outsider, url):
        assert outsider.client.post(url("channels/"), {"name": "x"}, format="json").status_code == 403
        assert not Channel.objects.exists()

    @pytest.mark.parametrize(
        "payload",
        [{"name": "  "}, {"name": "x", "kind": "dm"}, {"name": "x", "kind": "group_dm"}, {}, {"name": "n" * 81}],
    )
    def test_invalid(self, member, url, payload):
        assert member.client.post(url("channels/"), payload, format="json").status_code == 400

    def test_names_are_unique_ignoring_case(self, member, make_channel, foreign_channel, url):
        make_channel(name="General")
        assert member.client.post(url("channels/"), {"name": "general"}, format="json").status_code == 400
        # Another workspace's names don't count.
        assert member.client.post(url("channels/"), {"name": foreign_channel.name}, format="json").status_code == 201

    def test_project_must_be_one_the_creator_is_in(self, member, workspace, other_workspace, url):
        mine = Project.objects.create(name="Mine", identifier="MINE", workspace=workspace)
        ProjectMember.objects.create(project=mine, member=member.user, role=15, is_active=True)
        not_mine = Project.objects.create(name="Theirs", identifier="THEM", workspace=workspace)
        foreign = Project.objects.create(name="Foreign", identifier="FRGN", workspace=other_workspace)

        res = member.client.post(url("channels/"), {"name": "a", "project": str(mine.id)}, format="json")
        assert res.status_code == 201 and res.data["project"] == mine.id
        # Not mine, another workspace's, and no project at all look the same.
        for project_id in (not_mine.id, foreign.id, uuid4()):
            res = member.client.post(url("channels/"), {"name": "b", "project": str(project_id)}, format="json")
            assert res.status_code == 400 and res.data["project"] == ["Project not found."]
        assert member.client.post(url("channels/"), {"name": "b", "project": "x"}, format="json").status_code == 400


@pytest.mark.contract
@pytest.mark.django_db
class TestChannelDetail:
    def test_get(self, member, member2, make_channel, url):
        public = make_channel()
        private = make_channel(ChannelKind.PRIVATE, members=[member2.user])
        assert member.client.get(url(f"channels/{public.id}/")).status_code == 200
        assert member.client.get(url(f"channels/{private.id}/")).status_code == 404
        assert member2.client.get(url(f"channels/{private.id}/")).status_code == 200

    def test_dm_is_hidden_from_non_members(self, admin, member, member2, workspace, url):
        dm, _ = Channel.objects.get_or_create_dm(workspace, member.user, member2.user)
        assert member.client.get(url(f"channels/{dm.id}/")).status_code == 200
        assert admin.client.get(url(f"channels/{dm.id}/")).status_code == 404

    def test_guest_cannot_see_public_channels_they_are_not_in(self, guest, make_channel, url):
        assert guest.client.get(url(f"channels/{make_channel().id}/")).status_code == 404
        assert guest.client.get(url(f"channels/{make_channel(members=[guest.user]).id}/")).status_code == 200

    def test_other_workspace_ids_are_404(self, admin, outsider, make_channel, foreign_channel, other_workspace, url):
        assert admin.client.get(url(f"channels/{foreign_channel.id}/")).status_code == 404
        # Through the outsider's own workspace, our channel doesn't exist either.
        ours = make_channel()
        assert outsider.client.get(url(f"channels/{ours.id}/", slug=other_workspace.slug)).status_code == 404
        assert outsider.client.get(url(f"channels/{ours.id}/")).status_code == 403

    def test_rename_by_channel_admin(self, member, make_channel, url):
        channel = make_channel(admins=[member.user])
        res = member.client.patch(
            url(f"channels/{channel.id}/"), {"name": "renamed", "description": "x"}, format="json"
        )
        assert res.status_code == 200 and (res.data["name"], res.data["description"]) == ("renamed", "x")

    def test_rename_by_workspace_admin_who_is_not_in_a_public_channel(self, admin, make_channel, url):
        channel = make_channel()
        assert admin.client.patch(url(f"channels/{channel.id}/"), {"name": "mod"}, format="json").status_code == 200

    def test_rename_refused(self, admin, member, member2, workspace, make_channel, url):
        plain = make_channel(members=[member.user])
        assert member.client.patch(url(f"channels/{plain.id}/"), {"name": "x"}, format="json").status_code == 403
        private = make_channel(ChannelKind.PRIVATE, members=[member2.user])
        assert admin.client.patch(url(f"channels/{private.id}/"), {"name": "x"}, format="json").status_code == 404
        dm, _ = Channel.objects.get_or_create_dm(workspace, admin.user, member.user)
        assert admin.client.patch(url(f"channels/{dm.id}/"), {"name": "x"}, format="json").status_code == 409

    def test_rename_to_a_taken_name(self, member, make_channel, url):
        make_channel(name="taken")
        channel = make_channel(admins=[member.user])
        assert member.client.patch(url(f"channels/{channel.id}/"), {"name": "TAKEN"}, format="json").status_code == 400
        # Keeping your own name is fine.
        same = member.client.patch(url(f"channels/{channel.id}/"), {"name": channel.name.upper()}, format="json")
        assert same.status_code == 200

    def test_archived_channel_cannot_be_renamed(self, member, make_channel, url):
        channel = make_channel(admins=[member.user])
        member.client.post(url(f"channels/{channel.id}/archive/"))
        assert member.client.patch(url(f"channels/{channel.id}/"), {"name": "x"}, format="json").status_code == 409


@pytest.mark.contract
@pytest.mark.django_db
class TestChannelArchive:
    def test_channel_admin_archives_and_unarchives(self, member, make_channel, url):
        channel = make_channel(admins=[member.user])
        res = member.client.post(url(f"channels/{channel.id}/archive/"))
        assert res.status_code == 200 and res.data["archived_at"] is not None
        assert member.client.post(url(f"channels/{channel.id}/archive/")).status_code == 200  # idempotent
        res = member.client.delete(url(f"channels/{channel.id}/archive/"))
        assert res.status_code == 200 and res.data["archived_at"] is None

    def test_workspace_admin_can_archive_a_public_channel(self, admin, make_channel, url):
        assert admin.client.post(url(f"channels/{make_channel().id}/archive/")).status_code == 200

    def test_refused(self, admin, member, member2, workspace, make_channel, foreign_channel, outsider, url):
        plain = make_channel(members=[member.user])
        assert member.client.post(url(f"channels/{plain.id}/archive/")).status_code == 403
        private = make_channel(ChannelKind.PRIVATE, members=[member2.user])
        assert admin.client.post(url(f"channels/{private.id}/archive/")).status_code == 404
        dm, _ = Channel.objects.get_or_create_dm(workspace, admin.user, member.user)
        assert admin.client.post(url(f"channels/{dm.id}/archive/")).status_code == 409
        assert admin.client.post(url(f"channels/{foreign_channel.id}/archive/")).status_code == 404
        assert outsider.client.post(url(f"channels/{plain.id}/archive/")).status_code == 403
        plain.refresh_from_db()
        assert plain.archived_at is None


@pytest.mark.contract
@pytest.mark.django_db
class TestDescriptionLimit:
    def test_create_and_edit_are_capped(self, member, make_channel, url):
        too_long = "d" * 2_001
        res = member.client.post(url("channels/"), {"name": "capped", "description": too_long}, format="json")
        assert res.status_code == 400 and "description" in res.data

        channel = make_channel(admins=[member.user])
        res = member.client.patch(url(f"channels/{channel.id}/"), {"description": too_long}, format="json")
        assert res.status_code == 400 and "description" in res.data

    def test_a_description_at_the_limit_is_fine(self, member, url):
        res = member.client.post(url("channels/"), {"name": "full", "description": "d" * 2_000}, format="json")
        assert res.status_code == 201
