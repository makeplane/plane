# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import pytest
from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone

from plane.db.models import User, Session
from plane.authentication.utils.session_limit import enforce_session_limit


@pytest.fixture
def test_user(db):
    """Create a test user for session limit tests"""
    user = User.objects.create(
        email="sessiontest@plane.so",
        first_name="Session",
        last_name="Test",
    )
    user.set_password("testpassword123")
    user.save()
    return user


def create_web_session(user, expire_offset_hours=24):
    """Helper to create a web session for testing"""
    expire_date = timezone.now() + timedelta(hours=expire_offset_hours)
    session = Session.objects.create(
        session_key=f"test_session_{Session.objects.count()}_{timezone.now().timestamp()}",
        session_data="test_data",
        expire_date=expire_date,
        user_id=str(user.id),
        device_info={"session_type": "web", "user_agent": "test"},
    )
    return session


def create_mobile_session(user, expire_offset_hours=24):
    """Helper to create a mobile session for testing"""
    expire_date = timezone.now() + timedelta(hours=expire_offset_hours)
    session = Session.objects.create(
        session_key=f"test_mobile_session_{Session.objects.count()}_{timezone.now().timestamp()}",
        session_data="test_data",
        expire_date=expire_date,
        user_id=str(user.id),
        device_info={"session_type": "mobile", "user_agent": "test"},
    )
    return session


@pytest.mark.unit
class TestEnforceSessionLimit:
    """Test the enforce_session_limit utility function"""

    @pytest.mark.django_db
    def test_no_sessions_exist(self, test_user):
        """Test that nothing happens when user has no sessions"""
        enforce_session_limit(test_user)
        # Should not raise any errors
        assert Session.objects.filter(user_id=str(test_user.id)).count() == 0

    @pytest.mark.django_db
    def test_under_limit_no_deletion(self, test_user):
        """Test that sessions are not deleted when under the limit"""
        # Create 3 web sessions (under the default limit of 5)
        sessions = [create_web_session(test_user, expire_offset_hours=i + 1) for i in range(3)]

        enforce_session_limit(test_user)

        # All sessions should still exist
        assert Session.objects.filter(user_id=str(test_user.id)).count() == 3
        for session in sessions:
            assert Session.objects.filter(session_key=session.session_key).exists()

    @pytest.mark.django_db
    def test_at_limit_deletes_oldest(self, test_user):
        """Test that oldest session is deleted when at the limit"""
        # Create 5 web sessions (at the default limit)
        sessions = []
        for i in range(5):
            session = create_web_session(test_user, expire_offset_hours=i + 1)
            sessions.append(session)

        # The oldest session (index 0) should have the earliest expire_date
        oldest_session = sessions[0]

        # Enforce limit - this simulates a new login
        enforce_session_limit(test_user)

        # Oldest session should be deleted
        assert not Session.objects.filter(session_key=oldest_session.session_key).exists()
        # 4 sessions should remain
        assert Session.objects.filter(user_id=str(test_user.id)).count() == 4

    @pytest.mark.django_db
    def test_over_limit_deletes_oldest_sessions(self, test_user):
        """Test that multiple oldest sessions are deleted when over the limit"""
        # Create 7 web sessions (over the default limit of 5)
        sessions = []
        for i in range(7):
            session = create_web_session(test_user, expire_offset_hours=i + 1)
            sessions.append(session)

        # Enforce limit
        enforce_session_limit(test_user)

        # Should delete 3 oldest sessions (7 - 5 + 1 = 3)
        assert Session.objects.filter(user_id=str(test_user.id)).count() == 4

        # The 3 oldest sessions should be deleted
        for i in range(3):
            assert not Session.objects.filter(session_key=sessions[i].session_key).exists()

        # The 4 newest sessions should remain
        for i in range(3, 7):
            assert Session.objects.filter(session_key=sessions[i].session_key).exists()

    @pytest.mark.django_db
    def test_excludes_current_session(self, test_user):
        """Test that the current session is excluded from deletion"""
        # Create 6 web sessions (so when we exclude current, we have 5 others = at limit)
        sessions = []
        for i in range(6):
            session = create_web_session(test_user, expire_offset_hours=i + 1)
            sessions.append(session)

        # The oldest session is now the "current" session
        current_session = sessions[0]

        # Enforce limit, excluding the current session
        # With 6 sessions and current excluded, we have 5 others which is at the limit
        # So 1 should be deleted (the oldest non-current session)
        enforce_session_limit(test_user, current_session_key=current_session.session_key)

        # Current session should still exist even though it's the oldest
        assert Session.objects.filter(session_key=current_session.session_key).exists()

        # Second oldest (sessions[1]) should be deleted instead since current is excluded
        assert not Session.objects.filter(session_key=sessions[1].session_key).exists()

        # 5 sessions should remain (current + 4 newest)
        assert Session.objects.filter(user_id=str(test_user.id)).count() == 5

    @pytest.mark.django_db
    def test_mobile_sessions_excluded_from_limit(self, test_user):
        """Test that mobile sessions are not counted or deleted"""
        # Create 5 mobile sessions
        mobile_sessions = [create_mobile_session(test_user, expire_offset_hours=i + 1) for i in range(5)]

        # Create 5 web sessions
        web_sessions = [create_web_session(test_user, expire_offset_hours=i + 10) for i in range(5)]

        # Enforce limit
        enforce_session_limit(test_user)

        # All mobile sessions should still exist
        for session in mobile_sessions:
            assert Session.objects.filter(session_key=session.session_key).exists()

        # One web session should be deleted (oldest)
        assert not Session.objects.filter(session_key=web_sessions[0].session_key).exists()

        # Total: 5 mobile + 4 web = 9 sessions
        assert Session.objects.filter(user_id=str(test_user.id)).count() == 9

    @pytest.mark.django_db
    def test_only_web_sessions_counted(self, test_user):
        """Test that only web sessions are counted towards the limit"""
        # Create 10 mobile sessions (should not affect web session limit)
        for i in range(10):
            create_mobile_session(test_user, expire_offset_hours=i + 1)

        # Create 3 web sessions (under limit)
        web_sessions = [create_web_session(test_user, expire_offset_hours=i + 20) for i in range(3)]

        # Enforce limit
        enforce_session_limit(test_user)

        # All sessions should still exist (3 web < 5 limit)
        assert Session.objects.filter(user_id=str(test_user.id)).count() == 13
        for session in web_sessions:
            assert Session.objects.filter(session_key=session.session_key).exists()

    @pytest.mark.django_db
    def test_expired_sessions_not_counted(self, test_user):
        """Test that expired sessions are not counted towards the limit"""
        # Create 5 expired web sessions
        for i in range(5):
            Session.objects.create(
                session_key=f"expired_session_{i}",
                session_data="test_data",
                expire_date=timezone.now() - timedelta(hours=1),  # Expired
                user_id=str(test_user.id),
                device_info={"session_type": "web", "user_agent": "test"},
            )

        # Create 3 active web sessions
        active_sessions = [create_web_session(test_user, expire_offset_hours=i + 1) for i in range(3)]

        # Enforce limit
        enforce_session_limit(test_user)

        # All active sessions should still exist (3 active < 5 limit)
        for session in active_sessions:
            assert Session.objects.filter(session_key=session.session_key).exists()

    @pytest.mark.django_db
    @patch("plane.authentication.utils.session_limit.settings")
    def test_custom_session_limit(self, mock_settings, test_user):
        """Test that custom MAX_CONCURRENT_SESSIONS setting is respected"""
        mock_settings.MAX_CONCURRENT_SESSIONS = 3

        # Create 4 web sessions
        _ = [create_web_session(test_user, expire_offset_hours=i + 1) for i in range(4)]

        # Enforce limit with custom setting of 3
        enforce_session_limit(test_user)

        # Should delete 2 oldest sessions (4 - 3 + 1 = 2)
        assert Session.objects.filter(user_id=str(test_user.id), device_info__session_type="web").count() == 2

    @pytest.mark.django_db
    def test_sessions_without_session_type_ignored(self, test_user):
        """Test that sessions without session_type in device_info are ignored"""
        # Create sessions without session_type (legacy sessions)
        for i in range(5):
            Session.objects.create(
                session_key=f"legacy_session_{i}",
                session_data="test_data",
                expire_date=timezone.now() + timedelta(hours=i + 1),
                user_id=str(test_user.id),
                device_info={"user_agent": "test"},  # No session_type
            )

        # Create 3 web sessions
        web_sessions = [create_web_session(test_user, expire_offset_hours=i + 10) for i in range(3)]

        # Enforce limit
        enforce_session_limit(test_user)

        # Legacy sessions should be untouched
        assert Session.objects.filter(user_id=str(test_user.id), device_info__session_type__isnull=True).count() == 5

        # All web sessions should still exist (3 < 5 limit)
        for session in web_sessions:
            assert Session.objects.filter(session_key=session.session_key).exists()
