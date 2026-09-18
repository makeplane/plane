# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Read-only verification of the demo fixture.

Nothing here writes: the module rebuilds the P0 access matrix through the
production ACL (``visibility_allows``), counts what the workspace owner should
see and evaluates both stage gates, so the fixture can be trusted before it is
used for manual testing.
"""

from django.utils import timezone

from plane.db.models import (
    ApprovalRequest,
    PeriodicReport,
    ResearchProjectProfile,
    ResearchStageInstance,
    StageReview,
    StageReviewerAssignment,
    User,
)
from plane.research.seed import scenario
from plane.research.seed.builder import week_period
from plane.research.services.stage_gate import evaluate_stage_gate
from plane.research.utils.acl import build_actor_context, visibility_allows
from plane.research.utils.approvals import can_act_on_current_step
from plane.research.utils.reports import report_resource


def actor_for(workspace, account_key):
    if account_key == scenario.OWNER_KEY:
        return workspace.owner
    spec = scenario.ACCOUNT_BY_KEY.get(account_key)
    if spec is None:
        return None
    return User.objects.filter(email__iexact=spec.email).first()


def matrix_reports(workspace):
    """The six reports that carry the P0 ACL matrix, keyed by visibility."""
    owner = actor_for(workspace, scenario.MATRIX_OWNER_PROJECT)
    reports = {}
    for spec in scenario.MATRIX_REPORTS:
        period_key, _start, _end = week_period(timezone.localdate(), spec.week_offset)
        reports[spec.visibility] = PeriodicReport.objects.filter(
            workspace=workspace,
            owner=owner,
            report_type=PeriodicReport.ReportType.WEEKLY,
            period_key=period_key,
            deleted_at__isnull=True,
        ).first()
    return reports


def acl_matrix(workspace):
    """Rebuild the 6x6 decision matrix from the seeded reports."""
    reports = matrix_reports(workspace)
    matrix = {}
    for subject_key, account_key, _label in scenario.ACL_MATRIX_SUBJECTS:
        actor = actor_for(workspace, account_key)
        row = {}
        if actor is None:
            matrix[subject_key] = {visibility: None for visibility in reports}
            continue
        context = build_actor_context(actor, workspace.id)
        for visibility, report in reports.items():
            if report is None:
                row[visibility] = None
            else:
                row[visibility] = bool(visibility_allows(context, report_resource(report)))
        matrix[subject_key] = row
    return matrix


def matrix_mismatches(matrix):
    mismatches = []
    for visibility, expected_row in scenario.ACL_MATRIX_EXPECTED.items():
        for subject_key, expected in expected_row.items():
            actual = matrix.get(subject_key, {}).get(visibility)
            if actual is not expected:
                mismatches.append(
                    {
                        "visibility": visibility,
                        "subject": subject_key,
                        "expected": expected,
                        "actual": actual,
                    }
                )
    return mismatches


def visible_reports(workspace, actor):
    reports = PeriodicReport.objects.filter(workspace=workspace, deleted_at__isnull=True)
    context = build_actor_context(actor, workspace.id)
    return [report for report in reports if visibility_allows(context, report_resource(report))]


def pending_reviews(workspace, actor):
    assignments = StageReviewerAssignment.objects.filter(
        reviewer=actor,
        is_active=True,
        deleted_at__isnull=True,
        superseded_at__isnull=True,
        stage_instance__workspace=workspace,
        stage_instance__status=ResearchStageInstance.Status.SUBMITTED,
    ).select_related("stage_instance")
    reviewed = set(
        StageReview.objects.filter(
            stage_instance__workspace=workspace,
            reviewer=actor,
            is_superseded=False,
            deleted_at__isnull=True,
        ).values_list("stage_instance_id", flat=True)
    )
    return [assignment for assignment in assignments if assignment.stage_instance_id not in reviewed]


def pending_approvals(workspace, actor):
    requests = ApprovalRequest.objects.filter(
        flow__workspace=workspace,
        status=ApprovalRequest.Status.PENDING,
    ).select_related("flow", "issue")
    return [request for request in requests if can_act_on_current_step(request, actor)[0]]


def stage_for(workspace, project_name, stage):
    profile = ResearchProjectProfile.objects.filter(project__name=project_name, workspace=workspace).first()
    if profile is None:
        return None
    return ResearchStageInstance.objects.filter(
        project_id=profile.project_id, stage=stage, deleted_at__isnull=True
    ).first()


def verify(workspace):
    """Return a report describing whether the fixture is usable."""
    owner = workspace.owner
    matrix = acl_matrix(workspace)
    mismatches = matrix_mismatches(matrix)
    reports = visible_reports(workspace, owner)
    reviews = pending_reviews(workspace, owner)
    approvals = pending_approvals(workspace, owner)

    midterm = stage_for(workspace, scenario.PROJECT_BY_KEY["liuyang"].name, "MIDTERM")
    opening = stage_for(workspace, scenario.PROJECT_BY_KEY["sunhao"].name, "OPENING")
    midterm_gate = evaluate_stage_gate(midterm, "submit") if midterm else None
    opening_gate = evaluate_stage_gate(opening, "submit") if opening else None

    ok = (
        not mismatches
        and len(reports) > 0
        and len(reviews) > 0
        and len(approvals) > 0
        and midterm_gate is not None
        and bool(midterm_gate["blockers"])
        and opening_gate is not None
        and not opening_gate["blockers"]
    )
    return {
        "ok": ok,
        "matrix": matrix,
        "mismatches": mismatches,
        "visible_reports": len(reports),
        "pending_reviews": len(reviews),
        "pending_approvals": len(approvals),
        "midterm_gate": midterm_gate,
        "opening_gate": opening_gate,
    }


def format_matrix(matrix):
    """Render the matrix as an aligned text table for the CLI."""
    subjects = [key for key, _account, _label in scenario.ACL_MATRIX_SUBJECTS]
    visibilities = list(scenario.ACL_MATRIX_EXPECTED.keys())
    width = max(len(subject) for subject in subjects) + 2
    header = " " * width + "".join(f"{visibility[:9]:>11}" for visibility in visibilities)
    lines = [header]
    for subject in subjects:
        cells = []
        for visibility in visibilities:
            value = matrix.get(subject, {}).get(visibility)
            cells.append(f"{'yes' if value else 'no':>11}" if value is not None else f"{'-':>11}")
        lines.append(f"{subject:<{width}}" + "".join(cells))
    return "\n".join(lines)
