# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# ruff: noqa: F401, F811
"""Hub sections: General, News, private messages, Doc Hub, Files, Secrets, and Flows."""

from unittest import mock

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from plane.db.models import Issue, IssueAssignee, State
from plane.team_ops.models import HubChannel, HubSecret, HubSecretLog, OpsNotification
from plane.tests.contract.app.team_ops_support import (
    _no_broker,
    admin,
    admin_client,
    colleague,
    guest,
    guest_client,
    join,
    lead,
    lead_client,
    make_client,
    make_project,
    make_team,
    make_user,
    member,
    member_client,
    other_workspace,
    outsider,
    outsider_client,
    url,
    workspace,
)


class FakeStorage:
    def __init__(self):
        self.files = {}

    def upload_file(self, file_obj, key, content_type):
        self.files[key] = file_obj.read()
        return True

    def generate_presigned_url(self, key, expiration, disposition, filename, content_type):
        return f"https://files.test/{key}?expires={expiration}&disposition={disposition}"


@pytest.fixture
def storage():
    fake = FakeStorage()
    with mock.patch("plane.team_ops.services.hub_files.get_storage", return_value=fake):
        yield fake


@pytest.fixture
def project(workspace, admin, member, colleague):
    return make_project(workspace, admin, "HB", members=[member, colleague])


def h(workspace, path=""):
    return url(workspace, f"hub/{path}")


def channels(client, workspace):
    return {row["name"]: row for row in client.get(h(workspace, "channels/")).data["results"]}


def post(client, workspace, channel_id, body, **extra):
    return client.post(h(workspace, f"channels/{channel_id}/messages/"), {"body": body, **extra}, format="json")


def pdf(name="a.pdf"):
    return SimpleUploadedFile(name, b"%PDF-1.4 x", content_type="application/pdf")


@pytest.mark.contract
class TestGeneralAndNews:
    def test_everyone_has_general_and_news(self, member_client, colleague, workspace):
        rows = channels(member_client, workspace)
        assert {"General", "News"} <= set(rows)
        assert rows["General"]["can_post"] is True and rows["News"]["can_post"] is False

    def test_guests_have_no_hub(self, guest_client, workspace):
        assert guest_client.get(h(workspace, "channels/")).status_code == 403

    def test_general_is_open_to_all_members(self, member_client, colleague, workspace):
        general = channels(member_client, workspace)["General"]["id"]
        assert post(member_client, workspace, general, "hello all").status_code == 201
        assert channels(make_client(colleague), workspace)["General"]["unread"] == 1

    def test_only_admins_write_news_and_everyone_is_notified(self, admin_client, member_client, member, workspace):
        news = channels(member_client, workspace)["News"]["id"]
        assert post(member_client, workspace, news, "fake news").status_code == 403
        assert not post(member_client, workspace, news, "x").data.get("id")
        assert post(admin_client, workspace, news, "Office closed Friday").status_code == 201
        assert OpsNotification.objects.filter(user=member, kind="NEWS").count() == 1
        assert channels(member_client, workspace)["News"]["can_post"] is False
        assert channels(admin_client, workspace)["News"]["can_post"] is True

    def test_general_and_news_exist_once(self, member_client, admin_client, workspace):
        channels(member_client, workspace)
        channels(admin_client, workspace)
        assert HubChannel.objects.filter(workspace=workspace, kind="GENERAL").count() == 1
        assert HubChannel.objects.filter(workspace=workspace, kind="NEWS").count() == 1


@pytest.mark.contract
class TestPrivateMessages:
    def test_any_two_people_can_talk_even_the_admin(self, member_client, admin, member, workspace):
        response = member_client.post(h(workspace, "direct/"), {"user": str(admin.id)}, format="json")
        assert response.status_code == 200 and response.data["name"] == admin.display_name
        assert post(member_client, workspace, response.data["id"], "hi boss").status_code == 201

    def test_the_other_person_sees_it_and_is_notified(self, member_client, admin_client, admin, member, workspace):
        dm = member_client.post(h(workspace, "direct/"), {"user": str(admin.id)}, format="json").data["id"]
        post(member_client, workspace, dm, "hi")
        mine = channels(admin_client, workspace)
        assert member.display_name in mine and mine[member.display_name]["kind"] == "DM"
        assert OpsNotification.objects.filter(user=admin, kind="DIRECT").count() == 1

    def test_same_pair_same_channel(self, member_client, admin_client, admin, member, workspace):
        first = member_client.post(h(workspace, "direct/"), {"user": str(admin.id)}, format="json").data["id"]
        second = admin_client.post(h(workspace, "direct/"), {"user": str(member.id)}, format="json").data["id"]
        assert first == second

    def test_nobody_else_can_read_it(self, member_client, colleague, admin, workspace):
        dm = member_client.post(h(workspace, "direct/"), {"user": str(admin.id)}, format="json").data["id"]
        post(member_client, workspace, dm, "secret plan")
        spy = make_client(colleague)
        assert spy.get(h(workspace, f"channels/{dm}/messages/")).status_code == 404
        assert post(spy, workspace, dm, "boo").status_code == 404

    def test_not_with_yourself_guests_or_other_workspaces(
        self, member_client, member, guest, workspace, other_workspace
    ):
        assert member_client.post(h(workspace, "direct/"), {"user": str(member.id)}, format="json").status_code == 400
        assert member_client.post(h(workspace, "direct/"), {"user": str(guest.id)}, format="json").status_code == 400
        stranger = other_workspace.owner
        assert member_client.post(h(workspace, "direct/"), {"user": str(stranger.id)}, format="json").status_code == 400

    def test_people_list(self, member_client, member, workspace):
        names = {p["id"] for p in member_client.get(h(workspace, "people/")).data["results"]}
        assert member.id not in names and len(names) >= 3


@pytest.mark.contract
class TestDocHub:
    def test_write_tag_and_find(self, member_client, project, workspace):
        response = member_client.post(
            h(workspace, "docs/"),
            {
                "title": "Deploy runbook",
                "body": "Steps...",
                "tags": ["Ops", "runbook", "ops"],
                "project": str(project.id),
            },
            format="json",
        )
        assert response.status_code == 201 and response.data["tags"] == ["ops", "runbook"]
        listing = member_client.get(h(workspace, "docs/"), {"tag": "ops"}).data
        assert [d["title"] for d in listing["results"]] == ["Deploy runbook"] and listing["tags"] == ["ops", "runbook"]
        assert member_client.get(h(workspace, "docs/"), {"q": "zzz"}).data["results"] == []
        assert len(member_client.get(h(workspace, "docs/"), {"project": str(project.id)}).data["results"]) == 1

    def test_project_docs_are_for_project_members(self, member_client, lead_client, admin_client, project, workspace):
        doc = member_client.post(
            h(workspace, "docs/"), {"title": "Internal", "project": str(project.id)}, format="json"
        ).data
        assert lead_client.get(h(workspace, f"docs/{doc['id']}/")).status_code == 404
        assert lead_client.get(h(workspace, "docs/")).data["results"] == []
        assert admin_client.get(h(workspace, f"docs/{doc['id']}/")).status_code == 200

    def test_docs_without_a_project_are_open(self, member_client, lead_client, workspace):
        doc = member_client.post(h(workspace, "docs/"), {"title": "Welcome"}, format="json").data
        assert lead_client.get(h(workspace, f"docs/{doc['id']}/")).data["title"] == "Welcome"

    def test_cannot_tie_a_doc_to_someone_elses_project(self, lead_client, project, workspace):
        response = lead_client.post(h(workspace, "docs/"), {"title": "X", "project": str(project.id)}, format="json")
        assert response.status_code == 400

    def test_only_the_author_or_an_admin_changes_it(self, member_client, lead_client, admin_client, workspace):
        doc = member_client.post(h(workspace, "docs/"), {"title": "Mine"}, format="json").data
        path = h(workspace, f"docs/{doc['id']}/")
        assert lead_client.patch(path, {"title": "hacked"}, format="json").status_code == 400
        assert lead_client.delete(path).status_code == 400
        assert member_client.patch(path, {"title": "Mine v2", "tags": ["a"]}, format="json").data["title"] == "Mine v2"
        assert admin_client.delete(path).status_code == 204

    def test_title_is_required(self, member_client, workspace):
        assert member_client.post(h(workspace, "docs/"), {"title": " "}, format="json").status_code == 400


@pytest.mark.contract
class TestFilesLibrary:
    def test_share_with_the_workspace_and_download(self, member_client, lead_client, storage, workspace):
        response = member_client.post(h(workspace, "library/"), {"files": [pdf()]}, format="multipart")
        assert response.status_code == 201
        file_id = response.data["results"][0]["id"]
        assert [f["name"] for f in lead_client.get(h(workspace, "library/")).data["results"]] == ["a.pdf"]
        link = lead_client.get(h(workspace, f"files/{file_id}/"))
        assert link.status_code == 200 and "expires=300" in link.data["url"]

    def test_unsafe_files_are_refused(self, member_client, storage, workspace):
        bad = SimpleUploadedFile("x.exe", b"MZ", content_type="application/octet-stream")
        assert member_client.post(h(workspace, "library/"), {"files": [bad]}, format="multipart").status_code == 400
        assert member_client.post(h(workspace, "library/"), {}, format="multipart").status_code == 400
        assert not storage.files

    def test_the_list_includes_files_from_my_channels_only(
        self, member_client, lead_client, project, storage, workspace
    ):
        wd = channels(member_client, workspace)[project.name]["id"]
        member_client.post(
            h(workspace, f"channels/{wd}/messages/"), {"body": "see", "files": [pdf("proj.pdf")]}, format="multipart"
        )
        mine = member_client.get(h(workspace, "library/")).data["results"]
        assert [(f["name"], f["source"]) for f in mine] == [("proj.pdf", project.name)]
        assert lead_client.get(h(workspace, "library/")).data["results"] == []

    def test_other_workspaces_and_guests(self, member_client, guest_client, storage, other_workspace, workspace):
        file_id = member_client.post(h(workspace, "library/"), {"files": [pdf()]}, format="multipart").data["results"][
            0
        ]["id"]
        foreign = make_client(other_workspace.owner)
        assert foreign.get(url(other_workspace, f"hub/files/{file_id}/")).status_code == 404
        assert guest_client.get(h(workspace, f"files/{file_id}/")).status_code == 403

    def test_only_the_uploader_or_an_admin_removes_it(
        self, member_client, lead_client, admin_client, storage, workspace
    ):
        file_id = member_client.post(h(workspace, "library/"), {"files": [pdf()]}, format="multipart").data["results"][
            0
        ]["id"]
        assert lead_client.delete(h(workspace, f"library/{file_id}/")).status_code == 400
        assert admin_client.delete(h(workspace, f"library/{file_id}/")).status_code == 204


@pytest.mark.contract
class TestSecrets:
    def make(self, client, workspace, **extra):
        return client.post(
            h(workspace, "secrets/"),
            {"name": "DB password", "description": "prod", "value": "s3cr3t!", **extra},
            format="json",
        )

    def test_the_value_is_encrypted_and_never_listed(self, member_client, workspace):
        response = self.make(member_client, workspace)
        assert response.status_code == 201 and "value" not in response.data and "ciphertext" not in response.data
        stored = HubSecret.objects.get().ciphertext
        assert "s3cr3t" not in stored and stored.startswith("gAAAA")
        assert "s3cr3t" not in str(member_client.get(h(workspace, "secrets/")).data)

    def test_the_publisher_reveals_it_and_it_is_logged(self, member_client, workspace):
        secret = self.make(member_client, workspace).data["id"]
        response = member_client.post(h(workspace, f"secrets/{secret}/reveal/"))
        assert response.data["value"] == "s3cr3t!" and response["Cache-Control"] == "no-store"
        assert HubSecretLog.objects.filter(action="REVEAL").count() == 1

    def test_nobody_else_sees_it_not_even_the_admin(self, member_client, admin_client, lead_client, workspace):
        secret = self.make(member_client, workspace).data["id"]
        for other in (admin_client, lead_client):
            assert other.get(h(workspace, "secrets/")).data["results"] == []
            assert other.post(h(workspace, f"secrets/{secret}/reveal/")).status_code == 404
            assert other.patch(h(workspace, f"secrets/{secret}/"), {"value": "x"}, format="json").status_code == 404
            assert other.delete(h(workspace, f"secrets/{secret}/")).status_code == 404
            assert other.put(h(workspace, f"secrets/{secret}/access/"), {"users": []}, format="json").status_code == 404
        assert HubSecretLog.objects.filter(action="REVEAL").count() == 0

    def test_the_publisher_chooses_who_may_read(self, member_client, lead_client, lead, admin_client, workspace):
        secret = self.make(member_client, workspace).data["id"]
        response = member_client.put(
            h(workspace, f"secrets/{secret}/access/"), {"users": [str(lead.id)]}, format="json"
        )
        assert response.status_code == 200 and response.data["shared_with"] == [str(lead.id)]
        assert OpsNotification.objects.filter(user=lead, kind="SECRET").count() == 1
        seen = lead_client.get(h(workspace, "secrets/")).data["results"]
        assert len(seen) == 1 and seen[0]["is_publisher"] is False and "shared_with" not in seen[0]
        assert lead_client.post(h(workspace, f"secrets/{secret}/reveal/")).data["value"] == "s3cr3t!"
        # a reader cannot pass it on or change it
        assert (
            lead_client.put(h(workspace, f"secrets/{secret}/access/"), {"users": []}, format="json").status_code == 404
        )
        assert lead_client.patch(h(workspace, f"secrets/{secret}/"), {"value": "x"}, format="json").status_code == 404
        assert admin_client.post(h(workspace, f"secrets/{secret}/reveal/")).status_code == 404

    def test_access_can_be_taken_back(self, member_client, lead_client, lead, workspace):
        secret = self.make(member_client, workspace, users=[str(lead.id)]).data["id"]
        assert lead_client.post(h(workspace, f"secrets/{secret}/reveal/")).status_code == 200
        member_client.put(h(workspace, f"secrets/{secret}/access/"), {"users": []}, format="json")
        assert lead_client.post(h(workspace, f"secrets/{secret}/reveal/")).status_code == 404
        actions = list(HubSecretLog.objects.values_list("action", flat=True))
        assert "GRANT" in actions and "REVOKE" in actions

    def test_log_is_for_the_publisher_and_has_no_value(self, member_client, lead_client, lead, workspace):
        secret = self.make(member_client, workspace, users=[str(lead.id)]).data["id"]
        lead_client.post(h(workspace, f"secrets/{secret}/reveal/"))
        log = member_client.get(h(workspace, f"secrets/{secret}/access/"))
        assert [row["action"] for row in log.data["results"]][:2] == ["REVEAL", "GRANT"]
        assert "s3cr3t" not in str(log.data)
        assert lead_client.get(h(workspace, f"secrets/{secret}/access/")).status_code == 404

    def test_can_only_share_with_colleagues(self, member_client, guest, other_workspace, workspace):
        secret = self.make(member_client, workspace).data["id"]
        for user in (guest, other_workspace.owner):
            response = member_client.put(
                h(workspace, f"secrets/{secret}/access/"), {"users": [str(user.id)]}, format="json"
            )
            assert response.status_code == 400

    def test_update_changes_the_value(self, member_client, workspace):
        secret = self.make(member_client, workspace).data["id"]
        member_client.patch(h(workspace, f"secrets/{secret}/"), {"value": "new-one", "name": "DB"}, format="json")
        assert member_client.post(h(workspace, f"secrets/{secret}/reveal/")).data["value"] == "new-one"

    def test_a_value_and_a_name_are_required(self, member_client, workspace):
        assert member_client.post(h(workspace, "secrets/"), {"name": "x"}, format="json").status_code == 400
        assert member_client.post(h(workspace, "secrets/"), {"value": "x"}, format="json").status_code == 400

    def test_other_workspaces_cannot_reach_it(self, member_client, other_workspace, workspace):
        secret = self.make(member_client, workspace).data["id"]
        foreign = make_client(other_workspace.owner)
        assert foreign.post(url(other_workspace, f"hub/secrets/{secret}/reveal/")).status_code == 404

    def test_a_wrong_key_does_not_leak_anything(self, member_client, workspace):
        secret = self.make(member_client, workspace).data["id"]
        with mock.patch.dict("os.environ", {"TEAM_OPS_SECRET_KEY": "8w1o6mZyVJvX8s0Rk1y5l2m3n4o5p6q7r8s9t0u1v2w="}):
            assert member_client.post(h(workspace, f"secrets/{secret}/reveal/")).status_code == 400

    def test_guests_have_no_secrets(self, guest_client, workspace):
        assert guest_client.get(h(workspace, "secrets/")).status_code == 403


@pytest.mark.contract
class TestFlows:
    def stages(self, *groups):
        return [{"name": f"Stage {i + 1}", "users": [str(u.id) for u in group]} for i, group in enumerate(groups)]

    def flow(self, client, workspace, project, *groups):
        return client.post(
            url(workspace, "teamflow/flows/"),
            {"project": str(project.id), "name": "Release", "stages": self.stages(*groups)},
            format="json",
        )

    def task(self, workspace, project, user, done):
        state = (
            State.objects.create(
                name="Done" if done else "Todo",
                group="completed" if done else "unstarted",
                project=project,
                workspace=workspace,
            )
            if not State.objects.filter(project=project, group="completed" if done else "unstarted").exists()
            else State.objects.filter(project=project, group="completed" if done else "unstarted").first()
        )
        issue = Issue.objects.create(name="t", project=project, workspace=workspace, state=state)
        IssueAssignee.objects.create(issue=issue, assignee=user, project=project, workspace=workspace)
        return issue

    def test_only_admins_draw_flows(self, member_client, admin_client, project, member, colleague, workspace):
        assert self.flow(member_client, workspace, project, [member]).status_code == 403
        response = self.flow(admin_client, workspace, project, [member], [colleague])
        assert response.status_code == 201 and [s["name"] for s in response.data["stages"]] == ["Stage 1", "Stage 2"]

    def test_progress_per_person_and_pending_stages(self, admin_client, project, member, colleague, workspace):
        for done in (True, True, False, False):
            self.task(workspace, project, member, done)
        self.task(workspace, project, colleague, True)
        flow = self.flow(admin_client, workspace, project, [member], [colleague]).data
        first, second = flow["stages"]
        assert first["people"][0]["percent"] == 50 and first["pending"] is False
        assert second["pending"] is True  # stage 1 is not finished
        assert second["people"][0]["percent"] == 100

    def test_the_next_stage_starts_when_the_previous_is_done(self, admin_client, project, member, colleague, workspace):
        self.task(workspace, project, member, True)
        flow = self.flow(admin_client, workspace, project, [member], [colleague]).data
        assert flow["stages"][0]["percent"] == 100 and flow["stages"][1]["pending"] is False

    def test_people_without_tasks_have_no_percent_and_block_the_next_stage(
        self, admin_client, project, member, colleague, workspace
    ):
        flow = self.flow(admin_client, workspace, project, [member], [colleague]).data
        assert flow["stages"][0]["people"][0]["percent"] is None
        assert flow["stages"][1]["pending"] is True

    def test_validation(self, admin_client, project, member, lead, colleague, workspace, other_workspace):
        bad_cases = [
            [],  # no stages
            [[]],  # empty stage
            [[member], [member]],  # same person twice
            [[lead]],  # not a member of the project
            [[other_workspace.owner]],
        ]
        for groups in bad_cases:
            assert self.flow(admin_client, workspace, project, *groups).status_code == 400
        blank = admin_client.post(
            url(workspace, "teamflow/flows/"),
            {"project": str(project.id), "name": " ", "stages": self.stages([member])},
            format="json",
        )
        assert blank.status_code == 400

    def test_members_see_flows_of_their_projects_only(
        self, admin_client, member_client, lead_client, project, member, workspace
    ):
        self.flow(admin_client, workspace, project, [member])
        assert len(member_client.get(url(workspace, "teamflow/flows/")).data["results"]) == 1
        assert lead_client.get(url(workspace, "teamflow/flows/")).data["results"] == []
        assert member_client.get(url(workspace, "teamflow/flows/")).data["can_manage"] is False
        assert admin_client.get(url(workspace, "teamflow/flows/")).data["can_manage"] is True

    def test_edit_and_delete(self, admin_client, member_client, project, member, colleague, workspace):
        flow = self.flow(admin_client, workspace, project, [member]).data
        path = url(workspace, f"teamflow/flows/{flow['id']}/")
        changed = admin_client.put(
            path, {"name": "Release 2", "stages": self.stages([member], [colleague])}, format="json"
        )
        assert changed.status_code == 200 and len(changed.data["stages"]) == 2 and changed.data["name"] == "Release 2"
        assert member_client.put(path, {"name": "x", "stages": []}, format="json").status_code == 403
        assert member_client.delete(path).status_code == 403
        assert admin_client.delete(path).status_code == 204

    def test_members_picker_is_for_admins(self, admin_client, member_client, project, workspace):
        query = {"project": str(project.id)}
        assert len(admin_client.get(url(workspace, "teamflow/flows/members/"), query).data["results"]) == 3
        assert member_client.get(url(workspace, "teamflow/flows/members/"), query).status_code == 403
