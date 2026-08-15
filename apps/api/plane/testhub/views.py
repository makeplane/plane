# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Project
from plane.testhub.files import FileAccessError, resolve_repo_file
from plane.testhub.models import CatalogSnapshot, ProjectTestRepo, TesthubJob
from plane.testhub.serializers import (
    CatalogSnapshotSerializer,
    ProjectTestRepoSerializer,
    TesthubJobSerializer,
)
from plane.testhub.whitelist import WhitelistError, build_argv, is_destructive

ACTIVE_JOB_STATUSES = (TesthubJob.Status.QUEUED, TesthubJob.Status.RUNNING)


def _project(slug: str, project_id):
    return Project.objects.get(pk=project_id, workspace__slug=slug)


class ProjectTestRepoEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        repo = ProjectTestRepo.objects.filter(project_id=project_id).first()
        if repo is None:
            return Response({"repo": None}, status=status.HTTP_200_OK)
        return Response({"repo": ProjectTestRepoSerializer(repo).data}, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def put(self, request, slug, project_id):
        project = _project(slug, project_id)
        defaults = {
            "workspace_id": project.workspace_id,
            "repo_url": request.data.get("repo_url") or "",
            "branch": request.data.get("branch") or "sandbox/jafron",
            "workdir": request.data.get("workdir") or getattr(settings, "TESTHUB_WORKDIR", "/opt/testhub/workdir"),
        }
        repo, _created = ProjectTestRepo.objects.update_or_create(project=project, defaults=defaults)
        return Response({"repo": ProjectTestRepoSerializer(repo).data}, status=status.HTTP_200_OK)


class TesthubCatalogEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        repo = ProjectTestRepo.objects.filter(project_id=project_id).first()
        snapshot = CatalogSnapshot.objects.filter(project_id=project_id).order_by("-created_at").first()
        return Response(
            {
                "repo": ProjectTestRepoSerializer(repo).data if repo else None,
                "snapshot": CatalogSnapshotSerializer(snapshot).data if snapshot else None,
            },
            status=status.HTTP_200_OK,
        )


class TesthubSyncEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id):
        from plane.testhub.bgtasks import run_testhub_job

        project = _project(slug, project_id)
        repo = ProjectTestRepo.objects.filter(project_id=project_id).first()
        if repo is None:
            return Response({"error": "Bind a test repo first."}, status=status.HTTP_400_BAD_REQUEST)
        if TesthubJob.objects.filter(project_id=project_id, status__in=ACTIVE_JOB_STATUSES).exists():
            return Response({"error": "A testhub job is already running for this project."}, status=status.HTTP_409_CONFLICT)

        argv = build_argv("index_platform", {})
        job = TesthubJob.objects.create(
            project=project,
            workspace_id=project.workspace_id,
            kind="index_platform",
            params={},
            argv=argv,
            requested_by=request.user,
        )
        repo.last_sync_status = TesthubJob.Status.QUEUED
        repo.last_sync_error = ""
        repo.save(update_fields=["last_sync_status", "last_sync_error", "updated_at"])
        run_testhub_job.delay(str(job.id))
        return Response(TesthubJobSerializer(job).data, status=status.HTTP_202_ACCEPTED)


class TesthubFileEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        repo = ProjectTestRepo.objects.filter(project_id=project_id).first()
        if repo is None:
            return Response({"error": "Bind a test repo first."}, status=status.HTTP_400_BAD_REQUEST)
        rel_path = request.query_params.get("path") or ""
        try:
            normalized, content = resolve_repo_file(
                repo.workdir,
                rel_path,
                max_bytes=int(getattr(settings, "TESTHUB_FILE_MAX_BYTES", 1048576)),
            )
        except FileAccessError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"path": normalized, "content": content}, status=status.HTTP_200_OK)


class TesthubJobEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, pk=None):
        if pk:
            job = TesthubJob.objects.get(pk=pk, project_id=project_id)
            return Response(TesthubJobSerializer(job).data, status=status.HTTP_200_OK)
        jobs = TesthubJob.objects.filter(project_id=project_id).order_by("-created_at")[:100]
        return Response(TesthubJobSerializer(jobs, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id):
        from plane.testhub.bgtasks import run_testhub_job

        project = _project(slug, project_id)
        repo = ProjectTestRepo.objects.filter(project_id=project_id).first()
        if repo is None:
            return Response({"error": "Bind a test repo first."}, status=status.HTTP_400_BAD_REQUEST)
        if TesthubJob.objects.filter(project_id=project_id, status__in=ACTIVE_JOB_STATUSES).exists():
            return Response({"error": "A testhub job is already running for this project."}, status=status.HTTP_409_CONFLICT)

        kind = str(request.data.get("kind") or "")
        params = request.data.get("params") or {}
        if not isinstance(params, dict):
            return Response({"error": "params must be an object."}, status=status.HTTP_400_BAD_REQUEST)
        confirmed = bool(request.data.get("confirmed"))
        if is_destructive(kind, params) and not confirmed:
            return Response(
                {"error": "This job writes to the system under test. Set confirmed=true after an admin review."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            argv = build_argv(kind, params)
        except WhitelistError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        job = TesthubJob.objects.create(
            project=project,
            workspace_id=project.workspace_id,
            kind=kind,
            params=params,
            argv=argv,
            confirmed=confirmed,
            requested_by=request.user,
        )
        run_testhub_job.delay(str(job.id))
        return Response(TesthubJobSerializer(job).data, status=status.HTTP_202_ACCEPTED)
