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

"""Factory for creating entity-specific fetchers."""

from typing import Optional

from pi import logger

from .base import BaseEntityFetcher

log = logger.getChild(__name__)


class EntityFetcherFactory:
    """Factory to create appropriate fetcher for entity type."""

    # Supported entity types
    SUPPORTED_TYPES = [
        "issues",
        "workitems",
        "epics",  # Work items
        "pages",
        "cycles",
        "modules",
        "projects",
        "users",
        "labels",
        "states",
        "issue_views",
        "teams",
        "initiatives",
    ]

    @classmethod
    def get_fetcher(cls, entity_type: str) -> Optional[BaseEntityFetcher]:
        """
        Get fetcher instance for entity type.

        Args:
            entity_type: Type of entity (issues, pages, cycles, etc.)

        Returns:
            Fetcher instance or None if not supported
        """
        entity_type_lower = entity_type.lower()

        if entity_type_lower not in cls.SUPPORTED_TYPES:
            log.warning(f"No fetcher found for entity type: {entity_type}")
            return None

        try:
            # Import here to avoid circular dependency
            from .fetchers import UnifiedEntityFetcher

            return UnifiedEntityFetcher(entity_type_lower)
        except Exception as e:
            log.error(f"Error creating fetcher for {entity_type}: {e}")
            return None

    @classmethod
    def get_supported_types(cls) -> list:
        """Get list of supported entity types."""
        return cls.SUPPORTED_TYPES.copy()
