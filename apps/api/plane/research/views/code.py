# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Code repository, artifact and snapshot endpoints (§5.6)."""

import uuid

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    CodeArtifact,
    ExperimentRecord,
    FileAsset,
    ProjectCodeRepository,
    ResearchProjectProfile,
)
from plane.research.serializers import CodeArtifactSerializer, ProjectCodeRepositorySerializer
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
    can_manage_authored_team_content,
    can_manage_team_content,
    delegated_change_metadata,
    is_active_team_project_member,
)
from plane.research.utils.resource_projections import repository_resource
from plane.research.utils.settings import get_workspace_research_settings
from plane.research.views.base import ResearchAPIView
from plane.research.views.projects import can_read_project_research_metadata
from plane.settings.storage import S3Storage

SECTION = "code"


def research_project(workspace, project_id):
    return ResearchProjectProfile.objects.filter(workspace=workspace, project_id=project_id).first()


def can_manage_code(actor, workspace, profile) -> bool:
    return bool(profile and profile.owner_id == actor.id)


def can_manage_repository(actor, workspace, profile, repository) -> bool:
    return can_manage_code(actor, workspace, profile) or can_manage_team_content(actor, profile, repository)


def can_manage_artifact(actor, workspace, profile, artifact) -> bool:
    return can_manage_code(actor, workspace, profile) or can_manage_team_content(actor, profile, artifact)


def visible_repository(request, workspace, repository_id, *, allow_team_member=False):
    repository = ProjectCodeRepository.objects.filter(
        workspace=workspace, pk=repository_id, deleted_at__isnull=True
    ).select_related("project__research_profile").first()
    if repository is None:
        return None, research_not_found(ResearchErrorCode.CODE_REPOSITORY_NOT_FOUND, "Repository not found.")
    context = build_actor_context(request.user, workspace.id)
    profile = repository.project.research_profile
    has_access = check_access(request.user, "view", repository_resource(repository), context=context)
    if not has_access and can_manage_team_content(request.user, profile, repository):
        has_access = True
    if not has_access and can_manage_authored_team_content(request.user, profile, repository):
        has_access = True
    if not has_access and allow_team_member and is_active_team_project_member(request.user, profile):
        has_access = True
    if not has_access:
        return None, research_not_found(ResearchErrorCode.CODE_REPOSITORY_NOT_FOUND, "Repository not found.")
    return repository, None


class ResearchCodeRepositoryListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/projects/<project_id>/code-repositories/``"""

    def get(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        if research_project(workspace, project_id) is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        query = ProjectCodeRepository.objects.filter(
            workspace=workspace, project_id=project_id, deleted_at__isnull=True
        ).select_related("project__research_profile")
        if request.GET.get("status"):
            query = query.filter(status=str(request.GET["status"]).upper())
        context = build_actor_context(request.user, workspace.id)
        repositories = [
            repository
            for repository in query.order_by("-created_at")[:200]
            if check_access(request.user, "view", repository_resource(repository), context=context)
            or can_manage_authored_team_content(
                request.user, repository.project.research_profile, repository
            )
        ]
        payload = []
        for repository in repositories:
            data = ProjectCodeRepositorySerializer(repository).data
            data["artifact_count"] = repository.artifacts.filter(deleted_at__isnull=True).count()
            payload.append(data)
        return Response({"results": payload, "count": len(payload)}, status=status.HTTP_200_OK)

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

        repository_url = str(request.data.get("repository_url") or "").strip()
        if not repository_url:
            return research_error(
                ResearchErrorCode.CODE_REPOSITORY_INVALID,
                "repository_url is required.",
            )
        provider = str(request.data.get("provider") or "GITHUB").upper()
        if provider not in ProjectCodeRepository.Provider.values:
            return research_error(ResearchErrorCode.CODE_REPOSITORY_INVALID, "Unknown provider.")
        visibility = str(request.data.get("visibility") or "INTERNAL").upper()
        if visibility not in ProjectCodeRepository.Visibility.values:
            visibility = ProjectCodeRepository.Visibility.PRIVATE.value
        try:
            with transaction.atomic():
                repository = ProjectCodeRepository.objects.create(
                    workspace=workspace,
                    project_id=project_id,
                    provider=provider,
                    repository_url=repository_url,
                    repository_slug=str(request.data.get("repository_slug") or ""),
                    default_branch=str(request.data.get("default_branch") or "main"),
                    visibility=visibility,
                    credential_ref=str(request.data.get("credential_ref") or ""),
                    created_by=request.user,
                )
        except IntegrityError:
            return research_conflict(
                ResearchErrorCode.CODE_REPOSITORY_EXISTS,
                "This repository is already registered for the project.",
            )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.CODE_REPOSITORY_CREATE,
            resource_type=ResearchResourceType.CODE_REPOSITORY,
            resource_id=repository.id,
            org_unit=profile.org_unit,
            actor=request.user,
            metadata={"provider": provider, "has_credential": bool(repository.credential_ref)},
            request=request,
        )
        return Response(ProjectCodeRepositorySerializer(repository).data, status=status.HTTP_201_CREATED)


class ResearchCodeRepositoryDetailEndpoint(ResearchAPIView):
    """``GET``/``PATCH``/``DELETE`` on ``/code-repositories/<repository_id>/``"""

    def get(self, request, slug, repository_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        repository, error = visible_repository(request, workspace, repository_id)
        if error:
            return error
        data = ProjectCodeRepositorySerializer(repository).data
        data["artifacts"] = CodeArtifactSerializer(
            repository.artifacts.filter(deleted_at__isnull=True).select_related("linked_experiment"),
            many=True,
        ).data
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request, slug, repository_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        repository, error = visible_repository(request, workspace, repository_id)
        if error:
            return error
        profile = research_project(workspace, repository.project_id)
        if not can_manage_repository(request.user, workspace, profile, repository):
            return research_permission_denied()
        changed_fields = sorted(
            {
                "repository_slug",
                "default_branch",
                "visibility",
                "credential_ref",
                "status",
            }.intersection(request.data.keys())
        )
        redacted_fields = {"credential_ref"}
        before = audit_field_snapshot(
            repository,
            changed_fields,
            redacted_fields=redacted_fields,
        )
        for field in ("repository_slug", "default_branch"):
            if field in request.data:
                setattr(repository, field, str(request.data.get(field) or ""))
        if "visibility" in request.data:
            visibility = str(request.data.get("visibility") or "").upper()
            if visibility in ProjectCodeRepository.Visibility.values:
                repository.visibility = visibility
        credential_changed = False
        if "credential_ref" in request.data:
            repository.credential_ref = str(request.data.get("credential_ref") or "")
            credential_changed = True
        if "status" in request.data:
            target = str(request.data.get("status") or "").upper()
            if target in ProjectCodeRepository.Status.values:
                repository.status = target
        repository.save()
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.CODE_CREDENTIAL_UPDATE
            if credential_changed
            else ResearchAuditAction.CODE_REPOSITORY_UPDATE,
            resource_type=ResearchResourceType.CODE_REPOSITORY,
            resource_id=repository.id,
            actor=request.user,
            metadata=delegated_change_metadata(
                request.user,
                repository,
                changed_fields,
                before,
                redacted_fields=redacted_fields,
                credential_changed=credential_changed,
            ),
            request=request,
        )
        return Response(ProjectCodeRepositorySerializer(repository).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, repository_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        repository, error = visible_repository(request, workspace, repository_id)
        if error:
            return error
        profile = research_project(workspace, repository.project_id)
        if not can_manage_repository(request.user, workspace, profile, repository):
            return research_permission_denied()
        repository.status = ProjectCodeRepository.Status.ARCHIVED
        repository.deleted_at = timezone.now()
        repository.save(update_fields=["status", "deleted_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.CODE_REPOSITORY_ARCHIVE,
            resource_type=ResearchResourceType.CODE_REPOSITORY,
            resource_id=repository.id,
            actor=request.user,
            metadata={"repository_url": repository.repository_url},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResearchCodeRepositorySyncEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/code-repositories/<repository_id>/sync/``

    A failed sync never raises: the repository keeps its last good data and is
    flagged ``SYNC_FAILED`` with a reason (P1-CODE-09).
    """

    def post(self, request, slug, repository_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        repository, error = visible_repository(request, workspace, repository_id)
        if error:
            return error
        profile = research_project(workspace, repository.project_id)
        if not can_manage_repository(request.user, workspace, profile, repository):
            return research_permission_denied()

        head = str(request.data.get("head") or "").strip()
        failure = _sync_repository(repository, head=head)
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.CODE_SYNC,
            resource_type=ResearchResourceType.CODE_REPOSITORY,
            resource_id=repository.id,
            actor=request.user,
            metadata={"status": repository.status, "error": repository.sync_error},
            request=request,
        )
        data = ProjectCodeRepositorySerializer(repository).data
        data["degraded"] = bool(failure)
        data["degraded_reason"] = failure or ""
        return Response(data, status=status.HTTP_200_OK)


def _sync_repository(repository, head=""):
    """Best effort metadata sync; never blocks and never raises."""
    from django.conf import settings

    if not repository.repository_url.startswith(("http://", "https://")):
        repository.status = ProjectCodeRepository.Status.SYNC_FAILED
        repository.sync_error = "unsupported_repository_url"
        repository.last_sync_at = timezone.now()
        repository.save(update_fields=["status", "sync_error", "last_sync_at", "updated_at"])
        return "unsupported_repository_url"
    try:
        import httpx

        timeout = float(getattr(settings, "RESEARCH_INTEGRATION_TIMEOUT_SECONDS", 3))
        response = httpx.head(repository.repository_url, timeout=timeout, follow_redirects=True)
        if response.status_code >= 400:
            raise RuntimeError(f"http_{response.status_code}")
    except Exception as exc:  # pragma: no cover - network dependent
        repository.status = ProjectCodeRepository.Status.SYNC_FAILED
        repository.sync_error = str(exc)[:255]
        repository.last_sync_at = timezone.now()
        repository.save(update_fields=["status", "sync_error", "last_sync_at", "updated_at"])
        return repository.sync_error

    repository.status = ProjectCodeRepository.Status.ACTIVE
    repository.sync_error = ""
    repository.last_sync_at = timezone.now()
    if head:
        repository.last_synced_commit = head[:64]
    repository.save(
        update_fields=["status", "sync_error", "last_sync_at", "last_synced_commit", "updated_at"]
    )
    return ""


class ResearchCodeArtifactListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/code-repositories/<repository_id>/artifacts/``"""

    def get(self, request, slug, repository_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        repository, error = visible_repository(
            request, workspace, repository_id, allow_team_member=True
        )
        if error:
            return error
        query = repository.artifacts.filter(deleted_at__isnull=True).select_related("linked_experiment")
        if request.GET.get("ref_type"):
            query = query.filter(ref_type=str(request.GET["ref_type"]).upper())
        profile = repository.project.research_profile
        context = build_actor_context(request.user, workspace.id)
        artifacts = [
            artifact
            for artifact in query.order_by("-created_at")[:200]
            if check_access(
                request.user, "view", repository_resource(repository), context=context
            )
            or can_manage_authored_team_content(request.user, profile, artifact)
        ]
        return Response(
            {"results": CodeArtifactSerializer(artifacts, many=True).data, "count": len(artifacts)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug, repository_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        repository, error = visible_repository(
            request, workspace, repository_id, allow_team_member=True
        )
        if error:
            return error
        profile = research_project(workspace, repository.project_id)
        if not can_create_research_content(request.user, workspace, profile):
            return research_permission_denied()
        ref_type = str(request.data.get("ref_type") or "").upper()
        if ref_type not in CodeArtifact.RefType.values:
            return research_error(ResearchErrorCode.CODE_ARTIFACT_INVALID, "Unknown artifact type.")
        ref_value = str(request.data.get("ref_value") or "").strip()
        if not ref_value:
            return research_error(ResearchErrorCode.CODE_ARTIFACT_INVALID, "ref_value is required.")
        if ref_type == CodeArtifact.RefType.SNAPSHOT.value:
            return research_error(
                ResearchErrorCode.CODE_ARTIFACT_INVALID,
                "Snapshots are registered through the snapshots endpoint.",
            )
        linked_experiment = None
        if request.data.get("linked_experiment"):
            linked_experiment = ExperimentRecord.objects.filter(
                pk=request.data["linked_experiment"], project_id=repository.project_id, deleted_at__isnull=True
            ).first()
            if linked_experiment is None:
                return research_not_found(ResearchErrorCode.EXPERIMENT_NOT_FOUND, "Experiment not found.")
        try:
            with transaction.atomic():
                artifact = CodeArtifact.objects.create(
                    repository=repository,
                    ref_type=ref_type,
                    ref_value=ref_value,
                    commit_message=str(request.data.get("commit_message") or ""),
                    author_name=str(request.data.get("author_name") or ""),
                    committed_at=request.data.get("committed_at") or None,
                    linked_experiment=linked_experiment,
                    description=str(request.data.get("description") or ""),
                    created_by=request.user,
                )
        except IntegrityError:
            return research_conflict(
                ResearchErrorCode.CODE_ARTIFACT_EXISTS,
                "This reference is already registered for the repository.",
            )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.CODE_ARTIFACT_CREATE,
            resource_type=ResearchResourceType.CODE_ARTIFACT,
            resource_id=artifact.id,
            actor=request.user,
            metadata={
                "ref_type": ref_type,
                "ref_value": ref_value,
                "experiment": str(linked_experiment.id) if linked_experiment else None,
            },
            request=request,
        )
        return Response(CodeArtifactSerializer(artifact).data, status=status.HTTP_201_CREATED)


class ResearchCodeSnapshotEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/code-repositories/<repository_id>/snapshots/``

    Snapshot uploads use their own size limit (default 500MB) through the shared
    presigned upload path (P1-CODE-04).
    """

    def post(self, request, slug, repository_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        repository, error = visible_repository(
            request, workspace, repository_id, allow_team_member=True
        )
        if error:
            return error
        profile = research_project(workspace, repository.project_id)
        if not can_create_research_content(request.user, workspace, profile):
            return research_permission_denied()

        limits = get_workspace_research_settings(workspace)
        max_bytes = int(limits.get("code_snapshot_max_mb", 500)) * 1024 * 1024
        if str(request.data.get("mode") or "").lower() == "presign":
            file_name = str(request.data.get("file_name") or "").strip()
            content_type = str(request.data.get("content_type") or "application/zip")
            try:
                size = int(request.data.get("size") or 0)
            except (TypeError, ValueError):
                size = 0
            if not file_name or size <= 0 or size > max_bytes:
                return research_error(
                    ResearchErrorCode.FILE_SIZE_EXCEEDED,
                    "The snapshot exceeds the configured limit.",
                    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                )
            asset_key = f"{workspace.id}/research/code/{repository.id}/{uuid.uuid4().hex}-{file_name}"
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
                {"upload_data": presigned, "asset_id": str(asset.id), "max_bytes": max_bytes},
                status=status.HTTP_200_OK,
            )

        asset_id = request.data.get("asset_id")
        ref_value = str(request.data.get("ref_value") or "").strip()
        if not asset_id or not ref_value:
            return research_error(
                ResearchErrorCode.CODE_ARTIFACT_INVALID,
                "asset_id and ref_value are required.",
            )
        asset = FileAsset.objects.filter(pk=asset_id, workspace=workspace).first()
        if asset is None:
            return research_not_found(ResearchErrorCode.ATTACHMENT_NOT_FOUND, "The uploaded asset was not found.")
        if asset.size and asset.size > max_bytes:
            return research_error(
                ResearchErrorCode.FILE_SIZE_EXCEEDED,
                "The snapshot exceeds the configured limit.",
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
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
        try:
            with transaction.atomic():
                artifact = CodeArtifact.objects.create(
                    repository=repository,
                    ref_type=CodeArtifact.RefType.SNAPSHOT,
                    ref_value=ref_value,
                    snapshot_asset=asset,
                    description=str(request.data.get("description") or ""),
                    created_by=request.user,
                )
        except IntegrityError:
            return research_conflict(
                ResearchErrorCode.CODE_ARTIFACT_EXISTS,
                "This snapshot reference already exists.",
            )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.CODE_SNAPSHOT_CREATE,
            resource_type=ResearchResourceType.CODE_ARTIFACT,
            resource_id=artifact.id,
            actor=request.user,
            metadata={"ref_value": ref_value, "asset": str(asset.id), "size": asset.size},
            request=request,
        )
        return Response(CodeArtifactSerializer(artifact).data, status=status.HTTP_201_CREATED)


class ResearchCodeArtifactDetailEndpoint(ResearchAPIView):
    """``GET``/``PATCH``/``DELETE /api/research/workspaces/<slug>/code-artifacts/<artifact_id>/``"""

    def _load(self, request, workspace, artifact_id):
        artifact = (
            CodeArtifact.objects.filter(
                pk=artifact_id, repository__workspace=workspace, deleted_at__isnull=True
            )
            .select_related("repository__project__research_profile", "linked_experiment")
            .first()
        )
        if artifact is None:
            return None, research_not_found(ResearchErrorCode.CODE_ARTIFACT_NOT_FOUND, "Artifact not found.")
        context = build_actor_context(request.user, workspace.id)
        has_access = check_access(
            request.user, "view", repository_resource(artifact.repository), context=context
        )
        profile = artifact.repository.project.research_profile
        if not has_access and can_manage_team_content(request.user, profile, artifact):
            has_access = True
        if not has_access:
            return None, research_not_found(ResearchErrorCode.CODE_ARTIFACT_NOT_FOUND, "Artifact not found.")
        return artifact, None

    def get(self, request, slug, artifact_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        artifact, error = self._load(request, workspace, artifact_id)
        if error:
            return error
        return Response(CodeArtifactSerializer(artifact).data, status=status.HTTP_200_OK)

    def patch(self, request, slug, artifact_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        artifact, error = self._load(request, workspace, artifact_id)
        if error:
            return error
        profile = research_project(workspace, artifact.repository.project_id)
        if not can_manage_artifact(request.user, workspace, profile, artifact):
            return research_permission_denied()
        changed_fields = sorted(
            {"linked_experiment", "description"}.intersection(request.data.keys())
        )
        before = audit_field_snapshot(artifact, changed_fields)
        if "linked_experiment" in request.data:
            experiment_id = request.data.get("linked_experiment")
            if not experiment_id:
                artifact.linked_experiment = None
            else:
                experiment = ExperimentRecord.objects.filter(
                    pk=experiment_id, project_id=artifact.repository.project_id, deleted_at__isnull=True
                ).first()
                if experiment is None:
                    return research_not_found(ResearchErrorCode.EXPERIMENT_NOT_FOUND, "Experiment not found.")
                artifact.linked_experiment = experiment
        if "description" in request.data:
            artifact.description = str(request.data.get("description") or "")
        artifact.save()
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.CODE_ARTIFACT_UPDATE,
            resource_type=ResearchResourceType.CODE_ARTIFACT,
            resource_id=artifact.id,
            actor=request.user,
            metadata=delegated_change_metadata(
                request.user,
                artifact,
                changed_fields,
                before,
            ),
            request=request,
        )
        return Response(CodeArtifactSerializer(artifact).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, artifact_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        artifact, error = self._load(request, workspace, artifact_id)
        if error:
            return error
        profile = research_project(workspace, artifact.repository.project_id)
        if not can_manage_artifact(request.user, workspace, profile, artifact):
            return research_permission_denied()
        artifact.deleted_at = timezone.now()
        artifact.save(update_fields=["deleted_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.CODE_ARTIFACT_UPDATE,
            resource_type=ResearchResourceType.CODE_ARTIFACT,
            resource_id=artifact.id,
            actor=request.user,
            metadata={"unlinked": True},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResearchCodeSummaryEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/projects/<project_id>/code-summary/``"""

    def get(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        profile = research_project(workspace, project_id)
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        repositories = list(
            ProjectCodeRepository.objects.filter(
                workspace=workspace, project_id=project_id, deleted_at__isnull=True
            )
        )
        artifact_query = CodeArtifact.objects.filter(
            repository__project_id=project_id, deleted_at__isnull=True
        )
        latest = artifact_query.filter(ref_type="COMMIT").order_by("-committed_at").first()
        return Response(
            {
                "project": str(project_id),
                "repository_count": len(repositories),
                "artifact_count": artifact_query.count(),
                "snapshot_count": artifact_query.filter(ref_type="SNAPSHOT").count(),
                "linked_experiment_count": artifact_query.filter(linked_experiment__isnull=False).count(),
                "sync_failed_count": sum(1 for repository in repositories if repository.status == "SYNC_FAILED"),
                "last_commit": {
                    "ref_value": latest.ref_value if latest else None,
                    "message": latest.commit_message if latest else None,
                    "author": latest.author_name if latest else None,
                    "committed_at": latest.committed_at if latest else None,
                },
                "snapshots": [
                    {
                        "id": str(artifact.id),
                        "ref_value": artifact.ref_value,
                        "created_at": artifact.created_at,
                    }
                    for artifact in artifact_query.filter(ref_type="SNAPSHOT").order_by("-created_at")[:10]
                ],
            },
            status=status.HTTP_200_OK,
        )
