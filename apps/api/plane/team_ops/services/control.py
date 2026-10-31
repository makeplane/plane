# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Control: what managers see about people's tasks and hours, the Hub, and the flows."""

# Python imports
from datetime import timedelta

# Django imports
from django.db.models import Count, Max, Q, Sum
from django.utils import timezone

# Module imports
from plane.team_ops.models import (
    CalendarEntry,
    CalendarHoliday,
    HubAttachment,
    HubChannel,
    HubDoc,
    HubMessage,
    HubSecret,
    WorkInterruption,
    WorkSession,
)
from plane.team_ops.services import flows as flow_service
from plane.team_ops.services import hub, teamflow
from plane.team_ops.services.policy import get_policy
from plane.team_ops.services.weekly_plan import today_in_timezone
from plane.team_ops.services.workday import _zone, day_window, team_status, week_start_of

STALE_HANDOFF_HOURS = 48


def week_compliance(workspace, user_ids, reference_user):
    """`{user_id: number of working days still unplanned this week}`, worked out for everyone in a few queries."""
    today = today_in_timezone(reference_user.user_timezone)
    start = week_start_of(today)
    end = start + timedelta(days=6)
    working = get_policy(workspace).working_weekdays
    holidays = set(
        CalendarHoliday.objects.filter(workspace=workspace, date__range=(start, end)).values_list("date", flat=True)
    )
    needed = [
        start + timedelta(days=i)
        for i in range(7)
        if (start + timedelta(days=i)) >= today
        and (start + timedelta(days=i)).isoweekday() in working
        and (start + timedelta(days=i)) not in holidays
    ]
    planned = {}
    for user_id, day in CalendarEntry.objects.filter(
        workspace=workspace, user_id__in=user_ids, work_date__in=needed
    ).values_list("user_id", "work_date"):
        planned.setdefault(user_id, set()).add(day)
    return {user_id: len([d for d in needed if d not in planned.get(user_id, set())]) for user_id in user_ids}


def team_overview(workspace, user_ids, start, end, reference_user):
    """One row per person: today's state plus the work, places, pauses and freezes of the period `[start, end]`."""
    zone = _zone(reference_user)
    window_start = day_window(start, zone)[0]
    window_end = day_window(end, zone)[1]
    sessions = {
        row["user_id"]: row
        for row in WorkSession.objects.filter(
            workspace=workspace, user_id__in=user_ids, finished_at__gte=window_start, finished_at__lt=window_end
        )
        .values("user_id")
        .annotate(
            seconds=Sum("duration_seconds"),
            onsite=Sum("duration_seconds", filter=Q(location="ONSITE")),
            remote=Sum("duration_seconds", filter=Q(location="REMOTE")),
            sessions=Count("id"),
            tasks=Count("issue", distinct=True),
            without_document=Count("id", filter=Q(no_document=True)),
            attention=Count("id", filter=Q(needs_attention=True)),
        )
    }
    freezes = {
        row["user_id"]: row
        for row in WorkInterruption.objects.filter(
            workspace=workspace,
            user_id__in=user_ids,
            kind="FREEZE",
            started_at__gte=window_start,
            started_at__lt=window_end,
        )
        .values("user_id")
        .annotate(count=Count("id"))
    }
    interruptions = {}
    now = timezone.now()
    for item in WorkInterruption.objects.filter(
        workspace=workspace, user_id__in=user_ids, started_at__gte=window_start, started_at__lt=window_end
    ):
        seconds = max(0, int(((item.ended_at or now) - item.started_at).total_seconds()))
        entry = interruptions.setdefault(item.user_id, {"BREAK": 0, "FREEZE": 0})
        entry[item.kind] += seconds
    unplanned = week_compliance(workspace, user_ids, reference_user)
    rows = []
    for live in team_status(workspace, user_ids, reference_user):
        user_id = live["user"]["id"]
        done = sessions.get(user_id, {})
        rows.append(
            {
                **live,
                "period": {
                    "seconds": done.get("seconds") or 0,
                    "onsite_seconds": done.get("onsite") or 0,
                    "remote_seconds": done.get("remote") or 0,
                    "sessions": done.get("sessions", 0),
                    "tasks": done.get("tasks", 0),
                    "without_document": done.get("without_document", 0),
                    "attention": done.get("attention", 0),
                    "break_seconds": interruptions.get(user_id, {}).get("BREAK", 0),
                    "frozen_seconds": interruptions.get(user_id, {}).get("FREEZE", 0),
                    "freezes": freezes.get(user_id, {}).get("count", 0),
                },
                "unplanned_days": unplanned.get(user_id, 0),
            }
        )
    totals = {
        key: sum(row["period"][key] for row in rows)
        for key in (
            "seconds",
            "onsite_seconds",
            "remote_seconds",
            "sessions",
            "break_seconds",
            "frozen_seconds",
            "freezes",
        )
    }
    totals["unplanned_people"] = len([row for row in rows if row["unplanned_days"] > 0])
    totals["working_now"] = len([row for row in rows if row["state"] == "RUNNING"])
    return rows, totals


def interruption_list(workspace, user_ids, start, end, reference_user, kind=None):
    """Breaks and freezes in a period, newest first."""
    zone = _zone(reference_user)
    queryset = WorkInterruption.objects.filter(
        workspace=workspace,
        user_id__in=user_ids,
        started_at__gte=day_window(start, zone)[0],
        started_at__lt=day_window(end, zone)[1],
    ).select_related("user", "issue", "issue__project")
    if kind:
        queryset = queryset.filter(kind=kind)
    now = timezone.now()
    return [
        {
            "kind": item.kind,
            "user": {"id": item.user_id, "display_name": item.user.display_name},
            "work_item": f"{item.issue.project.identifier}-{item.issue.sequence_id}" if item.issue_id else None,
            "started_at": item.started_at,
            "ended_at": item.ended_at,
            "seconds": max(0, int(((item.ended_at or now) - item.started_at).total_seconds())),
        }
        for item in queryset.order_by("-started_at")[:300]
    ]


def hub_overview(workspace):
    """The Hub as an admin sees it: channels and how busy they are, and the size of the rest. No private messages,
    no secret names, no values."""
    channels = (
        HubChannel.objects.filter(workspace=workspace)
        .exclude(kind=HubChannel.Kind.DM)
        .select_related("team", "project")
        .annotate(
            message_count=Count("messages", filter=Q(messages__is_deleted=False)),
            last_at=Max("messages__created_at"),
        )
    )
    day_ago = timezone.now() - timedelta(days=1)
    recent = dict(
        HubMessage.objects.filter(channel__workspace=workspace, created_at__gte=day_ago, is_deleted=False)
        .values_list("channel_id")
        .annotate(count=Count("id"))
    )
    rows = []
    for channel in channels:
        rows.append(
            {
                "id": channel.id,
                "kind": channel.kind,
                "name": hub.channel_name(channel, None),
                "members": len(hub.channel_member_ids(channel)),
                "messages": channel.message_count,
                "last_at": channel.last_at,
                "today": recent.get(channel.id, 0),
                "is_locked": channel.is_locked,
            }
        )
    order = {"NEWS": 0, "GENERAL": 1, "TEAM": 2, "PROJECT": 3}
    rows.sort(key=lambda row: (order[row["kind"]], row["name"].lower()))
    files = HubAttachment.objects.filter(workspace=workspace).aggregate(count=Count("id"), bytes=Sum("size"))
    return {
        "channels": rows,
        "private_conversations": HubChannel.objects.filter(workspace=workspace, kind=HubChannel.Kind.DM).count(),
        "docs": HubDoc.objects.filter(workspace=workspace).count(),
        "files": files["count"],
        "file_bytes": files["bytes"] or 0,
        "secrets": HubSecret.objects.filter(workspace=workspace).count(),
        "secret_publishers": HubSecret.objects.filter(workspace=workspace).values("publisher").distinct().count(),
    }


def flow_overview(workspace):
    """Every flow with where it is stuck, and the hand-offs nobody has opened for two days."""
    result = []
    for flow in flow_service.visible_flows(workspace, None, True).prefetch_related("stages"):
        described = flow_service.describe(flow)
        stages = described["stages"]
        done = sum(stage["done"] for stage in stages)
        total = sum(stage["total"] for stage in stages)
        current = next((index for index, stage in enumerate(stages) if stage["percent"] != 100), None)
        waiting = (
            [] if current is None else [p["user"]["display_name"] for p in stages[current]["people"] if p["total"] == 0]
        )
        result.append(
            {
                **described,
                "percent": None if total == 0 else round(done * 100 / total),
                "current_stage": None if current is None else stages[current]["name"],
                "finished": current is None,
                "pending_stages": len([stage for stage in stages if stage["pending"]]),
                "people_without_tasks": waiting,
            }
        )
    from plane.team_ops.models import OpsTeam

    team_ids = set(OpsTeam.objects.filter(workspace=workspace).values_list("id", flat=True))
    cutoff = timezone.now() - timedelta(hours=STALE_HANDOFF_HOURS)
    stale = [
        row
        for row in teamflow.handoffs(workspace, visible_team_ids=team_ids, status=teamflow.PENDING)
        if row["created_at"] <= cutoff
    ]
    return {"flows": result, "stale_handoffs": stale, "stale_after_hours": STALE_HANDOFF_HOURS}
