# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Collections of workspace pages, their members and pages (plane-sdk api/collections)."""

from uuid import uuid4

import pytest

from plane.db.models import Page, User, Workspace
from plane.nexus.models import Collection, PageCollection

M = "plane.models.collections"


def _collection(client, ws_url, **body):
    res = client.post(ws_url("collections/"), {"name": "Handbook", **body}, format="json")
    assert res.status_code == 201, res.data
    return res.data


def _page(client, ws_url, **body):
    res = client.post(ws_url("pages/"), {"name": "Doc", "description_html": "<p>x</p>", **body}, format="json")
    assert res.status_code == 201, res.data
    return res.data


@pytest.fixture
def member(make_user, workspace, project):
    return make_user(15, workspace=workspace, project=project)


@pytest.fixture
def foreign_collection(db):
    owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
    other = Workspace.objects.create(name="Elsewhere", slug=f"else-{uuid4().hex[:6]}", owner=owner)
    return Collection.objects.create(workspace=other, name="Hidden", owned_by=owner)


@pytest.mark.contract
class TestCollections:
    def test_crud(self, client, ws_url, sdk):
        created = sdk(f"{M}.Collection", _collection(client, ws_url))
        assert created["access"] == 0 and created["current_user_access"] == 2 and created["has_pages"] is False
        cid = created["id"]

        res = client.get(ws_url("collections/"))
        assert res.status_code == 200
        assert [sdk(f"{M}.Collection", row)["id"] for row in res.data] == [cid]
        assert sdk(f"{M}.Collection", client.get(ws_url(f"collections/{cid}/")).data)["name"] == "Handbook"

        res = client.patch(ws_url(f"collections/{cid}/"), {"name": "Renamed", "sort_order": 5.5}, format="json")
        assert res.status_code == 200
        assert sdk(f"{M}.Collection", res.data)["name"] == "Renamed" and res.data["sort_order"] == 5.5
        assert client.patch(ws_url(f"collections/{cid}/"), {"access": 1}, format="json").status_code == 400

        assert client.delete(ws_url(f"collections/{cid}/")).status_code == 204
        assert client.get(ws_url(f"collections/{cid}/")).status_code == 404

    def test_delete_archives_pages_by_default(self, client, ws_url):
        cid = _collection(client, ws_url)["id"]
        page = _page(client, ws_url, collection_id=cid)
        assert page["collection_id"] == cid and page["page_collection_id"]
        client.delete(ws_url(f"collections/{cid}/"))
        assert Page.objects.get(pk=page["id"]).archived_at is not None
        assert client.get(ws_url(f"pages/{page['id']}/")).data["collection_id"] is None

    def test_delete_can_leave_pages_unfiled(self, client, ws_url):
        cid = _collection(client, ws_url)["id"]
        page = _page(client, ws_url, collection_id=cid)
        assert client.delete(ws_url(f"collections/{cid}/") + "?archive_pages=false").status_code == 204
        assert Page.objects.get(pk=page["id"]).archived_at is None

    def test_private_collection_always_archives(self, client, ws_url):
        cid = _collection(client, ws_url, access=1)["id"]
        page = _page(client, ws_url, collection_id=cid)
        client.delete(ws_url(f"collections/{cid}/") + "?archive_pages=false")
        assert Page.objects.get(pk=page["id"]).archived_at is not None

    def test_private_collection_hides_itself_and_its_pages(self, client, member_client, ws_url):
        cid = _collection(client, ws_url, access=1)["id"]
        page = _page(client, ws_url, collection_id=cid)
        assert member_client.get(ws_url(f"collections/{cid}/")).status_code == 404
        assert member_client.get(ws_url("collections/")).data == []
        assert member_client.get(ws_url(f"pages/{page['id']}/")).status_code == 404
        assert member_client.get(ws_url("pages/")).data["results"] == []

    def test_member_cannot_delete_someone_elses_collection(self, client, member_client, ws_url):
        cid = _collection(client, ws_url)["id"]
        assert member_client.delete(ws_url(f"collections/{cid}/")).status_code == 403

    def test_guest_outsider_and_foreign_ids(self, client, guest_client, outsider_client, ws_url, foreign_collection):
        assert guest_client.get(ws_url("collections/")).status_code == 403
        assert outsider_client.post(ws_url("collections/"), {"name": "x"}, format="json").status_code == 403
        assert client.get(ws_url(f"collections/{foreign_collection.id}/")).status_code == 404
        assert client.get(ws_url(f"collections/{foreign_collection.id}/pages/")).status_code == 404
        assert client.get(ws_url(f"collections/{foreign_collection.id}/members/")).status_code == 404


@pytest.mark.contract
class TestCollectionMembers:
    def test_add_list_update_remove(self, client, ws_url, member, sdk):
        user, member_client = member
        cid = _collection(client, ws_url, access=1)["id"]
        url = ws_url(f"collections/{cid}/members/")

        res = client.post(url, {"member": str(user.id), "access": 0}, format="json")
        assert res.status_code == 201, res.data
        row = sdk(f"{M}.CollectionMember", res.data)
        assert client.post(url, {"member": str(user.id), "access": 0}, format="json").status_code == 400

        res = client.get(url)
        assert res.status_code == 200 and len([sdk(f"{M}.CollectionMember", r) for r in res.data]) == 2  # owner too

        # A viewer sees the private collection but cannot file pages in it.
        assert member_client.get(ws_url(f"collections/{cid}/")).data["current_user_access"] == 0
        page = _page(member_client, ws_url)
        res = member_client.post(ws_url(f"collections/{cid}/pages/"), {"page_ids": [page["id"]]}, format="json")
        assert res.status_code == 403

        res = client.patch(f"{url}{row['id']}/", {"access": 2}, format="json")
        assert res.status_code == 200 and sdk(f"{M}.CollectionMember", res.data)["access"] == 2
        res = member_client.post(ws_url(f"collections/{cid}/pages/"), {"page_ids": [page["id"]]}, format="json")
        assert res.status_code == 201

        assert client.delete(f"{url}{row['id']}/").status_code == 204
        assert member_client.get(ws_url(f"collections/{cid}/")).status_code == 404

    def test_owner_cannot_be_removed_and_outsiders_cannot_join(self, client, ws_url, outsider_client):
        cid = _collection(client, ws_url)["id"]
        url = ws_url(f"collections/{cid}/members/")
        owner_row = client.get(url).data[0]
        assert client.delete(f"{url}{owner_row['id']}/").status_code == 400
        stranger = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
        assert client.post(url, {"member": str(stranger.id), "access": 2}, format="json").status_code == 400
        assert client.post(url, {"member": str(stranger.id), "access": 7}, format="json").status_code == 400


@pytest.mark.contract
class TestCollectionPages:
    def test_add_list_search_move_remove(self, client, ws_url, sdk):
        cid = _collection(client, ws_url)["id"]
        other_cid = _collection(client, ws_url, name="Archive")["id"]
        loose = _page(client, ws_url, name="Loose page")
        filed = _page(client, ws_url, name="Filed", collection_id=cid)
        child = _page(client, ws_url, name="Child", parent_id=filed["id"])
        assert child["collection_id"] == cid  # a nested page takes its parent's collection

        res = client.get(ws_url(f"collections/{cid}/pages-search/"), {"search": "loose"})
        assert res.status_code == 200
        assert [sdk(f"{M}.CollectionPageSearchResult", r)["id"] for r in res.data] == [loose["id"]]

        res = client.post(ws_url(f"collections/{cid}/pages/"), {"page_ids": [loose["id"]]}, format="json")
        assert res.status_code == 201, res.data
        added = [sdk(f"{M}.CollectionPage", r) for r in res.data]
        assert added[0]["page"] == loose["id"] and added[0]["collection"] == cid
        assert client.get(ws_url(f"pages/{loose['id']}/")).data["page_collection_id"] == added[0]["id"]
        assert client.get(ws_url(f"collections/{cid}/pages-search/")).data == []

        res = client.get(ws_url(f"collections/{cid}/pages/"), {"per_page": 10})
        assert res.status_code == 200
        listed = sdk(f"{M}.PaginatedCollectionPageResponse", res.data)
        assert {r["page"]["id"] for r in listed["results"]} == {loose["id"], filed["id"]}  # top level only
        res = client.get(ws_url(f"collections/{cid}/pages/"), {"parent_id": filed["id"]})
        assert [r["page"]["id"] for r in res.data["results"]] == [child["id"]]
        res = client.get(ws_url(f"collections/{cid}/pages/"), {"search": "loose"})
        assert [r["page"]["id"] for r in res.data["results"]] == [loose["id"]]

        # Filed elsewhere: adding is refused, moving (what page set_collection does) works.
        res = client.post(ws_url(f"collections/{other_cid}/pages/"), {"page_ids": [filed["id"]]}, format="json")
        assert res.status_code == 400
        res = client.patch(
            ws_url(f"collections/{cid}/pages/{filed['page_collection_id']}/"), {"collection": other_cid}, format="json"
        )
        assert res.status_code == 200 and sdk(f"{M}.CollectionPage", res.data)["collection"] == other_cid
        assert PageCollection.objects.get(page_id=child["id"]).collection_id == Collection.objects.get(pk=other_cid).id

        assert client.delete(ws_url(f"collections/{cid}/pages/{added[0]['id']}/")).status_code == 204
        assert client.get(ws_url(f"pages/{loose['id']}/")).data["collection_id"] is None
        assert client.delete(ws_url(f"collections/{cid}/pages/{added[0]['id']}/")).status_code == 404

    def test_only_visible_workspace_pages_can_be_added(self, client, member_client, ws_url, project_url):
        cid = _collection(client, ws_url)["id"]
        project_page = client.post(project_url("pages/"), {"name": "P", "description_html": ""}, format="json").data
        private = _page(client, ws_url, access=1)
        url = ws_url(f"collections/{cid}/pages/")
        assert client.post(url, {"page_ids": [project_page["id"]]}, format="json").status_code == 404
        assert member_client.post(url, {"page_ids": [private["id"]]}, format="json").status_code == 404


@pytest.mark.contract
class TestPrivateCollectionVisibility:
    def test_deleting_a_private_collection_keeps_its_pages_private(self, client, member_client, ws_url):
        cid = _collection(client, ws_url, access=1)["id"]
        page = _page(client, ws_url, collection_id=cid)
        child = _page(client, ws_url, parent_id=page["id"])
        assert client.delete(ws_url(f"collections/{cid}/")).status_code == 204
        listed = {p["id"] for p in member_client.get(ws_url("pages/")).data["results"]}
        for pid in (page["id"], child["id"]):
            assert pid not in listed
            assert member_client.get(ws_url(f"pages/{pid}/")).status_code == 404
            assert client.get(ws_url(f"pages/{pid}/")).data["access"] == 1  # the owner still has it

    def test_deleting_a_public_collection_leaves_its_pages_public(self, client, member_client, ws_url):
        cid = _collection(client, ws_url)["id"]
        page = _page(client, ws_url, collection_id=cid)
        assert client.delete(ws_url(f"collections/{cid}/") + "?archive_pages=false").status_code == 204
        assert member_client.get(ws_url(f"pages/{page['id']}/")).data["access"] == 0

    def test_removing_a_page_from_a_private_collection_keeps_it_private(self, client, member_client, ws_url):
        cid = _collection(client, ws_url, access=1)["id"]
        page = _page(client, ws_url, collection_id=cid)
        assert client.delete(ws_url(f"collections/{cid}/pages/{page['page_collection_id']}/")).status_code == 204
        assert member_client.get(ws_url(f"pages/{page['id']}/")).status_code == 404
        assert client.get(ws_url(f"pages/{page['id']}/")).data["collection_id"] is None

    def test_only_a_pages_owner_can_file_it_in_a_private_collection(self, client, member, ws_url):
        _, member_api = member
        cid = _collection(member_api, ws_url, access=1)["id"]
        url = ws_url(f"collections/{cid}/pages/")
        theirs = _page(client, ws_url, name="Admin's page")
        res = member_api.post(url, {"page_ids": [theirs["id"]]}, format="json")
        assert res.status_code == 403 and res.data["code"] == "NOT_PAGE_OWNER" and theirs["id"] in res.data["error"]
        assert not PageCollection.objects.filter(page_id=theirs["id"]).exists()
        # Sub-pages are filed with their parent, so someone else's sub-page blocks it too.
        mine = _page(member_api, ws_url, name="Mine")
        nested = _page(client, ws_url, name="Admin's sub-page", parent_id=mine["id"])
        res = member_api.post(url, {"page_ids": [mine["id"]]}, format="json")
        assert res.status_code == 403 and nested["id"] in res.data["error"]
        Page.objects.filter(pk=nested["id"]).update(parent=None)
        assert member_api.post(url, {"page_ids": [mine["id"]]}, format="json").status_code == 201

    def test_only_a_pages_owner_can_move_it_out_of_a_private_collection(self, client, member, ws_url):
        user, member_api = member
        private = _collection(client, ws_url, access=1)["id"]
        public = _collection(client, ws_url, name="Open")["id"]
        member_url = ws_url(f"collections/{private}/members/")
        assert client.post(member_url, {"member": str(user.id), "access": 2}, format="json").status_code == 201
        page = _page(client, ws_url, collection_id=private)
        url = ws_url(f"collections/{private}/pages/{page['page_collection_id']}/")
        res = member_api.patch(url, {"collection": public}, format="json")
        assert res.status_code == 403 and res.data["code"] == "NOT_PAGE_OWNER"
        assert client.patch(url, {"collection": public}, format="json").status_code == 200

    def test_a_member_cannot_leave_a_public_collection_to_lift_a_restriction(self, client, member, ws_url):
        user, member_api = member
        cid = _collection(client, ws_url)["id"]
        url = ws_url(f"collections/{cid}/members/")
        row = client.post(url, {"member": str(user.id), "access": 0}, format="json").data
        assert member_api.get(ws_url(f"collections/{cid}/")).data["current_user_access"] == 0
        assert member_api.delete(f"{url}{row['id']}/").status_code == 403
        assert member_api.get(ws_url(f"collections/{cid}/")).data["current_user_access"] == 0

    def test_a_member_can_leave_a_private_collection(self, client, member, ws_url):
        user, member_api = member
        cid = _collection(client, ws_url, access=1)["id"]
        url = ws_url(f"collections/{cid}/members/")
        row = client.post(url, {"member": str(user.id), "access": 0}, format="json").data
        assert member_api.delete(f"{url}{row['id']}/").status_code == 204
        assert member_api.get(ws_url(f"collections/{cid}/")).status_code == 404
