import uuid

from posthog import Posthog
from django.conf import settings

#third party imports
from celery import shared_task
from sentry_sdk import capture_exception


@shared_task
def auth_events(user, email, user_agent, ip, event_name, medium, first_time):
    try:
        posthog = Posthog(settings.POSTHOG_API_KEY, host=settings.POSTHOG_HOST)
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
                    "first_time": first_time
            }
        )
    except Exception as e:
        capture_exception(e)