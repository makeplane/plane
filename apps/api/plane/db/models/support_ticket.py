# Django imports
from django.db import models, connection, transaction

# Module imports
from .project import ProjectBaseModel
from plane.utils.uuid import convert_uuid_to_integer


class SupportTicket(ProjectBaseModel):
    """
    A support ticket that wraps a Plane Issue.
    Title, description, priority, state, and assignees are read from the linked Issue.
    Ticket numbers follow the format WINJIT-#00001 and are globally unique across the workspace.
    """

    SOURCE_CHOICES = (
        ("MANUAL", "Manual"),
        ("EMAIL", "Email"),
        ("CSV_IMPORT", "CSV Import"),
    )

    ticket_number = models.PositiveBigIntegerField(
        default=1,
        verbose_name="Ticket Number",
        db_index=True,
    )
    issue = models.OneToOneField(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="support_ticket",
    )
    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="MANUAL",
    )
    source_email = models.TextField(blank=True, null=True)
    email_subject = models.CharField(max_length=500, blank=True, null=True)
    email_body_html = models.TextField(blank=True, null=True)
    email_message_id = models.CharField(
        max_length=512,
        blank=True,
        null=True,
        unique=True,
        verbose_name="Email Message-ID",
        help_text="RFC 2822 Message-ID header for deduplication.",
    )
    email_date = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Email Date",
        help_text="Parsed Date header from the email for fallback deduplication.",
    )

    class Meta:
        verbose_name = "Support Ticket"
        verbose_name_plural = "Support Tickets"
        db_table = "support_tickets"
        ordering = ("-created_at",)

    @property
    def ticket_display(self):
        """Return formatted ticket number like WINJIT-#00001"""
        return f"WINJIT-#{str(self.ticket_number).zfill(5)}"

    def save(self, *args, **kwargs):
        if self._state.adding:
            with transaction.atomic():
                # Use workspace-level advisory lock for globally unique ticket numbers
                lock_key = convert_uuid_to_integer(self.workspace_id)

                with connection.cursor() as cursor:
                    cursor.execute("SELECT pg_advisory_xact_lock(%s)", [lock_key + 1000000])

                # Get the last ticket number across the entire workspace
                last_ticket = (
                    SupportTicket.objects.filter(workspace_id=self.workspace_id)
                    .aggregate(largest=models.Max("ticket_number"))
                )["largest"]
                self.ticket_number = (last_ticket + 1) if last_ticket else 1

                super(SupportTicket, self).save(*args, **kwargs)
        else:
            super(SupportTicket, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_display} <{self.project.name}>"
