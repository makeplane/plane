# Python imports
import json

# Third party imports
from celery import shared_task

# Module imports
from .webhook_task import webhook_activity


@shared_task
def model_activity(
    model_name,
    model_id,
    requested_data,
    current_instance,
    actor_id,
    slug,
    origin=None,
):
    if current_instance is None:
        webhook_activity.delay(
            event=model_name,
            verb="created",
            field=None,
            old_value=None,
            new_value=None,
            actor_id=actor_id,
            slug=slug,
            current_site=origin,
            event_id=model_id,
            old_identifier=None,
            new_identifier=None,
        )
        return

    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    for key in requested_data:
        current_value = current_instance.get(key, None)
        requested_value = requested_data.get(key, None)
        if current_value != requested_value:
            webhook_activity.delay(
                event=model_name,
                verb="updated",
                field=key,
                old_value=current_value,
                new_value=requested_value,
                actor_id=actor_id,
                slug=slug,
                current_site=origin,
                event_id=model_id,
                old_identifier=None,
                new_identifier=None,
            )

    return
