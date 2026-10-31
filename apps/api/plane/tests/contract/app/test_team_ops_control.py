# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# ruff: noqa: F401, F811
"""Control: managers watch tasks and hours, the Hub and the flows."""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Issue
from plane.team_ops.models import ActiveTimer, CalendarEntry, HubChannel, HubMessage, WorkInterruption, WorkSession
from plane.team_ops.services.workday import freeze_unanswered_timers, week_start_of
from plane.tests.contract.app.team_ops_support import (
    _no_broker,
    admin,
    admin_client,
    colleague,
    guest,
    guest_client,
    lead,
    lead_client,
    make_client,
    make_project,
    make_team,
    member,
    member_client,
    other_workspace,
    outsider,
    outsider_client,
    url,
    workspace,
)


@pytest.fixture
def project(workspace, admin, member, colleague):
    return make_project(workspace, admin, "CT", members=[member, colleague])


@pytest.fixture
def issue(workspace, project):
    return Issue.objects.create(name="Fix login", project=project, workspace=workspace)


def c(workspace, path=""):
    return url(workspace, f"control/{path}")


def span():
    day = timezone.now().date()
    return {"from": str(day - timedelta(days=2)), "to": str(day + timedelta(days=1))}


def work(workspace, user, issue, minutes, place="REMOTE", **extra):
    end = timezone.now()
    return WorkSession.objects.create(
        workspace=workspace,
        user=user,
        project=issue.project,
        issue=issue,
        started_at=end - timedelta(minutes=minutes),
        finished_at=end,
        duration_seconds=minutes * 60,
        summary="x",
        location=place,
        **extra,
    )


@pytest.mark.contract
class TestTeamControl:
    def test_rows_with_hours_by_place(self, admin_client, workspace, member, colleague, issue):
        work(workspace, member, issue, 90, "ONSITE")
        work(workspace, member, issue, 30, "REMOTE", no_document=True)
        data = admin_client.get(c(workspace, "team/"), span()).data
        row = next(r for r in data["results"] if r["user"]["id"] == member.id)
        assert row["period"]["seconds"] == 7200
        assert row["period"]["onsite_seconds"] == 5400 and row["period"]["remote_seconds"] == 1800
        assert row["period"]["sessions"] == 2 and row["period"]["tasks"] == 1 and row["period"]["without_document"] == 1
        idle = next(r for r in data["results"] if r["user"]["id"] == colleague.id)
        assert idle["period"]["seconds"] == 0 and idle["state"] == "IDLE"
        assert data["totals"]["seconds"] == 7200

    def test_freezes_and_pauses_are_counted(self, admin_client, workspace, member, issue):
        then = timezone.now() - timedelta(minutes=60)
        ActiveTimer.objects.create(
            workspace=workspace, user=member, issue=issue, started_at=then, last_confirmed_at=then, location="REMOTE"
        )
        freeze_unanswered_timers()
        data = admin_client.get(c(workspace, "team/"), span()).data
        row = next(r for r in data["results"] if r["user"]["id"] == member.id)
        assert row["state"] == "FROZEN" and row["period"]["freezes"] == 1
        assert row["period"]["frozen_seconds"] >= 29 * 60
        assert data["totals"]["freezes"] == 1

    def test_who_has_not_planned_the_week(self, admin_client, workspace, member, colleague):
        start = week_start_of(timezone.now().date())
        for offset in range(7):
            CalendarEntry.objects.create(
                workspace=workspace, user=member, work_date=start + timedelta(days=offset), work_mode="REMOTE"
            )
        rows = {r["user"]["id"]: r for r in admin_client.get(c(workspace, "team/"), span()).data["results"]}
        assert rows[member.id]["unplanned_days"] == 0
        # nobody else planned anything, so they are behind on every working day that is left
        remaining = [
            d
            for d in (start + timedelta(days=i) for i in range(7))
            if d >= timezone.now().date() and d.isoweekday() in (1, 2, 3, 4, 5)
        ]
        assert rows[colleague.id]["unplanned_days"] == len(remaining)

    def test_csv_export(self, admin_client, workspace, member, issue):
        work(workspace, member, issue, 60)
        response = admin_client.get(c(workspace, "team/"), {**span(), "export": "csv"})
        assert response.status_code == 200 and response["Content-Type"].startswith("text/csv")
        text = response.content.decode("utf-8-sig")
        assert text.splitlines()[0].startswith("Person,Worked (h)") and "1.00" in text

    def test_filters_narrow_the_people(self, admin_client, workspace, member, colleague, issue):
        data = admin_client.get(c(workspace, "team/"), {**span(), "user": str(member.id)}).data
        assert [r["user"]["id"] for r in data["results"]] == [member.id]

    def test_plain_members_cannot_use_it(self, member_client, guest_client, workspace):
        assert member_client.get(c(workspace, "team/"), span()).status_code == status.HTTP_403_FORBIDDEN
        assert guest_client.get(c(workspace, "team/"), span()).status_code == status.HTTP_403_FORBIDDEN

    def test_leads_see_their_own_team_only(self, lead_client, workspace, lead, member, colleague, issue):
        from plane.team_ops.models import OpsTeam

        # a lead sees the team only when the policy gives leads that right
        from plane.team_ops.models import CalendarSettings

        CalendarSettings.objects.update_or_create(
            workspace=workspace, defaults={"team_view_access": CalendarSettings.TeamViewAccess.ADMINS_AND_LEADS}
        )
        make_team(workspace, "Dev", leads=[lead], members=[member])
        rows = lead_client.get(c(workspace, "team/"), span()).data["results"]
        assert {r["user"]["id"] for r in rows} == {lead.id, member.id}

    def test_a_range_is_required_and_capped(self, admin_client, workspace):
        assert admin_client.get(c(workspace, "team/")).status_code == 400
        assert admin_client.get(c(workspace, "team/"), {"from": "2020-01-01", "to": "2026-01-01"}).status_code == 400

    def test_interruption_history(self, admin_client, workspace, member, issue, lead_client):
        then = timezone.now() - timedelta(minutes=60)
        ActiveTimer.objects.create(
            workspace=workspace, user=member, issue=issue, started_at=then, last_confirmed_at=then
        )
        freeze_unanswered_timers()
        WorkInterruption.objects.create(
            workspace=workspace, user=member, kind="BREAK", started_at=then, ended_at=then + timedelta(minutes=10)
        )
        everything = admin_client.get(c(workspace, "interruptions/"), span()).data["results"]
        assert {row["kind"] for row in everything} == {"BREAK", "FREEZE"}
        freezes = admin_client.get(c(workspace, "interruptions/"), {**span(), "kind": "FREEZE"}).data["results"]
        assert [row["kind"] for row in freezes] == ["FREEZE"] and freezes[0]["user"]["id"] == member.id
        assert admin_client.get(c(workspace, "interruptions/"), {**span(), "kind": "x"}).status_code == 400
        assert lead_client.get(c(workspace, "interruptions/"), span()).status_code == 403


@pytest.mark.contract
class TestHubControl:
    def test_overview_without_private_content(self, admin_client, member_client, workspace, project, member):
        for client in (admin_client, member_client):
            client.get(url(workspace, "hub/channels/"))
        general = HubChannel.objects.get(workspace=workspace, kind="GENERAL")
        member_client.post(url(workspace, f"hub/channels/{general.id}/messages/"), {"body": "hi"}, format="json")
        member_client.post(url(workspace, "hub/direct/"), {"user": str(workspace.owner.id)}, format="json")
        data = admin_client.get(c(workspace, "hub/")).data
        rows = {row["name"]: row for row in data["channels"]}
        assert rows["General"]["messages"] == 1 and rows["General"]["members"] >= 3
        assert [row["kind"] for row in data["channels"]][:2] == ["NEWS", "GENERAL"]
        assert data["private_conversations"] == 1
        assert "secrets" in data and not any(row["kind"] == "DM" for row in data["channels"])

    def test_only_admins(self, member_client, lead_client, workspace):
        for client in (member_client, lead_client):
            assert client.get(c(workspace, "hub/")).status_code == 403
            assert client.get(c(workspace, "flows/")).status_code == 403

    def test_locking_a_channel_stops_members_not_admins(self, admin_client, member_client, workspace, project):
        member_client.get(url(workspace, "hub/channels/"))
        admin_client.get(url(workspace, "hub/channels/"))
        general = HubChannel.objects.get(workspace=workspace, kind="GENERAL")
        post = url(workspace, f"hub/channels/{general.id}/messages/")
        assert admin_client.patch(c(workspace, f"hub/channels/{general.id}/"), {"is_locked": True}, format="json").data[
            "is_locked"
        ]
        assert member_client.post(post, {"body": "x"}, format="json").status_code == 403
        assert admin_client.post(post, {"body": "all hands"}, format="json").status_code == 201
        rows = {r["name"]: r for r in member_client.get(url(workspace, "hub/channels/")).data["results"]}
        assert rows["General"]["can_post"] is False
        admin_client.patch(c(workspace, f"hub/channels/{general.id}/"), {"is_locked": False}, format="json")
        assert member_client.post(post, {"body": "x"}, format="json").status_code == 201

    def test_private_conversations_are_out_of_reach(self, admin_client, member_client, member, admin, workspace):
        dm = member_client.post(url(workspace, "hub/direct/"), {"user": str(admin.id)}, format="json").data["id"]
        message = member_client.post(
            url(workspace, f"hub/channels/{dm}/messages/"), {"body": "private"}, format="json"
        ).data["id"]
        assert (
            admin_client.patch(c(workspace, f"hub/channels/{dm}/"), {"is_locked": True}, format="json").status_code
            == 404
        )
        assert admin_client.get(c(workspace, f"hub/channels/{dm}/")).status_code == 404
        assert admin_client.delete(c(workspace, f"hub/messages/{message}/")).status_code == 404
        assert HubMessage.objects.get(pk=message).body == "private"

    def test_moderation_reads_and_removes_messages(self, admin_client, member_client, workspace, project):
        member_client.get(url(workspace, "hub/channels/"))
        channel = HubChannel.objects.get(workspace=workspace, project=project)
        message = member_client.post(
            url(workspace, f"hub/channels/{channel.id}/messages/"), {"body": "spam"}, format="json"
        ).data["id"]
        listing = admin_client.get(c(workspace, f"hub/channels/{channel.id}/")).data["results"]
        assert [m["body"] for m in listing] == ["spam"]
        assert admin_client.delete(c(workspace, f"hub/messages/{message}/")).status_code == 204
        assert admin_client.get(c(workspace, f"hub/channels/{channel.id}/")).data["results"][0]["is_deleted"] is True

    def test_other_workspaces_are_out_of_reach(self, admin_client, member_client, other_workspace, workspace):
        member_client.get(url(workspace, "hub/channels/"))
        channel = HubChannel.objects.get(workspace=workspace, kind="GENERAL")
        foreign = make_client(other_workspace.owner)
        assert foreign.get(url(other_workspace, f"control/hub/channels/{channel.id}/")).status_code == 404


@pytest.mark.contract
class TestFlowControl:
    def test_flow_overview_shows_where_work_is_stuck(self, admin_client, workspace, project, member, colleague):
        admin_client.post(
            url(workspace, "teamflow/flows/"),
            {
                "project": str(project.id),
                "name": "Release",
                "stages": [
                    {"name": "Build", "users": [str(member.id)]},
                    {"name": "QA", "users": [str(colleague.id)]},
                ],
            },
            format="json",
        )
        data = admin_client.get(c(workspace, "flows/")).data
        (flow,) = data["flows"]
        assert flow["current_stage"] == "Build" and flow["finished"] is False and flow["pending_stages"] == 1
        assert flow["people_without_tasks"] == [member.display_name] and flow["percent"] is None
        assert data["stale_after_hours"] == 48 and data["stale_handoffs"] == []

    def test_old_unopened_handoffs_are_listed(self, admin_client, member_client, workspace, member, colleague, project):
        dev = make_team(workspace, "Dev", members=[member])
        qa = make_team(workspace, "QA", members=[colleague])
        from plane.team_ops.services.hub import channel_for_project, post_message

        message = post_message(
            channel=channel_for_project(workspace, project),
            author=member,
            body="please test",
            team_ids=[qa.id],
        )
        assert admin_client.get(c(workspace, "flows/")).data["stale_handoffs"] == []
        HubMessage.objects.filter(pk=message.pk).update(created_at=timezone.now() - timedelta(hours=60))
        from plane.team_ops.models import HubMention

        HubMention.objects.filter(message=message).update(created_at=timezone.now() - timedelta(hours=60))
        stale = admin_client.get(c(workspace, "flows/")).data["stale_handoffs"]
        assert len(stale) == 1 and stale[0]["to_team"]["name"] == "QA" and dev.name == "Dev"
