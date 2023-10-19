# Django imports
from django.conf import settings

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception


@shared_task
def send_webhook(response_data, event, slug):
    try:
        print(slug)
        pass
    except Exception as e:
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return

