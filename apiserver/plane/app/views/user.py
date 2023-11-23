# Third party imports
from rest_framework.response import Response
from rest_framework import status


# Module imports
from plane.app.serializers import (
    UserSerializer,
    IssueActivitySerializer,
    UserMeSerializer,
    UserMeSettingsSerializer,
)

from plane.app.views.base import BaseViewSet, BaseAPIView
from plane.db.models import User, IssueActivity, WorkspaceMember
from plane.license.models import Instance, InstanceAdmin
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

    def retrieve_instance_admin(self, request):
        instance = Instance.objects.first()
        is_admin = InstanceAdmin.objects.filter(
            instance=instance, user=request.user
        ).exists()
        return Response({"is_instance_admin": is_admin}, status=status.HTTP_200_OK)

    def deactivate(self, request):
        # Check all workspace user is active
        user = self.get_object()
        if WorkspaceMember.objects.filter(member=request.user, is_active=True).exists():
            return Response(
                {
                    "error": "User cannot deactivate account as user is active in some workspaces"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deactivate the user
        user.is_active = False
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UpdateUserOnBoardedEndpoint(BaseAPIView):
    def patch(self, request):
        user = User.objects.get(pk=request.user.id, is_active=True)
        user.is_onboarded = request.data.get("is_onboarded", False)
        user.save()
        return Response({"message": "Updated successfully"}, status=status.HTTP_200_OK)


class UpdateUserTourCompletedEndpoint(BaseAPIView):
    def patch(self, request):
        user = User.objects.get(pk=request.user.id, is_active=True)
        user.is_tour_completed = request.data.get("is_tour_completed", False)
        user.save()
        return Response({"message": "Updated successfully"}, status=status.HTTP_200_OK)


class UserActivityEndpoint(BaseAPIView, BasePaginator):
    def get(self, request):
        queryset = IssueActivity.objects.filter(
            actor=request.user
        ).select_related("actor", "workspace", "issue", "project")

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda issue_activities: IssueActivitySerializer(
                issue_activities, many=True
            ).data,
        )
