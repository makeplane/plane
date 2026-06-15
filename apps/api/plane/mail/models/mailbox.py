# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from plane.db.models import BaseModel


class MailDomain(BaseModel):
    """A virtual mail domain served by the local Postfix/Dovecot stack."""

    domain = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Mail Domain"
        verbose_name_plural = "Mail Domains"
        db_table = "mail_domains"
        ordering = ("domain",)

    def __str__(self):
        return self.domain


class Mailbox(BaseModel):
    """A virtual mailbox. Postfix checks existence here; Dovecot authenticates
    against ``password_hash`` (SHA512-CRYPT) and delivers to the Maildir."""

    email = models.CharField(max_length=320, unique=True)
    local_part = models.CharField(max_length=255)
    domain = models.ForeignKey(
        MailDomain, on_delete=models.CASCADE, related_name="mailboxes"
    )
    # SHA512-CRYPT ($6$) hash verified directly by Dovecot.
    password_hash = models.TextField()
    is_active = models.BooleanField(default=True)
    # Quota in MB; 0 means unlimited.
    quota_mb = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Mailbox"
        verbose_name_plural = "Mailboxes"
        db_table = "mailboxes"
        ordering = ("email",)

    def __str__(self):
        return self.email


class MailAlias(BaseModel):
    """A virtual alias: mail addressed to ``source`` is forwarded to
    ``destination`` (read by Postfix virtual_alias_maps)."""

    source = models.CharField(max_length=320, unique=True)
    destination = models.CharField(max_length=320)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Mail Alias"
        verbose_name_plural = "Mail Aliases"
        db_table = "mail_aliases"
        ordering = ("source",)

    def __str__(self):
        return f"{self.source} -> {self.destination}"
