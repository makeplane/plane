import json

from celery import shared_task
from django_elasticsearch_dsl.registries import registry
from django_elasticsearch_dsl.signals import CelerySignalProcessor

from django.apps import apps
from django.core.serializers.json import DjangoJSONEncoder
from django.forms.models import model_to_dict
from django.conf import settings

from plane.db.signals import post_bulk_create, post_bulk_update
from plane.ee.bgtasks.elasticsearch_index_update_task import (
    handle_project_member_update,
    handle_project_udpate,
    handle_teamspace_member_update,
    handle_workspace_member_update
)


all_documents = registry.get_documents()
related_model_map = {}
all_related_models = []
all_document_models = []
for doc in all_documents:
    all_document_models.append(doc.django.model)
    related_model_map[doc] = doc.django.related_models
    all_related_models.extend(doc.django.related_models)
all_related_models = list(set(all_related_models))


handler_map = {
    "Project": handle_project_udpate,
    "ProjectMember": handle_project_member_update,
    "WorkspaceMember": handle_workspace_member_update,
    "TeamspaceMember": handle_teamspace_member_update
}


def update_index_on_bulk_create_update(sender, **kwargs):
    model = kwargs.get('model')
    objs = kwargs.get('objs')

    if model not in all_related_models:
        # Don't handle the signal if the model is not defined as
        # a related_model for any of the document indeces
        return

    indices_to_update = [
        f"{index.__module__}.{index.__name__}"
        for index, models in related_model_map.items()
        if model in models
    ]
    objs = [model_to_dict(obj) for obj in objs]
    # Process index update
    handler_map[model.__name__].delay(
        objs=json.dumps(objs, cls=DjangoJSONEncoder),
        indices_to_update=indices_to_update
    )

if settings.ELASTICSEARCH_ENABLED:
    post_bulk_create.connect(update_index_on_bulk_create_update)
    post_bulk_update.connect(update_index_on_bulk_create_update)


class CustomCelerySignalProcessor(CelerySignalProcessor):
    @shared_task()
    def registry_update_task(pk, app_label, model_name):
        """Handle the update on the registry as a Celery task."""
        try:
            model = apps.get_model(app_label, model_name)
        except LookupError:
            pass
        else:
            # Check if the model is directly registered as an Elasticsearch document
            is_registered = model in all_document_models
            if is_registered:
                manager = getattr(model, 'all_objects', model.objects)
                registry.update(
                    manager.get(pk=pk)
                )

    @shared_task()
    def registry_update_related_task(pk, app_label, model_name):
        """Handle the related update on the registry as a Celery task."""
        try:
            model = apps.get_model(app_label, model_name)
        except LookupError:
            pass
        else:
            # Check if the model is directly registered or part of all_related_models
            is_registered = model in all_document_models or model in all_related_models
            if is_registered:
                manager = getattr(model, 'all_objects', model.objects)
                registry.update_related(
                    manager.get(pk=pk)
                )
