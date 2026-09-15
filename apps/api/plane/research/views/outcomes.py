# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Outcome endpoints (§5.8) and the frozen reference list export (P1-CHAIN-07)."""

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    CodeArtifact,
    ExperimentRecord,
    FileAsset,
    PeriodicReport,
    ResearchOutcome,
    ResearchOutcomeLink,
    ResearchProjectProfile,
    StageMaterial,
)
from plane.research.serializers import ResearchOutcomeSerializer
from plane.research.services.progress import build_progress
from plane.research.utils.acl import ResearchResource, build_actor_context, check_access
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.chain import build_chain_markdown
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.org import is_workspace_admin
from plane.research.views.base import ResearchAPIView

SECTION = "stages"
LINK_TARGETS = {
    ResearchOutcomeLink.TargetType.EXPERIMENT_RECORD.value: ExperimentRecord,
    ResearchOutcomeLink.TargetType.CODE_ARTIFACT.value: CodeArtifact,
    ResearchOutcomeLink.TargetType.STAGE_MATERIAL.value: StageMaterial,
    ResearchOutcomeLink.TargetType.PERIODIC_REPORT.value: PeriodicReport,
}


def outcome_resource(outcome) -> ResearchResource:
    profile = ResearchProjectProfile.objects.filter(project_id=outcome.project_id).first()
    return ResearchResource(
        kind="research_outcome",
        workspace_id=outcome.workspace_id,
        owner_id=profile.owner_id if profile else None,
        org_unit_id=profile.org_unit_id if profile else None,
        visibility=outcome.visibility,
        state=outcome.status,
    )


def research_project(workspace, project_id):
    return ResearchProjectProfile.objects.filter(workspace=workspace, project_id=project_id).first()


def can_manage_outcomes(actor, workspace, profile) -> bool:
    if is_workspace_admin(actor, workspace):
        return True
    return bool(profile and profile.owner_id == actor.id)


def visible_outcome(request, workspace, outcome_id, action="view"):
    outcome = ResearchOutcome.objects.filter(
        workspace=workspace, pk=outcome_id, deleted_at__isnull=True
    ).first()
    if outcome is None:
        return None, research_not_found(ResearchErrorCode.OUTCOME_NOT_FOUND, "Outcome not found.")
    context = build_actor_context(request.user, workspace.id)
    if not check_access(request.user, action, outcome_resource(outcome), context=context):
        if action == "view":
            return None, research_not_found(ResearchErrorCode.OUTCOME_NOT_FOUND, "Outcome not found.")
        return None, research_permission_denied()
    return outcome, None


class ResearchOutcomeListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/projects/<project_id>/outcomes/``"""

    def get(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        if research_project(workspace, project_id) is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        query = ResearchOutcome.objects.filter(
            workspace=workspace, project_id=project_id, deleted_at__isnull=True
        ).prefetch_related("links")
        if request.GET.get("output_type"):
            query = query.filter(output_type=str(request.GET["output_type"]).upper())
        if request.GET.get("status"):
            query = query.filter(status=str(request.GET["status"]).upper())
        context = build_actor_context(request.user, workspace.id)
        outcomes = [
            outcome
            for outcome in query.order_by("-created_at")[:200]
            if check_access(request.user, "view", outcome_resource(outcome), context=context)
        ]
        return Response(
            {
                "results": ResearchOutcomeSerializer(outcomes, many=True).data,
                "count": len(outcomes),
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
        if not can_manage_outcomes(request.user, workspace, profile):
            return research_permission_denied()
        title = str(request.data.get("title") or "").strip()
        output_type = str(request.data.get("output_type") or "PAPER").upper()
        outcome_status = str(request.data.get("status") or "DRAFT").upper()
        if not title:
            return research_error(ResearchErrorCode.OUTCOME_INVALID, "title is required.")
        if output_type not in ResearchOutcome.OutputType.values:
            return research_error(ResearchErrorCode.OUTCOME_INVALID, "Unknown outcome type.")
        if outcome_status not in ResearchOutcome.Status.values:
            return research_error(ResearchErrorCode.OUTCOME_INVALID, "Unknown outcome status.")
        file_asset = None
        if request.data.get("file_asset"):
            file_asset = FileAsset.objects.filter(pk=request.data["file_asset"], workspace=workspace).first()
            if file_asset is None:
                return research_not_found(ResearchErrorCode.ATTACHMENT_NOT_FOUND, "The file was not found.")
        outcome = ResearchOutcome.objects.create(
            workspace=workspace,
            project_id=project_id,
            output_type=output_type,
            title=title,
            authors=list(request.data.get("authors") or []),
            venue=str(request.data.get("venue") or ""),
            doi=str(request.data.get("doi") or ""),
            external_url=str(request.data.get("external_url") or ""),
            file_asset=file_asset,
            status=outcome_status,
            published_at=request.data.get("published_at") or None,
            visibility=str(request.data.get("visibility") or "DIRECT_ADVISOR").upper(),
            created_by=request.user,
        )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.OUTCOME_CREATE,
            resource_type=ResearchResourceType.OUTCOME,
            resource_id=outcome.id,
            org_unit=profile.org_unit,
            actor=request.user,
            metadata={"output_type": output_type, "status": outcome_status},
            request=request,
        )
        return Response(ResearchOutcomeSerializer(outcome).data, status=status.HTTP_201_CREATED)


class ResearchOutcomeDetailEndpoint(ResearchAPIView):
    """``GET``/``PATCH``/``DELETE /api/research/workspaces/<slug>/outcomes/<outcome_id>/``"""

    def get(self, request, slug, outcome_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        outcome, error = visible_outcome(request, workspace, outcome_id)
        if error:
            return error
        return Response(ResearchOutcomeSerializer(outcome).data, status=status.HTTP_200_OK)

    def patch(self, request, slug, outcome_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        outcome, error = visible_outcome(request, workspace, outcome_id)
        if error:
            return error
        profile = research_project(workspace, outcome.project_id)
        if not can_manage_outcomes(request.user, workspace, profile):
            return research_permission_denied()
        for field in ("title", "venue", "doi", "external_url", "visibility"):
            if field in request.data:
                setattr(outcome, field, str(request.data.get(field) or ""))
        if "authors" in request.data:
            outcome.authors = list(request.data.get("authors") or [])
        if "status" in request.data:
            target = str(request.data.get("status") or "").upper()
            if target not in ResearchOutcome.Status.values:
                return research_error(ResearchErrorCode.OUTCOME_INVALID, "Unknown outcome status.")
            outcome.status = target
        if "published_at" in request.data:
            outcome.published_at = request.data.get("published_at") or None
        outcome.save()
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.OUTCOME_UPDATE,
            resource_type=ResearchResourceType.OUTCOME,
            resource_id=outcome.id,
            actor=request.user,
            metadata={"fields": sorted(request.data.keys())},
            request=request,
        )
        return Response(ResearchOutcomeSerializer(outcome).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, outcome_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        outcome, error = visible_outcome(request, workspace, outcome_id)
        if error:
            return error
        profile = research_project(workspace, outcome.project_id)
        if not can_manage_outcomes(request.user, workspace, profile):
            return research_permission_denied()
        outcome.deleted_at = timezone.now()
        outcome.save(update_fields=["deleted_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.OUTCOME_DELETE,
            resource_type=ResearchResourceType.OUTCOME,
            resource_id=outcome.id,
            actor=request.user,
            metadata={"title": outcome.title[:200]},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResearchOutcomeLinkEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/outcomes/<outcome_id>/links/``"""

    def post(self, request, slug, outcome_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        outcome, error = visible_outcome(request, workspace, outcome_id)
        if error:
            return error
        profile = research_project(workspace, outcome.project_id)
        if not can_manage_outcomes(request.user, workspace, profile):
            return research_permission_denied()
        target_type = str(request.data.get("target_type") or "").upper()
        target_id = request.data.get("target_id")
        model = LINK_TARGETS.get(target_type)
        if model is None or not target_id:
            return research_error(
                ResearchErrorCode.OUTCOME_INVALID,
                "target_type and target_id are required.",
            )
        if target_type == ResearchOutcomeLink.TargetType.CODE_ARTIFACT.value:
            # a code artifact reaches the project through its repository
            existing = CodeArtifact.objects.filter(
                pk=target_id, repository__project_id=outcome.project_id
            ).exists()
        else:
            existing = model.objects.filter(pk=target_id, project_id=outcome.project_id).exists()
        if not existing:
            return research_not_found(ResearchErrorCode.OUTCOME_TARGET_NOT_FOUND, "Linked object not found.")
        link, created = ResearchOutcomeLink.objects.get_or_create(
            outcome=outcome,
            target_type=target_type,
            target_id=target_id,
            defaults={"created_by": request.user},
        )
        if not created:
            return Response(ResearchOutcomeSerializer(outcome).data, status=status.HTTP_200_OK)
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.OUTCOME_LINK,
            resource_type=ResearchResourceType.OUTCOME,
            resource_id=outcome.id,
            actor=request.user,
            metadata={"target_type": target_type, "target_id": str(target_id)},
            request=request,
        )
        return Response(ResearchOutcomeSerializer(outcome).data, status=status.HTTP_201_CREATED)

    def delete(self, request, slug, outcome_id, link_id=None):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        outcome, error = visible_outcome(request, workspace, outcome_id)
        if error:
            return error
        profile = research_project(workspace, outcome.project_id)
        if not can_manage_outcomes(request.user, workspace, profile):
            return research_permission_denied()
        link = ResearchOutcomeLink.objects.filter(pk=link_id, outcome=outcome).first()
        if link is None:
            return research_not_found(ResearchErrorCode.OUTCOME_TARGET_NOT_FOUND, "Link not found.")
        link.deleted_at = timezone.now()
        link.save(update_fields=["deleted_at", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResearchChainExportEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/projects/<project_id>/chain/export/``"""

    def get(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        profile = research_project(workspace, project_id)
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        progress = build_progress(workspace, project_id, request.user)
        markdown = build_chain_markdown(
            progress,
            profile.project.name,
            generated_by=getattr(request.user, "display_name", ""),
        )
        response = HttpResponse(markdown, content_type="text/markdown")
        file_name = f"research-chain-{profile.project.identifier or project_id}-{timezone.localdate():%Y%m%d}.md"
        response["Content-Disposition"] = f'attachment; filename="{file_name}"'
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.CHAIN_EXPORT,
            resource_type=ResearchResourceType.PROJECT_PROFILE,
            resource_id=project_id,
            actor=request.user,
            metadata={"file_name": file_name},
            request=request,
        )
        return response
