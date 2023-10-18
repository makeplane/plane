# Python import
from uuid import uuid4

# Third party
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module import
from .base import BaseAPIView
from plane.db.models import APIToken
from plane.api.serializers import APITokenSerializer


class ApiTokenEndpoint(BaseAPIView):
    def post(self, request):
        label = request.data.get("label", str(uuid4().hex))
        workspace = request.data.get("workspace", False)

        if not workspace:
            return Response(
                {"error": "Workspace is required"}, status=status.HTTP_200_OK
            )

        api_token = APIToken.objects.create(
            label=label, user=request.user, workspace_id=workspace
        )

        serializer = APITokenSerializer(api_token)
        # Token will be only vissible while creating
        return Response(
            {"api_token": serializer.data, "token": api_token.token},
            status=status.HTTP_201_CREATED,
        )


    def get(self, request):
        api_tokens = APIToken.objects.filter(user=request.user)
        serializer = APITokenSerializer(api_tokens, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


    def delete(self, request, pk):
        api_token = APIToken.objects.get(pk=pk)
        api_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

