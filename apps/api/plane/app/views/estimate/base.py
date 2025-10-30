import random
import string
import json

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from ..base import BaseViewSet, BaseAPIView
from plane.app.permissions import ProjectEntityPermission, allow_permission, ROLE
from plane.db.models import Project, Estimate, EstimatePoint, Issue
from plane.app.serializers import (
    EstimateSerializer,
    EstimatePointSerializer,
    EstimateReadSerializer,
)
from plane.utils.cache import invalidate_cache
from plane.bgtasks.issue_activities_task import issue_activity


def generate_random_name(length=10):
    letters = string.ascii_lowercase
    return "".join(random.choice(letters) for i in range(length))


class ProjectEstimatePointEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
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


class BulkEstimatePointEndpoint(BaseViewSet):
    permission_classes = [ProjectEntityPermission]
    model = Estimate
    serializer_class = EstimateSerializer

    def list(self, request, slug, project_id):
        estimates = (
            Estimate.objects.filter(workspace__slug=slug, project_id=project_id)
            .prefetch_related("points")
            .select_related("workspace", "project")
        )
        serializer = EstimateReadSerializer(estimates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @invalidate_cache(path="/api/workspaces/:slug/estimates/", url_params=True, user=False)
    def create(self, request, slug, project_id):
        estimate = request.data.get("estimate")
        estimate_name = estimate.get("name", generate_random_name())
        estimate_type = estimate.get("type", "categories")
        last_used = estimate.get("last_used", False)
        estimate = Estimate.objects.create(
            name=estimate_name,
            project_id=project_id,
            last_used=last_used,
            type=estimate_type,
        )

        estimate_points = request.data.get("estimate_points", [])

        serializer = EstimatePointSerializer(data=request.data.get("estimate_points"), many=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

        serializer = EstimateReadSerializer(estimate)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, slug, project_id, estimate_id):
        estimate = Estimate.objects.get(pk=estimate_id, workspace__slug=slug, project_id=project_id)
        serializer = EstimateReadSerializer(estimate)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @invalidate_cache(path="/api/workspaces/:slug/estimates/", url_params=True, user=False)
    def partial_update(self, request, slug, project_id, estimate_id):
        if not len(request.data.get("estimate_points", [])):
            return Response(
                {"error": "Estimate points are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        estimate = Estimate.objects.get(pk=estimate_id)

        if request.data.get("estimate"):
            estimate.name = request.data.get("estimate").get("name", estimate.name)
            estimate.type = request.data.get("estimate").get("type", estimate.type)
            estimate.save()

        estimate_points_data = request.data.get("estimate_points", [])

        estimate_points = EstimatePoint.objects.filter(
            pk__in=[estimate_point.get("id") for estimate_point in estimate_points_data],
            workspace__slug=slug,
            project_id=project_id,
            estimate_id=estimate_id,
        )

        updated_estimate_points = []
        for estimate_point in estimate_points:
            # Find the data for that estimate point
            estimate_point_data = [point for point in estimate_points_data if point.get("id") == str(estimate_point.id)]
            if len(estimate_point_data):
                estimate_point.value = estimate_point_data[0].get("value", estimate_point.value)
                estimate_point.key = estimate_point_data[0].get("key", estimate_point.key)
                updated_estimate_points.append(estimate_point)

        EstimatePoint.objects.bulk_update(updated_estimate_points, ["key", "value"], batch_size=10)

        estimate_serializer = EstimateReadSerializer(estimate)
        return Response(estimate_serializer.data, status=status.HTTP_200_OK)

    @invalidate_cache(path="/api/workspaces/:slug/estimates/", url_params=True, user=False)
    def destroy(self, request, slug, project_id, estimate_id):
        estimate = Estimate.objects.get(pk=estimate_id, workspace__slug=slug, project_id=project_id)
        estimate.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EstimatePointEndpoint(BaseViewSet):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, estimate_id):
        #  TODO: add a key validation if the same key already exists
        if not request.data.get("key") or not request.data.get("value"):
            return Response(
                {"error": "Key and value are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        key = request.data.get("key", 0)
        value = request.data.get("value", "")
        estimate_point = EstimatePoint.objects.create(
            estimate_id=estimate_id, project_id=project_id, key=key, value=value
        )
        serializer = EstimatePointSerializer(estimate_point).data
        return Response(serializer, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, project_id, estimate_id, estimate_point_id):
        #  TODO: add a key validation if the same key already exists
        estimate_point = EstimatePoint.objects.get(
            pk=estimate_point_id,
            estimate_id=estimate_id,
            project_id=project_id,
            workspace__slug=slug,
        )
        serializer = EstimatePointSerializer(estimate_point, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, estimate_id, estimate_point_id):
        new_estimate_id = request.data.get("new_estimate_id", None)
        estimate_points = EstimatePoint.objects.filter(
            estimate_id=estimate_id, project_id=project_id, workspace__slug=slug
        )
        # update all the issues with the new estimate
        if new_estimate_id:
            issues = Issue.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                estimate_point_id=estimate_point_id,
            )
            for issue in issues:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=json.dumps({"estimate_point": (str(new_estimate_id) if new_estimate_id else None)}),
                    actor_id=str(request.user.id),
                    issue_id=issue.id,
                    project_id=str(project_id),
                    current_instance=json.dumps(
                        {"estimate_point": (str(issue.estimate_point_id) if issue.estimate_point_id else None)}
                    ),
                    epoch=int(timezone.now().timestamp()),
                )
                issues.update(estimate_point_id=new_estimate_id)
        else:
            issues = Issue.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                estimate_point_id=estimate_point_id,
            )
            for issue in issues:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=json.dumps({"estimate_point": None}),
                    actor_id=str(request.user.id),
                    issue_id=issue.id,
                    project_id=str(project_id),
                    current_instance=json.dumps(
                        {"estimate_point": (str(issue.estimate_point_id) if issue.estimate_point_id else None)}
                    ),
                    epoch=int(timezone.now().timestamp()),
                )

        # delete the estimate point
        old_estimate_point = EstimatePoint.objects.filter(pk=estimate_point_id).first()

        # rearrange the estimate points
        updated_estimate_points = []
        for estimate_point in estimate_points:
            if estimate_point.key > old_estimate_point.key:
                estimate_point.key -= 1
                updated_estimate_points.append(estimate_point)

        EstimatePoint.objects.bulk_update(updated_estimate_points, ["key"], batch_size=10)

        old_estimate_point.delete()

        return Response(
            EstimatePointSerializer(updated_estimate_points, many=True).data,
            status=status.HTTP_200_OK,
        )
