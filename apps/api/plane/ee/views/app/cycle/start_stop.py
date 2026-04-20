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

# Python imports
import pytz
from datetime import datetime, time

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Django imports
from django.utils import timezone

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.permissions import can, CyclePermissions
from plane.db.models import Cycle, Project
from plane.ee.models import ProjectFeature
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag, check_workspace_feature_flag


class CycleStartStopEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.CYCLE_PROGRESS_CHARTS)
    @can(CyclePermissions.EDIT, resource_param="cycle_id")
    def post(self, request, slug, project_id, cycle_id):
        try:
            # get the request data
            action = request.data.get("action", None)
            current_date = request.data.get("date", None)

            if action is None or current_date is None:
                return Response(
                    {"error": "action and date are required fields"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            cycle = Cycle.objects.get(workspace__slug=slug, project_id=project_id, id=cycle_id)
            if cycle is None:
                return Response({"error": "Cycle not found"}, status=status.HTTP_404_NOT_FOUND)

            if action == "STOP":
                """
                # fetch all the active cycles and check if the current cycle is in the 
                # active cycles
                """
                active_cycles = (
                    Cycle.objects.filter(
                        workspace__slug=slug,
                        project_id=project_id,
                        project__archived_at__isnull=True,
                    )
                    .filter(start_date__lte=timezone.now(), end_date__gte=timezone.now())
                    .accessible_to(request.user.id, slug)
                )

                if cycle not in active_cycles:
                    return Response(
                        {"error": "Cycle is not active."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                cycle.end_date = timezone.now()

            if action == "START":
                # Build the UTC bounds for the requested day in the project's timezone.
                # Automated cycles store start_date as midnight-in-project-tz → UTC, which
                # for timezones east of UTC (e.g. IST) is the *previous* UTC calendar day.
                # All comparisons must use this project-tz day window, not raw UTC .date().
                project_obj = Project.objects.get(id=project_id)
                local_tz = pytz.timezone(project_obj.timezone)
                date_obj = datetime.strptime(current_date, "%Y-%m-%d").date()
                day_start_utc = local_tz.localize(datetime.combine(date_obj, time.min)).astimezone(pytz.utc)

                # Check if the project has parallel cycles enabled
                is_project_parallel = bool(
                    ProjectFeature.objects.filter(project_id=project_id, workspace__slug=slug)
                    .values_list("is_parallel_cycles_enabled", flat=True)
                    .first()
                )
                is_flag_enabled = check_workspace_feature_flag(FeatureFlag.PARALLEL_CYCLES, slug)
                allow_parallel = is_project_parallel and is_flag_enabled

                if allow_parallel:
                    # Parallel mode: any cycle scheduled for today or later can be started.
                    # Use the project-tz day window instead of current UTC time so that
                    # cycles stored as midnight-IST (= prev UTC day) are correctly found.
                    upcoming_cycles = Cycle.objects.filter(
                        workspace__slug=slug,
                        project_id=project_id,
                        project__archived_at__isnull=True,
                        start_date__gte=day_start_utc,
                    ).accessible_to(request.user.id, slug)

                    if not upcoming_cycles.filter(id=cycle_id).exists():
                        return Response(
                            {"error": "Cycle is not upcoming."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                else:
                    # Non-parallel mode: the cycle must be the earliest upcoming one.
                    # Filter by the full UTC range covering today in project timezone.
                    upcoming_cycles = (
                        Cycle.objects.filter(
                            workspace__slug=slug,
                            project_id=project_id,
                            project__archived_at__isnull=True,
                            start_date__gte=day_start_utc,
                        ).order_by("start_date")
                    ).accessible_to(request.user.id, slug)

                    upcoming_first_cycle = upcoming_cycles.first()
                    if upcoming_first_cycle is not None and str(cycle_id) != str(upcoming_first_cycle.id):
                        return Response(
                            {"error": "Cycle is not the next upcoming cycle."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                cycle.start_date = timezone.now()

            cycle.save()

            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
