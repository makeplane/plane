# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workflow core models — spec §7.1–§7.7.

This module is the schema foundation for the Workflows feature
(``docs/workflows-approvals-portal-spec.md`` §7, §27, §30 P0.1). It is
additive only: no existing behavior changes, no resolvers, no API
endpoints. Phase 0 ships models, constraints, and indexes; subsequent
PRs (P0.2+) wire the runtime on top.

Models land in spec order:

- §7.1 ``Workflow`` — project-scoped workflow with default/active flags
- §7.2 ``WorkflowRevision`` — immutable versioned configuration
- §7.3 ``WorkflowTypeAssignment`` — workflow per Work Item type
- §7.4 ``WorkflowState`` — State inclusion per revision
- §7.5 ``WorkflowFlow`` — transition / approval edges between states
- §7.6 ``WorkflowFlowActor`` — resolver config per flow edge
- §7.7 ``IssueWorkflowBinding`` — pins a running Work Item to a revision

Constraints follow §7 prose. Runtime-lookup indexes follow §27. The
approval models (§7.8–§7.10) and the project-level runtime flag
enforcement (§25 Phase 1) are intentionally deferred to P1.1 / P0.2.
"""

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from .project import ProjectBaseModel


# ---------------------------------------------------------------------------
# Enum-like choice sets
# ---------------------------------------------------------------------------

class WorkflowRevisionStatus(models.TextChoices):
    """§7.2 — status of a workflow revision.

    V1 only ever produces ``draft`` and ``published``; ``retired`` exists
    so historical revisions can be marked end-of-life without being
    hard-deleted (published revisions are otherwise immutable).
    """

    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"
    RETIRED = "retired", "Retired"


class WorkflowFlowType(models.TextChoices):
    """§7.5 — the kind of edge a flow represents.

    ``transition`` is a free state move; ``approval`` gates the move on
    an approval decision (§11). The two are mutually exclusive per
    source state — see the §7.5 validation rule.
    """

    TRANSITION = "transition", "Transition"
    APPROVAL = "approval", "Approval"


class WorkflowFlowActorType(models.TextChoices):
    """§7.6 — the actor resolver kinds a flow edge can declare.

    The list mirrors the spec verbatim. Adding a new resolver type is a
    P1.3 task and must also extend ``plane.workflows.actors``
    (P0.3) so the resolver registry knows about it.
    """

    ALL_PROJECT_MEMBERS = "ALL_PROJECT_MEMBERS", "All project members"
    STATIC_USERS = "STATIC_USERS", "Static users"
    PROJECT_ROLE = "PROJECT_ROLE", "Project role"
    REQUESTER_MANAGER = "REQUESTER_MANAGER", "Requester manager"
    DEPARTMENT_HEAD = "DEPARTMENT_HEAD", "Department head"
    PORTAL_ROLE = "PORTAL_ROLE", "Portal role"
    PROPERTY_MEMBER = "PROPERTY_MEMBER", "Member property"


# ---------------------------------------------------------------------------
# §7.1 Workflow
# ---------------------------------------------------------------------------

class Workflow(ProjectBaseModel):
    """A workflow configuration container scoped to a single project.

    A project always has at most one non-deleted ``default`` workflow
    (§7.1 partial-unique). Custom workflows can be inactive without
    being deleted; the default workflow is intended to be permanent
    (deletion is blocked at the application layer, not via DB
    constraint, so the deletion block can return a structured error).
    """

    name = models.CharField(max_length=255, verbose_name="Workflow Name")
    description = models.TextField(verbose_name="Workflow Description", blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Workflow"
        verbose_name_plural = "Workflows"
        db_table = "workflows"
        ordering = ("-created_at",)
        indexes = [
            # §27 runtime lookup: resolving the project default and
            # filtering active candidates.
            models.Index(
                fields=["project", "is_active", "is_default"],
                name="workflows_proj_active_dflt_idx",
            ),
        ]
        constraints = [
            # workflow name unique per project among non-deleted rows
            models.UniqueConstraint(
                fields=["project", "name"],
                condition=Q(deleted_at__isnull=True),
                name="workflows_unique_name_project_when_active",
            ),
            # exactly one non-deleted default workflow per project
            models.UniqueConstraint(
                fields=["project"],
                condition=Q(deleted_at__isnull=True, is_default=True),
                name="workflows_unique_default_project_when_active",
            ),
        ]

    def __str__(self):
        return f"{self.name} <{self.project.name}>"


# ---------------------------------------------------------------------------
# §7.2 WorkflowRevision
# ---------------------------------------------------------------------------

class WorkflowRevision(ProjectBaseModel):
    """An immutable, versioned snapshot of a workflow configuration.

    A workflow has at most one ``draft`` revision at any time (§7.2
    partial-unique); ``published`` revisions are immutable per §28.11
    and §29.6. ``retired`` exists so the historical record can survive
    a re-publish without an orphaned revision lingering in ``draft``.
    """

    workflow = models.ForeignKey(
        "db.Workflow",
        on_delete=models.CASCADE,
        related_name="revisions",
    )
    version = models.PositiveIntegerField()
    status = models.CharField(
        max_length=16,
        choices=WorkflowRevisionStatus.choices,
        default=WorkflowRevisionStatus.DRAFT,
    )
    published_at = models.DateTimeField(null=True, blank=True)
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="published_workflow_revisions",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Workflow Revision"
        verbose_name_plural = "Workflow Revisions"
        db_table = "workflow_revisions"
        ordering = ("-created_at",)
        indexes = [
            # §27 runtime lookup: "is there a current published revision
            # for this workflow?".
            models.Index(
                fields=["workflow", "status"],
                name="wf_revisions_wf_status_idx",
            ),
        ]
        constraints = [
            # (workflow, version) unique — versioning is total
            models.UniqueConstraint(
                fields=["workflow", "version"],
                name="workflow_revisions_unique_workflow_version",
            ),
            # only one draft revision per workflow at a time
            models.UniqueConstraint(
                fields=["workflow"],
                condition=Q(deleted_at__isnull=True, status=WorkflowRevisionStatus.DRAFT),
                name="workflow_revisions_unique_draft_per_workflow",
            ),
        ]

    def __str__(self):
        return f"{self.workflow.name} v{self.version} <{self.status}>"


# ---------------------------------------------------------------------------
# §7.3 WorkflowTypeAssignment
# ---------------------------------------------------------------------------

class WorkflowTypeAssignment(ProjectBaseModel):
    """Assigns a workflow to a ``(project, issue_type)`` pair.

    The default workflow (§7.1) does not require an assignment. Active
    resolution (§8) picks the assignment for the issue's type when one
    exists, otherwise falls back to the project default. Inactive
    assignments are simply ignored at resolution time — they remain in
    the table so admins can re-activate them without losing
    configuration.
    """

    workflow = models.ForeignKey(
        "db.Workflow",
        on_delete=models.CASCADE,
        related_name="type_assignments",
    )
    issue_type = models.ForeignKey(
        "db.IssueType",
        on_delete=models.CASCADE,
        related_name="workflow_assignments",
    )

    class Meta:
        verbose_name = "Workflow Type Assignment"
        verbose_name_plural = "Workflow Type Assignments"
        db_table = "workflow_type_assignments"
        ordering = ("-created_at",)
        indexes = [
            # §27 runtime lookup: "which workflow governs this issue
            # type?".
            models.Index(
                fields=["project", "issue_type"],
                name="wf_type_assignments_lookup_idx",
            ),
        ]
        constraints = [
            # one assignment per (project, issue_type) among non-deleted
            models.UniqueConstraint(
                fields=["project", "issue_type"],
                condition=Q(deleted_at__isnull=True),
                name="workflow_type_assignments_unique_project_issue_type",
            ),
        ]

    def __str__(self):
        return f"{self.workflow.name} → {self.issue_type.name} <{self.project.name}>"


# ---------------------------------------------------------------------------
# §7.4 WorkflowState
# ---------------------------------------------------------------------------

class WorkflowState(ProjectBaseModel):
    """Inclusion of a project ``State`` in a ``WorkflowRevision``.

    A state is referenced by name inside a revision (rather than reused
    across revisions) so that editing a revision does not mutate the
    historical record. The spec also constrains flows to reference
    states included in the same revision — that rule is enforced in
    the service layer, not the schema.
    """

    revision = models.ForeignKey(
        "db.WorkflowRevision",
        on_delete=models.CASCADE,
        related_name="states",
    )
    state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        related_name="workflow_state_inclusions",
    )
    allow_new_work_items = models.BooleanField(default=False)
    sequence = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Workflow State"
        verbose_name_plural = "Workflow States"
        db_table = "workflow_states"
        ordering = ("sequence",)
        indexes = [
            # §27 runtime lookup: load all states for a revision at once.
            models.Index(
                fields=["revision", "state"],
                name="workflow_states_rev_st_idx",
            ),
        ]
        constraints = [
            # (revision, state) unique — a state appears at most once
            # per revision.
            models.UniqueConstraint(
                fields=["revision", "state"],
                name="workflow_states_unique_revision_state",
            ),
        ]

    def __str__(self):
        return f"{self.state.name} <r{self.revision_id}>"


# ---------------------------------------------------------------------------
# §7.5 WorkflowFlow
# ---------------------------------------------------------------------------

class WorkflowFlow(ProjectBaseModel):
    """An edge in a workflow revision.

    Two edge kinds share this table: ``transition`` (a free state move)
    and ``approval`` (a state move gated on an approval decision, with
    a ``reject_state`` to land on). All §7.5 validations
    (``source != target``, transition/approval ``reject_state``
    invariants, same-``flow_type`` per source state) are enforced by
    the workflow service layer in P0.3, not the schema. The schema
    only requires ``source_state`` to be non-null, ``target_state`` to
    be non-null, and ``reject_state`` to be nullable.
    """

    revision = models.ForeignKey(
        "db.WorkflowRevision",
        on_delete=models.CASCADE,
        related_name="flows",
    )
    source_state = models.ForeignKey(
        "db.WorkflowState",
        on_delete=models.CASCADE,
        related_name="outgoing_flows",
    )
    flow_type = models.CharField(
        max_length=16,
        choices=WorkflowFlowType.choices,
        default=WorkflowFlowType.TRANSITION,
    )
    target_state = models.ForeignKey(
        "db.WorkflowState",
        on_delete=models.CASCADE,
        related_name="incoming_flows",
    )
    reject_state = models.ForeignKey(
        "db.WorkflowState",
        on_delete=models.CASCADE,
        related_name="reject_target_flows",
        null=True,
        blank=True,
    )
    sequence = models.FloatField(default=65535)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Workflow Flow"
        verbose_name_plural = "Workflow Flows"
        db_table = "workflow_flows"
        ordering = ("sequence",)
        indexes = [
            # §27 runtime lookup: given a source state and a revision,
            # list active flows.
            models.Index(
                fields=["revision", "source_state", "is_active"],
                name="workflow_flows_lookup_idx",
            ),
        ]

    def __str__(self):
        return f"{self.source_state_id} → {self.target_state_id} ({self.flow_type})"


# ---------------------------------------------------------------------------
# §7.6 WorkflowFlowActor
# ---------------------------------------------------------------------------

class WorkflowFlowActor(ProjectBaseModel):
    """Per-flow actor configuration.

    ``config`` is the actor-specific payload (e.g. a list of user IDs
    for ``STATIC_USERS``). Interpretation lives in
    ``plane.workflows.actors`` (P0.3) — no other code is allowed to
    read this JSON directly (§7.6 invariant).
    """

    flow = models.ForeignKey(
        "db.WorkflowFlow",
        on_delete=models.CASCADE,
        related_name="actors",
    )
    actor_type = models.CharField(
        max_length=64,
        choices=WorkflowFlowActorType.choices,
    )
    config = models.JSONField(default=dict, blank=True)
    sequence = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Workflow Flow Actor"
        verbose_name_plural = "Workflow Flow Actors"
        db_table = "workflow_flow_actors"
        ordering = ("sequence",)

    def __str__(self):
        return f"{self.actor_type} on flow {self.flow_id}"


# ---------------------------------------------------------------------------
# §7.7 IssueWorkflowBinding
# ---------------------------------------------------------------------------

class IssueWorkflowBinding(ProjectBaseModel):
    """Pins a running Work Item to a specific workflow revision.

    The fork deliberately treats ``workflow_revision`` as immutable
    per §28.12 — republishing a workflow does not silently change the
    process for already-running items. New items bind to the current
    published revision on creation (P0.3); legacy items lazy-bind on
    first workflow-aware state action (§25 Phase 3).
    """

    issue = models.OneToOneField(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="workflow_binding",
    )
    workflow = models.ForeignKey(
        "db.Workflow",
        on_delete=models.CASCADE,
        related_name="issue_bindings",
    )
    workflow_revision = models.ForeignKey(
        "db.WorkflowRevision",
        on_delete=models.CASCADE,
        related_name="issue_bindings",
    )
    bound_at = models.DateTimeField(auto_now_add=True)
    bound_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="workflow_bindings_created",
        null=True,
        blank=True,
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    migrated_from_revision = models.ForeignKey(
        "db.WorkflowRevision",
        on_delete=models.SET_NULL,
        related_name="migrated_to_bindings",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Issue Workflow Binding"
        verbose_name_plural = "Issue Workflow Bindings"
        db_table = "issue_workflow_bindings"
        ordering = ("-bound_at",)
        # §27 runtime lookup is implicitly satisfied by the
        # ``OneToOneField`` on ``issue`` (Django creates a unique index
        # for it). Adding an explicit ``Index(fields=["issue"])`` would
        # duplicate that index.

    def __str__(self):
        return f"issue={self.issue_id} workflow={self.workflow_id} revision={self.workflow_revision_id}"
