"""
Core OpenSearch document components.

This module contains the fundamental building blocks for OpenSearch documents:
- Base document classes and custom field types
- Signal handling for automatic index updates
- Registry and queue utilities for batch processing
"""

from .base import BaseDocument

from .fields import (
    JsonKeywordField,
    KnnVectorField,
    edge_ngram_analyzer,
    edge_ngram_tokenizer,
    lowercase_normalizer,
)

from .signals import (
    BatchedCelerySignalProcessor,
    update_index_on_bulk_create_update,
)

from .registry import (
    is_model_search_relevant,
    get_all_search_relevant_models,
    process_updates_group_with_registry,
    process_cascade_updates_with_registry,
    process_model_batch_with_registry,
    check_bulk_semantic_fields_changed,
)

from .queue import (
    queue_update_for_batch,
    queue_bulk_updates_for_batch,
    get_queued_updates_chunks,
    get_queue_stats_for_model,
    cleanup_stale_queue_for_model,
    force_drain_queue_for_model,
    get_queue_health_info,
    get_batch_queue_stats,
)

__all__ = [
    # Base classes and fields
    "BaseDocument",
    "JsonKeywordField",
    "KnnVectorField",
    "edge_ngram_analyzer",
    "edge_ngram_tokenizer",
    "lowercase_normalizer",
    # Signal handlers
    "BatchedCelerySignalProcessor",
    "update_index_on_bulk_create_update",
    # Registry utilities
    "is_model_search_relevant",
    "get_all_search_relevant_models",
    "process_updates_group_with_registry",
    "process_cascade_updates_with_registry",
    "process_model_batch_with_registry",
    "check_bulk_semantic_fields_changed",
    # Queue utilities
    "queue_update_for_batch",
    "queue_bulk_updates_for_batch",
    "get_queued_updates_chunks",
    "get_queue_stats_for_model",
    "cleanup_stale_queue_for_model",
    "force_drain_queue_for_model",
    "get_queue_health_info",
    "get_batch_queue_stats",
]
