import logging
import os
import uuid
from typing import Dict, Any

# third party imports
from celery import shared_task
from posthog import Posthog

# module imports
from plane.license.utils.instance_value import get_configuration_value
from plane.utils.exception_logger import log_exception
from plane.db.models import Workspace


logger = logging.getLogger("plane.worker")


def posthogConfiguration():
    POSTHOG_API_KEY, POSTHOG_HOST = get_configuration_value([
        {
            "key": "POSTHOG_API_KEY",
            "default": os.environ.get("POSTHOG_API_KEY", None),
        },
        {"key": "POSTHOG_HOST", "default": os.environ.get("POSTHOG_HOST", None)},
    ])
    if POSTHOG_API_KEY and POSTHOG_HOST:
        return POSTHOG_API_KEY, POSTHOG_HOST
    else:
        return None, None


def preprocess_data_properties(
    user_id: uuid.UUID, event_name: str, slug: str, data_properties: Dict[str, Any]
) -> Dict[str, Any]:
    if event_name == "user_invited_to_workspace":
        # Check if the current user is the workspace owner
        workspace = Workspace.objects.get(slug=slug)
        if str(workspace.owner_id) == str(user_id):
            data_properties["role"] = "owner"
        else:
            data_properties["role"] = "admin"

    return data_properties


@shared_task
def track_event(user_id: uuid.UUID, event_name: str, slug: str, event_properties: Dict[str, Any]):
    POSTHOG_API_KEY, POSTHOG_HOST = posthogConfiguration()

    if not (POSTHOG_API_KEY and POSTHOG_HOST):
        logger.warning("Event tracking is not configured")
        return

    try:
        # preprocess the data properties for massaging the payload
        # in the correct format for posthog
        data_properties = preprocess_data_properties(user_id, event_name, slug, event_properties)
        groups = {
            "workspace": slug,
        }
        # track the event using posthog
        posthog = Posthog(POSTHOG_API_KEY, host=POSTHOG_HOST)
        posthog.capture(distinct_id=user_id, event=event_name, properties=data_properties, groups=groups)
    except Exception as e:
        log_exception(e)
        return False


@shared_task
def workspace_invite_event(user, email, user_agent, ip, event_name, accepted_from):
    try:
        POSTHOG_API_KEY, POSTHOG_HOST = posthogConfiguration()

        if POSTHOG_API_KEY and POSTHOG_HOST:
            posthog = Posthog(POSTHOG_API_KEY, host=POSTHOG_HOST)
            posthog.capture(
                email,
                event=event_name,
                properties={
                    "event_id": uuid.uuid4().hex,
                    "user": {"email": email, "id": str(user)},
                    "device_ctx": {"ip": ip, "user_agent": user_agent},
                    "accepted_from": accepted_from,
                },
            )
    except Exception as e:
        log_exception(e)
        return
