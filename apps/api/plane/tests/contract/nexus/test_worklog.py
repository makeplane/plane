# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Work logs (.../worklogs/) and the project summary (.../total-worklogs/)."""

import pytest

from plane.nexus.models import WorkItemWorkLog

from .test_work_item_support import GUEST, MEMBER, make_issue, make_project

LOG = "plane.models.work_items.WorkItemWorkLog"
SUMMARY = "plane.models.projects.ProjectWorklogSummary"


def logs_url(project_url, issue, log=None):
    return project_url(f"work-items/{issue.id}/worklogs/" + (f"{log}/" if log else ""))


@pytest.mark.contract
class TestWorkLogs:
    def test_crud(self, client, project_url, project, create_user, sdk):
        issue = make_issue(project)
        res = client.post(logs_url(project_url, issue), {"duration": 90, "description": "pairing"}, format="json")
        assert res.status_code == 201, res.data
        log = sdk(LOG, res.data)
        assert log["duration"] == 90 and log["logged_by"] == str(create_user.id)
        assert log["project_id"] == str(project.id) and log["workspace_id"] == str(project.workspace_id)

        res = client.get(logs_url(project_url, issue))
        assert res.status_code == 200 and [sdk(LOG, row)["id"] for row in res.data] == [log["id"]]

        res = client.patch(logs_url(project_url, issue, log["id"]), {"duration": 30}, format="json")
        assert res.status_code == 200 and sdk(LOG, res.data)["duration"] == 30 and res.data["description"] == "pairing"
        res = client.patch(logs_url(project_url, issue, log["id"]), {}, format="json")
        assert res.status_code == 200

        assert client.delete(logs_url(project_url, issue, log["id"])).status_code == 204
        assert client.get(logs_url(project_url, issue)).data == []
        assert client.patch(logs_url(project_url, issue, log["id"]), {"duration": 1}, format="json").status_code == 404

    @pytest.mark.parametrize("body", [{}, {"duration": 0}, {"duration": -5}, {"duration": "an hour"}])
    def test_duration_is_required_and_positive(self, client, project_url, project, body):
        res = client.post(logs_url(project_url, make_issue(project)), body, format="json")
        assert res.status_code == 400 and "duration" in res.data

    def test_only_author_or_admin_changes_a_log(self, make_user, workspace, project, project_url, client):
        _, alice = make_user(MEMBER, workspace=workspace, project=project)
        _, bob = make_user(MEMBER, workspace=workspace, project=project)
        issue = make_issue(project)
        log_id = alice.post(logs_url(project_url, issue), {"duration": 15}, format="json").data["id"]
        assert bob.patch(logs_url(project_url, issue, log_id), {"duration": 1}, format="json").status_code == 403
        assert bob.delete(logs_url(project_url, issue, log_id)).status_code == 403
        assert alice.patch(logs_url(project_url, issue, log_id), {"duration": 20}, format="json").status_code == 200
        assert client.delete(logs_url(project_url, issue, log_id)).status_code == 204  # project admin

    def test_guest_reads_own_items_only_and_cannot_log(self, make_user, workspace, project, project_url):
        guest, guest_api = make_user(GUEST, workspace=workspace, project=project)
        own, other = make_issue(project, creator=guest), make_issue(project)
        assert guest_api.get(logs_url(project_url, own)).status_code == 200
        assert guest_api.get(logs_url(project_url, other)).status_code == 404
        assert guest_api.post(logs_url(project_url, own), {"duration": 5}, format="json").status_code == 403

    def test_ids_elsewhere_are_404(self, client, project_url, workspace, project, create_user, outsider_client):
        sibling = make_issue(make_project(workspace, create_user))
        assert client.get(logs_url(project_url, sibling)).status_code == 404
        issue = make_issue(project)
        sibling_log = WorkItemWorkLog.objects.create(issue=sibling, project=sibling.project, duration=5)
        assert (
            client.patch(logs_url(project_url, issue, sibling_log.id), {"duration": 1}, format="json").status_code
            == 404
        )
        assert outsider_client.get(logs_url(project_url, issue)).status_code == 403


@pytest.mark.contract
class TestWorklogSummary:
    def test_totals_per_work_item(self, client, project_url, project, sdk):
        a, b = make_issue(project, "a"), make_issue(project, "b")
        for issue, minutes in ((a, 30), (a, 45), (b, 10)):
            client.post(logs_url(project_url, issue), {"duration": minutes}, format="json")
        deleted = make_issue(project, "gone")
        client.post(logs_url(project_url, deleted), {"duration": 99}, format="json")
        deleted.delete()
        res = client.get(project_url("total-worklogs/"))
        assert res.status_code == 200
        for row in res.data:
            sdk(SUMMARY, row)
        assert res.data == [{"issue_id": str(a.id), "duration": 75}, {"issue_id": str(b.id), "duration": 10}]

    def test_guest_and_outsider(self, make_user, workspace, project, project_url, outsider_client):
        guest, guest_api = make_user(GUEST, workspace=workspace, project=project)
        own, other = make_issue(project, creator=guest), make_issue(project)
        WorkItemWorkLog.objects.create(issue=own, project=project, duration=5)
        WorkItemWorkLog.objects.create(issue=other, project=project, duration=7)
        assert guest_api.get(project_url("total-worklogs/")).data == [{"issue_id": str(own.id), "duration": 5}]
        assert outsider_client.get(project_url("total-worklogs/")).status_code == 403
