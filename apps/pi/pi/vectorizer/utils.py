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

from __future__ import annotations

import re
from typing import Dict

from pi import logger
from pi.config import Settings
from pi.core.vectordb import VectorStore
from pi.services.retrievers.pg_store import get_ml_model_id_sync

# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------
settings = Settings().vector_db

BULK_SIZE = settings.BULK_SIZE  #  docs per _bulk request (2 × lines)
SCROLL_TIMEOUT = settings.SCROLL_TIMEOUT  #  how long the scroll context lives
EMBED_DIM = settings.EMBEDDING_DIMENSION
FEED_SLICES = max(1, settings.FEED_SLICES) if isinstance(settings.FEED_SLICES, int) and settings.FEED_SLICES > 0 else 1
ML_MODEL_ID = get_ml_model_id_sync()
WORKSPACE_ID = settings.DEV_WORKSPACE_ID

INDICES = {
    "issues": settings.ISSUE_INDEX,
    "pages": settings.PAGES_INDEX,
    "docs": settings.DOCS_INDEX,
}

FEED_FLAGS = {
    "issues": settings.FEED_ISSUES_DATA,
    "pages": settings.FEED_PAGES_DATA,
    "docs": settings.FEED_DOCS_DATA,
}

log = logger.getChild(__name__)

# ---------------------------------------------------------------------------
# Progress tracking class to replace Rich progress bar
# ---------------------------------------------------------------------------


class SimpleProgressTracker:
    """A simple progress tracker that uses standard logger instead of Rich."""

    def __init__(self):
        self.tasks = {}
        self.task_counter = 0

    def add_task(self, description, total):
        """Add a new task to track."""
        task_id = self.task_counter
        self.task_counter += 1
        self.tasks[task_id] = {"description": description, "completed": 0, "total": total}
        log.info(f"Starting task: {description} (0/{total})")
        return task_id

    def update(self, task_id, advance=1):
        """Update the progress of a task."""
        if task_id in self.tasks:
            self.tasks[task_id]["completed"] += advance
            completed = self.tasks[task_id]["completed"]
            total = self.tasks[task_id]["total"]
            desc = self.tasks[task_id]["description"]

            # Calculate reasonable logging intervals
            # Log every 10% or every 100 docs (whichever is larger), plus first and last
            interval = max(100, int(total * 0.1))

            should_log = (
                completed == 1  # First item
                or completed == total  # Last item
                or completed % interval == 0  # Regular intervals
            )

            if should_log:
                log.info(f"Progress: {desc} - {completed}/{total}")

    def remove_task(self, task_id):
        """Remove a task from tracking."""
        if task_id in self.tasks:
            desc = self.tasks[task_id]["description"]
            completed = self.tasks[task_id]["completed"]
            total = self.tasks[task_id]["total"]
            log.info(f"Completed task: {desc} - {completed}/{total}")
            del self.tasks[task_id]

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass


# Create a singleton instance
progress_bar = SimpleProgressTracker()

# ---------------------------------------------------------------------------
# Pretty startup banner
# ---------------------------------------------------------------------------


def _print_start_banner() -> None:
    """Display a banner with feeder settings using standard logger."""
    log.info("🧠 Vector Feeder Settings 🧠")
    log.info(f"Feed issues: {FEED_FLAGS["issues"]}")
    log.info(f"Feed pages: {FEED_FLAGS["pages"]}")
    log.info(f"Feed documentation: {FEED_FLAGS["docs"]}")
    log.info(f"Bulk size: {BULK_SIZE}")
    log.info(f"Scroll timeout: {SCROLL_TIMEOUT}")
    log.info(f"Embedding dim: {EMBED_DIM}")
    log.info(f"ML model ID: {ML_MODEL_ID or "<NONE>"}")
    log.info(f"Workspace ID: {WORKSPACE_ID or "<NONE>"}")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _validate_field_map(field_map: Dict[str, str]) -> None:
    tgt_seen: set[str] = set()
    for tgt in field_map.values():
        if tgt in tgt_seen:
            raise ValueError(f"duplicate target field mapping: {tgt}")
        tgt_seen.add(tgt)


async def _purge_dim_mismatch(vdb: VectorStore, index: str, field: str) -> None:
    """Remove vectors that have the wrong length so KNN queries never crash."""
    script = {
        "source": (
            f"if (ctx._source.containsKey('{field}')) {{ "
            f"    if (ctx._source['{field}'] == null || ctx._source['{field}'].length != params.dim) "
            f"        ctx._source.remove('{field}'); "
            f" }}"
        ),
        "lang": "painless",
        "params": {"dim": EMBED_DIM},
    }

    # Fix: Use async client and handle FEED_SLICES properly
    slices_value = FEED_SLICES if isinstance(FEED_SLICES, int) else 1

    await vdb.async_os.update_by_query(
        index=index,
        body={"script": script, "query": {"exists": {"field": field}}},
        conflicts="proceed",  # type: ignore[arg-type]
        refresh=True,  # type: ignore[arg-type]
        slices=slices_value,  # type: ignore[arg-type]
        request_timeout=3600,  # type: ignore[arg-type]
    )


def _sanitize_ml_content(text: str) -> str:
    """
    Sanitize text content to prevent ML connector property interpolation conflicts.

    This specifically handles cases where documentation content contains OpenSearch API
    examples that interfere with the ML connector's ${parameters.texts} interpolation.
    """
    if not text:
        return text

    # Remove or neutralize patterns that interfere with ML connector interpolation
    # Pattern 1: Remove entire ML predict API calls that contain parameter examples
    text = re.sub(
        r'POST\s+/_plugins/_ml/models/[^/]+/_predict\s*\{[^}]*"parameters"[^}]*\}[^}]*\}',
        "[ML API example removed]",
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )

    # Pattern 2: Remove standalone parameter blocks that could interfere (for both input and texts)
    text = re.sub(
        r'\{\s*"parameters"\s*:\s*\{[^}]*"(input|texts)"\s*:[^}]*\}\s*\}',
        "[Parameter example removed]",
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )

    # Pattern 3: Replace problematic interpolation patterns
    text = re.sub(r"\$\{[^}]*parameters[^}]*\}", "[interpolation pattern]", text)

    # Pattern 4: Neutralize any remaining "input": [...] or "texts": [...] patterns in JSON-like structures
    text = re.sub(r'"(input|texts)"\s*:\s*\[[^\]]*\]', '"text_example": [...]', text, flags=re.IGNORECASE)

    return text
