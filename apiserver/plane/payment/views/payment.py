# Python imports
import requests

# Django imports
from django.conf import settings
from django.db.models import F

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.app.permissions.workspace import WorkSpaceAdminPermission
from plane.db.models import WorkspaceMember, Workspace


class PaymentLinkEndpoint(BaseAPIView):

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def post(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)
            workspace_members = (
                WorkspaceMember.objects.filter(
                    workspace__slug=slug, is_active=True, member__is_bot=False
                )
                .annotate(
                    user_email=F("member__email"), user_id=F("member__id")
                )
                .values("user_email", "user_id")
            )

            for member in workspace_members:
                member["user_id"] = str(member["user_id"])

            product_id = request.data.get("product_id", False)
            price_id = request.data.get("price_id", False)

            if not product_id or not price_id:
                return Response(
                    {"error": "product_id and price_id are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if settings.PAYMENT_SERVER_BASE_URL:
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/payment-link/",
                    json={
                        "workspace_id": str(workspace.id),
                        "stripe_product_id": product_id,
                        "stripe_price_id": price_id,
                        "customer_email": request.user.email,
                        "members_list": list(workspace_members),
                    },
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
