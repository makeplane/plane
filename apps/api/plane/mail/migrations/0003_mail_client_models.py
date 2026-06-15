# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


def base_fields():
    return [
        ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
        ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
        ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
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
            "created_by",
            models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="%(class)s_created_by",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Created By",
            ),
        ),
        (
            "updated_by",
            models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="%(class)s_updated_by",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Last Modified By",
            ),
        ),
    ]


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("mail", "0002_add_deleted_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="mailbox",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="mailboxes",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.CreateModel(
            name="MailSignature",
            fields=[
                *base_fields(),
                ("name", models.CharField(max_length=255)),
                ("content_html", models.TextField(blank=True, default="")),
                ("content_text", models.TextField(blank=True, default="")),
                ("is_default", models.BooleanField(default=False)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "mailbox",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="signatures",
                        to="mail.mailbox",
                    ),
                ),
            ],
            options={
                "verbose_name": "Mail Signature",
                "verbose_name_plural": "Mail Signatures",
                "db_table": "mail_signatures",
                "ordering": ("-is_default", "name"),
            },
        ),
        migrations.CreateModel(
            name="MailTemplate",
            fields=[
                *base_fields(),
                ("name", models.CharField(max_length=255)),
                ("subject", models.CharField(blank=True, default="", max_length=998)),
                ("body_html", models.TextField(blank=True, default="")),
                ("body_text", models.TextField(blank=True, default="")),
                ("category", models.CharField(blank=True, default="general", max_length=64)),
                (
                    "mailbox",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="templates",
                        to="mail.mailbox",
                    ),
                ),
            ],
            options={
                "verbose_name": "Mail Template",
                "verbose_name_plural": "Mail Templates",
                "db_table": "mail_templates",
                "ordering": ("category", "name"),
            },
        ),
        migrations.CreateModel(
            name="MailFilterRule",
            fields=[
                *base_fields(),
                ("name", models.CharField(max_length=255)),
                ("is_active", models.BooleanField(default=True)),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "match_type",
                    models.CharField(
                        choices=[("all", "All"), ("any", "Any")],
                        default="all",
                        max_length=16,
                    ),
                ),
                ("conditions", models.JSONField(blank=True, default=list)),
                ("actions", models.JSONField(blank=True, default=list)),
                (
                    "mailbox",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="filter_rules",
                        to="mail.mailbox",
                    ),
                ),
            ],
            options={
                "verbose_name": "Mail Filter Rule",
                "verbose_name_plural": "Mail Filter Rules",
                "db_table": "mail_filter_rules",
                "ordering": ("order", "name"),
            },
        ),
        migrations.CreateModel(
            name="MailLabel",
            fields=[
                *base_fields(),
                ("name", models.CharField(max_length=128)),
                ("color", models.CharField(default="#C24E2C", max_length=16)),
                (
                    "mailbox",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="labels",
                        to="mail.mailbox",
                    ),
                ),
            ],
            options={
                "verbose_name": "Mail Label",
                "verbose_name_plural": "Mail Labels",
                "db_table": "mail_labels",
                "ordering": ("name",),
            },
        ),
        migrations.CreateModel(
            name="MailSavedSearch",
            fields=[
                *base_fields(),
                ("name", models.CharField(max_length=255)),
                ("query", models.CharField(blank=True, default="", max_length=512)),
                ("filters", models.JSONField(blank=True, default=dict)),
                (
                    "mailbox",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="saved_searches",
                        to="mail.mailbox",
                    ),
                ),
            ],
            options={
                "verbose_name": "Mail Saved Search",
                "verbose_name_plural": "Mail Saved Searches",
                "db_table": "mail_saved_searches",
                "ordering": ("name",),
            },
        ),
        migrations.CreateModel(
            name="MailForwarding",
            fields=[
                *base_fields(),
                ("forward_enabled", models.BooleanField(default=False)),
                ("forward_to", models.JSONField(blank=True, default=list)),
                ("keep_copy", models.BooleanField(default=True)),
                ("vacation_enabled", models.BooleanField(default=False)),
                ("vacation_subject", models.CharField(blank=True, default="", max_length=255)),
                ("vacation_message", models.TextField(blank=True, default="")),
                ("vacation_start", models.DateTimeField(blank=True, null=True)),
                ("vacation_end", models.DateTimeField(blank=True, null=True)),
                (
                    "mailbox",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="forwarding",
                        to="mail.mailbox",
                    ),
                ),
            ],
            options={
                "verbose_name": "Mail Forwarding",
                "verbose_name_plural": "Mail Forwarding",
                "db_table": "mail_forwarding",
            },
        ),
        migrations.CreateModel(
            name="MailPreference",
            fields=[
                *base_fields(),
                ("density", models.CharField(default="comfortable", max_length=24)),
                ("theme", models.CharField(default="system", max_length=24)),
                ("reading_pane", models.CharField(default="right", max_length=24)),
                ("messages_per_page", models.PositiveIntegerField(default=25)),
                ("mark_read_delay_ms", models.PositiveIntegerField(default=1500)),
                ("show_snippets", models.BooleanField(default=True)),
                ("language", models.CharField(default="ru", max_length=16)),
                ("conversation_view", models.BooleanField(default=True)),
                (
                    "mailbox",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="preferences",
                        to="mail.mailbox",
                    ),
                ),
                (
                    "default_signature",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="default_for_preferences",
                        to="mail.mailsignature",
                    ),
                ),
            ],
            options={
                "verbose_name": "Mail Preference",
                "verbose_name_plural": "Mail Preferences",
                "db_table": "mail_preferences",
            },
        ),
        migrations.AddConstraint(
            model_name="mailsignature",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True), ("is_default", True)),
                fields=("mailbox",),
                name="mail_signature_one_default_per_mailbox",
            ),
        ),
        migrations.AddConstraint(
            model_name="maillabel",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("mailbox", "name"),
                name="mail_label_unique_name_per_mailbox",
            ),
        ),
    ]
