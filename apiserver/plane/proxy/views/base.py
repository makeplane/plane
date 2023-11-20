# Python imports
import re
import json
import requests

# Django imports
from django.conf import settings

# Third party imports
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

# Module imports
from plane.authentication.api_authentication import APIKeyAuthentication
from plane.proxy.rate_limit import ApiKeyRateThrottle


class BaseAPIView(APIView):
    authentication_classes = [
        APIKeyAuthentication,
    ]

    permission_classes = [
        IsAuthenticated,
    ]

    throttle_classes = [
        ApiKeyRateThrottle,
    ]

    def _get_jwt_token(self, request):
        refresh = RefreshToken.for_user(request.user)
        return str(refresh.access_token)

    def _get_url_path(self, request):
        match = re.search(r"/v1/(.*)", request.path)
        return match.group(1) if match else ""

    def _get_headers(self, request):
        return {
            "Authorization": f"Bearer {self._get_jwt_token(request=request)}",
            "Content-Type": request.headers.get("Content-Type", "application/json"),
        }

    def _get_url(self, request):
        path = self._get_url_path(request=request)
        url = request.build_absolute_uri("/api/" + path)
        return url

    def _get_query_params(self, request):
        query_params = request.GET
        return query_params

    def _get_payload(self, request):
        content_type = request.headers.get("Content-Type", "application/json")
        if content_type.startswith("multipart/form-data"):
            files_dict = {k: v[0] for k, v in request.FILES.lists()}
            return (None, files_dict)
        else:
            return (json.dumps(request.data), None)

    def _make_request(self, request, method="GET"):
        data_payload, files_payload = self._get_payload(request=request)
        response = requests.request(
            method=method,
            url=self._get_url(request=request),
            headers=self._get_headers(request=request),
            params=self._get_query_params(request=request),
            data=data_payload,
            files=files_payload,
        )
        return response.json(), response.status_code

    def finalize_response(self, request, response, *args, **kwargs):
        # Call super to get the default response
        response = super().finalize_response(request, response, *args, **kwargs)

        # Add custom headers if they exist in the request META
        ratelimit_remaining = request.META.get('X-RateLimit-Remaining')
        if ratelimit_remaining is not None:
            response['X-RateLimit-Remaining'] = ratelimit_remaining

        ratelimit_reset = request.META.get('X-RateLimit-Reset')
        if ratelimit_reset is not None:
            response['X-RateLimit-Reset'] = ratelimit_reset

        return response

    def get(self, request, *args, **kwargs):
        response, status_code = self._make_request(request=request, method="GET")
        return Response(response, status=status_code)

    def post(self, request, *args, **kwargs):
        response, status_code = self._make_request(request=request, method="POST")
        return Response(response, status=status_code)

    def partial_update(self, request, *args, **kwargs):
        response, status_code = self._make_request(request=request, method="PATCH")
        return Response(response, status=status_code)
