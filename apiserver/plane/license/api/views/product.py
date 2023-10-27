# Python imports
import os
import requests

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.views.base import BaseAPIView
from plane.license.models import License


class ProductEndpoint(BaseAPIView):
    def get(self, request, slug):
        LICENSE_ENGINE_BASE_URL = os.environ.get("LICENSE_ENGINE_BASE_URL", "")

        license = License.objects.first()

        if license is None:
            return Response(
                {"error": "Instance is not activated"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # # Request the licensing engine
        headers = {
            "x-api-key": license.api_key,
        }

        response = requests.get(
            f"{LICENSE_ENGINE_BASE_URL}/api/products",
            headers=headers,
        )

        if response.status_code == 200:
            return Response(response.json(), status=status.HTTP_200_OK)
        return Response(
            {"error": "Unable to fetch products"}, status=response.status_code
        )
