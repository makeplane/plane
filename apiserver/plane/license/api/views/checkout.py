# Python imports
import os
import json
import requests

# Django imports
from django.conf import settings

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.views.base import BaseAPIView
from plane.db.models import Workspace, WorkspaceMember
from plane.license.models import License

class CheckoutEndpoint(BaseAPIView):

    def post(self, request, slug):
        LICENSE_ENGINE_BASE_URL = os.environ.get("LICENSE_ENGINE_BASE_URL", "")

        license = License.objects.first()

        if license is None:
            return Response({"error": "Instance is not activated"}, status=status.HTTP_400_BAD_REQUEST)


        price_id = request.data.get("price_id", False)

        if not price_id :
            return Response(
                {"error": "Price ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)
        total_workspace_members = WorkspaceMember.objects.filter(workspace__slug=slug).count()

        payload = {
            "user": {
                "id": str(request.user.id),
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
                "email": request.user.email,
            },
            "workspace": {
                "id": str(workspace.id),
                "name": str(workspace.name),
                "slug": str(slug),
            },
            "priceId": price_id,
            "seats": total_workspace_members,
            "return_url": settings.WEB_URL,
        }

        headers = {
            "Content-Type": "application/json",
            "X-Api-Key": str(license.api_key),
        }

        response = requests.post(
            f"{LICENSE_ENGINE_BASE_URL}/api/checkout/create-session",
            data=json.dumps(payload),
            headers=headers,
        )

        if response.status_code == 200:
            return Response(response.json(), status=status.HTTP_200_OK)
        
        return Response({"error": "Unable to create a checkout try again later"}, status=response.status_code)
