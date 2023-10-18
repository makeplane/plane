# Python import
from uuid import uuid4

# Third party
from rest_framework.response import Response
from rest_framework import status

# Module import
from .base import BaseAPIView
from plane.db.models import APIToken, Workspace
from plane.api.serializers import APITokenSerializer
from plane.api.permissions import WorkspaceUserPermission


class ApiTokenEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceUserPermission,
    ]

    def post(self, request, slug):
        label = request.data.get("label", str(uuid4().hex))
        description = request.data.get("description", "")
        workspace = Workspace.objects.get(slug=slug)
        api_token = APIToken.objects.create(
            label=label,
            description=description,
            user=request.user,
            workspace=workspace,
        )

        serializer = APITokenSerializer(api_token)
        # Token will be only vissible while creating
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    def get(self, request, slug):
        api_tokens = APIToken.objects.filter(
            user=request.user,
            workspace__slug=slug,
        )
        serializer = APITokenSerializer(api_tokens, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug, pk):
        api_token = APIToken.objects.get(
            workspace__slug=slug,
            pk=pk,
        )
        api_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
