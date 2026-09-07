# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework.throttling import UserRateThrottle


class AttendanceRateThrottle(UserRateThrottle):
    """
    Per-user budget for the attendance endpoints.

    the Workspaces global default is ``AnonRateThrottle``, which produces no cache key
    for an authenticated request -- so without this there is nothing between a
    runaway client and Odoo, which Atlas depends on too.
    """

    scope = "attendance"
