# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Wire values of the planning copilot protocol.

Keep in sync with packages/types/src/ai-copilot and packages/constants/src/ai-copilot.ts.
"""

# Django imports
from django.db import models


class CopilotEntityType(models.TextChoices):
    PAGE = "page", "Page"
    ISSUE = "issue", "Work item"


class CopilotMessageRole(models.TextChoices):
    USER = "user", "User"
    ASSISTANT = "assistant", "Assistant"


class CopilotEventName(models.TextChoices):
    MESSAGE_DELTA = "message_delta", "Message delta"
    TOOL_CALL_START = "tool_call_start", "Tool call start"
    TOOL_CALL_UPDATE = "tool_call_update", "Tool call update"
    TOOL_CALL_END = "tool_call_end", "Tool call end"


class CopilotToolName(models.TextChoices):
    ASK_USER = "ask_user", "Ask user"
    SEARCH_TICKETS = "search_tickets", "Search tickets"
    PROPOSE_EDIT = "propose_edit", "Propose edit"
    DRAFT_TICKETS = "draft_tickets", "Draft tickets"
    REMEMBER = "remember", "Remember"
    WEB_SEARCH = "web_search", "Web search"


class CopilotToolStatus(models.TextChoices):
    RUNNING = "running", "Running"
    DONE = "done", "Done"
    FAILED = "failed", "Failed"


class CopilotToolErrorCode(models.TextChoices):
    CANCELLED = "cancelled", "Cancelled"
    STALE_PROPOSAL = "stale_proposal", "Stale proposal"
    VALIDATION_ERROR = "validation_error", "Validation error"
    UPSTREAM_ERROR = "upstream_error", "Upstream error"
    INTERNAL_ERROR = "internal_error", "Internal error"


class CopilotHunkDecision(models.TextChoices):
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"


class CopilotAskUserQuestionType(models.TextChoices):
    SHORT_TEXT = "short_text", "Short text"
    LONG_TEXT = "long_text", "Long text"
    DROPDOWN = "dropdown", "Dropdown"
    MULTI_SELECT = "multi_select", "Multi select"
    YES_NO = "yes_no", "Yes or no"
    NUMBER = "number", "Number"
    DATE = "date", "Date"
    TICKET_PICKER = "ticket_picker", "Ticket picker"
    FILE_PICKER = "file_picker", "File picker"


# Tools that wait for a user response.
INTERACTIVE_TOOL_NAMES = (
    CopilotToolName.ASK_USER,
    CopilotToolName.PROPOSE_EDIT,
    CopilotToolName.DRAFT_TICKETS,
)

# A tool call in one of these statuses will not change again unless it is retried.
TERMINAL_TOOL_STATUSES = (
    CopilotToolStatus.DONE,
    CopilotToolStatus.FAILED,
)
