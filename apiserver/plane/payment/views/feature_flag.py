# Python imports
import requests

# Django imports
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny

# Module imports
from plane.payment.views.base import BaseAPIView
from plane.db.models import DeployBoard
from plane.utils.exception_logger import log_exception
from plane.space.rate_limit import AnchorBasedRateThrottle, SpaceRateThrottle


class FeatureFlagProxyEndpoint(BaseAPIView):

    @method_decorator(cache_page(60))  # cache the response for 1 minute
    def get(self, request, slug):
        try:
            url = f"{settings.FEATURE_FLAG_SERVER_BASE_URL}/api/feature-flags/"
            json = {"workspace_slug": slug, "user_id": str(request.user.id)}
            headers = {
                "content-type": "application/json",
                "x-api-key": settings.FEATURE_FLAG_SERVER_AUTH_TOKEN,
            }
            response = requests.post(url, json=json, headers=headers)
            response.raise_for_status()
            return JsonResponse(response.json(), status=response.status_code)
        except requests.exceptions.RequestException as e:
            if hasattr(e, "response") and e.response.status_code == 400:
                return JsonResponse(e.response.json(), status=e.response.status_code)
            log_exception(e)
            return JsonResponse(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class FeatureFlagProxySpaceEndpoint(BaseAPIView):
    """
    This view is used to proxy the feature flag server endpoint for the
    publish features
    """

    permission_classes = [
        AllowAny,
    ]

    throttle_classes = [
        SpaceRateThrottle,
        AnchorBasedRateThrottle,
    ]

    @method_decorator(cache_page(60))  # cache the response for 1 minute
    def get(self, request, anchor):
        try:
            flag_key = request.query_params.get("flag_key")
            if not flag_key:
                return JsonResponse(
                    {"error": "flag_key is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            deploy_board = DeployBoard.objects.get(anchor=anchor)
            workspace_slug = deploy_board.workspace.slug
            url = f"{settings.FEATURE_FLAG_SERVER_BASE_URL}/api/feature-flags/"
            json = {"workspace_slug": workspace_slug, "flag_key": flag_key}
            headers = {
                "content-type": "application/json",
                "x-api-key": settings.FEATURE_FLAG_SERVER_AUTH_TOKEN,
            }
            response = requests.post(url, json=json, headers=headers)
            response.raise_for_status()
            return JsonResponse(response.json(), status=response.status_code)
        except requests.exceptions.RequestException as e:
            if hasattr(e, "response") and e.response.status_code == 400:
                return JsonResponse(e.response.json(), status=e.response.status_code)
            log_exception(e)
            return JsonResponse(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
