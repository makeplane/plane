# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.exceptions import NotFound, ParseError
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import User, Workspace
from plane.team_ops.models import HubAttachment, HubChannel, HubMention, HubMessage
from plane.team_ops.services import hub, hub_files
from plane.team_ops.services.access import CALENDAR_ROLES, CalendarAccess
from plane.team_ops.services.time_entry import parse_uuid

PAGE_SIZE = 100


def person(user):
    return {"id": user.id, "display_name": user.display_name, "avatar_url": user.avatar_url}


def _ids(request, key):
    """Ids sent as a JSON list or as repeated multipart fields."""
    data = request.data
    values = data.getlist(key) if hasattr(data, "getlist") else data.get(key) or []
    if not isinstance(values, list):
        raise ParseError(detail=f"Invalid {key}.")
    return {parse_uuid(value, key) for value in values}


def _message_payload(message, viewer):
    deleted = message.is_deleted
    return {
        "id": message.id,
        "channel": message.channel_id,
        "author": person(message.author),
        "body": "" if deleted else message.body,
        "parent": message.parent_id,
        "kind": message.kind,
        "session": message.session_id,
        "created_at": message.created_at,
        "edited_at": message.edited_at,
        "is_deleted": deleted,
        "mentions": [] if deleted else [person(mention.user) for mention in message.mentions.all()],
        "mentions_me": (not deleted) and any(mention.user_id == viewer.id for mention in message.mentions.all()),
        "attachments": []
        if deleted
        else [
            {"id": a.id, "name": a.name, "content_type": a.content_type, "size": a.size}
            for a in message.attachments.all()
        ],
    }


def _channel_payload(channel, unread):
    return {
        "id": channel.id,
        "kind": channel.kind,
        "name": channel.team.name if channel.kind == HubChannel.Kind.TEAM else channel.project.name,
        "team": channel.team_id,
        "project": channel.project_id,
        "unread": unread,
    }


def _forbidden():
    return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)


class HubChannelListEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """The channels of the teams and projects the caller belongs to, with what is unread."""
        workspace = Workspace.objects.get(slug=slug)
        if not CalendarAccess(request.user, workspace).is_calendar_user:
            return _forbidden()
        channels = list(hub.channels_of(workspace, request.user))
        unread = hub.unread_counts(request.user, channels)
        results = [_channel_payload(channel, unread[channel.id]) for channel in channels]
        results.sort(key=lambda row: (row["kind"], row["name"].lower()))
        mentions = HubMention.objects.filter(
            user=request.user, read_at__isnull=True, message__channel__workspace=workspace
        )
        return Response({"results": results, "unread_mentions": mentions.count()})


class HubChannelDetailEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug, pk):
        """A channel with the people who can be tagged in it."""
        workspace = Workspace.objects.get(slug=slug)
        channel = hub.get_channel(workspace, pk, request.user)
        members = User.objects.filter(pk__in=hub.channel_member_ids(channel)).order_by("display_name")
        payload = _channel_payload(channel, 0)
        payload["members"] = [person(member) for member in members]
        return Response(payload)


class HubMessageListEndpoint(BaseAPIView):
    def _messages(self, channel):
        return (
            HubMessage.objects.filter(channel=channel)
            .select_related("author")
            .prefetch_related("mentions__user", "attachments")
        )

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug, pk):
        """The newest messages of a channel, oldest first. Opening a channel marks it read."""
        workspace = Workspace.objects.get(slug=slug)
        channel = hub.get_channel(workspace, pk, request.user)
        queryset = self._messages(channel)
        before = request.query_params.get("before")
        if before:
            anchor = queryset.filter(pk=parse_uuid(before, "before")).first()
            if anchor is None:
                raise ParseError(detail="Unknown message.")
            queryset = queryset.filter(created_at__lt=anchor.created_at)
        page = list(queryset.order_by("-created_at")[: PAGE_SIZE + 1])
        has_more = len(page) > PAGE_SIZE
        page = list(reversed(page[:PAGE_SIZE]))
        if not before:
            hub.mark_read(channel, request.user)
            HubMention.objects.filter(user=request.user, message__channel=channel, read_at__isnull=True).update(
                read_at=timezone.now()
            )
        return Response({"results": [_message_payload(m, request.user) for m in page], "has_more": has_more})

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug, pk):
        """Write a message. Send JSON, or multipart when files come with it."""
        workspace = Workspace.objects.get(slug=slug)
        channel = hub.get_channel(workspace, pk, request.user)
        files = request.FILES.getlist("files")
        body = request.data.get("body", "")
        if not isinstance(body, str):
            raise ParseError(detail="Invalid body.")
        if not body.strip() and not files:
            raise ParseError(detail="Write a message or attach a file.")
        if len(files) > hub_files.MAX_FILES_PER_MESSAGE:
            raise ParseError(detail=f"At most {hub_files.MAX_FILES_PER_MESSAGE} files per message.")
        parent = None
        if request.data.get("parent"):
            parent = HubMessage.objects.filter(channel=channel, pk=parse_uuid(request.data["parent"], "parent")).first()
            if parent is None:
                raise ParseError(detail="Unknown message to reply to.")
        # Check every file before anything is written, so a bad one does not leave a half-sent message.
        for upload in files:
            hub_files.validate_upload(upload)
        message = hub.post_message(
            channel=channel,
            author=request.user,
            body=body,
            parent=parent,
            user_ids=_ids(request, "users"),
            team_ids=_ids(request, "teams"),
        )
        for upload in files:
            hub_files.store_attachment(workspace=workspace, user=request.user, upload=upload, message=message)
        message = self._messages(channel).get(pk=message.pk)
        return Response(_message_payload(message, request.user), status=status.HTTP_201_CREATED)


class HubMessageDetailEndpoint(BaseAPIView):
    def _message(self, workspace, request, pk):
        message = HubMessage.objects.filter(pk=pk, channel__workspace=workspace).select_related("channel").first()
        if message is None:
            raise NotFound("Message not found.")
        hub.get_channel(workspace, message.channel_id, request.user)
        return message

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def patch(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)
        message = hub.edit_message(self._message(workspace, request, pk), request.user, request.data.get("body"))
        message = (
            HubMessage.objects.select_related("author")
            .prefetch_related("mentions__user", "attachments")
            .get(pk=message.pk)
        )
        return Response(_message_payload(message, request.user))

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def delete(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)
        message = self._message(workspace, request, pk)
        hub.delete_message(message, request.user, CalendarAccess(request.user, workspace).is_admin)
        return Response(status=status.HTTP_204_NO_CONTENT)


class HubAttachmentDownloadEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug, pk):
        """A short-lived signed link to a file, for someone who may read where it was shared."""
        workspace = Workspace.objects.get(slug=slug)
        attachment = (
            HubAttachment.objects.filter(pk=pk, workspace=workspace).select_related("message", "session").first()
        )
        if attachment is None:
            raise NotFound("File not found.")
        if attachment.message_id:
            if attachment.message.is_deleted:
                raise NotFound("File not found.")
            hub.get_channel(workspace, attachment.message.channel_id, request.user)
        else:
            session = attachment.session
            access = CalendarAccess(request.user, workspace)
            same_project = hub.channel_for_project(workspace, session.project)
            if session.user_id != request.user.id and not access.can_view_user(session.user_id):
                if not hub.is_member(same_project, request.user):
                    raise NotFound("File not found.")
        url = hub_files.download_url(attachment)
        if not url:
            raise ParseError(detail="The file is not available.")
        return Response({"url": url, "name": attachment.name, "expires_in": hub_files.DOWNLOAD_LINK_SECONDS})


class HubMentionEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Where the caller was tagged, newest first."""
        workspace = Workspace.objects.get(slug=slug)
        mentions = (
            HubMention.objects.filter(
                user=request.user, message__channel__workspace=workspace, message__is_deleted=False
            )
            .select_related("message", "message__author", "message__channel", "via_team")
            .order_by("-created_at")[:50]
        )
        results = [
            {
                "id": mention.id,
                "channel": mention.message.channel_id,
                "message": mention.message_id,
                "author": person(mention.message.author),
                "body": mention.message.body[:300],
                "kind": mention.message.kind,
                "via_team": mention.via_team.name if mention.via_team else None,
                "created_at": mention.created_at,
                "read": mention.read_at is not None,
            }
            for mention in mentions
        ]
        return Response({"results": results})

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        """Mark all the caller's mentions read."""
        workspace = Workspace.objects.get(slug=slug)
        HubMention.objects.filter(
            user=request.user, message__channel__workspace=workspace, read_at__isnull=True
        ).update(read_at=timezone.now())
        return Response(status=status.HTTP_204_NO_CONTENT)
