# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Finishing work: the timer stops, what was done goes into the day's report, and others are told if needed."""

# Django imports
from django.db import transaction

# Third party imports
from rest_framework.exceptions import ParseError

# Module imports
from plane.team_ops.models import HubMessage, OpsTeam, OpsTeamMember, WorkSession
from plane.team_ops.services.hub import channel_for_project, channel_for_team, post_message
from plane.team_ops.services.timer import stop_active_timer
from plane.team_ops.services.weekly_plan import today_in_timezone
from plane.team_ops.services.work_reports import DAILY, save_report


def _line(session, work_item_key):
    """One bullet for the day's report."""
    hours, minutes = divmod(session.duration_seconds // 60, 60)
    spent = f"{hours}h {minutes}m" if hours else f"{minutes}m"
    prefix = f"{work_item_key} " if work_item_key else ""
    return f"- {prefix}{session.summary} ({spent})"


def _add_to_day_report(*, workspace, user, session, work_item_key):
    from plane.team_ops.models import WorkReport

    day = today_in_timezone(user.user_timezone)
    existing = WorkReport.objects.filter(workspace=workspace, user=user, kind=DAILY, period_start=day).first()
    line = _line(session, work_item_key)
    done = f"{existing.done}\n{line}".strip() if existing and existing.done else line
    save_report(workspace=workspace, user=user, kind=DAILY, start=day, data={"done": done}, submit=False)


def finish_work(*, workspace, user, summary, document_text, no_document, attention, attachments_expected=False):
    """Stop the timer and record the session.

    `attention` is `None` or `{"message", "team_ids", "user_ids"}`. A session needs a summary, and a
    document or the person's confirmation that there is none. Returns `(session, capped)`.
    """
    summary = (summary or "").strip()
    document_text = (document_text or "").strip()
    if not summary:
        raise ParseError(detail="Write what you did.")
    if not (document_text or no_document or attachments_expected):
        raise ParseError(detail="Add a document, or confirm that there is none.")
    if attention and not (attention.get("message") or "").strip():
        raise ParseError(detail="Say what needs attention.")

    with transaction.atomic():
        stopped = stop_active_timer(workspace, user)
        if stopped is None:
            raise ParseError(detail="No timer is running.")
        entry, capped = stopped
        if entry.issue_id is None:
            raise ParseError(detail="Start work on a work item first.")
        session = WorkSession.objects.create(
            workspace=workspace,
            user=user,
            project_id=entry.project_id,
            issue=entry.issue,
            time_entry=entry,
            started_at=entry.started_at,
            finished_at=entry.ended_at,
            duration_seconds=entry.duration_seconds,
            summary=summary,
            document_text=document_text,
            no_document=no_document and not document_text,
            needs_attention=bool(attention),
            attention_message=(attention or {}).get("message", "").strip(),
        )
        key = f"{entry.issue.project.identifier}-{entry.issue.sequence_id}"
        _add_to_day_report(workspace=workspace, user=user, session=session, work_item_key=key)
        if attention:
            _hand_over(workspace, user, session, attention)
    return session, capped


def _hand_over(workspace, user, session, attention):
    """Post the attention message in the project's channel and in the channel of every team asked."""
    text = f"{session.summary}\n\n{session.attention_message}"
    user_ids = {uid for uid in attention.get("user_ids", [])}
    team_ids = {tid for tid in attention.get("team_ids", [])}

    project_channel = channel_for_project(workspace, session.project)
    # Only the people who can read the project channel can be tagged there; the rest are reached through their team.
    from plane.team_ops.services.hub import channel_member_ids

    in_project = channel_member_ids(project_channel)
    post_message(
        channel=project_channel,
        author=user,
        body=text,
        user_ids=user_ids & in_project,
        team_ids=team_ids,
        kind=HubMessage.Kind.ATTENTION,
        session=session,
    )
    for team in OpsTeam.objects.filter(workspace=workspace, pk__in=team_ids):
        channel = channel_for_team(workspace, team)
        members = set(OpsTeamMember.objects.filter(team=team).values_list("user_id", flat=True))
        post_message(
            channel=channel,
            author=user,
            body=text,
            user_ids=user_ids & members & channel_member_ids(channel),
            team_ids=[team.id],
            kind=HubMessage.Kind.ATTENTION,
            session=session,
        )
