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

import asyncpg.exceptions
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
    async def create_pool(cls, min_size: int = 5, max_size: int = 10, force_refresh: bool = False) -> None:
        """Initialize a new connection pool with given min/max connections."""
        if cls._pool is None:
            try:
                log.info("Initializing async connection pool to the follower PostgreSQL database.")
                cls._pool = await create_pool(
                    dsn=settings.follower_connection_url(force_refresh=force_refresh),
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

        try:
            async with cls._pool.acquire() as conn:
                await conn.execute(query, *params if params else ())
                return "OK"
        except asyncpg.exceptions.InvalidPasswordError:
            log.warning("Authentication failure on follower async pool — refreshing credentials and retrying.")
            await cls.close_pool()
            await cls.create_pool(force_refresh=True)
            async with cls._pool.acquire() as conn:  # type: ignore[union-attr]
                await conn.execute(query, *params if params else ())
                return "OK"

    @classmethod
    async def fetch(cls, query: str, params: SQLParams = None) -> List[Dict[str, Any]]:
        """Execute a query and return all results."""
        if not cls._pool:
            await cls.create_pool()
        if cls._pool is None:
            raise RuntimeError("Database pool not initialized")

        try:
            async with cls._pool.acquire() as conn:
                records = await conn.fetch(query, *params if params else ())
                return [dict(r) for r in records]
        except asyncpg.exceptions.InvalidPasswordError:
            log.warning("Authentication failure on follower async pool — refreshing credentials and retrying.")
            await cls.close_pool()
            await cls.create_pool(force_refresh=True)
            async with cls._pool.acquire() as conn:  # type: ignore[union-attr]
                records = await conn.fetch(query, *params if params else ())
                return [dict(r) for r in records]

    @classmethod
    async def fetchrow(cls, query: str, params: SQLParams = None) -> Optional[Dict[str, Any]]:
        """Execute a query and return the first row."""
        if not cls._pool:
            await cls.create_pool()
        if cls._pool is None:
            raise RuntimeError("Database pool not initialized")

        try:
            async with cls._pool.acquire() as conn:
                record = await conn.fetchrow(query, *params if params else ())
                return dict(record) if record else None
        except asyncpg.exceptions.InvalidPasswordError:
            log.warning("Authentication failure on follower async pool — refreshing credentials and retrying.")
            await cls.close_pool()
            await cls.create_pool(force_refresh=True)
            async with cls._pool.acquire() as conn:  # type: ignore[union-attr]
                record = await conn.fetchrow(query, *params if params else ())
                return dict(record) if record else None

    @classmethod
    async def fetch_many(cls, queries: Sequence[Tuple[str, Optional[SQLParams]]]) -> List[QueryResult]:
        """Execute multiple queries concurrently and return results for each."""

        async def _run_all(pool: Pool) -> List[Union[QueryResult, BaseException]]:
            async def _execute_single(query: str, params: SQLParams) -> QueryResult:
                async with pool.acquire() as conn:
                    records = await conn.fetch(query, *params if params else ())
                    return [dict(r) for r in records]

            tasks = [_execute_single(query, params) for query, params in queries]
            return await asyncio.gather(*tasks, return_exceptions=True)

        try:
            pool = await cls.get_pool()
            results = await _run_all(pool)
        except asyncpg.exceptions.InvalidPasswordError:
            log.warning("Authentication failure on follower async pool — refreshing credentials and retrying.")
            await cls.close_pool()
            await cls.create_pool(force_refresh=True)
            pool = await cls.get_pool()
            results = await _run_all(pool)

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

        def _run(url: str) -> Optional[Dict[str, Any]]:
            conn = psycopg2.connect(url)
            try:
                with conn.cursor() as cur:
                    cur.execute(query, params if params else ())
                    row = cur.fetchone()
                    if row:
                        columns = [desc[0] for desc in cur.description]
                        return dict(zip(columns, row))
                    return None
            finally:
                conn.close()

        try:
            log.info("Establishing synchronous connection to the follower PostgreSQL database.")
            return _run(settings.follower_connection_url())
        except psycopg2.OperationalError as e:
            if "password authentication failed" in str(e).lower():
                log.warning("Authentication failure on follower sync DB — refreshing credentials and retrying.")
                return _run(settings.follower_connection_url(force_refresh=True))
            raise
        except Exception as e:
            log.error(f"Error executing sync query: {e}")
            return None

    @classmethod
    def fetch(cls, query: str, params: SQLParams = None) -> List[Dict[str, Any]]:
        """Execute a query and return all results (synchronous)."""

        def _run(url: str) -> List[Dict[str, Any]]:
            conn = psycopg2.connect(url)
            try:
                with conn.cursor() as cur:
                    cur.execute(query, params if params else ())
                    rows = cur.fetchall()
                    if rows:
                        columns = [desc[0] for desc in cur.description]
                        return [dict(zip(columns, row)) for row in rows]
                    return []
            finally:
                conn.close()

        try:
            log.info("Establishing synchronous connection to the follower PostgreSQL database.")
            return _run(settings.follower_connection_url())
        except psycopg2.OperationalError as e:
            if "password authentication failed" in str(e).lower():
                log.warning("Authentication failure on follower sync DB — refreshing credentials and retrying.")
                return _run(settings.follower_connection_url(force_refresh=True))
            raise
        except Exception as e:
            log.error(f"Error executing sync query: {e}")
            return []
