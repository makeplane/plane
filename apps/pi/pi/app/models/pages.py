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
from typing import Any
from typing import Dict
from typing import Optional

from sqlalchemy import JSON
from sqlalchemy import Column
from sqlalchemy import Index
from sqlalchemy import String
from sqlmodel import Field

from pi.app.models.base import SoftDeleteModel
from pi.app.models.base import TimeAuditModel
from pi.app.models.base import UUIDModel


class PageAIBlock(UUIDModel, TimeAuditModel, SoftDeleteModel, table=True):
    __tablename__ = "page_ai_blocks"

    # Fields
    user_id: uuid.UUID = Field(nullable=False, index=True)
    block_type: str = Field(
        nullable=False,
        description="Type of AI block: 'summary', 'custom', 'action_items', etc.",
    )
    content: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Custom prompt content, only used when block_type='custom'",
    )
    generated_content: Optional[str] = Field(
        default=None,
        nullable=True,
        description="AI-generated output/result",
    )
    entity_type: str = Field(
        sa_column=Column(String(50), nullable=False, index=True),
        description="Type of entity: 'page', 'wiki', etc.",
    )
    entity_id: uuid.UUID = Field(
        nullable=False,
        index=True,
        description="ID of the associated entity (page/wiki)",
    )
    project_id: Optional[uuid.UUID] = Field(
        default=None,
        nullable=True,
        index=True,
    )
    workspace_id: uuid.UUID = Field(
        nullable=False,
        index=True,
    )


class PageUtilityEmbed(UUIDModel, TimeAuditModel, table=True):
    """Persists embed payloads (charts, work items, views, etc.) produced by PI tools when a chat response is saved as a page."""

    __tablename__ = "page_utility_embeds"
    __table_args__ = (
        Index("ix_page_utility_embeds_entity", "entity_type", "entity_id"),
        Index("ix_page_utility_embeds_chat_message", "chat_id", "message_id"),
    )

    embed_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        nullable=False,
        index=True,
        unique=True,
        description="Stable UUID referenced by the page document placeholder",
    )
    embed_type: str = Field(
        sa_column=Column(String(50), nullable=False),
        description="Broad embed category: 'chart', 'workitem', 'view', 'image', 'audio', etc.",
    )
    sub_type: Optional[str] = Field(
        sa_column=Column(String(100), nullable=True),
        description="Renderer/variant within the category: 'PieChart', 'BarChart' for charts; 'issue', 'cycle' for work items",
    )
    entity_type: str = Field(
        sa_column=Column(String(50), nullable=False),
        description="Type of entity containing the embed: 'page' or 'wiki'",
    )
    entity_id: uuid.UUID = Field(
        nullable=False,
        description="Plane page/wiki ID that contains the embed",
    )
    workspace_id: uuid.UUID = Field(nullable=False, index=True)
    project_id: Optional[uuid.UUID] = Field(default=None, nullable=True)
    chat_id: uuid.UUID = Field(nullable=False, description="Chat session the embed originated from")
    message_id: Optional[uuid.UUID] = Field(default=None, nullable=True, description="Assistant message ID that produced the embed")
    title: Optional[str] = Field(default=None, nullable=True, description="Display title for the embed")
    payload: Dict[str, Any] = Field(
        sa_column=Column(JSON, nullable=False),
        description="Full JSON payload whose shape varies by embed_type",
    )
