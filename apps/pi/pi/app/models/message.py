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
from datetime import datetime
from typing import TYPE_CHECKING
from typing import List
from typing import Optional

from sqlalchemy import JSON
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field
from sqlmodel import Relationship

from pi.app.models.base import BaseModel
from pi.app.models.enums import ExecutionStatus
from pi.app.models.enums import MessageMetaStepType
from pi.app.models.enums import UserTypeChoices

if TYPE_CHECKING:
    pass


# Message table
class Message(BaseModel, table=True):
    __tablename__ = "messages"  # type: ignore[assignment]

    # Fields
    sequence: int = Field(nullable=False, index=True)
    content: Optional[str] = Field(default=None)
    parsed_content: Optional[str] = Field(default=None, nullable=True)
    reasoning: Optional[str] = Field(default=None, nullable=True)
    user_type: str = Field(sa_column=Column(String(50), nullable=False, default=UserTypeChoices.USER.value))
    workspace_slug: Optional[str] = Field(default=None, nullable=True, max_length=255)
    source: Optional[str] = Field(
        default=None, nullable=True, max_length=50, description="Source of the chat request (e.g., 'web', 'mobile', 'api', 'agent)"
    )

    # Foreign keys
    parent_id: Optional[uuid.UUID] = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("messages.id", name="fk_messages_parent_id"), nullable=True)
    )
    relates_to: Optional[uuid.UUID] = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("messages.id", name="fk_messages_relates_to"), nullable=True)
    )
    llm_model_id: Optional[uuid.UUID] = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("llm_models.id", name="fk_messages_llm_model_id"), nullable=True)
    )
    chat_id: Optional[uuid.UUID] = Field(
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("chats.id", name="fk_messages_chat_id"),
            nullable=True,
            default=None,
            index=True,
        )
    )
    llm_model: Optional[str] = Field(
        sa_column=Column(ForeignKey("llm_models.model_key", name="fk_messages_llm_model"), nullable=True),
        default=None,
    )

    # Regenerate/versioning fields
    is_replaced: bool = Field(
        default=False,
        nullable=False,
        description="Whether this message was replaced by regeneration (hidden from history)",
        sa_column_kwargs={"server_default": text("false")},
    )

    # Relationships
    message_feedbacks: List["MessageFeedback"] = Relationship(back_populates="message", sa_relationship_kwargs={"lazy": "selectin"})


# Message flow steps for tracking the internal flow of the message
class MessageFlowStep(BaseModel, table=True):
    __tablename__ = "message_flow_steps"  # type: ignore[assignment]

    # Fields
    step_order: int = Field(default=1, nullable=False)
    step_type: str = Field(sa_column=Column(String(50), nullable=False))
    tool_name: Optional[str] = Field(default=None, nullable=True)
    content: Optional[str] = Field(default=None)
    execution_data: Optional[dict] = Field(sa_type=JSON, default_factory=None)
    is_executed: bool = Field(
        default=False,
        nullable=True,
        description="Whether this planned action was executed by the user",
        sa_column_kwargs={"server_default": text("false")},
    )
    is_planned: bool = Field(
        default=False,
        nullable=True,
        description="Whether this is a planned action that requires user approval (vs automatically executed retrieval tools)",
        sa_column_kwargs={"server_default": text("false")},
    )
    execution_success: Optional[ExecutionStatus] = Field(
        sa_column=Column(String(50), nullable=True, default=ExecutionStatus.PENDING.value, index=True),
        description="Status of execution: pending (not attempted), success (completed successfully), failed (attempted but failed)",
    )
    execution_error: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Error message if execution failed",
    )
    # OAuth-related fields
    oauth_required: bool = Field(
        default=False,
        nullable=True,
        description="Whether this step requires OAuth authorization",
        sa_column_kwargs={"server_default": text("false")},
    )
    oauth_completed: bool = Field(
        default=False,
        nullable=True,
        description="Whether OAuth authorization has been completed",
        sa_column_kwargs={"server_default": text("false")},
    )
    oauth_completed_at: Optional[datetime] = Field(default=None, nullable=True, description="When OAuth authorization was completed")
    workspace_slug: Optional[str] = Field(default=None, nullable=True, max_length=255)
    mcp_connector_id: Optional[uuid.UUID] = Field(default=None, nullable=True)
    # Foreign keys
    message_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("messages.id", name="fk_message_flow_steps_message_id"), nullable=False)
    )
    chat_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("chats.id", name="fk_message_flow_steps_chat_id"), nullable=False))


# Message meta for token/cost tracking
class MessageMeta(BaseModel, table=True):
    __tablename__ = "message_meta"  # type: ignore[assignment]

    # Fields
    step_type: MessageMetaStepType = Field(sa_column=Column(String(50), nullable=False))
    input_text_tokens: Optional[int] = Field(nullable=True, default=None)
    input_text_price: Optional[float] = Field(nullable=True, default=None, description="In USD")
    output_text_tokens: Optional[int] = Field(nullable=True, default=None)
    output_text_price: Optional[float] = Field(nullable=True, default=None, description="In USD")
    cached_input_text_tokens: Optional[int] = Field(nullable=True, default=None)
    cached_input_text_price: Optional[float] = Field(nullable=True, default=None, description="In USD")
    workspace_slug: Optional[str] = Field(default=None, nullable=True, max_length=255)

    # Foreign keys
    message_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("messages.id", name="fk_message_meta_message_id"))
    )  # user_message_id
    llm_model_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("llm_models.id", name="fk_message_meta_llm_model_id"), nullable=True)
    )
    llm_model_pricing_id: Optional[uuid.UUID] = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("llm_model_pricing.id", name="fk_message_meta_llm_model_pricing_id"), nullable=True)
    )


# Feedback table
class MessageFeedback(BaseModel, table=True):
    __tablename__ = "message_feedbacks"  # type: ignore[assignment]

    # Fields
    type: Optional[str] = Field(sa_column=Column(String(50), nullable=True, default=None))
    feedback: Optional[str] = Field(default=None, nullable=True)
    reaction: Optional[str] = Field(default=None, nullable=True)
    feedback_message: Optional[str] = Field(default=None, nullable=True)
    user_id: uuid.UUID = Field(nullable=False, index=True)
    workspace_slug: Optional[str] = Field(default=None, nullable=True, max_length=255)

    # Foreign keys
    message_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("messages.id", name="fk_message_feedbacks_message_id"), nullable=False)
    )

    # Relationships
    message: "Message" = Relationship(back_populates="message_feedbacks", sa_relationship_kwargs={"lazy": "selectin"})
