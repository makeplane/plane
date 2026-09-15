# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from django.db.models import Q

from plane.db.models.base import BaseModel


class IdentityMapping(BaseModel):
    """Mapping between an AI4MS identity provider subject and a local account.

    Identity resolution order is ``subject`` > ``email`` > ``employee_id``
    (P0-ID-02). The table deliberately does not participate in the research
    ACL: research access is decided by organisation relations only.
    """

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        SUSPENDED = "SUSPENDED", "Suspended"
        REVOKED = "REVOKED", "Revoked"

    user = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_identity_mappings",
    )
    provider = models.CharField(max_length=64, default="ai4ms-oidc")
    subject = models.CharField(max_length=255)
    email_snapshot = models.CharField(max_length=255, null=True, blank=True)
    employee_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    last_login_at = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        verbose_name = "Research Identity Mapping"
        verbose_name_plural = "Research Identity Mappings"
        db_table = "research_identity_mappings"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "subject"],
                condition=Q(deleted_at__isnull=True),
                name="rsch_identity_uq_provider_subject",
            ),
            models.UniqueConstraint(
                fields=["provider", "user"],
                condition=Q(deleted_at__isnull=True),
                name="rsch_identity_uq_provider_user",
            ),
        ]
        indexes = [
            models.Index(fields=["provider", "employee_id"], name="rsch_idmap_provider_emp_idx"),
            models.Index(fields=["user", "provider"], name="rsch_idmap_user_provider_idx"),
        ]

    def __str__(self):
        return f"{self.provider}:{self.subject}"
