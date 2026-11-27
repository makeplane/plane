# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Project activity heatmap (fork Liviere/plane, plane/liviere/activity): recording, aggregation and the
# endpoints in /api/ (session) and /api/v1/ (API key), including log entries.

from datetime import datetime, timedelta, timezone as dt_timezone
from uuid import uuid4

import pytest
from crum import impersonate
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Cycle, Issue, IssueActivity, Module, Page, Project, ProjectMember, ProjectPage, User
from plane.db.models.api import APIToken
from plane.liviere.activity import kinds as K
from plane.liviere.activity.kinds import DEFAULT_KINDS, kind_for_issue_activity, parse_kinds
from plane.liviere.activity.record import sync_issue_activity
from plane.liviere.models import ActivityEvent, ProjectActivitySettings


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Activity Project", identifier="AP", workspace=workspace, created_by=create_user, page_view=True
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


def _make_user(prefix):
    unique_id = uuid4().hex[:8]
    return User.objects.create(email=f"{prefix}-{unique_id}@plane.so", username=f"{prefix}_{unique_id}")


def _member(project, role):
    user = _make_user(f"role{role}")
    ProjectMember.objects.create(project=project, member=user, role=role, is_active=True)
    return user


def _key_client(user):
    token = APIToken.objects.create(user=user, label="activity", token=f"plane_api_{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def _session_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _event(project, actor, at, kind=K.ISSUE_STATE, **kwargs):
    return ActivityEvent.objects.create(
        workspace=project.workspace,
        project=project,
        actor=actor,
        occurred_at=at,
        kind=kind,
        source=kwargs.pop("source", "test"),
        **kwargs,
    )


def _utc(*args):
    return datetime(*args, tzinfo=dt_timezone.utc)


def _v1(workspace, project, path):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/activity/{path}/"


def _app(workspace, project, path):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/liviere/activity/{path}/"


def _make_page(project, owner, name="Page"):
    page = Page.objects.create(workspace=project.workspace, owned_by=owner, name=name)
    ProjectPage.objects.create(workspace=project.workspace, project=project, page=page)
    return page


def _events(project, kind=None):
    events = ActivityEvent.objects.filter(project=project)
    return list(events.filter(kind=kind) if kind else events)


@pytest.mark.unit
class TestCatalog:
    @pytest.mark.parametrize(
        "field,verb,expected",
        [
            (None, "created", K.ISSUE_CREATED),
            ("state", "updated", K.ISSUE_STATE),
            ("name", "updated", K.ISSUE_PROPERTY),
            ("assignees", "updated", K.ISSUE_PROPERTY),
            ("estimate_point", "updated", K.ISSUE_PROPERTY),
            ("parent", "updated", K.ISSUE_PROPERTY),
            ("description", "updated", K.ISSUE_DESCRIPTION),
            ("comment", "created", K.ISSUE_COMMENT),
            ("attachment", "created", K.ISSUE_LINK),
            ("link", "deleted", K.ISSUE_LINK),
            ("blocked_by", "updated", K.ISSUE_RELATION),
            ("relates_to", "deleted", K.ISSUE_RELATION),
            ("cycles", "updated", K.ISSUE_CYCLE_MODULE),
            ("modules", "updated", K.ISSUE_CYCLE_MODULE),
            ("archived_at", "updated", K.ISSUE_ARCHIVE),
            ("issue", "deleted", K.ISSUE_ARCHIVE),
            ("intake", "1", K.ISSUE_INTAKE),
            ("reaction", "created", K.ISSUE_REACTION),
            ("vote", "created", K.ISSUE_REACTION),
            ("draft", "created", None),
            (None, "updated", None),
        ],
    )
    def test_issue_activity_mapping(self, field, verb, expected):
        assert kind_for_issue_activity(field, verb) == expected

    def test_parse_kinds_keeps_catalog_order_and_rejects_unknown(self):
        assert parse_kinds("page.edited, issue.state") == [K.ISSUE_STATE, K.PAGE_EDITED]
        assert parse_kinds(None) is None
        with pytest.raises(ValueError):
            parse_kinds("issue.state,nope")

    def test_reactions_and_views_are_off_by_default(self):
        assert K.ISSUE_REACTION not in DEFAULT_KINDS
        assert K.VIEW_CHANGED not in DEFAULT_KINDS
        assert K.PAGE_EDITED in DEFAULT_KINDS


@pytest.mark.unit
class TestIssueActivitySync:
    def _activity(self, project, actor, **kwargs):
        return IssueActivity.objects.create(
            workspace=project.workspace, project=project, actor=actor, verb="updated", **kwargs
        )

    @pytest.mark.django_db
    def test_copies_once_and_skips_drafts_and_deleted_rows(self, project, create_user):
        state = self._activity(project, create_user, field="state")
        self._activity(project, create_user, field="draft")
        deleted = self._activity(project, create_user, field="comment")
        deleted.deleted_at = timezone.now()
        deleted.save()

        sync_issue_activity(IssueActivity, ActivityEvent)
        sync_issue_activity(IssueActivity, ActivityEvent)

        events = _events(project)
        assert [(e.kind, e.source_id, e.actor_id) for e in events] == [(K.ISSUE_STATE, state.id, create_user.id)]
        assert events[0].occurred_at == state.created_at

    @pytest.mark.django_db
    def test_row_with_backdated_created_at_is_copied(self, project, create_user):
        # create_issue_activity backdates created_at to the work item's creation after inserting the row
        sync_issue_activity(IssueActivity, ActivityEvent)
        self._activity(project, create_user, field="state")
        sync_issue_activity(IssueActivity, ActivityEvent)
        created = self._activity(project, create_user, field=None)
        created.verb = "created"
        created.created_at = timezone.now() - timedelta(days=3)
        created.save()

        sync_issue_activity(IssueActivity, ActivityEvent)

        event = ActivityEvent.objects.get(source_id=created.id)
        assert event.kind == K.ISSUE_CREATED
        assert event.occurred_at == created.created_at


@pytest.mark.unit
class TestSignals:
    @pytest.mark.django_db
    def test_page_created_renamed_edited_deleted(self, project, create_user):
        with impersonate(create_user):
            page = _make_page(project, create_user, name="One")
            page.name = "Two"
            page.save()
            page.description_html = "<p>first</p>"
            page.save()
            page.description_html = "<p>second</p>"  # within a minute: not counted again
            page.save()
            page.archived_at = timezone.now().date()
            page.save()
            page.delete()

        assert [e.kind for e in sorted(_events(project), key=lambda e: e.id)] == [
            K.PAGE_CREATED,
            K.PAGE_RENAMED,
            K.PAGE_EDITED,
            K.PAGE_ARCHIVE,
            K.PAGE_ARCHIVE,
        ]
        assert {e.page_id for e in _events(project)} == {page.id}
        assert {e.actor_id for e in _events(project)} == {create_user.id}

    @pytest.mark.django_db
    def test_saves_without_a_user_or_of_other_fields_are_not_counted(self, project, create_user):
        page = _make_page(project, create_user)
        page.name = "Renamed by a background task"
        page.save()
        with impersonate(create_user):
            page.is_locked = True
            page.save(update_fields=["is_locked"])
            page.view_props = {"full_width": True}
            page.save()

        assert _events(project) == []

    @pytest.mark.django_db
    def test_cycles_and_modules(self, project, create_user):
        with impersonate(create_user):
            cycle = Cycle.objects.create(name="C1", project=project, workspace=project.workspace, owned_by=create_user)
            cycle.name = "C1b"
            cycle.save()
            module = Module.objects.create(name="M1", project=project, workspace=project.workspace)

        assert sorted(e.kind for e in _events(project)) == [K.CYCLE_CHANGED, K.CYCLE_CHANGED, K.MODULE_CHANGED]
        assert {e.object_id for e in _events(project)} == {cycle.id, module.id}


@pytest.mark.contract
class TestHeatmap:
    @pytest.mark.django_db
    def test_quarters_in_local_time(self, api_key_client, workspace, project, create_user):
        # Warsaw is UTC+2 in summer: 08:14 UTC = 10:14 local (slot 40), 08:15 UTC = 10:15 (slot 41)
        _event(project, create_user, _utc(2026, 7, 1, 8, 0))
        _event(project, create_user, _utc(2026, 7, 1, 8, 14, 59), kind=K.ISSUE_COMMENT)
        _event(project, create_user, _utc(2026, 7, 1, 8, 15))
        _event(project, create_user, _utc(2026, 6, 30, 22, 5))  # 00:05 local on 1 July
        _event(project, create_user, _utc(2026, 7, 2, 22, 0))  # 3 July locally: outside the range

        response = api_key_client.get(
            _v1(workspace, project, "heatmap"), {"from": "2026-07-01", "to": "2026-07-02", "tz": "Europe/Warsaw"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["timezone"] == "Europe/Warsaw"
        assert data["bucket_minutes"] == 15
        assert [(b["date"], b["slot"], b["count"]) for b in data["buckets"]] == [
            ("2026-07-01", 0, 1),
            ("2026-07-01", 40, 2),
            ("2026-07-01", 41, 1),
        ]
        assert data["buckets"][1]["by_kind"] == {K.ISSUE_STATE: 1, K.ISSUE_COMMENT: 1}
        assert data["buckets"][1]["start"] == "2026-07-01T10:00:00+02:00"
        assert data["summary"] == {
            "events": 4,
            "active_buckets": 3,
            "active_hours": 0.75,
            "by_kind": {K.ISSUE_STATE: 3, K.ISSUE_COMMENT: 1},
        }

    @pytest.mark.django_db
    def test_repeated_hour_when_clocks_go_back(self, api_key_client, workspace, project, create_user):
        # 25 Oct 2026: 02:30 CEST (00:30 UTC) and 02:30 CET (01:30 UTC) share slot 10
        _event(project, create_user, _utc(2026, 10, 25, 0, 30))
        _event(project, create_user, _utc(2026, 10, 25, 1, 30))

        data = api_key_client.get(
            _v1(workspace, project, "heatmap"), {"from": "2026-10-25", "to": "2026-10-25", "tz": "Europe/Warsaw"}
        ).json()

        assert [(b["slot"], b["count"]) for b in data["buckets"]] == [(10, 2)]

    @pytest.mark.django_db
    def test_project_settings_actor_and_kinds_filters(self, api_key_client, workspace, project, create_user):
        other = _member(project, 15)
        at = _utc(2026, 7, 1, 8, 0)
        _event(project, create_user, at)
        _event(project, other, at)
        _event(project, create_user, at, kind=K.ISSUE_REACTION)  # off by default
        url = _v1(workspace, project, "heatmap")
        params = {"from": "2026-07-01", "to": "2026-07-01", "tz": "UTC"}

        assert api_key_client.get(url, params).json()["summary"]["events"] == 2
        assert api_key_client.get(url, {**params, "actor": str(other.id)}).json()["summary"]["events"] == 1
        assert api_key_client.get(url, {**params, "kinds": K.ISSUE_REACTION}).json()["summary"]["events"] == 1

        ProjectActivitySettings.objects.create(project=project, kinds=[K.ISSUE_REACTION])
        assert api_key_client.get(url, params).json()["summary"]["events"] == 1

    @pytest.mark.django_db
    def test_defaults_to_the_last_30_days_in_the_project_time_zone(self, api_key_client, workspace, project):
        project.timezone = "Asia/Tokyo"
        project.save()

        data = api_key_client.get(_v1(workspace, project, "heatmap")).json()

        assert data["timezone"] == "Asia/Tokyo"
        assert (datetime.fromisoformat(data["to"]) - datetime.fromisoformat(data["from"])).days == 29

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "params",
        [
            {"tz": "Mars/Base"},
            {"from": "2026-13-01"},
            {"from": "2026-07-02", "to": "2026-07-01"},
            {"from": "2024-01-01", "to": "2026-01-01"},
            {"kinds": "issue.state,unknown"},
        ],
    )
    def test_invalid_parameters(self, api_key_client, workspace, project, params):
        response = api_key_client.get(_v1(workspace, project, "heatmap"), params)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
class TestEvents:
    @pytest.mark.django_db
    def test_events_of_one_bucket_with_references(self, api_key_client, workspace, project, create_user):
        page = _make_page(project, create_user, name="Spec")
        _event(project, create_user, _utc(2026, 7, 1, 8, 5), kind=K.PAGE_EDITED, page_id=page.id)
        _event(project, create_user, _utc(2026, 7, 1, 8, 10), issue_id=uuid4())  # work item deleted since
        _event(project, create_user, _utc(2026, 7, 1, 8, 20))

        response = api_key_client.get(
            _v1(workspace, project, "events"),
            {"start": "2026-07-01T10:00:00+02:00", "end": "2026-07-01T10:15:00+02:00", "tz": "Europe/Warsaw"},
        )

        assert response.status_code == status.HTTP_200_OK
        results = response.json()["results"]
        assert [r["kind"] for r in results] == [K.ISSUE_STATE, K.PAGE_EDITED]
        assert results[0]["issue"]["deleted"] is True
        assert results[1]["page"] == {"id": str(page.id), "name": "Spec", "deleted": False}
        assert results[1]["actor"]["id"] == str(create_user.id)


@pytest.mark.contract
class TestPermissions:
    @pytest.mark.django_db
    def test_member_reads_guest_does_not(self, workspace, project):
        member = _key_client(_member(project, 15))
        guest = _key_client(_member(project, 5))

        assert member.get(_v1(workspace, project, "heatmap")).status_code == status.HTTP_200_OK
        assert member.get(_v1(workspace, project, "settings")).status_code == status.HTTP_200_OK
        assert guest.get(_v1(workspace, project, "heatmap")).status_code == status.HTTP_403_FORBIDDEN
        assert guest.get(_v1(workspace, project, "events")).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_settings_change_only_in_the_app_and_only_by_an_admin(self, session_client, workspace, project):
        # A separate client: the api_key_client fixture shares its APIClient with session_client
        api_key_client = _key_client(project.workspace.owner)
        url = _app(workspace, project, "settings")
        body = {"enabled": True, "kinds": [K.ISSUE_STATE, K.PAGE_EDITED]}

        response = api_key_client.patch(_v1(workspace, project, "settings"), body, format="json")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        assert api_key_client.patch(url, body, format="json").status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )
        member = _session_client(_member(project, 15))
        assert member.patch(url, body, format="json").status_code == status.HTTP_403_FORBIDDEN
        assert member.get(url).json()["enabled"] is False

        response = session_client.patch(url, body, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["kinds"] == [K.ISSUE_STATE, K.PAGE_EDITED]
        settings = ProjectActivitySettings.objects.get(project=project)
        assert settings.enabled is True

        assert session_client.patch(url, {"kinds": ["nope"]}, format="json").status_code == 400
        assert session_client.patch(url, {"enabled": "yes"}, format="json").status_code == 400

    @pytest.mark.django_db
    def test_enabled_projects_and_app_heatmap(self, session_client, workspace, project):
        url = f"/api/workspaces/{workspace.slug}/liviere/activity/enabled-projects/"
        assert session_client.get(url).json() == {"project_ids": []}

        ProjectActivitySettings.objects.create(project=project, enabled=True)
        assert session_client.get(url).json() == {"project_ids": [str(project.id)]}
        assert session_client.get(_app(workspace, project, "heatmap")).status_code == status.HTTP_200_OK
        assert session_client.get(_app(workspace, project, "events")).status_code == status.HTTP_200_OK


@pytest.mark.contract
class TestRecordingThroughEndpoints:
    @pytest.mark.django_db
    def test_page_actions_via_api_are_recorded_with_the_key_owner(
        self, api_key_client, workspace, project, create_user
    ):
        pages_url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/pages/"
        page_id = api_key_client.post(pages_url, {"name": "Via API"}, format="json").json()["id"]
        api_key_client.patch(f"{pages_url}{page_id}/", {"name": "Renamed"}, format="json")
        api_key_client.post(f"{pages_url}{page_id}/archive/")

        assert sorted(e.kind for e in _events(project)) == sorted([K.PAGE_CREATED, K.PAGE_RENAMED, K.PAGE_ARCHIVE])
        assert {e.actor_id for e in _events(project)} == {create_user.id}

    @pytest.mark.django_db
    def test_page_archive_in_the_app(self, session_client, workspace, project, create_user):
        page = _make_page(project, create_user)

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/{page.id}/archive/"
        )

        assert response.status_code == status.HTTP_200_OK
        assert [(e.kind, e.actor_id) for e in _events(project)] == [(K.PAGE_ARCHIVE, create_user.id)]


def _log(project, actor, start, end=None, text="Did things"):
    return _event(project, actor, start, kind=K.LOG_ENTRY, source=ActivityEvent.SOURCE_LOG, ended_at=end, note=text)


@pytest.mark.contract
class TestLogEntries:
    @pytest.mark.django_db
    def test_create_with_a_range_and_a_work_item_identifier(self, api_key_client, workspace, project, create_user):
        issue = Issue.objects.create(name="Fix login", project=project, workspace=workspace)
        body = {
            "text": "  Fixed the login redirect and deployed it.  ",
            "started_at": "2026-07-01T10:05:00+02:00",
            "ended_at": "2026-07-01T10:50:00+02:00",
            "issue": f"ap-{issue.sequence_id}",
        }

        response = api_key_client.post(_v1(workspace, project, "logs"), body, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["kind"] == K.LOG_ENTRY
        assert data["note"] == "Fixed the login redirect and deployed it."
        assert data["occurred_at"] == "2026-07-01T08:05:00+00:00"
        assert data["ended_at"] == "2026-07-01T08:50:00+00:00"
        assert data["issue"]["identifier"] == f"AP-{issue.sequence_id}"
        assert data["actor"]["id"] == str(create_user.id)
        entry = ActivityEvent.objects.get(id=data["id"])
        assert (entry.source, entry.issue_id, entry.workspace_id) == (ActivityEvent.SOURCE_LOG, issue.id, workspace.id)

    @pytest.mark.django_db
    def test_time_forms(self, api_key_client, workspace, project):
        url = _v1(workspace, project, "logs")
        before = timezone.now()

        last_40 = api_key_client.post(url, {"text": "a", "duration_minutes": 40}, format="json").json()
        start = datetime.fromisoformat(last_40["occurred_at"])
        end = datetime.fromisoformat(last_40["ended_at"])
        assert end - start == timedelta(minutes=40)
        assert before <= end <= timezone.now()

        moment = api_key_client.post(url, {"text": "b"}, format="json").json()
        assert moment["ended_at"] is None
        assert before <= datetime.fromisoformat(moment["occurred_at"]) <= timezone.now()

        # Without an offset the project time zone applies
        project.timezone = "Europe/Warsaw"
        project.save()
        body = {"text": "c", "started_at": "2026-07-01 10:00", "duration_minutes": 30}
        local = api_key_client.post(url, body, format="json").json()
        assert (local["occurred_at"], local["ended_at"]) == ("2026-07-01T08:00:00+00:00", "2026-07-01T08:30:00+00:00")

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "body",
        [
            {},
            {"text": "   "},
            {"text": "x" * 4001},
            {"text": "a", "started_at": "yesterday"},
            {"text": "a", "started_at": "2026-07-01T10:00:00Z", "ended_at": "2026-07-01T09:00:00Z"},
            {"text": "a", "started_at": "2026-07-01T08:00:00Z", "ended_at": "2026-07-01T20:01:00Z"},
            {"text": "a", "started_at": "2026-07-01T10:00Z", "ended_at": "2026-07-01T11:00Z", "duration_minutes": 5},
            {"text": "a", "started_at": "2026-13-01T10:00:00Z"},
            {"text": "a", "ended_at": "2026-07-01T11:00:00Z"},
            {"text": "a", "duration_minutes": 0},
            {"text": "a", "duration_minutes": "40"},
            {"text": "a", "started_at": "2099-01-01T00:00:00Z"},
            {"text": "a", "issue": "AP-99999"},
            {"text": "a", "issue": "XX-1"},
            {"text": "a", "page": "not-a-uuid"},
            {"text": "a", "kind": "issue.state"},
        ],
    )
    def test_invalid_entries(self, api_key_client, workspace, project, body):
        response = api_key_client.post(_v1(workspace, project, "logs"), body, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.json()
        assert not ActivityEvent.objects.filter(project=project).exists()

    @pytest.mark.django_db
    def test_work_items_and_pages_of_other_projects_are_rejected(self, api_key_client, workspace, project, create_user):
        other = Project.objects.create(name="Other", identifier="OT", workspace=workspace, created_by=create_user)
        issue = Issue.objects.create(name="Elsewhere", project=other, workspace=workspace)
        page = _make_page(other, create_user)
        url = _v1(workspace, project, "logs")

        assert api_key_client.post(url, {"text": "a", "issue": str(issue.id)}, format="json").status_code == 400
        assert api_key_client.post(url, {"text": "a", "page": str(page.id)}, format="json").status_code == 400

        own_page = _make_page(project, create_user, name="Notes")
        response = api_key_client.post(url, {"text": "a", "page": str(own_page.id)}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["page"]["name"] == "Notes"

    @pytest.mark.django_db
    def test_change_and_delete(self, api_key_client, workspace, project, create_user):
        entry = _log(project, create_user, _utc(2026, 7, 1, 8, 0), _utc(2026, 7, 1, 9, 0))
        url = f"{_v1(workspace, project, 'logs')}{entry.id}/"

        response = api_key_client.patch(url, {"started_at": "2026-07-01T07:30:00Z"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        # A new start keeps the length
        assert response.json()["ended_at"] == "2026-07-01T08:30:00+00:00"
        assert response.json()["updated_at"] is not None

        response = api_key_client.patch(url, {"text": "Better text", "ended_at": None}, format="json")
        assert (response.json()["note"], response.json()["ended_at"]) == ("Better text", None)
        assert api_key_client.patch(url, {}, format="json").status_code == status.HTTP_400_BAD_REQUEST
        assert api_key_client.get(url).json()["note"] == "Better text"

        assert api_key_client.delete(url).status_code == status.HTTP_204_NO_CONTENT
        assert api_key_client.get(url).status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_only_the_author_or_an_admin_changes_an_entry(self, workspace, project, create_user):
        author = _member(project, 15)
        entry = _log(project, author, _utc(2026, 7, 1, 8, 0))
        url = f"{_v1(workspace, project, 'logs')}{entry.id}/"
        other_member = _key_client(_member(project, 15))
        guest = _key_client(_member(project, 5))

        assert other_member.get(url).status_code == status.HTTP_200_OK
        assert other_member.patch(url, {"text": "x"}, format="json").status_code == status.HTTP_403_FORBIDDEN
        assert other_member.delete(url).status_code == status.HTTP_403_FORBIDDEN
        assert guest.post(_v1(workspace, project, "logs"), {"text": "x"}, format="json").status_code == 403
        assert guest.get(url).status_code == status.HTTP_403_FORBIDDEN

        assert _key_client(author).patch(url, {"text": "mine"}, format="json").status_code == status.HTTP_200_OK
        assert _key_client(create_user).delete(url).status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.django_db
    def test_other_events_cannot_be_changed(self, api_key_client, workspace, project, create_user):
        event = _event(project, create_user, _utc(2026, 7, 1, 8, 0))
        url = f"{_v1(workspace, project, 'logs')}{event.id}/"

        assert api_key_client.patch(url, {"text": "x"}, format="json").status_code == status.HTTP_404_NOT_FOUND
        assert api_key_client.delete(url).status_code == status.HTTP_404_NOT_FOUND
        assert ActivityEvent.objects.filter(id=event.id).exists()

    @pytest.mark.django_db
    def test_entries_fill_every_quarter_of_their_range(self, api_key_client, workspace, project, create_user):
        # 10:05-10:50 Warsaw time: quarters 10:00, 10:15, 10:30, 10:45 (slots 40-43); one more event at 10:20
        _log(project, create_user, _utc(2026, 7, 1, 8, 5), _utc(2026, 7, 1, 8, 50))
        _event(project, create_user, _utc(2026, 7, 1, 8, 20))
        # Started the day before: only the part inside the range counts
        _log(project, create_user, _utc(2026, 6, 30, 21, 30), _utc(2026, 6, 30, 22, 15))

        data = api_key_client.get(
            _v1(workspace, project, "heatmap"), {"from": "2026-07-01", "to": "2026-07-01", "tz": "Europe/Warsaw"}
        ).json()

        assert [(b["slot"], b["count"]) for b in data["buckets"]] == [(0, 1), (40, 1), (41, 2), (42, 1), (43, 1)]
        assert data["buckets"][2]["by_kind"] == {K.LOG_ENTRY: 1, K.ISSUE_STATE: 1}
        assert data["buckets"][1]["start"] == "2026-07-01T10:00:00+02:00"
        assert data["summary"]["events"] == 3
        assert data["summary"]["by_kind"] == {K.LOG_ENTRY: 2, K.ISSUE_STATE: 1}
        assert data["summary"]["active_buckets"] == 5

    @pytest.mark.django_db
    def test_range_over_the_repeated_hour(self, api_key_client, workspace, project, create_user):
        # 25 Oct 2026, 00:30-01:45 UTC: 02:30, 02:45 CEST, then 02:00, 02:15, 02:30 CET; 02:30 counts once
        _log(project, create_user, _utc(2026, 10, 25, 0, 30), _utc(2026, 10, 25, 1, 45))

        data = api_key_client.get(
            _v1(workspace, project, "heatmap"), {"from": "2026-10-25", "to": "2026-10-25", "tz": "Europe/Warsaw"}
        ).json()

        assert [(b["slot"], b["count"]) for b in data["buckets"]] == [(8, 1), (9, 1), (10, 1), (11, 1)]

    @pytest.mark.django_db
    def test_a_quarter_inside_an_entry_lists_it(self, api_key_client, workspace, project, create_user):
        entry = _log(project, create_user, _utc(2026, 7, 1, 8, 0), _utc(2026, 7, 1, 10, 0), text="Long migration")
        _log(project, create_user, _utc(2026, 7, 1, 11, 0))  # later, outside the quarter

        results = api_key_client.get(
            _v1(workspace, project, "events"),
            {"start": "2026-07-01T09:15:00Z", "end": "2026-07-01T09:30:00Z"},
        ).json()["results"]

        assert [(r["id"], r["note"]) for r in results] == [(entry.id, "Long migration")]

    @pytest.mark.django_db
    def test_list_and_settings(self, workspace, project, create_user, session_client):
        _log(project, create_user, _utc(2026, 7, 1, 8, 0))
        _event(project, create_user, _utc(2026, 7, 1, 8, 1))
        # Settings that do not count log entries still list them
        ProjectActivitySettings.objects.create(project=project, kinds=[K.ISSUE_STATE])
        params = {"from": "2026-07-01", "to": "2026-07-01", "tz": "UTC"}

        results = session_client.get(_app(workspace, project, "logs"), params).json()["results"]
        assert [r["kind"] for r in results] == [K.LOG_ENTRY]
        assert session_client.get(_app(workspace, project, "heatmap"), params).json()["summary"]["events"] == 1
        catalog = session_client.get(_app(workspace, project, "settings")).json()["catalog"]
        assert catalog[-1] == {"group": "log", "kinds": [{"key": K.LOG_ENTRY, "default": True}]}

    @pytest.mark.django_db
    def test_app_endpoint_creates_with_the_session_user(self, session_client, workspace, project, create_user):
        response = session_client.post(_app(workspace, project, "logs"), {"text": "From the UI"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert ActivityEvent.objects.get(id=response.json()["id"]).actor_id == create_user.id


@pytest.mark.unit
class TestLogMigration:
    @pytest.mark.django_db
    def test_saved_settings_start_counting_log_entries(self, project):
        from importlib import import_module

        from django.apps import apps

        migration = import_module("plane.liviere.migrations.0003_activity_log")
        ProjectActivitySettings.objects.create(project=project, kinds=[K.ISSUE_STATE])

        migration.count_log_entries(apps, None)
        assert ProjectActivitySettings.objects.get(project=project).kinds == [K.ISSUE_STATE, K.LOG_ENTRY]
        migration.count_log_entries(apps, None)
        assert ProjectActivitySettings.objects.get(project=project).kinds == [K.ISSUE_STATE, K.LOG_ENTRY]
        migration.stop_counting_log_entries(apps, None)
        assert ProjectActivitySettings.objects.get(project=project).kinds == [K.ISSUE_STATE]
