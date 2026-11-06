# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest

from plane.db.models import Project, User, Workspace
from plane.nexus.models import WorkItemTemplate

WS_TEMPLATE = "plane.models.workspace_templates.WorkItemTemplate"
PROJECT_TEMPLATE = "plane.models.project_templates.WorkItemTemplate"


@pytest.fixture
def foreign_templates(db):
    owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
    other = Workspace.objects.create(name="Elsewhere", slug=f"else-{uuid4().hex[:6]}", owner=owner)
    project = Project.objects.create(name="P", identifier="PX", workspace=other, created_by=owner)
    return (
        WorkItemTemplate.objects.create(workspace=other, name="Foreign"),
        WorkItemTemplate.objects.create(workspace=other, project=project, name="Foreign project"),
    )


@pytest.mark.contract
class TestWorkspaceTemplates:
    def test_crud(self, client, ws_url, sdk):
        body = {
            "name": "Spec",
            "description_html": "<p>Spec template</p>",
            "template_data": {"name": "Spec", "priority": "medium"},
        }
        res = client.post(ws_url("workitems/templates/"), body, format="json")
        assert res.status_code == 201, res.data
        created = sdk(WS_TEMPLATE, res.data)
        assert created["project"] is None and created["template_data"]["priority"] == "medium"

        res = client.get(ws_url("workitems/templates/"))
        assert res.status_code == 200 and [sdk(WS_TEMPLATE, t)["name"] for t in res.data] == ["Spec"]

        # Updates merge template_data.
        res = client.patch(
            ws_url(f"workitems/templates/{created['id']}/"),
            {"name": "Renamed", "template_data": {"priority": "high"}},
            format="json",
        )
        assert res.status_code == 200, res.data
        updated = sdk(WS_TEMPLATE, res.data)
        assert updated["name"] == "Renamed" and updated["template_data"] == {"name": "Spec", "priority": "high"}

        assert client.delete(ws_url(f"workitems/templates/{created['id']}/")).status_code == 204
        assert client.get(ws_url("workitems/templates/")).data == []

    def test_list_includes_project_templates(self, client, ws_url, project, workspace, sdk):
        WorkItemTemplate.objects.create(workspace=workspace, name="Workspace one")
        WorkItemTemplate.objects.create(workspace=workspace, project=project, name="Project one")
        res = client.get(ws_url("workitems/templates/"))
        rows = {sdk(WS_TEMPLATE, t)["name"]: t["project"] for t in res.data}
        assert rows == {"Workspace one": None, "Project one": project.id}

    def test_list_hides_projects_the_caller_is_not_in(self, make_user, ws_url, workspace, project):
        WorkItemTemplate.objects.create(workspace=workspace, project=project, name="Private")
        _, outsider_member = make_user(15, workspace=workspace)
        assert outsider_member.get(ws_url("workitems/templates/")).data == []

    def test_validation(self, client, ws_url):
        assert client.post(ws_url("workitems/templates/"), {"template_data": {}}, format="json").status_code == 400
        res = client.post(ws_url("workitems/templates/"), {"name": "X", "template_data": ["no"]}, format="json")
        assert res.status_code == 400

    def test_foreign_template_is_404(self, client, ws_url, foreign_templates):
        template, _ = foreign_templates
        assert (
            client.patch(ws_url(f"workitems/templates/{template.id}/"), {"name": "x"}, format="json").status_code == 404
        )
        assert client.delete(ws_url(f"workitems/templates/{template.id}/")).status_code == 404

    def test_permissions(self, member_client, guest_client, outsider_client, ws_url):
        assert guest_client.get(ws_url("workitems/templates/")).status_code == 200
        assert (
            member_client.post(
                ws_url("workitems/templates/"), {"name": "X", "template_data": {}}, format="json"
            ).status_code
            == 403
        )
        assert outsider_client.get(ws_url("workitems/templates/")).status_code == 403


@pytest.mark.contract
class TestProjectTemplates:
    def test_crud(self, client, project_url, project, sdk):
        body = {"name": "Bug report", "short_description": "For bugs", "template_data": {"name": "Bug"}}
        res = client.post(project_url("workitems/templates/"), body, format="json")
        assert res.status_code == 201, res.data
        created = sdk(PROJECT_TEMPLATE, res.data)
        assert created["project"] == str(project.id) and created["short_description"] == "For bugs"

        res = client.get(project_url("workitems/templates/"))
        assert res.status_code == 200 and [sdk(PROJECT_TEMPLATE, t)["id"] for t in res.data] == [created["id"]]

        body = {"name": "Renamed", "short_description": "Updated", "template_data": {"name": "Spec"}}
        res = client.patch(project_url(f"workitems/templates/{created['id']}/"), body, format="json")
        assert res.status_code == 200 and sdk(PROJECT_TEMPLATE, res.data)["template_data"] == {"name": "Spec"}

        assert client.delete(project_url(f"workitems/templates/{created['id']}/")).status_code == 204
        assert client.get(project_url("workitems/templates/")).data == []

    def test_workspace_template_is_not_a_project_template(self, client, project_url, workspace, foreign_templates):
        own = WorkItemTemplate.objects.create(workspace=workspace, name="Workspace one")
        assert (
            client.patch(project_url(f"workitems/templates/{own.id}/"), {"name": "x"}, format="json").status_code == 404
        )
        _, foreign = foreign_templates
        assert client.delete(project_url(f"workitems/templates/{foreign.id}/")).status_code == 404

    def test_permissions(self, member_client, guest_client, outsider_client, project_url, project, workspace):
        template = WorkItemTemplate.objects.create(workspace=workspace, project=project, name="T")
        assert guest_client.get(project_url("workitems/templates/")).status_code == 200
        body = {"name": "X", "template_data": {}}
        assert member_client.post(project_url("workitems/templates/"), body, format="json").status_code == 403
        assert member_client.delete(project_url(f"workitems/templates/{template.id}/")).status_code == 403
        assert outsider_client.get(project_url("workitems/templates/")).status_code == 403


WS_PAGE_TEMPLATE = "plane.models.workspace_templates.PageTemplate"
WS_PROJECT_TEMPLATE = "plane.models.workspace_templates.ProjectTemplate"
PROJECT_PAGE_TEMPLATE = "plane.models.project_templates.PageTemplate"


@pytest.mark.contract
class TestPageAndProjectTemplates:
    """The MCP `template` tool's page and project kinds. These routes were missing,
    so both kinds returned 404 for every action."""

    @pytest.mark.parametrize(
        ("path", "model", "body"),
        [
            ("pages/templates/", WS_PAGE_TEMPLATE, {"description_html": "<p>Notes</p>"}),
            ("projects/templates/", WS_PROJECT_TEMPLATE, {"description": "Kickoff"}),
        ],
    )
    def test_workspace_crud(self, client, ws_url, path, model, body, sdk):
        res = client.post(ws_url(path), {"name": "T", "template_data": {"a": 1}, **body}, format="json")
        assert res.status_code == 201, res.data
        created = sdk(model, res.data)
        assert res.data["project"] is None and created["template_data"] == {"a": 1}

        res = client.get(ws_url(path))
        assert res.status_code == 200 and [sdk(model, t)["id"] for t in res.data] == [created["id"]]

        res = client.patch(ws_url(f"{path}{created['id']}/"), {"template_data": {"b": 2}}, format="json")
        assert res.status_code == 200 and sdk(model, res.data)["template_data"] == {"a": 1, "b": 2}

        assert client.delete(ws_url(f"{path}{created['id']}/")).status_code == 204
        assert client.get(ws_url(path)).data == []

    def test_project_page_crud(self, client, project_url, project, sdk):
        body = {"name": "Meeting notes", "short_description": "Weekly", "template_data": {"x": 1}}
        res = client.post(project_url("pages/templates/"), body, format="json")
        assert res.status_code == 201, res.data
        created = sdk(PROJECT_PAGE_TEMPLATE, res.data)
        assert created["project"] == str(project.id) and created["template_type"] == "PAGE"

        res = client.get(project_url("pages/templates/"))
        assert [sdk(PROJECT_PAGE_TEMPLATE, t)["id"] for t in res.data] == [created["id"]]
        assert client.delete(project_url(f"pages/templates/{created['id']}/")).status_code == 204

    def test_kinds_do_not_leak_into_each_other(self, client, ws_url, project_url, workspace, project):
        work_item = WorkItemTemplate.objects.create(workspace=workspace, name="WI")
        page = WorkItemTemplate.objects.create(workspace=workspace, name="Page", template_type="PAGE")
        proj = WorkItemTemplate.objects.create(workspace=workspace, name="Proj", template_type="PROJECT")
        project_page = WorkItemTemplate.objects.create(
            workspace=workspace, project=project, name="PP", template_type="PAGE"
        )

        names = lambda url: sorted(t["name"] for t in client.get(url).data)  # noqa: E731
        assert names(ws_url("workitems/templates/")) == ["WI"]
        assert names(ws_url("pages/templates/")) == ["PP", "Page"]
        assert names(ws_url("projects/templates/")) == ["Proj"]
        assert names(project_url("workitems/templates/")) == []
        assert names(project_url("pages/templates/")) == ["PP"]

        assert client.get(ws_url(f"workitems/templates/{page.id}/")).status_code == 404
        assert client.get(ws_url(f"pages/templates/{work_item.id}/")).status_code == 404
        assert client.get(ws_url(f"projects/templates/{page.id}/")).status_code == 404
        assert client.delete(project_url(f"workitems/templates/{project_page.id}/")).status_code == 404
        assert client.get(ws_url(f"projects/templates/{proj.id}/")).status_code == 200

    def test_permissions(self, member_client, guest_client, outsider_client, ws_url, project_url):
        body = {"name": "X", "template_data": {}}
        for url in (ws_url("pages/templates/"), ws_url("projects/templates/")):
            assert guest_client.get(url).status_code == 200
            assert member_client.post(url, body, format="json").status_code == 403
            assert outsider_client.get(url).status_code == 403
        assert member_client.post(project_url("pages/templates/"), body, format="json").status_code == 403
