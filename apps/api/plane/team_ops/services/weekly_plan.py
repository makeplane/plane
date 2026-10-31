# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The recurring weekly plan.

The plan is written out as real `TEMPLATE` entries for the next `template_horizon_weeks` weeks
and extended every day. Writing it out, rather than applying it when a day is read, means a
change to the plan only ever touches today and the future, so past days and the reports built
from them stay as they were. Days set by hand are never touched.
"""

# Python imports
from datetime import datetime, timedelta, timezone as dt_timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# Django imports
from django.db import IntegrityError, transaction
from django.utils import timezone

# Module imports
from plane.team_ops.models import CalendarAudit, CalendarEntry, CalendarTemplate
from plane.team_ops.services.audit import record_audit
from plane.team_ops.services.day_resolution import format_time, iter_days


def today_in_timezone(timezone_name):
    """The current calendar day in a timezone; an unknown name falls back to UTC."""
    try:
        zone = ZoneInfo(timezone_name)
    except (ZoneInfoNotFoundError, ValueError):
        zone = dt_timezone.utc
    return datetime.now(zone).date()


def user_today(user):
    """The current calendar day for a person, from their profile timezone."""
    return today_in_timezone(user.user_timezone)


def get_template_row(workspace, user, weekday):
    return CalendarTemplate.objects.filter(workspace=workspace, user=user, weekday=weekday, is_active=True).first()


def row_snapshot(row):
    """A weekly plan day as plain JSON values."""
    return {
        "weekday": row.weekday,
        "work_mode": row.work_mode,
        "planned_start_time": format_time(row.planned_start_time),
        "planned_end_time": format_time(row.planned_end_time),
        "is_active": row.is_active,
    }


def plan_snapshot(workspace, user):
    rows = CalendarTemplate.objects.filter(workspace=workspace, user=user).order_by("weekday")
    return [row_snapshot(row) for row in rows]


def _matches(entry, row):
    return (
        entry.work_mode == row.work_mode
        and entry.planned_start_time == row.planned_start_time
        and entry.planned_end_time == row.planned_end_time
    )


def write_out_plan(*, workspace, user, settings_row, changed_by=None):
    """Bring a person's `TEMPLATE` entries in line with their active weekly plan.

    Only today and later are touched; entries set by hand are left alone; template entries
    outside the horizon are removed. Safe to run any number of times.
    Returns `{"created": n, "updated": n, "removed": n}`.
    """
    for attempt in range(2):
        try:
            return _write_out_plan(workspace, user, settings_row, changed_by)
        except IntegrityError:
            # An entry for the same day appeared between our read and our write.
            if attempt:
                raise


def _write_out_plan(workspace, user, settings_row, changed_by):
    today = user_today(user)
    horizon_end = today + timedelta(weeks=settings_row.template_horizon_weeks)
    rows = {row.weekday: row for row in CalendarTemplate.objects.filter(workspace=workspace, user=user, is_active=True)}
    now = timezone.now()
    to_create, to_update, to_remove = [], [], []

    with transaction.atomic():
        entries = {
            entry.work_date: entry
            for entry in CalendarEntry.objects.select_for_update().filter(
                workspace=workspace, user=user, work_date__gte=today
            )
        }

        for day in iter_days(today, horizon_end - timedelta(days=1)):
            entry, row = entries.pop(day, None), rows.get(day.isoweekday())
            if entry is not None and entry.source == CalendarEntry.Source.MANUAL:
                continue
            if row is None:
                if entry is not None:
                    to_remove.append(entry.id)
            elif entry is None:
                to_create.append(
                    CalendarEntry(
                        workspace=workspace,
                        user=user,
                        work_date=day,
                        work_mode=row.work_mode,
                        planned_start_time=row.planned_start_time,
                        planned_end_time=row.planned_end_time,
                        source=CalendarEntry.Source.TEMPLATE,
                        created_by=changed_by,
                    )
                )
            elif not _matches(entry, row):
                entry.work_mode = row.work_mode
                entry.planned_start_time = row.planned_start_time
                entry.planned_end_time = row.planned_end_time
                entry.updated_by = changed_by
                entry.updated_at = now
                to_update.append(entry)

        # Whatever is left lies beyond the horizon: plan entries there are stale.
        to_remove.extend(entry.id for entry in entries.values() if entry.source == CalendarEntry.Source.TEMPLATE)

        CalendarEntry.objects.bulk_create(to_create)
        CalendarEntry.objects.bulk_update(
            to_update, ["work_mode", "planned_start_time", "planned_end_time", "updated_by", "updated_at"]
        )
        if to_remove:
            CalendarEntry.objects.filter(id__in=to_remove).delete(soft=False)

    return {"created": len(to_create), "updated": len(to_update), "removed": len(to_remove)}


def save_plan(*, workspace, user, days, settings_row, changed_by):
    """Replace a person's weekly plan with `days` and write it out. Audited as one change.

    Weekdays that are not in `days` are removed from the plan.
    """
    wanted = {day["weekday"]: day for day in days}

    with transaction.atomic():
        before = plan_snapshot(workspace, user)
        existing = {
            row.weekday: row
            for row in CalendarTemplate.objects.select_for_update().filter(workspace=workspace, user=user)
        }

        for weekday, row in existing.items():
            if weekday not in wanted:
                row.delete(soft=False)
        for weekday, day in wanted.items():
            fields = {
                "work_mode": day["work_mode"],
                "planned_start_time": day["planned_start_time"],
                "planned_end_time": day["planned_end_time"],
                "is_active": day["is_active"],
            }
            row = existing.get(weekday)
            if row is None:
                CalendarTemplate.objects.create(workspace=workspace, user=user, weekday=weekday, **fields)
            else:
                for name, value in fields.items():
                    setattr(row, name, value)
                row.save()

        after = plan_snapshot(workspace, user)
        materialized = write_out_plan(workspace=workspace, user=user, settings_row=settings_row, changed_by=changed_by)

        if after != before:
            if not before:
                action = CalendarAudit.Action.CREATE
            elif not after:
                action = CalendarAudit.Action.DELETE
            else:
                action = CalendarAudit.Action.UPDATE
            record_audit(
                workspace=workspace,
                entity=CalendarAudit.Entity.TEMPLATE,
                action=action,
                changed_by=changed_by,
                subject_user_id=user.id,
                old=before or None,
                new=after or None,
            )

    return {"plan": after, "materialized": materialized}


def extend_weekly_plans(workspace_ids=None):
    """Extend every active weekly plan to the horizon. Run daily; returns how many people were updated."""
    from plane.db.models import User, Workspace
    from plane.team_ops.services.access import calendar_user_ids
    from plane.team_ops.services.policy import get_policy
    from plane.utils.exception_logger import log_exception

    templates = CalendarTemplate.objects.filter(is_active=True)
    if workspace_ids is not None:
        templates = templates.filter(workspace_id__in=workspace_ids)
    pairs = templates.values_list("workspace_id", "user_id").distinct()

    by_workspace = {}
    for workspace_id, user_id in pairs:
        by_workspace.setdefault(workspace_id, []).append(user_id)

    updated = 0
    for workspace in Workspace.objects.filter(id__in=by_workspace):
        settings_row = get_policy(workspace)
        eligible = calendar_user_ids(workspace)
        for user in User.objects.filter(id__in=[uid for uid in by_workspace[workspace.id] if uid in eligible]):
            try:
                write_out_plan(workspace=workspace, user=user, settings_row=settings_row)
                updated += 1
            except Exception as error:  # one person's failure must not stop the others
                log_exception(error)
    return updated
