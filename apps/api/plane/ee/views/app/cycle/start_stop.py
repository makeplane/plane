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

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Django imports
from django.utils import timezone

# Module imports
from plane.utils.timezone_converter import convert_to_utc_with_timestamp
from plane.ee.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Cycle
from plane.ee.models import ProjectFeature
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag, check_workspace_feature_flag


class CycleStartStopEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.CYCLE_PROGRESS_CHARTS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
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

            current_datetime = convert_to_utc_with_timestamp(project_id, current_date)

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

                cycle.end_date = current_datetime

            if action == "START":
                # Check if the project has parallel cycles enabled
                is_project_parallel = bool(
                    ProjectFeature.objects.filter(project_id=project_id, workspace__slug=slug)
                    .values_list("is_parallel_cycles_enabled", flat=True)
                    .first()
                )
                is_flag_enabled = check_workspace_feature_flag(FeatureFlag.PARALLEL_CYCLES, slug)
                allow_parallel = is_project_parallel and is_flag_enabled

                if allow_parallel:
                    # In parallel mode any upcoming cycle can be started — validate only
                    # that this cycle hasn't already started (start_date is in the future)
                    upcoming_cycles = (
                        Cycle.objects.filter(
                            workspace__slug=slug,
                            project_id=project_id,
                            project__archived_at__isnull=True,
                            start_date__gt=current_datetime,
                        ).accessible_to(request.user.id, slug)
                    )

                    if not upcoming_cycles.filter(id=cycle_id).exists():
                        return Response(
                            {"error": "Cycle is not upcoming."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                else:
                    """
                    # fetch all the upcoming cycles and sort them by start date and
                    # check if the current cycle is equal to the first cycle in the list
                    """
                    upcoming_cycles = (
                        Cycle.objects.filter(
                            workspace__slug=slug,
                            project_id=project_id,
                            project__archived_at__isnull=True,
                        )
                        .filter(start_date__gt=current_datetime)
                        .order_by("start_date")
                    ).accessible_to(request.user.id, slug)

                    upcoming_first_cycle = upcoming_cycles.first()

                    if upcoming_first_cycle is not None and str(cycle_id) != str(upcoming_first_cycle.id):
                        return Response(
                            {"error": "Cycle is not the next upcoming cycle."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                cycle.start_date = current_datetime

            cycle.save()

            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
