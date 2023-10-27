# Third party imports
from rest_framework.response import Response
from rest_framework import status

from sentry_sdk import capture_exception

# Module imports
from plane.api.serializers import (
    UserSerializer,
    IssueActivitySerializer,
    UserMeSerializer,
    UserMeSettingsSerializer,
)

from plane.api.views.base import BaseViewSet, BaseAPIView
from plane.db.models import (
    User,
    Workspace,
    WorkspaceMemberInvite,
    Issue,
    IssueActivity,
)
from plane.utils.paginator import BasePaginator


class UserEndpoint(BaseViewSet):
    serializer_class = UserSerializer
    model = User

    def get_object(self):
        return self.request.user

    def retrieve(self, request):
        serialized_data = UserMeSerializer(request.user).data
        return Response(
            serialized_data,
            status=status.HTTP_200_OK,
        )

    def retrieve_user_settings(self, request):
        serialized_data = UserMeSettingsSerializer(request.user).data
        return Response(serialized_data, status=status.HTTP_200_OK)


class UpdateUserOnBoardedEndpoint(BaseAPIView):
    def patch(self, request):
        user = User.objects.get(pk=request.user.id)
        user.is_onboarded = request.data.get("is_onboarded", False)
        user.save()
        return Response({"message": "Updated successfully"}, status=status.HTTP_200_OK)


class UpdateUserTourCompletedEndpoint(BaseAPIView):
    def patch(self, request):
        user = User.objects.get(pk=request.user.id)
        user.is_tour_completed = request.data.get("is_tour_completed", False)
        user.save()
        return Response({"message": "Updated successfully"}, status=status.HTTP_200_OK)


class UserActivityEndpoint(BaseAPIView, BasePaginator):
    def get(self, request, slug):
        queryset = IssueActivity.objects.filter(
            actor=request.user, workspace__slug=slug
        ).select_related("actor", "workspace", "issue", "project")

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda issue_activities: IssueActivitySerializer(
                issue_activities, many=True
            ).data,
        )
