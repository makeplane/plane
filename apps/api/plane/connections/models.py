"""Workspace credential / connection / entity-connection models.

Schema mirrors the shape Plane Commercial's silo service expects on the
Django side. Field names match the EE TypeScript types
(`packages/types/src/workspace.ts` in EE) so silo can talk to us
unchanged once we swap its endpoint base URL.

We do not encrypt token columns at rest; matching upstream for now.
Revisit when we onboard a second tenant.
"""

import uuid

from django.db import models
from django.db.models import Q

from plane.db.models import BaseModel


class WorkspaceCredential(BaseModel):
    """OAuth / PAT / API tokens scoped to a workspace.

    A credential can carry both `source_*` and `target_*` token pairs
    so importer flows (source = third-party we read from, target = the
    same third-party we write back to) can share one row. For Slack
    and GitHub we only populate the target side.
    """

    workspace = models.ForeignKey(
        "db.Workspace", related_name="connection_credentials", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        "db.User", related_name="connection_credentials", on_delete=models.CASCADE
    )

    # `source` doubles as the provider key: "slack", "github",
    # "github-enterprise", "gitlab", etc. silo reads it.
    source = models.CharField(max_length=64)

    source_identifier = models.CharField(max_length=255, blank=True, null=True)
    source_authorization_type = models.CharField(max_length=64, blank=True, null=True)
    source_auth_email = models.CharField(max_length=255, blank=True, null=True)
    source_access_token = models.TextField(blank=True, null=True)
    source_refresh_token = models.TextField(blank=True, null=True)
    source_token_expires_at = models.DateTimeField(blank=True, null=True)
    source_hostname = models.CharField(max_length=255, blank=True, null=True)

    target_identifier = models.CharField(max_length=255, blank=True, null=True)
    target_authorization_type = models.CharField(max_length=64, blank=True, null=True)
    target_access_token = models.TextField(blank=True, null=True)
    target_refresh_token = models.TextField(blank=True, null=True)
    target_hostname = models.CharField(max_length=255, blank=True, null=True)

    is_pat = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "workspace_credentials"
        verbose_name = "Workspace Credential"
        verbose_name_plural = "Workspace Credentials"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["workspace", "source"])]

    def __str__(self):
        return f"{self.workspace_id}:{self.source}:{self.user_id}"


class WorkspaceConnection(BaseModel):
    """Workspace-scoped install of an integration (e.g. one Slack team
    or one GitHub org). One per (workspace, connection_type, connection_id)."""

    workspace = models.ForeignKey(
        "db.Workspace", related_name="connections", on_delete=models.CASCADE
    )
    credential = models.ForeignKey(
        WorkspaceCredential, related_name="connections", on_delete=models.CASCADE
    )

    # provider key: "slack", "github", ...
    connection_type = models.CharField(max_length=64)
    # provider-side id (e.g. Slack team id, GH App installation id).
    connection_id = models.CharField(max_length=255)
    # provider-side slug if any (e.g. GH org login, Slack team domain).
    connection_slug = models.CharField(max_length=255, blank=True, null=True)
    # opaque provider-shaped blob. silo defines the shape per-provider.
    connection_data = models.JSONField(default=dict)

    target_hostname = models.CharField(max_length=255, blank=True, null=True)
    source_hostname = models.CharField(max_length=255, blank=True, null=True)

    scopes = models.JSONField(default=list)
    config = models.JSONField(default=dict)

    class Meta:
        db_table = "workspace_connections"
        verbose_name = "Workspace Connection"
        verbose_name_plural = "Workspace Connections"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "connection_type", "connection_id"],
                condition=Q(deleted_at__isnull=True),
                name="workspace_connections_unique_when_not_deleted",
            ),
        ]

    def __str__(self):
        return f"{self.workspace_id}:{self.connection_type}:{self.connection_id}"


class WorkspaceUserConnection(BaseModel):
    """Per-user OAuth link inside a workspace (e.g. user's personal
    GitHub or Slack identity used for comment attribution)."""

    workspace = models.ForeignKey(
        "db.Workspace", related_name="user_connections", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        "db.User", related_name="workspace_connections", on_delete=models.CASCADE
    )
    credential = models.ForeignKey(
        WorkspaceCredential, related_name="user_connections", on_delete=models.CASCADE
    )

    connection_type = models.CharField(max_length=64)
    connection_id = models.CharField(max_length=255)
    connection_slug = models.CharField(max_length=255, blank=True, null=True)
    connection_data = models.JSONField(default=dict)

    target_hostname = models.CharField(max_length=255, blank=True, null=True)
    source_hostname = models.CharField(max_length=255, blank=True, null=True)

    scopes = models.JSONField(default=list)
    config = models.JSONField(default=dict)

    class Meta:
        db_table = "workspace_user_connections"
        verbose_name = "Workspace User Connection"
        verbose_name_plural = "Workspace User Connections"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user", "connection_type"],
                condition=Q(deleted_at__isnull=True),
                name="workspace_user_connections_unique_when_not_deleted",
            ),
        ]

    def __str__(self):
        return f"{self.workspace_id}:{self.user_id}:{self.connection_type}"


class WorkspaceEntityConnection(BaseModel):
    """A specific binding under a `WorkspaceConnection`: one Plane
    project ↔ one Slack channel, or one Plane project ↔ one GitHub
    repo, etc. `entity_type` differentiates (e.g. "slack-channel",
    "github-repo")."""

    workspace = models.ForeignKey(
        "db.Workspace", related_name="entity_connections", on_delete=models.CASCADE
    )
    workspace_connection = models.ForeignKey(
        WorkspaceConnection, related_name="entity_connections", on_delete=models.CASCADE
    )
    project = models.ForeignKey(
        "db.Project",
        related_name="entity_connections",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )
    issue = models.ForeignKey(
        "db.Issue",
        related_name="entity_connections",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )

    # high-level binding type, e.g. "slack-channel", "github-repo",
    # "github-pr-mapping". Distinct from `entity_type` which is the
    # third-party object kind silo uses for its own bookkeeping.
    type = models.CharField(max_length=64, blank=True, null=True)

    entity_type = models.CharField(max_length=64, blank=True, null=True)
    entity_id = models.CharField(max_length=255, blank=True, null=True)
    entity_slug = models.CharField(max_length=255, blank=True, null=True)
    entity_data = models.JSONField(default=dict)

    config = models.JSONField(default=dict)

    class Meta:
        db_table = "workspace_entity_connections"
        verbose_name = "Workspace Entity Connection"
        verbose_name_plural = "Workspace Entity Connections"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace_connection", "entity_type"]),
            models.Index(fields=["project", "entity_type"]),
        ]

    def __str__(self):
        return f"{self.workspace_id}:{self.type}:{self.entity_id}"