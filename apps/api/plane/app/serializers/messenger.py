# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

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
    InviteLinkMessenger,
    InviteLinkUseMessenger,
    AuditLogMessenger,
)

from .base import BaseSerializer
from .user import UserLiteSerializer


class UserRelationMessengerSerializer(BaseSerializer):
    class Meta:
        model = UserRelationMessenger
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class ChatMemberMessengerSerializer(BaseSerializer):
    user_detail = UserLiteSerializer(source="user", read_only=True)

    class Meta:
        model = ChatMemberMessenger
        fields = [
            "id",
            "chat",
            "user",
            "user_detail",
            "role",
            "joined_at",
            "left_at",
            "is_active",
        ]
        read_only_fields = ["id", "joined_at"]


class ChatMessengerSerializer(BaseSerializer):
    members = ChatMemberMessengerSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    display_avatar = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessenger
        fields = [
            "id",
            "organization",
            "project",
            "type",
            "title",
            "avatar_url",
            "avatar_initials",
            "avatar_color",
            "members",
            "last_message",
            "unread_count",
            "display_name",
            "display_avatar",
            "other_user",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by", "updated_by"]

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by("-created_at").first()
        if last_msg:
            return {
                "id": str(last_msg.id),
                "text": last_msg.text,
                "created_at": last_msg.created_at,
                "sender": UserLiteSerializer(last_msg.sender).data,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            state = obj.user_states.filter(user=request.user).first()
            if state:
                return state.unread_count_cache
        return 0

    def get_display_name(self, obj):
        if obj.type == "direct":
            request = self.context.get("request")
            if request and request.user.is_authenticated:
                other = obj.members.exclude(user=request.user).select_related("user").first()
                if other:
                    u = other.user
                    return u.display_name or f"{u.first_name} {u.last_name}".strip() or u.email
        if obj.title:
            return obj.title
        return "Чат"

    def get_display_avatar(self, obj):
        if obj.type == "direct":
            request = self.context.get("request")
            if request and request.user.is_authenticated:
                other = obj.members.exclude(user=request.user).select_related("user").first()
                if other:
                    u = other.user
                    initials = (u.display_name or u.first_name or "U")[:2].upper()
                    return {"initials": initials, "color": "blue", "url": u.avatar if hasattr(u, "avatar") else None}
        return {"initials": (obj.title or "CH")[:2].upper(), "color": obj.avatar_color or "blue", "url": obj.avatar_url}

    def get_other_user(self, obj):
        if obj.type == "direct":
            request = self.context.get("request")
            if request and request.user.is_authenticated:
                other = obj.members.exclude(user=request.user).select_related("user").first()
                if other:
                    return UserLiteSerializer(other.user).data
        return None


class ChatMessengerLiteSerializer(BaseSerializer):
    class Meta:
        model = ChatMessenger
        fields = [
            "id",
            "organization",
            "type",
            "title",
            "avatar_url",
            "avatar_initials",
            "avatar_color",
        ]


class UserChatStateMessengerSerializer(BaseSerializer):
    chat_detail = ChatMessengerLiteSerializer(source="chat", read_only=True)
    last_read_message_detail = serializers.SerializerMethodField()

    class Meta:
        model = UserChatStateMessenger
        fields = [
            "id",
            "user",
            "chat",
            "chat_detail",
            "pinned_at",
            "archived_at",
            "muted_until",
            "blocked_at",
            "last_read_message",
            "last_read_message_detail",
            "last_read_at",
            "unread_count_cache",
            "draft_text",
            "draft_reply_to_message",
            "draft_updated_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_last_read_message_detail(self, obj):
        if obj.last_read_message:
            return {
                "id": str(obj.last_read_message.id),
                "text": obj.last_read_message.text,
            }
        return None


class MessageAttachmentMessengerSerializer(BaseSerializer):
    class Meta:
        model = MessageAttachmentMessenger
        fields = [
            "id",
            "message",
            "uploader",
            "original_name",
            "mime_type",
            "size_bytes",
            "storage_provider",
            "storage_key",
            "public_url",
            "width",
            "height",
            "duration_seconds",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class MessageReactionMessengerSerializer(BaseSerializer):
    user_detail = UserLiteSerializer(source="user", read_only=True)

    class Meta:
        model = MessageReactionMessenger
        fields = ["id", "message", "user", "user_detail", "emoji", "created_at"]
        read_only_fields = ["id", "created_at"]


class MessageReceiptMessengerSerializer(BaseSerializer):
    class Meta:
        model = MessageReceiptMessenger
        fields = [
            "id",
            "message",
            "user",
            "delivered_at",
            "read_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class MessageMessengerSerializer(BaseSerializer):
    sender_detail = UserLiteSerializer(source="sender", read_only=True)
    attachments = MessageAttachmentMessengerSerializer(many=True, read_only=True)
    reactions = MessageReactionMessengerSerializer(many=True, read_only=True)
    reply_to_detail = serializers.SerializerMethodField()
    forwarded_from_detail = serializers.SerializerMethodField()
    read_by = serializers.SerializerMethodField()

    class Meta:
        model = MessageMessenger
        fields = [
            "id",
            "chat",
            "sender",
            "sender_detail",
            "type",
            "text",
            "reply_to_message",
            "reply_to_detail",
            "forwarded_from_message",
            "forwarded_from_detail",
            "forwarded_from_user",
            "status",
            "is_pinned",
            "edited_at",
            "attachments",
            "reactions",
            "read_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "sender_detail",
            "attachments",
            "reactions",
        ]

    def get_reply_to_detail(self, obj):
        if obj.reply_to_message:
            return {
                "id": str(obj.reply_to_message.id),
                "text": obj.reply_to_message.text,
                "sender": UserLiteSerializer(obj.reply_to_message.sender).data,
            }
        return None

    def get_forwarded_from_detail(self, obj):
        if obj.forwarded_from_message:
            return {
                "id": str(obj.forwarded_from_message.id),
                "text": obj.forwarded_from_message.text,
                "sender": UserLiteSerializer(obj.forwarded_from_message.sender).data,
            }
        return None

    def get_read_by(self, obj):
        receipts = obj.receipts.filter(read_at__isnull=False)
        return [UserLiteSerializer(r.user).data for r in receipts]


class MessageMessengerLiteSerializer(BaseSerializer):
    class Meta:
        model = MessageMessenger
        fields = [
            "id",
            "chat",
            "sender",
            "type",
            "text",
            "status",
            "is_pinned",
            "created_at",
        ]


class PinnedMessageMessengerSerializer(BaseSerializer):
    message_detail = MessageMessengerLiteSerializer(source="message", read_only=True)
    pinned_by_detail = UserLiteSerializer(source="pinned_by", read_only=True)

    class Meta:
        model = PinnedMessageMessenger
        fields = [
            "id",
            "chat",
            "message",
            "message_detail",
            "pinned_by",
            "pinned_by_detail",
            "pinned_at",
        ]
        read_only_fields = ["id", "pinned_at"]


class MessageDeletionMessengerSerializer(BaseSerializer):
    class Meta:
        model = MessageDeletionMessenger
        fields = ["id", "message", "user", "scope", "deleted_at"]
        read_only_fields = ["id", "deleted_at"]


class ChatDeletionMessengerSerializer(BaseSerializer):
    class Meta:
        model = ChatDeletionMessenger
        fields = ["id", "chat", "user", "deleted_at"]
        read_only_fields = ["id", "deleted_at"]


class BlockMessengerSerializer(BaseSerializer):
    blocker_detail = UserLiteSerializer(source="blocker", read_only=True)
    blocked_user_detail = UserLiteSerializer(source="blocked_user", read_only=True)

    class Meta:
        model = BlockMessenger
        fields = [
            "id",
            "blocker",
            "blocker_detail",
            "blocked_user",
            "blocked_user_detail",
            "reason",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class InviteLinkMessengerSerializer(BaseSerializer):
    class Meta:
        model = InviteLinkMessenger
        fields = [
            "id",
            "organization",
            "chat",
            "type",
            "token_hash",
            "title",
            "max_uses",
            "used_count",
            "expires_at",
            "revoked_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "used_count"]


class InviteLinkUseMessengerSerializer(BaseSerializer):
    class Meta:
        model = InviteLinkUseMessenger
        fields = [
            "id",
            "invite_link",
            "used_by",
            "ip",
            "user_agent",
            "result",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AuditLogMessengerSerializer(BaseSerializer):
    actor_user_detail = UserLiteSerializer(source="actor_user", read_only=True)

    class Meta:
        model = AuditLogMessenger
        fields = [
            "id",
            "organization",
            "actor_user",
            "actor_user_detail",
            "action",
            "entity_type",
            "entity_id",
            "metadata",
            "ip",
            "user_agent",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
