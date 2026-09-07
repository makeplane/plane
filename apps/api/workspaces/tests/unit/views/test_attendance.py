# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Tests for the two attendance rules that fail silently if they break.

Everything else in these views is pass-through, but these two are load-bearing:

* **Location is required to check in.** The Odoo bridge accepts a punch with no
  coordinates and stores it anyway, deliberately, so nothing but this validator
  enforces the requirement. Without it the feature looks like it works and
  enforces nothing.
* **The employee comes from the session, never the request body.** Honouring an
  email from the body would let any signed-in user punch in as anybody.
"""

import pytest
from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from workspaces.app.views.attendance.base import (
    AttendanceCheckInEndpoint,
    AttendanceCheckOutEndpoint,
    parse_coordinate,
)

SIGNED_IN_EMAIL = "someone@example.com"

CHECK_IN = AttendanceCheckInEndpoint.as_view()
CHECK_OUT = AttendanceCheckOutEndpoint.as_view()

# The bridge's own reply to a successful punch: the status after the write.
BRIDGE_OK = (status.HTTP_200_OK, {"checked_in": True, "worked_hours_today": 1.5})


class FakeUser:
    """The smallest thing `BaseAPIView` will accept as a signed-in user."""

    is_authenticated = True
    is_active = True
    pk = 1
    id = 1
    email = SIGNED_IN_EMAIL
    user_timezone = "UTC"


def post(view, body):
    """Run one authenticated POST through `view`, with throttling disabled."""
    request = APIRequestFactory().post("/api/attendance/", body, format="json")
    force_authenticate(request, user=FakeUser())
    # The throttle is a real DRF UserRateThrottle backed by the cache; it has
    # nothing to do with what these tests assert.
    with patch.object(view.cls, "throttle_classes", []):
        return view(request)


# ---------------------------------------------------------------------------
# parse_coordinate
# ---------------------------------------------------------------------------


@pytest.mark.unit
@pytest.mark.parametrize(
    "raw,limit,expected",
    [
        (27.7172, 90, 27.7172),
        (85.324, 180, 85.324),
        ("27.7172", 90, 27.7172),  # JSON numbers can arrive as strings
        (0, 90, 0.0),
        (-90, 90, -90.0),
        (180, 180, 180.0),
    ],
)
def test_parse_coordinate_accepts_valid_positions(raw, limit, expected):
    assert parse_coordinate(raw, limit) == pytest.approx(expected)


@pytest.mark.unit
@pytest.mark.parametrize(
    "raw,limit",
    [
        (None, 90),
        (90.001, 90),  # just outside the bound
        (-180.5, 180),
        ("not-a-number", 90),
        ("", 90),
        ([27.7], 90),
        ({}, 90),
        (float("nan"), 90),  # every comparison against NaN is false
        (float("inf"), 90),
        (float("-inf"), 180),
        # bool is a subclass of int: `true` must not become a point on the equator.
        (True, 90),
        (False, 90),
    ],
)
def test_parse_coordinate_rejects_everything_else(raw, limit):
    assert parse_coordinate(raw, limit) is None


# ---------------------------------------------------------------------------
# Location is required on the way in
# ---------------------------------------------------------------------------


@pytest.mark.unit
@pytest.mark.parametrize(
    "body",
    [
        {},
        {"latitude": 27.7172},  # longitude missing
        {"longitude": 85.324},  # latitude missing
        {"latitude": None, "longitude": None},
    ],
)
@patch("workspaces.app.views.attendance.base.is_configured", return_value=True)
@patch("workspaces.app.views.attendance.base.call")
def test_check_in_without_coordinates_is_refused(mock_call, _mock_configured, body):
    response = post(CHECK_IN, body)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["code"] == "location_required"
    # The bridge would have accepted this punch. It must never be asked.
    mock_call.assert_not_called()


@pytest.mark.unit
@pytest.mark.parametrize(
    "body",
    [
        {"latitude": 91, "longitude": 85.324},
        {"latitude": 27.7172, "longitude": 181},
        {"latitude": "somewhere", "longitude": "else"},
        {"latitude": True, "longitude": True},
    ],
)
@patch("workspaces.app.views.attendance.base.is_configured", return_value=True)
@patch("workspaces.app.views.attendance.base.call")
def test_check_in_with_unusable_coordinates_is_refused(mock_call, _mock_configured, body):
    response = post(CHECK_IN, body)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["code"] == "location_invalid"
    mock_call.assert_not_called()


@pytest.mark.unit
@patch("workspaces.app.views.attendance.base.is_configured", return_value=True)
@patch("workspaces.app.views.attendance.base.call", return_value=BRIDGE_OK)
def test_check_in_with_a_position_reaches_the_bridge(mock_call, _mock_configured):
    response = post(CHECK_IN, {"latitude": 27.7172, "longitude": 85.324})

    assert response.status_code == status.HTTP_200_OK
    _, _, kwargs = mock_call.mock_calls[0]
    assert kwargs["json"]["latitude"] == pytest.approx(27.7172)
    assert kwargs["json"]["longitude"] == pytest.approx(85.324)


# ---------------------------------------------------------------------------
# The employee is the session's, never the body's
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("workspaces.app.views.attendance.base.is_configured", return_value=True)
@patch("workspaces.app.views.attendance.base.call", return_value=BRIDGE_OK)
def test_check_in_ignores_an_email_in_the_body(mock_call, _mock_configured):
    response = post(
        CHECK_IN,
        {
            "latitude": 27.7172,
            "longitude": 85.324,
            "email": "someone.else@example.com",
            "employee_id": 999,
        },
    )

    assert response.status_code == status.HTTP_200_OK
    _, _, kwargs = mock_call.mock_calls[0]
    assert kwargs["json"]["email"] == SIGNED_IN_EMAIL
    assert "employee_id" not in kwargs["json"]


@pytest.mark.unit
@patch("workspaces.app.views.attendance.base.is_configured", return_value=True)
@patch("workspaces.app.views.attendance.base.call", return_value=BRIDGE_OK)
def test_check_out_ignores_an_email_in_the_body(mock_call, _mock_configured):
    response = post(CHECK_OUT, {"email": "someone.else@example.com", "employee_id": 999})

    assert response.status_code == status.HTTP_200_OK
    _, _, kwargs = mock_call.mock_calls[0]
    assert kwargs["json"]["email"] == SIGNED_IN_EMAIL
    assert "employee_id" not in kwargs["json"]


# ---------------------------------------------------------------------------
# Location is optional on the way out
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("workspaces.app.views.attendance.base.is_configured", return_value=True)
@patch("workspaces.app.views.attendance.base.call", return_value=BRIDGE_OK)
def test_check_out_without_a_position_still_closes_the_session(mock_call, _mock_configured):
    """A refused permission must never strand an open session in Odoo."""
    response = post(CHECK_OUT, {})

    assert response.status_code == status.HTTP_200_OK
    _, _, kwargs = mock_call.mock_calls[0]
    assert kwargs["json"] == {"email": SIGNED_IN_EMAIL}


@pytest.mark.unit
@patch("workspaces.app.views.attendance.base.is_configured", return_value=True)
@patch("workspaces.app.views.attendance.base.call", return_value=BRIDGE_OK)
def test_check_out_drops_a_half_supplied_position(mock_call, _mock_configured):
    response = post(CHECK_OUT, {"latitude": 27.7172})

    assert response.status_code == status.HTTP_200_OK
    _, _, kwargs = mock_call.mock_calls[0]
    assert kwargs["json"] == {"email": SIGNED_IN_EMAIL}
