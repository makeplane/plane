# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Literature endpoints (§5.4) — pre-opening literature collection."""

import uuid

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    FileAsset,
    LiteratureEntry,
    ResearchProjectProfile,
    ResearchStageInstance,
    StageType,
)
from plane.research.serializers import LiteratureEntrySerializer
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
from plane.research.utils.files import detect_kind, validate_attachment
from plane.research.utils.literature import (
    default_visibility,
    literature_counters,
    literature_resource,
    literature_thresholds,
    parse_bibtex,
    parse_doi_lines,
)
from plane.research.utils.org import is_workspace_admin
from plane.research.utils.settings import get_workspace_research_settings
from plane.research.views.base import ResearchAPIView
from plane.settings.storage import S3Storage
from plane.utils.path_validator import sanitize_filename

SECTION = "stages"


def research_project(workspace, project_id):
    return (
        ResearchProjectProfile.objects.filter(workspace=workspace, project_id=project_id)
        .select_related("project")
        .first()
    )


def can_edit_literature(actor, workspace, entry) -> bool:
    if is_workspace_admin(actor, workspace):
        return True
    if entry.owner_id == actor.id:
        return True
    return ResearchProjectProfile.objects.filter(project_id=entry.project_id, owner_id=actor.id).exists()


def visible_entry(request, workspace, entry_id, action="view"):
    entry = LiteratureEntry.objects.filter(
        workspace=workspace,
        pk=entry_id,
        deleted_at__isnull=True,
    ).first()
    if entry is None:
        return None, research_not_found(ResearchErrorCode.LITERATURE_NOT_FOUND, "Literature entry not found.")
    context = build_actor_context(request.user, workspace.id)
    if not check_access(request.user, action, literature_resource(entry), context=context):
        if action == "view":
            return None, research_not_found(ResearchErrorCode.LITERATURE_NOT_FOUND, "Literature entry not found.")
        return None, research_permission_denied()
    return entry, None


def normalise_tags(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [part.strip() for part in str(value).split(",") if part.strip()]


def parse_year(value):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def parse_score(value):
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def parse_size(value):
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def stage_instance_for(workspace, project_id, stage_code=StageType.PRE_OPENING.value):
    return ResearchStageInstance.objects.filter(
        workspace=workspace,
        project_id=project_id,
        stage=stage_code,
        deleted_at__isnull=True,
    ).first()


class ResearchLiteratureListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/projects/<project_id>/literature/``"""

    def get(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        profile = research_project(workspace, project_id)
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")

        query = LiteratureEntry.objects.filter(
            workspace=workspace, project_id=project_id, deleted_at__isnull=True
        ).select_related("owner")
        if request.GET.get("status"):
            query = query.filter(status=str(request.GET["status"]).upper())
        if request.GET.get("year"):
            query = query.filter(year=parse_year(request.GET["year"]))
        if request.GET.get("owner"):
            query = query.filter(owner_id=request.GET["owner"])
        if request.GET.get("q"):
            query = query.filter(title__icontains=str(request.GET["q"]))

        context = build_actor_context(request.user, workspace.id)
        entries = [
            entry
            for entry in query.order_by("-created_at")[:500]
            if check_access(request.user, "view", literature_resource(entry), context=context)
        ]
        return Response(
            {
                "results": LiteratureEntrySerializer(entries, many=True).data,
                "count": len(entries),
                "threshold": literature_thresholds(workspace),
                "counters": literature_counters(project_id, workspace.id),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        profile = research_project(workspace, project_id)
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        if profile.owner_id != request.user.id and not is_workspace_admin(request.user, workspace):
            return research_permission_denied()

        title = str(request.data.get("title") or "").strip()
        if not title:
            return research_error(ResearchErrorCode.LITERATURE_STATUS_INVALID, "title is required.")
        counters = literature_counters(project_id, workspace.id)
        limits = literature_thresholds(workspace)
        if counters["total"] >= limits["max_entries"]:
            return research_error(
                ResearchErrorCode.LITERATURE_LIMIT_EXCEEDED,
                "The project reached the literature registration limit.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        doi = str(request.data.get("doi") or "").strip()
        entry_status = str(request.data.get("status") or LiteratureEntry.Status.COLLECTED).upper()
        if entry_status not in LiteratureEntry.Status.values:
            return research_error(ResearchErrorCode.LITERATURE_STATUS_INVALID, "Unknown literature status.")
        summary = str(request.data.get("summary") or "")
        gap_notes = str(request.data.get("gap_notes") or "")
        if entry_status == LiteratureEntry.Status.INCLUDED and not (summary.strip() and gap_notes.strip()):
            return research_error(
                ResearchErrorCode.LITERATURE_NOT_ANNOTATED,
                "An included entry needs both a summary and gap notes.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        try:
            with transaction.atomic():
                entry = LiteratureEntry.objects.create(
                    workspace=workspace,
                    project_id=project_id,
                    owner=request.user,
                    title=title,
                    authors=str(request.data.get("authors") or ""),
                    year=parse_year(request.data.get("year")),
                    venue=str(request.data.get("venue") or ""),
                    doi=doi,
                    url=str(request.data.get("url") or ""),
                    summary=summary,
                    method_tags=normalise_tags(request.data.get("method_tags")),
                    system_tags=normalise_tags(request.data.get("system_tags")),
                    gap_notes=gap_notes,
                    relevance_score=parse_score(request.data.get("relevance_score")),
                    status=entry_status,
                    visibility=str(request.data.get("visibility") or default_visibility(workspace)).upper(),
                    stage_instance=stage_instance_for(workspace, project_id),
                    created_by=request.user,
                )
        except IntegrityError:
            return research_conflict(
                ResearchErrorCode.LITERATURE_DUPLICATE_DOI,
                "This DOI is already registered in the project.",
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.LITERATURE_CREATE,
            resource_type=ResearchResourceType.LITERATURE,
            resource_id=entry.id,
            org_unit=profile.org_unit,
            actor=request.user,
            metadata={"status": entry.status, "has_doi": bool(entry.doi)},
            request=request,
        )
        return Response(LiteratureEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


class ResearchLiteratureDetailEndpoint(ResearchAPIView):
    """``GET``/``PATCH``/``DELETE /api/research/workspaces/<slug>/literature/<entry_id>/``"""

    EDITABLE_FIELDS = ("title", "authors", "venue", "doi", "url", "summary", "gap_notes", "visibility")

    def get(self, request, slug, entry_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        entry, error = visible_entry(request, workspace, entry_id)
        if error:
            return error
        return Response(LiteratureEntrySerializer(entry).data, status=status.HTTP_200_OK)

    def patch(self, request, slug, entry_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        entry, error = visible_entry(request, workspace, entry_id, action="edit")
        if error:
            return error
        if not can_edit_literature(request.user, workspace, entry):
            return research_permission_denied()

        for field in self.EDITABLE_FIELDS:
            if field in request.data:
                value = request.data.get(field)
                if field == "doi":
                    value = str(value or "").strip()
                setattr(entry, field, "" if value is None else value)
        if "year" in request.data:
            entry.year = parse_year(request.data.get("year"))
        if "relevance_score" in request.data:
            entry.relevance_score = parse_score(request.data.get("relevance_score"))
        if "method_tags" in request.data:
            entry.method_tags = normalise_tags(request.data.get("method_tags"))
        if "system_tags" in request.data:
            entry.system_tags = normalise_tags(request.data.get("system_tags"))
        if entry.status == LiteratureEntry.Status.INCLUDED and not entry.is_annotated:
            return research_error(
                ResearchErrorCode.LITERATURE_NOT_ANNOTATED,
                "An included entry needs both a summary and gap notes.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        try:
            entry.save()
        except IntegrityError:
            return research_conflict(
                ResearchErrorCode.LITERATURE_DUPLICATE_DOI,
                "This DOI is already registered in the project.",
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.LITERATURE_UPDATE,
            resource_type=ResearchResourceType.LITERATURE,
            resource_id=entry.id,
            actor=request.user,
            metadata={"fields": sorted(request.data.keys())},
            request=request,
        )
        return Response(LiteratureEntrySerializer(entry).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, entry_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        entry, error = visible_entry(request, workspace, entry_id, action="delete")
        if error:
            return error
        if not can_edit_literature(request.user, workspace, entry):
            return research_permission_denied()
        entry.deleted_at = timezone.now()
        entry.save(update_fields=["deleted_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.LITERATURE_DELETE,
            resource_type=ResearchResourceType.LITERATURE,
            resource_id=entry.id,
            actor=request.user,
            metadata={"title": entry.title[:200]},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResearchLiteratureStatusEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/literature/<entry_id>/status/``"""

    def post(self, request, slug, entry_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        entry, error = visible_entry(request, workspace, entry_id, action="edit")
        if error:
            return error
        if not can_edit_literature(request.user, workspace, entry):
            return research_permission_denied()

        target = str(request.data.get("status") or "").upper()
        if target not in LiteratureEntry.Status.values:
            return research_error(ResearchErrorCode.LITERATURE_STATUS_INVALID, "Unknown literature status.")
        if target == LiteratureEntry.Status.INCLUDED:
            summary = str(request.data.get("summary", entry.summary) or "")
            gap_notes = str(request.data.get("gap_notes", entry.gap_notes) or "")
            if not (summary.strip() and gap_notes.strip()):
                return research_error(
                    ResearchErrorCode.LITERATURE_NOT_ANNOTATED,
                    "An included entry needs both a summary and gap notes.",
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                )
            entry.summary = summary
            entry.gap_notes = gap_notes
        entry.status = target
        entry.save()

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.LITERATURE_STATUS,
            resource_type=ResearchResourceType.LITERATURE,
            resource_id=entry.id,
            actor=request.user,
            metadata={"status": target},
            request=request,
        )
        return Response(
            {
                "entry": LiteratureEntrySerializer(entry).data,
                "threshold": literature_thresholds(workspace),
                "counters": literature_counters(entry.project_id, workspace.id),
            },
            status=status.HTTP_200_OK,
        )


class ResearchLiteratureThresholdEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/projects/<project_id>/literature/threshold/``"""

    def get(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        profile = research_project(workspace, project_id)
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        counters = literature_counters(project_id, workspace.id)
        limits = literature_thresholds(workspace)
        return Response(
            {
                "project": str(project_id),
                "threshold": limits,
                "counters": counters,
                "remaining": max(limits["min_included"] - counters["included"], 0),
                "capacity": max(limits["max_entries"] - counters["total"], 0),
            },
            status=status.HTTP_200_OK,
        )


class ResearchLiteratureImportEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/projects/<project_id>/literature/import/``"""

    def post(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        profile = research_project(workspace, project_id)
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        if profile.owner_id != request.user.id and not is_workspace_admin(request.user, workspace):
            return research_permission_denied()

        fmt = str(request.data.get("format") or "doi").lower()
        content = str(request.data.get("content") or "")
        rows = parse_bibtex(content) if fmt == "bibtex" else parse_doi_lines(content)
        if not rows:
            return research_error(
                ResearchErrorCode.LITERATURE_IMPORT_EMPTY,
                "No importable entry was found in the payload.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        limits = literature_thresholds(workspace)
        counters = literature_counters(project_id, workspace.id)
        stage_instance = stage_instance_for(workspace, project_id)
        created, skipped, failed = [], [], []
        remaining = max(limits["max_entries"] - counters["total"], 0)

        for row in rows:
            doi = str(row.get("doi") or "").strip()
            if doi and LiteratureEntry.objects.filter(project_id=project_id, doi=doi).exists():
                skipped.append({"doi": doi, "reason": "duplicate"})
                continue
            if remaining <= 0:
                failed.append({"doi": doi, "reason": "limit_exceeded"})
                continue
            try:
                entry = LiteratureEntry.objects.create(
                    workspace=workspace,
                    project_id=project_id,
                    owner=request.user,
                    title=str(row.get("title") or doi or "Untitled")[:500],
                    authors=str(row.get("authors") or ""),
                    year=row.get("year"),
                    venue=str(row.get("venue") or "")[:255],
                    doi=doi,
                    url=str(row.get("url") or ""),
                    summary=str(row.get("summary") or ""),
                    status=LiteratureEntry.Status.COLLECTED,
                    visibility=default_visibility(workspace),
                    stage_instance=stage_instance,
                    created_by=request.user,
                )
                created.append(str(entry.id))
                remaining -= 1
            except IntegrityError:
                skipped.append({"doi": doi, "reason": "duplicate"})

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.LITERATURE_IMPORT,
            resource_type=ResearchResourceType.LITERATURE,
            resource_id=None,
            org_unit=profile.org_unit,
            actor=request.user,
            metadata={
                "format": fmt,
                "created": len(created),
                "skipped": len(skipped),
                "failed": len(failed),
            },
            request=request,
        )
        return Response(
            {
                "created": created,
                "skipped": skipped,
                "failed": failed,
                "counters": literature_counters(project_id, workspace.id),
            },
            status=status.HTTP_200_OK,
        )


class ResearchLiteraturePdfEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/literature/<entry_id>/pdf/``

    Two step upload: ``mode=presign`` produces a direct-to-S3 slot, then the
    caller registers the ``asset_id``. The PDF inherits the entry ACL
    (P1-LIT-06) and uses the research PDF limit, not ``FILE_SIZE_LIMIT``.
    """

    def post(self, request, slug, entry_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        entry, error = visible_entry(request, workspace, entry_id, action="edit")
        if error:
            return error
        if not can_edit_literature(request.user, workspace, entry):
            return research_permission_denied()

        limits = get_workspace_research_settings(workspace)
        if str(request.data.get("mode") or "").lower() == "presign":
            file_name = str(request.data.get("file_name") or "").strip()
            content_type = str(request.data.get("content_type") or "application/pdf")
            size = parse_size(request.data.get("size"))
            error_code = validate_attachment(
                file_name=file_name,
                content_type=content_type,
                size_bytes=size,
                limits=limits,
            )
            if error_code or detect_kind(file_name, content_type) != "PDF":
                return research_error(
                    error_code or ResearchErrorCode.FILE_TYPE_NOT_ALLOWED,
                    "A literature attachment must be a PDF within the configured limit.",
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                )
            safe_name = sanitize_filename(file_name) or "literature.pdf"
            asset_key = f"{workspace.id}/research/literature/{entry.id}/{uuid.uuid4().hex}-{safe_name}"
            presigned = S3Storage(request=request).generate_presigned_post(
                object_name=asset_key,
                file_type=content_type,
                file_size=size,
            )
            if presigned is None:
                return research_error(
                    ResearchErrorCode.FILE_TYPE_NOT_ALLOWED,
                    "Unable to prepare the upload.",
                    status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            asset = FileAsset.objects.create(
                attributes={"name": file_name, "type": content_type, "size": size},
                asset=asset_key,
                size=size,
                workspace=workspace,
                user=request.user,
                created_by=request.user,
                entity_type=FileAsset.EntityTypeContext.REPORT_ATTACHMENT,
                is_uploaded=False,
            )
            return Response(
                {"upload_data": presigned, "asset_id": str(asset.id)},
                status=status.HTTP_200_OK,
            )

        asset_id = request.data.get("asset_id")
        if not asset_id:
            return research_error(
                ResearchErrorCode.FILE_TYPE_NOT_ALLOWED,
                "asset_id is required: upload the file first, then register it.",
            )
        asset = FileAsset.objects.filter(pk=asset_id, workspace=workspace).first()
        if asset is None:
            return research_not_found(
                ResearchErrorCode.ATTACHMENT_NOT_FOUND,
                "The uploaded asset could not be found.",
            )
        if not asset.is_uploaded:
            try:
                metadata = S3Storage(request=request).get_object_metadata(object_name=asset.asset.name)
            except Exception:
                metadata = None
            if not metadata:
                return research_conflict(
                    ResearchErrorCode.ATTACHMENT_NOT_FOUND,
                    "The upload did not complete. Please retry the upload.",
                )
            asset.is_uploaded = True
            asset.save(update_fields=["is_uploaded", "updated_at"])

        entry.pdf_asset = asset
        entry.save(update_fields=["pdf_asset", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.LITERATURE_PDF,
            resource_type=ResearchResourceType.LITERATURE,
            resource_id=entry.id,
            actor=request.user,
            metadata={"asset": str(asset.id)},
            request=request,
        )
        return Response(LiteratureEntrySerializer(entry).data, status=status.HTTP_200_OK)
