# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The Hub: channels of teams and projects, messages, tags and what is unread.

A channel has no member list of its own. Its members are the members of its team or project, so
joining or leaving a team or a project is all it takes to gain or lose access to its conversation.
"""

# Django imports
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

# Third party imports
from rest_framework.exceptions import NotFound, ParseError

# Module imports
from plane.db.models import ProjectMember
from plane.team_ops.models import (
    HubChannel,
    HubMention,
    HubMessage,
    HubReadState,
    OpsTeam,
    OpsTeamMember,
)
from plane.team_ops.services.access import calendar_user_ids
from plane.team_ops.services.notifications import notify

MAX_BODY = 5000


def channel_member_ids(channel):
    """The people who can read and write in a channel (guests and people who left are never in it)."""
    if channel.kind in (HubChannel.Kind.GENERAL, HubChannel.Kind.NEWS):
        return set(calendar_user_ids(channel.workspace))
    if channel.kind == HubChannel.Kind.DM:
        return {channel.dm_a_id, channel.dm_b_id} & calendar_user_ids(channel.workspace)
    if channel.kind == HubChannel.Kind.TEAM:
        ids = set(OpsTeamMember.objects.filter(team_id=channel.team_id).values_list("user_id", flat=True))
    else:
        ids = set(
            ProjectMember.objects.filter(project_id=channel.project_id, is_active=True).values_list(
                "member_id", flat=True
            )
        )
    return ids & calendar_user_ids(channel.workspace)


def is_member(channel, user):
    return user.id in channel_member_ids(channel)


def get_channel(workspace, channel_id, user):
    """The channel if the person may use it. A channel they may not use looks like one that does not exist."""
    channel = (
        HubChannel.objects.filter(workspace=workspace, pk=channel_id)
        .select_related("team", "project", "dm_a", "dm_b")
        .first()
    )
    if channel is None or not is_member(channel, user):
        raise NotFound("Channel not found.")
    return channel


def channel_for_team(workspace, team):
    channel, _ = HubChannel.objects.get_or_create(workspace=workspace, kind=HubChannel.Kind.TEAM, team=team)
    return channel


def channel_for_project(workspace, project):
    channel, _ = HubChannel.objects.get_or_create(workspace=workspace, kind=HubChannel.Kind.PROJECT, project=project)
    return channel


def channel_for_kind(workspace, kind):
    """The workspace-wide channel of this kind (GENERAL or NEWS), created the first time it is needed."""
    channel, _ = HubChannel.objects.get_or_create(workspace=workspace, kind=kind)
    return channel


def dm_channel(workspace, user, other):
    """The private conversation between two people, created the first time they talk."""
    if other.id == user.id or other.id not in calendar_user_ids(workspace):
        raise ParseError(detail="Choose a colleague.")
    first, second = sorted([user.id, other.id], key=str)
    channel, _ = HubChannel.objects.get_or_create(
        workspace=workspace, kind=HubChannel.Kind.DM, dm_a_id=first, dm_b_id=second
    )
    return channel


def channel_name(channel, viewer):
    """What the channel is called for this viewer."""
    if channel.kind == HubChannel.Kind.TEAM:
        return channel.team.name
    if channel.kind == HubChannel.Kind.PROJECT:
        return channel.project.name
    if channel.kind == HubChannel.Kind.DM:
        other = channel.dm_b if channel.dm_a_id == viewer.id else channel.dm_a
        return other.display_name
    return "News" if channel.kind == HubChannel.Kind.NEWS else "General"


def can_post(channel, user, is_admin):
    """Only admins write news; everyone in a channel may write in the others."""
    if channel.kind == HubChannel.Kind.NEWS or channel.is_locked:
        return is_admin
    return True


def channels_of(workspace, user):
    """The channels of the teams and projects the person belongs to, created the first time they are needed."""
    channel_for_kind(workspace, HubChannel.Kind.GENERAL)
    channel_for_kind(workspace, HubChannel.Kind.NEWS)
    for team in OpsTeam.objects.filter(workspace=workspace, members__user=user):
        channel_for_team(workspace, team)
    for member in ProjectMember.objects.filter(workspace=workspace, member=user, is_active=True).select_related(
        "project"
    ):
        channel_for_project(workspace, member.project)
    team_ids = OpsTeamMember.objects.filter(user=user, team__workspace=workspace).values("team_id")
    project_ids = ProjectMember.objects.filter(workspace=workspace, member=user, is_active=True).values("project_id")
    return (
        HubChannel.objects.filter(workspace=workspace)
        .filter(
            Q(team_id__in=team_ids)
            | Q(project_id__in=project_ids)
            | Q(kind__in=[HubChannel.Kind.GENERAL, HubChannel.Kind.NEWS])
            | Q(kind=HubChannel.Kind.DM, dm_a=user)
            | Q(kind=HubChannel.Kind.DM, dm_b=user)
        )
        .select_related("team", "project", "dm_a", "dm_b")
    )


def unread_counts(user, channels):
    """`{channel_id: number of messages by others since the person last read}`."""
    reads = {row.channel_id: row.last_read_at for row in HubReadState.objects.filter(user=user, channel__in=channels)}
    counts = {}
    for channel in channels:
        queryset = HubMessage.objects.filter(channel=channel, is_deleted=False).exclude(author=user)
        if channel.id in reads:
            queryset = queryset.filter(created_at__gt=reads[channel.id])
        counts[channel.id] = queryset.count()
    return counts


def mark_read(channel, user):
    state, _ = HubReadState.objects.get_or_create(channel=channel, user=user, defaults={"last_read_at": timezone.now()})
    state.last_read_at = timezone.now()
    state.save()


def resolve_mentions(channel, author, user_ids, team_ids):
    """`{user_id: team_id or None}` for everyone tagged who can read the channel. Tagging a team tags its members."""
    members = channel_member_ids(channel)
    tagged = {}
    for user_id in user_ids:
        if user_id not in members:
            raise ParseError(detail="You can only tag people who are in this channel.")
        tagged[user_id] = None
    for team_id in team_ids:
        team = OpsTeam.objects.filter(workspace=channel.workspace, pk=team_id).first()
        if team is None:
            raise ParseError(detail="Unknown team.")
        for member_id in OpsTeamMember.objects.filter(team=team).values_list("user_id", flat=True):
            if member_id in members:
                tagged.setdefault(member_id, team.id)
    tagged.pop(author.id, None)
    return tagged


def post_message(
    *, channel, author, body, parent=None, user_ids=(), team_ids=(), kind=HubMessage.Kind.MESSAGE, session=None
):
    """Write a message and notify the people tagged in it."""
    body = (body or "").strip()
    if len(body) > MAX_BODY:
        raise ParseError(detail=f"A message can be at most {MAX_BODY} characters.")
    if parent is not None and (parent.channel_id != channel.id or parent.is_deleted):
        raise ParseError(detail="You can only reply to a message in the same channel.")
    if parent is not None and parent.parent_id:
        parent = parent.parent  # threads are one level deep
    tagged = resolve_mentions(channel, author, set(user_ids), set(team_ids))
    with transaction.atomic():
        message = HubMessage.objects.create(
            channel=channel, author=author, body=body, parent=parent, kind=kind, session=session
        )
        HubMention.objects.bulk_create(
            [HubMention(message=message, user_id=user_id, via_team_id=team_id) for user_id, team_id in tagged.items()]
        )
    link = f"team-ops/hub?channel={channel.id}"
    if channel.kind == HubChannel.Kind.NEWS:
        notify(
            channel.workspace,
            channel_member_ids(channel),
            "NEWS",
            f"News: {body[:80]}",
            body[:300],
            link=link,
            actor=author,
        )
    elif channel.kind == HubChannel.Kind.DM:
        notify(
            channel.workspace,
            channel_member_ids(channel),
            "DIRECT",
            f"{author.display_name} sent you a message",
            body[:300],
            link=link,
            actor=author,
        )
    if tagged:
        name = channel_name(channel, author)
        attention = kind == HubMessage.Kind.ATTENTION
        notify(
            channel.workspace,
            tagged,
            "ATTENTION" if attention else "MENTION",
            f"{author.display_name} {'needs your attention' if attention else 'tagged you'} in {name}",
            body[:300],
            link=f"team-ops/hub?channel={channel.id}",
            actor=author,
        )
    return message


def edit_message(message, author, body):
    if message.author_id != author.id or message.is_deleted:
        raise ParseError(detail="You can only change your own messages.")
    body = (body or "").strip()
    if not body or len(body) > MAX_BODY:
        raise ParseError(detail="The message is empty or too long.")
    message.body = body
    message.edited_at = timezone.now()
    message.save()
    return message


def delete_message(message, user, is_admin):
    """The author (or a workspace admin) removes a message. The row stays so threads keep their shape."""
    if message.author_id != user.id and not is_admin:
        raise ParseError(detail="You can only delete your own messages.")
    message.is_deleted = True
    message.body = ""
    message.save()


def channel_stats(channel):
    return channel.messages.filter(is_deleted=False).aggregate(total=Count("id"))
