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

# Module imports
from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Workspace
from plane.ee.models import ProjectLabel
from plane.app.serializers import ProjectLabelSerializer


class ProjectLabelsEndpoint(BaseAPIView):
    """
    Endpoint for listing and creating project labels at the workspace level.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        """List all project labels in the workspace."""
        workspace = Workspace.objects.get(slug=slug)
        project_labels = ProjectLabel.objects.filter(workspace_id=workspace.id)
        serializer = ProjectLabelSerializer(project_labels, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        """Create a new project label."""
        workspace = Workspace.objects.get(slug=slug)
        serializer = ProjectLabelSerializer(data=request.data, context={"workspace_id": workspace.id})

        if serializer.is_valid():
            serializer.save(workspace=workspace)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectLabelDetailEndpoint(BaseAPIView):
    """
    Endpoint for retrieving, updating, and deleting a single project label.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, project_label_id):
        """Retrieve a single project label."""
        project_label = ProjectLabel.objects.get(id=project_label_id, workspace__slug=slug)
        serializer = ProjectLabelSerializer(project_label)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, project_label_id):
        """Update an existing project label."""
        workspace = Workspace.objects.get(slug=slug)
        project_label = ProjectLabel.objects.get(id=project_label_id, workspace__slug=slug)

        serializer = ProjectLabelSerializer(
            project_label,
            data=request.data,
            partial=True,
            context={"workspace_id": workspace.id},
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, project_label_id):
        """Delete a project label."""
        project_label = ProjectLabel.objects.get(id=project_label_id, workspace__slug=slug)
        project_label.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
