# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""CSV / XLSX export of time entries (plan 7.3 #15)."""

# Python imports
import zoneinfo

# Module imports
from plane.utils.exporters import BooleanField, ExportSchema, NumberField, StringField


def format_clock(seconds) -> str:
    """5400 → "1:30"."""
    seconds = seconds or 0
    return f"{seconds // 3600}:{(seconds % 3600) // 60:02d}"


def _local(dt, user):
    """A datetime in the owner's timezone, as "YYYY-MM-DD HH:MM"."""
    if dt is None:
        return ""
    try:
        tz = zoneinfo.ZoneInfo(user.user_timezone or "UTC")
    except (zoneinfo.ZoneInfoNotFoundError, ValueError):
        tz = zoneinfo.ZoneInfo("UTC")
    return dt.astimezone(tz).strftime("%Y-%m-%d %H:%M")


class TimeEntryExportSchema(ExportSchema):
    """Querysets should use ``select_related("user", "project", "issue", "created_by")``."""

    date = StringField(label="Date")
    person = StringField(source="user.display_name", label="Person")
    person_email = StringField(source="user.email", label="Person email")
    project = StringField(source="project.name", label="Project")
    project_identifier = StringField(source="project.identifier", label="Project identifier")
    work_item_id = StringField(label="Work item ID")
    work_item_title = StringField(label="Work item title")
    description = StringField(source="description", label="Description")
    start = StringField(label="Start")
    end = StringField(label="End")
    duration = StringField(label="Duration (h:mm)")
    duration_hours = NumberField(label="Duration (hours)")
    billable = BooleanField(source="is_billable", label="Billable")
    source = StringField(label="Source")
    logged_by = StringField(label="Logged by")
    created_at = StringField(label="Created at")

    def prepare_date(self, entry):
        return entry.spent_on.isoformat()

    def prepare_work_item_id(self, entry):
        if entry.issue is None:
            return ""
        return f"{entry.project.identifier}-{entry.issue.sequence_id}"

    def prepare_work_item_title(self, entry):
        return entry.issue.name if entry.issue is not None else ""

    def prepare_start(self, entry):
        return _local(entry.started_at, entry.user)

    def prepare_end(self, entry):
        return _local(entry.ended_at, entry.user)

    def prepare_duration(self, entry):
        return format_clock(entry.duration_seconds)

    def prepare_duration_hours(self, entry):
        return round((entry.duration_seconds or 0) / 3600, 2)

    def prepare_source(self, entry):
        return entry.get_source_display()

    def prepare_logged_by(self, entry):
        return entry.created_by.display_name if entry.created_by is not None else ""

    def prepare_created_at(self, entry):
        return _local(entry.created_at, entry.user)
