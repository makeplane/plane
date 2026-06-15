# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models

from plane.db.models import BaseModel


class MailFilterRule(BaseModel):
    MATCH_ALL = "all"
    MATCH_ANY = "any"

    mailbox = models.ForeignKey("mail.Mailbox", on_delete=models.CASCADE, related_name="filter_rules")
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    match_type = models.CharField(
        max_length=16,
        choices=((MATCH_ALL, "All"), (MATCH_ANY, "Any")),
        default=MATCH_ALL,
    )
    conditions = models.JSONField(default=list, blank=True)
    actions = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name = "Mail Filter Rule"
        verbose_name_plural = "Mail Filter Rules"
        db_table = "mail_filter_rules"
        ordering = ("order", "name")

    def __str__(self):
        return self.name
