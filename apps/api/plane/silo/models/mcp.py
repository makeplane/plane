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

# Python imports
import re

# Django imports
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

# Module imports
from plane.db.models.base import BaseModel

def mcp_slug_validator(value):
    if not re.match(r"^[a-z0-9-]+$", value):
        raise ValidationError("Slug must contain only lowercase letters, numbers and hyphens")
    return value


class MCPAuthType(models.TextChoices):
    """Auth type shared across MCPApplication and MCPConnectionCredentials."""

    NONE = "none", "None"
    HEADER = "header", "Header"
    OAUTH = "oauth", "OAuth"


class MCPApplication(BaseModel):
    class Status(models.TextChoices):
        """
        Lifecycle status of a MCP application.
        inactive          - Saved but not yet authorized/connected by the owner.
        active         - Authorized and connected; in private use by the owner.
        pending_review - Submitted to the marketplace and waiting for admin approval.
        approved       - Reviewed and accepted, but not yet publicly listed.
        published      - Live on the marketplace and discoverable by users.
        hidden         - Temporarily disabled by the owner (still exists, not usable).
        suspended      - Blocked due to a violation or admin action.
        archived       - Permanently retired; kept for history, not usable.
        """

        INACTIVE = "inactive", "Inactive"
        ACTIVE = "active", "Active"
        PENDING_REVIEW = "pending_review", "Pending Review"
        APPROVED = "approved", "Approved"
        PUBLISHED = "published", "Published"
        HIDDEN = "hidden", "Hidden"
        SUSPENDED = "suspended", "Suspended"
        ARCHIVED = "archived", "Archived"

    slug = models.SlugField(max_length=48, db_index=True, unique=True, validators=[mcp_slug_validator])
    name = models.CharField(max_length=255)
    url = models.URLField(max_length=800)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    logo_asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mcp_app_logo_asset",
    )
    authorization_type = models.CharField(
        max_length=255,
        default=MCPAuthType.NONE,
    )
    status = models.CharField(
        max_length=255,
        default=Status.INACTIVE,
    )
    metadata = models.JSONField(default=dict)
    published_at = models.DateTimeField(null=True)
    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "MCP Application"
        verbose_name_plural = "MCP Applications"
        db_table = "mcp_applications"
        ordering = ("-created_at",)

    @property
    def logo_url(self):
        if self.logo_asset:
            return self.logo_asset.asset_url
        return None

    def save(self, *args, **kwargs):
        if self.description_stripped:
            self.description_html = f"<p>{self.description_stripped}</p>"
        else:
            self.description_html = "<p></p>"

        if not self._state.adding:
            old = MCPApplication.objects.get(id=self.id)
            if self.url != old.url or self.authorization_type != old.authorization_type:
                MCPConnectionCredentials.objects.filter(mcp_application=self).delete()
                self.status = self.Status.INACTIVE
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class MCPApplicationOwner(BaseModel):
    mcp_application = models.ForeignKey(
        "silo.MCPApplication",
        on_delete=models.CASCADE,
        related_name="mcp_application_owners",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="mcp_application_owners",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mcp_application_owners",
    )

    class Meta:
        verbose_name = "MCP Application Owner"
        verbose_name_plural = "MCP Application Owners"
        db_table = "mcp_application_owners"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["mcp_application", "workspace", "user"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_mcp_application_owner_when_not_deleted",
            )
        ]

    def __str__(self):
        return f"{self.mcp_application.name} <{self.workspace.name}>"

class MCPConnectionCredentials(BaseModel):
    mcp_application = models.ForeignKey(
        "silo.MCPApplication",
        on_delete=models.CASCADE,
        related_name="mcp_connection_credentials",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mcp_connection_credentials",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="mcp_connection_credentials",
    )
    auth_config = models.JSONField(default=dict)

    class Meta:
        verbose_name = "MCP Connection Credentials"
        verbose_name_plural = "MCP Connection Credentials"
        db_table = "mcp_connection_credentials"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["mcp_application", "user", "workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_mcp_credentials_per_user_workspace_when_not_deleted",
            )
        ]

    def save(self, *args, updated_headers=None, **kwargs):
        from plane.silo.services.mcp_connection import encrypt_auth_config

        # Encrypt raw headers if provided
        if updated_headers is not None:
            self.auth_config = encrypt_auth_config({"headers": updated_headers})

        super().save(*args, **kwargs)

        if updated_headers is not None and self.mcp_application.status != MCPApplication.Status.INACTIVE:
            self.mcp_application.status = MCPApplication.Status.INACTIVE
            self.mcp_application.save(update_fields=["status"])

    def __str__(self):
        return f"{self.mcp_application.name} <{self.user.email}> <{self.workspace.name}>"
