# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# ruff: noqa: F401, F811
"""Workday: how the day is worked, hybrid places, rest pauses, check-ins and freezes."""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Issue
from plane.team_ops.models import (
    ActiveTimer,
    CalendarEntry,
    OpsNotification,
    WorkDay,
    WorkInterruption,
    WorkSession,
)
from plane.team_ops.services.workday import week_start_of
from plane.team_ops.services.workday import freeze_unanswered_timers
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
def project(workspace, admin, member):
    return make_project(workspace, admin, "WD", members=[member])


@pytest.fixture
def issue(workspace, project):
    return Issue.objects.create(name="Fix login", project=project, workspace=workspace)


def plan_week(workspace, user, skip=()):
    """Plan every day of this week (Saturday to Friday) for `user`, except the dates in `skip`."""
    start = week_start_of(timezone.now().date())
    for offset in range(7):
        day = start + timedelta(days=offset)
        if day not in skip:
            CalendarEntry.objects.get_or_create(
                workspace=workspace, user=user, work_date=day, defaults={"work_mode": "REMOTE"}
            )


@pytest.fixture(autouse=True)
def planned_week(workspace, member, admin):
    for user in (member, admin):
        plan_week(workspace, user)


def w(workspace, path=""):
    return url(workspace, f"workday/{path}")


def start(client, workspace, issue, **extra):
    return client.post(w(workspace, "start/"), {"issue": str(issue.id), **extra}, format="json")


def set_mode(client, workspace, mode):
    return client.post(w(workspace, "day/"), {"mode": mode}, format="json")


def age(timer_filter, minutes, confirmed=False):
    """Pretend the timer started, and was last confirmed, `minutes` ago (or that the person kept confirming)."""
    then = timezone.now() - timedelta(minutes=minutes)
    ActiveTimer.objects.filter(**timer_filter).update(
        started_at=then, last_confirmed_at=timezone.now() if confirmed else then
    )


def finish(client, workspace, summary="Done"):
    return client.post(
        url(workspace, "work-sessions/finish/"), {"summary": summary, "no_document": "true"}, format="multipart"
    )


@pytest.mark.contract
class TestDayMode:
    def test_state_starts_without_an_answer(self, member_client, workspace):
        data = member_client.get(w(workspace)).data
        assert data["day"] is None and data["timer"] is None

    def test_cannot_start_before_answering(self, member_client, workspace, issue):
        response = start(member_client, workspace, issue)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not ActiveTimer.objects.exists()

    @pytest.mark.parametrize("mode", ["REMOTE", "ONSITE", "HYBRID"])
    def test_modes_are_saved_and_can_change(self, member_client, workspace, mode):
        assert set_mode(member_client, workspace, mode).data["day"]["mode"] == mode

    def test_unknown_mode(self, member_client, workspace):
        assert set_mode(member_client, workspace, "MOON").status_code == status.HTTP_400_BAD_REQUEST

    def test_the_timer_takes_the_place_from_the_day(self, member_client, workspace, issue):
        set_mode(member_client, workspace, "ONSITE")
        response = start(member_client, workspace, issue)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["timer"]["location"] == "ONSITE"
        assert response.data["timer"]["work_item"] == "WD-1"
        assert response.data["day"]["mode"] == "ONSITE"

    def test_a_task_in_the_other_place_makes_the_day_hybrid(self, member_client, workspace, issue):
        set_mode(member_client, workspace, "ONSITE")
        response = start(member_client, workspace, issue, location="REMOTE")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["timer"]["location"] == "REMOTE"
        assert response.data["day"]["mode"] == "HYBRID"

    def test_the_same_place_keeps_the_day_as_it_is(self, member_client, workspace, issue):
        set_mode(member_client, workspace, "REMOTE")
        assert start(member_client, workspace, issue, location="REMOTE").data["day"]["mode"] == "REMOTE"

    def test_a_hybrid_day_still_needs_a_place_for_each_task(self, member_client, workspace, issue):
        set_mode(member_client, workspace, "HYBRID")
        assert start(member_client, workspace, issue).status_code == status.HTTP_400_BAD_REQUEST
        assert start(member_client, workspace, issue, location="home").status_code == status.HTTP_400_BAD_REQUEST
        assert start(member_client, workspace, issue, location="REMOTE").data["timer"]["location"] == "REMOTE"

    def test_an_unknown_place_is_refused(self, member_client, workspace, issue):
        set_mode(member_client, workspace, "REMOTE")
        assert start(member_client, workspace, issue, location="moon").status_code == status.HTTP_400_BAD_REQUEST
        assert WorkDay.objects.get().mode == "REMOTE"

    def test_one_timer_at_a_time(self, member_client, workspace, issue):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        assert start(member_client, workspace, issue).status_code == status.HTTP_409_CONFLICT

    def test_only_work_items_of_your_projects(self, member_client, workspace, admin, issue):
        set_mode(member_client, workspace, "REMOTE")
        secret = Issue.objects.create(name="Secret", project=make_project(workspace, admin, "SEC"), workspace=workspace)
        assert start(member_client, workspace, secret).status_code == status.HTTP_400_BAD_REQUEST

    def test_guests_have_no_workday(self, guest_client, workspace):
        assert guest_client.get(w(workspace)).status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestRestPause:
    def test_a_break_is_not_worked_time(self, member_client, workspace, member, issue):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        age({"user": member}, 60, confirmed=True)
        member_client.post(w(workspace, "break/"), {"action": "start"}, format="json")
        assert member_client.get(w(workspace)).data["timer"]["state"] == "BREAK"
        began = timezone.now() - timedelta(minutes=20)  # the break began 20 minutes ago
        ActiveTimer.objects.update(paused_at=began)
        WorkInterruption.objects.update(started_at=began)
        response = member_client.post(w(workspace, "break/"), {"action": "end"}, format="json")
        timer = response.data["timer"]
        assert timer["state"] == "RUNNING"
        assert 39 * 60 <= timer["worked_seconds"] <= 41 * 60
        assert response.data["totals"]["break_seconds"] >= 19 * 60

    def test_no_check_in_falls_due_during_a_break(self, member_client, workspace, member, issue):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        age({"user": member}, 120)
        ActiveTimer.objects.update(state="BREAK", paused_at=timezone.now() - timedelta(minutes=100))
        assert member_client.get(w(workspace)).data["timer"]["state"] == "BREAK"

    def test_cannot_break_twice_or_end_without_a_break(self, member_client, workspace, issue):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        assert member_client.post(w(workspace, "break/"), {"action": "end"}, format="json").status_code == 400
        member_client.post(w(workspace, "break/"), {"action": "start"}, format="json")
        assert member_client.post(w(workspace, "break/"), {"action": "start"}, format="json").status_code == 400
        assert member_client.post(w(workspace, "break/"), {"action": "nap"}, format="json").status_code == 400


@pytest.mark.contract
class TestCheckIn:
    def test_a_timely_check_in_keeps_the_time(self, member_client, workspace, member, issue):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        age({"user": member}, 31)  # due, but inside the grace period
        assert member_client.get(w(workspace)).data["timer"]["state"] == "RUNNING"
        response = member_client.post(w(workspace, "check-in/"), format="json")
        assert response.data["timer"]["state"] == "RUNNING"
        assert response.data["timer"]["worked_seconds"] >= 30 * 60
        assert not WorkInterruption.objects.exists()

    def test_a_missed_check_in_freezes_from_when_it_fell_due(self, member_client, workspace, member, issue, admin):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        age({"user": member}, 50)
        timer = member_client.get(w(workspace)).data["timer"]
        assert timer["state"] == "FROZEN"
        # 50 minutes passed, but the time counted stops at the 30 minute mark
        assert 29 * 60 <= timer["worked_seconds"] <= 31 * 60
        freeze = WorkInterruption.objects.get()
        assert freeze.kind == "FREEZE" and freeze.ended_at is None
        assert OpsNotification.objects.filter(user=admin, kind="FREEZE").count() == 1

    def test_the_team_lead_is_told_too(self, member_client, workspace, member, lead, issue):
        make_team(workspace, "Dev", leads=[lead], members=[member])
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        age({"user": member}, 50)
        member_client.get(w(workspace))
        assert OpsNotification.objects.filter(user=lead, kind="FREEZE").exists()

    def test_the_manager_is_told_once(self, member_client, workspace, member, issue, admin):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        age({"user": member}, 50)
        for _ in range(3):
            member_client.get(w(workspace))
        assert OpsNotification.objects.filter(user=admin, kind="FREEZE").count() == 1

    def test_checking_in_ends_the_freeze_and_time_counts_again(self, member_client, workspace, member, issue):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        age({"user": member}, 50)
        member_client.get(w(workspace))
        response = member_client.post(w(workspace, "check-in/"), format="json")
        assert response.data["timer"]["state"] == "RUNNING"
        assert response.data["totals"]["frozen_seconds"] >= 19 * 60
        assert WorkInterruption.objects.get().ended_at is not None

    def test_the_freeze_is_recorded_in_the_finished_work(self, member_client, workspace, member, issue):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        age({"user": member}, 50)
        member_client.get(w(workspace))
        member_client.post(w(workspace, "check-in/"), format="json")
        response = finish(member_client, workspace)
        session = response.data["session"]
        assert response.status_code == status.HTTP_201_CREATED
        assert 19 * 60 <= session["frozen_seconds"] <= 21 * 60
        assert 29 * 60 <= session["duration_seconds"] <= 31 * 60  # 50 minutes minus the 20 frozen
        assert session["location"] == "REMOTE"
        assert WorkInterruption.objects.get().session_id == WorkSession.objects.get().id

    def test_finishing_while_frozen_does_not_count_the_freeze(self, member_client, workspace, member, issue):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        age({"user": member}, 90)
        session = finish(member_client, workspace).data["session"]
        assert 29 * 60 <= session["duration_seconds"] <= 31 * 60
        assert session["frozen_seconds"] >= 59 * 60

    def test_the_background_job_freezes_without_anyone_looking(self, workspace, member, issue, admin):
        then = timezone.now() - timedelta(minutes=60)
        ActiveTimer.objects.create(
            workspace=workspace, user=member, issue=issue, started_at=then, last_confirmed_at=then, location="REMOTE"
        )
        assert freeze_unanswered_timers() == 1
        assert ActiveTimer.objects.get().state == "FROZEN"
        assert freeze_unanswered_timers() == 0  # already frozen
        assert OpsNotification.objects.filter(user=admin).count() == 1

    def test_cannot_check_in_without_a_timer_or_on_a_break(self, member_client, workspace, issue):
        assert member_client.post(w(workspace, "check-in/"), format="json").status_code == 400
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        member_client.post(w(workspace, "break/"), {"action": "start"}, format="json")
        assert member_client.post(w(workspace, "check-in/"), format="json").status_code == 400


@pytest.mark.contract
class TestHybridHours:
    def test_hours_are_split_by_place(self, member_client, workspace, member, issue):
        set_mode(member_client, workspace, "HYBRID")
        start(member_client, workspace, issue, location="ONSITE")
        age({"user": member}, 20)
        finish(member_client, workspace, "A")
        start(member_client, workspace, issue, location="REMOTE")
        age({"user": member}, 10)
        finish(member_client, workspace, "B")
        totals = member_client.get(w(workspace)).data["totals"]
        assert 19 * 60 <= totals["onsite_seconds"] <= 21 * 60
        assert 9 * 60 <= totals["remote_seconds"] <= 11 * 60


@pytest.mark.contract
class TestMonitoringAndNotifications:
    def test_managers_see_who_is_doing_what(self, admin_client, member_client, workspace, member, issue):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        age({"user": member}, 50)
        rows = {r["user"]["id"]: r for r in admin_client.get(w(workspace, "team/")).data["results"]}
        row = rows[member.id]
        assert row["state"] == "FROZEN" and row["mode"] == "REMOTE" and row["work_item"] == "WD-1"

    def test_plain_members_cannot_watch_the_team(self, member_client, workspace):
        assert member_client.get(w(workspace, "team/")).status_code == status.HTTP_403_FORBIDDEN

    def test_notifications_list_and_read(self, admin_client, member_client, workspace, member, issue, admin):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        age({"user": member}, 50)
        member_client.get(w(workspace))
        listing = admin_client.get(url(workspace, "notifications/")).data
        assert listing["unread"] == 1 and listing["results"][0]["kind"] == "FREEZE"
        assert member_client.get(url(workspace, "notifications/")).data["unread"] == 0  # only your own
        admin_client.post(url(workspace, "notifications/"), {}, format="json")
        assert admin_client.get(url(workspace, "notifications/")).data["unread"] == 0

    def test_tagging_notifies(self, member_client, workspace, member, admin, project):
        from plane.team_ops.models import HubChannel

        member_client.get(url(workspace, "hub/channels/"))
        channel = HubChannel.objects.get(workspace=workspace, project=project)
        member_client.post(
            url(workspace, f"hub/channels/{channel.id}/messages/"),
            {"body": "look", "users": [str(admin.id)]},
            format="json",
        )
        note = OpsNotification.objects.get(user=admin)
        assert note.kind == "MENTION" and str(channel.id) in note.link


@pytest.mark.contract
class TestWeekPlanGate:
    def test_the_state_shows_the_week_from_saturday(self, member_client, workspace):
        week = member_client.get(w(workspace)).data["week"]
        assert len(week["days"]) == 7 and week["days"][0]["date"].isoweekday() == 6  # Saturday
        assert week["complete"] is True and week["missing"] == []

    def test_starting_needs_the_rest_of_the_week_planned(self, member_client, workspace, member, issue):
        today = timezone.now().date()
        CalendarEntry.objects.filter(user=member).delete()
        set_mode(member_client, workspace, "REMOTE")
        state = member_client.get(w(workspace)).data
        needed = [d["date"] for d in state["week"]["days"] if d["expected"] and not d["past"]]
        assert state["week"]["complete"] is (not needed)
        if needed:
            assert start(member_client, workspace, issue).status_code == status.HTTP_400_BAD_REQUEST
            assert not ActiveTimer.objects.exists()
            for day in needed:
                CalendarEntry.objects.create(workspace=workspace, user=member, work_date=day, work_mode="OFF")
        assert start(member_client, workspace, issue).status_code == status.HTTP_201_CREATED
        assert today.isoweekday() >= 1

    def test_days_off_and_leave_count_as_planned(self, member_client, workspace, member, issue):
        CalendarEntry.objects.filter(user=member).update(work_mode="OFF")
        set_mode(member_client, workspace, "REMOTE")
        assert start(member_client, workspace, issue).status_code == status.HTTP_201_CREATED

    def test_non_working_days_need_no_plan(self, member_client, workspace, member):
        CalendarEntry.objects.filter(user=member).delete()
        days = member_client.get(w(workspace)).data["week"]["days"]
        assert all(d["expected"] == (d["date"].isoweekday() in (1, 2, 3, 4, 5)) for d in days)


@pytest.mark.contract
class TestHeatmapAndPeopleTags:
    def test_heatmap_counts_finished_work_per_day(
        self, member_client, admin_client, lead_client, workspace, member, issue
    ):
        for minutes in (30, 20):
            ActiveTimer.objects.create(
                workspace=workspace,
                user=member,
                issue=issue,
                started_at=timezone.now() - timedelta(minutes=minutes),
                last_confirmed_at=timezone.now(),
                location="REMOTE",
            )
            finish(member_client, workspace)
        data = member_client.get(url(workspace, "work-sessions/heatmap/")).data
        (day,) = data["days"]
        assert day["sessions"] == 2 and day["tasks"] == 1 and 49 * 60 <= day["seconds"] <= 51 * 60
        assert data["to"] == timezone.now().date() and (data["to"] - data["from"]).days == 364
        assert (
            len(admin_client.get(url(workspace, "work-sessions/heatmap/"), {"user": str(member.id)}).data["days"]) == 1
        )
        assert lead_client.get(url(workspace, "work-sessions/heatmap/"), {"user": str(member.id)}).status_code == 403

    def test_a_person_tagged_in_the_report_gets_it_privately_when_in_no_shared_channel(
        self, member_client, workspace, member, colleague, issue
    ):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        response = member_client.post(
            url(workspace, "work-sessions/finish/"),
            {
                "summary": "Done",
                "no_document": "true",
                "attention_message": "Please look",
                "attention_users": [str(colleague.id)],
            },
            format="multipart",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert OpsNotification.objects.filter(user=colleague, kind="DIRECT").count() == 1
        from plane.team_ops.models import HubChannel, HubMessage

        dm = HubChannel.objects.get(kind="DM")
        assert HubMessage.objects.get(channel=dm).kind == "ATTENTION"

    def test_an_unknown_person_cancels_the_finish(self, member_client, workspace, member, issue, guest):
        set_mode(member_client, workspace, "REMOTE")
        start(member_client, workspace, issue)
        response = member_client.post(
            url(workspace, "work-sessions/finish/"),
            {"summary": "Done", "no_document": "true", "attention_message": "x", "attention_users": [str(guest.id)]},
            format="multipart",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert ActiveTimer.objects.exists() and not WorkSession.objects.exists()
