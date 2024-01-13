# Python import
from uuid import uuid4

# Third party
from rest_framework.response import Response
from rest_framework import status

# Module import
from .base import BaseAPIView
from plane.db.models import APIToken, Workspace
from plane.app.serializers import APITokenSerializer, APITokenReadSerializer
from plane.app.permissions import WorkspaceOwnerPermission


class ApiTokenEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceOwnerPermission,
    ]

    def post(self, request, slug):
        label = request.data.get("label", str(uuid4().hex))
        description = request.data.get("description", "")
        workspace = Workspace.objects.get(slug=slug)
        expired_at = request.data.get("expired_at", None)

        # Check the user type
        user_type = 1 if request.user.is_bot else 0

        api_token = APIToken.objects.create(
            label=label,
            description=description,
            user=request.user,
            workspace=workspace,
            user_type=user_type,
            expired_at=expired_at,
        )

        serializer = APITokenSerializer(api_token)
        # Token will be only visible while creating
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    def get(self, request, slug, pk=None):
        if pk == None:
            api_tokens = APIToken.objects.filter(
                user=request.user, workspace__slug=slug
            )
            serializer = APITokenReadSerializer(api_tokens, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            api_tokens = APIToken.objects.get(
                user=request.user, workspace__slug=slug, pk=pk
            )
            serializer = APITokenReadSerializer(api_tokens)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug, pk):
        api_token = APIToken.objects.get(
            workspace__slug=slug,
            user=request.user,
            pk=pk,
        )
        api_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, slug, pk):
        api_token = APIToken.objects.get(
            workspace__slug=slug,
            user=request.user,
            pk=pk,
        )
        serializer = APITokenSerializer(
            api_token, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
