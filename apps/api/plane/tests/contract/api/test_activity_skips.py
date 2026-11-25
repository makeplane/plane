# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Skipped periods of the project activity (fork Liviere/plane, plane/liviere/activity/skips.py): changed by
# project admins in the app, read through /api/v1/, left out of the time report.

import io
from datetime import datetime, timezone as dt_timezone
from uuid import uuid4
from zoneinfo import ZoneInfo

import pytest
from pypdf import PdfReader
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, User
from plane.db.models.api import APIToken
from plane.liviere.activity import kinds as K
from plane.liviere.models import ActivityEvent, ActivitySkipPeriod

WARSAW = ZoneInfo("Europe/Warsaw")
NIGHT = {"starts_at": "2026-11-16T22:00", "ends_at": "2026-11-17T06:00", "description": "Nocne testy automatów"}


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Pomijane", identifier="PM", workspace=workspace, created_by=create_user, timezone="Europe/Warsaw"
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


def _member(project, role, name):
    user = User.objects.create(email=f"{name}-{uuid4().hex[:8]}@plane.so", username=f"{name}_{uuid4().hex[:8]}")
    ProjectMember.objects.create(project=project, member=user, role=role, is_active=True)
    return user


def _key_client(user):
    token = APIToken.objects.create(user=user, label="skips", token=f"plane_api_{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def _session_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _v1(workspace, project, path="skipped-periods"):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/activity/{path}/"


def _app(workspace, project, path="skipped-periods"):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/liviere/activity/{path}/"


def _local(day, clock):
    year, month, dom = map(int, day.split("-"))
    hour, minute = map(int, clock.split(":"))
    return datetime(year, month, dom, hour, minute, tzinfo=WARSAW).astimezone(dt_timezone.utc)


def _ls11_example(project, user):
    # Actions 21:50, 23:00, 02:00, 06:10; entries 21:30-22:30 and 23:00-01:00 (LS-11)
    for day, clock in (
        ("2026-11-16", "21:50"),
        ("2026-11-16", "23:00"),
        ("2026-11-17", "02:00"),
        ("2026-11-17", "06:10"),
    ):
        ActivityEvent.objects.create(
            workspace=project.workspace,
            project=project,
            actor=user,
            occurred_at=_local(day, clock),
            kind=K.ISSUE_STATE,
            source="test",
        )
    for start, end in (
        (("2026-11-16", "21:30"), ("2026-11-16", "22:30")),
        (("2026-11-16", "23:00"), ("2026-11-17", "01:00")),
    ):
        ActivityEvent.objects.create(
            workspace=project.workspace,
            project=project,
            actor=user,
            occurred_at=_local(*start),
            ended_at=_local(*end),
            kind=K.LOG_ENTRY,
            source=ActivityEvent.SOURCE_LOG,
            note="Praca",
        )


@pytest.mark.contract
class TestSkippedPeriods:
    @pytest.mark.django_db
    def test_admin_creates_changes_and_deletes_in_the_app(self, session_client, workspace, project, create_user):
        created = session_client.post(_app(workspace, project), NIGHT, format="json")

        assert created.status_code == status.HTTP_201_CREATED
        body = created.json()
        # Times without an offset are in the project time zone
        assert body["starts_at"] == "2026-11-16T22:00:00+01:00"
        assert body["ends_at"] == "2026-11-17T06:00:00+01:00"
        assert body["description"] == NIGHT["description"]
        assert body["created_by"] == str(create_user.id)

        detail = f"{_app(workspace, project)}{body['id']}/"
        changed = session_client.patch(detail, {"ends_at": "2026-11-17T07:00:00+01:00"}, format="json")
        assert changed.status_code == status.HTTP_200_OK
        assert changed.json()["ends_at"] == "2026-11-17T07:00:00+01:00"
        assert changed.json()["starts_at"] == body["starts_at"]

        assert session_client.delete(detail).status_code == status.HTTP_204_NO_CONTENT
        assert ActivitySkipPeriod.objects.filter(project=project).count() == 0
        assert session_client.delete(detail).status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "body",
        [
            {"ends_at": "2026-11-17T06:00"},
            {"starts_at": "2026-11-17T06:00", "ends_at": "2026-11-16T22:00"},
            {"starts_at": "2026-11-16T22:00", "ends_at": "2026-11-16T22:00"},
            {"starts_at": "2026-11-01T00:00", "ends_at": "2026-12-03T00:00"},
            {"starts_at": "16.11.2026 22:00", "ends_at": "2026-11-17T06:00"},
            {**NIGHT, "description": "x" * 501},
        ],
    )
    def test_invalid_periods(self, session_client, workspace, project, body):
        response = session_client.post(_app(workspace, project), body, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_members_and_the_api_only_read(self, session_client, workspace, project):
        session_client.post(_app(workspace, project), NIGHT, format="json")
        member = _member(project, 15, "member")
        guest = _member(project, 5, "guest")

        assert _session_client(member).post(_app(workspace, project), NIGHT, format="json").status_code == 403
        listed = _session_client(member).get(_app(workspace, project)).json()
        assert [p["description"] for p in listed["results"]] == [NIGHT["description"]]
        assert listed["timezone"] == "Europe/Warsaw"

        api = _key_client(member)
        assert [p["description"] for p in api.get(_v1(workspace, project)).json()["results"]] == [NIGHT["description"]]
        assert api.post(_v1(workspace, project), NIGHT, format="json").status_code == 405
        assert _key_client(guest).get(_v1(workspace, project)).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_a_period_filter(self, session_client, workspace, project):
        session_client.post(_app(workspace, project), NIGHT, format="json")
        url = _app(workspace, project)

        assert len(session_client.get(url, {"from": "2026-11-17", "to": "2026-11-17"}).json()["results"]) == 1
        assert len(session_client.get(url, {"from": "2026-11-18", "to": "2026-11-30"}).json()["results"]) == 0
        assert len(session_client.get(url, {"from": "2026-11-01", "to": "2026-11-15"}).json()["results"]) == 0


@pytest.mark.contract
class TestSkippedPeriodsInTheReport:
    @pytest.mark.django_db
    def test_the_ls11_example(self, api_key_client, workspace, project, create_user):
        _ls11_example(project, create_user)
        params = {"from": "2026-11-16", "to": "2026-11-17"}
        before = api_key_client.get(_v1(workspace, project, "report"), params).json()
        ActivitySkipPeriod.objects.create(
            workspace=workspace,
            project=project,
            starts_at=_local("2026-11-16", "22:00"),
            ends_at=_local("2026-11-17", "06:00"),
            description=NIGHT["description"],
        )

        after = api_key_client.get(_v1(workspace, project, "report"), params).json()

        # Without the period: log 21:30-22:30 and 23:00-01:00 = 180; series 21:50, 23:00, 02:00, 06:10 = 20
        assert (before["totals"]["log_minutes"], before["totals"]["grid_minutes"]) == (180, 20)
        # With it: log 21:30-22:00 = 30; series 21:50 and 06:10 = 10; mixed 30 + 5 = 35
        assert (after["totals"]["log_minutes"], after["totals"]["grid_minutes"]) == (30, 10)
        assert after["totals"]["result_minutes"] == 35
        assert [p["description"] for p in after["skipped"]] == [NIGHT["description"]]

        markdown = api_key_client.get(
            _v1(workspace, project, "report"), {**params, "export": "md", "lang": "pl"}
        ).content.decode("utf-8")
        assert "## Okresy pomijane\n\n- 2026-11-16 22:00 – 2026-11-17 06:00: Nocne testy automatów" in markdown
        assert "wpis albo seria liczy się tylko poza nimi" in markdown
        pdf = api_key_client.get(_v1(workspace, project, "report"), {**params, "export": "pdf", "lang": "pl"})
        text = "\n".join(page.extract_text() for page in PdfReader(io.BytesIO(pdf.content)).pages)
        assert "Okresy pomijane" in text
        assert "Nocne testy automatów" in text

    @pytest.mark.django_db
    def test_a_period_outside_the_report_is_not_listed(self, api_key_client, workspace, project):
        ActivitySkipPeriod.objects.create(
            workspace=workspace,
            project=project,
            starts_at=_local("2026-11-20", "22:00"),
            ends_at=_local("2026-11-21", "06:00"),
        )
        report = api_key_client.get(_v1(workspace, project, "report"), {"from": "2026-11-16", "to": "2026-11-17"})
        assert report.json()["skipped"] == []

    @pytest.mark.django_db
    def test_the_heatmap_keeps_counting(self, api_key_client, workspace, project, create_user):
        _ls11_example(project, create_user)
        ActivitySkipPeriod.objects.create(
            workspace=workspace,
            project=project,
            starts_at=_local("2026-11-16", "22:00"),
            ends_at=_local("2026-11-17", "06:00"),
        )
        heatmap = api_key_client.get(
            _v1(workspace, project, "heatmap"), {"from": "2026-11-16", "to": "2026-11-17"}
        ).json()
        assert heatmap["summary"]["events"] == 6
