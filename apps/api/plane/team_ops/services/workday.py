# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""A person's working day: how they work today, the running task, and what the day looks like so far."""

# Python imports
from datetime import datetime, time as time_of_day, timedelta
from zoneinfo import ZoneInfo

# Django imports
from django.db import IntegrityError, transaction
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

# Third party imports
from rest_framework.exceptions import ParseError

# Module imports
from plane.team_ops.models import (
    ActiveTimer,
    CalendarEntry,
    CalendarHoliday,
    WorkDay,
    WorkInterruption,
    WorkSession,
)
from plane.team_ops.services.policy import get_policy
from plane.team_ops.services.timer import (
    CHECK_IN_SECONDS,
    GRACE_SECONDS,
    RUNNING,
    check_in_due_at,
    get_timer,
    worked_seconds,
)
from plane.team_ops.services.weekly_plan import today_in_timezone

LOCATIONS = ("REMOTE", "ONSITE")


class TimerAlreadyRunning(Exception):
    pass


def _zone(user_or_name):
    name = getattr(user_or_name, "user_timezone", user_or_name)
    try:
        return ZoneInfo(name or "UTC")
    except Exception:  # an unknown zone name must not break the page
        return ZoneInfo("UTC")


def day_window(day, zone):
    return (
        datetime.combine(day, time_of_day.min, zone),
        datetime.combine(day + timedelta(days=1), time_of_day.min, zone),
    )


def get_day(workspace, user):
    return WorkDay.objects.filter(workspace=workspace, user=user, date=today_in_timezone(user.user_timezone)).first()


def set_day_mode(workspace, user, mode):
    if mode not in WorkDay.Mode.values:
        raise ParseError(detail="Choose remote, onsite or hybrid.")
    day, _ = WorkDay.objects.update_or_create(
        workspace=workspace, user=user, date=today_in_timezone(user.user_timezone), defaults={"mode": mode}
    )
    return day


def week_start_of(day):
    """The Saturday that starts the week `day` is in."""
    return day - timedelta(days=(day.weekday() - 5) % 7)


def week_plan(workspace, user):
    """Saturday to Friday: which days are planned (any entry, including leave and days off).

    Only working days that are not holidays and not yet past need a plan; `complete` says they all have one.
    """
    today = today_in_timezone(user.user_timezone)
    start = week_start_of(today)
    end = start + timedelta(days=6)
    working = get_policy(workspace).working_weekdays
    modes = {
        entry.work_date: entry.work_mode
        for entry in CalendarEntry.objects.filter(workspace=workspace, user=user, work_date__range=(start, end))
    }
    holidays = set(
        CalendarHoliday.objects.filter(workspace=workspace, date__range=(start, end)).values_list("date", flat=True)
    )
    days = []
    for offset in range(7):
        day = start + timedelta(days=offset)
        days.append(
            {
                "date": day,
                "mode": modes.get(day),
                "expected": day.isoweekday() in working and day not in holidays,
                "past": day < today,
            }
        )
    missing = [item["date"] for item in days if item["expected"] and item["mode"] is None and not item["past"]]
    return {"start": start, "end": end, "days": days, "complete": not missing, "missing": missing}


def start_work(workspace, user, issue, location):
    """Start the timer on a work item.

    Today's answer is the default place. Starting a task in the other place makes the day a hybrid day: the
    system works that out, the person is never asked to say "hybrid". The week must be planned first.
    """
    day = get_day(workspace, user)
    if day is None:
        raise ParseError(detail="Say how you are working today first.")
    plan = week_plan(workspace, user)
    if not plan["complete"]:
        raise ParseError(detail="Plan your week first: say which days you work and where.")
    if location and location not in LOCATIONS:
        raise ParseError(detail="Say whether you work on this task remotely or onsite.")
    if not location:
        if day.mode not in LOCATIONS:
            raise ParseError(detail="Say whether you work on this task remotely or onsite.")
        location = day.mode
    if day.mode != WorkDay.Mode.HYBRID and location != day.mode:
        day.mode = WorkDay.Mode.HYBRID
        day.save()
    now = timezone.now()
    try:
        with transaction.atomic():
            if ActiveTimer.objects.filter(workspace=workspace, user=user).exists():
                raise TimerAlreadyRunning
            return ActiveTimer.objects.create(
                workspace=workspace,
                user=user,
                issue=issue,
                started_at=now,
                last_confirmed_at=now,
                location=location,
            )
    except IntegrityError:
        raise TimerAlreadyRunning


def timer_payload(timer, now=None):
    if timer is None:
        return None
    now = now or timezone.now()
    due = check_in_due_at(timer)
    issue = timer.issue
    return {
        "id": timer.id,
        "state": timer.state,
        "location": timer.location,
        "started_at": timer.started_at,
        "worked_seconds": worked_seconds(timer, now),
        "paused_at": timer.paused_at,
        "check_in_due_at": due,
        "check_in_grace_seconds": GRACE_SECONDS,
        "check_in_every_seconds": CHECK_IN_SECONDS,
        "issue": issue.id if issue else None,
        "work_item": f"{issue.project.identifier}-{issue.sequence_id}" if issue else None,
        "work_item_name": issue.name if issue else None,
        "project": issue.project.name if issue else None,
        "server_time": now,
    }


def day_totals(workspace, user, running=None):
    """Worked seconds by place, and time lost to breaks and freezes, for the person's local today."""
    zone = _zone(user)
    start, end = day_window(today_in_timezone(user.user_timezone), zone)
    rows = (
        WorkSession.objects.filter(workspace=workspace, user=user, finished_at__gte=start, finished_at__lt=end)
        .values("location")
        .annotate(seconds=Sum("duration_seconds"))
    )
    seconds = {row["location"]: row["seconds"] or 0 for row in rows}
    if running is not None and running.location:
        seconds[running.location] = seconds.get(running.location, 0) + worked_seconds(running)
    interruptions = list(
        WorkInterruption.objects.filter(workspace=workspace, user=user, started_at__gte=start, started_at__lt=end)
    )
    now = timezone.now()

    def length(item):
        return max(0, int(((item.ended_at or now) - item.started_at).total_seconds()))

    return {
        "onsite_seconds": seconds.get("ONSITE", 0),
        "remote_seconds": seconds.get("REMOTE", 0),
        "break_seconds": sum(length(i) for i in interruptions if i.kind == "BREAK"),
        "frozen_seconds": sum(length(i) for i in interruptions if i.kind == "FREEZE"),
        "interruptions": [
            {"kind": i.kind, "started_at": i.started_at, "ended_at": i.ended_at, "seconds": length(i)}
            for i in interruptions
        ],
    }


def day_state(workspace, user):
    timer = get_timer(workspace, user)
    day = get_day(workspace, user)
    return {
        "day": {"date": day.date, "mode": day.mode} if day else None,
        "timer": timer_payload(timer),
        "totals": day_totals(workspace, user, timer),
        "week": week_plan(workspace, user),
    }


def team_status(workspace, user_ids, reference_user):
    """Who is doing what right now, for the people given."""
    from plane.db.models import User

    now = timezone.now()
    start, end = day_window(today_in_timezone(reference_user.user_timezone), _zone(reference_user))
    users = {u.id: u for u in User.objects.filter(pk__in=user_ids)}
    modes = {
        d.user_id: d.mode
        for d in WorkDay.objects.filter(
            workspace=workspace, user_id__in=user_ids, date=today_in_timezone(reference_user.user_timezone)
        )
    }
    timers = {
        t.user_id: t
        for t in ActiveTimer.objects.filter(workspace=workspace, user_id__in=user_ids).select_related(
            "issue", "issue__project"
        )
    }
    done = {
        row["user_id"]: row["seconds"] or 0
        for row in WorkSession.objects.filter(
            workspace=workspace, user_id__in=user_ids, finished_at__gte=start, finished_at__lt=end
        )
        .values("user_id")
        .annotate(seconds=Sum("duration_seconds"))
    }
    freezes = {}
    for item in WorkInterruption.objects.filter(
        workspace=workspace, user_id__in=user_ids, kind="FREEZE", started_at__gte=start, started_at__lt=end
    ):
        freezes[item.user_id] = freezes.get(item.user_id, 0) + int(
            ((item.ended_at or now) - item.started_at).total_seconds()
        )

    rows = []
    for user_id, person in users.items():
        timer = timers.get(user_id)
        if timer is not None:
            # A freeze is only noticed when someone looks, so look.
            from plane.team_ops.services.timer import refresh

            with transaction.atomic():
                timer = refresh(
                    ActiveTimer.objects.select_for_update(of=("self",))
                    .select_related("workspace", "user", "issue", "issue__project")
                    .get(pk=timer.pk)
                )
        rows.append(
            {
                "user": {"id": person.id, "display_name": person.display_name, "avatar_url": person.avatar_url},
                "mode": modes.get(user_id),
                "state": timer.state if timer else ("DONE" if done.get(user_id) else "IDLE"),
                "work_item": f"{timer.issue.project.identifier}-{timer.issue.sequence_id}"
                if timer and timer.issue_id
                else None,
                "work_item_name": timer.issue.name if timer and timer.issue_id else None,
                "location": timer.location if timer else "",
                "worked_today_seconds": done.get(user_id, 0) + (worked_seconds(timer, now) if timer else 0),
                "frozen_today_seconds": freezes.get(user_id, 0),
            }
        )
    rows.sort(key=lambda row: row["user"]["display_name"].lower())
    return rows


def freeze_unanswered_timers():
    """Look at every running timer, so a freeze is recorded and reported even when nobody has the page open."""
    from plane.team_ops.services.timer import refresh

    frozen = 0
    for pk in list(ActiveTimer.objects.filter(state=RUNNING).values_list("pk", flat=True)):
        with transaction.atomic():
            timer = (
                ActiveTimer.objects.select_for_update(of=("self",))
                .select_related("workspace", "user", "issue", "issue__project")
                .filter(pk=pk)
                .first()
            )
            if timer is not None and refresh(timer).state != RUNNING:
                frozen += 1
    return frozen


def heatmap(workspace, user, days=365):
    """Per day (person's timezone) for the last `days` days: finished work, tasks it was on, seconds worked."""
    zone = _zone(user)
    today = today_in_timezone(user.user_timezone)
    first = today - timedelta(days=days - 1)
    start = day_window(first, zone)[0]
    end = day_window(today, zone)[1]
    rows = (
        WorkSession.objects.filter(workspace=workspace, user=user, finished_at__gte=start, finished_at__lt=end)
        .annotate(day=TruncDate("finished_at", tzinfo=zone))
        .values("day")
        .annotate(sessions=Count("id"), tasks=Count("issue", distinct=True), seconds=Sum("duration_seconds"))
        .order_by("day")
    )
    return {
        "from": first,
        "to": today,
        "days": [
            {"date": row["day"], "sessions": row["sessions"], "tasks": row["tasks"], "seconds": row["seconds"] or 0}
            for row in rows
        ],
    }
