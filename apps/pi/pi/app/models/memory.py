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
from typing import Optional

from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import UniqueConstraint
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field

from pi.app.models.base import BaseModel


class EntityMemoryType(str, Enum):
    USER = "user"
    PROJECT = "project"
    WORKSPACE = "workspace"


# Per-entity character limits — enforced at API, LLM prompt, and FE editor layers.
USER_MEMORY_MAX_CHARACTERS = 5000
PROJECT_MEMORY_MAX_CHARACTERS = 8000
WORKSPACE_MEMORY_MAX_CHARACTERS = 12000

# Backward-compat alias (user limit is the tightest, safe default)
MEMORY_MAX_CHARACTERS = USER_MEMORY_MAX_CHARACTERS

ENTITY_MEMORY_LIMITS: dict[str, int] = {
    EntityMemoryType.USER: USER_MEMORY_MAX_CHARACTERS,
    EntityMemoryType.PROJECT: PROJECT_MEMORY_MAX_CHARACTERS,
    EntityMemoryType.WORKSPACE: WORKSPACE_MEMORY_MAX_CHARACTERS,
}


def get_memory_limit(entity_type: str) -> int:
    """Return the max character limit for the given entity type string."""
    return ENTITY_MEMORY_LIMITS.get(entity_type, USER_MEMORY_MAX_CHARACTERS)


class EntityMemory(BaseModel, table=True):
    __tablename__ = "memories"
    __table_args__ = (
        UniqueConstraint(
            "entity_type",
            "entity_id",
            "workspace_id",
            name="uq_memory_type_id_workspace",
        ),
    )

    entity_type: str = Field(
        sa_column=Column(String(20), nullable=False, index=True),
    )
    entity_id: uuid.UUID = Field(nullable=False, index=True)
    workspace_id: uuid.UUID = Field(nullable=False, index=True)
    user_id: Optional[uuid.UUID] = Field(default=None, nullable=True, index=True)
    project_id: Optional[uuid.UUID] = Field(default=None, nullable=True, index=True)
    description: Optional[str] = Field(
        sa_column=Column(Text, nullable=False, server_default=text("''")),
    )
    description_json: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True),
    )
    description_html: str = Field(
        default="<p></p>",
        sa_column=Column(Text, nullable=False, server_default="<p></p>"),
    )
    is_memory_enabled: bool = Field(
        default=True,
        nullable=False,
        sa_column_kwargs={"server_default": text("true")},
    )
