# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Operations settings, and the one-click workspace bootstrap."""

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from workspaces.app.permissions import ROLE, allow_permission
from workspaces.app.views.base import BaseAPIView
from workspaces.db.models import OperationsSetting, State, Workspace
from workspaces.utils.engineering_ops import (
    DEFAULT_OPERATIONS_CONFIG,
    ENGINEERING_ISSUE_TYPES,
    ENGINEERING_LABELS,
    ENGINEERING_MODULE_SUGGESTIONS,
    ENGINEERING_TRANSITION_OWNERS,
    ENGINEERING_WORKFLOW_STATES,
    deep_merge,
    get_operations_config,
)
from workspaces.utils.engineering_ops_setup import bootstrap_workspace

from .helpers import scoped_project_ids


class OperationsSettingEndpoint(BaseAPIView):
    """
    Read or change the workspace's operations configuration.

    Reads are open to any member -- the state mapping is what every dashboard
    is phrased in, and a member who cannot see it cannot tell why a number is
    what it is. Writes are admin-only.
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        setting = OperationsSetting.objects.filter(workspace=workspace).first()
        return Response(
            {
                "config": get_operations_config(workspace.id),
                "overrides": setting.config if setting else {},
                "defaults": DEFAULT_OPERATIONS_CONFIG,
                "workflow": {
                    "states": ENGINEERING_WORKFLOW_STATES,
                    "transitions": ENGINEERING_TRANSITION_OWNERS,
                    "labels": ENGINEERING_LABELS,
                    "issue_types": ENGINEERING_ISSUE_TYPES,
                    "module_suggestions": ENGINEERING_MODULE_SUGGESTIONS,
                },
            },
            status=status.HTTP_200_OK,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        incoming = request.data.get("config")
        if not isinstance(incoming, dict):
            return Response({"error": "`config` must be an object."}, status=status.HTTP_400_BAD_REQUEST)

        setting, _created = OperationsSetting.objects.get_or_create(workspace=workspace)
        # Merged rather than replaced: a settings page that saves one panel
        # must not wipe the two it did not render.
        setting.config = deep_merge(setting.config or {}, incoming)
        setting.save()

        return Response(
            {"config": get_operations_config(workspace.id), "overrides": setting.config},
            status=status.HTTP_200_OK,
        )


class OperationsStateMappingEndpoint(BaseAPIView):
    """
    The states available for mapping, per project.

    The settings UI needs to offer real state names rather than free text --
    a mapping onto a state nobody has is a dashboard full of zeroes.
    """

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        project_ids = scoped_project_ids(request, slug)
        states = (
            State.all_state_objects.filter(project_id__in=project_ids)
            .values("id", "name", "group", "color", "project_id", "project__name")
            .order_by("project__name", "sequence")
        )
        # Grouped by name, because the mapping is by name across projects.
        by_name = {}
        for state in states:
            entry = by_name.setdefault(state["name"], {"name": state["name"], "groups": set(), "projects": []})
            entry["groups"].add(state["group"])
            entry["projects"].append({"id": str(state["project_id"]), "name": state["project__name"]})

        return Response(
            {
                "states": [
                    {"name": entry["name"], "groups": sorted(entry["groups"]), "project_count": len(entry["projects"])}
                    for entry in by_name.values()
                ]
            },
            status=status.HTTP_200_OK,
        )


class OperationsBootstrapEndpoint(BaseAPIView):
    """
    Create PROJECT.md's states, labels and issue types in this workspace.

    Additive and safe to re-run: nothing is deleted, and a state or label that
    already exists is left exactly as it is.
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        project_ids = request.data.get("project_ids") or None

        result = bootstrap_workspace(
            workspace=workspace,
            project_ids=project_ids,
            created_by_id=request.user.id,
            include_issue_types=request.data.get("include_issue_types", True),
        )
        return Response(result, status=status.HTTP_200_OK)
