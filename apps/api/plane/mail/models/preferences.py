# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models

from plane.db.models import BaseModel


class MailPreference(BaseModel):
    DENSITY_COMFORTABLE = "comfortable"
    DENSITY_COMPACT = "compact"
    THEME_SYSTEM = "system"
    THEME_LIGHT = "light"
    THEME_DARK = "dark"

    mailbox = models.OneToOneField("mail.Mailbox", on_delete=models.CASCADE, related_name="preferences")
    density = models.CharField(max_length=24, default=DENSITY_COMFORTABLE)
    theme = models.CharField(max_length=24, default=THEME_SYSTEM)
    reading_pane = models.CharField(max_length=24, default="right")
    messages_per_page = models.PositiveIntegerField(default=25)
    mark_read_delay_ms = models.PositiveIntegerField(default=1500)
    show_snippets = models.BooleanField(default=True)
    default_signature = models.ForeignKey(
        "mail.MailSignature",
        on_delete=models.SET_NULL,
        related_name="default_for_preferences",
        null=True,
        blank=True,
    )
    language = models.CharField(max_length=16, default="ru")
    conversation_view = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Mail Preference"
        verbose_name_plural = "Mail Preferences"
        db_table = "mail_preferences"

    def __str__(self):
        return self.mailbox.email
