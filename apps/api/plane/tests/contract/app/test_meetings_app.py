# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Meetings through both APIs: fields, kinds, participants, notifications and the calendar."""

import json
from datetime import timedelta
from unittest import mock
from urllib.parse import urlencode

import pytest
from django.db import connection
from django.template.loader import render_to_string
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APIClient

from plane.app.serializers import IssueDetailSerializer
from plane.bgtasks.deletion_task import soft_delete_related_objects
from plane.bgtasks.email_notification_task import format_meeting_time
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.issue_automation_task import close_old_issues
from plane.bgtasks.notification_task import notifications
from plane.db.models import (
    Cycle,
    CycleIssue,
    EmailNotificationLog,
    Issue,
    IssueActivity,
    IssueRelation,
    IssueSubscriber,
    MeetingDetail,
    MeetingParticipant,
    Module,
    Notification,
    Project,
    ProductType,
    ProjectMember,
    State,
    User,
    UserNotificationPreference,
    Workspace,
    WorkspaceMember,
)
from plane.utils.work_item_types import get_product_work_item_type

ADMIN, MEMBER, GUEST = 20, 15, 5
START, END = "2026-12-01T23:30:00+03:00", "2026-12-02T00:30:00+03:00"


@pytest.fixture(autouse=True)
def _no_celery(mock_celery):
    yield


def make_user(workspace, name, role=MEMBER):
    user = User.objects.create(email=f"{name}@plane.so", username=name, first_name=name, display_name=name)
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
    UserNotificationPreference.objects.get_or_create(user=user)
    return user


@pytest.fixture
def s(db, workspace, create_user):
    class S:
        pass

    s = S()
    workspace.is_team_structure_enabled = True
    workspace.save()
    s.ws, s.root = workspace, create_user
    UserNotificationPreference.objects.get_or_create(user=create_user)
    s.member, s.second, s.outsider = (make_user(workspace, name) for name in ("member", "second", "outsider"))
    s.guest = make_user(workspace, "guest", GUEST)
    s.project = Project.objects.create(name="One", identifier="ONE", workspace=workspace)
    for user, role in ((s.root, ADMIN), (s.member, MEMBER), (s.second, MEMBER), (s.guest, GUEST)):
        ProjectMember.objects.create(project=s.project, workspace=workspace, member=user, role=role)
    s.states = {
        group: State.objects.create(
            project=s.project, workspace=workspace, name=group, group=group, color="#fff", default=group == "backlog"
        )
        for group in ("backlog", "cancelled")
    }
    s.url = f"/api/workspaces/{workspace.slug}/projects/{s.project.id}"
    s.v1 = f"/api/v1/workspaces/{workspace.slug}/projects/{s.project.id}"
    s.body = {"name": "Meet", "kind": "meeting", "meeting": {"start_at": START, "end_at": END}}
    return s


def call(user, method, url, data=None):
    client = APIClient()
    client.force_authenticate(user=user)
    return getattr(client, method)(url, data, format="json")


def create(s, user=None, name="Meet", parent=None, **meeting):
    body = {**s.body, "name": name, "meeting": {**s.body["meeting"], **meeting}}
    if parent is not None:
        body["parent_id"] = str(parent.id)
    response = call(user or s.member, "post", f"{s.url}/issues/", body)
    assert response.status_code == 201, response.data
    return Issue.objects.get(pk=response.data["id"])


def task(s, parent=None, **fields):
    return Issue.objects.create(
        project=s.project, workspace=s.ws, name="Task", parent=parent, state=s.states["backlog"], **fields
    )


def product(s):
    return task(s, type=get_product_work_item_type(s.ws.id))


def patch(s, issue, data, user=None):
    return call(user or s.member, "patch", f"{s.url}/issues/{issue.id}/", data)


def participants(issue):
    return set(MeetingParticipant.objects.filter(issue=issue).values_list("member_id", flat=True))


@pytest.mark.contract
@pytest.mark.django_db
class TestFields:
    def test_created_in_utc_with_the_author_as_organizer(self, s):
        response = call(s.member, "post", f"{s.url}/issues/", s.body)
        assert response.status_code == 201, response.data
        assert response.data["kind"] == "meeting"
        meeting = call(s.member, "get", f"{s.url}/issues/{response.data['id']}/").data
        assert meeting["meeting"]["organizer_id"] == str(s.member.id)
        assert meeting["start_date"] is None and meeting["target_date"] is None
        detail = MeetingDetail.objects.get(issue_id=response.data["id"])
        assert detail.start_at.isoformat() == "2026-12-01T20:30:00+00:00"

    @pytest.mark.parametrize(
        "meeting",
        [
            {},
            {"start_at": START},
            {"end_at": END},
            {"start_at": END, "end_at": START},
            {"start_at": START, "end_at": START},
            {"start_at": "2026-12-01T23:30:00", "end_at": END},
            {"start_at": START, "end_at": None},
        ],
    )
    @pytest.mark.parametrize("path", ["url/issues", "v1/work-items"])
    def test_time_is_required(self, s, meeting, path):
        base, end = path.split("/")
        response = call(s.member, "post", f"{getattr(s, base)}/{end}/", {**s.body, "meeting": meeting})
        assert response.status_code == 400
        assert not Issue.objects.exists()

    def test_public_api(self, s):
        response = call(s.member, "post", f"{s.v1}/work-items/", s.body)
        assert response.status_code == 201, response.data
        assert response.data["kind"] == "meeting"
        listed = call(s.member, "get", f"{s.v1}/work-items/").data["results"][0]
        assert listed["meeting"]["organizer_id"] == str(s.member.id)

    def test_rejected_fields(self, s):
        for extra in ({"target_date": "2026-12-01"}, {"start_date": "2026-12-01"}, {"product": {"manual_progress": 1}}):
            assert call(s.member, "post", f"{s.url}/issues/", {**s.body, **extra}).status_code == 400, extra
        meeting = create(s)
        assert patch(s, meeting, {"target_date": "2026-12-01"}).status_code == 400
        assert patch(s, task(s), {"meeting": {"location": "x"}}).status_code == 400

    def test_partial_update_is_checked_against_the_stored_time(self, s):
        meeting = create(s)
        assert patch(s, meeting, {"meeting": {"end_at": START}}).status_code == 400
        assert patch(s, meeting, {"meeting": {"location": "Room"}}).status_code == 204
        assert patch(s, meeting, {"type": None}).status_code == 204
        meeting.refresh_from_db()
        assert meeting.type.kind == "meeting"

    def test_outcome_is_sanitized(self, s):
        meeting = create(s)
        patch(s, meeting, {"meeting": {"outcome_html": "<p>a</p><script>b</script>"}})
        assert "<script" not in MeetingDetail.objects.get(issue=meeting).outcome_html

    def test_people(self, s):
        for field, value in (
            ("organizer_id", str(s.outsider.id)),
            ("organizer_id", str(s.guest.id)),
            ("participant_ids", [str(s.outsider.id)]),
            ("participant_ids", [str(s.guest.id)]),
        ):
            body = {**s.body, "meeting": {**s.body["meeting"], field: value}}
            assert call(s.member, "post", f"{s.url}/issues/", body).status_code == 400, field
        # A guest who sees everything in the project may take part.
        Project.objects.filter(pk=s.project.pk).update(guest_view_all_features=True)
        assert participants(create(s, participant_ids=[str(s.guest.id)])) == {s.guest.id}

    def test_who_left_may_stay(self, s):
        meeting = create(s, participant_ids=[str(s.second.id)])
        ProjectMember.objects.filter(member=s.second).update(is_active=False)
        ids = [str(s.second.id), str(s.root.id)]
        assert patch(s, meeting, {"meeting": {"participant_ids": ids}}).status_code == 204
        assert participants(meeting) == {s.second.id, s.root.id}

    def test_flag_and_guest(self, s):
        assert call(s.guest, "post", f"{s.url}/issues/", s.body).status_code == 403
        Workspace.objects.filter(pk=s.ws.pk).update(is_team_structure_enabled=False)
        assert call(s.member, "post", f"{s.url}/issues/", s.body).status_code == 400


@pytest.mark.contract
@pytest.mark.django_db
class TestKinds:
    def test_parent(self, s):
        owner = product(s)
        meeting = create(s, parent=owner)
        assert meeting.parent_id == owner.id
        plain = task(s)
        body = {**s.body, "parent_id": str(plain.id)}
        assert call(s.member, "post", f"{s.url}/issues/", body).status_code == 400
        assert patch(s, meeting, {"parent_id": str(plain.id)}).status_code == 400
        assert patch(s, plain, {"parent_id": str(meeting.id)}).status_code == 400

        def link(parent, child):
            url = f"{s.url}/issues/{parent.id}/sub-issues/"
            return call(s.member, "post", url, {"sub_issue_ids": [str(child.id)]}).status_code

        assert link(meeting, plain) == 400
        assert link(plain, meeting) == 400
        assert link(owner, create(s)) == 200

    def test_conversion_keeps_the_dates_of_the_task(self, s):
        issue = task(s, start_date="2026-01-01", target_date="2026-01-02")
        assert patch(s, issue, {"kind": "meeting"}).status_code == 400
        assert patch(s, issue, {"kind": "meeting", "meeting": s.body["meeting"]}).status_code == 204
        issue.refresh_from_db()
        assert issue.start_date is None and issue.target_date is None
        assert patch(s, issue, {"kind": "product"}).status_code == 400
        assert patch(s, issue, {"kind": "task"}).status_code == 204
        issue.refresh_from_db()
        assert str(issue.start_date) == "2026-01-01" and str(issue.target_date) == "2026-01-02"
        # The kept time is enough to become a meeting again.
        assert patch(s, issue, {"kind": "meeting"}).status_code == 204

    def test_conversion_refused(self, s):
        parent = task(s)
        child = task(s, parent)
        in_cycle = task(s)
        cycle = Cycle.objects.create(project=s.project, workspace=s.ws, name="C", owned_by=s.root)
        CycleIssue.objects.create(issue=in_cycle, cycle=cycle, project=s.project, workspace=s.ws)
        for issue in (parent, child, in_cycle):
            response = patch(s, issue, {"kind": "meeting", "meeting": s.body["meeting"]})
            assert response.status_code == 400

    def test_deleting_the_product_keeps_the_meeting(self, s):
        owner = product(s)
        meeting = create(s, parent=owner)
        call(s.root, "delete", f"{s.url}/issues/{owner.id}/")
        soft_delete_related_objects("db", "issue", owner.pk)
        meeting = Issue.all_objects.get(pk=meeting.pk)
        assert meeting.deleted_at is None and meeting.parent_id is None

    def test_meetings_are_not_progress(self, s):
        get_product_work_item_type(s.ws.id)
        kind = ProductType.objects.filter(workspace=s.ws).first()
        body = {
            "name": "P",
            "kind": "product",
            "start_date": "2026-12-01",
            "target_date": "2026-12-31",
            "product": {"product_type_id": str(kind.id), "owner_id": str(s.member.id)},
        }
        owner = Issue.objects.get(pk=call(s.member, "post", f"{s.url}/issues/", body).data["id"])
        create(s, parent=owner)
        assert call(s.member, "get", f"{s.url}/issues/{owner.id}/").data["product"]["total_tasks"] == 0

    def test_excluded_places(self, s):
        meeting = create(s)
        ids = {"issues": [str(meeting.id)]}
        cycle = Cycle.objects.create(project=s.project, workspace=s.ws, name="C", owned_by=s.root)
        module = Module.objects.create(project=s.project, workspace=s.ws, name="M")
        for url in (
            f"{s.url}/cycles/{cycle.id}/cycle-issues/",
            f"{s.url}/modules/{module.id}/issues/",
            f"{s.v1}/cycles/{cycle.id}/cycle-issues/",
            f"{s.v1}/modules/{module.id}/module-issues/",
        ):
            assert call(s.root, "post", url, ids).status_code == 400, url
        dates = {"updates": [{"id": str(meeting.id), "target_date": "2026-12-05"}]}
        call(s.member, "post", f"{s.url}/issue-dates/", dates)
        meeting.refresh_from_db()
        assert meeting.target_date is None

    def test_automation_waits_for_the_meeting(self, s):
        ahead, past = create(s), create(s, name="Past")
        now = timezone.now()
        MeetingDetail.objects.filter(issue=ahead).update(
            start_at=now + timedelta(days=1), end_at=now + timedelta(days=2)
        )
        MeetingDetail.objects.filter(issue=past).update(
            start_at=now - timedelta(days=90), end_at=now - timedelta(days=89)
        )
        Project.objects.filter(pk=s.project.pk).update(close_in=1, default_state=s.states["cancelled"])
        Issue.objects.update(updated_at=now - timedelta(days=100))
        with mock.patch("plane.bgtasks.issue_automation_task.issue_activity"):
            close_old_issues()
        assert Issue.objects.get(pk=ahead.pk).state_id == s.states["backlog"].id
        assert Issue.objects.get(pk=past.pk).state_id == s.states["cancelled"].id

    def test_filter_and_group(self, s):
        meeting, plain = create(s), task(s)

        def get(query):
            return call(s.member, "get", f"{s.url}/issues/?{urlencode(query)}").data["results"]

        assert [str(row["id"]) for row in get({"filters": json.dumps({"kind__in": "meeting"})})] == [str(meeting.id)]
        assert [str(row["id"]) for row in get({"filters": json.dumps({"kind__in": "task"})})] == [str(plain.id)]
        grouped = get({"group_by": "type__kind"})
        assert grouped["meeting"]["total_results"] == 1 and grouped["None"]["total_results"] == 1

    def test_search_for_a_product(self, s):
        owner, meeting = product(s), create(s)
        url = f"{s.url}/search-issues/?parent=true&issue_id={meeting.id}&workspace_search=false"
        assert [row["id"] for row in call(s.member, "get", url).data] == [owner.id]


@pytest.mark.contract
@pytest.mark.django_db
class TestNotifications:
    def run(self, s, issue, data, before, actor=None, kind="updated"):
        """The activity and the notification tasks as celery runs them after a request."""
        sent = []
        target = "plane.bgtasks.issue_activities_task.notifications.delay"
        with mock.patch(target, side_effect=lambda **kwargs: sent.append(kwargs)):
            issue_activity(
                type=f"issue.activity.{kind}",
                requested_data=json.dumps(data),
                current_instance=before,
                issue_id=str(issue.id),
                actor_id=str((actor or s.member).id),
                project_id=str(s.project.id),
                epoch=1,
                notification=True,
            )
        for kwargs in sent:
            notifications(**kwargs)

    def snapshot(self, issue):
        from django.core.serializers.json import DjangoJSONEncoder

        issue = Issue.objects.get(pk=issue.pk)
        issue.label_ids, issue.assignee_ids, issue.module_ids, issue.cycle_id = [], [], [], None
        return json.dumps(IssueDetailSerializer(issue).data, cls=DjangoJSONEncoder)

    def received(self, user):
        return [row.data["issue_activity"]["field"] for row in Notification.objects.filter(receiver=user)]

    def test_invited_on_creation(self, s):
        meeting = create(s, participant_ids=[str(s.second.id), str(s.root.id), str(s.member.id)])
        self.run(
            s,
            meeting,
            {"meeting": {"participant_ids": [str(u.id) for u in (s.second, s.root, s.member)]}},
            None,
            kind="created",
        )
        # Everyone hears about their own invitation only, the author about none.
        assert self.received(s.second) == ["participants"]
        assert self.received(s.root) == ["participants"]
        assert self.received(s.member) == []
        assert EmailNotificationLog.objects.filter(receiver=s.second).exists()

    def test_invited_later(self, s):
        meeting = create(s, participant_ids=[str(s.second.id)])
        before = self.snapshot(meeting)
        data = {"meeting": {"participant_ids": [str(s.second.id), str(s.root.id)]}}
        assert patch(s, meeting, data).status_code == 204
        self.run(s, meeting, data, before)
        assert self.received(s.root) == ["participants"]
        assert self.received(s.second) == []

    def test_rescheduled_once(self, s):
        meeting = create(s, participant_ids=[str(s.second.id)])
        before = self.snapshot(meeting)
        data = {"meeting": {"start_at": "2026-12-02T10:00:00Z", "end_at": "2026-12-02T11:00:00Z"}}
        assert patch(s, meeting, data).status_code == 204
        self.run(s, meeting, data, before)
        assert self.received(s.second) == ["meeting_time"]
        entry = IssueActivity.objects.get(issue=meeting, field="meeting_time")
        assert entry.old_value == "2026-12-01T20:30:00+00:00/2026-12-01T21:30:00+00:00"

    def test_same_time_in_another_zone_is_no_change(self, s):
        meeting = create(s)
        before = self.snapshot(meeting)
        self.run(s, meeting, {"meeting": {"start_at": "2026-12-01T20:30:00Z", "end_at": END}}, before)
        assert not IssueActivity.objects.filter(field="meeting_time").exists()

    def test_cancelled(self, s):
        meeting = create(s, participant_ids=[str(s.second.id)])
        before = self.snapshot(meeting)
        data = {"state_id": str(s.states["cancelled"].id)}
        assert patch(s, meeting, data).status_code == 204
        self.run(s, meeting, data, before)
        assert self.received(s.second) == ["state"]

    def test_removed_participant_stops_following(self, s):
        meeting = create(s, participant_ids=[str(s.second.id)])
        assert IssueSubscriber.objects.filter(issue=meeting, subscriber=s.second).exists()
        patch(s, meeting, {"meeting": {"participant_ids": []}})
        assert not IssueSubscriber.objects.filter(issue=meeting, subscriber=s.second).exists()
        # And follows again after a new invitation.
        patch(s, meeting, {"meeting": {"participant_ids": [str(s.second.id)]}})
        assert IssueSubscriber.objects.filter(issue=meeting, subscriber=s.second).exists()

    def test_organizer_keeps_following(self, s):
        meeting = create(s, organizer_id=str(s.second.id), participant_ids=[str(s.second.id)])
        patch(s, meeting, {"meeting": {"participant_ids": []}})
        assert IssueSubscriber.objects.filter(issue=meeting, subscriber=s.second).exists()

    def test_former_member_gets_nothing(self, s):
        meeting = create(s, participant_ids=[str(s.second.id)])
        ProjectMember.objects.filter(member=s.second).update(is_active=False)
        before = self.snapshot(meeting)
        self.run(s, meeting, {"state_id": str(s.states["cancelled"].id)}, before)
        assert self.received(s.second) == []

    def test_email_shows_the_time_of_the_reader(self, s):
        value = "2026-12-01T20:30:00+00:00/2026-12-01T21:30:00+00:00"
        moscow = format_meeting_time(value, "Europe/Moscow")
        assert moscow == "2026-12-01 23:30 – 2026-12-02 00:30 (Europe/Moscow)"
        assert format_meeting_time(value, "Nowhere") == "2026-12-01 20:30 – 21:30 (UTC)"
        assert format_meeting_time("None", "UTC") == "None"
        changes = {"meeting_time": {"new_value": [moscow]}, "participants": {"new_value": ["second"]}}
        html = render_to_string(
            "emails/notifications/issue-updates.html",
            {"data": [{"changes": changes, "actor_detail": {}}], "actors_involved": 1, "issue": {}, "comments": []},
        )
        assert moscow in html and "You are invited" in html


@pytest.mark.contract
@pytest.mark.django_db
class TestCalendar:
    def get(self, s, user, start, end):
        query = urlencode({"from": start, "to": end})
        return call(user, "get", f"{s.url}/meetings/?{query}")

    def test_period(self, s):
        meeting = create(s)
        inside = self.get(s, s.member, "2026-12-01T00:00:00Z", "2026-12-02T00:00:00Z")
        assert [row["id"] for row in inside.data] == [meeting.id]
        # Touching the period is not overlapping.
        assert self.get(s, s.member, "2026-12-01T21:30:00Z", "2026-12-02T00:00:00Z").data == []
        assert len(self.get(s, s.member, "2026-12-01T21:29:00Z", "2026-12-02T00:00:00Z").data) == 1
        for start, end in (
            ("2026-12-01T00:00:00Z", "2027-12-01T00:00:00Z"),
            ("2026-12-02T00:00:00Z", "2026-12-01T00:00:00Z"),
            ("2026-12-01", "2026-12-02"),
            ("x", "2026-99-99T00:00:00Z"),
            ("", ""),
        ):
            assert self.get(s, s.member, start, end).status_code == 400

    def test_who_sees(self, s):
        create(s)
        period = ("2026-12-01T00:00:00Z", "2026-12-02T00:00:00Z")
        assert self.get(s, s.guest, *period).data == []
        assert self.get(s, s.outsider, *period).status_code == 403
        Project.objects.filter(pk=s.project.pk).update(guest_view_all_features=True)
        assert len(self.get(s, s.guest, *period).data) == 1

    def test_query_count(self, s):
        create(s)
        period = ("2026-12-01T00:00:00Z", "2026-12-02T00:00:00Z")
        with CaptureQueriesContext(connection) as first:
            self.get(s, s.member, *period)
        for index in range(3):
            create(s, name=f"M{index}", participant_ids=[str(s.second.id)])
        with CaptureQueriesContext(connection) as second:
            assert len(self.get(s, s.member, *period).data) == 4
        assert len(second) <= len(first)

    def test_task_from_meeting(self, s):
        owner = product(s)
        meeting = create(s, parent=owner)
        url = f"{s.url}/issues/{meeting.id}/create-task/"
        response = call(s.member, "post", url, {"name": "Do it"})
        assert response.status_code == 201, response.data
        created = Issue.objects.get(pk=response.data["id"])
        assert created.parent_id == owner.id and created.type_id is None
        assert IssueRelation.objects.filter(issue=meeting, related_issue=created, relation_type="relates_to").exists()
        assert call(s.member, "post", url, {"name": " "}).status_code == 400
        assert call(s.guest, "post", url, {"name": "No"}).status_code == 403
        assert call(s.member, "post", f"{s.url}/issues/{created.id}/create-task/", {"name": "No"}).status_code == 404
