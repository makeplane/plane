import logging
from functools import partial

from django.conf import settings
from django.db import transaction
from django_opensearch_dsl.signals import CelerySignalProcessor

from plane.db.signals import post_bulk_create, post_bulk_update
from .queue import (
    queue_update_for_batch,
    queue_bulk_updates_for_batch,
)
from .registry import (
    is_model_search_relevant,
    check_bulk_semantic_fields_changed,
)
from plane.utils.exception_logger import log_exception


logger = logging.getLogger("plane.api")


def update_index_on_bulk_create_update(sender, **kwargs):
    """Handle bulk create/update operations by updating related search indices."""
    try:
        model = kwargs.get("model")
        objs = kwargs.get("objs")

        if not model or not objs:
            return

        objs_list = list(objs) if hasattr(objs, "__iter__") else [objs]
        obj_count = len(objs_list)

        if obj_count == 0:
            return

        model_name = model.__name__

        # Filter: Only process search-relevant models using registry
        if not is_model_search_relevant(model_name):
            logger.debug(f"Skipping non-search-relevant model: {model_name}")
            return

        # Queue all objects as a single bulk update - batch processor will drain all queued items
        obj_ids = [str(obj.id) for obj in objs_list]
        semantic_fields_changed = check_bulk_semantic_fields_changed(
            model_name, objs_list
        )
        queue_bulk_updates_for_batch(
            model_name=model_name,
            obj_ids=obj_ids,
            semantic_fields_changed=semantic_fields_changed,
        )

        logger.debug(f"Queued {obj_count} {model_name} objects for batch processing")

    except Exception as e:
        log_exception(e)


if settings.OPENSEARCH_ENABLED:
    post_bulk_create.connect(update_index_on_bulk_create_update)
    post_bulk_update.connect(update_index_on_bulk_create_update)


class BatchedCelerySignalProcessor(CelerySignalProcessor):
    """Celery signal processor for automatic updates on the index as delayed background tasks."""

    def handle_save(self, sender, instance, **kwargs):
        """Update the instance in model and associated model indices."""
        model_name = instance.__class__.__name__

        # Filter: Only process search-relevant models using registry
        if not is_model_search_relevant(model_name):
            logger.debug(f"Skipping non-search-relevant model: {model_name}")
            return

        if self.instance_requires_update(instance):
            # Check if semantic fields have changed (only for direct document models)
            semantic_fields_changed = False

            # Check if this model has direct documents by importing registry locally
            from django_opensearch_dsl.registries import registry

            if instance.__class__ in registry._models:
                semantic_fields_changed = self._check_semantic_fields_changed(
                    instance, **kwargs
                )

            # Queue update for batch processing - cascade to related documents handled during batch processing
            transaction.on_commit(
                partial(
                    queue_update_for_batch,
                    model_name=model_name,
                    obj_id=str(instance.pk),
                    semantic_fields_changed=semantic_fields_changed,
                )
            )

    def _check_semantic_fields_changed(self, instance, **kwargs):
        """Check if semantic fields have changed for this instance."""
        # Define semantic fields for different models
        model_semantic_fields = {
            "Issue": ["name", "description_stripped"],
            "Page": ["name", "description_stripped"],
        }

        model_name = instance.__class__.__name__
        if model_name not in model_semantic_fields:
            return False

        semantic_fields = model_semantic_fields[model_name]

        # Check if this is a creation
        if kwargs.get("created", False):
            return True

        # Check if update_fields was provided and contains semantic fields
        update_fields = kwargs.get("update_fields")
        if update_fields is not None:
            updated_fields = set(update_fields) if update_fields else set()
            semantic_fields_set = set(semantic_fields)
            if semantic_fields_set.intersection(updated_fields):
                logger.info(
                    f"Semantic fields in update_fields for {model_name} {instance.pk}, semantic fields changed"
                )
                return True
        else:
            # Check if semantic fields have actually changed by comparing with original values
            for field in semantic_fields:
                original_attr = f"_original_{field}"
                if hasattr(instance, original_attr):
                    original_value = getattr(instance, original_attr)
                    current_value = getattr(instance, field, None)
                    if original_value != current_value:
                        logger.info(
                            f"Semantic field '{field}' changed for {model_name} {instance.pk}"
                        )
                        return True

        return False

    def handle_pre_delete(self, sender, instance, **kwargs):
        """Delete the instance from model and associated model indices."""
        # Note: Deletions are processed immediately since batching deleted objects
        # would not work (objects no longer exist when batch is processed)
        model_name = instance.__class__.__name__

        # Filter: Only process search-relevant models
        if not is_model_search_relevant(model_name):
            logger.debug(
                f"Skipping non-search-relevant model for deletion: {model_name}"
            )
            return

        if self.instance_requires_update(instance):
            # For deletions, we still process immediately via registry
            # since the object won't exist when the batch is processed
            from django_opensearch_dsl.registries import registry

            registry.delete(instance, raise_on_error=False)
            registry.delete_related(instance, raise_on_error=False)
