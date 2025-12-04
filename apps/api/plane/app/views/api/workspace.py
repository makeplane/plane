# Python import
from typing import Optional

# Third party
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status

# Module import
from plane.app.views import BaseAPIView
from plane.db.models import APIToken
from plane.app.serializers import APITokenSerializer, APITokenReadSerializer
from plane.app.permissions import WorkSpaceAdminPermission


class WorkspaceAPITokenEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def post(self, request: Request, slug: str) -> Response:
        serializer = APITokenSerializer(data=request.data, context={"workspace_slug": slug, "user": request.user})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request: Request, slug: str, pk: Optional[str] = None) -> Response:
        if pk is None:
            api_tokens = APIToken.objects.filter(workspace__slug=slug, is_service=False, user=request.user)
            serializer = APITokenReadSerializer(api_tokens, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            api_tokens = APIToken.objects.get(workspace__slug=slug, pk=pk, user=request.user)
            serializer = APITokenReadSerializer(api_tokens)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request: Request, slug: str, pk: str) -> Response:
        api_token = APIToken.objects.get(workspace__slug=slug, pk=pk, is_service=False, user=request.user)
        api_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
