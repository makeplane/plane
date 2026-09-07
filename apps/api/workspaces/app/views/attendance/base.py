# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Attendance endpoints -- a server-side proxy onto the Atlas Odoo bridge.

The browser never holds the bridge key and never talks to Odoo: it is
authenticated by the Workspaces session cookie like every other call, and this
layer decides which Odoo employee that session maps to.
"""

# Python imports
import logging

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from workspaces.app.views.base import BaseAPIView
from workspaces.throttles.attendance import AttendanceRateThrottle
from workspaces.utils.odoo_bridge import (
    OdooBridgeUnavailable,
    call,
    error_code,
    error_message,
    is_configured,
)

# "workspaces.external" is the configured logger for outbound integrations: it has a
# console handler and its own level. A bare "plane" logger has neither, so under
# production's disable_existing_loggers these warnings would never be seen.
logger = logging.getLogger("workspaces.external")

# Deliberately says nothing about why. A bad key, a blocked reverse proxy and a
# timeout are all operator problems, and none of the bridge's internals belong
# in a browser.
UNAVAILABLE = {"error": "Attendance is unavailable right now.", "code": "unavailable"}

LATITUDE_LIMIT = 90
LONGITUDE_LIMIT = 180


def parse_coordinate(raw, limit):
    """
    Coerce one coordinate, or return ``None`` when it is missing or unusable.

    The range check also disposes of ``NaN`` and the infinities: every
    comparison against ``NaN`` is false, and an infinity fails the bound.
    """
    # bool is a subclass of int, so a JSON `true` would otherwise validate as
    # 1.0 and be written to Odoo as a position off the coast of Africa.
    if raw is None or isinstance(raw, bool):
        return None

    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None

    if not -limit <= value <= limit:
        return None

    return value


class AttendanceBaseEndpoint(BaseAPIView):
    """
    Shared plumbing for the three attendance endpoints.

    These are user-scoped, not workspace-scoped -- attendance has nothing to do
    with which workspace happens to be open -- so there is no ``slug`` in the
    route and no workspace membership to check.
    """

    throttle_classes = [AttendanceRateThrottle]

    def bridge_response(self, request, status_code, payload):
        """Translate one bridge response into a Workspaces response."""
        if status_code == status.HTTP_200_OK:
            return Response({**payload, "available": True}, status=status.HTTP_200_OK)

        # Every Workspaces account belongs to an employee who already exists in
        # Odoo, so this is a provisioning defect rather than a state to design
        # for: either the account uses a different address than the employee's
        # work email, or somebody reached Workspaces with no employee record.
        # Make it visible -- a control that quietly does nothing costs more
        # support time than one that explains itself.
        if status_code == status.HTTP_400_BAD_REQUEST:
            logger.warning(
                "Attendance: no Odoo employee matches %s (%s)",
                request.user.email,
                error_message(payload),
            )
            return Response(
                {
                    "error": (
                        f"Your Workspaces account ({request.user.email}) doesn't match an "
                        "employee record in Odoo. Ask HR to check your work email."
                    ),
                    "code": "not_linked",
                },
                status=status.HTTP_409_CONFLICT,
            )

        # A punch that conflicts with what Odoo already holds -- already checked
        # in, or nothing open to close. The UI reconciles rather than shouting.
        if status_code == status.HTTP_409_CONFLICT:
            return Response(
                {
                    "error": error_message(payload) or "That punch conflicts with Odoo's records.",
                    "code": error_code(payload) or "conflict",
                },
                status=status.HTTP_409_CONFLICT,
            )

        logger.warning("Attendance: unexpected bridge status %s (%s)", status_code, error_message(payload))
        return Response(UNAVAILABLE, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    def punch(self, request, path, body):
        """Send one write to the bridge and translate whatever comes back."""
        try:
            status_code, payload = call("POST", path, json=body)
        except OdooBridgeUnavailable:
            return Response(UNAVAILABLE, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return self.bridge_response(request, status_code, payload)


class AttendanceStatusEndpoint(AttendanceBaseEndpoint):
    """Today's attendance for the signed-in user."""

    def get(self, request):
        # Not an error: it is how every deployment without Odoo behaves. Say so
        # plainly, with a 200, so the navbar hides the control and the console
        # stays clean.
        if not is_configured():
            return Response({"available": False}, status=status.HTTP_200_OK)

        try:
            status_code, payload = call(
                "GET",
                "/api/v1/attendance/me",
                params={"email": request.user.email},
            )
        except OdooBridgeUnavailable:
            return Response(UNAVAILABLE, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return self.bridge_response(request, status_code, payload)


class AttendanceCheckInEndpoint(AttendanceBaseEndpoint):
    """Open a session for the signed-in user. Location is required."""

    def post(self, request):
        if not is_configured():
            return Response(UNAVAILABLE, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")

        # The bridge accepts a punch with no coordinates and stores it anyway,
        # deliberately, so that a refused browser permission can never stop
        # somebody clocking in. That makes "location is required" ours to
        # enforce, and this is the only place it is enforced.
        if latitude is None or longitude is None:
            return Response(
                {"error": "Location is required to check in.", "code": "location_required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        latitude = parse_coordinate(latitude, LATITUDE_LIMIT)
        longitude = parse_coordinate(longitude, LONGITUDE_LIMIT)

        if latitude is None or longitude is None:
            return Response(
                {"error": "That location isn't a valid coordinate.", "code": "location_invalid"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return self.punch(
            request,
            "/api/v1/attendance/checkin",
            # Built from the session, never from the body. Accepting an email
            # here would let any signed-in user punch in as anybody.
            {"email": request.user.email, "latitude": latitude, "longitude": longitude},
        )


class AttendanceCheckOutEndpoint(AttendanceBaseEndpoint):
    """Close the open session for the signed-in user. Location is optional."""

    def post(self, request):
        if not is_configured():
            return Response(UNAVAILABLE, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        body = {"email": request.user.email}

        # Best effort on the way out. The requirement is on the way in: blocking
        # a check-out on a permission prompt strands an open session -- somebody
        # already out of the building, on a phone that will not get a fix,
        # could not close their day, and Odoo would keep counting the hours.
        latitude = parse_coordinate(request.data.get("latitude"), LATITUDE_LIMIT)
        longitude = parse_coordinate(request.data.get("longitude"), LONGITUDE_LIMIT)
        if latitude is not None and longitude is not None:
            body["latitude"] = latitude
            body["longitude"] = longitude

        return self.punch(request, "/api/v1/attendance/checkout", body)
