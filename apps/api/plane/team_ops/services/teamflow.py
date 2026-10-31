# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Teamflow: the hand-offs between teams, built from messages that tag a team."""

# Module imports
from plane.team_ops.models import HubMention, OpsTeam, OpsTeamMember

PENDING = "pending"
DELIVERED = "delivered"
STATUSES = (PENDING, DELIVERED)


def handoffs(workspace, *, visible_team_ids, start=None, end=None, team_id=None, status=None):
    """Hand-offs as `{message, from_team, to_team, delivered, ...}`, newest first.

    A hand-off is a message that tags a whole team. It goes from the team of its author to the tagged
    team, and counts as delivered once someone in the tagged team has opened it. Only hand-offs that
    touch a team in `visible_team_ids` are returned.
    """
    mentions = (
        HubMention.objects.filter(
            message__channel__workspace=workspace, via_team__isnull=False, message__is_deleted=False
        )
        .select_related("message", "message__author", "message__session", "message__session__issue", "via_team")
        .prefetch_related("message__attachments", "message__session__attachments")
        .order_by("-created_at")
    )
    if start:
        mentions = mentions.filter(created_at__date__gte=start)
    if end:
        mentions = mentions.filter(created_at__date__lte=end)

    author_teams = {}
    for membership in OpsTeamMember.objects.filter(team__workspace=workspace).select_related("team"):
        author_teams.setdefault(membership.user_id, []).append(membership.team)

    by_message = {}
    for mention in mentions:
        entry = by_message.setdefault(
            # Work handed over posts to the project and to the team; that is one hand-off, not two.
            (mention.message.session_id or mention.message_id, mention.via_team_id),
            {"message": mention.message, "to": mention.via_team, "delivered": False},
        )
        if mention.read_at is not None:
            entry["delivered"] = True

    rows = []
    for entry in by_message.values():
        message, target = entry["message"], entry["to"]
        sources = [t for t in author_teams.get(message.author_id, []) if t.id != target.id] or [None]
        for source in sources:
            involved = {target.id} | ({source.id} if source else set())
            if not involved & visible_team_ids:
                continue
            if team_id and team_id not in involved:
                continue
            state = DELIVERED if entry["delivered"] else PENDING
            if status and status != state:
                continue
            session = message.session
            rows.append(
                {
                    "message": message.id,
                    "channel": message.channel_id,
                    "from_team": {"id": source.id, "name": source.name} if source else None,
                    "to_team": {"id": target.id, "name": target.name},
                    "author": {"id": message.author_id, "display_name": message.author.display_name},
                    "kind": message.kind,
                    "summary": (message.body or "")[:200],
                    "work_item": f"{session.issue.project.identifier}-{session.issue.sequence_id}"
                    if session and session.issue_id
                    else None,
                    "files": [
                        {"id": a.id, "name": a.name, "content_type": a.content_type, "size": a.size}
                        for a in [*message.attachments.all(), *(session.attachments.all() if session else [])]
                    ],
                    "status": state,
                    "created_at": message.created_at,
                }
            )
    rows.sort(key=lambda row: row["created_at"], reverse=True)
    return rows


def flow_summary(workspace, rows, visible_team_ids):
    """Teams as nodes and the number of hand-offs between each pair as edges."""
    edges = {}
    for row in rows:
        if row["from_team"] is None:
            continue
        key = (row["from_team"]["id"], row["to_team"]["id"])
        edge = edges.setdefault(key, {"from": key[0], "to": key[1], PENDING: 0, DELIVERED: 0})
        edge[row["status"]] += 1
    # A team on the other end of a hand-off is shown even when the person is not in it.
    node_ids = set(visible_team_ids) | {i for key in edges for i in key}
    teams = OpsTeam.objects.filter(workspace=workspace, pk__in=node_ids).order_by("name")
    return {"nodes": [{"id": t.id, "name": t.name} for t in teams], "edges": list(edges.values())}
