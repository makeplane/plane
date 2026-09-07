# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
The rest of the attendance surface PROJECT.md asks for.

History, leave balance, holidays and working hours all live in Odoo, and the
deployed bridge exposes only today's status and the two punches. Rather than
inventing a second source of truth in Workspaces -- which is exactly what the
"Odoo remains the source of truth" rule forbids -- these endpoints ask the
bridge and report honestly when it cannot answer yet.

The contract each one expects is written up in
``odoo-implementation/ODOO_MODULE_SPEC.md``. Once the module ships, these
endpoints start returning data with no change here.
"""

# Python imports
import logging
from concurrent.futures import ThreadPoolExecutor

# Django imports
from django.core.cache import cache

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from workspaces.app.permissions import ROLE, allow_permission
from workspaces.app.views.base import BaseAPIView
from workspaces.db.models import WorkspaceMember
from workspaces.throttles.attendance import AttendanceRateThrottle
from workspaces.utils.engineering_ops import avatar_url
from workspaces.utils.odoo_bridge import OdooBridgeUnavailable, call, call_optional, is_configured

from .base import UNAVAILABLE, AttendanceBaseEndpoint

logger = logging.getLogger("workspaces.external")

# How long a team-availability answer is reused. Attendance changes when
# somebody punches, which is a handful of times a day per person -- a minute of
# staleness is invisible, and it keeps a dashboard refresh from fanning out
# dozens of requests at Odoo every time somebody blinks.
TEAM_CACHE_SECONDS = 60

# Bounded so a large workspace cannot open a hundred sockets at Odoo at once.
TEAM_FANOUT_WORKERS = 8
TEAM_FANOUT_LIMIT = 60


def unsupported(feature):
    """The 200 that says "this deployment cannot do that yet"."""
    return Response(
        {
            "available": False,
            "code": "bridge_endpoint_missing",
            "error": (
                f"{feature} needs the Odoo bridge endpoints described in odoo-implementation/ODOO_MODULE_SPEC.md."
            ),
        },
        status=status.HTTP_200_OK,
    )


class AttendanceHistoryEndpoint(AttendanceBaseEndpoint):
    """The signed-in user's attendance over a date range."""

    def get(self, request):
        if not is_configured():
            return Response({"available": False}, status=status.HTTP_200_OK)

        params = {"email": request.user.email}
        for key in ("start_date", "end_date"):
            value = request.query_params.get(key)
            if value:
                params[key] = value

        try:
            status_code, payload = call_optional("GET", "/api/v1/attendance/history", params=params)
        except OdooBridgeUnavailable:
            return Response(UNAVAILABLE, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        if status_code is None:
            return unsupported("Attendance history")
        return self.bridge_response(request, status_code, payload)


class AttendanceLeaveEndpoint(AttendanceBaseEndpoint):
    """Leave balance and requests for the signed-in user."""

    def get(self, request):
        if not is_configured():
            return Response({"available": False}, status=status.HTTP_200_OK)

        try:
            status_code, payload = call_optional("GET", "/api/v1/leave/me", params={"email": request.user.email})
        except OdooBridgeUnavailable:
            return Response(UNAVAILABLE, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        if status_code is None:
            return unsupported("Leave balance")
        return self.bridge_response(request, status_code, payload)


class AttendanceHolidayEndpoint(AttendanceBaseEndpoint):
    """The holiday calendar that applies to the signed-in user."""

    def get(self, request):
        if not is_configured():
            return Response({"available": False}, status=status.HTTP_200_OK)

        params = {"email": request.user.email}
        year = request.query_params.get("year")
        if year:
            params["year"] = year

        try:
            status_code, payload = call_optional("GET", "/api/v1/holidays", params=params)
        except OdooBridgeUnavailable:
            return Response(UNAVAILABLE, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        if status_code is None:
            return unsupported("The holiday calendar")
        return self.bridge_response(request, status_code, payload)


class AttendanceWorkingHoursEndpoint(AttendanceBaseEndpoint):
    """The employee's contracted working schedule."""

    def get(self, request):
        if not is_configured():
            return Response({"available": False}, status=status.HTTP_200_OK)

        try:
            status_code, payload = call_optional(
                "GET", "/api/v1/employees/working-hours", params={"email": request.user.email}
            )
        except OdooBridgeUnavailable:
            return Response(UNAVAILABLE, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        if status_code is None:
            return unsupported("Working hours")
        return self.bridge_response(request, status_code, payload)


class TeamAvailabilityEndpoint(BaseAPIView):
    """
    Who on this workspace is checked in right now.

    Tries the bridge's team endpoint first. If that is not deployed, falls back
    to asking about each member individually -- bounded, parallel and cached,
    because the alternative is a PM dashboard that takes a minute to load or
    one that simply cannot answer the question PROJECT.md puts at the top of
    the team panel.
    """

    throttle_classes = [AttendanceRateThrottle]

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        if not is_configured():
            return Response({"available": False}, status=status.HTTP_200_OK)

        cache_key = f"operations:team-availability:{slug}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK)

        members = list(
            WorkspaceMember.objects.filter(workspace__slug=slug, is_active=True)
            .exclude(member__is_bot=True)
            .annotate(member_avatar_url=avatar_url("member"))
            .values("member_id", "member__email", "member__display_name", "member_avatar_url")[:TEAM_FANOUT_LIMIT]
        )

        try:
            payload = self.from_bridge(members)
        except OdooBridgeUnavailable:
            return Response(UNAVAILABLE, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        cache.set(cache_key, payload, TEAM_CACHE_SECONDS)
        return Response(payload, status=status.HTTP_200_OK)

    def from_bridge(self, members):
        emails = [m["member__email"] for m in members if m["member__email"]]

        status_code, team = call_optional("GET", "/api/v1/attendance/team", params={"emails": ",".join(emails)})
        if status_code == status.HTTP_200_OK and isinstance(team, dict):
            by_email = {str(entry.get("work_email", "")).casefold(): entry for entry in team.get("employees", []) or []}
            return self.shape(members, by_email, source="team")

        return self.shape(members, self.fan_out(emails), source="fanout")

    def fan_out(self, emails):
        """One ``/attendance/me`` per member, in a bounded pool."""

        def fetch(email):
            try:
                code, payload = call("GET", "/api/v1/attendance/me", params={"email": email})
            except OdooBridgeUnavailable:
                # One unreachable lookup must not sink the whole panel; the
                # member simply shows as unknown.
                return email, None
            return email, payload if code == status.HTTP_200_OK else None

        with ThreadPoolExecutor(max_workers=TEAM_FANOUT_WORKERS) as pool:
            results = list(pool.map(fetch, emails))

        return {email.casefold(): payload for email, payload in results if payload}

    def shape(self, members, by_email, source):
        entries = []
        checked_in = 0
        unknown = 0

        for member in members:
            email = (member["member__email"] or "").casefold()
            record = by_email.get(email)
            if record is None:
                unknown += 1
            elif record.get("checked_in"):
                checked_in += 1

            entries.append(
                {
                    "member_id": str(member["member_id"]),
                    "display_name": member["member__display_name"],
                    "avatar_url": member["member_avatar_url"],
                    "linked": record is not None,
                    "checked_in": bool(record.get("checked_in")) if record else None,
                    "check_in": record.get("check_in") if record else None,
                    "worked_hours_today": record.get("worked_hours_today") if record else None,
                }
            )

        return {
            "available": True,
            "source": source,
            "counted": len(entries),
            "checked_in": checked_in,
            "not_checked_in": len(entries) - checked_in - unknown,
            "unlinked": unknown,
            "members": entries,
        }
