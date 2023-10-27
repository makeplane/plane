# Python imports
import os
import json
import requests

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

# Module imports
from plane.api.views import BaseAPIView
from plane.license.models import License


class InstanceEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        email = request.data.get("email", False)

        with open("package.json", "r") as file:
            # Load JSON content from the file
            data = json.load(file)

        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        LICENSE_ENGINE_BASE_URL = os.environ.get("LICENSE_ENGINE_BASE_URL", "")

        headers = {"Content-Type": "application/json"}

        payload = {"email": email, "version": data.get("version", 0.1)}

        response = requests.post(
            f"{LICENSE_ENGINE_BASE_URL}/api/instances",
            headers=headers,
            data=json.dumps(payload),
        )

        if response.status_code == 201:
            data = response.json()
            license = License.objects.create(
                instance_id=data.get("id"),
                license_key=data.get("license_key"),
                api_key=data.get("api_key"),
                version=data.get("version"),
                email=data.get("email"),
                last_checked_at=timezone.now(),
            )
            return Response(
                {
                    "id": str(license.instance_id),
                    "message": "Instance registered succesfully",
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "Unable to create instance"}, status=response.status_code
        )

    def get(self, request):
        license = License.objects.first()

        if license is None:
            return Response({"activated": False}, status=status.HTTP_403_FORBIDDEN)

        data = {
            "instance_id": license.instance_id,
            "version": license.version,
            "activated": True,
        }

        return Response(data, status=status.HTTP_200_OK)
