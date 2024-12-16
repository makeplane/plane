# python imports
import json

# Django imports
from django.db.models import Q, Count
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.serializers import (
    ProjectFeatureSerializer
)
from plane.app.permissions import allow_permission, ROLE
from plane.ee.models import (
    ProjectFeature,
)
from plane.db.models import Issue
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.project_activites_task import project_activity

class ProjectAnalyticsEndpoint(BaseAPIView):

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ],
        level="WORKSPACE",
    )
    def get(self, request, slug, project_id):
        # Annotate the counts for different states in one query
        issues = Issue.issue_objects.filter(
            project_id=project_id, workspace__slug=slug
        ).aggregate(
            backlog_issues=Count("id", filter=Q(state__group="backlog")),
            unstarted_issues=Count("id", filter=Q(state__group="unstarted")),
            started_issues=Count("id", filter=Q(state__group="started")),
            completed_issues=Count("id", filter=Q(state__group="completed")),
            cancelled_issues=Count("id", filter=Q(state__group="cancelled")),
            overdue_issues=Count(
                "id", filter=Q(target_date__lt=timezone.now())
            ),
        )

        return Response(issues, status=status.HTTP_200_OK)

class ProjectFeatureEndpoint(BaseAPIView):
    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ],
    )
    def get(self, request, slug, pk):
        project_feature, _ = ProjectFeature.objects.get_or_create(
            project_id=pk, workspace__slug=slug
        )
        serializer = ProjectFeatureSerializer(project_feature)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, pk):
        project_feature = ProjectFeature.objects.get(
            project_id=pk, workspace__slug=slug
        )
        current_instance = json.dumps(
            ProjectFeatureSerializer(project_feature).data, cls=DjangoJSONEncoder
        )

        serializer = ProjectFeatureSerializer(
            project_feature, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            project_activity.delay(
                type="project.activity.updated",
                requested_data=json.dumps(
                    serializer.data, cls=DjangoJSONEncoder
                ),
                actor_id=str(self.request.user.id),
                project_id=str(self.kwargs.get("project_id")),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
