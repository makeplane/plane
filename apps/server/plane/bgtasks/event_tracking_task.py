import os

# third party imports
from celery import shared_task
from posthog import Posthog

# module imports
from plane.license.utils.instance_value import get_configuration_value
from plane.utils.exception_logger import log_exception


def posthogConfiguration():
    POSTHOG_API_KEY, POSTHOG_HOST = get_configuration_value(
        [
            {
                "key": "POSTHOG_API_KEY",
                "default": os.environ.get("POSTHOG_API_KEY", None),
            },
            {"key": "POSTHOG_HOST", "default": os.environ.get("POSTHOG_HOST", None)},
        ]
    )
    if POSTHOG_API_KEY and POSTHOG_HOST:
        return POSTHOG_API_KEY, POSTHOG_HOST
    else:
        return None, None


@shared_task
def track_event(email, event_name, properties):
    try:
        POSTHOG_API_KEY, POSTHOG_HOST = posthogConfiguration()

        if POSTHOG_API_KEY and POSTHOG_HOST:
            posthog = Posthog(POSTHOG_API_KEY, host=POSTHOG_HOST)
            posthog.capture(email, event=event_name, properties=properties)
    except Exception as e:
        log_exception(e)
        return
