# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workspace and project pages, and work item ↔ page links (plane-sdk api/pages, api/work_items/pages)."""

import json
import threading
from uuid import uuid4

import pytest

from plane.db.models import Issue, Page, Project, ProjectPage, User, Workspace
from plane.nexus.models import WorkItemPage
from plane.nexus.views import page as page_views
from plane.settings.redis import redis_instance

M = "plane.models.pages"


def _create(client, url, **body):
    payload = {"name": "Runbook", "description_html": "<p>Hello</p>", **body}
    res = client.post(url, payload, format="json")
    assert res.status_code == 201, res.data
    return res.data


@pytest.fixture
def foreign_page(db):
    owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
    other = Workspace.objects.create(name="Elsewhere", slug=f"else-{uuid4().hex[:6]}", owner=owner)
    return Page.objects.create(workspace=other, owned_by=owner, name="Hidden", is_global=True)


@pytest.mark.contract
class TestWorkspacePages:
    def test_crud_archive_delete(self, client, ws_url, sdk):
        created = sdk(f"{M}.Page", _create(client, ws_url("pages/"), access=0, color="#fff", external_id="x1"))
        assert created["projects"] == [] and created["collection_id"] is None and created["is_global"] is True
        pid = created["id"]

        res = client.get(ws_url("pages/"), {"per_page": 10})
        assert res.status_code == 200
        assert [p["id"] for p in sdk(f"{M}.PaginatedPageResponse", res.data)["results"]] == [pid]

        res = client.get(ws_url(f"pages/{pid}/"))
        assert res.status_code == 200 and sdk(f"{M}.Page", res.data)["description_html"] == "<p>Hello</p>"

        res = client.put(ws_url(f"pages/{pid}/"), {"name": "Renamed", "description_html": "<p>New</p>"}, format="json")
        assert res.status_code == 200, res.data
        updated = sdk(f"{M}.Page", res.data)
        assert updated["name"] == "Renamed" and updated["description_stripped"] == "New"

        assert client.delete(ws_url(f"pages/{pid}/")).status_code == 400  # must be archived first
        assert client.post(ws_url(f"pages/{pid}/archive/")).status_code == 200
        res = client.put(ws_url(f"pages/{pid}/"), {"name": "x"}, format="json")
        assert res.status_code == 400 and res.data["code"] == "PAGE_ARCHIVED"
        assert client.delete(ws_url(f"pages/{pid}/archive/")).status_code == 204
        assert Page.objects.get(pk=pid).archived_at is None
        client.post(ws_url(f"pages/{pid}/archive/"))
        assert client.delete(ws_url(f"pages/{pid}/")).status_code == 204
        assert client.get(ws_url(f"pages/{pid}/")).status_code == 404

    def test_archive_takes_sub_pages(self, client, ws_url):
        parent = _create(client, ws_url("pages/"))
        child = _create(client, ws_url("pages/"), parent_id=parent["id"])
        assert child["parent_id"] == parent["id"]
        client.post(ws_url(f"pages/{parent['id']}/archive/"))
        assert Page.objects.get(pk=child["id"]).archived_at is not None

    def test_private_page_is_invisible_to_other_members(self, client, member_client, ws_url):
        mine = _create(client, ws_url("pages/"), access=1)
        assert member_client.get(ws_url(f"pages/{mine['id']}/")).status_code == 404
        res = member_client.get(ws_url("pages/"))
        assert res.status_code == 200 and res.data["results"] == []
        assert member_client.put(ws_url(f"pages/{mine['id']}/"), {"name": "x"}, format="json").status_code == 404

    def test_access_change_and_archive_need_owner(self, client, member_client, ws_url):
        page = _create(client, ws_url("pages/"))
        res = member_client.put(ws_url(f"pages/{page['id']}/"), {"access": 1}, format="json")
        assert res.status_code == 400
        assert member_client.post(ws_url(f"pages/{page['id']}/archive/")).status_code == 400

    def test_locked_page_is_refused(self, client, ws_url):
        page = _create(client, ws_url("pages/"), is_locked=True)
        res = client.put(ws_url(f"pages/{page['id']}/"), {"name": "x"}, format="json")
        assert res.status_code == 400 and res.data["code"] == "PAGE_LOCKED"
        assert client.put(ws_url(f"pages/{page['id']}/"), {"is_locked": False}, format="json").status_code == 200

    def test_guest_and_outsider_are_refused(self, guest_client, outsider_client, ws_url):
        assert guest_client.get(ws_url("pages/")).status_code == 403
        assert outsider_client.get(ws_url("pages/")).status_code == 403
        assert (
            outsider_client.post(ws_url("pages/"), {"name": "x", "description_html": ""}, format="json").status_code
            == 403
        )

    def test_page_of_another_workspace_is_404(self, client, ws_url, foreign_page):
        assert client.get(ws_url(f"pages/{foreign_page.id}/")).status_code == 404
        assert client.put(ws_url(f"pages/{foreign_page.id}/"), {"name": "x"}, format="json").status_code == 404
        assert client.post(ws_url(f"pages/{foreign_page.id}/archive/")).status_code == 404

    def test_project_page_is_not_a_workspace_page(self, client, ws_url, project_url):
        page = _create(client, project_url("pages/"))
        assert client.get(ws_url(f"pages/{page['id']}/")).status_code == 404


@pytest.mark.contract
class TestProjectPages:
    def test_crud_and_web_app_linkage(self, client, session_client, project_url, project, workspace, sdk):
        created = sdk(
            f"{M}.Page", _create(client, project_url("pages/"), description_html="<p>Hi<script>x</script></p>")
        )
        pid = created["id"]
        assert created["projects"] == [str(project.id)] and created["is_global"] is False
        assert "<script>" not in created["description_html"]
        assert ProjectPage.objects.filter(page_id=pid, project=project).exists()
        page = Page.objects.get(pk=pid)
        assert page.description_binary is None  # the live server builds it from the HTML on first open

        # The web app's own endpoints see it, and serve an empty binary, which
        # makes the live server convert description_html.
        base = f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/"
        res = session_client.get(base)
        assert res.status_code == 200 and pid in [str(p["id"]) for p in res.data]
        res = session_client.get(f"{base}{pid}/description/")
        assert res.status_code == 200 and b"".join(res.streaming_content) == b""

        res = client.get(project_url("pages/"))
        assert [p["id"] for p in sdk(f"{M}.PaginatedPageResponse", res.data)["results"]] == [pid]
        assert sdk(f"{M}.Page", client.get(project_url(f"pages/{pid}/")).data)["id"] == pid

        assert client.post(project_url(f"pages/{pid}/archive/")).status_code == 200
        assert client.delete(project_url(f"pages/{pid}/archive/")).status_code == 204
        client.post(project_url(f"pages/{pid}/archive/"))
        assert client.delete(project_url(f"pages/{pid}/")).status_code == 204

    def test_update_clears_the_stale_yjs_document(self, client, project_url):
        pid = _create(client, project_url("pages/"))["id"]
        Page.objects.filter(pk=pid).update(description_binary=b"\x01\x02stale", description_json={"type": "doc"})
        res = client.put(project_url(f"pages/{pid}/"), {"description_html": "<p>Fresh</p>"}, format="json")
        assert res.status_code == 200, res.data
        page = Page.objects.get(pk=pid)
        assert page.description_html == "<p>Fresh</p>" and page.description_binary is None
        assert page.description_json == {}

    def test_metadata_only_update_keeps_the_yjs_document(self, client, project_url):
        pid = _create(client, project_url("pages/"))["id"]
        Page.objects.filter(pk=pid).update(description_binary=b"\x01\x02live")
        assert client.put(project_url(f"pages/{pid}/"), {"color": "#000"}, format="json").status_code == 200
        assert bytes(Page.objects.get(pk=pid).description_binary) == b"\x01\x02live"

    def test_collection_is_refused_for_project_pages(self, client, project_url):
        res = client.post(
            project_url("pages/"), {"name": "x", "description_html": "", "collection_id": str(uuid4())}, format="json"
        )
        assert res.status_code == 400

    def test_private_page_and_guest_visibility(self, client, member_client, guest_client, project_url):
        private = _create(client, project_url("pages/"), access=1)
        public = _create(client, project_url("pages/"))
        assert member_client.get(project_url(f"pages/{private['id']}/")).status_code == 404
        ids = [p["id"] for p in member_client.get(project_url("pages/")).data["results"]]
        assert ids == [public["id"]]
        # A guest sees only their own pages unless the project shows guests everything.
        assert guest_client.get(project_url(f"pages/{public['id']}/")).status_code == 404
        assert (
            guest_client.post(project_url("pages/"), {"name": "x", "description_html": ""}, format="json").status_code
            == 403
        )

    def test_guest_sees_public_pages_when_project_allows(self, client, guest_client, project_url, project):
        Project.objects.filter(pk=project.pk).update(guest_view_all_features=True)
        public = _create(client, project_url("pages/"))
        assert guest_client.get(project_url(f"pages/{public['id']}/")).status_code == 200
        assert guest_client.put(project_url(f"pages/{public['id']}/"), {"name": "x"}, format="json").status_code == 403

    def test_member_cannot_delete_others_page(self, client, member_client, project_url):
        pid = _create(client, project_url("pages/"))["id"]
        client.post(project_url(f"pages/{pid}/archive/"))
        assert member_client.delete(project_url(f"pages/{pid}/")).status_code == 403

    def test_outsider_and_foreign_ids(self, client, outsider_client, project_url, foreign_page):
        assert outsider_client.get(project_url("pages/")).status_code == 403
        assert client.get(project_url(f"pages/{foreign_page.id}/")).status_code == 404
        assert client.get(project_url(f"pages/{uuid4()}/")).status_code == 404


@pytest.fixture
def fake_live_server(db):
    """A stand-in for apps/live: holds a document's Redis channel and lets go of it
    on the force_close admin command, as the hocuspocus Redis extension does."""
    started = []

    def start(page_id, release=True):
        client = redis_instance()
        pubsub = client.pubsub()
        pubsub.subscribe(f"hocuspocus:{page_id}", "hocuspocus:admin")
        confirmed = 0
        while confirmed < 2:  # both subscriptions are live before the request runs
            msg = pubsub.get_message(timeout=1)
            confirmed += bool(msg and msg["type"] == "subscribe")
        received = []
        stop = threading.Event()

        def run():
            while not stop.is_set():
                msg = pubsub.get_message(timeout=0.05)
                if msg and msg["type"] == "message" and msg["channel"] == b"hocuspocus:admin":
                    data = json.loads(msg["data"])
                    received.append(data)
                    if release and data.get("docId") == str(page_id):
                        pubsub.unsubscribe(f"hocuspocus:{page_id}")
            pubsub.close()

        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        started.append((stop, thread, client))  # keep the client: collecting it closes the connection
        return received

    yield start
    for stop, thread, _client in started:
        stop.set()
        thread.join(timeout=2)


@pytest.mark.contract
class TestLiveDocumentRelease:
    def test_open_document_is_released_before_the_write(self, client, project_url, fake_live_server):
        pid = _create(client, project_url("pages/"))["id"]
        received = fake_live_server(pid)
        res = client.put(project_url(f"pages/{pid}/"), {"description_html": "<p>From the API</p>"}, format="json")
        assert res.status_code == 200, res.data
        assert received and received[0]["command"] == "force_close" and received[0]["docId"] == pid
        assert Page.objects.get(pk=pid).description_html == "<p>From the API</p>"

    def test_an_editor_that_reconnects_during_the_write_is_released_again(
        self, client, project_url, fake_live_server, monkeypatch
    ):
        pid = _create(client, project_url("pages/"))["id"]
        fake_live_server(pid)
        real_release = page_views.release_live_document
        reconnected = []

        def release(page_id):
            released = real_release(page_id)
            if not reconnected:  # an editor reconnects before the write lands, loading the old content
                reconnected.append(fake_live_server(page_id))
            return released

        monkeypatch.setattr(page_views, "release_live_document", release)
        res = client.put(project_url(f"pages/{pid}/"), {"description_html": "<p>From the API</p>"}, format="json")
        assert res.status_code == 200, res.data
        assert [c["command"] for c in reconnected[0]] == ["force_close"]
        assert redis_instance().pubsub_numsub(f"hocuspocus:{pid}")[0][1] == 0
        assert Page.objects.get(pk=pid).description_html == "<p>From the API</p>"

    def test_document_that_is_not_released_is_not_written(self, client, project_url, fake_live_server, monkeypatch):
        monkeypatch.setattr(page_views, "LIVE_RELEASE_TIMEOUT", 0.5)
        pid = _create(client, project_url("pages/"))["id"]
        fake_live_server(pid, release=False)
        res = client.put(project_url(f"pages/{pid}/"), {"description_html": "<p>Lost</p>"}, format="json")
        assert res.status_code == 502 and res.data["code"] == "LIVE_SERVER_BUSY"
        assert Page.objects.get(pk=pid).description_html == "<p>Hello</p>"


@pytest.fixture
def issue(project, workspace):
    return Issue.objects.create(name="Bug", project=project, workspace=workspace)


@pytest.mark.contract
class TestWorkItemPages:
    def test_attach_list_detach(self, client, project_url, ws_url, issue, sdk):
        project_page = _create(client, project_url("pages/"))
        wiki_page = _create(client, ws_url("pages/"))
        url = project_url(f"work-items/{issue.id}/pages/")

        res = client.post(url, {"page_id": project_page["id"]}, format="json")
        assert res.status_code == 201, res.data
        link = sdk("plane.models.work_item_pages.WorkItemPage", res.data)
        assert link["page"]["id"] == project_page["id"] and link["issue"] == str(issue.id)
        assert client.post(url, {"page_id": project_page["id"]}, format="json").status_code == 200  # idempotent
        assert client.post(url, {"page_id": wiki_page["id"]}, format="json").status_code == 201

        res = client.get(url)
        assert res.status_code == 200
        listed = sdk("plane.models.work_item_pages.PaginatedWorkItemPageResponse", res.data)
        assert {r["page"]["id"] for r in listed["results"]} == {project_page["id"], wiki_page["id"]}

        assert client.delete(f"{url}{link['id']}/").status_code == 204
        assert not WorkItemPage.objects.filter(pk=link["id"]).exists()
        assert client.delete(f"{url}{link['id']}/").status_code == 404

    def test_private_and_foreign_pages_cannot_be_attached(
        self, client, member_client, project_url, issue, foreign_page
    ):
        private = _create(client, project_url("pages/"), access=1)
        url = project_url(f"work-items/{issue.id}/pages/")
        assert member_client.post(url, {"page_id": private["id"]}, format="json").status_code == 404
        assert client.post(url, {"page_id": str(foreign_page.id)}, format="json").status_code == 404
        client.post(url, {"page_id": private["id"]}, format="json")
        assert member_client.get(url).data["results"] == []  # links to private pages stay private

    def test_permissions_and_foreign_work_item(
        self, client, guest_client, outsider_client, project_url, issue, workspace
    ):
        page = _create(client, project_url("pages/"))
        url = project_url(f"work-items/{issue.id}/pages/")
        assert guest_client.post(url, {"page_id": page["id"]}, format="json").status_code == 403
        assert guest_client.get(url).status_code == 200
        assert outsider_client.get(url).status_code == 403
        other = Project.objects.create(name="Other", identifier="OT", workspace=workspace)
        foreign_issue = Issue.objects.create(name="Elsewhere", project=other, workspace=workspace)
        assert client.get(project_url(f"work-items/{foreign_issue.id}/pages/")).status_code == 404
