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
from plane.db.models import Workspace
from plane.app.serializers import EntityProgressSerializer
from plane.ee.utils.entity_state_progress import (
    calculate_entity_issue_state_progress,
)


class CycleIssueStateAnalyticsEndpoint(BaseAPIView):

    @check_feature_flag(FeatureFlag.CYCLE_PROGRESS_CHARTS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, cycle_id):
        workspace = Workspace.objects.get(slug=slug)
        cycle_state_progress = EntityProgress.objects.filter(
            cycle_id=cycle_id, entity_type="CYCLE", workspace__slug=slug
        ).order_by("progress_date")

        # Generate today's data
        today_data = calculate_entity_issue_state_progress(
            current_date=timezone.now(), cycles=[(cycle_id, workspace.id)]
        )

        # Combine existing data with today's data
        cycle_state_progress = list(cycle_state_progress) + today_data

        return Response(
            EntityProgressSerializer(cycle_state_progress, many=True).data,
            status=status.HTTP_200_OK,
        )
