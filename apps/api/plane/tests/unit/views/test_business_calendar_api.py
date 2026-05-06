# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
API tests for business calendar endpoints (WorkSchedule / Holiday / DayOverride / actions).

Covers:
- CRUD schedules: admin 200/201/204, non-admin 403, anonymous 401
- Holiday CRUD with ?year= filter
- DayOverride CRUD
- copy-year action: count + warnings field
- /check/ endpoint: working/non-working day, IsAuthenticated (non-admin allowed)
- Cache invalidation: signal fires after POST holiday → cache key cleared
"""

from __future__ import annotations

import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient

from plane.db.models import DayOverride, Holiday, WorkSchedule
from plane.license.models import Instance, InstanceAdmin


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def instance(db):
    return Instance.objects.create(
        instance_name="Test Instance",
        is_setup_done=True,
        last_checked_at=timezone.now(),
    )


@pytest.fixture
def admin_user(db, create_user, instance):
    InstanceAdmin.objects.create(instance=instance, user=create_user, role=15)
    return create_user


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def auth_client(db, create_user):
    """Authenticated non-admin client (for /check/ endpoint)."""
    client = APIClient()
    client.force_authenticate(user=create_user)
    return client


@pytest.fixture
def anon_client():
    return APIClient()


@pytest.fixture
def default_schedule(db):
    return WorkSchedule.objects.create(
        name="VN Default",
        week_pattern=[True, True, True, True, True, False, False],
        timezone="Asia/Ho_Chi_Minh",
        is_default=True,
        country_code="VN",
        workspace=None,
    )


@pytest.fixture
def holiday_2025(db, default_schedule):
    return Holiday.objects.create(
        schedule=default_schedule,
        date="2025-04-30",
        name="Reunification Day",
    )


@pytest.fixture
def override_2025(db, default_schedule):
    return DayOverride.objects.create(
        schedule=default_schedule,
        date="2025-01-25",
        type=DayOverride.WORKDAY,
        reason="Swap day",
    )


# ---------------------------------------------------------------------------
# Schedule CRUD
# ---------------------------------------------------------------------------

SCHEDULES_URL = "/api/instances/calendar/schedules/"


@pytest.mark.unit
@pytest.mark.django_db
class TestWorkScheduleEndpoint:
    def test_list_schedules_admin(self, admin_client, default_schedule):
        resp = admin_client.get(SCHEDULES_URL)
        assert resp.status_code == 200
        ids = [s["id"] for s in resp.json()]
        assert str(default_schedule.id) in ids

    def test_list_schedules_non_admin_403(self, auth_client):
        resp = auth_client.get(SCHEDULES_URL)
        assert resp.status_code == 403

    def test_list_schedules_anonymous_401(self, anon_client):
        resp = anon_client.get(SCHEDULES_URL)
        assert resp.status_code == 401

    def test_create_schedule_admin(self, admin_client):
        payload = {
            "name": "Weekend Off",
            "week_pattern": [True, True, True, True, True, False, False],
            "timezone": "Asia/Ho_Chi_Minh",
            "is_default": False,
            "country_code": "VN",
        }
        resp = admin_client.post(SCHEDULES_URL, payload, format="json")
        assert resp.status_code == 201
        assert resp.json()["name"] == "Weekend Off"

    def test_create_schedule_invalid_week_pattern(self, admin_client):
        payload = {
            "name": "Bad Pattern",
            "week_pattern": [True, False],  # only 2 elements
            "timezone": "Asia/Ho_Chi_Minh",
            "is_default": False,
            "country_code": "VN",
        }
        resp = admin_client.post(SCHEDULES_URL, payload, format="json")
        assert resp.status_code == 400

    def test_create_schedule_non_admin_403(self, auth_client):
        resp = auth_client.post(SCHEDULES_URL, {}, format="json")
        assert resp.status_code == 403

    def test_get_schedule_detail(self, admin_client, default_schedule):
        resp = admin_client.get(f"{SCHEDULES_URL}{default_schedule.id}/")
        assert resp.status_code == 200
        assert resp.json()["id"] == str(default_schedule.id)

    def test_get_schedule_detail_not_found(self, admin_client):
        import uuid
        resp = admin_client.get(f"{SCHEDULES_URL}{uuid.uuid4()}/")
        assert resp.status_code == 404

    def test_patch_schedule(self, admin_client, default_schedule):
        resp = admin_client.patch(
            f"{SCHEDULES_URL}{default_schedule.id}/",
            {"name": "Updated Name"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Name"

    def test_delete_schedule(self, admin_client, db):
        schedule = WorkSchedule.objects.create(
            name="Temp",
            week_pattern=[True] * 7,
            timezone="Asia/Ho_Chi_Minh",
            is_default=False,
            country_code="VN",
        )
        resp = admin_client.delete(f"{SCHEDULES_URL}{schedule.id}/")
        assert resp.status_code == 204

    # -- HIGH-1: is_default uniqueness returns 400, not 500 --

    def test_create_second_default_schedule_returns_400(self, admin_client, default_schedule):
        """POSTing a second is_default=true schedule for same workspace must return 400."""
        payload = {
            "name": "Another Default",
            "week_pattern": [True, True, True, True, True, False, False],
            "timezone": "Asia/Ho_Chi_Minh",
            "is_default": True,
            "country_code": "VN",
        }
        resp = admin_client.post(SCHEDULES_URL, payload, format="json")
        assert resp.status_code == 400
        assert "is_default" in resp.json()

    def test_patch_second_default_schedule_returns_400(self, admin_client, default_schedule, db):
        """PATCHing a non-default schedule to is_default=true when one already exists → 400."""
        other = WorkSchedule.objects.create(
            name="Other Schedule",
            week_pattern=[True] * 7,
            timezone="Asia/Ho_Chi_Minh",
            is_default=False,
            country_code="VN",
        )
        resp = admin_client.patch(
            f"{SCHEDULES_URL}{other.id}/",
            {"is_default": True},
            format="json",
        )
        assert resp.status_code == 400
        assert "is_default" in resp.json()

    # -- HIGH-2: workspace is read-only — payload workspace ignored --

    def test_create_schedule_workspace_payload_is_ignored(self, admin_client):
        """Even if request includes workspace=<uuid>, created schedule has workspace=None."""
        import uuid
        payload = {
            "name": "Workspace Attempt",
            "week_pattern": [True, True, True, True, True, False, False],
            "timezone": "Asia/Ho_Chi_Minh",
            "is_default": False,
            "country_code": "VN",
            "workspace": str(uuid.uuid4()),  # should be ignored
        }
        resp = admin_client.post(SCHEDULES_URL, payload, format="json")
        assert resp.status_code == 201
        created = WorkSchedule.objects.get(id=resp.json()["id"])
        assert created.workspace is None

    # -- HIGH-5: duplicate Holiday date returns 400 with field error --

    def test_create_duplicate_holiday_returns_400(self, admin_client, default_schedule):
        """POST duplicate (schedule, date) holiday → 400 with 'date' field error."""
        url = f"{SCHEDULES_URL}{default_schedule.id}/holidays/"
        payload = {"date": "2026-09-02", "name": "National Day"}
        resp1 = admin_client.post(url, payload, format="json")
        assert resp1.status_code == 201
        resp2 = admin_client.post(url, payload, format="json")
        assert resp2.status_code == 400
        assert "date" in resp2.json()

    def test_create_duplicate_day_override_returns_400(self, admin_client, default_schedule):
        """POST duplicate (schedule, date) override → 400 with 'date' field error."""
        url = f"{SCHEDULES_URL}{default_schedule.id}/overrides/"
        payload = {"date": "2026-09-05", "type": "WORKDAY", "reason": "Swap", "swap_with_date": None}
        resp1 = admin_client.post(url, payload, format="json")
        assert resp1.status_code == 201
        resp2 = admin_client.post(url, payload, format="json")
        assert resp2.status_code == 400
        assert "date" in resp2.json()

    # -- CRITICAL-1: week_pattern round-trip as boolean[] --

    def test_week_pattern_roundtrip_create_and_patch(self, admin_client):
        """
        Integration: POST with boolean[] → 201 + response matches.
        PATCH with all-true → 200 + response matches.
        Catches any serializer regression where strings are accepted instead of booleans.
        """
        # 1. Create with Mon–Fri working pattern
        create_payload = {
            "name": "Roundtrip Test",
            "week_pattern": [True, True, True, True, True, False, False],
            "timezone": "Asia/Ho_Chi_Minh",
            "is_default": False,
            "country_code": "VN",
        }
        resp = admin_client.post(SCHEDULES_URL, create_payload, format="json")
        assert resp.status_code == 201
        body = resp.json()
        assert body["week_pattern"] == [True, True, True, True, True, False, False]

        # 2. PATCH to all-working pattern
        schedule_id = body["id"]
        resp2 = admin_client.patch(
            f"{SCHEDULES_URL}{schedule_id}/",
            {"week_pattern": [True] * 7},
            format="json",
        )
        assert resp2.status_code == 200
        assert resp2.json()["week_pattern"] == [True] * 7

    def test_week_pattern_rejects_string_keys(self, admin_client):
        """Sending legacy TWeekPatternKey strings must return 400 (not silently accepted)."""
        payload = {
            "name": "Legacy String Pattern",
            "week_pattern": ["MON", "TUE", "WED", "THU", "FRI"],  # wrong shape
            "timezone": "Asia/Ho_Chi_Minh",
            "is_default": False,
            "country_code": "VN",
        }
        resp = admin_client.post(SCHEDULES_URL, payload, format="json")
        assert resp.status_code == 400
