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

# python imports
import uuid
from typing import Optional

# Third-party imports
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field

# Module imports
from pi.app.models.base import BaseModel
from pi.app.models.base import TimeAuditModel
from pi.app.models.base import UUIDModel


class LlmModel(BaseModel, table=True):
    __tablename__ = "llm_models"

    model_config = {"protected_namespaces": ()}

    # Fields
    name: str = Field(nullable=False, max_length=255)
    description: Optional[str] = Field(default=None, nullable=True)
    provider: str = Field(max_length=255)
    model_key: str = Field(nullable=False, max_length=255, unique=True)
    max_tokens: int = Field(nullable=False)
    is_active: bool = Field(default=True)


class LlmModelPricing(BaseModel, table=True):
    __tablename__ = "llm_model_pricing"

    # Fields
    llm_model_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("llm_models.id", name="fk_llm_model_pricing_llm_model_id")))
    text_input_price: Optional[float] = Field(nullable=True, default=None, description="In USD per 1M tokens")
    text_output_price: Optional[float] = Field(nullable=True, default=None, description="In USD per 1M tokens")
    cached_text_input_price: Optional[float] = Field(nullable=True, default=None, description="In USD per 1M tokens")
    web_search_call_price: Optional[float] = Field(nullable=True, default=None, description="In USD per web search call")


class LlmModelUsageTracking(UUIDModel, TimeAuditModel, table=True):
    __tablename__ = "llm_model_usage_tracking"

    # Fields
    entity_type: str = Field(
        nullable=False,
        description="Type of entity: 'page', 'wiki', etc.",
    )
    entity_id: uuid.UUID = Field(
        nullable=False,
        description="ID of the associated entity (page/wiki)",
    )
    usage_type: Optional[str] = Field(
        nullable=True,
        default=None,
        description="Type of AI feature: 'ai_block', 'summarize', 'elaborate', 'translate', 'key_points', etc.",
    )
    usage_id: Optional[uuid.UUID] = Field(
        default=None,
        nullable=True,
        description="ID of the specific feature instance (e.g., ai_block_id, page_id for one-off features)",
    )
    input_text_tokens: Optional[int] = Field(nullable=True, default=None)
    input_text_price: Optional[float] = Field(nullable=True, default=None, description="In USD")
    output_text_tokens: Optional[int] = Field(nullable=True, default=None)
    output_text_price: Optional[float] = Field(nullable=True, default=None, description="In USD")
    cached_input_text_tokens: Optional[int] = Field(nullable=True, default=None)
    cached_input_text_price: Optional[float] = Field(nullable=True, default=None, description="In USD")

    # Foreign keys
    llm_model_id: Optional[uuid.UUID] = Field(
        default=None,
        nullable=True,
        foreign_key="llm_models.id",
    )
    workspace_id: uuid.UUID = Field(
        nullable=False,
    )
    user_id: uuid.UUID = Field(
        nullable=False,
    )
