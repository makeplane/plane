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

from typing import AsyncGenerator
from typing import Generator
from typing import Optional

from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.config import settings
from pi.core.context import get_current_user_context

log = logger.getChild(__name__)

# Store the engines in module scope (but initialize in lifespan/on-demand)
_async_engine = None
_sync_engine = None


async def init_async_db(app: Optional[FastAPI] = None):
    """Initialize the async database engine."""
    global _async_engine

    log.info("Initializing async database engine...")
    _async_engine = create_async_engine(settings.database.async_connection_url(), pool_pre_ping=True, echo=False, future=True)

    # Store engine in app state if FastAPI app is provided
    if app:
        app.state.async_engine = _async_engine

    log.info("Async database engine initialized.")
    return _async_engine


async def close_async_db(app: Optional[FastAPI] = None):
    """Close the async database engine."""
    global _async_engine

    if _async_engine is None:
        return

    log.info("Disposing async database engine...")
    await _async_engine.dispose()
    _async_engine = None
    log.info("Async database engine disposed.")


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Get an async database session with current user context injected.

    The current user is automatically retrieved from the request context
    (set by authentication dependencies) and injected into session.info
    for use by the UserAuditModel event listener.
    """
    global _async_engine

    if _async_engine is None:
        raise RuntimeError("Database engine not initialized. Call init_async_db first.")

    async_session = sessionmaker(_async_engine, class_=AsyncSession, expire_on_commit=False)  # type: ignore[call-overload]

    async with async_session() as session:
        # Inject current user from context into session for audit fields
        current_user = get_current_user_context()
        if current_user:
            session.info["current_user"] = current_user
        yield session


class _UserAwareSession:
    """Context manager wrapper that injects current user into session.info."""

    def __init__(self, session: AsyncSession):
        self._session = session

    async def __aenter__(self) -> AsyncSession:
        # Inject current user from context into session for audit fields
        current_user = get_current_user_context()
        if current_user:
            self._session.info["current_user"] = current_user
        return self._session

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self._session.close()
        return False


def get_streaming_db_session():
    """Get a short-lived async database session for streaming DB writes.

    Returns a context manager that yields an AsyncSession with current user
    context injected for audit fields.

    Usage:
        async with get_streaming_db_session() as db:
            await upsert_message_flow_steps(..., db=db)
    """
    global _async_engine

    if _async_engine is None:
        raise RuntimeError("Database engine not initialized. Call init_async_db first.")

    async_session_factory = sessionmaker(_async_engine, class_=AsyncSession, expire_on_commit=False)  # type: ignore[call-overload]
    session = async_session_factory()
    return _UserAwareSession(session)


def init_sync_db():
    """Initialize the sync database engine (lazy initialization)."""
    global _sync_engine

    log.info("Initializing sync database engine...")
    from sqlmodel import create_engine

    _sync_engine = create_engine(settings.database.connection_url(), pool_pre_ping=True, echo=False)

    log.info("Sync database engine initialized.")
    return _sync_engine


def close_sync_db():
    """Close the sync database engine."""
    global _sync_engine

    if _sync_engine is None:
        return

    log.info("Disposing sync database engine...")
    _sync_engine.dispose()
    _sync_engine = None
    log.info("Sync database engine disposed.")


def get_sync_session() -> Generator[Session, None, None]:
    """
    Get a sync database session.

    Usage:
        for session in get_sync_session():
            # use session
            break

    Or with context manager pattern:
        with next(get_sync_session()) as session:
            # use session
    """
    if _sync_engine is None:
        init_sync_db()

    sync_session_factory = sessionmaker(_sync_engine, class_=Session, expire_on_commit=False)

    with sync_session_factory() as session:
        yield session
