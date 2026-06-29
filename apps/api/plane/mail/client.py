# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from email import message_from_bytes
from email.policy import default

from django.core.cache import cache
from django.utils import timezone
from bs4 import BeautifulSoup

from plane.mail.folders import (
    MAIL_FOLDER_LABELS,
    validate_move_destination,
)
from plane.mail.imap import MailIMAPSession
from plane.mail.labels import resolve_label_keyword
from plane.mail.mime import extract_attachment, parse_message_bytes
from plane.mail.models import MailOutboundMessage
from plane.mail.smtp import save_draft_message, send_message


def _fetch_value(data, *names):
    candidates = []
    for name in names:
        candidates.extend([name, name.encode("utf-8")])
    for key, value in data.items():
        normalized = key.decode("utf-8", errors="ignore") if isinstance(key, bytes) else str(key)
        if key in candidates or normalized in names:
            return value
    for key, value in data.items():
        normalized = key.decode("utf-8", errors="ignore") if isinstance(key, bytes) else str(key)
        if any(name in normalized for name in names):
            return value
    return None


def _flag_names(flags):
    result = set()
    for flag in flags or []:
        if isinstance(flag, bytes):
            flag = flag.decode("utf-8", errors="ignore")
        result.add(str(flag).lower())
    return result


def _addresses(message, name):
    parsed = parse_message_bytes(message.as_bytes())
    return parsed.get(name.lower(), [])


def _snippet_from_preview(raw_message):
    if not raw_message:
        return ""
    if isinstance(raw_message, str):
        raw_message = raw_message.encode("utf-8", errors="replace")

    try:
        parsed = parse_message_bytes(raw_message)
        if parsed.get("snippet"):
            return parsed["snippet"]
    except Exception:
        pass

    text = raw_message.decode("utf-8", errors="replace")
    text = BeautifulSoup(text, "html.parser").get_text(" ")
    return " ".join(text.split())[:180]


def _summary_from_header(folder_key, uid, data):
    header_bytes = _fetch_value(data, "BODY[HEADER]", "BODY[]", "RFC822.HEADER") or b""
    if isinstance(header_bytes, str):
        header_bytes = header_bytes.encode("utf-8")

    message = message_from_bytes(header_bytes, policy=default)
    flags = _flag_names(_fetch_value(data, "FLAGS") or [])
    internal_date = _fetch_value(data, "INTERNALDATE")
    bodystructure = str(_fetch_value(data, "BODYSTRUCTURE") or "")
    preview_bytes = _fetch_value(data, "BODY[]<0", "BODY.PEEK[]<0", "BODY[TEXT]<0", "BODY.PEEK[TEXT]<0")
    snippet = _snippet_from_preview(preview_bytes)

    return {
        "uid": str(uid),
        "folder_key": folder_key,
        "subject": str(message.get("Subject") or "(без темы)"),
        "from": _addresses(message, "from"),
        "to": _addresses(message, "to"),
        "date": internal_date.isoformat() if hasattr(internal_date, "isoformat") else str(message.get("Date") or ""),
        "snippet": snippet,
        "is_read": "\\seen" in flags,
        "is_starred": "\\flagged" in flags,
        "has_attachments": "attachment" in bodystructure.lower() or "filename" in bodystructure.lower(),
        "size": _fetch_value(data, "RFC822.SIZE") or 0,
        "send_status": "sent" if folder_key == "sent" else None,
    }


def _recipients_for_payload(value):
    recipients = []
    for item in value or []:
        if isinstance(item, dict):
            email = str(item.get("email") or "").strip()
            name = str(item.get("name") or "").strip()
        else:
            email = str(item).strip()
            name = ""
        if email:
            recipients.append({"name": name, "email": email})
    return recipients


def _outbound_snippet(payload):
    body_text = payload.get("body_text") or payload.get("text") or ""
    if body_text:
        return " ".join(str(body_text).split())[:180]

    body_html = payload.get("body_html") or payload.get("html") or ""
    return " ".join(BeautifulSoup(body_html, "html.parser").get_text(" ").split())[:180]


def _summary_from_outbound(outbound):
    payload = outbound.payload or {}
    date = outbound.sent_at or outbound.updated_at or outbound.created_at or timezone.now()
    body_text = payload.get("body_text") or payload.get("text") or outbound.body_text
    body_html = payload.get("body_html") or payload.get("html") or outbound.body_html

    return {
        "uid": f"outbound:{outbound.id}",
        "folder_key": "sent",
        "subject": outbound.subject or payload.get("subject") or "(без темы)",
        "from": [{"name": "", "email": outbound.mailbox.email}],
        "to": _recipients_for_payload(outbound.to or payload.get("to")),
        "date": date.isoformat(),
        "snippet": _outbound_snippet({"body_text": body_text, "body_html": body_html}),
        "is_read": True,
        "is_starred": False,
        "has_attachments": bool(payload.get("uploaded_attachments")),
        "size": len(str(body_text or "")) + len(str(body_html or "")),
        "send_status": outbound.status,
        "send_error": outbound.error,
    }


class MailClient:
    def __init__(self, mailbox):
        self.mailbox = mailbox

    def _counts_cache_key(self):
        return f"mail:{self.mailbox.id}:folders"

    def invalidate_cache(self):
        cache.delete(self._counts_cache_key())

    def list_folders(self):
        cached = cache.get(self._counts_cache_key())
        if cached:
            return cached

        with MailIMAPSession(self.mailbox) as session:
            folder_map = session.get_folder_map()
            folders = []
            for key in ["inbox", "starred", "sent", "drafts", "archive", "spam", "trash"]:
                folder = folder_map.get(key)
                if not folder:
                    continue
                total = 0
                unread = 0
                try:
                    session.select_folder(key, readonly=True)
                    if key == "starred":
                        starred = session.client.search(["FLAGGED"])
                        total = len(starred)
                        unread = len(session.client.search(["FLAGGED", "UNSEEN"]))
                    else:
                        total = len(session.client.search(["ALL"]))
                        unread = len(session.client.search(["UNSEEN"]))
                except Exception:
                    total = 0
                    unread = 0

                if key == "sent":
                    total += MailOutboundMessage.objects.filter(
                        mailbox=self.mailbox,
                        status__in=[
                            MailOutboundMessage.STATUS_QUEUED,
                            MailOutboundMessage.STATUS_SENDING,
                            MailOutboundMessage.STATUS_FAILED,
                        ],
                    ).count()

                folders.append(
                    {
                        **folder,
                        "label": MAIL_FOLDER_LABELS.get(key, folder.get("label", key)),
                        "total": total,
                        "unread": unread,
                    }
                )

        cache.set(self._counts_cache_key(), folders, timeout=45)
        return folders

    def _search_criteria(self, filters=None):
        filters = filters or {}
        criteria = ["ALL"]

        if filters.get("unread") in (True, "true", "1"):
            criteria.append("UNSEEN")
        if filters.get("starred") in (True, "true", "1"):
            criteria.append("FLAGGED")

        query = filters.get("q") or filters.get("query")
        if query:
            criteria.extend(["TEXT", str(query)])

        sender = filters.get("from")
        if sender:
            criteria.extend(["FROM", str(sender)])

        recipient = filters.get("to")
        if recipient:
            criteria.extend(["TO", str(recipient)])

        label_keyword = resolve_label_keyword(self.mailbox, filters.get("label"))
        if label_keyword:
            criteria.extend(["KEYWORD", label_keyword])

        return criteria

    def list_messages(self, folder_key="inbox", page=1, per_page=25, filters=None):
        filters = filters or {}
        page = max(int(page or 1), 1)
        per_page = min(max(int(per_page or 25), 1), 100)

        with MailIMAPSession(self.mailbox) as session:
            session.select_folder("inbox" if folder_key == "starred" else folder_key, readonly=True)
            criteria = self._search_criteria(filters)
            if folder_key == "starred" and "FLAGGED" not in criteria:
                criteria.append("FLAGGED")

            uids = [int(uid) for uid in session.client.search(criteria)]
            uids.sort(reverse=True)
            total = len(uids)
            start = (page - 1) * per_page
            page_uids = uids[start : start + per_page]
            if page_uids:
                fetched = session.client.fetch(
                    page_uids,
                    [
                        "FLAGS",
                        "INTERNALDATE",
                        "RFC822.SIZE",
                        "BODY.PEEK[HEADER]",
                        "BODY.PEEK[]<0.8192>",
                        "BODYSTRUCTURE",
                    ],
                )
                results = [_summary_from_header(folder_key, uid, fetched.get(uid, {})) for uid in page_uids]
            else:
                results = []

        if folder_key == "sent":
            outbound_queryset = MailOutboundMessage.objects.filter(
                mailbox=self.mailbox,
                status__in=[
                    MailOutboundMessage.STATUS_QUEUED,
                    MailOutboundMessage.STATUS_SENDING,
                    MailOutboundMessage.STATUS_FAILED,
                ],
            ).order_by("-created_at")
            outbound_count = outbound_queryset.count()
            total += outbound_count
            if page == 1 and outbound_count:
                outbound_results = [_summary_from_outbound(outbound) for outbound in outbound_queryset[:per_page]]
                results = [*outbound_results, *results[: max(per_page - len(outbound_results), 0)]]

        return {"results": results, "page": page, "per_page": per_page, "total": total}

    def get_message(self, folder_key, uid):
        with MailIMAPSession(self.mailbox) as session:
            session.select_folder("inbox" if folder_key == "starred" else folder_key, readonly=True)
            fetched = session.client.fetch([int(uid)], ["RFC822", "FLAGS", "INTERNALDATE"])
            data = fetched.get(int(uid), {})
            raw_message = _fetch_value(data, "RFC822", "BODY[]")
            if raw_message is None:
                return None
            parsed = parse_message_bytes(raw_message)
            flags = _flag_names(_fetch_value(data, "FLAGS") or [])
            parsed.update(
                {
                    "uid": str(uid),
                    "folder_key": folder_key,
                    "is_read": "\\seen" in flags,
                    "is_starred": "\\flagged" in flags,
                }
            )
            return parsed

    def set_flags(self, folder_key, uids, read=None, starred=None):
        uids = [int(uid) for uid in uids]
        with MailIMAPSession(self.mailbox) as session:
            session.select_folder("inbox" if folder_key == "starred" else folder_key, readonly=False)
            if read is not None:
                (session.client.add_flags if read else session.client.remove_flags)(uids, ["\\Seen"])
            if starred is not None:
                (session.client.add_flags if starred else session.client.remove_flags)(uids, ["\\Flagged"])
        self.invalidate_cache()
        return {"updated": len(uids)}

    def move(self, src_folder, dst_folder, uids):
        uids = [int(uid) for uid in uids]
        with MailIMAPSession(self.mailbox) as session:
            folder_map = session.get_folder_map()
            dst_name = validate_move_destination(folder_map, dst_folder)
            session.select_folder("inbox" if src_folder == "starred" else src_folder, readonly=False)
            session.client.move(uids, dst_name)
        self.invalidate_cache()
        return {"moved": len(uids), "dst_folder": dst_folder}

    def copy(self, src_folder, dst_folder, uids):
        uids = [int(uid) for uid in uids]
        with MailIMAPSession(self.mailbox) as session:
            folder_map = session.get_folder_map()
            dst_name = validate_move_destination(folder_map, dst_folder)
            session.select_folder("inbox" if src_folder == "starred" else src_folder, readonly=True)
            session.client.copy(uids, dst_name)
        self.invalidate_cache()
        return {"copied": len(uids), "dst_folder": dst_folder}

    def delete(self, src_folder, uids, permanent=False):
        uids = [int(uid) for uid in uids]
        if permanent:
            with MailIMAPSession(self.mailbox) as session:
                session.select_folder("inbox" if src_folder == "starred" else src_folder, readonly=False)
                session.client.add_flags(uids, ["\\Deleted"])
                session.client.expunge()
            self.invalidate_cache()
            return {"deleted": len(uids), "permanent": True}
        return self.move(src_folder, "trash", uids) | {"deleted": len(uids), "permanent": False}

    def search(self, query, filters=None, page=1, per_page=25):
        filters = {**(filters or {}), "q": query}
        folder_key = filters.get("folder_key")
        if folder_key:
            return self.list_messages(folder_key, page=page, per_page=per_page, filters=filters)

        results = []
        for key in ["inbox", "sent", "archive", "drafts", "spam", "trash"]:
            try:
                page_data = self.list_messages(key, page=1, per_page=per_page, filters=filters)
                results.extend(page_data["results"])
            except Exception:
                continue
            if len(results) >= per_page:
                break
        return {"results": results[:per_page], "page": page, "per_page": per_page, "total": len(results)}

    def attachment(self, folder_key, uid, part_id):
        with MailIMAPSession(self.mailbox) as session:
            session.select_folder("inbox" if folder_key == "starred" else folder_key, readonly=True)
            fetched = session.client.fetch([int(uid)], ["RFC822"])
            raw_message = _fetch_value(fetched.get(int(uid), {}), "RFC822", "BODY[]")
            return extract_attachment(raw_message, part_id)

    def send(self, payload):
        result = send_message(self.mailbox, payload)
        self.invalidate_cache()
        return result

    def queue_send(self, payload, actor=None):
        outbound = MailOutboundMessage.objects.create(
            mailbox=self.mailbox,
            payload=payload,
            subject=payload.get("subject") or "",
            to=payload.get("to") or [],
            cc=payload.get("cc") or [],
            bcc=payload.get("bcc") or [],
            body_text=payload.get("body_text") or payload.get("text") or "",
            body_html=payload.get("body_html") or payload.get("html") or "",
            created_by=actor,
            updated_by=actor,
        )
        self.invalidate_cache()
        return outbound

    def outbound_summary(self, outbound):
        return _summary_from_outbound(outbound)

    def save_draft(self, payload):
        result = save_draft_message(self.mailbox, payload)
        self.invalidate_cache()
        return result
