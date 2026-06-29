# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


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
        ("mail", "0003_mail_client_models"),
    ]

    operations = [
        migrations.CreateModel(
            name="MailOutboundMessage",
            fields=[
                *base_fields(),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("queued", "Queued"),
                            ("sending", "Sending"),
                            ("sent", "Sent"),
                            ("failed", "Failed"),
                        ],
                        default="queued",
                        max_length=24,
                    ),
                ),
                ("payload", models.JSONField(default=dict)),
                ("subject", models.CharField(blank=True, default="", max_length=998)),
                ("to", models.JSONField(blank=True, default=list)),
                ("cc", models.JSONField(blank=True, default=list)),
                ("bcc", models.JSONField(blank=True, default=list)),
                ("body_text", models.TextField(blank=True, default="")),
                ("body_html", models.TextField(blank=True, default="")),
                ("error", models.TextField(blank=True, default="")),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                (
                    "mailbox",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="outbound_messages",
                        to="mail.mailbox",
                    ),
                ),
            ],
            options={
                "verbose_name": "Mail Outbound Message",
                "verbose_name_plural": "Mail Outbound Messages",
                "db_table": "mail_outbound_messages",
                "ordering": ("-created_at",),
            },
        ),
    ]
