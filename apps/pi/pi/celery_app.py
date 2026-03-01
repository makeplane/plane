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

"""
Celery application configuration and task definitions for Plane AI.

Database Connection Management:
- Uses shared async engine per worker process to eliminate connection churn
- Increased connection pool sizes for high-throughput workloads
- Proper error handling for job status updates with alerting-ready logging
- Automatic engine cleanup on worker shutdown to prevent connection leaks
"""

import asyncio
import os
import time
from contextlib import contextmanager
from datetime import datetime
from datetime import timedelta
from typing import Any
from typing import Dict
from uuid import UUID

from celery import Celery
from celery.signals import worker_process_init
from celery.signals import worker_process_shutdown
from celery.signals import worker_ready
from kombu import Exchange
from kombu import Queue
from sqlalchemy import and_
from sqlalchemy import desc
from sqlalchemy import func
from sqlalchemy import join
from sqlmodel import Session
from sqlmodel import select

# Initialize module-level logger early so it's available for conditional beat config
from pi import logger
from pi.app.models.chat import Chat
from pi.app.models.message import Message

log = logger.getChild(__name__)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from pi import settings
from pi.app.models.workspace_vectorization import VectorizationStatus
from pi.app.models.workspace_vectorization import WorkspaceVectorization
from pi.core.vectordb.client import VectorStore
from pi.services.dupes.dupes_tracker import DupesTracker
from pi.services.retrievers.vdb_store.chat_search import mark_chat_deleted
from pi.services.retrievers.vdb_store.chat_search import process_chat_and_messages_from_token
from pi.services.retrievers.vdb_store.chat_search import update_chat_title_and_propagate


# Circuit breaker state
class CircuitBreaker:
    """Simple circuit breaker for database connections."""

    def __init__(self, failure_threshold: int = 5, timeout: float = 60.0):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time: float | None = None
        self.is_open = False

    def record_success(self):
        """Record a successful operation."""
        self.failure_count = 0
        self.is_open = False
        self.last_failure_time = None

    def record_failure(self):
        """Record a failed operation."""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.is_open = True
            log.warning(
                "Circuit breaker opened after %d failures. Will retry after %d seconds.",
                self.failure_count,
                self.timeout,
            )

    def can_attempt(self) -> bool:
        """Check if we can attempt an operation."""
        if not self.is_open:
            return True

        # Check if timeout has passed
        if self.last_failure_time and (time.time() - self.last_failure_time) > self.timeout:
            log.info("Circuit breaker timeout expired. Attempting reset.")
            self.is_open = False
            self.failure_count = 0
            return True

        return False

    def __str__(self) -> str:
        return f"CircuitBreaker(open={self.is_open}, failures={self.failure_count})"


# Global circuit breaker instance
_db_circuit_breaker = CircuitBreaker(
    failure_threshold=int(5),
    timeout=float(60),
)

# Create Celery app instance
# Note: No result backend - tasks run asynchronously but progress is tracked via logs only
celery_app = Celery(
    "plane_pi",
    broker=settings.celery.BROKER_URL,
    task_track_started=True,
    include=["pi.celery_app"],  # Include this module for task discovery
)

# Configure Celery
celery_app.conf.update(
    task_serializer=settings.celery.TASK_SERIALIZER,
    result_serializer=settings.celery.RESULT_SERIALIZER,
    accept_content=settings.celery.ACCEPT_CONTENT,
    timezone=settings.celery.TIMEZONE,
    enable_utc=settings.celery.ENABLE_UTC,
    task_track_started=True,
    task_time_limit=180 * 60,  # 3 hours
    task_soft_time_limit=120 * 60,  # 2 hours
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    result_backend=None,
    task_ignore_result=True,
)
celery_app.conf.task_default_queue = settings.celery.DEFAULT_QUEUE
celery_app.conf.task_default_exchange = settings.celery.DEFAULT_EXCHANGE
celery_app.conf.task_default_routing_key = settings.celery.DEFAULT_ROUTING_KEY

celery_app.conf.task_queues = [
    Queue(
        name=settings.celery.DEFAULT_QUEUE,
        exchange=Exchange(settings.celery.DEFAULT_EXCHANGE, type="direct"),
        routing_key=settings.celery.DEFAULT_ROUTING_KEY,
        durable=True,
    )
]
# Configure periodic tasks using Celery Beat
# The vector-sync job can be turned off completely by setting the
# environment variable `CELERY_VECTOR_SYNC_ENABLED=0` (or "false").
# This is useful when running one-off heavy back-fill jobs that already
# saturate the ML model capacity.

# Initialize beat schedule
celery_app.conf.beat_schedule = {}

# Add vector sync task if enabled
if settings.celery.VECTOR_SYNC_ENABLED and settings.celery.VECTOR_SYNC_INTERVAL > 0:
    celery_app.conf.beat_schedule["trigger-live-sync"] = {
        "task": "pi.celery_app.trigger_live_sync",
        "schedule": float(settings.celery.VECTOR_SYNC_INTERVAL),  # Run every N seconds
        "options": {"expires": settings.celery.VECTOR_SYNC_INTERVAL * 2},  # Expire if not processed within 2 intervals
    }
else:
    log.info("Celery vector-sync beat schedule disabled (CELERY_VECTOR_SYNC_ENABLED=%s)", settings.celery.VECTOR_SYNC_ENABLED)

# Add docs sync task if enabled
if settings.celery.DOCS_VECTORIZATION_ENABLED and settings.celery.DOCS_VECTORIZATION_INTERVAL > 0:
    celery_app.conf.beat_schedule["sync-docs-periodic"] = {
        "task": "pi.celery_app.sync_docs_periodic_task",
        "schedule": float(settings.celery.DOCS_VECTORIZATION_INTERVAL),  # Run every N seconds (default: 24 hours)
        "options": {"expires": settings.celery.DOCS_VECTORIZATION_INTERVAL * 2},  # Expire if not processed within 2 intervals
    }
    log.info(
        "Celery docs sync beat schedule enabled (interval: %d seconds)",
        settings.celery.DOCS_VECTORIZATION_INTERVAL,
    )
else:
    log.info("Celery docs sync beat schedule disabled (CELERY_DOCS_SYNC_ENABLED=%s)", settings.celery.DOCS_VECTORIZATION_ENABLED)


# Event loop utilities are no longer needed because all operations are synchronous.

# ─────────────────── Database Helper Functions ─────────────────────

# Module-level engine storage for worker processes
_worker_engine = None
_worker_session_maker = None


def _get_worker_engine():
    """Get or create the worker-level async engine."""
    global _worker_engine, _worker_session_maker

    # Check circuit breaker first
    if not _db_circuit_breaker.can_attempt():
        raise RuntimeError(f"Database circuit breaker is open. Too many connection failures. " f"Will retry after timeout. {_db_circuit_breaker}")

    if _worker_engine is None:
        log.info("Creating worker-level database engine")
        try:
            _worker_engine = create_engine(
                settings.database.connection_url(),
                pool_pre_ping=True,
                echo=False,
                # Connection pool settings optimized for Celery workers
                # With prefork, each process gets its own pool
                pool_size=settings.database.CELERY_POOL_SIZE,  # Base connections per worker process
                max_overflow=settings.database.CELERY_POOL_MAX_OVERFLOW,  # Additional connections for burst traffic
                pool_timeout=settings.database.CELERY_POOL_TIMEOUT,  # Fail fast if can't get connection
                pool_recycle=settings.database.CELERY_POOL_RECYCLE,  # Recycle connections after N seconds
            )
            _worker_session_maker = sessionmaker(_worker_engine, class_=Session, expire_on_commit=False)
            log.info(
                "Worker-level async database engine created with pool_size=%d, max_overflow=%d, timeout=%d",
                settings.database.CELERY_POOL_SIZE,
                settings.database.CELERY_POOL_MAX_OVERFLOW,
                settings.database.CELERY_POOL_TIMEOUT,
            )
        except Exception as e:
            _db_circuit_breaker.record_failure()
            log.error("Failed to create database engine: %s", e)
            raise

    return _worker_engine, _worker_session_maker


def _cleanup_worker_engine():
    """Clean up the worker-level database engine."""
    global _worker_engine, _worker_session_maker

    if _worker_engine is not None:
        log.info("Disposing worker-level database engine")
        try:
            _worker_engine.dispose()
        except Exception as exc:
            log.warning("Error disposing engine: %s", exc)
        _worker_engine = None
        _worker_session_maker = None
        log.info("Worker-level database engine disposed")


@contextmanager
def db_session():
    """
    Context manager for database sessions in Celery tasks.

    Uses a shared worker-level database engine to avoid connection churn.
    Includes circuit breaker protection against database failures.
    """
    # Check circuit breaker before attempting connection
    if not _db_circuit_breaker.can_attempt():
        raise RuntimeError(f"Database circuit breaker is open. Too many connection failures. Will retry after timeout. {_db_circuit_breaker}")

    try:
        _, session_maker = _get_worker_engine()

        if session_maker is None:
            raise RuntimeError("Failed to initialize database session maker")

        with session_maker() as session:
            yield session
            # If we get here without exception, the operation was successful
            _db_circuit_breaker.record_success()

    except Exception as e:
        # Record failure in circuit breaker
        _db_circuit_breaker.record_failure()
        log.error("Database operation failed: %s. Circuit breaker state: %s", e, _db_circuit_breaker)
        raise


class JobStatusUpdateError(Exception):
    """Raised when job status update fails after all retries."""

    pass


def update_job_status(
    job_id: UUID,
    status: VectorizationStatus,
    progress_pct: int | None = None,
    error: str | None = None,
    max_retries: int = 3,
) -> None:
    """
    Update the status of a vectorization job directly in the database.

    Args:
        job_id: UUID of the job to update
        status: New status for the job
        progress_pct: Optional progress percentage
        error: Optional error message
        max_retries: Maximum number of retry attempts for database operations

    Raises:
        JobStatusUpdateError: If all retry attempts fail
    """
    last_exception = None

    for attempt in range(max_retries):
        try:
            with db_session() as session:
                stmt = select(WorkspaceVectorization).where(WorkspaceVectorization.id == job_id)
                job = session.exec(stmt).first()

                if not job:
                    log.warning("Job %s not found for status update", job_id)
                    return

                # Update job status
                job.status = status

                if progress_pct is not None:
                    job.progress_pct = progress_pct

                if error is not None:
                    job.last_error = error

                # Update timestamps based on status
                now = datetime.utcnow()
                if status == VectorizationStatus.running and not job.started_at:
                    job.started_at = now
                elif status in [VectorizationStatus.success, VectorizationStatus.failed]:
                    job.finished_at = now
                    if status == VectorizationStatus.success:
                        job.progress_pct = 100

                session.commit()
                log.debug("Updated job %s: status=%s, progress=%s", job_id, status.value, progress_pct)
                return  # Success, exit retry loop

        except Exception as exc:
            last_exception = exc
            log.error("Attempt %d/%d failed to update job status for %s: %s", attempt + 1, max_retries, job_id, exc)
            if attempt == max_retries - 1:
                # Final attempt failed - log critical error and raise
                log.critical(
                    "CRITICAL: Failed to update job status for %s after %d attempts. "
                    "Job may be stuck in inconsistent state. Manual intervention may be required.",
                    job_id,
                    max_retries,
                )
                raise JobStatusUpdateError(f"Failed to update job {job_id} status after {max_retries} attempts: {exc}") from last_exception
            # Wait before retrying (exponential backoff)
            time.sleep(2**attempt)


def get_eligible_workspaces() -> list[str]:
    """
    Get list of workspace IDs eligible for live sync.

    Returns:
        List of workspace IDs that have status='success' and live_sync_enabled=True.
        Returns empty list if database query fails.
    """
    try:
        with db_session() as session:
            # Get latest record per workspace_id where status='success' and live_sync_enabled=True
            subquery = (
                select(WorkspaceVectorization.workspace_id, func.max(WorkspaceVectorization.created_at).label("latest_created_at"))
                .group_by(WorkspaceVectorization.workspace_id)
                .subquery()
            )

            stmt = (
                select(WorkspaceVectorization.workspace_id)
                .select_from(
                    join(
                        WorkspaceVectorization,
                        subquery,
                        (WorkspaceVectorization.workspace_id == subquery.c.workspace_id)
                        & (WorkspaceVectorization.created_at == subquery.c.latest_created_at),  # type: ignore[arg-type]
                    )
                )
                .where(
                    WorkspaceVectorization.status == VectorizationStatus.success,
                    WorkspaceVectorization.live_sync_enabled,
                )
            )

            result = session.exec(stmt)
            workspaces = list(result.all())
            log.debug("Found %d eligible workspaces for live sync", len(workspaces))
            return workspaces
    except Exception as exc:
        log.error("Failed to get eligible workspaces: %s", exc)
        return []


async def get_pro_business_workspaces_needing_feed() -> list[str]:
    """
    Get list of Pro/Business workspace IDs that need initial vectorization feed.

    Two-step approach:
    1. Query Plane follower DB for Pro/Business workspaces (workspace_licenses table)
    2. Check PI DB to exclude workspaces that already have successful vectorization

    Returns:
        List of workspace IDs that are Pro/Business plan but don't have successful vectorization.
        Returns empty list if database query fails.
    """
    try:
        from pi.app.api.v1.helpers.plane_sql_queries import get_pro_business_workspaces

        # Step 1: Get all Pro/Business workspaces from Plane DB
        pro_business_workspace_ids: list[str] = await get_pro_business_workspaces()

        if not pro_business_workspace_ids:
            log.info("No Pro/Business workspaces found in Plane database")
            return []

        # Step 2: Check PI database to exclude workspaces that already have successful vectorization
        with db_session() as session:
            # Get workspace IDs that have successful vectorization (latest record only)
            # Use a subquery to get the latest record per workspace_id
            subquery = (
                select(WorkspaceVectorization.workspace_id, func.max(WorkspaceVectorization.created_at).label("latest_created_at"))
                .where(WorkspaceVectorization.workspace_id.in_(pro_business_workspace_ids))  # type: ignore[attr-defined]
                .group_by(WorkspaceVectorization.workspace_id)
                .subquery()
            )

            stmt = (
                select(WorkspaceVectorization.workspace_id)
                .select_from(
                    join(
                        WorkspaceVectorization,
                        subquery,
                        (WorkspaceVectorization.workspace_id == subquery.c.workspace_id)
                        & (WorkspaceVectorization.created_at == subquery.c.latest_created_at),  # type: ignore[arg-type]
                    )
                )
                .where(WorkspaceVectorization.status == VectorizationStatus.success)
            )

            result = session.exec(stmt)
            already_vectorized = set(result.all())

            # Return workspaces that need vectorization
            needs_feed = [ws_id for ws_id in pro_business_workspace_ids if ws_id not in already_vectorized]

            log.debug(
                "Found %d Pro/Business workspaces needing initial vectorization (excluded %d already vectorized)",
                len(needs_feed),
                len(already_vectorized),
            )
            return needs_feed

    except Exception as exc:
        log.error("Failed to get Pro/Business workspaces needing feed: %s", exc)
        return []


async def disable_live_sync_for_non_pro_workspaces() -> dict[str, int | list[str] | str | None]:
    """
    Disable live sync and remove vector data for workspaces that are no longer Pro/Business.

    Approach: Start from our DB (workspaces with live_sync_enabled=True)
    and check if they're now FREE plan. For downgraded workspaces, queue
    a removal task to clear their vector embeddings.

    Returns:
        Dictionary with counts of processed workspaces and task info
    """
    try:
        from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_plans_batch

        checked_count = 0
        downgraded_workspaces = []

        with db_session() as session:
            # Get all workspaces that currently have live sync enabled (latest records only)
            subquery = (
                select(WorkspaceVectorization.workspace_id, func.max(WorkspaceVectorization.created_at).label("latest_created_at"))
                .group_by(WorkspaceVectorization.workspace_id)
                .subquery()
            )

            stmt = (
                select(WorkspaceVectorization)
                .select_from(
                    join(
                        WorkspaceVectorization,
                        subquery,
                        (WorkspaceVectorization.workspace_id == subquery.c.workspace_id)
                        & (WorkspaceVectorization.created_at == subquery.c.latest_created_at),  # type: ignore[arg-type]
                    )
                )
                .where(WorkspaceVectorization.live_sync_enabled)
            )

            workspaces_with_live_sync = session.exec(stmt).all()

            if not workspaces_with_live_sync:
                log.debug("No workspaces with live sync enabled found")
                return {"checked": 0, "downgraded": 0, "task_id": None}

            log.debug("Found %d workspaces with live sync enabled", len(workspaces_with_live_sync))

            # Get all workspace plans in a single batch query (avoid N+1)
            workspace_ids = [ws.workspace_id for ws in workspaces_with_live_sync]
            workspace_plans = await get_workspace_plans_batch(workspace_ids)

            # Check each workspace's current plan
            for workspace in workspaces_with_live_sync:
                checked_count += 1
                current_plan = workspace_plans.get(workspace.workspace_id)

                # If workspace is now FREE (or plan not found), mark for removal
                if current_plan == "FREE" or current_plan is None:
                    downgraded_workspaces.append(workspace.workspace_id)
                    log.info("Workspace %s downgraded to FREE - will remove vector data", workspace.workspace_id)

        # Queue removal task for downgraded workspaces
        task_id = None
        if downgraded_workspaces:
            log.info("Queueing vector data removal for %d downgraded workspaces", len(downgraded_workspaces))
            task = celery_app.send_task(
                "pi.celery_app.remove_vector_data_task",
                args=[downgraded_workspaces, None],  # None = remove from both issues and pages
            )
            task_id = task.id
            log.info("Queued removal task %s for %d downgraded workspaces", task_id, len(downgraded_workspaces))

        return {
            "checked": checked_count,
            "downgraded": len(downgraded_workspaces),
            "downgraded_workspaces": downgraded_workspaces,
            "task_id": task_id,
        }

    except Exception as exc:
        log.error("Failed to handle non-Pro workspaces: %s", exc)
        return {"checked": 0, "downgraded": 0, "task_id": None}


async def find_stale_workspaces_needing_initial_feed() -> list[str]:
    """
    Find workspaces that are stuck with >50 missing vectors but marked as 'success'.

    These are workspaces that:
    1. Have status='success' and live_sync_enabled=True
    2. But have >50 missing vectors (so live sync skips them)
    3. Need to be re-fed with initial vectorization

    Returns:
        List of workspace IDs that need initial re-feeding
    """
    try:
        # Get workspaces that are eligible for live sync but might be stale
        eligible_workspaces = get_eligible_workspaces()

        if not eligible_workspaces:
            log.debug("No eligible workspaces found for stale check")
            return []

        # Use the same filtering logic but find workspaces with >50 missing vectors
        stale_workspaces = _find_stale_workspaces_via_opensearch(eligible_workspaces)

        log.debug("Found %d stale workspaces needing initial re-feeding", len(stale_workspaces))
        return stale_workspaces

    except Exception as exc:
        log.error("Failed to find stale workspaces: %s", exc)
        return []


async def handle_stale_workspaces() -> dict[str, int]:
    """
    Handle stale workspaces that have >50 missing vectors but are marked as 'success'.

    Creates initial vectorization jobs for these workspaces to fix their incomplete state.

    Returns:
        Dictionary with counts of processed stale workspaces
    """
    try:
        # Find stale workspaces
        stale_workspaces = await find_stale_workspaces_needing_initial_feed()

        if not stale_workspaces:
            log.debug("No stale workspaces found needing re-feeding")
            return {"checked": 0, "re_fed": 0}

        log.info("Found %d stale workspaces needing initial re-feeding", len(stale_workspaces))

        re_fed_count = 0

        for workspace_id in stale_workspaces:
            try:
                # Check if there's already a queued or running job for this workspace
                with db_session() as session:
                    # Check for existing queued/running jobs (get latest record)
                    stmt = (
                        select(WorkspaceVectorization)
                        .where(
                            WorkspaceVectorization.workspace_id == workspace_id,
                            (WorkspaceVectorization.status == VectorizationStatus.queued)
                            | (WorkspaceVectorization.status == VectorizationStatus.running),
                        )
                        .order_by(desc(WorkspaceVectorization.created_at))  # type: ignore[arg-type]
                    )
                    existing_job = session.exec(stmt).first()

                    if existing_job:
                        log.debug("Skipping stale workspace %s - already has job in progress (status: %s)", workspace_id, existing_job.status)
                        continue

                    # Reset the existing successful job to queued for re-processing (get latest successful)
                    stmt = (
                        select(WorkspaceVectorization)
                        .where(
                            WorkspaceVectorization.workspace_id == workspace_id,
                            WorkspaceVectorization.status == VectorizationStatus.success,
                        )
                        .order_by(desc(WorkspaceVectorization.created_at))  # type: ignore[arg-type]
                    )
                    existing_success_job = session.exec(stmt).first()

                    if existing_success_job:
                        # Reset the job to queued status for re-processing
                        existing_success_job.status = VectorizationStatus.queued
                        existing_success_job.progress_pct = 0
                        existing_success_job.started_at = None
                        existing_success_job.finished_at = None
                        existing_success_job.last_error = "Re-queued for stale workspace re-feeding"

                        session.commit()
                        session.refresh(existing_success_job)

                        # Dispatch Celery task for re-processing
                        job_config = {
                            "workspace_id": workspace_id,
                            "job_id": str(existing_success_job.id),
                            "feed_issues": existing_success_job.feed_issues,
                            "feed_pages": existing_success_job.feed_pages,
                            "feed_slices": existing_success_job.feed_slices,
                            "batch_size": existing_success_job.batch_size,
                        }

                        celery_app.send_task("pi.celery_app.vectorize_workspace", args=[job_config])
                        re_fed_count += 1

                        log.info("Re-queued stale workspace %s for initial re-feeding (job_id: %s)", workspace_id, existing_success_job.id)
                    else:
                        log.warning("Stale workspace %s has no existing successful job to reset", workspace_id)

            except Exception as exc:
                log.error("Failed to handle stale workspace %s: %s", workspace_id, exc)

        return {
            "checked": len(stale_workspaces),
            "re_fed": re_fed_count,
        }

    except Exception as exc:
        log.error("Failed to handle stale workspaces: %s", exc)
        return {"checked": 0, "re_fed": 0}


def _find_stale_workspaces_via_opensearch(
    workspace_ids: list[str],
    batch_size: int | None = None,
    threshold: int = 50,
) -> list[str]:
    """
    Find workspaces that have >threshold missing vectors.

    This reuses _filter_workspaces_via_opensearch and inverts the result.
    Processable workspaces have ≤threshold missing vectors.
    Stale workspaces have >threshold missing vectors.

    Args:
        workspace_ids: List of workspace IDs to check
        batch_size: Batch size for OpenSearch queries (defaults to settings)
        threshold: Minimum number of missing vectors to consider stale

    Returns:
        List of workspace IDs that are stale (>threshold missing vectors)
    """
    if not workspace_ids:
        return []

    log.info("Finding stale workspaces (>%d missing vectors) from %d candidates", threshold, len(workspace_ids))

    # Use existing filter function to get processable workspaces (≤threshold missing)
    processable_workspaces = set(_filter_workspaces_via_opensearch(workspace_ids, batch_size=batch_size, threshold=threshold))

    # Return workspaces that are NOT processable (i.e., stale with >threshold missing)
    stale_workspaces = [ws_id for ws_id in workspace_ids if ws_id not in processable_workspaces]

    log.info("Found %d stale workspaces out of %d checked", len(stale_workspaces), len(workspace_ids))

    return stale_workspaces


def _filter_workspaces_via_opensearch(
    workspace_ids: list[str],
    batch_size: int | None = None,
    threshold: int = 50,
) -> list[str]:
    """
    Return only those workspace IDs that have ≤threshold missing vectors
    for *any* field (name/description/content) in issues/pages index.

    Args:
        workspace_ids: List of workspace IDs to check
        batch_size: Batch size for OpenSearch queries (defaults to settings)
        threshold: Maximum number of missing vectors to consider processable

    Returns:
        List of workspace IDs that are processable (≤threshold missing vectors)
    """
    if not workspace_ids:
        return []

    if batch_size is None:
        batch_size = settings.vector_db.LIVE_SYNC_BATCH

    async def _async_filter():
        """Async helper to perform the actual filtering."""
        from pi.core.vectordb.client import VectorStore

        field_maps = {
            settings.vector_db.ISSUE_INDEX: {
                "name": "name_semantic",
                "description": "description_semantic",
                "content": "content_semantic",
            },
            settings.vector_db.PAGES_INDEX: {
                "name": "name_semantic",
                "description": "description_semantic",
            },
        }

        # Track total missing vectors per workspace across all fields/indices
        workspace_totals = {}
        for ws_id in workspace_ids:
            workspace_totals[ws_id] = 0

        async with VectorStore() as vdb:
            for index_name, fmap in field_maps.items():
                for src_field, tgt_field in fmap.items():
                    try:
                        # Get missing vector counts for all workspaces at once
                        counts = await vdb.missing_vectors_by_workspace(index_name, src_field, tgt_field, workspace_ids, batch_size)

                        # Add to totals
                        for ws_id, count in counts.items():
                            workspace_totals[ws_id] += count

                        log.debug(
                            "Found missing vectors in %s field %s->%s: %d workspaces have missing vectors",
                            index_name,
                            src_field,
                            tgt_field,
                            len(counts),
                        )

                    except Exception as exc:
                        log.error("Error checking missing vectors for %s field %s->%s: %s", index_name, src_field, tgt_field, exc)
                        # Continue with other fields on error
                        continue

        # Filter workspaces that have reasonable number of missing vectors
        processable = []
        skipped_count = 0

        for ws_id in workspace_ids:
            total_missing = workspace_totals.get(ws_id, 0)
            if total_missing > 0:
                processable.append(ws_id)
            else:
                skipped_count += 1
                log.debug(f"Skipping workspace {ws_id} because it has {total_missing} missing vectors")

        log.info(
            "OpenSearch filtering complete: %d/%d workspaces processable, %d skipped",
            len(processable),
            len(workspace_ids),
            skipped_count,
        )

        return processable

    # Run the async operation
    try:
        return asyncio.run(_async_filter())
    except Exception as exc:
        log.error("Failed to filter workspaces via OpenSearch: %s", exc)
        # On error, fall back to processing all workspaces (existing behavior)
        return workspace_ids


# ─────────────────── Utility Functions ─────────────────────

# No run_async_task helper – use asyncio.run(...) directly when absolutely necessary


async def log_pool_stats() -> None:
    """Log connection pool statistics for monitoring."""
    global _worker_engine

    if _worker_engine is None:
        return

    try:
        # Log basic info about the engine and pool configuration
        log.debug(
            "Connection pool status - configured_size: %d, max_overflow: %d, timeout: %d",
            settings.database.CELERY_POOL_SIZE,
            settings.database.CELERY_POOL_MAX_OVERFLOW,
            settings.database.CELERY_POOL_TIMEOUT,
        )
    except Exception as e:
        log.error("Failed to log pool stats: %s", e)


# ─────────────────── Celery Tasks ─────────────────────


@celery_app.task(bind=True, name="pi.celery_app.trigger_live_sync")
def trigger_live_sync(self):
    """
    Periodic task that triggers live sync by querying the database directly.
    This replaces the API-based approach with direct database access.
    """
    try:
        # Get eligible workspaces directly from database
        eligible_workspaces = get_eligible_workspaces()

        if not eligible_workspaces:
            # Don't log when there are no eligible workspaces to reduce noise
            return {
                "status": "no_eligible_workspaces",
                "message": "No workspaces with status='success' and live_sync_enabled=True",
                "dispatched": 0,
            }

        # Filter workspaces using OpenSearch to find those with reasonable amounts of missing vectors
        processable_workspaces = _filter_workspaces_via_opensearch(eligible_workspaces)

        if not processable_workspaces:
            # Log when there are eligible workspaces but none are processable
            log.info("No processable workspaces found - all %d eligible workspaces have no or >50 missing vectors", len(eligible_workspaces))
            return {
                "status": "no_processable_workspaces",
                "message": "All eligible workspaces have no or >50 missing vectors",
                "total_eligible_from_pg": len(eligible_workspaces),
                "processable_after_os_filter": 0,
                "dispatched": 0,
            }

        # Dispatch live sync tasks for each processable workspace
        dispatched = 0
        for ws in processable_workspaces:
            try:
                celery_app.send_task("pi.celery_app.process_workspace_live_sync", args=[ws])
                dispatched += 1
            except Exception as exc:
                log.error("Failed to dispatch live sync task for workspace %s: %s", ws, exc)

        result = {
            "status": "dispatched",
            "total_eligible_from_pg": len(eligible_workspaces),
            "processable_after_os_filter": len(processable_workspaces),
            "dispatched": dispatched,
        }

        # Log the funnel metrics
        log.info(
            "Live-sync candidate funnel – eligible_pg=%d → processable_os=%d → dispatched=%d",
            len(eligible_workspaces),
            len(processable_workspaces),
            dispatched,
        )

        if dispatched > 0:
            log.info("Live sync triggered for %d workspaces: %s", dispatched, result)

        return result

    except Exception as exc:
        log.error("Failed to trigger live sync: %s", exc)
        raise


@celery_app.task(bind=True, name="pi.celery_app.workspace_plan_sync")
def workspace_plan_sync(self):
    """
    Daily workspace plan synchronization task.

    Manages workspace vectorization based on billing plan changes and handles
    incomplete vectorizations that get stuck in the system.

    This task performs three operations:
    1. Removes vector data and disables live sync for workspaces downgraded from Pro/Business to FREE
    2. Re-feeds stale workspaces that have >50 missing vectors (stuck incomplete jobs)
    3. Creates initial vectorization jobs for new Pro/Business workspaces

    Environment variable: CELERY_WORKSPACE_PLAN_SYNC_ENABLED (default: enabled)
    """
    try:
        # Step 1: Handle non-Pro workspaces (remove vector data and disable live sync)
        downgrade_result = asyncio.run(disable_live_sync_for_non_pro_workspaces())

        # Step 2: Handle stale workspaces (re-feed those with >50 missing vectors)
        stale_result = asyncio.run(handle_stale_workspaces())

        # Step 3: Get Pro/Business workspaces that need feed
        workspaces_needing_feed = asyncio.run(get_pro_business_workspaces_needing_feed())

        if not workspaces_needing_feed:
            result = {
                "status": "no_workspaces_needing_feed",
                "message": "All Pro/Business workspaces already have successful vectorization",
                "feed_processing": {
                    "dispatched": 0,
                    "skipped": 0,
                    "errors": [],
                },
                "downgrade_processing": downgrade_result,
                "stale_processing": stale_result,
            }

            # Log if any significant activity happened
            downgraded_count = downgrade_result.get("downgraded", 0)
            re_fed_count = stale_result.get("re_fed", 0)
            if (isinstance(downgraded_count, int) and downgraded_count > 0) or (isinstance(re_fed_count, int) and re_fed_count > 0):
                log.info("Workspace plan sync completed: %s", result)
            else:
                log.debug("Workspace plan sync completed: %s", result)

            return result

        dispatched = 0
        skipped = 0
        errors = []

        for workspace_id in workspaces_needing_feed:
            try:
                # Check if there's already a queued or running job for this workspace
                with db_session() as session:
                    # Check for existing queued/running jobs (get latest record)
                    stmt = (
                        select(WorkspaceVectorization)
                        .where(
                            WorkspaceVectorization.workspace_id == workspace_id,
                            (WorkspaceVectorization.status == VectorizationStatus.queued)
                            | (WorkspaceVectorization.status == VectorizationStatus.running),
                        )
                        .order_by(desc(WorkspaceVectorization.created_at))  # type: ignore[arg-type]
                    )
                    existing_job = session.exec(stmt).first()

                    if existing_job:
                        log.debug("Skipping workspace %s - already has job in progress (status: %s)", workspace_id, existing_job.status)
                        skipped += 1
                        continue

                    # Create new vectorization job
                    job = WorkspaceVectorization(
                        workspace_id=workspace_id,
                        status=VectorizationStatus.queued,
                        feed_issues=True,
                        feed_pages=True,
                        feed_slices=settings.vector_db.FEED_SLICES,
                        batch_size=settings.vector_db.BATCH_SIZE,
                        live_sync_enabled=True,
                    )
                    session.add(job)
                    session.commit()
                    session.refresh(job)

                    # Dispatch Celery task
                    job_config = {
                        "workspace_id": workspace_id,
                        "job_id": str(job.id),
                        "feed_issues": True,
                        "feed_pages": True,
                        "feed_slices": settings.vector_db.FEED_SLICES,
                        "batch_size": settings.vector_db.BATCH_SIZE,
                    }

                    celery_app.send_task("pi.celery_app.vectorize_workspace", args=[job_config])
                    dispatched += 1

                    log.info("Created vectorization job for Pro/Business workspace %s (job_id: %s)", workspace_id, job.id)

            except Exception as exc:
                error_msg = f"Failed to create vectorization job for workspace {workspace_id}: {exc}"
                log.error(error_msg)
                errors.append(error_msg)

        result = {
            "status": "completed",
            "feed_processing": {
                "total_workspaces_needing_feed": len(workspaces_needing_feed),
                "dispatched": dispatched,
                "skipped": skipped,
                "errors": errors,
            },
            "downgrade_processing": downgrade_result,
            "stale_processing": stale_result,
        }

        # Log if any significant activity happened
        downgraded_count = downgrade_result.get("downgraded", 0)
        re_fed_count = stale_result.get("re_fed", 0)
        if dispatched > 0 or (isinstance(downgraded_count, int) and downgraded_count > 0) or (isinstance(re_fed_count, int) and re_fed_count > 0):
            log.info("Workspace plan sync completed: %s", result)
        else:
            log.debug("Workspace plan sync completed: %s", result)

        return result

    except Exception as exc:
        log.error("Failed to run workspace plan sync: %s", exc)
        raise


@celery_app.task(bind=True, name="pi.celery_app.process_workspace_live_sync")
def process_workspace_live_sync(self, workspace_id: str):
    """
    Process live sync for a specific workspace.
    This task receives the workspace_id directly and doesn't need database access.
    """
    try:
        result = asyncio.run(_process_workspace_live_sync(workspace_id))

        if result.get("processed", 0) > 0:
            log.info("Live sync completed for workspace %s: %s", workspace_id, result)

        return result

    except Exception as exc:
        log.error("Live sync failed for workspace %s: %s", workspace_id, exc)
        raise


async def _process_workspace_live_sync(workspace_id: str) -> Dict[str, Any]:
    """
    Process live sync for a single workspace without database access.
    """
    from pi.vectorizer.vectorize import populate_embeddings

    field_maps = {
        settings.vector_db.ISSUE_INDEX: {
            "name": "name_semantic",
            "description": "description_semantic",
            "content": "content_semantic",
        },
        settings.vector_db.PAGES_INDEX: {
            "name": "name_semantic",
            "description": "description_semantic",
        },
    }

    results: Dict[str, Any] = {"workspace_id": workspace_id, "processed": 0}

    async with VectorStore() as vdb:
        for index_name, fmap in field_maps.items():
            try:
                # Consolidate IDs that are missing vectors for ANY field
                ids_needed = set()
                # Track which fields should be processed (those with ≤50 missing vectors)
                processable_fields = {}

                for src_field, tgt_field in fmap.items():
                    missing_count, missing_ids = await vdb.missing_vectors_count(
                        index_name, src_field, tgt_field, live=True, workspace_id=workspace_id
                    )

                    if missing_count > 0 and missing_count <= 50 and missing_ids:
                        ids_needed.update(missing_ids)
                        processable_fields[src_field] = tgt_field

                # Only process if we have a reasonable number of documents AND processable fields
                if ids_needed and len(ids_needed) <= 50 and processable_fields:
                    log.info(
                        "Processing live sync for workspace %s, index %s: %d documents, fields: %s",
                        workspace_id,
                        index_name,
                        len(ids_needed),
                        list(processable_fields.keys()),
                    )

                    await populate_embeddings(
                        vdb,
                        index_name,
                        processable_fields,
                        live=True,
                        ids=list(ids_needed),
                        workspace_id=workspace_id,
                    )

                    results["processed"] = results["processed"] + len(ids_needed)
                    results[f"{index_name}_processed"] = len(ids_needed)

            except Exception as exc:
                log.error("Error processing live sync for workspace %s, index %s: %s", workspace_id, index_name, exc)
                results[f"{index_name}_error"] = str(exc)

    return results


async def validate_vectorization_completion(
    vdb: VectorStore,
    workspace_id: str,
    feed_issues: bool,
    feed_pages: bool,
    max_retries: int = 5,
    initial_delay: float = 5.0,
) -> tuple[bool, str]:
    """
    Validate that vectorization is actually complete by checking for missing vectors.
    Includes retry logic to handle OpenSearch indexing delays.

    Args:
        vdb: VectorStore instance
        workspace_id: Workspace ID to check
        feed_issues: Whether issues were processed
        feed_pages: Whether pages were processed
        max_retries: Maximum number of retry attempts (default: 3)
        initial_delay: Initial delay between retries in seconds (default: 2.0)

    Returns:
        Tuple of (is_complete, error_message)
    """
    import asyncio

    for attempt in range(max_retries + 1):  # +1 to include initial attempt
        try:
            total_missing = 0
            missing_details = []

            if feed_issues:
                # Check issues index for missing vectors
                issue_index = settings.vector_db.ISSUE_INDEX

                # Check each field type for missing vectors
                name_missing, _ = await vdb.missing_vectors_count(issue_index, "name", "name_semantic", workspace_id=workspace_id)
                desc_missing, _ = await vdb.missing_vectors_count(issue_index, "description", "description_semantic", workspace_id=workspace_id)
                content_missing, _ = await vdb.missing_vectors_count(issue_index, "content", "content_semantic", workspace_id=workspace_id)

                issue_total = name_missing + desc_missing + content_missing
                total_missing += issue_total

                if issue_total > 0:
                    missing_details.append(f"issues: {issue_total} (name: {name_missing}, desc: {desc_missing}, content: {content_missing})")

            if feed_pages:
                # Check pages index for missing vectors
                pages_index = settings.vector_db.PAGES_INDEX

                # Check each field type for missing vectors
                name_missing, _ = await vdb.missing_vectors_count(pages_index, "name", "name_semantic", workspace_id=workspace_id)
                desc_missing, _ = await vdb.missing_vectors_count(pages_index, "description", "description_semantic", workspace_id=workspace_id)

                pages_total = name_missing + desc_missing
                total_missing += pages_total

                if pages_total > 0:
                    missing_details.append(f"pages: {pages_total} (name: {name_missing}, desc: {desc_missing})")

            if total_missing == 0:
                if attempt > 0:
                    log.info("Validation passed on attempt %d: No missing vectors found for workspace %s", attempt + 1, workspace_id)
                else:
                    log.info("Validation passed: No missing vectors found for workspace %s", workspace_id)
                return True, ""
            else:
                if attempt < max_retries:
                    # Calculate delay with exponential backoff
                    delay = initial_delay * (2**attempt)
                    log.info(
                        "Attempt %d: Found %d missing vectors for workspace %s. Retrying in %.1fs to allow OpenSearch indexing...",
                        attempt + 1,
                        total_missing,
                        workspace_id,
                        delay,
                    )
                    await asyncio.sleep(delay)
                    continue
                # Final attempt failed
                error_msg = (
                    f"Validation failed after {max_retries + 1} attempts: {total_missing} missing vectors remaining - {", ".join(missing_details)}"  # noqa: E501
                )
                log.warning("Final validation failed for workspace %s: %s", workspace_id, error_msg)
                return False, error_msg

        except Exception as exc:
            if attempt < max_retries:
                delay = initial_delay * (2**attempt)
                log.warning("Validation attempt %d failed for workspace %s: %s. Retrying in %.1fs...", attempt + 1, workspace_id, exc, delay)
                await asyncio.sleep(delay)
                continue
            error_msg = f"Validation error after {max_retries + 1} attempts: {exc}"
            log.error("Failed to validate vectorization completion for workspace %s: %s", workspace_id, exc)
            return False, error_msg

    # This shouldn't be reached, but just in case
    return False, "Unexpected validation state"


@celery_app.task(bind=True, name="pi.celery_app.vectorize_workspace")
def vectorize_workspace(self, job_config: Dict[str, Any]):
    """
    Perform initial vectorization for a single workspace.
    Uses direct database access for status updates instead of API calls.
    """
    from pi.vectorizer.vectorize import populate_embeddings

    workspace_id = job_config["workspace_id"]
    job_id = UUID(job_config["job_id"])
    feed_issues = job_config.get("feed_issues", True)
    feed_pages = job_config.get("feed_pages", True)
    feed_slices = job_config.get("feed_slices", settings.vector_db.FEED_SLICES)
    batch_size = job_config.get("batch_size", settings.vector_db.BATCH_SIZE)

    async def _run():
        try:
            # Log pool stats at the start
            await log_pool_stats()

            # Mark job as running
            try:
                update_job_status(job_id, VectorizationStatus.running, progress_pct=0)
            except JobStatusUpdateError as status_exc:
                log.error("Failed to mark job as running: %s", status_exc)
                # Continue with vectorization but log the issue

            async with VectorStore() as vdb:
                total_tasks = sum([feed_issues, feed_pages])
                completed_tasks = 0

                if feed_issues:
                    log.info("Starting issues vectorization for workspace %s", workspace_id)
                    await populate_embeddings(
                        vdb,
                        settings.vector_db.ISSUE_INDEX,
                        {"name": "name_semantic", "description": "description_semantic", "content": "content_semantic"},
                        live=False,
                        workspace_id=workspace_id,
                        feed_slices=feed_slices,
                        batch_size=batch_size,
                        bulk_size=batch_size,
                    )
                    completed_tasks += 1
                    progress = int((completed_tasks / total_tasks) * 100)
                    try:
                        update_job_status(job_id, VectorizationStatus.running, progress_pct=progress)
                    except JobStatusUpdateError as status_exc:
                        log.warning("Failed to update progress for job %s: %s", job_id, status_exc)
                    log.info("Issues vectorization completed for workspace %s", workspace_id)

                    # Log pool stats mid-task
                    await log_pool_stats()

                if feed_pages:
                    log.info("Starting pages vectorization for workspace %s", workspace_id)
                    await populate_embeddings(
                        vdb,
                        settings.vector_db.PAGES_INDEX,
                        {"name": "name_semantic", "description": "description_semantic"},
                        live=False,
                        workspace_id=workspace_id,
                        feed_slices=feed_slices,
                        batch_size=batch_size,
                        bulk_size=batch_size,
                    )
                    completed_tasks += 1
                    progress = int((completed_tasks / total_tasks) * 100)
                    try:
                        update_job_status(job_id, VectorizationStatus.running, progress_pct=progress)
                    except JobStatusUpdateError as status_exc:
                        log.warning("Failed to update progress for job %s: %s", job_id, status_exc)
                    log.info("Pages vectorization completed for workspace %s", workspace_id)

                # Validate that vectorization is actually complete before marking as success
                log.info("Validating vectorization completion for workspace %s", workspace_id)
                is_complete, validation_error = await validate_vectorization_completion(vdb, workspace_id, feed_issues, feed_pages)

                if is_complete:
                    # Mark job as successful only if validation passes
                    try:
                        update_job_status(job_id, VectorizationStatus.success, progress_pct=100)
                        log.info("Vectorization completed successfully for workspace %s", workspace_id)
                    except JobStatusUpdateError as status_exc:
                        log.error("CRITICAL: Vectorization succeeded but failed to update status: %s", status_exc)
                        # Still return success since vectorization actually completed
                else:
                    # Mark job as failed if there are still missing vectors
                    try:
                        update_job_status(job_id, VectorizationStatus.failed, error=f"Vectorization incomplete: {validation_error}")
                    except JobStatusUpdateError as status_exc:
                        log.error("Failed to mark job as failed after validation failure: %s", status_exc)
                    log.error("Vectorization marked as failed for workspace %s: %s", workspace_id, validation_error)
                    raise Exception(f"Vectorization validation failed: {validation_error}")

            # Log pool stats at the end
            await log_pool_stats()

            return {"status": "success", "workspace_id": workspace_id, "job_id": str(job_id)}

        except Exception as exc:
            error_msg = str(exc)
            log.error("Vectorization failed for workspace %s: %s", workspace_id, error_msg)
            try:
                update_job_status(job_id, VectorizationStatus.failed, error=error_msg)
            except JobStatusUpdateError as status_exc:
                log.error("CRITICAL: Vectorization failed AND failed to update status: %s", status_exc)
                # Add the status update failure to the original error message
                error_msg = f"{error_msg} (Also failed to update job status: {status_exc})"
            raise Exception(error_msg)  # Let Celery retry

    return asyncio.run(_run())


@celery_app.task(bind=True, name="pi.celery_app.vectorize_all_data")
def vectorize_all_data(self, job_config: Dict[str, Any] | None = None):
    """
    Perform vectorization for ALL data across all workspaces.
    Does not filter by workspace_id - processes entire indices.

    This is useful for:
    - Initial bulk vectorization of all data
    - Re-vectorization after model changes
    - Backfilling missing embeddings globally

    Args:
        job_config: Optional configuration dictionary containing:
            - feed_issues: Whether to vectorize issues (default: True)
            - feed_pages: Whether to vectorize pages (default: True)
            - feed_docs: Whether to vectorize docs (default: True)
            - feed_slices: Number of parallel slices (default: from settings)
            - batch_size: Batch size for embeddings (default: from settings)
    """
    from pi.vectorizer.vectorize import populate_embeddings

    # Use default config if none provided
    if job_config is None:
        job_config = {}

    feed_issues = job_config.get("feed_issues", True)
    feed_pages = job_config.get("feed_pages", True)
    feed_docs = job_config.get("feed_docs", True)
    feed_slices = job_config.get("feed_slices", settings.vector_db.FEED_SLICES)
    batch_size = job_config.get("batch_size", settings.vector_db.BATCH_SIZE)

    async def _run():
        try:
            # Log pool stats at the start
            await log_pool_stats()

            log.info("Starting global vectorization (all workspaces) - issues: %s, pages: %s, docs: %s", feed_issues, feed_pages, feed_docs)

            async with VectorStore() as vdb:
                total_tasks = sum([feed_issues, feed_pages, feed_docs])
                completed_tasks = 0

                if feed_issues:
                    log.info("Starting global issues vectorization (all workspaces)")
                    await populate_embeddings(
                        vdb,
                        settings.vector_db.ISSUE_INDEX,
                        {"name": "name_semantic", "description": "description_semantic", "content": "content_semantic"},
                        live=False,
                        workspace_id=None,  # No workspace filter - process all
                        feed_slices=feed_slices,
                        batch_size=batch_size,
                        bulk_size=batch_size,
                    )
                    completed_tasks += 1
                    progress = int((completed_tasks / total_tasks) * 100)
                    log.info("Global issues vectorization completed (%d%%)", progress)

                    # Log pool stats mid-task
                    await log_pool_stats()

                if feed_pages:
                    log.info("Starting global pages vectorization (all workspaces)")
                    await populate_embeddings(
                        vdb,
                        settings.vector_db.PAGES_INDEX,
                        {"name": "name_semantic", "description": "description_semantic"},
                        live=False,
                        workspace_id=None,  # No workspace filter - process all
                        feed_slices=feed_slices,
                        batch_size=batch_size,
                        bulk_size=batch_size,
                    )
                    completed_tasks += 1
                    progress = int((completed_tasks / total_tasks) * 100)
                    log.info("Global pages vectorization completed (%d%%)", progress)

                    # Log pool stats mid-task
                    await log_pool_stats()

                if feed_docs:
                    log.info("Starting global docs vectorization (all workspaces)")
                    await populate_embeddings(
                        vdb,
                        settings.vector_db.DOCS_INDEX,
                        {"content": "content_semantic"},
                        live=False,
                        workspace_id=None,  # No workspace filter - process all
                        feed_slices=feed_slices,
                        batch_size=batch_size,
                        bulk_size=batch_size,
                    )
                    completed_tasks += 1
                    progress = int((completed_tasks / total_tasks) * 100)
                    log.info("Global docs vectorization completed (%d%%)", progress)

            # Log pool stats at the end
            await log_pool_stats()

            log.info("Global vectorization completed successfully")
            return {
                "status": "success",
                "feed_issues": feed_issues,
                "feed_pages": feed_pages,
                "feed_docs": feed_docs,
            }

        except Exception as exc:
            error_msg = str(exc)
            log.error("Global vectorization failed: %s", error_msg)
            raise Exception(error_msg)  # Let Celery retry

    return asyncio.run(_run())


@celery_app.task
def reap_stuck_vectorization_jobs(timeout_minutes: int = 5760):
    """
    Mark jobs stuck in 'queued' or 'running' for longer than timeout_minutes as 'failed'.
    """
    now = datetime.utcnow()
    cutoff = now - timedelta(minutes=timeout_minutes)
    with db_session() as session:
        # Stuck in 'queued'
        queued_stmt = select(WorkspaceVectorization).where(
            WorkspaceVectorization.status == VectorizationStatus.queued,
            WorkspaceVectorization.created_at < cutoff,
        )
        queued_jobs = session.exec(queued_stmt).all()

        # Stuck in 'running' - if started_at is None, use created_at as fallback
        running_stmt = select(WorkspaceVectorization).where(
            WorkspaceVectorization.status == VectorizationStatus.running,
            WorkspaceVectorization.created_at < cutoff,
        )
        running_jobs = session.exec(running_stmt).all()
        for job in list(queued_jobs) + list(running_jobs):
            job.status = VectorizationStatus.failed
            job.last_error = f"Job automatically failed after being stuck in '{job.status}' for over {timeout_minutes} minutes."
            job.finished_at = now
        session.commit()


# Add to Celery beat schedule
celery_app.conf.beat_schedule = getattr(celery_app.conf, "beat_schedule", {})
celery_app.conf.beat_schedule["reap-stuck-vectorization-jobs"] = {
    "task": "pi.celery_app.reap_stuck_vectorization_jobs",
    "schedule": 86400,  # every 24 hours
    "args": (5760,),  # 4 days in minutes
}

# Add workspace plan sync if enabled
if settings.celery.WORKSPACE_PLAN_SYNC_ENABLED:
    celery_app.conf.beat_schedule["workspace-plan-sync"] = {
        "task": "pi.celery_app.workspace_plan_sync",
        "schedule": settings.celery.WORKSPACE_PLAN_SYNC_INTERVAL,
    }
else:
    log.info("Workspace plan sync disabled (CELERY_WORKSPACE_PLAN_SYNC_ENABLED=%s)", settings.celery.WORKSPACE_PLAN_SYNC_ENABLED)


# Optional: Health check task
@celery_app.task
def health_check() -> Dict[str, Any]:
    """Simple health check task for monitoring."""
    result = {"status": "healthy", "timestamp": time.time()}

    # Add circuit breaker status
    result["circuit_breaker"] = {
        "is_open": _db_circuit_breaker.is_open,
        "failure_count": _db_circuit_breaker.failure_count,
        "can_attempt": _db_circuit_breaker.can_attempt(),
    }

    # Test database connectivity only if circuit breaker allows
    if _db_circuit_breaker.can_attempt():
        try:
            # Try to get a database session
            async def test_db():
                with db_session() as session:
                    # Simple query to test connection
                    session.exec(select(1))
                    return True

            db_healthy = asyncio.run(test_db())
            result["database"] = "healthy" if db_healthy else "unhealthy"
        except Exception as e:
            log.error("Database health check failed: %s", e)
            result["database"] = "unhealthy"
            result["status"] = "degraded"
            result["error"] = str(e)
    else:
        result["database"] = "circuit_breaker_open"
        result["status"] = "degraded"

    return result


@celery_app.task(bind=True, name="pi.celery_app.populate_chat_search_index")
def populate_chat_search_index(self, job_config: dict):
    """
    Celery task to populate chat search index with existing chats and messages.

    Args:
        job_config: Dictionary containing:
            - workspace_id: Optional workspace filter
            - batch_size: Batch size for processing
    """

    workspace_id = job_config.get("workspace_id")
    batch_size = job_config.get("batch_size", 100)

    log.info("Starting chat search index population task for workspace_id: %s", workspace_id)

    async def _populate():
        start_time = time.time()

        stats = {
            "total_chats": 0,
            "total_messages": 0,
            "processed_chats": 0,
            "processed_messages": 0,
            "failed_chats": 0,
            "failed_messages": 0,
        }

        try:
            with db_session() as session:
                # Build query for chats
                from sqlmodel import select

                chat_query = select(Chat).where(Chat.deleted_at.is_(None))  # type: ignore[union-attr]
                if workspace_id:
                    chat_query = chat_query.where(Chat.workspace_id == workspace_id)

                # Get all chats
                total_chats_result = session.exec(chat_query)
                all_chats = list(total_chats_result.all())
                stats["total_chats"] = len(all_chats)

                # Count total messages for these chats
                if all_chats:
                    chat_ids = [chat.id for chat in all_chats]
                    message_query = select(Message).where(and_(Message.chat_id.in_(chat_ids), Message.deleted_at.is_(None)))  # type: ignore[union-attr]
                    total_messages_result = session.exec(message_query)
                    all_messages = list(total_messages_result.all())
                    stats["total_messages"] = len(all_messages)

                log.info("Found %d chats and %d messages to process", stats["total_chats"], stats["total_messages"])
                log.info("Starting chat search index population: %d chats, %d messages", stats["total_chats"], stats["total_messages"])

                # Process chats in batches
                for i in range(0, len(all_chats), batch_size):
                    batch_chats = all_chats[i : i + batch_size]
                    log.info("Processing chat batch %d-%d of %d", i + 1, min(i + batch_size, len(all_chats)), len(all_chats))

                    for chat in batch_chats:
                        try:
                            from pi.services.retrievers.vdb_store.chat_search import bulk_populate_chat_and_messages

                            # Get messages for this chat
                            message_query = (
                                select(Message).where(and_(Message.chat_id == chat.id, Message.deleted_at.is_(None))).order_by(Message.sequence)  # type: ignore[union-attr,arg-type]
                            )
                            messages_result = session.exec(message_query)
                            messages = list(messages_result.all())

                            # Use optimized bulk function to process chat and all its messages
                            result = await bulk_populate_chat_and_messages(chat, messages)

                            if result["status"] == "success":
                                stats["processed_chats"] += 1
                                stats["processed_messages"] += result.get("processed_messages", 0)
                                stats["failed_messages"] += result.get("failed_messages", 0)
                            else:
                                stats["failed_chats"] += 1
                                log.error("Failed to bulk populate chat %s: %s", chat.id, result.get("message"))

                            # Log progress every 10 chats
                            if stats["processed_chats"] % 10 == 0:
                                progress_percent = int((stats["processed_chats"] / stats["total_chats"]) * 100) if stats["total_chats"] > 0 else 0
                                log.info(
                                    "Progress: %d%% (%d/%d chats, %d/%d messages processed, %d failed chats, %d failed messages)",
                                    progress_percent,
                                    stats["processed_chats"],
                                    stats["total_chats"],
                                    stats["processed_messages"],
                                    stats["total_messages"],
                                    stats["failed_chats"],
                                    stats["failed_messages"],
                                )

                        except Exception as e:
                            log.error("Failed to index chat %s: %s", chat.id, e)
                            stats["failed_chats"] += 1

                duration = time.time() - start_time
                stats["duration_seconds"] = int(round(duration, 2))

                log.info(
                    "Chat search index population completed: %d/%d chats, %d/%d messages in %.2f seconds",
                    stats["processed_chats"],
                    stats["total_chats"],
                    stats["processed_messages"],
                    stats["total_messages"],
                    duration,
                )

                return stats

        except Exception as exc:
            duration = time.time() - start_time
            stats["duration_seconds"] = int(round(duration, 2))
            log.error("Failed to populate chat search index: %s", exc)
            raise Exception(f"Population failed: {str(exc)}")

    # Run the async operation
    try:
        result = asyncio.run(_populate())

        log.info("Chat search index population task completed successfully")
        return {"status": "completed", "workspace_id": workspace_id, "batch_size": batch_size, **result}

    except Exception as exc:
        log.error("Chat search index population task failed: %s", exc)
        raise


@celery_app.task(bind=True, name="pi.celery_app.upsert_chat_search_index_task")
def upsert_chat_search_index_task(self, token_id: str):
    """
    Background task to upsert chat and message data to OpenSearch index.

    Args:
        token_id: The query message ID used to find related chat and messages
    """
    try:
        result = process_chat_and_messages_from_token(token_id)
        return result
    except Exception as exc:
        log.error(f"Chat search index task failed for token_id {token_id}: {exc}")
        raise


@celery_app.task(bind=True, name="pi.celery_app.track_dupes_operation")
def track_dupes_operation(self, tracking_data: dict):
    """
    Celery task to track dupes operations and LLM token usage in the background.

    Args:
        tracking_data: Dictionary containing all tracking information:
            - workspace_id: UUID string of the workspace
            - project_id: Optional UUID string of the project
            - issue_id: Optional UUID string of the issue
            - user_id: Optional UUID string of the user
            - workspace_slug: Optional workspace slug
            - query_title: Optional query title
            - query_description_length: Optional description length
            - input_workitems: List of work items sent to LLM (id, title, description)
            - output_duplicates: List of identified duplicates
            - vector_candidates_count: Number of vector search candidates
            - vector_search_duration_ms: Vector search duration
            - llm_candidates_count: Number of candidates sent to LLM
            - llm_identified_dupes_count: Number of duplicates identified by LLM
            - llm_duration_ms: LLM processing duration
            - llm_success: Whether LLM call was successful
            - llm_error: Optional error message
            - token_usage: Pre-extracted token usage dict (input_tokens, output_tokens, cached_input_tokens)
            - model_key: Optional model key for token tracking
            - total_duration_ms: Total operation duration
    """
    try:
        # Use synchronous db_session (no async needed)
        with db_session() as session:
            tracker = DupesTracker(session)
            tracker.track_dupes_operation(**tracking_data)
            # Note: Success logging happens inside tracker.track_dupes_operation()
    except Exception as e:
        log.error(f"Failed to track dupes operation: {e}", exc_info=True)
        # Don't re-raise to avoid failing the main dupes operation


@celery_app.task(bind=True, name="pi.celery_app.upsert_chat_search_index_deletion_task")
def upsert_chat_search_index_deletion_task(self, chat_id: str):
    """
    Background task to mark chat and all its messages as deleted in OpenSearch index.

    Args:
        chat_id: The chat ID to mark as deleted
    """

    async def _delete():
        try:
            # Use the optimized function from chat_search module
            result = await mark_chat_deleted(chat_id)
            return result

        except Exception as e:
            log.error(f"Error in upsert_chat_search_index_deletion_task for chat_id {chat_id}: {e}")
            return {"status": "error", "message": str(e)}

    # Run the async operation
    try:
        result = asyncio.run(_delete())
        return result
    except Exception as exc:
        log.error(f"Chat deletion task failed for chat_id {chat_id}: {exc}")
        raise


@celery_app.task(bind=True, name="pi.celery_app.upsert_chat_search_index_title_task")
def upsert_chat_search_index_title_task(self, chat_id: str, title: str):
    """
    Background task to update chat title in OpenSearch index and propagate to messages.

    Args:
        chat_id: The chat ID to update
        title: The new title
    """
    try:
        result = update_chat_title_and_propagate(chat_id, title)
        return result
    except Exception as exc:
        log.error(f"Chat title update task failed for chat_id {chat_id}: {exc}")
        raise


# Removed vectorize_docs_task - use feed-docs command instead
# The periodic sync_docs_periodic_task handles incremental updates


@celery_app.task(bind=True, name="pi.celery_app.sync_docs_periodic_task")
def sync_docs_periodic_task(self):
    """
    Periodic task to sync documentation from public GitHub repositories.

    HOW INCREMENTAL SYNC WORKS:
    ===========================

    This task uses GitHub's commit comparison API to efficiently sync only changed files:

    1. COMMIT TRACKING:
       - Stores the last processed commit SHA in the database for each repo/branch
       - On each run, fetches the latest commit SHA from GitHub (1 API call per repo)

    2. COMMIT COMPARISON:
       - Compares last_commit_sha vs latest_commit_sha using GitHub's compare API
       - Returns list of changed files with status: added/modified/removed (1 API call per repo)
       - Only processes .mdx and .txt files (documentation files)

    3. INCREMENTAL PROCESSING:
       - If commits differ:
         * Fetches only changed files via raw.githubusercontent.com (NO API limit)
         * Processes and indexes only modified/added files
         * Removes deleted files from index
         * Updates commit SHA in database
       - If commits match:
         * Skips processing (no changes)

    4. FIRST RUN (Full Feed):
       - If no previous commit exists:
         * Uses git tree API to get all files (2 API calls: commit SHA + recursive tree)
         * Processes all documentation files
         * Stores commit SHA for future incremental syncs

    API CALL OPTIMIZATION:
    ======================
    - Full feed: 2 API calls per repo (commit SHA + recursive tree)
    - Incremental sync: 2 API calls per repo (latest commit + compare)
    - File content fetching: Uses raw.githubusercontent.com (no API calls)

    Returns:
        Dictionary with sync results
    """
    log.info("Starting periodic docs sync task")

    async def _sync_docs():
        from pi.core.db.plane_pi.lifecycle import get_async_session
        from pi.core.db.plane_pi.lifecycle import init_async_db
        from pi.core.vectordb import VectorStore
        from pi.services.retrievers.pg_store.webhook import create_webhook_record
        from pi.services.retrievers.pg_store.webhook import get_last_processed_commit
        from pi.services.retrievers.pg_store.webhook import update_webhook_record
        from pi.vectorizer.docs.document_processor import fetch_and_process_files
        from pi.vectorizer.docs.document_processor import get_all_files_for_full_feed
        from pi.vectorizer.docs.github_fetcher import get_file_changes_between_commits
        from pi.vectorizer.docs.github_fetcher import get_latest_commit_sha

        # Initialize async database engine
        await init_async_db()

        # Get configuration
        repos = [repo.strip() for repo in settings.vector_db.DOCS_REPO_NAME.split(",") if repo.strip()]
        branch = settings.vector_db.DOCS_BRANCH
        repo_owner = settings.vector_db.DOCS_REPO_OWNER

        if not repos:
            log.error("No repositories configured for docs sync")
            return {"status": "error", "message": "No repositories configured"}

        log.info("Syncing %d documentation repositories: %s", len(repos), repos)

        # Initialize counters
        total_added = 0
        total_modified = 0
        total_removed = 0
        total_success = 0
        total_failed = 0
        results = []

        async with VectorStore() as vdb:
            # Get database session
            async for db in get_async_session():
                try:
                    # Process each repository
                    for i, repo in enumerate(repos, 1):
                        repo_result = {
                            "repo": repo,
                            "status": "pending",
                            "files_added": 0,
                            "files_modified": 0,
                            "files_removed": 0,
                            "success_count": 0,
                            "failed_count": 0,
                        }

                        try:
                            log.info("Processing repository %d/%d: %s", i, len(repos), repo)

                            # STEP 1: Get latest commit from GitHub (1 API call)
                            # This tells us what the current state of the repository is
                            latest_commit_sha, error = get_latest_commit_sha(repo_owner, repo, branch)
                            if not latest_commit_sha:
                                error_msg = error or f"Failed to get latest commit SHA for {repo}"
                                log.error(error_msg)
                                repo_result["status"] = "error"
                                repo_result["error"] = error_msg
                                results.append(repo_result)
                                total_failed += 1
                                continue

                            log.info("Latest commit for %s: %s", repo, latest_commit_sha)

                            # STEP 2: Get last processed commit from database
                            # This tells us what we've already processed
                            last_commit_sha = await get_last_processed_commit(db, repo, branch)

                            # STEP 3: Compare commits to determine if sync is needed
                            # If commits match, repository is up-to-date (no changes)
                            if last_commit_sha == latest_commit_sha:
                                log.info("Repository %s is up to date (commit: %s)", repo, latest_commit_sha)
                                repo_result["status"] = "up_to_date"
                                repo_result["commit_sha"] = latest_commit_sha
                                results.append(repo_result)
                                continue

                            # Create or get webhook record for tracking
                            webhook_record = await create_webhook_record(db, latest_commit_sha, repo, branch, processed=False)

                            # Determine files to process
                            files_to_add: list[str] = []
                            files_to_remove: list[str] = []

                            if not last_commit_sha:
                                # First time sync - full feed
                                log.info("No previous commit found for %s. Performing full feed.", repo)
                                all_files, error = get_all_files_for_full_feed(repo, branch)

                                if error or not all_files:
                                    # Error occurred
                                    error_msg = error or "Failed to get file list"
                                    log.error(error_msg)
                                    await update_webhook_record(db, webhook_record, processed=False, error_message=error_msg)
                                    repo_result["status"] = "error"
                                    repo_result["error"] = error_msg
                                    results.append(repo_result)
                                    total_failed += 1
                                    continue

                                files_to_add = all_files
                                repo_result["files_added"] = len(all_files)
                                log.info("Full feed: %d files to process for %s", len(all_files), repo)

                            else:
                                # STEP 4: Incremental sync - only changed files
                                # Use GitHub's compare API to get diff between commits (1 API call)
                                # Returns: added, modified, removed file lists
                                log.info(
                                    "Incremental sync for %s: %s -> %s",
                                    repo,
                                    last_commit_sha[:7],
                                    latest_commit_sha[:7],
                                )

                                # This API call compares two commits and returns file changes
                                # Only processes .mdx and .txt files (documentation files)
                                file_changes = get_file_changes_between_commits(repo_owner, repo, last_commit_sha, latest_commit_sha)

                                if "error" in file_changes:
                                    error_msg = str(file_changes.get("error", "Unknown error"))
                                    log.error("Failed to get file changes: %s", error_msg)
                                    await update_webhook_record(db, webhook_record, processed=False, error_message=error_msg)
                                    repo_result["status"] = "error"
                                    repo_result["error"] = error_msg
                                    results.append(repo_result)
                                    total_failed += 1
                                    continue

                                added = file_changes.get("added", [])
                                modified = file_changes.get("modified", [])
                                removed = file_changes.get("removed", [])

                                # Type narrowing - we know these are lists at this point
                                if isinstance(added, list) and isinstance(modified, list) and isinstance(removed, list):
                                    files_to_add = added + modified
                                    files_to_remove = removed
                                else:
                                    log.error("Unexpected type for file changes")
                                    continue

                                repo_result["files_added"] = len(added)
                                repo_result["files_modified"] = len(modified)
                                repo_result["files_removed"] = len(removed)

                                total_added += len(added)
                                total_modified += len(modified)
                                total_removed += len(removed)

                                log.info(
                                    "Changes for %s: %d added, %d modified, %d removed",
                                    repo,
                                    len(added),
                                    len(modified),
                                    len(removed),
                                )

                            # Process added/modified files
                            success_count = 0
                            failed_files = []

                            if files_to_add:
                                log.info("Processing %d files for %s...", len(files_to_add), repo)
                                docs_to_index, failed = fetch_and_process_files(repo, files_to_add, branch)
                                failed_files.extend(failed)

                                if docs_to_index:
                                    log.info("Indexing %d documents for %s...", len(docs_to_index), repo)
                                    ok, failures = await vdb.async_feed(index_name=settings.vector_db.DOCS_INDEX, docs=docs_to_index)
                                    success_count += ok
                                    failed_files.extend([f.get("id", "unknown") for f in failures])
                                    log.info("Successfully indexed %d/%d documents for %s", ok, len(docs_to_index), repo)

                            # Process removed files (only for incremental sync)
                            if files_to_remove and last_commit_sha:
                                log.info("Removing %d deleted files from index for %s...", len(files_to_remove), repo)
                                removed_count = 0
                                for file_path in files_to_remove:
                                    try:
                                        unique_id = (
                                            file_path.replace("/", "_").replace("-", "_").replace(".mdx", "").replace(".md", "").replace(".txt", "")
                                        )
                                        resp = await vdb.async_delete_document(index_name=settings.vector_db.DOCS_INDEX, document_id=unique_id)
                                        if resp.get("result") == "deleted":
                                            success_count += 1
                                            removed_count += 1
                                    except Exception as e:
                                        log.error("Error deleting file %s: %s", file_path, e)
                                        failed_files.append(file_path)

                                if removed_count > 0:
                                    log.info("Removed %d/%d files from index for %s", removed_count, len(files_to_remove), repo)

                            # Update webhook record
                            processed_successfully = len(failed_files) == 0
                            error_message = None if processed_successfully else f"Failed files: {", ".join(failed_files)}"

                            await update_webhook_record(
                                db,
                                webhook_record,
                                processed=processed_successfully,
                                files_processed=success_count,
                                error_message=error_message,
                            )

                            # Update counters
                            repo_result["success_count"] = success_count
                            repo_result["failed_count"] = len(failed_files)
                            repo_result["status"] = "success" if processed_successfully else "partial_failure"
                            repo_result["commit_sha"] = latest_commit_sha

                            total_success += success_count
                            total_failed += len(failed_files)

                            if processed_successfully:
                                log.info("Completed %s: %d documents processed successfully", repo, success_count)
                            else:
                                log.warning("⚠ Completed %s with errors: %d successful, %d failed", repo, success_count, len(failed_files))

                        except Exception as e:
                            error_msg = str(e)
                            log.error("Error processing repository %s: %s", repo, e, exc_info=True)
                            repo_result["status"] = "error"
                            repo_result["error"] = error_msg
                            total_failed += 1

                        results.append(repo_result)

                finally:
                    # Close database session
                    await db.close()

        # Final summary
        if total_failed == 0:
            log.info("Docs sync completed successfully: %d repos, %d documents indexed", len(repos), total_success)
        else:
            log.warning("⚠ Docs sync completed with errors: %d repos, %d successful, %d failed", len(repos), total_success, total_failed)

        return {
            "status": "completed",
            "repositories_processed": len(repos),
            "total_files_added": total_added,
            "total_files_modified": total_modified,
            "total_files_removed": total_removed,
            "total_success": total_success,
            "total_failed": total_failed,
            "results": results,
        }

    # Run the async sync
    try:
        result = asyncio.run(_sync_docs())
        log.info("Periodic docs sync task completed successfully")
        return result

    except Exception as exc:
        log.error("Periodic docs sync task failed: %s", exc, exc_info=True)
        raise


@celery_app.task(bind=True, name="pi.celery_app.remove_vector_data_task")
def remove_vector_data_task(self, workspace_ids: list[str], entities: list[str] | None = None):
    """
    Background task to remove vector embeddings from specified indices.

    This operation can take several minutes for large workspaces, so it runs
    asynchronously to avoid HTTP timeouts.

    Args:
        workspace_ids: List of workspace IDs to remove vector data for
        entities: Optional list of entity types ["issues", "pages"]. If None, removes from both.

    Returns:
        Dictionary with processing results
    """
    log.info("Starting vector data removal task for %d workspaces", len(workspace_ids))

    async def _remove_vectors():
        # Determine which entities to process
        entities_to_process = entities or ["issues", "pages"]

        results: dict[str, list[str] | dict[str, int] | int] = {
            "workspaces_processed": [],
            "workspaces_failed": [],
            "indices_updated": {},
            "total_documents_updated": 0,
        }

        # Process workspaces in batches for better performance
        batch_size = 5  # Process 5 workspaces in parallel

        async def _process_single_workspace(workspace_id: str, vdb: VectorStore) -> tuple[str, int, dict[str, int]]:
            """Process a single workspace and return results."""
            workspace_total = 0
            workspace_indices = {}

            # Process issues index if requested
            if "issues" in entities_to_process:
                try:
                    issues_index = settings.vector_db.ISSUE_INDEX
                    # Remove content_semantic, description_semantic, name_semantic
                    update_body = {
                        "query": {"term": {"workspace_id": workspace_id}},
                        "script": {
                            "source": """
                                ctx._source.remove('content_semantic');
                                ctx._source.remove('description_semantic');
                                ctx._source.remove('name_semantic');
                            """,
                            "lang": "painless",
                        },
                    }

                    response = await vdb.async_os.update_by_query(
                        index=issues_index,
                        body=update_body,
                        wait_for_completion=True,
                        refresh=False,  # Don't refresh immediately for better performance
                    )

                    updated_count = response.get("updated", 0)
                    workspace_total += updated_count
                    workspace_indices["issues"] = updated_count
                    log.info("Removed vector data from %d issues for workspace %s", updated_count, workspace_id)

                except Exception as exc:
                    log.error("Failed to remove vector data from issues index for workspace %s: %s", workspace_id, exc)

            # Process pages index if requested
            if "pages" in entities_to_process:
                try:
                    pages_index = settings.vector_db.PAGES_INDEX
                    # Remove name_semantic, description_semantic
                    update_body = {
                        "query": {"term": {"workspace_id": workspace_id}},
                        "script": {
                            "source": """
                                ctx._source.remove('name_semantic');
                                ctx._source.remove('description_semantic');
                            """,
                            "lang": "painless",
                        },
                    }

                    response = await vdb.async_os.update_by_query(
                        index=pages_index,
                        body=update_body,
                        wait_for_completion=True,
                        refresh=False,  # Don't refresh immediately for better performance
                    )

                    updated_count = response.get("updated", 0)
                    workspace_total += updated_count
                    workspace_indices["pages"] = updated_count
                    log.info("Removed vector data from %d pages for workspace %s", updated_count, workspace_id)

                except Exception as exc:
                    log.error("Failed to remove vector data from pages index for workspace %s: %s", workspace_id, exc)

            return workspace_id, workspace_total, workspace_indices

        try:
            async with VectorStore() as vdb:
                # Process workspaces in batches
                for batch_start in range(0, len(workspace_ids), batch_size):
                    batch_end = min(batch_start + batch_size, len(workspace_ids))
                    batch = workspace_ids[batch_start:batch_end]

                    progress_pct = int((batch_start / len(workspace_ids)) * 100)
                    log.info("Processing batch %d-%d of %d workspaces (%d%%)", batch_start + 1, batch_end, len(workspace_ids), progress_pct)

                    # Process batch in parallel using asyncio.gather
                    batch_tasks = [_process_single_workspace(ws_id, vdb) for ws_id in batch]
                    batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)

                    # Collect results from batch
                    for result in batch_results:
                        if isinstance(result, BaseException):
                            log.error("Batch processing error: %s", result)
                            workspaces_failed = results["workspaces_failed"]
                            assert isinstance(workspaces_failed, list)
                            workspaces_failed.append("unknown")
                        elif isinstance(result, tuple):
                            workspace_id, workspace_total, workspace_indices = result
                            workspaces_processed = results["workspaces_processed"]
                            assert isinstance(workspaces_processed, list)
                            workspaces_processed.append(workspace_id)

                            total_docs = results["total_documents_updated"]
                            assert isinstance(total_docs, int)
                            results["total_documents_updated"] = total_docs + workspace_total

                            # Aggregate index counts
                            indices_updated = results["indices_updated"]
                            assert isinstance(indices_updated, dict)
                            for index_name, count in workspace_indices.items():
                                indices_updated.setdefault(index_name, 0)
                                indices_updated[index_name] += count

                            log.info("Completed workspace %s: %d documents updated", workspace_id, workspace_total)

            # Disable live sync for all successfully processed workspaces in a single optimized query
            workspaces_processed = results["workspaces_processed"]
            assert isinstance(workspaces_processed, list)
            if workspaces_processed:
                try:
                    with db_session() as session:
                        from sqlalchemy import update as sa_update

                        # Use SQLAlchemy core update for synchronous execution
                        stmt = (
                            sa_update(WorkspaceVectorization)  # type: ignore[call-overload]
                            .where(WorkspaceVectorization.workspace_id.in_(workspaces_processed))  # type: ignore[attr-defined]
                            .values(live_sync_enabled=False)
                        )

                        result = session.execute(stmt)
                        session.commit()

                        updated_records = result.rowcount or 0  # type: ignore[union-attr]
                        log.info(
                            "Disabled live sync for %d workspaces (%d records updated)",
                            len(workspaces_processed),
                            updated_records,
                        )
                except Exception as exc:
                    log.error("Failed to disable live sync for workspaces: %s", exc)

            workspaces_processed_final = results["workspaces_processed"]
            workspaces_failed_final = results["workspaces_failed"]
            total_docs_final = results["total_documents_updated"]
            assert isinstance(workspaces_processed_final, list)
            assert isinstance(workspaces_failed_final, list)
            assert isinstance(total_docs_final, int)

            log.info(
                "Vector data removal complete. Processed: %d, Failed: %d, Total documents updated: %d",
                len(workspaces_processed_final),
                len(workspaces_failed_final),
                total_docs_final,
            )

            return results

        except Exception as exc:
            log.error("Error during vector data removal: %s", exc)
            raise

    # Run the async operation
    try:
        result = asyncio.run(_remove_vectors())
        log.info("Vector data removal task completed successfully")
        return {"status": "completed", **result}

    except Exception as exc:
        log.error("Vector data removal task failed: %s", exc)
        raise


# Circuit breaker manual control
@celery_app.task
def reset_circuit_breaker() -> Dict[str, Any]:
    """Manually reset the circuit breaker for emergency recovery."""
    previous_state = {
        "was_open": _db_circuit_breaker.is_open,
        "failure_count": _db_circuit_breaker.failure_count,
    }

    _db_circuit_breaker.is_open = False
    _db_circuit_breaker.failure_count = 0
    _db_circuit_breaker.last_failure_time = None

    log.info("Circuit breaker manually reset. Previous state: %s", previous_state)

    return {
        "status": "reset",
        "previous_state": previous_state,
        "current_state": {
            "is_open": _db_circuit_breaker.is_open,
            "failure_count": _db_circuit_breaker.failure_count,
        },
    }


# Worker startup signals - initialize database when worker starts
@worker_ready.connect
def worker_ready_handler(sender=None, **kwargs):
    """
    Called when the main Celery worker process is ready.
    We no longer pre-initialise the engine here to avoid event-loop mismatch.
    """
    log.info("Celery worker ready – engine will be initialised lazily per process")


@worker_process_init.connect
def worker_process_init_handler(sender=None, **kwargs):
    """Worker process initialisation – no event loop setup needed now."""
    log.info("Worker process %s initialising (no event loop)", os.getpid())
    # Engine will be lazily created on first DB access


@worker_process_shutdown.connect
def worker_process_shutdown_handler(sender=None, **kwargs):
    """Dispose database engine on worker shutdown."""
    log.info("Worker process %s shutting down – disposing DB engine", os.getpid())
    try:
        _cleanup_worker_engine()
    except Exception as exc:
        log.warning("Error during engine cleanup: %s", exc)
