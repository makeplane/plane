# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# ruff: noqa: F401, F811
"""Workday (finishing work), the Hub (channels, tags, files) and Teamflow (hand-offs between teams)."""

from datetime import timedelta
from unittest import mock

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status

from plane.db.models import Issue
from plane.team_ops.models import (
    ActiveTimer,
    HubAttachment,
    HubChannel,
    HubMention,
    HubMessage,
    TimeEntry,
    WorkReport,
    WorkSession,
)
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
    make_workspace,
    member,
    member_client,
    other_workspace,
    outsider,
    outsider_client,
    url,
    workspace,
)


class FakeStorage:
    """Stands in for the object storage, which is not available in tests."""

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
    return make_project(workspace, admin, "WD", members=[member, colleague])


@pytest.fixture
def dev_team(workspace, member):
    return make_team(workspace, "Dev", members=[member])


@pytest.fixture
def qa_team(workspace, colleague, lead):
    return make_team(workspace, "QA", leads=[lead], members=[colleague])


@pytest.fixture
def issue(workspace, project):
    return Issue.objects.create(name="Fix login", project=project, workspace=workspace)


def pdf(name="spec.pdf", body=b"%PDF-1.4 content"):
    return SimpleUploadedFile(name, body, content_type="application/pdf")


def channel_of(workspace, **target):
    return HubChannel.objects.get(workspace=workspace, **target)


def run_timer(workspace, user, issue, minutes=30):
    return ActiveTimer.objects.create(
        workspace=workspace,
        user=user,
        issue=issue,
        started_at=timezone.now() - timedelta(minutes=minutes),
        last_confirmed_at=timezone.now(),
    )


def finish(client, workspace, **data):
    return client.post(url(workspace, "work-sessions/finish/"), data, format="multipart")


@pytest.mark.contract
class TestFinishWork:
    def test_needs_a_running_timer(self, member_client, workspace):
        response = finish(member_client, workspace, summary="Did it", no_document="true")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_report_is_required(self, member_client, workspace, member, issue):
        run_timer(workspace, member, issue)
        response = finish(member_client, workspace, summary="  ", no_document="true")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert ActiveTimer.objects.filter(user=member).exists()

    def test_document_or_confirmation_is_required(self, member_client, workspace, member, issue):
        run_timer(workspace, member, issue)
        response = finish(member_client, workspace, summary="Did it")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "document" in response.data["detail"].lower()
        assert ActiveTimer.objects.filter(user=member).exists()
        assert not WorkSession.objects.exists()

    def test_finishing_without_a_document_when_confirmed(self, member_client, workspace, member, issue):
        run_timer(workspace, member, issue, minutes=45)
        response = finish(member_client, workspace, summary="Fixed the redirect", no_document="true")
        assert response.status_code == status.HTTP_201_CREATED
        session = WorkSession.objects.get()
        assert session.no_document and session.issue == issue and session.user == member
        assert 44 * 60 <= session.duration_seconds <= 46 * 60
        assert not ActiveTimer.objects.filter(user=member).exists()
        assert TimeEntry.objects.get(user=member).issue == issue
        assert response.data["session"]["work_item"] == "WD-1"

    def test_a_document_text_counts_as_a_document(self, member_client, workspace, member, issue):
        run_timer(workspace, member, issue)
        response = finish(member_client, workspace, summary="Wrote it up", document_text="Notes: redirect uses /next")
        assert response.status_code == status.HTTP_201_CREATED
        session = WorkSession.objects.get()
        assert session.document_text.startswith("Notes") and not session.no_document

    def test_a_file_counts_as_a_document(self, member_client, workspace, member, issue, storage):
        run_timer(workspace, member, issue)
        response = finish(member_client, workspace, summary="Spec ready", files=[pdf()])
        assert response.status_code == status.HTTP_201_CREATED
        assert HubAttachment.objects.get().session_id == WorkSession.objects.get().id
        assert len(storage.files) == 1

    def test_a_bad_file_keeps_the_timer_running(self, member_client, workspace, member, issue, storage):
        run_timer(workspace, member, issue)
        script = SimpleUploadedFile("run.exe", b"MZ", content_type="application/octet-stream")
        response = finish(member_client, workspace, summary="Done", files=[script])
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert ActiveTimer.objects.filter(user=member).exists()
        assert not WorkSession.objects.exists()

    def test_the_day_report_gets_a_line_per_session(self, member_client, workspace, member, issue):
        run_timer(workspace, member, issue, minutes=60)
        finish(member_client, workspace, summary="First part", no_document="true")
        run_timer(workspace, member, issue, minutes=10)
        finish(member_client, workspace, summary="Second part", no_document="true")
        report = WorkReport.objects.get(user=member)
        assert "WD-1 First part" in report.done and "WD-1 Second part" in report.done
        assert report.done.count("\n") == 1

    def test_guests_cannot_finish_work(self, guest_client, workspace):
        assert finish(guest_client, workspace, summary="x", no_document="true").status_code == 403

    def test_a_timer_without_a_work_item_cannot_be_finished_as_work(self, member_client, workspace, member):
        ActiveTimer.objects.create(workspace=workspace, user=member, issue=None, started_at=timezone.now())
        response = finish(member_client, workspace, summary="x", no_document="true")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert ActiveTimer.objects.filter(user=member).exists()


@pytest.mark.contract
class TestSessionsAndTasks:
    def test_people_see_their_own_sessions_only(self, member_client, admin_client, workspace, member, colleague, issue):
        run_timer(workspace, member, issue)
        finish(member_client, workspace, summary="Mine", no_document="true")
        day = timezone.now().date()
        params = {"from": str(day - timedelta(days=1)), "to": str(day + timedelta(days=1))}
        own = member_client.get(url(workspace, "work-sessions/"), params)
        assert [s["summary"] for s in own.data["results"]] == ["Mine"]
        peer = make_client(colleague).get(url(workspace, "work-sessions/"), {**params, "user": str(member.id)})
        assert peer.status_code == status.HTTP_403_FORBIDDEN
        admin_view = admin_client.get(url(workspace, "work-sessions/"), {**params, "user": str(member.id)})
        assert admin_view.status_code == status.HTTP_200_OK and len(admin_view.data["results"]) == 1

    def test_time_per_task(self, member_client, workspace, member, issue):
        run_timer(workspace, member, issue, minutes=30)
        finish(member_client, workspace, summary="One", no_document="true")
        run_timer(workspace, member, issue, minutes=15)
        finish(member_client, workspace, summary="Two", no_document="true")
        today = timezone.now().date()
        response = member_client.get(
            url(workspace, "work-tasks/"),
            {"from": str(today - timedelta(days=1)), "to": str(today + timedelta(days=1))},
        )
        assert response.status_code == status.HTTP_200_OK
        (row,) = response.data["results"]
        assert row["key"] == "WD-1" and 44 * 60 <= row["seconds"] <= 46 * 60
        assert response.data["total_seconds"] == row["seconds"]


@pytest.mark.contract
class TestHubChannels:
    def test_channels_follow_team_and_project_membership(
        self, member_client, workspace, member, project, dev_team, qa_team, outsider_client
    ):
        names = {c["name"] for c in member_client.get(url(workspace, "hub/channels/")).data["results"]}
        assert names == {"Dev", "WD", "General", "News"}  # not QA: the person is not in it
        assert outsider_client.get(url(workspace, "hub/channels/")).status_code == status.HTTP_403_FORBIDDEN

    def test_guests_have_no_hub(self, guest_client, workspace):
        assert guest_client.get(url(workspace, "hub/channels/")).status_code == status.HTTP_403_FORBIDDEN

    def test_a_channel_of_another_team_looks_missing(self, member_client, workspace, member, dev_team, qa_team):
        member_client.get(url(workspace, "hub/channels/"))
        make_client(qa_team.members.first().user).get(url(workspace, "hub/channels/"))
        qa = channel_of(workspace, team=qa_team)
        assert member_client.get(url(workspace, f"hub/channels/{qa.id}/messages/")).status_code == 404
        assert (
            member_client.post(
                url(workspace, f"hub/channels/{qa.id}/messages/"), {"body": "hi"}, format="json"
            ).status_code
            == 404
        )

    def test_a_channel_of_another_workspace_looks_missing(self, member_client, workspace, other_workspace, dev_team):
        foreign_owner = other_workspace.owner
        other_project = make_project(other_workspace, foreign_owner, "FRN")
        make_client(foreign_owner).get(url(other_workspace, "hub/channels/"))
        foreign = channel_of(other_workspace, project=other_project)
        assert member_client.get(url(workspace, f"hub/channels/{foreign.id}/messages/")).status_code == 404

    def test_leaving_the_project_closes_the_channel(self, member_client, workspace, member, project):
        channels = member_client.get(url(workspace, "hub/channels/")).data["results"]
        channel_id = next(row["id"] for row in channels if row["kind"] == "PROJECT")
        project.project_projectmember.filter(member=member).update(is_active=False)
        assert member_client.get(url(workspace, f"hub/channels/{channel_id}/messages/")).status_code == 404


@pytest.mark.contract
class TestHubMessages:
    def _channel(self, client, workspace, name):
        rows = client.get(url(workspace, "hub/channels/")).data["results"]
        return next(row["id"] for row in rows if row["name"] == name)

    def test_post_read_and_unread(self, member_client, workspace, member, colleague, project):
        channel_id = self._channel(member_client, workspace, "WD")
        sent = member_client.post(
            url(workspace, f"hub/channels/{channel_id}/messages/"), {"body": "Hello"}, format="json"
        )
        assert sent.status_code == status.HTTP_201_CREATED
        other = make_client(colleague)
        rows = other.get(url(workspace, "hub/channels/")).data["results"]
        assert next(r for r in rows if r["name"] == "WD")["unread"] == 1
        assert member_client.get(url(workspace, "hub/channels/")).data["results"][0]["unread"] == 0  # own message
        other.get(url(workspace, f"hub/channels/{channel_id}/messages/"))
        rows = other.get(url(workspace, "hub/channels/")).data["results"]
        assert next(r for r in rows if r["name"] == "WD")["unread"] == 0

    def test_tagging_a_person_notifies_them_once_and_reading_clears_it(
        self, member_client, workspace, member, colleague, project
    ):
        channel_id = self._channel(member_client, workspace, "WD")
        member_client.post(
            url(workspace, f"hub/channels/{channel_id}/messages/"),
            {"body": "@colleague look", "users": [str(colleague.id)]},
            format="json",
        )
        other = make_client(colleague)
        assert other.get(url(workspace, "hub/channels/")).data["unread_mentions"] == 1
        mentions = other.get(url(workspace, "hub/mentions/")).data["results"]
        assert len(mentions) == 1 and mentions[0]["read"] is False
        other.get(url(workspace, f"hub/channels/{channel_id}/messages/"))
        assert other.get(url(workspace, "hub/channels/")).data["unread_mentions"] == 0
        assert HubMention.objects.filter(user=member).count() == 0  # never notifies the author

    def test_cannot_tag_someone_who_cannot_read_the_channel(self, member_client, workspace, project, lead):
        channel_id = self._channel(member_client, workspace, "WD")
        response = member_client.post(
            url(workspace, f"hub/channels/{channel_id}/messages/"),
            {"body": "hi", "users": [str(lead.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not HubMessage.objects.exists()

    def test_tagging_a_team_tags_its_members_who_can_read_the_channel(
        self, member_client, workspace, member, colleague, project, dev_team, qa_team
    ):
        channel_id = self._channel(member_client, workspace, "WD")
        response = member_client.post(
            url(workspace, f"hub/channels/{channel_id}/messages/"),
            {"body": "QA please", "teams": [str(qa_team.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        # the QA lead is not in the project, so only the QA member who is can be reached here
        assert set(HubMention.objects.values_list("user_id", flat=True)) == {colleague.id}
        assert HubMention.objects.get().via_team_id == qa_team.id

    def test_unknown_team_is_rejected(self, member_client, workspace, project, other_workspace):
        foreign = make_team(other_workspace, "Foreign")
        channel_id = self._channel(member_client, workspace, "WD")
        response = member_client.post(
            url(workspace, f"hub/channels/{channel_id}/messages/"),
            {"body": "hi", "teams": [str(foreign.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_replies_stay_in_their_channel_and_one_level_deep(self, member_client, workspace, project, dev_team):
        wd = self._channel(member_client, workspace, "WD")
        dev = self._channel(member_client, workspace, "Dev")
        root = member_client.post(url(workspace, f"hub/channels/{wd}/messages/"), {"body": "root"}, format="json").data
        reply = member_client.post(
            url(workspace, f"hub/channels/{wd}/messages/"), {"body": "reply", "parent": str(root["id"])}, format="json"
        ).data
        deeper = member_client.post(
            url(workspace, f"hub/channels/{wd}/messages/"),
            {"body": "deeper", "parent": str(reply["id"])},
            format="json",
        ).data
        assert deeper["parent"] == root["id"]
        across = member_client.post(
            url(workspace, f"hub/channels/{dev}/messages/"), {"body": "x", "parent": str(root["id"])}, format="json"
        )
        assert across.status_code == status.HTTP_400_BAD_REQUEST

    def test_an_empty_message_is_rejected(self, member_client, workspace, project):
        channel_id = self._channel(member_client, workspace, "WD")
        response = member_client.post(
            url(workspace, f"hub/channels/{channel_id}/messages/"), {"body": "  "}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_only_the_author_edits_and_admins_can_delete(
        self, member_client, admin_client, workspace, member, colleague, project
    ):
        channel_id = self._channel(member_client, workspace, "WD")
        message = member_client.post(
            url(workspace, f"hub/channels/{channel_id}/messages/"), {"body": "v1"}, format="json"
        ).data
        path = url(workspace, f"hub/messages/{message['id']}/")
        peer = make_client(colleague)
        assert peer.patch(path, {"body": "hacked"}, format="json").status_code == status.HTTP_400_BAD_REQUEST
        assert peer.delete(path).status_code == status.HTTP_400_BAD_REQUEST
        edited = member_client.patch(path, {"body": "v2"}, format="json")
        assert edited.data["body"] == "v2" and edited.data["edited_at"]
        assert admin_client.delete(path).status_code == status.HTTP_204_NO_CONTENT
        shown = member_client.get(url(workspace, f"hub/channels/{channel_id}/messages/")).data["results"][0]
        assert shown["is_deleted"] and shown["body"] == ""


@pytest.mark.contract
class TestHubFiles:
    def _channel(self, client, workspace):
        rows = client.get(url(workspace, "hub/channels/")).data["results"]
        return next(row["id"] for row in rows if row["name"] == "WD")

    def _post(self, client, workspace, channel_id, files, body="see file"):
        return client.post(
            url(workspace, f"hub/channels/{channel_id}/messages/"), {"body": body, "files": files}, format="multipart"
        )

    def test_upload_and_signed_download(self, member_client, workspace, project, storage, colleague):
        channel_id = self._channel(member_client, workspace)
        response = self._post(member_client, workspace, channel_id, [pdf()])
        assert response.status_code == status.HTTP_201_CREATED
        (file,) = response.data["attachments"]
        assert file["name"] == "spec.pdf"
        key = HubAttachment.objects.get().storage_key
        assert key.startswith(f"team-ops/{workspace.id}/") and key.endswith(".pdf") and "spec" not in key
        link = make_client(colleague).get(url(workspace, f"hub/files/{file['id']}/"))
        assert link.status_code == status.HTTP_200_OK
        assert "expires=300" in link.data["url"] and "disposition=attachment" in link.data["url"]

    def test_images_show_inline(self, member_client, workspace, project, storage):
        channel_id = self._channel(member_client, workspace)
        png = SimpleUploadedFile("shot.png", b"\x89PNG\r\n\x1a\nabc", content_type="image/png")
        file = self._post(member_client, workspace, channel_id, [png]).data["attachments"][0]
        assert "disposition=inline" in member_client.get(url(workspace, f"hub/files/{file['id']}/")).data["url"]

    def test_non_members_get_no_link(self, member_client, workspace, project, storage, lead_client, outsider_client):
        channel_id = self._channel(member_client, workspace)
        file = self._post(member_client, workspace, channel_id, [pdf()]).data["attachments"][0]
        path = url(workspace, f"hub/files/{file['id']}/")
        assert lead_client.get(path).status_code == 404  # a workspace member, but not in the project
        assert outsider_client.get(path).status_code == 403

    def test_other_workspaces_get_no_link(self, member_client, workspace, project, storage, other_workspace):
        channel_id = self._channel(member_client, workspace)
        file = self._post(member_client, workspace, channel_id, [pdf()]).data["attachments"][0]
        foreign = make_client(other_workspace.owner)
        assert foreign.get(url(other_workspace, f"hub/files/{file['id']}/")).status_code == 404

    def test_deleted_messages_hide_their_files(self, member_client, colleague, workspace, project, storage):
        channel_id = self._channel(member_client, workspace)
        message = self._post(member_client, workspace, channel_id, [pdf()]).data
        member_client.delete(url(workspace, f"hub/messages/{message['id']}/"))
        path = url(workspace, f"hub/files/{message['attachments'][0]['id']}/")
        assert make_client(colleague).get(path).status_code == 404

    @pytest.mark.parametrize(
        "name,content,content_type",
        [
            ("virus.exe", b"MZ", "application/octet-stream"),
            ("page.html", b"<script>", "text/html"),
            ("icon.svg", b"<svg onload=x>", "image/svg+xml"),
            ("fake.pdf", b"not really a pdf", "application/pdf"),
            ("fake.png", b"GIF89a", "image/png"),
            ("mismatch.pdf", b"%PDF-1.4", "text/plain"),
            ("empty.pdf", b"", "application/pdf"),
            (".pdf", b"%PDF-1.4", "application/pdf"),
        ],
    )
    def test_unsafe_files_are_refused(self, member_client, workspace, project, storage, name, content, content_type):
        channel_id = self._channel(member_client, workspace)
        upload = SimpleUploadedFile(name, content, content_type=content_type)
        response = self._post(member_client, workspace, channel_id, [upload])
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not storage.files and not HubMessage.objects.exists()

    def test_too_large_files_are_refused(self, member_client, workspace, project, storage):
        channel_id = self._channel(member_client, workspace)
        with mock.patch("plane.team_ops.services.hub_files.MAX_UPLOAD_BYTES", 10):
            response = self._post(member_client, workspace, channel_id, [pdf(body=b"%PDF-" + b"x" * 50)])
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_a_bad_file_among_good_ones_sends_nothing(self, member_client, workspace, project, storage):
        channel_id = self._channel(member_client, workspace)
        bad = SimpleUploadedFile("x.exe", b"MZ", content_type="application/octet-stream")
        response = self._post(member_client, workspace, channel_id, [pdf(), bad])
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not storage.files and not HubMessage.objects.exists()

    def test_path_tricks_in_names_are_neutralised(self, member_client, workspace, project, storage):
        channel_id = self._channel(member_client, workspace)
        response = self._post(member_client, workspace, channel_id, [pdf(name="../../etc/passwd.pdf")])
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["attachments"][0]["name"] == "passwd.pdf"
        assert ".." not in HubAttachment.objects.get().storage_key

    def test_too_many_files(self, member_client, workspace, project, storage):
        channel_id = self._channel(member_client, workspace)
        response = self._post(member_client, workspace, channel_id, [pdf(f"{i}.pdf") for i in range(11)])
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
class TestAttentionAndTeamflow:
    def _finish_with_attention(self, client, workspace, teams, **extra):
        return finish(
            client,
            workspace,
            summary="API is ready",
            no_document="true",
            attention_message="Please test the login flow",
            attention_teams=[str(t.id) for t in teams],
            **extra,
        )

    def test_attention_reaches_the_project_and_the_team_channel(
        self, member_client, workspace, member, colleague, lead, issue, project, dev_team, qa_team
    ):
        run_timer(workspace, member, issue)
        response = self._finish_with_attention(member_client, workspace, [qa_team])
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["session"]["needs_attention"]
        kinds = set(HubMessage.objects.values_list("kind", "channel__kind"))
        assert kinds == {("ATTENTION", "PROJECT"), ("ATTENTION", "TEAM")}
        # QA members are notified (the lead through the QA channel, the colleague in both)
        assert set(HubMention.objects.values_list("user_id", flat=True)) == {colleague.id, lead.id}
        lead_view = make_client(lead).get(url(workspace, "hub/mentions/")).data["results"]
        assert lead_view[0]["kind"] == "ATTENTION" and lead_view[0]["via_team"] == "QA"

    def test_attention_needs_a_message(self, member_client, workspace, member, issue, qa_team):
        run_timer(workspace, member, issue)
        response = finish(
            member_client,
            workspace,
            summary="x",
            no_document="true",
            needs_attention="true",
            attention_teams=[str(qa_team.id)],
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert ActiveTimer.objects.filter(user=member).exists()

    def test_teamflow_pending_then_delivered(
        self, member_client, workspace, member, colleague, lead, issue, project, dev_team, qa_team
    ):
        run_timer(workspace, member, issue)
        self._finish_with_attention(member_client, workspace, [qa_team])
        qa = make_client(colleague)
        flow = qa.get(url(workspace, "teamflow/")).data
        assert [(r["from_team"]["name"], r["to_team"]["name"], r["status"]) for r in flow["results"]] == [
            ("Dev", "QA", "pending")
        ]
        assert flow["edges"] == [{"from": dev_team.id, "to": qa_team.id, "pending": 1, "delivered": 0}]
        assert {n["name"] for n in flow["nodes"]} == {"Dev", "QA"}
        # a QA member opens the hand-off
        channel = channel_of(workspace, team=qa_team)
        make_client(lead).get(url(workspace, f"hub/channels/{channel.id}/messages/"))
        delivered = qa.get(url(workspace, "teamflow/"), {"status": "delivered"}).data["results"]
        assert len(delivered) == 1 and delivered[0]["status"] == "delivered"
        assert qa.get(url(workspace, "teamflow/"), {"status": "pending"}).data["results"] == []

    def test_teamflow_filters_and_lists_the_files_and_work_item(
        self, member_client, admin_client, workspace, member, issue, project, dev_team, qa_team, storage
    ):
        run_timer(workspace, member, issue)
        self._finish_with_attention(member_client, workspace, [qa_team], files=[pdf()])
        row = admin_client.get(url(workspace, "teamflow/")).data["results"][0]
        assert row["work_item"] == "WD-1" and [f["name"] for f in row["files"]] == ["spec.pdf"]
        assert admin_client.get(url(workspace, "teamflow/"), {"team": str(dev_team.id)}).data["results"]
        other = make_team(workspace, "Ops")
        assert admin_client.get(url(workspace, "teamflow/"), {"team": str(other.id)}).data["results"] == []
        assert admin_client.get(url(workspace, "teamflow/"), {"status": "bogus"}).status_code == 400

    def test_teams_not_involved_do_not_see_a_hand_off(
        self, member_client, workspace, member, issue, project, dev_team, qa_team, lead
    ):
        run_timer(workspace, member, issue)
        self._finish_with_attention(member_client, workspace, [qa_team])
        outsider_team = make_team(workspace, "Sales", members=[make_user("sales")])
        sales = outsider_team.members.first().user
        join(workspace, sales, 15)
        assert make_client(sales).get(url(workspace, "teamflow/")).data["results"] == []
        assert make_client(lead).get(url(workspace, "teamflow/")).data["results"]

    def test_guests_have_no_teamflow(self, guest_client, workspace):
        assert guest_client.get(url(workspace, "teamflow/")).status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestTimerStillWorks:
    def test_stopping_the_timer_from_time_tracking(self, member_client, workspace, member, issue):
        run_timer(workspace, member, issue, minutes=20)
        response = member_client.delete(url(workspace, "timer/"))
        assert response.status_code == status.HTTP_201_CREATED
        assert 19 * 60 <= response.data["entry"]["duration_seconds"] <= 21 * 60 and response.data["capped"] is False
        assert member_client.delete(url(workspace, "timer/")).status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestDashboardWorkday:
    def test_dashboard_counts_finished_work(
        self, member_client, admin_client, workspace, member, issue, project, dev_team, qa_team
    ):
        run_timer(workspace, member, issue, minutes=30)
        finish(member_client, workspace, summary="One", no_document="true")
        run_timer(workspace, member, issue, minutes=10)
        finish(
            member_client,
            workspace,
            summary="Two",
            document_text="notes",
            attention_message="Look",
            attention_teams=[str(qa_team.id)],
        )
        day = timezone.now().date()
        query = {"from": str(day - timedelta(days=1)), "to": str(day + timedelta(days=1))}
        response = admin_client.get(url(workspace, "dashboard/"), query)
        assert response.status_code == status.HTTP_200_OK
        workday = response.data["workday"]
        assert workday["finished"] == 2 and workday["no_document"] == 1 and workday["needs_attention"] == 1
        assert 39 * 60 <= workday["seconds"] <= 41 * 60
        (task,) = workday["tasks"]
        assert task["key"] == "WD-1" and task["sessions"] == 2

    def test_dashboard_without_work_is_empty(self, admin_client, workspace):
        day = timezone.now().date()
        response = admin_client.get(url(workspace, "dashboard/"), {"from": str(day), "to": str(day)})
        assert response.data["workday"] == {
            "finished": 0,
            "no_document": 0,
            "needs_attention": 0,
            "seconds": 0,
            "tasks": [],
        }
