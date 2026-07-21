# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models
from django.db.models import Q

from .base import BaseModel
from .project import ProjectBaseModel


LOOPER_DISPATCH_HOLDING_STATES = (
    "queued",
    "claimed",
    "running",
    "awaiting_human",
    "stop_requested",
    "confirmed_stopped",
)


class LooperDispatch(ProjectBaseModel):
    """Durable execution ownership for a work item.

    The first delivery only reads this record. Mutation endpoints are introduced
    with the strict-dispatch state machine so legacy labels can never create
    execution authority.
    """

    HOLDING_STATES = LOOPER_DISPATCH_HOLDING_STATES
    STATE_CHOICES = tuple(
        (value, value.replace("_", " ").title())
        for value in (*LOOPER_DISPATCH_HOLDING_STATES, "released", "completed", "failed")
    )
    ROLE_CHOICES = (("planner", "Planner"), ("worker", "Worker"))
    MODE_CHOICES = (("auto", "Auto"), ("worker", "Worker"))
    WAIT_KIND_CHOICES = (
        ("role_decision", "Role decision"),
        ("technical_spec_approval", "Technical spec approval"),
        ("qa", "QA"),
    )
    HEALTH_CHOICES = (
        ("ok", "OK"),
        ("projection_drift", "Projection drift"),
        ("role_drift", "Role drift"),
        ("binding_suspended", "Binding suspended"),
        ("node_unreachable", "Node unreachable"),
    )

    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="looper_dispatches")
    node_binding = models.ForeignKey(
        "db.LooperNodeBinding",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="dispatches",
    )
    revision = models.PositiveBigIntegerField(default=1)
    state_version = models.PositiveBigIntegerField(default=1)
    requested_mode = models.CharField(max_length=16, choices=MODE_CHOICES)
    active_role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    active_role_revision = models.PositiveBigIntegerField(default=1)
    owner_member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="owned_looper_dispatches",
    )
    dispatched_by_member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_looper_dispatches",
    )
    node_id = models.CharField(max_length=128)
    node_name_snapshot = models.CharField(max_length=255)
    node_binding_revision = models.PositiveBigIntegerField(default=1)
    role_policy_revision = models.PositiveBigIntegerField(default=1)
    product_member_snapshot = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="looper_product_dispatches",
    )
    design_member_snapshot = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="looper_design_dispatches",
    )
    qa_member_snapshot = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="looper_qa_dispatches",
    )
    state = models.CharField(max_length=32, choices=STATE_CHOICES, default="queued")
    wait_kind = models.CharField(max_length=32, choices=WAIT_KIND_CHOICES, null=True, blank=True)
    health = models.CharField(max_length=32, choices=HEALTH_CHOICES, default="ok")
    execution_attempt_id = models.UUIDField(null=True, blank=True)
    claim_idempotency_key = models.UUIDField(null=True, blank=True)
    fencing_token = models.PositiveBigIntegerField(default=0)
    claim_lease_expires_at = models.DateTimeField(null=True, blank=True)
    last_node_ack_at = models.DateTimeField(null=True, blank=True)
    idempotency_key = models.UUIDField()
    release_reason = models.TextField(blank=True, default="")

    class Meta:
        db_table = "looper_dispatches"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["issue"],
                condition=Q(state__in=LOOPER_DISPATCH_HOLDING_STATES, deleted_at__isnull=True),
                name="looper_dispatch_active_issue_unique",
            ),
            models.UniqueConstraint(
                fields=["issue", "revision"],
                condition=Q(deleted_at__isnull=True),
                name="looper_dispatch_issue_revision_unique",
            ),
            models.UniqueConstraint(
                fields=["issue", "idempotency_key"],
                condition=Q(deleted_at__isnull=True),
                name="looper_dispatch_issue_idempotency_unique",
            ),
        ]
        indexes = [
            models.Index(fields=["node_id", "state"], name="looper_node_state_idx"),
            models.Index(fields=["issue", "state"], name="looper_issue_state_idx"),
        ]


class LooperRoleRequest(ProjectBaseModel):
    ROLE_CHOICES = (
        ("product", "Product"),
        ("design", "Design"),
        ("engineering", "Engineering"),
        ("qa", "QA"),
    )
    STATUS_CHOICES = (
        ("open", "Open"),
        ("answered", "Answered"),
        ("superseded", "Superseded"),
        ("expired", "Expired"),
    )

    dispatch = models.ForeignKey(LooperDispatch, on_delete=models.CASCADE, related_name="role_requests")
    source_event_key = models.CharField(max_length=255)
    role = models.CharField(max_length=24, choices=ROLE_CHOICES)
    question_summary = models.CharField(max_length=500)
    eligible_member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="looper_role_requests",
    )
    policy_revision = models.PositiveBigIntegerField()
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default="open")
    answer_comment = models.ForeignKey(
        "db.IssueComment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="looper_role_answers",
    )
    answered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "looper_role_requests"
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["dispatch", "source_event_key"],
                condition=Q(deleted_at__isnull=True),
                name="looper_role_request_source_unique",
            )
        ]


class LooperArtifact(ProjectBaseModel):
    SOURCE_KIND_CHOICES = (
        ("plane_page", "Plane page"),
        ("plane_comment", "Plane comment"),
        ("scm_pr", "SCM pull request"),
    )

    dispatch = models.ForeignKey(LooperDispatch, on_delete=models.CASCADE, related_name="artifacts")
    source_event_key = models.CharField(max_length=255)
    type = models.CharField(max_length=48)
    title = models.CharField(max_length=255)
    url = models.URLField(max_length=2048)
    content_hash = models.CharField(max_length=64, blank=True, default="")
    source_revision_id = models.CharField(max_length=255)
    source_kind = models.CharField(max_length=24, choices=SOURCE_KIND_CHOICES)
    source_object_id = models.CharField(max_length=255)

    class Meta:
        db_table = "looper_artifacts"
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["dispatch", "source_event_key"],
                condition=Q(deleted_at__isnull=True),
                name="looper_artifact_source_unique",
            )
        ]


class LooperCollaborationEvent(ProjectBaseModel):
    dispatch = models.ForeignKey(LooperDispatch, on_delete=models.CASCADE, related_name="collaboration_events")
    event_version = models.PositiveBigIntegerField()
    source_event_key = models.CharField(max_length=255)
    event_type = models.CharField(max_length=48)
    phase = models.CharField(max_length=48)
    role = models.CharField(max_length=24, blank=True, default="")
    role_request = models.ForeignKey(
        LooperRoleRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )
    actor_member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="looper_collaboration_events",
    )
    role_policy_revision = models.PositiveBigIntegerField()
    artifact = models.ForeignKey(
        LooperArtifact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )
    payload_schema_version = models.PositiveSmallIntegerField(default=1)
    payload = models.JSONField(default=dict, blank=True)
    occurred_at = models.DateTimeField()

    class Meta:
        db_table = "looper_collaboration_events"
        ordering = ("event_version",)
        constraints = [
            models.UniqueConstraint(
                fields=["dispatch", "event_version"],
                condition=Q(deleted_at__isnull=True),
                name="looper_event_version_unique",
            ),
            models.UniqueConstraint(
                fields=["dispatch", "source_event_key"],
                condition=Q(deleted_at__isnull=True),
                name="looper_event_source_unique",
            ),
        ]


class LooperCollaborationSnapshot(ProjectBaseModel):
    dispatch = models.OneToOneField(LooperDispatch, on_delete=models.CASCADE, related_name="collaboration_snapshot")
    phase = models.CharField(max_length=48)
    phase_started_at = models.DateTimeField(null=True, blank=True)
    waiting_role = models.CharField(max_length=24, blank=True, default="")
    waiting_member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="looper_waiting_snapshots",
    )
    role_counts = models.JSONField(default=dict)
    snapshot_version = models.PositiveBigIntegerField(default=0)
    events_sha256 = models.CharField(max_length=64, blank=True, default="")

    class Meta:
        db_table = "looper_collaboration_snapshots"


class LooperRequestNonce(BaseModel):
    """One-time nonce consumed by a signed Node request.

    This intentionally lives in PostgreSQL so replay consumption can commit in
    the same transaction as the protected dispatch mutation.
    """

    binding_id = models.UUIDField()
    key_revision = models.PositiveBigIntegerField()
    nonce = models.BinaryField(max_length=16)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "looper_request_nonces"
        constraints = [
            models.UniqueConstraint(
                fields=["binding_id", "key_revision", "nonce"],
                name="looper_request_nonce_unique",
            )
        ]
        indexes = [models.Index(fields=["expires_at"], name="looper_nonce_expiry_idx")]


class LooperLinkChallengeReplay(BaseModel):
    """Single-use record for a loopernet-signed link challenge."""

    challenge_id = models.UUIDField(unique=True)
    nonce = models.BinaryField(max_length=16)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "looper_link_challenge_replays"
        indexes = [models.Index(fields=["expires_at"], name="looper_link_expiry_idx")]
