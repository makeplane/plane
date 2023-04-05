# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from .base import BaseViewSet, BaseAPIView
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import Project, Estimate, EstimatePoint
from plane.api.serializers import EstimateSerializer, EstimatePointSerializer


class EstimateViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]
    model = Estimate
    serializer_class = EstimateSerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))


class EstimatePointViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]
    model = EstimatePoint
    serializer_class = EstimatePointSerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .filter(estimate_id=self.kwargs.get("estimate_id"))
            .select_related("project")
            .select_related("workspace")
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            estimate_id=self.kwargs.get("estimate_id"),
        )

    def create(self, request, slug, project_id, estimate_id):
        try:
            serializer = EstimatePointSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(estimate_id=estimate_id, project_id=project_id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "The estimate point is already taken"},
                    status=status.HTTP_410_GONE,
                )
            else:
                capture_exception(e)
                return Response(
                    {"error": "Something went wrong please try again later"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

    def partial_update(self, request, slug, project_id, estimate_id, pk):
        try:
            estimate_point = EstimatePoint.objects.get(
                pk=pk,
                estimate_id=estimate_id,
                project_id=project_id,
                workspace__slug=slug,
            )
            serializer = EstimatePointSerializer(
                estimate_point, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save(estimate_id=estimate_id, project_id=project_id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except EstimatePoint.DoesNotExist:
            return Response(
                {"error": "Estimate Point does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "The estimate point value is already taken"},
                    status=status.HTTP_410_GONE,
                )
            else:
                capture_exception(e)
                return Response(
                    {"error": "Something went wrong please try again later"},
                    status=status.HTTP_400_BAD_REQUEST,
                )


class ProjectEstimatePointEndpoint(BaseAPIView):
    def get(self, request, slug, project_id):
        try:
            project = Project.objects.get(workspace__slug=slug, pk=project_id)
            if project.estimate_id is not None:
                estimate_points = EstimatePoint.objects.filter(
                    estimate_id=project.estimate_id,
                    project_id=project_id,
                    workspace__slug=slug,
                )
                serializer = EstimatePointSerializer(estimate_points, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response([], status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
