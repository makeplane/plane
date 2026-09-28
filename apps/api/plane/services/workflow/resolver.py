# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Effective-workflow resolver — spec §8.

Resolution order (§8):

1. ``Project.workflow_enabled`` must be ``True`` (gated by the
   instance flag at the call site — see ``flags.workflows_active``).
2. If ``IssueWorkflowBinding`` already exists, the binding wins over
   current configuration so a published revision cannot change the
   process for an already-running item (§28.12).
3. Otherwise:

   a. active ``WorkflowTypeAssignment`` for ``issue.type_id``; else
   b. active ``Project.workflow_enabled`` project's default
      ``Workflow``.

4. The resolved ``Workflow``'s current published ``WorkflowRevision``
   is what gets returned.

The resolver never raises when enforcement is disabled: callers must
gate on ``flags.workflows_active`` and treat ``None`` as "no
enforcement".
"""

# Django imports
from django.db.models import Prefetch

# Module imports
from plane.db.models import (
    IssueWorkflowBinding,
    Workflow,
    WorkflowRevision,
    WorkflowRevisionStatus,
    WorkflowState,
    WorkflowTypeAssignment,
)


# Sentinel — ``revision_id`` is sometimes passed as ``None`` when a
# caller short-circuits the resolver. The helper returns an empty
# queryset in that case so callers can chain ``.filter(...)`` without
# having to special-case ``None``.
_EMPTY_QS = WorkflowState.objects.none()


# ---------------------------------------------------------------------------
# Resolution data class
# ---------------------------------------------------------------------------


class EffectiveWorkflow:
    """The resolved workflow + revision + binding snapshot.

    ``binding`` may be ``None`` for newly-resolved cases; ``resolver``
    does not create bindings — that is ``bindings.ensure_binding``'s
    job (§25 Phase 3).
    """

    __slots__ = (
        "workflow",
        "revision",
        "binding",
        "is_type_specific",
    )

    def __init__(
        self,
        *,
        workflow: Workflow,
        revision: WorkflowRevision,
        binding: IssueWorkflowBinding | None,
        is_type_specific: bool,
    ):
        self.workflow = workflow
        self.revision = revision
        self.binding = binding
        self.is_type_specific = is_type_specific

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return (
            f"EffectiveWorkflow(workflow={self.workflow_id}, "
            f"revision={self.revision_id}, binding={self.binding and self.binding.issue_id}, "
            f"is_type_specific={self.is_type_specific})"
        )

    # Convenience accessors that mirror the underlying models.
    @property
    def workflow_id(self):
        return self.workflow.pk

    @property
    def revision_id(self):
        return self.revision.pk

    @property
    def workflow_version(self) -> int:
        return self.revision.version


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _latest_published_revision(workflow_id):
    """Return the current published revision for a workflow, or ``None``."""
    return (
        WorkflowRevision.objects.filter(
            workflow_id=workflow_id,
            status=WorkflowRevisionStatus.PUBLISHED,
        )
        .order_by("-version")
        .first()
    )


def _active_type_assignment(project_id, issue_type_id):
    """Return the active type-specific workflow assignment, if any."""
    return (
        WorkflowTypeAssignment.objects.filter(
            project_id=project_id,
            issue_type_id=issue_type_id,
            workflow__is_active=True,
            workflow__is_default=False,
        )
        .select_related("workflow")
        .order_by("-created_at")
        .first()
    )


def _active_default_workflow(project_id):
    """Return the project's active default workflow, if any."""
    return (
        Workflow.objects.filter(
            project_id=project_id,
            is_active=True,
            is_default=True,
        )
        .order_by("-created_at")
        .first()
    )


def _states_qs_for(revision_id):
    """Return the ``WorkflowState`` rows for a revision, ordered by sequence."""
    return WorkflowState.objects.filter(revision_id=revision_id).order_by("sequence", "created_at")


# ---------------------------------------------------------------------------
# Resolver
# ---------------------------------------------------------------------------


class WorkflowResolver:
    """Stateless resolver for §8 effective-workflow semantics.

    Use ``WorkflowResolver.resolve(issue)``. The returned
    ``EffectiveWorkflow`` (or ``None`` when no enforcement applies) is
    safe to cache on the request scope for the duration of one
    mutation cycle.
    """

    @staticmethod
    def resolve(issue) -> EffectiveWorkflow | None:
        """Return the effective workflow for ``issue`` or ``None``.

        ``issue`` must expose ``id``, ``project_id``, ``type_id`` and
        (optionally) ``project.workflow_enabled``. Soft-deleted
        issues should not reach here, but if they do we return
        ``None`` to keep the safe default.
        """
        if issue is None:
            return None

        project_id = issue.project_id

        # 2) Existing binding wins over published revisions (§28.12).
        binding = (
            IssueWorkflowBinding.objects.filter(issue_id=issue.id)
            .select_related("workflow", "workflow_revision")
            .first()
        )
        if binding is not None:
            # The binding always points at a real revision. Defensive:
            # if the revision has been retired/missing we still return
            # the snapshot; the calling service treats this as a
            # workflow error.
            return EffectiveWorkflow(
                workflow=binding.workflow,
                revision=binding.workflow_revision,
                binding=binding,
                is_type_specific=False,
            )

        # 3) Type-specific override, then default workflow.
        issue_type_id = getattr(issue, "type_id", None)
        assignment = None
        if issue_type_id:
            assignment = _active_type_assignment(project_id, issue_type_id)

        if assignment is not None:
            revision = _latest_published_revision(assignment.workflow_id)
            if revision is not None:
                return EffectiveWorkflow(
                    workflow=assignment.workflow,
                    revision=revision,
                    binding=None,
                    is_type_specific=True,
                )

        default_workflow = _active_default_workflow(project_id)
        if default_workflow is None:
            return None

        revision = _latest_published_revision(default_workflow.id)
        if revision is None:
            return None

        return EffectiveWorkflow(
            workflow=default_workflow,
            revision=revision,
            binding=None,
            is_type_specific=False,
        )

    @staticmethod
    def prefetch_for_runtime(revision_id):
        """Return a queryset of ``WorkflowState`` rows for the given revision.

        Used by callers that need all states at once (§27 — load all
        states for a revision in a single query). The resolver itself
        does not depend on the result.
        """
        if revision_id is None:
            return _EMPTY_QS
        return _states_qs_for(revision_id)
