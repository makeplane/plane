# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""What every chat endpoint shares: session auth, the workspace check, and the queryset annotations."""

from functools import cached_property

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Case, Count, IntegerField, OuterRef, Q, Subquery, Value, When
from django.db.models.functions import Coalesce
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions.workspace import WorkspaceUserPermission
from plane.app.views.base import BaseAPIView
from plane.chat.models import ChannelMember, Message
from plane.chat.permissions import get_visible_channel, workspace_role
from plane.db.models import Workspace


def _count(queryset, group_by):
    """A correlated COUNT(*) of `queryset` (already filtered on an OuterRef), 0 when nothing matches."""
    counted = queryset.order_by().values(group_by).annotate(n=Count("pk")).values("n")[:1]
    return Coalesce(Subquery(counted, output_field=IntegerField()), Value(0))


def annotate_channels(queryset, user):
    """Add what `ChannelSerializer` reads for this caller, in a fixed number of queries.

    `queryset` must already carry `is_member` (see `permissions.visible_channels`).
    """
    mine = ChannelMember.objects.filter(channel=OuterRef("pk"), user=user)
    top_level = Message.objects.filter(channel=OuterRef("pk"), parent__isnull=True)
    queryset = queryset.annotate(
        my_role=Subquery(mine.values("role")[:1]),
        last_read_message_id=Subquery(mine.values("last_read_message_id")[:1]),
        last_read_at=Subquery(mine.values("last_read_message__created_at")[:1]),
        member_count=_count(ChannelMember.objects.filter(channel=OuterRef("pk")), "channel"),
        last_message_at=Subquery(top_level.order_by("-created_at").values("created_at")[:1]),
    )
    # Unread: top-level, not removed, not mine, and after my read cursor in (created_at, id) order.
    unread = top_level.filter(removed_at__isnull=True).exclude(sender=user)
    after_cursor = unread.filter(
        Q(created_at__gt=OuterRef("last_read_at"))
        | Q(created_at=OuterRef("last_read_at"), id__gt=OuterRef("last_read_message_id"))
    )
    return queryset.annotate(
        unread_count=Case(
            When(is_member=False, then=Value(0)),
            When(last_read_at__isnull=True, then=_count(unread, "channel")),
            default=_count(after_cursor, "channel"),
            output_field=IntegerField(),
        )
    )


def annotate_messages(queryset):
    """Add the thread summary `MessageSerializer` reads: how many replies, and when the last one came."""
    replies = Message.objects.filter(parent=OuterRef("pk"))
    return queryset.annotate(
        reply_count=_count(replies, "parent"),
        last_reply_at=Subquery(replies.order_by("-created_at").values("created_at")[:1]),
    )


class ChatBaseEndpoint(BaseAPIView):
    """Session-authenticated, and only for active members of the workspace in the URL (403 otherwise)."""

    permission_classes = [WorkspaceUserPermission]

    @cached_property
    def role(self):
        return workspace_role(self.request.user, self.workspace_slug)

    @cached_property
    def workspace(self):
        return Workspace.objects.get(slug=self.workspace_slug)

    def get_channel(self, channel_id):
        """The channel if the caller can see it (404 otherwise), with their `membership` or None."""
        return get_visible_channel(self.request.user, self.workspace_slug, self.role, channel_id)

    def handle_exception(self, exc):
        # The models raise Django's ValidationError for rules they enforce (a DM's member set, a reply's
        # parent). plane.app's base turns that into a generic 400; keep the model's message instead.
        if isinstance(exc, DjangoValidationError):
            return Response({"error": " ".join(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
        return super().handle_exception(exc)
