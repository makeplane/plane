# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models

from plane.db.models import BaseModel


class MailForwarding(BaseModel):
    mailbox = models.OneToOneField("mail.Mailbox", on_delete=models.CASCADE, related_name="forwarding")
    forward_enabled = models.BooleanField(default=False)
    forward_to = models.JSONField(default=list, blank=True)
    keep_copy = models.BooleanField(default=True)
    vacation_enabled = models.BooleanField(default=False)
    vacation_subject = models.CharField(max_length=255, blank=True, default="")
    vacation_message = models.TextField(blank=True, default="")
    vacation_start = models.DateTimeField(null=True, blank=True)
    vacation_end = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Mail Forwarding"
        verbose_name_plural = "Mail Forwarding"
        db_table = "mail_forwarding"

    def __str__(self):
        return self.mailbox.email
