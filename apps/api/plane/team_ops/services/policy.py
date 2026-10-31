# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from plane.team_ops.models import CalendarSettings

SETTINGS_FIELDS = (
    "team_view_access",
    "edit_others_access",
    "member_edit_past_days",
    "working_weekdays",
    "template_horizon_weeks",
)


def get_policy(workspace):
    """The workspace policy, created with the defaults the first time it is asked for."""
    settings_row, _ = CalendarSettings.objects.get_or_create(workspace=workspace)
    return settings_row


def snapshot_policy(settings_row):
    """The audited part of a settings row as plain JSON values."""
    return {field: getattr(settings_row, field) for field in SETTINGS_FIELDS}
