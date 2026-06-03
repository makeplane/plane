# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for the General Director (GD) resolver.

Coverage targets:
  - plane/utils/general_director.py

The resolver returns the single instance-wide GD user (the active staff
whose job_grade is "GD"), None when no GD exists, and raises
AmbiguousGeneralDirector when more than one distinct user carries the
GD grade.
"""

import uuid

import pytest

from plane.db.models import StaffProfile, User
from plane.utils.general_director import (
    GD_JOB_GRADE,
    AmbiguousGeneralDirector,
    get_general_director_user,
)


def _make_user(email_prefix: str) -> User:
    return User.objects.create(
        email=f"{email_prefix}-{uuid.uuid4().hex[:8]}@example.com",
        username=uuid.uuid4().hex,
    )


def _make_staff(user: User, staff_id: str, **kwargs) -> StaffProfile:
    defaults = {
        "job_grade": "GD",
        "employment_status": "active",
    }
    defaults.update(kwargs)
    return StaffProfile.objects.create(user=user, staff_id=staff_id, **defaults)


@pytest.mark.unit
class TestGeneralDirectorResolver:
    """get_general_director_user() resolution rules."""

    @pytest.mark.django_db
    def test_returns_user_when_single_active_gd_exists(self):
        user = _make_user("gd")
        _make_staff(user, "GD000001")
        assert get_general_director_user() == user

    @pytest.mark.django_db
    def test_returns_none_when_no_gd_staff(self):
        user = _make_user("staff")
        _make_staff(user, "ST000001", job_grade="Director")
        assert get_general_director_user() is None

    @pytest.mark.django_db
    def test_returns_none_when_no_staff_at_all(self):
        assert get_general_director_user() is None

    @pytest.mark.django_db
    def test_ignores_inactive_gd_staff(self):
        resigned = _make_user("resigned-gd")
        _make_staff(resigned, "GD000002", employment_status="resigned")
        suspended = _make_user("suspended-gd")
        _make_staff(suspended, "GD000003", employment_status="suspended")
        assert get_general_director_user() is None

    @pytest.mark.django_db
    def test_grade_match_is_case_insensitive(self):
        user = _make_user("gd-lower")
        _make_staff(user, "GD000004", job_grade="gd")
        assert get_general_director_user() == user

    @pytest.mark.django_db
    def test_grade_name_does_not_match_code(self):
        # "General Director" / "Director" are names, not the "GD" code.
        user = _make_user("gd-name")
        _make_staff(user, "GD000005", job_grade="General Director")
        assert get_general_director_user() is None

    @pytest.mark.django_db
    def test_ignores_soft_deleted_gd_staff(self):
        from django.utils import timezone

        user = _make_user("deleted-gd")
        staff = _make_staff(user, "GD000006")
        StaffProfile.all_objects.filter(pk=staff.pk).update(deleted_at=timezone.now())
        assert get_general_director_user() is None

    @pytest.mark.django_db
    def test_multiple_distinct_gd_users_raise_ambiguous(self):
        _make_staff(_make_user("gd-a"), "GD000007")
        _make_staff(_make_user("gd-b"), "GD000008")
        with pytest.raises(AmbiguousGeneralDirector):
            get_general_director_user()

    @pytest.mark.django_db
    def test_inactive_second_gd_does_not_trigger_ambiguity(self):
        active = _make_user("gd-active")
        _make_staff(active, "GD000009")
        former = _make_user("gd-former")
        _make_staff(former, "GD000010", employment_status="resigned")
        assert get_general_director_user() == active

    def test_gd_job_grade_constant(self):
        assert GD_JOB_GRADE == "GD"
