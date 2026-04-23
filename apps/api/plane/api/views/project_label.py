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
from django.db import IntegrityError

# drf-spectacular imports
from drf_spectacular.utils import (
    OpenApiResponse,
    OpenApiRequest,
)

# Module imports
from plane.api.views.base import ScopedBaseAPIView
from plane.db.models import Workspace
from plane.permissions import can, WorkspacePermissions
from plane.ee.models import ProjectLabel
from plane.api.serializers import (
    ProjectLabelSerializer,
    ProjectLabelCreateUpdateSerializer,
)
from plane.utils.openapi import (
    WORKSPACE_SLUG_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    ORDER_BY_PARAMETER,
    FIELDS_PARAMETER,
    EXPAND_PARAMETER,
    DELETED_RESPONSE,
    INVALID_REQUEST_RESPONSE,
    create_paginated_response,
)
from plane.utils.openapi.decorators import project_label_docs
from plane.utils.openapi.parameters import PROJECT_LABEL_ID_PARAMETER
from plane.utils.openapi.responses import (
    PROJECT_LABEL_NOT_FOUND_RESPONSE,
    PROJECT_LABEL_NAME_EXISTS_RESPONSE,
)
from plane.utils.openapi.examples import (
    PROJECT_LABEL_EXAMPLE,
    PROJECT_LABEL_CREATE_EXAMPLE,
    PROJECT_LABEL_UPDATE_EXAMPLE,
)
from plane.utils.oauth import READ_SCOPE, WRITE_SCOPE, PROJECTS_LABELS_READ_SCOPE, PROJECTS_LABELS_WRITE_SCOPE


class ProjectLabelListCreateAPIEndpoint(ScopedBaseAPIView):
    """Project Label List and Create Endpoint"""

    serializer_class = ProjectLabelSerializer
    model = ProjectLabel
    use_read_replica = True
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_LABELS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [PROJECTS_LABELS_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return (
            ProjectLabel.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace")
            .order_by(self.kwargs.get("order_by", "sort_order"))
        )

    @project_label_docs(
        operation_id="create_project_label",
        summary="Create a project label",
        description="Create a new project label in the workspace with name, color, and description.",
        request=OpenApiRequest(
            request=ProjectLabelCreateUpdateSerializer,
            examples=[PROJECT_LABEL_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Project label created successfully",
                response=ProjectLabelSerializer,
                examples=[PROJECT_LABEL_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            409: PROJECT_LABEL_NAME_EXISTS_RESPONSE,
        },
    )
    @can(WorkspacePermissions.MANAGE, resource_param="workspace_id", scope_param_type="workspace")
    def post(self, request, slug):
        """Create project label

        Create a new project label in the workspace with name, color, and description.
        """
        try:
            workspace = Workspace.objects.get(slug=slug)
            serializer = ProjectLabelCreateUpdateSerializer(data=request.data, context={"workspace_id": workspace.id})

            if serializer.is_valid():
                serializer.save(workspace_id=workspace.id)
                project_label = ProjectLabel.objects.get(pk=serializer.instance.id)
                return Response(
                    ProjectLabelSerializer(project_label).data,
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            project_label = ProjectLabel.objects.filter(
                workspace__slug=slug,
                name=request.data.get("name"),
            ).first()
            return Response(
                {
                    "error": "Project label with the same name already exists in the workspace",
                    "code": "PROJECT_LABEL_ALREADY_EXISTS",
                    "id": str(project_label.id) if project_label else None,
                },
                status=status.HTTP_409_CONFLICT,
            )

    @project_label_docs(
        operation_id="list_project_labels",
        summary="List project labels",
        description="Retrieve all project labels in a workspace.",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                ProjectLabelSerializer,
                "PaginatedProjectLabelResponse",
                "Paginated list of project labels",
                "Paginated Project Labels",
            ),
            400: INVALID_REQUEST_RESPONSE,
        },
    )
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def get(self, request, slug):
        """List project labels

        Retrieve all project labels in the workspace.
        """
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda project_labels: (
                ProjectLabelSerializer(project_labels, many=True, fields=self.fields, expand=self.expand).data
            ),
        )


class ProjectLabelDetailAPIEndpoint(ProjectLabelListCreateAPIEndpoint):
    """Project Label Detail Endpoint"""

    @project_label_docs(
        operation_id="get_project_label",
        summary="Retrieve a project label",
        description="Retrieve details of a specific project label.",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_LABEL_ID_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Project label details",
                response=ProjectLabelSerializer,
                examples=[PROJECT_LABEL_EXAMPLE],
            ),
            404: PROJECT_LABEL_NOT_FOUND_RESPONSE,
        },
    )
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def get(self, request, slug, pk):
        """Retrieve project label

        Retrieve details of a specific project label.
        """
        project_label = self.get_queryset().get(pk=pk)
        serializer = ProjectLabelSerializer(project_label)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @project_label_docs(
        operation_id="update_project_label",
        summary="Update a project label",
        description="Partially update an existing project label's properties like name, color, or description.",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_LABEL_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=ProjectLabelCreateUpdateSerializer,
            examples=[PROJECT_LABEL_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Project label updated successfully",
                response=ProjectLabelSerializer,
                examples=[PROJECT_LABEL_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: PROJECT_LABEL_NOT_FOUND_RESPONSE,
            409: PROJECT_LABEL_NAME_EXISTS_RESPONSE,
        },
    )
    @can(WorkspacePermissions.MANAGE, resource_param="workspace_id", scope_param_type="workspace")
    def patch(self, request, slug, pk):
        """Update project label

        Partially update an existing project label's properties like name, color, or description.
        """
        try:
            workspace = Workspace.objects.get(slug=slug)
            project_label = self.get_queryset().get(pk=pk)
            serializer = ProjectLabelCreateUpdateSerializer(
                project_label,
                data=request.data,
                partial=True,
                context={"workspace_id": workspace.id},
            )

            if serializer.is_valid():
                serializer.save()
                return Response(
                    ProjectLabelSerializer(serializer.instance).data,
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            existing_label = (
                ProjectLabel.objects.filter(
                    workspace__slug=slug,
                    name=request.data.get("name"),
                )
                .exclude(pk=pk)
                .first()
            )
            return Response(
                {
                    "error": "Project label with the same name already exists in the workspace",
                    "code": "PROJECT_LABEL_ALREADY_EXISTS",
                    "id": str(existing_label.id) if existing_label else None,
                },
                status=status.HTTP_409_CONFLICT,
            )

    @project_label_docs(
        operation_id="delete_project_label",
        summary="Delete a project label",
        description="Permanently delete an existing project label from the workspace.",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_LABEL_ID_PARAMETER,
        ],
        responses={
            204: DELETED_RESPONSE,
            404: PROJECT_LABEL_NOT_FOUND_RESPONSE,
        },
    )
    @can(WorkspacePermissions.MANAGE, resource_param="workspace_id", scope_param_type="workspace")
    def delete(self, request, slug, pk):
        """Delete project label

        Permanently delete an existing project label from the workspace.
        """
        project_label = self.get_queryset().get(pk=pk)
        project_label.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
