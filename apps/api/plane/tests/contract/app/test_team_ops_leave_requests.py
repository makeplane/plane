# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# ruff: noqa: F401, F811
"""Team Ops leave requests: asking, deciding, and what approval writes into the calendar."""

from datetime import timedelta

import pytest
from rest_framework.test import APIClient

from plane.team_ops.models import CalendarAudit, CalendarEntry, CalendarHoliday, LeaveRequest
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
    make_team,
    member,
    member_client,
    next_monday,
    other_workspace,
    outsider,
    outsider_client,
    url,
    workspace,
)


def leave_url(workspace, path=""):
    return url(workspace, f"leave-requests/{path}")


def ask(client, workspace, start, end, **extra):
    body = {"start_date": str(start), "end_date": str(end), "leave_type": "ANNUAL", **extra}
    return client.post(leave_url(workspace), body, format="json")


def decide(client, workspace, leave_id, action, note=""):
    return client.post(leave_url(workspace, f"{leave_id}/"), {"action": action, "note": note}, format="json")


@pytest.mark.contract
class TestAskForLeave:
    @pytest.mark.django_db
    def test_a_member_asks_and_sees_their_request(self, member_client, workspace, member):
        monday = next_monday()

        created = ask(member_client, workspace, monday, monday + timedelta(days=4), note="Trip")

        assert created.status_code == 201 and created.data["status"] == "PENDING"
        mine = member_client.get(leave_url(workspace))
        assert [row["note"] for row in mine.data] == ["Trip"]
        assert not CalendarEntry.objects.exists()

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "start_offset, end_offset",
        [(4, 0), (5, 6), (0, 70)],
    )
    def test_invalid_periods_are_refused(self, member_client, workspace, start_offset, end_offset):
        monday = next_monday()
        # (5, 6) is a weekend: no working day; (4, 0) ends before it starts; (0, 70) is too long.
        assert (
            ask(
                member_client, workspace, monday + timedelta(days=start_offset), monday + timedelta(days=end_offset)
            ).status_code
            == 400
        )

    @pytest.mark.django_db
    def test_overlapping_requests_are_refused_but_cancelled_ones_do_not_count(self, member_client, workspace):
        monday = next_monday()
        first = ask(member_client, workspace, monday, monday + timedelta(days=2))

        assert ask(member_client, workspace, monday + timedelta(days=2), monday + timedelta(days=3)).status_code == 400
        assert decide(member_client, workspace, first.data["id"], "cancel").data["status"] == "CANCELLED"
        assert ask(member_client, workspace, monday + timedelta(days=2), monday + timedelta(days=3)).status_code == 201

    @pytest.mark.django_db
    def test_guests_outsiders_and_anonymous_cannot_ask(self, guest_client, outsider_client, workspace):
        monday = next_monday()
        assert ask(guest_client, workspace, monday, monday).status_code == 403
        assert ask(outsider_client, workspace, monday, monday).status_code == 403
        assert ask(APIClient(), workspace, monday, monday).status_code in (401, 403)


@pytest.mark.contract
class TestDecide:
    @pytest.mark.django_db
    def test_approval_writes_working_days_as_leave_and_audits_the_manager(
        self, admin_client, member_client, workspace, admin, member
    ):
        monday = next_monday()
        CalendarHoliday.objects.create(workspace=workspace, date=monday + timedelta(days=1), name="Day")
        leave = ask(member_client, workspace, monday, monday + timedelta(days=6), leave_type="SICK", note="Flu").data

        response = decide(admin_client, workspace, leave["id"], "approve", "Get well")

        assert response.status_code == 200 and response.data["status"] == "APPROVED"
        assert response.data["decided_by"] == admin.id
        days = CalendarEntry.objects.filter(user=member, work_mode="LEAVE").order_by("work_date")
        # Monday, Wednesday, Thursday, Friday: the holiday and the weekend are not taken.
        assert [d.work_date for d in days] == [monday + timedelta(days=n) for n in (0, 2, 3, 4)]
        assert {d.leave_type for d in days} == {"SICK"} and {d.description for d in days} == {"Flu"}
        audit = CalendarAudit.objects.filter(entity="ENTRY").first()
        assert audit.subject_user == member and audit.changed_by == admin

    @pytest.mark.django_db
    def test_rejection_changes_nothing_in_the_calendar(self, admin_client, member_client, workspace):
        monday = next_monday()
        leave = ask(member_client, workspace, monday, monday).data

        assert decide(admin_client, workspace, leave["id"], "reject", "Busy week").data["status"] == "REJECTED"
        assert not CalendarEntry.objects.exists()

    @pytest.mark.django_db
    def test_a_request_is_decided_only_once(self, admin_client, member_client, workspace):
        monday = next_monday()
        leave = ask(member_client, workspace, monday, monday).data
        decide(admin_client, workspace, leave["id"], "approve")

        assert decide(admin_client, workspace, leave["id"], "reject").status_code == 400
        assert decide(member_client, workspace, leave["id"], "cancel").status_code == 400

    @pytest.mark.django_db
    def test_a_lead_decides_for_their_team_only(self, lead_client, member_client, workspace, lead, member, colleague):
        make_team(workspace, "Platform", leads=[lead], members=[member])
        monday = next_monday()
        mine = ask(member_client, workspace, monday, monday).data
        other = ask(make_client(colleague), workspace, monday, monday).data

        assert decide(lead_client, workspace, other["id"], "approve").status_code == 403
        assert decide(lead_client, workspace, mine["id"], "approve").status_code == 200
        review = lead_client.get(leave_url(workspace, "?scope=review"))
        assert review.data == []

    @pytest.mark.django_db
    def test_members_cannot_decide_and_nobody_but_an_admin_decides_their_own(
        self, member_client, lead_client, admin_client, workspace, lead, member
    ):
        monday = next_monday()
        own = ask(member_client, workspace, monday, monday).data
        lead_own = ask(lead_client, workspace, monday + timedelta(days=7), monday + timedelta(days=7)).data
        admin_own = ask(admin_client, workspace, monday + timedelta(days=14), monday + timedelta(days=14)).data

        assert decide(member_client, workspace, own["id"], "approve").status_code == 403
        assert decide(lead_client, workspace, lead_own["id"], "approve").status_code == 403
        assert decide(admin_client, workspace, admin_own["id"], "approve").status_code == 200

    @pytest.mark.django_db
    def test_only_the_person_cancels_and_the_review_list_is_scoped(
        self, admin_client, member_client, colleague, workspace
    ):
        monday = next_monday()
        leave = ask(member_client, workspace, monday, monday).data

        assert decide(make_client(colleague), workspace, leave["id"], "cancel").status_code == 403
        assert decide(admin_client, workspace, leave["id"], "cancel").status_code == 403
        assert [row["id"] for row in admin_client.get(leave_url(workspace, "?scope=review")).data] == [leave["id"]]
        assert member_client.get(leave_url(workspace, "?scope=review")).data == []

    @pytest.mark.django_db
    def test_other_workspaces_are_closed(self, admin_client, other_workspace, workspace, member_client):
        monday = next_monday()
        leave = ask(member_client, workspace, monday, monday).data

        assert admin_client.get(leave_url(other_workspace)).status_code == 403
        assert decide(admin_client, other_workspace, leave["id"], "approve").status_code == 403
        assert decide(admin_client, workspace, "00000000-0000-0000-0000-000000000000", "approve").status_code == 404
