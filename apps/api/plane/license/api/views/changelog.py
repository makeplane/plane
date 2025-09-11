# Python imports
import requests
import os

# Django imports
from django.utils import timezone
from django.conf import settings

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

# plane imports
from .base import BaseAPIView

# plane license imports
from plane.license.models import Instance


class CheckUpdateEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get_instance_me(self):
        # Get the prime host, license key and machine signature
        prime_host = os.environ.get("PRIME_HOST", False)
        license_key = os.environ.get("LICENSE_KEY", False)
        machine_signature = os.environ.get("MACHINE_SIGNATURE", False)

        if settings.IS_AIRGAPPED:
            return {}

        response = requests.get(
            f"{prime_host}/api/v2/instances/me/",
            headers={
                "Content-Type": "application/json",
                "X-Machine-Signature": str(machine_signature),
                "X-Api-Key": str(license_key),
            },
        )

        # Raise an exception if the status code is not 200
        response.raise_for_status()

        # Get the data from the response
        data = response.json()
        return data

    def update_instance(self, instance, data):
        instance.last_checked_at = timezone.now()
        instance.current_version = data.get("user_version", instance.current_version)
        instance.latest_version = data.get("latest_version", instance.latest_version)
        instance.save()

    def get(self, request):
        try:
            # Fetch the instance
            instance = Instance.objects.first()

            data = self.get_instance_me()
            # Update the instance data
            self.update_instance(instance, data)

            # Return the current and latest version
            return Response(
                {
                    "current_version": instance.current_version,
                    "latest_version": instance.latest_version,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            print(e)
            return Response(
                {"error": "could not fetch new release please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
