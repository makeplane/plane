# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.utils import timezone

from .project import ProjectBaseModel, ProjectMember
from .workspace import WorkspaceMember


class LooperNodeBinding(ProjectBaseModel):
    STATE_CHOICES = (
        ("pending", "Pending"),
        ("active", "Active"),
        ("revocation_pending", "Revocation pending"),
        ("revoked", "Revoked"),
    )

    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="looper_node_bindings",
    )
    node_id = models.CharField(max_length=128)
    node_name_snapshot = models.CharField(max_length=255)
    allowed_roles = models.JSONField(default=list)
    allow_offline_queue = models.BooleanField(default=False)
    state = models.CharField(max_length=32, choices=STATE_CHOICES, default="pending")
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_looper_node_bindings",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revision = models.PositiveBigIntegerField(default=1)

    class Meta:
        db_table = "looper_node_bindings"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "member"],
                condition=Q(state__in=("pending", "active", "revocation_pending"), deleted_at__isnull=True),
                name="looper_binding_active_member_unique",
            ),
            models.UniqueConstraint(
                fields=["project", "node_id"],
                condition=Q(state__in=("pending", "active", "revocation_pending"), deleted_at__isnull=True),
                name="looper_binding_active_node_unique",
            ),
        ]
        indexes = [models.Index(fields=["project", "state"], name="looper_binding_state_idx")]


class LooperConnectionSession(ProjectBaseModel):
    STATUS_CHOICES = (
        ("created", "Created"),
        ("cli_connected", "CLI connected"),
        ("binding_created", "Binding created"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
        ("expired", "Expired"),
        ("failed", "Failed"),
        ("device_exists", "Device exists"),
    )

    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="looper_connection_sessions",
    )
    connect_code = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default="created")
    expires_at = models.DateTimeField()
    binding = models.ForeignKey(
        LooperNodeBinding,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="connection_sessions",
    )
    node_id = models.CharField(max_length=128, blank=True, default="")
    node_name = models.CharField(max_length=255, blank=True, default="")
    error_code = models.CharField(max_length=64, blank=True, default="")
    error_detail = models.TextField(blank=True, default="")
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "looper_connection_sessions"
        indexes = [
            models.Index(fields=["project", "member", "status"], name="looper_connect_owner_idx"),
        ]


class LooperNodeKey(ProjectBaseModel):
    STATE_CHOICES = (
        ("active", "Active"),
        ("recovery_only", "Recovery only"),
        ("revoked", "Revoked"),
    )

    binding = models.ForeignKey(LooperNodeBinding, on_delete=models.PROTECT, related_name="keys")
    key_revision = models.PositiveBigIntegerField()
    public_key = models.BinaryField(max_length=32)
    state = models.CharField(max_length=24, choices=STATE_CHOICES, default="active")
    revoked_at = models.DateTimeField(null=True, blank=True)
    stop_ack_attempt_allowlist = models.JSONField(default=list)

    class Meta:
        db_table = "looper_node_keys"
        constraints = [
            models.UniqueConstraint(
                fields=["binding", "key_revision"],
                condition=Q(deleted_at__isnull=True),
                name="looper_node_key_revision_unique",
            ),
            models.UniqueConstraint(
                fields=["binding"],
                condition=Q(state="active", deleted_at__isnull=True),
                name="looper_node_key_active_unique",
            ),
        ]


class LooperNodeSession(ProjectBaseModel):
    STATE_CHOICES = (("active", "Active"), ("closed", "Closed"))

    session_id = models.UUIDField()
    binding = models.ForeignKey(LooperNodeBinding, on_delete=models.PROTECT, related_name="sessions")
    instance_nonce = models.BinaryField(max_length=16)
    lease_expires_at = models.DateTimeField()
    last_renewed_at = models.DateTimeField()
    state = models.CharField(max_length=16, choices=STATE_CHOICES, default="active")

    class Meta:
        db_table = "looper_node_sessions"
        constraints = [
            models.UniqueConstraint(
                fields=["session_id"],
                condition=Q(deleted_at__isnull=True),
                name="looper_node_session_id_unique",
            ),
            models.UniqueConstraint(
                fields=["binding"],
                condition=Q(state="active", deleted_at__isnull=True),
                name="looper_node_session_active_unique",
            ),
        ]


class LooperProjectIntegration(ProjectBaseModel):
    STATE_CHOICES = (("read_only", "Read only"), ("active", "Active"), ("paused", "Paused"))

    state = models.CharField(max_length=16, choices=STATE_CHOICES, default="read_only")
    strict_epoch = models.DateTimeField(null=True, blank=True)
    activation_checklist_revision = models.PositiveBigIntegerField(default=0)
    effective_legacy_trigger_label_ids = models.JSONField(default=list)
    node_capability_revisions = models.JSONField(default=dict)
    paused_reason = models.TextField(blank=True, default="")

    class Meta:
        db_table = "looper_project_integrations"
        constraints = [
            models.UniqueConstraint(
                fields=["project"],
                condition=Q(deleted_at__isnull=True),
                name="looper_project_integration_unique",
            )
        ]


class LooperProjectRolePolicy(ProjectBaseModel):
    product_member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="looper_product_role_policies",
    )
    design_member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="looper_design_role_policies",
    )
    qa_member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="looper_qa_role_policies",
    )
    revision = models.PositiveBigIntegerField(default=1)

    class Meta:
        db_table = "looper_project_role_policies"
        constraints = [
            models.UniqueConstraint(
                fields=["project"],
                condition=Q(deleted_at__isnull=True),
                name="looper_project_role_policy_unique",
            )
        ]


class LooperWorkItemProtocol(ProjectBaseModel):
    PROTOCOL_CHOICES = (("legacy", "Legacy"), ("strict_v1", "Strict v1"))

    issue = models.OneToOneField("db.Issue", on_delete=models.PROTECT, related_name="looper_protocol")
    protocol = models.CharField(max_length=16, choices=PROTOCOL_CHOICES)
    classified_at = models.DateTimeField()
    classified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="classified_looper_work_items",
    )
    project_strict_epoch = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self._state.adding:
            original = LooperWorkItemProtocol.all_objects.only(
                "issue_id", "project_id", "protocol", "project_strict_epoch"
            ).get(id=self.id)
            immutable = ("issue_id", "project_id", "protocol", "project_strict_epoch")
            if any(getattr(original, field) != getattr(self, field) for field in immutable):
                raise ValueError("Looper work item protocol classification is immutable")
        super().save(*args, **kwargs)

    class Meta:
        db_table = "looper_work_item_protocols"


def _mark_removed_member_drift(*, member_id, project_id=None, workspace_id=None):
    from .looper import LooperDispatch

    scope = Q(project_id=project_id) if project_id else Q(workspace_id=workspace_id)
    current_binding_states = ("pending", "active", "revocation_pending")
    LooperNodeBinding.objects.filter(scope, member_id=member_id, state__in=current_binding_states).update(
        state="revocation_pending",
        revision=models.F("revision") + 1,
        revoked_at=timezone.now(),
    )
    LooperDispatch.objects.filter(scope, state__in=LooperDispatch.HOLDING_STATES).filter(
        Q(owner_member_id=member_id)
        | Q(product_member_snapshot_id=member_id)
        | Q(design_member_snapshot_id=member_id)
        | Q(qa_member_snapshot_id=member_id)
    ).update(health="role_drift")
    LooperProjectIntegration.objects.filter(scope).update(
        state="paused",
        paused_reason="A configured Looper role member was removed; remap roles before resuming.",
    )


@receiver(post_save, sender=ProjectMember)
def mark_looper_drift_for_inactive_project_member(sender, instance, **kwargs):
    if instance.member_id and (not instance.is_active or instance.deleted_at is not None):
        _mark_removed_member_drift(member_id=instance.member_id, project_id=instance.project_id)


@receiver(post_delete, sender=ProjectMember)
def mark_looper_drift_for_deleted_project_member(sender, instance, **kwargs):
    if instance.member_id:
        _mark_removed_member_drift(member_id=instance.member_id, project_id=instance.project_id)


@receiver(post_save, sender=WorkspaceMember)
def mark_looper_drift_for_inactive_workspace_member(sender, instance, **kwargs):
    if instance.member_id and (not instance.is_active or instance.deleted_at is not None):
        _mark_removed_member_drift(member_id=instance.member_id, workspace_id=instance.workspace_id)


@receiver(post_delete, sender=WorkspaceMember)
def mark_looper_drift_for_deleted_workspace_member(sender, instance, **kwargs):
    if instance.member_id:
        _mark_removed_member_drift(member_id=instance.member_id, workspace_id=instance.workspace_id)


from .issue import Issue  # noqa: E402


@receiver(post_save, sender=Issue)
def classify_issue_for_looper_protocol(sender, instance, created, **kwargs):
    if not created:
        return
    integration = LooperProjectIntegration.objects.filter(project_id=instance.project_id).first()
    if integration is None:
        return
    is_strict = integration.strict_epoch is not None and instance.created_at >= integration.strict_epoch
    LooperWorkItemProtocol.objects.get_or_create(
        issue=instance,
        defaults={
            "project_id": instance.project_id,
            "workspace_id": instance.workspace_id,
            "protocol": "strict_v1" if is_strict else "legacy",
            "classified_at": instance.created_at,
            "classified_by_id": instance.created_by_id,
            "project_strict_epoch": integration.strict_epoch,
        },
    )
