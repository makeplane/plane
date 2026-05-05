# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers.job_position import JobGradeSerializer, JobPositionSerializer
from plane.db.models import JobGrade, JobPosition
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.views.base import BaseAPIView
from plane.utils.exception_logger import log_exception


class InstanceJobGradeEndpoint(BaseAPIView):
    """Instance-level CRUD for job grades — standalone parent (God Mode)."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        grades = JobGrade.objects.filter(deleted_at__isnull=True).order_by("sort_order", "name")
        return Response(JobGradeSerializer(grades, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = JobGradeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InstanceJobGradeDetailEndpoint(BaseAPIView):
    """Instance-level detail/update/delete for a job grade."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request, pk):
        try:
            grade = JobGrade.objects.get(pk=pk, deleted_at__isnull=True)
        except JobGrade.DoesNotExist:
            return Response({"error": "Job grade not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(JobGradeSerializer(grade).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        try:
            grade = JobGrade.objects.get(pk=pk, deleted_at__isnull=True)
        except JobGrade.DoesNotExist:
            return Response({"error": "Job grade not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = JobGradeSerializer(grade, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            grade = JobGrade.objects.get(pk=pk, deleted_at__isnull=True)
        except JobGrade.DoesNotExist:
            return Response({"error": "Job grade not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            grade.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            log_exception(e)
            return Response({"error": "Failed to delete job grade."}, status=status.HTTP_400_BAD_REQUEST)


class InstanceJobPositionEndpoint(BaseAPIView):
    """Instance-level CRUD for job positions — child of job grade (God Mode)."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        job_grade_id = request.query_params.get("job_grade_id")
        queryset = JobPosition.objects.filter(deleted_at__isnull=True).order_by("sort_order", "name")
        if job_grade_id:
            queryset = queryset.filter(job_grade_id=job_grade_id)
        return Response(JobPositionSerializer(queryset, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = JobPositionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InstanceJobPositionDetailEndpoint(BaseAPIView):
    """Instance-level detail/update/delete for a job position."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request, pk):
        try:
            position = JobPosition.objects.get(pk=pk, deleted_at__isnull=True)
        except JobPosition.DoesNotExist:
            return Response({"error": "Job position not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(JobPositionSerializer(position).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        try:
            position = JobPosition.objects.get(pk=pk, deleted_at__isnull=True)
        except JobPosition.DoesNotExist:
            return Response({"error": "Job position not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = JobPositionSerializer(position, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            position = JobPosition.objects.get(pk=pk, deleted_at__isnull=True)
        except JobPosition.DoesNotExist:
            return Response({"error": "Job position not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            position.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            log_exception(e)
            return Response({"error": "Failed to delete job position."}, status=status.HTTP_400_BAD_REQUEST)
