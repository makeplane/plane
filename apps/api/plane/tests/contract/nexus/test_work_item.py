# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workspace work item list and count (PQL), archive and archived list."""

from datetime import date
from uuid import uuid4

import pytest

from plane.db.models import Issue, User, Workspace

from .test_work_item_support import GUEST, MEMBER, make_issue, make_label, make_project, make_state

PAGE = "plane.models.work_items.PaginatedWorkItemResponse"
COUNT = "plane.models.work_items.WorkItemGroupedCountResponse"
OTHER_GROUPS = (
    "state_id",
    "project_id",
    "type_id",
    "labels__id",
    "issue_module__module_id",
    "release_work_items__release_id",
    "cycle_id",
    "milestone_id",
    "created_by",
    "start_date",
)


@pytest.fixture
def started(project):
    return make_state(project, "started", "Doing")


@pytest.fixture
def done(project):
    return make_state(project, "completed", "Done")


@pytest.fixture
def foreign_issue(db):
    """A work item in another workspace."""
    owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
    other = Workspace.objects.create(name="Elsewhere", slug=f"else-{uuid4().hex[:6]}", owner=owner)
    return make_issue(make_project(other, owner), "foreign")


def names(res):
    return {row["name"] for row in res.data["results"]}


@pytest.mark.contract
class TestWorkspaceList:
    def test_lists_visible_work_items_across_projects(self, client, ws_url, workspace, project, create_user, sdk):
        second = make_project(workspace, create_user)
        hidden = make_project(
            workspace, User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
        )
        make_issue(project, "one")
        make_issue(second, "two")
        make_issue(hidden, "not a member")
        make_issue(project, "draft", is_draft=True)
        make_issue(project, "archived", archived_at=date.today())
        res = client.get(ws_url("work-items/"))
        assert res.status_code == 200, res.data
        sdk(PAGE, res.data)
        assert names(res) == {"one", "two"}
        assert res.data["total_count"] == 2

    def test_pql_filters_and_widens_scope(self, client, ws_url, project, started, sdk):
        make_issue(project, "hot", priority="urgent", state=started)
        make_issue(project, "cold", priority="low")
        make_issue(project, "old", archived_at=date.today(), priority="urgent")
        res = client.get(ws_url("work-items/"), {"pql": 'priority = "urgent" AND stateGroup = "started"'})
        assert res.status_code == 200 and names(sdk(PAGE, res.data) and res) == {"hot"}
        res = client.get(ws_url("work-items/"), {"pql": "isArchived()"})
        assert names(res) == {"old"}
        res = client.get(ws_url("work-items/"), {"pql": "assignee = currentUser() OR hasNoAssignee()"})
        assert names(res) == {"hot", "cold"}

    def test_invalid_pql_is_a_correctable_400(self, client, ws_url):
        res = client.get(ws_url("work-items/"), {"pql": "state__group = 'started'"})
        assert res.status_code == 400
        assert isinstance(res.data["pql"], list) and "Use stateGroup" in res.data["pql"][0]
        assert res.data["error"] == res.data["pql"][0]

    def test_structured_filters_are_refused(self, client, ws_url):
        res = client.get(ws_url("work-items/"), {"filters": '{"priority": "urgent"}'})
        assert res.status_code == 400 and "pql" in res.data

    def test_project_and_external_filters(self, client, ws_url, workspace, project, create_user):
        second = make_project(workspace, create_user)
        make_issue(project, "here", external_id="X-1", external_source="jira")
        make_issue(second, "there")
        assert names(client.get(ws_url("work-items/"), {"project_id": str(second.id)})) == {"there"}
        assert names(client.get(ws_url("work-items/"), {"external_id": "X-1", "external_source": "jira"})) == {"here"}
        assert client.get(ws_url("work-items/"), {"project_id": "nope"}).status_code == 400

    def test_order_fields_expand_and_paging(self, client, ws_url, project, create_user, sdk):
        label = make_label(project)
        make_issue(project, "low", priority="low")
        make_issue(project, "urgent", priority="urgent", assignees=[create_user], labels=[label])
        make_issue(project, "high", priority="high")
        res = client.get(ws_url("work-items/"), {"order_by": "priority"})
        assert [r["name"] for r in res.data["results"]] == ["urgent", "high", "low"]
        res = client.get(ws_url("work-items/"), {"order_by": "priority", "expand": "assignees,labels,state"})
        top = sdk(PAGE, res.data)["results"][0]
        assert top["assignees"][0]["id"] == str(create_user.id) and top["labels"][0]["id"] == str(label.id)
        assert top["state"]["group"] == "unstarted"
        res = client.get(ws_url("work-items/"), {"fields": "id,name"})
        assert set(res.data["results"][0]) <= {"id", "name", "assignees", "labels"}
        first = client.get(ws_url("work-items/"), {"per_page": 2, "order_by": "priority"})
        assert first.data["next_page_results"] is True and first.data["count"] == 2
        second = client.get(
            ws_url("work-items/"), {"per_page": 2, "order_by": "priority", "cursor": first.data["next_cursor"]}
        )
        assert [r["name"] for r in sdk(PAGE, second.data)["results"]] == ["low"]

    def test_restricted_guest_sees_only_their_own(self, make_user, workspace, project, ws_url):
        guest, guest_api = make_user(GUEST, workspace=workspace, project=project)
        make_issue(project, "theirs", creator=guest)
        make_issue(project, "someone else's")
        assert names(guest_api.get(ws_url("work-items/"))) == {"theirs"}
        project.guest_view_all_features = True
        project.save()
        assert names(guest_api.get(ws_url("work-items/"))) == {"theirs", "someone else's"}

    def test_outsider_is_refused(self, outsider_client, ws_url):
        assert outsider_client.get(ws_url("work-items/")).status_code == 403


@pytest.mark.contract
class TestWorkspaceCount:
    def test_total(self, client, ws_url, project, sdk):
        make_issue(project, "a")
        make_issue(project, "b", is_draft=True)
        res = client.get(ws_url("work-items/count/"))
        assert res.status_code == 200
        assert sdk(COUNT, res.data) == {
            "grouped_by": None,
            "sub_grouped_by": None,
            "total_count": 1,
            "grouped_counts": {},
        }

    def test_grouped_and_sub_grouped(self, client, ws_url, project, started, create_user, sdk):
        make_issue(project, "a", priority="urgent", state=started, assignees=[create_user])
        make_issue(project, "b", priority="urgent")
        make_issue(project, "c", priority="low", target_date=date(2026, 1, 2))
        res = client.get(ws_url("work-items/count/"), {"group_by": "priority"})
        body = sdk(COUNT, res.data)
        assert body["total_count"] == 3 and body["grouped_counts"] == {"urgent": {"count": 2}, "low": {"count": 1}}
        res = client.get(ws_url("work-items/count/"), {"group_by": "priority", "sub_group_by": "state__group"})
        body = sdk(COUNT, res.data)
        assert body["grouped_counts"]["urgent"] == {
            "count": 2,
            "sub_grouped_counts": {"started": {"count": 1}, "unstarted": {"count": 1}},
        }
        res = client.get(ws_url("work-items/count/"), {"group_by": "assignees__id"})
        assert sdk(COUNT, res.data)["grouped_counts"] == {str(create_user.id): {"count": 1}, "None": {"count": 2}}
        res = client.get(ws_url("work-items/count/"), {"group_by": "target_date"})
        assert sdk(COUNT, res.data)["grouped_counts"]["2026-01-02"] == {"count": 1}
        for group in OTHER_GROUPS:
            res = client.get(ws_url("work-items/count/"), {"group_by": group})
            assert res.status_code == 200 and sdk(COUNT, res.data)["total_count"] == 3, group

    def test_mcp_scoped_pql(self, client, ws_url, workspace, project, create_user, started, sdk):
        other = make_project(workspace, create_user)
        make_issue(project, "a", state=started)
        make_issue(other, "b", state=started)
        pql = f'(stateGroup = "started") AND project = "{project.id}"'
        res = client.get(ws_url("work-items/count/"), {"pql": pql, "group_by": "state_id"})
        assert sdk(COUNT, res.data)["total_count"] == 1
        assert res.data["grouped_counts"] == {str(started.id): {"count": 1}}

    def test_validation(self, client, ws_url):
        res = client.get(ws_url("work-items/count/"), {"group_by": "colour"})
        assert res.status_code == 400 and "group_by must be one of" in res.data["error"]
        res = client.get(ws_url("work-items/count/"), {"sub_group_by": "priority"})
        assert res.status_code == 400
        res = client.get(ws_url("work-items/count/"), {"pql": "state__group = 'started'"})
        assert res.status_code == 400 and "stateGroup" in res.data["pql"][0]

    def test_outsider_is_refused(self, outsider_client, ws_url):
        assert outsider_client.get(ws_url("work-items/count/")).status_code == 403


@pytest.mark.contract
class TestArchive:
    def test_archive_completed_then_unarchive(self, client, project_url, project, done, sdk):
        issue = make_issue(project, "finished", state=done)
        res = client.post(project_url(f"work-items/{issue.id}/archive/"), {}, format="json")
        assert res.status_code == 200 and res.data["archived_at"] == str(date.today())
        issue.refresh_from_db()
        assert issue.archived_at == date.today()
        listed = client.get(project_url("archived-work-items/"))
        assert listed.status_code == 200 and names(sdk(PAGE, listed.data) and listed) == {"finished"}
        assert client.post(project_url(f"work-items/{issue.id}/archive/"), {}, format="json").status_code == 400
        res = client.delete(project_url(f"work-items/{issue.id}/unarchive/"))
        assert res.status_code == 204
        issue.refresh_from_db()
        assert issue.archived_at is None
        assert client.delete(project_url(f"work-items/{issue.id}/unarchive/")).status_code == 400

    def test_only_completed_or_cancelled(self, client, project_url, project, started):
        issue = make_issue(project, "busy", state=started)
        res = client.post(project_url(f"work-items/{issue.id}/archive/"), {}, format="json")
        assert res.status_code == 400 and "completed or cancelled" in res.data["error"]

    def test_member_can_guest_cannot(self, make_user, workspace, project, project_url, done):
        _, member = make_user(MEMBER, workspace=workspace, project=project)
        _, guest = make_user(GUEST, workspace=workspace, project=project)
        issue = make_issue(project, "x", state=done)
        assert guest.post(project_url(f"work-items/{issue.id}/archive/"), {}, format="json").status_code == 403
        assert member.post(project_url(f"work-items/{issue.id}/archive/"), {}, format="json").status_code == 200

    def test_ids_elsewhere_are_404(self, client, project_url, workspace, project, create_user, foreign_issue):
        sibling = make_issue(make_project(workspace, create_user), "sibling")
        for issue in (foreign_issue, sibling):
            assert client.post(project_url(f"work-items/{issue.id}/archive/"), {}, format="json").status_code == 404

    def test_archived_list_pql_and_guest(self, client, make_user, workspace, project, project_url, sdk):
        guest, guest_api = make_user(GUEST, workspace=workspace, project=project)
        make_issue(project, "old-urgent", priority="urgent", archived_at=date.today())
        make_issue(project, "old-guest", creator=guest, archived_at=date.today())
        make_issue(project, "live")
        res = client.get(project_url("archived-work-items/"), {"pql": 'priority = "urgent"'})
        assert names(sdk(PAGE, res.data) and res) == {"old-urgent"}
        assert names(guest_api.get(project_url("archived-work-items/"))) == {"old-guest"}
        res = client.get(project_url("archived-work-items/"), {"pql": "priority ="})
        assert res.status_code == 400 and "pql" in res.data

    def test_outsider(self, outsider_client, project_url, project, done):
        issue = make_issue(project, "x", state=done)
        assert (
            outsider_client.post(project_url(f"work-items/{issue.id}/archive/"), {}, format="json").status_code == 403
        )
        assert outsider_client.get(project_url("archived-work-items/")).status_code == 403
        assert Issue.objects.get(pk=issue.pk).archived_at is None
