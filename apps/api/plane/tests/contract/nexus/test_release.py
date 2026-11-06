# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: releases, changelogs, release work items, release labels and tags."""

from uuid import uuid4

import pytest

from plane.db.models import Issue, Project, ProjectMember, User, Workspace
from plane.nexus.models import Release, ReleaseChangelog, ReleaseLabel, ReleaseTag
from plane.nexus.models import WorkItemProperty

from .test_work_item_support import GUEST, make_issue

R = "plane.models.releases."


@pytest.fixture
def issue(project, workspace):
    return Issue.objects.create(name="Ship it", project=project, workspace=workspace)


@pytest.fixture
def foreign(db):
    """A release, label, tag and work item in a different workspace."""
    owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
    ws = Workspace.objects.create(name="Elsewhere", slug=f"else-{uuid4().hex[:6]}", owner=owner)
    project = Project.objects.create(name="Else", identifier="EL", workspace=ws)
    ProjectMember.objects.create(project=project, member=owner, role=20)
    return {
        "release": Release.objects.create(workspace=ws, name="Foreign"),
        "label": ReleaseLabel.objects.create(workspace=ws, name="Foreign"),
        "tag": ReleaseTag.objects.create(workspace=ws, version="9.9.9"),
        "issue": Issue.objects.create(name="Foreign", project=project, workspace=ws),
    }


def _create(client, ws_url, **body):
    res = client.post(ws_url("releases/"), {"name": "v1", **body}, format="json")
    assert res.status_code == 201, res.data
    return res.data


@pytest.mark.contract
class TestReleases:
    def test_crud(self, client, ws_url, sdk, create_user):
        tag = client.post(ws_url("releases/tags/"), {"version": "1.0.0"}, format="json").data
        body = _create(
            client,
            ws_url,
            name="Spring",
            description_html="<p>Notes</p>",
            status="unreleased",
            release_date="2026-12-01",
            target_date="2026-11-30",
            tag=str(tag["id"]),
            lead=str(create_user.id),
            is_prerelease=True,
            external_source="github",
            external_id="42",
        )
        sdk(R + "Release", body)
        assert body["description"]["description_html"] == "<p>Notes</p>"
        assert body["description"]["description_stripped"] == "Notes"
        assert str(body["tag"]) == str(tag["id"]) and str(body["lead"]) == str(create_user.id)
        assert body["release_date"] == "2026-12-01" and body["is_prerelease"] is True
        assert ReleaseChangelog.objects.filter(release_id=body["id"]).exists()

        rid = body["id"]
        res = client.get(ws_url("releases/"), {"per_page": 3})
        assert res.status_code == 200
        page = sdk(R + "PaginatedReleaseResponse", res.data)
        assert [r["id"] for r in page["results"]] == [str(rid)]

        res = client.get(ws_url(f"releases/{rid}/"))
        assert res.status_code == 200 and sdk(R + "Release", res.data)["name"] == "Spring"

        res = client.patch(ws_url(f"releases/{rid}/"), {"status": "released", "is_prerelease": False}, format="json")
        assert res.status_code == 200, res.data
        assert sdk(R + "Release", res.data)["status"] == "released" and res.data["is_latest"] is True

        res = client.patch(ws_url(f"releases/{rid}/"), {}, format="json")
        assert res.status_code == 200 and res.data["name"] == "Spring"

        assert client.delete(ws_url(f"releases/{rid}/")).status_code == 204
        assert client.get(ws_url(f"releases/{rid}/")).status_code == 404

    def test_validation(self, client, ws_url, foreign):
        assert client.post(ws_url("releases/"), {}, format="json").status_code == 400
        assert client.post(ws_url("releases/"), {"name": "x", "status": "bogus"}, format="json").status_code == 400
        res = client.post(ws_url("releases/"), {"name": "x", "tag": str(foreign["tag"].id)}, format="json")
        assert res.status_code == 400 and "tag" in res.data

    def test_foreign_ids_404(self, client, ws_url, foreign):
        rid = foreign["release"].id
        assert client.get(ws_url(f"releases/{rid}/")).status_code == 404
        assert client.patch(ws_url(f"releases/{rid}/"), {"name": "x"}, format="json").status_code == 404
        assert client.delete(ws_url(f"releases/{rid}/")).status_code == 404
        assert client.get(ws_url(f"releases/{rid}/changelog/")).status_code == 404
        assert client.get(ws_url(f"releases/{rid}/work-items/")).status_code == 404
        assert client.get(ws_url(f"releases/{rid}/labels/")).status_code == 404

    def test_permissions(self, client, guest_client, member_client, outsider_client, ws_url):
        rid = _create(client, ws_url)["id"]
        assert guest_client.get(ws_url("releases/")).status_code == 200
        assert guest_client.get(ws_url(f"releases/{rid}/")).status_code == 200
        assert guest_client.post(ws_url("releases/"), {"name": "g"}, format="json").status_code == 403
        assert guest_client.patch(ws_url(f"releases/{rid}/"), {"name": "g"}, format="json").status_code == 403
        assert outsider_client.get(ws_url("releases/")).status_code == 403
        assert outsider_client.get(ws_url(f"releases/{rid}/")).status_code == 403
        assert member_client.patch(ws_url(f"releases/{rid}/"), {"name": "m"}, format="json").status_code == 200
        # Deleting takes the creator or an admin.
        assert member_client.delete(ws_url(f"releases/{rid}/")).status_code == 403
        own = member_client.post(ws_url("releases/"), {"name": "mine"}, format="json").data["id"]
        assert member_client.delete(ws_url(f"releases/{own}/")).status_code == 204


@pytest.mark.contract
class TestReleaseChangelog:
    def test_get_and_update(self, client, ws_url, sdk):
        rid = _create(client, ws_url)["id"]
        res = client.get(ws_url(f"releases/{rid}/changelog/"))
        assert res.status_code == 200
        sdk(R + "ReleaseChangelog", res.data)
        doc = {"type": "doc", "content": [{"type": "paragraph"}]}
        res = client.patch(
            ws_url(f"releases/{rid}/changelog/"),
            {"description_html": "<p>notes</p>", "description_json": doc},
            format="json",
        )
        assert res.status_code == 200, res.data
        body = sdk(R + "ReleaseChangelog", res.data)
        assert body["changelog"]["description_html"] == "<p>notes</p>"
        assert body["changelog"]["description_stripped"] == "notes"
        assert body["changelog"]["description_json"] == doc
        assert str(body["release"]) == str(rid)

    def test_created_lazily_for_old_rows(self, client, ws_url, workspace, sdk):
        release = Release.objects.create(workspace=workspace, name="old")
        res = client.get(ws_url(f"releases/{release.id}/changelog/"))
        assert res.status_code == 200 and sdk(R + "ReleaseChangelog", res.data)

    def test_guest_cannot_update(self, client, guest_client, ws_url):
        rid = _create(client, ws_url)["id"]
        assert guest_client.get(ws_url(f"releases/{rid}/changelog/")).status_code == 200
        res = guest_client.patch(ws_url(f"releases/{rid}/changelog/"), {"description_html": "<p>x</p>"}, format="json")
        assert res.status_code == 403


@pytest.mark.contract
class TestReleaseWorkItems:
    def test_add_list_remove(self, client, ws_url, issue, sdk):
        rid = _create(client, ws_url)["id"]
        url = ws_url(f"releases/{rid}/work-items/")
        res = client.post(url, {"work_item_ids": [str(issue.id)]}, format="json")
        assert res.status_code == 201, res.data
        # Re-adding is a no-op.
        assert client.post(url, {"work_item_ids": [str(issue.id)]}, format="json").status_code == 201

        res = client.get(url, {"per_page": 3})
        assert res.status_code == 200
        page = sdk(R + "PaginatedReleaseWorkItemResponse", res.data)
        assert [w["id"] for w in page["results"]] == [str(issue.id)]
        assert page["results"][0]["name"] == "Ship it" and page["total_count"] == 1

        assert client.delete(url, {"work_item_ids": [str(issue.id)]}, format="json").status_code == 204
        assert client.get(url).data["results"] == []

    def test_foreign_and_bad_ids(self, client, ws_url, foreign):
        rid = _create(client, ws_url)["id"]
        url = ws_url(f"releases/{rid}/work-items/")
        res = client.post(url, {"work_item_ids": [str(foreign["issue"].id)]}, format="json")
        assert res.status_code == 400 and str(foreign["issue"].id) in res.data["error"]
        assert client.post(url, {"work_item_ids": ["nope"]}, format="json").status_code == 400
        assert client.post(url, {}, format="json").status_code == 400

    def test_pql_error_is_400(self, client, ws_url):
        rid = _create(client, ws_url)["id"]
        res = client.get(ws_url(f"releases/{rid}/work-items/"), {"pql": "priority = high AND ("})
        assert res.status_code == 400 and "error" in res.data

    def test_guest_cannot_link(self, client, guest_client, ws_url, issue):
        rid = _create(client, ws_url)["id"]
        url = ws_url(f"releases/{rid}/work-items/")
        assert guest_client.get(url).status_code == 200
        assert guest_client.post(url, {"work_item_ids": [str(issue.id)]}, format="json").status_code == 403
        assert guest_client.delete(url, {"work_item_ids": [str(issue.id)]}, format="json").status_code == 403


@pytest.mark.contract
class TestReleaseLabels:
    def test_palette_crud(self, client, ws_url, sdk):
        res = client.post(
            ws_url("releases/labels/"), {"name": "Backend", "color": "#4E5355", "sort_order": 0}, format="json"
        )
        assert res.status_code == 201, res.data
        label = sdk(R + "ReleaseLabel", res.data)
        assert label["sort_order"] == 0

        res = client.get(ws_url("releases/labels/"))
        assert res.status_code == 200
        assert len(sdk(R + "PaginatedReleaseLabelResponse", res.data)["results"]) == 1

        res = client.patch(
            ws_url(f"releases/labels/{label['id']}/"), {"name": "API", "color": "#000000"}, format="json"
        )
        assert res.status_code == 200 and sdk(R + "ReleaseLabel", res.data)["name"] == "API"
        assert client.patch(ws_url(f"releases/labels/{label['id']}/"), {}, format="json").status_code == 200

        dup = client.post(ws_url("releases/labels/"), {"name": "API"}, format="json")
        assert dup.status_code == 400

        assert client.delete(ws_url(f"releases/labels/{label['id']}/")).status_code == 204
        assert client.get(ws_url("releases/labels/")).data["results"] == []

    def test_attach_list_detach(self, client, ws_url, sdk):
        rid = _create(client, ws_url)["id"]
        label = client.post(ws_url("releases/labels/"), {"name": "UI"}, format="json").data
        url = ws_url(f"releases/{rid}/labels/")
        res = client.post(url, {"label_ids": [str(label["id"])]}, format="json")
        assert res.status_code == 201, res.data
        assert [sdk(R + "ReleaseLabel", item)["name"] for item in res.data] == ["UI"]

        res = client.get(url, {"per_page": 3})
        assert res.status_code == 200
        assert [r["id"] for r in sdk(R + "PaginatedReleaseLabelResponse", res.data)["results"]] == [str(label["id"])]
        assert client.get(ws_url(f"releases/{rid}/")).data["label_ids"] == [str(label["id"])]

        assert client.delete(url, {"label_ids": [str(label["id"])]}, format="json").status_code == 204
        assert client.get(url).data["results"] == []
        # Detaching leaves the label in the palette.
        assert len(client.get(ws_url("releases/labels/")).data["results"]) == 1

    def test_foreign_ids(self, client, ws_url, foreign):
        lid = foreign["label"].id
        assert client.patch(ws_url(f"releases/labels/{lid}/"), {"name": "x"}, format="json").status_code == 404
        assert client.delete(ws_url(f"releases/labels/{lid}/")).status_code == 404
        rid = _create(client, ws_url)["id"]
        res = client.post(ws_url(f"releases/{rid}/labels/"), {"label_ids": [str(lid)]}, format="json")
        assert res.status_code == 400

    def test_permissions(self, client, guest_client, outsider_client, ws_url):
        label = client.post(ws_url("releases/labels/"), {"name": "L"}, format="json").data
        rid = _create(client, ws_url)["id"]
        assert guest_client.get(ws_url("releases/labels/")).status_code == 200
        assert guest_client.post(ws_url("releases/labels/"), {"name": "g"}, format="json").status_code == 403
        assert guest_client.delete(ws_url(f"releases/labels/{label['id']}/")).status_code == 403
        res = guest_client.post(ws_url(f"releases/{rid}/labels/"), {"label_ids": [str(label["id"])]}, format="json")
        assert res.status_code == 403
        assert outsider_client.get(ws_url("releases/labels/")).status_code == 403


@pytest.mark.contract
class TestReleaseTags:
    def test_crud(self, client, ws_url, sdk):
        body = {"version": "2.0.0", "description": "Big", "commit_hash": "abc123", "git_tag": "v2.0.0"}
        res = client.post(ws_url("releases/tags/"), body, format="json")
        assert res.status_code == 201, res.data
        tag = sdk(R + "ReleaseTag", res.data)
        assert tag["git_tag"] == "v2.0.0"

        res = client.get(ws_url("releases/tags/"), {"per_page": 3})
        assert res.status_code == 200
        assert len(sdk(R + "PaginatedReleaseTagResponse", res.data)["results"]) == 1

        res = client.get(ws_url(f"releases/tags/{tag['id']}/"))
        assert res.status_code == 200 and sdk(R + "ReleaseTag", res.data)["version"] == "2.0.0"

        res = client.patch(ws_url(f"releases/tags/{tag['id']}/"), {"version": "2.0.1"}, format="json")
        assert res.status_code == 200 and sdk(R + "ReleaseTag", res.data)["version"] == "2.0.1"
        assert client.patch(ws_url(f"releases/tags/{tag['id']}/"), {}, format="json").status_code == 200

        assert client.post(ws_url("releases/tags/"), {"version": "2.0.1"}, format="json").status_code == 400
        assert client.post(ws_url("releases/tags/"), {}, format="json").status_code == 400

        assert client.delete(ws_url(f"releases/tags/{tag['id']}/")).status_code == 204
        assert client.get(ws_url(f"releases/tags/{tag['id']}/")).status_code == 404

    def test_deleting_a_tag_keeps_the_release(self, client, ws_url):
        tag = client.post(ws_url("releases/tags/"), {"version": "3.0"}, format="json").data
        rid = _create(client, ws_url, tag=str(tag["id"]))["id"]
        client.delete(ws_url(f"releases/tags/{tag['id']}/"))
        res = client.get(ws_url(f"releases/{rid}/"))
        assert res.status_code == 200 and res.data["tag"] is None

    def test_foreign_ids_404(self, client, ws_url, foreign):
        tid = foreign["tag"].id
        assert client.get(ws_url(f"releases/tags/{tid}/")).status_code == 404
        assert client.patch(ws_url(f"releases/tags/{tid}/"), {"version": "x"}, format="json").status_code == 404
        assert client.delete(ws_url(f"releases/tags/{tid}/")).status_code == 404

    def test_permissions(self, client, guest_client, member_client, outsider_client, ws_url):
        tag = client.post(ws_url("releases/tags/"), {"version": "1"}, format="json").data
        assert guest_client.get(ws_url(f"releases/tags/{tag['id']}/")).status_code == 200
        assert guest_client.post(ws_url("releases/tags/"), {"version": "g"}, format="json").status_code == 403
        assert (
            guest_client.patch(ws_url(f"releases/tags/{tag['id']}/"), {"version": "g"}, format="json").status_code
            == 403
        )
        assert member_client.post(ws_url("releases/tags/"), {"version": "m"}, format="json").status_code == 201
        assert outsider_client.get(ws_url("releases/tags/")).status_code == 403


@pytest.mark.contract
class TestReleaseWorkItemVisibility:
    def test_restricted_guest_sees_only_their_own_work_items(
        self, client, make_user, workspace, project, ws_url, issue
    ):
        guest, guest_api = make_user(GUEST, workspace=workspace, project=project)
        own = make_issue(project, "Mine", creator=guest)
        rid = _create(client, ws_url)["id"]
        url = ws_url(f"releases/{rid}/work-items/")
        assert client.post(url, {"work_item_ids": [str(issue.id), str(own.id)]}, format="json").status_code == 201
        assert {w["id"] for w in client.get(url).data["results"]} == {str(issue.id), str(own.id)}
        assert [w["id"] for w in guest_api.get(url).data["results"]] == [str(own.id)]

    def test_pql_lookups_are_scoped_to_the_workspace(self, client, ws_url, foreign):
        rid = _create(client, ws_url)["id"]
        url = ws_url(f"releases/{rid}/work-items/")
        res = client.get(url, {"pql": 'childOf("NOPE-9")'})
        assert res.status_code == 400 and "no work item NOPE-9" in res.data["error"]
        prop = WorkItemProperty.objects.create(
            workspace=foreign["release"].workspace, display_name="Secret budget", property_type="TEXT"
        )
        res = client.get(url, {"pql": f'cf["{prop.id}"] ~ "x"'})
        assert res.status_code == 400 and "Secret budget" not in res.data["error"]
