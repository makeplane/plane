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

import uuid
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from sqlmodel import select
from sqlmodel import update
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.models.message_attachment import MessageAttachment
from pi.app.utils.attachments import get_attachment_base64_data

log = logger.getChild(__name__)


async def link_attachments_to_message(
    attachment_ids: List[uuid.UUID], message_id: uuid.UUID, db: AsyncSession, chat_id: Optional[uuid.UUID] = None, user_id: Optional[uuid.UUID] = None
) -> bool:
    """Link pending attachments to a message after message creation"""
    try:
        stmt = (
            update(MessageAttachment)
            .where(
                MessageAttachment.id.in_(attachment_ids),  # type: ignore[attr-defined]
                MessageAttachment.chat_id == chat_id,  # type: ignore[union-attr,arg-type]
                MessageAttachment.user_id == user_id,  # type: ignore[union-attr,arg-type]
                MessageAttachment.status == "uploaded",  # type: ignore[union-attr,arg-type]
                MessageAttachment.message_id.is_(None),  # type: ignore[union-attr]
            )
            .values(message_id=message_id)
        )

        await db.execute(stmt)
        await db.commit()
        return True

    except Exception:
        await db.rollback()
        return False


async def get_attachments_for_message(message_id: uuid.UUID, chat_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> List[MessageAttachment]:
    try:
        stmt = select(MessageAttachment).where(
            MessageAttachment.message_id == message_id,
            MessageAttachment.chat_id == chat_id,
            MessageAttachment.user_id == user_id,
            MessageAttachment.status == "uploaded",
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        log.error(f"Error fetching attachments for message {message_id}: {e}")
        await db.rollback()
        return []


async def get_attachments_with_base64_data(
    attachment_ids: List[uuid.UUID], chat_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
) -> List[Dict[str, Any]]:
    attachments_data = []

    try:
        stmt = select(MessageAttachment).where(
            MessageAttachment.id.in_(attachment_ids),  # type: ignore[attr-defined]
            MessageAttachment.chat_id == chat_id,
            MessageAttachment.user_id == user_id,
            MessageAttachment.status == "uploaded",
        )
        result = await db.execute(stmt)
        attachments = list(result.scalars().all())

        for attachment in attachments:
            base64_data = await get_attachment_base64_data(attachment)
            if base64_data:
                attachments_data.append(
                    {
                        "id": str(attachment.id),
                        "filename": attachment.original_filename,
                        "content_type": attachment.content_type,
                        "file_type": attachment.file_type,
                        "file_size": attachment.file_size,
                        "base64_data": base64_data,
                        "is_image": attachment.is_image,
                        "is_pdf": attachment.is_pdf,
                    }
                )
            else:
                log.warning(f"Failed to get base64 data for attachment {attachment.id}")

    except Exception as e:
        log.error(f"Error fetching attachments with base64 data: {e}")

    return attachments_data
