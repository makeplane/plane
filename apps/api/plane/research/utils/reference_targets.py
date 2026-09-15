# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Resolve and authorise the Plane side of an external reference link (P1-KB-05).

A reference may hang off a report, a stage material, a literature entry, an
experiment or an outcome. The link endpoint validates that the target exists,
belongs to the same workspace and that the caller may see it - attaching a
reference must never widen visibility.
"""

from plane.db.models import (
    ExperimentRecord,
    LiteratureEntry,
    PeriodicReport,
    Project,
    ResearchOutcome,
    StageMaterial,
)
from plane.research.utils.acl import build_actor_context, check_access
from plane.research.utils.literature import literature_resource
from plane.research.utils.reports import report_resource
from plane.research.utils.stages import material_resource

TARGET_MODELS = {
    "PROJECT": Project,
    "STAGE_MATERIAL": StageMaterial,
    "LITERATURE_ENTRY": LiteratureEntry,
    "EXPERIMENT_RECORD": ExperimentRecord,
    "PERIODIC_REPORT": PeriodicReport,
    "OUTCOME": ResearchOutcome,
}


def _experiment_resource(record):
    from plane.research.services.progress import experiment_resource

    return experiment_resource(record)


def _outcome_resource(outcome):
    from plane.research.views.outcomes import outcome_resource

    return outcome_resource(outcome)


def resolve_target(actor, workspace, target_type, target_id):
    """Return ``(target, error_code)`` for a link target."""
    model = TARGET_MODELS.get(str(target_type).upper())
    if model is None:
        return None, "external_reference_invalid"
    # stage materials reach the workspace through their stage instance
    lookup = (
        {"stage_instance__workspace": workspace}
        if target_type == "STAGE_MATERIAL"
        else {"workspace": workspace}
    )
    target = model.objects.filter(pk=target_id, deleted_at__isnull=True, **lookup).first()
    if target is None:
        return None, "external_reference_not_found"
    if target_type == "PROJECT":
        return target, None

    context = build_actor_context(actor, workspace.id)
    if target_type == "STAGE_MATERIAL":
        resource = material_resource(target, with_reviewers=True)
    elif target_type == "LITERATURE_ENTRY":
        resource = literature_resource(target)
    elif target_type == "PERIODIC_REPORT":
        resource = report_resource(target)
    elif target_type == "EXPERIMENT_RECORD":
        resource = _experiment_resource(target)
    else:
        resource = _outcome_resource(target)
    if not check_access(actor, "view", resource, context=context):
        return None, "external_reference_not_found"
    return target, None
