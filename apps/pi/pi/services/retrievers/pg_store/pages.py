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

from datetime import datetime
from datetime import timezone
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from pydantic import UUID4
from sqlalchemy import desc
from sqlalchemy import func
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.models.feedback import Feedback
from pi.app.models.pages import PageAIBlock
from pi.services.pages.utils import has_content_for_block
from pi.services.pages.utils import is_valid_block_type

log = logger.getChild(__name__)


async def get_page_ai_block_by_id(
    db: AsyncSession,
    block_id: UUID4,
) -> Optional[PageAIBlock]:
    """
    Retrieve a page AI block by its ID.

    Args:
        db: Database session
        block_id: ID of the AI block

    Returns:
        PageAIBlock object or None if not found
    """
    try:
        stmt = select(PageAIBlock).where(PageAIBlock.id == block_id)  # type: ignore[arg-type]
        result = await db.execute(stmt)
        block = result.scalar_one_or_none()
        return block

    except Exception as e:
        log.error(f"Error retrieving page AI block {block_id}: {str(e)}")
        return None


async def create_page_ai_block(
    db: AsyncSession,
    user_id: UUID4,
    block_type: str,
    entity_type: str,
    entity_id: UUID4,
    workspace_id: UUID4,
    content: Optional[str] = None,
    project_id: Optional[UUID4] = None,
) -> Dict[str, Any]:
    """
    Create a new page AI block.

    Args:
        db: Database session
        user_id: ID of the user creating the block
        block_type: Type of AI block
        entity_type: Type of entity (page, wiki)
        entity_id: ID of the entity
        workspace_id: Workspace ID
        content: Optional custom prompt content
        project_id: Optional project ID

    Returns:
        Dictionary with success status and block object or error details
    """
    # Validate block_type
    if not is_valid_block_type(block_type):
        return {"success": False, "error": f"Invalid block_type: {block_type}"}

    try:
        new_block = PageAIBlock(
            user_id=user_id,
            block_type=block_type,
            entity_type=entity_type,
            entity_id=entity_id,
            workspace_id=workspace_id,
            content=content,
            project_id=project_id,
        )

        db.add(new_block)
        await db.commit()
        await db.refresh(new_block)

        return {"success": True, "block": new_block}

    except Exception as e:
        await db.rollback()
        log.error(f"Error creating page AI block: {str(e)}")
        return {"success": False, "error": str(e)}


async def update_page_ai_block(
    db: AsyncSession,
    block_id: UUID4,
    user_id: UUID4,
    block_type: Optional[str] = None,
    content: Optional[str] = None,
    generated_content: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Update an existing page AI block.

    Args:
        db: Database session
        block_id: ID of the block to update
        block_type: New block type (optional)
        content: New content (optional)
        generated_content: New generated content (optional)

    Returns:
        Dictionary with success status and block object or error details
    """
    # Validate block_type if provided
    if block_type is not None and not is_valid_block_type(block_type):
        return {"success": False, "error": f"Invalid block_type: {block_type}"}

    try:
        stmt = select(PageAIBlock).where(PageAIBlock.id == block_id).where(PageAIBlock.user_id == user_id)  # type: ignore[arg-type]
        result = await db.execute(stmt)
        block = result.scalar_one_or_none()

        if not block:
            return {"success": False, "error": f"Page AI block with ID {block_id} not found"}

        # Update fields if provided
        if block_type is not None:
            block.block_type = block_type
        if content is not None:
            block.content = content
        if generated_content is not None:
            block.generated_content = generated_content

        db.add(block)
        await db.commit()
        await db.refresh(block)

        return {"success": True, "block": block}

    except Exception as e:
        await db.rollback()
        log.error(f"Error updating page AI block {block_id}: {str(e)}")
        return {"success": False, "error": str(e)}


async def update_page_ai_block_generated_content(
    db: AsyncSession,
    block_id: UUID4,
    user_id: UUID4,
    generated_content: str,
) -> Dict[str, Any]:
    """
    Update the generated content of a page AI block.

    Args:
        db: Database session
        block_id: ID of the block to update
        generated_content: AI-generated content

    Returns:
        Dictionary with success status and block object or error details
    """
    try:
        stmt = select(PageAIBlock).where(PageAIBlock.id == block_id).where(PageAIBlock.user_id == user_id)  # type: ignore[arg-type]
        result = await db.execute(stmt)
        block = result.scalar_one_or_none()

        if not block:
            return {"success": False, "error": f"Page AI block with ID {block_id} not found"}

        block.generated_content = generated_content
        block.updated_at = datetime.now(timezone.utc)

        db.add(block)
        await db.commit()
        await db.refresh(block)

        return {"success": True, "block": block}

    except Exception as e:
        await db.rollback()
        log.error(f"Error updating generated content for block {block_id}: {str(e)}")
        return {"success": False, "error": str(e)}


async def get_latest_feedback_for_block(
    db: AsyncSession,
    block_id: UUID4,
    user_id: UUID4,
) -> Optional[str]:
    """
    Get the latest feedback for an AI block from the current user.

    Args:
        db: Database session
        block_id: ID of the AI block
        user_id: ID of the user

    Returns:
        'positive', 'negative', or None if no feedback exists
    """
    try:
        stmt = (
            select(Feedback)  # type: ignore[call-overload]
            .where(Feedback.usage_id == block_id)  # type: ignore[arg-type]
            .where(Feedback.user_id == user_id)  # type: ignore[arg-type]
            .order_by(desc(Feedback.created_at))  # type: ignore[union-attr,arg-type]
            .limit(1)
        )
        result = await db.execute(stmt)
        feedback = result.scalar_one_or_none()

        if feedback:
            return feedback.feedback
        return None
    except Exception as e:
        log.error(f"Error fetching feedback for block {block_id}: {e}")
        return None


async def get_ai_block_config(
    db: AsyncSession,
    block_id: UUID4,
    user_id: UUID4,
) -> Optional[Dict[str, Any]]:
    """
    Get AI block configuration along with user's latest feedback in a single optimized query.

    Args:
        db: Database session
        block_id: ID of the AI block
        user_id: ID of the user

    Returns:
        Dictionary containing block details and feedback, or None if block not found
        {
            "block": PageAIBlock object,
            "feedback": 'positive', 'negative', or None
        }
    """
    try:
        # Single optimized query using LEFT JOIN to fetch both block and feedback
        stmt = (
            select(PageAIBlock, Feedback.feedback)  # type: ignore[call-overload]
            .outerjoin(
                Feedback,
                (Feedback.usage_id == PageAIBlock.id) & (Feedback.user_id == user_id),  # type: ignore[union-attr,arg-type]
            )
            .where(PageAIBlock.id == block_id)  # type: ignore[arg-type]
            .order_by(desc(Feedback.created_at))  # type: ignore[union-attr,arg-type]
            .limit(1)
        )

        result = await db.execute(stmt)
        row = result.first()

        if not row:
            return None

        block, feedback = row
        return {
            "block": block,
            "feedback": feedback,  # Will be None if no feedback exists
        }

    except Exception as e:
        log.error(f"Error retrieving AI block config for {block_id}: {str(e)}")
        return None


async def upsert_page_summary_block(
    db: AsyncSession,
    user_id: UUID4,
    entity_type: str,
    entity_id: UUID4,
    workspace_id: UUID4,
    generated_content: str,
    project_id: Optional[UUID4] = None,
) -> Dict[str, Any]:
    """
    Create or update the page_summary.

    Args:
        db: Database session
        user_id: ID of the user
        entity_type: Type of entity (page, wiki)
        entity_id: ID of the entity (page_id)
        workspace_id: Workspace ID
        generated_content: AI-generated summary to store
        project_id: Optional project ID

    Returns:
        Dictionary with success status and block object or error details
    """
    try:
        # Look up existing page_summary block for this entity (exclude soft-deleted)
        stmt = (
            select(PageAIBlock)
            .where(PageAIBlock.entity_id == entity_id)  # type: ignore[arg-type]
            .where(PageAIBlock.block_type == "page_summary")  # type: ignore[arg-type]
            .where(PageAIBlock.deleted_at.is_(None))  # type: ignore[union-attr]
            .order_by(desc(PageAIBlock.updated_at))  # type: ignore[union-attr,arg-type]
            .limit(1)
        )
        result = await db.execute(stmt)
        existing_block = result.scalar_one_or_none()

        if existing_block:
            # Reuse shared helper — update generated_content only
            return await update_page_ai_block_generated_content(
                db=db,
                block_id=existing_block.id,
                user_id=user_id,
                generated_content=generated_content,
            )

        # No existing block — create one (page_summary is internal, skip validation)
        now = datetime.now(timezone.utc)
        block = PageAIBlock(
            user_id=user_id,
            block_type="page_summary",
            entity_type=entity_type,
            entity_id=entity_id,
            workspace_id=workspace_id,
            project_id=project_id,
            content=None,
            generated_content=generated_content,
            created_at=now,
            updated_at=now,
        )
        db.add(block)
        await db.commit()
        await db.refresh(block)

        return {"success": True, "block": block}

    except Exception as e:
        await db.rollback()
        log.error(f"Error upserting page summary block for entity {entity_id}: {str(e)}")
        return {"success": False, "error": str(e)}


async def get_page_summary_block(
    db: AsyncSession,
    page_id: UUID4,
) -> Optional[PageAIBlock]:
    """
    Retrieve the page_summary AI block for a given page.

    Args:
        db: Database session
        page_id: ID of the page

    Returns:
        PageAIBlock with block_type='page_summary', or None if not found
    """
    try:
        stmt = (
            select(PageAIBlock)
            .where(PageAIBlock.entity_id == page_id)  # type: ignore[arg-type]
            .where(PageAIBlock.block_type == "page_summary")  # type: ignore[arg-type]
            .where(PageAIBlock.deleted_at.is_(None))  # type: ignore[union-attr]
            .order_by(desc(PageAIBlock.updated_at))  # type: ignore[union-attr,arg-type]
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    except Exception as e:
        log.error(f"Error retrieving page summary block for page {page_id}: {str(e)}")
        return None


async def delete_page_summary_block(
    db: AsyncSession,
    page_id: UUID4,
) -> Dict[str, Any]:
    """
    Soft-delete the page_summary AI block for a given page.
    """
    try:
        block = await get_page_summary_block(db, page_id)

        if not block:
            return {"success": False, "error": "No active summary found for this page"}

        block.soft_delete()
        db.add(block)
        await db.commit()

        return {"success": True}

    except Exception as e:
        await db.rollback()
        log.error(f"Error soft-deleting page summary block for page {page_id}: {str(e)}")
        return {"success": False, "error": str(e)}


async def get_page_ai_blocks_by_page_id(
    db: AsyncSession,
    page_id: UUID4,
    user_id: UUID4,
) -> List[Dict[str, Any]]:
    """
    Get all AI blocks for a page with their feedback in a single optimized query.

    Args:
        db: Database session
        page_id: ID of the page
        user_id: ID of the user (for feedback)

    Returns:
        List of dictionaries containing block details and feedback
        [
            {
                "id": block_id,
                "block_type": "custom_prompt",
                "content": "...",
                "has_content": True,
                "feedback": "positive" | "negative" | None,
                "created_at": "...",
                "updated_at": "..."
            },
            ...
        ]
    """
    try:
        # Subquery to get the latest feedback for each block
        feedback_subq = (
            select(  # type: ignore[call-overload]
                Feedback.usage_id,
                Feedback.feedback,
                func.row_number()
                .over(
                    partition_by=Feedback.usage_id,  # type: ignore[arg-type]
                    order_by=desc(Feedback.created_at),  # type: ignore[union-attr,arg-type]
                )
                .label("rn"),
            ).where(Feedback.user_id == user_id)  # type: ignore[arg-type]
        ).subquery()

        # Join with blocks to get the latest feedback for each block
        stmt = (
            select(PageAIBlock, feedback_subq.c.feedback)  # type: ignore[call-overload]
            .outerjoin(
                feedback_subq,
                (PageAIBlock.id == feedback_subq.c.usage_id) & (feedback_subq.c.rn == 1),  # type: ignore[arg-type]
            )
            .where(PageAIBlock.entity_id == page_id)  # type: ignore[arg-type]
            .order_by(desc(PageAIBlock.created_at))  # type: ignore[union-attr,arg-type]
        )

        result = await db.execute(stmt)
        rows = result.all()

        # Format response
        blocks_data = []
        for row in rows:
            block, feedback = row
            blocks_data.append(
                {
                    "block_id": str(block.id),
                    "block_type": block.block_type,
                    "content": block.content,
                    "has_content": has_content_for_block(block.block_type, block.content),
                    "feedback": feedback,  # 'positive', 'negative', or None
                    "created_at": block.created_at.isoformat() if block.created_at else None,
                    "updated_at": block.updated_at.isoformat() if block.updated_at else None,
                }
            )

        return blocks_data

    except Exception as e:
        log.error(f"Error retrieving AI blocks for page {page_id}: {str(e)}")
        return []
