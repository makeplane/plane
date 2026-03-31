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

"""Base service class for page content generation using LLMs."""

from abc import ABC
from abc import abstractmethod
from typing import Any
from typing import AsyncGenerator
from typing import Dict
from typing import Optional
from uuid import UUID

from langchain_core.messages import HumanMessage
from langchain_core.messages import SystemMessage
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.services.llm.llms import LLMFactory
from pi.services.llm.token_tracker import TokenTracker
from pi.services.pages.utils import get_entity_context

log = logger.getChild(__name__)


class PageContentService(ABC):
    """
    Base service class for page content generation.

    Provides common functionality for LLM-based content generation including:
    - Context fetching from pages
    - LLM invocation
    - Token tracking and cost calculation

    Subclasses must implement:
    - build_system_prompt(): Return the system prompt for the feature
    - build_user_prompt(): Return the user prompt with context
    - get_usage_type(): Return the usage type for token tracking
    """

    def __init__(
        self,
        db: AsyncSession,
    ):
        """
        Initialize the service.

        Args:
            db: Database session for token tracking
            model_key: LLM model to use
        """
        self.db = db
        self.model_key = LLMFactory.get_fallback_model_name()

    @abstractmethod
    def build_system_prompt(self) -> str:
        """
        Build the system prompt for this feature.

        Returns:
            System prompt string
        """
        pass

    @abstractmethod
    def build_user_prompt(self, context_text: str, **kwargs) -> str:
        """
        Build the user prompt with context.

        Args:
            context_text: The page content context
            **kwargs: Additional feature-specific parameters

        Returns:
            User prompt string
        """
        pass

    @abstractmethod
    def get_usage_type(self) -> str:
        """
        Get the usage type for token tracking.

        Returns:
            Usage type string (e.g., "summarize", "ai_block")
        """
        pass

    async def fetch_page_context(self, page_id: UUID, user_id: Optional[UUID] = None) -> Optional[str]:
        """
        Fetch page content context.

        Args:
            page_id: ID of the page
            user_id: Optional user ID for workspace membership validation

        Returns:
            Page content as string, or None if empty or access denied
        """
        try:
            context_text = await get_entity_context(
                "page",
                str(page_id),
                user_id=str(user_id) if user_id else None,
            )
            if not context_text or not context_text.strip():
                log.warning(f"Page {page_id} has no content")
                return None
            return context_text
        except Exception as e:
            log.error(f"Failed to fetch page context: {e}")
            return None

    async def invoke_llm(self, system_prompt: str, user_prompt: str) -> Optional[Any]:
        """
        Invoke LLM with prompts.

        Args:
            system_prompt: System prompt
            user_prompt: User prompt

        Returns:
            LLM response or None if failed
        """
        try:
            # Initialize LLM
            llm = LLMFactory.get_chat_llm(self.model_key)

            # Construct messages
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]

            # Invoke LLM
            response = await llm.ainvoke(messages)
            return response
        except Exception as e:
            log.error(f"Failed to invoke LLM: {e}")
            return None

    async def track_usage(
        self,
        llm_response: Any,
        entity_type: str,
        entity_id: UUID,
        workspace_id: UUID,
        user_id: UUID,
        usage_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """
        Track LLM token usage and costs.

        Args:
            llm_response: The LLM response
            entity_type: Type of entity (page, wiki)
            entity_id: ID of the entity
            workspace_id: Workspace ID
            user_id: User ID
            usage_id: Optional usage ID (for AI blocks with a blocks table, None for summarization)

        Returns:
            Tracking result dictionary
        """
        try:
            result = await TokenTracker(self.db).track_entity_llm_usage(
                llm_response=llm_response,
                model_key=self.model_key,
                entity_type=entity_type,
                entity_id=entity_id,
                workspace_id=workspace_id,
                user_id=user_id,
                usage_type=self.get_usage_type(),
                usage_id=usage_id,  # None for summarization, block_id for AI blocks
            )
            return result
        except Exception as e:
            log.error(f"Failed to track usage: {e}")
            return {"success": False, "error": str(e)}

    async def generate_content(
        self,
        page_id: UUID,
        entity_type: str,
        workspace_id: UUID,
        user_id: UUID,
        usage_id: Optional[UUID] = None,
        **kwargs,
    ) -> Optional[str]:
        """
        Template method for content generation.

        This orchestrates the entire flow:
        1. Fetch page context
        2. Build prompts
        3. Invoke LLM
        4. Track usage
        5. Return generated content

        Args:
            page_id: ID of the page
            entity_type: Type of entity (page, wiki)
            workspace_id: Workspace ID
            user_id: User ID
            usage_id: Optional usage ID for tracking
            **kwargs: Feature-specific parameters

        Returns:
            Generated content string or None if failed
        """
        try:
            # 1. Fetch context (with workspace membership check)
            context_text = await self.fetch_page_context(page_id, user_id=user_id)
            if not context_text:
                return None

            # 2. Build prompts
            system_prompt = self.build_system_prompt()
            user_prompt = self.build_user_prompt(context_text, **kwargs)

            # 3. Invoke LLM
            response = await self.invoke_llm(system_prompt, user_prompt)
            if not response:
                return None

            generated_content = response.content

            # 4. Track usage
            await self.track_usage(
                llm_response=response,
                entity_type=entity_type,
                entity_id=page_id,
                workspace_id=workspace_id,
                user_id=user_id,
                usage_id=usage_id,
            )

            return generated_content

        except Exception as e:
            log.error(f"Failed to generate content: {e}")
            return None

    async def generate_content_stream(
        self,
        page_id: UUID,
        entity_type: str,
        workspace_id: UUID,
        user_id: UUID,
        usage_id: Optional[UUID] = None,
        **kwargs,
    ) -> AsyncGenerator[str, None]:
        """
        Stream content generation chunk by chunk.

        Yields chunks immediately as they arrive from LLM.
        Collects chunks for token tracking without delaying output.

        Args:
            page_id: ID of the page
            entity_type: Type of entity (page, wiki)
            workspace_id: Workspace ID
            user_id: User ID
            usage_id: Optional usage ID for tracking
            **kwargs: Feature-specific parameters

        Yields:
            Content chunks as strings
        """
        try:
            # 1. Fetch context (with workspace membership check)
            context_text = await self.fetch_page_context(page_id, user_id=user_id)
            if not context_text:
                return

            # 2. Build prompts
            system_prompt = self.build_system_prompt()
            user_prompt = self.build_user_prompt(context_text, **kwargs)

            # 3. Get streaming LLM
            llm = LLMFactory.get_chat_llm(self.model_key)

            # Construct messages
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]

            # 4. Stream chunks - yield immediately AND collect for tracking
            chunks = []
            async for chunk in llm.astream(messages):
                if chunk:
                    chunks.append(chunk)  # Collect ALL chunks for token tracking (usage metadata arrives in empty-content chunks)
                    if chunk.content:
                        yield chunk.content  # Only yield content chunks to the client

            # 5. Track aggregated usage (after streaming completes)
            if chunks:
                aggregate = chunks[0]
                for chunk in chunks[1:]:
                    aggregate = aggregate + chunk
                await self.track_usage(
                    llm_response=aggregate,
                    entity_type=entity_type,
                    entity_id=page_id,
                    workspace_id=workspace_id,
                    user_id=user_id,
                    usage_id=usage_id,
                )

        except Exception as e:
            log.error(f"Failed to generate streaming content: {e}")
            return
