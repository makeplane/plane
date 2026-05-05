# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.db.models import DayOverride, WorkSchedule
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.serializers.business_calendar import DayOverrideSerializer
from plane.license.api.views.base import BaseAPIView
from plane.utils.exception_logger import log_exception


class InstanceDayOverrideEndpoint(BaseAPIView):
    """List day overrides for a schedule (with optional ?year= filter) or create one."""

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

        qs = DayOverride.objects.filter(schedule=schedule).order_by("date")
        year_param = request.query_params.get("year")
        if year_param is not None:
            try:
                year = int(year_param)
            except ValueError:
                return Response({"error": "year must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
            qs = qs.filter(date__year=year)

        serializer = DayOverrideSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        schedule = self._get_schedule(pk)
        if schedule is None:
            return Response({"error": "Work schedule not found."}, status=status.HTTP_404_NOT_FOUND)

        data = {**request.data, "schedule": str(schedule.id)}
        serializer = DayOverrideSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InstanceDayOverrideDetailEndpoint(BaseAPIView):
    """Partially update or delete a specific DayOverride."""

    permission_classes = [InstanceAdminPermission]

    def _get_override(self, pk, override_pk):
        try:
            return DayOverride.objects.get(pk=override_pk, schedule_id=pk)
        except DayOverride.DoesNotExist:
            return None

    def patch(self, request, pk, override_pk):
        override = self._get_override(pk, override_pk)
        if override is None:
            return Response({"error": "Day override not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = DayOverrideSerializer(override, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, override_pk):
        override = self._get_override(pk, override_pk)
        if override is None:
            return Response({"error": "Day override not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            override.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            log_exception(e)
            return Response({"error": "Failed to delete day override."}, status=status.HTTP_400_BAD_REQUEST)
