# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Device and wet-lab run ingestion (P1-D3, P1-LAB-01 ~ P1-LAB-08).

SpecLabOS pushes a run; Plane turns it into an experiment record marked
``AUTOMATED`` and links the data assets by reference. The same run is never
registered twice, and when the source system cannot be reached the record is
still created with a "pending" note so the researcher can complete it by hand.
"""

from dataclasses import dataclass, field

from django.db import transaction
from django.utils import timezone

from plane.db.models import (
    ExperimentAssetLink,
    ExperimentRecord,
    ExternalSystemConnection,
)
from plane.research.services.experiment_service import STATUS, next_sequence_no
from plane.research.services.integrations import client_for
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)

PENDING_NOTE = "pending_source_sync"
DEFAULT_SYSTEM = "SPECLABOS"

RUN_STATUS_MAP = {
    "PLANNED": STATUS.PLANNED,
    "QUEUED": STATUS.PLANNED,
    "RUNNING": STATUS.RUNNING,
    "IN_PROGRESS": STATUS.RUNNING,
    "COMPLETED": STATUS.COMPLETED,
    "DONE": STATUS.COMPLETED,
    "FAILED": STATUS.FAILED,
    "ERROR": STATUS.FAILED,
    "CANCELLED": STATUS.CANCELLED,
    "ABORTED": STATUS.CANCELLED,
}


@dataclass
class IngestOutcome:
    record: ExperimentRecord | None = None
    created: bool = False
    degraded: bool = False
    degraded_reason: str = ""
    duplicate_of: str | None = None
    assets: list = field(default_factory=list)


def _connection(workspace, system):
    return ExternalSystemConnection.objects.filter(
        workspace=workspace, system=system, deleted_at__isnull=True
    ).first()


def ingest_run(workspace, project_id, actor, payload, *, request=None):
    """Create or reuse the experiment record for one external run."""
    system = str(payload.get("system") or DEFAULT_SYSTEM).upper()
    run_id = str(payload.get("external_run_id") or "").strip()
    if not run_id:
        return None, IngestOutcome(degraded=True, degraded_reason="missing_run_id")

    existing_link = (
        ExperimentAssetLink.objects.filter(
            source_system=system,
            external_run_id=run_id,
            record__project_id=project_id,
            record__deleted_at__isnull=True,
            deleted_at__isnull=True,
        )
        .select_related("record")
        .first()
    )
    if existing_link is not None:
        # the same run never produces a second experiment (dedupe rule)
        return existing_link.record, IngestOutcome(
            record=existing_link.record,
            created=False,
            duplicate_of=str(existing_link.record_id),
        )

    connection = _connection(workspace, system)
    client = client_for(system, connection)
    verification = client.request(
        path=f"/api/runs/{run_id}/",
        operation="fetch_run_record",
        request=request,
    )
    degraded = verification.degraded
    metadata = verification.items[0] if verification.items else {}

    title = str(payload.get("title") or metadata.get("title") or f"Run {run_id}")
    status = RUN_STATUS_MAP.get(
        str(payload.get("status") or metadata.get("metadata", {}).get("status") or "PLANNED").upper(),
        STATUS.PLANNED,
    )
    assets = payload.get("assets") or []

    with transaction.atomic():
        record = ExperimentRecord.objects.create(
            workspace=workspace,
            project_id=project_id,
            sequence_no=next_sequence_no(project_id),
            title=title[:255],
            source=ExperimentRecord.Source.AUTOMATED,
            status=status,
            owner=actor,
            status_note=PENDING_NOTE if degraded else str(payload.get("status_note") or ""),
            molecular_system=str(payload.get("molecular_system") or metadata.get("molecular_system") or ""),
            method=str(payload.get("method") or metadata.get("metadata", {}).get("method") or ""),
            environment={
                "instrument": payload.get("instrument") or metadata.get("metadata", {}).get("instrument"),
                "operator": payload.get("operator") or metadata.get("metadata", {}).get("operator"),
            },
            started_at=payload.get("started_at") or None,
            completed_at=payload.get("completed_at") or None,
            created_by=actor,
        )
        created_links = []
        for index, asset in enumerate(assets):
            created_links.append(
                ExperimentAssetLink.objects.create(
                    record=record,
                    relation=str(asset.get("relation") or ExperimentAssetLink.Relation.OUTPUT).upper(),
                    source_system=str(asset.get("source_system") or system).upper(),
                    external_asset_id=str(asset.get("external_asset_id") or f"{run_id}-asset-{index}"),
                    external_file_id=str(asset.get("external_file_id") or ""),
                    external_run_id=run_id,
                    display_name=str(asset.get("display_name") or f"Asset {index + 1}")[:255],
                    mime_type=str(asset.get("mime_type") or ""),
                    size_bytes=asset.get("size_bytes") or None,
                    external_url=str(asset.get("external_url") or ""),
                    last_verified_at=None if degraded else timezone.now(),
                    created_by=actor,
                )
            )
        if not created_links:
            # the run itself is the reference even without assets
            created_links.append(
                ExperimentAssetLink.objects.create(
                    record=record,
                    relation=ExperimentAssetLink.Relation.REFERENCE,
                    source_system=system,
                    external_asset_id=run_id,
                    external_run_id=run_id,
                    display_name=f"Run {run_id}",
                    external_url=str(payload.get("source_url") or ""),
                    last_verified_at=None if degraded else timezone.now(),
                    created_by=actor,
                )
            )

    record_audit_event(
        workspace=workspace,
        action=ResearchAuditAction.EXPERIMENT_INGEST,
        resource_type=ResearchResourceType.EXPERIMENT,
        resource_id=record.id,
        actor=actor,
        metadata={
            "system": system,
            "external_run_id": run_id,
            "degraded": degraded,
            "degraded_reason": verification.degraded_reason,
            "assets": len(created_links),
        },
        request=request,
    )
    return record, IngestOutcome(
        record=record,
        created=True,
        degraded=degraded,
        degraded_reason=verification.degraded_reason,
        assets=created_links,
    )
