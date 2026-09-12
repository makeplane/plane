# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.utils import timezone
from django.utils.dateparse import parse_datetime

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE
from plane.app.serializers import ChatChannelSerializer, ChatMessageSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import ChatChannel, ChatMessage, ProjectMember, Workspace, WorkspaceMember

# Messages returned by one page of the feed.
MESSAGE_PAGE_SIZE = 50
MESSAGE_PAGE_MAX = 200


class ChatAccessMixin:
    """Membership checks shared by the channel and message viewsets.

    Both viewsets serve two URL shapes: workspace channels under
    /workspaces/<slug>/chat/... and project channels under
    /workspaces/<slug>/projects/<project_id>/chat/.... The scope is read from
    the URL kwargs, so the same method handles both.
    """

    @property
    def scope_project_id(self):
        return self.kwargs.get("project_id")

    def membership(self, request):
        """Return the caller's role in the current scope, or None."""
        slug = self.kwargs["slug"]
        project_id = self.scope_project_id
        if project_id:
            member = (
                ProjectMember.objects.filter(
                    member=request.user, workspace__slug=slug, project_id=project_id, is_active=True
                )
                .values_list("role", flat=True)
                .first()
            )
            if member is not None:
                return member
            # Workspace admins can reach every project they belong to; the
            # project membership check above already covers that.
            return None
        return (
            WorkspaceMember.objects.filter(member=request.user, workspace__slug=slug, is_active=True)
            .values_list("role", flat=True)
            .first()
        )

    def forbidden(self):
        return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)

    def scoped_channels(self):
        return ChatChannel.objects.filter(workspace__slug=self.kwargs["slug"], project_id=self.scope_project_id)


class ChatChannelViewSet(ChatAccessMixin, BaseViewSet):
    serializer_class = ChatChannelSerializer
    model = ChatChannel

    def get_queryset(self):
        return self.scoped_channels().select_related("workspace", "project")

    def ensure_default_channel(self):
        """Create the #general channel for this scope if it is missing."""
        if self.scoped_channels().filter(is_default=True).exists():
            return
        workspace = Workspace.objects.get(slug=self.kwargs["slug"])
        ChatChannel.objects.get_or_create(
            workspace=workspace,
            project_id=self.scope_project_id,
            name=ChatChannel.DEFAULT_NAME,
            defaults={"is_default": True, "description": "Talk to the whole team."},
        )

    def list(self, request, *args, **kwargs):
        if self.membership(request) is None:
            return self.forbidden()
        self.ensure_default_channel()
        return Response(ChatChannelSerializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        role = self.membership(request)
        if role is None or role < ROLE.MEMBER.value:
            return self.forbidden()
        serializer = ChatChannelSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        if self.scoped_channels().filter(name=serializer.validated_data["name"]).exists():
            return Response({"name": ["A channel with this name already exists."]}, status=status.HTTP_400_BAD_REQUEST)
        workspace = Workspace.objects.get(slug=kwargs["slug"])
        serializer.save(workspace=workspace, project_id=self.scope_project_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        channel = self.get_object()
        role = self.membership(request)
        if role is None or not (role == ROLE.ADMIN.value or channel.created_by_id == request.user.id):
            return self.forbidden()
        if channel.is_default and "name" in request.data:
            return Response({"name": ["The default channel cannot be renamed."]}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ChatChannelSerializer(channel, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        new_name = serializer.validated_data.get("name")
        if new_name and self.scoped_channels().filter(name=new_name).exclude(pk=channel.pk).exists():
            return Response({"name": ["A channel with this name already exists."]}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        channel = self.get_object()
        role = self.membership(request)
        if role is None or not (role == ROLE.ADMIN.value or channel.created_by_id == request.user.id):
            return self.forbidden()
        if channel.is_default:
            return Response({"error": "The default channel cannot be deleted."}, status=status.HTTP_400_BAD_REQUEST)
        channel.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatMessageViewSet(ChatAccessMixin, BaseViewSet):
    """The message feed of one channel.

    GET returns the newest page in chronological order. Two optional query
    parameters walk the feed:
      - after=<iso datetime>: only messages created after that instant, which
        the client polls with to pick up new messages;
      - before=<iso datetime>: the page of older messages ending at that
        instant, for scrolling back.
    Each page reports has_more so the client knows when to stop.
    """

    serializer_class = ChatMessageSerializer
    model = ChatMessage

    def get_channel(self):
        return self.scoped_channels().filter(pk=self.kwargs["channel_id"]).first()

    def get_queryset(self):
        return ChatMessage.objects.filter(
            channel_id=self.kwargs["channel_id"], workspace__slug=self.kwargs["slug"]
        ).select_related("created_by", "created_by__avatar_asset")

    def page_size(self, request):
        try:
            requested = int(request.query_params.get("per_page", MESSAGE_PAGE_SIZE))
        except ValueError:
            requested = MESSAGE_PAGE_SIZE
        return max(1, min(requested, MESSAGE_PAGE_MAX))

    def list(self, request, *args, **kwargs):
        if self.membership(request) is None or self.get_channel() is None:
            return self.forbidden()
        queryset = self.get_queryset()
        limit = self.page_size(request)

        after = parse_datetime(request.query_params.get("after") or "")
        before = parse_datetime(request.query_params.get("before") or "")
        if after:
            rows = list(queryset.filter(created_at__gt=after).order_by("created_at")[: limit + 1])
            has_more = len(rows) > limit
            rows = rows[:limit]
        else:
            if before:
                queryset = queryset.filter(created_at__lt=before)
            rows = list(queryset.order_by("-created_at")[: limit + 1])
            has_more = len(rows) > limit
            rows = list(reversed(rows[:limit]))

        return Response(
            {
                "results": ChatMessageSerializer(rows, many=True).data,
                "has_more": has_more,
                "server_time": timezone.now(),
            }
        )

    def create(self, request, *args, **kwargs):
        if self.membership(request) is None:
            return self.forbidden()
        channel = self.get_channel()
        if channel is None:
            return self.forbidden()
        serializer = ChatMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        message = serializer.save(channel=channel, workspace=channel.workspace, project_id=channel.project_id)
        # Reload so the sender relation is populated for the response.
        message = self.get_queryset().get(pk=message.pk)
        return Response(ChatMessageSerializer(message).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        if self.membership(request) is None:
            return self.forbidden()
        message = self.get_queryset().filter(pk=kwargs["pk"]).first()
        if message is None:
            return Response({"error": "Message not found."}, status=status.HTTP_404_NOT_FOUND)
        if message.created_by_id != request.user.id:
            return self.forbidden()
        serializer = ChatMessageSerializer(message, data={"content": request.data.get("content", "")}, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(edited_at=timezone.now())
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        role = self.membership(request)
        if role is None:
            return self.forbidden()
        message = self.get_queryset().filter(pk=kwargs["pk"]).first()
        if message is None:
            return Response({"error": "Message not found."}, status=status.HTTP_404_NOT_FOUND)
        if not (message.created_by_id == request.user.id or role == ROLE.ADMIN.value):
            return self.forbidden()
        message.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
