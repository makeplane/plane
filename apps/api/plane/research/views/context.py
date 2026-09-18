# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Versioned, permission-scoped research context for downstream AI clients."""

from uuid import UUID

from django.core.paginator import Paginator
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.api.middleware.api_authentication import APIKeyAuthentication
from plane.authentication.session import BaseSessionAuthentication
from plane.db.models import (
    CodeArtifact,
    ExperimentRecord,
    ExternalReferenceLink,
    LiteratureEntry,
    PeriodicReport,
    ResearchOutcome,
    ResearchStageInstance,
    StageMaterial,
    StageReview,
    StageTransition,
)
from plane.research.utils.acl import build_actor_context, check_access
from plane.research.utils.audit import ResearchAuditAction, ResearchResourceType, record_audit_event
from plane.research.utils.capabilities import NAV_PROJECTS
from plane.research.utils.errors import ResearchErrorCode, research_error, research_not_found
from plane.research.utils.integrations import reference_allowed
from plane.research.utils.literature import literature_resource
from plane.research.utils.reports import report_resource
from plane.research.utils.resource_projections import experiment_resource, outcome_resource, repository_resource
from plane.research.utils.stages import default_stage_visibility, material_resource, stage_resource
from plane.research.views.base import ResearchAPIView
from plane.research.views.projects import visible_profile_queryset

SCHEMA_VERSION = "2026-09-18"
DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 100
FORMAL_MATERIAL_STATUSES = frozenset(
    (StageMaterial.Status.SUBMITTED, StageMaterial.Status.ACCEPTED, StageMaterial.Status.REJECTED)
)


def _resource_entry(
    *,
    kind,
    resource_id,
    title,
    resource_status,
    owner,
    project,
    updated_at,
    version=None,
    source="plane",
):
    return {
        "kind": kind,
        "id": str(resource_id) if resource_id else None,
        "title": title,
        "status": resource_status,
        "owner": str(owner) if owner else None,
        "project": str(project),
        "source": source,
        "updated_at": updated_at.isoformat() if hasattr(updated_at, "isoformat") else updated_at,
        "version": version,
        "link": None,
    }


def build_context_resources(workspace, profiles, actor):
    """Load all resource kinds in fixed-size batches for one project page."""
    profiles = list(profiles)
    if not profiles:
        return []
    project_ids = [profile.project_id for profile in profiles]
    owner_ids = {profile.project_id: profile.owner_id for profile in profiles}
    context = build_actor_context(actor, workspace.id)
    resources = []
    target_projects = {profile.project_id: profile.project_id for profile in profiles}

    for profile in profiles:
        resources.append(
            _resource_entry(
                kind="project",
                resource_id=profile.project_id,
                title=profile.project.name,
                resource_status=profile.workflow_status,
                owner=profile.owner_id,
                project=profile.project_id,
                updated_at=profile.updated_at,
            )
        )

    stage_visibility = default_stage_visibility(workspace)
    stages = list(
        ResearchStageInstance.objects.filter(
            workspace=workspace,
            project_id__in=project_ids,
            deleted_at__isnull=True,
        )
        .select_related("project__research_profile", "org_unit")
        .prefetch_related("transitions", "reviews")
    )
    visible_stage_ids = set()
    for instance in stages:
        if not check_access(
            actor,
            "view",
            stage_resource(
                instance,
                owner_id=owner_ids[instance.project_id],
                visibility=stage_visibility,
            ),
            context=context,
        ):
            continue
        visible_stage_ids.add(instance.id)
        target_projects[instance.id] = instance.project_id
        for transition in instance.transitions.all():
            target_projects[transition.id] = instance.project_id
            resources.append(
                _resource_entry(
                    kind="stage_transition",
                    resource_id=transition.id,
                    title=f"{instance.stage} {transition.action}",
                    resource_status=transition.to_status,
                    owner=transition.actor_id,
                    project=instance.project_id,
                    updated_at=transition.created_at,
                )
            )
        for review in instance.reviews.all():
            target_projects[review.id] = instance.project_id
            resources.append(
                _resource_entry(
                    kind="stage_review",
                    resource_id=review.id,
                    title=f"{instance.stage} review {review.recommendation}",
                    resource_status=review.recommendation,
                    owner=review.reviewer_id,
                    project=instance.project_id,
                    updated_at=review.submitted_at or review.created_at,
                )
            )

    materials = list(
        StageMaterial.objects.filter(
            stage_instance_id__in=visible_stage_ids,
            deleted_at__isnull=True,
        )
        .select_related("stage_instance__project__research_profile", "page")
        .prefetch_related("versions")
    )
    for material in materials:
        if not check_access(
            actor,
            "view",
            material_resource(
                material,
                owner_id=owner_ids[material.stage_instance.project_id],
            ),
            context=context,
        ):
            continue
        target_projects[material.id] = material.stage_instance.project_id
        formal_versions = [
            version for version in material.versions.all() if version.snapshot.get("status") in FORMAL_MATERIAL_STATUSES
        ]
        resources.append(
            _resource_entry(
                kind="stage_material",
                resource_id=material.id,
                title=material.page.name if material.page else material.material_type,
                resource_status=material.status,
                owner=material.owner_id,
                project=material.stage_instance.project_id,
                updated_at=material.updated_at,
                version=max((version.version_no for version in formal_versions), default=None),
            )
        )

    literature = list(
        LiteratureEntry.objects.filter(
            workspace=workspace,
            project_id__in=project_ids,
            deleted_at__isnull=True,
        ).select_related("project__research_profile")
    )
    for entry in literature:
        if check_access(actor, "view", literature_resource(entry), context=context):
            target_projects[entry.id] = entry.project_id
            resources.append(
                _resource_entry(
                    kind="literature",
                    resource_id=entry.id,
                    title=entry.title,
                    resource_status=entry.status,
                    owner=entry.owner_id,
                    project=entry.project_id,
                    updated_at=entry.updated_at,
                )
            )

    experiments = list(
        ExperimentRecord.objects.filter(
            workspace=workspace,
            project_id__in=project_ids,
            deleted_at__isnull=True,
        )
        .select_related("stage_instance", "project__research_profile")
        .prefetch_related("versions")
    )
    for record in experiments:
        if check_access(actor, "view", experiment_resource(record), context=context):
            target_projects[record.id] = record.project_id
            resources.append(
                _resource_entry(
                    kind="experiment",
                    resource_id=record.id,
                    title=f"#{record.sequence_no} {record.title}",
                    resource_status=record.status,
                    owner=record.owner_id,
                    project=record.project_id,
                    updated_at=record.updated_at,
                    version=max((version.version_no for version in record.versions.all()), default=None),
                )
            )

    artifacts = list(
        CodeArtifact.objects.filter(
            repository__workspace=workspace,
            repository__project_id__in=project_ids,
            deleted_at__isnull=True,
        ).select_related("repository__project__research_profile")
    )
    for artifact in artifacts:
        if check_access(actor, "view", repository_resource(artifact.repository), context=context):
            resources.append(
                _resource_entry(
                    kind="code_artifact",
                    resource_id=artifact.id,
                    title=f"{artifact.ref_type} {artifact.ref_value}",
                    resource_status=artifact.ref_type,
                    owner=artifact.created_by_id,
                    project=artifact.repository.project_id,
                    updated_at=artifact.committed_at or artifact.updated_at,
                )
            )

    reports = list(
        PeriodicReport.objects.filter(
            Q(project_id__in=project_ids) | Q(team_projects__id__in=project_ids),
            workspace=workspace,
            deleted_at__isnull=True,
        )
        .select_related("page")
        .prefetch_related("team_projects", "official_snapshots", "access_grants")
        .distinct()
    )
    for report in reports:
        project_id = report.project_id or next(
            (project.id for project in report.team_projects.all() if project.id in project_ids),
            None,
        )
        if project_id is None:
            continue
        if check_access(actor, "view", report_resource(report), context=context):
            target_projects[report.id] = project_id
            resources.append(
                _resource_entry(
                    kind="report",
                    resource_id=report.id,
                    title=f"{report.report_type} {report.period_key}",
                    resource_status=report.status,
                    owner=report.owner_id,
                    project=project_id,
                    updated_at=report.updated_at,
                    version=max(
                        (snapshot.version_no for snapshot in report.official_snapshots.all()),
                        default=None,
                    ),
                )
            )

    outcomes = list(
        ResearchOutcome.objects.filter(
            workspace=workspace,
            project_id__in=project_ids,
            deleted_at__isnull=True,
        ).select_related("project__research_profile")
    )
    for outcome in outcomes:
        if check_access(actor, "view", outcome_resource(outcome), context=context):
            target_projects[outcome.id] = outcome.project_id
            resources.append(
                _resource_entry(
                    kind="outcome",
                    resource_id=outcome.id,
                    title=outcome.title,
                    resource_status=outcome.status,
                    owner=outcome.created_by_id,
                    project=outcome.project_id,
                    updated_at=outcome.updated_at,
                )
            )

    links = list(
        ExternalReferenceLink.objects.filter(
            reference__workspace=workspace,
            target_id__in=target_projects.keys(),
            deleted_at__isnull=True,
        ).select_related("reference")
    )
    seen_references = set()
    for link in links:
        reference = link.reference
        project_id = target_projects.get(link.target_id)
        if (
            reference.id in seen_references
            or project_id is None
            or not reference_allowed(reference, actor, workspace.id, context=context)
        ):
            continue
        seen_references.add(reference.id)
        resources.append(
            _resource_entry(
                kind="external_reference",
                resource_id=reference.id,
                title=reference.title,
                resource_status=reference.status,
                owner=None,
                project=project_id,
                updated_at=reference.synced_at or reference.updated_at,
                source=reference.system,
            )
        )
        resources[-1]["link"] = reference.source_url

    for resource in resources:
        if resource["kind"] != "external_reference":
            resource["link"] = (
                f"/api/research/workspaces/{workspace.slug}/context/resources/{resource['kind']}/{resource['id']}/"
            )
    resources.sort(key=lambda item: (item["project"], item["kind"], item["updated_at"] or "", item["id"] or ""))
    return resources


def _context_not_found():
    return research_not_found(ResearchErrorCode.CONTEXT_RESOURCE_NOT_FOUND, "Context resource not found.")


def _parse_resource_version(raw_version):
    value = str(raw_version or "latest").strip().lower()
    if value in ("latest", "draft"):
        return value, None
    try:
        version = int(value)
    except (TypeError, ValueError):
        version = 0
    if version < 1:
        return None, research_error(
            ResearchErrorCode.CONTEXT_VERSION_INVALID,
            "version must be latest, draft, or a positive integer.",
        )
    return version, None


def _resource_response(kind, resource_id, version, resource_status, updated_at, *, source="plane", link=None):
    """Return metadata only; context endpoints never expose resource bodies."""
    return Response(
        {
            "schema_version": SCHEMA_VERSION,
            "kind": kind,
            "id": str(resource_id),
            "source": source,
            "version": version,
            "status": resource_status,
            "updated_at": updated_at.isoformat() if hasattr(updated_at, "isoformat") else updated_at,
            "link": link,
        },
        status=status.HTTP_200_OK,
    )


class ContextAuthenticationMixin:
    authentication_classes = [BaseSessionAuthentication, APIKeyAuthentication]
    nav_capability = NAV_PROJECTS


class ResearchContextEndpoint(ContextAuthenticationMixin, ResearchAPIView):
    """Return ACL-filtered resource references without business mutations."""

    def get(self, request, slug):
        workspace, error = self.get_workspace()
        if error:
            return error

        project_id = request.GET.get("project_id")
        if project_id:
            try:
                project_id = UUID(str(project_id))
            except (TypeError, ValueError):
                return research_error(ResearchErrorCode.CONTEXT_RESOURCE_INVALID, "project_id must be a valid UUID.")
        profiles = visible_profile_queryset(workspace, request.user).filter(deleted_at__isnull=True)
        if project_id:
            profiles = profiles.filter(project_id=project_id)
        profiles = profiles.order_by("project_id")

        try:
            page = int(request.GET.get("page", 1))
            page_size = int(request.GET.get("page_size", DEFAULT_PAGE_SIZE))
        except (TypeError, ValueError):
            page = page_size = 0
        if page < 1 or page_size < 1 or page_size > MAX_PAGE_SIZE:
            return research_error(
                "invalid_pagination",
                f"page must be positive and page_size must be between 1 and {MAX_PAGE_SIZE}.",
            )

        paginator = Paginator(profiles, page_size)
        profile_page = paginator.get_page(page)
        resources = build_context_resources(workspace, profile_page.object_list, request.user)
        payload = {
            "schema_version": SCHEMA_VERSION,
            "generated_at": timezone.now().isoformat(),
            "workspace": {"id": str(workspace.id), "slug": workspace.slug, "name": workspace.name},
            "scope": {
                "actor": str(request.user.id),
                "project_id": str(project_id) if project_id else None,
                "business_records_mutated": False,
            },
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": paginator.count,
                "has_more": profile_page.has_next(),
            },
            "resources": resources,
        }
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.CONTEXT_READ,
            resource_type=ResearchResourceType.CONTEXT,
            resource_id=project_id,
            actor=request.user,
            metadata={"project_filter": bool(project_id), "resource_count": len(resources), "mode": "index"},
            request=request,
        )
        return Response(payload, status=status.HTTP_200_OK)


class ResearchContextResourceEndpoint(ContextAuthenticationMixin, ResearchAPIView):
    """Return one authorised resource reference without exposing its body."""

    def get(self, request, slug, kind, resource_id):
        workspace, error = self.get_workspace()
        if error:
            return error
        try:
            resource_id = UUID(str(resource_id))
        except (TypeError, ValueError):
            return research_error(ResearchErrorCode.CONTEXT_RESOURCE_INVALID, "resource id must be a valid UUID.")
        requested_version, error = _parse_resource_version(request.GET.get("version"))
        if error:
            return error

        context = build_actor_context(request.user, workspace.id)
        response = self._resolve(workspace, request.user, context, kind, resource_id, requested_version)
        if response.status_code != status.HTTP_200_OK:
            return response
        response.data["link"] = (
            f"/api/research/workspaces/{workspace.slug}/context/resources/{kind}/{resource_id}/"
        )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.CONTEXT_READ,
            resource_type=ResearchResourceType.CONTEXT,
            resource_id=resource_id,
            actor=request.user,
            metadata={"kind": kind, "version": response.data["version"], "mode": "resource"},
            request=request,
        )
        return response

    def _resolve(self, workspace, actor, context, kind, resource_id, version):
        if kind == "external_reference" or version == "draft":
            return _context_not_found()
        resolver = getattr(self, f"_resolve_{kind}", None)
        return resolver(workspace, actor, context, resource_id, version) if resolver else _context_not_found()

    def _resolve_project(self, workspace, actor, context, resource_id, version):
        if version != "latest":
            return _context_not_found()
        profile = visible_profile_queryset(workspace, actor).filter(project_id=resource_id).first()
        if profile is None:
            return _context_not_found()
        return _resource_response("project", profile.project_id, None, profile.workflow_status, profile.updated_at)

    def _resolve_report(self, workspace, actor, context, resource_id, version):
        report = (
            PeriodicReport.objects.filter(workspace=workspace, pk=resource_id, deleted_at__isnull=True)
            .select_related("page")
            .prefetch_related("official_snapshots", "access_grants")
            .first()
        )
        if report is None:
            return _context_not_found()
        if not check_access(actor, "view", report_resource(report), context=context):
            return _context_not_found()
        snapshots = list(report.official_snapshots.all())
        snapshot = (
            max(snapshots, key=lambda item: item.version_no)
            if version == "latest" and snapshots
            else next((item for item in snapshots if item.version_no == version), None)
        )
        if snapshot is None:
            return _context_not_found()
        return _resource_response(
            "report", report.id, snapshot.version_no, snapshot.snapshot_status, snapshot.created_at
        )

    def _resolve_stage_material(self, workspace, actor, context, resource_id, version):
        material = (
            StageMaterial.objects.filter(
                pk=resource_id,
                stage_instance__workspace=workspace,
                deleted_at__isnull=True,
            )
            .select_related("page", "stage_instance__project__research_profile")
            .prefetch_related("versions")
            .first()
        )
        if material is None:
            return _context_not_found()
        if not check_access(actor, "view", material_resource(material), context=context):
            return _context_not_found()
        versions = [item for item in material.versions.all() if item.snapshot.get("status") in FORMAL_MATERIAL_STATUSES]
        material_version = (
            max(versions, key=lambda item: item.version_no)
            if version == "latest" and versions
            else next((item for item in versions if item.version_no == version), None)
        )
        if material_version is None:
            return _context_not_found()
        return _resource_response(
            "stage_material",
            material.id,
            material_version.version_no,
            material_version.snapshot.get("status", material.status),
            material_version.created_at,
        )

    def _resolve_experiment(self, workspace, actor, context, resource_id, version):
        record = (
            ExperimentRecord.objects.filter(workspace=workspace, pk=resource_id, deleted_at__isnull=True)
            .select_related("stage_instance", "project__research_profile")
            .prefetch_related("versions")
            .first()
        )
        if record is None:
            return _context_not_found()
        if not check_access(actor, "view", experiment_resource(record), context=context):
            return _context_not_found()
        versions = list(record.versions.all())
        experiment_version = (
            max(versions, key=lambda item: item.version_no)
            if version == "latest" and versions
            else next((item for item in versions if item.version_no == version), None)
        )
        if experiment_version is None:
            return _context_not_found()
        return _resource_response(
            "experiment",
            record.id,
            experiment_version.version_no,
            experiment_version.snapshot.get("status", record.status),
            experiment_version.created_at,
        )

    def _resolve_literature(self, workspace, actor, context, resource_id, version):
        entry = (
            LiteratureEntry.objects.filter(workspace=workspace, pk=resource_id, deleted_at__isnull=True)
            .select_related("project__research_profile")
            .first()
        )
        if entry is None:
            return _context_not_found()
        if version != "latest" or entry.status != LiteratureEntry.Status.INCLUDED:
            return _context_not_found()
        if not check_access(actor, "view", literature_resource(entry), context=context):
            return _context_not_found()
        return _resource_response(
            "literature",
            entry.id,
            None,
            entry.status,
            entry.updated_at,
        )

    def _resolve_outcome(self, workspace, actor, context, resource_id, version):
        outcome = (
            ResearchOutcome.objects.filter(workspace=workspace, pk=resource_id, deleted_at__isnull=True)
            .select_related("project__research_profile")
            .first()
        )
        if outcome is None:
            return _context_not_found()
        if version != "latest" or outcome.status == ResearchOutcome.Status.DRAFT:
            return _context_not_found()
        if not check_access(actor, "view", outcome_resource(outcome), context=context):
            return _context_not_found()
        return _resource_response(
            "outcome",
            outcome.id,
            None,
            outcome.status,
            outcome.updated_at,
        )

    def _resolve_code_artifact(self, workspace, actor, context, resource_id, version):
        if version != "latest":
            return _context_not_found()
        artifact = (
            CodeArtifact.objects.filter(
                pk=resource_id,
                repository__workspace=workspace,
                deleted_at__isnull=True,
            )
            .select_related("repository__project__research_profile")
            .first()
        )
        if artifact is None or not check_access(
            actor,
            "view",
            repository_resource(artifact.repository),
            context=context,
        ):
            return _context_not_found()
        return _resource_response(
            "code_artifact",
            artifact.id,
            None,
            artifact.ref_type,
            artifact.committed_at or artifact.updated_at,
        )

    def _resolve_stage_transition(self, workspace, actor, context, resource_id, version):
        if version != "latest":
            return _context_not_found()
        transition = (
            StageTransition.objects.filter(pk=resource_id, stage_instance__workspace=workspace)
            .select_related("stage_instance__workspace", "stage_instance__project__research_profile")
            .first()
        )
        if transition is None or not check_access(
            actor,
            "view",
            stage_resource(transition.stage_instance),
            context=context,
        ):
            return _context_not_found()
        return _resource_response(
            "stage_transition", transition.id, None, transition.to_status, transition.created_at
        )

    def _resolve_stage_review(self, workspace, actor, context, resource_id, version):
        if version != "latest":
            return _context_not_found()
        review = (
            StageReview.objects.filter(
                pk=resource_id,
                stage_instance__workspace=workspace,
                deleted_at__isnull=True,
            )
            .select_related("stage_instance__workspace", "stage_instance__project__research_profile")
            .first()
        )
        if review is None or not check_access(
            actor,
            "view",
            stage_resource(review.stage_instance, with_reviewers=True),
            context=context,
        ):
            return _context_not_found()
        return _resource_response(
            "stage_review", review.id, None, review.recommendation, review.submitted_at or review.created_at
        )
