# Python imports
import os
import json
import requests
import uuid

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

# Module imports
from plane.api.views import BaseAPIView
from plane.license.models import Instance
from plane.license.api.serializers import InstanceSerializer
from plane.db.models import User


class InstanceEndpoint(BaseAPIView):
    def get_permissions(self):
        if self.request.method == "PATCH":
            self.permission_classes = [
                IsAuthenticated,
            ]
        else:
            self.permission_classes = [
                AllowAny,
            ]

        return super(InstanceEndpoint, self).get_permissions()

    def post(self, request):
        email = request.data.get("email", False)
        password = request.data.get("password", False)

        with open("package.json", "r") as file:
            # Load JSON content from the file
            data = json.load(file)

        if not email or not password:
            return Response(
                {"error": "Email and Password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance = Instance.objects.first()

        if instance is None:
            # Register the instance
            user = User.objects.filter(email=email).first()
            if user is None:
                user = User.objects.create(
                    email=email,
                    username=uuid.uuid4().hex,
                )
                user.set_password(password)
                user.save()
            else:
                if not user.check_password(password):
                    return Response(
                        {
                            "error": "Sorry, we could not find a user with the provided credentials. Please try again."
                        },
                        status=status.HTTP_401_UNAUTHORIZED,
                    )

            LICENSE_ENGINE_BASE_URL = os.environ.get("LICENSE_ENGINE_BASE_URL", "")

            headers = {"Content-Type": "application/json"}

            payload = {
                "email": email,
                "version": data.get("version", 0.1),
                "domain": str(request.headers.get("Host")),
            }

            response = requests.post(
                f"{LICENSE_ENGINE_BASE_URL}/api/instances",
                headers=headers,
                data=json.dumps(payload),
            )

            if response.status_code == 201:
                data = response.json()
                instance = Instance.objects.create(
                    instance_id=data.get("id"),
                    license_key=data.get("license_key"),
                    api_key=data.get("api_key"),
                    version=data.get("version"),
                    email=data.get("email"),
                    user=user,
                    last_checked_at=timezone.now(),
                )

                serializer = InstanceSerializer(instance)

                return Response(
                    {
                        "data": serializer.data,
                        "message": "Instance registered succesfully",
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(
                {"error": "Unable to create instance"}, status=response.status_code
            )

        serializer = InstanceSerializer(instance)

        return Response(
            {
                "message": "Instance is already registered",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def get(self, request):
        instance = Instance.objects.first()

        if instance is None:
            return Response({"activated": False}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InstanceSerializer(instance)

        data = {
            "data": serializer.data,
            "activated": True,
        }

        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request):
        instance = Instance.objects.first()
        serializer = InstanceSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TransferOwnerEndpoint(BaseAPIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request):
        instance = Instance.objects.first()

        if str(instance.user_id) != str(request.user.id):
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get("user_id", False)

        if not user_id:
            return Response(
                {"error": "User is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.get(pk=user_id)

        instance.user = user
        instance.save()
        return Response(
            {"message": "Owner successfully updated"}, status=status.HTTP_200_OK
        )
