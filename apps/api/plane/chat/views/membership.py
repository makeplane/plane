# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Channel membership: join, leave, list and manage members, and the read cursor."""

from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.response import Response

from plane.chat.exceptions import BadRequest, Conflict, NotFound
from plane.chat.models import ChannelMember, ChannelMemberRole, Message
from plane.chat.permissions import (
    require_another_admin,
    require_channel_admin,
    require_channel_member,
    require_named_channel,
    require_not_archived,
)
from plane.chat.serializers import (
    ChannelMemberAddSerializer,
    ChannelMemberRoleSerializer,
    ChannelMemberSerializer,
    MarkReadSerializer,
)
from plane.chat.views.base import ChatBaseEndpoint
from plane.chat.views.channel import ChannelPayloadMixin
from plane.db.models import WorkspaceMember

DM_MEMBERS_FIXED = "A direct message's members are fixed."


def _leave(channel):
    """Leaving is idempotent; a DM can't be left (it can be hidden in a later step)."""
    require_named_channel(channel, "You can't leave a direct message.")
    if channel.membership is not None:
        with transaction.atomic():
            require_another_admin(channel, channel.membership)
            channel.membership.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


class ChannelJoinEndpoint(ChannelPayloadMixin, ChatBaseEndpoint):
    def post(self, request, slug, channel_id):
        """Join a public channel. A channel you can see without being in it is always public."""
        channel = self.get_channel(channel_id)
        if channel.membership is not None:
            return Response(self.channel_payload(channel.id))
        require_not_archived(channel)
        try:
            with transaction.atomic():
                ChannelMember.objects.create(channel=channel, user=request.user)
        except IntegrityError:
            # A concurrent join from another tab already added us.
            return Response(self.channel_payload(channel.id))
        return Response(self.channel_payload(channel.id), status=status.HTTP_201_CREATED)


class ChannelLeaveEndpoint(ChatBaseEndpoint):
    def post(self, request, slug, channel_id):
        return _leave(self.get_channel(channel_id))


class ChannelMemberEndpoint(ChatBaseEndpoint):
    def get(self, request, slug, channel_id):
        """Everyone in a channel the caller can see."""
        channel = self.get_channel(channel_id)
        members = ChannelMember.objects.filter(channel=channel).order_by("created_at", "id")
        return Response(ChannelMemberSerializer(members, many=True).data)

    def post(self, request, slug, channel_id):
        """Add workspace members to a channel. Any channel member can; people already in it are skipped."""
        channel = self.get_channel(channel_id)
        require_named_channel(channel, DM_MEMBERS_FIXED)
        require_channel_member(channel)
        require_not_archived(channel)
        serializer = ChannelMemberAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_ids = set(serializer.validated_data["member_ids"])
        in_workspace = set(
            WorkspaceMember.objects.filter(
                workspace_id=channel.workspace_id, member_id__in=user_ids, is_active=True
            ).values_list("member_id", flat=True)
        )
        if in_workspace != user_ids:
            raise BadRequest("Only active members of the workspace can be added.")

        existing = set(ChannelMember.objects.filter(channel=channel).values_list("user_id", flat=True))
        try:
            with transaction.atomic():
                added = [
                    ChannelMember.objects.create(channel=channel, user_id=user_id)
                    for user_id in sorted(user_ids - existing, key=str)
                ]
        except IntegrityError:
            raise Conflict("The channel's members changed while adding; try again.")
        return Response(
            ChannelMemberSerializer(added, many=True).data,
            status=status.HTTP_201_CREATED if added else status.HTTP_200_OK,
        )


class ChannelMemberDetailEndpoint(ChatBaseEndpoint):
    def _target(self, channel, user_id):
        member = ChannelMember.objects.filter(channel=channel, user_id=user_id).first()
        if member is None:
            raise NotFound("Not a member of this channel.")
        return member

    def patch(self, request, slug, channel_id, user_id):
        """Make a member a channel admin or back: a channel admin or a workspace admin."""
        channel = self.get_channel(channel_id)
        require_named_channel(channel, "A direct message has no roles.")
        require_channel_admin(channel, self.role)
        require_not_archived(channel)
        member = self._target(channel, user_id)
        serializer = ChannelMemberRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            if serializer.validated_data["role"] != ChannelMemberRole.ADMIN:
                require_another_admin(channel, member)
            member.role = serializer.validated_data["role"]
            member.save(update_fields=["role", "updated_at", "updated_by"])
        return Response(ChannelMemberSerializer(member).data)

    def delete(self, request, slug, channel_id, user_id):
        """Remove someone: yourself (the same as leaving), or anyone if you're a channel or workspace admin."""
        channel = self.get_channel(channel_id)
        if str(user_id) == str(request.user.id):
            return _leave(channel)
        require_named_channel(channel, DM_MEMBERS_FIXED)
        require_channel_admin(channel, self.role)
        require_not_archived(channel)
        member = self._target(channel, user_id)
        with transaction.atomic():
            require_another_admin(channel, member)
            member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChannelReadEndpoint(ChannelPayloadMixin, ChatBaseEndpoint):
    def post(self, request, slug, channel_id):
        """Move the caller's read cursor to `message_id`. It only moves forward; an older message is a no-op.

        The cursor is a top-level message: unread counts are over top-level messages, so a reply (which can
        be newer than top-level messages not yet seen) would skip them.
        """
        channel = self.get_channel(channel_id)
        require_channel_member(channel)
        serializer = MarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = Message.objects.filter(
            channel=channel, parent__isnull=True, pk=serializer.validated_data["message_id"]
        ).first()
        if message is None:
            raise BadRequest("message_id is not a top-level message in this channel.")

        with transaction.atomic():
            membership = ChannelMember.objects.select_for_update().get(pk=channel.membership.pk)
            current = membership.last_read_message
            if current is None or (message.created_at, message.id) > (current.created_at, current.id):
                membership.last_read_message = message
                membership.save(update_fields=["last_read_message", "updated_at", "updated_by"])
        return Response(self.channel_payload(channel.id))
