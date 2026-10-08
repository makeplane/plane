# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status

from plane.tests.factories_time_tracking import TimeEntryFactory, build_world, client_for
from plane.time_tracking.models import TimeEntry


@pytest.fixture
def world(db):
    return build_world()


def url(world, suffix=""):
    return f"/api/workspaces/{world.slug}/time-entries/timer/{suffix}"


@pytest.mark.contract
class TestTimerFlow:
    def test_full_flow(self, world):
        ben = client_for(world.ben)

        # nothing running
        response = ben.get(url(world))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["timer"] is None and response.data["needs_review_count"] == 0
        assert response.data["server_now"].endswith("Z")

        # start on WEB-1
        response = ben.post(url(world, "start/"), {"issue_id": str(world.web_1.id)}, format="json")
        assert response.status_code == status.HTTP_201_CREATED, response.data
        first = response.data["timer"]
        assert first["is_running"] is True and first["project_id"] == str(world.web.id)
        assert first["issue_detail"]["project_identifier"] == "WEB"
        assert response.data["stopped"] is None

        # GET shows it
        assert ben.get(url(world)).data["timer"]["id"] == first["id"]

        # start on another item: the first one stops (backdate it so it isn't discarded)
        TimeEntry.objects.filter(id=first["id"]).update(started_at=timezone.now() - timedelta(minutes=20))
        response = ben.post(url(world, "start/"), {"issue_id": str(world.web_2.id)}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["stopped"]["id"] == first["id"]
        assert response.data["stopped"]["duration_seconds"] >= 1200
        assert TimeEntry.objects.filter(user=world.ben, started_at__isnull=False, ended_at__isnull=True).count() == 1

        # PATCH description and start time
        started_at = (timezone.now() - timedelta(minutes=10)).isoformat()
        response = ben.patch(url(world), {"description": "Code review", "started_at": started_at}, format="json")
        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["timer"]["description"] == "Code review"

        # a start time in the future is rejected
        future = (timezone.now() + timedelta(minutes=10)).isoformat()
        response = ben.patch(url(world), {"started_at": future}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "FUTURE_TIME" and response.data["field"] == "started_at"

        # stop
        response = ben.post(url(world, "stop/"), {}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["discarded"] is False
        assert 595 <= response.data["entry"]["duration_seconds"] <= 610

        # stop again
        response = ben.post(url(world, "stop/"), {}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data["code"] == "TIMER_NOT_RUNNING"

        # start, then discard
        ben.post(url(world, "start/"), {"project_id": str(world.web.id)}, format="json")
        assert ben.delete(url(world)).status_code == status.HTTP_204_NO_CONTENT
        assert ben.get(url(world)).data["timer"] is None
        assert ben.delete(url(world)).status_code == status.HTTP_404_NOT_FOUND

    def test_quick_stop_is_discarded(self, world):
        ben = client_for(world.ben)
        ben.post(url(world, "start/"), {"project_id": str(world.web.id)}, format="json")
        response = ben.post(url(world, "stop/"), {}, format="json")
        assert response.data["entry"] is None and response.data["discarded"] is True

    def test_get_caps_a_timer_the_job_missed(self, world):
        TimeEntryFactory.running(project=world.web, user=world.ben, started_ago=timedelta(hours=15))
        response = client_for(world.ben).get(url(world))
        assert response.data["timer"] is None and response.data["needs_review_count"] == 1

    def test_guest_and_non_member_are_forbidden(self, world, create_user):
        for user in (world.gil, create_user):
            response = client_for(user).get(url(world))
            assert response.status_code == status.HTTP_403_FORBIDDEN
            assert response.data["code"] == "FORBIDDEN"

    def test_member_outside_the_project_cannot_start(self, world):
        response = client_for(world.cal).post(url(world, "start/"), {"project_id": str(world.web.id)}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data["code"] == "PROJECT_NOT_LOGGABLE"

    def test_timers_are_per_user(self, world):
        client_for(world.ben).post(url(world, "start/"), {"project_id": str(world.web.id)}, format="json")
        assert client_for(world.pia).get(url(world)).data["timer"] is None
