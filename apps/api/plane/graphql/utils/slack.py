# Python imports
from typing import Optional

# Django imports
from django.conf import settings

# Third party imports
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError


def trigger_slack_message(channel: Optional[str] = None, message: str = "", **kwargs):
    try:
        if not channel or not message:
            return

        slack_token = settings.SLACK_BOT_TOKEN or None
        if slack_token:
            client = WebClient(token=slack_token)
            try:
                _ = client.chat_postMessage(
                    channel=channel,
                    text=message,
                )
            except SlackApiError as e:
                print(f"Got an error: {e.response['error']}")

        return
    except Exception:
        return
