# Django imports
from django.conf import settings

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

# Module imports
from plane.db.models import User


@shared_task
def send_welcome_slack(user_id, created, message):
    try:
        instance = User.objects.get(pk=user_id)

        if created and not instance.is_bot:
            # Send message on slack as well
            if settings.SLACK_BOT_TOKEN:
                client = WebClient(token=settings.SLACK_BOT_TOKEN)
                try:
                    _ = client.chat_postMessage(
                        channel="#trackers",
                        text=message,
                    )
                except SlackApiError as e:
                    print(f"Got an error: {e.response['error']}")
        return
    except Exception as e:
        capture_exception(e)
        return
