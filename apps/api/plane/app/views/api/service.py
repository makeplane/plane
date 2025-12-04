# Python import
from uuid import uuid4

# Third party
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status

# Module import
from .base import BaseAPIView
from plane.db.models import APIToken, Workspace
from plane.app.permissions import WorkspaceEntityPermission


class ServiceApiTokenEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    def post(self, request: Request, slug: str) -> Response:
        workspace = Workspace.objects.get(slug=slug)

        api_token = APIToken.objects.filter(workspace=workspace, is_service=True).first()

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
            return Response({"token": str(api_token.token)}, status=status.HTTP_201_CREATED)
