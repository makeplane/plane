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

"""Query parsing utilities to avoid circular imports."""

from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Union
from uuid import UUID

from bs4 import BeautifulSoup
from pydantic import UUID4

from pi import logger

# Import MENTION_TAGS from settings to avoid circular import
from pi import settings

# from pi.services.retrievers.pg_store.message import create_message_mentions

MENTION_TAGS = settings.chat.MENTION_TAGS
log = logger.getChild(__name__)


class ParsedQuery:
    """Container for parsed query results."""

    def __init__(
        self,
        parsed_content: str,
        mentions: List[Dict[str, str]],
        links: List[str],
        mention_context: Optional[Dict[str, Any]] = None,
    ):
        self.parsed_content = parsed_content
        self.mentions = mentions
        self.links = links
        self.mention_context = mention_context or {}

    @property
    def has_links(self) -> bool:
        """Check if the query contains any links."""
        return len(self.links) > 0

    @property
    def has_mention_context(self) -> bool:
        """Check if enriched mention context is available."""
        return bool(self.mention_context.get("has_context", False))


async def parse_query(
    query: str,
    message_id: Optional[UUID4] = None,
    workspace_id: Optional[Union[UUID4, str]] = None,
    user_id: Optional[Union[UUID4, str]] = None,
    db: Optional[Any] = None,
    enrich_mentions: bool = True,
) -> ParsedQuery:
    """
    Parse HTML query to extract text, mentions, and links.

    Handles any HTML structure (p, pre, code, div, etc.) and recursively
    extracts text while identifying mention-component tags and links.

    If message_id, workspace_id, and db are provided, stores mentions in the database.
    If enrich_mentions is True, fetches comprehensive context for mentioned entities.

    Args:
        query: HTML string that may contain mention-component tags and links
        message_id: Optional message ID for database storage
        workspace_id: Optional workspace ID (UUID or string) for database storage
        user_id: Optional user ID for permissions in context enrichment
        db: Optional database session for storing mentions
        enrich_mentions: Whether to enrich mentions with context (default: True)

    Returns:
        ParsedQuery object containing:
        - parsed_content: Plain text with mentions replaced by descriptive text
        - mentions: List of mention dictionaries
        - links: List of URLs found in anchor tags
        - mention_context: Enriched context for mentioned entities
    """
    parsed = _parse_query_internal(query)

    from pi.services.retrievers.pg_store.message import create_message_mentions

    # Store mentions in database if message_id, workspace_id, and db are provided
    if message_id and workspace_id and db and parsed.mentions:
        # Convert workspace_id to UUID if it's a string
        ws_id = UUID(workspace_id) if isinstance(workspace_id, str) else workspace_id
        # Prepare mention data for database
        mention_records = []
        for mention in parsed.mentions:
            try:
                mention_id_uuid = UUID(mention["entity_id"])
                mention_records.append(
                    {
                        "message_id": message_id,
                        "workspace_id": ws_id,
                        "mention_type": mention["mention_type"],
                        "mention_id": mention_id_uuid,
                    }
                )
            except Exception as e:
                log.error(f"Failed to store mention record: {e}")
                continue

        await create_message_mentions(db, message_id, ws_id, mention_records)

    # Enrich mentions with context if requested
    mention_context = {}
    if enrich_mentions and parsed.mentions and user_id and workspace_id:
        try:
            from pi.services.mention_context import MentionContextEnricher

            enricher = MentionContextEnricher()
            mention_context = await enricher.enrich_mentions(
                parsed.mentions,
                user_id=str(user_id),
                workspace_id=str(workspace_id),
            )
            log.info(f"Enriched {mention_context.get("count", 0)} mentions with context")
        except Exception as e:
            log.error(f"Error enriching mentions: {e}", exc_info=True)
            mention_context = {}

    # Update parsed object with mention context
    parsed.mention_context = mention_context

    return parsed


def _parse_query_internal(query: str) -> ParsedQuery:
    """
    Internal function to parse HTML query and extract text, mentions, and links.

    Args:
        query: HTML string that may contain mention-component tags and links

    Returns:
        ParsedQuery object containing parsed content, mentions, and links
    """
    soup = BeautifulSoup(query, "html.parser")

    # Track all mentions and links
    mentions = []
    links = []

    def extract_text_recursive(element) -> str:
        """
        Recursively extract text from an element, handling special tags.

        Args:
            element: BeautifulSoup element to process

        Returns:
            Extracted text with mentions replaced by descriptive text
        """
        nonlocal mentions, links

        text_parts = []

        # Handle NavigableString (plain text nodes)
        if isinstance(element, str):
            return element

        # Handle mention-component tags
        if hasattr(element, "name") and element.name == "mention-component":
            # Prefer entity_identifier; fall back to id for backward compatibility
            entity_id = element.get("entity_identifier") or element.get("id")
            mention_target = element.get("target")
            entity_name = element.get("entity_name", "")
            label = element.get("label", "")

            if entity_id and mention_target:
                mention_tag_name = MENTION_TAGS.get(mention_target, mention_target)

                # Store mention details
                mentions.append(
                    {
                        "mention_type": mention_target,
                        "entity_id": entity_id,
                        "entity_name": entity_name,
                        "label": label,
                    }
                )

                return f"{mention_tag_name} with id: {entity_id}"
            return ""

        # Handle anchor tags (links)
        if hasattr(element, "name") and element.name == "a":
            href = element.get("href", "")
            if href:
                links.append(href)
                # Return the link text or URL
                link_text = element.get_text(strip=True)
                return link_text or href

        # For all other tags, recursively process children
        if hasattr(element, "children"):
            for child in element.children:
                child_text = extract_text_recursive(child)
                if child_text:
                    text_parts.append(child_text)

        return "".join(text_parts)

    # Extract text from the entire document
    parsed_content = extract_text_recursive(soup)

    # Clean up whitespace: collapse multiple spaces/newlines into single spaces
    parsed_content = " ".join(parsed_content.split())

    return ParsedQuery(parsed_content=parsed_content, mentions=mentions, links=links)
