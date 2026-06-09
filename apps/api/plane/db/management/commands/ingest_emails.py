"""
Management command: Microsoft Graph API email polling service.

Polls the configured mailbox for unread emails via the Graph REST API
and creates Support Tickets (Issue + SupportTicket) in Plane for each one.

Usage:
    python manage.py ingest_emails                  # Run indefinitely
    python manage.py ingest_emails --verbosity=2    # Verbose logging
    python manage.py ingest_emails --once           # Single poll cycle then exit

Configuration (via environment variables):
    GRAPH_CLIENT_ID / MS_OAUTH_CLIENT_ID
    GRAPH_CLIENT_SECRET / MS_OAUTH_CLIENT_SECRET
    GRAPH_TENANT_ID / MS_OAUTH_TENANT_ID
    GRAPH_MAILBOX                 (default: akash.barnwal@winjit.com)
    EMAIL_TARGET_PROJECT_ID / SECOPS_DEFAULT_PROJECT_ID
    EMAIL_POLL_INTERVAL           (default: 60 seconds)
    EMAIL_BATCH_SIZE              (default: 50)
"""

import base64
import io
import logging
import os
import time
import traceback
import uuid

import requests

from django.core.management.base import BaseCommand
from django.db import IntegrityError, transaction
from django.utils import timezone

from plane.db.models import (
    EmailIngestLog,
    FileAsset,
    Issue,
    IssueLabel,
    Label,
    Project,
    State,
    SupportTicket,
)

from plane.utils.html_processor import strip_tags
from plane.utils.exception_logger import log_exception

try:
    import nh3
except ImportError:
    nh3 = None

logger = logging.getLogger("plane")

# ---------------------------------------------------------------------------
# Configuration helpers
# ---------------------------------------------------------------------------

def _env(primary_key, fallback_key=None, default=None):
    """Read an environment variable with an optional fallback key."""
    value = os.environ.get(primary_key)
    if value:
        return value
    if fallback_key:
        value = os.environ.get(fallback_key)
    return value or default


def get_config():
    """Load and validate all configuration from environment variables."""
    config = {
        "client_id": _env("GRAPH_CLIENT_ID", "MS_OAUTH_CLIENT_ID"),
        "client_secret": _env("GRAPH_CLIENT_SECRET", "MS_OAUTH_CLIENT_SECRET"),
        "tenant_id": _env("GRAPH_TENANT_ID", "MS_OAUTH_TENANT_ID"),
        "mailbox": _env("GRAPH_MAILBOX", default="akash.barnwal@winjit.com"),
        "project_id": _env("EMAIL_TARGET_PROJECT_ID", "SECOPS_DEFAULT_PROJECT_ID"),
        "poll_interval": int(_env("EMAIL_POLL_INTERVAL", default="60")),
        "batch_size": int(_env("EMAIL_BATCH_SIZE", default="50")),
    }
    missing = [k for k in ("client_id", "client_secret", "tenant_id", "project_id") if not config[k]]
    if missing:
        raise ValueError(
            f"Missing required environment variables: {', '.join(missing)}. "
            "Set GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, GRAPH_TENANT_ID, "
            "and EMAIL_TARGET_PROJECT_ID (or their fallbacks)."
        )
    return config


# ---------------------------------------------------------------------------
# OAuth2 Token Manager
# ---------------------------------------------------------------------------

class TokenManager:
    """Caches the OAuth2 access token and refreshes it when near expiry."""

    def __init__(self, tenant_id, client_id, client_secret):
        self.token_url = (
            f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
        )
        self.client_id = client_id
        self.client_secret = client_secret
        self._access_token = None
        self._expires_at = 0  # epoch seconds

    def get_token(self):
        """Return a valid access token, refreshing if needed."""
        # Refresh if within 5 minutes of expiry
        if self._access_token and time.time() < (self._expires_at - 300):
            return self._access_token

        logger.info("Acquiring new OAuth2 access token from Azure AD...")
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials",
        }
        resp = requests.post(self.token_url, data=data, timeout=30)
        resp.raise_for_status()
        body = resp.json()

        if "access_token" not in body:
            error = body.get("error", "unknown")
            desc = body.get("error_description", "no description")
            raise RuntimeError(f"Token error: {error} — {desc}")

        self._access_token = body["access_token"]
        expires_in = int(body.get("expires_in", 3600))
        self._expires_at = time.time() + expires_in
        logger.info(
            "Access token acquired (expires in %d seconds)", expires_in
        )
        return self._access_token


# ---------------------------------------------------------------------------
# Graph API helpers
# ---------------------------------------------------------------------------

GRAPH_BASE = "https://graph.microsoft.com/v1.0"


def fetch_unread_emails(token, mailbox, batch_size):
    """
    Fetch unread emails from the mailbox via Graph API.
    Returns a list of message dicts, or raises on error.
    """
    url = (
        f"{GRAPH_BASE}/users/{mailbox}/mailFolders/Inbox/messages"
        f"?$filter=isRead eq false"
        f"&$select=id,subject,bodyPreview,body,from,receivedDateTime,"
        f"hasAttachments,attachments"
        f"&$expand=attachments"
        f"&$orderby=receivedDateTime asc"
        f"&$top={batch_size}"
    )
    headers = {
        "Authorization": f"Bearer {token}",
        "ConsistencyLevel": "eventual",
    }
    resp = requests.get(url, headers=headers, timeout=60)

    # Handle rate limiting
    if resp.status_code == 429:
        retry_after = int(resp.headers.get("Retry-After", "60"))
        logger.warning(
            "Graph API rate limited (429). Sleeping %d seconds...",
            retry_after,
        )
        time.sleep(retry_after)
        # Retry once
        resp = requests.get(url, headers=headers, timeout=60)

    resp.raise_for_status()
    data = resp.json()
    return data.get("value", [])


def mark_email_as_read(token, mailbox, message_id):
    """Mark a single email as read via Graph API PATCH."""
    url = f"{GRAPH_BASE}/users/{mailbox}/messages/{message_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    resp = requests.patch(
        url, headers=headers, json={"isRead": True}, timeout=30
    )
    resp.raise_for_status()
    logger.info("Email marked as read: %s", message_id)


# ---------------------------------------------------------------------------
# HTML sanitization
# ---------------------------------------------------------------------------

def sanitize_html(html_content):
    """Sanitize HTML from email body using nh3 (Plane's sanitizer)."""
    if not html_content:
        return "<p></p>"
    if nh3 is not None:
        return nh3.clean(html_content)
    # Fallback: strip all tags
    return f"<p>{strip_tags(html_content)}</p>"


# ---------------------------------------------------------------------------
# State & Label resolution
# ---------------------------------------------------------------------------

def get_target_state(project_id):
    """
    Look up the 'Waiting for Support' state for the project.
    Falls back to the project's default state, then any non-triage state.
    """
    from django.db.models import Q

    # Primary: exact name match
    state = State.objects.filter(
        ~Q(is_triage=True),
        project_id=project_id,
        name="Waiting for Support",
    ).first()

    if state:
        logger.info("Using state 'Waiting for Support' (id=%s)", state.id)
        return state

    logger.warning(
        "State 'Waiting for Support' not found in project %s. "
        "Falling back to project default state.",
        project_id,
    )

    # Fallback 1: project default state
    state = State.objects.filter(
        ~Q(is_triage=True),
        project_id=project_id,
        default=True,
    ).first()

    if state:
        logger.info("Using default state '%s' (id=%s)", state.name, state.id)
        return state

    # Fallback 2: any non-triage state
    state = State.objects.filter(
        ~Q(is_triage=True),
        project_id=project_id,
    ).first()

    if state:
        logger.warning(
            "No default state found. Using first available: '%s'", state.name
        )
    else:
        logger.error("No states found at all for project %s!", project_id)

    return state


def get_or_create_label(project, workspace):
    """Get or create a 'Support Mail' label for the project."""
    try:
        label, _ = Label.objects.get_or_create(
            name="Support Mail",
            project=project,
            workspace=workspace,
            defaults={
                "color": "#EF4444",
                "description": "Auto-created from email ingestion",
            },
        )
        return label
    except Exception as e:
        logger.warning("Could not get/create 'Support Mail' label: %s", e)
        return None


# ---------------------------------------------------------------------------
# Attachment processing
# ---------------------------------------------------------------------------

def process_attachments(email_msg, issue, project, workspace):
    """
    Process file attachments from a Graph API email message.
    Uploads each to S3/MinIO and creates a FileAsset record.
    Returns a list of filenames that failed to upload.
    """
    from plane.settings.storage import S3Storage

    if not email_msg.get("hasAttachments"):
        return []

    attachments = email_msg.get("attachments", [])
    if not attachments:
        return []

    failed_filenames = []
    storage = S3Storage()

    for attachment in attachments:
        odata_type = attachment.get("@odata.type", "")
        # Skip reference attachments (links, not files)
        if odata_type != "#microsoft.graph.fileAttachment":
            logger.debug(
                "Skipping non-file attachment type: %s", odata_type
            )
            continue

        filename = attachment.get("name", "unnamed_attachment")
        content_type = attachment.get("contentType", "application/octet-stream")
        content_bytes_b64 = attachment.get("contentBytes", "")
        size = attachment.get("size", 0)

        if not content_bytes_b64:
            logger.warning(
                "Attachment '%s' has no contentBytes, skipping.", filename
            )
            failed_filenames.append(filename)
            continue

        try:
            # Decode base64 content
            file_data = base64.b64decode(content_bytes_b64)
            file_obj = io.BytesIO(file_data)

            # Build the S3 object key (matching Plane's convention)
            asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{filename}"

            # Upload to S3/MinIO
            upload_success = storage.upload_file(
                file_obj=file_obj,
                object_name=asset_key,
                content_type=content_type,
            )

            if not upload_success:
                logger.error(
                    "S3 upload failed for attachment '%s'", filename
                )
                failed_filenames.append(filename)
                continue

            # Create FileAsset record
            FileAsset.objects.create(
                attributes={"name": filename, "type": content_type, "size": len(file_data)},
                asset=asset_key,
                size=len(file_data),
                workspace=workspace,
                issue=issue,
                project=project,
                entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                is_uploaded=True,
                external_source="graph_email_ingestion",
            )
            logger.info(
                "Attachment uploaded: '%s' (%d bytes) -> issue %s",
                filename, len(file_data), issue.id,
            )

        except Exception as e:
            logger.error(
                "Failed to process attachment '%s': %s", filename, e
            )
            log_exception(e)
            failed_filenames.append(filename)

    return failed_filenames


# ---------------------------------------------------------------------------
# Single email processor
# ---------------------------------------------------------------------------

def process_single_email(email_msg, project, workspace, target_state, label):
    """
    Process a single Graph API email message:
    1. Check dedup via EmailIngestLog
    2. Sanitize email body (used as-is for description)
    3. Create Issue + SupportTicket
    4. Process attachments
    5. Attach label

    Returns the created Issue, or None if skipped/failed.
    Raises nothing — all errors are caught and logged.
    """
    graph_msg_id = email_msg.get("id", "")

    # Extract fields
    subject = (email_msg.get("subject") or "").strip()
    from_obj = email_msg.get("from", {}).get("emailAddress", {})
    sender_email = from_obj.get("address", "unknown@unknown.com")
    sender_name = from_obj.get("name", sender_email)
    sender_display = f"{sender_name} <{sender_email}>"
    received_dt_str = email_msg.get("receivedDateTime", "")

    body_obj = email_msg.get("body", {})
    body_html = body_obj.get("content", "")

    # Title
    if not subject:
        subject = f"No Subject — {sender_email}"
    title = subject[:255]

    logger.info(
        "Processing email: from=%s subject='%s' id=%s",
        sender_email, subject[:80], graph_msg_id[:40],
    )

    # ---- Deduplication ----
    if EmailIngestLog.objects.filter(graph_message_id=graph_msg_id).exists():
        logger.info("Duplicate skipped (EmailIngestLog): %s", graph_msg_id[:40])
        return None  # caller should still mark as read

    # ---- Parse received datetime ----
    email_date = None
    if received_dt_str:
        try:
            from django.utils.dateparse import parse_datetime
            email_date = parse_datetime(received_dt_str)
        except Exception:
            pass

    # ---- Sanitize HTML body (preserve original email content) ----
    sanitized_html = sanitize_html(body_html)
    description_html = sanitized_html
    description_stripped = strip_tags(sanitized_html) if sanitized_html else ""

    # ---- Create Issue + SupportTicket + EmailIngestLog ----
    issue = None
    try:
        with transaction.atomic():
            issue = Issue(
                name=title,
                description_html=description_html,
                description_stripped=description_stripped,
                priority="medium",
                state=target_state,
                project=project,
                workspace=workspace,
            )
            # Set created_at to email received time if available
            if email_date:
                issue.save(disable_auto_set_user=True)
                Issue.objects.filter(pk=issue.pk).update(created_at=email_date)
            else:
                issue.save(disable_auto_set_user=True)

            ticket = SupportTicket(
                issue=issue,
                source="EMAIL",
                source_email=sender_display,
                email_subject=subject[:500],
                email_body_html=sanitized_html,
                email_message_id=graph_msg_id[:512] if graph_msg_id else None,
                email_date=email_date,
                project=project,
                workspace=workspace,
            )
            ticket.save(disable_auto_set_user=True)

            # Dedup log — IntegrityError here means a concurrent worker
            # already processed this message
            EmailIngestLog.objects.create(
                graph_message_id=graph_msg_id,
                issue=issue,
            )

        logger.info(
            "Created ticket %s (issue_id=%s, seq=%d) for: %s",
            ticket.ticket_display, issue.id, issue.sequence_id, subject[:80],
        )

    except IntegrityError:
        # Unique constraint on graph_message_id — another worker got here first
        logger.info(
            "Duplicate prevented by DB constraint: %s", graph_msg_id[:40]
        )
        return None
    except Exception as e:
        logger.error(
            "Failed to create ticket for email '%s': %s\n%s",
            subject[:80], e, traceback.format_exc(),
        )
        log_exception(e)
        raise  # Propagate so caller knows not to mark as read

    # ---- Process attachments ----
    failed_attachments = []
    try:
        failed_attachments = process_attachments(
            email_msg, issue, project, workspace
        )
    except Exception as e:
        logger.error("Attachment processing error: %s", e)
        log_exception(e)

    # Append failed attachment notes to description
    if failed_attachments:
        notes = "\n".join(
            f"[Attachment: {fn} failed to upload]"
            for fn in failed_attachments
        )
        updated_desc = (
            issue.description_html
            + f'<p style="color: #EF4444;"><em>{notes}</em></p>'
        )
        Issue.objects.filter(pk=issue.pk).update(
            description_html=updated_desc
        )
        logger.warning(
            "Some attachments failed for issue %s: %s",
            issue.id, failed_attachments,
        )

    # ---- Attach label ----
    if label and issue:
        try:
            IssueLabel.objects.get_or_create(
                issue=issue,
                label=label,
                project=project,
                workspace=workspace,
            )
        except Exception as e:
            logger.warning("Could not attach label to issue: %s", e)

    return issue


# ---------------------------------------------------------------------------
# Main command
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = (
        "Poll Microsoft Graph API for unread emails and create "
        "Support Tickets in Plane. Runs indefinitely by default."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--once",
            action="store_true",
            default=False,
            help="Run a single poll cycle then exit (for testing).",
        )

    def handle(self, *args, **options):
        run_once = options["once"]
        verbosity = options.get("verbosity", 1)

        # Configure log level
        if verbosity >= 2:
            logging.getLogger("plane").setLevel(logging.DEBUG)

        try:
            config = get_config()
        except ValueError as e:
            self.stderr.write(self.style.ERROR(str(e)))
            return

        self.stdout.write(self.style.SUCCESS(
            f"Email ingestion service starting...\n"
            f"  Mailbox:       {config['mailbox']}\n"
            f"  Project ID:    {config['project_id']}\n"
            f"  Poll interval: {config['poll_interval']}s\n"
            f"  Batch size:    {config['batch_size']}\n"
            f"  Mode:          {'single poll' if run_once else 'continuous'}"
        ))

        # Resolve project (once at startup)
        try:
            project = Project.objects.select_related("workspace").get(
                pk=config["project_id"]
            )
        except Project.DoesNotExist:
            self.stderr.write(self.style.ERROR(
                f"Project {config['project_id']} not found. "
                "Check EMAIL_TARGET_PROJECT_ID / SECOPS_DEFAULT_PROJECT_ID."
            ))
            return

        workspace = project.workspace
        self.stdout.write(
            f"  Project:       {project.name}\n"
            f"  Workspace:     {workspace.name} (id={workspace.id})"
        )

        # Resolve state
        target_state = get_target_state(project.id)
        if not target_state:
            self.stderr.write(self.style.ERROR(
                f"No valid state found for project {project.id}. "
                "Cannot create tickets without a state."
            ))
            return

        self.stdout.write(
            f"  State:         {target_state.name} (group={target_state.group})"
        )

        # Get or create label
        label = get_or_create_label(project, workspace)
        if label:
            self.stdout.write(f"  Label:         {label.name}")

        # Initialize token manager
        token_mgr = TokenManager(
            config["tenant_id"],
            config["client_id"],
            config["client_secret"],
        )

        self.stdout.write(self.style.SUCCESS("\n--- Polling loop started ---\n"))

        while True:
            try:
                self._poll_cycle(
                    token_mgr, config, project, workspace,
                    target_state, label,
                )
            except Exception as e:
                logger.error(
                    "Unhandled error in poll cycle: %s\n%s",
                    e, traceback.format_exc(),
                )
                log_exception(e)

            if run_once:
                self.stdout.write(self.style.SUCCESS(
                    "\nSingle poll cycle complete. Exiting."
                ))
                break

            logger.debug(
                "Sleeping %d seconds before next poll...",
                config["poll_interval"],
            )
            time.sleep(config["poll_interval"])

    def _poll_cycle(self, token_mgr, config, project, workspace,
                    target_state, label):
        """Execute one poll-process cycle."""

        # ---- Step 1: Acquire token ----
        try:
            token = token_mgr.get_token()
        except Exception as e:
            logger.error(
                "Token acquisition failed: %s. Retrying in 30s...", e
            )
            time.sleep(30)
            try:
                token = token_mgr.get_token()
            except Exception as e2:
                logger.error(
                    "Token retry also failed: %s. Skipping this cycle.", e2
                )
                return

        # ---- Step 2: Fetch unread emails ----
        try:
            emails = fetch_unread_emails(
                token, config["mailbox"], config["batch_size"]
            )
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 429:
                # Already handled in fetch_unread_emails, but just in case
                logger.warning("Rate limited during fetch. Skipping cycle.")
                return
            logger.error("Graph API error fetching emails: %s", e)
            return
        except Exception as e:
            logger.error("Error fetching emails: %s", e)
            return

        if not emails:
            logger.debug("No unread emails found.")
            return

        logger.info("Found %d unread email(s) to process.", len(emails))

        # ---- Step 3 & 4: Process each email ----
        processed = 0
        skipped = 0
        failed = 0

        for email_msg in emails:
            graph_msg_id = email_msg.get("id", "")

            try:
                issue = process_single_email(
                    email_msg, project, workspace, target_state, label
                )

                if issue is None:
                    # Duplicate — still mark as read
                    skipped += 1
                else:
                    processed += 1

                # ---- Mark as read ----
                try:
                    mark_email_as_read(token, config["mailbox"], graph_msg_id)
                except Exception as e:
                    logger.error(
                        "Failed to mark email as read (%s): %s",
                        graph_msg_id[:40], e,
                    )

            except Exception as e:
                # Ticket creation failed — do NOT mark as read
                failed += 1
                logger.error(
                    "Skipping email %s due to error: %s",
                    graph_msg_id[:40], e,
                )
                continue

        logger.info(
            "Poll cycle complete: %d created, %d skipped (dup), %d failed.",
            processed, skipped, failed,
        )
