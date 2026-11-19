# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import base64
import mimetypes
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


def _build_graph_attachment(attachment):
    """Serialize a Django EmailMessage attachment into a Graph fileAttachment.

    Django's `EmailMessage.attach()` appends (filename, content, mimetype)
    tuples to `message.attachments`; MIMEBase attachments aren't produced by
    any call site in this codebase, so we reject them explicitly rather than
    silently dropping their content.
    """
    if not isinstance(attachment, tuple):
        raise ValueError(f"Cannot serialize attachment of type {type(attachment)!r} for Microsoft Graph")

    filename, content, mimetype = (list(attachment) + [None, None, None])[:3]

    if isinstance(content, str):
        content_bytes = content.encode("utf-8")
    elif isinstance(content, (bytes, bytearray)):
        content_bytes = bytes(content)
    else:
        raise ValueError(
            f"Cannot serialize attachment '{filename}' for Microsoft Graph: unsupported content type {type(content)!r}"
        )

    resolved_mimetype = mimetype or mimetypes.guess_type(filename or "")[0] or "application/octet-stream"

    return {
        "@odata.type": "#microsoft.graph.fileAttachment",
        "name": filename or "attachment",
        "contentType": resolved_mimetype,
        "contentBytes": base64.b64encode(content_bytes).decode("ascii"),
    }


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
            "attachments": [_build_graph_attachment(a) for a in getattr(message, "attachments", [])],
        },
        "saveToSentItems": False,
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
