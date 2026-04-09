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

"""Tests for PI configuration settings."""

import os
from unittest import mock


def test_session_check_uses_internal_host_when_set():
    """Test that SESSION_CHECK uses PLANE_INTERNAL_API_HOST when set."""
    with mock.patch.dict(
        os.environ,
        {
            "PLANE_API_HOST": "https://api.plane.so",
            "PLANE_INTERNAL_API_HOST": "http://api:8000",
        },
        clear=False,
    ):
        # Re-import to pick up new env vars
        import importlib

        import pi.config

        importlib.reload(pi.config)

        assert pi.config.PlaneAPI.INTERNAL_HOST == "http://api:8000"
        assert pi.config.PlaneAPI.SESSION_CHECK == "http://api:8000/api/users/session/"


def test_session_check_falls_back_to_host_when_internal_host_not_set():
    """Test that SESSION_CHECK falls back to PLANE_API_HOST when PLANE_INTERNAL_API_HOST is not set."""
    with mock.patch.dict(
        os.environ,
        {
            "PLANE_API_HOST": "https://api.plane.so",
            "PLANE_INTERNAL_API_HOST": "",
        },
        clear=False,
    ):
        # Re-import to pick up new env vars
        import importlib

        import pi.config

        importlib.reload(pi.config)

        assert pi.config.PlaneAPI.INTERNAL_HOST == "https://api.plane.so"
        assert pi.config.PlaneAPI.SESSION_CHECK == "https://api.plane.so/api/users/session/"


def test_session_check_falls_back_when_internal_host_missing():
    """Test that SESSION_CHECK falls back to PLANE_API_HOST when PLANE_INTERNAL_API_HOST env var is missing."""
    env_copy = os.environ.copy()
    # Remove PLANE_INTERNAL_API_HOST if it exists
    env_copy.pop("PLANE_INTERNAL_API_HOST", None)
    env_copy["PLANE_API_HOST"] = "https://api.plane.so"

    with mock.patch.dict(os.environ, env_copy, clear=True):
        # Re-import to pick up new env vars
        import importlib

        import pi.config

        importlib.reload(pi.config)

        assert pi.config.PlaneAPI.INTERNAL_HOST == "https://api.plane.so"
        assert pi.config.PlaneAPI.SESSION_CHECK == "https://api.plane.so/api/users/session/"


def test_session_check_strips_trailing_slash():
    """Test that SESSION_CHECK handles PLANE_INTERNAL_API_HOST with trailing slash."""
    with mock.patch.dict(
        os.environ,
        {
            "PLANE_API_HOST": "https://api.plane.so",
            "PLANE_INTERNAL_API_HOST": "http://api:8000/",
        },
        clear=False,
    ):
        # Re-import to pick up new env vars
        import importlib

        import pi.config

        importlib.reload(pi.config)

        assert pi.config.PlaneAPI.INTERNAL_HOST == "http://api:8000"
        assert pi.config.PlaneAPI.SESSION_CHECK == "http://api:8000/api/users/session/"
        # Ensure no double slashes (except in protocol)
        assert "//" not in pi.config.PlaneAPI.SESSION_CHECK.replace("://", "")


def test_session_check_falls_back_on_whitespace():
    """Test that SESSION_CHECK falls back to PLANE_API_HOST when PLANE_INTERNAL_API_HOST is whitespace."""
    with mock.patch.dict(
        os.environ,
        {
            "PLANE_API_HOST": "https://api.plane.so",
            "PLANE_INTERNAL_API_HOST": "   ",
        },
        clear=False,
    ):
        # Re-import to pick up new env vars
        import importlib

        import pi.config

        importlib.reload(pi.config)

        assert pi.config.PlaneAPI.INTERNAL_HOST == "https://api.plane.so"
        assert pi.config.PlaneAPI.SESSION_CHECK == "https://api.plane.so/api/users/session/"
