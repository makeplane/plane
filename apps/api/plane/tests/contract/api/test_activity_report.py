# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Project activity time report (fork Liviere/plane, plane/liviere/activity/report.py) through /api/v1/
# (API key) and the app (session): sources, files, settings and permissions. The counting itself is tested
# in plane/tests/unit/liviere/test_activity_report.py; the numbers here are the same hand-counted examples.

import io
import logging
from datetime import datetime, timezone as dt_timezone
from uuid import uuid4
from zoneinfo import ZoneInfo

import pytest
from pypdf import PdfReader
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, Project, ProjectMember, User, WorkspaceMember
from plane.db.models.api import APIToken
from plane.liviere.activity import kinds as K
from plane.liviere.models import ActivityEvent, ProjectActivitySettings

WARSAW = ZoneInfo("Europe/Warsaw")
DAY = "2026-11-16"
POLISH_NOTE = "Zażółć gęślą jaźń: poprawki w raporcie"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Raporty Łódź", identifier="RP", workspace=workspace, created_by=create_user, timezone="Europe/Warsaw"
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
    token = APIToken.objects.create(user=user, label="report", token=f"plane_api_{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def _session_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _local(clock, day=DAY):
    year, month, dom = map(int, day.split("-"))
    hour, minute = map(int, clock.split(":"))
    return datetime(year, month, dom, hour, minute, tzinfo=WARSAW).astimezone(dt_timezone.utc)


def _action(project, actor, clock, day=DAY, kind=K.ISSUE_STATE):
    return ActivityEvent.objects.create(
        workspace=project.workspace,
        project=project,
        actor=actor,
        occurred_at=_local(clock, day),
        kind=kind,
        source="test",
    )


def _entry(project, actor, start, end=None, day=DAY, note="Work", issue=None):
    return ActivityEvent.objects.create(
        workspace=project.workspace,
        project=project,
        actor=actor,
        occurred_at=_local(start, day),
        ended_at=_local(end, day) if end else None,
        kind=K.LOG_ENTRY,
        source=ActivityEvent.SOURCE_LOG,
        note=note,
        issue_id=issue.id if issue else None,
    )


def _v1(workspace, project, path="report"):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/activity/{path}/"


def _app(workspace, project, path="report"):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/liviere/activity/{path}/"


def _p5_example(project, user):
    # The plan's P5 example: log 10:00-11:00 (60), series 10:10-10:25 and 14:00-14:13 (28), mixed 73
    _entry(project, user, "10:00", "11:00", note=POLISH_NOTE)
    for clock in ("10:10", "10:20", "14:00", "14:08"):
        _action(project, user, clock)


def _day(response, day=DAY):
    return next(row for row in response.json()["days"] if row["date"] == day)


@pytest.mark.contract
class TestReportSources:
    @pytest.mark.django_db
    @pytest.mark.parametrize("source, result", [("mixed", 73), ("log", 60), ("grid", 28)])
    def test_each_source_on_the_p5_example(self, api_key_client, workspace, project, create_user, source, result):
        _p5_example(project, create_user)

        response = api_key_client.get(_v1(workspace, project), {"from": DAY, "to": DAY, "source": source})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["source"] == source
        assert data["mixed_rule"] == "log_plus_actions"
        assert data["timezone"] == "Europe/Warsaw"
        assert (data["series_gap_minutes"], data["series_padding_minutes"]) == (15, 5)
        row = {key: value for key, value in _day(response).items() if key.endswith("_minutes")}
        assert row == {"log_minutes": 60, "grid_minutes": 28, "difference_minutes": 32, "result_minutes": result}
        assert data["totals"] == row
        assert data["people"] == [
            {
                "actor": {"id": str(create_user.id), "display_name": "tomasz"},
                "log_minutes": 60,
                "grid_minutes": 28,
                "difference_minutes": 32,
                "result_minutes": result,
            }
        ]

    @pytest.mark.django_db
    @pytest.mark.parametrize("clocks, minutes", [(["10:13", "10:16"], 8), (["13:00", "13:16"], 10)])
    def test_the_ls9_examples(self, api_key_client, workspace, project, create_user, clocks, minutes):
        for clock in clocks:
            _action(project, create_user, clock)

        response = api_key_client.get(_v1(workspace, project), {"from": DAY, "to": DAY, "source": "grid"})

        assert _day(response)["grid_minutes"] == minutes

    @pytest.mark.django_db
    def test_a_series_from_the_day_before_counts_the_same_alone_and_in_a_month(
        self, api_key_client, workspace, project, create_user
    ):
        # 23:50 on the 15th joins 00:02 on the 16th: 7 minutes on the 16th, 10 on the 15th
        _action(project, create_user, "23:50", day="2026-11-15")
        _action(project, create_user, "00:02")

        alone = api_key_client.get(_v1(workspace, project), {"from": DAY, "to": DAY, "source": "grid"})
        # The 15th alone still sees 00:02 on the 16th, which extends its series to midnight
        day_before = api_key_client.get(
            _v1(workspace, project), {"from": "2026-11-15", "to": "2026-11-15", "source": "grid"}
        )
        month = api_key_client.get(
            _v1(workspace, project), {"from": "2026-11-01", "to": "2026-11-30", "source": "grid"}
        )

        assert _day(alone)["grid_minutes"] == 7
        assert _day(day_before, "2026-11-15")["grid_minutes"] == 10
        assert _day(month)["grid_minutes"] == 7
        assert _day(month, "2026-11-15")["grid_minutes"] == 10
        assert month.json()["totals"]["grid_minutes"] == 17

    @pytest.mark.django_db
    def test_log_entries_count_whatever_the_settings_count(self, api_key_client, workspace, project, create_user):
        ProjectActivitySettings.objects.create(project=project, enabled=True, kinds=[K.ISSUE_STATE])
        _p5_example(project, create_user)
        _action(project, create_user, "16:00", kind=K.ISSUE_COMMENT)  # not counted by the settings

        response = api_key_client.get(_v1(workspace, project), {"from": DAY, "to": DAY})

        row = _day(response)
        assert (row["log_minutes"], row["grid_minutes"], row["result_minutes"]) == (60, 28, 73)
        assert response.json()["kinds"] == [K.ISSUE_STATE]

    @pytest.mark.django_db
    def test_people_and_the_actor_filter(self, api_key_client, workspace, project, create_user):
        agent = _member(project, 15, "agent")
        # The plan's P3 example: 60 + 60 minutes of people, 90 minutes of the project
        _entry(project, create_user, "10:00", "11:00")
        _entry(project, agent, "10:30", "11:30")
        _entry(project, agent, "10:45", "11:15")

        both = api_key_client.get(_v1(workspace, project), {"from": DAY, "to": DAY, "source": "log"}).json()
        mine = api_key_client.get(
            _v1(workspace, project), {"from": DAY, "to": DAY, "source": "log", "actor": str(agent.id)}
        ).json()

        assert both["totals"]["log_minutes"] == 90
        assert sorted((p["actor"]["display_name"], p["log_minutes"]) for p in both["people"]) == [
            ("agent", 60),
            ("tomasz", 60),
        ]
        assert mine["totals"]["log_minutes"] == 60
        assert mine["actor"] == {"id": str(agent.id), "display_name": "agent"}

    @pytest.mark.django_db
    def test_the_actor_filter_names_only_members_of_the_workspace(self, api_key_client, workspace, project):
        outsider = User.objects.create(email=f"out-{uuid4().hex[:8]}@plane.so", username=f"out_{uuid4().hex[:8]}")
        outsider.display_name = "outsider"
        outsider.save(update_fields=["display_name"])
        member = _member(project, 15, "quiet")
        WorkspaceMember.objects.get_or_create(workspace=workspace, member=member, defaults={"role": 15})

        unknown = api_key_client.get(_v1(workspace, project), {"from": DAY, "to": DAY, "actor": str(outsider.id)})
        quiet = api_key_client.get(_v1(workspace, project), {"from": DAY, "to": DAY, "actor": str(member.id)})

        assert unknown.json()["actor"] == {"id": str(outsider.id), "display_name": None}
        assert quiet.json()["actor"] == {"id": str(member.id), "display_name": "quiet"}

    @pytest.mark.django_db
    def test_entries_are_listed_under_their_day(self, api_key_client, workspace, project, create_user):
        issue = Issue.objects.create(name="Raport", project=project, workspace=workspace, created_by=create_user)
        _entry(project, create_user, "10:00", "11:00", note=POLISH_NOTE, issue=issue)
        _entry(project, create_user, "12:00", note="Bez końca")

        data = api_key_client.get(_v1(workspace, project), {"from": DAY, "to": DAY}).json()
        hidden = api_key_client.get(_v1(workspace, project), {"from": DAY, "to": DAY, "entries": "0"}).json()

        entries = _day_rows(data)[DAY]
        assert [(e["start"], e["end"], e["note"]) for e in entries] == [
            ("2026-11-16T10:00:00+01:00", "2026-11-16T11:00:00+01:00", POLISH_NOTE),
            ("2026-11-16T12:00:00+01:00", None, "Bez końca"),
        ]
        assert entries[0]["issue"]["identifier"] == f"RP-{issue.sequence_id}"
        assert data["days"][0]["log_minutes"] == 75
        assert hidden["entries_included"] is False
        assert all(day["entries"] == [] for day in hidden["days"])

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "params",
        [{"source": "quarters"}, {"export": "xlsx"}, {"lang": "de"}, {"from": "2026-11-30", "to": "2026-11-01"}],
    )
    def test_invalid_parameters(self, api_key_client, workspace, project, params):
        assert api_key_client.get(_v1(workspace, project), params).status_code == status.HTTP_400_BAD_REQUEST


def _day_rows(data):
    return {day["date"]: day["entries"] for day in data["days"]}


@pytest.mark.contract
class TestReportFiles:
    @pytest.mark.django_db
    def test_markdown_has_the_numbers_of_the_view(self, api_key_client, workspace, project, create_user):
        _p5_example(project, create_user)

        response = api_key_client.get(_v1(workspace, project), {"from": DAY, "to": DAY, "export": "md", "lang": "pl"})

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/markdown; charset=utf-8"
        assert response["Content-Disposition"] == f'attachment; filename="RP-activity-{DAY}_{DAY}.md"'
        text = response.content.decode("utf-8")
        assert text.startswith("# Raport aktywności: Raporty Łódź\n")
        assert "| 2026-11-16 | 1 h 00 min | 28 min | 32 min | 1 h 13 min |" in text
        assert "| **Razem** | **1 h 00 min** | **28 min** | **32 min** | **1 h 13 min** |" in text
        assert "| tomasz | 1 h 00 min | 28 min | 32 min | 1 h 13 min |" in text
        assert "Mieszane: dziennik + akcje poza dziennikiem" in text
        assert "nie z kwadransów" in text
        assert "- **10:00–11:00 · tomasz**\n  > " + POLISH_NOTE in text

    @pytest.mark.django_db
    def test_markdown_in_english_for_one_source(self, api_key_client, workspace, project, create_user):
        _p5_example(project, create_user)

        text = api_key_client.get(
            _v1(workspace, project), {"from": DAY, "to": DAY, "export": "md", "lang": "en", "source": "grid"}
        ).content.decode("utf-8")

        assert "| Date | Series |" in text
        assert "| 2026-11-16 | 28 min |" in text
        assert "not from quarter-hours" in text
        assert "Work log |" not in text

    @pytest.mark.django_db
    def test_markdown_texts_cannot_add_sections_tables_or_html(self, api_key_client, workspace, project, create_user):
        project.name = "Projekt <b>|x|</b>"
        project.save(update_fields=["name"])
        forged = "Zrobione.\n\n## People\n| tomasz | 99 h |\n<script>alert(1)</script>\n- lista\n1. punkt"
        _entry(project, create_user, "10:00", "11:00", note=forged)

        text = api_key_client.get(
            _v1(workspace, project), {"from": DAY, "to": DAY, "export": "md", "lang": "en"}
        ).content.decode("utf-8")

        assert "# Activity report: Projekt &lt;b&gt;\\|x\\|&lt;/b&gt;\n" in text
        assert [line for line in text.splitlines() if line.startswith("## ")] == [
            "## Days",
            "## People",
            "## Work log entries",
        ]
        assert "  > Zrobione.\n  >\n  > \\## People\n  > \\| tomasz \\| 99 h \\|\n" in text
        assert "  > &lt;script&gt;alert(1)&lt;/script&gt;\n  > \\- lista\n  > 1\\. punkt" in text
        assert "<script>" not in text
        assert "| tomasz | 99 h |" not in text

    @pytest.mark.django_db
    def test_days_without_activity_are_left_out_of_markdown_and_pdf(
        self, api_key_client, workspace, project, create_user
    ):
        _p5_example(project, create_user)
        params = {"from": "2026-11-15", "to": "2026-11-17", "lang": "pl"}

        data = api_key_client.get(_v1(workspace, project), params).json()
        markdown = api_key_client.get(_v1(workspace, project), {**params, "export": "md"}).content.decode("utf-8")
        pdf = api_key_client.get(_v1(workspace, project), {**params, "export": "pdf"})
        csv = api_key_client.get(_v1(workspace, project), {**params, "export": "csv"}).content.decode("utf-8-sig")

        # JSON and CSV keep every day
        assert [day["date"] for day in data["days"]] == ["2026-11-15", "2026-11-16", "2026-11-17"]
        assert csv.splitlines()[1:] == [
            "2026-11-15,0,0,0,0",
            "2026-11-16,60,28,32,73",
            "2026-11-17,0,0,0,0",
            "Razem,60,28,32,73",
        ]
        # The tables of the files only the 16th, the totals unchanged
        assert "| 2026-11-16 | 1 h 00 min | 28 min | 32 min | 1 h 13 min |" in markdown
        assert "| 2026-11-15 |" not in markdown
        assert "| 2026-11-17 |" not in markdown
        assert "| **Razem** | **1 h 00 min** | **28 min** | **32 min** | **1 h 13 min** |" in markdown
        assert "Pominięto dni bez aktywności: 2." in markdown
        text = "\n".join(page.extract_text() for page in PdfReader(io.BytesIO(pdf.content)).pages)
        assert "2026-11-16 1 h 00 min 28 min 32 min 1 h 13 min" in text
        assert "2026-11-15" not in text.replace("2026-11-15 – 2026-11-17", "")
        assert "Pominięto dni bez aktywności: 2." in text

    @pytest.mark.django_db
    def test_a_period_without_activity(self, api_key_client, workspace, project):
        params = {"from": "2026-11-15", "to": "2026-11-17", "lang": "pl"}

        markdown = api_key_client.get(_v1(workspace, project), {**params, "export": "md"}).content.decode("utf-8")
        pdf = api_key_client.get(_v1(workspace, project), {**params, "export": "pdf"})

        assert "## Dni\n\nBrak aktywności w tym okresie.\n" in markdown
        assert "| Data |" not in markdown
        assert "## Osoby" not in markdown
        assert "Pominięto" not in markdown
        text = "\n".join(page.extract_text() for page in PdfReader(io.BytesIO(pdf.content)).pages)
        assert "Brak aktywności w tym okresie." in text
        assert "Razem" not in text

    @pytest.mark.django_db
    def test_csv_has_the_numbers_of_the_view(self, api_key_client, workspace, project, create_user):
        _p5_example(project, create_user)
        _action(project, create_user, "09:00", day="2026-11-17")

        response = api_key_client.get(
            _v1(workspace, project), {"from": DAY, "to": "2026-11-17", "export": "csv", "lang": "pl"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/csv; charset=utf-8"
        assert response.content.startswith(b"\xef\xbb\xbf")
        lines = response.content.decode("utf-8-sig").splitlines()
        assert lines == [
            "Data,Dziennik (min),Serie (min),Różnica (dziennik − serie) (min),Wynik (min)",
            "2026-11-16,60,28,32,73",
            "2026-11-17,0,5,-5,5",
            "Razem,60,33,27,78",
        ]

    @pytest.mark.django_db
    def test_pdf_has_the_numbers_of_the_view_and_polish_letters(self, api_key_client, workspace, project, create_user):
        _p5_example(project, create_user)
        _entry(project, create_user, "15:00", "15:30", note="Emoji 🚀 i tabulator\tw tekście")

        response = api_key_client.get(_v1(workspace, project), {"from": DAY, "to": DAY, "export": "pdf", "lang": "pl"})

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"
        assert response["Content-Disposition"] == f'attachment; filename="RP-activity-{DAY}_{DAY}.pdf"'
        assert response.content.startswith(b"%PDF-")
        reader = PdfReader(io.BytesIO(response.content))
        text = "\n".join(page.extract_text() for page in reader.pages)
        assert "Raport aktywności: Raporty Łódź" in text
        assert "Mieszane: dziennik + akcje poza dziennikiem" in text
        assert "nie z kwadransów" in text
        # Log 60 + 30, series 28, mixed 73 + 30
        assert "2026-11-16 1 h 30 min 28 min 1 h 02 min 1 h 43 min" in text
        assert "10:00–11:00 · tomasz" in text
        assert POLISH_NOTE in text
        # A character the font lacks becomes "?"
        assert "Emoji ? i tabulator w tekście" in text
        assert "Strona 1 z 1" in text

    @pytest.mark.django_db
    def test_pdf_in_english(self, api_key_client, workspace, project, create_user):
        _p5_example(project, create_user)

        response = api_key_client.get(
            _v1(workspace, project), {"from": DAY, "to": DAY, "export": "pdf", "lang": "en", "entries": "0"}
        )

        text = "\n".join(page.extract_text() for page in PdfReader(io.BytesIO(response.content)).pages)
        assert "Activity report: Raporty Łódź" in text
        assert "not from quarter-hours" in text
        assert "Page 1 of 1" in text
        assert POLISH_NOTE not in text

    @pytest.mark.django_db
    def test_the_app_endpoint_gives_the_same_report(self, session_client, workspace, project, create_user):
        _p5_example(project, create_user)

        response = session_client.get(_app(workspace, project), {"from": DAY, "to": DAY, "export": "csv"})

        assert response.status_code == status.HTTP_200_OK
        assert response.content.decode("utf-8-sig").splitlines()[1] == "2026-11-16,60,28,32,73"

    @pytest.mark.django_db
    def test_entry_texts_stay_out_of_the_server_logs(self, api_key_client, workspace, project, create_user, caplog):
        _p5_example(project, create_user)

        with caplog.at_level(logging.DEBUG):
            for export in (None, "md", "csv", "pdf"):
                params = {"from": DAY, "to": DAY, **({"export": export} if export else {})}
                assert api_key_client.get(_v1(workspace, project), params).status_code == status.HTTP_200_OK

        assert POLISH_NOTE not in caplog.text
        assert "Zażółć" not in caplog.text
        # Not even the glyphs of the PDF
        assert not [record for record in caplog.records if record.name.startswith(("fpdf", "fontTools"))]


@pytest.mark.contract
class TestReportSettingsAndPermissions:
    @pytest.mark.django_db
    def test_series_thresholds_in_the_settings(self, session_client, workspace, project, create_user):
        url = _app(workspace, project, "settings")
        assert session_client.get(url).json()["series_gap_minutes"] == 15

        response = session_client.patch(url, {"series_gap_minutes": 20, "series_padding_minutes": 2}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert (response.json()["series_gap_minutes"], response.json()["series_padding_minutes"]) == (20, 2)

        # 13:00 and 13:16 now form one series: 16 + 2 = 18
        _action(project, create_user, "13:00")
        _action(project, create_user, "13:16")
        report = _session_client(create_user).get(_app(workspace, project), {"from": DAY, "to": DAY}).json()
        assert report["days"][0]["grid_minutes"] == 18
        assert report["series_gap_minutes"] == 20

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "body",
        [
            {"series_gap_minutes": 0},
            {"series_gap_minutes": 121},
            {"series_gap_minutes": "15"},
            {"series_gap_minutes": True},
            {"series_padding_minutes": -1},
            {"series_gap_minutes": 4},  # below the stored padding (5)
            {"series_padding_minutes": 16},  # above the stored gap (15)
            {"series_gap_minutes": 10, "series_padding_minutes": 11},
        ],
    )
    def test_invalid_thresholds(self, session_client, workspace, project, body):
        response = session_client.patch(_app(workspace, project, "settings"), body, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_members_read_guests_do_not(self, workspace, project):
        member = _key_client(_member(project, 15, "member"))
        guest = _key_client(_member(project, 5, "guest"))
        guest_session = _session_client(_member(project, 5, "guest2"))

        assert member.get(_v1(workspace, project)).status_code == status.HTTP_200_OK
        assert member.get(_v1(workspace, project), {"export": "md"}).status_code == status.HTTP_200_OK
        assert guest.get(_v1(workspace, project)).status_code == status.HTTP_403_FORBIDDEN
        assert guest_session.get(_app(workspace, project)).status_code == status.HTTP_403_FORBIDDEN
