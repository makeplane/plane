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

from typing import Any
from typing import Dict
from typing import Optional

from pydantic import UUID4
from pydantic import BaseModel
from pydantic import Field


class PageAIBlockConfigResponse(BaseModel):
    """Response schema for getting AI block configuration."""

    block_type: str = Field(description="Type of AI block (custom_prompt, summarize_page, etc.)")
    content: Optional[str] = Field(None, description="Custom prompt content (only for custom_prompt)")
    has_content: bool = Field(description="True if block has custom content, False otherwise")
    feedback: Optional[str] = Field(None, description="User's latest feedback: 'positive', 'negative', or None")


class PageAIBlockUpdateRequest(BaseModel):
    """Request schema for updating AI block configuration."""

    block_type: str = Field(description="Type of AI block (custom_prompt, summarize_page, etc.)")
    content: Optional[str] = Field(None, description="Custom prompt content (required for custom_prompt)")


class PageAIBlockCreateRequest(BaseModel):
    """Request schema for creating a new AI block (or re-using an existing block)."""

    block_id: Optional[UUID4] = Field(
        None,
        description="Optional AI block ID; if provided, the server can generate using this existing block",
    )
    block_type: str = Field(description="Type of AI block (custom_prompt, summarize_page, etc.)")
    entity_type: str = Field(description="Type of entity (page, wiki)")
    entity_id: UUID4 = Field(description="ID of the entity")
    workspace_id: UUID4 = Field(description="Workspace ID")
    content: Optional[str] = Field(None, description="Custom prompt content (required for custom_prompt)")
    project_id: Optional[UUID4] = Field(None, description="Optional project ID")


class PageAIBlockGenerateRequest(BaseModel):
    """Request schema for generating AI block content."""

    block_id: UUID4 = Field(description="ID of the AI block to generate content for")


class PageAIBlockGenerateResponse(BaseModel):
    """Response schema for generating AI block content."""

    success: bool = Field(description="Whether generation was successful")
    content: Optional[str] = Field(None, description="Generated content")
    message: str = Field(description="Success or error message")


class PageAIBlockType(BaseModel):
    """Schema for a single AI block type."""

    key: str = Field(description="Unique key for the block type")
    label: str = Field(description="Display label for the block type")
    description: str = Field(description="Description of what the block does")
    has_content: bool = Field(description="Whether this block type requires custom content")


class PageAIBlockTypesResponse(BaseModel):
    """Response schema for listing available AI block types."""

    types: list[PageAIBlockType] = Field(description="List of available block types")


class PageAIBlockRevisionCreateRequest(BaseModel):
    """Request schema for creating a new AI block revision."""

    block_id: UUID4 = Field(description="ID of the AI block to create a revision for")
    revision_type: str = Field(description="Type of revision (elaborate, shorten)")


class PageAIBlockRevisionResponse(BaseModel):
    """Response schema for creating a new AI block revision."""

    success: bool = Field(description="Whether creation was successful")
    revised_content: str = Field(description="Revised content")


class PageAIBlockRevisionType(BaseModel):
    """Schema for a single AI block revision type."""

    key: str = Field(description="Unique key for the revision type")
    label: str = Field(description="Display label for the revision type")
    description: str = Field(description="Description of what the revision does")


class PageAIBlockRevisionTypesResponse(BaseModel):
    """Response schema for listing available AI block revision types."""

    types: list[PageAIBlockRevisionType] = Field(description="List of available revision types")


class PageSummarizeRequest(BaseModel):
    """Request schema for summarizing a page."""

    page_id: UUID4 = Field(description="ID of the page to summarize")
    entity_type: str = Field(description="Type of entity (page, wiki)")
    workspace_id: UUID4 = Field(description="Workspace ID")
    project_id: Optional[UUID4] = Field(None, description="Optional project ID")


class PageSummarizeResponse(BaseModel):
    """Response schema for page summarization."""

    success: bool = Field(description="Whether summarization was successful")
    summary: Optional[str] = Field(None, description="Generated summary content")
    message: str = Field(description="Success or error message")


# ---------------------------------------------------------------------------
# Page Utility Embed schemas
# ---------------------------------------------------------------------------


class PageUtilityEmbedResponse(BaseModel):
    """Response schema for fetching a single embed payload by embed_id."""

    embed_id: str = Field(description="Stable UUID referenced by the page document placeholder")
    embed_type: str = Field(description="Broad embed category: 'chart', 'workitem', 'view', 'image', 'audio', etc.")
    sub_type: Optional[str] = Field(None, description="Renderer/variant within the category, e.g. 'PieChart', 'issue'")
    entity_type: str = Field(description="Type of entity: 'page' or 'wiki'")
    entity_id: str = Field(description="Plane page/wiki ID")
    chat_id: str = Field(description="Originating chat session ID")
    message_id: Optional[str] = Field(None, description="Assistant message ID that produced the embed")
    title: Optional[str] = Field(None, description="Display title")
    payload: Dict[str, Any] = Field(description="Full JSON payload whose shape varies by embed_type")
