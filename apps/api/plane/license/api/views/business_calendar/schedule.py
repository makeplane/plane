# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.db.models import WorkSchedule
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.serializers.business_calendar import WorkScheduleSerializer
from plane.license.api.views.base import BaseAPIView
from plane.utils.exception_logger import log_exception


class InstanceWorkScheduleEndpoint(BaseAPIView):
    """List all WorkSchedules or create a new one (instance admin only)."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        schedules = WorkSchedule.objects.filter(deleted_at__isnull=True).order_by("name")
        serializer = WorkScheduleSerializer(schedules, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = WorkScheduleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InstanceWorkScheduleDetailEndpoint(BaseAPIView):
    """Retrieve, partially update, or delete a WorkSchedule (instance admin only)."""

    permission_classes = [InstanceAdminPermission]

    def _get_schedule(self, pk):
        try:
            return WorkSchedule.objects.get(pk=pk, deleted_at__isnull=True)
        except WorkSchedule.DoesNotExist:
            return None

    def get(self, request, pk):
        schedule = self._get_schedule(pk)
        if schedule is None:
            return Response({"error": "Work schedule not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkScheduleSerializer(schedule)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        schedule = self._get_schedule(pk)
        if schedule is None:
            return Response({"error": "Work schedule not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkScheduleSerializer(schedule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        schedule = self._get_schedule(pk)
        if schedule is None:
            return Response({"error": "Work schedule not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            schedule.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            log_exception(e)
            return Response({"error": "Failed to delete work schedule."}, status=status.HTTP_400_BAD_REQUEST)
