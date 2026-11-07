# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Channels: list, create, view, rename, archive, and open a DM or group DM."""

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.chat.exceptions import BadRequest, Conflict, Forbidden
from plane.chat.models import Channel, ChannelMember, ChannelMemberRole
from plane.chat.permissions import (
    can_create_channels,
    can_open_dms,
    require_channel_admin,
    require_named_channel,
    require_not_archived,
    visible_channels,
)
from plane.chat.serializers import (
    ChannelCreateSerializer,
    ChannelSerializer,
    ChannelUpdateSerializer,
    DirectMessageOpenSerializer,
)
from plane.chat.views.base import ChatBaseEndpoint, annotate_channels
from plane.db.models import User

DUPLICATE_NAME = "A channel with this name already exists."


class ChannelPayloadMixin:
    def channel_payload(self, channel_id):
        """The channel as the caller now sees it, with its unread count and membership."""
        queryset = visible_channels(self.request.user, self.workspace_slug, self.role).filter(pk=channel_id)
        return ChannelSerializer(annotate_channels(queryset, self.request.user).get()).data


class ChannelEndpoint(ChannelPayloadMixin, ChatBaseEndpoint):
    def get(self, request, slug):
        """Every channel and DM the caller can see. `?archived=true` lists archived channels instead."""
        archived = request.query_params.get("archived", "false").lower()
        if archived not in ("true", "false"):
            raise BadRequest("archived must be true or false.")
        queryset = visible_channels(request.user, slug, self.role).filter(archived_at__isnull=archived == "false")
        channels = annotate_channels(queryset, request.user).order_by("kind", "name", "created_at")
        return Response(ChannelSerializer(channels, many=True).data)

    def post(self, request, slug):
        """Create a public or private channel, with the caller as its admin. Guests can't."""
        if not can_create_channels(self.role):
            raise Forbidden("Guests can't create channels.")
        serializer = ChannelCreateSerializer(
            data=request.data, context={"workspace_id": self.workspace.id, "user": request.user}
        )
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                channel = serializer.save(workspace=self.workspace)
                ChannelMember.objects.create(channel=channel, user=request.user, role=ChannelMemberRole.ADMIN)
        except IntegrityError:
            # Someone took the name between the check and the insert.
            raise Conflict(DUPLICATE_NAME)
        return Response(self.channel_payload(channel.id), status=status.HTTP_201_CREATED)


class ChannelDetailEndpoint(ChannelPayloadMixin, ChatBaseEndpoint):
    def get(self, request, slug, channel_id):
        return Response(self.channel_payload(self.get_channel(channel_id).id))

    def patch(self, request, slug, channel_id):
        """Rename a channel or edit its description: a channel admin or a workspace admin."""
        channel = self.get_channel(channel_id)
        require_named_channel(channel, "A direct message has no name or description.")
        require_channel_admin(channel, self.role)
        require_not_archived(channel)
        serializer = ChannelUpdateSerializer(
            channel, data=request.data, partial=True, context={"workspace_id": channel.workspace_id}
        )
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError:
            raise Conflict(DUPLICATE_NAME)
        return Response(self.channel_payload(channel.id))


class ChannelArchiveEndpoint(ChannelPayloadMixin, ChatBaseEndpoint):
    """Archived channels stay readable but take no new messages, edits, removals or members."""

    def post(self, request, slug, channel_id):
        return self._set_archived(channel_id, archived=True)

    def delete(self, request, slug, channel_id):
        return self._set_archived(channel_id, archived=False)

    def _set_archived(self, channel_id, archived):
        channel = self.get_channel(channel_id)
        require_named_channel(channel, "A direct message can't be archived.")
        require_channel_admin(channel, self.role)
        if (channel.archived_at is not None) != archived:
            channel.archived_at = timezone.now() if archived else None
            channel.save(update_fields=["archived_at", "updated_at", "updated_by"])
        return Response(self.channel_payload(channel.id))


class DirectMessageEndpoint(ChannelPayloadMixin, ChatBaseEndpoint):
    def post(self, request, slug):
        """Open the DM (one other person) or group DM (several) with exactly these people, creating it if needed.

        Workspace members and admins can; a guest only once a workspace admin has granted it
        (`guests/<user_id>/dm-access/`). Anyone can be included, guests too, and everyone in it must be
        an active workspace member.
        """
        if not can_open_dms(request.user, self.workspace.id, self.role):
            raise Forbidden("Guests need a workspace admin to give them DM access.")
        serializer = DirectMessageOpenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        other_ids = {str(user_id) for user_id in serializer.validated_data["member_ids"]} - {str(request.user.id)}
        if not other_ids:
            raise BadRequest("Name at least one other person.")
        others = list(User.objects.filter(pk__in=other_ids))
        if len(others) != len(other_ids):
            raise BadRequest("Every member of a direct message must be an active member of the workspace.")

        people = [request.user, *others]
        if len(people) == 2:
            channel, created = Channel.objects.get_or_create_dm(self.workspace, *people)
        else:
            channel, created = Channel.objects.get_or_create_group_dm(self.workspace, people)
        return Response(
            self.channel_payload(channel.id), status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )
