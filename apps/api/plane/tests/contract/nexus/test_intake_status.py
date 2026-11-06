# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""PATCH .../intake-issues/<issue_id>/status/: triage decisions."""

import pytest

from plane.db.models import Intake, IntakeIssue, Issue, State

from .test_work_item_support import GUEST, MEMBER, make_issue, make_project, make_state

INTAKE = "plane.models.intake.IntakeWorkItem"


@pytest.fixture
def intake_issue(project, workspace):
    project.intake_view = True
    project.save()
    intake = Intake.objects.create(name="Intake", project=project, workspace=workspace)
    triage = make_state(project, "triage", "Triage")
    issue = make_issue(project, "Request", state=triage)
    return IntakeIssue.objects.create(intake=intake, issue=issue, project=project, workspace=workspace, status=-2)


def status_url(project_url, issue_id):
    return project_url(f"intake-issues/{issue_id}/status/")


@pytest.mark.contract
class TestIntakeStatus:
    def test_accept_moves_the_work_item_out_of_triage(self, client, project_url, project, intake_issue, sdk):
        res = client.patch(status_url(project_url, intake_issue.issue_id), {"status": 1}, format="json")
        assert res.status_code == 200, res.data
        body = sdk(INTAKE, res.data)
        assert body["status"] == 1 and body["issue"] == str(intake_issue.issue_id)
        issue = Issue.objects.get(pk=intake_issue.issue_id)
        assert issue.state == State.objects.get(project=project, default=True)

    def test_decline_snooze_and_duplicate(self, client, project_url, project, intake_issue, sdk):
        url = status_url(project_url, intake_issue.issue_id)
        assert sdk(INTAKE, client.patch(url, {"status": -1}, format="json").data)["status"] == -1
        res = client.patch(url, {"status": 0}, format="json")
        assert res.status_code == 400 and "snoozed_till" in res.data["error"]
        res = client.patch(url, {"status": 0, "snoozed_till": "2030-01-01T00:00:00Z"}, format="json")
        assert res.status_code == 200 and sdk(INTAKE, res.data)["snoozed_till"].startswith("2030-01-01")
        res = client.patch(url, {"status": 2}, format="json")
        assert res.status_code == 400 and "duplicate_to" in res.data["error"]
        original = make_issue(project, "Original")
        res = client.patch(url, {"status": 2, "duplicate_to": str(original.id)}, format="json")
        assert res.status_code == 200 and sdk(INTAKE, res.data)["duplicate_to"] == str(original.id)

    def test_source_fields_and_validation(self, client, project_url, intake_issue):
        url = status_url(project_url, intake_issue.issue_id)
        res = client.patch(url, {"source": "EMAIL", "source_email": "a@b.c"}, format="json")
        assert res.status_code == 200 and res.data["source_email"] == "a@b.c"
        assert client.patch(url, {}, format="json").status_code == 400
        assert client.patch(url, {"status": 7}, format="json").status_code == 400
        assert client.patch(url, {"status": True}, format="json").status_code == 400
        res = client.patch(url, {"status": 2, "duplicate_to": str(intake_issue.issue_id)}, format="json")
        assert res.status_code == 400
        res = client.patch(url, {"status": 2, "duplicate_to": "4f6c0d1e-8a39-4c1b-9a4e-0d1c2b3a4f5e"}, format="json")
        assert res.status_code == 400 and "no such work item" in res.data["error"]

    def test_only_project_admins_decide(
        self, make_user, workspace, project, project_url, intake_issue, outsider_client
    ):
        _, member = make_user(MEMBER, workspace=workspace, project=project)
        _, guest = make_user(GUEST, workspace=workspace, project=project)
        url = status_url(project_url, intake_issue.issue_id)
        assert member.patch(url, {"status": 1}, format="json").status_code == 403
        assert guest.patch(url, {"status": 1}, format="json").status_code == 403
        assert outsider_client.patch(url, {"status": 1}, format="json").status_code == 403
        intake_issue.refresh_from_db()
        assert intake_issue.status == -2

    def test_not_an_intake_item_is_404(self, client, project_url, project, workspace, create_user):
        plain = make_issue(project, "plain")
        assert client.patch(status_url(project_url, plain.id), {"status": 1}, format="json").status_code == 404
        sibling = make_project(workspace, create_user)
        intake = Intake.objects.create(name="I", project=sibling, workspace=workspace)
        elsewhere = IntakeIssue.objects.create(
            intake=intake, issue=make_issue(sibling, "x"), project=sibling, workspace=workspace
        )
        assert (
            client.patch(status_url(project_url, elsewhere.issue_id), {"status": 1}, format="json").status_code == 404
        )
