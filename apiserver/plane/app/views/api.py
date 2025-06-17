# Python import
from uuid import uuid4
from typing import Optional

# Third party
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status

# Module import
from .base import BaseAPIView
from plane.db.models import APIToken, Workspace
from plane.app.serializers import APITokenSerializer, APITokenReadSerializer
from plane.app.permissions import WorkspaceEntityPermission


class ApiTokenEndpoint(BaseAPIView):
    def post(self, request: Request) -> Response:
        label = request.data.get("label", str(uuid4().hex))
        description = request.data.get("description", "")
        expired_at = request.data.get("expired_at", None)

        # Check the user type
        user_type = 1 if request.user.is_bot else 0

        api_token = APIToken.objects.create(
            label=label,
            description=description,
            user=request.user,
            user_type=user_type,
            expired_at=expired_at,
        )

        serializer = APITokenSerializer(api_token)
        # Token will be only visible while creating
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request: Request, pk: Optional[str] = None) -> Response:
        if pk is None:
            api_tokens = APIToken.objects.filter(user=request.user, is_service=False)
            serializer = APITokenReadSerializer(api_tokens, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            api_tokens = APIToken.objects.get(user=request.user, pk=pk)
            serializer = APITokenReadSerializer(api_tokens)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request: Request, pk: str) -> Response:
        api_token = APIToken.objects.get(user=request.user, pk=pk, is_service=False)
        api_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request: Request, pk: str) -> Response:
        api_token = APIToken.objects.get(user=request.user, pk=pk)
        serializer = APITokenSerializer(api_token, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ServiceApiTokenEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    def post(self, request: Request, slug: str) -> Response:
        workspace = Workspace.objects.get(slug=slug)

        api_token = APIToken.objects.filter(
            workspace=workspace, is_service=True
        ).first()

        if api_token:
            return Response({"token": str(api_token.token)}, status=status.HTTP_200_OK)
        else:
            # Check the user type
            user_type = 1 if request.user.is_bot else 0

            api_token = APIToken.objects.create(
                label=str(uuid4().hex),
                description="Service Token",
                user=request.user,
                workspace=workspace,
                user_type=user_type,
                is_service=True,
            )
            return Response(
                {"token": str(api_token.token)}, status=status.HTTP_201_CREATED
            )
