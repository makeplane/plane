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

# flake8: noqa
import asyncio
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Sequence
from typing import Tuple
from typing import TypeVar
from typing import Union

import psycopg2
from asyncpg import create_pool
from asyncpg.pool import Pool

from pi import logger
from pi import settings

log = logger.getChild(__name__)


# Define a type for the SQL parameters
SQLParams = Union[tuple[Any, ...], None]

T = TypeVar("T")
DataItem = Dict[str, Any]
QueryResult = List[DataItem]


class PlaneDBPool:
    """Async connection pool for PostgreSQL database access."""

    _pool: Optional[Pool] = None

    @classmethod
    async def create_pool(cls, min_size: int = 5, max_size: int = 10) -> None:
        """Initialize a new connection pool with given min/max connections."""
        if cls._pool is None:
            try:
                cls._pool = await create_pool(
                    dsn=settings.FOLLOWER_POSTGRES_URI,
                    min_size=min_size,
                    max_size=max_size,
                    command_timeout=60,
                    server_settings={"application_name": "plane_db"},
                )
            except Exception as e:
                print(f"Failed to create database connection pool: {e}")
                raise

    @classmethod
    async def close_pool(cls) -> None:
        """Close all connections in the pool."""
        if cls._pool:
            await cls._pool.close()
            cls._pool = None

    @classmethod
    async def get_pool(cls) -> Pool:
        """Get initialized pool or raise error"""
        if not cls._pool:
            await cls.create_pool()
        if not cls._pool:
            raise RuntimeError("Failed to initialize database pool")
        return cls._pool

    @classmethod
    async def execute(cls, query: str, params: SQLParams = None) -> str:
        """Execute a SQL command and return status."""
        if not cls._pool:
            await cls.create_pool()
        assert cls._pool is not None  # Tell mypy pool exists

        async with cls._pool.acquire() as conn:
            await conn.execute(query, *params if params else ())
            return "OK"

    @classmethod
    async def fetch(cls, query: str, params: SQLParams = None) -> List[Dict[str, Any]]:
        """Execute a query and return all results."""
        if not cls._pool:
            await cls.create_pool()
        if cls._pool is None:
            raise RuntimeError("Database pool not initialized")

        async with cls._pool.acquire() as conn:
            records = await conn.fetch(query, *params if params else ())
            return [dict(r) for r in records]

    @classmethod
    async def fetchrow(cls, query: str, params: SQLParams = None) -> Optional[Dict[str, Any]]:
        """Execute a query and return the first row."""
        if not cls._pool:
            await cls.create_pool()
        if cls._pool is None:
            raise RuntimeError("Database pool not initialized")

        async with cls._pool.acquire() as conn:
            record = await conn.fetchrow(query, *params if params else ())
            return dict(record) if record else None

    @classmethod
    async def fetch_many(cls, queries: Sequence[Tuple[str, Optional[SQLParams]]]) -> List[QueryResult]:
        """Execute multiple queries concurrently and return results for each."""
        pool = await cls.get_pool()

        async def _execute_single(query: str, params: SQLParams) -> QueryResult:
            async with pool.acquire() as conn:
                records = await conn.fetch(query, *params if params else ())
                return [dict(r) for r in records]

        tasks = [_execute_single(query, params) for query, params in queries]
        results: List[Union[QueryResult, BaseException]] = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out exceptions and narrow type
        valid_results: List[QueryResult] = []
        for r in results:
            if not isinstance(r, BaseException):
                valid_results.append(r)
            else:
                log.error(f"Query failed: {r}")

        return valid_results


class PlaneDBSync:
    """Synchronous connection helper for Plane PostgreSQL database."""

    @classmethod
    def fetchrow(cls, query: str, params: SQLParams = None) -> Optional[Dict[str, Any]]:
        """Execute a query and return the first row (synchronous)."""
        try:
            conn = psycopg2.connect(settings.FOLLOWER_POSTGRES_URI)
            try:
                with conn.cursor() as cur:
                    cur.execute(query, params if params else ())
                    row = cur.fetchone()
                    if row:
                        # Get column names from cursor description
                        columns = [desc[0] for desc in cur.description]
                        return dict(zip(columns, row))
                    return None
            finally:
                conn.close()
        except Exception as e:
            log.error(f"Error executing sync query: {e}")
            return None

    @classmethod
    def fetch(cls, query: str, params: SQLParams = None) -> List[Dict[str, Any]]:
        """Execute a query and return all results (synchronous)."""
        try:
            conn = psycopg2.connect(settings.FOLLOWER_POSTGRES_URI)
            try:
                with conn.cursor() as cur:
                    cur.execute(query, params if params else ())
                    rows = cur.fetchall()
                    if rows:
                        # Get column names from cursor description
                        columns = [desc[0] for desc in cur.description]
                        return [dict(zip(columns, row)) for row in rows]
                    return []
            finally:
                conn.close()
        except Exception as e:
            log.error(f"Error executing sync query: {e}")
            return []
