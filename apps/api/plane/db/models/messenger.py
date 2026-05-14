# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

from django.db import models

from .base import BaseModel


class UserRelationMessenger(BaseModel):
    class RelationType(models.TextChoices):
        FRIEND = "friend", "Friend"
        TEAM = "team", "Team"
        SUBORDINATE = "subordinate", "Subordinate"
        MANAGER = "manager", "Manager"
        BOT = "bot", "Bot"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        HIDDEN = "hidden", "Hidden"
        BLOCKED = "blocked", "Blocked"

    owner_user = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="messenger_relations_owned")
    target_user = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="messenger_relations_targeted")
    relation_type = models.CharField(max_length=20, choices=RelationType.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        verbose_name = "User Relation Messenger"
        verbose_name_plural = "User Relations Messenger"
        db_table = "user_relations_messenger"
        ordering = ("-created_at",)
        unique_together = [("owner_user", "target_user")]

    def __str__(self):
        return f"{self.owner_user} -> {self.target_user} ({self.relation_type})"


class ChatMessenger(BaseModel):
    class ChatType(models.TextChoices):
        DIRECT = "direct", "Direct"
        GROUP = "group", "Group"
        BOT = "bot", "Bot"

    organization = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="messenger_chats",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="messenger_chats",
    )
    type = models.CharField(max_length=10, choices=ChatType.choices)
    title = models.CharField(max_length=255, null=True, blank=True)
    avatar_url = models.TextField(null=True, blank=True)
    avatar_initials = models.CharField(max_length=8, null=True, blank=True)
    avatar_color = models.CharField(max_length=32, null=True, blank=True)

    class Meta:
        verbose_name = "Chat Messenger"
        verbose_name_plural = "Chats Messenger"
        db_table = "chats_messenger"
        ordering = ("-updated_at",)

    def __str__(self):
        return self.title or f"Chat {self.id}"


class ChatMemberMessenger(models.Model):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"
        BOT = "bot", "Bot"

    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    chat = models.ForeignKey("db.ChatMessenger", on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="messenger_chat_memberships")
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Chat Member Messenger"
        verbose_name_plural = "Chat Members Messenger"
        db_table = "chat_members_messenger"
        unique_together = [("chat", "user")]

    def __str__(self):
        return f"{self.user} in {self.chat}"


class UserChatStateMessenger(BaseModel):
    user = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="messenger_chat_states")
    chat = models.ForeignKey("db.ChatMessenger", on_delete=models.CASCADE, related_name="user_states")

    pinned_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    muted_until = models.DateTimeField(null=True, blank=True)
    blocked_at = models.DateTimeField(null=True, blank=True)

    last_read_message = models.ForeignKey(
        "db.MessageMessenger",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    last_read_at = models.DateTimeField(null=True, blank=True)
    unread_count_cache = models.PositiveIntegerField(default=0)

    draft_text = models.TextField(null=True, blank=True)
    draft_reply_to_message = models.ForeignKey(
        "db.MessageMessenger",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    draft_updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "User Chat State Messenger"
        verbose_name_plural = "User Chat States Messenger"
        db_table = "user_chat_states_messenger"
        unique_together = [("user", "chat")]

    def __str__(self):
        return f"State: {self.user} in {self.chat}"


class MessageMessenger(BaseModel):
    class MessageType(models.TextChoices):
        TEXT = "text", "Text"
        FILE = "file", "File"
        MEDIA = "media", "Media"
        SYSTEM = "system", "System"

    class Status(models.TextChoices):
        CREATED = "created", "Created"
        SENT = "sent", "Sent"
        DELIVERED = "delivered", "Delivered"
        READ = "read", "Read"
        FAILED = "failed", "Failed"

    chat = models.ForeignKey("db.ChatMessenger", on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="messenger_messages")

    type = models.CharField(max_length=10, choices=MessageType.choices, default=MessageType.TEXT)
    text = models.TextField(null=True, blank=True)

    reply_to_message = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="replies",
    )
    forwarded_from_message = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="forwarded_to",
    )
    forwarded_from_user = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="messenger_forwarded_messages",
    )

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.CREATED)
    is_pinned = models.BooleanField(default=False)

    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Message Messenger"
        verbose_name_plural = "Messages Messenger"
        db_table = "messages_messenger"
        ordering = ("created_at",)

    def __str__(self):
        return f"Message {self.id} in {self.chat}"


class MessageReceiptMessenger(models.Model):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    message = models.ForeignKey("db.MessageMessenger", on_delete=models.CASCADE, related_name="receipts")
    user = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="messenger_message_receipts")

    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Message Receipt Messenger"
        verbose_name_plural = "Message Receipts Messenger"
        db_table = "message_receipts_messenger"
        unique_together = [("message", "user")]

    def __str__(self):
        return f"Receipt: {self.user} for {self.message}"


class MessageAttachmentMessenger(models.Model):
    class StorageProvider(models.TextChoices):
        LOCAL = "local", "Local"
        S3 = "s3", "S3"
        MINIO = "minio", "Minio"

    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    message = models.ForeignKey("db.MessageMessenger", on_delete=models.CASCADE, related_name="attachments")
    uploader = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="messenger_attachments")

    original_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=255)
    size_bytes = models.BigIntegerField()

    storage_provider = models.CharField(max_length=10, choices=StorageProvider.choices, default=StorageProvider.LOCAL)
    storage_key = models.TextField()
    public_url = models.TextField(null=True, blank=True)

    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Message Attachment Messenger"
        verbose_name_plural = "Message Attachments Messenger"
        db_table = "message_attachments_messenger"

    def __str__(self):
        return f"Attachment {self.original_name} on {self.message}"


class MessageReactionMessenger(models.Model):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    message = models.ForeignKey("db.MessageMessenger", on_delete=models.CASCADE, related_name="reactions")
    user = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="messenger_reactions")
    emoji = models.CharField(max_length=16)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Message Reaction Messenger"
        verbose_name_plural = "Message Reactions Messenger"
        db_table = "message_reactions_messenger"
        unique_together = [("message", "user", "emoji")]

    def __str__(self):
        return f"{self.emoji} by {self.user} on {self.message}"


class PinnedMessageMessenger(models.Model):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    chat = models.ForeignKey("db.ChatMessenger", on_delete=models.CASCADE, related_name="pinned_messages")
    message = models.ForeignKey("db.MessageMessenger", on_delete=models.CASCADE, related_name="pins")
    pinned_by = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="messenger_pinned_messages")
    pinned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Pinned Message Messenger"
        verbose_name_plural = "Pinned Messages Messenger"
        db_table = "pinned_messages_messenger"
        unique_together = [("chat", "message")]

    def __str__(self):
        return f"Pin: {self.message} in {self.chat}"


class MessageDeletionMessenger(models.Model):
    class Scope(models.TextChoices):
        FOR_ME = "for_me", "For Me"
        FOR_EVERYONE = "for_everyone", "For Everyone"

    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    message = models.ForeignKey("db.MessageMessenger", on_delete=models.CASCADE, related_name="deletions")
    user = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="messenger_message_deletions")
    scope = models.CharField(max_length=20, choices=Scope.choices)
    deleted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Message Deletion Messenger"
        verbose_name_plural = "Message Deletions Messenger"
        db_table = "message_deletions_messenger"

    def __str__(self):
        return f"Deletion: {self.message} ({self.scope})"


class ChatDeletionMessenger(models.Model):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    chat = models.ForeignKey("db.ChatMessenger", on_delete=models.CASCADE, related_name="deletions")
    user = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="messenger_chat_deletions")
    deleted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Chat Deletion Messenger"
        verbose_name_plural = "Chat Deletions Messenger"
        db_table = "chat_deletions_messenger"

    def __str__(self):
        return f"Chat deletion: {self.chat} by {self.user}"


class BlockMessenger(models.Model):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    blocker = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="messenger_blocks_made")
    blocked_user = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="messenger_blocks_received")
    reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Block Messenger"
        verbose_name_plural = "Blocks Messenger"
        db_table = "blocks_messenger"
        unique_together = [("blocker", "blocked_user")]

    def __str__(self):
        return f"Block: {self.blocker} -> {self.blocked_user}"


class AuditLogMessenger(models.Model):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    organization = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="messenger_audit_logs")
    actor_user = models.ForeignKey("db.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="messenger_audit_actions")
    action = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=255)
    entity_id = models.UUIDField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Audit Log Messenger"
        verbose_name_plural = "Audit Logs Messenger"
        db_table = "audit_logs_messenger"
        ordering = ("-created_at",)

    def __str__(self):
        return f"Audit: {self.action} {self.entity_type} by {self.actor_user}"


class InviteLinkMessenger(BaseModel):
    class InviteType(models.TextChoices):
        USER_DIRECT_CHAT = "user_direct_chat", "User Direct Chat"
        CHAT_INVITE = "chat_invite", "Chat Invite"
        ORGANIZATION_INVITE = "organization_invite", "Organization Invite"

    organization = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="messenger_invite_links",
    )
    chat = models.ForeignKey(
        "db.ChatMessenger",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="invite_links",
    )

    type = models.CharField(max_length=30, choices=InviteType.choices)
    token_hash = models.CharField(max_length=255, unique=True)
    title = models.CharField(max_length=255, null=True, blank=True)

    max_uses = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0)

    expires_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Invite Link Messenger"
        verbose_name_plural = "Invite Links Messenger"
        db_table = "invite_links_messenger"

    def __str__(self):
        return f"Invite: {self.title or self.id}"


class InviteLinkUseMessenger(models.Model):
    class Result(models.TextChoices):
        ACCEPTED = "accepted", "Accepted"
        EXPIRED = "expired", "Expired"
        REVOKED = "revoked", "Revoked"
        LIMIT_EXCEEDED = "limit_exceeded", "Limit Exceeded"
        ALREADY_MEMBER = "already_member", "Already Member"
        BLOCKED = "blocked", "Blocked"

    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    invite_link = models.ForeignKey("db.InviteLinkMessenger", on_delete=models.CASCADE, related_name="uses")
    used_by = models.ForeignKey("db.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="messenger_invite_uses")

    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    result = models.CharField(max_length=20, choices=Result.choices)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Invite Link Use Messenger"
        verbose_name_plural = "Invite Link Uses Messenger"
        db_table = "invite_link_uses_messenger"

    def __str__(self):
        return f"Invite use: {self.result} by {self.used_by}"