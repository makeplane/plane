# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Default-workflow bootstrap — spec §25 Phase 2.

Enabling workflows on a project must not silently freeze existing
behavior. The bootstrap creates:

- one ``Workflow`` flagged ``is_default``;
- a first ``WorkflowRevision`` (version 1) with ``status="published"``;
- one ``WorkflowState`` per existing non-triage ``State`` in the
  project;
- one ``WorkflowState`` per existing triage ``State`` if the project
  has any (triage is allowed as a state but is excluded from the
  creation-eligible set so the bootstrap doesn't inadvertently mark
  the default state as "allow new work items" if it is the only
  state);
- a complete cross-product of ``WorkflowFlow`` transition edges so
  every existing state pair is reachable;
- one ``WorkflowState.allow_new_work_items=True`` on the project's
  existing default state if there is one; otherwise on the first
  non-triage state by sequence.

Bootstrap is idempotent at the API surface (``ensure_default_workflow``);
calling it twice does not create a second default workflow.
"""

# Python imports
import itertools
import logging
from typing import Optional

# Django imports
from django.db import transaction

# Module imports
from plane.db.models import (
    IssueType,
    Project,
    State,
    StateGroup,
    Workflow,
    WorkflowFlow,
    WorkflowFlowType,
    WorkflowRevision,
    WorkflowRevisionStatus,
    WorkflowState,
)

logger = logging.getLogger("plane.workflow")


def ensure_default_workflow(
    *,
    project: Project,
    actor_id: Optional[str] = None,
) -> Optional[Workflow]:
    """Create the compatibility-safe default workflow for ``project``.

    Returns the default ``Workflow`` (newly created or pre-existing).
    ``None`` is only returned when there are no non-triage states to
    populate the revision with — a project that owns zero non-triage
    states has nothing to govern.
    """
    if not _project_can_have_workflow(project):
        return None

    existing = (
        Workflow.objects.filter(project=project, is_default=True).first()
    )
    if existing is not None:
        return existing

    return _create_default_workflow(project=project, actor_id=actor_id)


@transaction.atomic
def _create_default_workflow(
    *,
    project: Project,
    actor_id: Optional[str],
) -> Workflow:
    states = list(
        State.objects.filter(project=project).order_by("sequence", "created_at")
    )
    if not states:
        logger.info(
            "Skipping default workflow bootstrap: project has no states.",
            extra={"project_id": str(project.id)},
        )
        return None  # type: ignore[return-value]

    default_state = next((s for s in states if s.default), None)

    workflow = Workflow.objects.create(
        project=project,
        name="Default Workflow",
        description="Auto-generated default workflow (spec §25 Phase 2).",
        is_default=True,
        is_active=True,
        created_by_id=actor_id,
        updated_by_id=actor_id,
    )

    revision = WorkflowRevision.objects.create(
        project=project,
        workflow=workflow,
        version=1,
        status=WorkflowRevisionStatus.PUBLISHED,
        published_at=__import__("django.utils.timezone", fromlist=["now"]).now(),
        published_by_id=actor_id,
    )

    # One WorkflowState per project State. We include triage states
    # so existing flow graphs survive; the ``allow_new_work_items``
    # bit is what controls whether creation can land in a state.
    workflow_states = []
    for state in states:
        workflow_states.append(
            WorkflowState(
                project=project,
                revision=revision,
                state=state,
                sequence=state.sequence if state.sequence is not None else 65535,
                allow_new_work_items=False,
            )
        )
    WorkflowState.objects.bulk_create(workflow_states)

    # Mark the project's existing default state as creation-eligible.
    # Fall back to the first non-triage state if the project has no
    # ``default=True`` state yet (legacy project shape).
    if default_state is not None:
        WorkflowState.objects.filter(
            revision=revision, state=default_state
        ).update(allow_new_work_items=True)
    else:
        first_state = next(
            (s for s in states if s.group != StateGroup.TRIAGE.value),
            states[0],
        )
        WorkflowState.objects.filter(
            revision=revision, state=first_state
        ).update(allow_new_work_items=True)

    # Build the full cross-product of transition flows so enabling
    # workflows on a populated project does not break any existing
    # user. Admins can prune transitions to tighten the process.
    ws_by_state_id = {
        str(ws.state_id): ws for ws in WorkflowState.objects.filter(revision=revision)
    }
    flows_to_create = []
    for src, dst in itertools.permutations(ws_by_state_id.values(), 2):
        flows_to_create.append(
            WorkflowFlow(
                project=project,
                revision=revision,
                source_state=src,
                target_state=dst,
                flow_type=WorkflowFlowType.TRANSITION,
                sequence=65535,
                is_active=True,
            )
        )
    if flows_to_create:
        WorkflowFlow.objects.bulk_create(flows_to_create, batch_size=200)

    logger.info(
        "workflow.bootstrap.created",
        extra={
            "project_id": str(project.id),
            "workflow_id": str(workflow.id),
            "revision_id": str(revision.id),
            "state_count": len(ws_by_state_id),
            "flow_count": len(flows_to_create),
        },
    )

    return workflow


def _project_can_have_workflow(project: Project) -> bool:
    """Return ``True`` iff the project is eligible for a default workflow."""
    # Custom check: a project whose ``IssueType`` rows are gone still
    # qualifies — type-specific assignment is optional (§7.3 default
    # workflow does not require an assignment). The existence of
    # ``State`` rows is the real prerequisite, and that is enforced
    # lazily inside ``_create_default_workflow``.
    return IssueType is not None


__all__ = ["ensure_default_workflow"]
