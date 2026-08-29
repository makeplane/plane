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
from plane.gitsync.env_catalog import ENV_LOCAL_REL, ENV_NAME_RE, named_environment_ids, read_env_local_payload
from plane.gitsync.files import FileAccessError, resolve_module_file
from plane.gitsync.git_url import GitUrlError
from plane.gitsync.indexes import refresh_bound_indexes
from plane.gitsync.models import ModuleBinding, ProjectGitRemote
from plane.gitsync.registry import MODULE_ENVIRONMENTS, MODULE_KEYS, MODULE_TESTHUB, is_known_module, module_catalog
from plane.gitsync.serializers import (
    ModuleBindingSerializer,
    ProjectGitRemoteSerializer,
    assign_git_url_workdir,
)
from plane.gitsync.sync import queue_git_url_sync, refresh_remote
from plane.gitsync.workdir import GitUrlNotImplemented, WorkdirError, assert_allowed_workdir, default_mount_workdir


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
        if remote.kind == ProjectGitRemote.Kind.GIT_URL:
            if remote.last_sync_status == "running":
                return Response(
                    {
                        "remote": ProjectGitRemoteSerializer(remote).data,
                        "git_sync_pending": True,
                        "testhub_job": None,
                        "indexes": {},
                    },
                    status=status.HTTP_202_ACCEPTED,
                )
            try:
                queue_git_url_sync(remote, getattr(request.user, "id", None))
            except GitUrlError as exc:
                return Response(
                    {"error": str(exc), "remote": ProjectGitRemoteSerializer(remote).data},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {
                    "remote": ProjectGitRemoteSerializer(remote).data,
                    "git_sync_pending": True,
                    "testhub_job": None,
                    "indexes": {},
                },
                status=status.HTTP_202_ACCEPTED,
            )

        try:
            refresh_remote(remote)
        except GitUrlNotImplemented as exc:
            return Response({"error": str(exc), "remote": ProjectGitRemoteSerializer(remote).data}, status=status.HTTP_400_BAD_REQUEST)
        except (WorkdirError, FileNotFoundError) as exc:
            return Response({"error": str(exc), "remote": ProjectGitRemoteSerializer(remote).data}, status=status.HTTP_400_BAD_REQUEST)

        indexes = refresh_bound_indexes(request.user, project_id, remote)
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


def _environments_workdir(project_id) -> tuple[ProjectGitRemote, str]:
    remote = get_bound_remote(project_id, MODULE_ENVIRONMENTS)
    if remote is None:
        raise BindingError("Module environments is not bound to a data source.")
    return remote, resolve_remote_workdir(remote)


def _require_shared_testhub_workdir(project_id, env_workdir: str) -> None:
    testhub_remote = get_bound_remote(project_id, MODULE_TESTHUB)
    if testhub_remote is None:
        raise BindingError("Named env switching requires TestCopilot to be bound to the same workdir.")
    testhub_workdir = assert_allowed_workdir(testhub_remote.workdir or default_mount_workdir())
    if testhub_workdir != env_workdir:
        raise BindingError("Named env switching requires Environment and TestCopilot to share the same workdir.")


class ModuleEnvironmentActivateEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id):
        from plane.testhub.enqueue import TesthubJobConflict, enqueue_config_use
        from plane.testhub.serializers import TesthubJobSerializer

        name = str(request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not ENV_NAME_RE.fullmatch(name):
            return Response({"error": "invalid environment name."}, status=status.HTTP_400_BAD_REQUEST)
        project = _project(slug, project_id)
        remote = get_bound_remote(project_id, MODULE_ENVIRONMENTS)
        if remote is None:
            return Response({"error": "Module environments is not bound to a data source."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            workdir = resolve_remote_workdir(remote)
            exec_workdir = assert_allowed_workdir(remote.workdir or workdir)
            _require_shared_testhub_workdir(project_id, exec_workdir)
            payload = scan_module_catalog(MODULE_ENVIRONMENTS, workdir)
        except (WorkdirError, GitUrlNotImplemented, BindingError, ConventionError) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        names = named_environment_ids(payload)
        if name not in names:
            available = ", ".join(names) if names else "(none)"
            return Response(
                {"error": f"Unknown environment {name!r}. Named environments: {available}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            job = enqueue_config_use(project=project, user=request.user, name=name, workdir=exec_workdir)
        except TesthubJobConflict as exc:
            return Response({"error": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response({"job": TesthubJobSerializer(job).data}, status=status.HTTP_202_ACCEPTED)


class ModuleEnvLocalEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def get(self, request, slug, project_id):
        try:
            _remote, workdir = _environments_workdir(project_id)
            payload = read_env_local_payload(
                workdir,
                max_bytes=int(getattr(settings, "TESTHUB_FILE_MAX_BYTES", 1048576)),
            )
        except (WorkdirError, GitUrlNotImplemented, BindingError, ValueError, OSError) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(payload, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def put(self, request, slug, project_id):
        from plane.testhub.runner import RunnerError, write_local_file

        content = request.data.get("content")
        if not isinstance(content, str):
            return Response({"error": "content must be a string."}, status=status.HTTP_400_BAD_REQUEST)
        remote = get_bound_remote(project_id, MODULE_ENVIRONMENTS)
        if remote is None:
            return Response({"error": "Module environments is not bound to a data source."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            workdir = resolve_remote_workdir(remote)
            exec_workdir = assert_allowed_workdir(remote.workdir or workdir)
            write_local_file(workdir=exec_workdir, path=ENV_LOCAL_REL, content=content)
        except (WorkdirError, GitUrlNotImplemented, BindingError, RunnerError, ValueError) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"ok": True, "path": ENV_LOCAL_REL}, status=status.HTTP_200_OK)
