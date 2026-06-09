import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0126_issuetimer_issuetimersegment"),
    ]

    operations = [
        migrations.CreateModel(
            name="EmailIngestLog",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True, verbose_name="Created At"
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True, verbose_name="Last Modified At"
                    ),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(
                        blank=True,
                        null=True,
                        verbose_name="Deleted At",
                    ),
                ),
                (
                    "id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                (
                    "graph_message_id",
                    models.CharField(
                        db_index=True,
                        help_text="Microsoft Graph API message ID for deduplication.",
                        max_length=512,
                        unique=True,
                        verbose_name="Graph Message ID",
                    ),
                ),
                (
                    "processed_at",
                    models.DateTimeField(
                        auto_now_add=True,
                        verbose_name="Processed At",
                    ),
                ),
                (
                    "issue",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="email_ingest_logs",
                        to="db.issue",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to="db.user",
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to="db.user",
                        verbose_name="Last Modified By",
                    ),
                ),
            ],
            options={
                "verbose_name": "Email Ingest Log",
                "verbose_name_plural": "Email Ingest Logs",
                "db_table": "email_ingest_logs",
                "ordering": ("-processed_at",),
            },
        ),
    ]
