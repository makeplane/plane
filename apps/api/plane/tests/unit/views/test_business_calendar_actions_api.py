# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
API tests for Holiday, DayOverride, copy-year, check, and cache-invalidation endpoints.
"""

from __future__ import annotations

import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient

from plane.db.models import DayOverride, Holiday, WorkSchedule
from plane.license.models import Instance, InstanceAdmin


# ---------------------------------------------------------------------------
# Shared fixtures (duplicated intentionally — no cross-file fixture coupling)
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
    client = APIClient()
    client.force_authenticate(user=create_user)
    return client


@pytest.fixture
def anon_client():
    return APIClient()


@pytest.fixture
def schedule(db):
    return WorkSchedule.objects.create(
        name="VN Default",
        week_pattern=[True, True, True, True, True, False, False],
        timezone="Asia/Ho_Chi_Minh",
        is_default=True,
        country_code="VN",
        workspace=None,
    )


# ---------------------------------------------------------------------------
# Holiday CRUD
# ---------------------------------------------------------------------------

@pytest.mark.unit
@pytest.mark.django_db
class TestHolidayEndpoint:
    def _url(self, schedule_id):
        return f"/api/instances/calendar/schedules/{schedule_id}/holidays/"

    def _detail_url(self, schedule_id, holiday_id):
        return f"/api/instances/calendar/schedules/{schedule_id}/holidays/{holiday_id}/"

    def test_list_holidays(self, admin_client, schedule):
        Holiday.objects.create(schedule=schedule, date="2025-04-30", name="Reunification Day")
        resp = admin_client.get(self._url(schedule.id))
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_list_holidays_year_filter(self, admin_client, schedule):
        Holiday.objects.create(schedule=schedule, date="2025-04-30", name="H2025")
        Holiday.objects.create(schedule=schedule, date="2026-01-01", name="H2026")
        resp = admin_client.get(self._url(schedule.id) + "?year=2025")
        assert resp.status_code == 200
        assert len(resp.json()) == 1
        assert resp.json()[0]["name"] == "H2025"

    def test_list_holidays_invalid_year(self, admin_client, schedule):
        resp = admin_client.get(self._url(schedule.id) + "?year=abc")
        assert resp.status_code == 400

    def test_create_holiday(self, admin_client, schedule):
        payload = {"date": "2025-09-02", "name": "National Day"}
        resp = admin_client.post(self._url(schedule.id), payload, format="json")
        assert resp.status_code == 201
        assert resp.json()["name"] == "National Day"

    def test_create_holiday_non_admin_403(self, auth_client, schedule):
        resp = auth_client.post(self._url(schedule.id), {}, format="json")
        assert resp.status_code == 403

    def test_patch_holiday(self, admin_client, schedule):
        h = Holiday.objects.create(schedule=schedule, date="2025-05-01", name="Labour Day")
        resp = admin_client.patch(self._detail_url(schedule.id, h.id), {"name": "Labour Day VN"}, format="json")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Labour Day VN"

    def test_delete_holiday(self, admin_client, schedule):
        h = Holiday.objects.create(schedule=schedule, date="2025-05-01", name="Labour Day")
        resp = admin_client.delete(self._detail_url(schedule.id, h.id))
        assert resp.status_code == 204
        assert not Holiday.objects.filter(pk=h.id).exists()

    def test_delete_holiday_not_found(self, admin_client, schedule):
        import uuid
        resp = admin_client.delete(self._detail_url(schedule.id, uuid.uuid4()))
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# DayOverride CRUD
# ---------------------------------------------------------------------------

@pytest.mark.unit
@pytest.mark.django_db
class TestDayOverrideEndpoint:
    def _url(self, schedule_id):
        return f"/api/instances/calendar/schedules/{schedule_id}/overrides/"

    def _detail_url(self, schedule_id, override_id):
        return f"/api/instances/calendar/schedules/{schedule_id}/overrides/{override_id}/"

    def test_list_overrides(self, admin_client, schedule):
        DayOverride.objects.create(schedule=schedule, date="2025-01-25", type="WORKDAY", reason="Swap")
        resp = admin_client.get(self._url(schedule.id))
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_list_overrides_year_filter(self, admin_client, schedule):
        DayOverride.objects.create(schedule=schedule, date="2025-01-25", type="WORKDAY", reason="2025 swap")
        DayOverride.objects.create(schedule=schedule, date="2026-02-07", type="WORKDAY", reason="2026 swap")
        resp = admin_client.get(self._url(schedule.id) + "?year=2026")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_create_override(self, admin_client, schedule):
        payload = {"date": "2025-06-28", "type": "WORKDAY", "reason": "Swap Saturday"}
        resp = admin_client.post(self._url(schedule.id), payload, format="json")
        assert resp.status_code == 201

    def test_create_override_invalid_type(self, admin_client, schedule):
        payload = {"date": "2025-07-01", "type": "INVALID"}
        resp = admin_client.post(self._url(schedule.id), payload, format="json")
        assert resp.status_code == 400

    def test_patch_override(self, admin_client, schedule):
        ov = DayOverride.objects.create(schedule=schedule, date="2025-03-01", type="WORKDAY", reason="Old")
        resp = admin_client.patch(self._detail_url(schedule.id, ov.id), {"reason": "New"}, format="json")
        assert resp.status_code == 200
        assert resp.json()["reason"] == "New"

    def test_delete_override(self, admin_client, schedule):
        ov = DayOverride.objects.create(schedule=schedule, date="2025-03-01", type="WORKDAY", reason="")
        resp = admin_client.delete(self._detail_url(schedule.id, ov.id))
        assert resp.status_code == 204


# ---------------------------------------------------------------------------
# Copy-year action
# ---------------------------------------------------------------------------

@pytest.mark.unit
@pytest.mark.django_db
class TestCopyYearEndpoint:
    def _url(self, schedule_id):
        return f"/api/instances/calendar/schedules/{schedule_id}/copy-year/"

    def test_copy_year_creates_holidays_and_overrides(self, admin_client, schedule):
        Holiday.objects.create(schedule=schedule, date="2025-04-30", name="Reunification")
        Holiday.objects.create(schedule=schedule, date="2025-05-01", name="Labour Day")
        DayOverride.objects.create(schedule=schedule, date="2025-01-25", type="WORKDAY", reason="Swap")

        resp = admin_client.post(self._url(schedule.id), {"from_year": 2025, "to_year": 2026}, format="json")
        assert resp.status_code == 200

        data = resp.json()
        assert data["copied_holidays"] == 2
        assert data["copied_overrides"] == 1
        assert "warnings" in data
        assert len(data["warnings"]) > 0

        assert Holiday.objects.filter(schedule=schedule, date__year=2026).count() == 2
        assert DayOverride.objects.filter(schedule=schedule, date__year=2026).count() == 1

    def test_copy_year_idempotent(self, admin_client, schedule):
        Holiday.objects.create(schedule=schedule, date="2025-09-02", name="National Day")
        admin_client.post(self._url(schedule.id), {"from_year": 2025, "to_year": 2026}, format="json")
        resp = admin_client.post(self._url(schedule.id), {"from_year": 2025, "to_year": 2026}, format="json")
        assert resp.status_code == 200
        # update_or_create means no duplicates
        assert Holiday.objects.filter(schedule=schedule, date__year=2026).count() == 1

    def test_copy_year_same_year_returns_400(self, admin_client, schedule):
        resp = admin_client.post(self._url(schedule.id), {"from_year": 2025, "to_year": 2025}, format="json")
        assert resp.status_code == 400

    def test_copy_year_non_admin_403(self, auth_client, schedule):
        resp = auth_client.post(self._url(schedule.id), {"from_year": 2025, "to_year": 2026}, format="json")
        assert resp.status_code == 403

    def test_copy_year_skips_feb29_in_non_leap(self, admin_client, schedule):
        # 2024 is a leap year; 2025 is not — Feb 29 should be skipped (not copied)
        Holiday.objects.create(schedule=schedule, date="2024-02-29", name="Leap Day")
        resp = admin_client.post(self._url(schedule.id), {"from_year": 2024, "to_year": 2025}, format="json")
        assert resp.status_code == 200
        data = resp.json()
        assert data["skipped"] == 1
        # 2025-02-29 is an invalid date — verify no holidays were created in 2025
        assert Holiday.objects.filter(schedule=schedule, date__year=2025).count() == 0


# ---------------------------------------------------------------------------
# Check endpoint
# ---------------------------------------------------------------------------

@pytest.mark.unit
@pytest.mark.django_db
class TestCalendarCheckEndpoint:
    CHECK_URL = "/api/instances/calendar/check/"

    def test_check_holiday_not_working(self, auth_client, schedule):
        Holiday.objects.create(schedule=schedule, date="2025-04-30", name="Reunification Day")
        resp = auth_client.get(self.CHECK_URL + f"?date=2025-04-30&schedule_id={schedule.id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_working_day"] is False
        assert "reason" in data

    def test_check_working_day(self, auth_client, schedule):
        resp = auth_client.get(self.CHECK_URL + f"?date=2025-04-28&schedule_id={schedule.id}")
        assert resp.status_code == 200
        assert resp.json()["is_working_day"] is True

    def test_check_weekend_not_working(self, auth_client, schedule):
        # 2025-04-26 is Saturday
        resp = auth_client.get(self.CHECK_URL + f"?date=2025-04-26&schedule_id={schedule.id}")
        assert resp.status_code == 200
        assert resp.json()["is_working_day"] is False

    def test_check_missing_date_400(self, auth_client, schedule):
        resp = auth_client.get(self.CHECK_URL + f"?schedule_id={schedule.id}")
        assert resp.status_code == 400

    def test_check_invalid_date_format_400(self, auth_client, schedule):
        resp = auth_client.get(self.CHECK_URL + f"?date=30-04-2025&schedule_id={schedule.id}")
        assert resp.status_code == 400

    def test_check_anonymous_401(self, anon_client, schedule):
        resp = anon_client.get(self.CHECK_URL + f"?date=2025-04-28&schedule_id={schedule.id}")
        assert resp.status_code == 401

    def test_check_non_admin_allowed_200(self, auth_client, schedule):
        """Non-admin authenticated user can use /check/ endpoint."""
        resp = auth_client.get(self.CHECK_URL + f"?date=2025-04-28&schedule_id={schedule.id}")
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Cache invalidation via signal
# ---------------------------------------------------------------------------

@pytest.mark.unit
@pytest.mark.django_db
class TestCacheInvalidation:
    def test_cache_cleared_after_holiday_post(self, admin_client, schedule):
        """POST holiday → P0 signal fires → cache key for that year is cleared."""
        cache_key = f"calendar:{schedule.id}:2025"
        cache.set(cache_key, {"holidays": {}, "overrides": {}}, 3600)
        assert cache.get(cache_key) is not None

        url = f"/api/instances/calendar/schedules/{schedule.id}/holidays/"
        resp = admin_client.post(url, {"date": "2025-07-04", "name": "Test Holiday"}, format="json")
        assert resp.status_code == 201

        # Signal from P0 should have deleted the cache key
        assert cache.get(cache_key) is None

    def test_cache_cleared_after_override_delete(self, admin_client, schedule):
        """DELETE override → P0 signal fires → cache key cleared."""
        ov = DayOverride.objects.create(schedule=schedule, date="2025-08-15", type="HOLIDAY", reason="")
        cache_key = f"calendar:{schedule.id}:2025"
        cache.set(cache_key, {"holidays": {}, "overrides": {}}, 3600)

        url = f"/api/instances/calendar/schedules/{schedule.id}/overrides/{ov.id}/"
        resp = admin_client.delete(url)
        assert resp.status_code == 204
        assert cache.get(cache_key) is None
