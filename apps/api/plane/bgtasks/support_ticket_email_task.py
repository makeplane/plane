"""
Celery periodic task that polls an IMAP mailbox for unread emails
and creates SupportTicket + Issue records for each one.

Features:
- Message-ID based deduplication (primary)
- Fallback deduplication via normalized sender+subject+date bucket
- AI-powered description summarization (with plain-text fallback)
- Structured logging for observability
"""

# Python imports
import hashlib
import html as html_module
import imaplib
import email
import logging
import os
import re
from email.header import decode_header
from email.utils import parsedate_to_datetime

# Django imports
from django.db import transaction
from django.db.models import Q

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import (
    Issue,
    SupportTicket,
    Project,
    State,
    WorkspaceMember,
)
from plane.db.models.user import User
from plane.utils.html_processor import strip_tags
from plane.utils.ai_summary import generate_ticket_description_from_email
from plane.utils.email_auth import imap_oauth2_login
from plane.utils.exception_logger import log_exception


logger = logging.getLogger("plane")


# ---------------------------------------------------------------------------
# Email parsing helpers
# ---------------------------------------------------------------------------


def decode_email_subject(subject):
    """Decode email subject which may be encoded."""
    if subject is None:
        return "No Subject"
    decoded_parts = decode_header(subject)
    decoded_subject = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            decoded_subject += part.decode(encoding or "utf-8", errors="replace")
        else:
            decoded_subject += part
    return decoded_subject


def get_email_body(msg):
    """Extract the body from an email message, preferring HTML for raw storage."""
    body_html = ""
    body_text = ""

    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))

            if "attachment" in content_disposition:
                continue

            try:
                payload = part.get_payload(decode=True)
                if payload is None:
                    continue
                charset = part.get_content_charset() or "utf-8"
                decoded = payload.decode(charset, errors="replace")
            except Exception:
                continue

            if content_type == "text/html":
                body_html = decoded
            elif content_type == "text/plain":
                body_text = decoded
    else:
        content_type = msg.get_content_type()
        try:
            payload = msg.get_payload(decode=True)
            if payload:
                charset = msg.get_content_charset() or "utf-8"
                decoded = payload.decode(charset, errors="replace")
                if content_type == "text/html":
                    body_html = decoded
                else:
                    body_text = decoded
        except Exception:
            pass

    return body_html, body_text


def get_plain_text_body(body_html: str, body_text: str) -> str:
    """Return the best available plain-text representation of the email body."""
    if body_text:
        return body_text
    if body_html:
        return strip_tags(body_html)
    return ""


def normalize_string(s: str) -> str:
    """Lowercase, strip whitespace, collapse internal whitespace."""
    return " ".join(s.lower().split())


def build_fallback_dedup_key(sender: str, subject: str, date_bucket: str) -> str:
    """
    Build a deterministic dedup key from sender + subject + date bucket.
    Returns a hex digest string.
    """
    raw = f"{normalize_string(sender)}|{normalize_string(subject)}|{date_bucket}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# Deduplication checks
# ---------------------------------------------------------------------------


def is_duplicate_by_message_id(message_id: str) -> bool:
    """Check if a ticket with this Message-ID already exists."""
    return SupportTicket.objects.filter(email_message_id=message_id).exists()


def is_duplicate_by_fallback(sender: str, subject: str, email_date) -> bool:
    """
    Fallback dedup when Message-ID is absent.
    Checks for an existing ticket with the same sender + subject
    created within ±2 minutes of the email date.
    """
    if not email_date:
        return False

    from datetime import timedelta

    window_start = email_date - timedelta(minutes=2)
    window_end = email_date + timedelta(minutes=2)

    return SupportTicket.objects.filter(
        source="EMAIL",
        source_email=sender,
        email_subject=subject[:500],
        email_date__gte=window_start,
        email_date__lte=window_end,
    ).exists()


# ---------------------------------------------------------------------------
# State resolution
# ---------------------------------------------------------------------------


def get_target_state(project_id):
    """
    Find the first state with group='unstarted' for the project.
    Falls back to the project's default state, then any non-triage state.
    """
    # Prefer "unstarted" group (i.e. "To Do")
    state = State.objects.filter(
        ~Q(is_triage=True),
        project_id=project_id,
        group="unstarted",
    ).order_by("sequence").first()

    if state:
        return state

    # Fallback to default state
    state = State.objects.filter(
        ~Q(is_triage=True),
        project_id=project_id,
        default=True,
    ).first()

    if state:
        return state

    # Last resort: any non-triage state
    return State.objects.filter(
        ~Q(is_triage=True),
        project_id=project_id,
    ).first()


# ---------------------------------------------------------------------------
# Main Celery task
# ---------------------------------------------------------------------------


@shared_task
def poll_email_for_tickets():
    """
    Celery task that connects to an IMAP mailbox, reads unread emails,
    and creates SupportTickets + Issues for each one.
    """
    imap_host = os.environ.get("IMAP_HOST")
    imap_port = int(os.environ.get("IMAP_PORT", "993"))
    imap_email = os.environ.get("IMAP_EMAIL")
    imap_mailbox = os.environ.get("IMAP_MAILBOX", "INBOX")
    default_project_id = os.environ.get("SECOPS_DEFAULT_PROJECT_ID")

    if not all([imap_host, imap_email, default_project_id]):
        logger.warning(
            "IMAP configuration incomplete. Set IMAP_HOST, IMAP_EMAIL, "
            "and SECOPS_DEFAULT_PROJECT_ID environment variables."
        )
        return

    mail = None
    try:
        # ---- Connect via OAuth2 XOAUTH2 ----
        mail = imaplib.IMAP4_SSL(imap_host, imap_port)
        imap_oauth2_login(mail, imap_email)
        mail.select(imap_mailbox)
        logger.info(
            "IMAP connected successfully to %s:%s mailbox=%s (OAuth2)",
            imap_host, imap_port, imap_mailbox,
        )

        # ---- Search for unread ----
        result, data = mail.search(None, "UNSEEN")
        if result != "OK":
            logger.error("IMAP search failed with result: %s", result)
            return

        email_ids = data[0].split()
        if not email_ids:
            logger.debug("No new emails found in mailbox")
            return

        logger.info("Found %d new email(s) to process", len(email_ids))

        # ---- Resolve project ----
        try:
            project = Project.objects.select_related("workspace").get(
                pk=default_project_id
            )
        except Project.DoesNotExist:
            logger.error(
                "Project with ID %s not found. Check SECOPS_DEFAULT_PROJECT_ID.",
                default_project_id,
            )
            return

        workspace = project.workspace

        # ---- Resolve state ----
        target_state = get_target_state(project.id)
        if not target_state:
            logger.error(
                "No valid state found for project %s.", default_project_id
            )
            return

        logger.info(
            "Using state '%s' (group=%s) for new tickets",
            target_state.name, target_state.group,
        )

        # ---- Process each email ----
        _process_emails(
            mail, email_ids, project, workspace, target_state
        )

    except Exception as e:
        logger.error("IMAP connection/processing error: %s", e)
        log_exception(e)
    finally:
        if mail:
            try:
                mail.close()
                mail.logout()
            except Exception:
                pass


def _resolve_reporter(from_value, workspace):
    """Resolve reporter from From: header.

    Uses strict parsing:
    - Only @winjit.com senders populate reporter
    - Stores local part only (e.g. 'akash.barnwal')
    - If sender is a workspace member, returns (user, local_part)
    - If not a member but @winjit.com, returns (None, local_part)
    - If not @winjit.com, returns (None, None)
    """
    from email.utils import parseaddr

    name, addr = parseaddr(from_value or "")
    addr = addr.strip().lower()

    if not addr or "@" not in addr:
        return None, None

    # Only accept @winjit.com senders
    if not addr.endswith("@winjit.com"):
        return None, None

    # Extract and sanitize local part
    localpart = addr.split("@", 1)[0]
    cleaned = html_module.escape(strip_tags(localpart))[:512]

    # Try to match workspace member by full email
    try:
        user = User.objects.get(email__iexact=addr)
        is_member = WorkspaceMember.objects.filter(
            workspace=workspace,
            member=user,
            is_active=True,
        ).exists()
        if is_member:
            return user, cleaned  # Keep reporter_email too for fallback
    except User.DoesNotExist:
        pass

    return None, cleaned


def _process_emails(mail, email_ids, project, workspace, target_state):
    """Process a list of IMAP email IDs, creating tickets for each."""
    for email_id in email_ids:
        try:
            result, msg_data = mail.fetch(email_id, "(RFC822)")
            if result != "OK":
                logger.warning("Failed to fetch email %s", email_id)
                continue

            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)

            # ---- Extract fields ----
            sender = msg.get("From", "Unknown")
            subject = decode_email_subject(msg.get("Subject"))
            message_id = msg.get("Message-ID", "").strip()
            body_html, body_text = get_email_body(msg)
            plain_text = get_plain_text_body(body_html, body_text)

            # Parse email date
            email_date = None
            date_header = msg.get("Date")
            if date_header:
                try:
                    email_date = parsedate_to_datetime(date_header)
                except Exception:
                    pass

            logger.info(
                "Processing email: from=%s subject='%s' message_id=%s",
                sender, subject[:80], message_id or "(none)",
            )

            # ---- Deduplication ----
            if message_id and is_duplicate_by_message_id(message_id):
                logger.info(
                    "Duplicate skipped (Message-ID): %s", message_id
                )
                # Mark as seen so we don't re-process
                mail.store(email_id, "+FLAGS", "\\Seen")
                continue

            if not message_id and is_duplicate_by_fallback(
                sender, subject, email_date
            ):
                logger.info(
                    "Duplicate skipped (fallback dedup): sender=%s subject='%s'",
                    sender, subject[:80],
                )
                mail.store(email_id, "+FLAGS", "\\Seen")
                continue

            # ---- Resolve reporter from From: header ----
            reporter_user, reporter_email = _resolve_reporter(sender, workspace)

            # ---- AI summary ----
            description_html, used_ai = generate_ticket_description_from_email(
                plain_text
            )
            description_stripped = strip_tags(description_html)

            if used_ai:
                logger.info("AI summary generated for: %s", subject[:80])
            else:
                logger.info(
                    "Plain-text fallback used for: %s", subject[:80]
                )

            # ---- Raw body for ticket storage ----
            raw_body_for_storage = body_html if body_html else (
                f"<p>{body_text}</p>" if body_text else "<p>No content</p>"
            )

            # ---- Create Issue + Ticket ----
            with transaction.atomic():
                issue = Issue(
                    name=subject[:255],
                    description_html=description_html,
                    description_stripped=description_stripped,
                    priority="medium",
                    state=target_state,
                    project=project,
                    workspace=workspace,
                    reporter=reporter_user,
                    reporter_email=reporter_email,
                )
                issue.save(disable_auto_set_user=True)

                ticket = SupportTicket(
                    issue=issue,
                    source="EMAIL",
                    source_email=sender,
                    email_subject=subject[:500],
                    email_body_html=raw_body_for_storage,
                    email_message_id=message_id if message_id else None,
                    email_date=email_date,
                    project=project,
                    workspace=workspace,
                    reporter_user=reporter_user,
                    reporter_email=reporter_email,
                )
                ticket.save(disable_auto_set_user=True)

            logger.info(
                "Created ticket %s (issue_id=%s) from email: %s (reporter: %s)",
                ticket.ticket_display, issue.id, subject[:80],
                reporter_user.display_name if reporter_user else (reporter_email or "unknown"),
            )

            # Mark as read
            mail.store(email_id, "+FLAGS", "\\Seen")

        except Exception as e:
            logger.error("Error processing email %s: %s", email_id, e)
            log_exception(e)
            continue
