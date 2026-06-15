# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import datetime, timezone as dt_timezone
from email.utils import formataddr
from pathlib import PurePosixPath

from bs4 import BeautifulSoup
from django.core.files.storage import default_storage
from django.core.mail import EmailMultiAlternatives, get_connection

from plane.mail.conf import get_mail_config
from plane.mail.folders import resolve_folder_name
from plane.mail.imap import MailIMAPSession


def _recipients(value):
    if not value:
        return []
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    return [str(item).strip() for item in value if str(item).strip()]


def _plain_text(html, fallback=""):
    if fallback:
        return fallback
    return BeautifulSoup(html or "", "html.parser").get_text("\n").strip()


def _from_email(mailbox, payload):
    from_name = payload.get("from_name") or ""
    if from_name:
        return formataddr((from_name, mailbox.email))
    return mailbox.email


def build_email_message(mailbox, payload, connection=None):
    subject = payload.get("subject") or "(без темы)"
    html_body = payload.get("body_html") or payload.get("html") or ""
    text_body = payload.get("body_text") or payload.get("text") or _plain_text(html_body)
    to = _recipients(payload.get("to"))
    cc = _recipients(payload.get("cc"))
    bcc = _recipients(payload.get("bcc"))
    reply_to = _recipients(payload.get("reply_to"))

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=_from_email(mailbox, payload),
        to=to,
        cc=cc,
        bcc=bcc,
        reply_to=reply_to,
        connection=connection,
    )
    if html_body:
        message.attach_alternative(html_body, "text/html")

    for attachment in payload.get("uploaded_attachments") or []:
        key = attachment.get("key")
        if not key:
            continue
        filename = attachment.get("filename") or PurePosixPath(key).name
        content_type = attachment.get("content_type") or "application/octet-stream"
        with default_storage.open(key, "rb") as file_obj:
            message.attach(filename, file_obj.read(), content_type)

    return message


def append_message(mailbox, folder_key, raw_message, flags=None):
    with MailIMAPSession(mailbox) as session:
        folder_name = resolve_folder_name(session.get_folder_map(), folder_key)
        session.client.append(
            folder_name,
            raw_message,
            flags=flags or [],
            msg_time=datetime.now(dt_timezone.utc),
        )


def send_message(mailbox, payload):
    config = get_mail_config()
    connection = get_connection(
        host=config.smtp_host,
        port=config.smtp_port,
        username="",
        password="",
        use_tls=config.smtp_use_tls,
        use_ssl=config.smtp_use_ssl,
    )
    message = build_email_message(mailbox, payload, connection=connection)
    raw_message = message.message().as_bytes()
    sent_count = message.send()
    append_message(mailbox, "sent", raw_message, flags=["\\Seen"])
    return {"sent": sent_count > 0}


def save_draft_message(mailbox, payload):
    message = build_email_message(mailbox, payload)
    raw_message = message.message().as_bytes()
    append_message(mailbox, "drafts", raw_message, flags=["\\Draft"])
    return {"saved": True}
