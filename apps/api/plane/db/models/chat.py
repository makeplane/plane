# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from .workspace import WorkspaceBaseModel


class ChatChannel(WorkspaceBaseModel):
    """A named room members of a workspace (or one project) talk in."""

    DEFAULT_NAME = "general"

    name = models.CharField(max_length=80)
    description = models.TextField(blank=True, default="")
    # The channel created automatically for a workspace or project. It cannot
    # be deleted or renamed, so there is always somewhere to talk.
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Chat Channel"
        verbose_name_plural = "Chat Channels"
        db_table = "chat_channels"
        ordering = ("-is_default", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "project", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="chat_channel_unique_name_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"#{self.name}"


class ChatMessage(WorkspaceBaseModel):
    """One plain-text message in a channel. The author is created_by."""

    MAX_LENGTH = 4000

    channel = models.ForeignKey(ChatChannel, on_delete=models.CASCADE, related_name="messages")
    content = models.TextField()
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"
        db_table = "chat_messages"
        ordering = ("created_at",)
        indexes = [models.Index(fields=["channel", "created_at"], name="chat_message_channel_created")]

    def __str__(self):
        return f"{self.created_by_id}: {self.content[:40]}"
