"""
Registry and document utilities for OpenSearch batched updates.

This module contains utility functions for working with the OpenSearch document
registry, model filtering, and batch processing of document updates.
"""

import logging

from django.apps import apps
from django_opensearch_dsl.registries import registry

from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.api")


def _get_model_class_by_name(model_name):
    """Helper function to get model class by name across all apps"""
    for app_label in apps.app_configs:
        try:
            return apps.get_model(app_label, model_name)
        except LookupError:
            continue
    return None


def is_model_search_relevant(model_name):
    """Check if model updates should be queued for OpenSearch processing using DSL registry"""
    try:
        model_class = _get_model_class_by_name(model_name)
        if not model_class:
            return False

        # Use registry's __contains__ method which checks both _models and _related_models
        return model_class in registry

    except Exception:
        # Conservative approach - if we can't determine, don't queue
        return False


def get_all_search_relevant_models():
    """Get all model names (direct + related) that are relevant for OpenSearch"""
    relevant_models = set()

    # Add direct document models using public API
    for model_class in registry.get_models():
        relevant_models.add(model_class.__name__)

    # Add related models from all documents
    for doc in registry.get_documents():
        if hasattr(doc.django, "related_models"):
            for related_model in doc.django.related_models:
                relevant_models.add(related_model.__name__)

    return list(relevant_models)


def fetch_optimized_queryset_by_model_and_ids(model_name, obj_ids):
    """
    Fetch optimized queryset by IDs for registry processing.

    Returns an optimized queryset instead of materialized instances to save memory
    and improve performance. The queryset includes prefetched relations to prevent N+1 queries.
    """
    # Early return for empty obj_ids
    if not obj_ids:
        return None

    try:
        model_class = _get_model_class_by_name(model_name)
        if not model_class:
            return None

        # Start with base queryset
        queryset = model_class.all_objects.filter(id__in=obj_ids)

        # Apply document-specific optimizations to avoid N+1 queries
        if model_class in registry.get_models():
            for doc_class in registry.get_documents():
                if doc_class.Django.model != model_class:
                    continue
                try:
                    # Use document's apply_related_to_queryset for optimization
                    queryset = doc_class().apply_related_to_queryset(queryset)
                    break  # Use the first document class's optimization
                except Exception as e:
                    logger.warning(
                        f"Error applying queryset optimization for {doc_class.__name__}: {e}"
                    )
                    continue

        return queryset

    except Exception as e:
        logger.error(f"Error creating optimized queryset for {model_name}: {e}")
        return None


def process_updates_group_with_registry(updates_list, model_name, action):
    """Process direct document updates using registry logic with queryset optimization"""

    if not updates_list:
        return []

    # Get optimized queryset first
    obj_ids = [update["obj_id"] for update in updates_list]
    queryset = fetch_optimized_queryset_by_model_and_ids(model_name, obj_ids)

    if queryset is None or not queryset.exists():
        return []

    try:
        # Find model class and process updates
        model_class = queryset.model
        if model_class in registry.get_models():
            for doc_class in registry.get_documents():
                if doc_class.Django.model != model_class:
                    continue
                if not doc_class.django.ignore_signals:
                    # Check if we need instances for cascade processing
                    # We need cascades if this document has related_models defined
                    has_cascades = bool(getattr(doc_class.django, "related_models", []))

                    if has_cascades:
                        # Need instances for built-in update_related() cascade processing
                        instances = list(queryset)
                        doc_class().update(instances, action=action)
                        logger.info(
                            f"OpenSearch {action}: {len(instances)} {model_name} documents"
                        )
                        return instances
                    else:
                        # No cascades: use queryset directly for maximum efficiency
                        doc_class().update(queryset, action=action)
                        logger.info(
                            f"OpenSearch {action}: {model_name} documents (queryset)"
                        )
                        return []

        return []

    except Exception as e:
        log_exception(e)
        logger.error(f"Error processing {model_name} updates with action {action}: {e}")
        return []


def process_cascade_updates_with_registry(all_instances, already_processed):
    """Process cascade updates using built-in registry.update_related() method"""

    # Use separate tracking for cascade processing to avoid conflicts with direct update tracking
    cascade_processed = set()

    for instance in all_instances:
        # Check if this instance has already been processed for cascades
        instance_key = (instance.__class__.__name__, instance.id)
        if instance_key in cascade_processed:
            continue

        # Mark as processed for cascades
        cascade_processed.add(instance_key)

        try:
            # Use built-in registry.update_related() for cascade processing
            # This automatically finds all related documents and updates them
            registry.update_related(instance, action="update")
            logger.debug(
                f"OpenSearch cascade: processed {instance.__class__.__name__}({instance.id})"
            )
        except Exception as e:
            log_exception(e)
            logger.error(
                f"Error processing cascade updates for {instance.__class__.__name__}({instance.id}): {e}"
            )


def _track_processed_instances(instances, already_processed):
    """Helper to track processed instances with unified logic"""
    for instance in instances:
        already_processed.add((instance.__class__.__name__, instance.id))


def process_model_batch_with_registry(model_name, batch_updates, already_processed):
    """
    Process batch using registry logic with optimized performance and error handling.

    Args:
        model_name: Name of the model to process
        batch_updates: List of update dictionaries with obj_id and semantic_fields_changed
        already_processed: Set to track globally processed instances

    Returns:
        List of processed instances
    """
    # Early validation
    if not batch_updates:
        return []

    if not model_name:
        logger.warning("Empty model_name provided to process_model_batch_with_registry")
        return []

    # Get and validate model class
    model_class = _get_model_class_by_name(model_name)
    if not model_class:
        logger.warning(f"Model class not found for {model_name}")
        return []

    try:
        # Determine processing strategy based on registry configuration
        is_cascade_only = model_class not in registry.get_models()

        if is_cascade_only:
            # Handle cascade-only models (no direct documents)
            logger.debug(
                f"Model {model_name} is cascade-only, processing cascades directly"
            )

            obj_ids = [update["obj_id"] for update in batch_updates]
            queryset = fetch_optimized_queryset_by_model_and_ids(model_name, obj_ids)

            if not queryset or not queryset.exists():
                logger.debug(f"No instances found for cascade-only model {model_name}")
                return []

            instances = list(queryset)

            # Process cascade updates and track instances
            process_cascade_updates_with_registry(instances, already_processed)
            _track_processed_instances(instances, already_processed)

            logger.debug(
                f"Processed {len(instances)} cascade-only {model_name} instances"
            )
            return instances

        else:
            # Handle models with direct documents
            # Group updates by semantic field changes (inlined from group_updates_by_semantic_status)
            semantic_updates = []
            non_semantic_updates = []

            for update in batch_updates:
                if update["semantic_fields_changed"]:
                    semantic_updates.append(update)
                else:
                    non_semantic_updates.append(update)

            # Early return if no updates to process
            if not semantic_updates and not non_semantic_updates:
                logger.debug(f"No updates to process for {model_name}")
                return []

            processed_instances = []
            processed_ids = set()  # Unified tracking for this batch

            # Process semantic updates first (higher priority)
            if semantic_updates:
                try:
                    semantic_instances = process_updates_group_with_registry(
                        semantic_updates, model_name, action="index"
                    )
                    if semantic_instances:
                        processed_instances.extend(semantic_instances)
                        processed_ids.update(
                            instance.id for instance in semantic_instances
                        )
                        _track_processed_instances(
                            semantic_instances, already_processed
                        )
                        logger.debug(
                            f"Processed {len(semantic_instances)} semantic {model_name} updates"
                        )
                except Exception as e:
                    logger.error(
                        f"Error processing semantic updates for {model_name}: {e}"
                    )

            # Process non-semantic updates (excluding already processed)
            if non_semantic_updates:
                # Filter out already processed instances in this batch
                non_semantic_filtered = [
                    update
                    for update in non_semantic_updates
                    if update["obj_id"] not in processed_ids
                ]

                if non_semantic_filtered:
                    try:
                        non_semantic_instances = process_updates_group_with_registry(
                            non_semantic_filtered, model_name, action="update"
                        )
                        if non_semantic_instances:
                            processed_instances.extend(non_semantic_instances)
                            _track_processed_instances(
                                non_semantic_instances, already_processed
                            )
                            logger.debug(
                                f"Processed {len(non_semantic_instances)} non-semantic {model_name} updates"
                            )
                    except Exception as e:
                        logger.error(
                            f"Error processing non-semantic updates for {model_name}: {e}"
                        )

            # Process cascade updates for all instances
            if processed_instances:
                try:
                    process_cascade_updates_with_registry(
                        processed_instances, already_processed
                    )
                    logger.debug(
                        f"Processed cascades for {len(processed_instances)} {model_name} instances"
                    )
                except Exception as e:
                    logger.error(
                        f"Error processing cascade updates for {model_name}: {e}"
                    )

            return processed_instances

    except Exception as e:
        logger.error(f"Unexpected error processing batch for {model_name}: {e}")
        log_exception(e)
        return []


def check_bulk_semantic_fields_changed(model_name, objs_list):
    """Check if semantic fields might have changed in bulk operations - conservative approach"""
    # Early returns for efficiency
    if not objs_list:
        return False

    # Define models with semantic fields (using set for O(1) lookup)
    models_with_semantic_fields = {"Issue", "Page"}

    # Only direct document models can have semantic fields changed
    if model_name not in models_with_semantic_fields:
        return False

    # Conservative approach for bulk operations - assume changed
    # This can be enhanced in the future to analyze bulk operation context
    return True
