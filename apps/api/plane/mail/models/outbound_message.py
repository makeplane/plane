# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models

from plane.db.models import BaseModel


class MailOutboundMessage(BaseModel):
    STATUS_QUEUED = "queued"
    STATUS_SENDING = "sending"
    STATUS_SENT = "sent"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = (
        (STATUS_QUEUED, "Queued"),
        (STATUS_SENDING, "Sending"),
        (STATUS_SENT, "Sent"),
        (STATUS_FAILED, "Failed"),
    )

    mailbox = models.ForeignKey("mail.Mailbox", on_delete=models.CASCADE, related_name="outbound_messages")
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default=STATUS_QUEUED)
    payload = models.JSONField(default=dict)
    subject = models.CharField(max_length=998, blank=True, default="")
    to = models.JSONField(blank=True, default=list)
    cc = models.JSONField(blank=True, default=list)
    bcc = models.JSONField(blank=True, default=list)
    body_text = models.TextField(blank=True, default="")
    body_html = models.TextField(blank=True, default="")
    error = models.TextField(blank=True, default="")
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Mail Outbound Message"
        verbose_name_plural = "Mail Outbound Messages"
        db_table = "mail_outbound_messages"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.mailbox.email} - {self.subject or '(без темы)'}"
