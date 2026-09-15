# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Stage gate engine (P1-STG-06, P1-STG-07, P1-STG-08).

The gate answers one question with one answer: given a stage instance, which
configured requirements are satisfied right now? The same engine produces the
``/gate/`` pre-check and the decision used by ``submit`` / ``pass``, so the two
can never disagree (§5.2).

Requirements resolve in three steps (G-09):

1. a ``ResearchStageRequirement`` row (workspace level, optionally overridden
   per organisation node),
2. the workspace research settings,
3. the built-in defaults declared below.

Counters for records that belong to a later stage of the P1 delivery return
``None`` when the model is not shipped yet; such an item is reported with
``available=false`` and cannot block the flow, so a partially rolled out build
still behaves predictably (T-16).
"""

import hashlib
import json
from dataclasses import dataclass, field

from django.db.models import Q
from django.utils import timezone

from plane.db.models import (
    MATERIAL_SET_COMPLETE_STATES,
    MATERIAL_TYPES_BY_STAGE,
    ResearchStageRequirement,
)
from plane.research.utils.settings import get_workspace_research_settings

SUBMIT_PHASE = "submit"
PASS_PHASE = "pass"
GATE_RULE_VERSION_LENGTH = 12


@dataclass
class GateSpec:
    """A gate item definition; the threshold is a default, not a constant."""

    code: str
    requirement_type: str
    label: str
    label_key: str
    phases: tuple = (SUBMIT_PHASE,)
    default_threshold: int | None = None
    direction: str = "min"
    blocking: bool = True


GATE_SPECS = {
    "PRE_OPENING": (
        GateSpec(
            code="material_set",
            requirement_type="MATERIAL_SET",
            label="Material set complete",
            label_key="research.stages.gate.material_set",
        ),
        GateSpec(
            code="literature_min_included",
            requirement_type="LITERATURE_COUNT",
            label="Included literature",
            label_key="research.stages.gate.literature_min_included",
        ),
        GateSpec(
            code="literature_max_entries",
            requirement_type="LITERATURE_COUNT",
            label="Literature entries within the cap",
            label_key="research.stages.gate.literature_max_entries",
            direction="max",
        ),
        GateSpec(
            code="literature_quality",
            requirement_type="MANUAL",
            label="Included literature annotated",
            label_key="research.stages.gate.literature_quality",
            default_threshold=0,
            direction="max",
        ),
    ),
    "OPENING": (
        GateSpec(
            code="material_set",
            requirement_type="MATERIAL_SET",
            label="Material set complete",
            label_key="research.stages.gate.material_set",
        ),
        GateSpec(
            code="experiment_linked",
            requirement_type="EXPERIMENT_LINKED",
            label="At least one experiment record",
            label_key="research.stages.gate.experiment_linked",
        ),
        GateSpec(
            code="code_repo",
            requirement_type="CODE_REPO",
            label="At least one code repository",
            label_key="research.stages.gate.code_repo",
        ),
    ),
    "MIDTERM": (
        GateSpec(
            code="material_set",
            requirement_type="MATERIAL_SET",
            label="Material set complete",
            label_key="research.stages.gate.material_set",
        ),
        GateSpec(
            code="experiment_completed",
            requirement_type="EXPERIMENT_LINKED",
            label="At least one completed experiment",
            label_key="research.stages.gate.experiment_completed",
        ),
        GateSpec(
            code="experiment_status_notes",
            requirement_type="MANUAL",
            label="Unfinished experiments explained",
            label_key="research.stages.gate.experiment_status_notes",
            default_threshold=0,
            direction="max",
        ),
    ),
    "FINAL": (
        GateSpec(
            code="material_set",
            requirement_type="MATERIAL_SET",
            label="Material set complete",
            label_key="research.stages.gate.material_set",
        ),
        GateSpec(
            code="outcome_count",
            requirement_type="OUTCOME_COUNT",
            label="Registered outcomes",
            label_key="research.stages.gate.outcome_count",
        ),
        GateSpec(
            code="experiment_summary",
            requirement_type="EXPERIMENT_LINKED",
            label="Experiment summary available",
            label_key="research.stages.gate.experiment_summary",
        ),
        GateSpec(
            code="code_snapshot",
            requirement_type="CODE_REPO",
            label="Code snapshot archived",
            label_key="research.stages.gate.code_snapshot",
        ),
        GateSpec(
            code="advisor_opinion",
            requirement_type="MATERIAL_SET",
            label="Advisor opinion submitted",
            label_key="research.stages.gate.advisor_opinion",
        ),
    ),
}

# Review rules gate the pass action, not the submission: a stage has to be
# submittable in order to collect the reviews it needs (§5.2, D-15).
REVIEW_GATE_SPEC = GateSpec(
    code="review_rule",
    requirement_type="REVIEW_RULE",
    label="Review rule satisfied",
    label_key="research.stages.gate.review_rule",
    phases=(PASS_PHASE,),
)


@dataclass
class EffectiveRequirement:
    code: str
    requirement_type: str
    threshold: int | None
    is_blocking: bool
    is_active: bool
    direction: str = "min"
    source: str = "default"
    label: str = ""
    label_key: str = ""
    phases: tuple = field(default_factory=lambda: (SUBMIT_PHASE,))


def _workspace_thresholds(workspace):
    settings = get_workspace_research_settings(workspace)
    return {
        "literature_min_included": settings.get("literature_min_included", 20),
        "literature_max_entries": settings.get("literature_max_entries", 100),
        "stage_min_reviewers": settings.get("stage_min_reviewers", 3),
        "stage_pass_ratio": settings.get("stage_pass_ratio", 0.5),
    }


def default_threshold_for(spec, workspace, stage):
    """Built-in threshold used when neither the DB nor settings define one."""
    if spec.code == "material_set":
        return len(MATERIAL_TYPES_BY_STAGE.get(stage, ()))
    if spec.code in ("literature_min_included", "literature_max_entries"):
        return _workspace_thresholds(workspace)[spec.code]
    if spec.default_threshold is not None:
        return spec.default_threshold
    # every remaining item defaults to "at least one"
    return 1


def resolve_requirements(workspace, stage, org_unit_id=None):
    """Effective gate requirements for one stage, keyed by item code."""
    specs = list(GATE_SPECS.get(stage, ())) + [REVIEW_GATE_SPEC]
    effective = {}
    for spec in specs:
        effective[spec.code] = EffectiveRequirement(
            code=spec.code,
            requirement_type=spec.requirement_type,
            threshold=default_threshold_for(spec, workspace, stage),
            is_blocking=spec.blocking,
            is_active=True,
            direction=spec.direction,
            label=spec.label,
            label_key=spec.label_key,
            phases=spec.phases,
        )

    query = ResearchStageRequirement.objects.filter(
        workspace=workspace,
        stage=stage,
        deleted_at__isnull=True,
    )
    rows = list(query.filter(org_unit__isnull=True))
    if org_unit_id:
        # node level rows are applied after the workspace rows so they override
        rows += list(query.filter(org_unit_id=org_unit_id))
    for row in rows:
        current = effective.get(row.code)
        if current is None:
            effective[row.code] = EffectiveRequirement(
                code=row.code,
                requirement_type=row.requirement_type,
                threshold=row.threshold,
                is_blocking=row.is_blocking,
                is_active=row.is_active,
                source="org_unit" if row.org_unit_id else "workspace",
            )
            continue
        current.requirement_type = row.requirement_type
        if row.threshold is not None:
            current.threshold = row.threshold
        current.is_blocking = row.is_blocking
        current.is_active = row.is_active
        current.source = "org_unit" if row.org_unit_id else "workspace"
    return effective


def gate_rule_version(effective):
    """Stable hash of the effective thresholds, stored in every transition."""
    payload = sorted(
        (
            code,
            requirement.threshold,
            requirement.is_blocking,
            requirement.requirement_type,
        )
        for code, requirement in effective.items()
    )
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()
    return digest[:GATE_RULE_VERSION_LENGTH]


def _model(model_name):
    import plane.db.models as db_models

    return getattr(db_models, model_name, None)


def _blank(field_name):
    return Q(**{f"{field_name}__isnull": True}) | Q(**{field_name: ""})


def _material_outcome(instance):
    required = list(MATERIAL_TYPES_BY_STAGE.get(instance.stage, ()))
    existing = {
        material.material_type: material
        for material in instance.materials.filter(
            deleted_at__isnull=True,
            material_type__in=required,
        )
    }
    complete = [
        code for code in required if code in existing and existing[code].status in MATERIAL_SET_COMPLETE_STATES
    ]
    missing = [code for code in required if code not in complete]
    return {
        "actual": len(complete),
        "required": len(required),
        "detail": {"missing": missing},
    }


def _literature_outcome(instance, key):
    model = _model("LiteratureEntry")
    if model is None:
        return None
    base = {"project_id": instance.project_id, "deleted_at__isnull": True}
    included = model.objects.filter(status="INCLUDED", **base)
    unannotated = included.filter(_blank("summary") | _blank("gap_notes"))
    detail = {
        "included": included.count(),
        "total": model.objects.filter(**base).count(),
        "unannotated": [str(entry_id) for entry_id in unannotated.values_list("id", flat=True)[:20]],
        "unannotated_count": unannotated.count(),
    }
    return {"actual": detail[key], "detail": detail}


def _experiment_outcome(instance, key):
    model = _model("ExperimentRecord")
    if model is None:
        return None
    base = {"project_id": instance.project_id, "deleted_at__isnull": True}
    planned_or_beyond = ("PLANNED", "RUNNING", "COMPLETED", "FAILED", "ARCHIVED")
    unexplained = model.objects.filter(status__in=("PLANNED", "RUNNING"), **base).filter(_blank("status_note"))
    detail = {
        "linked": model.objects.filter(status__in=planned_or_beyond, **base).count(),
        "completed": model.objects.filter(status="COMPLETED", **base).count(),
        "total": model.objects.filter(**base).count(),
        "unexplained": [
            {"sequence_no": row[0], "title": row[1]}
            for row in unexplained.values_list("sequence_no", "title")[:20]
        ],
        "unexplained_count": unexplained.count(),
    }
    return {"actual": detail[key], "detail": detail}


def _code_outcome(instance, key):
    repository_model = _model("ProjectCodeRepository")
    if repository_model is None:
        return None
    base = {"project_id": instance.project_id, "deleted_at__isnull": True}
    detail = {"repositories": repository_model.objects.filter(**base).count(), "snapshots": None}
    artifact_model = _model("CodeArtifact")
    if artifact_model is not None:
        detail["snapshots"] = artifact_model.objects.filter(
            repository__project_id=instance.project_id,
            ref_type="SNAPSHOT",
            deleted_at__isnull=True,
        ).count()
    if detail[key] is None:
        return None
    return {"actual": detail[key], "detail": detail}


def _outcome_outcome(instance):
    model = _model("ResearchOutcome")
    if model is None:
        return None
    return {
        "actual": model.objects.filter(project_id=instance.project_id, deleted_at__isnull=True).count(),
        "detail": {},
    }


def _advisor_opinion_outcome(instance):
    material = instance.materials.filter(deleted_at__isnull=True, material_type="ADVISOR_OPINION").first()
    actual = 0
    if material is not None and material.status in MATERIAL_SET_COMPLETE_STATES:
        actual = 1
    return {"actual": actual, "detail": {"missing": [] if actual else ["ADVISOR_OPINION"]}}


def _review_outcome(instance):
    """Delegated to the review rule engine once P1-A2 ships (T-16)."""
    try:
        from plane.research.services.review_rules import evaluate_review_rule
    except ImportError:  # pragma: no cover - the module arrives with P1-A2
        return None
    return evaluate_review_rule(instance)


COUNTERS = {
    "material_set": _material_outcome,
    "literature_min_included": lambda instance: _literature_outcome(instance, "included"),
    "literature_max_entries": lambda instance: _literature_outcome(instance, "total"),
    "literature_quality": lambda instance: _literature_outcome(instance, "unannotated_count"),
    "experiment_linked": lambda instance: _experiment_outcome(instance, "linked"),
    "experiment_completed": lambda instance: _experiment_outcome(instance, "completed"),
    "experiment_status_notes": lambda instance: _experiment_outcome(instance, "unexplained_count"),
    "experiment_summary": lambda instance: _experiment_outcome(instance, "total"),
    "code_repo": lambda instance: _code_outcome(instance, "repositories"),
    "code_snapshot": lambda instance: _code_outcome(instance, "snapshots"),
    "outcome_count": _outcome_outcome,
    "advisor_opinion": _advisor_opinion_outcome,
    "review_rule": _review_outcome,
}


def _hint(code, requirement, actual, passed):
    if passed:
        return ""
    return f"research.stages.gate.hint.{code}"


def evaluate_stage_gate(instance, phase=SUBMIT_PHASE):
    """Evaluate the gate. ``phase`` is ``submit`` or ``pass`` (§5.2, D-15)."""
    workspace = instance.workspace
    effective = resolve_requirements(workspace, instance.stage, instance.org_unit_id)
    items = []
    for code, requirement in effective.items():
        if not requirement.is_active:
            continue
        counter = COUNTERS.get(code)
        if counter is None:
            continue
        outcome = counter(instance)
        required = requirement.threshold if requirement.threshold is not None else 0
        if outcome is None:
            items.append(
                {
                    "code": code,
                    "label": requirement.label,
                    "label_key": requirement.label_key,
                    "passed": False,
                    "available": False,
                    "blocking": False,
                    "required": required,
                    "actual": None,
                    "applies_to": list(requirement.phases),
                    "hint": "research.stages.gate.hint.unavailable",
                }
            )
            continue
        actual = outcome.get("actual") or 0
        if outcome.get("required") is not None:
            required = outcome["required"]
        if "passed" in outcome:
            # rules that are not a plain count comparison decide for themselves
            passed = bool(outcome["passed"])
        else:
            passed = actual <= required if requirement.direction == "max" else actual >= required
        item = {
            "code": code,
            "label": requirement.label,
            "label_key": requirement.label_key,
            "passed": passed,
            "available": True,
            "blocking": requirement.is_blocking,
            "required": required,
            "actual": actual,
            "applies_to": list(requirement.phases),
            "threshold_source": requirement.source,
        }
        detail = outcome.get("detail") or {}
        for key in (
            "missing",
            "unannotated",
            "unexplained",
            "pending_required_roles",
            "vetoed_by",
            "distribution",
            "min_reviewers",
            "pass_ratio",
            "review_count",
        ):
            if key in detail:
                item[key] = detail[key]
        if not passed:
            item["hint"] = _hint(code, requirement, actual, passed)
        items.append(item)

    scoped = [item for item in items if phase in item["applies_to"]]
    blockers = [item for item in scoped if item["blocking"] and not item["passed"]]
    return {
        "stage": instance.stage,
        "stage_id": str(instance.id),
        "project": str(instance.project_id),
        "phase": phase,
        "result": "BLOCKED" if blockers else "PASS",
        "rule_version": gate_rule_version(effective),
        "evaluated_at": timezone.now().isoformat(),
        "items": items,
        "blockers": blockers,
    }
