# Python imports
import requests

# Django imports
from django.conf import settings

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.app.permissions.workspace import WorkspaceEntityPermission
from plane.db.models import WorkspaceMember


class ProductEndpoint(BaseAPIView):

    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get(self, request, slug):
        try:
            if settings.PAYMENT_SERVER_BASE_URL:

                count = WorkspaceMember.objects.filter(
                    workspace__slug=slug
                ).count()

                response = requests.get(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/products/?quantity={count}",
                    headers={"content-type": "application/json"},
                )
                response = response.json()
                return Response(response, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "error fetching product details"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except requests.exceptions.RequestException:
            return Response(
                {"error": "error fetching product details"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PaymentLinkEndpoint(BaseAPIView):

    def post(self, request):
        try:
            if settings.PAYMENT_SERVER_BASE_URL:
                data = request.data
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/payment-links/",
                    json=data,
                    headers={"content-type": "application/json"},
                )
                response = response.json()
                return Response(response, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "error fetching payment link"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except requests.exceptions.RequestException:
            return Response(
                {"error": "error fetching payment link"},
                status=status.HTTP_400_BAD_REQUEST,
            )
