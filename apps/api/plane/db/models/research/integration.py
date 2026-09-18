# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""External system integration models (§4.7, P1-INT-01 ~ P1-INT-12).

Plane stores connection configuration, references and call metadata. It never
stores the source system's body text or raw files: a reference carries an identifier,
a title, a link and the permission hint the source system returned.
"""

from django.db import models

from plane.db.models.base import BaseModel

from .append_only import AppendOnlyModel


class IntegrationSystem(models.TextChoices):
    RAGPORTAL = "RAGPORTAL", "RAGPortal"
    WEKNORA = "WEKNORA", "WeKnora"
    SPECLABOS = "SPECLABOS", "SpecLabOS"
    SMARTACCESS = "SMARTACCESS", "SmartAccess"
    POLY_AGENT = "POLY_AGENT", "Poly_Agent"
    SPEC_AGENT = "SPEC_AGENT", "Spec_Agent"


class ExternalSystemConnection(BaseModel):
    """One configured connection per workspace and system (P1-INT-01, P1-INT-02)."""

    class AuthMode(models.TextChoices):
        HMAC = "HMAC", "PiLab HMAC"
        BEARER = "BEARER", "Bearer token"
        OIDC_CLIENT = "OIDC_CLIENT", "OIDC client credentials"
        NONE = "NONE", "None"

    class DegradedMode(models.TextChoices):
        LINK_ONLY = "LINK_ONLY", "Link only"
        HIDDEN = "HIDDEN", "Hidden"

    class HealthStatus(models.TextChoices):
        UNKNOWN = "UNKNOWN", "Unknown"
        OK = "OK", "Ok"
        DEGRADED = "DEGRADED", "Degraded"
        DOWN = "DOWN", "Down"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_integration_connections",
    )
    system = models.CharField(max_length=24, choices=IntegrationSystem.choices)
    display_name = models.CharField(max_length=255)
    base_url = models.URLField(max_length=500)
    auth_mode = models.CharField(max_length=16, choices=AuthMode.choices, default=AuthMode.HMAC)
    # only the name of a secret manager entry is stored (P1-INT-02)
    credential_ref = models.CharField(max_length=128, blank=True, default="")
    timeout_seconds = models.PositiveSmallIntegerField(default=3)
    cache_ttl_seconds = models.PositiveIntegerField(default=300)
    degraded_mode = models.CharField(
        max_length=16,
        choices=DegradedMode.choices,
        default=DegradedMode.LINK_ONLY,
    )
    is_enabled = models.BooleanField(default=False)
    health_status = models.CharField(
        max_length=16,
        choices=HealthStatus.choices,
        default=HealthStatus.UNKNOWN,
    )
    last_health_at = models.DateTimeField(null=True, blank=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    last_error = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        verbose_name = "External System Connection"
        verbose_name_plural = "External System Connections"
        db_table = "research_external_system_connections"
        ordering = ("system",)
        constraints = [
            models.UniqueConstraint(fields=["workspace", "system"], name="rsch_connection_uq_ws_system"),
        ]
        indexes = [
            models.Index(fields=["workspace", "is_enabled"], name="rsch_connection_ws_enabled_idx"),
        ]

    def __str__(self):
        return f"{self.workspace_id} <{self.system}>"


class ResearchExternalReference(BaseModel):
    """A read-only reference to an object owned by another system (§4.7)."""

    class ExternalType(models.TextChoices):
        KNOWLEDGE_ENTRY = "KNOWLEDGE_ENTRY", "Knowledge entry"
        RD_PROJECT = "RD_PROJECT", "R&D project"
        RD_TASK = "RD_TASK", "R&D task"
        RUN_RECORD = "RUN_RECORD", "Run record"
        DATA_ASSET = "DATA_ASSET", "Data asset"
        ANALYSIS_RESULT = "ANALYSIS_RESULT", "Analysis result"
        REPORT = "REPORT", "Report"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        UNAVAILABLE = "UNAVAILABLE", "Unavailable"
        REVOKED = "REVOKED", "Revoked"
        DEGRADED = "DEGRADED", "Degraded"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_external_references",
    )
    system = models.CharField(max_length=24, choices=IntegrationSystem.choices)
    external_type = models.CharField(max_length=32, choices=ExternalType.choices)
    external_id = models.CharField(max_length=255)
    external_parent_id = models.CharField(max_length=255, blank=True, default="")
    title = models.CharField(max_length=500)
    summary = models.TextField(blank=True, default="")
    source_url = models.URLField(max_length=500)
    acl_hint = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    content_hash = models.CharField(max_length=64, blank=True, default="")
    synced_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        verbose_name = "Research External Reference"
        verbose_name_plural = "Research External References"
        db_table = "research_external_references"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "system", "external_type", "external_id"],
                name="rsch_reference_uq_external",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "system", "status"], name="rsch_reference_ws_system_idx"),
            models.Index(fields=["external_type", "external_id"], name="rsch_reference_external_idx"),
        ]

    def __str__(self):
        return f"{self.system}:{self.external_type}:{self.external_id}"


class ExternalReferenceLink(BaseModel):
    """Attachment of an external reference to a Plane object (§4.7)."""

    class TargetType(models.TextChoices):
        PROJECT = "PROJECT", "Project"
        STAGE_MATERIAL = "STAGE_MATERIAL", "Stage material"
        LITERATURE_ENTRY = "LITERATURE_ENTRY", "Literature entry"
        EXPERIMENT_RECORD = "EXPERIMENT_RECORD", "Experiment record"
        PERIODIC_REPORT = "PERIODIC_REPORT", "Periodic report"
        OUTCOME = "OUTCOME", "Outcome"

    reference = models.ForeignKey(
        ResearchExternalReference,
        on_delete=models.CASCADE,
        related_name="links",
    )
    # no foreign key on purpose: the target may be any research object and the
    # link must not cascade across modules
    target_type = models.CharField(max_length=32, choices=TargetType.choices)
    target_id = models.UUIDField()
    created_by = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_external_reference_links",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "External Reference Link"
        verbose_name_plural = "External Reference Links"
        db_table = "research_external_reference_links"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["reference", "target_type", "target_id"],
                name="rsch_reference_link_uq",
            ),
        ]
        indexes = [
            models.Index(fields=["target_type", "target_id"], name="rsch_reference_link_target_idx"),
        ]

    def __str__(self):
        return f"{self.reference_id} -> {self.target_type}:{self.target_id}"


class IntegrationCallLog(AppendOnlyModel):
    """Append-only integration call log; no request or response bodies (§4.7)."""

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_integration_call_logs",
    )
    connection = models.ForeignKey(
        ExternalSystemConnection,
        on_delete=models.SET_NULL,
        related_name="call_logs",
        null=True,
        blank=True,
    )
    system = models.CharField(max_length=24, choices=IntegrationSystem.choices)
    operation = models.CharField(max_length=64)
    request_id = models.CharField(max_length=64, blank=True, default="")
    outcome = models.CharField(max_length=16)
    status_code = models.PositiveSmallIntegerField(null=True, blank=True)
    latency_ms = models.PositiveIntegerField(null=True, blank=True)
    error_code = models.CharField(max_length=64, blank=True, default="")

    class Meta:
        verbose_name = "Integration Call Log"
        verbose_name_plural = "Integration Call Logs"
        db_table = "research_integration_call_logs"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace", "system", "created_at"], name="rsch_call_log_ws_system_idx"),
            models.Index(fields=["outcome"], name="rsch_call_log_outcome_idx"),
        ]

    def __str__(self):
        return f"{self.system}:{self.operation}<{self.outcome}>"
