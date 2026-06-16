# Django imports
from django.db import models

# Module imports
from .base import BaseModel
from .change_management import CabGroup


class WorkspaceSecOpsConfig(BaseModel):
    """
    Workspace-level configuration for SecOps features
    (Change Management, and potentially Support Tickets in the future).

    Each workspace can have at most one config row. If no row exists,
    the backend falls back to auto-discovering the first project in
    the workspace.
    """

    workspace = models.OneToOneField(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="secops_config",
    )
    default_change_project = models.ForeignKey(
        "db.Project",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="secops_config_changes",
        help_text=(
            "Default project used to store change management records "
            "in this workspace. If NULL, the first project in the "
            "workspace is used automatically."
        ),
    )
    cab_group = models.ForeignKey(
        CabGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="secops_configs",
        help_text=(
            "The designated CAB group for this workspace. "
            "Used during the Authorize stage of Normal changes."
        ),
    )

    class Meta:
        verbose_name = "Workspace SecOps Config"
        verbose_name_plural = "Workspace SecOps Configs"
        db_table = "workspace_secops_configs"
        ordering = ("-created_at",)

    def __str__(self):
        project_name = (
            self.default_change_project.name
            if self.default_change_project
            else "(auto)"
        )
        cab_name = (
            self.cab_group.name
            if self.cab_group
            else "(none)"
        )
        return f"{self.workspace.name} → project:{project_name}, cab:{cab_name}"
