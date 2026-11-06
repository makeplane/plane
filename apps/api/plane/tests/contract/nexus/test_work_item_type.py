# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest

from plane.celery import app as celery_app
from plane.db.models import Issue, IssueType, Project, User, Workspace
from plane.db.models.issue_type import ProjectIssueType

TYPE = "plane.models.work_item_types.WorkItemType"


@pytest.fixture
def foreign_type(db):
    owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
    other = Workspace.objects.create(name="Elsewhere", slug=f"else-{uuid4().hex[:6]}", owner=owner)
    return IssueType.objects.create(workspace=other, name="Foreign")


@pytest.fixture
def imported(workspace, project):
    issue_type = IssueType.objects.create(workspace=workspace, name="Bug")
    ProjectIssueType.objects.create(issue_type=issue_type, project=project)
    return issue_type


@pytest.mark.contract
class TestWorkspaceWorkItemTypes:
    def test_create_list_retrieve_update_delete(self, client, ws_url, project, sdk):
        res = client.post(
            ws_url("work-item-types/"),
            {"name": "Story", "description": "A user story", "project_ids": [str(project.id)], "is_active": True},
            format="json",
        )
        assert res.status_code == 201, res.data
        created = sdk(TYPE, res.data)
        assert created["project_ids"] == [str(project.id)] and created["is_epic"] is False
        project.refresh_from_db()
        assert project.is_issue_type_enabled is True

        res = client.get(ws_url("work-item-types/"))
        assert res.status_code == 200
        assert [sdk(TYPE, t)["name"] for t in res.data] == ["Story"]

        res = client.get(ws_url(f"work-item-types/{created['id']}/"))
        assert res.status_code == 200 and sdk(TYPE, res.data)["name"] == "Story"

        res = client.patch(
            ws_url(f"work-item-types/{created['id']}/"), {"name": "User story", "project_ids": []}, format="json"
        )
        assert res.status_code == 200, res.data
        assert sdk(TYPE, res.data)["name"] == "User story" and res.data["project_ids"] == []

        assert client.delete(ws_url(f"work-item-types/{created['id']}/")).status_code == 204
        assert client.get(ws_url(f"work-item-types/{created['id']}/")).status_code == 404

    def test_epic_is_flagged(self, client, ws_url, sdk):
        res = client.post(ws_url("work-item-types/"), {"name": "Epic"}, format="json")
        assert res.status_code == 201 and sdk(TYPE, res.data)["is_epic"] is True

    def test_duplicate_name_conflicts(self, client, ws_url):
        assert client.post(ws_url("work-item-types/"), {"name": "Task"}, format="json").status_code == 201
        res = client.post(ws_url("work-item-types/"), {"name": "Task"}, format="json")
        assert res.status_code == 409 and "already exists" in res.data["error"]

    def test_validation(self, client, ws_url):
        assert client.post(ws_url("work-item-types/"), {}, format="json").status_code == 400
        res = client.post(ws_url("work-item-types/"), {"name": "X", "project_ids": [str(uuid4())]}, format="json")
        assert res.status_code == 400 and "Unknown project" in res.data["error"]

    def test_delete_refused_while_in_use(self, client, ws_url, imported, project, workspace):
        Issue.objects.create(name="Uses it", project=project, workspace=workspace, type=imported)
        res = client.delete(ws_url(f"work-item-types/{imported.id}/"))
        assert res.status_code == 400 and res.data["code"] == "type_in_use"

    def test_foreign_type_is_404(self, client, ws_url, foreign_type):
        assert client.get(ws_url(f"work-item-types/{foreign_type.id}/")).status_code == 404
        assert (
            client.patch(ws_url(f"work-item-types/{foreign_type.id}/"), {"name": "x"}, format="json").status_code == 404
        )
        assert client.delete(ws_url(f"work-item-types/{foreign_type.id}/")).status_code == 404

    def test_permissions(self, member_client, guest_client, outsider_client, ws_url, imported):
        assert guest_client.get(ws_url("work-item-types/")).status_code == 200
        assert member_client.get(ws_url(f"work-item-types/{imported.id}/")).status_code == 200
        assert member_client.post(ws_url("work-item-types/"), {"name": "Nope"}, format="json").status_code == 403
        assert member_client.delete(ws_url(f"work-item-types/{imported.id}/")).status_code == 403
        assert outsider_client.get(ws_url("work-item-types/")).status_code == 403


@pytest.mark.contract
class TestProjectWorkItemTypes:
    def test_list_and_retrieve_imported_only(self, client, ws_url, project_url, imported, workspace, sdk):
        IssueType.objects.create(workspace=workspace, name="Not imported")
        res = client.get(project_url("work-item-types/?per_page=3"))
        assert res.status_code == 200
        assert [sdk(TYPE, t)["name"] for t in res.data] == ["Bug"]
        res = client.get(project_url(f"work-item-types/{imported.id}/"))
        assert res.status_code == 200 and sdk(TYPE, res.data)["project_ids"]

    def test_import_links_types(self, client, ws_url, project_url, workspace, project, sdk):
        story = IssueType.objects.create(workspace=workspace, name="Story")
        res = client.post(project_url("import-work-item-types/"), {"work_item_types": [str(story.id)]}, format="json")
        assert res.status_code == 200, res.data
        assert [sdk(TYPE, t)["id"] for t in res.data] == [str(story.id)]
        # Importing twice never duplicates.
        assert (
            client.post(
                project_url("import-work-item-types/"), {"work_item_types": [str(story.id)]}, format="json"
            ).status_code
            == 200
        )
        assert ProjectIssueType.objects.filter(project=project, issue_type=story).count() == 1

    def test_import_rejects_foreign_type(self, client, project_url, foreign_type):
        res = client.post(
            project_url("import-work-item-types/"), {"work_item_types": [str(foreign_type.id)]}, format="json"
        )
        assert res.status_code == 400

    def test_delete_unlinks_but_keeps_the_type(self, client, project_url, imported, project):
        assert client.delete(project_url(f"work-item-types/{imported.id}/")).status_code == 204
        assert client.get(project_url(f"work-item-types/{imported.id}/")).status_code == 404
        assert IssueType.objects.filter(pk=imported.pk).exists()

    def test_project_writes_are_workspace_managed(self, client, project_url, imported):
        res = client.post(project_url("work-item-types/"), {"name": "Local"}, format="json")
        assert res.status_code == 400 and res.data["code"] == "workspace_managed"
        res = client.patch(project_url(f"work-item-types/{imported.id}/"), {"name": "x"}, format="json")
        assert res.status_code == 400 and res.data["code"] == "workspace_managed"

    def test_type_from_other_project_is_404(self, client, project_url, workspace, create_user, foreign_type):
        other = Project.objects.create(name="Other", identifier="OT", workspace=workspace, created_by=create_user)
        elsewhere = IssueType.objects.create(workspace=workspace, name="Elsewhere")
        ProjectIssueType.objects.create(issue_type=elsewhere, project=other)
        assert client.get(project_url(f"work-item-types/{elsewhere.id}/")).status_code == 404
        assert client.get(project_url(f"work-item-types/{foreign_type.id}/")).status_code == 404

    def test_permissions(self, member_client, guest_client, outsider_client, project_url, imported, workspace):
        story = IssueType.objects.create(workspace=workspace, name="Story")
        assert guest_client.get(project_url("work-item-types/")).status_code == 200
        body = {"work_item_types": [str(story.id)]}
        assert member_client.post(project_url("import-work-item-types/"), body, format="json").status_code == 403
        assert member_client.delete(project_url(f"work-item-types/{imported.id}/")).status_code == 403
        assert outsider_client.get(project_url("work-item-types/")).status_code == 403


@pytest.fixture
def celery_eager():
    eager, propagates = celery_app.conf.task_always_eager, celery_app.conf.task_eager_propagates
    celery_app.conf.task_always_eager, celery_app.conf.task_eager_propagates = True, False
    yield
    celery_app.conf.task_always_eager, celery_app.conf.task_eager_propagates = eager, propagates


@pytest.mark.contract
def test_resolve_epic_then_create_work_item(client, ws_url, project_url, project, sdk, celery_eager):
    """The MCP `workitem_type resolve name=Epic` flow, then `workitem create type_id=...`."""
    assert client.get(project_url("work-item-types/")).data == []
    assert client.get(ws_url("features/")).data["work_item_types"] is True
    epic = next((t for t in client.get(ws_url("work-item-types/")).data if t["name"] == "Epic"), None)
    assert epic is None
    epic = sdk(TYPE, client.post(ws_url("work-item-types/"), {"name": "Epic"}, format="json").data)
    res = client.post(project_url("import-work-item-types/"), {"work_item_types": [epic["id"]]}, format="json")
    assert res.status_code == 200
    assert [t["name"] for t in client.get(project_url("work-item-types/")).data] == ["Epic"]

    res = client.post(project_url("work-items/"), {"name": "Big thing", "type_id": epic["id"]}, format="json")
    assert res.status_code == 201, res.data
    assert str(Issue.objects.get(pk=res.data["id"]).type_id) == epic["id"]
