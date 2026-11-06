# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""~/roles/: CE's fixed roles in the plane-sdk Role shape, with stable ids."""

from uuid import uuid4

import pytest

from plane.nexus.views.work_item import role_id

PAGE = "plane.models.roles.PaginatedRoleResponse"
ROLE = "plane.models.roles.Role"


@pytest.mark.contract
class TestRoles:
    def test_lists_both_namespaces(self, client, ws_url, guest_client, sdk):
        res = client.get(ws_url("roles/"))
        assert res.status_code == 200
        body = sdk(PAGE, res.data)
        keys = [(r["namespace"], r["slug"], r["level"]) for r in body["results"]]
        assert keys == [
            ("project", "admin", 20), ("project", "member", 15), ("project", "guest", 5),
            ("workspace", "admin", 20), ("workspace", "member", 15), ("workspace", "guest", 5),
        ]  # fmt: skip
        assert body["total_count"] == 6 and body["next_page_results"] is False
        by_key = {(r["namespace"], r["slug"]): r for r in body["results"]}
        # The workspace admin plus the guest fixture's membership.
        assert by_key[("workspace", "admin")]["member_count"] == 1
        assert by_key[("workspace", "guest")]["member_count"] == 1
        assert by_key[("project", "guest")]["member_count"] == 1

    def test_ids_are_stable(self, client, ws_url):
        first = client.get(ws_url("roles/")).data["results"]
        assert [r["id"] for r in first] == [r["id"] for r in client.get(ws_url("roles/")).data["results"]]
        assert first[0]["id"] == role_id("project", "admin")
        assert len({r["id"] for r in first}) == 6

    def test_namespace_filter_and_paging(self, client, ws_url, sdk):
        res = client.get(ws_url("roles/"), {"namespace": "workspace", "per_page": 2})
        body = sdk(PAGE, res.data)
        assert [r["slug"] for r in body["results"]] == ["admin", "member"] and body["next_page_results"] is True
        res = client.get(ws_url("roles/"), {"namespace": "workspace", "per_page": 2, "cursor": body["next_cursor"]})
        body = sdk(PAGE, res.data)
        assert [r["slug"] for r in body["results"]] == ["guest"] and body["prev_page_results"] is True
        assert client.get(ws_url("roles/"), {"namespace": "team"}).status_code == 400
        assert client.get(ws_url("roles/"), {"cursor": "garbage"}).status_code == 400

    def test_retrieve(self, client, ws_url, guest_client, sdk):
        res = client.get(ws_url(f"roles/{role_id('workspace', 'member')}/"))
        assert res.status_code == 200
        role = sdk(ROLE, res.data)
        assert (role["namespace"], role["slug"], role["name"]) == ("workspace", "member", "Member")
        assert guest_client.get(ws_url(f"roles/{role_id('project', 'guest')}/")).status_code == 200
        assert client.get(ws_url(f"roles/{uuid4()}/")).status_code == 404

    def test_outsider_is_refused(self, outsider_client, ws_url):
        assert outsider_client.get(ws_url("roles/")).status_code == 403
        assert outsider_client.get(ws_url(f"roles/{role_id('workspace', 'admin')}/")).status_code == 403
