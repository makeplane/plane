# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""GET/PATCH workspace and project feature switches (plane-sdk WorkspaceFeature, ProjectFeature)."""

from rest_framework import status
from rest_framework.response import Response

from plane.api.views.intake import ensure_default_intake
from plane.nexus.models import ProjectFeature, WorkspaceFeature
from plane.nexus.models.features import PROJECT_NATIVE_FIELDS, WORKSPACE_FEATURE_FIELDS
from plane.utils.permissions import ProjectAdminPermission, WorkspaceOwnerPermission, WorkspaceUserPermission
from plane.utils.permissions import ProjectEntityPermission

from .base import NexusAPIView


def _flags(body, allowed):
    """The boolean switches in a PATCH body, or an error naming what is wrong."""
    if not isinstance(body, dict):
        return None, "Send a JSON object of feature switches."
    unknown = sorted(set(body) - set(allowed))
    if unknown:
        return None, f"Unknown or read-only feature(s): {', '.join(unknown)}. Allowed: {', '.join(allowed)}."
    wrong = sorted(k for k, v in body.items() if not isinstance(v, bool))
    if wrong:
        return None, f"Feature switches must be true or false: {', '.join(wrong)}."
    return body, None


def workspace_features(workspace) -> dict:
    row, _ = WorkspaceFeature.objects.get_or_create(workspace=workspace)
    data = {field: getattr(row, field) for field in WORKSPACE_FEATURE_FIELDS}
    # States, labels and workflows stay per project in this deployment.
    data["states_owned_by_workspace"] = False
    return data


class WorkspaceFeatureAPIEndpoint(NexusAPIView):
    def get_permissions(self):
        if self.request.method == "PATCH":
            return [WorkspaceOwnerPermission()]
        return [WorkspaceUserPermission()]

    def get(self, request, slug):
        return Response(workspace_features(self.get_workspace()))

    def patch(self, request, slug):
        flags, err = _flags(request.data, WORKSPACE_FEATURE_FIELDS)
        if err:
            return self.error(err)
        row, _ = WorkspaceFeature.objects.get_or_create(workspace=self.get_workspace())
        for field, value in flags.items():
            setattr(row, field, value)
        row.save()
        return Response(workspace_features(row.workspace), status=status.HTTP_200_OK)


def project_features(project) -> dict:
    row, _ = ProjectFeature.objects.get_or_create(project=project)
    data = {flag: getattr(project, column) for flag, column in PROJECT_NATIVE_FIELDS.items()}
    data.update(
        epics=row.epics,
        workflows=row.workflows,
        parallel_cycles=row.parallel_cycles,
        project_updates=row.project_updates,
    )
    return data


class ProjectFeatureAPIEndpoint(NexusAPIView):
    def get_permissions(self):
        if self.request.method == "PATCH":
            return [ProjectAdminPermission()]
        return [ProjectEntityPermission()]

    def get(self, request, slug, project_id):
        return Response(project_features(self.get_project()))

    def patch(self, request, slug, project_id):
        project = self.get_project()
        flags, err = _flags(
            request.data, (*PROJECT_NATIVE_FIELDS, "epics", "workflows", "parallel_cycles", "project_updates")
        )
        if err:
            return self.error(err)
        row, _ = ProjectFeature.objects.get_or_create(project=project)
        native = []
        for flag, value in flags.items():
            if flag in PROJECT_NATIVE_FIELDS:
                setattr(project, PROJECT_NATIVE_FIELDS[flag], value)
                native.append(PROJECT_NATIVE_FIELDS[flag])
            else:
                setattr(row, flag, value)
        if native:
            project.save(update_fields=native)
        if flags.get("intakes"):
            # The web app creates the project's default intake when intake is turned on.
            ensure_default_intake(project)
        row.save()
        return Response(project_features(project))
