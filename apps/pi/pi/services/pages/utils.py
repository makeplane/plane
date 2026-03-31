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

from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from fastapi.responses import JSONResponse
from langchain_core.messages import BaseMessage
from langchain_core.messages import HumanMessage
from langchain_core.messages import SystemMessage

from pi import logger
from pi.app.api.v1.helpers.plane_sql_queries import get_page_content
from pi.services.pages.constants import PAGE_BLOCK_TYPES
from pi.services.pages.constants import REVISION_BLOCK_TYPES

log = logger.getChild(__name__)


async def get_entity_context(entity_type: str, entity_id: str, user_id: Optional[str] = None) -> Optional[str]:
    """
    Fetch and format the context content for a given entity.

    Args:
        entity_type: Type of the entity (e.g., "page")
        entity_id: UUID of the entity
        user_id: Optional user ID for workspace membership validation.
                 When provided, the query verifies the user belongs to the
                 workspace that owns the entity before returning content.

    Returns:
        Formatted context string or None if not found/unsupported.
    """
    if entity_type == "page" or entity_type == "wiki":
        page_data = await get_page_content(entity_id, user_id=user_id)
        if not page_data:
            log.warning(f"Page content not found for entity_id: {entity_id}")
            return None

        # Prefer stripped description (text only), fallback to HTML or empty string
        content = page_data.get("description_html") or ""
        page_name = page_data.get("name", "")

        if page_name:
            return f"Page Title: {page_name}\n\nContent:\n{content}"
        return content

    # Add other entity types here as needed (e.g., "issue", "wiki")
    log.warning(f"Unsupported entity type for context fetching: {entity_type}")
    return None


def construct_messages(
    block_type: str, context_text: str, user_input: Optional[str] = None, current_content: Optional[str] = None
) -> Optional[List[BaseMessage]]:
    """
    Construct messages for any block type (page blocks or revisions).

    Args:
        block_type: Block type key (e.g., "summarize_page", "elaborate", "shorten")
        context_text: The context content
        user_input: User input for custom prompts
        current_content: Current content for revisions

    Returns:
        List of LangChain messages or None if unsupported
    """
    # Get config from either PAGE_BLOCK_TYPES or REVISION_BLOCK_TYPES
    config: Optional[Dict[str, Any]] = next((b for b in PAGE_BLOCK_TYPES if b["key"] == block_type), None) or next(
        (r for r in REVISION_BLOCK_TYPES if r["key"] == block_type), None
    )

    if not config:
        log.warning(f"Unsupported block type: {block_type}")
        return None

    # Get and format template
    template = str(config.get("user_message", ""))
    system_prompt = str(config.get("system_message", ""))

    user_message = template.format(context_text=context_text, user_input=user_input or "", current_content=current_content or "")

    return [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_message),
    ]


# Validation Functions


def validate_block_type(block_type: str) -> Optional[JSONResponse]:
    """
    Validate that a block_type is one of the allowed types.

    Args:
        block_type: The block type to validate

    Returns:
        JSONResponse with error if invalid, None if valid
    """
    valid_block_types = [str(bt["key"]) for bt in PAGE_BLOCK_TYPES]
    if block_type not in valid_block_types:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": f"Invalid block_type '{block_type}'. Must be one of: {', '.join(valid_block_types)}",
            },
        )
    return None


def validate_revision_type(revision_type: str) -> Optional[JSONResponse]:
    """
    Validate that a revision_type is one of the allowed types.

    Args:
        revision_type: The revision type to validate

    Returns:
        JSONResponse with error if invalid, None if valid
    """
    valid_revision_types = [str(rt["key"]) for rt in REVISION_BLOCK_TYPES]
    if revision_type not in valid_revision_types:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": f"Invalid revision_type '{revision_type}'. Must be one of: {', '.join(valid_revision_types)}",
            },
        )
    return None


def is_valid_block_type(block_type: str) -> bool:
    """
    Check if a block_type is valid (for service layer validation).

    Args:
        block_type: The block type to check

    Returns:
        True if valid, False otherwise
    """
    valid_block_types = [str(bt["key"]) for bt in PAGE_BLOCK_TYPES]
    return block_type in valid_block_types


def is_valid_revision_type(revision_type: str) -> bool:
    """
    Check if a revision_type is valid (for service layer validation).

    Args:
        revision_type: The revision type to check

    Returns:
        True if valid, False otherwise
    """
    valid_revision_types = [str(rt["key"]) for rt in REVISION_BLOCK_TYPES]
    return revision_type in valid_revision_types


def has_content_for_block(block_type: str, content: Optional[str]) -> bool:
    """
    Determine if a block has content based on its type and content value.

    Custom prompt blocks have content if the content field is not None.
    Other block types don't have content fields.

    Args:
        block_type: Type of the block
        content: Content value of the block

    Returns:
        True if the block has content, False otherwise
    """
    return block_type == "custom_prompt" and content is not None
