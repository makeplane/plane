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

# models/base.py
import uuid
from datetime import datetime
from datetime import timezone
from typing import Optional

from sqlalchemy import TIMESTAMP
from sqlalchemy import event
from sqlmodel import Field
from sqlmodel import Session
from sqlmodel import SQLModel
from sqlmodel import select

from pi.core.context import get_current_user_context


def get_current_time() -> datetime:
    return datetime.now(timezone.utc)


def utc_now() -> datetime:
    return get_current_time()


class UUIDModel(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)


class TimeAuditModel(SQLModel):
    created_at: datetime = Field(
        default_factory=lambda: get_current_time(),
        sa_type=TIMESTAMP(timezone=True),
        sa_column_kwargs={"nullable": False, "default": utc_now, "name": "created_at"},
    )
    updated_at: datetime = Field(
        default_factory=lambda: get_current_time(),
        sa_type=TIMESTAMP(timezone=True),
        sa_column_kwargs={"nullable": False, "default": utc_now, "onupdate": utc_now, "name": "updated_at"},
    )


class UserAuditModel(SQLModel):
    created_by_id: Optional[uuid.UUID] = Field(default=None, nullable=True)
    updated_by_id: Optional[uuid.UUID] = Field(default=None, nullable=True)


class SoftDeleteModel(SQLModel):
    deleted_at: Optional[datetime] = Field(
        default=None,
        sa_type=TIMESTAMP(timezone=True),
        sa_column_kwargs={"nullable": True, "default": None, "name": "deleted_at"},
    )

    def soft_delete(self) -> None:
        self.deleted_at = get_current_time()

    @classmethod
    def objects(cls, *sub_queries):
        base_query = select(cls).where(cls.deleted_at.is_(None))
        if sub_queries:
            base_query = select(cls, *sub_queries).where(cls.deleted_at.is_(None))
        return base_query


class BaseModel(UUIDModel, TimeAuditModel, UserAuditModel, SoftDeleteModel):
    pass


@event.listens_for(Session, "before_flush")
def set_user_audit_fields(session, flush_context, instances):
    """
    Automatically populate created_by_id and updated_by_id audit fields.

    Gets the current user from session.info (set by get_async_session/get_streaming_db_session)
    or falls back to the request context (set by authentication dependencies).
    """
    # Try session.info first (primary source - set by db session factories)
    current_user = session.info.get("current_user")

    # Fallback to context variable (backup if session.info wasn't set)
    if not current_user:
        current_user = get_current_user_context()

    if not current_user:
        return

    for instance in session.new:
        if isinstance(instance, UserAuditModel):
            instance.created_by_id = current_user.id
            instance.updated_by_id = current_user.id
    for instance in session.dirty:
        if isinstance(instance, UserAuditModel):
            instance.updated_by_id = current_user.id
