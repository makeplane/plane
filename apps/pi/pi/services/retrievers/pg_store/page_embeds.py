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

"""Database operations for page_utility_embeds table."""

import uuid
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from pydantic import UUID4
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.models.pages import PageUtilityEmbed

log = logger.getChild(__name__)


async def create_page_embed(
    db: AsyncSession,
    entity_type: str,
    entity_id: UUID4,
    workspace_id: UUID4,
    chat_id: UUID4,
    embed_type: str,
    payload: Dict[str, Any],
    message_id: Optional[UUID4] = None,
    sub_type: Optional[str] = None,
    title: Optional[str] = None,
    project_id: Optional[UUID4] = None,
) -> Optional[PageUtilityEmbed]:
    """
    Persist a single embed payload extracted from a chat response.

    Returns the created PageUtilityEmbed or None on failure.
    """
    try:
        embed = PageUtilityEmbed(
            embed_id=uuid.uuid4(),
            embed_type=embed_type,
            sub_type=sub_type,
            entity_type=entity_type,
            entity_id=entity_id,
            workspace_id=workspace_id,
            project_id=project_id,
            chat_id=chat_id,
            message_id=message_id,
            title=title,
            payload=payload,
        )
        db.add(embed)
        await db.commit()
        await db.refresh(embed)
        return embed
    except Exception as e:
        await db.rollback()
        log.error(f"Error creating page embed: {e}")
        return None


async def bulk_create_page_embeds(
    db: AsyncSession,
    embeds: List[Dict[str, Any]],
) -> List[PageUtilityEmbed]:
    """
    Persist multiple embed payloads in a single transaction.

    Each dict in *embeds* must contain the fields accepted by the
    PageUtilityEmbed constructor.  If ``embed_id`` is present it is used
    as-is (to match the placeholder already written into the page
    document); otherwise a new UUID is generated.

    Returns the list of persisted PageUtilityEmbed objects.
    """
    if not embeds:
        return []

    try:
        models = []
        for embed_data in embeds:
            if "embed_id" not in embed_data:
                embed_data["embed_id"] = uuid.uuid4()
            embed = PageUtilityEmbed(**embed_data)
            models.append(embed)
            db.add(embed)

        await db.commit()
        for m in models:
            await db.refresh(m)
        return models
    except Exception as e:
        await db.rollback()
        log.error(f"Error bulk creating page embeds: {e}")
        return []


async def get_page_embed_by_embed_id(
    db: AsyncSession,
    embed_id: UUID4,
) -> Optional[PageUtilityEmbed]:
    """Fetch a single embed by its public embed_id."""
    try:
        stmt = select(PageUtilityEmbed).where(PageUtilityEmbed.embed_id == embed_id)  # type: ignore[arg-type]
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    except Exception as e:
        log.error(f"Error fetching page embed {embed_id}: {e}")
        return None
