"""
Management command to manually test IMAP email polling for Support Tickets.

Usage:
    python manage.py poll_emails                # Run one full polling cycle
    python manage.py poll_emails --dry-run      # Test connection, list unread emails
    python manage.py poll_emails --limit 5      # Process at most 5 emails
    python manage.py poll_emails --dry-run --limit 3
"""

import imaplib
import email
import logging
import os

from django.core.management.base import BaseCommand
from django.db.models import Q

from plane.bgtasks.support_ticket_email_task import (
    decode_email_subject,
    get_email_body,
    get_plain_text_body,
    get_target_state,
    is_duplicate_by_message_id,
    is_duplicate_by_fallback,
    _process_emails,
)
from plane.db.models import Project
from email.utils import parsedate_to_datetime

logger = logging.getLogger("plane")


class Command(BaseCommand):
    help = "Poll IMAP mailbox for unread emails and create Support Tickets."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Test IMAP connection and list unread emails without creating tickets.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Maximum number of emails to process (0 = all).",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        limit = options["limit"]

        imap_host = os.environ.get("IMAP_HOST")
        imap_port = int(os.environ.get("IMAP_PORT", "993"))
        imap_email = os.environ.get("IMAP_EMAIL")
        imap_mailbox = os.environ.get("IMAP_MAILBOX", "INBOX")
        default_project_id = os.environ.get("SECOPS_DEFAULT_PROJECT_ID")

        # OAuth2 config
        ms_tenant = os.environ.get("MS_OAUTH_TENANT_ID")
        ms_client = os.environ.get("MS_OAUTH_CLIENT_ID")
        ms_secret = os.environ.get("MS_OAUTH_CLIENT_SECRET")

        if not all([imap_host, imap_email]):
            self.stderr.write(self.style.ERROR(
                "IMAP configuration incomplete. Set IMAP_HOST and IMAP_EMAIL."
            ))
            return

        if not all([ms_tenant, ms_client, ms_secret]):
            self.stderr.write(self.style.ERROR(
                "OAuth2 configuration incomplete. Set MS_OAUTH_TENANT_ID, "
                "MS_OAUTH_CLIENT_ID, MS_OAUTH_CLIENT_SECRET."
            ))
            return

        if not dry_run and not default_project_id:
            self.stderr.write(self.style.ERROR(
                "SECOPS_DEFAULT_PROJECT_ID is required for creating tickets. "
                "Use --dry-run to test without it."
            ))
            return

        mail = None
        try:
            # ---- DEBUG: Connection details ----
            self.stdout.write(
                f"Connecting to {imap_host}:{imap_port} as {imap_email}...\n"
                f"  SSL: True (IMAP4_SSL)\n"
                f"  Auth method: OAuth2 XOAUTH2 (client credentials flow)\n"
                f"  Tenant: {ms_tenant}\n"
                f"  Client ID: {ms_client[:8]}...{ms_client[-4:]}\n"
                f"  Client Secret: {'*' * 8} ({len(ms_secret)} chars)"
            )

            mail = imaplib.IMAP4_SSL(imap_host, imap_port)
            self.stdout.write(self.style.SUCCESS(
                f"  ✓ SSL/TLS connection established"
            ))

            # ---- DEBUG: Server capabilities ----
            caps = mail.capabilities
            self.stdout.write(
                f"  Server capabilities: {', '.join(c.decode() if isinstance(c, bytes) else c for c in caps)}"
            )

            has_xoauth2 = any(
                "XOAUTH2" in (c.decode() if isinstance(c, bytes) else c).upper()
                for c in caps
            )
            self.stdout.write(
                f"  AUTH=XOAUTH2 supported: {has_xoauth2}"
            )

            if not has_xoauth2:
                self.stderr.write(self.style.ERROR(
                    "Server does not advertise XOAUTH2 capability. Cannot proceed."
                ))
                return

            # ---- OAuth2 authentication ----
            self.stdout.write("  Acquiring OAuth2 access token...")
            try:
                from plane.utils.email_auth import imap_oauth2_login
                imap_oauth2_login(mail, imap_email)
                self.stdout.write(self.style.SUCCESS(
                    "  ✓ OAuth2 XOAUTH2 authentication successful"
                ))
            except RuntimeError as auth_err:
                self.stderr.write(self.style.ERROR(
                    f"\n✗ OAUTH2 AUTH FAILED\n"
                    f"  Error: {auth_err}\n"
                    f"\n"
                    f"  Check:\n"
                    f"  1. MS_OAUTH_TENANT_ID, MS_OAUTH_CLIENT_ID, MS_OAUTH_CLIENT_SECRET\n"
                    f"  2. Azure App has 'IMAP.AccessAsApp' permission with admin consent\n"
                    f"  3. Service principal registered in Exchange Online\n"
                    f"  4. Mailbox permission granted to the service principal"
                ))
                return
            except imaplib.IMAP4.error as imap_err:
                self.stderr.write(self.style.ERROR(
                    f"\n✗ IMAP XOAUTH2 AUTHENTICATE FAILED\n"
                    f"  Error: {imap_err}\n"
                    f"  Error type: {type(imap_err).__name__}\n"
                    f"\n"
                    f"  The OAuth2 token was acquired but IMAP rejected it.\n"
                    f"  Common causes:\n"
                    f"  - Service principal not registered in Exchange Online\n"
                    f"  - FullAccess mailbox permission not granted\n"
                    f"  - Wrong IMAP_EMAIL (must match the mailbox principal)"
                ))
                return

            mail.select(imap_mailbox)
            self.stdout.write(self.style.SUCCESS(
                f"  ✓ Connected to mailbox '{imap_mailbox}' successfully."
            ))

            # ---- Search ----
            result, data = mail.search(None, "UNSEEN")
            if result != "OK":
                self.stderr.write(self.style.ERROR("IMAP search failed."))
                return

            email_ids = data[0].split()
            if not email_ids:
                self.stdout.write(self.style.WARNING("No unread emails found."))
                return

            total = len(email_ids)
            if limit > 0:
                email_ids = email_ids[:limit]

            self.stdout.write(
                f"Found {total} unread email(s). "
                f"Processing {len(email_ids)}."
            )

            if dry_run:
                self._dry_run_list(mail, email_ids)
            else:
                self._create_tickets(
                    mail, email_ids, default_project_id
                )

        except imaplib.IMAP4.error as e:
            self.stderr.write(self.style.ERROR(
                f"IMAP error: {e}\n"
                f"  Error type: {type(e).__name__}"
            ))
        except ConnectionRefusedError as e:
            self.stderr.write(self.style.ERROR(
                f"Connection refused: {e}\n"
                f"  Check IMAP_HOST and IMAP_PORT."
            ))
        except Exception as e:
            self.stderr.write(self.style.ERROR(
                f"Unexpected error: {type(e).__name__}: {e}"
            ))
        finally:
            if mail:
                try:
                    mail.close()
                    mail.logout()
                except Exception:
                    pass

    def _dry_run_list(self, mail, email_ids):
        """List unread emails without creating tickets."""
        self.stdout.write(self.style.MIGRATE_HEADING(
            "\n--- DRY RUN: Listing unread emails ---"
        ))

        for i, email_id in enumerate(email_ids, 1):
            try:
                result, msg_data = mail.fetch(email_id, "(RFC822)")
                if result != "OK":
                    self.stdout.write(f"  {i}. [FETCH FAILED]")
                    continue

                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)

                sender = msg.get("From", "Unknown")
                subject = decode_email_subject(msg.get("Subject"))
                message_id = msg.get("Message-ID", "").strip()
                date_header = msg.get("Date", "")

                # Parse date
                email_date = None
                if date_header:
                    try:
                        email_date = parsedate_to_datetime(date_header)
                    except Exception:
                        pass

                # Check dedup
                is_dup = False
                dup_reason = ""
                if message_id and is_duplicate_by_message_id(message_id):
                    is_dup = True
                    dup_reason = "Message-ID"
                elif not message_id and is_duplicate_by_fallback(
                    sender, subject, email_date
                ):
                    is_dup = True
                    dup_reason = "fallback (sender+subject+date)"

                dup_label = (
                    self.style.WARNING(f" [DUPLICATE: {dup_reason}]")
                    if is_dup
                    else ""
                )

                self.stdout.write(
                    f"  {i}. From: {sender}\n"
                    f"     Subject: {subject}\n"
                    f"     Date: {date_header}\n"
                    f"     Message-ID: {message_id or '(none)'}"
                    f"{dup_label}"
                )
            except Exception as e:
                self.stdout.write(f"  {i}. [ERROR: {e}]")

        self.stdout.write(self.style.SUCCESS(
            f"\nDry run complete. {len(email_ids)} email(s) listed."
        ))

    def _create_tickets(self, mail, email_ids, default_project_id):
        """Create tickets from unread emails (delegates to the Celery task logic)."""
        try:
            project = Project.objects.select_related("workspace").get(
                pk=default_project_id
            )
        except Project.DoesNotExist:
            self.stderr.write(self.style.ERROR(
                f"Project {default_project_id} not found."
            ))
            return

        target_state = get_target_state(project.id)
        if not target_state:
            self.stderr.write(self.style.ERROR(
                f"No valid state found for project {default_project_id}."
            ))
            return

        self.stdout.write(
            f"Using project: {project.name}\n"
            f"Using state: {target_state.name} (group={target_state.group})\n"
            f"Priority: medium\n"
        )

        _process_emails(
            mail, email_ids, project, project.workspace, target_state
        )

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. Processed {len(email_ids)} email(s)."
        ))
