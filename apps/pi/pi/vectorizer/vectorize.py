#!/usr/bin/env python3
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
Vector-back-fill utility for OpenSearch.
Runs async, batches /predict calls, scrolls the index in parallel slices,
and keeps bulk uploads under control with a semaphore.
"""

from __future__ import annotations

import asyncio
import re  # ← for parsing retry-after seconds from 429 messages
from copy import deepcopy
from typing import Any
from typing import Dict
from typing import List
from typing import Sequence
from typing import Tuple

from aiolimiter import AsyncLimiter  # New import for Cohere RPM limiting

from pi import logger
from pi.config import Settings
from pi.core.embedding_config import active_model_supports_batch
from pi.core.embedding_config import get_embedding_param_from_active_model
from pi.core.vectordb import VectorStore
from pi.services.retrievers.pg_store import get_ml_model_id_sync

from .docs import process_repo_contents
from .utils import _print_start_banner
from .utils import _sanitize_ml_content
from .utils import _validate_field_map
from .utils import progress_bar

# ───────────────────── Settings ─────────────────────
settings = Settings().vector_db
BATCH_IN: int = settings.BATCH_SIZE  # texts to embed per /predict call
BULK_SIZE: int = BATCH_IN  # (Deprecated): docs per bulk-API request
SCROLL_TIMEOUT: str = settings.SCROLL_TIMEOUT  # keep_alive for PIT id's
FEED_SLICES: int = settings.FEED_SLICES  # how many parallel scroll slices
ML_MODEL_ID: str | None = get_ml_model_id_sync()  # OpenSearch-ML model id
MAX_RETRIES: int = 3  # attempts per failed batch
BULK_CONCURRENCY: int = FEED_SLICES  # simultaneous bulk requests allowed
WORKSPACE_ID: str | None = None  # Deprecated: use explicit workspace_id param instead

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
SEM = asyncio.Semaphore(BULK_CONCURRENCY)  # gate that limits in-flight bulk calls

# New globals for Cohere rate limiting
COHERE_LIMITER = AsyncLimiter(600, 60)  # 600 requests per minute
EMBED_CONCURRENCY = 60  # Max concurrent Cohere calls (tune to ~360 RPM at 10s latency)
EMBED_SEM = asyncio.Semaphore(EMBED_CONCURRENCY)


# ─────────────────── Helper: batched predict ────────────────────
async def _batched_predict(
    vdb: VectorStore, texts: Sequence[str], slice_id: int | None = None, batch_meta: List[Tuple[str, str]] | None = None
) -> List[List[float]]:
    """
    Predict embeddings for a batch of texts.
    Uses try-catch approach to only sanitize content when property interpolation errors occur.
    Now includes Cohere rate limiting with AsyncLimiter and semaphore.

    Args:
        vdb: VectorStore instance
        texts: Sequence of texts to embed
        slice_id: Identifier for this batch (for error tracing)
        batch_meta: Optional list of (doc_id, text) tuples for enhanced error logging

    Returns:
        List of embedding vectors

    Raises:
        Exception: If prediction fails after validation
    """
    # Validate inputs
    if not texts:
        log.warning("Slice %s: Empty texts list provided", slice_id)
        return []

    if not ML_MODEL_ID:
        raise ValueError(f"Slice {slice_id}: ML_MODEL_ID is not configured")

    # Get the parameter name for the active embedding model
    param_name = get_embedding_param_from_active_model()
    is_batch = active_model_supports_batch()

    # Apply rate limiting
    async with EMBED_SEM:  # Limit concurrent embedding calls
        await COHERE_LIMITER.acquire()  # Respect RPM limits

        log.debug("Slice %s: Acquired rate limit tokens for batch of %d texts", slice_id, len(texts))

        # ── Non-batch models (Bedrock Titan): one request per text ──
        if not is_batch:
            vectors = []
            for idx, text in enumerate(texts):
                single_body: Dict[str, Any] = {"parameters": {param_name: text}}  # single string
                try:
                    resp = await vdb.async_os.transport.perform_request(
                        "POST",
                        f"/_plugins/_ml/models/{ML_MODEL_ID}/_predict",
                        body=single_body,
                    )
                    output = resp["inference_results"][0]["output"][0]
                    vectors.append([float(x) for x in output["data"]])
                except Exception as e:
                    log.error("Slice %s: Failed to embed text %d/%d: %s", slice_id, idx, len(texts), e)
                    raise
            log.debug("Slice %s: Successfully generated %d vectors (individual)", slice_id, len(vectors))
            return vectors

        # ── Batch models (OpenAI / Cohere): single request for all texts ──
        batch_body: Dict[str, Any] = {"parameters": {param_name: list(texts)}}

        try:
            resp = await vdb.async_os.transport.perform_request(
                "POST",
                f"/_plugins/_ml/models/{ML_MODEL_ID}/_predict",
                body=batch_body,
            )

            # Validate response structure
            if not isinstance(resp, dict):
                raise ValueError(f"Slice {slice_id}: Invalid response type: {type(resp)}")

            if "inference_results" not in resp:
                raise ValueError(f"Slice {slice_id}: Missing 'inference_results' in response: {list(resp.keys())}")

            if "output" not in resp["inference_results"][0]:
                raise ValueError(f"Slice {slice_id}: Missing 'output' in inference_results[0]: {list(resp["inference_results"][0].keys())}")

            # Extract vectors
            outputs = resp["inference_results"][0]["output"]
            if not isinstance(outputs, list):
                raise ValueError(f"Slice {slice_id}: Invalid output type: {type(outputs)}")

            vectors = []
            for i, out in enumerate(outputs):
                vector = out["data"]
                vectors.append([float(x) for x in vector])

            # Validate vector count matches input count
            if len(vectors) != len(texts):
                raise ValueError(f"Slice {slice_id}: Vector count mismatch - got {len(vectors)}, expected {len(texts)}")

            log.debug("Slice %s: Successfully generated %d vectors", slice_id, len(vectors))
            return vectors

        except Exception as e:
            # Check if this is the specific property interpolation error
            error_str = str(e)
            # ───────────── handle rate-limit (HTTP 429) explicitly ─────────────
            if ("status_exception" in error_str and "429" in error_str) or "Rate limit is exceeded" in error_str:
                # Try to extract the provider-suggested wait time
                wait_sec = 10  # sensible default
                m = re.search(r"(\d+)\s+seconds", error_str)
                if m:
                    try:
                        wait_sec = int(m.group(1)) + 1  # add 1-sec cushion
                    except ValueError:
                        log.warning("Slice %s: Failed to parse retry-after seconds from 429 message: %s", slice_id, error_str)
                        pass

                log.warning(
                    "Slice %s: Remote service rate-limited the request – sleeping for %s seconds before retrying",
                    slice_id,
                    wait_sec,
                )
                await asyncio.sleep(wait_sec)
                # Re-enter the function recursively to retry with same payload
                return await _batched_predict(vdb, texts, slice_id, batch_meta)

            if (
                "infinite loop in property interpolation" in error_str.lower()
                or "illegal_state_exception" in error_str.lower()
                or "illegal_argument_exception" in error_str.lower()
                or "Some parameter placeholder not filled in payload: input" in error_str.lower()
                or "Some parameter placeholder not filled in payload: texts" in error_str.lower()
            ):
                log.warning(
                    "Slice %s: Property interpolation error detected in batch of %d texts. Attempting sanitization and retry...", slice_id, len(texts)
                )

                # Sanitize the problematic content and retry
                sanitized_texts = []
                any_sanitized = False

                for i, text in enumerate(texts):
                    sanitized = _sanitize_ml_content(text)
                    if sanitized != text:
                        log.info("Slice %s: Sanitized problematic content in batch item %d", slice_id, i)
                        any_sanitized = True
                    sanitized_texts.append(sanitized)

                if not any_sanitized:
                    log.warning("Slice %s: No obvious problematic content found during sanitization. Error may be from other causes.", slice_id)

                # Retry with sanitized content, using the same parameter name
                sanitized_body = {"parameters": {param_name: sanitized_texts}}

                try:
                    resp = await vdb.async_os.transport.perform_request(
                        "POST",
                        f"/_plugins/_ml/models/{ML_MODEL_ID}/_predict",
                        body=sanitized_body,
                    )

                    # Extract vectors
                    outputs = resp["inference_results"][0]["output"]
                    if not isinstance(outputs, list):
                        raise ValueError(f"Slice {slice_id}: Invalid output type: {type(outputs)}")

                    vectors = []
                    for i, out in enumerate(outputs):
                        vector = out["data"]
                        vectors.append([float(x) for x in vector])

                    log.info("Slice %s: Successfully processed batch after sanitization", slice_id)
                    return vectors

                except Exception as retry_error:
                    log.error("Slice %s: Failed even after sanitization. Original error: %s", slice_id, error_str)
                    log.error("Slice %s: Retry error: %s", slice_id, retry_error)

                    # Log sample of problematic texts for debugging
                    if batch_meta:
                        log.error("Slice %s: Sample documents with texts (first 5):", slice_id)
                        for i, (doc_id, text) in enumerate(batch_meta[:5]):
                            log.error("  [%d] ID: %s | Text: %s (length: %d)", i, doc_id, text[:200], len(text))
                    elif texts:
                        log.error("Slice %s: Sample texts (first 5):", slice_id)
                        for i, text in enumerate(texts[:5]):
                            log.error("  [%d]: %s (length: %d)", i, text[:200], len(text))

                    raise retry_error
            else:
                # Re-raise other types of errors without sanitization
                log.error("Slice %s: Non-interpolation error in ML prediction - %s: %s", slice_id, type(e).__name__, error_str)
                log.error("Slice %s: Input details - count: %d, model_id: %s", slice_id, len(texts), ML_MODEL_ID)

                # Log sample of problematic texts for debugging
                if batch_meta:
                    log.error("Slice %s: Sample documents with texts (first 5):", slice_id)
                    for i, (doc_id, text) in enumerate(batch_meta[:5]):
                        log.error("  [%d] ID: %s | Text: %s (length: %d)", i, doc_id, text[:200], len(text))
                elif texts:
                    log.error("Slice %s: Sample texts (first 5):", slice_id)
                    for i, text in enumerate(texts[:5]):
                        log.error("  [%d]: %s (length: %d)", i, text[:200], len(text))

                # Re-raise with slice context
                raise Exception(f"Slice {slice_id} prediction failed: {e}") from e


# ─────────────────── Common Helper Functions ─────────────────────
async def _create_bulk_flush_helper(
    vdb: VectorStore,
    index_name: str,
    bulk_ops: List[dict],
    failed_ids: List[str],
    local_sem: asyncio.Semaphore,
    task_id: int | None = None,
    slice_id: int | None = None,
):
    """Create a bulk flush helper function with shared logic."""

    async def flush_bulk() -> None:
        if not bulk_ops:
            return
        try:
            async with local_sem:  # respect concurrency cap
                resp = await vdb.async_os.bulk(  # type: ignore[arg-type]
                    body=bulk_ops,
                    refresh=False,  # type: ignore[arg-type]
                    request_timeout=600,  # type: ignore[arg-type]
                )
            if resp.get("errors"):  # capture per-doc failures
                for item in resp["items"]:
                    upd = item.get("update") or item.get("index")
                    if upd and upd.get("status", 200) >= 400:
                        failed_ids.append(upd["_id"])
                        error_msg = f"Bulk operation failed for doc {upd["_id"]}: {upd.get("error", "unknown error")}"
                        if slice_id is not None:
                            log.error("Slice %d: %s", slice_id, error_msg)
                        else:
                            log.error("%s", error_msg)
            if task_id is not None:
                progress_bar.update(task_id, advance=len(bulk_ops) // 2)
            bulk_ops.clear()  # reset buffer
        except Exception as exc:
            error_msg = f"Bulk flush failed: {exc}"
            if slice_id is not None:
                log.error("Slice %d: %s", slice_id, error_msg)
            else:
                log.error("%s", error_msg)
            # Mark all docs in current batch as failed
            doc_ids = [op.get("update", {}).get("_id") for op in bulk_ops[::2] if "update" in op]
            failed_ids.extend([doc_id for doc_id in doc_ids if doc_id])
            bulk_ops.clear()

    return flush_bulk


async def _create_embed_and_queue_helper(
    vdb: VectorStore,
    index_name: str,
    src_field: str,
    tgt_field: str,
    batch_txt: List[str],
    batch_meta: List[Tuple[str, str]],
    bulk_ops: List[dict],
    failed_ids: List[str],
    flush_bulk_func,
    local_batch_in: int,
    slice_id: int | None = None,
    processed_docs: int = 0,
):
    """Create an embed and queue helper function with shared logic."""

    async def embed_and_queue() -> None:
        if not batch_txt:
            return

        log.debug("Slice %s: Starting embedding for batch of %d texts", slice_id if slice_id is not None else "live", len(batch_txt))

        # Apply rate limiting at the embed_and_queue level for additional control
        async with EMBED_SEM:  # Ensure we don't exceed concurrent embedding calls
            await COHERE_LIMITER.acquire()  # Respect 600 RPM limit

            for attempt in range(1, MAX_RETRIES + 1):  # retry ML failures
                try:
                    vectors = await _batched_predict(vdb, batch_txt, slice_id, batch_meta)
                    break
                except Exception as exc:
                    if slice_id is not None:
                        log.error("Slice %d: Attempt %d/%d failed: %s", slice_id, attempt, MAX_RETRIES, exc)
                    else:
                        log.error("Attempt %d/%d failed: %s", attempt, MAX_RETRIES, exc)

                    if attempt == MAX_RETRIES:
                        if slice_id is not None:
                            log.error(
                                "Slice %d: Failed after %d retries – marking %d docs as failed",
                                slice_id,
                                MAX_RETRIES,
                                len(batch_meta),
                            )
                        else:
                            log.error(
                                "Failed after %d retries – marking %d docs as failed",
                                MAX_RETRIES,
                                len(batch_meta),
                            )

                        failed_ids.extend([m[0] for m in batch_meta])
                        batch_txt.clear()
                        batch_meta.clear()
                        return
                    await asyncio.sleep(1.5 * attempt)  # back-off

            log.debug("Slice %s: Generated %d vectors from %d texts", slice_id if slice_id is not None else "live", len(vectors), len(batch_txt))

            queued_count = 0
            for (doc_id, original), vec in zip(batch_meta, vectors):
                if not isinstance(vec, list) or not all(isinstance(x, float) for x in vec):
                    failed_ids.append(doc_id)  # skip bad vector
                    error_msg = f"Invalid vector for doc {doc_id}: {type(vec)}"
                    if slice_id is not None:
                        log.error("Slice %d: %s", slice_id, error_msg)
                    else:
                        log.error("%s", error_msg)
                    continue
                doc: Dict[str, Any] = {tgt_field: vec}
                if tgt_field == "content_semantic":
                    doc["content"] = original  # record combined text
                bulk_ops.extend([
                    {"update": {"_index": index_name, "_id": doc_id}},
                    {"doc": doc},
                ])
                queued_count += 1

            log.debug("Slice %s: Queued %d document updates", slice_id if slice_id is not None else "live", queued_count)

            batch_txt.clear()
            batch_meta.clear()  # reset batch lists
            if len(bulk_ops) >= local_batch_in * 2:  # two lines per doc
                await flush_bulk_func()

    return embed_and_queue


# ─────────────────── Embedding pipeline ─────────────────────────
async def populate_embeddings(
    vdb: VectorStore,
    index_name: str,
    field_map: Dict[str, str],
    live: bool = False,
    ids: list[str] = [],
    *,
    workspace_id: str | None = None,  # NEW: explicit param
    feed_slices: int | None = None,
    batch_size: int | None = None,
    bulk_size: int | None = None,
    metachunk_size: int | None = None,  # New: e.g., 100000
    sort_field: str = "_id",  # New: unique field for sorting
) -> None:
    local_feed_slices = feed_slices if feed_slices is not None else 16  # Increased for more parallelism
    local_batch_in = batch_size if batch_size is not None else BATCH_IN
    local_bulk_concurrency = local_feed_slices  # Align with slices
    local_metachunk_size = metachunk_size if metachunk_size is not None else 1000

    if live:
        local_feed_slices = 1  # Live mode doesn't use parallel slices

    local_sem = asyncio.Semaphore(local_bulk_concurrency)

    if not ML_MODEL_ID:  # guard against missing model id
        log.error("ML_MODEL_ID missing - skip %s", index_name)
        return
    _validate_field_map(field_map)  # sanity-check mapping keys

    # Create Point-in-Time (PIT) for consistent querying (only for non-live mode)
    pit_id = None
    if not live:
        pit_response = await vdb.async_os.create_pit(index=index_name, params={"keep_alive": SCROLL_TIMEOUT})
        pit_id = pit_response["pit_id"]
        log.info("Created PIT %s for index %s", pit_id, index_name)

    for src_field, tgt_field in field_map.items():  # process each field pair
        if not live:
            log.info("%s → %s on %s", src_field, tgt_field, index_name)
        # await _purge_dim_mismatch(vdb, index_name, tgt_field)  # remove bad-dimension do

        # ─────────── Fast-path for live sync ────────────
        # When `live` is True we already have the exact document IDs that
        # require (re-)embedding. We'll fetch these specific documents and
        # process them through the standard embedding pipeline.

        if live and ids:
            log.info("Processing %d specific documents for %s → %s", len(ids), src_field, tgt_field)

            # Fetch documents by their IDs in batches
            batch_ops: list[dict] = []  # queued bulk actions
            failed_ids: list[str] = []  # doc ids that failed
            batch_txt: list[str] = []  # texts waiting for ML
            batch_meta: list[tuple[str, str]] = []  # (doc_id, original_text)
            processed_count = 0
            skipped_count = 0  # New: track skipped documents

            # Create shared helper functions
            flush_bulk = await _create_bulk_flush_helper(vdb, index_name, batch_ops, failed_ids, local_sem)
            embed_and_queue = await _create_embed_and_queue_helper(
                vdb, index_name, src_field, tgt_field, batch_txt, batch_meta, batch_ops, failed_ids, flush_bulk, local_batch_in
            )

            # Process documents in chunks to avoid overwhelming the mget API
            chunk_size = local_batch_in
            for i in range(0, len(ids), chunk_size):
                chunk_ids = ids[i : i + chunk_size]

                # Determine source fields to fetch based on target field
                if tgt_field == "content_semantic":
                    source_fields = ["name", "description"]
                elif tgt_field == "name_semantic":
                    source_fields = ["name"]
                elif tgt_field == "description_semantic":
                    source_fields = ["description"]
                else:
                    source_fields = [src_field]

                # Fetch documents by ID
                try:
                    docs_body = [{"_index": index_name, "_id": doc_id, "_source": source_fields} for doc_id in chunk_ids]
                    mget_response = await vdb.async_os.mget(body={"docs": docs_body})

                    for doc_result in mget_response["docs"]:
                        if not doc_result.get("found", False):
                            log.warning("Document not found: %s", doc_result.get("_id", "unknown"))
                            continue

                        doc_id = doc_result["_id"]
                        src = doc_result["_source"]

                        # Extract text based on field type
                        if tgt_field == "content_semantic":
                            # Require BOTH name and description to be non-empty (≥ 3 chars each)
                            name = (src.get("name", "") or "").strip()
                            desc = (src.get("description", "") or "").strip()

                            if len(name) >= 3 and len(desc) >= 3:
                                text = f"{name} {desc}"
                            else:
                                text = ""
                        elif tgt_field == "name_semantic":
                            # For name_semantic, use name field
                            text = (src.get("name", "") or "").strip()
                        elif tgt_field == "description_semantic":
                            # For description_semantic, use description field
                            text = (src.get("description", "") or "").strip()
                        else:
                            # For other fields, use the source field directly
                            text = (src.get(src_field, "") or "").strip()

                        processed_count += 1  # Increment before checking
                        if len(text) < 3:  # ignore trivial strings
                            log.debug("Skipping doc %s for %s: text too short (%d chars)", doc_id, tgt_field, len(text))
                            skipped_count += 1
                            continue

                        batch_txt.append(text)
                        batch_meta.append((doc_id, text))

                        if len(batch_txt) >= local_batch_in:  # batch full → embed
                            log.debug("Processing batch of %d texts in live mode", len(batch_txt))
                            await embed_and_queue()

                except Exception as exc:
                    log.error("Error fetching documents %s: %s", chunk_ids, exc)
                    failed_ids.extend(chunk_ids)

            # Process any remaining batch
            if batch_txt:
                log.debug("Processing final batch of %d texts in live mode", len(batch_txt))
            await embed_and_queue()
            await flush_bulk()

            log.info(
                "Live sync finished %s→%s: processed %d (skipped %d), ok %d, failed %d",
                src_field,
                tgt_field,
                processed_count,
                skipped_count,
                processed_count - skipped_count - len(failed_ids),
                len(failed_ids),
            )

            # Continue to next field mapping
            continue

        # ─────────── Standard back-fill path ────────────

        # Base query pulls docs that NEED embeddings
        if tgt_field == "content_semantic":  # special case: concat name+desc
            base_query = {
                "query": {
                    "bool": {
                        "must": [
                            {
                                "bool": {
                                    "should": [
                                        {"exists": {"field": "name"}},
                                        {"exists": {"field": "description"}},
                                    ],
                                    "minimum_should_match": 2,
                                }
                            }
                        ],
                        "must_not": [{"exists": {"field": tgt_field}}],
                    }
                },
                "_source": ["name", "description"],
                "track_total_hits": True,
                "sort": [{sort_field: {"order": "asc"}}],  # Add sort for search_after
            }
        else:  # normal single-field embedding
            base_query = {
                "query": {
                    "bool": {
                        "must": [{"exists": {"field": src_field}}],
                        "must_not": [{"exists": {"field": tgt_field}}],
                    }
                },
                "_source": [src_field],
                "track_total_hits": True,
                "sort": [{sort_field: {"order": "asc"}}],  # Add sort for search_after
            }

        # add workspace_id to the query if it is not None
        if workspace_id:
            if not live:
                log.info("Feeding data for workspace: %s", workspace_id)
            base_query["query"]["bool"].setdefault("filter", []).append({"term": {"workspace_id": workspace_id}})  # type: ignore[index]

        # ─────────── Metachunk loop with Search After + Slicing ────────────

        # First, check if there are any documents to process
        try:
            count_query = deepcopy(base_query)
            count_query["size"] = 0  # We only want the count
            if pit_id is not None:
                count_query["pit"] = {"id": pit_id, "keep_alive": SCROLL_TIMEOUT}
                search_index = None
            else:
                search_index = index_name

            count_response = await vdb.async_os.search(index=search_index, body=count_query)
            total_hits = count_response["hits"]["total"]["value"]

            if total_hits == 0:
                log.info("No documents need processing for %s → %s, skipping", src_field, tgt_field)
                continue  # Skip to next field mapping

            log.info("Found %d documents needing processing for %s → %s", total_hits, src_field, tgt_field)
        except Exception as exc:
            log.error("Failed to count documents for %s→%s: %s", src_field, tgt_field, exc)
            continue  # Skip to next field mapping

        metachunk_count = 0
        search_after_values: list[Any] | None = None  # Type hint for mypy
        total_processed = 0

        try:
            while True:  # Outer metachunk loop
                metachunk_count += 1
                log.info("Processing metachunk %d for %s → %s", metachunk_count, src_field, tgt_field)

                # Clone base query for this metachunk
                metachunk_query = deepcopy(base_query)
                metachunk_query["size"] = local_metachunk_size

                # Add search_after if not first metachunk
                if search_after_values is not None:
                    metachunk_query["search_after"] = search_after_values

                # Add PIT to query if available
                if pit_id is not None:
                    metachunk_query["pit"] = {"id": pit_id, "keep_alive": SCROLL_TIMEOUT}
                    # Remove index from query when using PIT
                    search_index = None
                else:
                    search_index = index_name

                # Fetch metachunk of documents
                try:
                    metachunk_response = await vdb.async_os.search(index=search_index, body=metachunk_query)
                except Exception as exc:
                    log.error("Failed to fetch metachunk %d for %s→%s: %s", metachunk_count, src_field, tgt_field, exc)
                    break

                metachunk_hits = metachunk_response["hits"]["hits"]
                if not metachunk_hits:
                    log.info("No more documents found. Metachunk processing complete for %s → %s", src_field, tgt_field)
                    break

                log.info("Metachunk %d: Retrieved %d documents", metachunk_count, len(metachunk_hits))

                # Update search_after for next iteration
                if metachunk_hits:
                    search_after_values = metachunk_hits[-1]["sort"]

                # Process this metachunk with parallel slicing
                metachunk_processed = await _process_metachunk_with_slicing(
                    vdb=vdb,
                    index_name=index_name,
                    src_field=src_field,
                    tgt_field=tgt_field,
                    metachunk_hits=metachunk_hits,
                    local_feed_slices=local_feed_slices,
                    local_batch_in=local_batch_in,
                    local_sem=local_sem,
                    live=live,
                )

                total_processed += metachunk_processed
                log.info("Metachunk %d complete: processed %d documents (total: %d)", metachunk_count, metachunk_processed, total_processed)

                # If we got fewer docs than requested, we've reached the end
                if len(metachunk_hits) < local_metachunk_size:
                    log.info("Reached end of documents for %s → %s", src_field, tgt_field)
                    break

        except Exception as exc:
            log.error("Error in metachunk processing for %s→%s: %s", src_field, tgt_field, exc)

        log.info("Metachunk processing complete for %s → %s: %d total documents processed", src_field, tgt_field, total_processed)

        # Continue to next field mapping
        continue

    # Close PIT at the end
    if pit_id is not None:
        try:
            await vdb.async_os.delete_pit(body={"pit_id": pit_id})
            log.info("Closed PIT %s", pit_id)
        except Exception as exc:
            log.warning("Failed to close PIT %s: %s", pit_id, exc)


async def _process_metachunk_with_slicing(
    vdb: VectorStore,
    index_name: str,
    src_field: str,
    tgt_field: str,
    metachunk_hits: List[dict],
    local_feed_slices: int,
    local_batch_in: int,
    local_sem: asyncio.Semaphore,
    live: bool = False,
) -> int:
    """
    Process a metachunk of documents by distributing them across parallel slices.

    Args:
        vdb: VectorStore instance
        index_name: Name of the index
        src_field: Source field name
        tgt_field: Target field name
        metachunk_hits: List of document hits from the metachunk
        local_feed_slices: Number of parallel slices
        local_batch_in: Batch size for embeddings
        local_sem: Semaphore for bulk operations
        live: Whether this is live mode (affects logging)

    Returns:
        Total number of documents processed
    """
    if not metachunk_hits:
        return 0

    # Distribute documents across slices
    slice_docs: list[list[dict]] = [[] for _ in range(local_feed_slices)]
    for i, doc in enumerate(metachunk_hits):
        slice_id = i % local_feed_slices
        slice_docs[slice_id].append(doc)

    log.info("Distributed %d documents across %d slices", len(metachunk_hits), local_feed_slices)

    # Track total processed documents
    total_processed = 0

    async def _process_slice_documents(slice_id: int, docs: List[dict]) -> int:
        """Process documents for a specific slice."""
        if not docs:
            return 0

        log.debug("Slice %d: Processing %d documents", slice_id, len(docs))

        bulk_ops: List[dict] = []
        failed_ids: List[str] = []
        batch_txt: List[str] = []
        batch_meta: List[Tuple[str, str]] = []
        slice_processed = 0
        slice_skipped = 0

        # Create helper functions for this slice
        flush_bulk = await _create_bulk_flush_helper(vdb, index_name, bulk_ops, failed_ids, local_sem, None, slice_id)
        embed_and_queue = await _create_embed_and_queue_helper(
            vdb, index_name, src_field, tgt_field, batch_txt, batch_meta, bulk_ops, failed_ids, flush_bulk, local_batch_in, slice_id
        )

        try:
            for doc in docs:
                try:
                    doc_id, src = doc["_id"], doc["_source"]
                    slice_processed += 1

                    # Extract text based on target field type
                    if tgt_field == "content_semantic":
                        name = (src.get("name") or "").strip()
                        description = (src.get("description") or "").strip()
                        if len(name) < 3 or len(description) < 3:
                            slice_skipped += 1
                            continue
                        text = f"{name} {description}"
                    else:
                        text = (src.get(src_field, "") or "").strip()
                        if len(text) < 3:
                            slice_skipped += 1
                            continue

                    batch_txt.append(text)
                    batch_meta.append((doc_id, text))

                    # Process batch when full
                    if len(batch_txt) >= local_batch_in:
                        log.debug("Slice %d: Processing batch of %d texts", slice_id, len(batch_txt))
                        await embed_and_queue()

                except Exception as exc:
                    log.error("Slice %d: Error processing document %s: %s", slice_id, doc.get("_id", "unknown"), exc)
                    continue

            # Process remaining batch
            if batch_txt:
                log.debug("Slice %d: Processing final batch of %d texts", slice_id, len(batch_txt))
                await embed_and_queue()

            # Flush remaining bulk operations
            await flush_bulk()

        except Exception as exc:
            log.error("Slice %d: Error in document processing: %s", slice_id, exc)

        log.info(
            "Slice %d complete: processed %d (skipped %d), ok %d, failed %d",
            slice_id,
            slice_processed,
            slice_skipped,
            slice_processed - slice_skipped - len(failed_ids),
            len(failed_ids),
        )

        return slice_processed - slice_skipped

    # Process all slices in parallel
    if local_feed_slices <= 1:
        total_processed = await _process_slice_documents(0, metachunk_hits)
    else:
        slice_results = await asyncio.gather(*[_process_slice_documents(i, slice_docs[i]) for i in range(local_feed_slices)])
        total_processed = sum(slice_results)

    return total_processed


async def _process_fields(vdb, index_name, *, workspace_id: str | None = None):
    try:
        missing_name_vectors, _ = await vdb.missing_vectors_count(index_name, "name", "name_semantic", workspace_id=workspace_id)
        missing_description_vectors, _ = await vdb.missing_vectors_count(index_name, "description", "description_semantic", workspace_id=workspace_id)
        if index_name == INDICES["issues"]:
            missing_content_vectors, _ = await vdb.missing_vectors_count(index_name, "content", "content_semantic", workspace_id=workspace_id)
        else:
            missing_content_vectors = 0

        total_missing = sum([missing_name_vectors, missing_description_vectors, missing_content_vectors])
        log.info(
            "Missing vectors for %s: name=%d, description=%d, content=%d, total=%d",
            index_name,
            missing_name_vectors,
            missing_description_vectors,
            missing_content_vectors,
            total_missing,
        )

        return total_missing
    except Exception as exc:
        log.error("Error counting missing vectors for %s: %s", index_name, exc)
        return 0


# ─────────────────────────── main ─────────────────────────────
async def main() -> None:
    _print_start_banner()  # show banner / ASCII art
    try:
        async with VectorStore() as vdb:  # open async OS client
            with progress_bar:  # live progress UI
                # ---------- issues ----------
                if FEED_FLAGS["issues"]:
                    log.info("Processing issues…")
                    prev_missing_issue_count: int | None = None
                    progress_guard = 0

                    try:
                        while True:
                            missing_vectors = await _process_fields(vdb, INDICES["issues"], workspace_id=settings.DEV_WORKSPACE_ID)

                            # 1. nothing to do → leave immediately
                            if missing_vectors == 0:
                                log.info("No missing vectors left - exiting loop.")
                                break

                            # 2. no progress? bump guard counter
                            if prev_missing_issue_count is not None and missing_vectors == prev_missing_issue_count:
                                progress_guard += 1
                                if progress_guard >= 3:  # ← 3 identical counts in a row
                                    log.info("Missing-vector count unchanged for 3 consecutive iterations - exiting loop.")
                                    break
                            else:
                                progress_guard = 0  # 3. reset as soon as we see progress

                            prev_missing_issue_count = missing_vectors

                            await populate_embeddings(
                                vdb,
                                INDICES["issues"],
                                {
                                    "name": "name_semantic",
                                    "description": "description_semantic",
                                    "content": "content_semantic",
                                },
                                live=False,
                                workspace_id=settings.DEV_WORKSPACE_ID,  # Use setting directly, avoid deprecated global
                            )
                    except Exception as exc:
                        log.error("Error processing issues: %s", exc)

                # ---------- pages ----------
                if FEED_FLAGS["pages"]:
                    log.info("Processing pages…")
                    prev_missing_page_count: int | None = None
                    progress_guard = 0

                    try:
                        while True:
                            missing_vectors = await _process_fields(vdb, INDICES["pages"], workspace_id=settings.DEV_WORKSPACE_ID)

                            # 1. nothing to do → leave immediately
                            if missing_vectors == 0:
                                log.info("No missing vectors left - exiting loop.")
                                break

                            # 2. no progress? bump guard counter
                            if prev_missing_page_count is not None and missing_vectors == prev_missing_page_count:
                                progress_guard += 1
                                if progress_guard >= 3:
                                    log.info("Missing-vector count unchanged for 3 consecutive iterations - exiting loop.")
                                    break
                            else:
                                progress_guard = 0  # 3. reset as soon as we see progress

                            prev_missing_page_count = missing_vectors

                            await populate_embeddings(
                                vdb,
                                INDICES["pages"],
                                {"name": "name_semantic", "description": "description_semantic"},
                                live=False,
                                workspace_id=settings.DEV_WORKSPACE_ID,  # Use setting directly, avoid deprecated global
                            )
                    except Exception as exc:
                        log.error("Error processing pages: %s", exc)

                # ---------- docs ----------
                if FEED_FLAGS["docs"]:
                    try:
                        repos = [r.strip() for r in settings.DOCS_REPO_NAME.split(",") if r.strip()]
                        log.info("Processing %d documentation repositories…", len(repos))
                        total_ok = total_fail = 0
                        for i, repo in enumerate(repos, 1):
                            try:
                                log.info("Repo %d/%d: %s", i, len(repos), repo)
                                docs = process_repo_contents(repo)  # read repo files
                                if docs:
                                    ok, failed = await vdb.async_feed(INDICES["docs"], docs)  # bulk-index docs
                                    total_ok += ok
                                    total_fail += len(failed)
                            except Exception as exc:
                                log.error("Error processing %s: %s", repo, exc)
                        log.info("Docs done — %d ok, %d failed", total_ok, total_fail)
                    except Exception as exc:
                        log.error("Error processing docs: %s", exc)
    except Exception as exc:
        log.error("Fatal error in main: %s", exc)
        raise


if __name__ == "__main__":
    asyncio.run(main())  # launch event loop
