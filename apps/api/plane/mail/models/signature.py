# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models

from plane.db.models import BaseModel


class MailSignature(BaseModel):
    mailbox = models.ForeignKey("mail.Mailbox", on_delete=models.CASCADE, related_name="signatures")
    name = models.CharField(max_length=255)
    content_html = models.TextField(blank=True, default="")
    content_text = models.TextField(blank=True, default="")
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Mail Signature"
        verbose_name_plural = "Mail Signatures"
        db_table = "mail_signatures"
        ordering = ("-is_default", "name")
        constraints = [
            models.UniqueConstraint(
                fields=["mailbox"],
                condition=models.Q(is_default=True, deleted_at__isnull=True),
                name="mail_signature_one_default_per_mailbox",
            )
        ]

    def __str__(self):
        return f"{self.mailbox.email} - {self.name}"
