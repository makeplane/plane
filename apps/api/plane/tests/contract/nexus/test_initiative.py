# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: initiatives, their projects and their work items."""

from uuid import uuid4

import pytest

from plane.db.models import Issue, Project, ProjectMember, User, Workspace
from plane.nexus.models import Initiative

from .test_work_item_support import GUEST, make_issue, make_project

I = "plane.models.initiatives."  # noqa: E741


@pytest.fixture
def issue(project, workspace):
    return Issue.objects.create(name="Epic-ish", project=project, workspace=workspace)


@pytest.fixture
def foreign(db):
    owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
    ws = Workspace.objects.create(name="Elsewhere", slug=f"else-{uuid4().hex[:6]}", owner=owner)
    project = Project.objects.create(name="Else", identifier="EL", workspace=ws)
    ProjectMember.objects.create(project=project, member=owner, role=20)
    return {
        "project": project,
        "initiative": Initiative.objects.create(workspace=ws, name="Foreign"),
        "issue": Issue.objects.create(name="Foreign", project=project, workspace=ws),
    }


def _create(client, ws_url, **body):
    res = client.post(ws_url("initiatives/"), {"name": "Grow", **body}, format="json")
    assert res.status_code == 201, res.data
    return res.data


@pytest.mark.contract
class TestInitiatives:
    def test_crud(self, client, ws_url, sdk, create_user):
        body = _create(
            client,
            ws_url,
            description_html="<p>Why</p>",
            start_date="2026-01-01",
            end_date="2026-06-30",
            state="PLANNED",
            lead=str(create_user.id),
        )
        sdk(I + "Initiative", body)
        assert body["state"] == "PLANNED" and body["description_stripped"] == "Why" and body["logo_props"] == {}
        iid = body["id"]

        res = client.get(ws_url("initiatives/"))
        assert res.status_code == 200
        assert [i["id"] for i in sdk(I + "PaginatedInitiativeResponse", res.data)["results"]] == [str(iid)]

        res = client.get(ws_url(f"initiatives/{iid}/"))
        assert res.status_code == 200 and sdk(I + "Initiative", res.data)["name"] == "Grow"

        res = client.patch(ws_url(f"initiatives/{iid}/"), {"state": "ACTIVE", "name": "Grow more"}, format="json")
        assert res.status_code == 200 and sdk(I + "Initiative", res.data)["state"] == "ACTIVE"
        assert client.patch(ws_url(f"initiatives/{iid}/"), {}, format="json").status_code == 200

        assert client.delete(ws_url(f"initiatives/{iid}/")).status_code == 204
        assert client.get(ws_url(f"initiatives/{iid}/")).status_code == 404

    def test_validation(self, client, ws_url):
        assert client.post(ws_url("initiatives/"), {}, format="json").status_code == 400
        assert client.post(ws_url("initiatives/"), {"name": "x", "state": "DONE"}, format="json").status_code == 400
        res = client.post(
            ws_url("initiatives/"), {"name": "x", "start_date": "2026-02-01", "end_date": "2026-01-01"}, format="json"
        )
        assert res.status_code == 400
        res = client.post(ws_url("initiatives/"), {"name": "x", "lead": str(uuid4())}, format="json")
        assert res.status_code == 400

    def test_foreign_ids_404(self, client, ws_url, foreign):
        iid = foreign["initiative"].id
        assert client.get(ws_url(f"initiatives/{iid}/")).status_code == 404
        assert client.patch(ws_url(f"initiatives/{iid}/"), {"name": "x"}, format="json").status_code == 404
        assert client.delete(ws_url(f"initiatives/{iid}/")).status_code == 404
        assert client.get(ws_url(f"initiatives/{iid}/projects/")).status_code == 404
        assert client.get(ws_url(f"initiatives/{iid}/work-items/")).status_code == 404

    def test_permissions(self, client, guest_client, member_client, outsider_client, ws_url):
        iid = _create(client, ws_url)["id"]
        assert guest_client.get(ws_url("initiatives/")).status_code == 200
        assert guest_client.get(ws_url(f"initiatives/{iid}/")).status_code == 200
        assert guest_client.post(ws_url("initiatives/"), {"name": "g"}, format="json").status_code == 403
        assert guest_client.patch(ws_url(f"initiatives/{iid}/"), {"name": "g"}, format="json").status_code == 403
        assert outsider_client.get(ws_url("initiatives/")).status_code == 403
        assert member_client.patch(ws_url(f"initiatives/{iid}/"), {"name": "m"}, format="json").status_code == 200
        assert member_client.delete(ws_url(f"initiatives/{iid}/")).status_code == 403
        own = member_client.post(ws_url("initiatives/"), {"name": "mine"}, format="json").data["id"]
        assert member_client.delete(ws_url(f"initiatives/{own}/")).status_code == 204


@pytest.mark.contract
class TestInitiativeProjects:
    def test_add_list_remove(self, client, ws_url, project, sdk):
        iid = _create(client, ws_url)["id"]
        url = ws_url(f"initiatives/{iid}/projects/")
        res = client.post(url, {"project_ids": [str(project.id)]}, format="json")
        assert res.status_code == 201, res.data
        assert [sdk("plane.models.projects.Project", p)["id"] for p in res.data] == [str(project.id)]
        assert client.post(url, {"project_ids": [str(project.id)]}, format="json").status_code == 201

        res = client.get(url, {"per_page": 3})
        assert res.status_code == 200
        page = sdk("plane.models.projects.PaginatedProjectResponse", res.data)
        assert [p["id"] for p in page["results"]] == [str(project.id)]

        assert client.delete(url, {"project_ids": [str(project.id)]}, format="json").status_code == 204
        assert client.get(url).data["results"] == []

    def test_rejects_foreign_projects(self, client, ws_url, foreign):
        iid = _create(client, ws_url)["id"]
        url = ws_url(f"initiatives/{iid}/projects/")
        assert client.post(url, {"project_ids": [str(foreign["project"].id)]}, format="json").status_code == 400
        assert client.post(url, {"project_ids": []}, format="json").status_code == 400

    def test_guest_cannot_change(self, client, guest_client, ws_url, project):
        iid = _create(client, ws_url)["id"]
        url = ws_url(f"initiatives/{iid}/projects/")
        assert guest_client.get(url).status_code == 200
        assert guest_client.post(url, {"project_ids": [str(project.id)]}, format="json").status_code == 403
        assert guest_client.delete(url, {"project_ids": [str(project.id)]}, format="json").status_code == 403


@pytest.mark.contract
class TestInitiativeWorkItems:
    def test_add_list_remove(self, client, ws_url, issue, sdk):
        iid = _create(client, ws_url)["id"]
        url = ws_url(f"initiatives/{iid}/work-items/")
        res = client.post(url, {"work_item_ids": [str(issue.id)]}, format="json")
        assert res.status_code == 201, res.data
        assert [sdk("plane.models.work_items.WorkItem", w)["id"] for w in res.data] == [str(issue.id)]

        res = client.get(url, {"per_page": 3})
        assert res.status_code == 200
        page = sdk("plane.models.work_items.PaginatedWorkItemResponse", res.data)
        assert [w["id"] for w in page["results"]] == [str(issue.id)]

        assert client.delete(url, {"work_item_ids": [str(issue.id)]}, format="json").status_code == 204
        assert client.get(url).data["results"] == []

    def test_rejects_foreign_work_items(self, client, ws_url, foreign):
        iid = _create(client, ws_url)["id"]
        url = ws_url(f"initiatives/{iid}/work-items/")
        assert client.post(url, {"work_item_ids": [str(foreign["issue"].id)]}, format="json").status_code == 400

    def test_pql_error_is_400(self, client, ws_url):
        iid = _create(client, ws_url)["id"]
        res = client.get(ws_url(f"initiatives/{iid}/work-items/"), {"pql": "priority = high AND ("})
        assert res.status_code == 400 and "error" in res.data

    def test_hides_work_items_outside_callers_projects(self, client, make_user, workspace, ws_url, issue):
        iid = _create(client, ws_url)["id"]
        client.post(ws_url(f"initiatives/{iid}/work-items/"), {"work_item_ids": [str(issue.id)]}, format="json")
        _, stranger = make_user(15, workspace=workspace)  # workspace member, not in the project
        res = stranger.get(ws_url(f"initiatives/{iid}/work-items/"))
        assert res.status_code == 200 and res.data["results"] == []

    def test_guest_cannot_change(self, client, guest_client, ws_url, issue):
        iid = _create(client, ws_url)["id"]
        url = ws_url(f"initiatives/{iid}/work-items/")
        assert guest_client.get(url).status_code == 200
        assert guest_client.post(url, {"work_item_ids": [str(issue.id)]}, format="json").status_code == 403
        assert guest_client.delete(url, {"work_item_ids": [str(issue.id)]}, format="json").status_code == 403


@pytest.mark.contract
class TestInitiativeVisibility:
    def test_secret_projects_are_hidden_from_non_members(
        self, client, member_client, ws_url, workspace, project, create_user
    ):
        secret = make_project(workspace, create_user)
        secret.network = 0
        secret.save(update_fields=["network"])
        iid = _create(client, ws_url)["id"]
        url = ws_url(f"initiatives/{iid}/projects/")
        assert client.post(url, {"project_ids": [str(project.id), str(secret.id)]}, format="json").status_code == 201
        assert {str(p["id"]) for p in client.get(url).data["results"]} == {str(project.id), str(secret.id)}
        assert [str(p["id"]) for p in member_client.get(url).data["results"]] == [str(project.id)]
        res = member_client.post(url, {"project_ids": [str(secret.id)]}, format="json")
        assert res.status_code == 400 and str(secret.id) in res.data["error"]

    def test_restricted_guest_sees_only_their_own_work_items(
        self, client, make_user, workspace, project, ws_url, issue
    ):
        guest, guest_api = make_user(GUEST, workspace=workspace, project=project)
        own = make_issue(project, "Mine", creator=guest)
        iid = _create(client, ws_url)["id"]
        url = ws_url(f"initiatives/{iid}/work-items/")
        assert client.post(url, {"work_item_ids": [str(issue.id), str(own.id)]}, format="json").status_code == 201
        assert [str(w["id"]) for w in guest_api.get(url).data["results"]] == [str(own.id)]
