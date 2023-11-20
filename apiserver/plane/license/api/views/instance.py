# Python imports
import json
import os
import requests

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views import BaseAPIView
from plane.license.models import Instance, InstanceAdmin, InstanceConfiguration
from plane.license.api.serializers import (
    InstanceSerializer,
    InstanceAdminSerializer,
    InstanceConfigurationSerializer,
)
from plane.license.api.permissions import (
    InstanceOwnerPermission,
    InstanceAdminPermission,
)
from plane.db.models import User


class InstanceEndpoint(BaseAPIView):
    def get_permissions(self):
        if self.request.method in ["POST", "PATCH"]:
            self.permission_classes = [
                InstanceOwnerPermission,
            ]
        else:
            self.permission_classes = [
                InstanceAdminPermission,
            ]
        return super(InstanceEndpoint, self).get_permissions()

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
                "email": request.user.email,
                "version": data.get("version", 0.1),
            }

            response = requests.post(
                f"{license_engine_base_url}/api/instances",
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
                    primary_email=data.get("email"),
                    primary_owner=request.user,
                    last_checked_at=timezone.now(),
                )
                # Create instance admin
                _ = InstanceAdmin.objects.create(
                    user=request.user,
                    instance=instance,
                    role=20,
                )

                return Response(
                    {
                        "message": f"Instance succesfully registered with owner: {instance.primary_owner.email}"
                    },
                    status=status.HTTP_201_CREATED,
                )
            return Response(
                {"error": "Instance could not be registered"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        else:
            return Response(
                {
                    "message": f"Instance already registered with instance owner: {instance.primary_owner.email}"
                },
                status=status.HTTP_200_OK,
            )

    def get(self, request):
        instance = Instance.objects.first()
        # get the instance
        if instance is None:
            return Response({"activated": False}, status=status.HTTP_400_BAD_REQUEST)
        # Return instance
        serializer = InstanceSerializer(instance)
        serializer.data["activated"] = True
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        # Get the instance
        instance = Instance.objects.first()
        serializer = InstanceSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TransferPrimaryOwnerEndpoint(BaseAPIView):
    permission_classes = [
        InstanceOwnerPermission,
    ]

    # Transfer the owner of the instance
    def post(self, request):
        instance = Instance.objects.first()

        # Get the email of the new user
        email = request.data.get("email", False)
        if not email:
            return Response(
                {"error": "User is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get users
        user = User.objects.get(email=email)

        # Save the instance user
        instance.primary_owner = user
        instance.primary_email = user.email
        instance.save(update_fields=["owner", "email"])

        # Add the user to admin
        _ = InstanceAdmin.objects.get_or_create(
            instance=instance,
            user=user,
            role=20,
        )

        return Response(
            {"message": "Owner successfully updated"}, status=status.HTTP_200_OK
        )


class InstanceAdminEndpoint(BaseAPIView):
    def get_permissions(self):
        if self.request.method in ["POST", "DELETE"]:
            self.permission_classes = [
                InstanceOwnerPermission,
            ]
        else:
            self.permission_classes = [
                InstanceAdminPermission,
            ]
        return super(InstanceAdminEndpoint, self).get_permissions()

    # Create an instance admin
    def post(self, request):
        email = request.data.get("email", False)
        role = request.data.get("role", 15)

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
        configurations = InstanceConfiguration.objects.filter(key__in=request.data.keys())

        bulk_configurations = []
        for configuration in configurations:
            configuration.value = request.data.get(configuration.key, configuration.value)
            bulk_configurations.append(configuration)

        InstanceConfiguration.objects.bulk_update(
            bulk_configurations,
            ["value"],
            batch_size=100
        )

        serializer = InstanceConfigurationSerializer(configurations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
