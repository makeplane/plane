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

"""Service for AI block operations."""

from typing import Optional
from uuid import UUID

from pi import logger
from pi.services.pages.content import PageContentService
from pi.services.pages.prompts import get_prompt
from pi.services.retrievers.pg_store.pages import get_page_ai_block_by_id
from pi.services.retrievers.pg_store.pages import update_page_ai_block_generated_content

log = logger.getChild(__name__)


class AIBlockService(PageContentService):
    """
    Service for AI block content generation and revision.

    Uses centralized prompts from prompts.py for all operations.
    """

    def __init__(self, db, block_type: Optional[str] = None):
        """
        Initialize AI block service.

        Args:
            db: Database session
            block_type: Type of AI block (custom_prompt, elaborate, shorten)
        """
        super().__init__(db)
        self.block_type = block_type

    def build_system_prompt(self) -> str:
        """Return system prompt based on block type."""
        # Map block types to prompt keys
        prompt_key = self.block_type if self.block_type in ["elaborate", "shorten"] else "custom_prompt"
        return get_prompt(prompt_key)

    def build_user_prompt(self, context_text: str, **kwargs) -> str:
        """
        Build user prompt based on block type.

        Args:
            context_text: Page content
            **kwargs: May contain 'user_input' for custom prompts or 'current_content' for revisions

        Returns:
            User prompt string
        """
        if self.block_type in ["elaborate", "shorten"]:
            current_content = kwargs.get("current_content", "")
            return f"Revision Request: {self.block_type}\n\nContext:\n{context_text}\n\nCurrent Content:\n{current_content}"
        else:  # custom_prompt
            user_input = kwargs.get("user_input", "")
            return f"Context:\n{context_text}\n\nUser Request: {user_input}"

    def get_usage_type(self) -> str:
        """Return usage type for token tracking."""
        if self.block_type in ["elaborate", "shorten"]:
            return "ai_block_revision"
        return "ai_block"

    async def generate_block_content(
        self,
        block,
        user_id: UUID,
        user_input: Optional[str] = None,
    ) -> Optional[str]:
        """
        Generate content for an AI block.

        Args:
            block: The PageAIBlock instance
            user_id: User ID
            user_input: Optional user input for custom prompts

        Returns:
            Generated content or None
        """
        try:
            # Set block type from the block
            self.block_type = block.block_type

            # Generate content using template method
            generated_content = await self.generate_content(
                page_id=block.entity_id,
                entity_type=block.entity_type,
                workspace_id=block.workspace_id,
                user_id=user_id,
                usage_id=block.id,
                user_input=user_input or block.content,
            )

            if not generated_content:
                return None

            # Update block with generated content
            result = await update_page_ai_block_generated_content(
                db=self.db,
                block_id=block.id,
                generated_content=generated_content,
                user_id=user_id,
            )

            if not result.get("success"):
                return None

            return generated_content

        except Exception as e:
            log.error(f"Failed to generate AI block content: {e}")
            return None

    async def generate_revision(
        self,
        block_id: UUID,
        revision_type: str,
        user_id: UUID,
    ) -> Optional[str]:
        """
        Generate a revision for an AI block.

        Args:
            block_id: Block ID
            revision_type: Type of revision (elaborate, shorten)
            user_id: User ID

        Returns:
            Revised content or None
        """
        try:
            # Set block type to revision type
            self.block_type = revision_type

            # Fetch the block
            block = await get_page_ai_block_by_id(self.db, block_id)
            if not block or not block.generated_content:
                return None

            # Generate revised content
            revised_content = await self.generate_content(
                page_id=block.entity_id,
                entity_type=block.entity_type,
                workspace_id=block.workspace_id,
                user_id=user_id,
                usage_id=block_id,
                current_content=block.generated_content,
            )

            if not revised_content:
                return None

            # Update block with revised content
            result = await update_page_ai_block_generated_content(
                db=self.db,
                block_id=block_id,
                generated_content=revised_content,
                user_id=user_id,
            )

            if not result.get("success"):
                return None

            return revised_content

        except Exception as e:
            log.error(f"Failed to generate revision: {e}")
            return None
