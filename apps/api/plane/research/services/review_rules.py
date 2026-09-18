# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Review rule engine (P1-REV-02 ~ P1-REV-06, P1-REV-10).

The rules decide whether a submitted stage may pass:

* the direct advisor must have reviewed (P1-REV-02),
* the principal investigator branch must be covered - the PI itself or a
  delegated reviewer (P1-REV-03),
* at least ``min_reviewers`` valid reviews must exist (P1-REV-04),
* a strict majority of ``PASS`` is required and a direct advisor ``REJECT``
  vetoes the stage (P1-REV-05),
* the author never reviews their own stage (P1-REV-11).

Numbers come from the workspace settings; the boolean switches and the minimum
reviewer count may be overridden per organisation node through
``ResearchStageRequirement``. The pass ratio stays a workspace level float
because the requirement table stores integers only (§4.9).
"""

import hashlib
import json

from django.utils import timezone

from plane.db.models import (
    DEFAULT_MIN_REVIEWERS,
    DEFAULT_PASS_RATIO,
    PI_BRANCH_ROLES,
    ResearchStageRequirement,
)
from plane.research.utils.settings import get_workspace_research_settings

DIRECT_ADVISOR_ROLE = "DIRECT_ADVISOR"

# requirement code -> (rule name, is_boolean)
RULE_CODES = {
    "stage_min_reviewers": ("min_reviewers", False),
    "stage_advisor_required": ("advisor_required", True),
    "stage_pi_branch_required": ("pi_branch_required", True),
    "stage_advisor_veto": ("advisor_veto", True),
}

DEFAULT_RULES = {
    "min_reviewers": DEFAULT_MIN_REVIEWERS,
    "pass_ratio": DEFAULT_PASS_RATIO,
    "advisor_required": True,
    "pi_branch_required": True,
    "advisor_veto": True,
}


def resolve_review_rules(workspace, stage, org_unit_id=None):
    """Effective review rules for one stage, with their source per rule."""
    settings = get_workspace_research_settings(workspace)
    rules = dict(DEFAULT_RULES)
    sources = {key: "default" for key in DEFAULT_RULES}
    rules["min_reviewers"] = int(settings.get("stage_min_reviewers") or DEFAULT_MIN_REVIEWERS)
    if settings.get("stage_min_reviewers") is not None:
        sources["min_reviewers"] = "workspace"
    ratio = settings.get("stage_pass_ratio")
    if ratio is not None:
        rules["pass_ratio"] = float(ratio)
        sources["pass_ratio"] = "workspace"

    query = ResearchStageRequirement.objects.filter(
        workspace=workspace,
        stage=stage,
        code__in=list(RULE_CODES),
        is_active=True,
        deleted_at__isnull=True,
    )
    rows = list(query.filter(org_unit__isnull=True))
    if org_unit_id:
        rows += list(query.filter(org_unit_id=org_unit_id))
    for row in rows:
        rule_name, is_boolean = RULE_CODES[row.code]
        if row.threshold is None:
            continue
        rules[rule_name] = bool(row.threshold) if is_boolean else int(row.threshold)
        sources[rule_name] = "org_unit" if row.org_unit_id else "workspace"
    return rules, sources


def review_rule_version(rules):
    payload = sorted((key, str(value)) for key, value in rules.items())
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()
    return digest[:12]


def is_effective(assignment, on_date=None):
    if not assignment.is_active or assignment.superseded_at is not None:
        return False
    if assignment.valid_until is not None and assignment.valid_until <= (on_date or timezone.now()):
        return False
    return True


def effective_assignments(instance):
    return [
        assignment
        for assignment in instance.reviewer_assignments.filter(deleted_at__isnull=True).select_related(
            "reviewer", "assigned_by"
        )
        if is_effective(assignment)
    ]


def valid_reviews(instance):
    return list(
        instance.reviews.filter(is_superseded=False, deleted_at__isnull=True).select_related("reviewer")
    )


def recommendation_distribution(reviews):
    distribution = {"PASS": 0, "REJECT": 0, "REVISE": 0}
    for review in reviews:
        distribution[review.recommendation] = distribution.get(review.recommendation, 0) + 1
    return distribution


def evaluate_review_rule(instance):
    """Gate item outcome for the ``review_rule`` requirement (P1-REV-05)."""
    rules, sources = resolve_review_rules(instance.workspace, instance.stage, instance.org_unit_id)
    reviews = valid_reviews(instance)
    assignments = effective_assignments(instance)
    distribution = recommendation_distribution(reviews)
    roles = {review.reviewer_role for review in reviews}
    delegated_ids = {
        str(assignment.reviewer_id)
        for assignment in assignments
        if assignment.assignment_kind == "DELEGATED"
    }
    pending_roles = []

    if rules["advisor_required"] and DIRECT_ADVISOR_ROLE not in roles:
        pending_roles.append(DIRECT_ADVISOR_ROLE)
    pi_branch_covered = bool(roles & set(PI_BRANCH_ROLES.VALUES)) or any(
        str(review.reviewer_id) in delegated_ids for review in reviews
    )
    if rules["pi_branch_required"] and not pi_branch_covered:
        pending_roles.append("PI_BRANCH")

    vetoed_by = None
    if rules["advisor_veto"]:
        veto = next(
            (
                review
                for review in reviews
                if review.reviewer_role == DIRECT_ADVISOR_ROLE and review.recommendation == "REJECT"
            ),
            None,
        )
        if veto is not None:
            vetoed_by = str(veto.reviewer_id)

    total = len(reviews)
    pass_count = distribution["PASS"]
    ratio_ok = total > 0 and (pass_count / total) > rules["pass_ratio"]
    count_ok = total >= rules["min_reviewers"]
    passed = count_ok and ratio_ok and not pending_roles and vetoed_by is None

    detail = {
        "min_reviewers": rules["min_reviewers"],
        "pass_ratio": rules["pass_ratio"],
        "pass_count": pass_count,
        "review_count": total,
        "distribution": distribution,
        "assignment_count": len(assignments),
        "pending_required_roles": pending_roles,
        "rule_version": review_rule_version(rules),
        "rule_sources": sources,
    }
    if vetoed_by:
        detail["vetoed_by"] = vetoed_by
    return {
        "passed": passed,
        "actual": total,
        "required": rules["min_reviewers"],
        "detail": detail,
    }


def review_summary(instance):
    """Frozen review summary stored on the passing transition (P1-REV-10)."""
    rules, sources = resolve_review_rules(instance.workspace, instance.stage, instance.org_unit_id)
    reviews = valid_reviews(instance)
    assignments = effective_assignments(instance)
    distribution = recommendation_distribution(reviews)
    return {
        "rule_version": review_rule_version(rules),
        "rules": rules,
        "rule_sources": sources,
        "reviewer_count": len(reviews),
        "assignment_count": len(assignments),
        "distribution": distribution,
        "required_roles": [DIRECT_ADVISOR_ROLE] if rules["advisor_required"] else [],
        "pi_branch_required": rules["pi_branch_required"],
        "reviews": [
            {
                "id": str(review.id),
                "reviewer": str(review.reviewer_id),
                "reviewer_role": review.reviewer_role,
                "recommendation": review.recommendation,
                "score": float(review.score) if review.score is not None else None,
                "revision_no": review.revision_no,
                "submitted_at": review.submitted_at.isoformat() if review.submitted_at else None,
            }
            for review in reviews
        ],
        "frozen_at": timezone.now().isoformat(),
    }


def reviewer_state(instance):
    """Assignment / review state used by the detail and review-summary payloads."""
    reviews = {str(review.reviewer_id): review for review in valid_reviews(instance)}
    payload = []
    for assignment in effective_assignments(instance):
        review = reviews.get(str(assignment.reviewer_id))
        payload.append(
            {
                "assignment_id": str(assignment.id),
                "reviewer": str(assignment.reviewer_id),
                "reviewer_role": assignment.reviewer_role,
                "is_required": assignment.is_required,
                "assignment_kind": assignment.assignment_kind,
                "valid_until": assignment.valid_until.isoformat() if assignment.valid_until else None,
                "reviewed": review is not None,
                "recommendation": review.recommendation if review else None,
                "review_id": str(review.id) if review else None,
                "submitted_at": review.submitted_at.isoformat() if review and review.submitted_at else None,
            }
        )
    return payload
