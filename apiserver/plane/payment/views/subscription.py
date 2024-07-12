# Python imports
import requests

# Django imports
from django.conf import settings

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.app.permissions.workspace import WorkspaceOwnerPermission
from plane.db.models import Workspace


class SubscriptionEndpoint(BaseAPIView):

    permission_classes = [
        WorkspaceOwnerPermission,
    ]

    def post(self, request, slug):
        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # Fetch the workspace subcription
        if settings.PAYMENT_SERVER_BASE_URL:
            # Make a cancel request to the payment server
            response = requests.post(
                f"{settings.PAYMENT_SERVER_BASE_URL}/api/subscriptions/check/",
                headers={
                    "content-type": "application/json",
                    "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                },
                json={"workspace_id": str(workspace.id)},
            )
            # Check if the response is successful
            response.raise_for_status()
            # Return the response
            response = response.json()
            # Check if the response contains the product key
            return Response(response, status=status.HTTP_200_OK)
        return Response(
            {"error": "error in checking workspace subscription"},
            status=status.HTTP_400_BAD_REQUEST,
        )
