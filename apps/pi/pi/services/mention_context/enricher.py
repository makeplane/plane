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

"""Main orchestrator for mention context enrichment."""

import asyncio
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from pi import logger

from .factory import EntityFetcherFactory
from .formatter import MentionContextFormatter

log = logger.getChild(__name__)


class MentionContextEnricher:
    """Main orchestrator for enriching entity mentions with context."""

    def __init__(self):
        self.factory = EntityFetcherFactory()
        self.formatter = MentionContextFormatter()

    async def enrich_mentions(
        self, mentions: List[Dict[str, str]], user_id: Optional[str] = None, workspace_id: Optional[str] = None, max_concurrent: int = 5
    ) -> Dict[str, Any]:
        """
        Enrich multiple mentions concurrently with core context.

        Args:
            mentions: List of mention dicts from parse_query()
                     Each dict has: mention_type, entity_id, entity_name, label
            user_id: Current user ID (for permissions)
            workspace_id: Current workspace ID
            max_concurrent: Max parallel fetch operations

        Returns:
            Dict with formatted_context string ready for LLM injection
        """
        if not mentions:
            return {}

        log.info(f"Enriching {len(mentions)} mentions with context")

        # Use semaphore to limit concurrency
        semaphore = asyncio.Semaphore(max_concurrent)

        async def fetch_with_limit(mention):
            async with semaphore:
                return await self._fetch_single_mention(mention, user_id, workspace_id)

        # Fetch all mentions concurrently
        tasks = [fetch_with_limit(m) for m in mentions]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter successful results
        enriched_contexts: List[str] = []
        for idx, result in enumerate(results):
            if isinstance(result, Exception):
                log.error(f"Error fetching mention context for {mentions[idx]}: {result}")
                continue
            if result and isinstance(result, str):
                enriched_contexts.append(result)

        log.info(f"Successfully enriched {len(enriched_contexts)}/{len(mentions)} mentions")

        # Format for LLM injection
        return self.formatter.format_all_contexts(enriched_contexts)

    async def _fetch_single_mention(self, mention: Dict[str, str], user_id: Optional[str], workspace_id: Optional[str]) -> Optional[str]:
        """
        Fetch and format context for a single mention.

        Args:
            mention: Dict with mention_type, entity_id, entity_name
            user_id: Current user ID
            workspace_id: Current workspace ID

        Returns:
            Formatted context string or None
        """
        entity_type = mention.get("mention_type")
        entity_id = mention.get("entity_id")

        if not entity_type or not entity_id:
            log.warning(f"Invalid mention: missing type or ID: {mention}")
            return None

        # Get appropriate fetcher
        fetcher = self.factory.get_fetcher(entity_type)
        if not fetcher:
            log.warning(f"No fetcher found for entity type: {entity_type}")
            return None

        try:
            # Fetch context
            context = await fetcher.fetch_context(entity_id, user_id, workspace_id)

            if not context:
                log.debug(f"No context found for {entity_type}:{entity_id}")
                return None

            # Format for LLM
            formatted = fetcher.format_for_llm(context)
            log.debug(f"Enriched {entity_type}:{entity_id} - {context.entity_name}")

            return formatted

        except Exception as e:
            log.error(f"Error enriching mention {entity_type}:{entity_id}: {e}", exc_info=True)
            return None
