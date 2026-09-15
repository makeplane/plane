# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

from django.db import models


class ResearchAuditEventQuerySet(models.QuerySet):
    """Append-only queryset: updates and deletes are rejected at the ORM layer."""

    def update(self, **kwargs):
        raise TypeError("Research audit events are append-only and cannot be updated.")

    def delete(self, *args, **kwargs):
        raise TypeError("Research audit events are append-only and cannot be deleted.")

    def _raw_delete(self, using=None, keep_parents=False):
        raise TypeError("Research audit events are append-only and cannot be deleted.")


class ResearchAuditEventManager(models.Manager.from_queryset(ResearchAuditEventQuerySet)):
    pass


class ResearchAuditEvent(models.Model):
    """Append-only research audit trail.

    The model deliberately does not extend ``BaseModel``: there is no
    ``updated_by``/``deleted_at`` semantics and no cascade from business
    objects, so an audit trail survives report and organisation deletion.
    """

    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.PROTECT,
        related_name="research_audit_events",
    )
    actor = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_audit_events",
        null=True,
        blank=True,
    )
    action = models.CharField(max_length=64, db_index=True)
    resource_type = models.CharField(max_length=64)
    resource_id = models.UUIDField(null=True, blank=True)
    org_unit = models.ForeignKey(
        "db.OrgUnit",
        on_delete=models.SET_NULL,
        related_name="research_audit_events",
        null=True,
        blank=True,
    )
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = ResearchAuditEventManager()

    class Meta:
        verbose_name = "Research Audit Event"
        verbose_name_plural = "Research Audit Events"
        db_table = "research_audit_events"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace", "created_at"], name="research_audit_ws_created_idx"),
            models.Index(fields=["resource_type", "resource_id"], name="research_audit_resource_idx"),
            models.Index(fields=["actor", "created_at"], name="research_audit_actor_idx"),
            models.Index(fields=["workspace", "action"], name="research_audit_ws_action_idx"),
        ]

    def __str__(self):
        return f"{self.action} <{self.resource_type}>"

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise TypeError("Research audit events are append-only and cannot be updated.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise TypeError("Research audit events are append-only and cannot be deleted.")
