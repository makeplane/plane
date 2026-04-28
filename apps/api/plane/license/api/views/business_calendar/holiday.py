# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.db.models import Holiday, WorkSchedule
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.serializers.business_calendar import HolidaySerializer
from plane.license.api.views.base import BaseAPIView
from plane.utils.exception_logger import log_exception


class InstanceHolidayEndpoint(BaseAPIView):
    """List holidays for a schedule (with optional ?year= filter) or create a new one."""

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

        qs = Holiday.objects.filter(schedule=schedule).order_by("date")
        year_param = request.query_params.get("year")
        if year_param is not None:
            try:
                year = int(year_param)
            except ValueError:
                return Response({"error": "year must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
            qs = qs.filter(date__year=year)

        serializer = HolidaySerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        schedule = self._get_schedule(pk)
        if schedule is None:
            return Response({"error": "Work schedule not found."}, status=status.HTTP_404_NOT_FOUND)

        data = {**request.data, "schedule": str(schedule.id)}
        serializer = HolidaySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InstanceHolidayDetailEndpoint(BaseAPIView):
    """Partially update or delete a specific Holiday."""

    permission_classes = [InstanceAdminPermission]

    def _get_holiday(self, pk, holiday_pk):
        try:
            return Holiday.objects.get(pk=holiday_pk, schedule_id=pk)
        except Holiday.DoesNotExist:
            return None

    def patch(self, request, pk, holiday_pk):
        holiday = self._get_holiday(pk, holiday_pk)
        if holiday is None:
            return Response({"error": "Holiday not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = HolidaySerializer(holiday, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, holiday_pk):
        holiday = self._get_holiday(pk, holiday_pk)
        if holiday is None:
            return Response({"error": "Holiday not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            holiday.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            log_exception(e)
            return Response({"error": "Failed to delete holiday."}, status=status.HTTP_400_BAD_REQUEST)
