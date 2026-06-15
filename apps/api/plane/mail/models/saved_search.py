# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models

from plane.db.models import BaseModel


class MailSavedSearch(BaseModel):
    mailbox = models.ForeignKey("mail.Mailbox", on_delete=models.CASCADE, related_name="saved_searches")
    name = models.CharField(max_length=255)
    query = models.CharField(max_length=512, blank=True, default="")
    filters = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Mail Saved Search"
        verbose_name_plural = "Mail Saved Searches"
        db_table = "mail_saved_searches"
        ordering = ("name",)

    def __str__(self):
        return self.name
