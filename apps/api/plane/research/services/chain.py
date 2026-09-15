# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Timeline and dual chain aggregation (P1-CHAIN-01 ~ P1-CHAIN-07).

The aggregation merges eight sources into one ordered list. Nothing is copied:
every item points at the object that owns the data, and every item passed the
source object's ACL first, so a summary can never widen visibility.
"""

from dataclasses import dataclass

from django.utils import timezone

from plane.db.models import (
    STAGE_SEQUENCE,
    CodeArtifact,
    ExperimentRecord,
    LiteratureEntry,
    PeriodicReport,
    ResearchExternalReference,
    ResearchOutcome,
    ResearchStageInstance,
)
from plane.research.services.progress import experiment_resource
from plane.research.utils.acl import build_actor_context, check_access
from plane.research.utils.integrations import reference_allowed
from plane.research.utils.literature import literature_resource
from plane.research.utils.reports import report_resource
from plane.research.utils.stages import stage_resource

THINKING_CHAIN = "thinking"
DEVELOPMENT_CHAIN = "development"
CHAINS = (THINKING_CHAIN, DEVELOPMENT_CHAIN)

# the reading order of §3.13: cognition first, then production
CHAIN_ORDER = {
    "literature": (THINKING_CHAIN, 10),
    "stage_transition": (THINKING_CHAIN, 20),
    "stage_review": (THINKING_CHAIN, 30),
    "report": (THINKING_CHAIN, 40),
    "experiment": (DEVELOPMENT_CHAIN, 50),
    "code_artifact": (DEVELOPMENT_CHAIN, 60),
    "outcome": (DEVELOPMENT_CHAIN, 70),
    "external_reference": (None, 80),
}


@dataclass
class TimelineItem:
    kind: str
    at: str
    title: str
    chains: list
    payload: dict

    def as_dict(self):
        return {"kind": self.kind, "at": self.at, "title": self.title, "chains": self.chains, **self.payload}


def _iso(value):
    return value.isoformat() if value else None


def build_timeline(
    workspace,
    project_id,
    actor,
    *,
    stage=None,
    date_from=None,
    date_to=None,
    source_system=None,
    chain=None,
):
    """Aggregate every research event of one project, ACL filtered."""
    context = build_actor_context(actor, workspace.id)
    items: list[TimelineItem] = []
    degraded_sources = set()

    def within(value):
        if value is None:
            return True
        moment = value if hasattr(value, "date") else None
        if moment is None:
            return True
        if date_from and moment.date() < date_from:
            return False
        if date_to and moment.date() > date_to:
            return False
        return True

    stages = list(
        ResearchStageInstance.objects.filter(
            workspace=workspace, project_id=project_id, deleted_at__isnull=True
        ).order_by("sort_order")
    )
    for instance in stages:
        if stage and instance.stage != stage:
            continue
        if not check_access(actor, "view", stage_resource(instance, with_reviewers=True), context=context):
            continue
        for transition in instance.transitions.select_related("actor"):
            if not within(transition.created_at):
                continue
            items.append(
                TimelineItem(
                    kind="stage_transition",
                    at=_iso(transition.created_at),
                    title=f"{instance.stage} {transition.action}",
                    chains=[THINKING_CHAIN],
                    payload={
                        "stage": instance.stage,
                        "action": transition.action,
                        "from_status": transition.from_status,
                        "to_status": transition.to_status,
                        "actor": str(transition.actor_id) if transition.actor_id else None,
                        "reason": transition.reason,
                        "target_id": str(instance.id),
                    },
                )
            )
        for review in instance.reviews.filter(is_superseded=False, deleted_at__isnull=True):
            if not within(review.submitted_at):
                continue
            items.append(
                TimelineItem(
                    kind="stage_review",
                    at=_iso(review.submitted_at),
                    title=f"{instance.stage} review {review.recommendation}",
                    chains=[THINKING_CHAIN],
                    payload={
                        "stage": instance.stage,
                        "recommendation": review.recommendation,
                        "reviewer_role": review.reviewer_role,
                        "comment": review.comment,
                        "target_id": str(review.id),
                    },
                )
            )

    for entry in LiteratureEntry.objects.filter(
        workspace=workspace, project_id=project_id, deleted_at__isnull=True, status="INCLUDED"
    ):
        if not within(entry.created_at):
            continue
        if not check_access(actor, "view", literature_resource(entry), context=context):
            continue
        items.append(
            TimelineItem(
                kind="literature",
                at=_iso(entry.created_at),
                title=entry.title,
                chains=[THINKING_CHAIN],
                payload={"year": entry.year, "status": entry.status, "target_id": str(entry.id)},
            )
        )

    for record in ExperimentRecord.objects.filter(
        workspace=workspace, project_id=project_id, deleted_at__isnull=True
    ):
        if not within(record.completed_at or record.created_at):
            continue
        if not check_access(actor, "view", experiment_resource(record), context=context):
            continue
        items.append(
            TimelineItem(
                kind="experiment",
                at=_iso(record.completed_at or record.created_at),
                title=f"#{record.sequence_no} {record.title}",
                chains=[DEVELOPMENT_CHAIN],
                payload={
                    "status": record.status,
                    "source": record.source,
                    "target_id": str(record.id),
                },
            )
        )

    for artifact in CodeArtifact.objects.filter(
        repository__project_id=project_id, deleted_at__isnull=True
    ).select_related("repository"):
        if not within(artifact.committed_at or artifact.created_at):
            continue
        items.append(
            TimelineItem(
                kind="code_artifact",
                at=_iso(artifact.committed_at or artifact.created_at),
                title=f"{artifact.ref_type} {artifact.ref_value}",
                chains=[DEVELOPMENT_CHAIN],
                payload={
                    "ref_type": artifact.ref_type,
                    "repository": str(artifact.repository_id),
                    "repository_url": artifact.repository.repository_url,
                    "target_id": str(artifact.id),
                },
            )
        )

    for report in PeriodicReport.objects.filter(
        workspace=workspace, project_id=project_id, deleted_at__isnull=True
    ):
        if not within(report.created_at):
            continue
        if not check_access(actor, "view", report_resource(report), context=context):
            continue
        items.append(
            TimelineItem(
                kind="report",
                at=_iso(report.created_at),
                title=f"{report.report_type} {report.period_key}",
                chains=[THINKING_CHAIN],
                payload={"status": report.status, "target_id": str(report.id)},
            )
        )

    for outcome in ResearchOutcome.objects.filter(
        workspace=workspace, project_id=project_id, deleted_at__isnull=True
    ):
        if not within(outcome.published_at or outcome.created_at):
            continue
        items.append(
            TimelineItem(
                kind="outcome",
                at=_iso(outcome.created_at),
                title=outcome.title,
                chains=[DEVELOPMENT_CHAIN],
                payload={"output_type": outcome.output_type, "status": outcome.status, "target_id": str(outcome.id)},
            )
        )

    # external references only appear when they are linked to an object of this
    # project - an unrelated reference must not leak into the timeline
    from plane.db.models import ExternalReferenceLink, StageMaterial

    project_target_ids = {str(instance.id) for instance in stages}
    project_target_ids |= {
        str(material.id)
        for material in StageMaterial.objects.filter(
            stage_instance__project_id=project_id, deleted_at__isnull=True
        )
    }
    project_target_ids |= {
        str(entry.id)
        for entry in LiteratureEntry.objects.filter(project_id=project_id, deleted_at__isnull=True)
    }
    project_target_ids |= {
        str(record.id)
        for record in ExperimentRecord.objects.filter(project_id=project_id, deleted_at__isnull=True)
    }
    project_target_ids |= {
        str(report.id)
        for report in PeriodicReport.objects.filter(project_id=project_id, deleted_at__isnull=True)
    }
    project_target_ids |= {
        str(outcome.id)
        for outcome in ResearchOutcome.objects.filter(project_id=project_id, deleted_at__isnull=True)
    }
    project_target_ids.add(str(project_id))
    linked_reference_ids = [
        str(link.reference_id)
        for link in ExternalReferenceLink.objects.filter(
            target_id__in=project_target_ids, deleted_at__isnull=True
        )
    ]
    for reference in ResearchExternalReference.objects.filter(
        workspace=workspace, deleted_at__isnull=True, id__in=linked_reference_ids
    ):
        if source_system and reference.system != source_system:
            continue
        if not within(reference.synced_at or reference.created_at):
            continue
        if not reference_allowed(reference, actor, workspace.id):
            continue
        if reference.status != ResearchExternalReference.Status.ACTIVE:
            degraded_sources.add(reference.system)
        items.append(
            TimelineItem(
                kind="external_reference",
                at=_iso(reference.synced_at or reference.created_at),
                title=reference.title,
                chains=[],
                payload={
                    "source_system": reference.system,
                    "external_type": reference.external_type,
                    "source_url": reference.source_url,
                    "degraded": reference.status != ResearchExternalReference.Status.ACTIVE,
                    "target_id": str(reference.id),
                },
            )
        )

    for item in items:
        if not item.chains:
            item.chains = [THINKING_CHAIN] if item.kind != "external_reference" else [DEVELOPMENT_CHAIN]

    if chain:
        items = [item for item in items if chain in item.chains]

    items.sort(key=lambda item: (CHAIN_ORDER.get(item.kind, (None, 99))[1], item.at or ""))
    return {
        "project": str(project_id),
        "items": [item.as_dict() for item in items],
        "count": len(items),
        "degraded_sources": sorted(degraded_sources),
        "stage_sequence": list(STAGE_SEQUENCE),
        "generated_at": timezone.now().isoformat(),
    }


def chain_groups(timeline):
    """Split a timeline into the thinking and development chains."""
    return {
        THINKING_CHAIN: [item for item in timeline["items"] if THINKING_CHAIN in item["chains"]],
        DEVELOPMENT_CHAIN: [item for item in timeline["items"] if DEVELOPMENT_CHAIN in item["chains"]],
    }
