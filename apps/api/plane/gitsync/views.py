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
from plane.gitsync.bindings import BindingError, bind_module, get_bound_remote, resolve_remote_workdir
from plane.gitsync.conventions import ConventionError, scan_module_catalog
from plane.gitsync.files import FileAccessError, resolve_module_file
from plane.gitsync.models import ModuleBinding, ProjectGitRemote
from plane.gitsync.registry import CONVENTION_SCAN_MODULES, MODULE_KEYS, MODULE_TESTHUB, is_known_module, module_catalog
from plane.gitsync.serializers import (
    ModuleBindingSerializer,
    ProjectGitRemoteSerializer,
    assign_git_url_workdir,
)
from plane.gitsync.sync import refresh_remote
from plane.gitsync.workdir import GitUrlNotImplemented, WorkdirError, default_mount_workdir


def _project(slug: str, project_id):
    return Project.objects.get(pk=project_id, workspace__slug=slug)


class GitRemoteListEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        remotes = ProjectGitRemote.objects.filter(project_id=project_id).order_by("created_at")
        return Response(
            {
                "remotes": ProjectGitRemoteSerializer(remotes, many=True).data,
                "modules": module_catalog(),
                "defaults": {
                    "local_mount_workdir": default_mount_workdir(),
                    "clone_root": str(getattr(settings, "GITSYNC_CLONE_ROOT", "/opt/gitsync/clones")),
                },
            },
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id):
        project = _project(slug, project_id)
        serializer = ProjectGitRemoteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        remote = serializer.save(project=project, workspace_id=project.workspace_id)
        if remote.kind == ProjectGitRemote.Kind.GIT_URL:
            assign_git_url_workdir(remote)
        return Response({"remote": ProjectGitRemoteSerializer(remote).data}, status=status.HTTP_201_CREATED)


class GitRemoteDetailEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, pk):
        remote = ProjectGitRemote.objects.get(pk=pk, project_id=project_id)
        return Response({"remote": ProjectGitRemoteSerializer(remote).data}, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def put(self, request, slug, project_id, pk):
        remote = ProjectGitRemote.objects.get(pk=pk, project_id=project_id)
        serializer = ProjectGitRemoteSerializer(remote, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        remote = serializer.save()
        if remote.kind == ProjectGitRemote.Kind.GIT_URL:
            assign_git_url_workdir(remote)
        return Response({"remote": ProjectGitRemoteSerializer(remote).data}, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def delete(self, request, slug, project_id, pk):
        remote = ProjectGitRemote.objects.get(pk=pk, project_id=project_id)
        remote.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GitRemoteSyncEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id, pk):
        remote = ProjectGitRemote.objects.get(pk=pk, project_id=project_id)
        try:
            refresh_remote(remote)
        except GitUrlNotImplemented as exc:
            return Response({"error": str(exc), "remote": ProjectGitRemoteSerializer(remote).data}, status=status.HTTP_400_BAD_REQUEST)
        except (WorkdirError, FileNotFoundError) as exc:
            return Response({"error": str(exc), "remote": ProjectGitRemoteSerializer(remote).data}, status=status.HTTP_400_BAD_REQUEST)

        indexes = _refresh_bound_indexes(request, project_id, remote)
        testhub_job = indexes.get(MODULE_TESTHUB)
        payload = {
            "remote": ProjectGitRemoteSerializer(remote).data,
            "testhub_job": testhub_job,
            "indexes": indexes,
        }
        return Response(payload, status=status.HTTP_200_OK if testhub_job is None else status.HTTP_202_ACCEPTED)


class ModuleBindingListEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        bindings = ModuleBinding.objects.filter(project_id=project_id).select_related("remote")
        by_key = {item.module_key: item for item in bindings}
        items = []
        for key in MODULE_KEYS:
            binding = by_key.get(key)
            items.append(
                {
                    "module_key": key,
                    "binding": ModuleBindingSerializer(binding).data if binding else None,
                }
            )
        return Response({"bindings": items, "modules": module_catalog()}, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def put(self, request, slug, project_id):
        project = _project(slug, project_id)
        items = request.data.get("bindings")
        if not isinstance(items, list):
            return Response({"error": "bindings must be a list."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            for item in items:
                if not isinstance(item, dict):
                    return Response({"error": "each binding must be an object."}, status=status.HTTP_400_BAD_REQUEST)
                module_key = str(item.get("module_key") or "")
                remote_id = item.get("remote_id")
                remote = None
                if remote_id:
                    remote = ProjectGitRemote.objects.filter(pk=remote_id, project_id=project_id).first()
                    if remote is None:
                        return Response({"error": f"Unknown data source: {remote_id}"}, status=status.HTTP_400_BAD_REQUEST)
                bind_module(project=project, module_key=module_key, remote=remote)
        except BindingError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        bindings = ModuleBinding.objects.filter(project_id=project_id).select_related("remote")
        by_key = {item.module_key: item for item in bindings}
        payload = [
            {
                "module_key": key,
                "binding": ModuleBindingSerializer(by_key[key]).data if key in by_key else None,
            }
            for key in MODULE_KEYS
        ]
        return Response({"bindings": payload, "modules": module_catalog()}, status=status.HTTP_200_OK)


class ModuleCatalogEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, module_key):
        if not is_known_module(module_key):
            return Response({"error": "Unknown module."}, status=status.HTTP_404_NOT_FOUND)
        if module_key == MODULE_TESTHUB:
            return Response(
                {"error": "TestCopilot catalog is served at /testhub/catalog/."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        remote = get_bound_remote(project_id, module_key)
        if remote is None:
            return Response({"module_key": module_key, "remote": None, "payload": None}, status=status.HTTP_200_OK)
        try:
            workdir = resolve_remote_workdir(remote)
            payload = scan_module_catalog(module_key, workdir)
        except (WorkdirError, GitUrlNotImplemented, BindingError, ConventionError) as exc:
            return Response({"error": str(exc), "module_key": module_key, "remote": ProjectGitRemoteSerializer(remote).data}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"module_key": module_key, "remote": ProjectGitRemoteSerializer(remote).data, "payload": payload},
            status=status.HTTP_200_OK,
        )


class ModuleFileEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, module_key):
        if not is_known_module(module_key):
            return Response({"error": "Unknown module."}, status=status.HTTP_404_NOT_FOUND)
        remote = get_bound_remote(project_id, module_key)
        if remote is None:
            return Response({"error": f"Module {module_key} is not bound to a data source."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            workdir = resolve_remote_workdir(remote)
            normalized, content = resolve_module_file(
                workdir,
                module_key,
                request.query_params.get("path") or "",
                max_bytes=int(getattr(settings, "TESTHUB_FILE_MAX_BYTES", 1048576)),
            )
        except (WorkdirError, GitUrlNotImplemented, BindingError, FileAccessError) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"path": normalized, "content": content, "module_key": module_key}, status=status.HTTP_200_OK)


def _refresh_bound_indexes(request, project_id, remote: ProjectGitRemote) -> dict:
    indexes: dict = {}
    keys = list(ModuleBinding.objects.filter(remote=remote).values_list("module_key", flat=True))
    if MODULE_TESTHUB in keys:
        indexes[MODULE_TESTHUB] = _enqueue_testhub_index(request, project_id)
    try:
        workdir = resolve_remote_workdir(remote)
    except (WorkdirError, GitUrlNotImplemented, BindingError) as exc:
        for key in keys:
            if key in CONVENTION_SCAN_MODULES:
                indexes[key] = {"ok": False, "error": str(exc)}
        return indexes
    for key in keys:
        if key not in CONVENTION_SCAN_MODULES:
            continue
        try:
            scan_module_catalog(key, workdir)
            indexes[key] = {"ok": True}
        except ConventionError as exc:
            indexes[key] = {"ok": False, "error": str(exc)}
    return indexes


def _enqueue_testhub_index(request, project_id):
    from plane.testhub.enqueue import TesthubJobConflict, enqueue_index_platform
    from plane.testhub.serializers import TesthubJobSerializer
    from plane.testhub.sources import TesthubUnbound

    project = Project.objects.get(pk=project_id)
    try:
        job = enqueue_index_platform(project=project, user=request.user)
    except TesthubJobConflict as exc:
        return {"error": str(exc)}
    except TesthubUnbound as exc:
        return {"error": str(exc)}
    return TesthubJobSerializer(job).data
