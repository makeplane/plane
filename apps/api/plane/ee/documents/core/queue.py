"""
Redis queueing utilities for OpenSearch batched updates.

Configuration Settings:
- OPENSEARCH_UPDATE_CHUNK_SIZE: Number of items to process per chunk (default: 1000)

Key Functions:
- get_queued_updates_chunks: Generator that yields chunks of updates for memory-efficient processing
- queue_update_for_batch: Queue individual updates for batch processing
- queue_bulk_updates_for_batch: Queue multiple updates efficiently
- cleanup_stale_queue_for_model: Clean up old/invalid queue entries
- get_batch_queue_stats: Get queue statistics for monitoring
"""

import json
import logging
import time

from django.conf import settings
from django.utils import timezone as django_timezone
from redis import Redis

from .registry import is_model_search_relevant, get_all_search_relevant_models
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.api")

redis_client = Redis.from_url(settings.REDIS_URL)
BATCH_UPDATE_KEY = "opensearch:batch_updates"


def queue_update_for_batch(model_name, obj_id, semantic_fields_changed=False):
    """Queue a single model update for batch processing"""
    if not getattr(settings, "OPENSEARCH_ENABLED", False):
        return False

    if not is_model_search_relevant(model_name):
        return

    batch_key = f"{BATCH_UPDATE_KEY}:{model_name}"
    update_data = {
        "obj_id": obj_id,
        "update_type": "update",
        "semantic_fields_changed": semantic_fields_changed,
        "timestamp": int(time.time()),  # epoch seconds
    }

    try:
        redis_client.rpush(batch_key, json.dumps(update_data))
    except Exception as e:
        log_exception(e)
        logger.error(f"Failed to queue {model_name}({obj_id}): {e}")


def queue_bulk_updates_for_batch(model_name, obj_ids, semantic_fields_changed=False):
    """Queue multiple model updates efficiently using Redis pipeline"""
    if not getattr(settings, "OPENSEARCH_ENABLED", False):
        return False

    if not is_model_search_relevant(model_name):
        return

    if not obj_ids:
        return

    batch_key = f"{BATCH_UPDATE_KEY}:{model_name}"
    timestamp = int(time.time())  # epoch seconds

    try:
        pipeline = redis_client.pipeline()
        for obj_id in obj_ids:
            update_data = {
                "obj_id": obj_id,
                "update_type": "update",
                "semantic_fields_changed": semantic_fields_changed,
                "timestamp": timestamp,
            }
            pipeline.rpush(batch_key, json.dumps(update_data))

        pipeline.execute()
        logger.info(f"Bulk queued {len(obj_ids)} {model_name} updates")
    except Exception as e:
        log_exception(e)
        logger.error(f"Failed to bulk queue {model_name} updates: {e}")


def get_queued_updates_chunks(model_name, chunk_size=None):
    """
    Generator that yields chunks of queued updates for memory-efficient processing.

    Processes a fixed number of items based on the queue length at start time.
    Items added during processing will be handled in the next batch cycle.

    Args:
        model_name: The model to process updates for
        chunk_size: Items to process per chunk (defaults to OPENSEARCH_UPDATE_CHUNK_SIZE setting)

    Yields:
        Tuple of (chunk_updates, chunk_info) where:
        - chunk_updates: List of parsed update dictionaries
        - chunk_info: Dict with metadata (chunk_number, total_items, remaining_items, chunk_size)
    """
    batch_key = f"{BATCH_UPDATE_KEY}:{model_name}"

    # Use configured chunk size or fallback to 1000
    if chunk_size is None:
        chunk_size = getattr(settings, "OPENSEARCH_UPDATE_CHUNK_SIZE", 1000)

    try:
        # Capture fixed queue length at start time
        queue_length = redis_client.llen(batch_key)
        if queue_length == 0:
            return

        processed_count = 0
        chunk_number = 0

        # Process fixed number of items based on initial queue length
        while processed_count < queue_length:
            chunk_number += 1

            # Calculate chunk size for this iteration
            remaining_items = queue_length - processed_count
            current_chunk_size = min(chunk_size, remaining_items)

            # Get and remove chunk data atomically using LPOP with count
            chunk_data = redis_client.lpop(batch_key, current_chunk_size)

            if not chunk_data:
                break  # No more items to process

            # Parse JSON for this chunk
            chunk_updates = []
            for update_json in chunk_data:
                try:
                    chunk_updates.append(json.loads(update_json))
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse update JSON for {model_name}: {e}")
                    continue

            # Yield chunk with metadata
            if chunk_updates:
                chunk_info = {
                    "chunk_number": chunk_number,
                    "total_items": queue_length,
                    "remaining_items": queue_length - processed_count - len(chunk_data),
                    "chunk_size": len(chunk_updates),
                }
                yield chunk_updates, chunk_info

            processed_count += len(chunk_data)

    except Exception as e:
        log_exception(e)
        logger.error(f"Error yielding queued updates for {model_name}: {e}")
        return


def get_queue_stats_for_model(model_name):
    """Get queue statistics for a specific model"""
    try:
        batch_key = f"{BATCH_UPDATE_KEY}:{model_name}"
        queue_length = redis_client.llen(batch_key)
        return {"queue_length": queue_length}
    except Exception as e:
        logger.warning(f"Error getting stats for {model_name}: {e}")
        return {"error": str(e)}


def cleanup_stale_queue_for_model(
    model_name, max_age_hours=1, max_queue_size=10000, force_drain=False
):
    """
    Robust cleanup for model queues with multiple safety mechanisms:

    - Age-based cleanup: Remove items older than max_age_hours
    - Size-based cleanup: Limit queue size to prevent infinite growth
    - Invalid data cleanup: Remove malformed JSON entries
    - Empty queue removal: Delete empty queue keys
    - Force drain: Emergency drain of entire queue if needed

    Uses chunked processing (1000 items per chunk) to avoid memory issues.

    Returns dict with cleanup statistics
    """
    batch_key = f"{BATCH_UPDATE_KEY}:{model_name}"
    stats = {
        "removed_stale": 0,
        "removed_invalid": 0,
        "removed_excess": 0,
        "queue_deleted": False,
        "force_drained": False,
        "errors": [],
    }

    try:
        if not redis_client.exists(batch_key):
            return stats

        queue_length = redis_client.llen(batch_key)

        # Force drain if requested (emergency situation)
        if force_drain:
            redis_client.delete(batch_key)
            stats["force_drained"] = True
            stats["removed_excess"] = queue_length
            logger.warning(
                f"FORCE DRAINED {model_name} queue: {queue_length} items removed"
            )
            return stats

        # If queue is empty, just delete the key
        if queue_length == 0:
            redis_client.delete(batch_key)
            stats["queue_deleted"] = True
            return stats

        # Check if queue has grown too large (indicates worker problems)
        if queue_length > max_queue_size:
            logger.error(
                f"Queue {model_name} too large ({queue_length} > {max_queue_size}). "
                f"Possible worker failure! Trimming to last {max_queue_size} items."
            )
            # Keep only the most recent max_queue_size items
            excess_count = queue_length - max_queue_size
            redis_client.ltrim(batch_key, excess_count, -1)
            stats["removed_excess"] = excess_count
            queue_length = max_queue_size

        # Age-based and invalid data cleanup
        if queue_length > 0:
            now = django_timezone.now()
            max_age = django_timezone.timedelta(hours=max_age_hours)

            # Process items in chunks to avoid memory issues with large queues
            chunk_size = 1000
            valid_items = []
            processed_count = 0

            while processed_count < queue_length:
                chunk_end = min(processed_count + chunk_size - 1, queue_length - 1)
                chunk_items = redis_client.lrange(batch_key, processed_count, chunk_end)

                if not chunk_items:
                    break

                for item_json in chunk_items:
                    try:
                        item_data = json.loads(item_json)

                        # Check if item has valid structure
                        if (
                            not isinstance(item_data, dict)
                            or "timestamp" not in item_data
                        ):
                            stats["removed_invalid"] += 1
                            logger.debug(
                                f"Removed invalid item from {model_name}: missing timestamp"
                            )
                            continue

                        # Check age
                        try:
                            item_time = django_timezone.datetime.fromtimestamp(
                                item_data["timestamp"], tz=django_timezone.utc
                            )
                            if now - item_time > max_age:
                                stats["removed_stale"] += 1
                                logger.debug(
                                    f"Removed stale item from {model_name}: {item_time}"
                                )
                                continue
                        except (ValueError, TypeError) as e:
                            stats["removed_invalid"] += 1
                            logger.debug(
                                f"Removed item with invalid timestamp from {model_name}: {e}"
                            )
                            continue

                        # Item is valid and not stale
                        valid_items.append(item_json)

                    except json.JSONDecodeError:
                        stats["removed_invalid"] += 1
                        logger.debug(f"Removed malformed JSON from {model_name}")
                        continue

                processed_count += len(chunk_items)

            # Replace queue with only valid, non-stale items
            original_count = processed_count
            if len(valid_items) != original_count:
                redis_client.delete(batch_key)
                if valid_items:
                    # Use pipeline for efficient batch insertion
                    pipeline = redis_client.pipeline()
                    for item in valid_items:
                        pipeline.rpush(batch_key, item)
                    pipeline.execute()
                else:
                    stats["queue_deleted"] = True

                total_removed = stats["removed_stale"] + stats["removed_invalid"]
                if total_removed > 0:
                    logger.info(
                        f"Cleaned {model_name} queue: "
                        f"{stats['removed_stale']} stale, "
                        f"{stats['removed_invalid']} invalid, "
                        f"{len(valid_items)} remaining"
                    )

    except Exception as e:
        error_msg = f"Error during cleanup of {model_name}: {e}"
        logger.error(error_msg)
        stats["errors"].append(error_msg)
        log_exception(e)

    return stats


def force_drain_queue_for_model(model_name):
    """Emergency function to completely drain a problematic queue"""
    return cleanup_stale_queue_for_model(model_name, force_drain=True)


def get_queue_health_info(model_name):
    """Get detailed health information about a queue including age analysis"""
    batch_key = f"{BATCH_UPDATE_KEY}:{model_name}"
    health_info = {
        "queue_length": 0,
        "oldest_timestamp": None,
        "newest_timestamp": None,
        "avg_age_minutes": None,
        "invalid_items": 0,
        "health_status": "unknown",
    }

    try:
        queue_length = redis_client.llen(batch_key)
        health_info["queue_length"] = queue_length

        if queue_length == 0:
            health_info["health_status"] = "empty"
            return health_info

        # Sample items to analyze (don't process huge queues entirely)
        sample_size = min(queue_length, 100)
        sample_items = redis_client.lrange(batch_key, 0, sample_size - 1)

        if queue_length > sample_size:
            # Also sample from the end
            end_sample = redis_client.lrange(batch_key, -sample_size, -1)
            sample_items.extend(end_sample)

        valid_timestamps = []
        invalid_count = 0

        for item_json in sample_items:
            try:
                item_data = json.loads(item_json)
                if "timestamp" in item_data:
                    try:
                        timestamp = django_timezone.datetime.fromtimestamp(
                            item_data["timestamp"], tz=django_timezone.utc
                        )
                        valid_timestamps.append(timestamp)
                    except (ValueError, TypeError):
                        invalid_count += 1
                else:
                    invalid_count += 1
            except json.JSONDecodeError:
                invalid_count += 1

        if valid_timestamps:
            now = django_timezone.now()
            oldest = min(valid_timestamps)
            newest = max(valid_timestamps)

            health_info["oldest_timestamp"] = oldest.isoformat()
            health_info["newest_timestamp"] = newest.isoformat()

            ages_minutes = [(now - ts).total_seconds() / 60 for ts in valid_timestamps]
            health_info["avg_age_minutes"] = sum(ages_minutes) / len(ages_minutes)

            # Determine health status
            max_age_minutes = (now - oldest).total_seconds() / 60
            if queue_length > 5000:
                health_info["health_status"] = "critical_size"
            elif max_age_minutes > 60:  # Items older than 1 hour
                health_info["health_status"] = "stale_items"
            elif invalid_count > len(sample_items) * 0.1:  # > 10% invalid
                health_info["health_status"] = "corrupted_data"
            else:
                health_info["health_status"] = "healthy"

        health_info["invalid_items"] = invalid_count

    except Exception as e:
        logger.warning(f"Error getting health info for {model_name}: {e}")
        health_info["health_status"] = "error"
        health_info["error"] = str(e)

    return health_info


def get_batch_queue_stats(detailed=False):
    """Get current batch queue statistics for monitoring"""
    if not getattr(settings, "OPENSEARCH_ENABLED", False):
        return {"status": "OpenSearch disabled"}

    stats = {}
    try:
        all_relevant_models = get_all_search_relevant_models()
        for model_name in all_relevant_models:
            try:
                if detailed:
                    stats[model_name] = get_queue_health_info(model_name)
                else:
                    stats[model_name] = get_queue_stats_for_model(model_name)
            except Exception as e:
                logger.warning(f"Error getting stats for {model_name}: {e}")
                stats[model_name] = {"error": str(e)}
        return stats
    except Exception as e:
        log_exception(e)
        logger.error(f"Error getting batch queue stats: {e}")
        return {"error": str(e)}
