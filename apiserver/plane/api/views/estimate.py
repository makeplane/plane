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
    permission_classes = [
        ProjectEntityPermission,
    ]

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


class BulkEstimatePointEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def post(self, request, slug, project_id):
        try:
            if not request.data.get("estimate", False):
                return Response(
                    {"error": "Estimate is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            estimate_points = request.data.get("estimate_points", [])

            if not len(estimate_points) or len(estimate_points) > 8:
                return Response(
                    {"error": "Estimate points are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            estimate_serializer = EstimateSerializer(data=request.data.get("estimate"))
            if not estimate_serializer.is_valid():
                return Response(
                    estimate_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )
            try:
                estimate = estimate_serializer.save(project_id=project_id)
            except IntegrityError:
                return Response(
                    {"errror": "Estimate with the name already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            estimate_points = EstimatePoint.objects.bulk_create(
                [
                    EstimatePoint(
                        estimate=estimate,
                        key=estimate_point.get("key", 0),
                        value=estimate_point.get("value", ""),
                        description=estimate_point.get("description", ""),
                        project_id=project_id,
                        workspace_id=estimate.workspace_id,
                        created_by=request.user,
                        updated_by=request.user,
                    )
                    for estimate_point in estimate_points
                ],
                batch_size=10,
                ignore_conflicts=True,
            )

            estimate_point_serializer = EstimatePointSerializer(
                estimate_points, many=True
            )

            return Response(
                {
                    "estimate": estimate_serializer.data,
                    "estimate_points": estimate_point_serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except Estimate.DoesNotExist:
            return Response(
                {"error": "Estimate does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def patch(self, request, slug, project_id, estimate_id):
        try:
            if not len(request.data.get("estimate_points", [])):
                return Response(
                    {"error": "Estimate points are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            estimate_points_data = request.data.get("estimate_points", [])

            estimate_points = EstimatePoint.objects.filter(
                pk__in=[
                    estimate_point.get("id") for estimate_point in estimate_points_data
                ],
                workspace__slug=slug,
                project_id=project_id,
                estimate_id=estimate_id,
            )

            updated_estimate_points = []
            for estimate_point in estimate_points:
                # Find the data for that estimate point
                estimate_point_data = [
                    point
                    for point in estimate_points_data
                    if point.get("id") == str(estimate_point.id)
                ]
                print(estimate_point_data)
                if len(estimate_point_data):
                    estimate_point.value = estimate_point_data[0].get(
                        "value", estimate_point.value
                    )
                    updated_estimate_points.append(estimate_point)

            EstimatePoint.objects.bulk_update(
                updated_estimate_points, ["value"], batch_size=10
            )
            serializer = EstimatePointSerializer(estimate_points, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Estimate.DoesNotExist:
            return Response(
                {"error": "Estimate does not exist"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
