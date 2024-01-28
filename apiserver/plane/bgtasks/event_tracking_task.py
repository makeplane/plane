import uuid
import os

# third party imports
from celery import shared_task
from sentry_sdk import capture_exception
from posthog import Posthog

# module imports
from plane.license.utils.instance_value import get_configuration_value


def posthogConfiguration():
    POSTHOG_API_KEY, POSTHOG_HOST = get_configuration_value(
        [
            {
                "key": "POSTHOG_API_KEY",
                "default": os.environ.get("POSTHOG_API_KEY", None),
            },
            {
                "key": "POSTHOG_HOST",
                "default": os.environ.get("POSTHOG_HOST", None),
            },
        ]
    )
    if POSTHOG_API_KEY and POSTHOG_HOST:
        return POSTHOG_API_KEY, POSTHOG_HOST
    else:
        return None, None


@shared_task
def auth_events(user, email, user_agent, ip, event_name, medium, first_time):
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
                    "device_ctx": {
                        "ip": ip,
                        "user_agent": user_agent,
                    },
                    "medium": medium,
                    "first_time": first_time,
                },
            )
    except Exception as e:
        capture_exception(e)


@shared_task
def workspace_invite_event(
    user, email, user_agent, ip, event_name, accepted_from
):
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
                    "device_ctx": {
                        "ip": ip,
                        "user_agent": user_agent,
                    },
                    "accepted_from": accepted_from,
                },
            )
    except Exception as e:
        capture_exception(e)
