# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from email.utils import parseaddr

# Third party imports
import requests

GRAPH_TOKEN_URL = "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
GRAPH_SEND_MAIL_URL = "https://graph.microsoft.com/v1.0/users/{sender}/sendMail"


def get_graph_access_token(tenant_id, client_id, client_secret):
    response = requests.post(
        GRAPH_TOKEN_URL.format(tenant_id=tenant_id),
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials",
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["access_token"]


def _address_only(value):
    return parseaddr(value)[1]


def build_graph_message(message):
    html_body = next(
        (content for content, mimetype in getattr(message, "alternatives", []) if mimetype == "text/html"),
        None,
    )
    return {
        "message": {
            "subject": message.subject,
            "body": {
                "contentType": "HTML" if html_body else "Text",
                "content": html_body or message.body,
            },
            "toRecipients": [{"emailAddress": {"address": _address_only(addr)}} for addr in message.to],
            "ccRecipients": [{"emailAddress": {"address": _address_only(addr)}} for addr in message.cc],
            "bccRecipients": [{"emailAddress": {"address": _address_only(addr)}} for addr in message.bcc],
        },
        "saveToSentItems": "false",
    }


def send_graph_email(tenant_id, client_id, client_secret, sender, message):
    access_token = get_graph_access_token(tenant_id, client_id, client_secret)
    response = requests.post(
        GRAPH_SEND_MAIL_URL.format(sender=sender),
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json=build_graph_message(message),
        timeout=30,
    )
    response.raise_for_status()
