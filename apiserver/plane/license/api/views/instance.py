# Python imports
import json
import os
import requests
import uuid
import random
import string

# Django imports
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.conf import settings

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

# Module imports
from plane.app.views import BaseAPIView
from plane.license.models import Instance, InstanceAdmin, InstanceConfiguration
from plane.license.api.serializers import (
    InstanceSerializer,
    InstanceAdminSerializer,
    InstanceConfigurationSerializer,
)
from plane.license.api.permissions import (
    InstanceAdminPermission,
)
from plane.db.models import User
from plane.license.utils.encryption import encrypt_data


class InstanceEndpoint(BaseAPIView):
    def get_permissions(self):
        if self.request.method == "PATCH":
            return [
                InstanceAdminPermission(),
            ]
        return [
            AllowAny(),
        ]

    def post(self, request):
        # Check if the instance is registered
        instance = Instance.objects.first()

        # If instance is None then register this instance
        if instance is None:
            with open("package.json", "r") as file:
                # Load JSON content from the file
                data = json.load(file)

            headers = {"Content-Type": "application/json"}

            payload = {
                "instance_key": settings.INSTANCE_KEY,
                "version": data.get("version", 0.1),
                "machine_signature": os.environ.get("MACHINE_SIGNATURE"),
                "user_count": User.objects.filter(is_bot=False).count(),
            }

            response = requests.post(
                f"{settings.LICENSE_ENGINE_BASE_URL}/api/instances/",
                headers=headers,
                data=json.dumps(payload),
            )

            if response.status_code == 201:
                data = response.json()
                # Create instance
                instance = Instance.objects.create(
                    instance_name="Plane Free",
                    instance_id=data.get("id"),
                    license_key=data.get("license_key"),
                    api_key=data.get("api_key"),
                    version=data.get("version"),
                    last_checked_at=timezone.now(),
                    user_count=data.get("user_count", 0),
                )

                serializer = InstanceSerializer(instance)
                data = serializer.data
                data["is_activated"] = True
                return Response(
                    data,
                    status=status.HTTP_201_CREATED,
                )
            return Response(
                {"error": "Instance could not be registered"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        else:
            return Response(
                {"message": "Instance already registered"},
                status=status.HTTP_200_OK,
            )

    def get(self, request):
        instance = Instance.objects.first()
        # get the instance
        if instance is None:
            return Response(
                {"is_activated": False, "is_setup_done": False},
                status=status.HTTP_200_OK,
            )
        # Return instance
        serializer = InstanceSerializer(instance)
        data = serializer.data
        data["is_activated"] = True
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request):
        # Get the instance
        instance = Instance.objects.first()
        serializer = InstanceSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Save the user in control center
            headers = {
                "Content-Type": "application/json",
                "x-instance-id": instance.instance_id,
                "x-api-key": instance.api_key,
            }
            # Update instance settings in the license engine
            _ = requests.patch(
                f"{settings.LICENSE_ENGINE_BASE_URL}/api/instances/",
                headers=headers,
                data=json.dumps(
                    {
                        "is_support_required": serializer.data["is_support_required"],
                        "is_telemetry_enabled": serializer.data["is_telemetry_enabled"],
                        "version": serializer.data["version"],
                    }
                ),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InstanceAdminEndpoint(BaseAPIView):
    permission_classes = [
        InstanceAdminPermission,
    ]

    # Create an instance admin
    def post(self, request):
        email = request.data.get("email", False)
        role = request.data.get("role", 20)

        if not email:
            return Response(
                {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        instance = Instance.objects.first()
        if instance is None:
            return Response(
                {"error": "Instance is not registered yet"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Fetch the user
        user = User.objects.get(email=email)

        instance_admin = InstanceAdmin.objects.create(
            instance=instance,
            user=user,
            role=role,
        )
        serializer = InstanceAdminSerializer(instance_admin)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request):
        instance = Instance.objects.first()
        if instance is None:
            return Response(
                {"error": "Instance is not registered yet"},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance_admins = InstanceAdmin.objects.filter(instance=instance)
        serializer = InstanceAdminSerializer(instance_admins, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        instance = Instance.objects.first()
        instance_admin = InstanceAdmin.objects.filter(instance=instance, pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InstanceConfigurationEndpoint(BaseAPIView):
    permission_classes = [
        InstanceAdminPermission,
    ]

    def get(self, request):
        instance_configurations = InstanceConfiguration.objects.all()
        serializer = InstanceConfigurationSerializer(instance_configurations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        configurations = InstanceConfiguration.objects.filter(
            key__in=request.data.keys()
        )

        bulk_configurations = []
        for configuration in configurations:
            value = request.data.get(configuration.key, configuration.value)
            if value is not None and configuration.key in [
                "OPENAI_API_KEY",
                "GITHUB_CLIENT_SECRET",
                "EMAIL_HOST_PASSWORD",
                "UNSPLASH_ACESS_KEY",
            ]:
                configuration.value = encrypt_data(value)
            else:
                configuration.value = value
            bulk_configurations.append(configuration)

        InstanceConfiguration.objects.bulk_update(
            bulk_configurations, ["value"], batch_size=100
        )

        serializer = InstanceConfigurationSerializer(configurations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return (
        str(refresh.access_token),
        str(refresh),
    )


class InstanceAdminSignInEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check instance first
        instance = Instance.objects.first()
        if instance is None:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # check if the instance is already activated
        if InstanceAdmin.objects.first():
            return Response(
                {"error": "Admin for this instance is already registered"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the email and password from all the user
        email = request.data.get("email", False)
        password = request.data.get("password", False)

        # return error if the email and password is not present
        if not email or not password:
            return Response(
                {"error": "Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate the email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError as e:
            return Response(
                {"error": "Please provide a valid email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if already a user exists or not
        user = User.objects.filter(email=email).first()

        # Existing user
        if user:
            # Check user password
            if not user.check_password(password):
                return Response(
                    {
                        "error": "Sorry, we could not find a user with the provided credentials. Please try again."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            user = User.objects.create(
                email=email,
                username=uuid.uuid4().hex,
                password=make_password(password),
                is_password_autoset=False,
            )

        # settings last active for the user
        user.is_active = True
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = request.META.get("REMOTE_ADDR")
        user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.save()

        # Save the user in control center
        headers = {
            "Content-Type": "application/json",
            "x-instance-id": instance.instance_id,
            "x-api-key": instance.api_key,
        }
        _ = requests.patch(
            f"{settings.LICENSE_ENGINE_BASE_URL}/api/instances/",
            headers=headers,
            data=json.dumps({"is_setup_done": True}),
        )

        # Also register the user as admin
        _ = requests.post(
            f"{settings.LICENSE_ENGINE_BASE_URL}/api/instances/users/register/",
            headers=headers,
            data=json.dumps(
                {
                    "email": str(user.email),
                    "signup_mode": "MAGIC_CODE",
                    "is_admin": True,
                }
            ),
        )

        # Register the user as an instance admin
        _ = InstanceAdmin.objects.create(
            user=user,
            instance=instance,
        )
        # Make the setup flag True
        instance.is_setup_done = True
        instance.save()

        # get tokens for user
        access_token, refresh_token = get_tokens_for_user(user)
        data = {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
        return Response(data, status=status.HTTP_200_OK)


class SignUpScreenVisitedEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        instance = Instance.objects.first()

        if instance is None:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not instance.is_signup_screen_visited:
            instance.is_signup_screen_visited = True
            instance.save()
            # set the headers
            headers = {
                "Content-Type": "application/json",
                "x-instance-id": instance.instance_id,
                "x-api-key": instance.api_key,
            }
            # create the payload
            payload = {"is_signup_screen_visited": True}
            _ = requests.patch(
                f"{settings.LICENSE_ENGINE_BASE_URL}/api/instances/",
                headers=headers,
                data=json.dumps(payload),
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
