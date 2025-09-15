import logging

from celery import shared_task
from django.conf import settings

from plane.utils.exception_logger import log_exception

if settings.OPENSEARCH_ENABLED:
    from plane.ee.documents import (
        get_all_search_relevant_models,
        process_model_batch_with_registry,
        get_queued_updates_chunks,
        get_batch_queue_stats,
    )

logger = logging.getLogger("plane.worker")


@shared_task
def process_batched_opensearch_updates():
    """Main processing function - drains ALL queued updates every 5 seconds using registry approach"""

    # Check if OpenSearch is enabled
    if not getattr(settings, "OPENSEARCH_ENABLED", False):
        return "OpenSearch disabled"

    try:
        # Get all registered models that could have queued updates from registry
        all_relevant_models = get_all_search_relevant_models()

        # Track processed instances across all models to avoid duplicate cascade updates
        already_processed = set()  # Set of (model_name, instance_id) tuples

        total_processed = 0

        # Process each model's updates with registry-powered logic
        for model_name in all_relevant_models:
            try:
                model_processed = 0

                # Process all queued updates for this model using generator
                for chunk_updates, chunk_info in get_queued_updates_chunks(model_name):
                    try:
                        processed_instances = process_model_batch_with_registry(
                            model_name, chunk_updates, already_processed
                        )

                        chunk_processed = len(processed_instances)
                        model_processed += chunk_processed

                        # Log progress for large queues
                        if chunk_info["total_items"] > 1000:
                            logger.info(
                                f"Processed chunk {chunk_info['chunk_number']} for {model_name}: "
                                f"{chunk_processed} instances, {chunk_info['remaining_items']} remaining"
                            )

                        logger.info(
                            f"OpenSearch batch processed {chunk_processed} {model_name} instances with registry-powered cascades"
                        )
                    except Exception as e:
                        logger.error(
                            f"Error processing chunk {chunk_info['chunk_number']} for {model_name}: {e}"
                        )
                        # Continue processing other chunks even if one fails

                total_processed += model_processed

            except Exception as e:
                log_exception(e)
                logger.error(f"Error processing OpenSearch batch for {model_name}: {e}")
                continue

        if total_processed > 0:
            logger.info(
                f"OpenSearch batch processing completed: {total_processed} total instances processed across all models"
            )

    except Exception as e:
        log_exception(e)
        logger.error(f"Error in OpenSearch batch processing task: {e}")


@shared_task
def log_opensearch_update_queue_metrics():
    """
    Log essential OpenSearch queue metrics for monitoring.
    Focuses only on actionable metrics to minimize processing overhead.
    """

    # Check if OpenSearch is enabled
    if not getattr(settings, "OPENSEARCH_ENABLED", False):
        return "OpenSearch disabled"

    try:
        # Get basic queue statistics (just queue lengths)
        queue_stats = get_batch_queue_stats(detailed=False)

        if not queue_stats or "error" in queue_stats:
            logger.error(
                "Failed to retrieve OpenSearch update queue statistics",
                extra={
                    "error": queue_stats.get("error", "Unknown error"),
                    "metric_type": "opensearch_update_queue_error",
                },
            )
            return {
                "status": "failed",
                "error": queue_stats.get("error", "Unknown error"),
            }

        # Calculate essential metrics
        total_queued_items = 0
        active_models = 0
        large_queues = []
        model_metrics = {}
        critical_size_threshold = 5000

        for model_name, stats in queue_stats.items():
            if not isinstance(stats, dict) or "error" in stats:
                continue

            queue_length = stats.get("queue_length", 0)
            total_queued_items += queue_length
            model_metrics[model_name] = queue_length

            if queue_length > 0:
                active_models += 1

            # Log individual model metrics for alerting
            logger.info(
                f"OpenSearch update queue: {model_name}",
                extra={
                    "metric_type": "opensearch_update_queue_model",
                    "model_name": model_name,
                    "queue_length": queue_length,
                },
            )

            # Flag unusually large queues (potential worker issues)
            if queue_length > critical_size_threshold:
                large_queues.append({"model": model_name, "size": queue_length})

        # Log aggregate metrics
        logger.info(
            "OpenSearch update queue metrics",
            extra={
                "metric_type": "opensearch_update_queue_metrics",
                "total_queued_items": total_queued_items,
                "active_models": active_models,
                "large_queues_count": len(large_queues),
                "model_metrics": model_metrics,
            },
        )

        # Alert only on critical issues
        if large_queues:
            logger.warning(
                "Large OpenSearch update queues detected - possible worker issues",
                extra={
                    "metric_type": "opensearch_update_queue_alert",
                    "alert_type": "large_queues",
                    "large_queues": large_queues,
                    "threshold": critical_size_threshold,
                },
            )

        return {
            "status": "completed",
            "total_queued_items": total_queued_items,
            "active_models": active_models,
            "large_queues_count": len(large_queues),
        }

    except Exception as e:
        log_exception(e)
        logger.error(
            "Error logging OpenSearch update queue metrics",
            extra={
                "metric_type": "opensearch_update_queue_error",
                "error": str(e),
            },
        )
        return {"status": "failed", "error": str(e)}
