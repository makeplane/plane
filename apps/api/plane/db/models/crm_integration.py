# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from plane.db.models import BaseModel
from plane.license.utils.encryption import encrypt_data, decrypt_data


class CrmIntegration(BaseModel):
    """Per-workspace configuration for pushing monthly worklog summaries to a CRM.

    The CRM API key is stored encrypted at rest (Fernet, derived from
    ``SECRET_KEY``) and is only ever decrypted in-process when a request to the
    CRM is made.
    """

    class SyncStatus(models.TextChoices):
        SUCCESS = "success", "Success"
        PARTIAL = "partial", "Partial"
        FAILED = "failed", "Failed"

    workspace = models.OneToOneField(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="crm_integration",
    )
    # Base URL of the CRM instance, e.g. https://crm.example.com
    crm_api_url = models.URLField(max_length=500)
    # CRM Bearer token, encrypted at rest. Never expose this field directly.
    crm_api_key_encrypted = models.TextField(blank=True, default="")
    # Plane custom field (entity_type="project") whose value holds the CRM project id.
    crm_project_id_custom_field = models.ForeignKey(
        "db.CustomField",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="crm_project_id_integration",
    )
    # Numeric id of the "Invoice hours" custom field on the CRM side.
    crm_invoice_hours_field_id = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    last_sync_status = models.CharField(
        max_length=20,
        choices=SyncStatus.choices,
        null=True,
        blank=True,
    )

    def set_api_key(self, raw_key):
        """Encrypt and store a raw CRM API key (pass an empty value to clear it)."""
        self.crm_api_key_encrypted = encrypt_data(raw_key) if raw_key else ""

    def get_api_key(self):
        """Return the decrypted CRM API key, or an empty string when unset."""
        if not self.crm_api_key_encrypted:
            return ""
        return decrypt_data(self.crm_api_key_encrypted)

    def __str__(self):
        return f"{self.workspace.slug} CRM integration"

    class Meta:
        verbose_name = "CRM Integration"
        verbose_name_plural = "CRM Integrations"
        db_table = "crm_integrations"
        ordering = ("-created_at",)


class CrmSyncLog(BaseModel):
    """Audit record of a single monthly sync run for one workspace."""

    integration = models.ForeignKey(
        CrmIntegration,
        on_delete=models.CASCADE,
        related_name="sync_logs",
    )
    # First day of the month the run covered, e.g. 2025-01-01.
    sync_month = models.DateField()
    status = models.CharField(max_length=20, choices=CrmIntegration.SyncStatus.choices)
    projects_processed = models.PositiveIntegerField(default=0)
    projects_synced = models.PositiveIntegerField(default=0)
    projects_skipped = models.PositiveIntegerField(default=0)
    # Per-project breakdown:
    # [{project_id, project_name, crm_project_id, total_hours, crm_task_id, status, error}]
    details = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.integration_id} {self.sync_month} {self.status}"

    class Meta:
        verbose_name = "CRM Sync Log"
        verbose_name_plural = "CRM Sync Logs"
        db_table = "crm_sync_logs"
        ordering = ("-created_at",)
