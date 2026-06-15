# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models

from plane.db.models import BaseModel


class MailLabel(BaseModel):
    mailbox = models.ForeignKey("mail.Mailbox", on_delete=models.CASCADE, related_name="labels")
    name = models.CharField(max_length=128)
    color = models.CharField(max_length=16, default="#C24E2C")

    class Meta:
        verbose_name = "Mail Label"
        verbose_name_plural = "Mail Labels"
        db_table = "mail_labels"
        ordering = ("name",)
        constraints = [
            models.UniqueConstraint(
                fields=["mailbox", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="mail_label_unique_name_per_mailbox",
            )
        ]

    def __str__(self):
        return self.name
