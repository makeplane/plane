# Python imports
import requests

# Django imports
from django.conf import settings

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView


class ProductEndpoint(BaseAPIView):

    def get(self, request):
        try:
            if settings.PAYMENT_SERVER_BASE_URL:
                quantity = request.GET.get("quantity", 1)
                response = requests.get(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/products/?quantity={quantity}",
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
