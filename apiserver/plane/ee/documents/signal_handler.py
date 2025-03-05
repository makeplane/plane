import json

from django_elasticsearch_dsl.registries import registry

from django.core.serializers.json import DjangoJSONEncoder
from django.forms.models import model_to_dict

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
for doc in all_documents:
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

post_bulk_create.connect(update_index_on_bulk_create_update)
post_bulk_update.connect(update_index_on_bulk_create_update)
