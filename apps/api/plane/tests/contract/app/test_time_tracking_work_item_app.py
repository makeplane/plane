# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Work item time, project issue totals, project settings and export."""

import csv
import io
from datetime import timedelta
from unittest import mock

import pytest
from django.utils import timezone
from rest_framework import status

from plane.tests.factories_time_tracking import TimeEntryFactory, build_world, client_for


@pytest.fixture
def world(db):
    return build_world()


def project_url(world, project, suffix):
    return f"/api/workspaces/{world.slug}/projects/{project.id}/{suffix}"


@pytest.mark.contract
class TestWorkItemTime:
    def test_panel(self, world):
        TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_1, duration_seconds=3600, is_billable=True)
        TimeEntryFactory(project=world.web, user=world.pia, issue=world.web_1, duration_seconds=1800)
        TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_1, duration_seconds=600)
        running = TimeEntryFactory.running(project=world.web, user=world.ana, issue=world.web_1)
        TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_2)  # another item

        data = client_for(world.cal).get(project_url(world, world.web, f"issues/{world.web_1.id}/time-entries/")).data
        assert (data["total_seconds"], data["billable_seconds"], data["entry_count"]) == (6000, 3600, 3)
        assert data["by_user"] == [
            {"user_id": str(world.ben.id), "total_seconds": 4200},
            {"user_id": str(world.pia.id), "total_seconds": 1800},
        ]
        assert data["entries"][0]["id"] == str(running.id) and len(data["entries"]) == 4
        assert [e["id"] for e in data["running"]] == [str(running.id)]

    def test_secret_project_is_hidden(self, world):
        response = client_for(world.ben).get(project_url(world, world.sec, f"issues/{world.sec_1.id}/time-entries/"))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_issue_totals(self, world):
        TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_1, duration_seconds=3600)
        TimeEntryFactory(project=world.web, user=world.pia, issue=world.web_1, duration_seconds=1800)
        TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_2, duration_seconds=600)
        TimeEntryFactory(project=world.web, user=world.ben, duration_seconds=900)  # project time
        TimeEntryFactory.running(project=world.web, user=world.ana, issue=world.web_2)
        data = client_for(world.ben).get(project_url(world, world.web, "time-entries/issue-totals/")).data
        assert data == {str(world.web_1.id): 5400, str(world.web_2.id): 600}

    @pytest.mark.parametrize("count", [1, 15])
    def test_query_count_is_flat(self, world, count, django_assert_max_num_queries):
        for _ in range(count):
            TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_1)
        client = client_for(world.ben)
        with django_assert_max_num_queries(14):
            client.get(project_url(world, world.web, f"issues/{world.web_1.id}/time-entries/"))
        with django_assert_max_num_queries(8):
            client.get(project_url(world, world.web, "time-entries/issue-totals/"))


@pytest.mark.contract
class TestSettings:
    def test_get_creates_defaults(self, world):
        data = client_for(world.ben).get(project_url(world, world.web, "time-settings/")).data
        assert data == {"project_id": str(world.web.id), "default_billable": False}

    def test_admin_updates(self, world):
        url = project_url(world, world.web, "time-settings/")
        response = client_for(world.pia).patch(url, {"default_billable": True}, format="json")
        assert response.status_code == status.HTTP_200_OK and response.data["default_billable"] is True
        # new timers pick it up
        timer = client_for(world.ben).post(
            f"/api/workspaces/{world.slug}/time-entries/timer/start/", {"project_id": str(world.web.id)}, format="json"
        )
        assert timer.data["timer"]["is_billable"] is True

    def test_member_cannot_update(self, world):
        response = client_for(world.ben).patch(
            project_url(world, world.web, "time-settings/"), {"default_billable": True}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestExport:
    def url(self, world):
        return f"/api/workspaces/{world.slug}/time-entries/export/"

    def test_csv(self, world):
        start = timezone.now().replace(microsecond=0) - timedelta(hours=3)
        world.ben.user_timezone = "Asia/Kolkata"
        world.ben.save()
        TimeEntryFactory(
            project=world.web,
            user=world.ben,
            issue=world.web_1,
            started_at=start,
            ended_at=start + timedelta(minutes=90),
            duration_seconds=5400,
            is_billable=True,
        )
        TimeEntryFactory(project=world.web, user=world.pia, duration_seconds=900)
        TimeEntryFactory.running(project=world.web, user=world.ana)

        response = client_for(world.ben).get(self.url(world), {"format": "csv"})
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"].startswith("text/csv")
        assert response["Content-Disposition"] == f'attachment; filename="time-entries-{world.slug}-all-all.csv"'
        rows = list(csv.reader(io.StringIO(response.content.decode("utf-8-sig"))))
        assert rows[0][:4] == ["Date", "Person", "Person email", "Project"]
        assert len(rows) == 3  # header + two completed entries (the running one is excluded)
        ben = next(r for r in rows[1:] if r[1] == "Ben")
        header = rows[0]
        assert ben[header.index("Work item ID")] == f"WEB-{world.web_1.sequence_id}"
        assert ben[header.index("Duration (h:mm)")] == "1:30"
        assert ben[header.index("Duration (hours)")] == "1.5"
        # local time in Ben's zone (UTC+5:30)
        local_start = (start + timedelta(hours=5, minutes=30)).strftime("%Y-%m-%d %H:%M")
        assert ben[header.index("Start")] == local_start

    def test_xlsx(self, world):
        TimeEntryFactory(project=world.web, user=world.ben)
        response = client_for(world.ben).get(self.url(world), {"format": "xlsx", "date_from": "2026-01-01"})
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        assert response.content[:2] == b"PK"
        assert "-2026-01-01-all.xlsx" in response["Content-Disposition"]

    def test_cap(self, world):
        for _ in range(3):
            TimeEntryFactory(project=world.web, user=world.ben)
        with mock.patch("plane.time_tracking.views.export.EXPORT_MAX_ROWS", 2):
            response = client_for(world.ben).get(self.url(world))
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "EXPORT_TOO_LARGE"

    def test_bad_format(self, world):
        assert client_for(world.ben).get(self.url(world), {"format": "pdf"}).status_code == 400
