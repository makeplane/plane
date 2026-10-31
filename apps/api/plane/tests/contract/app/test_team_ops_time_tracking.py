# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Team Ops time tracking: time entries, summary and the running timer."""

from datetime import timedelta
from unittest import mock
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, Project, ProjectMember, User, Workspace, WorkspaceMember
from plane.team_ops.models import ActiveTimer, MAX_ENTRY_SECONDS, TimeEntry

ADMIN, MEMBER, GUEST = 20, 15, 5


@pytest.fixture(autouse=True)
def _no_broker(db):
    """Soft deletes enqueue a Celery task; there is no broker in tests."""
    with mock.patch("plane.db.mixins.soft_delete_related_objects"):
        yield


def _user(prefix):
    uid = uuid4().hex[:8]
    return User.objects.create(email=f"{prefix}-{uid}@plane.so", username=f"{prefix}_{uid}", display_name=prefix)


def _client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _join(workspace, user, role):
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)


def _project(workspace, owner, identifier, members=()):
    project = Project.objects.create(name=identifier, identifier=identifier, workspace=workspace, created_by=owner)
    ProjectMember.objects.create(project=project, member=owner, workspace=workspace, role=ADMIN)
    for user in members:
        ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=MEMBER)
    return project


@pytest.fixture
def admin(db):
    return _user("admin")


@pytest.fixture
def member(db):
    return _user("member")


@pytest.fixture
def guest(db):
    return _user("guest")


@pytest.fixture
def workspace(admin, member, guest):
    ws = Workspace.objects.create(name="Ops", owner=admin, slug=f"ops-{uuid4().hex[:8]}")
    _join(ws, admin, ADMIN)
    _join(ws, member, MEMBER)
    _join(ws, guest, GUEST)
    return ws


@pytest.fixture
def project(workspace, admin, member):
    return _project(workspace, admin, "OPS", members=[member])


@pytest.fixture
def issue(workspace, project):
    return Issue.objects.create(name="Fix login", project=project, workspace=workspace)


@pytest.fixture
def admin_client(admin):
    return _client(admin)


@pytest.fixture
def member_client(member):
    return _client(member)


def url(workspace, path=""):
    return f"/api/workspaces/{workspace.slug}/team-ops/{path}"


def start():
    return (timezone.now() - timedelta(hours=3)).replace(microsecond=0)


def make_entry(workspace, user, issue=None, seconds=3600, started_at=None, **extra):
    started_at = started_at or start()
    return TimeEntry.objects.create(
        workspace=workspace,
        project=issue.project if issue else None,
        issue=issue,
        user=user,
        started_at=started_at,
        ended_at=started_at + timedelta(seconds=seconds),
        duration_seconds=seconds,
        **extra,
    )


@pytest.mark.contract
class TestCreateTimeEntry:
    @pytest.mark.django_db
    def test_create_with_duration_derives_end(self, member_client, workspace, member, issue):
        started = start()
        response = member_client.post(
            url(workspace, "time-entries/"),
            {"issue": str(issue.id), "started_at": started.isoformat(), "duration_seconds": 5400, "note": "login"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        entry = TimeEntry.objects.get(pk=response.data["id"])
        assert entry.user == member
        assert entry.workspace == workspace
        assert entry.project_id == issue.project_id
        assert entry.duration_seconds == 5400
        assert entry.ended_at == started + timedelta(seconds=5400)
        assert entry.source == TimeEntry.Source.MANUAL
        assert response.data["issue_detail"]["sequence_id"] == issue.sequence_id

    @pytest.mark.django_db
    def test_create_with_end_derives_duration_and_allows_no_issue(self, member_client, workspace):
        started = start()
        response = member_client.post(
            url(workspace, "time-entries/"),
            {"started_at": started.isoformat(), "ended_at": (started + timedelta(minutes=30)).isoformat()},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["duration_seconds"] == 1800
        assert response.data["issue"] is None and response.data["project"] is None

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "payload",
        [
            {},
            {"started_at": "2026-01-01T10:00:00Z"},
            {"started_at": "2026-01-01T10:00:00Z", "ended_at": "2026-01-01T11:00:00Z", "duration_seconds": 3600},
            {"started_at": "2026-01-01T10:00:00Z", "ended_at": "2026-01-01T09:00:00Z"},
            {"started_at": "2026-01-01T10:00:00Z", "duration_seconds": MAX_ENTRY_SECONDS + 1},
            {"started_at": "2026-01-01T10:00:00Z", "duration_seconds": -5},
        ],
    )
    def test_invalid_payloads_are_rejected(self, member_client, workspace, payload):
        response = member_client.post(url(workspace, "time-entries/"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert TimeEntry.objects.count() == 0

    @pytest.mark.django_db
    def test_future_time_is_rejected(self, member_client, workspace):
        future = timezone.now() + timedelta(hours=2)
        response = member_client.post(
            url(workspace, "time-entries/"),
            {"started_at": future.isoformat(), "duration_seconds": 60},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_cannot_log_on_issue_of_a_project_you_are_not_in(self, member_client, workspace, admin):
        other_project = _project(workspace, admin, "SEC")
        secret = Issue.objects.create(name="Secret", project=other_project, workspace=workspace)

        response = member_client.post(
            url(workspace, "time-entries/"),
            {"issue": str(secret.id), "started_at": start().isoformat(), "duration_seconds": 60},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert TimeEntry.objects.count() == 0

    @pytest.mark.django_db
    def test_cannot_log_on_issue_of_another_workspace(self, member_client, workspace):
        owner = _user("other")
        other_ws = Workspace.objects.create(name="Other", owner=owner, slug=f"other-{uuid4().hex[:8]}")
        _join(other_ws, owner, ADMIN)
        foreign = Issue.objects.create(name="Foreign", project=_project(other_ws, owner, "FOR"), workspace=other_ws)

        response = member_client.post(
            url(workspace, "time-entries/"),
            {"issue": str(foreign.id), "started_at": start().isoformat(), "duration_seconds": 60},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_payload_cannot_set_owner_or_workspace(self, member_client, workspace, member, admin):
        response = member_client.post(
            url(workspace, "time-entries/"),
            {
                "started_at": start().isoformat(),
                "duration_seconds": 60,
                "user": str(admin.id),
                "workspace": str(uuid4()),
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        entry = TimeEntry.objects.get()
        assert entry.user == member and entry.workspace == workspace


@pytest.mark.contract
class TestAccessControl:
    @pytest.mark.django_db
    def test_guest_is_refused_everywhere(self, guest, workspace):
        client = _client(guest)

        assert client.get(url(workspace, "time-entries/")).status_code == status.HTTP_403_FORBIDDEN
        assert client.post(url(workspace, "time-entries/"), {}, format="json").status_code == status.HTTP_403_FORBIDDEN
        assert client.get(url(workspace, "timer/")).status_code == status.HTTP_403_FORBIDDEN
        assert client.post(url(workspace, "timer/"), {}, format="json").status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_outsider_is_refused(self, workspace, db):
        client = _client(_user("outsider"))

        assert client.get(url(workspace, "time-entries/")).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_anonymous_is_refused(self, workspace):
        response = APIClient().get(url(workspace, "time-entries/"))

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    @pytest.mark.django_db
    def test_member_sees_only_own_entries(self, member_client, workspace, member, admin):
        mine = make_entry(workspace, member)
        make_entry(workspace, admin)

        response = member_client.get(url(workspace, "time-entries/"))

        assert response.status_code == status.HTTP_200_OK
        assert [row["id"] for row in response.data["results"]] == [str(mine.id)]

    @pytest.mark.django_db
    def test_member_cannot_ask_for_someone_elses_entries(self, member_client, workspace, admin):
        make_entry(workspace, admin)

        response = member_client.get(url(workspace, "time-entries/"), {"user": str(admin.id)})

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_admin_sees_everyone_and_can_filter_by_user(self, admin_client, workspace, member, admin):
        make_entry(workspace, member)
        make_entry(workspace, admin)

        everyone = admin_client.get(url(workspace, "time-entries/"))
        only_member = admin_client.get(url(workspace, "time-entries/"), {"user": str(member.id)})

        assert everyone.data["total_count"] == 2
        assert [str(row["user"]) for row in only_member.data["results"]] == [str(member.id)]

    @pytest.mark.django_db
    def test_entries_do_not_leak_across_workspaces(self, admin_client, workspace, member):
        owner = _user("other")
        other_ws = Workspace.objects.create(name="Other", owner=owner, slug=f"other-{uuid4().hex[:8]}")
        _join(other_ws, owner, ADMIN)
        _join(other_ws, member, MEMBER)
        make_entry(other_ws, member)

        response = admin_client.get(url(workspace, "time-entries/"))

        assert response.data["total_count"] == 0

    @pytest.mark.django_db
    def test_member_cannot_touch_other_users_entry(self, member_client, workspace, admin):
        theirs = make_entry(workspace, admin)
        path = url(workspace, f"time-entries/{theirs.id}/")

        assert member_client.get(path).status_code == status.HTTP_404_NOT_FOUND
        assert member_client.patch(path, {"note": "x"}, format="json").status_code == status.HTTP_404_NOT_FOUND
        assert member_client.delete(path).status_code == status.HTTP_404_NOT_FOUND
        theirs.refresh_from_db()
        assert theirs.deleted_at is None and theirs.note == ""

    @pytest.mark.django_db
    def test_admin_can_edit_and_delete_any_entry(self, admin_client, workspace, member):
        entry = make_entry(workspace, member)
        path = url(workspace, f"time-entries/{entry.id}/")

        patched = admin_client.patch(path, {"note": "reviewed"}, format="json")
        deleted = admin_client.delete(path)

        assert patched.status_code == status.HTTP_200_OK and patched.data["note"] == "reviewed"
        assert deleted.status_code == status.HTTP_204_NO_CONTENT
        assert not TimeEntry.objects.filter(pk=entry.pk).exists()


@pytest.mark.contract
class TestUpdateTimeEntry:
    @pytest.mark.django_db
    def test_patch_duration_moves_end(self, member_client, workspace, member):
        entry = make_entry(workspace, member, seconds=3600)

        response = member_client.patch(
            url(workspace, f"time-entries/{entry.id}/"), {"duration_seconds": 1800}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        entry.refresh_from_db()
        assert entry.duration_seconds == 1800
        assert entry.ended_at == entry.started_at + timedelta(seconds=1800)

    @pytest.mark.django_db
    def test_patch_without_time_fields_keeps_duration(self, member_client, workspace, member, issue):
        entry = make_entry(workspace, member, seconds=3600)

        response = member_client.patch(
            url(workspace, f"time-entries/{entry.id}/"), {"issue": str(issue.id), "is_billable": True}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        entry.refresh_from_db()
        assert entry.issue_id == issue.id and entry.project_id == issue.project_id
        assert entry.is_billable is True and entry.duration_seconds == 3600

    @pytest.mark.django_db
    def test_patch_can_detach_issue(self, member_client, workspace, member, issue):
        entry = make_entry(workspace, member, issue=issue)

        response = member_client.patch(url(workspace, f"time-entries/{entry.id}/"), {"issue": None}, format="json")

        assert response.status_code == status.HTTP_200_OK
        entry.refresh_from_db()
        assert entry.issue_id is None and entry.project_id is None

    @pytest.mark.django_db
    def test_patch_rejects_end_before_start(self, member_client, workspace, member):
        entry = make_entry(workspace, member)

        response = member_client.patch(
            url(workspace, f"time-entries/{entry.id}/"),
            {"ended_at": (entry.started_at - timedelta(minutes=1)).isoformat()},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
class TestListFilters:
    @pytest.mark.django_db
    def test_filters_by_issue_project_and_range(self, member_client, workspace, member, issue):
        today = start()
        old = make_entry(workspace, member, started_at=today - timedelta(days=10))
        linked = make_entry(workspace, member, issue=issue, started_at=today)
        plain = make_entry(workspace, member, started_at=today - timedelta(minutes=1))

        by_issue = member_client.get(url(workspace, "time-entries/"), {"issue": str(issue.id)})
        by_project = member_client.get(url(workspace, "time-entries/"), {"project": str(issue.project_id)})
        by_range = member_client.get(
            url(workspace, "time-entries/"), {"from": (today - timedelta(days=1)).date().isoformat()}
        )

        assert [r["id"] for r in by_issue.data["results"]] == [str(linked.id)]
        assert [r["id"] for r in by_project.data["results"]] == [str(linked.id)]
        assert {r["id"] for r in by_range.data["results"]} == {str(linked.id), str(plain.id)}
        assert str(old.id) not in {r["id"] for r in by_range.data["results"]}

    @pytest.mark.django_db
    @pytest.mark.parametrize("params", [{"from": "nope"}, {"issue": "not-a-uuid"}, {"user": "x"}])
    def test_bad_query_values_are_400(self, member_client, workspace, params):
        assert member_client.get(url(workspace, "time-entries/"), params).status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_results_are_newest_first_and_paginated(self, member_client, workspace, member):
        base = start()
        for index in range(3):
            make_entry(workspace, member, started_at=base - timedelta(hours=index))

        response = member_client.get(url(workspace, "time-entries/"), {"per_page": 2})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 2
        assert response.data["total_count"] == 3
        assert response.data["next_page_results"] is True
        starts = [r["started_at"] for r in response.data["results"]]
        assert starts == sorted(starts, reverse=True)


@pytest.mark.contract
class TestSummary:
    @pytest.mark.django_db
    def test_totals_by_day_and_issue(self, member_client, workspace, member, issue):
        day = timezone.now().replace(hour=12, minute=0, second=0, microsecond=0) - timedelta(days=1)
        make_entry(workspace, member, issue=issue, seconds=3600, started_at=day, is_billable=True)
        make_entry(workspace, member, issue=issue, seconds=1800, started_at=day + timedelta(minutes=90))
        make_entry(workspace, member, seconds=600, started_at=day - timedelta(days=1))

        response = member_client.get(
            url(workspace, "time-entries/summary/"),
            {
                "from": (day - timedelta(days=2)).date().isoformat(),
                "to": (day + timedelta(days=1)).date().isoformat(),
            },
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_seconds"] == 6000
        assert response.data["billable_seconds"] == 3600
        assert sum(row["seconds"] for row in response.data["by_day"]) == 6000
        assert len(response.data["by_day"]) == 2
        assert response.data["by_issue"][0]["issue"] == issue.id
        assert response.data["by_issue"][0]["seconds"] == 5400

    @pytest.mark.django_db
    def test_member_summary_excludes_other_users(self, member_client, workspace, member, admin):
        make_entry(workspace, member, seconds=100)
        make_entry(workspace, admin, seconds=900)
        today = timezone.now().date()

        response = member_client.get(
            url(workspace, "time-entries/summary/"),
            {"from": (today - timedelta(days=2)).isoformat(), "to": (today + timedelta(days=1)).isoformat()},
        )

        assert response.data["total_seconds"] == 100

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "params",
        [
            {},
            {"from": "2026-01-01"},
            {"from": "2026-02-01", "to": "2026-01-01"},
            {"from": "2024-01-01", "to": "2026-01-01"},
        ],
    )
    def test_range_is_required_ordered_and_bounded(self, member_client, workspace, params):
        response = member_client.get(url(workspace, "time-entries/summary/"), params)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
class TestTimer:
    @pytest.mark.django_db
    def test_no_timer_by_default(self, member_client, workspace):
        response = member_client.get(url(workspace, "timer/"))

        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"timer": None}

    @pytest.mark.django_db
    def test_start_and_read_timer(self, member_client, workspace, member, issue):
        response = member_client.post(
            url(workspace, "timer/"), {"issue": str(issue.id), "note": "deep work"}, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["timer"]["issue_detail"]["name"] == "Fix login"
        assert ActiveTimer.objects.get().user == member
        assert member_client.get(url(workspace, "timer/")).data["timer"]["note"] == "deep work"

    @pytest.mark.django_db
    def test_second_start_conflicts_and_keeps_first(self, member_client, workspace):
        first = member_client.post(url(workspace, "timer/"), {}, format="json")

        second = member_client.post(url(workspace, "timer/"), {}, format="json")

        assert second.status_code == status.HTTP_409_CONFLICT
        assert second.data["timer"]["id"] == first.data["timer"]["id"]
        assert ActiveTimer.objects.count() == 1

    @pytest.mark.django_db
    def test_stop_creates_entry_and_removes_timer(self, member_client, workspace, member, issue):
        member_client.post(url(workspace, "timer/"), {"issue": str(issue.id), "note": "n"}, format="json")
        ActiveTimer.objects.update(started_at=timezone.now() - timedelta(minutes=90), last_confirmed_at=timezone.now())

        response = member_client.delete(url(workspace, "timer/"))

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["capped"] is False
        entry = TimeEntry.objects.get()
        assert entry.user == member and entry.issue_id == issue.id and entry.project_id == issue.project_id
        assert entry.source == TimeEntry.Source.TIMER and entry.note == "n"
        assert 5390 <= entry.duration_seconds <= 5460
        assert ActiveTimer.all_objects.count() == 0

    @pytest.mark.django_db
    def test_stop_caps_a_forgotten_timer(self, member_client, workspace):
        member_client.post(url(workspace, "timer/"), {}, format="json")
        ActiveTimer.objects.update(started_at=timezone.now() - timedelta(days=3), last_confirmed_at=timezone.now())

        response = member_client.delete(url(workspace, "timer/"))

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["capped"] is True
        assert TimeEntry.objects.get().duration_seconds == MAX_ENTRY_SECONDS

    @pytest.mark.django_db
    def test_stop_without_timer_is_404(self, member_client, workspace):
        assert member_client.delete(url(workspace, "timer/")).status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_timers_are_per_user(self, member_client, admin_client, workspace):
        member_client.post(url(workspace, "timer/"), {}, format="json")

        assert admin_client.get(url(workspace, "timer/")).data == {"timer": None}
        assert admin_client.delete(url(workspace, "timer/")).status_code == status.HTTP_404_NOT_FOUND
        assert ActiveTimer.objects.count() == 1

    @pytest.mark.django_db
    def test_timer_start_checks_issue_access(self, member_client, workspace, admin):
        secret = Issue.objects.create(name="Secret", project=_project(workspace, admin, "SEC"), workspace=workspace)

        response = member_client.post(url(workspace, "timer/"), {"issue": str(secret.id)}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert ActiveTimer.objects.count() == 0


@pytest.mark.contract
class TestFeatureFlag:
    def test_routes_exist_when_enabled(self):
        from django.urls import reverse

        assert reverse("team-ops-timer", kwargs={"slug": "x"}) == "/api/workspaces/x/team-ops/timer/"
