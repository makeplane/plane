# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Writing day entries. Every change to a person's plan is audited with who made it."""

# Django imports
from django.db import IntegrityError, transaction
from django.utils import timezone

# Module imports
from plane.team_ops.models import CalendarAudit, CalendarEntry
from plane.team_ops.services.audit import build_audit
from plane.team_ops.services.day_resolution import format_time
from plane.team_ops.services.weekly_plan import get_template_row, user_today

PLAN_FIELDS = ("work_mode", "planned_start_time", "planned_end_time", "description", "leave_type")


def entry_snapshot(entry):
    """The audited state of an entry as plain JSON values."""
    return {
        "work_mode": entry.work_mode,
        "planned_start_time": format_time(entry.planned_start_time),
        "planned_end_time": format_time(entry.planned_end_time),
        "description": entry.description,
        "leave_type": entry.leave_type,
        "source": entry.source,
    }


def set_days(*, workspace, user_id, days, plan, changed_by):
    """Set the same plan on every date in `days` for one person, as entries set by hand.

    `plan` holds the `PLAN_FIELDS`. A day that came from the weekly plan becomes a manual day.
    Returns `{"created": n, "updated": n, "unchanged": n}`. Two requests creating the same day
    at once lose the race with an IntegrityError, so the second one is simply run again.
    """
    for attempt in range(2):
        try:
            return _set_days(workspace, user_id, days, plan, changed_by)
        except IntegrityError:
            if attempt:
                raise


def _set_days(workspace, user_id, days, plan, changed_by):
    now = timezone.now()
    created, updated, audits = [], [], []
    unchanged = 0

    with transaction.atomic():
        existing = {
            entry.work_date: entry
            for entry in CalendarEntry.objects.select_for_update().filter(
                workspace=workspace, user_id=user_id, work_date__in=days
            )
        }
        for day in days:
            entry = existing.get(day)
            if entry is None:
                entry = CalendarEntry(
                    workspace=workspace,
                    user_id=user_id,
                    work_date=day,
                    source=CalendarEntry.Source.MANUAL,
                    created_by=changed_by,
                    **plan,
                )
                created.append(entry)
                old, action = None, CalendarAudit.Action.CREATE
            else:
                old = entry_snapshot(entry)
                for field in PLAN_FIELDS:
                    setattr(entry, field, plan[field])
                entry.source = CalendarEntry.Source.MANUAL
                if entry_snapshot(entry) == old:
                    unchanged += 1
                    continue
                entry.updated_by = changed_by
                entry.updated_at = now
                updated.append(entry)
                action = CalendarAudit.Action.UPDATE
            audits.append(
                build_audit(
                    workspace=workspace,
                    entity=CalendarAudit.Entity.ENTRY,
                    action=action,
                    changed_by=changed_by,
                    subject_user_id=user_id,
                    work_date=day,
                    old=old,
                    new=entry_snapshot(entry),
                )
            )

        CalendarEntry.objects.bulk_create(created)
        CalendarEntry.objects.bulk_update(updated, [*PLAN_FIELDS, "source", "updated_by", "updated_at"])
        CalendarAudit.objects.bulk_create(audits)

    return {"created": len(created), "updated": len(updated), "unchanged": unchanged}


def reset_day(*, workspace, user, day, changed_by):
    """Remove a day set by hand; a future day falls back to the weekly plan.

    Returns False when the day has no manual entry. Past days are not refilled from the
    weekly plan, because past days must not change when the plan does.
    """
    with transaction.atomic():
        entry = (
            CalendarEntry.objects.select_for_update()
            .filter(workspace=workspace, user=user, work_date=day, source=CalendarEntry.Source.MANUAL)
            .first()
        )
        if entry is None:
            return False

        old = entry_snapshot(entry)
        entry.delete(soft=False)

        restored = None
        if day >= user_today(user):
            row = get_template_row(workspace, user, day.isoweekday())
            if row is not None:
                restored = CalendarEntry.objects.create(
                    workspace=workspace,
                    user=user,
                    work_date=day,
                    work_mode=row.work_mode,
                    planned_start_time=row.planned_start_time,
                    planned_end_time=row.planned_end_time,
                    source=CalendarEntry.Source.TEMPLATE,
                    created_by=changed_by,
                )

        build_audit(
            workspace=workspace,
            entity=CalendarAudit.Entity.ENTRY,
            action=CalendarAudit.Action.DELETE,
            changed_by=changed_by,
            subject_user_id=user.id,
            work_date=day,
            old=old,
            new=entry_snapshot(restored) if restored else None,
        ).save()
    return True
