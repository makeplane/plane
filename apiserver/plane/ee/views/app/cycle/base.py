# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Django imports
from django.utils import timezone

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.ee.models import EntityProgress
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.db.models import Workspace, Cycle
from plane.app.serializers import EntityProgressSerializer
from plane.ee.utils.entity_state_progress import (
    calculate_entity_issue_state_progress,
)


class CycleIssueStateAnalyticsEndpoint(BaseAPIView):

    @check_feature_flag(FeatureFlag.CYCLE_PROGRESS_CHARTS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, cycle_id):
        workspace = Workspace.objects.get(slug=slug)

        # Get the cycle to check if it has ended
        cycle = Cycle.objects.get(pk=cycle_id)

        if not cycle.start_date or not cycle.end_date:
            return Response(
                {"error": "Cycle has no start or end date"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cycle_state_progress = EntityProgress.objects.filter(
            cycle_id=cycle_id, entity_type="CYCLE", workspace__slug=slug
        ).order_by("progress_date")

        current_time = timezone.now()
        cycle_not_ended = cycle.end_date > current_time

        # Generate additional data only if the cycle has not ended
        if cycle_not_ended:
            # Check if EntityProgress exists for yesterday's date
            yesterday = current_time - timezone.timedelta(days=1)
            yesterday_progress = EntityProgress.objects.filter(
                progress_date=yesterday.date(),
                cycle_id=cycle_id,
                entity_type="CYCLE",
                workspace__slug=slug,
            ).exists()

            # If it doesn't exist, calculate the progress for yesterday
            # This can happen if the user is accessing the page after midnight before the background task runs
            if not yesterday_progress:
                yesterday_data = calculate_entity_issue_state_progress(
                    current_date=yesterday, cycles=[(cycle_id, workspace.id)]
                )
                cycle_state_progress = list(cycle_state_progress) + yesterday_data

            # Generate today's data
            today_data = calculate_entity_issue_state_progress(
                current_date=current_time, cycles=[(cycle_id, workspace.id)]
            )

            # Combine existing data with today's data
            cycle_state_progress = list(cycle_state_progress) + today_data
        else:
            # Cycle has ended, check if we have data for the end date
            end_date_progress = EntityProgress.objects.filter(
                progress_date=cycle.end_date.date(),
                cycle_id=cycle_id,
                entity_type="CYCLE",
                workspace__slug=slug,
            ).exists()

            # If end date progress doesn't exist, calculate it
            if not end_date_progress:
                end_date_data = calculate_entity_issue_state_progress(
                    current_date=cycle.end_date, cycles=[(cycle_id, workspace.id)]
                )
                cycle_state_progress = list(cycle_state_progress) + end_date_data

        return Response(
            EntityProgressSerializer(cycle_state_progress, many=True).data,
            status=status.HTTP_200_OK,
        )
