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

# Django imports
from django.conf import settings
from django.utils import timezone

# Module imports
from plane.db.models import Session


def invalidate_all_user_sessions(user, exclude_session_key=None):
    """
    Invalidate all sessions for a user except the current one.

    This should be called when a user changes their password to ensure
    all other sessions are logged out for security.

    Args:
        user: The user object for whom to invalidate sessions
        exclude_session_key: The session key to exclude from deletion (usually the current session)
    """
    sessions = Session.objects.filter(user_id=str(user.id))
    if exclude_session_key:
        sessions = sessions.exclude(session_key=exclude_session_key)
    sessions.delete()


def enforce_session_limit(user, current_session_key=None):
    """
    Enforce the maximum concurrent session limit for a user.

    When a user exceeds the MAX_CONCURRENT_SESSIONS limit, the oldest web sessions
    are deleted to make room for the new session. Mobile sessions are excluded
    from this limit.

    Args:
        user: The user object for whom to enforce session limits
        current_session_key: The session key of the current session to exclude from deletion
    """
    max_sessions = getattr(settings, "MAX_CONCURRENT_SESSIONS", 5)

    # Get all active web sessions for this user, ordered by expiry date (oldest first)
    # Only count sessions with session_type "web" in device_info
    active_sessions = Session.objects.filter(
        user_id=str(user.id), expire_date__gt=timezone.now(), device_info__session_type="web"
    ).order_by("expire_date")

    # Exclude current session if provided
    if current_session_key:
        active_sessions = active_sessions.exclude(session_key=current_session_key)

    session_count = active_sessions.count()

    # If we have max_sessions or more (excluding current), we need to remove oldest ones
    # to make room for the new session
    if session_count >= max_sessions:
        # Calculate how many to delete: keep (max_sessions - 1) to allow room for new session
        sessions_to_delete = session_count - max_sessions + 1
        oldest_sessions = active_sessions[:sessions_to_delete]

        # Delete oldest sessions
        for session in oldest_sessions:
            session.delete()
