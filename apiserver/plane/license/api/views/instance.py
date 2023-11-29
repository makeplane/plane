# Python imports
import json
import os
import requests
import uuid

# Django imports
from django.utils import timezone
from django.contrib.auth.hashers import make_password

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
from plane.settings.redis import redis_instance
from plane.bgtasks.user_count_task import update_user_instance_user_count

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

            license_engine_base_url = os.environ.get("LICENSE_ENGINE_BASE_URL")

            if not license_engine_base_url:
                raise Response(
                    {"error": "LICENSE_ENGINE_BASE_URL is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            headers = {"Content-Type": "application/json"}

            payload = {
                "instance_key": os.environ.get("INSTANCE_KEY"),
                "version": data.get("version", 0.1),
                "machine_signature": os.environ.get("MACHINE_SIGNATURE"),
                "user_count": User.objects.filter(is_bot=False).count(),
            }

            response = requests.post(
                f"{license_engine_base_url}/api/instances/",
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
                status=status.HTTP_400_BAD_REQUEST,
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


class AdminSetupMagicSignInEndpoint(BaseAPIView):
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

        license_engine_base_url = os.environ.get("LICENSE_ENGINE_BASE_URL", False)
        if not license_engine_base_url:
            return Response(
                {"error": "License engine base url is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_token = request.data.get("token", "").strip()
        key = request.data.get("key", False).strip().lower()

        if not key or user_token == "":
            return Response(
                {"error": "User token and key are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if InstanceAdmin.objects.first():
            return Response(
                {"error": "Admin for this instance is already registered"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ri = redis_instance()

        if ri.exists(key):
            data = json.loads(ri.get(key))

            token = data["token"]
            email = data["email"]

            if str(token) == str(user_token):
                user = User.objects.filter(email=email).first()
                if user is None:
                    # Sign In Case
                    user = User.objects.create(
                        email=email,
                        username=uuid.uuid4().hex,
                        password=make_password(uuid.uuid4().hex),
                        is_password_autoset=True,
                    )

                user.is_active = True
                user.is_email_verified = True
                user.last_active = timezone.now()
                user.last_login_time = timezone.now()
                user.last_login_ip = request.META.get("REMOTE_ADDR")
                user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
                user.token_updated_at = timezone.now()
                user.save()

                # Make the setup flag True
                instance.is_setup_done = True
                instance.save()

                # Save the user in control center
                headers = {
                    "Content-Type": "application/json",
                    "x-instance-id": instance.instance_id,
                    "x-api-key": instance.api_key,
                }
                _ = requests.patch(
                    f"{license_engine_base_url}/api/instances/",
                    headers=headers,
                    data=json.dumps({"is_setup_done": True}),
                )

                # Also register the user as admin
                _ = requests.post(
                    f"{license_engine_base_url}/api/instances/users/register/",
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

                access_token, refresh_token = get_tokens_for_user(user)
                data = {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                }

                return Response(data, status=status.HTTP_200_OK)

            else:
                return Response(
                    {"error": "Your login code was incorrect. Please try again."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        else:
            return Response(
                {"error": "The magic code/link has expired please try again"},
                status=status.HTTP_400_BAD_REQUEST,
            )


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

        license_engine_base_url = os.environ.get("LICENSE_ENGINE_BASE_URL", False)

        if not license_engine_base_url:
            return Response(
                {"error": "License engine base url is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        headers = {
            "Content-Type": "application/json",
            "x-instance-id": instance.instance_id,
            "x-api-key": instance.api_key,
        }

        payload = {"is_signup_screen_visited": True}
        response = requests.patch(
            f"{license_engine_base_url}/api/instances/",
            headers=headers,
            data=json.dumps(payload),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
