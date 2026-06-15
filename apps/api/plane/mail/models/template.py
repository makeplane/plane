# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models

from plane.db.models import BaseModel


class MailTemplate(BaseModel):
    mailbox = models.ForeignKey("mail.Mailbox", on_delete=models.CASCADE, related_name="templates")
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=998, blank=True, default="")
    body_html = models.TextField(blank=True, default="")
    body_text = models.TextField(blank=True, default="")
    category = models.CharField(max_length=64, blank=True, default="general")

    class Meta:
        verbose_name = "Mail Template"
        verbose_name_plural = "Mail Templates"
        db_table = "mail_templates"
        ordering = ("category", "name")

    def __str__(self):
        return self.name
