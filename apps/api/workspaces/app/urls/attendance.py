# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from workspaces.app.views import (
    AttendanceCheckInEndpoint,
    AttendanceCheckOutEndpoint,
    AttendanceHistoryEndpoint,
    AttendanceHolidayEndpoint,
    AttendanceLeaveEndpoint,
    AttendanceStatusEndpoint,
    AttendanceWorkingHoursEndpoint,
)

# User-scoped, so no workspace slug. `workspaces.app.urls` is mounted at `api/`,
# which makes these `/api/attendance/...` -- unrelated to the Workspaces public
# `/api/v1/`, and unrelated again to the bridge's `/api/v1/` on the Odoo host.
urlpatterns = [
    path("attendance/me/", AttendanceStatusEndpoint.as_view(), name="attendance-status"),
    path("attendance/check-in/", AttendanceCheckInEndpoint.as_view(), name="attendance-check-in"),
    path("attendance/check-out/", AttendanceCheckOutEndpoint.as_view(), name="attendance-check-out"),
    # Everything below needs the Odoo module described in
    # odoo-implementation/ODOO_MODULE_SPEC.md. Until that ships they answer
    # 200 with `available: false` rather than pretending to be broken.
    path("attendance/history/", AttendanceHistoryEndpoint.as_view(), name="attendance-history"),
    path("attendance/leave/", AttendanceLeaveEndpoint.as_view(), name="attendance-leave"),
    path("attendance/holidays/", AttendanceHolidayEndpoint.as_view(), name="attendance-holidays"),
    path("attendance/working-hours/", AttendanceWorkingHoursEndpoint.as_view(), name="attendance-working-hours"),
]
