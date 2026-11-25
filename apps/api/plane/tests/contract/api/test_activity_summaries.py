# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Day summaries of the project activity (fork Liviere/plane, plane/liviere/activity/summaries.py) through
# /api/v1/ (API key) and the app (session), and in the time report.

import io
from datetime import datetime, timezone as dt_timezone
from uuid import uuid4

import pytest
from freezegun import freeze_time
from pypdf import PdfReader
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, User
from plane.db.models.api import APIToken
from plane.liviere.models import ActivityDaySummary, ActivityEvent

DAY = "2026-11-16"
TEXT = "Poprawiono eksport raportu; zostały testy żółtej ścieżki."


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Podsumowania", identifier="PD", workspace=workspace, created_by=create_user, timezone="Europe/Warsaw"
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    create_user.display_name = "tomasz"
    create_user.save(update_fields=["display_name"])
    return project


def _member(project, role, name):
    user = User.objects.create(email=f"{name}-{uuid4().hex[:8]}@plane.so", username=f"{name}_{uuid4().hex[:8]}")
    user.display_name = name
    user.save(update_fields=["display_name"])
    ProjectMember.objects.create(project=project, member=user, role=role, is_active=True)
    return user


def _key_client(user):
    token = APIToken.objects.create(user=user, label="summaries", token=f"plane_api_{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def _session_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _v1(workspace, project, path="summaries"):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/activity/{path}/"


def _app(workspace, project, path="summaries"):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/liviere/activity/{path}/"


@pytest.mark.contract
class TestDaySummaries:
    @pytest.mark.django_db
    def test_write_read_replace_change_and_delete(self, api_key_client, workspace, project, create_user):
        url = _v1(workspace, project)

        created = api_key_client.post(url, {"date": DAY, "text": TEXT}, format="json")
        assert created.status_code == status.HTTP_201_CREATED
        body = created.json()
        assert (body["date"], body["text"], body["replaced"]) == (DAY, TEXT, False)
        assert body["author"]["display_name"] == "tomasz"

        # The same author and day: replaced, not a second summary
        replaced = api_key_client.post(url, {"date": DAY, "text": "Nowa wersja"}, format="json")
        assert replaced.status_code == status.HTTP_200_OK
        assert replaced.json()["replaced"] is True
        assert replaced.json()["id"] == body["id"]
        assert ActivityDaySummary.objects.filter(project=project).count() == 1

        listed = api_key_client.get(url, {"from": DAY, "to": DAY}).json()["results"]
        assert [(s["date"], s["text"]) for s in listed] == [(DAY, "Nowa wersja")]

        detail = f"{url}{body['id']}/"
        assert api_key_client.get(detail).json()["text"] == "Nowa wersja"
        changed = api_key_client.patch(detail, {"text": TEXT}, format="json")
        assert changed.status_code == status.HTTP_200_OK
        assert changed.json()["text"] == TEXT

        assert api_key_client.delete(detail).status_code == status.HTTP_204_NO_CONTENT
        assert api_key_client.get(detail).status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_one_summary_per_author(self, api_key_client, workspace, project):
        agent = _member(project, 15, "agent")
        api_key_client.post(_v1(workspace, project), {"date": DAY, "text": "Tomasz"}, format="json")
        _key_client(agent).post(_v1(workspace, project), {"date": DAY, "text": "Agent"}, format="json")

        everybody = api_key_client.get(_v1(workspace, project), {"from": DAY, "to": DAY}).json()["results"]
        agent_only = api_key_client.get(
            _v1(workspace, project), {"from": DAY, "to": DAY, "actor": str(agent.id)}
        ).json()["results"]

        assert sorted(s["text"] for s in everybody) == ["Agent", "Tomasz"]
        assert [s["text"] for s in agent_only] == ["Agent"]

    @pytest.mark.django_db
    @freeze_time("2026-11-16 22:30:00")
    def test_the_day_defaults_to_today_in_the_project_time_zone(self, api_key_client, workspace, project):
        # 22:30 UTC is 23:30 in Warsaw: still the 16th; the 17th is in the future
        response = api_key_client.post(_v1(workspace, project), {"text": TEXT}, format="json")
        assert response.json()["date"] == "2026-11-16"
        future = api_key_client.post(_v1(workspace, project), {"date": "2026-11-17", "text": TEXT}, format="json")
        assert future.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "body",
        [
            {"date": DAY},
            {"date": DAY, "text": "   "},
            {"date": DAY, "text": "x" * 8001},
            {"date": "16.11.2026", "text": "x"},
        ],
    )
    def test_invalid_summaries(self, api_key_client, workspace, project, body):
        assert api_key_client.post(_v1(workspace, project), body, format="json").status_code == 400

    @pytest.mark.django_db
    def test_only_the_author_or_an_admin_changes_a_summary(self, workspace, project, create_user):
        member = _member(project, 15, "member")
        other = _member(project, 15, "other")
        guest = _member(project, 5, "guest")
        created = _key_client(member).post(_v1(workspace, project), {"date": DAY, "text": TEXT}, format="json")
        detail = f"{_v1(workspace, project)}{created.json()['id']}/"

        assert _key_client(other).get(detail).status_code == status.HTTP_200_OK
        assert _key_client(other).patch(detail, {"text": "x"}, format="json").status_code == 403
        assert _key_client(other).delete(detail).status_code == 403
        assert _key_client(guest).get(_v1(workspace, project)).status_code == 403
        assert _key_client(guest).post(_v1(workspace, project), {"text": "x"}, format="json").status_code == 403
        # create_user is the project admin
        assert _key_client(create_user).patch(detail, {"text": "Admin"}, format="json").status_code == 200
        assert _key_client(create_user).delete(detail).status_code == 204

    @pytest.mark.django_db
    def test_the_app_endpoints_write_with_the_session_user(self, workspace, project):
        member = _member(project, 15, "member")
        client = _session_client(member)

        response = client.post(_app(workspace, project), {"date": DAY, "text": TEXT}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["author"]["id"] == str(member.id)
        detail = f"{_app(workspace, project)}{response.json()['id']}/"
        assert client.patch(detail, {"text": "Zmiana"}, format="json").json()["text"] == "Zmiana"

    @pytest.mark.django_db
    def test_a_body_that_is_not_an_object(self, api_key_client, session_client, workspace, project):
        created = api_key_client.post(_v1(workspace, project), {"date": DAY, "text": TEXT}, format="json")
        detail = f"{_v1(workspace, project)}{created.json()['id']}/"

        assert api_key_client.post(_v1(workspace, project), ["text"], format="json").status_code == 400
        assert api_key_client.patch(detail, ["text"], format="json").status_code == 400
        # The same for the log entries and the settings
        assert api_key_client.post(_v1(workspace, project, "logs"), ["text"], format="json").status_code == 400
        assert session_client.patch(_app(workspace, project, "settings"), ["enabled"], format="json").status_code == 400

    @pytest.mark.django_db
    def test_a_summary_is_not_activity(self, api_key_client, workspace, project):
        api_key_client.post(_v1(workspace, project), {"date": DAY, "text": TEXT}, format="json")
        assert ActivityEvent.objects.filter(project=project).count() == 0


@pytest.mark.contract
class TestSummariesInTheReport:
    @pytest.mark.django_db
    def test_report_json_markdown_and_pdf_show_the_summaries_of_their_day(
        self, api_key_client, workspace, project, create_user
    ):
        api_key_client.post(_v1(workspace, project), {"date": DAY, "text": TEXT}, format="json")
        api_key_client.post(_v1(workspace, project), {"date": "2026-11-10", "text": "Poza okresem"}, format="json")
        ActivityEvent.objects.create(
            workspace=workspace,
            project=project,
            actor=create_user,
            occurred_at=datetime(2026, 11, 16, 9, 0, tzinfo=dt_timezone.utc),
            kind="issue.state",
            source="test",
        )
        params = {"from": "2026-11-15", "to": DAY}

        data = api_key_client.get(_v1(workspace, project, "report"), params).json()
        markdown = api_key_client.get(
            _v1(workspace, project, "report"), {**params, "export": "md", "lang": "pl"}
        ).content.decode("utf-8")
        pdf = api_key_client.get(_v1(workspace, project, "report"), {**params, "export": "pdf", "lang": "pl"})
        csv = api_key_client.get(_v1(workspace, project, "report"), {**params, "export": "csv"}).content

        days = {day["date"]: day["summaries"] for day in data["days"]}
        assert days["2026-11-15"] == []
        assert [(s["author"]["display_name"], s["text"]) for s in days[DAY]] == [("tomasz", TEXT)]
        # A summary adds no time: only the one action, 5 minutes
        assert data["totals"]["grid_minutes"] == 5
        assert "## Podsumowania dni\n\n### 2026-11-16\n\n**tomasz**\n\n> " + TEXT in markdown
        assert "Poza okresem" not in markdown
        text = "\n".join(page.extract_text() for page in PdfReader(io.BytesIO(pdf.content)).pages)
        assert "Podsumowania dni" in text
        assert TEXT in text
        assert TEXT.encode() not in csv
