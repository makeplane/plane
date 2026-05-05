# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.license.api.views.business_calendar import (
    InstanceCalendarCheckEndpoint,
    InstanceCalendarCopyYearEndpoint,
    InstanceDayOverrideDetailEndpoint,
    InstanceDayOverrideEndpoint,
    InstanceHolidayDetailEndpoint,
    InstanceHolidayEndpoint,
    InstanceWorkScheduleDetailEndpoint,
    InstanceWorkScheduleEndpoint,
)

urlpatterns = [
    # Schedule list / create
    path(
        "calendar/schedules/",
        InstanceWorkScheduleEndpoint.as_view(http_method_names=["get", "post"]),
        name="instance-calendar-schedules",
    ),
    # Schedule detail / update / delete
    path(
        "calendar/schedules/<uuid:pk>/",
        InstanceWorkScheduleDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="instance-calendar-schedule-detail",
    ),
    # Holidays for a schedule
    path(
        "calendar/schedules/<uuid:pk>/holidays/",
        InstanceHolidayEndpoint.as_view(http_method_names=["get", "post"]),
        name="instance-calendar-holidays",
    ),
    # Holiday detail update / delete
    path(
        "calendar/schedules/<uuid:pk>/holidays/<uuid:holiday_pk>/",
        InstanceHolidayDetailEndpoint.as_view(http_method_names=["patch", "delete"]),
        name="instance-calendar-holiday-detail",
    ),
    # Day overrides for a schedule
    path(
        "calendar/schedules/<uuid:pk>/overrides/",
        InstanceDayOverrideEndpoint.as_view(http_method_names=["get", "post"]),
        name="instance-calendar-overrides",
    ),
    # Day override detail update / delete
    path(
        "calendar/schedules/<uuid:pk>/overrides/<uuid:override_pk>/",
        InstanceDayOverrideDetailEndpoint.as_view(http_method_names=["patch", "delete"]),
        name="instance-calendar-override-detail",
    ),
    # Copy-year action
    path(
        "calendar/schedules/<uuid:pk>/copy-year/",
        InstanceCalendarCopyYearEndpoint.as_view(http_method_names=["post"]),
        name="instance-calendar-copy-year",
    ),
    # Working-day check helper (IsAuthenticated, not InstanceAdminPermission)
    path(
        "calendar/check/",
        InstanceCalendarCheckEndpoint.as_view(http_method_names=["get"]),
        name="instance-calendar-check",
    ),
]
