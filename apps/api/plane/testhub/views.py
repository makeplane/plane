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
from plane.gitsync.bindings import BindingError, bind_module
from plane.gitsync.models import ProjectGitRemote
from plane.gitsync.registry import MODULE_TESTHUB
from plane.testhub.enqueue import TesthubJobConflict, enqueue_index_platform
from plane.testhub.files import FileAccessError, resolve_repo_file
from plane.testhub.models import CatalogSnapshot, TesthubAssetOverlay, TesthubJob, TesthubSession
from plane.testhub.serializers import (
    CatalogSnapshotSerializer,
    TesthubAssetOverlaySerializer,
    TesthubJobSerializer,
    TesthubSessionSerializer,
)
from plane.testhub.sessions import SessionSelectionError, clean_session_selection
from plane.testhub.sources import TesthubUnbound, testhub_repo_payload, testhub_workdir
from plane.testhub.whitelist import WhitelistError, build_argv, is_destructive

ACTIVE_JOB_STATUSES = (TesthubJob.Status.QUEUED, TesthubJob.Status.RUNNING)


def _project(slug: str, project_id):
    return Project.objects.get(pk=project_id, workspace__slug=slug)


class ProjectTestRepoEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        return Response({"repo": testhub_repo_payload(project_id)}, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def put(self, request, slug, project_id):
        project = _project(slug, project_id)
        remote_id = request.data.get("remote_id")
        if not remote_id:
            return Response(
                {"error": "Select a data source (remote_id) from Configuration."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        remote = ProjectGitRemote.objects.filter(pk=remote_id, project_id=project_id).first()
        if remote is None:
            return Response({"error": "Unknown data source."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            bind_module(project=project, module_key=MODULE_TESTHUB, remote=remote)
        except BindingError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"repo": testhub_repo_payload(project_id)}, status=status.HTTP_200_OK)


class TesthubCatalogEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        snapshot = CatalogSnapshot.objects.filter(project_id=project_id).order_by("-created_at").first()
        return Response(
            {
                "repo": testhub_repo_payload(project_id),
                "snapshot": CatalogSnapshotSerializer(snapshot).data if snapshot else None,
            },
            status=status.HTTP_200_OK,
        )


class TesthubSyncEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id):
        project = _project(slug, project_id)
        try:
            testhub_workdir(project_id)
            job = enqueue_index_platform(project=project, user=request.user)
        except TesthubUnbound as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except TesthubJobConflict as exc:
            return Response({"error": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response(TesthubJobSerializer(job).data, status=status.HTTP_202_ACCEPTED)


class TesthubFileEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        try:
            workdir = testhub_workdir(project_id)
        except TesthubUnbound as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        rel_path = request.query_params.get("path") or ""
        try:
            normalized, content = resolve_repo_file(
                workdir,
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
        try:
            testhub_workdir(project_id)
        except TesthubUnbound as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
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


class TesthubOverlayEndpoint(BaseAPIView):
    """Platform-side overlay (e.g. test progress). Never written back to git."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        asset_ref = (request.query_params.get("asset_ref") or "").strip()
        kind = (request.query_params.get("kind") or "").strip()
        rows = TesthubAssetOverlay.objects.filter(project_id=project_id)
        if asset_ref:
            rows = rows.filter(asset_ref=asset_ref)
        if kind:
            rows = rows.filter(kind=kind)
        return Response(TesthubAssetOverlaySerializer(rows[:200], many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def put(self, request, slug, project_id):
        project = _project(slug, project_id)
        asset_ref = str(request.data.get("asset_ref") or "").strip()
        kind = str(request.data.get("kind") or "progress").strip() or "progress"
        payload = request.data.get("payload")
        if not asset_ref:
            return Response({"error": "asset_ref is required."}, status=status.HTTP_400_BAD_REQUEST)
        if payload is None:
            payload = {}
        if not isinstance(payload, dict):
            return Response({"error": "payload must be an object."}, status=status.HTTP_400_BAD_REQUEST)
        overlay, _created = TesthubAssetOverlay.objects.update_or_create(
            project=project,
            asset_ref=asset_ref,
            kind=kind,
            defaults={"workspace_id": project.workspace_id, "payload": payload},
        )
        return Response(TesthubAssetOverlaySerializer(overlay).data, status=status.HTTP_200_OK)


class TesthubSessionEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, pk=None):
        if pk:
            session = TesthubSession.objects.get(pk=pk, project_id=project_id)
            return Response(TesthubSessionSerializer(session).data, status=status.HTTP_200_OK)
        sessions = TesthubSession.objects.filter(project_id=project_id).order_by("-created_at")[:100]
        return Response(TesthubSessionSerializer(sessions, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id):
        project = _project(slug, project_id)
        name = str(request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            cleaned = clean_session_selection(request.data.get("selection") or [])
        except SessionSelectionError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        session = TesthubSession.objects.create(
            project=project,
            workspace_id=project.workspace_id,
            name=name,
            feature_source_module=str(request.data.get("feature_source_module") or "features"),
            feature_sha=str(request.data.get("feature_sha") or ""),
            environment_id=str(request.data.get("environment_id") or ""),
            selection=cleaned,
            summary={"passed": 0, "failed": 0, "skipped": 0, "pending": len(cleaned)},
            requested_by=request.user,
        )
        return Response(TesthubSessionSerializer(session).data, status=status.HTTP_201_CREATED)
