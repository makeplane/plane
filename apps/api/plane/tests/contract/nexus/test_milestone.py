# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: project milestones and their work items."""

from uuid import uuid4

import pytest

from plane.db.models import Issue, Project, ProjectMember, User, Workspace
from plane.nexus.models import Milestone

from .test_work_item_support import GUEST, make_issue

M = "plane.models.milestones."


@pytest.fixture
def issue(project, workspace):
    return Issue.objects.create(name="Task", project=project, workspace=workspace)


@pytest.fixture
def foreign(db):
    owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
    ws = Workspace.objects.create(name="Elsewhere", slug=f"else-{uuid4().hex[:6]}", owner=owner)
    project = Project.objects.create(name="Else", identifier="EL", workspace=ws)
    ProjectMember.objects.create(project=project, member=owner, role=20)
    return {
        "project": project,
        "milestone": Milestone.objects.create(workspace=ws, project=project, title="Foreign"),
        "issue": Issue.objects.create(name="Foreign", project=project, workspace=ws),
    }


def _create(client, project_url, **body):
    res = client.post(project_url("milestones/"), {"title": "M1", **body}, format="json")
    assert res.status_code == 201, res.data
    return res.data


@pytest.mark.contract
class TestMilestones:
    def test_crud(self, client, project_url, sdk):
        body = _create(client, project_url, target_date="2026-12-31", external_source="jira", external_id="J-1")
        sdk(M + "Milestone", body)
        assert body["target_date"] == "2026-12-31" and body["external_id"] == "J-1"
        mid = body["id"]

        res = client.get(project_url("milestones/"), {"per_page": 3})
        assert res.status_code == 200
        assert [m["id"] for m in sdk(M + "PaginatedMilestoneResponse", res.data)["results"]] == [str(mid)]

        res = client.get(project_url(f"milestones/{mid}/"))
        assert res.status_code == 200 and sdk(M + "Milestone", res.data)["title"] == "M1"

        res = client.patch(
            project_url(f"milestones/{mid}/"), {"title": "M2", "target_date": "2027-01-15"}, format="json"
        )
        assert res.status_code == 200 and sdk(M + "Milestone", res.data)["title"] == "M2"
        assert client.patch(project_url(f"milestones/{mid}/"), {}, format="json").status_code == 200

        assert client.delete(project_url(f"milestones/{mid}/")).status_code == 204
        assert client.get(project_url(f"milestones/{mid}/")).status_code == 404

    def test_validation(self, client, project_url):
        assert client.post(project_url("milestones/"), {}, format="json").status_code == 400
        assert (
            client.post(project_url("milestones/"), {"title": "x", "target_date": "soon"}, format="json").status_code
            == 400
        )

    def test_foreign_ids_404(self, client, project_url, ws_url, workspace, foreign):
        mid = foreign["milestone"].id
        assert client.get(project_url(f"milestones/{mid}/")).status_code == 404
        assert client.patch(project_url(f"milestones/{mid}/"), {"title": "x"}, format="json").status_code == 404
        assert client.delete(project_url(f"milestones/{mid}/")).status_code == 404
        assert client.get(project_url(f"milestones/{mid}/work-items/")).status_code == 404
        # Another workspace's project under our slug.
        other = f"/api/v1/workspaces/{workspace.slug}/projects/{foreign['project'].id}/milestones/"
        assert client.get(other).status_code in (403, 404)

    def test_permissions(self, client, guest_client, member_client, outsider_client, project_url):
        mid = _create(client, project_url)["id"]
        assert guest_client.get(project_url("milestones/")).status_code == 200
        assert guest_client.get(project_url(f"milestones/{mid}/")).status_code == 200
        assert guest_client.post(project_url("milestones/"), {"title": "g"}, format="json").status_code == 403
        assert guest_client.patch(project_url(f"milestones/{mid}/"), {"title": "g"}, format="json").status_code == 403
        assert outsider_client.get(project_url("milestones/")).status_code == 403
        assert member_client.patch(project_url(f"milestones/{mid}/"), {"title": "m"}, format="json").status_code == 200
        assert member_client.delete(project_url(f"milestones/{mid}/")).status_code == 403
        own = member_client.post(project_url("milestones/"), {"title": "mine"}, format="json").data["id"]
        assert member_client.delete(project_url(f"milestones/{own}/")).status_code == 204


@pytest.mark.contract
class TestMilestoneWorkItems:
    def test_add_list_remove(self, client, project_url, issue, sdk):
        mid = _create(client, project_url)["id"]
        url = project_url(f"milestones/{mid}/work-items/")
        res = client.post(url, {"issues": [str(issue.id)]}, format="json")
        assert res.status_code == 201, res.data
        assert [sdk(M + "MilestoneWorkItem", row)["issue"] for row in res.data] == [str(issue.id)]

        res = client.get(url, {"per_page": 3})
        assert res.status_code == 200
        page = sdk(M + "PaginatedMilestoneWorkItemResponse", res.data)
        assert [(r["issue"], r["milestone"]) for r in page["results"]] == [(str(issue.id), str(mid))]

        assert client.delete(url, {"issues": [str(issue.id)]}, format="json").status_code == 204
        assert client.get(url).data["results"] == []

    def test_adding_moves_between_milestones(self, client, project_url, issue):
        first = _create(client, project_url, title="A")["id"]
        second = _create(client, project_url, title="B")["id"]
        client.post(project_url(f"milestones/{first}/work-items/"), {"issues": [str(issue.id)]}, format="json")
        client.post(project_url(f"milestones/{second}/work-items/"), {"issues": [str(issue.id)]}, format="json")
        assert client.get(project_url(f"milestones/{first}/work-items/")).data["results"] == []
        assert len(client.get(project_url(f"milestones/{second}/work-items/")).data["results"]) == 1

    def test_rejects_work_items_from_elsewhere(self, client, project_url, foreign):
        mid = _create(client, project_url)["id"]
        url = project_url(f"milestones/{mid}/work-items/")
        assert client.post(url, {"issues": [str(foreign["issue"].id)]}, format="json").status_code == 400
        assert client.post(url, {"issues": ["bad"]}, format="json").status_code == 400
        assert client.post(url, {}, format="json").status_code == 400

    def test_pql_error_is_400(self, client, project_url):
        mid = _create(client, project_url)["id"]
        res = client.get(project_url(f"milestones/{mid}/work-items/"), {"pql": "priority = high AND ("})
        assert res.status_code == 400 and "error" in res.data

    def test_guest_cannot_change(self, client, guest_client, project_url, issue):
        mid = _create(client, project_url)["id"]
        url = project_url(f"milestones/{mid}/work-items/")
        assert guest_client.get(url).status_code == 200
        assert guest_client.post(url, {"issues": [str(issue.id)]}, format="json").status_code == 403
        assert guest_client.delete(url, {"issues": [str(issue.id)]}, format="json").status_code == 403


@pytest.mark.contract
class TestMilestoneWorkItemVisibility:
    def test_restricted_guest_sees_only_their_own_work_items(
        self, client, make_user, workspace, project, project_url, issue
    ):
        guest, guest_api = make_user(GUEST, workspace=workspace, project=project)
        own = make_issue(project, "Mine", creator=guest)
        mid = _create(client, project_url)["id"]
        url = project_url(f"milestones/{mid}/work-items/")
        assert client.post(url, {"issues": [str(issue.id), str(own.id)]}, format="json").status_code == 201
        assert {str(row["issue"]) for row in client.get(url).data["results"]} == {str(issue.id), str(own.id)}
        assert [str(row["issue"]) for row in guest_api.get(url).data["results"]] == [str(own.id)]
