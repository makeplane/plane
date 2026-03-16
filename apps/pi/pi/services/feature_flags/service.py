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

"""Feature flag service for checking feature availability."""

import logging
from dataclasses import dataclass
from typing import Dict
from typing import Optional

from pi import settings
from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_slug
from pi.app.utils.feature_flag import is_feature_enabled

logger = logging.getLogger(__name__)


@dataclass
class FeatureFlagContext:
    """Context for feature flag checking."""

    user_id: str
    workspace_id: Optional[str] = None
    workspace_slug: Optional[str] = None


class FeatureFlagService:
    """Service for checking feature flags."""

    def __init__(self):
        self.flags = settings.feature_flags

    async def is_enabled(self, flag: str, context: FeatureFlagContext) -> bool:
        """
        Check if a feature flag is enabled for the given context.

        Args:
            flag: Feature flag key (e.g., AI_CHAT, PI_BUILD)
            context: Feature flag context with user and workspace info

        Returns:
            bool: True if feature is enabled, False otherwise
        """
        if not context.workspace_slug:
            if context.workspace_id:
                context.workspace_slug = await get_workspace_slug(context.workspace_id)
            else:
                logger.warning(f"No workspace_slug provided for feature flag check: {flag}")
                return False

        try:
            # Ensure workspace_slug is not None before passing to is_feature_enabled
            if context.workspace_slug is None:
                logger.warning(f"workspace_slug is None for feature flag check: {flag}")
                return False
            result = await is_feature_enabled(flag, context.workspace_slug, context.user_id)
            logger.debug(f"Feature flag {flag} for workspace {context.workspace_slug} : {result}")
            return result
        except Exception as e:
            logger.error(f"Error checking feature flag {flag}: {e}")
            return False

    async def check_multiple(self, flags: list[str], context: FeatureFlagContext) -> Dict[str, bool]:
        """
        Check multiple feature flags at once.

        Args:
            flags: List of feature flag keys
            context: Feature flag context

        Returns:
            Dict[str, bool]: Mapping of flag keys to their enabled status
        """
        results = {}
        for flag in flags:
            results[flag] = await self.is_enabled(flag, context)
        return results

    async def is_chat_enabled(self, context: FeatureFlagContext) -> bool:
        """Check if chat feature is enabled."""
        return await self.is_enabled(self.flags.AI_CHAT, context)

    async def is_dedupe_enabled(self, context: FeatureFlagContext) -> bool:
        """Check if dedupe feature is enabled."""
        return await self.is_enabled(self.flags.AI_DEDUPE, context)

    # async def is_build_enabled(self, context: FeatureFlagContext) -> bool:
    #     """Check if build/actions feature is enabled."""
    #     return await self.is_enabled(self.flags.PI_BUILD, context)

    def get_available_flags(self) -> list[str]:
        """Get list of all available feature flags."""
        return [
            self.flags.AI_CHAT,
            self.flags.AI_DEDUPE,
            self.flags.AI_CONVERSE,
            self.flags.AI_FILE_UPLOADS,
            self.flags.AI_PAGES_BLOCKS,
            self.flags.AI_PAGES_SUMMARY,
        ]


# Global feature flag service instance
feature_flag_service = FeatureFlagService()
