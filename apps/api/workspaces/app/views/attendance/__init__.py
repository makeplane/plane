# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from .base import (
    AttendanceCheckInEndpoint,
    AttendanceCheckOutEndpoint,
    AttendanceStatusEndpoint,
)
from .extended import (
    AttendanceHistoryEndpoint,
    AttendanceHolidayEndpoint,
    AttendanceLeaveEndpoint,
    AttendanceWorkingHoursEndpoint,
    TeamAvailabilityEndpoint,
)

__all__ = [
    "AttendanceCheckInEndpoint",
    "AttendanceCheckOutEndpoint",
    "AttendanceStatusEndpoint",
    "AttendanceHistoryEndpoint",
    "AttendanceHolidayEndpoint",
    "AttendanceLeaveEndpoint",
    "AttendanceWorkingHoursEndpoint",
    "TeamAvailabilityEndpoint",
]
