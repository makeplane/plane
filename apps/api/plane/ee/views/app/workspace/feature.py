# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Third party imports
from rest_framework import status
from rest_framework.response import Response


from plane.db.models import Project, Workspace, IssueType, ProjectIssueType
from plane.ee.views.base import BaseAPIView
from plane.ee.models import WorkspaceFeature, ProjectState, ProjectAttribute
from plane.ee.permissions import WorkspaceEntityPermission, WorkspaceOwnerPermission
from plane.ee.serializers import WorkspaceFeatureSerializer


class WorkspaceFeaturesEndpoint(BaseAPIView):
    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [WorkspaceEntityPermission()]
        return [WorkspaceOwnerPermission()]

    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        workspace_feature, _ = WorkspaceFeature.objects.get_or_create(workspace_id=workspace.id)
        serializer = WorkspaceFeatureSerializer(workspace_feature)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request, slug):
        is_project_grouping_enabled = request.data.get("is_project_grouping_enabled", False)
        workspace = Workspace.objects.get(slug=slug)
        workspace_feature = WorkspaceFeature.objects.get(workspace_id=workspace.id)
        is_work_item_types_enabled = request.data.get("is_work_item_types_enabled", False)

        if is_work_item_types_enabled:
            # check any default work item type exists in the workspace
            default_work_item_type = IssueType.objects.filter(workspace__slug=slug, is_default=True).first()
            if not default_work_item_type:
                # Create a new default issue type
                IssueType.objects.create(
                    workspace_id=workspace.id,
                    name="Task",
                    is_default=True,
                    description="Default work item type with the option to add new properties",
                    logo_props={
                        "in_use": "icon",
                        "icon": {"color": "#ffffff", "background_color": "#6695FF"},
                    },
                )

            default_work_item_type = IssueType.objects.filter(workspace__slug=slug, is_default=True).first()
            if default_work_item_type:
                existing_project_ids = ProjectIssueType.objects.filter(
                    issue_type=default_work_item_type,
                    project__workspace__slug=slug,
                ).values_list("project_id", flat=True)
                project_ids = (
                    Project.objects.filter(workspace__slug=slug)
                    .exclude(id__in=existing_project_ids)
                    .values_list("id", flat=True)
                )
                ProjectIssueType.objects.bulk_create(
                    [ProjectIssueType(project_id=pid, issue_type_id=default_work_item_type.id) for pid in project_ids],
                    ignore_conflicts=True,
                )

        if is_project_grouping_enabled:
            project_states = ProjectState.objects.filter(workspace__slug=slug).first()

            if not project_states:
                # Default states
                states = [
                    {
                        "name": "Draft",
                        "color": "#60646C",
                        "sequence": 15000,
                        "group": "draft",
                        "default": True,
                    },
                    {
                        "name": "Planning",
                        "color": "#60646C",
                        "sequence": 25000,
                        "group": "planning",
                    },
                    {
                        "name": "Execution",
                        "color": "#F59E0B",
                        "sequence": 35000,
                        "group": "execution",
                    },
                    {
                        "name": "Monitoring",
                        "color": "#00838F",
                        "sequence": 45000,
                        "group": "monitoring",
                    },
                    {
                        "name": "Completed",
                        "color": "#46A758",
                        "sequence": 55000,
                        "group": "completed",
                    },
                    {
                        "name": "Cancelled",
                        "color": "#9AA4BC",
                        "sequence": 65000,
                        "group": "cancelled",
                    },
                ]

                ProjectState.objects.bulk_create(
                    [
                        ProjectState(
                            name=state["name"],
                            color=state["color"],
                            sequence=state["sequence"],
                            workspace=workspace,
                            group=state["group"],
                            default=state.get("default", False),
                            created_by=request.user,
                            updated_by=request.user,
                        )
                        for state in states
                    ],
                    ignore_conflicts=True,
                )

            default_state = ProjectState.objects.filter(workspace__slug=slug, default=True).first()

            project_attribute_project_ids = ProjectAttribute.objects.filter(workspace__slug=slug).values_list(
                "project_id", flat=True
            )

            projects_ids = (
                Project.objects.filter(workspace__slug=slug)
                .exclude(id__in=project_attribute_project_ids)
                .values_list("id", flat=True)
            )

            # bulk create all the project attributes
            if projects_ids:
                ProjectAttribute.objects.bulk_create(
                    [
                        ProjectAttribute(
                            project_id=project_id,
                            state=default_state,
                            workspace=workspace,
                        )
                        for project_id in projects_ids
                    ],
                    batch_size=10,
                )

        serializer = WorkspaceFeatureSerializer(workspace_feature, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
