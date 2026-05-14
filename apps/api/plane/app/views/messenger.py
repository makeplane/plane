# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import hashlib
import os
import uuid

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import transaction
from django.db.models import Q, Count, Max
from django.http import FileResponse
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    ChatMessenger,
    ChatMemberMessenger,
    UserChatStateMessenger,
    MessageMessenger,
    MessageReceiptMessenger,
    MessageAttachmentMessenger,
    MessageReactionMessenger,
    PinnedMessageMessenger,
    MessageDeletionMessenger,
    ChatDeletionMessenger,
    BlockMessenger,
    UserRelationMessenger,
    Workspace,
    WorkspaceMember,
    User,
    Project,
    ProjectMember,
    InviteLinkMessenger,
    InviteLinkUseMessenger,
)
from plane.app.serializers import (
    ChatMessengerSerializer,
    ChatMessengerLiteSerializer,
    ChatMemberMessengerSerializer,
    UserChatStateMessengerSerializer,
    MessageMessengerSerializer,
    MessageMessengerLiteSerializer,
    MessageReactionMessengerSerializer,
    MessageAttachmentMessengerSerializer,
    PinnedMessageMessengerSerializer,
    BlockMessengerSerializer,
    UserRelationMessengerSerializer,
    InviteLinkMessengerSerializer,
)
from .base import BaseAPIView, BaseViewSet


class ChatListCreateAPIEndpoint(BaseAPIView):
    """List and create chats globally for the current user."""

    def _ensure_membership(self, chat, user):
        if not ChatMemberMessenger.objects.filter(
            chat=chat, user=user, is_active=True
        ).exists():
            return Response(
                {"error": "You are not a member of this chat"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def get(self, request):
        """List all chats where the current user is a member across workspaces."""
        user = request.user

        # Get chat IDs where user is a member
        member_chat_ids = ChatMemberMessenger.objects.filter(
            user=user, is_active=True
        ).values_list("chat_id", flat=True)

        # Exclude chats deleted by this user
        deleted_chat_ids = ChatDeletionMessenger.objects.filter(
            user=user
        ).values_list("chat_id", flat=True)

        chats = (
            ChatMessenger.objects.filter(
                id__in=member_chat_ids
            )
            .exclude(id__in=deleted_chat_ids)
            .annotate(
                last_message_time=Max("messages__created_at"),
            )
            .order_by("-last_message_time", "-updated_at")
        )

        serializer = ChatMessengerSerializer(
            chats, many=True, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Create a new chat (group, direct or bot)."""
        chat_type = request.data.get("type", "direct")
        title = request.data.get("title", "")
        member_ids = request.data.get("members", [])
        project_id = request.data.get("project_id")
        organization_id = request.data.get("organization_id")

        workspace = None
        if organization_id:
            workspace = Workspace.objects.filter(pk=organization_id).first()
        elif project_id:
            project = Project.objects.filter(pk=project_id).first()
            if project:
                workspace = project.workspace
        if not workspace:
            workspace = Workspace.objects.filter(
                workspace_member__member=request.user
            ).first()

        if not workspace:
            return Response(
                {"error": "No workspace found for user"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            kwargs = {
                "organization": workspace,
                "type": chat_type,
                "title": title if chat_type != "direct" else None,
                "created_by": request.user,
                "updated_by": request.user,
            }
            if project_id:
                kwargs["project_id"] = project_id

            chat = ChatMessenger.objects.create(**kwargs)

            # Add creator as owner
            ChatMemberMessenger.objects.create(
                chat=chat,
                user=request.user,
                role="owner" if chat_type in ["group", "bot"] else "member",
            )

            # Add other members
            for member_id in member_ids:
                if str(member_id) != str(request.user.id):
                    ChatMemberMessenger.objects.get_or_create(
                        chat=chat,
                        user_id=member_id,
                        defaults={"role": "member"},
                    )

        serializer = ChatMessengerSerializer(chat, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectTeamChatAPIEndpoint(BaseAPIView):
    """Get or create the team chat for a project."""

    def get(self, request, project_id):
        user = request.user

        project = Project.objects.filter(pk=project_id).first()
        if not project:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not ProjectMember.objects.filter(
            project=project, member=user, is_active=True
        ).exists():
            return Response(
                {"error": "Access denied"},
                status=status.HTTP_403_FORBIDDEN,
            )

        workspace = project.workspace

        # Look for existing project group chat
        chat = (
            ChatMessenger.objects.filter(
                organization=workspace,
                project_id=project_id,
                type="group",
            )
            .prefetch_related("members")
            .first()
        )

        if not chat:
            # Create team chat
            with transaction.atomic():
                chat = ChatMessenger.objects.create(
                    organization=workspace,
                    project=project,
                    type="group",
                    title=project.name,
                    avatar_color="blue",
                    created_by=request.user,
                    updated_by=request.user,
                )
                # Add all project members
                member_ids = ProjectMember.objects.filter(
                    project=project, is_active=True
                ).values_list("member_id", flat=True)
                for uid in member_ids:
                    ChatMemberMessenger.objects.get_or_create(
                        chat=chat,
                        user_id=uid,
                        defaults={"role": "member"},
                    )

        # Ensure current user is a member
        ChatMemberMessenger.objects.get_or_create(
            chat=chat,
            user=user,
            defaults={"role": "member"},
        )

        serializer = ChatMessengerSerializer(chat, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChatDetailAPIEndpoint(BaseAPIView):
    """Retrieve, update or delete a chat."""

    def _get_chat(self, pk, user):
        chat = ChatMessenger.objects.get(pk=pk)
        if not ChatMemberMessenger.objects.filter(
            chat=chat, user=user, is_active=True
        ).exists():
            raise PermissionError("You are not a member of this chat")
        return chat

    def get(self, request, pk):
        try:
            chat = self._get_chat(pk, request.user)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ChatMessenger.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ChatMessengerSerializer(chat, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        try:
            chat = self._get_chat(pk, request.user)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ChatMessenger.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        # Only owner/admin can update
        membership = ChatMemberMessenger.objects.filter(
            chat=chat, user=request.user, is_active=True
        ).first()
        if not membership or membership.role not in ["owner", "admin"]:
            return Response(
                {"error": "Only owner or admin can update the chat"},
                status=status.HTTP_403_FORBIDDEN,
            )

        allowed_fields = ["title", "avatar_url", "avatar_initials", "avatar_color"]
        for field in allowed_fields:
            if field in request.data:
                setattr(chat, field, request.data[field])
        chat.updated_by = request.user
        chat.save()

        serializer = ChatMessengerSerializer(chat, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            chat = self._get_chat(pk, request.user)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ChatMessenger.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        # Mark as deleted for this user
        ChatDeletionMessenger.objects.get_or_create(chat=chat, user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatMemberListCreateAPIEndpoint(BaseAPIView):
    """List and add chat members."""

    def _get_chat(self, pk, user):
        chat = ChatMessenger.objects.get(pk=pk)
        if not ChatMemberMessenger.objects.filter(
            chat=chat, user=user, is_active=True
        ).exists():
            raise PermissionError("You are not a member of this chat")
        return chat

    def get(self, request, chat_id):
        try:
            chat = self._get_chat(chat_id, request.user)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ChatMessenger.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        members = ChatMemberMessenger.objects.filter(chat=chat, is_active=True)
        serializer = ChatMemberMessengerSerializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, chat_id):
        try:
            chat = self._get_chat(chat_id, request.user)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ChatMessenger.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions
        membership = ChatMemberMessenger.objects.filter(
            chat=chat, user=request.user, is_active=True
        ).first()
        if not membership or membership.role not in ["owner", "admin"]:
            return Response(
                {"error": "Only owner or admin can add members"},
                status=status.HTTP_403_FORBIDDEN,
            )

        user_id = request.data.get("user_id")
        role = request.data.get("role", "member")
        member, _ = ChatMemberMessenger.objects.get_or_create(
            chat=chat, user_id=user_id, defaults={"role": role}
        )
        serializer = ChatMemberMessengerSerializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChatMemberDetailAPIEndpoint(BaseAPIView):
    """Update or remove a chat member."""

    def _get_chat(self, pk, user):
        chat = ChatMessenger.objects.get(pk=pk)
        if not ChatMemberMessenger.objects.filter(
            chat=chat, user=user, is_active=True
        ).exists():
            raise PermissionError("You are not a member of this chat")
        return chat

    def patch(self, request, chat_id, pk):
        try:
            chat = self._get_chat(chat_id, request.user)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ChatMessenger.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        membership = ChatMemberMessenger.objects.filter(
            chat=chat, user=request.user, is_active=True
        ).first()
        if not membership or membership.role not in ["owner", "admin"]:
            return Response(
                {"error": "Only owner or admin can update members"},
                status=status.HTTP_403_FORBIDDEN,
            )

        member = ChatMemberMessenger.objects.get(chat=chat, pk=pk)
        if "role" in request.data:
            member.role = request.data["role"]
        if "is_active" in request.data:
            member.is_active = request.data["is_active"]
            if not member.is_active:
                member.left_at = timezone.now()
        member.save()

        serializer = ChatMemberMessengerSerializer(member)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, chat_id, pk):
        try:
            chat = self._get_chat(chat_id, request.user)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ChatMessenger.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        membership = ChatMemberMessenger.objects.filter(
            chat=chat, user=request.user, is_active=True
        ).first()
        if not membership or membership.role not in ["owner", "admin"]:
            return Response(
                {"error": "Only owner or admin can remove members"},
                status=status.HTTP_403_FORBIDDEN,
            )

        member = ChatMemberMessenger.objects.get(chat=chat, pk=pk)
        member.is_active = False
        member.left_at = timezone.now()
        member.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MessageListCreateAPIEndpoint(BaseAPIView):
    """List and create messages in a chat."""

    def _get_chat(self, pk, user):
        chat = ChatMessenger.objects.get(pk=pk)
        if not ChatMemberMessenger.objects.filter(
            chat=chat, user=user, is_active=True
        ).exists():
            raise PermissionError("You are not a member of this chat")
        return chat

    def get(self, request, chat_id):
        try:
            chat = self._get_chat(chat_id, request.user)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ChatMessenger.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        # Exclude messages deleted for this user
        deleted_message_ids = MessageDeletionMessenger.objects.filter(
            user=request.user, scope="for_me"
        ).values_list("message_id", flat=True)

        messages = (
            MessageMessenger.objects.filter(chat=chat)
            .exclude(id__in=deleted_message_ids)
            .order_by("created_at")
        )

        # Pagination
        limit = int(request.GET.get("limit", 50))
        offset = int(request.GET.get("offset", 0))
        total = messages.count()
        page_messages = messages[offset : offset + limit]

        serializer = MessageMessengerSerializer(page_messages, many=True)
        return Response(
            {
                "results": serializer.data,
                "total": total,
                "offset": offset,
                "limit": limit,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, chat_id):
        try:
            chat = self._get_chat(chat_id, request.user)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ChatMessenger.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check block
        other_members = ChatMemberMessenger.objects.filter(
            chat=chat, is_active=True
        ).exclude(user=request.user)
        for member in other_members:
            if BlockMessenger.objects.filter(
                blocker=member.user, blocked_user=request.user
            ).exists():
                return Response(
                    {"error": "You are blocked by a chat member"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        with transaction.atomic():
            has_files = bool(request.FILES)
            message = MessageMessenger.objects.create(
                chat=chat,
                sender=request.user,
                type="media" if has_files else (request.data.get("type") or "text"),
                text=request.data.get("text", ""),
                reply_to_message_id=request.data.get("reply_to_message_id") or None,
                forwarded_from_message_id=request.data.get("forwarded_from_message_id") or None,
                forwarded_from_user_id=request.data.get("forwarded_from_user_id") or None,
                status="sent",
                created_by=request.user,
                updated_by=request.user,
            )

            # Handle file uploads
            messenger_storage = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, "messenger"))
            max_size = getattr(settings, "FILE_SIZE_LIMIT", 2 * 1024 * 1024 * 1024)
            for key, uploaded_file in request.FILES.items():
                if uploaded_file.size > max_size:
                    continue
                ext = uploaded_file.name.split(".")[-1].lower() if "." in uploaded_file.name else ""
                relative_path = f"{chat_id}/{message.id}/{uuid.uuid4()}_{uploaded_file.name}"
                saved_path = messenger_storage.save(relative_path, uploaded_file)
                storage_key = f"messenger/{saved_path}"
                public_url = f"/api/messenger/files/{storage_key}"

                MessageAttachmentMessenger.objects.create(
                    message=message,
                    uploader=request.user,
                    original_name=uploaded_file.name,
                    mime_type=uploaded_file.content_type or "application/octet-stream",
                    size_bytes=uploaded_file.size,
                    storage_provider="local",
                    storage_key=storage_key,
                    public_url=public_url,
                )

            # Create receipts for other members
            for member in other_members:
                MessageReceiptMessenger.objects.create(
                    message=message,
                    user=member.user,
                )

            # Update chat updated_at
            chat.save()

        serializer = MessageMessengerSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageDetailAPIEndpoint(BaseAPIView):
    """Retrieve, update or delete a message."""

    def _get_chat(self, pk, user):
        chat = ChatMessenger.objects.get(pk=pk)
        if not ChatMemberMessenger.objects.filter(
            chat=chat, user=user, is_active=True
        ).exists():
            raise PermissionError("You are not a member of this chat")
        return chat

    def get(self, request, chat_id, pk):
        try:
            chat = self._get_chat(chat_id, request.user)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ChatMessenger.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        message = MessageMessenger.objects.get(chat=chat, pk=pk)
        serializer = MessageMessengerSerializer(message)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, chat_id, pk):
        try:
            chat = self._get_chat(chat_id, request.user)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ChatMessenger.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        message = MessageMessenger.objects.get(chat=chat, pk=pk)
        if message.sender != request.user:
            return Response(
                {"error": "You can only edit your own messages"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if "text" in request.data:
            message.text = request.data["text"]
            message.edited_at = timezone.now()
            message.updated_by = request.user
            message.save()

        serializer = MessageMessengerSerializer(message)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, chat_id, pk):
        try:
            chat = self._get_chat(chat_id, request.user)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ChatMessenger.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        message = MessageMessenger.objects.get(chat=chat, pk=pk)

        scope = request.data.get("scope", "for_me")
        # If message sender and scope is for_everyone, allow
        if scope == "for_everyone" and message.sender != request.user:
            return Response(
                {"error": "You can only delete your own messages for everyone"},
                status=status.HTTP_403_FORBIDDEN,
            )

        MessageDeletionMessenger.objects.create(
            message=message,
            user=request.user,
            scope=scope,
        )

        if scope == "for_everyone":
            message.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class MessageReactionListCreateAPIEndpoint(BaseAPIView):
    """List and create reactions for a message."""

    def get(self, request, chat_id, message_id):
        reactions = MessageReactionMessenger.objects.filter(
            message_id=message_id
        )
        serializer = MessageReactionMessengerSerializer(reactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, chat_id, message_id):
        emoji = request.data.get("emoji")
        reaction, created = MessageReactionMessenger.objects.get_or_create(
            message_id=message_id,
            user=request.user,
            emoji=emoji,
        )
        serializer = MessageReactionMessengerSerializer(reaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, chat_id, message_id):
        emoji = request.data.get("emoji")
        MessageReactionMessenger.objects.filter(
            message_id=message_id, user=request.user, emoji=emoji
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MessageReadAPIEndpoint(BaseAPIView):
    """Mark messages as read."""

    def post(self, request, chat_id):
        chat = ChatMessenger.objects.get(pk=chat_id)
        if not ChatMemberMessenger.objects.filter(
            chat=chat, user=request.user, is_active=True
        ).exists():
            return Response(
                {"error": "You are not a member of this chat"},
                status=status.HTTP_403_FORBIDDEN,
            )

        message_ids = request.data.get("message_ids", [])
        last_message_id = request.data.get("last_message_id")

        if last_message_id:
            # Mark all messages up to last_message_id as read
            messages = MessageMessenger.objects.filter(
                chat=chat,
                id__lte=last_message_id,
            ).exclude(sender=request.user)

            for msg in messages:
                receipt, _ = MessageReceiptMessenger.objects.get_or_create(
                    message=msg,
                    user=request.user,
                )
                if not receipt.read_at:
                    receipt.read_at = timezone.now()
                    receipt.save()

        elif message_ids:
            for msg_id in message_ids:
                receipt, _ = MessageReceiptMessenger.objects.get_or_create(
                    message_id=msg_id,
                    user=request.user,
                )
                if not receipt.read_at:
                    receipt.read_at = timezone.now()
                    receipt.save()

        # Update user chat state
        state, _ = UserChatStateMessenger.objects.get_or_create(
            user=request.user,
            chat=chat,
        )
        if last_message_id:
            state.last_read_message_id = last_message_id
        elif message_ids:
            state.last_read_message_id = message_ids[-1]
        state.last_read_at = timezone.now()
        state.unread_count_cache = 0
        state.save()

        return Response({"status": "read"}, status=status.HTTP_200_OK)


class PinnedMessageListCreateAPIEndpoint(BaseAPIView):
    """List and create pinned messages."""

    def get(self, request, chat_id):
        pinned = PinnedMessageMessenger.objects.filter(
            chat_id=chat_id
        ).select_related("message", "pinned_by")
        serializer = PinnedMessageMessengerSerializer(pinned, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, chat_id):
        chat = ChatMessenger.objects.get(pk=chat_id)
        if not ChatMemberMessenger.objects.filter(
            chat=chat, user=request.user, is_active=True
        ).exists():
            return Response(
                {"error": "You are not a member of this chat"},
                status=status.HTTP_403_FORBIDDEN,
            )

        membership = ChatMemberMessenger.objects.filter(
            chat=chat, user=request.user, is_active=True
        ).first()
        if not membership or membership.role not in ["owner", "admin"]:
            return Response(
                {"error": "Only owner or admin can pin messages"},
                status=status.HTTP_403_FORBIDDEN,
            )

        message_id = request.data.get("message_id")
        # Unpin existing if any
        PinnedMessageMessenger.objects.filter(chat=chat).delete()
        pinned = PinnedMessageMessenger.objects.create(
            chat=chat,
            message_id=message_id,
            pinned_by=request.user,
        )
        # Update message
        MessageMessenger.objects.filter(pk=message_id).update(is_pinned=True)
        serializer = PinnedMessageMessengerSerializer(pinned)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, chat_id):
        chat = ChatMessenger.objects.get(pk=chat_id)
        if not ChatMemberMessenger.objects.filter(
            chat=chat, user=request.user, is_active=True
        ).exists():
            return Response(
                {"error": "You are not a member of this chat"},
                status=status.HTTP_403_FORBIDDEN,
            )

        pinned = PinnedMessageMessenger.objects.filter(chat=chat)
        message_ids = list(pinned.values_list("message_id", flat=True))
        pinned.delete()
        MessageMessenger.objects.filter(id__in=message_ids).update(is_pinned=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatStateUpdateAPIEndpoint(BaseAPIView):
    """Update user chat state (pin, archive, mute, block, draft)."""

    def get(self, request):
        """Get all chat states for current user globally."""
        states = UserChatStateMessenger.objects.filter(
            user=request.user,
        )
        serializer = UserChatStateMessengerSerializer(states, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, chat_id):
        state, _ = UserChatStateMessenger.objects.get_or_create(
            user=request.user,
            chat_id=chat_id,
        )

        if "pinned_at" in request.data:
            state.pinned_at = request.data["pinned_at"] if request.data["pinned_at"] else None
        if "archived_at" in request.data:
            state.archived_at = request.data["archived_at"] if request.data["archived_at"] else None
        if "muted_until" in request.data:
            state.muted_until = request.data["muted_until"] if request.data["muted_until"] else None
        if "blocked_at" in request.data:
            state.blocked_at = request.data["blocked_at"] if request.data["blocked_at"] else None
        if "draft_text" in request.data:
            state.draft_text = request.data["draft_text"]
            state.draft_updated_at = timezone.now() if state.draft_text else None
        if "draft_reply_to_message_id" in request.data:
            state.draft_reply_to_message_id = request.data["draft_reply_to_message_id"] or None
        if "last_read_message_id" in request.data:
            state.last_read_message_id = request.data["last_read_message_id"]
            state.last_read_at = timezone.now()
        if "unread_count_cache" in request.data:
            state.unread_count_cache = request.data["unread_count_cache"]

        state.save()
        serializer = UserChatStateMessengerSerializer(state)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BlockListCreateAPIEndpoint(BaseAPIView):
    """List and create blocks."""

    def get(self, request):
        blocks = BlockMessenger.objects.filter(blocker=request.user)
        serializer = BlockMessengerSerializer(blocks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        blocked_user_id = request.data.get("blocked_user_id")
        reason = request.data.get("reason", "")

        if str(blocked_user_id) == str(request.user.id):
            return Response(
                {"error": "You cannot block yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        block, _ = BlockMessenger.objects.get_or_create(
            blocker=request.user,
            blocked_user_id=blocked_user_id,
            defaults={"reason": reason},
        )
        serializer = BlockMessengerSerializer(block)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        blocked_user_id = request.data.get("blocked_user_id")
        BlockMessenger.objects.filter(
            blocker=request.user, blocked_user_id=blocked_user_id
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserRelationListCreateAPIEndpoint(BaseAPIView):
    """List and create user relations (friends, team, subordinate/manager, bot)."""

    def get(self, request):
        relations = UserRelationMessenger.objects.filter(
            owner_user=request.user, status="active"
        ).select_related("target_user")
        serializer = UserRelationMessengerSerializer(relations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        target_user_id = request.data.get("target_user_id")
        relation_type = request.data.get("relation_type", "friend")

        relation, _ = UserRelationMessenger.objects.get_or_create(
            owner_user=request.user,
            target_user_id=target_user_id,
            defaults={"relation_type": relation_type, "status": "active"},
        )
        # Create reverse relation for mutual types
        if relation_type in ["friend", "team"]:
            UserRelationMessenger.objects.get_or_create(
                owner_user_id=target_user_id,
                target_user=request.user,
                defaults={"relation_type": relation_type, "status": "active"},
            )

        serializer = UserRelationMessengerSerializer(relation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        target_user_id = request.data.get("target_user_id")
        UserRelationMessenger.objects.filter(
            owner_user=request.user, target_user_id=target_user_id
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MessengerContactsAPIEndpoint(BaseAPIView):
    """Get contacts for the new chat modal (project members across all workspaces)."""

    def get(self, request):
        # Workspaces where user is member
        workspace_ids = WorkspaceMember.objects.filter(
            member=request.user
        ).values_list("workspace_id", flat=True)

        # Get active project members in those workspaces
        user_ids = ProjectMember.objects.filter(
            project__workspace_id__in=workspace_ids,
            is_active=True,
        ).values_list("member_id", flat=True).distinct()

        users = User.objects.filter(
            id__in=user_ids, is_active=True
        ).exclude(id=request.user.id)

        result = []
        for user in users:
            relation = UserRelationMessenger.objects.filter(
                owner_user=request.user, target_user=user
            ).first()
            group = "Команда"
            if relation:
                type_map = {
                    "friend": "Друзья",
                    "team": "Команда",
                    "subordinate": "Подчиненные",
                    "manager": "Менеджеры",
                    "bot": "Боты",
                }
                group = type_map.get(relation.relation_type, "Команда")

            result.append({
                "id": str(user.id),
                "name": user.display_name or f"{user.first_name} {user.last_name}".strip() or user.email,
                "role": f"{group} · {user.email}",
                "group": group,
                "avatar": (user.display_name or user.first_name or "U")[:2].upper(),
                "color": "blue",
                "online": user.messenger_is_active,
                "type": "person",
                "email": user.email,
            })

        return Response(result, status=status.HTTP_200_OK)


class MessageForwardAPIEndpoint(BaseAPIView):
    """Forward messages to another chat."""

    def post(self, request):
        source_chat_id = request.data.get("source_chat_id")
        target_chat_id = request.data.get("target_chat_id")
        message_ids = request.data.get("message_ids", [])

        target_chat = ChatMessenger.objects.get(pk=target_chat_id)

        if not ChatMemberMessenger.objects.filter(
            chat=target_chat, user=request.user, is_active=True
        ).exists():
            return Response(
                {"error": "You are not a member of the target chat"},
                status=status.HTTP_403_FORBIDDEN,
            )

        forwarded_messages = []
        with transaction.atomic():
            for msg_id in message_ids:
                source_msg = MessageMessenger.objects.get(pk=msg_id)
                new_msg = MessageMessenger.objects.create(
                    chat=target_chat,
                    sender=request.user,
                    type=source_msg.type,
                    text=source_msg.text,
                    forwarded_from_message=source_msg,
                    forwarded_from_user=source_msg.sender,
                    status="sent",
                    created_by=request.user,
                    updated_by=request.user,
                )
                forwarded_messages.append(new_msg)

                # Create receipts for target chat members
                for member in ChatMemberMessenger.objects.filter(
                    chat=target_chat, is_active=True
                ).exclude(user=request.user):
                    MessageReceiptMessenger.objects.create(
                        message=new_msg,
                        user=member.user,
                    )

            target_chat.save()

        serializer = MessageMessengerSerializer(forwarded_messages, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChatInviteLinkAPIEndpoint(BaseAPIView):
    """Create and use invite links for chats."""

    def get(self, request, chat_id):
        """List active invite links for a chat."""
        chat = ChatMessenger.objects.get(pk=chat_id)
        if not ChatMemberMessenger.objects.filter(
            chat=chat, user=request.user, is_active=True
        ).exists():
            return Response(
                {"error": "You are not a member of this chat"},
                status=status.HTTP_403_FORBIDDEN,
            )

        links = InviteLinkMessenger.objects.filter(
            chat=chat,
            revoked_at__isnull=True,
        ).exclude(
            expires_at__lt=timezone.now()
        )
        serializer = InviteLinkMessengerSerializer(links, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, chat_id):
        """Create a new invite link for a chat."""
        chat = ChatMessenger.objects.get(pk=chat_id)
        # Check permissions
        membership = ChatMemberMessenger.objects.filter(
            chat=chat, user=request.user, is_active=True
        ).first()
        if not membership or membership.role not in ["owner", "admin"]:
            return Response(
                {"error": "Only owner or admin can create invite links"},
                status=status.HTTP_403_FORBIDDEN,
            )

        token = hashlib.sha256(f"{chat_id}:{uuid.uuid4()}:{timezone.now()}".encode()).hexdigest()
        link = InviteLinkMessenger.objects.create(
            chat=chat,
            organization=chat.organization,
            type="chat_invite",
            token_hash=token,
            title=request.data.get("title", "Invite link"),
            max_uses=request.data.get("max_uses"),
            expires_at=request.data.get("expires_at"),
            created_by=request.user,
            updated_by=request.user,
        )
        serializer = InviteLinkMessengerSerializer(link)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChatInviteJoinAPIEndpoint(BaseAPIView):
    """Join a chat via invite token."""

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)

        link = InviteLinkMessenger.objects.filter(
            token_hash=token,
            revoked_at__isnull=True,
        ).first()
        if not link:
            return Response({"error": "Invalid or revoked invite link"}, status=status.HTTP_404_NOT_FOUND)

        if link.expires_at and link.expires_at < timezone.now():
            InviteLinkUseMessenger.objects.create(
                invite_link=link,
                used_by=request.user,
                result="expired",
            )
            return Response({"error": "Invite link expired"}, status=status.HTTP_400_BAD_REQUEST)

        if link.max_uses and link.used_count >= link.max_uses:
            InviteLinkUseMessenger.objects.create(
                invite_link=link,
                used_by=request.user,
                result="limit_exceeded",
            )
            return Response({"error": "Invite link usage limit exceeded"}, status=status.HTTP_400_BAD_REQUEST)

        chat = link.chat
        # Check if already member
        if ChatMemberMessenger.objects.filter(chat=chat, user=request.user, is_active=True).exists():
            InviteLinkUseMessenger.objects.create(
                invite_link=link,
                used_by=request.user,
                result="already_member",
            )
            return Response({"error": "You are already a member"}, status=status.HTTP_400_BAD_REQUEST)

        # Check block
        for member in ChatMemberMessenger.objects.filter(chat=chat, is_active=True):
            if BlockMessenger.objects.filter(blocker=member.user, blocked_user=request.user).exists():
                InviteLinkUseMessenger.objects.create(
                    invite_link=link,
                    used_by=request.user,
                    result="blocked",
                )
                return Response({"error": "You are blocked in this chat"}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            ChatMemberMessenger.objects.get_or_create(
                chat=chat,
                user=request.user,
                defaults={"role": "member"},
            )
            link.used_count += 1
            link.save()
            InviteLinkUseMessenger.objects.create(
                invite_link=link,
                used_by=request.user,
                result="accepted",
            )

        serializer = ChatMessengerSerializer(chat, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChatJoinByLinkAPIEndpoint(BaseAPIView):
    """Join or navigate to a chat via internal messenger link (messenger:<chat_id>)."""

    def post(self, request):
        link = request.data.get("link", "")
        import re
        match = re.match(r"^messenger:([a-f0-9\-]+)$", link.strip(), re.IGNORECASE)
        if not match:
            return Response(
                {"error": "Invalid link format. Expected messenger:<chat_id>"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        chat_id = match.group(1)
        try:
            chat = ChatMessenger.objects.get(pk=chat_id)
        except ChatMessenger.DoesNotExist:
            return Response(
                {"error": "Chat not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if already a member
        if ChatMemberMessenger.objects.filter(
            chat=chat, user=request.user, is_active=True
        ).exists():
            serializer = ChatMessengerSerializer(chat, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # For direct chats, you can't join unless added by the other party
        if chat.type == "direct":
            return Response(
                {"error": "Cannot join a direct chat via link"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check block for group chats
        for member in ChatMemberMessenger.objects.filter(chat=chat, is_active=True):
            if BlockMessenger.objects.filter(blocker=member.user, blocked_user=request.user).exists():
                return Response(
                    {"error": "You are blocked in this chat"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        with transaction.atomic():
            ChatMemberMessenger.objects.get_or_create(
                chat=chat,
                user=request.user,
                defaults={"role": "member"},
            )

        serializer = ChatMessengerSerializer(chat, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserOnlineStatusAPIEndpoint(BaseAPIView):
    """Update current user online status and get other users status."""

    def get(self, request):
        """Get online status for given user IDs."""
        user_ids = request.GET.get("ids", "").split(",")
        user_ids = [u.strip() for u in user_ids if u.strip()]
        users = User.objects.filter(id__in=user_ids)
        result = []
        for user in users:
            result.append({
                "id": str(user.id),
                "is_online": user.messenger_is_active,
                "last_seen_at": user.messenger_last_seen_at,
            })
        return Response(result, status=status.HTTP_200_OK)

    def post(self, request):
        """Update current user online status (heartbeat)."""
        user = request.user
        user.messenger_is_active = True
        user.messenger_last_seen_at = timezone.now()
        user.save(update_fields=["messenger_is_active", "messenger_last_seen_at"])
        return Response({"status": "online"}, status=status.HTTP_200_OK)

    def delete(self, request):
        """Mark current user as offline."""
        user = request.user
        user.messenger_is_active = False
        user.messenger_last_seen_at = timezone.now()
        user.save(update_fields=["messenger_is_active", "messenger_last_seen_at"])
        return Response({"status": "offline"}, status=status.HTTP_200_OK)


class MessengerFileDownloadAPIEndpoint(BaseAPIView):
    """Download a messenger file attachment."""

    def get(self, request, file_path):
        attachment = MessageAttachmentMessenger.objects.filter(
            storage_key=file_path
        ).select_related("message", "message__chat").first()
        if not attachment:
            return Response(
                {"error": "File not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        chat = attachment.message.chat
        if not ChatMemberMessenger.objects.filter(
            chat=chat, user=request.user, is_active=True
        ).exists():
            return Response(
                {"error": "You are not a member of this chat"},
                status=status.HTTP_403_FORBIDDEN,
            )

        absolute_path = os.path.join(settings.MEDIA_ROOT, file_path)
        if not os.path.exists(absolute_path):
            return Response(
                {"error": "File not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        content_type = attachment.mime_type or "application/octet-stream"
        response = FileResponse(
            open(absolute_path, "rb"),
            content_type=content_type,
        )
        response.headers["Content-Disposition"] = (
            f'inline; filename="{attachment.original_name}"'
        )
        return response
