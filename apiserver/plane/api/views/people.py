# Third party imports
from rest_framework.response import Response
from rest_framework import status

from sentry_sdk import capture_exception

# Module imports
from plane.api.serializers import (
    UserSerializer,
)

from plane.api.views.base import BaseViewSet, BaseAPIView
from plane.db.models import User



class PeopleEndpoint(BaseAPIView):

    filterset_fields = ("date_joined",)

    search_fields = (
        "^first_name",
        "^last_name",
        "^email",
        "^username",
    )

    def get(self, request):
        try:
            users = User.objects.all().order_by("-date_joined")
            if (
                request.GET.get("search", None) is not None
                and len(request.GET.get("search")) < 3
            ):
                return Response(
                    {"message": "Search term must be at least 3 characters long"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return self.paginate(
                request=request,
                queryset=self.filter_queryset(users),
                on_results=lambda data: UserSerializer(data, many=True).data,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"message": "Something went wrong"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserEndpoint(BaseViewSet):
    serializer_class = UserSerializer
    model = User

    def get_object(self):
        return self.request.user



class UpdateUserOnBoardedEndpoint(BaseAPIView):
    def patch(self, request):
        try:
            user = User.objects.get(pk=request.user.id)
            user.is_onboarded = request.data.get("is_onboarded", False)
            user.save()
            return Response(
                {"message": "Updated successfully"}, status=status.HTTP_200_OK
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
