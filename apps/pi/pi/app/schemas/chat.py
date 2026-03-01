# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import uuid
from enum import Enum
from typing import Any
from typing import Dict
from typing import List
from typing import Literal
from typing import Optional

from pydantic import UUID4
from pydantic import BaseModel
from pydantic import Field

# import default llm from settings in config.py
from pi import settings

DEFAULT_LLM = settings.llm_model.DEFAULT


class ArtifactData(BaseModel):
    """Single artifact in a batch execution."""

    artifact_id: UUID4
    is_edited: bool = Field(default=False, description="True if artifact was edited/modified, False for normal execution")
    action_data: Optional[Dict[str, Any]] = Field(default=None, description="New artifact data (required only when is_edited=True)")


# Pagination base classes (defined here to avoid circular imports)
class PaginationRequest(BaseModel):
    """Request schema for cursor-based pagination."""

    cursor: Optional[str] = Field(None, description="String cursor for pagination")
    per_page: int = Field(30, ge=1, le=100, description="Number of items per page")


class PaginationResponse(BaseModel):
    """Response schema for cursor-based pagination."""

    next_cursor: Optional[str] = Field(None, description="Cursor for next page")
    prev_cursor: Optional[str] = Field(None, description="Cursor for previous page")
    next_page_results: bool = Field(False, description="Whether there are more results in next page")
    prev_page_results: bool = Field(False, description="Whether there are more results in previous page")
    count: int = Field(description="Number of items in current page")
    total_pages: Optional[int] = Field(None, description="Total number of pages (if calculable)")
    total_results: Optional[int] = Field(None, description="Total number of results (if calculable)")


class ChatRequest(BaseModel):
    query: str
    llm: str = DEFAULT_LLM
    is_new: bool
    user_id: Optional[UUID4] = None
    chat_id: Optional[UUID4] = None
    is_temp: bool
    workspace_in_context: bool
    is_websearch_enabled: bool = Field(default=False, description="Enable web search for this request")
    # is_reasoning: bool = False
    # New polymorphic focus context fields
    focus_entity_type: Optional[str] = Field(default=None, description="Type of focus entity (workspace, project, cycle, module, etc.)")
    focus_entity_id: Optional[UUID4] = Field(default=None, description="ID of the focus entity")
    # Legacy fields (for backward compatibility)
    workspace_id: UUID4 | None = ""  # type: ignore
    project_id: UUID4 | None = ""  # type: ignore
    context: dict[str, Any]
    mode: Literal["ask", "build"] = "ask"  # ask: normal chat, build: planning mode
    is_project_chat: Optional[bool] = False
    pi_sidebar_open: Optional[bool] = False
    workspace_slug: Optional[str] = None
    attachment_ids: Optional[List[uuid.UUID]] = Field(default=[], description="List of attachment IDs to link to this message")
    sidebar_open_url: Optional[str] = Field(default="", description="The URL where the sidebar was opened from")
    source: Optional[str] = Field(default="", description="The source of the chat request")


class ChatInitializationRequest(BaseModel):
    """Schema for chat initialization - only includes required fields."""

    user_id: Optional[UUID4] = None
    chat_id: Optional[UUID4] = None
    workspace_in_context: bool = False
    # New polymorphic focus context fields
    focus_entity_type: Optional[str] = Field(default=None, description="Type of focus entity (workspace, project, cycle, module, etc.)")
    focus_entity_id: Optional[UUID4] = Field(default=None, description="ID of the focus entity")
    # Legacy fields (for backward compatibility)
    workspace_id: UUID4 | None = None
    project_id: UUID4 | None = None
    is_project_chat: Optional[bool] = False
    workspace_slug: Optional[str] = None


class TitleRequest(BaseModel):
    chat_id: UUID4
    workspace_id: Optional[UUID4] = None
    workspace_slug: Optional[str] = None


class DeleteChatRequest(BaseModel):
    chat_id: UUID4
    workspace_id: Optional[UUID4] = None
    workspace_slug: Optional[str] = None


class GetThreads(BaseModel):
    user_id: Optional[UUID4] = None
    workspace_id: Optional[UUID4] = None
    workspace_slug: Optional[str] = None
    is_project_chat: Optional[bool] = False


class ChatType(Enum):
    THREADS = "threads"
    ISSUES = "issues"
    PROJECTS = "projects"
    PAGES = "pages"
    MODULES = "modules"
    CYCLES = "cycles"
    INITIATIVES = "initiatives"
    WORKSPACES = "workspaces"


class ChatSuggestion(BaseModel):
    text: str | None = None
    type: ChatType
    mode: Literal["ask", "build"] = "ask"
    id: list[UUID4]


class ChatSuggestionTemplate(BaseModel):
    templates: list[ChatSuggestion]


class ChatStartResponse(BaseModel):
    placeholder: str


class FeedbackType(Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"


class ChatFeedback(BaseModel):
    chat_id: UUID4
    message_index: int
    feedback: FeedbackType
    feedback_message: Optional[str] = None
    workspace_id: Optional[UUID4] = None
    workspace_slug: Optional[str] = None


class AIFeatureFeedback(BaseModel):
    """Feedback schema for AI-powered features (ai_block, floaty_ai, ask_ai, etc.)"""

    usage_id: Optional[UUID4] = Field(None, description="ID of the AI feature instance (e.g., ai_block_id)")
    entity_type: Optional[str] = Field(None, description="Type of entity where feature is used: 'page', 'wiki', etc.")
    entity_id: Optional[UUID4] = Field(None, description="ID of the entity (e.g., page_id)")
    feedback: FeedbackType = Field(..., description="positive or negative feedback")
    feedback_message: Optional[str] = Field(None, description="Optional detailed feedback message")
    workspace_id: UUID4 = Field(..., description="Workspace ID")


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    type: str = "language_model"
    is_default: bool


class ModelsResponse(BaseModel):
    models: list[ModelInfo]


class FavoriteChatRequest(BaseModel):
    chat_id: UUID4
    workspace_id: Optional[UUID4] = None
    workspace_slug: Optional[str] = None


class UnfavoriteChatRequest(BaseModel):
    chat_id: UUID4
    workspace_id: Optional[UUID4] = None
    workspace_slug: Optional[str] = None


class RenameChatRequest(BaseModel):
    chat_id: UUID4
    title: str
    workspace_id: Optional[UUID4] = None
    workspace_slug: Optional[str] = None


class ActionExecutionRequest(BaseModel):
    """Request schema for executing planned actions."""

    workspace_id: UUID4
    chat_id: UUID4
    message_id: UUID4
    action_data: Dict[str, Any]


class ActionBatchExecutionRequest(BaseModel):
    """Request schema for executing all planned actions in a message as a batch."""

    workspace_id: UUID4
    chat_id: UUID4
    message_id: UUID4
    execution_strategy: Optional[str] = "sequential"  # sequential, parallel (future)
    rollback_on_failure: Optional[bool] = False

    access_token: Optional[str] = None

    # Artifact execution - unified approach
    artifact_data: Optional[List[ArtifactData]] = Field(default=None, description="List of artifacts to execute (each declares its own edit status)")


# Search schemas
class ChatSearchRequest(BaseModel):
    """Request schema for chat search."""

    query: str = Field(..., description="Search query text")
    workspace_id: UUID4 = Field(..., description="Workspace ID to filter by")
    is_project_chat: Optional[bool] = Field(False, description="Filter by project chat flag")
    cursor: Optional[str] = Field(None, description="Cursor for pagination")
    per_page: int = Field(30, ge=1, le=100, description="Number of results per page")


class ChatSearchPagination(BaseModel):
    """Clean pagination response for chat search."""

    next_cursor: Optional[str] = Field(None, description="Cursor for next page - null if no more pages")
    count: int = Field(description="Number of items in current page")


class ChatSearchResult(BaseModel):
    """Individual chat search result."""

    id: UUID4 = Field(..., description="Chat ID")
    title: Optional[str] = Field(None, description="Chat title")
    snippet: str = Field(..., description="Text snippet with highlighted query terms")
    match_type: str = Field(..., description="Type of match: 'title' or 'message'")
    message_id: Optional[UUID4] = Field(None, description="Message ID if match is from message content")
    created_at: Optional[str] = Field(None, description="Creation timestamp")
    updated_at: Optional[str] = Field(None, description="Last update timestamp")
    workspace_id: Optional[UUID4] = Field(None, description="Workspace ID")


class ChatSearchResponse(ChatSearchPagination):
    """Clean paginated response for chat search."""

    results: List[ChatSearchResult] = Field(default_factory=list, description="Search results")


# Paginated response schemas
class GetThreadsPaginatedResponse(PaginationResponse):
    """Paginated response for user chat threads."""

    results: list[dict[str, Any]]


class ChatInitRequest(BaseModel):
    """Request to initialize chat - checks OAuth and gets templates"""

    workspace_id: UUID4 = Field(description="Workspace ID to check")


class ChatInitResponse(BaseModel):
    """Response with OAuth status and chat templates for initialization"""

    is_authorized: bool = Field(description="Whether user has valid authorization for workspace")
    templates: List[Any] = Field(default_factory=list, description="Chat suggestion templates")
    oauth_url: Optional[str] = Field(None, description="OAuth authorization URL if not authorized")


class ChatAuthCheckResponse(BaseModel):
    """Response for auth check - OAuth status only, no templates"""

    is_authorized: bool = Field(description="Whether user has valid authorization for workspace")
    oauth_url: Optional[str] = Field(None, description="OAuth authorization URL if not authorized")


class PresetQuestionsRequest(BaseModel):
    """Request schema for getting contextual preset questions"""

    workspace_id: UUID4 = Field(description="Workspace ID")
    mode: Literal["ask", "build"] = Field(description="Chat mode: ask or build")
    entity_type: Optional[str] = Field(None, description="Type of focus entity (workspace, project, cycle, module, etc.)")
    entity_id: Optional[UUID4] = Field(None, description="ID of the focus entity")
    project_id: Optional[UUID4] = Field(None, description="Project ID if applicable")


class PresetQuestionsResponse(BaseModel):
    """Response with contextual preset questions/templates"""

    templates: List[Any] = Field(default_factory=list, description="Contextual chat suggestion templates")
