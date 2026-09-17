# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Experiment endpoints (§5.5) — registration, locking, amendments, assets."""

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    AMENDABLE_FIELDS,
    LOCKED_FIELDS,
    ExperimentAmendment,
    ExperimentAssetLink,
    ExperimentRecord,
    FileAsset,
    ResearchProjectProfile,
    ResearchStageInstance,
)
from plane.research.serializers import (
    ExperimentAmendmentSerializer,
    ExperimentAssetLinkSerializer,
    ExperimentRecordSerializer,
    ExperimentRecordVersionSerializer,
)
from plane.research.services.lab_ingest import ingest_run
from plane.research.services.experiment_service import (
    STATUS,
    archive_experiment,
    approve_amendment,
    cancel_amendment,
    create_amendment,
    locked_field_changes,
    next_sequence_no,
    reject_amendment,
    require_writable,
    submit_experiment,
)
from plane.research.services.stage_service import StageRuleError
from plane.research.utils.acl import build_actor_context, check_access
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_conflict,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.projects import (
    audit_field_snapshot,
    can_create_research_content,
    can_manage_team_content,
    delegated_change_metadata,
    is_team_project,
)
from plane.research.utils.resource_projections import experiment_resource
from plane.research.views.base import ResearchAPIView
from plane.research.views.projects import can_read_project_research_metadata
from plane.research.views.stages import stage_rule_error_response

SECTION = "experiments"
EDITABLE_FIELDS = (
    "title",
    "objective",
    "hypothesis",
    "molecular_system",
    "smiles",
    "system_composition",
    "method",
    "parameters",
    "environment",
    "result",
    "metrics",
    "conclusion",
    "failure_reason",
    "status_note",
    "visibility",
)


def can_edit_experiment(actor, workspace, record) -> bool:
    if record.owner_id == actor.id:
        return True
    return can_manage_team_content(actor, research_project(workspace, record.project_id), record)


def can_review_experiment(actor, workspace, record) -> bool:
    """Approvers are the primary advisor, business PI chain or explicit main PI."""
    if record.owner_id == actor.id:
        return False
    context = build_actor_context(actor, workspace.id)
    return check_access(actor, "review", experiment_resource(record), context=context)


def research_project(workspace, project_id):
    return ResearchProjectProfile.objects.filter(workspace=workspace, project_id=project_id).first()


def content_stage_instance(profile):
    if is_team_project(profile):
        return None
    return ResearchStageInstance.objects.filter(
        workspace=profile.workspace, project_id=profile.project_id, deleted_at__isnull=True
    ).order_by("sort_order").first()


def visible_record(request, workspace, record_id, action="view"):
    record = (
        ExperimentRecord.objects.filter(workspace=workspace, pk=record_id, deleted_at__isnull=True)
        .select_related("owner", "stage_instance", "project__research_profile")
        .first()
    )
    if record is None:
        return None, research_not_found(ResearchErrorCode.EXPERIMENT_NOT_FOUND, "Experiment not found.")
    context = build_actor_context(request.user, workspace.id)
    has_access = check_access(
        request.user, action, experiment_resource(record), context=context
    ) or can_manage_team_content(request.user, record.project.research_profile, record)
    if not has_access:
        if action == "view":
            return None, research_not_found(ResearchErrorCode.EXPERIMENT_NOT_FOUND, "Experiment not found.")
        return None, research_permission_denied()
    return record, None


def apply_payload(record, payload):
    for field in EDITABLE_FIELDS:
        if field in payload:
            value = payload.get(field)
            setattr(record, field, value if value is not None else "")
    for field in ("parameters", "environment", "metrics"):
        if field in payload:
            setattr(record, field, payload.get(field) or {})
    for field in ("started_at", "completed_at"):
        if field in payload:
            setattr(record, field, payload.get(field) or None)


class ResearchExperimentListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/projects/<project_id>/experiments/``"""

    def get(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        if research_project(workspace, project_id) is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        query = ExperimentRecord.objects.filter(
            workspace=workspace, project_id=project_id, deleted_at__isnull=True
        ).select_related("owner", "stage_instance", "project__research_profile")
        if request.GET.get("status"):
            query = query.filter(status=str(request.GET["status"]).upper())
        if request.GET.get("source"):
            query = query.filter(source=str(request.GET["source"]).upper())
        context = build_actor_context(request.user, workspace.id)
        records = [
            record
            for record in query.order_by("sequence_no")[:500]
            if check_access(request.user, "view", experiment_resource(record), context=context)
        ]
        counters = {
            "total": len(records),
            "completed": sum(1 for record in records if record.status == STATUS.COMPLETED),
            "failed": sum(1 for record in records if record.status == STATUS.FAILED),
            "unfinished": sum(1 for record in records if record.status in (STATUS.PLANNED, STATUS.RUNNING)),
        }
        return Response(
            {
                "results": ExperimentRecordSerializer(records, many=True).data,
                "count": len(records),
                "counters": counters,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        profile = research_project(workspace, project_id)
        if profile is None or not can_read_project_research_metadata(
            workspace, request.user, profile
        ):
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        if not can_create_research_content(request.user, workspace, profile):
            return research_permission_denied()
        title = str(request.data.get("title") or "").strip()
        if not title:
            return research_error(
                ResearchErrorCode.EXPERIMENT_STATE_CONFLICT,
                "title is required.",
            )
        with transaction.atomic():
            record = ExperimentRecord.objects.create(
                workspace=workspace,
                project_id=project_id,
                sequence_no=next_sequence_no(project_id),
                stage_instance=content_stage_instance(profile),
                title=title,
                owner=request.user,
                source=str(request.data.get("source") or ExperimentRecord.Source.MANUAL).upper(),
                visibility=str(request.data.get("visibility") or "DIRECT_ADVISOR").upper(),
                created_by=request.user,
            )
            apply_payload(record, request.data)
            if record.status not in STATUS.values:
                record.status = STATUS.PLANNED
            record.save()

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.EXPERIMENT_CREATE,
            resource_type=ResearchResourceType.EXPERIMENT,
            resource_id=record.id,
            org_unit=profile.org_unit,
            actor=request.user,
            metadata={"sequence_no": record.sequence_no, "source": record.source},
            request=request,
        )
        return Response(ExperimentRecordSerializer(record).data, status=status.HTTP_201_CREATED)


class ResearchExperimentDetailEndpoint(ResearchAPIView):
    """``GET``/``PATCH /api/research/workspaces/<slug>/experiments/<record_id>/``"""

    def get(self, request, slug, record_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        record, error = visible_record(request, workspace, record_id)
        if error:
            return error
        data = ExperimentRecordSerializer(record).data
        data["locked_fields"] = list(LOCKED_FIELDS)
        data["amendable_fields"] = list(AMENDABLE_FIELDS)
        data["can_edit"] = can_edit_experiment(request.user, workspace, record) and record.submitted_at is None
        data["can_review"] = can_review_experiment(request.user, workspace, record)
        data["amendments"] = ExperimentAmendmentSerializer(
            record.amendments.select_related("requested_by", "reviewed_by"), many=True
        ).data
        data["assets"] = ExperimentAssetLinkSerializer(record.asset_links, many=True).data
        data["versions"] = ExperimentRecordVersionSerializer(
            record.versions.select_related("created_by")[:50], many=True
        ).data
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request, slug, record_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        record, error = visible_record(request, workspace, record_id, action="edit")
        if error:
            return error
        if not can_edit_experiment(request.user, workspace, record):
            return research_permission_denied()
        try:
            require_writable(record)
        except StageRuleError as exc:
            return stage_rule_error_response(exc)
        if record.status == STATUS.RUNNING and record.submitted_at is None:
            locked = locked_field_changes(record, request.data)
            if locked:
                return research_conflict(
                    ResearchErrorCode.EXPERIMENT_LOCKED_FIELD,
                    f"Key fields are locked once the experiment runs: {', '.join(locked)}.",
                )
        changed_fields = sorted(set(EDITABLE_FIELDS).intersection(request.data.keys()))
        before = audit_field_snapshot(record, changed_fields)
        apply_payload(record, request.data)
        record.save()
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.EXPERIMENT_UPDATE,
            resource_type=ResearchResourceType.EXPERIMENT,
            resource_id=record.id,
            actor=request.user,
            metadata=delegated_change_metadata(
                request.user,
                record,
                changed_fields,
                before,
                sequence_no=record.sequence_no,
            ),
            request=request,
        )
        return Response(ExperimentRecordSerializer(record).data, status=status.HTTP_200_OK)


class ResearchExperimentStatusEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/experiments/<record_id>/status/``"""

    def post(self, request, slug, record_id):
        from plane.research.services.experiment_service import require_transition

        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        record, error = visible_record(request, workspace, record_id, action="edit")
        if error:
            return error
        if not can_edit_experiment(request.user, workspace, record):
            return research_permission_denied()
        try:
            require_writable(record)
            target = str(request.data.get("status") or "").upper()
            if target not in STATUS.values:
                return research_error(
                    ResearchErrorCode.EXPERIMENT_STATE_CONFLICT,
                    "Unknown experiment status.",
                )
            require_transition(record, target)
        except StageRuleError as exc:
            return stage_rule_error_response(exc)
        if target == STATUS.FAILED and not str(request.data.get("failure_reason") or record.failure_reason).strip():
            return research_error(
                ResearchErrorCode.EXPERIMENT_STATE_CONFLICT,
                "A failed experiment needs a failure reason.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        record.status = target
        if "failure_reason" in request.data:
            record.failure_reason = str(request.data.get("failure_reason") or "")
        if "status_note" in request.data:
            record.status_note = str(request.data.get("status_note") or "")
        record.save()
        return Response(ExperimentRecordSerializer(record).data, status=status.HTTP_200_OK)


class ResearchExperimentSubmitEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/experiments/<record_id>/submit/``"""

    def post(self, request, slug, record_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        record, error = visible_record(request, workspace, record_id, action="edit")
        if error:
            return error
        if not can_edit_experiment(request.user, workspace, record):
            return research_permission_denied()
        try:
            submit_experiment(record, request.user, request)
        except StageRuleError as exc:
            return stage_rule_error_response(exc)
        record.refresh_from_db()
        return Response(ExperimentRecordSerializer(record).data, status=status.HTTP_200_OK)


class ResearchExperimentArchiveEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/experiments/<record_id>/archive/``

    Archiving is the only alternative to keeping a record: deletion is refused
    (P1-EXP-10).
    """

    def post(self, request, slug, record_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        record, error = visible_record(request, workspace, record_id, action="edit")
        if error:
            return error
        if not can_edit_experiment(request.user, workspace, record):
            return research_permission_denied()
        try:
            archive_experiment(record, request.user, request)
        except StageRuleError as exc:
            return stage_rule_error_response(exc)
        return Response(ExperimentRecordSerializer(record).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, record_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        record, error = visible_record(request, workspace, record_id, action="delete")
        if error:
            return error
        return research_conflict(
            ResearchErrorCode.EXPERIMENT_ARCHIVED,
            "Experiments are never deleted. Archive the record instead.",
        )


class ResearchExperimentVersionsEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/experiments/<record_id>/versions/``"""

    def get(self, request, slug, record_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        record, error = visible_record(request, workspace, record_id)
        if error:
            return error
        versions = list(record.versions.select_related("created_by"))
        return Response(
            {
                "results": ExperimentRecordVersionSerializer(versions, many=True).data,
                "count": len(versions),
            },
            status=status.HTTP_200_OK,
        )


class ResearchExperimentAssetEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/experiments/<record_id>/assets/``

    Only identifiers and metadata are accepted: raw data belongs to the source
    system (P1-EXP-11).
    """

    def get(self, request, slug, record_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        record, error = visible_record(request, workspace, record_id)
        if error:
            return error
        links = list(record.asset_links.all())
        return Response(
            {"results": ExperimentAssetLinkSerializer(links, many=True).data, "count": len(links)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug, record_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        record, error = visible_record(request, workspace, record_id, action="edit")
        if error:
            return error
        if not can_edit_experiment(request.user, workspace, record):
            return research_permission_denied()
        if request.FILES:
            return research_error(
                ResearchErrorCode.EXPERIMENT_ASSET_EXISTS,
                "Plane does not store experiment data files. Register an external asset reference.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        external_asset_id = str(request.data.get("external_asset_id") or "").strip()
        display_name = str(request.data.get("display_name") or "").strip()
        if not external_asset_id or not display_name:
            return research_error(
                ResearchErrorCode.EXPERIMENT_ASSET_EXISTS,
                "external_asset_id and display_name are required.",
            )
        source_system = str(request.data.get("source_system") or "SPECLABOS").upper()
        if source_system not in ExperimentAssetLink.SourceSystem.values:
            source_system = ExperimentAssetLink.SourceSystem.OTHER.value
        relation = str(request.data.get("relation") or "INPUT").upper()
        if relation not in ExperimentAssetLink.Relation.values:
            relation = ExperimentAssetLink.Relation.INPUT.value
        try:
            with transaction.atomic():
                link = ExperimentAssetLink.objects.create(
                    record=record,
                    relation=relation,
                    source_system=source_system,
                    external_asset_id=external_asset_id,
                    external_file_id=str(request.data.get("external_file_id") or ""),
                    external_run_id=str(request.data.get("external_run_id") or ""),
                    display_name=display_name,
                    mime_type=str(request.data.get("mime_type") or ""),
                    size_bytes=request.data.get("size_bytes") or None,
                    external_url=str(request.data.get("external_url") or ""),
                    created_by=request.user,
                )
        except IntegrityError:
            return research_conflict(
                ResearchErrorCode.EXPERIMENT_ASSET_EXISTS,
                "This asset is already linked to the experiment.",
            )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.EXPERIMENT_ASSET_LINK,
            resource_type=ResearchResourceType.EXPERIMENT_ASSET,
            resource_id=link.id,
            actor=request.user,
            metadata={
                "sequence_no": record.sequence_no,
                "source_system": source_system,
                "external_asset_id": external_asset_id,
            },
            request=request,
        )
        return Response(ExperimentAssetLinkSerializer(link).data, status=status.HTTP_201_CREATED)


class ResearchExperimentIngestEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/projects/<project_id>/experiments/ingest/``

    SpecLabOS pushes a finished run here. The record is created as
    ``AUTOMATED``; a repeated push of the same run returns the existing record
    instead of creating a second one (P1-LAB-04). When the source system cannot
    be reached the record is still created with a pending note (P1-LAB-06).
    """

    def post(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        profile = ResearchProjectProfile.objects.filter(workspace=workspace, project_id=project_id).first()
        if profile is None or not can_read_project_research_metadata(
            workspace, request.user, profile
        ):
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        if not can_create_research_content(request.user, workspace, profile):
            return research_permission_denied()
        record, outcome = ingest_run(workspace, project_id, request.user, request.data, request=request)
        if record is None:
            return research_error(
                ResearchErrorCode.EXPERIMENT_STATE_CONFLICT,
                "external_run_id is required.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        payload = ExperimentRecordSerializer(record).data
        payload["created"] = outcome.created
        payload["duplicate_of"] = outcome.duplicate_of
        payload["degraded"] = outcome.degraded
        payload["degraded_reason"] = outcome.degraded_reason
        payload["asset_count"] = len(outcome.assets)
        return Response(
            payload,
            status=status.HTTP_201_CREATED if outcome.created else status.HTTP_200_OK,
        )


class ResearchExperimentAssetDetailEndpoint(ResearchAPIView):
    """``DELETE /api/research/workspaces/<slug>/experiment-assets/<link_id>/``"""

    def delete(self, request, slug, link_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        link = (
            ExperimentAssetLink.objects.filter(
                pk=link_id, record__workspace=workspace, deleted_at__isnull=True
            )
            .select_related("record")
            .first()
        )
        if link is None:
            return research_not_found(ResearchErrorCode.EXPERIMENT_ASSET_NOT_FOUND, "Asset link not found.")
        if not can_edit_experiment(request.user, workspace, link.record):
            return research_permission_denied()
        link.deleted_at = timezone.now()
        link.save(update_fields=["deleted_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.EXPERIMENT_ASSET_UNLINK,
            resource_type=ResearchResourceType.EXPERIMENT_ASSET,
            resource_id=link.id,
            actor=request.user,
            metadata={"sequence_no": link.record.sequence_no},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResearchExperimentAmendmentListCreateEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/experiments/<record_id>/amendments/``"""

    def get(self, request, slug, record_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        record, error = visible_record(request, workspace, record_id)
        if error:
            return error
        amendments = list(record.amendments.select_related("requested_by", "reviewed_by"))
        return Response(
            {
                "results": ExperimentAmendmentSerializer(amendments, many=True).data,
                "count": len(amendments),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug, record_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        record, error = visible_record(request, workspace, record_id, action="edit")
        if error:
            return error
        if not can_edit_experiment(request.user, workspace, record):
            return research_permission_denied()
        evidence_asset = None
        if request.data.get("evidence_asset"):
            evidence_asset = FileAsset.objects.filter(
                pk=request.data["evidence_asset"], workspace=workspace
            ).first()
            if evidence_asset is None:
                return research_not_found(
                    ResearchErrorCode.ATTACHMENT_NOT_FOUND,
                    "The evidence asset could not be found.",
                )
        try:
            amendment = create_amendment(
                record,
                request.user,
                reason=request.data.get("reason"),
                change_set=request.data.get("change_set"),
                evidence_asset=evidence_asset,
                request=request,
            )
        except StageRuleError as exc:
            return stage_rule_error_response(exc)
        return Response(ExperimentAmendmentSerializer(amendment).data, status=status.HTTP_201_CREATED)


class ResearchExperimentAmendmentDetailEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/amendments/<amendment_id>/``"""

    def _load(self, request, workspace, amendment_id, action="view"):
        amendment = (
            ExperimentAmendment.objects.filter(
                pk=amendment_id, record__workspace=workspace, deleted_at__isnull=True
            )
            .select_related("record", "requested_by", "reviewed_by")
            .first()
        )
        if amendment is None:
            return None, research_not_found(ResearchErrorCode.AMENDMENT_NOT_FOUND, "Amendment not found.")
        if action == "review" and not can_review_experiment(request.user, workspace, amendment.record):
            return None, research_permission_denied()
        if action == "view":
            record, error = visible_record(request, workspace, amendment.record_id)
            if error:
                return None, error
        return amendment, None

    def get(self, request, slug, amendment_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        amendment, error = self._load(request, workspace, amendment_id)
        if error:
            return error
        data = ExperimentAmendmentSerializer(amendment).data
        data["record_detail"] = ExperimentRecordSerializer(amendment.record).data
        return Response(data, status=status.HTTP_200_OK)


class ResearchExperimentAmendmentActionEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/amendments/<amendment_id>/<action>/``"""

    def post(self, request, slug, amendment_id, action):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        amendment = (
            ExperimentAmendment.objects.filter(
                pk=amendment_id, record__workspace=workspace, deleted_at__isnull=True
            )
            .select_related("record")
            .first()
        )
        if amendment is None:
            return research_not_found(ResearchErrorCode.AMENDMENT_NOT_FOUND, "Amendment not found.")
        if action == "cancel":
            if amendment.requested_by_id != request.user.id:
                return research_permission_denied()
        else:
            if not can_review_experiment(request.user, workspace, amendment.record):
                return research_permission_denied()
        try:
            if action == "approve":
                approve_amendment(amendment, request.user, str(request.data.get("comment") or ""), request)
            elif action == "reject":
                reject_amendment(amendment, request.user, str(request.data.get("comment") or ""), request)
            elif action == "cancel":
                cancel_amendment(amendment, request.user, request)
            else:
                return research_error(
                    ResearchErrorCode.AMENDMENT_STATE_CONFLICT,
                    "Unknown amendment action.",
                )
        except StageRuleError as exc:
            return stage_rule_error_response(exc)
        return Response(ExperimentAmendmentSerializer(amendment).data, status=status.HTTP_200_OK)
