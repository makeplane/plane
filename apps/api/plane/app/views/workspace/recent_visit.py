# Third party imports
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import UserRecentVisit
from plane.app.serializers import WorkspaceRecentVisitSerializer

# Modules imports
from ..base import BaseViewSet
from plane.app.permissions import allow_permission, ROLE


class UserRecentVisitViewSet(BaseViewSet):
    model = UserRecentVisit
    use_read_replica = True

    def get_serializer_class(self):
        return WorkspaceRecentVisitSerializer

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        user_recent_visits = UserRecentVisit.objects.filter(
            workspace__slug=slug, user=request.user
        )

        entity_name = request.query_params.get("entity_name")

        if entity_name:
            user_recent_visits = user_recent_visits.filter(entity_name=entity_name)

        user_recent_visits = user_recent_visits.filter(
            entity_name__in=["issue", "page", "project"]
        )

        serializer = WorkspaceRecentVisitSerializer(user_recent_visits[:20], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
