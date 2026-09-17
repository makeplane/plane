# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Midterm progress aggregation (P1-MID-04, P1-MID-05, P1-MID-08).

The summary only references source objects; it never copies bodies and never
widens visibility. Every section is filtered by the same ACL the source object
uses, so a summary can only show what the caller may already read.
"""

from plane.db.models import (
    CodeArtifact,
    ExperimentRecord,
    LiteratureEntry,
    PeriodicReport,
    ProjectCodeRepository,
)
from plane.research.utils.acl import build_actor_context, check_access
from plane.research.utils.literature import literature_resource
from plane.research.utils.reports import report_resource
from plane.research.utils.resource_projections import experiment_resource, outcome_resource, repository_resource


def build_progress(workspace, project_id, actor, *, period_key=None):
    """Structured progress for one project, filtered by the caller's ACL."""
    context = build_actor_context(actor, workspace.id)

    experiments = [
        record
        for record in ExperimentRecord.objects.filter(
            workspace=workspace, project_id=project_id, deleted_at__isnull=True
        ).select_related("owner", "stage_instance", "project__research_profile")
        if check_access(actor, "view", experiment_resource(record), context=context)
    ]
    unfinished = [
        record
        for record in experiments
        if record.status in (ExperimentRecord.Status.PLANNED, ExperimentRecord.Status.RUNNING)
    ]

    repositories = [
        repository
        for repository in ProjectCodeRepository.objects.filter(
            workspace=workspace, project_id=project_id, deleted_at__isnull=True
        ).select_related("project__research_profile")
        if check_access(actor, "view", repository_resource(repository), context=context)
    ]
    visible_repository_ids = {repository.id for repository in repositories}
    artifacts = list(
        CodeArtifact.objects.filter(
            repository_id__in=visible_repository_ids,
            repository__workspace=workspace,
            repository__project_id=project_id,
            deleted_at__isnull=True,
        ).select_related("repository", "linked_experiment")[:200]
    )

    literature = [
        entry
        for entry in LiteratureEntry.objects.filter(
            workspace=workspace, project_id=project_id, deleted_at__isnull=True
        )
        if check_access(actor, "view", literature_resource(entry), context=context)
    ]
    included_literature = [entry for entry in literature if entry.status == LiteratureEntry.Status.INCLUDED]

    reports_query = PeriodicReport.objects.filter(
        workspace=workspace, project_id=project_id, deleted_at__isnull=True
    ).select_related("owner")
    if period_key:
        reports_query = reports_query.filter(period_key=period_key)
    reports = [
        report
        for report in reports_query.order_by("-period_start")[:50]
        if check_access(actor, "view", report_resource(report), context=context)
    ]

    # outcomes arrive with P1-B4; an earlier build simply reports none
    import plane.db.models as db_models

    outcome_model = getattr(db_models, "ResearchOutcome", None)
    outcomes = (
        [
            outcome
            for outcome in outcome_model.objects.filter(
                workspace=workspace, project_id=project_id, deleted_at__isnull=True
            ).select_related("project__research_profile")[:100]
            if check_access(actor, "view", outcome_resource(outcome), context=context)
        ]
        if outcome_model is not None
        else []
    )

    return {
        "project": str(project_id),
        "experiments": {
            "total": len(experiments),
            "completed": sum(1 for record in experiments if record.status == ExperimentRecord.Status.COMPLETED),
            "failed": sum(1 for record in experiments if record.status == ExperimentRecord.Status.FAILED),
            "unfinished": len(unfinished),
            "unexplained": [
                {"id": str(record.id), "sequence_no": record.sequence_no, "title": record.title}
                for record in unfinished
                if not (record.status_note or "").strip()
            ],
            "items": [
                {
                    "id": str(record.id),
                    "sequence_no": record.sequence_no,
                    "title": record.title,
                    "status": record.status,
                    "source": record.source,
                    "status_note": record.status_note,
                    "completed_at": record.completed_at,
                }
                for record in sorted(experiments, key=lambda item: item.sequence_no)
            ],
        },
        "code": {
            "repositories": [
                {
                    "id": str(repository.id),
                    "repository_url": repository.repository_url,
                    "provider": repository.provider,
                    "status": repository.status,
                }
                for repository in repositories
            ],
            "artifact_count": len(artifacts),
            "snapshot_count": sum(1 for artifact in artifacts if artifact.ref_type == "SNAPSHOT"),
            "linked_experiment_count": sum(1 for artifact in artifacts if artifact.linked_experiment_id is not None),
        },
        "literature": {
            "included": len(included_literature),
            "total": len(literature),
            "items": [
                {"id": str(entry.id), "title": entry.title, "year": entry.year, "status": entry.status}
                for entry in included_literature[:100]
            ],
        },
        "reports": {
            "count": len(reports),
            "items": [
                {
                    "id": str(report.id),
                    "report_type": report.report_type,
                    "period_key": report.period_key,
                    "status": report.status,
                }
                for report in reports
            ],
        },
        "outcomes": {
            "count": len(outcomes),
            "items": [
                {
                    "id": str(outcome.id),
                    "title": outcome.title,
                    "output_type": outcome.output_type,
                    "status": outcome.status,
                }
                for outcome in outcomes
            ],
        },
    }
