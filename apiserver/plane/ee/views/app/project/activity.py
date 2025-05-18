# Python imports

# Django imports
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.app.permissions import ProjectEntityPermission, allow_permission, ROLE
from plane.ee.models import WorkspaceActivity
from plane.payment.flags.flag_decorator import (
    check_feature_flag,
)
from plane.payment.flags.flag import FeatureFlag
from plane.ee.serializers import EpicActivitySerializer


class ProjectActivityEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @method_decorator(gzip_page)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    def get(self, request, slug, project_id):
        filters = {}
        if request.GET.get("created_at__gt", None) is not None:
            filters = {"created_at__gt": request.GET.get("created_at__gt")}

        project_activities = (
            WorkspaceActivity.objects.filter(project_id=project_id)
            .filter(
                ~Q(field__in=["comment", "vote", "reaction", "draft"]),
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
                workspace__slug=slug,
            )
            .filter(**filters)
            .select_related("actor", "workspace", "project")
        ).order_by("created_at")

        project_activities = EpicActivitySerializer(project_activities, many=True).data
        return Response(project_activities, status=status.HTTP_200_OK)
