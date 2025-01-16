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
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class CycleStartStopEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.CYCLE_MANUAL_START_STOP)
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

            cycle = Cycle.objects.get(
                workspace__slug=slug, project_id=project_id, id=cycle_id
            )
            if cycle is None:
                return Response(
                    {"error": "Cycle not found"}, status=status.HTTP_404_NOT_FOUND
                )

            current_datetime = convert_to_utc_with_timestamp(project_id, current_date)

            if action == "STOP":
                """
                # fetch all the active cycles and check if the current cycle is in the 
                # active cycles
                """
                active_cycles = Cycle.objects.filter(
                    workspace__slug=slug,
                    project_id=project_id,
                    project__archived_at__isnull=True,
                    project__project_projectmember__member=request.user,
                    project__project_projectmember__is_active=True,
                ).filter(start_date__lte=timezone.now(), end_date__gte=timezone.now())

                if cycle not in active_cycles:
                    return Response(
                        {"error": "Cycle is not active."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                cycle.end_date = current_datetime

            if action == "START":
                """
                # fetch all the upcoming cycles cycles and sort them by start date and 
                # check if the current cycle is equal to the first cycle in the list
                """
                upcoming_cycles = (
                    Cycle.objects.filter(
                        workspace__slug=slug,
                        project_id=project_id,
                        project__archived_at__isnull=True,
                        project__project_projectmember__member=request.user,
                        project__project_projectmember__is_active=True,
                    )
                    .filter(start_date__gt=current_datetime)
                    .order_by("start_date")
                )

                upcoming_first_cycle = upcoming_cycles.first()

                if (
                    upcoming_first_cycle is not None
                    and cycle_id != upcoming_first_cycle.id
                ):
                    return Response(
                        {"error": "Cycle is not the next upcoming cycle."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                cycle.start_date = current_datetime

            cycle.save()

            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
