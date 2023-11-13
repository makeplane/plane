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

# Module imports
from plane.api.views import BaseAPIView
from plane.license.models import Instance
from plane.license.api.serializers import InstanceSerializer
from plane.db.models import User


class InstanceEndpoint(BaseAPIView):

    def get(self, request):
        instance = Instance.objects.first()
        # get the instance
        if instance is None:
            return Response({"activated": False}, status=status.HTTP_400_BAD_REQUEST)
        # Check the accessing user
        if str(request.user.id) != str(instance.owner_id):
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        # Return instance
        serializer = InstanceSerializer(instance)
        data = {
            "data": serializer.data,
            "activated": True,
        }
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request):
        # Get the instance
        instance = Instance.objects.first()
        # Check the accessing user
        if instance is not None and str(request.user.id) != str(instance.owner_id):
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        serializer = InstanceSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TransferOwnerEndpoint(BaseAPIView):

    # Transfer the owner of the instance
    def post(self, request):
        instance = Instance.objects.first()

        # Check the accessing user
        if instance is not None and str(request.user.id) != str(instance.owner_id):
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        # Get the email of the new user
        email = request.data.get("email", False)
        if not email:
            return Response(
                {"error": "User is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get users
        user = User.objects.get(email=email)
        user.is_superuser = True
        user.save(update_fields=["is_superuser"])

        # Save the instance user
        instance.owner = user
        instance.email = user.email
        instance.save(update_fields=["owner", "email"])

        return Response(
            {"message": "Owner successfully updated"}, status=status.HTTP_200_OK
        )
