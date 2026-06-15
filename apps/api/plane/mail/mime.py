# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import re
from email import message_from_bytes
from email.policy import default
from email.utils import getaddresses, parsedate_to_datetime

import nh3
from bs4 import BeautifulSoup

from plane.mail.exceptions import MailAttachmentError


ALLOWED_TAGS = nh3.ALLOWED_TAGS | {
    "article",
    "aside",
    "blockquote",
    "br",
    "caption",
    "div",
    "figure",
    "figcaption",
    "footer",
    "header",
    "img",
    "main",
    "mark",
    "pre",
    "section",
    "span",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
}

ALLOWED_ATTRIBUTES = {
    "*": {"class", "id", "title", "role", "aria-label", "style"},
    "a": {"href", "target", "rel", "title"},
    "img": {"src", "alt", "title", "width", "height"},
    "td": {"colspan", "rowspan", "style"},
    "th": {"colspan", "rowspan", "style"},
}

SAFE_PROTOCOLS = {"http", "https", "mailto", "tel"}


def sanitize_mail_html(html):
    if not html:
        return ""

    clean = nh3.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes=SAFE_PROTOCOLS,
    )
    soup = BeautifulSoup(clean, "html.parser")

    for frame in soup.find_all(["iframe", "object", "embed"]):
        frame.decompose()

    for image in soup.find_all("img"):
        src = image.get("src")
        if src:
            image["data-mail-blocked-src"] = src
            del image["src"]

    for anchor in soup.find_all("a"):
        href = anchor.get("href", "")
        if href.lower().startswith("javascript:"):
            del anchor["href"]
        if anchor.get("target") == "_blank":
            anchor["rel"] = "noreferrer noopener"

    return str(soup)


def _header(message, name):
    value = message.get(name)
    return str(value) if value is not None else ""


def _addresses(message, name):
    value = message.get(name)
    if not value:
        return []
    if hasattr(value, "addresses"):
        return [
            {"name": address.display_name or "", "email": address.addr_spec}
            for address in value.addresses
        ]
    return [{"name": name or "", "email": email} for name, email in getaddresses([str(value)]) if email]


def _payload_as_text(part):
    try:
        content = part.get_content()
        if isinstance(content, str):
            return content
    except Exception:
        pass

    payload = part.get_payload(decode=True) or b""
    charset = part.get_content_charset() or "utf-8"
    return payload.decode(charset, errors="replace")


def _payload_as_bytes(part):
    payload = part.get_payload(decode=True)
    if payload is not None:
        return payload
    content = part.get_content()
    if isinstance(content, str):
        return content.encode(part.get_content_charset() or "utf-8", errors="replace")
    return bytes(content or b"")


def _snippet(text, limit=180):
    compact = re.sub(r"\s+", " ", text or "").strip()
    return compact[:limit]


def _date_iso(message):
    value = _header(message, "Date")
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).isoformat()
    except Exception:
        return value


def parse_message_bytes(raw_message):
    message = message_from_bytes(raw_message, policy=default)
    text_parts = []
    html_parts = []
    attachments = []
    part_index = 0

    for part in message.walk():
        if part.is_multipart():
            continue

        part_index += 1
        content_type = part.get_content_type()
        disposition = (part.get_content_disposition() or "").lower()
        filename = part.get_filename()

        if disposition == "attachment" or filename:
            payload = _payload_as_bytes(part)
            attachments.append(
                {
                    "part_id": str(part_index),
                    "filename": filename or f"attachment-{part_index}",
                    "content_type": content_type,
                    "size": len(payload),
                    "disposition": disposition or "attachment",
                }
            )
            continue

        if content_type == "text/plain":
            text_parts.append(_payload_as_text(part))
        elif content_type == "text/html":
            html_parts.append(_payload_as_text(part))

    text_body = "\n\n".join([part for part in text_parts if part]).strip()
    html_body = sanitize_mail_html("\n".join([part for part in html_parts if part]).strip())
    snippet_source = text_body or BeautifulSoup(html_body, "html.parser").get_text(" ")

    return {
        "message_id": _header(message, "Message-ID"),
        "subject": _header(message, "Subject") or "(без темы)",
        "from": _addresses(message, "From"),
        "to": _addresses(message, "To"),
        "cc": _addresses(message, "Cc"),
        "bcc": _addresses(message, "Bcc"),
        "reply_to": _addresses(message, "Reply-To"),
        "date": _date_iso(message),
        "headers": {
            "message_id": _header(message, "Message-ID"),
            "in_reply_to": _header(message, "In-Reply-To"),
            "references": _header(message, "References"),
        },
        "text": text_body,
        "html": html_body,
        "snippet": _snippet(snippet_source),
        "attachments": attachments,
    }


def extract_attachment(raw_message, part_id):
    message = message_from_bytes(raw_message, policy=default)
    part_index = 0
    expected = str(part_id)

    for part in message.walk():
        if part.is_multipart():
            continue

        part_index += 1
        filename = part.get_filename()
        disposition = (part.get_content_disposition() or "").lower()
        if str(part_index) != expected:
            continue
        if disposition != "attachment" and not filename:
            raise MailAttachmentError("Requested MIME part is not an attachment.")

        payload = _payload_as_bytes(part)
        return {
            "filename": filename or f"attachment-{part_index}",
            "content_type": part.get_content_type(),
            "size": len(payload),
            "content": payload,
        }

    raise MailAttachmentError("Attachment part was not found.")
