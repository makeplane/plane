# Django imports
from django.db import models

# Module imports
from .base import BaseModel


class EmailIngestLog(BaseModel):
    """
    Tracks emails that have been processed by the Graph API email ingestion
    service. The unique constraint on graph_message_id prevents the same
    email from being processed twice, even under race conditions.
    """

    graph_message_id = models.CharField(
        max_length=512,
        unique=True,
        db_index=True,
        verbose_name="Graph Message ID",
        help_text="Microsoft Graph API message ID for deduplication.",
    )
    processed_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Processed At",
    )
    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="email_ingest_logs",
    )

    class Meta:
        verbose_name = "Email Ingest Log"
        verbose_name_plural = "Email Ingest Logs"
        db_table = "email_ingest_logs"
        ordering = ("-processed_at",)

    def __str__(self):
        return f"EmailIngestLog({self.graph_message_id[:40]}...)"
