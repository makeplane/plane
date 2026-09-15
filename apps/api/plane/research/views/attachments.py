# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

from django.db import IntegrityError
from django.http import HttpResponseRedirect
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import FileAsset, ReportAttachment
from plane.research.serializers import ReportAttachmentSerializer
from plane.research.utils.acl import build_actor_context, check_access
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.files import detect_kind, markdown_to_html, validate_attachment
from plane.utils.path_validator import sanitize_filename
from plane.research.utils.reports import is_editable, report_resource
from plane.research.utils.settings import get_workspace_research_settings
from plane.research.views.base import ResearchAPIView
from plane.research.views.reports import report_queryset
from plane.settings.storage import S3Storage


class ResearchReportAttachmentListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/reports/<report_id>/attachments/``"""

    def _report(self, request, workspace, report_id):
        report = report_queryset(workspace).filter(pk=report_id).first()
        if report is None:
            return None, research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")
        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, "view", report_resource(report), context=context):
            return None, research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")
        return report, None

    def get(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        report, error = self._report(request, workspace, report_id)
        if error:
            return error
        attachments = list(ReportAttachment.objects.filter(report=report).select_related("asset"))
        return Response(
            {
                "results": ReportAttachmentSerializer(attachments, many=True).data,
                "count": len(attachments),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        report, error = self._report(request, workspace, report_id)
        if error:
            return error

        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, "view", report_resource(report), context=context):
            return research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")
        if not check_access(request.user, "edit", report_resource(report), context=context):
            return research_permission_denied()
        if not is_editable(report):
            return research_error(
                ResearchErrorCode.REPORT_READ_ONLY,
                "Attachments cannot be changed once the report is submitted.",
                status.HTTP_409_CONFLICT,
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
            # the object should exist in S3 after the direct upload
            try:
                metadata = S3Storage(request=request).get_object_metadata(object_name=asset.asset.name)
            except Exception:
                metadata = None
            if not metadata:
                return research_error(
                    ResearchErrorCode.ATTACHMENT_NOT_FOUND,
                    "The upload did not complete. Please retry the upload.",
                    status.HTTP_409_CONFLICT,
                )
            asset.is_uploaded = True
            asset.save(update_fields=["is_uploaded", "updated_at"])

        file_name = asset.attributes.get("name") or asset.asset.name
        content_type = asset.attributes.get("type") or ""
        limits = get_workspace_research_settings(workspace)
        error_code = validate_attachment(
            file_name=file_name,
            content_type=content_type,
            size_bytes=asset.size,
            limits=limits,
        )
        if error_code:
            record_audit_event(
                workspace=workspace,
                action=ResearchAuditAction.REPORT_ATTACHMENT_DENIED,
                resource_type=ResearchResourceType.REPORT_ATTACHMENT,
                resource_id=report.id,
                org_unit=report.org_unit,
                actor=request.user,
                metadata={"reason": error_code, "file_name": file_name},
                request=request,
            )
            return research_error(error_code, "This file is not allowed.", status.HTTP_422_UNPROCESSABLE_ENTITY)

        try:
            attachment = ReportAttachment.objects.create(
                report=report,
                asset=asset,
                kind=detect_kind(file_name, content_type),
                file_name=file_name,
                file_size=asset.size,
                content_type=content_type,
                uploaded_by=request.user,
                created_by=request.user,
            )
        except IntegrityError:
            return research_error(
                ResearchErrorCode.ATTACHMENT_NOT_FOUND,
                "This file is already attached to the report.",
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.REPORT_ATTACHMENT_ADD,
            resource_type=ResearchResourceType.REPORT_ATTACHMENT,
            resource_id=attachment.id,
            org_unit=report.org_unit,
            actor=request.user,
            metadata={"file_name": file_name, "kind": attachment.kind},
            request=request,
        )
        return Response(
            ReportAttachmentSerializer(attachment).data,
            status=status.HTTP_201_CREATED,
        )


class ResearchReportAttachmentPresignEndpoint(ResearchAPIView):
    """``POST .../attachments/presign/`` produces a direct-to-S3 upload slot.

    The server never buffers the file body, so research limits (up to 100MB)
    stay independent from ``FILE_SIZE_LIMIT`` (review item T-11).
    """

    def post(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        report = report_queryset(workspace).filter(pk=report_id).first()
        if report is None:
            return research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")

        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, "view", report_resource(report), context=context):
            return research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")
        if not check_access(request.user, "edit", report_resource(report), context=context):
            return research_permission_denied()
        if not is_editable(report):
            return research_error(
                ResearchErrorCode.REPORT_READ_ONLY,
                "Attachments cannot be changed once the report is submitted.",
                status.HTTP_409_CONFLICT,
            )

        file_name = str(request.data.get("file_name") or "").strip()
        content_type = str(request.data.get("content_type") or "application/octet-stream")
        try:
            size = int(request.data.get("size") or 0)
        except (TypeError, ValueError):
            size = 0

        limits = get_workspace_research_settings(workspace)
        error_code = validate_attachment(
            file_name=file_name,
            content_type=content_type,
            size_bytes=size,
            limits=limits,
        )
        if error_code:
            record_audit_event(
                workspace=workspace,
                action=ResearchAuditAction.REPORT_ATTACHMENT_DENIED,
                resource_type=ResearchResourceType.REPORT_ATTACHMENT,
                resource_id=report.id,
                org_unit=report.org_unit,
                actor=request.user,
                metadata={"reason": error_code, "file_name": file_name},
                request=request,
            )
            return research_error(error_code, "This file is not allowed.", status.HTTP_422_UNPROCESSABLE_ENTITY)

        safe_name = sanitize_filename(file_name) or "attachment"
        asset_key = f"{workspace.id}/research/{report.id}/{uuid.uuid4().hex}-{safe_name}"
        storage = S3Storage(request=request)
        presigned = storage.generate_presigned_post(
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
            {"asset_id": str(asset.id), "asset_key": asset_key, "upload_data": presigned},
            status=status.HTTP_200_OK,
        )


class ResearchReportAttachmentDetailEndpoint(ResearchAPIView):
    """``DELETE`` and ``GET .../download/`` for a report attachment."""

    def _attachment(self, request, workspace, report_id, attachment_id, action="view"):
        attachment = (
            ReportAttachment.objects.filter(report_id=report_id, report__workspace=workspace, pk=attachment_id)
            .select_related("report", "asset")
            .first()
        )
        if attachment is None:
            return None, research_not_found(
                ResearchErrorCode.ATTACHMENT_NOT_FOUND, "Attachment not found."
            )
        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, action, report_resource(attachment.report), context=context):
            return None, research_permission_denied()
        return attachment, None

    def delete(self, request, slug, report_id, attachment_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        attachment, error = self._attachment(request, workspace, report_id, attachment_id, action="edit")
        if error:
            return error
        if not is_editable(attachment.report):
            return research_error(
                ResearchErrorCode.REPORT_READ_ONLY,
                "Attachments cannot be changed once the report is submitted.",
                status.HTTP_409_CONFLICT,
            )

        attachment.deleted_at = timezone.now()
        attachment.save(update_fields=["deleted_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.REPORT_ATTACHMENT_DELETE,
            resource_type=ResearchResourceType.REPORT_ATTACHMENT,
            resource_id=attachment.id,
            org_unit=attachment.report.org_unit,
            actor=request.user,
            metadata={"file_name": attachment.file_name},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get(self, request, slug, report_id, attachment_id):
        """Download: the ACL is re-checked here (P0-FILE-06)."""
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        attachment, error = self._attachment(request, workspace, report_id, attachment_id, action="download")
        if error:
            report = report_queryset(workspace).filter(pk=report_id).first()
            record_audit_event(
                workspace=workspace,
                action=ResearchAuditAction.REPORT_ATTACHMENT_DENIED,
                resource_type=ResearchResourceType.REPORT_ATTACHMENT,
                resource_id=attachment_id,
                org_unit=report.org_unit if report else None,
                actor=request.user if request.user.is_authenticated else None,
                metadata={"reason": "permission_denied"},
                request=request,
            )
            return error

        storage = S3Storage(request=request)
        signed_url = storage.generate_presigned_url(
            object_name=attachment.asset.asset.name,
            disposition="attachment",
            filename=attachment.file_name,
        )
        return HttpResponseRedirect(signed_url)


class ResearchReportMarkdownImportEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/reports/<report_id>/import-markdown/``

    Converts ``.md`` content into the report body. Remote images keep their URL,
    local relative paths are reported back for manual upload (P0-FILE-03,
    P0-FILE-07).
    """

    def post(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        report = report_queryset(workspace).filter(pk=report_id).first()
        if report is None:
            return research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")

        context = build_actor_context(request.user, workspace.id)
        # invisible reports answer 404 so the endpoint never leaks existence
        if not check_access(request.user, "view", report_resource(report), context=context):
            return research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")
        if not check_access(request.user, "edit", report_resource(report), context=context):
            return research_permission_denied()
        if not is_editable(report):
            return research_error(
                ResearchErrorCode.REPORT_READ_ONLY,
                "A submitted report cannot be modified.",
                status.HTTP_409_CONFLICT,
            )

        content = request.data.get("content")
        if content is None:
            return research_error(
                ResearchErrorCode.FILE_TYPE_NOT_ALLOWED,
                "content is required.",
            )
        file_name = str(request.data.get("file_name") or "import.md")
        limits = get_workspace_research_settings(workspace)
        error_code = validate_attachment(
            file_name=file_name,
            content_type="text/markdown",
            size_bytes=len(str(content).encode("utf-8")),
            limits=limits,
        )
        if error_code:
            return research_error(error_code, "This file is not allowed.", status.HTTP_422_UNPROCESSABLE_ENTITY)

        html, local_images = markdown_to_html(content)
        report.page.description_html = html
        report.page.save(update_fields=["description_html", "description_stripped", "updated_at"])

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.REPORT_IMPORT_MARKDOWN,
            resource_type=ResearchResourceType.REPORT,
            resource_id=report.id,
            org_unit=report.org_unit,
            actor=request.user,
            metadata={"file_name": file_name, "local_images": local_images},
            request=request,
        )
        return Response(
            {
                "report": str(report.id),
                "page": str(report.page_id),
                "local_images": local_images,
                "content_html": html,
            },
            status=status.HTTP_200_OK,
        )
