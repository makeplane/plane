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

"""Base classes for mention context fetchers."""

from abc import ABC
from abc import abstractmethod
from typing import Any
from typing import Dict
from typing import Optional


class EntityContext:
    """Container for entity context data."""

    def __init__(self, entity_id: str, entity_type: str, entity_name: str, context_data: Dict[str, Any]):
        self.entity_id = entity_id
        self.entity_type = entity_type
        self.entity_name = entity_name
        self.context_data = context_data

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {"entity_id": self.entity_id, "entity_type": self.entity_type, "entity_name": self.entity_name, "context_data": self.context_data}


class BaseEntityFetcher(ABC):
    """Abstract base class for entity context fetchers."""

    @abstractmethod
    async def fetch_context(self, entity_id: str, user_id: Optional[str] = None, workspace_id: Optional[str] = None) -> Optional[EntityContext]:
        """
        Fetch core context for an entity.

        Args:
            entity_id: Entity UUID
            user_id: Current user ID (for permissions)
            workspace_id: Current workspace ID

        Returns:
            EntityContext with core fields or None if not found
        """
        pass

    @abstractmethod
    def format_for_llm(self, context: EntityContext) -> str:
        """
        Format entity context for LLM consumption.

        Args:
            context: Entity context data

        Returns:
            Formatted string for LLM prompt injection
        """
        pass
