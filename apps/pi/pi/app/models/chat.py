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

# models/chat.py
import uuid
from typing import Any
from typing import Dict
from typing import Optional

from sqlalchemy import JSON
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field

from pi.app.models.base import BaseModel
from pi.app.models.enums import FocusEntityType


class Chat(BaseModel, table=True):
    __tablename__ = "chats"

    # Fields
    title: Optional[str] = Field(default=None, nullable=True, max_length=255)
    description: Optional[str] = Field(default=None, nullable=True)
    icon: Optional[Dict[str, Any]] = Field(sa_type=JSON, default_factory=dict)
    user_id: uuid.UUID = Field(default=None, nullable=False, index=True)
    workspace_id: uuid.UUID = Field(default=None, nullable=True)
    workspace_slug: Optional[str] = Field(default=None, nullable=True, max_length=255)
    is_favorite: bool = Field(default=False, nullable=False, sa_column_kwargs={"server_default": text("false")})
    is_project_chat: bool = Field(default=False, nullable=False, sa_column_kwargs={"server_default": text("false")})
    workspace_in_context: Optional[bool] = Field(default=None, nullable=True)
    is_websearch_enabled: bool = Field(default=False, nullable=False)


class UserChatPreference(BaseModel, table=True):
    __tablename__ = "user_chat_preferences"

    # Fields
    is_focus_enabled: bool = Field(default=True, nullable=False)
    is_websearch_enabled: bool = Field(default=False, nullable=False)
    # Polymorphic focus context - replaces focus_project_id and focus_workspace_id
    focus_entity_type: Optional[str] = Field(default=None, nullable=True, max_length=50)
    focus_entity_id: Optional[uuid.UUID] = Field(default=None, nullable=True)
    # Legacy fields - kept for backward compatibility during migration
    focus_project_id: Optional[uuid.UUID] = Field(default=None, nullable=True)
    focus_workspace_id: Optional[uuid.UUID] = Field(default=None, nullable=True)
    mode: str = Field(default="ask", nullable=False, max_length=10)  # "ask" or "build"
    user_id: uuid.UUID = Field(default=None, nullable=False)

    # Foreign keys
    chat_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), ForeignKey("chats.id", name="fk_user_chat_preferences_chat_id"), nullable=False))

    def get_focus_entity_type_enum(self) -> Optional[FocusEntityType]:
        """Get focus_entity_type as enum if valid, otherwise None."""
        if self.focus_entity_type:
            try:
                return FocusEntityType(self.focus_entity_type)
            except ValueError:
                return None
        return None
