# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

# Module imports
from plane.api.views import BaseAPIView
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
        if self.request.method == "GET":
            self.permission_classes = [
                AllowAny,
            ]
        else:
            self.permission_classes = [
                InstanceOwnerPermission,
            ]
        return super(InstanceEndpoint, self).get_permissions()

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
        key = request.data.get("key", False)
        if not key:
            return Response(
                {"error": "Key is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        configuration = InstanceConfiguration.objects.get(key=key)
        configuration.value = request.data.get("value")
        configuration.save()
        serializer = InstanceConfigurationSerializer(configuration)
        return Response(serializer.data, status=status.HTTP_200_OK)
