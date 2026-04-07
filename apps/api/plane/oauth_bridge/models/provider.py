# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Django imports
from django.db import models

# Module imports
from plane.db.models.base import BaseModel


class ExternalTokenProvider(BaseModel):
    """
    Per-workspace IdP configuration for the OAuth Bridge.
    Stores the JWKS endpoint and claim-mapping settings needed to validate
    externally-issued JWTs and map them to Plane users.
    """

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="external_token_providers",
    )

    # Human-readable label (e.g. "IDAnywhere Production")
    name = models.CharField(max_length=255)
    is_enabled = models.BooleanField(default=True)

    # Token validation
    issuer = models.CharField(max_length=512)  # Expected `iss` claim value
    audience = models.JSONField(default=list)  # Expected `aud` claim(s)
    jwks_url = models.TextField()  # JWKS endpoint — must be HTTPS
    allowed_algorithms = models.JSONField(
        default=list
    )  # e.g. ["RS256"] — only asymmetric algorithms permitted

    # User identity mapping
    user_claims = models.CharField(
        max_length=255,
        default="email",
    )  # Comma-separated JWT claims to match against the Plane email (first match wins)
    jwks_cache_ttl = models.IntegerField(default=86400)  # Key cache TTL in seconds

    # Rate limiting — format: "<count>/<period>" e.g. "120/minute", "500/hour"
    # Null means fall back to the instance-wide DEFAULT_API_RATE_LIMIT setting
    rate_limit = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = "external_token_providers"
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "issuer"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_workspace_issuer_when_not_deleted",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.issuer})"
