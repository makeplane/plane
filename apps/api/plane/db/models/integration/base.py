# Python imports
import uuid

# Django imports
from django.db import models

# Module imports
from plane.db.models import BaseModel
from plane.db.mixins import AuditModel


class Integration(AuditModel):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    title = models.CharField(max_length=400)
    provider = models.CharField(max_length=400, unique=True)
    network = models.PositiveIntegerField(default=1, choices=((1, "Private"), (2, "Public")))
    description = models.JSONField(default=dict)
    author = models.CharField(max_length=400, blank=True)
    webhook_url = models.TextField(blank=True)
    webhook_secret = models.TextField(blank=True)
    redirect_url = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)
    verified = models.BooleanField(default=False)
    avatar_url = models.TextField(blank=True, null=True)

    def __str__(self):
        """Return provider of the integration"""
        return f"{self.provider}"

    class Meta:
        verbose_name = "Integration"
        verbose_name_plural = "Integrations"
        db_table = "integrations"
        ordering = ("-created_at",)


class WorkspaceIntegration(BaseModel):
    workspace = models.ForeignKey("db.Workspace", related_name="workspace_integrations", on_delete=models.CASCADE)
    # Bot user
    actor = models.ForeignKey("db.User", related_name="integrations", on_delete=models.CASCADE)
    integration = models.ForeignKey("db.Integration", related_name="integrated_workspaces", on_delete=models.CASCADE)
    api_token = models.ForeignKey("db.APIToken", related_name="integrations", on_delete=models.CASCADE)
    metadata = models.JSONField(default=dict)

    config = models.JSONField(default=dict)

    def __str__(self):
        """Return name of the integration and workspace"""
        return f"{self.workspace.name} <{self.integration.provider}>"

    class Meta:
        unique_together = ["workspace", "integration"]
        verbose_name = "Workspace Integration"
        verbose_name_plural = "Workspace Integrations"
        db_table = "workspace_integrations"
        ordering = ("-created_at",)
