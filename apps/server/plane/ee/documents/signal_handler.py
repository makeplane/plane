import json
import logging
from functools import partial

from celery import shared_task
from django.apps import apps
from django.conf import settings
from django.core.serializers import deserialize, serialize
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.forms.models import model_to_dict
from django_opensearch_dsl.apps import DODConfig
from django_opensearch_dsl.registries import registry
from django_opensearch_dsl.signals import CelerySignalProcessor

from plane.db.signals import post_bulk_create, post_bulk_update
from plane.ee.bgtasks.search_index_update_task import (
    handle_project_member_update,
    handle_project_udpate,
    handle_teamspace_member_update,
    handle_workspace_member_update,
)
from plane.utils.exception_logger import log_exception


logger = logging.getLogger("plane.api")

MAX_OBJECTS_PER_BATCH = 1000
LARGE_BATCH_THRESHOLD = 500

handler_map = {
    "Project": handle_project_udpate,
    "ProjectMember": handle_project_member_update,
    "WorkspaceMember": handle_workspace_member_update,
    "TeamspaceMember": handle_teamspace_member_update,
}


def _process_single_batch(objs_list, model_name, indices_to_update):
    """Process a single batch of objects for search index updates."""
    try:
        serialized_objs = []
        for obj in objs_list:
            try:
                serialized_objs.append(model_to_dict(obj))
            except Exception as e:
                logger.warning(f"Failed to serialize {model_name} object: {e}")
                continue

        if not serialized_objs:
            return

        try:
            json_objs = json.dumps(serialized_objs, cls=DjangoJSONEncoder)
            handler_map[model_name].delay(
                objs=json_objs,
                indices_to_update=indices_to_update,
            )
        except Exception as e:
            log_exception(e)

    except Exception as e:
        log_exception(e)


def _process_objects_in_batches(objs_list, model_name, indices_to_update):
    """Process objects in smaller batches to avoid memory issues."""
    total_objects = len(objs_list)

    for i in range(0, total_objects, MAX_OBJECTS_PER_BATCH):
        batch_end = min(i + MAX_OBJECTS_PER_BATCH, total_objects)
        batch_objects = objs_list[i:batch_end]

        try:
            _process_single_batch(batch_objects, model_name, indices_to_update)
        except Exception as e:
            log_exception(e)
            continue


# 8d30b2f4-2bf6-4b11-9c8e-afc92d4b7c30, 8d58d7fd-94e3-42d7-941d-d9ca54ef67c8


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

        m1 = model in registry._models
        m2 = model.__base__ in registry._models
        m3 = any(
            hasattr(doc.django, "related_models") and model in doc.django.related_models
            for doc in registry.get_documents()
        )

        if not (m1 or m2 or m3):
            return

        # Find indices that need to be updated
        indices_to_update = []
        for doc in registry.get_documents():
            if (
                hasattr(doc.django, "related_models")
                and model in doc.django.related_models
            ):
                indices_to_update.append(f"{doc.__module__}.{doc.__name__}")
            elif hasattr(doc.django, "model") and doc.django.model == model:
                indices_to_update.append(f"{doc.__module__}.{doc.__name__}")

        if not indices_to_update:
            return

        model_name = model.__name__
        if model_name not in handler_map:
            logger.warning(f"No handler found for model {model_name}")
            return

        # Process objects in batches if there are many
        if obj_count > LARGE_BATCH_THRESHOLD:
            _process_objects_in_batches(objs_list, model_name, indices_to_update)
        else:
            _process_single_batch(objs_list, model_name, indices_to_update)

    except Exception as e:
        log_exception(e)


if settings.OPENSEARCH_ENABLED:
    post_bulk_create.connect(update_index_on_bulk_create_update)
    post_bulk_update.connect(update_index_on_bulk_create_update)


@shared_task()
def handle_save_task(
    app_label, model, pk, semantic_fields_changed=False, is_created=False
):
    """
    Handle the update on the registry as a Celery task.

    Uses correct OpenSearch actions:
    - 'index': for when semantic fields change (full reindex with embeddings)
    - 'update': for partial updates (document classes handle upsert behavior)
    """
    model_object = apps.get_model(app_label, model)
    try:
        instance = model_object.objects.get(pk=pk)
        # Store semantic field change info on the instance for prepare() method
        instance._semantic_fields_changed = semantic_fields_changed

        # Choose action based on semantic field changes
        if semantic_fields_changed:
            # Full reindex when semantic fields change
            registry.update(instance, action="index")
            registry.update_related(instance, action="index")
        else:
            # Partial update (document classes handle upsert behavior)
            registry.update(instance, action="update")
            registry.update_related(instance, action="update")

    except model_object.DoesNotExist:
        logger.warning(f"Object {model} with pk {pk} does not exist")


@shared_task()
def handle_pre_delete_task(data):
    """Delete the instance from model and associated model indices."""
    instance = next(
        deserialize("json", data, cls=DODConfig.signal_processor_deserializer_class())
    ).object
    registry.delete(instance, raise_on_error=False)
    registry.delete_related(instance, raise_on_error=False)


class CustomCelerySignalProcessor(CelerySignalProcessor):
    """Celery signal processor for automatic updates on the index as delayed background tasks."""

    def handle_save(self, sender, instance, **kwargs):
        """Update the instance in model and associated model indices."""
        if self.instance_requires_update(instance):
            # Check if semantic fields have changed
            semantic_fields_changed = self._check_semantic_fields_changed(
                instance, **kwargs
            )

            transaction.on_commit(
                partial(
                    handle_save_task.delay,
                    app_label=instance._meta.app_label,
                    model=instance.__class__.__name__,
                    pk=instance.pk,
                    semantic_fields_changed=semantic_fields_changed,
                    is_created=kwargs.get("created", False),
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
        if self.instance_requires_update(instance):
            handle_pre_delete_task.delay(
                serialize(
                    "json",
                    [instance],
                    cls=DODConfig.signal_processor_serializer_class(),
                )
            )
