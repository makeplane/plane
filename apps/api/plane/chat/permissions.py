# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Who may see and change what in Nexus Messages.

Workspace membership is checked first, by the view's permission class: someone who
is not an active member of the workspace gets 403, as everywhere in plane.app.

Below that, a channel the caller cannot see is a 404, never a 403, so a private
channel's or a DM's existence does not leak:

- workspace members and admins see every public channel in the workspace;
- everyone sees the channels and DMs they are a member of;
- guests see nothing else.

Seeing a channel lets you read its messages and members. Writing to it (sending,
editing or removing your own messages, marking as read, adding members) needs
channel membership, which is a 403 for a public channel you can see but have not
joined. Moderation (renaming, archiving, removing other people's messages or
members) needs a channel admin or a workspace admin, who need not be in a public
channel to moderate it. A private channel's last admin can't step down while others
remain in it.

Opening a DM or group DM needs a workspace member or admin, or a guest a workspace
admin has granted it to (`ChatGuestPermission`).
"""

from django.db.models import Exists, OuterRef, Q

from plane.app.permissions.base import ROLE
from plane.chat.exceptions import Conflict, Forbidden, NotFound
from plane.chat.models import Channel, ChannelKind, ChannelMember, ChannelMemberRole, ChatGuestPermission
from plane.db.models import WorkspaceMember


def workspace_role(user, slug):
    """The caller's role in the workspace, or None if they are not an active member."""
    return (
        WorkspaceMember.objects.filter(workspace__slug=slug, member=user, is_active=True)
        .values_list("role", flat=True)
        .first()
    )


def can_browse_public_channels(role):
    """Members and admins see every public channel; guests only the channels they were added to."""
    return role is not None and role >= ROLE.MEMBER.value


def can_create_channels(role):
    return role is not None and role >= ROLE.MEMBER.value


def is_workspace_admin(role):
    return role == ROLE.ADMIN.value


def visible_channels(user, slug, role):
    """Channels in the workspace `slug` the caller can see, annotated with `is_member`."""
    queryset = Channel.objects.filter(workspace__slug=slug).annotate(
        is_member=Exists(ChannelMember.objects.filter(channel=OuterRef("pk"), user=user))
    )
    visible = Q(is_member=True)
    if can_browse_public_channels(role):
        visible |= Q(kind=ChannelKind.PUBLIC)
    return queryset.filter(visible)


def get_visible_channel(user, slug, role, channel_id):
    """The channel, with the caller's `membership` (or None) attached; 404 if they cannot see it."""
    channel = visible_channels(user, slug, role).filter(pk=channel_id).first()
    if channel is None:
        raise NotFound("Channel not found.")
    channel.membership = ChannelMember.objects.filter(channel=channel, user=user).first()
    return channel


def require_channel_member(channel):
    """Writes need membership. Only a public channel is visible without it, so this is never a leak."""
    if channel.membership is None:
        raise Forbidden("Join the channel first.")
    return channel.membership


def is_channel_admin(channel, role):
    """A channel admin, or a workspace admin who can see the channel."""
    membership = channel.membership
    return is_workspace_admin(role) or (membership is not None and membership.role == ChannelMemberRole.ADMIN)


def require_channel_admin(channel, role):
    if not is_channel_admin(channel, role):
        raise Forbidden("Only a channel admin or a workspace admin can do this.")


def require_not_archived(channel):
    """Archived channels are read-only."""
    if channel.archived_at is not None:
        raise Conflict("The channel is archived.")


def require_another_admin(channel, member):
    """A private channel keeps a channel admin while anyone else is in it.

    Workspace admins can't see a private channel they aren't in, so without one nobody could
    rename or archive it. Refuses (409) taking away `member`'s admin role, by leaving, removal or
    demotion, when they are the last admin and someone else remains. Call it inside the
    transaction that makes the change: it locks the channel's admin rows.
    """
    if channel.kind != ChannelKind.PRIVATE or member.role != ChannelMemberRole.ADMIN:
        return
    admins = list(
        ChannelMember.objects.select_for_update()
        .filter(channel=channel, role=ChannelMemberRole.ADMIN)
        .values_list("pk", flat=True)
    )
    others = ChannelMember.objects.filter(channel=channel).exclude(pk=member.pk)
    if admins == [member.pk] and others.exists():
        raise Conflict("Make someone else a channel admin first; a private channel needs one.")


def can_open_dms(user, workspace_id, role):
    """Members and admins can always open DMs; a guest only with a workspace admin's grant."""
    if role is not None and role >= ROLE.MEMBER.value:
        return True
    return (
        role is not None
        and ChatGuestPermission.objects.filter(workspace_id=workspace_id, user=user, can_open_dms=True).exists()
    )


def require_named_channel(channel, message):
    """DMs and group DMs have no name, no roles, and a membership fixed at creation."""
    if channel.is_direct:
        raise Conflict(message)
