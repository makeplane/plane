# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import OpenApiRequest, OpenApiResponse

# Module imports
from plane.app.permissions.project import ProjectEntityPermission
from plane.api.views.base import BaseAPIView
from plane.db.models import Estimate, EstimatePoint, Project, Workspace
from plane.api.serializers import EstimateSerializer, EstimatePointSerializer
from plane.utils.openapi.decorators import estimate_docs, estimate_point_docs
from plane.utils.openapi import (
    ESTIMATE_CREATE_EXAMPLE,
    ESTIMATE_UPDATE_EXAMPLE,
    ESTIMATE_POINT_CREATE_EXAMPLE,
    ESTIMATE_POINT_UPDATE_EXAMPLE,
    ESTIMATE_EXAMPLE,
    ESTIMATE_POINT_EXAMPLE,
    DELETED_RESPONSE,
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_ID_PARAMETER,
    ESTIMATE_ID_PARAMETER,
)


class ProjectEstimateAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]
    model = Estimate
    serializer_class = EstimateSerializer

    def get_queryset(self):
        return self.model.objects.filter(workspace__slug=self.workspace_slug, project_id=self.project_id)

    @estimate_docs(
        operation_id="create_estimate",
        summary="Create an estimate",
        description="Create an estimate for a project",
        request=OpenApiRequest(
            request=EstimateSerializer,
            examples=[ESTIMATE_CREATE_EXAMPLE],
        ),
    )
    def post(self, request, slug, project_id):
        project = Project.objects.get(id=project_id, workspace__slug=slug)
        if not project:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"error": "Project not found"})

        workspace = Workspace.objects.get(slug=slug)
        if not workspace:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"error": "Workspace not found"})

        project_estimate = self.get_queryset().first()
        if project_estimate:
            # return 409 if the project estimate already exists
            return Response(
                status=status.HTTP_409_CONFLICT,
                data={"error": "An estimate already exists for this project", "id": str(project_estimate.id)},
            )
        # create the project estimate
        serializer = self.serializer_class(data=request.data, context={"workspace": workspace, "project": project})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @estimate_docs(
        operation_id="get_estimate",
        summary="Get an estimate",
        description="Get an estimate for a project",
        responses={
            200: OpenApiResponse(
                description="Estimate",
                response=EstimateSerializer,
                examples=[ESTIMATE_EXAMPLE],
            ),
        },
    )
    def get(self, request, slug, project_id):
        estimate = self.get_queryset().first()
        if not estimate:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"error": "Estimate not found"})
        serializer = self.serializer_class(estimate)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @estimate_docs(
        operation_id="update_estimate",
        summary="Update an estimate",
        description="Update an estimate for a project",
        request=OpenApiRequest(
            request=EstimateSerializer,
            examples=[ESTIMATE_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Estimate",
                response=EstimateSerializer,
                examples=[ESTIMATE_EXAMPLE],
            ),
        },
    )
    def patch(self, request, slug, project_id):
        ALLOWED_FIELDS = ["name", "description"]
        estimate = self.get_queryset().first()
        if not estimate:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"error": "Estimate not found"})
        filtered_data = {k: v for k, v in request.data.items() if k in ALLOWED_FIELDS}
        if not filtered_data:
            serializer = self.serializer_class(estimate)
            return Response(serializer.data, status=status.HTTP_200_OK)
        serializer = self.serializer_class(estimate, data=filtered_data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @estimate_docs(
        operation_id="delete_estimate",
        summary="Delete an estimate",
        description="Delete an estimate for a project",
        responses={
            204: DELETED_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id):
        estimate = self.get_queryset().first()
        if not estimate:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"error": "Estimate not found"})
        estimate.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EstimatePointListCreateAPIEndpoint(BaseAPIView):
    """List and bulk create estimate points for an estimate."""

    permission_classes = [ProjectEntityPermission]
    model = EstimatePoint
    serializer_class = EstimatePointSerializer

    def get_queryset(self):
        return self.model.objects.filter(
            estimate_id=self.kwargs["estimate_id"],
            workspace__slug=self.kwargs["slug"],
            project_id=self.kwargs["project_id"],
        ).select_related("estimate", "workspace", "project")

    @estimate_point_docs(
        operation_id="get_estimate_points",
        summary="Get estimate points",
        description="Get estimate points for an estimate",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
            ESTIMATE_ID_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Estimate points",
                response=EstimatePointSerializer(many=True),
                examples=[ESTIMATE_POINT_EXAMPLE],
            ),
        },
    )
    def get(self, request, slug, project_id, estimate_id):
        estimate = Estimate.objects.filter(
            id=estimate_id,
            workspace__slug=slug,
            project_id=project_id,
        ).first()
        if not estimate:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"error": "Estimate not found"})
        estimate_points = self.get_queryset()
        serializer = self.serializer_class(estimate_points, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @estimate_point_docs(
        operation_id="create_estimate_points",
        summary="Create estimate points",
        description="Create estimate points for an estimate",
        request=OpenApiRequest(
            request=EstimatePointSerializer,
            examples=[ESTIMATE_POINT_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Estimate points",
                response=EstimatePointSerializer(many=True),
                examples=[ESTIMATE_POINT_EXAMPLE],
            ),
        },
    )
    def post(self, request, slug, project_id, estimate_id):
        estimate = Estimate.objects.filter(
            id=estimate_id,
            workspace__slug=slug,
            project_id=project_id,
        ).first()
        if not estimate:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"error": "Estimate not found"})

        estimate_points_data = (
            request.data if isinstance(request.data, list) else request.data.get("estimate_points", [])
        )
        if not estimate_points_data:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={"error": "Estimate points are required"},
            )

        serializer = self.serializer_class(data=estimate_points_data, many=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        estimate_points = [
            EstimatePoint(
                estimate=estimate,
                workspace=estimate.workspace,
                project=estimate.project,
                **item,
            )
            for item in serializer.validated_data
        ]
        created = EstimatePoint.objects.bulk_create(estimate_points)
        return Response(
            self.serializer_class(created, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class EstimatePointDetailAPIEndpoint(BaseAPIView):
    """Update and delete a single estimate point."""

    permission_classes = [ProjectEntityPermission]
    model = EstimatePoint
    serializer_class = EstimatePointSerializer

    def get_queryset(self):
        return self.model.objects.filter(
            estimate_id=self.kwargs["estimate_id"],
            workspace__slug=self.kwargs["slug"],
            project_id=self.kwargs["project_id"],
        )

    @estimate_point_docs(
        operation_id="update_estimate_point",
        summary="Update an estimate point",
        description="Update an estimate point for an estimate",
        request=OpenApiRequest(
            request=EstimatePointSerializer,
            examples=[ESTIMATE_POINT_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Estimate point",
                response=EstimatePointSerializer,
                examples=[ESTIMATE_POINT_EXAMPLE],
            ),
        },
    )
    def patch(self, request, slug, project_id, estimate_id, estimate_point_id):
        estimate_point = self.get_queryset().filter(id=estimate_point_id).first()
        if not estimate_point:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"error": "Estimate point not found"})
        ALLOWED_FIELDS = ["key", "value", "description"]
        filtered_data = {k: v for k, v in request.data.items() if k in ALLOWED_FIELDS}
        if not filtered_data:
            return Response(self.serializer_class(estimate_point).data, status=status.HTTP_200_OK)
        serializer = self.serializer_class(estimate_point, data=filtered_data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @estimate_point_docs(
        operation_id="delete_estimate_point",
        summary="Delete an estimate point",
        description="Delete an estimate point for an estimate",
        responses={
            204: DELETED_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, estimate_id, estimate_point_id):
        estimate_point = self.get_queryset().filter(id=estimate_point_id).first()
        if not estimate_point:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"error": "Estimate point not found"})
        estimate_point.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
