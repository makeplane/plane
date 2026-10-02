# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from plane.utils.copilot_constants import (
    CopilotEntityType,
    CopilotMessageRole,
    CopilotToolName,
    CopilotToolStatus,
)

from .base import BaseModel
from .project import ProjectBaseModel


class CopilotSession(ProjectBaseModel):
    """Planning copilot conversation attached to one page or work item."""

    # The entity is referenced by id only, since it lives in different tables for pages and work items.
    entity_type = models.CharField(max_length=20, choices=CopilotEntityType.choices)
    entity_id = models.UUIDField()
    # Position of the scripted agent in its script.
    script_cursor = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Copilot Session"
        verbose_name_plural = "Copilot Sessions"
        db_table = "copilot_sessions"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["entity_type", "entity_id"],
                condition=models.Q(deleted_at__isnull=True),
                name="copilot_session_unique_entity_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.entity_type} {self.entity_id}"


class CopilotMessage(BaseModel):
    session = models.ForeignKey("db.CopilotSession", on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20, choices=CopilotMessageRole.choices)
    content = models.TextField(blank=True, default="")
    # Position of the message in the session transcript.
    sequence = models.PositiveIntegerField()

    class Meta:
        verbose_name = "Copilot Message"
        verbose_name_plural = "Copilot Messages"
        db_table = "copilot_messages"
        ordering = ("sequence",)
        constraints = [
            models.UniqueConstraint(
                fields=["session", "sequence"],
                condition=models.Q(deleted_at__isnull=True),
                name="copilot_message_unique_sequence_session_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.role} {self.sequence}"


class CopilotToolCall(BaseModel):
    """A tool call made by the agent in an assistant message, with its latest state."""

    message = models.ForeignKey("db.CopilotMessage", on_delete=models.CASCADE, related_name="tool_calls")
    name = models.CharField(max_length=50, choices=CopilotToolName.choices)
    args = models.JSONField(default=dict)
    result = models.JSONField(null=True, blank=True)
    error = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=CopilotToolStatus.choices, default=CopilotToolStatus.RUNNING)
    # Set when the content changed after a propose_edit was issued, which blocks accepting it.
    is_stale = models.BooleanField(default=False)
    # Set once the user has responded to an interactive tool.
    is_answered = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Copilot Tool Call"
        verbose_name_plural = "Copilot Tool Calls"
        db_table = "copilot_tool_calls"
        ordering = ("created_at",)

    def __str__(self):
        return f"{self.name} {self.status}"


class CopilotMemory(BaseModel):
    """A fact the agent committed to the long-term memory of a session."""

    session = models.ForeignKey("db.CopilotSession", on_delete=models.CASCADE, related_name="memories")
    content = models.TextField()

    class Meta:
        verbose_name = "Copilot Memory"
        verbose_name_plural = "Copilot Memories"
        db_table = "copilot_memories"
        ordering = ("created_at",)

    def __str__(self):
        return self.content[:50]
