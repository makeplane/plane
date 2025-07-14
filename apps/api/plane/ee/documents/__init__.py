"""
OpenSearch Documents Module

This module provides OpenSearch document definitions and utilities for Plane's
search functionality. It is organized into:

- core: Base document classes, field types, signal handlers, and utilities
- entities: Specific model documents (Issue, Project, Workspace, etc.)
- docs: Documentation and implementation guides
"""

from django.conf import settings

if settings.OPENSEARCH_ENABLED:
    # Import core components
    from .core import (
        BaseDocument,
        JsonKeywordField,
        KnnVectorField,
        edge_ngram_analyzer,
        edge_ngram_tokenizer,
        lowercase_normalizer,
        BatchedCelerySignalProcessor,
        update_index_on_bulk_create_update,
        # Registry utilities
        is_model_search_relevant,
        get_all_search_relevant_models,
        process_updates_group_with_registry,
        process_cascade_updates_with_registry,
        process_model_batch_with_registry,
        check_bulk_semantic_fields_changed,
        # Queue utilities
        queue_update_for_batch,
        queue_bulk_updates_for_batch,
        get_queued_updates_chunks,
        get_queue_stats_for_model,
        cleanup_stale_queue_for_model,
        force_drain_queue_for_model,
        get_queue_health_info,
        get_batch_queue_stats,
    )

    # Import entity documents
    from .entities import (
        IssueDocument,
        IssueCommentDocument,
        ProjectDocument,
        WorkspaceDocument,
        ModuleDocument,
        CycleDocument,
        PageDocument,
        IssueViewDocument,
        TeamspaceDocument,
    )

    # Export all for backward compatibility
    __all__ = [
        # Core components
        "BaseDocument",
        "JsonKeywordField",
        "KnnVectorField",
        "edge_ngram_analyzer",
        "edge_ngram_tokenizer",
        "lowercase_normalizer",
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
        # Entity documents
        "IssueDocument",
        "IssueCommentDocument",
        "ProjectDocument",
        "WorkspaceDocument",
        "ModuleDocument",
        "CycleDocument",
        "PageDocument",
        "IssueViewDocument",
        "TeamspaceDocument",
    ]
