import os
import requests


def slack_oauth(code):
    SLACK_OAUTH_URL = os.environ.get("SLACK_OAUTH_URL", False)
    SLACK_CLIENT_ID = os.environ.get("SLACK_CLIENT_ID", False)
    SLACK_CLIENT_SECRET = os.environ.get("SLACK_CLIENT_SECRET", False)

    # Oauth Slack
    if SLACK_OAUTH_URL and SLACK_CLIENT_ID and SLACK_CLIENT_SECRET:
        response = requests.get(
            SLACK_OAUTH_URL,
            params={
                "code": code,
                "client_id": SLACK_CLIENT_ID,
                "client_secret": SLACK_CLIENT_SECRET,
            },
        )
        return response.json()
    return {}
